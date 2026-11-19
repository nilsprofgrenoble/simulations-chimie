// Schémas des cartes « À retenir » de la simulation 45 (piloter le moteur pas à pas avec le code). viewBox de 300, texte de 12,5.
import { TV } from "./Travail";
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;

export const SchemaSequence = () => {
  const lignes = [[0, 1], [1, 2], [2, 3], [3, 4]];
  return (
    <Svg h={158} aria="Chronogramme du pas complet : à chaque pas une seule bobine est alimentée, dans l'ordre 1, 2, 3, 4, chaque pas dure le délai D">
      {lignes.map(([i, n]) => { const y = 14 + i * 28, x0 = 76 + i * 54;
        return <g key={n}><T x={4} y={y + 14} c={GRIS} w={700}>bobine {n}</T>
          <line x1="76" y1={y + 20} x2="292" y2={y + 20} stroke="#94a3b8" strokeWidth="1.5"/>
          <rect x={x0} y={y + 4} width="54" height="16" fill="#fed7aa" stroke={ORANGE} strokeWidth="2"/></g>; })}
      {[1, 2, 3, 4].map(k => <T key={k} x={76 + (k - 1) * 54 + 27} y={134} a="middle" c={BLEU} w={700}>pas {k}</T>)}
      <T x={150} y={152} a="middle" c={GRIS}>chaque pas dure D (delay)</T>
    </Svg>);
};

export const SchemaTour = () => (
  <Svg h={150} aria="Pas complet : un pas fait tourner le rotor de 90 degrés, donc quatre pas font un tour complet de 360 degrés">
    <circle cx="80" cy="76" r="52" fill="#fff" stroke={GRIS} strokeWidth="2.5"/>
    <line x1="80" y1="24" x2="80" y2="128" stroke="#cbd5e1" strokeWidth="1.5"/><line x1="28" y1="76" x2="132" y2="76" stroke="#cbd5e1" strokeWidth="1.5"/>
    <Arr x1={80} y1={76} x2={80} y2={36} c={ROUGE} w={3}/>
    <path d="M 80 52 A 24 24 0 0 1 104 76" fill="none" stroke={BLEU} strokeWidth="3"/><T x={106} y={58} c={BLEU} w={700}>90°</T>
    <T x={150} y={50} c={BLEU} w={700}>1 pas = 90°</T><T x={150} y={78} c={VERT} w={700}>4 pas = 1 tour</T>
    <T x={150} y={106} c={GRIS}>16 pas ÷ 4 =</T><T x={150} y={126} c={GRIS}>4 tours</T>
  </Svg>);

export const SchemaPasPerdus = () => (
  <Svg h={176} aria="Le champ commandé avance en escalier ; le rotor, trop lent à cause d'un délai trop court, prend du retard et décroche : des pas sont perdus">
    <line x1="36" y1="140" x2="292" y2="140" stroke={GRIS} strokeWidth="1.5"/><line x1="36" y1="140" x2="36" y2="20" stroke={GRIS} strokeWidth="1.5"/>
    <T x={292} y={158} a="end" c={GRIS}>temps →</T><T x={44} y={18} c={GRIS}>angle ↑</T>
    <polyline points="36,140 76,140 76,112 116,112 116,84 156,84 156,56 196,56 196,28 236,28 236,28" fill="none" stroke={ORANGE} strokeWidth="2.5" strokeDasharray="6 4"/>
    <T x={180} y={20} c={ORANGE} w={700}>commandé</T>
    <path d="M36 140 L76 140 Q92 112 116 116 L140 118 Q150 112 170 112 L236 112 L292 112" fill="none" stroke={BLEU} strokeWidth="3"/>
    <T x={170} y={132} c={BLEU} w={700}>rotor décroché</T>
    <T x={8} y={172} c={ROUGE} w={700}>D trop court : le rotor perd des pas</T>
  </Svg>);

