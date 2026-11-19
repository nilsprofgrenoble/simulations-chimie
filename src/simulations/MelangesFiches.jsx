// Cartes « À retenir » de la simulation « Mélanges : miscibilité, solubilité et densité » (sim 63, 2GT).
// Chaque carte est posée UNE ÉTAPE APRÈS la question qu'elle conclut, avec d'autres valeurs que celles de l'étape.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320 (pas de grossissement sur ordinateur).
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', EAU = '#bfdbfe', VERT = '#15803d', ORANGE = '#c2410c', ROUGE = '#b91c1c', ENCRE = '#0f172a', HUILE = '#fde68a', MERC = '#94a3b8';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };

// Tube : x, y = coin haut-gauche ; couches = [{ f: fraction de hauteur, c: couleur }] du haut vers le bas ; grains = points de soluté
const Tube = ({ x, y, w = 50, h = 84, couches, grains = [] }) => {
  const id = `tb${x}${y}`, tot = couches.reduce((a, c) => a + c.f, 0);
  let cy = y;
  return (
    <g>
      <clipPath id={id}><path d={`M${x},${y} L${x},${y + h - w / 2} A${w / 2},${w / 2} 0 0 0 ${x + w},${y + h - w / 2} L${x + w},${y} Z`}/></clipPath>
      <g clipPath={`url(#${id})`}>{couches.map((c, i) => { const hh = h * c.f / tot, r = <rect key={i} x={x} y={cy} width={w} height={hh} fill={c.c}/>; cy += hh; return r; })}
        {grains.map(([a, b], i) => <circle key={'g' + i} cx={x + a * w} cy={y + b * h} r="2.6" fill={ENCRE}/>)}</g>
      <path d={`M${x},${y} L${x},${y + h - w / 2} A${w / 2},${w / 2} 0 0 0 ${x + w},${y + h - w / 2} L${x + w},${y}`} fill="none" stroke={GRIS} strokeWidth="2.5" strokeLinecap="round"/>
    </g>
  );
};
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => { const a = Math.atan2(y2 - y1, x2 - x1); return <g><line x1={x1} y1={y1} x2={x2 - Math.cos(a) * 6} y2={y2 - Math.sin(a) * 6} stroke={c} strokeWidth="2.5"/><polygon points={`${x2},${y2} ${x2 - Math.cos(a) * 9 - Math.sin(a) * 5},${y2 - Math.sin(a) * 9 + Math.cos(a) * 5} ${x2 - Math.cos(a) * 9 + Math.sin(a) * 5},${y2 - Math.sin(a) * 9 - Math.cos(a) * 5}`} fill={c}/></g>; };

// ── Carte 1 : miscible / non miscible / soluble ──
export function FicheMisc() {
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Trois tubes : eau et vinaigre forment un seul liquide, ils sont miscibles ; eau et essence forment deux couches, ils ne sont pas miscibles ; un solide, le sel, qui disparaît dans l’eau est soluble dans l’eau">
        <Tube x={22} y={14} couches={[{ f: 1, c: '#e0f2fe' }]}/>
        <text x="47" y="122" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={VERT}>miscibles</text>
        <text x="47" y="138" textAnchor="middle" fontSize="12.5" fill={ENCRE}>eau + vinaigre</text>
        <text x="47" y="154" textAnchor="middle" fontSize="12.5" fill={GRIS}>1 seul liquide</text>
        <Tube x={125} y={14} couches={[{ f: 0.4, c: HUILE }, { f: 0.6, c: EAU }]}/>
        <text x="150" y="122" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ROUGE}>non miscibles</text>
        <text x="150" y="138" textAnchor="middle" fontSize="12.5" fill={ENCRE}>eau + essence</text>
        <text x="150" y="154" textAnchor="middle" fontSize="12.5" fill={GRIS}>2 couches</text>
        <Tube x={228} y={14} couches={[{ f: 1, c: '#e0f2fe' }]} grains={[[0.25, 0.3], [0.65, 0.25], [0.45, 0.55], [0.75, 0.65], [0.3, 0.8]]}/>
        <text x="253" y="122" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={BLEU}>soluble</text>
        <text x="253" y="138" textAnchor="middle" fontSize="12.5" fill={ENCRE}>sel dans l’eau</text>
        <text x="253" y="154" textAnchor="middle" fontSize="12.5" fill={GRIS}>solide dissous</text>
        <text x="150" y="178" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>liquide + liquide : miscible</text>
        <text x="150" y="195" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>solide + liquide : soluble</text>
      </svg>
      <ul style={liste}>
        <li><em>« Miscible » pour deux liquides, « soluble » pour un solide dans un liquide.</em></li>
        <li>Mélange <strong>homogène</strong> : un seul liquide (miscibles). Mélange <strong>hétérogène</strong> : deux couches (non miscibles).</li>
        <li>Un colorant colore le liquide qui le dissout. Hypothèse : l’huile végétale est supposée très peu miscible à l’eau et à l’éthanol à 20 °C.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : masse volumique et densité ──
