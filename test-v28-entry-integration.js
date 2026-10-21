const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const engine=require('./effect-engine.js');
const sw=fs.readFileSync(__dirname+'/sw.js','utf8');
for(const [ability,kind,field] of [
 ['ひでり','weather','晴れ'],['あめふらし','weather','雨'],
 ['すなおこし','weather','砂'],['ゆきふらし','weather','雪'],
 ['グラスメイカー','terrain','グラス'],['サイコメイカー','terrain','サイコ'],
 ['エレキメイカー','terrain','エレキ'],['ミストメイカー','terrain','ミスト']]){
 const ev=engine.evaluate('on_entry',{source:{ability,item:'なし'}}).events[0];
 assert.equal(ev.kind,kind);assert.equal(ev[ kind ],field);
}
const intimidate=engine.evaluate('on_entry',{source:{ability:'いかく'}}).events[0];
assert.equal(intimidate.kind,'stat_drop');assert.equal(intimidate.stages,-1);
assert.match(html,/function confirmedEntryEffect\(/);
assert.match(html,/function commitEntryFieldEffect\(/);
assert.match(html,/function triggerEntryAbility\([\s\S]*?commitEntryFieldEffect\(side,idx,name\)/);
assert.match(html,/function applyConfirmedPendingEntryFieldEffect\([\s\S]*?commitEntryFieldEffect\(side,idx,name\)/);
assert.match(html,/function applyEntryTerrain\([\s\S]*?confirmedEntryEffect\(side,idx,name\)/);
assert.match(sw,/effect-engine\.js/);assert.match(sw,/v2\.[0-9]+\.[0-9]+/);
console.log('v2.8 entry event registry + UI integration: PASS');
