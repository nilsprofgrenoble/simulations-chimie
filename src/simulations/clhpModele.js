// ====================================================
//  MODÈLE DE LA SIMULATION CLHP (sim 12) — fonctions pures
//  Rétention : X. Bataille (ENCPB / RNChimie, 2008) : phase inverse C18, éluant acétonitrile / eau.
//  Efficacité : relation de Bataille N = L/(dp·nC).
//  Élution : isocratique (formule exacte) ou en gradient linéaire (intégration de la migration de chaque bande).
//  Pression : loi de Darcy. Pannes : déformations simples et illustratives du fonctionnement normal.
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
  panne: null,                                                     // null ou une clé de PANNES
  grad: false, pct1: 90, tg: 10,                                   // gradient linéaire : % final, durée (min)
};

export const SEUIL_RS = [1.0, 1.5];   // R < 1,0 : pics superposés ; 1,0 ≤ R < 1,5 : partiellement séparés ; R ≥ 1,5 : séparés
export const P_MAX = 400;             // bar : limite usuelle d'une CLHP « classique » (UHPLC : ~1000 bar)
const FWHM = 2.355;                    // largeur à mi-hauteur = 2,355 σ pour un pic gaussien
const R_GAZ = 8.314;

// ---- constantes physiques (ordres de grandeur de la littérature ; voir les hypothèses affichées) ----
//  Viscosité eau / acétonitrile : loi de mélange logarithmique avec un terme d'excès (maximum ≈ 1 mPa·s vers 20 % d'acétonitrile),
//       énergie d'activation de l'écoulement ≈ 15 kJ/mol.
//  Pression : loi de Darcy ΔP = Φ·η·u·L / dp², facteur de résistance Φ ≈ 1000 (colonne remplie de particules sphériques).
export const FLUIDE = { PHI: 1000, ETA_EAU: 0.89, ETA_ACN: 0.34, EXCES: 1.83, EA: 15e3 };

// viscosité du mélange (mPa·s) pour une fraction volumique φ d'acétonitrile, à T (°C)
export function viscosite(phi, T) {
  const ln25 = phi * Math.log(FLUIDE.ETA_ACN) + (1 - phi) * Math.log(FLUIDE.ETA_EAU) + FLUIDE.EXCES * phi * (1 - phi);
  return Math.exp(ln25) * Math.exp(FLUIDE.EA / R_GAZ * (1 / (T + 273.15) - 1 / 298.15));
}

// ---- pannes : déformations illustratives du fonctionnement normal (amplitudes choisies pour être bien visibles) ----
export const PANNES = {
  bouchee: { nom: 'Filtre ou colonne encrassé(e)', symptome: 'la pression monte, les temps de rétention ne bougent pas',
    geste: 'Remplacer le filtre ou la précolonne ; rincer la colonne selon la notice ; filtrer les échantillons (0,45 µm).' },
  vieille: { nom: 'Colonne vieillie', symptome: 'les pics s’élargissent et sortent plus tôt, la séparation se dégrade, la pression ne change pas',
    geste: 'Régénérer la colonne (rinçage selon la notice) ; si cela ne suffit pas, la remplacer.' },
  fuite: { nom: 'Fuite à un raccord', symptome: 'les temps de rétention augmentent et la pression est plus basse que d’habitude',
    geste: 'Repérer la fuite, resserrer ou remplacer le raccord (ferrule), puis vérifier le débit.' },
  eluant: { nom: 'Éluant mal préparé', symptome: 'tous les temps de rétention sont décalés, la pression change peu',
    geste: 'Refaire l’éluant en mesurant chaque volume avec la verrerie adaptée, puis le filtrer et le dégazer.' },
  bulle: { nom: 'Bulle d’air dans la pompe', symptome: 'la pression oscille, la ligne de base ondule et les pics sont irréguliers',
    geste: 'Dégazer l’éluant, puis purger la pompe.' },
  lampe: { nom: 'Lampe du détecteur en fin de vie', symptome: 'les pics sont plus petits et la ligne de base plus bruitée, les temps de rétention sont corrects',
    geste: 'Relever le nombre d’heures de la lampe, puis la remplacer et recalibrer le détecteur.' },
};
// effet de chaque panne sur le fonctionnement
const PANNE_EFFETS = {
  bouchee: { resistance: 2.6 },
  vieille: { nFac: 0.35, kFac: 0.75 },
  fuite: { debitFac: 0.7 },
  eluant: { dPhi: -0.08 },
  bulle: { oscillation: 0.3, nFac: 0.8, ondulation: 0.1 },
  lampe: { gain: 0.35, bruit: 0.07 },
};
const eff = p => (p.panne && PANNE_EFFETS[p.panne]) || {};
const phiReel = (p, phi) => Math.min(0.97, Math.max(0.02, phi + (eff(p).dPhi || 0)));

