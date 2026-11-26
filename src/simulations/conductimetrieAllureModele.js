// ====================================================
//  MODÈLE « PRÉVOIR L'ALLURE D'UNE COURBE DE TITRAGE CONDUCTIMÉTRIQUE » (sim 257, niveau TSTL SPCL, chapitre « Conductivité et titrages conductimétriques »).
//  Cinq titrages comparés avec une même méthode : on suit les ions qui disparaissent, apparaissent ou restent spectateurs ; σ = Σ λi × ci (Kohlrausch).
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C ; activités ≈ concentrations ; solutions diluées (ions à moins de 10 mol·m⁻³) ; λi constants (valeurs à dilution infinie arrondies au dixième : données) ;
//   - « sans dilution » (programme) : le volume est pris constant, égal au volume de départ (prise d'essai + eau) ;
//   - transformation de titrage totale (réaction support rapide et totale) ;
//   - acide faible et base faible : les ions présents au départ (dissociation partielle) sont négligés : σ de départ prise nulle. En réalité σ part d'une petite valeur non nulle
//     et peut baisser très légèrement au tout début ; la droite d'avant l'équivalence reste la bonne description du reste de la courbe ;
//   - conductimètre idéal : il affiche directement σ. Même loi que les sims 135 (TG) et 255 (TSTL) ; ce fichier ne modifie aucun autre modèle.
// ====================================================
export const VA0 = 20.0;                 // prise d'essai (mL)
export const V_BURETTE = 25;             // volume maximal versé (mL)
export const EAU = [180, 280];         // eau ajoutée avant le titrage (mL) : volume de départ 200 ou 300 mL
export const EAU_DEFAUT = 180;
export const CONC_A = [0.020, 0.030, 0.040, 0.050];   // concentration de l'espèce titrée dans la prise d'essai (mol/L)
export const PAR_POINT = 0.1;            // mmol représentées par un point dans le schéma

// ions : λ en mS·m²·mol⁻¹ (valeurs à 25 °C arrondies au dixième : données)
export const IONS = {
  H3O: { id: 'H3O', f: 'H₃O⁺', lambda: 35.0, couleur: '#dc2626', z: 1 },
  HO:  { id: 'HO',  f: 'HO⁻',  lambda: 19.9, couleur: '#7c3aed', z: -1 },
  Na:  { id: 'Na',  f: 'Na⁺',  lambda: 5.0,  couleur: '#0369a1', z: 1 },
  Cl:  { id: 'Cl',  f: 'Cl⁻',  lambda: 7.6,  couleur: '#15803d', z: -1 },
  NO3: { id: 'NO3', f: 'NO₃⁻', lambda: 7.1,  couleur: '#0d9488', z: -1 },
  Ag:  { id: 'Ag',  f: 'Ag⁺',  lambda: 6.2,  couleur: '#9333ea', z: 1 },
  AcO: { id: 'AcO', f: 'CH₃COO⁻', lambda: 4.1, couleur: '#65a30d', z: -1 },
  NH4: { id: 'NH4', f: 'NH₄⁺', lambda: 7.4,  couleur: '#ea580c', z: 1 },
};
export const ORDRE_IONS = ['H3O', 'HO', 'Na', 'Cl', 'NO3', 'Ag', 'AcO', 'NH4'];

