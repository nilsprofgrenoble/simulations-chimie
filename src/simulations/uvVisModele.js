// ====================================================
//  Modèle de la simulation 169 : spectroscopie UV-visible, identification d'une espèce et loi de Beer-Lambert (TG spé PC).
//  Fonctions pures, sans React. Unités : λ en nm, ε en L·mol⁻¹·cm⁻¹, l en cm, c en mol/L (les menus parlent en µmol/L ou mmol/L).
//  Hypothèses de la simulation (rappelées dans le panneau d'hypothèses) :
//   • une seule espèce absorbante, solvant transparent (eau), cuve de 1,00 cm sauf en exploration (menu), 25 °C ;
//   • lumière monochromatique : A(λ) = ε(λ) × l × c (loi de Beer-Lambert) tant que la solution est diluée ;
//   • λmax et ε(λmax) sont des valeurs TYPIQUES de tables (ordres de grandeur) : les spectres sont modélisés par des bandes gaussiennes ;
//   • au-delà de A ≈ 1,5-2, l'absorbance MESURÉE s'écarte de la droite : écart simulé par un modèle simple de lumière parasite
//     (0,3 % de lumière non absorbée atteint le détecteur). Ce n'est PAS une loi du programme : seule la limite « A ≲ 1,5-2 » est à retenir.
// ====================================================

export const L_CUVE = 1.00;                      // cm (cuve du parcours guidé et des défis)
export const L_MENU = [0.50, 1.00, 2.00];        // cm (menu de l'exploration)
export const LAMBDA_MIN = 220, LAMBDA_MAX = 750; // nm : plage du spectre tracé
export const A_LIMITE_BAS = 1.5, A_LIMITE_HAUT = 2.0;   // domaine de validité cité : A ≲ 1,5 à 2
export const LUMIERE_PARASITE = 0.003;           // modèle simple de l'écart à la linéarité (fraction de lumière parasite)
export const A_MAX_AFFICHE = 3;                  // axe des absorbances des spectres

