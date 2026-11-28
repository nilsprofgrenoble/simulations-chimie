// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 200 « L'œil réduit » (2GT).
// Préfixe d'identifiants : oeil2gt- ; domaine : « L’œil réduit (2GT) ». Branchés dans AtelierAnalyserBanque.js, AtelierValiderBanque.js et AtelierDonneesBanque.js.
// Toutes les questions sont adossées aux capacités du programme (œil réduit, image réelle, Thalès, grandissement géométrique) ; aucune relation de conjugaison.
import * as OM from './oeilReduit2gtModele.js';

const DOM = 'L’œil réduit (2GT)';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

// ───────────── ANA : prévoir sans calculer ─────────────
export const OEIL2GT_ANA = [
  { id: 'oeil2gt-ana-sens', domaine: DOM, titre: 'Le sens de l’image sur la rétine',
    enonce: 'Un œil normal regarde un arbre debout, la tête en haut. On modélise l’œil par une lentille convergente et un écran, la rétine.', q: 'Quelle est la bonne description de l’image de l’arbre sur la rétine ?', options: [
      V('réelle et renversée : la cime est en bas', 'L’image se forme sur la rétine, qui joue le rôle d’un écran : elle est réelle. Le rayon issu de la cime passe par O sans être dévié et arrive sous l’axe : l’image est renversée.'),
      F('réelle et à l’endroit : la cime est en haut', 'Les rayons issus du haut de l’arbre arrivent sous l’axe de la rétine après la lentille : l’image est la tête en bas.'),
      F('renversée, mais elle ne se forme pas sur la rétine', 'L’image se forme bien sur la rétine : c’est ce qui permet de voir net. Elle est renversée et réelle.'),
      F('à l’endroit pour le cerveau', 'Le cerveau remet l’image à l’endroit, mais l’image formée sur la rétine est renversée.'),
    ] },
  { id: 'oeil2gt-ana-distance', domaine: DOM, titre: 'Un poteau trois fois plus loin',
    enonce: 'Un œil normal regarde un poteau à 20 m : son image nette sur la rétine mesure environ 3,4 mm. Le poteau est ensuite regardé à 60 m, trois fois plus loin. La rétine reste à 17 mm de la lentille.', q: 'La hauteur de l’image sur la rétine devient…', options: [
      V('environ 1,1 mm, trois fois plus petite', 'A′B′ = frac(AB × OA′|OA) : AB et OA′ ne changent pas, OA est multiplié par 3 : A′B′ est divisée par 3, frac(3,4|3) ≈ 1,1 mm.'),
      F('environ 10 mm, trois fois plus grande', 'Plus l’objet est loin, plus son image est petite : la hauteur est divisée par 3 et non multipliée.'),
      F('toujours 3,4 mm, car la rétine ne bouge pas', 'La rétine est fixe, mais la hauteur de l’image dépend de la distance de l’objet : OA est multiplié par 3, donc A′B′ est divisée par 3.'),
      F('environ 0,38 mm, neuf fois plus petite', 'La hauteur est divisée par le même nombre que la distance est multipliée (3), et non par son carré (9).'),
    ] },
  { id: 'oeil2gt-ana-proche', domaine: DOM, titre: 'Du lointain au téléphone',
    enonce: 'Jade regarde un arbre très loin : l’image est nette sur sa rétine. Elle regarde ensuite son téléphone à 30 cm. Un instant, son cristallin garde exactement la même forme.', q: 'À ce moment, l’image du téléphone sur la rétine est…', options: [
      V('floue : rayons rejoints derrière la rétine', 'Le cristallin est réglé pour les objets lointains. Pour un objet proche, les rayons se coupent plus loin que la rétine : ils font une tache sur la rétine.'),
      F('nette, exactement comme celle de l’arbre lointain', 'La netteté dépend de la distance de l’objet : avec le même cristallin, un objet proche ne donne pas une image nette.'),
      F('floue : les rayons se rejoignent devant la rétine', 'Pour un objet proche, l’image se forme plus loin que pour un objet lointain, donc derrière la rétine et non devant.'),
      F('nette, mais plus petite', 'La taille n’est pas en cause : l’image est floue parce qu’elle se forme derrière la rétine.'),
    ] },
  { id: 'oeil2gt-ana-bombe', domaine: DOM, titre: 'Le cristallin qui regarde de près',
    enonce: 'Un élève lève les yeux du tableau, à 6 m, vers un livre à 30 cm. Son image reste nette sur la rétine, qui est à 17 mm de la lentille.', q: 'Que se passe-t-il dans son œil ?', options: [
      V('le cristallin se bombe et sa distance focale f′ diminue', 'Pour ramener l’image d’un objet proche sur la rétine, la lentille doit dévier plus fort les rayons : le cristallin se bombe, f′ diminue.'),
      F('le cristallin s’aplatit et sa distance focale f′ augmente', 'C’est le contraire : une lentille plus aplatie dévie moins les rayons, ce qui convient à un objet lointain.'),
      F('la rétine s’éloigne du cristallin', 'Dans l’œil réduit, la rétine est fixe à 17 mm : c’est le cristallin qui change de forme.'),
      F('rien ne change, l’œil est toujours réglé pareil', 'Sans changement du cristallin, l’image d’un objet proche serait floue : l’œil accommode pour la rendre nette.'),
    ] },
  { id: 'oeil2gt-ana-deux-arbres', domaine: DOM, titre: 'Deux arbres de tailles différentes',
    enonce: 'Un œil normal regarde deux arbres alignés avec lui. Le premier mesure 6 m et se trouve à 50 m ; le second mesure 12 m et se trouve à 100 m.', q: 'Comparez les hauteurs des deux images sur la rétine.', options: [
      V('les deux images ont exactement la même hauteur', 'A′B′ = frac(AB × OA′|OA). Les deux rapports frac(AB|OA) valent frac(6|50) = frac(12|100) = 0,12 : les images sont identiques, environ 2,0 mm.'),
      F('l’image du second arbre est deux fois plus grande', 'Le second arbre est deux fois plus grand, mais aussi deux fois plus loin : les deux effets se compensent.'),
      F('l’image du second arbre est deux fois plus petite', 'La distance double, mais la hauteur de l’arbre double aussi : l’image ne change pas.'),
      F('l’image du premier arbre est quatre fois plus grande', 'Aucun des deux rapports n’est multiplié par 4 : les rapports frac(hauteur|distance) sont égaux.'),
    ] },
];

