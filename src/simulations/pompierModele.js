// Modèle du jeu « Pompiers : de la lance à la pression » (transport des fluides, TSTL).
// Scénario : un camion-pompe refoule l'eau (pression P_pompe fixée) dans des tuyaux de diamètre DN et de longueur choisis ; au bout, la lance
// doit travailler dans une plage de pression, avoir assez de débit pour absorber la puissance du feu et être assez près pour que le jet atteigne le foyer.
//
// Hypothèses (rappelées dans le jeu) — mêmes lois que la simulation « Circuits hydrauliques » du site :
//  • eau (ρ = 1000 kg·m⁻³, μ = 1,0 × 10⁻³ Pa·s), incompressible, écoulement permanent ;
//  • pertes linéiques ΔP = λ·(L/D)·½ρv² avec λ = 64/Re (laminaire) ou 0,316·Re⁻⁰·²⁵ (Blasius, turbulent) ; coudes K = 0,9 ;
//  • théorème de Bernoulli entre la sortie de pompe et l'entrée de la lance : P_pompe = P_lance + ρ·g·z + ΔP_charge (même diamètre : même vitesse) ;
//  • lance à section réglable : Bernoulli entre l'entrée de la lance et la sortie (pression atmosphérique) : ½ρv_j² = P_lance + ½ρv² ;
//  • jet : seule la fraction FACTEUR_AIR de l'énergie cinétique du jet sert à atteindre le foyer (frottement de l'air, dispersion en gouttes) ;
//    à l'angle optimal, le foyer à (dx ; Δh) est atteint si FACTEUR_AIR·v_j² ≥ g·(Δh + √(dx² + Δh²)) ;
//  • feu : l'eau absorbe Q·(c·Δθ + L_v) ; seule la fraction ABSORPTION de cette énergie refroidit réellement le foyer (le reste ruisselle ou s'évapore ailleurs).

export const RHO = 1000, G = 9.81, MU = 1.0e-3;
export const K_COUDE = 0.9;
export const LONG_TUYAU = 20;                    // m : longueur d'un tuyau d'incendie
export const DIAMETRES = [45, 70, 110];          // mm : DN 45, DN 70, DN 110
export const N_MAX = 8;                          // nombre maximal de tuyaux mis bout à bout
export const DEBIT_MIN = 100, DEBIT_MAX = 1000, DEBIT_PAS = 50;   // L/min
export const FACTEUR_AIR = 0.25;
export const CHALEUR_MASSIQUE = 4180, ECART_T = 80, CHALEUR_LATENTE = 2.26e6;   // J·kg⁻¹·K⁻¹, K (20 → 100 °C), J·kg⁻¹
export const ABSORPTION = 0.25;
export const DIST_SECU = 8;                      // m : distance minimale lance-foyer (rayonnement)
export const BAR = 1e5;

// Énergie réellement utile par litre d'eau (J·L⁻¹) et débit minimal pour un feu de puissance P (MW)
export const energieUtileParLitre = () => ABSORPTION * RHO * 1e-3 * (CHALEUR_MASSIQUE * ECART_T + CHALEUR_LATENTE);
export const debitMini = puissanceMW => Math.ceil((puissanceMW * 1e6 / energieUtileParLitre()) * 60);   // L/min (arrondi au supérieur)

