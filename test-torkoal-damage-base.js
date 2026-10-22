const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const txt=fs.readFileSync(__dirname+'/index.html','utf8');
const snippet=txt.slice(txt.indexOf('function battlePokeRound('),txt.indexOf('function damageRollOrdered('));
const ctx={weatherMod:()=>1};vm.createContext(ctx);vm.runInContext(snippet,ctx);
const reference=(p,a,d,spread,w,t)=>{const round=(v,m)=>Math.floor((v*Math.round(m*4096)+2047)/4096);const bp=Math.max(1,round(p,t));let b=Math.floor(Math.floor(Math.floor(22*bp*a/d)/50)+2);if(spread)b=round(b,.75);return round(b,w)};
let checks=0;
for(const p of [1,37,50,75,100,150])for(const a of [85,132,214])for(const d of [90,140,212])for(const spread of [false,true])for(const w of [.5,1,1.5])for(const terrain of [.5,1,1.3]){ctx.weatherMod=()=>w;assert.equal(ctx.battleBaseDamage(p,a,d,spread,'ほのお',terrain),reference(p,a,d,spread,w,terrain));checks++}
assert.match(txt,/base=battleBaseDamage\(modifiedPower,atk,def,mv\.spread/);
assert.match(txt,/base=battleBaseDamage\(modifiedPower,atk,def,\(mv\.spread\|\|action\.spread\)/);
console.log(`${checks+2} shared damage-base regression checks passed`);
