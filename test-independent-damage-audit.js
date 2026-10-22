/* Independent integer-arithmetic oracle for the CURRENT implemented damage model.
   Checks implementation parity, NOT external cartridge correctness. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const core=require('./battle-core.js');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('function battlePokeRound('),stop=html.indexOf('// v1.77.4:',start);
assert.ok(start>=0&&stop>start,'damage functions not located');
const ctx={BattleCore:core,weatherMod:()=>1};vm.createContext(ctx);vm.runInContext(html.slice(start,stop),ctx);
let checks=0;
// Reference uses BigInt to avoid the application's floating-point expression order.
function fixed(v,m){const scaled=BigInt(Math.round(m*4096));return Number((BigInt(v)*scaled+2047n)/4096n)}
function baseline(p,a,d,spread,w,t){
 const bp=Math.max(1,fixed(p,t));
 let x=Number(((22n*BigInt(bp)*BigInt(a)/BigInt(d))/50n)+2n);
 if(spread)x=fixed(x,.75);
 x=fixed(x,w);
 return x;
}
function finalRoll(base,percent,ability,stab,eff,item,screen,other){
 if(base<=0||eff<=0||screen<=0)return 0;
 let x=Math.floor(base*percent/100);
 x=fixed(fixed(x,ability),stab);x=Math.floor(x*eff);
 const parts=[screen===2/3?2732/4096:screen,other,1,item===1.3?5324/4096:item];
 const chain=parts.reduce((acc,m)=>(acc*BigInt(Math.round(m*4096))+2048n)/4096n,4096n);
 x=Number((BigInt(x)*chain+2047n)/4096n);
 return Math.max(1,x);
}
const rng=(()=>{let seed=0x2048ab19;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}})();
const pick=a=>a[Math.floor(rng()*a.length)];
for(let i=0;i<15000;i++){
 const p=1+Math.floor(rng()*180),a=1+Math.floor(rng()*500),d=1+Math.floor(rng()*500);
 const spread=rng()<.5,w=pick([0,.5,1,1.5]),t=pick([.5,1,1.3]);
 const expected=baseline(p,a,d,spread,w,t);
 assert.equal(core.baseDamage(p,a,d,spread,w,t),expected,`core base ${i}`);checks++;
 const roll=85+Math.floor(rng()*16), mods=[pick([.5,1,1.3,1.5]),pick([1,1.5,2]),pick([0,.25,.5,1,2,4]),pick([1,1.2,1.5]),pick([.5,1]),pick([.5,1,1.3])];
 assert.equal(core.damageRoll(expected,roll,...mods),finalRoll(expected,roll,...mods),`core final ${i}`);checks++;
 const appArgs=[expected,roll,...mods];
 assert.equal(ctx.damageRollOrdered(...appArgs),finalRoll(expected,roll,...mods),`app final ${i}`);checks++;
}
// Manually inspectable exact reference fixtures.
for(const [args,expected] of [ [[40,100,100,false,1,1],19],[[40,100,100,true,1,1],14],[[40,100,100,false,1.5,1],28] ]){
 assert.equal(core.baseDamage(...args),expected);checks++;
}
assert.equal(core.damageRoll(19,100,1,1,1,1,1),19);checks++;
assert.equal(core.damageRoll(19,85,1,1,1,1,1),16);checks++;
console.log(`${checks} independent arithmetic-model differential checks passed (seed 0x2048ab19). External battle simulator parity NOT verified.`);