// Partie hydraulique : tuyau de diamètre dMm, nTuyaux tuyaux de 20 m, débit qLmin, `coudes` coudes à 90°, lance à zLance m au-dessus du camion
export function hydraulique({ dMm, nTuyaux, qLmin, pPompeBar, coudes = 0, zLance = 0 }) {
  const Q = qLmin / 1000 / 60;                       // m³/s
  const D = dMm / 1000, S = Math.PI * D * D / 4, v = Q / S;
  const Re = RHO * v * D / MU;
  const lambda = Re <= 0 ? 0 : (Re < 2000 ? 64 / Re : 0.316 * Math.pow(Re, -0.25));
  const regime = Re < 2000 ? 'laminaire' : (Re < 4000 ? 'transitoire' : 'turbulent');
  const qdyn = 0.5 * RHO * v * v;                    // Pa
  const L = nTuyaux * LONG_TUYAU;
  const dpLin = lambda * (L / D) * qdyn;
  const dpSing = coudes * K_COUDE * qdyn;
  const dpGrav = RHO * G * zLance;
  const dpCharge = dpLin + dpSing;
  const pPompe = pPompeBar * BAR;
  const pLance = pPompe - dpGrav - dpCharge;         // Pa (pression relative à l'entrée de la lance)
  const vJet = pLance > 0 ? Math.sqrt(2 * pLance / RHO + v * v) : 0;
  const dJet = vJet > 0 ? Math.sqrt(4 * Q / (Math.PI * vJet)) * 1000 : 0;   // mm
  return { Q, D, S, v, Re, lambda, regime, qdyn, L, dpLin, dpSing, dpGrav, dpCharge, pPompe, pLance, pLanceBar: pLance / BAR, vJet, dJet };
}

// Une attaque = hydraulique + position de la lance + verdict sur la mission m
export function attaque(m, reg) {
  const h = hydraulique({ ...reg, pPompeBar: m.pPompe, coudes: m.coudes, zLance: m.zLance });
  const xLance = h.L - m.zLance;                     // le tuyau monte d'abord à la hauteur de la lance : une partie de sa longueur sert à la hauteur
  const dx = m.distFeu - xLance;                     // distance horizontale lance-foyer
  const dh = m.hFeu - m.zLance;                      // dénivelé lance-foyer
  const requis = dx > 0 ? G * (dh + Math.hypot(dx, dh)) : 0;           // m²·s⁻² : v_j² × FACTEUR_AIR minimal
  const utile = FACTEUR_AIR * h.vJet * h.vJet;
  const qMin = debitMini(m.puissanceMW);
  const ok = {
    securite: dx >= DIST_SECU,
    pressionHaute: h.pLanceBar <= m.pMax + 1e-9,
    pressionBasse: h.pLanceBar >= m.pMin - 1e-9,
    portee: dx < 0 ? false : utile + 1e-9 >= requis,
    debit: reg.qLmin >= qMin,
  };
  let verdict = 'ok';
  if (!ok.securite) verdict = 'brule';
  else if (!ok.pressionHaute) verdict = 'haute';
  else if (!ok.pressionBasse) verdict = 'basse';
  else if (!ok.portee) verdict = 'court';
  else if (!ok.debit) verdict = 'debit';
  // portée utile maximale à la même hauteur (pour l'affichage) : dx tel que FACTEUR_AIR·v_j² = g·(dh + √(dx² + dh²))
  const r = Math.max(0, utile / G - dh), porteeMax = r * r - dh * dh > 0 ? Math.sqrt(r * r - dh * dh) : 0;
  return { ...h, xLance, dx, dh, qMin, requis, utile, porteeMax, ok, verdict, reussi: verdict === 'ok' };
}

