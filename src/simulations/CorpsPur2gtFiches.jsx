// Schémas des cartes « À retenir » de la simulation 196 « Corps pur ou mélange : température de changement d'état » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver à l'étape qui la porte.
// viewBox de 300 de large (≈ 230 px sur téléphone) : textes de 13,5 à 17 ; schémas plafonnés à 320 px.
import { Disques } from "./CorpsPur2gtScenes";
import { PUR, MEL } from "./corpsPur2gtCouleurs";
import { COL } from "./changementEtat2gtCouleurs";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Tete = ({ x, y, c = COL.encre, dir = 'droite' }) => (dir === 'haut' ? <polygon points={`${x},${y} ${x - 5},${y + 9} ${x + 5},${y + 9}`} fill={c} /> : <polygon points={`${x},${y} ${x - 9},${y - 5} ${x - 9},${y + 5}`} fill={c} />);
// Encadré de texte (une ligne par élément de `lignes`)
const Encadre = ({ y, lignes, c = COL.vert, fond = '#f0fdf4', taille = 15, pas = 21 }) => {
  const h = 14 + pas * lignes.length;
  return (<g><rect x={6} y={y} width={288} height={h} rx="10" fill={fond} stroke={c} strokeWidth="1.5" />
    {lignes.map((t, i) => <text key={i} x={150} y={y + 11 + pas * (i + 0.75)} textAnchor="middle" fontSize={taille} fontWeight="700" fill={c}>{t}</text>)}</g>);
};

// ── Carte 1 : corps pur ou mélange ──
export function FichePurMelange() {
  return (
    <svg viewBox="0 0 300 250" style={stl} role="img" aria-label="Un corps pur ne contient qu’une seule espèce chimique : toutes les entités sont identiques. Un mélange contient au moins deux espèces chimiques : des entités de sortes différentes.">
      <rect x={6} y={6} width={142} height={150} rx="10" fill="white" stroke={COL.bleu} strokeWidth="2" /><rect x={152} y={6} width={142} height={150} rx="10" fill="white" stroke={COL.orange} strokeWidth="2" />
      <text x={77} y={28} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.bleu}>CORPS PUR</text><text x={223} y={28} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.orange}>MÉLANGE</text>
      <Disques points={PUR} x={22} y={36} taille={110} rayon={9} /><Disques points={MEL} x={168} y={36} taille={110} rayon={9} />
      <text x={77} y={146} textAnchor="middle" fontSize="14" fill={COL.encre}>une seule sorte</text><text x={223} y={146} textAnchor="middle" fontSize="14" fill={COL.encre}>plusieurs sortes</text>
      <Encadre y={168} lignes={['Corps pur : 1 espèce chimique.', 'Mélange : 2 espèces ou plus.']} />
    </svg>);
}

// ── Carte 2 : homogène ou hétérogène ──
export function FicheHomHet() {
  const verre = (x, c1, c2, deuxCouches) => (
    <g transform={`translate(${x} 36)`}><path d="M0 0h56l-6 66H6z" fill="#f8fafc" stroke="#0284c7" strokeWidth="2.5" strokeLinejoin="round" />
      {deuxCouches ? <g><path d="M7 38h42l-2 26H9z" fill={c2} /><path d="M4 20h48l-2 18H5z" fill={c1} /></g> : <path d="M4 20h48l-4 44H8z" fill={c1} />}</g>);
  return (
    <svg viewBox="0 0 300 276" style={stl} role="img" aria-label="Mélange homogène : on ne voit qu’une seule matière, exemple de l’eau salée. Mélange hétérogène : on distingue plusieurs matières, exemples de l’eau et de l’huile, ou du granite.">
      <rect x={6} y={6} width={142} height={176} rx="10" fill="white" stroke={COL.bleu} strokeWidth="2" /><rect x={152} y={6} width={142} height={176} rx="10" fill="white" stroke={COL.orange} strokeWidth="2" />
      <text x={77} y={28} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.bleu}>HOMOGÈNE</text><text x={223} y={28} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.orange}>HÉTÉROGÈNE</text>
      {verre(50, '#bae6fd', null, false)}{verre(196, '#fde047', '#7dd3fc', true)}
      <text x={77} y={128} textAnchor="middle" fontSize="14" fill={COL.encre}>une seule matière</text><text x={77} y={146} textAnchor="middle" fontSize="14" fill={COL.encre}>visible</text>
      <text x={223} y={128} textAnchor="middle" fontSize="14" fill={COL.encre}>plusieurs matières</text><text x={223} y={146} textAnchor="middle" fontSize="14" fill={COL.encre}>visibles</text>
      <text x={77} y={170} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.bleu}>ex. : eau salée</text><text x={223} y={170} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.orange}>ex. : eau et huile</text>
      <Encadre y={196} lignes={['Homogène : à l’œil nu,', 'une seule matière.', 'Hétérogène : plusieurs.']} />
    </svg>);
}

