import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.ASEO_PORT || 4173);
const password = process.env.ASEO_PASSWORD;
if (!password) throw new Error("Defina ASEO_PASSWORD antes de iniciar.");
const root = join(process.cwd(), "dist");
const mime = { ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".png":"image/png", ".webp":"image/webp", ".svg":"image/svg+xml" };
const upstream = { search:"https://api-search.plaync.com/aion2global/search/v2/character", info:"https://aion2.plaync.com/api/character/info", equipment:"https://aion2.plaync.com/api/character/equipment", item:"https://aion2.plaync.com/api/character/equipment/item" };
const attempts = new Map();
const page = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#07100f"><meta name="robots" content="noindex,nofollow"><title>PAD PLAN — Aion 2 Personal Build Analytics</title><link rel="stylesheet" href="/assets/app.css"></head><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>`;

http.createServer(async (req,res)=>{
  try{
    res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Referrer-Policy","no-referrer");res.setHeader("X-Frame-Options","DENY");res.setHeader("Cache-Control","no-store");
    const ip=req.socket.remoteAddress||"unknown", now=Date.now(), recent=(attempts.get(ip)||[]).filter(x=>now-x<60_000);attempts.set(ip,recent);
    const auth=req.headers.authorization||"", expected=`Basic ${Buffer.from(`aseo:${password}`).toString("base64")}`;
    if(auth!==expected){recent.push(now);if(recent.length>20){res.writeHead(429);return res.end("Muitas tentativas.")}res.setHeader("WWW-Authenticate",'Basic realm="ASEO Gear Planner", charset="UTF-8"');res.writeHead(401);return res.end("Autenticação necessária.")}
    const url=new URL(req.url||"/",`http://${req.headers.host}`);
    if(url.pathname.startsWith("/aion-api/"))return proxy(url,res);
    if(url.pathname==="/"||url.pathname==="/index.html"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});return res.end(page)}
    const relative=normalize(url.pathname).replace(/^([/\\])+/,"");const file=join(root,relative);if(!file.startsWith(root)){res.writeHead(403);return res.end("Forbidden")}
    if(!(await stat(file)).isFile())throw Error("not found");res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream","Cache-Control":"public,max-age=3600"});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end("Not found")}
}).listen(port,"127.0.0.1",()=>console.log(`ASEO protegido em http://127.0.0.1:${port}`));

async function proxy(url,res){
  const kind=url.pathname.split("/").at(-1);
  if(kind==="asset"){
    const name=url.searchParams.get("name")||"";if(!/^[A-Za-z0-9_.-]+\.(png|webp)$/i.test(name)){res.writeHead(400);return res.end("Asset inválido")}
    const response=await fetch(`https://assets.playnccdn.com/static-aion2-gamedata/resources/${name}`,{headers:{"User-Agent":"ASEO-Gear-Planner/1.0"}});res.writeHead(response.status,{"Content-Type":response.headers.get("content-type")||"image/png","Cache-Control":"public,max-age=86400"});return res.end(Buffer.from(await response.arrayBuffer()));
  }
  if(!upstream[kind]){res.writeHead(404);return res.end("Endpoint inválido")}
  const region=url.searchParams.get("region")||"la";if(!["la","nae","naw","eu","as"].includes(region)){res.writeHead(400);return res.end("Região inválida")}
  const target=new URL(upstream[kind]);
  if(kind==="search"){const nick=(url.searchParams.get("nick")||"").trim();if(!/^[\p{L}\p{N}_-]{2,20}$/u.test(nick)){res.writeHead(400);return res.end("Nickname inválido")}target.searchParams.set("keyword",nick);target.searchParams.set("localeInfo","pt-BR")}
  else for(const key of ["characterId","serverId","id","slotPos","enchantLevel","exceedLevel","boardId","_t"]){const value=url.searchParams.get(key);if(value)target.searchParams.set(key,value)}
  target.searchParams.set("region",region);if(kind!=="search")target.searchParams.set("lang","pt-BR");
  const response=await fetch(target,{cache:"no-store",headers:{Accept:"application/json","Cache-Control":"no-cache","User-Agent":"ASEO-Gear-Planner/1.0"}});res.writeHead(response.status,{"Content-Type":response.headers.get("content-type")||"application/json","Cache-Control":"no-store"});res.end(Buffer.from(await response.arrayBuffer()));
}
