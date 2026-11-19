// Cartes « À retenir » de la simulation « Deux corps en interaction : gravitation et Coulomb » (sim 49, 1G).
// Chaque carte est posée UNE ÉTAPE (ou plus) APRÈS la question qu'elle conclut, avec d'autres exemples que ceux de l'étape.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320. Vecteurs avec flèche (TV / TL).
import { Formule } from "../commun";
import { TL } from "./Travail";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
function V({ children }) {
  return <span style={{ position: 'relative', display: 'inline-block', paddingTop: '0.25em' }}>{children}
    <span aria-hidden="true" style={{ position: 'absolute', top: '-0.45em', left: 0, right: 0, textAlign: 'center', fontSize: '0.75em', lineHeight: 1 }}>→</span></span>;
}
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};

// ── Carte A : actions réciproques ──
export function FicheReciproques() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Deux corps, un gros A et un petit B : la force de B sur A et la force de A sur B ont la même direction, la même norme et des sens opposés ; d est la distance entre les centres">
        <circle cx="60" cy="58" r="32" fill="#bae6fd" stroke="#0369a1" strokeWidth="2.2"/><T x={60} y={63} a="middle" c="#0369a1" w={800}>A</T>
        <circle cx="244" cy="58" r="16" fill="#fde68a" stroke="#b45309" strokeWidth="2.2"/><T x={244} y={63} a="middle" c="#b45309" w={800}>B</T>
        <Arr x1={92} y1={58} x2={146} y2={58} c={ORANGE} w={3.4}/>
        <Arr x1={228} y1={58} x2={174} y2={58} c={ROUGE} w={3.4}/>
        <TL x={100} y={40} s={13} c={ORANGE} segs={[{ v: 'F' }, ' B/A']}/>
        <TL x={168} y={40} s={13} c={ROUGE} segs={[{ v: 'F' }, ' A/B']}/>
        <line x1="60" y1="112" x2="244" y2="112" stroke={GRIS} strokeWidth="1.8"/><line x1="60" y1="105" x2="60" y2="119" stroke={GRIS} strokeWidth="1.8"/><line x1="244" y1="105" x2="244" y2="119" stroke={GRIS} strokeWidth="1.8"/>
        <T x={152} y={104} a="middle" c={GRIS} w={700}>d : entre les centres</T>
        <T x={150} y={146} a="middle" c={VERT} w={800}>même direction, même norme,</T>
        <T x={150} y={164} a="middle" c={VERT} w={800}>sens opposés</T>
      </svg>
      <ul style={liste}>
        <li><em>Deux corps s’attirent (ou se repoussent) avec des forces opposées.</em></li>
        <li><strong>Principe des actions réciproques</strong> : <V>F</V><sub>A/B</sub> = −<V>F</V><sub>B/A</sub>, même si les masses sont très différentes ; seul l’<strong>effet</strong> sur le mouvement change.</li>
        <li>Les deux forces s’appliquent sur deux corps <strong>différents</strong> : elles ne se compensent pas.</li>
      </ul>
    </div>
  );
}

