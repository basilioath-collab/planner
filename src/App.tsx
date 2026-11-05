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
  type CharacterHit,
} from "./aionApi";
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
const withArcanaArt=(b:Build):Build=>({...b,arcanas:b.arcanas.map(a=>({...a,icon:a.icon||initialBuild.arcanas.find(x=>x.id===a.id)?.icon}))});
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
  const exportPng = async () => {
    if (stage.current) {
      const data = await toPng(stage.current, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#071011",
        }),
        a = document.createElement("a");
      a.download = `ASEO-${mode}.png`;
      a.href = data;
      a.click();
    }
  };
  return (
    <main
      className={capture ? "capture" : ""}
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
      <header>
        <div className="brand">
          <Shield />
          <div>
            <b>ASEO</b>
            <span>Aion 2 Gear Planner</span>
          </div>
        </div>
        <nav>
          {(["gear", "arcana", "route", "sources"] as const).map((t) => (
            <button
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
              key={t}
            >
              {
                {
                  gear: "Equipamentos",
                  arcana: "Arcanas",
                  route: "Evolução",
                  sources: "Referências",
                }[t]
              }
            </button>
          ))}
        </nav>
        <div className="actions">
          <span className="save">
            <Save size={13} />
            {status}
          </span>
          <button onClick={() => setProfileImport(true)} title="Importar perfil oficial">
            <Upload /> Perfil
          </button>
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
        <span>ASEO · TEMPLÁRIO · ZIKEL · AMÉRICA DO SUL</span>
        <div className="metrics">
          <em>
            GS <b>{shown.gs.toLocaleString("pt-BR")}</b>
          </em>
          <em>
            CP <b>{shown.cp.toLocaleString("pt-BR")}</b>
          </em>
        </div>
      </section>
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
        <section className="stage" ref={stage}>
          <div className="halo" />
          <div className="spire s1" />
          <div className="spire s2" />
          <div className="identity">
            <small>GUARDIÃ DE ZIKEL</small>
            <h1>Aseo</h1>
            <p>
              Templário <i /> Nível a conferir
            </p>
          </div>
          <div
            className="character"
            onPointerDown={(e) => {
              if (capture) return;
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
                <Shield />
                <b>Sua Aseo entra aqui</b>
                <span>PNG transparente ou screenshot</span>
                <label>
                  <ImagePlus /> Escolher imagem
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    onChange={(e) => upload(e.target.files?.[0])}
                  />
                </label>
              </div>
            )}
          </div>
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
            {[
              ["judgment", "Julgamento"],
              ["punishment", "Punição"],
              ["pummel", "Pummel"],
            ].map(([id, n]) => (
              <div key={id} className={totals[id] >= 20 ? "goal" : ""}>
                <span>{n}</span>
                <b>{totals[id]}</b>
                <small>
                  {mode === "planned" && totals[id] !== current.totals[id]
                    ? `${totals[id] - current.totals[id] > 0 ? "+" : ""}${totals[id] - current.totals[id]} no cenário`
                    : "registrado"}
                </small>
              </div>
            ))}
          </div>
          {capture && (
            <div className="captureMark">
              ASEO · {mode === "current" ? "BUILD ATUAL" : "CENÁRIO PLANEJADO"}{" "}
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
      {!capture && !selected && (
        <motion.section className="dock" initial={{ y: 80 }} animate={{ y: 0 }}>
          {tab === "gear" && (
            <GearPanel
              slot={selected}
              item={selected ? planned.items[selected] : undefined}
              onClose={() => setSelected(undefined)}
              onSave={(x) =>
                mutate((b) => ({ ...b, items: { ...b.items, [x.slot]: x } }))
              }
            />
          )}{" "}
          {tab === "arcana" && (
            <ArcanaPanel arcanas={planned.arcanas} onEnhance={enhance} />
          )}{" "}
          {tab === "route" && (
            <Route totals={projectedTotals(current, planned)} />
          )}{" "}
          {tab === "sources" && <Sources />}
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
function ProfileImport({base,onClose,onApply}:{base:Build;onClose:()=>void;onApply:(b:Build)=>void}) {
  const [nick,setNick]=useState("Aseo"),[region,setRegion]=useState("la"),[hits,setHits]=useState<CharacterHit[]>([]),[candidate,setCandidate]=useState<Build>(),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const search=async()=>{setBusy(true);setError("");try{setHits(await searchCharacters(nick,region))}catch(e){setError((e as Error).message)}finally{setBusy(false)}};
  const choose=async(hit:CharacterHit)=>{setBusy(true);setError("");try{setCandidate(applyOfficialImport(base,await fetchCharacter(hit)))}catch(e){setError((e as Error).message)}finally{setBusy(false)}};
  return <div className="modal profileModal"><div><header><div><small>IMPORTAÇÃO OFICIAL</small><h2>Carregar personagem por nick</h2></div><button onClick={onClose}><X/></button></header><p>Equipamentos, ícones, aprimoramentos, asas, arcanas e níveis públicos. Adicionais rolados continuam manuais porque a API não os expõe.</p><div className="profileSearch"><input value={nick} onChange={e=>setNick(e.target.value)} placeholder="Nickname"/><select value={region} onChange={e=>setRegion(e.target.value)}><option value="la">América do Sul</option><option value="na">América do Norte</option><option value="eu">Europa</option></select><button onClick={search} disabled={busy||!nick.trim()}>{busy?'Consultando…':'Buscar'}</button></div>{error&&<p className="importError">{error}</p>}{!candidate&&<div className="profileHits">{hits.map(h=><button key={h.characterId} onClick={()=>choose(h)}><b>{h.name}</b><span>{h.serverName} · Nv. {h.level}</span></button>)}</div>}{candidate&&<div className="importPreview"><h3>Prévia antes de aplicar</h3><p><b>{Object.keys(candidate.items).length}</b> slots oficiais, <b>{candidate.arcanas.length}</b> arcanas preservando a distribuição manual, GS <b>{candidate.gs}</b> e CP <b>{candidate.cp.toLocaleString('pt-BR')}</b>.</p><p>A build planejada será recriada a partir desta atual. Sua imagem central e enquadramento não mudam.</p><button onClick={()=>setCandidate(undefined)}>Voltar</button><button className="primary" onClick={()=>onApply(candidate)}>Importar e começar a planejar</button></div>}</div></div>
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
  onSave,
  onRemove,
  onClose,
}: {
  slot: string;
  item?: Item;
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
  return (
    <motion.aside
      className="quickSlot"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <header>
        <div>
          <small>SLOT · {slot}</small>
          <b>Seleção rápida</b>
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
      <label>
        Adicionais diretos
        <textarea
          value={d.additionals.join("\n")}
          placeholder={
            "Um adicional por linha\nLinhas manuais ficam não validadas"
          }
          onChange={(e) =>
            setD({
              ...d,
              additionals: e.target.value.split("\n").filter(Boolean),
            })
          }
        />
      </label>
      <div className="addPreview">
        {d.additionals.length ? (
          d.additionals.map((a, i) => <span key={i}>✦ {a}</span>)
        ) : (
          <em>Nenhum adicional registrado</em>
        )}
      </div>
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
  );
}
function GearPanel({
  slot,
  item,
  onSave,
  onClose,
}: {
  slot?: string;
  item?: Item;
  onSave: (x: Item) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<Item>();
  useEffect(
    () =>
      setD(
        slot
          ? item || {
              id: crypto.randomUUID(),
              slot,
              name: "",
              rarity: "A conferir",
              enhancement: 0,
              attributes: [],
              additionals: [],
              notes: "",
              source: "Registro manual · não validado",
              updated: "2026-11-05",
              preserve: false,
            }
          : undefined,
      ),
    [slot, item],
  );
  if (!d)
    return (
      <div className="panelIntro">
        <div>
          <small>EQUIPAMENTOS</small>
          <h2>Planeje sem sobrescrever o presente.</h2>
          <p>Escolha um slot. Alterações entram apenas na build planejada.</p>
        </div>
        <div className="legend">
          <span>
            <i className="now" />
            Atual
          </span>
          <span>
            <i className="plan" />
            Planejado
          </span>
          <span>
            <i className="unknown" />A conferir
          </span>
        </div>
      </div>
    );
  return (
    <div className="editor">
      <div>
        <small>EDITANDO · {d.slot}</small>
        <h2>{d.name || "Novo equipamento"}</h2>
      </div>
      <label>
        Nome
        <input
          value={d.name}
          onChange={(e) => setD({ ...d, name: e.target.value })}
        />
      </label>
      <label>
        Raridade
        <select
          value={d.rarity}
          onChange={(e) => setD({ ...d, rarity: e.target.value })}
        >
          <option>A conferir</option>
          <option>Heroico</option>
          <option>Único</option>
          <option>Raro</option>
        </select>
      </label>
      <label>
        Aprimoramento
        <input
          type="number"
          value={d.enhancement}
          onChange={(e) => setD({ ...d, enhancement: +e.target.value })}
        />
      </label>
      <label className="wide">
        Adicionais manuais (um por linha)
        <textarea
          value={d.additionals.join("\n")}
          onChange={(e) =>
            setD({
              ...d,
              additionals: e.target.value.split("\n").filter(Boolean),
            })
          }
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={d.preserve}
          onChange={(e) => setD({ ...d, preserve: e.target.checked })}
        />
        Preservar item
      </label>
      <button onClick={onClose}>Cancelar</button>
      <button
        className="primary"
        disabled={!d.name}
        onClick={() => {
          onSave(d);
          onClose();
        }}
      >
        Aplicar ao planejado
      </button>
    </div>
  );
}
function ArcanaPanel({
  arcanas,
  onEnhance,
}: {
  arcanas: Arcana[];
  onEnhance: (a: Arcana, id: string) => void;
}) {
  return (
    <div className="arcanaPanel">
      <div className="arcanaHead">
        <div>
          <small>ARQUIVO DE ARCANAS</small>
          <h2>Distribuição ponto a ponto.</h2>
        </div>
        <p>
          Premissa editável: 4 pontos iniciais + 1/aprimoramento, limite +5.
          Confirmação externa pendente.
        </p>
      </div>
      <div className="cards">
        {arcanas.map((a) => (
          <article key={a.id}>
            <div className="arcanaArt">
              {a.icon ? <img src={a.icon} crossOrigin="anonymous" referrerPolicy="no-referrer" alt={a.name} /> : <Shield />}
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
            {a.lines.map((x) => (
              <button
                key={x.id}
                onClick={() => onEnhance(a, x.id)}
                disabled={!attemptsLeft(a)}
              >
                <span>{x.name}</span>
                <b>+{x.bonus}</b>
              </button>
            ))}
            <footer>
              <span>{attemptsLeft(a)} tentativa(s)</span>
              <span>Alvo: {a.target || "não definido"}</span>
            </footer>
          </article>
        ))}
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
