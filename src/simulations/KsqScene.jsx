/* eslint-disable react-refresh/only-export-components */
import { useId } from "react";
import * as M from "./ksqModele";
import { coordSvg } from "./exploAnim";

// ====================================================
//  Scène animée de la simulation 309 : deux solutions ioniques (cations, anions) versées dans un bécher ; les ions se rencontrent ;
//  si Qr > Ks, des ions disparaissent et des grains de solide se forment puis tombent ; la jauge log(Qr ÷ Ks) glisse jusqu'à l'équilibre (Qr = Ks).
//  La scène est une fonction pure de f (avancement de la lecture, 0 à 1) : t < 0,12 les béchers s'approchent et se penchent, 0,12 à 0,3 le liquide coule,
//  0,3 à 0,42 ils reviennent vides, 0,45 à 1 la précipitation. Le nombre de points d'ions suit une échelle logarithmique de la concentration (qualitatif).
// ====================================================
export const LC_PAS = 0.25;
// Plage des curseurs de concentration (échelle logarithmique) : 5 décades centrées sur le double de la concentration saturée de l'ion
export function plageLc(sel, qui) { const cs = (qui === 'cation' ? sel.a : sel.b) * M.solubilite(sel), mid = Math.log10(2 * cs), min = Math.round((mid - 2.5) / LC_PAS) * LC_PAS; return { min, max: min + 5 }; }
export const concDe = lc => Number((Math.pow(10, lc)).toPrecision(2));
export const T_FIN = 7;                                  // s d'animation
export const lcDefaut = (sel, qui, plus = 0.75) => { const { min } = plageLc(sel, qui); return min + 2.5 + plus; };
export const exInitial = () => { const sel = M.SELS.CaF2; return { sel: 'CaF2', lc1: lcDefaut(sel, 'cation'), lc2: lcDefaut(sel, 'anion'), c0: 0 }; };
export const V_SRC_ML = 50;                // volume de chaque solution versée
export const COUL_SOLIDE = { AgI: '#fcd34d', CuI: '#d6d3d1', SrCO3: '#e7e5e4', CaF2: '#e7e5e4', Ag2CO3: '#fde68a' };
const CAT = '#0369a1', AN = '#c2410c', STROKE = '#334155';
const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const nIons = (c, cSat) => clamp(Math.round(2 + 5.2 * (Math.log10(Math.max(c, 1e-14) / cSat) + 2.25)), 0, 30);
const nGrains = x => (x > 0 ? clamp(Math.round(4 + 2.6 * (Math.log10(x) + 8)), 3, 26) : 0);
const spot = (k, s) => ({ u: ((k + 1) * (0.6180339887 + s * 0.137)) % 1, v: ((k + 1) * (0.7548776662 + s * 0.071)) % 1 });

const LAY = {
  large: { W: 700, H: 400, srcB: 290, srcH: 120, srcW: 92, catX: 30, anX: 190, tCat: 142, tAn: 302, bx: 385, bw: 270, bh: 180, bB: 290, gY: 342, gX0: 50, gX1: 650, fs: 1 },
  etroit: { W: 420, H: 566, srcB: 190, srcH: 104, srcW: 84, catX: 22, anX: 222, tCat: 124, tAn: 324, bx: 64, bw: 292, bh: 176, bB: 440, gY: 500, gX0: 30, gX1: 390, fs: 1.18 },
};

// État calculé de la scène (fonction pure) : concentrations de départ, après mélange, après précipitation
export function etatScene(sel, lc1, lc2) {
  const c1 = concDe(lc1), c2 = concDe(lc2), m = M.apresMelange(c1, V_SRC_ML, c2, V_SRC_ML);
  const q0 = M.qr(sel, m.c1, m.c2), v = M.verdict(q0, sel.Ks), p = M.precipitation(sel, m.c1, m.c2);
  const mg = p.x * (2 * V_SRC_ML / 1000) * sel.M * 1000;      // masse de solide formé, en mg
  return { c1, c2, m, q0, v, p, mg, x: p.x };
}

