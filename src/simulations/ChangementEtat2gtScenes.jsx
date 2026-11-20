// Scènes de la simulation 195 « Changement d'état : équation, transfert thermique et énergie » (2GT).
// Schémas SVG : textes de 18 (viewBox de 480) à 13,5 (viewBox de 300), plafonnés à maxWidth 480 (scènes) ou 320 (cartes) ; couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège.
// Les molécules sont des disques (pas à l'échelle) ; les dessins ne sont pas des photographies.
import { KIT } from "../commun";
import * as M from "./changementEtat2gtModele";
import { COL } from "./changementEtat2gtCouleurs";

const MOL = { fond: '#bfdbfe', trait: '#1d4ed8' };         // une molécule d'eau
const SUC = { fond: '#fed7aa', trait: '#c2410c' };         // une entité de sucre
const stl = (max = 480) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 10 });
const Tete = ({ x, y, c = COL.gris, dir = 'droite' }) => (dir === 'haut' ? <polygon points={`${x},${y} ${x - 6},${y + 10} ${x + 6},${y + 10}`} fill={c} />
  : dir === 'bas' ? <polygon points={`${x},${y} ${x - 6},${y - 10} ${x + 6},${y - 10}`} fill={c} />
  : dir === 'gauche' ? <polygon points={`${x},${y} ${x + 10},${y - 6} ${x + 10},${y + 6}`} fill={c} />
  : <polygon points={`${x},${y} ${x - 10},${y - 6} ${x - 10},${y + 6}`} fill={c} />);

// ---------- positions des molécules dans une boîte de 100 × 100 ----------
const POS = {   // 8 molécules dans chaque état : leur nombre ne change pas, seules la disposition et les distances changent
  s: [[20, 58], [40, 58], [60, 58], [80, 58], [20, 80], [40, 80], [60, 80], [80, 80]],
  l: [[16, 52], [39, 48], [62, 54], [84, 50], [24, 74], [48, 72], [72, 76], [36, 92]],
  g: [[11, 21], [88, 12], [40, 26], [64, 41], [77, 80], [17, 49], [43, 78], [15, 81]],
};
// Un nuage de molécules (boîte de 100 × 100 agrandie à `taille`)
export function Molecules({ etat, x = 0, y = 0, taille = 100, couleur = MOL, rayon = 8, points = null }) {
  const k = taille / 100;
  return <g transform={`translate(${x} ${y}) scale(${k})`}>{(points || POS[etat]).map(([px, py], i) => <circle key={i} cx={px} cy={py} r={rayon} fill={couleur.fond} stroke={couleur.trait} strokeWidth="1.6" />)}</g>;
}

