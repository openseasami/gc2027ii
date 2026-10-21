#!/usr/bin/env node
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const block=src.slice(src.indexOf('function projectedContactsAfterSubstitute('),src.indexOf('function planSelfDamageRisk('));
const ctx={BattleCore:require('./battle-core.js'),EffectEngine:require('./effect-engine.js'),DAMAGE_MOVES:{'ミサイルばり':{power:25,contact:true}},activeEntryByName:()=>({idx:0,name:'自分',d:{hp:100,status:'なし'}}),BATTLE_DATA:{'自分':{hp:100,types:['ノーマル']}},effectiveBattleName:()=> '自分',savedMyProfiles:[{}],calcRealHP:()=>200,abilityOf:(side)=>side==='my'?'なし':ctx.foeAbility,actionDamageInsights:()=>[{targetIdx:0,rolls:[20],curHp:35}],leadData:()=>[{idx:0,name:'相手',d:{}}],scenarioSwitchDefender:()=>null,scenarioHitAvailability:()=>1,estimatedMoveHitChance:()=>1,multiHitOutcomeDistribution:()=>({distribution:[[4,1]]}),foeAbility:'さめはだ'};
vm.createContext(ctx);vm.runInContext(block,ctx);
const action={kind:'attack',actor:'自分',move:'ミサイルばり'};
let count=0;function test(label,fn){fn();count++;console.log('PASS',label)}
test('four strikes stop at two-hit KO',()=>assert.equal(ctx.projectedContactPunishmentForAction(action).total,50));
test('four strikes against healthy target',()=>{ctx.actionDamageInsights=()=>[{targetIdx:0,rolls:[20],curHp:100}];assert.equal(ctx.projectedContactPunishmentForAction(action).total,100)});
test('KO at first strike',()=>{ctx.actionDamageInsights=()=>[{targetIdx:0,rolls:[40],curHp:30}];assert.equal(ctx.projectedContactPunishmentForAction(action).total,25)});
test('static status probability respects two contacts',()=>{ctx.foeAbility='せいでんき';ctx.actionDamageInsights=()=>[{targetIdx:0,rolls:[20],curHp:35}];assert.ok(Math.abs(ctx.projectedContactPunishmentForAction(action).statusRisk-(1-.7**2))<1e-10)});
test('weighted damage rolls',()=>{ctx.foeAbility='さめはだ';ctx.actionDamageInsights=()=>[{targetIdx:0,rolls:[20,40],curHp:35}];assert.equal(ctx.projectedContactPunishmentForAction(action).total,37.5)});
test('missing hp keeps existing assumption',()=>{ctx.actionDamageInsights=()=>[{targetIdx:0,rolls:[20]}];assert.equal(ctx.projectedContactPunishmentForAction(action).total,100)});
console.log(count+' KO-limited contact tests passed');
