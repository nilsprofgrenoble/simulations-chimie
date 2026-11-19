// Cartes « À retenir » de la simulation CLHP (sim 12, BTS MDC). Chaque carte est posée UNE ÉTAPE après la question qu'elle conclut.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Case = ({ x, y, w = 84, h = 38, children, c = BLEU, fond = '#e8f1fa' }) => <g><rect x={x} y={y} width={w} height={h} rx="6" fill={fond} stroke={c} strokeWidth="2"/><text x={x + w / 2} y={y + h / 2 + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={c}>{children}</text></g>;
// pic gaussien : chemin du tracé
const pic = (c, h, s, base) => { const pts = []; for (let x = c - 4 * s; x <= c + 4 * s; x += 3) pts.push(`${x},${(base - h * Math.exp(-0.5 * ((x - c) / s) ** 2)).toFixed(1)}`); return pts.join(' '); };

// ── Carte A : la chaîne de la CLHP (posée sur « Injecter et regarder ») ──
export function FicheChaine() {
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Chaîne d'une CLHP : l'éluant est poussé par la pompe, avec son manomètre, l'injecteur introduit l'échantillon, la colonne dans son four sépare les composés, le détecteur UV les repère et le signal trace le chromatogramme">
        <Case x={8} y={10}>Éluant</Case><Case x={108} y={10}>Pompe</Case><Case x={208} y={10}>Injecteur</Case>
        <Arr x1={94} y1={29} x2={106} y2={29} w={2.4}/><Arr x1={194} y1={29} x2={206} y2={29} w={2.4}/>
        <Arr x1={250} y1={52} x2={250} y2={82} w={2.4}/>
        <Case x={208} y={84} c={VERT} fond="#dcfce7">Colonne</Case><Case x={108} y={84} c={ORANGE} fond="#ffedd5">Détecteur</Case><Case x={8} y={84} c={GRIS} fond="#f1f5f9">Signal</Case>
        <Arr x1={206} y1={103} x2={194} y2={103} w={2.4}/><Arr x1={106} y1={103} x2={94} y2={103} w={2.4}/>
        <T x={50} y={64} a="middle" c={GRIS}>eau / ACN</T><T x={150} y={64} a="middle" c={GRIS}>+ manomètre</T>
        <T x={250} y={140} a="middle" c={GRIS}>dans un four</T><T x={150} y={140} a="middle" c={GRIS}>UV</T><T x={50} y={140} a="middle" c={GRIS}>chromatogramme</T>
      </svg>
      <ul style={liste}>
        <li><em>Pompe → injecteur → colonne → détecteur : l’échantillon est injecté juste avant la colonne.</em></li>
        <li><strong>Pompe :</strong> elle impose le débit ; le manomètre lit la pression, signe de santé du circuit.</li>
        <li><strong>Détecteur UV :</strong> hauteur ou aire du pic ↔ quantité de composé.</li>
      </ul>
    </div>
  );
}

