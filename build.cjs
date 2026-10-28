const fs=require('fs'),esbuild=require('esbuild');
const out=esbuild.buildSync({entryPoints:['source/app.cjs'],bundle:true,write:false,minify:true,platform:'browser',format:'iife',target:['chrome110','edge110'],legalComments:'inline'}).outputFiles[0].text;
const notice='<!-- Third-party software: @smogon/calc and Pokémon Showdown data.\n'+fs.readFileSync('vendor/smogon-calc-LICENSE.txt','utf8')+'\n'+fs.readFileSync('vendor/pokemon-showdown-LICENSE.txt','utf8')+'\nPokémon image assets belong to their respective rights holders; supplied from PokeAPI/sprites. -->\n';
const html=fs.readFileSync('source/template.html','utf8').replace('<head>','<head>\n'+notice).replace('/*INLINE_APP*/',()=>out.replace(/<\/script/gi,'<\\/script'));
new (require('node:vm').Script)(html.match(/<script>([\s\S]*)<\/script>/)[1]);
fs.writeFileSync('release/GC2027II_Viewer_v9.html',html);console.log('Built standalone HTML',Buffer.byteLength(html),'bytes');
