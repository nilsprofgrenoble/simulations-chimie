import * as X from './extractionModele.js';
const ok = (c, m) => { if (!c) { console.error('ÉCHEC', m); process.exit(1); } };
ok(Math.abs(X.densite(19.95, 15.0) - 1.33) < 1e-9, 'densité DCM');
ok(X.phaseSuperieure('cyclohexane') === 'cyclohexane' && X.phaseInferieure('cyclohexane') === 'eau', 'cyclohexane au-dessus');
ok(X.phaseInferieure('dichloromethane') === 'dichloromethane', 'DCM dessous');
ok(X.phaseSuperieure('ethanol') === null, 'éthanol miscible');
ok(X.bonExtracteur('diiode', 'cyclohexane') && !X.bonExtracteur('diiode', 'ethanol') && !X.bonExtracteur('chlorureSodium', 'cyclohexane'), 'extracteur');
ok(X.oùSoluté('diiode', 'dichloromethane') === 'organique', 'où le diiode');
console.log('extractionModele : tous les tests passent');
