# Synthetic outfield scenarios

**Software/model comparison only; no validation of actual match improvement.**

Reproduce: `node tools/compare-outfield-meta.js` (`--json` for full precision). [Inputs](../test/fixtures/fm27-outfield-meta-profiles.json). Legacy = old global FMSuperScout weighting.

## Profiles at their stated positions

No cross-position ranking is assigned to this table.

| Profile | Position | Legacy | v2 | Mac | Purity | Evidence |
|---|---|---:|---:|---:|---:|---|
| Fast striker, weak finishing | ST | 15.260231 | 14.646901 | 14.657658 | 14.636145 | DIRECT_POSITION_FAMILY |
| Slower clinical striker | ST | 13.366212 | 14.137176 | 14.315315 | 13.959036 | DIRECT_POSITION_FAMILY |
| Aerial centre-back | DC | 12.044071 | 13.227123 | 13.259615 | 13.194631 | DIRECT_POSITION_FAMILY |
| Fast centre-back | DC | 15.024134 | 14.514455 | 14.384615 | 14.644295 | DIRECT_POSITION_FAMILY |
| High-stamina full-back | DL | 14.007345 | 14.979067 | 15.026316 | 14.931818 | TRANSFER_FB_WB |
| Defensive holding midfielder | DM | 12.942288 | 13.746439 | 13.688000 | 13.804878 | DIRECT_POSITION_FAMILY |
| Attacking number eight | MC | 13.618048 | 14.357753 | 14.281600 | 14.433906 | PROXY_MODEL |
| Dribbling winger | AML | 15.513116 | 14.847825 | 14.488000 | 15.207650 | TRANSFER_WIDE_CENTRAL_AM |
| Technical slow number ten | AMC | 10.711438 | 10.617355 | 10.344000 | 10.890710 | TRANSFER_CENTRAL_AM |
| Balanced profile | MC | 13.718783 | 14.000000 | 14.000000 | 14.000000 | PROXY_MODEL |

## Ranking for ST

All ten profiles are evaluated at **ST**. This evaluates attributes only; no natural-position familiarity is inferred. Positive rank gain means moving up.

| Profile | Legacy | v2 | Mac | Purity | Old → new rank | Gain | Sources vs next row |
|---|---:|---:|---:|---:|---:|---:|---|
| Dribbling winger | 15.513116 | 14.872973 | 14.945946 | 14.800000 | 1 → 1 | 0 | SOURCE_STABLE |
| Fast centre-back | 15.024134 | 14.814881 | 14.918919 | 14.710843 | 3 → 2 | +1 | SOURCE_STABLE |
| Fast striker, weak finishing | 15.260231 | 14.646901 | 14.657658 | 14.636145 | 2 → 3 | -1 | SOURCE_STABLE |
| High-stamina full-back | 14.007345 | 14.215912 | 14.234234 | 14.197590 | 4 → 4 | 0 | SOURCE_SENSITIVE |
| Slower clinical striker | 13.366212 | 14.137176 | 14.315315 | 13.959036 | 7 → 5 | +2 | SOURCE_SENSITIVE |
| Balanced profile | 13.718783 | 14.000000 | 14.000000 | 14.000000 | 5 → 6 | -1 | SOURCE_SENSITIVE |
| Attacking number eight | 13.618048 | 13.927711 | 14.000000 | 13.855422 | 6 → 7 | -1 | SOURCE_STABLE |
| Defensive holding midfielder | 12.942288 | 13.208054 | 13.252252 | 13.163855 | 8 → 8 | 0 | SOURCE_STABLE |
| Aerial centre-back | 12.044071 | 12.604163 | 12.536036 | 12.672289 | 9 → 9 | 0 | SOURCE_STABLE |
| Technical slow number ten | 10.711438 | 10.554244 | 10.481982 | 10.626506 | 10 → 10 | 0 | — |

## Ranking for DC

All ten profiles are evaluated at **DC**. This evaluates attributes only; no natural-position familiarity is inferred. Positive rank gain means moving up.

