// Schémas et animations de la simulation 222 « Instabilités des émulsions ». Tous en SVG ; textes de 12 à 16 ; largeur 100 % plafonnée.
// Animations en SMIL (agitation des gouttes, molécules qui migrent en Ostwald) désactivées si l'élève demande moins d'animations.
import { useState } from "react";
import * as M from "./instabiliteModele";

const C = { eau: '#dbeafe', huile: '#fde68a', huileTr: '#ca8a04', trait: '#475569', txt: '#0f172a', gris: '#64748b', creme: '#fdf2d8', vert: '#15803d',
  orange: '#b45309', bleu: '#1d4ed8', rouge: '#b91c1c', violet: '#7c3aed', libre: '#f5c542' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 14} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit">{s}</text>;
function base(w, h, label, children, max = 460) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
function useReduit() {
  const [r] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return r;
}
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const SC = 280 / M.CHAMP.W;   // pixels par micromètre dans le champ du microscope

// ---------- le pot à l'œil nu ----------
function Pot({ x, y, w, h, couche, grain, creme }) {
  const hc = couche * h, graines = Array.from({ length: 46 }, (_, k) => ({ x: x + 8 + ((k * 37) % (w - 16)), y: y + 12 + ((k * 53) % (h - 24)) }));
  return <g>
    <path d={`M${x} ${y} L${x} ${y + h - 10} Q${x} ${y + h} ${x + 10} ${y + h} L${x + w - 10} ${y + h} Q${x + w} ${y + h} ${x + w} ${y + h - 10} L${x + w} ${y}`} fill="none" stroke={C.trait} strokeWidth="3"/>
    <path d={`M${x + 1.5} ${y + 8} L${x + 1.5} ${y + h - 10} Q${x + 1.5} ${y + h - 1.5} ${x + 10} ${y + h - 1.5} L${x + w - 10} ${y + h - 1.5} Q${x + w - 1.5} ${y + h - 1.5} ${x + w - 1.5} ${y + h - 10} L${x + w - 1.5} ${y + 8} Z`} fill={C.creme}/>
    {couche > 0.002 && <rect x={x + 1.5} y={y + 8} width={w - 3} height={Math.max(2, hc)} fill={creme ? '#fffdf6' : C.libre} stroke={creme ? '#d6b36a' : '#a16207'} strokeWidth="1" strokeDasharray={creme ? '3 3' : undefined}/>}
    {grain > 0.02 && graines.slice(0, Math.round(grain * 46)).map((g, k) => <circle key={k} cx={g.x} cy={g.y} r={2 + (k % 3) * 0.6} fill="#c79b4a" opacity=".85"/>)}
    <line x1={x - 4} y1={y} x2={x + w + 4} y2={y} stroke={C.trait} strokeWidth="3" strokeLinecap="round"/>
  </g>;
}

