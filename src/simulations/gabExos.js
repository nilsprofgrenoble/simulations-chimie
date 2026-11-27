// Exercices ANA, VAL et S'APP de la simulation 317 « Choisir un filtre : spectre, bande passante et gabarit » (terminale STL, SPCL, Systèmes et procédés). Préfixe : gab-.
// Capacités visées (jamais affichées) : proposer un gabarit de filtre pour répondre à un cahier des charges ; exploiter le spectre d'un signal ; caractériser un filtre.
import * as M from './filtreModele.js';
const DOM = 'Filtrage et amplification de tension';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const GAB_ANA = [
  { id: 'gab-ana-spectre', domaine: DOM, titre: 'Compter les raies d’un spectre',
    enonce: 'Un signal est la somme d’une sinusoïde de fréquence 200 Hz et d’une sinusoïde de fréquence 3 kHz, sans composante continue.', q: 'Que montre le spectre de ce signal ?', options: [
      V('deux raies, l’une à 200 Hz et l’autre à 3 kHz', 'Chaque sinusoïde donne sa propre raie, placée à sa fréquence.'),
      F('une seule raie, placée à 3,2 kHz', 'Les fréquences ne s’additionnent pas : chaque sinusoïde garde sa fréquence et sa raie.'),
      F('une seule raie, à 200 Hz, la plus basse fréquence', 'Les deux sinusoïdes sont présentes : le spectre contient les deux raies.'),
      F('trois raies, dont une à 0 Hz', 'Une raie à 0 Hz n’existe que s’il y a une composante continue, ce qui n’est pas le cas ici.'),
    ] },
  { id: 'gab-ana-continu', domaine: DOM, titre: 'La composante continue dans le spectre',
    enonce: 'Un signal oscille autour d’une valeur moyenne de 2 V : on lui a ajouté une tension continue de 2 V.', q: 'Comment cette composante continue apparaît-elle dans le spectre ?', options: [
      V('par une raie à 0 Hz, de hauteur égale à la valeur moyenne', 'Une tension constante a une fréquence nulle : c’est la raie à 0 Hz.'),
      F('par une raie à la fréquence la plus élevée du signal', 'La composante continue ne varie pas : sa fréquence est nulle, pas la plus élevée.'),
      F('elle n’apparaît pas : le spectre ne montre que les sinusoïdes', 'Le spectre montre aussi la composante continue, sous forme d’une raie à 0 Hz.'),
      F('par une raie à 2 Hz, car la valeur moyenne est 2 V', 'La position d’une raie est une fréquence ; la valeur de 2 V donne sa hauteur, pas sa position.'),
    ] },
  { id: 'gab-ana-type', domaine: DOM, titre: 'Choisir le type de filtre',
    enonce: 'Un capteur donne une sinusoïde utile de fréquence 2 kHz. Le signal est perturbé par un parasite à 50 Hz venant du secteur. On veut garder la raie utile et supprimer le parasite.', q: 'Quel type de filtre faut-il utiliser ?', options: [
      V('un passe-haut', 'Le parasite est plus grave que la raie utile : on garde les hautes fréquences et on supprime les basses.'),
      F('un passe-bas', 'Un passe-bas garderait le parasite de 50 Hz et supprimerait la raie utile de 2 kHz.'),
      F('un coupe-bande centré sur 2 kHz', 'Il supprimerait justement la raie utile qu’on veut garder.'),
      F('un passe-bande centré sur 50 Hz', 'Il garderait le parasite et supprimerait la raie utile.'),
    ] },
  { id: 'gab-ana-cascade', domaine: DOM, titre: 'Associer deux filtres en cascade',
    enonce: 'On place à la suite l’un de l’autre un filtre passe-haut de fréquence de coupure 200 Hz, puis un filtre passe-bas de fréquence de coupure 5 kHz.', q: 'Quel filtre obtient-on ?', options: [
      V('un passe-bande, qui garde les fréquences entre 200 Hz et 5 kHz', 'Le passe-haut supprime les fréquences inférieures à 200 Hz, le passe-bas celles qui dépassent 5 kHz : il reste la bande entre les deux.'),
      F('un coupe-bande, qui supprime les fréquences entre 200 Hz et 5 kHz', 'Dans cette association, ce sont les fréquences hors de la bande qui sont supprimées.'),
      F('un passe-bas de fréquence de coupure 5 kHz', 'Le passe-haut supprime aussi les basses fréquences : ce n’est pas un passe-bas.'),
      F('un passe-haut de fréquence de coupure 200 Hz', 'Le passe-bas supprime aussi les hautes fréquences : ce n’est pas un passe-haut.'),
    ] },
];

