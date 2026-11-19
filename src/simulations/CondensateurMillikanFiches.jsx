// Cartes « À retenir » de la simulation « Condensateur plan et gouttelette de Millikan » (sim 50, 1G).
// Chaque carte est posée UNE ÉTAPE (ou plus) APRÈS la question qu'elle conclut, avec d'autres exemples que ceux de l'étape.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320. Vecteurs avec flèche (TV / TL).
import { Formule } from "../commun";
import { TV } from "./Travail";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
// Deux plaques : + en haut (rouge), − en bas (bleu)
const Plaques = ({ x = 40, w = 220, y1 = 30, y2 = 118 }) => (
  <g>
    <rect x={x} y={y1} width={w} height="8" fill="#fecaca" stroke={ROUGE} strokeWidth="2"/>
    <rect x={x} y={y2} width={w} height="8" fill="#bfdbfe" stroke={BLEU} strokeWidth="2"/>
  </g>
);

// ── Carte A : le champ entre deux plaques, E = U / d ──
export function FichePlaques() {
  return (
    <div>
      <svg viewBox="0 0 300 168" style={svgStyle} role="img" aria-label="Condensateur plan : plaque positive en haut, plaque négative en bas, champ électrostatique dirigé vers le bas, tension U entre les plaques et distance d entre elles">
        <Plaques x={50} w={200}/>
        <T x={54} y={22} c={ROUGE} w={800}>plaque +</T><T x={54} y={152} c={BLEU} w={800}>plaque −</T>
        {[80, 115, 150, 185, 220].map(x => <Arr key={x} x1={x} y1={42} x2={x} y2={112} c={VERT} w={2.6}/>)}
        <TV x={156} y={86} c={VERT} s={14}>E</TV>
        <line x1="34" y1="34" x2="34" y2="122" stroke={GRIS} strokeWidth="1.8" strokeDasharray="4 3"/><T x={12} y={84} c={GRIS} w={800}>U</T>
        <line x1="270" y1="34" x2="270" y2="122" stroke={GRIS} strokeWidth="1.8"/><line x1="264" y1="34" x2="276" y2="34" stroke={GRIS} strokeWidth="1.8"/><line x1="264" y1="122" x2="276" y2="122" stroke={GRIS} strokeWidth="1.8"/>
        <T x={280} y={84} c={GRIS} w={800}>d</T>
      </svg>
      <Formule><mi>E</mi><mo>=</mo><mfrac><mi>U</mi><mi>d</mi></mfrac><mspace width="1.5em"/><mtext>1 V·m⁻¹ = 1 N·C⁻¹</mtext></Formule>
      <ul style={liste}>
        <li><em>Le champ va de la plaque + vers la plaque −, perpendiculaire aux plaques.</em></li>
        <li><strong>Méthode :</strong> U en volts, d converti en <strong>mètres</strong> (1 cm = 10⁻² m), puis E = U / d.</li>
        <li><strong>Exemple :</strong> U = 300 V, d = 1,5 cm : E = 300 / 0,015 = <strong>2,0 × 10⁴ V·m⁻¹</strong>. <strong>Hypothèse :</strong> effets de bord négligés.</li>
      </ul>
    </div>
  );
}

// ── Carte B : champ uniforme, E ∝ 1 / d ──
export function FicheUniforme() {
  const pts = [[80, 56], [150, 76], [215, 62]];
  return (
    <div>
      <svg viewBox="0 0 300 172" style={svgStyle} role="img" aria-label="Entre les plaques, le champ est le même en tout point : trois points différents ont la même flèche, même direction, même sens, même norme ; à tension constante, si la distance est multipliée par 3, la norme du champ est divisée par 3">
        <Plaques x={40} w={220} y1={22} y2={110}/>
        {pts.map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="4.5" fill={ENCRE}/><Arr x1={x} y1={y + 6} x2={x} y2={y + 26} c={VERT} w={3}/></g>)}
        <T x={150} y={14} a="middle" c={VERT} w={800}>le même champ en tout point</T>
        <T x={150} y={142} a="middle" c={ORANGE} w={800}>U fixe : d × 3 ⇒ E ÷ 3</T>
        <T x={150} y={162} a="middle" c={GRIS}>champ uniforme : E ne dépend pas de la position</T>
      </svg>
      <ul style={liste}>
        <li><em>Entre deux plaques, E est le même partout : même direction, même sens, même norme.</em></li>
        <li>À tension constante, E est <strong>inversement proportionnelle à d</strong> : d × 3 donne E ÷ 3.</li>
        <li><strong>Exemple :</strong> U = 300 V, d = 1,5 cm → 2,0 × 10⁴ V·m⁻¹ ; d = 4,5 cm → 6,7 × 10³ V·m⁻¹.</li>
      </ul>
    </div>
  );
}

