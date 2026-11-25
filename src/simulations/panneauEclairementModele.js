// Modèle de la simulation 229 « Éclairement et distance à la source » (TSTL, PCM, Énergie et ondes).
// Source lumineuse ponctuelle qui émet un flux énergétique Φ (en W) de façon uniforme dans toutes les directions ;
// à la distance d, la lumière est répartie sur une sphère de surface 4πd² : éclairement E = Φ ÷ (4πd²) (en W/m²).
// Un panneau de surface S, placé face à la source, reçoit Plum = E × S ; il en convertit la part η (rendement donné).
// Hypothèses : source ponctuelle et isotrope, milieu transparent (pas d'absorption par l'air), panneau perpendiculaire aux rayons,
// distance grande devant les dimensions de la source et du panneau (pas de lumière parasite réfléchie).

export const arrondiCS = (x, n = 3) => (x === 0 || !isFinite(x) ? x : Number(Number(x).toPrecision(n)));

export const surfaceSphere = d => 4 * Math.PI * d * d;                  // d en m, résultat en m²
export const eclairement = (phi, d) => phi / surfaceSphere(d);          // W/m²
export const flux = (E, d) => E * surfaceSphere(d);                     // flux émis déduit d'un éclairement mesuré à la distance d
export const distancePour = (phi, E) => Math.sqrt(phi / (4 * Math.PI * E));
export const plumRecue = (phi, d, S) => eclairement(phi, d) * S;        // S en m²
export const partRecue = (phi, d, S) => plumRecue(phi, d, S) / phi;     // part du flux émis qui atteint le panneau (sans unité)

// valeurs fixes du parcours guidé
export const PARCOURS = { phi: 300, d1: 0.5, d2: 1.0, d3: 0.25, dPan: 0.4, Scm2: 37.5, eta: 0.15, Ecible: 500 };
export const D_MIN = 0.2, D_MAX = 1.5;                                  // distances réglables (m)
export const FLUX_LISTE = [100, 200, 300, 500];
export const SURFACES_CM2 = [9, 37.5, 100];
export const ETA_EXPLO = 0.15;

const choisir = (t, alea) => t[Math.min(t.length - 1, Math.floor(alea() * t.length))];

// Défi A : source inconnue. L'élève lit l'éclairement à plusieurs distances (affichage à 3 chiffres significatifs), en déduit Φ = E × 4πd²,
// puis prévoit l'éclairement à une distance donnée.
export const D_LISTE_CM = [20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150];
export function tirageDefiA(alea = Math.random) {
  const phi = choisir([120, 150, 180, 240, 280, 350, 420, 480, 560, 640], alea);
  for (let k = 0; k < 400; k++) {
    const d3 = choisir(D_LISTE_CM, alea) / 100;
    if (d3 < 0.3) continue;                                              // distance à prévoir : pas la plus proche, pour que la prévision reste un calcul
    return { type: 'source', phi, d3, E3: eclairement(phi, d3) };
  }
  throw new Error('tirage défi A impossible');
}

// Défi B : placer un panneau. Données : flux de la lampe, surface et rendement du panneau, puissance électrique voulue (2 chiffres significatifs).
// L'élève trouve l'éclairement nécessaire E = Pél ÷ (η × S), puis la distance d = √(Φ ÷ (4πE)), en cm.
export function tirageDefiB(alea = Math.random) {
  for (let k = 0; k < 800; k++) {
    const phi = choisir([200, 300, 400, 500], alea), Scm2 = choisir([25, 37.5, 50, 75], alea), etaPct = choisir([12, 14, 15, 16, 18], alea);
    const Ecand = choisir([100, 150, 200, 250, 300, 400, 500, 600], alea);
    const Pel = arrondiCS(etaPct / 100 * Scm2 / 1e4 * Ecand, 2);       // donnée affichée : 2 chiffres significatifs
    const E = Pel / (etaPct / 100 * Scm2 / 1e4), d = distancePour(phi, E);
    if (d < 0.2 || d > 1.2 || E < 80) continue;                          // distance réaliste, grande devant la taille du panneau
    return { type: 'placer', phi, Scm2, etaPct, Pel, E, d, dCm: d * 100 };
  }
  throw new Error('tirage défi B impossible');
}
