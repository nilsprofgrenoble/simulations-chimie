// Exercices ANA, VAL et S'APP de la simulation 306 « RMN du proton : attribuer un spectre » (TSTL, SPCL, Chimie et développement durable). Préfixe : rmns-.
// Capacités visées (jamais affichées) : attribuer les signaux d'un spectre RMN aux protons d'une molécule donnée ; identifier ou confirmer une structure avec une banque de données (cas simples).
import { MOL } from './rmnStlModele.js';
const DOM = 'RMN du proton : attribuer et identifier';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const RMNS_ANA = [
  { id: 'rmns-ana-signaux', domaine: DOM, titre: 'Compter les signaux d’un ester',
    enonce: 'On enregistre le spectre RMN ¹H de l’éthanoate d’éthyle CH₃–CO–O–CH₂–CH₃.', q: 'Combien de signaux compte ce spectre ?', options: [
      V('3 signaux : CH₃CO, OCH₂ et CH₃', 'Trois groupes de H équivalents : CH₃CO (3 H), OCH₂ (2 H) et CH₃ de l’éthyle (3 H).'),
      F('2 signaux : un par groupe CH₃ de la molécule', 'Les deux CH₃ ne sont pas équivalents (l’un est lié à C=O, l’autre à CH₂), et le CH₂ donne lui aussi un signal.'),
      F('8 signaux : un par atome d’hydrogène', 'Des H équivalents donnent un seul signal : on ne compte pas un signal par H.'),
      F('4 signaux : un par atome de carbone', 'On compte des groupes de H équivalents, pas des atomes de carbone : le carbone du C=O ne porte aucun H.'),
    ] },
  { id: 'rmns-ana-multiplicite', domaine: DOM, titre: 'Multiplicité du CH₂ central',
    enonce: 'Le 1,3-dichloropropane Cl–CH₂–CH₂–CH₂–Cl donne deux signaux. On s’intéresse à celui du CH₂ central (2 H).', q: 'Quelle est la multiplicité du signal du CH₂ central ?', options: [
      V('un quintuplet : il a 4 H voisins (2 + 2)', 'Chaque CH₂Cl voisin porte 2 H : n = 4, donc n + 1 = 5 raies.'),
      F('un triplet : il a 2 H voisins', 'Il y a un CH₂Cl de chaque côté : 2 H + 2 H = 4 H voisins, pas 2.'),
      F('un singulet : ses deux H sont équivalents', 'Des H équivalents ne se couplent pas entre eux, mais ceux-ci ont des voisins (les H des CH₂Cl) : le signal n’est pas un singulet.'),
      F('un sextuplet : il compte 2 + 4 H voisins', 'Un groupe ne se compte pas lui-même ; seuls ses voisins comptent : n = 4, donc 5 raies.'),
    ] },
  { id: 'rmns-ana-delta', domaine: DOM, titre: 'Le groupe de H le plus déblindé d’un ester',
    enonce: 'Le butanoate d’éthyle CH₃–CH₂–CH₂–CO–O–CH₂–CH₃ donne un spectre RMN ¹H de cinq signaux.', q: 'Quel groupe de H a le déplacement chimique δ le plus grand ?', options: [
      V('le CH₂ lié à l’atome d’oxygène (O–CH₂)', 'Un carbone lié à O est le plus appauvri en électrons : ses H ont un δ élevé (zone 3,3 à 4,4 ppm).'),
      F('le CH₂ voisin du groupe C=O', 'Ces H sont dans la zone 2,0 à 2,7 ppm : moins déblindés que ceux d’un carbone lié à O.'),
      F('le CH₃ au bout de la chaîne propyle', 'Éloigné des atomes électronégatifs, il a le δ le plus petit (vers 1 ppm).'),
      F('aucun : tous les H sont liés à du carbone, donc au même δ', 'Le δ dépend de l’environnement : la proximité d’un atome électronégatif le fait augmenter.'),
    ] },
  { id: 'rmns-ana-isomere', domaine: DOM, titre: 'Quel isomère ne donne qu’un signal ?',
    enonce: 'Trois isomères de formule brute C₃H₆Cl₂ : Cl–CH₂–CH₂–CH₂–Cl, CH₃–CCl₂–CH₃ et CHCl₂–CH₂–CH₃.', q: 'Lequel donne un spectre RMN ¹H d’un seul signal ?', options: [
      V('CH₃–CCl₂–CH₃ : ses six H sont équivalents', 'Les deux CH₃ sont équivalents par symétrie et n’ont aucun H voisin : un singulet de 6 H.'),
      F('Cl–CH₂–CH₂–CH₂–Cl : tous ses H sont des H de CH₂', 'Deux groupes : les deux CH₂Cl (4 H) et le CH₂ central (2 H) donnent deux signaux.'),
      F('CHCl₂–CH₂–CH₃ : tous ses H se trouvent près de Cl', 'Trois groupes de H différents (1 H, 2 H, 3 H) donnent trois signaux.'),
      F('aucun : un spectre compte toujours au moins deux signaux', 'Une molécule symétrique peut ne donner qu’un seul signal.'),
    ] },
];