// ── Carte 3 : l'arbre des trois catégories ──
export function FicheArbre() {
  const bte = (x, y, w, titre, c, fond, taille = 14.5) => (
    <g><rect x={x} y={y} width={w} height={34} rx="9" fill={fond} stroke={c} strokeWidth="2" />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize={taille} fontWeight="800" fill={c}>{titre}</text></g>);
  const txt = (x, y, t) => <text x={x} y={y} textAnchor="middle" fontSize="13.5" fill={COL.encre}>{t}</text>;
  return (
    <svg viewBox="0 0 300 292" style={stl} role="img" aria-label="La matière se range en deux grandes familles : les corps purs, avec une seule espèce chimique (exemples : l’or pur, le dioxygène), et les mélanges, avec plusieurs espèces. Les mélanges sont homogènes (exemples : l’eau du robinet, l’air) ou hétérogènes (exemples : la vinaigrette, l’eau et le sable). Attention : homogène ne veut pas dire corps pur.">
      <rect x={90} y={6} width={120} height={30} rx="9" fill="#f1f5f9" stroke={COL.gris} strokeWidth="2" /><text x={150} y={27} textAnchor="middle" fontSize="15.5" fontWeight="800" fill={COL.encre}>la matière</text>
      <path d="M130 36L66 56M170 36L214 56" stroke={COL.gris} strokeWidth="2.5" fill="none" />
      {bte(6, 56, 120, 'CORPS PUR', COL.bleu, '#eff6ff')}{bte(134, 56, 160, 'MÉLANGE', COL.orange, '#fffbeb')}
      {txt(66, 108, '1 espèce')}{txt(66, 128, 'l’or pur,')}{txt(66, 146, 'le dioxygène')}
      <path d="M214 90L172 110M214 90L254 110" stroke={COL.gris} strokeWidth="2.5" fill="none" />
      {bte(134, 110, 76, 'homogène', COL.orange, 'white', 13.5)}{bte(216, 110, 78, 'hétérogène', COL.orange, 'white', 13.5)}
      {txt(172, 164, 'eau du')}{txt(172, 180, 'robinet,')}{txt(172, 196, 'air')}
      {txt(255, 164, 'vinaigrette,')}{txt(255, 180, 'eau et')}{txt(255, 196, 'sable')}
      <Encadre y={212} c={COL.rouge} fond="#fef2f2" lignes={['Attention : un mélange', 'homogène n’est PAS', 'un corps pur.']} />
    </svg>);
}

// ── Carte 4 : le palier d'un corps pur ──
export function FichePalier() {
  return (
    <svg viewBox="0 0 300 262" style={stl} role="img" aria-label="Courbe de chauffage d’un corps pur : la température monte, puis reste constante pendant le changement d’état : c’est le palier, à la température de changement d’état ; elle monte ensuite de nouveau.">
      <line x1={46} y1={176} x2={286} y2={176} stroke={COL.encre} strokeWidth="2" /><line x1={46} y1={176} x2={46} y2={14} stroke={COL.encre} strokeWidth="2" />
      <Tete x={292} y={176} /><Tete x={46} y={8} dir="haut" />
      <rect x={112} y={24} width={100} height={152} fill="#fef3c7" opacity="0.8" />
      <path d="M46 160L112 82H212L268 30" fill="none" stroke={COL.bleu} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <line x1={46} y1={82} x2={112} y2={82} stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4" /><text x={40} y={87} textAnchor="end" fontSize="14" fontWeight="800" fill={COL.orange}>T</text>
      <text x={162} y={64} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.orange}>palier</text><text x={162} y={110} textAnchor="middle" fontSize="13.5" fill={COL.encre}>changement</text><text x={162} y={126} textAnchor="middle" fontSize="13.5" fill={COL.encre}>d’état</text>
      <text x={166} y={198} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>temps</text><text x={20} y={100} fontSize="14" fontWeight="700" fill={COL.encre} transform="rotate(-90 20 100)">température</text>
      <Encadre y={206} lignes={['Corps pur : la température', 'reste constante (palier).']} />
    </svg>);
}

