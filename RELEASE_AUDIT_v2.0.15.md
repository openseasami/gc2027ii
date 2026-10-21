# v2.0.15 release audit (2026-10-20)

## Correctness change
- In the common terrain grounding forecast, recognize two Mega forms whose only ability is Levitate (Mega Garchomp Z and Mega Delphox) even when the opponent's ability has not been explicitly observed.
- Keep Iron Ball override before the Levitate check.
- Added test-grounding-form.js with seven assertions; includes the fixed-form exceptions and Iron Ball.
- No mutation of observed battle state by this forecast.

## Verification performed
- node verify-release.js: 9/9 pass.
- All 31 test-*.js scripts: pass.
- ZIP integrity checked at build time.

## Remaining release blockers
- This run did not establish an end-to-end browser session with actual HTTP navigation, persistent storage, Service Worker, or a complete two-player battle.
- Accuracy and completeness of move, item, ability, and regulation data have not been independently exhaustively validated against an authoritative game dataset.
- Damage/recommendation parity versus battle simulator or real results is not demonstrated comprehensively.
- UI evaluation (45-second interface, KO replacement, rollback, responsive behavior) remains incomplete.

Status: verified incremental build, NOT a certified complete product.
