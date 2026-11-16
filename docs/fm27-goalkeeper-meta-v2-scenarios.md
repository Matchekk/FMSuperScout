# Synthetic goalkeeper scenarios

**Software and scenario tests only. These are not validation against actual match performance.**

Reproduce with `node tools/compare-gk-meta.js` (`--json` for full precision). Inputs: [synthetic profiles](../test/fixtures/fm27-gk-meta-profiles.json). Positive rank gain means moving up.

| Profile | Old FM24 | FM27 v2 | Mac | Purity | Old → new rank | Rank gain | Sources vs next row |
|---|---:|---:|---:|---:|---:|---:|---|
| Elite | 18.000000 | 18.000000 | 18.000000 | 18.000000 | 1 → 1 | 0 | SOURCE_STABLE |
| Agility specialist | 13.534247 | 14.734536 | 14.880531 | 14.588542 | 5 → 2 | +3 | SOURCE_STABLE |
| Reflex specialist | 14.454795 | 14.361887 | 14.353982 | 14.369792 | 2 → 3 | -1 | SOURCE_STABLE |
| Balanced | 14.000000 | 14.000000 | 14.000000 | 14.000000 | 3 → 4 | -1 | SOURCE_SENSITIVE |
| Aerial specialist | 12.865753 | 13.888482 | 13.730088 | 14.046875 | 6 → 5 | +1 | SOURCE_STABLE |
| Technical sweeper keeper | 13.893151 | 12.283117 | 12.331858 | 12.234375 | 4 → 6 | -2 | SOURCE_STABLE |
| Weak | 8.000000 | 8.000000 | 8.000000 | 8.000000 | 7 → 7 | 0 | — |

Source stability is pairwise: each row is compared with the next row in the new ranking.

Trade-off: All core attributes 12: +1 Acceleration versus +1 Concentration. Mac delta 0.030973, Purity delta -0.041667, ensemble delta -0.005347: **SOURCE_SENSITIVE**. No probability of superiority is implied.
