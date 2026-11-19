// Schémas des cartes « À retenir » de la simulation 14 (peinture à l'eau). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
const Grain = ({ x, y, r = 8, c = '#94a3b8' }) => <circle cx={x} cy={y} r={r} fill={c} stroke={GRIS} strokeWidth="1.4"/>;
const XL = l => 14 + l * (272 / 1.3);   // échelle de λ entre 0 et 1,3

export const FLambda = () => (
  <Svg h={158} aria="Aspect selon le rapport lambda égal à CPV sur CPVC : brillant si lambda est inférieur à 0,5, satiné entre 0,5 et 0,8, mat entre 0,8 et 1, film poreux au-delà de 1 ; seuils indicatifs">
    {[[0, 0.5, '#bfdbfe', 'brillant'], [0.5, 0.8, '#e0e7ff', 'satiné'], [0.8, 1, '#bbf7d0', 'mat'], [1, 1.3, '#fecaca', 'poreux']].map(([a, b, f, n]) => <g key={n}><rect x={XL(a)} y="44" width={XL(b) - XL(a)} height="40" fill={f} stroke={GRIS} strokeWidth="1.6"/><T x={(XL(a) + XL(b)) / 2} y={69} a="middle" w={800}>{n}</T></g>)}
    {[[0, '0'], [0.5, '0,5'], [0.8, '0,8'], [1, '1']].map(([l, t]) => <g key={t}><Lg x1={XL(l)} y1={84} x2={XL(l)} y2={94} c={GRIS} w={1.6}/><T x={XL(l)} y={110} a="middle" c={GRIS} w={700}>{t}</T></g>)}
    <T x={150} y={28} a="middle" c={GRIS} w={700}>λ augmente : de moins en moins de liant</T>
    <Fleche x1={30} y1={14} x2={270} y2={14} c={ORANGE} w={2}/>
    <T x={150} y={140} a="middle" c={GRIS}>seuils indicatifs ; cahier des charges : mat</T>
  </Svg>);

export const FCPVC = () => (
  <Svg h={176} aria="CPVC : c'est la part de volume des pulvérulents quand le liant remplit exactement les vides entre les grains ; le volume d'huile est le volume qu'absorbent les poudres, donné par la prise d'huile mesurée">
    <rect x="20" y="40" width="150" height="40" fill="#e2e8f0" stroke={GRIS} strokeWidth="2"/><T x={95} y={65} a="middle" w={800}>V pulvérulents</T>
    <rect x="170" y="40" width="110" height="40" fill="#fde68a" stroke={GRIS} strokeWidth="2"/><T x={225} y={65} a="middle" w={800}>V huile</T>
    <path d="M20,34 L20,26 L170,26 L170,34" fill="none" stroke={BLEU} strokeWidth="2"/><T x={95} y={18} a="middle" c={BLEU} w={800}>pulvérulents</T>
    <T x={225} y={102} a="middle" c={ORANGE} w={700}>prise d’huile</T><T x={225} y={118} a="middle" c={ORANGE} w={700}>mesurée</T>
    {[[40, 112], [64, 112], [88, 112], [52, 128], [76, 128]].map(([x, y]) => <Grain key={x + '-' + y} x={x} y={y} r={9}/>)}
    <T x={104} y={140} c={GRIS}>grains</T>
    <T x={150} y={166} a="middle" c={GRIS}>l’huile remplit les vides entre les grains</T>
  </Svg>);

