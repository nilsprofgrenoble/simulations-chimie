// ====================================================
//  Modèle de la lunette astronomique (TSTL, Ondes : « Des ondes pour observer »).
//  Objectif = lentille mince convergente L1 (f1′ longue), oculaire = lentille mince convergente L2 (f2′ courte).
//  Objet A0B0 à l'infini, de diamètre angulaire θ0. L'objectif en donne une image intermédiaire A1B1 réelle, renversée, dans son plan focal image :
//  A1B1 = f1′ × θ0. Pour l'oculaire, c'est un objet à la distance p = O1O2 − f1′ devant lui.
//  Mise au point « afocale » : A1 en F2, donc O1O2 = f1′ + f2′ ; l'image définitive est à l'infini. Alors θ2 = A1B1 / f2′ et G = θ2/θ0 = f1′/f2′.
//  Vergence de sortie (δ) : V = 1000 × (1/f2′ − 1/p) (distances en mm). Œil normal au repos : V ≈ 0 ; œil myope : il voit net une image virtuelle à son punctum remotum PR
//  (V = −1000/PR). Tolérance : |V − V_œil| ≤ 1 δ.
//  Hypothèses : lentilles minces, Gauss, lumière monochromatique, petits angles. Diffraction (résolution) et luminosité non modélisées.
// ====================================================
export const OBJECTIFS = [500, 800, 1000];     // f1′ possibles (mm)
export const OCULAIRES = [10, 20, 25];         // f2′ possibles (mm)
export const THETA_MIN = 0.5, THETA_MAX = 5;   // diamètre angulaire de l'objet (mrad)
export const PR = 400;                         // punctum remotum de l'œil myope (mm)
export const TOL = 1;                          // tolérance sur la vergence (δ)
export const EPS = 3e-4;                       // pouvoir séparateur de l'œil (rad)

export const dAfocal = (f1, f2) => f1 + f2;
export const pOculaire = (d, f1) => d - f1;                         // distance de A1 à l'oculaire (mm, > 0 si A1 est avant L2)
export const ecart = (d, f1, f2) => d - f1 - f2;                    // écart à la lunette afocale (mm)
export const vergenceSortie = (d, f1, f2) => { const p = pOculaire(d, f1); return p <= 1e-9 ? Infinity : 1000 * (1 / f2 - 1 / p); };
export const vergenceOeil = oeil => (oeil === 'myope' ? -1000 / PR : 0);
export const net = (d, f1, f2, oeil = 'normal') => Math.abs(vergenceSortie(d, f1, f2) - vergenceOeil(oeil)) <= TOL;
export const afocale = (d, f1, f2) => Math.abs(vergenceSortie(d, f1, f2)) <= TOL;
// Réglage exact pour un œil myope : image virtuelle à PR de l'oculaire : p = f2′·PR/(PR + f2′)
export const dMyope = (f1, f2) => f1 + f2 * PR / (PR + f2);
export const natureA2 = (d, f1, f2) => { const V = vergenceSortie(d, f1, f2); return Math.abs(V) < 1e-9 ? 'infini' : V < 0 ? 'virtuelle' : 'reelle'; };
export const posA2 = (d, f1, f2) => { const V = vergenceSortie(d, f1, f2); return Math.abs(V) < 1e-9 ? Infinity : 1000 / V; };   // O2A2 (mm)
// Image intermédiaire, angles (mm, rad)
export const tailleA1B1 = (f1, theta0mrad) => f1 * theta0mrad / 1000;
export const theta2 = (A1B1, f2) => A1B1 / f2;
export const grossissement = (f1, f2) => f1 / f2;
export const visibleOeilNu = theta0mrad => theta0mrad / 1000 >= EPS;
