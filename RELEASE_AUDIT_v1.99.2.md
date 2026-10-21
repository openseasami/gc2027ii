# v1.99.2 release audit

- Confirmed single-target damaging moves Acid Spray, Mystical Fire and Lumina Crash now respect Shield Dust (りんぷん), Clear Body (クリアボディ) and White Smoke (しろいけむり) when applying guaranteed stat drops. Both incoming and outgoing confirmed single-hit flows use the defender ability.
- No stage changes when a substitute absorbs a hit, retaining existing early return.
- Intentionally NOT claiming Mirror Armor reflection, Covert Cloak, probabilistic secondary effects, multi-hit stat effects, or full ability suppression; these remain future work.
- Tests are component/static checks; no full live browser or comprehensive battle engine E2E verification.
