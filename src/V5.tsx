import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArrowRight, Check, ChevronDown, CircleGauge, Download, Gem, ImagePlus, Layers3, Menu, Minus, PawPrint, Plus, RotateCcw, Search, Shield, Sparkles, Swords, Target, Upload, X } from "lucide-react";
import { additionsForSlot } from "./additionalCatalog";
import { applyOfficialImport, fetchCharacter, pickCharacter, searchCharacters } from "./aionApi";
import { addArcanaPoint, attemptsLeft, initialBuild, pointsAvailable, pointsUsed, projectedTotals, slots, type Build, type Frame, type Item } from "./domain";
import { exportBackup, loadState, parseBackup, saveState } from "./storage";
import { arcanaTargetsFor, classGoals, strategyFor, visibleSkills } from "./classContext";
import "./V5.css";

type View = "armory" | "arcana" | "progress" | "combat" | "collection";
const clone = <T,>(v:T):T => structuredClone(v);
const defaultFrame:Frame={x:0,y:0,scale:1,flip:false,background:.78,light:.8};
const nav:[View,React.ElementType,string][]=[
  ["armory",Shield,"Arsenal"],["arcana",Gem,"Arcanas"],["progress",Target,"Evolução"],["combat",Swords,"Combate"],["collection",PawPrint,"Coleção"]
];
const iconFallback:Record<string,string>={Arma:"⚔",Escudo:"◈",Elmo:"♜",Ombreiras:"◆",Peitoral:"♢",Manoplas:"✥",Calças:"⌁",Botas:"⌄",Capa:"◒",Cinto:"═",Asas:"⋈",Colar:"◇","Brinco E":"◖","Brinco D":"◗","Anel E":"○","Anel D":"○","Bracelete E":"◐","Bracelete D":"◑",Amuleto:"✦","Runa E":"ᛟ","Runa D":"ᛟ"};

