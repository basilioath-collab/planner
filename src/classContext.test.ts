import { describe, expect, it } from "vitest";
import { arcanaTargetsFor, classGoals, strategyFor, visibleSkills } from "./classContext";
import { initialBuild } from "./domain";

const chanter={...structuredClone(initialBuild),profile:{...initialBuild.profile,className:"Encantador"},totals:{dark:15,on:13,spin:12},skillNames:{dark:"Esmagamento Sombrio",on:"Golpe Estilhaçante",spin:"Golpe Giratório"}};

describe("contexto de classe",()=>{
  it("resolve Chanter sem herdar metas de Templário",()=>{
    expect(strategyFor("Encantador")?.id).toBe("chanter");
    const labels=visibleSkills(chanter,chanter.totals).map(x=>x.label);
    expect(labels).toContain("Esmagamento Sombrio");
    expect(labels).not.toContain("Julgamento");
    expect(classGoals(chanter,chanter.totals)[0].title).toBe("Esmagamento Sombrio");
  });
  it("usa alvos de Arcana da classe carregada",()=>{
    expect(arcanaTargetsFor(chanter,"Cálice do Vigor")).toEqual(["Esmagamento Sombrio"]);
    expect(arcanaTargetsFor(chanter,"Bússola do Vigor")).toContain("Recuperação");
  });
});