export const FFicheMesure = () => (
  <Svg h={176} aria="Fiche technique et mesure : la fiche décrit un produit type ; la mesure sur le lot réel donne des prises d'huile plus grandes, donc une CPVC plus basse et un lambda plus grand : la peinture est mate alors que la fiche la prévoyait satinée">
    <rect x="14" y="52" width="158" height="30" fill="#e0e7ff" stroke={GRIS} strokeWidth="1.6"/><T x={60} y={72} a="middle" w={700}>satiné</T>
    <rect x="172" y="52" width="114" height="30" fill="#bbf7d0" stroke={GRIS} strokeWidth="1.6"/><T x={260} y={72} a="middle" w={700}>mat</T>
    <circle cx="120" cy="67" r="7" fill={BLEU}/><circle cx="224" cy="67" r="7" fill={ORANGE}/>
    <T x={120} y={42} a="middle" c={BLEU} w={800}>fiche technique</T><T x={224} y={42} a="middle" c={ORANGE} w={800}>mesure réelle</T>
    <Fleche x1={134} y1={67} x2={208} y2={67} c={GRIS} w={2}/>
    <T x={150} y={112} a="middle" w={800}>prises d’huile plus grandes</T><T x={150} y={132} a="middle" w={700}>CPVC plus basse, λ plus grand</T>
    <T x={150} y={160} a="middle" c={GRIS}>une fiche ne remplace pas la mesure</T>
  </Svg>);

export const FMemeVolume = () => (
  <Svg h={188} aria="Changer de résine à CPV constante : on garde le même volume de liant sec ; la résine Orgal, à 50 pour cent d'extrait sec, demande une masse plus grande que la Vinnapas à 60 pour cent, car elle contient plus d'eau">
    {[[40, 'Vinnapas', 76, '60 % sec'], [170, 'Orgal', 100, '50 % sec']].map(([x, n, h, e]) => <g key={n}>
      <rect x={x} y={20 + (100 - h)} width="90" height={h} fill="#bfdbfe" stroke={GRIS} strokeWidth="2"/>
      <rect x={x} y={20 + (100 - h) + (h - 52)} width="90" height="52" fill="#fcd34d" stroke={GRIS} strokeWidth="2"/>
      <T x={x + 45} y={20 + (100 - h) + (h - 52) + 31} a="middle" w={800}>liant sec</T>
      <T x={x + 45} y={140} a="middle" c={BLEU} w={800}>{n}</T><T x={x + 45} y={158} a="middle" c={GRIS}>{e}</T></g>)}
    <Lg x1={30} y1={88} x2={280} y2={88} c={ROUGE} w={1.6} d="5 4"/><T x={150} y={14} a="middle" c={ROUGE} w={800}>même volume de liant sec</T>
    <T x={150} y={180} a="middle" c={GRIS}>l’eau du liant diffère : masse totale ≠</T>
  </Svg>);

export const FDispersion = () => (
  <Svg h={196} aria="Dosage du dispersant : un dispersant insuffisant laisse des amas de poudre ; dans la fourchette recommandée de matière active, les grains sont bien dispersés">
    <T x={72} y={16} a="middle" c={ROUGE} w={800}>trop peu</T><T x={226} y={16} a="middle" c={VERT} w={800}>bien dosé</T>
    <rect x="10" y="24" width="124" height="86" rx="6" fill="#fff" stroke={ROUGE} strokeWidth="2"/><rect x="166" y="24" width="124" height="86" rx="6" fill="#fff" stroke={VERT} strokeWidth="2"/>
    {[[48, 60], [60, 66], [54, 76], [66, 78], [100, 52], [112, 60], [106, 70]].map(([x, y]) => <Grain key={x + '-' + y} x={x} y={y} r={8}/>)}
    {[[186, 44], [220, 40], [254, 46], [200, 70], [238, 72], [270, 80], [184, 94], [222, 98], [258, 100]].map(([x, y]) => <Grain key={x + '-' + y} x={x} y={y} r={8}/>)}
    <T x={72} y={128} a="middle" c={GRIS}>amas</T><T x={226} y={128} a="middle" c={GRIS}>grains séparés</T>
    <Lg x1={20} y1={160} x2={280} y2={160} c={GRIS} w={1.8}/><rect x="120" y="150" width="90" height="20" fill="#bbf7d0" stroke={VERT} strokeWidth="1.6"/>
    <T x={165} y={165.5} a="middle" c={VERT} w={800}>fourchette</T><circle cx="44" cy="160" r="6" fill={ROUGE}/>
    <T x={150} y={190} a="middle" c={GRIS}>matière active, en % des pulvérulents</T>
  </Svg>);

