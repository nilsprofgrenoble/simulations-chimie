// ====================================================
//  MODÈLE « TITRAGE CONDUCTIMÉTRIQUE PAR PRÉCIPITATION » (sim 255, niveau TSTL SPCL, chapitre « Conductivité et titrages conductimétriques »).
//  On titre des ions chlorure Cl⁻ (cation spectateur Na⁺ ou K⁺) par une solution de nitrate d'argent (Ag⁺, NO₃⁻) : Ag⁺ + Cl⁻ → AgCl(s).
//  Loi de Kohlrausch : σ = Σ λi × [Xi], avec λi en mS·m²·mol⁻¹, [Xi] en mol·m⁻³ (1 mmol/mL = 1 mol/L = 1000 mol·m⁻³) et σ en mS·m⁻¹.
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C ; activités ≈ concentrations ; solutions diluées (ions à moins de 10 mol·m⁻³, soit 1,0×10⁻² mol/L) : domaine de validité de la loi de Kohlrausch ;
//   - λi constants (valeurs à dilution infinie arrondies au dixième, données du problème) ;
//   - transformation totale : Ag⁺ et Cl⁻ ne coexistent pas en quantité notable (le produit de solubilité de AgCl est très petit : à l'équivalence, [Ag⁺] = [Cl⁻]
//     est de l'ordre de 10⁻⁵ mol/L, négligé) ; le chlorure d'argent solide ne conduit pas le courant ;
//  - « sans dilution » (programme) : le volume est pris constant, égal au volume de départ (prise d'essai + eau) ; avec dilution : volume = départ + volume versé ;
//  - conductimètre idéal : il affiche directement σ.
//  Même loi et même convention de signes que la sim 135 (TG) ; ce fichier ne modifie pas conductimetrieModele.js.
// ====================================================
export const CB = 0.050;        // concentration de la solution de nitrate d'argent (mol/L)
export const VA0 = 20.0;        // prise d'essai (mL)
export const V_BURETTE = 25;    // volume maximal versé (mL)
export const EAU_DEFAUT = 180;  // eau ajoutée avant le titrage (mL) ; volume de départ = 200 mL
export const EAU = [0, 80, 180, 280];
export const CONC_A = [0.020, 0.030, 0.040, 0.050];     // concentration des ions chlorure dans la prise d'essai (mol/L)
export const M_SEL = { Na: 58.5, K: 74.6 };               // masses molaires de NaCl et KCl (g/mol)

// ions : λ en mS·m²·mol⁻¹ (valeurs à 25 °C arrondies au dixième : données). À VÉRIFIER sur une source avant publication : Ag⁺ 6,19 et K⁺ 7,35 arrondis à 6,2 et 7,4.
export const IONS = {
  Na:  { id: 'Na',  f: 'Na⁺',  lambda: 5.0, couleur: '#0369a1', z: 1 },
  K:   { id: 'K',   f: 'K⁺',   lambda: 7.4, couleur: '#0369a1', z: 1 },
  Cl:  { id: 'Cl',  f: 'Cl⁻',  lambda: 7.6, couleur: '#15803d', z: -1 },
  NO3: { id: 'NO3', f: 'NO₃⁻', lambda: 7.1, couleur: '#0d9488', z: -1 },
  Ag:  { id: 'Ag',  f: 'Ag⁺',  lambda: 6.2, couleur: '#7c3aed', z: 1 },
};
export const CATIONS = { Na: { id: 'Na', nom: 'chlorure de sodium', formule: 'NaCl' }, K: { id: 'K', nom: 'chlorure de potassium', formule: 'KCl' } };

export const kohlrausch = c => Object.entries(c).reduce((s, [k, v]) => s + (IONS[k] ? IONS[k].lambda * v : 0), 0);   // mS/m

// volume équivalent (mL) : c_B × V_E = c_A × V_A (réaction un pour un)
export const volumeEquivalent = (cA, VA = VA0, cB = CB) => Math.round(1e6 * cA * VA / cB) / 1e6;

// ---------- quantités de matière (mmol), transformation totale ----------
export function quantites({ cA, VA = VA0, VB, cB = CB }) {
  const nCl0 = cA * VA, nAg = cB * VB, nReagi = Math.min(nCl0, nAg);
  return { nCl0, nAg, nReagi, nCl: nCl0 - nReagi, nAgExces: nAg - nReagi, nPrec: nReagi, nCat: nCl0, nNO3: nAg, VE: nCl0 / cB };
}
// composition de la solution (concentrations en mol/m³) : dilution = false → volume constant (programme) ; true → volume de départ + V_B
export function composition({ cation = 'Na', cA, VA = VA0, VB, cB = CB, eau = EAU_DEFAUT, dilution = false }) {
  const q = quantites({ cA, VA, VB, cB }), Vt = VA + eau + (dilution ? VB : 0), f = 1000 / Vt;
  return { Vt, q, c: { [cation]: q.nCat * f, Cl: q.nCl * f, NO3: q.nNO3 * f, Ag: q.nAgExces * f } };
}
export const sigma = p => kohlrausch(composition(p).c);

