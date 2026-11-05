import { afterEach, describe, expect, it, vi } from "vitest";
import { applyOfficialImport, fetchCharacter } from "./aionApi";
import { initialBuild } from "./domain";

afterEach(() => vi.unstubAllGlobals());

describe("importação oficial", () => {
  it("mapeia slots sem carregar dados manuais de outro personagem", () => {
    const out = applyOfficialImport(structuredClone(initialBuild), {
      hit: { name: "OutroPersonagem", serverName: "Ariel", region: "la", level: 45 },
      info: { profile: { combatPower: 999 }, stat: { statList: [{ type: "ItemLevel", value: 321 }] } },
      equipment: { equipment: { equipmentList: [
        { id: 1, name: "Espada real", grade: "Unique", icon: "https://example/icon.png", enchantLevel: 10, exceedLevel: 2, slotPosName: "MainHand" },
        { id: 2, name: "Cálice do Vigor", grade: "Unique", icon: "https://example/arcana.png", enchantLevel: 5, exceedLevel: 0, slotPosName: "Arcana1" },
      ], skinList: [{ id: 3, name: "Visual real", grade: "Legend", icon: "https://example/skin.png", slotPosName: "Torso" }] }, skill: { skillList: [{ name: "Julgamento", skillLevel: 20 }] } },
    });
    expect(out.items.Arma?.name).toBe("Espada real");
    expect(out.items.Arma?.exceedLevel).toBe(2);
    expect(out.arcanas[0].enhancement).toBe(5);
    expect(out.arcanas[0].lines).toEqual([]);
    expect(out.rings).toEqual({});
    expect(Object.values(out.totals)).toEqual([20]);
    expect(out.gs).toBe(321);
    expect(out.cp).toBe(999);
    expect(out.profile.name).toBe("OutroPersonagem");
    expect(out.profile.serverName).toBe("Ariel");
    expect(out.skins?.[0].name).toBe("Visual real");
  });

  it("força uma leitura nova do perfil e do equipamento", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(url.includes("/equipment?") ? { equipment: { equipmentList: [] } } : {}), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    await fetchCharacter({ characterId: "encoded%3D", name: "Aseo", level: 45, serverId: 2402, serverName: "Zikel", region: "la" });
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.url).toMatch(/[?&]_t=\d+/);
      expect(call.init?.cache).toBe("no-store");
    }
  });
});
