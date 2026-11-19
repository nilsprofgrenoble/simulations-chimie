// Schémas des cartes « À retenir » de la simulation 74 (mailles cristallines). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0072b2', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', VIOLET = '#7c3aed';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const I = ({ b, i }) => <>{b}<tspan fontSize="9.5" dy="3">{i}</tspan><tspan dy="-3">{' '}</tspan></>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Ch = ({ n, c, y, t }) => <g><circle cx="16" cy={y} r="10" fill={c}/><T x={16} y={y + 4.5} a="middle" c="#fff" w={800}>{n}</T><T x={34} y={y + 5} w={600}>{t}</T></g>;

export const FReseau = () => (
  <Svg h={198} aria="Réseau, motif et maille : les nœuds du réseau se déduisent par translation ; le motif, ici un grand et un petit atome, est placé sur chaque nœud ; la maille, carré en pointillés, reconstruit tout le cristal par translation">
    {[0, 1, 2, 3].flatMap(i => [0, 1, 2].map(j => { const x = 50 + i * 60, y = 30 + j * 46; return <g key={`${i}${j}`}><circle cx={x} cy={y} r="3" fill={GRIS}/><circle cx={x} cy={y} r="9" fill={BLEU} fillOpacity="0.75"/><circle cx={x + 11} cy={y + 8} r="5" fill={ORANGE}/></g>; }))}
    <rect x="110" y="76" width="60" height="46" fill="none" stroke={VERT} strokeWidth="2.6" strokeDasharray="6 4"/>
    <T x={140} y={152} a="middle" c={VERT} w={800}>maille</T>
    <T x={12} y={176} c={GRIS}>nœud : point du réseau</T><T x={12} y={193} c={ORANGE} w={700}>motif : 2 atomes sur chaque nœud</T>
  </Svg>);

export const FComptage = () => (
  <Svg h={212} aria="Compter les atomes en propre : un atome au sommet compte un huitième, au milieu d'une arête un quart, au centre d'une face un demi, à l'intérieur un ; cubique simple un atome, cubique centré deux, cubique à faces centrées quatre">
    {[['sommet', '1/8'], ['arête', '1/4'], ['face', '1/2'], ['intérieur', '1']].map(([t, f], k) => <g key={t}>
      <rect x={10 + k * 72} y={10} width="64" height="52" rx="6" fill="#eef6ff" stroke={BLEU} strokeWidth="1.6"/>
      <T x={42 + k * 72} y={30} a="middle" c={BLEU} w={700}>{t}</T><T x={42 + k * 72} y={52} a="middle" c={ORANGE} w={800}>{f}</T></g>)}
    {[['CS', '8 × 1/8', '= 1', BLEU], ['CC', '8 × 1/8 + 1', '= 2', VIOLET], ['CFC', '8 × 1/8 + 6 × 1/2', '= 4', VERT]].map(([s, f, r, c], k) => <g key={s}>
      <rect x="10" y={78 + k * 36} width="280" height="30" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
      <T x={22} y={98 + k * 36} c={c} w={800}>{s}</T><T x={62} y={98 + k * 36}>{f}</T><T x={278} y={98 + k * 36} a="end" c={c} w={800}>{r}</T></g>)}
    <T x={150} y={202} a="middle" c={GRIS}>atomes en propre par maille</T>
  </Svg>);

