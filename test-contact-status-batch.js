const assert=require('node:assert/strict');
const fs=require('node:fs');const core=require('./battle-core.js');
const cases=[['せいでんき','まひ'],['ほのおのからだ','やけど'],['どくのトゲ','どく'],['どくしゅ','どく']];
let n=0;
for(const [ability,status] of cases){
 assert.equal(core.contactStatusType(ability),status);n++;
 for(const hits of [1,2,3,5]){
  const risk=core.contactStatusRisk({ability,contact:true,damaging:true,substitute:false,immune:false,alreadyStatus:false,hits});
  assert.ok(Math.abs(risk-(1-0.7**hits))<1e-10);n++;
 }
 for(const key of ['contact','damaging']){
  const arg={ability,contact:true,damaging:true,substitute:false,immune:false,alreadyStatus:false};arg[key]=false;
  assert.equal(core.contactStatusRisk(arg),0);n++;
 }
 assert.equal(core.contactStatusRisk({ability,contact:true,damaging:true,substitute:false,immune:true,alreadyStatus:false}),0);n++;
 assert.equal(core.contactStatusRisk({ability,contact:true,damaging:true,substitute:false,immune:false,alreadyStatus:true}),0);n++;
 assert.equal(core.contactStatusRisk({ability,contact:true,damaging:true,substitute:false,immune:false,alreadyStatus:false,hits:0}),0);n++;
 assert.equal(core.contactStatusRisk({ability,contact:true,damaging:true,substitute:false,immune:false,alreadyStatus:false,hits:2.5}),null);n++;
 assert.equal(core.contactStatusRisk({ability,contact:true,damaging:true,substitute:false,immune:false}),null);n++;
 assert.equal(core.contactStatusRisk({ability,contact:true,damaging:true,substitute:false,immune:false,alreadyStatus:undefined}),null);n++;
}
const html=fs.readFileSync(__dirname+'/index.html','utf8');
assert.match(html,/['せいでんき','ほのおのからだ','どくのトゲ']/);n++;
assert.match(html,/ability==='どくしゅ'/);n++;
assert.match(html,/BattleCore\.contactStatusRisk/);n++;
console.log(n+' grouped contact status cases passed');
