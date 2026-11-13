// Modèle PUR de la simulation « Travail d'une force et énergie cinétique » (1G, chapitre 12, partie 1).
// Aucune dépendance à React : tout est testé par travailModele.test.mjs.
//
// Deux situations :
//   • le chariot tiré (travail d'une force constante : W = F·AB·cos θ), mouvement rectiligne horizontal, sans frottement ;
//   • le mobile sur un plan incliné (poids, réaction, frottement constant), avec deux barrières lumineuses E et F
//     comme dans l'activité expérimentale (vitesse = largeur de la languette / durée d'obturation).
// Unités SI partout (m, kg, s, N, J), angles en degrés à l'entrée.

export const G = 9.8;                                   // N/kg (valeur du programme et des autres simulations du site)
export const RAD = Math.PI / 180;

// ---------- énergie cinétique et travail ----------
export const ecin = (m, v) => 0.5 * m * v * v;
export const travailForce = (F, AB, thetaDeg) => F * AB * Math.cos(thetaDeg * RAD);   // force constante, déplacement rectiligne
export const travailPoids = (m, zA, zB) => m * G * (zA - zB);                          // ne dépend que de la différence d'altitude
export const travailFrottement = (f, longueur) => -f * longueur;                      // f d'intensité constante, opposée au mouvement, trajectoire rectiligne
export const vitesseDepuisEc = (m, Ec) => Math.sqrt(2 * Ec / m);

// ---------- chariot tiré par une force ----------
// État initial en A : vitesse vA. Une force constante F (norme), faisant l'angle θ avec le déplacement AB, agit sur tout le trajet.
// Le poids et la réaction du support sont perpendiculaires au déplacement : ils ne travaillent pas.
export function chariot({ m, F, theta, AB, vA }) {
  const W = travailForce(F, AB, theta);
  const EcA = ecin(m, vA), EcBbrut = EcA + W;
  const arrete = EcBbrut < 0;                           // la force résistante arrête le chariot avant B
  const EcB = arrete ? 0 : EcBbrut;
  const composante = F * Math.cos(theta * RAD);          // composante de F le long du déplacement
  const distArret = arrete && composante < 0 ? EcA / -composante : null;
  return { W, EcA, EcB, dEc: EcB - EcA, vB: vitesseDepuisEc(m, EcB), arrete, distArret };
}

// ---------- mobile sur un plan incliné ----------
// Lâché sans vitesse initiale en O, à la distance sE de la barrière E ; la barrière F est à la distance L de E (trajet EF = AB de l'activité).
// Frottement f constant, opposé au mouvement. Accélération constante a = g sin α − f/m (tant que le mobile descend).
export function plan({ m, alpha, L, sE, f = 0 }) {
  const sinA = Math.sin(alpha * RAD);
  const a = G * sinA - f / m;
  const descend = a > 1e-9;
  const sF = sE + L;
  const vE = descend ? Math.sqrt(2 * a * sE) : 0, vF = descend ? Math.sqrt(2 * a * sF) : 0;
  const h = L * sinA;                                   // dénivelé zE − zF entre les barrières
  const Wp = travailPoids(m, h, 0), Wf = travailFrottement(f, L);
  return { a, descend, vE, vF, h, Wp, Wf, Wr: 0, sommeW: Wp + Wf, EcE: ecin(m, vE), EcF: ecin(m, vF), dEc: ecin(m, vF) - ecin(m, vE) };
}

// Barrière lumineuse : une languette de largeur l (m) centrée sur la barrière coupe le faisceau pendant Δt.
// En mouvement uniformément accéléré depuis O, la languette parcourt [s − l/2 ; s + l/2] : l / Δt = (v₁ + v₂) / 2,
// moyenne des vitesses aux deux bords. C'est légèrement différent de la vitesse exacte au centre (écart très faible).
export function barriere({ a, s, l }) {
  if (!(a > 0) || s - l / 2 <= 0) return { dt: Infinity, vMes: 0, vVraie: 0 };
  const v1 = Math.sqrt(2 * a * (s - l / 2)), v2 = Math.sqrt(2 * a * (s + l / 2));
  const dt = (v2 - v1) / a;
  return { dt, vMes: l / dt, vVraie: Math.sqrt(2 * a * s) };
}

// Mesure complète du mobile sur le plan, telle que l'affiche la simulation : Δt aux deux barrières, vitesses, énergies cinétiques.
export function mesurePlan({ m, alpha, L, sE, f = 0, l = 0.01 }) {
  const p = plan({ m, alpha, L, sE, f });
  const bE = barriere({ a: p.a, s: sE, l }), bF = barriere({ a: p.a, s: sE + L, l });
  const EcE = ecin(m, bE.vMes), EcF = ecin(m, bF.vMes);
  return { ...p, dtE: bE.dt, dtF: bF.dt, vEmes: bE.vMes, vFmes: bF.vMes, EcEmes: EcE, EcFmes: EcF, dEcMes: EcF - EcE };
}

// Frottement déduit d'une mesure : ΔEc = W(P) + W(f) → f = (W(P) − ΔEc) / L
export const frottementDeduit = ({ m, alpha, L, dEc }) => (travailPoids(m, L * Math.sin(alpha * RAD), 0) - dEc) / L;
