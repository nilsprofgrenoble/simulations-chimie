// Schémas de la simulation 227 (panneau photovoltaïque, TSTL PCM) : montage avec instruments, graphiques I(U) et P(U), cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans les aria-label des scènes du parcours.
import * as M from './panneauPvModele';

const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', fil: '#334155', grille: '#e2e8f0' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const virg = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
// affichage d'un instrument : 3 chiffres significatifs, virgule décimale
export const aff3 = x => (x === 0 ? '0,00' : String(Number(Number(x).toPrecision(3))).replace('.', ',')).replace(/^(\d+)$/, '$1');
export function affInstrument(x) {
  if (x === 0) return '0,00';
  const s = Number(x).toPrecision(3);
  const n = Number(s);
  if (n >= 100) return String(Math.round(n));
  return s.includes('e') ? String(n).replace('.', ',') : s.replace('.', ',');
}

// ═════════ Axes gradués : maxima « ronds » et pas des graduations ═════════
const NICE = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10];
export function maxRond(x) { const e = 10 ** Math.floor(Math.log10(x)); for (const m of NICE) if (m * e >= x * 0.999) return m * e; return 10 * e; }
export function pasGrad(max) {
  for (let k = -4; k <= 4; k++) for (const m of [1, 2, 2.5, 5]) { const s = m * 10 ** k, n = max / s; if (n >= 3 && n <= 6.01) return s; }
  return max / 4;
}
const decimales = s => { for (let d = 0; d < 5; d++) if (Math.abs(s * 10 ** d - Math.round(s * 10 ** d)) < 1e-9) return d; return 3; };
export function axesPanneau(p) {
  const Umax = maxRond(M.tensionVide(p, 1000) * 1.02), Imax = maxRond(1000 * M.courantCC(p, 1000) * 1.1), Pmax = maxRond(M.pointPmax(p, 1000).P * 1.1);
  return { Umax, Imax, Pmax };
}

