// Schémas des cartes « À retenir » de la simulation 27 (débits massique et volumique). viewBox de 300, texte de 12,5.
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
const CW = 6.7;
// Fraction d'unités : { n, u, s } pour le haut et le bas (n : nombre, u : unité, s : unité barrée)
const Frc = ({ x, y, top, bot, c = ENCRE }) => {
  const L = o => (o.n ? o.n.length + 1 : 0) + o.u.length, W = Math.max(L(top), L(bot)) * CW + 10;
  const ligne = (o, yy) => {
    const w = L(o) * CW, x0 = x - w / 2, xu = x0 + (o.n ? (o.n.length + 1) * CW : 0);
    return (<g>
      <text x={x0} y={yy} fontSize="12.5" fontWeight="700" fill={c}>{o.n ? o.n + ' ' : ''}{o.u}</text>
      {o.s && <Lg x1={xu - 1} y1={yy - 3} x2={x0 + w + 1} y2={yy - 10} c={ROUGE} w={2.4}/>}
    </g>);
  };
  return (<g><Lg x1={x - W / 2} y1={y} x2={x + W / 2} y2={y} c={c} w={2}/>{ligne(top, y - 6)}{ligne(bot, y + 15)}</g>);
};
const Cuve = ({ x, y, w, h, niveau, c = '#38bdf8', op = 0.5, trait = GRIS }) => (
  <g><rect x={x + 1} y={y + h - niveau} width={w - 2} height={niveau} fill={c} opacity={op}/><path d={`M${x},${y} V${y + h} H${x + w} V${y}`} fill="none" stroke={trait} strokeWidth="2.6" strokeLinejoin="round"/></g>);
const Balance = ({ x, y, w, txt, c = ENCRE }) => (
  <g><rect x={x - 6} y={y} width={w + 12} height={9} rx="2" fill="#cbd5e1" stroke={GRIS} strokeWidth="1.6"/>
    <rect x={x + w / 2 - 28} y={y + 13} width="56" height="20" rx="4" fill="#fff" stroke={GRIS} strokeWidth="1.6"/><text x={x + w / 2} y={y + 28} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={c}>{txt}</text></g>);

export const FMesure = () => (
  <Svg h={206} aria="Tarer la balance puis mesurer : cuve vide posée sur la balance qui affiche 1,2 kg, on appuie sur tarer et l'affichage revient à 0,0 kg ; ensuite le fluide recueilli pendant une durée mesurée est pesé seul, 8,0 kg">
    <T x={75} y={16} a="middle" w={800} c={BLEU}>1. Cuve vide</T><T x={225} y={16} a="middle" w={800} c={BLEU}>2. Pendant Δt</T>
    <Cuve x={40} y={30} w={70} h={64} niveau={0}/><Balance x={40} y={96} w={70} txt="1,2 kg"/>
    <Cuve x={190} y={30} w={70} h={64} niveau={40}/><Balance x={190} y={96} w={70} txt="8,0 kg" c={ORANGE}/>
    <Fleche x1={75} y1={134} x2={75} y2={152} c={ORANGE} w={2.4}/><T x={75} y={170} a="middle" c={ORANGE} w={800}>Tarer : 0,0 kg</T>
    <T x={225} y={152} a="middle" c={GRIS}>m : fluide seul</T>
    <Fleche x1={118} y1={62} x2={178} y2={62} c={GRIS} w={2.2}/><T x={148} y={52} a="middle" c={GRIS}>ouvrir</T>
    <T x={150} y={198} a="middle" c={GRIS}>On lit m, on chronomètre Δt</T>
  </Svg>);

