const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const src=html.slice(html.indexOf('function damageRollOrdered('),html.indexOf('// v1.77.4:',html.indexOf('function damageRollOrdered(')));
assert.ok(src.includes('otherFinal'));
const sandbox={};vm.createContext(sandbox);vm.runInContext(src,sandbox);
let examined=0, differences=0;
for(let base=1;base<=240;base++)for(let roll=85;roll<=100;roll++)for(const screen of [.5,2/3,1])for(const finalMod of [.5,.75,1,1.3]){
 const expected=[1,1,1,1,screen,finalMod].reduce((d,m)=>Math.floor(d*m),Math.floor(base*roll/100));
 const actual=sandbox.damageRollOrdered(base,roll,1,1,1,1,screen,finalMod);
 assert.equal(actual,Math.max(1,expected));
 const combined=sandbox.damageRollOrdered(base,roll,1,1,1,1,screen*finalMod);
 if(actual!==combined)differences++;
 examined++;
}
assert.ok(differences>0);
assert.ok(html.includes('damageRollOrdered(base,r,abilityMod,stab,eff,item,screen,mods.final)'));
assert.ok(html.includes('damageRollOrdered(base,r,abilityMod,stab,eff,item,screen,fullHpGuard)'));
console.log(`${examined} modifier chains checked, ${differences} combined-rounding differences detected`);
