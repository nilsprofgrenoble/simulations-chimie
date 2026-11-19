// Cartes « À retenir » de la simulation « Spectres d'émission » (sim 66, 2GT).
// Chaque carte est posée UNE ÉTAPE (ou plus) APRÈS la question qu'elle conclut ; exemples différents de ceux demandés.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const COUL = ['#7c3aed', '#5b4bf0', '#2563eb', '#0891b2', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];
// couleur approchée d'une radiation (400–800 nm)
const couleurNm = l => COUL[Math.max(0, Math.min(COUL.length - 1, Math.round((l - 400) / 400 * (COUL.length - 1))))];
const L2 = ({ x1, y1, x2, y2, c, w = 2.5, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}/>;
const Case = ({ y, t1, t2, c }) => (
  <g>
    <rect x="6" y={y} width="288" height="42" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/>
    <text x="150" y={y + 18} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{t1}</text>
    <text x="150" y={y + 34} textAnchor="middle" fontSize="12.5" fill={ENCRE}>{t2}</text>
  </g>
);
const Bas = ({ y }) => <g><line x1="150" y1={y} x2="150" y2={y + 8} stroke={GRIS} strokeWidth="2.5"/><polygon points={`150,${y + 12} 145,${y + 5} 155,${y + 5}`} fill={GRIS}/></g>;

// ── Carte A : spectre et longueur d'onde ──
export function FicheSpectre() {
  const n = COUL.length, w = 160 / n;
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Un prisme disperse la lumière blanche en un spectre de couleurs ; en dessous, l’échelle des longueurs d’onde : ultraviolet sous 400 nanomètres, visible de 400 nanomètres (violet) à 800 nanomètres (rouge), infrarouge au-dessus">
        <L2 x1="8" y1="50" x2="104" y2="50" c={GRIS} w="4"/>
        <polygon points="104,22 104,78 146,50" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.5" strokeLinejoin="round"/>
        {COUL.filter((_, i) => i % 2 === 0).map((c, i, t) => <L2 key={i} x1="146" y1="50" x2="232" y2={14 + i * (72 / (t.length - 1))} c={c} w="3"/>)}
        <text x="8" y="38" fontSize="12.5" fontWeight="700" fill={ENCRE}>lumière blanche</text>
        <text x="125" y="92" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={BLEU}>prisme</text>
        <text x="238" y="54" fontSize="12.5" fontWeight="700" fill={ENCRE}>spectre</text>
        <rect x="10" y="118" width="60" height="28" fill="#ede9fe" stroke="#6d28d9"/>
        {COUL.map((c, i) => <rect key={i} x={70 + i * w} y="118" width={w + 0.6} height="28" fill={c}/>)}
        <rect x="230" y="118" width="60" height="28" fill="#fee2e2" stroke={ROUGE}/>
        <text x="40" y="137" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#6d28d9">UV</text>
        <text x="260" y="137" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ROUGE}>IR</text>
        <text x="150" y="113" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={GRIS}>visible</text>
        <L2 x1="70" y1="146" x2="70" y2="154" c={ENCRE} w="2"/><L2 x1="230" y1="146" x2="230" y2="154" c={ENCRE} w="2"/>
        <text x="70" y="170" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>400 nm</text>
        <text x="230" y="170" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>800 nm</text>
        <text x="70" y="187" textAnchor="middle" fontSize="12.5" fill={GRIS}>violet</text>
        <text x="230" y="187" textAnchor="middle" fontSize="12.5" fill={GRIS}>rouge</text>
      </svg>
      <ul style={liste}>
        <li><em>Un prisme ou un réseau disperse la lumière : chaque radiation a sa longueur d’onde λ (en nm).</em></li>
        <li>Visible : <strong>400 à 800 nm</strong>. En dessous, l’ultraviolet ; au-dessus, l’infrarouge : invisibles à l’œil.</li>
        <li><strong>Exemple</strong> : 450 nm est visible (bleu) ; 300 nm est dans l’UV ; 900 nm dans l’IR.</li>
      </ul>
    </div>
  );
}

