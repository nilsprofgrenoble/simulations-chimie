// Schémas des cartes « À retenir » de la simulation 11 (dosage par étalonnage). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
const Pt = ({ x, y, c = BLEU, r = 4.5 }) => <circle cx={x} cy={y} r={r} fill={c}/>;
const Fiole = ({ x, y, c = BLEU }) => <g><path d={`M${x - 6},${y} L${x - 6},${y + 14} L${x - 18},${y + 40} Q${x - 20},${y + 46} ${x - 14},${y + 46} L${x + 14},${y + 46} Q${x + 20},${y + 46} ${x + 18},${y + 40} L${x + 6},${y + 14} L${x + 6},${y} Z`} fill="#fff" stroke={c} strokeWidth="2"/><Lg x1={x - 8} y1={y + 30} x2={x + 8} y2={y + 30} c={c} w={1.6}/></g>;
const Axes = ({ x0 = 40, y0 = 150, x1 = 280, y1 = 14, lx = 'C', ly = 'A' }) => <g><Lg x1={x0} y1={y0} x2={x1} y2={y0} c={GRIS} w={1.8}/><Lg x1={x0} y1={y0} x2={x0} y2={y1} c={GRIS} w={1.8}/><T x={x1} y={y0 + 16} a="end" c={GRIS} w={700}>{lx}</T><T x={x0 - 6} y={y1 + 4} a="end" c={GRIS} w={700}>{ly}</T></g>;
const Boite = ({ x, y, w, h = 30, t, c = BLEU }) => <g><rect x={x} y={y} width={w} height={h} rx="6" fill="#fff" stroke={c} strokeWidth="2"/><T x={x + w / 2} y={y + h / 2 + 4.5} a="middle" c={c} w={800}>{t}</T></g>;

export const FGamme = () => (
  <Svg h={190} aria="Préparer la gamme : on prélève un volume de la solution de référence avec une pipette ou une micropipette et on complète une fiole jaugée pour obtenir un étalon ; la gamme de cinq étalons encadre la concentration attendue de l'échantillon, de préférence vers son milieu">
    <Boite x={8} y={8} w={86} t="S référence" c={ORANGE}/><Fleche x1={96} y1={23} x2={150} y2={23} c={ORANGE}/><T x={123} y={16} a="middle" c={ORANGE} w={700}>V prélevé</T>
    <Fiole x={186} y={6} c={BLEU}/><T x={212} y={32} c={BLEU} w={700}>étalon</T><T x={212} y={48} c={GRIS}>fiole jaugée</T>
    <Lg x1={14} y1={128} x2={286} y2={128} c={GRIS} w={1.8}/>
    {[50, 100, 150, 200, 250].map(x => <Pt key={x} x={x} y={128} c={BLEU}/>)}
    <path d="M26,142 L26,148 L274,148 L274,142" fill="none" stroke={BLEU} strokeWidth="1.8"/><T x={150} y={166} a="middle" c={BLEU} w={700}>gamme d’étalons</T>
    <polygon points="170,118 164,106 176,106" fill={ORANGE}/><T x={170} y={98} a="middle" c={ORANGE} w={800}>échantillon attendu</T>
    <T x={150} y={186} a="middle" c={GRIS}>à encadrer, vers le milieu</T>
  </Svg>);

export const FRepet = () => (
  <Svg h={206} aria="Répétitions : deux injections de la même fiole ne mesurent que la répétabilité de l'injection, l'erreur de préparation étant commune ; deux fioles indépendantes contiennent aussi l'erreur de préparation">
    {[[8, 'même fiole', ORANGE], [158, 'fioles indépendantes', VERT]].map(([x, n, c]) => <g key={n}><rect x={x} y="6" width="134" height="150" rx="8" fill="#fff" stroke={c} strokeWidth="2"/><T x={x + 67} y={26} a="middle" c={c} w={800}>{n}</T></g>)}
    <Fiole x={75} y={38} c={ORANGE}/><Fleche x1={92} y1={96} x2={112} y2={130} c={GRIS} w={1.8}/><Fleche x1={58} y1={96} x2={38} y2={130} c={GRIS} w={1.8}/><T x={75} y={146} a="middle" c={GRIS}>2 injections</T>
    <Fiole x={196} y={38} c={VERT}/><Fiole x={256} y={38} c={VERT}/><T x={226} y={146} a="middle" c={GRIS}>1 injection chacune</T>
    <T x={75} y={178} a="middle" c={ORANGE} w={800}>préparation commune</T><T x={75} y={196} a="middle" c={GRIS}>répétabilité de l’injection</T>
    <T x={226} y={178} a="middle" c={VERT} w={800}>préparation incluse</T><T x={226} y={196} a="middle" c={GRIS}>toute la variabilité</T>
  </Svg>);

