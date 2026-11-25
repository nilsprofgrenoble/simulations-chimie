// Schémas de la simulation 225 « Mouiller, disperser, stabiliser une suspension ». SVG dans un viewBox de ~320 de large, textes de 12 à 15, largeur 100 % plafonnée.
import * as M from "./dispersionModele";

const C = { part: '#e2e8f0', partTr: '#475569', eau: '#dbeafe', eauTr: '#60a5fa', trait: '#475569', txt: '#0f172a', gris: '#64748b', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', violet: '#7c3aed', bleu: '#1d4ed8' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 13} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" {...(o.halo ? { stroke: '#f8fafc', strokeWidth: 3, paintOrder: 'stroke' } : {})}>{s}</text>;
function base(w, h, label, children, max = 400) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const mvt = { transition: 'transform .6s ease-out, opacity .6s ease-out' };

// ---------- mouillage : un amas de poudre dans l'eau ----------
// Grains de l'amas (positions relatives) et bulles d'air emprisonné
const GRAINS = Array.from({ length: 19 }, (_, i) => { const r = i < 1 ? 0 : i < 7 ? 1 : 2, k = i < 1 ? 0 : i < 7 ? i - 1 : i - 7, n = r === 0 ? 1 : r === 1 ? 6 : 12, a = (k / n) * 2 * Math.PI + r * 0.4; return [Math.cos(a) * r * 17, Math.sin(a) * r * 17]; });
const BULLES = [[-12, -10], [10, -14], [-20, 8], [16, 6], [0, 18], [-6, 0], [24, -4], [-26, -6]];
export function SvgMouillage({ m }) {
  const air = 1 - m, niveau = 50 + m * 70;     // le liquide pénètre : l'amas s'enfonce
  const lib = m < 0.34 ? 'L’amas flotte : air piégé' : m < 0.8 ? 'Le liquide pénètre peu à peu' : 'Le liquide a remplacé l’air';
  return base(320, 232, `un amas de grains de poudre dans l’eau ; ${lib.toLowerCase()}`, <>
    <rect x="30" y="64" width="260" height="150" rx="10" fill={C.eau} stroke={C.eauTr} strokeWidth="2"/>
    <line x1="30" y1="64" x2="290" y2="64" stroke={C.bleu} strokeWidth="2" strokeDasharray="6 4"/>
    {T(284, 59, 'surface', { size: 12, anchor: 'end', fill: C.bleu })}
    <g style={{ ...mvt, transform: `translate(160px,${niveau + 32}px)` }}>
      <circle r="48" fill={m > 0.8 ? '#bfdbfe' : '#f1f5f9'} stroke={C.gris} strokeDasharray="4 3" opacity="0.9"/>
      {GRAINS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" fill={C.part} stroke={C.partTr} strokeWidth="1.8"/>)}
      {BULLES.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="white" stroke={C.gris} opacity={i / BULLES.length < air ? 1 : 0} style={{ transition: 'opacity .6s' }}/>)}
    </g>
    <rect x="50" y="6" width="220" height="26" rx="6" fill="white" stroke={m < 0.34 ? C.rouge : m < 0.8 ? C.orange : C.vert} strokeWidth="2"/>{T(160, 24, lib, { size: 13, gras: true, fill: m < 0.34 ? C.rouge : m < 0.8 ? C.orange : C.vert })}
    {m < 0.5 && T(160, 226, 'bulles blanches : air emprisonné', { size: 12, fill: C.gris })}
    {m >= 0.5 && T(160, 226, 'le liquide a pris la place de l’air', { size: 12, fill: C.gris })}
  </>, 400);
}

// ---------- distribution granulométrique ----------
const PX = { x0: 40, x1: 304, y0: 28, y1: 170 };
const lx = d => PX.x0 + (Math.log10(d) / Math.log10(400)) * (PX.x1 - PX.x0);
export function SvgDistribution({ q, qRef = null, marques = true, nom = '' }) {
  const ymax = Math.max(12, Math.ceil(Math.max(...q, ...(qRef || [0])) / 2) * 2 + 1);
  const ly = v => PX.y1 - (v / ymax) * (PX.y1 - PX.y0);
  const path = serie => serie.map((v, i) => `${i ? 'L' : 'M'}${lx(M.GRILLE[i]).toFixed(1)},${ly(v).toFixed(1)}`).join(' ');
  const d10 = M.diametre(q, 10), d50 = M.diametre(q, 50), d90 = M.diametre(q, 90);
  return base(320, 214, `distribution granulométrique ${nom} : fraction massique en pourcentage selon le diamètre des particules en micromètres, échelle logarithmique de 1 à 400 ; D10 ${fr(d10)} µm, D50 ${fr(d50)} µm, D90 ${fr(d90)} µm`, <>
    <rect x={lx(M.SEUIL_AGGLO)} y={PX.y0} width={PX.x1 - lx(M.SEUIL_AGGLO)} height={PX.y1 - PX.y0} fill="#ffedd5"/>
    {T((lx(M.SEUIL_AGGLO) + PX.x1) / 2, PX.y0 + 12, '> 50 µm', { size: 12, gras: true, fill: C.orange })}
    <line x1={PX.x0} y1={PX.y1} x2={PX.x1} y2={PX.y1} stroke={C.trait} strokeWidth="1.5"/><line x1={PX.x0} y1={PX.y0} x2={PX.x0} y2={PX.y1} stroke={C.trait} strokeWidth="1.5"/>
    {[1, 10, 100].map(d => <g key={d}><line x1={lx(d)} y1={PX.y1} x2={lx(d)} y2={PX.y1 + 4} stroke={C.trait}/>{T(lx(d), PX.y1 + 17, String(d), { size: 12 })}</g>)}
    {T(PX.x1 / 2 + 22, 205, 'diamètre (µm, échelle log)', { size: 12, gras: true })}{T(6, 18, 'fraction massique (%)', { size: 12, gras: true, anchor: 'start' })}
    {[0, ymax / 2, ymax].map(v => T(PX.x0 - 5, ly(v) + 4, String(Math.round(v)), { size: 12, anchor: 'end' }))}
    {qRef && <path d={path(qRef)} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="5 4"/>}
    <path d={path(q)} fill="none" stroke={C.violet} strokeWidth="3.2" strokeLinejoin="round"/>
    {marques && [[d10, 'D10'], [d50, 'D50'], [d90, 'D90']].map(([d, l], i) => <g key={l}><line x1={lx(d)} y1={PX.y0 + 18} x2={lx(d)} y2={PX.y1} stroke={C.gris} strokeDasharray="3 3"/>{T(lx(d) + (i === 0 ? -3 : 3), PX.y0 + 30 + i * 0, l, { size: 12, gras: true, anchor: i === 0 ? 'end' : 'start', halo: true })}</g>)}
  </>, 420);
}

// ---------- mécanismes de répulsion ----------
function GrainMeca({ x, y, elec, ster }) {
  return <g>
    {ster && Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * 2 * Math.PI, x1 = x + Math.cos(a) * 15, y1 = y + Math.sin(a) * 15, x2 = x + Math.cos(a) * 34, y2 = y + Math.sin(a) * 34, xm = x + Math.cos(a + 0.5) * 26, ym = y + Math.sin(a + 0.5) * 26; return <path key={k} d={`M${x1},${y1} Q${xm},${ym} ${x2},${y2}`} fill="none" stroke={C.violet} strokeWidth="2"/>; })}
    {elec && <circle cx={x} cy={y} r={ster ? 40 : 34} fill="none" stroke={C.gris} strokeDasharray="3 3"/>}
    <circle cx={x} cy={y} r="15" fill={C.part} stroke={C.partTr} strokeWidth="2.5"/>
    {elec && [[0, -22], [22, 0], [0, 22], [-22, 0]].map(([dx, dy], k) => <text key={k} x={x + dx} y={y + dy + 5} fontSize="14" fontWeight="700" textAnchor="middle" fill={C.bleu} fontFamily="inherit">−</text>)}
  </g>;
}
export function SvgMecanismes({ sel = null }) {
  const cols = [[54, true, false, 'Électro-', 'statique', 'eau'], [160, false, true, 'Stérique', '', 'solvant ou eau'], [266, true, true, 'Électro-', 'stérique', 'milieu ionique']];
  return base(320, 176, 'trois mécanismes de répulsion entre particules : électrostatique (charges et couche de contre-ions), stérique (chaînes de polymère greffées), électro-stérique (les deux)', <>
    {cols.map(([x, e, s, l1, l2, milieu], i) => <g key={i}>
      {sel === i && <rect x={x - 51} y="6" width="102" height="164" rx="10" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 4"/>}
      <GrainMeca x={x} y={56} elec={e} ster={s}/>
      {T(x, 118, l1 + l2, { size: 13, gras: true })}
      {T(x, 140, milieu, { size: 12, fill: C.gris })}
    </g>)}
  </>, 400);
}

// ---------- étalement en fonction du dosage ----------
const EX = { x0: 40, x1: 304, y0: 26, y1: 168 }, XM = 5, EM = 32;
const ex = x => EX.x0 + (x / XM) * (EX.x1 - EX.x0), ey = e => EX.y1 - (e / EM) * (EX.y1 - EX.y0);
export function SvgEtalement({ x, montreOpt = false }) {
  const pts = []; for (let v = 0; v <= XM + 1e-9; v += 0.05) pts.push(`${ex(v).toFixed(1)},${ey(M.etalement(v)).toFixed(1)}`);
  const e = M.etalement(x), xo = M.dosageOptimal();
  return base(320, 212, `étalement d’une pâte en fonction du dosage en dispersant de 0 à 5 pour cent : l’étalement augmente puis se stabilise${montreOpt ? ` ; optimum vers ${fr(xo)} pour cent` : ''}`, <>
    <line x1={EX.x0} y1={EX.y1} x2={EX.x1} y2={EX.y1} stroke={C.trait} strokeWidth="1.5"/><line x1={EX.x0} y1={EX.y0} x2={EX.x0} y2={EX.y1} stroke={C.trait} strokeWidth="1.5"/>
    {[0, 1, 2, 3, 4, 5].map(v => <g key={v}><line x1={ex(v)} y1={EX.y1} x2={ex(v)} y2={EX.y1 + 4} stroke={C.trait}/>{T(ex(v), EX.y1 + 17, String(v), { size: 12 })}</g>)}
    {[0, 10, 20, 30].map(v => T(EX.x0 - 5, ey(v) + 4, String(v), { size: 12, anchor: 'end' }))}
    {T(EX.x1 / 2 + 20, 206, 'dispersant sec (% de la masse de ciment)', { size: 12, gras: true })}{T(6, 16, 'étalement (cm)', { size: 12, gras: true, anchor: 'start' })}
    {montreOpt && <g><line x1={ex(xo)} y1={EX.y0} x2={ex(xo)} y2={EX.y1} stroke={C.orange} strokeWidth="2" strokeDasharray="5 4"/>{T(ex(xo), EX.y0 - 4, `optimum ${fr(xo)} %`, { size: 12, gras: true, fill: C.orange, halo: true })}</g>}
    <polyline points={pts.join(' ')} fill="none" stroke={C.violet} strokeWidth="3"/>
    <g style={{ ...mvt, transform: `translate(${ex(x)}px,${ey(e)}px)` }}><circle r="7" fill="white" stroke="#0f172a" strokeWidth="3"/></g>
  </>, 420);
}

// ---------- cartes « À retenir » (viewBox 300 de large) ----------
const Fleche = ({ x1, x2, y, col = C.trait }) => <g><line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke={col} strokeWidth="3"/><polygon points={`${x2},${y} ${x2 - 10},${y - 6} ${x2 - 10},${y + 6}`} fill={col}/></g>;
export function SvgCarteEtapes() {
  const bo = (x, titre, l2) => <g><rect x={x} y="8" width="86" height="86" rx="8" fill="white" stroke={C.violet} strokeWidth="2.5"/>{T(x + 43, 28, titre, { size: 13, gras: true, fill: C.violet })}{T(x + 43, 46, l2[0], { size: 12 })}{T(x + 43, 62, l2[1], { size: 12 })}{T(x + 43, 78, l2[2] || '', { size: 12 })}</g>;
  return base(300, 140, 'les trois temps pour obtenir une suspension : mouiller pour remplacer l’air par le liquide, disperser pour casser les agglomérats, stabiliser avec un dispersant', <>
    {bo(4, 'Mouiller', ['mouillant :', 'l’air laisse', 'la place'])}{bo(107, 'Disperser', ['énergie :', 'agglomérats', 'cassés'])}{bo(210, 'Stabiliser', ['dispersant :', 'pas de', 'recollage'])}
    <Fleche x1={92} x2={105} y={51}/><Fleche x1={195} x2={208} y={51}/>
    {T(150, 120, 'Réduire la taille des grains : broyer', { size: 13, gras: true, fill: C.orange })}
  </>, 320);
}
export function SvgCarteChoix() {
  const ligne = (y, a, b) => <g><rect x="6" y={y} width="288" height="40" rx="8" fill="white" stroke={C.gris} strokeWidth="2"/>{T(150, y + 17, a, { size: 13, gras: true })}{T(150, y + 33, b, { size: 12, fill: C.violet })}</g>;
  return base(300, 176, 'choix du dispersant selon le milieu : en milieu aqueux peu salin, un polyélectrolyte à répulsion électrostatique ; en solvant organique, un polymère greffé à répulsion stérique ; en milieu aqueux très ionique, un dispersant électro-stérique', <>
    {ligne(4, 'Eau, peu de sel (peinture au TiO₂)', 'polyacrylate : électrostatique')}
    {ligne(50, 'Solvant organique (encre)', 'polymère greffé : stérique')}
    {ligne(96, 'Eau très ionique (pâte de ciment)', 'polycarboxylate : électro-stérique')}
    {T(150, 158, 'on adapte le dispersant au milieu et au solide', { size: 12.5, fill: C.gris })}
  </>, 320);
}
export function SvgCarteBilanDisp() {
  return base(300, 176, 'bilan : mouiller, disperser, stabiliser ; contrôler la dispersion par la distribution granulométrique ; un dosage optimal de dispersant', <>
    {[['1', 'Mouiller', 'agent mouillant : l’air part', C.bleu], ['2', 'Disperser', 'énergie : les amas cassent', C.orange], ['3', 'Stabiliser', 'dispersant : les grains se repoussent', C.violet]].map(([n, a, b, col], i) => <g key={n}>
      <circle cx="20" cy={26 + i * 44} r="14" fill={col}/>{T(20, 31 + i * 44, n, { size: 14, gras: true, fill: 'white' })}
      {T(44, 22 + i * 44, a, { size: 13.5, gras: true, anchor: 'start', fill: col })}{T(44, 38 + i * 44, b, { size: 13, anchor: 'start' })}</g>)}
    {T(150, 160, 'contrôle : pas d’agglomérats vers 100 µm', { size: 12.5, gras: true, fill: C.vert })}
  </>, 320);
}
