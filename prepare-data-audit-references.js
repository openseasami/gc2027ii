// Rebuild compact expected values from committed, fixed upstream text. Never fetches.
const fs=require('node:fs'),vm=require('node:vm'),{stripTypeScriptTypes}=require('node:module');
const root=__dirname+'/reference-data/stats-moves/',types={Normal:'ノーマル',Fire:'ほのお',Water:'みず',Electric:'でんき',Grass:'くさ',Ice:'こおり',Fighting:'かくとう',Poison:'どく',Ground:'じめん',Flying:'ひこう',Psychic:'エスパー',Bug:'むし',Rock:'いわ',Ghost:'ゴースト',Dragon:'ドラゴン',Dark:'あく',Steel:'はがね',Fairy:'フェアリー'};
function load(file,key){const s=stripTypeScriptTypes(fs.readFileSync(root+file,'utf8'),{mode:'strip'}).replace('export const '+key,'globalThis.'+key);const ctx={};vm.createContext(ctx);vm.runInContext(s,ctx,{timeout:10000});return ctx[key];}
const dex=load('showdown-pokedex.ts','Pokedex'),moves=load('showdown-moves.ts','Moves'),champ=load('showdown-champions-moves.ts','Moves');
const normalized={species:Object.fromEntries(Object.entries(dex).filter(([,d])=>d.num>0&&d.baseStats).map(([id,d])=>[id,{name:d.name,num:d.num,forme:d.forme,baseSpecies:d.baseSpecies,stats:d.baseStats}])),moves:{}};
for(const [id,base] of Object.entries(moves)){
 const c=champ[id]||{},merged={...base,...c};
 const shape=d=>({power:d.basePower,type:types[d.type],cat:{Physical:'phys',Special:'spec',Status:'status'}[d.category],accuracy:d.accuracy===true?1:d.accuracy/100,alwaysHit:d.accuracy===true,spread:['allAdjacent','allAdjacentFoes'].includes(d.target),target:d.target,variable:!!d.basePowerCallback,multihit:d.multihit,ohko:d.ohko,willCrit:d.willCrit===true,damageCallback:!!d.damageCallback||!!d.damage});
 normalized.moves[id]={general:shape(base),champions:shape(merged),championsOverride:Object.keys(c).filter(k=>k!=='inherit')};
}
fs.writeFileSync(root+'showdown-normalized.json',JSON.stringify(normalized,null,2)+'\n');console.log('Prepared external reference',Object.keys(normalized.species).length,'species and',Object.keys(normalized.moves).length,'moves');
