#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const start=src.indexOf('function observedSubstituteHp('),end=src.indexOf('function renderSubstituteObservation(');
const state={my:[{hp:100,substituteHp:24}],opp:[{hp:100,substituteHp:24}],myTeam:['a'],oppTeam:['b']};
let ability='';
const ctx={state,ABILITY_ENGINE_DATA:{moves:{normal:{},piercing:{bypasssub:1}}},knownBattleAbility:()=>ability,abilityFullHp:()=>200};
vm.createContext(ctx);vm.runInContext(src.slice(start,end),ctx);
let n=0;function check(x){assert.ok(x);n++}
check(ctx.substituteBlocksConfirmedHit('my',0,'opp',0,'normal'));
check(!ctx.substituteBlocksConfirmedHit('my',0,'opp',0,'piercing'));
check(ctx.confirmedSubstituteStrike('my',0,'opp',0,'normal',10).after===14);
check(ctx.confirmedSubstituteStrike('my',0,'opp',0,'piercing',10)===null);
check(state.opp[0].substituteHp===14);
ability='すりぬけ';check(!ctx.substituteBlocksConfirmedHit('my',0,'opp',0,'normal'));
check(ctx.confirmedSubstituteStrike('my',0,'opp',0,'normal',10)===null);
ability='';check(ctx.substituteBlocksConfirmedHit('opp',0,'my',0,'normal'));
check(!ctx.substituteBlocksConfirmedHit('opp',0,'my',0,'piercing'));
state.my[0].substituteHp=0;check(!ctx.substituteBlocksConfirmedHit('opp',0,'my',0,'normal'));
for(const fragment of ["substituteBlocksConfirmedHit('my',ai,'opp',di,moveName)?null:abilityImpact", "substituteBlocksConfirmedHit('opp',ai,'my',di,moveName)?null:abilityImpact", "substituteBlocksConfirmedHit('my',ai,'opp',di,moveName)?null:commitAbilityOnlyHit", "substituteBlocksConfirmedHit('opp',Number(attackerIdx),'my',Number(defenderIdx),moveName)?null:commitAbilityOnlyHit"]){check(src.includes(fragment))}
console.log(`${n} Substitute bypass checks passed`);
