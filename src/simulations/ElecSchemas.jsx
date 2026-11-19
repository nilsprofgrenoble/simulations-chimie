// Schémas des cartes « À retenir » de la simulation 51 (électrisation et influence). viewBox de 300, texte de 12,5.
import { TL } from "./Travail";
const GRIS = '#475569', ORANGE = '#c2410c', VERT = '#15803d', ENCRE = '#0f172a', VIOLET = '#6d28d9';
const PLUS = '#dc2626', MOINS = '#2563eb', PLUST = '#b91c1c', MOINST = '#1d4ed8';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
// Charge élémentaire : cercle portant + (rouge) ou − (bleu)
const Pion = ({ x, y, s, r = 8 }) => <g><circle cx={x} cy={y} r={r} fill={s > 0 ? PLUS : MOINS}/><text x={x} y={y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#fff">{s > 0 ? '+' : '−'}</text></g>;
const Boule = ({ x, y, s, r = 15 }) => <g><circle cx={x} cy={y} r={r} fill={s > 0 ? PLUS : s < 0 ? MOINS : '#94a3b8'}/><text x={x} y={y + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{s > 0 ? '+' : s < 0 ? '−' : '0'}</text></g>;

export const FNeutre = () => (
  <Svg h={172} aria="Un objet neutre contient autant de charges positives, les protons, que de charges négatives, les électrons : sa charge totale est nulle">
    <rect x="50" y="14" width="200" height="74" rx="10" fill="#f1f5f9" stroke={GRIS} strokeWidth="2"/>
    {[84, 128, 172, 216].map(x => <g key={x}><Pion x={x} y={38} s={1}/><Pion x={x} y={64} s={-1}/></g>)}
    <T x={150} y={116} a="middle" w={800}>neutre : autant de + que de −</T><T x={150} y={134} a="middle" c={GRIS}>charge totale nulle</T>
    <Pion x={72} y={158} s={1}/><T x={86} y={162}>proton</T><Pion x={170} y={158} s={-1}/><T x={184} y={162}>électron</T>
  </Svg>);

export const FCharge = () => (
  <Svg h={184} aria="Charge d'un corps électrisé : un corps qui perd n électrons porte la charge plus n fois e, un corps qui en gagne n porte moins n fois e ; e vaut 1,602 fois 10 puissance moins 19 coulomb ; exemple : 3 électrons perdus donnent plus 3 e, soit environ 4,8 fois 10 puissance moins 19 coulomb">
    <T x={90} y={34} a="middle" c={MOINST} w={800}>gagne n e⁻ : −n e</T><T x={214} y={34} a="middle" c={PLUST} w={800}>perd n e⁻ : +n e</T>
    <Fleche x1={140} y1={52} x2={44} y2={52} c={MOINS}/><Fleche x1={160} y1={52} x2={256} y2={52} c={PLUS}/>
    <Lg x1={20} y1={96} x2={280} y2={96} c={GRIS} w={1.8}/>
    {[[46, '−4e'], [150, '0'], [254, '+4e']].map(([x, t]) => <g key={t}><Lg x1={x} y1={90} x2={x} y2={102} c={GRIS} w={1.8}/><T x={x} y={120} a="middle" c={GRIS} w={700}>{t}</T></g>)}
    <T x={150} y={152} a="middle" w={800}>e = 1,602 × 10⁻¹⁹ C</T><T x={150} y={172} a="middle" c={GRIS}>3 e⁻ perdus : +3e ≈ +4,8 × 10⁻¹⁹ C</T>
  </Svg>);

export const FConserv = () => (
  <Svg h={156} aria="Conservation de la charge : un corps A perd n électrons et porte plus n e, un corps B gagne ces n électrons et porte moins n e ; la somme des charges reste nulle">
    <rect x="12" y="26" width="104" height="62" rx="8" fill="#fee2e2" stroke={PLUS} strokeWidth="2"/><T x={64} y={50} a="middle" w={800}>corps A</T><T x={64} y={74} a="middle" c={PLUST} w={800}>+n e</T>
    <rect x="184" y="26" width="104" height="62" rx="8" fill="#dbeafe" stroke={MOINS} strokeWidth="2"/><T x={236} y={50} a="middle" w={800}>corps B</T><T x={236} y={74} a="middle" c={MOINST} w={800}>−n e</T>
    <Fleche x1={120} y1={60} x2={180} y2={60} c={MOINS}/><T x={150} y={50} a="middle" c={MOINST} w={800}>n e⁻</T>
    <T x={150} y={120} a="middle" w={800}>(+n e) + (−n e) = 0</T><T x={150} y={142} a="middle" c={GRIS}>rien ne se crée, tout se transfère</T>
  </Svg>);

export const FBilanFrott = () => (
  <Svg h={184} aria="Électrisation par frottement : seuls les électrons se déplacent ; la tige en verre perd des électrons et devient positive ; la tige en ébonite gagne des électrons et devient négative ; le tissu prend le signe opposé">
    <T x={150} y={16} a="middle" w={800}>seuls les électrons se déplacent</T>
    {[['tige en verre', 'perd des e⁻', 'charge +', '#fee2e2', PLUS, PLUST], ['tige en ébonite', 'gagne des e⁻', 'charge −', '#dbeafe', MOINS, MOINST]].map(([n, a, c, f, s, t], k) => (
      <g key={n}><rect x="8" y={32 + k * 56} width="128" height="44" rx="8" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.8"/><T x={72} y={59 + k * 56} a="middle" w={700}>{n}</T>
        <Fleche x1={140} y1={54 + k * 56} x2={160} y2={54 + k * 56} c={GRIS}/>
        <rect x="164" y={32 + k * 56} width="128" height="44" rx="8" fill={f} stroke={s} strokeWidth="2"/><T x={228} y={51 + k * 56} a="middle" c={ENCRE}>{a}</T><T x={228} y={68 + k * 56} a="middle" c={t} w={800}>{c}</T></g>))}
    <T x={150} y={158} a="middle" c={GRIS}>le tissu prend le signe opposé</T><T x={150} y={176} a="middle" c={GRIS}>q = ±n × e</T>
  </Svg>);

export const FInteraction = () => (
  <Svg h={176} aria="Interaction entre corps chargés : deux charges de même signe se repoussent, deux charges de signes opposés s'attirent">
    <Boule x={110} y={38} s={-1}/><Boule x={190} y={38} s={-1}/><Fleche x1={92} y1={38} x2={56} y2={38} c={ORANGE}/><Fleche x1={208} y1={38} x2={244} y2={38} c={ORANGE}/>
    <T x={150} y={78} a="middle" c={ORANGE} w={800}>même signe : répulsion</T>
    <Boule x={72} y={112} s={1}/><Boule x={228} y={112} s={-1}/><Fleche x1={92} y1={112} x2={140} y2={112} c={VERT}/><Fleche x1={208} y1={112} x2={160} y2={112} c={VERT}/>
    <T x={150} y={152} a="middle" c={VERT} w={800}>signes opposés : attraction</T><T x={150} y={172} a="middle" c={GRIS}>la gravitation, elle, est toujours attractive</T>
  </Svg>);

export const FReciproques = () => (
  <Svg h={196} aria="Actions réciproques entre la tige et la paille : la force exercée par la tige sur la paille et la force exercée par la paille sur la tige ont la même norme et des sens opposés">
    <Boule x={80} y={40} s={-1}/><Boule x={220} y={40} s={-1}/><T x={80} y={74} a="middle" c={GRIS}>tige</T><T x={220} y={74} a="middle" c={GRIS}>paille</T>
    <Fleche x1={236} y1={40} x2={284} y2={40} c={ORANGE} w={3}/><Fleche x1={64} y1={40} x2={16} y2={40} c={VIOLET} w={3}/>
    <rect x="14" y="94" width="14" height="6" fill={ORANGE}/><TL x={34} y={104} s={12.5} w={400} segs={[{ v: 'F' }, ' de la tige sur la paille']}/>
    <rect x="14" y="116" width="14" height="6" fill={VIOLET}/><TL x={34} y={126} s={12.5} w={400} segs={[{ v: 'F' }, ' de la paille sur la tige']}/>
    <TL x={44} y={158} s={13} w={800} segs={[{ v: 'F' }, 'tige/paille = −', { v: 'F' }, 'paille/tige']}/>
    <T x={150} y={184} a="middle" c={GRIS}>même norme, sens opposés</T>
  </Svg>);

export const FDecharge = () => (
  <Svg h={190} aria="Dé-électrisation : une paille négative qui touche une tige positive lui cède ses électrons en excès ; les charges se compensent, les deux corps deviennent neutres et la force disparaît">
    <T x={70} y={16} a="middle" c={GRIS} w={700}>avant</T><T x={228} y={16} a="middle" c={GRIS} w={700}>après</T>
    <Boule x={38} y={62} s={-1}/><Boule x={102} y={62} s={1}/><Fleche x1={58} y1={44} x2={86} y2={44} c={MOINS}/><T x={72} y={38} a="middle" c={MOINST} w={800}>e⁻</T>
    <Fleche x1={128} y1={62} x2={176} y2={62} c={GRIS}/>
    <Boule x={196} y={62} s={0}/><Boule x={260} y={62} s={0}/>
    <T x={70} y={98} a="middle" c={GRIS}>paille −, tige +</T><T x={228} y={98} a="middle" c={GRIS}>deux corps neutres</T>
    <T x={150} y={128} a="middle" w={700}>au contact, des électrons passent</T><T x={150} y={148} a="middle" w={700}>du corps en excès à celui qui en manque</T>
    <T x={150} y={176} a="middle" c={VERT} w={800}>charges compensées : plus de force</T>
  </Svg>);

const Tige = ({ x = 8, y = 44, w = 56, h = 84, s = 1 }) => <g><rect x={x} y={y} width={w} height={h} rx="6" fill={s > 0 ? '#fee2e2' : '#dbeafe'} stroke={s > 0 ? PLUS : MOINS} strokeWidth="2"/>{[0, 1, 2].map(k => <Pion key={k} x={x + w / 2} y={y + 18 + k * 24} s={s}/>)}</g>;
const BouleInfl = ({ cx = 182, cy = 86, r = 46, gauche = -1, droite = 1 }) => (
  <g><circle cx={cx} cy={cy} r={r} fill="#e2e8f0" stroke={GRIS} strokeWidth="2.4"/><Lg x1={cx} y1={cy - r} x2={cx} y2={cy + r} c={GRIS} w={1.2} d="4 3"/>
    {[[-24, -22], [-32, 0], [-24, 22]].map(([dx, dy], k) => <Pion key={'g' + k} x={cx + dx} y={cy + dy} s={gauche}/>)}
    {[[24, -22], [32, 0], [24, 22]].map(([dx, dy], k) => <Pion key={'d' + k} x={cx + dx} y={cy + dy} s={droite}/>)}</g>);

export const FRepartition = () => (
  <Svg h={206} aria="Influence : une tige chargée positivement, approchée sans contact d'une boule d'aluminium neutre, attire les électrons libres vers la face proche, qui devient négative ; la face éloignée est positive ; la charge totale de la boule reste nulle">
    <Tige/><T x={36} y={36} a="middle" c={PLUST} w={800}>tige +</T>
    <BouleInfl/><T x={182} y={20} a="middle" c={GRIS}>boule neutre</T>
    <T x={150} y={162} a="middle" c={MOINST} w={800}>face proche : − (électrons attirés)</T><T x={150} y={182} a="middle" c={PLUST} w={800}>face éloignée : +</T><T x={150} y={202} a="middle" w={700}>charge totale : 0</T>
  </Svg>);

export const FAttraction = () => (
  <Svg h={222} aria="Pourquoi la boule neutre est attirée : la force électrique diminue avec la distance ; l'attraction exercée par la tige sur la face proche, négative, est plus forte que la répulsion exercée sur la face éloignée, positive ; la boule est donc attirée">
    <Tige/><BouleInfl/>
    <Fleche x1={160} y1={152} x2={100} y2={152} c={VERT} w={4}/><Fleche x1={204} y1={152} x2={230} y2={152} c={ORANGE} w={2.4}/>
    <T x={130} y={172} a="middle" c={VERT} w={800}>forte : attraction</T><T x={226} y={172} a="middle" c={ORANGE} w={800}>faible</T>
    <T x={150} y={194} a="middle" w={700}>la force diminue avec la distance :</T><T x={150} y={212} a="middle" w={700}>la face proche l’emporte</T>
  </Svg>);

export const FContactBoule = () => (
  <Svg h={188} aria="Au contact d'une tige positive, la boule neutre cède des électrons à la tige : elle perd n électrons et sa charge devient positive, égale à plus n fois e">
    <Tige x={8} y={50} w={56} h={84} s={1}/><circle cx="108" cy="92" r="44" fill="#fee2e2" stroke={PLUS} strokeWidth="2.4"/>
    {[[98, 72], [122, 72], [98, 96], [122, 96], [110, 116]].map(([x, y], k) => <Pion key={k} x={x} y={y} s={1}/>)}
    <Fleche x1={104} y1={36} x2={44} y2={36} c={MOINS}/><T x={74} y={28} a="middle" c={MOINST} w={800}>e⁻</T>
    <T x={226} y={78} a="middle" w={800}>contact</T><T x={226} y={98} a="middle" c={GRIS}>des électrons passent</T><T x={226} y={116} a="middle" c={GRIS}>de la boule à la tige</T>
    <T x={150} y={170} a="middle" c={PLUST} w={800}>la boule perd n e⁻ : q = +n e</T>
  </Svg>);

export const FBilanInfl = () => (
  <Svg h={178} aria="Bilan : sans contact, par influence, la boule neutre au total est attirée ; au contact, elle prend une charge de même signe que la tige et elle est repoussée">
    <rect x="8" y="10" width="284" height="72" rx="8" fill="#e0f2fe" stroke="#0369a1" strokeWidth="2"/><T x={150} y={34} a="middle" c="#0369a1" w={800}>sans contact : influence</T><T x={150} y={54} a="middle">charge totale nulle, charges déplacées</T><T x={150} y={72} a="middle" c="#0369a1" w={800}>→ boule attirée</T>
    <rect x="8" y="94" width="284" height="72" rx="8" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><T x={150} y={118} a="middle" c={ORANGE} w={800}>au contact</T><T x={150} y={138} a="middle">charge de même signe que la tige</T><T x={150} y={156} a="middle" c={ORANGE} w={800}>→ boule repoussée</T>
  </Svg>);

const Electroscope = ({ cx, ouvert, signe, charges, plusieurs }) => {
  const ex = ouvert ? 26 : 5, ey = 152;
  return (
    <g><circle cx={cx} cy={32} r={16} fill="#e2e8f0" stroke={GRIS} strokeWidth="2.4"/><Lg x1={cx} y1={48} x2={cx} y2={96} c={GRIS} w={3}/>
      <Lg x1={cx} y1={96} x2={cx - ex} y2={ey} c={GRIS} w={3}/><Lg x1={cx} y1={96} x2={cx + ex} y2={ey} c={GRIS} w={3}/>
      {charges && <g><Pion x={cx - ex - 1} y={ey + 10} s={signe} r={9}/><Pion x={cx + ex + 1} y={ey + 10} s={signe} r={9}/></g>}
      {plusieurs}</g>);
};
export const FElectroscope = () => (
  <Svg h={206} aria="Électroscope : une sphère métallique, une tige et deux feuilles métalliques ; neutre, ses feuilles restent fermées ; chargé, les deux feuilles portent des charges de même signe, se repoussent et s'écartent">
    <Electroscope cx={76} ouvert={false} signe={0} charges={false}/><Electroscope cx={224} ouvert={true} signe={1} charges={true}/>
    <T x={96} y={36} c={GRIS}>sphère</T><T x={86} y={78} c={GRIS}>tige</T><T x={100} y={134} c={GRIS}>feuilles</T>
    <T x={76} y={182} a="middle" w={800}>neutre</T><T x={224} y={182} a="middle" w={800}>chargé</T>
    <T x={76} y={200} a="middle" c={GRIS}>feuilles fermées</T><T x={224} y={200} a="middle" c={GRIS}>feuilles écartées</T>
  </Svg>);

const Tige2 = ({ s }) => <g><rect x="8" y="22" width="74" height="30" rx="6" fill={s > 0 ? '#fee2e2' : '#dbeafe'} stroke={s > 0 ? PLUS : MOINS} strokeWidth="2"/>{[22, 45, 68].map(x => <Pion key={x} x={x} y={37} s={s}/>)}</g>;
export const FInfElec = () => (
  <Svg h={226} aria="Influence sur un électroscope neutre : une tige positive approchée sans contact attire les électrons libres vers la sphère ; les deux feuilles, privées d'électrons, portent des charges positives et s'écartent">
    <Tige2 s={1}/><T x={45} y={72} a="middle" c={GRIS}>sans contact</T>
    <circle cx="190" cy="36" r="26" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.4"/><Pion x={181} y={26} s={-1}/><Pion x={181} y={46} s={-1}/>
    <Lg x1={190} y1={62} x2={190} y2={108} c={GRIS} w={3}/><Lg x1={190} y1={108} x2={160} y2={160} c={GRIS} w={3}/><Lg x1={190} y1={108} x2={220} y2={160} c={GRIS} w={3}/>
    <Pion x={158} y={172} s={1} r={9}/><Pion x={222} y={172} s={1} r={9}/>
    <T x={150} y={198} a="middle" w={700}>électrons attirés vers la sphère</T><T x={150} y={216} a="middle" c={PLUST} w={800}>feuilles + : elles s’écartent</T>
  </Svg>);

export const FContactElec = () => (
  <Svg h={226} aria="Contact d'une tige positive avec la sphère d'un électroscope : des électrons passent de l'électroscope à la tige ; l'électroscope perd n électrons et porte la charge plus n e ; il est chargé positivement">
    <rect x="84" y="24" width="72" height="30" rx="6" fill="#fee2e2" stroke={PLUS} strokeWidth="2"/>{[102, 120, 138].map(x => <Pion key={x} x={x} y={39} s={1}/>)}
    <circle cx="184" cy="40" r="28" fill="#fee2e2" stroke={PLUS} strokeWidth="2.4"/><Pion x={176} y={30} s={1}/><Pion x={176} y={50} s={1}/><Pion x={195} y={40} s={1}/>
    <Fleche x1={170} y1={14} x2={118} y2={14} c={MOINS}/><T x={144} y={8} a="middle" c={MOINST} w={800}>e⁻</T>
    <Lg x1={184} y1={68} x2={184} y2={112} c={GRIS} w={3}/><Lg x1={184} y1={112} x2={156} y2={160} c={GRIS} w={3}/><Lg x1={184} y1={112} x2={212} y2={160} c={GRIS} w={3}/>
    <Pion x={154} y={172} s={1} r={9}/><Pion x={214} y={172} s={1} r={9}/>
    <T x={150} y={198} a="middle" w={700}>l’électroscope perd n électrons</T><T x={150} y={216} a="middle" c={PLUST} w={800}>il porte q = +n e</T>
  </Svg>);

export const FOpposeElec = () => (
  <Svg h={226} aria="Tige négative approchée d'un électroscope chargé positivement : elle repousse les électrons libres vers les feuilles, qui compensent leurs charges positives ; les feuilles se referment">
    <Tige2 s={-1}/><T x={45} y={72} a="middle" c={GRIS}>sans contact</T>
    <circle cx="190" cy="36" r="26" fill="#fee2e2" stroke={GRIS} strokeWidth="2.4"/><Pion x={181} y={26} s={1}/><Pion x={181} y={46} s={1}/><Pion x={199} y={36} s={1}/>
    <Lg x1={190} y1={62} x2={190} y2={108} c={GRIS} w={3}/><Fleche x1={204} y1={72} x2={204} y2={104} c={MOINS}/><T x={218} y={92} c={MOINST} w={800}>e⁻</T>
    <Lg x1={190} y1={108} x2={178} y2={160} c={GRIS} w={3}/><Lg x1={190} y1={108} x2={202} y2={160} c={GRIS} w={3}/>
    <T x={150} y={196} a="middle" w={700}>électrons repoussés vers les feuilles</T><T x={150} y={214} a="middle" c={GRIS}>ils compensent les charges +</T>
  </Svg>);

export const FBilanElec = () => (
  <Svg h={184} aria="Méthode : dire quel corps gagne ou perd des électrons, en déduire les signes des charges, puis conclure attraction ou répulsion, en distinguant l'influence et le contact">
    {[['quel corps gagne ou perd des e⁻ ?', MOINS], ['en déduire les signes des charges', MOINS], ['même signe : répulsion, sinon attraction', ORANGE], ['contact ou influence ? charge totale', VERT]].map(([t, c], i) => (
      <g key={i}><circle cx="16" cy={22 + i * 38} r="12" fill={c}/><T x={16} y={26.5 + i * 38} a="middle" c="#fff" w={800}>{i + 1}</T><T x={38} y={27 + i * 38} w={600}>{t}</T>
        {i < 3 && <Lg x1={16} y1={34 + i * 38} x2={16} y2={48 + i * 38} c={GRIS}/>}</g>))}
  </Svg>);
