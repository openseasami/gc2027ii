const fs=require('fs'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const rows=JSON.parse(fs.readFileSync(0,'utf8'));let damageComparisons=0,totalComparisons=0,probabilityComparisons=0;const failures=[],byMove={};
for(const row of rows){const b=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});try{
 b.setPlayer('p1',{team:[{species:row.sourceId,ability:row.ability,item:row.item,level:50,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']}]});b.setPlayer('p2',{team:[{species:row.targetId,ability:row.targetAbility||'Run Away',item:row.targetItem||'',level:50,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']}]});b.makeChoices('team 12','team 12');
 const a=b.p1.active[0],d=b.p2.active[0];a.storedStats={...row.aStats};d.storedStats={...row.dStats};a.maxhp=a.baseMaxhp=a.hp=row.aHp;d.maxhp=d.baseMaxhp=d.hp=row.dHp;a.boosts={...a.boosts,...row.aBoosts};d.boosts={...d.boosts,...row.dBoosts};a.status=row.burn?'brn':'';a.moveLastTurnResult=row.previous==='failed'?false:row.previous==='success'?true:undefined;
 if(row.screen)b.p2.addSideCondition('reflect',d);
 const entry=byMove[row.name]??={cases:0,damageComparisons:0,totalComparisons:0,probabilityComparisons:0,failures:0};entry.cases++;
 const fail=(role,expected,actual)=>{entry.failures++;if(failures.length<80)failures.push({id:row.id,role,expected,actual});};
 const active=hit=>{const m=b.dex.getActiveMove(row.move);m.hit=hit;m.willCrit=!!row.critical;m.spreadHit=false;b.setActiveMove(m,a,d);b.singleEvent('ModifyMove',m,null,a,d,m,m);b.runEvent('ModifyMove',a,d,m,m);return m;};
 const calc=(hit,roll)=>{d.setItem(row.targetItem||'');b.randomizer=n=>Math.floor(n*roll/100);const m=active(hit);return !d.runImmunity(m.type)?0:b.actions.getDamage(a,d,m,true);};
 const expectedByHit=[];for(let hit=1;hit<=row.strikes.length;hit++){const values=[];for(let roll=85;roll<=100;roll++){const expected=calc(hit,roll);values.push(expected);damageComparisons++;entry.damageComparisons++;if(expected!==row.strikes[hit-1][roll-85])fail('hit/'+hit+'/roll/'+roll,expected,row.strikes[hit-1][roll-85]);}expectedByHit.push(values);}
 if(row.totals){
  // Independent HP-state convolution of PS per-strike rolls. State-sensitive
  // defender scenarios are separately excluded here, never replaced by a fixed power.
  let states=new Map([[`${row.dHp}|${row.dBoosts.def||0}|0`,{hp:row.dHp,stage:row.dBoosts.def||0,consumed:false,weight:1}]]);const cache=new Map();
  for(let hit=1;hit<=expectedByHit.length;hit++){
   const next=new Map();
   for(const st of states.values())for(let roll=85;roll<=100;roll++){
    let hp=st.hp,stage=st.stage,consumed=st.consumed;
    if(hp>0){
     if(row.targetAbility||row.targetItem){
      const key=[hit,hp,stage,consumed,roll].join('/');let cached=cache.get(key);
      if(!cached){b.sendUpdates();d.hp=hp;d.fainted=false;d.faintQueued=false;b.faintQueue=[];d.maxhp=d.baseMaxhp=row.dHp;d.boosts.def=stage;d.setItem(consumed?'':row.targetItem||'');a.hp=a.maxhp=row.aHp;b.randomizer=n=>Math.floor(n*roll/100);const m=active(hit);m.totalDamage=0;b.actions.spreadMoveHit([d],a,m,m);b.eachEvent('Update');cached={hp:d.hp,stage:d.boosts.def,consumed:!!row.targetItem&&!d.item};cache.set(key,cached);}
      ({hp,stage,consumed}=cached);
     }else hp=Math.max(0,hp-expectedByHit[hit-1][roll-85]);
    }
    const key=[hp,stage,Number(consumed)].join('|'),prior=next.get(key);if(prior)prior.weight+=st.weight/16;else next.set(key,{hp,stage,consumed,weight:st.weight/16});
   }
   states=next;const expected=new Map();for(const st of states.values())expected.set(st.hp,(expected.get(st.hp)||0)+st.weight);
   const actual=new Map();for(const x of row.totals[hit-1])actual.set(row.dHp-x.damage,(actual.get(row.dHp-x.damage)||0)+x.weight);
   for(const hp of new Set([...expected.keys(),...actual.keys()])){totalComparisons++;entry.totalComparisons++;if(Math.abs((expected.get(hp)||0)-(actual.get(hp)||0))>1e-9)fail('total/'+hit+'/'+hp,expected.get(hp)||0,actual.get(hp)||0);}
  }
 }
 if(row.hitDistribution){
  // Enumerate the actual engine's first-miss and Loaded Dice branches. Use
  // real spreadMoveHit/getDamage, with large HP to isolate the hit count.
  const expected=new Map(),max=row.strikes.length,dice=row.item==='loadeddice'&&max===10,choices=dice?7:1;
  for(let die=0;die<choices;die++)for(let failAt=0;failAt<=max;failAt++){
   b.sendUpdates();a.hp=a.maxhp=1e8;d.hp=d.maxhp=1e8;d.fainted=false;a.fainted=false;let index=0,weight=1,hits=0;
   b.randomizer=n=>n;b.random=n=>n===7?die:0;
   b.randomChance=(n,den)=>{const probability=Math.min(1,Math.max(0,Math.ceil(n)/den));const success=index++<failAt;weight*=success?probability:1-probability;return success;};
   const original=b.actions.spreadMoveHit;b.actions.spreadMoveHit=function(...args){hits++;return original.apply(this,args);};
   const m=active(1);m.willCrit=false;
   const first=b.actions.hitStepAccuracy([d],a,m)[0];if(first)b.actions.hitStepMoveHitLoop([d],a,m);
   b.actions.spreadMoveHit=original;
   // Only the first terminating failure, or the all-success branch, is unique.
   const endsWithFailure=index===failAt+1;const allSuccess=index===failAt;
   if(endsWithFailure||allSuccess)expected.set(hits,(expected.get(hits)||0)+weight/choices);
  }
  for(let n=0;n<=max;n++){probabilityComparisons++;entry.probabilityComparisons++;const ex=expected.get(n)||0,ac=row.hitDistribution[n]||0;if(Math.abs(ex-ac)>1e-9)fail('hit-count/'+n,ex,ac);}
 }
}finally{b.destroy();}}
process.stdout.write(JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10 Gen9 actual callbacks, getDamage, hitStepAccuracy and hitStepMoveHitLoop',scenarios:rows.length,damageComparisons,totalComparisons,probabilityComparisons,byMove,failureCount:Object.values(byMove).reduce((n,x)=>n+x.failures,0),failures}));
