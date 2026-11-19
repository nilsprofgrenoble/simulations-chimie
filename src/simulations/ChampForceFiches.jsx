// Cartes « À retenir » de la simulation « Champ et force : gravitation et électrostatique » (sim 48, 1G).
// Chaque carte est posée UNE ÉTAPE (ou plus) APRÈS la question qu'elle conclut, avec d'autres exemples que ceux de l'étape.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320. Vecteurs avec flèche (TV / TL).
import { Formule } from "../commun";
import { TV, TL } from "./Travail";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const GRAV = '\u{1D4A2}';
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
// Vecteur dans le texte HTML (flèche au-dessus)
function V({ children }) {
  return <span style={{ position: 'relative', display: 'inline-block', paddingTop: '0.25em' }}>{children}
    <span aria-hidden="true" style={{ position: 'absolute', top: '-0.45em', left: 0, right: 0, textAlign: 'center', fontSize: '0.75em', lineHeight: 1 }}>→</span></span>;
}
// Flèche de (x1,y1) vers (x2,y2)
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Case = ({ y, t1, t2, c }) => (
  <g>
    <rect x="6" y={y} width="288" height="42" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/>
    <text x="150" y={y + 18} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{t1}</text>
    {t2 && <text x="150" y={y + 34} textAnchor="middle" fontSize="12.5" fill={ENCRE}>{t2}</text>}
  </g>
);
const Bas = ({ y }) => <g><line x1="150" y1={y} x2="150" y2={y + 8} stroke={GRIS} strokeWidth="2.5"/><polygon points={`150,${y + 12} 145,${y + 5} 155,${y + 5}`} fill={GRIS}/></g>;

// ── Carte A : le champ de gravitation varie en 1 / d² ──
export function FicheGravitation() {
  return (
    <div>
      <Formule><mi>𝒢</mi><mo>=</mo><mfrac><mrow><mi>G</mi><mo>×</mo><msub><mi>M</mi><mtext>T</mtext></msub></mrow><msup><mi>d</mi><mn>2</mn></msup></mfrac></Formule>
      <svg viewBox="0 0 300 180" style={svgStyle} role="img" aria-label="Deux barres : au sol, à un rayon terrestre du centre, la norme du champ de gravitation vaut 9,82 newtons par kilogramme ; à trois rayons terrestres, elle est neuf fois plus petite, 1,09 newton par kilogramme">
        <T x={8} y={16} w={700}>norme {GRAV} (N·kg⁻¹)</T>
        <line x1="20" y1="138" x2="290" y2="138" stroke={GRIS} strokeWidth="2"/>
        <rect x="40" y="46" width="52" height="92" fill={BLEU}/><T x={66} y={40} a="middle" c={BLEU} w={800}>9,82</T>
        <T x={66} y={156} a="middle">au sol</T><T x={66} y={171} a="middle" c={GRIS}>d = 1 rayon</T>
        <rect x="140" y="128" width="52" height="10" fill={ORANGE}/><T x={166} y={122} a="middle" c={ORANGE} w={800}>1,09</T>
        <T x={166} y={156} a="middle">plus loin</T><T x={166} y={171} a="middle" c={GRIS}>d = 3 rayons</T>
        <T x={206} y={66} c={ORANGE} w={800}>d × 3</T><T x={206} y={84} c={ORANGE} w={800}>⇒ {GRAV} ÷ 9</T>
      </svg>
      <ul style={liste}>
        <li><em>Distance × 3, champ ÷ 9 : le champ varie comme 1 / d².</em></li>
        <li><strong>d est la distance au centre</strong> de la Terre (pas au sol), en <strong>mètres</strong>. M<sub>T</sub> = 5,972 × 10²⁴ kg ; R<sub>T</sub> = 6,371 × 10⁶ m.</li>
        <li><strong>Pièges :</strong> oublier le carré ; mesurer d depuis le sol ; garder des km.</li>
      </ul>
    </div>
  );
}

