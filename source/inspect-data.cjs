const fs=require('fs'),vm=require('vm'),C=require('@smogon/calc');
const path=require('path');const legacyRoot=process.argv[2];if(!legacyRoot)throw Error('Read-only legacy identity extraction: node source/inspect-data.cjs <legacy-repository>');
const old=fs.readFileSync(path.join(legacyRoot,'index.html'),'utf8');
function lit(n){return vm.runInNewContext('('+old.match(new RegExp('^const '+n+'\\s*=\\s*(.*);$','m'))[1]+')')}
const dex=lit('NATIONAL_DEX'),mc=lit('REGULATION_MC'),moves=lit('NATIONAL_MOVES'),byid=Object.fromEntries(Object.entries(dex).map(([n,d])=>[d.id,{...d,name:n}]));
const gen=C.Generations.get(0);console.log('gen0 notMC',Array.from(gen.species).filter(s=>!Object.values(mc.entries).some(d=>d.id===s.id)).map(s=>s.name));console.log('gen0 unmapped',Array.from(gen.species).filter(s=>!byid[s.id]).map(s=>s.name));console.log('entry species count',Object.keys(mc.entries).length,'dex',Object.keys(dex).length,'moves',Object.keys(moves).length);console.log('item',mc.items.slice(0,3));console.log('movesample',Object.entries(moves).slice(0,2));
const ts=fs.readFileSync(path.join(legacyRoot,'reference-data/stats-moves/showdown-pokedex.ts'),'utf8'),p=vm.runInNewContext('('+ts.slice(ts.indexOf('=')+1).trim().replace(/;$/,'' )+')');
let ab={},conflicts=[];for(const [ja,d] of Object.entries(dex)){const pd=p[d.id];if(pd?.abilities&&d.abilities?.length===Object.keys(pd.abilities).length){Object.values(pd.abilities).forEach((en,i)=>{const jp=d.abilities[i];if(ab[en]&&ab[en]!==jp)conflicts.push([en,ab[en],jp]);ab[en]=jp})}}
console.log('abilitiesmapped',Object.keys(ab).length,'conflicts',conflicts.slice(0,10));console.log('unmapped g0abi',Array.from(gen.abilities).filter(a=>!ab[a.name]).map(a=>a.name));
fs.writeFileSync('reference/legacy-identity.json',JSON.stringify({dex,moves,items:mc.items,megaInfo:mc.megaInfo,abilityNames:ab,curatedMcIds:Object.values(mc.entries).map(d=>d.id)},null,2));
