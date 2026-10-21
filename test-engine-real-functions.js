#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function extract(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return html.slice(a,b)}
const actual=extract('function applyObservedSubstituteStrike(','function renderSubstituteObservation(')
 +extract('function applyObservedMoveEffects(','function confirmObservedOpponentMove(')
 +extract('function commitTurnActions(){','function stageText(');
const dom={weather:{value:'なし'},weatherTurns:{value:'0'},terrain:{value:'なし'},terrainTurns:{value:'0'},trTurns:{value:'0'},myTailwind:{value:'0'},oppTailwind:{value:'0'}};
const state={myTeam:['A','B'],oppTeam:['C','D'],myActive:[0],oppActive:[0],turnStartMyActive:[0],turnStartOppActive:[0],my:[{hp:100,substituteHp:0,atkStage:0,actionHistory:[],currentTurnAction:{kind:'move',move:'にほんばれ'}},{hp:100,actionHistory:[]}],opp:[{hp:100,substituteHp:12,actionHistory:[],currentTurnAction:{kind:'move',move:'ひかりのかべ'}},{hp:100,actionHistory:[]}],sideConditions:{my:{reflect:0,lightScreen:0},opp:{reflect:0,lightScreen:0}},confirmedMultiHitHistory:[]};
const ctxt={state,JSON,Math,Number,Set,EffectEngine:require('./effect-engine.js'),ABILITY_ENGINE_DATA:{moves:{}},$:id=>dom[id],battleTurnNumber:1,SELF_SETUP_BOOSTS:{},
 knownBattleAbility:()=>'',observedSubstituteHp:(s,i)=>state[s][i].substituteHp||0,
 recordedTurnEvents:()=>[{side:'my',idx:0,actor:'A',action:state.my[0].currentTurnAction},{side:'opp',idx:0,actor:'C',action:state.opp[0].currentTurnAction}],sortTurnSimulationEvents:ev=>ev,
 ensureSideConditions:()=>state.sideConditions,ensureBattleEntry:(s,i)=>state[s][i],clampStage:x=>Math.max(-6,Math.min(6,x)),
 applyBattleBoost:(s,i,boost)=>Object.assign(state[s][i],boost),turnFieldCheckpoint:(type,side,actor,move)=>({type,side,actor,move,weather:dom.weather.value,terrain:dom.terrain.value}),
 linkedMultiHitForEvent:()=>null,commitRecordedMoveSwitch:()=>null,
 setTerrainState:(terrain,turns)=>{dom.terrain.value=terrain;dom.terrainTurns.value=String(turns)},
 applyPerishSong:()=>{},captureTurnAttackState:()=>({}),
 applySwitchOutAbility:()=>{},resetEntryStages:()=>{},resolveEntryEvents:()=>{}};
vm.createContext(ctxt);vm.runInContext(actual,ctxt);
let n=0;function eq(a,b,label){assert.equal(a,b,label);n++}
// Real substitute damage and shield/bypass routing.
eq(ctxt.confirmedSubstituteStrike('my',0,'opp',0,'たいあたり',7).after,5,'substitute HP should decrease');
eq(state.opp[0].hp,100,'body protected');
eq(ctxt.confirmedSubstituteStrike('my',0,'opp',0,'たいあたり',9).broken,true,'substitute breaks');
eq(state.opp[0].substituteHp,0,'broken shield recorded');
state.opp[0].substituteHp=10;ctxt.ABILITY_ENGINE_DATA.moves['ハイパーボイス']={bypasssub:true};
eq(ctxt.confirmedSubstituteStrike('my',0,'opp',0,'ハイパーボイス',9),null,'bypass move leaves shield');
eq(state.opp[0].substituteHp,10,'shield preserved after bypass');
// Real move-effect and commit pipeline, including weather and screen changes.
ctxt.commitTurnActions();eq(dom.weather.value,'晴れ','sunny-day effect from actual action commit');
eq(dom.weatherTurns.value,'5','weather duration');eq(state.sideConditions.opp.lightScreen,5,'screen effect');
eq(state.my[0].currentTurnAction,null,'action cleared');eq(state.my[0].actionHistory.length,1,'action history');
eq(state.turnFieldTimeline.length,2,'move checkpoints');
// Execute the genuine switch batch, not a simulated state mutation.
state.my[0].currentTurnAction={kind:'switch',to:'B'};state.opp[0].currentTurnAction={kind:'switch',to:'D'};
ctxt.commitTurnActions();eq(state.myActive[0],1,'friendly switch');eq(state.oppActive[0],1,'opponent switch');
eq(state.turnFieldTimeline.length,2,'switch checkpoints');
console.log(`${n} real-function integrated assertions passed`);
