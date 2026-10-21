const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const start=html.indexOf('function applyConfirmedYawn('),end=html.indexOf('function applyObservedMoveEffects(',start);
assert(start>=0&&end>start);
const field={value:'なし'};
const state={myActive:[0],oppActive:[0],myTeam:['コータス'],oppTeam:['対象'],my:{0:{hp:100,status:'なし'}},opp:{0:{hp:100,status:'なし'}}};
let grounded=true;
const ctx={state,$:k=>k==='terrain'?field:null,isGroundedPokemon:()=>grounded,ensureBattleEntry:(side,i)=>state[side][i]};
vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
const use=()=>vm.runInContext("applyConfirmedYawn('my',0,{move:'あくび',targetIdx:0,hitConfirmed:true,sleepAllowed:true})",ctx);
const tick=()=>vm.runInContext('advanceConfirmedYawn()',ctx);
function reset(){state.opp[0].yawnTurns=null;state.opp[0].status='なし';grounded=true;field.value='なし'}
let n=0;
for(const terrain of ['エレキ','ミスト']){
 reset();field.value=terrain;assert.equal(use(),false,terrain+' must block initial drowsiness');assert.equal(state.opp[0].yawnTurns,null);
 field.value='なし';tick();tick();assert.equal(state.opp[0].status,'なし','no delayed sleep after terrain expires');n+=2;
 reset();field.value=terrain;grounded=false;assert.equal(use(),true,'airborne target unaffected');tick();field.value='なし';tick();assert.equal(state.opp[0].status,'ねむり');n+=2;
}
reset();field.value='グラス';assert(use());tick();tick();assert.equal(state.opp[0].status,'ねむり');n++;
reset();assert(use());tick();field.value='エレキ';tick();assert.equal(state.opp[0].status,'なし','terrain appearing before resolution blocks sleep');n++;
reset();assert(use());tick();field.value='ミスト';tick();assert.equal(state.opp[0].status,'なし');n++;
console.log('PASS initial and delayed Yawn terrain immunity: '+n+' checks');
