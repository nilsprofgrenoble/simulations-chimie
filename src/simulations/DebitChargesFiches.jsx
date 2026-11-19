// Cartes « À retenir » de la simulation Courant électrique et débit de charges (sim 70) : un schéma dessiné et une idée mémorisable par carte.
import { Formule } from '../commun';

const GRIS = '#475569', BLEU = '#1d4ed8', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#dc2626', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// flèche pleine de (x1,y1) vers (x2,y2)
const Fl = ({ x1, y1, x2, y2, c = ORANGE, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 12;
  const p = `${x2},${y2} ${x2 - L * Math.cos(a - 0.45)},${y2 - L * Math.sin(a - 0.45)} ${x2 - L * Math.cos(a + 0.45)},${y2 - L * Math.sin(a + 0.45)}`;
  return <g><line x1={x1} y1={y1} x2={x2 - 9 * Math.cos(a)} y2={y2 - 9 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p} fill={c}/></g>;
};
const Ion = ({ x, y }) => <g><circle cx={x} cy={y} r="9" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/><text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={GRIS}>+</text></g>;
const Elec = ({ x, y }) => <circle cx={x} cy={y} r="5.5" fill={BLEU}/>;

// ── Carte 1 : un métal, porteurs de charge et sens du courant ──
export function FicheMetal() {
  const ions = [], elec = [];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) ions.push(<Ion key={`i${r}${k}`} x={52 + k * 37 + (r % 2) * 18} y={78 + r * 32}/>);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) elec.push(<Elec key={`e${r}${k}`} x={70 + k * 37 + (r % 2) * 18} y={94 + r * 32}/>);
  return (
    <div>
      <svg viewBox="0 0 400 244" style={svgStyle} role="img" aria-label="Fil de cuivre : des ions positifs fixes et des électrons libres ; le sens conventionnel du courant va vers la droite, les électrons se déplacent vers la gauche">
        <text x="200" y="22" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>sens conventionnel de I</text>
        <Fl x1={110} y1={36} x2={290} y2={36} c={ORANGE}/>
        <rect x="22" y="52" width="356" height="116" rx="16" fill="#f8fafc" stroke={GRIS} strokeWidth="3"/>
        {ions}{elec}
        <Fl x1={290} y1={190} x2={110} y2={190} c={BLEU}/>
        <text x="200" y="216" textAnchor="middle" fontSize="14" fontWeight="700" fill={BLEU}>déplacement des électrons</text>
        <circle cx="42" cy="236" r="5.5" fill={BLEU}/><text x="54" y="241" fontSize="13" fill={ENCRE}>électron libre (−)</text>
        <circle cx="228" cy="236" r="9" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/><text x="228" y="241" textAnchor="middle" fontSize="13" fontWeight="800" fill={GRIS}>+</text><text x="244" y="241" fontSize="13" fill={ENCRE}>ion fixe</text>
      </svg>
      <ul style={liste}>
        <li>Courant = <strong>déplacement ordonné de charges</strong> portées par des <strong>porteurs de charge</strong> : dans un métal, les <strong>électrons libres</strong>.</li>
        <li><em>Le courant va de + vers −, les électrons font le contraire.</em></li>
        <li>Inverser le générateur inverse les deux sens à la fois.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : une solution, les ions sont les porteurs ──
export function FicheSolution() {
  const cat = [[150, 168], [190, 168], [230, 168], [270, 168]], an = [[150, 200], [190, 200], [230, 200], [270, 200]];
  return (
    <div>
      <svg viewBox="0 0 400 296" style={svgStyle} role="img" aria-label="Solution ionique entre deux électrodes : les cations positifs se déplacent vers l’électrode reliée à la borne moins, les anions négatifs vers l’électrode reliée à la borne plus">
        <rect x="120" y="14" width="160" height="40" rx="8" fill="#fff" stroke={ENCRE} strokeWidth="3"/>
        <text x="200" y="40" textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}>générateur</text>
        <text x="138" y="42" textAnchor="middle" fontSize="24" fontWeight="800" fill={BLEU}>−</text><text x="262" y="42" textAnchor="middle" fontSize="22" fontWeight="800" fill={ROUGE}>+</text>
        <polyline points="120,34 70,34 70,112" fill="none" stroke={ENCRE} strokeWidth="3"/><polyline points="280,34 330,34 330,112" fill="none" stroke={ENCRE} strokeWidth="3"/>
        <rect x="30" y="112" width="340" height="142" rx="6" fill="#e0f2fe" stroke={GRIS} strokeWidth="3"/>
        <rect x="64" y="104" width="12" height="136" rx="3" fill="#64748b"/><rect x="324" y="104" width="12" height="136" rx="3" fill="#64748b"/>
        <text x="200" y="134" textAnchor="middle" fontSize="13" fontWeight="700" fill={ROUGE}>cations (+)</text>
        <Fl x1={250} y1={146} x2={100} y2={146} c={ROUGE}/>
        {cat.map(([x, y], i) => <g key={'c' + i}><circle cx={x} cy={y} r="10" fill="#fff" stroke={ROUGE} strokeWidth="2.5"/><text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={ROUGE}>+</text></g>)}
        {an.map(([x, y], i) => <g key={'a' + i}><circle cx={x} cy={y} r="10" fill="#fff" stroke={BLEU} strokeWidth="2.5"/><text x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={BLEU}>−</text></g>)}
        <Fl x1={140} y1={224} x2={290} y2={224} c={BLEU}/>
        <text x="215" y="246" textAnchor="middle" fontSize="13" fontWeight="700" fill={BLEU}>anions (−)</text>
        <text x="70" y="278" textAnchor="middle" fontSize="13" fill={BLEU} fontWeight="700">électrode −</text><text x="330" y="278" textAnchor="middle" fontSize="13" fill={ROUGE} fontWeight="700">électrode +</text>
      </svg>
      <ul style={liste}>
        <li>Dans une solution, les porteurs de charge sont les <strong>ions</strong> ; dans les fils du circuit, toujours des électrons.</li>
        <li><em>Les contraires s’attirent : cation (+) vers la borne −, anion (−) vers la borne +.</em></li>
        <li>Sans générateur : mouvement désordonné, donc pas de courant.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : intensité = débit de charges, triangle Q / I × Δt ──
export function FicheDebit() {
  return (
    <div>
      <svg viewBox="0 0 400 230" style={svgStyle} role="img" aria-label="Une section de fil traversée par des charges : l’intensité est la charge qui passe par seconde ; triangle Q au sommet, I et delta t en bas : Q égale I fois delta t, I égale Q sur delta t, delta t égale Q sur I">
        <rect x="8" y="38" width="190" height="62" rx="12" fill="#f8fafc" stroke={GRIS} strokeWidth="3"/>
        {[[30, 58], [56, 82], [82, 60], [108, 84], [136, 62], [162, 82]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6.5" fill={BLEU}/>)}
        <line x1="198" y1="26" x2="198" y2="112" stroke={ORANGE} strokeWidth="3" strokeDasharray="7 5"/>
        <Fl x1={150} y1={22} x2={250} y2={22} c={ORANGE} w={2.5}/>
        <text x="86" y="128" textAnchor="middle" fontSize="14" fill={GRIS}>charges</text>
        <text x="198" y="136" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>section</text>
        <text x="8" y="164" fontSize="14" fontWeight="700" fill={ENCRE}>1 A = 1 C par seconde</text>
        <text x="8" y="186" fontSize="13" fill={GRIS}>I : charge Q qui traverse</text><text x="8" y="204" fontSize="13" fill={GRIS}>une section pendant Δt</text>
        <polygon points="320,18 394,210 246,210" fill="#fff7ed" stroke={ORANGE} strokeWidth="3" strokeLinejoin="round"/>
        <line x1="270" y1="146" x2="370" y2="146" stroke={ORANGE} strokeWidth="2.5"/><line x1="320" y1="146" x2="320" y2="206" stroke={ORANGE} strokeWidth="2.5"/>
        <text x="320" y="124" textAnchor="middle" fontSize="22" fontWeight="800" fill={ENCRE}>Q</text>
        <text x="288" y="184" textAnchor="middle" fontSize="22" fontWeight="800" fill={ENCRE}>I</text><text x="352" y="184" textAnchor="middle" fontSize="20" fontWeight="800" fill={ENCRE}>Δt</text>
        <text x="320" y="228" textAnchor="middle" fontSize="13" fill={GRIS}>cache ce que tu cherches</text>
      </svg>
      <Formule><mi>I</mi><mo>=</mo><mfrac><mi>Q</mi><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac><mspace width="1.2em"/><mi>Q</mi><mo>=</mo><mi>I</mi><mo>×</mo><mi>Δ</mi><mi>t</mi></Formule>
      <ul style={liste}>
        <li>I en <strong>A</strong>, Q en <strong>C</strong>, Δt en <strong>s</strong> : convertir la durée en secondes avant de calculer.</li>
        <li>Exemple : I = 0,50 A pendant 10 s → Q = 0,50 × 10 = <strong>5,0 C</strong>.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : combien d'électrons ? N = Q / e ──
export function FicheElectrons() {
  const pts = [];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) pts.push(<circle key={`${r}${k}`} cx={218 + k * 20} cy={64 + r * 22} r="6.5" fill={BLEU}/>);
  return (
    <div>
      <svg viewBox="0 0 400 214" style={svgStyle} role="img" aria-label="Une charge Q se partage en très nombreux électrons, chacun de charge moins e égale à 1,602 fois 10 puissance moins 19 coulomb : N égale Q divisé par e ; une charge de 5 coulombs correspond à environ 3,1 fois 10 puissance 19 électrons">
        <rect x="14" y="40" width="130" height="68" rx="16" fill="#fff7ed" stroke={ORANGE} strokeWidth="3"/>
        <text x="79" y="66" textAnchor="middle" fontSize="14" fill={GRIS}>charge totale</text><text x="79" y="92" textAnchor="middle" fontSize="22" fontWeight="800" fill={ORANGE}>Q = 5,0 C</text>
        <text x="180" y="82" textAnchor="middle" fontSize="26" fontWeight="800" fill={GRIS}>÷</text>
        <rect x="204" y="42" width="184" height="86" rx="14" fill="#eff6ff" stroke={BLEU} strokeWidth="2.5"/>
        {pts}
        <text x="296" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill={BLEU}>chaque électron : −e</text>
        <text x="200" y="154" textAnchor="middle" fontSize="14" fill={ENCRE}>e = 1,602 × 10⁻¹⁹ C (charge élémentaire)</text>
        <rect x="46" y="166" width="308" height="40" rx="20" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="200" y="192" textAnchor="middle" fontSize="16" fontWeight="800" fill={VERT}>N ≈ 3,1 × 10¹⁹ électrons</text>
      </svg>
      <Formule><mi>N</mi><mo>=</mo><mfrac><mi>Q</mi><mi>e</mi></mfrac></Formule>
      <ul style={liste}>
        <li><em>Grosse charge ÷ minuscule charge élémentaire = nombre colossal.</em></li>
        <li>Repère : 1 C ≈ 6,2 × 10¹⁸ électrons. Résultat à donner avec autant de chiffres significatifs que Q.</li>
        <li><strong>Piège</strong> : on divise Q par e, jamais l’inverse.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : batterie, mA·h et autonomie ──
export function FicheBatterie() {
  return (
    <div>
      <svg viewBox="0 0 400 214" style={svgStyle} role="img" aria-label="Une batterie de capacité en milliampères-heures est une charge : 1 mA·h vaut 3,6 coulombs ; l’autonomie est la capacité divisée par le courant consommé ; 1500 mA·h avec 300 mA donnent 5 heures">
        <rect x="14" y="26" width="132" height="76" rx="12" fill="#f0fdf4" stroke={VERT} strokeWidth="3.5"/><rect x="146" y="50" width="12" height="28" rx="4" fill={VERT}/>
        <rect x="24" y="36" width="96" height="56" rx="6" fill="#bbf7d0"/>
        <text x="80" y="62" textAnchor="middle" fontSize="15" fontWeight="800" fill={ENCRE}>1500</text><text x="80" y="82" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>mA·h</text>
        <Fl x1={172} y1={64} x2={238} y2={64} c={ORANGE}/>
        <text x="205" y="50" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>× 3,6</text>
        <rect x="248" y="30" width="138" height="68" rx="12" fill="#fff7ed" stroke={ORANGE} strokeWidth="3"/>
        <text x="317" y="58" textAnchor="middle" fontSize="13" fill={GRIS}>charge en coulombs</text><text x="317" y="84" textAnchor="middle" fontSize="18" fontWeight="800" fill={ORANGE}>5400 C</text>
        <text x="200" y="130" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>1 mA·h = 1 mA × 1 h = 3,6 C</text>
        <rect x="14" y="146" width="372" height="56" rx="14" fill="#eff6ff" stroke={BLEU} strokeWidth="2.5"/>
        <text x="200" y="170" textAnchor="middle" fontSize="14" fill={GRIS}>autonomie : capacité ÷ courant consommé</text>
        <text x="200" y="192" textAnchor="middle" fontSize="16" fontWeight="800" fill={BLEU}>1500 mA·h ÷ 300 mA = 5 h</text>
      </svg>
      <Formule><mi>Δ</mi><mi>t</mi><mo>=</mo><mfrac><mi>Q</mi><mi>I</mi></mfrac></Formule>
      <ul style={liste}>
        <li><em>mA·h ÷ mA = h</em> : mêmes préfixes « milli » en haut et en bas, le résultat sort en heures.</li>
        <li><strong>Hypothèse</strong> : courant moyen constant, batterie vidée entièrement (en pratique l’autonomie est un peu plus courte).</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : les électrons avancent lentement, le signal très vite ──
export function FicheVitesse() {
  const dots = [];
  for (let k = 0; k < 17; k++) dots.push(<circle key={k} cx={50 + k * 18} cy={96} r="5.5" fill={BLEU}/>);
  return (
    <div>
      <svg viewBox="0 0 400 226" style={svgStyle} role="img" aria-label="Un long fil relie un interrupteur à une lampe ; les électrons libres sont déjà présents dans tout le fil ; la perturbation se propage à environ 2 fois 10 puissance 8 mètres par seconde alors que chaque électron avance d’environ 0,05 millimètre par seconde">
        <text x="200" y="22" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>le signal : ≈ 2 × 10⁸ m/s</text>
        <Fl x1={70} y1={40} x2={330} y2={40} c={ORANGE}/>
        <rect x="22" y="70" width="356" height="52" rx="26" fill="#f8fafc" stroke={GRIS} strokeWidth="3"/>
        {dots}
        <rect x="4" y="82" width="34" height="28" rx="6" fill="#fff" stroke={GRIS} strokeWidth="3"/><text x="21" y="102" textAnchor="middle" fontSize="15" fontWeight="800" fill={GRIS}>G</text>
        <circle cx="378" cy="96" r="20" fill="#fef9c3" stroke="#ca8a04" strokeWidth="3"/><path d="M368,86 L388,106 M388,86 L368,106" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round"/>
        <Fl x1={150} y1={146} x2={110} y2={146} c={BLEU} w={3.5}/>
        <text x="164" y="151" fontSize="14" fontWeight="700" fill={BLEU}>chaque électron : ≈ 0,05 mm/s</text>
        <rect x="26" y="166" width="348" height="52" rx="16" fill="#fef2f2" stroke={ROUGE} strokeWidth="2"/>
        <text x="200" y="187" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>Idée fausse :</text><text x="200" y="207" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>« les électrons vont à la vitesse de la lumière »</text>
      </svg>
      <Formule><mi>v</mi><mo>=</mo><mfrac><mi>I</mi><mrow><mi>n</mi><mo>×</mo><mi>S</mi><mo>×</mo><mi>e</mi></mrow></mfrac><mspace width="1.2em"/><mi>n</mi><mo>=</mo><mn>8,5</mn><mo>×</mo><msup><mn>10</mn><mn>28</mn></msup><msup><mtext> m</mtext><mrow><mo>−</mo><mn>3</mn></mrow></msup></Formule>
      <ul style={liste}>
        <li>Les électrons libres sont <strong>déjà présents dans tout le fil</strong> : tous se mettent en mouvement presque en même temps. <em>Comme un tuyau déjà plein d’eau.</em></li>
        <li>Exemple : cuivre, S = 1,5 mm², I = 1 A : v ≈ 0,05 mm/s.</li>
        <li><strong>Hypothèses</strong> : modèle de Drude, un électron libre par atome de cuivre, régime permanent.</li>
      </ul>
    </div>
  );
}