// ---------- étape 1 : l'eau sous ses trois états ----------
export function SceneTroisEtats() {
  const cadre = (x, titre, sous, children) => (
    <g><rect x={x} y={8} width={148} height={206} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <g transform={`translate(${x - 6} 0)`}>{children}</g>
      <text x={x + 74} y={172} textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>{titre}</text>
      <text x={x + 74} y={198} textAnchor="middle" fontSize="18" fill={COL.gris}>{sous}</text></g>);
  return (
    <svg viewBox="0 0 480 222" style={stl()} role="img" aria-label="L’eau sous trois états : un glaçon (état solide), de l’eau dans un verre (état liquide), de la vapeur d’eau au-dessus d’une casserole (état gazeux).">
      {cadre(6, "solide", "glace", <>
        <rect x={42} y={52} width={72} height={72} rx="10" fill="#dbeafe" stroke="#60a5fa" strokeWidth="3" />
        <path d="M54 66l22-6M54 82l10-3" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" /></>)}
      {cadre(166, "liquide", "eau liquide", <>
        <path d="M44 40h70l-8 90H52z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" strokeLinejoin="round" />
        <path d="M49 74q8-7 15 0t15 0t15 0t13 0l-5 56H54z" fill="#7dd3fc" /></>)}
      {cadre(326, "gaz", "vapeur d’eau", <>
        <path d="M54 130h70l-6 18H60z" fill="#cbd5e1" stroke="#475569" strokeWidth="2.5" strokeLinejoin="round" />
        {[62, 89, 116].map(x => <path key={x} d={`M${x} 118q-10-14 0-26t0-26q-8-10 0-20`} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />)}</>)}
    </svg>);
}

// ---------- étapes 2 et 3, carte « les six changements » : trois états et six flèches ----------
// masques : ids de changements dont le nom est remplacé par « ? » ; longues : afficher la sublimation et la condensation solide ;
// colore : flèches orange (le système reçoit de l'énergie) et bleues (il en cède) ; grand : version de scène (viewBox 480), sinon version de carte (viewBox 300)
export function SchemaSix({ masques = [], longues = true, colore = false, grand = false }) {
  const kx = grand ? 1.6 : 1, ky = grand ? 1.1 : 1, fs = grand ? 18 : 14, W = 300 * kx, H = 300 * ky;
  const X = v => v * kx, Y = v => v * ky;
  const nom = id => (masques.includes(id) ? '?' : M.changement(id).nom);
  const cE = colore ? COL.orange : COL.gris, cX = colore ? COL.bleu : COL.gris;
  const boite = (cy, etat, fond) => (
    <g key={etat}><rect x={X(116)} y={Y(cy - 26)} width={X(68)} height={Y(52)} rx="10" fill={fond} stroke={COL.bleu} strokeWidth="2" />
      <text x={X(150)} y={Y(cy) + fs * 0.36} textAnchor="middle" fontSize={fs + 1.5} fontWeight="800" fill={COL.encre}>{M.NOM_ETAT[etat]}</text></g>);
  const yG = 34, yL = 150, yS = 266;
  const vert = (x, y1, y2, c) => <g><line x1={X(x)} y1={Y(y1)} x2={X(x)} y2={Y(y2) + (y2 < y1 ? 8 : -8)} stroke={c} strokeWidth="3" /><Tete x={X(x)} y={Y(y2)} c={c} dir={y2 < y1 ? 'haut' : 'bas'} /></g>;
  const etq = (id, x, y, ancre, c) => <text key={id} x={X(x)} y={Y(y) + fs * 0.35} textAnchor={ancre} fontSize={fs} fontWeight="800" fill={masques.includes(id) ? COL.orange : c}>{nom(id)}</text>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl(grand ? 480 : 320)} role="img" aria-label={`Les trois états de la matière et les changements d’état : fusion (solide vers liquide), solidification (liquide vers solide), vaporisation (liquide vers gaz), liquéfaction (gaz vers liquide), sublimation (solide vers gaz) et condensation solide (gaz vers solide).${masques.length ? ' Certains noms sont à trouver.' : ''}`}>
      {boite(yG, 'g', '#f1f5f9')}{boite(yL, 'l', '#dbeafe')}{boite(yS, 's', '#e0e7ff')}
      {vert(134, 240, 176, cE)}{vert(134, 124, 60, cE)}{vert(166, 60, 124, cX)}{vert(166, 176, 240, cX)}
      {etq('fusion', 126, 208, 'end', cE)}{etq('vaporisation', 126, 92, 'end', cE)}
      {etq('liquefaction', 174, 92, 'start', cX)}{etq('solidification', 174, 208, 'start', cX)}
      {longues && <g>
        <path d={`M${X(116)} ${Y(yS)} H${X(26)} V${Y(yG)} H${X(108)}`} fill="none" stroke={cE} strokeWidth="3" /><Tete x={X(116)} y={Y(yG)} c={cE} dir="droite" />
        <path d={`M${X(184)} ${Y(yG)} H${X(274)} V${Y(yS)} H${X(192)}`} fill="none" stroke={cX} strokeWidth="3" /><Tete x={X(184)} y={Y(yS)} c={cX} dir="gauche" />
        {masques.includes('sublimation') ? <text x={X(26) - fs * 0.9} y={Y(150) + fs * 0.5} textAnchor="middle" fontSize={fs * 1.7} fontWeight="800" fill={COL.orange}>?</text>
          : <text transform={`translate(${X(26) - fs * 0.55} ${Y(150)}) rotate(-90)`} textAnchor="middle" fontSize={fs} fontWeight="800" fill={cE}>{nom('sublimation')}</text>}
        {masques.includes('condensation') ? <text x={X(274) + fs * 0.9} y={Y(150) + fs * 0.5} textAnchor="middle" fontSize={fs * 1.7} fontWeight="800" fill={COL.orange}>?</text>
          : <text transform={`translate(${X(274) + fs * 1.0} ${Y(150)}) rotate(90)`} textAnchor="middle" fontSize={fs} fontWeight="800" fill={cX}>{nom('condensation')}</text>}
      </g>}
    </svg>);
}