// ═════════ Scène : montage avec lampe, panneau, résistance et, selon l'étape, ampèremètre et voltmètre ═════════
//  instr : instruments visibles ; U (V) et I (A) : lectures ; R (Ω, 0 ou Infinity possibles) ; ajustable : R réglable (flèche) ; E : éclairement affiché (W/m²)
function Multimetre({ x, y, lettre, lecture }) {
  return (
    <g>
      <rect x={x} y={y} width="92" height="52" rx="8" fill="#f1f5f9" stroke={COL.fil} strokeWidth="3"/>
      <rect x={x + 6} y={y + 6} width="80" height="24" rx="3" fill="#ecfccb" stroke="#65a30d" strokeWidth="1.5"/>
      <text x={x + 46} y={y + 24.5} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>{lecture}</text>
      <text x={x + 46} y={y + 46} textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.bleu}>{lettre}</text>
    </g>);
}
export function SceneCircuit({ E, instr = false, U = 0, I = 0, R = 100, ajustable = false }) {
  const ouvert = !isFinite(R), fil = R === 0;
  const fil1 = { stroke: COL.fil, strokeWidth: 3, fill: 'none', strokeLinejoin: 'round' };
  const txtR = ouvert ? 'R infinie (circuit ouvert)' : fil ? 'R = 0 (fil de connexion)' : `R = ${String(R).replace('.', ',')} Ω`;
  return (
    <svg viewBox="0 0 400 332" style={base} role="img"
      aria-label={`Montage : une lampe éclaire un panneau photovoltaïque de 6 cellules, éclairement ${E} W par mètre carré. Le panneau alimente une résistance R${instr ? ', avec un ampèremètre en série et un voltmètre aux bornes du panneau' : ''}.`}>
      {/* lampe et rayons */}
      <circle cx="195" cy="34" r="15" fill="#fef08a" stroke="#b45309" strokeWidth="2.5"/>
      <rect x="187" y="49" width="16" height="10" rx="2" fill="#94a3b8" stroke={COL.fil} strokeWidth="1.5"/>
      <text x="168" y="40" textAnchor="end" fontSize="18" fill={COL.gris}>lampe</text>
      {[[160, 66, 142, 104], [195, 66, 195, 104], [230, 66, 248, 104]].map(([a, b, c, d], i) => (
        <g key={i}><line x1={a} y1={b} x2={c} y2={d - 6} stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 4"/><polygon points={`${c - 5},${d - 8} ${c + 5},${d - 8} ${c},${d}`} fill="#f59e0b"/></g>))}
      <text x="250" y="84" fontSize="18" fontWeight="700" fill={COL.orange}>E = {E} W/m²</text>
      {/* panneau */}
      <rect x="125" y="108" width="140" height="42" rx="3" fill="#1e3a8a" stroke="#0f172a" strokeWidth="2"/>
      {[0, 1, 2, 3, 4, 5].map(k => <rect key={k} x={129 + k * 22.3} y="112" width="19.5" height="34" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>)}
      <text x="195" y="168" textAnchor="middle" fontSize="18" fill={COL.gris}>panneau (6 cellules)</text>
      <text x="274" y="122" fontSize="18" fontWeight="800" fill={COL.rouge}>+</text>
      <text x="113" y="122" textAnchor="end" fontSize="22" fontWeight="800" fill={COL.bleu}>−</text>
      {/* fils : − du panneau vers la gauche, + vers la droite */}
      <path d="M 125 129 L 60 129 L 60 276 L 165 276" {...fil1}/>
      <path d={instr ? 'M 265 129 L 335 129 L 335 170 M 335 222 L 335 276 L 235 276' : 'M 265 129 L 335 129 L 335 276 L 235 276'} {...fil1}/>
      {/* résistance de charge */}
      {fil && <path d="M 165 276 L 235 276" {...fil1}/>}
      {ouvert && <g><line x1="165" y1="276" x2="222" y2="252" stroke={COL.fil} strokeWidth="3" strokeLinecap="round"/><circle cx="165" cy="276" r="4" fill={COL.fil}/><circle cx="235" cy="276" r="4" fill={COL.fil}/></g>}
      {!ouvert && !fil && <g><rect x="165" y="264" width="70" height="24" fill="white" stroke={COL.fil} strokeWidth="3"/>
        {ajustable && <g><line x1="170" y1="298" x2="230" y2="254" stroke={COL.orange} strokeWidth="3"/><polygon points="230,254 220,255 226,263" fill={COL.orange}/></g>}</g>}
      <text x="200" y="320" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>{txtR}</text>
      {/* instruments */}
      {instr && <g>
        <path d="M 280 129 L 280 212 L 240 212 M 148 212 L 100 212 L 100 129" {...fil1}/>
        <circle cx="100" cy="129" r="4" fill={COL.fil}/><circle cx="280" cy="129" r="4" fill={COL.fil}/>
        <Multimetre x={148} y={186} lettre="V" lecture={`${affInstrument(U)} V`}/>
        <Multimetre x={289} y={170} lettre="A" lecture={`${affInstrument(1000 * I)} mA`}/>
        <polygon points="124,270 110,276 124,282" fill={COL.fil}/>
        <text x="117" y="262" textAnchor="middle" fontSize="19" fontWeight="800" fontStyle="italic" fill={COL.encre}>I</text>
      </g>}
    </svg>);
}

// ═════════ Graphiques I(U) et P(U) ═════════
//  courbes : [{ E, coul, tirets, nom }] ; pts : [{ U, y }] points mesurés ; courant : { U, y } point de fonctionnement ; ideale : U0 (V) ou null
function Cadre({ axes, Ymax, titreY, formatY, children }) {
  const X0 = 56, X1 = 388, Y0 = 30, Y1 = 206;
  const px = v => X0 + (v / axes.Umax) * (X1 - X0), py = v => Y1 - (v / Ymax) * (Y1 - Y0);
  const su = pasGrad(axes.Umax), sy = pasGrad(Ymax), du = decimales(su), dy = decimales(sy);
  const gu = [], gy = [];
  for (let v = 0; v <= axes.Umax + 1e-9; v += su) gu.push(Number(v.toFixed(6)));
  for (let v = 0; v <= Ymax + 1e-9; v += sy) gy.push(Number(v.toFixed(6)));
  return (<>
    {gy.map(v => <g key={`y${v}`}><line x1={X0} y1={py(v)} x2={X1} y2={py(v)} stroke={COL.grille} strokeWidth="1.5"/><text x={X0 - 6} y={py(v) + 5} textAnchor="end" fontSize="18" fill={COL.gris}>{virg(v, dy)}</text></g>)}
    {gu.map(v => <g key={`x${v}`}><line x1={px(v)} y1={Y1} x2={px(v)} y2={Y1 + 5} stroke={COL.gris} strokeWidth="1.5"/><text x={px(v)} y={Y1 + 23} textAnchor="middle" fontSize="18" fill={COL.gris}>{virg(v, du)}</text></g>)}
    <line x1={X0} y1={Y0 - 4} x2={X0} y2={Y1} stroke={COL.encre} strokeWidth="2"/><line x1={X0} y1={Y1} x2={X1 + 4} y2={Y1} stroke={COL.encre} strokeWidth="2"/>
    <text x={X0} y="17" fontSize="18" fontWeight="800" fill={COL.encre}>{titreY}</text>
    <text x={X1} y="250" textAnchor="end" fontSize="18" fontWeight="800" fill={COL.encre}>U (V)</text>
    {children(px, py)}
  </>);
}
function chemin(p, E, px, py, f) {
  const uco = M.tensionVide(p, E), pts = [];
  for (let k = 0; k <= 120; k++) { const U = uco * (k / 120) ** 0.5 * 1; const v = f(U); pts.push(`${pts.length ? 'L' : 'M'} ${px(U).toFixed(1)} ${py(v).toFixed(1)}`); }
  return pts.join(' ');
}
export function GrapheIU({ p, courbes = [], pts = [], courant = null, ideale = null, titre }) {
  const axes = axesPanneau(p);
  return (
    <svg viewBox="0 0 400 258" style={base} role="img" aria-label={titre || 'Graphique de l’intensité I en milliampères en fonction de la tension U en volts aux bornes du panneau.'}>
      <Cadre axes={axes} Ymax={axes.Imax} titreY="I (mA)">{(px, py) => (<>
        {ideale !== null && <g><line x1={px(ideale)} y1="34" x2={px(ideale)} y2="206" stroke={COL.rouge} strokeWidth="3" strokeDasharray="7 5"/>
          <text x={px(ideale) - 7} y="50" textAnchor="end" fontSize="18" fontWeight="800" fill={COL.rouge} stroke="white" strokeWidth="4" paintOrder="stroke">source idéale {virg(ideale, 1)} V</text></g>}
        {courbes.map((c, i) => <path key={i} d={chemin(p, c.E, px, py, U => 1000 * M.courant(p, c.E, U))} fill="none" stroke={c.coul || COL.bleu} strokeWidth="3.5" strokeLinejoin="round" strokeDasharray={c.tirets ? '8 6' : undefined}/>)}
        {pts.map((q, i) => <circle key={i} cx={px(q.U)} cy={py(q.y)} r="5.5" fill="#fb923c" stroke="white" strokeWidth="2"/>)}
        {courant && <g><circle cx={px(courant.U)} cy={py(courant.y)} r="8" fill="none" stroke={COL.encre} strokeWidth="3"/><circle cx={px(courant.U)} cy={py(courant.y)} r="3.5" fill={COL.encre}/></g>}
      </>)}</Cadre>
    </svg>);
}
export function GrapheP({ p, courbes = [], pts = [], courant = null, titre }) {
  const axes = axesPanneau(p);
  return (
    <svg viewBox="0 0 400 258" style={base} role="img" aria-label={titre || 'Graphique de la puissance P en watts en fonction de la tension U en volts aux bornes du panneau.'}>
      <Cadre axes={axes} Ymax={axes.Pmax} titreY="P (W)">{(px, py) => (<>
        {courbes.map((c, i) => <path key={i} d={chemin(p, c.E, px, py, U => M.puissance(p, c.E, U))} fill="none" stroke={c.coul || COL.vert} strokeWidth="3.5" strokeLinejoin="round" strokeDasharray={c.tirets ? '8 6' : undefined}/>)}
        {pts.map((q, i) => <circle key={i} cx={px(q.U)} cy={py(q.y)} r="5.5" fill="#fb923c" stroke="white" strokeWidth="2"/>)}
        {courant && <g><circle cx={px(courant.U)} cy={py(courant.y)} r="8" fill="none" stroke={COL.encre} strokeWidth="3"/><circle cx={px(courant.U)} cy={py(courant.y)} r="3.5" fill={COL.encre}/></g>}
      </>)}</Cadre>
    </svg>);
}

// ═════════ Cartes « À retenir » (mini-panneau : valeurs différentes de celles du parcours) ═════════
const MINI = M.PANNEAUX.mini;
function Fond({ children, h = 232, label }) {
  return <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
}
function Ampoule({ x, y, lettre, couleur = COL.bleu }) {
  return <g><circle cx={x} cy={y} r="19" fill="white" stroke={COL.fil} strokeWidth="3"/><text x={x} y={y + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill={couleur}>{lettre}</text></g>;
}

// Carte A : montage, A en série, V en dérivation, P = U × I
export function SvgMontage() {
  const f = { stroke: COL.fil, strokeWidth: 3, fill: 'none', strokeLinejoin: 'round' };
  return (
    <Fond label="Schéma du montage : l’ampèremètre est en série avec la résistance, le voltmètre est en dérivation aux bornes du panneau. Puissance P égale U fois I.">
      <path d="M 110 50 L 211 50 M 249 50 L 350 50 L 350 88 M 350 132 L 350 170 L 110 170 L 110 130 M 110 90 L 110 50" {...f}/>
      <path d="M 150 50 L 150 91 M 150 129 L 150 170" {...f}/>
      <circle cx="150" cy="50" r="4.5" fill={COL.fil}/><circle cx="150" cy="170" r="4.5" fill={COL.fil}/>
      <rect x="98" y="90" width="24" height="40" fill="#bfdbfe" stroke={COL.fil} strokeWidth="3"/>
      <text x="94" y="116" textAnchor="end" fontSize="16" fill={COL.gris}>panneau</text>
      <rect x="338" y="88" width="24" height="44" fill="white" stroke={COL.fil} strokeWidth="3"/>
      <text x="374" y="116" fontSize="18" fontWeight="800" fill={COL.encre}>R</text>
      <Ampoule x={230} y={50} lettre="A" couleur={COL.orange}/>
      <Ampoule x={150} y={110} lettre="V" couleur={COL.bleu}/>
      <text x="230" y="90" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.orange}>A en série</text>
      <text x="170" y="150" fontSize="16" fontWeight="700" fill={COL.bleu}>V en dérivation</text>
      <text x="200" y="202" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>P = U × I</text>
      <text x="200" y="224" textAnchor="middle" fontSize="16" fill={COL.gris}>2,0 V × 50 mA = 100 mW = 0,10 W</text>
    </Fond>);
}

// Cadre commun des cartes B, C, E : courbe I(U) du mini-panneau à 1000 W/m²
function CarteIU({ children, label, h = 232, Ymax = 120, Umax = 2 }) {
  const X0 = 56, X1 = 380, Y0 = 26, Y1 = 170;
  const px = v => X0 + (v / Umax) * (X1 - X0), py = v => Y1 - (v / Ymax) * (Y1 - Y0);
  return (
    <Fond h={h} label={label}>
      <line x1={X0} y1={Y0 - 6} x2={X0} y2={Y1} stroke={COL.encre} strokeWidth="2"/><line x1={X0} y1={Y1} x2={X1 + 6} y2={Y1} stroke={COL.encre} strokeWidth="2"/>
      <text x={X0} y="16" fontSize="16" fontWeight="800" fill={COL.encre}>I (mA)</text>
      <text x={X1 + 8} y={Y1 + 22} textAnchor="end" fontSize="16" fontWeight="800" fill={COL.encre}>U (V)</text>
      {children(px, py)}
    </Fond>);
}
const trace = (p, E, px, py) => chemin(p, E, px, py, U => 1000 * M.courant(p, E, U));
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };

// Carte B : caractéristique avec Icc et Uco
export function SvgCaracteristique() {
  const icc = 1000 * M.courantCC(MINI, 1000), uco = M.tensionVide(MINI, 1000);
  return (
    <CarteIU label="Caractéristique intensité-tension d’un mini-panneau : courant presque constant jusqu’à une tension proche de la tension à vide, puis chute rapide. Icc est le courant à tension nulle, Uco la tension à courant nul.">
      {(px, py) => (<>
        <path d={trace(MINI, 1000, px, py)} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinejoin="round"/>
        <circle cx={px(0)} cy={py(icc)} r="6" fill={COL.orange}/><circle cx={px(uco)} cy={py(0)} r="6" fill={COL.orange}/>
        <text x={px(0) + 12} y={py(icc) - 11} fontSize="16" fontWeight="800" fill={COL.orange}>Icc = {Math.round(icc)} mA</text>
        <text x={px(uco) - 24} y={py(0) - 12} textAnchor="end" fontSize="16" fontWeight="800" fill={COL.orange} {...halo}>Uco = {virg(uco, 2)} V</text>
        <text x={px(0.15)} y={py(60)} fontSize="16" fill={COL.gris}>I presque constant</text>
        <text x={px(1.64)} y={py(58)} textAnchor="end" fontSize="16" fill={COL.gris} {...halo}>chute rapide</text>
        <text x="200" y="206" textAnchor="middle" fontSize="16" fill={COL.encre}>Icc : U = 0 (court-circuit)</text>
        <text x="200" y="226" textAnchor="middle" fontSize="16" fill={COL.encre}>Uco : I = 0 (circuit ouvert)</text>
      </>)}
    </CarteIU>);
}

// Carte C : P = U × I = aire du rectangle sous la courbe ; maximale au coude
export function SvgPuissance() {
  const m = M.pointPmax(MINI, 1000), uPetit = 0.8, iPetit = 1000 * M.courant(MINI, 1000, uPetit);
  return (
    <CarteIU label="Même caractéristique : la puissance P égale U fois I est l’aire du rectangle sous la courbe. Le plus grand rectangle se trouve au coude de la courbe.">
      {(px, py) => (<>
        <rect x={px(0)} y={py(1000 * m.I)} width={px(m.U) - px(0)} height={py(0) - py(1000 * m.I)} fill="#fed7aa" fillOpacity="0.75" stroke={COL.orange} strokeWidth="2.5"/>
        <rect x={px(0)} y={py(iPetit)} width={px(uPetit) - px(0)} height={py(0) - py(iPetit)} fill="none" stroke={COL.gris} strokeWidth="2.5" strokeDasharray="6 4"/>
        <path d={trace(MINI, 1000, px, py)} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinejoin="round"/>
        <circle cx={px(m.U)} cy={py(1000 * m.I)} r="6.5" fill={COL.rouge}/>
        <text x={px(1.2)} y={py(46)} textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.orange}>aire = P</text>
        <text x={px(uPetit) / 2 + px(0) / 2 - 2} y={py(10) + 2} textAnchor="middle" fontSize="16" fill={COL.gris}>plus petit</text>
        <text x="200" y="206" textAnchor="middle" fontSize="16" fill={COL.encre}>Pmax : le plus grand rectangle</text>
        <text x="200" y="226" textAnchor="middle" fontSize="16" fill={COL.rouge}>au coude : {virg(m.U, 2)} V × {Math.round(1000 * m.I)} mA ≈ {virg(m.P, 2)} W</text>
      </>)}
    </CarteIU>);
}

// Carte D : source idéale ou panneau
export function SvgIdeale() {
  const X = 24, W = 168, Y0 = 44, Y1 = 150, X2 = 214;
  const ptsPan = []; for (let k = 0; k <= 60; k++) { const u = 0.96 * (k / 60) ** 0.5 + 0; ptsPan.push(u); }
  const cour = u => { const p = MINI, uco = M.tensionVide(p, 1000); return 1000 * M.courant(p, 1000, u * uco) / 96; };
  const dPan = Array.from({ length: 61 }, (_, k) => { const u = (k / 60) ** 0.5; return `${k ? 'L' : 'M'} ${(X2 + 10 + u * (W - 18)).toFixed(1)} ${(Y1 - cour(u) * (Y1 - Y0 - 8)).toFixed(1)}`; }).join(' ');
  const axes = x => (<g><line x1={x} y1={Y0 - 8} x2={x} y2={Y1} stroke={COL.encre} strokeWidth="2"/><line x1={x} y1={Y1} x2={x + W} y2={Y1} stroke={COL.encre} strokeWidth="2"/>
    <text x={x + 4} y={Y0 - 12} fontSize="16" fontWeight="800" fill={COL.encre}>I</text><text x={x + W} y={Y1 + 20} textAnchor="end" fontSize="16" fontWeight="800" fill={COL.encre}>U</text></g>);
  return (
    <Fond h={232} label="Comparaison : la caractéristique d’une source idéale de tension est une droite verticale, tension imposée ; celle d’un panneau est un plateau de courant puis une chute.">
      <text x={X + W / 2} y="22" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.rouge}>source idéale</text>
      <text x={X2 + W / 2} y="22" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.bleu}>panneau</text>
      {axes(X)}{axes(X2)}
      <line x1={X + 100} y1={Y0 - 6} x2={X + 100} y2={Y1} stroke={COL.rouge} strokeWidth="4"/>
      <path d={dPan} fill="none" stroke={COL.bleu} strokeWidth="4" strokeLinejoin="round"/>
      <text x={X + W / 2} y="184" textAnchor="middle" fontSize="16" fill={COL.encre}>U reste fixée</text>
      <text x={X + W / 2} y="205" textAnchor="middle" fontSize="16" fill={COL.gris}>(I varie avec R)</text>
      <text x={X2 + W / 2} y="184" textAnchor="middle" fontSize="16" fill={COL.encre}>I presque fixé</text>
      <text x={X2 + W / 2} y="205" textAnchor="middle" fontSize="16" fill={COL.gris}>(U varie avec R)</text>
    </Fond>);
}

