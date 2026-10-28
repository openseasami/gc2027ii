'use strict';
const {Battle,Dex}=require('../work/showdown/dist/sim');
const K=require('../source/core.cjs');
const F={...Dex.formats.get('gen9doublescustomgame'),id:'viewertest',name:'Viewer test',mod:'champions',gameType:'doubles',ruleset:[],banlist:[],unbanlist:[],restricted:[],customRules:null,debug:true};
function native(source,target,moveId,ctx={},opts={}){
 const s=K.species(source.id),t=K.species(target.id);
 const b=new Battle({format:F,seed:[1,2,3,4]});
 try{
  const aa=(ctx.actives||[]).find(x=>x.active!==false&&x.side===source.side&&x.key!==source.key),da=(ctx.actives||[]).find(x=>x.active!==false&&x.side===target.side&&x.key!==target.key);
  const set=x=>({species:K.species(x.id).name,ability:'No Ability',moves:['tackle'],evs:Object.fromEntries(K.STATS.map((k,i)=>[k,x.points[i]])),nature:x.nature,level:50});
  const dummy={species:'Eevee',ability:'No Ability',moves:['tackle'],level:50};
  b.setPlayer('p1',{team:[set(source),aa?set(aa):dummy]});b.setPlayer('p2',{team:[set(target),da?set(da):dummy]});
  const a=b.p1.active[0],d=b.p2.active[0],map=[[a,source],[d,target],...(aa?[[b.p1.active[1],aa]]:[]),...(da?[[b.p2.active[1],da]]:[])];
  if(ctx.weather&&ctx.weather!=='none')b.field.setWeather({sun:'sunnyday',rain:'raindance',sand:'sandstorm',snow:'snowscape'}[ctx.weather],a);
  if(ctx.terrain&&ctx.terrain!=='none')b.field.setTerrain({electric:'electricterrain',psychic:'psychicterrain',grassy:'grassyterrain',misty:'mistyterrain'}[ctx.terrain],a);
  for(const [p,x]of map){p.ability=K.C.toID(x.ability);p.abilityState={...p.abilityState,id:p.ability};p.item=K.C.toID(x.item);p.itemState={...p.itemState,id:p.item};p.status=x.burn?'brn':'';p.statusState={...p.statusState,id:p.status};p.hp=p.maxhp;
   if(K.FULL_HP.has(x.ability)&&!x.fullHpCondition)p.hp--;
   if(K.LOW_HP.has(x.ability)&&x.lowHpCondition)p.hp=Math.max(1,Math.floor(p.maxhp/3));
   if(x.ability==='Flash Fire'&&x.abilityOn)p.addVolatile('flashfire');
   if(x.ability==='Electromorphosis'&&x.abilityOn)p.addVolatile('charge');
  }
  const initial=map.map(([p,x])=>({p,x,boosts:{atk:x.boosts[0],def:x.boosts[1],spa:x.boosts[2],spd:x.boosts[3],spe:0,accuracy:0,evasion:0},hp:p.hp,item:p.item}));
  const rolls=[];
  for(let roll=85;roll<=100;roll++){
   for(const r of initial){r.p.boosts={...r.boosts};r.p.hp=r.hp;r.p.item=r.item;}
   b.randomizer=n=>Math.floor(n*roll/100);
   const move=b.dex.getActiveMove(moveId);if(opts.hit)move.hit=opts.hit;move.willCrit=!!opts.crit||!!move.willCrit;move.accuracy=true;move.spreadHit=['allAdjacent','allAdjacentFoes'].includes(move.target);
   if(opts.power){move.basePower=opts.power;move.basePowerCallback=undefined;}
   b.setActiveMove(move,a,d);
   b.singleEvent('ModifyType',move,null,a,d,move,move);b.singleEvent('ModifyMove',move,null,a,d,move,move);b.runEvent('ModifyType',a,d,move,move);b.runEvent('ModifyMove',a,d,move,move);
   move.spreadHit=['allAdjacent','allAdjacentFoes'].includes(move.target);
   const attempt=b.singleEvent('Try',move,null,a,d,move);const single=attempt===false||attempt===null?attempt:b.singleEvent('TryHit',move,null,d,a,move);const tryHit=single===false||single===null?single:b.runEvent('TryHit',d,a,move);const out=tryHit===false||tryHit===null?0:b.actions.getDamage(a,d,move,true);rolls.push(typeof out==='number'?out:0);
  }
  return {rolls,aStats:{...a.storedStats,hp:a.maxhp},dStats:{...d.storedStats,hp:d.maxhp},speed:a.getStat('spe')};
 }finally{b.destroy();}
}
module.exports={native};
