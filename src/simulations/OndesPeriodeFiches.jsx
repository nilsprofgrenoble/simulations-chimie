// Cartes « À retenir » de la simulation 151 (ondes mécaniques périodiques, 1G) : un schéma par carte, viewBox de 300 de large.
import { Formule } from "../commun";
import { puces } from "./Travail";

const BLEU = '#1d4ed8', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', GRIS = '#475569';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '6px auto' };
// Sinusoïde y = yc − a·sin(2π (x − x0) / p) tracée de xa à xb
const sinus = (xa, xb, yc, a, p, x0 = 0) => {
  const pts = []; for (let x = xa; x <= xb + 0.01; x += 2) pts.push(`${x.toFixed(1)},${(yc - a * Math.sin(2 * Math.PI * (x - x0) / p)).toFixed(1)}`);
  return pts.join(' ');
};
const fleche2 = ({ x1, x2, y, c, t = 5 }) => (<g stroke={c} fill={c}>
  <line x1={x1 + t} y1={y} x2={x2 - t} y2={y} strokeWidth="2"/>
  <polygon points={`${x1},${y} ${x1 + 2 * t},${y - t * 0.7} ${x1 + 2 * t},${y + t * 0.7}`} stroke="none"/>
  <polygon points={`${x2},${y} ${x2 - 2 * t},${y - t * 0.7} ${x2 - 2 * t},${y + t * 0.7}`} stroke="none"/></g>);
const pointille = ({ x, y1, y2, c = GRIS }) => <line x1={x} y1={y1} x2={x} y2={y2} stroke={c} strokeWidth="1.4" strokeDasharray="3 3"/>;

