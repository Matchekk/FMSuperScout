// Modeltests voor FMSuperScout — draai met:  node --test
// Zero-dependency (node:test + node:assert), past bij de rest van de stack.
// We testen de ECHTE functies uit app/app.js via het harnas. Dit vangt regressies bij het
// bijstellen van de reken-modellen (waarde/interesse/potentie/rol) zonder handmatig herijken.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');

const M = loadApp();
// Vaste context i.p.v. localStorage/dump: peiljaar en valuta bekend maken.
M.state.cur = '£';
M.state.refYear = 2027;
M.state.refDoy = 1;
M.state.meta = { gameDate: '2027-01-01', gameYear: 2027, myClub: 'Testclub', myClubRep: 6000 };
M.state.players = [];

// Representatieve speler; velden zoals de plugin ze dumpt.
function player(over = {}) {
  return Object.assign({
    id: 1, name: 'Test Speler', birthYear: 2006, birthDoy: 1, age: 21,
    club: 'Andere Club', clubRep: 3000, worldRep: 2000, wage: 20000,
    ca: 120, pa: 150, pos: 'ST', posArr: ['ST'], nat: ['Netherlands'], foot: 'Rechts',
    value: 5_000_000, expires: '2028-06-30',
    attrs: {
      Finishing: 14, Passing: 11, Technique: 13, FirstTouch: 13, Dribbling: 12, Marking: 5, Tackling: 6,
      Composure: 13, Decisions: 12, Determination: 14, OffTheBall: 13, Anticipation: 12, WorkRate: 12,
      Pace: 15, Acceleration: 15, Strength: 12, Stamina: 13, Agility: 13, Balance: 12,
      Corners: 6, FreeKicks: 7,
      Consistency: 14, ImportantMatches: 12, InjuryProneness: 8, Versatility: 10, Dirtiness: 5,
    },
  }, over);
}

// ---------- parseMoney ----------
test('parseMoney: eenheden en randgevallen (£)', () => {
  assert.equal(M.parseMoney('10M'), 10_000_000);
  assert.equal(M.parseMoney('50K'), 50_000);
  assert.equal(M.parseMoney('1.8m'), 1_800_000);
  assert.equal(M.parseMoney('2mld'), 2_000_000_000);
  assert.equal(M.parseMoney('1,5M'), 1_500_000);   // komma als decimaal
  assert.equal(M.parseMoney(''), null);
  assert.equal(M.parseMoney('   '), null);
});

test('parseMoney: valuta terug naar interne GBP', () => {
  const near = (a, b) => Math.abs(a - b) < 1;   // deling geeft floating-point-ruis
  M.state.cur = '€';
  assert.ok(near(M.parseMoney('1.16M'), 1_000_000), '€1,16M → £1M');
  M.state.cur = '$';
  assert.ok(near(M.parseMoney('1.35M'), 1_000_000), '$1,35M → £1M');
  M.state.cur = '£';
  assert.equal(M.parseMoney('1M'), 1_000_000);
});

// ---------- monthsUntil ----------
test('monthsUntil: t.o.v. in-game datum', () => {
  assert.equal(M.monthsUntil(null), null);
  const half = M.monthsUntil('2027-07-01');   // ~6 maanden na 2027-01-01
  assert.ok(half > 5.5 && half < 6.5, `verwacht ~6, kreeg ${half}`);
  assert.ok(M.monthsUntil('2026-07-01') < 0, 'verleden = negatief');
});

// ---------- projectAttrs (potentie) ----------
test('projectAttrs: PA<=CA geeft geen projectie', () => {
  assert.equal(M.projectAttrs(player({ ca: 150, pa: 150 })), null);
  assert.equal(M.projectAttrs(player({ ca: 150, pa: 120 })), null);
});

test('projectAttrs: groeit, blijft <=20, laat verborgen kenmerken met rust', () => {
  const p = player({ ca: 100, pa: 160, age: 18 });
  const proj = M.projectAttrs(p);
  for (const k of Object.keys(p.attrs)) {
    if (['Consistency', 'ImportantMatches', 'Versatility', 'InjuryProneness', 'Dirtiness'].includes(k)) {
      assert.equal(proj[k], undefined, `verborgen kenmerk ${k} mag niet geprojecteerd worden`);
    } else {
      assert.ok(proj[k] >= p.attrs[k], `${k} mag niet dalen`);
      assert.ok(proj[k] <= 20, `${k} mag niet boven 20`);
    }
  }
});

