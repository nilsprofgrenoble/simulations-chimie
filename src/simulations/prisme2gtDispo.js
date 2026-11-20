// ====================================================
//  Mise en page des schémas de la simulation 201 (prisme) : tout est CALCULÉ à partir du modèle (prisme2gtModele.js).
//  dispo(cfg) renvoie des primitives (lignes, flèches, arcs, polygones, textes) en pixels du viewBox ; Prisme2gtScenes.jsx les dessine.
//  Les étiquettes sont placées automatiquement : on essaie plusieurs positions autour de leur point d'ancrage et on garde la première qui ne
//  touche ni un trait, ni un arc, ni une autre étiquette, ni le bord du schéma (prisme2gtDispo.test.mjs vérifie le résultat sur toutes les scènes).
//  Échelle : la même en horizontal et en vertical (1 cm du schéma = k pixels) ; une règle de 1 cm est dessinée quand cfg.echelle est vrai.
//  Code visuel (constant dans tout le parcours) : rayon = trait plein de la couleur de la lumière ; lumière blanche = trait blanc bordé de gris foncé ;
//  prolongement sans prisme et normale = pointillés ; flèche au milieu de chaque trajet ; écran = trait épais gris foncé ; prisme = verre bleu pâle.
// ====================================================
import * as M from './prisme2gtModele.js';

const RAD = Math.PI / 180;
export const FENETRES = {
  complet: { x0: -5.3, x1: 8.3, y0: -4.2, y1: 4.2 },        // schéma d'ensemble (≈ 40 px/cm sur 480)
  entree: { x0: -3.7, x1: 0.9, y0: 0.2, y1: 3.3 },          // zoom sur la face d'entrée
  sortie: { x0: -1.0, x1: 3.6, y0: -0.7, y1: 2.8 },         // zoom sur la face de sortie
  carte: { x0: -4.8, x1: 7.7, y0: -2.6, y1: 4.0 },          // schéma de carte « À retenir » (viewBox 300)
  carteEntree: { x0: -3.4, x1: 1.0, y0: 0.35, y1: 3.1 },
  carteDeux: { x0: -3.7, x1: 7.6, y0: -2.3, y1: 3.8 },        // carte « deux faces » : le prisme et ses deux normales, en plus gros
  lampe: { x0: -5.3, x1: 8.3, y0: -2.6, y1: 4.2 },            // lampe à vapeur : le schéma est plus bas, la bande-spectre agrandie est dessinée dessous
};

// segment [p, q] coupé par le rectangle (Liang–Barsky) ; renvoie null s'il est entièrement dehors
function couper(p, q, r) {
  let t0 = 0, t1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
  for (const [pp, qq] of [[-dx, p[0] - r.x0], [dx, r.x1 - p[0]], [-dy, p[1] - r.ya], [dy, r.yb - p[1]]]) {
    if (pp === 0) { if (qq < 0) return null; } else { const t = qq / pp; if (pp < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; } }
  }
  return [[p[0] + t0 * dx, p[1] + t0 * dy], [p[0] + t1 * dx, p[1] + t1 * dy]];
}
const interSeg = (a, b, c, d) => {            // intersection de deux segments (a-b) et (c-d)
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-12) return false;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};
export const boiteTouche = (b, p, q) => {      // une boîte {x,y,w,h} touche-t-elle le segment p-q ?
  const [x0, y0, x1, y1] = [b.x, b.y, b.x + b.w, b.y + b.h];
  const dans = pt => pt[0] >= x0 && pt[0] <= x1 && pt[1] >= y0 && pt[1] <= y1;
  if (dans(p) || dans(q)) return true;
  const C = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  return [0, 1, 2, 3].some(i => interSeg(p, q, C[i], C[(i + 1) % 4]));
};
export const boitesSeChevauchent = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const largeurTexte = (t, taille) => [...t].length * taille * 0.66;

