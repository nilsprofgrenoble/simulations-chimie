// Modèle de la simulation 231 : batterie (accumulateur), quantité d'électricité, énergie disponible, durée de fonctionnement (TSTL, PCM, Énergie).
// Hypothèses : tension constante pendant la décharge, capacité indépendante de l'intensité, décharge complète possible, température constante.
export const S_PAR_H = 3600;          // 1 Ah = 3 600 C et 1 Wh = 3 600 J
export const arrondiCS = (x, n = 2) => (x === 0 ? 0 : Number(Number(x).toPrecision(n)));
export const chargeC = (I, dtS) => I * dtS;                    // Q = I × Δt (A, s -> C)
export const ahEnC = ah => ah * S_PAR_H;
export const whEnJ = wh => wh * S_PAR_H;
export const energieWh = (U, QsAh) => U * QsAh;                // E = Qs × U (V, Ah -> Wh)
export const energieJ = (U, QsAh) => whEnJ(energieWh(U, QsAh));
export const intensite = (P, U) => P / U;                      // I = P ÷ U
export const dureeH = (QsAh, I) => QsAh / I;                   // Δt = Qs ÷ I (Ah, A -> h)
export const dureeEnergieH = (EWh, P) => EWh / P;              // Δt = E ÷ P
export const chargeRestanteAh = (QsAh, I, tH) => Math.max(0, QsAh - I * tH);
export const capaciteMinAh = (P, tH, U) => P * tH / U;         // Qs min = P × Δt ÷ U

export const PARCOURS = { U: 12, Qs: 7.0, P: 10, I0: 0.5, dt0: 20, I1: 0.5, B: { U: 3.7, Qs: 10 } };
export const BATTERIES = [                                      // valeurs inventées pour la simulation
  { id: 0, nom: 'Accumulateur 12 V, 7,0 Ah', U: 12, Qs: 7.0 },
  { id: 1, nom: 'Accumulateur 6 V, 4,5 Ah', U: 6, Qs: 4.5 },
  { id: 2, nom: 'Accumulateur lithium-ion 3,7 V, 10 Ah', U: 3.7, Qs: 10 },
  { id: 3, nom: 'Pile alcaline 1,5 V, 2,5 Ah', U: 1.5, Qs: 2.5 },
  { id: 4, nom: 'Accumulateur 12 V, 2,0 Ah', U: 12, Qs: 2.0 },
];
export const PUISSANCES_W = [1, 3, 10, 25, 60];

const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi A : durée de fonctionnement d'une batterie alimentant un récepteur.
export function tirageDefiA() {
  const U = tire([6, 12]), Qs = tire([2.5, 4.0, 5.0, 7.0, 8.0]), P = tire([5, 10, 15, 20, 30]);
  const I = P / U, dt = Qs * U / P;
  return { type: 'duree', U, Qs, P, I, dt };
}
// Défi B : batterie à choisir pour tenir une durée donnée.
export function tirageDefiB() {
  const U = tire([6, 12]), P = tire([8, 12, 20, 30]), t = tire([4, 6, 8, 10]);
  return { type: 'choix', U, P, t, E: P * t, Qs: P * t / U };
}
