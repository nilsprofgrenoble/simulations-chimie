// Schémas des cartes « À retenir » de la simulation 33 (temps de réponse d'un capteur). viewBox de 300, texte de 12,5.
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
const pts = (f, a, b, step = 2) => { const o = []; for (let x = a; x <= b + 1e-9; x += step) o.push(`${x.toFixed(1)},${f(x).toFixed(1)}`); return o.join(' '); };

export const FTemps = () => {
  const x0 = 76, tau = 34, yf = 110, yi = 36;
  const f = x => x < x0 ? yi : yf - (yf - yi) * Math.exp(-(x - x0) / tau);
  const x1 = x0 + tau * Math.log((yf - yi) / 8);
  return (
    <Svg h={198} aria="Réponse d'un capteur à un échelon : la tension passe de V initial à V final en suivant une courbe ; le temps de réponse à 5 pour cent est la durée entre l'instant t zéro de l'échelon et l'instant t un où la courbe entre dans la bande de plus ou moins 5 pour cent autour de V final, sans en ressortir">
      <Lg x1={46} y1={22} x2={46} y2={130} c={GRIS} w={1.8}/><Lg x1={46} y1={130} x2={290} y2={130} c={GRIS} w={1.8}/>
      <rect x="46" y="102" width="244" height="16" fill={VERT} opacity="0.22"/><Lg x1={46} y1={102} x2={290} y2={102} c={VERT} w={1.4} d="4 3"/><Lg x1={46} y1={118} x2={290} y2={118} c={VERT} w={1.4} d="4 3"/>
      <polyline points={pts(f, 46, 288)} fill="none" stroke={BLEU} strokeWidth="3"/>
      <Lg x1={x0} y1={22} x2={x0} y2={134} c={GRIS} w={1.4} d="3 3"/><Lg x1={x1} y1={80} x2={x1} y2={134} c={ORANGE} w={1.8} d="3 3"/>
      <TE x={4} y={40} c={GRIS} w={800} parts={['V', '_ini']}/><TE x={4} y={114} c={GRIS} w={800} parts={['V', '_fin']}/>
      <TE x={x0} y={150} a="middle" c={GRIS} w={800} parts={['t', '_0']}/><TE x={x1} y={150} a="middle" c={ORANGE} w={800} parts={['t', '_1']}/>
      <Fleche x1={x0 + 2} y1={142} x2={x1 - 2} y2={142} c={ORANGE} w={2.2}/>
      <T x={190} y={82} c={VERT} w={800}>bande ±5 %</T>
      <TE x={150} y={172} a="middle" w={800} parts={['t', '_R', ' = t', '_1', ' − t', '_0', ' : une durée']}/>
      <T x={150} y={192} a="middle" c={GRIS}>t₁ : la courbe entre dans la bande</T>
    </Svg>);
};

export const FTau = () => {
  const x0 = 40, tau = 45, yb = 130;
  const f = x => yb - 100 * (1 - Math.exp(-(x - x0) / tau));
  const P = [[1, '63 %', 'τ'], [3, '95 %', '3τ'], [5, '99,3 %', '5τ']];
  return (
    <Svg h={196} aria="Variation déjà effectuée en pourcentage de la variation totale : 63 pour cent après une constante de temps tau, 95 pour cent après 3 tau, 99,3 pour cent après 5 tau ; au bout de 3 tau il reste 5 pour cent, d'où le temps de réponse égal à 3 tau">
      <T x={150} y={14} a="middle" w={800}>Variation déjà effectuée</T>
      <Lg x1={x0} y1={26} x2={x0} y2={yb} c={GRIS} w={1.8}/><Lg x1={x0} y1={yb} x2={290} y2={yb} c={GRIS} w={1.8}/>
      <Lg x1={x0} y1={30} x2={290} y2={30} c="#94a3b8" w={1.4} d="4 3"/><T x={288} y={24} a="end" c={GRIS} w={800}>100 %</T>
      <polyline points={pts(f, x0, 288)} fill="none" stroke={BLEU} strokeWidth="3"/>
      {P.map(([k, l, t]) => { const x = x0 + k * tau, y = f(x); return <g key={k}><Lg x1={x} y1={y} x2={x} y2={yb} c={ORANGE} w={1.6} d="3 3"/><circle cx={x} cy={y} r="5.5" fill={ORANGE} stroke={ENCRE} strokeWidth="1.4"/>
        <T x={x + (k === 1 ? 10 : -7)} y={y + 22} a={k === 1 ? 'start' : 'end'} c={ORANGE} w={800}>{l}</T><T x={x} y={146} a="middle" c={GRIS} w={800}>{t}</T></g>; })}
      <TE x={150} y={170} a="middle" w={800} parts={['t', '_R', ' = 3τ : il reste 5 %']}/>
      <T x={150} y={190} a="middle" c={GRIS}>τ petite : capteur rapide</T>
    </Svg>);
};