export function dispo(cfg) {
  const W = cfg.W || 480, fs = cfg.fs || 18, ech = fs / 18;
  const fen = cfg.fenetre, k = W / (fen.x1 - fen.x0), H = Math.round((fen.y1 - fen.y0) * k + (cfg.bas || 0)), yTop = fen.y1;
  const PX = ([x, y]) => [(x - fen.x0) * k, (yTop - y) * k];
  const VPX = ([x, y]) => [x, -y];                                    // vecteur cm → vecteur écran (y vers le bas)
  const zone = { x0: fen.x0, x1: fen.x1, ya: fen.y0, yb: fen.y1 };
  const f = cfg.f ?? 1, i1 = cfg.i1 ?? 50;
  const lignes = [], fleches = [], arcs = [], polys = [], textes = [], taches = [], obstacles = [];
  const lw = (cfg.lw || 3.2) * ech;
  const ajouterLigne = (pCm, qCm, o) => {                              // ligne en cm, coupée par la fenêtre
    const c = couper(pCm, qCm, zone); if (!c) return null;
    const p = PX(c[0]), q = PX(c[1]);
    lignes.push({ x1: p[0], y1: p[1], x2: q[0], y2: q[1], ...o }); if (!o.fond) obstacles.push([p, q]);
    return { p, q, cm: c };
  };
  const fleche = (seg, o) => {                                          // flèche au milieu d'un trajet (en pixels), orientée de p vers q
    if (!seg) return; const { p, q } = seg, dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
    if (L < 30 * ech) return;
    fleches.push({ x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, ang: Math.atan2(dy, dx), ...o });
  };
  const trait = (pCm, qCm, couleur, o = {}) => {
    const sg = ajouterLigne(pCm, qCm, { couleur, largeur: lw, ...o });
    if (sg && o.fleche !== false) fleche(sg, { couleur: o.blanc ? '#ffffff' : couleur, bord: o.blanc ? '#334155' : null });
    return sg;
  };

  // ---------- écran ----------
  const ecran = cfg.ecran !== false && cfg.ecran !== null ? cfg.ecran || { y0: -2.1, y1: 4.1 } : null;
  if (ecran) ajouterLigne([M.X_ECRAN, ecran.y0], [M.X_ECRAN, ecran.y1], { couleur: '#1e293b', largeur: 7 * ech, ecran: true });
  // ---------- prisme ----------
  const S = M.SOMMETS, pr = [S.L, S.R, S.T].map(PX);
  polys.push({ points: pr, fill: '#dbeafe', stroke: '#1e3a8a', largeur: 2.6 * ech });
  for (let i = 0; i < 3; i++) obstacles.push([pr[i], pr[(i + 1) % 3]]);

  // ---------- normales ----------
  const P1 = M.P_ENTREE, tr0 = M.trajet(i1, 589, f);
  const P2ref = tr0 ? tr0.P2 : [1, 1.7];
  const Lnorm = cfg.longueurNormale ?? 1.25;
  const normale = (P, N, nom) => {
    ajouterLigne([P[0] - N[0] * Lnorm, P[1] - N[1] * Lnorm], [P[0] + N[0] * Lnorm, P[1] + N[1] * Lnorm], { couleur: '#475569', largeur: 2 * ech, tirets: `${5 * ech} ${5 * ech}`, normale: nom });
  };
  if (cfg.normales === 'entree' || cfg.normales === 'deux') normale(P1, M.NORMALE_ENTREE, 'entree');
  if (cfg.normales === 'sortie' || cfg.normales === 'deux') normale(P2ref, M.NORMALE_SORTIE, 'sortie');

  // ---------- rayon incident ----------
  const dep = cfg.longueurDepart ?? M.DISTANCE_DEPART;
  const sp = M.sansPrisme(i1), d0 = sp.d0, A0 = [P1[0] - dep * d0[0], P1[1] - dep * d0[1]];
  const inc = cfg.incident || { type: 'blanc' };
  const incBlanc = inc.type === 'blanc', incNeutre = inc.type === 'neutre';
  let segInc = null;
  if (incBlanc) {
    ajouterLigne(A0, P1, { couleur: '#334155', largeur: lw * 1.9 });
    segInc = ajouterLigne(A0, P1, { couleur: '#ffffff', largeur: lw * 0.9 });
    fleche(segInc, { couleur: '#ffffff', bord: '#334155' });
  } else segInc = trait(A0, P1, incNeutre ? '#475569' : M.couleurRayon(inc.nm));
  if (cfg.prolongement) {
    const sg = ajouterLigne(P1, sp.P3, { couleur: '#334155', largeur: 2.4 * ech, tirets: `${3 * ech} ${6 * ech}` });
    if (sg) fleche(sg, { couleur: '#334155', bord: null });
  }

  // ---------- rayons colorés ----------
  // écart exagéré (cartes) : l'angle i₂ du rayon est éloigné de celui du rouge de exag fois sa vraie différence (mention « écart exagéré » sur le schéma)
  const exagerer = (t, r) => {
    if (!t || !r.exag || t.reflexionTotale) return t;
    const ref = M.trajet(i1, M.LAMBDA_ROUGE, f), i2 = ref.i2 + r.exag * (t.i2 - ref.i2), N0 = [-NE0[0], -NE0[1]];
    const sg = Math.sign(N0[0] * t.d1[1] - N0[1] * t.d1[0]) || 1, a = sg * i2 * RAD, d1 = [N0[0] * Math.cos(a) - N0[1] * Math.sin(a), N0[0] * Math.sin(a) + N0[1] * Math.cos(a)];
    const R = M.SOMMETS.R, u = [M.SOMMETS.T[0] - R[0], M.SOMMETS.T[1] - R[1]], det = d1[0] * (-u[1]) - d1[1] * (-u[0]), w = [R[0] - P1[0], R[1] - P1[1]], tt = (w[0] * (-u[1]) - w[1] * (-u[0])) / det;
    return { ...t, i2, d1, P2: [P1[0] + tt * d1[0], P1[1] + tt * d1[1]] };
  };
  const NE0 = M.NORMALE_ENTREE;
  const trajets = (cfg.rayons || []).map(r => ({ r, t: exagerer(M.trajet(i1, r.nm, f), r) }));
  const bande = cfg.bande ? M.BANDE.map(nm => ({ nm, t: M.trajet(i1, nm, f) })) : [];
  const sansDisp = !!cfg.bande && f === 0, tBlanc = sansDisp ? M.trajet(i1, 550, 0) : null;
  const tracerTrajet = (t, nm, o = {}) => {
    if (!t) return;
    const col = o.neutre ? '#475569' : M.couleurRayon(nm);
    if (o.dedans !== false) { const sg = ajouterLigne(t.P1, t.P2, { couleur: col, largeur: o.largeur || lw }); if (o.fleche !== false) fleche(sg, { couleur: col, bord: null }); }
    if (o.dehors !== false && t.P3) { const fin = o.jusquEcran === false ? [t.P2[0] + (t.d2[0]) * 1.6, t.P2[1] + t.d2[1] * 1.6] : t.P3; const sg = ajouterLigne(t.P2, fin, { couleur: col, largeur: o.largeur || lw }); if (o.fleche !== false) fleche(sg, { couleur: col, bord: null }); }
  };
  // la bande de lumière blanche : trait fin pour chaque radiation, flèches seulement sur les rayons du bord
  for (const { nm, t } of (sansDisp ? [] : bande)) if (t && t.P3) { ajouterLigne(t.P1, t.P2, { couleur: M.couleurRayon(nm), largeur: 1.5 * ech, fond: true }); ajouterLigne(t.P2, t.P3, { couleur: M.couleurRayon(nm), largeur: 1.8 * ech, fond: true }); }
  // verre sans dispersion : toutes les couleurs suivent le même trajet, la lumière reste blanche (faisceau blanc bordé de gris, tache blanche)
  const blancSeg = (a, b) => { ajouterLigne(a, b, { couleur: '#334155', largeur: lw * 1.9 }); const sg = ajouterLigne(a, b, { couleur: '#ffffff', largeur: lw * 0.9 }); fleche(sg, { couleur: '#ffffff', bord: '#334155' }); };
  if (tBlanc && tBlanc.P3) { blancSeg(tBlanc.P1, tBlanc.P2); blancSeg(tBlanc.P2, tBlanc.P3); }
  for (const { r, t } of trajets) if (!r.sansTrait) tracerTrajet(t, r.nm, r);
  if (cfg.faisceauUnique && trajets.length) { const nmm = trajets.reduce((a, x) => a + x.r.nm, 0) / trajets.length; tracerTrajet(M.trajet(i1, nmm, f), nmm, { neutre: true }); }
  // arêtes de la bande (rouge et violet) : traits pleins fléchés
  if (cfg.bande && !sansDisp && cfg.aretes !== false) for (const nm of [M.LAMBDA_VIOLET, M.LAMBDA_ROUGE]) tracerTrajet(M.trajet(i1, nm, f), nm, { largeur: lw * 0.9 });

  // ---------- taches sur l'écran ----------
  if (ecran) {
    if (sansDisp && tBlanc && tBlanc.P3) { const c = PX(tBlanc.P3); taches.push({ x: c[0], y: c[1], r: 7 * ech, couleur: '#ffffff', nm: 0 }); }
    else if (cfg.bande) {
      const pts = bande.filter(b => b.t && b.t.P3).map(b => ({ nm: b.nm, y: b.t.P3[1] })), g = pts.length > 1 ? Math.abs(pts[1].y - pts[0].y) : 0.05;
      for (const p of pts) { const a = PX([M.X_ECRAN, p.y + g / 2 + 0.004]), b = PX([M.X_ECRAN, p.y - g / 2 - 0.004]); lignes.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], couleur: M.couleurClaire(p.nm), largeur: 11 * ech, tache: true }); }
    }
    for (const { r, t } of trajets) {
      if (!t || !t.P3) continue; const c = PX(t.P3);
      if (r.raie) lignes.push({ x1: c[0], y1: c[1] - 2.2 * ech, x2: c[0], y2: c[1] + 2.2 * ech, couleur: M.couleurClaire(r.nm), largeur: 12 * ech, tache: true });
      else taches.push({ x: c[0], y: c[1], r: 5 * ech, couleur: r.neutre ? '#94a3b8' : M.couleurClaire(r.nm), nm: r.nm });
    }
  }

  // ---------- arcs d'angles ----------
  const arcAngle = (C, dA, dB, rcm, couleur, texte, o = {}) => {        // arc centré en C (cm) entre les directions dA et dB (vecteurs cm)
    const c = PX(C), a = VPX(dA), b = VPX(dB), r = rcm * k;
    const a0 = Math.atan2(a[1], a[0]), a1 = Math.atan2(b[1], b[0]);
    let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    arcs.push({ cx: c[0], cy: c[1], r, a0, a1: a0 + da, couleur, largeur: 2.6 * ech });
    const pts = []; for (let s = 0; s <= 12; s++) { const aa = a0 + da * s / 12; pts.push([c[0] + r * Math.cos(aa), c[1] + r * Math.sin(aa)]); }
    for (let s = 0; s < 12; s++) obstacles.push([pts[s], pts[s + 1]]);
    if (texte) { const am = o.finArc ? a0 + da : a0 + da / 2; etiquettes.push({ texte, ancre: [c[0] + (r + 3) * Math.cos(am), c[1] + (r + 3) * Math.sin(am)], couleur, taille: o.taille || fs, prefs: o.prefs || [[Math.cos(am), Math.sin(am)]], gras: true, ang: true }); }
  };
  const etiquettes = [];
  const NE = M.NORMALE_ENTREE, NS = M.NORMALE_SORTIE, neg = v => [-v[0], -v[1]];
  const rAng = cfg.rayonArc ?? (k > 70 ? 1.1 : 0.8);
  if (cfg.arcs || trajets.some(x => x.r.arcs)) {
    const a = cfg.arcs || {};
    if (a.i1) arcAngle(P1, neg(d0), NE, rAng, '#334155', a.i1 === true ? 'i₁' : a.i1);
    for (const [i, { r, t }] of trajets.entries()) {
      if (!t) continue; const rr = rAng * (1 + 0.38 * (r.rangArc || 0));
      if (r.arcs && r.arcs.i2) arcAngle(P1, neg(NE), t.d1, rr, M.couleurRayon(r.nm), r.arcs.i2 === true ? 'i₂' : r.arcs.i2, { prefs: r.prefsArc, finArc: !!r.prefsArc });
      if (r.arcs && r.arcs.i3) arcAngle(t.P2, neg(t.d1), neg(NS), rr, M.couleurRayon(r.nm), r.arcs.i3 === true ? 'i₃' : r.arcs.i3);
      if (r.arcs && r.arcs.i4) arcAngle(t.P2, t.d2, NS, rr, M.couleurRayon(r.nm), r.arcs.i4 === true ? 'i₄' : r.arcs.i4, { prefs: r.prefsArc, finArc: !!r.prefsArc });
      if (r.arcs && r.arcs.D && t.d2) {
        // déviation : angle entre la direction de départ (droite en pointillés menée par la sortie) et la direction de sortie
        arcAngle(t.P2, d0, t.d2, 0.9 + 0.55 * (r.rangArc || 0), M.couleurRayon(r.nm), 'D');
      }
      void i;
    }
    if (a.D) { const t = trajets.find(x => x.t); if (t) ajouterLigne(t.t.P2, [t.t.P2[0] + d0[0] * 3.2, t.t.P2[1] + d0[1] * 3.2], { couleur: '#334155', largeur: 2.2 * ech, tirets: `${3 * ech} ${6 * ech}` }); }
  }

  // règle d'échelle
  const Hsc = H - (cfg.barreRaies ? (cfg.bas || 0) : 0);        // hauteur du schéma sans la bande-spectre
  let regle = null;
  if (cfg.echelle) { const x0 = 12 * ech, y0 = Hsc - 16 * ech; regle = { x1: x0, x2: x0 + k, y: y0, texte: '1 cm', taille: fs }; }
  // légende des déviations (lignes de texte avec pastille de couleur) : sous le schéma
  const legende = cfg.legende ? cfg.legende.map((l, j) => ({ ...l, x: 16 * ech, y: H - (cfg.legende.length - j) * (fs + 7) - (cfg.echelle ? 28 * ech : 6), taille: fs })) : null;
  const boiteObst = b => { const C = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]]; for (let i = 0; i < 4; i++) obstacles.push([C[i], C[(i + 1) % 4]]); };
  // bande-spectre agrandie (lampe à vapeur) : une raie colorée par longueur d'onde, sur fond noir ; étiquettes « 404,7 nm » au-dessus et au-dessous (raies proches regroupées)
  let spectre = null;
  const barreRaies = () => {
    const raies = [...cfg.barreRaies].sort((x, y) => x.nm - y.nm), rowH = fs * 1.2, xA = 20, xB = W - 20, X = nm => xA + (nm - 400) / 320 * (xB - xA);
    const tTop = Hsc + 4, aTop = tTop + rowH + 4, yBar = aTop + rowH + 12, hBar = 30 * ech, bTop = yBar + hBar + 12;
    const nombre = nm => String(nm).replace('.', ','), groupes = [];
    for (const r of raies) { const g = groupes[groupes.length - 1]; if (g && r.nm - g[g.length - 1].nm < 15) g.push(r); else groupes.push([r]); }
    const lignesBarre = [], rangs = { A: [], B: [] }, sortie = [];
    const tw0 = largeurTexte('Spectre de la lampe, agrandi', fs);
    sortie.push({ texte: 'Spectre de la lampe, agrandi', lignesT: ['Spectre de la lampe, agrandi'], x: W / 2, y: tTop + fs * 0.85, couleur: '#0f172a', taille: fs, gras: true, ok: true, boite: { x: W / 2 - tw0 / 2, y: tTop, w: tw0, h: rowH } });
    for (const g of groupes) {
      const texte = (g.length === 1 ? nombre(g[0].nm) : g.length === 2 ? `${nombre(g[0].nm)} et ${nombre(g[1].nm)}` : `${nombre(g[0].nm)} à ${nombre(g[g.length - 1].nm)}`) + `${M.NB}nm`;
      const tw = largeurTexte(texte, fs), cx = g.reduce((a, r) => a + X(r.nm), 0) / g.length, bx = Math.min(W - 2 - tw, Math.max(2, cx - tw / 2));
      const libre = rg => rangs[rg].every(b => bx + tw + 8 <= b.x || b.x + b.w + 8 <= bx), rg = libre('A') ? 'A' : libre('B') ? 'B' : null, top = rg === 'B' ? bTop : aTop;
      const boite = { x: bx, y: top, w: tw, h: rowH }; if (rg) rangs[rg].push(boite);
      sortie.push({ texte, lignesT: [texte], x: bx + tw / 2, y: top + fs * 0.85, couleur: M.couleurRayon(g[0].nm), taille: fs, gras: true, ok: !!rg, boite });
      for (const r of g) { const xr = X(r.nm), xl = Math.min(bx + tw - 4, Math.max(bx + 4, xr)); lignesBarre.push(rg === 'B' ? { x1: xr, y1: yBar + hBar, x2: xl, y2: bTop } : { x1: xr, y1: yBar, x2: xl, y2: aTop + rowH }); }
    }
    spectre = { x0: xA, x1: xB, y: yBar, h: hBar, raies: raies.map(r => ({ x: X(r.nm), nm: r.nm, couleur: M.couleurClaire(r.nm) })), reperes: lignesBarre };
    return sortie;
  };
  if (regle) boiteObst({ x: regle.x1 - 2, y: regle.y - 12 * ech, w: k + 8 + largeurTexte(regle.texte, regle.taille) + 8, h: 24 * ech });
  if (legende) for (const l of legende) boiteObst({ x: l.x - 2, y: l.y - fs, w: 24 * ech + largeurTexte(l.texte, fs) + 8, h: fs * 1.3 });
  // ---------- étiquettes ----------
  const poser = e => {                                                    // choisit une position sans collision
    const lignesT = e.texte.split('\n'), tw = Math.max(...lignesT.map(l => largeurTexte(l, e.taille))), th = e.taille * 1.05 * lignesT.length, essais = [];
    const dirs = [...(e.prefs || []), [1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 1], [-1, -1], [-1, 1]];
    for (const d of dirs) { const L = Math.hypot(d[0], d[1]) || 1; for (const g of [5, 10, 18, 28, 40]) essais.push([d[0] / L, d[1] / L, g]); }
    for (const [ux, uy, g] of essais) {
      const cx = e.ancre[0] + ux * (tw / 2 + g * ech), cy = e.ancre[1] + uy * (th / 2 + g * ech), b = { x: cx - tw / 2, y: cy - th / 2, w: tw, h: th };
      if (b.x < 2 || b.y < 2 || b.x + b.w > W - 2 || b.y + b.h > Hsc - 2) continue;
      const pad = { x: b.x - 2, y: b.y - 2, w: b.w + 4, h: b.h + 4 };
      if (obstacles.some(([p, q]) => boiteTouche(pad, p, q))) continue;
      if (textes.some(t => boitesSeChevauchent(pad, t.boite))) continue;
      if (taches.some(t => boitesSeChevauchent(pad, { x: t.x - t.r, y: t.y - t.r, w: 2 * t.r, h: 2 * t.r }))) continue;
      return { ...e, lignesT, x: cx, y: cy - th / 2 + e.taille * 0.85, boite: b, ok: true };
    }
    // aucune position libre : on la place malgré tout à la première position (le test le signalera)
    const [ux, uy, g] = essais[0], cx = e.ancre[0] + ux * (tw / 2 + g * ech), cy = e.ancre[1] + uy * (th / 2 + g * ech);
    return { ...e, lignesT, x: cx, y: cy - th / 2 + e.taille * 0.85, boite: { x: cx - tw / 2, y: cy - th / 2, w: tw, h: th }, ok: false };
  };
  const demandes = [];
  if (cfg.note) { const tw = largeurTexte(cfg.note, fs), b = { x: W - 6 - tw, y: Hsc - fs * 1.25 - 4, w: tw, h: fs * 1.25 }; textes.push({ texte: cfg.note, lignesT: [cfg.note], x: b.x + tw / 2, y: b.y + fs * 0.9, couleur: '#9a3412', taille: fs, gras: true, ok: true, boite: b }); }
  const lbl = (texte, ancreCm, couleur, prefs, extra = {}) => demandes.push({ texte, ancre: PX(ancreCm), couleur, taille: fs, prefs, ...extra });
  const E = cfg.etiquettes || {};
  if (E.blanche && incBlanc) lbl(cfg.fenetre === FENETRES.complet || cfg.fenetre === FENETRES.carte ? 'lumière\nblanche' : 'lumière blanche', A0, '#0f172a', [[0, -1], [1, 1], [0, 1], [-1, -1]], { gras: true });
  if (E.laser && !incBlanc) lbl(E.laser, [(A0[0] + P1[0]) / 2, (A0[1] + P1[1]) / 2], incNeutre ? '#334155' : M.couleurRayon(inc.nm), [[0, 1], [0, -1]], { gras: true });
  if (E.prisme) lbl('prisme', [0, 0], '#0f172a', [[0, 1]], { gras: true });
  if (E.ecran && ecran) lbl('écran', [M.X_ECRAN, ecran.y1], '#0f172a', [[0, -1], [1, -1]], { gras: true });
  if (E.sansPrisme && cfg.prolongement) { const q = M.sansPrisme(i1).P3; const fr = cfg.fracSansPrisme ?? 0.75, pm = [P1[0] + fr * (q[0] - P1[0]), P1[1] + fr * (q[1] - P1[1])]; lbl(E.sansPrisme, pm, '#334155', cfg.prefsSansPrisme || [[-0.4, -1], [0, -1], [0.4, -1], [-1, -0.5], [1, 0.6], [0, 1]]); }
  if (E.normale) lbl('normale', [P1[0] - NE[0] * Lnorm, P1[1] - NE[1] * Lnorm], '#334155', [[-1, 0], [-1, -1], [0, -1]]);
  if (E.normaleEntreeExt) lbl('normale', [P1[0] + NE[0] * Lnorm, P1[1] + NE[1] * Lnorm], '#334155', [[0, -1], [-1, -1], [-1, 0]]);
  if (E.normaleSortie) lbl('normale', [P2ref[0] - NS[0] * Lnorm, P2ref[1] - NS[1] * Lnorm], '#334155', [[-1, 0], [-1, 1], [0, 1]]);
  if (E.milieux) { lbl('verre', E.milieux.verre, '#1e3a8a', [[-1, 0], [0, -1], [0, 1]], { gras: true }); lbl('air', E.milieux.air, '#475569', [[1, 0], [0, -1], [0, 1]], { gras: true }); }
  const sansLeader = [];
  const labelsRaies = cfg.barreRaies ? barreRaies() : null;
  if (cfg.leader) {
    const lst = trajets.filter(x => x.t && x.t.P3 && x.r.nom).map(x => ({ ...x, p: PX(x.t.P3) })).sort((a, b) => a.p[1] - b.p[1]);
    const pas = fs * 1.2, moy = lst.reduce((a, x) => a + x.p[1], 0) / (lst.length || 1);
    lst.forEach((x, j) => {
      const yy = moy + (j - (lst.length - 1) / 2) * pas, tw = largeurTexte(x.r.nom, fs), xe = x.p[0] + 22 * ech;
      lignes.push({ x1: x.p[0] + 5 * ech, y1: x.p[1], x2: xe - 3, y2: yy, couleur: '#64748b', largeur: 1.3 * ech }); obstacles.push([[x.p[0], x.p[1]], [xe - 3, yy]]);
      textes.push({ texte: x.r.nom, lignesT: [x.r.nom], x: xe + tw / 2, y: yy + fs * 0.33, couleur: M.couleurRayon(x.r.nm), taille: fs, gras: true, ok: true, boite: { x: xe, y: yy - fs / 2, w: tw, h: fs } });
      sansLeader.push(x.r);
    });
  }
  for (const { r, t } of trajets) if (t && t.P3 && r.nom && !sansLeader.includes(r)) lbl(r.nom, t.P3, M.couleurRayon(r.nm), r.prefNom || [[1, 0]], { gras: true });
  if (labelsRaies) textes.push(...labelsRaies);
  for (const e of demandes) textes.push(poser(e));
  // étiquettes d'angles (posées après les autres : leur place est la plus contrainte)
  for (const e of etiquettes) textes.push(poser(e));
  return { W, H, k, fs, ech, lignes, fleches, arcs, polys, textes, taches, regle, legende, spectre, obstacles, fenetre: fen, ecran };
}

