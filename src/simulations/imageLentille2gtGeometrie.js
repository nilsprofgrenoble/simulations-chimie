// ====================================================
//  MISE EN PAGE DES SCHÉMAS DE LA SIMULATION 199 (2GT) : fichier sans React, testé par imageLentille2gtModele.test.mjs.
//  Toute la géométrie (rayons, image, positions des flèches, étiquettes) est calculée ici à partir de imageLentille2gtModele.js ;
//  Scenes.jsx et Fiches.jsx se contentent de dessiner ce que ce fichier décrit. Même échelle K (px par cm) en longueur et en hauteur.
//  Les étiquettes sont placées par un algorithme qui évite les rayons, l'axe, la lentille, les flèches, les cotes et les autres étiquettes.
// ====================================================
import * as M from './imageLentille2gtModele.js';

const NBSP = '\u00a0';

// viewBox de 480 de large (scènes, maxWidth 480) et viewBox de 300 de large (cartes « À retenir », maxWidth 320)
export const MISE_SCENE = { w: 480, h: 280, K: 16, X0: 240, Y0: 104, fs: 20, regle: true, tr: 3, trObj: 4.5, tete: 12, pointe: 10, ruleY: 244, coteY: 206 };
export const MISE_CARTE = { w: 300, h: 150, K: 10, X0: 150, Y0: 74, fs: 14, regle: false, tr: 2.4, trObj: 3.6, tete: 9, pointe: 8, ruleY: 144, coteY: 138 };

export const px = (mise, x, y) => [mise.X0 + mise.K * x, mise.Y0 - mise.K * y];

// ---------- découpe d'une demi-droite (ou d'un segment) dans la fenêtre du schéma (en cm) ----------
// p + t·u, t ∈ [t0, t1] ; renvoie [t0′, t1′] ou null
export function decouper(p, u, t0 = 0, t1 = Infinity, xmax = M.X_MAX, ymax = M.Y_MAX) {
  let a = t0, b = t1;
  const bornes = [[p[0], u[0], -xmax, xmax], [p[1], u[1], -ymax, ymax]];
  for (const [p0, v, lo, hi] of bornes) {
    if (Math.abs(v) < 1e-12) { if (p0 < lo - 1e-9 || p0 > hi + 1e-9) return null; continue; }
    let s = (lo - p0) / v, e = (hi - p0) / v;
    if (s > e) [s, e] = [e, s];
    a = Math.max(a, s); b = Math.min(b, e);
  }
  return a <= b ? [a, b] : null;
}

// ---------- boîtes et segments pour l'évitement ----------
const boite = (ax, ay, anchor, txt, fs, bold = true) => {
  const w = (bold ? 0.64 : 0.58) * fs * txt.length;
  const x0 = anchor === 'middle' ? ax - w / 2 : anchor === 'end' ? ax - w : ax;
  return { x0: x0 - 1.5, x1: x0 + w + 1.5, y0: ay - 0.82 * fs, y1: ay + 0.24 * fs };
};
const boitesSeChevauchent = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
// segment [p, q] coupe-t-il la boîte ?
function segmentCoupeBoite(p, q, b, marge = 1) {
  const x0 = b.x0 - marge, x1 = b.x1 + marge, y0 = b.y0 - marge, y1 = b.y1 + marge;
  let t0 = 0, t1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
  for (const [pp, v, lo, hi] of [[p[0], dx, x0, x1], [p[1], dy, y0, y1]]) {
    if (Math.abs(v) < 1e-12) { if (pp < lo || pp > hi) return false; continue; }
    let s = (lo - pp) / v, e = (hi - pp) / v; if (s > e) [s, e] = [e, s];
    t0 = Math.max(t0, s); t1 = Math.min(t1, e); if (t0 > t1) return false;
  }
  return true;
}

