# v1.99.4 release audit

- Guaranteed secondary drops on Acid Spray, Mystical Fire, and Lumina Crash now consult the existing attacker ability-bypass helper for Mold Breaker, Turboblaze and Teravolt.
- Defender abilities Shield Dust, Clear Body, White Smoke, and Mirror Armor are ignored only if the attacking ability bypasses them according to the supported breakable table. Covert Cloak still blocks as an item.
- Outgoing and incoming confirmed single-target hit paths use the common flag.
- **Scope**: probabilistic effects are still not auto-committed to battle state (chance alone is not confirmation); full probability modeling deferred. Full browser end-to-end and entire turn-engine integration remain unverified.
