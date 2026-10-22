/* Reference discovery only: a name/slot match never certifies Champions mechanics. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const dex=vm.runInNewContext('('+html.match(/^const NATIONAL_DEX\s*=\s*(.*);$/m)[1]+')');
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const version=require(require.resolve('pokemon-showdown/package.json',{paths:[__dirname,__dirname+'/work/oracle']})).version;assert.equal(version,'0.11.10');
const candidates=new Map();
for(const row of Object.values(dex)){
 const species=ps.Dex.species.get(row.id);if(!species.exists)continue;
 const abilities=[...new Set(Object.values(species.abilities))];if(abilities.length!==row.abilities.length)continue;
 row.abilities.forEach((jp,i)=>{const set=candidates.get(jp)||new Set();set.add(ps.toID(abilities[i]));candidates.set(jp,set);});
}
const names=JSON.parse(fs.readFileSync(__dirname+'/ABILITY_REVIEW_BASELINE.json')).names;
const entries=names.map(name=>{const ids=[...(candidates.get(name)||[])];const unique=ids.length===1;const ability=unique?ps.Dex.abilities.get(ids[0]):null;return {name,identityStatus:unique?'unambiguous inherited species-slot correspondence; not externally confirmed Japanese identity':'requires identity review',candidateIds:ids,referenceDescription:ability?.desc||null,referenceFlags:ability?.flags||{},referenceHooks:ability?Object.keys(ability).filter(k=>/^on[A-Z]/.test(k)&&typeof ability[k]==='function'):[],remaining:'Each reference hook needs an explicit app scope and independent scenario; empty hooks do not imply no effect.'};});
fs.writeFileSync(__dirname+'/ABILITY_REFERENCE_HOOKS.json',JSON.stringify({completion:false,oracle:'pokemon-showdown',version,meaning:'Research leads, not implementation or official event-rule evidence. Species slot correspondence may differ between games.',entries},null,2)+'\n');
console.log(`PASS reference research index for ${entries.length} original unsupported ability labels; ${entries.filter(r=>r.candidateIds.length===1).length} unambiguous slot correspondences`);
