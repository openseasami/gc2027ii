#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const a=src.indexOf('function observedSubstituteHp('),b=src.indexOf('function renderSubstituteObservation(');
const state={my:[{hp:100,substituteHp:0}],opp:[{hp:26,substituteHp:0}]};
const ctx={state,abilityFullHp:()=>200,ABILITY_ENGINE_DATA:{moves:{}},knownBattleAbility:()=>''};vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);
let r=ctx.recordConfirmedSubstituteUse('my',0);assert.equal(r.ok,true);assert.equal(r.cost,50);
assert.equal(state.my[0].hp,75);assert.equal(state.my[0].substituteHp,50);
assert.equal(ctx.recordConfirmedSubstituteUse('my',0).ok,false);
state.my=JSON.parse(JSON.stringify(r.before.my));assert.equal(state.my[0].hp,100);assert.equal(state.my[0].substituteHp,0);
r=ctx.recordConfirmedSubstituteUse('opp',0);assert.equal(r.ok,true);assert.equal(state.opp[0].hp,1);
state.opp[0]={hp:25,substituteHp:0};assert.equal(ctx.recordConfirmedSubstituteUse('opp',0).ok,false);
state.opp[0]={hp:0,substituteHp:0};assert.equal(ctx.recordConfirmedSubstituteUse('opp',0).ok,false);
assert.ok(src.includes('みがわり使用を記録'));assert.ok(src.includes('lastConfirmedHitSnapshot={state:result.before'));
console.log('11 Substitute creation checks passed');
