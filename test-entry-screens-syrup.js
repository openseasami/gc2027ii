const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const h=fs.readFileSync('index.html','utf8'),rank=require('./rank-effects.js');
const state={my:[{hp:100,ability:'かんろなミツ'}],opp:[{hp:100,ability:'',abilityConfirmed:true,itemConfirmed:true},{hp:100,ability:'まけんき',abilityConfirmed:true,itemConfirmed:true}],myTeam:['source'],oppTeam:['A','B'],myActive:[0],oppActive:[0,1],sideConditions:{my:{reflect:5,lightScreen:3,safeguard:4},opp:{reflect:2,lightScreen:2,auroraVeil:3}}};
const ctx={state,RankEffects:rank,ensureBattleEntry:(s,i)=>state[s][i],abilityOf:(s,i)=>state[s][i].ability,possibleAbility:()=>false,confirmedEntryEffect:()=>null,commitEntryFieldEffect:()=>false,activateTerrainSeedsForActive:()=>{},heldItemFor:()=>'',confirmedAllyAbilityProtection:()=>false,ensureSideConditions:()=>state.sideConditions,commitRankResolution:(r,t,source)=>rank.apply(r,t,source)};vm.createContext(ctx);vm.runInContext(h.slice(h.indexOf('function triggerEntryAbility('),h.indexOf('function triggerInitialEntryAbilities(')),ctx);
ctx.triggerEntryAbility('my',0,'source');assert.equal(state.opp[0].evaStage,-1);assert.equal(state.opp[1].evaStage,-1);assert.equal(state.opp[1].atkStage,2);ctx.triggerEntryAbility('my',0,'source');assert.equal(state.opp[0].evaStage,-1,'once per battle');
const restored=JSON.parse(JSON.stringify(state));state.my[0]=restored.my[0];ctx.triggerEntryAbility('my',0,'source');assert.equal(state.opp[0].evaStage,-1,'save/reload keeps consumed entry activation');
state.my[0].ability='バリアフリー';ctx.triggerEntryAbility('my',0,'source');for(const s of ['my','opp'])for(const k of ['reflect','lightScreen','auroraVeil'])assert.equal(state.sideConditions[s][k],0);assert.equal(state.sideConditions.my.safeguard,4);
console.log('PASS entry screens removal both sides, Syrup once per battle, Defiant and save/reload persistence');
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:'Eevee',ability:'Run Away',moves:['splash']},{species:'Eevee',ability:'Run Away',moves:['splash']}]});battle.makeChoices('team 12','team 12');let cases=0;
try{
 const source=battle.p1.active[0];
 for(const [jp,id]of [['','runaway'],['クリアボディ','clearbody'],['まけんき','defiant'],['あまのじゃく','contrary'],['たんじゅん','simple']])for(const start of [-6,0,6])for(const sub of [false,true]){
  state.my[0]={hp:100,ability:'かんろなミツ'};source.ability='supersweetsyrup';source.syrupTriggered=false;
  for(let i=0;i<2;i++){
   state.opp[i]={hp:100,ability:jp,abilityConfirmed:true,itemConfirmed:true,evaStage:start,atkStage:0,substituteHp:i===0&&sub?10:0};
   const target=battle.p2.active[i];target.ability=id;target.boosts.evasion=start;target.boosts.atk=0;delete target.volatiles.substitute;if(i===0&&sub)target.volatiles.substitute={hp:10};
  }
  for(let repeat=0;repeat<2;repeat++){
   battle.singleEvent('Start',battle.dex.abilities.get('supersweetsyrup'),source.abilityState,source);ctx.triggerEntryAbility('my',0,'source');
   for(let i=0;i<2;i++){assert.equal(state.opp[i].evaStage,battle.p2.active[i].boosts.evasion);assert.equal(state.opp[i].atkStage||0,battle.p2.active[i].boosts.atk);}
  }
  cases++;
 }
 for(const side of battle.sides)for(const screen of ['reflect','lightscreen','auroraveil'])side.addSideCondition(screen,source);
 state.sideConditions={my:{reflect:5,lightScreen:5,auroraVeil:5},opp:{reflect:5,lightScreen:5,auroraVeil:5}};state.my[0].ability='バリアフリー';source.ability='screencleaner';battle.singleEvent('Start',battle.dex.abilities.get('screencleaner'),source.abilityState,source);ctx.triggerEntryAbility('my',0,'source');
 for(const side of battle.sides)for(const screen of ['reflect','lightscreen','auroraveil'])assert.equal(!!side.getSideCondition(screen),false);cases++;
}finally{battle.destroy();}
fs.writeFileSync(__dirname+'/ENTRY_PROTECTION_DIFFERENTIAL_RESULTS.json',JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',cases,failures:[],scope:'Syrup entry/rank/substitute/once-only and both-side screen clearing; not full match or Champions rules'},null,2)+'\n');console.log(`PASS ${cases} real Showdown entry comparison scenarios`);
