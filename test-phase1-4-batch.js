const a=require('node:assert/strict');
const e=require('./effect-engine.js');
const ev=(event,source,ctx={})=>e.evaluate(event,{attacker:{ability:''},defender:{ability:source},...ctx});
for(const [move,stats] of [['つるぎのまい',{stat:'atk',stages:2}],['わるだくみ',{stat:'spa',stages:2}],['こうそくいどう',{stat:'spe',stages:2}]]){
  const r=e.evaluate('on_move_used',{move,succeeded:true});a.equal(r.events.length,1);a.equal(r.events[0].kind,'stat_boost');a.equal(r.events[0].stat,stats.stat);a.equal(r.events[0].stages,stats.stages);
  a.equal(e.evaluate('on_move_used',{move,succeeded:false}).events.length,0);
}
for(const move of ['めいそう','りゅうのまい','ビルドアップ'])a.equal(e.evaluate('on_move_used',{move,succeeded:true}).events[0].kind,'multi_boost');
a.equal(e.evaluate('on_move_used',{move:'くろいきり',succeeded:true}).events[0].kind,'reset_stages');
a.deepEqual(ev('on_hit','じきゅうりょく',{damaging:true}).events.map(x=>[x.kind,x.stat,x.stages]),[['stat_boost','def',1]]);
a.equal(ev('on_hit','じきゅうりょく',{damaging:false}).events.length,0);
a.equal(ev('on_hit','くだけるよろい',{damaging:true,category:'special'}).events.length,0);
a.deepEqual(ev('on_hit','くだけるよろい',{damaging:true,category:'physical'}).events.map(x=>[x.stat,x.stages]),[['def',-1],['spe',2]]);
a.equal(ev('after_contact','ぬめぬめ',{contact:false}).events.length,0);
a.deepEqual(ev('after_contact','ぬめぬめ',{contact:true}).events.map(x=>[x.kind,x.side,x.stat]),[['stat_drop','attacker','spe']]);
a.equal(ev('on_hit','びびり',{moveType:'ノーマル'}).events.length,0);
a.equal(ev('on_hit','びびり',{}).unknown,true);
a.equal(ev('on_hit','びびり',{moveType:'あく',damaging:true}).events[0].stages,1);
console.log('Phase 1-4 deterministic event batch passed');
const hp=e.residualProjection({item:'たべのこし',maxHp:160});a.equal(hp.events[0].amount,10);
a.equal(e.residualProjection({item:'くろいヘドロ',maxHp:160,types:['どく']}).events[0].kind,'heal');
a.equal(e.residualProjection({item:'くろいヘドロ',maxHp:160,types:['はがね']}).events[0].kind,'damage');
a.equal(e.residualProjection({ability:'あめうけざら',weather:'雨',maxHp:161}).events[0].amount,10);
a.equal(e.residualProjection({ability:'あめうけざら',maxHp:160}).unknown,true);
