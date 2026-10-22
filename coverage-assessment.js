/* Exact AST references are discovery evidence, never a proof of complete mechanics. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const acorn=require(require.resolve('acorn',{paths:[__dirname,__dirname+'/work/audit']}));
const root=__dirname,read=n=>fs.readFileSync(path.join(root,n),'utf8');
function executableIndex(sources){
 const index=new Map();
 for(const [file,source]of Object.entries(sources)){
  const chunks=file.endsWith('.html')?[...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>({text:m[1],offset:source.slice(0,m.index+m[0].indexOf('>')+1).split('\n').length-1})):[{text:source,offset:0}];
  for(const chunk of chunks){
   const tree=acorn.parse(chunk.text,{ecmaVersion:'latest',locations:true});
   function walk(node,fn){
    if(!node||typeof node!=='object')return;
    if(node.type==='FunctionDeclaration')fn=node.id?.name||fn;
    // Ignore top-level catalog registration literals. Exact equality avoids substrings in move names.
    if(node.type==='Literal'&&typeof node.value==='string'&&fn){
     const refs=index.get(node.value)||[];const ref=`${file}:${fn}:${node.loc.start.line+chunk.offset}`;
     if(!refs.includes(ref))refs.push(ref);index.set(node.value,refs);
    }
    for(const [key,value]of Object.entries(node))if(key!=='loc'){
     if(Array.isArray(value))for(const child of value)walk(child,fn);else if(value&&typeof value==='object')walk(value,fn);
    }
   }
   walk(tree,null);
  }
 }
 return index;
}
function assess(data){
 const files=['critical-effects.js','index.html','effect-engine.js','battle-core.js','priority-engine.js','turn-order-effects.js','rank-effects.js'];
 const sources=Object.fromEntries(files.map(f=>[f,read(f)]));const refs=executableIndex(sources);
 const plan=JSON.parse(read('COVERAGE_REVIEW_PLAN.json'));const baseline=JSON.parse(read('ABILITY_REVIEW_BASELINE.json'));
 const result=JSON.parse(read('TEST_RESULTS.json'));
 const current=[...files,'coverage-assessment.js','COVERAGE_REVIEW_PLAN.json','ABILITY_REVIEW_BASELINE.json','MECHANICS_EVIDENCE.json'].every(f=>result.sourceSha256?.[f]===crypto.createHash('sha256').update(sources[f]||read(f)).digest('hex'));
 const passed=new Set(current?result.results.filter(r=>r.exitCode===0&&result.sourceSha256?.[r.command.at(-1)]===crypto.createHash('sha256').update(read(r.command.at(-1))).digest('hex')).map(r=>r.command.at(-1)):[]);
 const counts=Object.fromEntries(['未実装','部分実装','別経路で実装済み','仕様対象外','要調査'].map(x=>[x,0]));
 for(const [category,rows]of Object.entries(data.inventory))for(const row of rows){
  const override=plan.scopes.find(r=>r.category===category&&r.names.includes(row.name));
  const tests=[...new Set([...row.unitVerification.tests,...row.integrationVerification.tests,...(override?.tests||[])])];
  const scopedTestPassed=tests.length>0&&tests.every(t=>passed.has(t));
  const references=refs.get(row.name)||[];
  let classification='要調査',basis='登録や参照だけでは効果実装を確定できない。';
  if(scopedTestPassed&&(row.effect.status==='partial'||override)){
   classification=override?.alternate?'別経路で実装済み':'部分実装';basis=override?.scope||row.limitations.join(' ');
  }else if(category==='abilities'&&baseline.names.includes(row.name)&&!references.length&&!row.effect.paths.length){
   classification='未実装';basis='未対応表示があり、名前に完全一致する実行関数内参照と台帳の効果経路がともに未検出。汎用処理での代替可否は引き続き調査する。';
  }
  row.coverage={classification,assessmentScope:basis,executableReferences:references,tests,scopedTestsPassed:scopedTestPassed,fullMechanicVerified:false,remaining:'全発動条件・持続・相互作用・大会固有仕様の網羅検証は未完了。'};counts[classification]++;
 }
 data.coverageSummary={total:Object.values(counts).reduce((a,b)=>a+b,0),categories:counts,fullyImplemented:0,fullyUnverified:Object.values(counts).reduce((a,b)=>a+b,0),testEvidenceMatchesRuntime:current,meaning:'Five-way scoped implementation assessment; alternate routes are implemented only within assessmentScope, never full mechanic certification. Outside-scope requires verified rule evidence; currently none.'};
 const reference=JSON.parse(read('ABILITY_REFERENCE_HOOKS.json'));
 const reviewed=baseline.names.map(name=>{const row=data.inventory.abilities.find(r=>r.name===name);return {name,previousLabel:'固有効果は未対応',referenceResearch:reference.entries.find(r=>r.name===name),currentlyMarkedUnsupported:data.abilities.markedUnsupported.includes(name),...row.coverage,priority:row.priority,missingEffects:plan.scopes.find(r=>r.category==='abilities'&&r.names.includes(name))?.remaining||'固有効果の発動条件・状態更新・相互作用に対する独立検証が不足。参照経路のない項目はハンドラ調査と仕様根拠取得が必要。'};});
 fs.writeFileSync(path.join(root,'ABILITY_UNSUPPORTED_REVIEW.json'),JSON.stringify({completion:false,baselineCommit:baseline.baseCommit,total:reviewed.length,entries:reviewed},null,2)+'\n');
 return data;
}
module.exports={assess,executableIndex};
