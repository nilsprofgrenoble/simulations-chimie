// Schémas des cartes « À retenir » de la simulation 101 (lasure alkyde). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.4"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

export const FDeuxTemps = () => {
  const X = m => 24 + Math.log10(m) * 50.9;
  const reps = [['1 min', 1], ['1 h', 60], ['1 j', 1440], ['3 mois', 129600]];
  return (
    <Svg h={176} aria="Deux temps de séchage sur une échelle de temps logarithmique de 1 minute à 3 mois : le séchage physique, par évaporation du white spirit, s'achève en quelques heures ; le séchage chimique, par réticulation, se poursuit pendant des jours">
      <T x={12} y={16} c={GRIS}>échelle de temps logarithmique</T>
      <rect x={X(1)} y="28" width={X(180) - X(1)} height="22" rx="4" fill="#cfe5f6" stroke={BLEU} strokeWidth="1.6"/><T x={(X(1) + X(180)) / 2} y={44} a="middle" c={BLEU} w={800}>physique</T>
      <rect x={X(60)} y="56" width={X(129600) - X(60)} height="22" rx="4" fill="#fbdcc6" stroke={ORANGE} strokeWidth="1.6"/><T x={(X(60) + X(129600)) / 2} y={72} a="middle" c={ORANGE} w={800}>chimique</T>
      <Lg x1={24} y1={90} x2={284} y2={90} c={GRIS} w={1.8}/>
      {reps.map(([t, m]) => <g key={t}><Lg x1={X(m)} y1={90} x2={X(m)} y2={96} c={GRIS} w={1.6}/><T x={Math.min(X(m), 272)} y={112} a="middle" c={GRIS}>{t}</T></g>)}
      <T x={12} y={140} c={BLEU} w={700}>physique : le white spirit s’évapore</T>
      <T x={12} y={160} c={ORANGE} w={700}>chimique : la résine réticule (jours)</T>
    </Svg>);
};

export const FAutoxydation = () => {
  const chaine = x => { const o = []; for (let k = 0; k <= 8; k++) o.push(`${x + (k % 2 ? 10 : -10)},${14 + k * 14}`); return o.join(' '); };
  return (
    <Svg h={200} aria="Autoxydation de la résine alkyde : deux chaînes d'acides gras portant des liaisons C=C se relient par des ponts oxygène –O– grâce au dioxygène de l'air ; le siccatif est le catalyseur qui accélère la réaction">
      <polyline points={chaine(80)} fill="none" stroke={ENCRE} strokeWidth="2.4" strokeLinejoin="round"/><polyline points={chaine(200)} fill="none" stroke={ENCRE} strokeWidth="2.4" strokeLinejoin="round"/>
      {[42, 84].map(y => <g key={y}><Lg x1={86} y1={y} x2={194} y2={y} c={ROUGE} w={2.2}/><circle cx="140" cy={y} r="11" fill="#fee2e2" stroke={ROUGE} strokeWidth="1.8"/><T x={140} y={y + 4.5} a="middle" c={ROUGE} w={800}>O</T></g>)}
      <Fleche x1={16} y1={28} x2={64} y2={44} c={BLEU}/><T x={10} y={20} c={BLEU} w={800}>O₂ de l’air</T>
      <rect x="226" y="52" width="66" height="24" rx="12" fill="#ede9fe" stroke="#6d28d9" strokeWidth="1.6"/><T x={259} y={69} a="middle" c="#6d28d9" w={800}>siccatif</T>
      <T x={12} y={150} w={700}>chaînes à liaisons C=C reliées par –O–</T>
      <T x={12} y={170} c={GRIS}>ponts –O– : le film durcit (réticulation)</T><T x={12} y={188} c="#6d28d9">siccatif : catalyseur, il accélère</T>
    </Svg>);
};

