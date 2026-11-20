import * as M from './arcModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
// parcours : cube de 1,0 dm³ (1 000 cm³) en aluminium dans l'eau douce, g = 9,8 N/kg
ok(proche(M.poussee(1000, 1000), 9.8), 'Π = 1000 × 1,0e-3 × 9,8 = 9,8 N');
ok(proche(M.poids(2700, 1000), 26.46), 'P = 2700 × 1,0e-3 × 9,8 = 26,46 N');
ok(M.lecture(M.poids(2700, 1000)) === 26.5 && M.lecture(M.poidsApparent(2700, 1000, 1000)) === 16.7, 'lectures du dynamomètre : 26,5 N dans l’air, 16,7 N immergé');
ok(Math.abs(26.5 - 9.8 - 16.7) < 1e-9, '26,5 − 9,8 = 16,7');
// proportionnalité à V immergé et indépendance de la masse
for (const f of [0, 0.2, 0.5, 1]) ok(proche(M.poussee(1000, 1000 * f), 9.8 * f), 'Π proportionnelle à V immergé');
ok(proche(M.poussee(1000, 500), M.poussee(1000, 500)) && M.poussee(1200, 500) > M.poussee(1000, 500), 'Π croît avec ρ fluide');
// flottaison : équilibre Π = P quand fraction = ρ_o/ρ_f
for (const o of M.OBJETS) for (const fl of M.FLUIDES) {
  const fr = M.fractionEquilibre(o.rho, fl.rho), st = M.etat(o.rho, fl.rho);
  ok((st === 'flotte') === (o.rho < fl.rho) && (st === 'coule') === (o.rho > fl.rho), `état ${o.id}/${fl.id}`);
  if (st === 'flotte') { ok(proche(M.poussee(fl.rho, fr * 1000), M.poids(o.rho, 1000)), 'flotteur : Π = P'); ok(fr < 1, 'fraction < 1'); }
  else ok(fr === 1 && M.poussee(fl.rho, 1000) <= M.poids(o.rho, 1000) + 1e-9, 'plongé : Π ≤ P');
}
ok(Math.abs(M.fractionEquilibre(920, 1030) - 0.893) < 1e-3, 'glace dans l’eau de mer : 89 %');
ok(M.etat(1000, 1000) === 'equilibre', 'ρ égales : entre deux eaux');
// niveau : monte quand on immerge, et reste dans le bécher pour tous les cas du menu
for (const V of M.VOLUMES) ok(M.niveau(V) > M.niveau(0) && M.niveau(V) < M.H_CUVE - 3 && M.niveau(0) > 10, 'niveau dans la cuve');
ok(Math.abs(M.niveau(1000) - 14.51) < 0.01, 'niveau avec 1 000 cm³ immergés');
// air : ballon de 5,0 L
ok(Math.abs(M.poussee(M.RHO_AIR, 5000) - 0.0588) < 1e-4, 'poussée de l’air sur 5,0 L : 0,059 N');
// masse posée : bois de pin 1 000 cm³ dans l'eau : 0,500 kg
ok(proche(M.masseMaxPosee(500, 1000, 1000), 0.5), 'masse maximale posée 500 g');
// défis : faisabilité à la tolérance près (valeurs affichées = valeurs du corrigé)
for (let k = 0; k < 5000; k++) {
  const a = M.tirageCoule(), b = M.tirageFlotteur(), c = M.tirageInconnu();
  ok(a.rhoO > a.rhoF && proche(a.vPi, a.rhoF * a.V * 1e-6 * 9.8) && a.vF > 0, 'défi prévoir');
  ok(b.rhoO / b.rhoF <= 0.95 && b.vMasse > 0 && b.vFrac < 95.0001, 'défi flotteur');
  { const a2 = x => Number(Number(x).toPrecision(2)), mm = (b.rhoF - b.rhoO) * b.V * 1e-3; ok(Math.abs(a2(b.rhoF * b.V * 1e-3) - a2(b.rhoO * b.V * 1e-3) - mm) / mm <= 0.06, 'défi flotteur : masses arrondies à 2 chiffres avant soustraction dans la marge de 6 %'); }
  const err = Math.abs(c.vRho - c.rhoVrai) / c.rhoVrai;
  ok(err < 0.04, `défi inconnu : ρ déduit ${c.vRho} pour ${c.rhoVrai}`);
  ok(M.calibre(c.P) > c.P, 'calibre');
}
console.log(`${n} contrôles OK`);