// ───────────── VAL : plausible ? ─────────────
export const OEIL2GT_VAL = [
  P({ id: 'oeil2gt-val-image-arbre', domaine: DOM, niveau: 1, titre: 'L’image d’un arbre sur la rétine', plausible: false,
    enonce: 'Un élève calcule la hauteur de l’image sur la rétine d’un arbre de 6,0 m à 50 m, avec OA′ = 17 mm : « A′B′ = frac(6 000 × 17|50) = 2 040 mm ».',
    reperes: [['Rétine', 'à 17 mm de la lentille ; l’œil mesure environ 24 mm'], ['Arbre', 'AB = 6 000 mm ; OA = 50 m = 50 000 mm'], ['Image', 'plus petite que l’objet, car OA′ est bien plus petit que OA']],
    ver: 'Une image de 2 040 mm (plus de 2 m) ne tiendrait pas dans un œil de 24 mm. Il faut convertir OA en mm : A′B′ = frac(6 000 × 17|50 000) ≈ 2,0 mm.',
    q2: 'Quelle erreur explique le mieux son résultat ?',
    options: [
      V('il n’a pas converti 50 m en mm', 'AB est en mm mais OA reste en m : les longueurs ne sont pas dans la même unité, le résultat est 1 000 fois trop grand.'),
      F('il a pris un mauvais OA′', 'OA′ = 17 mm est bien la distance de la lentille à la rétine : l’erreur vient des unités.'),
      F('il a oublié que l’image est renversée', 'Le sens de l’image n’influence pas sa hauteur : l’erreur vient de la conversion des unités.'),
    ] }),
  P({ id: 'oeil2gt-val-image-droite', domaine: DOM, niveau: 1, titre: 'Une bougie à l’endroit sur la rétine', plausible: false,
    enonce: 'Léa dessine un œil réduit et l’image d’une bougie, flamme en haut : « l’image sur la rétine est réelle et à l’endroit, comme la bougie ».',
    reperes: [['Rayon par O', 'passe par O sans être dévié'], ['Flamme', 'au-dessus de l’axe, avant la lentille'], ['Image', 'là où les rayons issus de la flamme se rejoignent sur la rétine']],
    ver: 'Le rayon issu de la flamme monte vers O, passe par O sans être dévié et arrive sous l’axe : l’image sur la rétine est renversée. Le cerveau la remet à l’endroit.',
    q2: 'Quelle est l’erreur de Léa ?',
    options: [
      V('elle confond image sur la rétine et perception', 'Le cerveau redresse l’image, mais l’image réelle formée sur la rétine est renversée.'),
      F('une image réelle ne peut pas se former sur la rétine', 'La rétine joue le rôle d’un écran : c’est bien là que l’image réelle se forme.'),
      F('l’image devrait être plus grande que la bougie', 'L’image est plus petite que la bougie : le défaut du dessin est son sens, pas sa taille.'),
    ] }),
  P({ id: 'oeil2gt-val-bougie-taille', domaine: DOM, niveau: 2, titre: 'L’image d’une bougie à 25 cm', plausible: true,
    enonce: 'Une bougie de 4,0 cm est à 25 cm d’un œil normal, qui accommode : l’image est nette. Un élève trouve : « A′B′ ≈ 2,7 mm, renversée ».',
    reperes: [['Rétine', 'à OA′ = 17 mm de la lentille'], ['Bougie', 'AB = 40 mm ; OA = 250 mm'], ['Règle', 'frac(A′B′|AB) = frac(OA′|OA) : le rapport est frac(17|250), environ 0,07']],
    ver: 'frac(40 × 17|250) ≈ 2,7 mm : l’image est environ 15 fois plus petite que la bougie (0,07 × 40 mm ≈ 2,7 mm), et renversée. Le résultat est cohérent.',
    q2: 'Pourquoi ce résultat est-il vraisemblable ?',
    options: [
      V('l’objet est bien plus loin que la rétine : image petite', 'OA = 250 mm est bien plus grand que OA′ = 17 mm : le rapport frac(OA′|OA) est petit, donc l’image est petite.'),
      F('l’image d’un objet proche est toujours plus grande que l’objet', 'Avec la rétine à 17 mm et l’objet à 250 mm, le rapport est inférieur à 1 : l’image est plus petite.'),
      F('une image sur la rétine mesure toujours environ 3 mm', 'La hauteur dépend de l’objet et de sa distance : 2,7 mm n’est pas une valeur universelle.'),
    ] }),
  P({ id: 'oeil2gt-val-focale-proche', domaine: DOM, niveau: 2, titre: 'La focale pour voir de près', plausible: false,
    enonce: 'Au repos, la distance focale du cristallin est f′ = 17,0 mm. Pour voir net un objet à 25 cm, un élève annonce : « le cristallin se bombe et sa distance focale passe à f′ = 18,5 mm ».',
    reperes: [['Au repos', 'f′ = 17,0 mm, objet très loin'], ['Cristallin plus bombé', 'déviation plus forte des rayons']],
    ver: 'Un cristallin plus bombé a une distance focale plus courte : f′ doit passer sous 17,0 mm (environ 15,9 mm à 25 cm). Une valeur de 18,5 mm correspond à un cristallin plus aplati qu’au repos.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('un cristallin plus bombé a une focale plus courte', 'Plus la lentille est bombée, plus elle dévie les rayons et plus f′ est petite : 18,5 mm est plus grand que 17,0 mm.'),
      F('il aurait dû trouver exactement 17,0 mm, la valeur au repos', 'Au repos f′ vaut 17,0 mm, mais pour voir de près il faut que f′ change : elle diminue.'),
      F('la rétine devrait s’éloigner de la lentille pour voir de près', 'La rétine ne bouge pas : c’est la distance focale du cristallin qui varie.'),
    ] }),
  P({ id: 'oeil2gt-val-nette-loin', domaine: DOM, niveau: 1, titre: 'Un arbre lointain est-il flou au repos ?', plausible: false,
    enonce: 'Un élève affirme : « avec un œil normal et un cristallin au repos, l’image d’un arbre à 200 m est floue sur la rétine, car l’arbre est trop loin ».',
    reperes: [['Au repos', 'f′ = 17,0 mm : le foyer F′ est sur la rétine'], ['Objet très loin', 'rayons presque parallèles à l’axe'], ['Rayons parallèles', 'se coupent au foyer F′']],
    ver: 'Pour un objet très éloigné, les rayons arrivent presque parallèles et se coupent en F′, qui est sur la rétine au repos : l’image est nette. C’est de près que l’image devient floue sans accommodation.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il croit les objets lointains flous au repos', 'Sans accommodation, un objet lointain a une image nette : le foyer F′ est sur la rétine.'),
      F('il oublie que l’image sur la rétine est renversée', 'Le sens de l’image ne change pas sa netteté : l’erreur concerne la netteté, pas le sens.'),
      F('il pense que la rétine est une lentille convergente', 'La rétine est l’écran : l’affirmation concerne la netteté pour un objet lointain, non la nature de la rétine.'),
    ] }),
];

