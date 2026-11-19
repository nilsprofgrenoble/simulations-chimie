// Schémas des cartes « À retenir » de la simulation 43 (réfractomètre). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const I = ({ b, i }) => <>{b}<tspan fontSize="9.5" dy="3">{i}</tspan><tspan dy="-3">{' '}</tspan></>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.2"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

export const FPrincipe = () => (
  <Svg h={176} aria="Principe du réfractomètre : la lumière traverse un prisme puis un film de liquide d'indice n ; au-delà d'un angle limite qui dépend de n, les rayons rasants ne passent plus ; dans l'oculaire, une zone claire et une zone sombre sont séparées par une frontière qui se déplace quand n change">
    <polygon points="14,72 60,20 170,20 170,72" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><T x={104} y={50} a="middle" c={BLEU} w={800}>prisme</T>
    <rect x="14" y="72" width="156" height="10" fill="#fde68a" stroke="#b45309" strokeWidth="1.6"/><T x={92} y={104} a="middle" c="#92400e" w={700}>film de liquide, indice n</T>
    <Fleche x1={30} y1={34} x2={72} y2={72} c={ORANGE}/><Fleche x1={30} y1={56} x2={110} y2={72} c={ORANGE}/>
    <Lg x1={110} y1={72} x2={150} y2={30} c={GRIS} w={1.6} d="4 3"/><T x={126} y={62} c={GRIS} w={700}>θ</T>
    <rect x="200" y="20" width="82" height="62" fill="#fffbeb" stroke={GRIS} strokeWidth="1.8"/><rect x="244" y="20" width="38" height="62" fill="#1e293b"/>
    <Lg x1={244} y1={20} x2={244} y2={82} c={ROUGE} w={2.5}/>
    <T x={241} y={100} a="middle" c={GRIS}>oculaire</T>
    <Fleche x1={244} y1={118} x2={214} y2={118} c={ORANGE}/><Fleche x1={244} y1={118} x2={274} y2={118} c={ORANGE}/>
    <T x={150} y={146} a="middle" c={ORANGE} w={700}>n change → la frontière se déplace</T>
    <T x={150} y={166} a="middle" c={GRIS}>θ : angle limite ; il donne l’indice n</T>
  </Svg>);

