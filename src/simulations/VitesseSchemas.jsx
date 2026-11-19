// Schémas des cartes « À retenir » de la simulation 28 (débit et vitesse d'écoulement). viewBox de 300, texte de 12,5.
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
const Lignes = ({ L, aria }) => (
  <Svg h={6 + L.length * 44} aria={aria}>
    {L.map(([a, b], i) => <g key={i}>
      <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
      <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
      {Array.isArray(a) ? <TE x={48} y={23 + i * 44} w={800} parts={a}/> : <T x={48} y={23 + i * 44} w={800}>{a}</T>}<TE x={48} y={38 + i * 44} c={GRIS} parts={b}/></g>)}
  </Svg>);

export const FTranches = () => (
  <Svg h={206} aria="Une tranche de fluide qui traverse une section en une seconde a toujours le même volume : dans la partie large du tuyau elle est courte, dans la partie étroite elle est longue ; sa longueur est la distance parcourue en une seconde, c'est-à-dire la vitesse">
    <path d="M10,24 H120 V44 H290 M10,104 H120 V84 H290" fill="none" stroke={GRIS} strokeWidth="2.6" strokeLinejoin="round"/>
    <rect x="70" y="26" width="30" height="76" fill="#38bdf8" opacity="0.6" stroke={BLEU} strokeWidth="1.6"/>
    <rect x="190" y="46" width="76" height="36" fill="#38bdf8" opacity="0.6" stroke={BLEU} strokeWidth="1.6"/>
    <Fleche x1={12} y1={64} x2={58} y2={64} c={GRIS} w={2.2}/>
    <T x={85} y={14} a="middle" c={BLEU} w={800}>large : courte</T><T x={228} y={36} a="middle" c={BLEU} w={800}>étroit : longue</T>
    <T x={150} y={134} a="middle" w={800} c={ORANGE}>même volume dans chaque tranche</T>
    <T x={150} y={158} a="middle" c={GRIS}>longueur de la tranche</T><T x={150} y={176} a="middle" c={GRIS}>= distance parcourue en 1 s</T><T x={150} y={194} a="middle" w={800} c={ORANGE}>= la vitesse du fluide</T>
  </Svg>);

export const FDebitVS = () => (
  <Svg h={216} aria="Débit, vitesse et section : le fluide qui traverse la section S pendant la durée Δt remplit un cylindre de section S et de longueur égale à la vitesse multipliée par Δt ; le volume est S fois v fois Δt, donc le débit volumique est v fois S ; les unités m par seconde fois m carré donnent des m cube par seconde">
    <path d="M40,18 H230 M40,78 H230" stroke={GRIS} strokeWidth="2.6"/>
    <rect x="40" y="18" width="190" height="60" fill="#38bdf8" opacity="0.35"/>
    <ellipse cx="40" cy="48" rx="12" ry="30" fill="#fdba74" stroke={ORANGE} strokeWidth="2.2"/><ellipse cx="230" cy="48" rx="12" ry="30" fill="none" stroke={GRIS} strokeWidth="2"/>
    <T x={40} y={100} a="middle" w={800} c={ORANGE}>S</T>
    <Fleche x1={44} y1={110} x2={228} y2={110} c={BLEU} w={2.4}/><TE x={136} y={128} a="middle" w={800} c={BLEU} parts={['L = v × Δt']}/>
    <TE x={150} y={156} a="middle" w={800} parts={['V = S × v × Δt']}/>
    <TE x={150} y={178} a="middle" w={800} c={VERT} parts={['Q', '_v', ' = V ÷ Δt = v × S']}/>
    <T x={150} y={204} a="middle" c={GRIS}>m·s⁻¹ × m² = m³·s⁻¹</T>
  </Svg>);

export const FPrefixes = () => (
  <Lignes aria="Convertir avec les puissances de 10 : milli vaut 10 puissance moins 3, 25 millimètres font 0,025 mètre ; centi vaut 10 puissance moins 2, 4 centimètres font 0,04 mètre ; 1 litre vaut 10 puissance moins 3 mètre cube ; en passant à une unité plus grande, le nombre diminue"
    L={[['milli (m) = 10⁻³', ['25 mm = 25 × 10⁻³ m = 0,025 m']], ['centi (c) = 10⁻²', ['4 cm = 4 × 10⁻² m = 0,04 m']], ['litre', ['1 L = 10⁻³ m³']], ['Bon sens', ['unité plus grande : nombre plus petit']]]}/>);

