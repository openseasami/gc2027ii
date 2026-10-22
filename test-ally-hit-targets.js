const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {Dex}=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const s=fs.readFileSync('index.html','utf8'),ctx={};vm.createContext(ctx);
vm.runInContext(s.slice(s.indexOf('const ALLY_HIT_MOVES='),s.indexOf('function planAllyDamageRisk('))+';globalThis.names=[...ALLY_HIT_MOVES]',ctx);
const moves=JSON.parse(s.match(/^const NATIONAL_MOVES=(.*);$/m)[1]);
for(const name of ctx.names)assert.equal(Dex.moves.get(moves[name].id).target,'allAdjacent',name);
assert.ok(!ctx.names.includes('いわなだれ'),'opponent-only spread is excluded');
console.log(`PASS ${ctx.names.length} ally-hitting target definitions vs pinned Showdown`);
