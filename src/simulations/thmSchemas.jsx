// ====================================================
//  Schémas de la simulation 212 (loi de Newton et thermostat : T(t) ; niveau TG).
//  Scène : viewBox 440 × 300, textes de 16 à 21. Graphes : viewBox de 400 de large, textes de 16 à 18. Cartes : viewBox de 320, textes ≥ 15,5.
//  Toutes les coordonnées sont des NOMBRES. Public daltonien : jamais la couleur seule (valeurs écrites, traits pleins ou en tirets, étiquettes).
//  Convention : φ = h S (T_ext − T) est le flux REÇU par le système ; la flèche de transfert indique le sens réel (sortant si T > T_ext).
// ====================================================
import { temperature, lnEcart, flux } from './thmModele';

const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#b45309', gris: '#64748b', txt: '#0f172a', clair: '#cbd5e1' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const Tx = ({ x, y, children, c = COL.txt, s = 17, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
// lettre + indice (indice = petit texte séparé, jamais de tspan)
const Ind = ({ x, y, l, i, c = COL.txt, s = 17, w = 700, ancre = 'start' }) => {
  const lw = s * 0.62 * String(l).length, iw = i ? s * 0.95 * 0.6 * String(i).length : 0, x0 = ancre === 'middle' ? x - (lw + iw) / 2 : ancre === 'end' ? x - lw - iw : x;
  return (<g>
    <text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...HALO}>{l}</text>
    {i && <text x={x0 + lw} y={y + s * 0.26} fontSize={s * 0.95} fontWeight={w} fill={c} {...HALO}>{i}</text>}
  </g>);
};
const larg = (t, s) => [...String(t)].reduce((a, c) => a + s * (c === ' ' ? 0.3 : /[=+→−×]/.test(c) ? 0.66 : /[A-ZΔ]/.test(c) ? 0.68 : 0.58), 0);
// ligne de texte mêlant texte simple et lettres à indice
const Ligne = ({ x, y, s = 18, parts, ancre = 'middle', c = COL.txt, w = 700 }) => {
  const lw = p => (p.t != null ? larg(p.t, s) : larg(p.l, s) + larg(p.i || '', s * 0.95)), tot = parts.reduce((a, p) => a + lw(p), 0);
  const x00 = ancre === 'middle' ? x - tot / 2 : x;
  const xs = parts.reduce((acc, p) => [...acc, acc[acc.length - 1] + lw(p)], [x00]);
  return (<g>{parts.map((p, k) => { const x0 = xs[k]; return p.t != null
    ? <text key={k} x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...HALO}>{p.t}</text>
    : <g key={k}><text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...HALO}>{p.l}</text>{p.i && <text x={x0 + larg(p.l, s)} y={y + s * 0.26} fontSize={s * 0.95} fontWeight={w} fill={c} {...HALO}>{p.i}</text>}</g>; })}</g>);
};
// fraction dessinée (numérateur, barre, dénominateur) centrée en x ; renvoie la largeur utile via lw (pour placer ce qui suit)
const FracSvg = ({ x, y, num, den, s = 17, c = COL.txt }) => {
  const w = Math.max(larg(num, s), larg(den, s)) + 8;
  return (<g><text x={x} y={y - 4} fontSize={s} fontWeight={700} fill={c} textAnchor="middle" {...HALO}>{num}</text>
    <line x1={x - w / 2} y1={y + 2} x2={x + w / 2} y2={y + 2} stroke={c} strokeWidth={2}/>
    <text x={x} y={y + s + 1} fontSize={s} fontWeight={700} fill={c} textAnchor="middle" {...HALO}>{den}</text></g>);
};
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3.5, tete = 11 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (<g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/>
    <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/></g>);
};
function pasJoli(max, n = 5) { const brut = max / n, e = Math.pow(10, Math.floor(Math.log10(brut))), m = brut / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; }
const fmtGrad = x => String(Math.round(x * 1000) / 1000).replace('.', ',').replace('-', '−');
const mix = (a, b, f) => a.map((v, k) => Math.round(v + (b[k] - v) * f));

// couleur du liquide selon T (froid : bleu ; chaud : brun-rouge) ; la valeur est toujours écrite en toutes lettres à côté
const couleurLiquide = T => { const f = Math.max(0, Math.min(1, (T - 4) / 86)); return `rgb(${mix([147, 197, 253], [180, 83, 9], f).join(',')})`; };