// ── Carte B : phase inverse, logP et temps de rétention (posée sur « Identifier un pic ») ──
export function FichePhaseInverse() {
  const base = 132, pics = [[60, 50, 'caféine', 40, '−0,13'], [150, 62, 'phénol', 147, '1,48'], [240, 80, 'benzophénone', 260, '3,18']];
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Plus le logP d'un composé est élevé, plus il est apolaire, plus il est retenu par la phase C18 et plus son pic sort tard : caféine, puis phénol, puis benzophénone">
        <T x={8} y={14} c={GRIS}>polaire</T><T x={150} y={14} a="middle" c={ORANGE} w={800}>logP croissant</T><T x={292} y={14} a="end" c={GRIS}>apolaire</T>
        <Arr x1={8} y1={26} x2={292} y2={26} c={GRIS} w={2}/>
        {pics.map(([cx, h, n, xd, lp]) => <g key={n}>
          <circle cx={xd} cy="26" r="5" fill={ORANGE}/><T x={xd} y={46} a="middle" c={ORANGE} w={700}>{lp}</T>
          <line x1={xd} y1="52" x2={cx} y2={base - h - 4} stroke={GRIS} strokeWidth="1.6" strokeDasharray="3 4"/>
          <polyline points={pic(cx, h, 11, base)} fill="none" stroke={BLEU} strokeWidth="2.6"/>
          <T x={cx} y={152} a="middle" w={700}>{n}</T></g>)}
        <line x1="8" y1={base} x2="292" y2={base} stroke={GRIS} strokeWidth="2"/>
        <T x={150} y={170} a="middle" c={GRIS}>temps de rétention →</T>
      </svg>
      <Formule><msup><mi>k</mi><mo>′</mo></msup><mo>=</mo><mfrac><mrow><msub><mi>t</mi><mtext>R</mtext></msub><mo>−</mo><msub><mi>t</mi><mn>0</mn></msub></mrow><msub><mi>t</mi><mn>0</mn></msub></mfrac></Formule>
      <ul style={liste}>
        <li><em>Phase C18 apolaire : plus un composé est apolaire (logP élevé), plus il est retenu et plus il sort tard.</em></li>
        <li><strong>Éluant :</strong> plus il y a d’acétonitrile, plus l’éluant est fort : k′ plus petit, tout sort plus vite.</li>
        <li><strong>Limite du modèle :</strong> seul le logP classe les composés ; en réalité liaisons hydrogène et ionisation peuvent inverser deux composés aux logP voisins.</li>
      </ul>
    </div>
  );
}

// ── Carte C : la résolution (posée sur « Séparer deux composés proches ») ──
export function FicheResolution() {
  const base = 118, c1 = 105, c2 = 185, s = 13, h = 70, dw = 1.1775 * s;
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Deux pics de temps de rétention tR1 et tR2 et de largeurs à mi-hauteur W½ ; la résolution compare l'écart des temps à la somme des largeurs ; échelle : inférieure à 1 superposés, de 1 à 1,5 partiellement séparés, supérieure à 1,5 séparés">
        <polyline points={pic(c1, h, s, base)} fill="none" stroke={BLEU} strokeWidth="2.8"/><polyline points={pic(c2, h, s, base)} fill="none" stroke={ORANGE} strokeWidth="2.8"/>
        <line x1="8" y1={base} x2="292" y2={base} stroke={GRIS} strokeWidth="2"/>
        <line x1={c1} y1={base - h} x2={c1} y2={base} stroke={GRIS} strokeWidth="1.4" strokeDasharray="3 3"/><line x1={c2} y1={base - h} x2={c2} y2={base} stroke={GRIS} strokeWidth="1.4" strokeDasharray="3 3"/>
        <T x={c1} y={base - h - 8} a="middle" c={BLEU} w={800}>tR1</T><T x={c2} y={base - h - 8} a="middle" c={ORANGE} w={800}>tR2</T>
        <line x1={c1 - dw} y1={base - h / 2} x2={c1 + dw} y2={base - h / 2} stroke={BLEU} strokeWidth="2.4"/><T x={c1 - dw - 4} y={base - h / 2 + 4} a="end" c={BLEU} w={800}>W½</T>
        <line x1={c1} y1="132" x2={c2} y2="132" stroke={ENCRE} strokeWidth="2"/><line x1={c1} y1="127" x2={c1} y2="137" stroke={ENCRE} strokeWidth="2"/><line x1={c2} y1="127" x2={c2} y2="137" stroke={ENCRE} strokeWidth="2"/>
        <T x={145} y={152} a="middle" w={700}>écart des tR</T>
        <rect x="8" y="162" width="92" height="26" fill="#fecaca"/><rect x="100" y="162" width="100" height="26" fill="#fed7aa"/><rect x="200" y="162" width="92" height="26" fill="#bbf7d0"/>
        <T x={54} y={180} a="middle" c={ROUGE} w={800}>Rs &lt; 1</T><T x={150} y={180} a="middle" c={ORANGE} w={800}>1 à 1,5</T><T x={246} y={180} a="middle" c={VERT} w={800}>Rs ≥ 1,5</T>
      </svg>
      <Formule><msub><mi>R</mi><mtext>s</mtext></msub><mo>=</mo><mn>1,18</mn><mo>×</mo><mfrac><mrow><msub><mi>t</mi><mtext>R2</mtext></msub><mo>−</mo><msub><mi>t</mi><mtext>R1</mtext></msub></mrow><mrow><msub><mi>W</mi><mtext>½,1</mtext></msub><mo>+</mo><msub><mi>W</mi><mtext>½,2</mtext></msub></mrow></mfrac></Formule>
      <ul style={liste}>
        <li><em>Pics séparés quand R<sub>s</sub> ≥ 1,5 : l’écart des t<sub>R</sub> est assez grand devant les largeurs.</em></li>
        <li><strong>Hypothèse :</strong> pics gaussiens (W<sub>½</sub> = 2,35 σ, d’où le facteur 1,18). R<sub>s</sub> est sans unité ; t<sub>R</sub> et W<sub>½</sub> dans la même unité.</li>
        <li><strong>Pour améliorer R<sub>s</sub> :</strong> diminuer le % d’acétonitrile, tant que le dernier pic sort dans un temps raisonnable.</li>
      </ul>
    </div>
  );
}

