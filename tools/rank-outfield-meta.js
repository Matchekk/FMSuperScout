// Offline sensitivity audit. Only synthetic profiles are identified in the output.
'use strict';
const fs = require('node:fs');
const { Readable } = require('node:stream');
const { loadApp } = require('../test/harness');
const { scenarioPlayers } = require('./compare-outfield-meta');

function syntheticPlayers(app) {
  const players = scenarioPlayers(app);
  const extra = [
    ['CB twin, reach 19', 'DC', { JumpingReach: 19 }],
    ['CB twin, reach 8', 'DC', { JumpingReach: 8 }],
    ['Aerial striker', 'ST', { JumpingReach: 18, Finishing: 16 }],
    ['Fast DM, stamina 3', 'DM', { Pace: 19, Acceleration: 19, Stamina: 3 }],
    ['High attributes, work rate 2', 'ST', { WorkRate: 2 }],
    ['High attributes, work rate 8', 'ST', { WorkRate: 8 }],
    ['High attributes, work rate 9', 'ST', { WorkRate: 9 }],
  ];
  for (const [name, pos, overrides] of extra) {
    const level = overrides.WorkRate ? 16 : 12;
    players.push({ id: players.length + 1, name, pos, posArr: [pos],
      attrs: { ...Object.fromEntries(Object.keys(app.META_W).map(k => [k, level])), ...overrides } });
  }
  return players;
}

const metrics = ['legacy', 'linear', 'working', 'full'];
function rank(rows, metric) {
  const ordered = [...rows].sort((a, b) => b[metric] - a[metric]);
  for (let first = 0; first < ordered.length;) {
    let end = first + 1;
    while (end < ordered.length && ordered[first][metric] - ordered[end][metric] < 1e-12) end++;
    const midrank = (first + 1 + end) / 2;
    // Resolve a boundary tie for exact-size top tens by original input order.
    const tied = ordered.slice(first, end).sort((a, b) => a.index - b.index);
    tied.forEach((row, i) => {
      row.ranks[metric] = midrank;
      ordered[first + i] = row;
    });
    first = end;
  }
  return ordered;
}

function summarize(rows) {
  const top = {};
  let upperDecile;
  for (const key of metrics) {
    const ordered = rank(rows, key);
    top[key] = ordered.slice(0, 10);
    if (key === 'working') upperDecile = ordered.slice(0, Math.ceil(rows.length / 10));
  }
  function compare(from, to) {
    const center = (rows.length + 1) / 2;
    let xx = 0, yy = 0, xy = 0, moved = 0, maxShift = 0, sumShift = 0, maxScoreChange = 0;
    for (const row of rows) {
      const x = row.ranks[from] - center, y = row.ranks[to] - center;
      const shift = Math.abs(x - y);
      xx += x * x; yy += y * y; xy += x * y;
      if (shift) moved++;
      maxShift = Math.max(maxShift, shift);
      sumShift += shift;
      maxScoreChange = Math.max(maxScoreChange, Math.abs(row[to] - row[from]));
    }
    return { spearman: xx && yy ? xy / Math.sqrt(xx * yy) : null,
      moved, maxShift, maxScoreChange, meanShift: sumShift / rows.length,
      overlap: top[from].filter(row => top[to].includes(row)).length };
  }
  return { n: rows.length, topCount: top.working.length,
    legacyToWorking: compare('legacy', 'working'), linearToWorking: compare('linear', 'working'),
    workingToFull: compare('working', 'full'), linearToFull: compare('linear', 'full'),
    topWarnings: top.working.filter(r => r.floorStatus === 'WARNING' || r.floorStatus === 'SEVERE').length,
    upperDecileCount: upperDecile.length,
    upperDecileWarnings: upperDecile.filter(r => r.floorWarnings.length).length,
    upperDecileSevere: upperDecile.filter(r => r.floorStatus === 'SEVERE').length,
    upperDecileIncomplete: upperDecile.filter(r => r.workRateFloor === 'UNKNOWN').length,
    topSevere: top.working.filter(r => r.floorStatus === 'SEVERE').length,
    topIncomplete: top.working.filter(r => r.workRateFloor === 'UNKNOWN').length };
}

function analyze(app, players, synthetic) {
  const api = app.FMSSOutfieldMeta27;
  const groups = {}, counts = { players: players.length, hidden: 0, goalkeepers: 0, noPosition: 0, invalid: 0, eligible: 0 };
  for (const [index, p] of players.entries()) {
    if ((!p.club && p.worldRep === 0xFFFF) || !p.name?.trim() || p.name.trim() === '?') { counts.hidden++; continue; }
    if (app.natPos(p).includes('GK')) { counts.goalkeepers++; continue; }
    const natural = api.defaultPosition(p);
    if (!natural) { counts.noPosition++; continue; }
    // The legacy global field-player formula does not depend on deployment.
    const legacy = app.weightedMeta(p, p.attrs || {});
    const positions = synthetic ? ['ST', 'DC', 'DL', 'DM', 'AMC', 'MC', 'ML', 'SW'] : [natural];
    const current = api.evaluate(p.attrs, natural);
    if (!current || !Number.isFinite(legacy)) { counts.invalid++; continue; }
    counts.eligible++;
    for (const pos of positions) {
      const d = pos === natural ? current : api.evaluate(p.attrs, pos);
      const row = { index, legacy, linear: d.linearScore, working: d.score,
        full: api.evaluate(p.attrs, pos, 1).score, floorStatus: d.floorStatus, workRateFloor: d.workRateFloor,
        floorWarnings: d.floorWarnings, ranks: {} };
      if (synthetic) Object.assign(row, { name: p.name, natural, deployment: pos });
      (groups[d.positionGroup] ||= []).push(row);
    }
  }
  return { counts, groups: Object.fromEntries(Object.entries(groups).map(([group, rows]) =>
    [group, synthetic ? { ...summarize(rows), rows } : summarize(rows)])) };
}

async function report(file) {
  const app = loadApp({ setTimeout: (cb, ms) => ms === 0 ? setTimeout(cb, 0) : 0 });
  // weightedMeta reads the game tag only for dispatch. Explicitly select the legacy model here.
  app.state.meta = { game: 'FM26' };
  if (!file) return { kind: 'synthetic', ...analyze(app, syntheticPlayers(app), true) };
  const dump = await app.parseDumpStream({ body: Readable.toWeb(fs.createReadStream(file)) }, fs.statSync(file).size, () => {});
  if (!dump._complete || dump.meta.game !== 'FM27') throw new Error('Expected a complete FM27 dump');
  return { kind: 'attribute snapshot', gameVersion: dump.meta.gameVersion, generated: dump.meta.generated,
    ...analyze(app, dump.players, false) };
}

if (require.main === module) report(process.argv[2]).then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { report, summarize };