// ── Carte C : la force électrique F = qE ──
export function FicheForceElectrique() {
  const cap = (x0, signe, c) => (
    <g>
      <rect x={x0} y="22" width="124" height="7" fill="#fecaca" stroke={ROUGE} strokeWidth="2"/>
      <rect x={x0} y="106" width="124" height="7" fill="#bfdbfe" stroke={BLEU} strokeWidth="2"/>
      <Arr x1={x0 + 22} y1={34} x2={x0 + 22} y2={100} c={VERT} w={2.4}/>
      <TV x={x0 + 30} y={52} c={VERT} s={13}>E</TV>
      <circle cx={x0 + 86} cy={68} r="12" fill={signe > 0 ? '#fee2e2' : '#dbeafe'} stroke={c} strokeWidth="2"/>
      <text x={x0 + 86} y={74} textAnchor="middle" fontSize="17" fontWeight="800" fill={c}>{signe > 0 ? '+' : '−'}</text>
      {signe > 0 ? <Arr x1={x0 + 86} y1={82} x2={x0 + 86} y2={102} c={ORANGE} w={3.2}/> : <Arr x1={x0 + 86} y1={54} x2={x0 + 86} y2={34} c={ORANGE} w={3.2}/>}
      <TV x={x0 + 96} y={signe > 0 ? 98 : 46} c={ORANGE} s={13}>F</TV>
    </g>
  );
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Entre deux plaques, le champ est dirigé vers le bas ; une charge positive subit une force vers le bas, de même sens que le champ ; une charge négative subit une force vers le haut, de sens opposé au champ">
        {cap(8, 1, ROUGE)}{cap(168, -1, BLEU)}
        <T x={70} y={134} a="middle" c={ROUGE} w={800}>q &gt; 0 : même sens</T>
        <T x={230} y={134} a="middle" c={BLEU} w={800}>q &lt; 0 : sens opposé</T>
      </svg>
      <Formule><mover><mi>F</mi><mo>→</mo></mover><mo>=</mo><mi>q</mi><mo>×</mo><mover><mi>E</mi><mo>→</mo></mover><mspace width="1.5em"/><mi>F</mi><mo>=</mo><mrow><mo>|</mo><mi>q</mi><mo>|</mo></mrow><mo>×</mo><mi>E</mi></Formule>
      <ul style={liste}>
        <li><em>Charge positive : la force suit le champ ; charge négative : elle va à contre-sens.</em></li>
        <li><strong>Exemple :</strong> q = +2e = 3,204 × 10⁻¹⁹ C dans E = 3,0 × 10⁴ N·C⁻¹ : F = 3,204 × 10⁻¹⁹ × 3,0 × 10⁴ ≈ <strong>9,6 × 10⁻¹⁵ N</strong>, vers le bas.</li>
        <li><strong>Pièges :</strong> charge non convertie en coulombs ; signe moins dans une norme.</li>
      </ul>
    </div>
  );
}

// ── Carte D : le poids d'une gouttelette ──
export function FichePoidsGoutte() {
  return (
    <div>
      <svg viewBox="0 0 300 148" style={svgStyle} role="img" aria-label="Gouttelette d’huile sphérique de rayon 0,50 micromètre : sa masse vaut environ 4,6 fois 10 puissance moins 16 kilogramme, son poids environ 4,6 fois 10 puissance moins 15 newton, dirigé vers le bas">
        <circle cx="62" cy="40" r="20" fill="#fde68a" stroke={ENCRE} strokeWidth="2.2"/><T x={62} y={45} a="middle" w={800}>r</T>
        <Arr x1={62} y1={64} x2={62} y2={122} c={ROUGE} w={3.4}/><TV x={74} y={100} c={ROUGE} s={14}>P</TV>
        <T x={116} y={36} w={700}>r = 0,50 µm</T>
        <T x={116} y={58}>m = ρ × V, ρ = 886 kg·m⁻³</T>
        <T x={116} y={82} c={ORANGE} w={800}>m ≈ 4,6 × 10⁻¹⁶ kg</T>
        <T x={116} y={110} c={ROUGE} w={800}>P ≈ 4,6 × 10⁻¹⁵ N</T>
        <T x={116} y={136} c={GRIS}>vers le bas (g = 9,81 N·kg⁻¹)</T>
      </svg>
      <Formule><mi>m</mi><mo>=</mo><mi>ρ</mi><mo>×</mo><mfrac><mn>4</mn><mn>3</mn></mfrac><mi>π</mi><msup><mi>r</mi><mn>3</mn></msup><mspace width="1.5em"/><mi>P</mi><mo>=</mo><mi>m</mi><mo>×</mo><mi>g</mi></Formule>
      <ul style={liste}>
        <li><em>Une toute petite sphère d’huile : masse minuscule, poids minuscule, mais comparable à la force électrique.</em></li>
        <li><strong>Méthode :</strong> r en <strong>mètres</strong> (1 µm = 10⁻⁶ m), V = (4/3) π r³, puis m = ρ × V et P = m × g.</li>
        <li><strong>Exemple :</strong> V = (4/3) × π × (5,0 × 10⁻⁷)³ ≈ 5,2 × 10⁻¹⁹ m³. <strong>Pièges :</strong> r au lieu de r³ ; µm non converti.</li>
      </ul>
    </div>
  );
}