// ── Carte B : la gravitation universelle ──
export function FicheGravitationUniverselle() {
  return (
    <div>
      <Formule><mi>F</mi><mo>=</mo><mfrac><mrow><mi>G</mi><mo>×</mo><msub><mi>m</mi><mtext>A</mtext></msub><mo>×</mo><msub><mi>m</mi><mtext>B</mtext></msub></mrow><msup><mi>d</mi><mn>2</mn></msup></mfrac></Formule>
      <svg viewBox="0 0 300 128" style={svgStyle} role="img" aria-label="Deux sphères de 1 000 et 2 000 kilogrammes à 10 mètres l’une de l’autre s’attirent avec une force d’environ 1,3 fois 10 puissance moins 6 newton">
        <circle cx="46" cy="40" r="20" fill="#bae6fd" stroke="#0369a1" strokeWidth="2.2"/><circle cx="254" cy="40" r="28" fill="#bae6fd" stroke="#0369a1" strokeWidth="2.2"/>
        <Arr x1={70} y1={40} x2={118} y2={40} c={ORANGE} w={3}/><Arr x1={224} y1={40} x2={176} y2={40} c={ORANGE} w={3}/>
        <T x={46} y={80} a="middle" w={700}>1 000 kg</T><T x={254} y={80} a="middle" w={700}>2 000 kg</T>
        <line x1="46" y1="94" x2="254" y2="94" stroke={GRIS} strokeWidth="1.8"/><line x1="46" y1="88" x2="46" y2="100" stroke={GRIS} strokeWidth="1.8"/><line x1="254" y1="88" x2="254" y2="100" stroke={GRIS} strokeWidth="1.8"/>
        <T x={150} y={114} a="middle" c={ORANGE} w={800}>d = 10 m : F ≈ 1,3 × 10⁻⁶ N</T>
        <T x={148} y={58} a="middle" c={GRIS}>s’attirent</T>
      </svg>
      <ul style={liste}>
        <li><strong>G = 6,674 × 10⁻¹¹ N·m²·kg⁻².</strong> La gravitation est <strong>toujours attractive</strong> (les masses sont positives).</li>
        <li><strong>Méthode :</strong> masses en <strong>kg</strong>, d en <strong>m</strong> entre les <strong>centres</strong>, puis G × m<sub>A</sub> × m<sub>B</sub> / d², en gardant le bon nombre de chiffres significatifs.</li>
        <li><strong>Hypothèse :</strong> corps à répartition sphérique de masse (ou ponctuels). <strong>Pièges :</strong> oublier le carré de d ; additionner les masses ; garder d en km.</li>
      </ul>
    </div>
  );
}

// ── Carte C : la force varie en 1 / d² ──
export function FicheLoiDistance() {
  return (
    <div>
      <svg viewBox="0 0 300 168" style={svgStyle} role="img" aria-label="Trois barres : à la distance d, la force vaut F ; à 2 d, elle est quatre fois plus petite ; à 3 d, elle est neuf fois plus petite">
        <T x={8} y={16} w={700}>norme de la force F</T>
        <line x1="14" y1="128" x2="292" y2="128" stroke={GRIS} strokeWidth="2"/>
        <rect x="30" y="38" width="48" height="90" fill={BLEU}/><T x={54} y={32} a="middle" c={BLEU} w={800}>F</T>
        <rect x="126" y="106" width="48" height="22" fill={ORANGE}/><T x={150} y={100} a="middle" c={ORANGE} w={800}>F ÷ 4</T>
        <rect x="222" y="118" width="48" height="10" fill={VERT}/><T x={246} y={112} a="middle" c={VERT} w={800}>F ÷ 9</T>
        <T x={54} y={147} a="middle" w={700}>d</T><T x={150} y={147} a="middle" w={700}>2 d</T><T x={246} y={147} a="middle" w={700}>3 d</T>
        <T x={150} y={165} a="middle" c={GRIS}>distance entre les centres</T>
      </svg>
      <ul style={liste}>
        <li><em>Plus loin, beaucoup plus faible : d × 3 ⇒ F ÷ 9.</em></li>
        <li>Quand d est <strong>divisée par 2</strong>, F est <strong>multipliée par 4</strong> : la courbe F = f(d) décroît fortement.</li>
        <li>Les forces entre deux personnes sont minuscules (G est très petit) : la gravitation ne devient notable que si un corps a une masse <strong>astronomique</strong>.</li>
      </ul>
    </div>
  );
}