// ── Carte B : champ centripète ou centrifuge ──
export function FicheChamps() {
  const centres = [50, 150, 250], cy = 54;
  const angles = [0, 45, 90, 135, 180, 225, 270, 315].map(a => a * Math.PI / 180);
  const f = (cx, cin, c, sortant) => angles.map((a, i) => {
    const r1 = 21, r2 = 43, [s, e] = sortant ? [r1, r2] : [r2, r1];
    return <Arr key={`${cx}${i}`} x1={cx + s * Math.cos(a)} y1={cy + s * Math.sin(a)} x2={cx + e * Math.cos(a)} y2={cy + e * Math.sin(a)} c={c} w={2}/>;
  });
  return (
    <div>
      <svg viewBox="0 0 300 136" style={svgStyle} role="img" aria-label="Trois sources et leurs champs : la Terre crée un champ centripète, dirigé vers son centre ; une charge positive crée un champ centrifuge, qui s’éloigne d’elle ; une charge négative crée un champ centripète, qui arrive sur elle">
        {f(centres[0], 0, GRIS, false)}{f(centres[1], 0, ROUGE, true)}{f(centres[2], 0, BLEU, false)}
        <circle cx={centres[0]} cy={cy} r="15" fill="#bae6fd" stroke="#0369a1" strokeWidth="2"/><T x={centres[0]} y={cy + 4.5} a="middle" c="#0369a1" w={800}>T</T>
        <circle cx={centres[1]} cy={cy} r="15" fill="#fee2e2" stroke={ROUGE} strokeWidth="2"/><text x={centres[1]} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill={ROUGE}>+</text>
        <circle cx={centres[2]} cy={cy} r="15" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><text x={centres[2]} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill={BLEU}>−</text>
        <T x={centres[0]} y={114} a="middle" w={800}>Terre</T><T x={centres[0]} y={130} a="middle" c={GRIS} w={700}>centripète</T>
        <T x={centres[1]} y={114} a="middle" w={800} c={ROUGE}>Q &gt; 0</T><T x={centres[1]} y={130} a="middle" c={ROUGE} w={700}>centrifuge</T>
        <T x={centres[2]} y={114} a="middle" w={800} c={BLEU}>Q &lt; 0</T><T x={centres[2]} y={130} a="middle" c={BLEU} w={700}>centripète</T>
      </svg>
      <ul style={liste}>
        <li><em>Le champ s’éloigne d’une charge positive (+) ; il arrive sur une charge négative (−) et sur la Terre.</em></li>
        <li>Un <strong>champ</strong> est un <strong>vecteur défini en chaque point</strong> (direction, sens, norme), même sans objet ; la <strong>force</strong> n’existe que sur un objet placé en ce point.</li>
        <li>Une <strong>ligne de champ</strong> est tangente au vecteur champ en chacun de ses points et orientée dans son sens.</li>
      </ul>
    </div>
  );
}

// ── Carte C : champ de pesanteur et poids ──
export function FichePoids() {
  return (
    <div>
      <svg viewBox="0 0 300 198" style={svgStyle} role="img" aria-label="Dans une salle, le champ de pesanteur est le même partout : trois flèches identiques vers le bas ; un objet de 10 kilogrammes subit un poids de 98 newtons, dirigé vers le bas">
        <TL x={8} y={26} s={13} segs={[{ v: 'g' }, ' : champ de pesanteur']}/>
        {[26, 60, 94].map(x => <Arr key={x} x1={x} y1={44} x2={x} y2={104} c={GRIS} w={3}/>)}
        <T x={8} y={128} c={GRIS} w={700}>le même partout</T><T x={8} y={144} c={GRIS} w={700}>dans la salle</T>
        <rect x="176" y="88" width="76" height="40" rx="4" fill="#fde68a" stroke={ENCRE} strokeWidth="2.2"/>
        <T x={214} y={113} a="middle" w={800}>m = 10 kg</T>
        <Arr x1={214} y1={128} x2={214} y2={170} c={ROUGE} w={3.4}/>
        <TL x={226} y={156} s={13} c={ROUGE} segs={[{ v: 'P' }, ' = 98 N']}/>
        <line x1="8" y1="174" x2="292" y2="174" stroke={GRIS} strokeWidth="2.4"/>
        <TL x={8} y={193} s={13} segs={[{ v: 'P' }, ' = m × ', { v: 'g' }, '  (vers le bas)']}/>
      </svg>
      <ul style={liste}>
        <li><em>Poids = masse × champ de pesanteur : P = m × g.</em></li>
        <li>Près du sol, le champ de gravitation s’appelle <strong>champ de pesanteur</strong> ; il est <strong>localement uniforme</strong> : à l’échelle d’une salle, même direction, même sens, même norme.</li>
        <li><strong>Exemple :</strong> m = 10 kg → P = 10 × 9,82 ≈ 98 N. <strong>Hypothèses :</strong> Terre sphérique homogène (Paris : 9,81 ; rotation et aplatissement négligés).</li>
      </ul>
    </div>
  );
}

