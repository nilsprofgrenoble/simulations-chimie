// Cartes « À retenir » de la simulation « Paramètres de solubilité de Hansen » (sim 4, BTS MDC).
// Chaque carte est posée UNE ÉTAPE après la question qu'elle conclut. Schémas dans un cadre de 300 de large,
// textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320. Les valeurs de RED sont calculées par la simulation et passées en paramètres.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#2563eb', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', VIOLET = '#7c3aed', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const f2 = v => v.toFixed(2).replace('.', ',');
const Ecart = ({ t, facteur }) => (
  <mrow>{facteur ? <mn>4</mn> : null}<msup><mrow><mo stretchy="false">(</mo><mi>Δ</mi><msub><mi>δ</mi><mi>{t}</mi></msub><mo stretchy="false">)</mo></mrow><mn>2</mn></msup></mrow>
);

// ── Carte A : la distance Ra (posée sur « La sphère et le RED ») ──
export function FicheRa() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Plan δp–δh : le polymère P et un solvant s sont deux points ; leur distance Ra est l'hypoténuse d'un triangle dont les côtés sont les écarts Δδp et Δδh">
        <line x1="24" y1="176" x2="24" y2="14" stroke={GRIS} strokeWidth="2"/><polygon points="24,8 19,18 29,18" fill={GRIS}/>
        <line x1="24" y1="176" x2="288" y2="176" stroke={GRIS} strokeWidth="2"/><polygon points="294,176 284,171 284,181" fill={GRIS}/>
        <T x={34} y={18} c={GRIS} w={700}>δh</T><T x={270} y={170} c={GRIS} w={700}>δp</T>
        <line x1="84" y1="132" x2="214" y2="132" stroke={GRIS} strokeWidth="1.8" strokeDasharray="5 4"/><line x1="214" y1="132" x2="214" y2="52" stroke={GRIS} strokeWidth="1.8" strokeDasharray="5 4"/>
        <line x1="84" y1="132" x2="214" y2="52" stroke={ORANGE} strokeWidth="3.4" strokeLinecap="round"/>
        <circle cx="84" cy="132" r="7" fill={BLEU}/><circle cx="214" cy="52" r="7" fill={VERT}/>
        <T x={60} y={156} c={BLEU} w={800}>solvant s</T><T x={170} y={34} c={VERT} w={800}>polymère P</T>
        <T x={116} y={92} c={ORANGE} w={800} a="end">Ra</T>
        <T x={149} y={150} a="middle">Δδp</T><T x={222} y={96}>Δδh</T>
      </svg>
      <Formule><mi>Ra</mi><mo>=</mo><msqrt><Ecart t="d" facteur/><mo>+</mo><Ecart t="p"/><mo>+</mo><Ecart t="h"/></msqrt></Formule>
      <ul style={liste}>
        <li><em>Ra est la « distance » entre un solvant s et le polymère P dans l’espace de Hansen : petit Ra, molécules semblables.</em></li>
        <li><strong>Unité :</strong> MPa<sup>½</sup>. Le dessin montre le plan δp–δh ; Δδd, avec son facteur 4 empirique, s’ajoute dans la racine.</li>
        <li><strong>Pièges :</strong> oublier le facteur 4, ou la racine carrée finale.</li>
      </ul>
    </div>
  );
}

// ── Carte B : la sphère de solubilité et le RED (posée sur « Tester les quatre solvants ») ──
export function FicheSphere() {
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Sphère de solubilité de rayon R0 centrée sur le polymère : un solvant dans la sphère a un RED inférieur à 1, sur la frontière RED égal 1, hors de la sphère RED supérieur à 1">
        <circle cx="72" cy="95" r="56" fill="#dbeafe" stroke={BLEU} strokeWidth="2.5"/>
        <line x1="72" y1="95" x2="128" y2="95" stroke={ORANGE} strokeWidth="2.6"/>
        <circle cx="72" cy="95" r="4.5" fill={ENCRE}/><T x={64} y={91} a="end" w={700}>P</T><T x={100} y={88} c={ORANGE} w={800} a="middle">R₀</T>
        <circle cx="50" cy="116" r="6.5" fill={VERT}/><circle cx="108" cy="52" r="6.5" fill="#f59e0b"/><circle cx="120" cy="176" r="6.5" fill={ROUGE}/>
        <circle cx="152" cy="54" r="6.5" fill={VERT}/><T x={164} y={59} c={VERT} w={800}>RED &lt; 1 : solvant</T>
        <circle cx="152" cy="96" r="6.5" fill="#f59e0b"/><T x={164} y={101} c={ORANGE} w={800}>RED = 1 : frontière</T>
        <circle cx="152" cy="138" r="6.5" fill={ROUGE}/><T x={164} y={143} c={ROUGE} w={800}>RED &gt; 1 : hors sphère</T>
      </svg>
      <Formule><mi>RED</mi><mo>=</mo><mfrac><mi>Ra</mi><msub><mi>R</mi><mn>0</mn></msub></mfrac><mspace width="1.5em"/><mtext>sans unité</mtext></Formule>
      <ul style={liste}>
        <li><em>Un solvant dans la sphère du polymère le dissout : RED &lt; 1.</em></li>
        <li><strong>R<sub>0</sub></strong> est le rayon de la sphère : 9,0 MPa<sup>½</sup> pour la nitrocellulose du TP. On compare Ra à R<sub>0</sub> pour décider.</li>
      </ul>
    </div>
  );
}