export const RMNS_VAL = [
  P({ id: 'rmns-val-integration', domaine: DOM, niveau: 2, titre: 'Nombres de H déduits d’une intégration', plausible: false,
    enonce: 'Le spectre RMN ¹H d’un composé de formule brute C₄H₈O₂ présente trois signaux dont les paliers d’intégration mesurent 12 mm, 8 mm et 12 mm. Un élève conclut : « Les trois signaux correspondent à 6 H, 4 H et 6 H. »',
    reperes: [['Formule brute', 'C₄H₈O₂ (8 H)'], ['Paliers', '12 mm ; 8 mm ; 12 mm']],
    ver: 'Hauteur totale : 32 mm ; nombre de H = frac(8 × 12|32) = 3, frac(8 × 8|32) = 2 et frac(8 × 12|32) = 3. Le total de l’élève (16 H) est le double de celui de la molécule.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('la somme de ses nombres de H (16) dépasse celle de la molécule (8)', 'Les nombres de H des signaux s’additionnent pour donner le nombre total de H de la formule brute : ici 8, soit 3 H, 2 H et 3 H.'),
      F('les hauteurs des paliers n’ont aucun lien avec le nombre de H des signaux', 'La hauteur d’un palier est proportionnelle au nombre de H du signal.'),
      F('il aurait dû diviser chaque hauteur par la plus grande hauteur (12 mm)', 'Diviser par la plus grande hauteur ne donne pas un nombre de H : il faut utiliser la hauteur totale et le nombre total de H.'),
    ] }),
  P({ id: 'rmns-val-attribution', domaine: DOM, niveau: 1, titre: 'Attribuer un singulet du propanoate de méthyle', plausible: true,
    enonce: 'Dans le propanoate de méthyle CH₃–CH₂–CO–O–CH₃, un élève attribue le singulet de 3 H à 3,67 ppm au CH₃ lié à l’oxygène : « 3 H, donc un CH₃ ; aucun H voisin, donc un singulet ; δ élevé, donc lié à O. »',
    reperes: [['Signal', '3,67 ppm, singulet, 3 H'], ['Zone d’un carbone lié à O', '3,3 à 4,4 ppm']],
    ver: 'Le raisonnement est correct : le CH₃ lié à O n’a pas de H voisin (son voisin est l’oxygène), et δ est dans la zone d’un carbone lié à O.',
    q2: 'Pourquoi ce CH₃ donne-t-il un singulet ?',
    options: [
      V('son voisin est l’oxygène, qui ne porte pas de H', 'Sans H voisin, n = 0 : n + 1 = 1 raie.'),
      F('parce qu’un groupe CH₃ donne toujours un singulet, quel que soit son voisin', 'Un CH₃ voisin d’un CH₂ donne un triplet : la multiplicité dépend des voisins.'),
      F('parce que les trois H du CH₃ se couplent entre eux', 'Des H équivalents ne se couplent pas entre eux : ce n’est pas la cause du singulet.'),
    ] }),
];

