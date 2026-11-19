// Schémas des cartes « À retenir » de la simulation 15 (quantum du CAN). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.2"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

export const FMontage = () => (
  <Svg h={160} aria="Montage du TP : la thermistance CTN est reliée à l'alimentation 5 V, une résistance de 10 kilo-ohms à la masse ; la tension Ur aux bornes de la résistance est lue sur l'entrée A0 de la carte Arduino ; quand la température monte, la résistance de la CTN diminue">
    <Lg x1={90} y1={16} x2={130} y2={16}/><T x={8} y={20} c="#b45309" w={800}>+5 V</T><Lg x1={110} y1={16} x2={110} y2={32}/>
    <rect x="96" y="32" width="28" height="40" fill="#fef3c7" stroke="#b45309" strokeWidth="2.5"/>
    <T x={134} y={50} c="#92400e" w={800}>CTN</T><T x={134} y={67} c="#92400e">R↘ si T↗</T>
    <Lg x1={110} y1={72} x2={110} y2={86}/><circle cx="110" cy="86" r="3.5" fill={ENCRE}/><Lg x1={110} y1={86} x2={64} y2={86} c={BLEU} w={2.5}/>
    <T x={8} y={80} c={BLEU} w={800}>Uᵣ → A0</T>
    <Lg x1={110} y1={86} x2={110} y2={96}/><rect x="96" y="96" width="28" height="34" fill="#e0f2fe" stroke="#0369a1" strokeWidth="2.5"/>
    <T x={134} y={118} c="#0369a1" w={800}>R = 10 kΩ</T>
    <Lg x1={110} y1={130} x2={110} y2={142}/><Lg x1={92} y1={142} x2={128} y2={142} w={2.5}/><Lg x1={98} y1={147} x2={122} y2={147}/><T x={136} y={150} c={GRIS}>masse</T>
  </Svg>);

export const FQuantum = () => {
  const x = k => 30 + k * 36, y = k => 130 - k * 13;
  const pts = []; for (let k = 0; k < 7; k++) { pts.push(`${x(k)},${y(k)}`, `${x(k + 1)},${y(k)}`); } pts.push(`${x(7)},${y(7)}`);
  return (
    <Svg h={196} aria="Escalier d'un CAN à 3 bits : N prend les valeurs entières de 0 à 7 quand la tension Ur va de 0 à 5 V ; chaque marche a la largeur du quantum q, égal à 5 divisé par 7, soit 0,71 V ; deux tensions dans la même marche donnent le même N">
      <T x={150} y={14} a="middle" c={GRIS} w={700}>exemple : n = 3 bits</T>
      <Lg x1={30} y1={136} x2={284} y2={136} c={GRIS} w={1.5}/><Lg x1={30} y1={136} x2={30} y2={36} c={GRIS} w={1.5}/>
      <polyline points={pts.join(' ')} fill="none" stroke={BLEU} strokeWidth="3" strokeLinejoin="round"/>
      <T x={22} y={140} a="end" c={GRIS}>0</T><T x={22} y={48} a="end" c={GRIS}>7</T><T x={22} y={30} a="end" c={ORANGE} w={800}>N</T>
      <T x={30} y={152} a="middle" c={GRIS}>0 V</T><T x={284} y={152} a="end" c={GRIS}>5 V</T><T x={150} y={152} a="middle" c={GRIS}>Uᵣ</T>
      <Fleche x1={x(2) + 3} y1={166} x2={x(3) - 3} y2={166} c={ORANGE}/><Fleche x1={x(3) - 3} y1={166} x2={x(2) + 3} y2={166} c={ORANGE}/>
      <T x={x(3) + 12} y={170} c={ORANGE} w={800}>q = 5 ÷ 7 = 0,71 V</T>
      <T x={150} y={190} a="middle" c={GRIS}>même marche : même N</T>
    </Svg>);
};

export const FModele = () => {
  const P = [[50, 112], [80, 104], [110, 90], [140, 70], [170, 50], [200, 38], [230, 32], [260, 30]];
  return (
    <Svg h={194} aria="Choisir un modèle : les points mesurés forment une courbe ; le modèle d'ordre 1, une droite, s'en écarte jusqu'à plusieurs degrés ; le modèle d'ordre 3 suit les points ; il faut juger sur l'écart maximal en degrés Celsius, pas seulement sur R au carré">
      <Lg x1={30} y1={124} x2={284} y2={124} c={GRIS} w={1.5}/><Lg x1={30} y1={124} x2={30} y2={16} c={GRIS} w={1.5}/>
      <T x={36} y={22} c={GRIS}>T (°C)</T><T x={284} y={140} a="end" c={GRIS}>Uᵣ (V)</T>
      <Lg x1={50} y1={112} x2={260} y2={30} c={ROUGE} w={2.2} d="6 4"/>
      <polyline points={P.map(p => p.join(',')).join(' ')} fill="none" stroke={VERT} strokeWidth="3" strokeLinejoin="round"/>
      {P.map(([px, py]) => <circle key={px} cx={px} cy={py} r="4.2" fill={ORANGE}/>)}
      <Lg x1={196} y1={38} x2={196} y2={53} c={ENCRE} w={2}/><T x={206} y={74} c={ENCRE} w={700}>écart max</T>
      <Lg x1={14} y1={156} x2={34} y2={156} c={ROUGE} w={2.2} d="6 4"/><T x={40} y={160} c={ROUGE} w={700}>ordre 1 : droite</T>
      <Lg x1={156} y1={156} x2={176} y2={156} c={VERT} w={3}/><T x={182} y={160} c={VERT} w={700}>ordre 3</T>
      <T x={150} y={188} a="middle" c={GRIS}>juger sur l’écart max, pas sur R²</T>
    </Svg>);
};

