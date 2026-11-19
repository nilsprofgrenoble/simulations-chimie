// Modèle de la sim 151 — ONDES MÉCANIQUES PÉRIODIQUES (1G) : double périodicité, λ = c·T.
// Onde progressive sinusoïdale, transversale, le long d'une corde (modèle idéal) :
//   y(x, t) = A · sin( 2π · ( t/T − x/λ ) )      x en cm (distance à la source S), t en s, y en cm, λ = c·T.
// Hypothèses : onde déjà établie sur toute la longueur observée (on ne regarde pas l'arrivée du début de l'onde), pas d'amortissement,
// célérité c imposée par le milieu (tension de la corde) et indépendante de T et de A, source qui impose T (donc f) et A.
export const X_MAX = 100;            // cm : longueur de corde observée
export const T_FEN = 1.6;            // s : durée de l'enregistrement y(t)
export const Y_MAX = 3.5;            // cm : demi-hauteur des graphiques
export const T_MIN = 0.2, T_MAX = 1.0, T_PAS = 0.05;
export const A_MIN = 0.5, A_MAX = 3.0, A_PAS = 0.5;
// Milieux : même corde, tension croissante ⇒ célérité croissante (c = √(F/μ), mais la relation n'est pas utilisée en 1G)
export const MILIEUX = [
  { id: 'peu', nom: 'peu tendue', c: 30 },
  { id: 'moy', nom: 'moyennement tendue', c: 40 },
  { id: 'tend', nom: 'tendue', c: 50 },
  { id: 'tres', nom: 'très tendue', c: 60 },
];
export const lambda = (c, T) => c * T;              // cm
export const frequence = T => 1 / T;                // Hz
export const y = (x, t, { A, T, c }) => A * Math.sin(2 * Math.PI * (t / T - x / lambda(c, T)));
// Positions des crêtes (y = +A) à l'instant t, sur [0 ; X_MAX]
export function cretes(t, { T, c }) {
  const L = lambda(c, T), r = [];
  for (let k = -3; k < 400; k++) { const x = L * (t / T - 0.25 - k); if (x >= -1e-9 && x <= X_MAX + 1e-9) r.push(x); if (x < 0) break; }
  return r.sort((a, b) => a - b);
}
// Instants des maxima de y(t) au point x, dans [0 ; T_FEN]
export function maxima(x, { T, c }) {
  const L = lambda(c, T), r = [];
  for (let k = -1; k < 100; k++) { const t = T * (0.25 + x / L + k); if (t >= -1e-9 && t <= T_FEN + 1e-9) r.push(t); if (t > T_FEN) break; }
  return r;
}
// Deux points distants de d vibrent-ils en phase (d multiple de λ), en opposition (d = λ/2 + kλ) ou décalage quelconque ?
// Tolérance de 0,04 en nombre de longueurs d'onde (soit 4 % de λ : 0,8 cm pour λ = 20 cm).
export function etatPhase(d, L, tol = 0.04) {
  const r = Math.abs(d) / L, p = Math.abs(r - Math.round(r)), o = Math.abs(r - Math.floor(r) - 0.5);
  if (Math.abs(d) < 1e-9) return 'confondus';
  if (p <= tol) return Math.round(r) === 0 ? 'quasi' : 'phase';   // distance petite mais non nulle : « quasi confondus »
  if (o <= tol) return 'opposition';
  return 'autre';
}
// Pour les étapes guidées : plus petit écart (en cm) entre d = |x2 − x1| et un multiple entier non nul de λ
export function ecartMultiple(d, L) { const k = Math.max(1, Math.round(Math.abs(d) / L)); return Math.abs(Math.abs(d) - k * L); }
// Tirages de défi : (T, c) avec λ = c·T entre 9 et 50 cm (au moins 2 longueurs d'onde visibles sur 100 cm)
export function tirages() {
  const r = [];
  for (const T of [0.3, 0.4, 0.5, 0.6, 0.8]) for (const m of MILIEUX) { const L = lambda(m.c, T); if (L >= 9 && L <= 50) r.push({ T, c: m.c, L }); }
  return r;
}
