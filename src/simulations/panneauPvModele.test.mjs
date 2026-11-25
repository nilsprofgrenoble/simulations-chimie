import * as M from './panneauPvModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 20) console.log('ÉCHEC', m); } };
const pr = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1e-12, Math.abs(b));
const tous = Object.values(M.PANNEAUX);

for (const p of tous) for (const E of M.E_LISTE) {
  const Icc = M.courantCC(p, E), Uco = M.tensionVide(p, E);
  ok(pr(M.courant(p, E, 0), Icc), `I(0) = Icc ${p.id} ${E}`);
  ok(Math.abs(M.courant(p, E, Uco)) < 1e-12, `I(Uco) = 0 ${p.id} ${E}`);
  ok(pr(Icc, M.CONST.jph * p.Acell * E / 1000), 'Icc = jph × A × E / E0');
  ok(Uco > 0.45 * p.Nc && Uco < 0.75 * p.Nc, `Uco par cellule plausible ${p.id} ${E} : ${Uco / p.Nc}`);
  // I décroît avec U, P unimodale
  let prec = Infinity, Pprec = 0, montee = true, changements = 0;
  for (let k = 0; k <= 400; k++) {
    const U = Uco * k / 400, I = M.courant(p, E, U), P = M.puissance(p, E, U);
    ok(I <= prec + 1e-15 && I >= 0, `I décroît ${p.id} ${E} ${k}`); prec = I;
    if (k > 0) { const m2 = P >= Pprec - 1e-15; if (m2 !== montee) { changements++; montee = m2; } }
    Pprec = P;
  }
  ok(changements === 1, `P unimodale ${p.id} ${E} (${changements} changements)`);
  // maximum : par section dorée comparé à un balayage fin, et dP/dU = 0 en ce point
  const m = M.pointPmax(p, E);
  let best = 0; for (let k = 0; k <= 20000; k++) best = Math.max(best, M.puissance(p, E, Uco * k / 20000));
  ok(pr(m.P, best, 1e-6) || m.P >= best - 1e-12, `Pmax ${p.id} ${E}`);
  const h = 1e-6, dP = (M.puissance(p, E, m.U + h) - M.puissance(p, E, m.U - h)) / (2 * h);
  ok(Math.abs(dP) < 1e-5 * Icc, `dP/dU = 0 au maximum ${p.id} ${E}`);
  ok(m.U > 0.7 * Uco && m.U < 0.95 * Uco, `Upm entre 70 et 95 % de Uco ${p.id} ${E}`);
  ok(m.I > 0.8 * Icc && m.I < 1 * Icc, `Ipm proche de Icc ${p.id} ${E}`);
  ok(m.P < Uco * Icc, 'Pmax < Uco × Icc'); ok(m.P / (Uco * Icc) > 0.7, `facteur de forme > 0,7 ${p.id} ${E}`);
  // points de fonctionnement sur toutes les résistances
  for (const R of M.R_LISTE) {
    const q = M.point(p, E, R);
    ok(q.U >= -1e-12 && q.U <= Uco + 1e-9, `U borné R=${R}`); ok(q.I >= -1e-12 && q.I <= Icc + 1e-12, `I borné R=${R}`);
    if (R > 0 && isFinite(R)) { ok(pr(q.U, R * q.I, 1e-8), `U = R I R=${R} ${p.id} ${E}`); ok(pr(q.I, M.courant(p, E, q.U), 1e-6) || Math.abs(q.I - M.courant(p, E, q.U)) < 1e-9, `point sur la courbe R=${R}`); }
    ok(q.P <= m.P + 1e-12, `P(R) ≤ Pmax R=${R}`);
    ok(Number.isFinite(q.U) && Number.isFinite(q.I) && Number.isFinite(q.P), `valeurs finies R=${R}`);
  }
  // R croissant : U croît, I décroît
  let uP = -1, iP = Infinity; for (const R of M.R_LISTE) { const q = M.point(p, E, R); ok(q.U >= uP - 1e-12, 'U croît avec R'); ok(q.I <= iP + 1e-12, 'I décroît avec R'); uP = q.U; iP = q.I; }
}

// Icc proportionnel à E ; Uco varie peu (logarithme)
for (const p of tous) {
  for (const E of M.E_LISTE) ok(pr(M.courantCC(p, E) / M.courantCC(p, 1000), E / 1000), `Icc ∝ E ${p.id} ${E}`);
  ok(M.tensionVide(p, 1000) > M.tensionVide(p, 100), 'Uco croît avec E');
  ok(M.tensionVide(p, 400) / M.tensionVide(p, 1000) > 0.9, `Uco(400) > 90 % de Uco(1000) ${p.id}`);
  for (let i = 1; i < M.E_LISTE.length; i++) ok(M.pointPmax(p, M.E_LISTE[i]).P > M.pointPmax(p, M.E_LISTE[i - 1]).P, 'Pmax croît avec E');
}

