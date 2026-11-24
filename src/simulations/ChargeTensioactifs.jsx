import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre, stylePetitBouton, Formule, FormuleEnLigne } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./chargeTensioactifsModele";
import { QCM } from "./chargeTensioactifsQcm";
import { SvgTete, SvgPredominance, SvgGouttes, SvgAttraction, SvgCarteIoniques, SvgCarteZwitterion, SvgCarteAmphotere, SvgCarteTest, SvgCarteNonionique, SvgFormules, SvgDissolution, SvgFormulesEx, SvgCarteFormule } from "./ChargeTensioactifsSchemas";

const SIM_ID = 220, CLE_GUIDE = 'charge-tensioactifs-guide-v1';
declarerDefis(SIM_ID, [['famille', 'Reconnaître la famille d’un tensioactif sur son diagramme de prédominance'], ['fraction', 'Fraction ionisée d’un acide gras (prolongement)'], ['iso', 'Point isoélectrique d’un amphotère (prolongement)'], ['formule', 'Famille d’un tensioactif d’après sa formule écrite']]);

// ====================================================
//  SIM 220 — CHARGE D'UN TENSIOACTIF SELON LE pH (BTS MDC, Formulation › Tensioactifs et émulsions)
//  Une seule idée : la charge de la tête dépend (ou non) du pH selon la famille ; on distingue ioniques, amphotères et non ioniques en comptant les SORTES de charges possibles.
//  Capacités visées (jamais affichées à l'élève) : citer les familles de tensioactifs et expliquer leur rôle émulsifiant (charge de la tête, répulsion des gouttes).
//  Prolongements HORS référentiel (exploration, défis) : fraction ionisée (Henderson–Hasselbalch), point isoélectrique.
//  Modèle : chargeTensioactifsModele.js. Schémas : ChargeTensioactifsSchemas.jsx. Les pKa sont des ordres de grandeur arrondis (panneau d'hypothèses).
// ====================================================

