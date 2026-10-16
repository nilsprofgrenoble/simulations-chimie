// ====================================================
//  MODÈLE DE LA SIMULATION CLHP (sim 12) — fonctions pures
//  Rétention : X. Bataille (ENCPB / RNChimie, 2008) : phase inverse C18, éluant acétonitrile / eau.
//  Efficacité : au choix, relation simple de Bataille N = L/(dp·nC), ou équation de van Deemter (forme réduite).
//  Élution : isocratique (formule exacte) ou en gradient linéaire (intégration de la migration de chaque bande).
//  Rien ici ne dépend de React : le modèle est testable seul.
// ====================================================

export const MOLECULES_CLHP = [
  { nom: 'Paracétamol',           court: 'Paracétamol',     logP:  0.34 },
  { nom: 'Caféine',               court: 'Caféine',         logP: -0.13 },
  { nom: 'Phénol',                court: 'Phénol',          logP:  1.48 },
  { nom: 'Phénacétine',           court: 'Phénacétine',     logP:  1.63 },
  { nom: 'o-nitrophénol',         court: 'o-nitrophénol',   logP:  1.71 },
  { nom: 'Ac. 2-aminobenzoïque',  court: 'Ac. 2-amino',     logP:  1.21 },
  { nom: 'Ac. 2-chlorobenzoïque', court: 'Ac. 2-chloro',    logP:  2.01 },
  { nom: 'Benzophénone',          court: 'Benzophénone',    logP:  3.18 },
  { nom: 'Benzoate de méthyle',   court: 'Benzoate Me',     logP:  2.20 },
  { nom: 'Lidocaïne',             court: 'Lidocaïne',       logP:  2.36 },
  { nom: '4-nitrobenz. éthyle',   court: '4-nitrobenzoate', logP:  2.33 },
  { nom: 'Triphénylcarbinol',     court: 'Triphénylcarbinol', logP: 4.59 },
  { nom: '1,3-diphénylacétone',   court: 'Diphénylacétone', logP:  2.99 },
  { nom: 'Benzaldéhyde',          court: 'Benzaldéhyde',    logP:  1.64 },
  { nom: 'Diméthylaniline',       court: 'Diméthylaniline', logP:  1.86 },
  { nom: 'm-nitrophénol',         court: 'm-nitrophénol',   logP:  1.93 },
  { nom: 'Hydrobenzoïne',         court: 'Hydrobenzoïne',   logP:  1.86 },
];

// Réglages de départ : identiques à l'ancienne version (efficacité de Bataille, isocratique)
export const PARAMS_DEFAUT = {
  longueur: 15, diametre: 4.6, dp: 5, nC: 18, porosite: 0.8,      // colonne : cm, mm, µm, atomes de carbone greffés, porosité totale
  temperature: 25, debit: 2.5, pct: 50,                            // éluant : °C, mL/min, % d'acétonitrile (ou % initial en gradient)
  mp: -0.64, mo: -0.61, b: 19, c: -1.6,                            // paramètres du modèle de rétention
  eff: 'bataille',                                                 // 'bataille' : N = L/(dp·nC) ; 'vd' : van Deemter
  grad: false, pct1: 90, tg: 10,                                   // gradient linéaire : % final, durée (min)
};

export const SEUIL_RS = [1.0, 1.5];   // R < 1,0 : pics superposés ; 1,0 ≤ R < 1,5 : partiellement séparés ; R ≥ 1,5 : séparés
export const P_MAX = 400;             // bar : limite usuelle d'une CLHP « classique » (UHPLC : ~1000 bar)
const FWHM = 2.355;                    // largeur à mi-hauteur = 2,355 σ pour un pic gaussien
const R_GAZ = 8.314;

// ---- constantes physiques (ordres de grandeur de la littérature ; voir les hypothèses affichées) ----
//  van Deemter réduit : h = A + B/ν + C·ν, avec h = H/dp et ν = u·dp/Dm (vitesse réduite).
//  A = 1,2 ; B = 1,5 ; C = 0,1 : colonne bien remplie, minimum h ≈ 2 vers ν ≈ 4.
//  Dm : coefficient de diffusion d'une petite molécule aromatique, ≈ 1,0·10⁻⁵ cm²/s dans l'eau à 25 °C,
//       corrigé en T/η (relation de Wilke-Chang / Stokes-Einstein).
//  Viscosité eau / acétonitrile : loi de mélange logarithmique avec un terme d'excès (maximum ≈ 1 mPa·s vers 20 % d'acétonitrile),
//       énergie d'activation de l'écoulement ≈ 15 kJ/mol.
//  Pression : loi de Darcy ΔP = Φ·η·u·L / dp², facteur de résistance Φ ≈ 1000 (colonne remplie de particules sphériques).
export const VD = { A: 1.2, B: 1.5, C: 0.1, Dm25: 1.0e-5, PHI: 1000, ETA_EAU: 0.89, ETA_ACN: 0.34, EXCES: 1.83, EA: 15e3 };