export default function V5(){
  const [current,setCurrent]=useState(()=>clone(initialBuild));
  const [planned,setPlanned]=useState(()=>clone(initialBuild));
  const [mode,setMode]=useState<"current"|"planned">("current");
  const [view,setView]=useState<View>("armory");
  const [selected,setSelected]=useState<string>();
  const [image,setImage]=useState<string>();
  const [frame,setFrame]=useState(defaultFrame);
  const [ready,setReady]=useState(false);
  const [toast,setToast]=useState("");
  const shown=mode==="current"?current:planned;
  const totals=useMemo(()=>mode==="current"?current.totals:projectedTotals(current,planned),[current,planned,mode]);
  useEffect(()=>{loadState().then(s=>{if(s){setCurrent(s.current);setPlanned(s.planned);setImage(s.image);setFrame(s.frame)}setReady(true)}).catch(()=>setReady(true))},[]);
  useEffect(()=>{if(!ready)return;const t=setTimeout(()=>saveState({current,planned,image,frame,version:1}),300);return()=>clearTimeout(t)},[current,planned,image,frame,ready]);
  const notify=(s:string)=>{setToast(s);setTimeout(()=>setToast(""),2200)};
  const importImage=(f?:File)=>{if(!f||!/^image\/(png|jpeg|webp)$/.test(f.type))return notify("Use PNG, JPEG ou WebP");const r=new FileReader();r.onload=()=>{setImage(String(r.result));setFrame(defaultFrame);notify("Retrato atualizado")};r.readAsDataURL(f)};
  const updateItem=(item:Item|undefined)=>{setPlanned(b=>({...b,items:{...b.items,[selected!]:item}}));setMode("planned")};
  return <main className="pad5" style={{"--scene":frame.background,"--glow":frame.light} as React.CSSProperties}>
    <div className="scene"/><div className="sceneVeil"/><div className="sceneRings"/>
    <aside className="v5rail">
      <div className="v5mark"><Shield/><span>PAD</span></div>
      <nav>{nav.map(([id,Icon,label])=><button key={id} className={view===id?"active":""} onClick={()=>{setView(id);setSelected(undefined)}}><Icon/><span>{label}</span></button>)}</nav>
      <button className="railMenu"><Menu/></button>
    </aside>
    <div className="v5shell">
      <header className="v5header">
        <div className="wordmark"><b>PAD PLAN</b><span>Personal Aion Development</span></div>
        <CharacterSearch base={current} onLoad={b=>{setCurrent(b);setPlanned(clone(b));setMode("current");setView("armory");notify(`${b.profile.name} carregado`)}}/>
        <div className="headerTools"><span className="syncDot"><i/>{ready?"salvo localmente":"carregando"}</span><button onClick={()=>setView("progress")}><CircleGauge/></button></div>
      </header>
      <div className="contextbar">
        <div className="crumb"><span>DEUS ARCHIVE</span><i/><b>{({armory:"Arsenal",arcana:"Arcanas",progress:"Plano de evolução",combat:"Análise de combate",collection:"Coleção"} as const)[view]}</b></div>
        <div className="buildSwitch"><button className={mode==="current"?"on":""} onClick={()=>setMode("current")}>Atual</button><button className={mode==="planned"?"on":""} onClick={()=>setMode("planned")}>Planejada <Sparkles/></button></div>
        <div className="miniStats"><span>GS <b>{shown.gs.toLocaleString("pt-BR")}</b></span><span>CP <b>{shown.cp.toLocaleString("pt-BR")}</b></span></div>
      </div>
      <AnimatePresence mode="wait">
        {view==="armory"&&<Armory key="armory" build={shown} image={image} frame={frame} setFrame={setFrame} onImage={importImage} selected={selected} onSelect={setSelected} totals={totals}/>} 
        {view==="arcana"&&<ArcanaStudio key="arcana" current={current} planned={planned} setPlanned={setPlanned} notify={notify}/>} 
        {view==="progress"&&<Progress key="progress" current={current} planned={planned} image={image} frame={frame} notify={notify}/>} 
        {view==="combat"&&<FeaturePage key="combat" icon={<Swords/>} kicker="COMBAT OBSERVATORY" title="Combate, sem ruído" text="O módulo ao vivo será conectado ao companion local. Aqui não existem números simulados: importe uma sessão quando tiver um arquivo real."/>}
        {view==="collection"&&<FeaturePage key="collection" icon={<PawPrint/>} kicker="ATIEL COLLECTION" title="Tudo que acompanha sua jornada" text="Pets, skins e conquistas entrarão aqui como coleção do personagem carregado — não como catálogo genérico."/>}
      </AnimatePresence>
    </div>
    <AnimatePresence>{selected&&<ItemSheet slot={selected} item={planned.items[selected]} build={planned} onClose={()=>setSelected(undefined)} onChange={updateItem}/>}</AnimatePresence>
    <AnimatePresence>{toast&&<motion.div className="v5toast" initial={{y:16,opacity:0}} animate={{y:0,opacity:1}} exit={{y:12,opacity:0}}><Check/>{toast}</motion.div>}</AnimatePresence>
  </main>
}

