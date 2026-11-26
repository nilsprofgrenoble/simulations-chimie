// Modèle de la simulation 267 « Champ et force électrostatiques entre deux armatures » (TSTL, PCM, partie « Interactions »).
// Champ uniforme entre deux armatures planes parallèles : E = U / d (V/m), dirigé de l'armature + vers l'armature −, perpendiculaire aux armatures.
// Force sur une particule de charge q : F = q E (vectoriel) ; valeur |q| E ; même sens que E si q > 0, sens opposé si q < 0.
export const E_CHARGE = 1.6e-19; // charge élémentaire, en C (valeur arrondie)
export const champ = (U, d) => U / d;                       // d en m
export const force = (q, E) => Math.abs(q) * E;            // q en C
export const sensForce = q => (q > 0 ? 1 : q < 0 ? -1 : 0); // +1 : sens de E ; −1 : sens opposé
export const tension = (E, d) => E * d;
export const CHARGES = [-2, -1, 1, 2];                      // en unités de e
export const PARCOURS = { U: 300, d: 0.030, E: 300 / 0.030, q: E_CHARGE, F: force(E_CHARGE, 300 / 0.030), F2: 4.8e-15, q2: 3.2e-19, d2: 0.020, E2: 4.8e-15 / 3.2e-19, U2: 4.8e-15 / 3.2e-19 * 0.020 };
// Défi 1 : champ entre deux armatures (réponse en kV/m)
export function tirageDefiChamp(rnd = Math.random) {
  const t = a => a[Math.floor(rnd() * a.length)];
  const U = t([60, 120, 150, 200, 240, 300, 400]), dcm = t([1.5, 2.0, 2.5, 3.0, 4.0, 5.0]);
  return { U, dcm, E: champ(U, dcm / 100) / 1e3 };
}
// Défi 2 : force sur une particule (champ puis force, force en 10⁻¹⁵ N)
export function tirageDefiForce(rnd = Math.random) {
  const t = a => a[Math.floor(rnd() * a.length)];
  const U = t([100, 150, 200, 250, 300, 400]), dcm = t([2.0, 2.5, 4.0, 5.0]), n = t([1, 2, 3]), signe = t([1, -1]);
  const E = champ(U, dcm / 100);
  return { U, dcm, n, signe, E: E / 1e3, F: force(n * E_CHARGE, E) * 1e15 };
}