// ── Carte 5 : corps pur ou mélange, deux courbes ──
export function FicheDeuxCourbes() {
  const cadre = (x, titre, c, d, texte) => (
    <g><rect x={x} y={6} width={142} height={208} rx="10" fill="white" stroke={c} strokeWidth="2" />
      <text x={x + 71} y={28} textAnchor="middle" fontSize="15" fontWeight="800" fill={c}>{titre}</text>
      <line x1={x + 18} y1={142} x2={x + 128} y2={142} stroke={COL.encre} strokeWidth="2" /><line x1={x + 18} y1={142} x2={x + 18} y2={42} stroke={COL.encre} strokeWidth="2" />
      <path d={d} fill="none" stroke={COL.bleu} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      {texte.map((t, i) => <text key={i} x={x + 71} y={166 + 18 * i} textAnchor="middle" fontSize="14" fill={COL.encre}>{t}</text>)}</g>);
  return (
    <svg viewBox="0 0 300 286" style={stl} role="img" aria-label="À gauche, la courbe d’un corps pur : elle a une partie plate, le palier. À droite, la courbe d’un mélange : la température continue de monter pendant l’ébullition, il n’y a pas de partie plate.">
      {cadre(6, 'CORPS PUR', COL.bleu, 'M24 128L52 82H92L124 52', ['un palier :', 'partie plate'])}
      {cadre(152, 'MÉLANGE', COL.orange, 'M170 128L196 88L228 66L270 44', ['pas de palier :', 'ça monte toujours'])}
      <Encadre y={226} lignes={['Un palier : peut-être un corps pur.', 'Pas de palier : forcément un mélange.']} taille={14} />
    </svg>);
}

// ── Carte 6 : la précision du thermomètre ──
export function FichePrecision() {
  const X = T => 150 + (T - 100) * 90;     // 100 °C au centre : 1 °C = 90 unités
  return (
    <svg viewBox="0 0 300 246" style={stl} role="img" aria-label="Un thermomètre précis à plus ou moins 0,5 degré Celsius indique 100 degrés Celsius : la vraie température est entre 99,5 et 100,5 degrés Celsius.">
      <line x1={24} y1={96} x2={276} y2={96} stroke={COL.encre} strokeWidth="2.5" />
      {[99, 100, 101].map(T => <g key={T}><line x1={X(T)} y1={90} x2={X(T)} y2={104} stroke={COL.encre} strokeWidth="2.5" /><text x={X(T)} y={124} textAnchor="middle" fontSize="14" fill={COL.encre}>{T}</text></g>)}
      <rect x={X(99.5)} y={70} width={X(100.5) - X(99.5)} height={20} rx="4" fill="#fde68a" stroke={COL.orange} strokeWidth="2" />
      <polygon points={`${X(100)},94 ${X(100) - 7},78 ${X(100) + 7},78`} fill={COL.orange} />
      <text x={150} y={50} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.orange}>lue : 100&nbsp;°C, précision ±&nbsp;0,5&nbsp;°C</text>
      <text x={X(99.5)} y={142} textAnchor="middle" fontSize="13.5" fill={COL.encre}>99,5</text><text x={X(100.5)} y={142} textAnchor="middle" fontSize="13.5" fill={COL.encre}>100,5</text>
      <Encadre y={158} lignes={['valeur lue ± précision :', 'la vraie valeur est', 'dans cette zone.']} />
    </svg>);
}

