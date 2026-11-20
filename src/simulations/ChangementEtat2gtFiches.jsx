// Schémas des cartes « À retenir » de la simulation 195 « Changement d'état : équation, transfert thermique et énergie » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver.
// viewBox de 300 de large (≈ 230 px sur téléphone) : textes de 13,5 à 17 ; schémas plafonnés à 320 px.
import { Molecules, SchemaSix } from "./ChangementEtat2gtScenes";
import { COL } from "./changementEtat2gtCouleurs";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const MOL = { fond: '#bfdbfe', trait: '#1d4ed8' }, SUC = { fond: '#fed7aa', trait: '#c2410c' };
const Tete = ({ x, y, c, dir }) => (dir === 'droite' ? <polygon points={`${x},${y} ${x - 10},${y - 6} ${x - 10},${y + 6}`} fill={c} /> : <polygon points={`${x},${y} ${x + 10},${y - 6} ${x + 10},${y + 6}`} fill={c} />);

// ── Carte 1 : les six changements d'état ──
export const FicheSix = () => <SchemaSix colore={false} />;

// ── Carte 2 : écrire l'équation, molécules identiques ──
export function FicheEquation() {
  return (
    <svg viewBox="0 0 300 274" style={stl} role="img" aria-label="L’eau sous trois états à l’échelle des molécules : solide rangé, liquide désordonné, gaz éloigné. Équations : fusion H2O solide donne H2O liquide ; vaporisation H2O liquide donne H2O gaz. La formule est la même des deux côtés : seule la disposition des molécules change.">
      {[['s', 'solide'], ['l', 'liquide'], ['g', 'gaz']].map(([e, t], i) => (
        <g key={e}><rect x={6 + 98 * i} y={6} width={92} height={112} rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <Molecules etat={e} x={14 + 98 * i} y={10} taille={76} /><text x={52 + 98 * i} y={108} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.encre}>{t}</text></g>))}
      <text x={10} y={146} fontSize="16" fontWeight="700" fill={COL.encre}>H₂O(s) → H₂O(l)</text><text x={290} y={146} textAnchor="end" fontSize="14.5" fontWeight="800" fill={COL.orange}>fusion</text>
      <text x={10} y={174} fontSize="16" fontWeight="700" fill={COL.encre}>H₂O(l) → H₂O(g)</text><text x={290} y={174} textAnchor="end" fontSize="14.5" fontWeight="800" fill={COL.orange}>vaporisation</text>
      <rect x={6} y={192} width={288} height={76} rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="1.5" />
      <text x={150} y={216} textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>Même formule des deux côtés :</text>
      <text x={150} y={238} textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>les molécules sont les mêmes,</text>
      <text x={150} y={258} textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>seul leur rangement change.</text>
    </svg>);
}

