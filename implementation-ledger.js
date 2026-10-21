#!/usr/bin/env node
/* Scope inventory: registration, projection and verification are deliberately different states. */
const fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const root=__dirname, html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function literal(name){const match=html.match(new RegExp('^const '+name+'\\s*=\\s*(.*);$','m'));if(!match)throw Error('Missing catalog '+name);return vm.runInNewContext('('+match[1]+')',{}, {timeout:15000});}
const dex=literal('NATIONAL_DEX'),moves=literal('NATIONAL_MOVES'),abilities=literal('ABILITY_SUPPORT'),regulation=literal('REGULATION_MC');
const engine=require('./effect-engine.js');
const selected=regulation.mapping.filter(x=>dex[x.name]);
const abilityNames=[...new Set(selected.flatMap(x=>dex[x.name].abilities))].sort();
const moveNames=[...new Set(selected.flatMap(x=>dex[x.name].moves))].sort();
const projectedAbilities=new Set(engine.definitions.map(x=>x.name));
const projectedMoves=new Set(engine.moveDefinitions.map(x=>x.name));
const markedUnsupported=abilityNames.filter(a=>String(abilities[a]||'').includes('固有効果は未対応'));
const buckets=(names,projected)=>({total:names.length,projectedSubset:names.filter(n=>projected.has(n)).length,withoutProjection:names.filter(n=>!projected.has(n)),note:'Projection presence does not certify complete mechanics or legality.'});
const tests=fs.readdirSync(root).filter(n=>/^test-.*\.js$/.test(n)).sort();
const conditionalMoves=engine.moveDefinitions.filter(x=>x.conditional).map(x=>({name:x.name,condition:x.conditional}));
const unconditionalMoves=engine.moveDefinitions.filter(x=>!x.conditional).map(x=>x.name);
const data={generatedAt:new Date().toISOString(),conditionalMoveProjections:{total:conditionalMoves.length,entries:conditionalMoves,requiresExplicitVerification:true},unconditionalMoveProjections:{total:unconditionalMoves.length,entries:unconditionalMoves},scope:{regulationEntries:regulation.mapping.length,matchedEntries:selected.length},abilities:{...buckets(abilityNames,projectedAbilities),markedUnsupported},moves:{...buckets(moveNames,projectedMoves),missingCatalog:moveNames.filter(n=>!moves[n])},items:{status:'partial; no comprehensive item effect inventory'},mega:{status:'preserved; no complete transformation oracle'},battle:{status:'partial; no full-match authoritative E2E oracle'},tests:{availableFiles:tests.length,files:tests},releaseGate:{complete:false,reason:'All four phases require validated coverage and authoritative match scenarios; projected subsets are not full implementation.'}};
if(new Set(engine.definitions.map(x=>x.name)).size!==engine.definitions.length)throw Error('duplicate ability projection');
if(new Set(engine.moveDefinitions.map(x=>x.name)).size!==engine.moveDefinitions.length)throw Error('duplicate move projection');
const out=path.join(root,'IMPLEMENTATION_LEDGER.json');fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({abilityProjection:data.abilities.projectedSubset,abilityTotal:data.abilities.total,moveProjection:data.moves.projectedSubset,moveTotal:data.moves.total,markedUnsupported:markedUnsupported.length,releaseComplete:data.releaseGate.complete}));
