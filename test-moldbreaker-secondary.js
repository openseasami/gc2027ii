const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const a=src.indexOf('function applyConfirmedGuaranteedStatDrop('),b=src.indexOf('function applyConfirmedSingleHit(',a);
const env={clampStage:x=>Math.max(-6,Math.min(6,x))};env.RankEffects=require('./rank-effects.js');vm.createContext(env);vm.runInContext(src.slice(a,b),env);
const fn=env.applyConfirmedGuaranteedStatDrop;let count=0;
function check(value){assert.ok(value);count++}
for(const move of ['ルミナコリジョン','アシッドボム','マジカルフレイム']){
 const key=move==='マジカルフレイム'?'spaStage':'spdStage';
 for(const ab of ['りんぷん','クリアボディ','しろいけむり','ミラーアーマー']){
  const blocked={},atk={};check(!fn(blocked,move,ab,atk,'','',false)||ab==='ミラーアーマー');
  check(blocked[key]===undefined);
  const pierced={},a2={};check(fn(pierced,move,ab,a2,'','',true));check(pierced[key]<0 && a2[key]===undefined);
 }
 const cloak={},atk={};check(!fn(cloak,move,'ミラーアーマー',atk,'','おんみつマント',true));check(cloak[key]===undefined&&atk[key]===undefined);
 const ordinary={},att={};check(fn(ordinary,move,'ミラーアーマー',att,'','',false));check(ordinary[key]===undefined&&att[key]<0);
}
check(src.includes("abilityBypassed('my',ai,attacker,abilityOf('opp',di,defender))"));
check(src.includes("abilityBypassed('opp',Number(attackerIdx),preview.attacker,abilityOf('my',di,preview.defender))"));
console.log(count+' Mold Breaker secondary interactions passed');
