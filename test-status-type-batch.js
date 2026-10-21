const assert=require('node:assert/strict');
const fs=require('node:fs');const core=require('./battle-core.js');
let n=0;
for(const [status,immune] of [['どく',['どく','はがね']],['やけど',['ほのお']],['まひ',['でんき']]]){
 for(const type of ['ノーマル','どく','はがね','ほのお','でんき','ひこう','フェアリー']){
  assert.equal(core.statusTypeImmune(status,[type]),immune.includes(type),status+type);n++;
 }
 assert.equal(core.statusTypeImmune(status,[]),null);n++;
 assert.equal(core.statusTypeImmune(status,null),null);n++;
 assert.equal(core.statusTypeImmune(status,['ノーマル',immune[0]]),true);n++;
}
assert.equal(core.statusTypeImmune('ねむり',['ほのお']),null);n++;
const html=fs.readFileSync(__dirname+'/index.html','utf8');
assert.match(html,/EffectEngine\.evaluate\('after_contact'/);n++;
assert.match(html,/EffectEngine\.evaluate\('after_contact'/);n++;
console.log('shared status type immunity '+n+' checks passed');
