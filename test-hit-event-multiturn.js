const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const literal=n=>vm.runInNewContext('('+html.match(new RegExp('^const '+n+'\\s*=\\s*(.*);$','m'))[1]+')');
const state={my:[{},{}],opp:[{hp:100,ability:'せいぎのこころ',abilityConfirmed:true},{hp:100,ability:'じきゅうりょく',abilityConfirmed:true}],myActive:[0,1],oppActive:[0,1],myTeam:['A','B'],oppTeam:['C','D']};
const rank=require('./rank-effects.js');const ctx={state,EffectEngine:require('./effect-engine.js'),NATIONAL_MOVES:literal('NATIONAL_MOVES'),DAMAGE_MOVES:{},knownBattleAbility:(s,i)=>state[s][i].abilityConfirmed?state[s][i].ability:'',abilityBypassed:()=>false,applyBattleBoost:(s,i,changes)=>rank.apply(rank.resolve({stages:state[s][i],changes,ability:state[s][i].ability,origin:'self'}),state[s][i])};
vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function applyConfirmedHitAbilityStages('),html.indexOf('// Confirmed incoming hits:')),ctx);
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});
battle.setPlayer('p1',{team:[{species:'Eevee',level:1,ability:'Run Away',moves:['darkpulse']},{species:'Eevee',level:1,ability:'Run Away',moves:['tackle']}]});
battle.setPlayer('p2',{team:[{species:'Lucario',level:100,ability:'Justified',moves:['splash']},{species:'Mudsdale',level:100,ability:'Stamina',moves:['splash']}]});battle.makeChoices('team 12','team 12');
const checkpoints=[];
try{
 for(let turn=1;turn<=4;turn++){
  battle.makeChoices('move darkpulse 1, move tackle 2','move splash, move splash');
  ctx.applyConfirmedHitAbilityStages('my',0,'opp',0,'あくのはどう');ctx.applyConfirmedHitAbilityStages('my',1,'opp',1,'たいあたり');
  assert.equal(state.opp[0].atkStage,battle.p2.active[0].boosts.atk);assert.equal(state.opp[1].defStage,battle.p2.active[1].boosts.def);
  checkpoints.push({turn,atk:state.opp[0].atkStage,def:state.opp[1].defStage});
 }
}finally{battle.destroy();}
state.opp[0].atkStage=0;ctx.applyConfirmedHitAbilityStages('my',0,'opp',0,'かえんほうしゃ');assert.equal(state.opp[0].atkStage,0);
state.opp[0].abilityConfirmed=false;ctx.applyConfirmedHitAbilityStages('my',0,'opp',0,'あくのはどう');assert.equal(state.opp[0].atkStage,0);
state.opp[1].hp=0;ctx.applyConfirmedHitAbilityStages('my',1,'opp',1,'たいあたり');assert.equal(state.opp[1].defStage,4);
fs.writeFileSync(__dirname+'/MULTITURN_DIFFERENTIAL_RESULTS.json',JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',turns:4,checkpoints,failures:[],scope:'Actual four-turn doubles engine transcript compared with app confirmed-hit rank adapter; damage/HP/actions are not simulated by the app adapter.'},null,2)+'\n');
for(const origin of ['self','ally','opponent'])for(const bypass of [false,true]){const r=rank.resolve({stages:{},changes:{accStage:-1},ability:'はっこう',origin,bypass});assert.equal(r.events.length,origin==='self'||bypass?1:0);}
console.log('PASS four-turn real doubles engine / confirmed-hit rank checkpoints, type/unknown/KO guards and Illuminate rank scope');
const engine=require('./effect-engine.js');
for(const ability of ['せいぎのこころ','じきゅうりょく'])for(const extra of [{damaging:false},{substitute:true}]){
 const result=engine.evaluate('on_hit',{defender:{ability},attacker:{ability:''},damaging:true,substitute:false,moveType:'あく',category:'special',...extra});assert.equal(result.events.length,0);
}
state.opp[1].hp=100;state.opp[1].defStage=0;ctx.applyConfirmedHitAbilityStages('my',1,'opp',1,'たいあたり',3);assert.equal(state.opp[1].defStage,3);
ctx.applyConfirmedHitAbilityStages('my',1,'opp',1,'たいあたり',5);assert.equal(state.opp[1].defStage,6);
console.log('PASS hit gating, substitute immunity, per-hit repetition and rank cap');