// ---------- étape 5 : les trois états à l'échelle des molécules ----------
export function SceneMicro({ legende = true }) {
  const panneaux = [['s', 'solide'], ['l', 'liquide'], ['g', 'gaz']];
  return (
    <svg viewBox="0 0 480 262" style={stl()} role="img" aria-label="Les molécules d’eau dessinées sous trois états. Solide : molécules serrées, disposées en rangées régulières. Liquide : molécules proches mais désordonnées. Gaz : molécules très éloignées les unes des autres.">
      {panneaux.map(([e, t], i) => (
        <g key={e}><rect x={6 + 160 * i} y={6} width={148} height={192} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <Molecules etat={e} x={14 + 160 * i} y={14} taille={132} />
          <text x={80 + 160 * i} y={186} textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>{t}</text></g>))}
      {legende && <g><circle cx={150} cy={232} r={10} fill={MOL.fond} stroke={MOL.trait} strokeWidth="1.6" /><text x={170} y={239} fontSize="18" fill={COL.encre}>= une molécule d’eau, H₂O</text></g>}
    </svg>);
}

// ---------- étape 6 : le milieu et le système (fusion de la glace) ----------
export function SceneTransfert({ ch = 'fusion' }) {
  const endo = M.sens(ch) === 'endo', c = endo ? COL.orange : COL.bleu;
  return (
    <svg viewBox="0 0 480 250" style={stl()} role="img" aria-label="Un système, la glace qui fond, entouré par son milieu. Une flèche orange va du milieu vers le système : le milieu fournit de l’énergie au système.">
      <rect x={6} y={6} width={468} height={238} rx="18" fill="#fff7ed" stroke="#fdba74" strokeWidth="2" />
      <text x={22} y={34} fontSize="19" fontWeight="800" fill={COL.orange}>milieu</text>
      <text x={22} y={56} fontSize="18" fill={COL.gris}>(eau du verre, air)</text>
      <rect x={250} y={62} width={200} height={158} rx="14" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2.5" />
      <text x={350} y={88} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.bleu}>système</text>
      <rect x={316} y={104} width={68} height={68} rx="10" fill="#dbeafe" stroke="#60a5fa" strokeWidth="3" />
      <path d="M326 118l20-5M326 132l9-3" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      <text x={350} y={206} textAnchor="middle" fontSize="18" fill={COL.encre}>la glace</text>
      {endo ? <g><line x1={90} y1={150} x2={234} y2={150} stroke={c} strokeWidth="6" /><Tete x={248} y={150} c={c} dir="droite" /><text x={160} y={138} textAnchor="middle" fontSize="19" fontWeight="800" fill={c}>énergie</text></g>
        : <g><line x1={248} y1={150} x2={102} y2={150} stroke={c} strokeWidth="6" /><Tete x={88} y={150} c={c} dir="gauche" /><text x={168} y={138} textAnchor="middle" fontSize="19" fontWeight="800" fill={c}>énergie</text></g>}
    </svg>);
}

