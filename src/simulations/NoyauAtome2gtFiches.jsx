// Schémas des cartes « À retenir » de la simulation 202 « Le noyau de l'atome : taille, masse et écriture ZAX » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver à l'étape qui la porte.
// viewBox de 300 de large (≈ 230 px sur téléphone) : textes de 13,5 à 17 ; schémas plafonnés à 320 px. Mêmes couleurs de particules que les scènes (proton rouge, neutron gris, électron bleu).
import * as M from "./noyauAtome2gtModele";
import { PART, NUAGE } from "./noyauAtome2gtCouleurs";
import { COL } from "./changementEtat2gtCouleurs";
import { AtomeSvg, Particule, ZaxSvg } from "./NoyauAtome2gtScenes";
import { exp } from "./noyauAtome2gtTexte";

const { NB, p10, sciFR, rayonNoyau } = M;
const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Encadre = ({ y, lignes, c = COL.vert, fond = '#f0fdf4', taille = 15, pas = 21 }) => {
  const h = 14 + pas * lignes.length;
  return (<g><rect x={6} y={y} width={288} height={h} rx="10" fill={fond} stroke={c} strokeWidth="1.5" />
    {lignes.map((t, i) => <text key={i} x={150} y={y + 11 + pas * (i + 0.75)} textAnchor="middle" fontSize={taille} fontWeight="700" fill={c}>{exp(t)}</text>)}</g>);
};

// ── Carte 1 : la taille d'un atome ──
export function FicheTailleAtome() {
  const ligne = (y, nom, val, fort = false) => (
    <g>{fort && <rect x={6} y={y - 24} width={288} height={36} rx="9" fill="#fffbeb" stroke={COL.orange} strokeWidth="2" />}
      <text x={16} y={y} fontSize={fort ? 16 : 15} fontWeight={fort ? 800 : 400} fill={fort ? COL.orange : COL.encre}>{nom}</text>
      <text x={284} y={y} textAnchor="end" fontSize={fort ? 17 : 15} fontWeight="800" fill={fort ? COL.orange : COL.bleu}>{exp(val)}</text></g>);
  return (
    <svg viewBox="0 0 300 232" style={stl} role="img" aria-label="Des plus grands aux plus petits : un grain de sable, environ 10 puissance moins 3 mètre ; une cellule, 10 puissance moins 5 mètre ; un virus, 10 puissance moins 7 mètre ; un atome, 10 puissance moins 10 mètre, soit un dixième de nanomètre.">
      {ligne(30, 'grain de sable', `${p10(-3)}${NB}m`)}{ligne(62, 'cellule du corps', `${p10(-5)}${NB}m`)}{ligne(94, 'virus', `${p10(-7)}${NB}m`)}{ligne(132, 'ATOME', `${p10(-10)}${NB}m`, true)}
      <Encadre y={152} lignes={[`0,000${NB}000${NB}000${NB}1${NB}m`, 'un dixième de nanomètre']} c={COL.orange} fond="#fffbeb" />
      <text x={150} y={224} textAnchor="middle" fontSize="13.5" fill={COL.gris}>{exp(`1 nanomètre (nm) = ${p10(-9)}${NB}m`)}</text>
    </svg>);
}

// ── Carte 2 : l'atome et son noyau, le quotient et l'image de la bille ──
export function FicheAtomeNoyau() {
  return (
    <svg viewBox="0 0 300 292" style={stl} role="img" aria-label="Un atome mesure environ 10 puissance moins 10 mètre ; son noyau, environ 10 puissance moins 15 mètre : l’atome est 100 000 fois plus large que son noyau. Si le noyau était une bille de 1 centimètre, l’atome mesurerait 1 kilomètre.">
      <circle cx={70} cy={70} r={56} fill={NUAGE.fond} fillOpacity="0.55" stroke={NUAGE.trait} strokeWidth="2.5" strokeDasharray="6 5" />
      <circle cx={70} cy={70} r={4} fill={PART.proton.fond} stroke={PART.proton.trait} strokeWidth="1.5" />
      <text x={140} y={46} fontSize="15" fontWeight="800" fill={COL.bleu}>atome</text><text x={140} y={66} fontSize="15" fontWeight="800" fill={COL.bleu}>{exp(`≈ ${p10(-10)}${NB}m`)}</text><line x1={114} y1={37} x2={134} y2={42} stroke={COL.encre} strokeWidth="1.5" />
      <text x={140} y={100} fontSize="15" fontWeight="800" fill={COL.orange}>noyau</text><text x={140} y={120} fontSize="15" fontWeight="800" fill={COL.orange}>{exp(`≈ ${p10(-15)}${NB}m`)}</text>
      <line x1={76} y1={72} x2={134} y2={96} stroke={COL.encre} strokeWidth="1.5" />
      <text x={70} y={148} textAnchor="middle" fontSize="13.5" fill={COL.gris}>non à l’échelle</text>
      <Encadre y={160} lignes={[`atome ÷ noyau = ${M.nombreFR(M.RAPPORT_TAILLES)}`, `(${p10(-10)} ÷ ${p10(-15)} = ${p10(5)})`]} c={COL.bleu} fond="#eff6ff" />
      <Encadre y={226} lignes={['noyau = bille de 1\u00a0cm', 'atome = 1\u00a0km !']} c={COL.orange} fond="#fffbeb" taille={16} />
    </svg>);
}

