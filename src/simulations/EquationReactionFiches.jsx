// Schémas des cartes « À retenir » de la simulation 179 « Équation de réaction : écrire et ajuster » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver.
// viewBox de 300 de large (≈ 230 px sur téléphone, facteur 0,77) : textes de 14 à 17 (≥ 11 px rendus) ; schémas plafonnés à 320 px.
// Couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège.
import { AmasSvg } from "./EquationReactionScenes";

const C = { bleu: '#0b4f94', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a' };
const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Fleche = ({ x1, x2, y, c = C.gris }) => <g><line x1={x1} y1={y} x2={x2 - 7} y2={y} stroke={c} strokeWidth="2.5" /><polygon points={`${x2},${y} ${x2 - 10},${y - 6} ${x2 - 10},${y + 6}`} fill={c} /></g>;
const Boite = ({ x, y, w, h, c, fond = 'white', titre }) => (
  <g><rect x={x} y={y} width={w} height={h} rx="10" fill={fond} stroke={c} strokeWidth="1.5" />{titre && <text x={x + w / 2} y={y + 19} textAnchor="middle" fontSize="14.6" fontWeight="700" fill={c}>{titre}</text>}</g>);

// ── Carte 1 : conservation des atomes (carbone) ──
export function FicheConservation() {
  return (
    <svg viewBox="0 0 300 238" style={stl} role="img" aria-label="Combustion du carbone, avant et après. Avant : un atome de carbone et une molécule de dioxygène, soit 1 atome C et 2 atomes O. Après : une molécule de dioxyde de carbone, soit 1 atome C et 2 atomes O. On ne perd rien, on ne crée rien.">
      <Boite x={6} y={6} w={126} h={110} c={C.bleu} fond="#f8fafc" titre="AVANT" />
      <AmasSvg id="C" cx={34} cy={72} u={24} police={14.6} /><text x={62} y={78} textAnchor="middle" fontSize="18" fontWeight="700" fill={C.gris}>+</text><AmasSvg id="O2" cx={96} cy={72} u={24} police={14.6} />
      <text x={69} y={106} textAnchor="middle" fontSize="14.6" fill={C.encre}>C + O₂</text>
      <Fleche x1={136} x2={164} y={66} />
      <Boite x={168} y={6} w={126} h={110} c={C.bleu} fond="#f8fafc" titre="APRÈS" />
      <AmasSvg id="CO2" cx={231} cy={72} u={24} police={14.6} />
      <text x={231} y={106} textAnchor="middle" fontSize="14.6" fill={C.encre}>CO₂</text>
      <text x={150} y={142} textAnchor="middle" fontSize="15" fill={C.encre}>C : 1 atome → 1 atome ✓</text>
      <text x={150} y={163} textAnchor="middle" fontSize="15" fill={C.encre}>O : 2 atomes → 2 atomes ✓</text>
      <rect x={6} y={178} width={288} height={54} rx="10" fill="#f0fdf4" stroke={C.vert} strokeWidth="1.5" />
      <text x={150} y={201} textAnchor="middle" fontSize="16" fontWeight="700" fill={C.vert}>On ne perd rien,</text>
      <text x={150} y={221} textAnchor="middle" fontSize="16" fontWeight="700" fill={C.vert}>on ne crée rien.</text>
    </svg>);
}

// ── Carte 2 : ajuster dans l'ordre C, H, O ──
export function FicheAjuster() {
  return (
    <svg viewBox="0 0 300 268" style={stl} role="img" aria-label="Ajuster une équation dans l’ordre C, puis H, puis O. Exemple : CH4 + 2 O2 donne CO2 + 2 H2O. Carbone : 1 atome. Hydrogène : 4 atomes donc 2 H2O. Oxygène : 4 atomes donc 2 O2. On change les coefficients devant les formules, jamais les indices : 2 H2O est de l’eau, H2O2 est un autre corps.">
      <rect x={6} y={6} width={288} height={38} rx="10" fill="#eff6ff" stroke={C.bleu} />
      <text x={150} y={31} textAnchor="middle" fontSize="16" fontWeight="700" fill={C.encre}>CH₄ + 2 O₂ → CO₂ + 2 H₂O</text>
      {[['1', 'C', '1 atome : CO₂ ✓'], ['2', 'H', '4 atomes : 2 H₂O'], ['3', 'O', '4 atomes : 2 O₂']].map(([n, a, t], i) => (
        <g key={n} transform={`translate(0 ${58 + i * 38})`}>
          <circle cx={24} cy={17} r={13} fill={C.orange} /><text x={24} y={22} textAnchor="middle" fontSize="15" fontWeight="700" fill="white">{n}</text>
          <text x={46} y={23} fontSize="16" fontWeight="700" fill={C.encre}>{a}</text><text x={72} y={23} fontSize="15" fill={C.encre}>{t}</text>
        </g>))}
      <rect x={6} y={178} width={140} height={82} rx="10" fill="#fef2f2" stroke={C.rouge} strokeWidth="1.5" />
      <text x={76} y={200} textAnchor="middle" fontSize="16" fontWeight="700" fill={C.rouge}>H₂O₂ ✗</text><text x={76} y={222} textAnchor="middle" fontSize="14.6" fill={C.encre}>indice changé :</text><text x={76} y={241} textAnchor="middle" fontSize="14.6" fill={C.encre}>autre corps !</text>
      <rect x={154} y={178} width={140} height={82} rx="10" fill="#f0fdf4" stroke={C.vert} strokeWidth="1.5" />
      <text x={224} y={200} textAnchor="middle" fontSize="16" fontWeight="700" fill={C.vert}>2 H₂O ✓</text><text x={224} y={222} textAnchor="middle" fontSize="14.6" fill={C.encre}>coefficient devant</text><text x={224} y={241} textAnchor="middle" fontSize="14.6" fill={C.encre}>2 molécules d’eau</text>
    </svg>);
}

// ── Carte 3 : la charge se conserve (zinc) ──
export function FicheCharge() {
  return (
    <svg viewBox="0 0 300 250" style={stl} role="img" aria-label="La charge électrique se conserve. Exemple : zinc et ions hydrogène. Avant : un atome de zinc et deux ions H plus, charge totale plus 2. Après : un ion zinc Zn deux plus et une molécule de dihydrogène neutre, charge totale plus 2. Charge avant égale charge après.">
      <Boite x={6} y={6} w={126} h={118} c={C.bleu} fond="#f8fafc" titre="AVANT" />
      <AmasSvg id="Zn" cx={32} cy={62} u={24} police={14.6} /><AmasSvg id="Hp" cx={74} cy={62} u={24} police={14.6} /><AmasSvg id="Hp" cx={110} cy={62} u={24} police={14.6} />
      <text x={69} y={98} textAnchor="middle" fontSize="14.6" fill={C.encre}>Zn + 2 H⁺</text><text x={69} y={116} textAnchor="middle" fontSize="14.6" fontWeight="700" fill={C.orange}>charge +2</text>
      <Fleche x1={136} x2={166} y={64} />
      <Boite x={170} y={6} w={124} h={118} c={C.bleu} fond="#f8fafc" titre="APRÈS" />
      <AmasSvg id="Zn2" cx={196} cy={66} u={24} police={14.6} /><AmasSvg id="H2" cx={258} cy={62} u={24} police={14.6} />
      <text x={232} y={98} textAnchor="middle" fontSize="14.6" fill={C.encre}>Zn²⁺ + H₂</text><text x={232} y={116} textAnchor="middle" fontSize="14.6" fontWeight="700" fill={C.orange}>charge +2</text>
      <text x={150} y={148} textAnchor="middle" fontSize="15" fill={C.encre}>Éléments : Zn et H égaux ✓</text>
      <text x={150} y={170} textAnchor="middle" fontSize="15" fill={C.encre}>Charge totale : +2 et +2 ✓</text>
      <rect x={6} y={184} width={288} height={54} rx="10" fill="#f0fdf4" stroke={C.vert} strokeWidth="1.5" />
      <text x={150} y={207} textAnchor="middle" fontSize="16" fontWeight="700" fill={C.vert}>Même charge totale</text><text x={150} y={227} textAnchor="middle" fontSize="16" fontWeight="700" fill={C.vert}>avant et après.</text>
    </svg>);
}

// ── Carte 4 : espèce spectatrice ──
export function FicheSpectatrice() {
  return (
    <svg viewBox="0 0 300 270" style={stl} role="img" aria-label="Espèce spectatrice. Une espèce spectatrice est présente avant et après la réaction et ne change pas. Exemple : acide chlorhydrique et soude. Les ions sodium et chlorure, en gris, sont présents avant et après : ils sont spectateurs. L’équation simplifiée est H plus plus HO moins donne H2O.">
      <Boite x={6} y={6} w={122} h={124} c={C.bleu} fond="#f8fafc" titre="AVANT" />
      <AmasSvg id="Hp" cx={32} cy={56} u={24} police={14.6} /><AmasSvg id="HO" cx={86} cy={56} u={24} police={14.6} /><AmasSvg id="Na" cx={32} cy={100} u={24} police={14.6} grise /><AmasSvg id="Cl" cx={90} cy={100} u={24} police={14.6} grise />
      <Fleche x1={132} x2={168} y={68} />
      <Boite x={172} y={6} w={122} h={124} c={C.bleu} fond="#f8fafc" titre="APRÈS" />
      <AmasSvg id="H2O_l" cx={233} cy={54} u={24} police={14.6} /><AmasSvg id="Na" cx={204} cy={100} u={24} police={14.6} grise /><AmasSvg id="Cl" cx={262} cy={100} u={24} police={14.6} grise />
      <rect x={6} y={140} width={288} height={34} rx="10" fill="#fff7ed" stroke={C.orange} strokeWidth="1.5" />
      <text x={150} y={162} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.orange}>gris = spectateurs : inchangés</text>
      <text x={150} y={198} textAnchor="middle" fontSize="15" fill={C.encre}>On les enlève de l’équation :</text>
      <rect x={6} y={210} width={288} height={46} rx="10" fill="#f0fdf4" stroke={C.vert} strokeWidth="1.5" />
      <text x={150} y={240} textAnchor="middle" fontSize="17" fontWeight="700" fill={C.vert}>H⁺ + HO⁻ → H₂O</text>
    </svg>);
}

