import type { Build } from "./domain";

export type ClassStrategy = {
  id:string; aliases:string[]; label:string; role:string; weapon:string;
  skills:Array<{names:string[];label:string;target:number}>;
  ringSkills:string[]; stats:string[];
  arcana:Record<string,string[]>; source:{title:string;url:string;context:string};
};
const norm=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export const strategies:ClassStrategy[]=[
  {id:"templar",aliases:["templar","templario"],label:"Templário",role:"Tank",weapon:"Espada e escudo",skills:[
    {names:["judgment","julgamento"],label:"Julgamento",target:20},{names:["punishment","punicao"],label:"Punição",target:20},{names:["pummel","agressao continua"],label:"Pummel",target:20}],ringSkills:["Julgamento","Punição","Agressão Contínua"],stats:["Velocidade de Combate","Amplificação de Dano de Arma","Poder"],arcana:{"cálice":["Julgamento","Punição"],"manuscrito":["Punição","Julgamento"],"bússola":["Pummel","Shield Smite"]},source:{title:"SolAshur · Templar Global S1",url:"https://solashur.com/builds/aion2-templar-global-build-guide.html",context:"Global · S1"}},
  {id:"chanter",aliases:["chanter","encantador","aede","cantor"],label:"Encantador",role:"Suporte / DPS",weapon:"Cajado e guarda",skills:[
    {names:["dark crush","esmagamento sombrio"],label:"Esmagamento Sombrio",target:16},{names:["onslaught","golpe estilhacante"],label:"Golpe Estilhaçante",target:16},{names:["spinning strike","golpe giratorio"],label:"Golpe Giratório",target:16},{names:["recuperation","recuperacao"],label:"Recuperação",target:16}],ringSkills:["Esmagamento Sombrio","Golpe Estilhaçante","Golpe Giratório","Recuperação"],stats:["Precisão","Ataque","Velocidade de Combate","Redução de Tempo de Recarga","Amplificação de Dano"],arcana:{"cálice":["Esmagamento Sombrio"],"manuscrito":["Esmagamento Sombrio","Golpe Estilhaçante","Golpe Giratório"],"bússola":["Recuperação","Golpe Incandescente"],"sino":["Preparar Ataque","Bênção da Vida"],"espelho":["Promessa do Vento","Acerto de Impacto","Feitiço da Inspiração"]},source:{title:"AION2 Guidance · Chanter Global",url:"https://www.aion2guidance.com/pt-br/chanter/",context:"Global · consultado em 06/11/2026"}},
];
export const strategyFor=(className:string)=>strategies.find(s=>s.aliases.some(a=>norm(className).includes(a)));

export function visibleSkills(build:Build,totals:Record<string,number>,limit=4){
  const rows=Object.entries(totals).map(([id,value])=>({id,value,label:build.skillNames?.[id]||id}));
  const strategy=strategyFor(build.profile.className);
  if(!rows.length) return [];
  if(!strategy) return rows.sort((a,b)=>b.value-a.value).slice(0,limit);
  const ranked=strategy.skills.map(target=>rows.find(row=>target.names.some(n=>norm(row.id+" "+row.label).includes(norm(n))))).filter(Boolean) as typeof rows;
  return [...ranked,...rows.filter(r=>!ranked.some(x=>x.id===r.id)).sort((a,b)=>b.value-a.value)].slice(0,limit);
}

export function classGoals(build:Build,totals:Record<string,number>){
  const strategy=strategyFor(build.profile.className);
  if(!strategy) return visibleSkills(build,totals,3).map((s,i)=>({kind:i?"DESENVOLVER":"PRIORIDADE",title:s.label,text:"Habilidade registrada no perfil oficial. Defina a meta manualmente antes de planejar linhas de equipamento.",value:s.value,source:"Perfil oficial carregado"}));
  return strategy.skills.slice(0,3).map((target,i)=>{
    const skill=visibleSkills(build,totals,20).find(s=>target.names.some(n=>norm(s.id+" "+s.label).includes(norm(n))));
    const value=skill?.value||0;
    return {kind:i?"DESENVOLVER":"PRIORIDADE",title:target.label,text:value>=target.target?`Marco ${target.target} atingido neste registro.`:`Buscar ${target.target-value} nível(is) sem sacrificar prioridades anteriores.`,value,source:strategy.source.title};
  });
}

export function arcanaTargetsFor(build:Build,cardName:string){
  const strategy=strategyFor(build.profile.className); if(!strategy)return [];
  const key=Object.keys(strategy.arcana).find(k=>norm(cardName).includes(norm(k)));
  return key?strategy.arcana[key]:[];
}
