// Vue 2D (formule développée) de la simulation « Mécanismes réactionnels ». Dessin SVG piloté par la coordonnée de réaction u.
import { atomes2D, doublets2D, fleches2D, phases, seg, VACANCE2D, U_FLECHES } from "./mecaModele";

const NOIR = '#0f172a', ROUGE = '#dc2626', BLEU = '#1d4ed8', VERT = '#15803d', VIOLET = '#7c3aed';
const R_LABEL = 9;   // rayon d'un symbole : la liaison s'arrête avant

// Raccourcit un segment aux extrémités qui portent un symbole
function coupe(p, q, rp, rq) {
  const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1;
  return [p[0] + dx / d * rp, p[1] + dy / d * rp, q[0] - dx / d * rq, q[1] - dy / d * rq];
}

function Liaison({ p, q, rp = 0, rq = 0, op = 1, tirets = false, w = 2.2, col = NOIR }) {
  if (op <= 0.01) return null;
  const [x1, y1, x2, y2] = coupe(p, q, rp, rq);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={w} strokeLinecap="round" opacity={op} strokeDasharray={tirets ? '4 4' : undefined} />;
}

// Liaison stéréo : coin plein (devant le plan) ou traits fins (derrière le plan). Sommet côté carbone.
function Stereo({ p, q, rq, devant, op = 1 }) {
  const [x1, y1, x2, y2] = coupe(p, q, 0, rq);
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, lg = 5.5;
  if (devant) return <polygon points={`${x1},${y1} ${x2 + nx * lg},${y2 + ny * lg} ${x2 - nx * lg},${y2 - ny * lg}`} fill={NOIR} opacity={op} />;
  const traits = [];
  for (let i = 1; i <= 6; i++) {
    const t = i / 6, cx = x1 + dx * t, cy = y1 + dy * t, h = lg * t;
    traits.push(<line key={i} x1={cx + nx * h} y1={cy + ny * h} x2={cx - nx * h} y2={cy - ny * h} stroke={NOIR} strokeWidth={1.8} />);
  }
  return <g opacity={op}>{traits}</g>;
}

function Symbole({ pos, texte, couleur = NOIR, taille = 17, fond = true }) {
  return (<g>
    {fond && <circle cx={pos[0]} cy={pos[1]} r={R_LABEL + 1} fill="white" />}
    <text x={pos[0]} y={pos[1] + taille * 0.35} fontSize={taille} fontWeight="700" textAnchor="middle" fill={couleur}>{texte}</text>
  </g>);
}

// Flèche courbe : part du milieu d'un doublet (ou d'une liaison) et pointe vers sa destination
function FlecheCourbe({ de, vers, courbe = 1, couleur = ROUGE, id }) {
  const dx = vers[0] - de[0], dy = vers[1] - de[1], d = Math.hypot(dx, dy) || 1;
  const cx = (de[0] + vers[0]) / 2 - dy / d * 0.4 * d * courbe, cy = (de[1] + vers[1]) / 2 + dx / d * 0.4 * d * courbe;
  const tx = vers[0] - cx, ty = vers[1] - cy, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
  const a = 7, b = 3.5;
  const pts = `${vers[0]},${vers[1]} ${vers[0] - ux * a - uy * b},${vers[1] - uy * a + ux * b} ${vers[0] - ux * a + uy * b},${vers[1] - uy * a - ux * b}`;
  return (<g key={id}>
    <path d={`M${de[0]},${de[1]} Q${cx},${cy} ${vers[0] - ux * 3},${vers[1] - uy * 3}`} fill="none" stroke={couleur} strokeWidth={2.2} strokeLinecap="round" />
    <polygon points={pts} fill={couleur} />
  </g>);
}

