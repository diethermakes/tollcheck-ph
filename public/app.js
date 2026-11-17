// ---- settings you can change ----
const ROUTERS=[ // OSRM-compatible routing servers, tried in order
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/"
];
const GEOCODER="https://photon.komoot.io/api/";
const PH_BBOX="116.9,4.5,126.7,21.3";
// Shown before someone plans a trip. These work even when place search is down.
const POPULAR=[
  {a:{label:"Quezon City",lat:14.6760,lng:121.0437,sub:""},b:{label:"Baguio",lat:16.4023,lng:120.5960,sub:""}},
  {a:{label:"Makati",lat:14.5547,lng:121.0244,sub:""},b:{label:"Clark",lat:15.1850,lng:120.5470,sub:""}},
  {a:{label:"Makati",lat:14.5547,lng:121.0244,sub:""},b:{label:"Tagaytay",lat:14.1153,lng:120.9621,sub:""}},
  {a:{label:"Manila",lat:14.5995,lng:120.9842,sub:""},b:{label:"Batangas City",lat:13.7565,lng:121.0583,sub:""}}
];

const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n;};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const peso=n=>"₱"+Math.round(n).toLocaleString("en-PH");
const dur=sec=>{const m=Math.round(sec/60);return (Math.floor(m/60)?Math.floor(m/60)+" hr ":"")+(m%60)+" min";};
const isPhone=()=>window.matchMedia("(max-width:760px)").matches;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const ICON={
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  road:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3 5 21M16 3l3 18M12 4v3M12 10v3M12 16v3"/></svg>'
};
// network failures show as "Load failed" or "Failed to fetch" depending on the browser
const friendly=(e,what)=>(e instanceof TypeError||/load failed|failed to fetch|network/i.test(e&&e.message))
  ? `Can't reach the ${what} right now. Check your internet connection and try again.` : e.message;

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
  else map.fitBounds(bounds,{paddingTopLeft:[p.offsetWidth+44,44],paddingBottomRight:[44,44]});
}

// ---- state ----
const PT={from:null,to:null};      // chosen places: {lat,lng,label,sub}
let ROUTES=[], ENDS=null, LEGS=[], SEL=0, VCLASS=1, SEARCHING=false, TRIP=0;

// ---- theme ----
$("themeBtn").onclick=()=>{
  const next=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
  document.documentElement.setAttribute("data-theme",next);
  try{localStorage.setItem("tc_theme",next);}catch(e){}
  if(ROUTES.length) showRoute(SEL,true);
};

// ---- messages ----
function note(text,kind){
  const m=$("msg"); m.hidden=!text; m.className="msg"+(kind==="err"?" err":""); m.replaceChildren();
  if(kind==="busy") m.appendChild(el("span","spin"));
  m.appendChild(document.createTextNode(text||""));
}

// ---- phone typing mode: keep the fields above the keyboard ----
const vv=window.visualViewport;
function syncViewport(){
  if(!vv) return;
  document.documentElement.style.setProperty("--vv-h",vv.height+"px");
  document.documentElement.style.setProperty("--vv-top",vv.offsetTop+"px");
}
if(vv){ vv.addEventListener("resize",syncViewport); vv.addEventListener("scroll",syncViewport); syncViewport(); }
function typing(on){
  if(!isPhone()) return;
  const p=$("panel");
  if(on){ syncViewport(); p.classList.remove("peek"); p.classList.add("typing"); $("scroll").scrollTop=0; }
  else { p.classList.remove("typing"); window.scrollTo(0,0); setTimeout(()=>map.invalidateSize(),50); }
}
$("done").onclick=()=>{ closeSugg(); document.activeElement&&document.activeElement.blur(); typing(false); };

