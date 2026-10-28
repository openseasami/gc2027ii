const fs=require('fs'),assert=require('node:assert/strict'),K=require('../source/core.cjs'),{native}=require('./native-oracle.cjs');
const report={completion:false,passed:false,cases:[],comparisons:0,limitations:['Per-hit independent damage arrays and hit-count totals only. Accuracy/early miss probabilities, reactive contact damage and faint stopping are not certified.']};
const target={...K.unknownActor('snorlax'),points:[32,0,32,0,0,2],nature:'Bold',side:'opp',key:'b'};
for(const [move,max,owner]of [['tripleaxel',3,K.DATA.species.find(s=>s.moves.includes('tripleaxel'))?.id],['populationbomb',10,'mausholdfour']]){
 if(!owner){report.cases.push({move,status:'unverified',reason:'No eligible owner'});continue;}
 for(const item of ['','Wide Lens','Loaded Dice'].filter(n=>!n||K.DATA.items.some(i=>i.name===n))){
  const sp=K.species(owner),ability=sp.abilities.includes('Technician')?'Technician':sp.abilities[0];const a={...K.unknownActor(owner),side:'own',key:'a',item,ability};
  const all=K.compute(a,target,move,{}, {hits:max});
  for(let hit=1;hit<=max;hit++){
   const expected=native(a,target,move,{}, {hit}).rolls;
   assert.deepEqual(all.hitRolls[hit-1],expected,move+'/'+item+'/'+hit);report.comparisons+=16;
   const r=K.compute(a,target,move,{}, {hits:hit});assert.deepEqual(r.range,[all.hitRolls.slice(0,hit).reduce((n,x)=>n+Math.min(...x),0),all.hitRolls.slice(0,hit).reduce((n,x)=>n+Math.max(...x),0)]);
  }
  report.cases.push({move,source:owner,ability,item,status:'passed',hitCounts:max});
 }
}
report.passed=true;fs.writeFileSync('reference/MULTIHIT_RESULTS.json',JSON.stringify(report,null,2)+'\n');console.log('PASS multihit',report.cases.length,'cases',report.comparisons,'independent per-hit rolls');
