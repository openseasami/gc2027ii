const assert=require('node:assert/strict');const fs=require('node:fs');const cp=require('node:child_process');const path=require('node:path');const root=__dirname;
cp.execFileSync(process.execPath,[path.join(root,'implementation-ledger.js')]);
const ledger=JSON.parse(fs.readFileSync(path.join(root,'IMPLEMENTATION_LEDGER.json')));
assert.equal(ledger.releaseGate.complete,false);
assert.ok(ledger.abilities.total>100);assert.ok(ledger.moves.total>100);
assert.equal(ledger.abilities.total,ledger.abilities.projectedSubset+ledger.abilities.withoutProjection.length);
assert.equal(ledger.moves.total,ledger.moves.projectedSubset+ledger.moves.withoutProjection.length);
const e=require('./effect-engine.js');for(const [name,stat] of [['かたくなる','def'],['まるくなる','def']]){
const yes=e.evaluate('on_move_used',{move:name,succeeded:true});assert.equal(yes.events[0].stat,stat);assert.equal(yes.events[0].stages,1);
assert.equal(e.evaluate('on_move_used',{move:name,succeeded:false}).events.length,0);
assert.equal(e.evaluate('on_move_used',{move:name}).unknown,true);
}
console.log('PASS implementation ledger and conservative confirmed move projection');
