const assert=require('node:assert/strict');
const e=require('./effect-engine.js');
assert.ok(e.definitions.length>=14);
for(const [ability,status] of [['せいでんき','まひ'],['ほのおのからだ','やけど'],['どくのトゲ','どく']]){
  const o=e.evaluate('after_contact',{attacker:{ability:'',types:['ノーマル'],status:'なし'},defender:{ability,types:['ノーマル'],status:'なし'},contact:true,damaging:true,substitute:false,hits:1});
  assert.equal(o.events[0].status,status);assert.ok(Math.abs(o.events[0].chance-0.3)<1e-12);
}
const pt=e.evaluate('after_contact',{attacker:{ability:'どくしゅ',types:['ノーマル'],status:'なし'},defender:{ability:'',types:['はがね'],status:'なし'},contact:true,damaging:true,substitute:false});
assert.equal(pt.events[0].chance,0);
const unknown=e.evaluate('after_contact',{attacker:{ability:'どくしゅ',types:['ノーマル'],status:'なし'},defender:{ability:'',status:'なし'},contact:true,damaging:true,substitute:false});
assert.equal(unknown.unknown,true);assert.equal(unknown.events[0].chance,null);
const both=e.evaluate('after_contact',{attacker:{ability:'どくしゅ',types:['ノーマル'],status:'なし'},defender:{ability:'ほのおのからだ',types:['ノーマル'],status:'なし'},contact:true,damaging:true,substitute:false,hits:2});
assert.equal(both.events.length,2);for(const x of both.events)assert.ok(Math.abs(x.chance-.51)<1e-10);
for(const [a,w,rock] of [['ひでり','晴れ','あついいわ'],['あめふらし','雨','しめったいわ'],['すなおこし','砂','さらさらいわ'],['ゆきふらし','雪','つめたいいわ']]){
  assert.equal(e.evaluate('on_entry',{source:{ability:a,item:rock}}).events[0].turns,8);
  assert.equal(e.evaluate('on_entry',{source:{ability:a,item:'なし'}}).events[0].turns,5);
}
assert.equal(e.evaluate('on_entry',{source:{ability:'ひでり'}}).unknown,true);
for(const [a,t] of [['グラスメイカー','グラス'],['サイコメイカー','サイコ'],['エレキメイカー','エレキ'],['ミストメイカー','ミスト']]){
 const result=e.evaluate('on_entry',{source:{ability:a}});
 assert.equal(result.events[0].terrain,t);assert.equal(result.events[0].turns,5);
}
assert.deepEqual(e.evaluate('on_entry',{source:{ability:'いかく'}}).events[0].stat,'atk');
assert.equal(e.evaluate('random-event').unknown,true);
console.log('Effect engine: event and boundary checks passed');
