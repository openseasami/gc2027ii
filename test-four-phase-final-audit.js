const a=require('node:assert/strict');
const e=require('./effect-engine.js');
// Phase 1: ability receives direct damage; blocked through substitute.
a.equal(e.evaluate('on_hit',{attacker:{ability:''},defender:{ability:'じきゅうりょく'},damaging:true,substitute:true}).events.length,0);
a.equal(e.evaluate('on_hit',{attacker:{ability:''},defender:{ability:'くだけるよろい'},damaging:true,category:'physical',substitute:false}).events.length,2);
// Phase 2: registered simple self-boost moves never apply when unsuccessfully used.
for(const [name,kind,stat,stages] of [['コットンガード','stat_boost','def',3],['とける','stat_boost','def',2],['ふるいたてる','multi_boost'],['ぼうぎょしれい','multi_boost']]){
 const ok=e.evaluate('on_move_used',{move:name,succeeded:true});a.equal(ok.events[0].kind,kind);if(stat)a.deepEqual([ok.events[0].stat,ok.events[0].stages],[stat,stages]);
 a.equal(e.evaluate('on_move_used',{move:name,succeeded:false}).events.length,0);
}
// Phase 3: held item/ability end-of-turn deductions and unknown-state restrictions.
const p=(x)=>e.residualProjection({maxHp:161,...x});
a.equal(p({item:'たべのこし'}).events[0].amount,10);
a.deepEqual(p({ability:'ポイズンヒール',status:'どく'}).events.map(x=>[x.kind,x.amount]),[['heal',20]]);
a.equal(p({ability:'ポイズンヒール',status:'なし'}).events.length,0);
a.equal(p({ability:'ポイズンヒール'}).unknown,true);
a.deepEqual(p({ability:'サンパワー',weather:'晴れ'}).events.map(x=>[x.kind,x.amount]),[['damage',20]]);
a.deepEqual(p({ability:'かんそうはだ',weather:'雨'}).events.map(x=>[x.kind,x.amount]),[['heal',20]]);
a.deepEqual(p({ability:'かんそうはだ',weather:'晴れ'}).events.map(x=>[x.kind,x.amount]),[['damage',20]]);
a.equal(p({ability:'かんそうはだ'}).unknown,true);
// Phase 4: metadata and integration remain compiled in the supplied shell.
const fs=require('node:fs');const html=fs.readFileSync(__dirname+'/index.html','utf8');
a.match(html,/battle-core\.js/);a.match(html,/effect-engine\.js/);a.match(html,/priority-engine\.js/);
console.log('Four-phase extension regression PASS');
