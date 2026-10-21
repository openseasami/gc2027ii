// Generic state transitions across the inherited catalog, not an external legality oracle.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function section(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j);}
const regulation=vm.runInNewContext('('+html.match(/^const REGULATION_MC\s*=\s*(.*);$/m)[1]+')');
const state={my:[],opp:[],myTeam:[],oppTeam:[],myActive:[0,1],oppActive:[0,1]};
const fields=Object.fromEntries(['weather','weatherTurns','terrain','terrainTurns'].map(k=>[k,{value:'なし'}]));
const profiles=[];let failure=false;
const ctx={state,savedMyProfiles:profiles,RELEVANT_ABILITIES:{},MEGA_INFO:regulation.megaInfo,
 BATTLE_STAGE_KEYS:['atkStage','defStage','spaStage','spdStage','speStage','accStage','evaStage'],
 $:id=>fields[id],BattleCore:require('./battle-core.js'),clampStage:n=>Math.max(-6,Math.min(6,n)),
 ensureBattleEntry:(side,i)=>state[side][i],confirmedAbilityIs:()=>false,abilityOf:()=>'',
 confirmObservedEntryField:()=>{},renderCards:()=>{},refresh:()=>{},save:()=>!failure,
};
vm.createContext(ctx);vm.runInContext(section('function applyBattleBoost(','function clangorousSoulCost(')+section('function entryWeatherDuration(','const ELECTRIC_PRESSURE_MOVES='),ctx);
function reset(name,info){
 state.my=[{hp:100},{hp:100,item:'エレキシード'}];state.opp=[{hp:100},{hp:100}];state.myTeam=[name,'味方'];state.oppTeam=[name,'相手'];
 state.megaUsed={my:null,opp:null};state.megaTransitionHistory=[];state.entryFieldUncertainty={};
 profiles[0]={item:info.stone};profiles[1]={item:'エレキシード'};
 for(const [key,field] of Object.entries(fields))field.value=key.endsWith('Turns')?'0':'なし';failure=false;
}
let cases=0;
for(const [name,info] of Object.entries(regulation.megaInfo)){
 reset(name,info);assert.equal(ctx.effectiveBattleName('my',0,name),info.base);
 assert.equal(ctx.megaEvolve('my',0,name),true,name);assert.equal(ctx.effectiveBattleName('my',0,name),info.mega);
 assert.equal(state.my[0].ability,info.postAbility);assert.equal(state.megaUsed.my,0);
 assert.equal(ctx.megaEvolve('my',0,name),false,'one activation');
 state.my[1]={hp:100};profiles[1]={item:info.stone};assert.equal(ctx.megaEvolve('my',1,name),false,'one per side');
 assert.equal(ctx.megaEvolve('opp',0,name),true,'independent side, observed unknown item');cases++;
 reset(name,info);profiles[0].item='たべのこし';assert.equal(ctx.megaEvolve('my',0,name),false,'wrong stone');
 profiles[0].item=info.stone;state.my[0].itemConsumed=true;assert.equal(ctx.megaEvolve('my',0,name),false,'lost stone');cases++;
 reset(name,info);state.my[0].hp=0;assert.equal(ctx.megaEvolve('my',0,name),false,'KO');state.my[0].hp=100;
 state.myActive=[];assert.equal(ctx.megaEvolve('my',0,name),false,'bench');state.myActive=[0,1];cases++;
 reset(name,info);state.opp[0].item='たべのこし';assert.equal(ctx.megaEvolve('opp',0,name),false,'known wrong item');cases++;
 reset(name,info);failure=true;
 const before=JSON.stringify({state,fields});assert.throws(()=>ctx.megaEvolve('my',0,name),/保存できません/);
 assert.equal(JSON.stringify({state,fields}),before,'failed save restores all combat entries and field');
 failure=false;assert.equal(ctx.megaEvolve('my',0,name),true,'retry after failed save');
 if(info.postAbility==='エレキメイカー'){
  assert.equal(state.my[1].itemConsumed,true,'ally seed consumed only on successful save');assert.equal(state.my[1].defStage,1);
 }
 cases++;
}
console.log(`PASS ${cases} generic Mega transaction scenarios across ${Object.keys(regulation.megaInfo).length} catalog forms; external form rules unverified`);
