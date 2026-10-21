# v2.0.13 release audit

## Verified correction
The damage calculator previously used only Pokémon type for terrain grounding. This produced mismatches with the status-effect forecast for Levitate, Air Balloon, and Iron Ball. The terrain damage modifier now accepts attacker/defender battle indices and uses confirmed held items and abilities (unconfirmed opponent information is not asserted). Both directions of the damage estimate now pass the relevant sides and indices.

## Tests
- New `test-terrain-damage-grounding.js`: 9 assertions passed.
- Existing `test-*.js` scripts: all passed (see execution report).
- `verify-release.js`: all nine release integrity checks passed.

## Incomplete, not a final release
The damage engine is an estimate, not fully cartridge-accurate. Unknown opponent items/abilities, field-gravity/elevation modifiers, complete Regulation C move/ability effects, proper multiplayer E2E browser interactions, persistence in deployed GitHub Pages, and comprehensive real-match validation remain open. This release is an incremental bugfix, **not an assertion of full completion**.