// ν : variation, par mole de titrant versée, de la quantité de chaque ion dissous. « depart » : ions de la prise d'essai (par mol de l'espèce titrée).
// neutre : espèce non ionique de la prise d'essai qui disparaît (molécule d'acide faible ou de base faible) ou solide formé.
export const TITRAGES = {
  fortSoude: { id: 'fortSoude', court: 'acide fort par une base forte',
    titre: 'acide chlorhydrique (acide fort) par la soude', analyte: 'acide chlorhydrique', fAnalyte: 'HCl', titrant: 'soude', fTitrant: 'Na⁺ + HO⁻', cB: 0.100,
    reaction: 'H₃O⁺ + HO⁻ → 2 H₂O', depart: { H3O: 1, Cl: 1 }, avant: { H3O: -1, Na: 1 }, apres: { Na: 1, HO: 1 }, spectateurs: ['Cl', 'Na'], neutre: null },
  faibleSoude: { id: 'faibleSoude', court: 'acide faible par une base forte',
    titre: 'acide éthanoïque (acide faible) par la soude', analyte: 'acide éthanoïque', fAnalyte: 'CH₃COOH', titrant: 'soude', fTitrant: 'Na⁺ + HO⁻', cB: 0.100,
    reaction: 'CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O', depart: {}, avant: { AcO: 1, Na: 1 }, apres: { Na: 1, HO: 1 }, spectateurs: ['Na'], neutre: 'CH₃COOH' },
  soudeAcide: { id: 'soudeAcide', court: 'base forte par un acide fort',
    titre: 'soude (base forte) par l’acide chlorhydrique', analyte: 'soude', fAnalyte: 'Na⁺ + HO⁻', titrant: 'acide chlorhydrique', fTitrant: 'H₃O⁺ + Cl⁻', cB: 0.100,
    reaction: 'H₃O⁺ + HO⁻ → 2 H₂O', depart: { Na: 1, HO: 1 }, avant: { HO: -1, Cl: 1 }, apres: { H3O: 1, Cl: 1 }, spectateurs: ['Na', 'Cl'], neutre: null },
  ammoniacAcide: { id: 'ammoniacAcide', court: 'base faible par un acide fort',
    titre: 'ammoniac (base faible) par l’acide chlorhydrique', analyte: 'ammoniac', fAnalyte: 'NH₃', titrant: 'acide chlorhydrique', fTitrant: 'H₃O⁺ + Cl⁻', cB: 0.100,
    reaction: 'NH₃ + H₃O⁺ → NH₄⁺ + H₂O', depart: {}, avant: { NH4: 1, Cl: 1 }, apres: { H3O: 1, Cl: 1 }, spectateurs: ['Cl'], neutre: 'NH₃' },
  precip: { id: 'precip', court: 'précipitation des ions chlorure',
    titre: 'chlorure de sodium (ions chlorure) par le nitrate d’argent', analyte: 'chlorure de sodium', fAnalyte: 'Na⁺ + Cl⁻', titrant: 'nitrate d’argent', fTitrant: 'Ag⁺ + NO₃⁻', cB: 0.050,
    reaction: 'Ag⁺ + Cl⁻ → AgCl(s)', depart: { Na: 1, Cl: 1 }, avant: { Cl: -1, NO3: 1 }, apres: { Ag: 1, NO3: 1 }, spectateurs: ['Na', 'NO3'], neutre: 'AgCl(s)' },
};
export const ORDRE_TITRAGES = ['fortSoude', 'faibleSoude', 'soudeAcide', 'ammoniacAcide', 'precip'];

const somme = d => Object.entries(d).reduce((s, [k, v]) => s + IONS[k].lambda * v, 0);
export const lambdaDepart = t => somme(TITRAGES[t].depart);          // mS·m²·mol⁻¹ par mol d'espèce titrée
export const lambdaAvant = t => somme(TITRAGES[t].avant);            // Σ ν λ avant l'équivalence (par mole de titrant)
export const lambdaApres = t => somme(TITRAGES[t].apres);

