// Schémas des cartes « À retenir » de la simulation 84 (interférences, fentes de Young, réseau). viewBox de 300, texte de 12,5.
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
const onde = (x0, x1, cy, amp, lam, ph = 0) => { const o = []; for (let x = x0; x <= x1; x += 1) o.push(`${x},${(cy - amp * Math.sin((x - x0) / lam * Math.PI * 2 + ph)).toFixed(1)}`); return o.join(' '); };

export const FChemins = () => (
  <Svg h={214} aria="Deux sources S1 et S2 émettent des ondes synchrones ; au point M, l'onde de S1 a parcouru r1 et celle de S2 a parcouru r2 ; la différence de distances delta vaut r2 moins r1 en valeur absolue ; le retard tau est delta divisé par la célérité v ; sur l'axe de symétrie, delta est nul">
    <Lg x1={20} y1={100} x2={284} y2={100} c={GRIS} w={1.6} d="5 4"/><T x={284} y={118} a="end" c={GRIS}>axe de symétrie</T>
    <circle cx="30" cy="68" r="7" fill={BLEU}/><T x={14} y={58} c={BLEU} w={800}>S₁</T>
    <circle cx="30" cy="132" r="7" fill={ORANGE}/><T x={14} y={156} c={ORANGE} w={800}>S₂</T>
    <Lg x1={30} y1={68} x2={230} y2={50} c={BLEU} w={2.6}/><Lg x1={30} y1={132} x2={230} y2={50} c={ORANGE} w={2.6}/>
    <circle cx="230" cy="50" r="7" fill="#eab308" stroke="#92400e" strokeWidth="1.6"/><T x={242} y={46} c="#92400e" w={800}>M</T>
    <T x={110} y={50} c={BLEU} w={800}>r₁</T><T x={110} y={122} c={ORANGE} w={800}>r₂</T>
    <T x={150} y={178} a="middle" w={800}>δ = |r₂ − r₁|   τ = δ ÷ v</T>
    <T x={150} y={200} a="middle" c={VERT} w={800}>sur l’axe : δ = 0, τ = 0</T>
  </Svg>);

export const FPhase = () => (
  <Svg h={232} aria="Deux ondes qui arrivent en phase, crête sur crête, s'ajoutent : interférence constructive, frange agitée, avec un retard égal à un nombre entier de périodes ; deux ondes en opposition de phase, crête sur creux, s'annulent : interférence destructive, zone calme, avec un retard égal à un nombre entier de périodes plus une demi-période">
    <T x={14} y={16} w={800} c={VERT}>en phase : crête sur crête</T>
    <polyline points={onde(14, 286, 50, 14, 68)} fill="none" stroke={BLEU} strokeWidth="2.4"/><polyline points={onde(14, 286, 50, 14, 68)} fill="none" stroke={ORANGE} strokeWidth="1.6" strokeDasharray="4 4"/>
    <T x={150} y={84} a="middle" c={VERT} w={800}>somme : amplitude double</T>
    <T x={14} y={112} w={800} c={ROUGE}>en opposition : crête sur creux</T>
    <polyline points={onde(14, 286, 146, 14, 68)} fill="none" stroke={BLEU} strokeWidth="2.4"/><polyline points={onde(14, 286, 146, 14, 68, Math.PI)} fill="none" stroke={ORANGE} strokeWidth="2" strokeDasharray="4 4"/>
    <T x={150} y={180} a="middle" c={ROUGE} w={800}>somme : nulle (zone calme)</T>
    <T x={150} y={204} a="middle" w={800} c={VERT}>constructive : τ = k·T  (δ = k·λ)</T>
    <T x={150} y={224} a="middle" w={800} c={ROUGE}>destructive : τ = k·T + T÷2</T>
  </Svg>);

export const FEcart = () => {
  const rays = (cx, n, step) => { const o = []; for (let i = -n; i <= n; i++) { const a = i * step * Math.PI / 180; o.push(<Lg key={i} x1={cx} y1={88} x2={cx + 95 * Math.cos(a)} y2={88 + 95 * Math.sin(a)} c={i === 0 ? ORANGE : BLEU} w={i === 0 ? 2.6 : 1.8}/>); } return o; };
  return (
    <Svg h={216} aria="Effet de l'écart entre les sources : quand les sources sont proches, il y a peu de lignes d'interférence et les franges sont larges ; quand elles sont éloignées, il y a plus de lignes et les franges sont plus resserrées">
      <T x={74} y={16} a="middle" w={800}>s petit</T><T x={226} y={16} a="middle" w={800}>s grand</T>
      <Lg x1={150} y1={24} x2={150} y2={170} c={GRIS} w={1.2} d="4 4"/>
      <g clipPath="none">{rays(14, 1, 26)}</g><g>{rays(160, 3, 13)}</g>
      <circle cx="14" cy="80" r="5" fill={BLEU}/><circle cx="14" cy="96" r="5" fill={ORANGE}/>
      <circle cx="160" cy="68" r="5" fill={BLEU}/><circle cx="160" cy="108" r="5" fill={ORANGE}/>
      <T x={74} y={186} a="middle" c={GRIS}>3 lignes</T><T x={226} y={186} a="middle" c={GRIS}>7 lignes</T>
      <T x={150} y={204} a="middle" w={800} c={VERT}>s ↑ : franges plus resserrées</T>
    </Svg>);
};

