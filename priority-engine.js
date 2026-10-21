/* Adoption policy: moves >=10%; abilities >7%; unobserved is unknown. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.PriorityEngine=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function classify(rate,kind){if(rate===null||rate===undefined||rate==='')return 'unknown';const n=Number(rate);if(!Number.isFinite(n)||n<0||n>100)throw Error('Invalid adoption rate');if(kind==='move')return n>=10?'target':'defer';if(kind==='ability')return n>7?'target':'defer';throw Error('Invalid kind')}
function entries(record,kind){const data=kind==='move'?record.moves:record.abilities;return Object.entries(data||{}).map(([name,rate])=>({name,rate,decision:classify(rate,kind)})).sort((a,b)=>b.rate-a.rate||a.name.localeCompare(b.name))}
return Object.freeze({classify,entries,version:'2.4.0'});
});
