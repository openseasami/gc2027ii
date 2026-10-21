from pathlib import Path
p=Path('effect-engine.js');s=p.read_text()
s=s.replace("    {name:'かげぶんしん',kind:'stat_boost',stat:'eva',stages:1,target:'self'}", "    {name:'かげぶんしん',kind:'stat_boost',stat:'eva',stages:1,target:'self'},\n    {name:'コットンガード',kind:'stat_boost',stat:'def',stages:3,target:'self'},\n    {name:'とける',kind:'stat_boost',stat:'def',stages:2,target:'self'},\n    {name:'ふるいたてる',kind:'multi_boost',stats:{atk:1,spa:1},target:'self'},\n    {name:'ぼうぎょしれい',kind:'multi_boost',stats:{def:1,spd:1},target:'self'},\n    {name:'ドわすれ',kind:'stat_boost',stat:'spd',stages:2,target:'self'}")
# deduplicate existing ドわすれ
s=s.replace("    {name:'ドわすれ',kind:'stat_boost',stat:'spd',stages:2,target:'self'},\n    {name:'バリアー'", "    {name:'バリアー'")
needle="    if(ability==='アイスボディ'){"
insert="""    if(ability==='ポイズンヒール'){
      // Poison Heal restores 1/8 only when poisoned; avoid adding ordinary poison loss.
      if(arguments[0]?.status===undefined)unknown=true;
      else if(['どく','もうどく'].includes(arguments[0].status))events.push({kind:'heal',amount:Math.max(1,Math.floor(maxHp/8)),source:ability});
    }
    if(ability==='サンパワー'){
      if(weather===undefined)unknown=true;
      else if(weather==='晴れ')events.push({kind:'damage',amount:Math.max(1,Math.floor(maxHp/8)),source:ability});
    }
    if(ability==='かんそうはだ'){
      if(weather===undefined)unknown=true;
      else if(weather==='雨')events.push({kind:'heal',amount:Math.max(1,Math.floor(maxHp/8)),source:ability});
      else if(weather==='晴れ')events.push({kind:'damage',amount:Math.max(1,Math.floor(maxHp/8)),source:ability});
    }
"""
s=s.replace(needle,insert+needle)
s=s.replace('function residualProjection({item,ability,weather,maxHp,types,grounded}={})','function residualProjection({item,ability,weather,maxHp,types,grounded,status}={})').replace('arguments[0]?.status===undefined','status===undefined').replace('arguments[0].status','status')
p.write_text(s)
