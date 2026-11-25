// Schémas de la simulation 223 « HLB requis et mélange d'émulsifiants ». SVG, textes de 12 à 16, largeur 100 % plafonnée.
// Les déplacements (balance, gouttes) sont animés par transitions CSS, neutralisées si l'élève demande moins d'animations.
import * as M from "./hlbModele";

const C = { huile: '#fde68a', huileTr: '#ca8a04', eau: '#bfdbfe', eauTr: '#1d4ed8', trait: '#475569', txt: '#0f172a', gris: '#64748b', orange: '#b45309', vert: '#15803d', violet: '#7c3aed', rouge: '#b91c1c' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 14} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit">{s}</text>;
function base(w, h, label, children, max = 460) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const mvt = { transition: 'transform .45s ease-out' };
const AX = { x0: 22, x1: 298 };            // axe HLB de 0 à 20
const px = h => AX.x0 + (h / 20) * (AX.x1 - AX.x0);

// ---------- échelle HLB ----------
function Tete({ x, y, grosse }) {   // molécule amphiphile : tête (disque) + queue (trait)
  return <g transform={`translate(${x} ${y})`}><circle r={grosse ? 11 : 6} fill={C.eau} stroke={C.eauTr} strokeWidth="2"/><path d={`M0 ${grosse ? 11 : 6} q4 8 -2 14 q-5 7 2 ${grosse ? 8 : 14}`} fill="none" stroke={C.huileTr} strokeWidth={grosse ? 2 : 4} strokeLinecap="round"/></g>;
}
export function SvgEchelle({ marques = [], rhlb = null, hlbMel = null, titre = true }) {
  return base(320, 240, `échelle du HLB de 0 à 20 : à gauche les émulsifiants lipophiles (émulsions E/H), à droite les hydrophiles (émulsions H/E)${marques.length ? ` ; repères : ${marques.map(m => `${m.nom} ${fr(m.hlb)}`).join(', ')}` : ''}`, <>
    <defs><linearGradient id="hlb-deg" x1="0" x2="1"><stop offset="0" stopColor={C.huile}/><stop offset="1" stopColor={C.eau}/></linearGradient></defs>
    {titre && T(160, 18, 'Échelle HLB (balance hydrophile-lipophile)', { size: 13.5, gras: true })}
    <Tete x={px(0) + 8} y="36" grosse={false}/><Tete x={px(20) - 8} y="36" grosse/>
    {T(px(0) + 22, 44, 'lipophile', { size: 12.5, anchor: 'start', fill: C.orange, gras: true })}{T(px(20) - 24, 44, 'hydrophile', { size: 12.5, anchor: 'end', fill: C.eauTr, gras: true })}
    <rect x={AX.x0} y="120" width={AX.x1 - AX.x0} height="26" rx="6" fill="url(#hlb-deg)" stroke={C.trait} strokeWidth="2"/>
    {[0, 5, 10, 15, 20].map(h => <g key={h}><line x1={px(h)} y1="146" x2={px(h)} y2="153" stroke={C.trait}/>{T(px(h), 168, String(h), { size: 12.5 })}</g>)}
    <rect x={px(3)} y="178" width={px(6) - px(3)} height="22" rx="4" fill="#fef3c7" stroke={C.huileTr}/>{T((px(3) + px(6)) / 2, 194, 'E/H', { size: 12.5, gras: true, fill: C.orange })}
    <rect x={px(8)} y="178" width={px(18) - px(8)} height="22" rx="4" fill="#dbeafe" stroke={C.eauTr}/>{T((px(8) + px(18)) / 2, 194, 'H/E', { size: 12.5, gras: true, fill: C.eauTr })}
    {T(160, 218, 'domaines d’emploi usuels', { size: 12.5, fill: C.gris })}
    {marques.map((m, k) => <g key={m.nom}><polygon points={`${px(m.hlb)},120 ${px(m.hlb) - 6},108 ${px(m.hlb) + 6},108`} fill={C.violet}/>
      {k % 2 === 1 && <line x1={px(m.hlb)} y1="108" x2={px(m.hlb)} y2="88" stroke={C.violet} strokeWidth="1.5"/>}
      {T(px(m.hlb), k % 2 === 1 ? 82 : 102, `${m.nom} ${fr(m.hlb)}`, { size: 12.5, gras: true, fill: C.violet })}</g>)}
    {rhlb != null && <g style={{ ...mvt, transform: `translate(${px(rhlb)}px,0)` }}><line x1="0" y1="116" x2="0" y2="150" stroke={C.rouge} strokeWidth="3"/><polygon points="0,150 -7,160 7,160" fill={C.rouge}/>{T(0, 236, `RHLB ${fr(rhlb)}`, { size: 12.5, gras: true, fill: C.rouge })}</g>}
    {hlbMel != null && <g style={{ ...mvt, transform: `translate(${px(hlbMel)}px,0)` }}><circle cx="0" cy="133" r="6" fill="white" stroke={C.vert} strokeWidth="3"/></g>}
  </>, 400);
}

