// Modèles d'électricité (sims 68 à 72). Tout est en unités SI sauf mention contraire.
export const fr = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d).replace(".", ",") : "—");

export const E_CHARGE = 1.602e-19;          // charge élémentaire (C)
export const N_CUIVRE = 8.5e28;             // électrons libres par m³ de cuivre (≈ 1 par atome)

// ---------- 2GT : deux résistors branchés sur un générateur idéal ----------
export function serie(E, R1, R2) { const I = E / (R1 + R2); return { I, I1: I, I2: I, U: E, U1: R1 * I, U2: R2 * I }; }
export function derivation(E, R1, R2) { const I1 = E / R1, I2 = E / R2; return { I: I1 + I2, I1, I2, U: E, U1: E, U2: E }; }

// ---------- capteur résistif : thermistance CTN (10 kΩ à 25 °C, B = 3950 K) ----------
export const R25 = 10000, B_CTN = 3950;
export const ctn = th => R25 * Math.exp(B_CTN * (1 / (th + 273.15) - 1 / 298.15));
export const ctnInverse = R => 1 / (1 / 298.15 + Math.log(R / R25) / B_CTN) - 273.15;

// ---------- lampe à incandescence 6 V – 0,30 A : caractéristique non linéaire ----------
export const lampeI = U => 0.30 * Math.pow(Math.max(U, 0) / 6, 1.72);
export const lampeU = I => 6 * Math.pow(Math.max(I, 0) / 0.30, 1 / 1.72);

// ---------- 1G : porteurs de charge ----------
export const deriveVitesse = (I, S_mm2) => I / (N_CUIVRE * S_mm2 * 1e-6 * E_CHARGE);   // m/s

// ---------- 1G : calorimètre / résistance chauffante ----------
// Eau (m en kg) + accessoires (capacité Ccal) chauffés par une résistance sous U, I ; pertes proportionnelles à (θ − θair).
export const C_EAU = 4180;
export function chauffe({ m = 0.2, U = 12.34, I = 1.98, th0 = 25.9, Ccal = 40, h = 0.15, thAir = 22, dt = 15, n = 36, pertes = true }) {
  const P = U * I, Ct = m * C_EAU + Ccal, pts = [];
  let th = th0;
  for (let k = 0; k <= n; k++) {
    const t = k * dt, W = P * t, Q = m * C_EAU * (th - th0);
    pts.push({ t, th, W, Q });
    for (let j = 0; j < dt; j++) th += (P - (pertes ? h * (th - thAir) : 0)) / Ct;
  }
  return pts;
}

// ---------- 1G : source réelle ----------
export const tensionPile = (U0, r, I) => U0 - r * I;
// Courant et puissances d'une pile (U0, r) fermée sur une résistance R
export function pileSurR(U0, r, R) { const I = U0 / (r + R), U = R * I; return { I, U, Pgen: U0 * I, Putile: U * I, Pjoule: r * I * I, rend: U / U0 }; }

// ---------- régression linéaire y = a·x + b ----------
export function regression(pts) {
  const n = pts.length; if (n < 2) return null;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  const sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0), sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0);
  if (sxx === 0) return null;
  const a = sxy / sxx; return { a, b: my - a * mx };
}