export const FOrdreGrandeur = () => (
  <Svg h={226} aria="De la teneur annoncée à la concentration injectée : la masse de crème multipliée par la teneur donne la masse de caféine attendue ; divisée par le volume de la fiole en litres, elle donne la concentration de la solution mère ; divisée par le facteur de dilution, elle donne la concentration injectée">
    {[['masse de crème', GRIS], ['masse de caféine', BLEU], ['C solution mère', BLEU], ['C injectée', VERT]].map(([t, c], i) => <Boite key={t} x={60} y={6 + i * 56} w={150} h={32} t={t} c={c}/>)}
    {['× teneur annoncée', '÷ V de la fiole (en L)', '÷ F (dilution)'].map((t, i) => <g key={t}><Fleche x1={135} y1={40 + i * 56} x2={135} y2={60 + i * 56} c={ORANGE} w={2.4}/><T x={148} y={55 + i * 56} c={ORANGE} w={700}>{t}</T></g>)}
  </Svg>);

export const FDroite = () => (
  <Svg h={198} aria="Droite d'étalonnage : le signal A est porté en fonction de la concentration C des étalons ; les points sont presque alignés sur la droite A égale a C plus b ; la pente a est la sensibilité, b l'ordonnée à l'origine ; la droite n'est valable que dans le domaine de la gamme">
    <Axes y0={150} lx="C" ly="A"/>
    <Lg x1={40} y1={134} x2={250} y2={28} c={ORANGE} w={2.6}/>
    {[[70, 119], [110, 100], [150, 84], [190, 60], [230, 41]].map(([x, y]) => <Pt key={x} x={x} y={y}/>)}
    <Lg x1={150} y1={84} x2={190} y2={84} c={GRIS} w={1.4} d="3 3"/><Lg x1={190} y1={84} x2={190} y2={64} c={GRIS} w={1.4} d="3 3"/><T x={196} y={78} c={GRIS} w={700}>pente a</T>
    <T x={46} y={128} c={ORANGE} w={700}>b</T>
    <path d="M60,164 L60,170 L240,170 L240,164" fill="none" stroke={BLEU} strokeWidth="1.8"/><T x={150} y={188} a="middle" c={BLEU} w={700}>domaine de la gamme : pas d’extrapolation</T>
  </Svg>);

export const FResidus = () => (
  <Svg h={214} aria="Valider la linéarité : des résidus répartis au hasard autour de zéro valident le modèle linéaire ; des résidus en forme de courbe révèlent un défaut du modèle, même si R carré est proche de 1">
    <T x={14} y={16} c={VERT} w={800}>résidus aléatoires : modèle accepté</T>
    <Lg x1={14} y1={56} x2={286} y2={56} c={GRIS} w={1.4} d="4 3"/>
    {[[40, 44], [90, 64], [140, 50], [190, 62], [240, 48]].map(([x, y]) => <Pt key={x} x={x} y={y} c={VERT}/>)}
    <T x={14} y={100} c={ROUGE} w={800}>résidus en courbe : défaut du modèle</T>
    <Lg x1={14} y1={142} x2={286} y2={142} c={GRIS} w={1.4} d="4 3"/>
    {[[40, 124], [90, 138], [140, 156], [190, 138], [240, 122]].map(([x, y]) => <Pt key={x} x={x} y={y} c={ROUGE}/>)}
    <T x={150} y={186} a="middle" w={800}>R² proche de 1 dans les deux cas</T><T x={150} y={204} a="middle" c={GRIS}>on regarde aussi les résidus</T>
  </Svg>);

