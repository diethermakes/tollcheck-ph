// Class 1 toll matrices, VAT included. Update here when rates change.
// NLEX/SCTEX 20 Jan 2026 · Skyway-SLEX-MCX 1 Jul 2026 · STAR 1 Jul 2026 · CALAX 9 Aug 2026 · CAVITEX 9 May 2026
// Skyway Stage 3, TPLEX, NAIAX, NLEX Connector, Harbor Link: latest TRB matrices (no change in 2026).
// Checked 17 Nov 2026 against TRB publications and tollcalculator.ph.
const EXP = {
 NLEX:{name:"NLEX / SCTEX",rfid:"Easytrip",
  cols:["Balintawak","Mindanao Ave.","Karuhatan","Valenzuela","Meycauayan","Marilao","Ciudad de Victoria","Bocaue","Tambubong","Balagtas","Sta. Rita","Pulilan","San Simon","San Fernando","Mexico","Angeles","Dau","Tipo/Subic","Dinalupihan","Floridablanca","Porac","Clark South","Mabalacat (Mabiga)","Clark North","Dolores","Bamban/New Clark City","Concepcion","Hacienda Luisita","Tabang","Sta. Ines"],
  rows:`Mindanao Ave.|85,-,85,85,85,85,96,105,110,136,164,202,266,314,353,399,411,857,731,608,519,451,440,467,477,521,545,638,157,440
Karuhatan|85,85,-,85,85,85,96,105,110,136,164,202,266,314,353,399,411,857,731,608,519,451,440,467,477,521,545,638,157,440
Valenzuela|85,85,85,-,85,85,96,105,110,136,164,202,266,314,353,399,411,857,731,608,519,451,440,467,477,521,545,638,157,440
Meycauayan|85,85,85,85,-,85,96,105,110,136,164,202,266,314,353,399,411,857,731,608,519,451,440,467,477,521,545,638,157,440
Marilao|85,85,85,85,85,-,96,105,110,136,164,202,266,314,353,399,411,857,731,608,519,451,440,467,477,521,545,638,157,440
Ciudad de Victoria|96,96,96,96,96,96,-,9,14,40,68,106,170,218,257,303,315,761,635,512,423,355,344,371,381,425,449,542,61,344
Bocaue|105,105,105,105,105,105,9,-,5,31,59,97,160,209,248,294,305,751,625,502,413,345,334,361,371,415,439,532,52,334
Tambubong|110,110,110,110,110,110,14,5,-,26,54,92,155,204,243,289,300,746,620,497,408,340,329,356,366,410,434,527,47,329
Balagtas|136,136,136,136,136,136,40,31,26,-,28,66,130,178,217,263,275,721,595,472,383,315,304,331,341,385,409,502,21,304
Sta. Rita|164,164,164,164,164,164,68,59,54,28,-,37,101,150,189,235,246,692,566,443,354,286,275,302,312,356,380,473,-,275
Pulilan|202,202,202,202,202,202,106,97,92,66,37,-,64,113,151,198,209,655,529,406,317,249,238,265,275,319,343,436,-,238
San Simon|266,266,266,266,266,266,170,160,155,130,101,64,-,49,87,134,145,591,465,342,253,185,174,201,211,255,279,372,-,174
San Fernando|314,314,314,314,314,314,218,209,204,178,150,113,49,-,39,85,96,542,416,293,204,136,125,152,162,206,230,323,-,125
Mexico|353,353,353,353,353,353,257,248,243,217,189,151,87,39,-,46,57,503,377,254,165,97,86,113,123,167,191,284,-,86
Angeles|399,399,399,399,399,399,303,294,289,263,235,198,134,85,46,-,11,457,331,208,119,51,40,67,77,121,145,238,-,40
Dau|411,411,411,411,411,411,315,305,300,275,246,209,145,96,57,11,-,446,320,197,108,40,29,56,66,110,134,227,-,29
Tipo/Subic|857,857,857,857,857,857,761,751,746,721,692,655,591,542,503,457,446,-,126,249,339,406,417,444,454,498,523,615,-,-
Dinalupihan|731,731,731,731,731,731,635,625,620,595,566,529,465,416,377,331,320,126,-,123,213,280,291,318,328,372,397,489,-,-
Floridablanca|608,608,608,608,608,608,512,502,497,472,443,406,342,293,254,208,197,249,123,-,90,157,168,196,206,249,274,366,-,-
Porac|519,519,519,519,519,519,423,413,408,383,354,317,253,204,165,119,108,339,213,90,-,68,79,106,116,159,184,276,-,-
Clark South|451,451,451,451,451,451,355,345,340,315,286,249,185,136,97,51,40,406,280,157,68,-,11,38,48,92,116,209,-,-
Mabalacat (Mabiga)|440,440,440,440,440,440,344,334,329,304,275,238,174,125,86,40,29,417,291,168,79,11,-,27,37,81,105,198,-,-
Clark North|467,467,467,467,467,467,371,361,356,331,302,265,201,152,113,67,56,444,318,196,106,38,27,-,10,54,78,171,-,-
Dolores|477,477,477,477,477,477,381,371,366,341,312,275,211,162,123,77,66,454,328,206,116,48,37,10,-,44,68,160,-,-
Bamban/New Clark City|521,521,521,521,521,521,425,415,410,385,356,319,255,206,167,121,110,498,372,249,159,92,81,54,44,-,25,117,-,-
Concepcion|545,545,545,545,545,545,449,439,434,409,380,343,279,230,191,145,134,523,397,274,184,116,105,78,68,25,-,92,-,-
Hacienda Luisita|638,638,638,638,638,638,542,532,527,502,473,436,372,323,284,238,227,615,489,366,276,209,198,171,160,117,92,-,-,-
Tabang|157,157,157,157,157,157,61,52,47,21,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-
Sta. Ines|440,440,440,440,440,440,344,334,329,304,275,238,174,125,86,40,29,-,-,-,-,-,-,-,-,-,-,-,-,-
Tarlac|670,670,670,670,670,670,574,564,559,534,505,468,404,355,316,270,259,647,521,398,308,241,230,203,193,149,124,32,-,-`},
 TPLEX:{name:"TPLEX",rfid:"Easytrip",
  cols:["La Paz","Victoria","Gerona","Paniqui","Moncada","Carmen","Urdaneta","Binalonan","Pozorrubio","Sison"],
  rows:`Victoria|30,-,28,49,69,134,186,205,240,260
Gerona|58,28,-,21,41,106,158,177,212,232
Paniqui|79,49,21,-,20,85,137,156,191,212
Moncada|99,69,41,20,-,65,117,136,171,192
Carmen|164,134,106,85,65,-,52,71,106,127
Urdaneta|216,186,158,137,117,52,-,19,54,75
Binalonan|235,205,177,156,136,71,19,-,35,56
Pozorrubio|270,240,212,191,171,106,54,35,-,21
Sison|290,260,232,212,192,127,75,56,21,-
Rosario/Baguio|311,281,253,232,212,147,95,76,41,21`},
 SLEX:{name:"SLEX / Skyway / MCX",rfid:"Autosweep",
  cols:["Magallanes","Buendia","C-5","Amorsolo","Bicutan","Magallanes (Skyway)","NAIAX","Sucat","Alabang","Filinvest","MCX","Susana Heights","San Pedro","Southwoods","Carmona","Mamplasan","Sta. Rosa","ABI/Greenfield","Cabuyao","Silangan","Calamba","Merville"],
  rows:`Buendia|-,-,-,-,72,-,0,118,164,-,-,-,-,-,-,-,-,-,-,-,-,-
C-5|-,-,-,-,49,-,-,84,118,-,-,-,-,-,-,-,-,-,-,-,-,-
Amorsolo|-,-,-,-,72,-,0,118,164,-,-,-,-,-,-,-,-,-,-,-,-,-
Bicutan|49,72,49,72,-,72,72,34,69,-,-,-,-,-,-,-,-,-,-,-,-,-
Magallanes (Skyway)|-,-,-,-,72,-,0,118,164,-,-,-,-,-,-,-,-,-,-,-,-,-
NAIAX|-,0,-,0,72,0,-,118,164,-,-,-,-,-,-,-,-,-,-,-,-,-
Sucat|84,118,84,118,34,118,118,-,34,-,-,-,-,-,-,-,-,-,-,-,-,-
Alabang|118,164,118,164,69,164,164,34,-,-,-,-,-,-,-,-,-,-,-,-,-,-
Filinvest|124,170,124,170,75,170,170,40,6,-,-,-,-,-,-,-,-,-,-,-,-,-
MCX|164,210,164,210,115,210,210,80,46,40,-,-,-,-,-,-,-,-,-,-,-,-
Susana Heights|141,187,141,187,92,187,187,57,23,17,23,-,-,-,-,-,-,-,-,-,-,-
San Pedro|148,194,148,194,99,194,194,64,30,24,31,8,-,-,-,-,-,-,-,-,-,-
Southwoods|167,213,167,213,118,213,213,83,49,43,50,27,19,-,-,-,-,-,-,-,-,-
Carmona|175,221,175,221,126,221,221,91,57,51,57,34,26,7,-,-,-,-,-,-,-,-
Mamplasan|187,233,187,233,138,233,233,103,69,63,70,47,39,20,13,-,-,-,-,-,-,-
Sta. Rosa|199,245,199,245,150,245,245,115,81,75,81,58,50,31,24,11,-,-,-,-,-,-
ABI/Greenfield|215,261,215,261,166,261,261,131,97,91,97,74,66,48,40,27,16,-,-,-,-,-
Cabuyao|225,271,225,271,176,271,271,141,107,101,107,84,77,58,50,38,26,10,-,-,-,-
Silangan|232,278,232,278,183,278,278,148,114,108,114,91,84,65,57,45,33,17,7,-,-,-
Calamba|255,301,255,301,206,301,301,171,137,131,137,114,106,88,80,67,56,40,30,23,-,-
Merville|49,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-
Don Bosco|-,-,-,-,72,-,0,118,164,-,-,-,-,-,-,-,-,-,-,-,-,-`},
 SKY3:{name:"Skyway Stage 3",rfid:"Autosweep",
  cols:["Buendia","Quirino","Plaza Dilao","Nagtahan","E. Rodriguez","Quezon Ave.","Balintawak"],
  rows:`Quirino|105,-,-,-,-,264,264
Nagtahan|105,-,-,-,-,264,264
E. Rodriguez|-,-,-,-,-,129,129
Quezon Ave.|264,264,-,264,129,-,129
Balintawak|264,264,-,264,129,129,-
NLEX|264,264,-,264,129,129,-
Plaza Dilao|105,-,-,-,-,-,-`},
 STAR:{name:"STAR Tollway",rfid:"Autosweep",
  cols:["Calamba", "Sto. Tomas", "Tanauan", "Malvar", "Sto. Toribio", "Lipa", "Ibaan"],
  rows:`Sto. Tomas|37,-,14,31,52,64,97
Tanauan|51,14,-,17,38,50,83
Malvar|68,31,17,-,21,33,66
Sto. Toribio|89,52,38,21,-,12,45
Lipa|101,64,50,33,12,-,33
Ibaan|134,97,83,66,45,33,-
Batangas|158,121,107,90,69,57,24`},
 CALAX:{name:"CALAX",rfid:"Easytrip",
  cols:["Greenfield","Technopark","Laguna Blvd.","Sta. Rosa/Tagaytay","Silang East","Silang Interchange"],
  rows:`Technopark|-,-,15,29,48,-
Laguna Blvd.|30,15,-,14,33,-
Sta. Rosa/Tagaytay|44,29,14,-,27,-
Silang East|64,48,33,27,-,-
Silang Interchange|81,66,51,45,17,-
Governor's Drive|117,101,86,80,53,35`},
 CAVITEX:{name:"CAVITEX",rfid:"Easytrip",
  cols:["Parañaque","Bacoor/Zapote","Kawit","Sucat Rd./Dr. A. Santos Ave.","C5 Rd. Ext./C.P. Garcia","Taguig"],
  rows:`Bacoor/Zapote|39,-,88,38,38,97
Kawit|127,88,-,126,126,185
C5 Rd. Ext./C.P. Garcia|38,38,126,-,-,59
Sucat Rd./Dr. A. Santos Ave.|38,38,126,-,-,59
Taguig|97,97,185,59,59,-
Merville|-,-,-,-,-,32`},
 NAIAX:{name:"NAIAX",rfid:"Autosweep",
  cols:["Skyway","Andrews Ave./Terminal 3","Aurora Blvd. (Tramo)","NAIA Terminal 1","NAIA Terminal 2","Entertainment City","Macapagal Blvd.","CAVITEX"],
  rows:`Andrews Ave./Terminal 3|35,-,-,45,45,45,45,45
NAIA Terminal 1|45,45,45,-,-,35,35,35
NAIA Terminal 2|45,45,45,-,-,35,35,35
Entertainment City|45,45,45,35,35,-,-,-
Macapagal Blvd.|45,45,45,35,35,-,-,-
CAVITEX|45,45,45,35,35,-,-,-
NAIA Terminal 3|35,-,-,45,45,45,45,45`},
 CONN:{name:"NLEX Connector",rfid:"Easytrip",
  cols:["España","Magsaysay"],
  rows:`Magsaysay|119,-
C-3 Road/5th Ave.|119,119`},
 HARBOR:{name:"NLEX Harbor Link",rfid:"Easytrip",
  cols:["Karuhatan/Valenzuela","C-3 Road/5th Ave.","R-10/Port of Manila","Malabon/Dagat-Dagatan"],
  rows:`C-3 Road/5th Ave.|79,-,-,-
R-10/Port of Manila|79,-,-,-
Malabon/Dagat-Dagatan|79,-,-,-`}
};
// build lookup tables
for (const k in EXP){
  const e=EXP[k]; e.m={};
  const set=new Set(e.cols);
  e.rows.split("\n").forEach(r=>{
    const [name,vals]=r.split("|"); set.add(name);
    vals.split(",").forEach((v,i)=>{ if(v!=="-") e.m[name+"\u0000"+e.cols[i]]=Number(v); });
  });
  e.plazas=[...set];
}
function fare(k,a,b){
  const m=EXP[k].m;
  if(a===b) return null;
  if((b+"\u0000"+a) in m) return m[b+"\u0000"+a];
  if((a+"\u0000"+b) in m) return m[a+"\u0000"+b];
  return null;
}
const CLS={1:1,2:2.5,3:3};
// Class 2 and 3 multipliers per expressway. Exact (2x, 3x) where the TRB matrix confirms it; NLEX family is an estimate.
const CLS_BY={SLEX:{2:2,3:3},SKY3:{2:2,3:3},STAR:{2:2,3:3},CALAX:{2:2,3:3}};
const mult=(k,c)=>(CLS_BY[k]&&CLS_BY[k][c])||CLS[c];

