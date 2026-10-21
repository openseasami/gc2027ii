/* Turn order uncertainty analyser. Ordering is not asserted when a random effect is possible. */
(function(root){'use strict';
const RANDOM_FIRST_ITEMS=new Set(['せんせいのツメ']);
const LATE_ITEMS=new Set(['こうこうのしっぽ','まんぷくおこう']);
function analyse(actors, trickRoom=false){
 const entries=actors.map((x,i)=>({...x,id:x.id??i}));
 const warnings=[];const pairs=[];
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  const a=entries[i],b=entries[j];
  if(!Number.isFinite(a.priority)||!Number.isFinite(b.priority)){
   pairs.push({a:a.id,b:b.id,order:'unknown',reason:'技の優先度が未入力'});continue;
  }
  if(a.priority!==b.priority){pairs.push({a:a.id,b:b.id,order:a.priority>b.priority?'a-first':'b-first',reason:'優先度差'});continue;}
  const aLate=LATE_ITEMS.has(a.item)||a.ability==='あとだし',bLate=LATE_ITEMS.has(b.item)||b.ability==='あとだし';
  if(aLate!==bLate){pairs.push({a:a.id,b:b.id,order:aLate?'b-first':'a-first',reason:'後攻効果'});continue;}
  if(!Number.isFinite(a.speed)||!Number.isFinite(b.speed)){pairs.push({a:a.id,b:b.id,order:'unknown',reason:'素早さ不明'});continue;}
  if(a.speed===b.speed){pairs.push({a:a.id,b:b.id,order:'tie',reason:'同速'});continue;}
  const aFirst=trickRoom?a.speed<b.speed:a.speed>b.speed;
  const slower=aFirst?b:a;
  if(RANDOM_FIRST_ITEMS.has(slower.item)||(slower.ability==='クイックドロウ'&&slower.category!=='status')){
   const reason=slower.item==='せんせいのツメ'?'せんせいのツメ（20%で順序変化の可能性）':'クイックドロウ（発動による順序変化の可能性）';
   pairs.push({a:a.id,b:b.id,order:'unknown',baseOrder:aFirst?'a-first':'b-first',reason});warnings.push(reason);
  }else pairs.push({a:a.id,b:b.id,order:aFirst?'a-first':'b-first',reason:trickRoom?'トリックルーム':'素早さ'});
 }
 return {pairs,warnings:[...new Set(warnings)],certainty:pairs.every(p=>p.order==='a-first'||p.order==='b-first')};
}
const api={analyse,RANDOM_FIRST_ITEMS,LATE_ITEMS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.TurnOrderEffects=api;
})(typeof globalThis!=='undefined'?globalThis:this);
