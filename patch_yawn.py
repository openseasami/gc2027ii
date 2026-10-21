from pathlib import Path
p=Path(__file__).with_name('index.html')
s=p.read_text()
old="""      // A newly acquired status takes precedence; never overwrite an observed one.
      if((d.hp??100)>0&&(!d.status||d.status==='なし'))d.status='ねむり';
      d.yawnTurns=null;
"""
new="""      // Sleep immunity is checked at resolution too: terrain may change after Yawn lands.
      // Do not assume a missing field/grounding observation proves immunity.
      const name=state[side+'Team']?.[idx];
      const terrain=typeof $==='function'?$('terrain')?.value:null;
      const grounded=name&&typeof isGroundedPokemon==='function'
        ?isGroundedPokemon(name,side,idx):false;
      const blockedByTerrain=grounded&&(terrain==='エレキ'||terrain==='ミスト');
      // A newly acquired status takes precedence; never overwrite an observed one.
      if(!blockedByTerrain&&(d.hp??100)>0&&(!d.status||d.status==='なし'))d.status='ねむり';
      d.yawnTurns=null;
"""
assert old in s
p.write_text(s.replace(old,new,1))
