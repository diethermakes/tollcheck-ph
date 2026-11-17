// ---- settings you can change ----
const ROUTERS=[ // OSRM-compatible routing servers, tried in order
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/"
];
const GEOCODER="https://photon.komoot.io/api/";
const PH_BBOX="116.9,4.5,126.7,21.3";

const $=id=>document.getElementById(id);
const map=L.map("map").setView([14.9,120.9],8);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
const layer=L.layerGroup().addTo(map);
const PT={from:null,to:null}; // {lat,lng,label}
let LEGS=[], ROUTES=[], ENDS=null;
const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// ---- place search ----
async function geocode(q,limit=5){
  const r=await fetch(`${GEOCODER}?q=${encodeURIComponent(q)}&limit=${limit}&bbox=${PH_BBOX}&lang=en`);
  const j=await r.json();
  return (j.features||[]).map(f=>{
    const p=f.properties, sub=[p.street,p.district,p.city,p.county,p.state].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(", ");
    return {lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],label:p.name||sub,sub};
  });
}
function wireSearch(which){
  const inp=$(which), box=$(which+"S"); let t;
  inp.addEventListener("input",()=>{
    PT[which]=null; clearTimeout(t);
    const q=inp.value.trim(); if(q.length<3){box.hidden=true;return;}
    t=setTimeout(async()=>{
      try{
        const res=await geocode(q);
        box.innerHTML=""; 
        res.forEach(p=>{
          const b=document.createElement("button"); b.type="button";
          b.textContent=p.label; const s=document.createElement("small"); s.textContent=p.sub; b.appendChild(s);
          b.onclick=()=>{PT[which]=p;inp.value=p.label;box.hidden=true;};
          box.appendChild(b);
        });
        box.hidden=!res.length;
      }catch(e){box.hidden=true;}
    },350);
  });
  inp.addEventListener("blur",()=>setTimeout(()=>box.hidden=true,200));
}
wireSearch("from"); wireSearch("to");

$("me").onclick=()=>{
  if(!navigator.geolocation) return note("Your browser doesn't share location. Type your starting point instead.",true);
  navigator.geolocation.getCurrentPosition(p=>{
    PT.from={lat:p.coords.latitude,lng:p.coords.longitude,label:"My location"}; $("from").value="My location";
  },()=>note("Location permission was not given. Type your starting point instead.",true));
};
function note(t,err){ const d=document.createElement("div"); d.className="notice"+(err?" err":""); d.textContent=t; $("msg").replaceChildren(d); }

// ---- routing ----
async function resolvePoint(which){
  if(PT[which]) return PT[which];
  const q=$(which).value.trim(); if(!q) throw new Error(which==="from"?"Add a starting point.":"Add a destination.");
  const m=q.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if(m) return PT[which]={lat:+m[1],lng:+m[2],label:q};
  const res=await geocode(q,1); if(!res.length) throw new Error(`Couldn't find "${q}". Try a nearby city or landmark.`);
  return PT[which]=res[0];
}
async function getRoutes(a,b){
  const path=`${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&steps=true&alternatives=3`;
  for(const base of ROUTERS){
    try{ const r=await fetch(base+path); if(!r.ok) continue; const j=await r.json(); if(j.routes&&j.routes.length) return j.routes; }catch(e){}
  }
  throw new Error("The routing service is busy right now. Please try again in a moment.");
}
const tollOf=legs=>legs.reduce((s,l)=>s+(fare(...l)||0),0);
const dur=sec=>{const m=Math.round(sec/60);return (Math.floor(m/60)?Math.floor(m/60)+" hr ":"")+(m%60)+" min";};
$("go").onclick=run;
async function run(){
  const btn=$("go"); btn.disabled=true; note("Finding your route…");
  try{
    const a=await resolvePoint("from"), b=await resolvePoint("to");
    $("from").value=a.label; $("to").value=b.label;
    const routes=await getRoutes(a,b);
    ROUTES=routes.map(r=>({r,legs:detectLegs(r)}));
    ENDS={a,b};
    showRoute(0);
  }catch(e){ note(e.message,true); $("routes").hidden=true; }
  btn.disabled=false;
}
function showRoute(i){
  const {r:route,legs}=ROUTES[i], {a,b}=ENDS;
  layer.clearLayers();
  ROUTES.forEach((x,j)=>{ if(j!==i) L.geoJSON(x.r.geometry,{style:{color:"#7a8a80",weight:4,opacity:.6}}).addTo(layer); });
  const line=L.geoJSON(route.geometry,{style:{color:"#0a5c3e",weight:5,opacity:.9}}).addTo(layer);
  L.marker([a.lat,a.lng]).addTo(layer).bindPopup("Start: "+esc(a.label));
  L.marker([b.lat,b.lng]).addTo(layer).bindPopup("Destination: "+esc(b.label));
  map.fitBounds(line.getBounds(),{padding:[30,30]});
  LEGS=legs.map(l=>[...l]);
  LEGS.forEach(([k,p1,p2])=>[[p1,"Enter"],[p2,"Exit"]].forEach(([p,w])=>{
    L.circleMarker(PLAZAS[k][p],{radius:8,color:"#2a2100",fillColor:"#f2b705",fillOpacity:1,weight:2}).addTo(layer).bindPopup(esc(`${w}: ${p} (${EXP[k].name})`));
  }));
  note(`${Math.round(route.distance/1000)} km, about ${dur(route.duration)} without traffic. ${LEGS.length?"Toll plazas are marked in yellow on the map.":"This route doesn't use any tolled expressway."}`);
  const box=$("routes"); box.hidden=ROUTES.length<2; box.replaceChildren();
  if(ROUTES.length>1){
    const h=document.createElement("p"); h.className="hint"; h.textContent="Route options. Pick the one that matches your Google Maps or Waze route."; box.appendChild(h);
    ROUTES.forEach((x,j)=>{
      const bt=document.createElement("button"); bt.type="button"; bt.className="opt"+(j===i?" on":"");
      const roads=[...new Set(x.legs.map(l=>EXP[l[0]].name))].join(", ")||"No toll roads";
      bt.textContent=`${Math.round(x.r.distance/1000)} km, ${dur(x.r.duration)}, ${peso(tollOf(x.legs))} toll. ${roads}`;
      bt.onclick=()=>showRoute(j); box.appendChild(bt);
    });
  }
  $("handoff").innerHTML=`<a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&origin=${+a.lat},${+a.lng}&destination=${+b.lat},${+b.lng}&travelmode=driving">Open in Google Maps</a><a target="_blank" rel="noopener noreferrer" href="https://waze.com/ul?ll=${+b.lat},${+b.lng}&navigate=yes">Open in Waze</a>`;
  renderLegs();
}

