import * as M from './oseModele.js';
let ok = 0, ko = 0;
const t = (c, m) => { if (c) ok++; else { ko++; console.log('ÉCHEC oseModele : ' + m); } };
const proche = (a, b, e = 1e-3) => Math.abs(a - b) <= e;
// sans frottement : Em = 1 constante, Ec + Ep
{ const S = M.serie(1, 0, 0); t(S.em.every(v => proche(v, 1, 1e-9)), 'Em constante sans frottement'); t(proche(S.ec[0], 0, 1e-12) && proche(S.ep[0], 1, 1e-12), 'départ : tout en potentielle'); t(S.q[S.n] === 0, 'aucune perte'); }
// Ec maximale à l'équilibre (t = T0/4) et période de Ec = T0/2
{ const S = M.serie(1, 0, 0, 2, 0.001); t(proche(S.ec[250], 1, 1e-6) && proche(S.ep[250], 0, 1e-6), 'Ec max à T0/4'); t(proche(S.ec[500], 0, 1e-6) && proche(S.ec[750], 1, 1e-6), 'Ec : période T0/2'); }
// bilan Em = 1 + W − Q pour plusieurs réglages
for (const zeta of M.ZETAS) for (const c of [0, 0.4, 1]) {
  const S = M.serie(1, zeta, c, 6, 0.005); let pire = 0;
  for (let i = 0; i <= S.n; i += 20) pire = Math.max(pire, Math.abs(S.em[i] - (1 + S.w[i] - S.q[i])));
  t(pire < 2e-3, `bilan énergétique ζ=${zeta} c=${c} (écart ${pire.toExponential(2)})`);
  if (c === 1) t(S.em.every(v => proche(v, 1, 1e-9)), `entretien total : Em constante (ζ=${zeta})`);
  if (c === 0 && zeta > 0) t(S.em[S.n] < S.em[0] && S.q[S.n] > 0, `frottements : Em diminue (ζ=${zeta})`);
  t(S.q.every((v, i) => i === 0 || v >= S.q[i - 1] - 1e-12), 'pertes cumulées croissantes');
}
// entretien total : l'apport par période compense les pertes (≈ 2πζ)
{ const S = M.serie(1, 0.1, 1, 1, 0.0005); t(proche(S.w[S.n], M.pertesParPeriode(0.1), 0.01), `pertes par période ≈ 4πζ (${S.w[S.n].toFixed(4)})`); }
// défis
for (let i = 0; i < 500; i++) {
  const d = M.tirageCourbe(); t(d.cands[d.bonne] === d.cible && new Set(d.cands).size === 3, 'tirage courbe');
  d.cands.forEach((_, j) => { const r = M.diagCourbe(d, j); t(r.ok === (j === d.bonne) && r.msg.length > 10, 'diag courbe'); });
  const e = M.tirageDissipee(); t(e.x1 < e.x0 && e.Q > 0, 'tirage dissipée');
  t(M.diagDissipee(e, String(e.Q.toFixed(1)).replace('.', ',')).ok, 'dissipée juste');
  t(M.diagDissipee(e, String(Number(e.Q.toPrecision(2)))).ok, 'dissipée arrondie à 2 chiffres significatifs');
  t(!M.diagDissipee(e, String(2 * e.Q)).ok && /facteur/.test(M.diagDissipee(e, String(2 * e.Q)).msg), 'oubli du ½ détecté');
  t(/millijoules|joules/.test(M.diagDissipee(e, String(e.Q / 1000)).msg), 'unité J détectée');
  t(M.diagDissipee(e, 'abc').msg.includes('nombre'), 'saisie non numérique');
}
console.log(ko ? `ÉCHEC : ${ko} sur ${ok + ko}` : `oseModele OK (${ok} vérifications)`);
if (ko) process.exit(1);
