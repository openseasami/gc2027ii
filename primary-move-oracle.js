// General Gen9 damage core with independently pinned Champions numeric move metadata.
const fs=require('fs'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const ref=JSON.parse(fs.readFileSync('reference-data/stats-moves/showdown-normalized.json'));const rows=JSON.parse(fs.readFileSync(0,'utf8'));
let comparisons=0,accuracyComparisons=0;const failures=[],byMove={};
for(const row of rows){const b=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});try{
 b.setPlayer('p1',{team:[{species:ps.Dex.species.get(row.sourceId).exists?row.sourceId:'Eevee',ability:'Run Away',item:row.item,level:50,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']}]});b.setPlayer('p2',{team:[{species:row.targetId,ability:'Run Away',level:50,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']}]});b.makeChoices('team 12','team 12');
 const a=b.p1.active[0],d=b.p2.active[0];a.types=row.aTypes;d.types=row.dTypes;a.storedStats={...row.aStats};d.storedStats={...row.dStats};a.maxhp=a.baseMaxhp=a.hp=row.aHp;d.maxhp=d.baseMaxhp=d.hp=row.dHp;a.boosts={...a.boosts,...row.aBoosts};d.boosts={...d.boosts,...row.dBoosts};a.status=row.burn?'brn':'';d.status=row.poison?'psn':'';
 b.field.clearWeather();b.field.clearTerrain();if(row.weather)b.field.setWeather(row.weather,a);if(row.terrain)b.field.setTerrain(row.terrain,a);if(row.screen)b.p2.addSideCondition(row.screen,d);
 byMove[row.name]??={cases:0,comparisons:0,failures:0};byMove[row.name].cases++;
 const meta=ref.moves[row.move].champions;
 for(let roll=85;roll<=100;roll++){
  d.getMoveHitData=()=>({crit:meta.willCrit});b.randomizer=n=>Math.floor(n*roll/100);
  const m=b.dex.getActiveMove(row.move);m.basePower=meta.power;m.accuracy=meta.alwaysHit?true:meta.accuracy*100;m.willCrit=meta.willCrit;
  b.setActiveMove(m,a,d);b.singleEvent('ModifyType',m,null,a,d,m,m);b.singleEvent('ModifyMove',m,null,a,d,m,m);b.runEvent('ModifyType',a,d,m,m);b.runEvent('ModifyMove',a,d,m,m);m.spreadHit=['allAdjacent','allAdjacentFoes'].includes(m.target);
  const expected=!d.runImmunity(m.type)?0:b.actions.getDamage(a,d,m,true);const actual=row.rolls[roll-85];comparisons++;byMove[row.name].comparisons++;
  if(expected!==actual){byMove[row.name].failures++;if(failures.length<100&&!failures.some(x=>x.id===row.id))failures.push({id:row.id,move:row.name,roll,expected,actual});}
 }
 // HitStepAccuracy includes net accuracy/evasion ranks and inherent sure-hit.
 for(const ranks of [[0,0],[1,2],[2,1],[-1,-2],[6,-6]]){
  a.boosts.accuracy=ranks[0];d.boosts.evasion=ranks[1];let expected=1;
  b.randomChance=(n,den)=>{expected=Math.min(1,n/den);return true};const m=b.dex.getActiveMove(row.move);m.accuracy=meta.alwaysHit?true:meta.accuracy*100;
  b.setActiveMove(m,a,d);b.singleEvent('ModifyMove',m,null,a,d,m,m);b.runEvent('ModifyMove',a,d,m,m);b.actions.hitStepAccuracy([d],a,m);accuracyComparisons++;
  const actual=row.accuracy[ranks.join(',')];
  if(Math.abs(expected-actual)>1e-9){byMove[row.name].failures++;if(failures.length<100&&!failures.some(x=>x.id===row.id))failures.push({id:row.id,move:row.name,role:'accuracy',ranks,expected,actual});}
 }
}finally{b.destroy();}}
process.stdout.write(JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10 damage core; pinned upstream Champions numeric metadata overrides',scenarios:rows.length,comparisons,accuracyComparisons,byMove,failureCount:Object.values(byMove).reduce((n,x)=>n+x.failures,0),failures,scope:'Successful single hit, known explicit stats and no effect abilities. Not secondaries, recommendations, full battle or official event certification.'}));
