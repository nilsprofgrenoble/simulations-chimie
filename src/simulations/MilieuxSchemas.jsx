// Schémas de la simulation 237 « Milieux dispersés : types et causes d'instabilité ». SVG dans un viewBox de 320 de large, textes de 12 à 14, largeur 100 % plafonnée.
import { typeDe } from "./milieuxDispersesModele";

const C = { txt: '#0f172a', gris: '#64748b', orange: '#b45309', trait: '#475569' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 13} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit">{s}</text>;
function base(w, h, label, children, max = 400) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
// Positions fixes des objets dispersés : [x, y, rayon]
const POS = [[50, 50, 16], [120, 40, 11], [200, 55, 18], [270, 45, 12], [80, 110, 13], [150, 95, 19], [230, 115, 14], [285, 100, 10], [45, 150, 12], [115, 150, 15], [190, 155, 11], [255, 155, 17], [160, 55, 8], [30, 95, 9]];
const FOND = { gaz: '#f1f5f9', liquide: '#bfdbfe', solide: '#d6d3d1' };
const NOM = { gaz: 'gaz', liquide: 'liquide', solide: 'solide' };
const hexa = (x, y, r, k) => Array.from({ length: 6 }, (_, i) => { const a = (i * 60 + 17 * k) * Math.PI / 180, f = 0.85 + 0.25 * ((i + k) % 2); return `${(x + r * f * Math.cos(a)).toFixed(1)},${(y + r * f * Math.sin(a)).toFixed(1)}`; }).join(' ');

// Une phase dispersée (gaz, liquide ou solide) répartie dans une phase continue
export function SvgMilieu({ disp, cont }) {
  const melange = disp === 'gaz' && cont === 'gaz';
  const type = typeDe(disp, cont);
  const obj = ([x, y, r], k) => disp === 'solide'
    ? <polygon key={k} points={hexa(x, y, r, k)} fill="#475569" stroke="#1e293b" strokeWidth="1.2"/>
    : <circle key={k} cx={x} cy={y} r={r} fill={disp === 'gaz' ? '#ffffff' : '#fcd34d'} stroke={disp === 'gaz' ? '#64748b' : '#b45309'} strokeWidth="1.5"/>;
  return base(320, 232, `phase dispersée : ${NOM[disp]}, dans une phase continue : ${NOM[cont]}${type ? ` (${type})` : ' : un seul mélange homogène'}`, <>
    <defs><pattern id="mdHach" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#a8a29e" strokeWidth="2"/></pattern></defs>
    <rect x="8" y="10" width="304" height="170" rx="8" fill={FOND[cont]} stroke="#475569" strokeWidth="1.5"/>
    {cont === 'solide' && <rect x="8" y="10" width="304" height="170" rx="8" fill="url(#mdHach)" stroke="none"/>}
    {!melange && POS.map(obj)}
    {melange && [[60, 60], [150, 100], [240, 70], [90, 140], [220, 145], [270, 110], [40, 110]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={i % 2 ? '#475569' : '#b45309'}/>)}
    {T(160, 200, `phase continue : ${NOM[cont]}`, { size: 14, gras: true, fill: '#1d4ed8' })}
    {T(160, 222, melange ? 'deux gaz : un seul mélange homogène' : `phase dispersée : ${NOM[disp]}`, { size: 14, gras: true, fill: C.orange })}
  </>);
}

// Tableau 3 × 3 des types de milieux dispersés (cellule surlignée facultative)
export function SvgTableau({ sel }) {
  const E = ['gaz', 'liquide', 'solide'], x0 = 70, cw = 82, y0 = 46, rh = 46;
  const lignes = nom => nom.split(' ').length > 1 ? nom.split(' ') : [nom];
  return base(320, 196, 'tableau des types de milieux dispersés selon l’état de la phase dispersée (lignes) et de la phase continue (colonnes)', <>
    {T(x0 + 1.5 * cw, 15, 'phase continue', { size: 13, gras: true, fill: '#1d4ed8' })}
    {T(36, 36, 'dispersée', { size: 12.5, gras: true, fill: C.orange })}
    {E.map((c, j) => T(x0 + cw * (j + 0.5), 36, c, { size: 13, gras: true }))}
    {E.map((d, i) => <g key={d}>{T(36, y0 + rh * i + rh / 2 + 5, d, { size: 13, gras: true })}
      {E.map((c, j) => { const t = typeDe(d, c), s = sel && sel.disp === d && sel.cont === c, L = t ? lignes(t) : ['—'];
        return <g key={c}><rect x={x0 + cw * j + 2} y={y0 + rh * i + 2} width={cw - 4} height={rh - 4} rx="6" fill={s ? '#fef3c7' : t ? '#f8fafc' : '#e2e8f0'} stroke={s ? C.orange : '#94a3b8'} strokeWidth={s ? 3 : 1}/>
          {L.map((l, k) => T(x0 + cw * (j + 0.5), y0 + rh * i + rh / 2 + (L.length === 1 ? 5 : k ? 9 : -4), l, { size: 12.5, gras: !!t }))}</g>; })}</g>)}
  </>);
}

// Les quatre problèmes de stabilité et leur origine
export function SvgCarteProblemes() {
  const R = [['Crémage', 'la phase dispersée, moins dense, monte', '#1d4ed8'], ['Sédimentation', 'la phase dispersée, plus dense, descend', '#b45309'], ['Floculation', 'des amas se forment, réversibles', '#15803d'], ['Coalescence', 'les films se rompent : fusion irréversible', '#b91c1c']];
  return base(320, 214, 'quatre problèmes de stabilité : crémage, sédimentation, floculation, coalescence', <>
    {R.map(([n, d, c], i) => <g key={n}><rect x="8" y={8 + 51 * i} width="6" height="40" rx="3" fill={c}/>{T(24, 26 + 51 * i, n, { size: 14.5, gras: true, anchor: 'start', fill: c })}{T(24, 45 + 51 * i, d, { size: 12.5, anchor: 'start' })}</g>)}
  </>);
}
