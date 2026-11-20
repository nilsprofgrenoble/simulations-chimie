// ====================================================
//  Modèle de la simulation « Le noyau de l'atome : taille, masse et écriture ZAX » (2GT, sim 202).
//  Modèle pur (sans React), testé par noyauAtome2gtModele.test.mjs.
//  Hypothèses : atomes de Z = 1 à 18, un noyau « courant » par élément (les autres noyaux d'un même élément : simulation 203) ; atome neutre ;
//  taille de l'atome ≈ 10⁻¹⁰ m et du noyau ≈ 10⁻¹⁵ m (ordres de grandeur) ; proton et neutron de même masse (1,67 × 10⁻²⁷ kg, écart réel de 0,1 %) ;
//  électron de masse 9,11 × 10⁻³¹ kg ; charge élémentaire e = 1,60 × 10⁻¹⁹ C ; masse de l'atome ≈ A × 1,67 × 10⁻²⁷ kg (à 1 % près : énergie de liaison ignorée).
//  Les dessins d'atomes sont calculés ici : exactement Z protons, A − Z neutrons et Z électrons, sans chevauchement.
// ====================================================

export const NB = ' ';
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
export const sup = n => String(n).split('').map(c => SUP[c] ?? c).join('');
export const sub = n => String(n).split('').map(c => SUB[c] ?? c).join('');
export const p10 = e => `10${sup(e)}`;

// Nombre à la française : virgule décimale, espace insécable dans les milliers
export function nombreFR(x, dec = 0) {
  const [ent, d] = Math.abs(x).toFixed(dec).split('.');
  return (x < 0 ? '−' : '') + ent.replace(/\B(?=(\d{3})+(?!\d))/g, NB) + (d ? `,${d}` : '');
}
// Écriture scientifique : 1,67 × 10⁻²⁷ (cs chiffres significatifs)
export function sciFR(x, cs = 3) {
  const [m, e] = x.toExponential(cs - 1).split('e');
  return `${m.replace('.', ',')}${NB}×${NB}10${sup(Number(e))}`;
}
// Longueur d'un objet agrandi : « 100 m », « 1 km », « 22 km »
export function longueurFR(m) {
  if (m >= 1000) { const k = m / 1000, dec = Number.isInteger(k) ? 0 : 1; return `${nombreFR(k, dec)}${NB}km`; }
  return `${nombreFR(m, Number.isInteger(m) ? 0 : 1)}${NB}m`;
}

// ---------- grandeurs de référence ----------
export const EXP_ATOME = -10, EXP_NOYAU = -15;                       // ordres de grandeur des tailles (en m)
export const TAILLE_ATOME = 10 ** EXP_ATOME, TAILLE_NOYAU = 10 ** EXP_NOYAU;
export const RAPPORT_TAILLES = 10 ** (EXP_ATOME - EXP_NOYAU);        // 100 000
export const M_NUCLEON = 1.67e-27, M_ELECTRON = 9.11e-31;           // kg
export const RAPPORT_MASSES = M_NUCLEON / M_ELECTRON;                // ≈ 1 833 : « environ 1 800 fois »
export const E_CHARGE = 1.60e-19;                                    // C
export const M_ATOME_C12 = 1.99e-26;                                 // kg (valeur de la simulation 178)

// Quelques tailles repères (m), pour l'échelle de l'étape 1
export const REPERES_TAILLE = [
  { id: 'sable', nom: 'un grain de sable', exp: -3 },
  { id: 'cellule', nom: 'une cellule du corps', exp: -5 },
  { id: 'virus', nom: 'un virus', exp: -7 },
];

// ---------- éléments (Z = 1 à 18) : un noyau courant par élément ----------
// [Z, symbole, nom, article défini, « de » + nom, A du noyau courant]
const BRUT = [
  [1, 'H', 'hydrogène', 'l’', 'd’', 1], [2, 'He', 'hélium', 'l’', 'd’', 4], [3, 'Li', 'lithium', 'le ', 'de ', 7], [4, 'Be', 'béryllium', 'le ', 'de ', 9],
  [5, 'B', 'bore', 'le ', 'de ', 11], [6, 'C', 'carbone', 'le ', 'de ', 12], [7, 'N', 'azote', 'l’', 'd’', 14], [8, 'O', 'oxygène', 'l’', 'd’', 16],
  [9, 'F', 'fluor', 'le ', 'de ', 19], [10, 'Ne', 'néon', 'le ', 'de ', 20], [11, 'Na', 'sodium', 'le ', 'de ', 23], [12, 'Mg', 'magnésium', 'le ', 'de ', 24],
  [13, 'Al', 'aluminium', 'l’', 'd’', 27], [14, 'Si', 'silicium', 'le ', 'de ', 28], [15, 'P', 'phosphore', 'le ', 'de ', 31], [16, 'S', 'soufre', 'le ', 'de ', 32],
  [17, 'Cl', 'chlore', 'le ', 'de ', 35], [18, 'Ar', 'argon', 'l’', 'd’', 40],
];
export const ELEMENTS = BRUT.map(([Z, s, nom, art, de, A]) => ({ Z, s, nom, art, de, A, N: A - Z, le: `${art}${nom}`, deNom: `${de}${nom}` }));
export const element = Z => ELEMENTS.find(e => e.Z === Z);
export const elementDeSym = s => ELEMENTS.find(e => e.s === s);
export const SYMBOLES = ELEMENTS.map(e => e.s);

