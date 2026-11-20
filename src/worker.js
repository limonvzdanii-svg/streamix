import { handleChannels } from "./channels.js";
const COOKIE_HOST="__Host-streamix_session", COOKIE_LOCAL="streamix_session", TTL=2592000, ITERATIONS=100000;
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});
const bytes=n=>{const b=new Uint8Array(n);crypto.getRandomValues(b);return b};
const b64=b=>{let s="";for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")};
const un64=s=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
const digest=async s=>b64(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s))));
async function derive(password,salt){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);return new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:ITERATIONS},key,256))}
async function record(password){const salt=bytes(16);return{salt:b64(salt),hash:b64(await derive(password,salt))}}
function equal(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a[i]^b[i];return d===0}
const cookies=h=>Object.fromEntries(h.split(";").map(p=>{const i=p.indexOf("=");return i<0?["",""]:[p.slice(0,i).trim(),p.slice(i+1).trim()]}).filter(x=>x[0]));
const cookieName=req=>["localhost","127.0.0.1"].includes(new URL(req.url).hostname)?COOKIE_LOCAL:COOKIE_HOST; const setCookie=(t,req)=>`${cookieName(req)}=${t}; Path=/; HttpOnly; ${cookieName(req)===COOKIE_HOST?"Secure; ":""}SameSite=Lax; Max-Age=${TTL}`;
async function userFor(req,env){const t=cookies(req.headers.get("Cookie")||"")[cookieName(req)];if(!t)return null;return await env.DB.prepare("SELECT users.id, users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?").bind(await digest(t),Math.floor(Date.now()/1000)).first()}
async function session(id,env){const t=b64(bytes(32)),now=Math.floor(Date.now()/1000);await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)").bind(await digest(t),id,now+TTL,now).run();return t}
async function api(req,env){const u=new URL(req.url),p=u.pathname;
if(req.method==="GET"&&p==="/api/health")return json({ok:true});
if(req.method==="POST"){const origin=req.headers.get("Origin");if(origin&&origin!==u.origin)return json({error:"Недопустимый источник запроса."},403)}
if(p==="/api/channels"||p.startsWith("/api/channels/")){const user=await userFor(req,env);if(!user)return json({error:"\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u044f."},401);return await handleChannels(req,env,user)}if(req.method==="GET"&&p==="/api/me"){const user=await userFor(req,env);return json({authenticated:!!user,user:user?{id:user.id,email:user.email}:null})}
if(req.method==="POST"&&(p==="/api/register"||p==="/api/login")){let body;try{body=await req.json()}catch{return json({error:"Некорректный запрос."},400)}
const email=String(body.email||"").trim().toLowerCase(),password=String(body.password||"");
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return json({error:"Укажи корректную электронную почту."},400);
if(password.length<8||password.length>128)return json({error:"Пароль должен содержать от 8 до 128 символов."},400);
if(p==="/api/register"){const r=await record(password),id=crypto.randomUUID(),now=Math.floor(Date.now()/1000);try{await env.DB.prepare("INSERT INTO users(id,email,password_salt,password_hash,created_at) VALUES(?,?,?,?,?)").bind(id,email,r.salt,r.hash,now).run()}catch(e){if(String(e).includes("UNIQUE"))return json({error:"Аккаунт с такой почтой уже существует."},409);throw e}const t=await session(id,env);return json({ok:true,user:{id,email}},201,{"set-cookie":setCookie(t,req)})}
const user=await env.DB.prepare("SELECT id,email,password_salt,password_hash FROM users WHERE email=?").bind(email).first();if(!user||!equal(await derive(password,un64(user.password_salt)),un64(user.password_hash)))return json({error:"Неверная почта или пароль."},401);const t=await session(user.id,env);return json({ok:true,user:{id:user.id,email:user.email}},200,{"set-cookie":setCookie(t,req)})}
if(req.method==="POST"&&p==="/api/logout"){const t=cookies(req.headers.get("Cookie")||"")[cookieName(req)];if(t)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await digest(t)).run();return json({ok:true},200,{"set-cookie":setCookie("",req)+"; Max-Age=0"})}
return json({error:"Маршрут не найден."},404)}
export default{async fetch(req,env){try{const u=new URL(req.url);if(u.pathname.startsWith("/api/"))return await api(req,env);return env.ASSETS.fetch(req)}catch(e){console.error("STREAMIX API error",e);return json({error:"Внутренняя ошибка сервера."},500)}}};
