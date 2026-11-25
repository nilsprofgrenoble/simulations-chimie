// Modèle de la simulation 227 : caractéristique intensité-tension d'un panneau photovoltaïque (TSTL, enseignement PCM, partie « Énergie électrique », générateurs d'énergie électrique).
// Modèle à une diode, sans résistance série ni parallèle, à 25 °C : I(U) = Iph − I0 (exp(U/a) − 1), pour 0 ≤ U ≤ Uco.
//   Iph = courant photogénéré, PROPORTIONNEL à l'éclairement énergétique E (donc Icc = Iph) ;
//   a = Nc × n × Vt (Nc cellules en série, n = 1,3 facteur d'idéalité, Vt = 25,7 mV à 25 °C) ;
//   Uco = a ln(Iph / I0 + 1) : tension à vide, qui ne varie que lentement (logarithme) avec E.
// Les valeurs de jph, j0 et n sont choisies pour la simulation (ordres de grandeur d'une cellule au silicium) ; elles ne reprennent aucune donnée des documents du Moodle.
// Unités du modèle : tension en V, intensité en A, puissance en W, éclairement E en W/m², résistance en Ω. L'affichage donne les intensités en mA.
// Domaine de validité : E de 100 à 1000 W/m², température de 25 °C, éclairement uniforme, panneau fonctionnant en générateur (0 ≤ U ≤ Uco).

export const CONST = { jph: 0.032, j0: 3.2e-10, aCell: 0.0334, E0: 1000 }; // A/cm² à 1000 W/m² ; A/cm² ; V (n Vt par cellule) ; éclairement de référence

// Panneaux proposés en exploration : Nc cellules en série, de surface Acell (cm²) chacune.
export const PANNEAUX = {
  mini:  { id: 'mini', nom: 'Mini-panneau (3 cellules)', Nc: 3, Acell: 3 },
  lab:   { id: 'lab', nom: 'Panneau de laboratoire (6 cellules)', Nc: 6, Acell: 6.25 },
  grand: { id: 'grand', nom: 'Grand panneau (12 cellules)', Nc: 12, Acell: 12.5 },
};
export const IDS_PANNEAUX = ['mini', 'lab', 'grand'];
export const PANNEAU_PARCOURS = PANNEAUX.lab;
export const surface = p => (p.Nc * p.Acell) / 1e4; // surface totale du panneau en m² (cellules jointives)

export const E_LISTE = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
// Résistances de charge proposées (Ω) : 0 = fil (court-circuit), Infinity = circuit ouvert.
export const R_LISTE = [0, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 500, Infinity];

export const arrondiCS = (x, n = 2) => (x === 0 || !isFinite(x) ? x : Number(Number(x).toPrecision(n)));

export const iph = (p, E) => CONST.jph * p.Acell * (E / CONST.E0);
export const i0 = p => CONST.j0 * p.Acell;
export const aTot = p => p.Nc * CONST.aCell;
export const courantCC = (p, E) => iph(p, E);                              // courant de court-circuit Icc (U = 0)
export const tensionVide = (p, E) => aTot(p) * Math.log(iph(p, E) / i0(p) + 1); // tension à vide Uco (I = 0)

// intensité délivrée sous la tension U (panneau en générateur : 0 ≤ U ≤ Uco)
export function courant(p, E, U) {
  const uco = tensionVide(p, E);
  if (U <= 0) return iph(p, E);
  if (U >= uco) return 0;
  return Math.max(0, iph(p, E) - i0(p) * (Math.exp(U / aTot(p)) - 1));
}
export const puissance = (p, E, U) => U * courant(p, E, U);

// point de fonctionnement sur une résistance R : U = R I et I = I(U)
export function point(p, E, R) {
  if (R === 0) return { U: 0, I: courantCC(p, E), P: 0 };
  if (!isFinite(R)) return { U: tensionVide(p, E), I: 0, P: 0 };
  let lo = 0, hi = tensionVide(p, E);
  for (let k = 0; k < 90; k++) { const m = (lo + hi) / 2; if (m / R - courant(p, E, m) > 0) hi = m; else lo = m; }
  const U = (lo + hi) / 2, I = U / R;
  return { U, I, P: U * I };
}

