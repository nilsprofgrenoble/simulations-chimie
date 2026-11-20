import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, LigneMesure, Curseur } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./changementEtat2gtModele";
import { QCM } from "./changementEtat2gtQcm";
import { EquationTete } from "./EquationReactionScenes";
import { COL } from "./changementEtat2gtCouleurs";
import { SceneTroisEtats, SchemaSix, SceneMicro, SceneTransfert, SceneDissolution, SceneProportion, SceneFormule, SceneOrdre, CourbePalier, TableauCorps } from "./ChangementEtat2gtScenes";
import { FicheSix, FicheEquation, FicheEndoExo, FicheFusionDissolution, FicheEnergie, FicheOrdre } from "./ChangementEtat2gtFiches";

const SIM_ID = 195, CLE_GUIDE = 'changement-etat-2gt-guide-v1';
declarerDefis(SIM_ID, [['energie', 'Calculer l’énergie ou la masse d’un changement d’état'], ['situation', 'Reconnaître un changement d’état et le sens du transfert']]);

// ====================================================
//  SIM 195 — CHANGEMENT D'ÉTAT : ÉQUATION, TRANSFERT THERMIQUE ET ÉNERGIE (2GT spé PC, « Constitution et transformations de la matière », A « Transformation physique »).
//  Prérequis : simulation 178 (entités, molécules), simulation 179 (équation de réaction, états physiques, exothermique / endothermique).
//  Suite : simulation 159 (combustions, énergie échangée, 1G). Une seule idée : un changement d'état est une transformation physique : mêmes entités,
//  autre rangement ; il s'écrit avec une équation, échange de l'énergie avec le milieu (E = m × L) et se fait à température constante.
//  Parcours (13 étapes) : trois états (1), noms des changements (2), sublimation (1), équation (1), molécules (1), sens du transfert (1), fusion ≠ dissolution (1),
//  proportionnalité (1), E = m × L (1), deux corps (1), ordre de grandeur (1), pourquoi la vaporisation coûte plus (1), bilan (1). Modèle : changementEtat2gtModele.js (testé).
//  Capacités visées (jamais affichées à l'élève) : citer des exemples de changements d'état ; établir l'écriture d'une équation pour un changement d'état ;
//  distinguer fusion et dissolution ; identifier le sens du transfert thermique et le relier à exothermique / endothermique ; exploiter E = m × L ; relier l'énergie à la masse.
//  Hors programme, non traité : capacité thermique, chaleur sensible, enthalpie, diagramme (P, T), changement de pression.
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const NB = M.NB;
const nf = M.nombreFR;
const unKJ = x => `${nf(M.arrondiSig(x, 3))}${NB}kJ`;
const EauL = M.CORPS.eau, Eth = M.CORPS.ethanol;
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
// Le mot « sens » de l'énoncé : on fournit ou on cède de l'énergie
const verbeEnergie = chid => (M.sens(chid) === 'endo' ? 'à fournir' : 'cédée');

