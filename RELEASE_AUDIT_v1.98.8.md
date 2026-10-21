# v1.98.8 release audit

## Added
- Recorded Substitute HP is consumed by confirmed estimated single hits and multi-hit strikes, in either attack direction.
- Multi-hit attacks progress from Substitute to the defender after breakage, without spilling over damage from the breaking strike.
- Substitute hits skip target HP modification, Focus Sash/Sturdy resolution, and Stamina gain.
- Bypass-sub move flags and Infiltrator leave Substitute intact.
- Prior-state snapshots permit existing single-hit undo and turn snapshots to restore Substitute HP.

## Tests
- verify-release.js: 9 checks passed.
- Existing JS test scripts: 48 assertions/checks passed (6 + 11 + 11 + 8 + 12).
- New test-substitute-strikes.js: 10 checks passed.

## Limitations
- The confirmed-hit engine still estimates damage, not observed exact damage.
- Substitute creation on move use, shield-dependent move effects, recoil/contact triggers, and automatic residual effects are not fully implemented.
- Move bypass handling depends on catalog metadata and the confirmed user's ability; unknown abilities are not inferred.
- No full battle-engine regression or interactive browser verification was performed.
