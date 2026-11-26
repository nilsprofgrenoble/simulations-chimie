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

const LAMPES = { D65: { lueur: '#e0f2fe', nom: 'Lumière du jour (D65)' }, A: { lueur: '#fde68a', nom: 'Lampe à incandescence (A)' }, F2: { lueur: '#ecfccb', nom: 'Tube fluorescent (F2)' } };
/** Cabine à lumière (contrôle visuel industriel) : parois gris neutre, lampe au plafond, trois voyants, deux échantillons et une carte blanche de référence. css1, css2, cssBlanc : couleurs affichées sous la lampe choisie. */
export function SvgCabine({ lampe, css1, css2, cssBlanc }) {
  const L = LAMPES[lampe], ids = ['D65', 'A', 'F2'], noms = ['D65', 'A', 'F2'];
  return base(320, 250, 'Cabine à lumière : échantillons E1 et E2 et carte blanche, éclairés par la lampe choisie', <>
    <defs>
      <radialGradient id="cab-lueur" cx="50%" cy="0%" r="95%"><stop offset="0" stopColor={L.lueur} stopOpacity="0.95"/><stop offset="1" stopColor={L.lueur} stopOpacity="0.18"/></radialGradient>
      <linearGradient id="cab-sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9aa3ad"/><stop offset="1" stopColor="#7b8591"/></linearGradient>
    </defs>
    <polygon points="12,14 308,14 308,198 12,198" fill="#2b323b"/>
    <polygon points="40,36 280,36 280,150 40,150" fill="#b8bfc7"/>
    <polygon points="12,14 40,36 40,150 12,198" fill="#8f98a2"/>
    <polygon points="308,14 280,36 280,150 308,198" fill="#8f98a2"/>
    <polygon points="12,14 308,14 280,36 40,36" fill="#d7dce1"/>
    <polygon points="40,150 280,150 308,198 12,198" fill="url(#cab-sol)"/>
    <polygon points="12,14 308,14 308,198 12,198" fill="url(#cab-lueur)"/>
    <rect x={92} y={20} width={136} height={10} rx={5} fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5"/>
    <rect x={98} y={22.5} width={124} height={5} rx={2.5} fill={L.lueur} stroke={L.lueur}/>
    <ellipse cx={110} cy={176} rx={72} ry={7} fill="#000" opacity="0.18"/><ellipse cx={240} cy={176} rx={40} ry={7} fill="#000" opacity="0.18"/>
    {[[50, 60, css1, 'E1'], [110, 60, css2, 'E2'], [200, 80, cssBlanc, 'Blanc']].map(([x, w, c, nom]) => <g key={nom}>
      <rect x={x} y={104} width={w} height={68} fill={c}/>
      {T(x + w / 2, 94, nom, { size: 14, gras: true, halo: true })}
    </g>)}
    <rect x={50} y={104} width={120} height={68} rx={2} fill="none" stroke="#0f172a" strokeWidth="2"/><rect x={200} y={104} width={80} height={68} rx={2} fill="none" stroke="#0f172a" strokeWidth="2"/>
    <rect x={12} y={198} width={296} height={34} rx={6} fill="#1e293b"/>
    {ids.map((id, k) => <g key={id}><circle cx={60 + k * 100} cy={215} r={7} fill={id === lampe ? LAMPES[id].lueur : '#475569'} stroke="#f8fafc" strokeWidth="1.5"/>{T(60 + k * 100, 244, noms[k], { size: 12, gras: id === lampe, fill: id === lampe ? '#0f172a' : K.gris })}</g>)}
  </>, 360);
}