// ── Carte B : spectre d'un corps chaud ──
const planck = (l, T) => 1 / (l ** 5 * (Math.exp(1.4388e7 / (l * T)) - 1));
export function FicheCorps() {
  const X = l => 30 + (l - 200) / 1000 * 262, Y0 = 116, Y1 = 20;
  const courbe = T => {
    const pts = []; let m = 0;
    for (let l = 200; l <= 1200; l += 10) m = Math.max(m, planck(l, T));
    for (let l = 200; l <= 1200; l += 10) pts.push(`${X(l).toFixed(1)},${(Y0 - planck(l, T) / m * (Y0 - Y1)).toFixed(1)}`);
    return pts.join(' ');
  };
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Trois spectres continus de corps chauds de températures croissantes : plus la température est élevée, plus le maximum de la courbe se déplace vers les petites longueurs d’onde, du côté du violet">
        <rect x={X(400)} y={Y1} width={X(800) - X(400)} height={Y0 - Y1} fill="#fef9c3" opacity="0.8"/>
        <text x={(X(400) + X(800)) / 2} y={Y1 - 6} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={GRIS}>visible</text>
        <L2 x1="30" y1={Y0} x2="294" y2={Y0} c={ENCRE} w="2"/><L2 x1="30" y1={Y1 - 4} x2="30" y2={Y0} c={ENCRE} w="2"/>
        <polyline points={courbe(3300)} fill="none" stroke={ROUGE} strokeWidth="3" strokeLinejoin="round"/>
        <polyline points={courbe(5000)} fill="none" stroke={ORANGE} strokeWidth="3" strokeLinejoin="round"/>
        <polyline points={courbe(8000)} fill="none" stroke={BLEU} strokeWidth="3" strokeLinejoin="round"/>
        {[400, 800].map(l => <g key={l}><L2 x1={X(l)} y1={Y0} x2={X(l)} y2={Y0 + 6} c={ENCRE} w="2"/><text x={X(l)} y={Y0 + 21} textAnchor="middle" fontSize="12.5" fill={ENCRE}>{l}</text></g>)}
        <text x="162" y="153" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>longueur d’onde λ (nm)</text>
        <text x="30" y="170" fontSize="12.5" fontWeight="800" fill={ROUGE}>— T basse</text>
        <text x="122" y="170" fontSize="12.5" fontWeight="800" fill={ORANGE}>— T moyenne</text>
        <text x="228" y="170" fontSize="12.5" fontWeight="800" fill={BLEU}>— T élevée</text>
      </svg>
      <ul style={liste}>
        <li><em>Plus un corps est chaud, plus le maximum de son spectre est du côté du violet.</em></li>
        <li>Un corps <strong>dense</strong> (solide, liquide) chaud émet un spectre <strong>continu</strong> : toutes les radiations, d’intensités différentes. Couleur perçue : rouge → jaune → blanc → bleu.</li>
        <li><strong>Hypothèse</strong> : modèle du « corps noir » ; couleurs vues depuis la Terre.</li>
      </ul>
    </div>
  );
}

