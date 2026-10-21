const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('function forecastGroundedForTerrain('), end=html.indexOf('\nfunction forecastCommonSecondaryStatus(',start);
assert(start>=0&&end>start);
const ctx={BATTLE_DATA:{'メガガブリアスZ':{types:['ドラゴン','じめん']},'メガマフォクシー':{types:['ほのお','エスパー']},'飛行':{types:['ひこう']}}};vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
const cases=[['メガガブリアスZ','','',false],['メガマフォクシー','','',false],['メガマフォクシー','','くろいてっきゅう',true],['飛行','','',false],['飛行','','くろいてっきゅう',true],['メガガブリアスZ','ふゆう','',false],['メガガブリアスZ','','ふうせん',false]];
for(const [name,ability,item,want] of cases)assert.equal(ctx.forecastGroundedForTerrain(name,ability,item),want,`${name}/${ability}/${item}`);
console.log(`${cases.length} grounded form cases passed`);
