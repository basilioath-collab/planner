import { attemptsLeft, slots, type Build } from "./domain";

export type AnalysisContext = "pve" | "pvp" | "solo";
export type Recommendation = {
  id: string;
  area: "item" | "additional" | "arcana" | "skill" | "data";
  priority: 1 | 2 | 3;
  title: string;
  action: string;
  evidence: string;
  sourceTitle: string;
  sourceUrl: string;
  confidence: "confirmado" | "guia" | "a conferir";
  context: AnalysisContext;
  slot?: string;
};

const GUIDANCE = "https://www.aion2guidance.com/pt-br/templar/";
const SOL = "https://solashur.com/builds/aion2-templar-global-build-guide.html";
const DAEVA = "https://daevaguides.com/pt-br/templar/";
const norm = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

type ClassGuide = { id: string; aliases: string[]; label: string; role: string; weapon: string; url: string };
export const classGuides: ClassGuide[] = [
  { id:"templar", aliases:["templar","templario"], label:"Templário", role:"Tank", weapon:"Espada e escudo", url:"https://daevaguides.com/pt-br/templar/index.html" },
  { id:"gladiator", aliases:["gladiator","gladiador"], label:"Gladiador", role:"DPS / off-tank", weapon:"Montante", url:"https://daevaguides.com/pt-br/gladiator/index.html" },
  { id:"assassin", aliases:["assassin","assassino"], label:"Assassino", role:"DPS corpo a corpo", weapon:"Adagas", url:"https://daevaguides.com/pt-br/assassin/index.html" },
  { id:"ranger", aliases:["ranger","arqueiro"], label:"Arqueiro", role:"DPS à distância", weapon:"Arco", url:"https://daevaguides.com/pt-br/ranger/index.html" },
  { id:"sorcerer", aliases:["sorcerer","mago"], label:"Mago", role:"DPS mágico", weapon:"Grimório", url:"https://daevaguides.com/pt-br/sorcerer/index.html" },
  { id:"elementalist", aliases:["elementalist","spiritmaster","espiritualista"], label:"Espiritualista", role:"DPS / invocador", weapon:"Orbe", url:"https://daevaguides.com/pt-br/elementalist/index.html" },
  { id:"cleric", aliases:["cleric","clerigo"], label:"Clérigo", role:"Healer", weapon:"Maça e guarda", url:"https://daevaguides.com/pt-br/cleric/index.html" },
  { id:"chanter", aliases:["chanter","encantador"], label:"Encantador", role:"Suporte", weapon:"Cajado e guarda", url:"https://daevaguides.com/pt-br/chanter/index.html" },
];
export const resolveClassGuide = (name: string) => classGuides.find(x => x.aliases.some(a => norm(name).includes(a)));

const pveBySlot: Record<string, string[]> = {
  Arma: ["Velocidade de Combate", "Amplificação de Dano de Arma", "Poder"],
  Escudo: ["Velocidade de Combate", "Amplificação de Dano de Arma", "Poder"],
  Elmo: ["Amplificação de Cura Recebida", "Ataque", "Exaltação"],
  Ombreiras: ["Amplificação de Dano Crítico", "Ataque", "Exaltação"],
  Peitoral: ["Amplificação de Dano", "Ataque", "Exaltação"],
  Manoplas: ["Velocidade de Combate", "Acerto Perfeito", "Exaltação"],
  Calças: ["Acerto Perfeito", "Tolerância a Dano", "Exaltação"],
  Botas: ["Velocidade de Movimento", "Acerto Perfeito", "Exaltação"],
  Capa: ["Ataque", "Acerto Crítico", "Exaltação"],
  Colar: ["Ataque", "Acerto Crítico", "Velocidade de Combate"],
  "Brinco E": ["Velocidade de Movimento", "Poder", "Exaltação"],
  "Brinco D": ["Velocidade de Movimento", "Poder", "Exaltação"],
  "Anel E": ["Julgamento", "Punição", "Agressão Contínua"],
  "Anel D": ["Julgamento", "Punição", "Agressão Contínua"],
  "Bracelete E": ["Destruição", "Vida", "Tempo"],
  "Bracelete D": ["Destruição", "Vida", "Tempo"],
};

const skillTargets = [
  ["judgment", "Julgamento", 20],
  ["punishment", "Punição", 20],
  ["pummel", "Agressão Contínua", 20],
] as const;

