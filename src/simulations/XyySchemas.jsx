// Schémas de la simulation « Le diagramme de chromaticité xy ». SVG, textes de 10,5 à 16, largeur 100 % plafonnée.
import { LIEU, pointLieu, cssXYNormalise, PRIMAIRES_SRGB, BLANC_XY } from "./couleurModele";

const K = { txt: '#0f172a', gris: '#64748b', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', vert: '#15803d', bleu: '#1d4ed8' };
const X0 = 40, Y0 = 18, S = 390, XMAX = 0.75, YMAX = 0.85;
const px = x => X0 + x * S, py = y => Y0 + (YMAX - y) * S;
const fr = (v, d = 2) => v.toFixed(d).replace('.', ',');

// Fond coloré du diagramme : une image de 150 × 170 points calculée une seule fois (couleur affichable à chaque point), puis découpée par le lieu spectral.
let fondCache = null;
function fond() {
  if (fondCache !== null) return fondCache;
  if (typeof document === 'undefined') return (fondCache = '');
  const w = 150, h = 170, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); if (!ctx) return (fondCache = '');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { ctx.fillStyle = cssXYNormalise((i + 0.5) / w * XMAX, YMAX - (j + 0.5) / h * YMAX); ctx.fillRect(i, j, 1, 1); }
  return (fondCache = cv.toDataURL());
}
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 12} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? K.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" stroke={o.halo ? '#fff' : 'none'} strokeWidth={o.halo ? 3.5 : 0} paintOrder="stroke" strokeLinejoin="round">{s}</text>;
const polyLieu = LIEU.map(p => `${px(p.x)},${py(p.y)}`).join(' ');

/** Diagramme de chromaticité xy (CIE 1931).
 *  pts : [{ x, y, nom, col, creux, dx, dy, anchor }] ; lignes : [{ a, b, col, dash, w }] ; notes : [{ x, y, txt, col, anchor, size }] (coordonnées du diagramme)
 *  triangle : dessine le triangle des primaires de l'écran ; pourpres : met en valeur la droite des pourpres ; carte : version simplifiée pour les cartes « À retenir ». */
