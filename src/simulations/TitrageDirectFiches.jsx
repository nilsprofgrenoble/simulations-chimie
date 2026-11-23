// Cartes « À retenir » du titrage direct (sim 2) : un schéma et une idée mémorisable par carte.
// Les exemples chiffrés sont volontairement différents des valeurs demandées par les étapes qui les portent.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#dc2626', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// Erlenmeyer : (x, y) = coin haut gauche de la boîte de 100 × 110 ; niveau du liquide à y + 55
function Erlen({ x, y = 18, liquide, children }) {
  return (
    <g>
      <polygon points={`${x + 19},${y + 66} ${x + 81},${y + 66} ${x + 95},${y + 107} ${x + 5},${y + 107}`} fill={liquide}/>
      <path d={`M${x + 35},${y} L${x + 35},${y + 34} L${x + 5},${y + 107} L${x + 95},${y + 107} L${x + 65},${y + 34} L${x + 65},${y}`}
        fill="none" stroke={GRIS} strokeWidth="2.5" strokeLinejoin="round"/>
      {children}
    </g>
  );
}
const I2 = ({ cx, cy }) => <circle cx={cx} cy={cy} r="5.5" fill="#92400e"/>;
const Thio = ({ cx, cy }) => <rect x={cx - 5} y={cy - 5} width="10" height="10" fill={BLEU}/>;

// ── Carte : l'indicateur de fin de réaction (thiodène) ──
export function FichePrecis() {
  return (
    <div>
      <svg viewBox="0 0 400 200" style={svgStyle} role="img" aria-label="Avec le thiodène, la solution est bleu très foncé tant qu’il reste du diiode, puis la couleur disparaît brutalement à l’équivalence, à une goutte près">
        <Erlen x={30} liquide="#1e1b4b">
          <I2 cx={50} cy={105}/><I2 cx={72} cy={96}/><I2 cx={92} cy={110}/>
        </Erlen>
        <Erlen x={270} liquide="rgba(186,230,253,0.45)"/>
        <line x1="150" y1="75" x2="250" y2="75" stroke={ORANGE} strokeWidth="2.5"/>
        <polygon points="258,75 246,68 246,82" fill={ORANGE}/>
        <text x="200" y="58" textAnchor="middle" fontSize="17" fontWeight="700" fill={ORANGE}>1 goutte</text>
        <text x="200" y="98" textAnchor="middle" fontSize="17" fill={GRIS}>(≈ 0,05 mL)</text>
        <text x="80" y="152" textAnchor="middle" fontSize="17" fontWeight="700" fill={ENCRE}>avant Vₑ</text>
        <text x="80" y="170" textAnchor="middle" fontSize="17" fill={GRIS}>bleu très foncé</text>
        <text x="320" y="152" textAnchor="middle" fontSize="17" fontWeight="700" fill={ENCRE}>à Vₑ</text>
        <text x="320" y="170" textAnchor="middle" fontSize="17" fill={GRIS}>décoloré d’un coup</text>
      </svg>
      <ul style={liste}>
        <li>Le <strong>thiodène</strong> (empois d’amidon) forme avec le diiode un composé <strong>bleu très foncé</strong> : visible même pour très peu de diiode.</li>
        <li>On l’ajoute <strong>près de l’équivalence</strong> (environ 1 mL avant), quand la solution est jaune pâle.</li>
        <li><em>La couleur disparaît brutalement : c’est le repère de V<sub>B,e</sub>.</em></li>
      </ul>
    </div>
  );
}

// ── Carte : avant, à et après l'équivalence ──
export function FicheEquivalence() {
  return (
    <div>
      <svg viewBox="0 0 400 214" style={svgStyle} role="img" aria-label="Trois erlenmeyers : avant l’équivalence le diiode est en excès, à l’équivalence il ne reste aucun réactif, après l’équivalence le thiosulfate est en excès">
        <Erlen x={6} liquide="rgba(180,83,9,0.35)">
          <I2 cx={30} cy={104}/><I2 cx={52} cy={94}/><I2 cx={72} cy={110}/>
        </Erlen>
        <Erlen x={150} liquide="rgba(186,230,253,0.45)"/>
        <Erlen x={294} liquide="rgba(186,230,253,0.45)">
          <Thio cx={324} cy={104}/><Thio cx={346} cy={94}/><Thio cx={366} cy={110}/>
        </Erlen>
        <g fontSize="17" textAnchor="middle">
          <text x="56" y="158" fontWeight="700" fill={ENCRE}>avant</text>
          <text x="56" y="180" fill="#92400e" fontWeight="700">I₂ en excès</text>
          <text x="56" y="202" fill={GRIS}>jaune-brun</text>
          <text x="200" y="158" fontWeight="700" fill={ENCRE}>à l’équivalence</text>
          <text x="200" y="180" fill={VERT} fontWeight="700">aucun en excès</text>
          <text x="200" y="202" fill={GRIS}>décolorée</text>
          <text x="344" y="158" fontWeight="700" fill={ENCRE}>après</text>
          <text x="338" y="180" fontSize="16" fill={BLEU} fontWeight="700">S₂O₃²⁻ en excès</text>
          <text x="344" y="202" fill={GRIS}>incolore</text>
        </g>
      </svg>
      <ul style={liste}>
        <li>À l’<strong>équivalence</strong>, les réactifs sont dans les <strong>proportions stœchiométriques</strong> : il n’en reste aucun.</li>
        <li><em>Avant : le diiode est en excès. Après : c’est le thiosulfate.</em></li>
        <li>La solution <strong>titrante</strong> (burette) est connue ; la solution <strong>titrée</strong> (erlenmeyer) est celle que l’on cherche.</li>
      </ul>
    </div>
  );
}

