// Schémas des cartes « À retenir » de la simulation 109 (TP de la chalcone : synthèse puis contrôle).
// viewBox de 300 de large, texte de 12,5 : lisible sur téléphone. Chaque carte est posée une étape après sa question.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', VIOLET = '#6d28d9', ENCRE = '#0f172a', TEAL = '#0e7490';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Axes = ({ x0 = 30, x1 = 290, y0 = 112, y1 = 22 }) => <g><line x1={x0} y1={y0} x2={x1} y2={y0} stroke={GRIS} strokeWidth="1.5"/><line x1={x0} y1={y0} x2={x0} y2={y1} stroke={GRIS} strokeWidth="1.5"/></g>;
const Tache = ({ cx, cy, o = 1 }) => <ellipse cx={cx} cy={cy} rx="10" ry="5.5" fill="#4c1d95" opacity={o}/>;

export const SchemaPhases = () => {
  const PH = [['S', 'fabriquer', '#2563eb'], ['I', 'récupérer', TEAL], ['P', 'nettoyer', VIOLET], ['C', 'vérifier', VERT]];
  return (
    <Svg h={152} aria="Quatre phases d'une synthèse en chaîne : synthèse (fabriquer), isolement (récupérer), purification (nettoyer), contrôle (vérifier)">
      {PH.map(([k, nom, c], i) => <g key={k}>
        <rect x={8 + i * 73} y="12" width="64" height="52" rx="8" fill="#fff" stroke={c} strokeWidth="3"/>
        <text x={40 + i * 73} y="48" textAnchor="middle" fontSize="26" fontWeight="800" fill={c}>{k}</text>
        <T x={40 + i * 73} y={84} a="middle" c={c} w={700}>{nom}</T>
        {i < 3 && <polygon points={`${73 + i * 73},34 ${81 + i * 73},38 ${73 + i * 73},42`} fill={GRIS}/>}
      </g>)}
      <T x={150} y={112} a="middle" c={GRIS}>synthèse → isolement → purification → contrôle</T>
      <T x={8} y={134} c={ROUGE} w={700}>la purification est facultative,</T>
      <T x={8} y={150} c={ROUGE} w={700}>le contrôle ne l’est jamais</T>
    </Svg>);
};

export const SchemaRendement = () => (
  <Svg h={210} aria="Deux réactifs A (2,0 mmol) et B (3,0 mmol) avec les coefficients 1 et 1 : A est limitant ; le rendement est la masse obtenue divisée par la masse théorique">
    <T x={8} y={16} w={700}>On compare des quantités de matière,</T><T x={8} y={32} w={700}>pas des masses</T>
    <rect x="30" y="80" width="40" height="50" fill="#2563eb" opacity="0.85"/><rect x="82" y="55" width="40" height="75" fill={TEAL} opacity="0.85"/>
    <line x1="14" y1="80" x2="140" y2="80" stroke={ROUGE} strokeWidth="2" strokeDasharray="4 3"/>
    <line x1="14" y1="130" x2="140" y2="130" stroke={GRIS} strokeWidth="1.5"/>
    <T x={50} y={148} a="middle" w={700}>A : 2,0</T><T x={102} y={148} a="middle" w={700}>B : 3,0</T><T x={76} y={164} a="middle" c={GRIS}>en mmol</T>
    <T x={152} y={72} c={ROUGE} w={700}>A est limitant</T><T x={152} y={90}>(coefficients 1 et 1)</T><T x={152} y={108}>x max = 2,0 mmol</T>
    <T x={8} y={188} w={700}>R = m obtenue ÷ m théorique</T><T x={8} y={205} c={GRIS}>jamais plus de 100 %</T>
  </Svg>);

