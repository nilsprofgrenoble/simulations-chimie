// Cartes « À retenir » de la simulation 3 (titrages électrochimiques : courbes i = f(E), potentiométrie, ampérométrie).
// Chaque carte est posée UNE ÉTAPE après la question qu'elle conclut.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', VIOLET = '#7e22ce', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.4 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Axes = ({ y0, y1 = 24, x0 = 24, x1 = 292 }) => <g><line x1={x0} y1={y0} x2={x1} y2={y0} stroke={GRIS} strokeWidth="1.5"/><line x1={x0} y1={y0} x2={x0} y2={y1} stroke={GRIS} strokeWidth="1.5"/></g>;

// 1. Lire une courbe i = f(E)
export function FicheCourbeIE() {
  return (
    <div>
      <Svg h={200} aria="Courbe courant-potentiel : au-dessus de l'axe i = 0 on oxyde, au-dessous on réduit ; entre les deux murs du solvant, une vague se termine par un palier de diffusion">
        <Axes y0={100} y1={14}/>
        <path d="M36,176 C40,120 52,100 80,100 L112,100 C132,100 138,66 160,66 L214,66 C232,66 240,30 252,16" fill="none" stroke={BLEU} strokeWidth="3"/>
        <T x={30} y={20} c={GRIS}>i ↑</T><T x={292} y={92} a="end" c={GRIS}>E →</T>
        <T x={60} y={40} c={VERT} w={700}>i &gt; 0 : oxydation</T><T x={60} y={148} c={ROUGE} w={700}>i &lt; 0 : réduction</T>
        <T x={58} y={180} c={GRIS}>mur du solvant</T><T x={292} y={120} a="end" c={GRIS}>mur du solvant</T>
        <T x={187} y={56} a="middle" c={ORANGE} w={700}>palier</T><T x={124} y={120} a="middle" c={ORANGE} w={700}>vague</T>
      </Svg>
      <ul style={liste}>
        <li><em>Au-dessus de l’axe on oxyde, au-dessous on réduit.</em> Convention : i &gt; 0 pour une oxydation (courant anodique).</li>
        <li>Entre les deux « murs » du solvant (l’eau) s’étend le <strong>domaine d’inertie électrochimique</strong> : on y voit les espèces dissoutes.</li>
        <li>Chaque couple donne une <strong>vague</strong> terminée par un <strong>palier de diffusion</strong>, proportionnel à la concentration.</li>
        <li><strong>Hypothèse</strong> : modèle qualitatif, courants en unités arbitraires, E repéré par rapport à l’ESH.</li>
      </ul>
    </div>);
}

// 2. Potentiel à courant nul : loi de Nernst
export function FicheNernst() {
  const L = [[44, '[Ox] = 10 [Red]', 'E = E°′ + 0,06 V', VERT], [100, '[Ox] = [Red]', 'E = E°′', BLEU], [156, '[Red] = 10 [Ox]', 'E = E°′ − 0,06 V', ROUGE]];
  return (
    <div>
      <Svg h={190} aria="Loi de Nernst pour n = 1 à 25 degrés : multiplier le rapport oxydant sur réducteur par 10 fait monter le potentiel de 0,06 volt">
        <T x={8} y={16} w={700}>Plus [Ox] domine, plus E monte</T>
        <Arr x1={26} y1={176} x2={26} y2={28} c={GRIS}/><T x={36} y={36} c={GRIS}>E</T>
        {L.map(([y, a, b, c]) => <g key={y}><circle cx="26" cy={y} r="5" fill={c}/><T x={50} y={y - 3} c={c} w={700}>{a}</T><T x={50} y={y + 15}>{b}</T></g>)}
        <T x={292} y={176} a="end" c={GRIS}>n = 1, 25 °C</T>
      </Svg>
      <Formule><mi>E</mi><mo>=</mo><msup><mi>E</mi><mrow><mo>°</mo><mo>′</mo></mrow></msup><mo>+</mo><mfrac><mn>0,06</mn><mi>n</mi></mfrac><mi>log</mi><mfrac><mrow><mo>[</mo><mi>Ox</mi><mo>]</mo></mrow><mrow><mo>[</mo><mi>Red</mi><mo>]</mo></mrow></mfrac></Formule>
      <ul style={liste}>
        <li><em>Dix fois plus d’oxydant, 0,06 V de plus</em> (n = 1) : le potentiel suit le rapport des concentrations.</li>
        <li>À i = 0, le potentiel mesuré est l’abscisse où la courbe i = f(E) coupe l’axe (point noir).</li>
        <li><strong>Hypothèse</strong> : couple rapide, activités assimilées aux concentrations, 25 °C.</li>
      </ul>
    </div>);
}

