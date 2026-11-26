// QCM du parcours guidé de la simulation « Éclairage, réflectance et métamérisme ».
// Ordre FIXE : place de la bonne réponse choisie à la main (équilibrée, jamais deux fois de suite à la même place), jamais la plus longue.
const mk = (pos, bonne, ...autres) => ({ ordreFixe: true, bonne: pos, options: [...autres.slice(0, pos), bonne, ...autres.slice(pos)] });
export const QCM = {
  sources: mk(0, 'Le tube fluorescent',
    'La lumière du jour, dont le spectre est formé de quelques pics très fins',
    'La lampe à incandescence, qui émet surtout dans le bleu et le violet',
    'Aucune : les trois sources ont un spectre continu, sans pic ni creux'),
  reflectance: mk(2, 'Faible aux courtes longueurs d’onde, élevée aux grandes',
    'Élevée aux courtes longueurs d’onde, faible aux grandes, car il absorbe le rouge',
    'Élevée sur tout le spectre, car il renvoie toute la lumière qu’il reçoit',
    'Élevée seulement autour de 450 nm, dans le bleu'),
  eclairage: mk(1, 'Orangé, car la lampe émet peu de bleu',
    'Bleuté, car la lampe émet surtout dans le bleu',
    'Toujours blanc : un objet blanc renvoie tout, quelle que soit la lampe',
    'Gris, car la lampe à incandescence éclaire moins que le jour'),
  metamerie: mk(3, 'Ils ne sont plus identiques : ce sont des métamères',
    'Ils restent identiques : deux couleurs égales le restent sous toutes les lampes',
    'Ils sont tous deux plus foncés, mais restent identiques entre eux',
    'On ne peut rien dire : une lampe ne change pas la couleur d’un objet'),
  courbes: mk(0, 'Elles se croisent plusieurs fois (au moins trois) et leurs écarts se compensent',
    'Elles sont proches partout : les différences entre les courbes sont trop petites pour qu’on les voie',
    'L’œil ne voit que la hauteur moyenne des courbes, quelle que soit leur forme',
    'Elles ont la même aire : l’œil mesure seulement l’aire sous la courbe'),
  controle: mk(2, 'Pour repérer un métamérisme : la teinte peut changer avec la lampe',
    'Parce que le colorimètre mesure moins bien sous la lumière du jour, à cause des UV',
    'Parce que les pigments changent de nature chimique sous une autre lampe',
    'Pour augmenter la luminosité de l’échantillon à chaque mesure'),
};
