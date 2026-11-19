// Schémas des cartes « À retenir » de la simulation 83 (diffraction des ondes). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
// Mur percé d'une ouverture centrée sur y0, de demi-largeur h
const Mur = ({ x, y0, h, haut = 160 }) => (<g><rect x={x} y={14} width="9" height={y0 - h - 14} fill={GRIS}/><rect x={x} y={y0 + h} width="9" height={haut - y0 - h} fill={GRIS}/></g>);

export const FDiffraction = () => (
  <Svg h={206} aria="Diffraction : une onde plane rencontre une ouverture ; si l'ouverture a est très grande devant la longueur d'onde, l'onde continue en faisceau presque rectiligne ; si a est de l'ordre de lambda, l'onde s'étale dans toutes les directions">
    <Mur x={66} y0={90} h={36} haut={166}/><Mur x={214} y0={90} h={7} haut={166}/>
    {[20, 34, 48].map(x => <Lg key={x} x1={x} y1={50} x2={x} y2={130} c={BLEU} w={2}/>)}
    {[168, 182, 196].map(x => <Lg key={x} x1={x} y1={50} x2={x} y2={130} c={BLEU} w={2}/>)}
    {[62, 90, 118].map(y => <Fleche key={y} x1={84} y1={y + 0} x2={140} y2={y} c={ORANGE} w={2.2}/>)}
    {[[236, 70, 280, 22], [236, 80, 288, 58], [236, 90, 290, 90], [236, 100, 288, 122], [236, 110, 280, 158]].map(([a, b, c, d], i) => <Fleche key={i} x1={a} y1={b} x2={c} y2={d} c={ORANGE} w={2.2}/>)}
    <T x={76} y={186} a="middle" w={800} c={GRIS}>a ≫ λ</T><T x={76} y={202} a="middle" c={GRIS}>faisceau droit</T>
    <T x={224} y={186} a="middle" w={800} c={ROUGE}>a ≈ λ</T><T x={224} y={202} a="middle" c={ROUGE}>ondes étalées</T>
  </Svg>);

export const FPorte = () => (
  <Svg h={204} aria="Porte ouverte : le son, de longueur d'onde environ 0,5 mètre comparable à la largeur de la porte, s'étale largement et contourne l'embrasure ; la lumière, de longueur d'onde environ 0,5 micromètre, un million de fois plus petite, passe tout droit">
    <Mur x={146} y0={80} h={30} haut={160}/>
    <Fleche x1={20} y1={64} x2={134} y2={64} c={ORANGE} w={2.4}/><Fleche x1={20} y1={96} x2={134} y2={96} c={BLEU} w={2.4}/>
    <Fleche x1={162} y1={72} x2={276} y2={26} c={ORANGE} w={2.4}/><Fleche x1={162} y1={80} x2={276} y2={80} c={ORANGE} w={2.4}/><Fleche x1={162} y1={88} x2={276} y2={134} c={ORANGE} w={2.4}/>
    <Fleche x1={162} y1={96} x2={276} y2={96} c={BLEU} w={2.4}/>
    <T x={20} y={52} c={ORANGE} w={800}>son</T><T x={20} y={116} c={BLEU} w={800}>lumière</T>
    <T x={150} y={176} a="middle" c={ORANGE} w={800}>son : λ ≈ a ⇒ s’étale</T><T x={150} y={194} a="middle" c={BLEU} w={800}>lumière : λ ≪ a ⇒ tout droit</T>
  </Svg>);

export const FFigure = () => (
  <Svg h={196} aria="Diffraction d'un laser par une fente de largeur a : sur l'écran à la distance D, une tache centrale de largeur L entre deux extinctions, puis des taches secondaires moins lumineuses">
    <Lg x1={6} y1={80} x2={72} y2={80} c={VERT} w={3.4}/><T x={8} y={66} c={VERT} w={800}>laser λ</T>
    <rect x="78" y="20" width="8" height="46" fill={GRIS}/><rect x="78" y="94" width="8" height="46" fill={GRIS}/><T x={82} y={14} a="middle" c={GRIS} w={800}>fente a</T>
    <Lg x1={86} y1={76} x2={228} y2={36} c={VERT} w={1.6} d="5 4"/><Lg x1={86} y1={84} x2={228} y2={124} c={VERT} w={1.6} d="5 4"/>
    <Lg x1={86} y1={156} x2={228} y2={156} c={GRIS} w={1.6}/><Lg x1={86} y1={150} x2={86} y2={162} c={GRIS} w={1.6}/><Lg x1={228} y1={150} x2={228} y2={162} c={GRIS} w={1.6}/>
    <T x={157} y={150} a="middle" w={800}>D</T>
    <rect x="228" y="8" width="10" height="144" fill="#e2e8f0" stroke={GRIS} strokeWidth="1.6"/>
    <rect x="230" y="36" width="6" height="88" fill="#22c55e"/><rect x="230" y="14" width="6" height="12" fill="#86efac"/><rect x="230" y="134" width="6" height="12" fill="#86efac"/>
    <Lg x1={252} y1={36} x2={252} y2={124} c={ENCRE} w={1.8}/><Lg x1={246} y1={36} x2={258} y2={36} c={ENCRE} w={1.8}/><Lg x1={246} y1={124} x2={258} y2={124} c={ENCRE} w={1.8}/>
    <T x={262} y={84} w={800}>L</T>
    <T x={250} y={30} a="end" c={GRIS}>extinction</T><T x={250} y={142} a="end" c={GRIS}>extinction</T>
    <T x={150} y={188} a="middle" c={GRIS}>L : entre les 2 premières extinctions</T>
  </Svg>);