export const SchemaSechage = () => (
  <Svg h={160} aria="La masse du produit diminue pendant le séchage à l'étuve puis devient constante : deux pesées successives sont identiques">
    <T x={8} y={16} w={700}>Sec = la masse ne bouge plus</T>
    <Axes x0={24} y0={112} y1={26}/>
    <polyline fill="none" stroke={BLEU} strokeWidth="3" points="44,34 84,66 124,86 164,94 204,96 244,96"/>
    {[[44, 34], [84, 66], [124, 86], [164, 94], [204, 96], [244, 96]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.5" fill={i > 3 ? VERT : BLEU}/>)}
    <rect x="190" y="84" width="68" height="24" rx="6" fill="none" stroke={VERT} strokeWidth="2.5"/>
    <T x={224} y={76} a="middle" c={VERT} w={700}>deux pesées égales</T>
    <T x={290} y={130} a="end" c={GRIS}>temps à l’étuve →</T>
    <T x={8} y={152} c={GRIS}>31,40 → 30,95 → 30,82 → 30,81 → 30,81 g</T>
  </Svg>);

export const SchemaRecristal = () => (
  <Svg h={146} aria="Solubilité dans l'éthanol selon la température : la chalcone est peu soluble à froid et très soluble à chaud, elle cristallise donc au refroidissement ; les impuretés restent dissoutes">
    <T x={8} y={16} w={700}>Solubilité dans l’éthanol</T>
    <Axes x0={30} x1={290} y0={112} y1={28}/>
    <path d="M40,104 C110,100 180,80 282,36" fill="none" stroke={ORANGE} strokeWidth="3"/>
    <path d="M40,70 C140,66 220,60 282,56" fill="none" stroke={VIOLET} strokeWidth="3" strokeDasharray="5 3"/>
    <T x={150} y={98} c={ORANGE} w={700}>chalcone</T><T x={44} y={60} c={VIOLET} w={700}>impuretés</T>
    <T x={34} y={132} c={GRIS}>froid : cristaux</T><T x={290} y={132} a="end" c={GRIS}>chaud : tout dissous</T>
  </Svg>);

export const SchemaTf = () => (
  <Svg h={168} aria="Un produit pur fond brusquement à la température de la littérature, 98 degrés ; un produit impur fond plus bas et sur un intervalle plus large">
    <T x={8} y={16} w={700}>Pur : fusion nette ; impur : basse et étalée</T>
    <T x={225} y={38} a="middle" c={VERT}>littérature ↓</T>
    <line x1="14" y1="84" x2="290" y2="84" stroke={GRIS} strokeWidth="1.5"/>
    <rect x="140" y="46" width="50" height="38" fill="#fecaca" stroke={ROUGE} strokeWidth="1.5"/><rect x="222" y="46" width="6" height="38" fill={VERT}/>
    <T x={165} y={104} a="middle" c={ROUGE} w={700}>impur : plus bas</T><T x={225} y={122} a="middle" c={VERT} w={700}>pur : 98 °C</T>
    <T x={14} y={104} c={GRIS}>Tf →</T>
    <T x={8} y={146} c={GRIS}>un solide pur a une Tf précise ;</T><T x={8} y={162} c={GRIS}>les impuretés l’abaissent et l’étalent</T>
  </Svg>);

export const SchemaRf = () => (
  <Svg h={164} aria="Plaque de CCM : le rapport frontal Rf est la distance d parcourue par la tache divisée par la distance D parcourue par le front de l'éluant, toutes deux depuis la ligne de dépôt">
    <rect x="20" y="12" width="96" height="140" fill="#ecfccb" stroke={GRIS} strokeWidth="2"/>
    <line x1="20" y1="132" x2="116" y2="132" stroke={ENCRE} strokeDasharray="4 3"/><line x1="20" y1="32" x2="116" y2="32" stroke={ROUGE} strokeWidth="2.5"/>
    <T x={26} y={27} c={ROUGE}>front</T><T x={26} y={148} c={GRIS}>dépôt</T>
    <Tache cx={68} cy={84}/>
    <Arr x1={136} y1={132} x2={136} y2={84} c={ORANGE}/><Arr x1={162} y1={132} x2={162} y2={32} c={ROUGE}/>
    <T x={122} y={112} c={ORANGE} w={800}>d</T><T x={168} y={84} c={ROUGE} w={800}>D</T>
    <T x={186} y={44} w={800}>Rf = d ÷ D</T>
    <T x={186} y={68}>d : tache</T><T x={186} y={86}>D : front</T><T x={186} y={104} c={GRIS}>depuis la ligne</T><T x={186} y={120} c={GRIS}>de dépôt</T>
    <T x={186} y={146} c={VERT} w={700}>0 &lt; Rf &lt; 1</T>
  </Svg>);

export const SchemaComparer = () => (
  <Svg h={164} aria="Plaque de CCM à quatre voies : la voie 1 du produit brut a une tache à la hauteur de la chalcone et une tache pâle à la hauteur de l'anisaldéhyde, donc une impureté">
    <rect x="16" y="12" width="170" height="140" fill="#ecfccb" stroke={GRIS} strokeWidth="2"/><line x1="16" y1="132" x2="186" y2="132" stroke={ENCRE} strokeDasharray="4 3"/>
    {[40, 78, 116, 154].map((x, i) => <T key={i} x={x} y={148} a="middle" w={700}>{i + 1}</T>)}
    <line x1="16" y1="96" x2="186" y2="96" stroke={VERT} strokeDasharray="3 3"/><line x1="16" y1="70" x2="186" y2="70" stroke={ROUGE} strokeDasharray="3 3"/>
    <Tache cx={40} cy={96}/><Tache cx={40} cy={70} o={0.4}/><Tache cx={78} cy={96}/><Tache cx={116} cy={70}/><Tache cx={154} cy={50}/>
    <T x={192} y={30} w={800}>Même hauteur</T><T x={192} y={46} w={800}>= même espèce</T>
    <T x={192} y={66} c={ROUGE} w={700}>impureté</T><T x={192} y={92} c={VERT} w={700}>chalcone</T>
    <T x={192} y={126} c={GRIS}>1 : produit brut</T><T x={192} y={144} c={GRIS}>2-4 : références</T>
  </Svg>);

export const SchemaEluant = () => (
  <Svg h={178} aria="Deux plaques de CCM : avec un éluant plus polaire, la tache monte plus haut et le Rf augmente de 0,45 à 0,70">
    {[[20, 0.45, 'peu polaire'], [124, 0.7, 'plus polaire']].map(([x, r, nom], i) => <g key={i}>
      <rect x={x} y="12" width="84" height="124" fill="#ecfccb" stroke={GRIS} strokeWidth="2"/>
      <line x1={x} y1="116" x2={x + 84} y2="116" stroke={ENCRE} strokeDasharray="4 3"/><line x1={x} y1="28" x2={x + 84} y2="28" stroke={ROUGE} strokeWidth="2"/>
      <Tache cx={x + 34} cy={116 - r * 88}/><T x={x + 48} y={116 - r * 88 + 4}>{String(r).replace('.', ',') + (r === 0.7 ? '0' : '')}</T>
      <T x={x + 42} y={154} a="middle" c={GRIS}>éluant</T><T x={x + 42} y={171} a="middle" w={700}>{nom}</T>
    </g>)}
    <Arr x1={114} y1={100} x2={114} y2={58} c={ORANGE}/>
    <T x={222} y={64} c={ORANGE} w={800}>Rf plus</T><T x={222} y={82} c={ORANGE} w={800}>grand</T>
  </Svg>);

export const SchemaTfCompat = () => (
  <Svg h={172} aria="La température de fusion mesurée, 97 plus ou moins 2 degrés, est comparée à celle de la littérature, 98 degrés : l'intervalle contient la valeur de la littérature, les valeurs sont compatibles">
    <T x={8} y={16} w={700}>|Tf mesurée − Tf littérature| ≤ u</T><T x={8} y={34} c={VERT} w={700}>⇒ valeurs compatibles</T>
    <T x={142} y={56} a="middle" c={BLEU} w={700}>mesure 97 ± 2 °C</T>
    <line x1="14" y1="100" x2="290" y2="100" stroke={GRIS} strokeWidth="1.5"/>
    <line x1="150" y1="64" x2="150" y2="108" stroke={VERT} strokeWidth="3"/>
    <line x1="126" y1="78" x2="158" y2="78" stroke={BLEU} strokeWidth="4"/><line x1="126" y1="70" x2="126" y2="86" stroke={BLEU} strokeWidth="3"/><line x1="158" y1="70" x2="158" y2="86" stroke={BLEU} strokeWidth="3"/>
    <T x={150} y={126} a="middle" c={VERT} w={700}>littérature : 98 °C</T>
    <T x={8} y={150} c={GRIS}>fusion nette + valeur compatible</T><T x={8} y={166} c={GRIS}>⇒ produit sans doute pur</T>
  </Svg>);
