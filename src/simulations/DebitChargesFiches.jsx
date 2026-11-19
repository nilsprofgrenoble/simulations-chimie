// Schémas dessinés dans un cadre de 300 de large (textes ≥ 12,5) : ≥ 9 px rendus sur téléphone, sans grossir sur ordinateur (maxWidth 320).
// Cartes « À retenir » de la simulation Courant électrique et débit de charges (sim 70) : un schéma dessiné et une idée mémorisable par carte.
import { Formule } from '../commun';

const GRIS = '#475569', BLEU = '#1d4ed8', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#dc2626', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// flèche pleine de (x1,y1) vers (x2,y2)
const Fl = ({ x1, y1, x2, y2, c = ORANGE, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 12;
  const p = `${x2},${y2} ${x2 - L * Math.cos(a - 0.45)},${y2 - L * Math.sin(a - 0.45)} ${x2 - L * Math.cos(a + 0.45)},${y2 - L * Math.sin(a + 0.45)}`;
  return <g><line x1={x1} y1={y1} x2={x2 - 9 * Math.cos(a)} y2={y2 - 9 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p} fill={c}/></g>;
};
const Ion = ({ x, y }) => <g><circle cx={x} cy={y} r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/><text x={x} y={y + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill={GRIS}>+</text></g>;
const Elec = ({ x, y }) => <circle cx={x} cy={y} r="4.8" fill={BLEU}/>;

// ── Carte 1 : un métal, porteurs de charge et sens du courant ──
export function FicheMetal() {
  const ions = [], elec = [];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 7 - (r % 2); k++) ions.push(<Ion key={`i${r}${k}`} x={30 + k * 40 + (r % 2) * 20} y={58 + r * 26}/>);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) elec.push(<Elec key={`e${r}${k}`} x={50 + k * 40 + (r % 2) * 20} y={70 + r * 26}/>);
  return (
    <div>
      <svg viewBox="0 0 300 198" style={svgStyle} role="img" aria-label="Fil de cuivre : des ions positifs fixes et des électrons libres ; le sens conventionnel du courant va vers la droite, les électrons se déplacent vers la gauche">
        <text x="150" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>sens conventionnel de I</text>
        <Fl x1={80} y1={26} x2={220} y2={26} c={ORANGE}/>
        <rect x="8" y="38" width="284" height="92" rx="14" fill="#f8fafc" stroke={GRIS} strokeWidth="2.5"/>
        {ions}{elec}
        <Fl x1={220} y1={146} x2={80} y2={146} c={BLEU}/>
        <text x="150" y="170" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={BLEU}>déplacement des électrons</text>
        <circle cx="16" cy="189" r="4.8" fill={BLEU}/><text x="26" y="193" fontSize="12.5" fill={ENCRE}>électron libre (−)</text>
        <circle cx="168" cy="189" r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/><text x="168" y="193.5" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={GRIS}>+</text><text x="182" y="193" fontSize="12.5" fill={ENCRE}>ion fixe</text>
      </svg>
      <ul style={liste}>
        <li>Courant = <strong>déplacement ordonné de charges</strong> portées par des <strong>porteurs de charge</strong> : dans un métal, les <strong>électrons libres</strong>.</li>
        <li><em>Le courant va de + vers −, les électrons font le contraire.</em></li>
        <li>Inverser le générateur inverse les deux sens à la fois.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : une solution, les ions sont les porteurs (ions mélangés, pas rangés) ──
export function FicheSolution() {
  const cat = [[78, 124], [132, 148], [176, 118], [226, 142], [108, 172]], an = [[104, 134], [158, 168], [206, 120], [236, 172], [66, 164], [150, 122]];
  return (
    <div>
      <svg viewBox="0 0 300 262" style={svgStyle} role="img" aria-label="Solution ionique entre deux électrodes : les cations positifs, mélangés aux anions, se déplacent vers l’électrode reliée à la borne moins, les anions négatifs vers l’électrode reliée à la borne plus">
        <rect x="95" y="6" width="110" height="32" rx="8" fill="#fff" stroke={ENCRE} strokeWidth="2.5"/>
        <text x="150" y="27" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>générateur</text>
        <text x="84" y="30" textAnchor="middle" fontSize="20" fontWeight="800" fill={BLEU}>−</text><text x="216" y="30" textAnchor="middle" fontSize="18" fontWeight="800" fill={ROUGE}>+</text>
        <polyline points="95,22 40,22 40,92" fill="none" stroke={ENCRE} strokeWidth="2.5"/><polyline points="205,22 260,22 260,92" fill="none" stroke={ENCRE} strokeWidth="2.5"/>
        <rect x="12" y="96" width="276" height="112" rx="5" fill="#e0f2fe" stroke={GRIS} strokeWidth="2.5"/>
        <rect x="34" y="88" width="10" height="112" rx="3" fill="#64748b"/><rect x="256" y="88" width="10" height="112" rx="3" fill="#64748b"/>
        {cat.map(([x, y], i) => <g key={'c' + i}><circle cx={x} cy={y} r="9" fill="#fff" stroke={ROUGE} strokeWidth="2.2"/><text x={x} y={y + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill={ROUGE}>+</text></g>)}
        {an.map(([x, y], i) => <g key={'a' + i}><circle cx={x} cy={y} r="9" fill="#fff" stroke={BLEU} strokeWidth="2.2"/><text x={x} y={y + 4.5} textAnchor="middle" fontSize="14" fontWeight="800" fill={BLEU}>−</text></g>)}
        <text x="39" y="224" textAnchor="middle" fontSize="12.5" fill={BLEU} fontWeight="700">borne −</text><text x="261" y="224" textAnchor="middle" fontSize="12.5" fill={ROUGE} fontWeight="700">borne +</text>
        <Fl x1={150} y1={240} x2={50} y2={240} c={ROUGE} w={2.5}/><text x="160" y="244" fontSize="12.5" fontWeight="700" fill={ROUGE}>cations (+)</text>
        <Fl x1={150} y1={258} x2={250} y2={258} c={BLEU} w={2.5}/><text x="140" y="262" textAnchor="end" fontSize="12.5" fontWeight="700" fill={BLEU}>anions (−)</text>
      </svg>
      <ul style={liste}>
        <li>Dans une solution, les porteurs de charge sont les <strong>ions</strong> (cations et anions mélangés) ; dans les fils du circuit, toujours des électrons.</li>
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
      <svg viewBox="0 0 300 226" style={svgStyle} role="img" aria-label="Une section de fil traversée par des charges : l’intensité est la charge qui passe par seconde ; triangle Q au sommet, I et delta t en bas : Q égale I fois delta t, I égale Q sur delta t, delta t égale Q sur I">
        <rect x="10" y="30" width="250" height="44" rx="12" fill="#f8fafc" stroke={GRIS} strokeWidth="2.5"/>
        {[[32, 44], [62, 62], [92, 46], [122, 63], [152, 45], [182, 62], [212, 46]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill={BLEU}/>)}
        <line x1="236" y1="20" x2="236" y2="86" stroke={ORANGE} strokeWidth="3" strokeDasharray="6 4"/>
        <text x="236" y="102" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>section</text>
        <text x="100" y="102" textAnchor="middle" fontSize="12.5" fill={GRIS}>charges qui avancent →</text>
        <text x="8" y="132" fontSize="13" fontWeight="700" fill={ENCRE}>1 A = 1 C par seconde</text>
        <polygon points="150,140 206,220 94,220" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.5" strokeLinejoin="round"/>
        <line x1="112" y1="190" x2="188" y2="190" stroke={ORANGE} strokeWidth="2"/><line x1="150" y1="190" x2="150" y2="218" stroke={ORANGE} strokeWidth="2"/>
        <text x="150" y="182" textAnchor="middle" fontSize="18" fontWeight="800" fill={ENCRE}>Q</text>
        <text x="130" y="212" textAnchor="middle" fontSize="16" fontWeight="800" fill={ENCRE}>I</text><text x="172" y="212" textAnchor="middle" fontSize="15" fontWeight="800" fill={ENCRE}>Δt</text>
        <text x="8" y="172" fontSize="12.5" fill={GRIS}>cache la grandeur</text><text x="8" y="188" fontSize="12.5" fill={GRIS}>cherchée</text>
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
  for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) pts.push(<circle key={`${r}${k}`} cx={142 + k * 22} cy={42 + r * 20} r="6" fill={BLEU}/>);
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Une charge Q se partage en très nombreux électrons, chacun de charge moins e égale à 1,602 fois 10 puissance moins 19 coulomb : N égale Q divisé par e ; une charge de 5 coulombs correspond à environ 3,1 fois 10 puissance 19 électrons">
        <rect x="6" y="26" width="94" height="58" rx="14" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.5"/>
        <text x="53" y="47" textAnchor="middle" fontSize="12.5" fill={GRIS}>charge totale</text><text x="53" y="71" textAnchor="middle" fontSize="16" fontWeight="800" fill={ORANGE}>Q = 5,0 C</text>
        <text x="112" y="62" textAnchor="middle" fontSize="22" fontWeight="800" fill={GRIS}>÷</text>
        <rect x="126" y="24" width="168" height="72" rx="12" fill="#eff6ff" stroke={BLEU} strokeWidth="2.2"/>
        {pts}
        <text x="210" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={BLEU}>chaque électron : −e</text>
        <text x="150" y="120" textAnchor="middle" fontSize="12.5" fill={ENCRE}>e = 1,602 × 10⁻¹⁹ C (charge élémentaire)</text>
        <rect x="16" y="132" width="268" height="36" rx="18" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="156" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={VERT}>N ≈ 3,1 × 10¹⁹ électrons</text>
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
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Une batterie de capacité en milliampères-heures est une charge : 1 mA·h vaut 3,6 coulombs ; l’autonomie est la capacité divisée par le courant consommé ; 1500 mA·h avec 300 mA donnent 5 heures">
        <rect x="6" y="18" width="92" height="56" rx="10" fill="#f0fdf4" stroke={VERT} strokeWidth="3"/><rect x="98" y="34" width="9" height="24" rx="3" fill={VERT}/>
        <rect x="13" y="25" width="70" height="42" rx="5" fill="#bbf7d0"/>
        <text x="48" y="43" textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}>1500</text><text x="48" y="60" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>mA·h</text>
        <Fl x1={116} y1={52} x2={168} y2={52} c={ORANGE}/>
        <text x="142" y="40" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>× 3,6</text>
        <rect x="178" y="18" width="116" height="56" rx="10" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.5"/>
        <text x="236" y="39" textAnchor="middle" fontSize="12.5" fill={GRIS}>en coulombs</text><text x="236" y="62" textAnchor="middle" fontSize="16" fontWeight="800" fill={ORANGE}>5400 C</text>
        <text x="150" y="102" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>1 mA·h = 1 mA × 1 h = 3,6 C</text>
        <rect x="6" y="116" width="288" height="62" rx="14" fill="#eff6ff" stroke={BLEU} strokeWidth="2.5"/>
        <text x="150" y="140" textAnchor="middle" fontSize="12.5" fill={GRIS}>autonomie : capacité ÷ courant</text>
        <text x="150" y="162" textAnchor="middle" fontSize="15" fontWeight="800" fill={BLEU}>1500 mA·h ÷ 300 mA = 5 h</text>
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
  for (let k = 0; k < 12; k++) dots.push(<circle key={k} cx={44 + k * 20} cy={64} r="5" fill={BLEU}/>);
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Un long fil relie un interrupteur à une lampe ; les électrons libres sont déjà présents dans tout le fil ; la perturbation se propage à environ 2 fois 10 puissance 8 mètres par seconde alors que chaque électron avance d’environ 0,05 millimètre par seconde">
        <text x="150" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>le signal : ≈ 2 × 10⁸ m/s</text>
        <Fl x1={50} y1={26} x2={250} y2={26} c={ORANGE}/>
        <rect x="28" y="42" width="244" height="44" rx="22" fill="#f8fafc" stroke={GRIS} strokeWidth="2.5"/>
        {dots}
        <rect x="2" y="50" width="26" height="28" rx="6" fill="#fff" stroke={GRIS} strokeWidth="2.5"/><text x="15" y="69" textAnchor="middle" fontSize="14" fontWeight="800" fill={GRIS}>G</text>
        <circle cx="282" cy="64" r="14" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2.5"/><path d="M276,58 L288,70 M288,58 L276,70" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round"/>
        <Fl x1={52} y1={106} x2={22} y2={106} c={BLEU} w={3}/>
        <text x="62" y="110" fontSize="12.5" fontWeight="700" fill={BLEU}>chaque électron : ≈ 0,05 mm/s</text>
        <rect x="8" y="126" width="284" height="68" rx="14" fill="#fef2f2" stroke={ROUGE} strokeWidth="2"/>
        <text x="150" y="147" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ROUGE}>Idée fausse :</text>
        <text x="150" y="165" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ROUGE}>« les électrons vont à la</text><text x="150" y="182" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ROUGE}>vitesse de la lumière »</text>
      </svg>
      <Formule><mi>v</mi><mo>=</mo><mfrac><mi>I</mi><mrow><mi>n</mi><mo>×</mo><mi>S</mi><mo>×</mo><mi>e</mi></mrow></mfrac><mspace width="1.2em"/><mi>n</mi><mo>=</mo><mn>8,5</mn><mo>×</mo><msup><mn>10</mn><mn>28</mn></msup><msup><mtext> m</mtext><mrow><mo>−</mo><mn>3</mn></mrow></msup></Formule>
      <ul style={liste}>
        <li>Les électrons libres sont <strong>déjà présents dans tout le fil</strong> : tous se mettent en mouvement presque en même temps. <em>Comme un tuyau déjà plein d’eau.</em></li>
        <li>Exemple : cuivre, S = 1,5 mm², I = 1 A : v ≈ 0,05 mm/s.</li>
        <li><strong>Hypothèses</strong> : modèle du gaz d’électrons libres (Drude), un électron libre par atome de cuivre, régime permanent.</li>
      </ul>
    </div>
  );
}
