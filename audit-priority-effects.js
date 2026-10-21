#!/usr/bin/env node
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=__dirname;const policy=JSON.parse(fs.readFileSync(path.join(dir,'PRIORITY_POLICY.json'),'utf8'));
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
function readConst(name){const m=html.match(new RegExp('^const '+name+'\\s*=\\s*(.*);$','m'));if(!m)throw Error(name);return vm.runInNewContext('('+m[1]+')',{}, {timeout:10000});}
const ab=readConst('ABILITY_SUPPORT');const moves=readConst('NATIONAL_MOVES');
const ms=new Set(),as=new Set();
for(const sp of Object.values(policy.records)){for(const [n,p] of Object.entries(sp.moves))if(p>=10)ms.add(n);for(const [n,p] of Object.entries(sp.abilities))if(p>7)as.add(n);}
const unsupported=[...as].filter(n=>!ab[n] || String(ab[n]).includes('固有効果は未対応'));
const report={classification:'Static metadata only: no proof that move or ability effect is executed in the live battle engine',species:Object.keys(policy.records).length,uniqueQualifyingMoves:ms.size,uniqueQualifyingAbilities:as.size,missingMoveMetadata:[...ms].filter(n=>!moves[n]).sort(),missingAbilityMetadata:[...as].filter(n=>!ab[n]).sort(),abilitiesExplicitlyUnsupported:unsupported.sort(),abilitiesNotExplicitlyUnsupported:[...as].filter(n=>!unsupported.includes(n)).sort(),caution:'An existing catalog entry is NOT a fully implemented or correct battle effect. Independent rules and browser E2E still required.'};
fs.writeFileSync(path.join(dir,'ADOPTION_120_EFFECT_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({uniqueQualifyingMoves:report.uniqueQualifyingMoves,uniqueQualifyingAbilities:report.uniqueQualifyingAbilities,missingMoveMetadata:report.missingMoveMetadata.length,missingAbilityMetadata:report.missingAbilityMetadata.length,abilitiesExplicitlyUnsupported:report.abilitiesExplicitlyUnsupported.length}));