export const FDebit = () => (
  <Svg h={226} aria="Un débit est une quantité de fluide divisée par la durée : on recueille le fluide dans une cuve sur une balance pendant une durée mesurée au chronomètre ; le débit massique est la masse divisée par la durée en kilogrammes par seconde, le débit volumique est le volume divisé par la durée en litres par seconde">
    <Lg x1={20} y1={14} x2={90} y2={14} c={GRIS} w={2.6}/><Fleche x1={78} y1={14} x2={92} y2={34} c={BLEU} w={2.4}/>
    <Cuve x={60} y={40} w={64} h={60} niveau={36}/><Balance x={60} y={102} w={64} txt="m"/>
    <T x={30} y={78} c={BLEU} w={800}>V</T>
    <circle cx="228" cy="70" r="30" fill="#fff" stroke={GRIS} strokeWidth="2.4"/><Lg x1={228} y1={70} x2={228} y2={48} c={ORANGE} w={2.6}/><Lg x1={228} y1={70} x2={244} y2={78} c={ORANGE} w={2.6}/>
    <T x={228} y={118} a="middle" c={ORANGE} w={800}>Δt</T>
    <rect x="10" y="150" width="280" height="30" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
    <TE x={20} y={170} w={800} parts={['Q', '_m', ' = m ÷ Δt']}/><T x={150} y={170} c={GRIS}>masse ÷ durée : kg·s⁻¹</T>
    <rect x="10" y="186" width="280" height="30" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
    <TE x={20} y={206} w={800} parts={['Q', '_v', ' = V ÷ Δt']}/><T x={150} y={206} c={GRIS}>volume ÷ durée : L·s⁻¹</T>
  </Svg>);

export const FFractions = () => (
  <Svg h={196} aria="Convertir avec une fraction égale à 1 : 4 minutes multipliées par la fraction 60 secondes sur 1 minute donnent 240 secondes, la minute se simplifie car elle apparaît au numérateur et au dénominateur">
    <T x={150} y={16} a="middle" w={800}>Multiplier par une fraction égale à 1</T>
    <T x={20} y={78} w={800}>4</T><T x={34} y={78} w={800}>min</T><Lg x1={33} y1={81} x2={60} y2={68} c={ROUGE} w={2.4}/>
    <T x={74} y={78} c={GRIS} w={800}>×</T>
    <Frc x={128} y={72} top={{ n: '60', u: 's' }} bot={{ n: '1', u: 'min', s: true }}/>
    <T x={170} y={78} c={GRIS} w={800}>=</T>
    <T x={186} y={78} w={800} c={ORANGE}>240 s</T>
    <rect x="10" y="108" width="280" height="30" rx="6" fill="#fff" stroke={VERT} strokeWidth="1.8"/>
    <T x={150} y={128} a="middle" c={VERT} w={800}>60 s = 1 min : la fraction vaut 1</T>
    <T x={150} y={162} a="middle" c={GRIS}>l’unité à supprimer va de l’autre</T><T x={150} y={180} a="middle" c={GRIS}>côté de la barre de fraction</T>
  </Svg>);

export const FConvDebit = () => (
  <Svg h={206} aria="Convertir un débit : 2 kg par seconde multiplié par la fraction 3 600 secondes sur 1 heure donne 7 200 kg par heure ; la seconde, au dénominateur du débit, se simplifie avec la seconde du numérateur de la fraction ; par heure il passe plus de fluide que par seconde, le nombre est plus grand">
    <T x={150} y={16} a="middle" w={800}>Le temps est au dénominateur</T>
    <Frc x={44} y={64} top={{ n: '2', u: 'kg' }} bot={{ u: 's', s: true }}/>
    <T x={84} y={68} c={GRIS} w={800}>×</T>
    <Frc x={138} y={64} top={{ n: '3 600', u: 's', s: true }} bot={{ n: '1', u: 'h' }}/>
    <T x={192} y={68} c={GRIS} w={800}>=</T>
    <Frc x={246} y={64} top={{ n: '7 200', u: 'kg' }} bot={{ u: 'h' }} c={ORANGE}/>
    <rect x="10" y="102" width="280" height="30" rx="6" fill="#fff" stroke={BLEU} strokeWidth="1.8"/>
    <T x={150} y={122} a="middle" c={BLEU} w={800}>1 h = 3 600 s : le s se simplifie</T>
    <T x={150} y={156} a="middle" c={GRIS}>unité de temps plus grande :</T><T x={150} y={174} a="middle" c={GRIS}>plus de fluide passe, donc un</T><T x={150} y={192} a="middle" c={GRIS}>nombre plus grand (7 200 &gt; 2)</T>
  </Svg>);