// ---- Google Maps link ----
$("useLink").onclick=async()=>{
  let t=($("link").value.match(/https?:\/\/\S+/)||[])[0];
  if(!t) return note("Paste a Google Maps link first.",true);
  note("Opening your Google Maps link…");
  try{
    if(/goo\.gl/i.test(t)){
      const r=await fetch("/api/resolve?url="+encodeURIComponent(t)); const j=await r.json();
      if(!r.ok||!j.url) throw new Error(j.error||"Couldn't open that link.");
      t=j.url;
    }
    const u=new URL(t), sp=u.searchParams; let o="",d="";
    const m=u.pathname.match(/\/maps\/dir\/(.+)/);
    if(m){ const parts=m[1].split("/").filter(x=>x&&!x.startsWith("@")&&!x.startsWith("data=")).map(x=>decodeURIComponent(x.replace(/\+/g," "))); o=parts[0]||""; d=parts.length>1?parts[parts.length-1]:""; }
    else { o=sp.get("origin")||sp.get("saddr")||""; d=sp.get("destination")||sp.get("daddr")||sp.get("q")||""; 
      const pm=u.pathname.match(/\/maps\/place\/([^/]+)/); if(!d&&pm) d=decodeURIComponent(pm[1].replace(/\+/g," ")); }
    if(!d) throw new Error("That link has no destination in it. Type the destination instead.");
    PT.to=null; $("to").value=d;
    if(o){ PT.from=null; $("from").value=o; }
    if(!$("from").value.trim()) return note("Destination added. Now add your starting point or tap Use my location.");
    run();
  }catch(e){ note(e.message+" You can type the trip in the From and To boxes instead.",true); }
};

// ---- toll ticket ----
const peso=n=>"₱"+Math.round(n).toLocaleString("en-PH");
function calc(){
  const c=+$("cls").value, mult=CLS[c]; let sum=0,bad=0;
  $("lines").innerHTML=LEGS.map(([k,a,b])=>{
    const f=fare(k,a,b);
    if(f===null){bad++;return `<div class="line"><div><div class="what">${a} to ${b}</div><div class="meta">${EXP[k].name}. No rate listed for this pair. Adjust the plazas below.</div></div><div class="amt">n/a</div></div>`;}
    sum+=f*mult;
    return `<div class="line"><div><div class="what">${a} to ${b}</div><div class="meta">${EXP[k].name}, pay with ${EXP[k].rfid}</div></div><div class="amt">${f===0?"Free":peso(f*mult)}</div></div>`;
  }).join("");
  $("total").textContent=peso(sum);
  $("tlabel").textContent=c===1?"Total toll, Class 1":`Estimated total toll, Class ${c}`;
  const rf=[...new Set(LEGS.map(l=>EXP[l[0]].rfid))];
  $("tsub").textContent=LEGS.length?`${LEGS.length} expressway ${LEGS.length>1?"legs":"leg"}. RFID needed: ${rf.join(" and ")}.${bad?" Some legs could not be priced.":""}`:"No toll on this trip yet.";
}
function renderLegs(){
  $("legs").innerHTML=LEGS.length?LEGS.map((l,i)=>{
    const e=EXP[l[0]], opt=(v,s)=>`<option${v===s?" selected":""}>${v}</option>`;
    return `<div class="leg" data-i="${i}">
      <div class="exp"><small>Expressway</small><select data-f="0">${Object.keys(EXP).map(k=>`<option value="${k}"${k===l[0]?" selected":""}>${EXP[k].name}</option>`).join("")}</select></div>
      <div><small>Entrance</small><select data-f="1">${e.plazas.map(p=>opt(p,l[1])).join("")}</select></div>
      <div><small>Exit</small><select data-f="2">${e.plazas.map(p=>opt(p,l[2])).join("")}</select></div>
      <button class="x" data-del="${i}">Remove this leg</button></div>`;
  }).join(""):'<p class="hint">No toll legs yet.</p>';
  calc();
}
$("legs").addEventListener("change",ev=>{
  const s=ev.target; if(!s.dataset.f) return;
  const i=+s.closest(".leg").dataset.i, f=+s.dataset.f; LEGS[i][f]=s.value;
  if(f===0){const p=EXP[s.value].plazas;LEGS[i][1]=p[0];LEGS[i][2]=p[p.length-1];}
  renderLegs();
});
$("legs").addEventListener("click",ev=>{const d=ev.target.dataset.del; if(d!==undefined){LEGS.splice(+d,1);renderLegs();}});
$("add").onclick=()=>{LEGS.push(["NLEX","Balintawak","Dau"]);renderLegs();};
$("cls").onchange=calc;
renderLegs();