const COL = { bleu: '#0369a1', rouge: '#b91c1c', vert: '#15803d', violet: '#7c3aed', orange: '#b45309' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const sig2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const signee = (v, d = 2) => (Math.abs(v) < 0.005 ? '0,00' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(d).replace('.', ',')}`);
const PH_DEPART = { sds: 7, formules: 7, sel: 7, 'formules-ex': 7, ctab: 7, savon: 8, ioniques: 7, betaine: 7, 'betaine-courbes': 7, alanine: 7, distinguer: 7, nonionique: 7, melange: 7, emulsion: 9 };
const FAMILLES = ['anionique', 'cationique', 'amphotère', 'non ionique'];
const COUL_FAM = { anionique: COL.rouge, cationique: COL.bleu, 'amphotère': COL.violet, 'non ionique': COL.vert };

// corrigé du défi « famille d'après la formule »
function corrigeFormule(d) {
  if (d.famille === 'non ionique') return 'Aucun groupe ionisable : la tête n’est jamais chargée.';
  if (d.famille === 'amphotère') return 'La même molécule porte un groupe + et un groupe − (pas de contre-ion à ignorer) : amphotère.';
  return `L’ion qui porte la chaîne R est ${d.e.ecritures[0]}, de charge ${d.famille === 'anionique' ? '−' : '+'}. Le contre-ion ${d.e.contre} n’a pas de chaîne : on l’ignore. Famille : ${d.famille}.`;
}
// phrase qui explique, à partir des courbes, la famille d'un tensioactif (corrigé du défi 1)
function expliqueFamille(e) {
  const b = M.bilan(e);
  if (e.groupes.length === 0) return 'Une seule zone grise sur tout le diagramme : la tête n’a aucun groupe qui se charge, à aucun pH. C’est un tensioactif non ionique.';
  if (b.sPlus && b.sMoins) return 'Les deux sortes de charges (+ et −) apparaissent sur la même tête, pour des pH différents (zones bleue, violette ou rouge) : c’est un amphotère.';
  return b.sMoins ? 'Seule la charge − apparaît (zone rouge), jamais la charge + : c’est un tensioactif anionique.' : 'Seule la charge + apparaît (zone bleue), jamais la charge − : c’est un tensioactif cationique.';
}

export function SimulationChargeTensioactifs() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [pH, setPH] = useState(7);
  const [sp, setSp] = useState('sds');
  const [ouv, setOuv] = useState({});
  const [suiviF, noterF] = useCompteurDefi(), [suiviX, noterX] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('famille');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'sds', titre: 'Une tête qui porte une charge', focus: ['scene'],
      texte: <>La tête d’un <strong>tensioactif ionique</strong> porte une charge. Voici le SDS, dont la tête sulfate porte une charge <strong>−</strong>. Le curseur règle le <strong>pH</strong> de la solution (il vaut 7 au départ) : faites-le descendre en dessous de 2 (milieu très acide) et regardez la tête.</>,
      tache: { type: 'qcm', q: 'Pourquoi la charge de la tête du SDS ne dépend-elle pas du pH ?', ...QCM.sds,
        expl: 'Le groupe sulfate dérive d’un acide très fort : même en milieu très acide, il garde sa charge − (il ne se reprotone pas). Sa charge est permanente, de pH 0 à pH 14.', indice: 'Un acide très fort cède son H⁺ pour de bon : sa base conjuguée a-t-elle envie de le reprendre ?' } },
    { id: 'formules', titre: 'Une substance, trois écritures', focus: ['scene'],
      texte: <>Dans les documents, le SDS (dodécylsulfate de sodium) s’écrit de <strong>trois façons</strong>. <strong>R</strong> représente la longue chaîne carbonée, la queue hydrophobe. Les deux premières écritures montrent les charges ; la troisième n’en écrit aucune.</>,
      tache: { type: 'qcm', q: 'Que cache l’écriture R–OSO₃Na ?', ...QCM.formule,
        expl: 'Le sodium, métal très électropositif, ne forme pas de liaison covalente avec l’oxygène : il est présent sous forme d’ion Na⁺. R–OSO₃Na est la formule condensée d’un sel, où les charges ne sont pas écrites. Le tensioactif est ionique (anionique), pas non ionique, et il n’est pas amphotère : le Na⁺ n’est pas un groupe de la tête.', indice: 'Entre un métal comme le sodium et un groupe sulfate, la liaison est ionique : quelles espèces chargées retrouve-t-on ?' } },
    { id: 'sel', titre: 'Dans l’eau, le sel se dissocie', focus: ['scene'],
      texte: <>Le SDS est un <strong>sel</strong> : dissous dans l’eau, il libère <strong>deux ions indépendants</strong>, R–OSO₃⁻ et Na⁺. Un seul d’entre eux porte la longue chaîne carbonée. Le schéma de la tête, plus bas, montre aussi le contre-ion en pointillés.</>,
      tache: { type: 'qcm', q: 'Pour trouver la famille du tensioactif, quel ion regarde-t-on ?', ...QCM.ion,
        expl: 'Le contre-ion Na⁺ n’a pas de chaîne : il n’est pas amphiphile et il ne fait pas partie de la tête. La famille est celle de l’ion qui porte la queue : ici R–OSO₃⁻, de charge −, donc anionique. Avoir un ion + et un ion − dans la formule du sel ne fait pas un amphotère.', indice: 'Un tensioactif est une molécule à queue hydrophobe : lequel des deux ions a une queue ?' } },
    { id: 'ctab', titre: 'Un ionique de charge +', focus: ['scene'],
      texte: <>Voici le <strong>CTAB</strong> (bromure de cétyltriméthylammonium), un tensioactif <strong>cationique</strong> : sa tête ammonium quaternaire porte une charge <strong>+</strong>. Montez le pH jusqu’à 13 (milieu très basique) et regardez la tête.</>,
      tache: { type: 'qcm', q: 'Pourquoi la tête du CTAB garde-t-elle sa charge + même à pH 13 ?', ...QCM.ctab,
        expl: 'L’azote est lié à quatre groupes carbonés : il n’a aucun hydrogène à perdre, donc rien à céder aux ions HO⁻. Sa charge + est permanente, comme celle du sulfate du SDS.', indice: 'Pour perdre sa charge +, la tête devrait céder un H⁺ : en a-t-elle un ?' } },
    { id: 'savon', titre: 'Un ionique qui perd sa charge', focus: ['scene'],
      texte: <>Voici un <strong>savon</strong>, le palmitate de sodium C₁₅H₃₁–COO⁻ Na⁺ : sa tête <strong>carboxylate</strong> est la base de l’acide palmitique C₁₅H₃₁–COOH, un acide faible de pK<sub>a</sub> voisin de <strong>4,8</strong>. Sous la tête, le <strong>diagramme de prédominance</strong> colore chaque zone de pH selon la forme qui domine : la frontière est le pK<sub>a</sub>. Le pH est réglé à 8 ; baissez-le peu à peu jusqu’à 2 en regardant la tête.</>,
      tache: { type: 'qcm', q: 'À pH 2, que devient la tête du palmitate ?', ...QCM.savon,
        expl: 'Au-dessous du pKa (4,8), c’est la forme acide COOH qui domine : le carboxylate a capté un H⁺ et la tête n’est plus chargée. Le palmitate reste un tensioactif anionique (il n’a jamais de charge +), mais sa tête est sans charge en milieu acide.', indice: <>À pH inférieur au pK<sub>a</sub>, c’est la forme acide COOH qui domine : porte-t-elle une charge ?</> } },
    { id: 'ioniques', titre: 'Un ionique : une seule sorte de charge', focus: ['scene'],
      texte: <>Voici le diagramme de prédominance de quatre tensioactifs <strong>ioniques</strong> : le SDS, le CTAB, le palmitate de sodium (pK<sub>a</sub> 4,8) et le chlorure de dodécylammonium C₁₂H₂₅–NH₃⁺ Cl⁻ (pK<sub>a</sub> voisin de 10,6). Chaque zone est colorée selon la charge de la tête : bleu +, rouge −, gris aucune charge. Faites varier le pH et regardez dans quelle zone vous êtes pour chacun.</>,
      tache: { type: 'qcm', q: 'Un tensioactif ionique peut-il porter à la fois une charge + et une charge − ?', ...QCM.ioniques,
        expl: 'Un ionique n’a qu’une sorte de charge possible : − pour un anionique, + pour un cationique. Selon le pH, cette charge peut disparaître (zone grise du palmitate en milieu acide, du dodécylammonium en milieu basique), mais l’autre sorte n’apparaît jamais.', indice: 'Regardez les quatre lignes : une même ligne contient-elle à la fois du bleu et du rouge ?' } },
    { id: 'formules-ex', titre: 'Lire une formule sans charge écrite', focus: ['scene'],
      retenirTitre: 'À retenir : lire une formule', retenir: <>
        <SvgCarteFormule/>
        <ul style={puces}>
          <li>Un tensioactif ionique est un <strong>sel</strong> : dans l’eau, il se dissocie en un <strong>ion à longue queue</strong> et un <strong>contre-ion</strong>.</li>
          <li>On lit la famille sur l’<strong>ion qui porte la chaîne R</strong> : sa charge dit anionique (−) ou cationique (+).</li>
          <li>Moyen de s’en souvenir : <strong>« on lit l’ion à longue queue, on oublie le contre-ion »</strong>.</li>
          <li><strong>Idée fausse :</strong> « un ion + et un ion − dans la formule, donc un amphotère ». <strong>Vrai :</strong> le contre-ion n’appartient pas à la tête ; un amphotère porte les deux charges sur la même molécule.</li>
        </ul></>,
      texte: <>On écrit souvent les sels sans les charges. Voici deux formules condensées, où <strong>R</strong> est une longue chaîne carbonée : R–N(CH₃)₃Br (c’est le CTAB, avec le brome sous forme de bromure) et R–COONa (un savon, par exemple le palmitate de sodium).</>,
      tache: { type: 'qcm', q: 'Quelles sont les familles de R–N(CH₃)₃Br et de R–COONa ?', ...QCM.ecritures,
        expl: 'Dans R–N(CH₃)₃Br, l’azote porte quatre groupes : c’est un ammonium quaternaire R–N⁺(CH₃)₃, avec le bromure Br⁻ comme contre-ion : cationique. Dans R–COONa, l’ion à longue queue est le carboxylate R–COO⁻ (contre-ion Na⁺) : anionique. Aucun n’est amphotère.', indice: 'Dans chaque formule, repérez l’ion qui porte la chaîne R, puis sa charge.' } },
    { id: 'betaine', titre: 'Un amphotère à pH 7', focus: ['scene'],
      retenirTitre: 'À retenir : les ioniques', retenir: <>
        <SvgCarteIoniques/>
        <ul style={puces}>
          <li>Un tensioactif <strong>ionique</strong> n’a <strong>qu’une sorte</strong> de charge : − (anionique) ou + (cationique).</li>
          <li>Sa charge est permanente (sulfate, ammonium quaternaire) ou dépend du pH (carboxylate d’un savon, ammonium primaire).</li>
          <li>Moyen de s’en souvenir : <strong>« une seule couleur à la fois »</strong>.</li>
        </ul></>,
      texte: <>Voici maintenant la <strong>dodécylbétaïne</strong> R–N⁺(CH₃)₂–CH₂–COO⁻, un tensioactif <strong>amphotère</strong>. Sa tête compte deux groupes : un ammonium quaternaire (+), et un groupe carboxyle (pK<sub>a</sub> voisin de 2). À pH 7, regardez ses deux groupes.</>,
      tache: { type: 'qcm', q: 'À pH 7, la tête de la bétaïne est-elle sans aucune charge ?', ...QCM.betaine,
        expl: 'À pH 7, le groupe + (ammonium quaternaire) et le groupe − (carboxylate) sont tous deux chargés : la charge nette est nulle, mais la tête porte deux charges. « Neutre » ne veut pas dire « sans charge ».', indice: 'Comptez les groupes marqués d’un disque + ou − sur la tête.' } },
    { id: 'betaine-courbes', titre: 'La bétaïne selon le pH', focus: ['scene'],
      retenirTitre: 'À retenir : neutre n’est pas sans charge', retenir: <>
        <SvgCarteZwitterion/>
        <ul style={puces}>
          <li>Un amphotère porte <strong>les deux sortes de charges</strong> sur la même tête (zwitterion) : sa charge nette peut être nulle sans que la tête soit sans charge.</li>
          <li>Un non ionique, lui, ne porte <strong>aucune</strong> charge.</li>
          <li>Moyen de s’en souvenir : <strong>« neutre ≠ sans charge »</strong>.</li>
        </ul></>,
      texte: <>Voici le diagramme de prédominance de la dodécylbétaïne. Le groupe ammonium quaternaire est toujours +. Le groupe carboxyle, de pK<sub>a</sub> voisin de <strong>2</strong>, est neutre (COOH) en dessous de 2 et chargé − (COO⁻) au-dessus. Là où les deux charges sont présentes, la zone est violette.</>,
      tache: { type: 'qcm', q: 'Comment évolue la charge nette de la bétaïne de pH 0 à pH 14 ?', ...QCM.betaineAcide,
        expl: 'La charge + est permanente. En milieu très acide (pH < 2), le carboxyle est neutre : charge nette +. Au-dessus de pH 2, il est −, la charge nette est nulle, et le reste jusqu’à pH 14. La bétaïne n’est jamais globalement négative.', indice: <>Le groupe + est toujours là ; le groupe − apparaît quand le pH dépasse le pK<sub>a</sub> du carboxylate.</> } },
    { id: 'alanine', titre: 'Un amphotère dont le signe change', focus: ['scene'],
      texte: <>Voici la <strong>N-dodécyl-β-alanine</strong> R–NH₂⁺–CH₂CH₂–COO⁻, un autre amphotère. Son groupe ammonium (pK<sub>a</sub> voisin de <strong>10,2</strong>) est + tant que le pH est plus faible. Son groupe carboxyle (pK<sub>a</sub> voisin de <strong>3,6</strong>) est − quand le pH est plus grand. Parcourez le pH de 0 à 14 et suivez la tête et le diagramme.</>,
      tache: { type: 'qcm', q: 'Comment varie la charge nette de cet amphotère quand le pH augmente ?', ...QCM.alanine,
        expl: 'À pH inférieur à 3,6, seul l’ammonium est chargé (+). Entre 3,6 et 10,2, les deux groupes sont chargés (charge nette nulle). Au-dessus de 10,2, l’ammonium perd son H⁺ : il ne reste que le carboxylate (−). Le signe de la charge nette change avec le pH.', indice: 'Pour chaque zone de pH, dites si le groupe amine puis le groupe carboxyle sont chargés.' } },
    { id: 'distinguer', titre: 'Reconnaître un amphotère', focus: ['scene'],
      texte: <>Trois tensioactifs inconnus, A, B et C, sont décrits par leur diagramme de prédominance (bleu : charge +, rouge : charge −, violet : les deux). Les noms sont cachés : il faut raisonner sur les couleurs.</>,
      tache: { type: 'qcm', q: 'Lequel de ces trois diagrammes est celui d’un amphotère ?', ...QCM.distinguer,
        expl: 'Un amphotère est la seule famille qui présente une zone violette, où les deux sortes de charges sont présentes. A est un savon, le palmitate de sodium (anionique : zones grise et rouge seulement) et C le dodécylammonium (cationique : zones bleue et grise seulement).', indice: 'Cherchez la ligne qui contient une zone violette : les deux sortes de charges y sont présentes pour un même pH.' } },
    { id: 'nonionique', titre: 'Des tensioactifs sans charge', focus: ['scene'],
      retenirTitre: 'À retenir : les amphotères', retenir: <>
        <SvgCarteAmphotere/>
        <ul style={puces}>
          <li>Un <strong>amphotère</strong> peut porter les deux sortes de charges ; son signe net change avec le pH (+ en milieu acide, − en milieu basique pour la N-dodécyl-β-alanine).</li>
          <li>La <strong>bétaïne</strong> ne devient jamais globalement négative.</li>
          <li>Moyen de s’en souvenir : <strong>« amphotère = deux sortes de charges possibles »</strong>.</li>
        </ul></>,
      texte: <>Les tensioactifs <strong>non ioniques</strong> n’ont aucun groupe qui se charge : le dodécanol éthoxylé (chaîne de motifs O–CH₂–CH₂ terminée par OH) ou le monolaurate de sorbitane (plusieurs groupes OH). Leur charge est nulle à tout pH.</>,
      tache: { type: 'qcm', q: 'Comment une tête sans charge peut-elle être soluble dans l’eau ?', ...QCM.nonionique,
        expl: 'Les atomes d’oxygène et les groupes OH de la tête forment des liaisons hydrogène avec l’eau. La solubilité vient de ces liaisons, pas d’une charge, et ne dépend pas du pH.', indice: 'Quels atomes de la tête peuvent former des liaisons hydrogène avec H₂O ?' } },
    { id: 'melange', titre: 'Mélanger deux familles', focus: ['scene'],
      retenirTitre: 'À retenir : un non ionique n’a pas de charge', retenir: <>
        <SvgCarteNonionique/>
        <ul style={puces}>
          <li>La tête d’un <strong>non ionique</strong> est sans charge, mais forme des <strong>liaisons hydrogène</strong> avec l’eau.</li>
          <li>Sa solubilité ne dépend donc pas du pH.</li>
          <li>Moyen de s’en souvenir : <strong>« pas de charge, mais des liaisons H »</strong>.</li>
        </ul></>,
      texte: <>On peut associer plusieurs tensioactifs dans une formule. Mais deux têtes de <strong>charges opposées</strong> s’attirent. Voici un anionique (SDS, −) et un cationique (CTAB, +) mis en présence.</>,
      tache: { type: 'qcm', q: 'Quel mélange de deux tensioactifs faut-il éviter ?', ...QCM.melange,
        expl: 'Un anionique et un cationique s’attirent et forment un sel peu soluble : la solution se trouble ou précipite, et les deux tensioactifs perdent leur efficacité. Un non ionique ou un amphotère se mélange sans problème avec l’un ou l’autre.', indice: 'Quelles têtes s’attirent : celles de même charge ou de charges opposées ?' } },
    { id: 'emulsion', titre: 'Pourquoi la charge compte', focus: ['scene'],
      texte: <>Dans une émulsion huile dans l’eau, les têtes chargées entourent les gouttes qui <strong>se repoussent</strong> : cela évite qu’elles se rejoignent (coalescence). Voici une émulsion stabilisée par le palmitate de sodium, à pH 9. Baissez le pH jusqu’à 3 et regardez les gouttes.</>,
      tache: { type: 'qcm', q: 'On veut garder une émulsion stable à pH 3. Que faire ?', ...QCM.emulsion,
        expl: 'À pH 3, très en dessous du pKa (4,8), les têtes carboxylate du palmitate sont devenues neutres (COOH) : plus de charge, plus de répulsion, les gouttes se rejoignent. Il faut un tensioactif dont la tête reste active à pH 3 : un non ionique, un sulfate comme le SDS, ou un amphotère adapté.', indice: 'Le palmitate perd sa charge en milieu acide : lequel des autres tensioactifs vus garde son action à pH 3 ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : quelle famille ?', retenir: <>
        <SvgCarteTest/>
        <ul style={puces}>
          <li>Pour trouver la famille, on compte <strong>les sortes de charges</strong> que la tête peut porter entre pH 0 et 14 : aucune, une seule, ou les deux.</li>
          <li>Un tensioactif chargé stabilise une émulsion par <strong>répulsion des gouttes</strong> ; sa charge, et donc son efficacité, peut dépendre du pH.</li>
          <li><strong>Idée fausse :</strong> « un amphotère est un ionique qui peut être + ou − selon le pH ». <strong>Vrai :</strong> un ionique n’a qu’une sorte de charge ; un amphotère porte les deux.</li>
        </ul></>,
      texte: <>Vous savez distinguer un tensioactif <strong>ionique</strong> (une sorte de charge, parfois nulle selon le pH), <strong>amphotère</strong> (les deux sortes de charges possibles) et <strong>non ionique</strong> (aucune charge, solubles par liaisons hydrogène), et expliquer pourquoi la charge de la tête compte pour stabiliser une émulsion. En exploration, vous pouvez comparer huit tensioactifs ; les défis proposent aussi deux calculs de prolongement.</>},
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  // à chaque changement d'étape, le pH repart de la valeur prévue pour l'étape (le parcours reste autonome)
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1) && PH_DEPART[IDS[ni]] != null) setPH(PH_DEPART[IDS[ni]]);
    setGuide(nv);
  };
  const curseurVisible = enExplore || (enGuide && idE !== 'bilan');

  // ---------- scènes du parcours ----------
  const bloc = (...c) => <div className="ct-col">{c}</div>;
  const sceneGuide = {
    sds: () => <SvgTete id="sds" pH={pH}/>, formules: () => <SvgFormules/>, sel: () => bloc(<SvgDissolution key="d"/>, <SvgTete key="t" id="sds" pH={pH} contre/>), 'formules-ex': () => <SvgFormulesEx/>,
    ctab: () => <SvgTete id="ctab" pH={pH}/>, savon: () => bloc(<SvgTete key="t" id="savon" pH={pH}/>, <SvgPredominance key="p" pH={pH} lignes={[{ id: 'savon' }]}/>),
    ioniques: () => <SvgPredominance pH={pH} lignes={[{ id: 'sds', etiquette: 'SDS' }, { id: 'ctab', etiquette: 'CTAB' }, { id: 'savon', etiquette: 'palmitate de sodium' }, { id: 'amine', etiquette: 'dodécylammonium' }]}/>,
    betaine: () => <SvgTete id="betaine" pH={pH}/>,
    'betaine-courbes': () => bloc(<SvgTete key="t" id="betaine" pH={pH}/>, <SvgPredominance key="p" pH={pH} lignes={[{ id: 'betaine' }]}/>),
    alanine: () => bloc(<SvgTete key="t" id="alanine" pH={pH}/>, <SvgPredominance key="p" pH={pH} lignes={[{ id: 'alanine' }]}/>),
    distinguer: () => <SvgPredominance pH={pH} notes={false} lignes={[{ id: 'savon', etiquette: 'A' }, { id: 'alanine', etiquette: 'B' }, { id: 'amine', etiquette: 'C' }]}/>,
    nonionique: () => bloc(<SvgTete key="a" id="age" pH={pH}/>, <SvgTete key="b" id="sorbitane" pH={pH}/>),
    melange: () => <SvgAttraction/>,
    emulsion: () => <SvgGouttes id="savon" pH={pH}/>,
  }[idE]?.() ?? null;

  const ligneCharges = id => { const c = M.charges(M.espece(id), pH); return [['pH', fr(pH, 1)], ['Charges + par molécule', fr(c.nPlus, 2), COL.bleu], ['Charges − par molécule', fr(c.nMoins, 2), COL.rouge], ['Charge nette', signee(c.nette)]]; };
  const MES = {
    'betaine-courbes': () => ligneCharges('betaine'), alanine: () => ligneCharges('alanine'),
    emulsion: () => { const g = M.etatGouttes(M.espece('savon'), pH); return [['pH', fr(pH, 1)], ['Charge nette par tête', signee(g.q)], ['Répulsion entre gouttes', g.repulsion]]; },
  };
  const lignesGuide = enGuide ? (MES[idE]?.() ?? []) : [];

  // ---------- défis ----------
  const nouveauDefi = type => {
    if (type === 'famille') setDefi({ type, ...M.tirageFamille(), rep: '', verifie: false });
    else if (type === 'formule') setDefi({ type, ...M.tirageFormule(), rep: '', verifie: false });
    else if (type === 'fraction') setDefi({ type, ...M.tirageFraction(), rep: '', verifie: false });
    else setDefi({ type, ...M.tirageIso(), rep: '', verifie: false });
  };
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const proche = (rep, vrai, tol = 0.05) => { const x = lireNombre(rep); return isFinite(x) && Math.abs(x - vrai) <= tol * Math.abs(vrai); };
  const verifier = () => {
    let ok;
    if (defi.type === 'famille') { ok = defi.rep === defi.famille; noterF(ok); }
    else if (defi.type === 'formule') { ok = defi.rep === defi.famille; noterE(ok); }
    else if (defi.type === 'fraction') { ok = proche(defi.rep, defi.pct); noterX(ok); }
    else { ok = proche(defi.rep, defi.vrai); noterI(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
  const champ = aria => (
    <input value={defi.rep} aria-label={aria} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('ct-verif')?.click()}
      onChange={ev => setDefi(d => ({ ...d, rep: ev.target.value, verifie: false }))}
      style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/>);
  const FA = <Formule><mi>α</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><msup><mn>10</mn><mrow><msub><mi>pK</mi><mi mathvariant="normal">a</mi></msub><mo>−</mo><mi>pH</mi></mrow></msup></mrow></mfrac></Formule>;
  const FI = <Formule><msub><mi>pH</mi><mi mathvariant="normal">iso</mi></msub><mo>=</mo><mfrac><mrow><msub><mi>pK</mi><mi mathvariant="normal">a1</mi></msub><mo>+</mo><msub><mi>pK</mi><mi mathvariant="normal">a2</mi></msub></mrow><mn>2</mn></mfrac></Formule>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['famille', 'Reconnaître la famille'], ['formule', 'Famille d’après la formule'], ['fraction', 'Fraction ionisée (prolongement)'], ['iso', 'Point isoélectrique (prolongement)']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.type === 'famille' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle famille de tensioactif ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, marginBottom: 6 }}>Voici le diagramme de prédominance d’un tensioactif inconnu, de pH 0 à pH 14 : <strong style={{ color: COL.bleu }}>bleu</strong> = charge +, <strong style={{ color: COL.rouge }}>rouge</strong> = charge −, <strong style={{ color: COL.violet }}>violet</strong> = les deux, gris = aucune charge. À quelle famille appartient-il ?</div>
        <SvgPredominance lignes={[{ e: defi.e }]} notes={false}/>
        <label htmlFor="ct-fam" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '8px 0 3px' }}>Famille</label>
        <select id="ct-fam" value={defi.rep} onChange={ev => setDefi(d => ({ ...d, rep: ev.target.value, verifie: false }))} style={{ ...selectStyle, maxWidth: 260, border: `1.5px solid ${defi.verifie ? (defi.rep === defi.famille ? '#15803d' : '#dc2626') : KIT.bord}` }}>
          <option value="">Choisir…</option>{FAMILLES.map(f => <option key={f} value={f}>{f}</option>)}</select>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Comptez les sortes de charges qui apparaissent entre pH 0 et pH 14 : aucune (que du gris : non ionique), une seule (ionique : du bleu = cationique, du rouge = anionique) ou les deux (une zone violette, ou du bleu et du rouge : amphotère).</IndiceDefi></div>
      </>}
      {defi.type === 'formule' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle famille, d’après la formule ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Un tensioactif a pour formule, à l’état non dissous (<strong>R</strong> : longue chaîne carbonée) :</div>
        <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: KIT.txt, margin: '8px 0 10px', padding: '10px 8px', border: `2px solid ${KIT.bord}`, borderRadius: 12 }}>{defi.ecriture}</div>
        <label htmlFor="ct-fam2" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' }}>Famille</label>
        <select id="ct-fam2" value={defi.rep} onChange={ev => setDefi(d => ({ ...d, rep: ev.target.value, verifie: false }))} style={{ ...selectStyle, maxWidth: 260, border: `1.5px solid ${defi.verifie ? (defi.rep === defi.famille ? '#15803d' : '#dc2626') : KIT.bord}` }}>
          <option value="">Choisir…</option>{FAMILLES.map(f => <option key={f} value={f}>{f}</option>)}</select>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Cherchez l’ion qui porte la chaîne R, et sa charge (même si elle n’est pas écrite). Le contre-ion ne compte pas. Un groupe + et un groupe − sur la même molécule : amphotère. Aucun groupe chargé : non ionique.</IndiceDefi></div>
      </>}
      {defi.type === 'fraction' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : fraction ionisée d’un acide gras</div>
        <div style={{ fontSize: 13.5, color: COL.orange, fontWeight: 700, marginBottom: 4 }}>Prolongement du programme (hors référentiel)</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>La tête carboxyle R–COOH d’un acide gras a un pK<sub>a</sub> de <strong>{fr(defi.pKa, 1)}</strong>. La solution est à pH <strong>{fr(defi.pH, 1)}</strong>. Quel pourcentage des têtes est sous forme chargée COO⁻ ? Donnez le résultat en %, avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}><span>Têtes chargées :</span>{champ('Pourcentage de têtes chargées')}<span>%</span></div>
        <IndiceDefi cache={false}>La fraction ionisée vaut <FormuleEnLigne><mi>α</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><msup><mn>10</mn><mrow><msub><mi>pK</mi><mi mathvariant="normal">a</mi></msub><mo>−</mo><mi>pH</mi></mrow></msup></mrow></mfrac></FormuleEnLigne>. Ici pK<sub>a</sub> − pH = {fr(defi.pKa - defi.pH, 1)}. Multipliez le résultat par 100 pour l’avoir en %.</IndiceDefi>
      </>}
      {defi.type === 'iso' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : point isoélectrique d’un amphotère</div>
        <div style={{ fontSize: 13.5, color: COL.orange, fontWeight: 700, marginBottom: 4 }}>Prolongement du programme (hors référentiel)</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Un amphotère a un groupe carboxyle de pK<sub>a</sub> égal à <strong>{fr(defi.pKaAcide, 1)}</strong> et un groupe amine de pK<sub>a</sub> égal à <strong>{fr(defi.pKaBase, 1)}</strong>. À quel pH sa charge nette est-elle nulle, avec une répartition la plus symétrique des deux charges (point isoélectrique) ? Donnez le pH avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}><span>pH<sub>iso</sub> :</span>{champ('pH du point isoélectrique')}</div>
        <IndiceDefi cache={false}>Le point isoélectrique est au milieu des deux pK<sub>a</sub> : on fait la moyenne des deux valeurs données.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="ct-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.type === 'famille' && `Réponse : ${defi.famille}. ${expliqueFamille(defi.e)}`}
        {defi.type === 'formule' && `Réponse : ${defi.famille}. ${corrigeFormule(defi)}`}
        {defi.type === 'fraction' && <>pK<sub>a</sub> − pH = {fr(defi.pKa - defi.pH, 1)}, donc <FormuleEnLigne><msup><mn>10</mn><mrow><mo>{fr(defi.pKa - defi.pH, 1)}</mo></mrow></msup></FormuleEnLigne> = {sig2(10 ** (defi.pKa - defi.pH))} ; <FormuleEnLigne><mi>α</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><mn>{sig2(10 ** (defi.pKa - defi.pH))}</mn></mrow></mfrac></FormuleEnLigne> = {fr(defi.vrai, 3)}, soit {sig2(defi.pct)} %.</>}
        {defi.type === 'iso' && <><FormuleEnLigne><mfrac><mrow><mn>{fr(defi.pKaAcide, 1)}</mn><mo>+</mo><mn>{fr(defi.pKaBase, 1)}</mn></mrow><mn>2</mn></mfrac></FormuleEnLigne> = {fr(defi.vrai, 2)}, soit pH ≈ {sig2(defi.vrai)}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Diagramme de prédominance</strong> : une zone est colorée selon la forme qui domine dans la tête (frontière = pK<sub>a</sub>) ; bleu = charge +, rouge = charge −, violet = les deux sortes de charges sur la même tête, gris = aucune charge. <strong>Charges moyennes par molécule</strong> : chaque groupe acide ou basique est traité séparément, dans une solution diluée, par la loi d’équilibre acide-base (fraction ionisée <FormuleEnLigne><mi>α</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><msup><mn>10</mn><mrow><msub><mi>pK</mi><mi mathvariant="normal">a</mi></msub><mo>−</mo><mi>pH</mi></mrow></msup></mrow></mfrac></FormuleEnLigne>). Les nombres de charges affichés dans les mesures sont donc des moyennes, comprises entre 0 et 1 par groupe.</li>
      <li><strong>Les pK<sub>a</sub> sont des ordres de grandeur arrondis</strong> : acide palmitique (savon palmitate) ≈ 4,8, valeur d’un acide gras en solution diluée ; ion dodécylammonium ≈ 10,6 (valeur à vérifier, ordre de grandeur des alkylamines primaires) ; carboxyle de la bétaïne ≈ 2 ; N-dodécyl-β-alanine ≈ 3,6 et ≈ 10,2 (valeurs de la β-alanine). Les valeurs réelles varient avec le produit. <strong>Nuance importante</strong> : quand les acides gras sont rassemblés en micelles ou en vésicules, les têtes se gênent mutuellement et le pK<sub>a</sub> apparent monte, jusqu’à 6 à 9 selon les études et la longueur de la chaîne. Cet effet n’est pas modélisé ici : les diagrammes montrent le cas d’un acide gras isolé en solution diluée.</li>
      <li><strong>Charges permanentes</strong> : le sulfate (SDS) et l’ammonium quaternaire (CTAB) gardent leur charge de pH 0 à 14 (pas de proton échangeable). Les contre-ions (Na⁺, Br⁻) ne sont pas représentés.</li>
      <li><strong>Écritures des formules</strong> : R désigne une longue chaîne carbonée. Un tensioactif ionique est un sel : à l’état dissous, il est séparé en un ion à longue queue et un contre-ion (Na⁺, Br⁻, Cl⁻) qui n’a pas de rôle dans la famille. Les trois écritures (ion seul, ion avec contre-ion, formule condensée) désignent la même substance ; les contre-ions sont dessinés en pointillés sur la tête et absents des scènes de gouttes. Les amphotères et les non ioniques n’ont pas de contre-ion nécessaire.</li>
      <li><strong>Seuil de lecture</strong> : une tête est dite « chargée » si sa charge moyenne dépasse 0,15 en valeur absolue ; la famille est déduite sur toute l’échelle de pH 0 à 14.</li>
      <li><strong>Scène des gouttes</strong> : douze têtes par goutte ; on ne représente que la <strong>répulsion électrostatique</strong>. Pas de sel ajouté, pas de force ionique, pas de répulsion stérique. Les non ioniques stabilisent autrement (têtes hydratées) et sont hors de cette scène.</li>
      <li><strong>Pas de dégradation chimique</strong> : en milieu très acide ou très basique, certains tensioactifs (esters de sorbitane, par exemple) s’hydrolysent ; la simulation ne le modélise pas.</li>
      <li><strong>Prolongements hors référentiel</strong> : la fraction ionisée chiffrée et le point isoélectrique (moyenne des deux pK<sub>a</sub>, pour un amphotère à un groupe acide et un groupe basique) ne sont pas exigibles en BTS.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);

  // ---------- exploration ----------
  const e = M.espece(sp), c = M.charges(e, pH), fam = M.familleDeduite(e), plage = M.plageDeuxCharges(e), iso = M.pointIsoelectrique(e);
  const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
  const curseur = (
    <div style={{ marginBottom: 8 }}>
      <label htmlFor="ct-ph" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>pH de la solution</span><span style={{ color: KIT.txt }}>{fr(pH, 1)}</span></label>
      <input id="ct-ph" type="range" min="0" max="14" step="0.1" value={pH} onChange={ev => setPH(parseFloat(ev.target.value))} aria-label="pH de la solution" style={{ width: '100%', accentColor: '#7c3aed' }}/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>De 0 (très acide) à 14 (très basique).</div>
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {curseur}
      <Section titre={`Tensioactif : ${e.court}`} ouvert={!!ouv.tens} onBascule={() => bascule('tens')}>
        <label htmlFor="ct-sp" style={libelle}>Tensioactif étudié</label>
        <select id="ct-sp" value={sp} onChange={ev => setSp(ev.target.value)} style={{ ...selectStyle, marginBottom: 4 }}>
          {M.ESPECES.map(x => <option key={x.id} value={x.id}>{x.court} ({x.famille})</option>)}
        </select>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Huit tensioactifs : choisissez-en un, puis faites varier le pH.</div>
      </Section>
    </div>);
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>La tête du tensioactif à ce pH</div>}
      {enGuide ? sceneGuide : <SvgTete id={sp} pH={pH} contre/>}
    </div>);
  const mesures = (enExplore || (enGuide && lignesGuide.length > 0)) && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Mesures' : 'Données'}</div>
      {enGuide ? lignesGuide.map(([n, v, col]) => <LigneMesure key={n} nom={n} valeur={v} couleur={col}/>) : <>
        <LigneMesure nom="pH" valeur={fr(pH, 1)}/>
        <LigneMesure nom="Charges + par molécule" valeur={fr(c.nPlus, 2)} couleur={COL.bleu}/>
        <LigneMesure nom="Charges − par molécule" valeur={fr(c.nMoins, 2)} couleur={COL.rouge}/>
        <LigneMesure nom="Charge nette" valeur={signee(c.nette)}/>
        <LigneMesure nom="Famille (d’après les zones colorées)" valeur={fam} couleur={COUL_FAM[fam]}/>
        {plage && <LigneMesure nom="Deux charges à la fois pour pH" valeur={`${fr(plage[0], 1)} à ${fr(plage[1], 1)}`} couleur={COL.violet}/>}
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>La charge nette est la différence entre le nombre de charges + et le nombre de charges −. La famille se lit sur les couleurs du diagramme, pas sur la charge nette.</div>
      </>}
    </div>);
  const diagramme = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Diagramme de prédominance selon le pH</div>
      <SvgPredominance lignes={[{ id: sp }]} pH={pH}/>
    </div>);
  const gouttes = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Deux gouttes d’huile dans l’eau</div>
      {e.famille === 'non ionique'
        ? <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>Un tensioactif non ionique ne porte aucune charge : il ne crée pas de répulsion électrostatique. Il stabilise les gouttes autrement (têtes hydratées qui s’opposent au rapprochement), et son efficacité ne dépend pas du pH. Cette scène ne s’applique donc pas.</div>
        : <SvgGouttes id={sp} pH={pH}/>}
    </div>);
  const formule = enExplore && (
    <Section titre={`Formule de ${e.court} : écritures`} ouvert={!!ouv.form} onBascule={() => bascule('form')}>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        {e.ecritures.map((f, k) => <div key={f} style={{ fontWeight: 700, fontSize: 16 }}>{f}{e.contre ? <span style={{ fontWeight: 400, fontSize: 13, color: KIT.txt2 }}>{['  (ion seul)', '  (avec son contre-ion)', '  (formule condensée du sel)'][k]}</span> : null}</div>)}
        <div style={{ marginTop: 6 }}>{e.contre
          ? <>R est la longue chaîne carbonée. Dans l’eau, le sel se dissocie : l’ion à longue queue (celui dont on lit la famille) et le contre-ion {e.contre}, sans queue, qu’on ignore.</>
          : e.famille === 'non ionique' ? <>Aucun ion dans la formule : la tête n’est jamais chargée.</>
          : <>Les deux charges sont sur la même molécule : aucun contre-ion n’est à ignorer. C’est ce qui distingue un amphotère d’un sel ionique.</>}</div>
      </div>
    </Section>);
  const prolongement = enExplore && (
    <Section titre="Prolongement : fraction ionisée (hors référentiel)" ouvert={!!ouv.prol} onBascule={() => bascule('prol')}>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <div>Un groupe acide de pK<sub>a</sub> donné est sous forme chargée COO⁻ pour la fraction :</div>
        {FA}
        {M.pKaDe(e, 'acide') != null
          ? <div>Pour {e.court} à pH {fr(pH, 1)} : pK<sub>a</sub> = {fr(M.pKaDe(e, 'acide'), 1)}, soit <FormuleEnLigne><mi>α</mi></FormuleEnLigne> = {fr(M.fracIonisee(M.pKaDe(e, 'acide'), pH), 2)}.</div>
          : <div>Ce tensioactif n’a pas de groupe acide ionisable : il n’y a rien à calculer ici.</div>}
        {iso != null && <><div style={{ marginTop: 6 }}>Pour un amphotère à un groupe acide et un groupe basique, la charge nette s’annule au point isoélectrique :</div>{FI}<div>Ici : pH<sub>iso</sub> = ({fr(M.pKaDe(e, 'acide'), 1)} + {fr(M.pKaDe(e, 'base'), 1)}) / 2 = {fr(iso, 1)}.</div></>}
      </div>
    </Section>);
  const aEssayer = (
    <ul style={liste}>
      <li>Choisissez le SDS puis le CTAB : leur diagramme change-t-il de couleur quand le pH passe de 0 à 14 ?</li>
      <li>Choisissez le palmitate de sodium, puis le dodécylammonium : à quel pH la charge de la tête vaut-elle la moitié de son maximum (charge ≈ 0,5 dans les mesures) ? Comparez à la frontière du diagramme.</li>
      <li>Choisissez la dodécylbétaïne puis la N-dodécyl-β-alanine : pour quel pH la charge nette est-elle nulle ? La tête est-elle alors sans charge ?</li>
      <li>Choisissez un non ionique : y a-t-il un pH pour lequel la tête se charge ?</li>
      <li>Avec le palmitate de sodium, baissez le pH jusqu’à 3 : que devient la répulsion entre les gouttes ? Et à pH 5, tout près du pKa ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Ionique : une seule sorte de charge ; amphotère : les deux sortes ; non ionique : aucune</li>
        <li>Sulfate et ammonium quaternaire : charge permanente ; carboxylate d’un savon et ammonium primaire : charge qui dépend du pH</li>
        <li>Neutre ne veut pas dire sans charge : un amphotère peut avoir une charge nette nulle avec deux charges</li>
        <li>Un anionique et un cationique en mélange s’attirent et précipitent</li>
        <li>Une formule de sel (R–OSO₃Na, R–N(CH₃)₃Br) se lit sur l’ion à longue queue ; le contre-ion est ignoré</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ct-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ct-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ct-col { display: flex; flex-direction: column; gap: 12px; }
        .ct-grille { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
        @media (min-width: 560px) { .ct-grille { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .ct-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .ct-l1.cote .ct-carte { order: 2; } .ct-l1.cote .ct-main { order: 1; }
          .ct-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .ct-ex > * { grid-column: 1; }
          .ct-ex > .ct-reg { grid-column: 2; grid-row: 1 / span 5; }
        }
        @media (max-width: 900px) { .ct-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ct-in { animation: ct-fondu 0.35s ease-out; } @keyframes ct-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Charge d’un tensioactif selon le pH</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La tête d’un tensioactif peut porter une charge, qui dépend ou non du <strong>pH</strong>. On distingue ainsi les tensioactifs <strong>ioniques</strong>, <strong>amphotères</strong> et <strong>non ioniques</strong>, et l’on voit pourquoi cette charge compte pour stabiliser une émulsion.</div>
      {enGuide && <div className="ct-l1 cote">
        <div className="ct-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="ct-main">
          <div className="ct-col">
            {sceneGuide && <div className="ct-in">{scene}</div>}
            {curseurVisible && <div className="ct-in" style={{ ...styleBoite, ...cadre('scene') }}>{curseur}</div>}
            {mesures && <div className="ct-in">{mesures}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'famille' ? suiviF : defi.type === 'formule' ? suiviE : defi.type === 'fraction' ? suiviX : suiviI}/></div>}
      {enExplore && <>
        <div className="ct-ex">
          {scene}
          <div className="ct-reg">{reglages}</div>
          {diagramme}
          {mesures}
          {gouttes}
        </div>
        {formule}
        {prolongement}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