// ---------- balance du mélange : le HLB du mélange est le point d'équilibre (barycentre) ----------
export function SvgBalance({ A, B, xA, cible = null }) {
  const hmel = M.hlbMelange(A.hlb, B.hlb, xA);
  const rA = 6 + 18 * Math.sqrt(xA), rB = 6 + 18 * Math.sqrt(1 - xA), yb = 130;
  return base(320, 262, `balance de Griffin : ${A.court} (HLB ${fr(A.hlb)}, ${Math.round(xA * 100)} % de la masse) et ${B.court} (HLB ${fr(B.hlb)}, ${Math.round((1 - xA) * 100)} %) ; le point d’équilibre est le HLB du mélange : ${fr(hmel)}${cible != null ? ` ; cible RHLB ${fr(cible)}` : ''}`, <>
    {T(160, 18, 'Le HLB du mélange est le point d’équilibre', { size: 13.5, gras: true })}
    {T(px(B.hlb), 42, B.court, { size: 12.5, gras: true, fill: C.orange })}{T(px(B.hlb), 56, `HLB ${fr(B.hlb)}`, { size: 12, fill: C.gris })}
    {T(px(A.hlb), 42, A.court, { size: 12.5, gras: true, fill: C.eauTr })}{T(px(A.hlb), 56, `HLB ${fr(A.hlb)}`, { size: 12, fill: C.gris })}
    <circle cx={px(B.hlb)} cy={yb - rB} r={rB} fill={C.huile} stroke={C.huileTr} strokeWidth="2.5" style={{ transition: 'r .45s, cy .45s' }}/>{T(px(B.hlb), yb - rB + 5, `${Math.round((1 - xA) * 100)} %`, { size: 12.5, gras: true })}
    <circle cx={px(A.hlb)} cy={yb - rA} r={rA} fill={C.eau} stroke={C.eauTr} strokeWidth="2.5" style={{ transition: 'r .45s, cy .45s' }}/>{T(px(A.hlb), yb - rA + 5, `${Math.round(xA * 100)} %`, { size: 12.5, gras: true })}
    <rect x={AX.x0} y={yb} width={AX.x1 - AX.x0} height="10" rx="5" fill="#e2e8f0" stroke={C.trait} strokeWidth="2"/>
    {[0, 5, 10, 15, 20].map(h => <g key={h}><line x1={px(h)} y1={yb + 10} x2={px(h)} y2={yb + 16} stroke={C.trait}/>{T(px(h), yb + 30, String(h), { size: 12 })}</g>)}
    <g style={{ ...mvt, transform: `translate(${px(hmel)}px,0)` }}><polygon points={`0,${yb + 10} -9,${yb + 20} 9,${yb + 20}`} fill={C.vert} stroke="#14532d" strokeWidth="1.5"/>{T(0, yb + 50, `HLB du mélange = ${fr(hmel)}`, { size: 13.5, gras: true, fill: C.vert })}</g>
    {cible != null && <g style={{ ...mvt, transform: `translate(${px(cible)}px,0)` }}><line x1="0" y1={yb - 4} x2="0" y2={yb + 66} stroke={C.rouge} strokeWidth="2.5" strokeDasharray="5 3"/>{T(0, yb + 84, `cible RHLB = ${fr(cible)}`, { size: 13, gras: true, fill: C.rouge })}</g>}
    {T(160, 252, 'la plus grosse masse attire le point d’équilibre', { size: 12, fill: C.gris })}
  </>, 400);
}

