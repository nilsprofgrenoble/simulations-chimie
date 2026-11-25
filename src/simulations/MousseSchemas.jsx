// Schémas de la simulation 226 « Mousses : former, stabiliser, détruire ». SVG dans un viewBox de ~320 de large, textes de 12 à 15, largeur 100 % plafonnée.
import * as M from "./mousseModele";

const C = { eau: '#dbeafe', eauTr: '#60a5fa', trait: '#475569', txt: '#0f172a', gris: '#64748b', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', violet: '#7c3aed', bleu: '#1d4ed8', verre: '#94a3b8' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 13} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" {...(o.halo ? { stroke: '#f8fafc', strokeWidth: 3, paintOrder: 'stroke' } : {})}>{s}</text>;
function base(w, h, label, children, max = 400) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const mvt = { transition: 'transform .6s ease-out, opacity .6s ease-out' };

// ---------- lamelle de liquide entre deux bulles (zoom) ----------
// type : 'sds' | 'sles' ; r : fraction de dodécanol (0..0.2) ; d : antimousse (% de la formule, 0..0.5) ; vide : true pour ne pas dessiner le contenu (non utilisé)
function Tensio({ x, y, haut, ethox, charge }) {
  const dir = haut ? -1 : 1;                           // les queues vont vers l'air, les têtes vers l'eau
  const y0 = y;                                        // tête côté eau (y0), queue côté air
  return <g>
    <line x1={x} y1={y0 + dir * 6} x2={x} y2={y0 + dir * 30} stroke={C.trait} strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx={x} cy={y0} r={ethox ? 7 : 6} fill={ethox ? '#93c5fd' : '#60a5fa'} stroke={C.bleu} strokeWidth="1.5"/>
    {charge && <text x={x} y={y0 + 3.5} fontSize="10" fontWeight="700" textAnchor="middle" fill="white" fontFamily="inherit">−</text>}
  </g>;
}
export function SvgLamelle({ type = 'sds', r = 0, d = 0, titre = true }) {
  const eth = type === 'sles';
  const pas = eth ? 17 : 27;
  const xs = []; for (let x = 28; x <= 292; x += pas) xs.push(x);
  const nDod = Math.round((r / 0.2) * 7);
  const dod = xs.slice(0, -1).filter((_, i) => i % 2 === 0).slice(0, nDod);
  const perce = d > 0.04;
  const taille = 20 + Math.min(d, 0.5) * 50;
  return base(320, 232, `lamelle de liquide entre deux bulles d’air : l’eau est prise entre deux couches de tensioactif, têtes hydrophiles vers l’eau et queues vers l’air${r > 0 ? ' ; du dodécanol s’intercale entre les molécules' : ''}${d > 0 ? ' ; une goutte d’antimousse très hydrophobe pénètre la lamelle' : ''}`, <>
    <rect x="14" y="78" width="292" height="76" fill={C.eau} stroke="none"/>
    {T(8, 16, 'air (bulle)', { size: 12, fill: C.gris, anchor: 'start' })}{T(8, 226, 'air (bulle voisine)', { size: 12, fill: C.gris, anchor: 'start' })}
    {xs.map(x => <Tensio key={`h${x}`} x={x} y={78} haut ethox={eth} charge={!eth}/>)}
    {xs.map(x => <Tensio key={`b${x}`} x={x} y={154} haut={false} ethox={eth} charge={!eth}/>)}
    {dod.map(x => { const xm = x + pas / 2; return <g key={`d${x}`}>
      <line x1={xm} y1={78 - 3} x2={xm} y2={78 - 24} stroke={C.orange} strokeWidth="2.6" strokeLinecap="round"/><circle cx={xm} cy={78 - 1} r="2.8" fill={C.orange}/>
      <line x1={xm} y1={154 + 3} x2={xm} y2={154 + 24} stroke={C.orange} strokeWidth="2.6" strokeLinecap="round"/><circle cx={xm} cy={154 + 1} r="2.8" fill={C.orange}/></g>; })}
    {d > 0 && <g style={{ ...mvt }}>
      <ellipse cx="160" cy="116" rx={taille * 0.9} ry={taille} fill={C.orange} opacity="0.85" stroke="#7c2d12" strokeWidth="2"/>
      {perce && <><line x1="160" y1={116 - taille - 2} x2="160" y2={116 + taille + 2} stroke="white" strokeWidth="3" strokeDasharray="4 3"/></>}
      {T(160 + taille * 0.9 + 8, 121, 'antimousse', { size: 12.5, gras: true, anchor: 'start', fill: C.orange, halo: true })}
    </g>}
    {T(160, 120, d > 0 ? '' : 'eau', { size: 13, gras: true, fill: C.bleu })}
    {titre && T(160, 36, eth ? 'laureth sulfate : couche compacte' : 'SDS : têtes chargées, assez espacées', { size: 12.5, gras: true, fill: eth ? C.vert : C.rouge, halo: true })}
  </>, 400);
}
// deux lamelles côte à côte (SDS / laureth sulfate)
export function SvgComparaisonLamelles() {
  const colonne = (x0, eth) => {
    const pas = eth ? 13 : 20, xs = []; for (let x = x0 + 8; x <= x0 + 140; x += pas) xs.push(x);
    return <g>
      <rect x={x0} y="70" width="148" height="70" fill={C.eau}/>
      {xs.map(x => <g key={x}><circle cx={x} cy="70" r={eth ? 5.5 : 5} fill="#60a5fa" stroke={C.bleu}/><line x1={x} y1="64" x2={x} y2="42" stroke={C.trait} strokeWidth="2" strokeLinecap="round"/>
        <circle cx={x} cy="140" r={eth ? 5.5 : 5} fill="#60a5fa" stroke={C.bleu}/><line x1={x} y1="146" x2={x} y2="168" stroke={C.trait} strokeWidth="2" strokeLinecap="round"/></g>)}
      {T(x0 + 74, 108, 'eau', { size: 13, gras: true, fill: C.bleu })}
      {T(x0 + 74, 22, eth ? 'laureth sulfate' : 'SDS', { size: 14, gras: true, fill: eth ? C.vert : C.rouge })}
      {T(x0 + 74, 190, eth ? 'plus de molécules par µm²' : 'moins de molécules par µm²', { size: 12, fill: C.gris })}
    </g>;
  };
  return base(320, 206, 'comparaison de la couche de tensioactif dans une lamelle : le SDS laisse des molécules plus espacées, le laureth sulfate se range de façon plus serrée', <>
    {colonne(8, false)}{colonne(164, true)}
  </>, 400);
}

// ---------- éprouvette de mousse ----------
const PXCM = 6.5;
export function SvgMousse({ h, t = null, legende = '' }) {
  const hh = Math.max(0, Math.min(26, h));
  const yliq = 178, ytop = yliq - hh * PXCM;
  const rangs = Math.ceil((hh * PXCM) / 15) + 1;
  const bulles = [];
  for (let k = 0; k < rangs; k++) for (let j = 0; j < 5; j++) bulles.push([122 + (k % 2) * 9 + j * 18, yliq - 9 - k * 15, 7 + ((j + k * 3) % 3)]);
  return base(320, 232, `éprouvette contenant 50 mL de liquide surmontés d’une colonne de mousse de ${fr(hh, 1)} cm de hauteur`, <>
    <defs><clipPath id="clipMousse"><rect x="110" y={ytop} width="100" height={yliq - ytop}/></clipPath></defs>
    <rect x="110" y="10" width="100" height="196" rx="6" fill="white" stroke={C.verre} strokeWidth="3"/>
    <rect x="112" y={yliq} width="96" height="26" fill={C.eau}/>
    <g clipPath="url(#clipMousse)"><rect x="110" y={ytop} width="100" height={yliq - ytop} fill="#f8fafc"/>
      {bulles.map(([x, y, rr], i) => <circle key={i} cx={x} cy={y} r={rr} fill="white" stroke="#94a3b8" strokeWidth="1.4"/>)}</g>
    {hh > 0 && <line x1="104" y1={ytop} x2="216" y2={ytop} stroke={C.violet} strokeWidth="2.5" strokeDasharray="5 3" style={mvt}/>}
    {[0, 5, 10, 15, 20, 25].map(v => <g key={v}><line x1="210" y1={yliq - v * PXCM} x2="220" y2={yliq - v * PXCM} stroke={C.trait} strokeWidth="1.6"/>{T(224, yliq - v * PXCM + 4, String(v), { size: 12, anchor: 'start' })}</g>)}
    {T(262, 24, 'cm', { size: 12, fill: C.gris })}
    {T(60, 120, 'hauteur', { size: 13, gras: true, fill: C.violet })}{T(60, 138, `${fr(hh, 1)} cm`, { size: 15, gras: true, fill: C.violet })}
    {t != null && T(60, 164, `t = ${fr(t, 1)} min`, { size: 13, gras: true })}
    {T(160, 224, legende || 'mousse sur 50 mL de solution', { size: 12, fill: C.gris })}
  </>, 400);
}

// ---------- courbes hauteur de mousse / temps ----------
const PC = { x0: 44, x1: 304, y0: 24, y1: 166 };
export function SvgCourbeMousse({ mode = 'rm', e = null, p = null, tNow = null, tStop = 10, tMax = 15, ymax = 30 }) {
  const fh = mode === 'rm' ? (t => p ? (t <= p.td ? p.H0 : p.H0 * Math.pow(2, -(t - p.td) / p.th)) : M.hauteurRM(e, t)) : (t => M.hauteurB(e, t, tStop));
  const px = t => PC.x0 + (t / tMax) * (PC.x1 - PC.x0), py = h => PC.y1 - (Math.min(h, ymax) / ymax) * (PC.y1 - PC.y0);
  const pts = []; for (let t = 0; t <= tMax + 1e-9; t += 0.25) pts.push(`${px(t).toFixed(1)},${py(fh(t)).toFixed(1)}`);
  const plateau = mode === 'bik' ? M.plateauB(e) : null;
  return base(320, 214, mode === 'rm' ? 'courbe de la hauteur de mousse en fonction du temps (méthode de Ross-Miles) : hauteur constante un instant, puis décroissance' : 'courbe de la hauteur de mousse en fonction du temps (méthode de Bikerman) : montée vers un plateau sous débit de gaz constant, puis décroissance après l’arrêt du gaz', <>
    <line x1={PC.x0} y1={PC.y1} x2={PC.x1} y2={PC.y1} stroke={C.trait} strokeWidth="2"/><line x1={PC.x0} y1={PC.y0} x2={PC.x0} y2={PC.y1} stroke={C.trait} strokeWidth="2"/>
    {[0, 10, 20, 30].map(v => <g key={v}><line x1={PC.x0 - 4} y1={py(v)} x2={PC.x0} y2={py(v)} stroke={C.trait}/>{T(PC.x0 - 7, py(v) + 4, String(v), { size: 12, anchor: 'end' })}</g>)}
    {[0, 5, 10, 15].map(v => <g key={v}><line x1={px(v)} y1={PC.y1} x2={px(v)} y2={PC.y1 + 4} stroke={C.trait}/>{T(px(v), PC.y1 + 17, String(v), { size: 12 })}</g>)}
    {T(PC.x0 + (PC.x1 - PC.x0) / 2, 204, 'temps (min)', { size: 12.5, gras: true })}{T(6, 16, 'hauteur de mousse (cm)', { size: 12.5, gras: true, anchor: 'start' })}
    {mode === 'bik' && plateau != null && plateau < ymax && <g><line x1={PC.x0} y1={py(plateau)} x2={PC.x1} y2={py(plateau)} stroke={C.orange} strokeWidth="1.8" strokeDasharray="5 4"/>{T(PC.x1 - 2, py(plateau) - 5, 'plateau', { size: 12, anchor: 'end', fill: C.orange, gras: true })}</g>}
    {mode === 'bik' && <g><line x1={px(tStop)} y1={PC.y0 + 6} x2={px(tStop)} y2={PC.y1} stroke={C.gris} strokeWidth="1.6" strokeDasharray="3 3"/>{T(px(tStop) + 4, PC.y0 + 14, 'arrêt du gaz', { size: 12, anchor: 'start', fill: C.gris })}</g>}
    <polyline points={pts.join(' ')} fill="none" stroke={C.violet} strokeWidth="3"/>
    {tNow != null && <g style={{ ...mvt, transform: `translate(${px(tNow)}px,${py(fh(tNow))}px)` }}><circle r="7" fill="white" stroke="#0f172a" strokeWidth="3"/></g>}
  </>, 420);
}

// ---------- cartes « À retenir » (viewBox 300 de large) ----------
const Fleche = ({ x1, x2, y, col = C.trait }) => <g><line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke={col} strokeWidth="3"/><polygon points={`${x2},${y} ${x2 - 10},${y - 6} ${x2 - 10},${y + 6}`} fill={col}/></g>;
export function SvgCarteLamelle() {
  const xs = [30, 60, 90, 120, 150, 180, 210, 240, 270];
  return base(300, 156, 'une mousse : une lamelle d’eau entre deux couches de tensioactif, queues vers l’air, têtes vers l’eau', <>
    <rect x="10" y="54" width="280" height="44" fill={C.eau}/>
    {xs.map(x => <g key={x}><circle cx={x} cy="54" r="6" fill="#60a5fa" stroke={C.bleu}/><line x1={x} y1="48" x2={x} y2="26" stroke={C.trait} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx={x} cy="98" r="6" fill="#60a5fa" stroke={C.bleu}/><line x1={x} y1="104" x2={x} y2="126" stroke={C.trait} strokeWidth="2.2" strokeLinecap="round"/></g>)}
    {T(150, 80, 'eau (lamelle)', { size: 13, gras: true, fill: C.bleu })}{T(150, 16, 'air', { size: 12.5, fill: C.gris })}{T(150, 146, 'air', { size: 12.5, fill: C.gris })}
  </>, 320);
}
export function SvgCarteMesures() {
  const bo = (x, titre, l2) => <g><rect x={x} y="8" width="140" height="104" rx="8" fill="white" stroke={C.violet} strokeWidth="2.5"/>{T(x + 70, 30, titre, { size: 13.5, gras: true, fill: C.violet })}{l2.map((l, i) => T(x + 70, 52 + i * 18, l, { size: 12.5 }))}</g>;
  return base(300, 150, 'deux méthodes pour mesurer un pouvoir moussant : Ross-Miles (on verse la solution, on lit la hauteur puis sa décroissance) et Bikerman (on injecte un gaz et on lit le plateau)', <>
    {bo(6, 'Ross-Miles', ['on verse 200 mL', 'de 90 cm de haut', 'hauteur : moussabilité', 'décroissance : stabilité'])}{bo(154, 'Bikerman', ['débit de gaz constant', 'plateau : formation', '= rupture ; arrêt du gaz', 'puis décroissance'])}
    {T(150, 134, 'à comparer à quantité égale de tensioactif', { size: 12.5, fill: C.gris })}
  </>, 320);
}
export function SvgCarteBilanMousse() {
  return base(300, 176, 'bilan sur les mousses : un tensioactif en micelles à 5 à 10 fois la CMC forme la mousse, des additifs et des conditions la stabilisent, un antimousse très hydrophobe la détruit', <>
    {[['1', 'Former', 'tensioactif à 5 à 10 × CMC', C.bleu], ['2', 'Stabiliser', 'couche cohésive, viscosité, eau douce', C.violet], ['3', 'Détruire', 'antimousse : hydrophobe, insoluble', C.orange]].map(([n, a, b, col], i) => <g key={n}>
      <circle cx="20" cy={26 + i * 44} r="14" fill={col}/>{T(20, 31 + i * 44, n, { size: 14, gras: true, fill: 'white' })}
      {T(44, 22 + i * 44, a, { size: 13.5, gras: true, anchor: 'start', fill: col })}{T(44, 38 + i * 44, b, { size: 13, anchor: 'start' })}</g>)}
    {T(150, 160, 'moussabilité et stabilité : deux choses différentes', { size: 12.5, gras: true, fill: C.vert })}
  </>, 320);
}
