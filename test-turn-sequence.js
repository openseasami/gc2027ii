#!/usr/bin/env node
// Multi-turn integrated transaction regression: substitute, contact/stamina,
// switching, weather/screens, 45s state, save and rollback together.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const a=html.indexOf('const TURN_COMMIT_FIELD_IDS='), b=html.indexOf('\nfunction endTurn(){',a);
assert.ok(a>=0&&b>a);
const ids=['weather','weatherTurns','terrain','terrainTurns','trTurns','myTailwind','oppTailwind'];
const dom=Object.fromEntries(ids.map(k=>[k,{value:k==='weather'?'雨':k==='terrain'?'ミストフィールド':'3'}]));
const state={myTeam:['A','B'],oppTeam:['C','D'],myActive:[0],oppActive:[0],
 my:[{hp:91,substituteHp:24,defStage:0},{hp:100,substituteHp:0}],
 opp:[{hp:88,substituteHp:12,defStage:0},{hp:100,substituteHp:0}],
 turnLog:[],turnHpInputs:{},turnGuards:{},turnRecordStart:{},
 sideConditions:{my:{reflect:3,lightScreen:0},opp:{reflect:0,lightScreen:3}},
 confirmedMultiHitHistory:[],turnFieldTimeline:[]};
let fail='',next='attack',saved=0,turns=0;
const ctx={EffectEngine:require("./effect-engine.js"),state,JSON,Error,battleTurnNumber:1,lastGuardOutcomeSnapshot:{observed:true},lastConfirmedHitSnapshot:{observed:true},guide45TurnStartSnapshot:{turn:1},guide45LastCommittedSnapshot:{turn:0},guide45State:{running:true},fixed45FailArmed:{pending:true},guide45TurnFinalized:false,
 $:key=>dom[key],hasIncompleteTacticalAction:()=>false,buildTurnRecord:()=>({turn:ctx.battleTurnNumber,status:'pending'}),
 commitTurnActions:()=>{
   if(next==='attack'){
     state.opp[0].substituteHp=0;state.opp[0].hp=68;
     state.opp[0].defStage=1; // e.g. Stamina from the hit reaching the body
     state.confirmedMultiHitHistory.push({moveName:'multi',trace:[{substitute:true},{remainingHp:68}]});
     state.turnFieldTimeline.push({type:'move',turn:ctx.battleTurnNumber});
   } else if(next==='switch'){
     state.my[0].substituteHp=0;state.myActive=[1];state.oppActive=[1];
     state.my[1].hp=92; // switch-in effect
     state.turnFieldTimeline.push({type:'switch',turn:ctx.battleTurnNumber});
   } else if(next==='end'){
     state.my[1].hp=83;state.opp[1].hp=92;
   }
 },decrementTurnFieldCounters:()=>{
   dom.weatherTurns.value=String(+dom.weatherTurns.value-1);
   dom.terrainTurns.value=String(+dom.terrainTurns.value-1);
   state.sideConditions.my.reflect=Math.max(0,state.sideConditions.my.reflect-1);
 },confirmedAbilityIs:(_side,idx)=>idx===1,applyBattleBoost:(side,idx,boost)=>{
   Object.keys(boost).forEach(k=>state[side][idx][k]=(state[side][idx][k]||0)+boost[k]);
 },advancePerishCounters:()=>false,applyPostTurnEntries:()=>{},turnRecordSnapshot:()=>({hp:state.my.map(x=>x.hp),sub:state.opp.map(x=>x.substituteHp)}),snapshotTurnStartActives:()=>{},
 renderCards:()=>{if(fail==='render')throw Error('render failure')},refresh:()=>{},renderTurnFieldTimeline:()=>{},save:()=>{saved++;return fail!=='save'},ensureSideConditions:()=>state.sideConditions};
vm.createContext(ctx);vm.runInContext(html.slice(a,b),ctx);
const snapshot=()=>JSON.stringify({state,fields:Object.fromEntries(Object.entries(dom).map(([k,v])=>[k,v.value])),turn:ctx.battleTurnNumber,guide:ctx.guide45State});
let assertions=0;function eq(x,y,description){assert.deepEqual(x,y,description);assertions++}
const starting=snapshot();
fail='save';assert.throws(()=>ctx.finalizeTurnState(),/保存できません/);assertions++;eq(snapshot(),starting,'turn one unsuccessful persistence rollback');
fail='';ctx.finalizeTurnState();eq(ctx.battleTurnNumber,2,'first turn increment');eq(state.opp[0].substituteHp,0,'substitute broken');eq(state.opp[0].hp,68,'damage to body');eq(state.opp[0].defStage,1,'on-hit ability');eq(state.confirmedMultiHitHistory.length,1,'strike preserved');
next='switch';const beforeSwitch=snapshot();fail='render';assert.throws(()=>ctx.finalizeTurnState(),/render failure/);assertions++;eq(snapshot(),beforeSwitch,'switch and entry effects rollback');
fail='';ctx.finalizeTurnState();eq(state.myActive[0],1,'friendly switched');eq(state.oppActive[0],1,'opposing switched');eq(state.my[0].substituteHp,0,'substitute cleared on exit');eq(state.my[1].hp,92,'entry effect retained');eq(state.my[1].speStage,1,'end-turn speed boost');
next='end';const beforeFinal=snapshot();fail='save';assert.throws(()=>ctx.finalizeTurnState(),/保存できません/);assertions++;eq(snapshot(),beforeFinal,'later failure restores previous committed turns');
fail='';ctx.finalizeTurnState();eq(ctx.battleTurnNumber,4,'three turns committed');eq(state.turnLog.length,3,'three committed logs');eq(dom.weatherTurns.value,'0','weather turns decremented');eq(state.sideConditions.my.reflect,0,'screen turns decremented');eq(state.my[1].hp,83,'final observed hp');eq(state.my[1].speStage,2,'speed boosts over successive active turns');eq(state.turnFieldTimeline.length,2,'historical strike/switch timeline retained');
console.log(`${assertions} multi-turn scenario assertions passed`);
