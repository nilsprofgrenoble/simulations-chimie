// ====================================================
//  Modèle de la simulation 168 : deuxième loi de Newton (TG spé PC).
//  Système modélisé par son centre de masse G (point matériel), référentiel supposé galiléen, forces constantes pendant l'étude, g = 9,8 m/s².
//  Axes : Ox horizontal vers la droite, Oy vertical vers le haut. Les composantes sont algébriques (signe = sens par rapport à l'axe).
//  Σ F = m a_G (vecteurs) ; a_G = Σ F / m (même direction, même sens que Σ F car m > 0).
// ====================================================

export const G = 9.8;
export const rad = d => d * Math.PI / 180;
export const sig = (x, k) => Number(Number(x).toPrecision(k));

// ---------- vecteurs {x, y} ----------
export const somme = fs => fs.reduce((s, f) => ({ x: s.x + f.x, y: s.y + f.y }), { x: 0, y: 0 });
export const norme = v => Math.hypot(v.x, v.y);
export const acceleration = (fs, m) => { const S = somme(fs); return { x: S.x / m, y: S.y / m }; };
export const quasiNul = (v, eps = 1e-9) => norme(v) < eps;
// Équilibre : somme des forces négligeable devant le poids (0,5 %) ; critère unique pour le bandeau, les mesures et le message de l'exploration
export const estEquilibre = (S, m) => norme(S) < 0.005 * m * G + 1e-9;

// ---------- bilans de forces (liste de { id, x, y } en newtons) ----------
// id : P poids, R réaction du support, T tension (fil, câble), f frottements (fluide ou rail)
// Chariot tiré par un fil incliné d'un angle alpha (en degrés) au-dessus de l'horizontale, frottements f opposés au mouvement (vers la droite).
export function forcesRail({ m, T, alpha = 0, f = 0 }) {
  const a = rad(alpha);
  return [{ id: 'P', x: 0, y: -m * G }, { id: 'R', x: 0, y: m * G - T * Math.sin(a) }, { id: 'T', x: T * Math.cos(a), y: T * Math.sin(a) }, { id: 'f', x: -f, y: 0 }];
}
// Masse suspendue à un fil, ou cabine d'ascenseur au bout de son câble.
export const forcesFil = ({ m, T }) => [{ id: 'P', x: 0, y: -m * G }, { id: 'T', x: 0, y: T }];
// Parachutiste (ou bille dans un fluide) : poids et frottement de l'air (ou du fluide), verticaux.
export const forcesChute = ({ m, f }) => [{ id: 'P', x: 0, y: -m * G }, { id: 'f', x: 0, y: f }];

// ---------- sens inverse : le mouvement est connu (accélération a), on cherche la force inconnue ----------
export const railDepuisA = ({ m, alpha = 0, f = 0, ax }) => (m * ax + f) / Math.cos(rad(alpha));  // tension T
export const filDepuisA = ({ m, ay }) => m * (G + ay);                                              // tension T
export const chuteDepuisA = ({ m, ay }) => m * (G + ay);                                            // frottement f
export const accDepuisVitesses = (v1, v2, dt) => (v2 - v1) / dt;                                    // composante a = Δv / Δt

export const SCEN = {
  rail: { nom: 'Chariot tiré sur un rail', axe: 'x' },
  fil: { nom: 'Masse accrochée à un fil', axe: 'y' },
  cabine: { nom: 'Cabine d’ascenseur', axe: 'y' },
  chute: { nom: 'Parachutiste', axe: 'y' },
};
// Calcule le bilan complet d'une situation d'exploration.
export function bilan(sc, p) {
  const forces = sc === 'rail' ? forcesRail(p) : sc === 'chute' ? forcesChute(p) : forcesFil(p);
  const S = somme(forces), a = { x: S.x / p.m, y: S.y / p.m };
  return { forces, S, a };
}

