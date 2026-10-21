const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(__dirname+'/index.html','utf8');
const a=s.indexOf('function forecastGroundedForTerrain('), b=s.indexOf('function forecastCommonSecondaryStatus(',a);
assert.ok(a>0&&b>a);const ctx={BATTLE_DATA:{}};vm.createContext(ctx);vm.runInContext(s.slice(a,b)+'\nthis.g=forecastGroundedForTerrain;',ctx);
const g=ctx.g;let n=0;function check(result,expected){assert.equal(result,expected);n++}
check(g('test','', '',['じめん']),true);
check(g('test','', '',['ひこう']),false);
check(g('test','ふゆう','',['どく']),false);
check(g('test','','ふうせん',['どく']),false);
check(g('test','','くろいてっきゅう',['ひこう']),true);
check(g('test','ふゆう','くろいてっきゅう',['どく']),true);
check(g('メガガブリアスZ','','',['ドラゴン']),false);
assert.ok(s.includes('grounded:forecastGroundedForTerrain('));n++;
console.log(n+' forecast grounded checks passed');