// ── Carte 3 : les masses ──
export function FicheMasses() {
  const pan = (x, contenu) => (<g><path d={`M${x} 96L${x - 34} 140M${x} 96L${x + 34} 140`} fill="none" stroke={COL.gris} strokeWidth="2" /><path d={`M${x - 34} 140Q${x} 164 ${x + 34} 140Z`} fill="#f1f5f9" stroke={COL.gris} strokeWidth="2.5" />{contenu}</g>);
  const petits = [[-18, 0], [-6, -3], [6, 0], [18, -3], [-12, -12], [0, -14], [12, -12], [-24, -10], [24, -10], [-6, -22], [6, -22], [0, 8]].map(([dx, dy], i) => <Particule key={i} x={248 + dx} y={130 + dy} type="electron" r={4.6} />);
  return (
    <svg viewBox="0 76 300 262" style={stl} role="img" aria-label="Une balance en équilibre : d’un côté un proton, de l’autre environ 1 800 électrons. Un proton ou un neutron pèse 1,67 fois 10 puissance moins 27 kilogramme, un électron 9,11 fois 10 puissance moins 31 kilogramme. Presque toute la masse de l’atome est dans son noyau.">
      <line x1={52} y1={96} x2={248} y2={96} stroke={COL.encre} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M150 96L132 168H168Z" fill="#e2e8f0" stroke={COL.gris} strokeWidth="2" />
      {pan(52, <Particule x={52} y={128} type="proton" r={12} />)}{pan(248, <g>{petits}</g>)}
      <text x={14} y={196} fontSize="14.5" fontWeight="800" fill={PART.proton.trait}>1 proton</text>
      <text x={290} y={196} textAnchor="end" fontSize="14.5" fontWeight="800" fill={PART.electron.trait}>≈ 1{NB}800 électrons</text>
      <text x={150} y={214} textAnchor="middle" fontSize="13.5" fill={COL.gris}>symbolique : 12 électrons pour ≈ 1{NB}800</text>
      <text x={150} y={238} textAnchor="middle" fontSize="14.5" fill={COL.encre}>{exp(`proton, neutron : ${sciFR(M.M_NUCLEON)}${NB}kg`)}</text>
      <text x={150} y={258} textAnchor="middle" fontSize="14.5" fill={COL.encre}>{exp(`électron : ${sciFR(M.M_ELECTRON)}${NB}kg`)}</text>
      <Encadre y={274} lignes={['presque toute la masse', 'de l’atome est dans le noyau']} />
    </svg>);
}

