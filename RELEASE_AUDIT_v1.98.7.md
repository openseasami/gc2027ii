# v1.98.7 release audit

- Added explicit user-observed Substitute HP to Pokémon battle state (`substituteHp`).
- Added one compact control in battle cards to enter the observed Substitute remaining HP, with 0 clearing it.
- Recorded Substitute HP is used in contact-risk forecast for unchanged opponent targets; inferred substitutes are not invented.
- Clear Substitute on switch-out, including switch simulations. JSON snapshots naturally carry this scalar through existing undo/save flows.
- Added state helper for applying observed strikes; the core damage engine does not yet call it. **Hits do not automatically reduce Substitute HP.**
- No automatic substitute creation or confirmation from the use of the move; user enters confirmed information.
- Release checks: 9 integrity, 11 contact, 6 KO, 11 residual, 8 substitute contact, 12 state assertions.
- Browser interaction and complete 36-suite battle regression were NOT performed. Save/restore compatibility with old serialized games was not exercised end-to-end.