test('projectAttrs: fysiek bevriest bij oudere speler, mentaal groeit door', () => {
  // Leeftijd via birthYear (getAge geeft birthYear voorrang boven het age-veld). refYear = 2027.
  const young = M.projectAttrs(player({ ca: 145, pa: 162, birthYear: 2005 }));   // 22
  const old = M.projectAttrs(player({ ca: 145, pa: 162, birthYear: 1996 }));     // 31
  const baseAttrs = player().attrs;
  const base = { attrs: baseAttrs };
  // Snelheidsgroei jong > oud (bij oud vrijwel bevroren)
  const paceGrowYoung = young.Pace - base.attrs.Pace;
  const paceGrowOld = old.Pace - base.attrs.Pace;
  assert.ok(paceGrowYoung >= paceGrowOld, 'jonge speler groeit fysiek minstens zo hard als oude');
  assert.ok(paceGrowOld <= 1, 'oude speler wint nauwelijks snelheid');
  // Mentale groei bij de oudere speler nog aanwezig
  assert.ok(old.Determination >= base.attrs.Determination, 'mentaal groeit ook op leeftijd');
});

// ---------- estValue ----------
test('estValue: echte in-game waarde komt er 1:1 uit (geen schatting)', () => {
  const ev = M.estValue(player({ value: 8_000_000 }));
  assert.equal(ev.v, 8_000_000);
  assert.equal(ev.est, false);
});

test('estValue: zonder echte waarde schat het een positief bereik', () => {
  const ev = M.estValue(player({ value: 0, worldRep: 4000 }));
  assert.equal(ev.est, true);
  assert.ok(ev.v == null || ev.v >= 0);
  // hogere reputatie => hogere schatting
  const lo = M.estValue(player({ value: 0, worldRep: 1000 }));
  const hi = M.estValue(player({ value: 0, worldRep: 7000 }));
  assert.ok(hi.v >= lo.v, 'meer reputatie => hogere schatting');
});

// ---------- interestEstimate ----------
test('interestEstimate: onbekende leeftijd wordt NIET als minderjarige behandeld', () => {
  const unknown = M.interestEstimate(player({ age: 0, birthYear: 0 }));
  assert.ok(unknown && unknown.note !== 'minor', 'age 0 mag geen minor-cap krijgen');
  assert.ok(unknown.score > 6, `onbekende leeftijd mag niet op minor-cap (6) blijven, kreeg ${unknown.score}`);
  const realMinor = M.interestEstimate(player({ age: 14, birthYear: 2013 }));
  assert.equal(realMinor.note, 'minor');
  assert.ok(realMinor.score <= 6);
});

test('interestEstimate: eigen speler => null', () => {
  assert.equal(M.interestEstimate(player({ club: 'Testclub' })), null);
});

// ---------- roleScore ----------
test('roleScore: betere attributen => hogere rolscore', () => {
  const roles = M.ROLES || [];
  assert.ok(roles.length, 'er zijn rollen gedefinieerd');
  const role = roles[0];
  const weak = player();
  const strong = player();
  for (const k of Object.keys(strong.attrs)) strong.attrs[k] = Math.min(20, weak.attrs[k] + 4);
  const sWeak = M.roleScore(weak, role);
  const sStrong = M.roleScore(strong, role);
  assert.ok(sStrong >= sWeak, `sterker profiel moet minstens even hoog scoren (${sStrong} vs ${sWeak})`);
});

test('historie: FM27 krijgt een eigen carrière-sleutel, FM26 houdt de kale managernaam', () => {
  const saved = M.state.meta;
  try {
    M.state.meta = { manager: 'Jan Jansen' };                  // oude dump zonder game-veld
    assert.equal(M.histKey(), 'Jan Jansen');
    M.state.meta = { manager: 'Jan Jansen', game: 'FM26' };
    assert.equal(M.histKey(), 'Jan Jansen');
    M.state.meta = { manager: 'Jan Jansen', game: 'FM27' };
    assert.equal(M.histKey(), 'Jan Jansen (FM27)');
    M.state.meta = {};
    assert.equal(M.histKey(), 'default');
  } finally { M.state.meta = saved; }
});

