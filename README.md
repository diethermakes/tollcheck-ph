# Toll Check PH

Know your toll before you drive.

Toll Check PH shows how much you will pay in toll fees for a trip on Philippine expressways. Type where you are coming from and where you are going, and it shows the route on a map, the toll plazas where you enter and exit, and the total.

**Try it here: https://tollcheckph.netlify.app**

It is free, needs no account, and works on phones and computers.

## Why it exists

Google Maps and Waze are great for directions, but they do not show the current toll amount for Philippine expressways. Toll Check PH fills that gap, so you can prepare your RFID load or cash before the trip.

## How to use it

1. Type your starting point, or tap the location button to start from where you are.
2. Type your destination and pick it from the suggestions.
3. See your total toll, with a breakdown for each expressway.
4. If more than one route is shown, pick the one that matches the route you will drive.
5. Tap **Open in Google Maps** or **Open in Waze** to start navigating.

You can also paste a Google Maps share link instead of typing the trip.

## What you get

- **Total toll** for the whole trip
- **Entry and exit plaza** for each expressway, marked on the map
- **Which RFID you need** for each expressway (Easytrip or Autosweep)
- **Vehicle class** options: Class 1 (cars, SUVs, vans), Class 2 (buses, light trucks), Class 3 (large trucks)
- **Travel time and distance**
- **Light and dark mode**
- **Popular trips** to get started, and **recent trips** for quick reuse, which you can remove one by one or clear all at once
- **Home screen shortcut:** on your phone, use your browser's "Add to Home Screen" option to open it like an app

## Expressways covered

| Expressway | RFID |
|---|---|
| NLEX and SCTEX | Easytrip |
| TPLEX | Easytrip |
| NLEX Connector and NLEX Harbor Link | Easytrip |
| CAVITEX and the CAVITEX-C5 Link | Easytrip |
| CALAX (now up to Governor's Drive) | Easytrip |
| SLEX, Skyway and MCX | Autosweep |
| Skyway Stage 3 | Autosweep |
| STAR Tollway | Autosweep |
| NAIAX | Autosweep |

## How accurate is it?

Toll rates come from the latest Toll Regulatory Board (TRB) toll matrices, checked on 17 November 2026, with VAT included: NLEX and SCTEX (20 January 2026), Skyway and SLEX (1 July 2026), STAR (1 July 2026), CAVITEX (9 May 2026) and CALAX (9 August 2026). Skyway Stage 3, TPLEX, NAIAX, the NLEX Connector and Harbor Link had no rate change in 2026.

Please keep these in mind:

- **Class 1 rates are exact.** Class 2 and 3 are exact on Skyway, SLEX, STAR and CALAX, and estimates elsewhere.
- **Travel time has no live traffic.** Use Google Maps or Waze for the actual travel time.
- **You get both free and expressway options where they exist.** The site also checks for expressways between your start and destination, including short ones inside Metro Manila, and lists them next to the no-toll route.
- **The suggested route can differ from Google Maps or Waze.** If it does, pick another route option, or change the entry and exit plaza under "Entering or exiting somewhere else?".
- **Rates can change.** The posted rate at the toll plaza is always the final amount.

## Your privacy

- No account, no ads, no tracking.
- The places you search and your route points are sent to the map services (OpenStreetMap, Photon and OSRM) only to find places and draw your route.
- Your recent trips and your light or dark mode choice are saved on your own device, not on a server.
- Your location is used only when you tap the location button, and only for that trip.

## Common questions

**Is it free?**
Yes.

**Does it work outside Luzon?**
Not yet. It covers the major Luzon expressways listed above.

**The toll does not match what I paid. What should I do?**
Check that the entry and exit plaza shown match where you actually entered and exited. If they match and the amount is still different, please email tollcheckph@gmail.com so the rate can be corrected.

**Can it navigate for me?**
No. It tells you the toll, then hands the trip to Google Maps or Waze for navigation.

## Report a problem or suggest a feature

Found a wrong toll amount, a wrong plaza, or a missing expressway? Email **tollcheckph@gmail.com** and include:

- Your starting point and destination
- What the site showed
- What you expected to see, or what you actually paid

Suggestions for new features are welcome at the same address.

## For developers

The site is plain HTML, CSS and JavaScript with no build step, hosted on Netlify.

| File | Purpose |
|---|---|
| public/index.html | Page layout |
| public/styles.css | Colors, light and dark themes, layout |
| public/app.js | Map, search, routing, route options, toll breakdown |
| public/tolls.js | TRB toll matrices. Update this when rates change. |
| public/plazas.js | Toll plaza coordinates |
| public/detect.js | Works out which expressways and plazas a route uses |
| public/hints.js | Local route knowledge: known entrance and exit pairs between two areas |
| public/theme.js | Remembers the light or dark mode choice |
| public/manifest.webmanifest and the icon files | App name, colors and logo for the browser tab and home screen |
| netlify/functions/resolve.mjs | Opens short Google Maps links |
| netlify.toml | Hosting settings and security headers |

To run your own copy, fork this repository and import it into Netlify. No build command or API keys are needed.

Routing uses the public OSRM servers, which are suitable for light use only. For heavier traffic, host your own OSRM server and update `ROUTERS` in public/app.js.

## Credits

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Routing by [OSRM](https://project-osrm.org/)
- Place search by [Photon](https://photon.komoot.io/)
- Map display by [Leaflet](https://leafletjs.com/)
- Toll rates from the Toll Regulatory Board

Toll Check PH is an independent project and is not affiliated with the Toll Regulatory Board or any expressway operator.
