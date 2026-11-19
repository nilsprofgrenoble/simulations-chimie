// Cartes « À retenir » de la simulation 52 (variation du vecteur vitesse et forces). Chaque carte est posée UNE ÉTAPE après sa question.
// Notation vectorielle : flèche au-dessus des vecteurs (TV / TL de Travail, Vec de commun).
import { Formule, Vec } from "../commun";
import { TV } from "./Travail";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', VIOLET = '#7e22ce', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const V = ({ x, y, c = ENCRE, children }) => <TV x={x} y={y} c={c} s={13}>{children}</TV>;
const L = ({ x, y, segs, c = ENCRE, w = 700 }) => { let cur = x;
  return <g>{segs.map((g, i) => { const px = cur;
    if (typeof g === 'string') { cur += g.length * 7.3; return <text key={i} x={px} y={y} fontSize="12.5" fontWeight={w} fill={c} xmlSpace="preserve" style={{ whiteSpace: 'pre' }}>{g}</text>; }
    cur += g.v.length * 9 + 4; return <TV key={i} x={px} y={y} s={12.5} w={w} c={c}>{g.v}</TV>; })}</g>; };
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Pt = ({ x, y }) => <circle cx={x} cy={y} r="4" fill={GRIS}/>;
const Cap = ({ lignes }) => <div style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>{lignes.map(([c, x], i) => <div key={i} style={{ color: c }}>{x}</div>)}</div>;
const Dv = () => <Vec n="Δv"/>, SF = () => <Vec n="ΣF"/>, Nv = () => <>‖<Vec n="Δv"/>‖</>;

// 1. Construire Δv
export function FicheConstruireDv() {
  return (
    <div>
      <Svg h={140} aria="Construction du vecteur variation de vitesse : les deux vecteurs vitesse sont placés au même point, Δv va de la pointe de v avant à la pointe de v après">
        <Pt x={40} y={110}/>
        <Arr x1={40} y1={110} x2={140} y2={100} c={BLEU}/><V x={86} y={128} c={BLEU}>v</V><T x={98} y={128} c={BLEU}>avant</T>
        <Arr x1={40} y1={110} x2={100} y2={38} c={VERT}/><V x={44} y={58} c={VERT}>v</V><T x={56} y={58} c={VERT}>après</T>
        <Arr x1={140} y1={100} x2={104} y2={44} c={ROUGE} w={3}/><V x={132} y={72} c={ROUGE}>Δv</V>
        <T x={290} y={30} a="end" c={GRIS}>au même point A</T>
      </Svg>
      <Cap lignes={[[ENCRE, <>1. recopier <Vec n="v"/> après en A</>], [ENCRE, <>2. lui ajouter −<Vec n="v"/> avant</>], [ROUGE, <>3. <Dv/> : de l’origine à la pointe</>]]}/>
      <ul style={liste}>
        <li><em>Δv = v après − v avant : on soustrait des vecteurs</em>, au même point A.</li>
        <li><Dv/> est un <strong>vecteur</strong> : sa direction et son sens comptent autant que sa norme.</li>
        <li><strong>Idée fausse</strong> : « Δv se lit sur la différence des normes ». <strong>Vrai</strong> : seulement si les deux vitesses sont alignées.</li>
      </ul>
    </div>);
}

// 2. Δv a la direction de ΣF
export function FicheDvForce() {
  return (
    <div>
      <Svg h={156} aria="Un mobile se déplace vers le haut et la droite ; la somme des forces est dirigée vers le bas et le vecteur variation de vitesse aussi : Δv a la direction de ΣF, pas celle de v">
        <Pt x={60} y={64}/>
        <Arr x1={60} y1={64} x2={130} y2={28} c={BLEU}/><V x={110} y={22} c={BLEU}>v</V>
        <Arr x1={60} y1={64} x2={60} y2={124} c={ORANGE}/><V x={36} y={100} c={ORANGE}>ΣF</V>
        <Arr x1={108} y1={64} x2={108} y2={124} c={ROUGE}/><V x={116} y={100} c={ROUGE}>Δv</V>
        <T x={164} y={52} w={700}>même direction</T><T x={164} y={70} w={700}>et même sens :</T>
        <V x={164} y={98} c={ROUGE}>Δv</V><T x={188} y={98} c={ROUGE} w={700}>et</T><V x={206} y={98} c={ROUGE}>ΣF</V>
        <V x={164} y={126} c={BLEU}>v</V><T x={176} y={126} c={BLEU} w={700}>: aucun lien</T>
      </Svg>
      <Formule><mover><mi>ΣF</mi><mo stretchy="false">→</mo></mover><mo>≈</mo><mi>m</mi><mo>×</mo><mfrac><mover><mi>Δv</mi><mo stretchy="false">→</mo></mover><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac></Formule>
      <ul style={liste}>
        <li><em><Dv/> et <SF/> : même direction, même sens.</em> Le vecteur vitesse, lui, n’a aucun lien avec la force.</li>
        <li>Exemple : m = 0,50 kg, <Nv/> = 0,80 m/s pendant Δt = 0,40 s ⇒ ΣF ≈ 0,50 × 0,80 ÷ 0,40 = 1,0 N.</li>
        <li><strong>Hypothèse</strong> : système assimilé à un point ; plus Δt est petit, mieux la relation est vérifiée.</li>
      </ul>
    </div>);
}

