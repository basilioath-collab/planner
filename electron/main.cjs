const { app, BrowserWindow, ipcMain, screen } = require("electron");
const http = require("node:http");
const { readFile, stat, mkdir, writeFile } = require("node:fs/promises");
const { join, extname, normalize } = require("node:path");

const port = 42170;
const root = join(__dirname, "..", "dist");
const mime = { ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".png":"image/png", ".webp":"image/webp", ".svg":"image/svg+xml" };
const shell = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#07100f"><title>PAD PLAN Companion</title><link rel="stylesheet" href="/assets/app.css"></head><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>`;
let mainWindow, overlayWindow, server;

const stateFile = () => join(app.getPath("userData"), "companion-state.json");
async function readState(){ try{return JSON.parse(await readFile(stateFile(),"utf8"))}catch{return {sessions:[],pets:[],bosses:[],events:[]}} }
async function saveState(state){ await mkdir(app.getPath("userData"),{recursive:true}); await writeFile(stateFile(),JSON.stringify(state,null,2),"utf8") }
const jsonBody=req=>new Promise((resolve,reject)=>{let b="";req.on("data",x=>b+=x);req.on("end",()=>{try{resolve(JSON.parse(b||"{}"))}catch(e){reject(e)}})});

function startServer(){
  server=http.createServer(async(req,res)=>{try{
    res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","Content-Type");res.setHeader("Cache-Control","no-store");
    if(req.method==="OPTIONS"){res.writeHead(204);return res.end()}
    const url=new URL(req.url,"http://127.0.0.1");
    if(url.pathname==="/health"){res.writeHead(200,{"Content-Type":"application/json"});return res.end(JSON.stringify({ok:true,app:"PAD PLAN Companion",version:app.getVersion(),capture:"adapter-not-installed"}))}
    if(url.pathname==="/v1/state"&&req.method==="GET"){res.writeHead(200,{"Content-Type":"application/json"});return res.end(JSON.stringify(await readState()))}
    if(url.pathname==="/v1/state"&&req.method==="PUT"){const body=await jsonBody(req);await saveState(body);res.writeHead(204);return res.end()}
    if(url.pathname==="/v1/sessions"&&req.method==="POST"){const body=await jsonBody(req);const state=await readState();state.sessions=[{...body,id:body.id||crypto.randomUUID(),createdAt:new Date().toISOString()},...state.sessions].slice(0,50);await saveState(state);res.writeHead(201,{"Content-Type":"application/json"});return res.end(JSON.stringify(state.sessions[0]))}
    if(url.pathname==="/"||url.pathname==="/index.html"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});return res.end(shell)}
    const rel=normalize(url.pathname).replace(/^([/\\])+/g,"");const file=join(root,rel);if(!file.startsWith(root)||(await stat(file)).isFile()===false)throw Error();res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end("Not found")}}).listen(port,"127.0.0.1");
}
function createMain(){mainWindow=new BrowserWindow({width:1500,height:940,minWidth:1080,minHeight:700,backgroundColor:"#03080e",title:"PAD PLAN",autoHideMenuBar:true,webPreferences:{preload:join(__dirname,"preload.cjs"),contextIsolation:true,nodeIntegration:false}});mainWindow.loadURL(`http://127.0.0.1:${port}`)}
function toggleOverlay(payload={}){
  if(overlayWindow&&!overlayWindow.isDestroyed()){overlayWindow.close();overlayWindow=null;return false}
  const area=screen.getPrimaryDisplay().workAreaSize;overlayWindow=new BrowserWindow({width:360,height:190,x:area.width-380,y:20,frame:false,transparent:true,alwaysOnTop:true,skipTaskbar:true,resizable:true,webPreferences:{contextIsolation:true}});
  const players=(payload.players||[]).slice(0,5);const rows=players.map((p,i)=>`<div><i style="width:${Math.max(4,p.share||0)}%"></i><span>${i+1}. ${String(p.name||"Jogador").replace(/[<>&]/g,"")}</span><b>${Number(p.damage||0).toLocaleString("pt-BR")}</b></div>`).join("");
  overlayWindow.loadURL("data:text/html,"+encodeURIComponent(`<style>body{margin:0;background:#06131de8;color:#e9fbff;font:12px Arial;border:1px solid #63cde744;border-radius:16px;overflow:hidden}header{padding:12px 14px;color:#d7bd78;font-weight:bold}div{height:25px;position:relative;display:flex;align-items:center;justify-content:space-between;padding:0 12px}i{position:absolute;inset:2px auto 2px 4px;background:#4bc8e72c;border-radius:8px}span,b{z-index:1}</style><header>PAD · DPS LOCAL</header>${rows||"<div>Sem sessão ativa</div>"}`));return true
}
app.whenReady().then(()=>{startServer();createMain();ipcMain.handle("overlay:toggle",(_,p)=>toggleOverlay(p));ipcMain.handle("companion:status",()=>({ok:true,port}));app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createMain()})});
app.on("window-all-closed",()=>{server?.close();if(process.platform!=="darwin")app.quit()});
