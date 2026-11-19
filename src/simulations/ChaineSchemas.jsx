// Schémas des cartes « À retenir » de la simulation 8 (chaîne de mesure). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', VIOLET = '#6d28d9';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.4"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

const DONNEES = [[11, 5600], [70, 2500], [200, 1540], [360, 1210], [470, 1010], [680, 790], [880, 581], [1050, 387], [1590, 346]];
export const FCaracteristique = () => {
  const X = e => 46 + (Math.log10(e) - 1) / 2.301 * 230, Y = r => 150 - (Math.log10(r) - 2.477) / 1.301 * 124;
  return (
    <Svg h={214} aria="Caractéristique de la photorésistance en échelles logarithmiques : la résistance Rp diminue quand l'éclairement E augmente, de plus de 5 000 ohms dans la pénombre à moins de 400 ohms en pleine lumière">
      <Lg x1={46} y1={150} x2={282} y2={150} c={GRIS} w={1.6}/><Lg x1={46} y1={150} x2={46} y2={20} c={GRIS} w={1.6}/>
      {[[10, '10'], [100, '100'], [1000, '1 000']].map(([e, t]) => <g key={e}><Lg x1={X(e)} y1={150} x2={X(e)} y2={155} c={GRIS} w={1.4}/><T x={X(e)} y={170} a="middle" c={GRIS}>{t}</T></g>)}
      {[[300, '300'], [1000, '1 000'], [3000, '3 000']].map(([r, t]) => <g key={r}><Lg x1={41} y1={Y(r)} x2={46} y2={Y(r)} c={GRIS} w={1.4}/><T x={38} y={Y(r) + 4} a="end" c={GRIS}>{t}</T></g>)}
      <polyline points={DONNEES.map(([e, r]) => `${X(e)},${Y(r)}`).join(' ')} fill="none" stroke={ORANGE} strokeWidth="2.6"/>
      {DONNEES.map(([e, r]) => <circle key={e} cx={X(e)} cy={Y(r)} r="3.6" fill={ORANGE}/>)}
      <T x={282} y={190} a="end" c={ENCRE} w={700}>E (lx)</T><T x={50} y={16} c={ENCRE} w={700}>Rp (Ω)</T>
      <T x={150} y={192} a="middle" c={ORANGE} w={800}>plus de lumière : Rp diminue</T><T x={150} y={206} a="middle" c={GRIS}>échelles log, 9 points de mesure</T>
    </Svg>);
};

export const FPont = () => (
  <Svg h={206} aria="Pont diviseur de tension : la photorésistance Rp est reliée à l'alimentation 5 volts, la résistance R de 1000 ohms à la masse ; la tension Ur est prise aux bornes de R et envoyée au convertisseur analogique-numérique"><g transform="translate(0,8)">
    <Lg x1={70} y1={14} x2={150} y2={14} c={GRIS}/><T x={76} y={11.5} c={ORANGE} w={800}>+5 V</T><Lg x1={110} y1={14} x2={110} y2={28} c={GRIS}/>
    <rect x="96" y="28" width="28" height="42" fill="#fef3c7" stroke={ORANGE} strokeWidth="2.5"/><T x={134} y={54} c={ORANGE} w={700}>Rp (photorésistance)</T>
    <Lg x1={110} y1={70} x2={110} y2={92} c={GRIS}/><circle cx="110" cy="92" r="3.6" fill={GRIS}/>
    <Lg x1={110} y1={92} x2={46} y2={92} c={BLEU} w={2.6}/><T x={8} y={86} c={BLEU} w={800}>Ur → CAN</T>
    <Lg x1={110} y1={92} x2={110} y2={102} c={GRIS}/>
    <rect x="96" y="102" width="28" height="36" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.5"/><T x={134} y={125} c={BLEU} w={700}>R = 1000 Ω</T>
    <Lg x1={110} y1={138} x2={110} y2={150} c={GRIS}/><Lg x1={94} y1={150} x2={126} y2={150} c={GRIS} w={2.6}/><Lg x1={100} y1={155} x2={120} y2={155} c={GRIS}/><T x={134} y={155} c={GRIS}>masse</T>
    <T x={150} y={178} a="middle" c={GRIS}>exemple : Rp = 2 500 Ω → Ur = 5 × 1000 ÷ 3500</T><T x={150} y={194} a="middle" c={VERT} w={800}>Ur ≈ 1,43 V</T>
  </g></Svg>);

