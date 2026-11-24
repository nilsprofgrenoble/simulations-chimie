// ====================================================
//  MODÈLE « GÉOMÉTRIE, ÉLECTRONÉGATIVITÉ ET POLARITÉ D'UNE ENTITÉ » (sim 155, 1G spé PC) : calculs purs, testés par geometrieModele.test.mjs.
//  - Entités avec schéma de Lewis (liaisons, doublets non liants), coordonnées 3D construites à partir de la géométrie VSEPR.
//  - Électronégativité (valeurs du cours, échelle de Pauling arrondie), classement des liaisons par Δχ avec des seuils CONVENTIONNELS (0,4 et 1,7).
//  - Polarité d'une molécule : barycentres G⁺ et G⁻ des charges partielles (même charge ±δ pour toutes les liaisons polarisées).
//  Hypothèses : modèle VSEPR limité à un atome central (n + m = 2, 3 ou 4) ; les angles réels (104,5° pour H₂O, 107° pour NH₃…) sont des valeurs
//  expérimentales arrondies, le modèle simple donnerait 109,5° ; la polarité n'est définie ici que pour une molécule neutre.
// ====================================================

// ---------- électronégativité (valeurs du tableau du cours) ----------
export const CHI = { H: 2.2, C: 2.5, N: 3.0, O: 3.5, F: 4.0, Cl: 3.0, Br: 2.9, S: 2.6, Na: 0.9 };
export const SEUIL_NON = 0.4, SEUIL_IONIQUE = 1.7;
export const deltaChi = (a, b) => Math.round(Math.abs(CHI[a] - CHI[b]) * 10) / 10;
/** 'non' (non polarisée), 'pol' (polarisée) ou 'ion' (ionique) : conventions de cours, pas des lois. */
export const typeLiaison = d => (d <= SEUIL_NON + 1e-9 ? 'non' : d > SEUIL_IONIQUE + 1e-9 ? 'ion' : 'pol');
export const LIBELLE_LIAISON = { non: 'non polarisée', pol: 'polarisée', ion: 'ionique' };

// ---------- couleurs et rayons d'affichage (modèle moléculaire) ----------
export const COUL_ATOME = { H: '#e2e8f0', C: '#475569', N: '#3b82f6', O: '#ef4444', Cl: '#22c55e', A: '#a8a29e', X: '#fbbf24' };
export const RAYON_ATOME = { H: 0.30, C: 0.46, N: 0.43, O: 0.41, Cl: 0.60, A: 0.30, X: 0.34 };

// ---------- vecteurs ----------
const norm = v => Math.hypot(...v);
const unit = v => { const n = norm(v); return v.map(x => x / n); };
const mul = (v, k) => v.map(x => x * k);
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const angleDeg = (u, v) => Math.round(Math.acos(Math.max(-1, Math.min(1, dot(unit(u), unit(v))))) * 18000 / Math.PI) / 100;
const RAD = Math.PI / 180;

// ---------- directions des doublets autour de l'atome central ----------
const TETRA = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(unit);
/** Directions (liants puis non liants) pour n liants et m non liants ; theta = angle X–A–X réel (degrés) pour les cas où il diffère de l'angle idéal. */
export function directions(n, m, theta) {
  if (n + m === 2) return { liants: [[1, 0, 0], [-1, 0, 0]], nonLiants: [] };
  if (n + m === 3) { const d = [90, 210, 330].map(a => [Math.cos(a * RAD), Math.sin(a * RAD), 0]); return { liants: d.slice(0, n), nonLiants: d.slice(n) }; }
  if (n === 4) return { liants: TETRA, nonLiants: [] };
  if (n === 2 && m === 2) {
    const h = (theta || 104.5) / 2 * RAD, phi = 54.75 * RAD;
    return { liants: [[Math.sin(h), -Math.cos(h), 0], [-Math.sin(h), -Math.cos(h), 0]], nonLiants: [[0, Math.cos(phi), Math.sin(phi)], [0, Math.cos(phi), -Math.sin(phi)]] };
  }
  if (n === 3 && m === 1) {
    const cb2 = (2 * Math.cos((theta || 107) * RAD) + 1) / 3, cb = Math.sqrt(cb2), sb = Math.sqrt(1 - cb2);
    return { liants: [0, 120, 240].map(a => [sb * Math.cos(a * RAD), -cb, sb * Math.sin(a * RAD)]), nonLiants: [[0, 1, 0]] };
  }
  throw new Error(`AX${n}E${m} non géré`);
}

