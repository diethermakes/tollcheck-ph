// ---- settings you can change ----
const ROUTERS=[ // OSRM-compatible routing servers, tried in order
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/"
];
const GEOCODER="https://photon.komoot.io/api/";
const PH_BBOX="116.9,4.5,126.7,21.3";

const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n;};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const peso=n=>"₱"+Math.round(n).toLocaleString("en-PH");
const dur=sec=>{const m=Math.round(sec/60);return (Math.floor(m/60)?Math.floor(m/60)+" hr ":"")+(m%60)+" min";};
const isPhone=()=>window.matchMedia("(max-width:760px)").matches;
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};

// ---- map ----
const map=L.map("map",{zoomControl:false}).setView([14.9,120.95],8);
L.control.zoom({position:"bottomright"}).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
const layer=L.layerGroup().addTo(map);
window.addEventListener("resize",()=>map.invalidateSize());
setTimeout(()=>map.invalidateSize(),300);
function fit(bounds){
  const p=$("panel");
  if(isPhone()) map.fitBounds(bounds,{paddingTopLeft:[24,70],paddingBottomRight:[24,Math.min(p.offsetHeight,window.innerHeight*0.5)+24]});
  else map.fitBounds(bounds,{paddingTopLeft:[p.offsetWidth+48,48],paddingBottomRight:[48,48]});
}

// ---- state ----
const PT={from:null,to:null};      // chosen places: {lat,lng,label,sub}
let ROUTES=[], ENDS=null, LEGS=[], SEL=0, VCLASS=1, SEARCHING=false, TRIP=0;

// ---- theme ----
$("themeBtn").onclick=()=>{
  const next=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
  document.documentElement.setAttribute("data-theme",next);
  try{localStorage.setItem("tc_theme",next);}catch(e){}
};

// ---- messages ----
function note(text,kind){
  const m=$("msg"); m.hidden=!text; m.className="msg"+(kind==="err"?" err":""); m.replaceChildren();
  if(kind==="busy") m.appendChild(el("span","spin"));
  m.appendChild(document.createTextNode(text||""));
}

// ---- place search ----
async function geocode(q,limit=6){
  const r=await fetch(`${GEOCODER}?q=${encodeURIComponent(q)}&limit=${limit}&bbox=${PH_BBOX}&lat=14.6&lon=121.0&lang=en`);
  if(!r.ok) throw new Error("search");
  const j=await r.json(), seen=new Set(), out=[];
  for(const f of j.features||[]){
    const p=f.properties, sub=[p.street,p.district,p.city,p.county,p.state].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i&&v!==p.name).join(", ");
    const label=p.name||sub, key=label+"|"+sub;
    if(!label||seen.has(key)) continue; seen.add(key);
    out.push({lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],label,sub});
  }
  return out;
}
function setPlace(which,p){
  PT[which]=p; const inp=$(which);
  inp.value=p?p.label:"";
  $(which+"Row").classList.toggle("set",!!p);
  $(which+"X").hidden=!inp.value;
}
let ACTIVE=null, RESULTS=[], HI=-1, timer=null, reqId=0;
function closeSugg(){ $("sugg").hidden=true; RESULTS=[]; HI=-1; }
function pick(i){
  const p=RESULTS[i]; if(!p||!ACTIVE) return;
  const which=ACTIVE; setPlace(which,p); closeSugg();
  if(which==="from" && !PT.to) $("to").focus();
  else { $(which).blur(); if(PT.from&&PT.to) run(); }
}
function renderSugg(state){
  const box=$("sugg"); box.replaceChildren(); box.hidden=false;
  if(state) return box.appendChild(el("div","note",state));
  RESULTS.forEach((p,i)=>{
    const b=el("button"); b.type="button"; if(i===HI) b.className="act";
    b.appendChild(el("b",null,p.label)); if(p.sub) b.appendChild(el("small",null,p.sub));
    // pointerdown fires before the input loses focus, so the tap always registers
    b.addEventListener("pointerdown",ev=>{ev.preventDefault(); pick(i);});
    box.appendChild(b);
  });
}
function wire(which){
  const inp=$(which);
  inp.addEventListener("focus",()=>{ ACTIVE=which; inp.select(); if(isPhone()) $("panel").classList.remove("peek"); });
  inp.addEventListener("input",()=>{
    ACTIVE=which; PT[which]=null; $(which+"Row").classList.remove("set"); $(which+"X").hidden=!inp.value;
    clearTimeout(timer); const q=inp.value.trim();
    if(q.length<3) return closeSugg();
    renderSugg("Searching…");
    timer=setTimeout(async()=>{
      const id=++reqId;
      try{ const res=await geocode(q); if(id!==reqId) return; RESULTS=res; HI=-1; renderSugg(res.length?null:"No places found. Try a city, mall or landmark."); }
      catch(e){ if(id===reqId) renderSugg("Search isn't responding. You can still tap Check toll."); }
    },300);
  });
  inp.addEventListener("keydown",ev=>{
    if(ev.key==="ArrowDown"||ev.key==="ArrowUp"){ if(!RESULTS.length) return; ev.preventDefault(); HI=(HI+(ev.key==="ArrowDown"?1:-1)+RESULTS.length)%RESULTS.length; renderSugg(); }
    else if(ev.key==="Enter"){ ev.preventDefault(); if(RESULTS.length) pick(HI<0?0:HI); else if(which==="from") $("to").focus(); else run(); }
    else if(ev.key==="Escape") closeSugg();
  });
  inp.addEventListener("blur",()=>setTimeout(()=>{ if(document.activeElement!==$("from")&&document.activeElement!==$("to")) closeSugg(); },150));
  $(which+"X").onclick=()=>{ setPlace(which,null); closeSugg(); inp.focus(); };
}
wire("from"); wire("to");

