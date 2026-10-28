const fs=require('fs'),cp=require('child_process'),C=require('@smogon/calc'),{Dex,TeamValidator}=require('../work/showdown/dist/sim');
const L=require('../reference/legacy-identity.json'),oldUsage=require('../reference/DATA.json');
const v=new TeamValidator('gen9championsvgc2026regmc'),d=v.dex,g=C.Generations.get(0),stats=['hp','atk','def','spa','spd','spe'];
const jpById=Object.fromEntries(Object.entries(L.dex).map(([jp,x])=>[x.id,{...x,jp}]));
const typeNames={Normal:'ノーマル',Fire:'ほのお',Water:'みず',Electric:'でんき',Grass:'くさ',Ice:'こおり',Fighting:'かくとう',Poison:'どく',Ground:'じめん',Flying:'ひこう',Psychic:'エスパー',Bug:'むし',Rock:'いわ',Ghost:'ゴースト',Dragon:'ドラゴン',Dark:'あく',Steel:'はがね',Fairy:'フェアリー'};
const moveJp=Object.fromEntries(Object.entries(L.moves).map(([jp,x])=>[x.id,jp]));
const items=Array.from(g.items).map(it=>({...it,jp:L.items.find(x=>x.id===it.id)?.name||it.name}));
const itemByName=Object.fromEntries(items.map(x=>[x.name,x]));
const all=d.species.all().filter(s=>s.exists&&!s.isNonstandard&&!v.checkSpecies({species:s.name},s,s,{})&&!s.name.includes('-Tera'));
let records=[],exceptions=[],dataChecks=[];
for(const s of all){
 const source=jpById[s.id],base=jpById[C.toID(s.baseSpecies)],jp=source?.jp||(base?base.jp+' ['+s.forme+']':null);
 if(!jp){exceptions.push({name:s.name,reason:'Japanese identity unavailable; no guessed registration'});continue;}
 const model=g.species.get(s.id);if(model){const different=stats.filter(k=>model.baseStats[k]!==s.baseStats[k]);dataChecks.push({id:s.id,checked:6,mismatched:different});}
 const movepool=[...new Set(d.species.getFullLearnset(s.id).flatMap(x=>Object.keys(x.learnset||{})))].filter(id=>!d.moves.get(id).isNonstandard&&g.moves.get(id));
 const usage=oldUsage.find(u=>u.name===jp||u.name===(base?.jp));
 const validUsage=Object.keys(usage?.moves||{}).map(n=>L.moves[n]?.id).filter(id=>movepool.includes(id));
 const fallback=movepool.filter(id=>{const m=d.moves.get(id);return m.basePower>=40&&m.basePower<=150&&m.category!=='Status'&&!m.selfdestruct&&!m.recharge;}).sort((a,b)=>{const x=d.moves.get(a),y=d.moves.get(b);return Number(s.types.includes(y.type))-Number(s.types.includes(x.type))||y.basePower-x.basePower||a.localeCompare(b);});
 let major=[...new Set([...validUsage,...fallback])].slice(0,6);
 records.push({id:s.id,name:s.name,jp,baseId:C.toID(s.changesFrom||(typeof s.battleOnly==='string'?s.battleOnly:s.name)),speciesClause:s.num,baseJp:jpById[C.toID(s.changesFrom||(typeof s.battleOnly==='string'?s.battleOnly:s.name))]?.jp||jp,forme:s.forme||'',isMega:!!s.isMega,battleOnly:s.battleOnly||false,types:s.types,stats:s.baseStats,weightkg:s.weightkg,abilities:[...new Set(Object.values(s.abilities))],requiredItem:s.requiredItem||null,sprite:source?.sprite||base?.sprite||String(s.num),spriteIsBase:!source||!!(s.forme&&String(source?.sprite)===String(s.num)),num:s.num,moves:movepool,major,usageStatus:'unconfirmed-uploaded-v8',cosmeticIdentity:!source,officialEligibility:'unconfirmed'});
}
records.sort((a,b)=>a.num-b.num||Number(a.isMega)-Number(b.isMega)||a.jp.localeCompare(b.jp,'ja'));
const moves={};for(const m of g.moves){const x=d.moves.get(m.id);moves[m.id]={id:m.id,name:m.name,jp:moveJp[m.id]||m.name,type:m.type,category:m.category||x.category,power:m.basePower||0,accuracy:x.exists?x.accuracy:null,priority:x.priority||0,target:m.target||x.target,flags:m.flags||{},multihit:m.multihit||x.multihit||null,source:'@smogon/calc Champions 0.12.0 + Showdown Champions'};}
const abilities=Array.from(g.abilities).map(a=>({id:a.id,name:a.name,jp:L.abilityNames[a.name]||a.name}));
const naturesJP={Hardy:'がんばりや',Lonely:'さみしがり',Brave:'ゆうかん',Adamant:'いじっぱり',Naughty:'やんちゃ',Bold:'ずぶとい',Docile:'すなお',Relaxed:'のんき',Impish:'わんぱく',Lax:'のうてんき',Timid:'おくびょう',Hasty:'せっかち',Serious:'まじめ',Jolly:'ようき',Naive:'むじゃき',Modest:'ひかえめ',Mild:'おっとり',Quiet:'れいせい',Bashful:'てれや',Rash:'うっかりや',Calm:'おだやか',Gentle:'おとなしい',Sassy:'なまいき',Careful:'しんちょう',Quirky:'きまぐれ'};
const out={version:9,completion:false,species:records,moves,items,abilities,natures:Array.from(g.natures).map(n=>({...n,jp:naturesJP[n.name]||n.name})),types:typeNames,provenance:{calculator:'@smogon/calc@0.12.0 Champions generation 0',nativeShowdownCommit:'1242c1e2d9763ba5b85d33f13aecb89bae19ae3d',format:v.format.name,officialEligibility:'unconfirmed; official JS list did not expose entries; executor retrieval 403; not certified from national dex',statistics:'Uploaded v8 includes names and percentages without provenance/date. Numbers withheld; no generated rates.',statFormula:'HP = base + SP + 75; other = floor((base + SP + 20)*nature). Independent Champions implementations agree; official numerical specification and real-game observations not acquired.'}};
fs.writeFileSync('source/data.json',JSON.stringify(out));fs.writeFileSync('reference/DATA_AUDIT.json',JSON.stringify({completion:false,officialCatalogConfirmed:false,sourceCount:all.length,registered:records.length,mega:records.filter(s=>s.isMega).length,cosmeticLabelsInEnglish:records.filter(s=>s.cosmeticIdentity).length,omitted:exceptions,checks:dataChecks,statsCompared:dataChecks.length*6,mismatches:dataChecks.filter(x=>x.mismatched.length),uncomparedWithCalc:records.filter(s=>!g.species.get(s.id)).map(s=>s.name),source:out.provenance},null,2)+'\n');
console.log('Records',records.length,'mega',records.filter(s=>s.isMega).length,'6stats checks',dataChecks.length*6,'mismatches',dataChecks.filter(x=>x.mismatched.length).length,'omitted',exceptions);
