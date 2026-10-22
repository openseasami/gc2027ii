#!/usr/bin/env node
// Release integrity checks. Run: node verify-release.js
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=__dirname;
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'), sw=read('sw.js'), manifest=JSON.parse(read('manifest.webmanifest'));
let checks=0;
function check(name,fn){try{fn();checks++;console.log('PASS',name)}catch(e){console.error('FAIL',name,':',e.message);process.exitCode=1}}
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
check('HTML inline scripts compile',()=>{assert.ok(scripts.length>0);scripts.forEach(s=>new vm.Script(s));});
check('shared engine ships offline',()=>{assert.ok(html.includes('<script src="./critical-effects.js"></script>'));assert.ok(sw.includes("'./critical-effects.js'"));const core=require('./battle-core.js');assert.equal(core.version,'2.5.4');assert.equal(require('./rank-effects.js').version,'1.0.0');assert.ok(html.includes('<script src="./rank-effects.js"></script>'));assert.ok(sw.includes("'./rank-effects.js'"));assert.ok(html.includes('<script src="./battle-core.js"></script>'));assert.ok(sw.includes("'./battle-core.js'"));assert.ok(sw.includes("'./priority-engine.js'"));assert.ok(html.includes('<script src="./priority-engine.js"></script>'))});
check('service worker compiles and navigation fallback points to correct URL',()=>{new vm.Script(sw); assert.ok(sw.includes("new URL('./index.html', self.registration.scope)"));});
check('offline shell files are included',()=>{for(const file of ['index.html','sw.js','manifest.webmanifest','icon-192.png','icon-512.png'])assert.ok(fs.existsSync(path.join(root,file)),file)});
check('manifest icons exist',()=>{assert.ok(Array.isArray(manifest.icons));for(const i of manifest.icons){assert.ok(i.src);assert.ok(fs.existsSync(path.join(root,i.src)),i.src)}});
const titleVersion=html.match(/<title>[^<]*?(v\d+\.\d+\.\d+)<\/title>/)?.[1];
const cacheVersion=sw.match(/const CACHE = CACHE_PREFIX \+ '(v\d+\.\d+\.\d+)'/)?.[1];
const readmeVersion=read('README.txt').match(/^(v\d+\.\d+\.\d+)/)?.[1];
check('HTML, cache and README versions agree',()=>{assert.ok(titleVersion);assert.equal(titleVersion,cacheVersion);assert.equal(titleVersion,readmeVersion)});
function literal(name){let s=html.match(new RegExp('^const '+name+'\\s*=\\s*(.*);$','m'))?.[1];assert.ok(s,`missing ${name}`);return vm.runInNewContext('('+s+')',{}, {timeout:15000});}
const dex=literal('NATIONAL_DEX'), moves=literal('NATIONAL_MOVES'), abilities=literal('ABILITY_SUPPORT'), regulation=literal('REGULATION_MC');
check('national dex entries have usable structure',()=>{assert.ok(Object.keys(dex).length>=1000);for(const [name,p] of Object.entries(dex)){assert.ok(name);assert.ok(Number.isInteger(p.num)&&p.num>0,`${name}: dex number`);assert.ok(Array.isArray(p.types)&&p.types.length>0,`${name}: types`);assert.ok(Array.isArray(p.abilities),`${name}: abilities`);assert.ok(Array.isArray(p.moves),`${name}: moves`);for(const k of ['hp','atk','def','spa','spd','spe'])assert.ok(Number.isFinite(p[k])&&p[k]>0,`${name}: ${k}`)}});
check('ability coverage matches listed abilities',()=>{const seen=new Set(regulation.mapping.filter(x=>dex[x.name]).flatMap(x=>dex[x.name].abilities));const missing=[...seen].filter(n=>!(n in abilities));assert.deepEqual(missing,[])});
check('move catalog populated',()=>{assert.ok(Object.keys(moves).length>=500)});
check('status selection consistent with save validation',()=>{for(const status of ['なし','やけど','まひ','ねむり','どく'])assert.ok(html.includes(`'${status}'`),status)});
console.log(`${checks} release integrity checks passed${process.exitCode?' (with failures)':''}. This does not replace browser or battle-engine runtime tests.`);