// ── Carte C : les limites de la prévision (posée sur « Le bilan » du parcours 1) ──
export function FicheLimites({ ea, ba, ipa, etoh, baHansen }) {
  const x = r => 20 + 162.5 * r;
  const pts = [['AE', ea, 82], ['AB', ba, 100], ['IPA', ipa, 82], ['EtOH', etoh, 100]];
  return (
    <div>
      <svg viewBox="0 0 300 142" style={svgStyle} role="img" aria-label="Axe du RED : en dessous de 0,8 le solvant dissout, entre 0,8 et 1,2 la prévision est incertaine, au-dessus de 1,2 le liquide ne dissout pas ; positions des quatre solvants du vernis">
        <T x={85} y={30} a="middle" c={VERT} w={800}>solvant</T><T x={172} y={30} a="middle" c={ORANGE} w={800}>incertain</T><T x={254} y={30} a="middle" c={ROUGE} w={800}>non-solvant</T>
        <rect x={x(0)} y="38" width={x(0.8) - x(0)} height="24" fill="#bbf7d0"/><rect x={x(0.8)} y="38" width={x(1.2) - x(0.8)} height="24" fill="#fed7aa"/><rect x={x(1.2)} y="38" width={x(1.6) - x(1.2)} height="24" fill="#fecaca"/>
        <line x1={x(1)} y1="34" x2={x(1)} y2="66" stroke={ENCRE} strokeWidth="2" strokeDasharray="4 3"/>
        {pts.map(([n, r, y]) => <g key={n}><line x1={x(r)} y1="50" x2={x(r)} y2={y - 14} stroke={GRIS} strokeWidth="1.5"/><circle cx={x(r)} cy="50" r="5.5" fill={ENCRE}/><T x={x(r)} y={y} a="middle" w={700}>{n} {f2(r)}</T></g>)}
        <T x={x(1)} y={126} a="middle" c={ENCRE} w={800}>RED = 1</T>
      </svg>
      <ul style={liste}>
        <li><em>Loin de 1 (RED &lt; 0,8 ou &gt; 1,2), la prévision est fiable ; près de 1, elle est incertaine.</em></li>
        <li><strong>Les paramètres dépendent du grade et de la source :</strong> pour l’acétate de butyle (AB), RED = {f2(ba)} avec les données du TP et {f2(baHansen)} avec celles de Hansen.</li>
        <li><strong>Conclusion :</strong> le RED donne une tendance ; seule une mesure au laboratoire tranche.</li>
      </ul>
    </div>
  );
}

