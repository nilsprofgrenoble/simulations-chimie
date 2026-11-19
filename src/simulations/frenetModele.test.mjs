import * as M from './frenetModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
const sig = (x, k) => Number(Number(x).toPrecision(k));

// formules citées : a_n = v²/R ; coordonnées de v et de a dans le repère de Frenet
ok(proche(M.an(3, 2), 4.5) && proche(M.an(2, 1), 4), 'a_n = v²/R');
ok(M.coordVitesse(3)[0] === 3 && M.coordVitesse(3)[1] === 0, 'v = (v ; 0)');
ok(proche(M.coordAcc(3, 1.5, 4)[0], 4) && proche(M.coordAcc(3, 1.5, 4)[1], 6), 'a = (dv/dt ; v²/R)');
ok(proche(M.normeAcc(3, 1.5, 4), Math.sqrt(52)) && Math.abs(M.normeAcc(3, 1.5, 4) - 7.2111) < 1e-3, 'norme 7,2 m/s²');
ok(proche(M.normeAcc(3, 2, 0), 4.5), 'mouvement uniforme : a = v²/R');
// satellite (exemple numérique du parcours) : v = 7,5×10³ m/s, R = 7,0×10⁶ m
ok(Math.abs(M.an(7.5e3, 7.0e6) - 8.0357) < 1e-3, 'satellite 8,0 m/s²');
// nature du mouvement
ok(M.nature(0) === 'uniforme' && M.nature(2) === 'accéléré' && M.nature(-1) === 'ralenti', 'nature');
// angle de a avec la normale : 0 si uniforme, > 0 si accéléré, < 0 si ralenti
ok(M.angleAcc(3, 2, 0) === 0 && M.angleAcc(3, 2, 2) > 0 && M.angleAcc(3, 2, -2) < 0, 'angle');
// repère de Frenet : orthonormé, u_t = tangent dans le sens trigonométrique, u_n vers le centre, v ⟂ a (cas uniforme)
for (let k = 0; k < 3600; k++) {
  const th = (k / 3600) * 2 * Math.PI, { M: P, ut, un } = M.repere(th);
  ok(proche(Math.hypot(...ut), 1) && proche(Math.hypot(...un), 1), 'unitaires');
  ok(Math.abs(ut[0] * un[0] + ut[1] * un[1]) < 1e-12, 'orthogonaux');
  ok(proche(P[0] + un[0], 0, 1e-9) && proche(P[1] + un[1], 0, 1e-9), 'u_n pointe vers le centre O (M + u_n × 1 = O pour R = 1)');
  ok(proche(ut[0] * -P[1] + ut[1] * P[0], 1), 'sens trigonométrique');
  const v = M.vecteurVitesse(th, 3), a = M.vecteurAcc(th, 3, 2, 0);
  ok(Math.abs(v[0] * a[0] + v[1] * a[1]) < 1e-9, 'uniforme : a ⟂ v');
  ok(proche(Math.hypot(...a), 4.5), 'norme de a constante');
  const a2 = M.vecteurAcc(th, 3, 2, 1.5); ok(proche(Math.hypot(...a2), M.normeAcc(3, 2, 1.5)), 'norme vectorielle = formule');
}
// intégration : mouvement uniforme → θ avance de v/R par seconde ; v borné
{ let s = { theta: 0, v: 2 }; for (let i = 0; i < 1000; i++) s = M.pas(s, 2, 0, 0.001); ok(proche(s.theta, 1, 1e-9) && s.v === 2, 'uniforme : θ = v t / R'); }
{ let s = { theta: 0, v: 1 }; for (let i = 0; i < 1000; i++) s = M.pas(s, 2, 2, 0.001); ok(proche(s.v, 3, 1e-9) && proche(s.theta, 1, 1e-9), 'accéléré : v = v0 + at ; θ = (v0 t + at t²/2)/R'); }
{ let s = { theta: 0, v: 1 }; for (let i = 0; i < 5000; i++) s = M.pas(s, 2, -2, 0.001); ok(s.v === 0, 'v ne devient pas négatif'); }
{ let s = { theta: 0, v: 4 }; for (let i = 0; i < 5000; i++) s = M.pas(s, 2, 3, 0.001); ok(s.v === M.V_MAX, 'v plafonnée'); }

// défi 1 : 20 000 tirages ; réalisable avec les positions du curseur (pas 0,05 m/s) ; la vitesse exacte est acceptée
let pire1 = 0;
for (let i = 0; i < 20000; i++) {
  const d = M.tirageDefiVitesse();
  ok(d.vAttendue >= 1.4 && d.vAttendue <= 6.0, 'v dans la plage du curseur');
  const grille = Math.round(d.vAttendue / M.PAS_V) * M.PAS_V, vv = Number(grille.toFixed(2));
  ok(M.defiVitesseReussi(d, vv), `faisable à la souris ${d.R} ${d.aCible} ${vv}`);
  ok(M.defiVitesseReussi(d, sig(d.vAttendue, 2)) || true, '');
  pire1 = Math.max(pire1, Math.abs(M.an(vv, d.R) - d.aCible) / d.aCible);
  // un élève qui arrondit v à 2 chiffres significatifs (ex. 2,8 pour 2,83) est jugé juste
  ok(M.defiVitesseReussi(d, sig(d.vAttendue, 2)), `arrondi 2 CS accepté ${d.R} ${d.aCible} ${sig(d.vAttendue, 2)}`);
  // une erreur classique n'est pas acceptée : v = a × R, v = a / R, v = a
  for (const faux of [d.aCible * d.R, d.aCible / d.R, d.aCible, Math.sqrt(d.aCible) ]) if (Math.abs(faux - d.vAttendue) / d.vAttendue > 0.1) ok(!M.defiVitesseReussi(d, faux), 'piège refusé');
}
// défi 2 : 20 000 tirages ; la chaîne de calculs arrondis à 2 ou 3 chiffres significatifs reste dans la marge de 6 %
let pire2 = 0;
for (let i = 0; i < 20000; i++) {
  const d = M.tirageDefiNorme();
  ok(d.norme > 0 && isFinite(d.norme) && Math.abs(d.at) > 0, 'valeurs finies');
  for (const k of [2, 3]) { const a1 = sig(M.an(d.v, d.R), k), r = sig(Math.hypot(d.at, a1), k); pire2 = Math.max(pire2, Math.abs(r - d.norme) / d.norme); ok(Math.abs(r - d.norme) <= 0.06 * d.norme, `chaîne arrondie ${JSON.stringify(d)} ${r}`); }
  // pièges : somme des coordonnées, a_n seule, a_t seule
  for (const faux of [Math.abs(d.at) + d.aN, d.aN, Math.abs(d.at)]) ok(Math.abs(faux - d.norme) > 0.06 * d.norme, `piège distinct ${JSON.stringify(d)} ${faux}`);
}
console.log(`${n} contrôles OK ; pire écart défi 1 (curseur) ${(pire1 * 100).toFixed(2)} % ; pire écart défi 2 (arrondis) ${(pire2 * 100).toFixed(2)} %`);
