// Schémas de la simulation « Éclairage, réflectance et métamérisme ». SVG, textes de 10,5 à 16, largeur 100 % plafonnée.
import { LAMBDA } from "./couleurDonnees";
import { pointLieu, cssXYNormalise } from "./couleurModele";
import { spd, OBJETS, PAIRE } from "./mtmModele";

const K = { txt: '#0f172a', gris: '#64748b', orange: '#b45309', bleu: '#1d4ed8', rouge: '#b91c1c', vert: '#15803d', violet: '#7c3aed' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 12} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? K.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" stroke={o.halo ? '#fff' : 'none'} strokeWidth={o.halo ? 3 : 0} paintOrder="stroke">{s}</text>;
const base = (w, h, label, children, max = 380) => <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
const COUL = LAMBDA.map(l => { const p = pointLieu(Math.min(700, Math.max(400, l))); return cssXYNormalise(p.x, p.y); });

/** Courbes spectrales sur 380–780 nm. courbes : [{ v, col, nom, trait }] ; ymax ; yTicks ; marque : longueur d'onde repérée par une verticale. */
export function SvgSpectre({ courbes, ymax, yTicks, fmtY = v => String(v), marque = null, remplir = false, label = 'Courbes en fonction de la longueur d’onde', yTitre = '' }) {
  const X0 = 46, Y0 = 14, W = 278, H = 160, px = l => X0 + (l - 380) / 400 * W, py = v => Y0 + H - Math.min(1.04, v / ymax) * H;
  const els = [];
  for (const t of yTicks) els.push(<line key={'g' + t} x1={X0} y1={py(t)} x2={X0 + W} y2={py(t)} stroke="#e2e8f0" strokeWidth="1"/>, T(X0 - 5, py(t) + 4, fmtY(t), { size: 10.5, fill: K.gris, anchor: 'end' }));
  for (let i = 0; i < LAMBDA.length - 1; i++) els.push(<rect key={'c' + i} x={px(LAMBDA[i]) - 0.3} y={Y0 + H + 4} width={W / 40 + 0.6} height={9} fill={COUL[i]}/>);
  for (const l of [400, 500, 600, 700]) els.push(<line key={'tk' + l} x1={px(l)} y1={Y0 + H} x2={px(l)} y2={Y0 + H + 4} stroke="#334155"/>, T(px(l), Y0 + H + 26, String(l), { size: 10.5, fill: K.gris }));
  els.push(T(X0 + W / 2, Y0 + H + 42, 'longueur d’onde (nm)', { size: 11, fill: K.gris }));
  if (yTitre) els.push(T(12, Y0 + H / 2, yTitre, { size: 11, fill: K.gris }));
  els.push(<rect key="cadre" x={X0} y={Y0} width={W} height={H} fill="none" stroke="#334155" strokeWidth="1.3"/>);
  courbes.forEach((c, k) => {
    const pts = c.v.map((v, i) => `${px(LAMBDA[i])},${py(v)}`).join(' ');
    if (remplir && k === 0) els.push(<polygon key={'f' + k} points={`${px(380)},${py(0)} ${pts} ${px(780)},${py(0)}`} fill={c.col} opacity="0.15"/>);
    els.push(<polyline key={'p' + k} points={pts} fill="none" stroke={c.col} strokeWidth="2.4" strokeDasharray={c.trait ?? ''} strokeLinejoin="round"/>);
    if (c.nom) els.push(T(X0 + 8, Y0 + 15 + 15 * k, c.nom, { size: 11.5, gras: true, fill: c.col, anchor: 'start', halo: true }));
  });
  if (marque != null) {
    const i = LAMBDA.indexOf(marque);
    els.push(<line key="mq" x1={px(marque)} y1={Y0} x2={px(marque)} y2={Y0 + H} stroke="#0f172a" strokeWidth="1.3" strokeDasharray="4 3"/>);
    courbes.forEach((c, k) => els.push(<circle key={'m' + k} cx={px(marque)} cy={py(c.v[i])} r={4.5} fill={c.col} stroke="#fff" strokeWidth="1.5"/>));
  }
  return base(340, 262, label, els);
}

