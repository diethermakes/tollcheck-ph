# Toll Check PH

A map-based toll calculator for Philippine expressways. Type a start and destination, see the route on the map, and get the toll for each expressway with entrance and exit plazas detected automatically.

Everything here runs on free services. No API keys are needed.

## Files
- public/index.html: the site (map, search, routing, toll ticket)
- public/tolls.js: TRB Class 1 toll matrices (effective 1 Feb 2026). Update this when rates change.
- public/plazas.js: toll plaza coordinates used to detect entrance and exit
- public/detect.js: reads the route and works out which expressways and plazas it uses
- netlify/functions/resolve.mjs: opens maps.app.goo.gl short links on the server
- netlify.toml: Netlify settings

## Deploy for free (GitHub + Netlify)
1. Create a GitHub account and a new repository. Upload everything in this folder, keeping the folder structure.
2. Sign in at netlify.com with GitHub. Choose Add new site > Import an existing project and pick the repository.
3. Leave the build command empty and click Deploy. Netlify reads netlify.toml on its own.
4. Open your new site link and test a trip, for example Quezon City to Baguio (expected Class 1 total: 981 pesos).
5. Optional: rename the site or add a custom domain under Domain management.

Use the GitHub method, not drag-and-drop. Drag-and-drop does not run the short-link function.

## First things to check after deploying
1. Run 5 to 10 trips you know well and compare the detected plazas with reality.
2. If a plaza is picked wrongly, correct its coordinates in public/plazas.js. The current coordinates are approximate.
3. If an expressway is not detected at all, the road name in OpenStreetMap may differ. Add the name to classifyRoad() in public/detect.js.
4. Re-verify public/tolls.js against the latest TRB matrix before you promote the site.

## Free service limits
- Routing uses public OSRM demo servers. They are fine for testing and early users but have no uptime guarantee. When traffic grows, host your own OSRM server or switch to a paid routing plan, then change ROUTERS in index.html.
- Search uses Photon and the map uses OpenStreetMap tiles. Both are free with fair-use limits and require the attribution already shown on the page.

## Known gaps
- Class 2 and 3 are estimates (x2.5 and x3 of Class 1).
- Skyway at-grade versus elevated pricing is simplified.
- No live traffic or turn-by-turn. The Open in Google Maps and Open in Waze buttons hand off navigation.