// ---------- entités ----------
// Chaque entité : atomes [{ s, p, lp }] (lp = doublets non liants de l'atome), liaisons [[i, j, ordre]], centre (indice de l'atome central ou null),
// charge, lewis { pos, lpDirs } pour le schéma plat (angles en degrés, 0 = droite, 90 = haut), forme, programme (false = au-delà du programme).
function polyatomique({ id, nom, f, centre, ligands, n, m, theta, charge = 0, programme = true, lewis, cram = null, forme, lpCentre = m }) {
  const d = directions(n, m, theta);
  const atomes = [{ s: centre, p: [0, 0, 0], lp: lpCentre }];
  const liaisons = [];
  ligands.forEach(([s, dist, ordre, lp], k) => { atomes.push({ s, p: mul(d.liants[k], dist), lp: lp || 0 }); liaisons.push([0, k + 1, ordre]); });
  return { id, nom, f, atomes, liaisons, centre: 0, charge, n, m, nonLiants: d.nonLiants, lewis, cram, forme, programme, theta };
}
function diatomique({ id, nom, f, s1, s2, dist, ordre, lp1, lp2, lewis }) {
  return { id, nom, f, atomes: [{ s: s1, p: [-dist / 2, 0, 0], lp: lp1 }, { s: s2, p: [dist / 2, 0, 0], lp: lp2 }], liaisons: [[0, 1, ordre]], centre: null, charge: 0, n: 0, m: 0, nonLiants: [],
    lewis, cram: null, forme: 'linéaire', programme: true, theta: 180 };
}
const L = (pos, lpDirs, extra = {}) => ({ pos, lpDirs, ...extra });

