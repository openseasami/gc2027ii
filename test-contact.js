#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const block=src.slice(src.indexOf('function projectedContactsAfterSubstitute('),src.indexOf('function planSelfDamageRisk('));
const ctx={
 BattleCore:require('./battle-core.js'),EffectEngine:require('./effect-engine.js'),
 DAMAGE_MOVES:{'たいあたり':{power:40,contact:true},'かえんほうしゃ':{power:90,contact:false}},
 activeEntryByName:()=>({idx:0,name:'テスト',d:{hp:100,status:'なし'}}),
 BATTLE_DATA:{'テスト':{hp:100,types:['ノーマル']}},effectiveBattleName:()=> 'テスト',savedMyProfiles:[{}],calcRealHP:()=>200,
 abilityOf:(side)=>side==='my'?ctx.ownAbility:ctx.foeAbility,
 actionDamageInsights:()=>[{targetIdx:0,rolls:[20]}],
 leadData:()=>[{idx:0,name:'相手',d:{}}],scenarioSwitchDefender:()=>null,
 scenarioHitAvailability:()=>1,estimatedMoveHitChance:()=>1,multiHitOutcomeDistribution:()=>null,ownAbility:'なし',foeAbility:'さめはだ'
};vm.createContext(ctx);vm.runInContext(block,ctx);
let n=0;function check(label,fn){fn();n++;console.log('PASS',label)}
const attack={kind:'attack',actor:'テスト',move:'たいあたり'};
check('rough skin fixed reflection',()=>assert.equal(ctx.projectedContactPunishmentForAction(attack).total,25));
check('iron barbs fixed reflection',()=>{ctx.foeAbility='てつのトゲ';assert.equal(ctx.projectedContactPunishmentForAction(attack).total,25)});
check('no contact',()=>assert.equal(ctx.projectedContactPunishmentForAction({...attack,move:'かえんほうしゃ'}),null));
check('long reach',()=>{ctx.ownAbility='えんかく';assert.equal(ctx.projectedContactPunishmentForAction(attack),null)});
check('magic guard prevents reflection',()=>{ctx.ownAbility='マジックガード';assert.equal(ctx.projectedContactPunishmentForAction(attack),null)});
check('static 30% conditional status',()=>{ctx.ownAbility='なし';ctx.foeAbility='せいでんき';assert.ok(Math.abs(ctx.projectedContactPunishmentForAction(attack).statusRisk-.3)<1e-10)});
check('flame body 30% conditional status',()=>{ctx.foeAbility='ほのおのからだ';assert.ok(Math.abs(ctx.projectedContactPunishmentForAction(attack).statusRisk-.3)<1e-10)});
check('protect excludes contact',()=>{ctx.scenarioHitAvailability=()=>0;assert.equal(ctx.projectedContactPunishmentForAction(attack),null)});
check('multi-hit rough skin expectation',()=>{ctx.scenarioHitAvailability=()=>1;ctx.foeAbility='さめはだ';ctx.multiHitOutcomeDistribution=()=>({distribution:[[2,.5],[4,.5]]});assert.equal(ctx.projectedContactPunishmentForAction(attack).total,75)});
check('multi-hit static cumulative probability',()=>{ctx.foeAbility='せいでんき';const got=ctx.projectedContactPunishmentForAction(attack).statusRisk;const wanted=.5*(1-.7**2)+.5*(1-.7**4);assert.ok(Math.abs(got-wanted)<1e-10)});
check('single hit unchanged after multi-hit',()=>{ctx.multiHitOutcomeDistribution=()=>null;ctx.foeAbility='さめはだ';assert.equal(ctx.projectedContactPunishmentForAction(attack).total,25)});
console.log(`${n} contact prediction tests passed`);
