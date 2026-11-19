// Cartes « À retenir » de la simulation « Dissolution et concentration en masse » (sim 61, 2GT).
// Chaque carte est posée UNE ÉTAPE APRÈS la question qu'elle conclut, avec d'autres valeurs que celles de l'étape.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320 (pas de grossissement sur ordinateur).
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', EAU = '#bfdbfe', VERT = '#15803d', ORANGE = '#c2410c', ROUGE = '#b91c1c', ENCRE = '#0f172a', SEL = '#334155';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };

// Fiole : x, y = coin haut-gauche ; larg w ; niveau de liquide en proportion (0..1) de la partie large
const Fiole = ({ x, y, w = 70, niveau = 0.7, couleur = EAU, grains = [], fond = [] }) => {
  const h = 100, col = w * 0.34, bas = y + h, hautL = y + 36;
  const yl = bas - (bas - hautL) * niveau;
  const gx = x + (w - col) / 2;                                  // bord gauche du col
  return (
    <g>
      <clipPath id={`cf${x}${y}`}><path d={`M${gx},${y} L${gx},${y + 28} L${x},${bas} L${x + w},${bas} L${gx + col},${y + 28} L${gx + col},${y} Z`}/></clipPath>
      <rect x={x} y={yl} width={w} height={bas - yl} fill={couleur} clipPath={`url(#cf${x}${y})`}/>
      {grains.map(([gxp, gyp], i) => <circle key={i} cx={x + gxp * w} cy={yl + gyp * (bas - yl)} r="2.6" fill={SEL}/>)}
      {fond.map(([gxp, gyp], i) => <rect key={'f' + i} x={x + gxp * w - 3} y={bas - 7 - gyp * 6} width="6" height="5" rx="1" fill={SEL}/>)}
      <path d={`M${gx},${y} L${gx},${y + 28} L${x},${bas} L${x + w},${bas} L${gx + col},${y + 28} L${gx + col},${y}`} fill="none" stroke={GRIS} strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1={gx - 3} y1={y + 10} x2={gx + col + 3} y2={y + 10} stroke={ENCRE} strokeWidth="1.5"/>
    </g>
  );
};
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => { const a = Math.atan2(y2 - y1, x2 - x1), d = 6; return <g><line x1={x1} y1={y1} x2={x2 - Math.cos(a) * d} y2={y2 - Math.sin(a) * d} stroke={c} strokeWidth="2.5"/><polygon points={`${x2},${y2} ${x2 - Math.cos(a) * 9 - Math.sin(a) * 5},${y2 - Math.sin(a) * 9 + Math.cos(a) * 5} ${x2 - Math.cos(a) * 9 + Math.sin(a) * 5},${y2 - Math.sin(a) * 9 - Math.cos(a) * 5}`} fill={c}/></g>; };

// ── Carte 1 : soluté, solvant, solution ──
export function FicheVocab() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Du sel (le soluté) mis dans de l’eau (le solvant) donne de l’eau salée (la solution) : le sel dissous est réparti dans tout le liquide">
        <Fiole x={6} y={14} w={62} niveau={0.7} couleur={EAU}/>
        <text x="37" y="138" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>solvant</text>
        <text x="37" y="154" textAnchor="middle" fontSize="12.5" fill={GRIS}>l’eau</text>
        <text x="88" y="66" textAnchor="middle" fontSize="20" fontWeight="800" fill={ENCRE}>+</text>
        <g>{[[0, 0], [8, 3], [16, 0], [4, 8], [12, 8]].map(([a, b], i) => <circle key={i} cx={104 + a} cy={72 + b} r="3.4" fill={SEL}/>)}</g>
        <text x="112" y="138" textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>soluté</text>
        <text x="112" y="154" textAnchor="middle" fontSize="12.5" fill={GRIS}>le sel</text>
        <text x="150" y="66" textAnchor="middle" fontSize="20" fontWeight="800" fill={ENCRE}>=</text>
        <Fiole x={176} y={14} w={62} niveau={0.7} couleur="#dbeafe" grains={[[0.2, 0.3], [0.5, 0.2], [0.75, 0.45], [0.35, 0.65], [0.62, 0.8], [0.25, 0.9], [0.8, 0.85]]}/>
        <text x="228" y="138" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>solution</text>
        <text x="228" y="154" textAnchor="middle" fontSize="12.5" fill={GRIS}>l’eau salée</text>
        <text x="228" y="170" textAnchor="middle" fontSize="12.5" fill={GRIS}>(aqueuse)</text>
      </svg>
      <ul style={liste}>
        <li><em>Soluté + solvant = solution.</em> Le solvant est le liquide qui dissout ; le soluté est ce qui est dissous (solide, liquide ou gaz).</li>
        <li>Dissoudre, c’est répartir le soluté dans tout le liquide : le mélange est <strong>homogène</strong>. Si le solvant est l’eau, la solution est <strong>aqueuse</strong>.</li>
        <li>Plus une solution colorée est <strong>concentrée</strong>, plus sa couleur est foncée.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : la concentration en masse ──
