// Cartes « À retenir » de la simulation 7 (évaporation et cristallisation) : un schéma et une idée mémorisable par carte.
// Les exemples chiffrés sont volontairement différents des valeurs demandées par les étapes qui les portent.
import { Formule, FormuleEnLigne } from "../commun";
import { SOLUB, SOLUB_NACL } from "./cristallisationModele";

const NB = ' ';
// Repère commun des courbes de solubilité (viewBox 400 × 242) : T de 0 à 100 °C, s de 0 à 250 g pour 100 g d'eau
const X = T => 50 + 3.3 * T;
const Y = s => 200 - 0.7 * s;
const pts = tab => tab.map(([t, s]) => `${X(t).toFixed(1)},${Y(s).toFixed(1)}`).join(' ');
const BLEU = '#0369a1', ORANGE = '#b45309', ROUGE = '#dc2626', GRIS = '#475569';
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const svgStyle = { width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' };

function Axes() {
  return (
    <g fontSize="13" fill={GRIS}>
      <line x1="50" y1="200" x2="388" y2="200" stroke={GRIS} strokeWidth="1.5"/>
      <line x1="50" y1="200" x2="50" y2="22" stroke={GRIS} strokeWidth="1.5"/>
      {[0, 20, 40, 60, 80, 100].map(t => <text key={t} x={X(t)} y="218" textAnchor="middle">{t}</text>)}
      {[0, 100, 200].map(s => <text key={s} x="44" y={Y(s) + 4} textAnchor="end">{s}</text>)}
      <text x="388" y="236" textAnchor="end">T (°C)</text>
      <text x="54" y="16">g de KNO₃ pour 100 g d’eau</text>
    </g>
  );
}
const Courbe = () => <polyline points={pts(SOLUB)} fill="none" stroke="#0096c7" strokeWidth="3" strokeLinejoin="round"/>;

// ── Carte 1 : solubilité et saturation ──
export function FicheSolubilite() {
  const sous = `${pts(SOLUB)} ${X(100)},200 ${X(0)},200`;
  const dessus = `${pts(SOLUB)} ${X(100)},22 ${X(0)},22`;
  return (
    <div>
      <svg viewBox="0 0 400 242" style={svgStyle} role="img" aria-label="Courbe de solubilité de KNO₃ : sous la courbe tout est dissous, au-dessus l’excès cristallise ; à 80 °C la solubilité vaut 169 g pour 100 g d’eau">
        <polygon points={dessus} fill="rgba(245,158,11,0.14)"/>
        <polygon points={sous} fill="rgba(14,165,233,0.16)"/>
        <Axes/>
        <Courbe/>
        <g fontSize="14">
          <text x="60" y="38" fill={ORANGE} fontWeight="700">au-dessus de la courbe :</text>
          <text x="60" y="55" fill={ORANGE}>l’excès cristallise</text>
          <text x="215" y="172" fill={BLEU} fontWeight="700" textAnchor="middle">sous la courbe :</text>
          <text x="215" y="190" fill={BLEU} textAnchor="middle">tout est dissous</text>
        </g>
        <line x1="50" y1={Y(169)} x2={X(80)} y2={Y(169)} stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4,3"/>
        <line x1={X(80)} y1={Y(169)} x2={X(80)} y2="200" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4,3"/>
        <circle cx={X(80)} cy={Y(169)} r="5.5" fill="#f59e0b" stroke="white" strokeWidth="1.5"/>
        <text x={X(80) - 9} y={Y(169) - 6} fontSize="14" fontWeight="700" fill={ORANGE} textAnchor="end">80 °C : 169 g</text>
      </svg>
      <ul style={liste}>
        <li><strong>Solubilité</strong> : masse maximale de sel que l’on peut dissoudre dans 100 g d’eau, à une température donnée.</li>
        <li><em>Sous la courbe, tout se dissout ; au-dessus, l’excès cristallise.</em></li>
        <li>Exemple : à 80 °C, 100 g d’eau dissolvent au plus 169 g de KNO₃.</li>
      </ul>
    </div>
  );
}

// ── Cartes 2 et 4 : barre « dissous / cristaux » (exemple : 70 g de KNO₃ pour 100 g d'eau, refroidis à 30 °C) ──
const M70 = 70, DISS30 = 45.8, CRIST30 = 24.2;
const barre = (x0, w) => ({ dissous: w * DISS30 / M70, cristaux: w * CRIST30 / M70, x0, w });

export function FicheBilan() {
  const b = barre(50, 330);
  return (
    <div>
      <svg viewBox="0 0 400 176" style={svgStyle} role="img" aria-label="70 g de KNO₃ introduits pour 100 g d’eau, refroidis à 30 °C : 45,8 g restent dissous et 24,2 g forment des cristaux">
        <text x="215" y="18" textAnchor="middle" fontSize="14" fill="#0f172a">70 g de KNO₃ pour 100 g d’eau, refroidis à 30 °C</text>
        <g stroke={GRIS} strokeWidth="1.5"><line x1="50" y1="50" x2="380" y2="50"/><line x1="50" y1="44" x2="50" y2="56"/><line x1="380" y1="44" x2="380" y2="56"/></g>
        <text x="215" y="42" textAnchor="middle" fontSize="14" fill={GRIS}>introduit : 70 g</text>
        <rect x={b.x0} y="62" width={b.dissous} height="46" fill="#0284c7"/>
        <rect x={b.x0 + b.dissous} y="62" width={b.cristaux} height="46" fill="#f59e0b"/>
        <text x={b.x0 + b.dissous / 2} y="90" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">dissous : 45,8 g</text>
        <text x={b.x0 + b.dissous + b.cristaux / 2} y="82" textAnchor="middle" fontSize="14" fontWeight="700" fill="#451a03">cristaux</text>
        <text x={b.x0 + b.dissous + b.cristaux / 2} y="99" textAnchor="middle" fontSize="14" fontWeight="700" fill="#451a03">24,2 g</text>
        <text x="215" y="138" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a">m(cristaux) = m(introduit) − m(dissous)</text>
        <text x="215" y="160" textAnchor="middle" fontSize="15" fill="#0f172a">= 70 − 45,8 = 24,2 g</text>
      </svg>
      <ul style={liste}>
        <li>Le sel introduit se partage : <strong>une part reste dissoute</strong> (la solubilité), <strong>le reste cristallise</strong>.</li>
        <li><em>Cristaux = introduit − dissous.</em></li>
        <li>Pour 100 g d’eau : m(dissous) = solubilité. Pour une autre masse d’eau, on la multiplie par <FormuleEnLigne><mfrac><mrow><mi>m</mi><mo>(</mo><mtext>eau</mtext><mo>)</mo></mrow><mrow><mn>100</mn><mtext>{NB}g</mtext></mrow></mfrac></FormuleEnLigne>.</li>
      </ul>
    </div>
  );
}

export function FicheRendement() {
  const b = barre(50, 330);
  return (
    <div>
      <svg viewBox="0 0 400 130" style={svgStyle} role="img" aria-label="Rendement : sur 70 g de sel introduits, 24,2 g sont récupérés sous forme de cristaux, soit 35 %, le reste est resté dissous dans l’eau-mère">
        <text x="215" y="18" textAnchor="middle" fontSize="14" fill="#0f172a">Exemple : 70 g de KNO₃ refroidis à 30 °C</text>
        <rect x={b.x0} y="30" width={b.cristaux} height="46" fill="#f59e0b"/>
        <rect x={b.x0 + b.cristaux} y="30" width={b.dissous} height="46" fill="#0284c7"/>
        <text x={b.x0 + b.cristaux / 2} y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="#451a03">récupéré</text>
        <text x={b.x0 + b.cristaux + b.dissous / 2} y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">reste dans l’eau-mère</text>
        <g stroke={GRIS} strokeWidth="1.5"><line x1="50" y1="92" x2="380" y2="92"/><line x1="50" y1="86" x2="50" y2="98"/><line x1="380" y1="86" x2="380" y2="98"/></g>
        <text x="215" y="116" textAnchor="middle" fontSize="14" fill={GRIS}>100 % du sel introduit (70 g)</text>
      </svg>
      <Formule><mi>η</mi><mo>=</mo><mfrac><mrow><mi>m</mi><mo>(</mo><mtext>cristaux</mtext><mo>)</mo></mrow><mrow><mi>m</mi><mo>(</mo><mtext>introduit</mtext><mo>)</mo></mrow></mfrac><mo>×</mo><mn>100</mn></Formule>
      <Formule><mi>η</mi><mo>=</mo><mfrac><mn>24,2</mn><mn>70</mn></mfrac><mo>×</mo><mn>100</mn><mo>≈</mo><mn>35</mn><mtext>{NB}%</mtext></Formule>
      <ul style={liste}>
        <li>Le rendement η est la <strong>part du sel introduit que l’on récupère</strong>.</li>
        <li><em>Jamais 100 % : le sel resté dissous est perdu dans l’eau-mère.</em></li>
        <li>Il est meilleur quand la solubilité chute beaucoup entre la température de départ et la température finale.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : température d'apparition des premiers cristaux (exemple : 50 g de KNO₃ pour 100 g d'eau) ──
export function FichePremiersCristaux() {
  const T50 = 30 + 10 * (50 - 45.8) / (63.9 - 45.8);   // ≈ 32,3 °C
  return (
    <div>
      <svg viewBox="0 0 400 242" style={svgStyle} role="img" aria-label="Pour 50 g de KNO₃ dans 100 g d’eau, la composition globale rejoint la courbe de solubilité vers 32 °C : les premiers cristaux apparaissent">
        
        <Axes/>
        <Courbe/>
        <line x1="50" y1={Y(50)} x2="385" y2={Y(50)} stroke={ORANGE} strokeWidth="1.5" strokeDasharray="5,4"/>
        <text x="385" y={Y(50) + 18} fontSize="14" fill={ORANGE} textAnchor="end">50 g pour 100 g d’eau</text>
        <line x1="338" y1="146" x2="262" y2="146" stroke={ORANGE} strokeWidth="2.5"/>
        <polygon points="256,146 268,139 268,153" fill={ORANGE}/>
        <text x="298" y="138" fontSize="14" fontWeight="700" fill={ORANGE} textAnchor="middle">on refroidit</text>
        <line x1={X(T50)} y1={Y(50)} x2={X(T50)} y2="200" stroke={ROUGE} strokeWidth="1.5" strokeDasharray="4,3"/>
        <circle cx={X(T50)} cy={Y(50)} r="5.5" fill={ROUGE} stroke="white" strokeWidth="1.5"/>
        <text x="60" y="118" fontSize="14" fontWeight="700" fill={ROUGE}>premiers cristaux</text>
        <text x="60" y="136" fontSize="14" fontWeight="700" fill={ROUGE}>vers 32 °C</text>
        <line x1="112" y1="142" x2={X(T50) - 6} y2={Y(50) - 5} stroke={ROUGE} strokeWidth="1.2"/>
      </svg>
      <ul style={liste}>
        <li>On refroidit à composition constante : le point se déplace <strong>horizontalement</strong> jusqu’à la courbe.</li>
        <li><em>Les cristaux apparaissent quand la solubilité devient égale à la masse de sel pour 100 g d’eau.</em></li>
        <li>Exemple : 50 g de KNO₃ pour 100 g d’eau → solubilité de 50 g → vers 32 °C (entre 45,8 g à 30 °C et 63,9 g à 40 °C).</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : évaporation à température constante (exemple : 100 g de KNO₃ à 70 °C, solubilité 138 g) ──
function Becher({ x, niveau, points, cristaux }) {
  const bas = 134, haut = 34, l = 92, h = niveau;
  return (
    <g>
      <rect x={x + 1} y={bas - h} width={l - 2} height={h} fill="rgba(14,165,233,0.28)"/>
      {points.map(([px, py], i) => <circle key={i} cx={x + px} cy={bas - py} r="3.5" fill="#0369a1"/>)}
      {cristaux.map(([px, py], i) => <polygon key={i} transform={`translate(${x + px},${bas - py})`} points="0,-6 4,-2 6,0 4,2 0,6 -4,2 -6,0 -4,-2" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8"/>)}
      <path d={`M${x},${haut} V${bas} H${x + l} V${haut}`} fill="none" stroke={GRIS} strokeWidth="2.5" strokeLinejoin="round"/>
    </g>
  );
}
export function FicheEvaporation() {
  const pts1 = [[14, 14], [34, 30], [58, 20], [76, 44], [24, 52], [48, 62], [70, 70], [16, 74]];
  return (
    <div>
      <svg viewBox="0 0 400 206" style={svgStyle} role="img" aria-label="Trois béchers : en évaporant l’eau à température constante, 100 g de KNO₃ restent dissous avec 100 g d’eau, la solution devient saturée à 72,5 g d’eau, puis des cristaux se forment à 40 g d’eau">
        <defs><marker id="crFl2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke={ORANGE} strokeWidth="1.8"/></marker></defs>
        <line x1="40" y1="22" x2="350" y2="22" stroke={ORANGE} strokeWidth="2" markerEnd="url(#crFl2)"/>
        <text x="195" y="15" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>on évapore l’eau, à 70 °C</text>
        <Becher x={20} niveau={92} points={pts1} cristaux={[]}/>
        <Becher x={154} niveau={66} points={pts1.slice(0, 7).map(([a, b]) => [a, b * 0.72])} cristaux={[]}/>
        <Becher x={288} niveau={37} points={[[16, 16], [40, 26], [66, 14], [30, 32]]} cristaux={[[14, 8], [30, 6], [46, 8], [62, 6], [78, 8], [24, 16]]}/>
        <g fontSize="14" textAnchor="middle" fill="#0f172a">
          <text x="66" y="156" fontWeight="700">eau : 100 g</text><text x="66" y="174" fill={BLEU}>insaturée</text>
          <text x="200" y="156" fontWeight="700">eau : 72,5 g</text><text x="200" y="174" fill={ROUGE}>juste saturée</text>
          <text x="334" y="156" fontWeight="700">eau : 40 g</text><text x="334" y="174" fill={ORANGE}>cristaux</text>
          <text x="200" y="200" fill={GRIS}>le sel (100 g) ne s’évapore pas</text>
        </g>
      </svg>
      <ul style={liste}>
        <li>Par évaporation, la <strong>masse de sel ne change pas</strong> : seule la masse d’eau diminue, la solution se concentre.</li>
        <li><em>Moins d’eau, même sel : la solution se concentre, puis cristallise.</em></li>
        <li>Exemple : 100 g de KNO₃ à 70 °C (solubilité 138 g pour 100 g d’eau) : la saturation est atteinte pour</li>
      </ul>
      <Formule><mi>m</mi><mo>(</mo><mtext>eau</mtext><mo>)</mo><mo>=</mo><mfrac><mrow><mn>100</mn><mo>×</mo><mn>100</mn></mrow><mn>138</mn></mfrac><mo>≈</mo><mn>72,5</mn><mtext>{NB}g</mtext></Formule>
    </div>
  );
}

// ── Carte 6 : quel procédé choisir ? ──
export function FicheProcede() {
  return (
    <div>
      <svg viewBox="0 0 400 242" style={svgStyle} role="img" aria-label="Deux courbes de solubilité : celle de KNO₃ monte fortement avec la température, celle de NaCl est presque horizontale">
        <Axes/>
        <polyline points={pts(SOLUB_NACL)} fill="none" stroke={GRIS} strokeWidth="3" strokeLinejoin="round"/>
        <Courbe/>
        <line x1="60" y1="55" x2="80" y2="55" stroke="#0096c7" strokeWidth="3"/>
        <text x="86" y="60" fontSize="14" fontWeight="700" fill={BLEU}>KNO₃ : on refroidit</text>
        <line x1="236" y1="152" x2="256" y2="152" stroke={GRIS} strokeWidth="3"/>
        <text x="262" y="157" fontSize="14" fontWeight="700" fill={GRIS}>NaCl : on évapore</text>
      </svg>
      <ul style={liste}>
        <li>Courbe <strong>raide</strong> (KNO₃) : refroidir fait cristalliser beaucoup de sel.</li>
        <li>Courbe <strong>presque plate</strong> (NaCl : 36 g à 20 °C, 39 g à 100 °C) : refroidir ne sert à rien, il faut <strong>évaporer</strong> l’eau (marais salants).</li>
        <li><em>Raide : on refroidit ; plate : on évapore.</em></li>
      </ul>
    </div>
  );
}

// ── Carte 7 : évaporer sous pression réduite ──
export function FichePression() {
  const bec = (x, bulles) => (
    <g>
      <path d={`M${x + 4} 120 L${x + 8} 176 Q${x + 9} 182 ${x + 18} 182 L${x + 102} 182 Q${x + 111} 182 ${x + 112} 176 L${x + 116} 120 Z`} fill="#bae6fd" opacity="0.7"/>
      <path d={`M${x} 92 L${x + 8} 176 Q${x + 9} 182 ${x + 18} 182 L${x + 102} 182 Q${x + 111} 182 ${x + 112} 176 L${x + 120} 92`} fill="none" stroke="#334155" strokeWidth="3" strokeLinejoin="round"/>
      {bulles.map(([a, b, r], i) => <circle key={i} cx={x + a} cy={b} r={r} fill="#fff" fillOpacity="0.7" stroke="#38bdf8" strokeWidth="1.8"/>)}
    </g>);
  const bulles = [[30, 160, 5], [60, 150, 6], [90, 164, 5], [48, 136, 4], [80, 138, 5]];
  return (
    <div>
      <svg viewBox="0 0 400 236" style={svgStyle} role="img" aria-label="Deux béchers : sous la pression atmosphérique de 101 kilopascals, l’eau bout à 100 degrés ; sous une pression réduite de 20 kilopascals, produite par une pompe à vide, l’eau bout à 60 degrés">
        <text x="100" y="20" textAnchor="middle" fontSize="15" fontWeight="800" fill={GRIS}>pression de l’air</text>
        <text x="300" y="20" textAnchor="middle" fontSize="15" fontWeight="800" fill={BLEU}>pression réduite</text>
        <text x="100" y="40" textAnchor="middle" fontSize="16" fontWeight="800" fill={GRIS}>101 kPa</text>
        <text x="300" y="40" textAnchor="middle" fontSize="16" fontWeight="800" fill={BLEU}>20 kPa</text>
        {bec(40, bulles)}
        {bec(240, bulles)}
        <rect x="234" y="86" width="132" height="11" rx="4" fill="#64748b" stroke="#334155" strokeWidth="2"/>
        <rect x="293" y="68" width="14" height="19" rx="3" fill="#94a3b8" stroke="#334155" strokeWidth="2"/>
        <path d="M300 68 V52 H350" fill="none" stroke="#64748b" strokeWidth="6"/>
        <rect x="340" y="40" width="58" height="22" rx="6" fill="#475569"/>
        <text x="369" y="56" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">pompe</text>
        <g stroke={ORANGE} strokeWidth="3" fill="none" strokeLinecap="round"><path d="M70 194 q5 -8 0 -14"/><path d="M100 194 q5 -8 0 -14"/><path d="M130 194 q5 -8 0 -14"/></g>
        <text x="100" y="214" textAnchor="middle" fontSize="15" fontWeight="800" fill={ROUGE}>l’eau bout à 100 °C</text>
        <text x="300" y="214" textAnchor="middle" fontSize="15" fontWeight="800" fill={BLEU}>l’eau bout à 60 °C</text>
        <text x="200" y="231" textAnchor="middle" fontSize="13.5" fill={GRIS}>moins de pression, ébullition à plus basse température</text>
      </svg>
      <ul style={liste}>
        <li>L’eau bout à 100 °C sous la pression atmosphérique (101 kPa) : <strong>baisser la pression</strong> fait bouillir l’eau à une température plus basse.</li>
        <li>À 60 °C, il suffit d’une pression de <strong>20 kPa</strong>, obtenue avec une pompe à vide.</li>
        <li>On évapore ainsi l’eau <strong>sans chauffer à 100 °C</strong> : le sel ne s’évapore pas, il reste dans le bécher.</li>
      </ul>
    </div>
  );
}
