// FM27 outfield scouting indices. The linear source profiles are shared across versions.
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
  // Explicit research-family inputs use the same profiles as their FM deployment codes.
  const deploymentForFamily = Object.freeze({ CB: 'DC', FB: 'DL', AM: 'AMC', CM: 'MC', WM: 'ML' });
  const version = 'FM27_OUTFIELD_META_V2_1';
  const defaultRho = 0.5;
  const scenarios = freeze(Object.fromEntries([0, defaultRho, 1].map(jumpingReachRho =>
    [jumpingReachRho, { jumpingReachRho, paceCorrection: false, accelerationCorrection: false }])));
  const validAttribute = x => Number.isFinite(x) && x >= 1 && x <= 20;

  // Study 12 team-xPts slopes determine the shape only. The endpoint scale is 1–20.
  function jumpingReachUtility(x, rho = defaultRho) {
    if (!validAttribute(x) || (rho !== 0 && rho !== defaultRho && rho !== 1)) return null;
    if (rho === 0 || x === 1 || x === 20) return x;
    const full = 1 + 19 * (0.019 * Math.min(x - 1, 8) + 0.047 * Math.max(0, x - 9))
      / (0.019 * 8 + 0.047 * 11);
    return (1 - rho) * x + rho * full;
  }

  function floorDiagnostics(attrs) {
    const work = attrs?.WorkRate, stamina = attrs?.Stamina;
    const clear = 'NO_LOW_FLOOR_WARNING', missing = 'UNKNOWN';
    const workRateFloor = !validAttribute(work) ? missing : work <= 2 ? 'SEVERE_LOW_WORK_RATE'
      : work < 7 ? 'LOW_WORK_RATE' : work < 9 ? 'BELOW_PLATEAU' : clear;
    const staminaFloor = !validAttribute(stamina) ? missing : stamina <= 3 ? 'SEVERE_LOW_STAMINA'
      : stamina < 7 ? 'LOW_STAMINA' : clear;
    const floorWarnings = [workRateFloor, staminaFloor].filter(code => code !== clear && code !== missing);
    const severeFloorCount = Number(workRateFloor === 'SEVERE_LOW_WORK_RATE') + Number(staminaFloor === 'SEVERE_LOW_STAMINA');
    const floorStatus = severeFloorCount ? 'SEVERE' : floorWarnings.length ? 'WARNING'
      : workRateFloor === missing || staminaFloor === missing ? 'INCOMPLETE' : 'OK';
    return { workRateFloor, staminaFloor, floorWarnings, severeFloorCount, floorStatus };
  }

  function evaluateProfile(attrs, position, rho, output) {
    const deployment = Object.hasOwn(deploymentForFamily, position) ? deploymentForFamily[position] : position;
    const mapping = Object.hasOwn(POSITION_MAP, deployment) ? POSITION_MAP[deployment] : null;
    if (!mapping || !attrs) return null;
    const profile = profiles[mapping.group];
    const anchor = attrs[profile.requiredAttributes[0]];
    let mac = 0, purity = 0;
    for (const k of profile.requiredAttributes) {
      const v = attrs[k];
      if (!validAttribute(v)) return null;
      mac += profile.sources.mac[k] * (v - anchor);
      purity += profile.sources.purity[k] * (v - anchor);
    }
    const linearMac = anchor + mac, linearPurity = anchor + purity;
    const linearScore = (linearMac + linearPurity) / 2;
    const utility = jumpingReachUtility(attrs.JumpingReach, rho);
    if (utility === null) return null;
    const adjustment = utility - attrs.JumpingReach;
    const sourceMac = linearMac + adjustment * profile.sources.mac.JumpingReach;
    const sourcePurity = linearPurity + adjustment * profile.sources.purity.JumpingReach;
    const nonlinearScore = (sourceMac + sourcePurity) / 2;
    if (output === 'scalar') return nonlinearScore;
    const details = { position, positionGroup: mapping.group, score: nonlinearScore,
      macScore: sourceMac, purityScore: sourcePurity,
      sourceMin: Math.min(sourceMac, sourcePurity), sourceMax: Math.max(sourceMac, sourcePurity),
      sourceSpread: Math.abs(sourceMac - sourcePurity), missingSourceCoefficients: profile.missingSourceCoefficients };
    if (output === 'baseline') return { ...details, modelVersion: VERSION, evidenceStatus: mapping.evidence };
    return { ...details, version, modelVersion: version, positionEvidence: mapping.evidence,
      evidenceStatus: 'EXPLORATORY_NOT_OUTCOME_VALIDATED', linearScore, nonlinearScore, sourceMac, sourcePurity,
      nonlinearity: scenarios[rho], ...floorDiagnostics(attrs) };
  }
  const score = (attrs, position) => evaluateProfile(attrs, position, defaultRho, 'scalar');
  const evaluate = (attrs, position, rho = defaultRho) => evaluateProfile(attrs, position, rho, 'details');
  const evaluateLinear = (attrs, position) => evaluateProfile(attrs, position, 0, 'baseline');
  return freeze({ model, version, score, evaluate, evaluateLinear, jumpingReachUtility, floorDiagnostics, defaultPosition, normalizeSource });
});
