// Schémas des cartes « À retenir » de la simulation 203 « Transformation nucléaire » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver.
// viewBox de 300 de large (≈ 230 px sur téléphone) : textes de 13,5 à 17 ; schémas plafonnés à 320 px ; dessins calculés par nucleaire2gtDispo.js (testé).
import { Dessin } from "./Nucleaire2gtScenes";
import * as D from "./nucleaire2gtDispo";

const memo = {};
const c = (cle, f) => (memo[cle] ??= f());
export const FicheIsotopes = () => <Dessin d={c('isotopes', D.CARTES.isotopes)} max={320} marge={6} aria="Trois noyaux de carbone dessinés avec leurs protons (rouges) et leurs neutrons (blancs) : carbone 12, 13 et 14. Ils ont le même nombre de protons Z = 6 et des nombres de nucléons A différents. Pour s’en souvenir : iso veut dire même, topos veut dire place, même case du tableau périodique." />;
export const FicheNatures = () => <Dessin d={c('natures', D.CARTES.natures)} max={320} marge={6} aria="Tableau : pour chaque nature de transformation, les molécules, les atomes et les noyaux sont-ils les mêmes avant et après ? Physique : oui, oui, oui. Chimique : non, oui, oui. Nucléaire : non, non, non." />;
export const FicheFusion = () => <Dessin d={c('fusion', D.CARTES.fusion)} max={320} marge={6} aria="Fusion : un noyau de deutérium et un noyau de tritium s’assemblent en un noyau d’hélium et un neutron, en libérant de l’énergie. De petits noyaux s’assemblent en un plus gros. La fusion est la source d’énergie des étoiles ; l’exemple écrit est simplifié et n’est pas la chaîne du Soleil." />;
export const FicheFission = () => <Dessin d={c('fission', D.CARTES.fission)} max={320} marge={6} aria="Fission : un neutron frappe un gros noyau d’uranium 235, qui se casse en deux noyaux plus petits (strontium 94 et xénon 140) en libérant deux neutrons et de l’énergie. C’est la source des centrales nucléaires." />;
export const FicheChaine = () => <Dessin d={c('chaine', D.CARTES.chaine)} max={320} marge={6} aria="Chaîne d’une centrale nucléaire : fission des noyaux d’uranium dans le cœur du réacteur, énergie thermique qui chauffe l’eau en vapeur, énergie de mouvement de la turbine, énergie électrique de l’alternateur." />;
export const FicheReconnaitre = () => <Dessin d={c('reconnaitre', D.CARTES.reconnaitre)} max={320} marge={6} aria="Trois indices pour reconnaître la nature d’une écriture. Physique : la même formule des deux côtés, avec des états différents. Chimique : des formules de molécules qui changent, avec les mêmes atomes. Nucléaire : des symboles de noyaux avec A et Z qui changent d’élément." />;
