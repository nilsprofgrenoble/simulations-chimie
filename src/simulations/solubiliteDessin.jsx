// ====================================================
//  Dessin des molécules de la simulation 53 (solubilité / miscibilité)
//  - formules développées (petites molécules, tous les H) ou topologiques (les C et leurs H ne sont pas écrits)
//  - doublets non liants (notation de Lewis : un tiret par doublet) sur O, N, Cl, I
//  - paires de molécules orientées selon l'interaction : la liaison H X–H…Y est alignée avec la liaison X–H
//    et pointe vers un doublet non liant de Y ; deux dipôles se placent tête-bêche (δ+ face à δ−) ;
//    en l'absence de l'un et de l'autre, les molécules s'empilent côte à côte (dispersion).
//  Coordonnées en « longueurs de liaison » (1 = liaison C–C), axe y vers le haut.
// ====================================================
import { ESPECES, ANA, complementaire } from './solubiliteModele';

const TAU = 2 * Math.PI;
const COUL_EL = { O: '#dc2626', N: '#2563eb', H: '#475569', Cl: '#16a34a', I: '#7c3aed', R: '#a16207', C: '#0f172a' };
const COUL_INTER = { h: '#2563eb', p: '#ea580c', d: '#6b7280' };

const nbDoublets = el => el === 'O' ? 2 : el === 'N' ? 1 : (el === 'Cl' || el === 'I') ? 3 : 0;

// ---------- préparation : atomes, voisins, directions des doublets non liants ----------
const CACHE = {};
function prep(id) {
  if (CACHE[id]) return CACHE[id];
  const m = ESPECES[id];
  const at = m.atoms.map(([el, x, y]) => ({ el, x, y }));
  const vois = at.map(() => []);
  m.bonds.forEach(([i, j]) => { vois[i].push(j); vois[j].push(i); });
  const lp = [];
  at.forEach((a, i) => {
    const n = nbDoublets(a.el); if (!n) return;
    const angs = vois[i].map(j => Math.atan2(at[j].y - a.y, at[j].x - a.x)).sort((p, q) => p - q);
    let deb = 0, larg = TAU;
    if (angs.length) {
      larg = -1;
      angs.forEach((g, k) => { const suiv = angs[(k + 1) % angs.length]; const gap = ((suiv - g + TAU) % TAU) || TAU; if (gap > larg) { larg = gap; deb = g; } });
    }
    for (let k = 1; k <= n; k++) lp.push({ i, a: deb + larg * k / (n + 1) });
  });
  return (CACHE[id] = { id, at, bonds: m.bonds, lp, vois, dev: !!m.dev, hbi: m.hbInterne || [] });
}

// rotation (rad), miroir (y → −y avant rotation), puis translation
function tr(M, { rot = 0, miroir = false, dx = 0, dy = 0 }) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const f = (x, y) => { const yy = miroir ? -y : y; return [x * c - yy * s + dx, x * s + yy * c + dy]; };
  return { ...M, at: M.at.map(a => { const [x, y] = f(a.x, a.y); return { ...a, x, y }; }),
    lp: M.lp.map(l => ({ ...l, a: (miroir ? -l.a : l.a) + rot })) };
}
const deplace = (M, dx, dy) => tr(M, { dx, dy });
const flipX = M => ({ ...M, at: M.at.map(a => ({ ...a, x: -a.x })), lp: M.lp.map(l => ({ ...l, a: Math.PI - l.a })) });

function distMin(A, B, sauf = []) {
  let d = 1e9;
  A.at.forEach((p, i) => B.at.forEach((q, j) => {
    if (sauf.some(([a, b]) => a === i && b === j)) return;
    const v = Math.hypot(p.x - q.x, p.y - q.y); if (v < d) d = v;
  }));
  return d;
}
function boite(Ms) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  Ms.forEach(M => M.at.forEach(a => { x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y); }));
  return { x0: x0 - 0.65, x1: x1 + 0.65, y0: y0 - 0.65, y1: y1 + 0.65 };
}
const echelleFit = (Ms, W, H) => { const b = boite(Ms); return Math.min(W / (b.x1 - b.x0), H / (b.y1 - b.y0)); };

// axe principal (atomes lourds) → horizontal
function axeHorizontal(M) {
  const L = M.at.filter(a => a.el !== 'H'); const P = L.length ? L : M.at;
  const mx = P.reduce((s, a) => s + a.x, 0) / P.length, my = P.reduce((s, a) => s + a.y, 0) / P.length;
  let sxx = 0, syy = 0, sxy = 0; P.forEach(a => { sxx += (a.x - mx) ** 2; syy += (a.y - my) ** 2; sxy += (a.x - mx) * (a.y - my); });
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return tr(deplace(M, -mx, -my), { rot: -th });
}