// ---------- Cartes « À retenir » (viewBox 300 de large) ----------
const mini = (v, x, y, w, h, ymax, col) => <polyline points={v.map((q, i) => `${x + i / 40 * w},${y + h - Math.min(1, q / ymax) * h}`).join(' ')} fill="none" stroke={col} strokeWidth="2.2" strokeLinejoin="round"/>;
/** Source × réflectance = lumière renvoyée, puis l'œil la transforme en X, Y, Z. */
export function SvgCarteChaine() {
  const S = spd('D65'), R = OBJETS.rouge, P = S.map((v, i) => v * R[i]), bx = (x, nom, col) => <g key={nom}><rect x={x} y={34} width={78} height={68} rx={6} fill="#f8fafc" stroke="#334155" strokeWidth="1.3"/>{T(x + 39, 24, nom, { size: 12.5, gras: true, fill: col })}</g>;
  return base(300, 178, 'Une source, un objet et la lumière renvoyée', <>
    {bx(6, 'Source', K.bleu)}{bx(111, 'Objet', K.rouge)}{bx(216, 'Renvoyée', K.orange)}
    {mini(S, 10, 40, 70, 56, 140, K.bleu)}{mini(R, 115, 40, 70, 56, 1, K.rouge)}{mini(P, 220, 40, 70, 56, 140, K.orange)}
    {T(95, 74, '×', { size: 22, gras: true })}{T(200, 74, '=', { size: 22, gras: true })}
    {T(45, 118, 'S(λ)', { size: 12.5, fill: K.bleu })}{T(150, 118, 'R(λ)', { size: 12.5, fill: K.rouge })}{T(255, 118, 'S(λ) × R(λ)', { size: 12.5, fill: K.orange })}
    <path d="M255 124 L255 140" stroke="#0f172a" strokeWidth="1.8" fill="none"/><polygon points="249,138 261,138 255,148" fill="#0f172a"/>
    {T(150, 166, 'l’œil : X, Y, Z → couleur', { size: 13, gras: true })}
  </>, 340);
}
/** Deux courbes qui se croisent : même couleur sous D65, couleurs différentes sous une autre lampe. */
export function SvgCarteMeta() {
  const { r1, r2 } = PAIRE, X0 = 12, Y0 = 20, W = 276, H = 100, py = v => Y0 + H - v / 0.7 * H, cr = [];
  for (let i = 1; i < r1.length; i++) { const a = r1[i - 1] - r2[i - 1], b = r1[i] - r2[i]; if (a * b < 0) { const t = a / (a - b); cr.push([X0 + (i - 1 + t) / 40 * W, py(r1[i - 1] + t * (r1[i] - r1[i - 1]))]); } }
  return base(300, 178, 'Deux courbes de réflectance qui se croisent', <>
    <rect x={X0} y={Y0} width={W} height={H} fill="#f8fafc" stroke="#334155" strokeWidth="1.3"/>
    <polyline points={r1.map((v, i) => `${X0 + i / 40 * W},${py(v)}`).join(' ')} fill="none" stroke={K.bleu} strokeWidth="2.6"/>
    <polyline points={r2.map((v, i) => `${X0 + i / 40 * W},${py(v)}`).join(' ')} fill="none" stroke={K.orange} strokeWidth="2.6" strokeDasharray="6 3"/>
    {cr.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill="none" stroke="#0f172a" strokeWidth="2"/>)}
    {T(150, 14, 'deux pigments différents', { size: 13, gras: true })}
    {T(150, 142, 'même couleur sous D65', { size: 13, fill: K.txt })}
    {T(150, 160, 'couleurs différentes sous la lampe A', { size: 12.5, gras: true, fill: K.rouge })}
  </>, 340);
}

const LAMPES = { D65: { halo: '#dbeafe', cone: '#bfdbfe', nom: 'Lumière du jour (D65)' }, A: { halo: '#fde68a', cone: '#fcd34d', nom: 'Lampe à incandescence (A)' }, F2: { halo: '#ecfccb', cone: '#d9f99d', nom: 'Tube fluorescent (F2)' } };
/** Cabine à lumière : une lampe au plafond (au choix), deux échantillons posés sur le plan de travail. css1, css2 : couleurs affichées de E1 et E2 sous la lampe choisie. */
export function SvgCabine({ lampe, css1, css2 }) {
  const L = LAMPES[lampe];
  return base(300, 206, 'Cabine à lumière : deux échantillons E1 et E2 éclairés par la lampe choisie', <>
    <rect x={14} y={8} width={272} height={168} rx={8} fill="#475569" stroke="#1e293b" strokeWidth="2"/>
    <rect x={22} y={16} width={256} height={142} rx={4} fill="#cbd5e1"/>
    <rect x={30} y={22} width={240} height={14} rx={4} fill="#1e293b"/>
    <ellipse cx={150} cy={36} rx={50} ry={7} fill={L.halo} stroke="#0f172a" strokeWidth="1.5"/>
    <polygon points="105,38 195,38 250,128 50,128" fill={L.cone} opacity="0.55"/>
    <rect x={22} y={128} width={256} height={30} fill="#94a3b8"/>
    <rect x={62} y={104} width={66} height={44} rx={4} fill={css1} stroke="#0f172a" strokeWidth="2"/>
    <rect x={172} y={104} width={66} height={44} rx={4} fill={css2} stroke="#0f172a" strokeWidth="2"/>
    {T(95, 170, 'E1', { size: 15, gras: true, fill: '#fff' })}{T(205, 170, 'E2', { size: 15, gras: true, fill: '#fff' })}
    {T(150, 58, L.nom, { size: 13, gras: true, halo: true })}
    {T(150, 198, 'cabine à lumière (contrôle visuel)', { size: 12, fill: K.gris })}
  </>, 340);
}
