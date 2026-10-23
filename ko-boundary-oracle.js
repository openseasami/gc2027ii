// Independent PS stat construction, integer damage rolls and KO event boundaries.
// AP -> EV is a per-stat numeric equivalence at Lv50/IV31, not official AP rules.
const fs=require('node:fs');
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const ref=JSON.parse(fs.readFileSync('reference-data/stats-moves/showdown-normalized.json'));
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const keys=['hp','atk','def','spa','spd','spe'];
const ev=ap=>ap===0?0:8*ap-4;
const spread=(b,base,profile)=>{
 const set={level:50,nature:profile.nature,ivs:Object.fromEntries(keys.map(k=>[k,31])),evs:Object.fromEntries(keys.map(k=>[k,ev(profile[k]||0)]))};
 const stats=b.spreadModify(base,set);if(base.hp===1)stats.hp=1;return stats;
};
const out={completion:false,passed:false,oracle:'pokemon-showdown@0.11.10, spreadModify/natureModify/getDamage/HitStepAccuracy/Damage events',
 statComparisons:0,damageScenarios:input.damageRows.length,damageComparisons:0,hpBoundaryCases:0,koComparisons:0,accuracyComparisons:0,
 certainOnHitCases:0,randomOnHitCases:0,oneOfSixteenCases:0,fifteenOfSixteenCases:0,fullHpSurvivalCases:0,
 failureCount:0,failures:[],failureByRole:{},failureByActor:{},boundaryExamples:[],actors:{},types:{},items:{},weathers:{},screens:{},paths:{},spreadTargets:{},modes:{}};
