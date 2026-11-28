// Exercices ANA, VAL et S'APP de la simulation 310 « Radioactivité : désintégrations, loi de décroissance et activité » (TSTL, PCM, séquence 6). Préfixe : rpm-.
// Capacités visées (jamais affichées) : types de radioactivité et conservation, constante λ et demi-vie, loi de décroissance, activité en becquerels, protection.
// Situations originales : aucun des noyaux ni des situations des documents du cours.
import { LN2 } from './radPcmModele.js';
const DOM = 'Radioactivité : désintégrations, loi de décroissance et activité';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const RPM_ANA = [
  { id: 'rpm-ana-type', domaine: DOM, titre: 'Noyau fils d’un émetteur β⁻',
    enonce: 'Le phosphore 32, ³²₁₅P, est un émetteur β⁻. Dans une radioactivité β⁻, un neutron du noyau se transforme en proton et un électron est émis.', q: 'Le noyau fils est :', options: [
      V('du soufre 32, ³²₁₆S', 'Un neutron devient un proton : A ne change pas et Z augmente de 1 (15 + 1 = 16, le soufre).'),
      F('du silicium 32, ³²₁₄Si', 'Z diminuerait de 1 : ce serait une radioactivité β⁺, pas β⁻.'),
      F('de l’aluminium 28, ²⁸₁₃Al, avec un noyau d’hélium émis', 'Ce serait une désintégration α : A baisse de 4 et Z de 2.'),
      F('du phosphore 31, ³¹₁₅P', 'Le noyau ne perd pas de nucléon en β⁻ : A reste égal à 32 et Z change.'),
    ] },
  { id: 'rpm-ana-lambda', domaine: DOM, titre: 'Demi-vie courte, constante de désintégration grande',
    enonce: 'Deux échantillons contiennent chacun le même nombre de noyaux radioactifs au départ : l’un de noyaux X, de demi-vie 2 h, l’autre de noyaux Y, de demi-vie 20 h. On compare les constantes de désintégration λ(X) et λ(Y).', q: 'Quelle affirmation est correcte ?', options: [
      V('λ(X) est plus grande que λ(Y), car t½ = frac(ln 2|λ)', 'λ et t½ sont inversement proportionnelles : la demi-vie la plus courte correspond au λ le plus grand.'),
      F('λ(X) est plus petite que λ(Y), car X disparaît plus vite', 'C’est l’inverse : un noyau qui disparaît vite a une grande probabilité de se désintégrer par seconde, donc un λ grand.'),
      F('λ(X) et λ(Y) sont égales, car les nombres de noyaux sont égaux', 'λ dépend du noyau, pas du nombre de noyaux : ici elle est liée à la demi-vie.'),
      F('on ne peut pas comparer sans connaître le nombre de noyaux', 'La relation λ = frac(ln 2|t½) suffit pour comparer deux noyaux.'),
    ] },
  { id: 'rpm-ana-fraction', domaine: DOM, titre: 'Après plusieurs demi-vies',
    enonce: 'Un échantillon contient au départ N₀ noyaux radioactifs identiques, de demi-vie t½. On le laisse décroître pendant une durée égale à 3 t½, sans autre apport de noyaux radioactifs.', q: 'À la fin de cette durée, la proportion de noyaux restants est environ :', options: [
      V('un huitième (12,5 %)', 'Chaque demi-vie divise N par 2 : frac(N₀|2), frac(N₀|4) puis frac(N₀|8).'),
      F('un sixième (17 %)', 'On ne perd pas la moitié de N₀ trois fois de façon indépendante : chaque fois on divise le reste par 2.'),
      F('plus rien : au bout de 3 t½ tout est désintégré', 'Il reste toujours des noyaux : N décroît selon une exponentielle, sans jamais s’annuler en un temps fini.'),
      F('un tiers (33 %)', 'Cela correspondrait à une perte de la moitié seulement après 3 t½ : c’est la valeur d’une seule demi-vie qui est la moitié.'),
    ] },
  { id: 'rpm-ana-protection', domaine: DOM, titre: 'Se protéger d’une source γ',
    enonce: 'Un technicien doit intervenir près d’une source scellée qui émet un rayonnement γ très pénétrant. Il peut jouer sur la distance, sur un écran et sur la durée de l’intervention.', q: 'Quelle consigne réduit le mieux son exposition ?', options: [
      V('rester loin, mettre du plomb épais et intervenir peu de temps', 'Les trois leviers se cumulent ; le plomb épais atténue fortement le rayonnement γ, sans l’arrêter complètement.'),
      F('mettre une simple feuille de papier devant la source', 'Le rayonnement γ traverse le papier : seuls les rayonnements α sont arrêtés par une feuille.'),
      F('rester près de la source, mais intervenir très longtemps avec des gants', 'Plus on est près et longtemps, plus l’exposition augmente ; les gants n’arrêtent pas le rayonnement γ.'),
      F('mettre quelques millimètres d’aluminium : l’écran arrête tous les rayonnements', 'L’aluminium arrête les particules β mais pas le rayonnement γ.'),
    ] },
];

