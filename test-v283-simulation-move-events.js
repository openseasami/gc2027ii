const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./effect-engine.js');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('if(!DAMAGE_MOVES[a.move]?.power){');
assert.ok(start>0);
const block=html.slice(start,start+1100);
assert.match(block,/EffectEngine\.moveDefinitions\.some\(d=>d\.name===a\.move\)/);
assert.match(block,/applyObservedMoveEffects\(side,ev\.idx,a\.actor,a\.move,blocked\?null:/);
for(const def of engine.moveDefinitions){
 assert.ok(def.name);
 assert.equal(engine.evaluate('on_move_used',{move:def.name,succeeded:true}).events.length,1,def.name);
}
assert.ok(engine.moveDefinitions.length>=12);
assert.match(block,/a\.move==='くろいきり'/);
console.log('v2.8.3: simulation dispatch shares all 12 canonical move definitions PASS');