// ── Carte D : le champ électrostatique ──
export function FicheChampE() {
  return (
    <div>
      <Formule><mi>E</mi><mo>=</mo><mfrac><mrow><mi>k</mi><mo>×</mo><mrow><mo>|</mo><mi>Q</mi><mo>|</mo></mrow></mrow><msup><mi>d</mi><mn>2</mn></msup></mfrac></Formule>
      <svg viewBox="0 0 300 126" style={svgStyle} role="img" aria-label="Une charge Q de plus 5,0 nanocoulombs crée, à 30 centimètres, un champ électrostatique de 5,0 fois 10 puissance 2 newtons par coulomb, orienté vers l’extérieur ; si la distance double, le champ est divisé par 4">
        <circle cx="34" cy="50" r="17" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.2"/><text x="34" y="56" textAnchor="middle" fontSize="18" fontWeight="800" fill={ROUGE}>+</text>
        <T x={34} y={82} a="middle" c={ROUGE} w={700}>Q = 5,0 nC</T>
        <line x1="52" y1="50" x2="230" y2="50" stroke={GRIS} strokeWidth="1.8" strokeDasharray="5 4"/>
        <T x={140} y={40} a="middle" c={GRIS} w={700}>d = 30 cm</T>
        <circle cx="232" cy="50" r="5" fill={ENCRE}/><T x={232} y={72} a="middle" w={700}>M</T>
        <Arr x1={232} y1={50} x2={290} y2={50} c={VERT} w={3.2}/><TV x={252} y={38} c={VERT} s={14}>E</TV>
        <T x={150} y={104} a="middle" c={VERT} w={800}>E = 5,0 × 10² N·C⁻¹</T>
        <T x={150} y={121} a="middle" c={ORANGE} w={800}>d × 2 ⇒ E ÷ 4</T>
      </svg>
      <ul style={liste}>
        <li><strong>Constante :</strong> k = 9,0 × 10⁹ N·m²·C⁻². <strong>Méthode :</strong> convertir en unités SI (1 nC = 10⁻⁹ C ; 1 cm = 10⁻² m), puis k × |Q| / d², résultat en <strong>N·C⁻¹</strong>.</li>
        <li><strong>Exemple :</strong> 9,0 × 10⁹ × 5,0 × 10⁻⁹ / (0,30)² = 45 / 0,090 = <strong>5,0 × 10² N·C⁻¹</strong>.</li>
        <li>Le champ ne dépend que de la <strong>source Q</strong> et du point M, pas de la charge q placée en M. <strong>Hypothèse :</strong> source ponctuelle.</li>
      </ul>
    </div>
  );
}

