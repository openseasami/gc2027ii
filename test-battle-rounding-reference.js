const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const snippet=html.slice(html.indexOf('function battlePokeRound('),html.indexOf('function damageRollOrdered('));
const ctx={weatherMod:()=>1};vm.createContext(ctx);vm.runInContext(snippet,ctx);
const independent=(x,m)=>{const n=Math.round(m*4096);return Math.floor((x*n+2047)/4096)};
let count=0;
for(let b=1;b<=400;b++)for(const m of [.5,.75,1,1.5]){
 assert.equal(ctx.battlePokeRound(b,m),independent(b,m));count++;
}
assert.equal(ctx.battlePokeRound(6,.75),4); // 4.5 tie down
assert.equal(ctx.battlePokeRound(7,.75),5); // 5.25
assert.equal(ctx.battlePokeRound(7,1.5),10); // 10.5 tie down
assert.equal(ctx.battlePokeRound(9,1.5),13); // 13.5 tie down
let differs=0;
for(const p of [35,50,75,100,150])for(const a of [70,100,150,230])for(const d of [75,125,190]){
 ctx.weatherMod=()=>1.5;
 const raw=Math.floor(Math.floor(22*p*a/d)/50)+2;
 const got=ctx.battleBaseDamage(p,a,d,true,'ほのお',1);
 const expected=independent(independent(raw,.75),1.5);
 assert.equal(got,expected);count++;
 const old=Math.floor(Math.floor(raw*.75)*1.5);if(old!==got)differs++;
}
assert.ok(differs>0,'expected actual correction to legacy always-floor result');
console.log(`${count+4} fixed-point rounding references passed; ${differs} cases changed from old floor method`);
