#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf("const MODE45_STORE='gc2027ii_mode45_test';");const end=html.indexOf("document.querySelectorAll('[data-terrain-quick]')",start);assert(start>=0&&end>start);
let count=0;
function run(stored){let mode=false,storage=stored===undefined?{}:{gc2027ii_mode45_test:stored}, label='';const ctx={document:{body:{classList:{toggle:(key,on)=>mode=on,contains:()=>mode}}},$:id=>id==='mode45Btn'?{set textContent(v){label=v}}:id==='battleArea'?{classList:{contains:()=>true}}:null,localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v},updateGuide45(){},syncDockSpace(){}};vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);return {mode,storage,label};}
for(const [stored,expected] of [[undefined,true],['0',false],['1',true]]){const x=run(stored);assert.equal(x.mode,expected);assert.equal(x.storage.gc2027ii_mode45_test,expected?'1':'0');assert.equal(x.label,`45秒モード：${expected?'ON':'OFF'}`);count+=3;}
console.log(`${count} mode45 reload assertions passed`);
