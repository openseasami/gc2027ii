/* General Gen 9 scoped critical mechanics. Legality is a separate unresolved gate. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CriticalEffects=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const guaranteed=new Set(['トリックフラワー','あんこくきょうだ','すいりゅうれんだ','こおりのいぶき','やまあらし']);
 const elevated=new Set(['リーフブレード','つじぎり','ストーンエッジ','シャドークロー','サイコカッター','クロスポイズン','からてチョップ','きりさく','エアカッター','ドリルライナー','クラブハンマー','こうげきしれい','エアロブラスト']);
 function profile(move,{attackerAbility=null,defenderAbility=null,item=null,status='',focus=0,bypass=false}={}){
  if(!bypass&&['カブトアーマー','シェルアーマー'].includes(defenderAbility))return {chance:0,known:true,blocked:true,sniper:false};
  const uncertain=attackerAbility===null||defenderAbility===null||item===null;
  const forced=guaranteed.has(move)||attackerAbility==='ひとでなし'&&['どく','もうどく'].includes(status);
  const stage=Math.min(3,(elevated.has(move)?1:0)+(attackerAbility==='きょううん'?1:0)+(['ピントレンズ','するどいツメ'].includes(item)?1:0)+Math.max(0,Math.min(3,Math.trunc(Number(focus)||0))));
  return {chance:uncertain?null:forced?1:[1/24,1/8,1/2,1][stage],known:!uncertain,blocked:false,sniper:attackerAbility==='スナイパー',stage,forced};
 }
 function rank(stage,critical,defending=false){return critical?(defending?Math.min(0,stage):Math.max(0,stage)):stage;}
 function base(base,critical){return critical?Math.floor(base*1.5):base;}
 return Object.freeze({profile,rank,base,guaranteed:Object.freeze([...guaranteed]),elevated:Object.freeze([...elevated])});
});