| Profile | Legacy | v2 | Mac | Purity | Old → new rank | Gain | Sources vs next row |
|---|---:|---:|---:|---:|---:|---:|---|
| Fast striker, weak finishing | 15.260231 | 14.858076 | 14.649038 | 15.067114 | 2 → 1 | +1 | SOURCE_SENSITIVE |
| Dribbling winger | 15.513116 | 14.754598 | 14.697115 | 14.812081 | 1 → 2 | -1 | SOURCE_STABLE |
| Fast centre-back | 15.024134 | 14.514455 | 14.384615 | 14.644295 | 3 → 3 | 0 | SOURCE_STABLE |
| High-stamina full-back | 14.007345 | 14.217863 | 14.153846 | 14.281879 | 4 → 4 | 0 | SOURCE_STABLE |
| Balanced profile | 13.718783 | 14.000000 | 14.000000 | 14.000000 | 5 → 5 | 0 | SOURCE_STABLE |
| Attacking number eight | 13.618048 | 13.688436 | 13.692308 | 13.684564 | 6 → 6 | 0 | SOURCE_SENSITIVE |
| Slower clinical striker | 13.366212 | 13.639197 | 13.788462 | 13.489933 | 7 → 7 | 0 | SOURCE_SENSITIVE |
| Defensive holding midfielder | 12.942288 | 13.513149 | 13.475962 | 13.550336 | 8 → 8 | 0 | SOURCE_STABLE |
| Aerial centre-back | 12.044071 | 13.227123 | 13.259615 | 13.194631 | 9 → 9 | 0 | SOURCE_STABLE |
| Technical slow number ten | 10.711438 | 10.483044 | 10.543269 | 10.422819 | 10 → 10 | 0 | — |

## Ranking for DL

All ten profiles are evaluated at **DL**. This evaluates attributes only; no natural-position familiarity is inferred. Positive rank gain means moving up.

| Profile | Legacy | v2 | Mac | Purity | Old → new rank | Gain | Sources vs next row |
|---|---:|---:|---:|---:|---:|---:|---|
| Dribbling winger | 15.513116 | 15.235496 | 14.953947 | 15.517045 | 1 → 1 | 0 | SOURCE_SENSITIVE |
| Fast striker, weak finishing | 15.260231 | 15.125748 | 15.302632 | 14.948864 | 2 → 2 | 0 | SOURCE_STABLE |
| Fast centre-back | 15.024134 | 15.113935 | 15.296053 | 14.931818 | 3 → 3 | 0 | SOURCE_SENSITIVE |
| High-stamina full-back | 14.007345 | 14.979067 | 15.026316 | 14.931818 | 4 → 4 | 0 | SOURCE_STABLE |
| Attacking number eight | 13.618048 | 14.253140 | 14.046053 | 14.460227 | 6 → 5 | +1 | SOURCE_STABLE |
| Balanced profile | 13.718783 | 14.000000 | 14.000000 | 14.000000 | 5 → 6 | -1 | SOURCE_STABLE |
| Slower clinical striker | 13.366212 | 13.770783 | 13.638158 | 13.903409 | 7 → 7 | 0 | SOURCE_STABLE |
| Defensive holding midfielder | 12.942288 | 13.391746 | 13.578947 | 13.204545 | 8 → 8 | 0 | SOURCE_STABLE |
| Aerial centre-back | 12.044071 | 11.803379 | 11.782895 | 11.823864 | 9 → 9 | 0 | SOURCE_STABLE |
| Technical slow number ten | 10.711438 | 10.321770 | 10.052632 | 10.590909 | 10 → 10 | 0 | — |

## Ranking for DM

All ten profiles are evaluated at **DM**. This evaluates attributes only; no natural-position familiarity is inferred. Positive rank gain means moving up.

