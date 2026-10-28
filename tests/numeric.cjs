'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),K=require('../source/core.cjs'),{native}=require('./native-oracle.cjs');
const report={completion:false,passed:false,oracle:'Independent Pokémon Showdown Champions mod 1242c1e2d9763ba5b85d33f13aecb89bae19ae3d',cases:[],failures:[],comparisons:0,limitations:['Community Champions models, not official game executable or complete rules certification','Single hit damage, deterministic 16 rolls; extra-effect probabilities and full battles excluded']};
function actor(id,changes={}){const s=K.species(id);return {...K.unknownActor(id),side:'own',key:'a',...changes,item:changes.item??s.requiredItem??''};}
function check(id,a,b,m,ctx={},opts={}){
 b={...b,side:a.side==='opp'?'own':'opp',key:'b'};ctx={weather:'none',terrain:'none',...ctx};ctx.actives=ctx.actives||[a,b];
 const r=K.compute(a,b,m,ctx,opts);if(r.unsupported){report.cases.push({id,status:'unverified',reason:r.unsupported});return;}
 assert(r.rolls,'Single-hit numeric matrix required');const n=native(a,b,m,ctx,opts);const different=[];for(let i=0;i<16;i++){report.comparisons++;if(r.rolls[i]!==n.rolls[i])different.push({roll:85+i,actual:r.rolls[i],expected:n.rolls[i]});}
 const statsDiff=['attackStats','defenseStats'].flatMap((k,j)=>K.STATS.filter(s=>r[k][s]!==n[j?'dStats':'aStats'][s]).map(s=>({role:k,stat:s,actual:r[k][s],expected:n[j?'dStats':'aStats'][s]})));
 if(different.length||statsDiff.length)report.failures.push({id,source:a.id,ability:a.ability,target:b.id,targetAbility:b.ability,move:m,ctx,different,statsDiff});
 report.cases.push({id,status:different.length||statsDiff.length?'failed':'passed',a:a.id,b:b.id,aa:a.ability,da:b.ability,move:m,crit:!!opts.crit,range:r.range});
}
const base=()=>actor('snorlax',{ability:'Immunity'});
// Cover all type pairs and defensive/attacking natures/ranks on eligible forms.
const samples=['rillaboom','sneasler','incineroar','primarina','garchomp','gardevoirmega','floettemega','charizardmegax','tyranitar','azumarill','dragonite','pelipper','mausholdfour','baxcalibur','metagrossmega','swampertmega'].filter(id=>K.BY_ID[id]);
for(const [i,id]of samples.entries()){
 const rec=K.species(id),moves=rec.major.filter(m=>K.DATA.moves[m]?.power>0&&!K.DATA.moves[m].multihit&&!K.EXCLUDED_MOVES[m]).slice(0,3);
 for(const move of moves)for(const weather of ['none','sun','rain','sand','snow'])for(const terrain of ['none','electric','grassy','psychic','misty']){
  const a=actor(id,{points:[2,32,0,0,0,32],nature:i%2?'Adamant':'Jolly',boosts:[(i%5)-2,0,0,0],burn:i%3===0});
  const b=actor(samples[(i+5)%samples.length],{points:[32,0,32,0,0,2],nature:'Bold',boosts:[0,0,0,(i%5)-2],fullHpCondition:true});
  check('matrix/'+id+'/'+move+'/'+weather+'/'+terrain,a,b,move,{weather,terrain});
 }
}
const attackAbilities=['Fairy Aura','Tough Claws','Huge Power','Pure Power','Adaptability','Technician','Guts','Iron Fist','Strong Jaw','Reckless','Sheer Force','Tinted Lens','Pixilate','Aerilate','Refrigerate','Liquid Voice','Solar Power','Sand Force'];
for(const ability of attackAbilities){
 const s=K.DATA.species.find(s=>s.abilities.includes(ability));if(!s){report.cases.push({id:'ability/'+ability,status:'unverified',reason:'No eligible owner in available model'});continue;}
 const flags={"Tough Claws":"contact","Iron Fist":"punch","Strong Jaw":"bite","Liquid Voice":"sound"};
 const flag=flags[ability];let moves=s.moves.filter(m=>{const x=K.DATA.moves[m];return x?.power>=40&&!x.multihit&&x.category!=='Status'&&(!flag||x.flags[flag]);}).slice(0,3);
 if(['Pixilate','Aerilate','Refrigerate'].includes(ability))moves=s.moves.filter(m=>K.DATA.moves[m]?.type==='Normal'&&K.DATA.moves[m]?.power>0&&!K.DATA.moves[m].multihit).slice(0,3);
 for(const move of moves)check('ability/'+ability+'/'+move,actor(s.id,{ability,burn:ability==='Guts'}),base(),move,{weather:ability==='Solar Power'?'sun':ability==='Sand Force'?'sand':'none'});
}
for(const ability of ['Multiscale','Thick Fat','Fluffy','Fur Coat','Ice Scales','Filter','Solid Rock','Heatproof','Soundproof','Bulletproof','Levitate','Flash Fire','Water Absorb','Storm Drain','Volt Absorb','Lightning Rod','Motor Drive','Sap Sipper','Overcoat','Unaware']){
 const s=K.DATA.species.find(s=>s.abilities.includes(ability));if(!s){report.cases.push({id:'defense/'+ability,status:'unverified',reason:'No eligible owner in available model'});continue;}
 for(const [src,move]of [['charizard','flamethrower'],['garchomp','earthquake'],['primarina','hypervoice'],['sneasler','closecombat'],['rillaboom','energyball'],['raichu','thunderbolt'],['charizard','shadowball']]){
  if(!K.BY_ID[src])continue;check('defense/'+ability+'/'+move,actor(src,{boosts:[2,0,2,0]}),actor(s.id,{ability,fullHpCondition:true,boosts:[0,2,0,2]}),move);
 }
}
for(const burn of [false,true])for(const boosts of [-6,-2,0,2,6])for(const move of ['facade','closecombat']){
 let s=K.DATA.species.find(s=>s.abilities.includes('Guts'));
 check('burn/guts/'+burn+'/'+boosts+'/'+move,actor(s.id,{ability:'Guts',burn,boosts:[boosts,0,0,0]}),base(),move);
 check('burn/normal/'+burn+'/'+boosts+'/'+move,actor('sneasler',{burn,boosts:[boosts,0,0,0]}),base(),move);
}
for(const crit of [false,true])for(const rank of [-6,-1,0,1,6])check('critical/'+crit+'/'+rank,actor('garchomp',{boosts:[rank,0,0,0]}),actor('snorlax',{boosts:[0,-rank,0,0]}),'dragonclaw',{}, {crit});
for(const item of ['Life Orb','Expert Belt','Charcoal','Mystic Water','Muscle Band','Wise Glasses']){
 if(!K.DATA.items.some(it=>it.name===item))continue;for(const [src,m]of [['charizard','flamethrower'],['garchomp','dragonclaw']])check('item/'+item+'/'+m,actor(src,{item}),base(),m);
}
for(const berry of ['Occa Berry','Passho Berry','Wacan Berry','Rindo Berry','Yache Berry','Chople Berry','Shuca Berry','Coba Berry','Payapa Berry','Tanga Berry','Charti Berry','Kasib Berry','Haban Berry','Colbur Berry','Babiri Berry','Roseli Berry','Chilan Berry']){
 const types={"Occa Berry":['rillaboom','charizard','flamethrower'],"Passho Berry":['charizard','primarina','surf'],"Wacan Berry":['primarina','raichu','thunderbolt'],"Rindo Berry":['primarina','rillaboom','woodhammer'],"Yache Berry":['garchomp','primarina','icebeam'],"Chople Berry":['snorlax','sneasler','closecombat'],"Shuca Berry":['raichu','garchomp','earthquake'],"Coba Berry":['rillaboom','charizard','airslash'],"Payapa Berry":['sneasler','gardevoir','psychic'],"Tanga Berry":['meowscarada','scizor','xscissor'],"Charti Berry":['charizard','garchomp','rockslide'],"Kasib Berry":['gardevoir','gengar','shadowball'],"Haban Berry":['garchomp','garchomp','dragonclaw'],"Colbur Berry":['gardevoir','incineroar','darkestlariat'],"Babiri Berry":['gardevoir','metagross','ironhead'],"Roseli Berry":['garchomp','gardevoir','moonblast'],"Chilan Berry":['snorlax','snorlax','bodyslam']};
 if(!K.DATA.items.some(it=>it.name===berry))continue;const [def,src,m]=types[berry];if(K.BY_ID[def]&&K.BY_ID[src])check('berry/'+berry,actor(src),actor(def,{item:berry}),m);
}
// Global effects use only active four, on either team's attacks; Friend Guard never protects itself.
const aura=actor('floettemega',{key:'own1',side:'own'}),fgOwner=K.DATA.species.find(s=>s.abilities.includes('Friend Guard'));
for(const sourceSide of ['own','opp'])for(const active of [false,true]){
 const a=actor('gardevoir',{side:sourceSide,key:'a'}),b={...base(),side:sourceSide==='own'?'opp':'own',key:'b'};
 check('global/fairy/'+sourceSide+'/'+active,a,b,'moonblast',{actives:[a,b,{...aura,active}]});
}
if(fgOwner){for(const ally of [false,true]){const a=actor('garchomp'),b={...base(),side:'opp',key:'b'},f=actor(fgOwner.id,{side:'opp',key:'opp1',ability:'Friend Guard',active:ally});check('global/friendguard/'+ally,a,b,'earthquake',{actives:[a,b,f]});}check('friendguard/not-self',actor('garchomp'),actor(fgOwner.id,{ability:'Friend Guard'}),'earthquake');}
check('moldbreaker/levitate',actor(K.DATA.species.find(s=>s.abilities.includes('Mold Breaker')).id,{ability:'Mold Breaker'}),actor('rotomwash',{ability:'Levitate'}),'earthquake');
for(const active of [false,true])check('multiscale-active/'+active,actor('rillaboom'),actor('dragonite',{ability:'Multiscale',fullHpCondition:active}),'woodhammer');
for(const m of ['flamethrower','airslash','dragonpulse'])check('toughclaws/noncontact/'+m,actor('charizardmegax'),base(),m);
check('manual/drought-under-rain',actor('charizardmegay'),base(),'flamethrower',{weather:'rain'});
check('manual/drizzle-under-sun',actor('pelipper',{ability:'Drizzle'}),base(),'weatherball',{weather:'sun'});
check('manual/grassy-surge-no-terrain',actor('rillaboom',{ability:'Grassy Surge'}),base(),'woodhammer',{terrain:'none'});
check('critical/shell-armor',actor('garchomp'),actor('slowbromega'),'dragonclaw',{}, {crit:true});
check('berry/Kebia Berry',actor('sneasler'),actor('sylveon',{item:'Kebia Berry'}),'poisonjab');
check('moldbreaker/multiscale-berry',actor('excadrill',{ability:'Mold Breaker',points:[2,32,0,0,0,32],nature:'Adamant'}),actor('dragonite',{ability:'Multiscale',fullHpCondition:true,item:'Charti Berry',points:[32,0,32,0,0,2],nature:'Bold'}),'rockslide',{weather:'rain'});
check('special/bodypress',actor('corviknight',{points:[32,0,32,0,0,2],nature:'Bold',boosts:[0,2,0,0]}),base(),'bodypress');
check('special/foulplay',actor('umbreon'),actor('azumarill',{ability:'Huge Power',points:[32,32,0,0,0,2],nature:'Adamant',boosts:[2,0,0,0]}),'foulplay');
check('special/psyshock',actor('gardevoir',{points:[2,0,0,32,0,32],nature:'Modest',boosts:[0,0,2,0]}),actor('snorlax',{points:[32,0,32,0,0,2],nature:'Bold',boosts:[0,2,0,-2]}),'psyshock');
for(const move of ['flowertrick','frostbreath','stormthrow']){const s=K.DATA.species.find(s=>s.moves.includes(move));if(s)check('guaranteed-critical/'+move,actor(s.id,{boosts:[-2,0,-2,0]}),base(),move);}
for(const active of [false,true])check('reactive/flashfire/'+active,actor('arcanine',{ability:'Flash Fire',abilityOn:active}),base(),'flamethrower');
for(const sourceId of ['temperflare','stompingtantrum'])for(const power of [75,150]){const owner=K.DATA.species.find(s=>s.moves.includes(sourceId));if(owner)check('conditional-power/'+sourceId+'/'+power,actor(owner.id),base(),sourceId,{}, {power});}
check('unaware/attacking',actor('clefable',{ability:'Unaware',boosts:[0,0,2,0]}),actor('snorlax',{boosts:[0,0,0,4]}),'moonblast');
for(const ability of K.HISTORY){const owner=K.DATA.species.find(s=>s.abilities.includes(ability));if(owner)for(const move of ['dragonclaw','flamethrower'])check('manual-ranks/'+ability+'/'+move,actor(owner.id,{ability,boosts:[2,0,-2,0]}),base(),move);}
for(const ability of ['Drought','Drizzle','Sand Stream','Snow Warning','Electric Surge','Grassy Surge','Psychic Surge','Misty Surge']){const owner=K.DATA.species.find(s=>s.abilities.includes(ability));if(owner)check('manual-field/'+ability,actor(owner.id,{ability}),base(),'weatherball',{weather:'rain',terrain:'misty'});}
for(const [id,item,move]of [['floetteeternal','Eviolite','flamethrower'],['snorlax','Assault Vest','flamethrower'],['snorlax','Air Balloon','earthquake']])if(K.DATA.items.some(x=>x.name===item))check('defensive-item/'+item,actor('garchomp'),actor(id,{item}),move);
for(const ability of ['Cloud Nine','Air Lock']){const owner=K.DATA.species.find(s=>s.abilities.includes(ability));if(owner){const a=actor('charizard'),b={...base(),side:'opp',key:'b'},ally=actor(owner.id,{side:'own',key:'ally',ability});check('global/weather-suppression/'+ability,a,b,'flamethrower',{weather:'sun',actives:[a,b,ally]});}}
for(const [ability,moves]of [['Reckless',['bravebird','doubleedge']],['Sheer Force',['bodyslam','flamethrower']],['Sand Force',['bulldoze','earthpower']]]){
 const owner=K.DATA.species.find(s=>s.abilities.includes(ability));if(!owner)continue;
 for(const move of moves){const a=actor(owner.id,{ability}),b={...base(),side:'opp',key:'b'},ctx={weather:ability==='Sand Force'?'sand':'none',terrain:'none'};
  check('effect-confirmation/'+ability+'/'+move,a,b,move,ctx);
  // Control isolates the multiplier; the No Ability control is not a legal registration.
  assert.notDeepEqual(native(a,b,move,ctx).rolls,native({...a,ability:'No Ability'},b,move,ctx).rolls,'Effect must actually activate: '+ability+'/'+move);
 }
}
for(const active of [false,true]){const a=actor('ampharos',{ability:'Plus'}),b={...base(),side:'opp',key:'b'},ally=actor('manectric',{ability:'Minus',side:'own',key:'ally',active});check('adjacent/plusminus/'+active,a,b,'thunderbolt',{actives:[a,b,ally]});}
report.passed=report.failures.length===0;fs.writeFileSync('reference/NUMERIC_RESULTS.json',JSON.stringify(report,null,2)+'\n');console.log('Numeric',report.cases.length,'cases',report.comparisons,'rolls','failures',report.failures.length);console.log(JSON.stringify(report.failures.slice(0,4),null,2));process.exitCode=report.passed?0:1;
