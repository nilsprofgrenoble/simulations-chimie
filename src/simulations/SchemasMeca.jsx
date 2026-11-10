import { KIT } from "../commun";
import { Mol2D } from "./MecaVue2D";
import { interp } from "./mecaModele";

// Schémas des exercices « Mécanismes réactionnels » (utilisés par Visuel dans SchemasC1.jsx).
//   meca       : le mécanisme du but-2-ène + HBr à un instant u (0 ; 0,25 ; 0,5 ; 0,62 ; 1) avec ses flèches courbes
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

export const DESSINS_MECA = { meca: SchemaMeca, profilReac: SchemaProfilReac };
