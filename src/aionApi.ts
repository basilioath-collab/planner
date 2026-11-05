import type { Arcana, Build, Item } from "./domain";

export type CharacterHit = {
  characterId: string;
  name: string;
  level: number;
  serverId: number;
  serverName: string;
  region: string;
  profileImageUrl?: string;
};
type ApiEquipment = {
  id: number;
  name: string;
  grade: string;
  icon: string;
  enchantLevel: number;
  exceedLevel: number;
  slotPosName: string;
};
const slotMap: Record<string, string> = {
  MainHand: "Arma",
  SubHand: "Escudo",
  Helmet: "Elmo",
  Shoulder: "Ombreiras",
  Torso: "Peitoral",
  Gloves: "Manoplas",
  Pants: "Calças",
  Boots: "Botas",
  Cape: "Capa",
  Belt: "Cinto",
  Necklace: "Colar",
  Earring1: "Brinco E",
  Earring2: "Brinco D",
  Ring1: "Anel E",
  Ring2: "Anel D",
  Bracelet1: "Bracelete E",
  Bracelet2: "Bracelete D",
  Amulet: "Amuleto",
  Rune1: "Runa E",
  Rune2: "Runa D",
};
const clean = (s: string) => s.replace(/<[^>]+>/g, "");
const apiBase = import.meta.env.VITE_AION_API_BASE || "/aion-api";
async function json(path: string) {
  const r = await fetch(`${apiBase}${path}`);
  if (!r.ok) throw Error(`Serviço Aion indisponível (${r.status})`);
  return r.json();
}
export async function searchCharacters(
  nick: string,
  region = "la",
): Promise<CharacterHit[]> {
  const d = await json(
    `/search?nick=${encodeURIComponent(nick)}&region=${region}`,
  );
  return (d.list || []).map((x: any) => ({ ...x, name: clean(x.name) }));
}
export async function fetchCharacter(hit: CharacterHit) {
  const rawId = decodeURIComponent(hit.characterId);
  const q = `region=${hit.region}&characterId=${encodeURIComponent(rawId)}&serverId=${hit.serverId}`;
  const [info, equipment] = await Promise.all([
    json(`/info?${q}`),
    json(`/equipment?${q}`),
  ]);
  return { info, equipment };
}
export function applyOfficialImport(base: Build, payload: any): Build {
  const list: ApiEquipment[] =
    payload.equipment?.equipment?.equipmentList || [];
  const items: Record<string, Item | undefined> = {};
  for (const x of list) {
    const slot = slotMap[x.slotPosName];
    if (!slot || x.slotPosName.startsWith("Arcana")) continue;
    items[slot] = {
      id: `official-${x.slotPosName}-${x.id}`,
      slot,
      name: x.name,
      rarity: x.grade,
      enhancement: x.enchantLevel,
      attributes: [],
      additionals: [],
      notes: x.exceedLevel ? `Transcendência +${x.exceedLevel}` : "",
      source: "Perfil oficial Aion 2 · linhas adicionais não expostas pela API",
      updated: new Date().toISOString().slice(0, 10),
      preserve: false,
      icon: x.icon,
      externalId: x.id,
      exceedLevel: x.exceedLevel,
    };
  }
  const w = payload.equipment?.petwing?.wing;
  if (w)
    items.Asas = {
      id: `official-wing-${w.id}`,
      slot: "Asas",
      name: w.name,
      rarity: w.grade,
      enhancement: w.enchantLevel || 0,
      attributes: [],
      additionals: [],
      notes: "",
      source: "Perfil oficial Aion 2",
      updated: new Date().toISOString().slice(0, 10),
      preserve: false,
      icon: w.icon,
      externalId: w.id,
    };
  const arcanas = base.arcanas.map((a: Arcana) => {
    const x = list.find(
      (y) => y.slotPosName.startsWith("Arcana") && y.name === a.name,
    );
    return x
      ? { ...a, enhancement: x.enchantLevel, icon: x.icon, externalId: x.id }
      : a;
  });
  const skill = payload.equipment?.skill?.skillList || [];
  const level = (name: string, fallback: number) =>
    skill.find((x: any) => x.name === name)?.skillLevel ?? fallback;
  return {
    ...base,
    items,
    arcanas,
    totals: {
      ...base.totals,
      judgment: level("Julgamento", base.totals.judgment),
      punishment: level("Punição", base.totals.punishment),
      pummel: level("Agressão Contínua", base.totals.pummel),
    },
    gs:
      payload.info?.stat?.statList?.find((x: any) => x.type === "ItemLevel")
        ?.value ?? base.gs,
    cp: payload.info?.profile?.combatPower ?? base.cp,
    name: `Atual · importada ${new Date().toLocaleDateString("pt-BR")}`,
  };
}
