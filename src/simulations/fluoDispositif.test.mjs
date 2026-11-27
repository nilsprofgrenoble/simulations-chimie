import * as D from './fluoDispositif.js';
import * as X from './fluoTirages.js';
import * as FM from './fluoModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } };
const A = X.MOLS_T.A, B = X.MOLS_T.B;
// transitions : A absorbe à 350 nm (v′ = 2), fluoresce vers v = 2 à 450 nm
let t = D.transitions(A, 'em', 450, 350); ok(t.abs === 2 && t.fluo === 2 && t.phos === -1, 'A em 450/350 ' + JSON.stringify(t));
t = D.transitions(A, 'em', 450, 450); ok(t.abs === -1 && t.fluo === -1, 'excitation à 450 nm : rien n’est absorbé, pas de transition');
t = D.transitions(B, 'ph', 520, 350); ok(t.phos >= 0 && t.abs === -1, 'B ph 520 ' + JSON.stringify(t));
t = D.transitions(A, 'ph', 520, 350); ok(t.phos === -1, 'A ne phosphoresce pas');
t = D.transitions(A, 'abs', 350, 350); ok(t.abs === 2, 'abs 350');
// signaux normalisés, maxima aux bons endroits
for (const mol of [A, B]) for (const mode of ['abs', 'ex', 'em']) {
  const fixe = D.fixeDefaut(mode, mol), c = D.courbe(mol, mode, fixe, 1), m = Math.max(...c.map(p => p.s));
  ok(m > 0.5 && m <= 1.0001, `${mol.id} ${mode} max ${m}`);
  ok(c.every(p => Number.isFinite(p.s) && p.s >= 0), `${mol.id} ${mode} fini`);
}
const cEm = D.courbe(A, 'em', 350, 0.5), pic = cEm.reduce((a, p) => (p.s > a.s ? p : a));
ok(Math.abs(pic.lam - X.lamMaxEmission(A)) < 25, 'pic émission A ' + pic.lam);
ok(D.courbe(A, 'ph', 350).every(p => p.s === 0), 'A : spectre de phosphorescence nul');
ok(Math.max(...D.courbe(B, 'ph', 350).map(p => p.s)) > 0.9, 'B phosphorescence');
// excitation ≈ absorption (même forme)
const cAbs = D.courbe(A, 'abs', 0, 2), cEx = D.courbe(A, 'ex', 450, 2);
ok(cAbs.every((p, i) => Math.abs(p.s - cEx[i].s) < 1e-9 || Math.abs(p.s / Math.max(...cAbs.map(q => q.s)) - cEx[i].s / Math.max(...cEx.map(q => q.s))) < 1e-9), 'excitation proportionnelle à l’absorption');
// événements reproductibles et cohérents
for (const mode of ['abs', 'em', 'ex', 'ph']) for (const mol of [A, B]) {
  let ab = 0, pas = 0;
  for (let i = 0; i < 2000; i++) {
    const e1 = D.evenement(mol, mode, D.lamDefaut(mode, mol), D.fixeDefaut(mode, mol), i), e2 = D.evenement(mol, mode, D.lamDefaut(mode, mol), D.fixeDefaut(mode, mol), i);
    ok(JSON.stringify(e1) === JSON.stringify(e2), 'reproductible');
    if (e1.absorbe) ab++; if (e1.passe) pas++;
    ok(typeof D.texteEvenement(e1, mode) === 'string' && !/NaN|undefined/.test(D.texteEvenement(e1, mode)), `texte ${mode} ${mol.id} ${i}`);
  }
  if (mode === 'abs') ok(ab > 1500 && pas < 300, `abs 350 nm : ${ab} absorbés, ${pas} passent`);
  if (mode === 'em' && mol.id === 'A') ok(ab > 1500 && pas > 20 && pas < ab, `em A : ${ab} absorbés, ${pas} détectés`);
}
// bandes : le spectre d'émission de A est une bande sans creux profonds (pas de raies résolues)
const bande = D.courbe(A, 'em', 350, 1); let creux = 0;
for (let i = 1; i < bande.length - 1; i++) if (bande[i].s < bande[i - 1].s && bande[i].s < bande[i + 1].s && bande[i].s > 0.05) creux++;
ok(creux <= 1, 'bande d’émission : ' + creux + ' creux');
const bAbs = D.courbe(A, 'abs', 0, 1); let creuxA = 0;
for (let i = 1; i < bAbs.length - 1; i++) if (bAbs[i].s < bAbs[i - 1].s && bAbs[i].s < bAbs[i + 1].s && bAbs[i].s > 0.05) creuxA++;
ok(creuxA <= 1, 'bande d’absorption : ' + creuxA + ' creux');
// populations au cours du temps (vue « Le diagramme dans le temps »)
for (const m of [FM.MOLS.A, FM.MOLS.B]) for (let l = -15; l <= 3; l += 0.1) { const p = FM.populations(m, 10 ** l), tot = p.chaud + p.S1 + p.T1 + p.S0;
  ok(Math.abs(tot - 1) < 1e-9 && [p.chaud, p.S1, p.T1, p.S0, p.fluo, p.phos].every(v => v >= 0 && v <= 1 + 1e-12), `populations ${m.id} 10^${l.toFixed(1)}`); }
