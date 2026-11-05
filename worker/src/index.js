const upstream = {
  search: "https://api-search.plaync.com/aion2global/search/v2/character",
  info: "https://aion2.plaync.com/api/character/info",
  equipment: "https://aion2.plaync.com/api/character/equipment",
  item: "https://aion2.plaync.com/api/character/equipment/item",
};
const allowed = (origin, env) =>
  (env.ALLOWED_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173")
    .split(",")
    .includes(origin)
    ? origin
    : "";
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url),
      origin = allowed(request.headers.get("Origin") || "", env);
    if (request.method === "OPTIONS")
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET,OPTIONS",
        },
      });
    if (!origin) return new Response("Origin not allowed", { status: 403 });
    const kind = url.pathname.split("/").filter(Boolean).at(-1);
    if (!upstream[kind]) return new Response("Not found", { status: 404 });
    const region = url.searchParams.get("region") || "la";
    if (!["la", "nae", "naw", "eu", "as"].includes(region))
      return new Response("Invalid region", { status: 400 });
    const target = new URL(upstream[kind]);
    if (kind === "search") {
      const nick = (url.searchParams.get("nick") || "").trim();
      if (!/^[\p{L}\p{N}_-]{2,20}$/u.test(nick))
        return new Response("Invalid nick", { status: 400 });
      target.searchParams.set("keyword", nick);
      target.searchParams.set("localeInfo", "pt-BR");
    } else {
      const id = url.searchParams.get("characterId") || "",
        server = url.searchParams.get("serverId") || "";
      if (!id || !/^\d{4}$/.test(server))
        return new Response("Invalid character", { status: 400 });
      for (const key of [
        "characterId",
        "serverId",
        "id",
        "slotPos",
        "enchantLevel",
        "exceedLevel",
        "boardId",
        "_t",
      ]) {
        const value = url.searchParams.get(key);
        if (value) target.searchParams.set(key, value);
      }
      target.searchParams.set("lang", "pt-BR");
    }
    target.searchParams.set("region", region);
    const fresh = kind !== "search" && url.searchParams.has("_t"),
      cache = caches.default,
      key = new Request(target.toString(), request),
      cached = fresh ? null : await cache.match(key);
    if (cached) return cors(cached, origin);
    const response = await fetch(target, {
        headers: {
          Accept: "application/json",
          "User-Agent": "ASEO-Gear-Planner/1.0",
        },
      }),
      out = new Response(response.body, response);
    out.headers.set(
      "Cache-Control",
      fresh ? "no-store" : kind === "search" ? "public,max-age=60" : "public,max-age=300",
    );
    if (!fresh) ctx.waitUntil(cache.put(key, out.clone()));
    return cors(out, origin);
  },
};
function cors(response, origin) {
  const r = new Response(response.body, response);
  r.headers.set("Access-Control-Allow-Origin", origin);
  r.headers.set("Vary", "Origin");
  r.headers.set("X-Content-Type-Options", "nosniff");
  return r;
}
