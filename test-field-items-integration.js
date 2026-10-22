// Execute production functions: item consumption, fields and confirmed move recording.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function section(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j);}
const fields=Object.fromEntries(['weather','weatherTurns','terrain','terrainTurns','trTurns','myTailwind','oppTailwind'].map(k=>[k,{value:'0'}]));
const state={my:[{hp:100}],opp:[{hp:100}],myTeam:['飛行枠'],oppTeam:['相手'],myActive:[0],oppActive:[0],sideConditions:{my:{},opp:{}}};
const savedMyProfiles=[{item:'グラスシード'}];
const ctx={state,savedMyProfiles,BattleCore:require('./battle-core.js'),EffectEngine:require('./effect-engine.js'),
 BATTLE_STAGE_KEYS:['atkStage','defStage','spaStage','spdStage','speStage','accStage','evaStage'],SELF_SETUP_BOOSTS:{},
 $:id=>fields[id],ensureBattleEntry:(s,i)=>state[s][i],ensureSideConditions:()=>state.sideConditions,
 clampStage:n=>Math.max(-6,Math.min(6,n)),confirmedAbilityIs:()=>false,abilityOf:()=>'',
 // Grounding must never be queried for seed activation (Flying/Levitate allowed).
 isGroundedPokemon:()=>{throw Error('seed activation must not depend on grounding')},
};
ctx.RankEffects=require('./rank-effects.js');vm.createContext(ctx);
vm.runInContext(section('function applyBattleBoost(','function clangorousSoulCost(')
 +section('function entryWeatherDuration(','function megaInfoWithChosenAbility(')
 +section('function applyObservedMoveEffects(','function confirmObservedOpponentMove('),ctx);
let cases=0;function check(f){f();cases++;}
for(const [terrain,item,stat] of [['グラス','グラスシード','defStage'],['エレキ','エレキシード','defStage'],['サイコ','サイコシード','spdStage'],['ミスト','ミストシード','spdStage']]){
 check(()=>{
  state.my[0]={hp:100};savedMyProfiles[0].item=item;ctx.setTerrainState(terrain,5);
  assert.equal(state.my[0][stat],1);assert.equal(state.my[0].itemConsumed,true);assert.equal(ctx.heldItemFor('my',0),'');
  ctx.activateTerrainSeedsForActive();assert.equal(state.my[0][stat],1,'one activation only');
 });
 check(()=>{state.my[0]={hp:100,[stat]:6};assert.equal(ctx.activateTerrainSeedFor('my',0,'飛行枠',terrain),false);assert.equal(state.my[0].itemConsumed,undefined);});
 check(()=>{state.my[0]={hp:0};assert.equal(ctx.activateTerrainSeedFor('my',0,'飛行枠',terrain),false);});
 check(()=>{state.my[0]={hp:100,pendingPostTurnEntry:true};assert.equal(ctx.activateTerrainSeedFor('my',0,'飛行枠',terrain),false);});
}
check(()=>{state.my[0]={hp:100};savedMyProfiles[0].item='グラスシード';assert.equal(ctx.activateTerrainSeedFor('my',0,'飛行枠','サイコ'),false);assert.equal(state.my[0].itemConsumed,undefined);});
check(()=>{state.my[0]={hp:100};ctx.abilityOf=()=> 'かるわざ';ctx.setTerrainState('グラス',5);assert.equal(state.my[0].unburdenActive,true);});
for(const [move,weather,rock] of [['にほんばれ','晴れ','あついいわ'],['あまごい','雨','しめったいわ'],['すなあらし','砂','さらさらいわ'],['ゆきげしき','雪','つめたいいわ']]){
 check(()=>{
  state.my[0]={hp:100};savedMyProfiles[0].item=rock;ctx.applyObservedMoveEffects('my',0,'飛行枠',move);
  assert.equal(fields.weather.value,weather);assert.equal(fields.weatherTurns.value,'8');
  state.my[0].itemConsumed=true;ctx.applyObservedMoveEffects('my',0,'飛行枠',move);assert.equal(fields.weatherTurns.value,'5');
  state.my[0].itemConsumed=false;savedMyProfiles[0].item='たべのこし';ctx.applyObservedMoveEffects('my',0,'飛行枠',move);assert.equal(fields.weatherTurns.value,'5');
 });
}
for(const [move,screen] of [['リフレクター','reflect'],['ひかりのかべ','lightScreen']]){
 check(()=>{
  state.opp[0]={hp:100,item:'ひかりのねんど'};ctx.applyObservedMoveEffects('opp',0,'相手',move);assert.equal(state.sideConditions.opp[screen],8);
  state.opp[0].itemConsumed=true;ctx.applyObservedMoveEffects('opp',0,'相手',move);assert.equal(state.sideConditions.opp[screen],5);
  assert.equal(state.sideConditions.my[screen],undefined,'opponent screen stays on its side');
 });
}
console.log(`PASS ${cases} field/item integration scenarios; no full item-ability parity claim`);

ctx.confirmedAbilityIs=(side,idx,name,a)=>a==='あまのじゃく';
ctx.abilityOf=()=> 'あまのじゃく';savedMyProfiles[0].item='グラスシード';
state.my[0]={hp:100,defStage:6};
assert.equal(ctx.activateTerrainSeedFor('my',0,'飛行枠','グラス'),true);
assert.equal(state.my[0].defStage,5,'Contrary seed can activate at +6');
state.my[0]={hp:100,defStage:-6};
assert.equal(ctx.activateTerrainSeedFor('my',0,'飛行枠','グラス'),false);
assert.equal(state.my[0].itemConsumed,undefined,'Contrary seed stays held at -6');
console.log('PASS Contrary terrain-seed activation boundaries');
// A queued KO replacement must stop being pending before entry-triggered seeds run.
ctx.confirmedAbilityIs=()=>false;ctx.abilityOf=()=>'';
ctx.fieldSpeed=()=>100;ctx.resetEntryStages=(side,idx)=>{state[side][idx].defStage=0;state[side][idx].spdStage=0;};
ctx.applyEntryTerrain=()=>false;ctx.triggerEntryAbility=()=>ctx.activateTerrainSeedsForActive();
vm.runInContext(section('function resolveEntryEvents(entries){','// Recorded field checkpoints'),ctx);
state.my[0]={hp:100,pendingPostTurnEntry:true};savedMyProfiles[0].item='グラスシード';fields.terrain.value='グラス';
ctx.resolveEntryEvents([{side:'my',idx:0,name:'飛行枠',postTurn:true}]);
assert.equal(state.my[0].itemConsumed,true,'post-turn replacement seed activates on entry');
assert.equal(state.my[0].defStage,1);
assert.equal(state.my[0].pendingPostTurnEntry,false);
console.log('PASS queued KO replacement resolves before seed activation');
