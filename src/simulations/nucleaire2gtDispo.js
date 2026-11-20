// ====================================================
//  Mise en page des schémas de la simulation 203 « Transformation nucléaire » : tout est CALCULÉ à partir du modèle (nucleaire2gtModele.js).
//  Chaque scène est une liste de primitives (texte, noyau, cercle, ligne, flèche, rectangle, amas d'atomes, coche) en pixels du viewBox ; Nucleaire2gtScenes.jsx les dessine.
//  Les nombres de protons et de neutrons d'un noyau dessiné sont ceux de Z et de A (nucleons() est testé), l'échelle des noyaux est annoncée « non à l'échelle » dans le texte
//  qui accompagne la scène, les neutrons des scènes de fission sont agrandis (annoncé).
//  nucleaire2gtDispo.test.mjs vérifie sur TOUTES les scènes : textes assez grands, dans le cadre, sans chevauchement avec un autre texte, un trait, un noyau ou un amas d'atomes.
//  Code visuel (constant dans tout le parcours) : proton = disque rouge marqué +, neutron = disque blanc à contour gris, énergie libérée = orange, flèche de transformation = grise.
// ====================================================
import * as M from './nucleaire2gtModele.js';
import * as EQ from './equationReactionModele.js';
import { COL } from './nucleaire2gtCouleurs.js';

