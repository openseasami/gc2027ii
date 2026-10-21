# v1.98.9 release audit

## Changes
- Added a compact `みがわり使用を記録` action alongside observed Substitute HP controls.
- Records confirmed successful Substitute use by deducting floor(max HP / 4) and initializing substitute HP to the same amount.
- Prevents creation if substitute is already active or current HP cannot pay the cost without fainting.
- Stores a full state snapshot for existing hit undo; manual substitute HP correction is retained.
- Does NOT infer success from mere move selection. Percentage HP bookkeeping remains approximate.

## Tests (executed with Node.js)
- verify-release.js: 9/9
- test-residual.js: 11/11
- test-contact.js: 11/11
- test-contact-ko.js: 6/6
- test-substitute-contact.js: 8/8
- test-substitute-state.js: 12/12
- test-substitute-strikes.js: 10/10
- test-substitute-create.js: 11/11
- Total: 78 assertions/checks passed.

## Limits
- No full browser/UI run or comprehensive battle-engine regression.
- Effects behind Substitute, recoil/contact triggers and automatic status-move resolution are NOT covered by this release.
- HP percent may lose precision versus exact internal battle HP.