export const Vdepart = (eau = EAU_DEFAUT, VA = VA0) => VA + eau;                                  // mL, volume constant
export const volumeEquivalent = (t, cA, VA = VA0) => Math.round(1e6 * cA * VA / TITRAGES[t].cB) / 1e6;   // mL
// conversion : mmol/mL de titrant versé → mol·m⁻³ : c (mol/L) × 1 mL / V (mL) × 1000
export const pasConc = (t, eau = EAU_DEFAUT, VA = VA0) => TITRAGES[t].cB * 1000 / Vdepart(eau, VA);   // mol·m⁻³ par mL versé
export const penteAvant = (t, eau = EAU_DEFAUT, VA = VA0) => lambdaAvant(t) * pasConc(t, eau, VA);     // mS·m⁻¹ par mL
export const penteApres = (t, eau = EAU_DEFAUT, VA = VA0) => lambdaApres(t) * pasConc(t, eau, VA);
export const sigma0 = (t, cA, eau = EAU_DEFAUT, VA = VA0) => lambdaDepart(t) * cA * 1000 * VA / Vdepart(eau, VA);
export function sigma(t, cA, VB, eau = EAU_DEFAUT, VA = VA0) {
  const VE = volumeEquivalent(t, cA, VA), s0 = sigma0(t, cA, eau, VA), a1 = penteAvant(t, eau, VA), a2 = penteApres(t, eau, VA);
  return VB <= VE ? s0 + a1 * VB : s0 + a1 * VE + a2 * (VB - VE);
}
export const sigmaEquivalence = (t, cA, eau = EAU_DEFAUT, VA = VA0) => sigma(t, cA, volumeEquivalent(t, cA, VA), eau, VA);
export function courbe(t, cA, eau = EAU_DEFAUT, vmax = V_BURETTE, pas = 0.25, VA = VA0) {
  const pts = []; for (let v = 0; v <= vmax + 1e-9; v += pas) pts.push({ VB: Number(v.toFixed(4)), sigma: sigma(t, cA, v, eau, VA) });
  return pts;
}
// quantités (mmol) : ions présents, espèce neutre restante ou formée, à VB mL versés
export function quantites(t, cA, VB, VA = VA0) {
  const T = TITRAGES[t], nA = cA * VA, nB = T.cB * VB, nE = nA, q = {};
  const ajoute = (d, k) => Object.entries(d).forEach(([i, v]) => { q[i] = (q[i] || 0) + v * k; });
  ajoute(T.depart, nA);
  if (nB <= nE) ajoute(T.avant, nB); else { ajoute(T.avant, nE); ajoute(T.apres, nB - nE); }
  Object.keys(q).forEach(i => { if (Math.abs(q[i]) < 1e-9) q[i] = 0; });
  const neutre = T.neutre ? (t === 'precip' ? Math.min(nB, nE) : Math.max(0, nE - nB)) : 0;
  return { ions: q, neutre, nA, nB, nE };
}
// ---------- dosage « réel » (exploration) : dilution, σ' corrigée, arrondi de la courbe autour de l'équivalence, modélisation affine ----------
//  Mesure réelle : le volume augmente de V_B, donc σ mesurée = Σ λ n / (V0 + V_B) baisse par dilution. On corrige : σ' = σ × (V0 + V_B) / V0 = Σ λ n / V0, qui est affine par morceaux.
//  V0 = volume de départ (prise d'essai + eau). Autour de l'équivalence, la réaction n'est plus totale et la courbe réelle s'arrondit (hypothèse du modèle : bosse gaussienne
//  de largeur 0,9 mL, de hauteur 6 % de σ' maximale) : les points à moins de 1,5 mL de V_E ne sont pas sur les droites.
export const LARGEUR_ARRONDI = 0.9;      // mL
export const ZONE_ARRONDI = 1.5;         // mL : à ne pas utiliser pour les droites
export const facteurDilution = (VB, eau = EAU_DEFAUT, VA = VA0) => (Vdepart(eau, VA) + VB) / Vdepart(eau, VA);
export const hauteurArrondi = (t, cA, eau = EAU_DEFAUT, VA = VA0) => 0.06 * Math.max(sigma(t, cA, 0, eau, VA), sigma(t, cA, V_BURETTE, eau, VA));
export function sigmaCorrigee(t, cA, VB, eau = EAU_DEFAUT, VA = VA0) {
  const VE = volumeEquivalent(t, cA, VA);
  return sigma(t, cA, VB, eau, VA) + hauteurArrondi(t, cA, eau, VA) * Math.exp(-(((VB - VE) / LARGEUR_ARRONDI) ** 2));
}
export const sigmaMesuree = (t, cA, VB, eau = EAU_DEFAUT, VA = VA0) => sigmaCorrigee(t, cA, VB, eau, VA) / facteurDilution(VB, eau, VA);
export const dansZoneArrondi = (VB, VE) => Math.abs(VB - VE) < ZONE_ARRONDI;
// régression affine y = a x + b par moindres carrés ; pts : [{ x, y }] ; null si moins de 2 points ou abscisses identiques
export function regression(pts) {
  const n = pts.length; if (n < 2) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0), sxy = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0), syy = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
  if (sxx < 1e-12) return null;
  const a = sxy / sxx, b = my - a * mx;
  return { a, b, n, r2: syy < 1e-12 ? 1 : (sxy * sxy) / (sxx * syy) };
}
export const abscisseIntersection = (d1, d2) => (Math.abs(d1.a - d2.a) < 1e-9 ? null : (d2.b - d1.b) / (d1.a - d2.a));