// 3. Inertie
export function FicheInertie() {
  return (
    <div>
      <Svg h={126} aria="Chronophotographie d'un mobile sans force : points régulièrement espacés et vecteurs vitesse identiques, donc variation de vitesse nulle">
        <T x={8} y={16} w={700}>Sans force : v constant</T>
        {[34, 94, 154, 214].map((x, i) => <g key={x}><Pt x={x} y={62}/><Arr x1={x} y1={62} x2={x + 44} y2={62} c={BLEU}/>{i === 0 && <V x={x + 18} y={46} c={BLEU}>v</V>}</g>)}
        <T x={150} y={96} a="middle" c={GRIS}>points à égale distance</T>
        <T x={150} y={118} a="middle" c={GRIS}>mouvement rectiligne uniforme</T>
      </Svg>
      <Cap lignes={[[ROUGE, <><SF/> = <Vec n="0"/> ⇒ <Dv/> = <Vec n="0"/></>]]}/>
      <ul style={liste}>
        <li><em>Sans force (ou forces qui se compensent), la vitesse ne varie pas.</em></li>
        <li><strong>Idée fausse</strong> : « il faut une force pour avancer ». <strong>Vrai</strong> : il faut une force pour <strong>changer</strong> la vitesse.</li>
        <li>Exemple : un palet sur coussin d’air, le poids et la réaction se compensent.</li>
      </ul>
    </div>);
}

// 4. Rôle de la masse
export function FicheMasse() {
  return (
    <div>
      <Svg h={140} aria="Deux mobiles soumis à la même force pendant la même durée : celui de masse moitié a une variation de vitesse deux fois plus grande">
        {[[30, 'm', 40], [92, 'm ÷ 2', 80]].map(([y, nom, l]) => <g key={nom}>
          <rect x="8" y={y - 16} width="58" height="32" rx="6" fill="#e8f1fa" stroke={BLEU} strokeWidth="2"/><T x={37} y={y + 5} a="middle" c={BLEU} w={700}>{nom}</T>
          <Arr x1={72} y1={y} x2={122} y2={y} c={ORANGE}/><V x={88} y={y - 12} c={ORANGE}>ΣF</V>
          <Arr x1={140} y1={y} x2={140 + l} y2={y} c={ROUGE} w={3}/><V x={150} y={y - 12} c={ROUGE}>Δv</V>
        </g>)}
      </Svg>
      <Cap lignes={[[GRIS, <>même <SF/>, même Δt</>], [VERT, <>moitié moins lourd : <Dv/> double</>]]}/>
      <ul style={liste}>
        <li><em>À même force, le moins massif varie le plus.</em> <Nv/> est inversement proportionnel à m.</li>
        <li>Exemple : m divisée par 2 ⇒ <Nv/> multipliée par 2.</li>
        <li>La masse mesure la <strong>résistance au changement de vitesse</strong>.</li>
      </ul>
    </div>);
}

