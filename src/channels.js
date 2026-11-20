const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const encoder=new TextEncoder();
const bytes=n=>{const out=new Uint8Array(n);crypto.getRandomValues(out);return out};
const b64=b=>{let s="";for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")};
const un64=s=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
const digest=async s=>b64(new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(s))));
const randomKey=()=>"strm_"+b64(bytes(32));
async function encryptionKey(env){const value=env.STREAM_KEY_ENCRYPTION_KEY;if(!value)throw new Error("STREAM_KEY_ENCRYPTION_KEY is missing");const raw=Uint8Array.from(atob(value),c=>c.charCodeAt(0));if(raw.length!==32)throw new Error("STREAM_KEY_ENCRYPTION_KEY must contain 32 bytes");return crypto.subtle.importKey("raw",raw,{name:"AES-GCM"},false,["encrypt","decrypt"])}
async function encryptSecret(secret,env){const iv=bytes(12),key=await encryptionKey(env);const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,encoder.encode(secret));return{iv:b64(iv),ciphertext:b64(new Uint8Array(encrypted))}}
async function decryptSecret(row,env){const key=await encryptionKey(env);const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:un64(row.stream_key_iv)},key,un64(row.stream_key_ciphertext));return new TextDecoder().decode(plain)}
const channelView=row=>({id:row.id,name:row.name,slug:row.slug,description:row.description,createdAt:row.created_at,updatedAt:row.updated_at});
export async function handleChannels(req,env,user){
const p=new URL(req.url).pathname;
if(p==="/api/channels"){
 if(req.method==="GET"){
  const result=await env.DB.prepare("SELECT id,name,slug,description,created_at,updated_at FROM channels WHERE owner_id=? ORDER BY created_at DESC").bind(user.id).all();
  return json({ok:true,channels:result.results.map(channelView)});
 }
 if(req.method!=="POST")return json({error:"Метод не поддерживается."},405);
 let body;try{body=await req.json()}catch{return json({error:"Некорректный JSON."},400)}
 const name=String(body.name||"").trim(),slug=String(body.slug||"").trim().toLowerCase(),description=String(body.description||"").trim();
 if(name.length<2||name.length>60)return json({error:"Название должно содержать от 2 до 60 символов."},400);
 if(!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug))return json({error:"Адрес канала должен содержать 3–40 символов: латинские буквы, цифры и дефисы."},400);
 if(description.length>300)return json({error:"Описание не должно превышать 300 символов."},400);
 if(!env.STREAM_KEY_ENCRYPTION_KEY)return json({error:"Шифрование ключей не настроено."},503);
 const streamKey=randomKey(),secret=await encryptSecret(streamKey,env),id=crypto.randomUUID(),now=Math.floor(Date.now()/1000);
 try{await env.DB.prepare("INSERT INTO channels(id,owner_id,name,slug,description,stream_key_hash,stream_key_iv,stream_key_ciphertext,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(id,user.id,name,slug,description,await digest(streamKey),secret.iv,secret.ciphertext,now,now).run()}catch(error){if(String(error).includes("UNIQUE"))return json({error:"Этот адрес канала уже занят."},409);throw error}
 return json({ok:true,channel:channelView({id,name,slug,description,created_at:now,updated_at:now}),streamKey},201);
}
const match=p.match(/^\/api\/channels\/([0-9a-f-]{36})\/key(\/reset)?$/i);
if(!match)return json({error:"Маршрут не найден."},404);
const channelId=match[1],isReset=Boolean(match[2]);
if((isReset&&req.method!=="POST")||(!isReset&&req.method!=="GET"))return json({error:"Метод не поддерживается."},405);
const row=await env.DB.prepare("SELECT id,owner_id,name,slug,description,stream_key_hash,stream_key_iv,stream_key_ciphertext,created_at,updated_at FROM channels WHERE id=? AND owner_id=?").bind(channelId,user.id).first();
if(!row)return json({error:"Канал не найден."},404);
if(!env.STREAM_KEY_ENCRYPTION_KEY)return json({error:"Шифрование ключей не настроено."},503);
if(isReset){
 const streamKey=randomKey(),secret=await encryptSecret(streamKey,env),now=Math.floor(Date.now()/1000);
 await env.DB.prepare("UPDATE channels SET stream_key_hash=?,stream_key_iv=?,stream_key_ciphertext=?,updated_at=? WHERE id=? AND owner_id=?").bind(await digest(streamKey),secret.iv,secret.ciphertext,now,channelId,user.id).run();
 return json({ok:true,streamKey});
}
return json({ok:true,streamKey:await decryptSecret(row,env)});
}
