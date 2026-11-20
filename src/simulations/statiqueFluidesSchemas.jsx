import { Fleche } from "./statiqueFluidesScenes";
import { COL } from "./statiqueFluidesOutils";
import { TV } from "./Travail";
// ====================================================
//  Schémas des cartes « À retenir » de la simulation 163 (statique des fluides).
//  viewBox de 310 de large (affiché vers 230 px sur téléphone, 310 px sur ordinateur) : textes ≥ 14,5, maxWidth 320.
// ====================================================
const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '4px auto 8px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' };
const EAU = ['#cfeafc', '#7cc0ee'];
const Eau = ({ id }) => <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={EAU[0]} /><stop offset="1" stopColor={EAU[1]} /></linearGradient></defs>;
const T = ({ x, y, children, s = 14.5, w = 700, c = COL.encre, a = 'start', i = false }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a} fontStyle={i ? 'italic' : 'normal'}>{children}</text>;
const Point = ({ x, y, nom, dx = 0, dy = -12 }) => <g><circle cx={x} cy={y} r="5.5" fill="#fff" stroke={COL.orange} strokeWidth="2.6" />
  <text x={x + dx} y={y + dy} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange} stroke="#fff" strokeWidth="3" paintOrder="stroke">{nom}</text></g>;
const Tiret = ({ x1, y1, x2, y2, c = COL.gris }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1.5" strokeDasharray="4 5" strokeLinecap="round" />;

// 1. Relation fournie et axe z : A plus haut que B, pression plus grande en B
export const SvgRelation = () => (
  <svg viewBox="0 0 310 206" style={stl} role="img" aria-label="Un récipient d’eau avec un axe z orienté vers le haut. Le point A, plus haut, est soumis à une pression plus petite que le point B, plus bas : les flèches de pression sont plus longues en B.">
    <Eau id="sf-c1" />
    <Fleche x1={24} y1={176} x2={24} y2={24} c={COL.encre} w={2} tip={9} demi={4.2} /><T x={24} y={16} a="middle" s={16} i>z</T>
    <rect x="76" y="46" width="100" height="130" fill="url(#sf-c1)" /><line x1="76" y1="46" x2="176" y2="46" stroke="#fff" strokeWidth="2" strokeOpacity="0.85" />
    <path d="M76,26 V176 H176 V26" fill="none" stroke={COL.verre} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <Tiret x1={24} y1={80} x2={96} y2={80} /><circle cx="24" cy="80" r="3.8" fill={COL.encre} /><Tiret x1={24} y1={138} x2={96} y2={138} /><circle cx="24" cy="138" r="3.8" fill={COL.encre} />
    <Fleche x1={100} y1={80} x2={122} y2={80} c={COL.bleu} w={2.2} tip={9} demi={4} /><Fleche x1={100} y1={138} x2={150} y2={138} c={COL.bleu} w={2.2} tip={9} demi={4} />
    <Point x={96} y={80} nom="A" dx={-1} dy={-11} /><Point x={96} y={138} nom="B" dx={-1} dy={-11} />
    <T x={186} y={76}>A : plus haut,</T><T x={186} y={94}>P plus petite</T>
    <T x={186} y={134}>B : plus bas,</T><T x={186} y={152}>P plus grande</T>
    <T x={155} y={198} a="middle" s={14.5} w={600} c={COL.gris}>flèches bleues : pression (simplifié)</T>
  </svg>);

// 2. Pression absolue = Patm + ρ g h ; la pression relative n’est que la partie due au liquide
export const SvgAbsolue = () => (
  <svg viewBox="0 0 310 214" style={stl} role="img" aria-label="Deux colonnes. La colonne de gauche, pression absolue, empile la pression atmosphérique (grise) et la pression due au liquide (bleue). La colonne de droite, pression relative, ne garde que la partie bleue.">
    <rect x="30" y="24" width="86" height="96" rx="3" fill="#e2e8f0" stroke={COL.gris} strokeWidth="1.8" />
    <rect x="30" y="120" width="86" height="38" rx="3" fill="#7cc0ee" stroke={COL.bleu} strokeWidth="1.8" />
    <T x={73} y={78} a="middle" s={16}>Patm</T><T x={73} y={144} a="middle" s={15.5}>ρ g h</T>
    <rect x="194" y="120" width="86" height="38" rx="3" fill="#7cc0ee" stroke={COL.bleu} strokeWidth="1.8" /><T x={237} y={144} a="middle" s={15.5}>ρ g h</T>
    <Tiret x1={120} y1={120} x2={190} y2={120} /><Tiret x1={120} y1={158} x2={190} y2={158} />
    <T x={73} y={182} a="middle" s={15.5} c={COL.bleu}>absolue</T><T x={237} y={182} a="middle" s={15.5} c={COL.bleu}>relative</T>
    <T x={155} y={206} a="middle" s={14.5} w={600} c={COL.gris}>le manomètre lit la colonne de gauche</T>
  </svg>);

// 3. Ordre de grandeur : environ + 1 bar tous les 10 m d’eau
export const SvgOrdre = () => {
  const lignes = [['0 m', 1], ['10 m', 2], ['20 m', 3], ['30 m', 4]], u = 46, x0 = 56;
  return (
    <svg viewBox="0 0 310 214" style={stl} role="img" aria-label="Pression absolue en fonction de la profondeur dans l’eau : environ 1 bar en surface, puis 1 bar de plus tous les 10 mètres. Chaque barre empile 1 bar d’atmosphère et le nombre de bars dus à l’eau.">
      {lignes.map(([p, n], i) => { const y = 10 + i * 40; return <g key={p}>
        <T x={46} y={y + 25} a="end" s={15}>{p}</T>
        <rect x={x0} y={y + 6} width={u} height="26" fill="#e2e8f0" stroke={COL.gris} strokeWidth="1.6" />
        {n > 1 && <rect x={x0 + u} y={y + 6} width={u * (n - 1)} height="26" fill="#7cc0ee" stroke={COL.bleu} strokeWidth="1.6" />}
        <T x={x0 + u * n + 8} y={y + 25} s={15}>{n} bar{n > 1 ? 's' : ''}</T></g>; })}
      <rect x={x0} y="176" width="14" height="14" fill="#e2e8f0" stroke={COL.gris} strokeWidth="1.4" /><T x={x0 + 20} y={188} s={14.5} w={600}>atmosphère</T>
      <rect x="170" y="176" width="14" height="14" fill="#7cc0ee" stroke={COL.bleu} strokeWidth="1.4" /><T x={190} y={188} s={14.5} w={600}>eau</T>
      <T x={155} y={208} a="middle" s={14.5} w={600} c={COL.gris}>pression absolue (ordre de grandeur)</T>
    </svg>); };

// 4. Même niveau, même pression : trois branches de formes différentes (abscisses réduites à 85 %)
export const SvgNiveau = () => {
  const X = x => Math.round(x * 0.85 + 2);
  const eau = `M${X(20)},40 H${X(112)} V150 H${X(150)} V40 H${X(176)} V150 H${X(236)} V120 L${X(212)},40 H${X(340)} L${X(304)},120 V170 H${X(20)} Z`;
  const gap1 = `M${X(112)},24 H${X(150)} V150 H${X(112)} Z`, gap2 = `M${X(176)},24 V150 H${X(236)} V120 L${X(212)},40 V24 Z`;
  return (
    <svg viewBox="0 0 310 200" style={stl} role="img" aria-label="Trois branches de formes différentes reliées par le bas et remplies du même liquide. Les points A, B et C, à la même profondeur, sont sur une même ligne horizontale : la pression y est la même.">
      <Eau id="sf-c4" />
      <path d={gap1} fill="#f1f5f9" /><path d={gap2} fill="#f1f5f9" />
      <path d={eau} fill="url(#sf-c4)" />
      <g fill="none" stroke={COL.verre} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${X(20)},24 V170 H${X(304)} V120 L${X(340)},40 V24`} /><path d={`M${X(112)},24 V150 H${X(150)} V24`} /><path d={`M${X(176)},24 V150 H${X(236)} V120 L${X(212)},40 V24`} /></g>
      <Tiret x1={6} y1={96} x2={304} y2={96} c={COL.orange} />
      <Point x={X(66)} y={96} nom="A" /><Point x={X(163)} y={96} nom="B" dy={-11} /><Point x={X(270)} y={96} nom="C" />
      <T x={155} y={192} a="middle" s={14.5}>même profondeur ⇒ même pression</T>
    </svg>); };

// 5. Force pressante sur une paroi : perpendiculaire à la paroi
export const SvgParoi = () => (
  <svg viewBox="0 0 310 200" style={stl} role="img" aria-label="Coupe d’un réservoir d’eau : les flèches de pression sont perpendiculaires à la paroi de droite et la force de l’eau sur le bouchon de surface S est une flèche perpendiculaire à la paroi, dirigée vers l’extérieur.">
    <Eau id="sf-c5" />
    <rect x="24" y="34" width="130" height="132" fill="url(#sf-c5)" /><line x1="24" y1="34" x2="154" y2="34" stroke="#fff" strokeWidth="2" strokeOpacity="0.85" />
    {[54, 76, 98, 120, 142].map(y => <Fleche key={y} x1={154 - (y - 34) * 0.5} y1={y} x2={151} y2={y} c={COL.bleu} w={1.9} tip={8} demi={3.6} op={0.85} />)}
    <path d="M24,16 V166 H154 V16" fill="none" stroke={COL.verre} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="149" y="98" width="10" height="26" rx="2" fill={COL.orange} stroke="#7c2d12" strokeWidth="1.4" />
    <Fleche x1={166} y1={111} x2={252} y2={111} c={COL.orange} w={3} tip={13} demi={6} /><TV x={200} y={89} c={COL.orange} s={19}>F</TV>
    <T x={184} y={142}>bouchon, S</T>
    <T x={155} y={192} a="middle">perpendiculaire à la paroi</T>
  </svg>);

// 6. Tester la loi : P(h) est une droite, d’ordonnée à l’origine P à la surface et de pente ρ g
export const SvgLoi = () => (
  <svg viewBox="0 0 310 220" style={stl} role="img" aria-label="Graphique de la pression en fonction de la profondeur : une droite croissante qui ne passe pas par l’origine. Elle coupe l’axe vertical à la pression de la surface et sa pente vaut rho g.">
    <Fleche x1={44} y1={170} x2={44} y2={16} c={COL.encre} w={2} tip={9} demi={4.2} /><Fleche x1={44} y1={170} x2={296} y2={170} c={COL.encre} w={2} tip={9} demi={4.2} />
    <T x={54} y={20} s={15.5} i>P</T><T x={294} y={192} a="end" s={15.5} i>h</T>
    <line x1="44" y1="118" x2="270" y2="40" stroke={COL.vert} strokeWidth="2.6" strokeLinecap="round" />
    {[[84, 104], [130, 88], [176, 72], [222, 57]].map(([x, y]) => <circle key={x} cx={x} cy={y + (x % 3 - 1)} r="4.6" fill={COL.bleu} stroke="#fff" strokeWidth="1.5" />)}
    <circle cx="44" cy="118" r="5.5" fill={COL.orange} stroke="#fff" strokeWidth="1.5" />
    <T x={58} y={144} c={COL.orange}>P à la surface</T>
    <T x={172} y={118} c={COL.vert}>pente = ρ g</T>
    <T x={155} y={212} a="middle" s={14.5} w={600} c={COL.gris}>schéma simplifié, sans échelle</T>
  </svg>);