// Bandes d'absorption : [centre (nm), largeur (nm, exp(-((λ-centre)/largeur)²)), amplitude relative]. Le tableau 'eps' donne ε(λmax) typique.
// lambdaMax : valeur tabulée typique, arrondie au nm ; vérifiée par le test (le maximum du modèle tombe à ±1 nm).
export const ESPECES = {
  tartrazine: { de: 'de la', dilutions: [1, 5, 10], nom: 'Tartrazine (E102)', court: 'tartrazine', couleur: 'jaune', absorbee: 'violet-bleu', rgb: [255, 196, 0], lambdaMax: 427, eps: 2.7e4,
    bandes: [[427, 48, 1], [258, 26, 0.45], [335, 40, 0.07]], unite: 'µmol/L', facteur: 1e-6, cMax: 120, pas: 1, cDefaut: 20 },
  jaune: { de: 'du', dilutions: [1, 5, 10], nom: 'Jaune orangé S (E110)', court: 'jaune orangé S', couleur: 'orange', absorbee: 'bleu', rgb: [255, 120, 0], lambdaMax: 482, eps: 2.3e4,
    bandes: [[484.7, 42, 1], [430, 30, 0.5], [312, 26, 0.4], [236, 20, 0.5]], unite: 'µmol/L', facteur: 1e-6, cMax: 140, pas: 1, cDefaut: 25 },
  cochenille: { de: 'du', dilutions: [1, 5, 10], nom: 'Rouge cochenille A (E124)', court: 'rouge cochenille A', couleur: 'rouge', absorbee: 'vert', rgb: [214, 24, 48], lambdaMax: 507, eps: 2.5e4,
    bandes: [[507, 36, 1], [330, 36, 0.35], [250, 24, 0.45]], unite: 'µmol/L', facteur: 1e-6, cMax: 130, pas: 1, cDefaut: 25 },
  bleu: { de: 'du', dilutions: [1, 5, 10], nom: 'Bleu patenté V (E131)', court: 'bleu patenté V', couleur: 'bleu', absorbee: 'orange-rouge', rgb: [28, 64, 200], lambdaMax: 638, eps: 1.0e5,
    bandes: [[642, 40, 1], [596, 30, 0.35], [412, 40, 0.1], [312, 30, 0.3]], unite: 'µmol/L', facteur: 1e-6, cMax: 32, pas: 0.5, cDefaut: 6 },
  cuivre: { de: 'du', dilutions: [1], formule: '[Cu(NH₃)₄]²⁺', nom: 'Complexe tétraamminecuivre(II)', court: 'complexe tétraamminecuivre(II)', couleur: 'bleu foncé', absorbee: 'orange', rgb: [40, 70, 190], lambdaMax: 605, eps: 55,
    bandes: [[605, 85, 1]], unite: 'mmol/L', facteur: 1e-3, cMax: 60, pas: 1, cDefaut: 12 },
  cafeine: { de: 'de la', dilutions: [1, 5, 10], nom: 'Caféine', court: 'caféine', couleur: 'incolore', absorbee: null, rgb: null, lambdaMax: 273, eps: 9.8e3,
    bandes: [[273, 21, 1]], unite: 'µmol/L', facteur: 1e-6, cMax: 330, pas: 5, cDefaut: 60 },
  paracetamol: { de: 'du', dilutions: [1, 5, 10], nom: 'Paracétamol', court: 'paracétamol', couleur: 'incolore', absorbee: null, rgb: null, lambdaMax: 243, eps: 1.0e4,
    bandes: [[243, 26, 1]], unite: 'µmol/L', facteur: 1e-6, cMax: 320, pas: 5, cDefaut: 60 },
};
export const ORDRE = ['paracetamol', 'cafeine', 'tartrazine', 'jaune', 'cochenille', 'cuivre', 'bleu'];   // par λmax croissante

const forme = (esp, l) => ESPECES[esp].bandes.reduce((s, [c, w, a]) => s + a * Math.exp(-(((l - c) / w) ** 2)), 0);
// facteur de normalisation : ε(λmax tabulée) = eps exactement
const NORME = Object.fromEntries(Object.keys(ESPECES).map(k => [k, ESPECES[k].eps / forme(k, ESPECES[k].lambdaMax)]));
/** Coefficient d'absorption molaire ε(λ), en L·mol⁻¹·cm⁻¹ (modèle de bandes gaussiennes). */
export const epsilon = (esp, l) => NORME[esp] * forme(esp, l);
/** Absorbance « théorique » de la loi de Beer-Lambert : A = ε × l × c (c en mol/L, l en cm). */
export const aTheorique = (esp, lam, c, l = L_CUVE) => epsilon(esp, lam) * l * c;
/** Absorbance MESURÉE : même valeur tant que A reste petite ; au-delà, la lumière parasite (0,3 %) courbe la droite. */
export const aMesuree = At => Math.log10((1 + LUMIERE_PARASITE) / (Math.pow(10, -At) + LUMIERE_PARASITE));
/** Absorbance affichée par le spectrophotomètre à λ, pour une solution de concentration c (mol/L). */
export const absorbance = (esp, lam, c, l = L_CUVE) => aMesuree(aTheorique(esp, lam, c, l));
/** Écart relatif (mesurée − théorique) / théorique, négatif : la mesure est en dessous de la droite. */
export const ecartRelatif = At => (At > 0 ? (aMesuree(At) - At) / At : 0);
/** Concentration (mol/L) déduite d'une absorbance lue : c = A / (ε × l). */
export const concentration = (A, eps, l = L_CUVE) => A / (eps * l);
/** Longueur d'onde du maximum du spectre modélisé (balayage au nm). */
export function lambdaMaxModele(esp) {
  let best = LAMBDA_MIN, m = -1;
  for (let l = LAMBDA_MIN; l <= LAMBDA_MAX; l++) { const e = epsilon(esp, l); if (e > m) { m = e; best = l; } }
  return best;
}
/** Points du spectre (λ en nm, A mesurée) pour une solution c (mol/L). */
export function spectre(esp, c, l = L_CUVE, pas = 2) {
  const pts = [];
  for (let lam = LAMBDA_MIN; lam <= LAMBDA_MAX; lam += pas) pts.push([lam, absorbance(esp, lam, c, l)]);
  return pts;
}
// ---------- conversions d'unités des menus ----------
export const enMolL = (esp, x) => x * ESPECES[esp].facteur;
export const depuisMolL = (esp, c) => c / ESPECES[esp].facteur;
/** Valeur de ε en notation lisible : 2,7×10⁴ (2 chiffres significatifs). */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export function epsTexte(e) {
  if (e < 1000) return String(Math.round(e));
  const [m, ex] = Number(e).toExponential(1).split('e');
  return `${m.replace('.', ',')}×10${[...String(Number(ex))].map(ch => SUP[ch]).join('')}`;
}
// ---------- couleur de la solution (pour le dessin de la cuve) ----------
export function couleurCuve(esp, c, l = L_CUVE) {
  const sp = ESPECES[esp];
  if (!sp.rgb) return 'rgb(246, 250, 253)';
  const A = aTheorique(esp, sp.lambdaMax, c, l), t = 1 - Math.pow(10, -0.9 * A);
  return `rgb(${sp.rgb.map((v, k) => Math.round(250 + (v - 250) * t * (k === 0 ? 1 : 1))).join(', ')})`;
}