// ── Carte D : le point d'un mélange (posée sur « Ce mélange dissout-il la nitrocellulose ? ») ──
export function FicheMelange() {
  const x = p => 40 + 2.2 * p;
  return (
    <div>
      <svg viewBox="0 0 300 170" style={svgStyle} role="img" aria-label="Le point d'un mélange d'acétate d'éthyle et d'éthanol est sur le segment qui joint les deux solvants, d'autant plus près de l'éthanol qu'il en contient davantage ; exemple à 20 % d'éthanol : δh vaut environ 9,6">
        <T x={8} y={20} c={BLEU} w={800}>acétate d’éthyle</T><T x={8} y={38}>δh = 7,2</T>
        <T x={292} y={20} a="end" c={ROUGE} w={800}>éthanol</T><T x={292} y={38} a="end">δh = 19,4</T>
        <line x1={x(0)} y1="96" x2={x(100)} y2="96" stroke={GRIS} strokeWidth="3"/>
        {[0, 20, 40, 60, 80, 100].map(p => <g key={p}><line x1={x(p)} y1="90" x2={x(p)} y2="102" stroke={GRIS} strokeWidth="2"/><T x={x(p)} y={120} a="middle" c={GRIS}>{p} %</T></g>)}
        <circle cx={x(0)} cy="96" r="7" fill={BLEU}/><circle cx={x(100)} cy="96" r="7" fill={ROUGE}/><circle cx={x(20)} cy="96" r="8" fill="#f59e0b" stroke={ENCRE} strokeWidth="2"/>
        <T x={x(20) + 4} y={72} c={ORANGE} w={800}>20 % d’éthanol</T>
        <T x={150} y={142} a="middle" c={GRIS}>pourcentage d’éthanol, en volume</T>
        <T x={150} y={162} a="middle" c={ORANGE} w={800}>δh = 0,80 × 7,2 + 0,20 × 19,4 ≈ 9,6</T>
      </svg>
      <Formule><msub><mi>δ</mi><mtext>mél</mtext></msub><mo>=</mo><munder><mo>∑</mo><mi>i</mi></munder><msub><mi>φ</mi><mi>i</mi></msub><msub><mi>δ</mi><mi>i</mi></msub></Formule>
      <ul style={liste}>
        <li><em>Un mélange a ses propres δd, δp, δh : la moyenne de ceux des solvants, pondérée par leurs fractions volumiques φ<sub>i</sub> (Σ φ<sub>i</sub> = 1).</em></li>
        <li><strong>Méthode :</strong> calculer les trois moyennes, puis Ra et RED du mélange.</li>
        <li><strong>Hypothèse :</strong> moyenne pondérée par les volumes ; un mélange de deux liquides peut se placer dans la sphère.</li>
      </ul>
    </div>
  );
}

// ── Carte E : une marge de sécurité (posée sur « Le bilan » du parcours 2) ──
export function FicheMarge({ lim }) {
  const x = p => 20 + 2.6 * p;
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label={`Part d'éthanol dans l'acétate d'éthyle : le mélange reste dans la sphère jusqu'à environ ${lim} %, mais on formule nettement en dessous, avec une marge de sécurité`}>
        <rect x={x(0)} y="40" width={x(lim - 12) - x(0)} height="26" fill="#bbf7d0"/><rect x={x(lim - 12)} y="40" width={x(lim) - x(lim - 12)} height="26" fill="#fed7aa"/><rect x={x(lim)} y="40" width={x(100) - x(lim)} height="26" fill="#fecaca"/>
        <T x={x((lim - 12) / 2)} y={32} a="middle" c={VERT} w={800}>on formule ici</T>
        <T x={292} y={32} a="end" c={ROUGE} w={800}>hors sphère</T>
        <line x1={x(lim)} y1="36" x2={x(lim)} y2="72" stroke={ENCRE} strokeWidth="2.4"/>
        <T x={x(lim - 6) - 6} y={86} a="end" c={ENCRE} w={800}>limite du modèle : {lim} %</T>
        <line x1={x(lim - 6)} y1="68" x2={x(lim - 6)} y2="100" stroke={ORANGE} strokeWidth="2"/><T x={x(lim - 6)} y={114} a="middle" c={ORANGE} w={800}>marge</T>
        <T x={x(0)} y={132} c={GRIS}>0 %</T><T x={x(100)} y={132} a="end" c={GRIS}>100 % d’éthanol</T>
      </svg>
      <ul style={liste}>
        <li><em>Être dans la sphère au départ ne suffit pas : on garde une marge sous la limite du modèle.</em></li>
        <li><strong>Deux raisons :</strong> la prévision est incertaine près de RED = 1, et la composition change pendant le séchage.</li>
        <li><strong>Exemple :</strong> la limite est d’environ {lim} % d’éthanol dans l’acétate d’éthyle : on formule nettement en dessous.</li>
      </ul>
    </div>
  );
}