export function FicheRho() {
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Un sirop : 120 grammes pour un volume de 100 millilitres, soit 0,100 litre ; la masse volumique est la masse divisée par le volume, 1200 grammes par litre ; la densité est la masse volumique divisée par celle de l’eau, 1000 grammes par litre, soit 1,20 sans unité">
        <Tube x={14} y={10} w={56} h={96} couches={[{ f: 0.2, c: '#fff' }, { f: 0.8, c: '#fcd9b6' }]}/>
        <text x="42" y="126" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>m = 120 g</text>
        <text x="42" y="142" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={BLEU}>V = 100 mL</text>
        <Fleche x1={80} y1={60} x2={108} y2={60}/>
        <rect x="112" y="10" width="182" height="82" rx="12" fill="#fff" stroke={ORANGE} strokeWidth="2.5"/>
        <text x="203" y="30" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>masse volumique</text>
        <text x="203" y="48" textAnchor="middle" fontSize="12.5" fill={ENCRE}>ρ = 120 g ÷ 0,100 L</text>
        <text x="203" y="68" textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>= 1200 g/L</text>
        <text x="203" y="84" textAnchor="middle" fontSize="12" fill={GRIS}>(V converti en L)</text>
        <Fleche x1={203} y1={96} x2={203} y2={110}/>
        <rect x="112" y="114" width="182" height="64" rx="12" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="203" y="134" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>densité (sans unité)</text>
        <text x="203" y="152" textAnchor="middle" fontSize="12.5" fill={ENCRE}>d = 1200 ÷ 1000</text>
        <text x="203" y="170" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>= 1,20</text>
      </svg>
      <Formule><mi>ρ</mi><mo>=</mo><mfrac><mi>m</mi><mi>V</mi></mfrac><mspace width="1.5em"/><mi>d</mi><mo>=</mo><mfrac><mi>ρ</mi><msub><mi>ρ</mi><mtext>eau</mtext></msub></mfrac></Formule>
      <ul style={liste}>
        <li><em>ρ : masse de 1 L du liquide</em> (en g/L). L’eau : ρ<sub>eau</sub> = 1000 g/L. La densité d compare à l’eau : elle n’a pas d’unité.</li>
        <li><strong>Piège</strong> : convertir les mL en L avant de diviser ; ne pas confondre ρ (en g/L) et d.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : superposition de liquides non miscibles ──
export function FicheSuperpose() {
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Un tube avec trois liquides non miscibles superposés : l’essence, de densité 0,75, au-dessus ; l’eau, de densité 1,0, au milieu ; le mercure, de densité 13,6, au fond ; le moins dense est au-dessus, le plus dense au fond">
        <Tube x={20} y={10} w={64} h={150} couches={[{ f: 0.3, c: HUILE }, { f: 0.4, c: EAU }, { f: 0.3, c: MERC }]}/>
        <text x="100" y="44" fontSize="12.5" fontWeight="800" fill={ORANGE}>essence</text>
        <text x="100" y="60" fontSize="12.5" fill={ENCRE}>d = 0,75</text>
        <text x="100" y="94" fontSize="12.5" fontWeight="800" fill={BLEU}>eau</text>
        <text x="100" y="110" fontSize="12.5" fill={ENCRE}>d = 1,0</text>
        <text x="100" y="146" fontSize="12.5" fontWeight="800" fill={GRIS}>mercure</text>
        <text x="100" y="162" fontSize="12.5" fill={ENCRE}>d = 13,6</text>
        <Fleche x1={248} y1={150} x2={248} y2={24} c={VERT}/>
        <text x="204" y="176" fontSize="12.5" fontWeight="800" fill={VERT}>moins dense</text>
        <text x="204" y="14" fontSize="12.5" fontWeight="800" fill={VERT}>au-dessus</text>
      </svg>
      <ul style={liste}>
        <li><em>Le moins dense flotte sur le plus dense.</em></li>
        <li>Méthode : comparer les densités ; <strong>le plus petit nombre est au-dessus</strong>. Une densité inférieure à 1 : on flotte sur l’eau.</li>
        <li>Valable pour des liquides <strong>non miscibles</strong> (deux couches séparées).</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : densité d'un mélange ──
export function FicheMelange() {
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="On mélange 20 millilitres d’eau, de densité 1,0, et 10 millilitres d’alcool, de densité 0,8 : la densité du mélange est la moyenne pondérée par les volumes, 28 divisé par 30, soit environ 0,93, comprise entre 0,8 et 1,0">
        <Tube x={16} y={10} w={50} h={80} couches={[{ f: 0.15, c: '#fff' }, { f: 0.85, c: EAU }]}/>
        <text x="41" y="108" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={BLEU}>20 mL d’eau</text>
        <text x="41" y="124" textAnchor="middle" fontSize="12.5" fill={ENCRE}>d = 1,0</text>
        <text x="80" y="60" textAnchor="middle" fontSize="20" fontWeight="800" fill={ENCRE}>+</text>
        <Tube x={100} y={30} w={44} h={60} couches={[{ f: 0.15, c: '#fff' }, { f: 0.85, c: '#fde2e4' }]}/>
        <text x="122" y="108" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ROUGE}>10 mL</text>
        <text x="122" y="124" textAnchor="middle" fontSize="12.5" fill={ENCRE}>alcool d = 0,8</text>
        <Fleche x1={158} y1={60} x2={186} y2={60}/>
        <Tube x={198} y={4} w={56} h={86} couches={[{ f: 0.12, c: '#fff' }, { f: 0.88, c: '#e6e3f7' }]}/>
        <text x="226" y="108" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={VERT}>mélange</text>
        <text x="226" y="124" textAnchor="middle" fontSize="12.5" fill={ENCRE}>30 mL</text>
        <rect x="6" y="136" width="288" height="50" rx="12" fill="#fff" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="156" textAnchor="middle" fontSize="12.5" fill={ENCRE}>d = (20 × 1,0 + 10 × 0,8) ÷ 30</text>
        <text x="150" y="176" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>d = 28 ÷ 30 ≈ 0,93 (entre 0,8 et 1,0)</text>
      </svg>
      <ul style={liste}>
        <li><em>La densité d’un mélange est une moyenne pondérée par les volumes</em> (masse totale ÷ volume total).</li>
        <li>Contrôle : d du mélange est <strong>entre</strong> celles de ses constituants.</li>
        <li><strong>Piège</strong> : additionner les densités (ici 1,0 + 0,8) au lieu de les pondérer.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : solution hydro-alcoolique (pourcentages volumiques) ──
const SHA = [['éthanol à 96 %', 85, '#fca5a5'], ['eau oxygénée 10 vol.', 4, '#fcd34d'], ['glycérol', 1.5, '#a7f3d0'], ['eau distillée (qsp)', 9.5, EAU]];
export function FicheSha() {
  let cx = 15;
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="100 millilitres de solution hydro-alcoolique : 85 millilitres d’éthanol à 96 pour cent, 4 d’eau oxygénée, 1,5 de glycérol et 9,5 d’eau distillée pour compléter ; chaque pourcentage en volume est le volume du constituant divisé par le volume total">
        <text x="150" y="16" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>100,0 mL de solution hydro-alcoolique</text>
        {SHA.map(([n, v, c]) => { const w = v * 2.7, r = <rect key={n} x={cx} y="26" width={w} height="34" fill={c} stroke="#fff" strokeWidth="1"/>; cx += w; return r; })}
        <rect x="15" y="26" width="270" height="34" rx="6" fill="none" stroke={GRIS} strokeWidth="2.5"/>
        {SHA.map(([n, v, c], i) => (
          <g key={n}>
            <rect x="15" y={76 + i * 24} width="16" height="16" rx="3" fill={c} stroke={GRIS} strokeWidth="1.5"/>
            <text x="40" y={89 + i * 24} fontSize="12.5" fill={ENCRE}>{n}</text>
            <text x="285" y={89 + i * 24} textAnchor="end" fontSize="12.5" fontWeight="800" fill={ENCRE}>{String(v).replace('.', ',')} mL</text>
          </g>
        ))}
        <text x="150" y="184" textAnchor="middle" fontSize="12.5" fill={GRIS}>total : 100,0 mL (l’eau complète)</text>
      </svg>
      <Formule><mi>p</mi><mo>=</mo><mfrac><msub><mi>V</mi><mtext>c</mtext></msub><msub><mi>V</mi><mtext>tot</mtext></msub></mfrac></Formule>
      <ul style={liste}>
        <li><em>Pourcentage volumique p = V<sub>c</sub> / V<sub>tot</sub></em> (V<sub>c</sub> : volume du constituant). On mesure chaque constituant en volume ; l’eau distillée complète à 100 mL.</li>
        <li>Les pourcentages <strong>en masse</strong> ne sont pas les mêmes que ceux <strong>en volume</strong> : les masses volumiques diffèrent.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : bilan ──
const Case = ({ x, y, w, t1, t2, c }) => <g><rect x={x} y={y} width={w} height="46" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/><text x={x + w / 2} y={y + 19} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{t1}</text><text x={x + w / 2} y={y + 36} textAnchor="middle" fontSize="12.5" fill={ENCRE}>{t2}</text></g>;
export function FicheBilanMel() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Chaîne de calcul : à partir de la masse et du volume converti en litres, on calcule la masse volumique, puis la densité ; si la densité est inférieure à 1, le liquide non miscible flotte sur l’eau, si elle est supérieure à 1, il coule">
        <Case x={6} y={6} w={86} t1="m et V" t2="V en litres" c={BLEU}/>
        <Fleche x1={94} y1={29} x2={104} y2={29}/>
        <Case x={106} y={6} w={86} t1="ρ = m / V" t2="en g/L" c={ORANGE}/>
        <Fleche x1={194} y1={29} x2={204} y2={29}/>
        <Case x={206} y={6} w={88} t1="d = ρ / ρ eau" t2="sans unité" c={VERT}/>
        <Fleche x1={250} y1={54} x2={250} y2={74} c={VERT}/>
        <Case x={6} y={78} w={134} t1="d < 1" t2="flotte sur l’eau" c={VERT}/>
        <Case x={160} y={78} w={134} t1="d > 1" t2="coule sous l’eau" c={ROUGE}/>
        <text x="150" y="150" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>mélange : d entre celles de ses constituants</text>
        <text x="150" y="168" textAnchor="middle" fontSize="12.5" fill={GRIS}>(moyenne pondérée par les volumes)</text>
      </svg>
      <ul style={liste}>
        <li><em>Convertir, calculer ρ, puis d : le moins dense est au-dessus.</em></li>
        <li><strong>Pièges</strong> : oublier mL → L ; confondre miscible et soluble ; additionner les densités au lieu de les pondérer.</li>
        <li>Vérifier l’ordre de grandeur (eau : 1000 g/L, d = 1).</li>
      </ul>
    </div>
  );
}