// ── Carte C : lire une température (loi de Wien) ──
export function FicheWien() {
  const X = l => 44 + (l - 300) / 700 * 240, Y = t => 130 - (t - 2000) / 8000 * 104;
  const th = l => 2.898e6 / l - 273;
  const pts = []; for (let l = 300; l <= 1000; l += 10) pts.push(`${X(l).toFixed(1)},${Y(th(l)).toFixed(1)}`);
  const l0 = 885, t0 = th(l0);
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Courbe de la température d’un corps chaud en fonction de la longueur d’onde de son maximum : on part de la longueur d’onde sur l’axe horizontal, on monte jusqu’à la courbe, puis on lit la température sur l’axe vertical, en degrés Celsius">
        <L2 x1="44" y1="130" x2="288" y2="130" c={ENCRE} w="2"/><L2 x1="44" y1="20" x2="44" y2="130" c={ENCRE} w="2"/>
        {[400, 600, 800, 1000].map(l => <g key={l}><L2 x1={X(l)} y1="130" x2={X(l)} y2="135" c={ENCRE} w="2"/><text x={X(l)} y="150" textAnchor="middle" fontSize="12.5" fill={ENCRE}>{l}</text></g>)}
        {[4000, 8000].map(t => <g key={t}><L2 x1="39" y1={Y(t)} x2="44" y2={Y(t)} c={ENCRE} w="2"/><text x="36" y={Y(t) + 4} textAnchor="end" fontSize="12.5" fill={ENCRE}>{t}</text></g>)}
        <polyline points={pts.join(' ')} fill="none" stroke={VERT} strokeWidth="3.5"/>
        <L2 x1={X(l0)} y1="130" x2={X(l0)} y2={Y(t0)} c={ORANGE} w="2.2" dash="5 4"/>
        <L2 x1={X(l0)} y1={Y(t0)} x2="44" y2={Y(t0)} c={ORANGE} w="2.2" dash="5 4"/>
        <circle cx={X(l0)} cy={Y(t0)} r="4.5" fill={ORANGE}/>
        <text x={X(l0) - 22} y="126" fontSize="13" fontWeight="800" fill={ORANGE}>①</text>
        <text x={X(l0) + 8} y={Y(t0) - 8} fontSize="13" fontWeight="800" fill={ORANGE}>②</text>
        <text x="52" y={Y(t0) - 6} fontSize="13" fontWeight="800" fill={ORANGE}>③</text>
        <text x="166" y="172" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>λ du maximum (nm)</text>
        <text x="44" y="14" fontSize="12.5" fontWeight="700" fill={ENCRE}>θ (°C)</text>
        <text x="150" y="192" textAnchor="middle" fontSize="12.5" fill={GRIS}>① λ du max → ② courbe → ③ lire θ</text>
      </svg>
      <Formule><msub><mi>λ</mi><mtext>max</mtext></msub><mo>×</mo><mi>T</mi><mo>≈</mo><mn>2,898</mn><mo>×</mo><msup><mn>10</mn><mn>6</mn></msup><mtext> nm·K</mtext></Formule>
      <ul style={liste}>
        <li><em>Plus λ du maximum est petite, plus le corps est chaud.</em></li>
        <li><strong>Exemple</strong> : maximum à 885 nm → T ≈ 3 275 K, soit θ ≈ 3 000 °C (T en K = θ en °C + 273).</li>
        <li><strong>Piège</strong> : lire λ au lieu de la température ; mélanger K et °C.</li>
      </ul>
    </div>
  );
}

// ── Carte D : spectre continu / spectre de raies ──
const Bande = ({ y, h = 30, noir, raies, continu }) => (
  <g>
    <rect x="10" y={y} width="280" height={h} fill={noir ? '#000' : '#fff'} stroke={GRIS} strokeWidth="1.5"/>
    {continu && COUL.map((c, i) => <rect key={i} x={10 + i * 280 / COUL.length} y={y} width={280 / COUL.length + 0.6} height={h} fill={c}/>)}
    {raies && raies.map(l => <rect key={l} x={10 + (l - 400) / 400 * 280 - 2} y={y} width="4" height={h} fill={couleurNm(l)}/>)}
  </g>
);
export function FicheRaies() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Trois spectres : un spectre continu qui contient toutes les couleurs ; un spectre de raies de plusieurs radiations sur fond noir, polychromatique ; un spectre à une seule raie sur fond noir, monochromatique">
        <text x="10" y="16" fontSize="12.5" fontWeight="800" fill={BLEU}>corps dense chaud : continu</text>
        <Bande y={22} continu/>
        <text x="10" y="72" fontSize="12.5" fontWeight="800" fill={ORANGE}>gaz excité : raies, plusieurs radiations</text>
        <Bande y={78} noir raies={[405, 436, 546, 577]}/>
        <text x="10" y="128" fontSize="12.5" fontWeight="800" fill={VERT}>une seule raie : monochromatique</text>
        <Bande y={134} noir raies={[595]}/>
        <text x="150" y="188" textAnchor="middle" fontSize="12.5" fill={GRIS}>exemple de la 2ᵉ bande : lampe au mercure</text>
      </svg>
      <ul style={liste}>
        <li><em>Un gaz chaud et dilué n’émet que quelques radiations : des raies colorées sur fond noir.</em></li>
        <li><strong>Gaz sous faible pression</strong> excité par une décharge électrique → spectre de <strong>raies</strong>. <strong>Corps dense</strong> chaud → spectre <strong>continu</strong>.</li>
        <li><strong>Piège</strong> : confondre spectre continu et spectre de raies.</li>
      </ul>
    </div>
  );
}

