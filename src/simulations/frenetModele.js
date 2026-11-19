// ====================================================
//  Modèle de la simulation 167 : mouvement circulaire et repère de Frenet (TG spé PC, « Décrire un mouvement »).
//  Point matériel M en mouvement PLAN, sur un cercle de rayon constant R, dans le sens trigonométrique.
//  Repère de Frenet en M : (u_t) tangent à la trajectoire dans le sens du mouvement, (u_n) normal, dirigé vers le centre du cercle.
//  Expressions citées par le programme (non établies ici) :
//    vitesse       v = v × u_t                      (coordonnées : v ; 0)
//    accélération  a = (dv/dt) × u_t + (v²/R) × u_n (coordonnées : a_t = dv/dt ; a_n = v²/R)
//  Ici v est la « valeur algébrique » de la vitesse sur u_t : v ≥ 0 (le point avance dans le sens de u_t) ; dv/dt peut être positif, nul ou négatif.
//  Unités : m, s, m/s, m/s².
// ====================================================

export const R_MENU = [1.5, 2.0, 2.5, 3.0, 4.0, 5.0];     // rayons proposés en exploration (m)
export const V_MAX = 4.0;                                        // vitesse maximale en exploration (m/s) : a_n ≤ 16/1,0 reste lisible sur la scène
export const AT_MAX = 4.0;                                       // |dv/dt| maximal en exploration (m/s²)
export const PAS_V = 0.05;                                       // pas du curseur de vitesse (m/s) : défi 1 réalisable à moins de 5 % près

/** Coordonnée normale de l'accélération (centripète) : a_n = v² / R. */
export const an = (v, R) => (v * v) / R;
/** Coordonnées de la vitesse dans (u_t, u_n). */
export const coordVitesse = v => [v, 0];
/** Coordonnées de l'accélération dans (u_t, u_n) : [dv/dt ; v²/R]. */
export const coordAcc = (v, R, at) => [at, an(v, R)];
/** Norme de l'accélération : racine de a_t² + a_n². */
export const normeAcc = (v, R, at) => Math.hypot(at, an(v, R));
/** Angle (en degrés) entre le vecteur accélération et la normale u_n (vers le centre) ; positif = penché vers l'avant (dans le sens de u_t). */
export const angleAcc = (v, R, at) => (Math.atan2(at, an(v, R)) * 180) / Math.PI;
/** Nature du mouvement selon dv/dt (tolérance numérique 1e-9). */
export const nature = at => (Math.abs(at) < 1e-9 ? 'uniforme' : at > 0 ? 'accéléré' : 'ralenti');
/** Vitesse angulaire (rad/s) : v / R. */
export const omega = (v, R) => v / R;

/** Position, repère de Frenet et vecteurs en coordonnées du plan (x, y), orientés comme dans un repère mathématique usuel (y vers le haut).
 *  θ en radians, sens trigonométrique ; O est le centre du cercle. */
export function repere(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return { M: [c, s], ut: [-s, c], un: [-c, -s] };
}
/** Vecteur vitesse v = v × u_t, en coordonnées du plan (unité : m/s, rapportées au rayon unité pour la position). */
export function vecteurVitesse(theta, v) { const { ut } = repere(theta); return [v * ut[0], v * ut[1]]; }
/** Vecteur accélération en coordonnées du plan : a = a_t × u_t + a_n × u_n. */
export function vecteurAcc(theta, v, R, at) { const { ut, un } = repere(theta); const n = an(v, R); return [at * ut[0] + n * un[0], at * ut[1] + n * un[1]]; }

/** Avance d'un pas de temps dt (s) : θ augmente de v dt / R, v de (dv/dt) dt, sans jamais sortir de [0 ; vMax]. */
export function pas({ theta, v }, R, at, dt, vMax = V_MAX) {
  const v1 = Math.min(vMax, Math.max(0, v + at * dt));
  const vm = (v + v1) / 2;                                      // vitesse moyenne sur le pas (schéma du trapèze)
  return { theta: (theta + (vm * dt) / R) % (2 * Math.PI), v: v1 };
}

// ---------- défis (valeurs tirées au hasard, données arrondies AVANT de calculer la réponse) ----------
const tire = t => t[Math.floor(Math.random() * t.length)];

/** Défi 1 : régler la vitesse pour atteindre une accélération donnée. R et a_cible sont affichés ; v attendue = √(a × R). */
export function tirageDefiVitesse() {
  const R = tire([1.0, 1.5, 2.0, 2.5, 4.0]), aCible = tire([2.0, 3.0, 4.0, 5.0, 6.0, 8.0]);
  return { R, aCible, vAttendue: Math.sqrt(aCible * R) };
}
/** Juge un réglage de vitesse : l'accélération obtenue avec la vitesse affichée doit être à 5 % de la cible. */
export const defiVitesseReussi = (d, v) => Math.abs(an(v, d.R) - d.aCible) <= 0.05 * d.aCible;

/** Défi 2 : norme de l'accélération d'un mobile qui freine ou accélère dans un virage circulaire. v, R et dv/dt sont affichés (arrondis). */
export function tirageDefiNorme() {
  for (;;) {
    const R = tire([1.5, 2.0, 2.5, 4.0, 5.0, 8.0]), v = tire([2.0, 2.5, 3.0, 4.0, 5.0, 6.0]);
    const at = tire([-3.0, -2.0, -1.5, 1.5, 2.0, 3.0, 4.0]), aN = an(v, R), norme = normeAcc(v, R, at);
    // les erreurs classiques (somme des coordonnées, une seule coordonnée) doivent rester hors de la marge de 6 %
    const loin = x => Math.abs(x - norme) > 0.08 * norme;
    if (loin(Math.abs(at) + aN) && loin(aN) && loin(Math.abs(at))) return { R, v, at, aN, norme, sens: at > 0 ? 'accélère' : 'ralentit' };
  }
}
