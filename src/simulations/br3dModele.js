// Modèle PUR de la vue 3D de l'addition de Br₂ sur un alcène (but-2-ène Z ou E, cyclohexène) : ion bromonium, addition anti.
// Aucune dépendance à React ni à three.js : testé par br3dModele.test.mjs. Pas de calcul d'énergie : géométrie schématique, mais la stéréochimie
// (configurations R/S du produit) est LUE sur la géométrie par le produit mixte, comme dans chiraliteModele.js.
// Repère : l'alcène est dans le plan horizontal (x, z) ; la face « dessus » est du côté y > 0. C2 est en x < 0, C3 en x > 0.
export const seg = (u, a, b) => { const t = Math.min(1, Math.max(0, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
const DX = 0.8, L = 1.5;
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const unit = v => { const n = Math.hypot(...v); return v.map(t => t / n); };
const sub = (a, b) => a.map((t, i) => t - b[i]);

// Côté (z = ±1) du groupe carboné R sur C2 et C3 : Z et cyclohexène (cycle cis) : même côté ; E : côtés opposés
export const coteR = alc => (alc === 'E' ? [1, -1] : [1, 1]);

// Carbone qui reçoit Br⁻ : on choisit celui qui donne l'énantiomère annoncé par la simulation pour la face « dessus » (R,R), « dessous » (S,S) ;
// pour le but-2-ène E, les deux choix donnent le même composé méso.
export function carboneAttaque(alc, face) {
  if (alc === 'E') return 'C3';
  const voulu = face === 'dessus' ? 'R' : 'S';
  for (const c of ['C3', 'C2']) { const e = etat(alc, face, 1, false, c); if (e.lettres[0] === voulu && e.lettres[1] === voulu) return c; }
  return 'C3';
}

// État à l'avancement u ∈ [0, 1] (syn = Br⁻ attaque la face du pont : impossible, il s'approche puis s'écarte)
export function etat(alc, face, u, syn = false, ca = null) {
  const s = face === 'dessus' ? 1 : -1;
  const attaque = ca || carboneAttaque(alc, face);
  const iA = attaque === 'C2' ? 0 : 1, iB = 1 - iA;
  const cx = [-DX, DX], cote = coteR(alc);
  const pont = seg(u, 0.35, 0.55), f = syn ? 0 : seg(u, 0.6, 0.95);
  const tilt = [0, 0]; tilt[iB] = -s * (0.25 * pont + 0.45 * f); tilt[iA] = -s * 0.25 * pont * (1 - f) + s * 0.7 * f;
  const carbones = [0, 1].map(i => [cx[i], 0, 0]);
  const dirs = [0, 1].map(i => {
    const sx = i === 0 ? -1 : 1;
    return { R: unit([0.5 * sx, tilt[i], 0.866 * cote[i]]), H: unit([0.5 * sx, tilt[i], -0.866 * cote[i]]) };
  });
  const groupes = [0, 1].map(i => ({ R: [0, 1, 2].map(k => carbones[i][k] + L * dirs[i].R[k]), H: [0, 1, 2].map(k => carbones[i][k] + 1.0 * dirs[i].H[k]) }));
  // dibrome puis ion bromonium puis produit
  const brn0 = [0, s * 1.45, 0];
  const brnFin = [cx[iB], s * 1.75, 0];
  const approche = 1 - seg(u, 0.05, 0.35);
  let brn = u < 0.35 ? [0, s * (1.45 + 3.2 * approche), 0] : brn0.map((t, k) => t + (brnFin[k] - t) * f);
  let brf;
  if (u < 0.35) brf = [brn[0], brn[1] + s * 1.7, 0];
  else { const d = seg(u, 0.35, 0.7); brf = [brn0[0] + 3.4 * (iB === 1 ? 1 : -1) * d, s * (1.45 + 1.7 + 0.2 * d), 0]; }
  const haut = s * 4.9 - 2.2 * s * seg(u, 0.55, 0.8) + (syn ? 2.2 * s * seg(u, 0.85, 1) : 0);
  const brm = u < 0.5 ? null : syn ? [cx[iA], haut, 0] : [cx[iA], -s * (1.75 + 3.2 * (1 - seg(u, 0.55, 0.95))), 0];
  const opPont = [pont, pont];                                  // liaisons du pont avec C2 et C3
  opPont[iA] = pont * (1 - f); opPont[iB] = pont * (1 - f) + f;
  const opBrm = u < 0.5 ? 0 : syn ? 0.15 : seg(u, 0.75, 0.95);
  // lettres R/S (si le produit est formé : u = 1, anti)
  let lettres = [null, null];
  if (!syn && u >= 0.999) {
    lettres = [0, 1].map(i => {
      const brDir = unit(sub(i === iB ? brn : brm, carbones[i]));
      const autre = unit(sub(carbones[1 - i], carbones[i]));
      const r = unit(sub(groupes[i].R, carbones[i]));
      return dot(brDir, cross(autre, r)) < 0 ? 'R' : 'S';
    });
  }
  return { carbones, groupes, brn, brf, brm, opPont, opBrm, brnLie: f > 0.5, attaque, lettres, pont, f };
}
