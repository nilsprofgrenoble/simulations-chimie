import { KIT } from "../commun";
import { Mol2D } from "./MecaVue2D";
import { interp } from "./mecaModele";

// Schémas des exercices « Mécanismes réactionnels » (utilisés par Visuel dans SchemasC1.jsx).
//   meca       : le mécanisme du but-2-ène + HBr à un instant u (0 ; 0,25 ; 0,5 ; 0,62 ; 1) avec ses flèches courbes
//   lewis      : formes mésomères d'un ion (formules de Lewis avec doublets non liants et charges formelles)
//   profilReac : profil d'énergie à deux étapes dont les points sont repérés par des lettres (jamais la réponse)
const boite = { background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 };

function SchemaMeca({ u = 0, face = 1, fleches = true, numC = false, legende }) {
  return (
    <div style={boite} data-schema="meca">
      <div style={{ maxWidth: 440, margin: '0 auto' }}><Mol2D u={u} face={face} avecFleches={fleches} numC={numC} /></div>
      {legende && <div style={{ fontSize: 12.5, color: '#475569', textAlign: 'center', marginTop: 4 }}>{legende}</div>}
    </div>);
}

// energies = [réactifs, sommet 1, creux, sommet 2, produits] ; lettres = noms des 5 points ; valeurs : écrit l'énergie sous la lettre
function SchemaProfilReac({ energies = [0, 100, 60, 70, -65], lettres = ['A', 'B', 'C', 'D', 'E'], valeurs = true, unite = 'kJ·mol⁻¹' }) {
  const W = 340, H = 212, mx = 30, bas = H - 36, haut = 24;
  const E0 = Math.min(...energies) - 42, E1 = Math.max(...energies) + 24;
  const X = k => mx + k * (W - mx - 14), Y = e => haut + (E1 - e) / (E1 - E0) * (bas - haut);
  const us = [0, 0.25, 0.5, 0.75, 1];
  const cles = us.map((k, i) => [k, energies[i]]);
  const pts = []; for (let i = 0; i <= 120; i++) { const k = i / 120; pts.push(`${X(k).toFixed(1)},${Y(interp(cles, k)).toFixed(1)}`); }
  const sommet = i => i === 1 || i === 3;
  return (
    <div style={boite} data-schema="profil-reac">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' }} role="img" aria-label="Profil d'énergie d'une réaction en deux étapes, cinq points repérés par des lettres">
        <line x1={mx} y1={bas} x2={mx} y2={haut - 10} stroke="#94a3b8" /><line x1={mx} y1={bas} x2={W - 8} y2={bas} stroke="#94a3b8" />
        <text x={mx + 4} y={haut - 8} fontSize="10.5" fill="#64748b">Énergie</text>
        <text x={W - 8} y={H - 8} fontSize="10.5" textAnchor="end" fill="#64748b">avancement de la réaction →</text>
        <polyline points={pts.join(' ')} fill="none" stroke="#0284c7" strokeWidth="2.8" />
        {us.map((k, i) => {
          const dy = sommet(i) ? -10 : 16;
          const ancre = i === 0 ? 'start' : i === 4 ? 'end' : 'middle';
          const dx = i === 0 ? 6 : i === 4 ? -2 : 0;
          return (<g key={i}>
            <circle cx={X(k)} cy={Y(energies[i])} r="3.8" fill="white" stroke="#0284c7" strokeWidth="2" />
            <text x={X(k) + dx} y={Y(energies[i]) + dy} fontSize="13" fontWeight="700" textAnchor={ancre} fill="#0f172a">{lettres[i]}</text>
            {valeurs && <text x={X(k) + dx} y={Y(energies[i]) + dy + (dy > 0 ? 12 : -13)} fontSize="10.5" textAnchor={ancre} fill="#475569">{energies[i]} {unite}</text>}
          </g>);
        })}
      </svg>
    </div>);
}


// ── Formules de Lewis des formes mésomères d'un ion (éthanoate, nitrate, carbonate) ──
//   ion : 'ethanoate' | 'nitrate' | 'carbonate' ; formes : nombre de formes limites affichées (la double liaison se déplace d'une forme à l'autre)
const IONS_LEWIS = {
  ethanoate: { centre: 'C', charge: null, L: 46, lig: [{ ang: 180, el: 'CH₃', groupe: true }, { ang: -40, el: 'O' }, { ang: 40, el: 'O' }], dbl: [1, 2] },
  nitrate: { centre: 'N', charge: '+', L: 44, lig: [{ ang: -90, el: 'O' }, { ang: 30, el: 'O' }, { ang: 150, el: 'O' }], dbl: [0, 1, 2] },
  carbonate: { centre: 'C', charge: null, L: 44, lig: [{ ang: -90, el: 'O' }, { ang: 30, el: 'O' }, { ang: 150, el: 'O' }], dbl: [0, 1, 2] },
};
const rad = d => d * Math.PI / 180;
const pt = (c, ang, r) => [c[0] + r * Math.cos(rad(ang)), c[1] + r * Math.sin(rad(ang))];