export const FSectionTuyau = () => (
  <Svg h={206} aria="La section d'un tuyau cylindrique est un disque de diamètre D : S égale pi D carré divisé par 4, ou pi R carré avec R égal D divisé par 2, avec D en mètres ; exemple, un diamètre de 25 millimètres, soit 0,025 mètre, donne une section d'environ 4,9 fois 10 puissance moins 4 mètre carré">
    <circle cx="80" cy="64" r="46" fill="#fdba74" opacity="0.6" stroke={ORANGE} strokeWidth="2.6"/>
    <Lg x1={34} y1={64} x2={126} y2={64} c={ENCRE} w={2}/><T x={80} y={58} a="middle" w={800}>D</T>
    <T x={80} y={88} a="middle" c={ORANGE} w={800}>S</T>
    <TE x={150} y={50} w={800} parts={['S = π D² ÷ 4']}/><T x={150} y={72} c={GRIS}>= π R², avec D = 2 R</T>
    <rect x="10" y="126" width="280" height="30" rx="6" fill="#fff" stroke={ORANGE} strokeWidth="1.8"/><T x={150} y={146} a="middle" w={800} c={ORANGE}>D toujours en mètres : m × m = m²</T>
    <T x={150} y={178} a="middle" c={GRIS}>D = 25 mm = 0,025 m</T><T x={150} y={197} a="middle" c={GRIS}>S ≈ 4,9 × 10⁻⁴ m²</T>
  </Svg>);

export const FConvQv = () => (
  <Lignes aria="Convertir un débit en mètres cubes par seconde : 3 litres par seconde font 3 fois 10 puissance moins 3 mètre cube par seconde ; 3 litres par minute font 5 fois 10 puissance moins 5 ; 3 mètres cubes par heure font environ 8,3 fois 10 puissance moins 4"
    L={[['litre : 10⁻³ m³', ['3 L·s⁻¹ = 3 × 10⁻³ m³·s⁻¹']], ['minute : 60 s', ['3 L·min⁻¹ = 5 × 10⁻⁵ m³·s⁻¹']], ['heure : 3 600 s', ['3 m³·h⁻¹ ≈ 8,3 × 10⁻⁴ m³·s⁻¹']], ['Pour une vitesse en m·s⁻¹', ['Q en m³·s⁻¹ et S en m²']]]}/>);

export const FConserv = () => (
  <Svg h={206} aria="Conservation du débit : dans un tuyau qui se rétrécit, le même débit volumique passe dans la section 1 large et dans la section 2 étroite ; v un fois S un égale v deux fois S deux ; quand la section diminue, la vitesse augmente">
    <path d="M10,22 H130 V42 H290 M10,102 H130 V82 H290" fill="none" stroke={GRIS} strokeWidth="2.6" strokeLinejoin="round"/>
    <Fleche x1={26} y1={62} x2={66} y2={62} c={BLEU} w={2.6}/><Fleche x1={166} y1={62} x2={268} y2={62} c={ORANGE} w={3}/>
    <TE x={70} y={14} a="middle" c={BLEU} w={800} parts={['S', '_1', ' grande']}/><TE x={70} y={122} a="middle" c={BLEU} w={800} parts={['v', '_1', ' petite']}/>
    <TE x={210} y={34} a="middle" c={ORANGE} w={800} parts={['S', '_2', ' petite']}/><TE x={210} y={102} a="middle" c={ORANGE} w={800} parts={['v', '_2', ' grande']}/>
    <rect x="30" y="140" width="240" height="32" rx="6" fill="#fff" stroke={VERT} strokeWidth="2"/>
    <TE x={150} y={161} a="middle" w={800} c={VERT} parts={['v', '_1', ' S', '_1', ' = v', '_2', ' S', '_2', ' = Q', '_v']}/>
    <T x={150} y={196} a="middle" c={GRIS}>section ↓, vitesse ↑ : même débit</T>
  </Svg>);