// ====================================================
//  SCÈNE : un liquide dans une tasse (système), dans une pièce à température constante (thermostat).
//  T, Text : °C ; masse : kg (hauteur du liquide) ; isolation : 'nue' | 'couvercle' | 'isotherme' ; flecheTransfert : afficher le sens réel du transfert
// ====================================================
export function SceneTasse({ T = 80, Text = 20, masse = 0.2, isolation = 'nue', flecheTransfert = false, nomSysteme = 'le café', aria }) {
  const h = 38 + (masse - 0.1) / 0.3 * 52, yTop = 222 - h, vapeur = Math.max(0, Math.min(1, (T - 40) / 30));
  const sortant = T > Text, pasDeTransfert = Math.abs(T - Text) < 0.05;
  const paroi = isolation === 'isotherme' ? 11 : 5;
  return (
    <svg viewBox="0 0 440 300" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <rect x={8} y={8} width={424} height={284} rx={16} fill="#f0f9ff" stroke={COL.gris} strokeWidth={2.5} strokeDasharray="9 6"/>
      <Tx x={22} y={38} s={21} halo={false}>Pièce (thermostat)</Tx>
      <Ligne x={22} y={68} s={21} ancre="start" parts={[{ l: 'T', i: 'ext' }, { t: ` = ${nbf(Text, 1)} °C` }]} c={COL.bleu}/>
      <Tx x={414} y={279} s={21} ancre="end" halo={false}>Système : {nomSysteme}</Tx>
      {/* vapeur : opacité continue avec T */}
      <g stroke={COL.gris} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={vapeur}>
        <path d="M 190 104 q 9 -13 0 -26 q -9 -13 0 -26"/><path d="M 220 104 q 9 -13 0 -26 q -9 -13 0 -26"/><path d="M 250 104 q 9 -13 0 -26 q -9 -13 0 -26"/>
      </g>
      {/* tasse */}
      <path d="M 280 140 Q 326 140 326 172 Q 326 204 280 204" fill="none" stroke={COL.txt} strokeWidth={9} strokeLinecap="round"/>
      <path d="M 158 118 L 158 200 Q 158 236 192 236 L 248 236 Q 282 236 282 200 L 282 118 Z" fill="#fff" stroke={COL.txt} strokeWidth={paroi} strokeLinejoin="round"/>
      <path d={`M ${164 + paroi / 2} ${yTop} L ${276 - paroi / 2} ${yTop} L ${276 - paroi / 2} 200 Q ${276 - paroi / 2} ${230 - paroi / 2} 246 ${230 - paroi / 2} L 194 ${230 - paroi / 2} Q ${164 + paroi / 2} ${230 - paroi / 2} ${164 + paroi / 2} 200 Z`} fill={couleurLiquide(T)} stroke={COL.txt} strokeWidth={1.5}/>
      {isolation === 'isotherme' && <path d="M 158 118 L 158 200 Q 158 236 192 236 L 248 236 Q 282 236 282 200 L 282 118" fill="none" stroke={COL.gris} strokeWidth={3} strokeDasharray="5 5" transform="translate(0 0)"/>}
      {isolation !== 'nue' && <g><rect x={152} y={106} width={136} height={13} rx={4} fill={COL.gris} stroke={COL.txt} strokeWidth={2.5}/><rect x={208} y={96} width={24} height={11} rx={4} fill={COL.gris} stroke={COL.txt} strokeWidth={2.5}/></g>}
      {isolation === 'couvercle' && <Tx x={220} y={258} s={18} ancre="middle" halo={false} c={COL.gris}>avec couvercle</Tx>}
      {isolation === 'isotherme' && <Tx x={220} y={258} s={18} ancre="middle" halo={false} c={COL.gris}>double paroi et couvercle</Tx>}
      {/* thermomètre plongé dans le liquide */}
      <rect x={198} y={Math.min(yTop - 20, 140)} width={8} height={Math.max(60, 222 - Math.min(yTop - 20, 140) - 12)} rx={4} fill="#fff" stroke={COL.txt} strokeWidth={2.2}/>
      <circle cx={202} cy={Math.max(210, Math.min(yTop - 20, 140) + 72)} r={9} fill={COL.rouge} stroke={COL.txt} strokeWidth={2.2}/>
      <Tx x={148} y={150} s={21} ancre="end">T = {nbf(T, 1)} °C</Tx>
      {/* transfert thermique : sens réel */}
      {flecheTransfert && !pasDeTransfert && <g>
        {sortant ? <Fleche x1={150} y1={188} x2={80} y2={188} c={COL.rouge}/> : <Fleche x1={80} y1={188} x2={150} y2={188} c={COL.rouge}/>}
        <Tx x={100} y={216} s={21} ancre="middle" c={COL.rouge}>transfert</Tx><Tx x={100} y={238} s={21} ancre="middle" c={COL.rouge}>thermique</Tx>
      </g>}
    </svg>);
}