// ---------- stabilité selon le HLB du mélange, et aspect au microscope ----------
const GRILLE = [[22, 18], [62, 14], [100, 22], [140, 16], [30, 52], [74, 46], [114, 56], [150, 50], [20, 88], [58, 84], [100, 92], [142, 86]];
export function SvgStabilite({ hlb, rhlb }) {
  const r = M.rayonGouttes(hlb, rhlb), s = M.stabilite(hlb, rhlb), cx = h => 40 + h / 20 * 258;
  const pts = Array.from({ length: 41 }, (_, k) => { const h = k / 2; return `${cx(h).toFixed(1)},${(130 - M.stabilite(h, rhlb) * 80).toFixed(1)}`; }).join(' ');
  const ok = Math.abs(hlb - rhlb) <= 0.5;
  return base(320, 330, `stabilité de l’émulsion selon le HLB du mélange d’émulsifiants : maximale quand le HLB du mélange (${fr(hlb)}) égale le RHLB de l’huile (${fr(rhlb)}) ; ici les gouttes ont un rayon d’environ ${fr(r)} micromètres`, <>
    {T(160, 18, 'Stabilité selon le HLB du mélange', { size: 13.5, gras: true })}
    <line x1="40" y1="130" x2="298" y2="130" stroke={C.trait} strokeWidth="2"/><line x1="40" y1="40" x2="40" y2="130" stroke={C.trait} strokeWidth="2"/>
    <polyline points={pts} fill="none" stroke={C.violet} strokeWidth="3"/>
    {[0, 5, 10, 15, 20].map(h => <g key={h}><line x1={cx(h)} y1="130" x2={cx(h)} y2="135" stroke={C.trait}/>{T(cx(h), 150, String(h), { size: 12 })}</g>)}
    {T(170, 168, 'HLB du mélange', { size: 12.5, fill: C.gris })}
    <text transform="translate(18 88) rotate(-90)" fontSize="12.5" fill={C.gris} textAnchor="middle" fontFamily="inherit">stabilité</text>
    <line x1={cx(rhlb)} y1="38" x2={cx(rhlb)} y2="130" stroke={C.rouge} strokeWidth="2" strokeDasharray="5 3"/>{T(Math.min(Math.max(cx(rhlb), 50), 280), 34, `RHLB ${fr(rhlb)}`, { size: 12.5, gras: true, fill: C.rouge })}
    <g style={{ ...mvt, transform: `translate(${cx(hlb)}px,0)` }}><circle cx="0" cy={130 - s * 80} r="7" fill="white" stroke={C.vert} strokeWidth="3.5"/></g>
    {T(160, 196, 'Au microscope', { size: 13.5, gras: true })}
    <g transform="translate(20 206)"><clipPath id="hlb-cp"><rect width="170" height="104" rx="10"/></clipPath><rect width="170" height="104" rx="10" fill={C.eau}/>
      <g clipPath="url(#hlb-cp)">{GRILLE.map(([x, y], k) => <circle key={k} cx={x + 4} cy={y + 6} r={r * 3.3} fill={C.huile} stroke={C.huileTr} strokeWidth="1.5" style={{ transition: 'r .45s ease-out' }}/>)}</g>
      <rect width="170" height="104" rx="10" fill="none" stroke={C.trait} strokeWidth="2"/></g>
    {T(244, 232, 'rayon moyen', { size: 12.5, fill: C.gris })}{T(244, 250, `≈ ${fr(r)} µm`, { size: 14, gras: true })}
    {T(244, 276, ok ? 'fine et stable' : hlb < rhlb ? 'trop lipophile' : 'trop hydrophile', { size: 13, gras: true, fill: ok ? C.vert : C.rouge })}
    {!ok && T(244, 293, 'gouttes grosses', { size: 12.5, fill: C.gris })}
    {T(160, 324, `HLB du mélange ${fr(hlb)} · RHLB ${fr(rhlb)}`, { size: 12.5, gras: true })}
  </>, 400);
}

