// QCM du parcours guidé de la simulation 185 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue ; l'affichage mélange l'ordre des choix). Les nombres viennent du modèle (valeurs du parcours).
import * as M from './iccModele.js';

const A = M.parcoursCas(false);
const f3 = x => Number(x).toFixed(3).replace('.', ',');
const ecA = A.ecrit.texte;                              // « 2,75 ± 0,09 g/cm³ » (espaces insécables)
const uA = f3(A.u);                                     // 0,083

export const QCM_PARCOURS = {
  situation: { options: ['elle dépend des incertitudes de m, d et h à la fois', 'elle vaut u(m) + u(d) + u(h) : on additionne les trois', 'elle est nulle : ρ est calculée, pas mesurée', 'elle ne dépend que de celle de la balance, qui donne m'], bonne: 0 },
  dominant: { options: ['le diamètre d, mesuré à la règle : il pèse le plus dans u(ρ)', 'la masse m, car la balance est l’instrument le moins précis', 'la hauteur h, car c’est la plus grande des dimensions mesurées', 'aucune en particulier : les trois pèsent à peu près autant'], bonne: 0 },
  N: { options: [`il se stabilise vers ${uA} g/cm³ quand N grandit`, 'il tend vers 0 : plus de tirages, moins d’incertitude', 'il augmente avec N, car on cumule plus de valeurs', `il vaut toujours ${uA} g/cm³, même pour N = 10`], bonne: 0 },
  loi: { options: ['la forme de l’histogramme change ; l’écart-type reste le même', 'la formule change : la loi rectangulaire donne un autre u(ρ)', 'rien ne change : l’histogramme reste toujours une cloche', 'l’écart-type des tirages double : la loi rectangulaire est plus large'], bonne: 0 },
  ecriture: { options: [`ρ = ${ecA}`, 'ρ = 2,7454 ± 0,0830 g/cm³', 'ρ = 2,7 ± 0,09 g/cm³', 'ρ = 2,75 ± 0,09'], bonne: 0 },
  conclu: { options: ['chercher une cause non prise en compte (matériau, étalonnage…)', 'agrandir u, par exemple en revenant à la règle, pour que z repasse sous 2', 'conclure que la valeur de référence de la table est fausse', 'refaire la mesure jusqu’à trouver un z inférieur à 2'], bonne: 0 },
};