// ---------- disposition d'une paire selon l'interaction la plus forte ----------
const DHB = 1.45;           // longueur H…Y dessinée
const CACHE_P = {};
function disposerPaire(a, b, W = 360, H = 140) {
  const cle = `${a}|${b}|${W}|${H}`; if (CACHE_P[cle]) return CACHE_P[cle];
  const A0 = prep(a), B0 = prep(b), aa = ANA[a], bb = ANA[b];
  let res = null;
  // 1) liaison hydrogène
  if (complementaire(a, b)) {
    let best = null;
    const essais = (D, Dn, Ac, An, inverse) => {
      Dn.don.forEach(h => {
        const x = D.vois[h][0], al = Math.atan2(D.at[h].y - D.at[x].y, D.at[h].x - D.at[x].x);
        let Dt = tr(D, { rot: -al }); Dt = deplace(Dt, -Dt.at[h].x, -Dt.at[h].y);
        An.acc.forEach(ac => Ac.lp.filter(l => l.i === ac).forEach(l => [false, true].forEach(mir => {
          const phi = mir ? -l.a : l.a;
          let At = tr(Ac, { miroir: mir, rot: Math.PI - phi }); At = deplace(At, DHB - At.at[ac].x, -At.at[ac].y);
          const dm = distMin(Dt, At, [[h, ac]]);
          let G = [Dt, At]; if (inverse) G = [flipX(At), flipX(Dt)];
          const s = echelleFit(G, W, H), score = (dm >= 1.05 ? 0 : 1000 * (1.05 - dm)) - s;
          if (!best || score < best.score) best = { score, G, ligne: inverse ? { t: 'h', m1: 1, i1: h, m2: 0, i2: ac } : { t: 'h', m1: 0, i1: h, m2: 1, i2: ac } };
        })));
      });
    };
    if (aa.don.length && bb.acc.length) essais(A0, aa, B0, bb, false);
    if (bb.don.length && aa.acc.length) essais(B0, bb, A0, aa, true);
    if (best) res = { mols: best.G, lignes: [best.ligne] };
  }
  // 2) dipôle–dipôle : δ+ de A face au δ− de B
  // dipôle dessiné seulement s'il pèse vraiment dans la cohésion (≥ 6 %) : sinon la dispersion domine
  const dipole = (k, an) => { const m = ESPECES[k]; return m.dp >= 3 && m.dp ** 2 / (m.dd ** 2 + m.dp ** 2 + m.dh ** 2) >= 0.06 && an.plus >= 0 && an.moins >= 0; };
  const polA = dipole(a, aa), polB = dipole(b, bb);
  if (!res && polA && polB) {
    const oriente = (M, q) => { let mx = 0, my = 0; M.at.forEach((p, i) => { mx += q[i] * p.x; my += q[i] * p.y; }); return tr(M, { rot: -Math.atan2(my, mx) }); };
    let best = null;
    [false, true].forEach(ma => [false, true].forEach(mb => {
      const At = oriente(tr(A0, { miroir: ma }), aa.q);
      let Bt = oriente(tr(B0, { miroir: mb }), bb.q);
      const pa = At.at[aa.plus], pb0 = Bt.at[bb.moins];
      Bt = deplace(Bt, pa.x + 1.6 - pb0.x, pa.y - pb0.y);
      let k = 0; while (distMin(At, Bt) < 1.25 && k++ < 60) Bt = deplace(Bt, 0.1, 0);
      const s = echelleFit([At, Bt], W, H);
      if (!best || s > best.s) best = { s, mols: [At, Bt] };
    }));
    res = { mols: best.mols, lignes: [{ t: 'p', m1: 0, i1: aa.plus, m2: 1, i2: bb.moins }] };
  }
  // 3) dispersion seule : molécules couchées l'une sous l'autre
  if (!res) {
    const At = axeHorizontal(A0); let Bt = axeHorizontal(B0);
    const yminA = Math.min(...At.at.map(p => p.y)), ymaxB = Math.max(...Bt.at.map(p => p.y));
    Bt = deplace(Bt, 0, yminA - ymaxB - 1.0);
    let k = 0; while (distMin(At, Bt) < 1.45 && k++ < 60) Bt = deplace(Bt, 0, -0.1);
    // quelques contacts (paires d'atomes les plus proches, bien séparées)
    const P = []; At.at.forEach((p, i) => Bt.at.forEach((q, j) => P.push([Math.hypot(p.x - q.x, p.y - q.y), i, j])));
    P.sort((u, v) => u[0] - v[0]);
    const lignes = [];
    for (const [d, i, j] of P) {
      if (d > 2.4 || lignes.length >= 3) break;
      const mx = (At.at[i].x + Bt.at[j].x) / 2;
      if (lignes.every(l => Math.abs(l.mx - mx) > 1.3)) lignes.push({ t: 'd', m1: 0, i1: i, m2: 1, i2: j, mx });
    }
    res = { mols: [At, Bt], lignes };
  }
  return (CACHE_P[cle] = res);
}

