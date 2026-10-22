const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),core=require('./battle-core.js');
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']})),html=fs.readFileSync('index.html','utf8');
let cases=0;const failures=[];
for(const [item,id,species,moveId,type]of [['ヨプのみ','chopleberry','Eevee','closecombat','かくとう'],['ナモのみ','colburberry','Alakazam','darkpulse','あく']]){
 const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:side==='p1'?'Pikachu':species,level:50,ability:'Run Away',moves:['splash']},{species:'Eevee',ability:'Run Away',moves:['splash']}]});battle.makeChoices('team 12','team 12');const source=battle.p1.active[0],target=battle.p2.active[0];
 try{
  for(const unnerve of [false,true])for(const ripen of [false,true])for(const substitute of [false,true])for(const bypass of [false,true])for(const lifeOrb of [false,true])for(const reflect of [false,true])for(const consumed of [false,true])for(const power of [30,80,120,250]){
   battle.sendUpdates();source.setAbility(unnerve?'Unnerve':'Run Away');target.setAbility(ripen?'Ripen':'Run Away');source.setItem(lifeOrb?'lifeorb':'');delete target.volatiles.substitute;if(substitute)target.addVolatile('substitute');
   target.side.removeSideCondition('reflect');target.side.removeSideCondition('lightscreen');if(reflect)target.side.addSideCondition(item==='ヨプのみ'?'reflect':'lightscreen',target);
   const assessment=core.resistBerry({item:consumed?'':item,type,effectiveness:2,substitute,bypassSubstitute:bypass,blocked:unnerve,ripen});
   const physical=item==='ヨプのみ',atk=source.storedStats[physical?'atk':'spa'],def=target.storedStats[physical?'def':'spd'];const base=core.baseDamage(power,atk,def,false,1,1);
   for(let roll=85;roll<=100;roll++){
    target.setItem(consumed?'':id);battle.randomizer=n=>Math.floor(n*roll/100);const move=battle.dex.getActiveMove(moveId);move.basePower=power;move.willCrit=false;move.flags={...move.flags,bypasssub:bypass};
    const expected=battle.actions.getDamage(source,target,move,true),actual=core.damageRoll(base,roll,1,1,2,lifeOrb?1.3:1,reflect?2/3:1,1,1,1,assessment.factor);
    if(expected!==actual&&failures.length<20)failures.push({item,unnerve,ripen,substitute,bypass,lifeOrb,reflect,consumed,power,roll,expected,actual});
    assert.equal(!target.item,!consumed&&assessment.consume||consumed,'oracle item consumed iff berry applicable');cases++;
   }
  }
 }finally{battle.destroy();}
}
assert.equal(core.resistBerry({item:'ヨプのみ',type:'かくとう',effectiveness:1}).factor,1);
// Real DOM adapters: active item policy, known source abilities, unknown suppression,
// and confirmed consumption are separate from read-only prediction.
let unknown=false,blocked=false,item='ヨプのみ',consumed=false,sub=0,ripen=false;
const entry={hp:100,itemConsumed:false},ctx={BattleCore:core,state:{my:[entry],opp:[{}],myTeam:['A'],oppTeam:['B']},knownHeldItemState:()=>({known:true}),heldItemFor:()=>consumed?'':item,activeKnownAbilityEntries:()=>blocked?[{side:'opp',ability:'きんちょうかん'}]:[],observedSubstituteHp:()=>sub,abilityMoveTraits:()=>({}),confirmedAbilityIs:(s,i,n,ab)=>ab==='じゅくせい'&&ripen,leadData:()=>[{d:{abilityConfirmed:!unknown}}]};vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function defensiveBerryForDamage('),html.indexOf('function criticalProfileForDamage(')),ctx);
const assess=()=>ctx.defensiveBerryForDamage('opp',0,'B','my',0,'A','インファイト','かくとう',2);
assert.equal(assess().factor,.5);assert.equal(entry.itemConsumed,false);unknown=true;assert.equal(assess().factor,1);assert.equal(assess().uncertain,true);assert.equal(ctx.commitConfirmedBerryConsumption('my',0, {berry:assess()}),false);unknown=false;blocked=true;assert.equal(assess().consume,false);blocked=false;sub=30;assert.equal(assess().consume,false);sub=0;ripen=true;assert.equal(assess().factor,.25);ripen=false;assert.equal(ctx.commitConfirmedBerryConsumption('my',0,{berry:assess()}),true);assert.equal(entry.itemConsumed,true);consumed=true;assert.equal(assess().consume,false);
fs.writeFileSync('PRIORITY_BERRY_DIFFERENTIAL_RESULTS.json',JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',cases,failures,scope:'Chople/Colbur only: super-effective hit, active/consumed, Unnerve, Ripen, Substitute/bypass, Life Orb/screens, fixed raw stats and random rolls. Read-only forecast/unknown source gating and confirmed consumption adapter. Other berries and full game interactions unverified.'},null,2)+'\n');assert.equal(failures.length,0,JSON.stringify(failures.slice(0,5)));console.log(`PASS ${cases} prioritized resist berry damage/consumption comparisons and real adapter guards`);