// 3. Le saut de potentiel
export function FicheSaut() {
  return (
    <div>
      <Svg h={200} aria="Potentiel mesuré en fonction de l'avancement x du titrage : un saut brusque de plusieurs centaines de millivolts à x égal 1, l'équivalence est le milieu du saut">
        <Axes y0={170} y1={24}/>
        <line x1="150" y1="170" x2="150" y2="30" stroke={GRIS} strokeDasharray="4 3"/>
        <path d="M40,148 C80,138 120,130 146,124 C150,118 150,70 154,62 C170,56 220,50 270,46" fill="none" stroke={BLEU} strokeWidth="3"/>
        <circle cx="150" cy="93" r="5" fill={ORANGE}/><T x={162} y={98} c={ORANGE} w={700}>milieu du saut</T>
        <T x={30} y={20} c={GRIS}>E ↑</T><T x={292} y={188} a="end" c={GRIS}>x →</T><T x={150} y={188} a="middle" c={GRIS}>x = 1</T>
        <T x={44} y={112} c={BLEU}>couple Fe³⁺/Fe²⁺</T><T x={290} y={76} a="end" c={BLEU}>couple Ce⁴⁺/Ce³⁺</T>
      </Svg>
      <ul style={liste}>
        <li><em>L’équivalence est le milieu du saut.</em> On la repère par les tangentes ou par la dérivée de E = f(x).</li>
        <li>Avant, E est imposé par le couple titré ; après, par le couple titrant : le saut dépasse plusieurs centaines de mV.</li>
        <li>À l’équivalence il ne reste que des traces de réactifs : surtout les produits.</li>
      </ul>
    </div>);
}

// 4. Courant imposé : ΔE
export function FicheCourantImpose() {
  return (
    <div>
      <Svg h={200} aria="Titrage à courant imposé entre deux électrodes identiques : la différence de potentiel ΔE reste petite avant et après l'équivalence et devient très grande à x égal 1">
        <Axes y0={170} y1={24}/>
        <line x1="150" y1="170" x2="150" y2="30" stroke={GRIS} strokeDasharray="4 3"/>
        <path d="M40,150 L124,148 C136,146 140,80 150,36 C160,80 164,146 176,148 L270,150" fill="none" stroke={BLEU} strokeWidth="3"/>
        <T x={30} y={20} c={GRIS}>ΔE ↑</T><T x={292} y={188} a="end" c={GRIS}>x →</T><T x={150} y={188} a="middle" c={GRIS}>x = 1</T>
        <T x={44} y={132} c={GRIS}>ΔE petite</T><T x={292} y={132} a="end" c={GRIS}>ΔE petite</T><T x={162} y={50} c={ROUGE} w={700}>ΔE très grande</T>
      </Svg>
      <ul style={liste}>
        <li><em>Deux électrodes identiques, un petit courant imposé :</em> on mesure la différence de potentiel ΔE entre elles.</li>
        <li>Tant qu’un couple a ses <strong>deux formes</strong> présentes, il sert à l’anode et à la cathode : ΔE n’est que de quelques mV.</li>
        <li>À l’équivalence, il faut deux couples (ou le solvant) à des potentiels éloignés : ΔE saute.</li>
      </ul>
    </div>);
}