function FormeLewis({ def, doublee, ox }) {
  const c = [ox + 80, 72], NOIR = '#0f172a';
  const elements = [];
  def.lig.forEach((l, i) => {
    const p = pt(c, l.ang, def.L), double = i === doublee && l.el === 'O';
    const A = pt(c, l.ang, 10), B = pt(p, l.ang + 180, l.groupe ? 19 : 10);
    const nx = -Math.sin(rad(l.ang)) * 2.6, ny = Math.cos(rad(l.ang)) * 2.6;
    if (double) {
      elements.push(<line key={'b1' + i} x1={A[0] + nx} y1={A[1] + ny} x2={B[0] + nx} y2={B[1] + ny} stroke={NOIR} strokeWidth="2" strokeLinecap="round" />);
      elements.push(<line key={'b2' + i} x1={A[0] - nx} y1={A[1] - ny} x2={B[0] - nx} y2={B[1] - ny} stroke={NOIR} strokeWidth="2" strokeLinecap="round" />);
    } else elements.push(<line key={'b' + i} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={NOIR} strokeWidth="2" strokeLinecap="round" />);
    if (l.groupe) {
      elements.push(<text key={'t' + i} x={p[0]} y={p[1] + 6} fontSize="17" fontWeight="700" textAnchor="middle" fill={NOIR}>CH<tspan fontSize="11" dy="4">3</tspan></text>);
      return;
    }
    elements.push(<text key={'t' + i} x={p[0]} y={p[1] + 6} fontSize="17" fontWeight="700" textAnchor="middle" fill={NOIR}>O</text>);
    // doublets non liants : 2 pour l'oxygène de la double liaison, 3 pour l'oxygène chargé −
    const angles = double ? [l.ang - 55, l.ang + 55] : [l.ang, l.ang + 90, l.ang - 90];
    angles.forEach((a, k) => {
      const q = pt(p, a, 16), tx = -Math.sin(rad(a)) * 4.5, ty = Math.cos(rad(a)) * 4.5;
      elements.push(<line key={`d${i}${k}`} x1={q[0] - tx} y1={q[1] - ty} x2={q[0] + tx} y2={q[1] + ty} stroke={NOIR} strokeWidth="3" strokeLinecap="round" />);
    });
    if (!double) {
      const q = pt(p, l.ang + 45, 29);
      elements.push(<g key={'c' + i}><circle cx={q[0]} cy={q[1]} r="6.5" fill="white" stroke="#dc2626" strokeWidth="1.5" /><text x={q[0]} y={q[1] + 4} fontSize="12" fontWeight="700" textAnchor="middle" fill="#dc2626">−</text></g>);
    }
  });
  elements.push(<text key="centre" x={c[0]} y={c[1] + 6} fontSize="17" fontWeight="700" textAnchor="middle" fill={NOIR}>{def.centre}</text>);
  if (def.charge) elements.push(<g key="cc"><circle cx={c[0]} cy={c[1] + 26} r="6.5" fill="white" stroke="#1d4ed8" strokeWidth="1.5" /><text x={c[0]} y={c[1] + 30} fontSize="12" fontWeight="700" textAnchor="middle" fill="#1d4ed8">+</text></g>);
  return <g>{elements}</g>;
}

function SchemaLewis({ ion = 'nitrate', formes = 1, legende }) {
  const def = IONS_LEWIS[ion];
  const n = Math.min(formes, def.dbl.length), pas = 172, W = (n - 1) * pas + 160;
  return (
    <div style={boite} data-schema="lewis">
      <svg viewBox={`0 0 ${W} 150`} style={{ width: '100%', maxWidth: Math.max(240, W), display: 'block', margin: '0 auto' }} role="img" aria-label={`Formule de Lewis de l'ion, ${n} forme${n > 1 ? 's' : ''}`}>
        {Array.from({ length: n }, (_, k) => (
          <g key={k}>
            <FormeLewis def={def} doublee={def.dbl[k]} ox={k * pas} />
            {k < n - 1 && <text x={k * pas + 80 + pas / 2} y={80} fontSize="24" textAnchor="middle" fill="#334155">↔</text>}
          </g>))}
      </svg>
      {legende && <div style={{ fontSize: 12.5, color: '#475569', textAlign: 'center', marginTop: 4 }}>{legende}</div>}
    </div>);
}

export const DESSINS_MECA = { meca: SchemaMeca, profilReac: SchemaProfilReac, lewis: SchemaLewis };