ok(FM.populations(FM.MOLS.A, 1e-6).fluo < 0.01 && FM.populations(FM.MOLS.B, 0.1).phos > 0.8 && FM.populations(FM.MOLS.B, 10).phos < 0.01, 'durées');
// conditions : gaz froid → raies séparées (5 maxima), solution → une bande ; fente large écrase les raies
const maxima = c => { let k = 0; for (let i = 1; i < c.length - 1; i++) if (c[i].s > c[i - 1].s && c[i].s >= c[i + 1].s && c[i].s > 0.05) k++; return k; };
const gaz = { sig: D.CONDITIONS.gaz.sig, fente: 1 }, sol = { sig: D.CONDITIONS.solution.sig, fente: 1 };
ok(maxima(D.courbe(A, 'em', 350, undefined, gaz)) >= 5, 'gaz : raies d’émission ' + maxima(D.courbe(A, 'em', 350, undefined, gaz)));
ok(maxima(D.courbe(A, 'abs', 0, undefined, gaz)) >= 4, 'gaz : raies d’absorption');
ok(maxima(D.courbe(A, 'em', 350, undefined, sol)) <= 2, 'solution : bande');
ok(maxima(D.courbe(A, 'em', 350, undefined, { sig: D.CONDITIONS.rigide.sig, fente: 1 })) >= 3, 'rigide : structure visible');
const pic1 = Math.max(...D.courbe(A, 'em', 350, undefined, gaz).map(p => p.s)), pic10 = Math.max(...D.courbe(A, 'em', 350, undefined, { ...gaz, fente: 10 }).map(p => p.s));
ok(pic10 < 0.6 * pic1, 'fente de 10 nm : raies écrasées ' + pic1.toFixed(2) + ' → ' + pic10.toFixed(2));
// comptage : l'histogramme d'émission suit la courbe
{ let a = 9; const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; }, h = {};
  for (let i = 0; i < 40000; i++) { const e = D.evenementComptage(A, 'em', 350, D.OPT0, rnd); if (e.lamCoup != null) { const b = Math.round(e.lamCoup / 10) * 10; h[b] = (h[b] || 0) + 1; } }
  const bm = Object.keys(h).reduce((x, y) => (h[x] > h[y] ? x : y)); ok(Math.abs(bm - 450) <= 10, 'comptage : maximum vers 450 nm (' + bm + ')');
  let ex = {}; for (let i = 0; i < 40000; i++) { const e = D.evenementComptage(A, 'ex', 450, D.OPT0, rnd); if (e.lamCoup != null) { const b = Math.round(e.lamCoup / 10) * 10; ex[b] = (ex[b] || 0) + 1; } }
  const be = Object.keys(ex).reduce((x, y) => (ex[x] > ex[y] ? x : y)); ok(Math.abs(be - 350) <= 10, 'comptage excitation : maximum vers 350 nm (' + be + ')'); }
console.log(`${n - ko}/${n} vérifications réussies`);
process.exit(ko ? 1 : 0);
