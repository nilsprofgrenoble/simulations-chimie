// Sim 237 : Milieux dispersés, types et causes d'instabilité (BTS Formulation). Classification (pas de modèle physique).
// Un milieu dispersé = une phase dispersée (gaz, liquide ou solide) répartie dans une phase continue (gaz, liquide ou solide).
export const ETATS = [{ id: 'gaz', nom: 'gaz' }, { id: 'liquide', nom: 'liquide' }, { id: 'solide', nom: 'solide' }];
export const etat = id => ETATS.find(e => e.id === id);

// Types (gaz dispersé dans gaz : un seul mélange homogène, pas de milieu dispersé)
export const TYPES = {
  'gaz>liquide': 'mousse', 'gaz>solide': 'mousse solide',
  'liquide>gaz': 'aérosol', 'liquide>liquide': 'émulsion', 'liquide>solide': 'émulsion solide',
  'solide>gaz': 'aérosol', 'solide>liquide': 'suspension', 'solide>solide': 'dispersion solide',
};
export const typeDe = (disp, cont) => TYPES[`${disp}>${cont}`] || null;
export const NOMS_TYPES = ['mousse', 'mousse solide', 'aérosol', 'émulsion', 'émulsion solide', 'suspension', 'dispersion solide'];

// Instabilités typiques selon le type (texte affiché) : la phase continue solide fige la dispersion
export const INSTAB = {
  'mousse': { pb: 'drainage du liquide entre les bulles, puis éclatement des bulles', cause: 'bulles de gaz bien plus légères que le liquide ; films liquides très minces et fragiles' },
  'émulsion': { pb: 'crémage ou sédimentation, floculation, coalescence', cause: 'différence de masse volumique, gouttes trop grosses, faible viscosité, attractions entre gouttes' },
  'suspension': { pb: 'sédimentation, floculation', cause: 'particules plus denses que le liquide, grosses particules, attractions de van der Waals entre particules' },
  'aérosol': { pb: 'dépôt des gouttes ou des particules (sédimentation), fusion des gouttes ou agglomération des particules', cause: 'gouttes ou particules bien plus denses que le gaz, gaz très peu visqueux' },
  'mousse solide': { pb: 'très stable : la matrice solide fige la dispersion', cause: 'phase continue solide : les bulles ne peuvent plus se déplacer' },
  'émulsion solide': { pb: 'très stable : la matrice solide fige la dispersion', cause: 'phase continue solide (ou semi-solide) : les gouttes ne peuvent plus se déplacer' },
  'dispersion solide': { pb: 'très stable : la matrice solide fige la dispersion', cause: 'phase continue solide : les particules ne peuvent plus se déplacer' },
};

// Produits du quotidien (fil rouge : le chariot du formulateur). disp / cont : état de la phase dispersée / continue
export const PRODUITS = [
  { id: 'chantilly', nom: 'crème chantilly', disp: 'gaz', cont: 'liquide', detail: 'bulles d’air dans une crème liquide' },
  { id: 'polystyrene', nom: 'polystyrène expansé', disp: 'gaz', cont: 'solide', detail: 'bulles d’air dans du polystyrène solide' },
  { id: 'brouillard', nom: 'brouillard', disp: 'liquide', cont: 'gaz', detail: 'gouttelettes d’eau dans l’air' },
  { id: 'fumee', nom: 'fumée', disp: 'solide', cont: 'gaz', detail: 'particules de suie dans l’air' },
  { id: 'lait', nom: 'lait', disp: 'liquide', cont: 'liquide', detail: 'gouttelettes de matière grasse dans l’eau' },
  { id: 'mayonnaise', nom: 'mayonnaise', disp: 'liquide', cont: 'liquide', detail: 'gouttelettes d’huile dans l’eau (jaune d’œuf, vinaigre)' },
  { id: 'beurre', nom: 'beurre', disp: 'liquide', cont: 'solide', detail: 'gouttelettes d’eau dans la matière grasse figée' },
  { id: 'peinture', nom: 'peinture murale', disp: 'solide', cont: 'liquide', detail: 'particules de pigment dans l’eau' },
  { id: 'boue', nom: 'eau boueuse', disp: 'solide', cont: 'liquide', detail: 'grains de terre dans l’eau' },
  { id: 'pneu', nom: 'caoutchouc de pneu', disp: 'solide', cont: 'solide', detail: 'particules de noir de carbone dans le caoutchouc' },
];
export const produit = id => PRODUITS.find(p => p.id === id);
export const produitsDe = (disp, cont) => PRODUITS.filter(p => p.disp === disp && p.cont === cont);

// Problèmes et causes (défi de diagnostic)
export const PROBLEMES = { cremage: 'crémage', sedimentation: 'sédimentation', floculation: 'floculation', coalescence: 'coalescence' };
export const CAUSES = { densite: 'une différence de masse volumique entre les deux phases', attraction: 'des attractions entre objets dispersés (van der Waals, liaisons hydrogène) que rien ne compense', film: 'une interface mal protégée : le film entre deux gouttes se rompt' };
export const CAUSE_DE = { cremage: 'densite', sedimentation: 'densite', floculation: 'attraction', coalescence: 'film' };
export const SITUATIONS = [
  { pb: 'cremage', texte: 'Dans un flacon de lait cru laissé au repos, une couche blanche et épaisse de crème monte à la surface.' },
  { pb: 'cremage', texte: 'Une vinaigrette émulsionnée, laissée au repos une heure, laisse une couche d’huile plus riche en gouttes en haut du bol, sans que les gouttes aient fusionné.' },
  { pb: 'sedimentation', texte: 'Au fond d’un pot de peinture oublié, les pigments forment un dépôt compact sous un liquide plus clair.' },
  { pb: 'sedimentation', texte: 'Dans un verre d’eau boueuse laissé au repos, les grains de terre tombent et le liquide s’éclaircit par le haut.' },
  { pb: 'floculation', texte: 'Au microscope, des particules de pigment forment des amas en flocons ; chaque particule garde sa forme et les amas se défont en agitant.' },
  { pb: 'floculation', texte: 'Des gouttelettes d’huile se collent en grappes sans fusionner ; une agitation douce les sépare de nouveau.' },
  { pb: 'coalescence', texte: 'Une mayonnaise « tranche » : de grosses gouttes d’huile apparaissent et l’huile se sépare en nappe, de façon irréversible.' },
  { pb: 'coalescence', texte: 'Dans une émulsion mal stabilisée, deux gouttes voisines fusionnent en une goutte plus grosse, et le phénomène continue.' },
];
export function tirageDiagnostic(rng = Math.random) { const s = SITUATIONS[Math.floor(rng() * SITUATIONS.length)]; return { ...s, cause: CAUSE_DE[s.pb] }; }
export function tirageClasser(rng = Math.random) { return PRODUITS[Math.floor(rng() * PRODUITS.length)]; }
export function verifieClasser(p, disp, cont, type) { return disp === p.disp && cont === p.cont && type === typeDe(p.disp, p.cont); }
export function verifieDiagnostic(s, pb, cause) { return pb === s.pb && cause === s.cause; }
