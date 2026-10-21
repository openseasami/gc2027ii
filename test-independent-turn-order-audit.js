/* Independent order oracle. Each definite comparison is checked separately;
   unknown and exact ties are deliberately not asserted to have a true winner. */
const assert=require('node:assert/strict');
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('function sortTurnSimulationEvents(');
const stop=html.indexOf('function evaluateGuardTiming(',start);
assert(start>=0&&stop>start);
let tr=false;
const ctx={$:()=>({value:tr?'5':'0'})};
vm.createContext(ctx);
vm.runInContext(html.slice(start,stop),ctx);
let seed=0x2852026;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function pick(a){return a[Math.floor(rand()*a.length)]}
function oracle(a,b){
 if(a.priority!==b.priority)return a.priority>b.priority?-1:1;
 if(a.speed==null||b.speed==null)return null;
 if(a.speed===b.speed)return null;
 const faster=tr?a.speed<b.speed:a.speed>b.speed;
 return faster?-1:1;
}
let comparisons=0, uncertain=0;
for(let i=0;i<20000;i++){
 tr=rand()<.5;
 const entries=Array.from({length:4},(_,idx)=>({idx,priority:pick([-7,-1,0,0,0,1,2,3,4,5]),speed:pick([null,1,20,50,100,100,150,300,999]),side:idx%2?'opp':'my'}));
 const sorted=ctx.sortTurnSimulationEvents(entries);
 assert.equal(sorted.length,entries.length);
 assert.equal(new Set(sorted.map(x=>x.idx)).size,entries.length);
 for(let j=0;j<sorted.length;j++)for(let k=j+1;k<sorted.length;k++){
   const relation=oracle(sorted[j],sorted[k]);
   if(relation===null){uncertain++;continue;}
   assert.equal(relation,-1,`inversion at sample ${i}: ${JSON.stringify([sorted[j],sorted[k],tr])}`);comparisons++;
 }
}
// Guard timing comparator is separately exposed in the same slice.
let guards=0;
for(const priorityA of [-1,0,1,3])for(const priorityG of [-1,0,1,3])for(const speedA of [null,30,100,200])for(const speedG of [null,30,100,200])for(const trick of [false,true]){
 const got=ctx.guardTimingCompare(priorityA,priorityG,speedA,speedG,trick);
 let wanted;
 if(priorityA!==priorityG)wanted=priorityA>priorityG?'attack-first':'guard-first';
 else if(speedA===null||speedG===null)wanted='unknown';
 else if(speedA===speedG)wanted='tie';
 else wanted=(trick?speedG<speedA:speedG>speedA)?'guard-first':'attack-first';
 assert.equal(got.order,wanted,JSON.stringify({priorityA,priorityG,speedA,speedG,trick}));guards++;
}
console.log(`Independent turn-order oracle: ${comparisons} definite comparisons; ${uncertain} uncertainty pairs; ${guards} guard cases passed.`);
