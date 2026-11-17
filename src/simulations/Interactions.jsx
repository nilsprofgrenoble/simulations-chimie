import { useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { SCEN, additif, interaction, verdict, modele, predit, ROUGE, ecartRouge, tirage, nf } from "./interactionsModele";
import { BarresVue, LignesVue, MelangeVue, CarteAdditif, CarteSigne, CarteUnSeul, CartePlanExp, CarteModele } from "./InteractionsVues";

const SIM_ID = 128;
declarerDefis(SIM_ID, [['ecart', 'Calculer l’interaction d’un plan 2²'], ['verdict', 'Reconnaître synergie, antagonisme ou absence d’interaction']]);

// ====================================================
//  SIM 128 — POURQUOI UN PLAN D'EXPÉRIENCES ? (BTS Métiers de la Chimie, introduction aux plans 127 et 126)
//  Idée unique : l'interaction. Métaphore du sélectionneur de football (chiffres inventés), puis exemples de chimie calqués dessus :
//  vinaigrette (note du jury, moyennes des 4 essais de chaque case du plan 2⁴ réel) et rouge à lèvres (plan de mélange réel).
//  Hypothèses : voir le panneau « Hypothèses de travail ».
// ====================================================

const ETAT0 = { etape: 0, reps: {}, verifs: {}, reussies: {} };
const IDS = ['vedettes', 'mesure', 'interaction', 'moyens', 'pont', 'vin', 'vininter', 'modele', 'predit', 'lecture', 'piege', 'rouge', 'plan', 'bilan'];
const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '');
const liste = (...l) => <ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{l.map((t, i) => <li key={i}>{t}</li>)}</ul>;
const { vedettes: V, moyens: Mo, vinaigrette: Vi } = SCEN;
const VERDICTS = { aucune: 'Aucune interaction : les effets s’additionnent.', synergie: 'Synergie : ensemble, ils font mieux que la somme de leurs effets.', antagonisme: 'Antagonisme : ensemble, ils font moins bien que la somme de leurs effets.' };

// Équation du modèle d'un plan 2² : forme littérale et, si c est fourni, forme chiffrée
function Equation({ y, a, b, c }) {
  const co = v => nf(Math.abs(v), 2);
  const xa = <><em>x</em><sub>{a}</sub></>, xb = <><em>x</em><sub>{b}</sub></>, xab = <><em>x</em><sub>{a}</sub><em>x</em><sub>{b}</sub></>;
  const terme = (v, x) => <> {v < -1e-9 ? '−' : '+'} {co(v)}{x}</>;
  return (
    <div style={{ overflowWrap: 'anywhere', lineHeight: 1.7 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{y} = <em>a</em><sub>0</sub> + <em>a</em><sub>{a}</sub>{xa} + <em>a</em><sub>{b}</sub>{xb} + <em>a</em><sub>{a}{b}</sub>{xab}</div>
      {c && <div style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>{y} = {nf(c.a0, 2)}{terme(c.aA, xa)}{terme(c.aB, xb)}{terme(c.aAB, xab)}</div>}
    </div>);
}

// Correspondance football ↔ chimie : le pont entre la métaphore et l'exemple
function TablePont() {
  const lignes = [['l’attaquant A', 'l’amidon Ultratech (U) au niveau haut'], ['l’attaquant B', 'l’amidon Novation (N) au niveau haut'], ['sans A ni B', 'U et N au niveau bas'], ['A et B ensemble', 'U et N tous deux au niveau haut'], ['buts par match', 'note du jury sur 10'], ['l’équipe', 'la vinaigrette']];
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13.5 }}>
      <thead><tr style={{ color: KIT.txt2, fontSize: 13 }}><th style={{ textAlign: 'left', padding: '2px 4px' }}>⚽ Football</th><th style={{ textAlign: 'left', padding: '2px 4px' }}>🧪 Chimie</th></tr></thead>
      <tbody>{lignes.map(([a, b]) => <tr key={a} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 700 }}>{a}</td><td style={{ padding: '3px 4px' }}>{b}</td></tr>)}</tbody>
    </table>);
}

