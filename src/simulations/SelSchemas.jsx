// Schémas des cartes « À retenir » de la simulation 98 (syn ou anti, stéréosélectivité, stéréospécificité). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', VIOLET = '#6d28d9';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;

export const FSynAnti = () => (
  <Svg h={204} aria="Addition syn : les deux groupes X et Y se fixent sur la même face du plan de l'alcène ; addition anti : ils se fixent sur des faces opposées">
    <T x={74} y={18} a="middle" w={800}>addition syn</T><T x={226} y={18} a="middle" w={800}>addition anti</T>
    <Lg x1={14} y1={96} x2={134} y2={96} c={GRIS} w={2.6}/><Lg x1={166} y1={96} x2={286} y2={96} c={GRIS} w={2.6}/>
    {[[54, 60], [94, 60], [206, 60], [246, 132]].map(([x, y], k) => <g key={k}><circle cx={x} cy={96} r="4.5" fill={ENCRE}/><Lg x1={x} y1={96} x2={x} y2={y} c={ENCRE} w={2.2}/></g>)}
    <T x={54} y={50} a="middle" c={ORANGE} w={800}>X</T><T x={94} y={50} a="middle" c={VIOLET} w={800}>Y</T><T x={206} y={50} a="middle" c={ORANGE} w={800}>X</T><T x={246} y={150} a="middle" c={VIOLET} w={800}>Y</T>
    <T x={74} y={174} a="middle" c={VERT} w={700}>même face</T><T x={226} y={174} a="middle" c={ROUGE} w={700}>faces opposées</T>
    <T x={150} y={198} a="middle" c={GRIS}>trait gris : plan de l’alcène</T>
  </Svg>);

export const FButene = () => {
  const C = { rac: ['racémique', '#e0f2fe', BLEU], meso: ['méso', '#dcfce7', VERT] };
  const G = [['(Z)', C.rac, C.meso], ['(E)', C.meso, C.rac]];
  return (
    <Svg h={176} aria="Produit de l'addition sur le but-2-ène selon le mode d'addition : avec Br₂, addition anti, le (Z) donne le racémique et le (E) le composé méso ; avec OsO₄, addition syn, le (Z) donne le méso et le (E) le racémique">
      <T x={126} y={16} a="middle" c={GRIS} w={700}>anti (Br₂)</T><T x={238} y={16} a="middle" c={GRIS} w={700}>syn (OsO₄)</T>
      {G.map(([n, a, s], k) => <g key={n}><T x={34} y={52 + k * 50} a="middle" w={800}>{n}</T>
        {[a, s].map(([t, f, c], j) => <g key={j}><rect x={72 + j * 112} y={26 + k * 50} width="108" height="40" rx="6" fill={f} stroke={c} strokeWidth="1.8"/><T x={126 + j * 112} y={51 + k * 50} a="middle" c={c} w={800}>{t}</T></g>)}</g>)}
      <T x={150} y={136} a="middle" w={700}>même alcène, autre mode : autre produit</T><T x={150} y={158} a="middle" c={ORANGE} w={800}>réaction stéréospécifique</T>
    </Svg>);
};

export const FSelectif = () => (
  <Svg h={164} aria="Stéréosélectivité : l'hydrogénation du 1,2-diméthylcyclohexène pourrait donner le cis ou le trans ; le cis est formé de préférence et le trans reste minoritaire">
    <T x={150} y={16} a="middle" c={GRIS} w={700}>1,2-diméthylcyclohexène + H₂/Pd</T>
    <T x={12} y={52} w={800}>cis</T><rect x="50" y="36" width="150" height="22" rx="4" fill={VERT} fillOpacity="0.85"/><T x={208} y={52} c={VERT} w={800}>majoritaire</T>
    <T x={12} y={92} w={800}>trans</T><rect x="50" y="76" width="14" height="22" rx="4" fill={ROUGE} fillOpacity="0.85"/><T x={72} y={92} c={ROUGE} w={800}>minoritaire</T>
    <T x={150} y={128} a="middle" w={700}>deux stéréoisomères possibles,</T><T x={150} y={148} a="middle" c={ORANGE} w={800}>un seul favorisé : stéréosélective</T>
  </Svg>);

export const FInclusion = () => (
  <Svg h={214} aria="Toute réaction stéréospécifique, où chaque stéréoisomère de départ donne un produit différent, est stéréosélective, c'est-à-dire qu'elle forme un stéréoisomère de préférence ; l'inverse n'est pas vrai">
    <ellipse cx="150" cy="100" rx="140" ry="82" fill="#ffedd5" stroke={ORANGE} strokeWidth="2.2"/>
    <T x={150} y={44} a="middle" c={ORANGE} w={800}>stéréosélective</T><T x={150} y={62} a="middle" c={ORANGE}>un stéréoisomère de préférence</T>
    <ellipse cx="150" cy="130" rx="96" ry="40" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.2"/>
    <T x={150} y={126} a="middle" c={BLEU} w={800}>stéréospécifique</T><T x={150} y={144} a="middle" c={BLEU}>un produit par réactif</T>
    <T x={150} y={204} a="middle" w={700}>toute spécifique est sélective, pas l’inverse</T>
  </Svg>);
