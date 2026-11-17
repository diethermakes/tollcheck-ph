// Follows a Google Maps short link (maps.app.goo.gl) and returns the full URL.
// Security: only an exact list of Google hosts over https is ever contacted,
// so this function can't be used to reach other sites or internal addresses.
const ALLOWED = new Set([
  "maps.app.goo.gl", "goo.gl", "google.com", "www.google.com", "maps.google.com",
  "google.com.ph", "www.google.com.ph", "maps.google.com.ph", "consent.google.com",
]);
const ok = (u) => u.protocol === "https:" && ALLOWED.has(u.hostname.toLowerCase()) && !u.username && !u.port;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff" } });

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Method not allowed." }, 405);
  const input = new URL(req.url).searchParams.get("url") || "";
  if (input.length > 500) return json({ error: "That link is too long." }, 400);
  let current;
  try { current = new URL(input); } catch { return json({ error: "That link couldn't be read." }, 400); }
  if (!ok(current)) return json({ error: "Only Google Maps links are supported." }, 400);
  try {
    for (let hop = 0; hop < 6; hop++) {
      const res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(6000), headers: { "user-agent": "Mozilla/5.0 TollCheckPH" } });
      const loc = res.headers.get("location");
      if (!loc) break;
      let next = new URL(loc, current);
      if (next.hostname === "consent.google.com" && next.searchParams.get("continue")) next = new URL(next.searchParams.get("continue"));
      if (!ok(next)) break;
      current = next;
      if (/\/maps\/(dir|place)|[?&](saddr|daddr|origin|destination)=/.test(current.href)) break;
    }
  } catch {
    return json({ error: "Google Maps didn't respond. Please try again." }, 502);
  }
  if (current.hostname.endsWith("goo.gl")) return json({ error: "Google didn't return the full route for this link." }, 502);
  return json({ url: current.href });
};
export const config = { path: "/api/resolve" };