export const FInterfrange = () => (
  <Svg h={214} aria="Franges de Young : sur l'écran, des franges brillantes régulièrement espacées ; l'interfrange i est la distance entre deux franges brillantes consécutives ; on mesure la distance d entre la première et la septième frange, soit six interfranges, donc d égale 6 i">
    <rect x="14" y="30" width="272" height="56" fill="#111827"/>
    {[0, 1, 2, 3, 4, 5, 6].map(k => <rect key={k} x={36 + k * 38 - 6} y="30" width="12" height="56" fill="#22c55e" opacity={1 - Math.abs(k - 3) * 0.12}/>)}
    <Lg x1={36} y1={104} x2={74} y2={104} c={ORANGE} w={2.4}/><T x={55} y={122} a="middle" c={ORANGE} w={800}>i</T>
    <Lg x1={36} y1={146} x2={264} y2={146} c={VERT} w={2.4}/><Lg x1={36} y1={138} x2={36} y2={154} c={VERT} w={2.4}/><Lg x1={264} y1={138} x2={264} y2={154} c={VERT} w={2.4}/>
    <T x={150} y={170} a="middle" c={VERT} w={800}>d = 6 interfranges</T>
    <T x={150} y={196} a="middle" w={800}>i = d ÷ 6</T>
  </Svg>);

export const FYoung = () => (
  <Svg h={234} aria="Fentes de Young : un laser éclaire deux fentes séparées de l ; les deux ondes arrivent sur un écran situé à la distance D ; l'interfrange est i égal lambda fois D divisé par l ; si l diminue ou si D augmente, i augmente">
    <Lg x1={14} y1={90} x2={44} y2={90} c="#16a34a" w={3}/><T x={14} y={78} c="#16a34a" w={800}>laser</T><Fleche x1={54} y1={90} x2={54} y2={78} c={GRIS} w={1.8}/><Fleche x1={54} y1={90} x2={54} y2={102} c={GRIS} w={1.8}/>
    <rect x="60" y="30" width="6" height="46" fill={GRIS}/><rect x="60" y="104" width="6" height="46" fill={GRIS}/>
    <Lg x1={63} y1={80} x2={250} y2={62} c={BLEU} w={1.8}/><Lg x1={63} y1={100} x2={250} y2={62} c={ORANGE} w={1.8}/>
    <Lg x1={63} y1={80} x2={250} y2={118} c={BLEU} w={1.8}/><Lg x1={63} y1={100} x2={250} y2={118} c={ORANGE} w={1.8}/>
    <rect x="250" y="30" width="6" height="120" fill="#111827"/>{[62, 90, 118].map(y => <rect key={y} x="248" y={y - 5} width="10" height="10" fill="#22c55e"/>)}
    <T x={50} y={122} c={GRIS} w={800}>l</T><T x={265} y={78} c={VERT} w={800}>i</T>
    <Fleche x1={64} y1={168} x2={250} y2={168} c={GRIS} w={2}/><Fleche x1={250} y1={168} x2={64} y2={168} c={GRIS} w={2}/><T x={157} y={186} a="middle" c={GRIS} w={800}>D</T>
    <T x={150} y={210} a="middle" w={800}>i = λ × D ÷ l</T><T x={150} y={228} a="middle" c={VERT}>l ↓ ou D ↑ : i ↑</T>
  </Svg>);

export const FSixInterf = () => (
  <Svg h={214} aria="Pourquoi mesurer six interfranges : l'incertitude de pointé est la même pour chaque repère ; sur un seul interfrange elle pèse lourd en valeur relative ; sur six interfranges elle pèse six fois moins, donc la mesure de i est plus précise">
    <T x={14} y={18} w={800}>1 interfrange</T>
    <Lg x1={60} y1={44} x2={100} y2={44} c={BLEU} w={3}/>{[60, 100].map(x => <g key={x}><Lg x1={x} y1={32} x2={x} y2={56} c={BLEU} w={2.4}/><rect x={x - 6} y="36" width="12" height="16" fill={ORANGE} opacity="0.4"/></g>)}
    <T x={150} y={48} c={ORANGE}>± ε : grosse part de i</T>
    <T x={14} y={96} w={800}>6 interfranges</T>
    <Lg x1={60} y1={122} x2={280} y2={122} c={BLEU} w={3}/>{[60, 280].map(x => <g key={x}><Lg x1={x} y1={110} x2={x} y2={134} c={BLEU} w={2.4}/><rect x={x - 6} y="114" width="12" height="16" fill={ORANGE} opacity="0.4"/></g>)}
    <T x={150} y={150} a="middle" c={ORANGE}>même ± ε : petite part de d</T>
    <T x={150} y={182} a="middle" w={800} c={VERT}>incertitude relative ÷ 6</T>
    <T x={150} y={204} a="middle" c={GRIS}>ε : incertitude de pointé d’un repère</T>
  </Svg>);

