import { COMPOSANTS, FERMETE, PLAN7, FREF, simplexeCentre } from "./planMelangeModele";

// ====================================================
//  Schémas des cartes « À retenir » du plan de mélange (un schéma par carte, textes ≥ 13 dans un viewBox de 380 de large)
// ====================================================

const [CA, CB, CC] = COMPOSANTS.map(c => c.coul);
const H3 = Math.sqrt(3) / 2;
const tri = (ox, oy, cote) => {
  const P = x => [ox + cote * (x[2] + 0.5 * x[0]), oy - cote * H3 * x[0]];
  const pts = l => l.map(x => P(x).map(v => v.toFixed(1)).join(',')).join(' ');
  return { P, pts };
};
const svgStyle = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px' };
const DOM = simplexeCentre(FREF);

// 1. Lire un diagramme ternaire : un point, trois lectures, total 100 %
export function CarteLire() {
  const T = tri(18, 214, 200), x = [0.5, 0.2, 0.3], p = T.P(x);
  const fa = T.P([0.5, 0.5, 0]), fc = T.P([0.7, 0, 0.3]), fb = T.P([0, 0.2, 0.8]);
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Lecture d'un point du diagramme ternaire : on suit trois lignes de la grille jusqu'aux trois échelles ; les trois proportions lues, 50 %, 30 % et 20 %, ont pour somme 100 %" style={svgStyle}>
      <polygon points={T.pts([[1, 0, 0], [0, 1, 0], [0, 0, 1]])} fill="#fbfdff" stroke="#334155" strokeWidth="2"/>
      <line x1={p[0]} y1={p[1]} x2={fa[0]} y2={fa[1]} stroke={CA} strokeWidth="2.2" strokeDasharray="5 3"/>
      <line x1={p[0]} y1={p[1]} x2={fc[0]} y2={fc[1]} stroke={CC} strokeWidth="2.2" strokeDasharray="5 3"/>
      <line x1={p[0]} y1={p[1]} x2={fb[0]} y2={fb[1]} stroke={CB} strokeWidth="2.2" strokeDasharray="5 3"/>
      <circle cx={p[0]} cy={p[1]} r="7" fill="#f59e0b" stroke="#fff" strokeWidth="2"/>
      <text x={fa[0] - 6} y={fa[1] + 5} textAnchor="end" fontSize="14" fontWeight="800" fill={CA}>50</text>
      <text x={fc[0] + 7} y={fc[1] + 5} fontSize="14" fontWeight="800" fill={CC}>30</text>
      <text x={fb[0]} y={fb[1] + 19} textAnchor="middle" fontSize="14" fontWeight="800" fill={CB}>20</text>
      <text x="238" y="70" fontSize="14.5" fontWeight="800" fill="#0f172a">Un point,</text>
      <text x="238" y="90" fontSize="14.5" fontWeight="800" fill="#0f172a">trois lectures.</text>
      <text x="238" y="124" fontSize="13.5" fill={CA} fontWeight="700">candelilla : 50 %</text>
      <text x="238" y="144" fontSize="13.5" fill={CC} fontWeight="700">cire d’abeille : 30 %</text>
      <text x="238" y="164" fontSize="13.5" fill={CB} fontWeight="700">huile de ricin : 20 %</text>
      <line x1="238" y1="174" x2="372" y2="174" stroke="#334155"/>
      <text x="238" y="194" fontSize="14.5" fontWeight="800" fill="#0f172a">total = 100 %</text>
    </svg>
  );
}