export function ScenePrecipitation({ sel, lc1, lc2, setLc1, setLc2, f, ph = 0, etroit = false, touche = true, svgRef, aria, solo = false }) {
  const id = useId().replace(/:/g, ''), D0 = etroit ? LAY.etroit : LAY.large, fs = D0.fs, D = solo ? { ...D0, bx: (D0.W - D0.bw) / 2, H: D0.bB + 40 } : D0, cs = M.concSat(sel);
  const e = etatScene(sel, lc1, lc2), sol = COUL_SOLIDE[sel.id] || '#e7e5e4';
  const fin = f != null, ff = fin ? f : 0;
  const pPour = ease(ff / 0.12) * (ff < 0.3 ? 1 : 1 - ease((ff - 0.3) / 0.12)), jeu = fin && ff > 0;
  const stream = ff > 0.1 && ff < 0.33 ? Math.min(1, (ff - 0.1) / 0.04) * (1 - ease((ff - 0.29) / 0.04)) : 0;
  const niveau = fin ? ease((ff - 0.12) / 0.18) : 0;            // 0 = bécher principal vide, 1 = rempli
  const liquide = clamp(niveau, 0, 1), hL = (D.bh - 10) * (0.18 + 0.62 * liquide), yL = D.bB - hL;
  const lvlSrc = (fin ? 1 - clamp((ff - 0.14) / 0.16, 0, 1) : 1) * 0.85;
  const nCat0 = nIons(e.m.c1, cs.cation), nAn0 = nIons(e.m.c2, cs.anion), nCat1 = nIons(e.p.cCat, cs.cation), nAn1 = nIons(e.p.cAn, cs.anion);
  const prec = e.x > 0, avance = prec ? ease((ff - 0.45) / 0.5) : 0;       // avancement de la précipitation
  const ng = nGrains(e.x);
  const reg = { x0: D.bx + 14, x1: D.bx + D.bw - 14, y0: yL + 12, y1: D.bB - 12 };
  const pos = (k, s, t) => { const { u, v } = spot(k, s); const dx = 3.5 * Math.sin(ph * 1.3 + k * 1.7 + s), dy = 3.5 * Math.cos(ph * 1.1 + k * 2.3 + s * 3); return { x: reg.x0 + u * (reg.x1 - reg.x0) + dx * t, y: reg.y0 + v * (reg.y1 - reg.y0) + dy * t }; };
  // ions du bécher principal : les premiers restent, les derniers disparaissent quand le solide se forme
  const ions = [];
  const visibles = niveau >= 1 || ff >= 0.3;
  if (fin && visibles) {
    for (let k = 0; k < nCat0; k++) { const reste = k < nCat1 ? 1 : 1 - avance; if (reste > 0.02) ions.push({ k, s: 0, signe: '+', col: CAT, op: reste * clamp((ff - 0.22) / 0.1, 0, 1) }); }
    for (let k = 0; k < nAn0; k++) { const reste = k < nAn1 ? 1 : 1 - avance; if (reste > 0.02) ions.push({ k, s: 1, signe: '−', col: AN, op: reste * clamp((ff - 0.22) / 0.1, 0, 1) }); }
  }
  // grains : ils naissent à la place des ions qui disparaissent, puis tombent et s'empilent au fond
  const grains = [];
  for (let k = 0; k < ng; k++) {
    const t0 = 0.45 + 0.35 * (k / Math.max(ng, 1)), tk = clamp((ff - t0) / 0.2, 0, 1);
    if (!prec || tk <= 0) continue;
    const { u, v } = spot(k + 40, 2), x0 = reg.x0 + u * (reg.x1 - reg.x0), y0 = reg.y0 + v * (reg.y1 - reg.y0);
    const lit = Math.floor(k / 7), col = k % 7, xr = D.bx + 22 + (col + 0.5 + (lit % 2) * 0.5) * ((D.bw - 44) / 7.5), yr = D.bB - 9 - lit * 8;
    const w = ease(tk);
    grains.push({ k, x: x0 + (xr - x0) * w, y: y0 + (yr - y0) * w, op: Math.min(1, tk * 4), r: 4.2 + (k % 3) * 0.8 });
  }
  const trouble = prec ? Math.sin(Math.PI * clamp((ff - 0.45) / 0.5, 0, 1)) * 0.28 : 0;
  // jauge
  const lq = (q) => clamp(Math.log10(q / sel.Ks), -8, 8), xg = l => D.gX0 + (l + 8) / 16 * (D.gX1 - D.gX0);
  const lq0 = lq(e.q0), lqNow = prec ? lq0 * (1 - avance) : lq0;
  const yG = D.gY, hb = 20 * fs;
  const col = e.v === 'precipite' ? '#b91c1c' : e.v === 'sature' ? '#b45309' : '#15803d';
  const tracks = [[D.tCat, lc1, setLc1, 'cation'], [D.tAn, lc2, setLc2, 'anion']];
  const source = ({ x, ton, ion, lib, nom, c, n, ang0, dx, dy, cle }) => {
    const cx = x + D.srcW / 2, bas = D.srcB, top = bas - D.srcH, ang = ang0 * pPour, tx = dx * pPour, ty = dy * pPour;
    const h = D.srcH * lvlSrc, y = bas - h, clip = `${id}s${cle}`;
    const nn = Math.round(n * (1 - clamp((ff - 0.14) / 0.16, 0, 1)));
    return [(<g key={cle} transform={`translate(${tx.toFixed(1)} ${ty.toFixed(1)}) rotate(${ang.toFixed(1)} ${x + D.srcW} ${top})`}>
      <clipPath id={clip}><path d={`M${x} ${top} L${x + 5} ${bas - 3} Q${x + 6} ${bas} ${x + 12} ${bas} L${x + D.srcW - 12} ${bas} Q${x + D.srcW - 6} ${bas} ${x + D.srcW - 5} ${bas - 3} L${x + D.srcW} ${top} Z`}/></clipPath>
      <g clipPath={`url(#${clip})`}><g transform={`rotate(${(-ang).toFixed(1)} ${x + D.srcW} ${top})`}>
        <rect x={x - 80} y={y} width={D.srcW + 160} height={D.srcH + 120} fill={ton} opacity="0.85"/>
        {Array.from({ length: nn }).map((_, k) => { const { u, v } = spot(k, cle === 'a' ? 0 : 1); return <circle key={k} cx={x + 8 + u * (D.srcW - 16) + 2.2 * Math.sin(ph * 1.3 + k)} cy={y + 8 + v * Math.max(4, h - 16)} r={3.6 * Math.max(1, fs * 0.95)} fill={c} opacity="0.9"/>; })}
      </g></g>
      <path d={`M${x} ${top} L${x + 5} ${bas - 3} Q${x + 6} ${bas} ${x + 12} ${bas} L${x + D.srcW - 12} ${bas} Q${x + D.srcW - 6} ${bas} ${x + D.srcW - 5} ${bas - 3} L${x + D.srcW} ${top}`} fill="none" stroke={STROKE} strokeWidth="2.4" strokeLinecap="round"/>
      <path d={`M${x + 9} ${top + 8} L${x + 12} ${bas - 14}`} stroke="#fff" strokeWidth="3" opacity="0.7" strokeLinecap="round"/>
      <text x={cx} y={bas + 17 * fs} textAnchor="middle" fontSize={12.5 * fs} fill="#475569" opacity={1 - pPour}>{nom}</text>
    </g>),
    <g key={cle + 't'} opacity={1 - 0.65 * pPour}>
      <text x={cx} y={top - 26 * fs} textAnchor="middle" fontSize={14 * fs} fontWeight="700" fill={c}>{ion}</text>
      <text x={cx} y={top - 8} textAnchor="middle" fontSize={12.5 * fs} fontWeight="700" fill={c}>{lib}</text>
    </g>];
  };
  const lipCat = { x: D.bx + D.bw * 0.3, y: D.bB - D.bh - 22 }, lipAn = { x: D.bx + D.bw * 0.7, y: D.bB - D.bh - 22 };
  const srcTop = D.srcB - D.srcH;
  const cible = (x0, lip) => ({ dx: lip.x - (x0 + D.srcW) + 0, dy: lip.y - srcTop - (etroit ? 6 : 0) });
  const cC = cible(D.catX, lipCat), cA = cible(D.anX, lipAn);
  const bandes = [[-8, -0.02, '#dcfce7', 'dissolution'], [-0.02, 0.02, '#fde68a', ''], [0.02, 8, '#fee2e2', 'précipitation']];
  return (
    <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${D.W} ${D.H}`} role="group" aria-label={aria} style={{ background: 'linear-gradient(#f0f9ff, #fff 70%)' }}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" x2="1"><stop offset="0" stopColor="#bae6fd" stopOpacity="0.9"/><stop offset="1" stopColor="#e0f2fe" stopOpacity="0.8"/></linearGradient>
        <clipPath id={`${id}m`}><path d={`M${D.bx} ${D.bB - D.bh} L${D.bx + 6} ${D.bB - 4} Q${D.bx + 7} ${D.bB} ${D.bx + 14} ${D.bB} L${D.bx + D.bw - 14} ${D.bB} Q${D.bx + D.bw - 7} ${D.bB} ${D.bx + D.bw - 6} ${D.bB - 4} L${D.bx + D.bw} ${D.bB - D.bh} Z`}/></clipPath>
        <filter id={`${id}o`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.2"/></filter>
      </defs>
      {/* paillasse */}
      <rect x="0" y={D.bB} width={D.W} height="9" fill="#cbd5e1"/><rect x="0" y={D.bB + 9} width={D.W} height="3" fill="#94a3b8"/>
      {/* bécher principal */}
      <g filter={`url(#${id}o)`}>
        <g clipPath={`url(#${id}m)`}>
          <rect x={D.bx} y={yL} width={D.bw} height={hL + 10} fill={`url(#${id}b)`}/>
          <rect x={D.bx} y={yL} width={D.bw} height={hL + 10} fill="#fff" opacity={trouble}/>
          <line x1={D.bx} x2={D.bx + D.bw} y1={yL} y2={yL} stroke="#38bdf8" strokeWidth="2" opacity={liquide > 0.02 ? 0.8 : 0}/>
          {ions.map(o => { const p = pos(o.k, o.s, 1); return <g key={`${o.s}${o.k}`} opacity={o.op}><circle cx={p.x} cy={p.y} r={6.2 * Math.max(1, fs * 0.95)} fill={o.col} stroke="#fff" strokeWidth="1.2"/><text x={p.x} y={p.y + 4.2 * fs} textAnchor="middle" fontSize={10.5 * fs} fontWeight="800" fill="#fff">{o.signe}</text></g>; })}
          {grains.map(q => <rect key={q.k} x={q.x - q.r} y={q.y - q.r} width={q.r * 2} height={q.r * 1.8} rx="1.6" fill={sol} stroke="#78716c" strokeWidth="1.1" opacity={q.op} transform={`rotate(${(q.k * 37) % 50 - 25} ${q.x} ${q.y})`}/>)}
        </g>
        <path d={`M${D.bx} ${D.bB - D.bh} L${D.bx + 6} ${D.bB - 4} Q${D.bx + 7} ${D.bB} ${D.bx + 14} ${D.bB} L${D.bx + D.bw - 14} ${D.bB} Q${D.bx + D.bw - 7} ${D.bB} ${D.bx + D.bw - 6} ${D.bB - 4} L${D.bx + D.bw} ${D.bB - D.bh}`} fill="none" stroke={STROKE} strokeWidth="2.6" strokeLinecap="round"/>
        <path d={`M${D.bx + 12} ${D.bB - D.bh + 10} L${D.bx + 17} ${D.bB - 18}`} stroke="#fff" strokeWidth="4" opacity="0.7" strokeLinecap="round"/>
      </g>
      <text x={D.bx + D.bw / 2} y={D.bB - D.bh - 8 * fs} textAnchor="middle" fontSize={13.5 * fs} fontWeight="700" fill="#0f172a" opacity={solo ? 1 : (ff < 0.12 || ff > 0.42 ? 1 : 0.1)}>{solo ? `Solution saturée de ${sel.f} avec son dépôt` : `Mélange : ${M.sciNb(e.m.c1, 1)} et ${M.sciNb(e.m.c2, 1)} mol/L`}</text>
      {/* filets de liquide versé */}
      {!solo && stream > 0 && [[lipCat, '#7dd3fc'], [lipAn, '#fdba74']].map(([l, c], i) => <path key={i} d={`M${l.x} ${l.y} Q${l.x + 1} ${(l.y + yL) / 2} ${l.x} ${yL}`} stroke={c} strokeWidth={5 * stream} fill="none" strokeLinecap="round" opacity="0.9"/>)}
      {/* béchers sources */}
      {!solo && source({ x: D.catX, ton: "#bae6fd", ion: sel.cation, lib: `${M.sciNb(e.c1, 1)} mol/L`, nom: `solution de ${sel.cation}`, c: CAT, n: nIons(e.c1 / 2, cs.cation), ang0: -38, dx: cC.dx, dy: cC.dy, cle: "a" })}
      {!solo && source({ x: D.anX, ton: "#fed7aa", ion: sel.anion, lib: `${M.sciNb(e.c2, 1)} mol/L`, nom: `solution de ${sel.anion}`, c: AN, n: nIons(e.c2 / 2, cs.anion), ang0: -38, dx: cA.dx, dy: cA.dy, cle: "b" })}
      {/* poignées de concentration (échelle logarithmique) */}
      {!solo && setLc1 && (!jeu || ff >= 0.45) && tracks.map(([tx, lc, set, qui], i) => {
        const { min: LC_MIN, max: LC_MAX } = plageLc(sel, qui), y0 = D.srcB - D.srcH + 4, y1 = D.srcB - 6, yk = y0 + (LC_MAX - lc) / (LC_MAX - LC_MIN) * (y1 - y0), r = etroit ? 20 : 15;
        const poser = ev => { const { Y } = coordSvg(svgRef.current, ev); set(clamp(Math.round((LC_MAX - (Y - y0) / (y1 - y0) * (LC_MAX - LC_MIN)) / LC_PAS) * LC_PAS, LC_MIN, LC_MAX)); };
        return (
          <g key={qui}>
            <line x1={tx} x2={tx} y1={y0} y2={y1} stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/>
            <text x={tx} y={y0 - 8} textAnchor="middle" fontSize={11 * fs} fill="#64748b" fontWeight="700">+</text><text x={tx} y={y1 + 14 * fs} textAnchor="middle" fontSize={11 * fs} fill="#64748b" fontWeight="700">−</text>
            <g className="xa-poignee" role="slider" tabIndex={0} aria-label={`Concentration de la solution d’ions ${qui === 'cation' ? sel.cation : sel.anion} (échelle logarithmique) : flèches haut et bas`} aria-valuemin={LC_MIN} aria-valuemax={LC_MAX} aria-valuenow={lc} aria-valuetext={`${M.sciNb(concDe(lc), 1)} mol/L`}
              onPointerDown={ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); ev.currentTarget.dataset.d = '1'; poser(ev); }}
              onPointerMove={ev => { if (ev.currentTarget.dataset.d === '1') poser(ev); }}
              onPointerUp={ev => { ev.currentTarget.dataset.d = ''; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } }}
              onKeyDown={ev => { const d = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? LC_PAS : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -LC_PAS : 0; if (d) { ev.preventDefault(); set(clamp(lc + d, LC_MIN, LC_MAX)); } }}>
              <rect x={tx - 26} y={y0 - 6} width="52" height={y1 - y0 + 12} fill="transparent"/>
              <circle className="xa-anneau" cx={tx} cy={yk} r={r} fill="#fff" stroke={qui === 'cation' ? CAT : AN} strokeWidth="3.5"/>
              <path d={`M${tx - 5} ${yk - 3} l5 -5 l5 5 M${tx - 5} ${yk + 3} l5 5 l5 -5`} stroke={qui === 'cation' ? CAT : AN} strokeWidth="2" fill="none"/>
              {!touche && i === 0 && <circle className="xa-pulse" cx={tx} cy={yk} r={r + 5} fill="none" stroke={CAT} strokeWidth="3"/>}
            </g>
          </g>);
      })}
      {!solo && <g>
      <text x={D.gX0} y={yG - 24 * fs} fontSize={13 * fs} fontWeight="700" fill="#0f172a">Qr comparé à Ks (échelle logarithmique)</text>
      {bandes.map(([a, b, c, t]) => <rect key={t + a} x={xg(a)} y={yG} width={xg(b) - xg(a)} height={hb} fill={c} stroke={STROKE} strokeWidth="0.8"/>)}
      <text x={xg(-4)} y={yG + hb - 5 * fs} textAnchor="middle" fontSize={12 * fs} fontWeight="700" fill="#166534">Qr &lt; Ks : dissolution</text>
      <text x={xg(4)} y={yG + hb - 5 * fs} textAnchor="middle" fontSize={12 * fs} fontWeight="700" fill="#991b1b">Qr &gt; Ks : précipitation</text>
      {[-6, -3, 0, 3, 6].map(l => <g key={l}><line x1={xg(l)} x2={xg(l)} y1={yG + hb} y2={yG + hb + 5} stroke={STROKE}/><text x={xg(l)} y={yG + hb + 18 * fs} textAnchor="middle" fontSize={11 * fs} fill="#475569">{l === 0 ? 'Qr = Ks' : `Qr ÷ Ks = 10${M.sup(l)}`.replace('Qr ÷ Ks = ', '')}</text></g>)}
      <g style={{ transition: 'none' }}><polygon points={`${xg(lqNow)},${yG - 2} ${xg(lqNow) - 8},${yG - 14} ${xg(lqNow) + 8},${yG - 14}`} fill={prec && avance > 0.98 ? '#15803d' : col} stroke="#fff" strokeWidth="1.5"/>
        <line x1={xg(lqNow)} x2={xg(lqNow)} y1={yG - 2} y2={yG + hb} stroke={prec && avance > 0.98 ? '#15803d' : col} strokeWidth="2.5"/></g></g>}
    </svg>);
}