// ── Carte E : la force F = q E ──
export function FicheForceQE() {
  return (
    <div>
      <svg viewBox="0 0 300 156" style={svgStyle} role="img" aria-label="Deux cas : une charge q positive subit une force de même sens que le champ ; une charge q négative subit une force de sens opposé au champ">
        <T x={8} y={52} c={ROUGE} w={800}>q &gt; 0</T>
        <circle cx="96" cy="42" r="5.5" fill={ROUGE}/>
        <Arr x1={96} y1={32} x2={170} y2={32} c={VERT} w={3}/><TV x={128} y={22} c={VERT} s={14}>E</TV>
        <Arr x1={96} y1={52} x2={170} y2={52} c={ORANGE} w={3}/><TV x={128} y={72} c={ORANGE} s={14}>F</TV>
        <T x={184} y={47} c={ORANGE} w={800}>même sens</T>
        <T x={8} y={118} c={BLEU} w={800}>q &lt; 0</T>
        <circle cx="132" cy="108" r="5.5" fill={BLEU}/>
        <Arr x1={132} y1={98} x2={206} y2={98} c={VERT} w={3}/><TV x={164} y={90} c={VERT} s={14}>E</TV>
        <Arr x1={132} y1={118} x2={58} y2={118} c={ORANGE} w={3}/><TV x={88} y={138} c={ORANGE} s={14}>F</TV>
        <T x={214} y={113} c={ORANGE} w={800}>sens opposé</T>
      </svg>
      <Formule><mover><mi>F</mi><mo>→</mo></mover><mo>=</mo><mi>q</mi><mo>×</mo><mover><mi>E</mi><mo>→</mo></mover><mspace width="1.5em"/><mi>F</mi><mo>=</mo><mrow><mo>|</mo><mi>q</mi><mo>|</mo></mrow><mo>×</mo><mi>E</mi></Formule>
      <ul style={liste}>
        <li><em>q positive : la force suit le champ ; q négative : elle va à contre-sens.</em></li>
        <li><strong>Exemple :</strong> q = −3,0 nC dans E = 5,0 × 10² N·C⁻¹ : F = 3,0 × 10⁻⁹ × 5,0 × 10² = <strong>1,5 × 10⁻⁶ N</strong>, de sens opposé à <V>E</V>.</li>
        <li><strong>Pièges :</strong> q en nC non converti ; signe moins dans une norme ; diviser au lieu de multiplier.</li>
      </ul>
    </div>
  );
}

// ── Carte F : bilan ──
export function FicheBilanChamp() {
  return (
    <div>
      <svg viewBox="0 0 300 218" style={svgStyle} role="img" aria-label="Bilan : une source, la Terre ou une charge, crée un champ en chaque point ; le champ est centripète pour la Terre et une charge négative, centrifuge pour une charge positive ; un objet placé en M subit une force, le poids m fois g ou q fois E">
        <Case y={4} t1="une source crée un champ" t2="en chaque point de l’espace" c={BLEU}/>
        <Bas y={48}/>
        <Case y={62} t1="Terre ou Q &lt; 0 : centripète" t2="Q &gt; 0 : centrifuge" c={ORANGE}/>
        <Bas y={106}/>
        <g>
          <rect x="6" y="120" width="288" height="42" rx="12" fill="#fff" stroke={VERT} strokeWidth="2.5"/>
          <T x={150} y={138} a="middle" c={VERT} w={800}>un objet placé en M subit une force</T>
          <TL x={52} y={155} s={13} segs={[{ v: 'P' }, ' = m × ', { v: 'g' }, '    ', { v: 'F' }, ' = q × ', { v: 'E' }]}/>
        </g>
        <T x={150} y={184} a="middle" w={700}>unités SI : N·kg⁻¹ pour {GRAV} et g ; N·C⁻¹ pour E</T>
        <T x={150} y={201} a="middle" c={GRIS}>pièges : carré de d, mètres, coulombs</T>
      </svg>
      <ul style={liste}>
        <li><em>Source → champ en chaque point → force sur ce qu’on y place.</em></li>
        <li>Champs : {GRAV} = G × M<sub>T</sub> / d² (Terre) ; E = k × |Q| / d² (charge ponctuelle).</li>
        <li>Forces : <V>F</V> = m <V>{GRAV}</V> (poids <V>P</V> = m <V>g</V>) et <V>F</V> = q <V>E</V> (même sens que <V>E</V> si q &gt; 0, opposé si q &lt; 0).</li>
      </ul>
    </div>
  );
}
