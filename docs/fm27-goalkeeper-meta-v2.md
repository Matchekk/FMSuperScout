# FM27 Goalkeeper Meta v2.0

Implemented in `app/app.js` through `weightedMeta`, `metaScore` and `metaPaScore`.
This is a six-attribute index on the existing 1–20 scale, not predicted goals saved,
a win probability, or a validated forecast of an individual goalkeeper's match outcomes.

## 1. Previous model and compatibility

The legacy FM24 model used Reflexes 12.8, Agility 8.0, Acceleration 4.7, Pressure 4.1,
Pace 3.5 and AerialReach 3.4 (sum 36.5). Pressure comes from `p.pressure`, not
`p.attrs.Pressure`. This model and its existing partial-value handling remain unchanged
for FM26 and unidentified game versions. Field-player `META_W` and all role ratings
(including goalkeeper and sweeper-keeper roles) are unchanged.

Only `state.meta.game === 'FM27'` and `natPos(p).includes('GK')` select v2.0.
No inference is made from the calendar year, game date, player name or attribute set.
`core/Fields.cs` maps the detected game major version to `F.Game`;
`core/Dumper.cs` writes it as `meta.game`; both streaming and JSON parsing preserve it;
`loadDump` assigns it to `state.meta` before scores are rendered.
Missing, lowercase or future game-version identifiers do not silently select FM27.

`natPos` uses `posNat` when supplied and otherwise `posArr`. The exporter derives natural
positions from ratings relative to a player's strongest position, and omits `posNat` when
it equals `posArr`. The numeric ratings themselves are not exported. Thus a natural GK
label is not proof of a particular numeric GK familiarity. No position bonus or penalty
is invented; Study 21b's position-familiarity finding cannot be numerically applied here.

## 2. Evidence and raw coefficients

Two separate authors' research families supply comparable effects:

- [Fm-Match-Lab Study 13b, goalkeeper section](https://github.com/caiograco289/Fm-Match-Lab/blob/main/docs/studies/13b-value-by-position-random.md#the-goalkeeper):
  50,000 Gegenpress matches form the primary Mac model. The additional 34,340 Catenaccio
  matches belong to the same research family, not a third independent source.
- [Purity's dedicated goalkeeper campaign, post 8](https://fm-arena.com/threads/attribute-importance-by-position-in-fm27-a-test-on-my-own-tactic.125/post-406):
  200,000 simulated matches, 50,000 configurations and four seeds. Use the goalkeeper
  table's **Conceded saved** column, not its goal-difference or points columns.
  If the post-specific URL changes, use the [original thread](https://fm-arena.com/threads/attribute-importance-by-position-in-fm27-a-test-on-my-own-tactic.125/).

Sources checked on 2026-11-16. The intended engine context is FM27 around 27.0.1;
transferability must be rechecked after match-engine patches.

| Application key | Mac beta | Purity beta |
|---|---:|---:|
| Agility | 0.93 | 0.71 |
| Reflexes | 0.76 | 0.65 |
| AerialReach | 0.23 | 0.26 |
| Concentration | 0.08 | 0.17 |
| Acceleration | 0.15 | 0.09 |
| Handling | 0.11 | 0.04 |
| Sum | **2.26** | **1.92** |

Unit: **avoided goals conceded per 38 matches, for +1 attribute point in one goalkeeper**.
Mac publishes changes in goals against with a negative sign; the coefficients above
reverse that sign. Purity already publishes positive conceded-saved values.

Agility, Reflexes and AerialReach have the clearest cross-source support.
Concentration is clearer in Purity and uncertain in Mac. Acceleration and Handling remain
small contributions, not claims of equally strong confirmation: Purity does not confirm
either under the study's split-half rule. Handling also fails to replicate in Mac's
Catenaccio extension. These caveats matter even though the requested core retains them.

## 3. Derivation and exact effective weights

For the same complete attribute vector `x`, define:

```text
S_M(x)  = sum(MAC_GK_BETA[i] * x[i]) / 2.26
S_P(x)  = sum(PURITY_GK_BETA[i] * x[i]) / 1.92
S_GK(x) = (S_M(x) + S_P(x)) / 2
w[i]    = (MAC_GK_BETA[i] / 2.26 + PURITY_GK_BETA[i] / 1.92) / 2
```

The two normalizations happen **before** averaging. Pooling the raw coefficients first
would give Mac greater influence and is a different model. The positive effective
weights sum to one, so the index is bounded by 1 and 20 and is monotone in every core
attribute. No output is rounded until display.

| Attribute | Exact rational effective weight | Percentage (display only) |
|---|---:|---:|
| Agility | 16951 / 43392 | 39.06480457% |
| Reflexes | 14641 / 43392 | 33.74124263% |
| AerialReach | 2573 / 21696 | 11.85932891% |
| Concentration | 2689 / 43392 | 6.19699484% |
| Acceleration | 819 / 14464 | 5.66233407% |
| Handling | 377 / 10848 | 3.47529499% |

Production uses the frozen raw betas, not these displayed percentages. The pure
`gkMeta27Details(attrs)` computes both means in one six-element loop. For floating-point
stability it uses the algebraically equivalent centered mean
`anchor + sum(beta[i] * (x[i] - anchor)) / sum(beta)`. Uniform 1, 12 and 20 inputs
therefore return exactly those values, without rounding arbitrary scores.

The reference profile `(16,16,13,12,12,12)` in the table's attribute order gives
`Mac = 3411/226 = 15.092920353982…`, `Purity = 2874/192 = 14.96875`,
and `ensemble = 15.030835176991…`.

## 4. Why 50/50

Equal weighting of research families is a transparent modeling choice, not an estimated
optimal mixture. A larger match count alone does not establish lower external bias or
better transfer to other tactics. The Catenaccio extension is corroboration within Mac's
family, not an extra independent vote. Complete cross-source covariance and heterogeneity
information is unavailable: no inverse-variance meta-analysis, posterior probabilities,
or claims of statistically optimal weights are made.

## 5. Missing data and export compatibility

All six attributes must be finite JavaScript numbers in the inclusive interval [1,20].
Missing keys, `null`, `undefined`, `NaN`, infinities, strings, zero and out-of-range values
return `null`. There is no default value or renormalization over available attributes.
The existing UI shows a dash, puts unavailable scores last in sorting, and excludes them
from active Meta/PA-Meta range filters. This behavior prevents incomplete keepers from
receiving inflated scores.

`core/Fields.cs` lists all six application keys in `PlayerAttrs`; `Dumper.cs` reads and
exports that map for players. A read-only format audit of the existing local FM27 27.0.1
dump (exporter 1.7.3) found 103,539 players and 10,661 natural goalkeepers. All six keys
were present. Of these keepers, 10,652 had six valid values; eight had Acceleration 0
and one had Concentration 0. These nine correctly have no v2 score. No identities or
private dump contents are included in the repository. This is a format/completeness
check, not outcome validation and not a guarantee about every dump.

Old dumps without `meta.game` retain legacy behavior. Explicit FM27 dumps missing a
required key show no score rather than falling back to FM24. `posArr` remains supported
for dumps lacking `posNat`; it cannot prove numeric position familiarity.

## 6. Source sensitivity and rankings

`gkMeta27Details` returns:

```text
score          = (macScore + purityScore) / 2
sensitivityMin = min(macScore, purityScore)
sensitivityMax = max(macScore, purityScore)
sourceSpread   = abs(macScore - purityScore)
```

This range is **not a 95% confidence interval**. It measures only disagreement between
the two implemented source models, not sampling uncertainty, real-player outcome
variability, tactical bias, patch drift or projection error.

`compareGkMeta(playerA, playerB)` is a pure numerical comparison within the FM27 GK
model. Callers must supply profiles from the intended game; it does not infer a game
version from a player. It requires two GK labels and valid attributes and returns
`scoreDelta`, `macDelta`, `purityDelta`, `sourceStable` and `stability` (A minus B).
Both source deltas strictly positive or both strictly negative means `SOURCE_STABLE`.
Opposite signs or a tie in either source means `SOURCE_SENSITIVE`. Invalid profiles
return `null`. This is not a probability that A is better in actual matches.

## 7. PA-Meta and integration boundaries

PA-Meta keeps `projectAttrs(p)` and applies the same `weightedMeta` dispatch to the
projected attributes. No new growth factors are introduced. Without remaining potential
it equals current Meta; the existing `max(current, projected)` rule is preserved.
It is a **hypothetical development index**, not a validated probability of attaining
the projected attributes or any match performance. Projected-source sensitivity would
likewise not measure developmental uncertainty.

Existing scalar `_meta` and `_metaPa` memoization stays in use. There is no additional
details cache: details objects are temporary, not accumulated during sorting. The input
attributes, positions and other football data are unchanged. As before, only the scalar
memo fields are assigned. `loadDump` supplies fresh parsed player objects for each dump,
so both scores and game-version context are renewed together. In-place edits of scored
player objects are outside that existing cache contract.

Sorting, filters, profile, comparison and PNG card models all consume the existing score
functions. A one-declaration CSS fallback preserves comparison columns in older app
browsers without CSS subgrid (verified in the locally installed Chrome 112).
GK-specific help and hypothetical-PA wording are translated in English,
Dutch, French and German. Field-player, goalkeeper-role and sweeper-keeper-role ratings,
prices, CA/PA, history format, imports and native scanner code are unchanged. A Meta
ranking can differ from a role ranking without either being a substitute for the other.

## 8. Excluded findings and future work

Purity additionally confirms ImportantMatches; Mac reports a positive Determination
effect. They remain candidates for a separately tested extension, not hidden evidence
and not arbitrary bonuses in the shared six-attribute core. Neither is supported in the
same way across both research families. Purity also reports smaller possible positive
effects for CommandOfArea, Anticipation, Adaptability and WorkRate, without split-half
confirmation. Mac's weaker Positioning result is uncertain and OneOnOnes is near zero.

These findings do **not** establish universal uselessness of Pressure, Pace, Positioning,
OneOnOnes, Kicking, CommandOfArea or any omitted attribute. Such attributes may matter in
other tactical contexts, role ratings or season-level outcomes. The conservative core
does not import their FM24 weights or invent nonlinear effects, interaction bonuses or
sweeper-keeper bonuses without controlled effect curves and independent validation.

## 9. Reproducible scenario comparison and checks

Run from the repository root, with no installation or new dependencies:

```sh
npm test
node tools/compare-gk-meta.js
node tools/compare-gk-meta.js --json
node --check app/app.js
git diff --check
```

The [checked-in scenario report](fm27-goalkeeper-meta-v2-scenarios.md) is generated from
the [synthetic fixture](../test/fixtures/fm27-gk-meta-profiles.json), using the real app
functions loaded by the existing zero-dependency test harness. It contains old/new ranks,
both source scores, and pairwise source stability, including a disagreement example.
These are **software and scenario tests**, not validation against actual match outcomes.
The data-only local dump is not an independent outcomes corpus; no held-out performance
evaluation was possible. No correlation, AUC or claimed performance gain is fabricated.

## 10. Outstanding validation

Before claiming predictive effectiveness, evaluate on an explicitly permitted independent
GK corpus with reliable outcomes, defined exposure/minutes, tactical and opponent context,
patch information and a held-out split. Check calibration, ranking robustness, sensitivity
to core selection, and how the model transfers between tactics and attribute ranges.
Validate the PA projection separately. Reassess the source evidence after engine updates.
Current tests establish correct implementation of the specified formula and compatibility,
not those unmeasured scientific claims.
