// Cartes « À retenir » de la simulation « Mesure : incertitude-type et résultat » (sim 194, 2GT).
// Chaque carte est posée sur l'ÉTAPE SUIVANT la question qu'elle conclut, et ses exemples chiffrés sont différents de ceux demandés.
// Schémas dessinés dans un cadre de 300 de large : sur téléphone ils s'affichent à ~230 px, donc textes de 13 à 16 (≥ 10 px rendus).
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', CLAIR = '#fde68a';
const NB = ' ';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const Pt = ({ x, y, c = BLEU }) => <circle cx={x} cy={y} r="5.5" fill={c} stroke="white" strokeWidth="1"/>;

// ── Carte 1 : la zone des valeurs raisonnables ──
export function FicheIntervalle() {
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Un axe gradué avec une zone orange centrée sur la moyenne, 20,0 secondes. La zone va de 19,5 à 20,5 secondes : la moyenne moins u, la moyenne plus u, avec u égal à 0,5 seconde.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>La zone des valeurs raisonnables</text>
        <rect x="90" y="40" width="120" height="62" fill={CLAIR} stroke={ORANGE} strokeWidth="2"/>
        <line x1="150" y1="34" x2="150" y2="110" stroke={ENCRE} strokeWidth="3"/>
        <Pt x={128} y={88}/><Pt x={142} y={88}/><Pt x={156} y={88}/><Pt x={170} y={88}/><Pt x={142} y={76}/><Pt x={156} y={76}/>
        <path d="M92,56 H148 M100,50 L92,56 L100,62 M140,50 L148,56 L140,62" stroke={ORANGE} strokeWidth="2.2" fill="none"/>
        <text x="120" y="48" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>u</text>
        <path d="M152,56 H208 M200,50 L208,56 L200,62" stroke={ORANGE} strokeWidth="2.2" fill="none"/><text x="180" y="48" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>u</text>
        <line x1="20" y1="110" x2="280" y2="110" stroke={ENCRE} strokeWidth="2.5"/>
        {[[90, '19,5', 'm − u'], [150, '20,0', 'm'], [210, '20,5', 'm + u']].map(([x, v, t]) => (<g key={x}><line x1={x} y1="110" x2={x} y2="118" stroke={ENCRE} strokeWidth="2"/><text x={x} y="134" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>{v}</text><text x={x} y="152" textAnchor="middle" fontSize="14" fill={ORANGE}>{t}</text></g>))}
        <text x="150" y="176" textAnchor="middle" fontSize="13.5" fill={GRIS}>durée en secondes, u = 0,5{NB}s</text>
      </svg>
      <ul style={liste}>
        <li><strong>L’incertitude-type u est le « doute » autour de la moyenne m : les valeurs raisonnables vont de m − u à m + u.</strong></li>
        <li>Exemple : (20,0 ± 0,5){NB}s, de 19,5{NB}s à 20,5{NB}s.</li>
        <li><strong>Idée fausse</strong> : « la vraie valeur est forcément dans la zone ». <strong>Vrai</strong> : elle peut y être ou non, pas à coup sûr (c’est ce que veut dire « raisonnablement »).</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : u = s ÷ √n ──
export function FicheCalcul() {
  const bloc = (x, t, v, c) => (<g><rect x={x} y="32" width="88" height="62" rx="9" fill={c === ORANGE ? '#fffbeb' : '#eff6ff'} stroke={c} strokeWidth="2"/><text x={x + 44} y="52" textAnchor="middle" fontSize="13" fontWeight="700" fill={c}>{t}</text><text x={x + 44} y="82" textAnchor="middle" fontSize="16" fontWeight="700" fill={ENCRE}>{v}</text></g>);
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Exemple : s égal 0,10 centimètre et n égal 25 mesures donnent u égal 0,02 centimètre. On divise s par la racine carrée de n.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>De s à u</text>
        {bloc(6, 'dispersion', `s = 0,10`, BLEU)}{bloc(106, '÷ √n, n = 25', '÷ 5', GRIS)}{bloc(206, 'doute u', `u = 0,02`, ORANGE)}
        <text x="100" y="68" textAnchor="middle" fontSize="18" fontWeight="700" fill={GRIS}>→</text><text x="200" y="68" textAnchor="middle" fontSize="18" fontWeight="700" fill={GRIS}>→</text>
        <text x="150" y="124" textAnchor="middle" fontSize="14" fill={GRIS}>(valeurs en centimètres)</text>
      </svg>
      <Formule><mi>u</mi><mo>=</mo><mfrac><mi>s</mi><msqrt><mi>n</mi></msqrt></mfrac></Formule>
      <ul style={liste}>
        <li><strong>s</strong> : écart-type de la série (touche « σₙ₋₁ » ou « s » de la calculatrice). <strong>n</strong> : nombre de mesures.</li>
        <li>Exemple : 25 mesures, √25 = 5, donc u = 0,10 ÷ 5 = 0,02{NB}cm.</li>
        <li><strong>Idée fausse</strong> : « u = s ». <strong>Vrai</strong> : s est l’éparpillement d’<em>une</em> mesure ; u est le doute sur la <em>moyenne</em>, plus petit.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : faire baisser u ──
export function FicheBaisser() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="À gauche : avec 25 mesures u vaut 0,04, avec 100 mesures, quatre fois plus, u vaut 0,02. À droite : un instrument dont les mesures sont éparpillées et un instrument dont les mesures sont resserrées, avec une plus petite incertitude.">
        <text x="150" y="18" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Deux façons de réduire u</text>
        <line x1="150" y1="28" x2="150" y2="178" stroke="#cbd5e1" strokeDasharray="4 4"/>
        <rect x="18" y="70" width="46" height="80" fill={ORANGE} opacity="0.85"/><rect x="84" y="110" width="46" height="40" fill={VERT} opacity="0.85"/>
        <line x1="10" y1="150" x2="140" y2="150" stroke={ENCRE} strokeWidth="2"/>
        <text x="41" y="64" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>0,04</text><text x="107" y="104" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>0,02</text>
        <text x="41" y="170" textAnchor="middle" fontSize="13" fill={ENCRE}>n = 25</text><text x="107" y="170" textAnchor="middle" fontSize="13" fill={ENCRE}>n = 100</text>
        <text x="74" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>4 × plus de mesures</text>
        {[170, 186, 200, 214, 230, 244, 258, 273].map((x, i) => <Pt key={x} x={x} y={62 + (i % 2) * 11} c={BLEU}/>)}
        <text x="222" y="92" textAnchor="middle" fontSize="13.5" fill={ENCRE}>éparpillé : u grande</text>
        {[208, 216, 222, 228, 236].map((x, i) => <Pt key={x} x={x} y={118 + (i % 2) * 11} c={VERT}/>)}
        <text x="222" y="148" textAnchor="middle" fontSize="13.5" fill={ENCRE}>resserré : u petite</text>
        <text x="222" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>meilleur instrument</text>
        <text x="150" y="198" textAnchor="middle" fontSize="13.5" fill={GRIS}>(valeurs de u en unités arbitraires)</text>
      </svg>
      <ul style={liste}>
        <li><strong>4 fois plus de mesures pour diviser u par 2 ; 100 fois plus pour diviser u par 10.</strong> Ça baisse, mais lentement.</li>
        <li><strong>Un meilleur instrument</strong> (ou un meilleur protocole) resserre les mesures : s et u baissent.</li>
        <li><strong>Idée fausse</strong> : « deux fois plus de mesures, u deux fois plus petite ». <strong>Vrai</strong> : il en faut quatre fois plus.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : écrire le résultat ──
export function FicheEcriture() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Le résultat t égal parenthèse 3,27 plus ou moins 0,03 fermée parenthèse seconde. La valeur 3,27 et l'incertitude 0,03 s'arrêtent à la même décimale, le centième. L'unité est écrite à la fin.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Écrire le résultat</text>
        <rect x="14" y="34" width="272" height="54" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>
        <text x="150" y="70" textAnchor="middle" fontSize="23" fontWeight="700" fill={ENCRE} style={{ fontFamily: 'monospace' }}>t = (3,27 ± 0,03) s</text>
        <path d="M78,94 V114 M78,114 H134 M134,94 V114" stroke={BLEU} strokeWidth="2.2" fill="none"/>
        <text x="106" y="132" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={BLEU}>valeur</text>
        <path d="M164,94 V114 M164,114 H196 M196,94 V114" stroke={ORANGE} strokeWidth="2.2" fill="none"/>
        <text x="180" y="132" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ORANGE}>u</text>
        <path d="M242,94 V114" stroke={VERT} strokeWidth="2.2" fill="none"/><text x="242" y="132" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={VERT}>unité</text>
        <text x="150" y="160" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>même dernière décimale</text>
        <text x="150" y="180" textAnchor="middle" fontSize="13.5" fill={GRIS}>3,2718 s et u = 0,0239 s → u = 0,03 s</text>
      </svg>
      <ul style={liste}>
        <li><strong>1.</strong> u sur <strong>1 chiffre significatif</strong>, arrondie vers le haut (2 chiffres si le premier est 1 : 0,0143 → 0,015). <strong>2.</strong> La valeur s’arrête à la <strong>même décimale</strong> que u. <strong>3.</strong> Unité à la fin.</li>
        <li><strong>Phrase-clé</strong> : le résultat n’est pas plus précis que son doute.</li>
        <li><strong>Idée fausse</strong> : « plus de chiffres = plus précis ». <strong>Vrai</strong> : des chiffres en trop n’ont aucun sens.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : comparer à une référence ──
export function FicheCompatible() {
  const ligne = (y, bx, ref, ok) => (<g>
    <rect x="30" y={y} width="240" height="36" rx="6" fill="#f8fafc"/>
    <rect x={bx} y={y + 4} width="50" height="28" fill={CLAIR} stroke={ORANGE} strokeWidth="2"/>
    <line x1={bx + 25} y1={y + 2} x2={bx + 25} y2={y + 34} stroke={ENCRE} strokeWidth="2.5"/>
    <line x1={ref} y1={y - 4} x2={ref} y2={y + 40} stroke={VERT} strokeWidth="3" strokeDasharray="5 4"/>
    <text x="278" y={y + 25} fontSize="20" fontWeight="700" fill={ok ? VERT : ROUGE}>{ok ? '✓' : '✗'}</text>
  </g>);
  return (
    <div>
      <svg viewBox="0 0 300 184" style={svgStyle} role="img" aria-label="Deux axes. En haut, la valeur de référence en vert est dans la zone orange du résultat : compatible. En bas, la référence est loin de la zone : pas compatible.">
        <text x="150" y="18" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>La référence est-elle dans la zone ?</text>
        {ligne(34, 100, 132, true)}
        <text x="150" y="86" textAnchor="middle" fontSize="14" fontWeight="700" fill={VERT}>dans la zone : compatible</text>
        {ligne(108, 70, 218, false)}
        <text x="150" y="160" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>loin de la zone : pas compatible</text>
        <text x="150" y="178" textAnchor="middle" fontSize="13.5" fill={GRIS}>trait vert : valeur de référence</text>
      </svg>
      <ul style={liste}>
        <li><strong>Référence entre m − u et m + u : compatible. Référence nettement en dehors : pas compatible.</strong></li>
        <li>Exemple : (12,5 ± 0,2){NB}s et une référence de 12,6{NB}s : la zone va de 12,3 à 12,7{NB}s, donc compatible ; avec 13,5{NB}s, pas compatible.</li>
        <li><strong>Idée fausse</strong> : « deux nombres différents, donc pas compatibles ». <strong>Vrai</strong> : une mesure a toujours un doute ; compatible ne veut pas dire identique.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : ce que u ne voit pas ──
export function FicheSysteme() {
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Un axe : la valeur de référence en vert est à gauche. Les mesures, très groupées, sont toutes décalées vers la droite, et leur petite zone orange est loin de la référence. Le décalage est le même pour toutes les mesures.">
        <text x="150" y="18" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Groupées, mais décalées</text>
        <rect x="20" y="30" width="260" height="76" rx="6" fill="#f8fafc"/>
        <line x1="70" y1="26" x2="70" y2="112" stroke={VERT} strokeWidth="3" strokeDasharray="6 5"/><text x="70" y="128" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={VERT}>référence</text>
        <rect x="198" y="40" width="36" height="58" fill={CLAIR} stroke={ORANGE} strokeWidth="2"/>
        {[207, 216, 225].map((x, i) => [0, 1, 2, 3].map(j => (i * 2 + j) % 5 !== 4 && <circle key={`${x}-${j}`} cx={x} cy={88 - j * 12} r="4.2" fill={BLEU} stroke="white" strokeWidth="1"/>))}
        <path d="M76,66 H190 M180,58 L190,66 L180,74" stroke={ROUGE} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="135" y="55" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>décalage</text>
        <text x="216" y="128" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ORANGE}>u petite</text>
        <text x="150" y="156" textAnchor="middle" fontSize="13.5" fill={ENCRE}>zone orange loin de la référence</text>
        <text x="150" y="176" textAnchor="middle" fontSize="13.5" fill={GRIS}>exemple : balance dont le zéro est décalé</text>
      </svg>
      <ul style={liste}>
        <li><strong>u mesure l’éparpillement des mesures, pas leur décalage.</strong> Un instrument décalé donne des mesures groupées… et fausses.</li>
        <li>Faire plus de mesures avec le même instrument <strong>ne corrige pas</strong> un décalage : il faut vérifier l’instrument (zéro, réglage).</li>
        <li><strong>Idée fausse</strong> : « u petite = mesure juste ». <strong>Vrai</strong> : u petite = mesures groupées ; juste, c’est autre chose.</li>
      </ul>
    </div>
  );
}
