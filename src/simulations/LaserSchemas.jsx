// Schémas de la simulation 230 (laser) : scène du faisceau et cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans les aria-label des scènes du parcours.
import * as M from './laserModele.js';

const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', fil: '#334155', laser: '#dc2626' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 232, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Fleche = ({ x1, y1, x2, y2, c = COL.fil, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 11, d = 0.45;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - 6 * Math.cos(a)} y2={y2 - 6 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p} fill={c}/></g>;
};
const fr = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const Laser = ({ x, y }) => <g><rect x={x} y={y - 14} width="52" height="28" rx="5" fill="#1e293b" stroke={COL.encre} strokeWidth="2"/><rect x={x + 44} y={y - 6} width="10" height="12" rx="2" fill="#94a3b8"/><circle cx={x + 12} cy={y} r="4" fill={COL.laser}/></g>;

// ═════════ Scène : laser, faisceau, mur (largeurs du faisceau exagérées, pas à l'échelle) ═════════
export function SceneLaser({ d0 = 2, theta = 0, L = 5 }) {
  const D = M.diametre(d0, theta, L), x0 = 78, xm = 330, Lmax = 20;
  const xT = x0 + (xm - x0) * Math.min(Math.max(L, 0.5), Lmax) / Lmax;
  const demi = v => Math.min(44, 3 + 3.4 * v);
  const y = 96, h0 = demi(d0), h1 = demi(D);
  return (
    <svg viewBox="0 0 400 200" style={base} role="img" aria-label="Schéma : un laser émet un faisceau lumineux très mince vers un mur. Le faisceau a un diamètre D. Les largeurs sont exagérées, le schéma n’est pas à l’échelle.">
      <polygon points={`${x0},${y - h0} ${xT},${y - h1} ${xT},${y + h1} ${x0},${y + h0}`} fill="#fecaca" stroke={COL.laser} strokeWidth="2" opacity="0.9"/>
      <line x1={x0} y1={y} x2={xT} y2={y} stroke={COL.laser} strokeWidth="2"/>
      <Laser x={26} y={y}/>
      <rect x={xT} y="30" width="12" height="132" rx="2" fill="#e2e8f0" stroke={COL.fil} strokeWidth="2.5"/>
      <ellipse cx={xT + 6} cy={y} rx="4.5" ry={Math.max(4, h1)} fill={COL.laser} stroke="white" strokeWidth="1.5"/>
      <text x="52" y={y + 34} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre} {...halo}>laser</text>
      <text x={xT + 6} y="24" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.gris} {...halo}>mur</text>
      <line x1="40" y1="176" x2={xT + 6} y2="176" stroke={COL.fil} strokeWidth="2"/><line x1="40" y1="169" x2="40" y2="183" stroke={COL.fil} strokeWidth="2"/><line x1={xT + 6} y1="169" x2={xT + 6} y2="183" stroke={COL.fil} strokeWidth="2"/>
      <text x={(40 + xT + 6) / 2} y="168" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre} {...halo}>distance L = {fr(L, 1)} m</text>
      <text x="200" y="197" textAnchor="middle" fontSize="15" fill={COL.gris}>largeurs exagérées : diamètre D = {fr(D, 1)} mm</text>
    </svg>);
}

// ═════════ Carte A : trois propriétés du faisceau laser ═════════
export function SvgProprietes() {
  const Boite = ({ x, titre, c, children }) => <g><rect x={x} y="12" width="124" height="150" rx="10" fill="white" stroke={c} strokeWidth="3"/><text x={x + 62} y="36" textAnchor="middle" fontSize="16" fontWeight="800" fill={c}>{titre}</text>{children}</g>;
  const onde = [...Array(21)].map((_, i) => `${16 + i * 5.2},${96 + 16 * Math.sin(i * 0.9)}`).join(' ');
  return (
    <Fond h={206} label="Schéma des trois propriétés d’un faisceau laser : une seule couleur, un faisceau qui ne s’élargit presque pas, et toute la puissance sur une toute petite surface.">
      <Boite x={4} titre="une couleur" c={COL.laser}><polyline points={onde} fill="none" stroke={COL.laser} strokeWidth="3" transform="translate(0,0)"/><text x="66" y="146" textAnchor="middle" fontSize="15" fill={COL.gris}>λ unique</text></Boite>
      <Boite x={138} titre="directif" c={COL.bleu}>
        <line x1="150" y1="70" x2="250" y2="70" stroke={COL.laser} strokeWidth="3"/><line x1="150" y1="86" x2="250" y2="86" stroke={COL.laser} strokeWidth="3"/>
        <line x1="150" y1="116" x2="250" y2="100" stroke="#94a3b8" strokeWidth="2.5"/><line x1="150" y1="116" x2="250" y2="132" stroke="#94a3b8" strokeWidth="2.5"/>
        <text x="200" y="152" textAnchor="middle" fontSize="15" fill={COL.gris}>sans s’ouvrir</text></Boite>
      <Boite x={272} titre="concentré" c={COL.orange}><circle cx="334" cy="82" r="6" fill={COL.laser}/><circle cx="334" cy="120" r="22" fill="#fee2e2" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3"/><text x="334" y="152" textAnchor="middle" fontSize="15" fill={COL.gris}>petite tache</text></Boite>
      <text x="200" y="190" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>même flux, surface minuscule : E très grand</text>
    </Fond>);
}

