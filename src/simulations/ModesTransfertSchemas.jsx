// Schémas de la simulation 245 (travail ou transfert thermique) : scènes de situations (sans nommer le mode de transfert) et cartes « À retenir ».
// Règles : police ≥ 15 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucun mode de transfert nommé dans les scènes.
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', violet: '#6d28d9', ciel: '#dbeafe', chaud: '#fecaca', jaune: '#fde68a' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 196, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Txt = ({ x, y, t, c = COL.encre, size = 16, w = 700, anchor = 'middle' }) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={w} fill={c} {...halo}>{t}</text>;
const Fleche = ({ x1, y1, x2, y2, c = COL.bleu, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9 + w * 0.8, d = 0.5;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - (L - 2) * Math.cos(a)} y2={y2 - (L - 2) * Math.sin(a)} stroke={c} strokeWidth={w}/><polygon points={p} fill={c}/></g>;
};

const SCENES = {
  chariot: ['Schéma : une main pousse un chariot posé sur le sol.', <g key="c">
    <line x1="20" y1="140" x2="380" y2="140" stroke={COL.gris} strokeWidth="4"/>
    <rect x="190" y="90" width="90" height="36" rx="6" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
    <circle cx="210" cy="132" r="9" fill="white" stroke={COL.encre} strokeWidth="3"/><circle cx="262" cy="132" r="9" fill="white" stroke={COL.encre} strokeWidth="3"/>
    <rect x="70" y="92" width="64" height="32" rx="16" fill={COL.jaune} stroke={COL.orange} strokeWidth="3"/>
    <Fleche x1={138} y1={108} x2={186} y2={108} c={COL.orange} w={4}/>
    <Txt x={102} y={86} t="main" c={COL.encre} size={15}/><Txt x={235} y={84} t="chariot" c={COL.encre} size={15}/>
    <Fleche x1={290} y1={108} x2={350} y2={108} c={COL.bleu} w={3}/><Txt x={322} y={96} t="vitesse" c={COL.bleu} size={15} w={600}/></g>],
  glisse: ['Schéma : un chariot glisse vers la droite sur le sol et ralentit sous l’effet d’une force de sens opposé à son mouvement.', <g key="g">
    <line x1="20" y1="140" x2="380" y2="140" stroke={COL.gris} strokeWidth="4"/>
    <rect x="150" y="90" width="90" height="36" rx="6" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
    <circle cx="170" cy="132" r="9" fill="white" stroke={COL.encre} strokeWidth="3"/><circle cx="222" cy="132" r="9" fill="white" stroke={COL.encre} strokeWidth="3"/>
    <Txt x={195} y={80} t="chariot" c={COL.encre} size={15}/>
    <Fleche x1={250} y1={108} x2={330} y2={108} c={COL.bleu} w={3}/><Txt x={292} y={96} t="vitesse" c={COL.bleu} size={15} w={600}/>
    <Fleche x1={146} y1={108} x2={86} y2={108} c={COL.rouge} w={4}/><Txt x={102} y={96} t="force" c={COL.rouge} size={15} w={600}/></g>],
  ressort: ['Schéma : un ressort qui se détend lance une bille vers la droite.', <g key="r">
    <line x1="20" y1="140" x2="380" y2="140" stroke={COL.gris} strokeWidth="4"/>
    <rect x="40" y="86" width="14" height="54" fill={COL.gris}/>
    <path d="M 54 113 l 10 -14 l 14 28 l 14 -28 l 14 28 l 14 -28 l 14 28 l 10 -14" fill="none" stroke={COL.orange} strokeWidth="4" strokeLinejoin="round"/>
    <circle cx="156" cy="113" r="17" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
    <Txt x={156} y={84} t="bille" c={COL.encre} size={15}/><Txt x={96} y={170} t="ressort" c={COL.encre} size={15}/>
    <Fleche x1={185} y1={113} x2={255} y2={113} c={COL.bleu} w={3}/><Txt x={222} y={100} t="vitesse" c={COL.bleu} size={15} w={600}/></g>],
  frein: ['Schéma : un frein est serré contre une roue qui tourne.', <g key="f">
    <circle cx="170" cy="96" r="52" fill="white" stroke={COL.encre} strokeWidth="4"/><circle cx="170" cy="96" r="8" fill={COL.encre}/>
    <path d="M 214 62 A 52 52 0 0 1 222 96" fill="none" stroke={COL.bleu} strokeWidth="4"/><Fleche x1={222} y1={92} x2={221} y2={100} c={COL.bleu} w={3}/>
    <rect x="228" y="72" width="26" height="48" rx="6" fill={COL.jaune} stroke={COL.orange} strokeWidth="3"/>
    <Fleche x1={300} y1={96} x2={258} y2={96} c={COL.orange} w={4}/>
    <Txt x={170} y={170} t="roue" c={COL.encre} size={15}/><Txt x={330} y={92} t="frein" c={COL.encre} size={15}/></g>],
  pile: ['Schéma : une pile reliée par des fils à une lampe.', <g key="p">
    <rect x="50" y="68" width="86" height="56" rx="8" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
    <circle cx="300" cy="96" r="30" fill={COL.jaune} stroke={COL.orange} strokeWidth="3"/><path d="M 286 108 L 294 84 L 300 100 L 306 84 L 314 108" fill="none" stroke={COL.orange} strokeWidth="3"/>
    <path d="M 136 82 H 200 V 36 H 300 V 66" fill="none" stroke={COL.gris} strokeWidth="3"/><path d="M 136 110 H 200 V 156 H 300 V 126" fill="none" stroke={COL.gris} strokeWidth="3"/>
    <Fleche x1={228} y1={36} x2={262} y2={36} c={COL.vert} w={3}/>
    <Txt x={93} y={102} t="pile" c={COL.encre} size={16}/><Txt x={300} y={186} t="lampe" c={COL.encre} size={15}/><Txt x={160} y={30} t="fils" c={COL.gris} size={15} w={600}/></g>],
  barre: ['Schéma : une barre de métal dont une extrémité plonge dans un liquide chaud.', <g key="b">
    <rect x="30" y="86" width="260" height="30" rx="4" fill={COL.chaud} stroke={COL.gris} strokeWidth="3"/>
    <rect x="30" y="86" width="90" height="30" rx="4" fill="#fca5a5"/><rect x="200" y="86" width="90" height="30" rx="4" fill="#fef2f2"/>
    <rect x="20" y="70" width="110" height="80" rx="8" fill="none" stroke={COL.rouge} strokeWidth="3" strokeDasharray="6 4"/>
    <Txt x={75} y={172} t="liquide chaud" c={COL.rouge} size={15}/><Txt x={245} y={70} t="barre" c={COL.encre} size={15}/>
    <Txt x={330} y={106} t="froide" c={COL.bleu} size={15} w={600}/></g>],
  casserole: ['Schéma : une cuve d’eau chauffée par en dessous.', <g key="k">
    <path d="M 100 40 V 120 H 300 V 40" fill="none" stroke={COL.encre} strokeWidth="4"/><rect x="102" y="60" width="196" height="58" fill="#bfdbfe"/>
    <path d="M 150 110 V 76 H 200" fill="none" stroke={COL.rouge} strokeWidth="3"/><Fleche x1={196} y1={76} x2={206} y2={76} c={COL.rouge} w={3}/>
    <path d="M 250 76 V 110" fill="none" stroke={COL.bleu} strokeWidth="3"/><Fleche x1={250} y1={104} x2={250} y2={112} c={COL.bleu} w={3}/>
    {[130, 200, 270].map(x => <Fleche key={x} x1={x} y1={164} x2={x} y2={130} c={COL.orange} w={3}/>)}
    <Txt x={200} y={190} t="flamme" c={COL.orange} size={15}/><Txt x={200} y={34} t="eau" c={COL.encre} size={15}/></g>],
  soleil: ['Schéma : une source chaude à gauche et un objet à droite, séparés par le vide.', <g key="s">
    <circle cx="70" cy="96" r="32" fill={COL.jaune} stroke={COL.orange} strokeWidth="4"/>
    {[-30, 0, 30].map(d => <Fleche key={d} x1={118} y1={96 + d * 0.6} x2={290} y2={96 + d * 0.6} c={COL.orange} w={2.5}/>)}
    <rect x="300" y="76" width="50" height="40" rx="6" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
    <Txt x={70} y={150} t="source" c={COL.encre} size={15}/><Txt x={325} y={140} t="objet" c={COL.encre} size={15}/><Txt x={205} y={62} t="vide" c={COL.gris} size={15} w={600}/></g>],
  melange: ['Schéma : un objet posé sur une plaque plus chaude.', <g key="m">
    <rect x="90" y="124" width="220" height="30" rx="6" fill={COL.chaud} stroke={COL.rouge} strokeWidth="3"/>
    <rect x="130" y="82" width="140" height="38" rx="6" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
    <Txt x={200} y={108} t="objet" c={COL.encre} size={15}/><Txt x={200} y={175} t="plaque plus chaude" c={COL.rouge} size={15}/></g>],
};
export function SceneMode({ k }) {
  const [label, corps] = SCENES[k] || SCENES.chariot;
  return <Fond h={196} label={label}>{corps}</Fond>;
}

