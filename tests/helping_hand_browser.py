"""Helping Hand, filtered attacks and damage-range bars through real DOM controls."""
def exercise_helping_hand(page, result, root):
    original_state=page.evaluate('ViewerApp.getState().state')
    original_team=page.evaluate('ViewerApp.exportTeam()')
    def button(side,slot):return page.locator(f'[data-help-side="{side}"][data-help-slot="{slot}"]')
    def capture(container='#calc'):
        return page.locator(container+' .calc').evaluate_all('''els=>Object.fromEntries(els.map(el=>[el.dataset.pair,[...el.querySelectorAll(':scope > .damage-move-block')].map(m=>({move:m.querySelector('[data-detail-move]').dataset.detailMove,rows:[...m.querySelectorAll(':scope > .condition')].map(c=>({text:c.querySelector('strong')?.textContent||c.textContent,min:c.querySelector('.damage-bar')?.dataset.min,max:c.querySelector('.damage-bar')?.dataset.max}))}))]))''')
    def toggle(side,slot):
        before=int(page.locator('#updateStatus').get_attribute('data-revision'))
        button(side,slot).click()
        assert int(page.locator('#updateStatus').get_attribute('data-revision'))>before
    def check_bars():
        bars=page.locator('#calc .damage-move-block > .condition > .damage-bar, #benchCalc .damage-move-block > .condition > .damage-bar').evaluate_all('''els=>els.map(e=>({min:+e.dataset.min,max:+e.dataset.max,minWidth:parseFloat(e.querySelector('.damage-bar-min').style.width),maxWidth:parseFloat(e.querySelector('.damage-bar-max').style.width),track:e.clientWidth,minPixels:e.querySelector('.damage-bar-min').getBoundingClientRect().width,maxPixels:e.querySelector('.damage-bar-max').getBoundingClientRect().width,text:e.parentElement.querySelector('strong').textContent}))''')
        assert bars
        for b in bars:
            assert 0<=b['min']<=b['max'],b
            assert abs(b['minWidth']-min(100,b['min']))<0.0001,b
            assert abs(b['maxWidth']-min(100,b['max']))<0.0001,b
            assert abs(b['minPixels']-b['track']*b['minWidth']/100)<1,b
            assert abs(b['maxPixels']-b['track']*b['maxWidth']/100)<1,b
            expected=f"{b['min']:.1f}–{b['max']:.1f}%"
            assert b['text']==expected,(b,expected)
        return dict(count=len(bars),immune=sum(b['max']==0 for b in bars),over100=sum(b['max']>100 for b in bars))
    def check_no_status():
        assert page.locator('#calc [data-detail-move], #benchCalc [data-detail-move]').evaluate_all("els=>els.every(e=>['Physical','Special'].includes(ViewerCore.DATA.moves[e.dataset.detailMove].category))")
        # The lower move-candidate list still contains real Status entries.
        assert page.locator('#detailsGrid [data-detail-move]').evaluate_all("els=>els.some(e=>ViewerCore.DATA.moves[e.dataset.detailMove].category==='Status')")
    assert page.locator('#calc [data-help-side]').count()==4
    assert all(button(side,slot).get_attribute('aria-pressed')=='false' for side in ['own','opp'] for slot in range(2))
    initial=capture();bench=capture('#benchCalc');check_no_status();before_bars=check_bars()
    toggle('own',0);own_on=capture()
    for target in range(2):assert own_on[f'own0-opp{target}']!=initial[f'own0-opp{target}']
    for pair in initial:
        if not pair.startswith('own0-'):assert own_on[pair]==initial[pair],pair
    assert page.locator('#calc .calc[data-pair^="own0-"] [class="helping-hand-badge"]').count()==2
    bench_on=capture('#benchCalc')
    assert any(bench_on[k]!=bench[k] for k in bench if k.startswith('own0-'))
    assert all(bench_on[k]==bench[k] for k in bench if k.startswith('ownBench'))
    toggle('opp',0);enemy_on=capture()
    assert all(enemy_on[k]==own_on[k] for k in own_on if not k.startswith('opp0-'))
    assert any(enemy_on[k]!=own_on[k] for k in own_on if k.startswith('opp0-'))
    toggle('own',1);toggle('opp',1)
    assert page.locator('#calc .calc[data-helping-hand="true"]').count()==8
    assert page.locator('#benchCalc .calc[data-attacker-active="true"][data-helping-hand="true"]').count()==16
    assert page.locator('#benchCalc .calc[data-attacker-active="false"][data-helping-hand="false"]').count()==16
    assert '同一ターンで両方が攻撃できることを意味しません' in page.locator('#calc').inner_text()
    after_bars=check_bars();assert after_bars['immune']>0 and after_bars['over100']>0
    all_on=capture()
    for field,alternate in [('weather','sun'),('terrain','psychic')]:
        page.locator('#'+field).select_option(alternate);assert capture()!=all_on
        assert page.locator('#calc .calc[data-helping-hand="true"]').count()==8
        page.locator('#'+field).select_option(original_state[field]);assert capture()==all_on
    page.locator('[data-form-side="own"][data-index="1"]').select_option('floetteeternal')
    assert button('own',1).get_attribute('aria-pressed')=='true' and capture()!=all_on
    page.locator('[data-form-side="own"][data-index="1"]').select_option('floettemega');assert capture()==all_on
    page.locator('[data-rank="1"][data-side="own"][data-index="0"][data-stat="0"]').click();assert capture()!=all_on
    page.locator('[data-rank="-1"][data-side="own"][data-index="0"][data-stat="0"]').click();assert capture()==all_on
    page.locator('[data-burn-side="own"][data-index="0"]').uncheck();assert capture()!=all_on
    page.locator('[data-burn-side="own"][data-index="0"]').check();assert capture()==all_on
    page.screenshot(path=str(root/'work'/('helping-hand-'+result['brand'].replace(' ','-')+'.png')),full_page=True)
    for side in ['own','opp']:
        for slot in range(2):toggle(side,slot)
    assert capture()==initial
    assert capture('#benchCalc')==bench
    # Register Helping Hand as a move through the actual registration UI, then restore it.
    was_open=page.locator('#teamSettings').get_attribute('open') is not None
    if not was_open:page.locator('#teamSettings > summary').click()
    profile=original_state['own'][1];old=original_team['team'][profile]['moves'][1]
    move=page.locator(f'[data-move-edit="1"][data-index="{profile}"]');move.select_option('helpinghand')
    assert page.evaluate('ViewerApp.exportTeam().team')[profile]['moves'][1]=='helpinghand'
    assert page.locator('#calc [data-detail-move="helpinghand"], #benchCalc [data-detail-move="helpinghand"]').count()==0
    check_no_status();move.select_option(old)
    if not was_open:page.locator('#teamSettings > summary').click()
    assert page.evaluate('ViewerApp.exportTeam()')==original_team
    # A new occupant must not inherit another Pokémon's Helping Hand reference.
    toggle('own',0);toggle('own',1)
    page.locator('select[data-own="1"]').select_option('1')
    assert button('own',1).get_attribute('aria-pressed')=='false'
    assert button('own',0).get_attribute('aria-pressed')=='true'
    page.locator('select[data-own="1"]').select_option(str(original_state['own'][1]))
    toggle('opp',0);toggle('opp',1)
    page.locator('[data-picker="opp"][data-index="0"]').click();page.locator('#pickerSearch').fill('カビゴン');page.locator('#pickerGrid [data-pick="snorlax"]').click()
    assert button('opp',0).get_attribute('aria-pressed')=='false'
    assert button('opp',1).get_attribute('aria-pressed')=='true'
    page.locator('[data-picker="opp"][data-index="0"]').click();page.locator('#pickerSearch').fill('Dragonite');page.locator('#pickerGrid [data-pick="dragonite"]').click()
    for side in ['own','opp']:
        for slot in range(2):
            if button(side,slot).get_attribute('aria-pressed')=='false':toggle(side,slot)
    page.locator('#resetConditions').click()
    assert all(button(s,i).get_attribute('aria-pressed')=='false' for s in ['own','opp'] for i in range(2))
    for key in ['weather','terrain']:page.locator('#'+key).select_option(original_state[key])
    page.locator('#tr').set_checked(original_state['tr'])
    for side in ['own','opp']:
        for slot in range(2):
            page.locator(f'[data-burn-side="{side}"][data-index="{slot}"]').set_checked(original_state['burn'][side][slot])
            for stat,value in enumerate(original_state['ranks'][side][slot]):
                for _ in range(abs(value)):page.locator(f'[data-rank="{1 if value>0 else -1}"][data-side="{side}"][data-index="{slot}"][data-stat="{stat}"]').click()
    assert page.evaluate('ViewerApp.getState().state')==original_state
    assert capture()==initial
    assert capture('#benchCalc')==bench
    assert page.evaluate('ViewerApp.exportTeam()')==original_team
    result['helpingHand']=dict(passed=True,controls=4,offOnOff=True,separateSides=True,sameAttackerBothTargets=True,activeToBench=True,benchAttackerUnaffected=True,weatherTerrainMegaRankBurnWhileOn=True,damageBarsBefore=before_bars,damageBarsAfter=after_bars,statusAttacksHidden=True,statusCandidatesKept=True,registeredHelpingHandHidden=True,recipientChangeResets=True,conditionReset=True,teamJsonUnchanged=True)
