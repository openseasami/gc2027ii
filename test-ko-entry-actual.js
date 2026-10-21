#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function part(a,b){let i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j)}
const source=part('function applyPostTurnEntries(){','function protectedLastTurn(entry){')+part('function resolveEntryEvents(entries){','// Recorded field checkpoints')+part('function triggerEntryAbility(side,idx,name){','function triggerInitialEntryAbilities(){');
const el={weather:{value:'なし'},weatherTurns:{value:'0'},terrain:{value:'なし'},terrainTurns:{value:'0'}};
const state={myTeam:['Fainted','Sun','Intimidate'],oppTeam:['Fainted','Rain','Other'],myActive:[1],oppActive:[1],my:[{hp:0},{hp:100,pendingPostTurnEntry:true,atkStage:0},{hp:100,atkStage:0}],opp:[{hp:0},{hp:100,pendingPostTurnEntry:true,abilityConfirmed:true,atkStage:0},{hp:100,atkStage:0}],seenOpp:[]};
const abilities={Sun:'ひでり',Rain:'あめふらし',Intimidate:'いかく',Other:''};
const ctx={state,Math,JSON,Number,Set,Array,Object,$:k=>el[k]||null,abilityOf:(s,i,n)=>abilities[n]||'',possibleAbility:()=>false,fieldSpeed:n=>({Sun:130,Rain:60,Intimidate:90,Other:40})[n]||0,resetEntryStages:(s,i)=>{state[s][i].atkStage=0},restoreBatonState:()=>{},applyEntryTerrain:()=>{},ensureBattleEntry:(s,i)=>state[s][i],activateTerrainSeedsForActive:()=>{},receiveIntimidate:(s,i)=>state[s][i].atkStage--,uncertainEntryFieldKinds:()=>({}),showEntryFieldUncertainty:()=>{}};
vm.createContext(ctx);vm.runInContext(source,ctx);
let n=0;const eq=(a,b,msg)=>{assert.equal(a,b,msg);n++};
ctx.applyPostTurnEntries();
eq(el.weather.value,'雨','slower rain overrides faster sun');eq(el.weatherTurns.value,'5','weather duration');eq(state.my[1].pendingPostTurnEntry,false,'my pending cleared');eq(state.opp[1].pendingPostTurnEntry,false,'opponent pending cleared');eq(state.my[1].freshEntry,true,'fresh entry flag');eq(state.opp[1].freshEntry,true,'fresh entry opponent');eq(state.seenOpp.includes(1),true,'opponent seen');
// A second resolution should not re-fire abilities.
el.weather.value='砂';ctx.applyPostTurnEntries();eq(el.weather.value,'砂','resolved entrants do not fire twice');
// KO replacement with intimidate; only current opponent is affected.
state.myActive=[2];state.my[2].pendingPostTurnEntry=true;state.opp[1].atkStage=0;ctx.applyPostTurnEntries();eq(state.opp[1].atkStage,-1,'intimidate on new KO replacement');eq(state.my[2].pendingPostTurnEntry,false,'intimidate pending cleared');
console.log(`${n} actual post-KO entry assertions passed`);