export const SchemaCharge = () => (
  <Svg h={158} aria="Une bobine crée un champ B ; deux bobines voisines créent deux champs perpendiculaires dont la somme vaut racine de 2 fois B, donc un couple plus grand pour entraîner la charge">
    <Arr x1={40} y1={124} x2={40} y2={50} c={BLEU}/><TV x={8} y={92} c={BLEU} s={14}>B</TV>
    <T x={22} y={146} c={BLEU} w={700}>1 bobine</T>
    <Arr x1={150} y1={124} x2={150} y2={64} c={BLEU}/><Arr x1={150} y1={124} x2={210} y2={124} c={ORANGE}/>
    <Arr x1={150} y1={124} x2={210} y2={64} c={ENCRE} w={3.4}/>
    <line x1="150" y1="64" x2="210" y2="64" stroke="#94a3b8" strokeDasharray="4 3"/><line x1="210" y1="64" x2="210" y2="124" stroke="#94a3b8" strokeDasharray="4 3"/>
    <T x={130} y={146} c={VERT} w={700}>2 bobines voisines</T>
    <TV x={222} y={52} c={VERT} s={14}>B</TV><T x={238} y={52} c={VERT} w={700}>× √2</T>
    <T x={222} y={80} c={GRIS}>plus de</T><T x={222} y={98} c={GRIS}>couple</T>
  </Svg>);

export const SchemaOrdre = () => {
  const C = ({ cx, cy, ordre }) => { const P = { 1: [cx, cy - 36], 2: [cx + 36, cy], 3: [cx, cy + 36], 4: [cx - 36, cy] };
    return <g><circle cx={cx} cy={cy} r="36" fill="none" stroke="#cbd5e1" strokeWidth="1.5"/>
      {Object.entries(P).map(([n, [x, y]]) => <g key={n}><circle cx={x} cy={y} r="11" fill="#fff" stroke={GRIS} strokeWidth="2"/><T x={x} y={y + 4.5} a="middle" c={GRIS} w={700}>{n}</T></g>)}
      {ordre.map(([a, b], i) => <Arr key={i} x1={P[a][0] + (P[b][0] - P[a][0]) * 0.3} y1={P[a][1] + (P[b][1] - P[a][1]) * 0.3} x2={P[a][0] + (P[b][0] - P[a][0]) * 0.72} y2={P[a][1] + (P[b][1] - P[a][1]) * 0.72} c={ordre.c || VERT} w={2.6}/>)}</g>; };
  const ok = [[1, 2], [2, 3], [3, 4]]; const ko = [[1, 3]]; ko.c = ROUGE;
  return (
    <Svg h={160} aria="À gauche l'ordre 1, 2, 3, 4 fait avancer le champ de 90 degrés à chaque pas dans le même sens ; à droite l'ordre 1, 3 fait faire un demi-tour au champ et n'impose plus de sens de rotation">
      <C cx={76} cy={74} ordre={ok}/><C cx={224} cy={74} ordre={ko}/>
      <T x={76} y={134} a="middle" c={VERT} w={700}>1 → 2 → 3 → 4</T><T x={76} y={152} a="middle" c={VERT}>sens imposé</T>
      <T x={224} y={134} a="middle" c={ROUGE} w={700}>1 → 3 → 2 → 4</T><T x={224} y={152} a="middle" c={ROUGE}>demi-tour : au hasard</T>
    </Svg>);
};

export const SchemaBoucle = () => (
  <Svg h={150} aria="Boucle ouverte : le programme envoie des ordres à la commande puis au moteur, sans capteur de position qui reviendrait au programme, donc il ne détecte pas les pas perdus">
    {[[6, 'programme', BLEU], [108, 'commande', ORANGE], [210, 'moteur', VERT]].map(([x, n, c]) => <g key={n}><rect x={x} y="22" width="84" height="40" rx="8" fill="#fff" stroke={c} strokeWidth="2.5"/><T x={x + 42} y={47} a="middle" c={c} w={700}>{n}</T></g>)}
    <Arr x1={90} y1={42} x2={108} y2={42}/><Arr x1={192} y1={42} x2={210} y2={42}/>
    <path d="M 252 66 L 252 100 L 48 100 L 48 66" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4"/>
    <T x={150} y={94} a="middle" c={ROUGE} w={800}>✗</T>
    <T x={150} y={122} a="middle" c={ROUGE} w={700}>aucun capteur de position</T><T x={150} y={142} a="middle" c={GRIS}>un pas perdu passe inaperçu</T>
  </Svg>);
