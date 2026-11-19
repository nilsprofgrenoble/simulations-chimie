// ============================================================
//  Modèle de la simulation 7 : cristallisation de KNO₃ par refroidissement ou par évaporation
//  Fonctions pures, testées par : node src/simulations/cristallisationModele.test.mjs
// ============================================================

// Solubilité de KNO₃ dans l'eau pure (g de sel pour 100 g d'eau), valeurs tabulées tous les 10 °C.
// Hypothèse : entre deux valeurs tabulées, interpolation linéaire.
export const SOLUB = [[0, 13.3], [10, 20.9], [20, 31.6], [30, 45.8], [40, 63.9], [50, 85.5], [60, 110.0],
  [70, 138.0], [80, 169.0], [90, 202.0], [100, 246.0]];

// Chlorure de sodium (pour comparer : courbe presque horizontale), valeurs usuelles arrondies
export const SOLUB_NACL = [[0, 35.7], [20, 35.9], [40, 36.4], [60, 37.1], [80, 38.0], [100, 39.2]];

export const solubilite = temp => {
  const t = Math.max(0, Math.min(100, temp));
  for (let i = 0; i < SOLUB.length - 1; i++) {
    const [t1, s1] = SOLUB[i], [t2, s2] = SOLUB[i + 1];
    if (t >= t1 && t <= t2) return s1 + (s2 - s1) * (t - t1) / (t2 - t1);
  }
  return SOLUB[SOLUB.length - 1][1];
};

// Température (°C) à laquelle la solubilité vaut s (g / 100 g d'eau) : inverse de l'interpolation linéaire
export const tempDeSolub = s => {
  for (let i = 0; i < SOLUB.length - 1; i++) {
    const [t1, s1] = SOLUB[i], [t2, s2] = SOLUB[i + 1];
    if (s >= s1 && s <= s2) return t1 + (t2 - t1) * (s - s1) / (s2 - s1);
  }
  return NaN;
};

// État d'un système : mSolute g de KNO₃ dans mEau g d'eau à la température T (équilibre atteint, pas de sursaturation)
export function etat(mSolute, mEau, T) {
  const s = solubilite(T);
  const dissous = Math.min(mSolute, s * mEau / 100);
  const cristaux = Math.max(0, mSolute - dissous);
  return { s, dissous, cristaux, sature: cristaux > 1e-9, rendement: mSolute > 0 ? cristaux / mSolute * 100 : 0,
    concentration: mEau > 0 ? dissous / mEau * 100 : 0 };
}

// Évaporation à T constante : masse d'eau restante à laquelle la solution devient saturée
export const eauSaturation = (mSolute, T) => mSolute / solubilite(T) * 100;
