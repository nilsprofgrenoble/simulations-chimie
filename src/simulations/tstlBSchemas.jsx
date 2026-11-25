/* eslint-disable react-refresh/only-export-components */
import { useId } from "react";
import { KIT } from "../commun";

// Schémas neutres (sans aucune valeur chiffrée) des exercices de remédiation TSTL : boucle de régulation et diagramme binaire isobare.
// Branchés dans SchemasC1.jsx (table DESSINS) : { type: 'boucleRegul' } et { type: 'diagBinaire', x0, points }.
const TR = '#334155', BLEU = '#2563eb', ORANGE = '#c2410c', GRIS = '#64748b';
const boite = { background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 };
const svgStyle = { width: '100%', maxWidth: 500, height: 'auto', display: 'block', margin: '0 auto' };
const Pointe = ({ id, c }) => <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={c}/></marker>;

// Boucle de régulation à cinq éléments repérés par des lettres (A comparateur, B régulateur, C actionneur, D procédé, E capteur) : aucun nom d'élément n'est écrit.
function BoucleRegul() {
  const u = useId().replace(/:/g, '');
  const bloc = (x, y, w, h, l) => <g key={l}><rect x={x} y={y} width={w} height={h} rx="6" fill="#f1f5f9" stroke={TR} strokeWidth="2.4"/><text x={x + w / 2} y={y + h / 2 + 8} fontSize="25" fontWeight="800" fill={TR} textAnchor="middle">{l}</text></g>;
  const fl = (pts, c = TR, m = 't') => <polyline points={pts} fill="none" stroke={c} strokeWidth="2.4" markerEnd={`url(#${u}${m})`}/>;
  return (
    <div style={boite} data-schema="boucle-regulation">
      <svg viewBox="0 0 500 240" style={svgStyle} role="img" aria-label="Schéma d’une boucle de régulation : cinq éléments repérés par les lettres A à E, une entrée « consigne », une flèche « perturbation » sur l’élément D, la grandeur réglée en sortie et un retour de la mesure vers l’élément A">
        <defs><Pointe id={`${u}t`} c={TR}/><Pointe id={`${u}o`} c={ORANGE}/></defs>
        <text x="4" y="66" fontSize="19" fill={TR}>consigne</text>
        {fl('4,104 83,104')}
        <text x="58" y="94" fontSize="22" fontWeight="700" fill={TR}>+</text>
        <circle cx="100" cy="104" r="17" fill="white" stroke={TR} strokeWidth="2.4"/>
        <text x="100" y="74" fontSize="25" fontWeight="800" fill={TR} textAnchor="middle">A</text>
        {fl('117,104 143,104')}
        {bloc(145, 82, 60, 44, 'B')}
        {fl('205,104 233,104')}
        {bloc(235, 82, 60, 44, 'C')}
        {fl('295,104 323,104')}
        {bloc(325, 82, 60, 44, 'D')}
        <text x="355" y="20" fontSize="19" fill={ORANGE} textAnchor="middle" fontWeight="700">perturbation</text>
        {fl('355,28 355,80', ORANGE, 'o')}
        {fl('385,104 496,104')}
        <text x="498" y="68" fontSize="19" fill={TR} textAnchor="end">grandeur réglée</text>
        <circle cx="440" cy="104" r="4" fill={TR}/>
        {fl('440,104 440,204 297,204')}
        {bloc(235, 182, 60, 44, 'E')}
        {fl('235,204 100,204 100,123')}
        <text x="112" y="150" fontSize="24" fontWeight="700" fill={TR}>−</text>
      </svg>
    </div>);
}

