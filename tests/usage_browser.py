"""Exact-form usage, folded lower ranks and directional/type colors via actual UI."""
def exercise_usage(page,result,root):
    original_state=page.evaluate('ViewerApp.getState().state')
    original_team=page.evaluate('ViewerApp.exportTeam()')
    def pairs():return page.locator('#calc .calc').evaluate_all('''els=>Object.fromEntries(els.map(e=>[e.dataset.pair,[...e.querySelectorAll(':scope>.damage-move-block')].map(m=>({id:m.querySelector('[data-detail-move]').dataset.detailMove,text:m.innerText}))]))''')
    def choose_form(form):page.locator('[data-form-side="opp"][data-index="1"]').select_option(form)
    before=pairs();checked=[]
    expected_z=['powergem','earthpower','dracometeor','flamethrower','dragonpulse']
    expected_base=['dragonclaw','rockslide','stompingtantrum','earthquake','rocktomb']
    for form,expected in [('garchompmegaz',expected_z),('garchomp',expected_base),('garchompmega',['earthquake','earthpower','rockslide','dragonclaw','dracometeor']),('garchompmegaz',expected_z)]:
        choose_form(form)
        for target in range(2):
            card=page.locator(f'#calc .calc[data-pair="opp1-own{target}"]')
            actual=card.locator(':scope>.damage-move-block [data-detail-move]').evaluate_all('els=>els.map(e=>e.dataset.detailMove)')
            assert actual==expected,(form,actual)
            assert 'PokéKit 2026-09' in card.locator('.usage-note').inner_text()
            extra=card.locator(':scope>.additional-attacks');assert extra.count()==1 and extra.get_attribute('open') is None
            assert not extra.locator('.damage-move-block').first.is_visible()
            extra.locator(':scope>summary').click()
            assert extra.locator('.damage-move-block').first.is_visible()
            ranks=extra.locator('.damage-move-block').evaluate_all('els=>els.map(e=>+e.dataset.attackRank)')
            assert ranks==list(range(6,6+len(ranks))) and all(6<=r<=10 for r in ranks)
            assert card.locator('[data-detail-move="protect"]').count()==0
            checked.append(dict(form=form,pair=target,main=actual,extraRanks=ranks))
            extra.locator(':scope>summary').click()
    # The lower list stays open while Helping Hand recalculates its actual damage.
    extra=page.locator('#calc .calc[data-pair="opp1-own0"]>.additional-attacks')
    extra.locator(':scope>summary').click()
    old=extra.inner_text()
    page.locator('[data-help-side="opp"][data-help-slot="1"]').click()
    assert extra.get_attribute('open') is not None and extra.inner_text()!=old
    page.locator('[data-help-side="opp"][data-help-slot="1"]').click()
    assert extra.inner_text()==old
    extra.locator(':scope>summary').click()
    assert pairs()==before
    # Bench attack lists follow the same exact-form source rather than the old four moves.
    bench_checked=page.locator('#benchCalc .calc[data-attack-side="opp"]').evaluate_all('''els=>els.map(e=>{const id=e.dataset.pair.split('-')[0];return {pair:e.dataset.pair,count:e.querySelectorAll(':scope>.damage-move-block').length,extra:e.querySelectorAll('.extra-moves>.damage-move-block').length};})''')
    assert bench_checked and all(c['count']<=5 and c['extra']<=5 for c in bench_checked)
    # Check computed CSS, not merely class names, including both attack directions.
    colors=page.locator('#calc .calc, #benchCalc .calc').evaluate_all('''els=>els.map(e=>({side:e.dataset.attackSide,border:getComputedStyle(e).borderTopColor,parts:[...e.querySelectorAll('button,.damage-bar,.condition strong,.condition-details,.additional-attacks,.combathead')].filter(x=>x.getClientRects().length).map(x=>({tag:x.className,border:getComputedStyle(x).borderTopColor})),bars:[...e.querySelectorAll('.damage-bar')].filter(x=>x.getClientRects().length).map(x=>({type:x.dataset.type,color:getComputedStyle(x.querySelector('.damage-bar-min')).backgroundColor,declared:getComputedStyle(x).getPropertyValue('--damage-type').trim(),move:x.closest('.damage-move-block')?.querySelector('.move').dataset.detailMove}))}))''')
    bar_count=0
    for c in colors:
        expected='rgb(88, 170, 255)' if c['side']=='own' else 'rgb(255, 115, 125)'
        assert c['border']==expected,c
        for part in c['parts']:assert part['border']==expected,(c['side'],part)
        for b in c['bars']:
            hexa=b['declared'].lstrip('#');rgb='rgb('+', '.join(str(int(hexa[i:i+2],16)) for i in (0,2,4))+')'
            assert b['color']==rgb,b
            bar_count+=1
    assert bar_count>0
    # Liquid Voice changes Hyper Voice to Water: bar follows each actual type condition.
    page.locator('[data-picker="opp"][data-index="0"]').click();page.locator('#pickerSearch').fill('アシレーヌ');page.locator('#pickerGrid [data-pick="primarina"]').click()
    voice=page.locator('#calc .calc[data-pair="opp0-own0"]>.damage-move-block:has([data-detail-move="hypervoice"])')
    types=voice.locator(':scope>.condition>.damage-bar').evaluate_all('els=>els.map(e=>e.dataset.type)')
    assert 'Water' in types and 'Normal' in types,types
    water=voice.locator(':scope>.condition>.damage-bar[data-type="Water"] .damage-bar-min').first
    assert water.evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(57, 123, 199)'
    page.locator('[data-picker="opp"][data-index="0"]').click();page.locator('#pickerSearch').fill('カイリュー');page.locator('#pickerGrid [data-pick="dragonite"]').click()
    for stat,value in enumerate(original_state['ranks']['opp'][0]):
        for _ in range(abs(value)):page.locator(f'[data-rank="{1 if value>0 else -1}"][data-side="opp"][data-index="0"][data-stat="{stat}"]').click()
    page.locator('[data-burn-side="opp"][data-index="0"]').set_checked(original_state['burn']['opp'][0])
    # Source gaps are explicit; no base/Mega guessing or made-up usage values.
    missing=page.evaluate("ViewerCore.DATA.species.find(s=>s.isMega&&!ViewerCore.USAGE.records[s.id]&&ViewerCore.USAGE.records[s.baseId]).id")
    choose_form('garchomp')
    page.locator('[data-picker="opp"][data-index="1"]').click();page.locator('#pickerSearch').fill(missing)
    # The picker search matches English names, not the no-space ID: clear and select exact ID.
    page.locator('#pickerSearch').fill('');page.locator(f'#pickerGrid [data-pick="{missing}"]').click()
    gap=page.locator('#calc .calc[data-pair="opp1-own0"]')
    assert '未取得' in gap.inner_text() and gap.locator('[data-detail-move]').count()==0
    page.locator('[data-picker="opp"][data-index="1"]').click();page.locator('#pickerSearch').fill('メガガブリアスZ');page.locator('#pickerGrid [data-pick="garchompmegaz"]').click()
    # Species replacement resets only this recipient; restore its original manual inputs.
    for stat,value in enumerate(original_state['ranks']['opp'][1]):
        for _ in range(abs(value)):page.locator(f'[data-rank="{1 if value>0 else -1}"][data-side="opp"][data-index="1"][data-stat="{stat}"]').click()
    page.locator('[data-burn-side="opp"][data-index="1"]').set_checked(original_state['burn']['opp'][1])
    assert page.evaluate('ViewerApp.getState().state')==original_state
    assert page.evaluate('ViewerApp.exportTeam()')==original_team
    assert pairs()==before
    page.screenshot(path=str(root/'work'/('usage-'+result['brand'].replace(' ','-')+'.png')),full_page=True)
    result['usage']=dict(passed=True,formChecks=checked,foldedByDefault=True,extraRecalculatesAndStaysOpen=True,statusExcluded=True,benchLists=bench_checked,explicitMissingForm=missing,directionalColors=True,typeColoredBars=bar_count,liquidVoiceTypeColor=True,savedTeamUnchanged=True)
