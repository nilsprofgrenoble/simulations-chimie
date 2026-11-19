// Cartes « À retenir » de la simulation « Avancement d'une réaction » (sim 1) : un schéma dessiné et une idée mémorisable par carte.
// Les exemples chiffrés utilisent une AUTRE réaction (2 H₂ + O₂ → 2 H₂O) que celle de la manip (Mg + 2 H⁺), pour ne jamais donner la réponse de l'étape.
// Les schémas sont dessinés dans un cadre de 300 de large : sur téléphone, la carte les affiche à ~230 px, donc les textes de 12 à 16 restent ≥ 9 px rendus.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#1d4ed8', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#dc2626', ENCRE = '#0f172a', VIOLET = '#7c3aed';
const svgStyle = { width: '100%', maxWidth: 360, display: 'block', margin: '0 auto' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// x_max et V_m dans un SVG (indice en tspan, puis retour à la ligne de base)
const Xm = () => <><tspan>x</tspan><tspan fontSize="12" dy="4">max</tspan><tspan dy="-4"> </tspan></>;
const Vm = () => <><tspan>V</tspan><tspan fontSize="12" dy="4">m</tspan><tspan dy="-4"> </tspan></>;

// pointes de flèche (d : vers la droite, g : vers la gauche)
const Tete = ({ x, y, dir, c }) => {
  const p = { d: `${x},${y} ${x - 12},${y - 6} ${x - 12},${y + 6}`, g: `${x},${y} ${x + 12},${y - 6} ${x + 12},${y + 6}` };
  return <polygon points={p[dir]} fill={c}/>;
};

// ── Carte 1 : deux chemins vers n ──
export function FicheQuantite() {
  return (
    <div>
      <svg viewBox="0 0 300 182" style={svgStyle} role="img" aria-label="Deux chemins vers la quantité de matière n en moles : à partir de la masse m d’un solide, on divise par la masse molaire M ; à partir du volume V d’une solution en litres, on multiplie par la concentration c">
        <rect x="6" y="8" width="108" height="64" rx="10" fill="#eff6ff" stroke={BLEU} strokeWidth="2.5"/>
        <text x="60" y="34" textAnchor="middle" fontSize="14" fontWeight="800" fill={BLEU}>solide pesé</text>
        <text x="60" y="55" textAnchor="middle" fontSize="12.5" fill={GRIS}>m en grammes</text>
        <rect x="186" y="8" width="108" height="64" rx="10" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.5"/>
        <text x="240" y="34" textAnchor="middle" fontSize="14" fontWeight="800" fill={ORANGE}>solution</text>
        <text x="240" y="55" textAnchor="middle" fontSize="12.5" fill={GRIS}>V en litres</text>
        <path d="M 60 74 V 150 H 100" fill="none" stroke={BLEU} strokeWidth="3" strokeLinejoin="round"/><Tete x={110} y={150} dir="d" c={BLEU}/>
        <path d="M 240 74 V 150 H 200" fill="none" stroke={ORANGE} strokeWidth="3" strokeLinejoin="round"/><Tete x={190} y={150} dir="g" c={ORANGE}/>
        <text x="68" y="100" fontSize="15" fontWeight="800" fill={BLEU}>÷ M</text><text x="68" y="117" fontSize="12.5" fill={GRIS}>(g·mol⁻¹)</text>
        <text x="232" y="100" textAnchor="end" fontSize="15" fontWeight="800" fill={ORANGE}>× c</text><text x="232" y="117" textAnchor="end" fontSize="12.5" fill={GRIS}>(mol·L⁻¹)</text>
        <rect x="112" y="128" width="76" height="44" rx="22" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="156" textAnchor="middle" fontSize="16" fontWeight="800" fill={VERT}>n (mol)</text>
      </svg>
      <Formule><mi>n</mi><mo>=</mo><mfrac><mi>m</mi><mi>M</mi></mfrac><mspace width="2.5em"/><mi>n</mi><mo>=</mo><mi>c</mi><mo>×</mo><mi>V</mi></Formule>
      <ul style={liste}>
        <li>Exemple : 1,2 g de carbone (M = 12 g·mol⁻¹) donnent n = 1,2 ÷ 12 = <strong>0,10 mol</strong>.</li>
        <li>Exemple : 20 mL de solution à 0,50 mol·L⁻¹ donnent n = 0,50 × 0,020 = <strong>0,010 mol</strong>.</li>
        <li><strong>Piège</strong> : toujours des grammes avec M, toujours des litres avec c (20 mL = 0,020 L).</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : structure du tableau d'avancement ──
const Ligne = ({ y, fond, c, textes, etiquette }) => (
  <g>
    <text x="34" y={y + 17} textAnchor="middle" fontSize="12" fill={GRIS}>{etiquette[0]}</text>
    <text x="34" y={y + 33} textAnchor="middle" fontSize="12" fontWeight="700" fill={ENCRE}>{etiquette[1]}</text>
    {textes.map((t, k) => <g key={k}>
      <rect x={68 + k * 76} y={y} width="76" height="46" fill={fond} stroke="#94a3b8" strokeWidth="1.5"/>
      <text x={106 + k * 76} y={y + 28} textAnchor="middle" fontSize="13" fontWeight="700" fill={c}>{t}</text></g>)}
  </g>
);
export function FicheTableau() {
  return (
    <div>
      <svg viewBox="0 0 300 232" style={svgStyle} role="img" aria-label="Tableau d’avancement de la réaction 2 H2 plus O2 donne 2 H2O : trois lignes, état initial avec x égal 0, en cours avec x, état final avec x égal x max ; le coefficient de l’équation se retrouve devant x dans chaque case">
        <text x="150" y="22" textAnchor="middle" fontSize="16" fontWeight="800" fill={ENCRE}><tspan fill={ORANGE}>2</tspan> H₂ + O₂ → <tspan fill={ORANGE}>2</tspan> H₂O</text>
        {['H₂', 'O₂', 'H₂O'].map((e, k) => <g key={e}>
          <rect x={68 + k * 76} y="34" width="76" height="30" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5"/>
          <text x={106 + k * 76} y="55" textAnchor="middle" fontSize="15" fontWeight="800" fill={[BLEU, VIOLET, VERT][k]}>{e}</text></g>)}
        <Ligne y={64} fond="#ffffff" c={ENCRE} textes={['n₁', 'n₂', '0']} etiquette={['initial', 'x = 0']}/>
        <Ligne y={110} fond="#fff7ed" c={ORANGE} textes={['n₁ − 2x', 'n₂ − x', '2x']} etiquette={['en cours', 'x']}/>
        <g>
          <text x="34" y="173" textAnchor="middle" fontSize="12" fill={GRIS}>final</text>
          <text x="34" y="189" textAnchor="middle" fontSize="12" fontWeight="700" fill={ENCRE}>x = <Xm/></text>
          {['n₁ − 2', 'n₂ − ', '2'].map((t, k) => <g key={k}>
            <rect x={68 + k * 76} y="156" width="76" height="46" fill="#f0fdf4" stroke="#94a3b8" strokeWidth="1.5"/>
            <text x={106 + k * 76} y="184" textAnchor="middle" fontSize="13" fontWeight="700" fill={VERT}>{t}<Xm/></text></g>)}
        </g>
        <text x="150" y="220" textAnchor="middle" fontSize="12.5" fill={GRIS}>le coefficient de l’équation se retrouve devant x</text>
      </svg>
      <ul style={liste}>
        <li>Une ligne par état : <strong>initial</strong>, <strong>en cours</strong> (avancement x), <strong>final</strong>.</li>
        <li>Un réactif <strong>diminue</strong> (n − coefficient × x), un produit <strong>augmente</strong> (coefficient × x).</li>
        <li>Les quantités s’écrivent en <strong>mol</strong>, jamais en grammes ni en mL.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : réactif limitant ──
export function FicheLimitant() {
  return (
    <div>
      <svg viewBox="0 0 300 198" style={svgStyle} role="img" aria-label="Réactif limitant de 2 H2 plus O2 donne 2 H2O avec 0,30 mol de H2 et 0,20 mol de O2 : on divise chaque quantité par son coefficient, 0,15 pour H2 et 0,20 pour O2 ; la plus petite valeur, 0,15 mol, est l’avancement maximal et H2 est limitant">
        <text x="150" y="18" textAnchor="middle" fontSize="13" fontWeight="800" fill={GRIS}>pour chaque réactif : n ÷ coefficient</text>
        <text x="4" y="54" fontSize="15" fontWeight="800" fill={BLEU}>H₂</text>
        <rect x="36" y="32" width="112" height="28" rx="5" fill={VERT}/>
        <text x="156" y="52" fontSize="13" fontWeight="700" fill={VERT}>0,30 ÷ 2 = 0,15</text>
        <text x="4" y="98" fontSize="15" fontWeight="800" fill={VIOLET}>O₂</text>
        <rect x="36" y="76" width="150" height="28" rx="5" fill="#94a3b8"/>
        <text x="194" y="96" fontSize="13" fontWeight="700" fill={GRIS}>0,20 ÷ 1 = 0,20</text>
        <line x1="148" y1="26" x2="148" y2="118" stroke={ORANGE} strokeWidth="2.5" strokeDasharray="5 4"/>
        <text x="148" y="138" textAnchor="middle" fontSize="15" fontWeight="800" fill={ORANGE}><Xm/> = 0,15 mol</text>
        <rect x="14" y="152" width="272" height="36" rx="18" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="175" textAnchor="middle" fontSize="14" fontWeight="800" fill={VERT}>le plus petit gagne : H₂ limitant</text>
      </svg>
      <ul style={liste}>
        <li><strong>Le plus petit gagne</strong> : la réaction s’arrête quand le premier réactif est épuisé.</li>
        <li>Attention aux coefficients : 0,30 mol de H₂ ne vaut pas 0,30 de x, mais 0,30 ÷ 2.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : état final ──
const Barres = ({ x0, valeurs, couleurs }) => (
  <g>
    <line x1={x0} y1="150" x2={x0 + 132} y2="150" stroke="#94a3b8" strokeWidth="2"/>
    {valeurs.map(([n, h], k) => {
      const cx = x0 + 24 + k * 44;
      return <g key={k}>
        <rect x={cx - 15} y={150 - h} width="30" height={h} fill={couleurs[k]} rx="3"/>
        <text x={cx} y={144 - h} textAnchor="middle" fontSize="13" fontWeight="800" fill={couleurs[k]}>{n}</text>
        <text x={cx} y="168" textAnchor="middle" fontSize="13" fontWeight="800" fill={couleurs[k]}>{['H₂', 'O₂', 'H₂O'][k]}</text></g>;
    })}
  </g>
);
export function FicheEtatFinal() {
  return (
    <div>
      <svg viewBox="0 0 300 222" style={svgStyle} role="img" aria-label="Avant et après la transformation 2 H2 plus O2 donne 2 H2O : au départ 0,30 mol de H2, 0,20 mol de O2 et 0 mol de H2O ; à l’état final, avec x max égal 0,15 mol, il reste 0 mol de H2 qui est épuisé, 0,05 mol de O2 et il s’est formé 0,30 mol de H2O">
        <text x="72" y="20" textAnchor="middle" fontSize="13" fontWeight="800" fill={GRIS}>avant (x = 0)</text>
        <text x="228" y="20" textAnchor="middle" fontSize="13" fontWeight="800" fill={GRIS}>après (x = <Xm/>)</text>
        <Barres x0={6} valeurs={[['0,30', 84], ['0,20', 56], ['0', 0]]} couleurs={[BLEU, VIOLET, VERT]}/>
        <Barres x0={162} valeurs={[['0', 0], ['0,05', 14], ['0,30', 84]]} couleurs={[BLEU, VIOLET, VERT]}/>
        <path d="M 142 96 H 150" stroke={ORANGE} strokeWidth="3.5"/><Tete x={160} y={96} dir="d" c={ORANGE}/>
        <rect x="14" y="184" width="272" height="32" rx="16" fill="#fef2f2" stroke={ROUGE} strokeWidth="2.5"/>
        <text x="150" y="205" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={ROUGE}><Xm/> = 0,15 mol : H₂ épuisé</text>
      </svg>
      <Formule><msub><mi>n</mi><mtext>final</mtext></msub><mo>=</mo><msub><mi>n</mi><mtext>initial</mtext></msub><mo>∓</mo><mtext>coefficient</mtext><mo>×</mo><msub><mi>x</mi><mtext>max</mtext></msub></Formule>
      <ul style={liste}>
        <li>Réactif : <strong>− coefficient × x<sub>max</sub></strong> ; produit : <strong>+ coefficient × x<sub>max</sub></strong>.</li>
        <li>Transformation <strong>totale</strong> : l’avancement final x<sub>f</sub> est égal à x<sub>max</sub>. Le réactif limitant est épuisé : 0 mol.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : volume molaire ──
const Molecules = ({ x0, y0, c }) => (
  <g>{[0, 1, 2].map(i => [0, 1].map(j => <circle key={`${i}${j}`} cx={x0 + 16 + i * 24} cy={y0 + 24 + j * 38} r="6.5" fill={c}/>))}</g>
);
export function FicheVolumeMolaire() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Une mole de dihydrogène et une mole de dioxyde de carbone occupent le même volume, environ 24 litres, à la même température et à la même pression ; le volume molaire est le volume divisé par la quantité de matière">
        <text x="150" y="18" textAnchor="middle" fontSize="13" fontWeight="800" fill={GRIS}>même température, même pression</text>
        <rect x="10" y="30" width="82" height="90" rx="9" fill="#eff6ff" stroke={BLEU} strokeWidth="2.5"/>
        <Molecules x0={10} y0={30} c={BLEU}/>
        <rect x="104" y="30" width="82" height="90" rx="9" fill="#f5f3ff" stroke={VIOLET} strokeWidth="2.5"/>
        <Molecules x0={104} y0={30} c={VIOLET}/>
        <text x="51" y="140" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>1 mol de H₂</text>
        <text x="145" y="140" textAnchor="middle" fontSize="13" fontWeight="800" fill={VIOLET}>1 mol de CO₂</text>
        <path d="M 196 30 H 205 V 120 H 196" fill="none" stroke={ORANGE} strokeWidth="3" strokeLinejoin="round"/>
        <text x="212" y="80" fontSize="16" fontWeight="800" fill={ORANGE}>≈ 24 L</text>
        <rect x="14" y="154" width="272" height="34" rx="17" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="176" textAnchor="middle" fontSize="14" fontWeight="800" fill={VERT}><Vm/>= V ÷ n  en L·mol⁻¹</text>
      </svg>
      <ul style={liste}>
        <li><strong>Une mole de n’importe quel gaz</strong> occupe le même volume (≈ 24 L à 20 °C sous 1013 hPa).</li>
        <li>Exemple : 1,45 L de gaz pour 0,060 mol donnent V<sub>m</sub> = 1,45 ÷ 0,060 ≈ <strong>24 L·mol⁻¹</strong>.</li>
        <li>Il dépend de la température et de la pression, pas de la nature du gaz.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : sources d'écart ──
const Tube = ({ x, y, gaz }) => (
  <g>
    <rect x={x} y={y} width="22" height="48" fill="#bae6fd" stroke={ENCRE} strokeWidth="2"/>
    <rect x={x} y={y} width="22" height={gaz} fill="#fef08a" stroke={ENCRE} strokeWidth="2"/>
  </g>
);
export function FicheEcarts() {
  return (
    <div>
      <svg viewBox="0 0 300 236" style={svgStyle} role="img" aria-label="Si le volume molaire mesuré est trop grand, la cause peut être la vapeur d’eau mêlée au gaz (environ 2 pour cent) ou un gaz encore chaud ; s’il est trop petit, la cause peut être une fuite au bouchon ou du gaz perdu avant de reboucher ; la valeur attendue pour le gaz sec à 20 degrés est 24,1 litres par mole">
        <rect x="4" y="4" width="292" height="88" rx="10" fill="#fef2f2" stroke={ROUGE} strokeWidth="2.5"/>
        <Tube x={16} y={20} gaz={34}/>
        <text x="50" y="30" fontSize="14" fontWeight="800" fill={ROUGE}>↑ volume mesuré trop grand</text>
        <text x="50" y="54" fontSize="13" fill={ENCRE}>• vapeur d’eau mêlée (≈ + 2 %)</text>
        <text x="50" y="76" fontSize="13" fill={ENCRE}>• gaz encore chaud</text>
        <rect x="4" y="100" width="292" height="36" rx="18" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="123" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>attendu : 24,1 L·mol⁻¹ (gaz sec, 20 °C)</text>
        <rect x="4" y="144" width="292" height="88" rx="10" fill="#eff6ff" stroke={BLEU} strokeWidth="2.5"/>
        <Tube x={16} y={160} gaz={14}/>
        <text x="50" y="170" fontSize="14" fontWeight="800" fill={BLEU}>↓ volume mesuré trop petit</text>
        <text x="50" y="194" fontSize="13" fill={ENCRE}>• fuite au bouchon</text>
        <text x="50" y="216" fontSize="13" fill={ENCRE}>• gaz perdu avant de reboucher</text>
      </svg>
      <ul style={liste}>
        <li><strong>Hypothèses du modèle</strong> : dihydrogène parfait, non dissous dans l’eau, pression égale à la pression atmosphérique, gaz revenu à la température de la salle.</li>
        <li>Un petit écart positif est normal : il ne prouve pas une erreur de manipulation. Lecture au zoom : ± 1 mL.</li>
      </ul>
    </div>
  );
}
