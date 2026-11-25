// Modèle de la simulation 233 : chaîne énergétique, conservation de l'énergie et rendement d'un convertisseur (TSTL, PCM, Énergie).
// Hypothèses : un convertisseur ne stocke pas d'énergie (reçu = utile + dissipé), l'énergie dissipée est cédée par transfert thermique,
// rendement constant (indépendant de la puissance), valeurs de rendement inventées pour la simulation.
export const arrondiCS = (x, n = 2) => (x === 0 ? 0 : Number(Number(x).toPrecision(n)));
export const dissipee = (Er, Eu) => Er - Eu;               // conservation : Er = Eu + Q
export const rendement = (Eu, Er) => Eu / Er;              // η = énergie utile ÷ énergie reçue (= P utile ÷ P reçue)
export const puissanceUtile = (Pr, eta) => Pr * eta;
export const energieRecue = (Eu, eta) => Eu / eta;         // énergie à fournir pour obtenir Eu
export const rendementSerie = (...etas) => etas.reduce((a, b) => a * b, 1);
export const energieJ = (P, dtS) => P * dtS;

// Appareils de l'exploration : rendements inventés (valeurs pédagogiques, pas des mesures)
export const APPAREILS = [
  { id: 'moteur', nom: 'Moteur de treuil', eta: 0.75, recu: 'énergie électrique', utile: 'travail mécanique (soulève une charge)' },
  { id: 'led', nom: 'Lampe à LED', eta: 0.30, recu: 'énergie électrique', utile: 'rayonnement lumineux' },
  { id: 'plaque', nom: 'Plaque de cuisson', eta: 0.65, recu: 'énergie électrique', utile: 'transfert thermique cédé à la casserole' },
  { id: 'chargeur', nom: 'Chargeur de batterie', eta: 0.80, recu: 'énergie électrique', utile: 'énergie stockée dans la batterie' },
];
export const PUISSANCES = [10, 60, 120, 500];   // W
export const DUREES = [1, 5, 10, 30];            // min

export const PARCOURS = { Er: 800, Eu: 600, Pr: 120, EuAmont: 900, etaCh: 0.80, etaMo: 0.75, Pled: 10, etaLed: 0.30 };

const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi A : rendement d'un convertisseur (puissances reçue et utile données, durée en minutes)
export function tirageDefiA() {
  const Pr = tire([60, 80, 120, 200]), eta = tire([0.4, 0.5, 0.6, 0.75, 0.8]), dtMin = tire([2, 5, 10]);
  const Pu = Pr * eta, Q = (Pr - Pu) * dtMin * 60 / 1000;
  return { type: 'rendement', Pr, Pu, eta, dtMin, Q, pct: 100 * eta };
}
// Défi B : deux convertisseurs en série (rendement global et énergie à fournir)
export function tirageDefiB() {
  let eta1, eta2;
  do { eta1 = tire([0.6, 0.8, 0.9]); eta2 = tire([0.5, 0.7, 0.75, 0.9]); } while (eta1 === eta2);
  const Eu = tire([50, 100, 200, 300]), etaT = eta1 * eta2, Er = Eu / etaT;
  return { type: 'serie', eta1, eta2, Eu, etaT, pctT: 100 * etaT, Er };
}