// ---------- S'APP : intégration d'un spectre ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const fr = x => String(x).replace('.', ',');
const A3 = ['acetateethyle', 'propanoatemethyle', 'methylbutanone', 'dimethylpentanone'].map(id => MOL[id]);
const gen = () => {
  const m = tire(A3), k = tire([4, 5, 6]), i = tire([0, 1, 2]);
  return { id: m.id, k, i, h: m.liste.map(x => Math.round(x.n * k * (1 + (Math.random() - 0.5) * 0.03) * 10) / 10) };
};
export const RMNS_SAPP = [
  {
    id: 'rmns-sapp-integration', domaine: DOM, titre: 'Un spectre RMN : nombre de H d’un signal', noms: ['Hauteur totale des paliers', 'Nombre de H du signal'],
    gen,
    build: epure((p, q) => {
      const m = MOL[p.id], x = m.liste[p.i], H = p.h.reduce((s, v) => s + v, 0);
      const tokens = {
        N: tok(`${m.N} H au total`, 'Nombre total de H de la molécule', m.N, 'H'), nu: tok('400 MHz', 'Fréquence du spectromètre', 400, 'MHz'),
        h0: tok(`${fr(p.h[0].toFixed(1))} mm`, `Hauteur du palier du signal à ${fr(m.liste[0].d.toFixed(2))} ppm`, p.h[0], 'mm'),
        h1: tok(`${fr(p.h[1].toFixed(1))} mm`, `Hauteur du palier du signal à ${fr(m.liste[1].d.toFixed(2))} ppm`, p.h[1], 'mm'),
        h2: tok(`${fr(p.h[2].toFixed(1))} mm`, `Hauteur du palier du signal à ${fr(m.liste[2].d.toFixed(2))} ppm`, p.h[2], 'mm'),
        d: tok(`${fr(x.d.toFixed(2))} ppm`, 'Déplacement chimique du signal étudié', x.d, 'ppm'),
      };
      const debut = ['Un composé de formule brute ', m.brute, ' (', T('N'), ') est étudié par RMN ¹H sur un spectromètre de ', T('nu'), '. Les trois paliers de la courbe d’intégration mesurent ', T('h0'), ', ', T('h1'), ' et ', T('h2'), ' (de la gauche vers la droite). '];
      const ht = ['h0', 'h1', 'h2'];
      if (q === 0) return { tokens, derivees: ['H = h₁ + h₂ + h₃'], texte: [...debut, 'Quelle est la hauteur totale H de la courbe d’intégration, en mm ?'], utiles: ht,
        raisons: { N: 'Le nombre total de H ne sert pas à additionner les hauteurs.', nu: 'La fréquence du spectromètre ne sert pas à additionner les hauteurs.', d: 'Le déplacement chimique ne sert pas à additionner des hauteurs.' },
        cherche: { bonne: 'La hauteur totale des paliers (en mm)', faux: ['Le nombre de H du premier signal', 'La multiplicité du premier signal', 'Le déplacement chimique du premier signal'] },
        manque: null, solution: { txt: 'H = h₁ + h₂ + h₃', val: H, u: 'mm' } };
      return { tokens, derivees: ['H = h₁ + h₂ + h₃', 'nombre de H = N × h ÷ H'], texte: [...debut, 'Le signal étudié est celui à ', T('d'), ', de palier ', T('h' + p.i), '. Combien de H ce signal représente-t-il ?'], utiles: ['N', ...ht],
        raisons: { nu: 'La fréquence du spectromètre ne sert pas à compter les H.', d: 'Le déplacement chimique sert à repérer le signal, pas à compter ses H.' },
        cherche: { bonne: 'Le nombre de H du signal (nombre entier)', faux: ['La multiplicité du signal', 'Le type de proton d’après la banque de données', 'La hauteur totale des paliers (en mm)'] },
        manque: null, solution: { txt: 'nombre de H = N × h ÷ H', val: x.n, u: 'H' } };
    }),
  },
];