export const FTache = () => (
  <Svg h={196} aria="Largeur de la tache centrale : pour une fente ou un fil, une bande centrale de largeur L ; pour un trou circulaire, un disque central entouré d'anneaux, dont le diamètre est L ; dans les deux cas plus l'objet est petit, plus la tache est grande">
    <rect x="30" y="20" width="100" height="100" fill="#0f172a"/><rect x="62" y="20" width="36" height="100" fill="#4ade80"/>
    <Lg x1={62} y1={132} x2={98} y2={132} c={ENCRE} w={1.8}/><Lg x1={62} y1={126} x2={62} y2={138} c={ENCRE} w={1.8}/><Lg x1={98} y1={126} x2={98} y2={138} c={ENCRE} w={1.8}/><T x={80} y={154} a="middle" w={800}>L</T>
    <rect x="170" y="20" width="100" height="100" fill="#0f172a"/><circle cx="220" cy="70" r="46" fill="none" stroke="#86efac" strokeWidth="2"/><circle cx="220" cy="70" r="30" fill="none" stroke="#86efac" strokeWidth="1.6"/><circle cx="220" cy="70" r="18" fill="#4ade80"/>
    <Lg x1={202} y1={132} x2={238} y2={132} c={ENCRE} w={1.8}/><Lg x1={202} y1={126} x2={202} y2={138} c={ENCRE} w={1.8}/><Lg x1={238} y1={126} x2={238} y2={138} c={ENCRE} w={1.8}/><T x={220} y={154} a="middle" w={800}>L</T>
    <T x={80} y={12} a="middle" c={GRIS} w={800}>fente ou fil a</T><T x={220} y={12} a="middle" c={GRIS} w={800}>trou d</T>
    <T x={150} y={182} a="middle" c={GRIS}>objet plus petit ⇒ L plus grand</T>
  </Svg>);

export const FIncert = () => (
  <Svg h={176} aria="Incertitude sur a : trois incertitudes relatives indépendantes, celle du pointé de L, celle de D et celle de la longueur d'onde, se combinent en quadrature ; la plus grande domine, ici le pointé de L">
    {[['pointé de L', 180, ORANGE], ['laser (λ)', 50, BLEU], ['écran (D)', 20, BLEU]].map(([n, w, c], i) => <g key={n}>
      <T x={10} y={28 + i * 36} w={800}>{n}</T><rect x="104" y={14 + i * 36} width={w} height="20" rx="3" fill={c} opacity="0.85"/></g>)}
    <T x={104} y={118} c={ORANGE} w={800}>↑ la plus grande domine</T>
    <T x={150} y={142} a="middle" w={800}>combinaison en quadrature</T>
    <T x={150} y={164} a="middle" c={GRIS}>jamais une simple somme</T>
  </Svg>);

export const FBilanDiff = () => (
  <Svg h={208} aria="Bilan : la diffraction est un étalement limité par une ouverture ou un obstacle, plus marqué si lambda est grande ou a petit ; on mesure L entre les deux premières extinctions ; on combine les incertitudes en quadrature et on améliore la source qui domine">
    {[['Étalement', 'ouverture ou obstacle petit'], ['θ ≈ λ ÷ a', 'plus marqué si λ grande, a petit'], ['L entre extinctions', 'fente : 2 λ D ÷ a'], ['Incertitude', 'quadrature ; viser la plus grande']].map(([a, b], i) => <g key={a}>
      <rect x="10" y={8 + i * 48} width="280" height="40" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
      <circle cx="30" cy={28 + i * 48} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={33 + i * 48} a="middle" c={ORANGE} w={800}>{i + 1}</T>
      <T x={48} y={26 + i * 48} w={800}>{a}</T><T x={48} y={42 + i * 48} c={GRIS}>{b}</T></g>)}
    <T x={150} y={204} a="middle" c={GRIS}>un obstacle = une ouverture de même taille</T>
  </Svg>);