// ---- place search ----
async function geocode(q,limit=6){
  const r=await fetch(`${GEOCODER}?q=${encodeURIComponent(q)}&limit=${limit}&bbox=${PH_BBOX}&lat=14.6&lon=121.0&lang=en`);
  if(!r.ok) throw new Error("Place search is busy right now. Try again in a minute.");
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
  else if(which==="to" && !PT.from) $("from").focus();
  else { $(which).blur(); typing(false); if(PT.from&&PT.to) run(); }
}
function renderSugg(state){
  const box=$("sugg"); box.replaceChildren(); box.hidden=false;
  if(state) return box.appendChild(el("div","note",state));
  RESULTS.forEach((p,i)=>{
    const b=el("button"); b.type="button"; b.setAttribute("role","option"); if(i===HI) b.className="act";
    const t=el("span"); t.appendChild(el("b",null,p.label)); if(p.sub) t.appendChild(el("small",null,p.sub)); b.appendChild(t);
    // pointerdown fires before the input loses focus, so the tap always registers
    b.addEventListener("pointerdown",ev=>{ev.preventDefault(); pick(i);});
    box.appendChild(b);
  });
}
function wire(which){
  const inp=$(which);
  inp.addEventListener("focus",()=>{ ACTIVE=which; typing(true); setTimeout(()=>inp.select(),0); });
  inp.addEventListener("input",()=>{
    ACTIVE=which; PT[which]=null; $(which+"Row").classList.remove("set"); $(which+"X").hidden=!inp.value;
    clearTimeout(timer); const q=inp.value.trim();
    if(q.length<3) return closeSugg();
    renderSugg("Searching");
    timer=setTimeout(async()=>{
      const id=++reqId;
      try{ const res=await geocode(q); if(id!==reqId) return; RESULTS=res; HI=-1; renderSugg(res.length?null:"No places found. Try a city, mall or landmark."); }
      catch(e){ if(id===reqId) renderSugg(friendly(e,"place search")); }
    },300);
  });
  inp.addEventListener("keydown",ev=>{
    if(ev.key==="ArrowDown"||ev.key==="ArrowUp"){ if(!RESULTS.length) return; ev.preventDefault(); HI=(HI+(ev.key==="ArrowDown"?1:-1)+RESULTS.length)%RESULTS.length; renderSugg(); }
    else if(ev.key==="Enter"){ ev.preventDefault(); if(RESULTS.length) pick(HI<0?0:HI); else if(which==="from") $("to").focus(); else { inp.blur(); typing(false); run(); } }
    else if(ev.key==="Escape"){ closeSugg(); inp.blur(); typing(false); }
  });
  inp.addEventListener("blur",()=>setTimeout(()=>{
    const f=document.activeElement;
    if(f!==$("from")&&f!==$("to")){ closeSugg(); if(f!==$("done")) typing(false); }
  },150));
  $(which+"X").addEventListener("pointerdown",ev=>{ ev.preventDefault(); setPlace(which,null); closeSugg(); resetTrip(); inp.focus(); });
}
wire("from"); wire("to");
// back to the start view (recent and popular trips) when a place is cleared
function resetTrip(){
  TRIP++; SEARCHING=false; ROUTES=[]; LEGS=[]; ENDS=null; layer.clearLayers();
  $("result").hidden=true; $("start").hidden=false; note(""); $("peekText").textContent="Plan a trip";
}

$("swap").addEventListener("pointerdown",ev=>ev.preventDefault());
$("swap").onclick=()=>{
  const a=PT.from, b=PT.to, av=$("from").value, bv=$("to").value;
  setPlace("from",b); setPlace("to",a);
  if(!b){ $("from").value=bv; $("fromX").hidden=!bv; } if(!a){ $("to").value=av; $("toX").hidden=!av; }
  if(PT.from&&PT.to&&!$("panel").classList.contains("typing")) run();
};
$("me").onclick=()=>{
  if(!navigator.geolocation) return note("This browser can't share your location. Type your starting point instead.","err");
  note("Getting your location","busy");
  navigator.geolocation.getCurrentPosition(p=>{
    setPlace("from",{lat:p.coords.latitude,lng:p.coords.longitude,label:"My location",sub:""}); note("");
    if(PT.to) run(); else $("to").focus();
  },()=>note("Location is turned off for this site. Type your starting point instead.","err"),{enableHighAccuracy:true,timeout:10000});
};

