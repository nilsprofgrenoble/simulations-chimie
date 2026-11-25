// Modèle de la simulation 228 « Rendement d'un panneau photovoltaïque : bilan énergétique et facteurs limitants » (TSTL, PCM, Énergie et ondes).
// S'appuie sur le modèle à une diode de la simulation 227 (panneauPvModele.js), sans le modifier.
// Bilan : puissance lumineuse reçue Plum = E × S ; puissance électrique fournie Pel = U × I ; rendement η = Pel ÷ Plum ; pertes = Plum − Pel.
// Hypothèses : 25 °C constante, éclairement uniforme, lumière de spectre proche de celui du Soleil, surface éclairée = surface totale du panneau.
import * as M from './panneauPvModele.js';

export const { PANNEAUX, IDS_PANNEAUX, PANNEAU_PARCOURS, R_LISTE, arrondiCS, surface, point, pointPmax, meilleurSurGrille } = M;

export const surfaceCm2 = p => p.Nc * p.Acell;                       // surface totale en cm²
export const plum = (p, E) => E * surface(p);                         // puissance lumineuse reçue (W) = éclairement (W/m²) × surface (m²)
export const eta = (p, E, R) => point(p, E, R).P / plum(p, E);        // rendement pour une résistance R donnée
export const etaMax = (p, E) => pointPmax(p, E).P / plum(p, E);       // rendement au point de puissance maximale

// valeurs fixes du parcours guidé (panneau de laboratoire)
export const PARCOURS = { E: 1000, Ra: 100, E2: 400, Pel: 5.0, E3: 800, eta: 0.15 };

const choisir = (t, alea) => t[Math.min(t.length - 1, Math.floor(alea() * t.length))];
const NC = [3, 4, 5, 6, 8, 10, 12], ACELL = [3, 5, 6.25, 8, 10, 12.5];
const E_DEFI_A = [300, 400, 500, 600, 700, 800, 900, 1000];

// Défi A : panneau inconnu ; l'élève calcule Plum (données E et surface), cherche Pmax en réglant R, puis calcule η = Pmax ÷ Plum.
export function tirageDefiA(alea = Math.random) {
  for (let k = 0; k < 400; k++) {
    const p = { id: 'inconnu', nom: 'Panneau inconnu', Nc: choisir(NC, alea), Acell: choisir(ACELL, alea) }, E = choisir(E_DEFI_A, alea);
    const m = pointPmax(p, E), g = meilleurSurGrille(p, E);
    if (g.P / m.P < 0.96 || Math.abs(g.U / m.U - 1) > 0.08) continue;  // l'élève doit pouvoir réussir avec les résistances proposées
    const S = surfaceCm2(p), Pl = E * S / 1e4;
    return { type: 'eta', p, E, S, Plum: Pl, Pmax: m.P, Upm: m.U, Ipm: m.I, Rpm: m.U / m.I, eta: 100 * m.P / Pl };
  }
  throw new Error('tirage défi A impossible');
}

// Défi B : dimensionner une installation. Données : puissance électrique voulue, éclairement, rendement ; l'élève trouve Plum puis S (en cm²).
export function tirageDefiB(alea = Math.random) {
  const Pel = choisir([1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0], alea), E = choisir([600, 700, 800, 900, 1000], alea), etaPct = choisir([12, 14, 15, 16, 18], alea);
  const Pl = arrondiCS(Pel / (etaPct / 100), 12), S = arrondiCS(Pl / E * 1e4, 12);
  return { type: 'dimension', Pel, E, etaPct, Plum: Pl, S };
}