// Écriture conventionnelle en texte simple : ¹²₆C
export const zaxTexte = e => `${sup(e.A)}${sub(e.Z)}${e.s}`;
// Composition d'un noyau et de l'atome neutre
export const compo = Z => { const e = element(Z); return { Z, A: e.A, N: e.A - Z, electrons: Z, symbole: e.s, nom: e.nom }; };
export const masseNoyau = A => A * M_NUCLEON;
export const masseElectrons = Z => Z * M_ELECTRON;
export const partMasseElectrons = (Z, A) => masseElectrons(Z) / (masseNoyau(A) + masseElectrons(Z));
export const chargeNoyauC = Z => Z * E_CHARGE;

// Agrandissement : un noyau de taille donnée (mm) → l'atome correspondant (m), même facteur 10⁵
export const OBJETS_AGRANDIS = [
  { id: 'sable', nom: 'un grain de sable', mm: 1 },
  { id: 'bille', nom: 'une bille', mm: 10 },
  { id: 'pingpong', nom: 'une balle de ping-pong', mm: 40 },
  { id: 'ballon', nom: 'un ballon de football', mm: 220 },
];
export const atomeAgrandiM = mm => mm * 1e-3 * RAPPORT_TAILLES;

// ---------- dessin d'un atome : positions calculées (repère centré sur le noyau, y vers le bas) ----------
// Noyau : A disques serrés en spirale de Vogel ; protons et neutrons mêlés (le k-ième est un proton si ⌊(k+1)Z/A⌋ > ⌊kZ/A⌋) ;
// nuage : Z électrons répartis en spirale entre deux rayons. Les nombres de particules sont EXACTEMENT Z, A − Z et Z.
const OR = Math.PI * (3 - Math.sqrt(5));                              // angle d'or
export const RP = 7, RE = 5.5;                                        // rayons des disques (unités du dessin)
const COEF_NOYAU = 1.32;                                              // pas de la spirale du noyau, en rayons de disque
export function noyauPositions(Z, A, rp = RP) {
  const c = COEF_NOYAU * rp, pts = [];
  for (let k = 0; k < A; k++) {
    const r = c * Math.sqrt(k + 0.5), a = k * OR;
    pts.push({ x: r * Math.cos(a), y: r * Math.sin(a), type: Math.floor((k + 1) * Z / A) > Math.floor(k * Z / A) ? 'proton' : 'neutron' });
  }
  return pts;
}
export function atome(Z, A = element(Z).A) {
  const noy = noyauPositions(Z, A), rNoyau = Math.max(...noy.map(p => Math.hypot(p.x, p.y))) + RP;
  let rMin = rNoyau + RE + 14;
  // épaisseur du nuage : assez pour que les électrons restent à plus de 2,6 rayons les uns des autres
  const epais = Math.max(16, Math.ceil(Z * (2.6 * RE) ** 2 * 0.9 / (Math.PI * 2 * (rMin + 8))));
  // le noyau dessiné ne dépasse jamais le tiers du diamètre du nuage (dessin non à l'échelle : il ne doit pas sembler remplir l'atome)
  rMin = Math.max(rMin, 3 * rNoyau - epais - RE - 10);
  const rMax = rMin + epais;
  const electrons = [];
  for (let k = 0; k < Z; k++) {
    const r = Math.sqrt(rMin ** 2 + (rMax ** 2 - rMin ** 2) * (k + 0.5) / Z), a = k * OR + 0.7;
    electrons.push({ x: r * Math.cos(a), y: r * Math.sin(a), type: 'electron' });
  }
  return { Z, A, N: A - Z, noyau: noy, electrons, rNoyau, rNuage: rMax + RE + 10 };
}

export const rayonNuage = Z => atome(Z, element(Z).A).rNuage;
export const rayonNoyau = Z => atome(Z, element(Z).A).rNoyau;

// ---------- défis : tirages ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
export function tirerElement(precedent = null) {
  let e; do { e = tire(ELEMENTS); } while (precedent && e.Z === precedent && ELEMENTS.length > 1);
  return e;
}
// Défi 1 : composition → écriture ZAX
export const tirerDefiZax = prec => { const e = tirerElement(prec ? prec.Z : null); return { type: 'zax', Z: e.Z, A: e.A, N: e.N, s: e.s }; };
// Défi 2 : écriture ZAX → composition
export const tirerDefiCompo = prec => { const e = tirerElement(prec ? prec.Z : null); return { type: 'compo', Z: e.Z, A: e.A, N: e.N, s: e.s }; };
const entier = v => { const t = String(v ?? '').replace(/\s/g, '').replace(',', '.'); return /^\d+$/.test(t) ? Number(t) : NaN; };
export function reponseZax(d, rep) { const z = entier(rep.Z) === d.Z, a = entier(rep.A) === d.A, s = rep.s === d.s; return { z, a, s, ok: z && a && s }; }
export function reponseCompo(d, rep) { const p = entier(rep.p) === d.Z, n = entier(rep.n) === d.N, e = entier(rep.e) === d.Z; return { p, n, e, ok: p && n && e }; }