export function SimulationInteractions() {
  const [mode, setMode] = useState(() => modeOuverture('interactions-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('interactions-guide-v1', ETAT0);
  const [explo, setExplo] = useState({ lignes: true, perso: { base: 1, A: 2, B: 2, AB: 1 } });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('ecart');
  const [sE, noterE] = useCompteurDefi(), [sV, noterV] = useCompteurDefi();
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplo = mode === 'explore';
  const etape = guide.etape;
  const idx = id => IDS.indexOf(id);
  const apres = id => !enGuide || etape > idx(id);
  const des = id => !enGuide || etape >= idx(id);

  // ---------- défis ----------
  function nouveauDefi(type) {
    let s, i;
    do { s = tirage(); i = interaction(s); } while (type === 'ecart' && Math.abs(i) < 0.5);
    setDefi({ type, s: { ...s, ...{ unite: '/ 10', dec: 1, cA: 'A', cB: 'B', etiq: [['ni A', 'ni B'], ['A', 'seul'], ['B', 'seul'], ['A et B', 'ensemble']] } }, i, reps: {}, verifie: false });
  }
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const setRepD = (c, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [c]: v }, verifie: false }));
  function verifierDefi(choix) {
    let ok, msg;
    if (defi.type === 'ecart') {
      const v = lireNombre(defi.reps.a);
      ok = isFinite(v) && Math.abs(v - defi.i) <= 0.06;
      msg = ok ? `✓ Correct : interaction = ${nf(defi.s.AB)} − ${nf(additif(defi.s))} = ${nf(defi.i)}.` : '✗ Vérifiez : prévu additif = départ + effet de A + effet de B ; interaction = mesuré − prévu (le signe compte).';
      noterE(ok);
    } else {
      const v = verdict(defi.i);
      ok = choix === v;
      msg = ok ? `✓ Correct : prévu ${nf(additif(defi.s))}, mesuré ${nf(defi.s.AB)}, écart ${nf(defi.i)}.` : `✗ Calculez le prévu additif (${nf(defi.s.base)} + effet de A + effet de B), puis comparez-le au mesuré.`;
      noterV(ok);
    }
    setDefi(d => ({ ...d, verifie: true, ok, msg, choix }));
  }

  // ---------- parcours guidé ----------
  const ETAPES = [
    { id: 'vedettes', titre: 'Deux attaquants vedettes', focus: ['scene'],
      texte: <>Un sélectionneur compose son attaque. Sans A ni B, l’équipe marque en moyenne <strong>0,8 but par match</strong>. Avec l’attaquant A seul, elle en marque <strong>2,1</strong> ; avec l’attaquant B seul, <strong>2,3</strong>. Il aligne les deux ensemble. <em>(Chiffres inventés pour l’exemple.)</em> On suppose d’abord que l’apport de chacun s’ajoute à celui de l’autre.</>,
      tache: { type: 'num', q: 'Buts par match attendus avec A et B ensemble, si leurs apports s’additionnent', unite: 'buts / match', vrai: additif(V), tol: 0.05, affiche: v => nf(v),
        calcul: () => ['Apport de A : 2,1 − 0,8 = 1,3 ; apport de B : 2,3 − 0,8 = 1,5.', 'Prévu = 0,8 + 1,3 + 1,5 = 3,6.'],
        pieges: [[4.4, 'C’est 2,1 + 2,3 : le point de départ 0,8 est compté deux fois. Ajoutez seulement les apports (gains par rapport à 0,8).']],
        expl: '0,8 + 1,3 + 1,5 = 3,6 buts par match.', indice: 'Prévu = départ + apport de A + apport de B, un apport étant « avec − sans ».' } },
    { id: 'mesure', titre: 'Le match a lieu', focus: ['scene'],
      texte: <>Les deux vedettes jouent ensemble : l’équipe marque <strong>1,6 but par match</strong>, alors qu’on en attendait <strong>3,6</strong> (étape précédente). Ils ne s’entendent pas.</>,
      tache: { type: 'qcm', q: 'Comment l’équipe se comporte-t-elle par rapport à la prévision additive ?', options: ['Moins que prévu : ils se gênent', 'Autant que prévu : tout s’additionne', 'Plus que prévu : ils se complètent'], bonne: 0,
        expl: 'On attendait 3,6 et on mesure 1,6 : A et B ensemble font moins bien que la somme de leurs apports.', indice: 'Comparez 1,6 (mesuré) à 3,6 (prévu).' } },
    { id: 'interaction', titre: 'Chiffrer l’interaction', focus: ['scene'],
      texte: <>On appelle <strong>interaction</strong> l’écart entre ce qu’on mesure quand les deux facteurs agissent ensemble et ce que prévoyait l’addition de leurs effets séparés : <strong>interaction = mesuré − prévu</strong>. Ici, mesuré = 1,6 but par match et prévu = 3,6.</>,
      tache: { type: 'num', q: 'Interaction entre A et B', unite: 'buts / match', vrai: interaction(V), tol: 0.05, affiche: v => nf(v),
        calcul: () => ['Interaction = mesuré − prévu = 1,6 − 3,6 = −2,0.', 'Négative : A et B se gênent (antagonisme).'],
        pieges: [[2, 'Attention au signe : c’est mesuré − prévu, donc 1,6 − 3,6, qui est négatif.']],
        expl: '1,6 − 3,6 = −2,0 but par match : un antagonisme.', indice: 'Interaction = mesuré − prévu (dans cet ordre).' } },
    { id: 'moyens', titre: 'L’inverse : deux joueurs moyens', focus: ['scene'],
      retenirTitre: 'À RETENIR : 1 + 1 ≠ 2', retenir: <><CarteAdditif/>{liste('prévu = départ + effet de A + effet de B', 'interaction = mesuré − prévu', 'interaction négative : antagonisme ; positive : synergie')}</>,
      texte: <>Autre équipe : sans C ni D, <strong>0,8 but par match</strong> ; avec C seul, <strong>1,0</strong> ; avec D seul, <strong>1,1</strong> ; avec C et D ensemble, <strong>2,4</strong>. Aucun des deux n’est une vedette. Calculez l’interaction comme à l’étape précédente (mesuré − prévu additif).</>,
      tache: { type: 'num', q: 'Interaction entre C et D', unite: 'buts / match', vrai: interaction(Mo), tol: 0.05, affiche: v => nf(v),
        calcul: () => ['Apports : C = 1,0 − 0,8 = 0,2 ; D = 1,1 − 0,8 = 0,3.', 'Prévu = 0,8 + 0,2 + 0,3 = 1,3.', 'Interaction = 2,4 − 1,3 = +1,1.'],
        pieges: [[-1.1, 'Attention au signe : mesuré − prévu = 2,4 − 1,3, positif.'], [1.3, 'C’est le prévu (1,3). Il reste à le retrancher du mesuré (2,4).']],
        expl: '+1,1 but par match : une synergie. Deux joueurs moyens peuvent surperformer ensemble.', indice: 'Prévu additif = 0,8 + (1,0 − 0,8) + (1,1 − 0,8), puis mesuré − prévu.' } },
    { id: 'pont', titre: 'Même idée en chimie', focus: ['pont', 'scene'],
      texte: <>En chimie, c’est pareil. Dans une <strong>vinaigrette</strong>, un jury note la texture sur 10. Deux <strong>amidons</strong> sont étudiés : Ultratech (U) et Novation (N), chacun au niveau bas ou haut. Le tableau donne la correspondance avec le football. Chaque case est la moyenne de 4 essais d’un plan réel (valeurs arrondies au dixième).</>,
      tache: { type: 'qcm', q: 'Dans la vinaigrette, qu’est-ce qui joue le rôle de « A et B ensemble » ?', options: ['U et N tous deux au niveau haut', 'N au niveau haut, U au niveau bas', 'U et N tous deux au niveau bas'], bonne: 0,
        expl: 'A et B ensemble : les deux ingrédients actifs en même temps, donc U haut et N haut.', indice: 'Regardez la ligne « A et B ensemble » du tableau de correspondance.' } },
    { id: 'vin', titre: 'Prévoir la note de la vinaigrette', focus: ['scene'],
      texte: <>Notes du jury : <strong>2,4</strong> avec U et N bas ; <strong>5,1</strong> avec U haut seul ; <strong>7,6</strong> avec N haut seul. Si les effets de U et de N s’additionnaient, quelle note obtiendrait-on avec les deux au niveau haut ?</>,
      tache: { type: 'num', q: 'Note prévue avec U et N hauts, si leurs effets s’additionnent', unite: '/ 10', vrai: additif(Vi), tol: 0.05, affiche: v => nf(v),
        calcul: () => ['Effet de U : 5,1 − 2,4 = 2,7 ; effet de N : 7,6 − 2,4 = 5,2.', 'Prévu = 2,4 + 2,7 + 5,2 = 10,3.', 'Plus de 10 : impossible, la note est bornée à 10.'],
        pieges: [[12.7, 'C’est 5,1 + 7,6 : le départ 2,4 est compté deux fois.']],
        expl: '2,4 + 2,7 + 5,2 = 10,3 : une note supérieure à 10 est impossible, les effets ne peuvent donc pas simplement s’additionner.', indice: 'Prévu = 2,4 + (5,1 − 2,4) + (7,6 − 2,4).' } },
    { id: 'vininter', titre: 'L’interaction de la vinaigrette', focus: ['scene'],
      texte: <>Le jury a noté <strong>7,1</strong> la vinaigrette avec U et N tous deux au niveau haut, alors que l’addition prévoyait <strong>10,3</strong> (étape précédente). Calculez l’interaction.</>,
      tache: { type: 'num', q: 'Interaction entre U et N', unite: '/ 10', vrai: interaction(Vi), tol: 0.05, affiche: v => nf(v),
        calcul: () => ['Interaction = mesuré − prévu = 7,1 − 10,3 = −3,2.', 'Négative : antagonisme. Avec les deux amidons hauts (7,1), la note est même plus faible qu’avec N haut seul (7,6).'],
        pieges: [[3.2, 'Attention au signe : mesuré − prévu = 7,1 − 10,3, négatif.']],
        expl: '−3,2 points : un antagonisme, comme pour les deux attaquants vedettes.', indice: 'Interaction = mesuré − prévu = 7,1 − 10,3.' } },
    { id: 'modele', titre: 'Le modèle : une équation', focus: ['scene', 'equation'],
      texte: <>Un plan 2² se résume par une <strong>équation</strong>. On <strong>code</strong> chaque niveau : −1 (bas) et +1 (haut). Le modèle s’écrit Note = <em>a</em><sub>0</sub> + <em>a</em><sub>U</sub><em>x</em><sub>U</sub> + <em>a</em><sub>N</sub><em>x</em><sub>N</sub> + <em>a</em><sub>UN</sub><em>x</em><sub>U</sub><em>x</em><sub>N</sub>. Ici, <em>a</em><sub>0</sub> est la moyenne des quatre notes, <em>a</em><sub>U</sub> et <em>a</em><sub>N</sub> sont les effets des amidons, et <em>a</em><sub>UN</sub>, devant le produit <em>x</em><sub>U</sub><em>x</em><sub>N</sub>, est le terme d’<strong>interaction</strong> : il vaut l’interaction <strong>divisée par 4</strong>. Pour la vinaigrette, l’interaction vaut −3,2 (étape 7).</>,
      tache: { type: 'num', q: 'Coefficient d’interaction aUN', unite: '/ 10', vrai: modele(Vi).aAB, tol: 0.02, affiche: v => nf(v, 2),
        calcul: () => ['aUN = interaction ÷ 4 = −3,2 ÷ 4 = −0,80.'],
        pieges: [[-3.2, 'C’est l’interaction elle-même. Le coefficient aUN en est le quart : divisez par 4.'], [0.8, 'Attention au signe : l’interaction est négative, donc aUN aussi.']],
        expl: 'aUN = −0,80. Les autres coefficients sont a₀ = 5,55 (moyenne des quatre notes), aU = 0,55 et aN = 1,80.', indice: 'aUN = interaction ÷ 4, avec une interaction de −3,2.' } },
    { id: 'predit', titre: 'Prévoir avec l’équation', focus: ['scene', 'equation'],
      retenirTitre: 'À RETENIR : L’ÉQUATION DU MODÈLE', retenir: <><CarteModele/>{liste('niveaux codés : −1 (bas) et +1 (haut)', 'a₀ = moyenne ; aA, aB = effets ; aAB = interaction ÷ 4', 'avec 4 essais et 4 coefficients, le modèle retrouve les 4 mesures')}</>,
      texte: <>Les quatre coefficients de la vinaigrette : <em>a</em><sub>0</sub> = 5,55 ; <em>a</em><sub>U</sub> = 0,55 ; <em>a</em><sub>N</sub> = 1,80 ; <em>a</em><sub>UN</sub> = −0,80 (calculé à l’étape précédente). Prévoyez la note avec <strong>U haut</strong> (<em>x</em><sub>U</sub> = +1) et <strong>N bas</strong> (<em>x</em><sub>N</sub> = −1).</>,
      tache: { type: 'num', q: 'Note prévue avec U haut et N bas', unite: '/ 10', vrai: predit(modele(Vi), 1, -1), tol: 0.05, affiche: v => nf(v),
        calcul: () => ['Note = 5,55 + 0,55 × (+1) + 1,80 × (−1) − 0,80 × (+1) × (−1).', 'Note = 5,55 + 0,55 − 1,80 + 0,80 = 5,10.'],
        pieges: [[3.5, 'Le produit xU·xN vaut (+1) × (−1) = −1 : le terme d’interaction −0,80 × (−1) vaut donc +0,80.']],
        expl: '5,1 : exactement la note mesurée avec U haut seul. Avec 4 coefficients pour 4 essais, le modèle retrouve les quatre mesures.', indice: 'Remplacez xU par +1 et xN par −1, puis calculez le produit xU·xN avant de multiplier par aUN.' } },
    { id: 'lecture', titre: 'La lire sur un graphique', focus: ['scene'],
      retenirTitre: 'À RETENIR : LIRE L’INTERACTION', retenir: <><CarteSigne/>{liste('droites parallèles : pas d’interaction', 'droites qui se rapprochent : antagonisme', 'droites qui s’écartent : synergie')}</>,
      texte: <>Le graphique montre la note selon le niveau de U, une droite sans N (bleue) et une avec N (orange). L’interaction de la vinaigrette vaut −3,2 point. La droite pointillée rouge montre ce que donnerait la droite orange <strong>sans interaction</strong>.</>,
      tache: { type: 'qcm', q: 'Sans interaction entre U et N, comment seraient les deux droites ?', options: ['Parallèles', 'Qui se croisent', 'Qui se rapprochent'], bonne: 0,
        expl: 'Sans interaction, U a le même effet quel que soit le niveau de N : les deux droites ont la même pente, elles sont parallèles.', indice: 'Si l’effet de U ne dépend pas de N, la pente est la même.' } },
    { id: 'piege', titre: 'Le piège d’un seul facteur à la fois', focus: ['scene'],
      retenirTitre: 'À RETENIR : UN FACTEUR À LA FOIS', retenir: <><CarteUnSeul/>{liste('un facteur à la fois : on ne teste jamais A et B ensemble', 'on prévoit alors par addition : faux si interaction', 'il faut tester les combinaisons')}</>,
      texte: <>Un technicien change <strong>un seul facteur à la fois</strong> : essai de départ, U haut seul, N haut seul. Soit trois essais seulement. Il ne teste jamais les deux ensemble.</>,
      tache: { type: 'qcm', q: 'Quelle information n’obtient-il pas avec ces 3 essais ?', options: ['L’interaction entre U et N', 'L’effet de U seul quand N est bas', 'L’effet de N seul quand U est bas'], bonne: 0,
        expl: 'Sans l’essai U et N ensemble, l’interaction reste invisible : il prévoit 10,3 et ne peut pas voir que la note réelle vaut 7,1.', indice: 'Quel essai manque dans son plan ?' } },
    { id: 'rouge', titre: 'Un mélange : le rouge à lèvres', focus: ['scene'],
      texte: <>Dans un <strong>plan de mélange</strong>, on ne peut pas retirer un ingrédient : les proportions font 100 %. Un rouge à lèvres reçoit du jury : candelilla seule <strong>5</strong>, huile de ricin seule <strong>2</strong>, mélange à parts égales <strong>8</strong> (sur 10, données réelles). Sans interaction, le mélange vaudrait la <strong>moyenne</strong> des deux corps purs. Calculez l’écart entre le mélange et cette moyenne, comme pour la vinaigrette (mesuré − prévu).</>,
      tache: { type: 'num', q: 'Écart : note du mélange − moyenne des deux corps purs', unite: '/ 10', vrai: ecartRouge(ROUGE), tol: 0.05, affiche: v => nf(v),
        calcul: () => ['Moyenne des deux purs : (5 + 2) / 2 = 3,5.', 'Écart = 8 − 3,5 = +4,5.', 'Positif : synergie.'],
        pieges: [[3.5, 'C’est la moyenne des purs (le prévu). Retranchez-la de la note du mélange, 8.'], [-4.5, 'Attention au signe : mesuré − prévu = 8 − 3,5, positif.']],
        expl: '+4,5 points : une forte synergie, le mélange fait bien mieux que ses deux composants.', indice: 'Prévu = moyenne de 5 et 2 ; écart = 8 − prévu.' } },
    { id: 'plan', titre: 'À quoi sert un plan d’expériences ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE PLAN D’EXPÉRIENCES', retenir: <><CartePlanExp/>{liste('un plan factoriel teste toutes les combinaisons de niveaux', '2 facteurs : 4 essais ; 3 facteurs : 8 essais ; k facteurs : 2ᵏ', 'on en déduit les effets et les interactions')}</>,
      texte: <>Les interactions ne se voient que si l’on <strong>teste les combinaisons</strong>. Un <strong>plan d’expériences</strong> organise ces essais, avec le moins d’essais possible, pour mesurer à la fois les effets de chaque facteur et leurs interactions.</>,
      tache: { type: 'qcm', q: 'Pour détecter les interactions entre 3 facteurs à 2 niveaux, que faut-il faire ?', options: ['Tester toutes les combinaisons : 8 essais', 'Tester chaque facteur séparément : 4 essais', 'Choisir les niveaux au hasard'], bonne: 0,
        expl: 'Il faut 2 × 2 × 2 = 8 essais, un par combinaison : c’est le plan factoriel complet.', indice: 'Pour chaque niveau du premier facteur, on teste les deux niveaux du deuxième, puis du troisième.' } },
    { id: 'bilan', titre: 'Bilan', focus: ['scene'],
      texte: <>Vous savez ce qu’est une <strong>interaction</strong> (mesuré − prévu additif), son signe (synergie ou antagonisme), comment l’écrire dans l’équation du modèle (a<sub>AB</sub> = interaction ÷ 4), comment la lire sur des droites, et pourquoi il faut tester les combinaisons. Pour le faire en vrai, passez au <strong>plan factoriel</strong> ; pour les formulations dont les proportions font 100 %, au <strong>plan de mélange</strong>.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});
  const titreP = t => <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{t}</div>;

  // ---------- scène selon l'étape ----------
  const scenGuide = etape <= idx('moyens') ? (etape === idx('moyens') ? Mo : V) : etape <= idx('lecture') || etape === idx('piege') ? Vi : null;
  const pv = apres('vedettes') && scenGuide === V || apres('moyens') && scenGuide === Mo || apres('vin') && scenGuide === Vi;
  const guideScene = enGuide && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {scenGuide ? <>
        {titreP(`${scenGuide.titre} : réponse en ${scenGuide.unite}`)}
        {etape === idx('lecture')
          ? <LignesVue s={scenGuide} prevu/>
          : <BarresVue s={scenGuide} prevu={pv && etape >= idx('mesure')} cacherAB={scenGuide === V && etape === idx('vedettes')}/>}
      </> : <>
        {titreP('Rouge à lèvres : note du jury')}
        <MelangeVue montrerMoyenne={apres('rouge')} cacherMelange={false}/>
      </>}
    </div>);
  const eqBox = enGuide && des('modele') && (
    <div style={{ ...styleBoite, ...cadre('equation') }}>{titreP('Le modèle de la vinaigrette')}<Equation y="Note" a="U" b="N" c={apres('modele') ? modele(Vi) : null}/></div>);
  const pontBox = enGuide && des('pont') && (
    <div style={{ ...styleBoite, ...cadre('pont') }}>{titreP('Du football à la chimie')}<TablePont/></div>);

  // ---------- exploration : « Mon cas » ----------
  const setE = f => setExplo(e => ({ ...e, ...f }));
  const sx = { id: 'perso', titre: 'Mon cas', unite: 'buts / match', dec: 1, ...explo.perso, cA: 'A', cB: 'B', etiq: [['ni A', 'ni B'], ['A', 'seul'], ['B', 'seul'], ['A et B', 'ensemble']] };
  const iX = interaction(sx), prevX = additif(sx), cm = modele(sx);
  const exploControles = enExplo && (
    <div style={styleBoite}>
      {titreP('Mon cas : une équipe avec deux attaquants A et B')}
      <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>Réglez le nombre de buts par match dans les quatre situations. Le modèle, le graphique et l’interaction se mettent à jour.</div>
      {[['base', 'Sans A ni B', '#64748b'], ['A', 'A seul', '#b45309'], ['B', 'B seul', '#0f766e'], ['AB', 'A et B ensemble', '#0369a1']].map(([c, l, col]) =>
        <Curseur key={c} nom={l} valeur={explo.perso[c]} onChange={v => setE({ perso: { ...explo.perso, [c]: v } })} min={0} max={5} pas={0.1} decimales={1} unite={`${NB}buts / match`} couleur={col}/>)}
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, marginTop: 6 }}><input type="checkbox" checked={explo.lignes} onChange={e => setE({ lignes: e.target.checked })}/>Afficher les droites d’interaction (sinon : les barres)</label>
    </div>);
  const modeleBox = enExplo && (
    <div style={styleBoite}>
      {titreP('Le modèle du plan 2²')}
      <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.5, marginBottom: 6 }}>On code chaque niveau : <strong>−1</strong> sans le joueur, <strong>+1</strong> avec le joueur. Le modèle prévoit alors les buts dans chaque situation :</div>
      <div style={{ margin: '4px 0 8px' }}><Equation y="Buts" a="A" b="B" c={cm}/></div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: KIT.txt }}>
        <li><em>a</em><sub>0</sub> = {nf(cm.a0, 2)} : moyenne des quatre situations.</li>
        <li><em>a</em><sub>A</sub> = {nf(cm.aA, 2)} et <em>a</em><sub>B</sub> = {nf(cm.aB, 2)} : effets de A et de B.</li>
        <li><em>a</em><sub>AB</sub> = {nf(cm.aAB, 2)} : le terme d’<strong>interaction</strong>, égal à l’interaction ÷ 4 ({nf(iX, 2)} ÷ 4). Il est nul si les effets s’additionnent.</li>
      </ul>
    </div>);
  const exploScene = enExplo && (
    <div style={styleBoite}>
      {explo.lignes ? <>{titreP('Droites d’interaction')}<LignesVue s={sx} prevu/></> : <>{titreP('Buts par match')}<BarresVue s={sx} prevu/></>}
      <div style={{ marginTop: 6 }}>
        <LigneMesure nom="Prévu si les effets s’additionnent" valeur={`${nf(prevX)}${NB}buts / match`} couleur="#dc2626"/>
        <LigneMesure nom="Mesuré (A et B ensemble)" valeur={`${nf(sx.AB)}${NB}buts / match`} couleur="#0369a1"/>
        <LigneMesure nom="Interaction (mesuré − prévu)" valeur={`${sg(iX)}${nf(Math.abs(iX))}${NB}buts / match`} couleur="#b45309"/>
      </div>
      <div role="status" aria-live="polite" style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: KIT.txt }}>{VERDICTS[verdict(iX)]}</div>
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Football</strong> : chiffres <strong>inventés</strong> pour illustrer l’idée, pas des statistiques réelles.</li>
      <li><strong>Vinaigrette</strong> : notes de jury <strong>réelles</strong> d’un plan complet à 4 facteurs ; chaque valeur est la <strong>moyenne de 4 essais</strong> (les deux autres facteurs sont moyennés), arrondie au dixième. Une seule mesure par essai : la répétabilité n’est pas connue, donc une petite interaction pourrait n’être que du bruit.</li>
      <li><strong>Modèle codé</strong> : les niveaux −1 / +1 supposent deux états seulement ; le modèle à 4 coefficients pour 4 essais passe exactement par les mesures (aucun écart, donc aucun test possible).</li>
      <li><strong>Additivité</strong> : le « prévu » suppose que l’effet de chaque facteur est le même quel que soit le niveau de l’autre. L’interaction mesure l’écart à cette hypothèse.</li>
      <li><strong>Notes bornées</strong> : un jury note entre 0 et 10 ; ce plafond peut créer un antagonisme apparent (le prévu dépasse 10), propre à l’échelle de notation.</li>
      <li><strong>Rouge à lèvres</strong> : données réelles d’un plan de mélange ; avec des proportions qui font 100 %, on compare au mélange idéal sans interaction, la moyenne des deux corps purs. L’échelle de notes est relative au lot présenté.</li>
      <li><strong>Défis</strong> : plans 2² fictifs tirés au hasard, notes entre 0 et 10.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- défi ----------
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['ecart', 'Calculer l’interaction'], ['verdict', 'Reconnaître le cas']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'ecart' ? 'Défi : chiffrez l’interaction' : 'Défi : synergie, antagonisme ou rien ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>Un plan 2² (facteurs A et B) a donné les notes ci-dessous (sur 10). {defi.type === 'ecart' ? 'Calculez l’interaction : mesuré − prévu additif.' : 'Comparez le mesuré au prévu additif et choisissez.'}</div>
      <div style={{ marginBottom: 8 }}><BarresVue s={defi.s} prevu={false}/></div>
      {defi.type === 'ecart' ? <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
          <span style={{ minWidth: 150 }}>Interaction</span>
          <input value={defi.reps.a ?? ''} aria-label="Interaction" onKeyDown={e => e.key === 'Enter' && document.getElementById('int-verif')?.click()} onChange={e => setRepD('a', e.target.value)}
            style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>points</span>
        </div>
        <IndiceDefi cache={false}>Prévu = départ + (A seul − départ) + (B seul − départ). Interaction = mesuré (A et B ensemble) − prévu.</IndiceDefi>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button id="int-verif" onClick={() => verifierDefi()} style={styleBouton(true, '#15803d')}>Vérifier</button>
          <button onClick={() => nouveauDefi('ecart')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div></> : <>
        <IndiceDefi cache={false}>Calculez l’écart mesuré − prévu : positif, synergie ; négatif, antagonisme ; nul (à 0,05 près), aucune interaction.</IndiceDefi>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['synergie', 'Synergie'], ['antagonisme', 'Antagonisme'], ['aucune', 'Aucune interaction']].map(([c, l]) => <button key={c} onClick={() => verifierDefi(c)} aria-pressed={defi.choix === c} style={stylePetitBouton(defi.choix === c, '#0369a1')}>{l}</button>)}
          <button onClick={() => nouveauDefi('verdict')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div></>}
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.msg}</div>}
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: KIT.txt }}>
        <li>Fabriquez une <strong>synergie</strong>, puis un <strong>antagonisme</strong> : où se place « A et B ensemble » ? Que fait le terme <em>a</em><sub>AB</sub> ?</li>
        <li>Cherchez la valeur de « A et B ensemble » qui donne une interaction <strong>nulle</strong>. Que deviennent les droites ? Et <em>a</em><sub>AB</sub> ?</li>
        <li>Réglez A seul = B seul = « sans A ni B » : les deux joueurs n’apportent rien seuls. Peuvent-ils quand même apporter ensemble ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Buts = a₀ + a<sub>A</sub>x<sub>A</sub> + a<sub>B</sub>x<sub>B</sub> + a<sub>AB</sub>x<sub>A</sub>x<sub>B</sub> ; a<sub>AB</sub> = interaction ÷ 4</li>
        <li>interaction = mesuré − prévu (effets additionnés)</li>
        <li>positive : synergie ; négative : antagonisme</li>
        <li>droites parallèles : pas d’interaction</li>
        <li>un facteur à la fois : l’interaction reste invisible</li>
        <li>plan factoriel : toutes les combinaisons de niveaux</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .int-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .int-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(300px, 420px); }
        .int-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        @media (min-width: 901px) { .int-l1.cote .int-carte { order: 2; } .int-l1.cote .int-main { order: 1; } }
        @media (max-width: 900px) { .int-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Pourquoi un plan d’expériences ?</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Deux facteurs peuvent <strong>s’additionner</strong>… ou <strong>interagir</strong>. Du football à la vinaigrette, découvrez l’idée qui justifie les plans d’expériences.</div>
      <div className={`int-l1${!enExplo ? ' cote' : ''}`}>
        {enGuide ? <div className="int-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="int-carte">{panneauHypo}</div> : null}
        <div className="int-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'ecart' ? sE : sV}/></div>}
          {enGuide && <div className="int-col">{guideScene}{eqBox}{pontBox}</div>}
          {enExplo && <div className="int-col">{exploControles}{modeleBox}{exploScene}</div>}
        </div>
      </div>
      {enGuide && etape >= ETAPES.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      {enExplo && <><div style={{ marginBottom: 12 }}>{panneauHypo}</div><div className="int-l1" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>{aEssayer}{retenir}</div></>}
    </div>
  );
}
