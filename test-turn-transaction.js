#!/usr/bin/env node
// Integration regression: turn commit is atomic under failed persistence or renderer.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/index.html','utf8');
const begin=source.indexOf('const TURN_COMMIT_FIELD_IDS=');
const end=source.indexOf('\nfunction endTurn(){',begin);
assert.ok(begin>=0&&end>begin);
const segment=source.slice(begin,end);
const fieldIds=['weather','weatherTurns','terrain','terrainTurns','trTurns','myTailwind','oppTailwind'];
const fields=Object.fromEntries(fieldIds.map(x=>[x,{value:x==='weather'?'晴れ':'3'}]));
const state={myTeam:['テストA'],oppTeam:['テストB'],myActive:[0],oppActive:[0],my:[{hp:80,substituteHp:20}],opp:[{hp:60,substituteHp:15}],turnLog:[],turnHpInputs:{},turnGuards:{},turnRecordStart:{},sideConditions:{my:{reflect:2,lightScreen:0},opp:{reflect:0,lightScreen:1}}};
let failure='save',renderCount=0,saved=0;
const ctx={state,JSON,Error,battleTurnNumber:5,lastGuardOutcomeSnapshot:{test:true},lastConfirmedHitSnapshot:{test:true},guide45TurnStartSnapshot:{foo:1},guide45LastCommittedSnapshot:{foo:2},guide45State:{foo:3},fixed45FailArmed:{foo:4},guide45TurnFinalized:false,
 $:id=>fields[id],hasIncompleteTacticalAction:()=>false,buildTurnRecord:()=>({turn:5,status:'pending'}),
 commitTurnActions:()=>{state.my[0].hp=45;state.opp[0].substituteHp=0;state.myActive=[1];state.opp[0].hp=25;},
 decrementTurnFieldCounters:()=>{fields.weatherTurns.value='2';state.sideConditions.my.reflect=1;},
 confirmedAbilityIs:()=>false,applyBattleBoost:()=>{},advancePerishCounters:()=>false,applyPostTurnEntries:()=>{state.my[0].substituteHp=0;},
 turnRecordSnapshot:()=>({snapshot:true}),snapshotTurnStartActives:()=>{},renderCards:()=>{renderCount++;if(failure==='render')throw Error('renderer failed')},
 refresh:()=>{},renderTurnFieldTimeline:()=>{},save:()=>{saved++;return failure!=='save'},ensureSideConditions:()=>state.sideConditions,
};
vm.createContext(ctx);vm.runInContext(segment,ctx);
const snapshot=()=>JSON.stringify({state,field:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value])),turn:ctx.battleTurnNumber});
const before=snapshot();
assert.throws(()=>ctx.finalizeTurnState(),/保存できません/);
assert.equal(snapshot(),before,'save failure must restore HP, substitute, active slots and field');
assert.deepEqual(state.turnLog,[]);
failure='render';assert.throws(()=>ctx.finalizeTurnState(),/renderer failed/);
assert.equal(snapshot(),before,'render failure must restore transaction');
failure='none';ctx.finalizeTurnState();
assert.equal(ctx.battleTurnNumber,6);assert.equal(state.my[0].hp,45);assert.equal(state.my[0].substituteHp,0);
assert.equal(state.opp[0].substituteHp,0);assert.equal(state.sideConditions.my.reflect,1);
assert.equal(fields.weatherTurns.value,'2');assert.equal(state.turnLog[0].status,'committed');
console.log('12 turn-transaction integration assertions passed');