// ---------- construction d'une scène ----------
// o : { d, f, h, rayons: {1,2,3 → 'avant' | 'complet'}, candidats: 1|2|3|null, image: bool, ecran: bool, cotes: ['OAp','OA','hImg','hObj'], deuxF: bool, points: [...] }
export const CANDIDATS = {
  // lettre → type de tracé après la lentille ; le bon tracé est celui dont `bon` est vrai
  1: [{ lettre: 'a', type: 'deuxFp' }, { lettre: 'b', type: 'Fp', bon: true }, { lettre: 'c', type: 'horiz' }, { lettre: 'd', type: 'depuisF' }],
  2: [{ lettre: 'a', type: 'incline' }, { lettre: 'b', type: 'miroir' }, { lettre: 'c', type: 'droit', bon: true }, { lettre: 'd', type: 'tresIncline' }],
  3: [{ lettre: 'a', type: 'horiz', bon: true }, { lettre: 'b', type: 'Fp' }, { lettre: 'c', type: 'deuxFp' }, { lettre: 'd', type: 'depuisF' }],
};
export const LETTRE_BONNE = { 1: 'b', 2: 'c', 3: 'a' };
// direction (en cm) après la lentille pour un type de candidat, à partir du point P = (0, yL)
function directionCandidat(type, c, yL) {
  const { f, d, h } = c;
  switch (type) {
    case 'Fp': return [f, -yL];                // vers F′
    case 'deuxFp': return [2 * f, -yL];        // vers le point 2F′
    case 'horiz': return [1, 0];               // parallèle à l'axe
    case 'depuisF': return [f, yL];            // comme si le rayon venait de F
    case 'axe': return [1, 0];                 // le long de l'axe
    case 'miroir': return [d, h];              // symétrique de la direction incidente par rapport à l'axe
    case 'droit': return [d, -h];              // non dévié (prolongement de B–O)
    case 'incline': return [d / 2, -h];        // plus incliné que le rayon incident
    case 'tresIncline': return [d / 4, -h];    // beaucoup plus incliné (toujours distinct de « incline »)
    default: return [1, 0];
  }
}

const FRAC_AVANT = { 1: 0.4, 2: 0.6, 3: 0.8 }, FRAC_APRES = { 1: 0.25, 2: 0.52, 3: 0.8 };

