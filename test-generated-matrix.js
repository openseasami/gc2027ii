// Generated property and boundary suite. Test source: TEST_MATRIX.json
const assert=require('node:assert/strict');
const core=require('./battle-core.js');
const {cases}=require('./TEST_MATRIX.json');
for(const [i,t] of cases.entries()){
  assert.equal(typeof core[t.function],'function',`${i} function ${t.function}`);
  const actual=core[t.function](...t.args);
  if(typeof t.expected==='number' && typeof actual==='number'){
    assert.ok(Math.abs(actual-t.expected)<1e-11,`${i} ${t.label}: ${actual} != ${t.expected}`);
  }else assert.deepEqual(actual,t.expected,`${i} ${t.label}`);
}
console.log(`Generated matrix: ${cases.length}/${cases.length} passed`);
