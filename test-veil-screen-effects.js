const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),engine=require('./effect-engine.js');
const html=fs.readFileSync('index.html','utf8');const ctx={state:{sideConditions:{my:{reflect:0,lightScreen:0},opp:{reflect:0,lightScreen:0}}}};vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function ensureSideConditions('),html.indexOf('// v2.1.2: Clear Smog')),ctx);
assert.equal(ctx.ensureSideConditions().my.auroraVeil,0,'old saves gain inactive veil');let cases=0;
for(const veil of [0,1,5,8])for(const reflect of [0,5])for(const light of [0,5])for(const cat of ['phys','spec']){
 Object.assign(ctx.state.sideConditions.my,{auroraVeil:veil,reflect,lightScreen:light});
 assert.equal(ctx.screenDamageMod('my',cat),veil>0||(cat==='phys'?reflect:light)>0?2/3:1);cases++;
}
assert.ok(engine.evaluate('on_move_used',{move:'オーロラベール',succeeded:true}).events.some(x=>x.kind==='screen'&&x.screen==='auroraVeil'&&x.turns===5));
assert.equal(engine.evaluate('on_move_used',{move:'オーロラベール',succeeded:false}).events.length,0);
console.log(`PASS ${cases} screen/veil category/stack boundaries, old-save default and success/failure projection`);