// Colonne : temps mort, efficacité, pression
export function colonne(p) {
  const e = eff(p);
  const debit = p.debit * (e.debitFac || 1);                                // débit réellement dans la colonne (une fuite le diminue)
  const r = p.diametre / 20;                                                // rayon en cm
  const section = p.porosite * Math.PI * r * r;
  const tm = section * p.longueur / debit;                                  // cm³ / (mL/min) = min
  const N = p.longueur / (p.dp * 1e-4 * p.nC) * (e.nFac || 1);
  const u = debit / section / 60;                                           // vitesse linéaire de l'éluant, cm/s
  // pression : la plus forte rencontrée pendant l'analyse (la viscosité dépend de la composition)
  const phis = p.grad ? Array.from({ length: 21 }, (_, i) => (p.pct + (p.pct1 - p.pct) * i / 20) / 100) : [p.pct / 100];
  const etaMax = Math.max(...phis.map(f => viscosite(phiReel(p, f), p.temperature)));
  const dP = FLUIDE.PHI * etaMax * 1e-3 * (p.longueur / 100) * (u / 100) / (p.dp * 1e-6) ** 2 / 1e5 * (e.resistance || 1);   // bar
  const osc = e.oscillation || 0;
  return { tm, N, H: p.longueur / N * 10, u, dP, dPmin: dP * (1 - osc), dPmax: dP * (1 + osc) };
}

// facteur de rétention pour une fraction φ d'acétonitrile :  ln k' = (mp·logP + mo)·ln φ + b/T + c
export function kPhi(p, logP, phi) {
  const f = phiReel(p, phi);
  return Math.exp((p.mp * logP + p.mo) * Math.log(f) + p.b / p.temperature + p.c) * (eff(p).kFac || 1);
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
  const col = colonne(p), e = eff(p);
  const tous = mols.map(m => ({ ...m, ...(p.grad ? retentionGradient(p, m.logP, col) : retention(p, m.logP, col)) }));
  const pics = tous.filter(m => m.elue !== false).sort((a, b) => a.tr - b.tr);
  const nonElues = tous.filter(m => m.elue === false);
  pics.forEach(m => {
    // aire du pic ∝ concentration × coefficient de réponse (Beer-Lambert, détecteur UV) ; hauteur = aire / (σ√2π)
    m.aire = (m.conc ?? 1) * (m.epsilon ?? 10) * (e.gain || 1);
    m.hauteur = m.aire / (m.sigma * Math.sqrt(2 * Math.PI));
  });
  const res = pics.slice(0, -1).map((m, i) => ({ de: m, a: pics[i + 1], R: resolution(m, pics[i + 1]), alpha: (pics[i + 1].tr - col.tm) / (m.tr - col.tm) }));
  const tMax = Math.max(col.tm * 2, p.grad ? p.tg * 1.05 : 0, ...pics.map(m => m.tr + 3.5 * m.sigma));
  // en cas de panne, on garde l'échelle du chromatogramme normal pour que la perte de signal se voie
  let hRef = Math.max(...pics.map(m => m.hauteur), 0), ref = null;
  if (p.panne) { ref = analyse({ ...p, panne: null }, mols); hRef = ref.hRef; }
  return { col, pics, res, tMax: ref ? Math.max(tMax, ref.tMax) : tMax, nonElues, hRef, ref,
    ligneBase: { bruit: (e.bruit || 0), ondulation: (e.ondulation || 0), hRef } };
}

// Ligne de base : bruit déterministe et ondulation lente (bulle d'air), en fraction de la hauteur de référence
export function bruitLigne(lb, t) {
  if (!lb.bruit && !lb.ondulation) return 0;
  const alea = Math.sin(t * 91.7) * 0.5 + Math.sin(t * 213.3 + 1.7) * 0.3 + Math.sin(t * 457.1 + 0.4) * 0.2;
  return lb.hRef * (lb.bruit * alea + lb.ondulation * Math.sin(2 * Math.PI * t / 0.9));
}

// Signal d'un pic gaussien (aire m.aire) à l'instant t
export const signal = (m, t) => m.hauteur * Math.exp(-0.5 * ((t - m.tr) / m.sigma) ** 2);
