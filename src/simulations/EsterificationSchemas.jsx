// Schémas des cartes « À retenir » de la simulation 86 (estérification, Dean-Stark, CCM). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const TE = ({ x, y, parts, a = 'start', c = ENCRE, w = 400 }) => (
  <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>
    {parts.map((p, i) => p[0] === '_'
      ? <tspan key={i} fontSize="9.5" dy="3">{p.slice(1)}</tspan>
      : <tspan key={i} dy={i && parts[i - 1][0] === '_' ? -3 : 0}>{p}</tspan>)}
  </text>);
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.6 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

export const FEquilibre = () => (
  <Svg h={196} aria="Avancement de l'estérification au cours du temps : avec catalyseur et chauffage la quantité d'ester atteint très vite un plateau ; sans eux, elle atteint le même plateau, beaucoup plus lentement">
    <T x={150} y={16} a="middle" w={800}>RCOOH + R′OH ⇌ RCOOR′ + H₂O</T>
    <Lg x1={36} y1={156} x2={288} y2={156} c={GRIS} w={2}/><Lg x1={36} y1={156} x2={36} y2={34} c={GRIS} w={2}/>
    <T x={42} y={46} c={GRIS}>n(ester)</T><T x={288} y={174} a="end" c={GRIS}>t</T>
    <Lg x1={36} y1={72} x2={288} y2={72} c={GRIS} w={1.6} d="4 4"/>
    <path d="M36,156 C58,92 86,74 130,72 L288,72" fill="none" stroke={ORANGE} strokeWidth="3.4"/>
    <path d="M36,156 C110,140 200,96 288,74" fill="none" stroke={BLEU} strokeWidth="3.4"/>
    <T x={96} y={110} c={ORANGE} w={800}>catalyseur + chauffage</T><T x={150} y={136} c={BLEU} w={800}>sans</T>
    <T x={288} y={64} a="end" c={GRIS}>équilibre</T>
    <T x={150} y={192} a="middle" w={800} c={GRIS}>même équilibre, atteint plus vite</T>
  </Svg>);

export const FDeplacer = () => (
  <Svg h={184} aria="Pour augmenter le rendement, on pousse l'équilibre dans le sens direct : en ajoutant un excès de réactif à gauche, ou en retirant l'eau à droite avec un Dean-Stark ; le quotient de réaction devient inférieur à K">
    <TE x={150} y={16} a="middle" w={800} parts={['Q', '_r', ' < K  ⇒  sens direct']}/>
    <rect x="10" y="72" width="104" height="44" rx="8" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><T x={62} y={99} a="middle" w={800} c={BLEU}>acide + alcool</T>
    <rect x="186" y="72" width="104" height="44" rx="8" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><T x={238} y={99} a="middle" w={800} c={ORANGE}>ester + eau</T>
    <Fleche x1={120} y1={94} x2={180} y2={94} c={VERT} w={3.4}/><T x={150} y={84} a="middle" c={VERT} w={800}>direct</T>
    <T x={62} y={40} a="middle" w={800}>excès d’alcool</T><Fleche x1={62} y1={46} x2={62} y2={68} c={BLEU} w={3}/>
    <Fleche x1={238} y1={120} x2={238} y2={144} c={ROUGE} w={3}/><T x={238} y={162} a="middle" w={800} c={ROUGE}>eau retirée</T><T x={238} y={178} a="middle" c={GRIS}>(Dean-Stark)</T>
    <T x={62} y={146} a="middle" c={GRIS}>on ajoute</T><T x={62} y={162} a="middle" c={GRIS}>un réactif</T>
  </Svg>);

export const FDeanStark = () => (
  <Svg h={224} aria="Montage à reflux avec Dean-Stark : le ballon chauffé contient le mélange et le cyclohexane ; les vapeurs montent, se condensent dans le réfrigérant et tombent dans le décanteur gradué ; l'eau, plus dense, se dépose en bas ; le cyclohexane retourne dans le ballon">
    <rect x="60" y="12" width="26" height="72" rx="3" fill="#e0f2fe" stroke={BLEU} strokeWidth="2"/>
    <T x={96} y={38} c={BLEU} w={800}>réfrigérant</T><T x={96} y={54} c={GRIS}>condense les vapeurs</T>
    <rect x="66" y="84" width="14" height="64" fill="#f1f5f9" stroke={GRIS} strokeWidth="2"/>
    <path d="M80 100 L161 100 L161 112" fill="none" stroke={GRIS} strokeWidth="2.4"/><Lg x1={80} y1={124} x2={144} y2={124} c={GRIS} w={2.4}/>
    <rect x="144" y="112" width="34" height="72" rx="3" fill="#fef9c3" stroke={GRIS} strokeWidth="2"/><rect x="144" y="154" width="34" height="30" fill="#93c5fd"/><Lg x1={144} y1={154} x2={178} y2={154} c="#1d4ed8" w={1.6}/>
    <T x={186} y={134} c="#92400e" w={800}>cyclohexane</T><T x={186} y={170} c="#1d4ed8" w={800}>eau (plus dense)</T><T x={186} y={186} c={GRIS}>volume gradué</T>
    <circle cx="73" cy="176" r="28" fill="#fde68a" stroke={GRIS} strokeWidth="2"/><T x={73} y={180} a="middle" w={800} c="#92400e">ballon</T>
    <Lg x1={42} y1={210} x2={104} y2={210} c={ROUGE} w={4}/><T x={112} y={214} c={ROUGE} w={800}>chauffage</T>
  </Svg>);