// Missions (pPompe en bar ; plage de pression à la lance [pMin ; pMax] en bar ; foyer à distFeu m du camion et hFeu m au-dessus ; puissance du feu en MW)
export const MISSIONS = [
  { id: 1, nom: 'Poubelle en feu', icone: '🗑️', temps: 'Jour', pPompe: 8, pMin: 5, pMax: 8, distFeu: 45, hFeu: 0, zLance: 0, coudes: 0, puissanceMW: 1.2,
    histoire: "Une benne à ordures brûle au bout de la rue. Déroule les tuyaux et règle la lance : ni trop mou, ni trop violent.",
    retenir: "La pompe fournit une pression ; une partie est perdue dans le tuyau. Plus de longueur, ou un diamètre plus petit, et la pression à la lance baisse." },
  { id: 2, nom: 'Voiture dans le virage', icone: '🚗', temps: 'Soir', pPompe: 8, pMin: 5, pMax: 8, distFeu: 60, hFeu: 0, zLance: 0, coudes: 2, puissanceMW: 2.5,
    histoire: "Une voiture brûle derrière deux virages. Chaque coude du tuyau coûte de la pression : compte-les.",
    retenir: "Les pertes de charge dépendent de la vitesse : ΔP = (λ·L/D + n·K) × ½ρv². Les coudes ajoutent des pertes singulières." },
  { id: 3, nom: 'Entrepôt', icone: '🏭', temps: 'Nuit', pPompe: 9, pMin: 5, pMax: 8, distFeu: 90, hFeu: 0, zLance: 0, coudes: 2, puissanceMW: 4.5,
    histoire: "Un entrepôt de palettes flambe : il faut beaucoup d'eau, et le foyer est loin. Attention : un tuyau trop large ne perd presque rien et la lance devient incontrôlable.",
    retenir: "Il faut un compromis : un tuyau très large perd très peu (pression à la lance trop forte), un tuyau très étroit perd trop (jet mou). Diamètre, longueur et débit se règlent ensemble." },
  { id: 4, nom: 'Foyer au 4ᵉ étage', icone: '🏢', temps: 'Nuit', pPompe: 8, pMin: 6, pMax: 9, distFeu: 50, hFeu: 12, zLance: 0, coudes: 0, puissanceMW: 3,
    histoire: "Les flammes sortent par une fenêtre, 12 m au-dessus de la rue. Le jet doit monter : il lui faut de la vitesse, donc de la pression à la lance.",
    retenir: "Au bout de la lance, ½ρv_j² = P_lance : plus la pression est grande, plus le jet est rapide, donc plus il monte et porte loin." },
  { id: 5, nom: "Grande échelle", icone: '🪜', temps: 'Aube', pPompe: 10, pMin: 5, pMax: 8, distFeu: 45, hFeu: 22, zLance: 18, coudes: 1, puissanceMW: 6,
    histoire: "La lance est montée sur l'échelle aérienne, 18 m au-dessus du camion. Monter l'eau coûte de la pression : ρ·g·z.",
    retenir: "Bernoulli avec dénivelé : P_pompe = P_lance + ρ·g·z + ΔP_charge. 10 m de hauteur d'eau coûtent environ 1 bar." },
  { id: 6, nom: 'Raffinerie', icone: '🛢️', temps: 'Nuit', pPompe: 8, pMin: 5, pMax: 8, distFeu: 110, hFeu: 4, zLance: 0, coudes: 3, puissanceMW: 9,
    histoire: "Un réservoir d'hydrocarbures brûle, très loin. Il faut un énorme débit : tout se joue sur le diamètre et la longueur.",
    retenir: "À grand débit, les pertes de charge explosent (≈ Q^1,75) : seul un tuyau large permet d'amener assez d'eau, et de la pression, jusqu'à la lance." },
];

// Réglage de départ commun : diamètre 70, un tuyau, débit minimal (toujours insuffisant : il faut agir)
export const REGLAGE_DEPART = { dMm: 70, nTuyaux: 1, qLmin: 100 };

export const mission = id => MISSIONS.find(m => m.id === id);

// Toutes les attaques réussies d'une mission (grille DN × nombre de tuyaux × débit) : pour les tests et pour la correction
export function solutions(m) {
  const res = [];
  for (const dMm of DIAMETRES) for (let nTuyaux = 1; nTuyaux <= N_MAX; nTuyaux++) for (let qLmin = DEBIT_MIN; qLmin <= DEBIT_MAX; qLmin += DEBIT_PAS) {
    const a = attaque(m, { dMm, nTuyaux, qLmin });
    if (a.reussi) res.push({ dMm, nTuyaux, qLmin, pLanceBar: a.pLanceBar });
  }
  return res;
}

// Étoiles : 3 à la première attaque réussie, 2 à la deuxième, 1 ensuite (avec ou sans indice : pas de pénalité)
export const etoilesAttaques = nbAttaques => (nbAttaques <= 1 ? 3 : nbAttaques === 2 ? 2 : 1);