// ajustement affine des deux zones : lignes brutes [{ id, VB, sm, sp }] → lignes avec groupe (0, 1, 2), régressions, intersection
export function ajuster(brutes, bornes) {
  const dedans = (v, k) => bornes[k] && v >= bornes[k][0] - 1e-6 && v <= bornes[k][1] + 1e-6;
  const lignes = brutes.map(p => ({ ...p, g: dedans(p.VB, 1) ? 1 : dedans(p.VB, 2) ? 2 : 0 })).sort((a, b) => a.VB - b.VB);
  const g1 = lignes.filter(p => p.g === 1).map(p => ({ x: p.VB, y: p.sp })), g2 = lignes.filter(p => p.g === 2).map(p => ({ x: p.VB, y: p.sp }));
  const d1 = regression(g1), d2 = regression(g2);
  return { lignes, g1, g2, d1, d2, VEm: d1 && d2 ? abscisseIntersection(d1, d2) : null };
}
// mesures du parcours guidé : un point par mL, incertitude de ± 0,4 % reproductible (suite pseudo-aléatoire fixe)
export function mesuresGuide(t, cA, eau) {
  let g = 7; const al = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  const out = []; for (let v = 0; v <= V_BURETTE; v += 1) { const sm = sigmaMesuree(t, cA, v, eau) * (1 + (al() - 0.5) * 0.008); out.push({ id: v, VB: v, sm, sp: sm * facteurDilution(v, eau) }); }
  return out;
}
export const pasNice = m => (m > 150 ? 50 : m > 60 ? 20 : m > 30 ? 10 : m > 12 ? 5 : 2);
export const yMaxDosage = (t, cA, eau) => { const yM = Math.max(sigma(t, cA, 0, eau), sigma(t, cA, V_BURETTE, eau), sigmaEquivalence(t, cA, eau)) * 1.12, st = pasNice(yM); return Math.max(st * 2, Math.ceil(yM / st) * st); };
// type de variation d'une pente : 'baisse', 'quasi-constante', 'hausse' (seuil : |σ'| < 3 % de la pente après l'équivalence)
export function allure(pente, penteRef) { return Math.abs(pente) < 0.06 * Math.abs(penteRef) ? 'quasi-constante' : pente < 0 ? 'baisse' : 'hausse'; }
export const forme = t => ({ avant: allure(lambdaAvant(t), lambdaApres(t)), apres: allure(lambdaApres(t), lambdaApres(t)) });

// ---------- défis ----------
const tire = tab => tab[Math.floor(Math.random() * tab.length)];
export function tirageDefiPente() {
  const t = tire(ORDRE_TITRAGES), cA = tire(CONC_A), eau = tire(EAU), avant = tire([true, true, false]);
  return { t, cA, eau, avant, vrai: avant ? penteAvant(t, eau) : penteApres(t, eau) };
}
// trois titrages d'allures nettement différentes : un en « V » (fort/fort), un « montée en deux pentes » (faible), la précipitation (presque plate puis montée)
export const CLASSES_ALLURE = { V: ['fortSoude', 'soudeAcide'], montee: ['faibleSoude', 'ammoniacAcide'], plat: ['precip'] };
export function tirageDefiAssocier() {
  const ids = [tire(CLASSES_ALLURE.V), tire(CLASSES_ALLURE.montee), 'precip'];
  const ordre = [...ids].sort(() => Math.random() - 0.5);       // ordre des courbes A, B, C
  return { ids, ordre, cA: tire(CONC_A), eau: tire([180, 280]) };
}

// nombre maximal de points à dessiner par type d'entité (ions et espèce neutre « N ») pour un titrage, sur toutes les concentrations et tous les volumes : sert à réserver des emplacements fixes
export function maxPoints(t) {
  const m = {};
  for (const cA of CONC_A) for (let v = 0; v <= V_BURETTE + 1e-9; v += 0.25) {
    const q = quantites(t, cA, v);
    Object.entries(q.ions).forEach(([i, n]) => { m[i] = Math.max(m[i] || 0, Math.round(n / PAR_POINT)); });
    m.N = Math.max(m.N || 0, Math.round(q.neutre / PAR_POINT));
  }
  return m;
}
