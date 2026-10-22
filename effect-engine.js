/* Data-driven, deterministic event projection. Does not mutate battle state.
   Unverified conditions remain unknown; a risk never automatically applies status. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./battle-core.js'):root.BattleCore);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.EffectEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(core){
  'use strict';
  const definitions=Object.freeze([
    {id:'static',name:'せいでんき',trigger:'after_contact',side:'defender',kind:'status_risk',status:'まひ',chance:0.3},
    {id:'flame_body',name:'ほのおのからだ',trigger:'after_contact',side:'defender',kind:'status_risk',status:'やけど',chance:0.3},
    {id:'poison_point',name:'どくのトゲ',trigger:'after_contact',side:'defender',kind:'status_risk',status:'どく',chance:0.3},
    {id:'poison_touch',name:'どくしゅ',trigger:'after_contact',side:'attacker',kind:'status_risk',status:'どく',chance:0.3},
    {id:'drought',name:'ひでり',trigger:'on_entry',side:'source',kind:'weather',weather:'晴れ'},
    {id:'drizzle',name:'あめふらし',trigger:'on_entry',side:'source',kind:'weather',weather:'雨'},
    {id:'sand_stream',name:'すなおこし',trigger:'on_entry',side:'source',kind:'weather',weather:'砂'},
    {id:'snow_warning',name:'ゆきふらし',trigger:'on_entry',side:'source',kind:'weather',weather:'雪'},
    {id:'intimidate',name:'いかく',trigger:'on_entry',side:'source',kind:'stat_drop',stat:'atk',stages:-1},
    {id:'grassy_surge',name:'グラスメイカー',trigger:'on_entry',side:'source',kind:'terrain',terrain:'グラス',turns:5},
    {id:'psychic_surge',name:'サイコメイカー',trigger:'on_entry',side:'source',kind:'terrain',terrain:'サイコ',turns:5},
    {id:'electric_surge',name:'エレキメイカー',trigger:'on_entry',side:'source',kind:'terrain',terrain:'エレキ',turns:5},
    {id:'misty_surge',name:'ミストメイカー',trigger:'on_entry',side:'source',kind:'terrain',terrain:'ミスト',turns:5},
    {id:'speed_boost',name:'かそく',trigger:'on_turn_end',side:'source',kind:'stat_boost',stat:'spe',stages:1},
    {id:'justified',name:'せいぎのこころ',trigger:'on_hit',side:'defender',kind:'stat_boost',stat:'atk',stages:1,requiresDamage:true,requiresTypes:['あく']},
    {id:'stamina',name:'じきゅうりょく',trigger:'on_hit',side:'defender',kind:'stat_boost',stat:'def',stages:1,requiresDamage:true},
    {id:'weak_armor',name:'くだけるよろい',trigger:'on_hit',side:'defender',kind:'weak_armor',requiresPhysicalDamage:true,requiresDamage:true},
    {id:'gooey',name:'ぬめぬめ',trigger:'after_contact',side:'defender',kind:'opponent_stat_drop',stat:'spe',stages:-1,requiresContact:true},
    {id:'rattled',name:'びびり',trigger:'on_hit',side:'defender',kind:'stat_boost',stat:'spe',stages:1,requiresDamage:true,requiresTypes:['むし','ゴースト','あく']}

  ].map(d=>Object.freeze(d)));
  // Confirmed move effects use the same data-oriented event projection as abilities.
  // These events are applied only after the user records a successful move.
  const moveDefinitions=Object.freeze([
    {name:'あまごい',kind:'weather',weather:'雨',turns:5},
    {name:'にほんばれ',kind:'weather',weather:'晴れ',turns:5},
    {name:'すなあらし',kind:'weather',weather:'砂',turns:5},
    {name:'ゆきげしき',kind:'weather',weather:'雪',turns:5},
    {name:'グラスフィールド',kind:'terrain',terrain:'グラス',turns:5},
    {name:'サイコフィールド',kind:'terrain',terrain:'サイコ',turns:5},
    {name:'エレキフィールド',kind:'terrain',terrain:'エレキ',turns:5},
    {name:'ミストフィールド',kind:'terrain',terrain:'ミスト',turns:5},
    {name:'おいかぜ',kind:'tailwind',turns:4},
    {name:'トリックルーム',kind:'trick_room',turns:5},
    {name:'リフレクター',kind:'screen',screen:'reflect',turns:5},
    {name:'ひかりのかべ',kind:'screen',screen:'lightScreen',turns:5},
    {name:'くろいきり',kind:'reset_stages',target:'all'},
    {name:'マジックルーム',kind:'magic_room',turns:5},
    {name:'からをやぶる',kind:'multi_boost',stats:{def:-1,spd:-1,atk:2,spa:2,spe:2},target:'self'},
    {name:'インファイト',kind:'multi_boost',stats:{def:-1,spd:-1},target:'self'},
    {name:'ばかぢから',kind:'multi_boost',stats:{atk:-1,def:-1},target:'self'},
    {name:'アームハンマー',kind:'multi_boost',stats:{spe:-1},target:'self'},
    {name:'オーバーヒート',kind:'multi_boost',stats:{spa:-2},target:'self'},
    {name:'りゅうせいぐん',kind:'multi_boost',stats:{spa:-2},target:'self'},
    {name:'リーフストーム',kind:'multi_boost',stats:{spa:-2},target:'self'},
    {name:'ぶちかまし',kind:'multi_boost',stats:{def:-1,spd:-1},target:'self'},
    {name:'アーマーキャノン',kind:'multi_boost',stats:{def:-1,spd:-1},target:'self'},
    {name:'スケイルノイズ',kind:'multi_boost',stats:{def:-1},target:'self'},
    {name:'ゴールドラッシュ',kind:'multi_boost',stats:{spa:-1},target:'self'},

    {name:'つるぎのまい',kind:'stat_boost',stat:'atk',stages:2,target:'self'},
    {name:'わるだくみ',kind:'stat_boost',stat:'spa',stages:2,target:'self'},
    {name:'てっぺき',kind:'stat_boost',stat:'def',stages:2,target:'self'},
    {name:'こうそくいどう',kind:'stat_boost',stat:'spe',stages:2,target:'self'},
    {name:'めいそう',kind:'multi_boost',stats:{spa:1,spd:1},target:'self'},
    {name:'りゅうのまい',kind:'multi_boost',stats:{atk:1,spe:1},target:'self'},
    {name:'ビルドアップ',kind:'multi_boost',stats:{atk:1,def:1},target:'self'},
    {name:'ちょうのまい',kind:'multi_boost',stats:{spa:1,spd:1,spe:1},target:'self'},
    {name:'とぐろをまく',kind:'multi_boost',stats:{atk:1,def:1,acc:1},target:'self'},
    // ソウルビート is excluded until its HP-cost precondition is modeled.
    {name:'コスモパワー',kind:'multi_boost',stats:{def:1,spd:1},target:'self'},
    {name:'バリアー',kind:'stat_boost',stat:'def',stages:2,target:'self'},
    {name:'かげぶんしん',kind:'stat_boost',stat:'eva',stages:1,target:'self'},
    {name:'コットンガード',kind:'stat_boost',stat:'def',stages:3,target:'self'},
    {name:'とける',kind:'stat_boost',stat:'def',stages:2,target:'self'},
    {name:'ふるいたてる',kind:'multi_boost',stats:{atk:1,spa:1},target:'self'},
    {name:'ぼうぎょしれい',kind:'multi_boost',stats:{def:1,spd:1},target:'self'},
    {name:'ドわすれ',kind:'stat_boost',stat:'spd',stages:2,target:'self'},
    {name:'かたくなる',kind:'stat_boost',stat:'def',stages:1,target:'self'},
    {name:'まるくなる',kind:'stat_boost',stat:'def',stages:1,target:'self'},
    {name:'からにこもる',kind:'stat_boost',stat:'def',stages:1,target:'self'},
    {name:'かくばる',kind:'stat_boost',stat:'atk',stages:1,target:'self'},
    {name:'ヨガのポーズ',kind:'stat_boost',stat:'atk',stages:1,target:'self'},
    {name:'ロックカット',kind:'stat_boost',stat:'spe',stages:2,target:'self'},
    {name:'つめとぎ',kind:'multi_boost',stats:{atk:1,acc:1},target:'self'},
    {name:'ギアチェンジ',kind:'multi_boost',stats:{atk:1,spe:2},target:'self'},
    // Deterministic self-stage effects, projected ONLY after success is confirmed.
    {name:'こわいかお',kind:'stat_boost',stat:'spe',stages:-2,target:'opponent'},
    {name:'うそなき',kind:'stat_boost',stat:'spd',stages:-2,target:'opponent'},
    {name:'あまえる',kind:'stat_boost',stat:'atk',stages:-2,target:'opponent'},
    {name:'すなかけ',kind:'stat_boost',stat:'acc',stages:-1,target:'opponent'},
    {name:'えんまく',kind:'stat_boost',stat:'acc',stages:-1,target:'opponent'},
    {name:'いやなおと',kind:'multi_boost',stats:{def:-2},target:'opponent'},
    {name:'きんぞくおん',kind:'multi_boost',stats:{spd:-2},target:'opponent'},
    {name:'かいでんぱ',kind:'multi_boost',stats:{spa:-2},target:'opponent'},
    {name:'つぶらなひとみ',kind:'multi_boost',stats:{atk:-1},target:'opponent'},
    {name:'フェザーダンス',kind:'multi_boost',stats:{atk:-2},target:'opponent'},
    {name:'ないしょばなし',kind:'multi_boost',stats:{spa:-1},target:'opponent'},
    {name:'おたけび',kind:'multi_boost',stats:{atk:-1,spa:-1},target:'opponent'},
    {name:'なみだめ',kind:'multi_boost',stats:{atk:-1,spa:-1},target:'opponent'},
    {name:'くすぐる',kind:'multi_boost',stats:{atk:-1,def:-1},target:'opponent'},


  ].map(d=>Object.freeze(d)));
  const moveByName=new Map(moveDefinitions.map(d=>[d.name,d]));
  const byName=new Map(definitions.map(d=>[d.name,d]));
  function definition(name){return byName.get(name)||null;}
  function evaluate(event,context={}){
    if(!['after_contact','on_entry','on_turn_end','on_move_used','on_hit'].includes(event))return Object.freeze({events:[],unknown:true,reason:'unsupported-event'});
    if(event==='on_move_used'){
      // Incomplete reports never generate a confirmed field mutation.
      const d=moveByName.get(context.move);
      if(!d)return Object.freeze({events:[],unknown:!context.move});
      if(context.succeeded!==true)return Object.freeze({events:[],unknown:context.succeeded!==false});
      // A successful execution is not proof that secondary conditional effects applied.
      if(d.conditional && context.conditionVerified!==true)
        return Object.freeze({events:[],unknown:true,reason:'unverified-'+d.conditional});
      return Object.freeze({events:Object.freeze([d]),unknown:false});
    }
    const events=[];let unknown=false;
    const sides=(event==='after_contact'||event==='on_hit')?[['attacker',context.attacker],['defender',context.defender]]:[['source',context.source]];
    for(const [side,actor] of sides){
      if(!actor){unknown=true;continue;}
      if(typeof actor.ability!=='string'){unknown=true;continue;}
      const d=definition(actor.ability);
      if(!d||!(d.trigger===event||(event==='on_hit'&&d.trigger==='after_contact'))||d.side!==side)continue;
      if(d.requiresDamage && context.damaging!==true){if(context.damaging!==false)unknown=true;continue;}
      // A substitute absorbing a hit is not damage received by the bearer.
      if(d.requiresDamage && context.substitute===true)continue;
      if(d.requiresDamage && context.substitute===undefined)unknown=true;
      if(d.requiresPhysicalDamage && !(context.damaging===true && context.category==='physical')){
        if(context.damaging!==false && context.category!=='special' && context.category!=='status')unknown=true;
        continue;
      }
      if(d.requiresContact && context.contact!==true){if(context.contact!==false)unknown=true;continue;}
      if(d.requiresTypes){if(typeof context.moveType!=='string'){unknown=true;continue;}
        if(!d.requiresTypes.includes(context.moveType))continue;
      }
      if(d.kind==='status_risk'){
        const recipient=side==='attacker'?context.defender:context.attacker;
        if(!recipient){unknown=true;continue;}
        const chance=core.assessedContactStatusRisk({ability:d.name,contact:context.contact,
          damaging:context.damaging,substitute:context.substitute,types:recipient.types,
          status:recipient.status,hits:context.hits===undefined?1:context.hits});
        if(chance===null){unknown=true;events.push(Object.freeze({id:d.id,kind:d.kind,side,status:d.status,chance:null}));}
        else events.push(Object.freeze({id:d.id,kind:d.kind,side,status:d.status,chance}));
      } else if(d.kind==='terrain'){
        events.push(Object.freeze({id:d.id,kind:d.kind,terrain:d.terrain,turns:d.turns}));
      } else if(d.kind==='weak_armor'){
        events.push(Object.freeze({id:d.id,kind:'stat_drop',side,stat:'def',stages:-1}));
        events.push(Object.freeze({id:d.id,kind:'stat_boost',side,stat:'spe',stages:2}));
      } else if(d.kind==='opponent_stat_drop'){
        events.push(Object.freeze({id:d.id,kind:'stat_drop',side:'attacker',stat:d.stat,stages:d.stages}));
      } else if(d.kind==='stat_boost'){
        events.push(Object.freeze({id:d.id,kind:d.kind,stat:d.stat,stages:d.stages}));
      } else if(d.kind==='stat_drop'){
        events.push(Object.freeze({id:d.id,kind:d.kind,stat:d.stat,stages:d.stages}));
      } else if(d.kind==='weather'){
        const turns=core.weatherEntryTurns(d.weather,actor.item);
        if(turns===null)unknown=true;
        events.push(Object.freeze({id:d.id,kind:d.kind,weather:d.weather,turns}));
      }
    }
    return Object.freeze({events:Object.freeze(events),unknown});
  }
  // Advisory held-item / ability residuals. They are deliberately not committed
  // without observed HP and a confirmed item; no hidden information is guessed.
  function residualProjection({item,ability,weather,maxHp,types,grounded,status}={}){
    if(!Number.isInteger(maxHp)||maxHp<1)return Object.freeze({unknown:true,events:[]});
    const amount=Math.max(1,Math.floor(maxHp/16));
    const events=[];let unknown=false;
    if(item==='たべのこし')events.push({kind:'heal',amount,source:item});
    if(item==='くろいヘドロ'){
      if(!Array.isArray(types)){unknown=true;}
      else events.push({kind:types.includes('どく')?'heal':'damage',amount:types.includes('どく')?amount:Math.max(1,Math.floor(maxHp/8)),source:item});
    }
    if(ability==='あめうけざら'){
      if(weather===undefined)unknown=true;
      else if(weather==='雨')events.push({kind:'heal',amount:Math.max(1,Math.floor(maxHp/16)),source:ability});
    }
    if(ability==='ポイズンヒール'){
      // Poison Heal restores 1/8 only when poisoned; avoid adding ordinary poison loss.
      if(status===undefined)unknown=true;
      else if(['どく','もうどく'].includes(status))events.push({kind:'heal',amount:Math.max(1,Math.floor(maxHp/8)),source:ability});
    }
    if(ability==='サンパワー'){
      if(weather===undefined)unknown=true;
      else if(weather==='晴れ')events.push({kind:'damage',amount:Math.max(1,Math.floor(maxHp/8)),source:ability});
    }
    if(ability==='かんそうはだ'){
      if(weather===undefined)unknown=true;
      else if(weather==='雨')events.push({kind:'heal',amount:Math.max(1,Math.floor(maxHp/8)),source:ability});
      else if(weather==='晴れ')events.push({kind:'damage',amount:Math.max(1,Math.floor(maxHp/8)),source:ability});
    }
    if(ability==='アイスボディ'){
      if(weather===undefined)unknown=true;
      else if(weather==='雪')events.push({kind:'heal',amount,source:ability});
    }
    if(item==='グラスシード'||item==='サイコシード'||item==='エレキシード'||item==='ミストシード'){
      // Entry activation is a separate one-use process; do not heal on every turn.
    }
    return Object.freeze({unknown,events:Object.freeze(events.map(x=>Object.freeze(x)))});
  }
  return Object.freeze({definitions,moveDefinitions,definition,evaluate,residualProjection,version:'0.5.0'});
});
