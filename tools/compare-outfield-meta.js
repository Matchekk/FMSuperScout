// Deterministic software comparison. All profiles are rescored at the SAME deployment per ranking.
'use strict';
const { loadApp } = require('../test/harness');
const fixture = require('../test/fixtures/fm27-outfield-meta-profiles.json');
const DEPLOYMENTS = ['ST', 'DC', 'DL', 'DM', 'AMC', 'MC', 'ML', 'SW'];

function scenarioPlayers(app) {
  return fixture.profiles.map((profile, i) => ({ id: i + 1, name: profile.name,
    pos: profile.position, posArr: [profile.position], ca: 120, pa: 150, age: 21,
    attrs: { ...Object.fromEntries(Object.keys(app.META_W).map(k => [k, fixture.baselineAttribute])), ...profile.overrides } }));
}
function rank(rows, key, outputKey) {
  const sorted = [...rows].sort((a, b) => b[key] - a[key]);
  let last, position;
  sorted.forEach((row, i) => {
    if (last === undefined || Math.abs(row[key] - last) > 1e-12) position = i + 1;
    row[outputKey] = position; last = row[key];
  });
}
function scenarioReport() {
  const app = loadApp();
  const players = scenarioPlayers(app);
  app.state.meta = { game: 'FM26' };
  const legacy = players.map(p => app.metaScore(p));
  app.state.meta = { game: 'FM27' };
  const ownPosition = players.map((p, i) => ({ name: p.name, legacy: legacy[i], ...app.FMSSOutfieldMeta27.evaluateLinear(p.attrs, p.pos) }));
  const byDeployment = {};
  for (const position of DEPLOYMENTS) {
    const rows = players.map((p, i) => ({ id: p.id, name: p.name, legacy: legacy[i], ...app.FMSSOutfieldMeta27.evaluateLinear(p.attrs, position) }));
    rank(rows, 'legacy', 'legacyRank'); rank(rows, 'score', 'newRank');
    rows.sort((a, b) => a.newRank - b.newRank);
    rows.forEach((row, i) => {
      row.rankGain = row.legacyRank - row.newRank;
      const next = rows[i + 1];
      row.comparedWith = next?.name ?? null;
      row.sourceComparison = next ? app.compareOutfieldMeta(players[row.id - 1], players[next.id - 1], position, 0) : null;
    });
    byDeployment[position] = rows;
  }
  return { kind: fixture.kind,
    interpretation: 'Each ranking compares the same ten synthetic attribute profiles at ONE stated deployment; no cross-position contribution or familiarity claim.',
    ownPosition, byDeployment };
}
function markdown(report) {
  const f = n => n.toFixed(6);
  let text = '# Synthetic outfield scenarios\n\n' +
    '**Software/model comparison only; no validation of actual match improvement.**\n\n' +
    'Reproduce: `node tools/compare-outfield-meta.js` (`--json` for full precision). ' +
    '[Inputs](../test/fixtures/fm27-outfield-meta-profiles.json). Legacy = old global FMSuperScout weighting.\n\n' +
    '## Profiles at their stated positions\n\nNo cross-position ranking is assigned to this table.\n\n' +
    '| Profile | Position | Legacy | v2 | Mac | Purity | Evidence |\n|---|---|---:|---:|---:|---:|---|\n' +
    report.ownPosition.map(r => `| ${r.name} | ${r.position} | ${f(r.legacy)} | ${f(r.score)} | ${f(r.macScore)} | ${f(r.purityScore)} | ${r.evidenceStatus} |`).join('\n') + '\n';
  for (const [position, rows] of Object.entries(report.byDeployment)) {
    text += `\n## Ranking for ${position}\n\nAll ten profiles are evaluated at **${position}**. ` +
      'This evaluates attributes only; no natural-position familiarity is inferred. Positive rank gain means moving up.\n\n' +
      '| Profile | Legacy | v2 | Mac | Purity | Old → new rank | Gain | Sources vs next row |\n' +
      '|---|---:|---:|---:|---:|---:|---:|---|\n' +
      rows.map(r => `| ${r.name} | ${f(r.legacy)} | ${f(r.score)} | ${f(r.macScore)} | ${f(r.purityScore)} | ${r.legacyRank} → ${r.newRank} | ${r.rankGain > 0 ? '+' : ''}${r.rankGain} | ${r.sourceComparison?.stability ?? '—'} |`).join('\n') + '\n';
  }
  return text + '\nSource stability compares each row with the next row in the same deployment ranking. ' +
    'A tie in either source is sensitive; proxy rankings remain PROXY_MODEL even when both source mixtures agree. ' +
    'No p-values, correlations or probabilities of real superiority are inferred.\n';
}
if (require.main === module) {
  const report = scenarioReport();
  process.stdout.write(process.argv.includes('--json') ? JSON.stringify(report, null, 2) + '\n' : markdown(report));
}
module.exports = { scenarioReport, markdown, scenarioPlayers };
