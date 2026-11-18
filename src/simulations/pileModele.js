// ====================================================
//  Modèle de la simulation 132 : la pile (TG spé PC, « Prévoir l'état final d'un système »).
//  Deux demi-piles métal / ion métallique reliées par un pont salin.
//  La tension à vide est calculée par la loi de Nernst à 25 °C (E = E° + (0,059 / z) log c), HORS PROGRAMME de TG :
//  l'élève ne voit que la valeur « mesurée » au voltmètre. Les potentiels standard ne sont jamais affichés.
//  Unités : concentrations en mol/L, volumes en mL, masses en g, quantités en mol, charge en C, durée en s.
// ====================================================

export const F = 96500;         // C/mol (valeur donnée aux élèves : 9,65 × 10⁴ C/mol)
export const P_NERNST = 0.059;  // V, 25 °C

// Couples métal / ion métallique. sol : nom de la solution ; ion : formule de l'ion ; m : symbole du métal.
export const METAUX = {
  zn: { m: 'Zn', ion: 'Zn²⁺', z: 2, E0: -0.76, M: 65.4, nom: 'zinc', lame: 'lame de zinc', sol: 'sulfate de zinc', anion: 'SO₄²⁻', couleur: '#e0f2fe', metal: '#94a3b8' },
  fe: { m: 'Fe', ion: 'Fe²⁺', z: 2, E0: -0.44, M: 55.8, nom: 'fer', lame: 'lame de fer', sol: 'sulfate de fer(II)', anion: 'SO₄²⁻', couleur: '#dcfce7', metal: '#64748b' },
  cu: { m: 'Cu', ion: 'Cu²⁺', z: 2, E0: 0.34, M: 63.5, nom: 'cuivre', lame: 'lame de cuivre', sol: 'sulfate de cuivre(II)', anion: 'SO₄²⁻', couleur: '#7dd3fc', metal: '#c2410c' },
  ag: { m: 'Ag', ion: 'Ag⁺', z: 1, E0: 0.80, M: 107.9, nom: 'argent', lame: 'lame d’argent', sol: 'nitrate d’argent', anion: 'NO₃⁻', couleur: '#f1f5f9', metal: '#cbd5e1' },
};
export const ORDRE = ['zn', 'fe', 'cu', 'ag'];

const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
const ppcm = (a, b) => (a * b) / pgcd(a, b);

// Potentiel d'électrode (hors programme, usage interne) ; c en mol/L.
export const potentiel = (id, c) => METAUX[id].E0 + (P_NERNST / METAUX[id].z) * Math.log10(Math.max(c, 1e-300));

// Pôle + : métal dont le couple est le plus oxydant (potentiel le plus élevé) ; pôle − : l'autre.
export function poles(a, b) {
  return METAUX[a].E0 >= METAUX[b].E0 ? { plus: a, moins: b } : { plus: b, moins: a };
}

// Équation de fonctionnement : coefficients (moins : métal oxydé ; plus : ion réduit) et nombre d'électrons échangés.
export function equation(moins, plus) {
  const za = METAUX[moins].z, zc = METAUX[plus].z, n = ppcm(za, zc);
  return { a: n / za, c: n / zc, n };
}
const coef = k => (k === 1 ? '' : `${k} `);
export function equationTexte(moins, plus) {
  const { a, c } = equation(moins, plus), A = METAUX[moins], C = METAUX[plus];
  return `${coef(a)}${A.m}(s) + ${coef(c)}${C.ion}(aq) → ${coef(a)}${A.ion}(aq) + ${coef(c)}${C.m}(s)`;
}
export const demiOx = id => `${METAUX[id].m}(s) → ${METAUX[id].ion}(aq) + ${METAUX[id].z === 1 ? '' : METAUX[id].z + ' '}e⁻`;
export const demiRed = id => `${METAUX[id].ion}(aq) + ${METAUX[id].z === 1 ? '' : METAUX[id].z + ' '}e⁻ → ${METAUX[id].m}(s)`;

// Constante d'équilibre de la réaction de fonctionnement (25 °C) : log K = n (E°+ − E°−) / 0,059.
export const logK = (moins, plus) => equation(moins, plus).n * (METAUX[plus].E0 - METAUX[moins].E0) / P_NERNST;