// ── Carte 5 : exothermique / endothermique ──
export function FicheEnergie() {
  return (
    <svg viewBox="0 0 300 246" style={stl} role="img" aria-label="Exothermique : la transformation libère de l’énergie, la température du milieu augmente, exemple de 20,0 à 26,5 degrés Celsius. Endothermique : la transformation prend de l’énergie au milieu, la température du milieu diminue, exemple de 20,0 à 15,0 degrés Celsius.">
      <rect x={6} y={6} width={140} height={188} rx="10" fill="#fff7ed" stroke={C.orange} strokeWidth="1.5" />
      <text x={76} y={28} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.orange}>EXOTHERMIQUE</text>
      <rect x={66} y={74} width={20} height={64} rx="10" fill="white" stroke={C.gris} strokeWidth="2" /><rect x={71} y={84} width={10} height={54} fill={C.rouge} />
      <circle cx={76} cy={140} r={11} fill={C.rouge} stroke={C.gris} strokeWidth="2" />
      <polygon points="76,40 64,58 88,58" fill={C.rouge} /><rect x={72} y={56} width={8} height={12} fill={C.rouge} />
      <text x={76} y={168} textAnchor="middle" fontSize="14.6" fill={C.encre}>T du milieu monte</text><text x={76} y={186} textAnchor="middle" fontSize="14.6" fill={C.gris}>l’énergie sort</text>
      <rect x={154} y={6} width={140} height={188} rx="10" fill="#eff6ff" stroke={C.bleu} strokeWidth="1.5" />
      <text x={224} y={28} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.bleu}>ENDOTHERMIQUE</text>
      <rect x={214} y={52} width={20} height={64} rx="10" fill="white" stroke={C.gris} strokeWidth="2" /><rect x={219} y={90} width={10} height={26} fill={C.bleu} />
      <circle cx={224} cy={118} r={11} fill={C.bleu} stroke={C.gris} strokeWidth="2" />
      <polygon points="224,150 212,134 236,134" fill={C.bleu} />
      <text x={224} y={168} textAnchor="middle" fontSize="14.6" fill={C.encre}>T du milieu baisse</text><text x={224} y={186} textAnchor="middle" fontSize="14.6" fill={C.gris}>l’énergie entre</text>
      <rect x={6} y={202} width={288} height={36} rx="10" fill="#f0fdf4" stroke={C.vert} strokeWidth="1.5" />
      <text x={150} y={226} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.vert}>On le voit avec un thermomètre.</text>
    </svg>);
}

