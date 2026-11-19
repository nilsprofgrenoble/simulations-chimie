// Schémas des cartes « À retenir » de la simulation 17 (circuit hydraulique). viewBox de 300, texte de 12,5.
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

export const FTroisFormes = () => (
  <Svg h={190} aria="Deux colonnes, au point A et au point B : chacune empile la pression en bleu, l'énergie d'altitude en vert et l'énergie de vitesse en orange ; les deux colonnes ont la même hauteur totale">
    <T x={150} y={16} a="middle" w={800}>même somme en A et en B</T>
    <Lg x1={14} y1={118} x2={286} y2={118} c={GRIS} w={1.8}/><Lg x1={14} y1={46} x2={286} y2={46} c={ENCRE} w={1.6} d="4 4"/>
    <T x={286} y={40} a="end" c={GRIS}>somme constante</T>
    {[[50, 'A', [44, 14, 14]], [170, 'B', [14, 34, 24]]].map(([x, n, h]) => <g key={n}>
      <rect x={x} y={118 - h[0]} width="64" height={h[0]} fill={BLEU} opacity="0.85"/>
      <rect x={x} y={118 - h[0] - h[1]} width="64" height={h[1]} fill={VERT} opacity="0.85"/>
      <rect x={x} y={118 - h[0] - h[1] - h[2]} width="64" height={h[2]} fill={ORANGE} opacity="0.85"/>
      <T x={x + 32} y={136} a="middle" w={800}>point {n}</T></g>)}
    <rect x="14" y="148" width="12" height="12" fill={BLEU}/><T x={32} y={159}>P : pression</T>
    <rect x="156" y="148" width="12" height="12" fill={VERT}/><T x={174} y={159}>ρ g z : altitude</T>
    <rect x="14" y="168" width="12" height="12" fill={ORANGE}/><T x={32} y={179}>½ ρ v² : vitesse</T>
  </Svg>);

export const FIdentite = () => (
  <Svg h={216} aria="Deux réservoirs ouverts à l'air libre reliés par un tuyau : A en bas, dont la surface est l'origine des altitudes et où l'eau est quasi immobile ; B en haut, à l'altitude delta z, où le tuyau débouche à l'air libre avec la vitesse de l'eau dans le tuyau">
    <rect x="12" y="104" width="70" height="66" fill="#bfdbfe" stroke={ENCRE} strokeWidth="2.4"/><Lg x1={12} y1={104} x2={82} y2={104} c={BLEU} w={2.4}/>
    <rect x="222" y="88" width="68" height="24" fill="#bfdbfe" stroke={ENCRE} strokeWidth="2.4"/>
    <path d="M82,158 H150 V52 H222" fill="none" stroke={GRIS} strokeWidth="7" strokeLinejoin="round"/>
    <Fleche x1={196} y1={52} x2={236} y2={52} c={BLEU} w={2.6}/><Lg x1={236} y1={58} x2={236} y2={84} c={BLEU} w={2} d="3 3"/>
    <Lg x1={12} y1={104} x2={196} y2={104} c={GRIS} w={1.4} d="4 4"/><T x={30} y={98} c={GRIS} w={800}>z = 0</T>
    <Fleche x1={186} y1={104} x2={186} y2={60} c={ORANGE} w={2.2}/><T x={192} y={88} c={ORANGE} w={800}>Δz</T>
    <T x={47} y={142} a="middle" w={800}>A</T><T x={256} y={106} a="middle" w={800}>B</T>
    <TE x={14} y={192} w={700} parts={['A : P', '_atm', ' ; z = 0 ; v ≈ 0']}/>
    <TE x={14} y={210} w={700} parts={['B : P', '_atm', ' ; z = Δz ; v = v', '_B']}/>
  </Svg>);

export const FVitesseTuyau = () => (
  <Svg h={180} aria="Tuyau horizontal : en une seconde, l'eau qui traverse une section S remplit un cylindre de longueur v ; le volume qui passe en une seconde est le débit Q V égal à S fois v">
    <T x={150} y={16} a="middle" w={800}>Que fait passer le tuyau en 1 s ?</T>
    <rect x="16" y="40" width="268" height="52" rx="6" fill="#eff6ff" stroke={ENCRE} strokeWidth="2.4"/>
    <rect x="70" y="42" width="130" height="48" fill="#93c5fd" opacity="0.8"/>
    <Lg x1={70} y1={34} x2={70} y2={98} c={ORANGE} w={2.4} d="4 3"/><T x={70} y={30} a="middle" c={ORANGE} w={800}>section S</T>
    <Fleche x1={30} y1={66} x2={62} y2={66} c={BLEU} w={2.6}/>
    <Lg x1={70} y1={108} x2={200} y2={108} c={VERT} w={2.4}/><Lg x1={70} y1={102} x2={70} y2={114} c={VERT} w={2.4}/><Lg x1={200} y1={102} x2={200} y2={114} c={VERT} w={2.4}/>
    <T x={135} y={128} a="middle" c={VERT} w={800}>longueur parcourue en 1 s : v</T>
    <TE x={150} y={156} a="middle" w={800} parts={['Q', '_V', ' = S × v']}/>
    <T x={150} y={174} a="middle" c={GRIS}>m³·s⁻¹ = m² × m·s⁻¹</T>
  </Svg>);

