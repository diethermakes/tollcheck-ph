// Turns an OSRM route into toll legs: which expressways it uses, and the entry/exit plaza on each.
function classifyRoad(name, lat){
  const n=(name||"").toLowerCase();
  if(!n) return null;
  if(/nlex connector|connector road/.test(n)) return "CONN";
  if(/harbor link|segment 10|segment 9/.test(n)) return "HARBOR";
  if(/skyway/.test(n)) return lat>14.556 ? "SKY3" : "SLEX";
  if(/north luzon expressway|nlex|subic.clark.tarlac|sctex/.test(n)) return "NLEX";
  if(/tarlac.pangasinan.la union|tplex/.test(n)) return "TPLEX";
  if(/south luzon expressway|slex|muntinlupa.cavite|mcx/.test(n)) return "SLEX";
  if(/southern tagalog arterial|star tollway/.test(n)) return "STAR";
  if(/cavite.laguna expressway|calax/.test(n)) return "CALAX";
  if(/manila.cavite expressway|cavitex/.test(n)) return "CAVITEX";
  if(/naia expressway|naiax/.test(n)) return "NAIAX";
  return null;
}
function km(a,b){ // a,b = [lat,lng]
  const R=6371,d=Math.PI/180,x=(b[1]-a[1])*d*Math.cos((a[0]+b[0])*d/2),y=(b[0]-a[0])*d;
  return Math.sqrt(x*x+y*y)*R;
}
function nearestPlaza(key,pt){
  let best=null,bd=1e9;
  for(const [name,c] of Object.entries(PLAZAS[key])){ const d=km(pt,c); if(d<bd){bd=d;best=name;} }
  return best;
}
const SKY_SPLIT=14.556; // Buendia: Skyway south of here is priced with SLEX, north is Skyway Stage 3
function detectLegs(route){
  const runs=[];
  const add=(key,first,last,dist,sky)=>{
    const prev=runs[runs.length-1];
    if(prev && prev.key===key && km(prev.end,first)<6){ prev.end=last; prev.dist+=dist; prev.sky=prev.sky||sky; }
    else runs.push({key,start:first,end:last,dist,sky});
  };
  for(const leg of route.legs) for(const st of leg.steps){
    const c=st.geometry.coordinates.map(p=>[p[1],p[0]]); if(!c.length) continue;
    if(/skyway/i.test(st.name||"")){
      // walk the line and cut it wherever it crosses Buendia
      let seg=[c[0]];
      const flush=()=>{ if(seg.length<2) return; let dist=0; for(let i=1;i<seg.length;i++) dist+=km(seg[i-1],seg[i])*1000;
        add(seg[0][0]+seg[seg.length-1][0] > 2*SKY_SPLIT ? "SKY3":"SLEX",seg[0],seg[seg.length-1],dist,true); };
      for(let i=1;i<c.length;i++){
        if((c[i-1][0]>SKY_SPLIT)!==(c[i][0]>SKY_SPLIT)){ seg.push(c[i]); flush(); seg=[c[i]]; } else seg.push(c[i]);
      }
      flush(); continue;
    }
    const first=c[0], last=c[c.length-1];
    const key=classifyRoad(st.name,(first[0]+last[0])/2);
    if(key) add(key,first,last,st.distance,false);
  }
  const legs=[];
  for(const r of runs){
    if(r.dist<800) continue;
    let a=nearestPlaza(r.key,r.start), b=nearestPlaza(r.key,r.end);
    if(r.key==="SLEX" && r.sky){ if(a==="Magallanes") a="Magallanes (Skyway)"; if(b==="Magallanes") b="Magallanes (Skyway)"; }
    if(a!==b) legs.push([r.key,a,b]);
  }
  // SLEX <-> STAR: the Calamba-Sto. Tomas stretch is billed on the STAR matrix
  for(let i=0;i<legs.length;i++){
    if(legs[i][0]!=="STAR") continue;
    if(i>0 && legs[i-1][0]==="SLEX" && legs[i][2]!=="Calamba") legs[i][1]="Calamba";
    if(i<legs.length-1 && legs[i+1][0]==="SLEX" && legs[i][1]!=="Calamba") legs[i][2]="Calamba";
  }
  return legs.filter(l=>l[1]!==l[2]);
}
if(typeof module!=="undefined") module.exports={detectLegs,classifyRoad,nearestPlaza};