// ---------- mesure de texte (estimation prudente de la largeur d'un caractère, vérifiée dans le navigateur par le contrôle visuel) ----------
const car = c => (/[ilj'’.,:;!|()]/.test(c) ? 0.32 : /[mwMW]/.test(c) ? 0.9 : /[A-ZÉÈ]/.test(c) ? 0.7 : /[0-9]/.test(c) ? 0.6 : /[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/.test(c) ? 0.45 : /[→+=]/.test(c) ? 0.9 : 0.58);
export const largeur = (s, taille, gras = false) => [...s].reduce((a, c) => a + car(c) * taille * (gras ? 1.06 : 1), 0);
const boiteTexte = ({ x, y, s, taille, ancre = 'start', gras = false }) => {
  const w = largeur(s, taille, gras), x0 = ancre === 'middle' ? x - w / 2 : ancre === 'end' ? x - w : x, desc = /[gjpqy,;()]/.test(s) ? 0.24 : 0.04;
  return { x: x0, y: y - 0.76 * taille, w, h: (0.76 + desc) * taille };
};
// géométrie pour les tests
export const gonfler = (b, dx, dy) => ({ x: b.x - dx, y: b.y - dy, w: b.w + 2 * dx, h: b.h + 2 * dy });
export const boitesSeChevauchent = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const interSeg = (a, b, c, d) => {
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-12) return false;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};
export const boiteTouche = (b, p, q) => {
  const [x0, y0, x1, y1] = [b.x, b.y, b.x + b.w, b.y + b.h], dans = pt => pt[0] >= x0 && pt[0] <= x1 && pt[1] >= y0 && pt[1] <= y1;
  if (dans(p) || dans(q)) return true;
  const C = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  return [0, 1, 2, 3].some(i => interSeg(p, q, C[i], C[(i + 1) % 4]));
};
export const boiteTouheDisque = (b, cx, cy, R) => { const nx = Math.max(b.x, Math.min(cx, b.x + b.w)), ny = Math.max(b.y, Math.min(cy, b.y + b.h)); return Math.hypot(nx - cx, ny - cy) < R; };

// ---------- amas d'atomes (réutilise les dessins de la simulation 179) ----------
export function boiteAmas(id, cx, cy, u) {
  const e = EQ.ESPECES[id], pts = e.dessin.map(([el, x, y]) => ({ x: x * u, y: y * u, r: EQ.COULEUR[el].r * u }));
  const x0 = Math.min(...pts.map(p => p.x - p.r)), x1 = Math.max(...pts.map(p => p.x + p.r)), y0 = Math.min(...pts.map(p => p.y - p.r)), y1 = Math.max(...pts.map(p => p.y + p.r));
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  return { x: cx + x0 - mx, y: cy + y0 - my, w: x1 - x0, h: y1 - y0 };
}

// ---------- le constructeur de scène ----------
function creer(W, H) {
  const d = { W, H, items: [], textes: [], obstacles: [], disques: [], boites: [], noyaux: [] };
  const B = {
    d,
    texte(x, y, s, o = {}) {
      const t = { t: 'texte', x, y, s, taille: o.taille || (W >= 400 ? 20 : 14.5), ancre: o.ancre || 'start', gras: !!o.gras, c: o.c || COL.encre };
      t.boite = boiteTexte(t); t.sym = !!o.sym; t.libre = !!o.libre; t.id = o.id; d.items.push(t); d.textes.push(t); return t;
    },
    ligne(x1, y1, x2, y2, o = {}) { d.items.push({ t: 'ligne', x1, y1, x2, y2, c: o.c || COL.clair, w: o.w || 2, tirets: o.tirets }); if (!o.fond) d.obstacles.push([[x1, y1], [x2, y2]]); },
    fleche(x1, y1, x2, y2, o = {}) {
      const w = o.w || 4, L = o.tete || 13, a = Math.atan2(y2 - y1, x2 - x1), bx = x2 - L * Math.cos(a), by = y2 - L * Math.sin(a), px = -Math.sin(a), py = Math.cos(a);
      d.items.push({ t: 'fleche', x1, y1, x2: bx, y2: by, tete: [[x2, y2], [bx + px * L * 0.5, by + py * L * 0.5], [bx - px * L * 0.5, by - py * L * 0.5]], c: o.c || COL.gris, w });
      d.obstacles.push([[x1, y1], [x2, y2]]);
    },
    rect(x, y, w, h, o = {}) {
      d.items.push({ t: 'rect', x, y, w, h, rx: o.rx ?? 10, fill: o.fill || 'none', stroke: o.stroke || 'none', sw: o.sw || 2 });
      if (o.stroke && o.stroke !== 'none') { const P = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; for (let i = 0; i < 4; i++) d.obstacles.push([P[i], P[(i + 1) % 4]]); }
    },
    cercle(cx, cy, r, o = {}) { d.items.push({ t: 'cercle', cx, cy, r, fill: o.fill || 'white', stroke: o.stroke || COL.gris, sw: o.sw || 2, plus: !!o.plus }); d.disques.push([cx, cy, r]); },
    noyau(cx, cy, Z, A, r) {
      const { R } = M.nucleonsC(Z, A);
      d.items.push({ t: 'noyau', cx, cy, Z, A, r, R: R * r }); d.noyaux.push({ cx, cy, Z, A, r, R: R * r }); d.disques.push([cx, cy, R * r]); return R * r;
    },
    amas(id, cx, cy, u, police = 13) { d.items.push({ t: 'amas', id, cx, cy, u, police }); d.boites.push(boiteAmas(id, cx, cy, u)); },
    picto(kind, cx, cy, s) { d.items.push({ t: 'picto', kind, cx, cy, s }); d.boites.push({ x: cx - s, y: cy - s, w: 2 * s, h: 2 * s }); },
    coche(cx, cy, s, ok) {
      d.items.push({ t: 'coche', cx, cy, s, ok });
      d.boites.push({ x: cx - s, y: cy - s, w: 2 * s, h: 2 * s });
    },
    // symbole A Z X : A au-dessus de Z, à gauche du symbole de l'élément ; pre = coefficient écrit devant
    sym(x, y, Z, A, taille = 34, o = {}) {
      const X = M.sym(Z), fA = Math.round(taille * 0.56 * 10) / 10, wn = Math.max(String(A).length, String(Z).length) * fA * 0.6 + 1, wX = largeur(X, taille, true), pre = o.pre ? `${o.pre}` : '', wp = pre ? largeur(pre, taille, true) + taille * 0.3 : 0;
      const total = wp + wn + 3 + wX, x0 = (o.ancre || 'middle') === 'middle' ? x - total / 2 : x;
      const c = o.c || COL.encre;
      if (pre) B.texte(x0, y + 0.3 * taille, pre, { sym: true, taille, gras: true, c });
      B.texte(x0 + wp + wn, y - 0.36 * taille, String(A), { sym: true, taille: fA, ancre: 'end', gras: true, c });
      B.texte(x0 + wp + wn, y + 0.16 * taille, String(Z), { sym: true, taille: fA, ancre: 'end', gras: true, c });
      B.texte(x0 + wp + wn + 3, y + 0.3 * taille, X, { sym: true, taille, gras: true, c });
      return { x0, x1: x0 + total };
    },
  };
  return B;
}
const fin = B => B.d;

// ---------- une rangée de noyaux : noyau, +, →, … ----------
// elems : { n:{Z,A}, coef, lab:[lignes], sym:true } | { op:'+' } | { op:'→' } ; renvoie les positions
function rangee(B, y, elems, o) {
  const { r, rN = r, gapOp = 14, fleche = 64, xDebut = null, tailleOp = 26, ySym = null, yLab = null } = o;
  const larg0 = e => {
    if (e.op === '+') return tailleOp * 0.9 + 2 * gapOp;
    if (e.op === '→') return fleche + 2 * gapOp * 0.5;
    const rr = e.n.Z === 0 ? rN : r, R = M.nucleonsC(e.n.Z, e.n.A).R * rr; return (e.coef || 1) * 2 * R + ((e.coef || 1) - 1) * 6;
  };
  const total = elems.reduce((a, e) => a + larg0(e), 0), W = B.d.W;
  let x = xDebut ?? (W - total) / 2; const pos = [];
  const Rmax = Math.max(...elems.filter(e => e.n).map(e => M.nucleonsC(e.n.Z, e.n.A).R * (e.n.Z === 0 ? rN : r)));
  for (const e of elems) {
    const w = larg0(e);
    if (e.op === '+') { B.texte(x + w / 2, y + tailleOp * 0.33, '+', { taille: tailleOp, ancre: 'middle', gras: true, c: COL.gris }); pos.push({ op: '+', cx: x + w / 2 }); }
    else if (e.op === '→') { B.fleche(x + gapOp * 0.5, y, x + w - gapOp * 0.5, y, { c: COL.gris, w: 4, tete: 14 }); pos.push({ op: '→', cx: x + w / 2, x1: x + gapOp * 0.5, x2: x + w - gapOp * 0.5 }); }
    else {
      const rr = e.n.Z === 0 ? rN : r, R = M.nucleonsC(e.n.Z, e.n.A).R * rr, copies = e.coef || 1, cxs = [];
      for (let k = 0; k < copies; k++) { const cx = x + R + k * (2 * R + 6); B.noyau(cx, y, e.n.Z, e.n.A, rr); cxs.push(cx); }
      const cm = (cxs[0] + cxs[cxs.length - 1]) / 2;
      if (e.sym) B.sym(cm, ySym ?? y + Rmax + 36, e.n.Z, e.n.A, o.tailleSym || 34, { pre: copies > 1 ? copies : null });
      (e.lab || []).forEach((l, k) => B.texte(cm, (yLab ?? y + Rmax + 26) + k * 22, l, { ancre: 'middle', taille: o.tailleLab || 20, c: COL.encre }));
      pos.push({ n: e.n, cx: cm, R, cxs });
    }
    x += w;
  }
  return { pos, total, Rmax, x0: (xDebut ?? (W - total) / 2), x1: (xDebut ?? (W - total) / 2) + total };
}
const N = (Z, A, ex = {}) => ({ n: { Z, A }, ...ex });
const PLUS = { op: '+' }, FL = { op: '→' };

// légende : proton, neutron
function legendeParticules(B, y, x0 = 24, taille = 20) {
  B.cercle(x0, y - 6, 9, { fill: COL.proton, stroke: COL.protonTrait, plus: true });
  B.texte(x0 + 16, y, 'proton', { taille });
  const x1 = x0 + 16 + largeur('proton', taille) + 34;
  B.cercle(x1, y - 6, 9, { fill: COL.neutron, stroke: COL.neutronTrait });
  B.texte(x1 + 16, y, 'neutron', { taille });
}

// ====================================================
//  SCÈNES DU PARCOURS (viewBox de 480 de large)
// ====================================================
export const SCENES = {
  // étape 1 : trois noyaux d'hydrogène
  isoH() {
    const B = creer(480, 290), cx = [80, 240, 400];
    [[1, 1], [1, 2], [1, 3]].forEach(([Z, A], k) => { B.noyau(cx[k], 84, Z, A, 16); B.sym(cx[k], 158, Z, A, 36); B.texte(cx[k], 212, `hydrogène ${A}`, { ancre: 'middle', taille: 20 }); });
    legendeParticules(B, 270);
    return fin(B);
  },
  // étape 2 : quatre noyaux
  quatre() {
    const B = creer(480, 270);
    const cx = [60, 180, 300, 420], noy = [[6, 14], [7, 14], [8, 16], [8, 17]];
    noy.forEach(([Z, A], k) => { B.noyau(cx[k], 70, Z, A, 7.4); B.sym(cx[k], 168, Z, A, 36); });
    legendeParticules(B, 250);
    return fin(B);
  },
  // étape 3 : transformation physique et transformation chimique (atomes de la simulation 179)
  physChim() {
    const B = creer(480, 340), u = 18;
    B.texte(14, 28, 'Transformation physique', { gras: true, taille: 20 });
    B.texte(14, 52, 'les molécules d’eau restent les mêmes', { taille: 18, c: COL.gris });
    [[60, 88], [118, 88], [60, 130], [118, 130]].forEach(([x, y]) => B.amas('H2O_l', x, y, u, 16));
    B.fleche(175, 110, 240, 110, { c: COL.gris, w: 4 });
    [[295, 86], [378, 98], [322, 136], [422, 126]].forEach(([x, y]) => B.amas('H2O_l', x, y, u, 16));
    B.ligne(14, 170, 466, 170, { c: COL.bord, w: 2, fond: true });
    B.texte(14, 200, 'Transformation chimique', { gras: true, taille: 20 });
    B.texte(14, 224, 'de nouvelles molécules apparaissent', { taille: 18, c: COL.gris });
    // CH4 + 2 O2 → CO2 + 2 H2O (largeurs lues sur les dessins)
    const seq = ['CH4', '+', 'O2', 'O2', 'fl', 'CO2', '+', 'H2O_g', 'H2O_g'], wid = id => boiteAmas(id, 0, 0, u).w, y = 292;
    const total = seq.reduce((a, s2) => a + (s2 === '+' ? 30 : s2 === 'fl' ? 62 : wid(s2) + 8), 0);
    let x = (480 - total) / 2;
    for (const s2 of seq) {
      if (s2 === '+') { B.texte(x + 15, y + 8, '+', { taille: 24, ancre: 'middle', gras: true, c: COL.gris }); x += 30; }
      else if (s2 === 'fl') { B.fleche(x + 4, y, x + 52, y, { c: COL.gris, w: 4 }); x += 62; }
      else { B.amas(s2, x + wid(s2) / 2, y, u, 16); x += wid(s2) + 8; }
    }
    return fin(B);
  },
  // étape 5 : fusion, avec symboles
  fusion() { return fusion({ sym: true }); },
  // étape 6 : fission
  fission() { return fission(); },
  // étape 4 : fusion et fission, noyaux sans symboles (le vocabulaire est donné par les titres)
  fusionFission() {
    const B = creer(480, 330);
    B.texte(14, 30, 'Fusion', { gras: true, taille: 22, c: COL.orange });
    rangee(B, 84, [N(1, 2), PLUS, N(1, 3), FL, N(2, 4), PLUS, N(0, 1)], { r: 8, rN: 8, fleche: 52, gapOp: 10, tailleOp: 24 });
    B.ligne(14, 150, 466, 150, { c: COL.bord, w: 2, fond: true });
    B.texte(14, 186, 'Fission', { gras: true, taille: 22, c: COL.orange });
    rangee(B, 256, [N(0, 1), PLUS, N(92, 235), FL, N(38, 94), PLUS, N(54, 140), PLUS, N(0, 1, { coef: 2 })], { r: 2.5, rN: 6, fleche: 44, gapOp: 8, tailleOp: 24 });
    return fin(B);
  },
  // étape 7 : chaîne énergétique de la centrale (la forme d'énergie de l'eau est masquée)
  chaine() { return chaine({ masque: true, W: 480 }); },
  // étape 8 : deux combustibles
  energie() {
    const B = creer(480, 232);
    B.rect(12, 10, 456, 100, { fill: '#f8fafc', stroke: COL.bord, sw: 2 });
    B.texte(28, 42, '1\u00a0kg de charbon qui brûle', { gras: true, taille: 21 });
    B.texte(28, 70, 'transformation chimique', { taille: 19, c: COL.gris });
    B.texte(28, 98, 'énergie libérée : ?', { taille: 19, c: COL.orange, gras: true });
    B.rect(12, 122, 456, 100, { fill: '#f8fafc', stroke: COL.bord, sw: 2 });
    B.texte(28, 154, '1\u00a0kg d’uranium 235 qui se casse', { gras: true, taille: 21 });
    B.texte(28, 182, 'transformation nucléaire', { taille: 19, c: COL.gris });
    B.texte(28, 210, 'énergie libérée : ?', { taille: 19, c: COL.orange, gras: true });
    return fin(B);
  },
  // étape 10 : les trois natures
  bilan() { return tableauNatures({ W: 480 }); },
};

function fusion({ sym, reaction = M.REACTIONS.dt }) {
  const B = creer(480, sym ? 232 : 236), y = 96, [g1, g2] = reaction.gauche, [d1, d2] = reaction.droite;
  const r = rangee(B, y, [N(g1.Z, g1.A, sym ? { sym: true } : {}), PLUS, N(g2.Z, g2.A, sym ? { sym: true } : {}), FL, N(d1.Z, d1.A, sym ? { sym: true } : { lab: ['noyau', 'd’hélium'] }), PLUS, N(d2.Z, d2.A, sym ? { sym: true } : { lab: ['neutron'] })],
    { r: 11, rN: 11, fleche: 60, gapOp: 10, tailleOp: 26, ySym: 176, yLab: 166, tailleSym: 36 });
  if (!sym) {
    const a = r.pos[0].cx, b = r.pos[2].cx, m = (a + b) / 2;
    B.texte(m, 166, 'noyaux', { ancre: 'middle', taille: 20 }); B.texte(m, 188, 'd’hydrogène', { ancre: 'middle', taille: 20 });
  }
  // énergie libérée, au-dessus de la flèche
  B.texte(r.pos[3].cx, 40, 'énergie libérée', { ancre: 'middle', taille: 20, gras: true, c: COL.orange });
  return fin(B);
}

function fission(reaction = M.REACTIONS.fissionSr) {
  const B = creer(480, 372), r = 3.2, rN = 7, [u0, n0g] = reaction.gauche, [f1, f2, nd] = reaction.droite;
  // avant : neutron + uranium 235
  const a = rangee(B, 74, [N(n0g.Z, n0g.A), PLUS, N(u0.Z, u0.A)], { r, rN, gapOp: 14, tailleOp: 26, xDebut: 64 });
  const u = a.pos[2], n0 = a.pos[0];
  B.sym(n0.cx, 74 + 56, 0, 1, 34); B.sym(u.cx + u.R + 56, 78, u0.Z, u0.A, 38);
  B.fleche(u.cx, 74 + u.R + 8, u.cx, 74 + u.R + 50, { c: COL.gris, w: 4 });
  // après : deux noyaux plus petits + neutrons + énergie
  const y2 = 244;
  const b = rangee(B, y2, [N(f1.Z, f1.A, { sym: true }), PLUS, N(f2.Z, f2.A, { sym: true }), PLUS, N(0, 1, { coef: nd.c, sym: true })], { r, rN, gapOp: 10, tailleOp: 24, xDebut: 14, ySym: 336, tailleSym: 34 });
  B.texte(Math.max(b.x1 + 10, 352), y2 + 8, '+ énergie', { taille: 20, gras: true, c: COL.orange });
  return fin(B);
}

// ---------- chaîne énergétique d'une centrale ----------
function chaine({ masque, W }) {
  const carte = W < 400, fs = carte ? 14.5 : 20, fs2 = carte ? 13.5 : 18, hB = carte ? 50 : 60, gap = carte ? 22 : 26, mx = carte ? 12 : 14, wB = W - 2 * mx, ps = carte ? 15 : 20;
  const noms = [['Cœur du réacteur', carte ? 'énergie nucléaire (fission)' : 'énergie nucléaire (fission de l’uranium)', 'reacteur'], ['Eau chauffée en vapeur', masque ? 'énergie : ?' : 'énergie thermique (chaleur)', 'vapeur'],
    ['Turbine qui tourne', 'énergie de mouvement', 'turbine'], ['Alternateur', 'énergie électrique', 'alternateur']];
  const H = 12 + noms.length * hB + (noms.length - 1) * gap + 12 + (carte ? 58 : 0), B = creer(W, H);
  noms.forEach(([t1, t2, pic], k) => {
    const y = 12 + k * (hB + gap), xt = mx + 2 * ps + 26;
    B.rect(mx, y, wB, hB, { fill: k === 1 && masque ? '#fffbeb' : '#f8fafc', stroke: k === 1 && masque ? COL.orange : COL.bleu, sw: 2 });
    B.picto(pic, mx + ps + 14, y + hB / 2, ps);
    if (k === 3 && !carte) B.picto('pylone', mx + wB - ps - 14, y + hB / 2, ps);
    B.texte(xt, y + hB * 0.43, t1, { gras: true, taille: fs }); B.texte(xt, y + hB * 0.82, t2, { taille: fs2, c: k === 1 && masque ? COL.orange : COL.gris, gras: k === 1 && masque });
    if (k < noms.length - 1) B.fleche(W / 2, y + hB + 2, W / 2, y + hB + gap - 2, { c: COL.gris, w: 4, tete: 11 });
  });
  if (carte) {
    const y = 12 + noms.length * hB + (noms.length - 1) * gap + 12;
    B.texte(W / 2, y + 8, 'nucléaire → thermique →', { ancre: 'middle', taille: 15, gras: true, c: COL.encre });
    B.texte(W / 2, y + 28, 'mouvement → électrique', { ancre: 'middle', taille: 15, gras: true, c: COL.encre });
  }
  return fin(B);
}

// ---------- tableau des trois natures ----------
function tableauNatures({ W }) {
  const carte = W < 400, fs = carte ? 14.5 : 20, fh = carte ? 13.5 : 18;
  const colx = carte ? [133, 203, 263] : [220, 318, 410], x0 = carte ? 10 : 14;
  const H = carte ? 236 : 272, B = creer(W, H);
  B.texte(W / 2, carte ? 22 : 28, 'Identique avant et après ?', { ancre: 'middle', taille: carte ? 14.5 : 19, gras: true });
  ['molécules', 'atomes', 'noyaux'].forEach((t, k) => B.texte(colx[k], carte ? 52 : 66, t, { ancre: 'middle', taille: fh, c: COL.gris, gras: true }));
  const lignes = [['physique', 'physique'], ['chimique', 'chimique'], ['nucléaire', 'nucleaire']], pas = carte ? 56 : 62, y0 = carte ? 62 : 80;
  lignes.forEach(([lab, id], i) => {
    const yc = y0 + pas * i + (carte ? 28 : 31);
    B.rect(x0, y0 + pas * i + 2, W - 2 * x0, pas - 6, { fill: i === 2 ? '#fff7ed' : '#f8fafc', stroke: i === 2 ? COL.orange : COL.bord, sw: 1.6, rx: 8 });
    B.texte(x0 + 8, yc + fs * 0.34, lab, { taille: fs, gras: true, c: i === 2 ? COL.orange : COL.encre });
    ['molecules', 'atomes', 'noyaux'].forEach((k, j) => B.coche(colx[j], yc, carte ? 9 : 12, M.CONSERVE[id][k]));
  });
  return fin(B);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox de 300 de large, textes ≥ 13)
// ====================================================
export const CARTES = {
  // isotopes : carbone 12, 13, 14
  isotopes() {
    const B = creer(300, 262);
    [[6, 12], [6, 13], [6, 14]].forEach(([Z, A], k) => { const cx = 50 + 100 * k; B.noyau(cx, 52, Z, A, 6.2); B.sym(cx, 132, Z, A, 28); B.texte(cx, 160, `carbone ${A}`, { ancre: 'middle', taille: 14 }); });
    B.rect(8, 178, 284, 76, { fill: '#eff6ff', stroke: COL.bleu, sw: 1.6 });
    B.texte(150, 202, 'iso = même, topos = place', { ancre: 'middle', taille: 15, gras: true, c: COL.bleu });
    B.texte(150, 224, 'même Z : même élément,', { ancre: 'middle', taille: 15 });
    B.texte(150, 244, 'A différent : isotopes', { ancre: 'middle', taille: 15 });
    return fin(B);
  },
  natures() { return tableauNatures({ W: 300 }); },
  // fusion
  fusion() {
    const B = creer(300, 284);
    const r = rangee(B, 76, [N(1, 2, { sym: true }), PLUS, N(1, 3, { sym: true }), FL, N(2, 4, { sym: true }), PLUS, N(0, 1, { sym: true })], { r: 7, rN: 7, fleche: 34, gapOp: 4, tailleOp: 20, ySym: 128, tailleSym: 24 });
    B.texte(r.pos[3].cx, 26, 'énergie', { ancre: 'middle', taille: 14.5, gras: true, c: COL.orange });
    B.rect(8, 156, 284, 122, { fill: '#fff7ed', stroke: COL.orange, sw: 1.6 });
    B.texte(150, 180, 'Fusion : de petits noyaux', { ancre: 'middle', taille: 15, gras: true });
    B.texte(150, 201, 's’assemblent en un gros', { ancre: 'middle', taille: 15, gras: true });
    B.texte(150, 226, 'La fusion est la source', { ancre: 'middle', taille: 14.5 });
    B.texte(150, 246, 'd’énergie des étoiles. Exemple', { ancre: 'middle', taille: 14.5 });
    B.texte(150, 266, 'simplifié : pas la chaîne du Soleil', { ancre: 'middle', taille: 14.5 });
    return fin(B);
  },
  // fission
  fission() {
    const B = creer(300, 340), r = 2.4;
    const a = rangee(B, 52, [N(0, 1), PLUS, N(92, 235)], { r, rN: 5, gapOp: 8, tailleOp: 20, xDebut: 40 });
    const u = a.pos[2];
    B.fleche(u.cx, 52 + u.R + 6, u.cx, 52 + u.R + 34, { c: COL.gris, w: 3, tete: 10 });
    const y2 = 172;
    const b = rangee(B, y2, [N(38, 94), PLUS, N(54, 140), PLUS, N(0, 1, { coef: 2 })], { r, rN: 5, gapOp: 4, tailleOp: 20, xDebut: 12 });
    B.texte(150, y2 + b.Rmax + 17, '+ énergie', { ancre: 'middle', taille: 14.5, gras: true, c: COL.orange });
    B.rect(8, 238, 284, 98, { fill: '#fff7ed', stroke: COL.orange, sw: 1.6 });
    B.texte(150, 262, 'Fission : un gros noyau,', { ancre: 'middle', taille: 15, gras: true });
    B.texte(150, 283, 'frappé par un neutron,', { ancre: 'middle', taille: 15, gras: true });
    B.texte(150, 304, 'se casse en noyaux plus petits', { ancre: 'middle', taille: 15, gras: true });
    B.texte(150, 328, 'C’est la source des centrales', { ancre: 'middle', taille: 14.5 });
    return fin(B);
  },
  chaine() { return chaine({ masque: false, W: 300 }); },
  // reconnaître la nature d'une écriture
  reconnaitre() {
    const B = creer(300, 272), y1 = 44, y2 = 130, y3 = 214;
    B.rect(8, 8, 284, 74, { fill: '#f8fafc', stroke: COL.bord, sw: 1.6 });
    B.texte(18, 30, 'Physique', { taille: 15, gras: true, c: COL.bleu });
    B.texte(150, 62, 'H₂O(l) → H₂O(g)', { ancre: 'middle', taille: 17, gras: true });
    B.rect(8, 92, 284, 74, { fill: '#f8fafc', stroke: COL.bord, sw: 1.6 });
    B.texte(18, 114, 'Chimique', { taille: 15, gras: true, c: COL.vert });
    B.texte(150, 148, 'Zn + 2 H⁺ → Zn²⁺ + H₂', { ancre: 'middle', taille: 17, gras: true });
    B.rect(8, 176, 284, 90, { fill: '#fff7ed', stroke: COL.orange, sw: 1.6 });
    B.texte(18, 198, 'Nucléaire', { taille: 15, gras: true, c: COL.orange });
    const s = (x, Z, A) => B.sym(x, 240, Z, A, 24, { ancre: 'middle' });
    s(46, 1, 2); B.texte(80, 247, '+', { ancre: 'middle', taille: 20, gras: true, c: COL.gris }); s(114, 1, 3); B.texte(150, 247, '→', { ancre: 'middle', taille: 20, gras: true, c: COL.gris }); s(188, 2, 4); B.texte(224, 247, '+', { ancre: 'middle', taille: 20, gras: true, c: COL.gris }); s(256, 0, 1);
    void y1; void y2; void y3;
    return fin(B);
  },
};
export const toutes = () => ({ ...Object.fromEntries(Object.entries(SCENES).map(([k, f]) => ['scène ' + k, f()])), ...Object.fromEntries(Object.entries(CARTES).map(([k, f]) => ['carte ' + k, f()])) });

// ---------- exploration : tous les isotopes d'un élément, côte à côte ----------
export function rangeeIsotopes(Z) {
  const iso = M.isotopesDe(Z), k = iso.length, W = 480, colw = W / k;
  const Rm = Math.max(...iso.map(n => M.nucleonsC(n.Z, n.A).R));
  const r = Math.max(2.2, Math.min(14, (colw / 2 - 8) / Rm, 74 / Rm)), cy = 14 + Rm * r, H = Math.round(cy + Rm * r + 72), B = creer(W, H);
  iso.forEach((n, i) => { const cx = colw * (i + 0.5); B.noyau(cx, cy, n.Z, n.A, r); B.sym(cx, cy + Rm * r + 36, n.Z, n.A, 34); });
  return fin(B);
}
// ---------- exploration : une réaction nucléaire dessinée (échelle commune choisie pour que tout tienne) ----------
export function dessinReaction(r) { return r.type === 'fission' ? fission(r) : fusion({ sym: true, reaction: r }); }
