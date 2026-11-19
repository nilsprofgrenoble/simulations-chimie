// QCM du parcours guidé de la simulation 174 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est ni la plus courte ni la plus longue ; longueurs comptées sur le texte rendu). Les équations passent par MathML (indices et fractions propres).
import { FormuleEnLigne } from '../commun';

// éléments MathML réutilisés par la simulation
export const uC = <msub><mi>u</mi><mi>C</mi></msub>;
export const uR = <msub><mi>u</mi><mi>R</mi></msub>;
export const duC = <mfrac><mrow><mi>d</mi>{uC}</mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac>;
const x = <mo>×</mo>, pl = <mo>+</mo>, mo = <mo>−</mo>, eg = <mo>=</mo>;
const RC = <mrow><mi>R</mi><mi>C</mi></mrow>;
const eq = (...c) => <FormuleEnLigne>{c}</FormuleEnLigne>;

export const QCM_PARCOURS = {
  armatures: { options: ['elles augmentent en valeur absolue et sont de signes opposés', 'elles augmentent et sont toutes les deux positives', 'elles restent nulles, car l’isolant bloque tout déplacement de charges', 'des charges traversent l’isolant pour passer d’une armature à l’autre'], bonne: 0 },
  maille: { options: [
    eq(RC, x, duC, pl, uC, eg, <mi>E</mi>),
    eq(<mi>R</mi>, x, duC, pl, uC, eg, <mi>E</mi>),
    eq(duC, pl, <mi>R</mi>, x, <mi>C</mi>, x, uC, eg, <mi>E</mi>),
    eq(RC, x, duC, mo, uC, eg, <mi>E</mi>),
  ], bonne: 0 },
  courant: { options: [
    eq(<mi>i</mi>, eg, <mi>C</mi>, x, duC),
    eq(<mi>i</mi>, eg, <mi>C</mi>, x, uC),
    eq(<mi>i</mi>, eg, <mfrac><mi>q</mi><mi>C</mi></mfrac>),
    eq(<mi>i</mi>, eg, mo, <mi>C</mi>, x, duC),
  ], bonne: 0 },
  solution: { options: ['A = −E, car u_C(0) = E + A doit être nulle', 'A = E, car la tension finale vaut E', 'A = 0, car le condensateur est déchargé au début', 'A = frac(E|RC), car il faut diviser E par le temps RC'], bonne: 0 },
  stationnaire: { options: ['nulle, car i = C × frac(du|dt) et u_C ne varie plus', 'égale à frac(E|R), comme à t = 0', 'égale à frac(E|R) tant que l’interrupteur reste fermé', 'négative : le condensateur se décharge dans le générateur'], bonne: 0 },
  decharge: { options: [
    eq(RC, x, duC, pl, uC, eg, <mn>0</mn>, <mtext> (second membre nul)</mtext>),
    eq(RC, x, duC, pl, uC, eg, <mi>E</mi>, <mtext> (second membre E)</mtext>),
    eq(RC, x, duC, mo, uC, eg, <mn>0</mn>, <mtext> (signe de </mtext>, uC, <mtext> inversé)</mtext>),
    eq(uC, eg, <mn>0</mn>, <mtext> à chaque instant</mtext>),
  ], bonne: 0 },
  verif: { options: ['non : RC × frac(du_C|dt) + u_C vaut 0 avec cette fonction, et non E', 'oui : la dérivée d’une exponentielle est une exponentielle', 'oui : elle vaut bien E à la fin de la charge', 'non : une exponentielle n’est jamais solution d’une telle équation'], bonne: 0 },
  capteur: { options: ['elle augmente, car τ = R × C augmente quand C augmente', 'elle diminue, car un C plus grand permet de stocker plus vite', 'elle ne change pas, car R et E restent les mêmes', 'elle ne change pas, car 63 % de E est toujours atteint'], bonne: 0 },
};

// texte rendu d'une option (MathML aplati) pour le contrôle de longueur ; une fraction compte pour la plus longue de ses deux parties
export function texteRendu(n) {
  if (n == null || n === false) return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n).replace(/frac\(([^|]*)\|([^)]*)\)/g, (_, a, b) => (a.length > b.length ? a : b)).replace(/_/g, '');
  if (Array.isArray(n)) return n.map(texteRendu).join('');
  if (n.type === 'mfrac') { const [a, b] = [].concat(n.props.children).map(texteRendu); return a.length > b.length ? a : b; }
  return texteRendu(n.props?.children);
}
