# v1.99.6 release audit

- Extended advisory secondary status probability with **observed** Substitute blocking and Misty Terrain protection for grounded targets.
- Uses the same Substitute hit/bypass helper as confirmed battle processing, including Infiltrator and bypassing moves. An observed Substitute blocks added statuses unless the attack bypasses it.
- Misty Terrain blocks added status conditions for targets considered grounded by the existing battle helper. It does not block effects on airborne targets. Existing grounding helper is type-based, so item/ability/temporary grounding edge cases remain an accuracy limitation.
- Forecasting only: the action recommendation score is affected but observed statuses are not automatically changed.
- Existing safeguards (Cloak, Shield Dust, Sheer Force, immunities) retained.
- New 14-case focused tests added; all bundled tests and nine release integrity checks pass under Node.js v22.
- Not covered: status fields such as Safeguard if not stored, unmodeled immunity abilities, detailed multi-hit secondary activation, end-to-end browser confirmation.