// ── Carte D : isocratique ou gradient (posée sur « Débit et pression ») ──
export function FicheGradient() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Deux graphiques du pourcentage d'acétonitrile en fonction du temps : en isocratique la composition reste constante, en gradient elle augmente progressivement">
        <T x={76} y={16} a="middle" c={BLEU} w={800}>isocratique</T><T x={224} y={16} a="middle" c={ORANGE} w={800}>gradient</T>
        <T x={8} y={36} c={GRIS}>% ACN</T><T x={156} y={36} c={GRIS}>% ACN</T>
        <polyline points="12,44 12,116 144,116" fill="none" stroke={GRIS} strokeWidth="2"/><polyline points="160,44 160,116 292,116" fill="none" stroke={GRIS} strokeWidth="2"/>
        <line x1="12" y1="80" x2="144" y2="80" stroke={BLEU} strokeWidth="3.4"/><line x1="160" y1="106" x2="292" y2="54" stroke={ORANGE} strokeWidth="3.4"/>
        <T x={144} y={134} a="end" c={GRIS}>temps →</T><T x={292} y={134} a="end" c={GRIS}>temps →</T>
        <T x={76} y={154} a="middle">polarités voisines</T><T x={224} y={154} a="middle">polarités très étalées</T>
        <T x={150} y={172} a="middle" c={GRIS}>gradient : éluant faible, puis fort</T>
      </svg>
      <ul style={liste}>
        <li><em>Isocratique : composition constante ; gradient : le % d’acétonitrile augmente pendant l’analyse.</em></li>
        <li><strong>Pourquoi :</strong> en isocratique, ce qui sépare les premiers pics retarde trop les derniers. En gradient, les premiers sont séparés dans un éluant faible, les derniers décrochés par un éluant fort.</li>
        <li><strong>Critère de réussite :</strong> R<sub>s</sub> ≥ 1,5 pour <strong>toutes</strong> les paires <em>et</em> un dernier pic sorti dans un temps raisonnable.</li>
      </ul>
    </div>
  );
}

