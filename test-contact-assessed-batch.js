const assert=require('node:assert/strict');
const core=require('./battle-core.js');
let n=0;
for(const [ability,types,expected] of [
 ['せいでんき',['でんき'],0],['せいでんき',['みず'],.3],
 ['ほのおのからだ',['ほのお'],0],['ほのおのからだ',['くさ'],.3],
 ['どくのトゲ',['どく'],0],['どくのトゲ',['はがね'],0],['どくのトゲ',['ノーマル'],.3],
 ['どくしゅ',['はがね'],0],['どくしゅ',['ノーマル'],.3]
]){
 const v=core.assessedContactStatusRisk({ability,contact:true,damaging:true,substitute:false,types,status:'なし'});
 assert.ok(Math.abs(v-expected)<1e-9,`${ability} ${types}: ${v}`); n++;
}
for(const ability of ['せいでんき','ほのおのからだ','どくのトゲ','どくしゅ']){
 const base={ability,contact:true,damaging:true,substitute:false,types:['ノーマル'],status:'なし'};
 assert.equal(core.assessedContactStatusRisk({...base,types:null}),null); n++;
 assert.equal(core.assessedContactStatusRisk({...base,status:undefined}),null); n++;
 assert.equal(core.assessedContactStatusRisk({...base,status:'どく'}),0); n++;
 assert.equal(core.assessedContactStatusRisk({...base,contact:false}),0); n++;
 assert.equal(core.assessedContactStatusRisk({...base,substitute:true}),0); n++;
 const hits=core.assessedContactStatusRisk({...base,hits:2});
 assert.ok(Math.abs(hits-.51)<1e-9);n++;
}
console.log(`PASS ${n} assessed contact status cases`);
