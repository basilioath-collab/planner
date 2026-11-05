import { describe, expect, it } from "vitest";
import { additionsForSlot } from "./additionalCatalog";

describe("catálogo de adicionais", () => {
  it("filtra opções da arma e incorpora linhas observadas sem duplicar", () => {
    const result = additionsForSlot("Arma", ["Poder: 31", "Acerto de Golpes Múltiplos: 9.1%"]);
    expect(result.some(x => x.label === "Velocidade de Combate")).toBe(true);
    expect(result.some(x => x.label === "Acerto de Golpes Múltiplos")).toBe(true);
    expect(result.filter(x => x.label === "Poder")).toHaveLength(1);
  });
});
