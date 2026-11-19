// Schémas des cartes « À retenir » de la simulation 95 (SN1, SN2, E1, E2). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0284c7', CYAN = '#0891b2', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', BRUN = '#b45309';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.2"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

export const FDeuxVoies = () => (
  <Svg h={214} aria="Deux voies : dans un halogénoalcane R–Br le carbone lié au brome porte une charge partielle positive ; la substitution remplace Br par le réactif et donne un alcool avec HO moins ; l'élimination arrache un H voisin et donne un alcène">
    <rect x="80" y="10" width="140" height="34" rx="6" fill="#eef6ff" stroke={BLEU} strokeWidth="1.8"/>
    <T x={150} y={26} a="middle" w={700}>R–CH₂–Br</T><T x={150} y={40} a="middle" c={ORANGE} w={700}>δ+ sur le carbone</T>
    <Fleche x1={120} y1={50} x2={72} y2={80} c={BLEU}/><Fleche x1={180} y1={50} x2={228} y2={80} c={ROUGE}/>
    <rect x="12" y="84" width="124" height="86" rx="6" fill="#eef6ff" stroke={BLEU} strokeWidth="2"/>
    <T x={74} y={104} a="middle" c={BLEU} w={800}>SUBSTITUTION</T><T x={74} y={122} a="middle">le réactif</T><T x={74} y={138} a="middle">remplace Br</T><T x={74} y={158} a="middle" c={BLEU} w={700}>→ alcool</T>
    <rect x="164" y="84" width="124" height="86" rx="6" fill="#fef2f2" stroke={ROUGE} strokeWidth="2"/>
    <T x={226} y={104} a="middle" c={ROUGE} w={800}>ÉLIMINATION</T><T x={226} y={122} a="middle">le réactif</T><T x={226} y={138} a="middle">arrache un H</T><T x={226} y={158} a="middle" c={ROUGE} w={700}>→ alcène</T>
    <T x={150} y={192} a="middle" c={GRIS}>nucléophile : attaque un carbone</T><T x={150} y={209} a="middle" c={GRIS}>base : arrache un H</T>
  </Svg>);

const Cl = ({ cx, nR }) => (
  <g>
    {[[-26, 46], [-32, 66], [-26, 86]].map(([dx, y], k) => <g key={k}><Lg x1={cx} y1={66} x2={cx + dx} y2={y} w={2}/><T x={cx + dx - 5} y={y + 4} a="end" c={k < nR ? BLEU : GRIS} w={k < nR ? 800 : 400}>{k < nR ? 'R' : 'H'}</T></g>)}
    <circle cx={cx} cy={66} r="4.5" fill={ENCRE}/><Lg x1={cx} y1={66} x2={cx + 30} y2={66} c={BRUN} w={2}/><T x={cx + 33} y={71} c={BRUN} w={800}>Br</T>
  </g>);
export const FClasse = () => (
  <Svg h={190} aria="Classe du substrat : le nombre de groupes alkyle R portés par le carbone lié à Br vaut un pour un primaire, deux pour un secondaire, trois pour un tertiaire ; plus la classe monte, plus le carbone est encombré et plus le carbocation est stable">
    {[['primaire', 1], ['secondaire', 2], ['tertiaire', 3]].map(([t, n], k) => <g key={t}><Cl cx={54 + k * 96} nR={n}/><T x={54 + k * 96 + 6} y={116} a="middle" c={BLEU} w={800}>{t}</T></g>)}
    <T x={150} y={138} a="middle" c={GRIS} w={700}>barrière de la SN2 (modèle)</T>
    {[85, 100, 125].map((v, k) => <T key={k} x={60 + k * 96} y={156} a="middle" c={ORANGE} w={800}>{v} kJ/mol</T>)}
    <Fleche x1={30} y1={176} x2={150} y2={176} c={ROUGE}/><T x={160} y={181} c={ROUGE}>SN2 plus difficile</T>
  </Svg>);