// ====================================================
//  GRAPHE T(t) : une ou deux courbes, asymptote T_ext, repères, points mesurés, curseur de lecture.
//  courbes : [{ T0, Text, tau, trait: 'plein' | 'tirets', nom }] ; pts : [{t, T}] (acquisition) ; reperes : { tau, niveau, tangente, cinq } (appliqués à la première courbe)
// ====================================================
export function GrapheT({ courbes, tMax, pts = null, curseur = null, reperes = {}, aria, tracerAsymptote = true, etiquetteT0 = true }) {
  const L = 62, Rg = 386, W = Rg - L, yTop = 34, hG = 190, base = yTop + hG;
  const tous = [...courbes.flatMap(c => [c.T0, c.Text]), ...(pts ? pts.map(p => p.T) : [])];
  const lo0 = Math.min(...tous), hi0 = Math.max(...tous), pas = pasJoli(hi0 - lo0, 4), pad = (hi0 - lo0) * 0.06;
  const lo = Math.floor((lo0 - pad) / pas) * pas, hi = Math.ceil((hi0 + pad) / pas) * pas;
  const X = t => L + (t / tMax) * W, Y = T => yTop + hG - ((T - lo) / (hi - lo)) * hG;
  const pt = pasJoli(tMax, 5), gx = []; for (let g = 0; g <= tMax + 1e-9; g += pt) gx.push(g);
  const gy = []; for (let g = lo; g <= hi + 1e-9; g += pas) gy.push(g);
  const N = 150, ts = Array.from({ length: N }, (_, j) => (j / (N - 1)) * tMax);
  const c0 = courbes[0], monte = c0.T0 < c0.Text;
  return (
    <svg viewBox={`0 0 400 ${base + 54}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <line x1={L} y1={yTop - 4} x2={L} y2={base} stroke={COL.txt} strokeWidth={2}/><line x1={L} y1={base} x2={Rg} y2={base} stroke={COL.txt} strokeWidth={2}/>
      {gx.map(g => <g key={`x${g}`}><line x1={X(g)} y1={base} x2={X(g)} y2={base + 5} stroke={COL.txt} strokeWidth={1.8}/><text x={X(g)} y={base + 23} fontSize={17} fill={COL.txt} textAnchor="middle">{fmtGrad(g)}</text></g>)}
      {gy.map(g => <g key={`y${g}`}><line x1={L - 5} y1={Y(g)} x2={L} y2={Y(g)} stroke={COL.txt} strokeWidth={1.8}/><text x={L - 8} y={Y(g) + 6} fontSize={17} fill={COL.txt} textAnchor="end">{fmtGrad(g)}</text></g>)}
      <Tx x={Rg} y={base + 46} s={18} ancre="end" halo={false}>t (min)</Tx>
      <Tx x={L + 6} y={yTop - 12} s={18} halo={false}>T (°C)</Tx>
      {tracerAsymptote && <g><line x1={L} y1={Y(c0.Text)} x2={Rg} y2={Y(c0.Text)} stroke={COL.gris} strokeWidth={1.8} strokeDasharray="6 4"/>
        <Ind x={Rg - 4} y={Y(c0.Text) + (monte ? 22 : -8)} l="T" i="ext" s={18} ancre="end" c={COL.gris}/></g>}
      {reperes.niveau && <g><line x1={L} y1={Y(reperes.niveau.T)} x2={X(c0.tau)} y2={Y(reperes.niveau.T)} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4"/>
        <Tx x={X(c0.tau) + 8} y={Y(reperes.niveau.T) + (monte ? 20 : -8)} s={17} c={COL.orange}>{reperes.niveau.txt}</Tx></g>}
      {reperes.tau && <g><line x1={X(c0.tau)} y1={base} x2={X(c0.tau)} y2={Y(temperature(c0.tau, c0.T0, c0.Text, c0.tau))} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4"/>
        <Tx x={X(c0.tau)} y={base - 8} s={18} ancre="middle" c={COL.orange}>τ</Tx></g>}
      {reperes.cinq && c0.tau * 5 <= tMax && <g><line x1={X(5 * c0.tau)} y1={base} x2={X(5 * c0.tau)} y2={Y(temperature(5 * c0.tau, c0.T0, c0.Text, c0.tau))} stroke={COL.vert} strokeWidth={1.8} strokeDasharray="2 4"/>
        <Tx x={X(5 * c0.tau)} y={base - 8} s={18} ancre="middle" c={COL.vert}>5τ</Tx></g>}
      {reperes.tangente && <line x1={X(0)} y1={Y(c0.T0)} x2={X(Math.min(c0.tau, tMax))} y2={Y(c0.T0 + (c0.Text - c0.T0) * Math.min(1, tMax / c0.tau))} stroke={COL.vert} strokeWidth={2.2} strokeDasharray="8 4"/>}
      {etiquetteT0 && !pts && <Ind x={L + 8} y={Y(c0.T0) + (monte ? 24 : -9)} l="T" i="0" s={18} c={COL.bleu}/>}
      {pts
        ? pts.map((p, j) => <circle key={j} cx={X(p.t)} cy={Y(p.T)} r={pts.length > 60 ? 2.1 : 3.2} fill={COL.bleu}/>)
        : courbes.map((c, k) => <g key={k}><polyline points={ts.map(t => `${X(t).toFixed(1)},${Y(temperature(t, c.T0, c.Text, c.tau)).toFixed(1)}`).join(' ')} fill="none" stroke={k === 0 ? COL.bleu : COL.orange} strokeWidth={3.4} strokeDasharray={c.trait === 'tirets' ? '9 5' : undefined}/>
</g>)}
      {!pts && courbes.length > 1 && courbes.map((c, k) => { const yy = monte ? base - 16 - (courbes.length - 1 - k) * 24 : yTop + 12 + k * 24; return (<g key={`l${k}`}>
        <line x1={X(tMax * 0.52)} y1={yy - 5} x2={X(tMax * 0.52) + 30} y2={yy - 5} stroke={k === 0 ? COL.bleu : COL.orange} strokeWidth={3.4} strokeDasharray={c.trait === 'tirets' ? '9 5' : undefined}/>
        <Tx x={X(tMax * 0.52) + 36} y={yy} s={17} c={k === 0 ? COL.bleu : COL.orange}>{c.nom}</Tx></g>); })}
      {curseur && <g><line x1={X(curseur.t)} y1={yTop} x2={X(curseur.t)} y2={base} stroke={COL.gris} strokeWidth={1.6} strokeDasharray="3 4"/>
        <circle cx={X(curseur.t)} cy={Y(curseur.T)} r={6.5} fill="#fff" stroke={COL.bleu} strokeWidth={3}/></g>}
    </svg>);
}

// ====================================================
//  GRAPHE de linéarisation : ln y en fonction de t (y = (T − T_ext) / (T_0 − T_ext)), points retenus, droite d'ajustement, curseur sur la droite
// ====================================================
export function GrapheLn({ acq, ajust, curseurT = null, aria }) {
  const L = 62, Rg = 386, W = Rg - L, yTop = 30, hG = 180, base = yTop + hG, tMax = 20, yMin = -3.2, yMax = 0.3;
  const X = t => L + (t / tMax) * W, Y = v => yTop + (yMax - v) / (yMax - yMin) * hG;
  const q = acq.pts.filter(p => Math.abs(p.T - acq.Text) >= 4 && (p.T - acq.Text) / (acq.T0 - acq.Text) > 0 && p.t <= tMax);
  return (
    <svg viewBox={`0 0 400 ${base + 54}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <line x1={L} y1={yTop - 4} x2={L} y2={base} stroke={COL.txt} strokeWidth={2}/><line x1={L} y1={Y(0)} x2={Rg} y2={Y(0)} stroke={COL.txt} strokeWidth={2}/>
      {[0, -1, -2, -3].map(g => <g key={g}><line x1={L - 5} y1={Y(g)} x2={L} y2={Y(g)} stroke={COL.txt} strokeWidth={1.8}/><text x={L - 8} y={Y(g) + 6} fontSize={17} fill={COL.txt} textAnchor="end">{fmtGrad(g)}</text></g>)}
      {[0, 5, 10, 15, 20].map(g => <g key={g}><line x1={X(g)} y1={Y(0)} x2={X(g)} y2={Y(0) - 5} stroke={COL.txt} strokeWidth={1.8}/><text x={X(g)} y={base + 22} fontSize={17} fill={COL.txt} textAnchor="middle">{g}</text></g>)}
      <Tx x={Rg} y={base + 46} s={18} ancre="end" halo={false}>t (min)</Tx>
      <Tx x={L + 6} y={yTop - 10} s={18} halo={false}>ln y</Tx>
      {q.map((p, j) => <circle key={j} cx={X(p.t)} cy={Y(lnEcart(p.T, acq.T0, acq.Text))} r={3.6} fill={COL.bleu}/>)}
      <line x1={X(0)} y1={Y(ajust.a)} x2={X(tMax)} y2={Y(ajust.a + ajust.b * tMax)} stroke={COL.orange} strokeWidth={2.6} strokeDasharray="9 5"/>
      <Tx x={X(11)} y={Y(-0.5)} s={17} c={COL.orange}>droite d’ajustement</Tx>
      {curseurT != null && <g><line x1={X(curseurT)} y1={yTop} x2={X(curseurT)} y2={Y(0)} stroke={COL.gris} strokeWidth={1.6} strokeDasharray="3 4"/>
        <circle cx={X(curseurT)} cy={Y(ajust.a + ajust.b * curseurT)} r={6.5} fill="#fff" stroke={COL.orange} strokeWidth={3}/></g>}
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320, textes ≥ 15,5)
// ====================================================
const stl = { width: '100%', maxWidth: 340, height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const Cadre = ({ aria, h, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={stl}>{children}</svg>;
const Axes = ({ x0, y0, w, h, ordonnee = 'T', abscisse = 't' }) => (<g>
  <line x1={x0} y1={y0 - 8} x2={x0} y2={y0 + h} stroke={COL.txt} strokeWidth={2}/><line x1={x0} y1={y0 + h} x2={x0 + w + 10} y2={y0 + h} stroke={COL.txt} strokeWidth={2}/>
  <Tx x={x0 + 8} y={y0 - 12} s={17} halo={false}>{ordonnee}</Tx><Tx x={x0 + w + 8} y={y0 + h + 22} s={17} ancre="end" halo={false}>{abscisse}</Tx></g>);
// courbe de la carte : écart relatif f(t) = exp(−t/tauPx), de la valeur de départ yDep vers yAsym
const courbe = (x0, w, yDep, yAsym, tauPx) => { const p = []; for (let j = 0; j <= 60; j++) { const x = (j / 60) * w; p.push(`${(x0 + x).toFixed(1)},${(yAsym + (yDep - yAsym) * Math.exp(-x / tauPx)).toFixed(1)}`); } return p.join(' '); };

// 1) loi de Newton et bilan d'énergie
export function SvgCarteNewton() {
  return (<Cadre aria="Une tasse chaude dans une pièce à température constante : le transfert thermique va de la tasse, plus chaude, vers la pièce, plus froide. Le flux thermique reçu par le système est phi égal h S fois T ext moins T. Le bilan d'énergie s'écrit C fois delta T égal phi fois delta t." h={236}>
    <rect x={8} y={8} width={304} height={134} rx={14} fill="#f0f9ff" stroke={COL.gris} strokeWidth={2.2} strokeDasharray="8 5"/>
    <Ligne x={20} y={32} s={16.5} ancre="start" c={COL.bleu} parts={[{ t: 'pièce : ' }, { l: 'T', i: 'ext' }, { t: ' fixe' }]}/>
    <path d="M 214 78 Q 250 78 250 98 Q 250 118 214 118" fill="none" stroke={COL.txt} strokeWidth={7} strokeLinecap="round"/>
    <path d="M 148 64 L 148 106 Q 148 132 172 132 L 192 132 Q 216 132 216 106 L 216 64 Z" fill="#fdba74" stroke={COL.txt} strokeWidth={4}/>
    <Tx x={182} y={106} s={19} ancre="middle" halo={false}>T</Tx>
    <Fleche x1={140} y1={96} x2={72} y2={96} c={COL.rouge}/>
    <Tx x={106} y={74} s={16} ancre="middle" c={COL.rouge}>transfert</Tx><Tx x={106} y={124} s={16} ancre="middle" c={COL.rouge}>chaud → froid</Tx>
    <Ligne x={160} y={174} s={19} parts={[{ t: 'φ = hS (' }, { l: 'T', i: 'ext' }, { t: ' − T)' }]}/>
    <Ligne x={160} y={206} s={19} parts={[{ t: 'C ΔT = φ Δt' }]}/>
    <Tx x={160} y={228} s={15.5} ancre="middle" halo={false} c={COL.gris}>φ reçu par le système : φ &lt; 0 s’il cède</Tx>
  </Cadre>);
}

// 2) équation différentielle et solution (courbe générique)
export function SvgCarteSolution() {
  const x0 = 54, y0 = 34, w = 240, h = 130, yAs = y0 + h - 30, yDep = y0 + 14;
  return (<Cadre aria="Courbe de refroidissement : la température part de T zéro et décroît de moins en moins vite vers la température T ext de la pièce, qui est une asymptote horizontale." h={206}>
    <Axes x0={x0} y0={y0} w={w} h={h}/>
    <line x1={x0} y1={yAs} x2={x0 + w} y2={yAs} stroke={COL.gris} strokeWidth={1.8} strokeDasharray="6 4"/>
    <Ind x={x0 + w - 4} y={yAs + 22} l="T" i="ext" s={17} ancre="end" c={COL.gris}/>
    <polyline points={courbe(x0, w, yDep, yAs, 62)} fill="none" stroke={COL.bleu} strokeWidth={3.6}/>
    <circle cx={x0} cy={yDep} r={5.5} fill={COL.bleu}/><Ind x={x0 + 12} y={yDep - 4} l="T" i="0" s={17} c={COL.bleu}/>
    <Ligne x={160} y={196} s={16.5} parts={[{ t: 'T tend vers ' }, { l: 'T', i: 'ext' }, { t: ' sans l’atteindre' }]}/>
  </Cadre>);
}

// 3) temps caractéristique : tangente, 37 % restants, 5 τ (les repères « tangente » et « 5τ » sont expliqués dans une légende sous le graphe)
export function SvgCarteTau() {
  const x0 = 54, y0 = 30, w = 240, h = 130, tp = 44, yAs = y0 + h - 28, yDep = y0 + 10, X = k => x0 + k * tp, Y = f => yAs + (yDep - yAs) * f;
  return (<Cadre aria="Courbe de refroidissement avec les repères du temps caractéristique tau : la tangente à l'origine coupe l'asymptote T ext à t égal tau ; à t égal tau, il reste 37 pour cent de l'écart initial ; à t égal 5 tau, l'écart restant est inférieur à 1 pour cent." h={292}>
    <Axes x0={x0} y0={y0} w={w} h={h}/>
    <line x1={x0} y1={yAs} x2={x0 + w} y2={yAs} stroke={COL.gris} strokeWidth={1.8} strokeDasharray="6 4"/>
    <Ind x={X(5) - 10} y={yAs + 20} l="T" i="ext" s={17} ancre="end" c={COL.gris}/>
    <polyline points={courbe(x0, w, yDep, yAs, tp)} fill="none" stroke={COL.bleu} strokeWidth={3.6}/>
    <line x1={x0} y1={yDep} x2={X(1)} y2={yAs} stroke={COL.vert} strokeWidth={2.4} strokeDasharray="8 4"/>
    <line x1={X(1)} y1={y0 + h} x2={X(1)} y2={Y(Math.exp(-1))} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4"/>
    <circle cx={X(1)} cy={Y(Math.exp(-1))} r={5.5} fill={COL.orange}/>
    <line x1={X(5)} y1={y0 + h} x2={X(5)} y2={Y(Math.exp(-5)) - 6} stroke={COL.vert} strokeWidth={2.4} strokeDasharray="2 3"/>
    <Tx x={X(1)} y={y0 + h + 20} s={17} ancre="middle" c={COL.orange} halo={false}>τ</Tx><Tx x={X(5)} y={y0 + h + 20} s={17} ancre="middle" c={COL.vert} halo={false}>5τ</Tx>
    <Tx x={X(1) + 12} y={Y(Math.exp(-1)) - 12} s={16} c={COL.orange}>37 % de l’écart</Tx>
    <line x1={20} y1={202} x2={50} y2={202} stroke={COL.vert} strokeWidth={2.4} strokeDasharray="8 4"/>
    <Tx x={58} y={208} s={16} c={COL.vert} halo={false}>tangente à l’origine</Tx>
    <Tx x={20} y={232} s={16} c={COL.vert} halo={false}>à 5τ : moins de 1 % restant</Tx>
    <Tx x={132} y={268} s={18} ancre="end" halo={false}>τ =</Tx><FracSvg x={158} y={263} num="C" den="hS" s={17}/>
  </Cadre>);
}

// 4) chauffage ou refroidissement : même équation, même forme
export function SvgCarteChauffage() {
  const x0 = 54, y0 = 28, w = 240, h = 112, yAs = y0 + 52;
  return (<Cadre aria="Deux courbes qui tendent vers la même asymptote T ext : au-dessus, un refroidissement quand T zéro est supérieure à T ext ; au-dessous, un chauffage quand T zéro est inférieure à T ext. Les deux ont la même forme exponentielle." h={202}>
    <Axes x0={x0} y0={y0} w={w} h={h}/>
    <line x1={x0} y1={yAs} x2={x0 + w} y2={yAs} stroke={COL.gris} strokeWidth={1.8} strokeDasharray="6 4"/>
    <Ind x={x0 + w - 4} y={yAs + 22} l="T" i="ext" s={17} ancre="end" c={COL.gris}/>
    <polyline points={courbe(x0, w, y0 + 6, yAs, 62)} fill="none" stroke={COL.bleu} strokeWidth={3.6}/>
    <polyline points={courbe(x0, w, y0 + h - 8, yAs, 62)} fill="none" stroke={COL.orange} strokeWidth={3.6} strokeDasharray="9 5"/>
    <Tx x={x0 + 90} y={y0 + 24} s={15.5} c={COL.bleu}>refroidissement</Tx>
    <Tx x={x0 + 90} y={y0 + h - 26} s={15.5} c={COL.orange}>chauffage</Tx>
    <Tx x={160} y={168} s={16.5} ancre="middle" halo={false}>même équation, même forme</Tx>
    <Ligne x={160} y={192} s={16.5} parts={[{ l: 'T', i: '0' }, { t: ' > ' }, { l: 'T', i: 'ext' }, { t: ' ou ' }, { l: 'T', i: '0' }, { t: ' < ' }, { l: 'T', i: 'ext' }]}/>
  </Cadre>);
}

// 5) influence de C et de hS : τ = C / (hS)
export function SvgCarteInfluence() {
  const x0 = 54, y0 = 30, w = 240, h = 130, yAs = y0 + h - 12, yDep = y0 + 10;
  return (<Cadre aria="Deux courbes de refroidissement avec la même température de départ et la même asymptote : la courbe en trait plein, avec un petit tau, rejoint vite la température extérieure ; la courbe en tirets, avec un grand tau, descend lentement. Tau est grand quand la capacité thermique C est grande ou quand le produit h S est petit." h={248}>
    <Axes x0={x0} y0={y0} w={w} h={h}/>
    <line x1={x0} y1={yAs} x2={x0 + w} y2={yAs} stroke={COL.gris} strokeWidth={1.8} strokeDasharray="6 4"/>
    <polyline points={courbe(x0, w, yDep, yAs, 34)} fill="none" stroke={COL.bleu} strokeWidth={3.6}/>
    <polyline points={courbe(x0, w, yDep, yAs, 100)} fill="none" stroke={COL.orange} strokeWidth={3.6} strokeDasharray="9 5"/>
    <Tx x={x0 + 70} y={yAs - 12} s={15.5} c={COL.bleu}>τ petit</Tx>
    <Tx x={x0 + 150} y={y0 + 38} s={15.5} c={COL.orange}>τ grand</Tx>
    <Ligne x={160} y={192} s={17} parts={[{ t: 'τ ↑ si C ↑ ou hS ↓' }]}/>
    <Tx x={132} y={222} s={17} ancre="end" halo={false}>τ =</Tx><FracSvg x={158} y={217} num="C" den="hS" s={17}/>
  </Cadre>);
}

void flux;