function fail(row,role,expected,actual,extra={}){out.failureCount++;out.failureByRole[role]=(out.failureByRole[role]||0)+1;out.failureByActor[row.actor||row.name]=(out.failureByActor[row.actor||row.name]||0)+1;if(out.failures.length<50)out.failures.push({id:row.id||row.name,role,expected,actual,...extra});}
const sb=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});
try{
 for(const row of input.statRows){
  const base=ref.species[row.speciesId].stats;
  for(let ni=0;ni<input.natures.length;ni++)for(let ap=0;ap<=32;ap++){
   const profile={nature:input.natures[ni][1],...Object.fromEntries(keys.map(k=>[k,ap]))};
   const expected=spread(sb,base,profile);
   for(let ki=0;ki<keys.length;ki++){
    out.statComparisons++;const actual=row.values[ni][ap][ki];
    if(actual!==expected[keys[ki]])fail(row,'stat',expected[keys[ki]],actual,{ap,nature:profile.nature,stat:keys[ki]});
   }
  }
 }
}finally{sb.destroy();}
for(const row of input.damageRows){
 const b=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});
 try{
  for(const[side,id,ability,item,profile]of [['p1',row.sourceId,'Run Away',row.item,row.aProfile],['p2',row.targetId,row.sturdy?'Sturdy':'Run Away',row.targetItem,row.dProfile]]){
   if(!ps.Dex.species.get(id).exists)throw Error('No independent runtime species '+id);
   b.setPlayer(side,{team:[{species:id,ability,item,nature:profile.nature,level:50,ivs:Object.fromEntries(keys.map(k=>[k,31])),evs:Object.fromEntries(keys.map(k=>[k,ev(profile[k]||0)])),moves:['splash']},{species:'Eevee',ability:'Run Away',moves:['splash']}]});
  }
  b.makeChoices('team 12','team 12');const a=b.p1.active[0],d=b.p2.active[0];
  // Construct stats from independently acquired species bases, never app stats.
  const astats=spread(b,ref.species[row.sourceId].stats,row.aProfile),dstats=spread(b,ref.species[row.targetId].stats,row.dProfile);
  // The app explicitly assumes neutral/uninvested unknown enemy Attack for
  // outgoing Foul Play, independently of its selected defensive bulk preset.
  if(row.move==='foulplay'&&row.path==='outgoing')dstats.atk=spread(b,ref.species[row.targetId].stats,{nature:'Serious'}).atk;
  for(const[k,pokemon,stats]of [['a',a,astats],['d',d,dstats]]){
   for(const key of keys){out.statComparisons++;if(row[k+'Stats'][key]!==stats[key])fail(row,'damage-input-stat',stats[key],row[k+'Stats'][key],{key,side:k});}
   pokemon.storedStats=Object.fromEntries(keys.filter(k=>k!=='hp').map(k=>[k,stats[k]]));pokemon.maxhp=pokemon.baseMaxhp=pokemon.hp=stats.hp;
  }
  a.boosts={...a.boosts,...row.aBoosts};d.boosts={...d.boosts,...row.dBoosts};
  b.field.clearWeather();b.field.clearTerrain();if(row.weather)b.field.setWeather(row.weather,a);
  for(const screen of row.screens)b.p2.addSideCondition(screen,d);
  const meta=ref.moves[row.move].champions;
  function prepare(){
   const move=b.dex.getActiveMove(row.move);move.basePower=meta.power;move.accuracy=meta.alwaysHit?true:meta.accuracy*100;move.willCrit=meta.willCrit;
   d.getMoveHitData=()=>({crit:!!meta.willCrit});b.setActiveMove(move,a,d);
   b.singleEvent('ModifyType',move,null,a,d,move,move);b.singleEvent('ModifyMove',move,null,a,d,move,move);
   b.runEvent('ModifyType',a,d,move,move);b.runEvent('ModifyMove',a,d,move,move);move.spreadHit=row.spread;
   return move;
  }
  let hit=1;b.randomChance=(n,den)=>{hit=Math.min(1,n/den);return true};
  b.actions.hitStepAccuracy([d],a,prepare());out.accuracyComparisons++;
  if(Math.abs(hit-row.accuracy)>1e-10)fail(row,'accuracy',hit,row.accuracy);
  const cache=new Map();
  function rollsAt(hp){
   if(cache.has(hp))return cache.get(hp);const raw=[],lethal=[];
   for(let roll=85;roll<=100;roll++){
    b.sendUpdates();d.hp=hp;d.setItem(row.targetItem);b.randomizer=n=>Math.floor(n*roll/100);
    const m=prepare();const damage=d.runImmunity(m.type)?b.actions.getDamage(a,d,m,true):0;raw.push(damage);
    const afterSurvival=hp>0?b.runEvent('Damage',d,a,m,damage):0;
    lethal.push(hp>0&&Number(afterSurvival)>=hp);
   }
   const value={raw,lethal};cache.set(hp,value);return value;
  }
  const full=rollsAt(d.maxhp);
  for(let i=0;i<16;i++){out.damageComparisons++;if(row.rolls[i]!==full.raw[i])fail(row,'full-hp-damage',full.raw[i],row.rolls[i],{roll:i+85});}
  for(const check of row.boundaries){
   const hp=Math.max(0,Math.min(d.maxhp,Math.ceil(d.maxhp*check.percent/100)));
   if(hp===0)continue; // Fainted mons are not legal targets; spread target count also changes.
   const expected=rollsAt(hp),onHit=expected.lethal.filter(Boolean).length/16;
   out.hpBoundaryCases++;out.koComparisons++;
   if(check.currentHp!==hp)fail(row,'current-hp-rounding',hp,check.currentHp);
   for(let i=0;i<16;i++){out.damageComparisons++;if(check.rolls[i]!==expected.raw[i])fail(row,'boundary-damage',expected.raw[i],check.rolls[i],{hp,roll:i+85});}
   if(!Number.isFinite(check.koChance))fail(row,'invalid-ko-probability','finite',check.koChance,{hp});
   if(Math.abs(check.koChance-onHit)>1e-10)fail(row,'on-hit-ko-probability',onHit,check.koChance,{hp});
   if(row.path==='outgoing'){
    const label=check.ko;
    if(hp===0){if(label!=='すでにKO')fail(row,'fainted-label','すでにKO',label);}
    else if(onHit===1){out.certainOnHitCases++;if(label!=='確定1発')fail(row,'certain-ohko-label','確定1発',label,{hp});}
    else if(onHit>0){out.randomOnHitCases++;if(label!=='乱数1発')fail(row,'random-ohko-label','乱数1発',label,{hp});}
    else if(label==='確定1発'||label==='乱数1発')fail(row,'non-ohko-label','not OHKO',label,{hp});
    if(onHit===1/16)out.oneOfSixteenCases++;
    if(onHit===15/16)out.fifteenOfSixteenCases++;
    if(check.prediction){
     const p=check.prediction;out.koComparisons++;
     if(Math.abs(p.conditionalOnHit-onHit)>1e-10||Math.abs(p.koChance-hit*onHit)>1e-10)fail(row,'accuracy-inclusive-ko',{onHit,overall:hit*onHit},p,{hp});
     if(check.insightLabel==='確定1発'&&hit*onHit<1-1e-10)fail(row,'insight-overconfident-label','not certain',check.insightLabel,{hp,hit});
    }
    if(out.boundaryExamples.length<16&&onHit>0&&onHit<1)out.boundaryExamples.push({id:row.id,hp,rolls:expected.raw,onHit,accuracy:hit,overall:hit*onHit,label});
   }
   if(row.targetItem==='focussash'&&hp===d.maxhp&&full.raw.some(x=>x>=hp)&&onHit===0)out.fullHpSurvivalCases++;
  }
  for(const key of ['actors','types','items','weathers','screens','paths','spreadTargets','modes']){
   const value={actors:row.actor,types:String(row.effectiveness),items:row.item||'none',weathers:row.weather||'none',screens:row.screens.join('+')||'none',paths:row.path,spreadTargets:row.spread?'spread':'single',modes:row.mode}[key];out[key][value]=(out[key][value]||0)+1;
  }
 }finally{b.destroy();}
}
out.passed=out.failureCount===0;
out.scope='Controlled no-effect ability matchups isolate AP/nature/items/type/weather/screens/target count; known Sturdy/Sash fixtures included. Existing real-ability 16-matchup suite remains separate. AP equivalent EVs certify arithmetic only, not official AP rules or a standard EV-budget conversion.';
process.stdout.write(JSON.stringify(out));