export const RPM_VAL = [
  P({ id: 'rpm-val-lambda', domaine: DOM, niveau: 2, titre: 'Constante de désintégration d’un noyau', plausible: false,
    enonce: 'Un noyau radioactif a une demi-vie t½ = 5,0 h. Un élève écrit : « λ = frac(t½|ln 2) = frac(5,0|0,693) = 7,2 h⁻¹. »',
    reperes: [['Valeur de ln 2', '0,693'], ['Demi-vie', 'durée au bout de laquelle la moitié des noyaux a disparu']],
    ver: 'La relation est λ = frac(ln 2|t½) = frac(0,693|5,0) = 0,14 h⁻¹. Un résultat de 7,2 h⁻¹ signifierait que la moitié des noyaux disparaît en moins d’une dizaine de minutes, ce qui contredit une demi-vie de 5 h.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a inversé la relation : λ = frac(ln 2|t½) et non frac(t½|ln 2)', 'En posant N(t½) = frac(N₀|2), on obtient λ t½ = ln 2, donc λ = frac(ln 2|t½) = 0,14 h⁻¹.'),
      F('il doit exprimer λ en secondes et non en heures', 'Les deux unités sont possibles : le défaut vient de la relation, pas de l’unité.'),
      F('il oublie de multiplier par le nombre initial de noyaux N₀', 'λ ne dépend pas de N₀ : c’est une propriété du noyau.'),
    ] }),
  P({ id: 'rpm-val-activite', domaine: DOM, niveau: 1, titre: 'Activité d’un échantillon', plausible: true,
    enonce: 'Un échantillon contient N = 3,0 × 10⁸ noyaux radioactifs de constante de désintégration λ = 2,0 × 10⁻⁵ s⁻¹. Un élève calcule : « A = λ N = 2,0 × 10⁻⁵ × 3,0 × 10⁸ = 6,0 × 10³ Bq. »',
    reperes: [['Nombre de noyaux N', '3,0 × 10⁸'], ['Constante λ', '2,0 × 10⁻⁵ s⁻¹']],
    ver: 'Le calcul est correct : λ est en s⁻¹, donc A = λ N est en désintégrations par seconde, c’est-à-dire en becquerels : 6,0 × 10³ Bq.',
    q2: 'Pourquoi le résultat est-il bien exprimé en becquerels ?',
    options: [
      V('car λ est en s⁻¹ : A est un nombre de désintégrations par seconde', 'Le becquerel vaut 1 désintégration par seconde : avec λ en s⁻¹, A = λ N est en Bq.'),
      F('car N est exprimé en moles, et le becquerel est une quantité de matière', 'N est un nombre de noyaux ; le becquerel est une activité (par seconde), pas une quantité de matière.'),
      F('car le becquerel est l’unité de toutes les grandeurs de décroissance', 'La demi-vie s’exprime en unité de temps et λ en s⁻¹ : seul A se mesure en becquerels.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, '\u00a0');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const fr = x => String(x).replace('.', ',');
const sci = (x, cs = 1) => { const [m, e] = Number(x).toExponential(cs).split('e'); return `${fr(m)} × 10^${Number(e)}`; };

export const RPM_SAPP = [
  {
    id: 'rpm-sapp-loi', domaine: DOM, titre: 'Un échantillon radioactif : λ et noyaux restants', noms: ['Constante de désintégration', 'Nombre de noyaux restants'],
    gen: () => { for (;;) { const p = { th: tire([4, 6, 8, 12, 24]), N0: tire([2.0e6, 5.0e6, 8.0e6]), t: tire([10, 15, 20, 30, 36]), T: tire([20, 37]) }; if (Math.abs(p.t / p.th - Math.round(p.t / p.th)) > 0.1) return p; } },
    build: epure((p, q) => {
      const tokens = {
        th: tok(`${p.th} h`, 'Demi-vie du noyau', p.th, 'h'), N0: tok(`${sci(p.N0, 1)} noyaux`, 'Nombre initial de noyaux', p.N0, ''), t: tok(`${p.t} h`, 'Durée écoulée', p.t, 'h'), T: tok(`${p.T} °C`, 'Température de l’échantillon', p.T, '°C'),
      };
      const l = LN2 / p.th, N = p.N0 * Math.exp(-l * p.t);
      const debut = ['Un échantillon contient ', T('N0'), ' radioactifs identiques, de demi-vie ', T('th'), '. L’échantillon est conservé à ', T('T'), ' pendant ', T('t'), '. ', 'On suppose qu’aucun noyau radioactif n’est ajouté. '];
      if (q === 0) return { tokens, derivees: ['λ = frac(ln 2|t½)'], texte: [...debut, 'Quelle est la constante de désintégration λ, en h⁻¹ ?'], utiles: ['th'],
        raisons: { N0: 'Le nombre initial de noyaux ne change pas λ : c’est une propriété du noyau.', t: 'La durée écoulée ne sert pas à calculer λ.', T: 'La température ne modifie pas la décroissance radioactive.' },
        cherche: { bonne: 'La constante de désintégration λ (en h⁻¹)', faux: ['Le nombre de noyaux restants', 'L’activité de l’échantillon (en Bq)', 'La durée pour que la moitié des noyaux disparaisse'] },
        manque: null, solution: { txt: 'λ = frac(ln 2|t½)', val: l, u: 'h⁻¹' } };
      return { tokens, derivees: ['λ = frac(ln 2|t½)', 'N(t) = N₀ e^(−λt)'], texte: [...debut, 'Combien reste-t-il de noyaux radioactifs à la fin de cette durée ?'], utiles: ['th', 'N0', 't'],
        raisons: { T: 'La température ne modifie pas la décroissance radioactive.' },
        cherche: { bonne: 'Le nombre de noyaux restants', faux: ['Le nombre de noyaux désintégrés', 'L’activité de l’échantillon (en Bq)', 'La constante de désintégration λ'] },
        manque: null, solution: { txt: 'N(t) = N₀ e^(−λt)', val: N, u: 'noyaux' } };
    }),
  },
  {
    id: 'rpm-sapp-activite', schema: () => ({ type: 'comptageRadio' }), domaine: DOM, titre: 'Un échantillon radioactif : activité et comptage', noms: ['Activité', 'Nombre de désintégrations comptées'],
    gen: () => ({ th: tire([2, 4, 6, 8, 12]), N: tire([2.0e9, 4.0e9, 6.0e9, 8.0e9]), dt: tire([30, 60, 120]), m: tire([1.0, 2.5, 5.0]) }),
    build: epure((p, q) => {
      const tokens = {
        th: tok(`${p.th} h`, 'Demi-vie du noyau', p.th, 'h'), N: tok(`${sci(p.N, 1)} noyaux`, 'Nombre de noyaux radioactifs', p.N, ''), dt: tok(`${p.dt} s`, 'Durée de comptage', p.dt, 's'), m: tok(`${fr(p.m.toFixed(1))} g`, 'Masse de l’échantillon', p.m, 'g'),
      };
      const l = LN2 / p.th / 3600, A = l * p.N, n = A * p.dt;
      const debut = ['Un échantillon de masse ', T('m'), ' contient ', T('N'), ' radioactifs identiques, de demi-vie ', T('th'), '. Un compteur idéal détecte toutes les désintégrations. On suppose l’activité constante pendant la mesure. '];
      if (q === 0) return { tokens, derivees: ['λ = frac(ln 2|t½), en s⁻¹', 'A = λ N'], texte: [...debut, 'Quelle est l’activité A de l’échantillon, en Bq ?'], utiles: ['th', 'N'],
        raisons: { m: 'La masse de l’échantillon ne sert pas : on connaît déjà le nombre de noyaux.', dt: 'La durée de comptage servira pour le nombre de désintégrations comptées, pas pour l’activité.' },
        cherche: { bonne: 'L’activité de l’échantillon (en Bq)', faux: ['Le nombre de désintégrations comptées', 'La constante de désintégration λ (en h⁻¹)', 'Le nombre de noyaux restants après une demi-vie'] },
        manque: null, solution: { txt: 'A = λ N, avec λ en s⁻¹', val: A, u: 'Bq' } };
      return { tokens, derivees: ['λ = frac(ln 2|t½), en s⁻¹', 'A = λ N', 'n = A × Δt'], texte: [...debut, 'Combien de désintégrations le compteur enregistre-t-il pendant ', T('dt'), ' ?'], utiles: ['th', 'N', 'dt'],
        raisons: { m: 'La masse de l’échantillon ne sert pas : on connaît déjà le nombre de noyaux.' },
        cherche: { bonne: 'Le nombre de désintégrations comptées', faux: ['L’activité de l’échantillon (en Bq)', 'Le nombre de noyaux restants', 'La demi-vie de l’échantillon'] },
        manque: null, solution: { txt: 'n = A × Δt', val: n, u: 'désintégrations' } };
    }),
  },
];
