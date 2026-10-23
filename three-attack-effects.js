/* Deterministic mechanics for the three explicitly audited attacks. No state mutation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ThreeAttackEffects=api;})(typeof globalThis==='object'?globalThis:this,()=>{
 const stage=n=>Math.max(-6,Math.min(6,Number(n)||0));
 const ratio=n=>(n=stage(n))>=0?(3+n)/3:3/(3-n);
 const modify=(v,m)=>Math.floor((Math.floor(v*m)+2047)/4096);
 function accuracy(base,acc,eva,modifiers=[],repeat=false){
  let mod=4096;for(const m of modifiers)mod=Math.floor((mod*m+2048)/4096);
  let n;
  if(repeat){
   // Preserve the pinned oracle's sequential-rank and integer-event behavior.
   // PRNG samples integers 0..99, so fractional thresholds use ceil.
   const table=[1,4/3,5/3,2,7/3,8/3,3];acc=stage(acc);eva=stage(eva);n=base*100;
   if(acc>0)n*=table[acc];else n/=table[-acc];
   if(eva>0)n/=table[eva];else if(eva<0)n*=table[-eva];
   if(Number.isInteger(n))n=modify(n,mod);
   n=Math.ceil(n);
  }else n=Math.floor(modify(base*100,mod)*ratio(stage(acc-eva)));
  return Math.max(0,Math.min(1,n/100));
 }
 function hitDistribution(max,first,repeat,{singleCheck=false,dice=false}={}){
  const p=Math.max(0,Math.min(1,first)),q=Math.max(0,Math.min(1,repeat));
  if(dice&&max===10)return {accuracy:p,distribution:Array.from({length:7},(_,i)=>[i+4,1/7])};
  if(singleCheck)return {accuracy:p,distribution:[[max,1]]};
  return {accuracy:p,distribution:Array.from({length:max},(_,i)=>[i+1,i===max-1?q**i:q**i*(1-q)])};
 }
 function previousTurn(action,active,turn){
  const result=!active?'other':action?.kind==='move'?(action.failed===true?'failed':action.failed===false?'success':'unknown'):action?.kind==='switch'||!active?'other':'unknown';
  return {turn,result};
 }
 function temperPower(record,turn){
  if(turn===1||record?.result==='other'&&record.turn===turn)return {power:75,known:true};
  if(!record||record.turn!==turn-1||!['failed','success','other'].includes(record.result))return {power:75,known:false};
  return {power:record.result==='failed'?150:75,known:true};
 }
 function strikePower(move,hit,base){return move==='トリプルアクセル'?20*hit:base;}
 return {accuracy,hitDistribution,previousTurn,temperPower,strikePower};
});