test('posities: natPos valt terug op posArr (oude dumps) en gebruikt posNat als die er is', () => {
  assert.deepEqual(M.natPos({ posArr: ['DC'] }), ['DC']);
  assert.deepEqual(M.natPos({ posArr: ['DC', 'DM'], posNat: ['DC'] }), ['DC']);
  assert.deepEqual(M.natPos({}), []);
});

// ---------- teamchips binnen "Mijn club" ----------
// Verhuurde spelers horen bij het elftal van de moederclub (ownerTeamType), niet bij het
// elftal van de huurclub (teamType, bijna altijd 0). Praktijkgeval 05-11: Vanhoutte, reserves
// bij Feyenoord en verhuurd, stond onder "1e elftal".
test('inMyTeam: verhuurde speler telt bij zijn elftal bij de moederclub', () => {
  const my = 'feyenoord';
  const own0 = { club: 'Feyenoord', teamType: 0 };
  const own11 = { club: 'Feyenoord', teamType: 11 };
  const outRes = { club: 'Basaksehir', ownerClub: 'Feyenoord', teamType: 0, ownerTeamType: 3 };
  const outYouth = { club: 'FC Emmen', ownerClub: 'Feyenoord', teamType: 0, ownerTeamType: 11 };
  const outFirst = { club: 'FC Groningen', ownerClub: 'Feyenoord', teamType: 0, ownerTeamType: 0 };
  const outUnknown = { club: 'Almere', ownerClub: 'Feyenoord', teamType: 0 };
  const loanIn = { club: 'Feyenoord', ownerClub: 'Ajax', teamType: 0, ownerTeamType: 3 };
  const first = [own0, own11, outRes, outYouth, outFirst, outUnknown, loanIn].filter(p => M.inMyTeam(p, 'first', my));
  assert.deepEqual(first, [own0, outFirst, loanIn]);
  assert.ok(M.inMyTeam(outRes, 'res', my));
  assert.ok(M.inMyTeam(outYouth, 'youth', my));
  assert.ok(!M.inMyTeam(outRes, 'first', my));
  // Onbekend elftal: alleen onder "Alles", nergens anders.
  for (const sel of ['first', 'res', 'youth']) assert.ok(!M.inMyTeam(outUnknown, sel, my));
  assert.ok(M.inMyTeam(outUnknown, 'all', my));
  assert.equal(M.myTeamType(loanIn, my), 0);   // gehuurd: elftal waarin hij bij mij speelt
});

// ---------- transferakkoorden ----------
// Spelers met een akkoord gaan standaard uit de lijst, behalve als mijn club erbij betrokken is
// (eigen speler die vertrekt, speler die naar mij komt, of mijn speler die verhuurd is).
test('dealInvolvesMe: van, naar of eigendom van mijn club', () => {
  const my = 'feyenoord';
  assert.ok(M.dealInvolvesMe({ club: 'Feyenoord', transferTo: 'Parthenope' }, my));
  assert.ok(M.dealInvolvesMe({ club: 'Mallorca', transferTo: 'Feyenoord' }, my));
  assert.ok(M.dealInvolvesMe({ club: 'Emmen', ownerClub: 'Feyenoord', transferTo: 'Ajax' }, my));
  assert.ok(!M.dealInvolvesMe({ club: 'Mallorca', transferTo: 'Barcelona' }, my));
  assert.ok(!M.dealInvolvesMe({ club: 'Mallorca', transferTo: 'Barcelona' }, ''));
});

// ---------- FM27 goalkeeper meta v2.0 (real application code, no model copy) ----------
const GK_KEYS = ['Agility', 'Reflexes', 'AerialReach', 'Concentration', 'Acceleration', 'Handling'];
const gkAttrs = (value = 12, overrides = {}) => Object.assign(Object.fromEntries(GK_KEYS.map(k => [k, value])), overrides);
const goalkeeper = (attrs = gkAttrs(), overrides = {}) => player({ pos: 'GK', posArr: ['GK'], attrs, pressure: 12, ...overrides });
const near = (actual, expected, eps = 1e-12) => assert.ok(Math.abs(actual - expected) <= eps, `${actual} != ${expected}`);
function fm27(options = {}) { const app = loadApp(options); app.state.meta = { game: 'FM27', gameDate: '2027-01-01' }; return app; }