// ---------- champ du microscope : gouttes + molécules (Ostwald) ----------
const POP0 = M.population(40, 11);
function Gouttes({ phen, etat, anim }) {
  const reduit = useReduit(), items = etat.items, ost = phen === 'ostwald';
  const evol = d => (ost && d.i != null ? (d.r < POP0[d.i].r * 0.97 ? -1 : d.r > POP0[d.i].r * 1.03 ? 1 : 0) : 0);
  const gros = items.filter(d => evol(d) > 0), petits = items.filter(d => evol(d) < 0);
  const liens = ost && anim ? petits.slice(0, 7).map(p => {
    let best = null, db = 1e9; for (const g of gros) { const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < db) { db = d; best = g; } }
    return best && { p, g: best };
  }).filter(Boolean) : [];
    return <g>
    {liens.map(({ p, g }, k) => { return <line key={`l${k}`} x1={p.x * SC} y1={p.y * SC} x2={g.x * SC} y2={g.y * SC} stroke={C.orange} strokeWidth="1" strokeDasharray="3 4" opacity=".45"/>; })}
    {items.map((d, k) => {
      const floc = phen === 'floculation' && d.amas > 1, fus = d.fusion, e = evol(d);
      const A = 1.2, dx = (Math.cos(k * 2.1) * A).toFixed(1), dy = (Math.sin(k * 1.7) * A).toFixed(1);
      return <circle key={k} cx={d.x * SC} cy={d.y * SC} r={d.r * SC} fill={e < 0 ? '#fef3c7' : C.huile} stroke={floc ? C.violet : fus ? C.orange : e < 0 ? C.bleu : e > 0 ? C.orange : C.huileTr} strokeWidth={floc || fus || e > 0 ? 2.6 : 1.4} strokeDasharray={e < 0 ? '4 3' : undefined}>
        {anim && !reduit && <animateTransform attributeName="transform" type="translate" values={`0 0;${dx} ${dy};${-dx} ${-dy};0 0`} dur={`${(2.4 + (k % 5) * 0.5).toFixed(1)}s`} begin={`-${(k % 7) * 0.4}s`} repeatCount="indefinite"/>}
      </circle>;
    })}
    {liens.flatMap(({ p, g }, k) => [0, 1].map(m => <circle key={`m${k}-${m}`} r="3.6" fill={C.orange} stroke="#fff" strokeWidth="1" cx={p.x * SC} cy={p.y * SC}>
      {anim && !reduit ? <>
        <animate attributeName="cx" values={`${p.x * SC};${g.x * SC}`} dur="2.6s" begin={`-${(k * 0.37 + m * 1.3).toFixed(2)}s`} repeatCount="indefinite"/>
        <animate attributeName="cy" values={`${p.y * SC};${g.y * SC}`} dur="2.6s" begin={`-${(k * 0.37 + m * 1.3).toFixed(2)}s`} repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur="2.6s" begin={`-${(k * 0.37 + m * 1.3).toFixed(2)}s`} repeatCount="indefinite"/>
      </> : <animate attributeName="opacity" values="0.9" dur="1s"/>}
    </circle>))}
  </g>;
}

// ---------- histogramme des diamètres ----------
function Histo({ x, y, w, h, hist, hist0 }) {
  const nb = hist.length, bw = w / nb, hmax = Math.max(10, ...hist, ...hist0), ech = (h - 8) / hmax;
  return <g>
    <line x1={x} y1={y + h} x2={x + w} y2={y + h} stroke={C.trait} strokeWidth="2"/><line x1={x} y1={y} x2={x} y2={y + h} stroke={C.trait} strokeWidth="2"/>
    {hist.map((n, k) => <g key={k}>
      {n > 0 && <rect x={x + k * bw + 3} y={y + h - n * ech} width={bw - 6} height={n * ech} fill="#fbbf24" stroke={C.huileTr} strokeWidth="1"/>}
      <rect x={x + k * bw + 3} y={y + h - hist0[k] * ech} width={bw - 6} height={hist0[k] * ech} fill="none" stroke={C.gris} strokeWidth="1.5" strokeDasharray="4 3"/>
      {T(x + k * bw + bw / 2, y + h + 14, `${BORNES_TXT[k]}`, { size: 11.5 })}
    </g>)}
    {T(x + w / 2, y + h + 31, 'diamètre des gouttes (µm)', { size: 12.5, fill: C.gris })}
    <text transform={`translate(${x - 8} ${y + h / 2}) rotate(-90)`} fontSize="12" fill={C.gris} textAnchor="middle" fontFamily="inherit">nombre</text>
  </g>;
}
const BORNES_TXT = M.BORNES.slice(0, -1).map((b, k) => `${b}–${M.BORNES[k + 1]}`);