// viscosité du mélange (mPa·s) pour une fraction volumique φ d'acétonitrile, à T (°C)
export function viscosite(phi, T) {
  const ln25 = phi * Math.log(VD.ETA_ACN) + (1 - phi) * Math.log(VD.ETA_EAU) + VD.EXCES * phi * (1 - phi);
  return Math.exp(ln25) * Math.exp(VD.EA / R_GAZ * (1 / (T + 273.15) - 1 / 298.15));
}

const phiMoyen = p => p.grad ? (p.pct + p.pct1) / 200 : p.pct / 100;

// efficacité van Deemter pour un débit donné (mL/min) : renvoie H en cm et les grandeurs intermédiaires
function vanDeemter(p, debit, phi) {
  const r = p.diametre / 20, dpCm = p.dp * 1e-4;
  const u = debit / (p.porosite * Math.PI * r * r) / 60;            // vitesse linéaire de l'éluant, cm/s
  const eta = viscosite(phi, p.temperature);
  const Dm = VD.Dm25 * ((p.temperature + 273.15) / 298.15) * (VD.ETA_EAU / eta);   // cm²/s
  const nu = u * dpCm / Dm;
  const h = VD.A + VD.B / nu + VD.C * nu;
  return { H: h * dpCm, u, Dm, nu, h, eta };
}

// Colonne : temps mort, efficacité, pression
export function colonne(p) {
  const r = p.diametre / 20;                     // rayon en cm
  const tm = p.porosite * Math.PI * r * r * p.longueur / p.debit;   // cm³ / (mL/min) = min
  const vd = vanDeemter(p, p.debit, phiMoyen(p));
  const N = p.eff === 'vd' ? p.longueur / vd.H : p.longueur / (p.dp * 1e-4 * p.nC);
  // pression : la plus forte rencontrée pendant l'analyse (la viscosité dépend de la composition)
  const phis = p.grad ? Array.from({ length: 21 }, (_, i) => (p.pct + (p.pct1 - p.pct) * i / 20) / 100) : [p.pct / 100];
  const etaMax = Math.max(...phis.map(f => viscosite(f, p.temperature)));
  const dP = VD.PHI * etaMax * 1e-3 * (p.longueur / 100) * (vd.u / 100) / (p.dp * 1e-6) ** 2 / 1e5;   // bar
  return { tm, N, H: p.longueur / N * 10, u: vd.u, Dm: vd.Dm, nu: vd.nu, h: vd.h, eta: vd.eta, dP };
}

// Courbe de van Deemter H = f(débit) pour la colonne et l'éluant actuels, et son minimum
export function courbeVD(p) {
  const phi = phiMoyen(p), dMax = Math.max(5, p.debit * 1.6);
  const pts = Array.from({ length: 120 }, (_, i) => { const d = 0.04 + (dMax - 0.04) * i / 119; return { d, H: vanDeemter(p, d, phi).H * 1e4 }; });
  const ref = vanDeemter(p, 1, phi);                                 // ν est proportionnel au débit
  const dOpt = Math.sqrt(VD.B / VD.C) / ref.nu;
  return { pts, dOpt, Hopt: vanDeemter(p, dOpt, phi).H * 1e4, dMax };   // H en µm
}

// facteur de rétention pour une fraction φ d'acétonitrile :  ln k' = (mp·logP + mo)·ln φ + b/T + c
export function kPhi(p, logP, phi) {
  return phi > 0 ? Math.exp((p.mp * logP + p.mo) * Math.log(phi) + p.b / p.temperature + p.c) : Math.exp(-20);
}
// composition de l'éluant à la sortie de la pompe (entrée de colonne), à l'instant t (volume de délai négligé)
export function phiEntree(p, t) {
  if (!p.grad) return p.pct / 100;
  if (t <= 0) return p.pct / 100;
  if (t >= p.tg) return p.pct1 / 100;
  return (p.pct + (p.pct1 - p.pct) * t / p.tg) / 100;
}

