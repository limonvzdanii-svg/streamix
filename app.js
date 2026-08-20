const streams = [

{
id:1,
channel:"livenet",
name:"LiveNet",
title:"LiveNet — прямой эфир 🔴",
category:"Just Chatting",
viewers:12480,
avatar:"L",
color:"purple",
image:"https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1000&q=80"
},

{
id:2,
channel:"bobrdobrenok",
name:"BobrDobrenok",
title:"Minecraft survival — строим новый дом!",
category:"Minecraft",
viewers:8270,
avatar:"B",
color:"blue",
image:"https://images.unsplash.com/photo-1607513746994-51f730a31a7b?auto=format&fit=crop&w=1000&q=80"
},

{
id:3,
channel:"corevision",
name:"CoreVision",
title:"EUROVISION MUSIC NIGHT 🎤",
category:"Music",
viewers:6130,
avatar:"C",
color:"pink",
image:"https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1000&q=80"
},

{
id:4,
channel:"techalex",
name:"TechAlex",
title:"Собираю новый ПК",
category:"Technology",
viewers:4280,
avatar:"T",
color:"green",
image:"https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1000&q=80"
},

{
id:5,
channel:"pixelworld",
name:"PixelWorld",
title:"Большой игровой вечер 🎮",
category:"Gaming",
viewers:3190,
avatar:"P",
color:"orange",
image:"https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80"
},

{
id:6,
channel:"musicbox",
name:"MusicBox",
title:"Relax music + chat 🎵",
category:"Music",
viewers:2710,
avatar:"M",
color:"pink",
image:"https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=80"
}

];

const categories = [

{
name:"Just Chatting",
viewers:"124K",
image:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80"
},

{
name:"Gaming",
viewers:"92K",
image:"https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=500&q=80"
},

{
name:"Music",
viewers:"61K",
image:"https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=500&q=80"
},

{
name:"Technology",
viewers:"42K",
image:"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80"
}

];

let following =
JSON.parse(localStorage.getItem("streamix_following") || "[]");

function renderStreams(list = streams) {

const grid =
document.getElementById("streamGrid");

if(!grid) return;

grid.innerHTML = "";

list.forEach(stream => {

const card =
document.createElement("article");

card.className = "stream-card";

card.innerHTML = `

<div class="thumbnail">

<img src="${stream.image}" loading="lazy">

<div class="live">LIVE</div>

<div class="viewers">
🔴 ${formatNumber(stream.viewers)}
</div>

</div>

<div class="stream-info">

<div class="avatar ${stream.color}">
${stream.avatar}
</div>

<div>

<h3>${stream.title}</h3>

<p>${stream.name}</p>

<small>${stream.category}</small>

</div>

</div>

`;

card.onclick = () =>
openChannel(stream.channel);

grid.appendChild(card);

});

}

function renderCategories() {

const grid =
document.getElementById("categoryGrid");

if(!grid) return;

grid.innerHTML = "";

categories.forEach(category => {

const card =
document.createElement("div");

card.className =
"category-card";

card.innerHTML = `

<img src="${category.image}">

<h3>${category.name}</h3>

<p>${category.viewers} зрителей</p>

`;

grid.appendChild(card);

});

}

function renderChannels() {

const grid =
document.getElementById("channelGrid");

if(!grid) return;

grid.innerHTML = "";

streams.forEach(stream => {

const card =
document.createElement("div");

card.className =
"channel-card";

card.innerHTML = `

<div class="channel-banner"
style="background-image:url('${stream.image}')">

</div>

<div class="channel-card-info">

<div class="big-avatar ${stream.color}">
${stream.avatar}
</div>

<div>

<h3>${stream.name}</h3>

<p>${stream.category}</p>

</div>

</div>

`;

card.onclick = () =>
openChannel(stream.channel);

grid.appendChild(card);

});

}

function renderFollowing() {

const box =
document.getElementById("following");

if(!box) return;

box.innerHTML = "";

const list =
streams.filter(x =>
following.includes(x.channel)
);

if(!list.length) {

box.innerHTML = `
<p class="empty-following">
Подпишись на каналы,<br>
чтобы видеть их здесь.
</p>
`;

return;

}

list.forEach(stream => {

const item =
document.createElement("div");

item.className =
"side-channel";

item.innerHTML = `

<div class="avatar ${stream.color}">
${stream.avatar}
</div>

<div>

<b>${stream.name}</b>
<small>${stream.category}</small>

</div>

<i></i>
`;

item.onclick = () =>
openChannel(stream.channel);

box.appendChild(item);

});

}

function openChannel(channel) {

location.href =
"channel.html?channel=" +
encodeURIComponent(channel);

}

function performSearch() {

const input =
document.getElementById("search");

const query =
input.value.toLowerCase().trim();

if(!query) {

renderStreams();

return;

}

const result =
streams.filter(stream =>

stream.name.toLowerCase().includes(query) ||
stream.title.toLowerCase().includes(query) ||
stream.category.toLowerCase().includes(query)

);

renderStreams(result);

document
.getElementById("streams")
.scrollIntoView({
behavior:"smooth"
});

}

function toggleChat() {

showToast(
"💬 Открой страницу канала для полного чата"
);

}

function showToast(text) {

const toast =
document.getElementById("toast");

toast.textContent = text;

toast.classList.add("show");

setTimeout(() => {

toast.classList.remove("show");

},2500);

}

function formatNumber(number) {

if(number >= 1000000)
return (number / 1000000).toFixed(1)+"M";

if(number >= 1000)
return (number / 1000).toFixed(1)+"K";

return number;

}

renderStreams();
renderCategories();
renderChannels();
renderFollowing();
