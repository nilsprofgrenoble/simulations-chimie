// ====================================================
//  Modèles des « stations » de la journée au labo (sans React, testable seul).
//  Une station reprend un modèle de simulation existant, mais ses paramètres sont CACHÉS : l'élève doit les trouver par la mesure.
//  Ici : le banc à gradient de température (TMFF). Hypothèse de scénario : l'abaissement de la TMFF par % de coalescent
//  (efficacité) vaut entre 2,6 et 3,6 °C/% selon le lot ; l'élève ne le sait pas, il le déduit de ses essais.
// ====================================================
import { rng, gauss } from "./etalonnageModele";

export const EFF_MIN = 2.6, EFF_MAX = 3.6;          // °C par % de coalescent sur polymère sec (secret)
export const SIGMA_BANC = 0.4;                       // °C : dispersion de lecture du banc (écart-type, hypothèse)
export const DOSES_BANC = [0, 1, 2, 3, 4, 5, 6, 8, 10];   // g de DPnB proposés
export const ESSAIS_MAX = 6;                         // essais maximum au banc (chacun coûte du temps)
export const DUREE_ESSAI = 5;                        // min par essai

// Tirage des paramètres cachés d'une partie (appelé une fois, à la création de la partie)
export function secretsAleatoires() {
  const graine = Math.floor(Math.random() * 2 ** 31);
  return secretsDe(graine);
}
export function secretsDe(graine) {
  const r = rng(graine);
  return { graine, eff: Math.round((EFF_MIN + r() * (EFF_MAX - EFF_MIN)) * 100) / 100 };
}

// Lecture au banc : TMFF vraie + bruit reproductible (même graine et même numéro d'essai = même lecture), lue au 0,5 °C près ; le banc s'arrête à 0 °C
export function lectureBanc(tmffVraie, graine, n) {
  const r = rng((graine ^ (n * 2654435761)) >>> 0);
  const v = tmffVraie + SIGMA_BANC * gauss(r);
  if (v <= 0) return null;                          // film continu sur tout le banc : « < 0 °C »
  return Math.round(v * 2) / 2;
}

// Pente tmff = f(% coalescent) estimée par moindres carrés sur les essais au banc (lectures non nulles, au moins 2 doses différentes)
export function penteMesuree(essais) {
  const pts = essais.filter(x => x.tmff != null);
  if (new Set(pts.map(x => x.pct)).size < 2 || pts.length < 3) return null;
  const n = pts.length, mx = pts.reduce((s, p) => s + p.pct, 0) / n, my = pts.reduce((s, p) => s + p.tmff, 0) / n;
  const Sxx = pts.reduce((s, p) => s + (p.pct - mx) ** 2, 0), Sxy = pts.reduce((s, p) => s + (p.pct - mx) * (p.tmff - my), 0);
  const a = Sxy / Sxx, b = my - a * mx;
  const SSres = pts.reduce((s, p) => s + (p.tmff - (a * p.pct + b)) ** 2, 0);
  const sa = n > 2 ? Math.sqrt(SSres / (n - 2) / Sxx) : null;
  return { efficacite: -a, incertitude: sa, tmff0: b, n };
}
