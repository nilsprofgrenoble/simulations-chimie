import { useState, useRef, useEffect, useId } from "react";
import { KIT, stylePetitBouton } from "../commun";
import { TV } from "./Travail";
import * as M from "./geometrieModele";

// ====================================================
//  SCÈNES DE LA SIM 155 : modèle moléculaire 3D tournant (ball-and-stick, doublets, charges partielles, G⁺/G⁻, moment dipolaire),
//  schéma de Lewis plat, représentation de Cram, électronégativités, échelle des Δχ, répulsion de doublets.
//  Tout est dessiné en SVG (pas de WebGL) : projection orthographique d'une rotation autour de y puis de x.
// ====================================================
export const COL = { bleu: '#1d4ed8', rouge: '#b91c1c', orange: '#c2410c', vert: '#15803d', gris: '#475569', violet: '#6d28d9', noir: '#0f172a' };
const RAD = Math.PI / 180;
const MOINS = '−';

// ---------- projection ----------
function projeter(p, ry, rx) {
  const cy = Math.cos(ry * RAD), sy = Math.sin(ry * RAD), cx = Math.cos(rx * RAD), sx = Math.sin(rx * RAD);
  const x1 = p[0] * cy + p[2] * sy, z1 = -p[0] * sy + p[2] * cy;
  return { x: x1, y: p[1] * cx - z1 * sx, z: p[1] * sx + z1 * cx };      // z > 0 : vers l'observateur
}

const arrondi = x => Math.round(x * 100) / 100;


// Placement d'étiquettes sans chevauchement : essaie des positions de plus en plus loin du point d'ancrage, dans l'ordre d'angles préféré.
function creerPlaceur(W, H, cercles, segments) {
  const pris = [];
  const rectCercle = (r, c) => { const dx = Math.max(r.x - c.x, 0, c.x - (r.x + r.w)), dy = Math.max(r.y - c.y, 0, c.y - (r.y + r.h)); return dx * dx + dy * dy < c.r * c.r; };
  const rectSeg = (r, sg) => { const L = Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1), n = Math.max(2, Math.ceil(L / 3));
    for (let i = 0; i <= n; i++) { const x = sg.x1 + (sg.x2 - sg.x1) * i / n, y = sg.y1 + (sg.y2 - sg.y1) * i / n; if (x > r.x - sg.t && x < r.x + r.w + sg.t && y > r.y - sg.t && y < r.y + r.h + sg.t) return true; } return false; };
  const rectRect = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  return (ax, ay, w, h, pref, rayons) => {
    const angles = [0, 25, -25, 50, -50, 75, -75, 100, -100, 130, -130, 160, -160, 180].map(d => pref + d);
    for (const rad of rayons) for (const ang of angles) {
      const cx = ax + rad * Math.cos(ang * RAD), cy = ay - rad * Math.sin(ang * RAD), r = { x: cx - w / 2, y: cy - h / 2, w, h };
      if (r.x < 2 || r.y < 2 || r.x + w > W - 2 || r.y + h > H - 2) continue;
      if (cercles.some(c => rectCercle(r, c)) || segments.some(sg => rectSeg(r, sg)) || pris.some(q => rectRect(r, q))) continue;
      pris.push(r); return { x: cx, y: cy, dist: rad };
    }
    const rad = rayons[rayons.length - 1], cx = Math.min(W - w / 2 - 2, Math.max(w / 2 + 2, ax + rad * Math.cos(pref * RAD))), cy = Math.min(H - h / 2 - 2, Math.max(h / 2 + 2, ay - rad * Math.sin(pref * RAD)));
    pris.push({ x: cx - w / 2, y: cy - h / 2, w, h }); return { x: cx, y: cy, dist: rad };
  };
}

