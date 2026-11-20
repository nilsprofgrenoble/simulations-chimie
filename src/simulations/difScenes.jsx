// Scènes de la simulation 181 (diffraction d'une onde) : onde devant une ouverture (cuve à ondes ou son), schéma du montage laser,
// image de diffraction sur l'écran avec règle, profil d'intensité et repères à pointer.
// Toutes les valeurs de position passées aux SVG sont des NOMBRES (jamais des chaînes) ; texte ≥ 18 (viewBox de 400) ou ≥ 20 (viewBox de 480) pour rester ≥ 11 px rendus sur téléphone.
import { useEffect, useMemo, useRef, useDeferredValue } from 'react';
import * as O from './ondesModele';
import * as M from './difModele';

const ENCRE = '#0f172a', GRIS = '#475569', ROUGE = '#b91c1c';
const halo = { stroke: '#ffffff', strokeWidth: 4, paintOrder: 'stroke', strokeLinejoin: 'round' };
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

// ---------- onde devant une ouverture (vue de dessus) ----------
const GEO = {
  eau: { W: 480, H: 300, MUR: 110, PX: 20, unite: 'cm' },     // 20 pixels par cm
  son: { W: 480, H: 300, MUR: 110, PX: 30, unite: 'm' },      // 30 pixels par mètre
};
const NX = 185, NY = 150;                                      // grille de calcul du champ (2 pixels par cellule)

