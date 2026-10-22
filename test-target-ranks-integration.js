const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function section(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j);}
const state={my:[{},{}],opp:[{},{}],myTeam:['A','B'],oppTeam:['C','D'],myActive:[0,1],oppActive:[0,1],sideConditions:{my:{},opp:{}}};
let bypass=false;
const ctx={state,RankEffects:require('./rank-effects.js'),EffectEngine:require('./effect-engine.js'),SELF_SETUP_BOOSTS:{},BATTLE_STAGE_KEYS:['atkStage','defStage','spaStage','spdStage','speStage','accStage','evaStage'],
 $:()=>null,ensureSideConditions:()=>state.sideConditions,ensureBattleEntry:(s,i)=>state[s][i],clampStage:n=>Math.max(-6,Math.min(6,n)),
 abilityOf:(s,i)=>state[s][i].ability||'',knownBattleAbility:(s,i)=>s==='my'||state[s][i].abilityConfirmed?state[s][i].ability||'':null,
 confirmedAbilityIs:(s,i,n,a)=>(s==='my'||state[s][i].abilityConfirmed)&&state[s][i].ability===a,
 heldItemFor:(s,i)=>state[s][i].itemConsumed?'':state[s][i].item||'',activeHeldItemFor:(s,i)=>state[s][i].item||'',attackerIgnoresDefensiveAbilities:()=>bypass};
vm.createContext(ctx);vm.runInContext(section('function applyBattleBoost(','function clangorousSoulCost(')+section('function applyObservedMoveEffects(','function confirmObservedOpponentMove(')+section('function receiveIntimidate(','// v2.8: shared event'),ctx);
function reset(){for(const side of ['my','opp'])for(const i of [0,1])state[side][i]={hp:100,ability:'',abilityConfirmed:true,item:'なし',itemConfirmed:true};bypass=false;}
const fixtures={'こわいかお':{speStage:-2},'うそなき':{spdStage:-2},'あまえる':{atkStage:-2},'すなかけ':{accStage:-1},'えんまく':{accStage:-1},'いやなおと':{defStage:-2},'きんぞくおん':{spdStage:-2},'かいでんぱ':{spaStage:-2},'つぶらなひとみ':{atkStage:-1},'フェザーダンス':{atkStage:-2},'ないしょばなし':{spaStage:-1},'おたけび':{atkStage:-1,spaStage:-1},'なみだめ':{atkStage:-1,spaStage:-1},'くすぐる':{atkStage:-1,defStage:-1}};
const action={targetIdx:1,effectReviewed:true,hitConfirmed:true,hitSubstitute:false};let scenarios=0;
for(const [move,expected]of Object.entries(fixtures))for(const side of ['my','opp']){
 reset();const other=side==='my'?'opp':'my';ctx.applyObservedMoveEffects(side,0,state[side+'Team'][0],move,action);
 for(const [key,value]of Object.entries(expected))assert.equal(state[other][1][key],value,side+'/'+move+'/'+key);
 assert.equal(state[other][0].atkStage,undefined,'no mutation of untargeted partner');scenarios++;
 for(const invalid of [{},{...action,hitSubstitute:true},{...action,effectReviewed:false},{...action,hitConfirmed:false},{...action,targetIdx:99},{...action,failed:true}]){
  reset();assert.equal(ctx.applyConfirmedTargetRanks(side,0,'A',move,invalid),false);assert.equal(state[other][1].atkStage,undefined);scenarios++;
 }
}
for(const ability of ['クリアボディ','しろいけむり','かいりきバサミ']){
 reset();state.opp[1].ability=ability;assert.equal(ctx.applyConfirmedTargetRanks('my',0,'A','あまえる',action),false);scenarios++;
}
reset();state.opp[1].item='クリアチャーム';bypass=true;assert.equal(ctx.applyConfirmedTargetRanks('my',0,'A','あまえる',action),false);scenarios++;
reset();state.opp[1].ability='クリアボディ';bypass=true;assert.equal(ctx.applyConfirmedTargetRanks('my',0,'A','あまえる',action),true);assert.equal(state.opp[1].atkStage,-2);scenarios++;
reset();state.opp[1].ability='ミラーアーマー';state.my[0].ability='あまのじゃく';ctx.applyConfirmedTargetRanks('my',0,'A','あまえる',action);assert.equal(state.my[0].atkStage,2);assert.equal(state.opp[1].atkStage,undefined);scenarios++;
for(const unknown of ['abilityConfirmed','itemConfirmed']){
 reset();state.opp[1][unknown]=false;assert.equal(ctx.applyConfirmedTargetRanks('my',0,'A','あまえる',action),false);assert.ok(state.opp[1].rankEffectUncertainty);scenarios++;
}
for(const [ability,expected]of [['あまのじゃく',1],['たんじゅん',-2],['まけんき',1],['ばんけん',1],['かいりきバサミ',0],['マイペース',0]]){
 reset();state.my[0].ability=ability;ctx.receiveIntimidate('my',0,'A','opp',0);assert.equal(state.my[0].atkStage||0,expected,ability);scenarios++;
}
reset();state.opp[1].ability='ミラーアーマー';ctx.receiveIntimidate('opp',1,'D','my',0);assert.equal(state.my[0].atkStage,-1);assert.equal(state.opp[1].atkStage,undefined);scenarios++;
reset();state.opp[1].abilityConfirmed=false;ctx.receiveIntimidate('opp',1,'D','my',0);assert.equal(state.opp[1].atkStage,undefined);scenarios++;
reset();ctx.applyObservedMoveEffects('my',0,'A','こごえるかぜ');assert.equal(state.opp[0].speStage,undefined);assert.equal(state.opp[1].speStage,undefined,'spread move does not assume all targets hit');scenarios++;
console.log(`PASS ${scenarios} explicit doubles targets, rank reactions, Intimidate and unknown-outcome integration scenarios`);

reset();state.opp[1].ability='まけんき';state.my[1].ability='びんじょう';
ctx.applyConfirmedTargetRanks('my',0,'A','あまえる',action);
assert.equal(state.opp[1].atkStage,0);assert.equal(state.my[1].atkStage,2,'Opportunist copies the actual Defiant gain, not net stage');
reset();state.my[0].ability='あまのじゃく';state.opp[1].ability='びんじょう';
ctx.receiveIntimidate('my',0,'A','opp',0);assert.equal(state.my[0].atkStage,1);assert.equal(state.opp[1].atkStage,1);
console.log('PASS actual gain propagation preserves Opportunist on reactions and Contrary Intimidate');

reset();state.opp[1].ability='ミラーアーマー';state.my[0].item='クリアチャーム';
assert.equal(ctx.applyConfirmedTargetRanks('my',0,'A','あまえる',action),false);
assert.equal(state.my[0].atkStage,undefined,'reflected drop respects source active item');
reset();state.my[1].ability='ミラーアーマー';state.opp[0].itemConfirmed=false;
assert.equal(ctx.applyConfirmedTargetRanks('opp',0,'C','あまえる',action),false);
assert.equal(state.opp[0].atkStage,undefined,'unknown source item does not create a guessed reflected drop');
console.log('PASS reflected rank change source-item protection and unknown guards');
