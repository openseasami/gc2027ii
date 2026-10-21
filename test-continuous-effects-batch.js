const assert=require('node:assert/strict');
const fs=require('node:fs');
const e=require('./effect-engine.js');
for(const [move,kind] of [['ちょうのまい','multi_boost'],['とぐろをまく','multi_boost'],['コスモパワー','multi_boost'],['ドわすれ','stat_boost'],['バリアー','stat_boost'],['かげぶんしん','stat_boost']]){
 assert.equal(e.evaluate('on_move_used',{move,succeeded:true}).events[0]?.kind,kind,move);
 assert.equal(e.evaluate('on_move_used',{move,succeeded:false}).events.length,0,move);
}
assert.equal(e.evaluate('on_hit',{defender:{ability:'びびり'},attacker:{ability:''},moveType:'あく',damaging:false}).events.length,0);
assert.equal(e.evaluate('on_hit',{defender:{ability:'びびり'},attacker:{ability:''},moveType:'あく',damaging:true,substitute:false}).events[0].stages,1);
assert.equal(e.evaluate('on_move_used',{move:'ソウルビート',succeeded:true}).events.length,0);
const poison=e.residualProjection({item:'くろいヘドロ',types:['どく'],maxHp:161});
const normal=e.residualProjection({item:'くろいヘドロ',types:['ノーマル'],maxHp:161});
assert.deepEqual([poison.events[0].kind,poison.events[0].amount],['heal',10]);
assert.deepEqual([normal.events[0].kind,normal.events[0].amount],['damage',20]);
const html=fs.readFileSync('./index.html','utf8');
assert.match(html,/fraction:types\.includes\('どく'\)\?'1\/16':'1\/8'/);
assert.match(html,/Math\.floor\(knownMaxHp\/\(effect\.fraction==='1\/8'\?8:16\)\)/);
const timeline=html.slice(html.indexOf('function finalizeTurnState(){'),html.indexOf('function endTurn(){'));
assert(timeline.indexOf('recordEndTurnResidualProjections();')<timeline.indexOf('decrementTurnFieldCounters();'));
assert(timeline.indexOf('advanceConfirmedYawn();')<timeline.indexOf('decrementTurnFieldCounters();'));
console.log('continuous effects validated');
