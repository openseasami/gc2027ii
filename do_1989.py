from pathlib import Path
p=Path('/mnt/data/gc_next/index.html')
s=p.read_text()
needle='function applyObservedSubstituteStrike(side,idx,damage){'
insert='''// v1.98.9: Record only a CONFIRMED successful use of Substitute.
// HP is represented as a percentage in battle state; the exact cost uses full HP.
// This cannot silently infer that a selected move succeeded.
function recordConfirmedSubstituteUse(side,idx){
 const d=state[side]?.[idx];
 if(!d)return {ok:false,reason:'対象が未設定'};
 const full=abilityFullHp(side,idx);
 if(!Number.isSafeInteger(full)||full<=0)return {ok:false,reason:'最大HPを確定できません'};
 if(observedSubstituteHp(side,idx)>0)return {ok:false,reason:'みがわりが既にあります'};
 const cost=Math.max(1,Math.floor(full/4));
 const current=Math.max(0,Math.min(full,Math.ceil(full*Number(d.hp)/100)));
 if(!Number.isFinite(current)||current<=cost)return {ok:false,reason:'残HPが不足しています'};
 const before=JSON.parse(JSON.stringify(state));
 d.hp=Math.ceil((current-cost)/full*100);
 d.substituteHp=cost;
 return {ok:true,cost,substituteHp:cost,beforeHp:before[side][idx].hp,afterHp:d.hp,before};
}
'''
assert needle in s
s=s.replace(needle,insert+needle,1)
needle=" parent.appendChild(b);\n}\nfunction renderAbilityEventControls"
replace=''' parent.appendChild(b);
 const use=document.createElement('button');use.type='button';use.className='chip';
 use.textContent='みがわり使用を記録';
 use.title='技の成功を確認後に使用。最大HPの1/4を消費し、みがわりを生成';
 use.onclick=()=>{
   const result=recordConfirmedSubstituteUse(side,idx);
   if(!result.ok){window.alert(result.reason);return;}
   // Preserve the complete previous state for the existing hit-undo mechanism.
   lastConfirmedHitSnapshot={state:result.before,moveName:'みがわり',substituteCreated:true};
   if(typeof renderCards==='function')renderCards();
   if(typeof renderRosterHp==='function')renderRosterHp();
   if(typeof tacticalRefresh==='function')tacticalRefresh();
   if(typeof fixed45Render==='function')fixed45Render();
   if(typeof save==='function')save();
 };
 parent.appendChild(use);
}
function renderAbilityEventControls'''
assert needle in s
s=s.replace(needle,replace,1)
s=s.replace('v1.98.8','v1.98.9')
p.write_text(s)
