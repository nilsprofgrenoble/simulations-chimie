// Schémas de la simulation 234 « Mouillage : tension superficielle, angle de contact, tension critique ». SVG dans un viewBox de ~320 de large, textes de 12 à 15, largeur 100 % plafonnée.
import * as M from "./mouillageModele";

const C = { eau: '#dbeafe', eauTr: '#60a5fa', trait: '#475569', txt: '#0f172a', gris: '#64748b', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', violet: '#7c3aed', bleu: '#1d4ed8', solide: '#cbd5e1', encre: '#fde68a' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 13} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit">{s}</text>;
function base(w, h, label, children, max = 400) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const rad = d => d * Math.PI / 180;
// Flèche fine à pointe de taille fixe (trait 2,2, bouts arrondis)
function Fleche({ x1, y1, x2, y2, c = C.trait, w = 2.2 }) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 8, o = 0.45;
  const p = s => [x2 - L * Math.cos(a + s * o), y2 - L * Math.sin(a + s * o)];
  const [ax, ay] = p(1), [bx, by] = p(-1);
  return <g stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none"><line x1={x1} y1={y1} x2={x2} y2={y2}/><polyline points={`${ax},${ay} ${x2},${y2} ${bx},${by}`}/></g>;
}
const Sub = ({ x, y, base: b, ind, size = 13, fill = C.txt, anchor = 'middle', gras = true }) => (
  <text x={x} y={y} fontSize={size} fontWeight={gras ? 700 : 400} fill={fill} textAnchor={anchor} fontFamily="inherit">{b}<tspan fontSize={size * 0.75} dy={size * 0.28}>{ind}</tspan></text>);