export function construireScene(o, mise = MISE_SCENE) {
  const f = o.f ?? M.F_PARCOURS, h = o.h ?? M.H_OBJ, c = M.construction(o.d, f, h);
  const imgVisible = !!c.image && c.image.OAp <= M.X_MAX - 0.4 && Math.abs(c.image.B[1]) <= M.LENS_H - 0.3;      // image trop loin ou trop grande : hors du schéma
  const P = (x, y) => px(mise, x, y), fs = mise.fs;
  const els = { grille: [], rayons: [], candidats: [], fleches: [], cotes: [], points: [], regle: null };
  const obst = [];            // segments [p, q] (px) à éviter
  const rects = [];           // boîtes (px) à éviter
  const labels = [];          // étiquettes demandées
  const ajouterSeg = (p, q) => obst.push([p, q]);

  // quadrillage de 1 cm (aide à la lecture, non pris en compte pour les étiquettes)
  for (let i = -14; i <= 14; i++) els.grille.push({ v: true, a: P(i, -M.Y_MAX), b: P(i, M.Y_MAX), i });
  for (let j = -5; j <= 5; j++) els.grille.push({ v: false, a: P(-M.X_MAX, j), b: P(M.X_MAX, j), j });
  // axe optique
  els.axe = [P(-M.X_MAX, 0), P(M.X_MAX, 0)]; ajouterSeg(...els.axe);
  // lentille : trait vertical, pointes de flèche vers l'extérieur
  const hautL = P(0, M.LENS_H), basL = P(0, -M.LENS_H);
  els.lentille = { a: hautL, b: basL, pointes: [[[hautL[0], hautL[1] - mise.pointe], [hautL[0] - 6, hautL[1] + 2], [hautL[0] + 6, hautL[1] + 2]], [[basL[0], basL[1] + mise.pointe], [basL[0] - 6, basL[1] - 2], [basL[0] + 6, basL[1] - 2]]] };
  ajouterSeg([hautL[0], hautL[1] - mise.pointe], [basL[0], basL[1] + mise.pointe]);
  rects.push({ x0: hautL[0] - 7, x1: hautL[0] + 7, y0: hautL[1] - mise.pointe, y1: hautL[1] + 3 }, { x0: basL[0] - 7, x1: basL[0] + 7, y0: basL[1] - 3, y1: basL[1] + mise.pointe });
  // objet AB : flèche pleine
  const A = P(-o.d, 0), B = P(-o.d, h);
  els.objet = { a: A, b: B, tete: [[B[0], B[1] - 2], [B[0] - mise.tete * 0.5, B[1] + mise.tete], [B[0] + mise.tete * 0.5, B[1] + mise.tete]] };
  ajouterSeg(A, B); rects.push({ x0: B[0] - 7, x1: B[0] + 7, y0: B[1] - 3, y1: B[1] + mise.tete + 1 });
  // foyers
  const pts = o.points ?? ['A', 'B', 'O', 'F', 'Fp'];
  const Fp = P(f, 0), F = P(-f, 0), O = P(0, 0);
  els.points.push({ x: F[0], y: F[1], plein: false }, { x: Fp[0], y: Fp[1], plein: true });
  rects.push({ x0: F[0] - 5, x1: F[0] + 5, y0: F[1] - 5, y1: F[1] + 5 }, { x0: Fp[0] - 5, x1: Fp[0] + 5, y0: Fp[1] - 5, y1: Fp[1] + 5 });
  if (o.deuxF) {
    for (const s of [-1, 1]) { const q = P(s * 2 * f, 0); els.points.push({ x: q[0], y: q[1], plein: s > 0, petit: true }); rects.push({ x0: q[0] - 4, x1: q[0] + 4, y0: q[1] - 4, y1: q[1] + 4 }); }
  }

  // rayons
  const dessinerRayon = (r, mode) => {
    const col = M.COULEUR_RAYON[r.id], morceaux = [];
    // avant la lentille : de B jusqu'au plan de la lentille (découpé dans la fenêtre)
    const u0 = [r.avant[1][0] - r.avant[0][0], r.avant[1][1] - r.avant[0][1]];
    const t0 = decouper(r.avant[0], u0, 0, 1);
    if (t0) morceaux.push({ partie: 'avant', a: [r.avant[0][0] + t0[0] * u0[0], r.avant[0][1] + t0[0] * u0[1]], b: [r.avant[0][0] + t0[1] * u0[0], r.avant[0][1] + t0[1] * u0[1]] });
    if (mode === 'complet' && M.surLentille(r)) {
      const t1 = decouper(r.apres.p, r.apres.u, 0, Infinity);
      if (t1) morceaux.push({ partie: 'apres', a: [r.apres.p[0] + t1[0] * r.apres.u[0], r.apres.p[1] + t1[0] * r.apres.u[1]], b: [r.apres.p[0] + t1[1] * r.apres.u[0], r.apres.p[1] + t1[1] * r.apres.u[1]] });
    }
    for (const m of morceaux) {
      // position de la flèche : à une fraction du trajet propre à chaque rayon, pour que les trois flèches ne se chevauchent pas
      let s = m.partie === 'avant' ? FRAC_AVANT[r.id] : 0.5;
      if (m.partie === 'apres') { const xCible = (c.image ? c.image.OAp : 8) * FRAC_APRES[r.id], dx = m.b[0] - m.a[0]; if (Math.abs(dx) > 1e-9) s = Math.min(0.85, Math.max(0.04, (xCible - m.a[0]) / dx)); }
      const a = P(...m.a), b = P(...m.b);
      if (m.partie === 'avant') { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; s = Math.max(s, Math.min(0.75, (mise.tete * 2 + 6) / L)); }   // la tête de flèche ne doit pas toucher B quand le trajet est court
      const mid = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      els.rayons.push({ id: r.id, partie: m.partie, a, b, col, mid, ang });
      ajouterSeg(a, b);
      rects.push({ x0: mid[0] - mise.tete * 0.8, x1: mid[0] + mise.tete * 0.8, y0: mid[1] - mise.tete * 0.8, y1: mid[1] + mise.tete * 0.8 });
    }
  };
  for (const id of [1, 2, 3]) { const m = o.rayons && o.rayons[id]; const r = M.rayonDe(c, id); if (m && r) dessinerRayon(r, m); }

  // image
  if (o.image && imgVisible) {
    const Ai = P(c.image.OAp, 0), Bi = P(c.image.OAp, c.image.B[1]), bas = Bi[1] > Ai[1];       // bas : la pointe de l'image est sous l'axe (image renversée)
    els.imageFl = { a: Ai, b: Bi, tete: bas ? [[Bi[0], Bi[1] + 2], [Bi[0] - mise.tete * 0.5, Bi[1] - mise.tete], [Bi[0] + mise.tete * 0.5, Bi[1] - mise.tete]]
      : [[Bi[0], Bi[1] - 2], [Bi[0] - mise.tete * 0.5, Bi[1] + mise.tete], [Bi[0] + mise.tete * 0.5, Bi[1] + mise.tete]] };
    ajouterSeg(Ai, Bi); rects.push({ x0: Bi[0] - 7, x1: Bi[0] + 7, y0: Math.min(Bi[1], Bi[1] + (bas ? -mise.tete : mise.tete)) - 3, y1: Math.max(Bi[1], Bi[1] + (bas ? -mise.tete : mise.tete)) + 3 });
  }
  // écran
  if (o.ecran && imgVisible) {
    const a = P(c.image.OAp, -4.6), b = P(c.image.OAp, 4.6);
    els.ecran = { a, b }; rects.push({ x0: a[0] - 5, x1: a[0] + 5, y0: b[1], y1: a[1] });
  }

  // candidats (tracés proposés après la lentille) : droites grises en pointillé, avec une lettre
  if (o.candidats) {
    const r = M.rayonDe(c, o.candidats), liste = CANDIDATS[o.candidats];
    for (const cd of liste) {
      const u = directionCandidat(cd.type, c, r.yL), t = decouper([0, r.yL], u, 0, Infinity);
      if (!t) continue;
      const a = P(0, r.yL), b = P(r.apres.p[0] + 0 + t[1] * u[0], r.yL + t[1] * u[1]);
      els.candidats.push({ lettre: cd.lettre, a, b, t1: t[1], u, yL: r.yL });
      ajouterSeg(a, b);
    }
  }

  // ---------- cotes ----------
  const cotes = o.cotes || [];
  const coteH = (x1, x2, txt, col = '#334155') => {
    const y = mise.coteY, a = [P(x1, 0)[0], y], b = [P(x2, 0)[0], y];
    els.cotes.push({ type: 'h', a, b, col, guideA: [a[0], P(x1, 0)[1]], guideB: [b[0], P(x2, 0)[1]] });
    ajouterSeg(a, b); ajouterSeg([a[0], P(x1, 0)[1]], a); ajouterSeg([b[0], P(x2, 0)[1]], b);
    labels.push({ txt, ax: (a[0] + b[0]) / 2, ay: y + fs * 1.15, cands: [[0, 0, 'middle']], fill: col, fixe: true });
  };
  if (cotes.includes('OA')) coteH(-o.d, 0, `OA${NBSP}=${NBSP}${M.cmAuto(o.d)}`);
  if (cotes.includes('OAp') && imgVisible) coteH(0, c.image.OAp, `OA′${NBSP}=${NBSP}${M.cmAuto(c.image.OAp)}`, M.COUL.image);
  const coteV = (x, yHaut, yBas, txt, col, cote, droite = true) => {
    const X = P(x, 0)[0] + (droite ? 22 : -22), a = [X, P(0, yHaut)[1]], b = [X, P(0, yBas)[1]];
    els.cotes.push({ type: 'v', a, b, col, guideA: [P(x, 0)[0], a[1]], guideB: [P(x, 0)[0], b[1]] });
    ajouterSeg(a, b); ajouterSeg([P(x, 0)[0], a[1]], a); ajouterSeg([P(x, 0)[0], b[1]], b);
    const dessous = Math.max(a[1], b[1]) > P(0, 0)[1] + 1;           // cote sous l'axe : l'étiquette va au-dessus de l'axe, où rien ne passe (les rayons sont sous l'axe après l'image)
    labels.push({ txt, ax: X + (droite ? 6 : -6), ay: dessous ? P(0, 0)[1] - 9 : (a[1] + b[1]) / 2 + fs * 0.35, cands: [[0, 0, droite ? 'start' : 'end'], [0, 0, droite ? 'end' : 'start']], fill: col, fixe: true });
  };
  if (cotes.includes('hObj')) coteV(-o.d, h, 0, M.cmAuto(h), M.COUL.objet, true, false);
  if (cotes.includes('hImg') && imgVisible) coteV(c.image.OAp, Math.max(0, c.image.B[1]), Math.min(0, c.image.B[1]), M.cmAuto(c.image.hImg), M.COUL.image, true, true);

  // ---------- étiquettes ----------
  const D = r => [[r * 0.8, -r * 0.6 - 2, 'start'], [-r * 0.8, -r * 0.6 - 2, 'end'], [r * 0.8, r * 0.6 + fs * 0.8, 'start'], [-r * 0.8, r * 0.6 + fs * 0.8, 'end'], [0, -r - 3, 'middle'], [0, r + fs * 0.85, 'middle']];
  const tousCands = () => [9, 14, 22, 32, 44, 58, 72].flatMap(D);
  const demande = (txt, ax, ay, fill, preferes = null) => labels.push({ txt, ax, ay, cands: preferes ? [...preferes, ...tousCands()] : tousCands(), fill });
  const pt = k => pts.includes(k);
  if (pt('A')) demande('A', A[0], A[1], M.COUL.objet, [[-8, fs * 0.95, 'end'], [8, fs * 0.95, 'start']]);
  if (pt('B')) demande('B', B[0], B[1], M.COUL.objet, [[-8, -4, 'end'], [10, -4, 'start']]);
  if (pt('O')) demande('O', O[0], O[1], '#0f172a', [[-8, -6, 'end'], [-8, fs * 0.95, 'end']]);
  if (pt('F')) demande('F', F[0], F[1], M.COUL.foyer, [[0, fs * 1.0 + 3, 'middle'], [0, -9, 'middle']]);
  if (pt('Fp')) demande('F′', Fp[0], Fp[1], M.COUL.foyer, [[0, fs * 1.0 + 3, 'middle'], [0, -9, 'middle']]);
  if (o.deuxF) { demande('2F', P(-2 * f, 0)[0], 0 + P(-2 * f, 0)[1], M.COUL.foyer, [[0, fs * 1.0 + 3, 'middle'], [0, -9, 'middle']]); demande('2F′', P(2 * f, 0)[0], P(2 * f, 0)[1], M.COUL.foyer, [[0, fs * 1.0 + 3, 'middle'], [0, -9, 'middle']]); }
  if (o.image && imgVisible && pt('Ap')) { const Ai = P(c.image.OAp, 0); demande('A′', Ai[0], Ai[1], M.COUL.image, [[9, -7, 'start'], [-9, -7, 'end'], [9, fs, 'start']]); }
  if (o.image && imgVisible && pt('Bp')) { const Bi = P(c.image.OAp, c.image.B[1]); demande('B′', Bi[0], Bi[1], M.COUL.image, Bi[1] > P(0, 0)[1] ? [[10, fs * 0.9, 'start'], [-10, fs * 0.9, 'end']] : [[10, -3, 'start'], [-10, -3, 'end']]); }
  if (o.ecran && imgVisible) { const e = P(c.image.OAp, 4.6); demande('écran', e[0], e[1] - 4, '#475569', [[0, -8, 'middle'], [-8, -8, 'end'], [8, -8, 'start']]); }

  const places = [], toutesBoites = [...rects], conflitsListe = [];
  const dansVue = b => b.x0 >= 1 && b.x1 <= mise.w - 1 && b.y0 >= 1 && b.y1 <= mise.h - 1;
  const zoneRegle = mise.regle ? { x0: 0, x1: mise.w, y0: mise.ruleY - 6, y1: mise.h } : null;
  const compter = b => {
    let n = 0;
    if (!dansVue(b)) n += 3;
    if (zoneRegle && boitesSeChevauchent(b, zoneRegle)) n += 3;
    for (const [p, q] of obst) if (segmentCoupeBoite(p, q, b, 1.5)) n++;
    for (const r of toutesBoites) if (boitesSeChevauchent(b, r)) n++;
    return n;
  };
  const traites = [...labels.filter(l => l.fixe), ...labels.filter(l => !l.fixe)];
  for (const l of traites) {
    let meilleur = null;
    for (const [dx, dy, anchor] of l.cands) {
      const b = boite(l.ax + dx, l.ay + dy, anchor, l.txt, fs), n = compter(b);
      if (!meilleur || n < meilleur.n) meilleur = { n, dx, dy, anchor, b };
      if (n === 0) break;
    }
    toutesBoites.push(meilleur.b);
    if (meilleur.n > 0) conflitsListe.push(l.txt);
    // trait de rappel si l'étiquette est trop loin de son point (les étiquettes fixes des cotes n'en ont pas)
    const bb = meilleur.b, nx = Math.min(Math.max(l.ax, bb.x0), bb.x1), ny = Math.min(Math.max(l.ay, bb.y0), bb.y1), dist = Math.hypot(nx - l.ax, ny - l.ay);
    places.push({ txt: l.txt, x: l.ax + meilleur.dx, y: l.ay + meilleur.dy, anchor: meilleur.anchor, fill: l.fill, boite: meilleur.b, dist, lien: !l.fixe && dist > 16 ? { x1: l.ax, y1: l.ay, x2: nx, y2: ny } : null });
  }

  // lettres des tracés candidats : placées sur le tracé, loin de la lentille, sans chevaucher un rayon ni une autre lettre
  const rondes = [];
  for (const cd of els.candidats) {
    let choisi = null;
    for (const fr of [0.97, 0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42, 0.34, 0.28]) {
      const x = cd.a[0] + (cd.b[0] - cd.a[0]) * fr, y = cd.a[1] + (cd.b[1] - cd.a[1]) * fr;
      const b = { x0: x - 10, x1: x + 10, y0: y - 10, y1: y + 10 };
      if (!dansVue(b)) continue;
      const autres = obst.filter(([p, q]) => !(p === cd.a && q === cd.b));
      const touche = autres.some(([p, q]) => segmentCoupeBoite(p, q, b, 0)) || rondes.some(r => boitesSeChevauchent(b, r.b)) || rects.some(r => boitesSeChevauchent(b, r)) || toutesBoites.slice(rects.length).some(r => boitesSeChevauchent(b, r));
      if (!touche) { choisi = { x, y, b, lettre: cd.lettre }; break; }
    }
    if (!choisi) { const x = cd.a[0] + (cd.b[0] - cd.a[0]) * 0.97, y = cd.a[1] + (cd.b[1] - cd.a[1]) * 0.97; choisi = { x, y, b: { x0: x - 10, x1: x + 10, y0: y - 10, y1: y + 10 }, lettre: cd.lettre }; conflitsListe.push(`lettre ${cd.lettre}`); }
    rondes.push(choisi);
  }
  els.lettres = rondes;
  return { c, mise, els, etiquettes: places, conflits: conflitsListe, obstacles: obst, rects, boitesRondes: rondes.map(r => r.b) };
}

// description textuelle (aria-label) d'une scène
export function descriptionScene(o, c) {
  const parts = [`Schéma à l’échelle d’une lentille convergente de distance focale ${M.cmFR(c.f, 0)}. L’objet AB, de hauteur ${M.cmFR(c.h)}, est à ${M.cmFR(c.d)} de la lentille.`];
  for (const id of [1, 2, 3]) if (o.rayons && o.rayons[id]) parts.push(`Le ${M.NOM_RAYON[id]} est tracé${o.rayons[id] === 'avant' ? ' jusqu’à la lentille' : ' avant et après la lentille'}.`);
  if (o.candidats) parts.push('Quatre tracés possibles, notés a, b, c et d, sont proposés en gris.');
  if (o.image && c.image) parts.push(`L’image A′B′ est renversée, à ${M.cmFR(c.image.OAp)} de la lentille, de hauteur ${M.cmFR(c.image.hImg)}.`);
  return parts.join(' ');
}