export const FEtapes = () => (
  <Svg h={222} aria="Une étape ou deux : SN2 et E2 ont un seul état de transition, un seul sommet sur le profil d'énergie ; SN1 et E1 ont deux états de transition séparés par un creux, le carbocation, qui est un intermédiaire ; la première étape, lente, fixe la vitesse">
    <T x={72} y={14} a="middle" c={BLEU} w={800}>SN2, E2</T><T x={226} y={14} a="middle" c={CYAN} w={800}>SN1, E1</T>
    <g transform="translate(0,16)">
    <Lg x1={14} y1={110} x2={134} y2={110} c={GRIS} w={1.4}/><Lg x1={164} y1={110} x2={288} y2={110} c={GRIS} w={1.4}/>
    <path d="M 18 96 C 44 96 50 36 74 36 C 98 36 104 100 130 100" fill="none" stroke={BLEU} strokeWidth="3"/>
    <T x={74} y={28} a="middle" c={BLEU} w={700}>ET</T><T x={74} y={134} a="middle" c={GRIS}>1 étape</T>
    <path d="M 168 96 C 184 96 190 36 206 36 C 222 36 224 80 236 80 C 248 80 252 56 262 56 C 272 56 276 88 286 88" fill="none" stroke={CYAN} strokeWidth="3"/>
    <T x={206} y={28} a="middle" c={ORANGE} w={800}>ET₁</T><T x={262} y={48} a="middle" c={CYAN} w={700}>ET₂</T>
    <T x={236} y={100} a="middle" c={VERT} w={800}>C⁺</T>
    <T x={226} y={134} a="middle" c={GRIS}>2 étapes</T>
    </g>
    <T x={150} y={176} a="middle" c={VERT} w={700}>carbocation = intermédiaire (creux)</T>
    <T x={150} y={196} a="middle" c={ORANGE} w={700}>ET₁ : étape lente, sans réactif</T><T x={150} y={214} a="middle" c={GRIS}>elle fixe la vitesse</T>
  </Svg>);

export const FStereo = () => (
  <Svg h={176} aria="Conséquence sur la configuration : en SN2 le nucléophile attaque par l'arrière du côté opposé à Br et la configuration s'inverse ; en SN1 le carbocation est plan et le nucléophile peut arriver sur l'une ou l'autre face, ce qui donne un mélange racémique">
    <T x={74} y={14} a="middle" c={BLEU} w={800}>SN2 : inversion</T><T x={226} y={14} a="middle" c={CYAN} w={800}>SN1 : racémique</T>
    <Lg x1={150} y1={6} x2={150} y2={150} c="#cbd5e1" w={1.4} d="3 3"/>
    <Lg x1={84} y1={76} x2={84} y2={44} c={ENCRE}/><Lg x1={84} y1={76} x2={60} y2={104} c={ENCRE}/><Lg x1={84} y1={76} x2={108} y2={104} c={ENCRE}/><circle cx="84" cy="76" r="4.5" fill={ENCRE}/>
    <Fleche x1={14} y1={76} x2={74} y2={76} c={BLEU}/><T x={14} y={66} c={BLEU} w={800}>Nu⁻</T>
    <Lg x1={92} y1={76} x2={128} y2={76} c={BRUN} w={1.8} d="4 3"/><T x={134} y={80} a="middle" c={BRUN} w={800}>Br⁻</T>
    <T x={74} y={128} a="middle" c={GRIS}>attaque</T><T x={74} y={144} a="middle" c={GRIS}>par l’arrière</T>
    <polygon points="190,92 270,92 256,66 204,66" fill="#e0f2fe" stroke="#7dd3fc"/><circle cx="230" cy="80" r="4" fill={ENCRE}/>
    <T x={230} y={34} a="middle" c={CYAN} w={800}>Nu⁻</T><Fleche x1={230} y1={38} x2={230} y2={60} c={CYAN}/>
    <T x={230} y={122} a="middle" c={CYAN} w={800}>Nu⁻</T><Fleche x1={230} y1={110} x2={230} y2={96} c={CYAN}/>
    <T x={226} y={144} a="middle" c={GRIS}>carbocation plan :</T><T x={226} y={160} a="middle" c={GRIS}>deux faces</T>
  </Svg>);