// ---------- scènes prêtes à l'emploi (parcours guidé, exploration, cartes) ----------
const ROUGE = { nm: M.LAMBDA_ROUGE }, VIOLET = { nm: M.LAMBDA_VIOLET };
const I_GUIDE = 50;
const LONG = M.LAMBDA_ROUGE;
export const SCENES = {
  // étape 1 : lumière blanche, prisme, écran
  blanc: () => ({ fenetre: FENETRES.complet, bas: 0, i1: I_GUIDE, bande: true, echelle: true, etiquettes: { blanche: [[0, 1], [0, -1]], prisme: true, ecran: true } }),
  // étape 2 : deux rayons, prolongement sans prisme
  deux: () => ({ fenetre: FENETRES.complet, i1: I_GUIDE, prolongement: true, fracSansPrisme: 0.68, prefsSansPrisme: [[0, -1], [0.5, -1], [-0.5, -1], [0, 1]], echelle: true, etiquettes: { blanche: [[0, 1], [0, -1]], prisme: true, ecran: true, sansPrisme: 'sans prisme' },
    rayons: [{ ...ROUGE, nom: 'rouge', prefNom: [[1, 0]] }, { ...VIOLET, nom: 'violet', prefNom: [[1, 0]] }] }),
  // étape 3 : face d'entrée, rayon incident blanc, normale, angle d'incidence
  entree0: () => ({ fenetre: FENETRES.entree, i1: I_GUIDE, longueurDepart: 2.4, normales: 'entree', echelle: true, arcs: { i1: true }, etiquettes: { blanche: [[0, 1], [0, -1]], normale: true } }),
  // étape 4 : le rayon rouge dans le verre (exemple résolu : valeur de i₂ affichée)
  entreeRouge: () => ({ fenetre: FENETRES.entree, i1: I_GUIDE, longueurDepart: 2.4, normales: 'entree', echelle: true, arcs: { i1: true }, etiquettes: { blanche: [[0, 1], [0, -1]], normale: true },
    rayons: [{ ...ROUGE, dehors: false, arcs: { i2: `i₂ = ${M.degFR(M.trajet(I_GUIDE, 700).i2)}` }, prefsArc: [[1, 0.5], [1, 0.8], [1, 0.25]] }], rayonArc: 0.55 }),
  // fin de l'étape 4 / carte : rouge et violet dans le verre
  entreeDeux: () => ({ fenetre: FENETRES.entree, i1: I_GUIDE, longueurDepart: 2.4, normales: 'entree', echelle: true, arcs: { i1: true }, etiquettes: { blanche: [[0, 1], [0, -1]], normale: true },
    rayons: [{ ...ROUGE, dehors: false, arcs: { i2: true }, rangArc: 0 }, { ...VIOLET, dehors: false, arcs: { i2: true }, rangArc: 1 }] }),
  // étape 5 : face de sortie
  sortie: () => ({ fenetre: FENETRES.sortie, i1: I_GUIDE, normales: 'sortie', echelle: true, longueurDepart: 0.2, ecran: null, bas: 0, etiquettes: { normaleSortie: true, milieux: { verre: [-0.3, 0.7], air: [3.1, 0.6] } },
    rayons: [{ ...ROUGE, dedans: true, jusquEcran: false, arcs: { i3: true, i4: true }, rangArc: 0 }, { ...VIOLET, dedans: true, jusquEcran: false, arcs: { i4: true }, rangArc: 1 }] }),
  // étape 6 : les deux déviations
  deviations: () => ({ fenetre: FENETRES.complet, i1: I_GUIDE, echelle: true,
    legende: [{ couleur: M.couleurRayon(700), texte: `rouge : D = ${M.degFR(M.deviation(I_GUIDE, 700))}` }, { couleur: M.couleurRayon(400), texte: `violet : D = ${M.degFR(M.deviation(I_GUIDE, 400))}` }],
    rayons: [{ ...ROUGE, nom: 'rouge', arcs: { D: true }, rangArc: 0 }, { ...VIOLET, nom: 'violet', arcs: { D: true }, rangArc: 1 }], arcs: { D: true }, etiquettes: { blanche: [[0, 1], [0, -1]], prisme: true, ecran: true } }),
  // étape 10 : lampe à vapeur de mercure
  lampe: () => cfgExploration({ source: 'lampe', lampe: 'mercure', i1: I_GUIDE }),
  // étape 8 : laser rouge
  laser: () => ({ fenetre: FENETRES.complet, i1: I_GUIDE, incident: { type: 'mono', nm: 650 }, echelle: true, etiquettes: { laser: 'laser', prisme: true, ecran: true },
    rayons: [{ nm: 650, nom: `650${M.NB}nm`, prefNom: [[1, 0]] }] }),
  // étape 9 : trois lasers
  trois: () => ({ fenetre: FENETRES.complet, i1: I_GUIDE, echelle: true, incident: { type: 'neutre' }, etiquettes: { laser: '3 lasers', prisme: true, ecran: true },
    leader: true,
    rayons: [{ nm: 405, nom: `405${M.NB}nm` }, { nm: 532, nom: `532${M.NB}nm` }, { nm: 650, nom: `650${M.NB}nm` }] }),
};
void LONG;

