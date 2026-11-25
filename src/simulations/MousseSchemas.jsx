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
// Les têtes polaires sont PLONGÉES dans l'eau (sous la surface), seules les queues sortent dans l'air.
// Tensio : x, yb = bord de l'eau, haut = true pour la face du haut ; ethox = laureth sulfate (chaîne éthoxylée qui plonge dans l'eau)
function Tensio({ x, yb, haut, ethox, charge, tete = 6, q = 22 }) {
  const dir = haut ? 1 : -1;                              // sens « vers l'eau »
  if (ethox) {
    const pts = [[x, yb]]; for (let k = 1; k <= 4; k++) pts.push([x + (k % 2 ? 3 : -3), yb + dir * 5 * k]);
    const yh = yb + dir * 27;
    return <g>
      <line x1={x} y1={yb - dir * q} x2={x} y2={yb} stroke={C.trait} strokeWidth="2.2" strokeLinecap="round"/>
      <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={C.vert} strokeWidth="2" strokeLinejoin="round"/>
      <line x1={pts[4][0]} y1={pts[4][1]} x2={x} y2={yh} stroke={C.vert} strokeWidth="2"/>
      <circle cx={x} cy={yh} r={tete} fill="#60a5fa" stroke={C.bleu} strokeWidth="1.5"/>
      {charge && <text x={x} y={yh + 3.5} fontSize="10" fontWeight="700" textAnchor="middle" fill="white" fontFamily="inherit">−</text>}
    </g>;
  }
  const yh = yb + dir * 9;                                // tête entièrement sous la surface
  return <g>
    <line x1={x} y1={yh - dir * 5} x2={x} y2={yb - dir * q} stroke={C.trait} strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx={x} cy={yh} r={tete} fill="#60a5fa" stroke={C.bleu} strokeWidth="1.5"/>
    {charge && <text x={x} y={yh + 3.5} fontSize="10" fontWeight="700" textAnchor="middle" fill="white" fontFamily="inherit">−</text>}
  </g>;
}
export function SvgLamelle({ type = 'sds', r = 0, titre = true }) {
  const eth = type === 'sles';
  const pas = eth ? 17 : 27;
  const xs = []; for (let x = 28; x <= 292; x += pas) xs.push(x);
  const nDod = Math.round((r / 0.2) * 7);
  const dod = xs.slice(0, -1).filter((_, i) => i % 2 === 0).slice(0, nDod);
  const yT = 70, yB = 170;
  return base(320, 240, `lamelle de liquide entre deux bulles d’air : l’eau est prise entre deux couches de tensioactif, têtes hydrophiles plongées dans l’eau et queues dans l’air${eth ? ' ; la chaîne éthoxylée du laureth sulfate plonge plus profondément dans l’eau' : ''}${r > 0 ? ' ; du dodécanol s’intercale entre les molécules' : ''}`, <>
    <rect x="14" y={yT} width="292" height={yB - yT} fill={C.eau} stroke="none"/>
    {T(8, 14, 'air (bulle)', { size: 12, fill: C.gris, anchor: 'start' })}{T(8, 234, 'air (bulle voisine)', { size: 12, fill: C.gris, anchor: 'start' })}
    {xs.map(x => <Tensio key={`h${x}`} x={x} yb={yT} haut ethox={eth} charge tete={eth ? 6 : 6}/>)}
    {xs.map(x => <Tensio key={`b${x}`} x={x} yb={yB} haut={false} ethox={eth} charge tete={eth ? 6 : 6}/>)}
    {dod.map(x => { const xm = x + pas / 2; return <g key={`d${x}`}>
      <line x1={xm} y1={yT + 3} x2={xm} y2={yT - 22} stroke={C.orange} strokeWidth="2.6" strokeLinecap="round"/><circle cx={xm} cy={yT + 3} r="2.8" fill={C.orange}/>
      <line x1={xm} y1={yB - 3} x2={xm} y2={yB + 22} stroke={C.orange} strokeWidth="2.6" strokeLinecap="round"/><circle cx={xm} cy={yB - 3} r="2.8" fill={C.orange}/></g>; })}
    {T(160, 124, 'eau', { size: 13, gras: true, fill: C.bleu })}
    {titre && T(160, 36, eth ? 'laureth sulfate : la chaîne éthoxylée plonge dans l’eau' : 'SDS : têtes chargées plongées dans l’eau', { size: 12.5, gras: true, fill: eth ? C.vert : C.rouge, halo: true })}
  </>, 400);
}

