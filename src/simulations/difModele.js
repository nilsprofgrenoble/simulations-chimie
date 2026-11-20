// ====================================================
//  Modèle de la simulation 181 : diffraction d'une onde par une ouverture (TG spé PC).
//  S'appuie sur ondesModele.js (importé sans le modifier) : fente (intFente, largeurFente), onde dans la cuve (champCuve), couleurs.
//  Hypothèses : onde progressive sinusoïdale (monochromatique) ; ouverture rectangulaire (fente) ; angle caractéristique θ = demi-angle de la
//  première extinction : sin θ = λ/a (exact), θ ≈ λ/a (en radian) si λ/a ≪ 1 ; sur un écran lointain (D ≫ a²/λ) : θ ≈ L/(2D) et L = 2λD/a.
//  Valeurs de référence (ordres de grandeur) : célérité du son dans l'air 340 m/s ; λ de la lumière visible entre 400 et 800 nm.
// ====================================================
import * as O from './ondesModele.js';

export const V_SON = 340;                                    // m/s : célérité du son dans l'air (valeur de référence)
export const lambdaSon = f => V_SON / f;                     // m
export const rapport = (lam, a) => lam / a;                  // λ/a, sans unité (λ et a dans la même unité)
export const thetaPetit = (lam, a) => lam / a;               // rad (λ/a ≪ 1)
export const thetaExact = (lam, a) => (lam < a ? Math.asin(lam / a) : null);   // rad ; null : aucune extinction (λ ≥ a)
export const ecartPetitAngle = (lam, a) => (lam < a ? (lam / a) / Math.asin(lam / a) - 1 : null);   // écart relatif de l'approximation
export const largeurTache = (a, lam, D) => O.largeurFente(a, lam, D);                  // L = 2 λ D / a (m)
export const thetaDepuisL = (L, D) => L / (2 * D);                                     // rad
export const aDepuisTheta = (lam, theta) => lam / theta;
export const aDepuisL = (lam, D, L) => 2 * lam * D / L;
export const lambdaDepuisL = (a, D, L) => a * L / (2 * D);
export const intensite = (a, lam, D, x) => O.intensiteEcran('fente', a, lam, D, x);    // intensité relative (1 au centre), x en m
export const aDepuisAngle = (lam, theta) => lam / Math.sin(theta);

// Situations du tableau du parcours (λ et a en mètres)
export const SITUATIONS = [
  { id: 'cuve', nom: 'Cuve à ondes', onde: 'eau', a: 0.02, lam: 0.01 },
  { id: 'voix', nom: 'Voix par une porte ouverte', onde: 'son', a: 0.80, lam: lambdaSon(340) },
  { id: 'laser', nom: 'Laser sur une fente fine', onde: 'lumière', a: 100e-6, lam: 532e-9 },
  { id: 'jour', nom: 'Lumière du jour par une porte', onde: 'lumière', a: 0.80, lam: 500e-9 },
];

// Demi-largeurs de l'image de l'écran proposées (mm) : cadrage « × 1 » à « × 8 »
export const ZOOMS = [80, 40, 20, 10];
export const LARGEUR_IMAGE_PX = 480;                         // largeur de l'image (pixels) : 2 W correspondent à ces pixels
export const mmParPixel = W => 2 * W / LARGEUR_IMAGE_PX;
// plus petit cadrage (indice dans ZOOMS) dans lequel la tache centrale tient avec une marge : L/2 ≤ 0,8 W
export const zoomPour = Lmm => { for (let i = ZOOMS.length - 1; i >= 0; i--) if (Lmm / 2 <= 0.8 * ZOOMS[i]) return i; return 0; };

// ---------- défis (tirage borné : L entre 8 et 70 mm, valeurs réalistes) ----------
const tire = (t, r) => t[Math.floor(r() * t.length)];
export const LASERS_DEFI = [405, 473, 532, 594, 635, 650];       // nm
export function tirageDefi(type, r = Math.random) {
  for (;;) {
    const lam = tire(LASERS_DEFI, r), D = tire([1.5, 2.0, 2.5, 3.0], r), a = tire([40, 50, 60, 80, 100, 120, 150], r);
    const L = largeurTache(a * 1e-6, lam * 1e-9, D) * 1e3;
    if (L >= 8 && L <= 70) return { type, a, lam, D, L };
  }
}
export const TOL_DEFI = 0.06;