// 5. Plusieurs forces
export function FichePlusieursForces() {
  return (
    <div>
      <Svg h={134} aria="Deux forces non alignées F1 et F2 : leur somme vectorielle ΣF est la diagonale du parallélogramme, et le vecteur variation de vitesse a la direction de ΣF">
        <line x1="140" y1="100" x2="140" y2="40" stroke={GRIS} strokeDasharray="4 3"/><line x1="70" y1="40" x2="140" y2="40" stroke={GRIS} strokeDasharray="4 3"/>
        <Pt x={70} y={100}/>
        <Arr x1={70} y1={100} x2={140} y2={100} c={ORANGE}/><V x={100} y={120} c={ORANGE}>F₁</V>
        <Arr x1={70} y1={100} x2={70} y2={40} c={VIOLET}/><V x={38} y={74} c={VIOLET}>F₂</V>
        <Arr x1={70} y1={100} x2={138} y2={42} c={ROUGE} w={3.2}/><V x={116} y={86} c={ROUGE}>ΣF</V>
        <Arr x1={200} y1={110} x2={250} y2={68} c={ROUGE}/><V x={236} y={96} c={ROUGE}>Δv</V>
      </Svg>
      <Cap lignes={[[ENCRE, <><SF/> = <Vec n="F₁"/> + <Vec n="F₂"/></>], [ROUGE, <><Dv/> a la direction de <SF/></>]]}/>
      <ul style={liste}>
        <li><em>Plusieurs forces : on additionne des vecteurs</em> (parallélogramme ou bout à bout), pas les normes.</li>
        <li>Les normes ne s’ajoutent que si les forces sont de même direction et de même sens.</li>
        <li><Dv/> pointe comme la <strong>somme</strong> <SF/>, non comme une des forces.</li>
      </ul>
    </div>);
}

// 6. Plus Δt est petit, mieux c'est
export function FichePasDt() {
  return (
    <div>
      <Svg h={150} aria="Une trajectoire courbe : de petits intervalles de temps suivent bien la courbe, un grand intervalle donne une corde qui s'en écarte">
        <path d="M30,120 C30,60 90,20 150,20" fill="none" stroke={GRIS} strokeWidth="2" strokeDasharray="5 3"/>
        <polyline points="30,120 34,92 46,68 66,48 92,32 120,23 150,20" fill="none" stroke={VERT} strokeWidth="3"/>
        <line x1="30" y1="120" x2="150" y2="20" stroke={ROUGE} strokeWidth="2.5"/>
        <T x={164} y={56} c={VERT} w={700}>Δt petit :</T><T x={164} y={74} c={VERT}>suit la courbe</T>
        <T x={164} y={102} c={ROUGE} w={700}>Δt grand :</T><T x={164} y={120} c={ROUGE}>on moyenne</T>
        <T x={8} y={144} c={GRIS}>Δt → 0 : relation exacte (2ᵉ loi de Newton)</T>
      </Svg>
      <ul style={liste}>
        <li><em>Plus Δt est petit, mieux la relation tient.</em> Sur un long intervalle la force change : on ne lit qu’une moyenne.</li>
        <li>À la limite Δt → 0, <SF/> = m × (variation de <Vec n="v"/> par unité de temps).</li>
        <li><strong>Hypothèse</strong> : trajectoire connue seulement point par point (chronophotographie).</li>
      </ul>
    </div>);
}

// 7. Méthode d'Euler
export function FicheEuler() {
  const B = [[6, 'la force'], [108, 'la vitesse'], [210, 'la position']];
  return (
    <div>
      <Svg h={162} aria="Méthode d'Euler : à chaque pas, on calcule la force, la nouvelle vitesse puis la nouvelle position, et on recommence">
        {B.map(([x, t], i) => <g key={x}><rect x={x} y="14" width="84" height="48" rx="8" fill="#e8f1fa" stroke={BLEU} strokeWidth="2"/><T x={x + 42} y={34} a="middle" c={BLEU} w={700}>{t}</T>
          {i === 0 && <V x={x + 34} y={54}>ΣF</V>}{i === 1 && <><V x={x + 14} y={54}>v</V><T x={x + 27} y={54}>+</T><V x={x + 42} y={54}>Δv</V></>}{i === 2 && <T x={x + 42} y={54} a="middle">suivante</T>}</g>)}
        <Arr x1={92} y1={38} x2={106} y2={38}/><Arr x1={194} y1={38} x2={208} y2={38}/>
        <path d="M252,64 V86 H48 V68" fill="none" stroke={ORANGE} strokeWidth="2.4"/><polygon points="48,64 43,72 53,72" fill={ORANGE}/>
        <T x={150} y={106} a="middle" c={ORANGE} w={700}>on recommence à chaque pas Δt</T>
        <T x={8} y={132} c={VERT} w={700}>pas petit : orbite fidèle</T><T x={8} y={152} c={ROUGE} w={700}>pas grand : l’erreur s’accumule</T>
      </Svg>
      <Formule><mover><mi>v</mi><mo stretchy="false">→</mo></mover><mo stretchy="false">(</mo><mi>t</mi><mo>+</mo><mi>Δt</mi><mo stretchy="false">)</mo><mo>=</mo><mover><mi>v</mi><mo stretchy="false">→</mo></mover><mo stretchy="false">(</mo><mi>t</mi><mo stretchy="false">)</mo><mo>+</mo><mfrac><mover><mi>ΣF</mi><mo stretchy="false">→</mo></mover><mi>m</mi></mfrac><mo>×</mo><mi>Δt</mi></Formule>
      <ul style={liste}>
        <li><em>Calculer le mouvement pas à pas</em> : force, nouvelle vitesse, nouvelle position, puis on recommence.</li>
        <li><strong>Hypothèse</strong> : la force est supposée constante pendant un pas ; l’erreur s’accumule quand le pas est grand.</li>
      </ul>
    </div>);
}