function CharacterSearch({base,onLoad}:{base:Build;onLoad:(b:Build)=>void}){
  const [nick,setNick]=useState(base.profile.name),[server,setServer]=useState(base.profile.serverName),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const run=async()=>{if(!nick.trim()||!server.trim())return;setBusy(true);setError("");try{const hits=await searchCharacters(nick.trim());const hit=pickCharacter(hits,nick,server);if(!hit)throw Error("Personagem não encontrado nesse servidor");onLoad(applyOfficialImport(base,await fetchCharacter(hit)))}catch(e){setError((e as Error).message)}finally{setBusy(false)}};
  return <div className={`heroLookup ${error?"error":""}`}><Search/><input aria-label="Nickname" value={nick} onChange={e=>setNick(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run()} placeholder="Nome do personagem"/><span/><input aria-label="Servidor" value={server} onChange={e=>setServer(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run()} placeholder="Servidor"/><button onClick={run} disabled={busy}>{busy?"Buscando…":"Carregar"}<ArrowRight/></button>{error&&<em>{error}</em>}</div>
}

function Armory({build,image,frame,setFrame,onImage,selected,onSelect,totals}:{build:Build;image?:string;frame:Frame;setFrame:(f:Frame)=>void;onImage:(f?:File)=>void;selected?:string;onSelect:(s:string)=>void;totals:Record<string,number>}){
  const portrait=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;fx:number;fy:number}|null>(null);
  const equipped=slots.filter(s=>build.items[s]);
  return <motion.section className="armory5" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
    <div className="profileStrip"><div><span>{build.profile.serverName} · {build.profile.region.toUpperCase()}</span><h1>{build.profile.name}</h1><p>{build.profile.className} {build.profile.level?`· Nível ${build.profile.level}`:""}</p></div><div className="loadoutProgress"><span><b>{equipped.length}</b> / {slots.length}</span><i><b style={{width:`${equipped.length/slots.length*100}%`}}/></i><small>slots reconhecidos</small></div></div>
    <div className="armoryCanvas">
      <div className="slotOrbit leftSlots">{slots.slice(0,11).map((s,i)=><GearToken key={s} slot={s} item={build.items[s]} index={i} selected={selected===s} onClick={()=>onSelect(s)}/>)}</div>
      <section className="heroStage">
        <div className="heroAura"/><div className="portraitCrown"><i/><i/><i/></div>
        <div className={`portrait5 ${image?"filled":""}`} ref={portrait} onPointerDown={e=>{if((e.target as HTMLElement).closest("button,label,input"))return;drag.current={x:e.clientX,y:e.clientY,fx:frame.x,fy:frame.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current)setFrame({...frame,x:drag.current.fx+e.clientX-drag.current.x,y:drag.current.fy+e.clientY-drag.current.y})}} onPointerUp={()=>drag.current=null}>
          {image?<img src={image} style={{transform:`translate(${frame.x}px,${frame.y}px) scale(${frame.flip?-frame.scale:frame.scale},${frame.scale})`}}/>:<div className="portraitEmpty"><ImagePlus/><b>Seu personagem entra aqui</b><span>PNG transparente ou screenshot</span><label>Escolher imagem<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>onImage(e.target.files?.[0])}/></label></div>}
        </div>
        {image&&<div className="portraitTools"><label><Minus/><input aria-label="Zoom" type="range" min=".45" max="3" step=".05" value={frame.scale} onChange={e=>setFrame({...frame,scale:+e.target.value})}/><Plus/></label><button onClick={()=>setFrame({...frame,flip:!frame.flip})}>Espelhar</button><button onClick={()=>setFrame(defaultFrame)}><RotateCcw/></button><label className="replace"><ImagePlus/><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>onImage(e.target.files?.[0])}/></label></div>}
        <div className="skillPulse">{visibleSkills(build,totals,3).map(skill=><span key={skill.id}><small>{skill.label}</small><b>{skill.value}</b></span>)}</div>
      </section>
      <div className="slotOrbit rightSlots">{slots.slice(11).map((s,i)=><GearToken key={s} slot={s} item={build.items[s]} index={i} selected={selected===s} onClick={()=>onSelect(s)}/>)}</div>
    </div>
  </motion.section>
}

function GearToken({slot,item,index,selected,onClick}:{slot:string;item?:Item;index:number;selected:boolean;onClick:()=>void}){return <motion.button className={`gearToken ${item?"equipped":"empty"} ${selected?"selected":""}`} onClick={onClick} initial={{opacity:0,x:index%2?8:-8}} animate={{opacity:1,x:0}} transition={{delay:index*.025}}><span className="gearIcon">{item?.icon?<img src={item.icon}/>:<i>{iconFallback[slot]}</i>}{item&&<em>+{item.enhancement}</em>}</span><span className="gearCopy"><small>{slot}</small><b>{item?.name||"Slot vazio"}</b>{item&&<em>{item.rarity}</em>}</span><ChevronDown/></motion.button>}