// ---------- vue d'ensemble : pot + microscope + histogramme ----------
export function SvgVieillissement({ phen, etat, t, hist0, N0, r0, anim = true, avecHisto = true }) {
  const asp = M.aspectMacro(phen, etat, N0, r0), hist = M.histogramme(etat.items);
  const unite = phen === 'floculation' ? 'amas' : 'gouttes';
  return base(440, avecHisto ? 392 : 262, `vue d’une émulsion qui vieillit (${M.NOMS[phen]}) : à gauche le pot à l’œil nu, à droite le champ du microscope, en dessous la répartition des tailles de gouttes ; après ${Math.round(t)} jours : ${etat.N} ${unite}, rayon moyen ${fr(etat.rc, 1)} micromètres`, <>
    {T(66, 22, 'À l’œil nu', { size: 15, gras: true })}{T(290, 22, 'Au microscope', { size: 15, gras: true })}
    <Pot x={16} y={64} w={100} h={150} couche={asp.couche} grain={asp.grain} creme={phen === 'ostwald'}/>
    {asp.couche > 0.01 && phen === 'coalescence' && T(66, 236, 'huile libre', { size: 12.5, fill: '#a16207', gras: true })}
    {asp.couche > 0.01 && phen === 'ostwald' && T(66, 236, 'crème plus grossière', { size: 12, fill: C.gris })}
    {asp.grain > 0.05 && T(66, 236, 'granuleux', { size: 12.5, fill: C.gris, gras: true })}
    <circle cx="96" cy="160" r="14" fill="none" stroke={C.orange} strokeWidth="2" strokeDasharray="4 3"/>
    <line x1="109" y1="152" x2="150" y2="34" stroke={C.orange} strokeWidth="1.5" strokeDasharray="4 3"/>
    <line x1="108" y1="170" x2="150" y2="244" stroke={C.orange} strokeWidth="1.5" strokeDasharray="4 3"/>
    <g transform="translate(150 34)">
      <clipPath id="cp-vieil"><rect x="0" y="0" width="280" height={M.CHAMP.H * SC} rx="10"/></clipPath>
      <g clipPath="url(#cp-vieil)"><rect width="280" height={M.CHAMP.H * SC} fill={C.eau}/><Gouttes phen={phen} etat={etat} anim={anim}/></g>
      <rect width="280" height={M.CHAMP.H * SC} rx="10" fill="none" stroke={C.trait} strokeWidth="2"/>
    </g>
    {phen === 'ostwald' && <g>
      <circle cx="162" cy="253" r="5" fill="#fef3c7" stroke={C.bleu} strokeWidth="1.6" strokeDasharray="3 2"/>{T(171, 257, 'rétrécit', { size: 12, anchor: 'start' })}
      <circle cx="232" cy="253" r="5" fill={C.huile} stroke={C.orange} strokeWidth="2.4"/>{T(241, 257, 'grossit', { size: 12, anchor: 'start' })}
      <circle cx="297" cy="253" r="3.6" fill={C.orange} stroke="#fff"/>{T(305, 257, 'huile qui diffuse', { size: 12, anchor: 'start' })}
    </g>}
    {avecHisto && <>
      <Histo x={46} y={272} w={380} h={60} hist={hist} hist0={hist0}/>
      {T(220, 386, `t = ${fr(t, 0)} jours · ${etat.N} ${unite} · rayon moyen ${fr(etat.rc, 1)} µm`, { size: 13.5, gras: true })}
    </>}
    {!avecHisto && T(290, 256, `t = ${fr(t, 0)} jours · ${etat.N} ${unite}`, { size: 13.5, gras: true })}
  </>, 440);
}