$("swap").onclick=()=>{
  const a=PT.from, b=PT.to, av=$("from").value, bv=$("to").value;
  setPlace("from",b); setPlace("to",a);
  if(!b){ $("from").value=bv; $("fromX").hidden=!bv; } if(!a){ $("to").value=av; $("toX").hidden=!av; }
  if(PT.from&&PT.to) run();
};
$("me").onclick=()=>{
  if(!navigator.geolocation) return note("This browser can't share your location. Type your starting point instead.","err");
  note("Getting your location…","busy");
  navigator.geolocation.getCurrentPosition(p=>{
    setPlace("from",{lat:p.coords.latitude,lng:p.coords.longitude,label:"My location",sub:""}); note("");
    if(PT.to) run(); else $("to").focus();
  },()=>note("Location is turned off for this site. Type your starting point instead.","err"),{enableHighAccuracy:true,timeout:10000});
};

// ---- routing ----
async function resolvePoint(which){
  if(PT[which]) return PT[which];
  const q=$(which).value.trim(); if(!q) throw new Error(which==="from"?"Add where you're starting from.":"Add where you're going.");
  const m=q.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  let p;
  if(m) p={lat:+m[1],lng:+m[2],label:"Pinned location",sub:q};
  else { const res=await geocode(q,1); if(!res.length) throw new Error(`Couldn't find "${q}". Try a nearby city or landmark.`); p=res[0]; }
  setPlace(which,p); return p;
}
async function getRoutes(a,b){
  const path=`${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&steps=true&alternatives=3`;
  for(const base of ROUTERS){
    try{ const r=await fetch(base+path); if(!r.ok) continue; const j=await r.json(); if(j.routes&&j.routes.length) return j.routes; }catch(e){}
  }
  throw new Error("The route service is busy. Try again in a moment.");
}
const tollOf=legs=>legs.reduce((s,l)=>s+(fare(...l)||0),0)*CLS[VCLASS];
$("go").onclick=run;
async function run(){
  const btn=$("go"); if(btn.disabled) return;
  closeSugg(); btn.disabled=true; btn.textContent="Checking…"; note("Finding your route…","busy");
  try{
    const a=await resolvePoint("from"), b=await resolvePoint("to");
    const routes=await getRoutes(a,b);
    TRIP++; SEARCHING=false;
    ROUTES=routes.map(r=>({r,legs:detectLegs(r)}));
    ENDS={a,b}; saveRecent(a,b);
    $("result").hidden=false; note("");
    showRoute(0);
    if(isPhone()) $("panel").classList.remove("peek");
    addExpresswayOptions(a,b);
  }catch(e){ note(e.message,"err"); }
  btn.disabled=false; btn.textContent="Check toll";
}
function pin(cls,letter){ return L.divIcon({className:"",html:`<div class="pin ${cls}"><span>${letter}</span></div>`,iconSize:[28,28],iconAnchor:[14,28],popupAnchor:[0,-26]}); }
function showRoute(i,keepView){
  SEL=i; const {r:route,legs}=ROUTES[i], {a,b}=ENDS;
  const css=getComputedStyle(document.documentElement);
  layer.clearLayers();
  ROUTES.forEach((x,j)=>{ if(j!==i) L.geoJSON(x.r.geometry,{style:{color:css.getPropertyValue("--route-alt").trim(),weight:4,opacity:.7}}).addTo(layer).on("click",()=>showRoute(j)); });
  L.geoJSON(route.geometry,{style:{color:"#ffffff",weight:9,opacity:.9}}).addTo(layer);
  const line=L.geoJSON(route.geometry,{style:{color:css.getPropertyValue("--route").trim(),weight:5,opacity:1}}).addTo(layer);
  L.marker([a.lat,a.lng],{icon:pin("a","A")}).addTo(layer).bindPopup("Start: "+esc(a.label));
  L.marker([b.lat,b.lng],{icon:pin("b","B")}).addTo(layer).bindPopup("Destination: "+esc(b.label));
  LEGS=legs.map(l=>[...l]);
  LEGS.forEach(([k,p1,p2])=>[[p1,"Enter"],[p2,"Exit"]].forEach(([p,w])=>{
    L.marker(PLAZAS[k][p],{icon:L.divIcon({className:"",html:'<div class="plaza"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(layer).bindPopup(esc(`${w}: ${p} (${EXP[k].name})`));
  }));
  if(!keepView) fit(line.getBounds());
  // route options
  const wrap=$("routesWrap"), box=$("routes"); wrap.hidden=ROUTES.length<2&&!SEARCHING; box.replaceChildren();
  $("optNote").hidden=!SEARCHING;
  ROUTES.forEach((x,j)=>{
    const bt=el("button","opt"+(j===i?" on":"")); bt.type="button";
    const left=el("span"); left.appendChild(el("b",null,`${dur(x.r.duration)}, ${Math.round(x.r.distance/1000)} km`));
    left.appendChild(el("small",null,x.legs.length?"Via "+[...new Set(x.legs.map(l=>EXP[l[0]].name))].join(", "):"No expressway, no toll"));
    bt.appendChild(left); bt.appendChild(el("span","amt",x.legs.length?peso(tollOf(x.legs)):"Free"));
    bt.onclick=()=>showRoute(j); box.appendChild(bt);
  });
  // hand off to a navigation app
  const h=$("handoff"); h.replaceChildren();
  [["Open in Google Maps",`https://www.google.com/maps/dir/?api=1&origin=${+a.lat},${+a.lng}&destination=${+b.lat},${+b.lng}&travelmode=driving`],
   ["Open in Waze",`https://waze.com/ul?ll=${+b.lat},${+b.lng}&navigate=yes`]].forEach(([t,u])=>{
    const x=el("a",null,t); x.href=u; x.target="_blank"; x.rel="noopener noreferrer"; h.appendChild(x);
  });
  renderLegs();
}

// ---- expressway options ----
// The free router has no traffic data, so it often skips expressways that are quicker in real life.
// This looks for expressways that run between the start and the destination and offers them as extra options.
const RUNS=new Map();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function osrm(coords,extra=""){
  const path=coords.map(c=>`${c[1]},${c[0]}`).join(";")+`?overview=full&geometries=geojson&steps=true${extra}`;
  for(const base of ROUTERS){
    try{ const r=await fetch(base+path); if(!r.ok) continue; const j=await r.json(); if(j.routes&&j.routes[0]) return j.routes[0]; }catch(e){}
  }
  return null;
}
function candidates(a,b,baseLegs){
  const A=[a.lat,a.lng], B=[b.lat,b.lng], direct=km(A,B), out=[];
  if(direct<4) return out;
  for(const k of Object.keys(PLAZAS)){
    const have=baseLegs.filter(l=>l[0]===k);          // already on a suggested route: only offer a different entry or exit
    const names=Object.keys(PLAZAS[k]); let best=null;
    for(const e of names){
      const de=km(A,PLAZAS[k][e]); if(de>direct*0.6+3) continue;
      for(const x of names){
        if(e===x||fare(k,e,x)===null||have.some(l=>l[1]===e&&l[2]===x)) continue;
        const dx=km(PLAZAS[k][x],B); if(dx>direct*0.6+3) continue;
        const len=km(PLAZAS[k][e],PLAZAS[k][x]); if(len<2.5) continue;
        const est=de+len*0.55+dx;
        if(est<=direct*1.45+3 && (!best||est<best.est)) best={k,e,x,est};
      }
    }
    if(best) out.push(best);
  }
  return out.sort((p,q)=>p.est-q.est).slice(0,3);
}
// exact points on the expressway between two plazas, taken from a real route so they sit on the right carriageway
async function runPoints(k,e,x){
  const id=k+"|"+e+"|"+x; if(RUNS.has(id)) return RUNS.get(id);
  const r=await osrm([PLAZAS[k][e],PLAZAS[k][x]]); let pts=null;
  if(r){
    const on=r.legs.flatMap(l=>l.steps).filter(s=>{const c=s.geometry.coordinates; return c.length&&(classifyRoad(s.name,(c[0][1]+c[c.length-1][1])/2)===k);});
    if(on.length){
      const f=on[0].geometry.coordinates, l=on[on.length-1].geometry.coordinates;
      const first=f[Math.min(2,f.length-1)], last=l[Math.max(0,l.length-3)];
      pts=[[first[1],first[0]],[last[1],last[0]]];
    }
  }
  RUNS.set(id,pts); return pts;
}
async function addExpresswayOptions(a,b){
  const trip=TRIP, cands=candidates(a,b,ROUTES.flatMap(x=>x.legs)); if(!cands.length) return;
  SEARCHING=true; showRoute(SEL,true);
  const quick=ROUTES.reduce((p,q)=>q.r.duration<p.r.duration?q:p), fastest=quick.r.duration;
  // if the quickest route is already tolled, only add options that take about as long. Otherwise allow a longer drive.
  const limit=quick.legs.length ? fastest*1.25+300 : fastest*2+600;
  const kind=legs=>[...new Set(legs.map(l=>l[0]))].sort().join("+")+"|"+legs.reduce((s,l)=>s+(fare(...l)||0),0);
  for(const c of cands){
    try{
      const pts=await runPoints(c.k,c.e,c.x); await wait(350);
      if(trip!==TRIP) return;
      if(!pts) continue;
      const r=await osrm([[a.lat,a.lng],pts[0],pts[1],[b.lat,b.lng]],"&continue_straight=true"); await wait(350);
      if(trip!==TRIP) return;
      if(!r) continue;
      const legs=detectLegs(r);
      if(!legs.some(l=>l[0]===c.k)) continue;                       // didn't actually use the expressway
      if(r.duration>limit) continue;                                 // too far out of the way to be useful
      if(ROUTES.some(x=>kind(x.legs)===kind(legs))) continue;        // same expressways and same toll as one already shown
      ROUTES.push({r,legs,viaExp:true});
      showRoute(SEL,true);
    }catch(e){}
  }
  if(trip===TRIP){ SEARCHING=false; showRoute(SEL,true); }
}

// ---- toll breakdown ----
function calc(){
  const mult=CLS[VCLASS]; let sum=0,bad=0; const box=$("lines"); box.replaceChildren();
  LEGS.forEach(([k,a,b])=>{
    const f=fare(k,a,b), card=el("div","leg"+(f===null?" bad":""));
    const head=el("header"); head.appendChild(el("b",null,EXP[k].name));
    head.appendChild(el("span","amt",f===null?"No rate":f===0?"Free":peso(f*mult)));
    card.appendChild(head);
    const ol=el("ol");
    [["Enter at ",a],["Exit at ",b]].forEach(([w,p])=>{const li=el("li"); li.appendChild(el("small",null,w)); li.appendChild(document.createTextNode(p)); ol.appendChild(li);});
    card.appendChild(ol);
    card.appendChild(el("span","tag",f===null?"No rate listed for this pair. Change the plazas below.":"Pay with "+EXP[k].rfid+" RFID"));
    box.appendChild(card);
    if(f===null) bad++; else sum+=f*mult;
  });
  $("legsTitle").hidden=!LEGS.length;
  $("total").textContent=LEGS.length?peso(sum):"₱0";
  $("tlabel").textContent=VCLASS===1?"Total toll":"Estimated total toll";
  const r=ROUTES[SEL], trip=r?`${dur(r.r.duration)} without traffic, ${Math.round(r.r.distance/1000)} km. `:"";
  $("tsub").textContent=trip+(LEGS.length?(bad?"Some parts could not be priced.":""):"No toll roads on this route.");
  $("peekText").textContent=LEGS.length?`${peso(sum)} total toll`:(r?"No toll on this route":"Plan a trip");
}
function renderLegs(){
  const box=$("legs"); box.replaceChildren();
  LEGS.forEach((l,i)=>{
    const row=el("div","row"); row.dataset.i=i;
    const mk=(label,f,options,sel,full)=>{
      const w=el("div",full?"full":null); w.appendChild(el("small",null,label));
      const s=el("select"); s.dataset.f=f; s.setAttribute("aria-label",label);
      options.forEach(([v,t])=>{const o=el("option",null,t); o.value=v; if(v===sel) o.selected=true; s.appendChild(o);});
      w.appendChild(s); row.appendChild(w);
    };
    mk("Expressway",0,Object.keys(EXP).map(k=>[k,EXP[k].name]),l[0],true);
    mk("Enter at",1,EXP[l[0]].plazas.map(p=>[p,p]),l[1]);
    mk("Exit at",2,EXP[l[0]].plazas.map(p=>[p,p]),l[2]);
    const rm=el("button","rm","Remove this expressway"); rm.type="button"; rm.dataset.del=i; row.appendChild(rm);
    box.appendChild(row);
  });
  calc();
}
$("legs").addEventListener("change",ev=>{
  const s=ev.target; if(s.dataset.f===undefined) return;
  const i=+s.closest(".row").dataset.i, f=+s.dataset.f; LEGS[i][f]=s.value;
  if(f===0){const p=EXP[s.value].plazas;LEGS[i][1]=p[0];LEGS[i][2]=p[p.length-1];}
  renderLegs();
});
$("legs").addEventListener("click",ev=>{const d=ev.target.dataset.del; if(d!==undefined){LEGS.splice(+d,1);renderLegs();}});
$("add").onclick=()=>{LEGS.push(["NLEX","Balintawak","Dau"]);$("result").hidden=false;renderLegs();};
$("cls").addEventListener("click",ev=>{
  const b=ev.target.closest("button"); if(!b) return;
  VCLASS=+b.dataset.cls; [...$("cls").children].forEach(x=>x.classList.toggle("on",x===b));
  if(ROUTES.length) showRouteOptionsOnly(); calc();
});
function showRouteOptionsOnly(){ [...$("routes").children].forEach((bt,j)=>{ const x=ROUTES[j]; bt.querySelector(".amt").textContent=x.legs.length?peso(tollOf(x.legs)):"Free"; }); }

// ---- recent trips (kept on this device only) ----
function saveRecent(a,b){
  if(a.label==="My location") return;
  const key=p=>p.label+"|"+p.lat.toFixed(3);
  let list=store.get("tc_recent",[]).filter(validTrip).filter(t=>!(key(t.a)===key(a)&&key(t.b)===key(b)));
  list.unshift({a,b}); store.set("tc_recent",list.slice(0,4)); renderRecent();
}
const validTrip=t=>t&&t.a&&t.b&&typeof t.a.lat==="number"&&typeof t.b.lat==="number"&&typeof t.a.label==="string"&&typeof t.b.label==="string";
function renderRecent(){
  const list=store.get("tc_recent",[]).filter(validTrip), box=$("recent"); box.replaceChildren(); box.hidden=!list.length;
  if(!list.length) return;
  const head=el("header"); head.appendChild(el("span",null,"Recent trips"));
  const all=el("button",null,"Clear all"); all.type="button";
  all.onclick=()=>{ store.set("tc_recent",[]); renderRecent(); };
  head.appendChild(all); box.appendChild(head);
  const ul=el("ul");
  list.forEach((t,i)=>{
    const name=`${t.a.label} to ${t.b.label}`, li=el("li","chip");
    const use=el("button","use",name); use.type="button"; use.title=name;
    use.onclick=()=>{ setPlace("from",t.a); setPlace("to",t.b); run(); };
    const del=el("button","del","×"); del.type="button"; del.setAttribute("aria-label","Remove "+name+" from recent trips");
    del.onclick=()=>{ const cur=store.get("tc_recent",[]).filter(validTrip); cur.splice(i,1); store.set("tc_recent",cur); renderRecent(); };
    li.appendChild(use); li.appendChild(del); ul.appendChild(li);
  });
  box.appendChild(ul);
}
renderRecent();

// ---- Google Maps link ----
$("useLink").onclick=async()=>{
  let t=($("link").value.match(/https?:\/\/\S+/)||[])[0];
  if(!t) return note("Paste a Google Maps link first.","err");
  note("Opening your Google Maps link…","busy");
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
    setPlace("to",null); $("to").value=d; $("toX").hidden=false;
    if(o){ setPlace("from",null); $("from").value=o; $("fromX").hidden=false; }
    $("linkBox").open=false; $("link").value="";
    if(!$("from").value.trim()){ note("Destination added. Now add where you're starting from."); return $("from").focus(); }
    run();
  }catch(e){ note(e.message+" You can type the trip above instead.","err"); }
};

// ---- phone bottom sheet ----
$("grab").onclick=()=>{ $("panel").classList.toggle("peek"); setTimeout(()=>{ if(ROUTES[SEL]) fit(L.geoJSON(ROUTES[SEL].r.geometry).getBounds()); },280); };
map.on("click",()=>{ if(isPhone()&&ROUTES.length) $("panel").classList.add("peek"); });