// ═════════ Carte 1 : les deux familles de transferts ═════════
export function SvgTravail() {
  return (
    <Fond h={204} label="Schéma : le travail est un transfert d'énergie par une force qui fait varier la vitesse (travail mécanique) ou par un courant électrique entre un générateur et un récepteur (travail électrique).">
      <rect x="40" y="14" width="320" height="42" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={42} t="transfert par travail W" c={COL.violet} size={18} w={800}/>
      <rect x="14" y="74" width="178" height="82" rx="10" fill="white" stroke={COL.bleu} strokeWidth="2.5"/>
      <Txt x={103} y={98} t="mécanique" c={COL.bleu} size={17} w={800}/><Txt x={103} y={122} t="une force fait varier" c={COL.gris} size={14} w={500}/><Txt x={103} y={142} t="la valeur de la vitesse" c={COL.gris} size={14} w={500}/>
      <rect x="208" y="74" width="178" height="82" rx="10" fill="white" stroke={COL.vert} strokeWidth="2.5"/>
      <Txt x={297} y={98} t="électrique" c={COL.vert} size={17} w={800}/><Txt x={297} y={122} t="un courant relie" c={COL.gris} size={14} w={500}/><Txt x={297} y={142} t="générateur et récepteur" c={COL.gris} size={14} w={500}/>
      <Txt x={200} y={186} t="exemple : main qui accélère un chariot" c={COL.encre} size={15}/>
    </Fond>);
}
// ═════════ Carte 2 : les trois modes de transfert thermique ═════════
export function SvgThermique() {
  const b = (x, t, l1, l2, l3, c) => <g><rect x={x} y="68" width="122" height="104" rx="10" fill="white" stroke={c} strokeWidth="2.5"/><Txt x={x + 61} y={92} t={t} c={c} size={15} w={800}/><Txt x={x + 61} y={114} t={l1} c={COL.gris} size={13.5} w={500}/><Txt x={x + 61} y={132} t={l2} c={COL.gris} size={13.5} w={500}/><Txt x={x + 61} y={150} t={l3} c={COL.gris} size={13.5} w={500}/></g>;
  return (
    <Fond h={216} label="Schéma : trois modes de transfert thermique : la conduction de proche en proche, la convection par mouvement de matière dans un liquide ou un gaz, le rayonnement par ondes électromagnétiques.">
      <rect x="60" y="14" width="280" height="40" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/>
      <Txt x={200} y={41} t="transfert thermique Q" c={COL.orange} size={18} w={800}/>
      {b(8, 'conduction', 'de proche', 'en proche', 'tout état', COL.rouge)}{b(139, 'convection', 'matière en', 'mouvement', 'liquide, gaz', COL.bleu)}{b(270, 'rayonnement', 'ondes,', 'sans besoin', 'de matière', COL.orange)}
      <Txt x={200} y={198} t="chaud → froid, dans tous les cas" c={COL.encre} size={15}/>
    </Fond>);
}
// ═════════ Carte 3 : bilan, comment classer ═════════
export function SvgArbre() {
  const q = (y, t, r, c) => <g><rect x="14" y={y} width="372" height="36" rx="9" fill="white" stroke={c} strokeWidth="2.5"/><Txt x={24} y={y + 24} t={t} c={COL.gris} size={14.5} w={600} anchor="start"/><Txt x={376} y={y + 24} t={r} c={c} size={14.5} w={800} anchor="end"/></g>;
  return (
    <Fond h={232} label="Schéma : pour classer un transfert d'énergie, chercher une force qui fait varier la vitesse, un courant électrique, un mouvement de matière, des ondes, sinon la propagation de proche en proche.">
      <Txt x={200} y={24} t="comment classer un transfert ?" c={COL.violet} size={17} w={800}/>
      {q(38, 'force qui fait varier la vitesse', 'travail mécanique', COL.bleu)}
      {q(80, 'courant électrique', 'travail électrique', COL.vert)}
      {q(122, 'matière qui se déplace', 'convection', COL.bleu)}
      {q(164, 'ondes, même dans le vide', 'rayonnement', COL.orange)}
      <Txt x={200} y={224} t="sinon, de proche en proche : conduction" c={COL.rouge} size={14.5} w={700}/>
    </Fond>);
}
// ═════════ Carte 4 : signe du travail ═════════
export function SvgSigneW() {
  return (
    <Fond h={196} label="Schéma : le travail est reçu et compté positivement quand le système accélère, cédé et compté négativement quand il ralentit ; exemple : un chariot dont l'énergie cinétique passe de 10 à 4 joules reçoit un travail de moins 6 joules.">
      <rect x="14" y="14" width="178" height="62" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/>
      <Txt x={103} y={40} t="le système accélère" c={COL.gris} size={14.5} w={600}/><Txt x={103} y={64} t="W > 0 (reçu)" c={COL.vert} size={17} w={800}/>
      <rect x="208" y="14" width="178" height="62" rx="10" fill="#fef2f2" stroke={COL.rouge} strokeWidth="2.5"/>
      <Txt x={297} y={40} t="le système ralentit" c={COL.gris} size={14.5} w={600}/><Txt x={297} y={64} t="W < 0 (cédé)" c={COL.rouge} size={17} w={800}/>
      <rect x="30" y="94" width="340" height="40" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={121} t="ΔEc = somme des travaux" c={COL.violet} size={18} w={800}/>
      <Txt x={200} y={162} t="ex. : Ec de 10 J à 4 J → W = −6 J" c={COL.encre} size={15}/>
      <Txt x={200} y={184} t="puissance : P = |W| ÷ Δt" c={COL.gris} size={14.5} w={600}/>
    </Fond>);
}
