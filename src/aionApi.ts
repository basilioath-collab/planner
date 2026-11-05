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
  slotPos: number;
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
const iconUrl = (url?: string) => {
  if (!url) return undefined;
  try {
    const name = new URL(url).pathname.split("/").at(-1);
    return name ? `${apiBase}/asset?name=${encodeURIComponent(name)}` : url;
  } catch { return url; }
};
async function json(path: string, fresh = false) {
  const r = await fetch(`${apiBase}${path}`, fresh ? {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  } : undefined);
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
  // O perfil deve refletir o estado ao clicar em atualizar. O mesmo padrão de
  // cache-buster é usado por armories que consomem a API oficial da NCSOFT.
  const q = `region=${hit.region}&characterId=${encodeURIComponent(rawId)}&serverId=${hit.serverId}&_t=${Date.now()}`;
  const [info, equipment] = await Promise.all([
    json(`/info?${q}`, true),
    json(`/equipment?${q}`, true),
  ]);
  const rows: ApiEquipment[] = equipment?.equipment?.equipmentList || [];
  const details: Record<number, any> = {};
  for (let i = 0; i < rows.length; i += 5) {
    await Promise.all(
      rows.slice(i, i + 5).map(async (x) => {
        try {
          details[x.slotPos] = await json(
            `/item?${q}&id=${x.id}&slotPos=${x.slotPos}&enchantLevel=${x.enchantLevel}&exceedLevel=${x.exceedLevel || 0}`,
            true,
          );
        } catch {
          /* o resumo oficial permanece utilizável */
        }
      }),
    );
  }
  return { info, equipment, details, hit };
}
export function applyOfficialImport(base: Build, payload: any): Build {
  const list: ApiEquipment[] =
    payload.equipment?.equipment?.equipmentList || [];
  const items: Record<string, Item | undefined> = {};
  for (const x of list) {
    const slot = slotMap[x.slotPosName];
    if (!slot || x.slotPosName.startsWith("Arcana")) continue;
    const d = payload.details?.[x.slotPos];
    const stat = (v: any) =>
      `${v.name}: ${v.minValue ? `${v.minValue}–` : ""}${v.value}${v.extra && v.extra !== "0" ? ` (+${v.extra} aprim.)` : ""}`;
    items[slot] = {
      id: `official-${x.slotPosName}-${x.id}`,
      slot,
      name: x.name,
      rarity: x.grade,
      enhancement: x.enchantLevel,
      attributes: (d?.mainStats || []).map(stat),
      additionals: [
        ...(d?.subStats || []).map(stat),
        ...(d?.subSkills || []).map((v: any) => `${v.name} +${v.level}`),
      ],
      notes: [
        x.exceedLevel ? `Transcendência +${x.exceedLevel}` : "",
        ...(d?.magicStoneStat || []).map(
          (v: any) => `Manastone: ${v.name} ${v.value}`,
        ),
        ...(d?.godStoneStat || []).map((v: any) => `${v.name}: ${v.desc}`),
      ]
        .filter(Boolean)
        .join("\n"),
      source: `Perfil oficial Aion 2${d?.sources?.length ? ` · ${d.sources.join(", ")}` : ""}`,
      updated: new Date().toISOString().slice(0, 10),
      preserve: false,
      icon: iconUrl(x.icon),
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
      icon: iconUrl(w.icon),
      externalId: w.id,
    };
  const incomingName = payload.info?.profile?.characterName || payload.hit?.name || base.profile.name;
  const incomingServer = payload.hit?.serverName || base.profile.serverName;
  const sameCharacter = incomingName.localeCompare(base.profile.name, undefined, { sensitivity: "base" }) === 0
    && incomingServer.localeCompare(base.profile.serverName, undefined, { sensitivity: "base" }) === 0;
  const arcanaRows = list.filter((x) => x.slotPosName.startsWith("Arcana"));
  const arcanas: Arcana[] = arcanaRows.map((x) => {
    const saved = sameCharacter ? base.arcanas.find((a) => a.name === x.name || a.externalId === x.id) : undefined;
    return saved
      ? { ...saved, enhancement: x.enchantLevel, icon: iconUrl(x.icon), externalId: x.id }
      : {
          id: `official-arcana-${x.slotPosName}-${x.id}`,
          name: x.name,
          family: "A conferir",
          enhancement: x.enchantLevel,
          lines: [],
          history: [],
          icon: iconUrl(x.icon),
          externalId: x.id,
        };
  });
  const skill = payload.equipment?.skill?.skillList || [];
  const skins = (payload.equipment?.equipment?.skinList || []).map((x: any) => ({
    id: x.id,
    slot: x.slotPosName,
    name: x.name,
    rarity: x.grade,
    icon: iconUrl(x.icon) || "",
  }));
  const skillKey = (x: any) => `official-skill-${x.id ?? String(x.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const importedTotals = Object.fromEntries(skill.map((x: any) => [skillKey(x), Number(x.skillLevel || 0)]));
  const importedSkillNames = Object.fromEntries(skill.map((x: any) => [skillKey(x), clean(x.name || "Habilidade")]));
  return {
    ...base,
    profile: {
      name: incomingName,
      className: payload.info?.profile?.className || base.profile.className,
      serverName: incomingServer,
      region: payload.hit?.region || base.profile.region,
      level: payload.info?.profile?.characterLevel ?? payload.hit?.level ?? base.profile.level,
      profileImage: payload.info?.profile?.profileImage || payload.hit?.profileImageUrl || base.profile.profileImage,
    },
    items,
    skins,
    arcanas,
    totals: skill.length ? importedTotals : (sameCharacter ? base.totals : {}),
    skillNames: skill.length ? importedSkillNames : (sameCharacter ? base.skillNames : {}),
    rings: sameCharacter ? base.rings : {},
    gs:
      payload.info?.stat?.statList?.find((x: any) => x.type === "ItemLevel")
        ?.value ?? base.gs,
    cp: payload.info?.profile?.combatPower ?? base.cp,
    name: `Atual · sincronizada ${new Date().toLocaleDateString("pt-BR")}`,
  };
}
