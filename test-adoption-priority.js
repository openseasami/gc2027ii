const a=require('node:assert/strict'),fs=require('node:fs');
const d=JSON.parse(fs.readFileSync(__dirname+'/PRIORITY_POLICY.json'));let checks=0;
for(const [name,p] of Object.entries(d.records)){for(const [move,v] of Object.entries(p.moves)){a.ok(v>=0&&v<=100);a.equal(v>=d.policy.moveMinPercent,v>=10);checks++}for(const [ab,v] of Object.entries(p.abilities)){a.ok(v>=0&&v<=100);a.equal(v>d.policy.abilityExcludeAtOrBelowPercent,v>7);checks++}}
a.equal(d.records['オオニューラ'].abilities['かるわざ'],89.1);a.equal(d.records['オオニューラ'].abilities['どくしゅ'],10.4);
a.ok(d.scopeNote.includes('NOT classified'));
console.log(`${checks} adoption policy values checked across ${Object.keys(d.records).length} species`);