// u : coordonnée de réaction. face : +1 le Br arrive devant le plan (coin plein), −1 derrière (traits).
// avecFleches : affiche les flèches courbes au voisinage d'un jalon. petit : version réduite sans annotations.
export function Mol2D({ u, face = 1, avecFleches = true, petit = false, titre }) {
  const a = atomes2D(u), ph = phases(u), dbl = doublets2D(u, a);
  const uF = U_FLECHES.find(k => Math.abs(k - u) < 0.04);
  const fl = avecFleches && !petit && uF !== undefined ? fleches2D(uF) : [];
  const piOp = 1 - seg(u, 0.25, 0.5);
  const piDecal = 4.2;
  // seconde ligne de la double liaison C2=C3 (liaison π), décalée perpendiculairement
  const dx = a.C3[0] - a.C2[0], dy = a.C3[1] - a.C2[1], dd = Math.hypot(dx, dy), nx = -dy / dd * piDecal, ny = dx / dd * piDecal;
  const brLibre = u >= 0.5 && u < 0.85;    // Br⁻ visible comme ion avec ses 4 doublets
  const diag = ((dbl[0].ang + 45) * Math.PI) / 180;
  const stereoOp = ph.stereo;
  const H2devant = face < 0;                // H2 passe de l'autre côté du plan que Br
  const prod = u > 0.88;
  return (
    <svg viewBox={petit ? "-110 -100 270 200" : "-125 -105 300 285"} role="img" aria-label={titre || 'Mécanisme réactionnel en 2D'} style={{ width: '100%', maxWidth: petit ? 230 : 560, height: 'auto', display: 'block', background: '#fbfdff', borderRadius: 12 }}>
      {/* squelette */}
      <Liaison p={a.C1} q={a.C2} rp={R_LABEL + 6} />
      <Liaison p={a.C2} q={a.C3} />
      {piOp > 0.02 && <line x1={a.C2[0] + nx} y1={a.C2[1] + ny} x2={a.C3[0] + nx} y2={a.C3[1] + ny} stroke={VIOLET} strokeWidth={2.2} opacity={piOp} strokeLinecap="round" />}
      <Liaison p={a.C3} q={a.C4} rq={R_LABEL + 6} />
      <Liaison p={a.C3} q={a.H3} rq={R_LABEL} />
      {/* H lié à C2 : simple, puis stéréo à la fin */}
      {!prod && <Liaison p={a.C2} q={a.H2} rq={R_LABEL} />}
      {prod && <Stereo p={a.C2} q={a.H2} rq={R_LABEL} devant={H2devant} op={stereoOp} />}
      {prod && stereoOp < 1 && <Liaison p={a.C2} q={a.H2} rq={R_LABEL} op={1 - stereoOp} />}
      {/* liaisons qui se défont / se forment */}
      <Liaison p={a.Ht} q={a.Br} rp={R_LABEL} rq={R_LABEL + 1} op={1 - ph.hbrCassee} tirets={ph.hbrAmorce > 0.02} />
      <Liaison p={a.Ht} q={a.C3} rp={R_LABEL} op={Math.max(ph.htFormee, ph.htLiaison * 0.7)} tirets={ph.htFormee < 0.98} col={ph.htFormee < 0.98 ? VERT : NOIR} />
      {ph.brApproche > 0.02 && ph.brFormee < 0.98 && <Liaison p={a.C2} q={a.Br} rq={R_LABEL + 1} op={ph.brApproche} tirets col={VERT} />}
      {ph.brFormee >= 0.98 && !prod && <Liaison p={a.C2} q={a.Br} rq={R_LABEL + 1} />}
      {prod && <Stereo p={a.C2} q={a.Br} rq={R_LABEL + 2} devant={face > 0} op={stereoOp} />}
      {prod && stereoOp < 1 && <Liaison p={a.C2} q={a.Br} rq={R_LABEL + 2} op={1 - stereoOp} />}
      {/* lacune électronique du carbocation (carré codé) */}
      {ph.lacune > 0.02 && <rect x={VACANCE2D[0] - 7} y={VACANCE2D[1] - 7} width={14} height={14} fill="white" stroke={BLEU} strokeWidth={2} strokeDasharray="3 2" opacity={ph.lacune} />}
      {/* doublets non liants de Br : un trait par doublet */}
      {dbl.map(d => {
        const r = (R_LABEL + 6) * 1, ca = Math.cos(d.ang * Math.PI / 180), sa = Math.sin(d.ang * Math.PI / 180);
        if (d.op < 0.02) return null;
        const cx = a.Br[0] + ca * r, cy = a.Br[1] + sa * r, tx = -sa * 5, ty = ca * 5;
        const pl = d.k === 0 && (u >= 0.5 && u < 0.95);
        return <line key={d.k} x1={cx - tx} y1={cy - ty} x2={cx + tx} y2={cy + ty} stroke={pl ? ROUGE : NOIR} strokeWidth={3.2} strokeLinecap="round" opacity={d.op} />;
      })}
      {/* symboles */}
      <text x={a.C1[0]} y={a.C1[1] + 6} fontSize="17" fontWeight="700" textAnchor="middle" fill={NOIR}>CH<tspan fontSize="11" dy="4">3</tspan></text>
      <text x={a.C4[0]} y={a.C4[1] + 6} fontSize="17" fontWeight="700" textAnchor="middle" fill={NOIR}>CH<tspan fontSize="11" dy="4">3</tspan></text>
      <Symbole pos={a.H3} texte="H" />
      <Symbole pos={a.H2} texte="H" />
      <Symbole pos={a.Ht} texte="H" couleur={u < 0.5 ? VERT : NOIR} />
      <Symbole pos={a.Br} texte="Br" couleur="#9a3412" taille={16} />
      {/* charges et polarité */}
      {ph.charge > 0.05 && <>
        <g opacity={ph.charge}><circle cx={a.C2[0]} cy={a.C2[1] - 22} r={7} fill="white" stroke={BLEU} strokeWidth={1.6} /><text x={a.C2[0]} y={a.C2[1] - 18.5} fontSize="12" fontWeight="700" textAnchor="middle" fill={BLEU}>+</text></g>
        {brLibre && <g opacity={ph.charge}><circle cx={a.Br[0] + Math.cos(diag) * 30} cy={a.Br[1] + Math.sin(diag) * 30} r={7} fill="white" stroke={ROUGE} strokeWidth={1.6} /><text x={a.Br[0] + Math.cos(diag) * 30} y={a.Br[1] + Math.sin(diag) * 30 + 3.5} fontSize="13" fontWeight="700" textAnchor="middle" fill={ROUGE}>−</text></g>}
      </>}
      {ph.polarite > 0.05 && <g opacity={ph.polarite} fontSize="13" fontWeight="700">
        <text x={a.Ht[0] + 16} y={a.Ht[1] + 5} fill={BLEU}>δ+</text>
        <text x={a.Br[0] + 16} y={a.Br[1] + 26} fill={ROUGE}>δ−</text>
      </g>}
      {/* flèches courbes */}
      {fl.map(f => <FlecheCourbe key={f.id} {...f} couleur={f.id === 'Br-vers-C' ? ROUGE : '#b91c1c'} />)}
    </svg>
  );
}
