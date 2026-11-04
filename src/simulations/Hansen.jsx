import { useSignalerMode, declarerDefis, SuiviDefi, useCompteurDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { HansenExploration, GraphesHansen } from "./HansenExploration";
import { cardStyle, fmt, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE } from "../commun";
import { Pic } from "../Pictos";

const SIM_ID = 4;
declarerDefis(SIM_ID, [['principal', 'Formuler le mélange de solvants du vernis'], ['selectif', 'Un dissolvant qui épargne le PMMA']]);

// ====================================================
// PARAMÈTRES DE SOLUBILITÉ DE HANSEN (BTS Métiers de la chimie)
// Parcours guidé et défi sur un exemple : la nitrocellulose d'un vernis à ongle. Exploration libre : la simulation d'origine (HansenExploration).
// Sphère de solubilité, distance Ra et RED ; mélanges de solvants (moyenne pondérée par les volumes) ;
// séchage : le solvant de loin le moins volatil reste en dernier dans le film ; il doit être un vrai solvant.
// ====================================================

// Solvants : δd, δp, δh (MPa½), pression de vapeur saturante à 20 °C (Pa), volume molaire (cm³/mol)
export const SOLVANTS = {
  ea: { nom: 'acétate d’éthyle', court: 'AE', d: 15.8, p: 5.3, h: 7.2, psat: 10000, vm: 98.5, famille: 'ester', color: '#2563eb' },
  ba: { nom: 'acétate de butyle', court: 'AB', d: 15.8, p: 3.7, h: 6.3, psat: 1070, vm: 132.5, famille: 'ester', color: '#7c3aed' },
  etoh: { nom: 'éthanol', court: 'EtOH', d: 15.8, p: 8.8, h: 19.4, psat: 5800, vm: 58.5, famille: 'alcool', color: '#dc2626' },
  ipa: { nom: 'isopropanol', court: 'IPA', d: 15.8, p: 6.1, h: 16.4, psat: 4400, vm: 76.8, famille: 'alcool', color: '#ea580c' },
};
// Deux jeux de paramètres pour la nitrocellulose : ils dépendent de la source et du grade (teneur en azote)
export const POLYMERES = {
  tp: { nom: 'données du TP', d: 17, p: 8.7, h: 9.3, R0: 9.0, source: 'Données fournies avec l’activité (source d’origine à préciser).' },
  hansen: { nom: 'moyenne citée par Hansen', d: 16.2, p: 14.1, h: 9.5, R0: 10.7, source: 'Moyenne de valeurs citées dans C. M. Hansen, Hansen Solubility Parameters: A User’s Handbook (2e éd., CRC Press, 2007).' },
};

// Second polymère du défi « sélectif » : le PMMA (verre acrylique), valeurs usuelles des tables de Hansen
export const PMMA = { nom: 'PMMA', d: 18.6, p: 10.5, h: 5.1, R0: 8.6 };
export const ra = (P, s) => Math.sqrt(4 * (s.d - P.d) ** 2 + (s.p - P.p) ** 2 + (s.h - P.h) ** 2);
// Paramètres d'un mélange : moyenne pondérée par les fractions volumiques (hypothèse)
export function melange(vol) {
  const tot = Object.values(vol).reduce((a, b) => a + b, 0) || 1;
  const m = { d: 0, p: 0, h: 0 };
  Object.entries(vol).forEach(([k, v]) => { const s = SOLVANTS[k]; m.d += v / tot * s.d; m.p += v / tot * s.p; m.h += v / tot * s.h; });
  return m;
}
// Le solvant qui reste en dernier pendant le séchage : celui dont la pression de vapeur est la plus faible, parmi ceux présents
export function dernierSolvant(vol) {
  const tot = Object.values(vol).reduce((a, b) => a + b, 0) || 1;
  const presents = Object.keys(vol).filter(k => vol[k] / tot >= 0.05).sort((a, b) => SOLVANTS[a].psat - SOLVANTS[b].psat);
  if (!presents.length) return null;
  const k = presents[0], suivant = presents[1];
  return { k, ecart: suivant ? SOLVANTS[suivant].psat / SOLVANTS[k].psat : Infinity };
}

function Hypotheses() {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Une sphère</strong> : on suppose que le domaine de solubilité est une sphère (avec le facteur empirique 4 devant Δδd). Le domaine réel est rarement aussi
        régulier : près de la frontière (RED entre 0,8 et 1,2 environ), la prévision est incertaine.</li>
      <li><strong>Les paramètres de la nitrocellulose dépendent de la source et du grade</strong> (teneur en azote) : deux jeux de valeurs sont proposés, et ils ne donnent pas
        les mêmes prévisions.</li>
      <li><strong>Mélanges</strong> : les paramètres d'un mélange sont la moyenne de ceux des solvants, pondérée par leurs fractions <em>volumiques</em>.</li>
      <li><strong>Volatilité</strong> : on compare les pressions de vapeur des solvants <em>purs</em>. Dans un mélange réel, les interactions modifient la vitesse d'évaporation
        de chacun (l'acétate d'éthyle et l'éthanol forment même un azéotrope). On n'en tire donc qu'une conclusion qualitative : le solvant <em>de loin</em> le moins volatil
        reste en dernier dans le film.</li>
      <li><strong>Ce que la simulation ne modélise pas</strong> : la cinétique du séchage, et le blanchiment dû à l'humidité (l'évaporation refroidit le film, l'eau de l'air
        s'y condense, et l'eau est un non-solvant de la nitrocellulose). C'est la cause la plus fréquente de blanchiment des vernis à la nitrocellulose.</li>
    </ul>
  );
}