// ── Carte E : débit, pression et temps de rétention (posée sur « Le bilan » du parcours 1) ──
export function FicheDebit() {
  const tr = []; for (let u = 40; u <= 120; u += 4) tr.push(`${168 + u},${(120 - 3080 / u).toFixed(1)}`);
  return (
    <div>
      <svg viewBox="0 0 300 170" style={svgStyle} role="img" aria-label="Quand on double le débit, la pression double (droite passant par l'origine) et le temps de rétention est divisé par deux (courbe décroissante)">
        <T x={80} y={16} a="middle" c={ORANGE} w={800}>pression</T><T x={224} y={16} a="middle" c={BLEU} w={800}>temps de rétention</T>
        <polyline points="24,36 24,120 136,120" fill="none" stroke={GRIS} strokeWidth="2"/><polyline points="168,36 168,120 292,120" fill="none" stroke={GRIS} strokeWidth="2"/>
        <line x1="24" y1="120" x2="136" y2="48" stroke={ORANGE} strokeWidth="3.2"/>
        <polyline points={tr.join(' ')} fill="none" stroke={BLEU} strokeWidth="3.2"/>
        <circle cx="68" cy="91.7" r="5" fill={ENCRE}/><circle cx="112" cy="63.4" r="5" fill={ENCRE}/>
        <circle cx="212" cy="50" r="5" fill={ENCRE}/><circle cx="256" cy="85" r="5" fill={ENCRE}/>
        <T x={80} y={138} a="middle" c={GRIS}>débit →</T><T x={230} y={138} a="middle" c={GRIS}>débit →</T>
        <T x={80} y={158} a="middle" c={ORANGE} w={800}>Q × 2 ⇒ P × 2</T><T x={224} y={158} a="middle" c={BLEU} w={800}>Q × 2 ⇒ tR ÷ 2</T>
      </svg>
      <ul style={liste}>
        <li><em>La pression est proportionnelle au débit ; le temps de rétention lui est inversement proportionnel.</em></li>
        <li><strong>Pratique :</strong> on note la pression de référence de la méthode : un écart à débit identique signale un problème.</li>
        <li><strong>Limite :</strong> au-delà de la pression maximale de l’appareil, la pompe s’arrête.</li>
      </ul>
    </div>
  );
}

// ── Carte F : diagnostiquer une panne (posée sur « Le bilan » du parcours 2) ──
export function FichePannes() {
  const lignes = [['pression ↑↑ seule', 'encrassement', ROUGE], ['pression ↓, tR ↑', 'fuite', BLEU], ['pression oscille', 'bulle d’air', VERT], ['tR derniers pics ↑', 'éluant mal préparé', ORANGE], ['pics larges, Rs ↓', 'colonne vieillie', '#7c3aed'], ['pics petits, bruit ↑', 'lampe', GRIS]];
  return (
    <div>
      <svg viewBox="0 0 300 236" style={svgStyle} role="img" aria-label="Six symptômes et leur cause probable : pression qui monte seule, encrassement ; pression qui baisse avec des temps de rétention plus longs, fuite ; pression qui oscille, bulle d'air ; derniers pics retardés, éluant mal préparé ; pics larges, colonne vieillie ; pics petits et bruit, lampe">
        <T x={12} y={16} c={GRIS} w={800}>ce qu’on observe</T><T x={166} y={16} c={GRIS} w={800}>cause probable</T>
        {lignes.map(([sy, ca, c], i) => { const y = 24 + 32 * i; return <g key={sy}><rect x="4" y={y} width="292" height="28" rx="5" fill={i % 2 ? '#f1f5f9' : '#e8f1fa'}/><rect x="4" y={y} width="6" height="28" rx="3" fill={c}/>
          <T x={16} y={y + 19}>{sy}</T><T x={150} y={y + 19} c={GRIS} w={800}>→</T><T x={166} y={y + 19} c={c} w={800}>{ca}</T></g>; })}
        <T x={150} y={230} a="middle" c={ENCRE} w={800}>on lit : pression · tR · pics · hauteur</T>
      </svg>
      <ul style={liste}>
        <li><em>On compare toujours la journée à la méthode validée, dans cet ordre : pression, puis t<sub>R</sub>, puis forme des pics et R<sub>s</sub>, puis hauteur et bruit.</em></li>
        <li><strong>Le premier indicateur hors tolérance</strong> oriente vers la cause ; on ne devine pas.</li>
        <li><strong>Distinction clé :</strong> fuite et éluant mal préparé retardent les t<sub>R</sub> ; seule la fuite fait baisser la pression.</li>
      </ul>
    </div>
  );
}