// ── Carte : la relation à l'équivalence (exemple : 8,0 mmol de thiosulfate versées) ──
export function FicheRelation() {
  return (
    <div>
      <svg viewBox="0 0 400 150" style={svgStyle} role="img" aria-label="Il faut deux ions thiosulfate pour une molécule de diiode : 8,0 millimoles de thiosulfate versées à l’équivalence correspondent à 4,0 millimoles de diiode">
        <g>
          <Thio cx={50} cy={40}/><Thio cx={74} cy={40}/><text x="100" y="46" fontSize="19" fill={ENCRE}>+</text>
          <I2 cx={126} cy={40}/>
          <text x="148" y="46" fontSize="21.5" fill={ENCRE}>→</text>
          <text x="176" y="46" fontSize="18" fill={GRIS}>produits</text>
        </g>
        <text x="62" y="68" textAnchor="middle" fontSize="17" fontWeight="700" fill={BLEU}>2 S₂O₃²⁻</text>
        <text x="126" y="68" textAnchor="middle" fontSize="17" fontWeight="700" fill="#92400e">1 I₂</text>
        <line x1="20" y1="82" x2="380" y2="82" stroke="#cbd5e1" strokeWidth="1.5"/>
        <text x="200" y="108" textAnchor="middle" fontSize="18" fill={ENCRE}>8,0 mmol de S₂O₃²⁻ versées</text>
        <text x="200" y="130" textAnchor="middle" fontSize="18" fontWeight="700" fill="#92400e">→ 8,0 ÷ 2 = 4,0 mmol de I₂ titrées</text>
      </svg>
      <Formule><mfrac><mrow><mi>n</mi><mo>(</mo><msub><mtext>I</mtext><mn>2</mn></msub><mo>)</mo></mrow><mn>1</mn></mfrac><mo>=</mo><mfrac><mrow><mi>n</mi><mo>(</mo><mtext>S₂O₃²⁻</mtext><mo>)</mo></mrow><mn>2</mn></mfrac></Formule>
      <ul style={liste}>
        <li>Les coefficients 1 et 2 viennent de l’équation : <strong>2 ions thiosulfate pour 1 molécule de diiode</strong>.</li>
        <li><em>Quantité de matière : n = c × V, avec V en litres.</em></li>
      </ul>
    </div>
  );
}

