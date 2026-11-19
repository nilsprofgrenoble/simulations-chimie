// Schémas des cartes « À retenir » de la simulation 99 (chimiosélectivité). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', VIOLET = '#6d28d9';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.4"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
const OUI = ['#ffedd5', ORANGE], NON = ['#f1f5f9', GRIS];
const Grille = ({ cols, lignes, h, aria, pied }) => (
  <Svg h={h} aria={aria}>
    {cols.map((c, j) => <T key={c} x={146 + j * 100} y={16} a="middle" c={GRIS} w={700}>{c}</T>)}
    {lignes.map(([nom, ...cells], k) => <g key={nom}><T x={8} y={52 + k * 50} w={800}>{nom}</T>
      {cells.map(([t, oui], j) => { const [f, c] = oui ? OUI : NON; return <g key={j}><rect x={98 + j * 100} y={26 + k * 50} width="94" height="40" rx="6" fill={f} stroke={c} strokeWidth="1.8"/><T x={145 + j * 100} y={51 + k * 50} a="middle" c={c} w={800}>{t}</T></g>; })}</g>)}
    {pied.map(([t, c, w], i) => <T key={t} x={150} y={26 + lignes.length * 50 + 22 + i * 20} a="middle" c={c} w={w}>{t}</T>)}
  </Svg>);

export const FChimio = () => (
  <Svg h={176} aria="Chimiosélectivité : une molécule porte deux groupes fonctionnels A et B ; le réactif n'en transforme qu'un, le groupe A, et l'autre, le groupe B, reste intact">
    <rect x="46" y="12" width="76" height="24" rx="12" fill="#ede9fe" stroke={VIOLET} strokeWidth="2"/><T x={84} y={29} a="middle" c={VIOLET} w={800}>réactif</T>
    <Fleche x1={84} y1={40} x2={84} y2={66} c={VIOLET}/>
    <rect x="22" y="70" width="124" height="52" rx="8" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><T x={84} y={92} a="middle" c={BLEU} w={800}>groupe A</T><T x={84} y={112} a="middle" c={VERT} w={800}>✓ transformé</T>
    <rect x="160" y="70" width="124" height="52" rx="8" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><T x={222} y={92} a="middle" c={ORANGE} w={800}>groupe B</T><T x={222} y={112} a="middle" c={ROUGE} w={800}>✕ inchangé</T>
    <T x={150} y={150} a="middle" w={700}>chimiosélective : le réactif choisit un groupe</T><T x={150} y={168} a="middle" c={GRIS}>molécule polyfonctionnelle</T>
  </Svg>);

export const FElectro = () => (
  <Svg h={180} aria="Réactivité vis-à-vis des hydrures : l'aldéhyde est le plus réactif, puis la cétone, puis l'ester ; dans l'ester, un doublet de l'oxygène voisin est délocalisé vers le carbone du groupe C=O, qui est moins électrophile">
    <T x={150} y={16} a="middle" c={GRIS} w={700}>réactivité vis-à-vis des hydrures</T>
    {[['aldéhyde', 200, ORANGE], ['cétone', 150, '#d97706'], ['ester', 66, GRIS]].map(([t, w, c], k) => <g key={t}><T x={8} y={46 + k * 34} w={800}>{t}</T><rect x="84" y={30 + k * 34} width={w} height="22" rx="4" fill={c} fillOpacity="0.85"/></g>)}
    <T x={150} y={146} a="middle" w={700}>ester : doublet de O–Et délocalisé</T><T x={150} y={166} a="middle" c={GRIS}>carbone du C=O moins électrophile</T>
  </Svg>);

export const FReducteurs = () => (
  <Grille cols={['cétone', 'ester']} h={176} aria="Choix du réducteur : le borohydrure de sodium NaBH₄, réducteur doux, réduit la cétone et laisse l'ester intact, il est chimiosélectif ; l'hydrure double LiAlH₄, réducteur puissant, réduit la cétone et l'ester, il n'est pas sélectif"
    lignes={[['NaBH₄', ['réduite', true], ['intact', false]], ['LiAlH₄', ['réduite', true], ['réduit', true]]]}
    pied={[['doux : chimiosélectif', VERT, 800], ['puissant : plus de sélectivité', ROUGE, 800]]}/>);

export const FInverse = () => (
  <Grille cols={['C=O (cétone)', 'C=C (alcène)']} h={176} aria="Le réactif choisit le groupe : sur l'hex-5-én-2-one, les hydrures comme NaBH₄ réduisent la cétone et laissent la double liaison intacte, alors que H₂ sur palladium réduit la double liaison et laisse la cétone intacte ; la sélectivité s'inverse"
    lignes={[['NaBH₄', ['réduit', true], ['intact', false]], ['H₂/Pd', ['intact', false], ['réduit', true]]]}
    pied={[['deux réactifs, deux produits', ENCRE, 700], ['la sélectivité s’inverse', ORANGE, 800]]}/>);

export const FDemarche = () => (
  <Svg h={176} aria="Prévoir quel groupe réagit en quatre étapes : repérer les groupes fonctionnels, comparer leur réactivité, tenir compte du réactif et des conditions, conclure">
    {[['repérer les groupes fonctionnels', BLEU], ['comparer leur réactivité', BLEU], ['réactif et conditions : doux ou puissant', ORANGE], ['conclure : groupe transformé, produit', VERT]].map(([t, c], i) => (
      <g key={i}><circle cx="16" cy={22 + i * 38} r="12" fill={c}/><T x={16} y={26.5 + i * 38} a="middle" c="#fff" w={800}>{i + 1}</T><T x={38} y={27 + i * 38} w={600}>{t}</T>
        {i < 3 && <Lg x1={16} y1={34 + i * 38} x2={16} y2={48 + i * 38} c={GRIS}/>}</g>))}
  </Svg>);