export const FSurDeux = () => (
  <Svg h={212} aria="Si le diamètre est divisé par 2, la section est divisée par 4 car elle est proportionnelle au carré du diamètre ; comme le débit reste le même, la vitesse est multipliée par 4 ; deux disques, l'un de diamètre D, l'autre de diamètre D divisé par 2, dont l'aire est quatre fois plus petite">
    <circle cx="80" cy="60" r="44" fill="#bae6fd" stroke={BLEU} strokeWidth="2.4"/><T x={80} y={65} a="middle" w={800} c={BLEU}>D</T>
    <circle cx="220" cy="60" r="22" fill="#fdba74" stroke={ORANGE} strokeWidth="2.4"/><T x={220} y={65} a="middle" w={800} c={ORANGE}>D ÷ 2</T>
    <T x={80} y={122} a="middle" c={GRIS}>aire S</T><T x={220} y={122} a="middle" c={GRIS}>aire S ÷ 4</T>
    <Fleche x1={128} y1={60} x2={170} y2={60} c={GRIS} w={2.4}/>
    <TE x={150} y={152} a="middle" w={800} parts={['S ∝ D² : D ÷ 2 → S ÷ 4']}/>
    <TE x={150} y={176} a="middle" w={800} c={ORANGE} parts={['Q', '_v', ' constant : v × 4']}/>
    <T x={150} y={202} a="middle" c={GRIS}>prévoir sans calculer</T>
  </Svg>);

export const FMasseVD = () => (
  <Svg h={206} aria="Du débit volumique au débit massique : on multiplie par la masse volumique ; exemple avec l'eau, de masse volumique 1000 kilogrammes par mètre cube, un débit volumique de 2,0 fois 10 puissance moins 4 mètre cube par seconde donne un débit massique de 0,20 kilogramme par seconde ; le fluide étant incompressible, le débit massique est le même dans les deux sections">
    <rect x="12" y="14" width="96" height="38" rx="6" fill="#e0f2fe" stroke={BLEU} strokeWidth="1.8"/><TE x={60} y={38} a="middle" w={800} c={BLEU} parts={['Q', '_v', ' (m³·s⁻¹)']}/>
    <rect x="192" y="14" width="96" height="38" rx="6" fill="#ffedd5" stroke={ORANGE} strokeWidth="1.8"/><TE x={240} y={38} a="middle" w={800} c={ORANGE} parts={['Q', '_m', ' (kg·s⁻¹)']}/>
    <Fleche x1={112} y1={33} x2={188} y2={33} c={GRIS} w={2.4}/><T x={150} y={26} a="middle" w={800}>× ρ</T>
    <TE x={150} y={86} a="middle" w={800} parts={['Q', '_m', ' = ρ × Q', '_v']}/>
    <T x={150} y={112} a="middle" c={GRIS}>eau : 1 000 kg·m⁻³ × 2,0 × 10⁻⁴ m³·s⁻¹</T><T x={150} y={132} a="middle" w={800} c={ORANGE}>= 0,20 kg·s⁻¹</T>
    <T x={150} y={164} a="middle" c={GRIS}>incompressible : ρ identique</T><TE x={150} y={184} a="middle" c={VERT} w={800} parts={['Q', '_m', ' le même dans les deux sections']}/>
  </Svg>);

export const FHypoVD = () => (
  <Lignes aria="Cinq hypothèses du raisonnement : fluide incompressible, régime permanent, tuyau plein sans fuite, vitesse uniforme prise comme vitesse moyenne, masse volumique de l'eau prise égale à 1000 kilogrammes par mètre cube"
    L={[['Fluide incompressible', ['ρ constante : v₁S₁ = v₂S₂']], ['Régime permanent', ['rien ne s’accumule dans le tuyau']], ['Tuyau plein, sans fuite', ['tout le fluide passe de 1 en 2']], ['Vitesse uniforme', ['v est la vitesse moyenne']], [['ρ', '_eau', ' = 1 000 kg·m⁻³'], ['varie avec la température']]]}/>);

export const FBilanVD = () => (
  <Lignes aria="Méthode en cinq points : relier débit, vitesse et section, calculer la section avec le diamètre en mètres, utiliser la conservation du débit, passer au débit massique avec la masse volumique, arrondir à la fin avec 2 chiffres significatifs"
    L={[['Relier', ['Q', '_v', ' = v × S']], ['Section', ['S = π D² ÷ 4, D en mètres']], ['Conserver', ['v₁S₁ = v₂S₂ (même débit)']], ['Débit massique', ['Q', '_m', ' = ρ × Q', '_v']], ['Arrondir à la fin', ['2 chiffres : comme D et Q', '_v']]]}/>);