// ── Carte : la chaîne de calcul de V_B,e à la masse ──
const Boite = ({ x, y, w, t1, t2 }) => (
  <g><rect x={x} y={y} width={w} height="44" rx="8" fill="#eaf2fb" stroke="#7aa6d6" strokeWidth="2"/>
    <text x={x + w / 2} y={y + 19} textAnchor="middle" fontSize="17" fontWeight="700" fill={ENCRE}>{t1}</text>
    <text x={x + w / 2} y={y + 36} textAnchor="middle" fontSize="16.5" fill={GRIS}>{t2}</text></g>
);
// flèche horizontale de x1 vers x2 (dans un sens ou dans l'autre)
const Fleche = ({ x1, x2, y }) => {
  const d = x2 > x1 ? 1 : -1;
  return <g><line x1={x1} y1={y} x2={x2 - 8 * d} y2={y} stroke={ORANGE} strokeWidth="2.5"/><polygon points={`${x2},${y} ${x2 - 11 * d},${y - 6} ${x2 - 11 * d},${y + 6}`} fill={ORANGE}/></g>;
};
const Etiq = ({ x, y, children, anchor = 'middle' }) => <text x={x} y={y} textAnchor={anchor} fontSize="17" fontWeight="700" fill={ORANGE}>{children}</text>;
const Ind = ({ children }) => <tspan fontSize="12.5" dy="3">{children}</tspan>;
export function FicheChaine() {
  return (
    <div>
      <svg viewBox="0 0 400 200" style={svgStyle} role="img" aria-label="Chaîne de calcul : du volume équivalent on passe à la quantité de thiosulfate en multipliant par c B, puis à la quantité de diiode en divisant par 2, puis à la concentration en divisant par V A, puis à la masse dans 100 mL en multipliant par V et par M">
        <Boite x={10} y={30} w={100} t1="Vₑ mesuré" t2="(mL → L)"/>
        <Fleche x1={110} x2={150} y={52}/>
        <Etiq x={130} y={40}>× c<Ind>B</Ind></Etiq>
        <Boite x={150} y={30} w={100} t1="n(S₂O₃²⁻)" t2="versée"/>
        <Fleche x1={250} x2={290} y={52}/>
        <Etiq x={270} y={40}>÷ 2</Etiq>
        <Boite x={290} y={30} w={100} t1="n(I₂)" t2="titrée"/>
                <line x1="340" y1="74" x2="340" y2="108" stroke={ORANGE} strokeWidth="2.5"/><polygon points="340,116 334,104 346,104" fill={ORANGE}/>
        <text x="352" y="98" fontSize="17" fontWeight="700" fill={ORANGE}>÷ V<Ind>A</Ind></text>
        <Boite x={290} y={120} w={100} t1={<>c<Ind>A</Ind></>} t2="mol·L⁻¹"/>
        <Fleche x1={290} x2={150} y={142}/>
        <Etiq x={220} y={132}>× V × M</Etiq>
        <Boite x={10} y={120} w={140} t1="m dans 100 mL" t2="en grammes"/>
        <text x="200" y="192" textAnchor="middle" fontSize="16" fill={GRIS}>V en litres ; M(I₂) = 253,8 g·mol⁻¹</text>
      </svg>
      <Formule><msub><mi>c</mi><mi>A</mi></msub><mo>=</mo><mfrac><mrow><msub><mi>c</mi><mi>B</mi></msub><mo>×</mo><msub><mi>V</mi><mrow><mi>B</mi><mo>,</mo><mi>e</mi></mrow></msub></mrow><mrow><mn>2</mn><mo>×</mo><msub><mi>V</mi><mi>A</mi></msub></mrow></mfrac></Formule>
      <ul style={liste}>
        <li>Les volumes V<sub>B,e</sub> et V<sub>A</sub> sont dans la <strong>même unité</strong> : le rapport est sans unité.</li>
        <li><em>Chaque calcul = une flèche : on ne saute pas d’étape.</em></li>
      </ul>
    </div>
  );
}

// ── Carte : conformité à l'étiquette (exemples : 0,97 g conforme, 1,08 g non conforme) ──
export function FicheConforme() {
  const X = g => 20 + (g - 0.9) / 0.2 * 360;   // 0,90 → 20 ; 1,10 → 380
  return (
    <div>
      <svg viewBox="0 0 400 170" style={svgStyle} role="img" aria-label="Axe des masses de diiode pour 100 mL : la zone de tolérance de 0,95 à 1,05 g autour de l’étiquette 1,00 g ; un résultat de 0,97 g est conforme, un résultat de 1,08 g ne l’est pas">
        <rect x={X(0.95)} y="30" width={X(1.05) - X(0.95)} height="26" fill="rgba(22,163,74,0.2)" stroke={VERT} strokeWidth="2"/>
        <text x="200" y="21" textAnchor="middle" fontSize="17" fontWeight="700" fill={VERT}>tolérance ± 5 %</text>
        <line x1="20" y1="100" x2="380" y2="100" stroke={ENCRE} strokeWidth="2"/>
        {[0.9, 0.95, 1.0, 1.05, 1.1].map(g => <g key={g}><line x1={X(g)} y1="94" x2={X(g)} y2="106" stroke={ENCRE} strokeWidth="2"/>
          <text x={X(g)} y="124" textAnchor="middle" fontSize="16.5" fill={GRIS}>{String(g.toFixed(2)).replace('.', ',')}</text></g>)}
        <text x="380" y="148" textAnchor="end" fontSize="16.5" fill={GRIS}>g de diiode pour 100 mL</text>
        <polygon points={`${X(0.97)},96 ${X(0.97) - 7},82 ${X(0.97) + 7},82`} fill={VERT}/>
        <text x={X(0.97) - 6} y="75" textAnchor="end" fontSize="17" fontWeight="700" fill={VERT}>0,97 g</text>
        <polygon points={`${X(1.08)},96 ${X(1.08) - 7},82 ${X(1.08) + 7},82`} fill={ROUGE}/>
        <text x={X(1.08) + 2} y="75" textAnchor="middle" fontSize="17" fontWeight="700" fill={ROUGE}>1,08 g</text>
      </svg>
      <ul style={liste}>
        <li><strong>Titrage direct</strong> : réaction rapide, totale, unique ; burette = solution titrante, erlenmeyer = solution titrée.</li>
        <li><em>Conforme si l’écart avec l’étiquette reste dans la tolérance (ici 5 %).</em></li>
        <li>Un petit écart s’explique par les erreurs de mesure : goutte, pipette, concentration du thiosulfate.</li>
      </ul>
    </div>
  );
}
