// FM27 Outfield Meta v2.0: pure, source-normalized goal-difference index, not an outcome forecast.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FMSSOutfieldMeta27 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEYS = ['Acceleration', 'Pace', 'JumpingReach', 'Stamina', 'Anticipation',
    'Balance', 'Strength', 'Finishing', 'Concentration', 'Dribbling'];
  const VERSION = 'FM27_OUTFIELD_META_V2.0';
  // Published GD / 38 matches / +1 displayed attribute in ONE player. null != observed zero.
  // Mac: Study 13b, Gegenpress GD table; Purity: original outfield GD table, ST/AM/WB/CB/DM.
  const RAW = {
    ST: { mac: [.49, .45, .34, .15, .13, .21, .16, .21, .08, null],
      purity: [.70, .90, .73, .34, .37, .24, .21, .27, .26, .13] },
    CB: { mac: [.41, .31, .44, .20, .15, .24, .17, .04, .12, null],
      purity: [.34, .23, .35, .14, .14, .08, .07, 0, .10, .04] },
    FB: { mac: [.29, .36, .11, .25, .14, .09, .09, 0, .19, null],
      purity: [.33, .40, .10, .28, .15, .09, .15, .06, .05, .15] },
    DM: { mac: [.27, .26, .09, .20, .10, .06, .15, .04, .08, null],
      purity: [.23, .11, .09, .09, .02, .02, .08, .04, .06, .08] },
    AM: { mac: [.24, .27, .21, .16, .11, 0, .14, .06, .06, null],
      purity: [.30, .39, .05, .20, .15, .12, .26, .14, .08, .14] },
  };
  const PROXIES = { CM_PROXY: { DM: .60, AM: .40 }, WM_PROXY: { FB: .50, AM: .50 }, CB_PROXY: { CB: 1 } };
  const POSITION_MAP = {
    ST: { group: 'ST', evidence: 'DIRECT_POSITION_FAMILY' },
    DC: { group: 'CB', evidence: 'DIRECT_POSITION_FAMILY' },
    DL: { group: 'FB', evidence: 'TRANSFER_FB_WB' }, DR: { group: 'FB', evidence: 'TRANSFER_FB_WB' },
    WBL: { group: 'FB', evidence: 'TRANSFER_FB_WB' }, WBR: { group: 'FB', evidence: 'TRANSFER_FB_WB' },
    DM: { group: 'DM', evidence: 'DIRECT_POSITION_FAMILY' },
    AML: { group: 'AM', evidence: 'TRANSFER_WIDE_CENTRAL_AM' },
    AMR: { group: 'AM', evidence: 'TRANSFER_WIDE_CENTRAL_AM' },
    AMC: { group: 'AM', evidence: 'TRANSFER_CENTRAL_AM' },
    MC: { group: 'CM_PROXY', evidence: 'PROXY_MODEL' },
    ML: { group: 'WM_PROXY', evidence: 'PROXY_MODEL' }, MR: { group: 'WM_PROXY', evidence: 'PROXY_MODEL' },
    SW: { group: 'CB_PROXY', evidence: 'PROXY_MODEL' },
  };
  // Deterministic fallback order, independent of attribute values and scoring outcomes.
  const POSITION_ORDER = ['SW', 'DC', 'DL', 'DR', 'WBL', 'WBR', 'DM', 'MC', 'ML', 'MR', 'AMC', 'AML', 'AMR', 'ST'];
  const keyed = values => Object.fromEntries(KEYS.map((k, i) => [k, values[i]]));
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  function normalizeSource(coefficients) {
    let total = 0;
    for (const k of KEYS) {
      const v = coefficients?.[k];
      if (v !== null && v !== undefined && !Number.isFinite(v)) return null;
      if (Number.isFinite(v)) total += Math.max(0, v);
    }
    if (!Number.isFinite(total) || total <= 0) return null;
    return Object.fromEntries(KEYS.map(k => [k, Number.isFinite(coefficients[k]) ? Math.max(0, coefficients[k]) / total : 0]));
  }
  const profiles = {};
  for (const group of Object.keys(RAW)) {
    const raw = { mac: keyed(RAW[group].mac), purity: keyed(RAW[group].purity) };
    const sources = { mac: normalizeSource(raw.mac), purity: normalizeSource(raw.purity) };
    if (!sources.mac || !sources.purity) throw new Error('Invalid outfield source coefficients: ' + group);
    profiles[group] = { raw, sources };
  }
  for (const [group, mixture] of Object.entries(PROXIES)) {
    const sources = {};
    for (const source of ['mac', 'purity']) sources[source] = Object.fromEntries(KEYS.map(k =>
      [k, Object.entries(mixture).reduce((sum, [base, share]) => sum + share * profiles[base].sources[source][k], 0)]));
    profiles[group] = { raw: null, mixture, sources };
  }
  for (const profile of Object.values(profiles)) {
    profile.weights = Object.fromEntries(KEYS.map(k => [k, (profile.sources.mac[k] + profile.sources.purity[k]) / 2]));
    profile.requiredAttributes = KEYS.filter(k => profile.weights[k] > 0);
    profile.missingSourceCoefficients = { mac: ['Dribbling'], purity: [] };
  }
  const model = freeze({
    modelVersion: VERSION, scale: [1, 20], endpoint: 'Goal difference / 38 matches / +1 attribute in one player',
    sourceShares: { mac: .5, purity: .5 },
    sources: {
      mac: { url: 'https://github.com/caiograco289/Fm-Match-Lab/blob/9bc29019adc87cf45138c462e96c4e19077a0381/docs/studies/13b-value-by-position-random.md#goal-difference',
        matches: 50000, context: 'Gegenpress; Catenaccio 34340 is same-family sensitivity, not another vote' },
      purity: { url: 'https://fm-arena.com/threads/attribute-importance-by-position-in-fm27-a-test-on-my-own-tactic.125/',
        matches: 200000, configurations: 50000, seeds: 4, context: 'Brentford 3-4-2-1; WB maps to FB, central AM transfers to AM family' },
      precursor: { url: 'https://github.com/Matchekk/FM-27-Research/blob/0a1e0ad1575e484b6377f2d761ffd5e16af36b8a/research/meta_score_v01_weights.json',
        role: 'Raw-table starting point, checked against original sources; no borrowed Mac Dribbling or rounded v0.1 weights' },
    },
    positions: POSITION_MAP, defaultPositionOrder: POSITION_ORDER, profiles,
    limitations: [
      'Not independently outcome calibrated; no win probability or predicted points.',
      'Compare within the same deployment family; cross-position scores are not equal performance contributions.',
      'Positive reported point estimates retained, including small unconfirmed effects; no significance-based minimum weights.',
      'Null source coefficients are unobserved, never replicated zero effects; player attributes with positive weight must all be valid.',
      'CM/WM/SW are declared heuristics; FB/WB and central/wide AM transfers retain contextual uncertainty.',
      'No fitted nonlinearities, role bonuses, synergy multipliers or developmental probabilities.',
      'Intended FM27 engine context around 27.0.1; revalidate after match-engine patches.',
    ],
  });
  function defaultPosition(player) {
    const positions = player?.posNat || player?.posArr;
    if (!Array.isArray(positions) || positions.includes('GK')) return null;
    if (Object.hasOwn(POSITION_MAP, player.pos) && positions.includes(player.pos)) return player.pos;
    for (const position of POSITION_ORDER) if (positions.includes(position)) return position;
    return null;
  }
  function evaluate(attrs, position) {
    const mapping = Object.hasOwn(POSITION_MAP, position) ? POSITION_MAP[position] : null;
    if (!mapping || !attrs) return null;
    const profile = profiles[mapping.group];
    const anchor = attrs[profile.requiredAttributes[0]];
    let mac = 0, purity = 0;
    for (const k of profile.requiredAttributes) {
      const v = attrs[k];
      if (!Number.isFinite(v) || v < 1 || v > 20) return null;
      mac += profile.sources.mac[k] * (v - anchor);
      purity += profile.sources.purity[k] * (v - anchor);
    }
    const macScore = anchor + mac, purityScore = anchor + purity;
    return { score: (macScore + purityScore) / 2, macScore, purityScore,
      sourceMin: Math.min(macScore, purityScore), sourceMax: Math.max(macScore, purityScore),
      sourceSpread: Math.abs(macScore - purityScore), position, positionGroup: mapping.group,
      evidenceStatus: mapping.evidence, modelVersion: VERSION,
      missingSourceCoefficients: profile.missingSourceCoefficients };
  }
  return freeze({ model, evaluate, defaultPosition, normalizeSource });
});