// ---------- exploration : configuration construite à partir des réglages ----------
export function cfgExploration({ source, nm = 650, lampe = 'mercure', i1 = 60, f = 1 }) {
  const base = { fenetre: FENETRES.complet, i1, f, echelle: true };
  if (source === 'laser') return { ...base, incident: { type: 'mono', nm }, etiquettes: { laser: 'laser', prisme: true, ecran: true }, rayons: [{ nm, nom: `${nm}${M.NB}nm` }] };
  if (source === 'lampe') {
    const raies = M.lampe(lampe).raies;                         // un seul faisceau dessiné (les raies, très proches, se confondraient) ; la bande-spectre agrandie, dessous, les sépare
    return { ...base, fenetre: FENETRES.lampe, bas: 132, barreRaies: raies, faisceauUnique: true, incident: { type: 'neutre' }, etiquettes: { laser: 'lampe', prisme: true, ecran: true }, rayons: raies.map(r => ({ nm: r.nm, raie: true, sansTrait: true })) };
  }
  return { ...base, bande: true, etiquettes: { blanche: true, prisme: true, ecran: true } };
}

// ---------- schémas des cartes « À retenir » (viewBox de 300, textes de 13) ----------
const CF = { W: 300, fs: 13.5, lw: 3.4 };
export const CARTES = {
  dispersion: () => ({ ...CF, fenetre: FENETRES.carte, i1: I_GUIDE, longueurDepart: 2.3, bande: true, aretes: false, ecran: { y0: -2.1, y1: 3.6 }, fracSansPrisme: 0.66, prefsSansPrisme: [[0, -1], [0, 1], [-0.5, -1]], etiquettes: { blanche: true, ecran: true, sansPrisme: 'sans\nprisme' },
    rayons: [{ ...ROUGE, nom: 'rouge' }, { ...VIOLET, nom: 'violet' }], prolongement: true }),
  // l'écart entre rouge et violet (1,1°) est exagéré (×6) pour qu'on voie le violet plus près de la normale : mention « écart exagéré » sur le schéma
  indice: () => ({ ...CF, fenetre: FENETRES.carteEntree, i1: I_GUIDE, longueurDepart: 2.2, normales: 'entree', arcs: { i1: true }, etiquettes: { normale: true }, note: 'écart exagéré', rayonArc: 0.75,
    rayons: [{ ...ROUGE, dehors: false, arcs: { i2: true }, rangArc: 0 }, { ...VIOLET, exag: 6, dehors: false, arcs: { i2: true }, rangArc: 1 }] }),
  deuxFaces: () => ({ ...CF, fenetre: FENETRES.carteDeux, i1: I_GUIDE, longueurDepart: 1.6, normales: 'deux', prolongement: true, arcs: { i1: true }, ecran: { y0: -2.0, y1: 3.6 }, etiquettes: { ecran: true, normaleEntreeExt: true, normaleSortie: true },
    rayons: [{ ...ROUGE, nom: 'rouge' }, { ...VIOLET, nom: 'violet' }] }),
  laser: () => ({ ...CF, fenetre: FENETRES.carte, i1: I_GUIDE, incident: { type: 'mono', nm: 650 }, ecran: { y0: -2.1, y1: 3.6 }, etiquettes: { ecran: true }, rayons: [{ nm: 650, nom: `650${M.NB}nm` }] }),
};

// défi « reconnaître la couleur » : rayon et tache grises (la couleur n'est pas visible), déviation exacte
export const cfgDefiCouleur = d => ({ fenetre: FENETRES.complet, i1: d.i1, incident: { type: 'neutre' }, echelle: true, etiquettes: { laser: 'laser', prisme: true, ecran: true }, rayons: [{ nm: d.ref.nm, neutre: true }] });
export const cfgDefiEntree = i1 => ({ ...SCENES.entree0(), i1, arcs: { i1: true } });
