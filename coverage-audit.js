#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function data(name){const s=html.match(new RegExp('^const '+name+'\\s*=\\s*(.*);$','m'))?.[1];if(!s)throw Error(name);return vm.runInNewContext('('+s+')',{}, {timeout:15000});}
const dex=data('NATIONAL_DEX'),moves=data('NATIONAL_MOVES'),support=data('ABILITY_SUPPORT'),reg=data('REGULATION_MC');
const selected=reg.mapping.filter(x=>dex[x.name]);
const seen=[...new Set(selected.flatMap(x=>dex[x.name].abilities))].sort();
const unsupported=seen.filter(a=>(support[a]||'').includes('固有効果は未対応'));
const explicitMoves=[...new Set(selected.flatMap(x=>dex[x.name].moves))];
const result={basis:'Static metadata audit, NOT battle-rule correctness certification',regulationMappingCount:reg.mapping.length,matchedRegulationEntries:selected.length,nationalDexRecords:Object.keys(dex).length,catalogMoves:Object.keys(moves).length,abilityNamesInRegulation:seen.length,abilitiesMarkedUnsupported:unsupported.length,unsupportedAbilityNames:unsupported,distinctMovesInSelectedDex:explicitMoves.length,moveNamesMissingFromNationalCatalog:explicitMoves.filter(m=>!moves[m]).slice(0,150),limitations:['A move appearing in a learnset is not proof it is legal under the selected regulation','A populated move catalog is not proof the move effect is implemented','A partially supported ability is not the same as complete implementation','Live browser reload, full battle accuracy, and recommendation correctness not certified']};
fs.writeFileSync(path.join(__dirname,'COVERAGE_AUDIT_v2.0.15.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({regulationMappingCount:result.regulationMappingCount,matchedRegulationEntries:result.matchedRegulationEntries,abilityNamesInRegulation:seen.length,abilitiesMarkedUnsupported:unsupported.length,distinctMovesInSelectedDex:explicitMoves.length,moveNamesMissingFromNationalCatalog:result.moveNamesMissingFromNationalCatalog.length},null,2));
