// ====================================================
//  MODÈLE DE LA SIMULATION 88 — « Échographe : écho, célérité et résolution »
//  Fonctions pures, testées par echoModele.test.mjs (node src/simulations/echoModele.test.mjs).
//  Contenu original : les valeurs sont des ordres de grandeur arrondis, adaptés au niveau Terminale STL.
// ====================================================

// ---------- 1. Capteur à ultrasons dans un gaz ----------
export const R_GAZ = 8.314;                 // J·mol⁻¹·K⁻¹
export const GAZ = {
  air: { nom: 'air', gamma: 1.40, M: 0.029 },
  co2: { nom: 'dioxyde de carbone', gamma: 1.30, M: 0.044 },
  he: { nom: 'hélium', gamma: 1.67, M: 0.004 },
};
export const kelvin = tc => tc + 273.15;
// Modèle du gaz parfait : v = √(γ R T / M)
export const celeriteGaz = (tc, gaz = GAZ.air) => Math.sqrt(gaz.gamma * R_GAZ * kelvin(tc) / gaz.M);
export const retardAllerRetour = (d, v) => 2 * d / v;                 // s
export const distanceDepuisRetard = (dt, v) => v * dt / 2;            // m
// Distance affichée par un capteur programmé avec une célérité v0 (par exemple 340 m/s)
export const distanceAffichee = (dtReel, v0 = 340) => distanceDepuisRetard(dtReel, v0);
export const celeriteDepuisEtalonnage = (d, dt) => 2 * d / dt;
// Ordres de grandeur de la célérité du son (valeurs arrondies, à 20 °C pour les fluides)
export const ORDRES = [
  { milieu: 'air (20 °C)', type: 'gaz', v: 343 },
  { milieu: 'hélium (20 °C)', type: 'gaz', v: 1007 },
  { milieu: 'eau (20 °C)', type: 'liquide', v: 1480 },
  { milieu: 'huile d’olive (20 °C)', type: 'liquide', v: 1430 },
  { milieu: 'acier', type: 'solide', v: 5900 },
  { milieu: 'verre', type: 'solide', v: 5400 },
];

// ---------- 2. Échographe unidimensionnel ----------
export const SEUIL_DB = -80;                // niveau minimal détectable par le récepteur (0 dB = onde émise)
export const V_APPAREIL = 1540;             // m/s : célérité moyenne supposée par l’appareil pour calculer les profondeurs
// Milieux : célérité (m/s) et coefficient d’absorption à 1 MHz (dB·cm⁻¹·MHz⁻¹)
export const MILIEUX = {
  gel: { nom: 'gel', v: 1500, alpha1: 0.0 },
  peau: { nom: 'peau', v: 1540, alpha1: 1.5 },
  graisse: { nom: 'graisse', v: 1450, alpha1: 0.6 },
  muscle: { nom: 'muscle', v: 1580, alpha1: 1.1 },
  organe: { nom: 'organe', v: 1590, alpha1: 0.7 },
};
// Coefficients énergétiques de réflexion R aux interfaces (données de la simulation, T = 1 − R)
export const R_INTERFACE = { 'air/peau': 0.99, 'gel/peau': 0.02, 'peau/graisse': 0.03, 'graisse/muscle': 0.01, 'muscle/organe': 0.02, 'fond de l’organe': 0.03, 'détail': 0.01 };
export const X_DETAIL = 1.5;                // cm : position du premier détail sous la face d’entrée de l’organe
export const EP_DEFAUT = { gel: 0.1, peau: 0.2, graisse: 1.2, muscle: 2.0, organe: 3.6 };   // cm

export const alpha = (milieu, fMHz) => MILIEUX[milieu].alpha1 * fMHz;           // dB·cm⁻¹ à la fréquence f
export const longueurOnde = (v, fMHz) => v / (fMHz * 1e6) * 1e3;                 // mm
export const tDB = r => 10 * Math.log10(r);

