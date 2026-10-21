#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const a=src.indexOf('function applyConfirmedGuaranteedStatDrop('),b=src.indexOf('function applyConfirmedSingleHit(',a);
assert(a>=0&&b>a);
const context={clampStage:(n)=>Math.max(-6,Math.min(6,n))};vm.createContext(context);vm.runInContext(src.slice(a,b),context);
const f=context.applyConfirmedGuaranteedStatDrop;let n=0;
function check(condition){assert.ok(condition);n++}
let t={spdStage:0,spaStage:0};
check(f(t,'ルミナコリジョン'));check(t.spdStage===-2);
check(f(t,'アシッドボム'));check(t.spdStage===-4);
check(f(t,'アシッドボム'));check(t.spdStage===-6);
check(f(t,'マジカルフレイム'));check(t.spaStage===-1);
check(!f(t,'かえんほうしゃ'));check(t.spaStage===-1);
check(src.includes("if(remaining>0)applyConfirmedGuaranteedStatDrop(target,moveName,abilityOf('opp',di,defender),"));
check(src.includes("if(remaining>0)applyConfirmedGuaranteedStatDrop(target,moveName,abilityOf('my',di,preview.defender),"));
check(src.includes("const subStrike=confirmedSubstituteStrike('my',ai,'opp',di,moveName,damage)"));
check(src.includes("const subStrike=confirmedSubstituteStrike('opp',Number(attackerIdx),'my',di,moveName,damage)"));
console.log(n+' guaranteed stat-drop regression checks passed');
