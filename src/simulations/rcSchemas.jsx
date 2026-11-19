// ====================================================
//  Schémas de la simulation 174 (circuit RC : charge et décharge d'un condensateur ; niveau TG).
//  Scène : viewBox 440 × 320, textes de 17 à 19 (≥ 12 px rendus sur téléphone). Graphes : viewBox de 400 de large, textes de 15 à 16.
//  Cartes « À retenir » : viewBox de 320 de large, textes ≥ 14. Toutes les coordonnées sont des NOMBRES (jamais de chaînes).
//  Public daltonien : jamais la couleur seule. Signes + et − écrits sur les armatures ; courbes distinguées par le trait (plein / tirets)
//  et par une étiquette écrite à côté ; repères (τ, 63 %, tangente) en pointillés avec étiquette.
//  Conventions : i et u_C en convention récepteur (i orienté vers l'armature A, flèche de u_C vers A), E fléchée de − vers +.
// ====================================================
import { uC, intensite } from './rcModele';
import { indicesProfond } from '../commun';

const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#b45309', gris: '#64748b', txt: '#0f172a', clair: '#cbd5e1' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');

// ---------- outils de dessin ----------
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tete = 10, tirets = false }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w} strokeDasharray={tirets ? '6 4' : undefined}/>
      <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/>
    </g>);
};
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const Tx = ({ x, y, children, c = COL.txt, s = 17, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
// lettre + indice (indice = petit texte séparé, jamais de tspan) ; ancre « start » ou « middle »
const Ind = ({ x, y, l, i, c = COL.txt, s = 17, w = 700, ancre = 'start' }) => {
  const lw = s * 0.62 * String(l).length, iw = i ? s * 0.85 * 0.62 * String(i).length : 0, x0 = ancre === 'middle' ? x - (lw + iw) / 2 : ancre === 'end' ? x - lw - iw : x;
  return (<g>
    <text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...HALO}>{l}</text>
    {i && <text x={x0 + lw} y={y + s * 0.26} fontSize={s * 0.85} fontWeight={w} fill={c} {...HALO}>{i}</text>}
  </g>);
};
// ligne de texte mêlant texte simple et lettres à indice, placée en calculant les largeurs (jamais de tspan)
const larg = (t, s) => [...String(t)].reduce((a, c) => a + s * (c === ' ' ? 0.3 : /[=+→−]/.test(c) ? 0.66 : /[A-Z]/.test(c) ? 0.68 : 0.58), 0);
const Ligne = ({ x, y, s = 18, parts, ancre = 'middle', c = COL.txt, w = 700 }) => {
  const lw = p => (p.t != null ? larg(p.t, s) : larg(p.l, s) + larg(p.i || '', s * 0.85)), tot = parts.reduce((a, p) => a + lw(p), 0);
  const x00 = ancre === 'middle' ? x - tot / 2 : x;
  const xs = parts.reduce((acc, p) => [...acc, acc[acc.length - 1] + lw(p)], [x00]);
  return (<g>{parts.map((p, k) => { const x0 = xs[k]; return p.t != null
    ? <text key={k} x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...HALO}>{p.t}</text>
    : <g key={k}><text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...HALO}>{p.l}</text>{p.i && <text x={x0 + larg(p.l, s)} y={y + s * 0.26} fontSize={s * 0.85} fontWeight={w} fill={c} {...HALO}>{p.i}</text>}</g>; })}</g>);
};
const Fil = ({ pts }) => <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={COL.txt} strokeWidth={3} strokeLinejoin="round"/>;
const Noeud = ({ x, y }) => <circle cx={x} cy={y} r={4.5} fill={COL.txt}/>;
// échelle « jolie » 1-2-5 pour les graduations du temps
function pasJoli(max, n = 5) {
  const brut = max / n, e = Math.pow(10, Math.floor(Math.log10(brut))), m = brut / e;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e;
}
const fmtGrad = x => { const r = Math.round(x * 1000) / 1000; return String(r).replace('.', ','); };

