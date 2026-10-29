'use strict';
const K=require('../source/core.cjs'),{native}=require('./native-oracle.cjs'),assert=require('node:assert/strict'),fs=require('fs');
const r={completion:false,passed:false,oracle:'Pokémon Showdown Champions mod 1242c1e2d9763ba5b85d33f13aecb89bae19ae3d; Helping Hand volatile once per recipient',comparisons:0,cases:[],checks:[],roundingExamples:[],limitations:['Independent damage hypotheses only; no Helping Hand user, move selection, action order or simultaneous-turn feasibility is inferred.']};
function actor(id,changes={}){const s=K.species(id);return {...K.unknownActor(id),key:'a',side:'own',...changes,item:changes.item??s.requiredItem??''};}
function check(id,a,b,move,ctx={},opts={}){
 b={...b,key:'b',side:a.side==='own'?'opp':'own'};ctx={weather:'none',terrain:'none',...ctx};ctx.actives=ctx.actives||[a,b];
 const before=JSON.stringify([a,b,ctx]);let off,on;
 for(const helpingHand of [false,true]){
  const source={...a,helpingHand};const actual=K.compute(source,b,move,ctx,opts);assert(!actual.unsupported,id+': '+actual.unsupported);
  const expected=actual.hitRolls.map((_,hit)=>native(source,b,move,ctx,{...opts,hit:hit+1}).rolls);
  assert.deepEqual(actual.hitRolls,expected,id+'/'+helpingHand);r.comparisons+=16*expected.length;
  assert.deepEqual(actual.range,[expected.reduce((s,x)=>s+Math.min(...x),0),expected.reduce((s,x)=>s+Math.max(...x),0)]);
  if(helpingHand)on=actual;else off=actual;
 }
 const restored=K.compute({...a,helpingHand:false},b,move,ctx,opts);assert.deepEqual(restored.hitRolls,off.hitRolls,id+'/restore');assert.equal(JSON.stringify([a,b,ctx]),before);
 assert.deepEqual(on.attackStats,off.attackStats);assert.deepEqual(on.defenseStats,off.defenseStats);
 if(off.rolls&&on.rolls&&r.roundingExamples.length<12&&on.rolls.some((n,i)=>n!==Math.floor(off.rolls[i]*1.5)))r.roundingExamples.push({id,off:off.rolls,on:on.rolls,meaning:'BP modifier is not a final damage multiplication'});
 r.cases.push({id,move,source:a.id,target:b.id,category:K.DATA.moves[move].category,off:off.range,on:on.range,active:a.active!==false,crit:!!opts.crit});
 return {off,on};
}
const fixtures=[
 ['garchomp','dragonclaw',{}],['garchomp','rockslide',{boosts:[2,0,0,0]}],['primarina','hypervoice',{ability:'Liquid Voice'}],['gardevoirmega','hypervoice',{}],['azumarill','aquatail',{ability:'Huge Power'}],['scizor','bulletpunch',{ability:'Technician'}],['charizardmegax','flareblitz',{}],['tauros','bodyslam',{ability:'Sheer Force'}]
];
for(const [id,move,changes]of fixtures)for(const weather of ['none','sun','rain','sand','snow'])for(const terrain of ['none','electric','grassy','psychic','misty']){
 const special=K.DATA.moves[move].category==='Special',a=actor(id,{points:special?[2,0,0,32,0,32]:[2,32,0,0,0,32],nature:special?'Modest':'Adamant',...changes}),b=actor('snorlax',{points:[32,0,32,0,0,2],nature:'Bold'});
 check('matrix/'+id+'/'+move+'/'+weather+'/'+terrain,a,b,move,{weather,terrain});
}
for(const power of [35,55,65,75,95,105])for(const crit of [false,true])for(const item of ['','Life Orb']){
 check('rounding/'+power+'/'+crit+'/'+item,actor('charizard',{item,boosts:[0,0,-1,0]}),actor('dragonite',{ability:'Multiscale',fullHpCondition:true,item:'Occa Berry',points:[32,0,0,32,2,0]}),'flamethrower',{weather:'sun'},{power,crit});
}
for(const burn of [false,true])for(const rank of [-6,-2,0,2,6])check('burn-guts-facade/'+burn+'/'+rank,actor('conkeldurr',{ability:'Guts',burn,boosts:[rank,0,0,0]}),actor('snorlax'),'facade');
for(const ability of ['Mold Breaker','Sand Rush'])check('moldbreaker-levitate/'+ability,actor('excadrill',{ability}),actor('rotomwash',{ability:'Levitate'}),'earthquake');
const guard=actor('mausholdfour',{ability:'Friend Guard',side:'opp',key:'guard'}),aura=actor('floettemega',{side:'opp',key:'aura'});
for(const ally of [guard,aura]){const a=actor('primarina',{side:'opp'}),b={...actor('garchomp'),side:'own',key:'b'};check('opponent-active-support/'+ally.ability,a,b,'moonblast',{actives:[a,b,ally]});}
for(const active of [false,true])check('multiscale/'+active,actor('rillaboom',{burn:true}),actor('dragonite',{ability:'Multiscale',fullHpCondition:active}),'woodhammer');
for(const crit of [false,true])check('active-berry-moldbreaker-lifeorb/'+crit,actor('excadrill',{ability:'Mold Breaker',item:'Life Orb',boosts:[2,0,0,0]}),actor('dragonite',{ability:'Multiscale',fullHpCondition:true,item:'Charti Berry'}),'rockslide',{weather:'sand'},{crit});
for(const item of ['','Wide Lens'])for(const [id,move]of [['mausholdfour','populationbomb'],['weavile','tripleaxel']])check('multihit/'+move+'/'+item,actor(id,{item}),actor('snorlax'),move);
const fixed=check('fixed-damage',actor('machamp'),actor('snorlax'),'seismictoss');assert.deepEqual(fixed.off.range,fixed.on.range);
const benched=check('bench-source-never-borrows-helper',actor('primarina',{active:false,helpingHand:true}),actor('snorlax'),'moonblast');assert.deepEqual(benched.off.range,benched.on.range);
const recipient=actor('primarina'),target=actor('snorlax');assert.deepEqual(K.compute(recipient,{...target,helpingHand:true},'moonblast').range,K.compute(recipient,target,'moonblast').range);
assert(K.compute({...recipient,helpingHand:true},target,'helpinghand').unsupported);assert(K.compute({...recipient,helpingHand:true},target,'protect').unsupported);
assert.deepEqual(K.damageMoves(['helpinghand','protect','moonblast','hypervoice','moonblast','missing']),['moonblast','hypervoice']);
assert(K.DATA.moves.helpinghand.category==='Status');assert(K.species('rillaboom').major.includes('protect'));
const source=actor('garchomp',{helpingHand:true}),other=actor('primarina',{helpingHand:true,key:'ally'}),t={...actor('snorlax'),key:'b',side:'opp'},ctx={actives:[source,other,t]};
assert.deepEqual(K.compute(source,t,'dragonclaw',ctx).rolls,K.compute(source,t,'dragonclaw',{actives:[source,{...other,helpingHand:false},t]}).rolls,'Partner toggle must not stack');
assert.equal(K.activeField({},source,t).attackerSide.isHelpingHand,true);assert.equal(K.activeField({}, {...source,active:false},t).attackerSide.isHelpingHand,false);
assert.deepEqual(K.speedRange(source),K.speedRange({...source,helpingHand:false}));
assert(r.roundingExamples.length>0);
for(const id of ['OFF-ON-OFF-restoration','physical-and-special','BP-rounding-not-final-damage','one-modifier-per-attack','critical-weather-terrain-rank-item-ability-combinations','each-hit-independent','fixed-damage-not-boosted','recipient-not-defender-or-bench','status-excluded-but-retained-in-data'])r.checks.push({id,passed:true});
r.passed=true;fs.writeFileSync('reference/HELPING_HAND_RESULTS.json',JSON.stringify(r,null,2)+'\n');console.log('PASS Helping Hand',r.cases.length,'cases',r.comparisons,'independent rolls;',r.roundingExamples.length,'rounding witnesses');
