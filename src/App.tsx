import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  ChevronRight,
  Download,
  ImagePlus,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Upload,
  X,
  Undo2,
  Redo2,
  Home,
  Layers3,
  MapPinned,
  BookOpen,
} from "lucide-react";
import { toPng } from "html-to-image";
import {
  addArcanaPoint,
  attemptsLeft,
  initialBuild,
  pointsAvailable,
  pointsUsed,
  projectedTotals,
  slots,
  type Arcana,
  type Build,
  type Frame,
  type Item,
} from "./domain";
import {
  exportBackup,
  loadState,
  parseBackup,
  saveState,
  type Saved,
} from "./storage";
import {
  applyOfficialImport,
  fetchCharacter,
  searchCharacters,
} from "./aionApi";
import { analyzeBuild, type AnalysisContext } from "./recommendations";
import { additionsForSlot } from "./additionalCatalog";
import "./App.css";
import "./Profile.css";
const clone = <T,>(x: T): T => structuredClone(x),
  baseFrame: Frame = {
    x: 0,
    y: 0,
    scale: 1,
    flip: false,
    background: 0.8,
    light: 0.75,
  };
const withArcanaArt = (b: Build): Build => ({
  ...b,
  profile: b.profile || initialBuild.profile,
  arcanas: b.arcanas.map((a) => ({
    ...a,
    icon: a.icon || initialBuild.arcanas.find((x) => x.id === a.id)?.icon,
  })),
});
function dl(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
export default function App() {
  const [current, setCurrent] = useState<Build>(() => clone(initialBuild)),
    [planned, setPlanned] = useState<Build>(() => clone(initialBuild)),
    [mode, setMode] = useState<"current" | "planned">("planned"),
    [tab, setTab] = useState<"gear" | "arcana" | "route" | "sources">("gear"),
    [image, setImage] = useState<string>(),
    [frame, setFrame] = useState(baseFrame),
    [selected, setSelected] = useState<string>(),
    [capture, setCapture] = useState(false),
    [status, setStatus] = useState("Carregando…"),
    [history, setHistory] = useState<Build[]>([]),
    [future, setFuture] = useState<Build[]>([]),
    [preview, setPreview] = useState<Saved>(),
    [profileImport, setProfileImport] = useState(false);
  const stage = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(
      null,
    );
  useEffect(() => {
    loadState()
      .then((s) => {
        if (s) {
          setCurrent(withArcanaArt(s.current));
          setPlanned(withArcanaArt(s.planned));
          setFrame(s.frame);
          setImage(s.image);
        }
        setStatus("Salvo localmente");
      })
      .catch(() => setStatus("Falha no armazenamento"));
  }, []);
  useEffect(() => {
    if (status === "Carregando…") return;
    setStatus("Salvando…");
    const t = setTimeout(
      () =>
        saveState({ current, planned, frame, image, version: 1 })
          .then(() => setStatus("Salvo localmente"))
          .catch(() => setStatus("Falha ao salvar")),
      350,
    );
    return () => clearTimeout(t);
  }, [current, planned, frame, image]);
  const shown = mode === "current" ? current : planned,
    profile = shown.profile || initialBuild.profile,
    totals = useMemo(
      () =>
        mode === "current" ? current.totals : projectedTotals(current, planned),
      [mode, current, planned],
    );
  const mutate = (fn: (b: Build) => Build) => {
    setHistory((h) => [...h, clone(planned)].slice(-30));
    setFuture([]);
    setPlanned(fn(clone(planned)));
  };
  const undo = () => {
      const p = history.at(-1);
      if (!p) return;
      setFuture((f) => [clone(planned), ...f]);
      setPlanned(p);
      setHistory((h) => h.slice(0, -1));
    },
    redo = () => {
      const n = future[0];
      if (!n) return;
      setHistory((h) => [...h, clone(planned)]);
      setPlanned(n);
      setFuture((f) => f.slice(1));
    };
  const upload = (f?: File) => {
    if (!f || !["image/png", "image/webp", "image/jpeg"].includes(f.type))
      return alert("Use PNG, WebP ou JPEG.");
    const r = new FileReader();
    r.onload = () => {
      setImage(String(r.result));
      setFrame(baseFrame);
    };
    r.readAsDataURL(f);
  };
  const enhance = (a: Arcana, id: string) => {
    try {
      mutate((b) => ({
        ...b,
        arcanas: b.arcanas.map((x) =>
          x.id === a.id ? addArcanaPoint(x, id) : x,
        ),
      }));
    } catch (e) {
      alert((e as Error).message);
    }
  };
  const setArcanaLine = (cardId: string, lineId: string, bonus: number) => {
    mutate((b) => ({...b, arcanas:b.arcanas.map(card => {
      if (card.id !== cardId) return card;
      const next = {...card, lines:card.lines.map(line=>line.id===lineId?{...line,bonus}:line)};
      if (pointsUsed(next) > pointsAvailable(next)) {
        alert(`Distribuição inválida: ${pointsUsed(next)}/${pointsAvailable(next)} pontos.`);
        return card;
      }
      return next;
    })}));
  };
  const setArcanaTarget = (cardId:string, target:string) => mutate(b=>({...b,arcanas:b.arcanas.map(a=>a.id===cardId?{...a,target}:a)}));
  const exportPng = async () => {
    if (stage.current) {
      const data = await toPng(stage.current, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#071011",
        }),
        a = document.createElement("a");
      a.download = `PAD-PLAN-${profile.name}-${mode}.png`;
      a.href = data;
      a.click();
    }
  };
  return (
    <main
      className={`${capture ? "capture" : ""} section-${tab}`}
      style={
        {
          "--bgIntensity": frame.background,
          "--lightIntensity": frame.light,
        } as React.CSSProperties
      }
    >
      <div className="backdrop">
        <i />
        <i />
        <i />
        <div className="runes">᛭ ᚨ ᛇ ᛟ ᚦ ᛭</div>
      </div>
      <aside className="appNav" aria-label="Navegação principal">
        <div className="navSigil"><Shield /></div>
        {([
          ["gear", Home, "Início"],
          ["arcana", Layers3, "Arcanas"],
          ["route", MapPinned, "Evolução"],
          ["sources", BookOpen, "Referências"],
        ] as const).map(([id, Icon, label]) => <button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)} title={label}><Icon/><span>{label}</span></button>)}
      </aside>
      <header>
        <div className="brand">
          <div>
            <b>{{gear:"Início",arcana:"Arcanas",route:"Evolução",sources:"Referências"}[tab]}</b>
            <span>PAD PLAN · Personal Analysis & Development</span>
          </div>
        </div>
        <HeroSearch compact ready={status !== "Carregando…"} base={current} onApply={(b)=>{setCurrent(b);setPlanned(clone(b));setMode("current");setTab("gear")}} />
        <div className="actions">
          <span className="save">
            <Save size={13} />
            {status}
          </span>
          <button onClick={undo} disabled={!history.length} title="Desfazer">
            <Undo2 />
          </button>
          <button onClick={redo} disabled={!future.length} title="Refazer">
            <Redo2 />
          </button>
          <button className="captureBtn" onClick={() => setCapture(!capture)}>
            <Camera /> Captura
          </button>
        </div>
      </header>
      <section className="modebar">
        <div>
          <button
            className={mode === "current" ? "on" : ""}
            onClick={() => setMode("current")}
          >
            Build atual
          </button>
          <button
            className={mode === "planned" ? "on" : ""}
            onClick={() => setMode("planned")}
          >
            Planejada <Sparkles size={14} />
          </button>
        </div>
        <span>DEUS ARCHIVE // {profile.name.toUpperCase()} · {profile.className.toUpperCase()} · {profile.serverName.toUpperCase()}</span>
        <div className="metrics">
          <em>
            GS <b>{shown.gs.toLocaleString("pt-BR")}</b>
          </em>
          <em>
            CP <b>{shown.cp.toLocaleString("pt-BR")}</b>
          </em>
        </div>
      </section>
      {!capture && tab !== "gear" && <section className="modulePage">
        {tab === "arcana" && <ArcanaPanel arcanas={planned.arcanas} currentArcanas={current.arcanas} onEnhance={enhance} onSetLine={setArcanaLine} onSetTarget={setArcanaTarget} />}
        {tab === "route" && <Route totals={projectedTotals(current, planned)} />}
        {tab === "sources" && <Sources />}
      </section>}
      <div className="workspace">
        <aside className="rail left">
          {slots.slice(0, Math.ceil(slots.length / 2)).map((s, i) => (
            <Slot
              key={s}
              slot={s}
              item={shown.items[s]}
              side="left"
              onClick={() => {
                setSelected(s);
                setTab("gear");
              }}
              delay={i}
            />
          ))}
        </aside>
        <section className={`stage ${image ? "hasPortrait" : ""}`} ref={stage}>
          <div className="halo" />
          <div className="spire s1" />
          <div className="spire s2" />
          {image && <div className="portraitFrame" aria-hidden="true"><i/><i/><span/><b/></div>}
          <div className="identity">
            <small>REGISTRO DE COMBATE · {profile.serverName.toUpperCase()}</small>
            <h1>{profile.name}</h1>
            <p>
              {profile.className} <i /> {profile.level ? `Nível ${profile.level}` : "Nível a conferir"}
            </p>
          </div>
          <div
            className="character"
            onPointerDown={(e) => {
              if (capture || (e.target as HTMLElement).closest("button,input,label")) return;
              drag.current = {
                x: e.clientX,
                y: e.clientY,
                fx: frame.x,
                fy: frame.y,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (drag.current)
                setFrame((f) => ({
                  ...f,
                  x: drag.current!.fx + e.clientX - drag.current!.x,
                  y: drag.current!.fy + e.clientY - drag.current!.y,
                }));
            }}
            onPointerUp={() => (drag.current = null)}
          >
            {image ? (
              <img
                src={image}
                style={{
                  transform: `translate(${frame.x}px,${frame.y}px) scale(${frame.flip ? -frame.scale : frame.scale},${frame.scale})`,
                }}
              />
            ) : (
              <div className="emptyHero">
                <small>LOCALIZAR PERSONAGEM</small>
                <b>Entre direto na sua build</b>
                <span className="or"><i/> personalize a composição <i/></span>
                <label>
                  <ImagePlus /> Adicionar print da personagem
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    onChange={(e) => upload(e.target.files?.[0])}
                  />
                </label>
              </div>
            )}
          </div>
          {!!shown.skins?.length && <AppearanceRibbon skins={shown.skins} />}
          {!capture && image && (
            <div className="frameTools">
              <label>
                Zoom
                <input
                  type="range"
                  min=".4"
                  max="2.4"
                  step=".02"
                  value={frame.scale}
                  onChange={(e) =>
                    setFrame({ ...frame, scale: +e.target.value })
                  }
                />
              </label>
              <button onClick={() => setFrame({ ...frame, flip: !frame.flip })}>
                Espelhar
              </button>
              <button onClick={() => setFrame(baseFrame)}>
                <RotateCcw /> Restaurar
              </button>
              <label>
                <Upload /> Trocar
                <input
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
              </label>
            </div>
          )}
          <div className="skillTotals">
            {Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id, value]) => (
              <div key={id} className={totals[id] >= 20 ? "goal" : ""}>
                <span>{shown.skillNames?.[id] || ({judgment:"Julgamento",punishment:"Punição",pummel:"Pummel"} as Record<string,string>)[id] || id}</span>
                <b>{value}</b>
                <small>
                  {mode === "planned" && totals[id] !== current.totals[id]
                    ? `${totals[id] - current.totals[id] > 0 ? "+" : ""}${totals[id] - current.totals[id]} no cenário`
                    : "registrado"}
                </small>
              </div>
            ))}
            {!Object.keys(totals).length && <div><span>Habilidades</span><b>—</b><small>a conferir</small></div>}
          </div>
          {capture && (
            <div className="captureMark">
              PAD PLAN · {profile.name.toUpperCase()} · {mode === "current" ? "BUILD ATUAL" : "CENÁRIO PLANEJADO"}{" "}
              · 05 NOV 2026
            </div>
          )}
        </section>
        <aside className="rail right">
          {slots.slice(Math.ceil(slots.length / 2)).map((s, i) => (
            <Slot
              key={s}
              slot={s}
              item={shown.items[s]}
              side="right"
              onClick={() => {
                setSelected(s);
                setTab("gear");
              }}
              delay={i}
            />
          ))}
        </aside>
      </div>
      {!capture && selected && tab === "gear" && (
        <QuickSlot
          slot={selected}
          item={planned.items[selected]}
          currentItem={current.items[selected]}
          onClose={() => setSelected(undefined)}
          onSave={(x) =>
            mutate((b) => ({ ...b, items: { ...b.items, [x.slot]: x } }))
          }
          onRemove={() =>
            mutate((b) => {
              const items = { ...b.items };
              delete items[selected];
              return { ...b, items };
            })
          }
        />
      )}
      {!capture && !selected && tab === "gear" && (
        <motion.section className={`dock ${tab === "gear" ? "gearDock" : ""}`} initial={{ y: 80 }} animate={{ y: 0 }}>
          {tab === "gear" && (
            <GearOverview build={shown} current={current} planned={planned} onEdit={setSelected} />
          )}{" "}
        </motion.section>
      )}
      {profileImport && (
        <ProfileImport
          base={current}
          onClose={() => setProfileImport(false)}
          onApply={(b) => {
            setCurrent(b);
            setPlanned(clone(b));
            setMode("current");
            setProfileImport(false);
          }}
        />
      )}
      {!capture && (
        <div className="floating">
          <label>
            Fundo
            <input
              type="range"
              min=".25"
              max="1"
              step=".05"
              value={frame.background}
              onChange={(e) =>
                setFrame({ ...frame, background: +e.target.value })
              }
            />
          </label>
          <label>
            Luz
            <input
              type="range"
              min=".2"
              max="1.2"
              step=".05"
              value={frame.light}
              onChange={(e) => setFrame({ ...frame, light: +e.target.value })}
            />
          </label>
          <button
            onClick={() =>
              dl(
                exportBackup({ current, planned, frame, image, version: 1 }),
                "aseo-backup.json",
              )
            }
          >
            <Download /> Backup
          </button>
          <label className="button">
            <Upload /> Importar
            <input
              type="file"
              accept="application/json"
              onChange={(e) =>
                e.target.files?.[0].text().then((t) => {
                  try {
                    setPreview(parseBackup(t));
                  } catch {
                    alert("Arquivo inválido. Seus dados não foram alterados.");
                  }
                })
              }
            />
          </label>
        </div>
      )}
      {capture && (
        <div className="captureControls">
          <button onClick={exportPng}>
            <Download /> Exportar PNG 2×
          </button>
          <button onClick={() => setCapture(false)}>
            <X /> Sair
          </button>
        </div>
      )}
      {preview && (
        <div className="modal">
          <div>
            <h2>Prévia da importação</h2>
            <p>
              <b>{preview.current.arcanas.length}</b> arcanas,{" "}
              <b>
                {Object.values(preview.planned.items).filter(Boolean).length}
              </b>{" "}
              equipamentos e imagem {preview.image ? "incluída" : "ausente"}.
            </p>
            <button onClick={() => setPreview(undefined)}>Cancelar</button>
            <button
              onClick={async () => {
                await saveState(preview);
                setCurrent(preview.current);
                setPlanned(preview.planned);
                setFrame(preview.frame);
                setImage(preview.image);
                setPreview(undefined);
              }}
            >
              Substituir dados
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
function AppearanceRibbon({skins}:{skins:NonNullable<Build["skins"]>}){
  return <section className="appearanceRibbon" aria-label="Aparências equipadas">
    <div className="appearanceTitle"><span>VISUAL EQUIPADO</span><b>{skins.length.toString().padStart(2,"0")}</b></div>
    <div className="appearanceItems">{skins.map(s=><figure key={`${s.slot}-${s.id}`} title={`${s.name} · ${s.rarity}`} data-grade={s.rarity}>
      <img src={s.icon} alt=""/><figcaption><small>{s.slot.replace(/Wear|Main|L|R/g,"")}</small><b>{s.name.replace(/ \([^)]*\)$/,"")}</b></figcaption>
    </figure>)}</div>
  </section>
}
function HeroSearch({base,onApply,ready,compact=false}:{base:Build;onApply:(b:Build)=>void;ready:boolean;compact?:boolean}){
  const saved=(()=>{try{return JSON.parse(localStorage.getItem("aseo-profile")||"{}")}catch{return {}}})();
  const[nick,setNick]=useState(saved.nick||"Aseo"),[server,setServer]=useState(saved.server||"Zikel"),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const run=async()=>{setBusy(true);setError("");try{const hits=await searchCharacters(nick,"la"),hit=hits.find(h=>h.name.toLocaleLowerCase()===nick.trim().toLocaleLowerCase()&&h.serverName.toLocaleLowerCase()===server.trim().toLocaleLowerCase());if(!hit)throw Error("Personagem ou servidor não encontrado.");localStorage.setItem("aseo-profile",JSON.stringify({nick:nick.trim(),server:server.trim(),region:"la"}));onApply(applyOfficialImport(base,await fetchCharacter(hit)))}catch(e){setError((e as Error).message.includes("404")?"Atualização online temporariamente indisponível.":(e as Error).message)}finally{setBusy(false)}};
  return <div className={`heroSearch ${compact?"headerSearch":""}`}><div><input aria-label="Nickname" value={nick} onChange={e=>setNick(e.target.value)} placeholder="Nickname"/><input aria-label="Servidor" value={server} onChange={e=>setServer(e.target.value)} placeholder="Servidor"/><button onClick={run} disabled={!ready||busy||!nick.trim()||!server.trim()}>{!ready?"Carregando…":busy?"Buscando…":"Pesquisar"}</button></div>{error&&<em>{error}</em>}{!compact&&<p>América do Sul · dados públicos oficiais NCSOFT</p>}</div>
}
function ProfileImport({
  base,
  onClose,
  onApply,
}: {
  base: Build;
  onClose: () => void;
  onApply: (b: Build) => void;
}) {
  const savedProfile = (() => { try { return JSON.parse(localStorage.getItem("aseo-profile") || "{}"); } catch { return {}; } })();
  const [nick, setNick] = useState(savedProfile.nick || "Aseo"),
    [server, setServer] = useState(savedProfile.server || "Zikel"),
    [region, setRegion] = useState("la"),
    [candidate, setCandidate] = useState<Build>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const refresh = async () => {
    setBusy(true);
    setError("");
    try {
      const hits = await searchCharacters(nick, region);
      const hit = hits.find((h) => h.name.toLocaleLowerCase() === nick.trim().toLocaleLowerCase() && h.serverName.toLocaleLowerCase() === server.trim().toLocaleLowerCase());
      if (!hit) throw Error(`Personagem ${nick} não encontrado no servidor ${server}. Confira a grafia.`);
      localStorage.setItem("aseo-profile", JSON.stringify({ nick: nick.trim(), server: server.trim(), region }));
      setCandidate(applyOfficialImport(base, await fetchCharacter(hit)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="modal profileModal">
      <div>
        <header>
          <div>
            <small>PERFIL OFICIAL · NCSOFT</small>
            <h2>Atualizar personagem</h2>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </header>
        <p>
          Digite seu nickname e servidor. O ASEO atualiza equipamentos,
          atributos, adicionais rolados, habilidades, manastones, theostones,
          ícones, arcanas, GS e CP.
        </p>
        <div className="profileSearch">
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="Nickname"
          />
          <input
            value={server}
            onChange={(e) => setServer(e.target.value)}
            placeholder="Servidor, ex.: Zikel"
          />
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="la">América do Sul</option>
            <option value="nae">América do Norte Leste</option>
            <option value="naw">América do Norte Oeste</option>
            <option value="eu">Europa</option>
            <option value="as">Ásia</option>
          </select>
          <button onClick={refresh} disabled={busy || !nick.trim() || !server.trim()}>
            {busy ? "Atualizando detalhes…" : "Atualizar agora"}
          </button>
        </div>
        {error && <p className="importError">{error}</p>}
        {candidate && (
          <div className="importPreview">
            <h3>Prévia antes de aplicar</h3>
            <p>
              <b>{Object.keys(candidate.items).length}</b> slots atualizados com detalhes oficiais,{" "}
              <b>{candidate.arcanas.length}</b> arcanas preservando a
              distribuição manual, GS <b>{candidate.gs}</b> e CP{" "}
              <b>{candidate.cp.toLocaleString("pt-BR")}</b>.
            </p>
            <p>
              A build planejada será recriada a partir desta atual. Sua imagem
              central e enquadramento não mudam.
            </p>
            <button onClick={() => setCandidate(undefined)}>Voltar</button>
            <button className="primary" onClick={() => onApply(candidate)}>
              Aplicar atualização
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Slot({
  slot,
  item,
  side,
  onClick,
  delay,
}: {
  slot: string;
  item?: Item;
  side: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      className={`slot ${side} ${item ? "filled" : ""}`}
      onClick={onClick}
      initial={{ opacity: 0, x: side === "left" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.04 }}
    >
      <div className="icon">
        {item?.icon ? (
          <img src={item.icon} crossOrigin="anonymous" alt="" />
        ) : item ? (
          <Shield />
        ) : (
          <span>+</span>
        )}
      </div>
      <div>
        <small>{slot}</small>
        <b>{item?.name || "Slot vazio"}</b>
        {item && (
          <span>
            {item.rarity} · +{item.enhancement}
          </span>
        )}
      </div>
      <ChevronRight />
    </motion.button>
  );
}
function QuickSlot({
  slot,
  item,
  currentItem,
  onSave,
  onRemove,
  onClose,
}: {
  slot: string;
  item?: Item;
  currentItem?: Item;
  onSave: (x: Item) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const blank = (): Item => ({
    id: crypto.randomUUID(),
    slot,
    name: "",
    rarity: "A conferir",
    enhancement: 0,
    attributes: [],
    additionals: [],
    notes: "",
    source: "Registro manual · não validado",
    updated: new Date().toISOString().slice(0, 10),
    preserve: false,
  });
  const [d, setD] = useState<Item>(() => item || blank());
  useEffect(() => setD(item || blank()), [slot, item]);
  const options = additionsForSlot(slot, [...(currentItem?.additionals || []), ...(item?.additionals || [])]);
  const setLine = (index:number, value:string) => setD({...d, additionals:d.additionals.map((x,i)=>i===index?value:x)});
  return (
    <div className="itemEditorBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <motion.aside
      className="quickSlot"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <header>
        <div>
          <small>SLOT · {slot}</small>
          <b>Planejar equipamento</b>
        </div>
        <button onClick={onClose} aria-label="Fechar">
          <X />
        </button>
      </header>
      <label>
        Item
        <select
          value={item ? "equipped" : "new"}
          onChange={(e) => {
            if (e.target.value === "empty") {
              onRemove();
              onClose();
            }
          }}
        >
          <option value={item ? "equipped" : "new"}>
            {item?.name || "Novo item manual"}
          </option>
          <option value="empty">Remover / deixar vazio</option>
        </select>
      </label>
      <div className="quickGrid">
        <label>
          Nome
          <input
            value={d.name}
            placeholder="Nome do item"
            onChange={(e) => setD({ ...d, name: e.target.value })}
          />
        </label>
        <label>
          +
          <input
            type="number"
            value={d.enhancement}
            onChange={(e) => setD({ ...d, enhancement: +e.target.value })}
          />
        </label>
      </div>
      <div className="itemCompare">
        <section><small>BUILD ATUAL</small><b>{currentItem?.name || "Slot vazio"}</b>{currentItem?.additionals.length?currentItem.additionals.map(x=><span key={x}>◆ {x}</span>):<em>Sem adicionais confirmados</em>}</section>
        <section><small>CENÁRIO PLANEJADO</small><b>{d.name || "Novo item"}</b>{d.additionals.map((line,index)=><div className="additionalSelect" key={`${index}-${line}`}><select aria-label={`Adicional ${index+1}`} value={options.find(x=>line.startsWith(x.label))?.label||""} onChange={e=>setLine(index,e.target.value)}><option value="">Selecione um adicional…</option>{options.map(x=><option key={x.id} value={x.label}>{x.label}</option>)}</select><button aria-label={`Remover adicional ${index+1}`} onClick={()=>setD({...d,additionals:d.additionals.filter((_,i)=>i!==index)})}><X/></button></div>)}<button className="addLine" onClick={()=>setD({...d,additionals:[...d.additionals,""]})}>+ Adicionar linha planejada</button></section>
      </div>
      <p className="catalogNotice">Catálogo Global parcial, filtrado por slot e complementado pelas linhas observadas no perfil oficial. Possibilidades não confirmadas continuam “a conferir”.</p>
      <footer>
        <span>Aplica somente à build planejada</span>
        <button
          disabled={!d.name.trim()}
          onClick={() => {
            onSave(d);
            onClose();
          }}
        >
          Equipar e salvar
        </button>
      </footer>
    </motion.aside>
    </div>
  );
}
function GearOverview({build,current,planned,onEdit}:{build:Build;current:Build;planned:Build;onEdit:(slot:string)=>void}){
  const [focus,setFocus]=useState("Arma");
  const [context,setContext]=useState<AnalysisContext>("pve");
  const item=build.items[focus];
  const changed=slots.filter(slot=>JSON.stringify(current.items[slot]||null)!==JSON.stringify(planned.items[slot]||null));
  const recommendations=analyzeBuild(build,context);
  const profile=build.profile||initialBuild.profile;
  return <div className="gearOverview">
    <header className="gearProfile">
      <div className="profileMedallion">{profile.profileImage?<img src={profile.profileImage} alt=""/>:build.skins?.[0]?.icon?<img src={build.skins[0].icon} alt=""/>:<Shield/>}</div>
      <div><small>PAD PLAN · PERFIL ANALÍTICO</small><h2>{profile.name}</h2><p>{profile.className} · {profile.level?`Nv. ${profile.level}`:"Nv. a conferir"} · {profile.serverName}</p></div>
      <div className="profileNumbers"><em>Gear<strong>{build.gs.toLocaleString("pt-BR")}</strong></em><em>Poder<strong>{build.cp.toLocaleString("pt-BR")}</strong></em></div>
    </header>
    <section className="gearMap">
      <div className="gearMapTitle"><span>MAPA DO EQUIPAMENTO</span><b>{Object.values(build.items).filter(Boolean).length}/{slots.length}</b></div>
      <div className="gearTiles">{slots.map(slot=>{const value=build.items[slot];return <button key={slot} className={`${focus===slot?"active":""} ${value?"filled":""}`} onClick={()=>setFocus(slot)} title={value?.name||slot}>
        <span>{value?.icon?<img src={value.icon} alt=""/>:<Shield/>}{value&&<i>+{value.enhancement}</i>}</span><small>{slot}</small>
      </button>})}</div>
    </section>
    <div className="gearAnalysis">
      <article className="itemReadout">
        <div className="itemReadoutHead"><div>{item?.icon?<img src={item.icon} alt=""/>:<Shield/>}</div><section><small>{focus} · {item?.rarity||"SLOT VAZIO"}</small><h3>{item?.name||"Nenhum item registrado"}</h3><p>{item?`+${item.enhancement}${item.exceedLevel?` · transcendência +${item.exceedLevel}`:""}`:"Escolha ou registre um item para este slot."}</p></section><button onClick={()=>onEdit(focus)}>Editar slot</button></div>
        <div className="itemLines"><section><small>ATRIBUTOS BASE</small>{item?.attributes.length?item.attributes.map(x=><span key={x}>{x}</span>):<em>A conferir</em>}</section><section><small>ADICIONAIS / HABILIDADES</small>{item?.additionals.length?item.additionals.map(x=><span key={x}>{x}</span>):<em>Nenhuma linha confirmada</em>}</section></div>
      </article>
      <aside className="changeQueue recommendationQueue"><header><div><small>BASE ANALÍTICA · GLOBAL S1</small><h3>Melhores próximos passos</h3></div><b>{recommendations.length}</b></header><div className="contextSwitch">{(["pve","pvp","solo"] as const).map(id=><button key={id} className={context===id?"active":""} onClick={()=>setContext(id)}>{id==="pve"?"PvE":id==="pvp"?"PvP":"Solo"}</button>)}</div>{recommendations.length?<ol>{recommendations.slice(0,4).map(rec=><li key={rec.id} className={`recPriority p${rec.priority}`}><span><b>{rec.title}</b><small>{rec.area} · {rec.confidence}</small><em>{rec.action}</em></span>{rec.slot?<button onClick={()=>onEdit(rec.slot!)}>Abrir</button>:rec.sourceUrl?<a href={rec.sourceUrl} target="_blank" rel="noreferrer">Fonte</a>:null}</li>)}</ol>:<div className="queueEmpty"><Sparkles/><b>Sem lacunas detectadas</b><span>A base atual não encontrou um próximo passo confirmado.</span></div>}<footer><span>{changed.length} mudança(s) já planejada(s)</span><button onClick={()=>onEdit(focus)}>Planejar {focus}</button></footer></aside>
    </div>
  </div>
}
function ArcanaPanel({
  arcanas,
  currentArcanas,
  onEnhance,
  onSetLine,
  onSetTarget,
}: {
  arcanas: Arcana[];
  currentArcanas: Arcana[];
  onEnhance: (a: Arcana, id: string) => void;
  onSetLine: (cardId:string,lineId:string,bonus:number)=>void;
  onSetTarget: (cardId:string,target:string)=>void;
}) {
  return (
    <div className="arcanaPanel">
      <div className="arcanaHead">
        <div>
          <small>ARQUIVO DE ARCANAS</small>
          <h2>Laboratório de distribuição.</h2>
        </div>
        <p>
          Premissa editável: 4 pontos iniciais + 1/aprimoramento, limite +5.
          Confirmação externa pendente.
        </p>
      </div>
      <div className="cards">
        {arcanas.map((a) => {
          const currentCard=currentArcanas.find(x=>x.id===a.id||x.externalId===a.externalId);
          return (
          <article key={a.id}>
            <div className="arcanaArt">
              {a.icon ? (
                <img
                  src={a.icon}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  alt={a.name}
                />
              ) : (
                <Shield />
              )}
              <span>{a.family}</span>
            </div>
            <header>
              <div>
                <small>{a.family}</small>
                <b>{a.name}</b>
              </div>
              <strong>+{a.enhancement}</strong>
            </header>
            <div className="pointbar">
              <span
                style={{
                  width: `${(pointsUsed(a) / pointsAvailable(a)) * 100}%`,
                }}
              />
              <em>
                {pointsUsed(a)} / {pointsAvailable(a)} pts
              </em>
            </div>
            <div className="arcanaLines">
            {a.lines.map((x) => {
              const now=currentCard?.lines.find(y=>y.id===x.id)?.bonus ?? x.bonus;
              return <label key={x.id}><span><b>{x.name}</b><small>Atual +{now}</small></span><select aria-label={`${a.name} ${x.name}`} value={x.bonus} onChange={e=>onSetLine(a.id,x.id,+e.target.value)}>{Array.from({length:pointsAvailable(a)+1},(_,n)=><option key={n} value={n}>Planejado +{n}</option>)}</select></label>
            })}
            </div>
            {!!a.lines.length && <label className="arcanaTarget">Habilidade alvo<select value={a.target||""} onChange={e=>onSetTarget(a.id,e.target.value)}><option value="">Selecione…</option>{a.lines.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
            <footer>
              <span>{attemptsLeft(a)} tentativa(s)</span>
              <button disabled={!attemptsLeft(a)||!a.target} onClick={()=>a.target&&onEnhance(a,a.target)}>Registrar +1 no alvo</button>
            </footer>
          </article>
        )})}
      </div>
    </div>
  );
}
function Route({ totals }: { totals: Record<string, number> }) {
  return (
    <div className="route">
      <div>
        <small>ROTA REGISTRADA</small>
        <h2>Do atual ao ideal.</h2>
      </div>
      <ol>
        <li className="done">
          <b>Preservar Cálice</b>
          <span>Julgamento 20 enquanto a linha for mantida.</span>
        </li>
        <li>
          <b>Manuscrito → Punição</b>
          <span>Duas tentativas. +4 somente se ambas acertarem.</span>
        </li>
        <li>
          <b>Bússola → Pummel</b>
          <span>Esta carta chega no máximo a +3; +4 exige nova carta.</span>
        </li>
        <li>
          <b>Conferir anéis</b>
          <span>Sem duplicar linhas não confirmadas.</span>
        </li>
      </ol>
      <div className="ideal">
        <small>CENÁRIO</small>
        <b>Punição {totals.punishment} / 20</b>
        <b>Pummel {totals.pummel} / 20</b>
        <span>Possibilidade condicionada.</span>
      </div>
    </div>
  );
}
function Sources() {
  return (
    <div className="sources">
      <div>
        <small>BASE DOCUMENTAL</small>
        <h2>Contexto rastreável.</h2>
      </div>
      <a
        href="https://solashur.com/builds/aion2-templar-global-build-guide.html"
        target="_blank"
      >
        <b>SolAshur · Global Season 1</b>
        <span>
          30/10/2026 · PvP/PvE; preferências do autor não universalizadas.
        </span>
      </a>
      <a href="https://www.aion2guidance.com/pt-br/templar/" target="_blank">
        <b>AION2 Guidance · Temporada 1</b>
        <span>24/10/2026 · JvA/JvJ/Upar.</span>
      </a>
      <a href="https://daevaguides.com/pt-br/templar/" target="_blank">
        <b>Daeva Guides · Global</b>
        <span>21/10/2026 · PvE e progressão.</span>
      </a>
      <p>
        Consultado em 05/11/2026. Catálogo parcial. Shugo e Questlog sem
        integração acessível: entrada manual disponível.
      </p>
    </div>
  );
}