export const FFisher = () => (
  <Svg h={196} aria="Test de Fisher : si F est inférieur à F critique, la linéarité n'est pas rejetée ; si F est supérieur à F critique, elle est rejetée ; avec la même fiole, le test rejette à tort car la dispersion des répétitions est trop petite">
    <Lg x1={14} y1={70} x2={286} y2={70} c={GRIS} w={1.8}/><Lg x1={160} y1={52} x2={160} y2={88} c={ORANGE} w={2.6}/><T x={160} y={44} a="middle" c={ORANGE} w={800}>F critique</T>
    <Pt x={80} y={70} c={VERT} r={6}/><T x={80} y={96} a="middle" c={VERT} w={800}>F</T><T x={80} y={114} a="middle" c={VERT} w={700}>linéarité acceptée</T>
    <Pt x={240} y={70} c={ROUGE} r={6}/><T x={240} y={96} a="middle" c={ROUGE} w={800}>F</T><T x={240} y={114} a="middle" c={ROUGE} w={700}>rejetée</T>
    <T x={150} y={148} a="middle" w={800}>même fiole : rejet à tort possible</T><T x={150} y={168} a="middle" c={GRIS}>dispersion des répétitions trop petite</T><T x={150} y={188} a="middle" c={VERT} w={800}>→ fioles indépendantes</T>
  </Svg>);

export const FInversion = () => (
  <Svg h={196} aria="Lire la concentration de l'échantillon : on part du signal moyen de l'échantillon sur l'axe du signal, on rejoint la droite d'étalonnage, puis on descend sur l'axe des concentrations ; la concentration est le signal moins l'ordonnée à l'origine, divisé par la pente">
    <Axes y0={150} lx="C" ly="A"/>
    <Lg x1={40} y1={134} x2={250} y2={28} c={BLEU} w={2.6}/>
    <Lg x1={40} y1={72} x2={168} y2={72} c={ORANGE} w={1.8} d="4 3"/><Lg x1={168} y1={72} x2={168} y2={150} c={ORANGE} w={1.8} d="4 3"/>
    <Fleche x1={64} y1={72} x2={100} y2={72} c={ORANGE} w={2}/><Fleche x1={168} y1={104} x2={168} y2={140} c={ORANGE} w={2}/>
    <Pt x={168} y={72} c={ORANGE} r={5.5}/>
    <T x={44} y={64} c={ORANGE} w={800}>A éch</T><T x={168} y={168} a="middle" c={ORANGE} w={800}>C éch</T>
    <T x={150} y={190} a="middle" c={GRIS}>dans le domaine de la gamme</T>
  </Svg>);

export const FRemontee = () => (
  <Svg h={226} aria="De la concentration injectée à la teneur : on multiplie par le facteur de dilution pour obtenir la concentration de la solution mère, par le volume de la fiole en litres pour obtenir la masse de caféine, puis on divise par la masse de crème et on multiplie par 100">
    {[['C injectée', VERT], ['C solution mère', BLEU], ['masse de caféine', BLEU], ['teneur en %', ORANGE]].map(([t, c], i) => <Boite key={t} x={60} y={6 + i * 56} w={150} h={32} t={t} c={c}/>)}
    {['× F (dilution)', '× V de la fiole (en L)', '÷ masse de crème × 100'].map((t, i) => <g key={t}><Fleche x1={135} y1={40 + i * 56} x2={135} y2={60 + i * 56} c={ORANGE} w={2.4}/><T x={148} y={55 + i * 56} c={ORANGE} w={700}>{t}</T></g>)}
  </Svg>);

export const FLimites = () => (
  <Svg h={206} aria="Limites de détection et de quantification : le bruit est l'écart-type de l'ordonnée à l'origine ; la limite de détection correspond à un signal trois fois plus grand que ce bruit au-dessus de l'ordonnée à l'origine, la limite de quantification à dix fois, ramenés en concentration en divisant par la pente">
    <Axes y0={160} lx="C" ly="A"/>
    <rect x="40" y="146" width="240" height="14" fill="#fee2e2" opacity="0.8"/><T x={284} y={142} a="end" c={ROUGE} w={700}>bruit</T>
    <Lg x1={40} y1={160} x2={240} y2={28} c={BLEU} w={2.6}/>
    <Lg x1={40} y1={134} x2={88} y2={134} c={GRIS} w={1.4} d="4 3"/><Lg x1={88} y1={134} x2={88} y2={160} c={GRIS} w={1.4} d="4 3"/><T x={88} y={178} a="middle" c={GRIS} w={800}>LD</T><T x={50} y={128} c={GRIS} w={700}>3 s(b)</T>
    <Lg x1={40} y1={78} x2={162} y2={78} c={ORANGE} w={1.4} d="4 3"/><Lg x1={162} y1={78} x2={162} y2={160} c={ORANGE} w={1.4} d="4 3"/><T x={162} y={178} a="middle" c={ORANGE} w={800}>LQ</T><T x={50} y={72} c={ORANGE} w={700}>10 s(b)</T>
    <T x={150} y={202} a="middle" c={GRIS}>signal ÷ pente a = concentration</T>
  </Svg>);