// ---------- étape 7 : fusion et dissolution côte à côte ----------
export function SceneDissolution() {
  const sucre = [[36, 36], [70, 70]];
  const eauMel = [[18, 20], [52, 14], [86, 22], [20, 54], [52, 52], [88, 56], [18, 88], [54, 86], [84, 88]];
  return (
    <svg viewBox="0 0 480 270" style={stl()} role="img" aria-label="À gauche, la fusion de la glace : les molécules d’eau passent d’un état rangé à un état désordonné, c’est toujours de l’eau. À droite, le sucre dans l’eau : les entités de sucre, en orange, se séparent et se mêlent aux molécules d’eau, en bleu ; l’eau reste liquide.">
      <rect x={6} y={6} width={228} height={258} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" /><rect x={246} y={6} width={228} height={258} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <text x={120} y={32} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>glaçon qui fond</text>
      <Molecules etat="s" x={16} y={46} taille={86} rayon={7} /><Tete x={113} y={110} c={COL.gris} dir="droite" /><line x1={106} y1={110} x2={104} y2={110} stroke={COL.gris} strokeWidth="3" /><Molecules etat="l" x={130} y={46} taille={86} rayon={7} />
      <text x={59} y={150} textAnchor="middle" fontSize="18" fill={COL.encre}>glace</text><text x={173} y={150} textAnchor="middle" fontSize="18" fill={COL.encre}>eau liquide</text>
      <text x={120} y={196} textAnchor="middle" fontSize="18" fill={COL.encre}>un seul corps : l’eau</text><text x={120} y={222} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.vert}>il change d’état</text>
      <text x={360} y={32} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>sucre dans l’eau</text>
      <g transform="translate(262 46)"><rect x={0} y={0} width={64} height={64} rx="8" fill={SUC.fond} stroke={SUC.trait} strokeWidth="2.5" /><text x={32} y={39} textAnchor="middle" fontSize="18" fontWeight="700" fill={SUC.trait}>sucre</text></g>
      <Tete x={346} y={78} c={COL.gris} dir="droite" /><line x1={330} y1={78} x2={336} y2={78} stroke={COL.gris} strokeWidth="3" />
      <g transform="translate(356 42)"><rect x={0} y={0} width={104} height={104} rx="8" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1.5" />
        <Molecules x={2} y={2} taille={100} rayon={7} points={eauMel} /><Molecules x={2} y={2} taille={100} rayon={9} couleur={SUC} points={sucre} /></g>
      <text x={290} y={150} textAnchor="middle" fontSize="18" fill={COL.encre}>sucre</text><text x={408} y={162} textAnchor="middle" fontSize="18" fill={COL.encre}>mélange</text>
      <text x={360} y={196} textAnchor="middle" fontSize="18" fill={COL.encre}>deux corps mélangés</text><text x={360} y={222} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.orange}>on change de mélange</text>
    </svg>);
}

// ---------- étape 8 : énergie et masse de glace (trois mesures) ----------
export function SceneProportion() {
  const pts = [[0.10, 33], [0.20, 67], [0.30, 100]];
  const x0 = 78, y0 = 214, X = m => x0 + m * 1000 * 1.0, Y = e => y0 - e * 1.5;
  return (
    <svg viewBox="0 0 480 270" style={stl()} role="img" aria-label="Graphique : énergie nécessaire pour faire fondre de la glace, en fonction de la masse. Trois points alignés avec l’origine : 0,10 kilogramme, 33 kilojoules ; 0,20 kilogramme, 67 kilojoules ; 0,30 kilogramme, 100 kilojoules.">
      <line x1={x0} y1={y0} x2={x0 + 360} y2={y0} stroke={COL.encre} strokeWidth="2" /><line x1={x0} y1={y0} x2={x0} y2={14} stroke={COL.encre} strokeWidth="2" />
      <Tete x={x0 + 372} y={y0} c={COL.encre} dir="droite" /><Tete x={x0} y={6} c={COL.encre} dir="haut" />
      {[0.1, 0.2, 0.3].map(m => <g key={m}><line x1={X(m)} y1={y0} x2={X(m)} y2={y0 + 7} stroke={COL.encre} strokeWidth="2" /><text x={X(m)} y={y0 + 28} textAnchor="middle" fontSize="18" fill={COL.encre}>{M.nombreFR(m, 2)}</text></g>)}
      <text x={x0 + 190} y={y0 + 52} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>masse de glace (kg)</text>
      <text transform={`translate(22 ${y0 - 90}) rotate(-90)`} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>énergie (kJ)</text>
      <line x1={x0} y1={y0} x2={X(0.3)} y2={Y(100)} stroke={COL.bleu} strokeWidth="2.5" strokeDasharray="7 5" />
      {pts.map(([m, e]) => <g key={m}><circle cx={X(m)} cy={Y(e)} r={7} fill={COL.orange} stroke="white" strokeWidth="2" /><text x={X(m) + 12} y={Y(e) + 22} fontSize="18" fontWeight="800" fill={COL.orange}>{e} kJ</text></g>)}
    </svg>);
}

