const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),rank=require('./rank-effects.js');
function section(a,b){return html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));}
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const state={my:[{hp:100,ability:'',abilityConfirmed:true},{hp:100,ability:'',abilityConfirmed:true}],opp:[{hp:100,ability:'',abilityConfirmed:true}],myTeam:['grass','ally'],oppTeam:['foe'],myActive:[0,1],oppActive:[0]};
let weather='なし',terrain='なし';const ctx={state,BATTLE_DATA:{grass:{types:['くさ']},ally:{types:['フェアリー']},foe:{types:['ノーマル']}},effectiveBattleName:(s,i,n)=>n,knownBattleAbility:(s,i)=>state[s][i].abilityConfirmed?state[s][i].ability:'',ensureBattleEntry:(s,i)=>state[s][i],$:(id)=>({value:id==='terrain'?terrain:weather}),isGroundedPokemon:()=>true,effectiveWeatherForDamage:()=>weather,activeKnownAbilityEntries:()=>['my','opp'].flatMap(s=>state[s+'Active'].filter(i=>state[s][i].hp>0&&!state[s][i].pendingPostTurnEntry&&state[s][i].abilityConfirmed).map(i=>({side:s,idx:i,ability:state[s][i].ability}))),POKEMON_WEIGHT_KG:{test:100},abilityBypassed:()=>false};
vm.createContext(ctx);vm.runInContext(section('function confirmedAllyAbilityProtection(','function applyObservedMoveEffects(')+section('function weightBasedMovePower(','function selectedIndicesForDamage(')+section('const COMMON_STATUS_SECONDARIES=','function planCommonSecondaryForecast('),ctx);
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});battle.setPlayer('p1',{team:[{species:'Eevee',moves:['yawn'],ability:'Run Away'},{species:'Eevee',moves:['splash'],ability:'Run Away'}]});battle.setPlayer('p2',{team:[{species:'Serperior',moves:['splash'],ability:'Overgrow'},{species:'Florges',moves:['splash'],ability:'Flower Veil'}]});battle.makeChoices('team 12','team 12');
let weightCases=0,rankCases=0,statusCases=0;
try{
 const target=battle.p2.active[0],source=battle.p1.active[0],ally=battle.p2.active[1];
 for(const [jp,id] of [['','overgrow'],['ヘヴィメタル','heavymetal'],['ライトメタル','lightmetal']])for(const hg of [1,99,100,199,200,249,250,499,500,999,1000,1999,2000,4000]){
  target.ability=id;target.weighthg=hg;ctx.POKEMON_WEIGHT_KG.test=hg/10;state.my[0].ability=jp;
  const actual=ctx.weightBasedMovePower('test','my',0);assert.equal(actual.weight,target.getWeight()/10);const w=target.getWeight()/10;assert.equal(actual.power,w<10?20:w<25?40:w<50?60:w<100?80:w<200?100:120);weightCases++;
 }
 target.weighthg=630;target.ability='contrary';ally.ability='flowerveil';state.my[0].ability='';
 for(const origin of ['self','ally','opponent'])for(const ability of ['','あまのじゃく','たんじゅん'])for(const delta of [{atkStage:-1},{atkStage:-1,spaStage:1},{atkStage:2}]){
  for(const p of [target,source,ally])for(const stat of ['atk','spa'])p.boosts[stat]=0;
  target.ability={'':'overgrow','あまのじゃく':'contrary','たんじゅん':'simple'}[ability];
  const src=origin==='self'?target:origin==='ally'?ally:source;
  battle.boost(Object.fromEntries(Object.entries(delta).map(([k,v])=>[k==='atkStage'?'atk':'spa',v])),target,src,battle.dex.moves.get('growl'));
  const result=rank.resolve({stages:{},changes:delta,ability,origin,flowerVeil:true});const out={};rank.apply(result,out);
  assert.equal(out.atkStage||0,target.boosts.atk,JSON.stringify({origin,ability,delta}));assert.equal(out.spaStage||0,target.boosts.spa);rankCases++;
 }
 // Real Yawn volatile event, with the target protected by individual/ally sleep immunity.
 for(const [jp,id] of [['','overgrow'],['ふみん','insomnia'],['やるき','vitalspirit'],['スイートベール','sweetveil'],['フラワーベール','flowerveil']]){
  target.ability=id;ally.ability='runaway';target.removeVolatile('yawn');target.status='';
  const allowed=target.addVolatile('yawn',source,battle.dex.moves.get('yawn'));
  state.my[0].ability=jp;state.my[0].yawnTurns=null;state.my[0].status='なし';state.my[1].ability='';
  const actual=ctx.applyConfirmedYawn('opp',0,{move:'あくび',targetIdx:0,sleepAllowed:true,hitConfirmed:true});assert.equal(actual,!!allowed,jp);statusCases++;
 }

 for(const [jpType,enType]of [['どく','Poison'],['はがね','Steel']])for(const [jpAbility,id]of [['','runaway'],['ふしょく','corrosion']]){
  target.setType(enType);target.ability='runaway';target.status='';source.ability=id;
  const allowed=target.trySetStatus('psn',source,battle.dex.moves.get('sludgebomb'));
  const chance=ctx.forecastCommonSecondaryStatus('ヘドロばくだん',1,'',[jpType],'','',false,jpAbility).probability;
  assert.equal(chance>0,!!allowed);statusCases++;
 }
}finally{battle.destroy();}
// Protection gained after drowsiness: Flower Veil does not block Yawn's eventual sleep.
state.my[0].ability='';state.my[1].ability='';state.my[0].yawnTurns=1;state.my[1].ability='フラワーベール';ctx.advanceConfirmedYawn();assert.equal(state.my[0].status,'ねむり');
for(const ability of ['ふみん','やるき','スイートベール']){state.my[0].ability='';state.my[0].status='なし';state.my[0].yawnTurns=1;state.my[1].ability='';state.my[0].ability=ability;ctx.advanceConfirmedYawn();assert.equal(state.my[0].status,'なし');}
state.my[0].ability='';state.my[1].ability='スイートベール';assert(ctx.confirmedSleepProtection('my',0,true));state.my[1].hp=0;assert(!ctx.confirmedSleepProtection('my',0,true));state.my[1].hp=100;state.my[1].abilityConfirmed=false;assert(!ctx.confirmedSleepProtection('my',0,true));
for(const types of [['どく'],['はがね']]){assert.equal(ctx.forecastCommonSecondaryStatus('ヘドロばくだん',1,'',types,'','',false,'ふしょく').probability,.3);assert.equal(ctx.forecastCommonSecondaryStatus('ヘドロばくだん',1,'',types,'','',false,'').probability,0);}
assert.equal(ctx.forecastCommonSecondaryStatus('かえんほうしゃ',1,'',['くさ'],'','',false,'',{flowerVeil:true}).probability,0);
assert.equal(ctx.forecastCommonSecondaryStatus('かえんほうしゃ',1,'',['くさ'],'','',true,'',{flowerVeil:true}).probability,.1);
fs.writeFileSync(__dirname+'/PROTECTION_WEIGHT_DIFFERENTIAL_RESULTS.json',JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',weightCases,rankCases,statusCases,failures:[],scope:'Weight events, Flower Veil rank and initial Yawn volatile only; not full damage or Champions rules'},null,2)+'\n');console.log(`PASS ${weightCases} weight, ${rankCases} Flower Veil rank, ${statusCases} Yawn real engine cases and temporal/unknown/KO guards`);
