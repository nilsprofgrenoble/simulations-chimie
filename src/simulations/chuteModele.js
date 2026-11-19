// ====================================================================================================
//  MODÈLE PUR de la simulation 140 (2GT) : chute libre à une dimension, variation du vecteur vitesse et force.
//  Hypothèses : système = point matériel ; seule force = le poids (frottements de l'air négligés) ; g constant sur la hauteur
//  étudiée ; axe vertical orienté vers le haut ; référentiel terrestre (ou lunaire, martien) supposé galiléen.
//  Le vecteur vitesse en M_i est approché par M_(i-1)M_(i+1) / (2τ) : avec g constant, cette approximation est exacte.
//  On n'écrit jamais ΣF = m·a à l'élève : on relie seulement la direction de Δv à celle de ΣF.
// ====================================================================================================
export const GRAV = [['terre', 'la Terre', 9.8], ['lune', 'la Lune', 1.6], ['mars', 'Mars', 3.7]];
export const gDe = id => GRAV.find(a => a[0] === id)[2];
export const N_PTS = 9;
// positions (m), dates (s) et vitesses « exactes » (m/s, algébriques, axe vers le haut)
export function chute({ v0 = 0, g = 9.8, tau = 0.2, N = N_PTS }) {
  const t = [], y = [], v = [];
  for (let i = 0; i < N; i++) { const ti = i * tau; t.push(ti); y.push(v0 * ti - 0.5 * g * ti * ti); v.push(v0 - g * ti); }
  return { t, y, v, tau, N, g, v0 };
}
// vitesse approchée au point i (1 ≤ i ≤ N-2) : M(i-1)M(i+1) / (2τ)
export const vApprox = (d, i) => (d.y[i + 1] - d.y[i - 1]) / (2 * d.tau);
// variation de vitesse entre les points i et i+1 (1 ≤ i ≤ N-3)
export const deltaV = (d, i) => vApprox(d, i + 1) - vApprox(d, i);
// situations du défi « prévoir » : direction de Δv et de ΣF (haut, bas, nul)
export const SITUATIONS = [
  { id: 'lache', txt: 'Une bille est lâchée sans vitesse et tombe (frottements de l’air négligés). Étudiez un instant pendant la chute.', dv: 'bas', f: 'bas', expl: 'Seul le poids agit, vers le bas : la vitesse augmente vers le bas, donc Δv est vers le bas, comme la force.' },
  { id: 'montee', txt: 'Une balle est lancée vers le haut ; elle est en train de monter (frottements négligés). Étudiez un instant de la montée.', dv: 'bas', f: 'bas', expl: 'Seul le poids agit, vers le bas. La balle monte, mais sa vitesse (vers le haut) diminue : Δv est vers le bas.' },
  { id: 'sommet', txt: 'Une balle lancée vers le haut atteint le point le plus haut de sa trajectoire, où sa vitesse est nulle (frottements négligés).', dv: 'bas', f: 'bas', expl: 'Vitesse nulle ne veut pas dire force nulle : le poids agit toujours. Juste après le sommet la balle descend, donc Δv est vers le bas.' },
  { id: 'descente', txt: 'Une balle lancée vers le haut est en train de retomber (frottements négligés). Étudiez un instant de la descente.', dv: 'bas', f: 'bas', expl: 'Seul le poids agit, vers le bas : la vitesse vers le bas augmente, donc Δv est vers le bas.' },
  { id: 'table', txt: 'Un livre est posé immobile sur une table.', dv: 'nul', f: 'nul', expl: 'La vitesse ne varie pas : Δv est nul. Les forces se compensent : le poids (vers le bas) et la force de la table (vers le haut).' },
  { id: 'palet', txt: 'Un palet glisse en ligne droite à vitesse constante sur une table à coussin d’air.', dv: 'nul', f: 'nul', expl: 'La vitesse ne varie pas : Δv est nul, donc la somme des forces est nulle (principe d’inertie).' },
  { id: 'parachute', txt: 'Un parachutiste descend en ligne droite à vitesse constante (sa vitesse limite).', dv: 'nul', f: 'nul', expl: 'La vitesse est constante : Δv est nul. Les frottements de l’air compensent exactement le poids.' },
  { id: 'ascenseur', txt: 'Un ascenseur démarre : il monte et sa vitesse vers le haut augmente.', dv: 'haut', f: 'haut', expl: 'La vitesse vers le haut augmente : Δv est vers le haut. La somme des forces est donc vers le haut : la force du câble est plus grande que le poids.' },
];
