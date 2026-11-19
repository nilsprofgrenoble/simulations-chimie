// Schémas des cartes « À retenir » de la simulation 44 (moteur pas à pas, du stator à l'axe). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
// Stator (4 bobines numérotées) autour d'un rotor-aimant ; actif = liste de bobines alimentées
const Moteur = ({ cx, cy, actif = [1], rot = 0 }) => {
  const P = { 1: [cx, cy - 46], 2: [cx + 46, cy], 3: [cx, cy + 46], 4: [cx - 46, cy] };
  return <g>
    {Object.entries(P).map(([n, [x, y]]) => { const on = actif.includes(+n);
      return <g key={n}><rect x={x - 13} y={y - 13} width="26" height="26" rx="5" fill={on ? '#fed7aa' : '#e2e8f0'} stroke={on ? ORANGE : GRIS} strokeWidth={on ? 2.5 : 1.5}/><T x={x} y={y + 4.5} a="middle" c={on ? ORANGE : GRIS} w={700}>{n}</T></g>; })}
    <circle cx={cx} cy={cy} r="24" fill="#fff" stroke={ENCRE} strokeWidth="2"/>
    <g transform={`rotate(${rot} ${cx} ${cy})`}><polygon points={`${cx},${cy - 22} ${cx - 8},${cy} ${cx + 8},${cy}`} fill={ROUGE}/><polygon points={`${cx},${cy + 22} ${cx - 8},${cy} ${cx + 8},${cy}`} fill="#93c5fd"/></g>
  </g>;
};

export const SchemaStatorRotor = () => (
  <Svg h={150} aria="Le stator fixe porte quatre bobines placées à 90 degrés ; le rotor est un aimant dont le pôle nord, rouge, se tourne vers la bobine alimentée">
    <Moteur cx={70} cy={76} actif={[1]}/>
    <T x={140} y={40} c={ORANGE} w={700}>STATOR (fixe)</T><T x={140} y={58} c={ORANGE}>4 bobines à 90°</T>
    <T x={140} y={100} c={ROUGE} w={700}>ROTOR (aimant)</T><T x={140} y={118} c={GRIS}>pôle N vers la</T><T x={140} y={136} c={GRIS}>bobine alimentée</T>
  </Svg>);

export const SchemaPasComplet = () => (
  <Svg h={150} aria="Pas complet : en alimentant les bobines dans l'ordre 1, 2, 3, 4, le rotor tourne de 90 degrés à chaque pas, donc quatre pas font un tour">
    <Moteur cx={70} cy={76} actif={[2]} rot={90}/>
    <path d="M 70 40 A 36 36 0 0 1 106 76" fill="none" stroke={BLEU} strokeWidth="2.5"/>
    <T x={150} y={36} c={BLEU} w={700}>1 → 2 → 3 → 4</T>
    <T x={150} y={64} c={BLEU}>1 pas = 90°</T><T x={150} y={92} c={VERT} w={700}>4 pas = 1 tour</T>
    <T x={150} y={120} c={GRIS}>champ qui « tourne »</T><T x={150} y={138} c={GRIS}>= rotor entraîné</T>
  </Svg>);

export const SchemaDemiPas = () => {
  const pts = Array.from({ length: 8 }, (_, k) => { const a = (k * 45 - 90) * Math.PI / 180; return [78 + 46 * Math.cos(a), 76 + 46 * Math.sin(a), k]; });
  return (
    <Svg h={150} aria="Demi-pas : en alimentant parfois deux bobines voisines, le champ pointe entre deux bobines ; il y a huit positions par tour, soit 45 degrés par étape">
      <circle cx="78" cy="76" r="46" fill="none" stroke="#cbd5e1" strokeWidth="1.5"/>
      {pts.map(([x, y, k]) => k % 2 === 0
        ? <g key={k}><circle cx={x} cy={y} r="12" fill="#fff" stroke={GRIS} strokeWidth="2"/><T x={x} y={y + 4.5} a="middle" c={GRIS} w={700}>{k / 2 + 1}</T></g>
        : <circle key={k} cx={x} cy={y} r="6" fill={ORANGE}/>)}
      <T x={78} y={80} a="middle" c={ORANGE} w={700}>45°</T>
      <T x={150} y={40} c={GRIS}>rond = 1 bobine</T><T x={150} y={64} c={ORANGE} w={700}>point = 2 bobines</T><T x={150} y={88} c={ORANGE}>voisines</T>
      <T x={150} y={122} c={BLEU} w={700}>8 étapes par tour</T>
    </Svg>);
};

