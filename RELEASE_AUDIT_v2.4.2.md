# v2.4.2 — Shared Unburden speed integration

- Connected BattleCore.unburdenSpeed to the live speedFieldMultiplier used for battle ordering and speed estimation, preventing duplicated application logic.
- Activation is based on recorded unburdenActive history, itemConsumed, and known held item; being empty-handed alone does not activate Unburden.
- Added six integration checks running the actual speedFieldMultiplier function in a VM, including item retained / consumed, no recorded activation, and another ability.
- All 52 Node test files passed; 10/10 release checks passed (verify-release.js has 9 normal checks plus a shared engine check included in total 10).
- Poison Touch remains only a conditional risk calculation; never silently asserts poison status. Actual status event integration is not complete.
- No browser E2E, independent combat-engine oracle, or live deployment performed; not production ready.
