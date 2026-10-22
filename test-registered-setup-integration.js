const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),engine=require('./effect-engine.js');
function section(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i);return html.slice(i,j);}
const fixtures={'からにこもる':{defStage:1},'かくばる':{atkStage:1},'ヨガのポーズ':{atkStage:1},'ロックカット':{speStage:2},'つめとぎ':{atkStage:1,accStage:1},'ギアチェンジ':{atkStage:1,speStage:2}};
const state={myTeam:['A'],oppTeam:['B'],myActive:[0],oppActive:[0],my:[{}],opp:[{}],sideConditions:{my:{},opp:{}},confirmedMultiHitHistory:[]};
const ctx={state,EffectEngine:engine,SELF_SETUP_BOOSTS:{},BATTLE_STAGE_KEYS:['atkStage','defStage','spaStage','spdStage','speStage','accStage','evaStage'],battleTurnNumber:1,
 $:()=>null,ensureBattleEntry:(s,i)=>state[s][i],ensureSideConditions:()=>state.sideConditions,clampStage:n=>Math.max(-6,Math.min(6,n)),
 confirmedAbilityIs:()=>false,sortTurnSimulationEvents:x=>x,
 recordedTurnEvents:()=>['my','opp'].map(side=>({side,idx:0,actor:state[side+'Team'][0],action:state[side][0].currentTurnAction})),
 linkedMultiHitForEvent:()=>null,commitRecordedMoveSwitch:()=>null,
};
ctx.RankEffects=require('./rank-effects.js');vm.createContext(ctx);vm.runInContext(section('function applyBattleBoost(','function clangorousSoulCost(')+section('function applyObservedMoveEffects(','function confirmObservedOpponentMove(')+section('function commitTurnActions(){','function stageText('),ctx);
let scenarios=0;
for(const [move,boosts] of Object.entries(fixtures)){
 assert.equal(engine.evaluate('on_move_used',{move}).unknown,true);
 assert.equal(engine.evaluate('on_move_used',{move,succeeded:false}).events.length,0);
 for(const side of ['my','opp']){
  for(const failed of [false,true]){
   state.my[0]={hp:100,actionHistory:[]};state.opp[0]={hp:100,actionHistory:[]};
   state[side][0].currentTurnAction={kind:'move',move,failed};ctx.commitTurnActions();
   for(const [stat,delta] of Object.entries(boosts))assert.equal(state[side][0][stat]||0,failed?0:delta,`${side}/${move}/${stat}/${failed}`);
   assert.equal(state[side][0].actionHistory.length,1);assert.equal(state[side][0].currentTurnAction,null);
   assert.equal(state[side==='my'?'opp':'my'][0].atkStage,undefined);scenarios++;
  }
 }
 state.my[0]={hp:100,...Object.fromEntries(Object.keys(boosts).map(s=>[s,5]))};
 ctx.applyObservedMoveEffects('my',0,'A',move);
 for(const stat of Object.keys(boosts))assert.equal(state.my[0][stat],6,'stage cap');scenarios++;
}
console.log(`PASS ${scenarios} registered setup integration scenarios (recording, failure, side, cap)`);

// Confirmed Contrary/Simple change the *delta*, never copied absolute stages.
for(const [ability,factor] of [['あまのじゃく',-1],['たんじゅん',2]]){
 ctx.confirmedAbilityIs=(side,idx,name,a)=>a===ability&&side==='my';
 for(const [move,boosts] of Object.entries(fixtures)){
  state.my[0]={hp:100};state.opp[0]={hp:100};
  ctx.applyObservedMoveEffects('my',0,'A',move);
  for(const [stat,delta] of Object.entries(boosts))assert.equal(state.my[0][stat],delta*factor,ability+'/'+move);
 }
 state.my[0]={hp:100,atkStage:5};ctx.applyBattleBoost('my',0,{atkStage:-2});
 assert.equal(state.my[0].atkStage,ability==='あまのじゃく'?6:1);
}
ctx.confirmedAbilityIs=()=>false;
state.my[0]={hp:100};ctx.applyObservedMoveEffects('my',0,'A','ギアチェンジ');
assert.equal(state.my[0].speStage,2,'unconfirmed ability does not modify observed stages');
console.log('PASS confirmed Contrary/Simple self-rank deltas, caps and ordinary fallback');