export function courbe(p, vmax = V_BURETTE, pas = 0.25) {
  const pts = [];
  for (let i = 0; i <= Math.round(vmax / pas); i++) { const VB = i * pas; pts.push({ VB, sigma: sigma({ ...p, VB }) }); }
  return pts;
}
// pentes théoriques (mS·m⁻¹ par mL), sans dilution : chaque mL apporte c_B mmol de Ag⁺ et de NO₃⁻
const parML = (p, Vt) => CB * 1000 / Vt;
export const penteAvant = (p = {}) => (IONS.NO3.lambda - IONS.Cl.lambda) * parML(p, VA0 + (p.eau ?? EAU_DEFAUT));
export const penteApres = (p = {}) => (IONS.Ag.lambda + IONS.NO3.lambda) * parML(p, VA0 + (p.eau ?? EAU_DEFAUT));
export const pente = (p, VB) => { const e = 0.05, a = Math.max(0, VB - e), b = VB + e; return (sigma({ ...p, VB: b }) - sigma({ ...p, VB: a })) / (b - a); };

// ---------- masse de sel par litre à partir de c_A ----------
export const concentrationMassique = (cA, cation = 'Na') => cA * M_SEL[cation];   // g/L

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const arr1 = x => Math.round(x * 10) / 10;
export const CONC_DEFI = [0.025, 0.030, 0.035, 0.045];
// bruit déterministe (suite congruentielle) pour que les points d'un défi soient reproductibles à graine égale
const alea = graine => { let g = graine; return () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; }; };
// 26 points mesurés tous les 1 mL, avec dilution réelle et un petit bruit de lecture (± 0,5 % de σ), affichés à 0,1 mS/m
export function pointsDefi(p, graine = 1) {
  const r = alea(graine), pts = [];
  for (let VB = 0; VB <= V_BURETTE; VB++) pts.push({ VB, sigma: arr1(sigma({ ...p, VB, dilution: true }) * (1 + 0.01 * (r() - 0.5))) });
  return pts;
}
export function tirageDefiConc() {
  const cation = tire(['Na', 'K']), cA = tire(CONC_DEFI), graine = 1 + Math.floor(Math.random() * 1e6);
  return { cation, cA, VA: VA0, VE: volumeEquivalent(cA), pts: pointsDefi({ cation, cA }, graine) };
}
// défi 2 : σ « sans dilution » à un volume V_B éloigné d'au moins 2 mL de V_E
export function tirageDefiSigma() {
  const cation = tire(['Na', 'K']), cA = tire([0.030, 0.040, 0.050]), VE = volumeEquivalent(cA);
  const VB = tire([-8, -6, -4, 2, 3, 4]) + VE;
  return { cation, cA, VA: VA0, VB, VE, sigma: sigma({ cation, cA, VB }), q: quantites({ cA, VB }) };
}

// ---------- modélisation par deux droites (vue « comme en TP ») ----------
export const ZONE_ECARTEE = 2;   // mL
const regression = pts => {
  const n = pts.length, mx = pts.reduce((s, q) => s + q.VB, 0) / n, my = pts.reduce((s, q) => s + q.sigma, 0) / n;
  const a = pts.reduce((s, q) => s + (q.VB - mx) * (q.sigma - my), 0) / pts.reduce((s, q) => s + (q.VB - mx) ** 2, 0);
  return { a, b: my - a * mx };
};
export function pointsMesures(p, pas = 1, vmax = V_BURETTE) {
  const pts = []; for (let i = 0; i <= Math.round(vmax / pas); i++) { const VB = Math.round(i * pas * 100) / 100; pts.push({ VB, sigma: sigma({ ...p, VB }) }); }
  return pts;
}
export function deuxDroites(pts, VE, zone = ZONE_ECARTEE) {
  const avant = pts.filter(q => q.VB <= VE - zone + 1e-9), apres = pts.filter(q => q.VB >= VE + zone - 1e-9);
  const ecartes = pts.filter(q => q.VB > VE - zone + 1e-9 && q.VB < VE + zone - 1e-9);
  const d1 = regression(avant), d2 = regression(apres);
  return { avant, apres, ecartes, d1, d2, VEmod: (d2.b - d1.b) / (d1.a - d2.a) };
}