export const FICHES = {
  // Période et fréquence
  periode: <>
    <svg viewBox="0 0 300 176" role="img" aria-label="Graphique de y en fonction du temps t en un point de la corde : une sinusoïde dont deux maxima successifs sont séparés par la période T" style={svgStyle}>
      <line x1="28" y1="20" x2="28" y2="134" stroke="#0f172a" strokeWidth="1.6"/><line x1="28" y1="88" x2="290" y2="88" stroke="#0f172a" strokeWidth="1.6"/>
      <polygon points="290,88 280,83 280,93" fill="#0f172a"/>
      <text x="290" y="110" textAnchor="end" fontSize="14" fontWeight="700" fill="#0f172a">t (s)</text><text x="34" y="26" fontSize="14" fontWeight="700" fill="#0f172a">y</text>
      <polyline points={sinus(28, 278, 88, 38, 100, 28)} fill="none" stroke={BLEU} strokeWidth="3"/>
      {pointille({ x: 53, y1: 50, y2: 32, c: ORANGE })}{pointille({ x: 153, y1: 50, y2: 32, c: ORANGE })}
      {fleche2({ x1: 53, x2: 153, y: 34, c: ORANGE })}
      <text x="103" y="25" textAnchor="middle" fontSize="17" fontWeight="800" fill={ORANGE}>T</text>
      <text x="150" y="152" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={BLEU}>1 oscillation complète</text>
      <text x="150" y="170" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ORANGE}>durée = période T</text>
    </svg>
    <Formule><mi>f</mi><mo>=</mo><mfrac><mn>1</mn><mi>T</mi></mfrac></Formule>
    {puces(<><strong>Période T</strong> (en s) : durée d’un motif complet, par exemple d’un maximum au maximum suivant.</>,
      <><strong>Fréquence f</strong> (en Hz = s⁻¹) : nombre d’oscillations par seconde. <strong>Plus T est grande, plus f est petite.</strong></>,
      <><strong>Exemple</strong> : T = 0,25 s donne f = 1 ÷ 0,25 = 4 Hz (4 oscillations chaque seconde).</>,
      <><strong>Idée fausse</strong> : « T et f augmentent ensemble ». <strong>Vrai</strong> : ce sont des inverses.</>)}
  </>,
  // Double périodicité
  double: <>
    <svg viewBox="0 0 300 254" role="img" aria-label="Deux graphiques superposés : en haut y en fonction du temps t pour un point fixé, qui se répète à l’identique toutes les périodes T ; en bas y en fonction de la position x à un instant fixé, qui se répète à l’identique toutes les longueurs d’onde lambda" style={svgStyle}>
      <text x="150" y="16" textAnchor="middle" fontSize="14" fontWeight="800" fill={BLEU}>Un seul point : y(t), période T</text>
      <line x1="20" y1="88" x2="286" y2="88" stroke="#0f172a" strokeWidth="1.5"/><text x="288" y="80" textAnchor="end" fontSize="13.5" fontWeight="700" fill="#0f172a">t (s)</text>
      <polyline points={sinus(20, 236, 88, 24, 96, 20)} fill="none" stroke={BLEU} strokeWidth="3"/>
      {pointille({ x: 44, y1: 64, y2: 44, c: ORANGE })}{pointille({ x: 140, y1: 64, y2: 44, c: ORANGE })}{fleche2({ x1: 44, x2: 140, y: 46, c: ORANGE })}
      <text x="92" y="39" textAnchor="middle" fontSize="16" fontWeight="800" fill={ORANGE}>T</text>
      <text x="150" y="134" textAnchor="middle" fontSize="14" fontWeight="800" fill={BLEU}>Toute la corde : y(x), longueur d’onde λ</text>
      <line x1="20" y1="200" x2="286" y2="200" stroke="#0f172a" strokeWidth="1.5"/><text x="288" y="192" textAnchor="end" fontSize="13.5" fontWeight="700" fill="#0f172a">x (cm)</text>
      <polyline points={sinus(20, 232, 200, 24, 96, 20)} fill="none" stroke={BLEU} strokeWidth="3"/>
      {pointille({ x: 44, y1: 176, y2: 156, c: ORANGE })}{pointille({ x: 140, y1: 176, y2: 156, c: ORANGE })}{fleche2({ x1: 44, x2: 140, y: 158, c: ORANGE })}
      <text x="92" y="151" textAnchor="middle" fontSize="16" fontWeight="800" fill={ORANGE}>λ</text>
      <text x="150" y="248" textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>T : dans le temps ; λ : dans l’espace</text>
    </svg>
    {puces(<><strong>Mnémo</strong> : T = le <strong>temps</strong>, λ = l’<strong>espace</strong>. Une onde périodique se répète dans les deux.</>,
      <>Deux points <strong>en phase</strong> vibrent à l’unisson : leur distance est un <strong>multiple de λ</strong> (λ, 2λ, 3λ…). <strong>En opposition</strong> : un multiple de λ plus une demi-longueur d’onde.</>,
      <>Pendant <strong>une période T</strong>, l’onde avance d’<strong>une longueur d’onde λ</strong>.</>)}
  </>,
  // λ = c·T
  celerite: <>
    <svg viewBox="0 0 300 158" role="img" aria-label="Une onde sinusoïdale : une crête repérée à l’instant 0 se retrouve une longueur d’onde plus loin à l’instant T, car l’onde avance d’une longueur d’onde pendant une période" style={svgStyle}>
      <line x1="12" y1="92" x2="288" y2="92" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="5 3"/>
      <polyline points={sinus(12, 288, 92, 30, 112, 14)} fill="none" stroke={BLEU} strokeWidth="3"/>
      <circle cx="42" cy="62" r="6.5" fill={ROUGE}/><circle cx="154" cy="62" r="6.5" fill="#fff" stroke={ROUGE} strokeWidth="3"/>
      <text x="42" y="46" textAnchor="middle" fontSize="14" fontWeight="800" fill={ROUGE}>t = 0</text><text x="154" y="46" textAnchor="middle" fontSize="14" fontWeight="800" fill={ROUGE}>t = T</text>
      {pointille({ x: 42, y1: 70, y2: 116, c: ORANGE })}{pointille({ x: 154, y1: 70, y2: 116, c: ORANGE })}{fleche2({ x1: 42, x2: 154, y: 112, c: ORANGE })}
      <text x="98" y="132" textAnchor="middle" fontSize="16" fontWeight="800" fill={ORANGE}>λ</text>
      <text x="150" y="152" textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>même crête : elle avance de λ pendant T</text>
    </svg>
    <Formule><mi>c</mi><mo>=</mo><mfrac><mi>λ</mi><mi>T</mi></mfrac><mo>⇔</mo><mi>λ</mi><mo>=</mo><mi>c</mi><mo>·</mo><mi>T</mi></Formule>
    {puces(<>Vitesse = distance ÷ durée : en une période, la distance parcourue est <strong>λ</strong>, donc <strong>c = λ ÷ T</strong> (λ en m, T en s, c en m/s).</>,
      <>Avec f = 1 ÷ T : <strong>λ = c ÷ f</strong>. <strong>Notation</strong> : le programme note <em>v</em> la célérité d’une onde ; ici on la note <em>c</em>, à ne pas confondre avec la célérité de la lumière (3,0×10⁸ m/s).</>,
      <><strong>Exemple</strong> : un son de fréquence 440 Hz dans l’air (c = 340 m/s) a pour longueur d’onde λ = 340 ÷ 440 ≈ 0,77 m.</>,
      <><strong>Idée fausse</strong> : « λ ne dépend que de la source ». <strong>Vrai</strong> : elle dépend de T (source) <strong>et</strong> de c (milieu).</>)}
  </>,
  // Qui décide de quoi
  decide: <>
    <svg viewBox="0 0 300 208" role="img" aria-label="Deux cadres au-dessus d’un troisième : la source impose la période T, la fréquence f et l’amplitude A ; le milieu impose la célérité c ; chacun des deux est relié par une flèche à l’onde, dont la longueur d’onde lambda vaut c fois T" style={svgStyle}>
      <defs><marker id="fl-decide" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={GRIS}/></marker></defs>
      {[[10, 'SOURCE', 'impose', 'T, f, A', BLEU], [170, 'MILIEU', 'impose', 'c', VERT]].map(([x, a, b, c, col]) => (
        <g key={a}><rect x={x} y="8" width="120" height="70" rx="10" fill="#fff" stroke={col} strokeWidth="2.5"/>
          <text x={x + 60} y="29" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={col}>{a}</text>
          <text x={x + 60} y="46" textAnchor="middle" fontSize="12.5" fill={GRIS}>{b}</text>
          <text x={x + 60} y="68" textAnchor="middle" fontSize="17" fontWeight="800" fill="#0f172a">{c}</text></g>))}
      <line x1="70" y1="80" x2="116" y2="108" stroke={GRIS} strokeWidth="2.4" markerEnd="url(#fl-decide)"/>
      <line x1="230" y1="80" x2="184" y2="108" stroke={GRIS} strokeWidth="2.4" markerEnd="url(#fl-decide)"/>
      <rect x="80" y="112" width="140" height="48" rx="10" fill="#fff" stroke={ORANGE} strokeWidth="2.5"/>
      <text x="150" y="132" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={ORANGE}>ONDE : résulte</text>
      <text x="150" y="152" textAnchor="middle" fontSize="17" fontWeight="800" fill="#0f172a">λ = c·T</text>
      <text x="150" y="180" textAnchor="middle" fontSize="14" fontWeight="800" fill={ROUGE}>même corde, T ÷ 2  ⇒  λ ÷ 2</text>
      <text x="150" y="200" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={VERT}>A change : T, c et λ ne changent pas</text>
    </svg>
    {puces(<>La <strong>source</strong> fixe la période T (donc f) et l’amplitude A. Le <strong>milieu</strong> fixe la célérité c.</>,
      <>Donc <strong>λ = c·T</strong> est une conséquence : même milieu, T doublée ⇒ λ doublée (c ne bouge pas).</>,
      <><strong>Exemple</strong> : à c = 50 cm/s, T passe de 0,40 s à 0,20 s : λ passe de 20 cm à 10 cm.</>,
      <><strong>Idée fausse</strong> : « une onde plus haute va plus vite ». <strong>Vrai</strong> : l’amplitude ne change ni T, ni c, ni λ.</>)}
  </>,
};
