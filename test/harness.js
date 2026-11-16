// Testharnas: laadt de échte app/app.js in Node en geeft de reken-functies terug,
// zónder de browser. app.js is een klassiek <script> vol DOM-bediening, dus we voeren de
// broncode uit in een functie-scope met neppe (no-op) globals en pikken daarna de functies op.
// Zo testen we de echte modellen (waarde/interesse/potentie/rol) i.p.v. een kopie.
'use strict';
const fs = require('fs');
const path = require('path');

// Universele no-op element-stub: elke property/methode geeft weer een stub terug, en is
// aanroepbaar. Genoeg om alle top-level DOM-bediening van app.js geruisloos te laten slagen.
function stub(onSet) {
  const fn = function () { return stub(); };
  return new Proxy(fn, {
    get(_, prop) {
      if (prop === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
      if (prop === 'style' || prop === 'dataset') return {};
      if (prop === 'checked') return false;
      if (prop === 'value' || prop === 'textContent' || prop === 'innerHTML' ||
          prop === 'placeholder' || prop === 'title' || prop === 'className') return '';
      if (prop === 'length') return 0;
      if (prop === Symbol.toPrimitive) return () => '';
      return stub();
    },
    set(_, prop, value) { if (onSet) onSet(prop, value); return true; },
    apply() { return stub(); },
  });
}

function loadApp(options = {}) {
  // nations.js gaat vóór app.js, net als de <script>-volgorde in index.html.
  const src = fs.readFileSync(path.join(__dirname, '..', 'app', 'nations.js'), 'utf8') + '\n'
    + fs.readFileSync(options.sourcePath || path.join(__dirname, '..', 'app', 'app.js'), 'utf8');
  const el = id => options.elements?.[id] || stub((prop, value) => options.onElementSet?.(id, prop, value));
  const documentStub = {
    getElementById: el, createElement: el, querySelector: el,
    querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {},
    documentElement: stub(), body: stub(),
  };
  const windowStub = { open() {}, innerWidth: 1440, addEventListener() {}, location: { reload() {} } };
  const localStorageStub = { getItem: () => null, setItem() {}, removeItem() {} };
  const navigatorStub = { clipboard: { writeText: () => Promise.resolve() }, sendBeacon() {} };
  // Los een lege maar geldige respons op, zodat loadDump()/poll() bij het laden niet klappen.
  const fetchStub = () => Promise.resolve({
    ok: true, status: 200,
    json: () => Promise.resolve({ players: [], staff: [], meta: {}, running: false }),
    text: () => Promise.resolve(''),
  });
  const noopTimer = () => 0;

  // Functies die we willen kunnen aanroepen/inspecteren in tests.
  const exposed = [
    'estValue', 'feeMultiplier', 'feeEstimate', 'interestEstimate', 'roleScore', 'projectAttrs',
    'parseMoney', 'monthsUntil', 'getAge', 'gameNow', 'isEu', 'isFree', 'wSat', 'bestRoles',
    'rolesForPos', 'physGrowthFactor', 'mentalGrowthFactor', 'state', 'ROLE_BY_ID', 'ROLES',
    'I18N', 'ATTR_LABEL', 'ROLE_LABEL', 'CARDL', 'metaScore', 'metaPaScore',
    'NATIONS', 'JOB_LABEL', 'natsLabel', 'jobLabel', 'fmtWage', 'wageFactor',
    'histKey', 'STAFF_ATTR_LABEL', 'STAFF_ATTR_GROUPS', 'natPos', 'myTeamType', 'inMyTeam', 'dealInvolvesMe',
    'gkMeta27Details', 'compareGkMeta', 'MAC_GK_BETA', 'PURITY_GK_BETA', 'GK_META27_W',
    'META_W', 'META_GK_W', 'weightedMeta', 'metaHtml', 'metaPaHtml', 'PLAYER_COLS',
    'applyFilters', 'sortRows', 'showDetail', 'openCompare', 'buildCardModel', 'loadDump', 'parseDumpStream',
    'FMSSOutfieldMeta27', 'outfieldMetaForPosition', 'compareOutfieldMeta', 'outfieldMetaTip', 'outfieldPositionsHtml',
  ];
  const body = src + '\n;return {' + exposed.map(n => `${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(',') + '};';
  const factory = new Function(
    'document', 'window', 'localStorage', 'navigator', 'fetch',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'console', 'FMSSOutfieldMeta27',
    body,
  );
  return factory(
    documentStub, windowStub, localStorageStub, navigatorStub, options.fetch || fetchStub,
    options.setTimeout || noopTimer, noopTimer, () => {}, () => {}, console,
    require(path.join(path.dirname(options.sourcePath || path.join(__dirname, '..', 'app', 'app.js')), 'outfield-meta27.js')),
  );
}

module.exports = { loadApp };
