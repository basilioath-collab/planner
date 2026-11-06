import { useEffect, useState } from "react";
import { Activity, CircleDot, Coins, PawPrint, PlugZap, Swords, Upload } from "lucide-react";

type CombatEntry = { name: string; damage: number; healing?: number; taken?: number; className?: string };
type Pet = { id: string; name: string; owned: boolean; level: number; souls: number };
type Watch = { id: string; name: string; target: number; last: number; server: string };

const read = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
};

function CompanionState() {
  const [state, setState] = useState<"checking" | "online" | "offline">("checking");
  const check = () => {
    setState("checking");
    fetch("http://127.0.0.1:42170/health", { signal: AbortSignal.timeout(1200) })
      .then(r => { if (!r.ok) throw new Error(); setState("online"); })
      .catch(() => setState("offline"));
  };
  useEffect(check, []);
  return <div className={`companionState ${state}`}>
    <span><PlugZap/><b>{state === "online" ? "Companion conectado" : state === "checking" ? "Verificando companion" : "Modo local"}</b></span>
    <p>{state === "online" ? "Telemetria local disponível neste computador." : "O navegador não captura o jogo. Importe dados ou conecte o companion local quando instalado."}</p>
    <button onClick={check}>Verificar conexão</button>
  </div>;
}

export function CombatLab() {
  const [entries, setEntries] = useState<CombatEntry[]>(() => read("pad:combat", []));
  const [error, setError] = useState("");
  const total = entries.reduce((n, e) => n + e.damage, 0);
  const importFile = (file?: File) => {
    if (!file) return;
    file.text().then(text => {
      try {
        const raw = JSON.parse(text);
        const rows = Array.isArray(raw) ? raw : raw.players;
        if (!Array.isArray(rows)) throw new Error("Formato esperado: lista de jogadores ou { players: [...] }.");
        const clean = rows.map((x: Record<string, unknown>) => ({ name: String(x.name || "Sem nome"), className: String(x.className || ""), damage: Number(x.damage || 0), healing: Number(x.healing || 0), taken: Number(x.taken || 0) })).filter((x: CombatEntry) => Number.isFinite(x.damage));
        setEntries(clean); localStorage.setItem("pad:combat", JSON.stringify(clean)); setError("");
      } catch (e) { setError((e as Error).message || "Arquivo inválido."); }
    });
  };
  return <OperationsShell eyebrow="DEUS COMBAT ARCHIVE" title="Análise de combate" description="Sessões locais, contribuição da party e preparação para overlay nativo.">
    <CompanionState/>
    <div className="opsGrid combatGrid">
      <section className="opsPanel heroMetric"><Activity/><small>DANO REGISTRADO</small><strong>{total.toLocaleString("pt-BR")}</strong><span>{entries.length ? `${entries.length} integrantes` : "Nenhuma sessão importada"}</span></section>
      <section className="opsPanel importPanel"><Upload/><div><b>Importar sessão JSON</b><p>O arquivo permanece neste navegador. Nenhum dado é enviado.</p></div><label>Selecionar arquivo<input type="file" accept="application/json,.json" onChange={e=>importFile(e.target.files?.[0])}/></label>{error && <em>{error}</em>}</section>
    </div>
    <section className="opsPanel ranking"><header><b>Party</b><span>Dano · cura · dano recebido</span></header>{entries.length ? entries.sort((a,b)=>b.damage-a.damage).map((e,i)=><article key={`${e.name}-${i}`}><i>{i+1}</i><div><b>{e.name}</b><small>{e.className || "Classe a conferir"}</small></div><span className="damageBar"><i style={{width:`${total ? e.damage/total*100 : 0}%`}}/></span><strong>{e.damage.toLocaleString("pt-BR")}</strong><em>{total ? (e.damage/total*100).toFixed(1) : 0}%</em></article>) : <Empty icon={<Swords/>} title="Nenhuma leitura de combate" text="Importe uma sessão para obter uma análise real. O overlay ao vivo só será habilitado com o companion conectado."/>}</section>
  </OperationsShell>;
}