// ── Carte F : qui reste en dernier pendant le séchage (posée sur « Et le blanchiment ? ») ──
export function FicheSechage({ redBa }) {
  const col = [[30, 100, [['EtOH', 55, ROUGE], ['AE', 30, BLEU], ['AB', 15, VIOLET]]], [92, 70, [['EtOH', 38, ROUGE], ['AE', 8, BLEU], ['AB', 24, VIOLET]]], [154, 42, [['EtOH', 6, ROUGE], ['AE', 0, BLEU], ['AB', 36, VIOLET]]]];
  const base = 136;
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label={`Schéma de principe du séchage : les solvants volatils (acétate d'éthyle, éthanol) partent les premiers, l'acétate de butyle, le moins volatil, reste en dernier ; il dissout le polymère puisque son RED vaut ${f2(redBa)}`}>
        <T x={30} y={18} c={GRIS} w={700}>évaporation</T><line x1="104" y1="13" x2="190" y2="13" stroke={GRIS} strokeWidth="2.4"/><polygon points="196,13 186,8 186,18" fill={GRIS}/>
        {col.map(([x0, h, parts], i) => { let y = base; return <g key={i}>{parts.filter(p => p[1] > 0).map(([n, v, c]) => { const hh = h * v / (parts.reduce((s, p) => s + p[1], 0)); y -= hh; return <rect key={n} x={x0} y={y} width="48" height={hh} fill={c} stroke="#fff" strokeWidth="1"/>; })}
          <T x={x0 + 24} y={154} a="middle" c={GRIS} w={700}>{['départ', 'milieu', 'fin'][i]}</T></g>; })}
        {[['AE', BLEU, 70], ['EtOH', ROUGE, 92], ['AB', VIOLET, 114]].map(([n, c, y]) => <g key={n}><rect x="224" y={y - 11} width="14" height="14" fill={c}/><T x={244} y={y + 1}>{n}</T></g>)}
        <T x={150} y={176} a="middle" c={VIOLET} w={800}>en dernier : AB, RED = {f2(redBa)} &lt; 1</T>
        <T x={150} y={192} a="middle" c={GRIS}>schéma de principe, sans échelle</T>
      </svg>
      <ul style={liste}>
        <li><em>Le solvant le moins volatil (pression de vapeur la plus faible) reste en dernier dans le film.</em></li>
        <li><strong>Règle :</strong> ce dernier solvant doit être un vrai solvant du polymère (RED &lt; 1), sinon la nitrocellulose précipite avant la formation du film. Un solvant lent allonge le séchage : il en faut juste assez.</li>
        <li><strong>AE</strong> : acétate d’éthyle ; <strong>AB</strong> : acétate de butyle ; <strong>EtOH</strong> : éthanol.</li>
        <li><strong>Hypothèse :</strong> pressions de vapeur des solvants purs ; conclusion qualitative seulement (l’acétate d’éthyle et l’éthanol forment un azéotrope).</li>
      </ul>
    </div>
  );
}

// ── Carte G : ce que le modèle ne prévoit pas (posée sur « Le bilan » du parcours 3) ──
export function FicheModele() {
  const item = (x, y, l1, l2, c) => <g key={l1}><T x={x} y={y} c={c} w={800}>{l1}</T><T x={x} y={y + 16}>{l2}</T></g>;
  return (
    <div>
      <svg viewBox="0 0 300 162" style={svgStyle} role="img" aria-label="Ce que le modèle de Hansen prévoit : si un liquide dissout le polymère, les propriétés d'un mélange, le solvant qui reste en dernier ; ce qu'il ne prévoit pas : le blanchiment dû à l'humidité, la vitesse réelle du séchage, l'écart de grade du polymère">
        <rect x="6" y="6" width="140" height="150" rx="8" fill="#f0fdf4" stroke={VERT} strokeWidth="2"/><rect x="154" y="6" width="140" height="150" rx="8" fill="#fef2f2" stroke={ROUGE} strokeWidth="2"/>
        <T x={76} y={28} a="middle" c={VERT} w={800}>Il prévoit</T><T x={224} y={28} a="middle" c={ROUGE} w={800}>Il ne prévoit pas</T>
        {item(16, 54, 'RED : dissout', 'ou non ?', ENCRE)}{item(16, 94, 'mélange :', 'moyenne pondérée', ENCRE)}{item(16, 134, 'dernier solvant', 'du film', ENCRE)}
        {item(164, 54, 'humidité', '(blanchiment)', ENCRE)}{item(164, 94, 'vitesse réelle', 'du séchage', ENCRE)}{item(164, 134, 'écart de grade', 'du polymère', ENCRE)}
      </svg>
      <ul style={liste}>
        <li><em>Un modèle ne répond qu’aux questions pour lesquelles il est construit.</em></li>
        <li><strong>Blanchiment :</strong> l’évaporation refroidit le film, l’eau de l’air s’y condense, et l’eau est un non-solvant de la nitrocellulose : le RED ne le voit pas.</li>
        <li><strong>Donc :</strong> le modèle oriente la formulation, le laboratoire la valide.</li>
      </ul>
    </div>
  );
}
