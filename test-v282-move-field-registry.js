const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./effect-engine.js');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const data=[
 ['あまごい','weather','weather','雨',5],['にほんばれ','weather','weather','晴れ',5],
 ['すなあらし','weather','weather','砂',5],['ゆきげしき','weather','weather','雪',5],
 ['グラスフィールド','terrain','terrain','グラス',5],['サイコフィールド','terrain','terrain','サイコ',5],
 ['エレキフィールド','terrain','terrain','エレキ',5],['ミストフィールド','terrain','terrain','ミスト',5],
 ['おいかぜ','tailwind','turns',4,4],['トリックルーム','trick_room','turns',5,5],
 ['リフレクター','screen','screen','reflect',5],['ひかりのかべ','screen','screen','lightScreen',5]
];
for(const [move,kind,field,value,turns] of data){
 const e=engine.evaluate('on_move_used',{move,succeeded:true});
 assert.equal(e.unknown,false,move);assert.equal(e.events.length,1,move);
 assert.equal(e.events[0].kind,kind,move);assert.equal(e.events[0][field],value,move);
 assert.equal(e.events[0].turns,turns,move);
 assert.equal(engine.evaluate('on_move_used',{move,succeeded:false}).events.length,0,move);
 assert.deepEqual(engine.evaluate('on_move_used',{move}).events,[],move);
}
assert.equal(engine.evaluate('on_move_used',{move:'不明',succeeded:true}).events.length,0);
assert.ok(engine.evaluate('on_move_used',{}).unknown);
assert.match(html,/function applyObservedMoveEffects[\s\S]*?EffectEngine\.evaluate\('on_move_used',\{move,succeeded:true\}\)/);
assert.match(html,/if\(a\.kind==='move'&&a\.move&&!a\.failed\)\{\s*applyObservedMoveEffects/);
assert.doesNotMatch(html,/const weatherMoves=\{/);
assert.doesNotMatch(html,/const terrainMoves=\{/);
console.log('v2.8.2: 12 field/screen move events, confirmation gates, UI hookup PASS');