// Carte E : effet de l'éclairement
export function SvgEclairement() {
  const E2 = 500, i1 = 1000 * M.courantCC(MINI, 1000), i2 = 1000 * M.courantCC(MINI, E2), u1 = M.tensionVide(MINI, 1000), u2 = M.tensionVide(MINI, E2);
  return (
    <CarteIU label="Effet de l’éclairement : quand l’éclairement est divisé par 2, le courant de court-circuit est divisé par 2 mais la tension à vide ne baisse que de quelques pour cent.">
      {(px, py) => (<>
        <path d={trace(MINI, 1000, px, py)} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinejoin="round"/>
        <path d={trace(MINI, E2, px, py)} fill="none" stroke={COL.orange} strokeWidth="3.5" strokeLinejoin="round"/>
        <text x={px(0.9)} y={py(i1) - 9} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.bleu}>E = 1000 W/m²</text>
        <text x={px(0.9)} y={py(i2) - 9} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>E = 500 W/m²</text>
        <circle cx={px(u1)} cy={py(0)} r="5" fill={COL.bleu}/><circle cx={px(u2)} cy={py(0)} r="5" fill={COL.orange}/>
        <text x="200" y="206" textAnchor="middle" fontSize="16" fill={COL.encre}>Icc : {Math.round(i1)} → {Math.round(i2)} mA (÷ 2)</text>
        <text x="200" y="226" textAnchor="middle" fontSize="16" fill={COL.encre}>Uco : {virg(u1, 2)} → {virg(u2, 2)} V (− {Math.round(100 * (1 - u2 / u1))} %)</text>
      </>)}
    </CarteIU>);
}