export const FTMFF = () => (
  <Svg h={214} aria="Température minimale de formation de film : la Vinnapas a une TMFF proche de 2 degrés et l'Orgal proche de 20 degrés ; si la température est inférieure à la TMFF, les particules restent séparées et le film est poudreux ou fissuré ; au-dessus, elles fusionnent en un film continu">
    <Lg x1={20} y1={44} x2={284} y2={44} c={GRIS} w={1.8}/>
    {[[0, '0'], [10, '10'], [20, '20'], [30, '30']].map(([t, l]) => <g key={t}><Lg x1={20 + t * 8.8} y1={38} x2={20 + t * 8.8} y2={50} c={GRIS} w={1.6}/><T x={20 + t * 8.8} y={66} a="middle" c={GRIS}>{l}</T></g>)}
    <T x={284} y={86} a="end" c={GRIS}>T (°C)</T>
    <polygon points="37.6,36 32,24 43.2,24" fill={BLEU}/><T x={38} y={18} a="middle" c={BLEU} w={800}>Vinnapas</T>
    <polygon points="196,36 190,24 202,24" fill={ORANGE}/><T x={196} y={18} a="middle" c={ORANGE} w={800}>Orgal</T>
    <rect x="14" y="100" width="130" height="68" rx="6" fill="#fff" stroke={ROUGE} strokeWidth="2"/><rect x="156" y="100" width="130" height="68" rx="6" fill="#fff" stroke={VERT} strokeWidth="2"/>
    {[[34, 126], [58, 126], [82, 126], [106, 126], [46, 148], [70, 148], [94, 148], [118, 148]].map(([x, y]) => <Grain key={x + '-' + y} x={x} y={y} r={10} c="#e2e8f0"/>)}
    <rect x="164" y="118" width="114" height="34" rx="12" fill="#e2e8f0" stroke={GRIS} strokeWidth="1.6"/>
    <T x={79} y={92} a="middle" c={ROUGE} w={800}>T &lt; TMFF</T><T x={221} y={92} a="middle" c={VERT} w={800}>T &gt; TMFF</T>
    <T x={79} y={186} a="middle" c={GRIS}>particules séparées</T><T x={221} y={186} a="middle" c={GRIS}>film continu</T>
    <T x={150} y={202} a="middle" c={GRIS}>fissuré ou poudreux</T>
  </Svg>);

export const FCoalescent = () => (
  <Svg h={176} aria="Rôle de l'agent de coalescence : il ramollit temporairement les particules de liant, ce qui abaisse la TMFF et permet leur fusion en un film continu ; puis il s'évapore, ce qui en fait un composé organique volatil">
    {[[8, 'particules dures'], [108, 'DPnB : elles ramollissent'], [208, 'film continu']].map(([x, n], k) => <g key={n}><rect x={x} y="22" width="84" height="64" rx="6" fill="#fff" stroke={GRIS} strokeWidth="2"/>
      {k === 0 && [[28, 44], [52, 44], [76, 44], [40, 66], [64, 66]].map(([dx, y]) => <Grain key={dx + 'a'} x={x + dx - 8} y={y} r={10} c="#94a3b8"/>)}
      {k === 1 && [[28, 44], [52, 44], [76, 44], [40, 66], [64, 66]].map(([dx, y]) => <Grain key={dx + 'b'} x={x + dx - 8} y={y} r={11} c="#fcd34d"/>)}
      {k === 2 && <rect x={x + 8} y="34" width="68" height="40" rx="14" fill="#cbd5e1" stroke={GRIS} strokeWidth="1.6"/>}
      <T x={x + 42} y={106} a="middle" c={GRIS}>{n.length > 16 ? 'ramollies' : n}</T></g>)}
    <Fleche x1={94} y1={54} x2={106} y2={54}/><Fleche x1={194} y1={54} x2={206} y2={54}/>
    <T x={150} y={14} a="middle" c={ORANGE} w={800}>DPnB ajouté</T>
    <T x={150} y={138} a="middle" w={800}>puis le DPnB s’évapore : c’est un COV</T><T x={150} y={158} a="middle" c={GRIS}>il ne compte pas dans l’extrait sec</T>
  </Svg>);