// 5. Biampérométrie : i = f(x)
export function FicheBiamperometrie() {
  return (
    <div>
      <Svg h={190} aria="Biampérométrie avec ΔE de 100 millivolts : le courant augmente, passe par un maximum, s'annule à x égal 1 puis remonte">
        <Axes y0={150} y1={24}/>
        <line x1="155" y1="150" x2="155" y2="30" stroke={GRIS} strokeDasharray="4 3"/>
        <path d="M40,150 C55,80 80,46 100,46 C125,46 140,100 155,150 C170,100 195,56 235,50 L270,48" fill="none" stroke={BLEU} strokeWidth="3"/>
        <T x={30} y={20} c={GRIS}>i ↑</T><T x={292} y={168} a="end" c={GRIS}>x →</T><T x={155} y={168} a="middle" c={GRIS}>x = 1</T>
        <T x={44} y={186} c={BLEU} w={700}>ΔE = 100 mV imposée</T>
        <T x={166} y={136} c={ORANGE} w={700}>i ≈ 0</T>
      </Svg>
      <ul style={liste}>
        <li><em>Petite tension ΔE imposée, on mesure le courant i.</em> Ici ΔE = 100 mV (valeur de travail).</li>
        <li>Le courant est limité par la forme la moins concentrée du couple : il s’annule quand <strong>aucun couple n’a ses deux formes</strong>.</li>
        <li>Le minimum de i, à zéro, repère l’équivalence.</li>
      </ul>
    </div>);
}

// 6. Couple lent
export function FicheCoupleLent() {
  return (
    <div>
      <Svg h={190} aria="Courbes courant-potentiel d'un couple rapide, centré sur E°′, et d'un couple lent dont les vagues s'écartent de la surtension η tout en gardant le même palier">
        <Axes y0={100} y1={14}/>
        <line x1="130" y1="34" x2="130" y2="150" stroke={GRIS} strokeDasharray="4 3"/>
        <path d="M30,140 L100,140 C115,140 122,100 130,100 C138,100 145,60 160,60 L290,60" fill="none" stroke={BLEU} strokeWidth="3"/>
        <path d="M30,140 L50,140 C70,140 80,102 92,100 L180,100 C196,100 204,60 220,60" fill="none" stroke={ORANGE} strokeWidth="3" strokeDasharray="6 3"/>
        <T x={130} y={28} a="middle" c={GRIS}>E°′</T><T x={30} y={20} c={GRIS}>i ↑</T><T x={292} y={92} a="end" c={GRIS}>E →</T>
        <Arr x1={132} y1={84} x2={206} y2={84} c={ORANGE}/><T x={170} y={78} a="middle" c={ORANGE} w={800}>η</T>
        <line x1="20" y1="172" x2="44" y2="172" stroke={BLEU} strokeWidth="3"/><T x={50} y={176} c={BLEU} w={700}>rapide</T>
        <line x1="116" y1="172" x2="140" y2="172" stroke={ORANGE} strokeWidth="3" strokeDasharray="6 3"/><T x={146} y={176} c={ORANGE} w={700}>lent : vagues écartées</T>
      </Svg>
      <ul style={liste}>
        <li><em>Couple lent : il faut une surtension η pour réagir.</em> L’oxydation a lieu à un E plus élevé que E°′, la réduction à un E plus bas.</li>
        <li>Le palier (courant limite) ne change pas : seule la vague s’écarte et s’étale.</li>
        <li><strong>Hypothèse</strong> : le fer et le cérium sont en réalité rapides ; « lent » est une situation imaginée pour comprendre la cinétique.</li>
      </ul>
    </div>);
}

// 7. Choisir la méthode
export function FicheChoixMethode() {
  const R = [['Potentiométrie i = 0', 'saut de E ; couple rapide requis', BLEU, '#e8f1fa'], ['Courant imposé', 'saut de ΔE ; utile si couple lent', VIOLET, '#f3e8ff'], ['Tension imposée ΔE', 'i nul à x = 1 ; ΔE < écart des vagues', ORANGE, '#ffedd5']];
  return (
    <div>
      <Svg h={176} aria="Trois méthodes de suivi : potentiométrie à courant nul pour un couple rapide, courant imposé utile pour un couple lent, tension imposée avec ΔE inférieure à l'écart entre les vagues">
        {R.map(([t, d, c, f], i) => <g key={t}><rect x="6" y={4 + i * 58} width="288" height="50" rx="8" fill={f} stroke={c} strokeWidth="2"/><T x={16} y={24 + i * 58} c={c} w={800}>{t}</T><T x={16} y={43 + i * 58}>{d}</T></g>)}
      </Svg>
      <ul style={liste}>
        <li><em>Couple rapide : i = 0 possible. Couple lent : imposer un courant ou une tension.</em></li>
        <li>À i = 0, un couple lent donne un potentiel mal défini, non reproductible.</li>
        <li>Avec une tension imposée, ΔE doit rester inférieure à l’écart entre les vagues, sinon i ≠ 0 à l’équivalence.</li>
      </ul>
    </div>);
}
