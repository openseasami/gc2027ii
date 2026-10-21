const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');let a=src.indexOf('function applyConfirmedGuaranteedStatDrop('),b=src.indexOf('function applyConfirmedSingleHit(',a);
let c={clampStage:x=>Math.max(-6,Math.min(6,x))};vm.createContext(c);vm.runInContext(src.slice(a,b),c);
let f=c.applyConfirmedGuaranteedStatDrop,n=0;
const test=(v)=>{assert.ok(v);n++};
for(const move of ['ルミナコリジョン','アシッドボム','マジカルフレイム']){
 let k=move==='マジカルフレイム'?'spaStage':'spdStage',d={};test(!f(d,move,'',{},'','おんみつマント'));test(d[k]===undefined);
 let atk={},def={};test(f(def,move,'ミラーアーマー',atk));test(def[k]===undefined&&atk[k]<0);
 let immune={};test(!f({},move,'ミラーアーマー',immune,'クリアボディ'));test(immune[k]===undefined);
 let both={};test(f({},move,'ミラーアーマー',both,'ミラーアーマー'));test(both[k]<0);
 test(!f({},move,'ミラーアーマー',null));
}
test(src.includes("ensureBattleEntry('my',ai,attacker)"));test(src.includes("ensureBattleEntry('opp',Number(attackerIdx),preview.attacker)"));
console.log(n+' cloak and mirror checks passed');
