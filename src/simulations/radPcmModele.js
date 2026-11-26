// ====================================================
//  Modèle de la simulation 309 « Radioactivité : désintégrations, loi de décroissance et activité » (TSTL, enseignement PCM, séquence 6).
//  Réutilise SANS les modifier : rdaModele.js (liste de noyaux réels et lois de conservation, sim 184 TG) et radioactiviteModele.js (tirages au hasard, sim 123 TG).
//  Hypothèses de travail (rappelées dans la simulation) : noyaux identiques et indépendants (probabilité λ dt de se désintégrer pendant dt, quel que soit l'âge) ;
//  N grand pour que la valeur moyenne décrive l'échantillon ; noyaux fils non radioactifs dans la fenêtre étudiée ; compteur idéal (il compte toutes les désintégrations).
//  Conventions : α = ⁴₂He ; β⁻ = électron ⁰₋₁e ; β⁺ = positon ⁰₊₁e ; (anti)neutrino écrit dans les corrigés seulement ; γ = photon, sans changement de A ni de Z.
//  Unités : N en noyaux ; t en heures (échantillons) ; λ en h⁻¹ ou s⁻¹ ; activité en Bq (= s⁻¹).
// ====================================================
import * as R from './rdaModele.js';
import { prng, instantsDeces, restantsA } from './radioactiviteModele.js';
export { prng, instantsDeces, restantsA };

export const LN2 = Math.LN2;
export const lambdaDe = th => LN2 / th;                 // λ = ln 2 / t½ (même unité de temps)
export const thDe = l => LN2 / l;
export const Nt = (N0, l, t) => N0 * Math.exp(-l * t);   // loi de décroissance (valeur moyenne)
export const activite = (l_s, N) => l_s * N;             // A = λ N (λ en s⁻¹, A en Bq)
export const tempsPourFraction = (l, f) => Math.log(1 / f) / l;
export const HEURE_S = 3600;

// Pas d'Euler : N(k+1) = N(k) + ΔN, avec ΔN = −λ N Δt ; renvoie les points (t, N) jusqu'à T inclus.
export function escalier(N0, l, dt, T) {
  const pts = [{ t: 0, N: N0, dN: 0 }]; let N = N0;
  for (let k = 1; k * dt <= T + 1e-9; k++) { const dN = -l * N * dt; N += dN; pts.push({ t: k * dt, N, dN }); }
  return pts;
}

// ---------- noyaux réels pour les équations de désintégration (liste vérifiée de rdaModele.js, hors situations des documents du cours) ----------
const SELECTION = [[95, 146], [90, 142], [27, 33], [15, 17], [11, 13], [17, 19], [1, 2], [38, 52], [11, 11], [13, 13], [12, 11], [14, 13], [16, 15]];
export const NUCLEIDES = SELECTION.map(([Z, N]) => {
  const n = R.trouve(Z, N), f = R.filsDe(n);
  return { Z, N, A: Z + N, s: R.sym(Z), nom: R.nomEl(Z), mode: n[2], fils: { Z: f[0], A: f[0] + f[1], s: R.sym(f[0]), nom: R.nomEl(f[0]) } };
});
export const parMode = m => NUCLEIDES.filter(n => n.mode === m);
export const nucl = (s, A) => NUCLEIDES.find(n => n.s === s && n.A === A);
export const NOM_MODE = { a: 'α', 'b-': 'β⁻', 'b+': 'β⁺' };
export const PART = R.PARTICULES;
export const bilan = n => R.bilan({ A: n.A, Z: n.Z }, n.fils, n.mode);
export const equation = n => R.equationTexte({ A: n.A, Z: n.Z, s: n.s }, n.fils, n.mode);
export const noyau = (A, Z, s) => R.noyauTexte(A, Z, s);
export const typeDeA_Z = (dA, dZ) => R.typeDe({ A: 0, Z: 0 }, { A: dA, Z: dZ });   // null si incompatible