function ItemSheet({slot,item,build,onClose,onChange}:{slot:string;item?:Item;build:Build;onClose:()=>void;onChange:(i:Item|undefined)=>void}){
  const blank:Item={id:crypto.randomUUID(),slot,name:"",rarity:"A conferir",enhancement:0,attributes:[],additionals:[],notes:"",source:"Registro manual",updated:new Date().toISOString().slice(0,10),preserve:false};
  const [draft,setDraft]=useState<Item>(()=>clone(item||blank));const strategy=strategyFor(build.profile.className);const options=additionsForSlot(slot,draft.additionals,strategy?.ringSkills);
  const setAdd=(index:number,value:string)=>setDraft(d=>({...d,additionals:d.additionals.map((a,i)=>i===index?value:a)}));
  return <motion.div className="sheetShade" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e=>e.target===e.currentTarget&&onClose()}><motion.aside className="itemSheet" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",damping:30,stiffness:280}}><header><div><small>PLANEJAMENTO · {build.profile.className.toUpperCase()} · {slot.toUpperCase()}</small><h2>{item?"Ajustar equipamento":"Adicionar equipamento"}</h2></div><button onClick={onClose}><X/></button></header><div className="itemHero"><span className="sheetIcon">{draft.icon?<img src={draft.icon}/>:iconFallback[slot]}</span><div><label>Nome do item<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Nome original do item"/></label><div className="split"><label>Raridade<select value={draft.rarity} onChange={e=>setDraft({...draft,rarity:e.target.value})}><option>A conferir</option><option>Rare</option><option>Special</option><option>Unique</option><option>Legend</option></select></label><label>Aprimoramento<input type="number" min="0" value={draft.enhancement} onChange={e=>setDraft({...draft,enhancement:+e.target.value})}/></label></div></div></div><section className="sheetSection"><div className="sectionTitle"><span><Layers3/>Adicionais planejados</span><button onClick={()=>setDraft({...draft,additionals:[...draft.additionals,options[0]?.label||"A conferir"]})}><Plus/>Adicionar linha</button></div>{strategy&&<p className="classHint">{strategy.label}: {slot.startsWith("Anel")?`skills sugeridas — ${strategy.ringSkills.join(" · ")}`:`prioridades gerais — ${strategy.stats.join(" · ")}`} <a href={strategy.source.url} target="_blank" rel="noreferrer">fonte</a></p>}{draft.additionals.length?draft.additionals.map((a,i)=><div className="addRow" key={i}><span>{String(i+1).padStart(2,"0")}</span><select value={a} onChange={e=>setAdd(i,e.target.value)}>{options.map(o=><option key={o.id}>{o.label}</option>)}{!options.some(o=>o.label===a)&&<option>{a}</option>}</select><button onClick={()=>setDraft({...draft,additionals:draft.additionals.filter((_,x)=>x!==i)})}><X/></button></div>):<p className="emptyCopy">Nenhum adicional planejado. Adicione somente linhas confirmadas ou marque como “a conferir”.</p>}</section><section className="sheetSection"><label>Notas<textarea value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})} placeholder="Objetivo, origem, condição de troca…"/></label></section><footer>{item&&<button className="remove" onClick={()=>{onChange(undefined);onClose()}}>Remover do slot</button>}<button className="saveItem" disabled={!draft.name.trim()} onClick={()=>{onChange(draft);onClose()}}>Salvar na planejada<ArrowRight/></button></footer></motion.aside></motion.div>
}

