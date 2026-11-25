// Modèle de la simulation 238 : conservation de l'énergie, bilan et signe (valeur algébrique) des transferts d'énergie (TSTL, PCM, Énergie).
// Situation : une batterie alimente une résistance chauffante noyée dans un bloc de cuivre ; le bloc cède de la chaleur à l'air de la pièce.
// Hypothèses : on ne considère que le travail électrique W reçu par le bloc et le transfert thermique Q cédé à l'air ;
// pas de changement d'état ; bloc de masse m et de capacité thermique massique c constantes ; ΔU = m·c·ΔT (relation donnée) ; valeurs inventées.
export const arrondiCS = (x, n = 2) => (x === 0 ? 0 : Number(Number(x).toPrecision(n)));
export const MASSE = 0.50, CAPA = 385;           // bloc de cuivre : kg, J·kg⁻¹·K⁻¹
export const SYSTEMES = [
  { id: 'batterie', nom: 'la batterie', stocke: 'énergie chimique' },
  { id: 'bloc', nom: 'le bloc de cuivre', stocke: 'énergie interne thermique' },
  { id: 'air', nom: 'l’air de la pièce', stocke: 'énergie interne thermique' },
];
export const W_VALEURS = [200, 500, 800, 1200];    // travail électrique cédé par la batterie (J)
export const F_VALEURS = [0, 0.25, 0.5, 0.75, 1];  // part de W cédée à l'air par transfert thermique

// Transferts algébriques subis par un système : { nom, type: 'W' | 'Q', val } (reçu > 0, cédé < 0)
export function transferts(sys, W, f) {
  const Q = f * W;
  if (sys === 'batterie') return [{ nom: 'travail électrique cédé au bloc', type: 'W', val: -W }];
  if (sys === 'bloc') return [{ nom: 'travail électrique reçu de la batterie', type: 'W', val: W }, { nom: 'transfert thermique cédé à l’air', type: 'Q', val: -Q }];
  return [{ nom: 'transfert thermique reçu du bloc', type: 'Q', val: Q }];
}
export const somme = (sys, W, f) => transferts(sys, W, f).reduce((s, t) => s + t.val, 0);   // = variation de l'énergie stockée par le système
export const deltaT = (dU, m = MASSE, c = CAPA) => dU / (m * c);                              // ΔU = m c ΔT
export const sens = v => (Math.abs(v) < 1e-9 ? 'constante' : v > 0 ? 'augmente' : 'diminue');
export const puissance = (E, dt) => Math.abs(E) / dt;

export const PARCOURS = { W: 800, Q: 300, dt: 40 };   // J, J, s
PARCOURS.dU = PARCOURS.W - PARCOURS.Q;                  // 500 J
PARCOURS.dT = deltaT(PARCOURS.dU);                      // ≈ 2,6 K

const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi A : bilan du bloc (W reçu, Q cédé) -> ΔU (J) et ΔT (K)
export function tirageDefiA() {
  const W = tire([400, 600, 900, 1200]), Q = tire([100, 200, 300]), m = tire([0.40, 0.50, 0.80]), c = 385;
  const dU = W - Q, dT = dU / (m * c);
  return { type: 'bloc', W, Q, m, c, dU, dT };
}
// Défi B : changer de système (l'air de la pièce) : somme des transferts algébriques (J), signe, puissance (W)
export function tirageDefiB() {
  const Q = tire([150, 240, 360, 450]), dt = tire([30, 60, 90, 120]);
  return { type: 'air', Q, dt, somme: Q, P: Q / dt };
}