// 2. Les 7 essais du plan : 3 sommets + 3 milieux + 1 centre
export function CartePlan() {
  const T = tri(24, 208, 190), pts = PLAN7.map(e => ({ n: e.n, p: T.P(e.z) }));
  return (
    <svg viewBox="0 0 380 246" role="img" aria-label="Plan de mélange à sept essais dans le domaine d'étude : trois sommets numérotés 1, 2 et 3, trois milieux de côtés numérotés 4, 5 et 6, et le centre numéroté 7" style={svgStyle}>
      <polygon points={T.pts([[1, 0, 0], [0, 1, 0], [0, 0, 1]])} fill="#fff7ed" stroke="#b45309" strokeWidth="2.2" strokeDasharray="7 4"/>
      {pts.map(({ n, p }) => <g key={n}><circle cx={p[0]} cy={p[1]} r="11" fill="white" stroke="#0f172a" strokeWidth="2"/><text x={p[0]} y={p[1] + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">{n}</text></g>)}
      <text x="232" y="62" fontSize="14.5" fontWeight="800" fill="#0f172a">3 sommets : 1, 2, 3</text>
      <text x="232" y="92" fontSize="14.5" fontWeight="800" fill="#0f172a">+ 3 milieux : 4, 5, 6</text>
      <text x="232" y="122" fontSize="14.5" fontWeight="800" fill="#0f172a">+ 1 centre : 7</text>
      <line x1="232" y1="134" x2="372" y2="134" stroke="#334155"/>
      <text x="232" y="156" fontSize="14.5" fontWeight="800" fill="#b91c1c">= 7 essais</text>
      <text x="232" y="182" fontSize="13.5" fill="#334155">le centre (7) est</text>
      <text x="232" y="200" fontSize="13.5" fill="#334155">la formule de départ</text>
    </svg>
  );
}

// 3. S'écarter de la moyenne : antagonisme (valeurs réelles du TP, côté sommet 2 – sommet 3, essai 6)
export function CarteEcart() {
  const y2 = FERMETE[1], y3 = FERMETE[2], y6 = FERMETE[5], moy = (y2 + y3) / 2, k = 130 / 400, base = 196;
  const barre = (x, v, coul, txt, dash) => (
    <g>
      <rect x={x} y={base - v * k} width="62" height={v * k} fill={dash ? 'none' : coul} fillOpacity={dash ? 1 : 0.85} stroke={coul} strokeWidth="2.2" strokeDasharray={dash ? '6 4' : undefined}/>
      <text x={x + 31} y={base - v * k - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">{v}</text>
      <text x={x + 31} y={base + 18} textAnchor="middle" fontSize="13" fill="#334155">{txt[0]}</text>
      <text x={x + 31} y={base + 34} textAnchor="middle" fontSize="13" fill="#334155">{txt[1]}</text>
    </g>);
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label={`Fermeté en grammes : sommet 2 ${y2}, sommet 3 ${y3}, moyenne attendue ${moy}, essai 6 mesuré ${y6} : le mélange est bien moins ferme que la moyenne, c'est un antagonisme`} style={svgStyle}>
      <line x1="14" y1={base} x2="366" y2={base} stroke="#334155" strokeWidth="2"/>
      {barre(22, y2, '#64748b', ['sommet 2', 'mesuré'])}
      {barre(100, y3, '#64748b', ['sommet 3', 'mesuré'])}
      {barre(178, moy, '#0369a1', ['moyenne', 'attendue'], true)}
      {barre(256, y6, '#b91c1c', ['essai 6', 'mesuré'])}
      <text x="190" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#0f172a">fermeté (g)</text>
      <text x="190" y="44" textAnchor="middle" fontSize="13.5" fill="#b91c1c" fontWeight="700">mesuré ≪ moyenne  ⇒  antagonisme</text>
    </svg>
  );
}

// 4. Le plus grand domaine centré sur Fref
export function CarteDomaine() {
  const T = tri(18, 214, 200), dom = DOM.sommets.map(s => T.P(s)), c = T.P(FREF);
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Domaine d'étude : le plus grand triangle de même orientation dont la formule de référence est le centre ; son côté vaut trois fois la plus petite proportion de la formule" style={svgStyle}>
      <polygon points={T.pts([[1, 0, 0], [0, 1, 0], [0, 0, 1]])} fill="#fbfdff" stroke="#334155" strokeWidth="2"/>
      <polygon points={dom.map(p => p.join(',')).join(' ')} fill="#f59e0b" fillOpacity="0.14" stroke="#b45309" strokeWidth="2.2" strokeDasharray="7 4"/>
      <path d={`M${c[0]},${c[1] - 8} L${c[0] + 8},${c[1]} L${c[0]},${c[1] + 8} L${c[0] - 8},${c[1]} Z`} fill="#dc2626" stroke="#fff" strokeWidth="1.5"/>
      <text x="236" y="58" fontSize="14.5" fontWeight="800" fill="#0f172a">Domaine centré</text>
      <text x="236" y="78" fontSize="14.5" fontWeight="800" fill="#0f172a">sur Fref</text>
      <text x="236" y="112" fontSize="13.5" fill="#0f172a" fontWeight="700">xᵢ = Lᵢ + s/3</text>
      <text x="236" y="134" fontSize="13.5" fill="#0f172a" fontWeight="700">Lᵢ ≥ 0  ⇒  s ≤ 3 xᵢ</text>
      <line x1="236" y1="146" x2="372" y2="146" stroke="#334155"/>
      <text x="236" y="168" fontSize="14.5" fontWeight="800" fill="#b91c1c">s = 3 × plus petite</text>
      <text x="236" y="187" fontSize="14.5" fontWeight="800" fill="#b91c1c">proportion de Fref</text>
    </svg>
  );
}

// 5. Coefficient d'interaction : quatre fois l'écart au milieu (valeurs réelles du TP, côté sommet 2 – sommet 3, essai 6)
export function CarteBeta() {
  const y2 = FERMETE[1], y3 = FERMETE[2], y6 = FERMETE[5], moy = (y2 + y3) / 2, k = 130 / 400, base = 196, X = z => 60 + z * 250;
  const Y = v => base - v * k;
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label={`Sur le côté sommet 2 – sommet 3, la fermeté passe de ${y2} à ${y3} g ; au milieu on attendrait ${moy} g, on mesure ${y6} g : le coefficient d'interaction est quatre fois cet écart, soit ${4 * (y6 - moy)} g`} style={svgStyle}>
      <line x1="40" y1={base} x2="340" y2={base} stroke="#334155" strokeWidth="2"/>
      <line x1={X(0)} y1={Y(y2)} x2={X(1)} y2={Y(y3)} stroke="#0369a1" strokeWidth="2.2" strokeDasharray="6 4"/>
      <path d={`M${X(0)},${Y(y2)} Q${X(0.5)},${Y(y6 * 2 - moy)} ${X(1)},${Y(y3)}`} fill="none" stroke="#b91c1c" strokeWidth="2.6"/>
      {[[0, y2, '#64748b'], [0.5, y6, '#b91c1c'], [1, y3, '#64748b']].map(([z, v, c], i) => <circle key={i} cx={X(z)} cy={Y(v)} r="6" fill={c} stroke="#fff" strokeWidth="1.5"/>)}
      <circle cx={X(0.5)} cy={Y(moy)} r="5" fill="white" stroke="#0369a1" strokeWidth="2"/>
      <line x1={X(0.5) + 12} y1={Y(moy)} x2={X(0.5) + 12} y2={Y(y6)} stroke="#0f172a" strokeWidth="2"/>
      <text x={X(0.5) + 18} y={(Y(moy) + Y(y6)) / 2 + 5} fontSize="14" fontWeight="800" fill="#0f172a">écart</text>
      <text x={X(0)} y={base + 19} textAnchor="middle" fontSize="13" fill="#334155">sommet 2</text>
      <text x={X(1)} y={base + 19} textAnchor="middle" fontSize="13" fill="#334155">sommet 3</text>
      <text x={X(0.5)} y={base + 19} textAnchor="middle" fontSize="13" fill="#334155">milieu</text>
      <text x="190" y="22" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#b91c1c">βᵢⱼ = 4 × écart au milieu</text>
      <text x="190" y="42" textAnchor="middle" fontSize="13" fill="#334155">βᵢⱼ = 4 yᵢⱼ − 2 yᵢ − 2 yⱼ</text>
    </svg>
  );
}

// 6. Degrés de liberté : essais − coefficients
export function CarteDdl() {
  const ligne = (y, n, p, etiquette, ddl) => (
    <g>
      {Array.from({ length: n }, (_, i) => <rect key={i} x={14 + i * 27} y={y} width="22" height="22" rx="3" fill={i < p ? '#94a3b8' : '#16a34a'} stroke="#334155" strokeWidth="1.5"/>)}
      <text x={14 + n * 27 + 8} y={y + 16} fontSize="14" fontWeight="800" fill={ddl === 0 ? '#b91c1c' : '#15803d'}>{ddl} ddl</text>
      <text x="14" y={y + 40} fontSize="13" fill="#334155">{etiquette}</text>
    </g>);
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Degrés de liberté : avec sept essais et sept coefficients il n'en reste aucun, avec six coefficients il en reste un, avec trois répétitions de plus il en reste quatre" style={svgStyle}>
      <text x="14" y="22" fontSize="14.5" fontWeight="800" fill="#0f172a">ddl = essais − coefficients</text>
      {ligne(34, 7, 7, '7 essais, 7 coefficients : modèle exact', 0)}
      {ligne(100, 7, 6, '7 essais, 6 coefficients', 1)}
      {ligne(166, 10, 6, '+ 3 répétitions du centre', 4)}
      <text x="14" y="236" fontSize="13" fill="#334155">gris : coefficients estimés · vert : ddl pour tester</text>
    </svg>
  );
}