| Profile | Legacy | v2 | Mac | Purity | Old → new rank | Gain | Sources vs next row |
|---|---:|---:|---:|---:|---:|---:|---|
| Dribbling winger | 15.513116 | 15.185805 | 14.896000 | 15.475610 | 1 → 1 | 0 | SOURCE_SENSITIVE |
| Fast centre-back | 15.024134 | 15.050098 | 15.088000 | 15.012195 | 3 → 2 | +1 | SOURCE_STABLE |
| Fast striker, weak finishing | 15.260231 | 14.914439 | 15.024000 | 14.804878 | 2 → 3 | -1 | SOURCE_STABLE |
| High-stamina full-back | 14.007345 | 14.756293 | 14.976000 | 14.536585 | 4 → 4 | 0 | SOURCE_STABLE |
| Attacking number eight | 13.618048 | 14.395512 | 14.352000 | 14.439024 | 6 → 5 | +1 | SOURCE_STABLE |
| Balanced profile | 13.718783 | 14.000000 | 14.000000 | 14.000000 | 5 → 6 | -1 | SOURCE_SENSITIVE |
| Slower clinical striker | 13.366212 | 13.873854 | 14.016000 | 13.731707 | 7 → 7 | 0 | SOURCE_SENSITIVE |
| Defensive holding midfielder | 12.942288 | 13.746439 | 13.688000 | 13.804878 | 8 → 8 | 0 | SOURCE_STABLE |
| Aerial centre-back | 12.044071 | 12.261220 | 12.120000 | 12.402439 | 9 → 9 | 0 | SOURCE_STABLE |
| Technical slow number ten | 10.711438 | 10.508341 | 10.224000 | 10.792683 | 10 → 10 | 0 | — |

## Ranking for AMC

All ten profiles are evaluated at **AMC**. This evaluates attributes only; no natural-position familiarity is inferred. Positive rank gain means moving up.

| Profile | Legacy | v2 | Mac | Purity | Old → new rank | Gain | Sources vs next row |
|---|---:|---:|---:|---:|---:|---:|---|
| Dribbling winger | 15.513116 | 14.847825 | 14.488000 | 15.207650 | 1 → 1 | 0 | SOURCE_SENSITIVE |
| Fast centre-back | 15.024134 | 14.787585 | 14.832000 | 14.743169 | 3 → 2 | +1 | SOURCE_SENSITIVE |
| Fast striker, weak finishing | 15.260231 | 14.624131 | 14.904000 | 14.344262 | 2 → 3 | -1 | SOURCE_SENSITIVE |
| High-stamina full-back | 14.007345 | 14.519257 | 14.656000 | 14.382514 | 4 → 4 | 0 | SOURCE_SENSITIVE |
| Attacking number eight | 13.618048 | 14.301115 | 14.176000 | 14.426230 | 6 → 5 | +1 | SOURCE_STABLE |
| Slower clinical striker | 13.366212 | 14.167257 | 13.952000 | 14.382514 | 7 → 6 | +1 | SOURCE_SENSITIVE |
| Balanced profile | 13.718783 | 14.000000 | 14.000000 | 14.000000 | 5 → 7 | -2 | SOURCE_STABLE |
| Defensive holding midfielder | 12.942288 | 13.487169 | 13.488000 | 13.486339 | 8 → 8 | 0 | SOURCE_STABLE |
| Aerial centre-back | 12.044071 | 12.416874 | 12.872000 | 11.961749 | 9 → 9 | 0 | SOURCE_STABLE |
| Technical slow number ten | 10.711438 | 10.617355 | 10.344000 | 10.890710 | 10 → 10 | 0 | — |

## Ranking for MC

All ten profiles are evaluated at **MC**. This evaluates attributes only; no natural-position familiarity is inferred. Positive rank gain means moving up.

| Profile | Legacy | v2 | Mac | Purity | Old → new rank | Gain | Sources vs next row |
|---|---:|---:|---:|---:|---:|---:|---|
| Dribbling winger | 15.513116 | 15.050613 | 14.732800 | 15.368426 | 1 → 1 | 0 | PROXY_MODEL |
| Fast centre-back | 15.024134 | 14.945092 | 14.985600 | 14.904585 | 3 → 2 | +1 | PROXY_MODEL |
| Fast striker, weak finishing | 15.260231 | 14.798316 | 14.976000 | 14.620632 | 2 → 3 | -1 | PROXY_MODEL |
| High-stamina full-back | 14.007345 | 14.661478 | 14.848000 | 14.474957 | 4 → 4 | 0 | PROXY_MODEL |
| Attacking number eight | 13.618048 | 14.357753 | 14.281600 | 14.433906 | 6 → 5 | +1 | PROXY_MODEL |
| Balanced profile | 13.718783 | 14.000000 | 14.000000 | 14.000000 | 5 → 6 | -1 | PROXY_MODEL |
| Slower clinical striker | 13.366212 | 13.991215 | 13.990400 | 13.992030 | 7 → 7 | 0 | PROXY_MODEL |
| Defensive holding midfielder | 12.942288 | 13.642731 | 13.608000 | 13.677462 | 8 → 8 | 0 | PROXY_MODEL |
| Aerial centre-back | 12.044071 | 12.323481 | 12.420800 | 12.226163 | 9 → 9 | 0 | PROXY_MODEL |
| Technical slow number ten | 10.711438 | 10.551947 | 10.272000 | 10.831894 | 10 → 10 | 0 | — |