export function SvgChroma({ pts = [], lignes = [], notes = [], triangle = false, pourpres = false, carte = false, blanc = true, ticks = true, label = 'Diagramme de chromaticité xy', onPoint, onTouche }) {
  // Diagramme interactif : toucher ou glisser place un point ; les flèches du clavier le déplacent
  const placer = ev => { const r = ev.currentTarget.getBoundingClientRect(); onPoint(((ev.clientX - r.left) / r.width * 340 - X0) / S, YMAX - ((ev.clientY - r.top) / r.height * 382 - Y0) / S); };
  const interactif = onPoint ? {
    tabIndex: 0, onPointerDown: ev => { ev.currentTarget.setPointerCapture?.(ev.pointerId); placer(ev); }, onPointerMove: ev => { if (ev.buttons === 1) placer(ev); },
    onKeyDown: ev => { const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key]; if (d && onTouche) { ev.preventDefault(); onTouche(d[0] * 0.01, d[1] * 0.01); } },
    style: { display: 'block', maxWidth: 360, margin: '0 auto', touchAction: 'none', cursor: 'crosshair' } } : null;
  const els = [], f = fond(), fs = carte ? 13.5 : 11.5;
  els.push(<rect key="cadre0" x={X0} y={Y0} width={XMAX * S} height={YMAX * S} fill="#f8fafc"/>);
  for (const v of [0.2, 0.4, 0.6]) els.push(<line key={'gx' + v} x1={px(v)} y1={Y0} x2={px(v)} y2={py(0)} stroke="#e2e8f0" strokeWidth="1"/>);
  for (const v of [0.2, 0.4, 0.6, 0.8]) els.push(<line key={'gy' + v} x1={X0} y1={py(v)} x2={px(XMAX)} y2={py(v)} stroke="#e2e8f0" strokeWidth="1"/>);
  els.push(<defs key="d"><clipPath id="xy-clip"><polygon points={polyLieu}/></clipPath></defs>);
  if (f) els.push(<image key="img" href={f} x={px(0)} y={py(YMAX)} width={XMAX * S} height={YMAX * S} preserveAspectRatio="none" clipPath="url(#xy-clip)" style={{ imageRendering: 'auto' }}/>);
  else els.push(<polygon key="fb" points={polyLieu} fill="#e2e8f0"/>);
  els.push(<rect key="cadre" x={X0} y={Y0} width={XMAX * S} height={YMAX * S} fill="none" stroke="#334155" strokeWidth="1.5"/>);
  els.push(<polyline key="lieu" points={LIEU.map(p => `${px(p.x)},${py(p.y)}`).join(' ')} fill="none" stroke="#1e293b" strokeWidth="1.8"/>);
  const a = LIEU[0], z = LIEU[LIEU.length - 1];
  els.push(<line key="purp" x1={px(a.x)} y1={py(a.y)} x2={px(z.x)} y2={py(z.y)} stroke={pourpres ? '#a21caf' : '#1e293b'} strokeWidth={pourpres ? 4 : 1.8} strokeDasharray={pourpres ? '' : '6 4'}/>);
  if (!carte) {
    for (const v of [0.2, 0.4, 0.6]) els.push(T(px(v), py(0) + 14, fr(v, 1), { size: 10.5, fill: K.gris }));
    for (const v of [0.2, 0.4, 0.6, 0.8]) els.push(T(X0 - 5, py(v) + 4, fr(v, 1), { size: 10.5, fill: K.gris, anchor: 'end' }));
    els.push(T(px(XMAX / 2), py(0) + 30, 'x', { size: 12, gras: true, fill: K.gris }), T(10, py(YMAX / 2), 'y', { size: 12, gras: true, fill: K.gris }));
  }
  if (ticks && !carte) {
    for (let lam = 460; lam <= 620; lam += 10) {
      const p = pointLieu(lam), q1 = pointLieu(lam - 5), q2 = pointLieu(lam + 5);
      let nx = -(q2.y - q1.y), ny = q2.x - q1.x; const n = Math.hypot(nx, ny); nx /= n; ny /= n;
      if (nx * (p.x - BLANC_XY.x) + ny * (p.y - BLANC_XY.y) < 0) { nx = -nx; ny = -ny; }
      const X = px(p.x), Y = py(p.y), ox = nx, oy = -ny;       // l'axe y de l'écran est inversé
      els.push(<line key={'t' + lam} x1={X} y1={Y} x2={X + ox * (lam % 20 === 0 ? 8 : 5)} y2={Y + oy * (lam % 20 === 0 ? 8 : 5)} stroke="#1e293b" strokeWidth="1.3"/>);
      if (lam % 20 === 0) els.push(T(X + ox * 20, Y + oy * 20 + 4, String(lam), { size: 10.5, fill: '#334155' }));
    }
    els.push(T(px(XMAX) - 4, Y0 + 14, 'λ en nm', { size: 11, fill: K.gris, anchor: 'end' }));
  }
  if (triangle) {
    const { R, G, B } = PRIMAIRES_SRGB;
    els.push(<polygon key="tri" points={[R, G, B].map(p => `${px(p.x)},${py(p.y)}`).join(' ')} fill="rgba(255,255,255,0.10)" stroke="#0f172a" strokeWidth="2" strokeDasharray="7 4"/>);
    for (const [p, n] of [[R, 'R'], [G, 'V'], [B, 'B']]) els.push(<circle key={'pr' + n} cx={px(p.x)} cy={py(p.y)} r={5} fill="#0f172a" stroke="#fff" strokeWidth="1.5"/>, T(px(p.x) + (n === 'R' ? 11 : n === 'V' ? 11 : -11), py(p.y) + (n === 'B' ? 16 : 0), n, { size: fs, gras: true, anchor: n === 'B' ? 'end' : 'start', halo: true }));
  }
  for (const l of lignes) els.push(<line key={`l${l.a.x}-${l.b.x}-${l.a.y}`} x1={px(l.a.x)} y1={py(l.a.y)} x2={px(l.b.x)} y2={py(l.b.y)} stroke={l.col ?? '#0f172a'} strokeWidth={l.w ?? 2} strokeDasharray={l.dash ?? ''} strokeLinecap="round"/>);
  if (blanc) els.push(<circle key="blanc" cx={px(BLANC_XY.x)} cy={py(BLANC_XY.y)} r={5.5} fill="#fff" stroke="#0f172a" strokeWidth="2"/>, T(px(BLANC_XY.x) - 9, py(BLANC_XY.y) + 17, 'W', { size: fs, gras: true, anchor: 'end', halo: true }));
  for (const p of pts) {
    const c = p.col ?? '#0f172a', X = px(p.x), Y = py(p.y);
    els.push(<circle key={'p' + p.nom + p.x} cx={X} cy={Y} r={6.5} fill={p.creux ? 'none' : c} stroke={p.creux ? c : '#fff'} strokeWidth={p.creux ? 3 : 2}/>);
    if (p.nom) els.push(T(X + (p.dx ?? 11), Y + (p.dy ?? -9), p.nom, { size: fs, gras: true, fill: c, anchor: p.anchor ?? 'start', halo: true }));
  }
  for (const n of notes) els.push(T(px(n.x), py(n.y), n.txt, { size: n.size ?? fs, fill: n.col ?? K.txt, anchor: n.anchor ?? 'middle', gras: true, halo: true }));
  return <svg role={onPoint ? 'application' : 'img'} aria-label={label} viewBox="0 0 340 382" width="100%" style={{ display: 'block', maxWidth: carte ? 320 : 360, margin: '0 auto' }} {...interactif}>{els}</svg>;
}

