// ====================================================
//  MODÈLE « TITRAGE POTENTIOMÉTRIQUE » (sim 297, TSTL SPCL, chapitre Oxydo-réduction).
//  Situation : une solution d'un réducteur (couple Ox_A / Red_A, ici Fe³⁺ / Fe²⁺ par défaut) est dosée par des ions cérium(IV) Ce⁴⁺ (couple Ce⁴⁺ / Ce³⁺).
//  Réaction (un électron échangé de chaque côté) : Ce⁴⁺ + Red_A → Ce³⁺ + Ox_A, constante K = 10^((E°(Ce) − E°(A)) / 0,06).
//  On mesure la tension U entre une électrode de platine plongée dans le bécher et l'électrode de référence ECS : U = E(Pt) − E(ECS).
//  Hypothèses : 25 °C ; E = E° + 0,06 log([Ox]/[Red]) (convention du site) ; activités ≈ concentrations ; réaction instantanée, équilibre atteint
//  à chaque ajout ; le platine est inerte ; E(ECS) = 0,245 V constant ; E°(Ce⁴⁺/Ce³⁺) = 1,44 V (valeur usuelle en milieu sulfurique) ;
//  un peu d'ion oxydé du couple titré (0,2 % de la quantité de réducteur) est présent dès le départ (le réducteur s'oxyde lentement à l'air),
//  ce qui rend le potentiel initial défini. L'équilibre est résolu EXACTEMENT (équation du second degré), sans approximation d'avant/après l'équivalence.
// ====================================================
export const PENTE = 0.06, E_ECS = 0.245, E0_CE = 1.44, TRACE = 0.002, V_BURETTE = 25, V_GOUTTE = 0.05;
export const log10 = x => Math.log(x) / Math.LN10;

export const COUPLES_A = {
  fe: { id: 'fe', nom: 'Fe³⁺ / Fe²⁺', ox: 'Fe³⁺', red: 'Fe²⁺', E0: 0.77 },
  cn: { id: 'cn', nom: 'Fe(CN)₆³⁻ / Fe(CN)₆⁴⁻', ox: 'Fe(CN)₆³⁻', red: 'Fe(CN)₆⁴⁻', E0: 0.36 },
  ph: { id: 'ph', nom: 'Fe(phen)₃³⁺ / Fe(phen)₃²⁺ (ferroïne)', ox: 'Fe(phen)₃³⁺', red: 'Fe(phen)₃²⁺', E0: 1.06 },
};
export const SIT_GUIDE = { cA: 0.0500, VA: 20.0, cB: 0.0800, E0A: 0.77 };   // n(Fe²⁺) = 1,000 mmol ; V_E = 12,50 mL

export function situation({ cA, VA, cB, E0A }) {
  const nA = cA * VA, Veq = nA / cB;                                           // mmol, mL
  return { cA, VA, cB, E0A, nA, Veq, K: Math.pow(10, (E0_CE - E0A) / PENTE) };
}
// État du bécher après un volume V (mL) de Ce⁴⁺ versé : quantités en mmol, potentiel E de l'électrode de platine, tension U lue.
export function etat(s, V) {
  const { nA, K } = s, t = TRACE * nA, nCe = s.cB * V, delta = nCe - nA;
  const A = K - 1, B = K * delta + t + 2 * nA, C = -(t + nA) * nA;             // (K−1) y² + (Kδ + t + 2nA) y − (t + nA) nA = 0, y = n(Red_A) restant
  const rac = Math.sqrt(B * B - 4 * A * C), q = -0.5 * (B + (B >= 0 ? rac : -rac));
  const y = q > 0 ? q / A : C / q;
  const nRed = y, nOx = t + nA - y, nCe3 = nA - y, nCe4 = Math.max(0, delta + y);
  const E = s.E0A + PENTE * log10(nOx / nRed);
  const regime = V < s.Veq - 0.25 ? 'avant' : V > s.Veq + 0.25 ? 'apres' : 'equiv';
  return { V, nRed, nOx, nCe3, nCe4, E, U: E - E_ECS, regime };
}
export const E_INIT = etat(situation(SIT_GUIDE), 0).E;                       // potentiel avant tout ajout (≈ 0,608 V)

// Points du « tableur » : V de 0 à 25 mL par pas de 0,2 mL, tension U arrondie au mV (précision d'un voltmètre).
export function pointsTableur(s, pas = 0.2) {
  const pts = [];
  for (let k = 0; k * pas <= V_BURETTE + 1e-9; k++) { const V = Math.round(k * pas * 100) / 100; pts.push([V, Math.round(etat(s, V).E * 1000) / 1000]); }
  return pts;
}
// Méthode de la dérivée : milieu de l'intervalle où dE/dV est maximale.
export function veqDerivee(pts) {
  let best = 1, dmax = -1;
  for (let k = 1; k < pts.length; k++) { const d = (pts[k][1] - pts[k - 1][1]) / (pts[k][0] - pts[k - 1][0]); if (d > dmax) { dmax = d; best = k; } }
  return Math.round((pts[best][0] + pts[best - 1][0]) / 2 * 100) / 100;
}
export const cDepuisVe = (Ve, cB, VA) => cB * Ve / VA;

// Défi 1 : doser une solution de fer(II) (c_A cachée) par le cérium(IV), V_E entre 7 et 21 mL.
export function tirageDefiDosage() {
  for (let k = 0; k < 400; k++) {
    const cB = [0.0500, 0.0800, 0.1000][Math.floor(Math.random() * 3)], VA = [10, 20][Math.floor(Math.random() * 2)];
    const cA = Math.round((0.02 + Math.random() * 0.06) * 1000) / 1000, s = situation({ cA, VA, cB, E0A: 0.77 });
    if (s.Veq >= 7 && s.Veq <= 21) return { s, cA, cB, VA };
  }
  return { s: situation(SIT_GUIDE), cA: SIT_GUIDE.cA, cB: SIT_GUIDE.cB, VA: SIT_GUIDE.VA };
}
// Défi 2 : lire le potentiel standard d'un couple inconnu sur une courbe de titrage (V_E entre 8 et 18 mL, E° entre 0,45 et 1,00 V).
export function tirageDefiE0() {
  const E0A = Math.round((0.45 + Math.random() * 0.55) * 100) / 100, Veq = Math.round((8 + Math.random() * 10) * 10) / 10, cB = 0.1, VA = 20;
  const s = situation({ cA: cB * Veq / VA, VA, cB, E0A });
  return { s, E0A, Veq, pts: pointsTableur(s) };
}
export const fr = (v, d = 2) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');

export const COUL_BURETTE = '#fbbf24';
// couleur de la solution : jaune très pâle qui s'intensifie à peine (les ions Fe³⁺ et Ce⁴⁺ sont jaunes) : pas d'indicateur visible
const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * Math.max(0, Math.min(1, t))));
export function couleurSolution(s, e) {
  const fOx = e.nOx / (e.nOx + e.nRed), exces = Math.min(1, e.nCe4 / (0.35 * s.nA));
  const c = mix(mix([244, 248, 232], [250, 241, 176], fOx), [250, 214, 110], exces);
  return `rgb(${c.join(',')})`;
}
export function motTeinte(e) { return e.nCe4 > 0.05 * (e.nOx + e.nRed) ? 'jaune orangé' : 'jaune très pâle'; }