// ====================================================
//  SCÈNE : circuit RC série (source E, interrupteur à deux positions, résistor R, condensateur C)
//  type : 'charge' (interrupteur en position 1) ou 'decharge' (position 2) ; frac = q / (C E) entre 0 et 1 pour les signes sur les armatures
//  fleches : 'i' (seulement l'intensité) ou 'tout' (i, u_R, u_C et E) ; valeurs : texte sous le schéma
// ====================================================
export function SceneRC({ type = 'charge', frac = 0, fleches = 'i', ligneValeurs = '', aria }) {
  const n = Math.max(0, Math.min(6, Math.round(frac * 6)));
  const xs = [284, 302, 320, 342, 360, 378], ordre = [2, 3, 1, 4, 0, 5];
  const actifs = ordre.slice(0, n);
  const lame = type === 'charge' ? [112, 90] : [122, 134];
  return (
    <svg viewBox="0 0 440 320" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      {/* fils */}
      <Fil pts={[[48, 90], [112, 90]]}/>
      <Fil pts={[[180, 90], [215, 90]]}/>
      <Fil pts={[[275, 90], [330, 90], [330, 160]]}/>
      <Fil pts={[[330, 212], [330, 270], [48, 270], [48, 188]]}/>
      <Fil pts={[[122, 134], [122, 270]]}/>
      <Fil pts={[[48, 90], [48, 150]]}/>
      <Noeud x={122} y={270}/>
      {/* générateur */}
      <line x1={30} y1={150} x2={66} y2={150} stroke={COL.txt} strokeWidth={3.5}/>
      <line x1={38} y1={168} x2={58} y2={168} stroke={COL.txt} strokeWidth={7}/>
      <Fil pts={[[48, 168], [48, 270]]}/>
      <Tx x={74} y={148} s={21} halo={false}>+</Tx><Tx x={74} y={182} s={21} halo={false}>−</Tx>
      <Tx x={18} y={206} s={22}>E</Tx>
      {/* interrupteur à deux positions */}
      <circle cx={112} cy={90} r={5} fill="#fff" stroke={COL.txt} strokeWidth={2.5}/>
      <circle cx={122} cy={134} r={5} fill="#fff" stroke={COL.txt} strokeWidth={2.5}/>
      <line x1={180} y1={90} x2={lame[0] + (type === 'charge' ? 5 : 3)} y2={lame[1] + (type === 'charge' ? 0 : -4)} stroke={COL.orange} strokeWidth={5} strokeLinecap="round"/>
      <circle cx={180} cy={90} r={5.5} fill={COL.txt}/>
      <Tx x={109} y={70} s={20} ancre="middle">1</Tx><Tx x={100} y={142} s={20} ancre="middle">2</Tx>
      <Tx x={190} y={70} s={21}>K</Tx>
      {/* résistor */}
      <rect x={215} y={76} width={60} height={28} fill="#fff" stroke={COL.txt} strokeWidth={3}/>
      <Tx x={245} y={99} s={21} ancre="middle" halo={false}>R</Tx>
      {/* condensateur : armature A (haut) et B (bas) */}
      <line x1={272} y1={160} x2={390} y2={160} stroke={COL.txt} strokeWidth={5}/>
      <line x1={272} y1={212} x2={390} y2={212} stroke={COL.txt} strokeWidth={5}/>
      <Tx x={262} y={168} s={21} ancre="end">A</Tx><Tx x={262} y={226} s={21} ancre="end">B</Tx>
      <Tx x={236} y={192} s={19} ancre="end" halo={false} c={COL.gris}>isolant</Tx>
      <Fleche x1={240} y1={190} x2={268} y2={190} c={COL.gris} w={2} tete={8}/>
      {actifs.map(k => <g key={`p${k}`} stroke={COL.rouge} strokeWidth={3.2} strokeLinecap="round"><line x1={xs[k] - 6} y1={174} x2={xs[k] + 6} y2={174}/><line x1={xs[k]} y1={168} x2={xs[k]} y2={180}/></g>)}
      {actifs.map(k => <line key={`m${k}`} x1={xs[k] - 6} y1={198} x2={xs[k] + 6} y2={198} stroke={COL.bleu} strokeWidth={3.8} strokeLinecap="round"/>)}
      <Tx x={386} y={252} s={22} ancre="middle" halo={false}>C</Tx>
      {/* flèches d'intensité et de tensions */}
      <Fleche x1={286} y1={90} x2={322} y2={90} c={COL.rouge} w={3.5} tete={11}/>
      <Tx x={302} y={70} s={21} ancre="middle" c={COL.rouge}>i</Tx>
      {fleches === 'tout' && <g>
        <Fleche x1={277} y1={54} x2={213} y2={54} c={COL.bleu} w={3.5} tete={11}/>
        <Ind x={245} y={40} l="u" i="R" c={COL.bleu} s={23} ancre="middle"/>
        <Fleche x1={402} y1={212} x2={402} y2={160} c={COL.bleu} w={3.5} tete={11}/>
        <Ind x={406} y={192} l="u" i="C" c={COL.bleu} s={22}/>
        <Fleche x1={10} y1={206} x2={10} y2={134} c={COL.vert} w={3.5} tete={11}/>
      </g>}
      <Tx x={220} y={304} s={20} ancre="middle" halo={false} c={COL.txt}>{ligneValeurs}</Tx>
    </svg>);
}