// ---------------- état de la pile ----------------
// Demi-pile : { id, c (mol/L), V (mL), m (g, masse de la lame) }. ne : quantité d'électrons déjà échangés (mol).
// Renvoie l'état après le passage de ne mol d'électrons (bornée à la capacité).
export function etat(g, d, ne = 0) {
  const { plus, moins } = poles(g.id, d.id), P = plus === g.id ? g : d, Mo = plus === g.id ? d : g;
  const A = METAUX[moins], C = METAUX[plus];
  const nIonPlus0 = P.c * P.V / 1000, nMetMoins0 = Mo.m / A.M;
  const neMaxIon = C.z * nIonPlus0, neMaxMet = A.z * nMetMoins0, neMax = Math.min(neMaxIon, neMaxMet);
  const x = Math.min(Math.max(ne, 0), neMax);
  const nIonPlus = nIonPlus0 - x / C.z, nIonMoins = Mo.c * Mo.V / 1000 + x / A.z;
  const nMetMoins = nMetMoins0 - x / A.z, mPlus = P.m + (x / C.z) * C.M;
  const cPlus = nIonPlus / (P.V / 1000), cMoins = nIonMoins / (Mo.V / 1000);
  const { a, c } = equation(moins, plus), lk = logK(moins, plus);
  const use = x >= neMax * (1 - 1e-12);
  // Tension à vide : différence des potentiels ; nulle quand la pile est usée (Qr = K, ou électrode du pôle − entièrement consommée).
  let U = use ? 0 : potentiel(plus, cPlus) - potentiel(moins, cMoins);
  if (!(U > 0)) U = 0;
  const logQr = a * Math.log10(cMoins) - c * Math.log10(Math.max(cPlus, 1e-300));
  return {
    plus, moins, P, Mo, x, neMax, use, limitant: neMaxIon <= neMaxMet ? 'ion' : 'metal',
    nIonPlus0, nMetMoins0, nIonPlus, nIonMoins, nMetMoins, mMoins: nMetMoins * A.M, mPlus, cPlus, cMoins,
    U, Q: x * F, Qmax: neMax * F, logQr: use ? lk : logQr, logK: lk,
  };
}
// Tension lue au voltmètre : borne V reliée à l'électrode « borneV » ('g' ou 'd'), COM à l'autre.
export function lecture(g, d, ne, borneV) {
  const e = etat(g, d, ne), idV = borneV === 'g' ? g.id : d.id;
  return idV === e.plus ? e.U : -e.U;
}
// Avancement maximal (mol) pour la réaction écrite avec les plus petits coefficients entiers.
export function xmax(g, d) {
  const e = etat(g, d, 0), { n } = equation(e.moins, e.plus);
  return e.neMax / n;
}
// Courbe de la tension à vide selon la charge débitée (pour le graphique d'usure).
export function courbeUsure(g, d, N = 121) {
  const e0 = etat(g, d, 0), pts = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N, ne = e0.neMax * (f < 1 ? 1 - Math.pow(1 - f, 1) : 1);
    pts.push({ Q: ne * F, U: etat(g, d, ne).U });
  }
  // points supplémentaires très près de l'épuisement, pour montrer la chute brutale
  [0.995, 0.999, 0.9999, 0.999999].forEach(f => pts.push({ Q: e0.neMax * f * F, U: etat(g, d, e0.neMax * f).U }));
  return pts.sort((p, q) => p.Q - q.Q);
}

// ---------------- défis ----------------
const tire = t => t[Math.floor(Math.random() * t.length)];
export const PAIRES = [['zn', 'cu'], ['fe', 'cu'], ['zn', 'fe'], ['cu', 'ag'], ['zn', 'ag'], ['fe', 'ag']];
const arr = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

// Défi 1 : polarité d'une pile inconnue. Le voltmètre est branché (V sur une électrode, COM sur l'autre) et affiche une valeur signée.
export function tirageDefiPolarite() {
  const [p, q] = tire(PAIRES), gauche = Math.random() < 0.5 ? p : q, droite = gauche === p ? q : p;
  const g = { id: gauche, c: 0.10, V: 100, m: 2 }, d = { id: droite, c: 0.10, V: 100, m: 2 };
  const borneV = Math.random() < 0.5 ? 'g' : 'd', lu = arr(lecture(g, d, 0, borneV), 2);
  const e = etat(g, d, 0);
  return { g, d, borneV, lu, plus: e.plus, moins: e.moins };
}
// Défi 2 : capacité d'une pile à partir de sa constitution initiale (données arrondies AVANT le calcul).
export function tirageDefiCapacite() {
  const [p, q] = tire(PAIRES), { plus, moins } = poles(p, q);
  const c = tire([0.050, 0.10, 0.15, 0.20]), V = tire([50, 100, 150, 200]);
  const m = tire([0.20, 0.30, 0.50, 1.0, 2.0, 3.0]), I = tire([20, 50, 100]);
  const Pl = { id: plus, c, V, m: 2 }, Mo = { id: moins, c: 0.10, V: 100, m };
  const e = etat(Pl, Mo, 0);
  const C = METAUX[plus], A = METAUX[moins];
  const nIon = c * V / 1000, nMet = m / A.M;
  const neIon = C.z * nIon, neMet = A.z * nMet, ne = Math.min(neIon, neMet);
  // réactif limitant net : les deux quantités d'électrons possibles diffèrent d'au moins 30 %
  if (Math.max(neIon, neMet) / ne < 1.3) return tirageDefiCapacite();
  const Q = ne * F;
  return { plus, moins, c, V, m, I, nIon, nMet, neIon, neMet, ne, Q, duree: Q / (I / 1000) / 3600, limitant: neIon <= neMet ? 'ion' : 'metal', e };
}
