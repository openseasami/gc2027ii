const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('function speedFieldMultiplier(name,side,idx){');
const end=html.indexOf('\nfunction observedOpponentSpeedEstimate(',start);
assert(start>=0&&end>start,'speed function missing');
const fn=html.slice(start,end);
const core=require('./battle-core.js');
let entry={};let ability='かるわざ';let item='';
const ctx={BattleCore:core, state:{opp:[entry]}, $:()=>({value:'なし'}),knownBattleAbility:()=>ability,rawHeldItemFor:()=>item};
vm.createContext(ctx);vm.runInContext(fn,ctx);
function check(expected){assert.equal(ctx.speedFieldMultiplier('オオニューラ','opp',0),expected)}
entry.unburdenActive=false;entry.itemConsumed=false;item='';check(1);
entry.unburdenActive=true;entry.itemConsumed=true;item='グラスシード';check(2);
entry.unburdenActive=false;entry.itemConsumed=true;check(1);
entry.unburdenActive=true;entry.itemConsumed=false;check(1);
entry.unburdenActive=true;entry.itemConsumed=true;ability='どくしゅ';check(1);
ability='かるわざ';entry.status='まひ';check(2);
console.log('6 live Unburden integration cases passed');
