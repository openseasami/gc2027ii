#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');const a=html.indexOf('function set45Mode(on){'),b=html.indexOf("if($('fixed45ExitBtn'))",a);assert(a>=0&&b>a);
const src="const MODE45_STORE='gc2027ii_mode45_test';\n"+html.slice(a,b);const classes=new Set(['compact']);const bodyClasses=new Set();const classAPI=s=>({add:k=>s.add(k),remove:k=>s.delete(k),toggle:(k,on)=>on?s.add(k):s.delete(k),contains:k=>s.has(k)});
const elements={mode45Btn:{textContent:''},damageBox:{classList:classAPI(classes)},damageToggleBtn:{textContent:''},battleArea:{classList:classAPI(new Set())}};
const saved={},calls=[];const ctx={document:{body:{classList:classAPI(bodyClasses)}},$:k=>elements[k],localStorage:{setItem:(k,v)=>saved[k]=v},renderDamageOutput:v=>calls.push(['damage',v]),updateGuide45:()=>calls.push(['guide']),syncDockSpace:()=>calls.push(['dock'])};vm.createContext(ctx);vm.runInContext(src,ctx);
let n=0;function eq(a,b,m){assert.deepEqual(a,b,m);n++}
ctx.set45Mode(true);eq(bodyClasses.has('mode45'),true,'enabled');eq(classes.has('compact'),false,'damage visible');eq(elements.mode45Btn.textContent,'45秒モード：ON','label on');eq(saved.gc2027ii_mode45_test,'1','persist on');eq(calls.some(x=>x[0]==='guide'),true,'guide refresh');
ctx.set45Mode(false);eq(bodyClasses.has('mode45'),false,'disabled');eq(elements.mode45Btn.textContent,'45秒モード：OFF','label off');eq(saved.gc2027ii_mode45_test,'0','persist off');console.log(`${n} fixed 45 mode assertions passed`);
