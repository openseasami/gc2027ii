'use strict';
const K=require('./core.cjs'),D=K.DATA,IMAGES=require('./images.json');
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TYPE_COLORS={'ノーマル':'#82909a','ほのお':'#d55840','みず':'#397bc7','でんき':'#bc980d','くさ':'#39965b','こおり':'#408f9b','かくとう':'#ae483a','どく':'#924ca4','じめん':'#b17d35','ひこう':'#667fc8','エスパー':'#a64780','むし':'#78933a','いわ':'#887b58','ゴースト':'#66538e','ドラゴン':'#5855a9','あく':'#55505d','はがね':'#547f89','フェアリー':'#bb6ba7'};
const KEY='gc2027ii-viewer-v9-team',BACKUP=KEY+'-previous';
let team,loadNotice='',loadFailed=false;
try{
 const saved=localStorage.getItem(KEY);
 if(saved)team=K.importTeam(JSON.parse(saved));
 else{
  let names=JSON.parse(localStorage.getItem('gc2027ii-viewer-own-team-v5')||'null');
  const sp=localStorage.getItem('gc2027ii-viewer-own-sp-v8'),oldEv=localStorage.getItem('gc2027ii-viewer-own-ev-v6');
  if(!names&&(sp||oldEv))names=['ゴリランダー','オオニューラ','','','',''];
  const points=JSON.parse(sp||oldEv||'{}');if(!sp&&oldEv)for(const name of Object.keys(points))if(Array.isArray(points[name]))points[name]=points[name].map(v=>Math.min(32,Math.max(0,Math.floor((Number(v)+4)/8))));
  if(names){team=K.migrateV8(names,points);loadNotice='v8の種族・能力ポイントを読み込みました。未保存の技・特性・持ち物・性格は初期値です。登録画面で確認してください。';}
 }
}catch(e){loadFailed=true;loadNotice='保存データを読み込めませんでした。元のデータは上書きしていません。JSONがあれば登録画面から読み込めます。';}
if(!team){team=K.validateTeam([K.blankProfile('rillaboom'),K.blankProfile('sneasler')]);if(!loadFailed)loadNotice='初期サンプル2体です。実際のパーティ・配分を登録してください。';}
const state={own:[0,1],opp:['incineroar','primarina'],ownForms:{},ranks:{own:[[0,0,0,0],[0,0,0,0]],opp:[[0,0,0,0],[0,0,0,0]]},burn:{own:[false,false],opp:[false,false]},weather:'none',terrain:'none',tr:false,enemyBench:['','','','']};
let revision=0,cache=new Map(),pendingImport=null,pickerTarget=null,renderCount=0;
function message(txt,error=false){$('notice').textContent=txt;$('notice').classList.toggle('error',error);}
function spriteHTML(id,cls='avatar'){
 const s=K.species(id),uri=IMAGES[s.sprite];return uri?'<img class="'+cls+'" src="'+uri+'" alt="'+esc(s.jp)+(s.spriteIsBase?'（通常形態の画像）':'')+'" '+(s.spriteIsBase?'title="画像は通常形態を共用、名称で形態を識別"':'')+'>':'<span class="sprite-fallback" aria-label="画像未取得">'+esc(s.jp.slice(0,2))+'</span>';
}
function options(entries,current,empty=false){return (empty?'<option value="">未選択</option>':'')+entries.map(e=>'<option value="'+esc(e.id||e.name)+'" '+((e.id||e.name)===current?'selected':'')+' '+(e.disabled?'disabled':'')+'>'+esc(e.jp||e.name)+'</option>').join('');}
function pickerButton(kind,index,id,label){return '<button type="button" class="pokemon-picker-trigger" data-picker="'+kind+'" data-index="'+index+'" aria-label="'+esc(label)+'">'+(id?spriteHTML(id):'')+'<span>'+esc(id?K.species(id).jp:'未登録')+'</span><span class="caret">▾</span></button>';}
function save(newTeam){
 const valid=K.validateTeam(newTeam),payload=JSON.stringify(K.exportTeam(valid));
 try{const old=localStorage.getItem(KEY);if(old)localStorage.setItem(BACKUP,old);localStorage.setItem(KEY,payload);$('saveStatus').textContent='保存済み';}
 catch(e){$('saveStatus').textContent='保存失敗：JSON出力で保管してください';message('ブラウザに保存できません。変更は画面に残っています。JSON出力で保管してください。',true);}
 team=valid;revision++;cache.clear();return true;
}
function normalizedOwn(){const valid=team.map((p,i)=>p.species?i:null).filter(i=>i!==null);if(!valid.includes(state.own[0]))state.own[0]=valid[0]??null;if(!valid.includes(state.own[1])||state.own[1]===state.own[0])state.own[1]=valid.find(i=>i!==state.own[0])??null;
 let hasMega=false;for(const idx of state.own){if(idx===null)continue;const p=team[idx],f=K.species(state.ownForms[idx]||p.form);if(f.isMega&&(p.item!==f.requiredItem||hasMega)){state.ownForms[idx]=p.species;}else if(f.isMega)hasMega=true;}
}
function actors(){
 const all=[];for(const side of ['own','opp'])for(let i=0;i<2;i++){
  let a;if(side==='own'){const n=state.own[i];if(n===null||!team[n]?.species)continue;let p=team[n],form=state.ownForms[n]||p.form;a=K.actorFromProfile(p,form);a.profile=n;}
  else{if(!state.opp[i])continue;a=K.unknownActor(state.opp[i]);}
  all.push({...a,side,key:side+i,slot:i,active:true,boosts:state.ranks[side][i].slice(),burn:state.burn[side][i]});
 }return all;
}
function context(){return {weather:state.weather,terrain:state.terrain,tr:state.tr,actives:actors()};}
function rankControls(side,i){return '<div class="rankgrid">'+['A','B','C','D'].map((k,j)=>'<div class="rankline"><b>'+k+'</b><button data-rank="-1" data-side="'+side+'" data-index="'+i+'" data-stat="'+j+'" aria-label="'+(side==='own'?'味方':'相手')+(i+1)+' '+k+'ランクを下げる">−</button><output aria-label="'+k+'ランク">'+(state.ranks[side][i][j]>0?'+':'')+state.ranks[side][i][j]+'</output><button data-rank="1" data-side="'+side+'" data-index="'+i+'" data-stat="'+j+'" aria-label="'+(side==='own'?'味方':'相手')+(i+1)+' '+k+'ランクを上げる">＋</button></div>').join('')+'</div>';}
function activeCard(side,i){
 const actor=actors().find(a=>a.key===side+i),id=actor?.id;
 let picker;if(side==='own'){picker='<select data-own="'+i+'" aria-label="味方'+(i+1)+'の登録枠">'+team.map((p,n)=>p.species?'<option value="'+n+'" '+(state.own[i]===n?'selected':'')+'>'+esc('登録'+(n+1)+' '+K.species(p.species).jp)+'</option>':'').join('')+'</select>';}
 else picker=pickerButton('opp',i,id,'相手'+(i+1)+'のポケモン選択');
 if(!actor)return '<div class="card own">'+picker+'<p>味方を登録してください</p></div>';
 const s=K.species(id),forms=K.family(side==='own'?team[actor.profile].species:s.id);
 const formSelect=forms.length>1?'<select class="mega-switch" data-form-side="'+side+'" data-index="'+i+'" aria-label="'+(side==='own'?'味方':'相手')+(i+1)+'の形態">'+options(forms.map(f=>({...f,disabled:side==='own'&&f.isMega&&team[actor.profile].item!==f.requiredItem})),id)+'</select>':'';
 return '<div class="card '+side+'" data-card="'+side+i+'">'+picker+'<div class="head">'+spriteHTML(id)+'<div class="name">'+esc(s.jp)+'<small>'+esc(s.types.map(t=>D.types[t]).join('・'))+'</small></div></div>'+formSelect+(side==='own'&&forms.some(f=>f.isMega)?'<small>メガは登録済みの対応ストーンが必要</small>':'')+rankControls(side,i)+'<label class="burn"><input type="checkbox" data-burn-side="'+side+'" data-index="'+i+'" '+(state.burn[side][i]?'checked':'')+'>やけど</label></div>';
}
function summaryTeam(){$('teamSummary').innerHTML=team.map((p,i)=>'<span class="team-chip">'+(p.species?spriteHTML(p.form)+'<b>'+esc(i+1+' '+K.species(p.form).jp)+'</b>':'登録'+(i+1)+' 未登録')+'</span>').join('');}
function statText(p){if(!p.species)return '';const a=K.actorFromProfile(p),stats=K.statValues(a);return K.STATS.map(k=>k.toUpperCase()+' '+stats[k]).join(' / ');}
function renderTeam(){
 $('teamFields').innerHTML=team.map((p,i)=>{
  const s=p.species?K.species(p.species):null,forms=s?K.family(s.id):[];
  const itemEntries=D.items.filter(it=>!it.megaStone||(s&&Object.keys(it.megaStone).some(n=>K.C.toID(n)===s.id))).map(it=>({...it,id:it.name}));
  return '<div class="team-slot" data-team-slot="'+i+'"><h3>登録 '+(i+1)+'</h3>'+pickerButton('team',i,p.form,'登録'+(i+1)+'体目を選択')+(s?'<label>初期形態<select data-edit="form" data-index="'+i+'" aria-label="登録'+(i+1)+'の形態">'+options(forms,p.form)+'</select></label><div class="team-fields"><label>通常時の特性<select data-edit="ability" data-index="'+i+'">'+s.abilities.map(a=>'<option value="'+esc(a)+'" '+(a===p.ability?'selected':'')+'>'+esc(K.abilityJP(a))+'</option>').join('')+'</select></label><label>持ち物<select data-edit="item" data-index="'+i+'">'+options(itemEntries,p.item,true)+'</select></label><label>性格<select data-edit="nature" data-index="'+i+'">'+options(D.natures.map(n=>({...n,id:n.name})),p.nature)+'</select></label></div><div class="move-fields">'+p.moves.map((m,j)=>'<label>技'+(j+1)+'<select data-move-edit="'+j+'" data-index="'+i+'" aria-label="登録'+(i+1)+'の技'+(j+1)+'">'+options(s.moves.map(id=>D.moves[id]).filter(Boolean),m,true)+'</select></label>').join('')+'</div><div class="ev-fields">'+p.points.map((v,j)=>'<label>'+['HP','攻撃','防御','特攻','特防','素早さ'][j]+'<input type="number" min="0" max="32" step="1" value="'+v+'" data-points="'+j+'" data-index="'+i+'" aria-label="登録'+(i+1)+' '+['HP','攻撃','防御','特攻','特防','素早さ'][j]+'能力ポイント"></label>').join('')+'</div><div class="ev-total" id="total'+i+'">合計 '+p.points.reduce((a,b)=>a+b,0)+' / 66</div><div class="stat" id="stats'+i+'">'+statText(p)+'</div>':'<small>ポケモンを選ぶと登録できます</small>')+'</div>';
 }).join('');
}
function shortLabel(label){if(label.startsWith('基準：'))return '基準 '+label.slice(3).split('・')[0]+'／0P';if(label.includes('HP1/3'))return label.split('有効')[0]+' HP≤1/3';if(label.includes('HP満タン'))return label.split('有効')[0]+' 満タン';return label.replace(/／.*$/,'').replace('攻撃側 ','').replace('・性格補正＋','＋').replace('・耐久32＋',' 耐久32＋').replace('所持','');}
function patternHTML(r,baseType){if(r.unsupported)return '<div class="condition unsupported">未計算：'+esc(r.unsupported)+'</div>';return '<div class="condition"><span title="'+esc(r.label)+'">'+esc(shortLabel(r.label))+(r.hpAssumption?' <small>'+esc(r.hpAssumption)+'</small>':'')+(r.actualType&&r.actualType!==baseType?' <small>'+esc(D.types[r.actualType]||r.actualType)+'</small>':'')+'</span><strong style="background:'+heat(r.percent[1])+'">'+r.percent.map(n=>n.toFixed(1)).join('–')+'%</strong></div>';}
function heat(v){const x=Math.min(v,160)/160;return 'rgb('+[54,74,90].map((n,i)=>Math.round(n+([154,18,27][i]-n)*x)).join(',')+')';}
function rowData(a,b,move,ctx){const key=JSON.stringify([revision,a,b,move,ctx]);if(!cache.has(key))cache.set(key,K.scenarios(a,b,move,ctx));return cache.get(key);}
function damageCard(a,b,moves,ctx){
 const sa=K.species(a.id),sb=K.species(b.id),baseClasses=(a.side==='own'?'ally':'enemy');
 return '<div class="calc" data-pair="'+esc(a.key+'-'+b.key)+'"><div class="combathead">'+spriteHTML(a.id)+ '<span class="'+baseClasses+'-name">'+esc(sa.jp)+'</span><span>→</span>'+spriteHTML(b.id)+'<span class="'+(b.side==='own'?'ally':'enemy')+'-name">'+esc(sb.jp)+'</span></div>'+(!moves.length?'<p>攻撃技未登録</p>':moves.map(id=>{
 const m=D.moves[id];if(!m)return '';
 const result=rowData(a,b,id,ctx);return '<div class="damage-move-block"><button class="move" data-detail-move="'+id+'" style="background:'+TYPE_COLORS[D.types[m.type]]+'">'+esc(m.jp)+' <small>基本 '+esc(m.category==='Physical'?'物理':m.category==='Special'?'特殊':'変化')+' '+m.power+'</small></button>'+result.display.map(r=>patternHTML(r,m.type)).join('')+'<details class="condition-details"><summary>全条件・急所参考・16乱数</summary><div class="hint">'+esc(result.assumptions)+'</div>'+result.all.map(r=>patternHTML(r)+(r.unsupported?'':'<div class="rolls">'+r.hitRolls.map((rolls,h)=>'打撃'+(h+1)+': '+rolls.join(', ')).join('<br>')+'<br>実ダメージ '+r.range.join('–')+' / 最大HP '+r.hp+(r.equivalent.length?'<br>同値条件：'+esc(r.equivalent.join('／')):'')+'</div>')).join('')+criticalHTML(a,b,id,ctx)+'</details></div>';
 }).join(''))+'</div>';
}
function criticalHTML(a,b,id,ctx){try{const r=K.compute(a,b,id,ctx,{crit:true});if(r.unsupported)return '';return '<div class="critical"><b>'+(r.crit?'急所成立の参考（基準配分・特性条件）':'基準の特性等により急所補正なし')+'</b><br>'+r.percent.map(x=>x.toFixed(1)).join('–')+'%<br><span class="rolls">'+r.hitRolls.map(x=>x.join(', ')).join(' / ')+'</span></div>';}catch(e){return '<div class="unsupported">急所計算未確認</div>';}}
function renderDamage(){const all=actors(),ctx=context();let html='';for(const side of ['own','opp']){
 let cards=[];for(let i=0;i<2;i++)for(let j=0;j<2;j++){
  const a=all.find(x=>x.key===side+i),b=all.find(x=>x.key===(side==='own'?'opp':'own')+j);if(all.length!==4||!a||!b){cards.push('<div class="calc">双方2体ずつを登録・選択すると、対象2体条件で計算します。</div>');continue;}
  const moves=side==='own'?team[a.profile].moves.filter(Boolean):K.species(a.id).major.filter(m=>D.moves[m]?.category!=='Status').slice(0,4);
  cards.push(damageCard(a,b,moves,ctx));
 }
 html+='<section class="damage-section '+(side==='own'?'ally-attacks':'enemy-attacks')+'"><h2>'+(side==='own'?'B. 味方が与えるダメージ':'C. 相手から受けるダメージ')+'</h2><div class="damage">'+cards.join('')+'</div></section>';
 }$('calc').innerHTML=html;
}
function renderDetails(){
 const ctx=context(),all=actors();$('detailsGrid').innerHTML=all.map(a=>{
  const s=K.species(a.id),range=K.speedRange(a,ctx);
  return '<div class="card '+a.side+'"><div class="head">'+spriteHTML(a.id)+'<b>'+esc(s.jp)+'</b></div><p class="stat">種族値 '+K.STATS.map(k=>k.toUpperCase()+' '+s.stats[k]).join(' / ')+'</p><p>素早さ実数値の候補：'+range.join('–')+'<small>素早さランク0。相手は0～32P・性格±・スカーフ候補を含む条件範囲</small></p><b>v8収録候補／習得候補6技（統計未取得）</b><div class="mini-grid">'+s.major.map(id=>'<button class="move" data-detail-move="'+id+'" style="background:'+TYPE_COLORS[D.types[D.moves[id]?.type]]+'">'+esc(D.moves[id]?.jp||id)+'</button>').join('')+'</div><p>特性候補：'+esc(s.abilities.map(K.abilityJP).join('／'))+'<br><small>採用率：統計未取得。候補を確率とは扱いません。</small></p><p>持ち物採用率：統計未取得</p></div>';
 }).join('');
 const own=all.filter(a=>a.side==='own'),opp=all.filter(a=>a.side==='opp');
 $('speedSummary').innerHTML=own.flatMap(a=>opp.map(b=>{const ar=K.speedRange(a,ctx),br=K.speedRange(b,ctx);let rel=ar[0]>br[1]?'味方が速い仮定':ar[1]<br[0]?'相手が速い仮定':'区間が重複・前後未確定';if(state.tr)rel=ar[0]>br[1]?'TR下では相手が先の仮定':ar[1]<br[0]?'TR下では味方が先の仮定':'TR下でも前後未確定';return '<span>'+esc(K.species(a.id).jp+' '+ar.join('–')+' / '+K.species(b.id).jp+' '+br.join('–')+'：'+rel)+'</span>';})).join('');
}
function benchActor(side,i){if(side==='own'){const p=team[i];if(!p?.species)return null;return {...K.actorFromProfile(p,state.ownForms[i]||p.form),key:'ownBench'+i,side:'own',profile:i,active:false};}const id=state.enemyBench[i];if(!id)return null;return {...K.unknownActor(id),key:'oppBench'+i,side:'opp',active:false};}
function renderBench(){
 $('opponentBenchFields').innerHTML=state.enemyBench.map((n,i)=>'<div><b>相手控え'+(i+1)+'</b>'+pickerButton('bench',i,n,'相手控え'+(i+1)+'を選択')+'</div>').join('');
 const active=actors(),ctx=context(),own=team.map((p,i)=>p.species&&!state.own.includes(i)?benchActor('own',i):null).filter(Boolean),opp=state.enemyBench.map((id,i)=>id&&!state.opp.includes(id)?benchActor('opp',i):null).filter(Boolean);
 let html='';for(const [attackers,defenders]of [[own,active.filter(a=>a.side==='opp')],[opp,active.filter(a=>a.side==='own')],[active.filter(a=>a.side==='own'),opp],[active.filter(a=>a.side==='opp'),own]]){
  if(!attackers.length||!defenders.length)continue;
  html+='<div class="bench-matrix">'+attackers.flatMap(a=>defenders.map(b=>{const moves=a.side==='own'?team[a.profile].moves.filter(Boolean):K.species(a.id).major.filter(m=>D.moves[m]?.category!=='Status').slice(0,4);return damageCard(a,b,moves,ctx);})).join('')+'</div>';
 }$('benchCalc').innerHTML=html||'<p>控えを登録すると比較できます。</p>';
}
function render(includeTeam=false){
 const started=performance.now();normalizedOwn();renderCount++;cache.clear();summaryTeam();if(includeTeam)renderTeam();$('own').innerHTML=[0,1].map(i=>activeCard('own',i)).join('');$('opp').innerHTML=[0,1].map(i=>activeCard('opp',i)).join('');
 renderDamage();renderDetails();if($('benchSettings').open)renderBench();$('updateStatus').textContent='条件反映済み';$('updateStatus').dataset.revision=String(revision);$('updateStatus').dataset.ms=(performance.now()-started).toFixed(1);
}
function openPicker(kind,index){pickerTarget={kind,index};$('pickerSearch').value='';drawPicker();$('pokemonPickerDialog').showModal();$('pickerSearch').focus();}
function drawPicker(){if(!pickerTarget)return;const q=$('pickerSearch').value.trim().toLowerCase();const all=D.species.filter(s=>(s.jp+' '+s.name).toLowerCase().includes(q));$('pickerCount').textContent=all.length+'形態（モデル候補、公式全件未確認）';$('pickerGrid').innerHTML='<button class="picker-choice" data-pick="">未選択</button>'+all.map(s=>'<button class="picker-choice" data-pick="'+s.id+'">'+spriteHTML(s.id)+'<span>'+esc(s.jp)+'</span></button>').join('');}
function selectPokemon(kind,index,id){
 if(kind==='team'){const next=structuredClone(team);next[index]=K.blankProfile(id);try{save(next);delete state.ownForms[index];render(true);}catch(e){message(e.message,true);}return;}
 if(kind==='opp'){
  if(id&&K.species(id).isMega&&state.opp[1-index]&&K.species(state.opp[1-index]).isMega&&K.species(state.opp[1-index]).num!==K.species(id).num){message('同じ側の同時メガは1体までです',true);return;}
  if(id&&state.opp[1-index]&&K.species(state.opp[1-index]).num===K.species(id).num)state.opp[1-index]=state.opp[index];state.opp[index]=id;state.ranks.opp[index]=[0,0,0,0];state.burn.opp[index]=false;state.enemyBench=state.enemyBench.map(b=>b&&state.opp.filter(Boolean).some(x=>K.species(x).num===K.species(b).num)?'':b);
 }else{if(id&&[...state.opp,...state.enemyBench.filter((_,j)=>j!==index)].filter(Boolean).some(x=>K.species(x).num===K.species(id).num)){message('相手の場・控えに同じ種族が選択済みです',true);return;}state.enemyBench[index]=id;}
 revision++;render();
}
function edit(e){const el=e.target,i=Number(el.dataset.index);
 try{
  if(el.dataset.points!==undefined||el.dataset.edit||el.dataset.moveEdit!==undefined){
   const next=structuredClone(team),p=next[i];
   if(el.dataset.points!==undefined){p.points[Number(el.dataset.points)]=Number(el.value);}
   else if(el.dataset.moveEdit!==undefined)p.moves[Number(el.dataset.moveEdit)]=el.value;
   else{p[el.dataset.edit]=el.value;if(el.dataset.edit==='form'){const f=K.species(el.value);if(f.requiredItem)p.item=f.requiredItem;delete state.ownForms[i];}}
   save(next);message('登録内容を反映しました。');
   if(el.dataset.edit==='form')renderTeam();
   if($('total'+i))$('total'+i).textContent='合計 '+team[i].points.reduce((a,b)=>a+b,0)+' / 66';if($('stats'+i))$('stats'+i).textContent=statText(team[i]);render();return;
  }
  if(el.dataset.own!==undefined){const slot=Number(el.dataset.own),old=state.own[slot],v=Number(el.value);if(state.own[1-slot]===v)state.own[1-slot]=old;state.own[slot]=v;state.ranks.own[slot]=[0,0,0,0];state.burn.own[slot]=false;}
  else if(el.dataset.formSide){const side=el.dataset.formSide,other=actors().find(a=>a.key===side+(1-i));if(K.species(el.value).isMega&&other&&K.species(other.id).isMega)throw Error('同じ側の同時メガは1体までです');if(side==='own')state.ownForms[state.own[i]]=el.value;else state.opp[i]=el.value;}
  else if(el.dataset.burnSide)state.burn[el.dataset.burnSide][i]=el.checked;
  else if(['weather','terrain'].includes(el.id))state[el.id]=el.value;
  else if(el.id==='tr')state.tr=el.checked;
  else return;
  revision++;render();
 }catch(err){message(err.message,true);renderTeam();render();}
}
$('pickerGrid').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(!b||!pickerTarget)return;const {kind,index}=pickerTarget;$('pokemonPickerDialog').close();selectPokemon(kind,index,b.dataset.pick);});
$('pickerSearch').addEventListener('input',drawPicker);$('pickerSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const b=$('pickerGrid').querySelector('button[data-pick]:not([data-pick=""])');if(b)b.click();}});$('pickerClose').onclick=()=>$('pokemonPickerDialog').close();
document.addEventListener('click',e=>{const p=e.target.closest('[data-picker]');if(p){openPicker(p.dataset.picker,Number(p.dataset.index));return;}const b=e.target.closest('[data-rank]');if(b){const side=b.dataset.side,i=Number(b.dataset.index),j=Number(b.dataset.stat);state.ranks[side][i][j]=Math.max(-6,Math.min(6,state.ranks[side][i][j]+Number(b.dataset.rank)));revision++;render();return;}const m=e.target.closest('[data-detail-move]');if(m){const md=D.moves[m.dataset.detailMove];$('detailTitle').textContent=md.jp;$('detailDesc').textContent='タイプ：'+D.types[md.type]+'\n分類：'+md.category+'\n基本威力：'+md.power+'\n命中：'+(md.accuracy===true?'必中':md.accuracy+'%')+'\n優先度：'+md.priority+'\n対象：'+md.target+'\n\n命中時ダメージです。追加効果・命中確率・行動推奨を計算しません。';$('moveDialog').showModal();}});
document.addEventListener('change',edit);$('closeDialog').onclick=()=>$('moveDialog').close();
$('benchSettings').addEventListener('toggle',()=>{if($('benchSettings').open)renderBench();});
$('exportJson').onclick=()=>{const payload=JSON.stringify(K.exportTeam(team),null,2),a=document.createElement('a'),url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));a.href=url;a.download='GC2027II_Viewer_v9_team.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);};
$('importJson').onclick=()=>$('importFile').click();$('importFile').onchange=async()=>{try{const file=$('importFile').files[0];if(!file)return;if(file.size>2*1024*1024)throw Error('JSONは2MB以下にしてください');pendingImport=K.importTeam(JSON.parse(await file.text()));$('importPreview').textContent=pendingImport.map((p,i)=>(i+1)+': '+(p.species?K.species(p.form).jp:'未登録')).join('\n');$('importDialog').showModal();}catch(e){pendingImport=null;message('読込を中止しました：'+e.message,true);}finally{$('importFile').value='';}};
$('confirmImport').onclick=()=>{if(!pendingImport)return;try{save(pendingImport);pendingImport=null;state.ownForms={};state.own=[0,1];$('importDialog').close();render(true);message('JSONを復元しました。読込前の登録は「直前の登録に戻す」で復元できます。');}catch(e){message(e.message,true);}};
$('cancelImport').onclick=()=>{pendingImport=null;$('importDialog').close();};
$('restorePrevious').onclick=()=>{try{const previous=localStorage.getItem(BACKUP);if(!previous)throw Error('直前の保存がありません');const valid=K.importTeam(JSON.parse(previous));save(valid);state.ownForms={};render(true);message('直前の登録に戻しました。');}catch(e){message(e.message,true);}};
$('resetConditions').onclick=()=>{state.ranks={own:[[0,0,0,0],[0,0,0,0]],opp:[[0,0,0,0],[0,0,0,0]]};state.burn={own:[false,false],opp:[false,false]};state.weather='none';state.terrain='none';state.tr=false;for(const id of ['weather','terrain'])$(id).value='none';$('tr').checked=false;revision++;render();};
message(loadNotice,loadFailed);render(true);
window.ViewerCore=K;window.ViewerApp={getState:()=>structuredClone({team,state,revision,renderCount}),exportTeam:()=>K.exportTeam(team)};
