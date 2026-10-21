/* GC-I + Season 6 M-C doubles: single-download evidence snapshot.
 * Run in the browser's DevTools console ON https://www.pokemon-zone.com/.
 * This script does not inject data into the battle app and does not invent rankings.
 */
(async () => {
  if (location.hostname !== 'www.pokemon-zone.com' && location.hostname !== 'pokemon-zone.com') {
    throw new Error('Open pokemon-zone.com first; this export requires same-origin access.');
  }
  const tournament = 'https://www.pokemon-zone.com/champions/championships/ic178714271270xvovwl/';
  const season = 'https://www.pokemon-zone.com/champions/ranked-seasons/ssn6_rd178713989559pruusy/';
  const urls = [{key:'tournament.html',url:tournament},...Array.from({length:6},(_,i)=>({key:`season6-${i+1}.html`,url:season+(i?`?page=${i+1}`:'')}))];
  const entries = {};
  for (const {key,url} of urls) {
    const r = await fetch(url, {credentials:'same-origin',cache:'no-store'});
    if (!r.ok) throw new Error(`${key}: HTTP ${r.status}`);
    const html = await r.text();
    if (!html.includes('Pokémon') || !html.includes('Abilities')) throw new Error(`${key}: expected stats not found; download cancelled`);
    entries[key]={url,html};
    console.log(`Checked ${key}: ${html.length} characters`);
  }
  const payload={schema:'gc2027ii-site-html-snapshot-v1',collected_at:new Date().toISOString(),entries};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'}));
  a.download='GC2027II_stats_7pages.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),30000);
  console.log('7 source pages exported in one file. No app data changed.');
})().catch(e=>console.error('Export failed (no partial file written):',e));