export const FResolution = () => (
  <Svg h={182} aria="La résolution en température dépend de la pente : pour le même quantum q sur l'axe de la tension, la courbe plate donne un petit écart de température et la courbe pentue un grand écart de température">
    <T x={8} y={14} c={GRIS} w={700}>T</T>
    <Lg x1={70} y1={126} x2={284} y2={126} c={GRIS} w={1.5}/><Lg x1={70} y1={126} x2={70} y2={12} c={GRIS} w={1.5}/>
    <polyline points="70,120 110,112 150,96 190,70 230,40 270,18" fill="none" stroke={BLEU} strokeWidth="3" strokeLinejoin="round"/>
    {[[100, 120, 114, 108, 'ΔT petit', VERT], [210, 230, 55, 40, 'ΔT grand', ROUGE]].map(([xa, xb, ya, yb, t, c]) => (
      <g key={t}><Lg x1={xa} y1={126} x2={xa} y2={ya} c={c} w={1.4} d="4 3"/><Lg x1={xb} y1={126} x2={xb} y2={yb} c={c} w={1.4} d="4 3"/>
        <Lg x1={70} y1={ya} x2={xa} y2={ya} c={c} w={1.4} d="4 3"/><Lg x1={70} y1={yb} x2={xb} y2={yb} c={c} w={1.4} d="4 3"/>
        <Lg x1={62} y1={ya} x2={62} y2={yb} c={c} w={3}/><T x={56} y={(ya + yb) / 2 + 4} a="end" c={c} w={700}>{t}</T>
        <Lg x1={xa} y1={134} x2={xb} y2={134} c={ORANGE} w={3}/><T x={(xa + xb) / 2} y={150} a="middle" c={ORANGE} w={800}>q</T></g>))}
    <T x={150} y={174} a="middle" c={GRIS}>même q, pente plus forte : ΔT plus grand</T>
  </Svg>);

export const FAffichee = () => (
  <Svg h={184} aria="Température affichée : le CAN garde la partie entière de Ur divisé par q, donc la chaîne affiche la température associée à la tension N fois q, située juste à gauche de Ur ; la température réelle est comprise entre celles de N fois q et de N plus 1 fois q">
    <rect x="96" y="40" width="124" height="30" fill="#ffedd5"/>
    <Lg x1={24} y1={70} x2={280} y2={70} c={GRIS} w={1.5}/>
    {[96, 220].map(px => <Lg key={px} x1={px} y1={34} x2={px} y2={76} c={BLEU} w={2.5}/>)}
    <T x={96} y={92} a="middle" c={BLEU} w={700}>N × q</T><T x={220} y={92} a="middle" c={BLEU} w={700}>(N+1) × q</T>
    <circle cx="170" cy="70" r="5" fill={ORANGE}/><T x={170} y={34} a="middle" c={ORANGE} w={800}>Uᵣ</T>
    <Fleche x1={160} y1={54} x2={102} y2={54} c={ORANGE}/><T x={131} y={46} a="middle" c={ORANGE}>tronqué</T>
    <T x={150} y={122} a="middle" c={ENCRE} w={700}>N = partie entière de Uᵣ ÷ q</T>
    <T x={150} y={142} a="middle" c={VERT} w={700}>affiché : T(N × q), pas T(Uᵣ)</T>
    <T x={150} y={164} a="middle" c={GRIS}>T réelle : entre T(N × q) et T((N+1) × q)</T>
  </Svg>);

export const FMethodeCAN = () => (
  <Svg h={176} aria="La démarche : calculer le quantum q, trouver N par la partie entière de Ur divisé par q, lire la température affichée T de N fois q, puis la résolution en température delta T égale q fois la valeur absolue de dT sur dUr ; l'exactitude dépend aussi de l'étalonnage, du capteur, du bruit">
    {[['q = (Vmax − Vmin) ÷ (2ⁿ − 1)', BLEU], ['N = partie entière de Uᵣ ÷ q', BLEU], ['T affichée = T(N × q)', ORANGE], ['ΔT ≈ q × |dT ÷ dUᵣ|', VERT]].map(([t, c], i) => (
      <g key={i}><circle cx="16" cy={20 + i * 30} r="10" fill={c}/><T x={16} y={24.5 + i * 30} a="middle" c="#fff" w={800}>{i + 1}</T><T x={34} y={24.5 + i * 30} c={ENCRE} w={600}>{t}</T>
        {i < 3 && <Lg x1={16} y1={31 + i * 30} x2={16} y2={39 + i * 30} c={GRIS}/>}</g>))}
    <T x={150} y={150} a="middle" c={GRIS}>exactitude : aussi étalonnage,</T><T x={150} y={168} a="middle" c={GRIS}>capteur, bruit, dérive</T>
  </Svg>);