// ── Carte E : l'équilibre F = P ──
export function FicheEquilibre() {
  return (
    <div>
      <svg viewBox="0 0 300 166" style={svgStyle} role="img" aria-label="Gouttelette immobile entre les plaques : la force électrique vers le haut et le poids vers le bas ont la même norme et se compensent ; la plaque du haut est positive et la charge est négative">
        <Plaques x={30} w={240} y1={22} y2={126}/>
        <T x={36} y={16} c={ROUGE} w={800}>plaque +</T><T x={36} y={152} c={BLEU} w={800}>plaque −</T>
        <Arr x1={56} y1={36} x2={56} y2={112} c={VERT} w={2.4}/><TV x={64} y={78} c={VERT} s={13}>E</TV>
        <circle cx="170" cy="74" r="13" fill="#fde68a" stroke={ENCRE} strokeWidth="2.2"/><text x="170" y="80" textAnchor="middle" fontSize="17" fontWeight="800" fill={BLEU}>−</text>
        <Arr x1={170} y1={59} x2={170} y2={32} c={ORANGE} w={3.4}/><TV x={182} y={46} c={ORANGE} s={14}>F</TV>
        <Arr x1={170} y1={89} x2={170} y2={116} c={ROUGE} w={3.4}/><TV x={182} y={108} c={ROUGE} s={14}>P</TV>
        <T x={214} y={80} c={VERT} w={800}>F = P</T>
        <T x={214} y={98} c={GRIS}>immobile</T>
      </svg>
      <Formule><mi>F</mi><mo>=</mo><mi>P</mi><mo>⇔</mo><mfrac><mrow><mrow><mo>|</mo><mi>q</mi><mo>|</mo></mrow><mo>×</mo><mi>U</mi></mrow><mi>d</mi></mfrac><mo>=</mo><mi>m</mi><mo>×</mo><mi>g</mi></Formule>
      <ul style={liste}>
        <li><em>Gouttelette immobile : la force électrique compense exactement le poids.</em></li>
        <li>Charge <strong>négative</strong> : pour que F soit vers le haut, la plaque du haut doit être <strong>positive</strong> (champ vers le bas).</li>
        <li><strong>Exemple :</strong> m = 4,6 × 10⁻¹⁶ kg, |q| = e, d = 2,0 cm : U = m × g × d / |q| ≈ <strong>5,7 × 10² V</strong>.</li>
      </ul>
    </div>
  );
}

// ── Carte F : Millikan, la charge est quantifiée ──
export function FicheMillikan() {
  const X = n => 30 + n * 46;
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Droite graduée des valeurs de n égal charge divisée par e : une mesure à 3,0 est acceptable car proche d’un entier ; une mesure à 2,4 est impossible car n doit être entier">
        <T x={8} y={18} w={700}>n = |q| / e</T>
        <line x1="24" y1="64" x2="270" y2="64" stroke={GRIS} strokeWidth="2.2"/>
        {[1, 2, 3, 4, 5].map(n => <g key={n}><line x1={X(n)} y1="56" x2={X(n)} y2="72" stroke={GRIS} strokeWidth="2.2"/><T x={X(n)} y={92} a="middle">{n}</T></g>)}
        <circle cx={X(3)} cy="64" r="6" fill={VERT}/><T x={X(3)} y={46} a="middle" c={VERT} w={800}>3,0 ✓</T>
        <circle cx={X(2.4)} cy="64" r="6" fill="none" stroke={ROUGE} strokeWidth="2.5"/><T x={X(2.4) - 2} y={34} a="middle" c={ROUGE} w={800}>2,4 ✗</T>
        <T x={150} y={118} a="middle" c={VERT} w={800}>n doit être un entier</T>
        <T x={150} y={138} a="middle" c={GRIS}>(aux incertitudes de mesure près)</T>
      </svg>
      <Formule><mrow><mo>|</mo><mi>q</mi><mo>|</mo></mrow><mo>=</mo><mfrac><mrow><mi>m</mi><mo>×</mo><mi>g</mi><mo>×</mo><mi>d</mi></mrow><mi>U</mi></mfrac></Formule>
      <ul style={liste}>
        <li><em>Toutes les charges mesurées sont des multiples entiers de e : la charge est quantifiée.</em> Charge élémentaire : e = 1,602 × 10⁻¹⁹ C.</li>
        <li><strong>Méthode :</strong> calculer |q| à l’équilibre, la diviser par e, retenir l’<strong>entier</strong> le plus proche.</li>
        <li><strong>Exemple :</strong> |q| = 4,8 × 10⁻¹⁹ C : n = 4,8 / 1,602 ≈ 3,0, donc q = ±3e. Un résultat comme 2,4 serait impossible.</li>
      </ul>
    </div>
  );
}
