#!/usr/bin/env node
// Actual entry + field-countdown routines inside the real turn transaction.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function between(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j)}
const source=between('function resolveEntryEvents(entries){','// Recorded field checkpoints')+
 between('function triggerEntryAbility(side,idx,name){','function triggerInitialEntryAbilities(){')+
 between('const ENTRY_TERRAIN_BY_MON={','function applyActiveEntryTerrains(){')+
 between('function decrementTurnFieldCounters(){','// v1.78.9: transaction boundary')+
 between('const TURN_COMMIT_FIELD_IDS=','\nfunction endTurn(){');
const fields=Object.fromEntries(['weather','weatherTurns','terrain','terrainTurns','trTurns','myTailwind','oppTailwind'].map(k=>[k,{value:'0'}]));
fields.weather.value='なし';fields.terrain.value='なし';
const state={myTeam:['A','B'],oppTeam:['C','D'],myActive:[0],oppActive:[0],my:[{hp:100,atkStage:0,speStage:0},{hp:100,atkStage:0,speStage:0}],opp:[{hp:100,atkStage:0,speStage:0},{hp:100,atkStage:0,speStage:0,abilityConfirmed:true}],seenOpp:[],turnLog:[],turnHpInputs:{},turnGuards:{},turnRecordStart:{},sideConditions:{my:{reflect:3,lightScreen:0},opp:{reflect:0,lightScreen:2}}};
const ability={A:'いかく',B:'かそく',C:'',D:'あめふらし'};
let failure='save';let assertions=0;
const $=id=>fields[id]||null;
const ctx={EffectEngine:require("./effect-engine.js"),state,JSON,Number,Math,Array,Set,Object,$,Error,battleTurnNumber:1,
 lastGuardOutcomeSnapshot:null,lastConfirmedHitSnapshot:null,guide45TurnStartSnapshot:null,guide45LastCommittedSnapshot:null,guide45State:{},fixed45FailArmed:null,guide45TurnFinalized:false,
 abilityOf:(s,i,name)=>ability[name],possibleAbility:()=>false,ensureBattleEntry:(s,i)=>state[s][i],ensureSideConditions:()=>state.sideConditions,
 fieldSpeed:name=>({A:100,B:60,C:90,D:50})[name]||0,resetEntryStages:(s,i)=>{state[s][i].atkStage=0;state[s][i].speStage=0},restoreBatonState:()=>{},
 receiveIntimidate:(s,i)=>{state[s][i].atkStage--},activateTerrainSeedsForActive:()=>{},uncertainEntryFieldKinds:()=>({}),showEntryFieldUncertainty:()=>{},
 setTerrainState:(v,t)=>{fields.terrain.value=v;fields.terrainTurns.value=String(t)},
 hasIncompleteTacticalAction:()=>false,buildTurnRecord:()=>({turn:ctx.battleTurnNumber}),
 commitTurnActions:()=>{state.myActive=[1];state.oppActive=[1];ctx.resolveEntryEvents([{side:'my',idx:1,name:'B'},{side:'opp',idx:1,name:'D'}]);},
 confirmedAbilityIs:(side,idx,name,ab)=>ability[name]===ab,applyBattleBoost:(side,idx,boost)=>{for(const [k,v] of Object.entries(boost))state[side][idx][k]=(state[side][idx][k]||0)+v},
 advancePerishCounters:()=>false,applyPostTurnEntries:()=>{},turnRecordSnapshot:()=>({turn:ctx.battleTurnNumber}),snapshotTurnStartActives:()=>{},
 renderCards:()=>{if(failure==='render')throw Error('renderer failed')},refresh:()=>{},renderTurnFieldTimeline:()=>{},save:()=>failure!=='save'};
vm.createContext(ctx);vm.runInContext(source,ctx);
const snapshot=()=>JSON.stringify({state,fields:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value])),turn:ctx.battleTurnNumber});
const before=snapshot();
for(const mode of ['save','render']){failure=mode;assert.throws(()=>ctx.finalizeTurnState());assertions++;assert.equal(snapshot(),before,'rollback after '+mode);assertions++;}
failure='none';ctx.finalizeTurnState();
function eq(actual,expected,label){assert.equal(actual,expected,label);assertions++}
eq(state.myActive[0],1,'own switch');eq(state.oppActive[0],1,'opponent switch');
eq(fields.weather.value,'雨','entry weather');eq(fields.weatherTurns.value,'4','entry weather decremented');
eq(state.my[1].speStage,1,'speed boost at end turn');eq(state.sideConditions.my.reflect,2,'screen countdown');
eq(state.sideConditions.opp.lightScreen,1,'opponent screen countdown');eq(state.turnLog.length,1,'one committed record');
eq(ctx.battleTurnNumber,2,'turn increments');
console.log(`${assertions} actual entry/end-turn/transaction integration assertions passed`);
