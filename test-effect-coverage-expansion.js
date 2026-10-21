const assert=require('node:assert/strict');
const e=require('./effect-engine.js');
const safe=[['こわいかお','spe',-2],['うそなき','spd',-2],['あまえる','atk',-2],['すなかけ','acc',-1],['えんまく','acc',-1]];
for(const [name,stat,delta] of safe){
 const r=e.evaluate('on_move_used',{move:name,succeeded:true});
 assert.equal(r.unknown,false,name);assert.equal(r.events.length,1,name);
 assert.equal(r.events[0].stat,stat);assert.equal(r.events[0].stages,delta);
 assert.equal(e.evaluate('on_move_used',{move:name,succeeded:false}).events.length,0);
 assert.equal(e.evaluate('on_move_used',{move:name}).unknown,true);
}
const catalog=new Set(e.moveDefinitions.map(x=>x.name));assert.equal(catalog.size,e.moveDefinitions.length);
console.log('PASS expanded effects and conditional safety');