export const ENTITES = [
  diatomique({ id: 'H2', nom: 'dihydrogène', f: 'H₂', s1: 'H', s2: 'H', dist: 0.74, ordre: 1, lp1: 0, lp2: 0, lewis: L([[-26, 0], [26, 0]], [[], []]) }),
  diatomique({ id: 'O2', nom: 'dioxygène', f: 'O₂', s1: 'O', s2: 'O', dist: 1.21, ordre: 2, lp1: 2, lp2: 2, lewis: L([[-30, 0], [30, 0]], [[135, 225], [45, 315]]) }),
  diatomique({ id: 'N2', nom: 'diazote', f: 'N₂', s1: 'N', s2: 'N', dist: 1.10, ordre: 3, lp1: 1, lp2: 1, lewis: L([[-30, 0], [30, 0]], [[180], [0]]) }),
  diatomique({ id: 'HCl', nom: 'chlorure d’hydrogène', f: 'HCl', s1: 'H', s2: 'Cl', dist: 1.27, ordre: 1, lp1: 0, lp2: 3, lewis: L([[-30, 0], [30, 0]], [[], [90, 270, 0]]) }),
  polyatomique({ id: 'H2O', nom: 'eau', f: 'H₂O', centre: 'O', ligands: [['H', 0.96, 1], ['H', 0.96, 1]], n: 2, m: 2, theta: 104.5, forme: 'coudée',
    lewis: L([[0, 0], [-46, 0], [46, 0]], [[90, 270], [], []]),
    cram: { c: [0, 0], liens: [{ s: 'H', x: -52, y: 38, st: 'plan' }, { s: 'H', x: 52, y: 38, st: 'plan' }] } }),
  polyatomique({ id: 'CO2', nom: 'dioxyde de carbone', f: 'CO₂', centre: 'C', ligands: [['O', 1.16, 2, 2], ['O', 1.16, 2, 2]], n: 2, m: 0, forme: 'linéaire',
    lewis: L([[0, 0], [-54, 0], [54, 0]], [[], [90, 270], [90, 270]]),
    cram: { c: [0, 0], liens: [{ s: 'O', x: -62, y: 0, st: 'plan', o: 2 }, { s: 'O', x: 62, y: 0, st: 'plan', o: 2 }] } }),
  polyatomique({ id: 'NH3', nom: 'ammoniac', f: 'NH₃', centre: 'N', ligands: [['H', 1.01, 1], ['H', 1.01, 1], ['H', 1.01, 1]], n: 3, m: 1, theta: 107, forme: 'pyramidale',
    lewis: L([[0, -4], [-40, -4], [40, -4], [0, 36]], [[90], [], [], []]),
    cram: { c: [0, 0], liens: [{ s: 'H', x: 0, y: -52, st: 'plan' }, { s: 'H', x: -52, y: 34, st: 'avant' }, { s: 'H', x: 52, y: 34, st: 'arriere' }] } }),
  polyatomique({ id: 'CH4', nom: 'méthane', f: 'CH₄', centre: 'C', ligands: [['H', 1.09, 1], ['H', 1.09, 1], ['H', 1.09, 1], ['H', 1.09, 1]], n: 4, m: 0, forme: 'tétraédrique',
    lewis: L([[0, 0], [-40, 0], [40, 0], [0, -38], [0, 38]], [[], [], [], [], []]),
    cram: { c: [0, 0], liens: [{ s: 'H', x: -30, y: -50, st: 'plan' }, { s: 'H', x: -30, y: 50, st: 'plan' }, { s: 'H', x: 52, y: -34, st: 'arriere' }, { s: 'H', x: 52, y: 34, st: 'avant' }] } }),
  polyatomique({ id: 'H3O+', nom: 'ion oxonium', f: 'H₃O⁺', centre: 'O', ligands: [['H', 0.98, 1], ['H', 0.98, 1], ['H', 0.98, 1]], n: 3, m: 1, theta: 110, charge: 1, forme: 'pyramidale',
    lewis: L([[0, -4], [-40, -4], [40, -4], [0, 36]], [[90], [], [], []], { charge: { i: 0, t: '+' } }),
    cram: { c: [0, 0], liens: [{ s: 'H', x: 0, y: -52, st: 'plan' }, { s: 'H', x: -52, y: 34, st: 'avant' }, { s: 'H', x: 52, y: 34, st: 'arriere' }] } }),
  polyatomique({ id: 'NH4+', nom: 'ion ammonium', f: 'NH₄⁺', centre: 'N', ligands: [['H', 1.03, 1], ['H', 1.03, 1], ['H', 1.03, 1], ['H', 1.03, 1]], n: 4, m: 0, charge: 1, forme: 'tétraédrique',
    lewis: L([[0, 0], [-40, 0], [40, 0], [0, -38], [0, 38]], [[], [], [], [], []], { charge: { i: 0, t: '+' } }),
    cram: { c: [0, 0], liens: [{ s: 'H', x: -30, y: -50, st: 'plan' }, { s: 'H', x: -30, y: 50, st: 'plan' }, { s: 'H', x: 52, y: -34, st: 'arriere' }, { s: 'H', x: 52, y: 34, st: 'avant' }] } }),
  // ---- au-delà du programme : mêmes raisonnements, seulement en défi et en exploration ----
  polyatomique({ id: 'CCl4', nom: 'tétrachlorométhane', f: 'CCl₄', centre: 'C', ligands: [['Cl', 1.77, 1, 3], ['Cl', 1.77, 1, 3], ['Cl', 1.77, 1, 3], ['Cl', 1.77, 1, 3]], n: 4, m: 0, forme: 'tétraédrique', programme: false,
    lewis: L([[0, 0], [-46, 0], [46, 0], [0, -44], [0, 44]], [[], [90, 270, 180], [90, 270, 0], [180, 0, 90], [180, 0, 270]]),
    cram: { c: [0, 0], liens: [{ s: 'Cl', x: -30, y: -50, st: 'plan' }, { s: 'Cl', x: -30, y: 50, st: 'plan' }, { s: 'Cl', x: 52, y: -34, st: 'arriere' }, { s: 'Cl', x: 52, y: 34, st: 'avant' }] } }),
  polyatomique({ id: 'CH3Cl', nom: 'chlorométhane', f: 'CH₃Cl', centre: 'C', ligands: [['H', 1.09, 1], ['H', 1.09, 1], ['H', 1.09, 1], ['Cl', 1.78, 1, 3]], n: 4, m: 0, forme: 'tétraédrique', programme: false,
    lewis: L([[0, 0], [-40, 0], [0, -38], [0, 38], [46, 0]], [[], [], [], [], [90, 270, 0]]),
    cram: { c: [0, 0], liens: [{ s: 'H', x: -30, y: -50, st: 'plan' }, { s: 'H', x: -30, y: 50, st: 'plan' }, { s: 'H', x: 52, y: -34, st: 'arriere' }, { s: 'Cl', x: 52, y: 34, st: 'avant' }] } }),
  polyatomique({ id: 'CH2O', nom: 'méthanal', f: 'CH₂O', centre: 'C', ligands: [['O', 1.21, 2, 2], ['H', 1.10, 1], ['H', 1.10, 1]], n: 3, m: 0, forme: 'trigonale plane', programme: false,
    lewis: L([[0, 0], [0, -48], [-42, 0], [42, 0]], [[], [0, 180], [], []]),
    cram: { c: [0, 0], liens: [{ s: 'O', x: 0, y: -56, st: 'plan', o: 2 }, { s: 'H', x: -48, y: 32, st: 'plan' }, { s: 'H', x: 48, y: 32, st: 'plan' }] } }),
  polyatomique({ id: 'HCN', nom: 'cyanure d’hydrogène', f: 'HCN', centre: 'C', ligands: [['H', 1.06, 1], ['N', 1.16, 3, 1]], n: 2, m: 0, forme: 'linéaire', programme: false,
    lewis: L([[0, 0], [-44, 0], [48, 0]], [[], [], [0]]),
    cram: { c: [0, 0], liens: [{ s: 'H', x: -56, y: 0, st: 'plan' }, { s: 'N', x: 62, y: 0, st: 'plan', o: 3 }] } }),
];
export const entite = id => ENTITES.find(e => e.id === id);