// ═════════ Carte B : section du faisceau S = π D² ÷ 4 et E = φ ÷ S (exemple 2 mW, D = 1,0 mm) ═════════
export function SvgSection() {
  return (
    <Fond h={238} label="Schéma : la section d’un faisceau est un disque de diamètre D, de surface pi D au carré divisé par 4. L’éclairement est le flux divisé par cette surface.">
      <circle cx="96" cy="84" r="50" fill="#fee2e2" stroke={COL.laser} strokeWidth="3"/>
      <line x1="46" y1="84" x2="146" y2="84" stroke={COL.encre} strokeWidth="2.5"/><line x1="46" y1="76" x2="46" y2="92" stroke={COL.encre} strokeWidth="2.5"/><line x1="146" y1="76" x2="146" y2="92" stroke={COL.encre} strokeWidth="2.5"/>
      <text x="96" y="72" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>D</text>
      <text x="270" y="64" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.bleu}>S = π D² ÷ 4</text>
      <text x="270" y="92" textAnchor="middle" fontSize="16" fill={COL.gris}>D en mm : S en mm²</text>
      <text x="270" y="116" textAnchor="middle" fontSize="16" fill={COL.gris}>1 mm² = 10⁻⁶ m²</text>
      <rect x="14" y="152" width="372" height="76" rx="10" fill="white" stroke={COL.vert} strokeWidth="2.5"/>
      <text x="200" y="178" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>E = φ ÷ S</text>
      <text x="200" y="202" textAnchor="middle" fontSize="16" fill={COL.gris}>2 mW, D = 1,0 mm : S ≈ 0,785 mm²</text>
      <text x="200" y="222" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.vert}>E = 0,002 ÷ 7,85·10⁻⁷ ≈ 2 500 W/m²</text>
    </Fond>);
}

// ═════════ Carte C : un laser s'élargit très peu, une lampe s'étale (D = 2,0 mm → 2,5 mm, surface × 25 pour une lampe) ═════════
export function SvgDistLaser() {
  return (
    <Fond h={246} label="Schéma comparant un laser, dont le faisceau reste presque aussi mince quand on s’éloigne, et une lampe ponctuelle, dont la lumière s’étale sur une surface beaucoup plus grande.">
      <text x="14" y="26" fontSize="17" fontWeight="800" fill={COL.laser}>laser</text>
      <Laser x={14} y={62}/>
      <polygon points="70,56 380,52 380,72 70,68" fill="#fecaca" stroke={COL.laser} strokeWidth="2"/>
      <text x="380" y="96" textAnchor="end" fontSize="16" fill={COL.gris}>presque la même section</text>
      <line x1="14" y1="112" x2="386" y2="112" stroke="#cbd5e1" strokeWidth="2"/>
      <text x="14" y="138" fontSize="17" fontWeight="800" fill={COL.orange}>lampe</text>
      <circle cx="40" cy="170" r="10" fill="#fef08a" stroke={COL.orange} strokeWidth="2.5"/>
      <polygon points="52,166 380,128 380,212 52,174" fill="#fef9c3" stroke="#f59e0b" strokeWidth="2"/>
      <text x="380" y="236" textAnchor="end" fontSize="16" fill={COL.gris}>surface très agrandie</text>
      <text x="200" y="160" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre} {...halo}>à 5 fois plus loin :</text>
      <text x="228" y="186" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.rouge} {...halo}>lampe : E ÷ 25</text>
    </Fond>);
}