export const FReseau = () => (
  <Svg h={226} aria="Réseau : un faisceau laser arrive sur un réseau de pas a ; il ressort dans des directions bien précises, les ordres k égal 0, plus ou moins 1 ; l'angle theta de l'ordre k vérifie sinus theta k égal k lambda divisé par a ; à l'écran, la tache d'ordre 1 est à la distance x1 de la tache centrale, avec tangente theta 1 égale x1 divisé par D">
    <Lg x1={10} y1={100} x2={70} y2={100} c="#16a34a" w={3}/>
    {[0, 1, 2, 3, 4, 5, 6, 7].map(k => <Lg key={k} x1={74} y1={50 + k * 14} x2={74} y2={58 + k * 14} c={GRIS} w={3}/>)}
    <T x={74} y={42} a="middle" c={GRIS}>réseau</T>
    <rect x="248" y="30" width="6" height="140" fill="#111827"/>
    <Lg x1={76} y1={100} x2={248} y2={100} c="#16a34a" w={2.4}/><Lg x1={76} y1={100} x2={248} y2={58} c="#16a34a" w={2}/><Lg x1={76} y1={100} x2={248} y2={142} c="#16a34a" w={2}/>
    {[58, 100, 142].map(y => <circle key={y} cx="251" cy={y} r="5" fill="#22c55e"/>)}
    <T x={262} y={104} c={VERT}>0</T><T x={262} y={62} c={VERT}>+1</T><T x={262} y={146} c={VERT}>−1</T>
    <T x={130} y={86} c={ORANGE} w={800}>θ₁</T><T x={204} y={42} c={GRIS}>x₁</T>
    <TE x={150} y={192} a="middle" w={800} parts={['sin θ', '_k', ' = k × λ ÷ a']}/>
    <T x={150} y={214} a="middle" c={GRIS}>a : pas du réseau (distance entre traits)</T>
  </Svg>);

export const FOrdresMax = () => {
  const X = s => 24 + s * 200;
  return (
    <Svg h={208} aria="Combien d'ordres : l'ordre k n'existe que si k lambda divisé par a est inférieur à 1 ; avec lambda égal 532 nanomètres et a égal 3,3 micromètres, lambda divisé par a vaut 0,16 ; les ordres 0 à 6 existent, l'ordre 7 donnerait un sinus supérieur à 1, impossible">
      <T x={150} y={16} a="middle" w={800}>sin θ doit rester ≤ 1</T>
      <Lg x1={X(0)} y1={80} x2={X(1.2)} y2={80} c={GRIS} w={1.8}/>
      {[0, 1, 2, 3, 4, 5, 6].map(k => <g key={k}><Lg x1={X(k * 0.161)} y1={70} x2={X(k * 0.161)} y2={90} c={VERT} w={2.4}/><T x={X(k * 0.161)} y={108} a="middle" c={VERT} w={800}>{k}</T></g>)}
      <Lg x1={X(7 * 0.161)} y1={70} x2={X(7 * 0.161)} y2={90} c={ROUGE} w={2.4}/><T x={X(7 * 0.161)} y={108} a="middle" c={ROUGE} w={800}>7</T>
      <Lg x1={X(1)} y1={46} x2={X(1)} y2={96} c={ROUGE} w={2} d="4 3"/><T x={X(1)} y={38} a="middle" c={ROUGE} w={800}>1</T>
      <T x={X(0)} y={38} a="middle" c={GRIS}>0</T>
      <T x={150} y={140} a="middle" w={800} c={VERT}>k de 0 à 6 : visibles</T>
      <T x={150} y={162} a="middle" c={ROUGE}>k = 7 : sin θ &gt; 1, impossible</T>
      <T x={150} y={190} a="middle" c={GRIS}>k &lt; a ÷ λ  (ici a ÷ λ ≈ 6,2)</T>
    </Svg>);
};

