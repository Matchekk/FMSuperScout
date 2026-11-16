// Reproduce software/scenario comparisons using the real app functions. No game access.
'use strict';
const { loadApp } = require('../test/harness');
const fixture = require('../test/fixtures/fm27-gk-meta-profiles.json');

function scenarioReport() {
  const legacy = loadApp(), current = loadApp();
  legacy.state.meta = { game: 'FM26' };
  current.state.meta = { game: 'FM27' };
  const player = profile => ({ ...profile, posArr: ['GK'], attrs: { ...profile.attrs } });
  const rows = fixture.profiles.map(profile => ({
    name: profile.name, legacy: legacy.metaScore(player(profile)),
    ...current.gkMeta27Details(profile.attrs),
  }));
  const rank = key => {
    const sorted = [...rows].sort((a, b) => b[key] - a[key]);
    let value, position;
    sorted.forEach((row, i) => {
      if (value === undefined || Math.abs(row[key] - value) > 1e-12) position = i + 1;
      row[key === 'legacy' ? 'legacyRank' : 'newRank'] = position;
      value = row[key];
    });
  };
  rank('legacy'); rank('score');
  rows.sort((a, b) => a.newRank - b.newRank);
  rows.forEach((row, i) => {
    row.rankGain = row.legacyRank - row.newRank;
    const next = rows[i + 1];
    row.comparedWith = next?.name ?? null;
    const a = fixture.profiles.find(p => p.name === row.name);
    const b = next && fixture.profiles.find(p => p.name === next.name);
    row.sourceComparison = b ? current.compareGkMeta(player(a), player(b)) : null;
  });
  const baseline = Object.fromEntries(Object.keys(current.MAC_GK_BETA).map(k => [k, 12]));
  const tradeoff = current.compareGkMeta(
    player({ attrs: { ...baseline, Acceleration: 13 } }),
    player({ attrs: { ...baseline, Concentration: 13 } }));
  return { kind: 'SOFTWARE_AND_SCENARIO_TESTS_NOT_OUTCOME_VALIDATION', rows,
    tradeoff: { description: 'All core attributes 12: +1 Acceleration versus +1 Concentration', ...tradeoff } };
}

function markdown(report) {
  const f = n => n.toFixed(6);
  return '# Synthetic goalkeeper scenarios\n\n' +
    '**Software and scenario tests only. These are not validation against actual match performance.**\n\n' +
    'Reproduce with `node tools/compare-gk-meta.js` (`--json` for full precision). Inputs: ' +
    '[synthetic profiles](../test/fixtures/fm27-gk-meta-profiles.json). Positive rank gain means moving up.\n\n' +
    '| Profile | Old FM24 | FM27 v2 | Mac | Purity | Old → new rank | Rank gain | Sources vs next row |\n' +
    '|---|---:|---:|---:|---:|---:|---:|---|\n' +
    report.rows.map(r => `| ${r.name} | ${f(r.legacy)} | ${f(r.score)} | ${f(r.macScore)} | ${f(r.purityScore)} | ${r.legacyRank} → ${r.newRank} | ${r.rankGain > 0 ? '+' : ''}${r.rankGain} | ${r.sourceComparison?.stability ?? '—'} |`).join('\n') +
    '\n\nSource stability is pairwise: each row is compared with the next row in the new ranking.\n\n' +
    'Trade-off: ' + report.tradeoff.description + '. Mac delta ' + f(report.tradeoff.macDelta) +
    ', Purity delta ' + f(report.tradeoff.purityDelta) + ', ensemble delta ' + f(report.tradeoff.scoreDelta) +
    ': **' + report.tradeoff.stability + '**. No probability of superiority is implied.\n';
}

if (require.main === module) {
  const report = scenarioReport();
  process.stdout.write(process.argv.includes('--json') ? JSON.stringify(report, null, 2) + '\n' : markdown(report));
}
module.exports = { scenarioReport, markdown };