export const FTemperature = () => (
  <Svg h={184} aria="Effet de la température sur le 2-bromobutane dans l'eau : à 25 degrés Celsius 25 pour cent d'alcène, à 80 degrés Celsius 45 pour cent d'alcène ; chauffer favorise l'élimination car la variation d'entropie est positive">
    {[['25 °C', 25, 36], ['80 °C', 45, 86]].map(([t, p, y]) => <g key={t}><T x={12} y={y + 17} w={700}>{t}</T>
      <rect x="64" y={y} width={222 * (1 - p / 100)} height="26" fill={BLEU} fillOpacity="0.85"/><rect x={64 + 222 * (1 - p / 100)} y={y} width={222 * p / 100} height="26" fill={ROUGE} fillOpacity="0.85"/>
      <T x={64 + 111 * (1 - p / 100)} y={y + 18} a="middle" c="#fff" w={700}>alcool {100 - p} %</T><T x={64 + 222 * (1 - p / 100) + 111 * p / 100} y={y + 18} a="middle" c="#fff" w={700}>{p} %</T></g>)}
    <T x={12} y={20} c={GRIS}>2-bromobutane dans l’eau</T><T x={286} y={32} a="end" c={ROUGE} w={700}>alcène</T>
    <T x={150} y={136} a="middle" c={VERT} w={700}>1 molécule → 2 : ΔS &gt; 0</T><T x={150} y={156} a="middle" c={GRIS}>ΔG = ΔH − TΔS : plus T est grand,</T><T x={150} y={178} a="middle" c={GRIS}>plus l’élimination l’emporte</T>
  </Svg>);

export const FPrevoir = () => {
  const L = [['primaire', ['SN2 90 %', 'E2 85 %', 'inerte']], ['secondaire', ['E2 70 %', 'E2 95 %', 'SN1 75 %']], ['tertiaire', ['E2 90 %', 'E2 100 %', 'SN1 80 %']]];
  const col = t => t.startsWith('S') ? '#e0f2fe' : t.startsWith('E') ? '#fee2e2' : '#f1f5f9';
  return (
    <Svg h={204} aria="Prévoir le mécanisme dominant à 25 degrés Celsius : substrat primaire, secondaire ou tertiaire avec HO moins base forte, tBuO moins base encombrée, ou eau sans base ; primaire avec HO moins donne SN2, la base encombrée donne surtout E2, sans base un secondaire ou tertiaire donne SN1">
      <T x={8} y={26} c={GRIS} w={700}>à 25 °C</T>
      {[['HO⁻', 'base forte'], ['tBuO⁻', 'encombrée'], ['eau', 'sans base']].map(([a, b], k) => <g key={k}><T x={115 + k * 68} y={16} a="middle" w={800}>{a}</T><T x={115 + k * 68} y={32} a="middle" c={GRIS}>{b}</T></g>)}
      {L.map(([r, cs], i) => <g key={r}><T x={8} y={68 + i * 42} w={700} c={BLEU}>{r}</T>
        {cs.map((c, k) => <g key={k}><rect x={82 + k * 68} y={44 + i * 42} width="66" height="36" rx="5" fill={col(c)} stroke="#94a3b8"/><T x={115 + k * 68} y={67 + i * 42} a="middle" c={c.startsWith('S') ? BLEU : c.startsWith('E') ? ROUGE : GRIS} w={700}>{c}</T></g>)}</g>)}
      <T x={150} y={182} a="middle" c={GRIS}>pourcentages : ordres de grandeur du modèle</T><T x={150} y={198} a="middle" c={GRIS}>solvants protiques seulement</T>
    </Svg>);
};
