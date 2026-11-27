import * as M from './aminoAcidesModele.js';
import { QCM_PARCOURS as QQ } from './aminoAcidesQcm.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-6) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
const gly = M.ACIDES.gly;
// somme des fractions = 1, à tout pH, pour tous les acides aminés
for (const id of M.ORDRE) for (let pH = 0; pH <= 14; pH += 0.1) { const f = M.frac(pH, M.ACIDES[id]); ok(proche(f[0] + f[1] + f[2], 1), 'somme ' + id + pH); ok(f.every(x => x >= 0 && x <= 1), 'bornes'); }
// à pH = pKA1 : 50 % cation / 50 % zwitterion (l'anion est négligeable) ; à pH = pKA2 : 50 % zwitterion / 50 % anion
const f1 = M.frac(gly.pKa1, gly), f2 = M.frac(gly.pKa2, gly);
ok(Math.abs(f1[0] - 0.5) < 1e-5 && Math.abs(f1[1] - 0.5) < 1e-5 && f1[2] < 1e-5, 'pH = pKA1');
ok(Math.abs(f2[1] - 0.5) < 1e-5 && Math.abs(f2[2] - 0.5) < 1e-5 && f2[0] < 1e-5, 'pH = pKA2');
// à pKA1 + 1 : rapport 10, 90,9 % de zwitterion et 9,1 % de cation
ok(proche(M.rapport1(3.3, gly), 10) && Math.abs(M.pct(M.frac(3.3, gly)[1]) - 100 * 10 / 11) < 1e-3 && Math.abs(M.pct(M.frac(3.3, gly)[0]) - 100 / 11) < 1e-3, 'pKA1 + 1');
// à pKA2 − 1 : rapport 0,1, 90,9 % de zwitterion
ok(proche(M.rapport2(8.6, gly), 0.1) && Math.abs(M.pct(M.frac(8.6, gly)[1]) - 100 * 10 / 11) < 1e-3, 'pKA2 − 1');
// glycine à pH 7,4 (pH du sang) : environ 0,63 % d'anion, 99,4 % de zwitterion, cation négligeable
const sang = M.frac(7.4, gly); ok(Math.abs(M.pct(sang[2]) - 0.626) < 0.01 && Math.abs(M.pct(sang[1]) - 99.37) < 0.01 && sang[0] < 1e-5, 'pH du sang');
// prédominance
ok(M.predominante(1, gly) === 'cat' && M.predominante(6, gly) === 'zw' && M.predominante(12, gly) === 'an' && M.predominante(2.3, gly) === 'egal1' && M.predominante(9.6, gly) === 'egal2', 'prédominance');
// formules semi-développées
ok(M.formule(gly, 'cat') === 'H₃N⁺–CH₂–COOH' && M.formule(gly, 'zw') === 'H₃N⁺–CH₂–COO⁻' && M.formule(gly, 'an') === 'H₂N–CH₂–COO⁻' && M.formule(M.ACIDES.ala, 'zw') === 'H₃N⁺–CHR–COO⁻', 'formules');
// concentrations : somme = C
ok(proche(M.conc(0.010, 7, gly).reduce((a, b) => a + b, 0), 0.010), 'concentrations');
// zone du zwitterion (≥ p) : bornes pKA1 + log(p/(1−p)) et pKA2 − log(p/(1−p)) à très peu près ; vérifie que la fraction y vaut bien p
for (const id of M.ORDRE) for (const p of [0.8, 0.9, 0.95]) {
  const z = M.zoneZwitterion(p, M.ACIDES[id]), a = M.ACIDES[id], L = Math.log10(p / (1 - p));
  ok(Math.abs(M.frac(z[0], a)[1] - p) < 1e-9 && Math.abs(M.frac(z[1], a)[1] - p) < 1e-9, 'bornes exactes ' + id + p);
  ok(Math.abs(z[0] - (a.pKa1 + L)) < 1e-3 && Math.abs(z[1] - (a.pKa2 - L)) < 1e-3, 'bornes approchées ' + id + p);
}
// tirages des défis sur 20 000 tirages
for (let i = 0; i < 20000; i++) {
  const d = M.tirageDefiForme(), a = d.acide;
  ok(d.pH >= 0 && d.pH <= 14 && d.prod !== 'egal1' && d.prod !== 'egal2', 'défi 1');
  // un élève lit la frontière voisine, arrondit le rapport à 2 chiffres significatifs et calcule le pourcentage de zwitterion : écart ≤ 5 % relatif
  const pKa = d.frontiere === 1 ? a.pKa1 : a.pKa2, r = Number((10 ** (d.pH - pKa)).toPrecision(2));
  const approx = d.frontiere === 1 ? 100 * r / (1 + r) : 100 / (1 + r);
  ok(Math.abs(approx - d.pctZw) <= 0.05 * d.pctZw, 'tolérance défi 1 ' + d.pH + ' ' + a.id + ' ' + approx + ' ' + d.pctZw);
  // la valeur attendue reste raisonnable (pas de valeur minuscule difficile à juger)
  ok(d.pctZw > 2.5 && d.pctZw < 98, 'pourcentage défi 1 ' + d.pctZw);
  const e = M.tirageDefiZone(), L = Math.log10(e.p / (100 - e.p)), basApprox = Number((e.acide.pKa1 + L).toPrecision(2)), hautApprox = Number((e.acide.pKa2 - L).toPrecision(2));
  ok(Math.abs(basApprox - e.bas) <= 0.05 * e.bas && Math.abs(hautApprox - e.haut) <= 0.05 * e.haut, 'tolérance défi 2');
  ok(e.bas > e.acide.pKa1 && e.haut < e.acide.pKa2 && e.bas < e.haut, 'défi 2 zone');
}
// QCM du parcours : la bonne réponse (index 'bonne') n'est jamais la plus longue (égalité comprise) ni strictement la plus courte
for (const [k, v] of Object.entries(QQ)) {
  const L = v.options.map(o => [...o].length), b = L[v.bonne], autres = L.filter((_, i) => i !== v.bonne);
  ok(b < Math.max(...autres), `QCM ${k} : la bonne est la plus longue`);
  ok(b >= Math.min(...autres), `QCM ${k} : la bonne est strictement la plus courte`);
}
console.log('aminoAcidesModele : tous les tests passent (' + n + ' + 20 000 tirages)');