// ---------- exemples du parcours (noyaux fictifs R et S, valeurs inventées) ----------
export const PG = {
  lamR: 0.12,                    // h⁻¹ : constante de désintégration du noyau fictif R (t½ ≈ 5,8 h)
  N0R: 1.0e6, NR_euler: 8.0e5, dtEuler: 0.5, dNEuler: 0.12 * 8.0e5 * 0.5,     // ΔN = −λ N Δt
  thS: 8.0, lamS: LN2 / 8.0,      // noyau fictif S : t½ = 8,0 h
  fractionRest: 0.30, tRest: Math.log(1 / 0.30) / (LN2 / 8.0),
  N_S: 2.0e9, A_S: (LN2 / 8.0 / HEURE_S) * 2.0e9, A_S24: 4.8e4 / 8,   // activité à 24 h = 3 t½ à partir de A0 = 4,8 × 10⁴ Bq
  compte: 1440, dureeCompte: 60, A_compte: 1440 / 60,
  T0: 1200, T1: 730, tT: 10, lamT: Math.log(1200 / 730) / 10, thT: LN2 / (Math.log(1200 / 730) / 10),
};

// ---------- sources d'activité (ordres de grandeur arrondis, valeurs de culture générale) ----------
export const SOURCES = [
  { id: 'banane', nom: 'Une banane', A: 15, note: 'potassium naturel' },
  { id: 'eau', nom: '1 L d’eau de mer', A: 12, note: 'potassium naturel' },
  { id: 'granite', nom: '1 kg de granite', A: 1000, note: 'uranium, thorium, potassium' },
  { id: 'corps', nom: 'Un adulte', A: 8000, note: 'potassium, carbone naturels' },
  { id: 'fumee', nom: 'Un détecteur de fumée', A: 3e4, note: 'américium 241' },
  { id: 'radiotherapie', nom: 'Une source de radiothérapie', A: 1e14, note: 'source scellée de cobalt 60' },
];

// ---------- protection ----------
export const ECRANS = [['air', 'Quelques cm d’air ou une feuille de papier'], ['alu', 'Quelques mm d’aluminium'], ['plomb', 'Plomb épais (ou béton épais)']];
// niveau transmis : 'passe' (traverse), 'reduit' (fortement atténué, jamais nul), 'arrete'
export const TRANSMIS = {
  a: { air: 'arrete', alu: 'arrete', plomb: 'arrete' },
  b: { air: 'passe', alu: 'arrete', plomb: 'arrete' },
  g: { air: 'passe', alu: 'passe', plomb: 'reduit' },
};
export const NOM_RAYON = { a: 'rayonnement α', b: 'rayonnement β', g: 'rayonnement γ' };

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
// variante 'type' : père et fils donnés, l'élève identifie le type ; variante 'fils' : père et type donnés, l'élève donne A et Z du fils
export function tirageDefiEquation() {
  const n = tire(NUCLEIDES);
  return { nucl: n, variante: tire(['type', 'fils']), type: n.mode, A: n.fils.A, Z: n.fils.Z };
}
// Défi « comptage » : t½ tiré, activités mesurées arrondies à 3 chiffres avec un bruit de ±3 % ; instants multiples d'un pas ; l'élève trouve t½ puis une durée.
export function tirageDefiComptage() {
  const th = tire([3, 4, 5, 6, 8, 10, 12]), A0 = tire([2400, 3600, 4800, 6000, 7200, 9600]);
  const pm = Math.ceil(2.2 * th / 6), pas = tire([pm, pm + 1]), n = 7, l = LN2 / th;   // le dernier instant dépasse 2 t½
  const pts = []; for (let k = 0; k < n; k++) { const t = k * pas, bruit = 1 + (Math.random() * 2 - 1) * 0.03; pts.push({ t, A: Number((A0 * Math.exp(-l * t) * bruit).toPrecision(3)) }); }
  const seuil = tire([0.10, 0.05, 0.20]);
  return { th, A0, pas, pts, l, seuil, duree: Math.log(1 / seuil) / l };
}
export const tolDefi = { th: 0.10, duree: 0.15 };

// notation scientifique à la française : 1,5 × 10³ (exposant en caractères supérieurs)
export const fmtSci = (x, cs = 2) => { const [mm, e] = Number(x).toExponential(cs - 1).split('e'); return `${mm.replace('.', ',')} × 10${String(Number(e)).replace(/[0-9]/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).replace('-', '⁻')}`; };
