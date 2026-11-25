// QCM du parcours guidé de la simulation « Diagramme ternaire des microémulsions ».
// Ordre FIXE : place de la bonne réponse choisie à la main (équilibrée, jamais deux fois de suite à la même place), jamais la plus longue.
const mk = (pos, bonne, ...autres) => ({ ordreFixe: true, bonne: pos, options: [...autres.slice(0, pos), bonne, ...autres.slice(pos)] });
export const QCM = {
  phasesI: mk(2, 'Deux phases : une microémulsion H/E et de l’huile en excès',
    'Une seule phase : une microémulsion qui contient toute l’huile et toute l’eau',
    'Trois phases : huile en excès, microémulsion bicontinue et eau en excès',
    'Deux phases : microémulsion E/H et eau en excès, comme en Winsor II'),
  conjug: mk(0, 'La phase huile est presque pure, le mélange actif est dans la microémulsion',
    'Le mélange actif se trouve surtout dans la phase huile, qui est la plus concentrée en SDS',
    'Les deux phases en équilibre ont la même composition, au point représentatif près',
    'La ligne ne dit rien sur la composition des phases : elle sert seulement à tracer la frontière'),
  phasesII: mk(3, 'Une microémulsion E/H et une phase d’eau en excès presque pure',
    'Microémulsion H/E et huile en excès presque pure, comme en Winsor I',
    'Trois phases : huile en excès, microémulsion bicontinue et eau en excès',
    'Une seule phase, puisque A contient 10 % de mélange actif'),
  constance: mk(1, 'Seule la salinité varie : eau, huile et mélange actif restent en mêmes quantités',
    'Le sel est un quatrième constituant, dont la masse est comptée dans le diagramme',
    'Le point global se déplace tout seul pour rester dans la zone triphasique du diagramme',
    'Les trois diagrammes sont identiques : seuls les noms des types de Winsor changent'),
  dilution: mk(2, 'Le rapport entre la masse d’eau et celle de mélange actif',
    'La teneur en eau du mélange, qui ne varie pas quand on ajoute de l’huile',
    'La teneur en mélange actif du mélange, quelle que soit la quantité d’huile ajoutée',
    'Le nombre de phases en équilibre le long de la ligne'),
};