function ArcanaStudio({current,planned,setPlanned,notify}:{current:Build;planned:Build;setPlanned:React.Dispatch<React.SetStateAction<Build>>;notify:(s:string)=>void}){
  const projected=projectedTotals(current,planned);
  const enhance=(cardId:string,lineId:string,lineName:string)=>{
    try{
      setPlanned(b=>({...b,arcanas:b.arcanas.map(x=>x.id===cardId?addArcanaPoint(x,lineId):x)}));
      notify(`${lineName} recebeu +1`);
    }catch(e){notify((e as Error).message)}
  };
  return <motion.section className="arcana5" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
    <div className="pageIntro"><div><span>RESONANCE MATRIX</span><h1>Arcanas</h1><p>Cada ponto tem um destino. O limite da carta nunca é tratado como bônus em todas as linhas.</p></div><div className="arcanaTotals">{Object.entries(projected).slice(0,3).map(([id,v])=><span key={id}><small>{planned.skillNames?.[id]||id}</small><b>{v}</b></span>)}</div></div>
    <div className="arcanaGrid5">{planned.arcanas.map(a=>{
      const used=pointsUsed(a),avail=pointsAvailable(a);
      const targets=arcanaTargetsFor(planned,a.name);
      return <article key={a.id} className="arcanaCard5"><div className="cardArt">{a.icon&&<img src={a.icon}/>}<span>+{a.enhancement}</span><i>{a.family}</i></div><div className="cardBody"><h3>{a.name}</h3>{targets.length>0&&<p className="arcanaHint">Alvos de {planned.profile.className}: {targets.join(" · ")}</p>}<div className="pointRail"><span><b>{used}</b> / {avail} pontos</span><i><b style={{width:`${Math.min(100,used/avail*100)}%`}}/></i></div><div className="arcanaLines">{a.lines.map(line=><button key={line.id} disabled={attemptsLeft(a)<=0} onClick={()=>enhance(a.id,line.id,line.name)}><span>{line.name}</span><b>+{line.bonus}</b><Plus/></button>)}</div><footer><span>{attemptsLeft(a)} tentativa{attemptsLeft(a)===1?"":"s"} restante{attemptsLeft(a)===1?"":"s"}</span><em>{used>avail?"Inválida":"Viável"}</em></footer></div></article>
    })}</div>
  </motion.section>
}

function Progress({current,planned,image,frame,notify}:{current:Build;planned:Build;image?:string;frame:Frame;notify:(s:string)=>void}){const totals=projectedTotals(current,planned),goals=classGoals(planned,totals),strategy=strategyFor(planned.profile.className);const backup=()=>{const blob=exportBackup({current,planned,image,frame,version:1});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="pad-plan-backup.json";a.click();URL.revokeObjectURL(a.href)};return <motion.section className="progress5" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><div className="pageIntro"><div><span>BUILD ROADMAP · {planned.profile.className.toUpperCase()}</span><h1>Próximos movimentos</h1><p>{strategy?`${strategy.role} · ${strategy.weapon} · ${strategy.source.context}`:"Metas derivadas somente das habilidades importadas deste personagem."}</p></div><div className="backupActions"><button onClick={backup}><Download/>Exportar backup</button><label><Upload/>Importar<input type="file" accept="application/json" onChange={e=>{const f=e.target.files?.[0];if(f)f.text().then(t=>{try{parseBackup(t);notify("Backup válido. Importação protegida disponível.")}catch{notify("Arquivo inválido; nada foi alterado")}})}}/></label></div></div><div className="roadmap">{goals.map((goal,i)=><article key={goal.title}><span>{String(i+1).padStart(2,"0")}</span><div><small>{goal.kind}</small><h3>{goal.title}</h3><p>{goal.text} · Fonte: {goal.source}</p></div><b>{goal.value||"—"}</b></article>)}</div></motion.section>}

function FeaturePage({icon,kicker,title,text}:{icon:React.ReactNode;kicker:string;title:string;text:string}){return <motion.section className="feature5" initial={{opacity:0,scale:.99}} animate={{opacity:1,scale:1}}><div className="featureGlyph">{icon}</div><span>{kicker}</span><h1>{title}</h1><p>{text}</p><div className="featureState"><Archive/><div><b>Módulo reservado</b><small>A estrutura não inventa telemetria nem integrações.</small></div></div></motion.section>}
