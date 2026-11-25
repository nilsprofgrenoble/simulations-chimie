// Modèle de la simulation 243 : formes d'énergie stockée (cinétique, potentielle, interne) et énergie totale (TSTL, PCM, Énergie).
// Trois situations : chute d'une bille (Ec ↔ Ep, U constante), bloc qui glisse puis s'arrête (Ec → U), eau chauffée au repos (U seule varie, transfert reçu).
// Hypothèses : bille en chute libre sans frottement ; bloc glissant sur un sol horizontal (Ep constante) ; l'énergie interne gagnée ΔU est celle du bloc et du sol ;
// eau sans changement d'état ; g = 9,8 N·kg⁻¹ ; Ep de pesanteur donnée (formule vue dans la séquence suivante) ; valeurs inventées.
export const G = 9.8;
export const SITUATIONS = [
  { id: 'chute', nom: 'Chute d’une bille' },
  { id: 'glisse', nom: 'Bloc qui glisse puis s’arrête' },
  { id: 'chauffe', nom: 'Eau chauffée au repos' },
];
export const ec = (m, v) => 0.5 * m * v * v;
export const vitesse = (m, E) => Math.sqrt(2 * E / m);

// État d'une situation à l'avancement p ∈ [0, 1]. Variations ΔEc, ΔEp, ΔU comptées depuis le début.
export function etat(sit, p, o) {
  if (sit === 'chute') {            // o = { m, H }
    const Et = o.m * G * o.H, Ec = Et * p, Ep = Et * (1 - p);
    return { Ec, Ep, dU: 0, Etot0: Et, recu: 0, v: vitesse(o.m, Ec), h: o.H * (1 - p), dEc: Ec, dEp: Ep - Et };
  }
  if (sit === 'glisse') {           // o = { m, v0 }, p = fraction de la vitesse perdue
    const v = o.v0 * (1 - p), E0 = ec(o.m, o.v0), Ec = ec(o.m, v);
    return { Ec, Ep: 0, dU: E0 - Ec, Etot0: E0, recu: 0, v, dEc: Ec - E0, dEp: 0 };
  }
  const Q = o.Q * p;                // o = { m, Q } : eau, c = 4180
  return { Ec: 0, Ep: 0, dU: Q, Etot0: o.Q, recu: Q, v: 0, dEc: 0, dEp: 0, dT: Q / (o.m * 4180) };
}
export const total = e => e.Ec + e.Ep + e.dU;      // Ec + Ep + ΔU (U comptée depuis le début)
export const PAS = [0, 0.25, 0.5, 0.75, 1];

// Valeurs du parcours guidé
export const PARCOURS = { glisse: { m: 2.0, v0: 3.0, v1: 1.0 }, chute: { m: 0.50, H: 2.0 } };
PARCOURS.Ec0 = ec(PARCOURS.glisse.m, PARCOURS.glisse.v0);                        // 9,0 J
PARCOURS.dUfrot = ec(2.0, 3.0) - ec(2.0, 1.0);                                   // 8,0 J
PARCOURS.Ep0 = PARCOURS.chute.m * G * PARCOURS.chute.H;                           // 9,8 J
PARCOURS.dEpMi = -PARCOURS.Ep0 / 2;                                               // −4,9 J

const tire = t => t[Math.floor(Math.random() * t.length)];
export function tirageDefiA() {   // bloc : Ec initiale, ΔU quand la vitesse passe de v0 à v1
  let m, v0, v1;
  do { m = tire([1, 2, 3, 4]); v0 = tire([3, 4, 5, 6]); v1 = tire([1, 2, 3]); } while (v1 >= v0);
  const Ec0 = ec(m, v0), Ec1 = ec(m, v1);
  return { type: 'glisse', m, v0, v1, Ec0, Ec1, dU: Ec0 - Ec1 };
}
export function tirageDefiB() {   // bille : Ec à un instant et vitesse, d'après Ep initiale et Ep à cet instant
  const m = tire([0.2, 0.5, 1.0, 2.0]), Ep0 = tire([6, 8, 12, 15, 20]);
  const Ep1 = tire([1, 2, 3, 4].filter(x => x < Ep0 - 1));
  const Ec = Ep0 - Ep1;
  return { type: 'chute', m, Ep0, Ep1, Ec, v: vitesse(m, Ec) };
}
