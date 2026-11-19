// Schémas des cartes « À retenir » de la simulation 30 (échangeur thermique). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
// Tube coaxial : enveloppe bleue (eau froide) autour d'un tube rouge (fluide chaud)
const Tube = ({ x, y, w = 200, sensC = 1, sensF = 1 }) => (
  <g>
    <rect x={x} y={y} width={w} height="44" rx="4" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/>
    <rect x={x} y={y + 13} width={w} height="18" fill="#fecaca" stroke={ROUGE} strokeWidth="2"/>
    <Fleche x1={sensC > 0 ? x + w * 0.3 : x + w * 0.7} y1={y + 22} x2={sensC > 0 ? x + w * 0.7 : x + w * 0.3} y2={y + 22} c={ROUGE} w={2.4}/>
    <Fleche x1={sensF > 0 ? x + w * 0.3 : x + w * 0.7} y1={y + 6} x2={sensF > 0 ? x + w * 0.7 : x + w * 0.3} y2={y + 6} c={BLEU} w={2}/>
    <Fleche x1={sensF > 0 ? x + w * 0.3 : x + w * 0.7} y1={y + 38} x2={sensF > 0 ? x + w * 0.7 : x + w * 0.3} y2={y + 38} c={BLEU} w={2}/>
  </g>);

export const FSens = () => (
  <Svg h={196} aria="Deux échangeurs coaxiaux : à co-courant, le fluide chaud et l'eau froide circulent dans le même sens ; à contre-courant, ils circulent en sens opposés">
    <T x={150} y={18} a="middle" c={ORANGE} w={800}>co-courant : même sens</T>
    <Tube x={50} y={28} sensC={1} sensF={1}/>
    <T x={150} y={106} a="middle" c={ORANGE} w={800}>contre-courant : sens opposés</T>
    <Tube x={50} y={116} sensC={1} sensF={-1}/>
    <T x={150} y={186} a="middle" c={GRIS}>rouge : fluide chaud ; bleu : eau froide</T>
  </Svg>);

export const FBilanP = () => (
  <Svg h={176} aria="Bilan de puissance : le fluide chaud cède de l'énergie à travers la paroi, donc sa puissance est négative ; le fluide froid la reçoit, donc sa puissance est positive ; sans pertes, les deux valeurs absolues sont égales">
    <rect x="20" y="22" width="260" height="34" rx="4" fill="#fecaca" stroke={ROUGE} strokeWidth="2"/><T x={150} y={44} a="middle" c={ROUGE} w={800}>fluide chaud</T>
    <rect x="20" y="96" width="260" height="34" rx="4" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><T x={150} y={118} a="middle" c={BLEU} w={800}>eau froide</T>
    <Lg x1={20} y1={76} x2={280} y2={76} c={GRIS} w={3}/><T x={284} y={72} a="end" c={GRIS}>paroi</T>
    <Fleche x1={90} y1={58} x2={90} y2={94} c={ORANGE} w={3}/><Fleche x1={210} y1={58} x2={210} y2={94} c={ORANGE} w={3}/>
    <T x={92} y={152} a="end" c={ROUGE} w={800}>cède : P &lt; 0</T><T x={208} y={152} c={BLEU} w={800}>reçoit : P &gt; 0</T>
    <T x={150} y={170} a="middle" c={GRIS}>sans pertes : |P chaud| = P froid</T>
  </Svg>);

// Deux profils (haut = chaud, bas = froid) tracés dans un cadre x0..x0+w
const Courbe = ({ pts, c }) => <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={c} strokeWidth="2.6" strokeLinejoin="round"/>;
const expo = (x0, w, ya, yb, k = 3, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [x0 + u * w, ya + (yb - ya) * (1 - Math.exp(-k * u)) / (1 - Math.exp(-k))]; });

export const FDTm = () => (
  <Svg h={196} aria="Écart de température moyen à co-courant : les deux courbes se rapprochent le long de l'échangeur ; delta T un est l'écart à gauche, delta T deux l'écart à droite ; la moyenne logarithmique est plus petite que la moyenne arithmétique">
    <Lg x1={24} y1={14} x2={24} y2={128} c={GRIS} w={1.8}/><Lg x1={24} y1={128} x2={284} y2={128} c={GRIS} w={1.8}/>
    <T x={284} y={146} a="end" c={GRIS}>position dans l’échangeur</T>
    <Courbe pts={expo(24, 260, 28, 82, 2.2)} c={ROUGE}/><Courbe pts={expo(24, 260, 112, 92, 2.2)} c={BLEU}/>
    <Lg x1={40} y1={28} x2={40} y2={112} c={ORANGE} w={2} d="4 3"/><T x={46} y={74} c={ORANGE} w={800}>ΔT₁</T>
    <Lg x1={268} y1={82} x2={268} y2={92} c={ORANGE} w={2}/><T x={266} y={74} a="end" c={ORANGE} w={800}>ΔT₂</T>
    <T x={150} y={170} a="middle" c={ORANGE} w={800}>moyenne logarithmique</T>
    <T x={150} y={188} a="middle" c={GRIS}>plus petite que la moyenne arithmétique</T>
  </Svg>);