// Rétention isocratique (formule exacte)
export function retention(p, logP, col = colonne(p)) {
  const k = kPhi(p, logP, p.pct / 100);
  const tr = col.tm * (1 + k);
  const sigma = tr / Math.sqrt(col.N);           // σ du pic en temps : N = (tR/σ)²
  return { k, ke: k, tr, sigma, W: FWHM * sigma, traj: null };
}

// Rétention en gradient : la bande, à l'abscisse x, voit l'éluant parti de la pompe à l'instant t − x/u ;
// elle avance à la vitesse u / (1 + k'(φ local)). On intègre jusqu'à la sortie (x = L).
const PAS_PAR_TM = 120;
export function retentionGradient(p, logP, col = colonne(p)) {
  const L = p.longueur, u = L / col.tm, dt = col.tm / PAS_PAR_TM;
  const vit = (t, x) => u / (1 + kPhi(p, logP, phiEntree(p, t - x / u)));
  const tLim = Math.max(p.tg, 0) + 300 * col.tm;
  const traj = [0];
  let t = 0, x = 0;
  while (x < L && t < tLim) {
    const k1 = vit(t, x), k2 = vit(t + dt / 2, x + k1 * dt / 2);      // Runge-Kutta d'ordre 2
    const xn = x + k2 * dt;
    if (xn >= L) { t += dt * (L - x) / (xn - x); x = L; break; }
    x = xn; t += dt; traj.push(x);
  }
  if (x < L) return { elue: false, k: Infinity, ke: Infinity, tr: Infinity, sigma: 0, W: 0, traj, dt };
  const tr = t;
  const ke = kPhi(p, logP, phiEntree(p, tr - col.tm));               // k' de la bande au moment où elle sort
  // largeur d'un pic en gradient : σ ≈ t0 (1 + k'e) / √N (facteur de compression de la bande négligé)
  const sigma = col.tm * (1 + ke) / Math.sqrt(col.N);
  return { k: (tr - col.tm) / col.tm, ke, tr, sigma, W: FWHM * sigma, traj, dt };
}

// Position moyenne de la bande (cm depuis l'entrée) et k' local, à l'instant t (pour la vue colonne)
export function positionBande(p, m, t, col) {
  const u = p.longueur / col.tm;
  if (!m.traj) { const x = u * t / (1 + m.k); return { x, k: m.k }; }
  const i = t / m.dt, i0 = Math.floor(i);
  const x = i0 >= m.traj.length - 1 ? p.longueur * (1 + (t - m.tr) / col.tm) : m.traj[i0] + (m.traj[i0 + 1] - m.traj[i0]) * (i - i0);
  return { x, k: kPhi(p, m.logP, phiEntree(p, t - Math.min(x, p.longueur) / u)) };
}

export const resolution = (a, b) => (a.W + b.W) > 0 ? 1.18 * (b.tr - a.tr) / (a.W + b.W) : null;

// Mélange complet : liste de { nom, court, logP, conc, epsilon } → pics triés par temps de rétention + résolutions
export function analyse(p, mols) {
  const col = colonne(p);
  const tous = mols.map(m => ({ ...m, ...(p.grad ? retentionGradient(p, m.logP, col) : retention(p, m.logP, col)) }));
  const pics = tous.filter(m => m.elue !== false).sort((a, b) => a.tr - b.tr);
  const nonElues = tous.filter(m => m.elue === false);
  pics.forEach(m => {
    // aire du pic ∝ concentration × coefficient de réponse (Beer-Lambert, détecteur UV) ; hauteur = aire / (σ√2π)
    m.aire = (m.conc ?? 1) * (m.epsilon ?? 10);
    m.hauteur = m.aire / (m.sigma * Math.sqrt(2 * Math.PI));
  });
  const res = pics.slice(0, -1).map((m, i) => ({ de: m, a: pics[i + 1], R: resolution(m, pics[i + 1]), alpha: (pics[i + 1].tr - col.tm) / (m.tr - col.tm) }));
  const tMax = Math.max(col.tm * 2, p.grad ? p.tg * 1.05 : 0, ...pics.map(m => m.tr + 3.5 * m.sigma));
  return { col, pics, res, tMax, nonElues };
}

// Signal d'un pic gaussien (aire m.aire) à l'instant t
export const signal = (m, t) => m.hauteur * Math.exp(-0.5 * ((t - m.tr) / m.sigma) ** 2);
