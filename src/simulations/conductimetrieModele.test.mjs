import * as M from './conductimetrieModele.js';
import { QCM_PARCOURS as QQ } from './conductimetrieQcm.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-6) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
// Kohlrausch : NaCl 1,0×10⁻² mol/L = 10 mol/m³ → (5,0 + 7,6) × 10 = 126 mS/m ; HCl 1,0×10⁻² → (35,0 + 7,6) × 10 = 426 mS/m
ok(proche(M.sigmaSel('Na', 'Cl', 0.010), 126), 'NaCl'); ok(proche(M.sigmaSel('H3O', 'Cl', 0.010), 426), 'HCl');
ok(proche(M.kohlrausch({ Na: 10, Cl: 10 }), 126), 'kohlrausch NaCl');
// départ du titrage de 20,0 mL de HCl à 0,050 mol/L dans 200 mL : [H₃O⁺] = [Cl⁻] = 5,0 mol/m³ → 213 mS/m
const base = { analyte: 'hcl', cA: 0.050 };
ok(Math.abs(M.sigmaTitrage({ ...base, VB: 0 }) - 213) < 0.01, 'σ initial ' + M.sigmaTitrage({ ...base, VB: 0 }));
// à l'équivalence (10,0 mL) : NaCl, 1,00 mmol dans 210 mL → 60,0 mS/m (plus H₃O⁺ et HO⁻ à 10⁻⁷ mol/L : négligeable)
ok(Math.abs(M.sigmaTitrage({ ...base, VB: 10 }) - 60.0) < 0.02, 'σ équivalence ' + M.sigmaTitrage({ ...base, VB: 10 }));
ok(Math.abs(M.sigmaTitrage({ ...base, VB: 15 }) - 116.5) < 0.1, 'σ à 15 mL ' + M.sigmaTitrage({ ...base, VB: 15 }));
ok(Math.abs(M.sigmaTitrage({ ...base, VB: 5 }) - 134.6) < 0.1, 'σ à 5 mL ' + M.sigmaTitrage({ ...base, VB: 5 }));
// quantités (transformation totale)
const q = M.quantites({ ...base, VB: 15 }); ok(proche(q.nA, 1) && proche(q.VE, 10) && proche(q.nHO, 0.5) && proche(q.nNa, 1.5) && proche(q.nH, 0), 'quantités à 15 mL');
// électroneutralité à tous les points, pour tous les acides, toutes les concentrations, toutes les eaux
for (const analyte of M.ORDRE_ANALYTES) for (const cA of M.CONC_A) for (const eau of M.EAU) for (let VB = 0; VB <= 20; VB += 0.5) {
  const { c } = M.composition({ analyte, cA, VB, Vinit: M.VA0 + eau });
  const pos = c.H3O + c.Na, neg = c.HO + c[M.ANALYTES[analyte].anion];
  ok(Math.abs(pos - neg) <= 1e-6 * Math.max(pos, neg, 1), `charge ${analyte} ${cA} ${eau} ${VB}`);
  ok(Object.values(c).every(x => isFinite(x) && x >= 0), 'positif');
}
// forme de la courbe : acide fort = V (décroît jusqu'à V_E puis croît) ; acide faible = croissante (sauf une petite chute initiale)
for (const analyte of ['hcl', 'hno3']) for (const cA of M.CONC_A) {
  const VE = M.volumeEquivalent(cA), pts = M.courbe({ analyte, cA }, 20, 0.25), imin = pts.reduce((m, p, i) => (p.sigma < pts[m].sigma ? i : m), 0);
  ok(Math.abs(pts[imin].VB - VE) <= 0.25 + 1e-9, `minimum ${analyte} ${cA} : ${pts[imin].VB} / ${VE}`);
  ok(M.pente({ analyte, cA }, VE / 2) < 0 && M.pente({ analyte, cA }, VE + 3) > 0, 'signes des pentes');
  // la courbe descend plus vite qu'elle ne remonte (λH − λNa = 30,0 > λHO + λNa = 24,9), à dilution comparable
  ok(Math.abs(M.pente({ analyte, cA }, VE / 2)) > M.pente({ analyte, cA }, VE + 3), 'pente avant plus forte en valeur absolue ' + analyte + cA);
}
for (const cA of M.CONC_A) { const p = { analyte: 'eth', cA }, VE = M.volumeEquivalent(cA);
  ok(M.pente(p, VE / 2) > 0 && M.pente(p, VE + 3) > 0 && M.pente(p, VE + 3) > 2 * M.pente(p, VE / 2), `acide faible : pente avant ${M.pente(p, VE / 2)} après ${M.pente(p, VE + 3)}`); }