export const FContact = () => (
  <Svg h={206} aria="Contact entre sphères dures : cubique simple, les atomes se touchent le long de l'arête, a égale 2 R ; cubique centré, le long de la diagonale du cube, a racine de 3 égale 4 R ; cubique à faces centrées, le long de la diagonale d'une face, a racine de 2 égale 4 R">
    <defs>{[0, 1, 2].map(k => <clipPath key={k} id={`cm${k}`}><rect x={12 + k * 96} y={20} width="72" height={k === 1 ? 100 : 72}/></clipPath>)}</defs>
    <T x={48} y={14} a="middle" c={BLEU} w={800}>CS</T><T x={144} y={14} a="middle" c={VIOLET} w={800}>CC</T><T x={240} y={14} a="middle" c={VERT} w={800}>CFC</T>
    <g clipPath="url(#cm0)">{[[12, 20], [84, 20], [12, 92], [84, 92]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="36" fill={BLEU} fillOpacity="0.25" stroke={BLEU} strokeWidth="1.4"/>)}</g>
    <rect x="12" y="20" width="72" height="72" fill="none" stroke={GRIS} strokeWidth="1.6"/><Lg x1={12} y1={20} x2={84} y2={20} c={ORANGE} w={2.6}/>
    <g clipPath="url(#cm1)">{[[108, 20], [180, 20], [108, 120], [180, 120], [144, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="31" fill={VIOLET} fillOpacity="0.22" stroke={VIOLET} strokeWidth="1.4"/>)}</g>
    <rect x="108" y="20" width="72" height="100" fill="none" stroke={GRIS} strokeWidth="1.6"/><Lg x1={108} y1={20} x2={180} y2={120} c={ORANGE} w={2.6}/>
    <g clipPath="url(#cm2)">{[[204, 20], [276, 20], [204, 92], [276, 92], [240, 56]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="25.5" fill={VERT} fillOpacity="0.22" stroke={VERT} strokeWidth="1.4"/>)}</g>
    <rect x="204" y="20" width="72" height="72" fill="none" stroke={GRIS} strokeWidth="1.6"/><Lg x1={204} y1={20} x2={276} y2={92} c={ORANGE} w={2.6}/>
    <T x={48} y={146} a="middle" c={ORANGE} w={800}>a = 2R</T><T x={144} y={146} a="middle" c={ORANGE} w={800}>a√3 = 4R</T><T x={240} y={146} a="middle" c={ORANGE} w={800}>a√2 = 4R</T>
    <T x={48} y={164} a="middle" c={GRIS}>arête</T><T x={144} y={164} a="middle" c={GRIS}>diag. du cube</T><T x={240} y={164} a="middle" c={GRIS}>diag. d’une face</T>
    <T x={150} y={196} a="middle" c={GRIS}>le contact fixe la relation entre a et R</T>
  </Svg>);

export const FCompacite = () => (
  <Svg h={200} aria="Compacité : fraction du volume de la maille occupée par les atomes, 0,52 pour le cubique simple, 0,68 pour le cubique centré, 0,74 pour le cubique à faces centrées ; la masse volumique est n M divisé par N A fois a au cube">
    {[['CS', 0.52, BLEU], ['CC', 0.68, VIOLET], ['CFC', 0.74, VERT]].map(([s, c, col], k) => <g key={s}>
      <T x={12} y={30 + k * 34} c={col} w={800}>{s}</T><rect x="52" y={14 + k * 34} width="190" height="26" fill="#f1f5f9" stroke="#94a3b8"/>
      <rect x="52" y={14 + k * 34} width={190 * c} height="26" fill={col} fillOpacity="0.75"/><T x={250} y={32 + k * 34} c={col} w={800}>{c.toFixed(2).replace('.', ',')}</T></g>)}
    <T x={150} y={122} a="middle" c={GRIS}>part du volume de la maille occupée</T>
    <T x={150} y={148} a="middle" w={700}>C = n × (4/3)πR³ ÷ a³</T>
    <T x={150} y={172} a="middle" c={ORANGE} w={700}><I b="ρ = n M ÷ (N" i="A"/> a³)</T>
    <T x={150} y={192} a="middle" c={GRIS}>a en cm : 1 nm = 10⁻⁷ cm</T>
  </Svg>);

export const FBilanM = () => (
  <Svg h={176} aria="Bilan métaux : compter les atomes en propre, relier a et R par le contact, calculer la compacité, puis la masse volumique">
    <Ch n="1" c={BLEU} y={20} t="compter les atomes : n"/><Lg x1={16} y1={30} x2={16} y2={42} c={GRIS}/>
    <Ch n="2" c={BLEU} y={52} t="contact : a en fonction de R"/><Lg x1={16} y1={62} x2={16} y2={74} c={GRIS}/>
    <Ch n="3" c={ORANGE} y={84} t="compacité : C = n·V(atome) ÷ a³"/><Lg x1={16} y1={94} x2={16} y2={106} c={GRIS}/>
    <Ch n="4" c={VERT} y={116} t={<>masse volumique : ρ = n M ÷ (N<tspan fontSize="9.5" dy="3">A</tspan><tspan dy="-3"> a³)</tspan></>}/>
    <T x={150} y={160} a="middle" c={GRIS}>CS : n = 1 · CC : n = 2 · CFC : n = 4</T>
  </Svg>);

const Oct = ({ x, y }) => <g><polygon points={`${x},${y - 30} ${x + 26},${y} ${x},${y + 30} ${x - 26},${y}`} fill={VIOLET} fillOpacity="0.2" stroke={VIOLET} strokeWidth="2"/><Lg x1={x - 26} y1={y} x2={x + 26} y2={y} c={VIOLET} w={1.2} d="3 3"/><circle cx={x} cy={y} r="5" fill={VIOLET}/></g>;
export const FSites = () => (
  <Svg h={208} aria="Sites interstitiels du cubique à faces centrées : quatre sites octaédriques par maille, entourés de six atomes hôtes, au centre et au milieu des arêtes ; huit sites tétraédriques par maille, entourés de quatre atomes hôtes, au quart des diagonales">
    <Oct x={76} y={56}/>
    <polygon points="224,24 254,78 194,78" fill="#16a34a" fillOpacity="0.2" stroke={VERT} strokeWidth="2"/><circle cx="224" cy="62" r="5" fill={VERT}/>
    <T x={76} y={110} a="middle" c={VIOLET} w={800}>octaédrique</T><T x={224} y={110} a="middle" c={VERT} w={800}>tétraédrique</T>
    <T x={76} y={130} a="middle">6 atomes hôtes</T><T x={224} y={130} a="middle">4 atomes hôtes</T>
    <T x={76} y={152} a="middle" c={VIOLET} w={800}>4 par maille</T><T x={224} y={152} a="middle" c={VERT} w={800}>8 par maille</T>
    <T x={150} y={182} a="middle" c={GRIS}>un atome inséré doit entrer dans le site</T><T x={150} y={202} a="middle" c={GRIS}>sans écarter les hôtes</T>
  </Svg>);