// ---------- pourquoi une goutte est ronde : molécule du volume et molécule de surface ----------
export function SvgSurfaceMol() {
  const vol = [120, 150], surf = [220, 84], R = 26;
  const dirs = k => Array.from({ length: k }, (_, i) => rad(i * 360 / k + 20));
  return base(320, 230, 'liquide en coupe : une molécule du volume est attirée de tous côtés, une molécule de surface n’est attirée que vers le bas et sur les côtés, d’où une force résultante vers l’intérieur du liquide', <>
    <rect x="10" y="84" width="300" height="136" fill={C.eau} stroke="none"/>
    <line x1="10" y1="84" x2="310" y2="84" stroke={C.bleu} strokeWidth="2"/>
    {T(40, 30, 'air', { size: 13, fill: C.gris })}{T(268, 214, 'liquide', { size: 13, gras: true, fill: C.bleu })}
    {[[50, 120], [60, 168], [265, 160], [285, 120], [160, 112], [105, 105], [190, 150], [275, 200]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#93c5fd" stroke={C.bleu} strokeWidth="1"/>)}
    {dirs(6).map((a, i) => <Fleche key={`v${i}`} x1={vol[0]} y1={vol[1]} x2={vol[0] + R * Math.cos(a)} y2={vol[1] + R * Math.sin(a)} c={C.trait} w={1.8}/>)}
    <circle cx={vol[0]} cy={vol[1]} r="7" fill="#60a5fa" stroke={C.bleu} strokeWidth="1.5"/>
    {[0, 40, 90, 140, 180].map((d, i) => <Fleche key={`s${i}`} x1={surf[0]} y1={surf[1]} x2={surf[0] + R * Math.cos(rad(d))} y2={surf[1] + R * Math.sin(rad(d))} c={C.trait} w={1.8}/>)}
    <circle cx={surf[0]} cy={surf[1]} r="7" fill="#60a5fa" stroke={C.bleu} strokeWidth="1.5"/>
    <Fleche x1={surf[0] + 38} y1={surf[1] - 22} x2={surf[0] + 38} y2={surf[1] + 14} c={C.orange} w={3}/>
    {T(vol[0], 206, 'volume : forces équilibrées', { size: 12, fill: C.txt })}
    {T(215, 54, 'surface : résultante vers l’intérieur', { size: 12, gras: true, fill: C.orange })}
  </>, 400);
}

// ---------- lame de Wilhelmy ----------
export function SvgWilhelmy({ gamma = null }) {
  return base(320, 250, 'lame de Wilhelmy : une lame de platine suspendue à une balance est partiellement plongée dans un liquide ; la force verticale mesurée est proportionnelle à la tension superficielle et au périmètre mouillé', <>
    <rect x="30" y="150" width="260" height="84" fill={C.eau} stroke="none"/>
    <line x1="30" y1="150" x2="290" y2="150" stroke={C.bleu} strokeWidth="2"/>
    <path d="M141 150 q0 -10 5 -14 M179 150 q0 -10 -5 -14" fill="none" stroke={C.bleu} strokeWidth="2"/>
    <rect x="146" y="64" width="28" height="104" rx="2" fill="#e2e8f0" stroke={C.trait} strokeWidth="2"/>
    <line x1="160" y1="20" x2="160" y2="64" stroke={C.trait} strokeWidth="2"/>
    <rect x="130" y="6" width="60" height="16" rx="4" fill="#f1f5f9" stroke={C.trait} strokeWidth="1.8"/>
    {T(160, 18, 'balance', { size: 12, gras: true })}
    <Fleche x1={216} y1={96} x2={216} y2={48} c={C.orange} w={3}/>
    {T(246, 74, 'F', { size: 15, gras: true, fill: C.orange })}
    {T(246, 90, gamma == null ? '(vers le haut)' : `${fr(M.forceMN(gamma), 2)} mN`, { size: 12, fill: C.orange })}
    {T(100, 120, 'lame de platine', { size: 12 })}<line x1="130" y1="116" x2="146" y2="112" stroke={C.gris} strokeWidth="1.2"/>
    {T(160, 206, 'liquide', { size: 13, gras: true, fill: C.bleu })}
    <line x1="146" y1="182" x2="174" y2="182" stroke={C.trait} strokeWidth="1.5"/>{T(160, 197, 'e', { size: 12 })}
  </>, 400);
}

// ---------- goutte posée sur un solide ----------
// th en degrés ; forces : dessine γSV, γSL, γLV au point de contact droit ; film : couleur du liquide
export function SvgGoutte({ th, forces = false, liquideCouleur = C.eau, titre = null, solideNom = 'solide', liquideNom = 'liquide', max = 400 }) {
  const ys = 150, cx = 160, A0 = 3600;
  let a, h, R = null;
  if (th < 10) { a = 130; h = 2 + th; }
  else { const t = rad(th); R = Math.sqrt(A0 / (t - Math.sin(t) * Math.cos(t))); a = R * Math.sin(t); h = R * (1 - Math.cos(t)); if (a > 130) { const k = 130 / a; a = 130; h *= k; R = null; } }
  const t = rad(th), P = [cx + a, ys];
  const goutte = R ? `M${cx - a},${ys} A${R},${R} 0 ${th > 90 ? 1 : 0} 1 ${cx + a},${ys} Z` : `M${cx - a},${ys} Q${cx},${ys - 2 * h} ${cx + a},${ys} Z`;
  const r = 24, bis = rad(th / 2);
  const T1 = [P[0] - 62 * Math.cos(t), P[1] - 62 * Math.sin(t)];
  return base(320, 200, `goutte de liquide posée sur un solide, avec l’angle de contact θ = ${Math.round(th)} degrés${forces ? ' et les trois tensions γSV, γSL, γLV au point de contact' : ''}`, <>
    <rect x="10" y={ys} width="300" height="32" fill={C.solide} stroke={C.trait} strokeWidth="1.5"/>
    {T(18, ys + 22, solideNom, { size: 13, gras: true, anchor: 'start' })}
    <path d={goutte} fill={liquideCouleur} stroke={C.bleu} strokeWidth="2"/>
    {T(cx - (th >= 60 ? 30 : 0), Math.max(34, ys - h - 8), liquideNom, { size: 13, gras: true, fill: C.bleu })}
    {T(290, 24, 'air', { size: 13, fill: C.gris })}
    {th >= 1 && <>
      {!forces && <><line x1={P[0]} y1={P[1]} x2={Math.min(305, P[0] + 40)} y2={P[1]} stroke={C.gris} strokeWidth="1.2" strokeDasharray="3 3"/>
      <line x1={P[0]} y1={P[1]} x2={T1[0]} y2={T1[1]} stroke={C.orange} strokeWidth="2.2" strokeLinecap="round"/></>}
      <path d={`M${P[0] - r},${P[1]} A${r},${r} 0 0 1 ${P[0] - r * Math.cos(t)},${P[1] - r * Math.sin(t)}`} fill="none" stroke={C.orange} strokeWidth="2.2"/>
      {T(P[0] - (r + 14) * Math.cos(bis) - 4, P[1] - (r + 14) * Math.sin(bis) + 4, 'θ', { size: 16, gras: true, fill: C.orange })}</>}
    {forces && th >= 1 && <>
      <Fleche x1={P[0]} y1={P[1] - 4} x2={P[0] + 56} y2={P[1] - 4} c={C.vert} w={2.6}/>
      <Fleche x1={P[0]} y1={P[1] - 4} x2={P[0] - 52} y2={P[1] - 4} c={C.rouge} w={2.6}/>
      <Fleche x1={P[0]} y1={P[1] - 4} x2={T1[0]} y2={T1[1] - 4} c={C.violet} w={2.6}/>
      <Sub x={P[0] + 36} y={P[1] + 22} base="γ" ind="SV" fill={C.vert} size={14}/>
      <Sub x={P[0] - 34} y={P[1] + 22} base="γ" ind="SL" fill={C.rouge} size={14}/>
      <Sub x={T1[0] - 8} y={T1[1] - 10} base="γ" ind="LV" fill={C.violet} size={14}/></>}
    {titre && T(160, 16, titre, { size: 13, gras: true })}
  </>, max);
}

// ---------- tracé de Zisman ----------
// pts : [{g, theta, cos}] ; droite : {a, b} ou null ; gc : valeur à marquer ou null ; lisible : points seuls ou avec droite
export function SvgZisman({ pts, droite = null, gc = null, marqueGc = true, nomSolide = null }) {
  const X0 = 52, X1 = 304, Y0 = 186, Y1 = 22, gMin = 15, gMax = 75, cMin = -0.4, cMax = 1.05;
  const X = g => X0 + (g - gMin) / (gMax - gMin) * (X1 - X0), Y = c => Y0 - (c - cMin) / (cMax - cMin) * (Y0 - Y1);
  return base(320, 244, `tracé de Zisman${nomSolide ? ' du ' + nomSolide : ''} : cosinus de l’angle de contact en fonction de la tension superficielle du liquide${droite && gc ? ', droite prolongée jusqu’à cos θ = 1 en γc = ' + fr(gc, 1) + ' mN/m' : ''}`, <>
    <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={C.trait} strokeWidth="1.8"/><line x1={X0} y1={Y1} x2={X0} y2={Y0} stroke={C.trait} strokeWidth="1.8"/>
    <line x1={X0} y1={Y(1)} x2={X1} y2={Y(1)} stroke={C.gris} strokeWidth="1.2" strokeDasharray="4 4"/>
    {[20, 30, 40, 50, 60, 70].map(g => <g key={g}><line x1={X(g)} y1={Y0} x2={X(g)} y2={Y0 + 5} stroke={C.trait} strokeWidth="1.5"/>{T(X(g), Y0 + 19, String(g), { size: 12 })}</g>)}
    {[0, 0.5, 1].map(c => <g key={c}><line x1={X0 - 5} y1={Y(c)} x2={X0} y2={Y(c)} stroke={C.trait} strokeWidth="1.5"/>{T(X0 - 9, Y(c) + 4, fr(c, c === 1 ? 0 : c === 0 ? 0 : 1), { size: 12, anchor: 'end' })}</g>)}
    {T(178, 238, 'tension superficielle du liquide γ (mN/m)', { size: 12.5, gras: true })}
    <text transform="rotate(-90)" x={-104} y={14} fontSize="12.5" fontWeight="700" textAnchor="middle" fill={C.txt} fontFamily="inherit">cos θ</text>
    {droite && <line x1={X(Math.max(gMin, gc ?? gMin))} y1={Y(Math.min(cMax, droite.a * Math.max(gMin, gc ?? gMin) + droite.b))} x2={X(gMax)} y2={Y(droite.a * gMax + droite.b)} stroke={C.violet} strokeWidth="2.2" strokeLinecap="round"/>}
    {droite && gc != null && marqueGc && <g>
      <line x1={X(gc)} y1={Y(1)} x2={X(gc)} y2={Y0} stroke={C.orange} strokeWidth="2" strokeDasharray="3 3"/>
      <circle cx={X(gc)} cy={Y(1)} r="5" fill={C.orange}/>
      <Sub x={Math.min(X(gc) + 8, 240)} y={Y0 - 8} base="γ" ind={`c = ${fr(gc, 1)}`} fill={C.orange} size={14} anchor="start"/></g>}
    {pts.map((p, i) => <circle key={i} cx={X(p.g)} cy={Y(p.cos)} r="5.5" fill={p.theta > 0 ? C.bleu : 'white'} stroke={C.bleu} strokeWidth="2"/>)}
  </>, 400);
}

// ---------- cartes « À retenir » (viewBox 300 de large, maxWidth 320) ----------
export function SvgCarteSituations() {
  const un = (x, th, nom, couleur) => {
    const ys = 74, t = rad(Math.max(th, 4)), A0 = 700;
    let a, h, R = null;
    if (th < 10) { a = 40; h = 2 + th * 0.4; } else { R = Math.sqrt(A0 / (t - Math.sin(t) * Math.cos(t))); a = R * Math.sin(t); h = R * (1 - Math.cos(t)); }
    const d = R ? `M${x - a},${ys} A${R},${R} 0 ${th > 90 ? 1 : 0} 1 ${x + a},${ys} Z` : `M${x - a},${ys} Q${x},${ys - 2 * h} ${x + a},${ys} Z`;
    return <g key={nom}><rect x={x - 46} y={ys} width="92" height="14" fill={C.solide} stroke={C.trait} strokeWidth="1.2"/><path d={d} fill={C.eau} stroke={C.bleu} strokeWidth="1.8"/>
      {T(x, 34, th === 0 ? 'θ = 0' : th < 90 ? '0 < θ < 90°' : 'θ > 90°', { size: 13, gras: true, fill: couleur })}{T(x, 112, nom, { size: 12.5, gras: true, fill: couleur })}</g>;
  };
  return base(300, 126, 'trois situations : mouillage total (angle nul, le liquide s’étale), mouillage partiel avec angle inférieur à 90 degrés (le liquide mouille), angle supérieur à 90 degrés (le liquide mouille mal et reste en goutte)', <>
    {un(52, 0, 'total', C.vert)}{un(150, 55, 'partiel', C.bleu)}{un(248, 115, 'mouille mal', C.rouge)}
  </>, 320);
}
export function SvgCarteZisman() {
  return base(300, 150, 'tracé de Zisman schématique : une droite descendante de cos θ en fonction de γ du liquide, prolongée vers la gauche jusqu’à cos θ = 1, ce qui donne la tension critique γc', <>
    <line x1="40" y1="124" x2="284" y2="124" stroke={C.trait} strokeWidth="1.8"/><line x1="40" y1="20" x2="40" y2="124" stroke={C.trait} strokeWidth="1.8"/>
    <line x1="40" y1="34" x2="284" y2="34" stroke={C.gris} strokeWidth="1.2" strokeDasharray="4 4"/>{T(34, 38, '1', { size: 12, anchor: 'end' })}
    <line x1="92" y1="34" x2="270" y2="104" stroke={C.violet} strokeWidth="2.4" strokeLinecap="round"/>
    {[[150, 57], [200, 77], [262, 101]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" fill={C.bleu}/>)}
    <line x1="92" y1="34" x2="92" y2="124" stroke={C.orange} strokeWidth="2" strokeDasharray="3 3"/><circle cx="92" cy="34" r="5" fill={C.orange}/>
    <Sub x={92} y={140} base="γ" ind="c" fill={C.orange} size={15}/>
    {T(190, 140, 'γ du liquide', { size: 12.5, gras: true })}
    <text transform="rotate(-90)" x={-72} y={14} fontSize="12.5" fontWeight="700" textAnchor="middle" fill={C.txt} fontFamily="inherit">cos θ</text>
    {T(192, 20, 'on extrapole jusqu’à cos θ = 1', { size: 12, fill: C.violet, gras: true })}
  </>, 320);
}
export function SvgCarteTensions() { return <SvgGoutte th={70} forces max={320}/>; }
export function SvgCarteBilanMouillage() {
  const ligne = (y, c, a, b) => <g key={a}><circle cx="24" cy={y} r="9" fill={c}/>{T(24, y + 4, '✓', { size: 12, gras: true, fill: 'white' })}{T(44, y + 5, a, { size: 13.5, gras: true, anchor: 'start' })}{T(44, y + 22, b, { size: 12.5, fill: C.gris, anchor: 'start' })}</g>;
  return base(300, 150, 'trois idées à retenir : l’angle de contact classe le mouillage, la tension critique donne le critère, et on améliore le mouillage en abaissant la tension du liquide ou en traitant le solide', <>
    {ligne(22, C.bleu, 'θ < 90° : le liquide mouille', 'θ = 0 : il s’étale complètement')}
    {ligne(70, C.violet, 'γ du liquide < γc du solide', 'le liquide s’étale (Zisman)')}
    {ligne(118, C.vert, 'Pour mieux mouiller', 'abaisser γ, ou traiter le solide')}
  </>, 320);
}
