const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
assert.match(html,/<script src="\.\/battle-core\.js"><\/script>\s*<script src="\.\/effect-engine\.js"><\/script>/);
assert.match(html,/EffectEngine\.definition\(defenderAbility\)/);
assert.equal((html.match(/EffectEngine\.evaluate\('after_contact'/g)||[]).length,2);
const engine=require('./effect-engine.js');
for(const def of engine.definitions){assert.equal(engine.definition(def.name),def);}
assert.equal(engine.definition('不明な特性'),null);
const o=engine.evaluate('after_contact',{attacker:{ability:'どくしゅ',status:'なし',types:['どく']},defender:{ability:'せいでんき',status:'なし',types:['みず']},contact:false,damaging:true,substitute:false});
assert.equal(o.events.length,2);
assert.ok(o.events.every(x=>x.chance===0));
const sub=engine.evaluate('after_contact',{attacker:{ability:'どくしゅ',status:'なし',types:['どく']},defender:{ability:'せいでんき',status:'なし',types:['みず']},contact:true,damaging:true,substitute:true});
assert.ok(sub.events.every(x=>x.chance===0));
console.log('Effect registry integration: PASS');