// ── Carte 3 : endothermique ou exothermique ──
export function FicheEndoExo() {
  const col = (x, titre, c, endo, noms) => (
    <g>
      <rect x={x} y={6} width={142} height={196} rx="10" fill="white" stroke={c} strokeWidth="2" />
      <text x={x + 71} y={28} textAnchor="middle" fontSize="14.5" fontWeight="800" fill={c}>{titre}</text>
      <rect x={x + 6} y={38} width={130} height={64} rx="10" fill={endo ? '#fff7ed' : '#eff6ff'} stroke="none" />
      <rect x={x + 41} y={46} width={60} height={48} rx="8" fill="white" stroke={COL.bleu} strokeWidth="2" /><text x={x + 71} y={75} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COL.encre}>système</text>
      {endo ? <g><line x1={x + 10} y1={70} x2={x + 31} y2={70} stroke={c} strokeWidth="4" /><Tete x={x + 40} y={70} c={c} dir="droite" /></g>
        : <g><line x1={x + 102} y1={70} x2={x + 123} y2={70} stroke={c} strokeWidth="4" /><Tete x={x + 132} y={70} c={c} dir="droite" /></g>}
      <text x={x + 71} y={122} textAnchor="middle" fontSize="14" fill={COL.encre}>{endo ? 'le système reçoit' : 'le système cède'}</text><text x={x + 71} y={140} textAnchor="middle" fontSize="14" fill={COL.encre}>de l’énergie</text>
      {noms.map((t, i) => <text key={t} x={x + 71} y={164 + 17 * i} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={c}>{t}</text>)}
    </g>);
  return (
    <svg viewBox="0 0 300 278" style={stl} role="img" aria-label="Deux cas. Endothermique : l’énergie entre dans le système, qui la reçoit (fusion, vaporisation, sublimation). Exothermique : l’énergie sort du système, qui la cède (solidification, liquéfaction, condensation solide). Pour s’en souvenir : endo, l’énergie entre ; exo, l’énergie sort.">
      {col(6, 'ENDOTHERMIQUE', COL.orange, true, ['fusion', 'vaporisation', 'sublimation'])}{col(152, 'EXOTHERMIQUE', COL.bleu, false, ['solidification', 'liquéfaction', 'cond. solide'])}
      <rect x={6} y={212} width={288} height={62} rx="10" fill="#fffbeb" stroke={COL.orange} strokeWidth="1.5" />
      <text x={150} y={236} textAnchor="middle" fontSize="15.5" fontWeight="800" fill={COL.encre}>ENDO : l’énergie ENTRE</text>
      <text x={150} y={260} textAnchor="middle" fontSize="15.5" fontWeight="800" fill={COL.encre}>EXO : l’énergie SORT</text>
    </svg>);
}

// ── Carte 4 : fusion ou dissolution ──
export function FicheFusionDissolution() {
  const eauMel = [[18, 20], [52, 14], [86, 22], [20, 54], [52, 52], [88, 56], [18, 88], [54, 86], [84, 88]];
  return (
    <svg viewBox="0 0 300 282" style={stl} role="img" aria-label="Fusion : un seul corps, la glace, devient liquide : il change d’état. Dissolution : deux corps, le sucre et l’eau, sont mélangés ; l’eau reste liquide : on change de mélange.">
      <rect x={6} y={6} width={142} height={176} rx="10" fill="white" stroke={COL.bleu} strokeWidth="2" /><rect x={152} y={6} width={142} height={176} rx="10" fill="white" stroke={COL.orange} strokeWidth="2" />
      <text x={77} y={28} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.bleu}>FUSION</text><text x={223} y={28} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.orange}>DISSOLUTION</text>
      <Molecules etat="s" x={12} y={38} taille={54} rayon={7} /><Tete x={78} y={66} c={COL.gris} dir="droite" /><Molecules etat="l" x={84} y={38} taille={54} rayon={7} />
      <rect x={160} y={44} width={40} height={40} rx="6" fill={SUC.fond} stroke={SUC.trait} strokeWidth="2" /><text x={180} y={101} textAnchor="middle" fontSize="14" fontWeight="700" fill={SUC.trait}>sucre</text><Tete x={214} y={64} c={COL.gris} dir="droite" />
      <g transform="translate(222 40)"><rect x={0} y={0} width={64} height={52} rx="6" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1.5" />
        <Molecules x={0} y={-6} taille={64} rayon={7} points={eauMel} /><Molecules x={0} y={-6} taille={64} rayon={10} couleur={SUC} points={[[36, 36], [70, 70]]} /></g>
      <text x={77} y={118} textAnchor="middle" fontSize="14" fill={COL.encre}>un seul corps</text><text x={77} y={138} textAnchor="middle" fontSize="14" fill={COL.encre}>qui change d’état</text>
      <text x={223} y={118} textAnchor="middle" fontSize="14" fill={COL.encre}>deux corps</text><text x={223} y={138} textAnchor="middle" fontSize="14" fill={COL.encre}>mélangés</text>
      <text x={77} y={168} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.bleu}>glace → eau</text><text x={223} y={168} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.orange}>l’eau reste liquide</text>
      <rect x={6} y={194} width={288} height={82} rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="1.5" />
      <text x={150} y={220} textAnchor="middle" fontSize="15.5" fontWeight="700" fill={COL.vert}>Fusion : on change d’état.</text>
      <text x={150} y={244} textAnchor="middle" fontSize="15.5" fontWeight="700" fill={COL.vert}>Dissolution : on change</text><text x={150} y={264} textAnchor="middle" fontSize="15.5" fontWeight="700" fill={COL.vert}>de mélange.</text>
    </svg>);
}