// ───────────── S'APP : repérer les données utiles ─────────────
const tire = t => t[Math.floor(Math.random() * t.length)];
const NB = s => s.replace(/ /g, '\u00a0');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NB(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const fr = x => String(x).replace('.', ',');
export const OEIL2GT_SAPP = [
  {
    id: 'oeil2gt-sapp-arbre', domaine: DOM, titre: 'Un arbre vu par l’œil réduit', noms: ['Hauteur de l’image de l’arbre sur la rétine', 'Distance de l’arbre à l’œil'],
    gen: () => { let AB, D; do { AB = tire([4.0, 5.0, 6.0, 8.0, 10.0]); D = tire([30, 40, 50, 60, 80, 100]); } while (AB / D > 0.16); return { AB, D, Ap: Number((AB * 17 / D).toPrecision(2)), hOeil: tire([23, 24, 25]), pup: tire([3, 4, 5]) }; },
    build: epure((p, q) => {
      const tokens = {
        AB: tok(`${fr(p.AB.toFixed(1))} m`, 'Hauteur de l’arbre', p.AB * 1000, 'mm'),
        D: tok(`${p.D} m`, 'Distance de l’arbre à l’œil', p.D * 1000, 'mm'),
        OAp: tok('17 mm', 'Distance de la lentille à la rétine', 17, 'mm'),
        Ap: tok(`${fr(p.Ap)} mm`, 'Hauteur de l’image sur la rétine', p.Ap, 'mm'),
        hOeil: tok(`${p.hOeil} mm`, 'Longueur totale de l’œil', p.hOeil, 'mm'),
        pup: tok(`${p.pup} mm`, 'Diamètre de la pupille', p.pup, 'mm'),
      };
      const raisons = { hOeil: 'La longueur totale de l’œil ne sert pas : on utilise la distance de la lentille à la rétine, OA′ = 17 mm.', pup: 'Le diamètre de la pupille ne change pas la hauteur de l’image : seule compte la règle de Thalès.' };
      const debut = ['Un œil normal est modélisé par une lentille convergente et un écran. Sa longueur totale est ', T('hOeil'), ' et sa pupille mesure ', T('pup'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'La rétine est à ', T('OAp'), ' de la lentille. Il regarde un arbre de ', T('AB'), ', situé à ', T('D'), ', et l’image est nette. Quelle est la hauteur de l’image sur la rétine ?'], utiles: ['AB', 'D', 'OAp'], raisons,
        cherche: { bonne: 'La hauteur de l’image sur la rétine (en mm)', faux: ['La distance entre l’arbre et son image (en m)', 'La hauteur de la pupille nécessaire (en mm)', 'La longueur de l’œil qui donne une image nette (en mm)'] },
        manque: null, solution: { txt: 'Thalès : A′B′ = frac(AB × OA′|OA), avec AB et OA dans la même unité', val: p.AB * 17 / p.D, u: 'mm' } };
      return { tokens, derivees: [], texte: [...debut, 'La rétine est à ', T('OAp'), ' de la lentille. Un arbre est vu nettement : son image sur la rétine mesure ', T('Ap'), ' et l’arbre mesure ', T('AB'), '. À quelle distance de l’œil se trouve-t-il ?'], utiles: ['AB', 'Ap', 'OAp'], raisons,
        cherche: { bonne: 'La distance de l’arbre à l’œil (en m)', faux: ['La hauteur de l’image sur la rétine (en mm)', 'La distance focale du cristallin (en mm)', 'La largeur de la pupille (en mm)'] },
        manque: null, solution: { txt: 'Thalès : OA = frac(AB × OA′|A′B′) (m), avec A′B′ et OA′ en mm', val: p.D, u: 'm' } };
    }),
  },
  {
    id: 'oeil2gt-sapp-bougie', domaine: DOM, titre: 'Une bougie vue de près', noms: ['Hauteur de l’image de la bougie', 'Hauteur de la bougie'],
    gen: () => { let D, AB; do { D = tire([250, 300, 400, 600]); AB = tire([30, 40, 50, 60]); } while (AB / D > 0.16); return { D, AB, Ap: Number((AB * 17 / D).toPrecision(2)), f: Number(OM.focaleNette(D).toFixed(1)), pup: tire([3, 4, 5]) }; },
    build: epure((p, q) => {
      const tokens = {
        AB: tok(`${p.AB} mm`, 'Hauteur de la bougie', p.AB, 'mm'),
        D: tok(`${p.D / 10} cm`, 'Distance de la bougie à la lentille', p.D, 'mm'),
        OAp: tok('17 mm', 'Distance de la lentille à la rétine', 17, 'mm'),
        Ap: tok(`${fr(p.Ap)} mm`, 'Hauteur de l’image sur la rétine', p.Ap, 'mm'),
        f: tok(`${fr(p.f)} mm`, 'Distance focale du cristallin accommodé', p.f, 'mm'),
        pup: tok(`${p.pup} mm`, 'Diamètre de la pupille', p.pup, 'mm'),
      };
      const raisons = { f: 'La distance focale du cristallin sert à rendre l’image nette, pas à calculer sa hauteur : ici l’image est déjà nette, on utilise OA′ = 17 mm.', pup: 'Le diamètre de la pupille ne change pas la hauteur de l’image.' };
      const debut = ['Un élève regarde une bougie avec un œil normal qui accommode : le cristallin a une distance focale ', T('f'), ' et la pupille mesure ', T('pup'), '. L’image est nette sur la rétine, à ', T('OAp'), ' de la lentille. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'La bougie mesure ', T('AB'), ' et se trouve à ', T('D'), ' de la lentille. Quelle est la hauteur de l’image sur la rétine ?'], utiles: ['AB', 'D', 'OAp'], raisons,
        cherche: { bonne: 'La hauteur de l’image sur la rétine (en mm)', faux: [`La distance focale nécessaire à ${p.D / 10}\u00a0cm (en mm)`, 'Le diamètre de la tache floue (en mm)', 'La distance de la bougie à son image (en cm)'] },
        manque: null, solution: { txt: 'Thalès : A′B′ = frac(AB × OA′|OA), avec la distance convertie en mm', val: p.AB * 17 / p.D, u: 'mm' } };
      return { tokens, derivees: [], texte: [...debut, 'L’image de la bougie mesure ', T('Ap'), ' et la bougie est à ', T('D'), ' de la lentille. Quelle est la hauteur de la bougie ?'], utiles: ['Ap', 'D', 'OAp'], raisons,
        cherche: { bonne: 'La hauteur de la bougie (en mm)', faux: ['La hauteur de l’image sur la rétine (en mm)', 'La distance entre la rétine et la lentille (en mm)', 'La distance focale du cristallin au repos (en mm)'] },
        manque: null, solution: { txt: 'Thalès : AB = frac(A′B′ × OA|OA′), avec la distance convertie en mm', val: p.AB, u: 'mm' } };
    }),
  },
];
