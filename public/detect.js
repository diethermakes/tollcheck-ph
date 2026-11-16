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
function detectLegs(route){
  const runs=[];
  for(const leg of route.legs) for(const st of leg.steps){
    const c=st.geometry.coordinates; if(!c.length) continue;
    const first=[c[0][1],c[0][0]], last=[c[c.length-1][1],c[c.length-1][0]];
    const key=classifyRoad(st.name,(first[0]+last[0])/2);
    if(!key) continue;
    const sky=/skyway/i.test(st.name), prev=runs[runs.length-1];
    if(prev && prev.key===key && km(prev.end,first)<6){ prev.end=last; prev.dist+=st.distance; prev.sky=prev.sky||sky; }
    else runs.push({key,start:first,end:last,dist:st.distance,sky});
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