// ---------- crémage / sédimentation dans un tube ----------
export function SvgCremage({ C: cr, t, nom = 'crémage' }) {
  const TH = 200, X0 = 74, W = 118, Y0 = 36, NC = 10, PITCH = 9, haut = cr.monte;
  const pas = 5 / TH, rp = g => Math.min(6.5, 2.4 + g.r * 0.75);
  const pos = cr.gouttes.map(g => ({ g, p: M.positionCremage(cr, g, t, pas) }));
  const arrivees = pos.filter(o => o.p.arrive).sort((a, b) => a.g.ta - b.g.ta), mobiles = pos.filter(o => !o.p.arrive);
  const lignes = Math.ceil(arrivees.length / NC), hc = arrivees.length ? lignes * PITCH + 6 : 0;
  const yCouche = haut ? Y0 : Y0 + TH - hc;
  const place = (a, k) => { const col = k % NC, row = Math.floor(k / NC); return { x: X0 + 9 + col * (W - 18) / (NC - 1) + (row % 2 ? 4 : 0) - 2, y: haut ? Y0 + 7 + row * PITCH : Y0 + TH - 7 - row * PITCH, r: rp(a.g) }; };
  const pct = Math.round(M.fractionArrivee(cr, t) * 100), vit = Math.abs(cr.vMoy);
  return base(340, 290, `tube d’émulsion après ${fr(t, 1)} jours : ${nom}, ${pct} % des gouttes ont atteint la couche ${haut ? 'de crème en haut' : 'de sédiment en bas'}`, <>
    <rect x={X0} y={Y0} width={W} height={TH} rx="6" fill="#eaf3ff"/>
    {hc > 0 && <rect x={X0} y={yCouche} width={W} height={hc} fill="#fffaf0" stroke="#d6b36a" strokeWidth="1.5" strokeDasharray="5 3"/>}
    {mobiles.map(({ g, p }, k) => { const y = Y0 + TH - p.y * TH, x = X0 + 8 + g.x * (W - 16), r = rp(g), sens = haut ? 1 : -1;
      return <g key={k}><line x1={x} y1={y + sens * (r + 1)} x2={x} y2={y + sens * (r + 8)} stroke={C.violet} strokeWidth="1.5" strokeLinecap="round" opacity=".5"/><circle cx={x} cy={y} r={r} fill={C.huile} stroke={C.huileTr} strokeWidth="1.3"/></g>; })}
    {arrivees.map((a, k) => { const q = place(a, k); return <circle key={`a${k}`} cx={q.x} cy={q.y} r={q.r} fill={C.huile} stroke={C.huileTr} strokeWidth="1.3"/>; })}
    <path d={`M${X0} ${Y0} L${X0} ${Y0 + TH + 4} Q${X0} ${Y0 + TH + 12} ${X0 + 8} ${Y0 + TH + 12} L${X0 + W - 8} ${Y0 + TH + 12} Q${X0 + W} ${Y0 + TH + 12} ${X0 + W} ${Y0 + TH + 4} L${X0 + W} ${Y0}`} fill="none" stroke={C.trait} strokeWidth="3"/>
    <line x1={X0 - 4} y1={Y0} x2={X0 + W + 4} y2={Y0} stroke={C.trait} strokeWidth="3" strokeLinecap="round"/>
    {[0, 0.25, 0.5, 0.75, 1].map(f => <g key={f}><line x1={X0 - 16} y1={Y0 + TH - f * TH} x2={X0 - 8} y2={Y0 + TH - f * TH} stroke={C.trait}/>{T(X0 - 20, Y0 + TH - f * TH + 4, fr(f * cr.hCm, f * cr.hCm % 1 ? 1 : 0), { size: 12, anchor: 'end' })}</g>)}
    {T(X0 - 20, Y0 - 12, 'cm', { size: 12, anchor: 'end', fill: C.gris })}
    {/* flèche du mouvement et vitesse */}
    <g>{haut ? <><line x1="226" y1={Y0 + TH - 24} x2="226" y2={Y0 + 40} stroke={C.violet} strokeWidth="4"/><polygon points={`226,${Y0 + 28} 218,${Y0 + 44} 234,${Y0 + 44}`} fill={C.violet}/></>
      : <><line x1="226" y1={Y0 + 24} x2="226" y2={Y0 + TH - 40} stroke={C.violet} strokeWidth="4"/><polygon points={`226,${Y0 + TH - 28} 218,${Y0 + TH - 44} 234,${Y0 + TH - 44}`} fill={C.violet}/></>}
      {T(244, Y0 + TH / 2 - 14, 'les gouttes', { size: 12.5, fill: C.violet, gras: true, anchor: 'start' })}{T(244, Y0 + TH / 2 + 2, haut ? 'montent' : 'descendent', { size: 12.5, fill: C.violet, gras: true, anchor: 'start' })}
      {T(244, Y0 + TH / 2 + 22, `≈ ${fr(vit, 1)} cm/jour`, { size: 12, fill: C.gris, anchor: 'start' })}</g>
    {hc > 0 && <g>
      <line x1={X0 + W + 10} y1={yCouche} x2={X0 + W + 10} y2={yCouche + hc} stroke={C.orange} strokeWidth="2"/>
      <line x1={X0 + W + 6} y1={yCouche} x2={X0 + W + 14} y2={yCouche} stroke={C.orange} strokeWidth="2"/><line x1={X0 + W + 6} y1={yCouche + hc} x2={X0 + W + 14} y2={yCouche + hc} stroke={C.orange} strokeWidth="2"/>
      {T(X0 + W + 20, yCouche + hc / 2 + 4, haut ? 'crème' : 'sédiment', { size: 12.5, fill: C.orange, gras: true, anchor: 'start' })}
    </g>}
    {T(X0 + W / 2, Y0 + TH + 28, haut ? 'phase continue (sérum) en dessous' : 'phase continue au-dessus', { size: 12, fill: C.gris })}
    {T(170, 284, `t = ${fr(t, 1)} jours · ${pct} % des gouttes arrivées`, { size: 13.5, gras: true })}
  </>, 360);
}

