// Independent, pinned Gen9 oracle. Only numeric Champions metadata is overridden.
const fs=require('fs'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const ref=JSON.parse(fs.readFileSync('reference-data/stats-moves/showdown-normalized.json'));
const rows=JSON.parse(fs.readFileSync(0,'utf8'));let damageComparisons=0,accuracyComparisons=0,totalDistributionComparisons=0,conditionComparisons=0,failures=[];const byMove={};
for(const row of rows){const b=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});try{
 b.setPlayer('p1',{team:[{species:row.sourceId,ability:'Run Away',level:50,item:row.item,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']}]});b.setPlayer('p2',{team:[{species:row.targetId,ability:'Run Away',level:50,item:row.targetItem,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']}]});b.makeChoices('team 12','team 12');
 const a=b.p1.active[0],d=b.p2.active[0];a.types=row.aTypes;d.types=row.dTypes;a.storedStats={...row.aStats};d.storedStats={...row.dStats};a.maxhp=a.baseMaxhp=a.hp=row.aHp;d.maxhp=d.baseMaxhp=d.hp=row.dHp;a.boosts={...a.boosts,...row.aBoosts};d.boosts={...d.boosts,...row.dBoosts};a.status=row.burn?'brn':'';d.status=row.status||'';if(row.comatose)d.ability='comatose';
 if(row.singleTarget){b.p1.active[1].fainted=true;b.p2.active[1].fainted=true;}
 if(row.weather)b.field.setWeather(row.weather,a);if(row.terrain)b.field.setTerrain(row.terrain,a);if(row.screen)b.p2.addSideCondition(row.screen,d);
 const meta=ref.moves[row.move].champions,entry=byMove[row.name]??={cases:0,damageComparisons:0,accuracyComparisons:0,totalDistributionComparisons:0,failures:0};entry.cases++;
 const fail=(role,expected,actual)=>{entry.failures++;if(failures.length<100)failures.push({id:row.id,role,expected,actual});};
 const active=()=>{const m=b.dex.getActiveMove(row.move);m.basePower=meta.power;m.accuracy=meta.alwaysHit?true:meta.accuracy*100;m.spreadHit=false;m.willCrit=false;b.setActiveMove(m,a,d);return m;};
 // onTry is essential: getDamage alone does not validate Steel Roller/Poltergeist.
 const valid=b.singleEvent('Try',active(),null,a,d,active())!==false;
 conditionComparisons++;
 if(row.unknown){if(row.rolls)fail('unknown should withhold rolls',null,row.rolls);continue;}
 if(valid!==row.valid)fail('move validity',valid,row.valid);
 if(!valid){if(row.rolls)fail('failed move should withhold rolls',null,row.rolls);continue;}
 const expectedRolls=[];
 for(let roll=85;roll<=100;roll++){
  d.getMoveHitData=()=>({crit:false});b.randomizer=n=>Math.floor(n*roll/100);const m=active();
  const expected=!d.runImmunity(m.type)?0:b.actions.getDamage(a,d,m,true);expectedRolls.push(expected);damageComparisons++;entry.damageComparisons++;if(expected!==row.rolls?.[roll-85])fail('damage/'+roll,expected,row.rolls?.[roll-85]);
 }
 for(const ranks of [[0,0],[1,2],[2,1],[-1,-2],[6,-6]]){
  a.boosts.accuracy=ranks[0];d.boosts.evasion=ranks[1];let expected=1;b.randomChance=(n,den)=>{expected=Math.min(1,n/den);return true;};b.actions.hitStepAccuracy([d],a,active());accuracyComparisons++;entry.accuracyComparisons++;const actual=row.accuracy[ranks.join(',')];if(Math.abs(actual-expected)>1e-9)fail('accuracy/'+ranks,expected,actual);
 }
 if(row.totalDistribution){
  const expected=new Map(),actual=new Map();for(const x of expectedRolls)for(const y of expectedRolls){const n=Math.min(row.dHp,x+y);expected.set(n,(expected.get(n)||0)+1/256);}
  for(const x of row.totalDistribution)actual.set(x.damage,(actual.get(x.damage)||0)+x.weight);
  for(const n of new Set([...expected.keys(),...actual.keys()])){totalDistributionComparisons++;entry.totalDistributionComparisons++;if(Math.abs((expected.get(n)||0)-(actual.get(n)||0))>1e-10)fail('two-hit total/'+n,expected.get(n)||0,actual.get(n)||0);}
 }
}finally{b.destroy();}}
process.stdout.write(JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10; pinned upstream Champions numeric metadata only',scenarios:rows.length,damageComparisons,accuracyComparisons,totalDistributionComparisons,conditionComparisons,byMove,failureCount:Object.values(byMove).reduce((n,x)=>n+x.failures,0),failures}));
