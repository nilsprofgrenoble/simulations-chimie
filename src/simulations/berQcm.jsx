// QCM du parcours guidé de la simulation 214 (fichier séparé pour contrôler par script la longueur des options). Options en texte : les indices s'écrivent v_A, P_B.
export { texteRendu } from './thmQcm';

export const QCM_PARCOURS = {
  permanent: { options: ['en un point donné, la vitesse du fluide ne dépend pas du temps', 'chaque particule de fluide garde la même vitesse sur tout son trajet', 'la vitesse du fluide est la même en tous les points du tuyau', 'la pression du fluide est la même en tous les points du tuyau'], bonne: 0 },
  prevoir: { options: ['la vitesse quadruple', 'la vitesse double', 'la vitesse est multipliée par 8', 'la vitesse est divisée par 4'], bonne: 0 },
  qualitatif: { options: ['P_B est plus petite que P_A', 'P_B est égale à P_A', 'P_B est nettement plus grande que P_A', 'on ne peut pas conclure sans connaître P_A'], bonne: 0 },
  reservoir: { options: ['P_A = P_B ; v_A négligeable devant v_B', 'P_A = P_B et v_A = v_B', 'P_B = 0 et v_A négligeable devant v_B', 'P_A = P_B et v_B négligeable devant v_A'], bonne: 0 },
};
