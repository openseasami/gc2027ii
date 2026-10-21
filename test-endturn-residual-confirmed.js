const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('function recordEndTurnResidualProjections(){');
const end=html.indexOf('\nfunction finalizeTurnState(){',start);
assert.ok(start>0&&end>start);
const fun=html.slice(start,end);
function evaluate(weather,team,entry,item,ability,confirmed=true){
 const state={myTeam:[],myActive:[],oppTeam:[],oppActive:[],opp:[],my:[]};
 state.oppTeam=[team];state.oppActive=[0];state.opp=[{hp:50,...entry,itemConfirmed:confirmed,abilityConfirmed:confirmed}];
 const ctx={state,BATTLE_DATA:{[team]:{types:team==='Poison'?['どく']:['ノーマル']}},
  EffectEngine:{},heldItemFor:()=>item,knownBattleAbility:()=>ability,$:()=>({value:weather})};
 vm.runInNewContext(fun+';recordEndTurnResidualProjections();',ctx);
 return JSON.parse(JSON.stringify(state.endTurnResidualProjections));
}
let r=evaluate('雨','Normal',{},'たべのこし','あめうけざら');
assert.equal(r.length,2);assert.ok(r.every(e=>e.kind==='heal'&&!e.autoApplied&&e.projectedHpAmount===null));
assert.equal(evaluate('晴れ','Normal',{},'','あめうけざら').length,0);
assert.equal(evaluate('雪','Normal',{},'','アイスボディ').length,1);
assert.equal(evaluate('雨','Normal',{},'','アイスボディ').length,0);
assert.equal(evaluate('なし','Poison',{},'くろいヘドロ','')[0].kind,'heal');
assert.equal(evaluate('なし','Normal',{exactMaxHp:160},'くろいヘドロ','')[0].projectedHpAmount,20);
assert.equal(evaluate('なし','Normal',{exactMaxHp:160},'くろいヘドロ','')[0].kind,'damage');
assert.equal(evaluate('雨','Normal',{},'たべのこし','あめうけざら',false).length,0);
console.log('End-turn projections conditional & confirmation test: PASS');
