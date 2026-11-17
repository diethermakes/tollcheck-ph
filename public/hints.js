// Local route knowledge.
// The app already tries every sensible entrance and exit on its own. Add a hint here when you know
// drivers usually use a specific entrance and exit between two areas and the app keeps missing it.
// Each hint works in both directions.
//   from / to : [latitude, longitude] of the middle of each area (right-click a spot in Google Maps to copy it)
//   km        : how far from that middle point a trip can start or end and still use the hint
//   exp       : expressway key from tolls.js (NLEX, TPLEX, SLEX, SKY3, STAR, CALAX, CAVITEX, NAIAX, CONN, HARBOR)
//   enter/exit: plaza names exactly as they appear in tolls.js, written for the "from" to "to" direction
const HINTS = [
  { note:"West Valenzuela to east Quezon City and Marikina, via the Mindanao Avenue exit",
    from:[14.690,120.968], fromKm:4, to:[14.640,121.080], toKm:7, exp:"NLEX", enter:"Karuhatan", exit:"Mindanao Ave." },
  { note:"Las Piñas and Zapote to Kawit, via CAVITEX (checked against Google Maps)",
    from:[14.440,120.995], fromKm:4, to:[14.446,120.905], toKm:4, exp:"CAVITEX", enter:"Bacoor/Zapote", exit:"Kawit" }
];
