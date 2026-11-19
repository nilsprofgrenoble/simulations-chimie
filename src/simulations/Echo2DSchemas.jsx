// Schémas des cartes « À retenir » de la simulation 91 (échographe 2D). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', CYAN = '#0e7490';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.4"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

export const FPrincipe = () => (
  <Svg h={206} aria="Principe de l'échographie : la sonde émet une salve d'ultrasons qui traverse le milieu 1 jusqu'à une interface à la profondeur d ; une partie est réfléchie et revient vers la sonde ; le temps t mesuré est un aller-retour, donc d égale v fois t divisé par 2">
    <rect x="84" y="10" width="60" height="16" rx="4" fill={CYAN}/><T x={114} y={22.5} a="middle" c="#fff" w={800}>sonde</T>
    <Fleche x1={104} y1={28} x2={104} y2={110} c={ORANGE}/><Fleche x1={126} y1={110} x2={126} y2={32} c={VERT}/>
    <T x={96} y={70} a="end" c={ORANGE} w={700}>aller</T><T x={134} y={70} c={VERT} w={700}>retour</T>
    <Lg x1={20} y1={114} x2={220} y2={114} c={ENCRE} w={2.6}/><T x={228} y={118} c={ENCRE} w={700}>interface</T>
    <T x={20} y={60} c={GRIS}>milieu 1</T><T x={20} y={138} c={GRIS}>milieu 2</T>
    <Lg x1={170} y1={28} x2={170} y2={114} c={GRIS} w={1.4}/><T x={176} y={74} c={BLEU} w={800}>d</T>
    <T x={150} y={162} a="middle" c={ENCRE} w={800}>d = v × t ÷ 2</T>
    <T x={150} y={182} a="middle" c={GRIS}>t : temps d’un aller-retour (1 µs = 10⁻⁶ s)</T><T x={150} y={196} a="middle" c={ROUGE} w={700}>piège : oublier le ÷ 2</T>
  </Svg>);

export const FEventail = () => {
  const ang = [-40, -20, 0, 20, 40], P = (r, a) => [150 + r * Math.sin(a * Math.PI / 180), 14 + r * Math.cos(a * Math.PI / 180)];
  const arc = r => { const [x0, y0] = P(r, -40), [x1, y1] = P(r, 40); return `M ${x0} ${y0} A ${r} ${r} 0 0 0 ${x1} ${y1}`; };
  return (
    <Svg h={200} aria="Image en éventail : la sonde au sommet pivote de moins 40 à plus 40 degrés ; chaque tir est une ligne de l'image ; les arcs de cercle centrés sur la sonde marquent des profondeurs égales">
      {[70, 110, 150].map(r => <path key={r} d={arc(r)} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/>)}
      {ang.map(a => { const [x, y] = P(150, a); return <Lg key={a} x1={150} y1={14} x2={x} y2={y} c={a === 0 ? ORANGE : CYAN} w={a === 0 ? 2.6 : 1.6}/>; })}
      <rect x="130" y="6" width="40" height="12" rx="3" fill={CYAN}/>
      <T x={26} y={150} c={BLEU} w={800}>−40°</T><T x={274} y={150} a="end" c={BLEU} w={800}>+40°</T>
      <T x={150} y={194} a="middle" c={GRIS}>arcs : profondeurs égales</T>
      <T x={150} y={172} a="middle" c={ORANGE} w={700}>1 tir = 1 ligne de l’image</T>
      <T x={156} y={64} c={GRIS}>profondeur d</T>
    </Svg>);
};

export const FProfondeur = () => (
  <Svg h={216} aria="Profondeur apparente : l'appareil suppose une célérité de 1540 mètres par seconde partout ; dans la graisse, où la célérité est de 1450, l'onde va moins vite, l'écho revient plus tard et la structure située derrière paraît plus profonde que dans la réalité">
    <T x={74} y={14} a="middle" c={GRIS} w={700}>réalité</T><T x={226} y={14} a="middle" c={GRIS} w={700}>image</T>
    {[0, 1].map(k => <g key={k}><rect x={44 + k * 152} y="22" width="60" height="12" fill="#fde68a" stroke="#b45309"/><rect x={44 + k * 152} y="34" width="60" height="34" fill="#fef9c3" stroke="#ca8a04"/><rect x={44 + k * 152} y="68" width="60" height="80" fill="#fee2e2" stroke="#b91c1c" strokeWidth="1.2"/></g>)}
    <T x={74} y={55} a="middle" c="#92400e" w={700}>graisse</T><T x={226} y={55} a="middle" c="#92400e" w={700}>graisse</T>
    <Lg x1={34} y1={100} x2={114} y2={100} c={ORANGE} w={2.4}/><Lg x1={186} y1={112} x2={266} y2={112} c={ORANGE} w={2.4}/>
    <T x={74} y={92} a="middle" c={ORANGE} w={800}>structure</T><T x={226} y={104} a="middle" c={ORANGE} w={800}>plus bas</T>
    <Fleche x1={150} y1={100} x2={150} y2={116} c={ORANGE}/>
    <T x={150} y={170} a="middle" c={ENCRE} w={700}>dapp = 1540 × t ÷ 2 (partout)</T>
    <T x={150} y={190} a="middle" c={GRIS}>exemple : t = 40 µs → 3,1 cm</T><T x={150} y={206} a="middle" c={GRIS}>graisse : 1450 m/s, onde plus lente</T>
  </Svg>);