// ── Carte D : la loi de Coulomb ──
export function FicheCoulomb() {
  return (
    <div>
      <Formule><mi>F</mi><mo>=</mo><mfrac><mrow><mi>k</mi><mo>×</mo><mrow><mo>|</mo><msub><mi>q</mi><mtext>A</mtext></msub><mo>|</mo></mrow><mo>×</mo><mrow><mo>|</mo><msub><mi>q</mi><mtext>B</mtext></msub><mo>|</mo></mrow></mrow><msup><mi>d</mi><mn>2</mn></msup></mfrac></Formule>
      <svg viewBox="0 0 300 130" style={svgStyle} role="img" aria-label="Deux charges de même signe se repoussent : les forces sont dirigées vers l’extérieur ; deux charges de signes opposés s’attirent : les forces sont dirigées l’une vers l’autre">
        <circle cx="104" cy="28" r="13" fill="#fee2e2" stroke={ROUGE} strokeWidth="2"/><text x="104" y="34" textAnchor="middle" fontSize="17" fontWeight="800" fill={ROUGE}>+</text>
        <circle cx="196" cy="28" r="13" fill="#fee2e2" stroke={ROUGE} strokeWidth="2"/><text x="196" y="34" textAnchor="middle" fontSize="17" fontWeight="800" fill={ROUGE}>+</text>
        <Arr x1={88} y1={28} x2={40} y2={28} c={ORANGE} w={3}/><Arr x1={212} y1={28} x2={260} y2={28} c={ORANGE} w={3}/>
        <T x={150} y={64} a="middle" c={ORANGE} w={800}>même signe : répulsion</T>
        <circle cx="70" cy="92" r="13" fill="#fee2e2" stroke={ROUGE} strokeWidth="2"/><text x="70" y="98" textAnchor="middle" fontSize="17" fontWeight="800" fill={ROUGE}>+</text>
        <circle cx="230" cy="92" r="13" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><text x="230" y="98" textAnchor="middle" fontSize="17" fontWeight="800" fill={BLEU}>−</text>
        <Arr x1={88} y1={92} x2={142} y2={92} c={ORANGE} w={3}/><Arr x1={212} y1={92} x2={158} y2={92} c={ORANGE} w={3}/>
        <T x={150} y={126} a="middle" c={ORANGE} w={800}>signes opposés : attraction</T>
      </svg>
      <ul style={liste}>
        <li><strong>k = 9,0 × 10⁹ N·m²·C⁻².</strong> La norme utilise les valeurs absolues des charges.</li>
        <li><strong>Méthode :</strong> convertir (1 nC = 10⁻⁹ C ; 1 µC = 10⁻⁶ C ; 1 cm = 10⁻² m), calculer le numérateur, diviser par d².</li>
        <li><strong>Exemple :</strong> q<sub>A</sub> = +4,0 µC, q<sub>B</sub> = −5,0 µC, d = 30 cm : F = 9,0 × 10⁹ × 4,0 × 10⁻⁶ × 5,0 × 10⁻⁶ / (0,30)² = <strong>2,0 N</strong>, attractive.</li>
        <li><strong>Hypothèse :</strong> charges ponctuelles. <strong>Pièges :</strong> conversions oubliées ; signe dans la norme.</li>
      </ul>
    </div>
  );
}

// ── Carte E : bilan, deux lois de même forme ──
export function FicheBilanInteractions() {
  const col = (x, c, titre, l) => (
    <g>
      <rect x={x} y="6" width="140" height="120" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <T x={x + 70} y={26} a="middle" c={c} w={800}>{titre}</T>
      {l.map((t, i) => <T key={i} x={x + 70} y={50 + i * 22} a="middle">{t}</T>)}
    </g>
  );
  return (
    <div>
      <svg viewBox="0 0 300 194" style={svgStyle} role="img" aria-label="Comparaison : la gravitation agit entre masses, toujours attractive, constante G, dominante pour les astres ; l’interaction électrostatique agit entre charges, attractive ou répulsive, constante k, dominante pour les atomes ; les deux lois varient en 1 sur d au carré ; dans l’atome d’hydrogène l’électrostatique l’emporte d’un facteur d’ordre 10 puissance 39">
        {col(6, BLEU, 'Gravitation', ['masses m (> 0)', 'toujours attractive', 'constante G', 'domaine : astres'])}
        {col(154, ROUGE, 'Électrostatique', ['charges q (+ ou −)', 'attire ou repousse', 'constante k', 'domaine : atomes'])}
        <T x={150} y={148} a="middle" c={VERT} w={800}>même forme : F ∝ 1 / d²</T>
        <T x={150} y={166} a="middle" w={700}>dans l’atome H : électro ≈ 10³⁹ × grav</T>
        <T x={150} y={184} a="middle" c={GRIS}>modèle : corps ponctuels ou sphériques</T>
      </svg>
      <ul style={liste}>
        <li><em>Deux lois, une même forme : produit des « charges », divisé par d².</em></li>
        <li>Chacune des forces est <strong>proportionnelle à chaque masse (ou charge)</strong> : une masse × 2 donne F × 2 ; d × 2 donne F ÷ 4.</li>
        <li><strong>Méthode :</strong> unités SI (kg, C, m), carré de la distance, ordre de grandeur et signe vérifiés. <strong>Pièges :</strong> oublier d² ; mélanger nC, µC et C ; croire que la plus grosse masse exerce la plus grande force.</li>
      </ul>
    </div>
  );
}
