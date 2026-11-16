// Follows a Google Maps short link (maps.app.goo.gl) and returns the full URL.
// Only Google hosts are allowed, so this can't be used as an open proxy.
const ALLOWED = /^(maps\.app\.goo\.gl|goo\.gl|(www\.)?google\.[a-z.]+|maps\.google\.[a-z.]+|consent\.google\.com)$/i;
export default async (req) => {
  const input = new URL(req.url).searchParams.get("url");
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  let current;
  try { current = new URL(input); } catch { return json({ error: "That link couldn't be read." }, 400); }
  if (!ALLOWED.test(current.hostname)) return json({ error: "Only Google Maps links are supported." }, 400);
  for (let hop = 0; hop < 6; hop++) {
    const res = await fetch(current, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 TollCheckPH" } });
    const loc = res.headers.get("location");
    if (!loc) break;
    const next = new URL(loc, current);
    if (!ALLOWED.test(next.hostname)) break;
    current = next;
    const cont = current.searchParams.get("continue");
    if (current.hostname.startsWith("consent.") && cont) current = new URL(cont);
    if (/\/maps\/(dir|place)|[?&](saddr|daddr|origin|destination)=/.test(current.href)) break;
  }
  if (current.hostname.includes("goo.gl")) return json({ error: "Google didn't return the full route for this link." }, 502);
  return json({ url: current.href });
};
export const config = { path: "/api/resolve" };
