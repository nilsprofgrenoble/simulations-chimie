// QCM du parcours guidé de la simulation 256 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici, n'est ni la plus longue ni la plus courte).
export const QCM_PARCOURS = {
  equation: { options: [
    'HCOOH + H₂O ⇌ HCOO⁻ + H₃O⁺, l’acide cède un proton (réaction limitée)',
    'HCOOH + H₂O → HCOO⁻ + H₃O⁺, réaction totale comme pour un acide fort',
    'HCOOH + H₂O ⇌ HCOOH₂⁺ + HO⁻, l’acide capte un proton de l’eau',
    'HCOOH + H₃O⁺ ⇌ HCOO⁻ + H₂O, l’acide réagit avec les ions oxonium de l’eau'], bonne: 0 },
  relation: { options: [
    'σ = (λ(H₃O⁺) + λ(HCOO⁻)) × [H₃O⁺], car [HCOO⁻] = [H₃O⁺]',
    'σ = λ(H₃O⁺) × [H₃O⁺] : seuls les H₃O⁺ conduisent',
    'σ = (λ(H₃O⁺) + λ(HCOO⁻)) × c : tout l’acide est sous forme d’ions',
    'σ = (λ(H₃O⁺) + λ(HCOO⁻)) × [HCOOH] : on prend l’acide restant'], bonne: 0 },
  expression: { options: [
    'K = [HCOO⁻] × [H₃O⁺] / [HCOOH], les produits sur le réactif (sans l’eau)',
    'K = [HCOOH] / ([HCOO⁻] × [H₃O⁺]), le réactif sur les produits',
    'K = [HCOO⁻] × [H₃O⁺] / ([HCOOH] × [H₂O]), avec la concentration de l’eau liquide',
    'K = [HCOO⁻] × [H₃O⁺] / c, en divisant par la concentration apportée'], bonne: 0 },
  dilution: { options: [
    'K est inchangée, et τ augmente : une plus grande part de l’acide réagit',
    'K augmente et τ augmente : l’acide devient plus fort quand on le dilue',
    'K et τ sont inchangés : la constante fixe aussi le taux d’avancement final',
    'K diminue et τ augmente : il y a moins d’ions, donc moins de réaction'], bonne: 0 },
  ecart: { options: [
    'les arrondis, l’incertitude de mesure et les approximations (λ fixes, activités)',
    'la constante K dépend de la concentration apportée : elle change à chaque dilution',
    'les ions HO⁻ de l’eau, qui contribuent bien plus à σ que H₃O⁺ et HCOO⁻ réunis',
    'l’acide méthanoïque réagit totalement avec l’eau : la valeur tabulée de K est fausse'], bonne: 0 },
};
