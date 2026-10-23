const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),src=html.slice(html.indexOf('function commitEntryFieldEffect('),html.indexOf('function triggerEntryAbility('));
const fields={weather:{value:'雨'},weatherTurns:{value:'3'},terrain:{value:'グラス'},terrainTurns:{value:'2'}};let effect={kind:'weather',weather:'雨',turns:8};
const ctx={$:id=>fields[id],confirmedEntryEffect:()=>effect,setTerrainState:(t,n)=>{fields.terrain.value=t;fields.terrainTurns.value=String(n)}};vm.createContext(ctx);vm.runInContext(src,ctx);
assert.equal(ctx.commitEntryFieldEffect(),false);assert.equal(fields.weatherTurns.value,'3');effect.weather='晴れ';assert.equal(ctx.commitEntryFieldEffect(),true);assert.equal(fields.weather.value,'晴れ');assert.equal(fields.weatherTurns.value,'8');
effect={kind:'terrain',terrain:'グラス',turns:5};assert.equal(ctx.commitEntryFieldEffect(),false);assert.equal(fields.terrainTurns.value,'2');effect.terrain='エレキ';assert.equal(ctx.commitEntryFieldEffect(),true);assert.equal(fields.terrainTurns.value,'5');
fields.weather.value='なし';effect={kind:'weather',weather:'雨',turns:5};assert.equal(ctx.commitEntryFieldEffect(),true);assert.equal(fields.weatherTurns.value,'5');effect=null;assert.equal(ctx.commitEntryFieldEffect(),false);
console.log('PASS actual entry setter: matching weather/terrain retains duration; different/expired/unknown fields');
