// ====================================================
//  Modèle de la simulation 176 : particule chargée dans un condensateur plan (TG spé PC, « Mouvement dans un champ uniforme »).
//  Hypothèses : champ électrique uniforme entre les plaques (effets de bord ignorés), vide, particule non relativiste,
//  poids négligé (rapport F/P calculé), référentiel du laboratoire galiléen. Particule entrant en O, au milieu de l'intervalle,
//  avec vec(v0) perpendiculaire aux lignes de champ.
//  Axes : Ox le long des plaques (sens de vec(v0)), Oy perpendiculaire aux plaques, orienté vers le HAUT. U = V(plaque du haut) − V(plaque du bas).
//  Les composantes sont algébriques. Constantes : e = 1,60×10⁻¹⁹ C ; m_e = 9,11×10⁻³¹ kg ; m_p = 1,67×10⁻²⁷ kg ; 1 u = 1,66×10⁻²⁷ kg ; g = 9,8 m/s² ; c = 3,00×10⁸ m/s.
// ====================================================
export const E_CH = 1.60e-19, G = 9.8, C_LUM = 3.00e8, L_PLAQUES = 0.060;
export const PARTICULES = {
  electron: { nom: 'Électron', symbole: 'e⁻', z: -1, m: 9.11e-31, v0: [1.0e7, 2.0e7, 3.0e7] },
  proton: { nom: 'Proton', symbole: 'p⁺', z: 1, m: 1.67e-27, v0: [2.0e5, 5.0e5, 1.0e6] },
  sodium: { nom: 'Ion sodium Na⁺', symbole: 'Na⁺', z: 1, m: 23 * 1.66e-27, v0: [5.0e4, 1.0e5, 2.0e5] },
  calcium: { nom: 'Ion calcium Ca²⁺', symbole: 'Ca²⁺', z: 2, m: 40 * 1.66e-27, v0: [5.0e4, 1.0e5, 2.0e5] },
};
export const TENSIONS = [100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];
export const DISTANCES = [1.0, 1.5, 2.0];               // d en cm (toujours petit devant L = 6,0 cm : l'hypothèse « effets de bord ignorés » reste raisonnable)
export const charge = p => PARTICULES[p].z * E_CH;       // charge algébrique q (C)