export const FCcm = () => (
  <Svg h={218} aria="Plaque de CCM : trois taches, acide, alcool et ester, à des hauteurs différentes entre la ligne de dépôt et le front de l'éluant ; d est la distance parcourue par la tache, L celle du front ; plus l'espèce est polaire, plus elle est retenue et plus son rapport frontal est petit">
    <rect x="52" y="20" width="176" height="150" rx="4" fill="#f8fafc" stroke={GRIS} strokeWidth="2"/>
    <Lg x1={52} y1={34} x2={228} y2={34} c={BLEU} w={1.8} d="5 4"/><T x={58} y={30} c={BLEU}>front de l’éluant</T>
    <Lg x1={52} y1={152} x2={228} y2={152} c={GRIS} w={1.8} d="5 4"/><T x={58} y={166} c={GRIS}>dépôt</T>
    {[[84, 136, 'acide', ROUGE], [140, 108, 'alcool', ORANGE], [196, 64, 'ester', VERT]].map(([x, y, n, c]) => <g key={n}><ellipse cx={x} cy={y} rx="14" ry="9" fill={c} opacity="0.85"/><T x={x} y={192} a="middle" w={800} c={c}>{n}</T></g>)}
    <Fleche x1={240} y1={152} x2={240} y2={66} c={VERT} w={2.4}/><T x={250} y={112} c={VERT} w={800}>d</T>
    <Fleche x1={38} y1={152} x2={38} y2={34} c={BLEU} w={2.4}/><T x={14} y={96} c={BLEU} w={800}>L</T>
    <T x={150} y={212} a="middle" c={GRIS}>plus polaire ⇒ plus retenu ⇒ Rf plus petit</T>
  </Svg>);

export const FPertes = () => (
  <Svg h={184} aria="Trois barres décroissantes : l'ester obtenu en fin de réaction, puis après les lavages, puis après la distillation ; chaque étape de traitement perd un peu d'ester, donc le rendement global est inférieur à celui de la réaction">
    <T x={150} y={16} a="middle" w={800}>Chaque étape perd un peu d’ester</T>
    <Lg x1={14} y1={140} x2={286} y2={140} c={GRIS} w={1.8}/>
    {[[30, 96, BLEU, 'réaction'], [118, 84, VERT, 'lavages'], [206, 70, ORANGE, 'distillation']].map(([x, h, c, n]) => <g key={n}><rect x={x} y={140 - h} width="64" height={h} fill={c} opacity="0.85"/><T x={x + 32} y={158} a="middle" w={800} c={c}>{n}</T></g>)}
    <Fleche x1={98} y1={52} x2={122} y2={66} c={ROUGE} w={2.2}/><Fleche x1={186} y1={66} x2={210} y2={80} c={ROUGE} w={2.2}/>
    <T x={108} y={44} a="middle" c={ROUGE} w={800}>pertes</T><T x={196} y={58} a="middle" c={ROUGE} w={800}>pertes</T>
    <T x={150} y={178} a="middle" c={GRIS}>quantité d’ester isolé</T>
  </Svg>);

export const FBilanEst = () => {
  const L = [['Équilibre', 'lente, limitée ; K ≈ 4'], ['Déplacer l’équilibre', 'excès, ou eau retirée'], ['Dean-Stark', 'eau recueillie = ester formé'], ['CCM', 'Rf = d ÷ L ; polaire = retenu'], ['Rendement', 'ester obtenu ÷ ester maximal']];
  return (
    <Svg h={236} aria="Bilan : l'estérification est lente et limitée ; on déplace l'équilibre par un excès de réactif ou en retirant l'eau ; le Dean-Stark mesure l'eau, donc l'ester formé ; la CCM suit la réaction ; le rendement compare l'ester obtenu à l'ester maximal">
      {L.map(([a, b], i) => <g key={a}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        <T x={48} y={23 + i * 44} w={800}>{a}</T><T x={48} y={38 + i * 44} c={GRIS}>{b}</T></g>)}
    </Svg>);
};
