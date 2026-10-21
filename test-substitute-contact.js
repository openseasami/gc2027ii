#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const code=src.slice(src.indexOf('function projectedContactsAfterSubstitute('),src.indexOf('// v1.98.3: contact-punishment'));
const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);
const f=ctx.projectedContactsAfterSubstitute;
for(const [args,expected] of [ [[4,20,100,0],4],[[4,20,35,0],2],[[4,20,100,30],2],[[4,20,35,30],2],[[2,20,100,40],0],[[1,20,100,10],0],[[4,20,15,20],1],[[4,20,100,NaN],4] ]){
 assert.equal(f(...args),expected,JSON.stringify(args)); console.log('PASS',JSON.stringify(args));
}
console.log('8 Substitute/contact forecast checks passed');
