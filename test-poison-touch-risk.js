const a=require('node:assert/strict'),b=require('./battle-core.js');let n=0;
function check(input,result){a.equal(b.poisonTouchRisk(input),result);n++}
const base={contact:true,damaging:true,substitute:false,immune:false,alreadyStatus:false};
check(base,.3);
for(const key of Object.keys(base)){check({...base,[key]:!base[key]},0)}
check({...base,contact:undefined},null);check({},null);check(undefined,null);
console.log(`${n} poison-touch conditional risk cases passed (not auto-status application)`);
