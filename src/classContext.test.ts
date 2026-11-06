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
  it("possui estratégia isolada para as oito classes Global",()=>{
    const classes=["Templário","Encantador","Gladiador","Assassino","Arqueiro","Mago","Espiritualista","Clérigo"];
    const resolved=classes.map(name=>strategyFor(name));
    expect(resolved.every(Boolean)).toBe(true);
    expect(new Set(resolved.map(x=>x!.id)).size).toBe(8);
    for(const strategy of resolved){
      expect(strategy!.skills.length).toBeGreaterThanOrEqual(3);
      expect(strategy!.ringSkills.length).toBeGreaterThanOrEqual(3);
      expect(Object.keys(strategy!.arcana).length).toBe(5);
      expect(strategy!.source.url).toMatch(/^https:\/\//);
    }
  });
  it("não oferece skills de Templário aos outros perfis",()=>{
    for(const name of ["Gladiador","Assassino","Arqueiro","Mago","Espiritualista","Clérigo","Encantador"]){
      const strategy=strategyFor(name)!;
      expect(strategy.ringSkills).not.toContain("Julgamento");
      expect(strategy.arcana["manuscrito"]||[]).not.toContain("Punição");
    }
  });
});
