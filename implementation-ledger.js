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
// Preserve the original projection counters, but assess all four stages separately.
const policy=JSON.parse(fs.readFileSync(path.join(root,'PRIORITY_POLICY.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(root,'MECHANICS_EVIDENCE.json'),'utf8'));
const itemNames=[...new Set(regulation.items.map(x=>x.name))].sort();
const megaNames=Object.keys(regulation.megaInfo).sort();
const sourceLines=html.split('\n');
function inventory(category,names,projected=new Set()){
  return names.map(name=>{
    const rates=Object.values(policy.records).flatMap(record=>{
      const rate=record[category]?.[name];return Number.isFinite(rate)?[rate]:[];
    });
    const maxObservedPercent=rates.length?Math.max(...rates):null;
    const priority=maxObservedPercent===null?'unknown':category==='abilities'?(maxObservedPercent>7?'target':'defer'):(maxObservedPercent>=10?'target':'defer');
    const groups=evidence.groups.filter(g=>g.category===category&&g.names.includes(name));
    const unitTests=[...new Set(groups.flatMap(g=>g.unitTests))];
    const integrationTests=[...new Set(groups.flatMap(g=>g.integrationTests))];
    const paths=[...new Set(groups.flatMap(g=>g.paths))];
    if(projected.has(name))paths.push(category==='abilities'?'effect-engine.js:definitions':'effect-engine.js:moveDefinitions');
    if(category==='mega')paths.push('index.html:megaInfoFor','index.html:megaEvolve');
    // Mentions are discovery aids only, never implementation evidence. Omit catalog lines.
    const mentions=sourceLines.flatMap((line,i)=>line.length<20000&&line.includes(name)?[i+1]:[]);
    return {name,priority:{classification:priority,maxObservedPercent,basis:'Inherited partial adoption sample; unknown entries remain in scope.'},registration:{status:'registered',source:category==='items'?'REGULATION_MC.items':category==='mega'?'REGULATION_MC.megaInfo':'NATIONAL_DEX / REGULATION_MC.mapping'},
      effect:{status:paths.length?'partial':'requires-review',paths:[...new Set(paths)],candidateSourceLines:mentions},
      unitVerification:{status:unitTests.length?'scoped-tests-defined':'unverified',tests:unitTests},
      integrationVerification:{status:integrationTests.length?'scoped-tests-defined':'unverified',tests:integrationTests},
      authoritativeVerification:'unverified',limitations:groups.map(g=>g.scope)};
  });
}
for(const group of evidence.groups){
  const names={abilities:abilityNames,moves:moveNames,items:itemNames,mega:megaNames}[group.category];
  for(const name of group.names)if(!names?.includes(name))throw Error('Evidence outside inventory: '+group.category+'/'+name);
  for(const file of [...group.unitTests,...group.integrationTests])if(!fs.existsSync(path.join(root,file))||!(/^(test-.*\.(js|py)|browser_.*\.py)$/.test(file)))throw Error('Missing evidence test '+file);
}
data.schemaVersion=2;data.completion=false;data.releaseGate.completion=false;
data.inventory={abilities:inventory('abilities',abilityNames,projectedAbilities),moves:inventory('moves',moveNames,projectedMoves),items:inventory('items',itemNames),mega:inventory('mega',megaNames)};
data.items={status:'partial; per-item evidence inventory available',total:itemNames.length};
data.mega={status:'partial; generic transformation path identified, per-form authoritative oracle missing',total:megaNames.length};
data.outOfCatalogEvidence=evidence.outOfCatalogEvidence||[];
data.prioritySource={file:'PRIORITY_POLICY.json',scopeNote:policy.scopeNote,dataCoverage:policy.dataCoverage};
data.assessmentRules={projectionAbsence:'Not proof of missing implementation: inspect HTML and shared math paths.',testEvidence:'Tests cover only their explicit scenarios; execution outcomes are in TEST_RESULTS.json.',sourceMentions:'Candidate source lines are discovery hints, not verified implementation.',legality:'Regulation catalog is inherited and requires external confirmation for the target event.'};
data.stageSummary=Object.fromEntries(Object.entries(data.inventory).map(([category,rows])=>[category,{registered:rows.length,partialEffect:rows.filter(r=>r.effect.status==='partial').length,requiresReview:rows.filter(r=>r.effect.status==='requires-review').length,unitTestsDefined:rows.filter(r=>r.unitVerification.tests.length).length,integrationTestsDefined:rows.filter(r=>r.integrationVerification.tests.length).length,authoritativelyVerified:0}]));
require('./coverage-assessment.js').assess(data);
const out=path.join(root,'IMPLEMENTATION_LEDGER.json');fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({abilityProjection:data.abilities.projectedSubset,abilityTotal:data.abilities.total,moveProjection:data.moves.projectedSubset,moveTotal:data.moves.total,markedUnsupported:markedUnsupported.length,releaseComplete:data.releaseGate.complete}));
