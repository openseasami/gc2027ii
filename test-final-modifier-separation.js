const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const src=html.slice(html.indexOf('function damageRollOrdered('),html.indexOf('// v1.77.4:',html.indexOf('function damageRollOrdered(')));
assert.ok(src.includes('otherFinal'));
const sandbox={battlePokeRound:require('./battle-core.js').pokeRound};vm.createContext(sandbox);vm.runInContext(src,sandbox);
let examined=0, differences=0;
for(let base=1;base<=240;base++)for(let roll=85;roll<=100;roll++)for(const screen of [.5,2/3,1])for(const finalMod of [.5,.75,1,1.3]){
 const round=(v,m)=>Math.floor((v*Math.round(m*4096)+2047)/4096);
 const sf=screen===2/3?2732/4096:screen;
 const chained=Math.floor((Math.round(sf*4096)*Math.round(finalMod*4096)+2048)/4096)/4096;
 const expected=round(Math.floor(base*roll/100),chained);
 const actual=sandbox.damageRollOrdered(base,roll,1,1,1,1,screen,finalMod);
 assert.equal(actual,Math.max(1,expected));
 const combined=sandbox.damageRollOrdered(base,roll,1,1,1,1,screen*finalMod);
 if(actual!==combined)differences++;
 examined++;
}
assert.ok(differences>0);
assert.ok(html.includes('damageRollOrdered(base,r,1,stab,eff,item,screen,mods.final,burn,critical&&criticalProfile.sniper?1.5:1,berry.factor)'));
assert.ok(html.includes('damageRollOrdered(base,r,1,stab,eff,item,screen,fullHpGuard,burn,critical&&criticalProfile.sniper?1.5:1,berry.factor)'));
console.log(`${examined} modifier chains checked, ${differences} combined-rounding differences detected`);