export function SceneOndes({ milieu = 'eau', a, lam, vue = 'ondes', anim = false, angle = false, aria }) {
  const G = GEO[milieu], ref = useRef(null), t = useRef(0);
  const aD = useDeferredValue(a), lD = useDeferredValue(lam);
  // Le champ complexe n'est recalculé que si a, λ ou le milieu changent ; l'animation ne fait ensuite qu'une rotation de phase.
  const champ = useMemo(() => {
    const dx = (G.W - G.MUR) / G.PX / NX, dy = G.H / G.PX / NY;
    const xs = Array.from({ length: NX }, (_, i) => (i + 0.5) * dx), ys = Array.from({ length: NY }, (_, j) => (j + 0.5) * dy - G.H / G.PX / 2);
    return O.champCuve({ a: aD, lambda: lD, xs, ys, N: Math.max(16, Math.min(80, Math.round(aD / lD * 8))) });
  }, [aD, lD, G]);
  useEffect(() => {
    const cv = ref.current; if (!cv) return undefined;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(G.W, G.H), d = img.data;
    const k = 2 * Math.PI / lD, w = 2 * Math.PI * 0.6;
    let raf, dernier = performance.now();
    const dessine = () => {
      const ph = w * t.current, c = Math.cos(ph), s = Math.sin(ph);
      for (let y = 0; y < G.H; y++) {
        const jy = Math.min(NY - 1, Math.floor(y / G.H * NY));
        for (let x = 0; x < G.W; x++) {
          const o = (y * G.W + x) * 4;
          let v;
          if (x < G.MUR) {
            if (vue === 'amplitude') { d[o] = 224; d[o + 1] = 232; d[o + 2] = 240; d[o + 3] = 255; continue; }
            v = Math.cos(k * (x - G.MUR) / G.PX - ph);
          } else {
            const jx = Math.min(NX - 1, Math.floor((x - G.MUR) / (G.W - G.MUR) * NX)), i = jy * NX + jx;
            if (vue === 'amplitude') {
              const I = champ.re[i] ** 2 + champ.im[i] ** 2, g = Math.min(1, Math.sqrt(I) / 1.15);
              d[o] = 235 - 190 * g; d[o + 1] = 242 - 130 * g; d[o + 2] = 250 - 30 * g; d[o + 3] = 255; continue;
            }
            v = champ.re[i] * c + champ.im[i] * s;
          }
          const q = Math.max(-1, Math.min(1, v / 1.15)) * 0.5 + 0.5;
          d[o] = 40 + 195 * q; d[o + 1] = 100 + 140 * q; d[o + 2] = 160 + 90 * q; d[o + 3] = 255;
        }
      }
      const yh = aD * G.PX / 2, y0 = Math.round(G.H / 2 - yh), y1 = Math.round(G.H / 2 + yh);
      for (let y = 0; y < G.H; y++) if (y < y0 || y > y1) for (let x = G.MUR - 5; x < G.MUR + 5; x++) { const o = (y * G.W + x) * 4; d[o] = 71; d[o + 1] = 85; d[o + 2] = 105; d[o + 3] = 255; }
      ctx.putImageData(img, 0, 0);
    };
    const boucle = now => { t.current += Math.min(0.05, (now - dernier) / 1000); dernier = now; dessine(); raf = requestAnimationFrame(boucle); };
    if (anim && vue === 'ondes') raf = requestAnimationFrame(boucle); else dessine();
    return () => raf && cancelAnimationFrame(raf);
  }, [champ, lD, vue, anim, aD, G]);
  const cx = G.MUR, cy = G.H / 2, th = M.thetaExact(lam, a), demi = a * G.PX / 2, Lpx = lam * G.PX;
  let lignes = null;
  if (angle && th != null) {
    const len = Math.min((G.W - 6 - cx) / Math.cos(th), (cy - 6) / Math.sin(th)), R = Math.min(84, len * 0.7);
    const ex = cx + len * Math.cos(th), ey = len * Math.sin(th);
    const pt = (r, ang, s) => [cx + r * Math.cos(ang), cy + s * r * Math.sin(ang)];
    const [hx, hy] = pt(R, th, -1), [bx, by] = pt(R, th, 1), [lx, ly] = pt(R + 17, th + 0.13, -1), [mx, my] = pt(R + 17, th + 0.13, 1);
    lignes = (
      <g stroke={ROUGE} strokeWidth="2.4" fill="none">
        <line x1={cx} y1={cy} x2={ex} y2={cy - ey} strokeDasharray="7 5"/><line x1={cx} y1={cy} x2={ex} y2={cy + ey} strokeDasharray="7 5"/>
        <path d={`M${cx + R},${cy} A${R},${R} 0 0 0 ${hx},${hy}`}/><path d={`M${cx + R},${cy} A${R},${R} 0 0 1 ${bx},${by}`}/>
        <text x={lx - 5} y={ly + 6} fontSize="22" fontWeight="700" fill={ROUGE} stroke="none" {...halo}>θ</text>
        <text x={mx - 5} y={my + 6} fontSize="22" fontWeight="700" fill={ROUGE} stroke="none" {...halo}>θ</text>
      </g>);
  }
  return (
    <div style={{ position: 'relative', lineHeight: 0, maxWidth: 480, margin: '0 auto' }}>
      <canvas ref={ref} width={G.W} height={G.H} style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', background: '#e0e8f0' }} role="img" aria-label={aria}/>
      <svg viewBox={`0 0 ${G.W} ${G.H}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <text x={cx - 10} y={26} fontSize="20" fontWeight="700" textAnchor="end" fill={ENCRE} {...halo}>mur</text>
        <text x={8} y={66} fontSize="20" fontWeight="700" fill={ENCRE} {...halo}>onde plane</text>
        <g stroke={ENCRE} strokeWidth="2.4" fill={ENCRE}><line x1="10" y1="82" x2="78" y2="82"/><polygon points="92,82 78,75 78,89" stroke="none"/></g>
        {lignes}
        {angle && <g><line x1={cx} y1={cy} x2={G.W - 6} y2={cy} stroke={GRIS} strokeWidth="1.8" strokeDasharray="2 5"/><text x={G.W - 8} y={cy - 8} fontSize="20" fontWeight="700" textAnchor="end" fill={ENCRE} {...halo}>axe</text></g>}
        <g stroke={ENCRE} strokeWidth="2.2" fill="none"><line x1={cx - 18} y1={cy - demi} x2={cx - 18} y2={cy + demi}/><line x1={cx - 25} y1={cy - demi} x2={cx - 11} y2={cy - demi}/><line x1={cx - 25} y1={cy + demi} x2={cx - 11} y2={cy + demi}/></g>
        <text x={cx - 30} y={cy + 7} fontSize="22" fontWeight="700" textAnchor="end" fill={ENCRE} {...halo}>a</text>
        <g stroke={ENCRE} strokeWidth="2.2"><line x1="14" y1={G.H - 18} x2={14 + Lpx} y2={G.H - 18}/><line x1="14" y1={G.H - 25} x2="14" y2={G.H - 11}/><line x1={14 + Lpx} y1={G.H - 25} x2={14 + Lpx} y2={G.H - 11}/></g>
        <text x={14 + Lpx / 2} y={G.H - 30} fontSize="22" fontWeight="700" textAnchor="middle" fill={ENCRE} {...halo}>λ</text>
      </svg>
    </div>);
}

// ---------- schéma du montage : laser, fente, écran (qualitatif, pas à l'échelle) ----------
export function MontageLaser({ lam = 532 }) {
  const col = `rgb(${O.rgbLambda(lam).map(c => Math.round(c * 215)).join(',')})`;
  const sx = 170, ex = 330, cy = 80, hy = 46;
  const phi = Math.atan2(hy, ex - sx), R = 92, ax = sx + R * Math.cos(phi), ay = cy - R * Math.sin(phi);
  return (
    <svg viewBox="0 0 400 200" style={{ width: '100%', maxWidth: 480, display: 'block', margin: '0 auto', background: '#f8fafc', borderRadius: 8 }} role="img"
      aria-label="Schéma du montage, pas à l’échelle : un laser éclaire une fente de largeur a ; sur l’écran, à la distance D de la fente, on observe la figure de diffraction ; l’angle θ est l’angle entre l’axe et la direction de la première extinction">
      <rect x="8" y="64" width="72" height="32" rx="5" fill="#1e293b"/><text x="44" y="86" fontSize="18" fontWeight="700" fill="#ffffff" textAnchor="middle">laser</text>
      <line x1="80" y1={cy} x2={sx} y2={cy} stroke={col} strokeWidth="4"/>
      <rect x={sx - 5} y="22" width="10" height="46" fill={GRIS}/><rect x={sx - 5} y="92" width="10" height="46" fill={GRIS}/>
      <text x={sx} y="16" fontSize="18" fontWeight="700" textAnchor="middle" fill={ENCRE}>fente</text>
      <polygon points={`${sx},${cy} ${ex},${cy - hy} ${ex},${cy + hy}`} fill={col} opacity="0.3"/>
      <line x1={sx} y1={cy} x2={ex} y2={cy} stroke={GRIS} strokeWidth="1.8" strokeDasharray="2 5"/>
      <g stroke={ROUGE} strokeWidth="2.4" fill="none" strokeDasharray="7 5"><line x1={sx} y1={cy} x2={ex} y2={cy - hy}/><line x1={sx} y1={cy} x2={ex} y2={cy + hy}/></g>
      <path d={`M${sx + R},${cy} A${R},${R} 0 0 0 ${ax},${ay}`} stroke={ROUGE} strokeWidth="2.4" fill="none"/>
      <text x={sx + R + 9} y={cy - 8} fontSize="21" fontWeight="700" fill={ROUGE}>θ</text>
      <g stroke={ENCRE} strokeWidth="2.2"><line x1={sx - 20} y1="68" x2={sx - 20} y2="92"/><line x1={sx - 27} y1="68" x2={sx - 13} y2="68"/><line x1={sx - 27} y1="92" x2={sx - 13} y2="92"/></g>
      <text x={sx - 32} y="86" fontSize="21" fontWeight="700" textAnchor="end" fill={ENCRE}>a</text>
      <rect x={ex} y="14" width="8" height="132" fill="#334155"/><text x={ex + 4} y="170" fontSize="18" fontWeight="700" textAnchor="middle" fill={ENCRE}>écran</text>
      <g stroke={ENCRE} strokeWidth="2.2"><line x1={sx} y1="122" x2={ex} y2="122"/><line x1={sx} y1="115" x2={sx} y2="129"/><line x1={ex} y1="115" x2={ex} y2="129"/></g>
      <text x={(sx + ex) / 2} y="150" fontSize="21" fontWeight="700" textAnchor="middle" fill={ENCRE}>D</text>
      <text x="8" y="192" fontSize="18" fill={GRIS}>schéma pas à l’échelle</text>
    </svg>);
}

// ---------- image de diffraction sur l'écran, règle, profil d'intensité, repères ----------
const IW = M.LARGEUR_IMAGE_PX, IH = 110;
const pasRegle = W => (W >= 80 ? [5, 20] : W >= 40 ? [2, 10] : W >= 20 ? [1, 5] : [0.5, 2]);

export function EcranLumiere({ a, lam, D, W, expo = 2, gris = false, x1, x2, setX, mesure = false, profil = false, gain = 8 }) {
  const ref = useRef(null), glisse = useRef(null);
  const mmpx = M.mmParPixel(W);
  const rgb = useMemo(() => (gris ? [0.82, 0.82, 0.82] : O.rgbLambda(lam)), [lam, gris]);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(IW, IH), d = img.data, A = a * 1e-6, la = lam * 1e-9, prof = new Float32Array(IW);
    for (let x = 0; x < IW; x++) prof[x] = M.intensite(A, la, D, (x - IW / 2 + 0.5) * mmpx * 1e-3);
    for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
      const v = 1 - Math.exp(-expo * 4 * prof[x]), o = (y * IW + x) * 4;
      d[o] = 255 * rgb[0] * v; d[o + 1] = 255 * rgb[1] * v; d[o + 2] = 255 * rgb[2] * v; d[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [a, lam, D, expo, mmpx, rgb]);
  const px = mm => IW / 2 + mm / mmpx;
  const versMm = e => { const r = ref.current.getBoundingClientRect(); return Math.max(-W, Math.min(W, ((e.clientX - r.left) / r.width * IW - IW / 2) * mmpx)); };
  const [pas, etiq] = pasRegle(W), ticks = [];
  for (let k = -Math.round(W / pas); k <= Math.round(W / pas); k++) ticks.push(Math.round(k * pas * 100) / 100);
  const courbe = useMemo(() => {
    const A = a * 1e-6, la = lam * 1e-9; let dd = '';
    for (let x = 0; x <= IW; x += 2) dd += `${x ? 'L' : 'M'}${x},${(86 - 78 * Math.min(1, gain * M.intensite(A, la, D, (x - IW / 2) * mmpx * 1e-3))).toFixed(1)} `;
    return dd;
  }, [a, lam, D, mmpx, gain]);
  const marque = (xm, i, col, tirets) => (
    <g key={i} style={{ cursor: 'ew-resize' }} onPointerDown={e => { glisse.current = i; e.currentTarget.ownerSVGElement.setPointerCapture?.(e.pointerId); }}>
      <line x1={px(xm)} y1="0" x2={px(xm)} y2={IH} stroke="#fff" strokeWidth="6"/><line x1={px(xm)} y1="0" x2={px(xm)} y2={IH} stroke={col} strokeWidth="3" strokeDasharray={tirets}/>
      <rect x={px(xm) - 22} y="0" width="44" height={IH} fill="transparent"/>
      <path d={`M${px(xm) - 9},0 L${px(xm) + 9},0 L${px(xm)},13 z`} fill={col} stroke="#fff" strokeWidth="1.5"/>
      <text x={px(xm) + 12} y="30" fontSize="22" fontWeight="700" fill="#fff" stroke="#000" strokeWidth="4" paintOrder="stroke">{i}</text>
    </g>);
  const survol = { onPointerMove: e => { if (glisse.current != null) setX(glisse.current, versMm(e)); }, onPointerUp: () => { glisse.current = null; }, onPointerLeave: () => { glisse.current = null; } };
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ position: 'relative', lineHeight: 0 }}>
        <canvas ref={ref} width={IW} height={IH} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px 8px 0 0', background: '#000' }} role="img"
          aria-label={`Figure de diffraction d’un laser ${gris ? 'monochrome' : O.nomCouleur(lam)} par une fente, observée sur un écran`}/>
        {mesure && <svg aria-hidden="true" viewBox={`0 0 ${IW} ${IH}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }} {...survol}>
          {marque(x1, 1, '#f59e0b', undefined)}{marque(x2, 2, '#22d3ee', '9 5')}</svg>}
      </div>
      <svg viewBox={`0 0 ${IW} 50`} style={{ width: '100%', display: 'block', background: '#f1f5f9' }} role="img" aria-label="Règle graduée en millimètres, le zéro est au centre de l’image">
        {ticks.map(m => { const gros = Math.abs(m / etiq - Math.round(m / etiq)) < 1e-6; return (
          <g key={m}><line x1={px(m)} y1="0" x2={px(m)} y2={gros ? 13 : 7} stroke="#475569" strokeWidth={m === 0 ? 2.5 : 1.2}/>
            {gros && px(m) > 16 && px(m) < IW - 40 && <text x={px(m)} y="36" fontSize="21" textAnchor="middle" fill="#1e293b">{fr(m, 0).replace('-', '−')}</text>}</g>); })}
        <text x={IW - 4} y="46" fontSize="21" textAnchor="end" fill="#1e293b" fontWeight="700">mm</text>
      </svg>
      {profil && (
        <svg viewBox={`0 0 ${IW} 100`} style={{ width: '100%', display: 'block', background: '#fff', borderRadius: '0 0 8px 8px', borderTop: '1px solid #e2e8f0' }} role="img" aria-label="Profil d’intensité lumineuse le long de l’écran, agrandi : on voit les creux d’intensité entre les taches">
          <path d={courbe} fill="none" stroke={`rgb(${rgb.map(c => Math.round(c * 150)).join(',')})`} strokeWidth="2.4"/>
          <line x1="0" y1="86" x2={IW} y2="86" stroke="#94a3b8" strokeWidth="1"/>
          <text x="6" y="22" fontSize="21" fill="#334155" fontWeight="700">intensité (agrandie)</text>
          {mesure && [[x1, '#b45309', undefined], [x2, '#0e7490', '9 5']].map(([xm, c, t], i) => <line key={i} x1={px(xm)} y1="28" x2={px(xm)} y2="86" stroke={c} strokeWidth="2.2" strokeDasharray={t}/>)}
        </svg>)}
    </div>);
}
