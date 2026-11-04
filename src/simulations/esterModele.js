// ====================================================
//  MODÈLE « SYNTHÈSE ORGANIQUE : ESTÉRIFICATION » (sim 86)
//  Acide carboxylique + alcool primaire ⇌ ester + eau ; K = 4,0 (alcool primaire ; réaction quasi athermique : K varie très peu avec la température, on le prend constant).
//  Hypothèses : volume réactionnel constant, loi de vitesse d'ordre 1 par réactif (v = kf·[A][B] − kb·[E][W], kb = kf/K),
//  catalyse acide (catalyseur non consommé), constante de vitesse suivant la loi d'Arrhenius (Ea = 60 kJ/mol),
//  entraînement de l'eau par le cyclohexane (hétéroazéotrope eau-cyclohexane, Teb ≈ 70 °C) si le Dean-Stark est utilisé et T ≥ 80 °C.
//  Les valeurs numériques (vitesses, Rf) sont celles de la simulation : elles illustrent les tendances, ce ne sont pas des mesures.
// ====================================================

export const K_EST = 4.0;
export const EA = 60e3, R = 8.314;
export const KF100 = 0.030;            // L·mol⁻¹·min⁻¹ à 100 °C, avec catalyseur
export const FACTEUR_SANS_CAT = 0.01;
export const KD = 0.25;                // min⁻¹ : fraction d'eau entraînée par minute dans le Dean-Stark
export const V_REACTION = 0.060;       // L (volume du milieu réactionnel, solvant non compté)

// Composés (valeurs de la simulation, proches des tables)
export const EAU = { nom: 'eau', formule: 'H₂O', M: 18.0, rho: 1.00, Teb: 100 };
export const ACIDE = { nom: 'acide éthanoïque', formule: 'CH₃COOH', M: 60.05, rho: 1.05, Teb: 118 };
export const COUPLES = {
  butyle:  { alcool: { nom: 'butan-1-ol', M: 74.12, rho: 0.81, Teb: 118 }, ester: { nom: 'éthanoate de butyle', M: 116.16, rho: 0.88, Teb: 126 }, arome: 'pomme, banane' },
  propyle: { alcool: { nom: 'propan-1-ol', M: 60.10, rho: 0.80, Teb: 97 }, ester: { nom: 'éthanoate de propyle', M: 102.13, rho: 0.89, Teb: 102 }, arome: 'poire' },
};

export const kf = (T, cat) => KF100 * Math.exp(EA / R * (1 / 373.15 - 1 / (T + 273.15))) * (cat ? 1 : FACTEUR_SANS_CAT);

// Quantité d'ester à l'équilibre (mol) sans élimination d'eau, mélange initial nA, nB (mol), eau initiale nul
export function avancementEq(nA, nB, K = K_EST) {
  if (nA <= 0 || nB <= 0) return 0;
  const a = K - 1, b = -K * (nA + nB), c = K * nA * nB;
  if (Math.abs(a) < 1e-12) return nA * nB / (nA + nB);
  return (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}
export const rendementEq = (nA, nB, K = K_EST) => avancementEq(nA, nB, K) / Math.min(nA, nB);

// Simulation temporelle (RK4) : renvoie { t[], E[], A[], B[], W[] (eau dans le ballon), Wd[] (eau dans le décanteur) }
export function simuler({ nA, nB, T = 100, cat = true, ds = false, tmax = 180, dt = 0.5, V = V_REACTION }) {
  const k = kf(T, cat), kb = k / K_EST, kd = ds && T >= 80 ? KD : 0;
  const f = s => {
    const [x, w, wd] = s, cA = (nA - x) / V, cB = (nB - x) / V, cE = x / V, cW = w / V;
    const r = (k * cA * cB - kb * cE * cW) * V;                        // mol/min
    return [r, r - kd * w, kd * w];
  };
  let s = [0, 0, 0];
  const out = { t: [0], E: [0], A: [nA], B: [nB], W: [0], Wd: [0] };
  for (let t = dt; t <= tmax + 1e-9; t += dt) {
    const k1 = f(s), k2 = f(s.map((v, i) => v + dt / 2 * k1[i])), k3 = f(s.map((v, i) => v + dt / 2 * k2[i])), k4 = f(s.map((v, i) => v + dt * k3[i]));
    s = s.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    out.t.push(t); out.E.push(s[0]); out.A.push(nA - s[0]); out.B.push(nB - s[0]); out.W.push(s[1]); out.Wd.push(s[2]);
  }
  return out;
}
export const indiceTemps = (sim, t) => Math.max(0, Math.min(sim.t.length - 1, Math.round(t / (sim.t[1] - sim.t[0]))));

// Quantités à partir de volumes
export const molesDepuisVolume = (esp, mL) => mL * esp.rho / esp.M;
export const masseDepuisMoles = (esp, n) => n * esp.M;
export const volumeEau_mL = nEau => nEau * EAU.M / EAU.rho;

// ---------- chromatographie sur couche mince ----------
// Rapport frontal modélisé : Rf = x / (x + k), x = 0,05 + p (p : fraction volumique du solvant polaire, acétate d'éthyle, dans le cyclohexane) ;
// k plus grand = espèce plus retenue par la silice (polaire, liaisons hydrogène)
export const CCM_K = { ester: 0.12, alcool: 0.43, acide: 2.57 };
export const rf = (esp, p) => { const x = 0.05 + p; return x / (x + CCM_K[esp]); };
// Intensité (0–1) d'une tache d'après la quantité, saturante : 1 − exp(−n / n0)
export const intensiteTache = (n, n0 = 0.03) => 1 - Math.exp(-n / n0);

// ---------- traitement et bilan ----------
export const PERTE_LAVAGE = 0.02, PERTE_DISTILLATION = 0.04;           // fraction d'ester perdue à chaque lavage / à la distillation (simulation)
export function bilanMasse({ nEster, nLavages, distille }) {
  let n = nEster * (1 - PERTE_LAVAGE) ** nLavages;
  if (distille) n *= 1 - PERTE_DISTILLATION;
  return n;
}
// Rendement = quantité d'ester obtenue / quantité maximale (réactif limitant)
export const rendement = (nObtenu, nA, nB) => nObtenu / Math.min(nA, nB);
// Lavage à l'hydrogénocarbonate : CH₃COOH + HCO₃⁻ → CH₃COO⁻ + CO₂ + H₂O ; fraction d'acide éliminée, volume de CO₂ (mL, Vm = 24 L/mol à 20 °C)
export const lavageHydrogenocarbonate = (nAcideRestant, nHCO3) => { const n = Math.min(nAcideRestant, nHCO3); return { elimine: n, reste: nAcideRestant - n, CO2_mL: n * 24 * 1000 }; };
