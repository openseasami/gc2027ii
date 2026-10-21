const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const txt=fs.readFileSync(__dirname+'/index.html','utf8');
const snippet=txt.slice(txt.indexOf('function battlePokeRound('),txt.indexOf('function damageRollOrdered('));
const ctx={weatherMod:()=>1};vm.createContext(ctx);vm.runInContext(snippet,ctx);
const old=(p,a,d,spread,w,t)=>{let b=Math.floor(Math.floor(Math.floor((22*Math.max(1,Math.floor(p))*a)/Math.max(1,d))/50)+2);const round=(v,m)=>Math.floor((v*Math.round(m*4096)+2047)/4096);if(spread)b=round(b,.75);b=round(b,w);return Math.floor(b*t)};
let checks=0;
for(const p of [1,37,50,75,100,150])for(const a of [85,132,214])for(const d of [90,140,212])for(const spread of [false,true])for(const w of [.5,1,1.5])for(const terrain of [.5,1,1.3]){ctx.weatherMod=()=>w;assert.equal(ctx.battleBaseDamage(p,a,d,spread,'ほのお',terrain),old(p,a,d,spread,w,terrain));checks++}
assert.match(txt,/base=battleBaseDamage\(power\*mods\.power,atk,def,mv\.spread/);
assert.match(txt,/base=battleBaseDamage\(power\*mods\.power,atk,def,\(mv\.spread\|\|action\.spread\)/);
console.log(`${checks+2} shared damage-base regression checks passed`);
