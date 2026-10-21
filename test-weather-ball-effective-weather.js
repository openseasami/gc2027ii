const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const code=src.slice(src.indexOf('function resolveMoveForDamage('),src.indexOf('// Read-only calculation effects'));
const weatherCode=src.slice(src.indexOf('function effectiveWeatherForDamage('),src.indexOf('function defenderSpreadForBulk('));
let weather='晴れ',ability='';
const ctx={
 $:(id)=>id==='weather'?{value:weather}:null,
 activeKnownAbilityEntries:()=>ability?[{ability}]:[],
 effectiveBattleName:(_s,_i,n)=>n,
 knownBattleAbility:()=>'',abilityMoveTraits:()=>({}),
};
vm.createContext(ctx);vm.runInContext(weatherCode+code,ctx);
let n=0;
function test(w,a,type,power,weatherPower){weather=w;ability=a;const v=ctx.resolveMoveForDamage('my',0,'コータス','ウェザーボール',{type:'ノーマル',power:50});assert.equal(v.moveType,type);assert.equal(v.power,power);assert.equal(ctx.weatherMod(type),weatherPower);n+=3;}
for(const [w,t,b] of [['なし','ノーマル',1],['晴れ','ほのお',1.5],['雨','みず',1.5],['砂','いわ',1],['雪','こおり',1]])test(w,'',t,w==='なし'?50:100,b);
for(const ability of ['ノーてんき','エアロック'])for(const weather of ['晴れ','雨','砂','雪'])test(weather,ability,'ノーマル',50,1);
assert.match(src,/moveName!=='ウェザーボール'&&moveType==='ノーマル'&&skinTypes/);n++;
console.log(`${n} weather ball checks passed`);
