const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const a=html.indexOf('const MULTI_STRIKE_FLINCH_SECONDARIES='),b=html.indexOf('function planCommonSecondaryForecast(');
const kernel=html.slice(html.indexOf('function perStrikeSecondaryProbability('),html.indexOf('function forecastMultiStrikeFlinch('));
const meta=html.slice(a,html.indexOf('function forecastGroundedForTerrain(',a));
const forecast=html.slice(html.indexOf('function forecastMultiStrikeFlinch('),b);
const ctx={};vm.createContext(ctx);vm.runInContext(meta+kernel+forecast+';this.forecast=forecastMultiStrikeFlinch;',ctx);
let n=0;function check(value,want){assert.ok(Math.abs(value-want)<1e-10,`${value} vs ${want}`);n++}
check(ctx.forecast('ダブルパンツァー',1).probability,.51);
check(ctx.forecast('ダブルパンツァー',.8).probability,.408);
check(ctx.forecast('ダブルパンツァー',1,{substituteHp:10,damagePerStrike:20}).probability,.3);
check(ctx.forecast('ダブルパンツァー',1,{substituteHp:50,damagePerStrike:20}).probability,0);
check(ctx.forecast('ダブルパンツァー',1,{targetHp:10,damagePerStrike:20}).probability,.3);
check(ctx.forecast('ダブルパンツァー',1,{blocked:true}).probability,0);
assert.equal(ctx.forecast('れいとうビーム',1),null);n++;
console.log(`${n} multi-strike flinch forecast checks passed`);