export const FDispersion = () => (
  <Svg h={212} aria="Dispersion par un réseau en lumière blanche : la tache centrale d'ordre 0 reste blanche ; de part et d'autre, les ordres plus et moins 1 sont des spectres, avec le violet près du centre et le rouge plus loin, car sinus theta égale lambda divisé par a : plus lambda est grande, plus l'angle est grand">
    <defs><linearGradient id="spDisp" x1="0" x2="1"><stop offset="0" stopColor="#7c3aed"/><stop offset="0.3" stopColor="#2563eb"/><stop offset="0.5" stopColor="#22c55e"/><stop offset="0.75" stopColor="#eab308"/><stop offset="1" stopColor="#dc2626"/></linearGradient></defs>
    <rect x="14" y="44" width="272" height="44" fill="#111827"/>
    <circle cx="150" cy="66" r="12" fill="#fff"/>
    <rect x="176" y="48" width="96" height="36" fill="url(#spDisp)"/><g transform="translate(300 0) scale(-1 1)"><rect x="176" y="48" width="96" height="36" fill="url(#spDisp)"/></g>
    <T x={150} y={36} a="middle" w={800}>k = 0 : blanc</T>
    <T x={224} y={108} a="middle" c={BLEU} w={800}>k = +1</T><T x={76} y={108} a="middle" c={BLEU} w={800}>k = −1</T>
    <T x={188} y={130} a="middle" c="#7c3aed" w={800}>violet</T><T x={264} y={130} a="end" c="#dc2626" w={800}>rouge</T>
    <T x={150} y={166} a="middle" w={800}>λ ↑ : θ ↑</T>
    <T x={150} y={192} a="middle" c={VERT} w={800}>rouge plus dévié que violet</T>
  </Svg>);

export const FMesureRaie = () => {
  const B = [['①', 'repères sur les ordres −1 et +1', 'd = 2 x₁'], ['②', 'angle de déviation', 'θ₁ = arctan(x₁ ÷ D)'], ['③', 'longueur d’onde (k = 1)', 'λ = a × sin θ₁']];
  return (
    <Svg h={220} aria="Mesurer une longueur d'onde avec un réseau en trois temps : pointer les ordres moins 1 et plus 1 pour avoir d égale 2 x1 ; calculer l'angle theta 1 égal arctangente de x1 divisé par D ; en déduire lambda égal a fois sinus theta 1 pour l'ordre 1, en nanomètres ; pointer un ordre élevé réduit l'incertitude relative">
      {B.map(([n, a, f], i) => <g key={i}><rect x="12" y={8 + i * 60} width="276" height="50" rx="8" fill="#eff6ff" stroke={BLEU} strokeWidth="1.6"/><T x={22} y={30 + i * 60} c={ORANGE} w={800}>{n}</T><T x={44} y={30 + i * 60} c={GRIS}>{a}</T><T x={44} y={50 + i * 60} w={800} c={BLEU}>{f}</T></g>)}
      <T x={150} y={204} a="middle" c={VERT} w={800}>ordre élevé : incertitude relative plus petite</T>
    </Svg>);
};

export const FSpectro = () => (
  <Svg h={216} aria="Spectrophotomètre à réseau : la lampe envoie de la lumière blanche sur un réseau qui l'étale en spectre ; une fente de sortie ne laisse passer qu'une couleur, qui traverse l'échantillon puis arrive sur le détecteur ; en tournant le réseau on choisit la longueur d'onde">
    <rect x="8" y="76" width="22" height="26" rx="4" fill="#fde68a" stroke={GRIS} strokeWidth="1.6"/><Lg x1={30} y1={89} x2={96} y2={89} c="#ca8a04" w={3}/>
    <rect x="92" y="70" width="10" height="38" fill="#94a3b8" stroke={GRIS} strokeWidth="1.6" transform="rotate(-18 97 89)"/>
    <rect x="168" y="30" width="8" height="52" fill={GRIS}/><rect x="168" y="96" width="8" height="52" fill={GRIS}/>
    <Lg x1={100} y1={89} x2={168} y2={60} c="#7c3aed" w={2}/><Lg x1={100} y1={89} x2={168} y2={118} c="#dc2626" w={2}/>
    <Lg x1={100} y1={89} x2={190} y2={89} c="#16a34a" w={3}/><Lg x1={190} y1={89} x2={268} y2={89} c="#16a34a" w={3}/>
    <rect x="196" y="72" width="26" height="34" fill="#bae6fd" stroke={BLEU} strokeWidth="1.6" opacity="0.8"/>
    <rect x="262" y="76" width="22" height="26" rx="4" fill="#cbd5e1" stroke={GRIS} strokeWidth="2"/>
    <T x={19} y={126} a="middle" c={GRIS}>lampe</T><T x={97} y={150} a="middle" c={GRIS}>réseau</T><T x={172} y={168} a="middle" c={GRIS}>fente</T><T x={209} y={126} a="middle" c={BLEU}>cuve</T><T x={273} y={148} a="middle" c={GRIS}>détecteur</T>
    <T x={150} y={198} a="middle" w={800} c={VERT}>tourner le réseau : choisir λ</T>
  </Svg>);