export function SimulationChangementEtat() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviE, noterE] = useCompteurDefi(), [suiviS, noterS] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('energie');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [ex, setEx] = useState({ cid: 'eau', chid: 'fusion', m: 1.0, pct: 0.4, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['etats', 'noms', 'sublim', 'equation', 'micro', 'sens', 'dissolution', 'propor', 'emL', 'deuxcorps', 'ordre', 'pourquoi', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const ETAPES = [
    { id: 'etats', titre: 'L’eau a trois états', focus: ['scene'],
      texte: <>L’eau existe sous trois <strong>états</strong> : <strong>solide</strong> (la glace), <strong>liquide</strong> (l’eau du robinet) et <strong>gaz</strong> (la vapeur d’eau). Un <strong>changement d’état</strong> est le passage d’un de ces états à un autre. Regardez les trois états sur le schéma.</>,
      tache: { type: 'qcm', ...QCM.etats } },
    { id: 'noms', titre: 'Donner un nom au changement', focus: ['scene'],
      texte: <>Chaque changement d’état a un nom. Quand un solide devient liquide, c’est la <strong>fusion</strong>. Le changement inverse, du liquide vers le solide, s’appelle la <strong>solidification</strong>. Quand un liquide devient un gaz, c’est la <strong>vaporisation</strong>. Sur le schéma, une flèche montre chaque changement ; un nom manque.
        <ExempleResolu>Un glaçon qui fond passe de l’état solide à l’état liquide : c’est la <strong>fusion</strong>.</ExempleResolu>
        À vous : trouvez le nom manquant.</>,
      tache: { type: 'qcm', ...QCM.noms } },
    { id: 'sublim', titre: 'Passer directement de solide à gaz', focus: ['scene'],
      texte: <>Parfois, un corps saute l’état liquide. Quand un solide devient directement un gaz, c’est la <strong>sublimation</strong>. Exemple : la « glace sèche » (du dioxyde de carbone solide) <strong>disparaît</strong> sans laisser de liquide. Le schéma montre deux flèches de plus : un nom manque encore.</>,
      tache: { type: 'qcm', ...QCM.sublim } },
    { id: 'equation', titre: 'Écrire l’équation d’un changement d’état', focus: ['scene'],
      texte: <>Un changement d’état s’écrit avec une <strong>équation</strong>, comme une réaction : la flèche va de l’état de départ à l’état d’arrivée. On note l’état entre parenthèses après la formule : <strong>(s)</strong> solide, <strong>(l)</strong> liquide, <strong>(g)</strong> gaz.
        <ExempleResolu>Fusion de l’eau : l’eau passe de l’état solide à l’état liquide, donc <strong>H₂O(s) → H₂O(l)</strong>. Cette équation est écrite en haut de l’écran.</ExempleResolu>
        À vous : la vaporisation.</>,
      tache: { type: 'qcm', ...QCM.equation },
      retenirTitre: 'Les six changements d’état',
      retenir: <><FicheSix />
        <ul style={liste}>
          <li><strong>Trois paires de changements opposés</strong> : fusion et solidification ; vaporisation et liquéfaction ; sublimation et condensation solide (aussi appelée déposition).</li>
          <li><strong>Exemples</strong> : un glaçon qui fond (fusion), de l’eau qui bout (vaporisation), la buée (liquéfaction), le givre (condensation solide).</li>
        </ul>{renvoi}</> },
    { id: 'micro', titre: 'Le monde des molécules', focus: ['scene'],
      texte: <>Une <strong>molécule</strong> est un petit assemblage d’atomes, trop petit pour être vu : une molécule d’eau s’écrit H₂O. On la dessine par un <strong>disque</strong>. Voici l’eau dessinée sous ses trois états. Comparez la place des molécules d’un état à l’autre.</>,
      tache: { type: 'qcm', ...QCM.micro } },
    { id: 'sens', titre: 'Qui donne l’énergie ?', focus: ['scene'],
      texte: <>Un <strong>transfert thermique</strong> est un échange d’énergie sous forme de chaleur. Le <strong>système</strong> est ce que l’on étudie (ici la glace) ; le <strong>milieu</strong> est ce qui l’entoure. Pour fondre, la glace <strong>reçoit</strong> de l’énergie de son milieu : c’est pour cela qu’elle refroidit une boisson. Quand le système <strong>reçoit</strong> de l’énergie, le changement d’état est <strong>endothermique</strong> ; quand il en <strong>cède</strong>, il est <strong>exothermique</strong>.</>,
      tache: { type: 'qcm', ...QCM.sens },
      retenirTitre: 'Écrire l’équation et regarder les molécules',
      retenir: <><FicheEquation />
        <ul style={liste}>
          <li><strong>Phrase-clé : même formule, autre état.</strong> Les molécules sont les mêmes avant et après : on parle de transformation <strong>physique</strong>.</li>
          <li><strong>Idée fausse</strong> : « quand l’eau bout, elle se change en autre chose ». <strong>Vrai</strong> : ce sont toujours des molécules H₂O.</li>
        </ul>{renvoi}</> },
    { id: 'dissolution', titre: 'Fondre n’est pas dissoudre', focus: ['scene'],
      texte: <>Attention à ne pas confondre la <strong>fusion</strong> avec la <strong>dissolution</strong>.
        <ExempleResolu>Un glaçon qui fond : un <strong>seul corps pur</strong> (un corps pur ne contient qu’une seule espèce chimique), l’eau, change d’état (solide → liquide). Du sucre dans du thé : <strong>deux corps</strong> sont mélangés. Les entités du sucre (les petits morceaux qui le forment) se séparent et se mêlent à l’eau, qui reste liquide. On ne change pas d’état : on change de mélange.</ExempleResolu>
        À vous : un autre solide qui « disparaît » dans l’eau.</>,
      tache: { type: 'qcm', ...QCM.dissolution },
      retenirTitre: 'Endothermique ou exothermique',
      retenir: <><FicheEndoExo />
        <ul style={liste}>
          <li><strong>Phrase-clé : ENDO, l’énergie ENTRE ; EXO, l’énergie SORT.</strong></li>
          <li><strong>Exemple</strong> : la glace qui fond refroidit la boisson, car elle lui prend de l’énergie (endothermique). Le changement inverse libère cette énergie (exothermique).</li>
        </ul>{renvoi}</> },
    { id: 'propor', titre: 'Plus de glace, plus d’énergie', focus: ['scene'],
      texte: <>Pour faire fondre de la glace à 0 °C, il faut lui fournir de l’énergie, mesurée en <strong>kilojoules</strong> (kJ). Le graphique donne l’énergie nécessaire pour trois masses de glace : les points sont alignés avec l’origine.
        <ExempleResolu>0,10 kg de glace demandent 33 kJ. Avec 0,20 kg, il y a <strong>deux fois plus</strong> de glace : il faut <strong>deux fois plus</strong> d’énergie, soit 67 kJ.</ExempleResolu>
        À vous : une masse plus grande que celles du graphique.</>,
      tache: { type: 'num', q: <>Quelle énergie faut-il pour faire fondre 0,50 kg de glace ? (Rappel : 0,10 kg demandent 33 kJ.)</>, carnet: false, unite: 'kJ', vrai: 0.5 * EauL.Lfus, tol: 0.06, affiche: v => nf(M.arrondiSig(v, 3)),
        calcul: () => ['0,50 kg est 5 fois plus grand que 0,10 kg (0,50 ÷ 0,10 = 5).', 'L’énergie est 5 fois plus grande : 5 × 33 = 165 kJ, soit environ 170 kJ (avec la valeur 334 kJ/kg : 167 kJ).'],
        pieges: [[33, 'C’est l’énergie pour 0,10 kg. Ici la masse est 5 fois plus grande : multipliez par 5.'], [100, 'C’est l’énergie pour 0,30 kg (point du graphique). Pour 0,50 kg, il faut davantage.'], [0.5 * 33, 'On ne divise pas : plus de glace demande plus d’énergie, 5 fois plus que pour 0,10 kg.'], [33 + 0.4 * 33, 'On ne les additionne pas : on multiplie par le nombre de fois que la masse est plus grande.']],
        expl: '0,50 kg = 5 × 0,10 kg, donc 5 × 33 kJ ≈ 165 kJ (167 kJ avec L = 334 kJ/kg) : l’énergie est proportionnelle à la masse.', indice: 'Combien de fois 0,10 kg tient-il dans 0,50 kg ? Multipliez 33 kJ par ce nombre.' },
      retenirTitre: 'Fusion ou dissolution',
      retenir: <><FicheFusionDissolution />
        <ul style={liste}>
          <li><strong>Phrase-clé : fusion, on change d’état ; dissolution, on change de mélange.</strong></li>
          <li><strong>Exemple</strong> : le glaçon qui fond reste de l’eau ; le sucre dans le thé reste du sucre, mêlé à l’eau liquide.</li>
        </ul>{renvoi}</> },
    { id: 'emL', titre: 'La relation E = m × L', focus: ['scene'],
      texte: <>Pour <strong>1 kg</strong> de glace, il faut toujours la même énergie : 334 kJ. Cette valeur s’appelle l’<strong>énergie massique de changement d’état</strong>, notée <strong>L</strong>. Elle s’exprime en <strong>kJ/kg</strong> et dépend du corps et du changement d’état. Pendant la fusion, la glace <strong>reste à 0 °C</strong> : la température ne change pas tant qu’il reste de la glace. L’énergie échangée est <strong>E = m × L</strong>, avec E en kJ, m en kg et L en kJ/kg.
        <ExempleResolu>Fusion de 2,0 kg de glace : E = 2,0 × 334 = <strong>668 kJ</strong>.</ExempleResolu>
        À vous, avec une autre masse (L de fusion de l’eau = 334 kJ/kg) :</>,
      tache: { type: 'num', q: <>Quelle énergie faut-il pour faire fondre 1,5 kg de glace ?</>, carnet: false, unite: 'kJ', vrai: 1.5 * EauL.Lfus, tol: 0.06, affiche: v => nf(M.arrondiSig(v, 3)),
        calcul: () => ['E = m × L, avec m = 1,5 kg et L = 334 kJ/kg.', 'E = 1,5 × 334 = 501 kJ, soit environ 500 kJ avec 2 chiffres significatifs.'],
        pieges: [[334, 'C’est la valeur de L, l’énergie pour 1 kg. Il faut la multiplier par la masse, 1,5 kg.'], [668, 'C’est le résultat de l’exemple, pour 2,0 kg. Ici la masse est 1,5 kg.'], [334 / 1.5, 'On multiplie L par la masse, on ne divise pas.'], [334 + 1.5, 'On ne les additionne pas : E = m × L.']],
        expl: 'E = m × L = 1,5 × 334 = 501 kJ, soit environ 500 kJ.', indice: 'E = m × L. Remplacez m par 1,5 kg et L par 334 kJ/kg, puis multipliez.' } },
    { id: 'deuxcorps', titre: 'Chaque corps a ses valeurs', focus: ['scene'],
      texte: <>La valeur de <strong>L</strong> change avec le corps et avec le changement d’état. Le tableau donne les valeurs de trois corps purs, à la pression atmosphérique normale. L’éthanol est l’alcool des gels hydroalcooliques ; le diazote est le gaz principal de l’air.</>,
      tache: { type: 'num', q: <>Quelle énergie faut-il pour vaporiser 0,50 kg d’éthanol liquide ?</>, carnet: false, unite: 'kJ', vrai: 0.5 * Eth.Lvap, tol: 0.06, affiche: v => nf(M.arrondiSig(v, 3)),
        calcul: () => ['Vaporisation de l’éthanol : on lit L = 840 kJ/kg dans le tableau.', 'E = m × L = 0,50 × 840 = 420 kJ.'],
        pieges: [[840, 'C’est la valeur de L, l’énergie pour 1 kg. Il faut la multiplier par la masse, 0,50 kg.'], [0.5 * EauL.Lvap, 'Vous avez pris L de l’eau (2 260 kJ/kg). Pour l’éthanol, lisez la ligne de l’éthanol.'], [0.5 * Eth.Lfus, 'Vous avez pris L de fusion (107 kJ/kg). On vaporise : lisez la colonne de la vaporisation.'], [2 * Eth.Lvap, 'On multiplie par la masse 0,50 kg, pas par 2.']],
        expl: 'L(vaporisation de l’éthanol) = 840 kJ/kg ; E = m × L = 0,50 × 840 = 420 kJ.', indice: 'Dans le tableau, lisez la ligne « éthanol » et la colonne « L de vaporisation », puis E = m × L.' },
      retenirTitre: 'La relation E = m × L',
      retenir: <><FicheEnergie />
        <ul style={liste}>
          <li><strong>Phrase-clé : E = m × L, et la masse double, l’énergie double.</strong> L se lit dans un tableau, en kJ/kg.</li>
          <li><strong>Hypothèses</strong> : corps pur, température constante pendant le changement d’état, L constante, pas de pertes.</li>
        </ul>{renvoi}</> },
    { id: 'ordre', titre: 'Un glaçon et une casserole', focus: ['scene'],
      texte: <>Les masses sont souvent données en grammes : il faut les convertir en kilogrammes (1 kg = 1 000 g).
        <ExempleResolu>Un glaçon de 20 g : 20 g = 0,020 kg. Fusion : E = 0,020 × 334 = <strong>6,7 kJ</strong>.</ExempleResolu>
        À vous : l’eau d’une casserole, à 100 °C (L de vaporisation de l’eau = 2 260 kJ/kg).</>,
      tache: { type: 'num', q: <>Quelle énergie faut-il pour vaporiser 20 g d’eau à 100 °C ?</>, carnet: false, unite: 'kJ', vrai: 0.020 * EauL.Lvap, tol: 0.06, affiche: v => nf(M.arrondiSig(v, 3)),
        calcul: () => ['Conversion : 20 g = 0,020 kg.', 'E = m × L = 0,020 × 2 260 = 45,2 kJ, soit environ 45 kJ.'],
        pieges: [[20 * EauL.Lvap, 'La masse n’est pas convertie : 20 g = 0,020 kg, il faut des kilogrammes avec L en kJ/kg.'], [EauL.Lvap, 'C’est la valeur de L, pour 1 kg. Ici la masse est de 20 g.'], [0.020 * EauL.Lfus, 'Vous avez pris L de fusion (334 kJ/kg). On vaporise : L de vaporisation vaut 2 260 kJ/kg.']],
        expl: '20 g = 0,020 kg ; E = 0,020 × 2 260 = 45,2 kJ, soit environ 45 kJ.', indice: 'Convertissez d’abord 20 g en kg, puis E = m × L avec L = 2 260 kJ/kg.' } },
    { id: 'pourquoi', titre: 'Pourquoi vaporiser coûte-t-il plus ?', focus: ['scene'],
      texte: <>Pour 20 g d’eau, la fusion demande 6,7 kJ et la vaporisation environ 45 kJ : c’est beaucoup plus. Cherchons pourquoi, en regardant de nouveau les molécules d’eau dans leurs états.</>,
      tache: { type: 'qcm', ...QCM.pourquoi } },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>Un changement d’état est une transformation <strong>physique</strong> : les molécules sont les mêmes, seul leur rangement change. Il s’écrit avec une <strong>équation</strong> (H₂O(s) → H₂O(l)) et se fait avec un <strong>transfert thermique</strong> : <strong>endothermique</strong> si le système reçoit de l’énergie, <strong>exothermique</strong> s’il en cède. L’énergie échangée vaut <strong>E = m × L</strong>. Vous pouvez maintenant explorer ou relever un défi.</>,
      tache: null,
      retenirTitre: 'Fondre ou vaporiser : l’ordre de grandeur',
      retenir: <><FicheOrdre />
        <ul style={liste}>
          <li><strong>Phrase-clé : dans un gaz, les molécules sont très éloignées.</strong> Pour 20 g d’eau, la vaporisation demande environ 7 fois plus d’énergie que la fusion.</li>
          <li><strong>Idée fausse</strong> : « pendant que l’eau bout, l’énergie reçue la rend plus chaude ». <strong>Vrai</strong> : la température reste à 100 °C, l’énergie sert à éloigner les molécules. Comparer 0 °C (fusion) et 100 °C (vaporisation) n’explique pas la différence d’énergie.</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // équation en tête de l'écran (introduite par l'étape « équation » dans le parcours guidé)
  const teteGuide = (() => {
    const i = IDS.indexOf(idE);
    if (!enGuide || i < IDS.indexOf('equation')) return null;
    if (idE === 'deuxcorps') return <EquationTete texte={M.equation('ethanol', 'vaporisation')} note="vaporisation de l’éthanol" />;
    if (idE === 'ordre' || idE === 'pourquoi') return <EquationTete texte={M.equation('eau', 'vaporisation')} note="vaporisation de l’eau" />;
    return <EquationTete texte={M.equation('eau', 'fusion')} note="fusion de l’eau" />;
  })();
  const legendeEtats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginTop: 4 }}>
      {[['(s)', 'solide'], ['(l)', 'liquide'], ['(g)', 'gaz']].map(([a, b]) => (
        <div key={a} style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '5px 8px', fontSize: 15, color: KIT.txt, textAlign: 'center' }}><strong>{a}</strong>{NB}: {b}</div>))}
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'energie') setDefi({ type, ...M.tirerDefiEnergie(prec && prec.type === 'energie' ? prec : null), rep: '', verifie: false });
    else setDefi({ type, s: M.tirerSituation(prec && prec.type === 'situation' ? prec.s : null), chid: '', sens: '', verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi, null);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifier = () => {
    if (defi.type === 'energie') {
      const x = lireNombre(defi.rep), ok = M.reponseJusteEnergie(defi, x);
      setDefi(d => ({ ...d, verifie: true, ok, x })); noterE(ok);
    } else {
      const v = M.verifierSituation(defi.s, { chid: defi.chid, sens: defi.sens }), ok = v.nomOk && v.sensOk;
      setDefi(d => ({ ...d, verifie: true, ok, v })); noterS(ok);
    }
  };
  const messageEnergie = d => {
    const c = M.corps(d.cid), ch = M.changement(d.chid);
    const bon = d.variante === 'E' ? `${unKJ(d.vrai)}` : `${nf(M.arrondiSig(d.vrai, 2))}${NB}kg`;
    if (d.ok) return `✓ Correct : ${d.variante === 'E' ? `E = m × L = ${nf(d.m)} × ${nf(d.L)} ≈ ${bon}` : `m = E ÷ L = ${nf(d.E)} ÷ ${nf(d.L)} ≈ ${bon}`}.`;
    const x = d.x;
    if (!isFinite(x)) return '✗ Entrez un nombre (avec la virgule ou le point).';
    if (Math.abs(x - d.L) <= 0.06 * d.L) return '✗ Vous avez recopié la valeur de L : c’est l’énergie pour 1 kg. Il faut utiliser la masse ou l’énergie de l’énoncé.';
    if (d.variante === 'E' && (Math.abs(x - d.vrai * 1000) <= 0.06 * d.vrai * 1000 || Math.abs(x - d.vrai / 1000) <= 0.06 * d.vrai / 1000)) return '✗ Il y a un facteur 1 000 : m est en kilogrammes, L en kJ/kg, E en kJ.';
    if (d.variante === 'm' && Math.abs(x - d.vrai * d.L) <= 0.06 * d.vrai * d.L) return '✗ Vous avez multiplié : pour trouver la masse, il faut diviser l’énergie par L.';
    if (d.variante === 'E' && Math.abs(x - d.m / d.L) <= 0.06 * d.m / d.L) return '✗ Vous avez divisé : pour trouver l’énergie, on multiplie la masse par L.';
    return `✗ Pas encore. Relisez la relation E = m × L (avec E en kJ, m en kg, L en kJ/kg) et vérifiez ${ch.nom === 'fusion' || ch.nom === 'solidification' ? 'la valeur de L de fusion' : 'la valeur de L de vaporisation'} de ${c.art}.`;
  };
  const messageSituation = d => {
    const eq = M.equation(d.s.cid, d.s.chid), ch = M.changement(d.s.chid);
    if (d.ok) return `✓ Correct : ${ch.nom}, ${M.PHRASE_SENS[M.sens(ch.id)]} (${M.NOM_SENS[M.sens(ch.id)]}). Équation : ${eq}.`;
    const dits = [!d.v.nomOk ? 'le nom du changement d’état : regardez l’état de départ et l’état d’arrivée' : null, !d.v.sensOk ? 'le sens du transfert : le système reçoit-il ou cède-t-il de l’énergie ?' : null].filter(Boolean);
    return `✗ À revoir : ${dits.join(' ; ')}.`;
  };
  const champDefiEnergie = (d) => {
    const c = M.corps(d.cid), ch = M.changement(d.chid), deltaEntete = d.variante === 'E';
    const phrase = ch.id === 'fusion' ? 'qui fondent' : ch.id === 'solidification' ? 'qui se solidifient' : ch.id === 'vaporisation' ? 'qui se vaporisent' : 'qui se liquéfient';
    return (
      <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
          {deltaEntete
            ? <>On étudie {c.du ? `un échantillon ${c.du}` : ''} : <strong>{ch.nom}</strong>. Masse : <strong>m{NB}={NB}{nf(d.m)}{NB}kg</strong>. Énergie massique de changement d’état : <strong>L{NB}={NB}{nf(d.L)}{NB}kJ/kg</strong>. Quelle énergie est <strong>{verbeEnergie(d.chid)}</strong> pour les {nf(d.m)}{NB}kg {c.du} {phrase} ? Donnez le résultat en kJ avec 2 chiffres significatifs.</>
            : <>On étudie {c.du ? `un échantillon ${c.du}` : ''} : <strong>{ch.nom}</strong>. Énergie échangée : <strong>E{NB}={NB}{nf(d.E)}{NB}kJ</strong>. Énergie massique de changement d’état : <strong>L{NB}={NB}{nf(d.L)}{NB}kJ/kg</strong>. Quelle masse {c.du} change d’état ? Donnez le résultat en kg avec 2 chiffres significatifs.</>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Réponse :</span>
          <input value={d.rep} aria-label="Votre réponse" inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('ce-verif')?.click()} onChange={e => setDefi(x => ({ ...x, rep: e.target.value, verifie: false }))}
            style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${d.verifie ? (d.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }} /><span>{deltaEntete ? 'kJ' : 'kg'}</span>
        </div>
        <IndiceDefi cache={false}>{deltaEntete ? 'Relation : E = m × L (E en kJ, m en kg, L en kJ/kg). Remplacez m et L par les valeurs de l’énoncé et multipliez.' : 'Relation : E = m × L, donc m = E ÷ L. Divisez l’énergie E (en kJ) par L (en kJ/kg) : vous obtenez des kg.'}</IndiceDefi>
      </>);
  };
  const champDefiSituation = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}><strong>{d.s.texte}</strong> Quel est le nom du changement d’état, et dans quel sens se fait le transfert thermique ?</div>
      <label style={etiquette}>Nom du changement d’état
        <select value={d.chid} onChange={e => setDefi(x => ({ ...x, chid: e.target.value, verifie: false }))} style={sel}>
          <option value="">— choisir —</option>{M.CHANGEMENTS.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>
      <label style={etiquette}>Transfert thermique
        <select value={d.sens} onChange={e => setDefi(x => ({ ...x, sens: e.target.value, verifie: false }))} style={sel}>
          <option value="">— choisir —</option><option value="endo">le système reçoit de l’énergie (endothermique)</option><option value="exo">le système cède de l’énergie (exothermique)</option></select></label>
      <IndiceDefi cache={false}>Cherchez l’état de départ et l’état d’arrivée : le nom en découle. Si les entités se libèrent (solide vers liquide, liquide vers gaz), le système reçoit de l’énergie ; sinon il en cède.</IndiceDefi>
    </>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['energie', 'Calculer E ou m'], ['situation', 'Reconnaître la situation']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'energie' ? 'Défi : énergie et masse lors d’un changement d’état' : 'Défi : reconnaître le changement d’état et le sens du transfert'}</div>
      {defi.type === 'energie' ? champDefiEnergie(defi) : champDefiSituation(defi)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="ce-verif" onClick={verifier} disabled={defi.type === 'situation' && (!defi.chid || !defi.sens)} style={{ ...styleBouton(true, '#15803d'), opacity: defi.type === 'situation' && (!defi.chid || !defi.sens) ? 0.5 : 1 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'energie' ? messageEnergie(defi) : messageSituation(defi)}</div>}
    </div>);
  const teteDefi = defi && (defi.type === 'energie'
    ? <EquationTete texte={M.equation(defi.cid, defi.chid)} note={`${M.changement(defi.chid).nom} ${M.corps(defi.cid).de}`} />
    : <EquationTete texte={defi.verifie && defi.ok ? M.equation(defi.s.cid, defi.s.chid) : `${M.corps(defi.s.cid).f}(?) → ${M.corps(defi.s.cid).f}(?)`} note={defi.verifie && defi.ok ? M.changement(defi.s.chid).nom : 'les états sont à trouver'} />);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Corps pur, pression atmosphérique</strong> : un seul corps, à la pression normale. Un mélange (eau salée, par exemple) ne change pas d’état à une seule température.</li>
      <li><strong>Température constante pendant le changement d’état</strong> : c’est le palier du graphique (0 °C pour l’eau qui fond, 100 °C pour l’eau qui bout). La température change avant et après, ce n’est pas étudié ici.</li>
      <li><strong>L constante</strong> : on suppose que la même énergie est nécessaire pour chaque kilogramme qui change d’état. Les valeurs sont celles de tables, à 2 ou 3 chiffres ; elles varient un peu d’une table à l’autre. En réalité, L dépend de la température et de la pression.</li>
      <li><strong>Pas de pertes thermiques</strong> : toute l’énergie échangée sert au changement d’état. Dans une vraie expérience, une partie est perdue dans l’air.</li>
      <li><strong>Pas de chauffage seul</strong> : on n’étudie que le changement d’état à sa température de changement d’état ; l’énergie pour chauffer ou refroidir un corps sans changement d’état n’est pas traitée.</li>
      <li><strong>Même L pour deux changements inverses</strong> : fusion et solidification, vaporisation et liquéfaction ont la même valeur de L ; le transfert est de sens opposé.</li>
      <li><strong>Sublimation et condensation solide</strong> : on les nomme, on les écrit et on donne le sens du transfert ; aucune valeur de L n’est utilisée.</li>
      <li><strong>Schémas simplifiés</strong> : les molécules sont des disques ; leurs tailles et leurs distances ne sont pas à l’échelle. La courbe du graphique avant et après le palier est seulement indiquée.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const sceneGuide = (() => {
    switch (idE) {
      case 'etats': return boite('Les trois états de l’eau', <SceneTroisEtats />, cadre('scene'));
      case 'noms': return boite('Trois états, des flèches', <SchemaSix grand longues={false} masques={['liquefaction']} />, cadre('scene'));
      case 'sublim': return boite('Deux flèches de plus', <SchemaSix grand masques={['condensation']} />, cadre('scene'));
      case 'equation': return boite('Écrire l’état entre parenthèses', <>{teteGuide}{legendeEtats}</>, cadre('scene'));
      case 'micro': return boite('L’eau à l’échelle des molécules', <>{teteGuide}<SceneMicro /></>, cadre('scene'));
      case 'sens': return boite('Le système et son milieu', <>{teteGuide}<SceneTransfert ch="fusion" /></>, cadre('scene'));
      case 'dissolution': return boite('Deux situations', <>{teteGuide}<SceneDissolution /></>, cadre('scene'));
      case 'propor': return boite('Énergie pour faire fondre de la glace', <>{teteGuide}<SceneProportion /></>, cadre('scene'));
      case 'emL': return boite('L’énergie massique de l’eau', <>{teteGuide}<SceneFormule /><div style={{ marginTop: 8 }}><TableauCorps lignes={[EauL]} /></div></>, cadre('scene'));
      case 'deuxcorps': return boite('Énergies massiques de trois corps', <>{teteGuide}<TableauCorps /></>, cadre('scene'));
      case 'ordre': return boite('20 g d’eau, deux changements', <>{teteGuide}<SceneOrdre /></>, cadre('scene'));
      case 'pourquoi': return boite('Les molécules d’eau', <>{teteGuide}<SceneMicro legende={false} /></>, cadre('scene'));
      case 'bilan': return boite('Les six changements d’état', <>{teteGuide}<SchemaSix grand colore /></>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const ch = M.changement(ex.chid), co = M.corps(ex.cid), lEx = M.L(ex.cid, ex.chid), tEx = M.T(ex.cid, ex.chid), avecL = lEx != null;
  const Etot = avecL ? M.energie(ex.m, lEx) : 0, Eech = avecL ? ex.pct * Etot : 0;
  const mTr = avecL ? M.masseTransformee(Eech, ex.m, lEx) : 0;
  const sensEx = M.sens(ex.chid);
  const reglagesEx = (<>
    <label style={etiquette}>Corps pur
      <select value={ex.cid} onChange={x => setEx(s => ({ ...s, cid: x.target.value }))} style={sel}>{M.LISTE_CORPS.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.f})</option>)}</select></label>
    <label style={etiquette}>Changement d’état
      <select value={ex.chid} onChange={x => setEx(s => ({ ...s, chid: x.target.value }))} style={sel}>{M.CHANGEMENTS.map(c => <option key={c.id} value={c.id}>{c.nom} ({M.NOM_ETAT[c.de]} → {M.NOM_ETAT[c.vers]})</option>)}</select></label>
    {avecL && <>
      <Curseur nom="Masse du corps" valeur={ex.m} onChange={v => setEx(s => ({ ...s, m: Math.round(v * 10) / 10 }))} min={0.1} max={5} pas={0.1} unite="kg" decimales={1} couleur="#0369a1" />
      <Curseur nom={`Énergie ${sensEx === 'endo' ? 'fournie' : 'cédée'}`} valeur={Eech} onChange={v => setEx(s => ({ ...s, pct: Etot > 0 ? Math.min(1, Math.max(0, v / Etot)) : 0 }))} min={0} max={Etot} pas={Etot / 100} unite="kJ" decimales={Etot < 100 ? 1 : 0} couleur="#b45309" />
    </>}
    {aide(avecL ? 'Choisissez un corps et un changement d’état, réglez la masse, puis faites avancer l’énergie : le point reste sur le palier, car la température ne change pas pendant le changement d’état.' : 'Choisissez un corps et un changement d’état : l’équation, le sens du transfert et le dessin des molécules sont affichés.')}
  </>);
  const scEx = avecL
    ? <CourbePalier cid={ex.cid} chid={ex.chid} m={ex.m} E={Eech} />
    : <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>Pour la {ch.nom}, aucune valeur de L n’est utilisée dans cette simulation : il n’y a pas de courbe. Regardez le sens du transfert et les molécules ci-dessous.</div>;
  const mesuresEx = (
    <div style={{ marginTop: 8 }}>
      <LigneMesure nom="Équation" valeur={M.equation(ex.cid, ex.chid)} />
      <LigneMesure nom="Transfert thermique" valeur={`${M.NOM_SENS[sensEx]}`} couleur={sensEx === 'endo' ? COL.orange : COL.bleu} />
      {avecL && <>
        <LigneMesure nom="Température du palier" valeur={`${nf(tEx)}${NB}°C`} />
        <LigneMesure nom="L" valeur={`${nf(lEx)}${NB}kJ/kg`} />
        <LigneMesure nom="Énergie pour tout changer d’état" valeur={unKJ(Etot)} />
        <LigneMesure nom={`Masse déjà ${ch.vers === 'l' ? 'liquide' : ch.vers === 's' ? 'solide' : 'gazeuse'}`} valeur={`${nf(M.arrondiSig(mTr, 3))}${NB}kg`} couleur={COL.vert} />
      </>}
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Fusion de l’eau : doublez la masse. Que devient l’énergie nécessaire ? Quelle relation voyez-vous ?</li>
      <li>Pour 1,0 kg, comparez la fusion et la vaporisation de l’eau. Laquelle demande le plus d’énergie ?</li>
      <li>Passez de la fusion à la solidification : que changent l’équation, le sens du transfert et le mot « fournie » ou « cédée » ?</li>
      <li>Comparez l’éthanol et le diazote pour la vaporisation de 1,0 kg. Quel corps demande le moins d’énergie ?</li>
      <li>Pendant le changement d’état, la température change-t-elle ? Que voyez-vous sur la courbe ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>six changements d’état : fusion, solidification, vaporisation, liquéfaction, sublimation, condensation solide</li>
        <li>équation : même formule, états différents, par exemple H₂O(s) → H₂O(l)</li>
        <li>endothermique : le système reçoit de l’énergie ; exothermique : il en cède</li>
        <li>fusion : on change d’état ; dissolution : on change de mélange</li>
        <li>E = m × L, avec L en kJ/kg ; la température reste constante pendant le changement d’état</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ce-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ce-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .ce-l1.cote .ce-carte { order: 2; } .ce-l1.cote .ce-main { order: 1; } }
        @media (max-width: 900px) { .ce-l1.cote { grid-template-columns: minmax(0, 1fr); } .ce-l1.cote .ce-main { order: 1; } .ce-l1.cote .ce-carte { order: 2; } .ce-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .ce-in { animation: ce-fondu 0.35s ease-out; } @keyframes ce-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Changement d’état : équation, transfert thermique et énergie</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>changement d’état</strong> est le passage d’un corps de l’état solide, liquide ou gaz à un autre. On l’écrit avec une <strong>équation</strong>, il échange de l’<strong>énergie</strong> avec le milieu, et cette énergie dépend de la <strong>masse</strong> qui change d’état.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          <EquationTete texte={M.equation(ex.cid, ex.chid)} note={`${ch.nom} ${co.de}`} />
          {reglagesEx}{scEx}{mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`ce-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="ce-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="ce-carte ce-hypo-defi">{panneauHypo}</div> : null}
          <div className="ce-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'energie' ? suiviE : suiviS} /></div>}
            {enDefi && defi && <div className="ce-in" key={`${defi.type}${defi.cid ?? defi.s.id}${defi.chid}${defi.m ?? defi.E ?? ''}`}>{boite(null, teteDefi)}</div>}
            {enGuide && <div className="ce-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
