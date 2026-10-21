const fs=require('fs');const vm=require('vm');const assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'index.html'),'utf8');
const core=html.slice(html.indexOf('const CLEARABLE_STAGE_KEYS='),html.indexOf('function applyObservedMoveEffects('));
const ctx={state:{myActive:[0],oppActive:[0,1],myTeam:['コータス'],oppTeam:['A','B'],my:{0:{hp:100}},opp:{0:{hp:90},1:{hp:100}}},ensureBattleEntry:(s,i)=>ctx.state[s][i]};
vm.createContext(ctx);vm.runInContext(core,ctx);
function apply(a){return vm.runInContext(`applyConfirmedClearSmog('my',0,${JSON.stringify(a)})`,ctx)}
for(let i of [0,1])Object.assign(ctx.state.opp[i],{atkStage:6,defStage:-2,spaStage:3,spdStage:2,speStage:-4,accStage:5,evaStage:-3});
assert.strictEqual(apply({move:'クリアスモッグ',targetIdx:0}),false,'unconfirmed hit ignored');
assert.strictEqual(ctx.state.opp[0].atkStage,6);
assert.strictEqual(apply({move:'クリアスモッグ',hitConfirmed:true}),false,'ambiguous doubles target ignored');
assert.strictEqual(apply({move:'クリアスモッグ',hitConfirmed:true,targetIdx:1,hitSubstitute:true}),false,'substitute hit ignored');
assert.strictEqual(apply({move:'クリアスモッグ',hitConfirmed:true,targetIdx:1}),true);
for(const k of ['atkStage','defStage','spaStage','spdStage','speStage','accStage','evaStage'])assert.strictEqual(ctx.state.opp[1][k],0,k);
assert.strictEqual(ctx.state.opp[0].atkStage,6,'other pokemon untouched');
console.log('PASS confirmed clear smog: safe targeting, 7 stages, substitute, miss and ambiguity');