// ── Carte 7 : valeur lue compatible avec la référence ──
export function FicheCompatible() {
  const ligne = (y, lue, c, verdict) => (
    <g><text x={12} y={y} fontSize="14.5" fill={COL.encre}>lue : {lue}&nbsp;°C ; réf. : 100&nbsp;°C</text>
      <text x={12} y={y + 20} fontSize="14.5" fontWeight="700" fill={COL.encre}>écart : {verdict[0]}</text>
      <text x={288} y={y + 20} textAnchor="end" fontSize="15" fontWeight="800" fill={c}>{verdict[1]}</text></g>);
  return (
    <svg viewBox="0 0 300 262" style={stl} role="img" aria-label="Précision du thermomètre : 1 degré Celsius. Valeur lue 99,5 degrés Celsius, référence 100 : écart 0,5, inférieur à 1 : compatible. Valeur lue 97 degrés Celsius, référence 100 : écart 3, supérieur à 1 : pas compatible.">
      <text x={150} y={24} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.encre}>précision du thermomètre : ±&nbsp;1&nbsp;°C</text>
      <rect x={6} y={36} width={288} height={52} rx="9" fill="#f0fdf4" stroke={COL.vert} strokeWidth="1.5" />{ligne(54, '99,5', COL.vert, ['0,5 °C < 1 °C', 'compatible'])}
      <rect x={6} y={96} width={288} height={52} rx="9" fill="#fef2f2" stroke={COL.rouge} strokeWidth="1.5" />{ligne(114, '97', COL.rouge, ['3 °C > 1 °C', 'non compatible'])}
      <Encadre y={160} lignes={['Compatible si l’écart est', 'inférieur à la précision.']} />
      <text x={150} y={236} textAnchor="middle" fontSize="13.5" fill={COL.gris}>écart = différence, sans signe</text>
    </svg>);
}

// ── Carte 8 : identifier un liquide ──
export function FicheIdentifier() {
  const etape = (y, n, t1, t2) => (
    <g><circle cx={24} cy={y + 14} r={13} fill={COL.bleu} /><text x={24} y={y + 20} textAnchor="middle" fontSize="16" fontWeight="800" fill="white">{n}</text>
      <text x={46} y={y + 12} fontSize="14.5" fontWeight="700" fill={COL.encre}>{t1}</text><text x={46} y={y + 30} fontSize="14.5" fill={COL.encre}>{t2}</text></g>);
  return (
    <svg viewBox="0 0 300 278" style={stl} role="img" aria-label="Pour identifier un liquide pur : un, relever la température d’ébullition ; deux, calculer l’écart avec chaque valeur de référence ; trois, garder les liquides dont l’écart est inférieur à la précision ; quatre, s’il n’en reste qu’un, c’est lui ; sinon il faut une mesure plus précise ou une autre mesure.">
      {etape(6, 1, 'Relever la température', 'd’ébullition (palier).')}{etape(58, 2, 'Calculer l’écart avec', 'chaque valeur de référence.')}
      {etape(110, 3, 'Garder les liquides dont', 'l’écart est plus petit que la précision.')}{etape(162, 4, 'Un seul reste : identifié.', 'Plusieurs : mesurer mieux.')}
      <Encadre y={214} lignes={['Autre indice : la masse', 'volumique (simulation « Mélanges »).']} c={COL.bleu} fond="#eff6ff" taille={14} pas={19} />
    </svg>);
}

// ── Carte 9 : bilan, eau salée et hypothèses ──
export function FicheBilan() {
  return (
    <svg viewBox="0 0 300 286" style={stl} role="img" aria-label="Bilan. Corps pur : palier à une température de changement d’état connue. Mélange : pas de palier, ou température différente de la référence, comme l’eau salée qui bout au-dessus de 100 degrés Celsius. Valable à la pression normale, pour un mélange ordinaire.">
      <rect x={6} y={6} width={288} height={62} rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2" />
      <text x={150} y={30} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.bleu}>CORPS PUR</text><text x={150} y={52} textAnchor="middle" fontSize="14.5" fill={COL.encre}>palier à la valeur de référence</text>
      <rect x={6} y={76} width={288} height={84} rx="10" fill="#fffbeb" stroke={COL.orange} strokeWidth="2" />
      <text x={150} y={100} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.orange}>MÉLANGE</text><text x={150} y={122} textAnchor="middle" fontSize="14.5" fill={COL.encre}>pas de palier net, ou une</text><text x={150} y={142} textAnchor="middle" fontSize="14.5" fill={COL.encre}>température hors référence</text>
      <text x={150} y={184} textAnchor="middle" fontSize="14.5" fill={COL.encre}>eau pure : 100&nbsp;°C ; eau salée : plus</text><text x={150} y={202} textAnchor="middle" fontSize="14.5" fill={COL.encre}>de 100&nbsp;°C, et ça monte un peu</text>
      <Encadre y={216} c={COL.gris} fond="#f8fafc" taille={13.5} pas={19} lignes={['Valable à la pression normale,', 'pour un mélange ordinaire.']} />
    </svg>);
}