export function analyzeBuild(build: Build, context: AnalysisContext): Recommendation[] {
  const cls = norm(build.profile?.className || "");
  const out: Recommendation[] = [];
  const guide = resolveClassGuide(cls);
  out.push({
    id: `class-profile-${guide?.id || "unknown"}`, area: "data", priority: 3,
    title: guide ? `${guide.label} · ${guide.role}` : `${build.profile?.className || "Classe"} · identificação pendente`,
    action: guide ? `Base Global selecionada. Arma de referência: ${guide.weapon}.` : "A análise continua pelos dados do personagem, sem assumir regras de outra classe.",
    evidence: guide ? "Classe reconhecida no catálogo das oito classes Global." : "Nome da classe não corresponde ao catálogo Global conhecido.",
    sourceTitle: guide ? `Daeva Guides · ${guide.label}` : "PAD PLAN · integridade de dados", sourceUrl: guide?.url || "", confidence: guide ? "guia" : "a conferir", context,
  });

  const empty = slots.filter(slot => !build.items[slot]).slice(0, 2);
  for (const slot of empty) out.push({
    id:`empty-${slot}`, area:"item", priority:2, title:`${slot}: slot sem registro`,
    action:"Carregue o perfil novamente ou registre a peça manualmente antes de comparar upgrades.",
    evidence:"Uma recomendação de troca exige conhecer a peça atual.", sourceTitle:"PAD PLAN · análise do personagem", sourceUrl:"", confidence:"confirmado", context, slot,
  });
  for (const [slot,item] of Object.entries(build.items).filter(([,x])=>x && !x.additionals.length).slice(0,2)) out.push({
    id:`missing-adds-${slot}`, area:"additional", priority:1, title:`${slot}: adicionais não carregados`,
    action:`Abra ${item!.name} e registre as linhas antes de decidir um reroll.`, evidence:"O item existe, mas não há linhas adicionais comparáveis.",
    sourceTitle:"PAD PLAN · análise do personagem", sourceUrl:"", confidence:"confirmado", context, slot,
  });

  const isTemplar = cls.includes("templar") || cls.includes("templario");
  if (!isTemplar) return out.sort((a,b)=>a.priority-b.priority).slice(0,12);

  for (const [id, name, target] of skillTargets) {
    const current = build.totals[id] || 0;
    if (current < target) out.push({
      id: `skill-${id}`, area: "skill", priority: current >= 18 ? 1 : 2,
      title: `${name}: ${current} → ${target}`,
      action: `Buscar +${target-current} nível(is) somando arcanas, anéis e progressão confirmada.`,
      evidence: "Global S1 recomenda os marcos 20 de Julgamento e Punição; Pummel é o alvo seguinte.",
      sourceTitle: "SolAshur · Templar Global Season 1", sourceUrl: SOL, confidence: "guia", context,
    });
  }

  if (context === "pve" || context === "solo") {
    for (const [slot, priorities] of Object.entries(pveBySlot)) {
      const item = build.items[slot];
      if (!item) continue;
      const lines = norm([...item.attributes, ...item.additionals].join(" "));
      const missing = priorities.find(line => !lines.includes(norm(line)));
      if (missing) out.push({
        id: `add-${slot}-${norm(missing)}`, area: "additional", priority: priorities[0] === missing ? 1 : 2,
        title: `${slot}: buscar ${missing}`,
        action: `Próxima linha recomendada para ${item.name}. Confirme no jogo se este registro pode rolar no slot/versão atual.`,
        evidence: `Ordem JvA por slot: ${priorities.join(" → ")}.`, sourceTitle: "AION2 Guidance · Templário S1 Global", sourceUrl: GUIDANCE, confidence: "guia", context, slot,
      });
    }
  } else {
    out.push({
      id: "pvp-stat-package", area: "additional", priority: 1,
      title: "Pacote PvP: Bloqueio, Exatidão e resistência",
      action: "Compare as linhas possíveis de cada slot antes de rerrolar; não trate esta ordem como prioridade PvE.",
      evidence: "SolAshur prioriza Bloqueio, Accuracy, Crítico, Resistência Perfeita, Resistência a Status e Willpower em PvP.",
      sourceTitle: "SolAshur · pacote PvP", sourceUrl: SOL, confidence: "guia", context,
    });
  }

  const arcanaTargets: Array<[string, string[]]> = [
    ["cálice", ["judgment", "punishment"]],
    ["manuscrito", ["judgment", "punishment"]],
    ["bússola", ["pummel", "shieldSmite"]],
  ];
  for (const card of build.arcanas) {
    const target = arcanaTargets.find(([needle]) => norm(card.name).includes(norm(needle)));
    if (!target) continue;
    const best = target[1].find(id => !card.lines.some(line => line.id === id && line.bonus >= 3));
    if (!best) continue;
    const label = card.lines.find(line => line.id === best)?.name || best;
    const attempts = attemptsLeft(card);
    out.push({
      id: `arcana-${card.id}-${best}`, area: "arcana", priority: attempts ? 1 : 2,
      title: `${card.name}: direcionar para ${label}`,
      action: attempts ? `Restam ${attempts} tentativa(s) nesta carta; registre um ponto por resultado.` : "Carta sem tentativas: compare com uma nova antes de substituir.",
      evidence: "Combinação de cartas/skills indicada por guias Global S1; a distribuição final depende do resultado real.",
      sourceTitle: "AION2 Guidance + Daeva Guides", sourceUrl: DAEVA, confidence: "guia", context,
    });
  }

  return out.sort((a,b) => a.priority-b.priority).slice(0, 12);
}