const Pastille = ({ x, y, t, c }) => <g><circle cx={x} cy={y} r="13" fill={c}/><T x={x} y={y + 4.5} a="middle" c="#fff" w={800}>{t}</T></g>;
export const FAntiPeau = () => (
  <Svg h={196} aria="Rôle de l'anti-peau : dans le pot fermé, l'anti-peau DEHA reste lié au siccatif et le désactive, donc pas de peau ; dans le film mince à l'air, l'anti-peau volatil s'évapore et le siccatif redevient actif">
    <rect x="8" y="22" width="134" height="92" rx="6" fill="#e0f2fe" stroke={BLEU} strokeWidth="1.6"/><T x={75} y={16} a="middle" c={BLEU} w={800}>pot fermé</T>
    <Pastille x={56} y={66} t="Si" c="#6d28d9"/><Pastille x={82} y={66} t="AP" c={VERT}/><T x={75} y={102} a="middle" c={VERT} w={700}>siccatif bridé</T>
    <rect x="158" y="22" width="134" height="92" rx="6" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.6"/><T x={225} y={16} a="middle" c="#a16207" w={800}>film mince, à l’air</T>
    <Pastille x={200} y={80} t="Si" c="#6d28d9"/><Pastille x={252} y={52} t="AP" c={VERT}/><Fleche x1={252} y1={38} x2={252} y2={24} c={VERT}/>
    <T x={225} y={102} a="middle" c={ORANGE} w={700}>siccatif libre</T>
    <T x={150} y={140} a="middle" w={700}>AP volatil : il part du film mince</T>
    <T x={150} y={160} a="middle" c={GRIS}>Si = siccatif · AP = anti-peau (DEHA)</T><T x={150} y={180} a="middle" c={ROUGE} w={700}>mais le séchage est retardé un temps</T>
  </Svg>);

export const FRapport = () => {
  const X = r => 30 + (r / 0.3) * 240;
  return (
    <Svg h={150} aria="Rapport R égal au pourcentage d'anti-peau divisé par le pourcentage de siccatif : R petit, le siccatif est libre et la peau apparaît tôt ; R grand, le siccatif est bridé, le pot est protégé mais le séchage est plus lent ; exemple 0,4 divisé par 1,6 égale 0,25">
      <defs><linearGradient id="gR" x1="0" x2="1"><stop offset="0" stopColor="#fca5a5"/><stop offset="1" stopColor="#86efac"/></linearGradient></defs>
      <rect x="30" y="34" width="240" height="18" rx="4" fill="url(#gR)" stroke={GRIS}/>
      <T x={30} y={26} c={ROUGE} w={700}>R petit</T><T x={270} y={26} a="end" c={VERT} w={700}>R grand</T>
      <T x={30} y={72} c={ROUGE}>peau tôt</T><T x={270} y={72} a="end" c={VERT}>pot protégé</T>
      <Lg x1={X(0.25)} y1={30} x2={X(0.25)} y2={58} c={ENCRE} w={3}/><T x={X(0.25)} y={96} a="middle" w={800}>R = 0,25</T>
      <T x={150} y={124} a="middle" c={GRIS}>exemple : anti-peau 0,4 %, siccatif 1,6 %</T><T x={150} y={144} a="middle" c={GRIS}>R = 0,4 ÷ 1,6 = 0,25</T>
    </Svg>);
};

export const FLeviers = () => (
  <Svg h={190} aria="Deux leviers en sens contraire : plus de siccatif fait sécher plus vite mais la peau apparaît plus tôt ; plus d'anti-peau protège le pot plus longtemps mais ralentit le séchage ; on cherche la zone qui respecte tout le cahier des charges">
    {[['+ siccatif', '#6d28d9', 'sèche plus vite', 'peau plus tôt'], ['+ anti-peau', VERT, 'peau plus tard', 'séchage plus lent']].map(([t, c, bon, mal], k) => (
      <g key={t}><rect x="8" y={14 + k * 62} width="100" height="40" rx="8" fill={c}/><T x={58} y={39 + k * 62} a="middle" c="#fff" w={800}>{t}</T>
        <Fleche x1={112} y1={34 + k * 62} x2={140} y2={34 + k * 62} c={GRIS}/>
        <T x={148} y={28 + k * 62} c={VERT} w={700}>✓ {bon}</T><T x={148} y={48 + k * 62} c={ROUGE} w={700}>✗ {mal}</T></g>))}
    <T x={150} y={152} a="middle" w={700}>les deux leviers agissent en sens contraire</T><T x={150} y={172} a="middle" c={GRIS}>zone verte = tout le cahier des charges</T>
  </Svg>);