// ---------- rendu ----------
function chemin(x1, y1, x2, y2) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, n = Math.max(3, Math.round(L / 5));
  const pts = []; for (let k = 0; k <= n; k++) { const t = k / n, o = (k % 2 ? 1 : -1) * (k === 0 || k === n ? 0 : 3.2); pts.push(`${x1 + ux * L * t - uy * o},${y1 + uy * L * t + ux * o}`); }
  return pts.join(' ');
}
// directions libres autour d'un atome (pour placer δ+ / δ−)
function dirLibre(M, i, extra = []) {
  const occ = [...extra, ...M.vois[i].map(j => Math.atan2(M.at[j].y - M.at[i].y, M.at[j].x - M.at[i].x)), ...M.lp.filter(l => l.i === i).map(l => l.a)];
  if (!occ.length) return Math.PI / 4;
  let best = 0, bd = -1;
  for (let k = 0; k < 24; k++) { const t = k * TAU / 24; const d = Math.min(...occ.map(o => { const e = Math.abs(((t - o) % TAU + TAU) % TAU); return Math.min(e, TAU - e); })); if (d > bd) { bd = d; best = t; } }
  return best;
}
const estPolaireH = (M, i) => { const a = M.at[i]; if (a.el === 'O' || a.el === 'N') return true; if (a.el !== 'H') return false; const o = M.at[M.vois[i][0]]; return !!o && (o.el === 'O' || o.el === 'N'); };

