/* Deterministic, source-aware rank changes. No HP mutation or inferred outcomes. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.RankEffects=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const keys=['atkStage','defStage','spaStage','spdStage','speStage','accStage','evaStage'];
 const clamp=n=>Math.max(-6,Math.min(6,n));
 const blockers={'かいりきバサミ':'atkStage','はとむね':'defStage','するどいめ':'accStage','はっこう':'accStage'};
 const intimidateImmune=new Set(['せいしんりょく','どんかん','きもったま','マイペース']);
 const breakable=new Set(['あまのじゃく','たんじゅん','クリアボディ','しろいけむり','ミラーアーマー','かいりきバサミ','はとむね','するどいめ','はっこう','りんぷん','ばんけん']);
 function resolve(input={}){
  const {stages={},changes={},ability='',item='',origin='opponent',secondary=false,intimidate=false,bypass=false,
   sourceStages=null,sourceAbility='',sourceItem='',allowReflection=true}=input;
  if(!['self','ally','opponent'].includes(origin))throw Error('Unknown rank-change origin');
  for(const [key,value] of Object.entries(changes))if(!keys.includes(key)||!Number.isInteger(value)||Math.abs(value)>12)throw Error('Invalid rank change');
  const events=[],blocked=[],working={...stages},sourceWorking=sourceStages?{...sourceStages}:null;
  const negative=Object.values(changes).some(v=>v<0);
  if(ability===null||(origin!=='self'&&negative&&item===null))return {events,blocked,unknown:true};
  const activeAbility=bypass&&breakable.has(ability)?'':ability;
  if(secondary&&(item==='おんみつマント'||activeAbility==='りんぷん'))return {events,blocked:['secondary-blocked'],unknown:false};
  if(intimidate&&intimidateImmune.has(activeAbility))return {events,blocked:['intimidate-immune'],unknown:false};
  const multiplier=activeAbility==='あまのじゃく'?-1:activeAbility==='たんじゅん'?2:1;
  function applyDelta(delta,reason){
   const actual={};
   for(const [key,value] of Object.entries(delta)){
    const before=working[key]||0,after=clamp(before+value);
    if(after!==before){working[key]=after;actual[key]=after-before;}
   }
   if(Object.keys(actual).length)events.push({recipient:'target',changes:actual,reason});
   return actual;
  }
  const adjusted={};
  for(const [key,value] of Object.entries(changes)){
   const delta=value*multiplier;
   if(delta<0&&origin!=='self'){
    if(intimidate&&key==='atkStage'&&activeAbility==='ばんけん'&&(working[key]||0)>-6){
     applyDelta({atkStage:1},'guard-dog');continue;
    }
    if(input.flowerVeil&&!bypass||item==='クリアチャーム'||['クリアボディ','しろいけむり'].includes(activeAbility)||blockers[activeAbility]===key){blocked.push(key);continue;}
    if(activeAbility==='ミラーアーマー'&&allowReflection&&(working[key]||0)>-6){
     if(sourceStages&&(sourceStages.hp??100)>0){
      const reflected=resolve({stages:sourceWorking,changes:{[key]:clamp((working[key]||0)+delta)-(working[key]||0)},ability:sourceAbility,item:sourceItem,origin,allowReflection:false});
      if(reflected.unknown)return {events:[],blocked:[],unknown:true};
      apply(reflected,sourceWorking);
      for(const event of reflected.events)events.push({...event,recipient:'source',reason:'mirror-armor/'+event.reason});
     }
     blocked.push(key);continue;
    }
   }
   adjusted[key]=delta;
  }
  for(const [key,delta] of Object.entries(adjusted)){
   const actual=applyDelta({[key]:delta},'rank-change');
   if((actual[key]||0)<0&&origin==='opponent'){
    if(activeAbility==='まけんき')applyDelta({atkStage:2},'defiant');
    if(activeAbility==='かちき')applyDelta({spaStage:2},'competitive');
   }
   if(intimidate&&actual.atkStage&&activeAbility==='びびり')applyDelta({speStage:1},'rattled');
  }
  return {events,blocked,unknown:false};
 }
 function apply(result,target,source=null){
  if(result.unknown)return false;
  let changed=false;
  for(const event of result.events){
   const entry=event.recipient==='source'?source:target;if(!entry)continue;
   for(const [key,value] of Object.entries(event.changes)){entry[key]=clamp((entry[key]||0)+value);changed=true;}
  }
  return changed;
 }
 function whiteHerb(stages={}){return Object.fromEntries(keys.filter(k=>(stages[k]||0)<0).map(k=>[k,-stages[k]]));}
 return Object.freeze({resolve,apply,whiteHerb,keys:Object.freeze(keys),version:'1.0.0'});
});