// ---------- pourquoi une émulsion est instable : l'aire de l'interface ----------
export function SvgAire({ anim = true }) {
  const reduit = useReduit(), D = 6, pts = [[-30, -30], [0, -30], [30, -30], [-45, 0], [-15, 0], [15, 0], [45, 0], [0, 30]];   // 8 petites gouttes (disposition en amas)
  const cx = 75, cy = 100;
  return base(300, 230, 'huit petites gouttes de même volume total qu’une grosse goutte : l’aire d’interface est deux fois plus grande ; les petites gouttes fusionnent en une seule', <>
    {T(75, 20, '8 petites gouttes', { size: 14, gras: true })}{T(225, 20, '1 grosse goutte', { size: 14, gras: true })}
    {pts.map(([dx, dy], k) => <circle key={k} cx={cx + dx} cy={cy + dy - 8} r="13" fill={C.huile} stroke={C.huileTr} strokeWidth="2">
      {anim && !reduit && <>
        <animate attributeName="cx" values={`${cx + dx};${cx + dx};${225};${225};${cx + dx}`} keyTimes="0;0.25;0.55;0.8;1" dur={`${D}s`} repeatCount="indefinite"/>
        <animate attributeName="cy" values={`${cy + dy - 8};${cy + dy - 8};${100};${100};${cy + dy - 8}`} keyTimes="0;0.25;0.55;0.8;1" dur={`${D}s`} repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;1;1;0;0;1" keyTimes="0;0.25;0.55;0.6;0.9;1" dur={`${D}s`} repeatCount="indefinite"/>
      </>}
    </circle>)}
    <circle cx="225" cy="100" r="26" fill={C.huile} stroke={C.huileTr} strokeWidth="2.5" opacity={anim && !reduit ? 0 : 1}>
      {anim && !reduit && <animate attributeName="opacity" values="0;0;0;1;1;0" keyTimes="0;0.5;0.55;0.62;0.9;1" dur={`${D}s`} repeatCount="indefinite"/>}
    </circle>
    {T(75, 170, 'aire d’interface : 2 A', { size: 13.5, gras: true, fill: C.rouge })}{T(225, 170, 'aire d’interface : A', { size: 13.5, gras: true, fill: C.vert })}
    {T(150, 196, 'même volume d’huile', { size: 13, fill: C.gris })}
    {T(150, 216, 'moins d’interface : le système gagne en stabilité', { size: 12.5, gras: true })}
  </>, 400);
}