// ---------- Cartes « À retenir » ----------
/** Lire un point : droite issue du blanc W vers P, prolongée jusqu'à la courbe en D ; pureté = WP / WD. */
export function SvgCarteLire() {
  const D = pointLieu(500), W = BLANC_XY, P = { x: W.x + 0.55 * (D.x - W.x), y: W.y + 0.55 * (D.y - W.y) };
  return <SvgChroma carte label="Lire un point du diagramme : droite du blanc au point, prolongée jusqu'à la courbe"
    lignes={[{ a: W, b: D, col: '#0f172a', w: 2.5 }]}
    pts={[{ ...P, nom: 'P', col: '#0f172a', dx: 10, dy: 20 }, { ...D, nom: 'D', col: K.orange, dx: -10, dy: -8, anchor: 'end' }]}
    notes={[{ x: 0.74, y: 0.80, txt: 'D : λ dominante', col: K.orange, anchor: 'end' }, { x: 0.74, y: 0.745, txt: 'pureté = WP / WD', col: '#0f172a', anchor: 'end' }]}/>;
}
/** Deux lumières complémentaires de part et d'autre du blanc, et un pourpre dont la complémentaire se lit de l'autre côté. */
export function SvgCarteCompl() {
  const W = BLANC_XY, A = pointLieu(480), B = pointLieu(578), L = pointLieu(510), Pq = { x: W.x + 0.45 * (W.x - L.x), y: W.y + 0.45 * (W.y - L.y) };
  return <SvgChroma carte pourpres label="Lumières complémentaires de part et d'autre du blanc ; pourpre repéré par sa complémentaire"
    lignes={[{ a: A, b: B, col: '#0f172a', w: 2.2 }, { a: L, b: Pq, col: '#0f172a', w: 2.2, dash: '6 4' }]}
    pts={[{ ...A, nom: 'λ₁', col: K.bleu, dx: -10, dy: 4, anchor: 'end' }, { ...B, nom: 'λ₂', col: K.orange, dx: 10, dy: -6 }, { ...Pq, nom: 'pourpre', col: '#a21caf', dx: 11, dy: 20 }, { ...L, nom: 'λc', col: K.vert, dx: 10, dy: -8 }]}
    notes={[{ x: 0.74, y: 0.80, txt: 'sur une même droite', col: '#0f172a', anchor: 'end' }, { x: 0.74, y: 0.745, txt: 'passant par W', col: '#0f172a', anchor: 'end' }]}/>;
}
/** Synthèse : triangle de l'écran et mélange de deux lumières sur un segment. */
export function SvgCarteBilan() {
  const { R, G, B } = PRIMAIRES_SRGB, M = { x: (R.x + G.x) / 2, y: (R.y + G.y) / 2 };
  return <SvgChroma carte triangle blanc={false} label="Le triangle des primaires d'un écran et le mélange de deux lumières sur un segment"
    lignes={[{ a: R, b: G, col: K.orange, w: 3 }]}
    pts={[{ ...M, nom: 'mélange', col: K.orange, creux: true, dx: 12, dy: -2 }]}
    notes={[{ x: 0.74, y: 0.80, txt: 'un écran ne reproduit que', col: '#0f172a', anchor: 'end' }, { x: 0.74, y: 0.745, txt: 'l’intérieur du triangle', col: '#0f172a', anchor: 'end' }]}/>;
}