export const FCAN = () => {
  const X = u => 40 + u / 5 * 230, Y = k => 138 - k / 7 * 112, q = 5 / 7;
  const pts = []; for (let k = 0; k < 7; k++) { pts.push(`${X(k * q)},${Y(k)}`, `${X((k + 1) * q)},${Y(k)}`); } pts.push(`${X(5)},${Y(7)}`);
  return (
    <Svg h={218} aria="Fonctionnement du convertisseur analogique-numérique, schématisé avec 3 bits : l'entier N augmente par marches de largeur q, le quantum, quand la tension Ur varie de 0 à 5 volts ; avec n bits, N va de 0 à 2 puissance n moins 1">
      <Lg x1={40} y1={138} x2={274} y2={138} c={GRIS} w={1.6}/><Lg x1={40} y1={138} x2={40} y2={20} c={GRIS} w={1.6}/>
      <polyline points={pts.join(' ')} fill="none" stroke={VIOLET} strokeWidth="2.8" strokeLinejoin="round"/>
      <T x={8} y={20} c={ENCRE} w={700}>N</T><T x={222} y={158} a="middle" c={ENCRE} w={700}>Ur (V)</T>
      <T x={40} y={158} a="middle" c={GRIS}>0</T><T x={X(5)} y={158} a="middle" c={GRIS}>5</T>
      <Lg x1={X(3 * q)} y1={146} x2={X(4 * q)} y2={146} c={ORANGE} w={3}/><T x={X(3.5 * q)} y={162} a="middle" c={ORANGE} w={800}>q</T>
      <T x={150} y={16} a="middle" c={GRIS}>schéma à 3 bits</T>
      <T x={150} y={190} a="middle" w={700}>N : entier de 0 à 2ⁿ − 1</T><T x={150} y={208} a="middle" c={GRIS}>plus n est grand, plus q est petit</T>
    </Svg>);
};

export const FHysteresis = () => (
  <Svg h={170} aria="Algorithme à deux seuils, schéma non à l'échelle : si N est inférieur à 393 les phares s'allument ; si N est supérieur à 491 ils s'éteignent ; entre les deux seuils la sortie garde son état précédent ; plus il fait clair, plus N est grand">
    {[['N < 393', 'allumés', '#dcfce7', VERT, 10, 80], ['393 ≤ N ≤ 491', 'état précédent', '#fef9c3', '#a16207', 94, 110], ['N > 491', 'éteints', '#fee2e2', ROUGE, 208, 80]].map(([c, r, f, col, x, w]) => (
      <g key={c}><rect x={x} y="20" width={w} height="66" fill={f} stroke={col} strokeWidth="1.6" rx="4"/><T x={x + w / 2} y={46} a="middle" c={ENCRE} w={700}>{c}</T><T x={x + w / 2} y={70} a="middle" c={col} w={800}>{r}</T></g>))}
    <T x={92} y={14} a="middle" c={GRIS}>seuil bas</T><T x={206} y={14} a="middle" c={GRIS}>seuil haut</T>
    <Fleche x1={12} y1={112} x2={288} y2={112} c={GRIS}/><T x={150} y={134} a="middle" c={GRIS}>plus il fait clair, plus N est grand</T><T x={150} y={156} a="middle" c={GRIS}>(valeurs de N de 0 à 1 023, 10 bits)</T>
  </Svg>);

export const FChaine = () => {
  const L = [['capteur', 'photorésistance', '#fef3c7', ORANGE], ['conditionneur', 'pont diviseur', '#e0f2fe', BLEU], ['CAN', 'n bits', '#ede9fe', VIOLET], ['traitement', 'algorithme à deux seuils', '#dcfce7', VERT]];
  const Q = ['E (lx)', 'Rp (Ω)', 'Ur (V)', 'N', 'phares'];
  return (
    <Svg h={296} aria="Chaîne de mesure : l'éclairement E agit sur le capteur, la photorésistance, qui donne Rp ; le conditionneur, un pont diviseur, donne la tension Ur ; le convertisseur analogique-numérique donne le nombre N ; l'algorithme compare N aux seuils et commande les phares">
      {L.map(([n, s, f, c], k) => <g key={n}><rect x="10" y={26 + k * 66} width="200" height="42" rx="7" fill={f} stroke={c} strokeWidth="2"/><T x={110} y={44 + k * 66} a="middle" c={c} w={800}>{n}</T><T x={110} y={61 + k * 66} a="middle" c={c}>{s}</T></g>)}
      {Q.map((t, k) => { const y1 = k === 0 ? 4 : k * 66 + 2, y2 = k * 66 + 26; return <g key={t}><Fleche x1={110} y1={y1} x2={110} y2={y2} c={GRIS}/><T x={122} y={(y1 + y2) / 2 + 4} c={ENCRE} w={800}>{t}</T></g>; })}
    </Svg>);
};
