// ====================================================
//  Schémas de la simulation 166 (vecteurs position, vitesse et accélération ; niveau TG).
//  Scène : chronophotographie dans un viewBox de 400, textes de 17 à 18 (≈ 11 px rendus sur téléphone, où la scène s'affiche vers 262 px). Cartes « À retenir » : viewBox de 400, police 18 (≈ 11,5 px rendus à 252 px), maxWidth 420.
//  Public daltonien : jamais la couleur seule. Vecteur vitesse = flèche pleine, vecteur accélération = flèche en tirets (et rangée distincte),
//  vecteur position = flèche pointillée fine ; chaque vecteur porte son nom (lettre surmontée d'une flèche) et son numéro de point.
//  Les vecteurs d'un mouvement rectiligne sont décalés en rangées au-dessus (ou à côté) de la trajectoire pour rester lisibles : ils ont pour origine le point M_i.
// ====================================================
/* eslint-disable react-refresh/only-export-components -- fichier de schémas : les petits utilitaires (couleurs, indices) sont partagés avec la simulation */
import { valeurRonde, vitesseApprochee, accelerationApprochee } from './vecteursVAModele';

export const C = { bleu: '#0b4f94', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', clair: '#cbd5e1', encre: '#0f172a', violet: '#6d28d9' };
const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const sub = n => String(n).split('').map(c => (/\d/.test(c) ? SUB[+c] : c)).join('');
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

// Lettre(s) surmontée(s) d'une flèche + numéro en indice (caractères Unicode) : t = « v », « Δv », « OM » ; i = numéro ou texte court
export const VT = ({ x, y, t, i = '', c = C.encre, s = 18, w = 700, halo = false, a = 'start' }) => {
  const lw = t.length * s * 0.6, total = lw + (i !== '' ? String(i).length * s * 0.58 : 0);
  const x0 = a === 'end' ? x - total : a === 'middle' ? x - total / 2 : x, yy = y - s * 0.95;
  const ha = halo ? { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' } : {};
  return (
    <g><text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...ha}>{t}</text>
      {i !== '' && <text x={x0 + lw + 0.5} y={y + s * 0.18} fontSize={s * 0.86} fontWeight={w} fill={c} {...ha}>{sub(i)}</text>}
      <line x1={x0} y1={yy} x2={x0 + lw} y2={yy} stroke={c} strokeWidth="1.6"/>
      <polyline points={`${x0 + lw - 3.4},${yy - 2.8} ${x0 + lw},${yy} ${x0 + lw - 3.4},${yy + 2.8}`} fill="none" stroke={c} strokeWidth="1.6"/></g>);
};
// Grandeur scalaire avec indice de coordonnée : « v » + « x » en petit (coordonnée vx)
export const Co = ({ x, y, t, i, c = C.encre, s = 18, w = 700, a = 'start' }) => {
  const lw = t.length * s * 0.6, total = lw + s * 0.6, x0 = a === 'end' ? x - total : a === 'middle' ? x - total / 2 : x;
  return <g><text x={x0} y={y} fontSize={s} fontWeight={w} fill={c}>{t}</text><text x={x0 + lw + 0.5} y={y + s * 0.2} fontSize={s * 0.78} fontWeight={w} fill={c}>{i}</text></g>;
};
// Ligne mêlant texte et vecteurs : segs = ['texte', { t: 'v', i: '3' }, …] ; largeurs estimées (texte gras ≈ 0,54 × taille par caractère)
export const L = ({ x, y, s = 18, c = C.encre, w = 700, segs, a = 'start' }) => {
  const larg = g => (typeof g === 'string' ? g.trim().length * s * 0.57 : g.t.length * s * 0.6 + (g.i ? String(g.i).length * s * 0.5 : 0) + 1), gap = s * 0.3;
  const total = segs.reduce((n, g) => n + larg(g) + gap, -gap), depart = a === 'middle' ? x - total / 2 : a === 'end' ? x - total : x;
  const px = segs.map((g, k) => depart + segs.slice(0, k).reduce((n, h) => n + larg(h) + gap, 0));
  return <g>{segs.map((g, k) => (typeof g === 'string' ? <text key={k} x={px[k]} y={y} fontSize={s} fontWeight={w} fill={c}>{g.trim()}</text>
    : <VT key={k} x={px[k]} y={y} t={g.t} i={g.i ?? ''} c={g.c || c} s={s} w={w}/>))}</g>;
};
// Flèche (trait + pointe) ; dash : trait en tirets (vecteur accélération)
export const Fl = ({ x1, y1, x2, y2, c = C.encre, w = 3, dash = null, tete = 9 }) => {
  const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy);
  if (n < 1.5) return <circle cx={x1} cy={y1} r="3.4" fill="#fff" stroke={c} strokeWidth="2"/>;     // vecteur nul : petit anneau
  const ux = dx / n, uy = dy / n, h = Math.min(tete, n * 0.6);
  return (
    <g><line x1={x1} y1={y1} x2={x2 - ux * h * 0.8} y2={y2 - uy * h * 0.8} stroke={c} strokeWidth={w} strokeDasharray={dash || undefined} strokeLinecap="butt"/>
      <polygon points={`${x2},${y2} ${x2 - h * ux - h * 0.5 * uy},${y2 - h * uy + h * 0.5 * ux} ${x2 - h * ux + h * 0.5 * uy},${y2 - h * uy - h * 0.5 * ux}`} fill={c}/></g>);
};
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const pasGrad = r => [1, 2, 5, 10, 20, 50, 100].find(p => r / p <= 7) || 100;

