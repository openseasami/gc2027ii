#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const a=src.indexOf('function observedSubstituteHp('),b=src.indexOf('function renderSubstituteObservation(');
const state={my:[{substituteHp:30,hp:100}],opp:[{substituteHp:30,hp:100}],myTeam:['A'],oppTeam:['B']};
const ctx={state,ABILITY_ENGINE_DATA:{moves:{'通常技':{},'貫通技':{bypasssub:1}}},knownBattleAbility:()=>'',abilityFullHp:()=>200};vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);
const strike=(...x)=>ctx.confirmedSubstituteStrike(...x);
let r=strike('my',0,'opp',0,'通常技',12);assert.equal(r.after,18);assert.equal(state.opp[0].hp,100);
r=strike('my',0,'opp',0,'通常技',22);assert.equal(r.after,0);assert.equal(r.broken,true);
assert.equal(strike('my',0,'opp',0,'通常技',12),null);
ctx.setObservedSubstituteHp('opp',0,20);
assert.equal(strike('my',0,'opp',0,'貫通技',12),null);assert.equal(state.opp[0].substituteHp,20);
ctx.knownBattleAbility=()=> 'すりぬけ';assert.equal(strike('my',0,'opp',0,'通常技',12),null);
ctx.knownBattleAbility=()=> '';const snap=JSON.parse(JSON.stringify(state));strike('my',0,'opp',0,'通常技',10);assert.equal(state.opp[0].substituteHp,10);state.opp=snap.opp;assert.equal(state.opp[0].substituteHp,20);
for(const fragment of ["const subStrike=confirmedSubstituteStrike('my',ai,'opp',di,moveName,damage)","const subStrike=confirmedSubstituteStrike('opp',ai,'my',di,moveName,damage)","const subStrike=confirmedSubstituteStrike('opp',Number(attackerIdx),'my',di,moveName,damage)"]){assert.ok(src.includes(fragment),fragment)}
console.log('10 Substitute-hit integration checks passed');
