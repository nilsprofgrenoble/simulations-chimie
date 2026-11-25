// Modèle QUALITATIF d'un diagramme pseudo-ternaire eau / huile / mélange actif (SDS + butanol) de microémulsion.
// Fractions massiques (0 à 1). Triangle : eau en bas à gauche, huile en bas à droite, mélange actif en haut.
// Trois diagrammes schématiques (cours de microémulsions du BTS MDC) : Winsor I, II et III, choisis par la salinité.
// Rien ici ne reproduit des mesures : les frontières et lignes de conjugaison sont construites par script.
import * as W from './winsorModele.js';

export const H3 = Math.sqrt(3) / 2;
export const xy = c => ({ x: c.h + 0.5 * c.s, y: H3 * c.s });
export const comp = p => { const s = p.y / H3, h = p.x - 0.5 * s; return { e: 1 - h - s, h, s }; };
const SOM_E = { x: 0, y: 0 }, SOM_H = { x: 1, y: 0 };
const miroir = p => ({ x: 1 - p.x, y: p.y });
const quad = (a, c, b, t) => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
const N = 48;
const courbe = (a, c, b) => Array.from({ length: N + 1 }, (_, i) => quad(a, c, b, i / N));

// Winsor I : phase huile pratiquement pure (sommet H), microémulsion H/E sur la branche « eau » de la binodale.
const P1 = { x: 0.40, y: H3 * 0.40 };                    // point de plissement : segment P1–H coupe l'axe de symétrie à 33 % de mélange actif
const C1 = { x: 0.27, y: 0.1208 };
const M3 = { x: 0.5, y: H3 / 3 };                       // sommet du triangle triphasique : microémulsion bicontinue (1/3 – 1/3 – 1/3)
const C3 = { x: 0.15, y: 0.22 };
const courbeI = courbe(SOM_E, C1, P1), courbeL = courbe(SOM_E, C3, M3);
const zoneI = [SOM_E, ...courbeI, SOM_H];
const zoneII = zoneI.map(miroir);
const triangle = [SOM_E, SOM_H, M3];
const zoneL = [SOM_E, ...courbeL], zoneR = zoneL.map(miroir);

export const DIAGRAMMES = {
  I:   { type: 'I',   biphasiques: [{ poly: zoneI,  sommet: SOM_H, courbe: courbeI, exces: 'huile', nature: 'H/E' }], triphasique: null },
  II:  { type: 'II',  biphasiques: [{ poly: zoneII, sommet: SOM_E, courbe: courbeI.map(miroir), exces: 'eau', nature: 'E/H' }], triphasique: null },
  III: { type: 'III', biphasiques: [{ poly: zoneL, sommet: SOM_E, courbe: courbeL, exces: 'eau', nature: 'bicontinue' },
                                    { poly: zoneR, sommet: SOM_H, courbe: courbeL.map(miroir), exces: 'huile', nature: 'bicontinue' }], triphasique: triangle },
};
export const typeDeSalinite = S => W.etat(S, W.A_MIN).type;          // 'I', 'III' ou 'II'

export function dans(poly, p) {
  let ok = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) ok = !ok;
  }
  return ok;
}
// Intersection de la demi-droite sommet → G (au-delà de G) avec une polyligne : renvoie { k, point }.
function coupe(V, G, ligne) {
  let meilleur = null;
  const d = { x: G.x - V.x, y: G.y - V.y };
  for (let i = 0; i < ligne.length - 1; i++) {
    const a = ligne[i], b = ligne[i + 1], e = { x: b.x - a.x, y: b.y - a.y };
    const den = d.x * e.y - d.y * e.x; if (Math.abs(den) < 1e-12) continue;
    const k = ((a.x - V.x) * e.y - (a.y - V.y) * e.x) / den, u = ((a.x - V.x) * d.y - (a.y - V.y) * d.x) / den;
    if (u >= -1e-9 && u <= 1 + 1e-9 && k >= 1 - 1e-9 && (!meilleur || k < meilleur.k)) meilleur = { k, point: { x: V.x + k * d.x, y: V.y + k * d.y } };
  }
  return meilleur;
}
const pur = (id, nom) => ({ id, nom, comp: id === 'eau' ? { e: 1, h: 0, s: 0 } : { e: 0, h: 1, s: 0 } });