// point de puissance maximale (P(U) est unimodale : recherche par section dorée)
export function pointPmax(p, E) {
  let a = 0, b = tensionVide(p, E);
  const g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a), d = a + g * (b - a);
  for (let k = 0; k < 120; k++) { if (puissance(p, E, c) > puissance(p, E, d)) b = d; else a = c; c = b - g * (b - a); d = a + g * (b - a); }
  const U = (a + b) / 2, I = courant(p, E, U);
  return { U, I, P: U * I, R: U / I };
}

// meilleur point parmi les résistances proposées (ce qu'un élève peut atteindre en réglant R)
export function meilleurSurGrille(p, E, liste = R_LISTE) {
  let m = null;
  for (const R of liste) { const q = point(p, E, R); if (!m || q.P > m.P) m = { ...q, R }; }
  return m;
}

// source idéale de tension U0 sur une résistance R : I = U0 / R (loi d'Ohm)
export const courantSourceIdeale = (U0, R) => U0 / R;

// ---------- valeurs fixes du parcours guidé (panneau de laboratoire, E = 1000 W/m²) ----------
export const PARCOURS = { E: 1000, Ra: 100, Rb: 2, U0: 3.0, E2: 400 };

// ---------- tirages des défis (données arrondies avant le calcul de la réponse) ----------
const choisir = (t, alea) => t[Math.min(t.length - 1, Math.floor(alea() * t.length))];
const NC = [3, 4, 5, 6, 8, 10, 12], ACELL = [3, 5, 6.25, 8, 10, 12.5];
const E_DEFI_A = [300, 400, 500, 600, 700, 800, 900, 1000];

// Défi A : panneau inconnu, éclairement donné ; l'élève cherche la puissance maximale en réglant R
export function tirageDefiA(alea = Math.random) {
  for (let k = 0; k < 400; k++) {
    const p = { id: 'inconnu', nom: 'Panneau inconnu', Nc: choisir(NC, alea), Acell: choisir(ACELL, alea) }, E = choisir(E_DEFI_A, alea);
    const m = pointPmax(p, E), g = meilleurSurGrille(p, E);
    if (g.P / m.P < 0.94 || Math.abs(g.U / m.U - 1) > 0.08) continue; // l'élève doit pouvoir réussir avec les résistances proposées
    return { type: 'pmax', p, E, Pmax: arrondiCS(m.P, 2), Upm: arrondiCS(m.U, 2), Ipm: arrondiCS(1000 * m.I, 2), Rpm: m.U / m.I, Uco: tensionVide(p, E), Icc: courantCC(p, E) };
  }
  throw new Error('tirage défi A impossible');
}

// Défi B : mesures à un éclairement E1 donné ; l'élève prévoit Icc et Pmax à E2 (Icc proportionnel à E, Pmax proportionnelle à E à quelques % près)
export function tirageDefiB(alea = Math.random) {
  for (let k = 0; k < 400; k++) {
    const p = { id: 'inconnu', nom: 'Panneau inconnu', Nc: choisir(NC, alea), Acell: choisir(ACELL, alea) };
    const E1 = choisir([800, 900, 1000], alea), E2 = choisir([300, 400, 500, 600, 700], alea);
    const Icc1 = arrondiCS(1000 * courantCC(p, E1), 3), Pmax1 = arrondiCS(pointPmax(p, E1).P, 3), Uco1 = arrondiCS(tensionVide(p, E1), 3);
    const Icc2 = arrondiCS(Icc1 * (E2 / E1), 12), Pmax2 = arrondiCS(Pmax1 * (E2 / E1), 12), Pvrai = pointPmax(p, E2).P;
    if (Math.abs(Pvrai / Pmax2 - 1) > 0.07) continue; // la proportionnalité de Pmax doit rester valable à moins de 7 %
    return { type: 'eclairement', p, E1, E2, Icc1, Pmax1, Uco1, Icc2, Pmax2, Pvrai, Uco2: tensionVide(p, E2) };
  }
  throw new Error('tirage défi B impossible');
}
