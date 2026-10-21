#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function between(a,b){let i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j)}
const actual=between('function resolveEntryEvents(entries){','// Recorded field checkpoints')
 +between('function triggerEntryAbility(side,idx,name){','function triggerInitialEntryAbilities(){')
 +between('const ENTRY_TERRAIN_BY_MON={','function applyActiveEntryTerrains(){')
 +between('function decrementTurnFieldCounters(){','// v1.78.9: transaction boundary');
const fields={weather:{value:'なし'},weatherTurns:{value:'0'},terrain:{value:'なし'},terrainTurns:{value:'0'},trTurns:{value:'0'},myTailwind:{value:'0'},oppTailwind:{value:'0'}};
const state={myTeam:['A','B'],oppTeam:['C','D'],myActive:[0],oppActive:[0],my:[{hp:100,atkStage:0},{hp:100,atkStage:0}],opp:[{hp:100,atkStage:0},{hp:100,atkStage:0,abilityConfirmed:true}],seenOpp:[],sideConditions:{my:{reflect:3,lightScreen:2},opp:{reflect:1,lightScreen:3}}};
const ab={'A':'いかく','B':'かそく','C':'','D':'あめふらし'};
let activated=[];let n=0;
const ctx={state,JSON,Number,Math,Array,Set,Object, $,abilityOf:(s,i,name)=>ab[name],possibleAbility:()=>false,
 ensureBattleEntry:(s,i)=>state[s][i],ensureSideConditions:()=>state.sideConditions,fieldSpeed:(name)=>({'A':100,'B':70,'C':90,'D':50})[name]||0,
 resetEntryStages:(s,i)=>{state[s][i].atkStage=0},restoreBatonState:()=>{},
 receiveIntimidate:(s,i)=>{state[s][i].atkStage--},activateTerrainSeedsForActive:()=>{},
 uncertainEntryFieldKinds:()=>({}),showEntryFieldUncertainty:()=>{},
 setTerrainState:(v,t)=>{fields.terrain.value=v;fields.terrainTurns.value=String(t)},
 };
function $(id){return fields[id]||null}
vm.createContext(ctx);vm.runInContext(actual,ctx);
function eq(x,y,label){assert.equal(x,y,label);n++}
// Simultaneous entries: all reset before entry ability, avoiding lost Intimidate.
state.opp[0].atkStage=-3;state.my[0].atkStage=2;
ctx.resolveEntryEvents([{side:'opp',idx:0,name:'C'},{side:'my',idx:0,name:'A'}]);
eq(state.opp[0].atkStage,-1,'intimidate applies after stat reset');
eq(state.my[0].atkStage,0,'self resets');
eq(state.entryOrderCursor,1,'entry event ordering journal updated');
// Known weather setter entry. Separate subsequent event, preserves intimidate history.
ctx.resolveEntryEvents([{side:'opp',idx:1,name:'D'}]);
eq(fields.weather.value,'雨','rain on confirmed switch-in');eq(fields.weatherTurns.value,'5','rain duration');
eq(state.seenOpp.includes(1),true,'opponent shown');
// Actual end-of-turn counter logic on weather, screens and tailwind.
fields.terrain.value='ミスト';fields.terrainTurns.value='1';fields.trTurns.value='2';fields.myTailwind.value='1';
ctx.decrementTurnFieldCounters();eq(fields.weatherTurns.value,'4','rain decrement');eq(fields.terrain.value,'なし','terrain expired');eq(fields.terrainTurns.value,'0','terrain decrement');eq(fields.trTurns.value,'1','trick room decrement');eq(fields.myTailwind.value,'0','tailwind decrement');eq(state.sideConditions.my.reflect,2,'reflect decrement');eq(state.sideConditions.opp.lightScreen,2,'opponent screen decrement');
ctx.decrementTurnFieldCounters();eq(fields.weatherTurns.value,'3','weather second decrement');eq(state.sideConditions.my.reflect,1,'reflect second decrement');
// Re-execute previous event order after rollback (same cursor + identity) to verify replay journal.
const journal=JSON.stringify(state.entryOrderJournal);state.entryOrderCursor=0;ctx.resolveEntryEvents([{side:'my',idx:0,name:'A'},{side:'opp',idx:0,name:'C'}]);
eq(state.entryOrderCursor,1,'entry cursor replay');eq(JSON.stringify(state.entryOrderJournal),journal,'journal preserved for same composition');
console.log(`${n} actual entry/field integration assertions passed`);
