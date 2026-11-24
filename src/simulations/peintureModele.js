// ====================================================
// PEINTURE À L'EAU : modèle (sans React, testable seul). Utilisé par Peinture.jsx, StationsLabo, DossierLabo et laboJournee.
// ====================================================

export const RHO_HUILE = 0.93;   // g/mL, huile de lin
export const RESINES = {
  vinnapas: { nom: 'Vinnapas EP 3360', nature: 'copolymère acétate de vinyle – éthylène', es: 60, rhoSec: 1.0, rhoHumide: 1.07, tmff: 2, tg: 10 },
  orgal: { nom: 'Orgal PST 50A', nature: 'copolymère styrène – acrylique', es: 50, rhoSec: 1.03, rhoHumide: 1.03, tmff: 20, tg: 20 },
};
// Prises d'huile (g d'huile pour 100 g de poudre) : annoncées par les fiches techniques, et mesurées sur nos poudres
export const POUDRES = {
  tio2: { nom: 'TiO₂', role: 'pigment', rho: 4.1, phFiche: 20, phMesuree: 25 },
  caco3: { nom: 'CaCO₃ léger', role: 'charge', rho: 2.75, phFiche: 14, phMesuree: 30 },
};
// Additifs : extrait sec (%), densité ; le DPnB est un volatil (composé organique volatil)
export const ADDITIFS = {
  foamex: { nom: 'Foamex (antimousse)', es: 20, rho: 1.0 },
  coadis: { nom: 'Coadis BR3 (dispersant)', es: 40, rho: 1.22 },
  dpnb: { nom: 'DPnB (agent de coalescence)', es: 0, rho: 0.91, cov: true },
  thixol: { nom: 'Thixol 53L (épaississant pseudoplastique)', es: 30, rho: 1.06 },
  coapur: { nom: 'Coapur 3025 (épaississant newtonien)', es: 25, rho: 1.04 },
};
// Formule de référence (Document 1 du sujet)
export const FORMULE_REF = { resine: 'vinnapas', eau: 105.3, tio2: 54, caco3: 54, liant: 74.7, foamex: 1.35, coadis: 0.18, dpnb: 4.5, thixol: 1.35, coapur: 2.7 };

// ── Les calculs, avec leurs hypothèses (voir l'encadré) ──
export function proprietes(f, { ph = 'mesuree', phPerso = null, efficacite = 3 } = {}) {
  const R = RESINES[f.resine];
  const masses = { eau: f.eau, tio2: f.tio2, caco3: f.caco3, liant: f.liant, ...Object.fromEntries(Object.keys(ADDITIFS).map(k => [k, f[k]])) };
  const mTot = Object.values(masses).reduce((s, m) => s + (m || 0), 0);
  const mSecLiant = f.liant * R.es / 100;
  const mSecAdd = Object.entries(ADDITIFS).reduce((s, [k, a]) => s + (f[k] || 0) * a.es / 100, 0);
  const mSec = f.tio2 + f.caco3 + mSecLiant + mSecAdd;
  const ES = mSec / mTot * 100;
  const vPulv = f.tio2 / POUDRES.tio2.rho + f.caco3 / POUDRES.caco3.rho;
  const vLiantSec = mSecLiant / R.rhoSec;
  const CPV = vPulv / (vPulv + vLiantSec) * 100;
  const phT = phPerso ? phPerso.tio2 : ph === 'fiche' ? POUDRES.tio2.phFiche : POUDRES.tio2.phMesuree;
  const phC = phPerso ? phPerso.caco3 : ph === 'fiche' ? POUDRES.caco3.phFiche : POUDRES.caco3.phMesuree;
  const vHuile = (f.tio2 * phT + f.caco3 * phC) / 100 / RHO_HUILE;
  const CPVC = vPulv / (vPulv + vHuile) * 100;
  const lambda = CPV / CPVC;
  const vTot = f.eau / 1 + f.tio2 / POUDRES.tio2.rho + f.caco3 / POUDRES.caco3.rho + f.liant / R.rhoHumide + Object.entries(ADDITIFS).reduce((s, [k, a]) => s + (f[k] || 0) / a.rho, 0);
  const densite = mTot / vTot;
  const COV = (f.dpnb || 0) / (vTot / 1000);                        // g/L
  const coadisActif = (f.coadis || 0) * ADDITIFS.coadis.es / 100 / ((f.tio2 + f.caco3) || 1) * 100;   // % de matière active / pulvérulents
  const pctCoalescent = mSecLiant > 0 ? (f.dpnb || 0) / mSecLiant * 100 : 0;                         // % de coalescent / polymère sec
  const tmff = R.tmff - efficacite * pctCoalescent;                  // modèle linéaire : hypothèse
  return { mTot, mSec, ES, vPulv, vLiantSec, CPV, CPVC, lambda, vHuile, densite, COV, coadisActif, pctCoalescent, tmff, R, phT, phC };
}
export function aspect(l) {
  if (l < 0.5) return { nom: 'brillant', color: '#0f766e' };
  if (l < 0.8) return { nom: 'satiné', color: '#b45309' };
  if (l <= 1) return { nom: 'mat', color: '#7c2d12' };
  return { nom: 'mat, poreux (liant insuffisant)', color: '#b91c1c' };
}