export const FU = () => (
  <Svg h={178} aria="Coefficient global d'échange U : à surface et écart moyen égaux, la puissance échangée à travers la paroi est d'autant plus grande que U est grand">
    {[[18, 'U petit', 3, 'petite P'], [162, 'U grand', 9, 'grande P']].map(([x, n, ep, p], k) => <g key={n}>
      <rect x={x} y="30" width="46" height="70" fill="#fecaca" stroke={ROUGE} strokeWidth="2"/><rect x={x + 76} y="30" width="46" height="70" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/>
      <rect x={x + 46} y="30" width="30" height="70" fill="#e2e8f0" stroke={GRIS} strokeWidth="2"/>
      <Fleche x1={x + 14} y1={65} x2={x + 108} y2={65} c={ORANGE} w={ep}/>
      <T x={x + 61} y={20} a="middle" w={800}>{n}</T><T x={x + 61} y={122} a="middle" c={ORANGE} w={800}>{p}</T></g>)}
    <T x={150} y={150} a="middle" w={800}>P = U · S · ΔT moyen</T>
    <T x={150} y={170} a="middle" c={GRIS}>S : surface de paroi, en m²</T>
  </Svg>);

export const FCroise = () => (
  <Svg h={196} aria="Contre-courant : l'eau froide sort à gauche, où entre le fluide chaud ; sa température de sortie peut dépasser celle de sortie du fluide chaud, ce qui est impossible à co-courant">
    <Lg x1={24} y1={12} x2={24} y2={150} c={GRIS} w={1.8}/><Lg x1={24} y1={150} x2={284} y2={150} c={GRIS} w={1.8}/>
    <Courbe pts={expo(24, 260, 30, 96, 1.2)} c={ROUGE}/><Courbe pts={[...expo(24, 260, 66, 128, 1.2)]} c={BLEU}/>
    <Lg x1={24} y1={66} x2={284} y2={66} c={BLEU} w={1.4} d="5 4"/><Lg x1={24} y1={96} x2={284} y2={96} c={ROUGE} w={1.4} d="5 4"/>
    <circle cx="24" cy="66" r="5" fill={BLEU}/><circle cx="284" cy="96" r="5" fill={ROUGE}/>
    <T x={34} y={60} c={BLEU} w={800}>froid sort</T><T x={278} y={116} a="end" c={ROUGE} w={800}>chaud sort</T>
    <T x={150} y={176} a="middle" w={800}>sortie froide &gt; sortie chaude</T><T x={150} y={192} a="middle" c={GRIS}>possible seulement à contre-courant</T>
  </Svg>);

export const FContreEff = () => (
  <Svg h={210} aria="Comparaison des deux modes : à co-courant, l'écart entre les fluides devient très petit à droite ; à contre-courant, il reste plus régulier, donc l'écart moyen est plus grand et la puissance aussi">
    {[[10, 'co-courant', expo(10, 128, 30, 78, 2.2), expo(10, 128, 120, 92, 2.2)], [162, 'contre-courant', expo(162, 128, 30, 96, 1.2), expo(162, 128, 66, 128, 1.2)]].map(([x, n, h, f], k) => <g key={n}>
      <Lg x1={x} y1={14} x2={x} y2={136} c={GRIS} w={1.6}/><Lg x1={x} y1={136} x2={x + 130} y2={136} c={GRIS} w={1.6}/>
      <Courbe pts={h} c={ROUGE}/><Courbe pts={f} c={BLEU}/>
      <T x={x + 65} y={158} a="middle" c={k ? VERT : ROUGE} w={800}>{n}</T></g>)}
    <T x={150} y={182} a="middle" w={800}>même U, même S : P suit ΔT moyen</T>
    <T x={150} y={200} a="middle" c={GRIS}>écart régulier ⇒ ΔT moyen plus grand</T>
  </Svg>);

export const FBain = () => (
  <Svg h={176} aria="Côté chaud à température constante, bain ou vapeur qui se condense : la température du chaud est la même partout, donc l'eau froide suit le même profil dans les deux sens de circulation">
    <Lg x1={24} y1={12} x2={24} y2={130} c={GRIS} w={1.8}/><Lg x1={24} y1={130} x2={284} y2={130} c={GRIS} w={1.8}/>
    <Lg x1={24} y1={28} x2={284} y2={28} c={ROUGE} w={3}/><T x={284} y={22} a="end" c={ROUGE} w={800}>chaud : T constante</T>
    <Courbe pts={expo(24, 260, 118, 56, 2)} c={BLEU}/>
    <Fleche x1={110} y1={86} x2={200} y2={86} c={GRIS} w={2}/><Fleche x1={200} y1={100} x2={110} y2={100} c={GRIS} w={2}/>
    <T x={150} y={152} a="middle" w={800}>le sens n’a plus d’importance</T><T x={150} y={170} a="middle" c={GRIS}>co-courant = contre-courant</T>
  </Svg>);

export const FHypo = () => (
  <Svg h={208} aria="Hypothèses du modèle : régime stationnaire, pas de pertes, coefficient U constant, eau liquide de capacité constante ; en TP, les pertes et les incertitudes écartent un peu le réel du modèle">
    {[['régime stationnaire', 'températures stables'], ['pas de pertes', 'en TP : pertes vers l’air'], ['U constant', 'réel : U croît avec les débits'], ['eau liquide, C constant', 'valeurs du TP']].map(([a, b], i) => <g key={a}>
      <rect x="10" y={10 + i * 46} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
      <circle cx="30" cy={29 + i * 46} r="9" fill="#bbf7d0" stroke={VERT} strokeWidth="1.6"/><path d={`M25,${29 + i * 46} l4,4 l7,-8`} fill="none" stroke={VERT} strokeWidth="2.4"/>
      <T x={46} y={26 + i * 46} w={800}>{a}</T><T x={46} y={42 + i * 46} c={ORANGE}>{b}</T></g>)}
    <T x={150} y={202} a="middle" c={GRIS}>un modèle simplifie : on le discute</T>
  </Svg>);
