const assert=require('node:assert/strict'),fs=require('node:fs'),{executableIndex}=require('./coverage-assessment.js');
const index=executableIndex({'fixture.html':'<script>const catalog={"すてみ":"登録"};function actual(){const move="すてみタックル";return "あとだし"}</script>'});
assert.equal(index.has('すてみ'),false,'catalog and substring must not count as implementation');assert.equal(index.has('すてみタックル'),true);assert.equal(index.has('あとだし'),true);
const ledger=JSON.parse(fs.readFileSync(__dirname+'/IMPLEMENTATION_LEDGER.json'));
const rows=Object.values(ledger.inventory).flat();assert.equal(rows.length,1149);assert.equal(ledger.coverageSummary.total,1149);
assert.equal(Object.values(ledger.coverageSummary.categories).reduce((a,b)=>a+b,0),1149);assert.equal(ledger.completion,false);
for(const row of rows){assert.ok(['未実装','部分実装','別経路で実装済み','仕様対象外','要調査'].includes(row.coverage.classification));assert.equal(row.coverage.fullMechanicVerified,false);if(['部分実装','別経路で実装済み'].includes(row.coverage.classification)){assert.equal(row.coverage.scopedTestsPassed,true);assert.ok(row.coverage.tests.length);}}
const baseline=JSON.parse(fs.readFileSync(__dirname+'/ABILITY_REVIEW_BASELINE.json'));assert.equal(new Set(baseline.names).size,91);
const review=JSON.parse(fs.readFileSync(__dirname+'/ABILITY_UNSUPPORTED_REVIEW.json'));assert.equal(review.entries.length,91);assert.deepEqual(new Set(review.entries.map(r=>r.name)),new Set(baseline.names));
assert.equal(ledger.coverageSummary.fullyImplemented,0);assert.equal(ledger.coverageSummary.fullyUnverified,1149);
console.log('PASS all 1149 candidates classified, all original 91 labels reviewed, exact references cannot certify full coverage');
