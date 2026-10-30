'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),K=require('../source/core.cjs'),raw=require('../reference/usage/pokekit-champions-2026-09.json'),{TYPE_COLORS,typeColor}=require('../source/colors.cjs');
const report={completion:false,passed:false,source:K.USAGE.url,month:K.USAGE.month,formsChecked:0,missingForms:[],withFiveAttacks:0,withExtraAttacks:0,publishedShortfalls:[],checks:[]};
function check(id,fn){fn();report.checks.push({id,passed:true});}
check('published-doubles-MC-snapshot-only',()=>{assert.equal(raw.label,K.USAGE.format);assert.equal(raw.gameType,'doubles');assert.equal(raw.month,K.USAGE.month);assert.equal(raw.battles,K.USAGE.battles);assert.equal(Object.keys(K.USAGE.records).length,150);});
check('every-form-exact-ID-ranking-and-no-invented-moves',()=>{
 for(const s of K.DATA.species){const result=K.opponentMoves(s.id),source=raw.pokemon.find(p=>p.id===s.id);report.formsChecked++;
  if(!source){assert.equal(result.available,false);assert.deepEqual(result.ranked,[]);report.missingForms.push(s.id);continue;}
  const expected=source.moves.map((m,i)=>({...m,sourceRank:i+1})).filter(m=>m.pct>0&&K.DATA.moves[m.id].category!=='Status').sort((a,b)=>b.pct-a.pct).slice(0,10);
  assert.deepEqual(result.ranked.map(({rank,...m})=>m),expected,s.id);assert.deepEqual(result.main,result.ranked.slice(0,5));assert.deepEqual(result.extra,result.ranked.slice(5,10));
  if(result.main.length===5)report.withFiveAttacks++;if(result.extra.length)report.withExtraAttacks++;
  if(result.ranked.length<10)report.publishedShortfalls.push({id:s.id,attacks:result.ranked.length,reason:'Source publishes ten moves including Status. No guesses beyond published entries.'});
  for(const m of result.ranked){assert(s.moves.includes(m.id));assert(m.pct>=0&&m.pct<=100);assert.equal(m.rank,result.ranked.indexOf(m)+1);}
 }
});
check('normal-Mega-and-Mega-Z-have-independent-moves',()=>{
 const base=K.opponentMoves('garchomp'),mega=K.opponentMoves('garchompmega'),z=K.opponentMoves('garchompmegaz');
 assert.deepEqual(z.main.map(m=>m.id),['powergem','earthpower','dracometeor','flamethrower','dragonpulse']);assert(z.main.every(m=>K.DATA.moves[m.id].category==='Special'));
 assert.deepEqual(base.main.map(m=>m.id),['dragonclaw','rockslide','stompingtantrum','earthquake','rocktomb']);assert.notDeepEqual(mega.main,base.main);assert.notDeepEqual(mega.main,z.main);
 assert.equal(z.ranked.find(m=>m.id==='earthquake').rank,7);assert.equal(z.ranked.find(m=>m.id==='powergem').pct,81.7);
 // Missing Mega records may not inherit even when the base has statistics.
 const missing=K.DATA.species.filter(s=>s.isMega&&!K.USAGE.records[s.id]&&K.USAGE.records[s.baseId]);assert(missing.length);for(const s of missing)assert.deepEqual(K.opponentMoves(s.id).ranked,[]);
});
check('status-statistics-kept-but-not-used-for-damage',()=>{assert(K.USAGE.records.garchompmegaz.moves.some(m=>m.id==='protect'));assert(!K.opponentMoves('garchompmegaz').ranked.some(m=>m.id==='protect'));assert(K.DATA.moves.helpinghand);assert.equal(K.DATA.moves.helpinghand.category,'Status');});
check('move-bar-color-palette-covers-every-type',()=>{assert.equal(Object.keys(TYPE_COLORS).length,18);for(const m of Object.values(K.DATA.moves))assert.equal(typeColor(m.type),TYPE_COLORS[m.type]||TYPE_COLORS.Normal);assert.notEqual(typeColor('Ground'),typeColor('Dragon'));});
report.passed=true;fs.writeFileSync('reference/USAGE_RESULTS.json',JSON.stringify(report,null,2)+'\n');console.log('PASS usage',report.checks.length,'groups;',report.formsChecked,'forms;',report.withFiveAttacks,'five-attack forms;',report.withExtraAttacks,'with extra attacks;',report.missingForms.length,'explicitly unavailable');
