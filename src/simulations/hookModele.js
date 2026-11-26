// Modèle de la simulation 304 « Infrarouge : de la liaison-ressort au spectre ». Fonctions pures, testées par hookModele.test.mjs.
// Hypothèses : oscillateur harmonique, σ = (1/2πc)·√(k/μ) ; constantes arrondies ; constantes de force typiques (valeurs d'ordre de grandeur).
export const U = 1.66e-27, CL = 3.00e8;                    // unité de masse atomique (kg), vitesse de la lumière (m/s)
export const MASSE = { H: 1, C: 12, N: 14, O: 16 };          // en u
export const masseReduite = (m1, m2) => m1 * m2 / (m1 + m2);                       // en u
export const sigmaHooke = (k, muU) => Math.sqrt(k / (muU * U)) / (2 * Math.PI * CL * 100);   // cm⁻¹ (k en N/m, μ en u)
export const sigmaDeMuKg = (k, muKg) => Math.sqrt(k / muKg) / (2 * Math.PI * CL * 100);
export const lamUm = sigma => 1e4 / sigma;
// Liaisons : k typique (N/m), nombre d'onde tabulé (cm⁻¹, centre de la bande), largeur de la bande dessinée
export const LIAISONS = [
  { id: 'OH', nom: 'O–H (libre)', a: 'O', b: 'H', k: 780, tab: 3620, larg: 20, zone: 'élongation' },
  { id: 'NH', nom: 'N–H', a: 'N', b: 'H', k: 640, tab: 3400, larg: 40, zone: 'élongation' },
  { id: 'CH', nom: 'C–H', a: 'C', b: 'H', k: 480, tab: 2950, larg: 40, zone: 'élongation' },
  { id: 'CC3', nom: 'C≡C', a: 'C', b: 'C', k: 1560, tab: 2200, larg: 25, zone: 'élongation' },
  { id: 'CO2', nom: 'C=O', a: 'C', b: 'O', k: 1200, tab: 1715, larg: 25, zone: 'élongation' },
  { id: 'CC2', nom: 'C=C', a: 'C', b: 'C', k: 960, tab: 1650, larg: 30, zone: 'élongation' },
  { id: 'CO1', nom: 'C–O', a: 'C', b: 'O', k: 500, tab: 1100, larg: 50, zone: 'empreinte' },
  { id: 'CC1', nom: 'C–C', a: 'C', b: 'C', k: 360, tab: 1000, larg: 50, zone: 'empreinte' },
];
export const liaison = id => LIAISONS.find(l => l.id === id);
export const sigmaLiaison = l => sigmaHooke(l.k, masseReduite(MASSE[l.a], MASSE[l.b]));
// Spectres schématiques de molécules (transmittance) : liste de bandes { sigma, larg, prof (0..1), label }
export const MOLECULES = {
  propanone: { nom: 'Propanone (acétone)', bandes: [{ sigma: 2960, larg: 45, prof: 0.45, lie: 'CH' }, { sigma: 1715, larg: 22, prof: 0.88, lie: 'CO2' }, { sigma: 1360, larg: 30, prof: 0.45 }, { sigma: 1220, larg: 40, prof: 0.4 }] },
  ethanol_dilue: { nom: 'Éthanol dilué (gaz ou solution diluée)', bandes: [{ sigma: 3620, larg: 18, prof: 0.55, lie: 'OH' }, { sigma: 2950, larg: 45, prof: 0.5, lie: 'CH' }, { sigma: 1050, larg: 40, prof: 0.7, lie: 'CO1' }] },
  ethanol_pur: { nom: 'Éthanol pur (liaison hydrogène)', bandes: [{ sigma: 3340, larg: 220, prof: 0.8, lie: 'OH', large: true }, { sigma: 2950, larg: 45, prof: 0.5, lie: 'CH' }, { sigma: 1050, larg: 40, prof: 0.7, lie: 'CO1' }] },
  conjuguee: { nom: 'Cétone conjuguée (pent-1-èn-3-one)', bandes: [{ sigma: 2960, larg: 45, prof: 0.4, lie: 'CH' }, { sigma: 1690, larg: 22, prof: 0.85, lie: 'CO2' }, { sigma: 1620, larg: 25, prof: 0.55, lie: 'CC2' }] },
};
export const transmittance = (bandes, s) => Math.max(0.02, 1 - bandes.reduce((a, b) => a + b.prof * Math.exp(-0.5 * ((s - b.sigma) / b.larg) ** 2), 0));
// Mélange libre / lié pour l'éthanol : x = part de molécules liées (0 à 1)
export const bandesEthanol = x => [{ sigma: 3620, larg: 18, prof: 0.55 * (1 - x), lie: 'OH' }, { sigma: 3340, larg: 220, prof: 0.8 * x, lie: 'OH', large: true }, { sigma: 2950, larg: 45, prof: 0.5, lie: 'CH' }, { sigma: 1050, larg: 40, prof: 0.7, lie: 'CO1' }];
// Défis
export const tirageDefiHooke = rnd => { const l = LIAISONS[Math.floor(rnd() * LIAISONS.length)]; const mu = masseReduite(MASSE[l.a], MASSE[l.b]); return { kind: 'hooke', l, k: l.k, mu, sigma: sigmaHooke(l.k, mu) }; };
export const tirageDefiBande = rnd => {
  const l = LIAISONS[Math.floor(rnd() * LIAISONS.length)], exclus = l.id === 'CO2' ? ['CC2'] : l.id === 'CC2' ? ['CO2'] : [];
  const sigma = Math.round((l.tab + (rnd() - 0.5) * 2 * l.larg * 0.5) / 5) * 5;
  const autres = LIAISONS.filter(x => x.id !== l.id && !exclus.includes(x.id) && Math.abs(x.tab - l.tab) > 150);
  const opts = []; while (opts.length < 3 && autres.length) opts.push(autres.splice(Math.floor(rnd() * autres.length), 1)[0]);
  const choix = [...opts, l].sort((a, b) => a.id.localeCompare(b.id));
  return { kind: 'bande', l, sigma, choix };
};