// ======================= cartes « À retenir » =======================
export function SvgCarteEchelle() {
  const x = h => 20 + h / 20 * 260;
  return base(300, 230, 'échelle HLB : faible pour les émulsifiants lipophiles qui donnent des émulsions E/H, élevé pour les hydrophiles qui donnent des émulsions H/E ; le Span 80 vaut 4,3 et le Tween 80 vaut 15', <>
    <defs><linearGradient id="hlb-dg2" x1="0" x2="1"><stop offset="0" stopColor={C.huile}/><stop offset="1" stopColor={C.eau}/></linearGradient></defs>
    {T(150, 18, 'HLB : de lipophile à hydrophile', { size: 14, gras: true })}
    <rect x="20" y="86" width="260" height="24" rx="6" fill="url(#hlb-dg2)" stroke={C.trait} strokeWidth="2"/>
    {[0, 5, 10, 15, 20].map(h => <g key={h}><line x1={x(h)} y1="110" x2={x(h)} y2="116" stroke={C.trait}/>{T(x(h), 132, String(h), { size: 12.5 })}</g>)}
    <polygon points={`${x(4.3)},86 ${x(4.3) - 6},74 ${x(4.3) + 6},74`} fill={C.violet}/>{T(x(4.3) + 4, 66, 'Span 80 : 4,3', { size: 12.5, gras: true, fill: C.violet })}
    <polygon points={`${x(15)},86 ${x(15) - 6},74 ${x(15) + 6},74`} fill={C.violet}/>{T(x(15) - 4, 66, 'Tween 80 : 15', { size: 12.5, gras: true, fill: C.violet })}
    <rect x={x(3)} y="148" width={x(6) - x(3)} height="22" rx="4" fill="#fef3c7" stroke={C.huileTr}/>{T((x(3) + x(6)) / 2, 164, 'E/H', { size: 12.5, gras: true, fill: C.orange })}
    <rect x={x(8)} y="148" width={x(18) - x(8)} height="22" rx="4" fill="#dbeafe" stroke={C.eauTr}/>{T((x(8) + x(18)) / 2, 164, 'H/E', { size: 12.5, gras: true, fill: C.eauTr })}
    {T(60, 46, 'lipophile', { size: 12.5, gras: true, fill: C.orange })}{T(240, 46, 'hydrophile', { size: 12.5, gras: true, fill: C.eauTr })}
    <rect x="10" y="184" width="280" height="36" rx="8" fill="#f5f3ff" stroke={C.violet} strokeWidth="1.5"/>{T(150, 207, 'HLB bas → E/H · HLB haut → H/E', { size: 13, gras: true, fill: C.violet })}
  </>, 340);
}
export function SvgCarteMelange() {
  const x = h => 20 + h / 20 * 260;
  return base(300, 250, 'le HLB d’un mélange est la moyenne des HLB pondérée par les masses : 40 % de Span 80 à 4,3 et 60 % de Tween 80 à 15 donnent environ 10,7 ; la croix de Griffin donne la proportion pour une cible', <>
    {T(150, 18, 'Mélange de deux émulsifiants', { size: 14, gras: true })}
    <rect x="20" y="112" width="260" height="9" rx="4" fill="#e2e8f0" stroke={C.trait} strokeWidth="1.5"/>
    <circle cx={x(4.3)} cy={112 - 14} r="14" fill={C.huile} stroke={C.huileTr} strokeWidth="2"/>{T(x(4.3), 94, '40 %', { size: 12, gras: true })}
    <circle cx={x(15)} cy={112 - 17} r="17" fill={C.eau} stroke={C.eauTr} strokeWidth="2"/>{T(x(15), 90, '60 %', { size: 12.5, gras: true })}
    {T(x(4.3), 52, 'Span 80', { size: 12.5, gras: true, fill: C.orange })}{T(x(4.3), 66, '4,3', { size: 12.5, fill: C.gris })}
    {T(x(15), 52, 'Tween 80', { size: 12.5, gras: true, fill: C.eauTr })}{T(x(15), 66, '15', { size: 12.5, fill: C.gris })}
    <polygon points={`${x(10.72)},121 ${x(10.72) - 9},142 ${x(10.72) + 9},142`} fill={C.vert}/>{T(x(10.72), 160, 'HLB = 10,7', { size: 13, gras: true, fill: C.vert })}
    <rect x="10" y="172" width="280" height="68" rx="8" fill="#f0fdf4" stroke={C.vert} strokeWidth="1.5"/>
    {T(150, 192, 'HLB = x₁·HLB₁ + x₂·HLB₂', { size: 13.5, gras: true })}{T(150, 212, 'x₁ = (RHLB − HLB₂) ÷ (HLB₁ − HLB₂)', { size: 12.5 })}{T(150, 230, 'x : fractions massiques', { size: 12, fill: C.gris })}
  </>, 340);
}
export function SvgCarteBilanHlb() {
  return base(300, 250, 'méthode du RHLB en trois temps : calculer le RHLB de la phase huileuse, choisir deux émulsifiants qui l’encadrent, calculer la proportion de chacun', <>
    {[['1', 'RHLB de la phase huileuse', 'moyenne pondérée par les masses', C.orange], ['2', 'Deux émulsifiants qui l’encadrent', 'un HLB sous le RHLB, un au-dessus', C.eauTr], ['3', 'Proportion de chacun', 'x₁ = (RHLB − HLB₂) ÷ (HLB₁ − HLB₂)', C.vert]].map(([n, t, s, col], k) => <g key={n}>
      <rect x="8" y={10 + k * 78} width="284" height="70" rx="10" fill="white" stroke={col} strokeWidth="2.5"/>
      <circle cx="34" cy={45 + k * 78} r="15" fill={col}/>{T(34, 51 + k * 78, n, { size: 16, gras: true, fill: 'white' })}
      {T(168, 36 + k * 78, t, { size: 13.5, gras: true, fill: col })}{T(168, 56 + k * 78, s, { size: 12, anchor: 'middle' })}
    </g>)}
  </>, 340);
}
