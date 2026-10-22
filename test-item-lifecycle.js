const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function section(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j);}
const fields=Object.fromEntries(['weather','weatherTurns','terrain','terrainTurns','trTurns','myTailwind','oppTailwind'].map(k=>[k,{value:'0'}]));
const state={my:[{hp:100},{hp:100}],opp:[{hp:100}],myTeam:['A','B'],oppTeam:['C'],myActive:[0,1],oppActive:[0],sideConditions:{my:{},opp:{}}};
const profiles=[{item:'しろいハーブ'},{item:'なし'}],abilities={};
const ctx={state,savedMyProfiles:profiles,RankEffects:require('./rank-effects.js'),EffectEngine:require('./effect-engine.js'),BattleCore:require('./battle-core.js'),
 BATTLE_STAGE_KEYS:['atkStage','defStage','spaStage','spdStage','speStage','accStage','evaStage'],SELF_SETUP_BOOSTS:{},
 $:id=>fields[id],ensureBattleEntry:(s,i)=>state[s][i],ensureSideConditions:()=>state.sideConditions,clampStage:n=>Math.max(-6,Math.min(6,n)),
 confirmedAbilityIs:(s,i,n,a)=>abilities[s+i]===a&&(s==='my'||state[s][i].abilityConfirmed),abilityOf:(s,i)=>abilities[s+i]||''};
vm.createContext(ctx);vm.runInContext(section('function applyBattleBoost(','function clangorousSoulCost(')+section('function entryWeatherDuration(','function megaInfoWithChosenAbility(')+section('function applyObservedMoveEffects(','function confirmObservedOpponentMove(')+section('function decrementTurnFieldCounters(){','// v1.78.9: transaction boundary'),ctx);
let scenarios=0;
function reset(item='しろいハーブ',ability=''){
 state.my[0]={hp:100};profiles[0]={item};abilities.my0=ability;state.magicRoomTurns=0;state.opp[0]={hp:100};
}
for(const [move,expected]of Object.entries({'からをやぶる':{atkStage:2,spaStage:2,speStage:2,defStage:0,spdStage:0},'インファイト':{defStage:0,spdStage:0},'ばかぢから':{atkStage:0,defStage:0},'アームハンマー':{speStage:0},'オーバーヒート':{spaStage:0},'りゅうせいぐん':{spaStage:0},'リーフストーム':{spaStage:0},'ぶちかまし':{defStage:0,spdStage:0},'アーマーキャノン':{defStage:0,spdStage:0},'スケイルノイズ':{defStage:0},'ゴールドラッシュ':{spaStage:0}})){
 reset();ctx.applyObservedMoveEffects('my',0,'A',move);
 assert.equal(state.my[0].itemConsumed,undefined,'herb waits for end of move boundary');
 assert.equal(ctx.activateWhiteHerbFor('my',0),true,move);
 for(const [stat,value]of Object.entries(expected))assert.equal(state.my[0][stat],value,move+'/'+stat);
 state.my[0].defStage=-1;assert.equal(ctx.activateWhiteHerbFor('my',0),false,'single use');scenarios++;
}
reset();state.my[0]={hp:100,accStage:-3,evaStage:-2,atkStage:4};ctx.activateWhiteHerbFor('my',0);
assert.equal(state.my[0].accStage,0);assert.equal(state.my[0].evaStage,0);assert.equal(state.my[0].atkStage,4);scenarios++;
for(const ability of ['あまのじゃく','たんじゅん','かるわざ']){
 reset('しろいハーブ',ability);state.my[0].defStage=-2;assert.equal(ctx.activateWhiteHerbFor('my',0),true);assert.equal(state.my[0].defStage,0);
 assert.equal(!!state.my[0].unburdenActive,ability==='かるわざ');scenarios++;
}
for(const reason of ['KO','pending','Klutz','Room','no-negative']){
 reset();state.my[0].defStage=-1;
 if(reason==='KO')state.my[0].hp=0;if(reason==='pending')state.my[0].pendingPostTurnEntry=true;
 if(reason==='Klutz')abilities.my0='ぶきよう';if(reason==='Room')state.magicRoomTurns=2;if(reason==='no-negative')state.my[0].defStage=0;
 assert.equal(ctx.activateWhiteHerbFor('my',0),false,reason);assert.equal(state.my[0].itemConsumed,undefined);scenarios++;
}
reset();state.opp[0]={hp:100,item:'しろいハーブ',defStage:-1,itemConfirmed:false};assert.equal(ctx.activateWhiteHerbFor('opp',0),false);
state.opp[0].itemConfirmed=true;assert.equal(ctx.activateWhiteHerbFor('opp',0),true);scenarios++;
for(const suppression of ['ぶきよう','room']){
 reset('あついいわ',suppression==='ぶきよう'?'ぶきよう':'');if(suppression==='room')state.magicRoomTurns=5;
 ctx.applyObservedMoveEffects('my',0,'A','にほんばれ');assert.equal(fields.weatherTurns.value,'5');
 profiles[0].item='ひかりのねんど';ctx.applyObservedMoveEffects('my',0,'A','リフレクター');assert.equal(state.sideConditions.my.reflect,5);
 profiles[0].item='グラスシード';ctx.setTerrainState('グラス',5);assert.equal(state.my[0].itemConsumed,undefined);scenarios++;
}
reset('しろいハーブ');state.my[0].defStage=-2;
ctx.applyObservedMoveEffects('my',0,'A','マジックルーム');assert.equal(state.magicRoomTurns,5);assert.equal(ctx.activateWhiteHerbFor('my',0),false);
ctx.decrementTurnFieldCounters();assert.equal(state.magicRoomTurns,4);
ctx.applyObservedMoveEffects('my',0,'A','マジックルーム');assert.equal(state.magicRoomTurns,0);assert.equal(ctx.activateWhiteHerbFor('my',0),true);scenarios++;
assert.deepEqual(ctx.RankEffects.whiteHerb({defStage:-6,atkStage:6}),{defStage:6});
console.log(`PASS ${scenarios} item lifecycle, self-drop moves, suppression and Magic Room integration scenarios`);