// ---------- étape 9, carte : la formule E = m × L ----------
export function SceneFormule() {
  const casier = (x, w, lettre, mot, unite, c) => (
    <g><rect x={x} y={34} width={w} height={64} rx="12" fill="white" stroke={c} strokeWidth="3" /><text x={x + w / 2} y={78} textAnchor="middle" fontSize="38" fontWeight="800" fill={c}>{lettre}</text>
      <text x={x + w / 2} y={128} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>{mot}</text><text x={x + w / 2} y={152} textAnchor="middle" fontSize="18" fill={COL.gris}>{unite}</text></g>);
  return (
    <svg viewBox="0 0 480 180" style={stl()} role="img" aria-label="La relation E égale m fois L. E est l’énergie échangée en kilojoules, m la masse qui change d’état en kilogrammes, L l’énergie massique de changement d’état en kilojoules par kilogramme.">
      {casier(10, 120, "E", "énergie", "en kJ", COL.orange)}
      <text x={148} y={78} textAnchor="middle" fontSize="34" fontWeight="800" fill={COL.encre}>=</text>
      {casier(166, 120, "m", "masse", "en kg", COL.bleu)}
      <text x={304} y={78} textAnchor="middle" fontSize="34" fontWeight="800" fill={COL.encre}>×</text>
      {casier(322, 148, "L", "énergie massique", "en kJ/kg", COL.vert)}
    </svg>);
}

// ---------- étape 11 : deux masses d'eau de 20 g ----------
export function SceneOrdre() {
  return (
    <svg viewBox="0 0 480 230" style={stl()} role="img" aria-label="Deux situations avec 20 grammes d’eau. À gauche, un glaçon de 20 grammes à 0 degré Celsius qui fond : exemple résolu, 6,7 kilojoules. À droite, 20 grammes d’eau à 100 degrés Celsius qui se vaporisent : énergie à calculer.">
      <rect x={6} y={6} width={228} height={218} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" /><rect x={246} y={6} width={228} height={218} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x={80} y={34} width={56} height={56} rx="9" fill="#dbeafe" stroke="#60a5fa" strokeWidth="3" /><path d="M90 46l16-5M90 59l8-2" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      <text x={120} y={126} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>20 g de glace</text><text x={120} y={150} textAnchor="middle" fontSize="18" fill={COL.gris}>à 0 °C : fusion</text>
      <text x={120} y={196} textAnchor="middle" fontSize="22" fontWeight="800" fill={COL.vert}>E = 6,7 kJ</text>
      <path d="M312 78h70l-6 18h-58z" fill="#cbd5e1" stroke="#475569" strokeWidth="2.5" strokeLinejoin="round" />
      {[322, 347, 372].map(x => <path key={x} d={`M${x} 68q-9-12 0-22t0-22`} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />)}
      <text x={360} y={126} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>20 g d’eau</text><text x={360} y={150} textAnchor="middle" fontSize="18" fill={COL.gris}>à 100 °C : vaporisation</text>
      <text x={360} y={196} textAnchor="middle" fontSize="22" fontWeight="800" fill={COL.orange}>E = ?</text>
    </svg>);
}

