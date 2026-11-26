// QCM du parcours guidé de la simulation 305 (piles, TSTL). La bonne réponse est en tête ici (bonne: 0) et n'est jamais la plus longue.
export const QCM = {
  demipile: { options: ['le couple Cu²⁺/Cu', 'le couple SO₄²⁻/Cu', 'le couple Cu/Cu²⁺ (réducteur d’abord)', 'le couple Cu²⁺/SO₄²⁻ de la solution'], bonne: 0 },
  pont: { options: ['aucun courant ne circule : le circuit est ouvert', 'le courant circule, mais plus faiblement qu’avec le pont', 'le courant circule, mais seulement dans le sens inverse', 'la pile fonctionne comme avant : le pont est inutile'], bonne: 0 },
  voltmetre: { options: ['la lame de cuivre (borne V)', 'la lame de zinc (borne COM)', 'aucune : une pile n’a pas de pôle +', 'on ne peut pas le savoir sans autre mesure'], bonne: 0 },
  anode: { options: ['la lame de zinc : pôle −, siège de l’oxydation', 'la lame de cuivre : pôle +, siège de l’oxydation', 'la lame de zinc : pôle −, siège de la réduction', 'la lame de cuivre : pôle +, siège de la réduction'], bonne: 0 },
  electrons: { options: ['dans le fil, du zinc vers le cuivre', 'dans le fil, du cuivre vers le zinc', 'dans le pont salin, du zinc vers le cuivre', 'dans les deux sens, tour à tour'], bonne: 0 },
  ions: { options: ['vers l’électrode de cuivre (la cathode)', 'vers l’électrode de zinc (l’anode)', 'vers le voltmètre, par le fil', 'ils ne bougent pas : ils restent immobiles'], bonne: 0 },
  demieq: { options: ['Zn(s) → Zn²⁺(aq) + 2 e⁻', 'Zn²⁺(aq) + 2 e⁻ → Zn(s)', 'Zn(s) + 2 e⁻ → Zn²⁺(aq)', 'Zn(s) → Zn²⁺(aq) − 2 e⁻ (électrons retirés)'], bonne: 0 },
  equation: { options: ['Zn(s) + 2 Ag⁺(aq) → Zn²⁺(aq) + 2 Ag(s)', 'Zn(s) + Ag⁺(aq) → Zn²⁺(aq) + Ag(s) (charges non équilibrées)', 'Zn²⁺(aq) + 2 Ag(s) → Zn(s) + 2 Ag⁺(aq)', '2 Zn(s) + Ag⁺(aq) → 2 Zn²⁺(aq) + Ag(s)'], bonne: 0 },
  serie: { options: ['la tension double, la durée ne change pas', 'la tension double, la durée de fonctionnement double aussi', 'la tension reste la même, la durée de fonctionnement double', 'la tension double, la durée est divisée par deux'], bonne: 0 },
};