// ---------- mécanisme de l'antimousse en 3 temps ----------
export function SvgAntimousse({ d = 0.2 }) {
  const n = d <= 0.03 ? 0 : 1;                           // un seul exemple de gouttelette : le mécanisme reste lisible
  const dx = n === 1 ? [160] : [];
  const xs = []; for (let x = 22; x <= 300; x += 18) xs.push(x);
  const PITCH = 100, E = 46;
  const gw = 46;
  const panneau = (k, legende, contenu) => {
    const oy = 4 + k * PITCH, yT = oy + 30, yB = yT + E, yc = yT + E / 2;
    return <g key={k}>
      {T(8, oy + 11, legende, { size: 12.5, gras: true, anchor: 'start' })}
      {contenu({ oy, yT, yB, yc })}
    </g>;
  };
  const molecules = (yT, yB, ok) => xs.filter(ok).map(x => <g key={x}><Tensio x={x} yb={yT} haut charge tete={5} q={14}/><Tensio x={x} yb={yB} haut={false} charge tete={5} q={14}/></g>);
  const gout = (x, y, rx, ry, k) => <ellipse key={k} cx={x} cy={y} rx={rx} ry={ry} fill={C.orange} opacity="0.92" stroke="#7c2d12" strokeWidth="1.8"/>;
  return base(320, 4 + 3 * PITCH + 26, n === 0
    ? 'lamelle intacte : sans antimousse, l’eau reste prise entre deux couches de tensioactif'
    : 'mécanisme de l’antimousse en trois temps : une gouttelette très hydrophobe entre dans la lamelle, touche les deux surfaces et fait un pont, puis l’eau se retire et les deux bulles fusionnent', <>
    {panneau(0, n === 0 ? '① Sans antimousse : la lamelle reste intacte' : '① La gouttelette entre dans la lamelle', ({ yT, yB, yc }) => <g>
      <rect x="14" y={yT} width="292" height={E} fill={C.eau}/>
      {molecules(yT, yB, x => dx.every(c => Math.abs(x - c) > 16))}
      {dx.map((c, i) => gout(c, yc, 9, 9, i))}
      {dx.length > 0 && T(dx[0] + 16, yc + 4, 'antimousse', { size: 12.5, gras: true, anchor: 'start', fill: C.orange, halo: true })}
      {n === 0 && T(160, yc + 4, 'eau', { size: 13, gras: true, fill: C.bleu })}
    </g>)}
    {n === 0 ? <g>{T(160, 4 + PITCH + 54, 'Réglez une dose d’antimousse (curseur)', { size: 12.5, fill: C.gris })}{T(160, 4 + PITCH + 72, 'pour voir comment il détruit la lamelle.', { size: 12.5, fill: C.gris })}</g> : <>
      {panneau(1, '② Il touche les deux surfaces : un pont', ({ yT, yB, yc }) => <g>
        <rect x="14" y={yT} width="292" height={E} fill={C.eau}/>
        {molecules(yT, yB, x => dx.every(c => Math.abs(x - c) > 24))}
        {dx.map((c, i) => gout(c, yc, 15, E / 2 + 9, i))}
      </g>)}
      {panneau(2, '③ L’eau se retire : la lamelle éclate', ({ yT, yB, yc }) => {
        const bords = []; let x0 = 14;
        dx.forEach(c => { bords.push([x0, c - gw]); x0 = c + gw; }); bords.push([x0, 306]);
        return <g>
          {bords.map(([a, b], i) => <rect key={i} x={a} y={yT} width={Math.max(0, b - a)} height={E} fill={C.eau}/>)}
          {molecules(yT, yB, x => dx.every(c => Math.abs(x - c) > gw + 4))}
          {dx.map((c, i) => <g key={i}>
            {gout(c - gw - 7, yc, 7, 14, 'g')}
            <line x1={c - gw - 18} y1={yc} x2={c - gw - 32} y2={yc} stroke={C.trait} strokeWidth="2.4"/><polygon points={`${c - gw - 38},${yc} ${c - gw - 30},${yc - 5} ${c - gw - 30},${yc + 5}`} fill={C.trait}/>
            <line x1={c + gw + 5} y1={yc} x2={c + gw + 20} y2={yc} stroke={C.trait} strokeWidth="2.4"/><polygon points={`${c + gw + 26},${yc} ${c + gw + 18},${yc - 5} ${c + gw + 18},${yc + 5}`} fill={C.trait}/>
          </g>)}
          {<g>{T(dx[0], yc - 2, 'les 2 bulles', { size: 12, fill: C.gris })}{T(dx[0], yc + 12, 'fusionnent', { size: 12, fill: C.gris })}</g>}
        </g>;
      })}
    </>}
    <circle cx="20" cy={4 + 3 * PITCH + 12} r="6" fill={C.orange} stroke="#7c2d12"/>{T(32, 4 + 3 * PITCH + 16, 'gouttelette d’antimousse (très hydrophobe)', { size: 12.5, anchor: 'start', fill: C.gris })}
  </>, 380);
}

