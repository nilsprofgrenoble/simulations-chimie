// ====================================================
//  MODÈLE DE LA SIMULATION CLHP (sim 12) — fonctions pures
//  D'après X. Bataille (ENCPB / RNChimie, 2008) : phase inverse C18, éluant acétonitrile / eau.
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

// Réglages de départ (identiques à l'ancienne version de la simulation)
export const PARAMS_DEFAUT = {
  longueur: 15, diametre: 4.6, dp: 5, nC: 18, porosite: 0.8,      // colonne : cm, mm, µm, atomes de carbone greffés, —
  temperature: 25, debit: 2.5, pct: 50,                            // éluant : °C, mL/min, % d'acétonitrile
  mp: -0.64, mo: -0.61, b: 19, c: -1.6,                            // paramètres du modèle de rétention
};

export const SEUIL_RS = [1.0, 1.5];   // R < 1,0 : pics superposés ; 1,0 ≤ R < 1,5 : partiellement séparés ; R ≥ 1,5 : séparés
const FWHM = 2.355;                    // largeur à mi-hauteur = 2,355 σ pour un pic gaussien

// Colonne : temps mort tm = ε·π·r²·L / débit ; efficacité N = L / (dp · nC) (hypothèse du modèle, indépendante du débit)
export function colonne(p) {
  const r = p.diametre / 20;                     // rayon en cm
  const tm = p.porosite * Math.PI * r * r * p.longueur / p.debit;   // cm³ / (mL/min) = min
  const N = p.longueur / (p.dp * 1e-4 * p.nC);
  return { tm, N, H: p.longueur / N * 10 };      // H (hauteur équivalente à un plateau) en mm
}

// Rétention d'un composé de logP donné :  ln k' = (mp·logP + mo)·ln φ + b/T + c
export function retention(p, logP, col = colonne(p)) {
  const phi = p.pct / 100;
  const lnk = phi > 0 ? (p.mp * logP + p.mo) * Math.log(phi) + p.b / p.temperature + p.c : -20;
  const k = Math.exp(lnk);
  const tr = col.tm * (1 + k);
  const sigma = tr / Math.sqrt(col.N);           // σ du pic en temps : N = (tR/σ)²
  return { k, tr, sigma, W: FWHM * sigma };
}

export const resolution = (a, b) => (a.W + b.W) > 0 ? 1.18 * (b.tr - a.tr) / (a.W + b.W) : null;

// Mélange complet : liste de { nom, court, logP, conc, epsilon } → pics triés par temps de rétention + résolutions
export function analyse(p, mols) {
  const col = colonne(p);
  const pics = mols.map(m => ({ ...m, ...retention(p, m.logP, col) })).sort((a, b) => a.tr - b.tr);
  pics.forEach(m => {
    // aire du pic ∝ concentration × coefficient de réponse (Beer-Lambert, détecteur UV) ; hauteur = aire / (σ√2π)
    m.aire = (m.conc ?? 1) * (m.epsilon ?? 10);
    m.hauteur = m.aire / (m.sigma * Math.sqrt(2 * Math.PI));
  });
  const res = pics.slice(0, -1).map((m, i) => ({ de: m, a: pics[i + 1], R: resolution(m, pics[i + 1]), alpha: (pics[i + 1].tr - col.tm) / (m.tr - col.tm) }));
  const tMax = Math.max(col.tm * 2, ...pics.map(m => m.tr + 3.5 * m.sigma));
  return { col, pics, res, tMax };
}

// Signal d'un pic gaussien (aire m.aire) à l'instant t
export const signal = (m, t) => m.hauteur * Math.exp(-0.5 * ((t - m.tr) / m.sigma) ** 2);