test('GK v2: exact uniform scores at 1, 12 and 20', () => {
  for (const value of [1, 12, 20]) {
    const details = M.gkMeta27Details(gkAttrs(value));
    assert.deepEqual(details, { score: value, macScore: value, purityScore: value,
      sensitivityMin: value, sensitivityMax: value, sourceSpread: 0 });
  }
});

test('GK v2: raw coefficients are immutable and effective weights sum to one', () => {
  assert.deepEqual(M.MAC_GK_BETA, { Agility: .93, Reflexes: .76, AerialReach: .23, Concentration: .08, Acceleration: .15, Handling: .11 });
  assert.deepEqual(M.PURITY_GK_BETA, { Agility: .71, Reflexes: .65, AerialReach: .26, Concentration: .17, Acceleration: .09, Handling: .04 });
  for (const weights of [M.MAC_GK_BETA, M.PURITY_GK_BETA, M.GK_META27_W]) assert.ok(Object.isFrozen(weights));
  near(Object.values(M.MAC_GK_BETA).reduce((a,b) => a+b,0), 2.26);
  near(Object.values(M.PURITY_GK_BETA).reduce((a,b) => a+b,0), 1.92);
  near(Object.values(M.GK_META27_W).reduce((a,b) => a+b,0), 1);
  // Independent integer arithmetic, rather than rounded published percentages.
  const mac = [93, 76, 23, 8, 15, 11], purity = [71, 65, 26, 17, 9, 4];
  for (let i=0;i<GK_KEYS.length;i++) {
    const weight = (mac[i]*192 + purity[i]*226)/(2*226*192);
    near(M.GK_META27_W[GK_KEYS[i]], weight);
    near(M.gkMeta27Details(gkAttrs(12, { [GK_KEYS[i]]: 13 })).score - 12, weight);
  }
});

test('GK v2: reference profile agrees with independent hand calculation', () => {
  const d = M.gkMeta27Details(gkAttrs(12, { Agility: 16, Reflexes: 16, AerialReach: 13 }));
  // Numerators in hundredths: 3411 / 226 and 2874 / 192.
  near(d.macScore, 3411/226);
  near(d.purityScore, 2874/192);
  near(d.score, (3411/226 + 2874/192)/2);
  near(d.macScore, 15.09292035, 1e-8);
  near(d.purityScore, 14.96875);
  near(d.score, 15.03083518, 1e-8);
  assert.equal(d.sensitivityMin, d.purityScore);
  assert.equal(d.sensitivityMax, d.macScore);
  near(d.sourceSpread, 3411/226 - 2874/192);
});

test('GK v2: bounded and monotone on corners and deterministic varied profiles', () => {
  let seed=27;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  const inputs=[];
  for(let mask=0;mask<64;mask++) inputs.push(Object.fromEntries(GK_KEYS.map((k,i)=>[k,(mask>>i)&1?20:1])));
  for(let i=0;i<400;i++) inputs.push(Object.fromEntries(GK_KEYS.map(k=>[k,1+rand()*19])));
  for(const attrs of inputs) {
    const d=M.gkMeta27Details(attrs);
    for(const key of ['score','macScore','purityScore','sensitivityMin','sensitivityMax']) assert.ok(d[key]>=1&&d[key]<=20, key);
    for(const k of GK_KEYS) if(attrs[k]<20) {
      const up=M.gkMeta27Details({...attrs,[k]:Math.min(20,attrs[k]+1)});
      assert.ok(up.score>d.score, k);
      assert.ok(up.macScore>d.macScore&&up.purityScore>d.purityScore,k);
    }
  }
});

test('GK v2: correct marginal weight ordering', () => {
  const delta=k=>M.gkMeta27Details(gkAttrs(12,{[k]:13})).score-12;
  for(const [a,b] of [['Agility','Reflexes'],['Reflexes','AerialReach'],['AerialReach','Concentration'],['Concentration','Acceleration'],['Acceleration','Handling']]) assert.ok(delta(a)>delta(b), `${a} > ${b}`);
});

