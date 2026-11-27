// Modèle de la simulation 301 « Fluorescence et phosphorescence : diagramme de Perrin-Jablonski ». Fonctions pures, testées par fluoModele.test.mjs.
// Hypothèses : constantes du cours (E(eV) × λ(nm) = 1243) ; durées de vie à décroissance exponentielle ; molécules schématiques.
import { energieEV } from './lumMatModele.js';

export const DUREES = { absorption: 1e-15, rv: 1e-12, ci: 1e-12, cis: 1e-8, fluo: 1e-9, phos: 1 };           // secondes (ordres de grandeur du cours ; phosphorescence 10⁻² à 10² s)
export const PROCESSUS = [
  { id: 'absorption', nom: 'Absorption', duree: '10⁻¹⁵ s', radiatif: true, desc: 'un photon est absorbé : un électron passe à un état excité (S₁ ou S₂)' },
  { id: 'rv', nom: 'Relaxation vibrationnelle (RV)', duree: '10⁻¹² s', radiatif: false, desc: 'la molécule descend les sous-niveaux de vibration en cédant de la chaleur au milieu' },
  { id: 'ci', nom: 'Conversion interne (CI)', duree: '10⁻¹² s', radiatif: false, desc: 'passage de S₂ à S₁ sans émission de photon' },
  { id: 'fluo', nom: 'Fluorescence', duree: '10⁻⁹ s', radiatif: true, desc: 'retour de S₁ à S₀ avec émission d’un photon' },
  { id: 'cis', nom: 'Croisement intersystème (CIS)', duree: '10⁻⁸ s', radiatif: false, desc: 'passage de S₁ à T₁ avec inversion du spin, sans émission de photon' },
  { id: 'phos', nom: 'Phosphorescence', duree: '10⁻² à 10² s', radiatif: true, desc: 'retour de T₁ à S₀ avec émission d’un photon, très lent' },
];
// Deux molécules schématiques. A : fluorescente. B : phosphorescente (CIS efficace).
export const MOLS = {
  A: { id: 'A', nom: 'Molécule A (fluorescente)', lamAbs: 350, lamFluo: 450, lamPhos: null, tauS1: 5e-9, tauT1: null },
  B: { id: 'B', nom: 'Molécule B (phosphorescente)', lamAbs: 350, lamFluo: 420, lamPhos: 520, tauS1: 2e-9, tauT1: 1 },
};
export const energie = energieEV;
export const decalageStokes = (lamAbs, lamEm) => energieEV(lamAbs) - energieEV(lamEm);          // eV perdus entre absorption et émission
export const partPerdue = (lamAbs, lamEm) => 1 - lamAbs / lamEm;                                // fraction d’énergie perdue = 1 − E(em)/E(abs)
// Après l'arrêt de l'excitation (t = 0), intensité relative de chaque émission à l'instant t (s).
export const intensiteFluo = (mol, t) => Math.exp(-t / mol.tauS1);
export const intensitePhos = (mol, t) => (mol.tauT1 ? 0.6 * Math.exp(-t / mol.tauT1) : 0);       // 0,6 : part du premier ordre de grandeur, schématique
export const SEUIL = 0.01;                                                                         // intensité jugée visible au-dessus de 1 %
export const visibleFluo = (mol, t) => intensiteFluo(mol, t) > SEUIL;
export const visiblePhos = (mol, t) => intensitePhos(mol, t) > SEUIL * 0.6;
// État le plus peuplé juste après excitation puis au cours du temps (pour le point du diagramme)
export const etatDominant = (mol, t) => (visibleFluo(mol, t) ? 'S1' : mol.tauT1 && visiblePhos(mol, t) ? 'T1' : 'S0');
export const classeEmission = (mol, t) => { const f = visibleFluo(mol, t), p = visiblePhos(mol, t); return f && p ? 'les deux' : p ? 'phosphorescence seule' : f ? 'fluorescence seule' : 'aucune'; };
// Spectres schématiques (gaussiennes) : absorption centrée sur lamAbs, émission centrée sur lamEm
export const gauss = (x, c, s) => Math.exp(-0.5 * ((x - c) / s) ** 2);
export const tirageDefiStokes = rnd => { const lamAbs = 300 + 10 * Math.floor(rnd() * 11), lamEm = lamAbs + [40, 50, 60, 80, 100, 120][Math.floor(rnd() * 6)]; return { kind: 'stokes', lamAbs, lamEm, dE: decalageStokes(lamAbs, lamEm) }; };
export const tirageDefiDuree = rnd => { const mol = MOLS.B, t = [[1e-9, '1 ns'], [3e-8, '30 ns'], [1e-6, '1 µs'], [2e-3, '2 ms'], [0.5, '0,5 s'], [30, '30 s']][Math.floor(rnd() * 6)]; return { kind: 'duree', t: t[0], txt: t[1], rep: classeEmission(mol, t[0]) }; };

// ---------- vue « Le diagramme dans le temps » : molécules excitées par un flash à t = 0 ----------
// Populations (fractions des molécules excitées par le flash) à l'instant t (s). Avant 10⁻¹³ s : niveaux de vibration élevés (« chaud ») ;
// relaxation vibrationnelle et conversion interne achevées vers 10⁻¹² s ; puis S₁ se vide avec la durée de vie tauS1 (fluorescence, et CIS pour B) ;
// T₁ se remplit (part phiCIS) et se vide avec tauT1 (phosphorescence). Intensités relatives : fluorescence ∝ population du bas de S₁,
// phosphorescence ∝ population de T₁ (rapportée à son maximum possible phiCIS).
export const PHI_CIS = { A: 0, B: 0.6 };
export function populations(mol, t) {
  const lt = Math.log10(Math.max(t, 1e-16)), r = Math.min(1, Math.max(0, lt + 13));     // r : part relaxée (0 à 10⁻¹³ s, 1 à 10⁻¹² s)
  const s1 = Math.exp(-t / mol.tauS1), phi = PHI_CIS[mol.id] ?? 0;
  const t1 = mol.tauT1 ? phi * (1 - s1) * Math.exp(-t / mol.tauT1) : 0;
  const chaud = 1 - r, S1 = r * s1, T1 = r * t1;
  // flF, flP : photons émis par décade de temps (dN/d log t), rapportés à leur maximum. C'est ce que montrent les grains qui tombent
  // sur une échelle logarithmique : maximum vers t = τ, presque rien tant que t ≪ τ (les molécules attendent) ou t ≫ τ (niveau vide).
  const flF = S1 * (t / mol.tauS1) * Math.E, flP = phi && mol.tauT1 ? (T1 / phi) * (t / mol.tauT1) * Math.E : 0;
  return { chaud, S1, T1, S0: Math.max(0, 1 - chaud - S1 - T1), fluo: S1, phos: phi ? T1 / phi : 0, flF, flP };
}