// ── Carte E : identifier un gaz ──
export function FicheIdentifier() {
  const X = l => 10 + (l - 400) / 400 * 280;
  const inconnu = [405, 436, 546, 577];
  return (
    <div>
      <svg viewBox="0 0 300 210" style={svgStyle} role="img" aria-label="Pour identifier un gaz, on compare les raies de son spectre à celles de gaz de référence : le gaz inconnu a les mêmes raies que le mercure et pas celles de l’hélium, donc c’est du mercure">
        <text x="10" y="16" fontSize="12.5" fontWeight="800" fill={ENCRE}>gaz inconnu</text>
        <Bande y={22} noir raies={inconnu}/>
        <text x="10" y="76" fontSize="12.5" fontWeight="800" fill={ROUGE}>hélium : ≠</text>
        <Bande y={82} noir raies={[448, 502, 588, 667, 708]}/>
        <text x="10" y="136" fontSize="12.5" fontWeight="800" fill={VERT}>mercure : toutes coïncident ✓</text>
        <Bande y={142} noir raies={inconnu}/>
        {inconnu.map(l => <L2 key={l} x1={X(l)} y1="82" x2={X(l)} y2="112" c="#ffffff" w="1.5" dash="3 3"/>)}
        <text x="150" y="196" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={VERT}>→ c’est du mercure</text>
      </svg>
      <ul style={liste}>
        <li><em>Les raies sont la carte d’identité d’un élément chimique : même gaz, mêmes raies.</em></li>
        <li><strong>Méthode</strong> : relever les longueurs d’onde des raies, les comparer au tableau des spectres, garder le gaz dont <strong>toutes</strong> les raies coïncident.</li>
        <li><strong>Piège</strong> : se fier à une seule raie : deux gaz peuvent en avoir de voisines.</li>
      </ul>
    </div>
  );
}

// ── Carte F : bilan ──
export function FicheBilanSpec() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Bilan : le visible va de 400 à 800 nanomètres ; un corps chaud donne un spectre continu dont le maximum se rapproche du violet quand la température monte ; un gaz excité donne un spectre de raies, carte d’identité de l’élément ; on repère toujours les longueurs d’onde en nanomètres">
        <Case y={4} t1="visible : 400 à 800 nm" t2="UV en dessous, IR au-dessus" c={BLEU}/>
        <Bas y={48}/>
        <Case y={62} t1="corps chaud : spectre continu" t2="plus chaud → maximum vers le violet" c={ORANGE}/>
        <Bas y={106}/>
        <Case y={120} t1="gaz excité : spectre de raies" t2="carte d’identité de l’élément" c={VERT}/>
        <text x="150" y="184" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>on lit λ en nm, on compare, on conclut</text>
        <text x="150" y="200" textAnchor="middle" fontSize="12.5" fill={GRIS}>(T en K ou en °C : attention à l’unité)</text>
      </svg>
      <ul style={liste}>
        <li><em>Continu pour un corps chaud, raies pour un gaz : deux spectres, deux informations (température, composition).</em></li>
        <li><strong>Pièges</strong> : croire qu’un objet « froid » n’émet rien ; oublier l’unité de la température.</li>
      </ul>
    </div>
  );
}