## Ranking for ML

All ten profiles are evaluated at **ML**. This evaluates attributes only; no natural-position familiarity is inferred. Positive rank gain means moving up.

| Profile | Legacy | v2 | Mac | Purity | Old → new rank | Gain | Sources vs next row |
|---|---:|---:|---:|---:|---:|---:|---|
| Dribbling winger | 15.513116 | 15.041661 | 14.720974 | 15.362348 | 1 → 1 | 0 | PROXY_MODEL |
| Fast centre-back | 15.024134 | 14.950760 | 15.064026 | 14.837494 | 3 → 2 | +1 | PROXY_MODEL |
| Fast striker, weak finishing | 15.260231 | 14.874939 | 15.103316 | 14.646563 | 2 → 3 | -1 | PROXY_MODEL |
| High-stamina full-back | 14.007345 | 14.749162 | 14.841158 | 14.657166 | 4 → 4 | 0 | PROXY_MODEL |
| Attacking number eight | 13.618048 | 14.277127 | 14.111026 | 14.443228 | 6 → 5 | +1 | PROXY_MODEL |
| Balanced profile | 13.718783 | 14.000000 | 14.000000 | 14.000000 | 5 → 6 | -1 | PROXY_MODEL |
| Slower clinical striker | 13.366212 | 13.969020 | 13.795079 | 14.142961 | 7 → 7 | 0 | PROXY_MODEL |
| Defensive holding midfielder | 12.942288 | 13.439458 | 13.533474 | 13.345442 | 8 → 8 | 0 | PROXY_MODEL |
| Aerial centre-back | 12.044071 | 12.110127 | 12.327447 | 11.892806 | 9 → 9 | 0 | PROXY_MODEL |
| Technical slow number ten | 10.711438 | 10.469563 | 10.198316 | 10.740810 | 10 → 10 | 0 | — |

## Ranking for SW

All ten profiles are evaluated at **SW**. This evaluates attributes only; no natural-position familiarity is inferred. Positive rank gain means moving up.

| Profile | Legacy | v2 | Mac | Purity | Old → new rank | Gain | Sources vs next row |
|---|---:|---:|---:|---:|---:|---:|---|
| Fast striker, weak finishing | 15.260231 | 14.858076 | 14.649038 | 15.067114 | 2 → 1 | +1 | PROXY_MODEL |
| Dribbling winger | 15.513116 | 14.754598 | 14.697115 | 14.812081 | 1 → 2 | -1 | PROXY_MODEL |
| Fast centre-back | 15.024134 | 14.514455 | 14.384615 | 14.644295 | 3 → 3 | 0 | PROXY_MODEL |
| High-stamina full-back | 14.007345 | 14.217863 | 14.153846 | 14.281879 | 4 → 4 | 0 | PROXY_MODEL |
| Balanced profile | 13.718783 | 14.000000 | 14.000000 | 14.000000 | 5 → 5 | 0 | PROXY_MODEL |
| Attacking number eight | 13.618048 | 13.688436 | 13.692308 | 13.684564 | 6 → 6 | 0 | PROXY_MODEL |
| Slower clinical striker | 13.366212 | 13.639197 | 13.788462 | 13.489933 | 7 → 7 | 0 | PROXY_MODEL |
| Defensive holding midfielder | 12.942288 | 13.513149 | 13.475962 | 13.550336 | 8 → 8 | 0 | PROXY_MODEL |
| Aerial centre-back | 12.044071 | 13.227123 | 13.259615 | 13.194631 | 9 → 9 | 0 | PROXY_MODEL |
| Technical slow number ten | 10.711438 | 10.483044 | 10.543269 | 10.422819 | 10 → 10 | 0 | — |

Source stability compares each row with the next row in the same deployment ranking. A tie in either source is sensitive; proxy rankings remain PROXY_MODEL even when both source mixtures agree. No p-values, correlations or probabilities of real superiority are inferred.