/** Notation VSEPR AXₙEₘ (chiffres en indices) d'une entité à atome central. */
const IND = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄' };
export const notationAXE = e => (e.centre == null ? null : `AX${IND[e.n]}E${IND[e.m]}`);
export const FORMES = ['linéaire', 'coudée', 'trigonale plane', 'pyramidale', 'tétraédrique'];
/** Forme déduite de (n, m) : la règle du cours, indépendante des tables ci-dessus. */
export function formeDe(n, m) {
  if (n + m === 2) return 'linéaire';
  if (n + m === 3) return m === 0 ? 'trigonale plane' : 'coudée';
  if (n + m === 4) return m === 0 ? 'tétraédrique' : m === 1 ? 'pyramidale' : 'coudée';
  return null;
}
export const arrangement = nm => (nm === 2 ? 'digonal' : nm === 3 ? 'trigonal' : 'tétragonal');

/** Angle X–A–X (degrés) entre les deux premiers atomes liés à l'atome central, calculé sur les coordonnées. */
export function angleXAX(e) {
  if (e.centre == null) return 180;
  const c = e.atomes[e.centre].p, voisins = e.liaisons.map(([i, j]) => (i === e.centre ? j : i));
  return angleDeg(sub(e.atomes[voisins[0]].p, c), sub(e.atomes[voisins[1]].p, c));
}