// ---------- SCÈNE : chronophotographie avec vecteurs ----------
//  mv, P, tau, E : mouvement, points, pas, échelles (voir vecteursVAModele) ; montrerV / montrerA : vecteurs affichés ; om : numéro du point dont on trace OM ;
//  sel : point étudié (ses vecteurs sont nommés) ; anneaux : points entourés ; maxWidth : plafond de largeur
//  Textes de 17 à 18 dans le viewBox de 400 : sur téléphone (scène affichée vers 262 px) cela donne environ 11 px rendus.
export function SceneChrono({ mv, P, tau, E, montrerV = false, montrerA = false, om = null, sel = null, anneaux = [], maxWidth = 480, aria }) {
  const lay = mv.layout, N = P.length - 1, px = E.px;
  const PAS = 32;                                                                 // mise en page « étage » : un point tous les 32 unités vers le bas
  const YL = 126, YG = 176;
  const axeY = lay === 'etage' ? 36 + N * PAS + 22 : lay === 'plan' ? YG + 22 : 176;
  const H = axeY + 100, X0 = lay === 'etage' ? 50 : 30;
  const X = x => X0 + (x - E.xmin) * px;
  const Y = p => (lay === 'etage' ? 36 + p.i * PAS : lay === 'plan' ? YG - (p.y - E.ymin) * px : YL);
  const yV = lay === 'etage' ? -9 : 0, yA = lay === 'etage' ? 9 : 0;            // décalage des rangées de vecteurs
  const rangV = lay === 'ligne' ? 60 : null, rangA = lay === 'ligne' ? 98 : null, rangO = 84;
  const pg = pasGrad(E.xmax - E.xmin), ticks = []; for (let t = Math.ceil(E.xmin / pg - 1e-9) * pg; t <= E.xmax + 1e-9; t += pg) ticks.push(t);
  const vecs = [];
  // étiquette d'un vecteur nommé : au-dessus de la flèche (rangées « ligne » et « plan »), ou au-delà de la pointe (rangées serrées « étage »)
  const etiquette = (cle, t, i, c, x, y0, x2, y2, nul) => {
    const dx = x2 - x, dy = y2 - y0, n = Math.hypot(dx, dy);
    if (nul || n < 1e-6) return <VT key={cle} x={x > 330 ? x - 11 : x + 11} y={y0 + 6} t={t} i={i} c={c} s={18} halo a={x > 330 ? 'end' : 'start'}/>;
    if (lay === 'etage') { const d = dx >= 0 ? 1 : -1; let lx = x2 + d * 7, an = d > 0 ? 'start' : 'end';
      if ((d > 0 && x2 > 330) || (d < 0 && x2 < 60)) { lx = x - d * 8; an = d > 0 ? 'end' : 'start'; }
      return <VT key={cle} x={lx} y={y0 + 6} t={t} i={i} c={c} s={18} halo a={an}/>; }
    if (lay === 'plan' && t === 'a') return <VT key={cle} x={x + 9} y={(y0 + y2) / 2 + 6} t={t} i={i} c={c} s={18} halo/>;
    let nx = -dy / n, ny = dx / n; if (ny > 0) { nx = -nx; ny = -ny; }
    return <VT key={cle} x={Math.min(Math.max((x + x2) / 2 + nx * 15, 26), 374)} y={(y0 + y2) / 2 + ny * 15 + 5} t={t} i={i} c={c} s={18} halo a="middle"/>;
  };
  for (let i = 1; i <= N - 1; i++) {
    const p = P[i], v = montrerV ? vitesseApprochee(P, i, tau) : null, a = montrerA ? accelerationApprochee(P, i, tau) : null;
    const x = X(p.x), y = Y(p);
    if (v) { const y0 = rangV ?? y + yV, x2 = x + E.echV * v.x, y2 = lay === 'plan' ? y0 - E.echV * v.y : y0;
      if (rangV) vecs.push(<line key={'gv' + i} x1={x} y1={y - 6} x2={x} y2={y0} stroke={C.clair} strokeWidth="1.2" strokeDasharray="2 3"/>);
      vecs.push(<Fl key={'v' + i} x1={x} y1={y0} x2={x2} y2={y2} c={C.bleu} w={2.8}/>);
      if (sel === i) vecs.push(etiquette('lv', 'v', i, C.bleu, x, y0, x2, y2, Math.hypot(v.x, v.y) <= 1e-6)); }
    if (a && i >= 2 && i <= N - 2) { const y0 = rangA ?? y + yA, x2 = x + E.echA * a.x, y2 = lay === 'plan' ? y0 - E.echA * a.y : y0;
      if (rangA) vecs.push(<line key={'ga' + i} x1={x} y1={y - 6} x2={x} y2={y0} stroke={C.clair} strokeWidth="1.2" strokeDasharray="2 3"/>);
      vecs.push(<Fl key={'a' + i} x1={x} y1={y0} x2={x2} y2={y2} c={C.orange} w={3.2} dash="7 3.5"/>);
      if (sel === i) vecs.push(etiquette('la', 'a', i, C.orange, x, y0, x2, y2, Math.hypot(a.x, a.y) <= 1e-6)); }
  }
  // vecteur position OM_k (flèche fine tracée au-dessus de l'axe, depuis l'origine O)
  let vecOM = null;
  if (om != null && P[om]) { const xo = X(0), xm = X(P[om].x);
    vecOM = <g><line x1={xo} y1={YL - 6} x2={xo} y2={rangO} stroke={C.clair} strokeWidth="1.2" strokeDasharray="2 3"/><line x1={xm} y1={YL - 6} x2={xm} y2={rangO} stroke={C.clair} strokeWidth="1.2" strokeDasharray="2 3"/>
      <Fl x1={xo} y1={rangO} x2={xm} y2={rangO} c={C.vert} w={3} tete={11}/><VT x={(xo + xm) / 2} y={rangO - 10} t="OM" i={om} c={C.vert} s={18} a="middle" halo/></g>; }
  // légendes des échelles (sous l'axe)
  const vR = valeurRonde(46 / E.echV), aR = valeurRonde(40 / E.echA), yLeg = axeY + 62, uV = 'm/s', uA = 'm/s²';
  return (
    <svg viewBox={`0 0 400 ${H}`} role="img" aria-label={aria} style={{ ...stl, maxWidth: lay === 'etage' ? Math.min(maxWidth, 400) : maxWidth, border: `1px solid ${C.clair}` }}>
      {/* trajectoire ou quadrillage */}
      {lay === 'ligne' && <line x1={X(E.xmin)} y1={YL} x2={X(E.xmax) + 10} y2={YL} stroke={C.clair} strokeWidth="2"/>}
      {lay === 'etage' && ticks.map(t => <line key={'q' + t} x1={X(t)} y1="30" x2={X(t)} y2={axeY} stroke="#e2e8f0" strokeWidth="1"/>)}
      {/* axe Ox gradué */}
      <line x1={X(E.xmin) - 4} y1={axeY} x2="392" y2={axeY} stroke={C.encre} strokeWidth="1.8"/>
      <polyline points={`386,${axeY - 4} 392,${axeY} 386,${axeY + 4}`} fill="none" stroke={C.encre} strokeWidth="1.8"/>
      {ticks.map(t => <g key={'t' + t}><line x1={X(t)} y1={axeY - 4} x2={X(t)} y2={axeY + 4} stroke={C.encre} strokeWidth="1.6"/><text x={X(t)} y={axeY + 21} fontSize="17" textAnchor="middle" fill={C.encre} fontWeight={t === 0 ? 700 : 400}>{t === 0 ? 'O' : fr(t, 0)}</text></g>)}
      <text x="396" y={axeY + 42} fontSize="17" textAnchor="end" fill={C.gris}>x (m)</text>
      {lay === 'plan' && <g><line x1={X(0)} y1={YG + 6} x2={X(0)} y2={YG - E.ymax * px - 18} stroke={C.encre} strokeWidth="1.8"/><polyline points={`${X(0) - 4},${YG - E.ymax * px - 12} ${X(0)},${YG - E.ymax * px - 18} ${X(0) + 4},${YG - E.ymax * px - 12}`} fill="none" stroke={C.encre} strokeWidth="1.8"/>
        <text x={X(0) + 8} y={YG - E.ymax * px - 12} fontSize="17" fill={C.gris}>y (m)</text></g>}
      {lay === 'etage' && <text x="8" y="20" fontSize="17" fill={C.gris}>n° du point</text>}
      {vecOM}{vecs}
      {/* points */}
      {P.map(p => { const x = X(p.x), y = Y(p), ring = anneaux.includes(p.i) || sel === p.i;
        return (
          <g key={'p' + p.i}>
            {ring && <circle cx={x} cy={y} r="9.5" fill="none" stroke={C.orange} strokeWidth={sel === p.i ? 2.6 : 2} strokeDasharray={sel === p.i ? undefined : '3 2.5'}/>}
            <circle cx={x} cy={y} r="4.6" fill={C.encre} stroke="#fff" strokeWidth="1"/>
            <text x={lay === 'etage' ? 20 : lay === 'plan' ? x - 12 : x} y={lay === 'etage' ? y + 6 : lay === 'plan' ? y - 9 : y + 26} fontSize="17" fontWeight="700" textAnchor={lay === 'etage' ? 'start' : 'middle'} fill={C.encre}>{p.i}</text>
          </g>); })}
      {/* échelles */}
      {montrerV && <g><Fl x1={14} y1={yLeg} x2={14 + E.echV * vR} y2={yLeg} c={C.bleu} w={2.8}/><text x={22 + E.echV * vR} y={yLeg + 6} fontSize="17" fill={C.encre}>échelle des vitesses : {fr(vR, vR < 1 ? 1 : 0)} {uV}</text></g>}
      {montrerA && <g><Fl x1={14} y1={yLeg + 26} x2={14 + E.echA * aR} y2={yLeg + 26} c={C.orange} w={3.2} dash="7 3.5"/><text x={22 + E.echA * aR} y={yLeg + 32} fontSize="17" fill={C.encre}>échelle des accélérations : {fr(aR, aR < 1 ? 1 : 0)} {uA}</text></g>}
    </svg>);
}

