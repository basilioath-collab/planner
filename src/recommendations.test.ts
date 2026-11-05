import { describe, expect, it } from "vitest";
import { initialBuild } from "./domain";
import { analyzeBuild } from "./recommendations";

describe("motor analítico", () => {
  it("usa prioridades PvE por slot para Templário", () => {
    const build = structuredClone(initialBuild);
    build.items.Arma = {
      id: "weapon", slot: "Arma", name: "Espada", rarity: "Unique", enhancement: 10,
      attributes: ["Ataque: 100"], additionals: ["Poder: 20"], notes: "", source: "teste", updated: "2026-11-05", preserve: false,
    };
    const result = analyzeBuild(build, "pve");
    expect(result.some(x => x.slot === "Arma" && x.title.includes("Velocidade de Combate"))).toBe(true);
    expect(result.some(x => x.area === "skill" && x.title.includes("Punição"))).toBe(true);
  });

  it("reconhece outra classe sem aplicar regras de Templário", () => {
    const build = structuredClone(initialBuild);
    build.profile.className = "Gladiator";
    const result = analyzeBuild(build, "pve");
    expect(result.some(x => x.title.includes("Gladiador"))).toBe(true);
    expect(result.some(x => x.title.includes("Julgamento"))).toBe(false);
    expect(result.some(x => x.sourceUrl.includes("/gladiator/"))).toBe(true);
  });

  it("separa a recomendação PvP das prioridades PvE", () => {
    const result = analyzeBuild(structuredClone(initialBuild), "pvp");
    expect(result.some(x => x.id === "pvp-stat-package")).toBe(true);
    expect(result.some(x => x.id.startsWith("add-Arma"))).toBe(false);
  });
});