// ════════════════ SIMULATION ════════════════
export function Simulation4({ plotlyReady }) {
  const [mode, setMode] = useState(() => modeOuverture('hansen-guide-p1'));
  useSignalerMode(mode);
  const [parc, setParc] = useEtatPersistant('hansen-parcours-choix', 1);
  const VIDE = { etape: 0, reps: {}, verifs: {}, reussies: {} };
  const [g1, setG1] = useEtatPersistant('hansen-guide-p1', VIDE), [g2, setG2] = useEtatPersistant('hansen-guide-p2', VIDE), [g3, setG3] = useEtatPersistant('hansen-guide-p3', VIDE);
  const guide = parc === 1 ? g1 : parc === 2 ? g2 : g3, setGuide = parc === 1 ? setG1 : parc === 2 ? setG2 : setG3;
  const [polyId, setPolyId] = useState('tp');
  const [vol, setVol] = useState({ ea: 50, ba: 0, etoh: 50, ipa: 0 });
  const [testes, setTestes] = useState({});
  const [vue, setVue] = useState('carte');
  const [vuHansen, setVuHansen] = useState(false);
  const [ouverts, setOuverts] = useState({ mel: true, hypo: true, sech: true });
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;
  const P = POLYMERES[polyId];
  const tot = Object.values(vol).reduce((a, b) => a + b, 0);
  const mel = melange(vol), redMel = ra(P, mel) / P.R0;
  const dernier = tot > 0 ? dernierSolvant(vol) : null;

  // ── Valeurs du parcours (données du TP) ──
  const PT = POLYMERES.tp;
  const raEA = ra(PT, SOLVANTS.ea), redOf = (k, Q = PT) => ra(Q, SOLVANTS[k]) / Q.R0;
  const m5050 = melange({ ea: 50, etoh: 50 });
  // fraction d'éthanol maximale dans l'acétate d'éthyle, pour RED = 1 (résolution numérique)
  const fMax = (() => { let lo = 0, hi = 1; for (let i = 0; i < 60; i++) { const f = (lo + hi) / 2; if (ra(PT, melange({ ea: 1 - f, etoh: f })) / PT.R0 < 1) lo = f; else hi = f; } return lo; })();

  // Calcul pas à pas de la distance Ra (affiché après une réponse fausse) : écarts, carrés, somme, racine
  const calculRa = (Q, S, nom) => {
    const g = x => String(+x.toFixed(2)).replace('.', ',').replace('-', '−'), dd = S.d - Q.d, dp = S.p - Q.p, dh = S.h - Q.h, tD = 4 * dd * dd, tP = dp * dp, tH = dh * dh, tot = tD + tP + tH;
    return [
      `Écarts avec la nitrocellulose${nom ? ' (' + nom + ')' : ''} : Δδd = ${g(S.d)} − ${g(Q.d)} = ${g(dd)} ; Δδp = ${g(S.p)} − ${g(Q.p)} = ${g(dp)} ; Δδh = ${g(S.h)} − ${g(Q.h)} = ${g(dh)}.`,
      `Carrés (avec le facteur 4 pour δd) : 4 × (${g(dd)})² = ${g(tD)} ; (${g(dp)})² = ${g(tP)} ; (${g(dh)})² = ${g(tH)}.`,
      `Somme : ${g(tD)} + ${g(tP)} + ${g(tH)} = ${g(tot)}.`,
      `Racine carrée : Ra = √${g(tot)} = ${fmt(Math.sqrt(tot), 2)} MPa½.`,
    ];
  };

  // ════════════════ LES TROIS PARCOURS ════════════════
  const TOUTES = [
    // ── 1. La sphère de solubilité ──
    { id: 'contexte', titre: 'Le vernis à ongle', focus: [],
      texte: <>Un vernis à ongle contient un polymère filmogène, la <strong>nitrocellulose</strong>, avec une résine et un plastifiant, dissous dans un mélange de solvants.
        Une fois appliqué, les solvants s'évaporent et laissent un film brillant. Première question : quels solvants dissolvent la nitrocellulose ? Les paramètres de
        Hansen permettent de le prévoir.</>, tache: null },
    { id: 'parametres', titre: 'Trois paramètres', focus: [],
      texte: <>Chaque molécule est décrite par trois paramètres de solubilité (en MPa½) : δd (forces de dispersion), δp (interactions entre dipôles), δh (liaisons hydrogène).
        Ce sont les coordonnées d'un point dans l'« espace de Hansen ». Deux substances se mélangent bien si leurs points sont proches.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’éthanol a-t-il un δh élevé (19,4) ?', options: ['Son groupe –OH forme des liaisons hydrogène', 'Il est très polaire', 'Il est très volatil'], bonne: 0 } },
    { id: 'ra', titre: 'La distance de Hansen', focus: ['vue'],
      texte: <>La distance entre un solvant (s) et le polymère (P) vaut Ra = √[4(δd,s − δd,P)² + (δp,s − δp,P)² + (δh,s − δh,P)²]. La nitrocellulose : δd = 17 ; δp = 8,7 ;
        δh = 9,3. L'acétate d'éthyle : 15,8 ; 5,3 ; 7,2.</>,
      tache: { type: 'num', q: 'Distance Ra entre l’acétate d’éthyle et la nitrocellulose', unite: 'MPa½', vrai: raEA, tol: 0.02, affiche: x => fmt(x, 2),
        calcul: calculRa(PT, SOLVANTS.ea, 'acétate d’éthyle'),
        pieges: [[Math.sqrt((15.8 - 17) ** 2 + 3.4 ** 2 + 2.1 ** 2), 'N’oubliez pas le facteur 4 devant le terme en δd.'],
          [4 * 1.2 ** 2 + 3.4 ** 2 + 2.1 ** 2, 'Vous avez oublié la racine carrée à la fin : la somme des carrés vaut Ra², pas Ra.']] } },
    { id: 'facteur4', titre: 'Pourquoi ce facteur 4 ?', focus: [],
      texte: <>Le facteur 4 devant le terme de dispersion n'est pas démontré : Hansen l'a choisi parce qu'avec lui, les domaines de solubilité mesurés deviennent à peu près
        sphériques. C'est pour cela que la vue 3D utilise l'axe 2δd.</>,
      tache: { type: 'qcm', q: 'Le facteur 4 est…', options: ['un choix empirique, qui rend les domaines de solubilité à peu près sphériques', 'une constante physique fondamentale', 'une erreur de la formule'], bonne: 0 } },
    { id: 'red', titre: 'La sphère et le RED', focus: ['vue'],
      texte: <>Le polymère est entouré d'une <strong>sphère de solubilité</strong> de rayon R0 (ici 9,0 MPa½). On calcule RED = Ra / R0 : si RED &lt; 1, le solvant est dans la
        sphère, il doit dissoudre le polymère.</>,
      tache: { type: 'num', q: 'RED de l’acétate d’éthyle', unite: '', vrai: raEA / PT.R0, tol: 0.02, affiche: x => fmt(x, 2),
        calcul: [...calculRa(PT, SOLVANTS.ea, 'acétate d’éthyle'), `RED = Ra / R₀ = ${fmt(raEA, 2)} / ${fmt(PT.R0, 1)} = ${fmt(raEA / PT.R0, 2)} (inférieur à 1 : le solvant est dans la sphère).`],
        pieges: [[raEA, 'C’est la distance Ra. Le RED est Ra divisé par le rayon R₀ de la sphère (9,0).'], [PT.R0 / raEA, 'Rapport à l’envers : le RED est Ra / R₀ (et non R₀ / Ra).']] } },
    { id: 'tester', titre: 'Tester les quatre solvants', focus: ['solvants'],
      texte: <>Cliquez sur chaque solvant dans le cadre « Les solvants » : son RED et sa position sur le diagramme s'affichent.</>,
      tache: { type: 'action', ok: Object.keys(SOLVANTS).every(k => testes[k]), consigne: `Solvants testés : ${Object.keys(SOLVANTS).filter(k => testes[k]).length} / 4` } },
    { id: 'classer', titre: 'Solvants et non-solvants', focus: ['solvants'],
      texte: <>Les esters sont les vrais solvants de la nitrocellulose ; les alcools servent surtout de diluants, moins chers.</>,
      tache: { type: 'qcm', q: 'Lequel de ces quatre liquides est un non-solvant de la nitrocellulose ?', options: ['l’éthanol', 'l’acétate d’éthyle', 'l’acétate de butyle'], bonne: 0,
        expl: `Éthanol : RED = ${fmt(redOf('etoh'), 2)}, juste au-dessus de 1 : trop de liaisons hydrogène.` } },
    { id: 'ipa', titre: 'Le cas de l’isopropanol', focus: ['solvants'],
      texte: <>L'isopropanol a un RED de {fmt(redOf('ipa'), 2)} : il serait dans la sphère. Pourtant, seul, il ne dissout pas la plupart des nitrocelluloses : on s'en sert pour
        les mouiller (les rendre moins inflammables au transport), et comme diluant.</>,
      tache: { type: 'qcm', q: 'Comment l’expliquer ?', options: ['Près de la frontière de la sphère, la prévision est incertaine, et les paramètres dépendent du grade de nitrocellulose', 'Le calcul est faux', 'L’isopropanol est toujours un bon solvant'], bonne: 0,
        expl: 'Le modèle de Hansen prévoit bien la tendance, mais pas avec certitude près de RED = 1. Il faut toujours vérifier au laboratoire.' } },
    { id: 'source', titre: 'Une autre source de données', focus: ['poly'],
      texte: <>Les paramètres de la nitrocellulose ne sont pas universels. Dans le cadre « Le polymère », choisissez « moyenne citée par Hansen » (16,2 ; 14,1 ; 9,5 ;
        R0 = 10,7) et regardez les RED.</>,
      tache: { type: 'qcm', q: 'Avec ces valeurs, l’acétate de butyle a un RED de 1,02. Que conclure ?', options: ['La prévision dépend des données choisies : seule une mesure sur le grade réellement utilisé tranche', 'L’acétate de butyle ne dissout pas la nitrocellulose', 'Les deux sources sont fausses'], bonne: 0,
        bloque: vuHansen ? null : 'Choisissez d’abord l’autre jeu de paramètres.',
        expl: 'En pratique, l’acétate de butyle est l’un des solvants les plus utilisés pour les vernis à la nitrocellulose : les données du TP décrivent mieux ce grade.' } },
    { id: 'bravo1', titre: 'Bravo !', focus: [],
      texte: <>Vous savez situer un solvant par rapport à la sphère de solubilité, et vous connaissez les limites de la prévision. Parcours suivant : « Les mélanges ».</>, tache: null },
    // ── 2. Les mélanges ──
    { id: 'intro2', titre: 'Mélanger les solvants', focus: ['mel'],
      texte: <>Un vernis n'utilise jamais un seul solvant. Les alcools sont moins chers que les esters : on cherche à en mettre le plus possible, sans que la nitrocellulose
        précipite. Les paramètres d'un mélange se calculent comme la moyenne de ceux des solvants, pondérée par leurs fractions volumiques.</>, tache: null },
    { id: 'moyenne', titre: 'Le point d’un mélange', focus: ['mel'],
      texte: <>Mélange à 50 % d'acétate d'éthyle (δh = 7,2) et 50 % d'éthanol (δh = 19,4), en volume.</>,
      tache: { type: 'num', q: 'δh du mélange', unite: 'MPa½', vrai: m5050.h, tol: 0.005, affiche: x => fmt(x, 1),
        calcul: [`Fractions volumiques : 50 % = 0,5 de chaque solvant.`, `δh = 0,5 × 7,2 + 0,5 × 19,4 = ${fmt(0.5 * 7.2, 1)} + ${fmt(0.5 * 19.4, 1)} = ${fmt(m5050.h, 1)} MPa½.`],
        pieges: [[7.2 + 19.4, 'Vous avez additionné les deux δh : il faut les pondérer par les fractions (0,5 chacune), c’est une moyenne.'], [(7.2 + 19.4) / 2 * 0.5, 'La moyenne pondérée, c’est 0,5 × 7,2 + 0,5 × 19,4 : les deux fractions s’additionnent à 1.']] } },
    { id: 'red5050', titre: 'Ce mélange dissout-il la nitrocellulose ?', focus: ['mel'],
      texte: <>Ce mélange : δd = 15,8 ; δp = {fmt(m5050.p, 2)} ; δh = {fmt(m5050.h, 1)}.</>,
      tache: { type: 'num', q: 'RED du mélange 50/50', unite: '', vrai: ra(PT, m5050) / PT.R0, tol: 0.02, affiche: x => fmt(x, 2),
        calcul: [`Paramètres du mélange (moyennes pondérées) : δd = ${fmt(m5050.d, 1)} ; δp = ${fmt(m5050.p, 2)} ; δh = ${fmt(m5050.h, 1)}.`, ...calculRa(PT, m5050, 'mélange 50/50'),
          `RED = Ra / R₀ = ${fmt(ra(PT, m5050), 2)} / ${fmt(PT.R0, 1)} = ${fmt(ra(PT, m5050) / PT.R0, 2)}.`],
        pieges: [[ra(PT, m5050), 'C’est la distance Ra. Le RED est Ra divisé par R₀ = 9,0.'], [raEA / PT.R0, 'Vous avez calculé le RED de l’acétate d’éthyle seul : utilisez les paramètres du mélange (δp et δh moyens).']] } },
    { id: 'optimum', titre: 'Le mélange le plus proche du centre', focus: ['mel'],
      texte: <>En formulation, on cherche souvent le mélange le plus proche du point du polymère (le RED le plus petit). Avec l'acétate d'éthyle et l'éthanol, réglez les
        proportions dans le cadre « Mon mélange » pour obtenir RED ≤ 0,41.</>,
      tache: { type: 'action', ok: redMel <= 0.41 && polyId === 'tp', consigne: `RED actuel : ${fmt(redMel, 2)}${polyId !== 'tp' ? ' (revenez aux données du TP)' : ''}` } },
    { id: 'diluer', titre: 'Jusqu’où diluer ?', focus: ['mel'],
      texte: <>Reprenez le mélange d'acétate d'éthyle et d'éthanol (sans autre solvant) : augmentez maintenant la part d'éthanol, jusqu'à ce que le mélange sorte de la sphère.</>,
      tache: { type: 'num', q: 'Part maximale d’éthanol (en % du volume) pour rester dans la sphère', unite: '%', vrai: fMax * 100, tol: 0.03, affiche: x => fmt(x, 0),
        calcul: (() => {
          const E = SOLVANTS.ea, T = SOLVANTS.etoh, dP = T.p - E.p, dH = T.h - E.h, p0 = E.p - PT.p, h0 = E.h - PT.h, c0 = 4 * (E.d - PT.d) ** 2 + p0 * p0 + h0 * h0;
          const A = dP * dP + dH * dH, B = 2 * (p0 * dP + h0 * dH), C = c0 - PT.R0 ** 2;
          return [
            `Avec une part f d’éthanol : δd = 15,8 (identique) ; δp = ${fmt(E.p, 1)} + ${fmt(dP, 1)} f ; δh = ${fmt(E.h, 1)} + ${fmt(dH, 1)} f.`,
            `À la limite de la sphère, RED = 1, donc Ra² = R₀² = ${fmt(PT.R0 ** 2, 0)}. On écrit Ra² = 4 Δδd² + (Δδp)² + (Δδh)² avec Δδp = ${fmt(p0, 1)} + ${fmt(dP, 1)} f et Δδh = ${fmt(h0, 1)} + ${fmt(dH, 1)} f : c’est une équation du second degré en f.`,
            `Après développement : ${fmt(A, 1)} f² + ${fmt(B, 1)} f + ${fmt(C, 1)} = 0 (la racine positive est la seule acceptable).`,
            `f = ${fmt(fMax, 3)}, soit environ ${fmt(fMax * 100, 0)} % d’éthanol. Autre méthode : dans la simulation, augmentez la part d’éthanol jusqu’à ce que le RED atteigne 1.`,
          ];
        })(),
        pieges: [[50, 'À 50 % le RED vaut seulement 0,55 : on est encore bien dans la sphère. Cherchez la part où le RED atteint 1.']] } },
    { id: 'marge', titre: 'Une marge de sécurité', focus: [],
      texte: <>Le modèle autorise jusqu'à {fmt(fMax * 100, 0)} % d'éthanol. Mais il ne décrit que le vernis au moment où il est dans le flacon.</>,
      tache: { type: 'qcm', q: 'Pourquoi ne pas formuler à la limite ?', options: ['La prévision est incertaine près de RED = 1, et la composition change pendant le séchage', 'Parce que l’éthanol est un ester', 'Il n’y a aucune raison'], bonne: 0 } },
    { id: 'bravo2', titre: 'Bravo !', focus: [],
      texte: <>Vous savez calculer le point d'un mélange et l'optimiser. Parcours suivant : « Le séchage du vernis », où la composition du mélange change.</>, tache: null },
    // ── 3. Le séchage ──
    { id: 'intro3', titre: 'Le séchage du vernis', focus: ['sech'],
      texte: <>Une fois le vernis appliqué, les solvants s'évaporent, mais pas tous à la même vitesse : la composition du solvant restant change. La question est simple :
        quel solvant reste en dernier dans le film, et dissout-il encore la nitrocellulose ?</>, tache: null },
    { id: 'volatil', titre: 'Qui s’évapore le plus vite ?', focus: ['solvants'],
      texte: <>Pressions de vapeur saturante à 20 °C : acétate d'éthyle 10 000 Pa ; éthanol 5 800 Pa ; isopropanol 4 400 Pa ; acétate de butyle 1 070 Pa. Plus la pression
        de vapeur est grande, plus le solvant est volatil.</>,
      tache: { type: 'qcm', q: 'Lequel s’évapore le plus vite ?', options: ['l’acétate d’éthyle', 'l’acétate de butyle', 'l’éthanol'], bonne: 0 } },
    { id: 'dernier', titre: 'Qui reste en dernier ?', focus: ['sech'],
      texte: <>Réglez un mélange d'acétate d'éthyle, d'éthanol et d'acétate de butyle. Le cadre « Ce qui reste en dernier » indique le solvant le moins volatil du mélange.</>,
      tache: { type: 'qcm', q: 'Dans un mélange de ces trois solvants, lequel reste en dernier dans le film ?', options: ['l’acétate de butyle : sa pression de vapeur est 5 à 10 fois plus faible que celle des deux autres', 'l’acétate d’éthyle', 'l’éthanol'], bonne: 0,
        expl: 'L’écart est grand : même si le mélange n’est pas idéal, l’acétate de butyle reste nettement le moins volatil.' } },
    { id: 'eco', titre: 'Un vernis sans solvant lent', focus: ['sech'],
      texte: <>Formulation « économique » : 30 % d'acétate d'éthyle et 70 % d'éthanol. Au départ, son RED vaut {fmt(ra(PT, melange({ ea: 30, etoh: 70 })) / PT.R0, 2)} : il dissout
        la nitrocellulose. Réglez ce mélange, et regardez le cadre « Ce qui reste en dernier ».</>,
      tache: { type: 'qcm', q: 'Que peut-on craindre en fin de séchage ?', options: ['Le dernier solvant est l’éthanol, un non-solvant (RED = 1,15) : la nitrocellulose risque de précipiter avant que le film soit formé', 'Rien : le mélange est dans la sphère au départ', 'Que le vernis sèche trop lentement'], bonne: 0,
        expl: 'Avec deux solvants de volatilités proches et un azéotrope, on ne peut pas prévoir sans mesure le moment exact où cela arrive ; mais le risque est réel, puisque le dernier liquide présent ne dissout pas le polymère.' } },
    { id: 'lent', titre: 'Le rôle du solvant lent', focus: ['sech'],
      texte: <>Gardez le mélange précédent (acétate d'éthyle et éthanol, environ 30 % / 70 %) et ajoutez-y de l'acétate de butyle (au moins 10 % du volume).</>,
      tache: { type: 'action', ok: !!dernier && dernier.k === 'ba' && vol.ba / tot >= 0.1 && redMel < 1,
        consigne: dernier ? `Dernier solvant : ${SOLVANTS[dernier.k].nom} (RED = ${fmt(ra(P, SOLVANTS[dernier.k]) / P.R0, 2)})` : 'Réglez un mélange.' } },
    { id: 'regle', titre: 'La règle de formulation', focus: [],
      texte: <>Le solvant le plus lent est celui qui reste en dernier : c'est lui qui doit garder la nitrocellulose dissoute jusqu'à la formation du film.</>,
      tache: { type: 'qcm', q: 'Que doit être le solvant le moins volatil du mélange ?', options: ['Un vrai solvant du polymère (ici l’acétate de butyle)', 'Un diluant bon marché', 'Le plus volatil possible'], bonne: 0,
        expl: 'Mais un solvant lent allonge le séchage : il en faut juste assez. On ajuste les proportions au laboratoire.' } },
    { id: 'blanchiment', titre: 'Et le blanchiment ?', focus: ['hypo'],
      texte: <>Les vernis à la nitrocellulose connaissent un défaut classique : le <strong>blanchiment</strong> (le film devient laiteux). Sa cause la plus fréquente n'est pas le
        mélange de solvants, mais l'humidité : l'évaporation refroidit le film, l'eau de l'air s'y condense, et l'eau est un non-solvant de la nitrocellulose.</>,
      tache: { type: 'qcm', q: 'La simulation peut-elle prévoir ce blanchiment ?', options: ['Non : elle ne modélise ni l’humidité ni la cinétique du séchage', 'Oui, avec le RED', 'Oui, avec les pressions de vapeur'], bonne: 0,
        expl: 'Un modèle ne répond qu’aux questions pour lesquelles il est construit : celui-ci ne dit que si un liquide dissout le polymère.' } },
    { id: 'bravo3', titre: 'Bravo !', focus: [],
      texte: <>Un bon mélange de solvants doit dissoudre le polymère au départ, mais aussi en fin de séchage : son solvant le moins volatil doit être un vrai solvant. En exploration
        libre, testez vos propres mélanges ; le défi vous demande un vernis économique qui respecte ces deux conditions.</>, tache: null },
  ];
  const ORDRE = [P1, P2, P3];
  const ETAPES = ORDRE[parc - 1].map(id => TOUTES.find(e => e.id === id));
  const loc = id => ORDRE[parc - 1].indexOf(id);
  const avant = id => ORDRE.slice(0, parc - 1).some(l => l.includes(id));
  const vu = id => !enGuide || avant(id) || (loc(id) >= 0 && etape >= loc(id));
  const passe = id => !enGuide || avant(id) || (loc(id) >= 0 && etape > loc(id));   // étape dépassée (toujours vrai hors parcours guidé)
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3 } : {});
  useEffect(() => { if (enGuide && parc === 1 && etape === loc('tester')) setTestes({}); }, [etape, enGuide, parc]);
  useEffect(() => { if (polyId === 'hansen') setVuHansen(true); }, [polyId]);
  // Dans le parcours 1, le solvant « testé » est affiché ; ailleurs, tous les solvants sont visibles
  const montrerPoint = k => !enGuide || parc > 1 || etape > loc('tester') || testes[k];
  const points = Object.entries(SOLVANTS).filter(([k]) => montrerPoint(k)).map(([k, s]) => ({ ...s, k }));
  const montrerMel = !enGuide || parc >= 2;

  // ════════════════ BLOCS ════════════════
  // Les graphiques sont ceux de l'exploration libre (mêmes sphères, mêmes couleurs, mêmes solvants) : seuls les solvants montrés changent
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const solvGraphes = Object.fromEntries(Object.entries(SOLVANTS).map(([, s]) => [cap(s.nom), { d: [s.d, s.p, s.h] }]));
  const melGraphes = montrerMel && tot > 0 ? [mel.d, mel.p, mel.h] : null;
  const actifsGraphes = Object.entries(vol).filter(([, v]) => v > 0).map(([k, v]) => ({ s: cap(SOLVANTS[k].nom), pct: v }));
  const vueBloc = (
    <div style={{ ...styleBoite, ...cadre('vue') }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>L'espace de Hansen</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setVue('carte')} style={stylePetitBouton(vue === 'carte', '#334155')}>Projection δp–δh</button>
          <button onClick={() => setVue('3d')} style={stylePetitBouton(vue === '3d', '#334155')}>Sphère 3D</button>
        </div>
      </div>
      {!window.Plotly && <div style={{ fontSize: 13.5, color: KIT.txt2, padding: 20, textAlign: 'center' }}>Chargement des graphiques…</div>}
      <GraphesHansen plotlyReady={plotlyReady} vue={vue === 'carte' ? '2d' : '3d'} noms poly={{ nom: 'Nitrocellulose', d: P.d, p: P.p, h: P.h, R0: P.R0 }} poly2={{ nom: '', d: 0, p: 0, h: 0, R0: 0 }}
        SOLVANTS={solvGraphes} cochesListe={points.map(x => cap(x.nom))} actifs={actifsGraphes} totPct={tot} ptMel={melGraphes} hauteur={380}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.45 }}>
        {vue === 'carte' ? <>Projection : c’est l’« ombre » de la sphère sur le plan δp–δh. Un point dans le disque peut être hors de la sphère à cause de son δd : la couleur, elle, tient compte des trois paramètres (vert : RED &lt; 1). Survolez un point pour lire son RED.</>
          : <>Axes 2δd, δp et δh : avec le facteur 2 sur δd, le domaine de solubilité est une vraie sphère. Faites-la tourner avec la souris.</>}
      </div>
    </div>
  );
  const blocPoly = (
    <div style={{ ...styleBoite, ...cadre('poly') }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Le polymère : nitrocellulose</div>
      {(!enGuide || parc > 1 || etape >= loc('source')) && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
        {Object.entries(POLYMERES).map(([k, q]) => <button key={k} onClick={() => setPolyId(k)} style={stylePetitBouton(polyId === k, '#15803d')}>{q.nom}</button>)}
      </div>}
      <div style={{ fontSize: 13.5, color: KIT.txt }}>δd = {fmt(P.d, 1)} ; δp = {fmt(P.p, 1)} ; δh = {fmt(P.h, 1)} ; R0 = {fmt(P.R0, 1)} MPa½</div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>{P.source}</div>
    </div>
  );
  const blocSolvants = (
    <div style={{ ...styleBoite, ...cadre('solvants') }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Les solvants</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
          <thead><tr>{['Solvant', 'δd', 'δp', 'δh', 'Psat (20 °C)', 'RED'].map(t => <th key={t} style={cell}>{t}</th>)}</tr></thead>
          <tbody>{Object.entries(SOLVANTS).map(([k, s]) => {
            const r = ra(P, s) / P.R0, visible = montrerPoint(k) && (!enGuide || parc > 1 || etape >= loc('tester'));
            return <tr key={k} onClick={() => setTestes(x => ({ ...x, [k]: true }))} style={{ cursor: 'pointer' }}>
              <td style={{ ...cell, color: s.color, fontWeight: 700, textAlign: 'left' }}>{s.nom}</td><td style={cell}>{fmt(s.d, 1)}</td><td style={cell}>{fmt(s.p, 1)}</td><td style={cell}>{fmt(s.h, 1)}</td>
              <td style={cell}>{s.psat} Pa</td>
              <td style={{ ...cell, fontWeight: 700, color: visible ? (r < 1 ? '#15803d' : '#b91c1c') : KIT.txt2 }}>{visible ? `${fmt(r, 2)} ${r < 1 ? '(solvant)' : '(non-solvant)'}` : enGuide && parc === 1 && etape === loc('tester') ? 'cliquer' : '?'}</td></tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  );
  const pas = 5;
  const blocMel = montrerMel && (
    <div style={{ ...styleBoite, ...cadre('mel') }}>
      <Section titre="Mon mélange" ouvert={ouverts.mel} onBascule={() => setOuverts(o => ({ ...o, mel: !o.mel }))}>
        {Object.entries(SOLVANTS).map(([k, s]) => <Curseur key={k} nom={`${s.nom} (% du volume)`} valeur={tot > 0 ? Math.round(vol[k] / tot * 100) : 0}
          onChange={v => setVol(o => { const autres = Object.keys(o).filter(x => x !== k), reste = autres.reduce((a, x) => a + o[x], 0), nv = { ...o, [k]: v };
            autres.forEach(x => { nv[x] = reste > 0 ? o[x] / reste * (100 - v) : (100 - v) / autres.length; }); return nv; })} min={0} max={100} pas={pas} unite="%" couleur={s.color}/>)}
        <LigneMesure nom="Point du mélange (δd ; δp ; δh)" valeur={`${fmt(mel.d, 1)} ; ${passe('moyenne') ? fmt(mel.p, 2) : '?'} ; ${passe('moyenne') ? fmt(mel.h, 2) : '?'}`}/>
        <LigneMesure nom="RED du mélange" valeur={passe('red5050') ? `${fmt(redMel, 2)} : ${redMel < 1 ? 'dissout la nitrocellulose' : 'ne la dissout pas'}` : '?'} couleur={passe('red5050') ? (redMel < 1 ? '#15803d' : '#b91c1c') : undefined}/>
        <LigneMesure nom="Part d'alcool" valeur={`${fmt(tot > 0 ? (vol.etoh + vol.ipa) / tot * 100 : 0, 0)} %`}/>
      </Section>
    </div>
  );
  // Ce qui reste en dernier : le moins volatil des solvants présents (raisonnement qualitatif, sans modèle d'évaporation)
  const blocSech = (!enGuide || parc === 3) && (
    <div style={{ ...styleBoite, ...cadre('sech') }}>
      <Section titre="Ce qui reste en dernier" ouvert={ouverts.sech} onBascule={() => setOuverts(o => ({ ...o, sech: !o.sech }))}>
        {!dernier ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Réglez un mélange.</div> : (() => {
          const s0 = SOLVANTS[dernier.k], r = ra(P, s0) / P.R0;
          return <>
            <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6 }}>Solvants du mélange, du plus volatil au moins volatil :{' '}
              {Object.keys(vol).filter(k => vol[k] / tot >= 0.05).sort((x, y) => SOLVANTS[y].psat - SOLVANTS[x].psat).map(k => `${SOLVANTS[k].court} (${SOLVANTS[k].psat} Pa)`).join(' → ')}</div>
            <LigneMesure nom="Dernier solvant présent dans le film" valeur={s0.nom} couleur={s0.color}/>
            <LigneMesure nom="Son RED vis-à-vis de la nitrocellulose" valeur={`${fmt(r, 2)} : ${r < 1 ? 'vrai solvant' : 'non-solvant'}`} couleur={r < 1 ? '#15803d' : '#b91c1c'}/>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 6, color: r < 1 ? '#15803d' : '#b91c1c' }}>
              {r < 1 ? '✅ La nitrocellulose reste dissoute jusqu’à la fin du séchage.' : '⚠️ En fin de séchage, il ne reste qu’un non-solvant : la nitrocellulose risque de précipiter avant que le film soit formé.'}</div>
            {dernier.ecart < 2 && <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 4 }}>Le solvant suivant n'est que {fmt(dernier.ecart, 1)} fois plus volatil : dans un mélange réel, l'ordre d'évaporation de deux solvants aussi proches n'est pas certain.</div>}
            <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Sur la projection δp–δh, chaque trait relie le mélange à l’un de ses solvants : pendant le séchage, la composition évolue vers le moins volatil.</div>
          </>;
        })()}
      </Section>
    </div>
  );
  const blocHypo = (vu('ipa') || !enGuide || parc > 1) && (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={ouverts.hypo} onBascule={() => setOuverts(o => ({ ...o, hypo: !o.hypo }))}><Hypotheses/></Section>
    </div>
  );

  // ════════════════ DÉFI ════════════════
  const [etatExp, setEtatExp] = useState(null);
  const [sd, noterDefi] = useCompteurDefi();
  const [bilanDefi, setBilanDefi] = useState(null);      // critères évalués au moment de « Valider ma réponse »
  const [cleExp, setCleExp] = useState(0);                // change quand on recommence : l'exploration repart de sa configuration de départ
  function nouveauDefi(type = defi ? defi.type : 'form') { setDefi({ type, alcoolMin: [40, 50, 60][Math.floor(Math.random() * 3)] }); setBilanDefi(null); setEtatExp(null); setCleExp(k => k + 1); }
  // Critères du défi, évalués sur le mélange composé dans l'exploration libre
  const criteresDefi = () => {
    const E = etatExp, sel = defi.type === 'selectif';
    if (!E) return [{ ok: false, t: 'Composez un mélange dans l’exploration libre ci-dessous.' }];
    const bonsPoly = E.polyId === 'nc-tp' && (!sel || (E.deux && E.poly2Id === 'pmma'));
    const C = [{ ok: bonsPoly, t: sel ? 'Polymères : nitrocellulose (données du TP) et PMMA, option « deux sphères » activée (ne les changez pas)' : 'Polymère : nitrocellulose (données du TP), à ne pas changer' }];
    if (!E.possible || !E.melange.length) return [...C, { ok: false, t: 'Aucun mélange composé : choisissez au moins deux solvants cochés.' }];
    C.push({ ok: bonsPoly && E.redMel < 0.9, t: `Dissout la nitrocellulose, avec une marge : RED du mélange < 0,9 (${fmt(E.redMel, 2)})` });
    if (sel) C.push({ ok: bonsPoly && E.redMel2 >= 1.2, t: `N’attaque pas le PMMA, avec une marge : RED pour le PMMA ≥ 1,2 (${E.redMel2 == null ? '—' : fmt(E.redMel2, 2)})` });
    else {
      const present = E.melange.filter(x => x.part >= 0.05 && x.pvap != null).sort((x, y) => x.pvap - y.pvap), dernier = present[0];
      C.push({ ok: !!dernier && dernier.red < 1, t: dernier ? `Le solvant le moins volatil est un vrai solvant (${dernier.s}, RED = ${fmt(dernier.red, 2)})` : 'Le solvant le moins volatil est un vrai solvant (pression de vapeur inconnue)' });
      const alc = E.melange.filter(x => x.famille === 'Alcools').reduce((a, x) => a + x.part, 0) * 100;
      C.push({ ok: alc >= defi.alcoolMin, t: `Économique : au moins ${defi.alcoolMin} % d’alcool (${fmt(alc, 0)} %)` });
    }
    return C;
  };
  const voletDefi = defi && (() => {
    const sel = defi.type === 'selectif', E = etatExp;
    const rep = E && E.possible && E.melange.length ? E.melange.map(x => `${fmt(x.part * 100, 0)} % ${x.s}`).join(' + ') : '—';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => nouveauDefi('form')} style={stylePetitBouton(!sel, '#0b4f94')}>Défi 1 : formuler le vernis</button>
          <button onClick={() => nouveauDefi('selectif')} style={stylePetitBouton(sel, '#0b4f94')}>Défi 2 : un dissolvant sélectif</button>
        </div>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>{sel
          ? <>Vous voulez enlever un vernis à la nitrocellulose sur un objet en <strong>PMMA</strong> (verre acrylique) sans abîmer l’objet. Trouvez un mélange de solvants qui dissout le vernis mais pas le PMMA. Les deux polymères sont déjà réglés dans l’exploration libre ci-dessous (option « deux sphères ») : <strong>faites vos essais dans l’exploration</strong>, puis donnez votre réponse ici.</>
          : <>Formulez le mélange de solvants d’un vernis à la nitrocellulose (données du TP). <strong>Faites vos essais dans l’exploration libre</strong> ci-dessous (cochez des solvants, composez le mélange, regardez les RED), puis donnez votre réponse ici : le mélange doit respecter les critères ci-dessous.</>}</div>
        <div style={{ fontSize: 14, color: KIT.txt }}>Votre réponse actuelle (mélange composé dans l’exploration) : <strong>{rep}</strong></div>
        <button onClick={() => { const C = criteresDefi(); setBilanDefi(C); noterDefi(C.every(c => c.ok)); }} style={styleBouton(true, '#16a34a')}>✓ Valider ma réponse</button>
        <SuiviDefi cle={`${SIM_ID}:defi.${sel ? 'selectif' : 'principal'}`} etat={sd} key={sel ? 's' : 'p'}/>
        {bilanDefi && <>
          {bilanDefi.map((c, k) => <div key={k} style={{ fontSize: 14, color: KIT.txt }}>{c.ok ? '✅' : '❌'} {c.t}</div>)}
          {bilanDefi.every(c => c.ok) && <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>{sel ? 'Bravo ! Le modèle prévoit que le vernis part sans attaquer le PMMA. Il resterait à le vérifier sur une chute d’objet : le PMMA peut se fissurer ou blanchir sous contrainte même sans se dissoudre.' : 'Bravo ! Il resterait à vérifier au laboratoire la dissolution, le temps de séchage et l’aspect du film.'}</div>}
          {!sel && bilanDefi.every(c => c.ok) && etatExp && etatExp.melange.some(x => /Isopropanol/.test(x.s) && x.part > 0.5) && <div style={{ fontSize: 13.5, color: '#b45309', lineHeight: 1.5 }}><Pic n="warn"/>Le modèle accepte ce mélange parce qu’il place l’isopropanol juste dans la sphère. En pratique, l’isopropanol ne dissout pas seul la plupart des nitrocelluloses : un mélange aussi riche en isopropanol est à vérifier au laboratoire avant d’y croire.</div>}
        </>}
        <button onClick={() => nouveauDefi()} style={styleBouton(false)}><Pic n="refresh"/>{sel ? 'Recommencer' : 'D’autres critères'}</button>
      </div>
    );
  })();

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi') nouveauDefi(); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défi</button>
    </span>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ha-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ha-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .ha-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Paramètres de solubilité de Hansen{mode !== 'explore' ? <span style={{ fontWeight: 400, color: KIT.txt2 }}> — exemple : la nitrocellulose d'un vernis à ongle</span> : null}</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}><Pic n="compass"/>Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}><Pic n="search"/>Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}><Pic n="target"/>Défi</button>
        </div>
      </div>
      {enDefi ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}</div>
        <HansenExploration key={`${defi.type}-${cleExp}`} plotlyReady={plotlyReady} initial={defi.type === 'selectif' ? { polyId: 'nc-tp', deux: true, poly2Id: 'pmma', pur: true } : { polyId: 'nc-tp', pur: true }} onEtat={setEtatExp}/>
      </> : mode === 'explore' ? <HansenExploration plotlyReady={plotlyReady}/> : <>
      {enGuide && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Parcours :</span>
        {[[1, '1. La sphère de solubilité'], [2, '2. Les mélanges'], [3, '3. Le séchage du vernis']].map(([k, n]) =>
          <button key={k} onClick={() => setParc(k)} style={styleBouton(parc === k, ORANGE_GUIDE)}>{n}{[g1, g2, g3][k - 1].etape > 0 ? ` (étape ${[g1, g2, g3][k - 1].etape + 1})` : ''}</button>)}
      </div>}
      <div className="ha-l1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{vueBloc}{blocSech}</div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : blocMel}
      </div>
      <div className="ha-l2">
        {enGuide && blocMel}
        {blocSolvants}
        {blocPoly}
        {blocHypo}
      </div>
      </>}
    </div>
  );
}

const cell = { padding: '4px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5 };
const P1 = ['contexte', 'parametres', 'ra', 'facteur4', 'red', 'tester', 'classer', 'ipa', 'source', 'bravo1'];
const P2 = ['intro2', 'moyenne', 'red5050', 'optimum', 'diluer', 'marge', 'bravo2'];
const P3 = ['intro3', 'volatil', 'dernier', 'eco', 'lent', 'regle', 'blanchiment', 'bravo3'];
