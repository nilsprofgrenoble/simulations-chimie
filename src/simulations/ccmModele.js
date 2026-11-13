// ====================================================
//  Modèle de la simulation 110 : CCM et température de fusion (TP de la chalcone).
//  Les valeurs de Rf sont ILLUSTRATIVES (non mesurées) : elles respectent l'ordre de migration d'un éluant pentane / éther.
// ====================================================
export const ESPECES = {
  chalcone: { nom: 'chalcone', r: 0.45 },
  anisaldehyde: { nom: 'anisaldéhyde', r: 0.55 },
  acetophenone: { nom: '4’-méthylacétophénone', r: 0.65 },
};
export const TF_LIT = 98, U_TF = 2;        // °C (littérature) ; incertitude de lecture du banc Kofler (hypothèse de type B)
export const rfDe = (d, front) => d / front;
// Rf d'une espèce selon la proportion e d'éther dans l'éluant (e = 0,5 : éluant de référence) : un éluant plus polaire fait monter les taches.
export const rf = (nom, e = 0.5) => Math.min(0.95, ESPECES[nom].r * (0.5 + e));
export const distance = (nom, front, e = 0.5, pas = 0.1) => Number((Math.round(rf(nom, e) * front / pas) * pas).toFixed(2));
// Échantillons déposés dans la voie « produit »
export const ECHANTILLONS = {
  brut: { nom: 'produit brut (avant recristallisation)', especes: [['chalcone', 1], ['anisaldehyde', 0.45]] },
  recris: { nom: 'produit recristallisé', especes: [['chalcone', 1]] },
  melange: { nom: 'produit très impur', especes: [['chalcone', 1], ['anisaldehyde', 0.8], ['acetophenone', 0.6]] },
};
export function plaque({ front = 6.0, e = 0.5, produit = 'brut' }) {
  const voie = nom => [{ nom, d: distance(nom, front, e), k: 1 }];
  return {
    front, e,
    voies: [
      { etiquette: 'produit', taches: ECHANTILLONS[produit].especes.map(([n, k]) => ({ nom: n, d: distance(n, front, e), k })) },
      { etiquette: 'chalcone', taches: voie('chalcone') },
      { etiquette: 'anisaldéhyde', taches: voie('anisaldehyde') },
      { etiquette: 'acétophénone', taches: voie('acetophenone') },
    ],
  };
}
// Température de fusion selon le taux d'impuretés (%) : modèle illustratif linéaire, fusion de plus en plus étalée.
export function fusion(imp) { const fin = TF_LIT - 0.4 - 0.9 * imp, largeur = 1 + 0.8 * imp; return { debut: fin - largeur, fin, largeur }; }
export const compatibleTf = (mesure, lit = TF_LIT, u = U_TF) => Math.abs(mesure - lit) <= u;