// ── Carte 4 : les charges et l'atome neutre ──
export function FicheCharges() {
  const ligne = (y, t, nom, q, c) => (<g><Particule x={26} y={y} type={t} r={13} /><text x={52} y={y + 6} fontSize="15" fontWeight="700" fill={COL.encre}>{nom}</text><text x={284} y={y + 6} textAnchor="end" fontSize="16" fontWeight="800" fill={c}>{q}</text></g>);
  return (
    <svg viewBox="0 0 300 330" style={stl} role="img" aria-label="Le proton porte la charge plus e, le neutron est sans charge, l’électron porte la charge moins e ; e vaut 1,60 fois 10 puissance moins 19 coulomb. Un atome de sodium a 11 protons, charge plus 11 e, et 11 électrons, charge moins 11 e : au total, charge nulle, l’atome est neutre.">
      {ligne(24, 'proton', 'proton', '+e', PART.proton.trait)}{ligne(58, 'neutron', 'neutron', 'charge nulle', COL.gris)}{ligne(92, 'electron', 'électron', '−e', PART.electron.trait)}
      <text x={150} y={130} textAnchor="middle" fontSize="14.5" fill={COL.encre}>{exp(`e = ${sciFR(M.E_CHARGE)}${NB}C`)}</text>
      <rect x={6} y={146} width={128} height={64} rx="10" fill="#fef2f2" stroke={PART.proton.trait} strokeWidth="2" /><rect x={166} y={146} width={128} height={64} rx="10" fill="#eff6ff" stroke={PART.electron.trait} strokeWidth="2" />
      <text x={70} y={170} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>11 protons</text><text x={70} y={196} textAnchor="middle" fontSize="18" fontWeight="800" fill={PART.proton.trait}>+11e</text>
      <text x={230} y={170} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>11 électrons</text><text x={230} y={196} textAnchor="middle" fontSize="18" fontWeight="800" fill={PART.electron.trait}>−11e</text>
      <text x={150} y={186} textAnchor="middle" fontSize="22" fontWeight="800" fill={COL.encre}>+</text>
      <text x={150} y={232} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.encre}>total : 0, atome de sodium neutre</text>
      <Encadre y={248} lignes={['atome neutre :', 'autant de protons que d’électrons']} />
    </svg>);
}

// ── Carte 5 : Z, A et le nombre de neutrons (le carbone) ──
export function FicheZA() {
  const Z = 6, k = Math.min(2.2, 74 / rayonNoyau(Z));
  return (
    <svg viewBox="0 0 300 298" style={stl} role="img" aria-label="Le noyau de carbone : 6 protons rouges et 6 neutrons gris. Z, le numéro atomique, est le nombre de protons : 6. A, le nombre de nucléons, est le nombre de protons plus le nombre de neutrons : 12. Le nombre de neutrons est A moins Z : 6.">
      <AtomeSvg Z={Z} A={12} cx={78} cy={84} k={k} nuage={false} electrons={false} />
      <Particule x={172} y={36} type="proton" r={8} /><text x={190} y={40} fontSize="15" fontWeight="800" fill={PART.proton.trait}>Z = 6</text><text x={190} y={58} fontSize="14" fill={COL.encre}>protons (rouges)</text>
      <Particule x={166} y={88} type="proton" r={8} /><Particule x={180} y={88} type="neutron" r={8} /><text x={196} y={92} fontSize="15" fontWeight="800" fill={COL.orange}>A = 12</text><text x={196} y={110} fontSize="14" fill={COL.encre}>nucléons (tous)</text>
      <Particule x={172} y={138} type="neutron" r={8} /><text x={190} y={142} fontSize="15" fontWeight="800" fill={COL.gris}>12 − 6 = 6</text><text x={190} y={160} fontSize="14" fill={COL.encre}>neutrons (gris)</text>
      <Encadre y={182} lignes={['Z : protons (l’élément)', 'A : protons + neutrons', 'neutrons = A − Z']} />
    </svg>);
}

// ── Carte 6 : bilan, l'écriture ZAX et la composition (le sodium) ──
export function FicheBilanZax() {
  const e = M.element(11);
  return (
    <svg viewBox="0 0 300 330" style={stl} role="img" aria-label="Écriture du noyau de sodium : 23 en haut, 11 en bas, symbole Na. A, 23, est le nombre de nucléons ; Z, 11, le nombre de protons. Neutrons : 23 moins 11, soit 12. Électrons de l’atome neutre : 11, autant que de protons.">
      <ZaxSvg x={76} y={78} A={e.A} Z={e.Z} s={e.s} t={64} />
      <text x={166} y={46} fontSize="15" fontWeight="800" fill={COL.orange}>A = 23 nucléons</text><text x={166} y={74} fontSize="15" fontWeight="800" fill={PART.proton.trait}>Z = 11 protons</text>
      <text x={166} y={102} fontSize="15" fontWeight="800" fill={COL.bleu}>Na : sodium</text>
      <Encadre y={122} lignes={['neutrons : A − Z', '23 − 11 = 12', 'électrons : Z = 11']} />
      <Encadre y={212} lignes={['A au-dessus de Z,', 'comme dans l’alphabet']} c={COL.orange} fond="#fffbeb" />
      <text x={150} y={292} textAnchor="middle" fontSize="13.5" fill={COL.gris}>on peut aussi écrire ²³Na : le symbole</text><text x={150} y={310} textAnchor="middle" fontSize="13.5" fill={COL.gris}>donne déjà Z.</text>
    </svg>);
}
