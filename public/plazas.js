// Approximate toll plaza / interchange coordinates [lat, lng].
// The app picks the plaza NEAREST to where your route joins and leaves each expressway,
// so these only need to be roughly right. Correct any that look off (right-click a spot
// in Google Maps to copy its coordinates).
const PLAZAS = {
 NLEX:{"Balintawak":[14.6575,120.9990],"Mindanao Ave.":[14.7000,121.0080],"Karuhatan":[14.6950,120.9750],"Valenzuela":[14.7085,120.9880],
  "Meycauayan":[14.7455,120.9790],"Marilao":[14.7700,120.9620],"Ciudad de Victoria":[14.7930,120.9500],"Bocaue":[14.8060,120.9400],
  "Tambubong":[14.8200,120.9330],"Balagtas":[14.8390,120.9060],"Sta. Rita":[14.8590,120.8850],"Pulilan":[14.9040,120.8430],
  "San Simon":[14.9950,120.7780],"San Fernando":[15.0550,120.6980],"Mexico":[15.0870,120.6780],"Angeles":[15.1400,120.6120],
  "Dau":[15.1790,120.5940],"Sta. Ines":[15.2230,120.5790],"Tabang":[14.8380,120.8700],
  "Mabalacat (Mabiga)":[15.2060,120.5650],"Clark South":[15.1680,120.5270],"Porac":[15.0980,120.5110],"Floridablanca":[14.9980,120.4980],
  "Dinalupihan":[14.8900,120.4560],"Tipo/Subic":[14.8330,120.3420],"Clark North":[15.2390,120.5550],"Dolores":[15.2520,120.5750],
  "Bamban/New Clark City":[15.3200,120.5650],"Concepcion":[15.3500,120.6050],"Hacienda Luisita":[15.4370,120.6130],"Tarlac":[15.4650,120.6230]},
 TPLEX:{"La Paz":[15.4750,120.6450],"Victoria":[15.5700,120.6550],"Gerona":[15.6080,120.6450],"Paniqui":[15.6680,120.6280],"Moncada":[15.7350,120.6170],
  "Carmen":[15.8850,120.5970],"Urdaneta":[15.9730,120.5970],"Binalonan":[16.0400,120.5950],"Pozorrubio":[16.1130,120.5530],"Sison":[16.1750,120.5200],"Rosario/Baguio":[16.2300,120.4900]},
 SLEX:{"Buendia":[14.5560,121.0080],"Magallanes":[14.5405,121.0180],"Magallanes (Skyway)":[14.5405,121.0180],"Amorsolo":[14.5490,121.0150],"Don Bosco":[14.5480,121.0140],
  "NAIAX":[14.5230,121.0250],"C-5":[14.5070,121.0390],"Merville":[14.4950,121.0330],"Bicutan":[14.4870,121.0440],"Sucat":[14.4560,121.0450],"Alabang":[14.4230,121.0460],
  "Filinvest":[14.4140,121.0440],"MCX":[14.3970,121.0460],"Susana Heights":[14.3820,121.0480],"San Pedro":[14.3540,121.0570],"Southwoods":[14.3340,121.0540],
  "Carmona":[14.3190,121.0610],"Mamplasan":[14.3000,121.0770],"Sta. Rosa":[14.2820,121.0920],"ABI/Greenfield":[14.2580,121.1060],"Cabuyao":[14.2440,121.1170],
  "Silangan":[14.2280,121.1300],"Calamba":[14.2070,121.1450]},
 SKY3:{"Buendia":[14.5560,121.0080],"Quirino":[14.5800,121.0000],"Plaza Dilao":[14.5870,121.0000],"Nagtahan":[14.5990,121.0050],"E. Rodriguez":[14.6130,121.0180],
  "Quezon Ave.":[14.6240,121.0130],"Balintawak":[14.6570,121.0050],"NLEX":[14.6700,120.9990]},
 STAR:{"Calamba":[14.2070,121.1450],"Sto. Tomas":[14.0950,121.1450],"Tanauan":[14.0650,121.1250],"Malvar":[14.0300,121.1480],"Sto. Toribio":[13.9850,121.1500],
  "Lipa":[13.9350,121.1400],"Ibaan":[13.8400,121.1200],"Batangas":[13.7850,121.0700]},
 CALAX:{"Greenfield":[14.2950,121.0700],"Technopark":[14.2750,121.0500],"Laguna Blvd.":[14.2600,121.0400],"Sta. Rosa/Tagaytay":[14.2400,121.0200],
  "Silang East":[14.2250,120.9950],"Silang Interchange":[14.2300,120.9600]},
 CAVITEX:{"Parañaque":[14.5000,120.9900],"Bacoor/Zapote":[14.4650,120.9650],"Kawit":[14.4400,120.9100],"Sucat Rd./Dr. A. Santos Ave.":[14.4800,120.9950],"C5 Rd. Ext./C.P. Garcia":[14.4850,121.0000]},
 NAIAX:{"Skyway":[14.5230,121.0230],"Andrews Ave./Terminal 3":[14.5210,121.0150],"NAIA Terminal 3":[14.5200,121.0160],"Aurora Blvd. (Tramo)":[14.5250,121.0050],
  "NAIA Terminal 1":[14.5090,121.0030],"NAIA Terminal 2":[14.5120,120.9950],"Entertainment City":[14.5180,120.9850],"Macapagal Blvd.":[14.5150,120.9880],"CAVITEX":[14.5080,120.9900]},
 CONN:{"España":[14.6130,120.9930],"Magsaysay":[14.6020,121.0050],"C-3 Road/5th Ave.":[14.6440,120.9830]},
 HARBOR:{"Karuhatan/Valenzuela":[14.6950,120.9750],"C-3 Road/5th Ave.":[14.6440,120.9830],"R-10/Port of Manila":[14.6400,120.9550],"Malabon/Dagat-Dagatan":[14.6550,120.9650]}
};