// ---------- exploration : palier de température et masse transformée ----------
// E : énergie échangée (kJ) ; Etot : énergie pour tout transformer ; T : température de changement d'état
export function CourbePalier({ cid, chid, m, E }) {
  const ch = M.changement(chid), l = M.L(cid, chid), T = M.T(cid, chid), Etot = M.energie(m, l);
  const x0 = 78, x1 = 366, xMax = 462, yT = 112, yBas = 214, yHaut = 18;
  const xE = x0 + (x1 - x0) * Math.min(1, E / Etot), f = Math.min(1, E / Etot);
  const verbe = M.sens(chid) === 'endo' ? 'fournie' : 'cédée';
  const eT = M.CORPS[cid];
  return (
    <svg viewBox="0 0 480 350" style={stl()} role="img" aria-label={`Courbe de la température en fonction de l’énergie ${verbe} pour ${m} kg de ${eT.nom} : un palier à ${T} degrés Celsius pendant tout le changement d’état. Énergie ${verbe} : ${M.nombreFR(E, 1)} kilojoules sur ${M.nombreFR(Etot, 1)}.`}>
      <line x1={x0} y1={yBas} x2={xMax} y2={yBas} stroke={COL.encre} strokeWidth="2" /><line x1={x0} y1={yBas} x2={x0} y2={yHaut} stroke={COL.encre} strokeWidth="2" />
      <Tete x={xMax + 8} y={yBas} c={COL.encre} dir="droite" /><Tete x={x0} y={yHaut - 8} c={COL.encre} dir="haut" />
      <text transform={`translate(24 ${(yBas + yHaut) / 2}) rotate(-90)`} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>température (°C)</text>
      <text x={(x0 + xMax) / 2} y={yBas + 52} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>énergie {verbe} (kJ)</text>
      <line x1={x0 - 6} y1={yT} x2={x0 + 6} y2={yT} stroke={COL.encre} strokeWidth="2" /><text x={x0 - 10} y={yT + 6} textAnchor="end" fontSize="18" fontWeight="800" fill={COL.orange}>{M.nombreFR(T)}</text>
      <path d={`M${x0} ${yBas - 26} L${x0 + 2} ${yT}`} stroke={COL.clair} strokeWidth="3" strokeDasharray="5 5" fill="none" />
      <line x1={x0 + 2} y1={yT} x2={x1} y2={yT} stroke={COL.bleu} strokeWidth="5" strokeLinecap="round" />
      <path d={`M${x1} ${yT} L${x1 + 50} ${yHaut + 30}`} stroke={COL.clair} strokeWidth="3" strokeDasharray="5 5" fill="none" />
      <text x={476} y={yHaut + 70} textAnchor="end" fontSize="16" fill={COL.gris}>non étudié</text>
      <line x1={x0} y1={yBas} x2={x0} y2={yBas + 7} stroke={COL.encre} strokeWidth="2" /><text x={x0} y={yBas + 28} textAnchor="middle" fontSize="18" fill={COL.encre}>0</text>
      <line x1={x1} y1={yBas} x2={x1} y2={yBas + 7} stroke={COL.encre} strokeWidth="2" /><text x={x1} y={yBas + 28} textAnchor="middle" fontSize="18" fill={COL.encre}>{M.nombreFR(Etot)}</text>
      <line x1={xE} y1={yT} x2={xE} y2={yBas} stroke={COL.orange} strokeWidth="2.5" strokeDasharray="6 4" /><circle cx={xE} cy={yT} r={8} fill={COL.orange} stroke="white" strokeWidth="2.5" />
      <g transform="translate(78 312)"><rect x={0} y={0} width={288} height={24} rx="6" fill="#e2e8f0" stroke={COL.gris} strokeWidth="1.5" />
        <rect x={0} y={0} width={288 * (1 - f)} height={24} rx="6" fill="#c7d2fe" /><rect x={288 * (1 - f)} y={0} width={288 * f} height={24} rx="6" fill="#7dd3fc" />
        <text x={0} y={-6} fontSize="18" fill={COL.encre}>{M.NOM_ETAT[ch.de]} : {Math.round((1 - f) * 100)} %</text>
        <text x={288} y={-6} textAnchor="end" fontSize="18" fill={COL.encre}>{M.NOM_ETAT[ch.vers]} : {Math.round(f * 100)} %</text></g>
    </svg>);
}

// ---------- tableau des corps (étape 10 et exploration) ----------
export function TableauCorps({ lignes = M.LISTE_CORPS }) {
  const cel = { padding: '5px 8px', border: `1px solid ${KIT.bord}`, fontSize: 15, textAlign: 'center', color: KIT.txt };
  const th = { ...cel, background: '#f1f5f9', fontWeight: 700 };
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white' }} data-tableau-corps="1">
      <thead><tr><th style={th}>corps</th><th style={th}>L de fusion (kJ/kg)</th><th style={th}>L de vaporisation (kJ/kg)</th></tr></thead>
      <tbody>{lignes.map(c => <tr key={c.id}><td style={{ ...cel, fontWeight: 700, textAlign: 'left' }}>{c.nom} {c.f}</td><td style={cel}>{M.nombreFR(c.Lfus)}</td><td style={cel}>{M.nombreFR(c.Lvap)}</td></tr>)}</tbody>
    </table>);
}