// ── Carte 6 : les coefficients sont des proportions ──
export function FichePropor() {
  const ligne = (y, k, c) => (
    <g>
      <rect x={6} y={y} width={288} height={46} rx="10" fill="white" stroke={c} strokeWidth="1.5" />
      <text x={14} y={y + 28} fontSize="16" fontWeight="700" fill={c}>{k === 1 ? '×1' : `×${k}`}</text>
      <text x={172} y={y + 28} textAnchor="middle" fontSize="14" fontWeight="700" fill={C.encre}>{k === 1 ? 'CH₄ + 2 O₂ → CO₂ + 2 H₂O' : `${k} CH₄ + ${2 * k} O₂ → ${k} CO₂ + ${2 * k} H₂O`}</text>
    </g>);
  return (
    <svg viewBox="0 0 300 232" style={stl} role="img" aria-label="Les coefficients sont des proportions. Une réaction : 1 CH4 et 2 O2 donnent 1 CO2 et 2 H2O. Trois fois plus : 3 CH4 et 6 O2 donnent 3 CO2 et 6 H2O. On multiplie tous les coefficients par le même nombre. L’eau formée est toujours le double du méthane brûlé.">
      <text x={150} y={22} textAnchor="middle" fontSize="15" fill={C.encre}>L’équation donne les proportions</text>
      {ligne(34, 1, C.bleu)}{ligne(88, 3, C.orange)}
      <text x={150} y={158} textAnchor="middle" fontSize="15" fill={C.encre}>Tout est multiplié par le même nombre.</text>
      <rect x={6} y={172} width={288} height={52} rx="10" fill="#f0fdf4" stroke={C.vert} strokeWidth="1.5" />
      <text x={150} y={195} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.vert}>H₂O formée = 2 × CH₄ brûlé</text><text x={150} y={214} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.vert}>(toujours, à toute échelle)</text>
    </svg>);
}
