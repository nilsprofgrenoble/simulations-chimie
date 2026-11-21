// Famille REA (calculs) de la simulation 218 « Thixotropie : le test 3ITT » (BTS MDC).
// Préfixe d'identifiants : itt- ; domaine « Rhéologie ». Branchée dans AtelierRealiserBanque.jsx (FAMILLES).
// Capacités : régénération en % de la viscosité de référence (M1), viscosité cible pour 25 % ou 50 %, temps compté depuis le
// début de l'intervalle 3 (M2), pente de la courbe η(t) (M3), conversion mPa·s/s en Pa·s/s.
// Les réponses sont calculées à partir des valeurs AFFICHÉES (donnée arrondie avant le calcul).

const NB = ' ';
const tire = (t) => t[Math.floor(Math.random() * t.length)];
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');
function nb(x, cs = 3) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const r = Number(x.toPrecision(cs));
  const e = Math.floor(Math.log10(Math.abs(r)));
  if (e < -3 || e > 5) return `${(r / Math.pow(10, e)).toFixed(cs - 1).replace('.', ',')}${NB}×${NB}10${sup(e)}`;
  const d = Math.max(0, cs - 1 - e);
  return r.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
}
const milliers = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);

export function genTroisITTBTS() {
  const ref = tire([12000, 14500, 16200, 18500, 24600]); // mPa·s
  const part = tire([0.55, 0.65, 0.72, 0.8, 0.85, 0.9]);
  const eta80 = Math.round((ref * part) / 10) * 10;
  const m1 = (eta80 / ref) * 100;
  const q = tire([25, 50]);
  const cible = (q / 100) * ref;
  const dur = tire([6, 8, 11, 14, 18]); // s après le début de l'intervalle 3
  const tAbs = 40 + dur;
  const t1 = tire([45, 48, 50]), t2 = t1 + tire([15, 20, 25]);
  const e1 = Math.round((ref * tire([0.18, 0.25, 0.3])) / 10) * 10;
  const e2 = Math.round((ref * tire([0.55, 0.65, 0.7])) / 10) * 10;
  const pen = (e2 - e1) / (t2 - t1);

  const intro = <>Un test 3ITT sur une peinture impose γ̇ = 1{NB}s⁻¹ pendant 20{NB}s (intervalle 1), 256{NB}s⁻¹ pendant 20{NB}s (intervalle 2), puis 1{NB}s⁻¹ (intervalle 3, qui commence à <b>t = 40{NB}s</b>). La viscosité de référence (fin de l’intervalle 1) est <b>ηref = {milliers(ref)}{NB}mPa·s</b>.</>;
  const q1 = { id: 'r0', type: 'num', q: <>{intro} Au bout de 80{NB}s dans l’intervalle 3, on mesure η = <b>{milliers(eta80)}{NB}mPa·s</b>. Calculez la régénération (méthode M1), en % de ηref (2 chiffres significatifs).</>, unite: '%', vrai: m1, tolRel: 0.03, csMin: 2,
    aide: 'Régénération (%) = η ÷ ηref × 100, avec les deux viscosités dans la même unité.',
    pieges: [[(ref / eta80) * 100, 'Vous avez inversé le rapport : c’est η mesurée divisée par ηref.'], [100 - m1, 'C’est la part de viscosité qui manque. La régénération est la part retrouvée.'], [m1 / 100, 'Fraction : multipliez par 100 pour l’exprimer en %.']],
    expl: <>Régénération = {milliers(eta80)} ÷ {milliers(ref)} × 100 = <b>{nb(m1, 2)}{NB}%</b>.</> };
  const q2 = { id: 'r1', type: 'num', q: <>Même peinture, ηref = {milliers(ref)}{NB}mPa·s. Pour la méthode M2, on cherche le temps pour atteindre {q}{NB}% de ηref. Quelle viscosité cela représente-t-il (en mPa·s, 3 chiffres significatifs) ?</>, unite: 'mPa·s', vrai: cible, tolRel: 0.01, csMin: 3,
    aide: `${q} % de ηref = ${q} ÷ 100 × ηref.`,
    pieges: [[ref * q, 'Vous avez multiplié par le pourcentage sans le diviser par 100.'], [ref - cible, 'C’est la part qui manque pour atteindre ηref. Il faut ' + q + ' % de ηref.']],
    expl: <>{q}{NB}% de ηref = {q} ÷ 100 × {milliers(ref)} = <b>{milliers(cible)}{NB}mPa·s</b>.</> };
  const q3 = { id: 'r2', type: 'num', q: <>Sur la courbe, la viscosité atteint cette valeur à l’instant <b>t = {tAbs}{NB}s</b> (lu sur l’axe du temps). Quel est le temps de régénération, compté depuis le début de l’intervalle 3 (en s) ?</>, unite: 's', vrai: dur, tolRel: 0.005, csMin: 1,
    aide: 'Le temps se compte depuis le début de l’intervalle 3, qui commence à t = 40 s.',
    pieges: [[tAbs, 'Vous avez donné l’instant lu sur l’axe. Retranchez le début de l’intervalle 3 (40 s).']],
    expl: <>Temps de régénération = {tAbs} − 40 = <b>{dur}{NB}s</b>.</> };
  const q4 = { id: 'r3', type: 'num', q: <>Entre t = {t1}{NB}s et t = {t2}{NB}s, la viscosité passe de <b>{milliers(e1)}{NB}mPa·s</b> à <b>{milliers(e2)}{NB}mPa·s</b>. Calculez la pente de la courbe η(t) (méthode M3), en mPa·s/s (3 chiffres significatifs).</>, unite: 'mPa·s/s', vrai: pen, tolRel: 0.01, csMin: 3,
    aide: 'Pente = Δη ÷ Δt, avec Δη = η finale − η initiale et Δt = t final − t initial.',
    pieges: [[e2 - e1, 'Vous avez calculé Δη, sans le diviser par la durée Δt.'], [(t2 - t1) / (e2 - e1), 'Vous avez inversé le rapport : la pente est Δη divisé par Δt.']],
    expl: <>Δη = {milliers(e2)} − {milliers(e1)} = {milliers(e2 - e1)}{NB}mPa·s ; Δt = {t2} − {t1} = {t2 - t1}{NB}s ; pente = <b>{nb(pen, 3)}{NB}mPa·s/s</b>.</> };
  const q5 = { id: 'r4', type: 'num', q: <>La pente trouvée est de {nb(pen, 3)}{NB}mPa·s/s. Exprimez-la en Pa·s/s (3 chiffres significatifs).</>, unite: 'Pa·s/s', vrai: pen / 1000, tolRel: 0.01, csMin: 3,
    aide: '1 mPa·s = 10⁻³ Pa·s : divisez par 1 000.',
    pieges: [[pen * 1000, 'Vous avez multiplié par 1 000 au lieu de diviser : 1 mPa·s = 10⁻³ Pa·s.']],
    expl: <>{nb(pen, 3)}{NB}mPa·s/s = <b>{nb(pen / 1000, 3)}{NB}Pa·s/s</b>.</> };
  [q1, q2, q3, q4, q5].forEach((x) => { x.pieges = x.pieges.filter(([y]) => isFinite(y) && y > 0 && Math.abs(y - x.vrai) > Math.max(0.02, 1.5 * (x.tolRel ?? 0.006)) * Math.abs(x.vrai)); });
  return {
    intro: 'Test 3ITT : régénération en % de la viscosité de référence (M1), viscosité cible et temps de régénération (M2), pente de η(t) (M3).',
    questions: [q1, q2, q3, q4, q5],
    retenir: ['ηref est la viscosité à la fin de l’intervalle 1. Régénération (M1) = η ÷ ηref × 100.', 'Le temps de régénération (M2) se compte depuis le début de l’intervalle 3, pas depuis t = 0.', 'La pente (M3) est Δη ÷ Δt, en mPa·s par seconde.'],
  };
}