export const FBilanDebit = () => {
  const L = [['Tarer', ['on ne pèse que le fluide']], ['Débit massique', ['Q', '_m', ' = m ÷ Δt, en kg·s⁻¹']], ['Convertir', ['× une fraction égale à 1']], ['Le temps', ['est au dénominateur d’un débit']], ['Arrondir à la fin', ['autant que la moins précise des données']]];
  return (
    <Svg h={232} aria="Méthode en cinq points : tarer la balance, calculer le débit massique comme la masse divisée par la durée, convertir avec une fraction égale à 1, se souvenir que le temps est au dénominateur d'un débit, arrondir à la fin avec autant de chiffres significatifs que la donnée la moins précise">
      {L.map(([a, b], i) => <g key={i}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        <T x={48} y={23 + i * 44} w={800}>{a}</T><TE x={48} y={38 + i * 44} c={GRIS} parts={b}/></g>)}
    </Svg>);
};

export const FDensite = () => (
  <Svg h={226} aria="Densité et masse volumique : un récipient contient de l'eau, de densité 1, et de l'huile d'olive, de densité 0,92, qui flotte dessus car elle est moins dense ; la masse volumique est la densité multipliée par la masse volumique de l'eau, 1 000 kilogrammes par mètre cube ; l'huile d'olive vaut donc 920 kilogrammes par mètre cube ; la densité n'a pas d'unité">
    <Cuve x={20} y={22} w={90} h={100} niveau={80} c="#38bdf8" op={0.5}/>
    <rect x="21" y="42" width="88" height="22" fill="#facc15" opacity="0.6"/>
    <T x={122} y={58} c="#a16207" w={800}>huile d’olive</T><T x={122} y={74} c="#a16207">d = 0,92 : flotte</T>
    <T x={122} y={104} c={BLEU} w={800}>eau</T><T x={122} y={120} c={BLEU}>d = 1</T>
    <rect x="10" y="136" width="280" height="30" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
    <TE x={20} y={156} w={800} parts={['ρ = d × ρ', '_eau', ' = d × 1 000 kg·m⁻³']}/>
    <T x={150} y={190} a="middle" c={ORANGE} w={800}>huile : 0,92 × 1 000 = 920 kg·m⁻³</T>
    <T x={150} y={210} a="middle" c={GRIS}>d n’a pas d’unité ; ρ en kg·m⁻³</T>
  </Svg>);

export const FUnitesRho = () => (
  <Svg h={226} aria="Relation entre débit massique et débit volumique : les unités vérifient la relation, kilogrammes par mètre cube multipliés par mètres cubes par seconde donnent des kilogrammes par seconde, les mètres cubes se simplifient ; pour aller du volume à la masse on multiplie par la masse volumique, pour aller de la masse au volume on divise par la masse volumique">
    <TE x={150} y={16} a="middle" w={800} parts={['Q', '_m', ' = ρ × Q', '_v', ' : on le vérifie']}/>
    <Frc x={54} y={62} top={{ u: 'kg' }} bot={{ u: 'm³', s: true }}/>
    <T x={92} y={66} c={GRIS} w={800}>×</T>
    <Frc x={134} y={62} top={{ u: 'm³', s: true }} bot={{ u: 's' }}/>
    <T x={172} y={66} c={GRIS} w={800}>=</T>
    <Frc x={214} y={62} top={{ u: 'kg' }} bot={{ u: 's' }} c={ORANGE}/>
    <TE x={54} y={96} a="middle" c={GRIS} parts={['ρ']}/><TE x={134} y={96} a="middle" c={GRIS} parts={['Q', '_v']}/><TE x={214} y={96} a="middle" c={GRIS} parts={['Q', '_m']}/>
    <rect x="14" y="114" width="80" height="34" rx="6" fill="#e0f2fe" stroke={BLEU} strokeWidth="1.8"/><TE x={54} y={136} a="middle" w={800} c={BLEU} parts={['Q', '_v']}/>
    <rect x="206" y="114" width="80" height="34" rx="6" fill="#ffedd5" stroke={ORANGE} strokeWidth="1.8"/><TE x={246} y={136} a="middle" w={800} c={ORANGE} parts={['Q', '_m']}/>
    <Fleche x1={98} y1={124} x2={202} y2={124} c={BLEU} w={2.4}/><T x={150} y={118} a="middle" c={BLEU} w={800}>× ρ</T>
    <Fleche x1={202} y1={142} x2={98} y2={142} c={ORANGE} w={2.4}/><T x={150} y={160} a="middle" c={ORANGE} w={800}>÷ ρ</T>
    <T x={150} y={190} a="middle" c={GRIS}>volume → masse : × ρ</T><T x={150} y={210} a="middle" c={GRIS}>masse → volume : ÷ ρ</T>
  </Svg>);