test('GK v2: every missing or invalid required attribute returns null without imputation', () => {
  for(const k of GK_KEYS) {
    const missing=gkAttrs();delete missing[k];assert.equal(M.gkMeta27Details(missing),null,k);
    for(const value of [undefined,null,NaN,Infinity,-Infinity,0,-1,20.01,21,'12',true]) {
      assert.equal(M.gkMeta27Details(gkAttrs(12,{[k]:value})),null,`${k}: ${value}`);
      const app=fm27();const p=goalkeeper(gkAttrs(12,{[k]:value}));
      assert.equal(app.metaScore(p),null);assert.equal(app.metaPaScore(p),null);
    }
  }
  for(const attrs of [undefined,null,{}]) {
    assert.equal(M.gkMeta27Details(attrs),null);
    assert.equal(fm27().metaScore(goalkeeper(attrs, { attrs })),null);
  }
  const noAttrs=goalkeeper();delete noAttrs.attrs;
  assert.equal(fm27().metaScore(noAttrs),null);
  assert.equal(fm27().metaPaScore(noAttrs),null);
});

test('GK v2: irrelevant attributes and unexported numeric familiarity do not influence the core', () => {
  const app=fm27();const base=app.metaScore(goalkeeper());
  for(const k of ['Pressure','Pace','Positioning','OneOnOnes','Kicking','CommandOfArea','ImportantMatches','Determination']) {
    for(const v of [1,20]) assert.equal(app.metaScore(goalkeeper({...gkAttrs(),[k]:v},{pressure:v})),base,k);
  }
  assert.equal(app.metaScore(goalkeeper(gkAttrs(),{positionRatings:{GK:1}})),base);
  assert.equal(app.metaScore(goalkeeper(gkAttrs(),{positionRatings:{GK:20}})),base);
});

test('GK v2: pure details and comparison do not mutate frozen profiles', () => {
  const a=Object.freeze(goalkeeper(Object.freeze(gkAttrs(12,{Agility:16})),{posArr:Object.freeze(['GK'])}));
  const b=Object.freeze(goalkeeper(Object.freeze(gkAttrs()),{posArr:Object.freeze(['GK'])}));
  const before=JSON.stringify([a,b]);
  assert.ok(M.gkMeta27Details(a.attrs));assert.ok(M.compareGkMeta(a,b));
  assert.equal(JSON.stringify([a,b]),before);
});

test('GK v2: source stability requires strict same-sign differences', () => {
  const baseline=goalkeeper();
  const stable=M.compareGkMeta(goalkeeper(gkAttrs(13)),baseline);
  assert.equal(stable.stability,'SOURCE_STABLE');assert.equal(stable.sourceStable,true);
  assert.equal(stable.scoreDelta,1);assert.equal(stable.macDelta,1);assert.equal(stable.purityDelta,1);
  const reversed=M.compareGkMeta(baseline,goalkeeper(gkAttrs(13)));
  assert.equal(reversed.stability,'SOURCE_STABLE');assert.equal(reversed.scoreDelta,-1);
  const tradeoff=M.compareGkMeta(goalkeeper(gkAttrs(12,{Acceleration:13})),goalkeeper(gkAttrs(12,{Concentration:13})));
  assert.ok(tradeoff.macDelta>0&&tradeoff.purityDelta<0);
  assert.equal(tradeoff.stability,'SOURCE_SENSITIVE');assert.equal(tradeoff.sourceStable,false);
  assert.equal(M.compareGkMeta(baseline,goalkeeper()).stability,'SOURCE_SENSITIVE');
  const oneTie=M.compareGkMeta(goalkeeper(gkAttrs(2,{Handling:10})),goalkeeper(gkAttrs(2,{Concentration:13})));
  near(oneTie.macDelta,0);assert.equal(oneTie.stability,'SOURCE_SENSITIVE');
  assert.equal(M.compareGkMeta(goalkeeper({}),baseline),null);
  assert.equal(M.compareGkMeta(player(),baseline),null);
  assert.equal(M.compareGkMeta(null,baseline),null);
});

test('GK v2: only explicitly identified FM27 natural goalkeepers use v2', () => {
  const attrs=gkAttrs(12,{Agility:16,Reflexes:16,AerialReach:13,Pace:19});
  const legacy=(16*12.8+16*8+12*4.7+12*4.1+19*3.5+13*3.4)/36.5;
  for(const game of ['FM26',undefined,'','fm27','FM28',27]) {
    const app=loadApp();app.state.meta={game};near(app.metaScore(goalkeeper({...attrs})),legacy);
  }
  const app=fm27();near(app.metaScore(goalkeeper({...attrs})),M.gkMeta27Details(attrs).score);
  const knownOutfield=goalkeeper({...attrs},{posNat:['DC'],posArr:['GK','DC']});
  near(app.metaScore(knownOutfield),app.weightedMeta(player({attrs:{...attrs}}),attrs));
  assert.equal(app.metaScore(goalkeeper(gkAttrs(13),{posNat:['GK'],posArr:['DC']})),13);
});