// 8. v et Δv sont différents
export function FicheVetDv() {
  const P = [[85, 71, 29, -14], [150, 55, 32, 0], [215, 71, 29, 14]];
  return (
    <div>
      <Svg h={134} aria="Lancer en biais : le vecteur vitesse est tangent à la trajectoire et change de direction, alors que le vecteur variation de vitesse reste vertical vers le bas comme le poids">
        <path d="M20,120 Q150,-10 280,120" fill="none" stroke={GRIS} strokeWidth="1.5" strokeDasharray="5 3"/>
        {P.map(([x, y, dx, dy], i) => <g key={x}><Pt x={x} y={y}/><Arr x1={x} y1={y} x2={x + dx} y2={y + dy} c={BLEU}/><Arr x1={x} y1={y + 8} x2={x} y2={y + 38} c={ROUGE}/>
          {i === 0 && <><V x={x + 30} y={y - 12} c={BLEU}>v</V><V x={x + 8} y={y + 32} c={ROUGE}>Δv</V></>}</g>)}
      </Svg>
      <Cap lignes={[[BLEU, <><Vec n="v"/> : tangente à la trajectoire</>], [ROUGE, <><Dv/> : toujours vers le bas</>]]}/>
      <ul style={liste}>
        <li><em>v et Δv : deux vecteurs différents.</em> Le premier est tangent à la trajectoire, le second a la direction de <SF/>.</li>
        <li>Lancer en biais : <Vec n="v"/> change de direction, <Dv/> reste vertical (poids seul).</li>
        <li><strong>Idée fausse</strong> : « la force pointe comme la vitesse ». <strong>Vrai</strong> : elle pointe comme <Dv/>.</li>
      </ul>
    </div>);
}

// 9. La Lune
export function FicheLune() {
  return (
    <div>
      <Svg h={146} aria="La Lune en orbite autour de la Terre : le vecteur vitesse est tangent à l'orbite, le vecteur variation de vitesse et la force de gravitation sont dirigés vers la Terre">
        <circle cx="150" cy="84" r="56" fill="none" stroke={GRIS} strokeDasharray="5 3" strokeWidth="1.5"/>
        <circle cx="150" cy="84" r="16" fill="#bfdbfe" stroke={BLEU} strokeWidth="2"/><T x={150} y={114} a="middle" c={BLEU}>Terre</T>
        <circle cx="206" cy="84" r="6" fill={GRIS}/><T x={216} y={104} c={GRIS}>Lune</T>
        <Arr x1={206} y1={84} x2={206} y2={42} c={BLEU}/><V x={214} y={62} c={BLEU}>v</V>
        <Arr x1={206} y1={84} x2={174} y2={84} c={ROUGE} w={3}/><V x={178} y={74} c={ROUGE}>Δv</V>
      </Svg>
      <Cap lignes={[[ROUGE, <><Dv/> et <SF/> : vers la Terre</>], [BLEU, <><Vec n="v"/> : tangente à l’orbite</>]]}/>
      <ul style={liste}>
        <li><em>En orbite, la direction de v change : Δv pointe vers le centre.</em> C’est la direction de la force de gravitation.</li>
        <li>La norme de la vitesse reste presque constante, mais le <strong>vecteur</strong> vitesse varie.</li>
        <li><strong>Hypothèse</strong> : orbite circulaire, référentiel géocentrique supposé galiléen.</li>
      </ul>
    </div>);
}