export const FPertesCharge = () => (
  <Svg h={200} aria="Courbe de l'énergie volumique de l'eau le long du tuyau : elle baisse en pente régulière à cause du frottement et fait des marches vers le bas à chaque coude, vanne ou filtre ; cette énergie est perdue en chaleur">
    <T x={150} y={16} a="middle" w={800}>l’énergie de l’eau baisse de A à B</T>
    <Lg x1={36} y1={156} x2={288} y2={156} c={GRIS} w={2}/><Lg x1={36} y1={156} x2={36} y2={30} c={GRIS} w={2}/>
    <path d="M36,50 L96,64 V84 L156,96 V116 L216,128 V142 L280,150" fill="none" stroke={ORANGE} strokeWidth="3.4" strokeLinejoin="round"/>
    {[96, 156, 216].map(x => <Lg key={x} x1={x} y1={x === 96 ? 64 : x === 156 ? 96 : 128} x2={x} y2={x === 96 ? 84 : x === 156 ? 116 : 142} c={ROUGE} w={4}/>)}
    <T x={140} y={68} c={ORANGE} w={800}>frottement</T><T x={46} y={136} c={ROUGE} w={800}>marche : coude, vanne…</T>
    <T x={288} y={174} a="end" c={GRIS}>distance le long du tuyau</T>
    <T x={150} y={194} a="middle" c={GRIS}>perdue en chaleur : la pompe la compense</T>
  </Svg>);

export const FBilanAB = () => (
  <Svg h={188} aria="Quatre barres : l'énergie au point A, plus le gain apporté par la pompe, moins les pertes, égale l'énergie au point B">
    <T x={150} y={16} a="middle" w={800}>A + pompe − pertes = B</T>
    <Lg x1={8} y1={118} x2={292} y2={118} c={GRIS} w={1.8}/>
    <rect x="14" y="58" width="44" height="60" fill={BLEU} opacity="0.85"/><T x={68} y={102} a="middle" w={800}>+</T>
    <rect x="80" y="82" width="44" height="36" fill={VERT} opacity="0.85"/><T x={134} y={102} a="middle" w={800}>−</T>
    <rect x="146" y="118" width="44" height="24" fill={ROUGE} opacity="0.85"/><T x={202} y={102} a="middle" w={800}>=</T>
    <rect x="222" y="46" width="44" height="72" fill={BLEU} opacity="0.85"/>
    <T x={36} y={168} a="middle" w={800}>point A</T><T x={102} y={168} a="middle" w={800} c={VERT}>pompe</T><T x={168} y={168} a="middle" w={800} c={ROUGE}>pertes</T><T x={244} y={168} a="middle" w={800}>point B</T>
    <T x={150} y={184} a="middle" c={GRIS}>pertes en négatif, sous la ligne zéro</T>
  </Svg>);

export const FBilanBern = () => {
  const L = [['Carte d’identité', ['P, z et v en A et en B']], ['Simplifier', ['pressions égales, z', '_A', ' = 0, v', '_A', ' ≈ 0']], ['Vitesse', ['v = Q', '_V', ' ÷ S, en unités SI']], ['Termes', ['chacun en Pa, puis on additionne']], ['Puissances', ['P', '_hyd', ' puis P', '_abs', ' = P', '_hyd', ' ÷ η']]];
  return (
    <Svg h={236} aria="Méthode : écrire la carte d'identité des points A et B, simplifier la relation, calculer la vitesse, calculer chaque terme en pascals puis les additionner, enfin calculer la puissance hydraulique et la puissance absorbée">
      {L.map(([a, b], i) => <g key={a}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        <T x={48} y={23 + i * 44} w={800}>{a}</T><TE x={48} y={38 + i * 44} c={GRIS} parts={b}/></g>)}
    </Svg>);
};