// ======================= cartes « À retenir » =======================
export function SvgCarteStokes() {
  const g = (x, y, r) => <circle cx={x} cy={y} r={r} fill="#fbbf24" stroke={C.huileTr} strokeWidth="1.2"/>;
  return base(300, 250, 'loi de Stokes : la vitesse de crémage augmente avec le carré du rayon des gouttes et avec la différence de masse volumique, et diminue quand la viscosité de la phase continue augmente', <>
    {T(150, 16, 'Crémage : de quoi dépend la vitesse ?', { size: 14, gras: true })}
    <rect x="16" y="30" width="64" height="150" rx="6" fill="#eff6ff" stroke={C.trait} strokeWidth="2.5"/>
    <rect x="16" y="30" width="64" height="40" fill="#fffdf6" stroke="#d6b36a" strokeDasharray="4 3"/>
    {[[30, 44], [50, 40], [66, 50], [38, 60], [58, 62], [30, 100], [52, 120], [66, 90], [36, 140], [60, 150]].map(([x, y], k) => <g key={k}>{g(x, y, 3.4)}</g>)}
    <line x1="48" y1="170" x2="48" y2="96" stroke={C.violet} strokeWidth="3.5" strokeDasharray="1 0"/><polygon points="48,86 41,100 55,100" fill={C.violet}/>
    {T(48, 198, 'v', { size: 15, gras: true, fill: C.violet })}
    {T(190, 56, 'rayon r des gouttes', { size: 13, gras: true })}{T(190, 74, 'r ÷ 2  →  v ÷ 4', { size: 13.5, fill: C.violet, gras: true })}
    {T(190, 110, 'viscosité η de la phase continue', { size: 12.5, gras: true })}{T(190, 128, 'η × 10  →  v ÷ 10', { size: 13.5, fill: C.violet, gras: true })}
    {T(190, 164, 'Δρ = ρ continue − ρ gouttes', { size: 12.5, gras: true })}{T(190, 182, 'Δρ = 0  →  pas de crémage', { size: 13.5, fill: C.violet, gras: true })}
    <rect x="10" y="212" width="280" height="30" rx="8" fill="#fff7ed" stroke={C.orange} strokeWidth="1.5"/>{T(150, 232, 'petites gouttes + phase continue épaisse', { size: 13, gras: true, fill: C.orange })}
  </>, 340);
}
export function SvgCarteFlocCoal() {
  const g = (x, y, r, st = C.huileTr, sw = 1.3) => <circle cx={x} cy={y} r={r} fill={C.huile} stroke={st} strokeWidth={sw}/>;
  return base(300, 262, 'floculation : les gouttes s’accolent sans fusionner, l’agitation les sépare ; coalescence : les gouttes fusionnent en une plus grosse, irréversible', <>
    {T(75, 16, 'Floculation', { size: 14, gras: true, fill: C.violet })}{T(225, 16, 'Coalescence', { size: 14, gras: true, fill: C.orange })}
    <rect x="8" y="26" width="134" height="68" rx="8" fill={C.eau} stroke={C.trait} strokeWidth="2"/><rect x="158" y="26" width="134" height="68" rx="8" fill={C.eau} stroke={C.trait} strokeWidth="2"/>
    {[[28, 46], [78, 44], [112, 70], [44, 76]].map(([x, y], k) => <g key={k}>{g(x, y, 10)}</g>)}
    {[[178, 46], [228, 44], [262, 70], [194, 76]].map(([x, y], k) => <g key={k}>{g(x, y, 10)}</g>)}
    <text x="75" y="112" fontSize="18" textAnchor="middle" fill={C.gris} fontFamily="inherit">↓</text><text x="225" y="112" fontSize="18" textAnchor="middle" fill={C.gris} fontFamily="inherit">↓</text>
    <rect x="8" y="120" width="134" height="68" rx="8" fill={C.eau} stroke={C.trait} strokeWidth="2"/><rect x="158" y="120" width="134" height="68" rx="8" fill={C.eau} stroke={C.trait} strokeWidth="2"/>
    {[[52, 152], [72, 152], [62, 168], [112, 160]].map(([x, y], k) => <g key={k}>{g(x, y, 10, C.violet, 2.4)}</g>)}
    {g(202, 156, 17, C.orange, 2.4)}{g(244, 158, 11, C.huileTr)}{g(268, 148, 9, C.huileTr)}
    {T(75, 204, 'amas de gouttes intactes', { size: 12.5 })}{T(225, 204, 'gouttes plus grosses', { size: 12.5 })}
    <rect x="12" y="214" width="126" height="34" rx="8" fill="#f5f3ff" stroke={C.violet} strokeWidth="1.5"/>{T(75, 235, 'réversible : on agite', { size: 13, gras: true, fill: C.violet })}
    <rect x="162" y="214" width="126" height="34" rx="8" fill="#fff7ed" stroke={C.orange} strokeWidth="1.5"/>{T(225, 235, 'irréversible', { size: 13, gras: true, fill: C.orange })}
  </>, 340);
}
export function SvgCarteOstwald() {
  const g = (x, y, r) => <circle cx={x} cy={y} r={r} fill={C.huile} stroke={C.huileTr} strokeWidth="1.5"/>;
  return base(300, 252, 'mûrissement d’Ostwald : l’huile des petites gouttes diffuse à travers la phase continue vers les grosses ; les petites disparaissent, les grosses grossissent, sans contact entre gouttes', <>
    {T(150, 16, 'Mûrissement d’Ostwald (hors référentiel)', { size: 13.5, gras: true })}
    <rect x="8" y="26" width="284" height="84" rx="8" fill={C.eau} stroke={C.trait} strokeWidth="2"/>
    {g(60, 60, 9)}{g(100, 84, 24)}{g(210, 56, 26)}{g(258, 88, 8)}{g(160, 76, 7)}
    {[[72, 66], [82, 72], [92, 79]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="2.6" fill={C.orange}/>)}
    {[[168, 70], [180, 66], [190, 62]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="2.6" fill={C.orange}/>)}
    <text x="150" y="132" fontSize="18" textAnchor="middle" fill={C.gris} fontFamily="inherit">↓ dans le temps</text>
    <rect x="8" y="142" width="284" height="56" rx="8" fill={C.eau} stroke={C.trait} strokeWidth="2"/>
    {g(100, 170, 26)}{g(210, 168, 28)}
    {T(150, 214, 'les petites ont disparu, les grosses ont grossi', { size: 12.5 })}
    {T(150, 233, 'gouttes sans jamais se toucher : huile qui diffuse', { size: 12.5, fill: C.orange, gras: true })}
  </>, 340);
}
export function SvgCarteBilan() {
  const L = [
    ['Crémage', 'réversible', 'diminuer r, épaissir', C.vert],
    ['Floculation', 'réversible', 'répulsion entre gouttes', C.violet],
    ['Coalescence', 'irréversible', 'mieux couvrir l’interface', C.orange],
    ['Ostwald', 'irréversible', 'huile insoluble, tailles serrées', C.bleu],
  ];
  return base(300, 270, 'les quatre instabilités : crémage et floculation sont réversibles, coalescence et mûrissement d’Ostwald sont irréversibles, avec le remède de chacune', <>
    {L.map(([n, r, remede, col], k) => <g key={n}>
      <rect x="8" y={8 + k * 64} width="284" height="58" rx="10" fill="white" stroke={col} strokeWidth="2.5"/>
      {T(78, 30 + k * 64, n, { size: 14.5, gras: true, fill: col })}
      <rect x="168" y={14 + k * 64} width="116" height="22" rx="11" fill={r === 'réversible' ? '#ecfdf5' : '#fff7ed'} stroke={r === 'réversible' ? C.vert : C.orange} strokeWidth="1.3"/>
      {T(226, 29.5 + k * 64, r, { size: 12.5, gras: true, fill: r === 'réversible' ? C.vert : C.orange })}
      {T(150, 56 + k * 64, 'remède : ' + remede, { size: 12.5 })}
    </g>)}
  </>, 340);
}