export const FDeuxVoies = () => (
  <Svg h={236} aria="Deux voies pour obtenir le débit volumique à partir de la masse m et de la durée Δt : soit on calcule le volume V égal à m divisé par ρ puis Q v égal à V divisé par Δt, soit on calcule Q m égal à m divisé par Δt puis Q v égal à Q m divisé par ρ ; les deux voies donnent le même résultat, par exemple 0,100 litre par seconde pour l'essence">
    <rect x="95" y="6" width="110" height="28" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.8"/><T x={150} y={25} a="middle" w={800}>m, Δt, ρ</T>
    <Lg x1={125} y1={34} x2={70} y2={68} c={BLEU} w={2.4}/><Lg x1={175} y1={34} x2={230} y2={68} c={ORANGE} w={2.4}/>
    <rect x="12" y="68" width="116" height="30" rx="6" fill="#e0f2fe" stroke={BLEU} strokeWidth="1.8"/><T x={70} y={88} a="middle" w={800} c={BLEU}>V = m ÷ ρ</T>
    <rect x="172" y="68" width="116" height="30" rx="6" fill="#ffedd5" stroke={ORANGE} strokeWidth="1.8"/><TE x={230} y={88} a="middle" w={800} c={ORANGE} parts={['Q', '_m', ' = m ÷ Δt']}/>
    <Fleche x1={70} y1={100} x2={110} y2={140} c={BLEU} w={2.4}/><Fleche x1={230} y1={100} x2={190} y2={140} c={ORANGE} w={2.4}/>
    <T x={40} y={126} c={BLEU}>÷ Δt</T><T x={232} y={126} c={ORANGE}>÷ ρ</T>
    <rect x="95" y="140" width="110" height="30" rx="6" fill="#dcfce7" stroke={VERT} strokeWidth="1.8"/><TE x={150} y={160} a="middle" w={800} c={VERT} parts={['Q', '_v']}/>
    <T x={150} y={192} a="middle" c={GRIS}>essence : m = 9,00 kg, Δt = 120 s,</T><T x={150} y={210} a="middle" c={GRIS}>ρ = 750 kg·m⁻³</T>
    <T x={150} y={228} a="middle" w={800} c={VERT}>les deux voies : 0,100 L·s⁻¹</T>
  </Svg>);