export const SchemaReducteur = () => (
  <Svg h={150} aria="Réducteur à engrenages : à chaque demi-pas du rotor, l'axe de sortie tourne de seulement 0,0879 degré, donc il faut 4096 demi-pas pour un tour d'axe">
    <circle cx="56" cy="64" r="22" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.5"/><T x={56} y={69} a="middle" c={ROUGE} w={700}>rotor</T>
    <circle cx="142" cy="64" r="46" fill="#dbeafe" stroke={BLEU} strokeWidth="2.5"/><T x={142} y={69} a="middle" c={BLEU} w={700}>axe</T>
    <T x={196} y={50} c={GRIS}>1 demi-pas :</T><T x={196} y={70} c={BLEU} w={700}>0,0879°</T><T x={196} y={90} c={GRIS}>sur l’axe</T>
    <T x={150} y={140} a="middle" c={VERT} w={700}>1 tour d’axe = 4096 demi-pas</T>
  </Svg>);

export const SchemaRapport = () => (
  <Svg h={130} aria="Un tour de l'axe demande 8 demi-pas par tour de rotor répétés : le rotor fait 512 tours pour un seul tour de l'axe">
    <circle cx="50" cy="52" r="26" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.5"/><T x={50} y={57} a="middle" c={ROUGE} w={700}>rotor</T>
    <Arr x1={86} y1={52} x2={190} y2={52} c={ENCRE}/><T x={138} y={42} a="middle" c={ENCRE} w={700}>réducteur</T>
    <circle cx="236" cy="52" r="34" fill="#dbeafe" stroke={BLEU} strokeWidth="2.5"/><T x={236} y={57} a="middle" c={BLEU} w={700}>axe</T>
    <T x={50} y={104} a="middle" c={ROUGE} w={700}>des centaines</T><T x={50} y={122} a="middle" c={ROUGE} w={700}>de tours</T>
    <T x={236} y={104} a="middle" c={BLEU} w={700}>1 seul tour</T>
  </Svg>);

export const SchemaDuree = () => (
  <Svg h={120} aria="Durée d'un tour d'axe : nombre de pas multiplié par la durée d'un pas ; exemple avec un délai de 2 millisecondes, 4096 demi-pas donnent environ 8,19 secondes">
    <rect x="6" y="20" width="82" height="40" rx="8" fill="#fff" stroke={BLEU} strokeWidth="2.5"/><T x={47} y={45} a="middle" c={BLEU} w={700}>4096 pas</T>
    <T x={100} y={46} c={ENCRE} w={700}>×</T>
    <rect x="114" y="20" width="76" height="40" rx="8" fill="#fff" stroke={ORANGE} strokeWidth="2.5"/><T x={152} y={45} a="middle" c={ORANGE} w={700}>2 ms</T>
    <T x={202} y={46} c={ENCRE} w={700}>=</T>
    <rect x="216" y="20" width="78" height="40" rx="8" fill="#dcfce7" stroke={VERT} strokeWidth="2.5"/><T x={255} y={45} a="middle" c={VERT} w={700}>8,19 s</T>
    <T x={150} y={90} a="middle" c={GRIS}>8 192 ms ÷ 1 000 = 8,19 s</T><T x={150} y={110} a="middle" c={GRIS}>(exemple : delay(2))</T>
  </Svg>);

export const SchemaPasVsDemi = () => (
  <Svg h={130} aria="Pour un même tour d'axe, le pas complet demande deux fois moins de pas que le demi-pas, donc deux fois moins de temps, mais le positionnement est deux fois moins fin">
    <T x={6} y={28} c={ORANGE} w={700}>demi-pas</T>
    <rect x="86" y="12" width="204" height="22" fill="#fed7aa" stroke={ORANGE} strokeWidth="2"/><T x={188} y={28} a="middle" c={ORANGE} w={700}>N pas</T>
    <T x={6} y={64} c={VERT} w={700}>pas complet</T>
    <rect x="86" y="48" width="102" height="22" fill="#bbf7d0" stroke={VERT} strokeWidth="2"/><T x={137} y={64} a="middle" c={VERT} w={700}>N ÷ 2 pas</T>
    <T x={150} y={104} a="middle" c={BLEU} w={700}>2 fois moins de pas = 2 fois plus rapide</T>
    <T x={150} y={124} a="middle" c={GRIS}>mais positionnement 2 fois moins fin</T>
  </Svg>);
