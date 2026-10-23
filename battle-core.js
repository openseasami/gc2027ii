/* GC2027II shared deterministic battle-math kernel, v2.5.4.
   This module is intentionally isolated from DOM and mutable battle state.
   The app retains its existing modifiers and calls these functions at the final calculation step. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root)root.BattleCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const positive=v=>Number.isFinite(Number(v)) && Number(v)>0;
  function pokeRound(value,multiplier){
    if(!Number.isFinite(value)||!Number.isFinite(multiplier)||multiplier<0)throw Error('Invalid modifier');
    const scaled=Math.round(multiplier*4096);
    return Math.floor((value*scaled+2047)/4096);
  }
  function stageStat(value,stage){
    if(!positive(value))throw Error('Invalid stat');
    const s=Math.max(-6,Math.min(6,Math.trunc(Number(stage)||0)));
    return s>=0?Math.floor(value*(2+s)/2):Math.floor(value*2/(2-s));
  }
  // Modifiers chain in 12-bit fixed point; chain ties round up, application ties down.
  function chainModifiers(values){
    return values.reduce((acc,m)=>Math.floor((acc*Math.round(m*4096)+2048)/4096),4096)/4096;
  }
  function baseDamage(power,attack,defense,spreadActive,weatherFactor,terrainFactor){
    if(!positive(power)||!positive(attack)||!positive(defense))throw Error('Invalid damage stats');
    if(!Number.isFinite(weatherFactor)||!Number.isFinite(terrainFactor)||weatherFactor<0||terrainFactor<0)throw Error('Invalid field modifier');
    const bp=Math.max(1,pokeRound(power,terrainFactor));
    let base=Math.floor(Math.floor(Math.floor((22*bp*attack)/Math.max(1,defense))/50)+2);
    if(spreadActive)base=pokeRound(base,.75);
    return pokeRound(base,weatherFactor);
  }
  function damageRoll(base,randomPercent,ability,stab,effectiveness,item,screen,otherFinal=1,burn=1,sniper=1,berry=1){
    if(base<=0||effectiveness<=0||screen<=0)return 0;
    const mods=[ability,stab,effectiveness,item,screen,otherFinal,burn,sniper,berry];
    if(mods.some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid damage modifier');
    let damage=Math.floor(base*randomPercent/100);
    damage=pokeRound(damage,ability);
    damage=pokeRound(damage,stab);
    damage=Math.floor(damage*effectiveness);
    damage=pokeRound(damage,burn);
    const screenFixed=screen===2/3?2732/4096:screen;
    const itemFixed=item===1.3?5324/4096:item;
    damage=pokeRound(damage,chainModifiers([screenFixed,otherFinal,sniper,itemFixed,berry]));
    return Math.max(1,damage);
  }
  const RESIST_BERRY_TYPES=Object.freeze({
    'ホズのみ':'ノーマル','オッカのみ':'ほのお','イトケのみ':'みず','ソクノのみ':'でんき',
    'リンドのみ':'くさ','ヤチェのみ':'こおり','ヨプのみ':'かくとう','ビアーのみ':'どく',
    'シュカのみ':'じめん','バコウのみ':'ひこう','ウタンのみ':'エスパー','タンガのみ':'むし',
    'ヨロギのみ':'いわ','カシブのみ':'ゴースト','ハバンのみ':'ドラゴン','ナモのみ':'あく',
    'リリバのみ':'はがね','ロゼルのみ':'フェアリー'
  });
  // Registered resistance berries; Chilan also applies to neutral/resisted Normal hits.
  // Unknown inputs never become a protection fact.
  function resistBerry({item,type,effectiveness,substitute=false,bypassSubstitute=false,blocked=false,ripen=false}={}){
    if(!RESIST_BERRY_TYPES[item]||RESIST_BERRY_TYPES[item]!==type||!(effectiveness>0)||(item!=='ホズのみ'&&!(effectiveness>1))||blocked||substitute&&!bypassSubstitute)return {factor:1,consume:false};
    return {factor:ripen?.25:.5,consume:true};
  }
  // Poison Touch: conditional risk only, never auto-confirms a status effect.
  // Unknown contact/protection must stay unknown rather than a fabricated 0%.
  function poisonTouchRisk({contact,damaging,substitute,immune,alreadyStatus}={}){
    const required=[contact,damaging,substitute,immune,alreadyStatus];
    if(required.some(x=>typeof x!=='boolean'))return null;
    if(!contact||!damaging||substitute||immune||alreadyStatus)return 0;
    return 0.30;
  }
  // Contact-triggered status families: return an estimated *risk*, not a confirmed event.
  // The caller must supply known hit/contact and status eligibility. Null means unknown.
  const CONTACT_STATUS = Object.freeze({'せいでんき':'まひ','ほのおのからだ':'やけど','どくのトゲ':'どく','どくしゅ':'どく'});
  function contactStatusRisk({ability,contact,damaging,substitute,immune,alreadyStatus,hits=1}={}){
    if(!Object.prototype.hasOwnProperty.call(CONTACT_STATUS,ability))return 0;
    if([contact,damaging,substitute,immune,alreadyStatus].some(x=>typeof x!=='boolean'))return null;
    if(!Number.isInteger(hits)||hits<0)return null;
    if(!contact||!damaging||substitute||immune||alreadyStatus||hits===0)return 0;
    return 1-Math.pow(0.7,hits);
  }
  function contactStatusType(ability){return CONTACT_STATUS[ability]||null;}
  // Common type-only status immunity used by all contact-status families.
  // Other immunities (abilities, terrain, safeguard, items) must be checked by
  // the caller. Unknown type information is deliberately not treated as safe.
  function statusTypeImmune(status,types){
    if(!Array.isArray(types)||!types.length)return null;
    if(types.some(t=>typeof t!=='string'||!t))return null;
    if(status==='どく')return types.includes('どく')||types.includes('はがね');
    if(status==='やけど')return types.includes('ほのお');
    if(status==='まひ')return types.includes('でんき');
    return null;
  }
  // Shared contact status assessment. Unknown type/status information stays unknown.
  // The game UI must still separately establish contact, hit and substitute outcomes.
  function assessedContactStatusRisk({ability,contact,damaging,substitute,types,status,hits=1}={}){
    const effect=contactStatusType(ability);
    if(!effect)return 0;
    if(typeof status!=='string'||!status)return null;
    if(status!=='なし')return 0;
    const immune=statusTypeImmune(effect,types);
    if(immune===null)return null;
    return contactStatusRisk({ability,contact,damaging,substitute,immune,alreadyStatus:false,hits});
  }
  // Unburden is active only after losing a held item in the current field stay.
  // The activation history cannot be inferred from currently having no item.
  // Null represents unknown history; do not invent a speed tier.
  function unburdenSpeed(baseSpeed,{abilityActive,itemHeld,itemLostThisStay}={}){
    if(!Number.isFinite(baseSpeed)||baseSpeed<1)throw Error('Invalid speed');
    if([abilityActive,itemHeld,itemLostThisStay].some(v=>typeof v!=='boolean'))return null;
    return Math.floor(baseSpeed*(abilityActive&&!itemHeld&&itemLostThisStay?2:1));
  }
  // Entry weather duration is shared by all weather-setting abilities.
  // An unknown item means unknown duration, not an assumed five turns.
  const WEATHER_ROCKS=Object.freeze({'晴れ':'あついいわ','雨':'しめったいわ','砂':'さらさらいわ','雪':'つめたいいわ'});
  function weatherEntryTurns(weather,item){
    if(typeof weather!=='string'||!(weather in WEATHER_ROCKS))return null;
    if(typeof item!=='string')return null;
    return item===WEATHER_ROCKS[weather]?8:5;
  }
  // Shared countdown for weather, terrain, Tailwind and Trick Room.
  // Null is retained rather than coercing an unobserved turn to zero.
  function fieldTurnsAfterTurn(turns){
    if(!Number.isInteger(turns)||turns<0)return null;
    return Math.max(0,turns-1);
  }
  // One status, with an unknown effect, must not be silently treated as false.
  function usageEligible(rate,kind){
    if(typeof rate!=='number'||!Number.isFinite(rate)||rate<0||rate>100)return null;
    if(kind==='ability')return rate>7;
    if(kind==='move')return rate>=10;
    throw Error('Unknown usage category');
  }
  return Object.freeze({pokeRound,chainModifiers,RESIST_BERRY_TYPES,resistBerry,stageStat,baseDamage,damageRoll,poisonTouchRisk,contactStatusRisk,contactStatusType,statusTypeImmune,assessedContactStatusRisk,unburdenSpeed,usageEligible,weatherEntryTurns,fieldTurnsAfterTurn,version:'2.5.4'});
});