// ── Carte 5 : E = m × L ──
export function FicheEnergie() {
  return (
    <svg viewBox="0 0 300 274" style={stl} role="img" aria-label="La relation E égale m fois L. E : énergie échangée, en kilojoules. m : masse qui change d’état, en kilogrammes. L : énergie massique de changement d’état, en kilojoules par kilogramme. Exemple : 2,0 kg de glace qui fondent, avec L égal à 334 kJ par kg : E égale 668 kJ. Si la masse double, l’énergie double.">
      <rect x={6} y={6} width={288} height={52} rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="1.5" />
      <text x={150} y={44} textAnchor="middle" fontSize="28" fontWeight="800" fill={COL.encre}>E = m × L</text>
      {[['E', 'énergie échangée (kJ)', COL.orange], ['m', 'masse qui change d’état (kg)', COL.bleu], ['L', 'énergie pour 1 kg (kJ/kg)', COL.vert]].map(([l, t, c], i) => (
        <g key={l}><circle cx={26} cy={86 + 28 * i} r={11} fill={c} /><text x={26} y={92 + 28 * i} textAnchor="middle" fontSize="15" fontWeight="800" fill="white">{l}</text><text x={46} y={92 + 28 * i} fontSize="14.5" fill={COL.encre}>{t}</text></g>))}
      <rect x={6} y={172} width={288} height={56} rx="10" fill="white" stroke={COL.clair} strokeWidth="1.5" />
      <text x={150} y={195} textAnchor="middle" fontSize="14.5" fill={COL.encre}>Glace : 2,0 kg × 334 kJ/kg</text><text x={150} y={217} textAnchor="middle" fontSize="15.5" fontWeight="800" fill={COL.orange}>E = 668 kJ</text>
      <rect x={6} y={238} width={288} height={30} rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="1.5" />
      <text x={150} y={258} textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>masse × 2 ⇒ énergie × 2</text>
    </svg>);
}

// ── Carte 6 : ordre de grandeur, fondre ou vaporiser ──
export function FicheOrdre() {
  const k = 3.9;
  return (
    <svg viewBox="0 0 300 290" style={stl} role="img" aria-label="Pour 20 grammes d’eau, fondre demande 6,7 kilojoules et se vaporiser 45 kilojoules, environ 7 fois plus. Dans le gaz, les molécules sont beaucoup plus éloignées que dans le liquide : il faut plus d’énergie pour les séparer.">
      <text x={150} y={22} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.encre}>Pour 20 g d’eau</text>
      <text x={10} y={46} fontSize="14.5" fill={COL.encre}>fusion : 6,7 kJ</text><rect x={10} y={52} width={6.7 * k} height={22} rx="4" fill={COL.bleu} />
      <text x={10} y={100} fontSize="14.5" fill={COL.encre}>vaporisation : 45 kJ</text><rect x={10} y={106} width={45 * k} height={22} rx="4" fill={COL.orange} />
      <rect x={6} y={142} width={288} height={92} rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <Molecules etat="l" x={22} y={148} taille={62} rayon={7} /><Molecules etat="g" x={214} y={148} taille={62} rayon={7} />
      <line x1={100} y1={179} x2={196} y2={179} stroke={COL.gris} strokeWidth="3" /><Tete x={206} y={179} c={COL.gris} dir="droite" />
      <text x={53} y={226} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COL.encre}>liquide</text><text x={245} y={226} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COL.encre}>gaz</text>
      <rect x={6} y={244} width={288} height={42} rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="1.5" />
      <text x={150} y={262} textAnchor="middle" fontSize="14.5" fontWeight="700" fill={COL.vert}>Gaz : molécules très éloignées,</text><text x={150} y={279} textAnchor="middle" fontSize="14.5" fontWeight="700" fill={COL.vert}>il faut environ 7 fois plus d’énergie.</text>
    </svg>);
}