// ---------- champ ----------
export const normeE = (U, d) => Math.abs(U) / d;                  // E = |U| / d, d en m (V/m)
export const composanteEy = (U, d) => -U / d;                     // vec(E) va de la plaque + vers la plaque − : si la plaque du haut est +, E_y < 0
export const forceY = (p, U, d) => charge(p) * composanteEy(U, d);   // F_y = q E_y
export const normeF = (p, U, d) => Math.abs(charge(p)) * normeE(U, d);
export const poids = p => PARTICULES[p].m * G;
export const rapportFP = (p, U, d) => normeF(p, U, d) / poids(p);
// ---------- mouvement (poids négligé) ----------
export const accY = (p, U, d) => forceY(p, U, d) / PARTICULES[p].m;        // a_y = q E_y / m, constante
// y(x) = a_y x² / (2 v0²) ; sortie si |y_S| < d/2 ; sinon choc contre la plaque en x_c
export const deviation = (p, U, d, v0, L = L_PLAQUES) => accY(p, U, d) * L * L / (2 * v0 * v0);   // y_S (m), signée
export const k2 = (p, U, d, v0) => accY(p, U, d) / (2 * v0 * v0);                                 // y = k2 x² (m⁻¹)
export function trajet(p, U, d, v0, L = L_PLAQUES) {
  const a = accY(p, U, d), yS = a * L * L / (2 * v0 * v0), demi = d / 2, sort = Math.abs(yS) < demi;
  const xc = a === 0 ? Infinity : v0 * Math.sqrt(d / Math.abs(a)), xFin = sort ? L : xc;
  const tFin = xFin / v0;
  return { a, yS, sort, xc, xFin, tFin, vy: a * tFin, v: Math.hypot(v0, a * tFin) };
}
// tension maximale pour que la particule sorte : |y_S| = d/2  =>  U_max = m d² v0² / (|q| L²)  (d en m)
export const Umax = (p, d, v0, L = L_PLAQUES) => PARTICULES[p].m * d * d * v0 * v0 / (Math.abs(charge(p)) * L * L);
// tension qui donne la déviation yS cherchée (y_S ∝ U)  : U = 2 m d v0² |yS| / (|q| L²)
export const Upour = (p, d, v0, yS, L = L_PLAQUES) => 2 * PARTICULES[p].m * d * v0 * v0 * Math.abs(yS) / (Math.abs(charge(p)) * L * L);
// vitesse initiale déduite de la déviation observée
export const v0depuis = (p, U, d, yS, L = L_PLAQUES) => Math.sqrt(Math.abs(charge(p)) * Math.abs(U) * L * L / (2 * PARTICULES[p].m * d * Math.abs(yS)));
// ---------- énergie ----------
export const vApresAcc = (p, U) => Math.sqrt(2 * Math.abs(charge(p)) * Math.abs(U) / PARTICULES[p].m);   // ½ m v² = |q| U, départ au repos
// modèle non relativiste : on teste la vitesse d'ENTRÉE v0 (la seule choisie) ; 10 % de c est la limite du modèle (erreur de l'ordre de 1 % sur l'énergie cinétique)
export const nonRelativiste = v => v <= 0.1 * C_LUM + 1;
export const limiteRelativiste = v => v >= 0.1 * C_LUM * 0.999;
// gain d'énergie cinétique entre l'entrée et la sortie : ΔEc = W(F) = |q| E |y_S| (F constante, perpendiculaire à Ox : seul le déplacement selon Oy travaille)
export const gainEc = (p, U, d, v0, L = L_PLAQUES) => Math.abs(charge(p)) * normeE(U, d) * Math.abs(deviation(p, U, d, v0, L));
// ---------- tirages des défis ----------
const tire = (t, rnd) => t[Math.floor(rnd() * t.length)];
const arr = (x, k) => Number(Number(x).toFixed(k));
export const sig = (x, k) => Number(Number(x).toPrecision(k));
// Défi 1 : régler U (pas de 5 V) pour que la particule sorte en y_c. La cible est la déviation obtenue pour une tension cachée U*, arrondie au dixième de mm.
export function tirageCible(rnd = Math.random) {
  for (let essai = 0; essai < 500; essai++) {
    const p = tire(['electron', 'proton', 'sodium', 'calcium'], rnd), d = tire(DISTANCES, rnd), v0 = tire(PARTICULES[p].v0, rnd);
    const Us = 5 * Math.round((100 + rnd() * 500) / 5);               // 100 à 600 V
    const yS = deviation(p, Us, d / 100, v0) * 1000;                       // mm, signée (plaque du haut +)
    const yc = arr(Math.abs(yS), 1), demi = d * 10 / 2;
    if (yc < 2.5 || yc > Math.min(0.65 * demi, demi - 2.3)) continue;   // la cible (rayon 6 px) ne touche ni la plaque ni l'axe
    return { type: 'cible', p, d, v0, Us, yc, signe: Math.sign(yS) };
  }
  throw new Error('tirage cible impossible');
}
// Défi 2 : retrouver v0 à partir de la déviation mesurée (2 chiffres significatifs, valeur arrondie AVANT le calcul de la réponse)
export function tirageVitesse(rnd = Math.random) {
  for (let essai = 0; essai < 500; essai++) {
    const p = tire(['electron', 'proton', 'sodium'], rnd), d = tire(DISTANCES, rnd), v0 = tire(PARTICULES[p].v0, rnd), U = tire([100, 200, 300, 400, 500], rnd);
    const yS = deviation(p, U, d / 100, v0) * 1000, ya = sig(Math.abs(yS), 2);
    if (ya < 1.0 || ya > 0.85 * d * 10 / 2) continue;
    return { type: 'vitesse', p, d, U, ya, vrai: v0depuis(p, U, d / 100, ya / 1000), v0 };
  }
  throw new Error('tirage vitesse impossible');
}
// pire écart relatif d'un élève qui arrondit ses résultats intermédiaires à k chiffres significatifs (k = 2 ou 3) avec e = 1,6 ou 1,60
export function pireEcartVitesse(d) {
  let pire = 0; const m = PARTICULES[d.p].m, q = Math.abs(PARTICULES[d.p].z);
  for (const e of [1.6e-19, 1.60e-19, 1.602e-19]) for (const k of [2, 3]) {
    const a = sig(q * e * (d.U / (d.d / 100)) / m, k), v = Math.sqrt(a * L_PLAQUES * L_PLAQUES / (2 * d.ya / 1000));
    pire = Math.max(pire, Math.abs(sig(v, k) - d.vrai) / d.vrai);
  }
  return pire;
}