export const FTaille = () => (
  <Svg h={176} aria="Taille des sites dans le cubique à faces centrées : le rayon du site octaédrique vaut 0,414 R et celui du site tétraédrique 0,225 R, où R est le rayon des atomes hôtes ; un atome inséré sans déformation doit avoir un rayon inférieur à celui du site">
    <T x={12} y={22} c={GRIS} w={700}>rayon de l’hôte R</T><rect x="12" y="30" width="276" height="16" fill={BLEU} fillOpacity="0.55"/>
    <T x={12} y={70} c={VIOLET} w={700}>site octaédrique : 0,414 R</T><rect x="12" y="78" width={276 * 0.414} height="16" fill={VIOLET} fillOpacity="0.7"/>
    <T x={12} y={118} c={VERT} w={700}>site tétraédrique : 0,225 R</T><rect x="12" y="126" width={276 * 0.225} height="16" fill={VERT} fillOpacity="0.7"/>
    <T x={150} y={168} a="middle" c={ORANGE} w={700}>atome inséré : r doit être inférieur à r du site</T>
  </Svg>);

export const FNaCl = () => (
  <Svg h={214} aria="Cristal ionique NaCl : les ions chlorure forment un réseau cubique à faces centrées, les ions sodium occupent les sites octaédriques ; le cation et l'anion voisins se touchent le long de l'arête, les anions ne se touchent pas entre eux, donc a égale 2 fois la somme des rayons">
    <defs><clipPath id="cnacl"><rect x="75" y="14" width="150" height="150"/></clipPath></defs>
    <g clipPath="url(#cnacl)">
      {[[75, 14], [225, 14], [75, 164], [225, 164], [150, 89]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="48" fill={BLEU} fillOpacity="0.28" stroke={BLEU} strokeWidth="1.4"/>)}
      {[[150, 14], [75, 89], [225, 89], [150, 164]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="27" fill={ORANGE} fillOpacity="0.6" stroke={ORANGE} strokeWidth="1.4"/>)}
    </g>
    <rect x="75" y="14" width="150" height="150" fill="none" stroke={GRIS} strokeWidth="1.6"/>
    <Lg x1={75} y1={164} x2={225} y2={164} c={ENCRE} w={2.6}/>
    <T x={48} y={92} a="middle" c={BLEU} w={800}>Cl⁻</T><T x={254} y={92} a="middle" c={ORANGE} w={800}>Na⁺</T>
    <T x={150} y={184} a="middle" c={ENCRE} w={800}>a = 2 (r₊ + r₋)</T><T x={150} y={206} a="middle" c={GRIS}>cation–anion se touchent, pas anion–anion</T>
  </Svg>);

export const FBilanIon = () => (
  <Svg h={190} aria="Règle des rapports de rayons : de 0,225 à 0,414 coordinence 4, de 0,414 à 0,732 coordinence 6, de 0,732 à 1 coordinence 8 ; exemple NaCl, rapport 0,56, coordinence 6">
    <T x={150} y={14} a="middle" c={GRIS}>rapport r₊ ÷ r₋</T>
    {[[0.225, 0.414, '4', BLEU], [0.414, 0.732, '6', VIOLET], [0.732, 1, '8', VERT]].map(([a, b, n, c]) => { const x0 = 14 + (a - 0.225) / 0.775 * 272, x1 = 14 + (b - 0.225) / 0.775 * 272; return <g key={n}><rect x={x0} y="26" width={x1 - x0} height="34" fill={c} fillOpacity="0.7" stroke="#fff" strokeWidth="1.5"/><T x={(x0 + x1) / 2} y={49} a="middle" c="#fff" w={800}>{n}</T></g>; })}
    {[[0.225, 14], [0.414, 14 + 0.189 / 0.775 * 272], [0.732, 14 + 0.507 / 0.775 * 272], [1, 286]].map(([v, x], i) => <g key={i}><Lg x1={x} y1={60} x2={x} y2={68} c={GRIS} w={1.4}/><T x={i === 3 ? 292 : i === 0 ? 8 : x} y={84} a={i === 3 ? 'end' : i === 0 ? 'start' : 'middle'} c={GRIS}>{String(v).replace('.', ',')}</T></g>)}
    <T x={150} y={112} a="middle" c={GRIS}>coordinence du cation</T>
    <T x={150} y={146} a="middle" c={ORANGE} w={800}>NaCl : 0,102 ÷ 0,181 = 0,56 → 6</T>
    <T x={150} y={172} a="middle" c={GRIS}>contact cation–anion, jamais anion–anion</T>
  </Svg>);
