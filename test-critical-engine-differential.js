const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),critical=require('./critical-effects.js'),core=require('./battle-core.js');
const html=fs.readFileSync('index.html','utf8'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const traits=vm.runInNewContext('('+html.match(/^const ABILITY_ENGINE_DATA\s*=\s*(.*);$/m)[1]+')').moves;
for(const name of critical.guaranteed)assert.equal(ps.Dex.moves.get(traits[name].id).willCrit,true,name);
for(const name of critical.elevated)assert.equal(ps.Dex.moves.get(traits[name].id).critRatio,2,name);
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:side==='p1'?'Pikachu':'Eevee',level:50,ability:'Run Away',moves:['tackle']},{species:'Eevee',level:50,ability:'Run Away',moves:['splash']}]});battle.makeChoices('team 12','team 12');
const aa={'':'runaway','きょううん':'superluck','ひとでなし':'merciless','スナイパー':'sniper'},da={'':'runaway','カブトアーマー':'battlearmor','シェルアーマー':'shellarmor'},items={'':'','ピントレンズ':'scopelens','するどいツメ':'razorclaw'};let rateCases=0,damageCases=0;
try{
 const source=battle.p1.active[0],target=battle.p2.active[0];
 for(const [move,id]of [['たいあたり','tackle'],['リーフブレード','leafblade'],['トリックフラワー','flowertrick']])for(const [ability,aid]of Object.entries(aa))for(const [defender,did]of Object.entries(da))for(const [item,iid]of Object.entries(items))for(const focus of [0,2])for(const poison of [false,true]){
  source.ability=aid;source.setItem(iid);target.ability=did;target.status=poison?'psn':'';delete source.volatiles.focusenergy;if(focus)source.addVolatile('focusenergy');
  const m=battle.dex.getActiveMove(id);const stage=Math.min(4,battle.runEvent('ModifyCritRatio',source,target,m,m.critRatio));const allowed=battle.runEvent('CriticalHit',target,null,m)!==false;
  const expected=!allowed?0:m.willCrit?1:[0,1/24,1/8,1/2,1][stage];const got=critical.profile(move,{attackerAbility:ability,defenderAbility:defender,item,status:poison?'どく':'',focus});
  assert.equal(got.chance,expected,JSON.stringify({move,ability,defender,item,focus,poison}));rateCases++;
 }
 source.ability='runaway';source.setItem('');target.ability='runaway';target.status='';delete source.volatiles.focusenergy;
 const state={my:[{hp:100,abilityConfirmed:true}],opp:[{hp:100,abilityConfirmed:true,itemConfirmed:true}],myTeam:['A'],oppTeam:['B']};let currentAbility='',screen=false;
 const ctx={state,CriticalEffects:critical,BattleCore:core,DAMAGE_MOVES:{'たいあたり':{power:40,cat:'phys',type:'ノーマル'}},BATTLE_DATA:{A:{atk:1,def:1},B:{def:1,hp:1}},savedMyProfiles:[{}],effectiveBattleName:(s,i,n)=>n,
  resolveMoveForDamage:()=>({moveType:'ノーマル',power:40,abilityMod:1}),sharedAbilityDamageModifiers:()=>({attack:1,defense:1,power:1,final:1}),abilityTypeEffect:()=>1,heldItemFor:()=>'',calcRealStat:(base,ev,nature,key)=>['atk','spa'].includes(key)?source.storedStats[key]:target.storedStats[key],applyStage:core.stageStat,defenderSpreadForBulk:()=>({}),weatherDefenseMod:()=>1,calcRealHP:()=>target.maxhp,abilityDamageImmunity:()=>'',disguiseProtects:()=>false,leadData:()=>[{}],terrainDamageMod:()=>1,battleBaseDamage:(p,a,d)=>core.baseDamage(p,a,d,false,1,1),damageStabMod:()=>1,itemDamageMod:()=>1,screenDamageMod:()=>screen?2/3:1,damageRollOrdered:core.damageRoll,battlePokeRound:core.pokeRound,koSurvivalAssessment:()=>({blocks:false,uncertain:[]}),criticalProfileForDamage:()=>critical.profile('たいあたり',{attackerAbility:currentAbility,defenderAbility:'',item:''}),abilityBypassed:()=>false,abilityOf:()=>'',confirmedFocusSash:()=>false};
 ctx.confirmedAbilityIs=()=>false;ctx.activeEntryByName=()=>({idx:0,name:'A',d:state.opp[0]});
 vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function damageEstimate('),html.indexOf('// v1.77.5: distribution')),ctx);
 vm.runInContext(html.slice(html.indexOf('function opponentDamageEstimateAgainstMy('),html.indexOf('function roughOpponentAttackLethalChance(')),ctx);
 for(const ability of ['','スナイパー'])for(const attackStage of [-2,0,2])for(const defenseStage of [-2,0,2])for(const reflect of [false,true]){
  currentAbility=ability;source.ability=aa[ability];source.boosts.atk=attackStage;target.boosts.def=defenseStage;state.my[0].atkStage=attackStage;state.opp[0].defStage=defenseStage;screen=reflect;target.side.removeSideCondition('reflect');if(reflect)target.side.addSideCondition('reflect',target);
  const actual=ctx.damageEstimate('A','たいあたり','B',0,'neutral',0,null,true);
  state.opp[0].atkStage=attackStage;state.my[0].defStage=defenseStage;
  const incoming=ctx.opponentDamageEstimateAgainstMy({kind:'attack',actor:'A',move:'たいあたり'},{idx:0,name:'B',d:state.my[0]},null,true);
  for(let roll=85;roll<=100;roll++){
   battle.randomizer=n=>Math.floor(n*roll/100);const move=battle.dex.getActiveMove('tackle');move.willCrit=true;
   const expected=battle.actions.getDamage(source,target,move,true);assert.equal(actual.rolls[roll-85],expected,JSON.stringify({ability,attackStage,defenseStage,reflect,roll}));assert.equal(incoming.rolls[roll-85],expected,'incoming symmetry');damageCases+=2;
  }
 }
}finally{battle.destroy();}
assert.equal(critical.profile('たいあたり',{}).chance,null);assert.equal(critical.profile('トリックフラワー',{attackerAbility:'',defenderAbility:'シェルアーマー',item:'',bypass:true}).chance,1);
fs.writeFileSync('CRITICAL_DIFFERENTIAL_RESULTS.json',JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',rateCases,damageCases,failures:[],scope:'General Gen9 rate and neutral physical critical damage/negative attack/positive defense/screens/Sniper only. No complete damage or Champions certification.'},null,2)+'\n');console.log(`PASS ${rateCases} critical rate and ${damageCases} real engine critical damage cases`);