// mols : molécules disposées ; lignes : interactions ; opts : doublets, halos, charges ('toutes' | 'inter' | null)
export function Scene({ mols, lignes = [], W, H, smax = 34, doublets = true, halos = false, charges = null, legende = null }) {
  const bx = boite(mols), s = Math.min(W / (bx.x1 - bx.x0), H / (bx.y1 - bx.y0), smax);
  const ox = (W - (bx.x1 - bx.x0) * s) / 2 - bx.x0 * s, oy = (H - (bx.y1 - bx.y0) * s) / 2 + bx.y1 * s;
  const X = x => ox + x * s, Y = y => oy - y * s;
  const fs = Math.max(8, Math.min(16, s * 0.46));
  const voirLP = doublets && s >= 13;
  const elems = [];
  const lab = (M, i) => M.dev || M.at[i].el !== 'C';
  mols.forEach((M, m) => {
    const rl = i => lab(M, i) ? (M.at[i].el.length > 1 ? fs * 0.75 : fs * 0.55) : 0;
    if (halos) M.at.forEach((p, i) => { if (!M.dev && p.el === 'H' && !estPolaireH(M, i)) return; const pol = estPolaireH(M, i);
      elems.push(<circle key={`h${m}-${i}`} cx={X(p.x)} cy={Y(p.y)} r={Math.max(6, s * 0.6)} fill={pol ? '#3b82f6' : '#facc15'} opacity={pol ? 0.22 : 0.28}/>); });
    M.hbi.forEach(([h, a2], k) => elems.push(<line key={`hi${m}-${k}`} x1={X(M.at[h].x)} y1={Y(M.at[h].y)} x2={X(M.at[a2].x)} y2={Y(M.at[a2].y)} stroke={COUL_INTER.h} strokeWidth="1.8" strokeDasharray="3 3"/>));
    M.bonds.forEach(([i, j, o]) => {
      const a = M.at[i], b = M.at[j], L = Math.hypot(b.x - a.x, b.y - a.y) * s || 1;
      const ux = (X(b.x) - X(a.x)) / L, uy = (Y(b.y) - Y(a.y)) / L, ra = rl(i), rb = rl(j);
      const x1 = X(a.x) + ux * ra, y1 = Y(a.y) + uy * ra, x2 = X(b.x) - ux * rb, y2 = Y(b.y) - uy * rb;
      const sw = Math.max(1.2, Math.min(2, s * 0.06));
      if (o === 2) { const e = Math.max(2, s * 0.09), nx = -uy * e, ny = ux * e;
        elems.push(<g key={`b${m}-${i}-${j}`}><line x1={x1 + nx} y1={y1 + ny} x2={x2 + nx} y2={y2 + ny} stroke="#0f172a" strokeWidth={sw}/><line x1={x1 - nx} y1={y1 - ny} x2={x2 - nx} y2={y2 - ny} stroke="#0f172a" strokeWidth={sw}/></g>); }
      else elems.push(<line key={`b${m}-${i}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0f172a" strokeWidth={sw}/>);
    });
    if (voirLP) M.lp.forEach((l, k) => { const p = M.at[l.i], r = fs * 0.78, d = fs * 0.32, cx = X(p.x) + Math.cos(l.a) * r, cy = Y(p.y) - Math.sin(l.a) * r;
      const px = Math.sin(l.a) * d, py = Math.cos(l.a) * d;
      elems.push(<line key={`l${m}-${k}`} x1={cx - px} y1={cy - py} x2={cx + px} y2={cy + py} stroke={COUL_EL[p.el] || '#0f172a'} strokeWidth="1.7" strokeLinecap="round"/>); });
    M.at.forEach((p, i) => { if (!lab(M, i)) return;
      elems.push(<text key={`a${m}-${i}`} x={X(p.x)} y={Y(p.y) + fs * 0.36} textAnchor="middle" fontSize={p.el === 'H' ? fs * 0.88 : fs} fontWeight="700" fill={COUL_EL[p.el] || '#0f172a'}>{p.el}</text>); });
  });
  // charges partielles
  const delta = (m, i, signe, k, extra = []) => { const M = mols[m], t = dirLibre(M, i, extra), r = fs * 1.15, p = M.at[i];
    return <text key={`q${k}`} x={X(p.x) + Math.cos(t) * r} y={Y(p.y) - Math.sin(t) * r + fs * 0.3} textAnchor="middle" fontSize={fs * 0.78} fontWeight="800" fill={signe > 0 ? '#2563eb' : '#dc2626'}>{signe > 0 ? 'δ+' : 'δ−'}</text>; };
  if (charges === 'toutes') mols.forEach((M, m) => ANA[M.id].q.forEach((q, i) => { if (q) elems.push(delta(m, i, q, `${m}-${i}`)); }));
  if (charges === 'inter') lignes.filter(l => l.t !== 'd').forEach((l, k) => {
    const p = mols[l.m1].at[l.i1], q = mols[l.m2].at[l.i2], ang = Math.atan2(q.y - p.y, q.x - p.x);
    elems.push(delta(l.m1, l.i1, 1, `i${k}a`, [ang])); elems.push(delta(l.m2, l.i2, -1, `i${k}b`, [ang + Math.PI])); });
  // interactions
  lignes.forEach((l, k) => {
    const p = mols[l.m1].at[l.i1], q = mols[l.m2].at[l.i2];
    let x1 = X(p.x), y1 = Y(p.y), x2 = X(q.x), y2 = Y(q.y); const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const r = fs * 0.6; x1 += ux * r; y1 += uy * r; x2 -= ux * r * 1.5; y2 -= uy * r * 1.5;
    if (l.t === 'd') elems.push(<polyline key={`i${k}`} points={chemin(x1, y1, x2, y2)} fill="none" stroke={COUL_INTER.d} strokeWidth="1.6"/>);
    else elems.push(<line key={`i${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COUL_INTER[l.t]} strokeWidth={l.t === 'h' ? 3 : 2.6} strokeDasharray={l.t === 'h' ? '5 3' : '2 4'} strokeLinecap="round"/>);
  });
  return <g>{elems}{legende}</g>;
}

// formule seule (cartes) : taille de la vignette adaptée à la forme de la molécule
function dimsFormule(id, W = 300) {
  const M = prep(id), b = boite([M]), bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const sc = Math.min(38, W / bw, 230 / bh);
  return { W, H: Math.round(Math.max(70, bh * sc + 6)) };
}
export function FormuleSVG({ id, W = 300, charges = true, halos = true }) {
  const { H } = dimsFormule(id, W), M = prep(id);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={`Formule de ${ESPECES[id].nom}`}>
      <Scene mols={[M]} W={W} H={H} smax={38} halos={halos} charges={charges && M.dev ? 'toutes' : null}/>
    </svg>);
}

export function PaireSVG({ a, b, titre, sous, W = 360, H = 140 }) {
  const { mols, lignes } = disposerPaire(a, b, W, H - 18);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img" aria-label={`${titre} : ${ESPECES[a].nom} et ${ESPECES[b].nom}`}>
      <g transform="translate(0,0)"><Scene mols={mols} lignes={lignes} W={W} H={H - 18} smax={40} charges="inter"/></g>
      <text x="6" y={H - 4} fontSize="12" fontWeight="700" fill="#0f172a">{titre}</text>
      <text x={W - 6} y={H - 4} textAnchor="end" fontSize="11" fill="#475569">{sous}</text>
    </svg>);
}