// ---- routing ----
async function resolvePoint(which){
  if(PT[which]) return PT[which];
  const q=$(which).value.trim(); if(!q) throw new Error(which==="from"?"Add your starting point.":"Add where you're going.");
  const m=q.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  let p;
  if(m) p={lat:+m[1],lng:+m[2],label:"Pinned location",sub:q};
  else {
    let res; try{ res=await geocode(q,1); }catch(e){ throw new Error(friendly(e,"place search")); }
    if(!res.length) throw new Error(`Couldn't find "${q}". Try a nearby city or landmark.`); p=res[0];
  }
  setPlace(which,p); return p;
}
async function osrm(coords,extra=""){
  const path=coords.map(c=>`${c[1]},${c[0]}`).join(";")+`?overview=full&geometries=geojson&steps=true${extra}`;
  let lastErr=null;
  for(const base of ROUTERS){
    try{ const r=await fetch(base+path); if(!r.ok) continue; const j=await r.json(); if(j.routes&&j.routes.length) return j.routes; }catch(e){ lastErr=e; }
  }
  if(lastErr) throw new Error(friendly(lastErr,"route service"));
  return null;
}
const tollOf=legs=>legs.reduce((s,l)=>s+(fare(...l)||0)*mult(l[0],VCLASS),0);
$("go").onclick=()=>run();
async function run(){
  const btn=$("go"); if(btn.disabled) return;
  closeSugg(); typing(false); btn.disabled=true; btn.textContent="Checking"; note("Finding your route","busy");
  try{
    const a=await resolvePoint("from"), b=await resolvePoint("to");
    const routes=await osrm([[a.lat,a.lng],[b.lat,b.lng]],"&alternatives=3");
    if(!routes) throw new Error("The route service is busy. Try again in a moment.");
    TRIP++; SEARCHING=false;
    ROUTES=routes.map(r=>({r,legs:detectLegs(r)}));
    ENDS={a,b}; saveRecent(a,b);
    $("result").hidden=false; $("start").hidden=true; note("");
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
  ROUTES.forEach((x,j)=>{ if(j!==i) L.geoJSON(x.r.geometry,{style:{color:css.getPropertyValue("--route-alt").trim(),weight:4,opacity:.75}}).addTo(layer).on("click",()=>showRoute(j,true)); });
  L.geoJSON(route.geometry,{style:{color:"#ffffff",weight:9,opacity:.9}}).addTo(layer);
  const line=L.geoJSON(route.geometry,{style:{color:css.getPropertyValue("--route").trim(),weight:5,opacity:1}}).addTo(layer);
  L.marker([a.lat,a.lng],{icon:pin("a","A")}).addTo(layer).bindPopup("Start: "+esc(a.label));
  L.marker([b.lat,b.lng],{icon:pin("b","B")}).addTo(layer).bindPopup("Destination: "+esc(b.label));
  LEGS=legs.map(l=>[...l]);
  LEGS.forEach(([k,p1,p2])=>[[p1,"Enter"],[p2,"Exit"]].forEach(([p,w])=>{
    L.marker(PLAZAS[k][p],{icon:L.divIcon({className:"",html:'<div class="plaza"></div>',iconSize:[16,16],iconAnchor:[8,8]})}).addTo(layer).bindPopup(esc(`${w}: ${p} (${EXP[k].name})`));
  }));
  if(!keepView) fit(line.getBounds());
  renderOptions();
  const h=$("handoff"); h.replaceChildren();
  [["Open in Google Maps",`https://www.google.com/maps/dir/?api=1&origin=${+a.lat},${+a.lng}&destination=${+b.lat},${+b.lng}&travelmode=driving`],
   ["Open in Waze",`https://waze.com/ul?ll=${+b.lat},${+b.lng}&navigate=yes`]].forEach(([t,u])=>{
    const x=el("a",null,t); x.href=u; x.target="_blank"; x.rel="noopener noreferrer"; h.appendChild(x);
  });
  renderLegs();
}
function renderOptions(){
  const wrap=$("routesWrap"), box=$("routes"); wrap.hidden=ROUTES.length<2&&!SEARCHING; box.replaceChildren();
  $("optNote").hidden=!SEARCHING;
  const fastest=Math.min(...ROUTES.map(x=>x.r.duration));
  const tolled=ROUTES.filter(x=>x.legs.length).map(x=>tollOf(x.legs));
  const cheapest=tolled.length?Math.min(...tolled):null;
  ROUTES.forEach((x,j)=>{
    const bt=el("button","opt"+(j===SEL?" on":"")); bt.type="button"; bt.setAttribute("aria-pressed",j===SEL);
    const t=x.legs.length?tollOf(x.legs):0;
    bt.appendChild(el("b",null,`${dur(x.r.duration)}, ${Math.round(x.r.distance/1000)} km`));
    bt.appendChild(el("span","amt",x.legs.length?peso(t):"No toll"));
    bt.appendChild(el("small",null,x.legs.length?"Via "+[...new Set(x.legs.map(l=>EXP[l[0]].name))].join(", "):"Ordinary roads only"));
    const tags=[];
    if(ROUTES.length>1&&x.r.duration===fastest) tags.push(["fast","Shortest time"]);
    if(!x.legs.length&&ROUTES.length>1) tags.push(["free","No toll"]);
    else if(tolled.length>1&&t===cheapest) tags.push(["","Lowest toll"]);
    if(tags.length){ const g=el("span","badges"); tags.forEach(([c,s])=>g.appendChild(el("span","badge "+c,s))); bt.appendChild(g); }
    bt.onclick=()=>showRoute(j,true); box.appendChild(bt);
  });
}

// ---- expressway options ----
// The free router has no traffic data, so it often skips expressways that are quicker in real life.
// This tries likely entrance and exit pairs, plus the local hints in hints.js, and adds the ones that work.
const near=(p,c,r)=>km(p,c)<=r;
function candidates(a,b,baseLegs){
  const A=[a.lat,a.lng], B=[b.lat,b.lng], direct=km(A,B), out=[];
  if(direct<4) return out;
  for(const h of (typeof HINTS!=="undefined"?HINTS:[])){
    if(!PLAZAS[h.exp]||!PLAZAS[h.exp][h.enter]||!PLAZAS[h.exp][h.exit]) continue;
    if(near(A,h.from,h.fromKm)&&near(B,h.to,h.toKm)) out.push({k:h.exp,e:h.enter,x:h.exit,est:-1});
    else if(near(A,h.to,h.toKm)&&near(B,h.from,h.fromKm)) out.push({k:h.exp,e:h.exit,x:h.enter,est:-1});
  }
  for(const k of Object.keys(PLAZAS)){
    const names=Object.keys(PLAZAS[k]), pairs=[];
    for(const e of names){
      const de=km(A,PLAZAS[k][e]); if(de>direct*0.6+3) continue;
      for(const x of names){
        if(e===x||fare(k,e,x)===null||baseLegs.some(l=>l[0]===k&&l[1]===e&&l[2]===x)) continue;
        const north=PLAZAS[k][x][0]>PLAZAS[k][e][0];
        if(!rampOk(k,e,"enter",north)||!rampOk(k,x,"exit",north)) continue;   // one-way ramps
        const dx=km(PLAZAS[k][x],B); if(dx>direct*0.6+3) continue;
        const len=km(PLAZAS[k][e],PLAZAS[k][x]); if(len<2.5) continue;
        const est=de+len*0.55+dx;
        if(est<=direct*1.45+3) pairs.push({k,e,x,est});
      }
    }
    pairs.sort((p,q)=>p.est-q.est);
    const usedExits=new Set();
    for(const p of pairs){ if(usedExits.has(p.x)) continue; usedExits.add(p.x); out.push(p); if(usedExits.size===2) break; }
  }
  const seen=new Set();
  return out.filter(c=>{const id=c.k+c.e+c.x; if(seen.has(id)) return false; seen.add(id); return true;})
            .sort((p,q)=>p.est-q.est).slice(0,5);
}
async function addExpresswayOptions(a,b){
  const trip=TRIP, cands=candidates(a,b,ROUTES.flatMap(x=>x.legs)); if(!cands.length) return;
  SEARCHING=true; renderOptions(); $("routesWrap").hidden=false;
  const quick=ROUTES.reduce((p,q)=>q.r.duration<p.r.duration?q:p), fastest=quick.r.duration;
  const shortest=Math.min(...ROUTES.map(x=>x.r.distance));
  // if the quickest route already uses a toll road, only add options that take about as long
  const limit=quick.legs.length ? fastest*1.25+300 : fastest*2+600;
  const kind=legs=>legs.map(l=>l.join("/")).join("+");
  const best={};
  for(const c of cands){
    try{
      // route through the entrance and the exit plaza so the driver really uses them
      const rs=await osrm([[a.lat,a.lng],PLAZAS[c.k][c.e],PLAZAS[c.k][c.x],[b.lat,b.lng]],"&continue_straight=true");
      await wait(350); if(trip!==TRIP) return;
      if(!rs) continue;
      const r=rs[0], legs=detectLegs(r);
      if(!legs.some(l=>l[0]===c.k)) continue;
      if(legs.some(l=>fare(...l)===null)) continue;                    // can't price it, so don't offer it
      if(r.duration>limit||r.distance>shortest*1.7+4000) continue;   // a loop or a long detour
      const slot=c.est<0?"hint":c.k;                                  // keep the best result per expressway, plus any hint
      if(!best[slot]||r.duration<best[slot].r.duration) best[slot]={r,legs};
    }catch(e){}
  }
  if(trip!==TRIP) return;
  Object.values(best).sort((p,q)=>p.r.duration-q.r.duration).forEach(x=>{
    if(!ROUTES.some(y=>kind(y.legs)===kind(x.legs))) ROUTES.push(x);
  });
  SEARCHING=false; renderOptions();
}

// ---- toll receipt ----
function calc(){
  let sum=0,bad=0; const box=$("lines"); box.replaceChildren();
  if(!LEGS.length) box.appendChild(el("p","empty","This route has no toll roads."));
  LEGS.forEach(([k,a,b])=>{
    const f=fare(k,a,b), m=mult(k,VCLASS), row=el("div","leg"+(f===null?" bad":""));
    row.appendChild(el("b",null,EXP[k].name));
    row.appendChild(el("span","amt",f===null?"No rate":f===0?"Free":peso(f*m)));
    row.appendChild(el("span","way",`${a} to ${b}`));
    row.appendChild(el("span","rfid",f===null?"No rate listed for this pair. Change the plazas below.":`${EXP[k].rfid} RFID`));
    box.appendChild(row);
    if(f===null) bad++; else sum+=f*m;
  });
  $("total").textContent=peso(sum);
  $("tlabel").textContent=VCLASS===1?"Total toll":"Estimated total toll";
  const r=ROUTES[SEL];
  $("tsub").textContent=(r?`${dur(r.r.duration)} without traffic, ${Math.round(r.r.distance/1000)} km`:"")+(bad?". Some parts could not be priced.":"");
  const est=VCLASS>1&&LEGS.some(l=>!CLS_BY[l[0]]);
  $("source").textContent="Latest TRB rates, checked 17 November 2026, VAT included."+(est?" Some bus and truck amounts are estimates.":"");
  $("peekText").textContent=LEGS.length?`${peso(sum)} total toll`:(r?"No toll on this route":"Plan a trip");
}
function renderLegs(){
  const box=$("legs"); box.replaceChildren();
  LEGS.forEach((l,i)=>{
    const row=el("div","row2"); row.dataset.i=i;
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
  const i=+s.closest(".row2").dataset.i, f=+s.dataset.f; LEGS[i][f]=s.value;
  if(f===0){const p=EXP[s.value].plazas;LEGS[i][1]=p[0];LEGS[i][2]=p[p.length-1];}
  renderLegs();
});
$("legs").addEventListener("click",ev=>{const d=ev.target.dataset.del; if(d!==undefined){LEGS.splice(+d,1);renderLegs();}});
$("add").onclick=()=>{LEGS.push(["NLEX","Balintawak","Dau"]);$("result").hidden=false;renderLegs();};
$("cls").addEventListener("click",ev=>{
  const b=ev.target.closest("button"); if(!b) return;
  VCLASS=+b.dataset.cls; [...$("cls").children].forEach(x=>x.classList.toggle("on",x===b));
  if(ROUTES.length) renderOptions(); calc();
});

// ---- recent and popular trips ----
const validTrip=t=>t&&t.a&&t.b&&typeof t.a.lat==="number"&&typeof t.b.lat==="number"&&typeof t.a.label==="string"&&typeof t.b.label==="string";
function saveRecent(a,b){
  if(a.label==="My location") return;
  const key=p=>p.label+"|"+p.lat.toFixed(3);
  let list=store.get("tc_recent",[]).filter(validTrip).filter(t=>!(key(t.a)===key(a)&&key(t.b)===key(b)));
  list.unshift({a,b}); store.set("tc_recent",list.slice(0,4)); renderRecent();
}
function tripRow(t,icon,sub){
  const b=el("button","row"); b.type="button";
  const ic=el("span","ic"); ic.innerHTML=icon; b.appendChild(ic);
  const tx=el("span","tx"); tx.appendChild(el("b",null,`${t.a.label} to ${t.b.label}`)); if(sub) tx.appendChild(el("small",null,sub)); b.appendChild(tx);
  b.onclick=()=>{ setPlace("from",t.a); setPlace("to",t.b); run(); };
  return b;
}
function renderRecent(){
  const list=store.get("tc_recent",[]).filter(validTrip), box=$("recent"); box.replaceChildren(); box.hidden=!list.length;
  if(!list.length) return;
  const head=el("header"); head.appendChild(el("h2",null,"Recent"));
  const all=el("button",null,"Clear"); all.type="button"; all.onclick=()=>{ store.set("tc_recent",[]); renderRecent(); };
  head.appendChild(all); box.appendChild(head);
  list.forEach((t,i)=>{
    const item=el("div","item"); item.appendChild(tripRow(t,ICON.clock));
    const del=el("button","del","×"); del.type="button"; del.setAttribute("aria-label",`Remove ${t.a.label} to ${t.b.label} from recent trips`);
    del.onclick=()=>{ const cur=store.get("tc_recent",[]).filter(validTrip); cur.splice(i,1); store.set("tc_recent",cur); renderRecent(); };
    item.appendChild(del); box.appendChild(item);
  });
}
function renderPopular(){
  const box=$("popular"); box.replaceChildren();
  const head=el("header"); head.appendChild(el("h2",null,"Popular trips")); box.appendChild(head);
  POPULAR.forEach(t=>box.appendChild(tripRow(t,ICON.road)));
}
renderRecent(); renderPopular();

// ---- Google Maps link ----
$("useLink").onclick=async()=>{
  let t=($("link").value.match(/https?:\/\/\S+/)||[])[0];
  if(!t) return note("Paste a Google Maps link first.","err");
  note("Opening your Google Maps link","busy");
  try{
    if(/goo\.gl/i.test(t)){
      let r,j;
      try{ r=await fetch("/api/resolve?url="+encodeURIComponent(t)); j=await r.json(); }catch(e){ throw new Error(friendly(e,"link service")); }
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
    if(!$("from").value.trim()){ note("Destination added. Now add your starting point."); return $("from").focus(); }
    run();
  }catch(e){ note(e.message+" You can type the trip above instead.","err"); }
};

// ---- phone bottom sheet ----
$("grab").onclick=()=>{ $("panel").classList.toggle("peek"); setTimeout(()=>{ if(ROUTES[SEL]) fit(L.geoJSON(ROUTES[SEL].r.geometry).getBounds()); },280); };
map.on("click",()=>{ if(isPhone()&&ROUTES.length&&!$("panel").classList.contains("typing")) $("panel").classList.add("peek"); });
