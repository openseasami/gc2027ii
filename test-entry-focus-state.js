const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const html=fs.readFileSync('index.html','utf8'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const keys=['atkStage','defStage','spaStage','spdStage','speStage','accStage','evaStage'],en=['atk','def','spa','spd','spe','accuracy','evasion'];
const state={my:[{hp:100,ability:'きみょうなくすり'},{hp:100}],opp:[{hp:100}],myTeam:['source','ally'],oppTeam:['enemy'],myActive:[0,1],oppActive:[0]};
const ctx={state,BATTLE_STAGE_KEYS:keys,clampStage:n=>Math.max(-6,Math.min(6,n)),ensureBattleEntry:(s,i)=>state[s][i],abilityOf:(s,i)=>state[s][i].ability,possibleAbility:()=>false,commitEntryFieldEffect:()=>false,confirmedEntryEffect:()=>null,activateTerrainSeedsForActive:()=>{},EffectEngine:require('./effect-engine.js'),SELF_SETUP_BOOSTS:{},ensureSideConditions:()=>({my:{},opp:{}})};
vm.createContext(ctx);function section(a,b){return html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));}
vm.runInContext(section('function triggerEntryAbility(','function triggerInitialEntryAbilities(')+section('function applyObservedMoveEffects(','function confirmObservedOpponentMove(')+section('function resetEntryStages(','function actionHistoryLabel(')+section('function copyBatonState(','function commitRecordedMoveSwitch('),ctx);
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:'Eevee',moves:['splash'],ability:'Run Away'},{species:'Eevee',moves:['splash'],ability:'Run Away'}]});battle.makeChoices('team 12','team 12');let cases=0;
try{
 const source=battle.p1.active[0],ally=battle.p1.active[1],foe=battle.p2.active[0];source.ability='curiousmedicine';
 for(const stage of [-6,-1,0,2,6])for(const ability of ['runaway','contrary','simple','defiant','competitive'])for(const fainted of [false,true]){
  state.my[0]={hp:100,ability:'きみょうなくすり',atkStage:3};state.my[1]={hp:fainted?0:100,criticalFocus:2};state.opp[0]={hp:100,atkStage:3};ally.ability=ability;ally.hp=fainted?0:ally.maxhp;ally.fainted=fainted;
  keys.forEach((k,i)=>{state.my[1][k]=stage;ally.boosts[en[i]]=stage;});source.boosts.atk=3;foe.boosts.atk=3;
  battle.singleEvent('Start',battle.dex.abilities.get('curiousmedicine'),source.abilityState,source);ctx.triggerEntryAbility('my',0,'source');
  keys.forEach((k,i)=>assert.equal(state.my[1][k],ally.boosts[en[i]]));assert.equal(state.my[0].atkStage,source.boosts.atk);assert.equal(state.opp[0].atkStage,foe.boosts.atk);assert.equal(state.my[1].criticalFocus,2);cases++;
 }
}finally{battle.destroy();}
state.my[0]={hp:100};ctx.applyObservedMoveEffects('my',0,'source','きあいだめ',{failed:true});assert.equal(state.my[0].criticalFocus,undefined);ctx.applyObservedMoveEffects('my',0,'source','きあいだめ');assert.equal(state.my[0].criticalFocus,2);ctx.applyObservedMoveEffects('my',0,'source','きあいだめ');assert.equal(state.my[0].criticalFocus,2);
const saved=JSON.parse(JSON.stringify(state));assert.equal(saved.my[0].criticalFocus,2);const passed=ctx.copyBatonState(state.my[0]);ctx.resetEntryStages('my',0,'source');assert.equal(state.my[0].criticalFocus,0);ctx.restoreBatonState(state.my[1],passed);assert.equal(state.my[1].criticalFocus,2);
fs.writeFileSync('ENTRY_RESET_DIFFERENTIAL_RESULTS.json',JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',cases,failures:[],scope:'Curious Medicine rank reset; Focus Energy record/save/reset/Baton local integration; not full match or official legality.'},null,2)+'\n');console.log(`PASS ${cases} real entry rank reset cases and Focus Energy save/reset/Baton state`);
