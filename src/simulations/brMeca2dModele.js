// Modèle PUR du schéma 2D animé de l'addition de Br₂ : l'alcène est dans le plan de la feuille ; un trait en coin va vers le lecteur, des pointillés vont vers l'arrière.
// Les configurations R/S du produit sont LUES sur ce dessin (produit mixte) puis comparées à celles de la vue 3D (br3dModele.js) par br2dMeca.test.mjs.
// Coordonnées SVG (y vers le bas) : C2 à gauche, C3 à droite.
export const C2 = [240, 84], C3 = [320, 84];
export const SUBST = alc => ({ R2: [200, 50], H2: [200, 118], R3: alc === 'E' ? [360, 118] : [360, 50], H3: alc === 'E' ? [360, 50] : [360, 118] });

// Lettre CIP d'un carbone dessiné : a = Br (z = ±1), b = l'autre carbone, c = CH₃ (ou CH₂ du cycle) ; l'hydrogène est le n°4 (dans le plan).
// Les coordonnées sont retournées en y (y vers le haut) ; avec b et c dans le plan, a·(b×c) = a_z (b_x c_y − b_y c_x). Négatif ⇒ R.
function lettre(centre, autre, r, zBr) {
  const b = [autre[0] - centre[0], -(autre[1] - centre[1])], c = [r[0] - centre[0], -(r[1] - centre[1])];
  return zBr * (b[0] * c[1] - b[1] * c[0]) < 0 ? 'R' : 'S';
}
export function lettres2D(alc, zBrC2, zBrC3) {
  const S = SUBST(alc);
  return [lettre(C2, C3, S.R2, zBrC2), lettre(C3, C2, S.R3, zBrC3)];
}

// Dessin du produit pour la face attaquée : le pont est vers le lecteur (dessus) ou vers l'arrière (dessous) ; Br⁻ attaque par la face opposée.
// On choisit le carbone attaqué (C2 ou C3) pour que le dessin donne les mêmes descripteurs que la vue 3D (lettres3D).
export function plan2D(alc, face, lettres3D) {
  const pont = face === 'dessus' ? 1 : -1;
  for (const att of ['C3', 'C2']) {
    const zC2 = att === 'C3' ? pont : -pont, zC3 = att === 'C3' ? -pont : pont;
    const l = lettres2D(alc, zC2, zC3);
    const ok = alc === 'E' ? l[0] !== l[1] : l[0] === lettres3D[0] && l[1] === lettres3D[1];
    if (ok) return { att, pont, zC2, zC3, lettres: l };
  }
  return null;
}