export const FSondes = () => {
  const x0 = 40, yb = 130;
  const g = tau => x => yb - 90 * (1 - Math.exp(-(x - x0) / tau));
  return (
    <Svg h={200} aria="Deux capteurs de constantes de temps 2 secondes et 10 secondes : le plus rapide atteint 95 pour cent de la variation en 6 secondes, le plus lent en 30 secondes ; plus le temps de réponse est petit, plus le capteur est rapide">
      <TE x={150} y={14} a="middle" w={800} parts={['Petit t', '_R', ' = capteur rapide']}/>
      <Lg x1={x0} y1={26} x2={x0} y2={yb} c={GRIS} w={1.8}/><Lg x1={x0} y1={yb} x2={290} y2={yb} c={GRIS} w={1.8}/>
      <Lg x1={x0} y1={yb - 85.5} x2={290} y2={yb - 85.5} c="#94a3b8" w={1.4} d="4 3"/><T x={34} y={yb - 81} a="end" c={GRIS} w={800}>95 %</T>
      <polyline points={pts(g(15), x0, 288)} fill="none" stroke={BLEU} strokeWidth="3"/><polyline points={pts(g(50), x0, 288)} fill="none" stroke={ORANGE} strokeWidth="3"/>
      <Lg x1={x0 + 45} y1={yb - 85.5} x2={x0 + 45} y2={yb} c={BLEU} w={1.6} d="3 3"/><Lg x1={x0 + 150} y1={yb - 85.5} x2={x0 + 150} y2={yb} c={ORANGE} w={1.6} d="3 3"/>
      <TE x={x0 + 45} y={146} a="middle" c={BLEU} w={800} parts={['6 s']}/><TE x={x0 + 150} y={146} a="middle" c={ORANGE} w={800} parts={['30 s']}/>
      <TE x={150} y={168} a="middle" c={BLEU} w={800} parts={['τ = 2 s : t', '_R', ' ≈ 6 s']}/>
      <TE x={150} y={188} a="middle" c={ORANGE} w={800} parts={['τ = 10 s : t', '_R', ' ≈ 30 s']}/>
    </Svg>);
};

const surv = (s, z = 0.30) => { const w = 0.16, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * s) * (Math.cos(wd * s) + z / Math.sqrt(1 - z * z) * Math.sin(wd * s)); };

export const FOscille = () => {
  const x0 = 50, yb = 130, A = 70;
  const f = x => yb - A * (x < x0 ? 0 : surv(x - x0));
  let entree = null, sortie = x0;
  for (let x = x0; x <= 290; x += 0.5) { const v = surv(x - x0); if (entree === null && v >= 0.95) entree = x; if (Math.abs(v - 1) > 0.05) sortie = x; }
  return (
    <Svg h={212} aria="Grandeur qui oscille autour de sa valeur finale : la bande de plus ou moins 5 pour cent est atteinte une première fois puis la courbe en ressort ; le temps de réponse se mesure jusqu'à la dernière sortie de la bande, après laquelle la courbe y reste">
      <T x={150} y={14} a="middle" w={800}>La dernière sortie de la bande</T>
      <Lg x1={46} y1={24} x2={46} y2={130} c={GRIS} w={1.8}/><Lg x1={46} y1={130} x2={290} y2={130} c={GRIS} w={1.8}/>
      <rect x="46" y={yb - A * 1.05} width="244" height={A * 0.1} fill={VERT} opacity="0.25"/>
      <polyline points={pts(f, 46, 288, 1)} fill="none" stroke={BLEU} strokeWidth="3"/>
      <Lg x1={x0} y1={30} x2={x0} y2={134} c={GRIS} w={1.4} d="3 3"/>
      <Lg x1={entree} y1={yb - A} x2={entree} y2={134} c="#94a3b8" w={1.8} d="3 3"/><Lg x1={sortie} y1={50} x2={sortie} y2={134} c={ORANGE} w={2} d="3 3"/>
      <TE x={x0} y={150} a="middle" c={GRIS} w={800} parts={['t', '_0']}/><TE x={sortie} y={150} a="start" c={ORANGE} w={800} parts={['t', '_1']}/>
      <Fleche x1={x0 + 2} y1={162} x2={sortie - 2} y2={162} c={ORANGE} w={2.2}/>
      <TE x={150} y={182} a="middle" w={800} parts={['t', '_R', ' = t', '_1', ' − t', '_0']}/>
      <T x={150} y={202} a="middle" c={GRIS}>gris : 1re entrée, à écarter</T>
    </Svg>);
};

