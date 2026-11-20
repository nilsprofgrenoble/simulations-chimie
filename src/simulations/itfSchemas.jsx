// ====================================================
//  Schémas de la simulation 183 (interférences de deux ondes ; niveau TG).
//  Règles : textes de 16 à 18 dans un viewBox de 400 (cartes : 14 à 16 dans un viewBox de 320) ; chaque objet est nommé dans le dessin ;
//  jamais la couleur seule (trait plein / tirets / épaisseur / forme) ; valeurs de x et y toujours numériques.
// ====================================================
import { useEffect, useMemo, useRef, useDeferredValue } from 'react';
import { champCuveDeux } from './ondesModele.js';
import * as M from './itfModele.js';
import { COL } from './itfStyle.js';

const virg = (x, d = 2) => Number(x).toFixed(d).replace('.', ',').replace('-', '−');
const halo = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const stlCarte = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

// ---------- petite flèche à pointe fixe ----------
const Fl = ({ x1, y1, x2, y2, c = COL.txt, w = 2, tete = 8 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, bx = x2 - ux * tete, by = y2 - uy * tete;
  return <g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${bx - uy * tete * 0.4},${by + ux * tete * 0.4} ${bx + uy * tete * 0.4},${by - ux * tete * 0.4}`} fill={c}/></g>;
};
const Cote = ({ x1, y1, x2, y2, c = COL.txt }) => <g><Fl x1={x1} y1={y1} x2={x2} y2={y2} c={c} tete={7}/><Fl x1={x2} y1={y2} x2={x1} y2={y1} c={c} tete={7}/></g>;
const sinus = (x0, w, yc, amp, cycles, ph, n = 64) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return `${i ? 'L' : 'M'}${(x0 + w * u).toFixed(1)},${(yc - amp * Math.cos(2 * Math.PI * cycles * u - ph)).toFixed(1)}`; }).join(' ');

// ====================================================
//  CUVE À ONDES À DEUX VIBREURS (canvas + calque SVG)
// ====================================================
const CUVE = { W: 400, H: 280, PXCM: 10, X0: 78, Y0: 140, CW: 600, CH: 420, CELL: 2 };
const toPx = (x, y) => [CUVE.X0 + x * CUVE.PXCM, CUVE.Y0 - y * CUVE.PXCM];
const LIM = { xmin: 2, xmax: 29, ymax: 10.5 };

export function CuveDeux({ s, f, vue = 'ondes', anim = false, lignes = false, pt = null, setPt = null, rayons = false, legende = true }) {
  const lam = M.lambdaCm(f), sD = useDeferredValue(s), lD = useDeferredValue(lam);
  const ref = useRef(null), glisse = useRef(false), temps = useRef(0);
  const GX = CUVE.CW / CUVE.CELL, GY = CUVE.CH / CUVE.CELL, k = CUVE.CELL * CUVE.W / CUVE.CW;       // k : taille d’une cellule en unités du viewBox
  const champ = useMemo(() => {
    const xs = Array.from({ length: GX }, (_, i) => ((i + 0.5) * k - CUVE.X0) / CUVE.PXCM), ys = Array.from({ length: GY }, (_, j) => (CUVE.Y0 - (j + 0.5) * k) / CUVE.PXCM);
    return champCuveDeux({ s: sD, lambda: lD, xs, ys });
  }, [sD, lD, GX, GY, k]);
  useEffect(() => {
    const cv = ref.current; if (!cv) return undefined;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(CUVE.CW, CUVE.CH), d = img.data, w = 2 * Math.PI * 0.6, C = CUVE.CELL;
    let raf, dernier = performance.now();
    const dessine = () => {
      const ph = w * temps.current, c = Math.cos(ph), sn = Math.sin(ph);
      for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++) {
        const i = gy * GX + gx; let r, g, b;
        if (vue === 'amplitude') { const a = Math.min(1, Math.hypot(champ.re[i], champ.im[i]) / (champ.w[i] || 1)); r = 238 - 200 * a; g = 244 - 140 * a; b = 250 - 40 * a; }
        else { const q = Math.max(-1, Math.min(1, (champ.re[i] * c + champ.im[i] * sn) / (1.1 * (champ.w[i] || 1)))) * 0.5 + 0.5; r = 40 + 195 * q; g = 100 + 140 * q; b = 160 + 90 * q; }
        for (let dy = 0; dy < C; dy++) for (let dx = 0; dx < C; dx++) { const o = ((gy * C + dy) * CUVE.CW + gx * C + dx) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255; }
      }
      ctx.putImageData(img, 0, 0);
    };
    const boucle = now => { temps.current += Math.min(0.05, (now - dernier) / 1000); dernier = now; dessine(); raf = requestAnimationFrame(boucle); };
    if (anim) raf = requestAnimationFrame(boucle); else dessine();
    return () => raf && cancelAnimationFrame(raf);
  }, [champ, vue, anim, GX, GY]);
  const [x1, y1] = toPx(0, s / 2), [x2, y2] = toPx(0, -s / 2);
  const hyper = useMemo(() => {
    const L = [];
    for (let n = 0; n <= 2 * Math.ceil(s / lam) + 1; n++) {
      const d = n * lam / 2; if (d >= s - 1e-9) break;
      const dest = n % 2 === 1, pts = [];
      for (let x = -8; x <= 32.01; x += 0.5) { const y = M.yPourDelta(s, d, x); if (y != null) pts.push([x, y]); }
      for (const sg of d === 0 ? [1] : [1, -1]) L.push({ dest, d: pts.map(([x, y]) => { const [px, py] = toPx(x, sg * y); return `${px.toFixed(1)},${py.toFixed(1)}`; }).join(' ') });
    }
    return L;
  }, [s, lam]);
  const versCm = e => { const r = ref.current.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * CUVE.W, py = (e.clientY - r.top) / r.height * CUVE.H; return { x: Math.max(LIM.xmin, Math.min(LIM.xmax, (px - CUVE.X0) / CUVE.PXCM)), y: Math.max(-LIM.ymax, Math.min(LIM.ymax, (CUVE.Y0 - py) / CUVE.PXCM)) }; };
  const [mx, my] = pt ? toPx(pt.x, pt.y) : [0, 0];
  const etiq = (a, b, mx2, my2, dessus) => { const t = 0.5, px = a + (mx2 - a) * t, py = b + (my2 - b) * t, L = Math.hypot(mx2 - a, my2 - b) || 1, nx = -(my2 - b) / L, ny = (mx2 - a) / L, sg = (dessus ? -1 : 1) * (ny > 0 ? 1 : -1); return [px + nx * sg * 14, py + ny * sg * 14 + 5]; };
  const [e1x, e1y] = pt ? etiq(x1, y1, mx, my, true) : [0, 0], [e2x, e2y] = pt ? etiq(x2, y2, mx, my, false) : [0, 0];
  const gx0 = 4, gy0 = CUVE.Y0 - 24;
  return (
    <div style={{ position: 'relative', lineHeight: 0, maxWidth: 480, margin: '0 auto' }}>
      <canvas ref={ref} width={CUVE.CW} height={CUVE.CH} style={{ width: '100%', borderRadius: 8, display: 'block', background: '#e0e8f0' }}
        role="img" aria-label={`Cuve à ondes vue de dessus : deux vibreurs S1 et S2, distants de ${virg(s, 0)} cm, reliés au même générateur de fréquence ${f} Hz`}/>
      <svg aria-hidden="true" viewBox={`0 0 ${CUVE.W} ${CUVE.H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        onPointerMove={e => { if (glisse.current && setPt) setPt(versCm(e)); }} onPointerUp={() => { glisse.current = false; }} onPointerLeave={() => { glisse.current = false; }}>
        {lignes && hyper.map((h, i) => <g key={i}><polyline points={h.d} fill="none" stroke="#fff" strokeWidth="5" opacity="0.65"/><polyline points={h.d} fill="none" stroke={h.dest ? COL.d : COL.c} strokeWidth="2.2" strokeDasharray={h.dest ? '7 5' : undefined}/></g>)}
        {/* générateur et fils vers les deux vibreurs */}
        <g stroke="#0f172a" strokeWidth="2" fill="none"><polyline points={`${gx0 + 54},${CUVE.Y0} ${CUVE.X0 - 10},${CUVE.Y0}`}/><polyline points={`${CUVE.X0 - 10},${y1} ${CUVE.X0 - 10},${y2}`}/><line x1={CUVE.X0 - 10} y1={y1} x2={x1 - 5} y2={y1}/><line x1={CUVE.X0 - 10} y1={y2} x2={x2 - 5} y2={y2}/></g>
        <rect x={gx0} y={gy0} width="54" height="48" rx="6" fill="#1e293b" stroke="#fff" strokeWidth="1.5"/>
        <text x={gx0 + 27} y={gy0 + 21} fontSize="18" fontWeight="700" fill="#fff" textAnchor="middle">GBF</text><text x={gx0 + 27} y={gy0 + 40} fontSize="17" fill="#fff" textAnchor="middle">{f} Hz</text>
        {pt && rayons && <g stroke="#7c2d12" strokeWidth="2" strokeDasharray="4 3"><line x1={x1} y1={y1} x2={mx} y2={my} stroke="#fff" strokeWidth="5" strokeDasharray="none" opacity="0.6"/><line x1={x2} y1={y2} x2={mx} y2={my} stroke="#fff" strokeWidth="5" strokeDasharray="none" opacity="0.6"/><line x1={x1} y1={y1} x2={mx} y2={my}/><line x1={x2} y1={y2} x2={mx} y2={my}/></g>}
        <g fill="#0f172a" stroke="#fff" strokeWidth="2"><circle cx={x1} cy={y1} r="7"/><circle cx={x2} cy={y2} r="7"/></g>
        <g fontSize="18" fontWeight="700" fill={COL.txt} {...halo}><text x={x1 + 12} y={y1 - 9}>S₁</text><text x={x2 + 12} y={y2 + 24}>S₂</text></g>
        {pt && rayons && <g fontSize="18" fontWeight="700" fill="#7c2d12" {...halo} textAnchor="middle"><text x={e1x} y={e1y}>r₁</text><text x={e2x} y={e2y}>r₂</text></g>}
        {pt && <g style={{ cursor: setPt ? 'grab' : 'default', touchAction: 'none' }} onPointerDown={e => { if (!setPt) return; glisse.current = true; e.currentTarget.ownerSVGElement.setPointerCapture?.(e.pointerId); }}>
          <circle cx={mx} cy={my} r="22" fill="transparent"/><circle cx={mx} cy={my} r="9" fill="#fef08a" stroke="#0f172a" strokeWidth="2.5"/>
          <text x={mx + 13} y={my - 11} fontSize="18" fontWeight="700" fill={COL.txt} {...halo}>M</text></g>}
        {legende && <g><rect x="318" y="238" width="76" height="34" rx="5" fill="#fff" opacity="0.85"/><line x1="326" y1="262" x2="376" y2="262" stroke="#0f172a" strokeWidth="2.2"/><line x1="326" y1="257" x2="326" y2="267" stroke="#0f172a" strokeWidth="2.2"/><line x1="376" y1="257" x2="376" y2="267" stroke="#0f172a" strokeWidth="2.2"/><text x="351" y="253" fontSize="17" fontWeight="700" fill="#0f172a" textAnchor="middle">5 cm</text></g>}
        <text x="8" y="272" fontSize="17" fontWeight="700" fill={COL.txt} {...halo}>cuve à ondes, vue de dessus</text>
      </svg>
    </div>);
}

// ====================================================
//  GRAPHE DES SIGNAUX : s1, s2 (déphasé de Δφ) et leur somme, sur deux périodes
// ====================================================
export function GrapheSignaux({ dphi, aria }) {
  const x0 = 46, x1 = 372, yc = 100, A = 34, N = 160;
  const chemin = fn => Array.from({ length: N + 1 }, (_, i) => { const u = i / N, y = fn(u); return `${i ? 'L' : 'M'}${(x0 + (x1 - x0) * u).toFixed(1)},${(yc - A * y).toFixed(1)}`; }).join(' ');
  const c1 = chemin(u => Math.cos(2 * Math.PI * 2 * u)), c2 = chemin(u => Math.cos(2 * Math.PI * 2 * u - dphi)), cs = chemin(u => Math.cos(2 * Math.PI * 2 * u) + Math.cos(2 * Math.PI * 2 * u - dphi));
  const amp = M.ampSomme(1, 1, dphi);
  return (
    <svg viewBox="0 0 400 244" style={stl} role="img" aria-label={aria || `Signaux s1 et s2 en un point, déphasés de ${virg(dphi)} radian, et leur somme, d’amplitude ${virg(amp)} A`}>
      <rect x="0" y="0" width="400" height="244" fill="#fff"/>
      {[2, 1, -1, -2].map(v => <g key={v}><line x1={x0} y1={yc - A * v} x2={x1} y2={yc - A * v} stroke="#e2e8f0" strokeWidth="1"/><text x={x0 - 6} y={yc - A * v + 5} fontSize="17" fill={COL.gris} textAnchor="end">{v > 0 ? '' : '−'}{Math.abs(v) === 1 ? 'A' : '2A'}</text></g>)}
      <line x1={x0} y1={yc} x2={x1 + 4} y2={yc} stroke="#475569" strokeWidth="1.5"/><line x1={x0} y1={yc - 80} x2={x0} y2={yc + 80} stroke="#475569" strokeWidth="1.5"/>
      <text x={x0 - 6} y={yc + 5} fontSize="17" fill={COL.gris} textAnchor="end">0</text>
      {[[0.5, 'T'], [1, '2T']].map(([u, l]) => <g key={l}><line x1={x0 + (x1 - x0) * u} y1={yc - 4} x2={x0 + (x1 - x0) * u} y2={yc + 4} stroke="#475569" strokeWidth="1.5"/><text x={x0 + (x1 - x0) * u} y={yc + 21} fontSize="17" fill={COL.gris} textAnchor="middle">{l}</text></g>)}
      <text x={x1 + 10} y={yc + 5} fontSize="17" fontWeight="700" fill={COL.gris}>t</text>
      <path d={c1} fill="none" stroke={COL.s1} strokeWidth="2.2"/><path d={c2} fill="none" stroke={COL.s2} strokeWidth="2.2" strokeDasharray="7 5"/><path d={cs} fill="none" stroke={COL.somme} strokeWidth="3.8"/>
      <g fontSize="17" fontWeight="700" fill={COL.txt}>
        <line x1="14" y1="196" x2="42" y2="196" stroke={COL.s1} strokeWidth="2.2"/><text x="48" y="201">s₁</text>
        <line x1="108" y1="196" x2="136" y2="196" stroke={COL.s2} strokeWidth="2.2" strokeDasharray="7 5"/><text x="142" y="201">s₂</text>
        <line x1="202" y1="196" x2="230" y2="196" stroke={COL.somme} strokeWidth="3.8"/><text x="236" y="201">s₁ + s₂</text>
        <text x="14" y="230">amplitude de la somme : {virg(amp)} A</text></g>
    </svg>);
}

// ====================================================
//  SCHÉMAS DE SITUATION (parcours et défis)
// ====================================================
// Deux haut-parleurs et un auditeur (étape « conséquences concrètes ») : distances d1 et d2, écartement a
export function FigHautParleurs() {
  const hp = (y, nom, ny) => <g><rect x="64" y={y - 14} width="20" height="28" fill="#334155"/><polygon points={`84,${y - 14} 106,${y - 28} 106,${y + 28} 84,${y + 14}`} fill="#475569"/><text x="64" y={ny} fontSize="17" fontWeight="700" fill={COL.txt}>{nom}</text></g>;
  const Px = 300, Py = 100;
  return (
    <svg viewBox="0 0 400 250" style={stl} role="img" aria-label="Deux haut-parleurs HP1 et HP2, distants de a, alimentés par le même générateur, et un auditeur au point P situé à d1 de HP1 et d2 de HP2 (schéma pas à l’échelle)">
      <rect x="0" y="0" width="400" height="250" fill="#fff"/>
      <rect x="4" y="100" width="40" height="40" rx="5" fill="#1e293b"/><text x="24" y="125" fontSize="17" fontWeight="700" fill="#fff" textAnchor="middle">GBF</text>
      <g stroke="#0f172a" strokeWidth="2" fill="none"><polyline points="44,120 54,120 54,70 64,70"/><polyline points="54,120 54,170 64,170"/></g>
      {hp(70, 'HP₁', 36)}{hp(170, 'HP₂', 212)}
      <g stroke="#7c2d12" strokeWidth="2" strokeDasharray="5 4"><line x1="106" y1="70" x2={Px} y2={Py}/><line x1="106" y1="170" x2={Px} y2={Py}/></g>
      <g fontSize="17" fontWeight="700" fill="#7c2d12" {...halo}><text x="210" y="73">d₁</text><text x="210" y="152">d₂</text></g>
      <Cote x1={124} y1={72} x2={124} y2={168} c="#334155"/><text x="132" y="125" fontSize="17" fontWeight="700" fill={COL.txt} {...halo}>a = 2,0 m</text>
      <circle cx={Px} cy={Py} r="9" fill="#fef08a" stroke="#0f172a" strokeWidth="2.5"/><text x={Px + 14} y={Py - 10} fontSize="17" fontWeight="700" fill={COL.txt}>P</text><text x={Px} y={Py + 34} fontSize="17" fill={COL.txt} textAnchor="middle">auditeur</text>
      <text x="6" y="240" fontSize="17" fill={COL.gris}>schéma pas à l’échelle</text>
    </svg>);
}
// Défis : les deux vibreurs seuls (« lignes ») ou avec un point M et ses deux distances (« point »)
export function FigSources({ mode, s }) {
  const Sx = 70, Sy1 = 80, Sy2 = 180, Mx = 320, My = 60;
  return (
    <svg viewBox="0 0 400 260" style={stl} role="img" aria-label={mode === 'lignes' ? 'Deux vibreurs S1 et S2 reliés au même générateur et distants de s (schéma pas à l’échelle)' : 'Deux vibreurs S1 et S2 distants de s et un point M situé à r1 de S1 et à r2 de S2 (schéma pas à l’échelle)'}>
      <rect x="0" y="0" width="400" height="260" fill="#fff"/>
      <rect x="4" y="110" width="40" height="40" rx="5" fill="#1e293b"/><text x="24" y="135" fontSize="17" fontWeight="700" fill="#fff" textAnchor="middle">GBF</text>
      <g stroke="#0f172a" strokeWidth="2" fill="none"><polyline points={`44,130 54,130 54,${Sy1} ${Sx - 8},${Sy1}`}/><polyline points={`54,130 54,${Sy2} ${Sx - 8},${Sy2}`}/></g>
      <g fill="#0f172a"><circle cx={Sx} cy={Sy1} r="8"/><circle cx={Sx} cy={Sy2} r="8"/></g>
      <g fontSize="17" fontWeight="700" fill={COL.txt}><text x={Sx + 14} y={Sy1 - 8}>S₁</text><text x={Sx + 14} y={Sy2 + 24}>S₂</text></g>
      {mode === 'point' && <g>
        <g stroke="#7c2d12" strokeWidth="2" strokeDasharray="5 4"><line x1={Sx} y1={Sy1} x2={Mx} y2={My}/><line x1={Sx} y1={Sy2} x2={Mx} y2={My}/></g>
        <g fontSize="17" fontWeight="700" fill="#7c2d12" {...halo}><text x="215" y="55">r₁</text><text x="215" y="170">r₂</text></g>
        <circle cx={Mx} cy={My} r="9" fill="#fef08a" stroke="#0f172a" strokeWidth="2.5"/><text x={Mx + 14} y={My + 6} fontSize="17" fontWeight="700" fill={COL.txt}>M</text></g>}
      <Cote x1={Sx + 40} y1={Sy1} x2={Sx + 40} y2={Sy2} c="#334155"/><text x={Sx + 50} y={Sy1 + 63} fontSize="17" fontWeight="700" fill={COL.txt} {...halo} strokeWidth="6">s = {virg(s, 0)} cm</text>
      <text x="6" y="250" fontSize="17" fill={COL.gris}>schéma pas à l’échelle</text>
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320 de large, textes de 14 à 16)
// ====================================================
const Legende = ({ y, items }) => <g fontSize="15" fontWeight="700" fill={COL.txt}>{items.map(([x, c, dash, w, nom]) => <g key={nom}><line x1={x} y1={y - 5} x2={x + 22} y2={y - 5} stroke={c} strokeWidth={w} strokeDasharray={dash}/><text x={x + 27} y={y}>{nom}</text></g>)}</g>;
// Fraction dessinée (numérateur, barre, dénominateur) : y est l'ordonnée de la ligne de base du texte voisin ; la barre est placée à la hauteur de la ligne de fraction
const FracSvg = ({ x, y, n, d, size = 16 }) => {
  const w = Math.max(String(n).length, String(d).length) * size * 0.5 + 6;
  return <g textAnchor="middle" fontSize={size} fontWeight="700"><text x={x} y={y - 8}>{n}</text><line x1={x - w / 2} y1={y - 5} x2={x + w / 2} y2={y - 5} stroke={COL.txt} strokeWidth="1.6"/><text x={x} y={y + size - 5}>{d}</text></g>;
};

// 1. Interférences constructives et destructives
export function CarteInterf() {
  const col = (x0, opp) => <g>
    <path d={sinus(x0, 136, 112, 17, 2, 0)} fill="none" stroke={COL.s1} strokeWidth="2.2"/>
    <path d={sinus(x0, 136, 112, 17, 2, opp ? Math.PI : 0)} fill="none" stroke={COL.s2} strokeWidth="2.2" strokeDasharray="6 4"/>
    {opp ? <line x1={x0} y1="210" x2={x0 + 136} y2="210" stroke={COL.somme} strokeWidth="4"/> : <path d={sinus(x0, 136, 210, 34, 2, 0)} fill="none" stroke={COL.somme} strokeWidth="4"/>}
  </g>;
  return (
    <svg viewBox="0 0 320 320" style={stlCarte} role="img" aria-label="Deux ondes en phase donnent une somme d’amplitude double (interférence constructive) ; deux ondes en opposition de phase donnent une somme nulle (interférence destructive). Schéma qualitatif, pas à l’échelle.">
      <rect x="0" y="0" width="320" height="320" fill="#fff"/>
      <g fontSize="16" fontWeight="700" fill={COL.txt} textAnchor="middle"><text x="80" y="22">constructive</text><text x="240" y="22">destructive</text></g>
      <g fontSize="15" fill={COL.txt} textAnchor="middle"><text x="80" y="42">en phase</text><text x="240" y="42">en opposition</text><text x="240" y="59">de phase</text></g>
      <line x1="160" y1="30" x2="160" y2="266" stroke="#cbd5e1" strokeWidth="1.5"/>
      {col(12, false)}{col(172, true)}
      <g fontSize="15" fill={COL.gris} textAnchor="middle"><text x="80" y="158">s₁ = s₂</text><text x="240" y="158">s₂ = −s₁</text></g>
      <g fontSize="16" fontWeight="700" fill={COL.somme} textAnchor="middle"><text x="80" y="270">somme : 2A</text><text x="240" y="270">somme : 0</text></g>
      <Legende y={294} items={[[8, COL.s1, undefined, 2.2, 's₁'], [70, COL.s2, '6 4', 2.2, 's₂'], [132, COL.somme, undefined, 4, 'somme']]}/>
      <text x="312" y="314" fontSize="15" fill={COL.gris} textAnchor="end">schéma qualitatif, pas à l’échelle</text>
    </svg>);
}
// 2. Chemins parcourus, différence de chemin δ
export function CarteChemins() {
  const S1 = [36, 50], S2 = [36, 160], Mp = [200, 30], r1 = Math.hypot(Mp[0] - S1[0], Mp[1] - S1[1]), r2 = Math.hypot(Mp[0] - S2[0], Mp[1] - S2[1]);
  const t = r1 / r2, P = [Mp[0] + (S2[0] - Mp[0]) * t, Mp[1] + (S2[1] - Mp[1]) * t], ux = (Mp[0] - S2[0]) / r2, uy = (Mp[1] - S2[1]) / r2, mil = [(S2[0] + P[0]) / 2, (S2[1] + P[1]) / 2];
  return (
    <svg viewBox="0 0 320 256" style={stlCarte} role="img" aria-label="Deux sources S1 et S2 et un point M : les distances r1 et r2 ; la différence de chemin delta est la longueur dont le trajet de S2 à M dépasse celui de S1 à M (trait épais sur S2M, qui commence au repère où r1 est reportée). Schéma pas à l’échelle.">
      <rect x="0" y="0" width="320" height="256" fill="#fff"/>
      <line x1={S1[0]} y1={S1[1]} x2={Mp[0]} y2={Mp[1]} stroke={COL.s1} strokeWidth="2.4"/>
      <line x1={S2[0]} y1={S2[1]} x2={P[0]} y2={P[1]} stroke={COL.s2} strokeWidth="6"/><line x1={P[0]} y1={P[1]} x2={Mp[0]} y2={Mp[1]} stroke={COL.s2} strokeWidth="2.4" strokeDasharray="7 4"/>
      <line x1={P[0] + uy * 8} y1={P[1] - ux * 8} x2={P[0] - uy * 8} y2={P[1] + ux * 8} stroke={COL.txt} strokeWidth="2.2"/>
      <circle cx={S1[0]} cy={S1[1]} r="7" fill="#0f172a"/><circle cx={S2[0]} cy={S2[1]} r="7" fill="#0f172a"/><circle cx={Mp[0]} cy={Mp[1]} r="8" fill="#fef08a" stroke="#0f172a" strokeWidth="2.5"/>
      <g fontSize="16" fontWeight="700" fill={COL.txt} {...halo}><text x="26" y="56" textAnchor="end">S₁</text><text x="26" y="172" textAnchor="end">S₂</text><text x={Mp[0] + 13} y={Mp[1] + 6}>M</text></g>
      <g fontSize="16" fontWeight="700" fill={COL.s1} {...halo}><text x="70" y="30">r₁ = S₁M</text></g>
      <g fontSize="16" fontWeight="700" fill={COL.s2} {...halo}><text x="136" y="118">r₂ = S₂M</text></g>
      <line x1="68" y1="163" x2={mil[0] + 1} y2={mil[1] + 3} stroke="#475569" strokeWidth="1.4"/>
      <g fontSize="17" fontWeight="700" fill={COL.txt} {...halo}><text x="66" y="182">δ</text></g>
      <text x="160" y="208" fontSize="16" fontWeight="700" fill={COL.txt} textAnchor="middle">δ = r₂ − r₁ : trait épais</text>
      <text x="160" y="230" fontSize="15" fill={COL.txt} textAnchor="middle">le petit trait marque r₁ reporté sur r₂</text>
      <text x="160" y="250" fontSize="15" fill={COL.gris} textAnchor="middle">schéma qualitatif, pas à l’échelle</text>
    </svg>);
}
// 3. Somme de deux signaux sinusoïdaux selon Δφ
export function CarteSomme() {
  const cols = [[8, 0, '2A', 'Δφ = 0'], [112, Math.PI / 2, '1,4 A', null], [216, Math.PI, '0', 'Δφ = π']];
  return (
    <svg viewBox="0 0 320 262" style={stlCarte} role="img" aria-label="Somme de deux signaux sinusoïdaux synchrones de même amplitude A : pour un déphasage nul, amplitude 2A ; pour un quart de période (pi sur 2), 1,4 A ; pour pi, amplitude nulle.">
      <rect x="0" y="0" width="320" height="262" fill="#fff"/>
      {cols.map(([x0, ph, am, nom]) => <g key={am}>
        {nom ? <text x={x0 + 48} y="28" fontSize="16" fontWeight="700" fill={COL.txt} textAnchor="middle">{nom}</text>
          : <g fill={COL.txt}><text x={x0 + 36} y="28" fontSize="16" fontWeight="700" textAnchor="end">Δφ =</text><FracSvg x={x0 + 52} y={28} n="π" d="2"/></g>}
        <path d={sinus(x0, 96, 84, 14, 1.5, 0, 48)} fill="none" stroke={COL.s1} strokeWidth="2"/><path d={sinus(x0, 96, 84, 14, 1.5, ph, 48)} fill="none" stroke={COL.s2} strokeWidth="2" strokeDasharray="5 3"/>
        {Math.abs(ph - Math.PI) < 1e-6 ? <line x1={x0} y1="156" x2={x0 + 96} y2="156" stroke={COL.somme} strokeWidth="3.6"/> : <path d={sinus(x0, 96, 156, 14 * M.ampSomme(1, 1, ph), 1.5, Math.atan2(Math.sin(ph), 1 + Math.cos(ph)), 48)} fill="none" stroke={COL.somme} strokeWidth="3.6"/>}
        <text x={x0 + 48} y="208" fontSize="16" fontWeight="700" fill={COL.somme} textAnchor="middle">{am}</text></g>)}
      <text x="160" y="232" fontSize="15" fill={COL.txt} textAnchor="middle">amplitude de la somme</text>
      <Legende y={254} items={[[44, COL.s1, undefined, 2, 's₁'], [108, COL.s2, '5 3', 2, 's₂'], [172, COL.somme, undefined, 3.6, 'somme']]}/>
    </svg>);
}
// 4. Conditions sur δ
export function CarteDelta() {
  const X = m => 30 + 100 * m, ya = 84;
  return (
    <svg viewBox="0 0 320 232" style={stlCarte} role="img" aria-label="Axe de la différence de chemin delta : interférence constructive pour delta égal à 0, lambda, 2 lambda ; destructive pour delta égal à un demi lambda, trois demi lambda, cinq demi lambda.">
      <rect x="0" y="0" width="320" height="232" fill="#fff"/>
      <text x="160" y="24" fontSize="16" fontWeight="700" fill={COL.txt} textAnchor="middle">différence de chemin δ</text>
      <Fl x1={14} y1={ya} x2={306} y2={ya} c="#475569" w={2.2} tete={9}/>
      {[0, 1, 2].map(m => <rect key={'c' + m} x={X(m) - 9} y={ya - 30} width="18" height="18" fill={COL.c}/>)}
      {[0.5, 1.5, 2.5].map(m => <circle key={'d' + m} cx={X(m)} cy={ya - 21} r="10" fill="#fff" stroke={COL.d} strokeWidth="3" strokeDasharray="4 3"/>)}
      {[0, 0.5, 1, 1.5, 2, 2.5].map(m => <g key={m}><line x1={X(m)} y1={ya - 5} x2={X(m)} y2={ya + 5} stroke="#475569" strokeWidth="2"/></g>)}
      <g fontSize="16" fontWeight="700" fill={COL.txt} textAnchor="middle">
        <text x={X(0)} y={ya + 28}>0</text><text x={X(1)} y={ya + 28}>λ</text><text x={X(2)} y={ya + 28}>2λ</text>
        <FracSvg x={X(0.5)} y={ya + 28} n="λ" d="2"/><FracSvg x={X(1.5)} y={ya + 28} n="3λ" d="2"/><FracSvg x={X(2.5)} y={ya + 28} n="5λ" d="2"/></g>
      <rect x="22" y="142" width="16" height="16" fill={COL.c}/><text x="46" y="156" fontSize="16" fontWeight="700" fill={COL.txt}>constructive : δ = kλ</text>
      <circle cx="30" cy="180" r="9" fill="#fff" stroke={COL.d} strokeWidth="3" strokeDasharray="4 3"/><text x="46" y="186" fontSize="16" fontWeight="700" fill={COL.txt}>destructive : δ = (k + ½)λ</text>
      <text x="160" y="220" fontSize="15" fill={COL.gris} textAnchor="middle">k entier ; λ : longueur d’onde</text>
    </svg>);
}
// 5. Lignes d’interférence (hyperboles de foyers S1 et S2)
export function CarteLignes() {
  const s = 90, lam = 40, ox = 50, yc = 98, tr = (x, y) => [ox + x, yc - y];
  const lignes = useMemo(() => {
    const L = [];
    for (let n = 0; n <= 5; n++) { const d = n * lam / 2; if (d >= s) break; const pts = []; for (let x = 0; x <= 146; x += 4) { const y = M.yPourDelta(s, d, x); if (y != null && y <= 90) pts.push(tr(x, y)); } for (const sg of d === 0 ? [1] : [1, -1]) L.push({ n, d, dest: n % 2 === 1, p: pts.map(([a, b]) => `${a.toFixed(1)},${(sg === 1 ? b : 2 * yc - b).toFixed(1)}`).join(' ') }); }
    return L;
  }, []);
  const yE = d => yc - M.yPourDelta(s, d, 146);
  return (
    <svg viewBox="0 0 320 284" style={stlCarte} role="img" aria-label="Lignes d’interférence autour de deux sources S1 et S2, vues à droite des sources : traits pleins pour les lignes constructives (delta égal à 0, lambda…), tirets pour les destructives (un demi lambda…) ; delta est constant sur chaque ligne. Schéma qualitatif, pas à l’échelle.">
      <rect x="0" y="0" width="320" height="284" fill="#fff"/>
      {lignes.map((l, i) => <polyline key={i} points={l.p} fill="none" stroke={l.dest ? COL.d : COL.c} strokeWidth="2.4" strokeDasharray={l.dest ? '7 5' : undefined}/>)}
      <circle cx={ox} cy={yc - s / 2} r="7" fill="#0f172a"/><circle cx={ox} cy={yc + s / 2} r="7" fill="#0f172a"/>
      <g fontSize="16" fontWeight="700" fill={COL.txt} {...halo}><text x={ox - 12} y={yc - s / 2 + 5} textAnchor="end">S₁</text><text x={ox - 12} y={yc + s / 2 + 5} textAnchor="end">S₂</text>
        <text x={ox + 152} y={yc + 5}>δ = 0</text><text x={ox + 152} y={yE(40) + 5}>δ = λ</text><text x={ox + 152} y={yE(20) + 5}>δ =</text></g>
      <g fill={COL.txt}><FracSvg x={ox + 152 + 44} y={yE(20) + 5} n="λ" d="2"/></g>
      <Legende y={212} items={[[10, COL.c, undefined, 2.4, 'constructive']]}/>
      <g fontSize="15" fontWeight="700" fill={COL.txt}><line x1="150" y1="207" x2="172" y2="207" stroke={COL.d} strokeWidth="2.4" strokeDasharray="7 5"/><text x="177" y="212">destructive</text></g>
      <g fontSize="15" fill={COL.gris} textAnchor="middle"><text x="160" y="240">δ est constant sur chaque ligne</text><text x="160" y="258">vue à droite des sources</text><text x="160" y="274">schéma pas à l’échelle</text></g>
    </svg>);
}
// 6. Conséquences concrètes
export function CarteConsequences() {
  const hpY = [48, 108], X = 224, pts = [[78, 'fort'], [116, 'silence'], [154, 'fort']];
  return (
    <svg viewBox="0 0 320 340" style={stlCarte} role="img" aria-label="Deux haut-parleurs alimentés par le même signal : sur l’axe de symétrie, les deux sons arrivent avec la même distance parcourue et le son est fort ; en un point hors axe où les deux distances diffèrent d’un demi lambda, c’est le silence. Un casque à réduction de bruit émet un signal en opposition de phase avec le bruit, la somme est nulle. Schéma qualitatif, pas à l’échelle.">
      <rect x="0" y="0" width="320" height="340" fill="#fff"/>
      <text x="8" y="20" fontSize="16" fontWeight="700" fill={COL.txt}>Deux haut-parleurs, un même signal</text>
      {hpY.map(y => <g key={y}><rect x="46" y={y - 11} width="16" height="22" fill="#334155"/><polygon points={`62,${y - 11} 80,${y - 22} 80,${y + 22} 62,${y + 11}`} fill="#475569"/></g>)}
      <g fontSize="15" fontWeight="700" fill={COL.txt}><text x="6" y="53">HP₁</text><text x="6" y="113">HP₂</text></g>
      <line x1="84" y1="78" x2={X - 10} y2="78" stroke="#64748b" strokeWidth="1.6" strokeDasharray="2 4"/>
      <line x1={X} y1="34" x2={X} y2="172" stroke="#94a3b8" strokeWidth="2"/>
      <g stroke="#7c2d12" strokeWidth="1.8" strokeDasharray="5 4"><line x1="84" y1="48" x2={X - 9} y2="116"/><line x1="84" y1="108" x2={X - 9} y2="116"/></g>
      {pts.map(([y, l]) => <g key={y}>
        {l === 'fort' ? <circle cx={X} cy={y} r="8" fill={COL.c}/> : <g><circle cx={X} cy={y} r="8" fill="#fff" stroke={COL.d} strokeWidth="3"/><line x1={X - 6} y1={y - 6} x2={X + 6} y2={y + 6} stroke={COL.d} strokeWidth="2.5"/></g>}
        <text x={X + 16} y={y + 5} fontSize="15" fontWeight="700" fill={COL.txt}>{l === 'fort' ? 'son fort' : 'silence'}</text></g>)}
      <g fontSize="15" fill={COL.gris} textAnchor="middle"><text x="160" y="194">sur l’axe (pointillé) : δ = 0, son fort</text><text x="160" y="212">hors axe : silence si δ = ½λ ; 1,5 λ…</text></g>
      <line x1="8" y1="224" x2="312" y2="224" stroke="#cbd5e1" strokeWidth="1.5"/>
      <text x="8" y="246" fontSize="16" fontWeight="700" fill={COL.txt}>Casque à réduction de bruit</text>
      <path d={sinus(10, 150, 270, 11, 3, 0, 60)} fill="none" stroke={COL.s1} strokeWidth="2.2"/><text x="170" y="275" fontSize="15" fontWeight="700" fill={COL.txt}>bruit</text>
      <path d={sinus(10, 150, 300, 11, 3, Math.PI, 60)} fill="none" stroke={COL.s2} strokeWidth="2.2" strokeDasharray="6 4"/><text x="170" y="305" fontSize="15" fontWeight="700" fill={COL.txt}>signal en opposition</text>
      <line x1="10" y1="328" x2="160" y2="328" stroke={COL.somme} strokeWidth="4"/><text x="170" y="333" fontSize="15" fontWeight="700" fill={COL.txt}>somme ≈ 0</text>
    </svg>);
}
