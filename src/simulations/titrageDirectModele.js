// Modèle du titrage direct du diiode (Lugol) par le thiosulfate : fonctions pures, sans React.
// Hypothèses : réaction 2 S₂O₃²⁻ + I₂ → S₄O₆²⁻ + 2 I⁻ rapide, totale et unique ; concentration c_B et volume V_A supposés exacts ;
// solution homogène (concentration uniforme dans le flacon).
export const M_I2 = 253.8;          // g/mol
export const ETIQUETTE = 1.00;      // g de diiode pour 100 mL de Lugol
export const V_BURETTE_MAX = 25;    // mL

export function modeleLugol({ t = ETIQUETTE, VA = 10, cB = 0.05 } = {}) {
  const cA = t * 10 / M_I2;                       // mol/L (t g pour 100 mL)
  const nI2 = cA * VA / 1000;
  return { t, VA, cB, cA, nI2, Veq: 2 * nI2 / cB * 1000 };
}
export function erlenLugol(mod, VB) {
  const nI2 = Math.max(0, mod.nI2 - mod.cB * VB / 1000 / 2);
  return { nI2, cI2: nI2 / ((mod.VA + VB) / 1000), nThio: Math.max(0, mod.cB * VB / 1000 - 2 * mod.nI2) };
}
// Du volume équivalent mesuré (mL) à la concentration c_A (mol/L) et à la masse pour 100 mL (g)
export function dosageDepuisVe(Ve, { VA = 10, cB = 0.05 } = {}) {
  const nThio = cB * Ve / 1000, nI2 = nThio / 2, cA = nI2 / (VA / 1000), m100 = cA * 0.100 * M_I2;
  return { nThio, nI2, cA, m100 };
}
