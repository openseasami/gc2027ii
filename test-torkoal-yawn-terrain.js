const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const a=html.indexOf('function applyConfirmedYawn('),b=html.indexOf('function applyObservedMoveEffects(',a);
assert(a>=0&&b>a);
const field={value:'なし'};
const state={myActive:[0],oppActive:[0],myTeam:['コータス'],oppTeam:['相手'],my:{0:{hp:100}},opp:{0:{hp:100,status:'なし'}}};
let grounded=true;
const context={state,$:(key)=>key==='terrain'?field:null,isGroundedPokemon:()=>grounded,ensureBattleEntry:(s,i)=>state[s][i]};
vm.createContext(context);vm.runInContext(html.slice(a,b),context);
const use=()=>vm.runInContext("applyConfirmedYawn('my',0,{move:'あくび',targetIdx:0,hitConfirmed:true,sleepAllowed:true})",context);
const tick=()=>vm.runInContext('advanceConfirmedYawn()',context);
function reset(){state.opp[0].status='なし';state.opp[0].yawnTurns=null;field.value='なし';grounded=true;}
for(const terrain of ['ミスト','エレキ']){
  reset();assert(use());tick();field.value=terrain;tick();assert.equal(state.opp[0].status,'なし',terrain+' blocks sleep at resolution');assert.equal(state.opp[0].yawnTurns,null);
  reset();assert(use());tick();field.value=terrain;grounded=false;tick();assert.equal(state.opp[0].status,'ねむり',terrain+' must not block non-grounded');
}
reset();assert(use());tick();field.value='グラス';tick();assert.equal(state.opp[0].status,'ねむり','grassy terrain does not block');
console.log('PASS delayed Yawn resolution terrain: Misty/Electric grounded, airborne, Grassy');
