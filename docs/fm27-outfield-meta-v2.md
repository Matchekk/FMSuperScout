# FM27 Outfield Meta v2.0

Status: implemented linear scouting index on the existing 1–20 scale; **not independently
outcome calibrated**. This replaces the global field-player index only when
`state.meta.game === 'FM27'`. The existing GK v2.0 formula and all FM26/unknown-version
legacy weights remain unchanged. Source tables checked on 2026-11-16.

The [machine-readable specification](fm27-outfield-meta-v2-model.json) is generated from
the exact frozen model used by [the production module](../app/outfield-meta27.js).
It contains original coefficients, separately normalized source profiles, final weights,
position mappings, proxy recipes, evidence labels, source references and limitations.
The [scenario report](fm27-outfield-meta-v2-scenarios.md) is a software comparison, not
evidence of improved real match results.

## Why replace the global weighting?

The old `META_W` applies the same attribute weights to all field-player positions. The
position-by-attribute experiments provide a basis for different relative contributions
within ST, CB, FB, DM and AM families. They do not identify every tactical role, nor do
they establish equal absolute performance contributions at equal normalized scores.
The old global formula is retained for FM26 and explicit unknown-version fallback.

The precursor in [FM-27-Research](https://github.com/Matchekk/FM-27-Research/blob/0a1e0ad1575e484b6377f2d761ffd5e16af36b8a/research/meta_score_v01_weights.json)
was checked against its methodology, calculator and findings. v2 uses its **raw** tables
as the starting point, not its rounded integer percentages, arbitrary sensitivity buffer,
0–100 output, or borrowed Mac Dribbling value. No changes were made to that research repo.

## Original evidence and coefficient audit

- [Fm-Match-Lab 13b, pinned source and GD table](https://github.com/caiograco289/Fm-Match-Lab/blob/9bc29019adc87cf45138c462e96c4e19077a0381/docs/studies/13b-value-by-position-random.md#goal-difference):
  50,000 Gegenpress matches. The additional 34,340 Catenaccio matches are same-family
  contextual sensitivity, not a third independent author. Mac columns ST/AM/DM/FB/CB
  are mapped to the same-named model groups.
- [Purity, original outfield results table](https://fm-arena.com/threads/attribute-importance-by-position-in-fm27-a-test-on-my-own-tactic.125/):
  200,000 matches, 50,000 configurations × four seeds, Brentford 3-4-2-1. The table is
  **goal difference**, not goals for, real points or xPts. Its WB column maps to FB.

The unit of each raw coefficient is **change in actual goal difference over 38 matches
for +1 displayed attribute point in one player of that position**. The original reported
point estimates for the selected ten-attribute set are preserved below, including zeros.
Small positive estimates are not all statistically confirmed; a positive production
weight is not a claim of independent significance or universal importance.

| Attribute | Mac ST | Mac CB | Mac FB | Mac DM | Mac AM |
|---|---:|---:|---:|---:|---:|
| Acceleration | .49 | .41 | .29 | .27 | .24 |
| Pace | .45 | .31 | .36 | .26 | .27 |
| JumpingReach | .34 | .44 | .11 | .09 | .21 |
| Stamina | .15 | .20 | .25 | .20 | .16 |
| Anticipation | .13 | .15 | .14 | .10 | .11 |
| Balance | .21 | .24 | .09 | .06 | .00 |
| Strength | .16 | .17 | .09 | .15 | .14 |
| Finishing | .21 | .04 | .00 | .04 | .06 |
| Concentration | .08 | .12 | .19 | .08 | .06 |
| Dribbling | null | null | null | null | null |
| Positive total | **2.22** | **2.08** | **1.52** | **1.25** | **1.25** |

| Attribute | Purity ST | Purity CB | Purity FB/WB | Purity DM | Purity AM |
|---|---:|---:|---:|---:|---:|
| Acceleration | .70 | .34 | .33 | .23 | .30 |
| Pace | .90 | .23 | .40 | .11 | .39 |
| JumpingReach | .73 | .35 | .10 | .09 | .05 |
| Stamina | .34 | .14 | .28 | .09 | .20 |
| Anticipation | .37 | .14 | .15 | .02 | .15 |
| Balance | .24 | .08 | .09 | .02 | .12 |
| Strength | .21 | .07 | .15 | .08 | .26 |
| Finishing | .27 | .00 | .06 | .04 | .14 |
| Concentration | .26 | .10 | .05 | .06 | .08 |
| Dribbling | .13 | .04 | .15 | .08 | .14 |
| Positive total | **4.15** | **1.49** | **1.76** | **.82** | **1.83** |

**Mac Dribbling is missing, not zero.** The shortened Mac GD table does not publish that
cell. Its xPts effect is a different endpoint and is not substituted. No Purity value is
borrowed into Mac's denominator or numerator. Dribbling is weighted only by the Purity
half of the ensemble; `missingSourceCoefficients.mac` exposes the asymmetry in details,
and the localized tooltip explains it. Mac AM Balance, Mac FB Finishing and Purity CB
Finishing are observed zero point estimates, a distinct condition from missing evidence.

Finishing and Strength are retained because actual goals include conversion effects
which xG/xPts can miss. At ST, +1 Finishing contributes
`0.5 × (0.21/2.22 + 0.27/4.15) = 0.079827417779…` score points.
Heading is not in the specified ten-attribute core: no matching Mac GD coefficient was
introduced. This omission is not a statement that Heading or other omitted skills have
no match effect. A future expanded core needs an explicit comparable-endpoint selection.

The project's own [FINDINGS](https://github.com/Matchekk/FM-27-Research/blob/0a1e0ad1575e484b6377f2d761ffd5e16af36b8a/FINDINGS.md)
provide plausibility checks, not extra production coefficients. ATTR-002/004/005/006/007
involve multi-player interventions and mainly xGD; ATTR-009 has a raw-dose/mask contrast;
PD-ROLE-001 studies role-package interaction. Their units, intervention sizes and
identification differ. They neither justify adding their effects to individual GD betas
nor establish role bonuses, a universal attribute order or real-career calibration.

## Mathematical construction

For observed source coefficients only:

```text
b[s,p,i] = max(0, beta[s,p,i])
q[s,p,i] = b[s,p,i] / sum(observed positive b[s,p,*])
S[s,p]   = sum(q[s,p,i] * x[i])
S[p]     = 0.5 * S[mac,p] + 0.5 * S[purity,p]
w[p,i]   = 0.5 * q[mac,p,i] + 0.5 * q[purity,p,i]
```

Absent coefficients remain `null` in the evidence table and contribute no numeric weight.
Negative observed coefficients are clipped to zero rather than creating a non-monotone
player-quality penalty. A zero/invalid source denominator produces no normalized profile.
Each source is normalized **before** averaging; pooling raw coefficients would be a
different model. Equal source shares are a transparent author-family decision, not
inverse-variance optimality, an estimated posterior, or a vote per simulated match.

Float64 arithmetic is used throughout. Centering the weighted means at the first required
attribute preserves uniform profiles at exactly 1, 12 or 20 without rounding intermediate
weights or scores. Sorting and filtering receive the full unrounded result. The app
displays at most one decimal; the diagnostic documents show more for reproducibility.

## Position mapping and default selection

| FM positions | Model group | Evidence label |
|---|---|---|
| ST | ST | DIRECT_POSITION_FAMILY |
| DC | CB | DIRECT_POSITION_FAMILY |
| DL, DR, WBL, WBR | FB | TRANSFER_FB_WB |
| DM | DM | DIRECT_POSITION_FAMILY |
| AML, AMR | AM | TRANSFER_WIDE_CENTRAL_AM |
| AMC | AM | TRANSFER_CENTRAL_AM |
| MC | CM_PROXY | PROXY_MODEL |
| ML, MR | WM_PROXY | PROXY_MODEL |
| SW, if actually present | CB_PROXY | PROXY_MODEL |

CM is **60% DM + 40% AM**; WM is **50% FB + 50% AM**. Mixtures are applied to
already-normalized source profiles. SW reuses CB only as a declared proxy; the mapper
does not create a SW position in any player. There are no separately measured coefficients
for player roles such as ball-playing defender or advanced forward.

Mac's wide AM and Purity's central AM are contextual transfers. Catenaccio's central AM
results were checked as sensitivity: the published context table is xPts, not a complete
matching GD matrix for this core, so it cannot numerically replace the primary GD model.
FB/WB likewise transfers between different shapes and duties. These are not direct
validations of every individual position or role in the app.

Default Meta uses `p.pos` only when it is one recognized, exact position also present in
`natPos(p)`. Otherwise it chooses the first available natural position in this fixed order:
`SW, DC, DL, DR, WBL, WBR, DM, MC, ML, MR, AMC, AML, AMR, ST`.
This order is independent of attributes and array order. It never selects the highest
calculated score. `posNat` retains priority over the legacy `posArr` fallback; an empty
natural-position list is not replaced by an inferred position. With no reliable mapping,
FM27 Meta is `null`. A natural GK label always keeps the separate keeper model.

`outfieldMetaForPosition(player, position)` returns full details for an explicitly
requested deployment, even when it is not natural. It measures the attribute index only,
without a fictitious position-familiarity penalty. The profile lists separate scores for
all recognized natural positions and marks the standard position and transfer/proxy
status. Existing individual position labels and all scouting filters remain in place.

## Effective percentage weights

The following tables are generated from the production model, not hand-rounded input.
Percentages are displayed to six decimals; the JSON retains full numeric precision.

| Attribute | ST | CB | FB | DM | AM |
|---|---:|---:|---:|---:|---:|
| Acceleration | 19.469771% | 21.265165% | 18.914474% | 24.824390% | 17.796721% |
| Pace | 20.978509% | 15.170044% | 23.205742% | 17.107317% | 21.455738% |
| JumpingReach | 16.452838% | 22.321890% | 6.459330% | 9.087805% | 9.766120% |
| Stamina | 7.474764% | 9.505679% | 16.178230% | 13.487805% | 11.864481% |
| Anticipation | 7.385759% | 8.303756% | 8.866627% | 5.219512% | 8.498361% |
| Balance | 7.621296% | 8.453795% | 5.517344% | 3.619512% | 3.278689% |
| Strength | 6.133724% | 6.435532% | 7.221890% | 10.878049% | 12.703825% |
| Finishing | 7.982742% | 0.961538% | 1.704545% | 4.039024% | 6.225137% |
| Concentration | 4.934332% | 6.240320% | 7.670455% | 6.858537% | 4.585792% |
| Dribbling | 1.566265% | 1.342282% | 4.261364% | 4.878049% | 3.825137% |

| Attribute | CM_PROXY | WM_PROXY | CB_PROXY |
|---|---:|---:|---:|
| Acceleration | 22.013323% | 18.355597% | 21.265165% |
| Pace | 18.846685% | 22.330740% | 15.170044% |
| JumpingReach | 9.359131% | 8.112725% | 22.321890% |
| Stamina | 12.838475% | 14.021355% | 9.505679% |
| Anticipation | 6.531052% | 8.682494% | 8.303756% |
| Balance | 3.483183% | 4.398017% | 8.453795% |
| Strength | 11.608359% | 9.962858% | 6.435532% |
| Finishing | 4.913469% | 3.964841% | 0.961538% |
| Concentration | 5.949439% | 6.128123% | 6.240320% |
| Dribbling | 4.456884% | 4.043250% | 1.342282% |

## Details, sensitivity and comparisons

Details include `score`, `macScore`, `purityScore`, `sourceMin`, `sourceMax`, `sourceSpread`,
`position`, `positionGroup`, `evidenceStatus`, `modelVersion`, and missing-source metadata.
The range is `[min(macScore,purityScore), max(macScore,purityScore)]`; spread is their
absolute difference. There is **no** arbitrary ±3/±5 buffer from v0.1.

This is **source sensitivity**, not a 95% confidence interval or win probability.
`compareOutfieldMeta(A,B,position)` returns score and source differences for the same
deployment. With no explicit position it compares the two natural defaults only if their
groups match. Different groups or invalid inputs return `null`. Same strict direction
in both source deltas means `SOURCE_STABLE`; a tie or disagreement means
`SOURCE_SENSITIVE`. Proxy comparisons remain `PROXY_MODEL`, even when the mixed sources
agree. Source agreement does not establish real-match superiority.

## Integration, PA and caching

`weightedMeta` dispatches explicit FM27 natural keepers to the unchanged GK v2 formula,
and other explicit FM27 profiles to the new natural-default outfield model. FM26 and
unknown versions retain existing weights and legacy partial-value handling.
`metaScore` remains the common source for table, filters, sorting, profile, comparison,
card model and history snapshots. The existing history schema is unchanged; previously
saved values are not rewritten.

`metaPaScore` keeps the existing `projectAttrs` algorithm and `max(current, projected)`
rule. It uses the same default-position weights on the projected attributes. It is a
**hypothetical development index**, not a calibrated probability of reaching attributes
or producing match outcomes. No growth multiplier or developmental probability was added.

The shared scalar memoization uses a `WeakMap` rather than writing `_meta`/`_metaPa` into
players. It renews on metadata identity, game-version/date and age-reference changes;
replaced attribute objects, changed default positions or CA/PA also renew that player's
entry. Parsed new dumps supply fresh objects. In-place editing of individual attributes
inside the same `attrs` object remains outside the read-only import contract: supply a
new attributes/player object. No details cache or sort-time accumulation is introduced.
The bounded ten-attribute calculation and position mapping are O(1) per player; repeat
scalar lookups do not reread attribute values. No scoring network, database, game-memory
access or new npm dependency is required.

## Missing player data

Every attribute with positive weight in either source is required. For this core that is
all ten attributes in every base/proxy family. Non-finite, non-numeric, missing, `null`,
zero or out-of-range values return `null`; the valid range is inclusive 1–20. There is
no value substitution or source reweighting based on missing **player** data. The table
shows a dash, sorts unavailable scores last and excludes them from active Meta filters.
Missing player data is separate from a missing **source coefficient** such as Mac
Dribbling, whose absence was fixed at model construction.

A read-only audit of the local FM27 27.0.1 dump on 2026-11-16 parsed 113,919 players,
including 101,281 outfield profiles. All outfield profiles had a supported natural-default
position; 95,150 had valid core attributes and 6,131 had at least one invalid value.
Invalid-field counts included Finishing 3,195 and Dribbling 2,914 (counts can overlap).
Those records correctly receive no new score. This is a format/completeness check of
one local dump, not outcome validation; no private identities are committed.

## Nonlinearity and outstanding validation

[Study 12](https://github.com/caiograco289/Fm-Match-Lab/blob/9bc29019adc87cf45138c462e96c4e19077a0381/docs/studies/12-thresholds.md)
and Study 13b motivate nonlinear Jumping Reach, Pace/Acceleration interactions and weak
low-Work-Rate behavior. Their complete position-specific curves for the same GD endpoint
are not identified by the selected tables. Production remains linear: no invented
exponent, synergy factor, minimum weight or role effect. No optional nonlinear calculator
was added, keeping the requested implementation focused.

The context is the reported FM27 engine around 27.0.1, not a universal match-engine law.
After patches, reassess endpoint comparability, position transfers, attribute ranges,
uncertainty and calibration. Equal ST and CB scores do not imply equal expected points
or justify a universal transfer-price ranking. Independent, permitted player/team/fixture
outcomes and separate PA validation remain necessary. No held-out effectiveness, AUC,
correlation, p-value or probability is invented from software scenarios or attribute dumps.

## Reproduction and checks

```sh
npm test
node tools/compare-outfield-meta.js
node tools/compare-outfield-meta.js --json
node -e "console.log(JSON.stringify(require('./app/outfield-meta27').model,null,2))"
node --check app/outfield-meta27.js
node --check app/app.js
git diff --check
```

The existing test harness loads the actual module and application. Tests cover independent
integer-table hand calculations, normalization, exact constant profiles, monotonicity,
bounds, source asymmetry, all mappings/proxies, ST Finishing, missing data, unrounded
filter/sort values, multiposition selection, version/cache changes, mutation checks,
PA, role/price/interest invariants, and profile/comparison/card integration. Packaging
checks ensure the new browser module precedes `app.js` and both Windows bundle lists
include it; Mac packaging already copies the app directory.

The deterministic ten-profile comparison re-evaluates the **same** attribute profiles at
each stated deployment before ranking. Its own-position summary intentionally has no
global new ranking. Each individual deployment table provides old/new ranks and source
stability without equating performance contributions across positions.
