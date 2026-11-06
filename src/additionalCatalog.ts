export type AdditionalOption = { id: string; label: string; group: "atributo" | "skill"; source: string };

const common: AdditionalOption[] = [
  ["attack","Ataque"], ["power","Poder"], ["accuracy","Precisão"],
  ["critical-hit","Acerto Crítico"], ["perfect-accuracy","Acerto Perfeito"],
  ["exaltation","Exaltação"], ["life","Vida"], ["damage-tolerance","Tolerância a Dano"],
].map(([id,label]) => ({ id, label, group:"atributo", source:"AION2 Guidance · Global S1" }));

const bySlot: Record<string, string[]> = {
  Arma: ["Velocidade de Combate","Amplificação de Dano de Arma","Acerto de Golpes Múltiplos"],
  Escudo: ["Velocidade de Combate","Amplificação de Dano de Arma","Bloqueio"],
  Elmo: ["Amplificação de Cura Recebida"],
  Ombreiras: ["Amplificação de Dano Crítico"],
  Peitoral: ["Amplificação de Dano"],
  Manoplas: ["Velocidade de Combate","Acerto Perfeito"],
  Calças: ["Acerto Perfeito","Tolerância a Dano"],
  Botas: ["Velocidade de Movimento","Acerto Perfeito"],
  Capa: ["Ataque","Acerto Crítico"],
  Colar: ["Ataque","Acerto Crítico","Velocidade de Combate"],
  "Brinco E": ["Velocidade de Movimento","Poder"], "Brinco D": ["Velocidade de Movimento","Poder"],
  "Anel E": ["Julgamento","Punição","Agressão Contínua"], "Anel D": ["Julgamento","Punição","Agressão Contínua"],
  "Bracelete E": ["Destruição","Vida","Tempo"], "Bracelete D": ["Destruição","Vida","Tempo"],
};

const key = (v:string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-");
const labelOf = (line:string) => line.split(":")[0].replace(/\s+\+\d+.*$/,"").trim();

export function additionsForSlot(slot:string, observed:string[] = [], classSkills?:string[]): AdditionalOption[] {
  const labels = slot.startsWith("Anel") && classSkills ? classSkills : (bySlot[slot] || []);
  const slotOptions = labels.map(label => ({ id:key(label), label, group:(slot.startsWith("Anel") ? "skill" : "atributo") as AdditionalOption["group"], source:"AION2 Guidance · Global S1" }));
  const observedOptions = observed.map(labelOf).filter(Boolean).map(label => ({ id:key(label), label, group:/\+\d/.test(label) ? "skill" as const : "atributo" as const, source:"Perfil oficial carregado" }));
  return [...slotOptions, ...common, ...observedOptions].filter((x,i,a)=>a.findIndex(y=>key(y.label)===key(x.label))===i).sort((a,b)=>a.label.localeCompare(b.label,"pt-BR"));
}