export const FCompens = () => (
  <Svg h={160} aria="Compensateur : sans compensateur, la frontière clair sombre est floue et colorée à cause de la dispersion de la lumière blanche ; avec le compensateur, elle est nette ; l'indice mesuré est celui de la raie D du sodium à 20 degrés Celsius">
    <rect x="20" y="28" width="108" height="64" fill="#fffbeb" stroke={GRIS} strokeWidth="1.8"/><rect x="74" y="28" width="54" height="64" fill="#1e293b"/>
    {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'].map((c, k) => <rect key={k} x={60 + k * 7} y={28} width="7" height="64" fill={c} fillOpacity="0.75"/>)}
    <rect x="172" y="28" width="108" height="64" fill="#fffbeb" stroke={GRIS} strokeWidth="1.8"/><rect x="226" y="28" width="54" height="64" fill="#1e293b"/><Lg x1={226} y1={28} x2={226} y2={92} c={ROUGE} w={2}/>
    <T x={74} y={20} a="middle" c={ROUGE} w={800}>sans</T><T x={226} y={20} a="middle" c={VERT} w={800}>avec compensateur</T>
    <T x={74} y={112} a="middle" c={GRIS}>floue et colorée</T><T x={226} y={112} a="middle" c={GRIS}>nette</T>
    <T x={150} y={142} a="middle" c={BLEU} w={700}>n mesuré pour la raie D du sodium, à 20 °C</T>
  </Svg>);

export const FLecture = () => (
  <Svg h={186} aria="Lecture de l'échelle : les grandes graduations sont espacées de 0,001 ; l'index rouge se trouve à deux dixièmes de graduation après 1,345 ; on lit donc 1,3452 avec une incertitude d'environ 0,0002">
    <T x={150} y={16} a="middle" c={GRIS}>exemple de lecture</T>
    <rect x="14" y="30" width="272" height="44" fill="#fffbeb" stroke={GRIS} strokeWidth="1.8"/>
    {[0, 1, 2].map(k => <g key={k}><Lg x1={46 + k * 100} y1={30} x2={46 + k * 100} y2={74} c={ENCRE} w={2}/><T x={46 + k * 100} y={92} a="middle" c={ENCRE} w={700}>{['1,344', '1,345', '1,346'][k]}</T></g>)}
    {[...Array(20).keys()].filter(k => k % 10 !== 0).map(k => <Lg key={k} x1={46 + k * 10} y1={30} x2={46 + k * 10} y2={k % 5 === 0 ? 52 : 44} c={GRIS} w={1}/>)}
    <Lg x1={166} y1={22} x2={166} y2={80} c={ROUGE} w={3}/><T x={166} y={112} a="middle" c={ROUGE} w={800}>index</T>
    <T x={150} y={136} a="middle" c={GRIS}>graduation : 0,001 ; estimé à l’œil : 0,0001</T>
    <T x={150} y={158} a="middle" c={VERT} w={800}>n = 1,3452 ± 0,0002</T>
    <T x={150} y={174} a="middle" c={GRIS}>4 décimales, sans unité</T>
  </Svg>);

export const FEtalonnage = () => {
  const pts = []; for (let k = 0; k <= 20; k++) { const x = k / 20; pts.push(`${36 + x * 240},${132 - (14 + 74 * (1 - Math.pow((x - 0.6) / 0.6, 2) * (x < 0.6 ? 1 : 1.6)) * 0.92)}`); }
  return (
    <Svg h={198} aria="Courbe d'étalonnage de l'indice n en fonction de la fraction molaire x en éthanol : elle monte, passe par un maximum puis redescend ; une droite horizontale à la valeur mesurée de n coupe la courbe en deux points, de fractions molaires x un et x deux">
      <Lg x1={36} y1={134} x2={284} y2={134} c={GRIS} w={1.6}/><Lg x1={36} y1={134} x2={36} y2={14} c={GRIS} w={1.6}/>
      <T x={44} y={22} c={GRIS}>n</T><T x={160} y={152} a="middle" c={GRIS}>x (éthanol)</T><T x={36} y={152} a="middle" c={GRIS}>0</T><T x={276} y={152} a="end" c={GRIS}>1</T>
      <polyline points={pts.join(' ')} fill="none" stroke={BLEU} strokeWidth="3" strokeLinejoin="round"/>
      <Lg x1={36} y1={54} x2={276} y2={54} c={ORANGE} w={2} d="6 4"/><T x={44} y={46} c={ORANGE} w={700}>n mesuré</T>
      {[[96, 'x₁'], [222, 'x₂']].map(([px, t]) => <g key={t}><circle cx={px} cy={54} r="4.5" fill={ORANGE}/><Lg x1={px} y1={54} x2={px} y2={134} c={ORANGE} w={1.4} d="3 3"/><T x={px} y={170} a="middle" c={ORANGE} w={800}>{t}</T></g>)}
      <T x={150} y={192} a="middle" c={GRIS}>un même n, deux compositions possibles</T>
    </Svg>);
};

export const FContexte = () => (
  <Svg h={180} aria="Lever l'ambiguïté : la mesure donne deux compositions possibles, une pauvre et une riche en éthanol ; une autre information, comme la température en tête de colonne proche de celle de l'azéotrope, permet de choisir la bonne">
    <rect x="14" y="14" width="124" height="40" rx="6" fill="#eef6ff" stroke={BLEU} strokeWidth="1.8"/><T x={76} y={30} a="middle" c={BLEU} w={800}>x₁ : pauvre</T><T x={76} y={46} a="middle" c={GRIS}>en éthanol</T>
    <rect x="162" y="14" width="124" height="40" rx="6" fill="#eef6ff" stroke={BLEU} strokeWidth="1.8"/><T x={224} y={30} a="middle" c={BLEU} w={800}>x₂ : riche</T><T x={224} y={46} a="middle" c={GRIS}>en éthanol</T>
    <Fleche x1={76} y1={60} x2={76} y2={82} c={GRIS}/><Fleche x1={224} y1={60} x2={224} y2={82} c={GRIS}/>
    <rect x="30" y="88" width="240" height="40" rx="6" fill="#fff7ed" stroke={ORANGE} strokeWidth="2"/>
    <T x={150} y={105} a="middle" c={ORANGE} w={800}>contexte : azéotrope eau – éthanol</T><T x={150} y={121} a="middle" c={GRIS}>température en tête de colonne</T>
    <T x={150} y={152} a="middle" c={VERT} w={700}>la mesure seule ne suffit pas</T><T x={150} y={168} a="middle" c={GRIS}>il faut une autre information</T>
  </Svg>);

export const FBilanR = () => (
  <Svg h={196} aria="Bilan : la frontière donne l'indice n, on lit n avec 4 décimales, la courbe d'étalonnage donne la composition x avec deux solutions possibles, le contexte choisit, puis on convertit en fraction massique w égale x M éthanol divisé par x M éthanol plus 1 moins x M eau">
    {[['frontière (angle limite) → n', BLEU], ['lecture de n : 4 décimales', BLEU], ['courbe n = f(x) : 2 solutions', ORANGE], ['contexte → x → w, degré', VERT]].map(([t, c], i) => (
      <g key={i}><circle cx="16" cy={18 + i * 30} r="10" fill={c}/><T x={16} y={22.5 + i * 30} a="middle" c="#fff" w={800}>{i + 1}</T><T x={34} y={23 + i * 30} w={600}>{t}</T>
        {i < 3 && <Lg x1={16} y1={28 + i * 30} x2={16} y2={38 + i * 30} c={GRIS}/>}</g>))}
    <rect x="14" y="132" width="272" height="52" rx="6" fill="#ecfdf5" stroke={VERT} strokeWidth="1.5"/>
    <T x={150} y={150} a="middle" c={VERT} w={800}><I b="w = x·M" i="A"/> ÷ (<I b="x·M" i="A"/> + (1 − x)·<I b="M" i="B"/>)</T>
    <T x={150} y={170} a="middle" c={GRIS}>exemple : x = 0,50 → w ≈ 0,72</T>
  </Svg>);