// ====================================================
//  GRAPHE : u_C(t) (et i(t) en dessous si montreI). t en ms (tMax en ms) ; pas de leçon dans les légendes.
//  curseur : { t } ; pts : points mesurés [{t, u}] (acquisition) ; reperes : { tau, niveau, tangente, cinq }
// ====================================================
export function GrapheRC({ type, E, R, tau, tMax, curseur = null, pts = null, montreU = true, montreI = false, reperes = {}, gradI = true, aria, unitS = false }) {
  const L = 60, Rg = 384, W = Rg - L, hU = 120, yU = 29, yI = yU + hU + 62, hI = 90;
  const k = unitS ? 1000 : 1, X = t => L + (t / tMax) * W;
  const iMax = E / R, yUp = u => yU + hU - (u / E) * hU * 0.94 - hU * 0.03;
  const yIp = i => type === 'charge' ? yI + hI - (i / iMax) * hI * 0.94 - hI * 0.03 : yI + hI * 0.03 + (-i / iMax) * hI * 0.94;
  const N = 160, ts = Array.from({ length: N }, (_, j) => (j / (N - 1)) * tMax);
  const hauteur = montreI ? yI + hI + 56 : yU + hU + 56;
  const pas = pasJoli(tMax / k, 5), grads = []; for (let g = 0; g <= tMax / k + 1e-9; g += pas) grads.push(g);
  const base = montreI ? yI + hI : yU + hU;
  return (
    <svg viewBox={`0 0 400 ${hauteur}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      {/* axe du temps (en bas du dernier graphe) */}
      {grads.map(g => <g key={g}><line x1={X(g * k)} y1={base} x2={X(g * k)} y2={base + 5} stroke={COL.txt} strokeWidth={1.8}/><text x={X(g * k)} y={base + 22} fontSize={17} fill={COL.txt} textAnchor="middle">{fmtGrad(g)}</text></g>)}
      <Tx x={Rg} y={base + 46} s={18} ancre="end" halo={false}>t ({unitS ? 's' : 'ms'})</Tx>
      {montreU && <g>
        <line x1={L} y1={yU} x2={L} y2={yU + hU} stroke={COL.txt} strokeWidth={2}/><line x1={L} y1={yU + hU} x2={Rg} y2={yU + hU} stroke={COL.txt} strokeWidth={2}/>
        {[0, 0.5, 1].map(f => <g key={f}><line x1={L - 5} y1={yUp(f * E)} x2={L} y2={yUp(f * E)} stroke={COL.txt} strokeWidth={1.8}/><text x={L - 8} y={yUp(f * E) + 5} fontSize={17} fill={COL.txt} textAnchor="end">{nbf(f * E, f === 0.5 && E % 2 ? 1 : 0).replace(/,0$/, '')}</text></g>)}
        <Ind x={L + 6} y={yU - 6} l="u" i="C" c={COL.bleu} s={20}/><Tx x={L + 44} y={yU - 6} s={18} c={COL.bleu} halo={false}>(V)</Tx>
        {reperes.niveau && <g>
          <line x1={L} y1={yUp(reperes.niveau.u)} x2={X(tau)} y2={yUp(reperes.niveau.u)} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4"/>
          <Tx x={X(tau) + 8} y={yUp(reperes.niveau.u) + (type === 'charge' ? 19 : -6)} s={17} c={COL.orange}>{reperes.niveau.txt}</Tx>
        </g>}
        {reperes.tau && <g>
          <line x1={X(tau)} y1={yU + hU} x2={X(tau)} y2={yUp(uC(type, tau, E, tau))} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4"/>
          <Tx x={X(tau)} y={yU + hU - 8} s={18} ancre="middle" c={COL.orange}>τ</Tx>
        </g>}
        {reperes.cinq && tau * 5 <= tMax && <g>
          <line x1={X(5 * tau)} y1={yU + hU} x2={X(5 * tau)} y2={yUp(uC(type, 5 * tau, E, tau))} stroke={COL.vert} strokeWidth={1.8} strokeDasharray="2 4"/>
          <Tx x={X(5 * tau)} y={yU + hU - 8} s={18} ancre="middle" c={COL.vert}>5τ</Tx>
        </g>}
        {reperes.tangente && (() => { const u0 = type === 'charge' ? 0 : E, u1 = type === 'charge' ? E : 0; return (
          <line x1={X(0)} y1={yUp(u0)} x2={X(Math.min(tau, tMax))} y2={yUp(u1)} stroke={COL.vert} strokeWidth={2.2} strokeDasharray="8 4"/>); })()}
        {pts
          ? pts.map((p, j) => <circle key={j} cx={X(p.t)} cy={yUp(Math.max(-0.05 * E, Math.min(1.05 * E, p.u)))} r={2.1} fill={COL.bleu}/>)
          : <polyline points={ts.map(t => `${X(t).toFixed(1)},${yUp(uC(type, t, E, tau)).toFixed(1)}`).join(' ')} fill="none" stroke={COL.bleu} strokeWidth={3.2}/>}
        {curseur && <g>
          <line x1={X(curseur.t)} y1={yU} x2={X(curseur.t)} y2={base} stroke={COL.gris} strokeWidth={1.6} strokeDasharray="3 4"/>
          <circle cx={X(curseur.t)} cy={yUp(curseur.u ?? uC(type, curseur.t, E, tau))} r={6.5} fill="#fff" stroke={COL.bleu} strokeWidth={3}/>
        </g>}
      </g>}
      {montreI && <g>
        <line x1={L} y1={yI} x2={L} y2={yI + hI} stroke={COL.txt} strokeWidth={2}/>
        <line x1={L} y1={type === 'charge' ? yI + hI : yI} x2={Rg} y2={type === 'charge' ? yI + hI : yI} stroke={COL.txt} strokeWidth={1.6}/>
        {gradI && <g><line x1={L - 5} y1={yIp(type === 'charge' ? iMax : -iMax)} x2={L} y2={yIp(type === 'charge' ? iMax : -iMax)} stroke={COL.txt} strokeWidth={1.8}/>
          <text x={L - 8} y={yIp(type === 'charge' ? iMax : -iMax) + 5} fontSize={17} fill={COL.txt} textAnchor="end">{nbf(type === 'charge' ? iMax : -iMax, 2)}</text></g>}
        <text x={L - 8} y={yIp(0) + 5} fontSize={17} fill={COL.txt} textAnchor="end">0</text>
        <Tx x={L + 6} y={yI - 6} s={18} c={COL.orange} halo={false}>i (mA)</Tx>
        <polyline points={ts.map(t => `${X(t).toFixed(1)},${yIp(intensite(type, t, E, R, tau)).toFixed(1)}`).join(' ')} fill="none" stroke={COL.orange} strokeWidth={3.2} strokeDasharray="9 5"/>
        {curseur && <g>
          <line x1={X(curseur.t)} y1={yI} x2={X(curseur.t)} y2={yI + hI} stroke={COL.gris} strokeWidth={1.6} strokeDasharray="3 4"/>
          <circle cx={X(curseur.t)} cy={yIp(intensite(type, curseur.t, E, R, tau))} r={6.5} fill="#fff" stroke={COL.orange} strokeWidth={3}/>
        </g>}
      </g>}
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320, textes ≥ 14)
// ====================================================
const stl = { width: '100%', maxWidth: 340, height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const Cadre = ({ aria, h, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={stl}>{children}</svg>;
const Legende = ({ children }) => <div style={{ fontSize: 14, lineHeight: 1.55, color: COL.txt, margin: '0 auto 8px', maxWidth: 340 }}>{indicesProfond(children)}</div>;

// 1) condensateur : q = C u, armatures +q et −q
export function SvgCarteCondensateur() {
  return (<Cadre aria="Un condensateur : deux armatures conductrices en regard séparées par un isolant. L'armature A porte la charge plus q, l'armature B la charge moins q. Le courant d'intensité i arrive sur l'armature A." h={196}>
    <line x1={60} y1={74} x2={260} y2={74} stroke={COL.txt} strokeWidth={6}/>
    <line x1={60} y1={126} x2={260} y2={126} stroke={COL.txt} strokeWidth={6}/>
    {[80, 110, 210, 240].map(x => <text key={x} x={x} y={62} fontSize={20} fontWeight={800} fill={COL.rouge} textAnchor="middle">+</text>)}
    {[80, 110, 210, 240].map(x => <text key={x} x={x} y={152} fontSize={24} fontWeight={800} fill={COL.bleu} textAnchor="middle">−</text>)}
    <Tx x={160} y={106} s={15.5} ancre="middle" c={COL.gris} halo={false}>isolant</Tx>
    <Fil pts={[[160, 8], [160, 74]]}/><Fil pts={[[160, 126], [160, 168]]}/>
    <Fleche x1={178} y1={14} x2={178} y2={50} c={COL.rouge} w={3.5} tete={11}/>
    <Tx x={190} y={36} s={18} c={COL.rouge}>i</Tx>
    <Tx x={54} y={80} s={17} ancre="end">A</Tx><Tx x={54} y={132} s={17} ancre="end">B</Tx>
    <Ind x={268} y={82} l="+q" c={COL.rouge} s={18.5}/><Ind x={268} y={138} l="−q" c={COL.bleu} s={18.5}/>
    <Tx x={160} y={188} s={17} ancre="middle" halo={false}>charges opposées, en regard</Tx>
  </Cadre>);
}

// 2) loi des mailles : E = u_R + u_C
export function SvgCarteMaille() {
  return (<Cadre aria="Circuit série : générateur de tension E, résistor R et condensateur C. La tension E du générateur est égale à la somme de la tension u R aux bornes du résistor et de la tension u C aux bornes du condensateur. Le courant i circule dans la boucle." h={206}>
    <Fil pts={[[40, 50], [110, 50]]}/><Fil pts={[[170, 50], [280, 50], [280, 92]]}/>
    <Fil pts={[[280, 120], [280, 170], [40, 170], [40, 118]]}/><Fil pts={[[40, 50], [40, 82]]}/>
    <line x1={26} y1={82} x2={54} y2={82} stroke={COL.txt} strokeWidth={3.5}/><line x1={32} y1={100} x2={48} y2={100} stroke={COL.txt} strokeWidth={7}/>
    <rect x={110} y={36} width={60} height={28} fill="#fff" stroke={COL.txt} strokeWidth={3}/><Tx x={140} y={57} s={18} ancre="middle" halo={false}>R</Tx>
    <line x1={262} y1={92} x2={298} y2={92} stroke={COL.txt} strokeWidth={5}/><line x1={262} y1={120} x2={298} y2={120} stroke={COL.txt} strokeWidth={5}/>
    <Tx x={246} y={112} s={18} ancre="end">C</Tx>
    <Fleche x1={178} y1={50} x2={214} y2={50} c={COL.rouge} w={3.5} tete={11}/><Tx x={196} y={34} s={18} ancre="middle" c={COL.rouge}>i</Tx>
    <Fleche x1={170} y1={26} x2={110} y2={26} c={COL.bleu} w={3.5} tete={11}/><Ind x={140} y={19} l="u" i="R" c={COL.bleu} s={18.5} ancre="middle"/>
    <Fleche x1={312} y1={128} x2={312} y2={84} c={COL.bleu} w={3.5} tete={11}/><Ind x={300} y={72} l="u" i="C" c={COL.bleu} s={18.5} ancre="middle"/>
    <Fleche x1={14} y1={118} x2={14} y2={66} c={COL.vert} w={3.5} tete={11}/><Tx x={22} y={146} s={19} c={COL.vert}>E</Tx>
    <Ligne x={160} y={195} s={19} parts={[{ t: 'E = ' }, { l: 'u', i: 'R' }, { t: ' + ' }, { l: 'u', i: 'C' }]}/>
  </Cadre>);
}

// 3) charge : courbe qui croît vers E (régimes transitoire et stationnaire)
function courbeCarte(type, x0, y0, w, h, tauPx) { const pts = []; for (let j = 0; j <= 60; j++) { const x = (j / 60) * w; pts.push(`${(x0 + x).toFixed(1)},${(type === 'charge' ? y0 + h - h * (1 - Math.exp(-x / tauPx)) : y0 + h - h * Math.exp(-x / tauPx)).toFixed(1)}`); } return pts.join(' '); }
export function SvgCarteCharge() {
  const x0 = 50, y0 = 32, w = 250, h = 110;
  return (<Cadre aria="Courbe de la tension u C aux bornes du condensateur pendant la charge : elle part de zéro et croît de moins en moins vite vers la valeur E. À gauche, le régime transitoire ; à droite, le régime stationnaire où u C reste égale à E." h={210}>
    <line x1={x0} y1={y0 - 8} x2={x0} y2={y0 + h} stroke={COL.txt} strokeWidth={2}/><line x1={x0} y1={y0 + h} x2={x0 + w + 10} y2={y0 + h} stroke={COL.txt} strokeWidth={2}/>
    <line x1={x0} y1={y0} x2={x0 + w} y2={y0} stroke={COL.gris} strokeWidth={1.8} strokeDasharray="5 4"/>
    <Tx x={x0 - 8} y={y0 + 6} s={18} ancre="end" halo={false}>E</Tx><Tx x={x0 - 8} y={y0 + h + 5} s={16} ancre="end" halo={false}>0</Tx>
    <Tx x={x0 + w + 8} y={y0 + h + 22} s={16} ancre="end" halo={false}>t</Tx>
    <Ind x={x0 + 8} y={y0 - 12} l="u" i="C" c={COL.bleu} s={18.5}/>
    <polyline points={courbeCarte('charge', x0, y0, w, h, 62)} fill="none" stroke={COL.bleu} strokeWidth={3.5}/>
    <line x1={x0 + 118} y1={y0 + h + 4} x2={x0 + 118} y2={y0 - 4} stroke={COL.clair} strokeWidth={1.8} strokeDasharray="3 4"/>
    <Tx x={x0 + 56} y={y0 + h - 10} s={15.5} ancre="middle" halo={false} c={COL.orange}>transitoire</Tx>
    <Tx x={x0 + 186} y={y0 + 38} s={15.5} ancre="middle" halo={false} c={COL.vert}>stationnaire</Tx>
    <Ligne x={160} y={188} s={18.5} parts={[{ l: 'u', i: 'C' }, { t: '(0) = 0 ; ' }, { l: 'u', i: 'C' }, { t: ' → E' }]}/>
  </Cadre>);
}

// 4) τ : 63 %, tangente à l'origine, 5τ (charge)
export function SvgCarteTau() {
  const x0 = 50, y0 = 26, w = 250, h = 112, tp = 46;
  const X = t => x0 + t * tp, Y = f => y0 + h - f * h;
  return (<Cadre aria="Courbe de charge d'un condensateur avec les repères du temps caractéristique tau : à t égal tau, la tension atteint 63 pour cent de E ; la tangente à l'origine coupe l'asymptote E à t égal tau ; à t égal 5 tau, la charge est pratiquement terminée." h={216}>
    <line x1={x0} y1={y0 - 8} x2={x0} y2={y0 + h} stroke={COL.txt} strokeWidth={2}/><line x1={x0} y1={y0 + h} x2={x0 + w + 10} y2={y0 + h} stroke={COL.txt} strokeWidth={2}/>
    <line x1={x0} y1={Y(1)} x2={x0 + w} y2={Y(1)} stroke={COL.gris} strokeWidth={1.8} strokeDasharray="5 4"/>
    <Tx x={x0 - 8} y={Y(1) + 6} s={18} ancre="end" halo={false}>E</Tx>
    <polyline points={courbeCarte('charge', x0, y0, w, h, tp)} fill="none" stroke={COL.bleu} strokeWidth={3.5}/>
    <line x1={x0} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke={COL.vert} strokeWidth={2.4} strokeDasharray="8 4"/>
    <line x1={x0} y1={Y(0.632)} x2={X(1)} y2={Y(0.632)} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4"/>
    <line x1={X(1)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4"/>
    <circle cx={X(1)} cy={Y(0.632)} r={5.5} fill={COL.orange}/>
    <line x1={X(5)} y1={Y(0)} x2={X(5)} y2={Y(0.993)} stroke={COL.vert} strokeWidth={1.8} strokeDasharray="2 4"/>
    <Tx x={X(1)} y={Y(0) + 20} s={17} ancre="middle" c={COL.orange} halo={false}>τ</Tx><Tx x={X(5)} y={Y(0) + 20} s={17} ancre="middle" c={COL.vert} halo={false}>5τ</Tx>
    <Tx x={X(1) + 12} y={Y(0.632) + 22} s={15.5} c={COL.orange}>63 % de E</Tx>
    <Tx x={X(1) + 10} y={19} s={15.5} c={COL.vert} ancre="start">tangente</Tx>
    <Tx x={X(5) - 4} y={Y(0.993) + 22} s={15.5} c={COL.vert} ancre="end">99 %</Tx>
    <Tx x={160} y={208} s={18} ancre="middle" halo={false}>τ = R × C</Tx>
  </Cadre>);
}

// 5) décharge : courbe qui décroît de E vers 0, 37 % à t = τ
export function SvgCarteDecharge() {
  const x0 = 50, y0 = 30, w = 250, h = 100, tp = 46, X = t => x0 + t * tp, Y = f => y0 + h - f * h;
  return (<Cadre aria="Courbe de décharge d'un condensateur : la tension u C part de E et décroît de moins en moins vite vers zéro. À t égal tau, elle vaut 37 pour cent de E. La tangente à l'origine coupe l'axe du temps à t égal tau." h={192}>
    <line x1={x0} y1={y0 - 8} x2={x0} y2={y0 + h} stroke={COL.txt} strokeWidth={2}/><line x1={x0} y1={y0 + h} x2={x0 + w + 10} y2={y0 + h} stroke={COL.txt} strokeWidth={2}/>
    <Tx x={x0 - 8} y={Y(1) + 6} s={18} ancre="end" halo={false}>E</Tx><Tx x={x0 - 8} y={Y(0) + 5} s={16} ancre="end" halo={false}>0</Tx>
    <polyline points={courbeCarte('decharge', x0, y0, w, h, tp)} fill="none" stroke={COL.bleu} strokeWidth={3.5}/>
    <line x1={x0} y1={Y(1)} x2={X(1)} y2={Y(0)} stroke={COL.vert} strokeWidth={2.4} strokeDasharray="8 4"/>
    <line x1={x0} y1={Y(0.368)} x2={X(1)} y2={Y(0.368)} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4"/>
    <line x1={X(1)} y1={Y(0)} x2={X(1)} y2={Y(0.368)} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4"/>
    <circle cx={X(1)} cy={Y(0.368)} r={5.5} fill={COL.orange}/>
    <Tx x={X(1)} y={Y(0) + 20} s={18} ancre="middle" c={COL.orange} halo={false}>τ</Tx>
    <Tx x={X(1) + 12} y={Y(0.368) - 8} s={15.5} c={COL.orange}>37 % de E</Tx>
    <Tx x={X(1) + 8} y={Y(0) - 8} s={15.5} c={COL.vert}>tangente</Tx>
    <Ind x={x0 + 8} y={y0 - 12} l="u" i="C" c={COL.bleu} s={18.5}/>
    <Ligne x={160} y={176} s={18.5} parts={[{ l: 'u', i: 'C' }, { t: '(0) = E ; ' }, { l: 'u', i: 'C' }, { t: ' → 0' }]}/>
  </Cadre>);
}

// 6) capteur capacitif de niveau : le niveau monte, C augmente, τ augmente
export function SvgCarteCapteur() {
  const cuve = (x0, niveau, etiq) => (
    <g>
      <rect x={x0} y={34} width={86} height={104} fill="#fff" stroke={COL.txt} strokeWidth={3}/>
      <rect x={x0 + 2} y={138 - niveau} width={82} height={niveau} fill="#bae6fd"/>
      <line x1={x0 + 2} y1={138 - niveau} x2={x0 + 84} y2={138 - niveau} stroke={COL.bleu} strokeWidth={2}/>
      <line x1={x0 + 12} y1={14} x2={x0 + 12} y2={134} stroke={COL.txt} strokeWidth={5}/>
      <line x1={x0 + 74} y1={14} x2={x0 + 74} y2={134} stroke={COL.txt} strokeWidth={5}/>
      <Tx x={x0 + 43} y={160} s={16} ancre="middle" halo={false}>{etiq}</Tx>
    </g>);
  return (<Cadre aria="Capteur capacitif de niveau : deux électrodes plongent dans une cuve et forment un condensateur. À gauche, niveau bas : capacité C faible. À droite, niveau haut : capacité C plus grande, donc temps caractéristique tau plus grand." h={226}>
    {cuve(22, 36, 'niveau bas')}{cuve(212, 84, 'niveau haut')}
    <Fleche x1={122} y1={92} x2={198} y2={92} c={COL.rouge} w={3.5} tete={11}/>
    <Tx x={160} y={80} s={16} ancre="middle" halo={false} c={COL.rouge}>niveau ↑</Tx>
    <Tx x={65} y={184} s={17} ancre="middle" halo={false}>C petite</Tx>
    <Tx x={255} y={184} s={17} ancre="middle" halo={false}>C grande</Tx>
    <Tx x={160} y={214} s={18} ancre="middle" halo={false}>τ = R × C augmente avec C</Tx>
  </Cadre>);
}

// ====================================================
//  CAPTEUR DE NIVEAU (étape « capteur » du parcours) : deux électrodes plongent dans une cuve ; le liquide monte avec le niveau (0 à 1).
// ====================================================
export function SceneCapteur({ niveau = 0.5, aria }) {
  const h = 20 + niveau * 90;
  return (
    <svg viewBox="0 0 200 170" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 170, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <rect x={40} y={36} width={120} height={116} fill="#fff" stroke={COL.txt} strokeWidth={3}/>
      <rect x={42} y={150 - h} width={116} height={h} fill="#bae6fd"/>
      <line x1={42} y1={150 - h} x2={158} y2={150 - h} stroke={COL.bleu} strokeWidth={2.5}/>
      <line x1={64} y1={10} x2={64} y2={146} stroke={COL.txt} strokeWidth={6}/>
      <line x1={136} y1={10} x2={136} y2={146} stroke={COL.txt} strokeWidth={6}/>
      <Tx x={100} y={152 - h / 2 + 6} s={17} ancre="middle" halo={false} c={COL.bleu}>liquide</Tx>
    </svg>);
}