export const FFrequence = () => {
  const pts = k => { const o = []; for (let i = 0; i <= 20; i++) { const x = 40 + i * 12, y = 20 + 80 * (1 - Math.exp(-k * i / 20 * 3)); o.push(`${x},${120 - (120 - y) * 1}`); } return o; };
  const courbe = k => Array.from({ length: 21 }, (_, i) => `${40 + i * 12},${24 + 86 * (1 - Math.exp(-k * i / 20))}`).join(' ');
  void pts;
  return (
    <Svg h={206} aria="Fréquence et absorption : l'absorption est proportionnelle à la fréquence ; à 2 mégahertz l'écho s'affaiblit lentement et l'on voit loin mais l'image est moins nette ; à 8 mégahertz il s'affaiblit vite, l'image est plus fine mais le fond disparaît sous le seuil de détection">
      <Lg x1={40} y1={112} x2={286} y2={112} c={GRIS} w={1.4}/><Lg x1={40} y1={112} x2={40} y2={14} c={GRIS} w={1.4}/>
      <T x={46} y={22} c={GRIS}>amplitude</T><T x={286} y={128} a="end" c={GRIS}>profondeur</T>
      <polyline points={courbe(1.2)} fill="none" stroke={VERT} strokeWidth="3"/><polyline points={courbe(4.5)} fill="none" stroke={ROUGE} strokeWidth="3"/>
      <Lg x1={40} y1={88} x2={286} y2={88} c={ENCRE} w={1.4} d="5 4"/><T x={44} y={134} c={ENCRE}>pointillés : seuil de détection</T>
      <T x={12} y={160} c={VERT} w={800}>2 MHz</T><T x={62} y={160} c={VERT}>voir loin, image moins nette</T>
      <T x={12} y={180} c={ROUGE} w={800}>8 MHz</T><T x={62} y={180} c={ROUGE}>image fine, le fond disparaît</T>
      <T x={150} y={203} a="middle" c={GRIS}>α = α₁ × f (dB/cm, f en MHz)</T>
    </Svg>);
};

export const FReflexion = () => {
  const L = [['air / peau', 0.99, ROUGE], ['liquide / os', 0.45, '#a16207'], ['gel / peau', 0.02, VERT], ['muscle / organe', 0.02, VERT]];
  return (
    <Svg h={206} aria="Coefficient de réflexion R des interfaces : air sur peau 0,99, liquide amniotique sur os 0,45, gel sur peau 0,02, muscle sur organe 0,02 ; plus R est grand, plus l'écho est brillant ; sans gel, la couche d'air fait perdre environ 40 décibels à l'aller-retour, donc presque tous les échos passent sous le seuil">
      <T x={12} y={14} c={GRIS} w={700}>coefficient de réflexion R</T>
      {L.map(([t, r, c], k) => <g key={t}><T x={12} y={42 + k * 30} c={ENCRE} w={600}>{t}</T><rect x="118" y={28 + k * 30} width="130" height="18" fill="#f1f5f9" stroke="#cbd5e1"/><rect x="118" y={28 + k * 30} width={Math.max(3, 130 * r)} height="18" fill={c} fillOpacity="0.8"/><T x={256} y={42 + k * 30} c={c} w={800}>{String(r).replace('.', ',')}</T></g>)}
      <T x={150} y={160} a="middle" c={ENCRE} w={700}>R grand : écho intense, point brillant</T>
      <T x={150} y={180} a="middle" c={ROUGE} w={700}>sans gel : T² = 10⁻⁴ soit −40 dB</T><T x={150} y={200} a="middle" c={GRIS}>le gel supprime la couche d’air</T>
    </Svg>);
};

export const FLire = () => (
  <Svg h={184} aria="Lire une échographie en quatre étapes : repérer les zones sombres et les points brillants, placer les calipers aux deux extrémités de la structure, lire la distance affichée, comparer avec les valeurs de référence">
    {[['repérer sombre (liquide) et brillant (os)', CYAN], ['placer les calipers aux extrémités', CYAN], ['lire la distance (profondeur apparente)', ORANGE], ['comparer aux valeurs de référence', VERT]].map(([t, c], i) => (
      <g key={i}><circle cx="16" cy={20 + i * 32} r="11" fill={c}/><T x={16} y={24.5 + i * 32} a="middle" c="#fff" w={800}>{i + 1}</T><T x={36} y={25 + i * 32} w={600}>{t}</T>
        {i < 3 && <Lg x1={16} y1={32 + i * 32} x2={16} y2={40 + i * 32} c={GRIS}/>}</g>))}
    <T x={150} y={154} a="middle" c={GRIS}>fémur : os très réfléchissant et très absorbant</T><T x={150} y={172} a="middle" c={GRIS}>→ ombre sombre derrière lui</T>
  </Svg>);
