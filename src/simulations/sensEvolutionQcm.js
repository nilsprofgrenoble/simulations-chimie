// QCM du parcours guidé de la simulation 293 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici, n'est ni la plus longue ni la plus courte).
export const QCM_PARCOURS = {
  echelle: { options: [
    'Cu²⁺ + Zn → Cu + Zn²⁺ : l’oxydant de plus grand E° réagit avec le réducteur de plus petit E°',
    'Zn²⁺ + Cu → Zn + Cu²⁺ : l’oxydant de plus petit E° réagit avec le réducteur de plus grand E°',
    'aucune réaction : les deux couples ont des potentiels standards trop éloignés pour réagir ensemble',
    'Cu²⁺ + Zn²⁺ → Cu + Zn : les deux oxydants se réduisent en même temps, chacun de son côté'], bonne: 0 },
  equation: { options: [
    '2 Ag⁺ + Cu ⇌ 2 Ag + Cu²⁺ : le cuivre cède 2 e⁻ et chaque ion Ag⁺ en capte 1',
    'Ag⁺ + Cu ⇌ Ag + Cu²⁺ : un seul ion Ag⁺ capte les 2 e⁻ cédés par un atome de cuivre',
    'Ag⁺ + 2 Cu ⇌ Ag + 2 Cu²⁺ : chaque atome de cuivre ne cède qu’un seul électron à Ag⁺',
    'Ag + Cu²⁺ ⇌ Ag⁺ + Cu : le couple de plus grand E° joue le rôle de réducteur'], bonne: 0 },
  totale: { options: [
    'quasi totale : à l’équilibre il ne reste que des traces de l’ion Ag⁺, le réactif limitant',
    'limitée : à l’équilibre il reste autant de réactifs que de produits dans le bécher',
    'impossible : une constante aussi grande signifie que la réaction ne peut pas se produire',
    'instantanée : une constante élevée indique que la réaction se termine en quelques secondes'], bonne: 0 },
  sens: { options: [
    'sens direct : Qr doit augmenter, donc Ag⁺ est consommé et Cu²⁺ se forme',
    'sens inverse : Qr doit augmenter, donc Cu²⁺ est consommé et Ag⁺ se forme',
    'aucune évolution : Qr est différent de K, donc le système reste figé dans cet état',
    'sens direct : Qr doit diminuer, donc Ag⁺ est consommé et Cu²⁺ se forme'], bonne: 0 },
  inverse: { options: [
    'sens inverse : Qr = 100 est supérieur à K = 3,2, donc Fe³⁺ oxyde l’argent',
    'sens direct : Ag⁺ est un oxydant plus fort que Fe³⁺ (E° plus grand), donc il réagit',
    'sens direct : Qr = 0,01 est inférieur à K = 3,2, donc Ag⁺ oxyde les ions Fe²⁺',
    'équilibre : K est proche de 1, donc le système n’évolue pas dans cet état initial'], bonne: 0 },
  conclure: { options: [
    'la transformation est possible (K grand) mais très lente : blocage cinétique',
    'la transformation est impossible : le calcul de K donne une valeur fausse ou erronée',
    'le système est à l’équilibre : Qr est égal à K, donc il ne peut plus évoluer ici',
    'c’est le catalyseur qui a fait augmenter K, ce qui a rendu la transformation possible'], bonne: 0 },
};