export const GAB_VAL = [
  P({ id: 'gab-val-cascade', domaine: DOM, niveau: 2, titre: 'Facteur d’amplification d’une cascade', plausible: false,
    enonce: 'À une fréquence donnée, un filtre passe-haut seul a un facteur d’amplification A₁ = 0,80 et un filtre passe-bas seul A₂ = 0,50. On les place en cascade pour faire un passe-bande. Un élève écrit : « A = A₁ + A₂ = 1,30 : le passe-bande amplifie ce signal. »',
    reperes: [['A₁', '0,80'], ['A₂', '0,50'], ['Composants', 'filtres passifs']],
    ver: 'En cascade, les facteurs d’amplification se multiplient : A = A₁ × A₂ = 0,40. Un filtre passif n’amplifie jamais : A ≤ 1.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a additionné A₁ et A₂ au lieu de les multiplier', 'Pour deux filtres en cascade, A = A₁ × A₂, soit ici 0,40.'),
      F('il aurait dû soustraire A₂ de A₁', 'Aucune addition ni soustraction : les facteurs d’amplification se multiplient.'),
      F('le passe-bande peut bien amplifier si A₁ est grand', 'Un filtre passif n’amplifie pas : A ≤ 1.'),
    ] }),
  P({ id: 'gab-val-gabarit', domaine: DOM, niveau: 2, titre: 'Un gabarit trop exigeant', plausible: false,
    enonce: 'Un technicien utilise un passe-bas RC du premier ordre de fréquence de coupure 1 kHz. Il doit garder une raie utile à 800 Hz (il faut A ≥ 0,9) et supprimer un parasite à 1,2 kHz (il faut A ≤ 0,1). Il affirme que ce filtre convient.',
    reperes: [['fc', '1 kHz'], ['Raie utile', '800 Hz, A ≥ 0,9'], ['Parasite', '1,2 kHz, A ≤ 0,1']],
    ver: 'Avec un filtre du premier ordre, A diminue lentement autour de fc : à 800 Hz A ≈ 0,78 (< 0,9) et à 1,2 kHz A ≈ 0,64 (> 0,1). Il faut des fréquences beaucoup plus éloignées (facteur 20 environ), ou un filtre d’ordre supérieur.',
    q2: 'Pourquoi ce filtre ne convient-il pas ?',
    options: [
      V('la raie utile et le parasite sont trop proches en fréquence pour un filtre du premier ordre', 'La courbe A(f) de ce filtre est trop progressive : elle ne peut pas passer de 0,9 à 0,1 sur un si petit intervalle.'),
      F('il faudrait un passe-haut', 'Le parasite est plus aigu que la raie utile : un passe-bas est le bon type.'),
      F('fc doit être égale à la fréquence du parasite', 'À fc, A vaut déjà 0,7 : le parasite ne serait pas supprimé.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const g2 = v => M.nbf(v, 2);
export const GAB_SAPP = [
  {
    id: 'gab-sapp-raies', domaine: DOM, titre: 'Amplitude des raies de sortie d’un filtre', noms: ['Amplitude de la raie utile en sortie', 'Amplitude de la raie parasite en sortie'],
    gen: () => ({ a1: tire([1, 1.5, 2, 2.5, 3]), A1: tire([0.9, 0.95, 0.98]), a2: tire([0.5, 1, 1.5, 2]), A2: tire([0.05, 0.1, 0.2]), f1: tire([200, 500, 1000]), f2: tire([20000, 50000]) }),
    build: epure((p, q) => {
      const s1 = p.a1 * p.A1, s2 = p.a2 * p.A2;
      const tokens = {
        f1: tok(`${p.f1} Hz`, 'Fréquence de la raie utile', p.f1, 'Hz'), a1: tok(`${M.nbf(p.a1, 1)} V`, 'Amplitude de la raie utile à l’entrée', p.a1, 'V'), A1: tok(`${g2(p.A1)}`, 'Facteur d’amplification à la fréquence de la raie utile', p.A1, ''),
        f2: tok(`${p.f2 / 1000} kHz`, 'Fréquence du parasite', p.f2, 'Hz'), a2: tok(`${M.nbf(p.a2, 1)} V`, 'Amplitude du parasite à l’entrée', p.a2, 'V'), A2: tok(`${g2(p.A2)}`, 'Facteur d’amplification à la fréquence du parasite', p.A2, ''),
      };
      const texte = ['Le spectre d’un signal a une raie utile à ', T('f1'), ', d’amplitude ', T('a1'), ', et un parasite à ', T('f2'), ', d’amplitude ', T('a2'), '. Un filtre passe-bas a un facteur d’amplification A = ', T('A1'), ' à la fréquence de la raie utile et A = ', T('A2'), ' à celle du parasite. ',
        q === 0 ? 'Quelle est l’amplitude de la raie utile à la sortie du filtre ?' : 'Quelle est l’amplitude du parasite à la sortie du filtre ?'];
      return q === 0 ? { tokens, derivees: ['Raie de sortie = A × raie d’entrée'], texte, utiles: ['a1', 'A1'],
        raisons: { f1: 'La fréquence situe la raie sur le spectre mais ne sert pas au calcul.', f2: 'Le parasite ne concerne pas cette question.', a2: 'Le parasite ne concerne pas cette question.', A2: 'Ce facteur d’amplification concerne le parasite, pas la raie utile.' },
        cherche: { bonne: 'L’amplitude de la raie utile à la sortie (en V)', faux: ['L’amplitude du parasite à la sortie', 'Le facteur d’amplification du filtre', 'La fréquence de coupure du filtre'] }, manque: null, solution: { txt: 'a₁ × A₁', val: s1, u: 'V' } }
        : { tokens, derivees: ['Raie de sortie = A × raie d’entrée'], texte, utiles: ['a2', 'A2'],
        raisons: { f1: 'La fréquence situe la raie sur le spectre mais ne sert pas au calcul.', f2: 'La fréquence situe la raie sur le spectre mais ne sert pas au calcul.', a1: 'La raie utile ne concerne pas cette question.', A1: 'Ce facteur d’amplification concerne la raie utile, pas le parasite.' },
        cherche: { bonne: 'L’amplitude du parasite à la sortie (en V)', faux: ['L’amplitude de la raie utile à la sortie', 'Le facteur d’amplification du filtre', 'La fréquence de coupure du filtre'] }, manque: null, solution: { txt: 'a₂ × A₂', val: s2, u: 'V' } };
    }),
  },
  {
    id: 'gab-sapp-cascade', domaine: DOM, titre: 'Passe-bande obtenu en cascade', noms: ['Facteur d’amplification du passe-bande', 'Amplitude de la sortie du passe-bande'],
    gen: () => ({ A1: tire([0.9, 0.95, 0.8]), A2: tire([0.9, 0.95, 0.85]), ue: tire([1, 1.5, 2, 3]), f: tire([1000, 2000, 5000]) }),
    build: epure((p, q) => {
      const A = p.A1 * p.A2, us = A * p.ue;
      const tokens = { f: tok(`${p.f / 1000} kHz`, 'Fréquence du signal', p.f, 'Hz'), A1: tok(g2(p.A1), 'Facteur d’amplification du passe-haut', p.A1, ''), A2: tok(g2(p.A2), 'Facteur d’amplification du passe-bas', p.A2, ''), ue: tok(`${M.nbf(p.ue, 1)} V`, 'Amplitude de la tension d’entrée', p.ue, 'V') };
      const debut = ['Un passe-bande est obtenu en plaçant en cascade un passe-haut et un passe-bas. À ', T('f'), ', le passe-haut seul a A₁ = ', T('A1'), ' et le passe-bas seul a A₂ = ', T('A2'), '. '];
      return q === 0 ? { tokens, derivees: ['A = A₁ × A₂'], texte: [...debut, 'Quel est le facteur d’amplification du passe-bande à cette fréquence ?'], utiles: ['A1', 'A2'],
        raisons: { f: 'La fréquence précise où A₁ et A₂ ont été relevés ; elle ne sert pas au calcul.', ue: 'L’amplitude d’entrée ne sert pas pour cette question.' },
        cherche: { bonne: 'Le facteur d’amplification du passe-bande (sans unité)', faux: ['L’amplitude de la sortie', 'La somme des deux facteurs d’amplification', 'La fréquence de coupure du passe-bande'] }, manque: null, solution: { txt: 'A = A₁ × A₂', val: A, u: '' } }
        : { tokens, derivees: ['A = A₁ × A₂', 'Us,max = A × Ue,max'], texte: [...debut, 'On applique une tension sinusoïdale d’amplitude Ue,max = ', T('ue'), '. Quelle est l’amplitude de la tension de sortie ?'], utiles: ['A1', 'A2', 'ue'],
        raisons: { f: 'La fréquence précise où A₁ et A₂ ont été relevés ; elle ne sert pas au calcul.' },
        cherche: { bonne: 'L’amplitude de la sortie du passe-bande (en V)', faux: ['Le facteur d’amplification du passe-bande', 'La somme des deux amplitudes de sortie', 'La fréquence de coupure du passe-bande'] }, manque: null, solution: { txt: 'Us,max = A₁ × A₂ × Ue,max', val: us, u: 'V' } };
    }),
  },
];
