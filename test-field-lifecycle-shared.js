const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('./battle-core.js');
let n=0;
const rocks={晴れ:'あついいわ',雨:'しめったいわ',砂:'さらさらいわ',雪:'つめたいいわ'};
for(const [weather,rock] of Object.entries(rocks)){
 for(const [item,expected] of [[rock,8],['もくたん',5],['',5]]){
  assert.equal(core.weatherEntryTurns(weather,item),expected);n++;
 }
}
for(const [weather,item] of [['なし',''],['晴れ',null],['雨',undefined]]){assert.equal(core.weatherEntryTurns(weather,item),null);n++}
for(const [turns,result] of [[8,7],[5,4],[1,0],[0,0],[-1,null],[1.5,null],[null,null]]){
 assert.equal(core.fieldTurnsAfterTurn(turns),result);n++;
}
const html=fs.readFileSync(__dirname+'/index.html','utf8');
assert.match(html,/BattleCore\.weatherEntryTurns\(weather,item\)/);n++;
const helper=html.slice(html.indexOf('function entryWeatherDuration('),html.indexOf('function heldItemFor('));
const ctx={BattleCore:core,heldItemFor:()=>ctx.item};vm.createContext(ctx);vm.runInContext(helper,ctx);
for(const [weather,rock] of Object.entries(rocks)){
 ctx.item=rock;assert.equal(ctx.entryWeatherDuration('my',0,weather),8);n++;
 ctx.item='';assert.equal(ctx.entryWeatherDuration('opp',0,weather),5);n++;
}
console.log(`${n} shared field lifecycle checks passed`);
