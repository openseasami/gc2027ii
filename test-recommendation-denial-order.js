const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('index.html','utf8');
const ctx={scenarioSwitchDefender:()=>null,scenarioHitAvailability:()=>1,
 simulatedActionEvent:(a,side)=>a.event,simulationStrictlyBefore:(a,b)=>a.priority!==b.priority?a.priority>b.priority:a.speed!==b.speed&&(ctx.tr?a.speed<b.speed:a.speed>b.speed)};
vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function enablerDenialAvailability('),source.indexOf('function disruptionCanAffect(')),ctx);
const target={name:'enabler'},action={event:{priority:0,speed:100}},pair={a:{actor:'enabler',event:{priority:0,speed:80}}};
assert.equal(ctx.enablerDenialAvailability(action,target,pair),1,'strictly earlier denial');
pair.a.event.speed=100;assert.equal(ctx.enablerDenialAvailability(action,target,pair),.5,'tie cannot assure denial');
pair.a.event.speed=120;assert.equal(ctx.enablerDenialAvailability(action,target,pair),0,'late KO does not undo action');
ctx.tr=true;assert.equal(ctx.enablerDenialAvailability(action,target,pair),1,'TR reverses equal-priority order');
pair.a.event.priority=1;assert.equal(ctx.enablerDenialAvailability(action,target,pair),0,'priority precedes TR speed');
ctx.scenarioHitAvailability=()=>0;assert.equal(ctx.enablerDenialAvailability(action,target,pair),0,'guarded target');
ctx.scenarioHitAvailability=()=>1;ctx.scenarioSwitchDefender=()=>({name:'entrant'});assert.equal(ctx.enablerDenialAvailability(action,target,pair),0,'outgoing enabler is no longer on field');
ctx.scenarioSwitchDefender=()=>null;assert.equal(ctx.enablerDenialAvailability(action,target,null),.5,'unknown action is conditional');
ctx.tr=false;pair.a.event.priority=0;action.event.orderEffect={last:true};assert.equal(ctx.enablerDenialAvailability(action,target,pair),0,'lagging item overrides speed');
action.event.orderEffect={uncertain:true};assert.equal(ctx.enablerDenialAvailability(action,target,pair),.5,'random ordering conditional');
action.event.orderEffect={};action.event.speed=null;assert.equal(ctx.enablerDenialAvailability(action,target,pair),.5,'unknown speed conditional');
console.log('PASS 11 denial timing/priority/tie/TR/guard/switch boundaries (actual event generation covered in browser)');
