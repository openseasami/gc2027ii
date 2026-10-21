const assert=require('node:assert/strict');const fs=require('node:fs');const cp=require('node:child_process');const path=require('node:path');const root=__dirname;
require('./implementation-ledger.js');
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

for(const [category,rows] of Object.entries(ledger.inventory)){
 assert.equal(new Set(rows.map(r=>r.name)).size,rows.length,category+' unique inventory');
 assert.equal(ledger.stageSummary[category].registered,rows.length);
 for(const row of rows){
  assert.equal(row.registration.status,'registered');
  assert.ok(['partial','requires-review'].includes(row.effect.status));
  assert.equal(row.authoritativeVerification,'unverified');
  for(const field of ['unitVerification','integrationVerification']){
   assert.equal(row[field].status,row[field].tests.length?'scoped-tests-defined':'unverified');
   row[field].tests.forEach(file=>assert.ok(fs.existsSync(path.join(root,file)),file));
  }
 }
}
assert.ok(ledger.items.total>0);assert.ok(ledger.mega.total>0);
assert.equal(ledger.inventory.abilities.find(r=>r.name==='かるわざ').effect.status,'partial');
assert.ok(ledger.abilities.withoutProjection.includes('かるわざ'),'no projection is not no implementation');
assert.ok(ledger.inventory.items.find(r=>r.name==='グラスシード').integrationVerification.tests.includes('test-field-items-integration.js'));
console.log('PASS four-stage inventories and conservative evidence classification');
