'use strict';
const C=require('@smogon/calc'), U=require('@smogon/calc/dist/mechanics/util');
const DATA=require('./data.json'), G=C.Generations.get(0);
const BY_ID=Object.fromEntries(DATA.species.map(s=>[s.id,s]));
const STATS=['hp','atk','def','spa','spd','spe'];
const WEATHER={none:undefined,sun:'Sun',rain:'Rain',sand:'Sand',snow:'Snow'};
const TERRAIN={none:undefined,electric:'Electric',grassy:'Grassy',psychic:'Psychic',misty:'Misty'};
const FULL_HP=new Set(['Multiscale','Shadow Shield']);
const LOW_HP=new Set(['Overgrow','Blaze','Torrent','Swarm']);
const HISTORY=new Set(['Intimidate','Defiant','Competitive','Contrary','Simple']);
const SEEDS=new Set(['Electric Seed','Psychic Seed','Grassy Seed','Misty Seed']);
const EXCLUDED_MOVES={flail:'HP依存威力を確定しないため未計算',reversal:'HP依存威力を確定しないため未計算',snore:'眠り状態を入力しないため未計算',meteorbeam:'技中の能力変化のタイミング未検証',electroshot:'技中の能力変化のタイミング未検証',lastrespects:'ひんし数を入力しないため未計算',ragefist:'被弾回数を追跡しないため未計算',storedpower:'素早さ等の全能力ランクを入力しないため未計算',powertrip:'全能力ランクを入力しないため未計算',fling:'持ち物消費・投げつける個別仕様は未検証',naturalgift:'持ち物消費条件は未検証',trumpcard:'残りPPを入力しないため未計算',spitup:'蓄える回数を入力しないため未計算',beatup:'参加個体の状態を入力しないため未計算',counter:'前の被ダメージを追跡しないため未計算',mirrorcoat:'前の被ダメージを追跡しないため未計算',metalburst:'前の被ダメージを追跡しないため未計算',comeuppance:'前の被ダメージを追跡しないため未計算'};
const abilityJP=n=>DATA.abilities.find(a=>a.name===n)?.jp||n||'なし';
const itemJP=n=>DATA.items.find(i=>i.name===n)?.jp||n||'なし';
function species(id){if(!Object.hasOwn(BY_ID,id))throw Error('未登録のポケモン・形態です');return BY_ID[id];}
function family(id){const s=species(id);return DATA.species.filter(x=>x.id===s.baseId||x.baseId===s.baseId);}
function blankProfile(id=''){
 if(!id)return {species:'',form:'',moves:['','','',''],ability:'',item:'',nature:'Serious',points:[0,0,0,0,0,0]};
 const s=species(id),base=BY_ID[s.baseId]||s,first=[...base.major,...base.moves].filter(m=>DATA.moves[m]);
 return {species:base.id,form:s.id,moves:[...new Set(first)].slice(0,4).concat(['','','','']).slice(0,4),ability:base.abilities[0],item:s.requiredItem||'',nature:'Serious',points:[0,0,0,0,0,0]};
}
function validateProfile(p){
 if(!p||typeof p!=='object'||Array.isArray(p))throw Error('登録データの形式が不正です');
 if(!Array.isArray(p.points)||p.points.length!==6||!p.points.every(x=>Number.isInteger(x)&&x>=0&&x<=32)||p.points.reduce((a,b)=>a+b,0)>66)throw Error('能力ポイントは各0～32、合計66以下です');
 if(!DATA.natures.some(n=>n.name===p.nature))throw Error('性格が不正です');
 if(!Array.isArray(p.moves)||p.moves.length!==4||p.moves.some(m=>typeof m!=='string')||new Set(p.moves.filter(Boolean)).size!==p.moves.filter(Boolean).length)throw Error('技は重複なしの最大4つです');
 if(!p.species){if(p.form||p.ability||p.item||p.moves.some(Boolean)||p.points.some(Boolean))throw Error('未登録枠に能力・技を設定できません');return blankProfile();}
 const s=species(p.species),f=species(p.form||p.species);
 if(!family(s.id).some(x=>x.id===f.id))throw Error('このポケモンから選べない形態です');
 if(s.isMega)throw Error('通常のポケモンとメガ形態を分けて登録してください');
 if(!s.abilities.includes(p.ability))throw Error('その通常特性は候補にありません');
 if(p.moves.some(m=>m&&!s.moves.includes(m)))throw Error('候補の習得技に含まれない技です');
 const it=DATA.items.find(i=>i.name===p.item);
 if(p.item&&!it)throw Error('候補データにない持ち物です');
 if(it?.megaStone&&!Object.keys(it.megaStone).some(n=>C.toID(n)===s.id))throw Error('このポケモンに対応しないメガストーンです');
 if(f.isMega&&p.item!==f.requiredItem)throw Error('メガ形態と対応メガストーンを一致させてください');
 return {species:s.id,form:f.id,moves:p.moves.slice(),ability:p.ability,item:p.item,nature:p.nature,points:p.points.slice()};
}
function validateTeam(input){
 if(!Array.isArray(input)||input.length>6)throw Error('パーティは最大6体です');
 const team=input.map(validateProfile);while(team.length<6)team.push(blankProfile());
 const ids=team.filter(p=>p.species).map(p=>species(p.species).num);
 if(new Set(ids).size!==ids.length)throw Error('同じポケモンの別形態を含め、重複登録できません');
 const held=team.map(p=>p.item).filter(Boolean);if(new Set(held).size!==held.length)throw Error('同じ持ち物は重複登録できません');
 return team;
}
function actorFromProfile(p,form=p.form){
 const s=species(form||p.species);if(!family(p.species).some(x=>x.id===s.id))throw Error('形態が登録個体と一致しません');
 if(s.isMega&&p.item!==s.requiredItem)throw Error('メガ形態には登録済みの対応ストーンが必要です');
 return {id:s.id,ability:s.isMega?s.abilities[0]:p.ability,item:s.isMega?s.requiredItem:p.item,nature:p.nature,points:p.points.slice(),boosts:[0,0,0,0],burn:false,side:'own',active:true};
}
function unknownActor(id){const s=species(id);return {id,ability:s.abilities[0],item:s.requiredItem||'',points:[0,0,0,0,0,0],nature:'Serious',boosts:[0,0,0,0],burn:false,side:'opp',active:true};}
function validActor(a){
 const s=species(a.id);if(!s.abilities.includes(a.ability))throw Error('形態と特性の組み合わせが不正です');
 if(!Array.isArray(a.points)||a.points.length!==6||a.points.some(x=>!Number.isInteger(x)||x<0||x>32)||a.points.reduce((x,y)=>x+y,0)>66)throw Error('配分が不正です');
 if(!Array.isArray(a.boosts)||a.boosts.length!==4||a.boosts.some(x=>!Number.isInteger(x)||Math.abs(x)>6))throw Error('能力ランクが不正です');
 if(s.isMega&&a.item!==s.requiredItem)throw Error('メガ形態に別の持ち物は指定できません');
 const it=DATA.items.find(i=>i.name===a.item);if(a.item&&!it)throw Error('持ち物がモデル収録外です');
 if(it?.megaStone&&!s.isMega&&!Object.keys(it.megaStone).some(n=>C.toID(n)===s.id))throw Error('別種のメガストーンです');
 return s;
}
function pokemon(a){
 const s=validActor(a),p=new C.Pokemon(G,s.name,{level:50,overrides:{id:s.id,name:s.name,baseStats:s.stats,types:s.types,weightkg:s.weightkg,abilities:{0:a.ability}},ability:a.ability,nature:a.nature,evs:Object.fromEntries(STATS.map((k,i)=>[k,a.points[i]])),boosts:Object.fromEntries(['atk','def','spa','spd'].map((k,i)=>[k,a.boosts[i]])),status:a.burn?'brn':'',item:SEEDS.has(a.item)?'':a.item,abilityOn:!HISTORY.has(a.ability)&&!!a.abilityOn});
 // No entry/consumption history is inferred. Current manual ranks are authoritative.
 if(FULL_HP.has(a.ability)&&!a.fullHpCondition)p.ability='No Ability';
 if(LOW_HP.has(a.ability)&&a.lowHpCondition)p.originalCurHP=Math.max(1,Math.floor(p.maxHP()/3));
 if(a.active===false&&['Fairy Aura','Dark Aura','Aura Break','Friend Guard','Cloud Nine','Air Lock'].includes(a.ability))p.ability='No Ability';
 return p;
}
function plusMinusBuddy(source,ctx,potential=false){return source.active!==false&&(ctx.actives||[]).some(a=>a.active!==false&&a.side===source.side&&a.key!==source.key&&(potential&&a.side==='opp'?species(a.id).abilities:[a.ability]).some(n=>['Plus','Minus'].includes(n)));}
function activeField(ctx,source,target){
 const list=(ctx.actives||[]).filter(a=>a.active!==false).map(a=>a.key===source.key?source:a.key===target.key?target:a);
 for(const side of ['own','opp'])if(list.filter(a=>a.side===side&&species(a.id).isMega).length>1)throw Error('同じ側の同時メガは1体までです。形態を選び直してください');
 const has=ab=>list.some(a=>a.ability===ab);
 const allies=(actor,ab)=>list.some(a=>a.side===actor.side&&a.key!==actor.key&&a.ability===ab);
 const weather=has('Cloud Nine')||has('Air Lock')?undefined:WEATHER[ctx.weather||'none'];
 return new C.Field({gameType:'Doubles',weather,terrain:TERRAIN[ctx.terrain||'none'],isFairyAura:has('Fairy Aura'),isDarkAura:has('Dark Aura'),isAuraBreak:has('Aura Break'),attackerSide:{isBattery:allies(source,'Battery'),isPowerSpot:allies(source,'Power Spot'),isSteelySpirit:allies(source,'Steely Spirit'),isFlowerGift:allies(source,'Flower Gift')},defenderSide:{isFriendGuard:allies(target,'Friend Guard'),isFlowerGift:allies(target,'Flower Gift')}});
}
function compute(source,target,moveId,ctx={},opts={}){
 const m=DATA.moves[moveId];if(!m)return {unsupported:'技データ未確認'};
 if(m.category==='Status')return {unsupported:'変化技・ダメージ計算対象外'};
 if((target.ability==='Disguise'&&!target.id.includes('busted'))||(target.ability==='Ice Face'&&m.category==='Physical'&&!target.id.includes('noice')))return {unsupported:'防御特性の初回防御は未対応。消費後の形態で参考計算できます'};
 if(EXCLUDED_MOVES[moveId])return {unsupported:EXCLUDED_MOVES[moveId]};
 if([source,target].some(a=>SEEDS.has(a.item))&&['knockoff','acrobatics','poltergeist','fling'].includes(moveId))return {unsupported:'シード消費の前後で条件が変わるため未計算'};
 if(['brine','assurance','payback','revenge','avalanche','lashout','retaliate'].includes(moveId)&&!opts.powerKnown)return {unsupported:'HP・行動・被弾等の条件を追跡しないため未計算'};
 const a=pokemon(source),b=pokemon(target),f=activeField(ctx,source,target),options={isCrit:!!opts.crit};
 if(['Plus','Minus'].includes(source.ability))a.abilityOn=plusMinusBuddy(source,ctx)||!!source.abilityOn&&plusMinusBuddy(source,ctx,true);
 const multi=m.multihit;if(multi)options.hits=opts.hits|| (Array.isArray(multi)?multi[1]:multi);
 if(opts.power){options.overrides={basePower:opts.power};}
 const move=new C.Move(G,m.name,options);
 const r=C.calculate(G,a,b,move,f);const hitRolls=typeof r.damage==='number'?[Array(16).fill(r.damage)]:typeof r.damage[0]==='number'?[r.damage]:r.damage;
 const range=r.range(),hp=b.maxHP();
 const hpAssumption=['waterspout','eruption','dragonenergy'].includes(moveId)?(source.lowHpCondition?'攻撃側HP1/3以下の例':'攻撃側HP満タンの例'):['crushgrip','wringout','hardpress'].includes(moveId)?'防御側HP満タンの例':null;
 return {hpAssumption,rolls:hitRolls.length===1?hitRolls[0]:null,hitRolls,range,hp,percent:range.map(x=>100*x/hp),hits:hitRolls.length,attackStats:{...a.rawStats},defenseStats:{...b.rawStats},notes:[...(multi?['各打撃は独立した16乱数。表示は全命中時・途中終了と反応ダメージは別条件']:[]),...(SEEDS.has(source.item)||SEEDS.has(target.item)?['シードは自動でランクを上げず、入力ランクを優先']:[])],crit:!!r.rawDesc.isCritical,critRequested:!!opts.crit,condition:'命中時・最大HP比',actualType:r.move.type,actualPower:r.rawDesc.moveBP||r.move.bp,verifiedScope:'Champions community engine; real game not certified'};
}
function scenarios(source,target,moveId,ctx={}){
 const unknown=source.side==='opp'?source:target,rec=species(unknown.id),isAttack=unknown===source;
 const abis=rec.abilities,rows=[],baseAbi=abis[0];
 function add(label,changes={},options={},priority=0){
  const u={...unknown,...changes},a=isAttack?u:source,b=isAttack?target:u;
  try{const r=compute(a,b,moveId,options.ctx||ctx,options);rows.push({label,priority,...r});}catch(e){rows.push({label,priority,unsupported:e.message});}
 }
 const baseline='基準：'+abilityJP(baseAbi)+'・'+(rec.requiredItem?itemJP(rec.requiredItem):'持ち物なし')+'・0P無補正';
 add(baseline,{ability:baseAbi}, {},100);
 for(const ability of abis){
  if(ability!==baseAbi)add('特性：'+abilityJP(ability),{ability}, {},90);
  if(!isAttack&&FULL_HP.has(ability))add(abilityJP(ability)+'有効：HP満タン条件',{ability,fullHpCondition:true}, {},95);
  if(isAttack&&LOW_HP.has(ability))add(abilityJP(ability)+'有効：HP1/3以下の例',{ability,lowHpCondition:true}, {},85);
  if(isAttack&&['Flash Fire','Electromorphosis','Plus','Minus','Stakeout'].includes(ability)&&(!['Plus','Minus'].includes(ability)||plusMinusBuddy(source,ctx,true)))add(abilityJP(ability)+'発動条件成立の参考',{ability,abilityOn:true}, {},82);
  const points=isAttack?[0,32,0,0,0,0]:[32,0,0,0,0,0];
  const special=DATA.moves[moveId]?.category==='Special',bodyPress=moveId==='bodypress',physicalDefense=['psyshock','psystrike','secretsword'].includes(moveId),defSpecial=special&&!physicalDefense;
  if(isAttack){points[1]=special||bodyPress?0:32;points[3]=special?32:0;if(bodyPress)points[2]=32;add('攻撃側 '+(bodyPress?'B':special?'C':'A')+'32・性格補正＋／'+abilityJP(ability),{ability,points,nature:bodyPress?'Bold':special?'Modest':'Adamant'}, {},75);}
  else{
   add('H32／'+abilityJP(ability),{ability,points}, {},80);
   if(moveId==='foulplay')add('相手A32・性格補正＋／'+abilityJP(ability),{ability,points:[32,32,0,0,0,0],nature:'Adamant'}, {},88);
   const bulk=points.slice();bulk[defSpecial?4:2]=32;
   add('H32 '+(defSpecial?'D':'B')+'32・性格補正＋／'+abilityJP(ability),{ability,points:bulk,nature:defSpecial?'Calm':'Bold'}, {},78);
  }
  if(!rec.requiredItem){
   const candidates=isAttack?['Life Orb','Expert Belt']:['Occa Berry','Passho Berry','Wacan Berry','Rindo Berry','Yache Berry','Chople Berry','Kebia Berry','Shuca Berry','Coba Berry','Payapa Berry','Tanga Berry','Charti Berry','Kasib Berry','Haban Berry','Colbur Berry','Babiri Berry','Roseli Berry','Chilan Berry','Eviolite','Assault Vest','Air Balloon'];
   for(const item of candidates.filter(n=>DATA.items.some(x=>x.name===n))){
    if(item==='Eviolite'&&!rec.evolves)continue;
    const it=DATA.items.find(x=>x.name===item);if(it.isBerry&&it.naturalGift&&it.naturalGift.type!==DATA.moves[moveId]?.type)continue;
    add(itemJP(item)+'所持／'+abilityJP(ability),{ability,item}, {},70);
    if(isAttack){add((bodyPress?'B':special?'C':'A')+'32・性格補正＋・'+itemJP(item)+'／'+abilityJP(ability),{ability,item,points,nature:bodyPress?'Bold':special?'Modest':'Adamant'}, {},79);}
    else if(it.isBerry){const bulky=[32,0,0,0,0,0];bulky[defSpecial?4:2]=32;add('H32・耐久32＋・'+itemJP(item)+'／'+abilityJP(ability),{ability,item,points:bulky,nature:defSpecial?'Calm':'Bold',fullHpCondition:FULL_HP.has(ability)}, {},72);}
   }
  }
 }
 // Unknown ally abilities are conditional; benches never join this active queue.
 for(const ally of (ctx.actives||[]).filter(a=>a.side==='opp'&&a.active!==false&&a.key!==unknown.key)){
  for(const ability of species(ally.id).abilities.filter(n=>['Fairy Aura','Dark Aura','Friend Guard','Power Spot','Battery','Steely Spirit','Air Lock','Cloud Nine'].includes(n))){
   if(ability===ally.ability&&species(ally.id).abilities.length===1)continue;
   const c={...ctx,actives:ctx.actives.map(a=>a.key===ally.key?{...a,ability}:a)};
   add('隣接相手が'+abilityJP(ability)+'の条件',{}, {ctx:c},83);
  }
 }

 // Explicit known own HP/reactive conditions, without any current-HP inputs.
 if(FULL_HP.has(target.ability)&&target.side==='own'){
  try{rows.push({label:abilityJP(target.ability)+'有効：HP満タン条件',priority:96,...compute(source,{...target,fullHpCondition:true},moveId,ctx)});}catch(_){}
 }
 if(LOW_HP.has(source.ability)&&source.side==='own'){
  try{rows.push({label:abilityJP(source.ability)+'有効：HP1/3以下の例',priority:88,...compute({...source,lowHpCondition:true},target,moveId,ctx)});}catch(_){}
 }
 if(source.side==='own'&&['Flash Fire','Electromorphosis','Plus','Minus','Stakeout'].includes(source.ability)&&(!['Plus','Minus'].includes(source.ability)||plusMinusBuddy(source,ctx,true))){
  try{rows.push({label:abilityJP(source.ability)+'発動条件成立の参考',priority:87,...compute({...source,abilityOn:true},target,moveId,ctx)});}catch(_){}
 }
 if(['temperflare','stompingtantrum'].includes(moveId)){
  try{rows.push({label:'前ターンの技失敗等の条件成立：威力150',priority:96,...compute(source,target,moveId,ctx,{power:150})});}catch(_){}
 }
 const dedup=new Map();for(const r of rows){const key=r.unsupported?'x:'+r.unsupported:r.range[1]===0?'zero':JSON.stringify([r.hitRolls,r.hp]);if(dedup.has(key)){dedup.get(key).equivalent.push(r.label);}else dedup.set(key,{...r,equivalent:[]});}
 const all=[...dedup.values()].sort((a,b)=>b.priority-a.priority);const important=[all[0],all.find(r=>r.label.includes('有効')||r.label.startsWith('特性')||r.label.startsWith('隣接')),all.find(r=>/H32|32・性格|所持/.test(r.label))].filter(Boolean);
 const display=[],seenDisplay=new Set();for(const r of [...important,...all]){const text=r.unsupported?'x:'+r.unsupported:r.percent.map(x=>x.toFixed(1)).join('-');if(display.length<3&&!seenDisplay.has(text)){display.push(r);seenDisplay.add(text);}}
 return {display:display.slice(0,3),all,assumptions:'能力・持ち物・配分は独立した仮定。採用率や同時分布を推定していません。',crit:()=>compute(source,target,moveId,ctx,{crit:true})};
}
function statValues(a){return {...pokemon(a).rawStats};}
function speedRange(actor,ctx={}){
 const rec=species(actor.id),unknown=actor.side==='opp',values=[];
 const abilities=unknown?rec.abilities:[actor.ability];
 for(const ability of abilities)for(const fast of unknown?[false,true]:[false]){
  const a={...actor,ability};if(unknown){a.points=[0,0,0,0,0,fast?32:0];a.nature=fast?'Timid':'Brave';}
  const p=pokemon(a),f=activeField(ctx,a,a);values.push(U.getFinalSpeed(G,p,f,f.attackerSide));
  if(unknown&&!rec.requiredItem&&DATA.items.some(x=>x.name==='Choice Scarf')){p.item='Choice Scarf';values.push(U.getFinalSpeed(G,p,f,f.attackerSide));}
  if(ability==='Unburden'){p.item='';p.abilityOn=true;values.push(U.getFinalSpeed(G,p,f,f.attackerSide));}
 }
 if(ctx.weather&&ctx.weather!=='none'&&(ctx.actives||[]).some(x=>x.side==='opp'&&x.active!==false&&species(x.id).abilities.some(n=>['Air Lock','Cloud Nine'].includes(n)))){const still=speedRange(actor,{...ctx,weather:'none'});values.push(...still);}
 return [Math.min(...values),Math.max(...values)];
}
function migrateV8(names,points){
 const team=(names||[]).slice(0,6).map(n=>{const s=DATA.species.find(x=>x.jp===n);if(!n)return blankProfile();if(!s)throw Error('旧データに候補未収録の種族があります。元の保存を保持してください');const p=blankProfile(s.id);if(points?.[n])p.points=points[n].slice();return p;});
 return validateTeam(team);
}
function exportTeam(team){return {format:'GC2027II-viewer-team',version:9,team:validateTeam(team)};}
function importTeam(payload){if(payload?.format==='GC2027II-viewer-team'&&payload.version===8){if(!payload.team||!Array.isArray(payload.team))throw Error('v8の登録配列がありません');return migrateV8(payload.team,payload.points||{});}
 if(!payload||payload.format!=='GC2027II-viewer-team'||payload.version!==9)throw Error('ビューアv9形式のJSONではありません');return validateTeam(payload.team);}
module.exports={DATA,BY_ID,STATS,HISTORY,FULL_HP,LOW_HP,SEEDS,EXCLUDED_MOVES,G,C,species,family,blankProfile,validateProfile,validateTeam,actorFromProfile,unknownActor,compute,scenarios,statValues,speedRange,migrateV8,exportTeam,importTeam,abilityJP,itemJP,activeField};