export function MarketWatch() {
  const [rows,setRows] = useState<Watch[]>(()=>read("pad:market",[]));
  const [draft,setDraft] = useState({name:"",target:"",last:"",server:"Zikel"});
  const save = () => { if(!draft.name.trim()) return; const next=[...rows,{id:crypto.randomUUID(),name:draft.name.trim(),target:Number(draft.target)||0,last:Number(draft.last)||0,server:draft.server.trim()||"A conferir"}]; setRows(next);localStorage.setItem("pad:market",JSON.stringify(next));setDraft({name:"",target:"",last:"",server:draft.server}); };
  return <OperationsShell eyebrow="PRIVATE EXCHANGE" title="Observatório de mercado" description="Lista pessoal de preços e alvos por servidor, sem fabricar uma fonte de mercado inexistente.">
    <CompanionState/>
    <section className="opsPanel quickForm"><div><Coins/><b>Novo acompanhamento</b></div><input placeholder="Nome exato do item" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><input placeholder="Preço alvo" inputMode="numeric" value={draft.target} onChange={e=>setDraft({...draft,target:e.target.value})}/><input placeholder="Último preço" inputMode="numeric" value={draft.last} onChange={e=>setDraft({...draft,last:e.target.value})}/><input placeholder="Servidor" value={draft.server} onChange={e=>setDraft({...draft,server:e.target.value})}/><button onClick={save}>Adicionar</button></section>
    <section className="opsPanel watchList"><header><b>Itens observados</b><span>Dados manuais persistidos localmente</span></header>{rows.length?rows.map(r=><article key={r.id}><CircleDot/><div><b>{r.name}</b><small>{r.server}</small></div><span>Atual <b>{r.last.toLocaleString("pt-BR")}</b></span><span>Alvo <b>{r.target.toLocaleString("pt-BR")}</b></span><em className={r.last&&r.target&&r.last<=r.target?"good":""}>{r.last&&r.target ? r.last<=r.target?"No alvo":"Acima do alvo":"Sem comparação"}</em><button onClick={()=>{const n=rows.filter(x=>x.id!==r.id);setRows(n);localStorage.setItem("pad:market",JSON.stringify(n))}}>Remover</button></article>):<Empty icon={<Coins/>} title="Sua lista está vazia" text="Cadastre preços reais que você observou. A sincronização automática ficará indisponível até existir uma integração verificável."/>}</section>
  </OperationsShell>;
}

export function PetTracker() {
  const defaults: Pet[] = [{id:"p1",name:"Pet principal",owned:false,level:1,souls:0}];
  const [pets,setPets]=useState<Pet[]>(()=>read("pad:pets",defaults));
  const [name,setName]=useState("");
  const persist=(next:Pet[])=>{setPets(next);localStorage.setItem("pad:pets",JSON.stringify(next))};
  const owned=pets.filter(p=>p.owned).length;
  return <OperationsShell eyebrow="ATIEL BESTIARY" title="Coleção de pets" description="Coleção pessoal, evolução e lacunas — separada dos dados específicos de cada personagem.">
    <div className="opsGrid petSummary"><section className="opsPanel heroMetric"><PawPrint/><small>COLEÇÃO REGISTRADA</small><strong>{owned}/{pets.length}</strong><span>{pets.length?Math.round(owned/pets.length*100):0}% concluída</span></section><section className="opsPanel quickAdd"><input placeholder="Nome original do pet" value={name} onChange={e=>setName(e.target.value)}/><button onClick={()=>{if(name.trim()){persist([...pets,{id:crypto.randomUUID(),name:name.trim(),owned:false,level:1,souls:0}]);setName("")}}}>Adicionar pet</button></section></div>
    <section className="petCards">{pets.map(p=><article className={`opsPanel petCard ${p.owned?"owned":""}`} key={p.id}><div className="petOrb"><PawPrint/></div><div><b>{p.name}</b><span>{p.owned?"Na coleção":"Não obtido"}</span></div><label>Nível<input type="number" min="1" value={p.level} onChange={e=>persist(pets.map(x=>x.id===p.id?{...x,level:Number(e.target.value)}:x))}/></label><label>Almas<input type="number" min="0" value={p.souls} onChange={e=>persist(pets.map(x=>x.id===p.id?{...x,souls:Number(e.target.value)}:x))}/></label><button onClick={()=>persist(pets.map(x=>x.id===p.id?{...x,owned:!x.owned}:x))}>{p.owned?"Marcar ausente":"Marcar obtido"}</button></article>)}</section>
  </OperationsShell>;
}

function OperationsShell({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children:React.ReactNode}) { return <div className="operations"><div className="opsTitle"><small>{eyebrow}</small><h2>{title}</h2><p>{description}</p></div>{children}</div> }
function Empty({icon,title,text}:{icon:React.ReactNode;title:string;text:string}) { return <div className="opsEmpty">{icon}<b>{title}</b><p>{text}</p></div> }

