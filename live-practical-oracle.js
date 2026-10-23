// Independent local Gen9 oracle. Raw stats are explicit app inputs, not certified species/AP data.
const fs=require('node:fs'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const rows=JSON.parse(fs.readFileSync(0,'utf8'));let comparisons=0,speedComparisons=0,priorityComparisons=0,orderComparisons=0,failureCount=0;const failures=[];
for(const row of rows){
 const b=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});
 try{
  for(const [side,species,ability,item]of [['p1',row.sourceId,row.aa,row.sourceItem],['p2',row.targetId,row.da,row.targetItem]])b.setPlayer(side,{team:[{species,ability,item,level:50,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']}]});
  b.makeChoices('team 12','team 12');const a=b.p1.active[0],d=b.p2.active[0];a.storedStats={...row.aStats};d.storedStats={...row.dStats};a.status=row.burn?'brn':'';a.boosts={...a.boosts,...row.aBoosts};d.boosts={...d.boosts,...row.dBoosts};a.maxhp=a.baseMaxhp=a.hp=row.aHp;d.maxhp=d.baseMaxhp=d.hp=row.dHp;
  b.field.clearWeather();b.field.clearTerrain();if(row.weatherId)b.field.setWeather(row.weatherId,a);if(row.terrainId)b.field.setTerrain(row.terrainId,a);
  for(const side of b.sides){side.removeSideCondition('reflect');side.removeSideCondition('lightscreen');side.removeSideCondition('auroraveil');}
  if(row.sourceTW)b.p1.addSideCondition('tailwind',a);if(row.targetTW)b.p2.addSideCondition('tailwind',d);
  if(row.screen){b.p2.addSideCondition(row.screen==='stacked'?'auroraveil':row.screen,d);if(row.screen==='stacked'){b.p2.addSideCondition('reflect',d);b.p2.addSideCondition('lightscreen',d);}}
  for(const [role,pokemon,actual]of [['source',a,row.aSpeed],['target',d,row.dSpeed]]){const expected=pokemon.getStat('spe');speedComparisons++;if(actual!==expected){failureCount++;if(failures.length<30)failures.push({id:row.id,path:row.path,role,expected,actual});}}
  const priorityMove=b.dex.getActiveMove(row.moveId),priority=b.runEvent('ModifyPriority',a,d,priorityMove,b.singleEvent('ModifyPriority',priorityMove,null,a,d,null,priorityMove.priority));priorityComparisons++;if(priority!==row.priority){failureCount++;if(failures.length<30)failures.push({id:row.id,expected:priority,actual:row.priority,role:'priority'});}
  for(const tr of [false,true]){
   b.field.removePseudoWeather('trickroom');if(tr)b.field.addPseudoWeather('trickroom',a);
   const relation=(ps.Battle.comparePriority||b.comparePriority)({priority,speed:a.getActionSpeed()},{priority:0,speed:d.getActionSpeed()});
   const expected=relation===0?null:relation<0?'source':'target',actual=tr?row.orderTR:row.orderNormal;orderComparisons++;
   if(actual!==expected){failureCount++;if(failures.length<30)failures.push({id:row.id,path:row.path,role:'order',tr,expected,actual});}
  }b.field.removePseudoWeather('trickroom');
  for(let roll=85;roll<=100;roll++){
   b.sendUpdates();d.setItem(row.targetItem);b.randomizer=n=>Math.floor(n*roll/100);const move=b.dex.getActiveMove(row.moveId);b.setActiveMove(move,a,d);b.singleEvent('ModifyType',move,null,a,d,move,move);b.singleEvent('ModifyMove',move,null,a,d,move,move);b.runEvent('ModifyType',a,d,move,move);b.runEvent('ModifyMove',a,d,move,move);move.willCrit=false;move.spreadHit=!!row.spread;
   const expected=b.actions.getDamage(a,d,move,true),actual=row.rolls[roll-85];comparisons++;
   if(actual!==expected){failureCount++;if(failures.length<30)failures.push({id:row.id,path:row.path,roll,expected,actual});}
  }
 }finally{b.destroy();}
}
process.stdout.write(JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',scenarios:rows.length,comparisons,speedComparisons,priorityComparisons,orderComparisons,failureCount,failures,scope:'Actual page outgoing/incoming adapters with explicit raw stats; selected adoption-120 matchups. Not full AP/species data, legality, RNG or complete match certification.'}));
