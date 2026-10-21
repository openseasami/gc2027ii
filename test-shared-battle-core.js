const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');
const core=require('./battle-core.js');const html=fs.readFileSync(__dirname+'/index.html','utf8');
const begin=html.indexOf('function applyStage('),end=html.indexOf('// v1.77.4:',begin);
assert.ok(begin>=0&&end>begin);
const script=html.slice(begin,end);
const legacy={weatherMod:()=>1};vm.createContext(legacy);vm.runInContext(script,legacy);
const integrated={BattleCore:core,weatherMod:()=>1};vm.createContext(integrated);vm.runInContext(script,integrated);
let count=0;
for(let i=1;i<=120;i++)for(const stage of [-6,-4,-2,0,2,4,6]){
 assert.equal(integrated.applyStage(i,stage),legacy.applyStage(i,stage));count++;}
for(let base=1;base<=80;base++)for(let r=85;r<=100;r++){
 const args=[base,r,1.3,1.5,2,1.2,.5,1.3];
 assert.equal(integrated.damageRollOrdered(...args),legacy.damageRollOrdered(...args));count++;}
for(let power of [1,20,50,80,100,150])for(let atk of [30,80,150,300])for(let def of [30,90,200])for(const spread of [false,true]){
 const args=[power,atk,def,spread,'ほのお',1];
 assert.equal(integrated.battleBaseDamage(...args),legacy.battleBaseDamage(...args));count++;}
assert.match(html,/<script src="\.\/battle-core\.js"><\/script>/);
assert.ok(fs.readFileSync(__dirname+'/sw.js','utf8').includes("'./battle-core.js'"));
console.log(`${count} shared-kernel parity checks passed`);