/** Modèle moléculaire 3D. ent : entité (atomes, liaisons) ; lobes : doublets à dessiner ([{ d, centre? }]) ; showNL : doublets non liants de l'entité. */
export function Vue3D({ ent, lobes = null, showNL = false, charges = false, G = false, aria, vue0 = { ry: -32, rx: 14 }, h = 230, commandes = true, titre = null, echelleMax = 100, lobeLongueur = 0.9 }) {
  const uid = useId().replace(/:/g, '');
  const [vue, setVue] = useState(vue0);
  const drag = useRef(null);
  const W = 320, cx0 = W / 2, cy0 = h / 2 + 4;
  const centreP = ent.centre != null ? ent.atomes[ent.centre].p : ent.atomes[0].p;
  const lobesAff = lobes || (showNL ? ent.nonLiants.map(d => ({ d })) : []);
  // échelle : l'entité (atomes + doublets) tient dans le cadre
  let ext = 0.6;
  ent.atomes.forEach(a => { ext = Math.max(ext, Math.hypot(...a.p) + (M.RAYON_ATOME[a.s] || 0.4)); });
  if (lobesAff.length) ext = Math.max(ext, lobeLongueur + 0.2);
  const S = Math.min(echelleMax, (h / 2 - 6) / (ext * 0.9), 120 / ext);
  const pr = p => { const q = projeter(p, vue.ry, vue.rx); return { x: cx0 + S * q.x, y: cy0 - S * q.y, z: q.z }; };

  const elems = [];
  // liaisons
  ent.liaisons.forEach(([i, j, o], k) => {
    const a = pr(ent.atomes[i].p), b = pr(ent.atomes[j].p), dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
    const decal = o === 1 ? [0] : o === 2 ? [-3.5, 3.5] : [-6, 0, 6];
    elems.push({ z: Math.min(a.z, b.z) - 0.01, k: `b${k}`, el: <g key={`b${k}`}>{decal.map((d, t) => <line key={t} x1={a.x + nx * d} y1={a.y + ny * d} x2={b.x + nx * d} y2={b.y + ny * d} stroke="#64748b" strokeWidth={o === 1 ? 5.5 : 3.4} strokeLinecap="round"/>)}</g> });
  });
  // doublets (lobes)
  lobesAff.forEach((l, k) => {
    const o = l.centre || centreP, r0 = (M.RAYON_ATOME[ent.atomes[ent.centre ?? 0].s] || 0.4) * 0.6, p0 = pr(o.map((x, t) => x + l.d[t] * r0)), p1 = pr(o.map((x, t) => x + l.d[t] * (r0 + lobeLongueur))), dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) / RAD;
    const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2, ry = 10, rx = Math.max(len / 2, ry);
    elems.push({ z: (p0.z + p1.z) / 2, k: `l${k}`, el: <g key={`l${k}`} transform={`rotate(${arrondi(ang)} ${arrondi(mx)} ${arrondi(my)})`}>
      <ellipse cx={mx} cy={my} rx={rx} ry={ry} fill="#c4b5fd" fillOpacity="0.5" stroke="#6d28d9" strokeWidth="1.6"/>
      <circle cx={mx - 3.5} cy={my} r="2.3" fill="#4c1d95"/><circle cx={mx + 3.5} cy={my} r="2.3" fill="#4c1d95"/></g> });
  });
  // atomes (les lettres sont dessinées dans une couche au-dessus de tout, pour rester lisibles sous les doublets)
  const qs = charges ? M.chargesPartielles(ent) : null;
  const infos = ent.atomes.map(a => { const p = pr(a.p); return { p, r: Math.max(9, S * (M.RAYON_ATOME[a.s] || 0.4) * 0.95), a }; });
  infos.forEach(({ p, r, a }, i) => {
    const clair = a.s === 'H' || a.s === 'X';
    elems.push({ z: p.z, k: `a${i}`, el: <g key={`a${i}`}>
      <circle cx={p.x} cy={p.y} r={r} fill={`url(#g${uid}${a.s})`} stroke={clair ? '#64748b' : '#1e293b'} strokeWidth="1.2"/>
      <text x={p.x} y={p.y + 5.5} textAnchor="middle" fontSize={Math.max(14, Math.min(18, r * 0.95))} fontWeight="800" fill={clair ? '#0f172a' : '#fff'} stroke={clair ? '#fff' : '#0f172a'} strokeWidth="2.2" strokeOpacity="0.55" paintOrder="stroke" style={{ pointerEvents: 'none' }}>{a.s}</text></g> });
  });
  elems.sort((a, b) => a.z - b.z);

  // positions de G⁺, G⁻ (écran) : calculées d'abord, car les étiquettes doivent les éviter
  const PG = G ? M.polarite(ent) : null;
  const gp = PG && PG.Gplus ? pr(PG.Gplus) : null, gm = PG && PG.Gplus ? pr(PG.Gmoins) : null;
  const dist = gp ? Math.hypot(gp.x - gm.x, gp.y - gm.y) : 0;
  const fleche = gp && PG.polaire && dist > 8;

  // obstacles pour le placement des étiquettes : atomes, liaisons, doublets, repères G et flèche
  const cercles = infos.map(({ p, r }) => ({ x: p.x, y: p.y, r: r + 1 }));
  const segments = ent.liaisons.map(([i, j]) => ({ x1: infos[i].p.x, y1: infos[i].p.y, x2: infos[j].p.x, y2: infos[j].p.y, t: 4 }));
  lobesAff.forEach(l => { const o = l.centre || centreP; const a0 = pr(o), a1 = pr(o.map((x, t) => x + l.d[t] * (lobeLongueur + 0.2))); segments.push({ x1: a0.x, y1: a0.y, x2: a1.x, y2: a1.y, t: 9 }); });
  if (gp) { cercles.push({ x: gp.x, y: gp.y, r: 10 }, { x: gm.x, y: gm.y, r: 10 }); if (fleche) segments.push({ x1: gm.x, y1: gm.y, x2: gp.x, y2: gp.y, t: 4 }); }
  const placer = creerPlaceur(W, h, cercles, segments);
  const cen = { x: infos.reduce((t, q) => t + q.p.x, 0) / infos.length, y: infos.reduce((t, q) => t + q.p.y, 0) / infos.length };

  const etiquettes = [];
  if (qs) infos.forEach(({ p, r }, i) => {
    if (qs[i] === 0) return;
    const txt = `${qs[i] > 0 ? '+' : MOINS}${Math.abs(qs[i]) > 1 ? Math.abs(qs[i]) : ''}δ`, w = 12 + 9 * txt.length, hh = 20;
    const loin = Math.hypot(p.x - cen.x, p.y - cen.y), pref = loin > 6 ? Math.atan2(-(p.y - cen.y), p.x - cen.x) / RAD : 90;
    const e = placer(p.x, p.y, w, hh, pref, [r + w / 2 - 2, r + w / 2 + 8, r + w / 2 + 18]);
    etiquettes.push(<text key={`q${i}`} x={e.x} y={e.y + 5.5} textAnchor="middle" fontSize="15" fontWeight="800" fill={qs[i] > 0 ? COL.bleu : COL.rouge} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">{txt}</text>);
  });

  // G⁺, G⁻ et moment dipolaire
  let gEl = null;
  if (gp) {
    const lab = (pt, txt, col, pref, w = 30) => { const e = placer(pt.x, pt.y, w, 20, pref, [w / 2 + 12, w / 2 + 22, w / 2 + 34, w / 2 + 46]);
      return <g key={txt}>{e.dist > 28 && <line x1={pt.x + (e.x - pt.x) * 0.3} y1={pt.y + (e.y - pt.y) * 0.3} x2={pt.x + (e.x - pt.x) * 0.62} y2={pt.y + (e.y - pt.y) * 0.62} stroke={col} strokeWidth="1.4"/>}
        <text x={e.x} y={e.y + 5} textAnchor="middle" fontSize="14.5" fontWeight="800" fill={col} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">{txt}</text></g>; };
    if (PG.polaire) {
      const dx = gp.x - gm.x, dy = gp.y - gm.y, n = dist || 1, ux = dx / n, uy = dy / n, bout = 5;
      const lm = lab(gm, 'G⁻', COL.rouge, 135), lp = lab(gp, 'G⁺', COL.bleu, -45);
      const pl = fleche ? placer((gm.x + gp.x) / 2, (gm.y + gp.y) / 2, 22, 26, Math.atan2(-uy, ux) / RAD + 90, [16, 24, 34, 44]) : null;
      gEl = <g>
        {fleche && <><line x1={gm.x} y1={gm.y} x2={gp.x - ux * bout} y2={gp.y - uy * bout} stroke={COL.orange} strokeWidth="4" strokeLinecap="round"/>
          <polygon points={`${gp.x},${gp.y} ${gp.x - 12 * ux - 6 * uy},${gp.y - 12 * uy + 6 * ux} ${gp.x - 12 * ux + 6 * uy},${gp.y - 12 * uy - 6 * ux}`} fill={COL.orange}/></>}
        <circle cx={gm.x} cy={gm.y} r="8" fill="#fff" fillOpacity="0.85" stroke={COL.rouge} strokeWidth="2.4"/><text x={gm.x} y={gm.y + 4.5} textAnchor="middle" fontSize="14" fontWeight="800" fill={COL.rouge}>{MOINS}</text>
        <circle cx={gp.x} cy={gp.y} r="8" fill="#fff" fillOpacity="0.85" stroke={COL.bleu} strokeWidth="2.4"/><text x={gp.x} y={gp.y + 4.5} textAnchor="middle" fontSize="14" fontWeight="800" fill={COL.bleu}>+</text>
        {lm}{lp}
        {pl && <TV x={pl.x - 6} y={pl.y + 7} s={20} c={COL.orange} halo>p</TV>}
      </g>;
    } else {
      const lc = lab(gp, 'G⁺ = G⁻', COL.noir, -90, 66);
      gEl = <g><circle cx={gp.x} cy={gp.y} r="10" fill="#fff" fillOpacity="0.85" stroke={COL.noir} strokeWidth="2.6"/><text x={gp.x} y={gp.y + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill={COL.noir}>±</text>{lc}</g>;
    }
  }
  const bouger = f => setVue(v => f(v));
  const gradients = [...new Set(ent.atomes.map(a => a.s))].map(s => { const c = M.COUL_ATOME[s] || '#94a3b8'; return <radialGradient key={s} id={`g${uid}${s}`} cx="35%" cy="32%" r="75%"><stop offset="0%" stopColor="#fff" stopOpacity="0.85"/><stop offset="45%" stopColor={c}/><stop offset="100%" stopColor={c} stopOpacity="1"/></radialGradient>; });
  const bt = { ...stylePetitBouton(false, '#334155'), minWidth: 44, minHeight: 40, fontSize: 16, padding: '4px 10px' };
  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${W} ${h}`} role="img" aria-label={aria} tabIndex={0} width="100%"
        style={{ display: 'block', background: '#fff', borderRadius: 10, border: `1px solid ${KIT.bord}`, touchAction: 'pan-y', cursor: 'grab', maxWidth: 400, margin: '0 auto' }}
        onPointerDown={e => { drag.current = { x: e.clientX, y: e.clientY, ry: vue.ry, rx: vue.rx }; e.currentTarget.setPointerCapture?.(e.pointerId); }}
        onPointerMove={e => { const d = drag.current; if (!d) return; setVue({ ry: d.ry + (e.clientX - d.x) * 0.7, rx: e.pointerType === 'mouse' ? Math.max(-85, Math.min(85, d.rx + (e.clientY - d.y) * 0.7)) : d.rx }); }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
        onKeyDown={e => { if (e.key === 'ArrowLeft') bouger(v => ({ ...v, ry: v.ry - 15 })); else if (e.key === 'ArrowRight') bouger(v => ({ ...v, ry: v.ry + 15 })); else if (e.key === 'ArrowUp') bouger(v => ({ ...v, rx: Math.max(-85, v.rx - 15) })); else if (e.key === 'ArrowDown') bouger(v => ({ ...v, rx: Math.min(85, v.rx + 15) })); }}>
        <defs>{gradients}</defs>
        {titre && <text x="10" y="20" fontSize="14" fontWeight="700" fill={KIT.txt}>{titre}</text>}
        {elems.map(e => e.el)}
        {etiquettes}
        {gEl}
      </svg>
      {commandes && <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }} role="group" aria-label="Tourner la molécule">
        <button style={bt} aria-label="Tourner vers la gauche" onClick={() => bouger(v => ({ ...v, ry: v.ry - 25 }))}>◀</button>
        <button style={bt} aria-label="Tourner vers la droite" onClick={() => bouger(v => ({ ...v, ry: v.ry + 25 }))}>▶</button>
        <button style={bt} aria-label="Basculer vers le haut" onClick={() => bouger(v => ({ ...v, rx: Math.max(-85, v.rx - 25) }))}>▲</button>
        <button style={bt} aria-label="Basculer vers le bas" onClick={() => bouger(v => ({ ...v, rx: Math.min(85, v.rx + 25) }))}>▼</button>
        <button style={{ ...bt, fontSize: 13 }} onClick={() => setVue(vue0)}>Vue de départ</button>
      </div>}
      {commandes && <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center', marginTop: 4 }}>Faites glisser le modèle (ou utilisez les flèches) pour le voir sous tous les angles.</div>}
    </div>);
}

/** Schéma de Lewis plat (à plat, sans information sur la forme réelle). */
export function Lewis({ ent, maxWidth = 300, aria }) {
  const { pos, lpDirs, charge } = ent.lewis;
  const W = 220, H = 150, cx = W / 2, cy = H / 2;
  const P = pos.map(([x, y]) => [cx + x, cy + y]);
  const els = [];
  ent.liaisons.forEach(([i, j, o], k) => {
    const [x1, y1] = P[i], [x2, y2] = P[j], dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, nx = -uy, ny = ux, r = 13;
    const decal = o === 1 ? [0] : o === 2 ? [-3.5, 3.5] : [-5.5, 0, 5.5];
    decal.forEach((d, t) => els.push(<line key={`b${k}-${t}`} x1={x1 + ux * r + nx * d} y1={y1 + uy * r + ny * d} x2={x2 - ux * r + nx * d} y2={y2 - uy * r + ny * d} stroke={KIT.txt} strokeWidth="2.2" strokeLinecap="round"/>));
  });
  ent.atomes.forEach((a, i) => {
    const [x, y] = P[i];
    els.push(<text key={`s${i}`} x={x} y={y + 8} textAnchor="middle" fontSize="24" fontWeight="800" fill={KIT.txt}>{a.s}</text>);
    lpDirs[i].forEach((ang, t) => {
      const ca = Math.cos(ang * RAD), sa = Math.sin(ang * RAD), px = x + ca * 19, py = y - 3 - sa * 19, tx = sa, ty = ca, l = 7;
      els.push(<line key={`d${i}-${t}`} x1={px - tx * l} y1={py - ty * l} x2={px + tx * l} y2={py + ty * l} stroke={COL.violet} strokeWidth="3.4" strokeLinecap="round"/>);
    });
    if (charge && charge.i === i) els.push(<g key="ch"><circle cx={x + 16} cy={y - 20} r="8" fill="#fff" stroke={COL.rouge} strokeWidth="1.8"/><text x={x + 16} y={y - 15} textAnchor="middle" fontSize="14" fontWeight="800" fill={COL.rouge}>+</text></g>);
  });
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria || `Schéma de Lewis de ${ent.nom} ${ent.f}`} width="100%" style={{ display: 'block', maxWidth, margin: '0 auto', background: '#fff', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>{els}</svg>;
}

/** Éléments SVG d'une représentation de Cram centrée en (cx, cy) ; k = facteur d'échelle ; fs = taille des lettres. */
export function cramElems({ centreSym, liens, cx, cy, k = 1, fs = 21, pre = 'c' }) {
  const els = [];
  liens.forEach((l, i) => {
    const x2 = cx + l.x * k, y2 = cy + l.y * k, dx = x2 - cx, dy = y2 - cy, n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, nx = -uy, ny = ux, r1 = fs * 0.58, r2 = fs * 0.62;
    const a = [cx + ux * r1, cy + uy * r1], b = [x2 - ux * r2, y2 - uy * r2], lg = 6 * k;
    if (l.st === 'avant') els.push(<polygon key={`${pre}w${i}`} points={`${a[0]},${a[1]} ${b[0] + nx * lg},${b[1] + ny * lg} ${b[0] - nx * lg},${b[1] - ny * lg}`} fill={KIT.txt}/>);
    else if (l.st === 'arriere') for (let t = 1; t <= 6; t++) { const f = t / 6.5, px = a[0] + (b[0] - a[0]) * f, py = a[1] + (b[1] - a[1]) * f, w = (1 + 5.5 * f) * k; els.push(<line key={`${pre}h${i}-${t}`} x1={px + nx * w} y1={py + ny * w} x2={px - nx * w} y2={py - ny * w} stroke={KIT.txt} strokeWidth="2"/>); }
    else { const o = l.o || 1, decal = (o === 1 ? [0] : o === 2 ? [-3.5, 3.5] : [-5.5, 0, 5.5]); decal.forEach((d, t) => els.push(<line key={`${pre}p${i}-${t}`} x1={a[0] + nx * d} y1={a[1] + ny * d} x2={b[0] + nx * d} y2={b[1] + ny * d} stroke={KIT.txt} strokeWidth="2.4" strokeLinecap="round"/>)); }
    els.push(<text key={`${pre}t${i}`} x={x2} y={y2 + fs * 0.34} textAnchor="middle" fontSize={fs} fontWeight="800" fill={KIT.txt}>{l.s}</text>);
  });
  els.push(<text key={`${pre}c`} x={cx} y={cy + fs * 0.34} textAnchor="middle" fontSize={fs} fontWeight="800" fill={KIT.txt}>{centreSym}</text>);
  return els;
}
export function LegendeCram({ x = 14, y = 0, fs = 13 }) {
  const t = (yy, txt) => <text x={x + 48} y={yy} fontSize={fs} fill={KIT.txt}>{txt}</text>;
  return <g>
    <line x1={x} y1={y - 4} x2={x + 40} y2={y - 4} stroke={KIT.txt} strokeWidth="2.4"/>{t(y, 'dans le plan de la feuille')}
    <polygon points={`${x},${y + 14} ${x + 40},${y + 8} ${x + 40},${y + 22}`} fill={KIT.txt}/>{t(y + 18, 'vers l’avant (vers vous)')}
    {[1, 2, 3, 4, 5, 6].map(i => { const f = i / 6.5, px = x + 40 * f, w = 1 + 5.5 * f; return <line key={i} x1={px} y1={y + 36 - w} x2={px} y2={y + 36 + w} stroke={KIT.txt} strokeWidth="2"/>; })}{t(y + 40, 'vers l’arrière (derrière)')}
  </g>;
}

/** Représentation de Cram : trait plein = dans le plan, triangle plein = vers l'avant, pointillés = vers l'arrière. */
export function Cram({ ent, maxWidth = 300, legende = true, aria }) {
  const c = ent.cram, W = 220, H = legende ? 200 : 150;
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria || `Représentation de Cram de ${ent.nom} ${ent.f}`} width="100%" style={{ display: 'block', maxWidth, margin: '0 auto', background: '#fff', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
    {cramElems({ centreSym: ent.atomes[ent.centre].s, liens: c.liens, cx: W / 2 + c.c[0], cy: 72 + c.c[1] })}
    {ent.charge ? <g><circle cx={W / 2 + c.c[0] + 20} cy={72 + c.c[1] - 22} r="9" fill="#fff" stroke={COL.rouge} strokeWidth="1.8"/><text x={W / 2 + c.c[0] + 20} y={72 + c.c[1] - 16.5} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.rouge}>{ent.charge > 0 ? '+' : MOINS}</text></g> : null}
    {legende && <LegendeCram y={146}/>}
  </svg>;
}

/** Barres d'électronégativité (valeurs du cours). */
export function ChiBarres({ atomes = ['H', 'C', 'N', 'O', 'Cl'], surligne = [], maxWidth = 360 }) {
  const W = 320, rowH = 30, H = 34 + atomes.length * rowH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Électronégativité χ : ${atomes.map(a => `${a} ${M.CHI[a].toFixed(1).replace('.', ',')}`).join(', ')}.`} width="100%" style={{ display: 'block', maxWidth, margin: '0 auto', background: '#fff', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <text x="10" y="22" fontSize="14" fontWeight="700" fill={KIT.txt}>Électronégativité χ (valeurs du cours)</text>
      {atomes.map((a, i) => { const y = 34 + i * rowH, w = M.CHI[a] * 58, on = surligne.includes(a);
        return <g key={a}><text x="12" y={y + 20} fontSize="17" fontWeight="800" fill={KIT.txt}>{a}</text>
          <rect x="48" y={y + 4} width={w} height="22" rx="4" fill={M.COUL_ATOME[a] || '#94a3b8'} stroke={on ? COL.orange : '#475569'} strokeWidth={on ? 3 : 1}/>
          <text x={48 + w + 8} y={y + 21} fontSize="16" fontWeight="800" fill={KIT.txt}>{M.CHI[a].toFixed(1).replace('.', ',')}</text></g>; })}
    </svg>);
}

/** Axe des Δχ avec les trois zones conventionnelles ; marques = [{ d, etiq }]. */
export function EchelleDeltaChi({ marques = [], maxWidth = 360, titre = 'Δχ et type de liaison (convention du cours)' }) {
  const W = 320, x0 = 18, k = 124, X = d => x0 + k * d;
  const fusion = {};
  marques.forEach(m => { const c = m.d.toFixed(1); fusion[c] = { d: m.d, etiq: [...(fusion[c]?.etiq || []), m.etiq] }; });
  return (
    <svg viewBox={`0 0 ${W} 150`} role="img" aria-label="Échelle de Δχ : non polarisée jusqu’à 0,4, polarisée entre 0,4 et 1,7, ionique au-delà de 1,7." width="100%" style={{ display: 'block', maxWidth, margin: '0 auto', background: '#fff', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <text x="10" y="20" fontSize="14" fontWeight="700" fill={KIT.txt}>{titre}</text>
      <rect x={X(0)} y="52" width={X(0.4) - X(0)} height="26" fill="#bbf7d0" stroke="#15803d"/>
      <rect x={X(0.4)} y="52" width={X(1.7) - X(0.4)} height="26" fill="#fed7aa" stroke="#c2410c"/>
      <rect x={X(1.7)} y="52" width={X(2.3) - X(1.7)} height="26" fill="#fecaca" stroke="#b91c1c"/>
      <text x={(X(0) + X(0.4)) / 2} y="70" textAnchor="middle" fontSize="13" fontWeight="700" fill={KIT.txt}>≤ 0,4</text>
      <text x={(X(0.4) + X(1.7)) / 2} y="70" textAnchor="middle" fontSize="13" fontWeight="700" fill={KIT.txt}>entre 0,4 et 1,7</text>
      <text x={(X(1.7) + X(2.3)) / 2} y="70" textAnchor="middle" fontSize="13" fontWeight="700" fill={KIT.txt}>&gt; 1,7</text>
      <text x={X(0) - 4} y="98" fontSize="13" fontWeight="700" fill="#15803d">non polarisée</text>
      <text x={(X(0.4) + X(1.7)) / 2 + 10} y="98" textAnchor="middle" fontSize="13" fontWeight="700" fill="#c2410c">polarisée</text>
      <text x={(X(1.7) + X(2.3)) / 2} y="98" textAnchor="middle" fontSize="13" fontWeight="700" fill="#b91c1c">ionique</text>
      {Object.values(fusion).map((m, i) => <g key={i}><polygon points={`${X(m.d)},50 ${X(m.d) - 5},41 ${X(m.d) + 5},41`} fill={KIT.txt}/>
        <text x={X(m.d)} y={36 - (i % 2) * 0} textAnchor="middle" fontSize="13" fontWeight="800" fill={KIT.txt}>{m.etiq.join(', ')}</text></g>)}
      <text x="10" y="124" fontSize="13" fill={KIT.txt2}>Seuils 0,4 et 1,7 : conventions du cours,</text>
      <text x="10" y="142" fontSize="13" fill={KIT.txt2}>pas des lois (d’autres manuels : d’autres seuils).</text>
    </svg>);
}

/** Répulsion de n doublets : démarre en désordre ; le bouton laisse les doublets se repousser (animation). */
export function SceneDoublets({ n, onLance = null, vue0 }) {
  const depart = () => M.departDesordre(n);
  const [pts, setPts] = useState(depart);
  const [etat, setEtat] = useState('desordre');       // desordre | en cours | equilibre
  const raf = useRef(null), ref = useRef(pts), cpt = useRef(0);
  const reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arret = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
  useEffect(() => arret, []);
  const lancer = () => {
    arret();
    if (onLance) onLance(n);
    if (reduit) { ref.current = M.relaxer(ref.current, 600, 0.06); setPts(ref.current); setEtat('equilibre'); return; }
    setEtat('en cours'); cpt.current = 0;
    const boucle = () => { ref.current = M.relaxer(ref.current, 2, 0.05); setPts(ref.current); cpt.current++;
      if (cpt.current < 130) raf.current = requestAnimationFrame(boucle); else { ref.current = M.relaxer(ref.current, 400, 0.05); setPts(ref.current); setEtat('equilibre'); raf.current = null; } };
    raf.current = requestAnimationFrame(boucle);
  };
  const remettre = () => { arret(); ref.current = depart(); setPts(ref.current); setEtat('desordre'); };
  const ent = { atomes: [{ s: 'A', p: [0, 0, 0], lp: 0 }], liaisons: [], centre: 0, nonLiants: [] };
  const ang = etat === 'equilibre' ? M.anglesDeux(pts) : null;
  return (
    <div>
      <Vue3D ent={ent} lobes={pts.map(d => ({ d }))} aria={`Atome central A entouré de ${n} doublets d’électrons ${etat === 'equilibre' ? 'répartis le plus loin possible les uns des autres' : 'placés au hasard'}.`} vue0={vue0 || { ry: -28, rx: 16 }} h={230} echelleMax={80} lobeLongueur={1.3}/>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={lancer} disabled={etat === 'en cours' || etat === 'equilibre'} style={{ ...stylePetitBouton(true, '#6d28d9'), minHeight: 42, fontSize: 14, opacity: etat === 'equilibre' ? 0.5 : 1 }}>Laisser les doublets se repousser</button>
        <button onClick={remettre} style={{ ...stylePetitBouton(false, '#334155'), minHeight: 42, fontSize: 14 }}>Les remettre au hasard</button>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt, textAlign: 'center', marginTop: 6, minHeight: 20 }} role="status" aria-live="polite">
        {etat === 'desordre' && 'Les doublets sont placés au hasard, trop proches les uns des autres.'}
        {etat === 'en cours' && 'Les doublets se repoussent…'}
        {etat === 'equilibre' && `Équilibre atteint : l’angle entre deux doublets voisins est d’environ ${String(Math.round(ang[0] * 10) / 10).replace('.', ',')}${' '}°.`}
      </div>
    </div>);
}
