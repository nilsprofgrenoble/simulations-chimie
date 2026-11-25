// Modèle de la simulation 232 : effet Joule dans un résistor et dans un câble (TSTL, PCM, Énergie).
// Hypothèses : courant continu, résistance constante (indépendante de la température), conversion intégrale de l'énergie électrique reçue en énergie thermique.
export const arrondiCS = (x, n = 2) => (x === 0 ? 0 : Number(Number(x).toPrecision(n)));
export const intensite = (U, R) => U / R;                // loi d'Ohm : I = U ÷ R
export const tension = (R, I) => R * I;                  // U = R × I
export const puissanceUI = (U, I) => U * I;              // P = U × I
export const puissanceJoule = (R, I) => R * I * I;       // P = R × I²
export const puissanceUR = (U, R) => U * U / R;          // P = U² ÷ R
export const energieJ = (P, dtS) => P * dtS;             // W = P × Δt
export const energieWh = (P, dtH) => P * dtH;
export const pertesCable = (r, I) => r * I * I;          // pertes en ligne : r × I²
export const intensiteAppareil = (P, U) => P / U;        // I = P ÷ U

export const PARCOURS = { U: 12, R: 24, dtMin: 10, R2: 10, I2: 1.5, r: 0.5, Ic: 8.0 };
export const RESISTANCES = [5, 10, 24, 50, 100];          // Ω, valeurs inventées
export const TENSIONS = [6, 12, 24, 48];                  // V

const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi A : résistor chauffant sous tension (I, P, énergie thermique)
export function tirageDefiA() {
  const R = tire([10, 15, 20, 30]), U = tire([6, 12, 24]), dtMin = tire([2, 5, 10, 15]);
  const I = U / R, P = U * U / R, W = P * dtMin * 60;
  return { type: 'resistor', R, U, dtMin, I, P, W };
}
// Défi B : pertes dans un câble d'alimentation
export function tirageDefiB() {
  const r = tire([0.2, 0.5]), U = tire([24, 48]), P = tire([60, 120, 240]);
  const I = P / U, pertes = r * I * I, part = 100 * pertes / P;
  return { type: 'cable', r, U, P, I, pertes, part };
}