// valeurs de référence du parcours guidé (panneau de laboratoire, 1000 W/m²)
const lab = M.PANNEAUX.lab, PA = M.PARCOURS;
ok(pr(M.courantCC(lab, 1000), 0.2), 'Icc = 200 mA');
ok(pr(M.tensionVide(lab, 1000), 3.692, 1e-3), `Uco = 3,69 V : ${M.tensionVide(lab, 1000)}`);
const mp = M.pointPmax(lab, 1000);
ok(pr(mp.P, 0.588, 2e-3), `Pmax = 0,588 W : ${mp.P}`); ok(pr(mp.U, 3.129, 2e-3), `Upm : ${mp.U}`); ok(pr(mp.I, 0.1880, 3e-3), `Ipm : ${mp.I}`);
const pa = M.point(lab, PA.E, PA.Ra);
ok(pr(pa.U, 3.651, 1e-3), `R = 100 Ω : U = 3,65 V (${pa.U})`); ok(pr(pa.I, 0.0365, 3e-3), `R = 100 Ω : I = 36,5 mA (${pa.I})`);
ok(pr(M.arrondiCS(pa.U, 3) * M.arrondiCS(pa.I, 3), 3.65 * 0.0365, 1e-9) || pr(M.arrondiCS(pa.U, 3) * M.arrondiCS(pa.I, 3), 3.65 * 0.0365, 2e-3), 'P = U × I avec les valeurs affichées');
const pb = M.point(lab, PA.E, PA.Rb);
ok(pr(pb.I, 0.2, 1e-3), 'R = 2 Ω : I ≈ Icc = 200 mA'); ok(pr(M.courantSourceIdeale(PA.U0, PA.Rb), 1.5), 'source idéale 3,0 V sur 2,0 Ω : 1,5 A');
ok(M.courantSourceIdeale(PA.U0, PA.Rb) > 5 * pb.I, 'la source idéale débiterait plus de 5 fois plus');
ok(pr(M.courantCC(lab, PA.E2), 0.08), 'Icc(400) = 80 mA'); ok(M.tensionVide(lab, PA.E2) / M.tensionVide(lab, 1000) > 0.94 && M.tensionVide(lab, PA.E2) / M.tensionVide(lab, 1000) < 0.96, 'Uco(400) ≈ 95 % de Uco(1000)');
// le meilleur choix de la liste est 15 Ω ou 20 Ω pour le panneau de laboratoire à 1000 W/m², et sa puissance reste à moins de 6 % du maximum
const g = M.meilleurSurGrille(lab, 1000);
ok([15, 20].includes(g.R), `meilleure résistance ${g.R}`); ok(g.P / mp.P > 0.94, 'meilleur point de la liste à moins de 6 % du maximum');
// parmi les 13 premières résistances : seuls 15 Ω et 20 Ω donnent une puissance à moins de 10 % du maximum (valeur attendue Pmax, tolérance 10 %)
const dedans = M.R_LISTE.filter(R => isFinite(R) && Math.abs(M.point(lab, 1000, R).P / mp.P - 1) <= 0.10);
ok(JSON.stringify(dedans) === JSON.stringify([15, 20]) , `résistances dans la tolérance de 10 % : ${dedans}`);
ok(M.surface(lab) > 0.0037 && M.surface(lab) < 0.0038, 'surface du panneau de laboratoire');

// tirages
const marge = { A: 1, B: 1 };
for (let k = 0; k < 6000; k++) {
  const t = M.tirageDefiA(), u = M.tirageDefiB();
  const g2 = M.meilleurSurGrille(t.p, t.E);
  ok(t.Pmax > 0.01 && t.Pmax < 6, `Pmax défi A ${t.Pmax}`); ok(t.Upm > 1 && t.Upm < 9, 'Upm');
  ok(Math.abs(g2.P / t.Pmax - 1) <= 0.1 - 0.0001 + 0.0, `puissance atteignable à 6 % + arrondi près ${g2.P / t.Pmax}`);
  ok(Math.abs(g2.U / t.Upm - 1) <= 0.1, `tension atteignable ${g2.U / t.Upm}`);
  ok(t.Rpm > 1 && t.Rpm < 400, `Rpm dans la liste ${t.Rpm}`);
  // lecture à 3 chiffres significatifs des instruments : calcul de P avec les valeurs affichées
  const l = M.arrondiCS(g2.U, 3) * M.arrondiCS(g2.I, 3);
  ok(Math.abs(l / t.Pmax - 1) <= 0.1, 'P calculée avec les valeurs affichées');
  ok(u.Icc1 > 0 && u.Pmax1 > 0 && u.E2 < u.E1 && u.E2 / u.E1 >= 0.3, 'défi B');
  ok(Math.abs(u.Pvrai / u.Pmax2 - 1) <= 0.07, `Pmax proportionnelle à 7 % près ${u.Pvrai / u.Pmax2}`);
  ok(Math.abs(u.Pvrai / u.Pmax2 - 1) <= 0.10 - 0.005, 'tolérance de 10 % couvre la valeur du modèle');
  ok(pr(u.Icc2, u.Icc1 * u.E2 / u.E1, 1e-9), 'Icc2 = Icc1 × E2 / E1');
  ok(u.Uco2 < u.Uco1 * 1.0001 && u.Uco2 > 0.85 * u.Uco1, 'Uco varie peu');
}
console.log(`${n} vérifications, ${ko} échec(s).`);
process.exit(ko ? 1 : 0);
