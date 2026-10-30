'use strict';
// Single published open-data snapshot. Never use a base form as a Mega fallback.
const fs=require('node:fs'),assert=require('node:assert/strict');
const raw=require('../reference/usage/pokekit-champions-2026-09.json'),D=require('./data.json');
assert.equal(raw.format,'champions');assert.equal(raw.gameType,'doubles');assert.equal(raw.label,'Champions VGC reg.MC');
const records={},ids=new Set(D.species.map(s=>s.id));
for(const p of raw.pokemon){
 assert(ids.has(p.id),p.id);assert(!records[p.id],p.id);
 const seen=new Set();
 const moves=p.moves.map((m,i)=>{assert(D.moves[m.id],m.id);assert(!seen.has(m.id),m.id);seen.add(m.id);assert(Number.isFinite(m.pct)&&m.pct>=0&&m.pct<=100);assert(D.species.find(s=>s.id===p.id).moves.includes(m.id),p.id+'/'+m.id);return {id:m.id,pct:m.pct,sourceRank:i+1};});
 records[p.id]={id:p.id,moves};
}
const snapshot={source:'PokéKit',url:'https://poke.itlibra.com/opendata/usage-champions.json',aboutUrl:'https://poke.itlibra.com/ja/opendata',attribution:'Smogon / Pokémon Showdown（集計元）・PokéKit（整形）',month:raw.month,format:raw.label,battles:raw.battles,cutoff:raw.cutoff,retrievedJST:'2026-10-30',sourceMoveLimit:10,selection:'Exact form ID only; positive observed percentages; Status moves excluded before attack ranking. No invented moves or base/Mega fallback.',records};
fs.writeFileSync('source/usage.json',JSON.stringify(snapshot)+'\n');
console.log('Prepared exact-form usage:',Object.keys(records).length,'forms;',snapshot.month,snapshot.format);