// Diagramme isobare température – composition d'un mélange binaire idéal (sans azéotrope) : courbes (1) et (2), zones X, Y, Z, et, si points, la verticale à x₀ et les points P, Q, R, S.
const Tb = x => 1 - (1.2 * x - 0.2 * x * x);               // courbe d'ébullition (température normalisée)
const yv = x => 5 * x / (1 + 4 * x);                        // composition de la vapeur en équilibre
const PX = x => 70 + 400 * x, PY = T => 60 + 140 * (1 - T);
function DiagBinaire({ x0 = 0.3, points = false, ligne = false }) {
  const N = 60, xs = Array.from({ length: N + 1 }, (_, i) => i / N);
  const c1 = xs.map(x => `${PX(x).toFixed(1)},${PY(Tb(x)).toFixed(1)}`).join(' ');
  const c2 = xs.map(x => `${PX(yv(x)).toFixed(1)},${PY(Tb(x)).toFixed(1)}`).join(' ');
  const Tq = Tb(x0), yq = yv(x0);
  // point S : la verticale x = x0 rencontre la courbe (2) à la température T telle que yv(x) = x0
  const xs0 = x0 / (5 - 4 * x0), Ts = Tb(xs0);
  return (
    <div style={boite} data-schema="diagramme-binaire">
      <svg viewBox="0 0 500 300" style={svgStyle} role="img" aria-label="Diagramme isobare température en fonction de la fraction molaire du constituant le plus volatil, avec deux courbes numérotées (1) et (2) et trois zones X, Y et Z">
        <defs><Pointe id="dbf" c={TR}/></defs>
        <line x1="70" y1="250" x2="70" y2="24" stroke={TR} strokeWidth="2.2" markerEnd="url(#dbf)"/>
        <line x1="70" y1="250" x2="486" y2="250" stroke={TR} strokeWidth="2.2" markerEnd="url(#dbf)"/>
        <text x="20" y="150" fontSize="19" fill={TR} textAnchor="middle" transform="rotate(-90 20 150)">température</text>
        <text x="270" y="294" fontSize="18" fill={TR} textAnchor="middle">fraction molaire du constituant le plus volatil</text>
        <text x="70" y="274" fontSize="19" fill={TR} textAnchor="middle">0</text>
        <text x="470" y="274" fontSize="19" fill={TR} textAnchor="middle">1</text>
        <polyline points={c1} fill="none" stroke={BLEU} strokeWidth="3"/>
        <polyline points={c2} fill="none" stroke={ORANGE} strokeWidth="3"/>
        <text x="112" y="116" fontSize="20" fontWeight="800" fill={BLEU}>(1)</text>
        <text x="440" y="126" fontSize="20" fontWeight="800" fill={ORANGE}>(2)</text>
        <text x="130" y="230" fontSize="26" fontWeight="800" fill={TR}>X</text>
        <text x="262" y="128" fontSize="26" fontWeight="800" fill={TR}>Y</text>
        <text x="410" y="70" fontSize="26" fontWeight="800" fill={TR}>Z</text>
        {points && <g>
          <line x1={PX(x0)} y1="250" x2={PX(x0)} y2="30" stroke={GRIS} strokeWidth="1.6" strokeDasharray="5 4"/>
          {ligne && <line x1={PX(x0)} y1={PY(Tq)} x2={PX(yq)} y2={PY(Tq)} stroke={GRIS} strokeWidth="1.6" strokeDasharray="5 4"/>}
          <text x={PX(x0)} y="274" fontSize="19" fill={TR} textAnchor="middle">x₀</text>
          {[['P', PX(x0), 226, -22, 8], ['Q', PX(x0), PY(Tq), -24, 8], ['R', PX(yq), PY(Tq), 10, -8], ['S', PX(x0), PY(Ts), -24, 8]].map(([l, x, y, dx, dy]) => (
            <g key={l}><circle cx={x} cy={y} r="5" fill={TR}/><text x={x + dx} y={y + dy} fontSize="22" fontWeight="800" fill={TR}>{l}</text></g>))}
        </g>}
      </svg>
    </div>);
}

export const DESSINS_TSTLB = { boucleRegul: BoucleRegul, diagBinaire: DiagBinaire };
