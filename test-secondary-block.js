#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const a=src.indexOf('function applyConfirmedGuaranteedStatDrop('),b=src.indexOf('function applyConfirmedSingleHit(',a);
assert(a>=0&&b>a);
const c={clampStage:(n)=>Math.max(-6,Math.min(6,n))};vm.createContext(c);vm.runInContext(src.slice(a,b),c);
let n=0;const chk=(ok)=>{assert.ok(ok);n++};
for(const ability of ['りんぷん','クリアボディ','しろいけむり'])for(const move of ['アシッドボム','マジカルフレイム','ルミナコリジョン']){
 const t={spdStage:0,spaStage:0};chk(!c.applyConfirmedGuaranteedStatDrop(t,move,ability));chk(t.spdStage===0&&t.spaStage===0);
}
for(const [move,key,amount] of [['アシッドボム','spdStage',-2],['マジカルフレイム','spaStage',-1],['ルミナコリジョン','spdStage',-2]]){
 const t={spdStage:0,spaStage:0};chk(c.applyConfirmedGuaranteedStatDrop(t,move,''));chk(t[key]===amount);
}
chk(src.includes("applyConfirmedGuaranteedStatDrop(target,moveName,abilityOf('opp',di,defender),"));
chk(src.includes("applyConfirmedGuaranteedStatDrop(target,moveName,abilityOf('my',di,preview.defender),"));
console.log(n+' secondary-effect defensive ability checks passed');