// ═════════ Carte D : énergie reçue Q = φ × Δt (exemple 20 mW pendant 2,0 s → 40 mJ) ═════════
export function SvgEnergie() {
  const Boite = ({ x, titre, val, c }) => <g><rect x={x} y="16" width="112" height="76" rx="10" fill="white" stroke={c} strokeWidth="3"/><text x={x + 56} y="44" textAnchor="middle" fontSize="16" fill={COL.gris}>{titre}</text><text x={x + 56} y="74" textAnchor="middle" fontSize="19" fontWeight="800" fill={c}>{val}</text></g>;
  return (
    <Fond h={226} label="Schéma : l’énergie reçue est le produit du flux par la durée d’exposition.">
      <Boite x={8} titre="flux φ" val="20 mW" c={COL.orange}/><Boite x={144} titre="durée Δt" val="2,0 s" c={COL.bleu}/><Boite x={280} titre="énergie Q" val="40 mJ" c={COL.vert}/>
      <text x="126" y="62" textAnchor="middle" fontSize="24" fontWeight="800" fill={COL.encre}>×</text><text x="262" y="62" textAnchor="middle" fontSize="24" fontWeight="800" fill={COL.encre}>=</text>
      <text x="200" y="132" textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.encre}>Q = φ × Δt</text>
      <text x="200" y="168" textAnchor="middle" fontSize="16" fill={COL.gris}>W × s = J (1 mW × 1 s = 1 mJ)</text>
      <text x="200" y="198" textAnchor="middle" fontSize="16" fill={COL.gris}>pour une énergie voulue : Δt = Q ÷ φ</text>
    </Fond>);
}

// ═════════ Carte E : norme (INVENTÉE) et durée maximale (exemple E = 500 W/m² → 5 ms) ═════════
export function SvgNorme() {
  return (
    <Fond h={246} label="Schéma : extrait d’une norme fictive donnant l’éclairement maximal de 10 watts par mètre carré pour une exposition de plus de 0,25 seconde et l’exposition énergétique maximale de 2,5 joules par mètre carré pour une durée plus courte.">
      <rect x="12" y="12" width="376" height="104" rx="10" fill="#f8fafc" stroke={COL.fil} strokeWidth="2.5"/>
      <text x="200" y="38" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>extrait de norme (valeurs inventées)</text>
      <text x="26" y="68" fontSize="16" fill={COL.encre}>durée &gt; 0,25 s : E ≤ 10 W/m²</text>
      <text x="26" y="96" fontSize="16" fill={COL.encre}>durée ≤ 0,25 s : E × Δt ≤ 2,5 J/m²</text>
      <Fleche x1={200} y1={122} x2={200} y2={144} c={COL.fil} w={2.5}/>
      <text x="200" y="172" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.bleu}>Δt max = 2,5 ÷ E</text>
      <text x="200" y="200" textAnchor="middle" fontSize="16" fill={COL.gris}>E = 500 W/m² : Δt max = 2,5 ÷ 500</text>
      <text x="200" y="226" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.vert}>= 0,0050 s = 5,0 ms</text>
    </Fond>);
}

// ═════════ Carte F : classes de laser et consignes ═════════
export function SvgClasses() {
  const L = [['classe 2', 'jusqu’à 1 mW', COL.vert], ['classe 3R', '1 à 5 mW', COL.orange], ['classe 3B', '5 à 500 mW', COL.rouge], ['classe 4', 'plus de 500 mW', '#7f1d1d']];
  return (
    <Fond h={266} label="Schéma : les classes de lasers visibles selon leur flux, de la classe 2 jusqu’à 1 milliwatt à la classe 4 au-dessus de 500 milliwatts, et trois consignes de sécurité.">
      {L.map(([a, b, c], i) => <g key={a}><rect x="10" y={8 + i * 38} width="380" height="32" rx="8" fill="white" stroke={c} strokeWidth="2.5"/><text x="22" y={30 + i * 38} fontSize="16" fontWeight="800" fill={c}>{a}</text><text x="380" y={30 + i * 38} textAnchor="end" fontSize="16" fill={COL.encre}>{b}</text></g>)}
      <text x="200" y="186" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>consignes</text>
      <text x="200" y="208" textAnchor="middle" fontSize="16" fill={COL.encre}>ne jamais regarder le faisceau</text>
      <text x="200" y="230" textAnchor="middle" fontSize="16" fill={COL.encre}>écarter les surfaces brillantes</text>
      <text x="200" y="256" textAnchor="middle" fontSize="16" fill={COL.gris}>laser visible, classes simplifiées</text>
    </Fond>);
}
