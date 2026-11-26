// QCM du parcours guidé de la simulation 310 (radioactivité, TSTL). La bonne réponse est en tête ici (bonne: 0) et n'est jamais la plus longue.
export const QCM = {
  noyau: { options: ['27 protons et 33 neutrons', '27 protons et 60 neutrons, car A est le nombre de neutrons', '60 protons et 27 neutrons', '33 protons et 27 neutrons, car Z compte les neutrons'], bonne: 0 },
  alpha: { options: ['un noyau d’hélium ⁴₂He, de 4 nucléons', 'un électron, émis par un neutron du noyau', 'un positon, émis par un proton du noyau', 'un photon, qui emporte seulement de l’énergie'], bonne: 0 },
  betam: { options: ['Z augmente de 1 et A ne change pas', 'Z diminue de 1 et A ne change pas', 'Z et A diminuent tous les deux de 1', 'Z ne change pas et A augmente de 1'], bonne: 0 },
  betap: { options: ['un positon ⁰₊₁e : Z diminue de 1', 'un électron ⁰₋₁e : Z diminue de 1', 'un positon ⁰₊₁e : Z augmente de 1', 'un noyau d’hélium : Z diminue de 2'], bonne: 0 },
  gamma: { options: ['ni A ni Z ne changent', 'A diminue de 4 et Z diminue de 2, comme en radioactivité α', 'Z augmente de 1 : un neutron devient un proton', 'A et Z diminuent tous les deux de 1'], bonne: 0 },
  type: { options: ['une radioactivité β⁻', 'une radioactivité β⁺', 'une radioactivité α', 'une émission γ seule, sans autre transformation'], bonne: 0 },
  ecrire: { options: ['²²₁₁Na → ²²₁₀Ne + ⁰₊₁e', '²²₁₁Na → ²²₁₂Mg + ⁰₋₁e', '²²₁₁Na → ¹⁸₉F + ⁴₂He', '²²₁₁Na → ²²₁₀Ne + ⁰₋₁e (charge non conservée)'], bonne: 0 },
  hasard: { options: ['la proportion de noyaux restants, pour un très grand nombre', 'l’instant exact où un noyau donné se désintègre', 'rien : tout est imprévisible, même pour un très grand nombre de noyaux', 'quel noyau sera le premier à se désintégrer dans l’échantillon'], bonne: 0 },
  dN: { options: ['la double : dN est proportionnel à N', 'la même : λ et dt ne dépendent pas de N', 'la moitié : plus il y a de noyaux, moins ils se désintègrent', 'aucune : dN est nul tant que le temps n’a pas avancé'], bonne: 0 },
  analogie: { options: ['la constante de vitesse k de la réaction', 'la concentration initiale [A]₀ de la réaction', 'le temps de demi-réaction t½ de la réaction', 'la concentration [A] à l’instant t considéré'], bonne: 0 },
  protection: { options: ['quelques millimètres d’aluminium', 'une simple feuille de papier', 'aucun écran : les rayons β⁻ traversent tous les matériaux', 'seulement du plomb épais, l’aluminium étant sans effet sur eux'], bonne: 0 },
  applications: { options: ['de quelques heures', 'de plusieurs milliers d’années, pour que le noyau reste longtemps dans l’organisme', 'de quelques millisecondes, pour que l’examen soit très rapide', 'la plus grande possible, pour que l’examen puisse durer des mois'], bonne: 0 },
};