export function FicheConc() {
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Une fiole de 250 millilitres contenant 5 grammes de soluté : on convertit le volume en litres, 250 millilitres égalent 0,250 litre, puis la concentration en masse vaut la masse divisée par le volume, soit 20 grammes par litre">
        <Fiole x={10} y={12} w={74} niveau={0.7} couleur="#dbeafe" grains={[[0.2, 0.3], [0.5, 0.2], [0.75, 0.45], [0.35, 0.65], [0.62, 0.8], [0.25, 0.9], [0.8, 0.85]]}/>
        <text x="47" y="132" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>m = 5 g</text>
        <text x="47" y="148" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={BLEU}>V = 250 mL</text>
        <Fleche x1={96} y1={64} x2={128} y2={64}/>
        <rect x="132" y="30" width="162" height="68" rx="12" fill="#fff" stroke={BLEU} strokeWidth="2.5"/>
        <text x="213" y="50" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>1. convertir V en L</text>
        <text x="213" y="68" textAnchor="middle" fontSize="12.5" fill={ENCRE}>250 mL ÷ 1000</text>
        <text x="213" y="86" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>= 0,250 L</text>
        <rect x="132" y="110" width="162" height="68" rx="12" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.5"/>
        <text x="213" y="130" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>2. diviser m par V</text>
        <text x="213" y="148" textAnchor="middle" fontSize="12.5" fill={ENCRE}>5 g ÷ 0,250 L</text>
        <text x="213" y="166" textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>= 20 g/L</text>
      </svg>
      <Formule><mi>t</mi><mo>=</mo><mfrac><mi>m</mi><mi>V</mi></mfrac></Formule>
      <ul style={liste}>
        <li><em>t : la masse de soluté dissoute dans 1 litre de solution</em> (m en g, V en L, t en g/L).</li>
        <li><strong>Pièges</strong> : oublier de convertir les mL en L ; diviser V par m (à l’envers).</li>
        <li>Doubler la masse double t ; doubler le volume divise t par 2.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : le triangle m, t, V ──
export function FicheTriangle() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Triangle de la concentration : m en haut, t et V en bas ; on cache la grandeur cherchée. Exemple : 500 millilitres de solution à 8 grammes par litre demandent 8 fois 0,500, soit 4,0 grammes">
        <polygon points="60,8 112,100 8,100" fill="#dcfce7" stroke={VERT} strokeWidth="2.5" strokeLinejoin="round"/>
        <line x1="8" y1="100" x2="112" y2="100" stroke={VERT} strokeWidth="2.5"/>
        <line x1="60" y1="100" x2="60" y2="62" stroke={VERT} strokeWidth="2.5"/>
        <polygon points="60,8 112,100 8,100" fill="none" stroke={VERT} strokeWidth="2.5" strokeLinejoin="round"/>
        <line x1="34" y1="54" x2="86" y2="54" stroke={VERT} strokeWidth="2.5"/>
        <text x="60" y="44" textAnchor="middle" fontSize="18" fontWeight="800" fill={VERT}>m</text>
        <text x="34" y="82" textAnchor="middle" fontSize="18" fontWeight="800" fill={VERT}>t</text>
        <text x="86" y="82" textAnchor="middle" fontSize="18" fontWeight="800" fill={VERT}>V</text>
        <text x="130" y="30" fontSize="12.5" fontWeight="800" fill={ENCRE}>je cache la grandeur</text>
        <text x="130" y="47" fontSize="12.5" fontWeight="800" fill={ENCRE}>cherchée :</text>
        <text x="130" y="68" fontSize="12.5" fill={ENCRE}>cache m → t × V</text>
        <text x="130" y="86" fontSize="12.5" fill={ENCRE}>cache t → m ÷ V</text>
        <text x="130" y="104" fontSize="12.5" fill={ENCRE}>cache V → m ÷ t</text>
        <rect x="6" y="118" width="288" height="72" rx="12" fill="#fff" stroke={ORANGE} strokeWidth="2.5"/>
        <text x="16" y="138" fontSize="12.5" fontWeight="700" fill={ENCRE}>500 mL à 8 g/L : quelle masse ?</text>
        <text x="16" y="158" fontSize="12.5" fill={ENCRE}>V = 500 mL = 0,500 L</text>
        <text x="16" y="178" fontSize="13" fontWeight="800" fill={ORANGE}>m = 8 × 0,500 = 4,0 g</text>
      </svg>
      <Formule><mi>m</mi><mo>=</mo><mi>t</mi><mo>×</mo><mi>V</mi></Formule>
      <ul style={liste}>
        <li><em>On connaît t et V : on pèse m = t × V.</em> Version phrase : « 1 L contient 8 g, donc 0,500 L en contient la moitié ».</li>
        <li><strong>Piège</strong> : multiplier par 500 sans convertir donne 4 000 g, valeur absurde : toujours vérifier l’ordre de grandeur.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : le protocole de la fiole jaugée ──
const LIGNES = [['1', 'Peser', 'le soluté'], ['2', 'Introduire', 'dans la fiole'], ['3', 'Rincer', '+ eau à moitié'], ['4', 'Agiter', 'sans bouchon'], ['5', 'Ajuster', 'au trait'], ['6', 'Boucher,', 'retourner']];
export function FicheProtocole() {
  return (
    <div>
      <svg viewBox="0 0 300 226" style={svgStyle} role="img" aria-label="Les six étapes du protocole de la fiole jaugée dans l’ordre : peser, introduire, rincer et remplir à moitié, agiter, ajuster au trait de jauge, boucher et retourner ; le volume de la solution est alors exactement celui de la fiole">
        {LIGNES.map(([n, a, b], i) => (
          <g key={n}>
            <rect x="6" y={6 + i * 35} width="198" height="30" rx="15" fill="#fff" stroke={i === 4 ? ORANGE : BLEU} strokeWidth="2.5"/>
            <circle cx="22" cy={21 + i * 35} r="11" fill={i === 4 ? ORANGE : BLEU}/>
            <text x="22" y={26 + i * 35} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{n}</text>
            <text x="40" y={26 + i * 35} fontSize="12.5" fill={ENCRE}><tspan fontWeight="800">{a}</tspan> {b}</text>
          </g>
        ))}
        <Fiole x={222} y={50} w={64} niveau={0.7} couleur="#dbeafe"/>
        <line x1="216" y1="86" x2="292" y2="86" stroke={ORANGE} strokeWidth="2" strokeDasharray="4 3"/>
        <text x="254" y="42" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>trait de jauge</text>
        <text x="254" y="168" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>V = volume</text>
        <text x="254" y="185" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>de la fiole</text>
      </svg>
      <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
        <li><strong>Peser</strong> le soluté dans une capsule, puis l’<strong>introduire</strong> dans la fiole (entonnoir).</li>
        <li><strong>Rincer</strong> capsule et entonnoir à l’eau distillée, remplir la fiole <strong>à moitié</strong>, <strong>agiter</strong> sans bouchon.</li>
        <li><strong>Ajuster</strong> au trait (pissette puis pipette), œil en face, bas du ménisque sur le trait ; <strong>boucher et retourner</strong>.</li>
      </ol>
      <ul style={liste}>
        <li><em>Au trait de jauge, V est exactement celui de la fiole</em> : c’est le V de t = m / V.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : solubilité, saturation et bilan ──
export function FicheSolub() {
  return (
    <div>
      <svg viewBox="0 0 300 204" style={svgStyle} role="img" aria-label="Deux fioles de 250 millilitres de permanganate de potassium, solubilité 64 grammes par litre, donc au plus 16 grammes : avec 10 grammes tout se dissout, la solution n’est pas saturée ; avec 20 grammes, il reste 4 grammes de solide au fond, la solution est saturée">
        <text x="150" y="16" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>250 mL de KMnO₄ : m max = 64 × 0,250 = 16 g</text>
        <Fiole x={26} y={28} w={74} niveau={0.7} couleur="#e9d5ff" grains={[[0.2, 0.3], [0.5, 0.2], [0.75, 0.45], [0.35, 0.65], [0.62, 0.8]]}/>
        <text x="63" y="146" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={VERT}>10 g &lt; 16 g</text>
        <text x="63" y="162" textAnchor="middle" fontSize="12.5" fill={ENCRE}>tout se dissout</text>
        <text x="63" y="178" textAnchor="middle" fontSize="12.5" fill={ENCRE}>non saturée</text>
        <Fiole x={186} y={28} w={74} niveau={0.7} couleur="#d8b4fe" fond={[[0.25, 1], [0.45, 1.6], [0.65, 1], [0.8, 0.6], [0.35, 0.4]]}/>
        <text x="223" y="146" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ROUGE}>20 g &gt; 16 g</text>
        <text x="223" y="162" textAnchor="middle" fontSize="12.5" fill={ENCRE}>il reste 4 g au fond</text>
        <text x="223" y="178" textAnchor="middle" fontSize="12.5" fill={ENCRE}>solution saturée</text>
        <text x="150" y="198" textAnchor="middle" fontSize="12.5" fill={GRIS}>solubilité (20 °C) : KMnO₄ 64 g/L</text>
      </svg>
      <Formule><msub><mi>m</mi><mtext>max</mtext></msub><mo>=</mo><mtext>solubilité</mtext><mo>×</mo><mi>V</mi></Formule>
      <ul style={liste}>
        <li><em>La solubilité est la masse maximale dissoute dans 1 L</em> ; au-delà, le solide reste au fond : solution <strong>saturée</strong> (t = solubilité). À 20 °C : KMnO₄ 64 g/L ; CuSO₄ 200 g/L ; NaCl 360 g/L.</li>
        <li><strong>Bilan</strong> : identifier t, m ou V ; convertir les mL en L ; calculer t = m / V ou m = t × V ; vérifier l’unité (g/L) et l’ordre de grandeur.</li>
        <li><strong>Hypothèses</strong> : 20 °C ; V de la solution = V de la fiole ; masse pesée exacte.</li>
      </ul>
    </div>
  );
}
