const fs=require('node:fs'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const rows=JSON.parse(fs.readFileSync(0,'utf8'));let comparisons=0;const failures=[];
for(const row of rows){const b=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});try{
 b.setPlayer('p1',{team:[{species:row.aid,ability:row.aa,item:row.item,level:50,moves:[row.move]},{species:row.did,ability:row.da,level:50,moves:['splash']}]});
 b.setPlayer('p2',{team:[{species:'Eevee',ability:'Run Away',level:50,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']}]});b.makeChoices('team 12','team 12');
 const a=b.p1.active[0],d=b.p1.active[1];a.storedStats=row.aStats;d.storedStats=row.dStats;a.maxhp=a.baseMaxhp=a.hp=row.aHp;d.maxhp=d.baseMaxhp=d.hp=row.dHp;a.boosts={...a.boosts,...row.aBoosts};d.boosts={...d.boosts,...row.dBoosts};
 b.field.clearWeather();b.field.clearTerrain();if(row.screen)b.p1.addSideCondition(row.screen,d);
 for(let roll=85;roll<=100;roll++){
  b.randomizer=n=>Math.floor(n*roll/100);const m=b.dex.getActiveMove(row.move);b.setActiveMove(m,a,d);m.willCrit=false;m.spreadHit=true;
  const expected=b.actions.getDamage(a,d,m,true);comparisons++;if(expected!==row.rolls[roll-85])failures.push({id:row.id,roll,expected,actual:row.rolls[roll-85]});
 }
}finally{b.destroy();}}
process.stdout.write(JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',cases:rows.length,comparisons,failures,scope:'Same-side direct damage with explicit app raw stats and known profiles; no complete battle oracle.'}));