test('GK v2: outfield weights and goalkeeper role ratings stay unchanged', () => {
  const expected={Pace:20.5,Acceleration:20.4,JumpingReach:11.6,Dribbling:9.8,Balance:5.3,Concentration:4.5,Anticipation:4.3,Determination:2.7,Agility:2.7,Stamina:2.5,Strength:1.9,FirstTouch:1.5,Composure:1.2,WorkRate:1.1,Finishing:1.1,Flair:1.1,LongShots:1,Aggression:1,Heading:.6,OffTheBall:.5};
  assert.deepEqual(M.META_W,expected);
  const p=player({attrs:Object.fromEntries(Object.keys(expected).map((k,i)=>[k,1+i%20]))});
  const manual=Object.entries(expected).reduce((s,[k,w])=>s+p.attrs[k]*w,0)/Object.values(expected).reduce((a,b)=>a+b,0);
  for(const game of ['FM26','FM27',undefined]) {const app=loadApp();app.state.meta={game};near(app.metaScore(structuredClone(p)),manual);}
  const app=fm27();const keeper=goalkeeper({...gkAttrs(),Passing:18,Kicking:19,OneOnOnes:9,Positioning:8});
  const roles=app.ROLES.filter(r=>r.pos.includes('GK'));assert.ok(roles.length>=2);
  for(const role of roles) {
    let sum=0,weight=0;
    for(const [keys,w] of [[role.key,2],[role.pref,1]]) for(const k of keys) if(keeper.attrs[k]!=null){sum+=keeper.attrs[k]*w;weight+=w;}
    near(app.roleScore(keeper,role),sum/weight);
  }
});

test('GK v2: PA meta reuses v2 with the existing projection and no growth bonus', () => {
  const app=fm27();const p=goalkeeper(gkAttrs(12,{Agility:16,Reflexes:16,AerialReach:13}),{ca:100,pa:160,birthYear:2008});
  const before=structuredClone(p);
  const projected=app.projectAttrs(p);assert.ok(projected);
  near(app.metaPaScore(p),Math.max(app.gkMeta27Details(p.attrs).score,app.gkMeta27Details(projected).score));
  assert.deepEqual(p.attrs,before.attrs);
  const { _meta, _metaPa, ...fields }=p;assert.deepEqual(fields,before);
  for(const pa of [80,100]) {const mature=goalkeeper(gkAttrs(),{ca:100,pa});assert.equal(app.metaPaScore(mature),app.metaScore(mature));}
});

test('GK v2: existing scalar memoization is reused and fresh objects do not inherit it', () => {
  const app=fm27();const a=goalkeeper();const b=goalkeeper(gkAttrs(18),{id:a.id});
  assert.equal(app.metaScore(a),12);assert.equal(app.metaScore(b),18);
  let reads=0;
  const memo=goalkeeper(new Proxy(gkAttrs(),{get(target,key){reads++;return target[key];}}));
  app.metaScore(memo);const firstReads=reads;
  for(let i=0;i<100;i++) app.metaScore(memo);
  assert.equal(reads,firstReads);
  const pa=app.metaPaScore(memo),afterPa=reads;assert.ok(pa>=12);
  for(let i=0;i<100;i++) assert.equal(app.metaPaScore(memo),pa);
  assert.equal(reads,afterPa);
});

test('GK v2: table sorting, null placement and Meta/PA filters use the integrated score', () => {
  const input=()=>({value:'',addEventListener(){},classList:{toggle(){}}});
  const filters={'f-meta-min':input(),'f-metapa-min':input()};
  const app=fm27({elements:filters});
  const strong=goalkeeper(gkAttrs(16),{id:2}),weak=goalkeeper(gkAttrs(9),{id:3}),missing=goalkeeper({}, {id:4});
  app.state.players=[weak,missing,strong];app.state.filtered=[...app.state.players];
  app.state.sortKey='meta';app.state.sortDir=-1;app.sortRows();
  assert.deepEqual(app.state.filtered.map(p=>p.id),[2,3,4]);
  app.state.sortDir=1;app.sortRows();assert.deepEqual(app.state.filtered.map(p=>p.id),[3,2,4]);
  filters['f-meta-min'].value='15';app.applyFilters();assert.deepEqual(app.state.filtered.map(p=>p.id),[2]);
  filters['f-meta-min'].value='';filters['f-metapa-min'].value='15';app.applyFilters();
  assert.deepEqual(app.state.filtered.map(p=>p.id),[2]);
  const col=app.PLAYER_COLS.find(c=>c.key==='meta');assert.equal(col.get(strong),16);assert.match(col.render(strong),/>16\.0<\/span>/);
});