// ---------- liaisons, charges partielles, barycentres, polarité ----------
export function liaisonsInfo(e) {
  return e.liaisons.map(([i, j, o]) => {
    const a = e.atomes[i].s, b = e.atomes[j].s, d = deltaChi(a, b), t = typeLiaison(d);
    let plus = null, moins = null;
    if (t !== 'non') { if (CHI[a] < CHI[b]) { plus = i; moins = j; } else { plus = j; moins = i; } }
    return { i, j, o, a, b, d, t, plus, moins };
  });
}
const moyenne = pts => pts.reduce((s, p) => add(s, p), [0, 0, 0]).map(x => x / pts.length);
/** Barycentres G⁺ et G⁻ : chaque liaison polarisée apporte une charge +δ (atome moins électronégatif) et une charge −δ (atome plus électronégatif). */
export function polarite(e) {
  const L = liaisonsInfo(e), pol = L.filter(l => l.t !== 'non');
  const res = { liaisons: L, nPolarisees: pol.length, Gplus: null, Gmoins: null, moment: [0, 0, 0], norme: 0, polaire: false, raison: '', neutre: e.charge === 0 };
  if (!res.neutre) { res.polaire = null; res.raison = 'entité chargée : on parle de polarité pour une molécule neutre'; return res; }
  if (!pol.length) { res.raison = 'aucune liaison polarisée : pas de charges partielles'; return res; }
  res.Gplus = moyenne(pol.map(l => e.atomes[l.plus].p));
  res.Gmoins = moyenne(pol.map(l => e.atomes[l.moins].p));
  res.moment = sub(res.Gplus, res.Gmoins);
  res.norme = norm(res.moment);
  res.polaire = res.norme > 1e-6;
  res.raison = res.polaire ? 'G⁺ et G⁻ sont distincts' : 'G⁺ et G⁻ sont confondus';
  return res;
}
/** Charges partielles par atome : −1 par liaison où l'atome est le plus électronégatif, +1 là où il l'est le moins (comptage de liaisons). */
export function chargesPartielles(e) {
  const q = e.atomes.map(() => 0);
  liaisonsInfo(e).forEach(l => { if (l.t !== 'non') { q[l.plus] += 1; q[l.moins] -= 1; } });
  return q;
}

// ---------- molécule fictive AX₂ à angle variable (exploration : expérience de pensée) ----------
export const PAIRES_AX2 = [
  { id: 'OH', A: 'O', X: 'H', ordre: 1, d: 0.96, nom: 'liaisons O–H (comme dans H₂O)', reel: 104.5 },
  { id: 'CO', A: 'C', X: 'O', ordre: 2, d: 1.16, nom: 'liaisons C=O (comme dans CO₂)', reel: 180 },
  { id: 'CH', A: 'C', X: 'H', ordre: 1, d: 1.09, nom: 'liaisons C–H (comme dans CH₄)', reel: 109.5 },
];
export function moleculeAX2(paire, angle) {
  const h = angle / 2 * RAD, p = [Math.sin(h) * paire.d, -Math.cos(h) * paire.d, 0], q = [-p[0], p[1], 0];
  return { id: `AX2-${paire.id}`, nom: 'AX₂ fictive', f: 'AX₂', atomes: [{ s: paire.A, p: [0, 0, 0], lp: 0 }, { s: paire.X, p, lp: 0 }, { s: paire.X, p: q, lp: 0 }],
    liaisons: [[0, 1, paire.ordre], [0, 2, paire.ordre]], centre: 0, charge: 0, n: 2, m: 0, nonLiants: [], forme: null, programme: true };
}

// ---------- répulsion de N doublets sur une sphère (descente de gradient) ----------
/** Place n points sur la sphère unité à partir de points de départ et les laisse se repousser (force de Coulomb) ; renvoie la configuration d'équilibre. */
export function relaxer(depart, iterations = 400, pas = 0.05) {
  let pts = depart.map(unit);
  for (let it = 0; it < iterations; it++) {
    pts = pts.map((p, i) => {
      let f = [0, 0, 0];
      pts.forEach((q, j) => { if (j !== i) { const d = sub(p, q), r = Math.max(norm(d), 1e-6); f = add(f, mul(d, 1 / (r * r * r))); } });
      const tang = sub(f, mul(p, dot(f, p)));          // composante tangente à la sphère
      return unit(add(p, mul(tang, pas)));
    });
  }
  return pts;
}
/** Un pas de relaxation (pour l'animation). */
export const anglesDeux = pts => { const a = []; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) a.push(angleDeg(pts[i], pts[j])); return a; };
/** Points de départ « désordonnés » (reproductibles) pour n doublets. */
export function departDesordre(n) {
  const bases = { 2: [[1, 0.2, 0.1], [0.8, 0.9, 0.2]], 3: [[1, 0.1, 0.1], [0.5, 0.9, 0.3], [0.3, 0.5, 1]], 4: [[1, 0.1, 0.1], [0.7, 0.8, 0.2], [0.4, 0.6, 0.8], [0.2, 0.1, 1]] };
  return bases[n].map(unit);
}
