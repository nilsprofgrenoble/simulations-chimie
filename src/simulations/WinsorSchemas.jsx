// Schémas de la simulation 243 « Microémulsions : types de Winsor et effet du sel ». SVG dans un viewBox de 320 de large, textes de 12 à 16, largeur 100 % plafonnée.
import { NOM_TYPE, etat } from "./winsorModele";

const C = { txt: '#0f172a', gris: '#64748b', orange: '#b45309', huile: '#ef4a23', micro: '#2563eb', eau: '#e2e8f0' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 13} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit">{s}</text>;
function base(w, h, label, children, max = 400) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
// Un flacon (dessiné dans une boîte de 100 × 160), placé en (x, y) à l'échelle k. st = { o, e, m } : fractions d'huile, d'eau (en excès) et de microémulsion
function Flacon({ id, x, y, k, st, cadre }) {
  const yHaut = 62, H = 88, couches = [[st.o, C.huile], [st.m, C.micro], [st.e, C.eau]].filter(c => c[0] > 0.0005);
  let yy = yHaut;
  return (
    <g transform={`translate(${x},${y}) scale(${k})`}>
      <defs><clipPath id={`wf${id}`}><rect x="5" y="32" width="90" height="122" rx="16"/></clipPath></defs>
      {cadre && <rect x="-6" y="-6" width="112" height="172" rx="10" fill="#fef3c7" stroke={C.orange} strokeWidth="3"/>}
      <rect x="5" y="32" width="90" height="122" rx="16" fill="#f8fafc" stroke="#475569" strokeWidth="2.5"/>
      <rect x="18" y="22" width="64" height="14" fill="#f8fafc" stroke="#475569" strokeWidth="2.5"/>
      <g clipPath={`url(#wf${id})`}>{couches.map(([f, col], i) => { const h = f * H, r = <rect key={i} x="5" y={yy} width="90" height={h + (i === couches.length - 1 ? 8 : 0)} fill={col}/>; yy += h; return r; })}</g>
      {couches.slice(0, -1).map((_, i) => { const yl = yHaut + couches.slice(0, i + 1).reduce((s, c) => s + c[0] * H, 0); return <line key={i} x1="5" y1={yl} x2="95" y2={yl} stroke="#0f172a" strokeWidth="1.2" opacity="0.55"/>; })}
      <rect x="8" y="0" width="84" height="24" rx="5" fill="#1f2937"/>
    </g>);
}
const LEG = [['huile en excès (toluène, rouge Soudan)', C.huile], ['microémulsion (bleu de méthylène)', C.micro], ['eau en excès', C.eau]];

// Le flacon du TP à la salinité réglée ; showType affiche le nom du type de Winsor
export function SvgFlaconTP({ st, showType = false }) {
  return base(320, 236, `flacon du TP : huile en excès ${Math.round(st.o * 100)} %, microémulsion ${Math.round(st.m * 100)} %, eau en excès ${Math.round(st.e * 100)} % du volume`, <>
    <Flacon id="s" x={18} y={16} k={1.3} st={st}/>
    {showType && T(240, 36, NOM_TYPE[st.type], { size: 17, gras: true, fill: C.orange })}
    {LEG.map(([l, c], i) => <g key={l}><rect x="170" y={showType ? 62 + 44 * i : 50 + 50 * i} width="16" height="16" rx="3" fill={c} stroke="#475569" strokeWidth="1.5"/>
      {T(192, (showType ? 62 : 50) + (showType ? 44 : 50) * i + 13, l.split(' (')[0], { size: 13, anchor: 'start' })}
      {l.includes('(') && T(192, (showType ? 62 : 50) + (showType ? 44 : 50) * i + 29, '(' + l.split(' (')[1], { size: 11.5, anchor: 'start', fill: C.gris })}</g>)}
  </>);
}

// Les 12 flacons du TP (salinité 1 à 12 %), le flacon courant est encadré
export function SvgFlacons12({ serie, courant }) {
  return base(320, 214, 'les douze flacons du TP, de 1 % à 12 % de NaCl', <>
    {serie.map((st, i) => { const r = Math.floor(i / 6), c = i % 6, x = 8 + c * 52, y = 8 + r * 104;
      return <g key={i}><Flacon id={`m${i}`} x={x + 3} y={y} k={0.42} st={st} cadre={courant === i + 1}/>{T(x + 28, y + 88, `${i + 1} %`, { size: 12.5, gras: courant === i + 1 })}</g>; })}
  </>);
}

// Les quatre types de Winsor côte à côte
export function SvgCarteWinsor() {
  const L = [['I', 'H/E'], ['III', 'bicontinue'], ['II', 'E/H'], ['IV', '1 phase']];
  const S = { I: etat(3), III: etat(7), II: etat(11), IV: etat(7, 40) };
  return base(320, 178, 'les quatre types de Winsor : I, III, II et IV', <>
    {L.map(([t, d], i) => <g key={t}><Flacon id={`c${i}`} x={14 + i * 76} y={4} k={0.62} st={S[t]}/>{T(14 + i * 76 + 31, 118, `Winsor ${t}`, { size: 12.5, gras: true })}{T(14 + i * 76 + 31, 134, d, { size: 12, fill: C.gris })}</g>)}
    {T(110, 164, 'salinité croissante', { size: 12.5, fill: C.orange, gras: true })}
    <line x1="14" y1="152" x2="226" y2="152" stroke={C.orange} strokeWidth="2"/><polyline points="218,147 226,152 218,157" fill="none" stroke={C.orange} strokeWidth="2"/>
  </>);
}

// Bilan : effet du sel et du mélange actif
export function SvgCarteSelWinsor() {
  const R = [['Plus de sel', 'le SDS est moins soluble dans l’eau', '#1d4ed8'], ['Rapport R', 'R augmente : A(SH) / A(SE)', '#b45309'], ['I → III → II', 'R < 1, puis R ≈ 1, puis R > 1', '#15803d'], ['Plus de mélange actif', 'on tend vers Winsor IV', '#7c3aed']];
  return base(320, 214, 'effet du sel et du mélange actif sur les microémulsions', <>
    {R.map(([n, d, c], i) => <g key={n}><rect x="8" y={8 + 51 * i} width="6" height="40" rx="3" fill={c}/>{T(24, 26 + 51 * i, n, { size: 14.5, gras: true, anchor: 'start', fill: c })}{T(24, 45 + 51 * i, d, { size: 12.5, anchor: 'start' })}</g>)}
  </>);
}
