export type SkillLine = { id: string; name: string; bonus: number };
export type Arcana = {
  id: string;
  name: string;
  family: "Vigor" | "Mana";
  enhancement: number;
  lines: SkillLine[];
  history: string[];
  target?: string;
  icon?: string;
  externalId?: number;
};
export type Item = {
  id: string;
  slot: string;
  name: string;
  rarity: string;
  enhancement: number;
  attributes: string[];
  additionals: string[];
  notes: string;
  source: string;
  updated: string;
  preserve: boolean;
  icon?: string;
  externalId?: number;
  exceedLevel?: number;
};
export type Frame = {
  x: number;
  y: number;
  scale: number;
  flip: boolean;
  background: number;
  light: number;
};
export type Build = {
  id: string;
  name: string;
  items: Record<string, Item | undefined>;
  arcanas: Arcana[];
  totals: Record<string, number>;
  rings: Record<string, number>;
  gs: number;
  cp: number;
};
export const skills = {
  judgment: "Judgment / Julgamento",
  punishment: "Punishment / Punição",
  pummel: "Pummel / Agressão Contínua",
  fury: "Fury",
  vitality: "Vitalidade",
  shieldSmite: "Shield Smite",
  annihilate: "Annihilate / Erradicação",
  poach: "Poach / Captura",
  defiance: "Defiance",
  wardingStrike: "Warding Strike",
  guardingSeal: "Guarding Seal",
  punishingBenediction: "Punishing Benediction",
  survivalWillpower: "Survival Willpower",
  blockPain: "Block Pain",
  impactHit: "Impact Hit",
  wardingShield: "Warding Shield",
} as const;
const l = (id: keyof typeof skills, bonus: number): SkillLine => ({
  id,
  name: skills[id],
  bonus,
});
export const initialArcanas: Arcana[] = [
  {
    id: "chalice-vigor",
    name: "Cálice do Vigor",
    family: "Vigor",
    enhancement: 4,
    lines: [
      l("judgment", 3),
      l("fury", 1),
      l("vitality", 2),
      l("shieldSmite", 2),
    ],
    history: [],
    target: "judgment",
  },
  {
    id: "manuscript-mana",
    name: "Manuscrito da Mana",
    family: "Mana",
    enhancement: 3,
    lines: [
      l("annihilate", 3),
      l("judgment", 1),
      l("punishment", 2),
      l("poach", 1),
    ],
    history: [],
    target: "punishment",
  },
  {
    id: "compass-vigor",
    name: "Bússola do Vigor",
    family: "Vigor",
    enhancement: 4,
    lines: [
      l("defiance", 2),
      l("shieldSmite", 1),
      l("wardingStrike", 3),
      l("pummel", 2),
    ],
    history: [],
    target: "pummel",
  },
  {
    id: "bell-mana",
    name: "Sino da Mana",
    family: "Mana",
    enhancement: 3,
    lines: [
      l("guardingSeal", 2),
      l("punishingBenediction", 2),
      l("fury", 2),
      l("vitality", 1),
    ],
    history: [],
  },
  {
    id: "mirror-mana",
    name: "Espelho da Mana",
    family: "Mana",
    enhancement: 2,
    lines: [
      l("survivalWillpower", 1),
      l("blockPain", 1),
      l("impactHit", 2),
      l("wardingShield", 2),
    ],
    history: [],
  },
];
export const slots = [
  "Arma",
  "Escudo",
  "Elmo",
  "Ombreiras",
  "Peitoral",
  "Manoplas",
  "Calças",
  "Botas",
  "Capa",
  "Cinto",
  "Asas",
  "Colar",
  "Brinco E",
  "Brinco D",
  "Anel E",
  "Anel D",
  "Bracelete E",
  "Bracelete D",
  "Amuleto",
  "Runa E",
  "Runa D",
];
export const initialBuild: Build = {
  id: "aseo-current",
  name: "Atual · 05/11/2026",
  items: {},
  arcanas: initialArcanas,
  totals: { judgment: 20, punishment: 18, pummel: 16 },
  rings: { judgment: 1, punishment: 1 },
  gs: 2770,
  cp: 161739,
};
export const pointsAvailable = (a: Arcana) => 4 + a.enhancement;
export const pointsUsed = (a: Arcana) =>
  a.lines.reduce((n, x) => n + x.bonus, 0);
export const attemptsLeft = (a: Arcana) => Math.max(0, 5 - a.enhancement);
export function addArcanaPoint(a: Arcana, skillId: string): Arcana {
  if (attemptsLeft(a) <= 0) throw Error("Carta já está em +5");
  const lines = a.lines.map((x) =>
    x.id === skillId ? { ...x, bonus: x.bonus + 1 } : x,
  );
  if (!lines.some((x) => x.id === skillId)) throw Error("Habilidade ausente");
  return {
    ...a,
    enhancement: a.enhancement + 1,
    lines,
    history: [...a.history, skillId],
  };
}
export function replaceArcana(list: Arcana[], next: Arcana) {
  return list.map((x) => (x.id === next.id ? next : x));
}
export function projectedTotals(current: Build, planned: Build) {
  const sum = (ar: Arcana[]) =>
    ar
      .flatMap((a) => a.lines)
      .reduce<
        Record<string, number>
      >((o, x) => ((o[x.id] = (o[x.id] || 0) + x.bonus), o), {});
  const c = sum(current.arcanas),
    p = sum(planned.arcanas);
  return Object.fromEntries(
    Object.entries(current.totals).map(([id, v]) => [
      id,
      v + (p[id] || 0) - (c[id] || 0),
    ]),
  );
}
export const validateArcana = (a: Arcana) =>
  pointsUsed(a) <= pointsAvailable(a);
