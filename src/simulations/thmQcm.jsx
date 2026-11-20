// QCM du parcours guidé de la simulation 212 (fichier séparé pour contrôler par script la longueur des options). Équations en MathML.
import { FormuleEnLigne } from '../commun';

const T = <mi>T</mi>, tau = <mi>τ</mi>, Text = <msub><mi>T</mi><mtext>ext</mtext></msub>;
const dTdt = <mfrac><mrow><mi>d</mi><mi>T</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac>;
const sur = (a, b) => <mfrac>{a}{b}</mfrac>;
const pl = <mo>+</mo>, mo = <mo>−</mo>, eg = <mo>=</mo>, x = <mo>×</mo>;
const eq = (...c) => <FormuleEnLigne>{c}</FormuleEnLigne>;

export const QCM_PARCOURS = {
  sens: { options: ['du café vers l’air de la pièce', 'de l’air de la pièce vers le café', 'aucun transfert n’a lieu', 'du café vers la tasse seulement, jamais vers l’air'], bonne: 0 },
  equation: { options: [
    eq(dTdt, pl, sur(T, tau), eg, sur(Text, tau)),
    eq(dTdt, mo, sur(T, tau), eg, sur(Text, tau)),
    eq(dTdt, eg, Text, mo, T),
    eq(dTdt, pl, sur(T, tau), eg, sur(<mrow><mo>(</mo>{Text}<mo>−</mo>{T}<mo>)</mo></mrow>, tau)),
  ], bonne: 0 },
  solution: { options: ['A = T_0 − T_ext', 'A = T_0', 'A = T_ext − T_0', 'A = T_0 − 2 T_ext'], bonne: 0 },
  influence: { options: ['τ augmente : le café refroidit plus lentement', 'τ diminue : le café refroidit plus vite', 'τ augmente : le café refroidit plus vite', 'τ ne change pas : seule la masse de café compte pour τ'], bonne: 0 },
};
void x;

// Longueur visuelle d'une option : une fraction compte pour la somme de ses deux parties (elle occupe les deux lignes), les « _ » ne s'affichent pas
export function texteRendu(n) {
  if (n == null || n === false) return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n).replace(/_/g, '');
  if (Array.isArray(n)) return n.map(texteRendu).join('');
  if (n.type === 'mfrac') return [].concat(n.props.children).map(texteRendu).join('');
  return texteRendu(n.props?.children);
}
