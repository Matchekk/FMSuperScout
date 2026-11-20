'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');
const { report, summarize } = require('../tools/rank-outfield-meta');

const app = loadApp();
const api = app.FMSSOutfieldMeta27;
const attrs = (level, overrides = {}) => ({ ...Object.fromEntries(Object.keys(app.META_W).map(k => [k, level])), ...overrides });
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, a + ' vs ' + b);
const scenarios = [0, 0.5, 1];

test('Jumping Reach matches normalized slopes on both sides of a continuous knot', () => {
  const g = api.jumpingReachUtility;
  for (const rho of scenarios) {
    assert.equal(g(1, rho), 1);
    assert.equal(g(20, rho), 20);
    for (let i = 1; i < 20; i++) {
      const expectedSlope = (1 - rho) + rho * 19 * (i < 9 ? 19 : 47) / 669;
      close(g(i + 1, rho) - g(i, rho), expectedSlope);
    }
    for (const x of [8.999999, 9, 9.000001]) {
      const full = 1 + 19 * (x <= 9 ? 19 * (x - 1) : 152 + 47 * (x - 9)) / 669;
      close(g(x, rho), x + rho * (full - x));
    }
  }
  for (const invalid of [0, 21, '9', NaN, -Infinity]) assert.equal(g(invalid), null);
  for (const rho of [-1, 0.75, NaN, Infinity, '0']) assert.equal(api.evaluate(attrs(12), 'ST', rho), null);
});

test('All positions and scenarios match the weighted utilities and are monotone in every attribute', () => {
  for (const [pos, mapping] of Object.entries(api.model.positions)) {
    const profile = api.model.profiles[mapping.group];
    const weights = profile.weights;
    assert.ok(weights.Finishing > 0 && weights.Strength > 0);
    close(Object.values(weights).reduce((sum, w) => sum + w), 1);
    for (const [key, weight] of Object.entries(weights)) {
      assert.ok(weight >= 0);
      for (const rho of scenarios) {
        let previous = -Infinity;
        for (let i = 1; i <= 20; i++) {
          const x = Object.freeze(attrs(12, { [key]: i }));
          const d = api.evaluate(x, pos, rho);
          assert.ok(d.score >= previous && d.score >= 1 && d.score <= 20);
          previous = d.score;
          const baseline = api.evaluateLinear(x, pos);
          const delta = api.jumpingReachUtility(x.JumpingReach, rho) - x.JumpingReach;
          close(d.score, baseline.score + weights.JumpingReach * delta);
          close(d.sourceMac, baseline.macScore + profile.sources.mac.JumpingReach * delta);
          close(d.sourcePurity, baseline.purityScore + profile.sources.purity.JumpingReach * delta);
          assert.equal(d.linearScore, baseline.score);
          if (rho === 0) assert.equal(d.score, baseline.score);
          if (rho === 0.5) {
            assert.equal(api.score(x, pos), d.score);
            close(d.score, (baseline.score + api.evaluate(x, pos, 1).score) / 2);
          }
        }
      }
    }
    for (const rho of scenarios) for (const endpoint of [1, 20]) assert.equal(api.evaluate(attrs(endpoint), pos, rho).score, endpoint);
    const d = api.evaluate(attrs(12), pos);
    assert.ok(d.nonlinearScore < d.linearScore);
    assert.equal(d.version, 'FM27_OUTFIELD_META_V2_1');
    assert.equal(d.evidenceStatus, 'EXPLORATORY_NOT_OUTCOME_VALIDATED');
    assert.deepEqual(d.nonlinearity, { jumpingReachRho: 0.5, paceCorrection: false, accelerationCorrection: false });
  }
});

test('Explicit family inputs match FM deployments and preserve proxy labels', () => {
  for (const [family, position] of Object.entries({ CB: 'DC', FB: 'DL', AM: 'AMC', CM: 'MC', WM: 'ML' })) {
    const x = attrs(12, { JumpingReach: 19 });
    assert.deepEqual(api.evaluate(x, family), { ...api.evaluate(x, position), position: family });
  }
});

test('Floor boundaries, unknown measurements and independent score contributions', () => {
  const base = attrs(15), pos = 'DM';
  const clear = 'NO_LOW_FLOOR_WARNING';
  for (const [work, expected] of [[1,'SEVERE_LOW_WORK_RATE'],[2,'SEVERE_LOW_WORK_RATE'],[3,'LOW_WORK_RATE'],
    [6,'LOW_WORK_RATE'],[7,'BELOW_PLATEAU'],[8,'BELOW_PLATEAU'],[9,clear],[20,clear],[undefined,'UNKNOWN'],['9','UNKNOWN']]) {
    const d = api.evaluate({ ...base, WorkRate: work }, pos);
    assert.equal(d.workRateFloor, expected);
    assert.equal(d.score, api.score(base, pos));
    assert.equal(d.severeFloorCount, Number(work <= 2));
    assert.equal(d.floorStatus, expected === clear ? 'OK' : expected === 'UNKNOWN' ? 'INCOMPLETE' : work <= 2 ? 'SEVERE' : 'WARNING');
  }
  for (const [stamina, expected] of [[1,'SEVERE_LOW_STAMINA'],[3,'SEVERE_LOW_STAMINA'],[4,'LOW_STAMINA'],[6,'LOW_STAMINA'],[7,clear]]) {
    const d = api.evaluate({ ...base, Stamina: stamina, WorkRate: 2 }, pos);
    assert.equal(d.staminaFloor, expected);
    assert.equal(d.severeFloorCount, stamina <= 3 ? 2 : 1);
    assert.deepEqual(d.floorWarnings, expected === clear ? ['SEVERE_LOW_WORK_RATE'] : ['SEVERE_LOW_WORK_RATE', expected]);
    close(d.score - api.score(base, pos), api.model.profiles.DM.weights.Stamina * (stamina - 15));
  }
  assert.equal(api.evaluate({ ...base, Stamina: null }, pos), null);
  assert.equal(api.floorDiagnostics({}).floorStatus, 'INCOMPLETE');
});