// ---------- tirages des défis ----------
const tire = (t, rnd) => t[Math.floor(rnd() * t.length)];
const arr = (x, d) => Number(Number(x).toFixed(d));
// Défi 1 : forces connues → composante de l'accélération du centre de masse (chariot incliné, masse suspendue, cabine)
export function tirageDefiAcc(rnd = Math.random) {
  for (let essai = 0; essai < 200; essai++) {
    const type = tire(['rail', 'fil', 'cabine'], rnd);
    if (type === 'rail') {
      const m = tire([1.5, 2.0, 2.5, 3.0, 4.0], rnd), alpha = tire([0, 20, 30], rnd), f = tire([0, 1.0, 1.5, 2.0, 2.5], rnd), T = tire([3, 3.5, 4, 5, 6, 6.5, 7, 8, 9, 10, 11, 12], rnd);
      const F = forcesRail({ m, T, alpha, f }), S = somme(F), R = F[1].y;
      if (R < 0.5 || Math.abs(S.x) < 0.8 || Math.abs(S.x / m) < 0.4) continue;
      return { type, m, T, alpha, f, composante: 'x', S, vrai: S.x / m, forces: F };
    }
    if (type === 'fil') {
      const m = tire([0.30, 0.50, 0.80, 1.2, 2.0], rnd), ay = tire([-3, -2, -1.5, -1, 1, 1.5, 2, 3], rnd), T = arr(m * (G + ay), 1);
      const F = forcesFil({ m, T }), S = somme(F), vrai = S.y / m;
      if (Math.abs(vrai) < 0.5 || T < 0.5) continue;
      return { type, m, T, composante: 'y', S, vrai, forces: F };
    }
    const m = tire([600, 800, 1000, 1200], rnd), ay = tire([-1.2, -0.8, -0.5, 0.5, 0.8, 1.2], rnd), T = Math.round(m * (G + ay) / 10) * 10;
    const F = forcesFil({ m, T }), S = somme(F), vrai = S.y / m;
    if (Math.abs(vrai) < 0.4) continue;
    return { type: 'cabine', m, T, composante: 'y', S, vrai, forces: F };
  }
  throw new Error('tirage défi 1 impossible');
}
// Défi 2 : mouvement connu (vitesses à deux dates) → force inconnue (tension du câble de la cabine, tension du fil du chariot)
export function tirageDefiForces(rnd = Math.random) {
  if (rnd() < 0.5) {
    const m = tire([600, 800, 1000, 1200], rnd), phase = tire(['demarrage', 'freinage'], rnd), dt = tire([2.0, 2.5, 3.0, 4.0], rnd);
    const v1 = phase === 'demarrage' ? 0 : tire([1.5, 2.0, 2.5], rnd), v2 = phase === 'demarrage' ? tire([1.0, 1.2, 1.5, 2.0], rnd) : 0;
    const a = accDepuisVitesses(v1, v2, dt);
    return { type: 'cabine', phase, m, v1, v2, dt, a, vrai: m * (G + a), unite: 'N' };
  }
  const m = tire([1.0, 1.5, 2.0, 3.0], rnd), f = tire([1.0, 1.5, 2.0, 2.5], rnd), v1 = tire([0.50, 1.0, 1.5], rnd), dv = tire([0.8, 1.0, 1.5, 2.0], rnd), dt = tire([1.0, 2.0, 2.5, 4.0], rnd), v2 = arr(v1 + dv, 2);
  const a = accDepuisVitesses(v1, v2, dt);
  return { type: 'rail', m, f, v1, v2, dt, a, vrai: m * a + f, unite: 'N' };
}
// Écart relatif le plus défavorable d'un élève qui garde 4 chiffres significatifs dans ses calculs intermédiaires (consigne donnée dans l'indice : la différence T − P annule
// presque les deux termes, arrondir P à 2 chiffres fausserait tout), utilise g = 9,8 ou 9,81, puis arrondit le résultat final à 2 chiffres significatifs
export function pireEcartDefi1(d) {
  let pire = 0;
  for (const g of [9.8, 9.81]) for (const k of [4, 5]) {
    let S;
    if (d.type === 'rail') S = sig(d.T * Math.cos(rad(d.alpha)), k) - d.f; else S = d.T - sig(d.m * g, k);
    const a = sig(sig(S, k) / d.m, k);
    pire = Math.max(pire, Math.abs(a - d.vrai) / Math.abs(d.vrai));
  }
  pire = Math.max(pire, Math.abs(sig(d.vrai, 2) - d.vrai) / Math.abs(d.vrai));
  return pire;
}
export function pireEcartDefi2(d) {
  let pire = 0;
  for (const g of [9.8, 9.81]) for (const k of [2, 3]) {
    const a = sig((d.v2 - d.v1) / d.dt, k);
    const T = d.type === 'cabine' ? sig(d.m * g, k) + sig(d.m * a, k) : sig(d.m * a, k) + d.f;
    pire = Math.max(pire, Math.abs(T - d.vrai) / d.vrai);
  }
  pire = Math.max(pire, Math.abs(sig(d.vrai, 2) - d.vrai) / d.vrai);
  return pire;
}
