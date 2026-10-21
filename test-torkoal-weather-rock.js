const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const text=fs.readFileSync(__dirname+'/index.html','utf8');
const helper=text.slice(text.indexOf('function entryWeatherDuration('),text.indexOf('function heldItemFor('));
const context={heldItemFor:(side,idx)=>context.item};vm.createContext(context);vm.runInContext(helper,context);
let total=0;
for(const [weather,rock] of [['晴れ','あついいわ'],['雨','しめったいわ'],['砂','さらさらいわ'],['雪','つめたいいわ']]){
 for(const [item,duration] of [[rock,8],['',5],['もくたん',5]]){
  context.item=item;assert.equal(context.entryWeatherDuration('my',0,weather),duration);total++;
 }
}
assert.match(text,/function triggerEntryAbility\([\s\S]*?commitEntryFieldEffect\(side,idx,name\)/);
assert.match(text,/function applyConfirmedPendingEntryFieldEffect\([\s\S]*?commitEntryFieldEffect\(side,idx,name\)/);
console.log(`${total+2} weather-rock checks passed`);
