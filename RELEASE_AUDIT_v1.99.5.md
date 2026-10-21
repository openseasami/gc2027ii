# v1.99.5 release audit

- Added bounded advisory secondary-status forecast for nine named damaging moves; accounts for hit chance, known status/type immunities, several immunizing abilities, Covert Cloak, Sheer Force and Mold Breaker-family bypass.
- Integrates a small capped bonus into recommended actions and one explanatory note; does not mutate observed battle state.
- Scope limitations: move list is deliberately incomplete, substitutes and Misty terrain are not modeled in this advisory, other target immunities and complex cases are not fully handled. Additional effects from multi-hit attacks are not modeled. No outcome should be interpreted as a guaranteed activation.
- Full browser and end-to-end engine test still outstanding.