// exact et « transformation totale » concordent pour un acide fort à plus de 2 mL de l'équivalence (écart < 0,2 %)
for (const analyte of ['hcl', 'hno3']) for (const cA of M.CONC_A) for (let VB = 0; VB <= 20; VB += 0.5) {
  const VE = M.volumeEquivalent(cA); if (Math.abs(VB - VE) < 2) continue;
  ok(Math.abs(M.sigmaTitrage({ analyte, cA, VB }) - M.sigmaTotale({ analyte, cA, VB })) <= 0.002 * M.sigmaTitrage({ analyte, cA, VB }), 'exact / totale ' + analyte + cA + VB);
}
// sans eau ajoutée, la dilution courbe fortement les segments ; avec 180 mL d'eau, les segments sont presque droits (écart au segment < 6 %)
{ const p = { analyte: 'hcl', cA: 0.050 }, s0 = M.sigmaTitrage({ ...p, VB: 0 }), sE = M.sigmaTitrage({ ...p, VB: 10 });
  const mi = M.sigmaTitrage({ ...p, VB: 5 }), droite = (s0 + sE) / 2; ok(Math.abs(mi - droite) / droite < 0.35, 'courbure avec 180 mL d’eau'); }
// défi 1 : 5 000 tirages ; V_E estimé par l'intersection de deux droites ajustées (points avant V_E − 2 et après V_E + 2) à moins de 0,6 mL
const reg = pts => { const N = pts.length, mx = pts.reduce((s, p) => s + p.VB, 0) / N, my = pts.reduce((s, p) => s + p.sigma, 0) / N, a = pts.reduce((s, p) => s + (p.VB - mx) * (p.sigma - my), 0) / pts.reduce((s, p) => s + (p.VB - mx) ** 2, 0); return [a, my - a * mx]; };
let pire = 0;
for (let i = 0; i < 5000; i++) {
  const d = M.tirageDefiConc(); ok(d.pts.length === 21 && d.pts.every(p => isFinite(p.sigma) && p.sigma > 0), 'points défi 1');
  ok(Math.abs(d.VE - 200 * d.cA) < 1e-9 && d.VE >= 8 && d.VE <= 12, 'V_E défi 1');
  const av = d.pts.filter(p => p.VB <= d.VE - 2 && p.VB >= (d.analyte === 'eth' ? 3 : 0)), ap = d.pts.filter(p => p.VB >= d.VE + 2);
  const [a1, b1] = reg(av), [a2, b2] = reg(ap), Vest = (b2 - b1) / (a1 - a2); pire = Math.max(pire, Math.abs(Vest - d.VE) / d.VE);
  ok(Math.abs(Vest - d.VE) / d.VE <= 0.05, `lecture de V_E ${d.analyte} ${d.cA} : ${Vest}`);
}
// défi 2 : valeurs et tolérance ; un élève qui arrondit les quantités à 3 chiffres significatifs et le résultat à 2 doit être jugé juste à 6 %
const sig = (x, k) => Number(Number(x).toPrecision(k));
for (let i = 0; i < 5000; i++) {
  const d = M.tirageDefiSigma(); ok(d.VB >= 2 && d.VB <= 16 && Math.abs(d.VB - d.VE) >= 2, 'V_B défi 2');
  ok(Math.abs(d.sigma - d.sigmaTot) <= 0.002 * d.sigma, 'exact / totale défi 2');
  for (const k of [2, 3]) ok(Math.abs(sig(d.sigmaTot, k) - d.sigma) <= 0.06 * d.sigma, 'tolérance défi 2 ' + k);
  ok(d.sigma > 30 && d.sigma < 400, 'ordre de grandeur σ défi 2 ' + d.sigma);
}
// vue « comme en TP » : deux droites ajustées sur les points éloignés de V_E (acides forts, eau ajoutée ≥ 180 mL) : V_E retrouvé à moins de 5 %
for (const an of ['hcl', 'hno3']) for (const cA of M.CONC_A) for (const eau of [180, 480]) {
  const VE = M.volumeEquivalent(cA), r = M.deuxDroites(M.pointsMesures({ analyte: an, cA, Vinit: M.VA0 + eau }, 1), VE);
  ok(r.avant.length >= 3 && r.apres.length >= 3, `points utilisés ${an} ${cA}`);
  ok(r.ecartes.every(q => Math.abs(q.VB - VE) < M.ZONE_ECARTEE), 'points écartés proches de V_E');
  ok(r.avant.concat(r.apres).every(q => Math.abs(q.VB - VE) >= M.ZONE_ECARTEE - 1e-9), 'points utilisés loin de V_E');
  ok(Math.abs(r.VEmod - VE) / VE <= 0.05, `V_E par deux droites ${an} ${cA} ${eau} : ${r.VEmod}`);
}
// QCM du parcours : la bonne réponse (index 'bonne') n'est jamais la plus longue (égalité comprise) ni strictement la plus courte
for (const [k, v] of Object.entries(QQ)) {
  const L = v.options.map(o => [...o].length), b = L[v.bonne], autres = L.filter((_, i) => i !== v.bonne);
  ok(b < Math.max(...autres), `QCM ${k} : la bonne est la plus longue`);
  ok(b >= Math.min(...autres), `QCM ${k} : la bonne est strictement la plus courte`);
}
console.log('conductimetrieModele : tous les tests passent (' + n + ' + 10 000 tirages ; écart maximal de lecture de V_E : ' + (100 * pire).toFixed(1) + ' %)');
