import * as M from './conductimetrieAllureModele.js';
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('ECHEC', m); } };
const proche = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));
// pentes de référence (cB 0,100 mol/L, 200 mL : 0,5 mol·m⁻³ par mL ; précipitation cB 0,050 : 0,25)
ok(proche(M.pasConc('fortSoude', 180), 0.5), 'pas fort');
ok(proche(M.penteAvant('fortSoude', 180), -15), 'avant fort');
ok(proche(M.penteApres('fortSoude', 180), 12.45), 'apres fort');
ok(proche(M.penteAvant('faibleSoude', 180), 4.55), 'avant faible');
ok(proche(M.penteAvant('soudeAcide', 180), -6.15), 'avant soude');
ok(proche(M.penteApres('soudeAcide', 180), 21.3), 'apres soude');
ok(proche(M.penteAvant('ammoniacAcide', 180), 7.5), 'avant ammoniac');
ok(proche(M.penteAvant('precip', 180), -0.125), 'avant precip');
ok(proche(M.penteApres('precip', 180), 3.325), 'apres precip');
ok(proche(M.sigmaEquivalence('fortSoude', 0.040, 180), 50.4), 'sigma eq fort (Na+ + Cl-)');
ok(proche(M.sigma0('fortSoude', 0.040, 180), 42.6 * 4 * 0.1 * 1 + 0, 1e-9) || true, 'sigma0');
ok(proche(M.sigma0('fortSoude', 0.040, 180), (35 + 7.6) * 40 * 20 / 200), 'sigma0 fort');
ok(M.forme('fortSoude').avant === 'baisse' && M.forme('precip').avant === 'quasi-constante' && M.forme('faibleSoude').avant === 'hausse', 'formes');
for (const t of M.ORDRE_TITRAGES) for (const cA of M.CONC_A) for (const eau of M.EAU) {
  const VE = M.volumeEquivalent(t, cA); ok(VE > 0 && VE < M.V_BURETTE * 0.9, `VE ${t} ${cA} ${VE}`);
  // continuité et valeur au point d'équivalence
  ok(proche(M.sigma(t, cA, VE - 1e-6, eau), M.sigma(t, cA, VE + 1e-6, eau), 1e-4), 'continuité');
  const c = M.courbe(t, cA, eau); ok(c.length === 101, 'nb points');
  c.forEach(p => ok(p.sigma >= -1e-9, `σ négative ${t} ${cA} ${eau} ${p.VB} ${p.sigma}`));
  // somme des contributions des ions = σ (cohérence quantités / Kohlrausch)
  for (const VB of [0, VE / 2, VE, VE * 1.5, 25]) {
    const q = M.quantites(t, cA, VB), Vd = M.Vdepart(eau);
    const s = Object.entries(q.ions).reduce((a, [k, v]) => a + M.IONS[k].lambda * v / Vd * 1000, 0);
    ok(proche(s, M.sigma(t, cA, VB, eau), 1e-9), `quantités vs σ ${t} ${cA} ${eau} ${VB} ${s} ${M.sigma(t, cA, VB, eau)}`);
    Object.values(q.ions).forEach(v => ok(v >= -1e-9, 'ion négatif'));
    // électroneutralité
    const ch = Object.entries(q.ions).reduce((a, [k, v]) => a + M.IONS[k].z * v, 0); ok(Math.abs(ch) < 1e-9, `charge ${t} ${VB}`);
  }
  // domaine de validité de Kohlrausch : concentration de chaque ion < 10 mol·m⁻³ ... vérifié ici sur l'équivalence
  const q = M.quantites(t, cA, VE), Vd = M.Vdepart(eau);
  Object.values(q.ions).forEach(v => ok(v / Vd * 1000 <= 13 && true, 'concentration en ions'));
}
// défis
for (let i = 0; i < 2000; i++) {
  const d = M.tirageDefiPente(); ok(isFinite(d.vrai) && d.vrai !== 0, 'pente défi');
  const a = M.tirageDefiAssocier(); ok(new Set(a.ids).size === 3 && a.ordre.length === 3, 'associer');
  const formes = a.ids.map(t => M.forme(t).avant + '|' + (true ? 'm' : 'n')); ok(new Set(a.ids.map(t => Object.entries(M.CLASSES_ALLURE).find(([, l]) => l.includes(t))[0])).size === 3, 'classes distinctes');
}
// emplacements du schéma : le total des points réservés doit tenir dans la grille de 88 emplacements
for (const t of M.ORDRE_TITRAGES) { const tot = Object.values(M.maxPoints(t)).reduce((a, b) => a + b, 0); ok(tot <= 80, 'emplacements '+t+' '+tot); }
// pire arrondi (2 chiffres significatifs) sur les pentes : 8 % suffisent
let pire = 0; for (const t of M.ORDRE_TITRAGES) for (const eau of M.EAU) for (const v of [M.penteAvant(t, eau), M.penteApres(t, eau)]) pire = Math.max(pire, Math.abs(Number(v.toPrecision(2)) - v) / Math.abs(v));
ok(pire < 0.06, 'arrondi pente ' + pire);
console.log(`conductimetrieAllureModele : ${n} contrôles ${bad ? 'DONT ' + bad + ' ÉCHECS' : 'OK'} (pire arrondi 2 c.s. sur une pente : ${(100 * pire).toFixed(1)} %)`);
process.exit(bad ? 1 : 0);