test('Table warning and projected tooltip expose observed floors and the corresponding linear baseline', () => {
  const m = loadApp();
  m.state.meta = { game: 'FM27' }; m.state.lang = 'en';
  const p = { pos: 'DC', posArr: ['DC'], ca: 110, pa: 160, age: 20, attrs: attrs(12, { WorkRate: 2 }) };
  const d = api.evaluate(m.projectAttrs(p), 'DC');
  assert.match(m.metaHtml(p), /⚠/);
  assert.match(m.outfieldPositionsHtml(p), /Work Rate 2 \(very low\)/);
  assert.match(m.outfieldMetaTip(p, true), /Current attributes · Work Rate 2/);
  assert.ok(m.outfieldMetaTip(p, true).includes('Linear v2.0 ' + d.linearScore.toFixed(2)));
  assert.equal(m.metaPaScore(p), d.score);
  for (const work of [2, 8, 9, undefined]) {
    p.attrs = attrs(12, { WorkRate: work, Stamina: 12 });
    assert.equal(m.metaHtml(p).includes('⚠'), work < 9);
  }
});

test('Numeric Meta filter and sort follow a rank reversal caused by the curve', () => {
  const min = { value: '', addEventListener() {}, classList: { toggle() {} } };
  const m = loadApp({ elements: { 'f-meta-min': min } });
  m.state.meta = { game: 'FM27' };
  const base = { name: 'Test player', pos: 'ST', posArr: ['ST'], club: 'Test', ca: 120, pa: 120 };
  const aerial = { ...base, id: 1, attrs: attrs(12, { JumpingReach: 19 }) };
  const rival = { ...base, id: 2, attrs: attrs(12, { Acceleration: 16, Concentration: 17,
    Strength: 17, Anticipation: 16, Pace: 10 }) };
  assert.ok(api.evaluateLinear(rival.attrs, 'ST').score > api.evaluateLinear(aerial.attrs, 'ST').score);
  m.state.players = [rival, aerial]; m.state.filtered = [...m.state.players];
  m.state.sortKey = 'meta'; m.state.sortDir = -1; m.sortRows();
  assert.deepEqual(m.state.filtered.map(p => p.id), [1, 2]);
  min.value = '13.1'; m.applyFilters();
  assert.deepEqual(m.state.filtered.map(p => p.id), [1]);
});

test('Model switch invalidates current and projected scalar caches without recording CA growth', async () => {
  const model = { ...api };
  const posted = [];
  const m = loadApp({ outfieldModel: model, fetch: async (url, options) => {
    if (url === '/api/history') posted.push(JSON.parse(options.body).players);
    return { ok: true, json: async () => ({}) };
  } });
  m.state.meta = { game: 'FM27', gameDate: '2027-01-01' };
  const p = { id: 123, pos: 'ST', posArr: ['ST'], attrs: attrs(12), ca: 110, pa: 150, value: 500 };
  m.state.players = [p]; m.state.hist = { map: new Map([[123, [110,150]]]) };
  model.version = api.model.modelVersion;
  model.score = (x, pos) => api.evaluateLinear(x, pos)?.score ?? null;
  const linear = m.metaScore(p), linearPa = m.metaPaScore(p);
  await m.postHistorySnapshot();
  model.version = api.version; model.score = api.score;
  assert.ok(m.metaScore(p) < linear && m.metaPaScore(p) < linearPa);
  assert.equal(m.caGrowth(p), 0);
  await m.postHistorySnapshot();
  assert.deepEqual(posted, [{ 123: [110,150,500] }, { 123: [110,150,500] }]);
});

test('Sensitivity report handles ties, cutoff and constant ranks, and measures actual movements', async () => {
  const rows = Array.from({length: 12}, (_, index) => ({ index, ranks: {}, legacy: 12 - index, linear: index,
    working: 1, full: index, floorStatus: 'OK', floorWarnings: [] }));
  const summary = summarize(rows);
  assert.equal(summary.linearToWorking.spearman, null);
  assert.equal(summary.linearToFull.spearman, 1);
  assert.equal(summary.linearToWorking.overlap, 8);
  assert.equal(rows[11].ranks.working, 6.5);
  const result = await report();
  assert.equal(result.counts.eligible, 17);
  assert.equal(result.groups.ST.linearToWorking.moved, 2);
  assert.equal(result.groups.ST.topWarnings, 3);
  const high = result.groups.ST.rows.filter(r => r.name.startsWith('High attributes'));
  assert.equal(new Set(high.map(r => r.ranks.working)).size, 1);
  assert.deepEqual(high.map(r => r.floorStatus), ['SEVERE', 'WARNING', 'OK']);
});