// Couches traversées dans l’ordre ; le gel est facultatif
export function couches(ep = EP_DEFAUT, gel = true) {
  const liste = [];
  if (gel) liste.push('gel');
  liste.push('peau', 'graisse', 'muscle', 'organe');
  return liste.map(id => ({ id, ep: ep[id], ...MILIEUX[id] }));
}
// Liste des échos d’un balayage A. Chaque écho : profondeur réelle (cm), retard aller-retour t (s), niveau (dB), détecté ou non.
// Niveau = 10 log10( R × produit des (1 − R)² des interfaces déjà traversées ) − absorption aller-retour.
export function echos({ ep = EP_DEFAUT, gel = true, fMHz = 5, sDetail = 0.8, avecDetails = true } = {}) {
  const res = [];
  let prof = 0, t = 0, absDB = 0, tr = 1, prec = null;
  const ajoute = (id, nom, R, p, tAller, abs, tra) => {
    const niveau = tDB(R * tra * tra) - abs;
    res.push({ id, nom, R, prof: p, t: 2 * tAller, niveau, detecte: niveau >= SEUIL_DB });
  };
  for (const c of couches(ep, gel)) {
    const nom = prec ? `${prec}/${c.id}` : (c.id === 'peau' ? 'air/peau' : null);
    if (nom && R_INTERFACE[nom] != null) {
      ajoute(nom, nom.replace('/', ' / '), R_INTERFACE[nom], prof, t, absDB, tr);
      tr *= 1 - R_INTERFACE[nom];
    }
    if (c.id === 'organe' && avecDetails) {
      [0, 1].forEach(k => {
        const x = X_DETAIL + k * sDetail * 1e-1;                       // cm sous la face d’entrée (sDetail en mm)
        ajoute(k ? 'detail2' : 'detail1', `détail ${k + 1}`, R_INTERFACE['détail'], prof + x, t + x * 1e-2 / c.v, absDB + 2 * alpha('organe', fMHz) * x, tr * (1 - R_INTERFACE['détail']) ** k);
      });
    }
    prof += c.ep; t += c.ep * 1e-2 / c.v; absDB += 2 * alpha(c.id, fMHz) * c.ep;
    if (c.id === 'organe') ajoute('fond', 'fond de l’organe', R_INTERFACE['fond de l’organe'], prof, t, absDB, tr);
    prec = c.id;
  }
  return res.sort((a, b) => a.t - b.t);
}
// Profondeur calculée par l’appareil avec la célérité moyenne supposée
export const profondeurApparente = (t, v = V_APPAREIL) => v * t / 2 * 1e2;            // cm
// Profondeur vraie du début d’un milieu
export const profondeurDebut = (id, ep = EP_DEFAUT, gel = true) => {
  let p = 0; for (const c of couches(ep, gel)) { if (c.id === id) return p; p += c.ep; } return NaN;
};
// Absorption aller-retour dans une couche d’épaisseur e (cm) à la fréquence f
export const absorptionAllerRetour = (milieu, fMHz, e) => 2 * alpha(milieu, fMHz) * e;
// Fréquence maximale pour laquelle l’écho du fond reste détecté (équation linéaire en f)
export function fMaxFond(ep = EP_DEFAUT, gel = true) {
  const e1 = echos({ ep, gel, fMHz: 1, avecDetails: false }).find(e => e.id === 'fond');
  const e0 = echos({ ep, gel, fMHz: 0, avecDetails: false }).find(e => e.id === 'fond');
  const pente = e0.niveau - e1.niveau;                               // dB perdus par MHz
  return (e0.niveau - SEUIL_DB) / pente;
}

// ---------- 3. Résolution ----------
// Critère de la simulation : deux détails sont séparés si leur écart s est au moins égal à la longueur d’onde.
export const separables = (sMm, lambdaMm) => sMm >= lambdaMm * (1 - 1e-9);
export const frequenceMin = (sMm, v) => v / (sMm * 1e-3) / 1e6;                   // MHz : λ = s
// Enveloppe d’un écho : lobe de largeur σ = 1 / f ; la somme de deux lobes égaux présente un creux si l’écart dépasse 2σ
export const sigma = fMHz => 1 / fMHz;                                            // µs
export const enveloppe = (t, centres, fMHz) => centres.reduce((s, c) => s + Math.exp(-0.5 * ((t - c) / sigma(fMHz)) ** 2), 0);
export const aUnCreux = (ecart, fMHz) => {
  const c = [-ecart / 2, ecart / 2], e = 0.05 * sigma(fMHz);        // le centre est un minimum local si l’écart dépasse 2σ
  return enveloppe(e, c, fMHz) - enveloppe(0, c, fMHz) > 1e-9;
};
// Écart temporel (µs) entre deux détails séparés de s (mm) dans un milieu de célérité v
export const ecartTemps = (sMm, v) => 2 * sMm * 1e-3 / v * 1e6;