// ---------- défis (valeurs tirées au hasard ; données arrondies AVANT de calculer la réponse) ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/** Défi 1 : espèce inconnue parmi 4 candidates dont les λmax tabulées sont espacées d'au moins 25 nm ; concentration telle que A au pic reste entre 0,35 et 1,2. */
export function tirageDefiIdentification() {
  for (let essai = 0; essai < 200; essai++) {
    const c4 = melange(ORDRE).slice(0, 4);
    const l = c4.map(k => ESPECES[k].lambdaMax).sort((a, b) => a - b);
    if (l.some((x, i) => i > 0 && x - l[i - 1] < 25)) continue;
    const inconnue = tire(c4), sp = ESPECES[inconnue];
    const A = tire([0.40, 0.55, 0.70, 0.85, 1.00]);
    return { candidates: c4.sort((a, b) => ESPECES[a].lambdaMax - ESPECES[b].lambdaMax), inconnue, c: A / (sp.eps * L_CUVE), Apic: A };
  }
  throw new Error('tirage impossible');
}
/** Défi 2 : concentration de la solution initiale à partir de l'absorbance lue à λmax (cuve 1,00 cm), avec une dilution éventuelle F.
 *  La solution mesurée (diluée) a une absorbance au maximum comprise entre 0,25 et 1,12 : dans le domaine de validité.
 *  La réponse attendue est calculée à partir de l'absorbance AFFICHÉE (3 décimales), pas de la valeur interne. */
export function tirageDefiConcentration() {
  const esp = tire(ORDRE), sp = ESPECES[esp], F = tire(sp.dilutions);   // dilutions réalistes : pas de dilution utile pour le complexe du cuivre (ε faible)
  const Ath = tire([0.25, 0.32, 0.41, 0.48, 0.56, 0.64, 0.72, 0.85, 0.94, 1.10]) + tire([0, 0.004, 0.009, 0.013, 0.018]);
  const cDil = Ath / (sp.eps * L_CUVE);                                       // mol/L, solution mesurée
  const aLue = Number(absorbance(esp, sp.lambdaMax, cDil).toFixed(3));        // ce que l'élève lit au maximum
  return { esp, F, cDil, aLue, attendue: depuisMolL(esp, concentration(aLue, sp.eps)) * F };
}