// Analyse d'un mélange global g = {e,h,s} (fractions) dans le diagramme de type donné.
export function analyser(type, g) {
  const D = DIAGRAMMES[type], G = xy(g);
  if (D.triphasique && dans(D.triphasique, G)) {
    // coordonnées barycentriques dans (E, H, M)
    const s = g.s / (M3.y / H3), fm = s, fe = g.e - fm * comp(M3).e, fh = g.h - fm * comp(M3).h;
    return { n: 3, type, phases: [
      { ...pur('huile', 'huile en excès'), frac: fh }, { id: 'micro', nom: 'microémulsion', nature: 'bicontinue', comp: comp(M3), frac: fm }, { ...pur('eau', 'eau en excès'), frac: fe }] };
  }
  for (const z of D.biphasiques) if (dans(z.poly, G)) {
    const c = coupe(z.sommet, G, z.courbe); if (!c) break;
    const fm = 1 / c.k;
    return { n: 2, type, phases: [
      { ...pur(z.exces, z.exces === 'huile' ? 'huile en excès' : 'eau en excès'), frac: 1 - fm },
      { id: 'micro', nom: 'microémulsion', nature: z.nature, comp: comp(c.point), frac: fm }], tie: { de: z.sommet, vers: c.point } };
  }
  return { n: 1, type, phases: [{ id: 'micro', nom: 'microémulsion', nature: 'monophasique', comp: g, frac: 1 }] };
}
export const melangeA = s => ({ e: (1 - s) / 2, h: (1 - s) / 2, s });       // ajout de mélange actif à un mélange 1 : 1 en eau et huile
export const composition = (h, s) => ({ e: Math.max(0, 1 - h - s), h, s });
export const seuilMonophasique = type => { for (let s = 0.02; s < 0.95; s += 0.005) if (analyser(type, melangeA(s)).n === 1) return s; return 1; };
// Ligne de dilution par l'huile : solution initiale eau + mélange actif (rapport eau/(eau+MA) = r), puis ajout d'huile (fraction massique phi).
export const dilutionHuile = (r, phi) => ({ e: r * (1 - phi), h: phi, s: (1 - r) * (1 - phi) });
export const resume = (a) => a.n + ' phase' + (a.n > 1 ? 's' : '');

// Défis
export const tirageLecture = rng => {
  const type = ['I', 'II', 'III'][Math.floor(rng() * 3)];
  for (let essai = 0; essai < 400; essai++) {
    const h = Math.round((0.05 + rng() * 0.8) * 20) / 20, s = Math.round((0.03 + rng() * 0.4) * 20) / 20;
    if (h + s > 0.95) continue;
    const g = composition(h, s), a = analyser(type, g), G = xy(g);
    if (a.n < 1) continue;
    // éviter les points trop proches d'une frontière (lecture ambiguë)
    let marge = 1;
    const bords = [...DIAGRAMMES[type].biphasiques.map(z => z.poly), ...(DIAGRAMMES[type].triphasique ? [DIAGRAMMES[type].triphasique] : [])];
    for (const poly of bords) for (let i = 0; i < poly.length; i++) { const b = poly[i]; marge = Math.min(marge, Math.hypot(b.x - G.x, b.y - G.y)); }
    if (marge < 0.045) continue;
    return { type, g, a };
  }
  return { type: 'I', g: melangeA(0.1), a: analyser('I', melangeA(0.1)) };
};
export const tirageCompo = rng => {
  for (let essai = 0; essai < 500; essai++) {
    const t = tirageLecture(rng); if (t.a.n !== 2) continue;
    const micro = t.a.phases.find(p => p.id === 'micro');
    return { ...t, vrai: Math.round(micro.comp.s * 100) };
  }
  const g = melangeA(0.1); return { type: 'I', g, a: analyser('I', g), vrai: Math.round(analyser('I', g).phases[1].comp.s * 100) };
};
export const EXCES = { aucun: 'aucune phase en excès', huile: 'huile en excès seule', eau: 'eau en excès seule', deux: 'huile et eau en excès' };
export const excesDe = a => { const ids = a.phases.filter(p => p.id !== 'micro').map(p => p.id); return ids.length === 0 ? 'aucun' : ids.length === 2 ? 'deux' : ids[0]; };
