// Modèle de la simulation « Régiosélectivité de l'addition de HBr » (BTS) : pur JS, sans React.
// Hypothèses (ordres de grandeur, voir le panneau « Hypothèses ») : l'énergie du carbocation ne dépend que de sa classe (primaire,
// secondaire, tertiaire) ; l'état de transition 1 est 40 kJ/mol au-dessus du carbocation ; contrôle cinétique à 298 K.

export const E_CATION = { 1: 75, 2: 60, 3: 50 };     // énergie du carbocation (kJ/mol, réactifs = 0)
export const MONTEE_ET1 = 40;                         // ET₁ = carbocation + 40
export const MONTEE_ET2 = 10;                         // ET₂ = carbocation + 10 (attaque de Br⁻, très facile)
export const E_PRODUIT = -65;
export const T = 298, R_KJ = 8.314e-3;
export const NOM_CLASSE = { 1: 'primaire', 2: 'secondaire', 3: 'tertiaire' };

// Squelettes : atomes (coordonnées SVG, liaison de 56), liaisons, double liaison, noms des produits selon le carbone qui porte Br
const dx = 48.5, dy = 28;
export const ALCENES = [
  { id: 'propene', nom: 'propène', semi: 'CH₃–CH=CH₂',
    C: { 1: [0, dy], 2: [dx, 0], 3: [2 * dx, dy] }, liaisons: [[1, 2], [2, 3]], db: [1, 2],
    produit: { 1: '1-bromopropane', 2: '2-bromopropane' } },
  { id: 'but1ene', nom: 'but-1-ène', semi: 'CH₃–CH₂–CH=CH₂',
    C: { 1: [0, dy], 2: [dx, 0], 3: [2 * dx, dy], 4: [3 * dx, 0] }, liaisons: [[1, 2], [2, 3], [3, 4]], db: [1, 2],
    produit: { 1: '1-bromobutane', 2: '2-bromobutane' } },
  { id: 'mpropene', nom: '2-méthylprop-1-ène', semi: '(CH₃)₂C=CH₂',
    C: { 1: [0, dy], 2: [dx, 0], 3: [2 * dx, dy], m: [dx, -56] }, liaisons: [[1, 2], [2, 3], [2, 'm']], db: [1, 2],
    produit: { 1: '1-bromo-2-méthylpropane', 2: '2-bromo-2-méthylpropane' } },
  { id: 'mbut2ene', nom: '2-méthylbut-2-ène', semi: '(CH₃)₂C=CH–CH₃',
    C: { 1: [0, dy], 2: [dx, 0], 3: [2 * dx, dy], 4: [3 * dx, 0], m: [dx, -56] }, liaisons: [[1, 2], [2, 3], [3, 4], [2, 'm']], db: [2, 3],
    produit: { 2: '2-bromo-2-méthylbutane', 3: '3-bromo-2-méthylbutane' } },
];
export const alcene = id => ALCENES.find(a => a.id === id) || ALCENES[0];

// Nombre de carbones voisins d'un carbone : classe du carbocation (1 primaire, 2 secondaire, 3 tertiaire)
export function classeCarbocation(a, c) {
  return a.liaisons.filter(([p, q]) => p === c || q === c).length;
}

// Les deux voies d'addition : H se fixe sur le carbone h, la charge + apparaît sur l'autre carbone de la double liaison
export function voies(a) {
  return a.db.map((h, i) => {
    const c = a.db[1 - i];
    const classe = classeCarbocation(a, c);
    const Ecat = E_CATION[classe];
    return { cle: i === 0 ? 'A' : 'B', h, c, classe, Ecat, ET1: Ecat + MONTEE_ET1, ET2: Ecat + MONTEE_ET2, produit: a.produit[c] };
  });
}

// Proportions de produits sous contrôle cinétique : rapport des vitesses = exp(ΔΔE‡ / RT)
export function proportions(a, temp = T) {
  const [A, B] = voies(a);
  const rapport = Math.exp((B.ET1 - A.ET1) / (R_KJ * temp));    // vitesse(A) / vitesse(B)
  const pA = 100 * rapport / (1 + rapport);
  return { A: pA, B: 100 - pA, ecart: Math.abs(B.ET1 - A.ET1), rapport: rapport >= 1 ? rapport : 1 / rapport,
    majeure: pA >= 50 ? A : B, mineure: pA >= 50 ? B : A, egales: Math.abs(B.ET1 - A.ET1) < 1e-9 };
}

// Points du profil d'une voie (x de 0 à 1, énergie en kJ/mol)
export const profil = v => [[0, 0], [0.22, v.ET1], [0.45, v.Ecat], [0.68, v.ET2], [1, E_PRODUIT]];