export const FDepass = () => {
  const x0 = 56, yb = 130, A = 70, z = 0.404, w = 0.12, wd = w * Math.sqrt(1 - z * z);
  const v = s => 1 - Math.exp(-z * w * s) * (Math.cos(wd * s) + z / Math.sqrt(1 - z * z) * Math.sin(wd * s));
  const f = x => yb - A * (x < x0 ? 0 : v(x - x0));
  const sp = Math.PI / wd, xp = x0 + sp, yp = f(xp), yfin = yb - A;
  return (
    <Svg h={212} aria="Dépassement d'une réponse oscillante : l'excès du pic au-dessus de la valeur finale, divisé par la variation totale ; exemple avec un pic à 70, une valeur finale à 60 et une valeur initiale à 20, le dépassement vaut 10 divisé par 40, soit 25 pour cent">
      <T x={150} y={14} a="middle" w={800}>Le dépassement</T>
      <Lg x1={46} y1={24} x2={46} y2={130} c={GRIS} w={1.8}/><Lg x1={46} y1={130} x2={290} y2={130} c={GRIS} w={1.8}/>
      <Lg x1={46} y1={yfin} x2={290} y2={yfin} c="#94a3b8" w={1.4} d="4 3"/><Lg x1={46} y1={yp} x2={290} y2={yp} c={ORANGE} w={1.4} d="4 3"/>
      <polyline points={pts(f, 46, 288, 1)} fill="none" stroke={BLEU} strokeWidth="3"/>
      <Lg x1={xp + 14} y1={yfin} x2={xp + 14} y2={yp} c={ORANGE} w={2.4}/><Lg x1={xp + 9} y1={yp} x2={xp + 19} y2={yp} c={ORANGE} w={2}/><Lg x1={xp + 9} y1={yfin} x2={xp + 19} y2={yfin} c={ORANGE} w={2}/>
      <T x={xp + 24} y={(yp + yfin) / 2 + 4} c={ORANGE} w={800}>excès</T>
      <TE x={290} y={yp - 5} a="end" c={ORANGE} w={800} parts={['y', '_max', ' = 70']}/><TE x={290} y={yfin + 14} a="end" c={GRIS} w={800} parts={['y', '_fin', ' = 60']}/><TE x={290} y={yb - 6} a="end" c={GRIS} w={800} parts={['y', '_ini', ' = 20']}/>
      <TE x={150} y={168} a="middle" w={800} parts={['D = (y', '_max', ' − y', '_fin', ') ÷ |Δy|']}/>
      <T x={150} y={188} a="middle">D = (70 − 60) ÷ 40 = 0,25 = 25 %</T>
      <T x={150} y={206} a="middle" c={GRIS}>sans unité ; × 100 pour les %</T>
    </Svg>);
};

export const FBilanRep = () => {
  const L = [['Relever', ['V', '_ini', ', V', '_fin', ', t', '_0', ' ; |ΔV|']], ['Tracer la bande', ['V', '_fin', ' ± 0,05 × |ΔV|']], ['Lire t', ['_1', ' : la courbe reste dans la bande']], ['Calculer', ['t', '_R', ' = t', '_1', ' − t', '_0', ' (durée)']], ['Hypothèses', ['échelon idéal, premier ordre']]];
  return (
    <Svg h={232} aria="Méthode en cinq étapes : relever les niveaux et t zéro, tracer la bande de plus ou moins 5 pour cent, lire t un quand la courbe reste dans la bande, calculer le temps de réponse comme une durée, et rappeler les hypothèses du travail">
      {L.map(([a, b], i) => <g key={i}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        {a === 'Lire t' ? <TE x={48} y={23 + i * 44} parts={['Lire t', '_1']} w={800}/> : <T x={48} y={23 + i * 44} w={800}>{a}</T>}<TE x={48} y={38 + i * 44} c={GRIS} parts={a === 'Lire t' ? ['la courbe reste dans la bande ±5 %'] : b}/></g>)}
    </Svg>);
};