export const FProportion = () => {
  const x0 = 44, y0 = 128, kx = 70, ky = 50;
  return (
    <Svg h={218} aria="Débit constant : la masse recueillie est proportionnelle à la durée ; en doublant la durée on double la masse, le rapport m divisé par Δt reste le même, c'est la pente de la droite qui passe par l'origine ; il s'agit du débit massique constant">
      <T x={150} y={14} a="middle" w={800}>m proportionnelle à Δt</T>
      <Lg x1={x0} y1={34} x2={x0} y2={y0} c={GRIS} w={1.8}/><Lg x1={x0} y1={y0} x2={290} y2={y0} c={GRIS} w={1.8}/>
      <Lg x1={x0} y1={y0} x2={x0 + 2.4 * kx} y2={y0 - 2.4 * ky} c={BLEU} w={3}/>
      {[1, 2].map(k => <g key={k}><Lg x1={x0 + k * kx} y1={y0} x2={x0 + k * kx} y2={y0 - k * ky} c={ORANGE} w={1.6} d="3 3"/><Lg x1={x0} y1={y0 - k * ky} x2={x0 + k * kx} y2={y0 - k * ky} c={ORANGE} w={1.6} d="3 3"/>
        <circle cx={x0 + k * kx} cy={y0 - k * ky} r="5.5" fill={ORANGE} stroke={ENCRE} strokeWidth="1.4"/>
        <T x={x0 + k * kx} y={y0 + 16} a="middle" c={ORANGE} w={800}>{k === 1 ? 'Δt' : '2 Δt'}</T><T x={x0 - 6} y={y0 - k * ky + 4} a="end" c={ORANGE} w={800}>{k === 1 ? 'm' : '2 m'}</T></g>)}
      <TE x={150} y={168} a="middle" w={800} parts={['Q', '_m', ' = m ÷ Δt : la pente']}/>
      <T x={150} y={188} a="middle" c={GRIS}>même rapport, quelle que soit</T><T x={150} y={206} a="middle" c={GRIS}>la durée de la mesure</T>
    </Svg>);
};

export const FMemeVolume = () => (
  <Svg h={216} aria="Même volume, masses différentes : deux cuves remplies au même niveau, du vin de masse volumique 991 kilogrammes par mètre cube et de l'huile de 920 ; même volume en cinq minutes donc même débit volumique, mais la balance affiche 35,7 kilogrammes pour le vin et 33,1 pour l'huile, donc le débit massique est plus petit pour l'huile">
    <T x={75} y={16} a="middle" w={800} c={BLEU}>vin</T><T x={225} y={16} a="middle" w={800} c="#a16207">huile</T>
    <Cuve x={40} y={28} w={70} h={64} niveau={40} c="#be185d" op={0.4}/><Balance x={40} y={94} w={70} txt="35,7 kg"/>
    <Cuve x={190} y={28} w={70} h={64} niveau={40} c="#facc15" op={0.6}/><Balance x={190} y={94} w={70} txt="33,1 kg" c={ORANGE}/>
    <Lg x1={110} y1={52} x2={190} y2={52} c={VERT} w={2} d="4 3"/><T x={150} y={70} a="middle" c={VERT} w={800}>même</T><T x={150} y={86} a="middle" c={VERT} w={800}>niveau</T>
    <TE x={75} y={150} a="middle" c={GRIS} parts={['ρ = 991 kg·m⁻³']}/><TE x={225} y={150} a="middle" c={GRIS} parts={['ρ = 920 kg·m⁻³']}/>
    <TE x={150} y={176} a="middle" w={800} c={VERT} parts={['même volume : Q', '_v', ' inchangé']}/>
    <TE x={150} y={196} a="middle" w={800} c={ORANGE} parts={['ρ plus petite : Q', '_m', ' plus petit']}/>
  </Svg>);

export const FHypoDebit = () => {
  const L = [['Débit constant', ['m ÷ Δt : un débit moyen']], ['Fluide incompressible', ['ρ constante : m = ρ × V']], [['ρ', '_eau', ' = 1 000 kg·m⁻³'], ['varie avec T : 998 à 20 °C']], ['Balance tarée', ['sinon la masse est trop grande']], ['Instruments', ['balance à 0,1 g, chrono à 1 s']]];
  return (
    <Svg h={232} aria="Cinq hypothèses de la mesure : débit constant, fluide incompressible, masse volumique de l'eau prise égale à 1 000 kilogrammes par mètre cube, balance tarée, instruments de précision limitée">
      {L.map(([a, b], i) => <g key={i}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        {Array.isArray(a) ? <TE x={48} y={23 + i * 44} w={800} parts={a}/> : <T x={48} y={23 + i * 44} w={800}>{a}</T>}<TE x={48} y={38 + i * 44} c={GRIS} parts={b}/></g>)}
    </Svg>);
};