// ---------- SDS et laureth sulfate : formules, puis couche à l'interface ----------
const pt = (i, x0, dx, y0, amp) => [x0 + i * dx, y0 + (i % 2 ? amp : -amp)];
const Atome = ({ x, y, s, fill = C.txt, sup }) => <text x={x} y={y + 4.5} fontSize="13" fontWeight="700" textAnchor="middle" fill={fill} fontFamily="inherit" stroke="#f8fafc" strokeWidth="3" paintOrder="stroke">{s}{sup && <tspan dy="-5" fontSize="10">{sup}</tspan>}</text>;
const Double = ({ x, y, dy }) => { const o = dy > 0 ? 1 : -1; return <g stroke={C.trait} strokeWidth="1.6"><line x1={x - 1.8} y1={y} x2={x - 1.8} y2={y + dy - o * 6}/><line x1={x + 1.8} y1={y} x2={x + 1.8} y2={y + dy - o * 6}/></g>; };
function GroupeSulfate({ xS, yS }) {
  return <g>
    <Double x={xS} y={yS} dy={-17}/><Atome x={xS} y={yS - 22} s="O"/>
    <Double x={xS} y={yS} dy={17}/><Atome x={xS} y={yS + 22} s="O"/>
    <line x1={xS} y1={yS} x2={xS + 15} y2={yS} stroke={C.trait} strokeWidth="1.8"/><Atome x={xS + 20} y={yS} s="O" sup="−" fill={C.rouge}/>
    <Atome x={xS} y={yS} s="S"/>
    <Atome x={xS + 48} y={yS} s="Na" sup="+" fill={C.gris}/>
  </g>;
}
export function SvgFormulesTensio() {
  const x0 = 10, dx = 11.5, amp = 5.5;
  const yA = 48, yB = 152;
  const chA = Array.from({ length: 13 }, (_, i) => pt(i, x0, dx, yA, amp));        // 0..11 = C, 12 = O
  const sA = pt(13, x0, dx, yA, amp);
  const chB = Array.from({ length: 16 }, (_, i) => pt(i, x0, dx, yB, amp));        // 0..11 C, 12 O, 13-14 C, 15 O
  const sB = [chB[15][0] + 24, yB - amp];
  const poly = (pts, a, b) => pts.slice(a, b).map(p => p.join(',')).join(' ');
  const xl = chB[12][0] + 7, xr = chB[15][0] + 7;
  const crochet = (x, sens) => <path d={`M${x - sens * 4},${yB - 16} H${x} V${yB + 16} H${x - sens * 4}`} fill="none" stroke={C.vert} strokeWidth="2"/>;
  return base(320, 214, 'formules topologiques du SDS (chaîne de 12 carbones, oxygène, groupe sulfate chargé, ion sodium) et du laureth sulfate (même chaîne, puis chaîne éthoxylée hydrophile répétée n fois, groupe sulfate chargé, ion sodium)', <>
    {T(8, 14, 'SDS (dodécylsulfate de sodium)', { size: 13, gras: true, anchor: 'start', fill: C.rouge })}
    <polyline points={poly(chA, 0, 13)} fill="none" stroke={C.trait} strokeWidth="1.8" strokeLinejoin="round"/>
    <line x1={chA[12][0]} y1={chA[12][1]} x2={sA[0]} y2={sA[1]} stroke={C.trait} strokeWidth="1.8"/>
    <Atome x={chA[12][0]} y={chA[12][1]} s="O"/><GroupeSulfate xS={sA[0]} yS={sA[1]}/>
    {T(8, 98, 'queue hydrophobe (12 C)', { size: 12, fill: C.gris, anchor: 'start' })}{T(168, 98, 'tête chargée', { size: 12, fill: C.bleu, anchor: 'start' })}

    {T(8, 118, 'Laureth sulfate (SLES)', { size: 13, gras: true, anchor: 'start', fill: C.vert })}
    <polyline points={poly(chB, 0, 13)} fill="none" stroke={C.trait} strokeWidth="1.8" strokeLinejoin="round"/>
    <polyline points={poly(chB, 12, 16)} fill="none" stroke={C.vert} strokeWidth="2.2" strokeLinejoin="round"/>
    <line x1={chB[15][0]} y1={chB[15][1]} x2={sB[0]} y2={sB[1]} stroke={C.trait} strokeWidth="1.8"/>
    <Atome x={chB[12][0]} y={chB[12][1]} s="O"/><Atome x={chB[15][0]} y={chB[15][1]} s="O"/>
    {crochet(xl, -1)}{crochet(xr, 1)}
    <text x={xr + 3} y={yB + 24} fontSize="12" fontWeight="700" fontStyle="italic" fill={C.vert} fontFamily="inherit">n</text>
    <GroupeSulfate xS={sB[0]} yS={sB[1]}/>
    {T(8, 192, 'queue hydrophobe (12 C)', { size: 12, fill: C.gris, anchor: 'start' })}{T(206, 192, 'tête chargée', { size: 12, fill: C.bleu, anchor: 'start' })}
    {T(100, 208, 'chaîne éthoxylée (n ≈ 3), hydrophile', { size: 12, fill: C.vert, anchor: 'start' })}
  </>, 400);
}
export function SvgComparaisonLamelles() {
  const yT = 46, yBas = 136;
  const colonne = (xc, eth) => {
    const pas = eth ? 14.5 : 24, xs = []; for (let x = xc + 11; x <= xc + 140; x += pas) xs.push(x);
    return <g>
      <rect x={xc} y={yT} width="148" height={yBas - yT} fill={C.eau}/>
      {xs.map(x => <g key={x}><Tensio x={x} yb={yT} haut ethox={eth} charge tete={5.5}/><Tensio x={x} yb={yBas} haut={false} ethox={eth} charge tete={5.5}/></g>)}
      {T(xc + 74, yT + 49, 'eau', { size: 13, gras: true, fill: C.bleu })}
      {T(xc + 74, 12, eth ? 'laureth sulfate' : 'SDS', { size: 13.5, gras: true, fill: eth ? C.vert : C.rouge })}
      {T(xc + 74, 178, eth ? 'plus de molécules par µm²' : 'moins de molécules par µm²', { size: 12, fill: C.gris })}
    </g>;
  };
  return base(320, 186, 'couche de tensioactif dans une lamelle : les têtes du SDS sont plongées dans l’eau et assez espacées ; la chaîne éthoxylée du laureth sulfate plonge plus profondément dans l’eau et les molécules se rangent de façon plus serrée', <>
    {colonne(4, false)}{colonne(168, true)}
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
  return base(300, 166, 'une mousse : une lamelle d’eau entre deux couches de tensioactif, têtes plongées dans l’eau, queues dans l’air', <>
    <rect x="10" y="54" width="280" height="56" fill={C.eau}/>
    {xs.map(x => <g key={x}><circle cx={x} cy="63" r="6" fill="#60a5fa" stroke={C.bleu}/><line x1={x} y1="58" x2={x} y2="32" stroke={C.trait} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx={x} cy="101" r="6" fill="#60a5fa" stroke={C.bleu}/><line x1={x} y1="106" x2={x} y2="132" stroke={C.trait} strokeWidth="2.2" strokeLinecap="round"/></g>)}
    {T(150, 86, 'eau (lamelle)', { size: 13, gras: true, fill: C.bleu })}{T(150, 18, 'air', { size: 12.5, fill: C.gris })}{T(150, 154, 'air', { size: 12.5, fill: C.gris })}
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
