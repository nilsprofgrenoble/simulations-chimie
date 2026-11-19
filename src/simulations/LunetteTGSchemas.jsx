// ====================================================
//  Schémas de la simulation 171 (lunette afocale, niveau TG) : scène (tracé paraxial exact, déformé verticalement) et cartes « À retenir ».
//  viewBox 400 : textes de 16 (indices de 13), aucun texte hors cadre. Public daltonien : jamais la couleur seule
//  (faisceau de l'axe en tirets, faisceau hors axe en trait plein, image intermédiaire en trait épais orange, foyers = cercle / carré, étiquettes écrites).
// ====================================================
import { useId, createContext, useContext } from 'react';
import * as M from './lunetteTGModele';

const COL = { rayon: '#0072b2', axe: '#475569', lent: '#0f172a', inter: '#b45309', foyer: '#7c3aed', ok: '#15803d', ko: '#b91c1c', gris: '#64748b', txt: '#0f172a', clair: '#cbd5e1' };
const W = 400, HT = 252, Y0 = 118;

// texte avec halo blanc ; parts = [['F′', ''], ['obj', 'i'], [' = F', ''], ['oc', 'i']] (i = indice, petit texte séparé, jamais de tspan)
const cw = c => ('iIl′\'.,:;|!1 ₁'.includes(c) ? 0.32 : 'ftrj'.includes(c) ? 0.42 : 'mwMW'.includes(c) ? 0.85 : c === c.toUpperCase() && c !== c.toLowerCase() ? 0.68 : 0.58);
const lw = (t, s) => [...String(t)].reduce((a, c) => a + cw(c), 0) * s;
const TailleTexte = createContext(16);     // taille des textes de la scène (20 dans la variante « carte », affichée en petit)
function Et({ x, y, parts, c = COL.txt, s: sProp, ancre = 'start', w = 700, halo = true, ind = 1 }) {
  const sCtx = useContext(TailleTexte), s = sProp ?? sCtx;
  const items = (typeof parts === 'string' ? [[parts, '']] : parts).map(([t, k]) => ({ t, k, s: k === 'i' ? s * ind : s }));
  const tot = items.reduce((acc, it) => acc + lw(it.t, it.s), 0);
  const x0 = ancre === 'end' ? x - tot : ancre === 'middle' ? x - tot / 2 : x;
  const ha = halo ? { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' } : {};
  return (
    <g>{items.map((it, i) => <text key={i} x={x0 + items.slice(0, i).reduce((acc, jt) => acc + lw(jt.t, jt.s), 0)} y={it.k === 'i' ? Number(y) + 4 : y} fontSize={it.s} fontWeight={w} fill={c} {...ha}>{it.t}</text>)}</g>);
}
const FOBJ = [['f′', ''], ['obj', 'i']], FOC = [['f′', ''], ['oc', 'i']];

function Lentille({ x, h, c = COL.lent, w = 3.5 }) {
  return (
    <g>
      <line x1={x} y1={Y0 - h} x2={x} y2={Y0 + h} stroke={c} strokeWidth={w}/>
      <polygon points={`${x},${Y0 - h - 9} ${x - 6},${Y0 - h + 4} ${x + 6},${Y0 - h + 4}`} fill={c}/>
      <polygon points={`${x},${Y0 + h + 9} ${x - 6},${Y0 + h - 4} ${x + 6},${Y0 + h - 4}`} fill={c}/>
    </g>);
}

// montre : { axe, incl, ocu, plan, image, foyers (0, 1 ou 2), noms, tri (0, 1, 2), attenue, angles, ref }
export function SceneLunetteTG({ f1 = 400, f2 = 50, d = 450, theta = 0.5, montre = {}, aria, legende, svgId, carte = false }) {
  const { axe = false, incl = false, ocu = false, plan = false, image = false, foyers = 0, noms = true, etiqFoyers = true, tri = 0, attenue = false, angles = 0, ref = false } = montre;
  const clip = 'clip' + useId().replace(/:/g, '');
  const g = M.geometrie(f1, f2, ocu ? d : M.dAfocal(f1, f2), theta);
  const xF = M.X1 + g.F1, xO2 = M.X1 + g.D, Hs = [M.H_OBJ, 0, -M.H_OBJ], xFin = W - M.X1 - 4;
  const afo = ocu && M.afocale(d, f1, f2);
  const P = (x, y) => `${M.X1 + x},${Y0 - y}`;
  const faisceau = (horsAxe, dash) => Hs.map(h => {
    const pts = M.rayon(g, h, horsAxe, xFin, ocu);
    const centre = h === 0, op = attenue && !centre ? 0.3 : 1;
    return <polyline key={`${horsAxe}${h}`} points={pts.map(([x, y]) => P(x, y)).join(' ')} fill="none" stroke={COL.rayon} strokeWidth={centre ? 2.4 : 1.8} strokeDasharray={dash} opacity={op} strokeLinejoin="round"/>;
  });
  const yB1 = -g.S * g.F1;                       // hauteur de B1 (négative : image renversée, sous l'axe)
  const f2lab = ocu && foyers === 2;
  const eFoc = xO2 - g.F2;                        // abscisse du foyer objet de l'oculaire
  return (
    <TailleTexte.Provider value={carte ? 20 : 16}>
    <svg viewBox={`0 0 ${W} ${HT}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: carte ? 320 : 480, height: 'auto', display: 'block', margin: '0 auto' }} data-svg-lunette={svgId || 'scene'}>
      <defs><clipPath id={clip}><rect x="0" y="0" width={W} height={HT}/></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        <line x1="0" y1={Y0} x2={W} y2={Y0} stroke={COL.gris} strokeWidth="1.4" strokeDasharray="7 5"/>
        {plan && <line x1={xF} y1={Y0 - 56} x2={xF} y2={Y0 + 56} stroke={COL.inter} strokeWidth="1.4" strokeDasharray="2 4"/>}
        {tri === 1 && <polygon points={`${M.X1},${Y0} ${xF},${Y0} ${xF},${Y0 - yB1}`} fill={COL.inter} opacity="0.22"/>}
        {tri === 2 && <polygon points={`${xO2},${Y0} ${xF},${Y0} ${xF},${Y0 - yB1}`} fill={COL.inter} opacity="0.3"/>}
        {axe && faisceau(false, '8 5')}
        {incl && faisceau(true, undefined)}
        {ref && afo && (() => { const sl = (g.S * g.F1) / g.F2, xe = W - 4 - xO2; return <g><line x1={xF} y1={Y0 - yB1} x2={xO2 + xe} y2={Y0 - sl * xe} stroke={COL.inter} strokeWidth="2" strokeDasharray="3 3"/></g>; })()}
        <Lentille x={M.X1} h={M.H_OBJ + 10}/>
        {ocu && <Lentille x={xO2} h={M.H_OCU}/>}
        {image && incl && <g>
          <line x1={xF} y1={Y0} x2={xF} y2={Y0 - yB1 - 7} stroke={COL.inter} strokeWidth="3.6"/>
          <polygon points={`${xF},${Y0 - yB1} ${xF - 5},${Y0 - yB1 - 10} ${xF + 5},${Y0 - yB1 - 10}`} fill={COL.inter}/>
        </g>}
        {incl && !image && <circle cx={xF} cy={Y0 - yB1} r="3.6" fill={COL.rayon}/>}
        {foyers >= 1 && <g>
          <circle cx={xF} cy={Y0} r="5" fill="#fff" stroke={COL.foyer} strokeWidth="2.4"/>
          {foyers === 2 && ocu && <rect x={eFoc - 4.5} y={Y0 - 4.5} width="9" height="9" fill="none" stroke={COL.foyer} strokeWidth="2"/>}
        </g>}
        {foyers === 1 && etiqFoyers && <Et x={xF - 12} y={Y0 - 40} parts="F′" c={COL.foyer} ancre="end"/>}
        {f2lab && etiqFoyers && (Math.abs(eFoc - xF) < 14
          ? <Et x={xF - 12} y={Y0 - 40} parts={[['F′', ''], ['obj', 'i'], [' = F', ''], ['oc', 'i']]} c={COL.foyer} ancre="end"/>
          : <g><Et x={Math.min(xF, eFoc) - 12} y={Y0 - 40} parts={[['F′', ''], ['obj', 'i']]} c={COL.foyer} ancre="end"/><Et x={Math.max(xF, eFoc) + 12} y={Y0 - 40} parts={[['F', ''], ['oc', 'i']]} c={COL.foyer} ancre="start"/></g>)}
        {image && incl && (foyers < 2
          ? <g><Et x={xF + 8} y={Y0 - 8} parts="A₁" c={COL.inter}/><Et x={xF + 8} y={Y0 - yB1 + 6} parts="B₁" c={COL.inter}/></g>
          : <Et x={xF - 6} y={Y0 - yB1 + 30} parts="A₁B₁" c={COL.inter} ancre="end"/>)}
        {noms && <Et x={M.X1} y={Y0 - M.H_OBJ - 22} parts="objectif" ancre="middle"/>}
        {noms && ocu && <Et x={xO2} y={Y0 - M.H_OCU - 18} parts="oculaire" ancre="middle"/>}
        {tri === 1 && <Et x={(M.X1 + xF) / 2} y={Y0 - 9} parts={FOBJ} c={COL.inter} ancre="middle"/>}
        {tri === 2 && <Et x={xO2 - 8} y={Y0 + 54} parts={FOC} c={COL.inter} ancre="end"/>}
        {/* angle θ en O1 (entre l'axe et le rayon central) et angle θ′ en O2 (entre l'axe et le rayon issu de B1 passant par O2) */}
        {angles >= 1 && incl && (() => { const r = 70, a = g.S * r; return <g>
          <polygon points={`${M.X1},${Y0} ${M.X1 - r},${Y0} ${M.X1 - r},${Y0 - a}`} fill={COL.foyer} opacity="0.55"/>
          <Et x={M.X1 - 36} y={Y0 - 14} parts="θ" c={COL.foyer} ancre="middle"/></g>; })()}
        {angles >= 2 && incl && afo && (() => { const r = 58, a = (g.S * g.F1 / g.F2) * r; return <g>
          <polygon points={`${xO2},${Y0} ${xO2 + r},${Y0} ${xO2 + r},${Y0 - a}`} fill={COL.foyer} opacity="0.55"/>
          <Et x={xO2 + r - 5} y={Y0 + 20} parts="θ′" c={COL.foyer} ancre="end"/></g>; })()}
      </g>
      {(legende || []).map((l, i, t) => <Et key={i} x={W / 2} y={HT - 8 - 19 * (t.length - 1 - i)} parts={l} c={COL.gris} s={carte ? 18 : 16} ancre="middle" w={600} halo={false}/>)}
    </svg>
    </TailleTexte.Provider>);
}

// ---------- carte : deux triangles, un même côté A₁B₁ (viewBox 320 affiché en petit : textes de 14) ----------
export function SvgTrianglesCarte() {
  const x1 = 16, xF = 236, x2 = 290, y0 = 52, h = 56;                  // f′obj grande, f′oc petite (dessin non à l'échelle), A₁B₁ commun
  const k = 54 / Math.hypot(54, h), kc = h / Math.hypot(54, h);        // direction de O₂B₁
  return (
    <svg viewBox="0 0 320 196" role="img" aria-label="Deux triangles rectangles qui partagent le côté A1B1 : à gauche, de base f′obj, d’angle θ en O1 ; à droite, de base f′oc, d’angle θ′ en O2 ; la base la plus courte donne l’angle le plus grand" style={{ width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '6px auto' }}>
      <line x1="0" y1={y0} x2="320" y2={y0} stroke={COL.gris} strokeWidth="1.4" strokeDasharray="7 5"/>
      <polygon points={`${x1},${y0} ${xF},${y0} ${xF},${y0 + h}`} fill={COL.rayon} opacity="0.12"/>
      <polygon points={`${x2},${y0} ${xF},${y0} ${xF},${y0 + h}`} fill={COL.inter} opacity="0.28"/>
      <line x1={x1} y1={y0} x2={xF} y2={y0 + h} stroke={COL.rayon} strokeWidth="2.4"/>
      <line x1={x2} y1={y0} x2={xF} y2={y0 + h} stroke={COL.inter} strokeWidth="2.4" strokeDasharray="4 3"/>
      <line x1={xF} y1={y0} x2={xF} y2={y0 + h - 8} stroke={COL.inter} strokeWidth="4"/>
      <polygon points={`${xF},${y0 + h} ${xF - 5},${y0 + h - 11} ${xF + 5},${y0 + h - 11}`} fill={COL.inter}/>
      <line x1={x1} y1={y0 - 30} x2={x1} y2={y0 + 30} stroke={COL.lent} strokeWidth="3.5"/>
      <line x1={x2} y1={y0 - 30} x2={x2} y2={y0 + 30} stroke={COL.lent} strokeWidth="3.5"/>
      <polygon points={`${x1},${y0} ${x1 + 62},${y0} ${x1 + 62},${y0 + 62 * h / (xF - x1)}`} fill={COL.foyer} opacity="0.55"/>
      <polygon points={`${x2},${y0} ${x2 - 34},${y0} ${x2 - 34 * k},${y0 + 34 * kc}`} fill={COL.foyer} opacity="0.55"/>
      <Et x={x1 + 4} y={y0 - 36} parts="O₁" s={14}/><Et x={x2 - 2} y={y0 - 36} parts="O₂" s={14} ancre="end"/>
      <Et x={x1 + 40} y={y0 - 8} parts="θ" c={COL.foyer} s={14} ancre="middle"/><Et x={x2 + 6} y={y0 + 34} parts="θ′" c={COL.foyer} s={14}/>
      <Et x={(x1 + xF) / 2} y={y0 - 8} parts={FOBJ} c={COL.rayon} s={14} ancre="middle"/><Et x={(xF + x2) / 2 - 2} y={y0 - 8} parts={FOC} c={COL.inter} s={14} ancre="middle"/>
      <Et x={xF - 8} y={y0 + 36} parts="A₁B₁" c={COL.inter} s={14} ancre="end"/>
      <Et x={8} y={140} parts={[['base longue ', ''], ...FOBJ, [' : angle θ petit', '']]} c={COL.rayon} s={14} halo={false}/>
      <Et x={8} y={162} parts={[['base courte ', ''], ...FOC, [' : angle θ′ grand', '']]} c={COL.inter} s={14} halo={false}/>
      <Et x={8} y={184} parts="même côté A₁B₁ pour les deux" c={COL.gris} s={14} w={600} halo={false}/>
    </svg>);
}

// ---------- carte : lire la fiche d'une lunette ----------
export function SvgFicheCarte() {
  return (
    <svg viewBox="0 0 320 186" role="img" aria-label="Fiche d’une lunette 70 sur 700 : 70 millimètres est le diamètre de l’objectif, 700 millimètres sa distance focale ; l’oculaire a sa propre distance focale en millimètres" style={{ width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '6px auto' }}>
      <rect x={50} y={44} width={196} height={26} rx={6} fill="#f1f5f9" stroke={COL.gris} strokeWidth="2"/>
      <line x1={50} y1={26} x2={50} y2={88} stroke={COL.lent} strokeWidth="4"/>
      <line x1={246} y1={48} x2={246} y2={66} stroke={COL.lent} strokeWidth="4"/>
      <Et x={50} y={18} parts="objectif" s={14} ancre="middle"/><Et x={246} y={18} parts="oculaire" s={14} ancre="middle"/>
      <line x1={14} y1={26} x2={14} y2={88} stroke={COL.inter} strokeWidth="2"/>
      <polygon points="14,26 9,36 19,36" fill={COL.inter}/><polygon points="14,88 9,78 19,78" fill={COL.inter}/>
      <Et x={6} y={108} parts="D = 70 mm" c={COL.inter} s={14}/>
      <line x1={50} y1={124} x2={246} y2={124} stroke={COL.rayon} strokeWidth="2.2"/>
      <polygon points="50,124 60,119 60,129" fill={COL.rayon}/><polygon points="246,124 236,119 236,129" fill={COL.rayon}/>
      <Et x={148} y={146} parts={[...FOBJ, [' = 700 mm', '']]} c={COL.rayon} s={14} ancre="middle"/>
      <Et x={160} y={170} parts={[['oculaire ', ''], ...FOC, [' = 25 mm', '']]} c={COL.gris} s={14} ancre="middle" w={600} halo={false}/>
    </svg>);
}
