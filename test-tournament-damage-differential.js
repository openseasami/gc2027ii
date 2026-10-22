// Real outgoing/incoming app functions; fixed source/target stats and confirmed inputs.
// Gen9 scoped rounding/effect phases, not a full Champions calculator certification.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),core=require('./battle-core.js');
const html=fs.readFileSync('index.html','utf8'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:side==='p1'?'Rillaboom':'Eevee',level:50,ability:'Run Away',moves:['splash']},{species:'Eevee',level:50,ability:'Run Away',moves:['splash']}]});battle.makeChoices('team 12','team 12');
const source=battle.p1.active[0],target=battle.p2.active[0];
let weather='なし',terrain=false,screen=false,item='',ability='',activeMove;
const itemIds={'':'','いのちのたま':'lifeorb','きせきのタネ':'miracleseed','もくたん':'charcoal','こだわりハチマキ':'choiceband','こだわりメガネ':'choicespecs'};
const state={my:[{hp:100,abilityConfirmed:true}],opp:[{hp:100,item:'',itemConfirmed:true,abilityConfirmed:true}]};
const moves={'ウッドハンマー':{id:'woodhammer',power:120,type:'くさ',cat:'phys'},'じしん':{id:'earthquake',power:100,type:'じめん',cat:'phys',spread:true},'かえんほうしゃ':{id:'flamethrower',power:90,type:'ほのお',cat:'spec'},'ハイパーボイス':{id:'hypervoice',power:90,type:'ノーマル',cat:'spec',spread:true}};
const ctx={BattleCore:core,state,DAMAGE_MOVES:moves,BATTLE_DATA:{A:{atk:11,spa:12,def:13,spd:14,types:['くさ']},B:{def:21,spd:22,hp:99,types:['ノーマル']}},savedMyProfiles:[{}],effectiveBattleName:(s,i,n)=>n,
 resolveMoveForDamage:(s,i,n,m,mv)=>({moveType:mv.type,power:mv.power,abilityMod:1}),sharedAbilityDamageModifiers:()=>({attack:ability==='こんじょう'&&activeMove.cat==='phys'&&source.status?1.5:1,defense:1,power:1,final:1,ignoreBurn:ability==='こんじょう'}),abilityTypeEffect:()=>1,heldItemFor:()=>item,calcRealStat:(base)=>({11:source.storedStats.atk,12:source.storedStats.spa,13:source.storedStats.def,14:source.storedStats.spd,21:target.storedStats.def,22:target.storedStats.spd})[base],applyStage:core.stageStat,defenderSpreadForBulk:()=>({}),weatherDefenseMod:()=>1,calcRealHP:()=>target.maxhp,abilityDamageImmunity:()=>'',disguiseProtects:()=>false,leadData:()=>[{},{}],terrainDamageMod:(an,type,dn,move)=>terrain?(type==='くさ'?1.3:move==='じしん'?.5:1):1,damageStabMod:(s,i,n,en,type)=>type==='くさ'?1.5:1,screenDamageMod:()=>screen?2/3:1,weatherMod:(type)=>weather==='雨'?(type==='みず'?1.5:type==='ほのお'?.5:1):weather==='晴れ'?(type==='ほのお'?1.5:type==='みず'?.5:1):1,koSurvivalAssessment:()=>({blocks:false,uncertain:[]}),criticalProfileForDamage:()=>null,abilityBypassed:()=>false,abilityOf:()=>'',confirmedFocusSash:()=>false};
ctx.activeEntryByName=()=>({idx:0,name:'A',d:state.opp[0]});vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('function itemDamageMod('),html.indexOf('// Field-damage grounding')),ctx);
vm.runInContext(html.slice(html.indexOf('function battlePokeRound('),html.indexOf('// v1.77.4:')),ctx);
vm.runInContext(html.slice(html.indexOf('function damageEstimate('),html.indexOf('// v1.77.5:')),ctx);
vm.runInContext(html.slice(html.indexOf('function opponentDamageEstimateAgainstMy('),html.indexOf('function roughOpponentAttackLethalChance(')),ctx);
let cases=0,scenarios=0;const failures=[];
try{
 for(const [name,mv]of Object.entries(moves))for(const w of ['なし','雨','晴れ'])for(const grass of [false,true])for(const reflect of [false,true])for(const burned of [false,true])for(const [held,id]of Object.entries(itemIds))for(const guts of [false,true])for(const attackStage of [-1,0,2])for(const defenseStage of [-1,0,2]){
  battle.sendUpdates();weather=w;terrain=grass;screen=reflect;item=held;ability=guts?'こんじょう':'';activeMove=mv;
  source.ability=guts?'guts':'runaway';source.setItem(id);source.status=burned?'brn':'';source.boosts.atk=source.boosts.spa=attackStage;target.boosts.def=target.boosts.spd=defenseStage;
  battle.field.clearWeather();if(w!=='なし')battle.field.setWeather(w==='雨'?'raindance':'sunnyday',source);battle.field.clearTerrain();if(grass)battle.field.setTerrain('grassyterrain',source);
  target.side.removeSideCondition('reflect');target.side.removeSideCondition('lightscreen');if(reflect)target.side.addSideCondition(mv.cat==='phys'?'reflect':'lightscreen',target);
  Object.assign(state.my[0],{atkStage:attackStage,spaStage:attackStage,defStage:defenseStage,spdStage:defenseStage,status:burned?'やけど':'なし'});Object.assign(state.opp[0],{...state.my[0],item:held,itemConfirmed:true});ctx.savedMyProfiles[0].item=held;
  const outgoing=ctx.damageEstimate('A',name,'B',0,'neutral',0),incoming=ctx.opponentDamageEstimateAgainstMy({kind:'attack',actor:'A',move:name},{idx:0,name:'B',d:state.my[0]});
  for(let roll=85;roll<=100;roll++){
   battle.randomizer=n=>Math.floor(n*roll/100);const move=battle.dex.getActiveMove(mv.id);move.willCrit=false;move.spreadHit=!!mv.spread;
   const expected=battle.actions.getDamage(source,target,move,true);
   for(const [path,actual]of [['outgoing',outgoing.rolls[roll-85]],['incoming',incoming.rolls[roll-85]]]){if(actual!==expected&&failures.length<30)failures.push({path,name,w,grass,reflect,burned,held,guts,attackStage,defenseStage,roll,expected,actual});cases++;}
  }scenarios++;
 }
}finally{battle.destroy();}
fs.writeFileSync('TOURNAMENT_DAMAGE_DIFFERENTIAL_RESULTS.json',JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',scenarios,cases,failures,scope:'Rillaboom to Eevee fixed raw stats, four moves, rain/sun/grass, spread, screens, burn, Guts, Choice Band/Specs, type items/Life Orb and rank combinations; actual outgoing/incoming paths. No official base stats, all abilities or full-match parity.'},null,2)+'\n');assert.equal(failures.length,0,JSON.stringify(failures.slice(0,5)));console.log(`PASS ${cases} real damage comparisons in ${scenarios} common-modifier scenarios`);
