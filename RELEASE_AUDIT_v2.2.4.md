# v2.2.4 — final damage modifier rounding separation

## Actual source change
- `damageRollOrdered` accepts a separate `otherFinal` multiplier (backward compatible default 1).
- Both outgoing/incoming damage predictions now apply screen reduction and final defensive ability multiplier at distinct integer truncation boundaries rather than multiplying both factors before rounding.
- No new item, weather, or Pokémon coverage is claimed.

## Test results
- 45 `test-*.js` suites passed.
- `verify-release.js`: 9/9 passed.
- `test-final-modifier-separation.js`: 46,080 parameter cases passed; 4,369 cases differed versus multiplying modifiers before truncation.
- This regression test validates implementation consistency, **not** independent equivalence to all Pokémon Champions cartridge mechanics.
- Browser end-to-end, independent full damage engine comparison, Regulation M-C usage-rate coverage and item/ability effects remain unverified or partial.