test('GK v2: profile, comparison, player-card model and localized help consume the new score', () => {
  const rendered={};const app=fm27({onElementSet:(id,prop,value)=>{if(prop==='innerHTML')rendered[id]=value;}});
  const a=goalkeeper(gkAttrs(12,{Agility:16,Reflexes:16,AerialReach:13}),{id:2});
  const b=goalkeeper(gkAttrs(14),{id:3});
  app.state.players=[a,b];app.state.filtered=[];
  const expected=app.metaScore(a).toFixed(1);
  assert.match(app.metaHtml(a),new RegExp('>'+expected.replace('.','\\.')+'<'));
  assert.match(app.metaHtml(a),/data-help="gkMeta27Hint"/);
  assert.match(app.metaPaHtml(a),/data-help="gkMeta27PaHint"/);
  assert.equal(app.metaHtml(goalkeeper({})),'<span class="dim">–</span>');
  app.showDetail(a);assert.match(rendered['detail-body'],/data-help="gkMeta27Hint"/);
  assert.ok(rendered['detail-body'].includes('>'+expected+'</span>'));
  app.state.compare=[2,3];app.openCompare();assert.match(rendered['compare-inner'],/data-help="gkMeta27Hint"/);
  assert.ok(rendered['compare-inner'].includes('>'+expected+'</span>'));
  assert.equal(app.buildCardModel(a).hexNum,expected);
  for(const lang of ['en','nl','fr','de']) {
    app.state.lang=lang;
    assert.match(app.I18N[lang].gkMeta27Hint,/FM27 GK Meta v2\.0/);
    assert.match(app.I18N[lang].gkMeta27Hint,/13b.*Purity/s);
    assert.match(app.I18N[lang].gkMeta27Hint,/50\/50/);
    assert.ok(app.I18N[lang].gkMeta27PaHint.length>100);
  }
});

test('GK v2: loading new dumps replaces memoized players and follows dump version', async () => {
  let enabled=false,game='FM27',value=12;
  const app=loadApp({fetch:async url=>({ok:true,headers:{get:()=>null},json:async()=>{
    if(url==='/api/status')return {hasDump:enabled,dumpTime:String(value)};
    if(url==='/api/dump')return {meta:{generated:'2026-11-16',game},players:[goalkeeper(gkAttrs(value,{Agility:value+1,Pace:value}))],staff:[]};
    return {};
  }})});
  await new Promise(resolve=>setImmediate(resolve));enabled=true;
  assert.equal(await app.loadDump(),true);const first=app.state.players[0];near(app.metaScore(first),12+app.GK_META27_W.Agility);
  value=18;assert.equal(await app.loadDump(),true);const second=app.state.players[0];
  assert.notEqual(first,second);near(app.metaScore(second),18+app.GK_META27_W.Agility);
  game='FM26';value=12;assert.equal(await app.loadDump(),true);
  const third=app.state.players[0];assert.notEqual(second,third);assert.equal(app.state.meta.game,'FM26');
  near(app.metaScore(third),12+8/36.5);
});

test('GK v2: synthetic scenario report is reproducible and explicitly not outcome validation', () => {
  const { scenarioReport, markdown }=require('../tools/compare-gk-meta');
  const report=scenarioReport();assert.equal(report.rows.length,7);
  assert.equal(report.kind,'SOFTWARE_AND_SCENARIO_TESTS_NOT_OUTCOME_VALIDATION');
  assert.equal(report.tradeoff.stability,'SOURCE_SENSITIVE');
  assert.equal(report.rows.find(r=>r.name==='Agility specialist').rankGain,3);
  const fs=require('node:fs'),path=require('node:path');
  assert.equal(markdown(report),fs.readFileSync(path.join(__dirname,'../docs/fm27-goalkeeper-meta-v2-scenarios.md'),'utf8'));
});