// ---------- GRAPHES x(t), v(t), a(t) d'une coordonnée (exploration) ----------
export function GraphesVA({ mv, P, tau, coord = 'x', sel = 2, maxWidth = 480 }) {
  const N = P.length - 1, T = N * tau, fx = coord === 'x' ? mv.x : mv.y, fv = coord === 'x' ? mv.vx : mv.vy, fa = coord === 'x' ? mv.ax : mv.ay;
  const g = (f, pas = 60) => Array.from({ length: pas + 1 }, (_, k) => f(T * k / pas));
  const cx = coord === 'x' ? 'x' : 'y';
  const panneaux = [
    { lab: `${cx} (m)`, courbe: g(fx), pts: P.map(p => ({ t: p.t, v: coord === 'x' ? p.x : p.y })) },
    { lab: `v${cx} (m/s)`, courbe: g(fv), pts: P.slice(1, N).map((p, k) => ({ t: p.t, v: coord === 'x' ? vitesseApprochee(P, k + 1, tau).x : vitesseApprochee(P, k + 1, tau).y })) },
    { lab: `a${cx} (m/s²)`, courbe: g(fa), pts: P.slice(2, N - 1).map((p, k) => { const a = accelerationApprochee(P, k + 2, tau); return { t: p.t, v: coord === 'x' ? a.x : a.y }; }) },
  ];
  const h = 78, top = 22, W0 = 100, W1 = 386;
  const tx = t => W0 + (t / T) * (W1 - W0);
  return (
    <svg viewBox="0 0 400 322" role="img" aria-label={`Graphes de la coordonnée ${cx} de la position, de la vitesse et de l’accélération en fonction du temps : courbes exactes (traits) et valeurs estimées sur la chronophotographie (points)`}
      style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }}>
      {panneaux.map((pn, k) => {
        const vals = [...pn.courbe, ...pn.pts.map(p => p.v)], mn = Math.min(...vals, 0), mx = Math.max(...vals, 0), sp = Math.max(mx - mn, 1e-6), y0 = top + k * (h + 20);
        const ty = v => y0 + h - ((v - mn) / sp) * (h - 8) - 4;
        const d = pn.courbe.map((v, q) => `${q ? 'L' : 'M'}${tx(T * q / 60).toFixed(1)} ${ty(v).toFixed(1)}`).join(' ');
        return (
          <g key={k}>
            <rect x={W0} y={y0} width={W1 - W0} height={h} fill="#f8fafc" stroke={C.clair}/>
            {mn < 0 && mx > 0 && <line x1={W0} y1={ty(0)} x2={W1} y2={ty(0)} stroke={C.gris} strokeWidth="1" strokeDasharray="4 3"/>}
            <path d={d} fill="none" stroke={C.gris} strokeWidth="2"/>
            {pn.pts.map(p => <g key={p.t}><circle cx={tx(p.t)} cy={ty(p.v)} r={Math.abs(p.t - sel * tau) < 1e-9 ? 5.5 : 3.6} fill={Math.abs(p.t - sel * tau) < 1e-9 ? C.orange : C.bleu} stroke="#fff" strokeWidth="1"/></g>)}
            <text x="4" y={y0 + h / 2 + 5} fontSize="16" fontWeight="700" fill={C.encre}>{pn.lab}</text>
            <text x={W0 - 4} y={ty(mx) + 5} fontSize="15" textAnchor="end" fill={C.gris}>{fr(mx, Math.abs(mx) < 10 ? 1 : 0)}</text>
            <text x={W0 - 4} y={ty(mn) - 1} fontSize="15" textAnchor="end" fill={C.gris}>{fr(mn, Math.abs(mn) < 10 ? 1 : 0)}</text>
          </g>); })}
      <text x={W1} y="316" fontSize="16" textAnchor="end" fill={C.gris}>t (s) : de 0 à {fr(T, T < 10 ? 1 : 0)}</text>
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (une idée par carte, un schéma par carte ; viewBox de 400, police 18 : environ 11,5 px rendus à 252 px d'affichage sur téléphone)
// ====================================================
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 400 ${h}`} role="img" aria-label={aria} style={{ ...stl, maxWidth: 420 }}>{children}</svg>;
const Tx = ({ x, y, children, c = C.encre, s = 18, w = 400, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Pt = ({ x, y, r = 5 }) => <circle cx={x} cy={y} r={r} fill={C.encre} stroke="#fff" strokeWidth="1"/>;
// Fraction dessinée : numérateur (nodes) au-dessus de la barre, dénominateur en dessous, centrée en x ; largeur de barre w
const Frac = ({ x, y, w, haut, bas }) => <g><line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={C.encre} strokeWidth="1.8"/><g>{haut}</g><g>{bas}</g></g>;

// 1. Le vecteur vitesse : tangent à la trajectoire, parallèle à M3M5
export function SvgVitesseCarte() {
  return (
    <Svg h={272} aria="Trajectoire courbe avec trois points M3, M4 et M5 : le vecteur vitesse en M4 est parallèle à la corde M3M5, donc tangent à la trajectoire, dans le sens du mouvement">
      <Tx x="200" y="26" a="middle" w="700">Le vecteur vitesse en M₄</Tx>
      <path d="M40 200 Q190 70 340 120" fill="none" stroke={C.clair} strokeWidth="3"/>
      <line x1="115" y1="146" x2="265" y2="106" stroke={C.gris} strokeWidth="2" strokeDasharray="6 4"/>
      <Pt x={115} y={146}/><Pt x={190} y={115}/><Pt x={265} y={106}/>
      <Tx x="100" y="174" a="middle" w="700">M₃</Tx><Tx x="172" y="100" a="middle" w="700">M₄</Tx><Tx x="276" y="134" a="middle" w="700">M₅</Tx>
      <Fl x1={190} y1={115} x2={290} y2={89} c={C.bleu} w={3.4} tete={11}/>
      <VT x={296} y={86} t="v" i="4" c={C.bleu}/>
      <VT x={200} y={180} t="M₃M₅" c={C.gris} a="middle"/>
      <L x={200} y={214} a="middle" c={C.bleu} segs={[{ t: 'v', i: '4' }, 'est parallèle à', { t: 'M₃M₅' }]}/>
      <Tx x="200" y="240" a="middle" w="700" c={C.bleu}>donc tangent à la trajectoire,</Tx>
      <Tx x="200" y="264" a="middle" w="700" c={C.bleu}>dans le sens du mouvement</Tx>
    </Svg>);
}
// 2. Le vecteur accélération : sens de Δv (exemple en trajectoire courbe)
export function SvgAccelerationCarte() {
  return (
    <Svg h={338} aria="Deux vecteurs vitesse v3 et v5 tracés depuis un même point ; le vecteur variation de vitesse va de la pointe de v3 à la pointe de v5 ; le vecteur accélération en M4 a la même direction et le même sens que cette variation, et vaut cette variation divisée par deux tau">
      <Tx x="200" y="26" a="middle" w="700">De la vitesse à l’accélération</Tx>
      <Pt x={80} y={150}/>
      <Fl x1={80} y1={150} x2={190} y2={112} c={C.bleu} w={3.2} tete={10}/><VT x={196} y={104} t="v" i="3" c={C.bleu} halo/>
      <Fl x1={80} y1={150} x2={172} y2={214} c={C.bleu} w={3.2} tete={10}/><VT x={178} y={228} t="v" i="5" c={C.bleu} halo/>
      <Fl x1={190} y1={112} x2={172} y2={214} c={C.violet} w={3.2} tete={10}/>
      <VT x={206} y={176} t="Δv" c={C.violet} halo/>
      <Tx x="318" y="62" a="middle" w="700" c={C.orange}>en M₄</Tx>
      <Fl x1={318} y1={76} x2={306} y2={166} c={C.orange} w={3.4} dash="7 3.5" tete={11}/>
      <VT x={316} y={196} t="a" i="4" c={C.orange} halo a="middle"/>
      <VT x={128} y={274} t="a" i="4" c={C.orange}/><Tx x="170" y="274" s="22" w="700" c={C.orange}>≈</Tx>
      <Frac x={238} y={268} w={58} haut={<VT x={238} y={260} t="Δv" c={C.orange} a="middle"/>} bas={<Tx x="238" y="292" a="middle" w="700" c={C.orange}>2τ</Tx>}/>
      <Tx x="112" y="326" w="700" c={C.orange}>même sens que</Tx><VT x={262} y={326} t="Δv" c={C.orange}/>
    </Svg>);
}
// 3. Accélérer, ralentir : a dans le même sens que v, ou en sens contraire
const Palet = ({ y }) => <rect x="170" y={y - 11} width="46" height="22" rx="4" fill="#fde68a" stroke={C.encre} strokeWidth="2"/>;
export function SvgSensCarte() {
  return (
    <Svg h={276} aria="Deux cas sur un axe horizontal orienté vers la droite : si l'accélération a le même sens que la vitesse, la norme de la vitesse augmente ; si elle est de sens contraire, la norme de la vitesse diminue, même si le mobile avance toujours vers la droite">
      <rect x="8" y="10" width="384" height="124" rx="8" fill="#f0fdf4" stroke={C.vert} strokeWidth="1.5"/>
      <L x={18} y={38} c={C.vert} segs={['Même sens :', { t: 'v' }, 'augmente']}/>
      <Palet y={98}/><Fl x1={216} y1={88} x2={300} y2={88} c={C.bleu} w={3}/><VT x={306} y={94} t="v" c={C.bleu}/>
      <Fl x1={216} y1={110} x2={266} y2={110} c={C.orange} w={3.2} dash="7 3.5"/><VT x={272} y={116} t="a" c={C.orange}/>
      <Co x={16} y={92} t="a" i="x" c={C.orange}/><Tx x="44" y="92" c={C.orange} w="700">&gt; 0</Tx>
      <Co x={16} y={120} t="v" i="x" c={C.bleu}/><Tx x="44" y="120" c={C.bleu} w="700">&gt; 0</Tx>
      <rect x="8" y="142" width="384" height="124" rx="8" fill="#fef2f2" stroke={C.rouge} strokeWidth="1.5"/>
      <L x={18} y={170} c={C.rouge} segs={['Sens opposés :', { t: 'v' }, 'diminue']}/>
      <Palet y={230}/><Fl x1={216} y1={220} x2={300} y2={220} c={C.bleu} w={3}/><VT x={306} y={226} t="v" c={C.bleu}/>
      <Fl x1={170} y1={242} x2={128} y2={242} c={C.orange} w={3.2} dash="7 3.5"/><VT x={120} y={248} t="a" c={C.orange} a="end"/>
      <Co x={16} y={224} t="a" i="x" c={C.orange}/><Tx x="44" y="224" c={C.orange} w="700">&lt; 0</Tx>
      <Co x={16} y={252} t="v" i="x" c={C.bleu}/><Tx x="44" y="252" c={C.bleu} w="700">&gt; 0</Tx>
    </Svg>);
}
// 4. Le signe de a_x : un palet sur un plan incliné (axe Ox vers le haut du plan) monte, s'arrête, redescend
export function SvgSigneCarte() {
  const th = -18 * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const T = (cx, cy, lx, ly) => [cx + lx * cs - ly * sn, cy + lx * sn + ly * cs];    // repère du plan incliné -> repère de l'écran
  const col = (x0, titre, vx, vTxt) => {
    const cx = x0 + 62, cy = 150, [r1x, r1y] = T(cx, cy, -52, 0), [r2x, r2y] = T(cx, cy, 52, 0);
    const sv = Math.sign(vx), [v1x, v1y] = T(cx, cy, -12 * sv, -34), [v2x, v2y] = T(cx, cy, 16 * sv, -34), [a1x, a1y] = T(cx, cy, 14, -58), [a2x, a2y] = T(cx, cy, -20, -58);
    const [lvx, lvy] = T(cx, cy, sv > 0 ? 24 : -24, -34), [lax, lay] = T(cx, cy, 22, -58);
    return (
      <g>
        <rect x={x0} y="36" width="124" height="200" rx="8" fill="#f8fafc" stroke={C.clair}/>
        <Tx x={x0 + 62} y="60" a="middle" w="700">{titre}</Tx>
        <line x1={r1x} y1={r1y} x2={r2x} y2={r2y} stroke={C.gris} strokeWidth="3"/>
        <rect x={-20} y={-22} width="40" height="22" rx="4" fill="#fde68a" stroke={C.encre} strokeWidth="2" transform={`translate(${cx} ${cy}) rotate(-18)`}/>
        {vx !== 0 ? <Fl x1={v1x} y1={v1y} x2={v2x} y2={v2y} c={C.bleu} w={3}/> : <circle cx={T(cx, cy, 0, -34)[0]} cy={T(cx, cy, 0, -34)[1]} r="3.4" fill="#fff" stroke={C.bleu} strokeWidth="2"/>}
        <Fl x1={a1x} y1={a1y} x2={a2x} y2={a2y} c={C.orange} w={3.2} dash="7 3.5"/>
        <Co x={x0 + 8} y={196} t="v" i="x" c={C.bleu}/><Tx x={x0 + 36} y="196" c={C.bleu} w="700">{vTxt}</Tx>
        <Co x={x0 + 8} y={224} t="a" i="x" c={C.orange}/><Tx x={x0 + 36} y="224" c={C.orange} w="700">&lt; 0</Tx>
        {vx !== 0 && <VT x={lvx} y={lvy + 6} t="v" c={C.bleu} halo a={vx > 0 ? 'start' : 'end'}/>}
        <VT x={lax} y={lay + 6} t="a" c={C.orange} halo/>
      </g>);
  };
  return (
    <Svg h={284} aria="Un palet lancé vers le haut d'un plan incliné, l'axe Ox étant dirigé vers le haut du plan : à la montée vx est positive et ax négative, au sommet vx est nulle mais ax reste négative, à la descente vx est négative et ax toujours négative ; la flèche pleine est la vitesse, la flèche en tirets l'accélération">
      <Tx x="200" y="22" a="middle" w="700">Palet sur un plan incliné (Ox vers le haut)</Tx>
      {col(6, 'montée', 34, '> 0')}
      {col(138, 'sommet', 0, '= 0')}
      {col(270, 'descente', -34, '< 0')}
      <L x={200} y={270} a="middle" segs={[{ t: 'v', c: C.bleu }, '=', { t: '0', c: C.bleu }, 'n’implique pas', { t: 'a', c: C.orange }, '=', { t: '0', c: C.orange }]}/>
    </Svg>);
}
// 5. De x(t) à v_x(t) puis a_x(t) : dérivées successives
export function SvgDeriveesCarte() {
  const ligne = (y, nom, expr, c) => (
    <g>
      <rect x="12" y={y - 24} width="98" height="40" rx="8" fill="#eaf2fb" stroke={c} strokeWidth="2"/>
      {nom}
      <Tx x="124" y={y + 4} s="18" w="700" c={C.encre}>= {expr}</Tx>
    </g>);
  const fleche = y => <g><Fl x1={60} y1={y} x2={60} y2={y + 32} c={C.gris} w={2.6}/><Tx x="74" y={y + 24} c={C.gris}>on dérive par rapport à t</Tx></g>;
  return (
    <Svg h={258} aria="Chaîne de dérivations : la coordonnée x(t), dérivée, donne vx(t), dérivée à son tour, donne ax(t) ; exemple 2,0 t + 0,50 t² puis 2,0 + 1,0 t puis 1,0">
      <Tx x="200" y="24" a="middle" w="700">Deux dérivées successives</Tx>
      {ligne(66, <Tx x="61" y="72" a="middle" w="700">x(t)</Tx>, '2,0 t + 0,50 t²', C.gris)}
      {fleche(86)}
      {ligne(148, <g><Co x={34} y={154} t="v" i="x" c={C.bleu}/><Tx x="62" y="154" w="700" c={C.bleu}>(t)</Tx></g>, '2,0 + 1,0 t', C.bleu)}
      {fleche(168)}
      {ligne(230, <g><Co x={34} y={236} t="a" i="x" c={C.orange}/><Tx x="62" y="236" w="700" c={C.orange}>(t)</Tx></g>, '1,0 m/s² (constante)', C.orange)}
    </Svg>);
}
// 6. Caractériser a : rectiligne, uniforme, uniformément accéléré (pour chaque ligne : points, flèche v pleine, flèche a en tirets)
export function SvgCaracteriserCarte() {
  const ligne = (y0, titre, xs, vFl, aFl, txt) => (
    <g>
      <rect x="8" y={y0} width="384" height="108" rx="8" fill="#f8fafc" stroke={C.clair}/>
      <Tx x="18" y={y0 + 24} w="700">{titre}</Tx>
      <line x1="20" y1={y0 + 88} x2="206" y2={y0 + 88} stroke={C.clair} strokeWidth="2"/>
      {xs.map((x, k) => <Pt key={k} x={x} y={y0 + 88} r={4.5}/>)}
      <Fl x1={vFl[0]} y1={y0 + 48} x2={vFl[1]} y2={y0 + 48} c={C.bleu} w={3}/>
      {aFl ? <Fl x1={aFl[0]} y1={y0 + 68} x2={aFl[1]} y2={y0 + 68} c={C.orange} w={3.2} dash="7 3.5"/> : <Fl x1={vFl[0]} y1={y0 + 68} x2={vFl[0]} y2={y0 + 68} c={C.orange} w={3}/>}
      {txt}
    </g>);
  return (
    <Svg h={362} aria="Trois mouvements rectilignes. Rectiligne : le vecteur accélération est porté par la droite du mouvement. Rectiligne uniforme : les points sont équidistants, la flèche vitesse est constante et le vecteur accélération est nul. Rectiligne uniformément accéléré : les écarts augmentent régulièrement, le vecteur accélération est constant et non nul. Flèche pleine : vitesse ; flèche en tirets : accélération">
      {ligne(8, 'rectiligne', [30, 100, 150, 186, 206], [100, 160], [100, 60],
        <g><L x={216} y={62} segs={[{ t: 'a', c: C.orange }, 'sur la droite']}/><Tx x="216" y="88" w="700" c={C.gris}>ici sens opposé</Tx></g>)}
      {ligne(126, 'rectiligne uniforme', [30, 70, 110, 150, 190], [110, 160], null,
        <g><L x={216} y={180} segs={[{ t: 'a', c: C.orange }, '=', { t: '0', c: C.orange }]}/><L x={216} y={206} segs={[{ t: 'v' }, 'constant']}/></g>)}
      {ligne(244, 'rectiligne uniformément accéléré', [30, 44, 72, 116, 176], [116, 166], [116, 156],
        <g><L x={216} y={298} segs={[{ t: 'a', c: C.orange }, 'constant,']}/><Tx x="216" y="324" w="700">non nul</Tx></g>)}
    </Svg>);
}
