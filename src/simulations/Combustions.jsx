import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { EN_RECOLTE, EN_CONSULT } from "../fiches";
import * as C from "./combustionModele";
import { QCM } from "./combustionQcm";
import { SvgCombustion, SvgEquilibrer, SvgRompreFormer, SvgSigne, SvgPouvoir } from "./combustionSchemas";
import { SceneCorps, SceneBecs, SceneChaudiere, SceneDeuxAtomes, RangeeEspeces, RangeeEquation, MoleculeSeule, TableauAtomes,
  EquationTete, DonneesLiaisons, Niveaux, BarresPouvoir } from "./combustionScenes";
import { nbm } from "./combustionDessin";

const SIM_ID = 159, CLE_GUIDE = 'combustions-1g-guide-v1';
declarerDefis(SIM_ID, [['energie', 'Quelle est l’énergie molaire de réaction estimée ?'], ['pouvoir', 'Quel est le pouvoir calorifique estimé ?']]);

// ====================================================
//  SIM 159 — COMBUSTIONS (1G spé PC, thème « Constitution et transformations de la matière », partie 3.C « Combustions »).
//  Prérequis : simulation 152 (n = m/M), simulation 154 (schémas de Lewis : liaisons covalentes).
//  Une seule idée : estimer l'énergie libérée par une combustion à partir des énergies de liaison (rompre coûte, former rapporte).
//  Parcours (13 étapes) : combustibles (1), combustion complète ou incomplète (1), équations de méthane, propane, éthanol (3),
//  rompre / former (1), liaisons rompues et formées du méthane (2), E_r (1), signe et comparaison à la référence (1), éthanol (1),
//  pouvoir calorifique (1), risques (1). Modèle : combustionModele.js (testé). Aucune ressource de Nils : partie du programme seule.
//  Capacités visées (jamais affichées à l'élève) : citer des exemples de combustibles usuels ; écrire l'équation de réaction de combustion
//  complète d'un alcane et d'un alcool ; estimer l'énergie molaire de réaction à partir des énergies de liaison (phase gazeuse) ;
//  citer des applications usuelles des combustions et les risques associés ; (expérimental) estimer un pouvoir calorifique.
//  Hors programme, non traité : enthalpie ΔrH, enthalpie de formation, combustion incomplète chiffrée.
// ====================================================

const NB = ' ';
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const CH4 = C.combustible('ch4'), ETH = C.combustible('c2h5oh');

// ---------- formules (MathML) ----------
const Er = <msub><mi>E</mi><mi>r</mi></msub>;
const FEr = <Formule>{Er}<mo>=</mo><mo>Σ</mo><mi>D</mi><mo>(</mo><mtext>rompues</mtext><mo>)</mo><mo>−</mo><mo>Σ</mo><mi>D</mi><mo>(</mo><mtext>formées</mtext><mo>)</mo></Formule>;
const FPC = <Formule><mi>PC</mi><mo>=</mo><mfrac><mrow><mo>|</mo>{Er}<mo>|</mo></mrow><mi>M</mi></mfrac></Formule>;

const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c} />;

// Carte « À retenir » repliée par défaut sur téléphone (elle repousserait la question) : un bouton la déplie. Toujours dépliée sur ordinateur,
// dans la récolte des fiches (« Mes fiches ») et dans les contrôles automatiques.
function Repli({ children }) {
  const grand = typeof window !== 'undefined' && (window.innerWidth >= 900 || !!window.__PARCOURS_TEST__);
  const [ouvert, setOuvert] = useState(() => EN_RECOLTE || EN_CONSULT || grand);
  if (ouvert) return <>{children}{!(EN_RECOLTE || EN_CONSULT || grand) && <button type="button" onClick={() => setOuvert(false)} style={{ ...stylePetitBouton(false, '#475569'), marginTop: 6 }}>Replier la fiche</button>}</>;
  return <button type="button" onClick={() => setOuvert(true)} style={{ ...styleBouton(false, '#0b4f94'), width: '100%', textAlign: 'left' }}>Voir le schéma et le résumé</button>;
}

// ====================================================
export function SimulationCombustions() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviE, noterE] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('energie');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  // exploration
  const [ex, setEx] = useState({ c: 'ch4', o2: 'suffisant', ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['combustibles', 'incomplete', 'eqMethane', 'eqPropane', 'eqEthanol', 'rompreFormer', 'rompues', 'formees', 'er', 'signe', 'ethRompues', 'ethFormees', 'pouvoir', 'risques'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);   // étape passée ou réussie à l'instant

  const ETAPES = [
    { id: 'combustibles', titre: 'Qu’est-ce qui brûle ?', focus: ['scene'],
      texte: <>Un feu de bois, un réchaud à gaz, un moteur de voiture : ce sont des <strong>combustions</strong>. Une combustion est une réaction chimique entre un <strong>combustible</strong> (le corps qui brûle) et un <strong>comburant</strong>, le plus souvent le dioxygène O₂ de l’air. Elle libère de l’énergie, sous forme de chaleur et de lumière. On s’en sert pour se chauffer, cuisiner, rouler ou produire de l’électricité.</>,
      tache: { type: 'qcm', ...QCM.combustibles } },
    { id: 'incomplete', titre: 'Deux flammes, deux aspects', focus: ['scene'],
      texte: <>Deux becs de laboratoire brûlent le même gaz. Quand une combustion est <strong>complète</strong>, les seuls produits sont le dioxyde de carbone CO₂ et l’eau H₂O. Observez la flamme et la capsule placée au-dessus de chaque bec.</>,
      tache: { type: 'qcm', ...QCM.incomplete } },
    { id: 'eqMethane', titre: 'Compléter l’équation du méthane', focus: ['scene'],
      texte: <>Le méthane CH₄ est le principal constituant du gaz naturel. Sa combustion complète forme du dioxyde de carbone et de l’eau. Dans une équation de réaction, chaque élément est conservé : il y a autant d’atomes de chaque sorte à gauche et à droite. Dans toute la simulation, <strong>tous les corps sont pris à l’état gazeux</strong>, eau comprise. Une molécule de dioxygène O₂ contient 2 atomes d’oxygène.</>,
      tache: { type: 'num', q: 'Combien de molécules de dioxygène O₂ réagissent avec une molécule de méthane ?', carnet: false, unite: 'molécules O₂', vrai: 2, tol: 0.01, affiche: v => nbf(v, 0),
        calcul: () => ['À droite : 1 atome C (dans CO₂), 4 atomes H (dans 2 H₂O) et 2 + 2 = 4 atomes O (2 dans CO₂, 2 dans les 2 H₂O).', 'Chaque molécule O₂ apporte 2 atomes O : 4 ÷ 2 = 2 molécules. Équation : CH₄ + 2 O₂ → CO₂ + 2 H₂O, avec 4 atomes O de chaque côté.'],
        pieges: [[4, 'Il y a 4 atomes O à droite, mais chaque molécule O₂ en contient 2 : il faut en diviser le nombre par 2.'], [1, 'Une seule molécule O₂ n’apporte que 2 atomes O, alors qu’il y en a 4 à droite.'], [3, 'Trois molécules O₂ donneraient 6 atomes O à gauche, pour 4 seulement à droite.']],
        expl: 'Il faut 4 atomes O à gauche, comme à droite : 4 ÷ 2 = 2 molécules O₂.', indice: 'Comptez les atomes O à droite (dans CO₂ et dans H₂O), puis rappelez-vous que chaque molécule O₂ en apporte 2.' },
      retenirTitre: 'À RETENIR : LA COMBUSTION',
      retenir: <><Repli>
        <SvgCombustion />
        <ul style={liste}>
          <li><strong>Combustible + comburant (O₂) → énergie libérée.</strong> Complète : CO₂ + H₂O. <em>Pour aller plus loin</em> (combustion incomplète) : C (suie), CO et H₂O.</li>
          <li><strong>Idée fausse</strong> : « le dioxygène brûle ». <strong>Vrai</strong> : il est le comburant, c’est le combustible qui brûle.</li>
          <li><strong>Précautions</strong> : aérer le local, faire entretenir les appareils de chauffage, installer un détecteur de CO.</li>
        </ul></Repli>{renvoi}</> },
    { id: 'eqPropane', titre: 'Équilibrer une combustion', focus: ['scene'],
      texte: <>Le propane C₃H₈ est le gaz des bouteilles de barbecue. Pour équilibrer une combustion, on procède dans l’ordre : d’abord les atomes de <strong>carbone</strong>, puis ceux d’<strong>hydrogène</strong>, et enfin ceux d’<strong>oxygène</strong> (dernier, car il se trouve des deux côtés).</>,
      tache: { type: 'qcm', ...QCM.propane } },
    { id: 'eqEthanol', titre: 'Cas d’un alcool', focus: ['scene'],
      texte: <>Un alcool possède un groupe –OH : sa molécule contient déjà un atome d’oxygène. L’éthanol C₂H₅OH est le principal constituant de l’alcool à brûler et du bioéthanol, ajouté à l’essence.</>,
      tache: { type: 'qcm', ...QCM.ethanol } },
    { id: 'rompreFormer', titre: 'Séparer des atomes, les réunir', focus: ['scene'],
      texte: <>Dans une réaction chimique, des liaisons entre atomes sont <strong>rompues</strong> dans les réactifs, et de nouvelles liaisons se <strong>forment</strong> dans les produits. L’<strong>énergie de liaison</strong> D(A–B) est l’énergie associée à une mole de liaisons A–B, en phase gazeuse ; elle est exprimée en kJ·mol⁻¹ et notée avec un nombre positif.</>,
      tache: { type: 'qcm', ...QCM.rompreFormer },
      retenirTitre: 'À RETENIR : ÉQUILIBRER UNE COMBUSTION',
      retenir: <><Repli>
        <SvgEquilibrer />
        <ul style={liste}>
          <li><strong>Dans l’ordre : C, puis H, puis O.</strong> Une molécule H₂O contient 2 H, une molécule O₂ contient 2 O.</li>
          <li><strong>Vérifier</strong> : autant d’atomes de chaque sorte des deux côtés. Un alcool apporte déjà un atome O.</li>
        </ul></Repli>{renvoi}</> },
    { id: 'rompues', titre: 'Les liaisons des réactifs', focus: ['scene'],
      texte: <>Pour estimer l’énergie échangée, on imagine que <strong>toutes les liaisons des réactifs sont rompues</strong>, puis que les liaisons des produits se forment. Voici les réactifs de la combustion du méthane : 1 molécule CH₄ et 2 molécules O₂. La couleur d’une liaison est celle de son type dans le tableau de données. Rompre 1 mol d’une liaison demande l’énergie D indiquée. Quelle énergie faut-il fournir au total pour rompre toutes les liaisons des réactifs, pour 1 mol de CH₄ ?</>,
      tache: { type: 'num', q: 'Énergie à fournir pour rompre toutes les liaisons des réactifs', carnet: 'Énergie pour rompre les liaisons des réactifs', unite: 'kJ/mol', vrai: C.energieRompue(CH4), tol: 0.01, affiche: v => nbm(v),
        calcul: () => ['CH₄ contient 4 liaisons C–H : 4 × 413 = 1 652 kJ/mol.', '2 molécules O₂ contiennent 2 liaisons O=O : 2 × 498 = 996 kJ/mol.', 'Total : 1 652 + 996 = 2 648 kJ/mol. Hypothèse : D sont des valeurs moyennes, en phase gazeuse.'],
        pieges: [[C.D_LIAISON.CH * 4 + C.D_LIAISON.OO, 'Le coefficient de O₂ est 2 : il y a 2 liaisons O=O à rompre, pas une seule.'], [C.D_LIAISON.CH * 3 + 2 * C.D_LIAISON.OO, 'Une molécule CH₄ contient 4 liaisons C–H, pas 3.'], [C.energieFormee(CH4), 'Ce sont les liaisons des produits (CO₂ et H₂O) : ici on compte celles des réactifs.']],
        expl: '4 × D(C–H) + 2 × D(O=O) = 4 × 413 + 2 × 498 = 2 648 kJ/mol.', indice: 'Comptez les liaisons de chaque type dans CH₄ (de type C–H) puis dans 2 O₂ (de type O=O), multipliez par les énergies du tableau et additionnez.' },
      retenirTitre: 'À RETENIR : ROMPRE ET FORMER DES LIAISONS',
      retenir: <><Repli>
        <SvgRompreFormer />
        <ul style={liste}>
          <li><strong>Rompre une liaison demande de l’énergie, en former une en libère</strong> : D(A–B) &gt; 0, en kJ·mol⁻¹.</li>
          <li><strong>Méthode</strong> : compter chaque type de liaison, multiplier par D, additionner.</li>
        </ul></Repli>{renvoi}</> },
    { id: 'formees', titre: 'Les liaisons des produits', focus: ['scene'],
      texte: <>Les atomes se réarrangent : de nouvelles liaisons se forment dans les produits, 1 molécule CO₂ et 2 molécules H₂O. Former 1 mol d’une liaison libère l’énergie D correspondante, la même valeur que dans le tableau. Quelle énergie est libérée au total par la formation de toutes les liaisons des produits ? Donnez un nombre positif.</>,
      tache: { type: 'num', q: 'Énergie libérée par la formation des liaisons des produits', carnet: 'Énergie libérée en formant les liaisons des produits', unite: 'kJ/mol', vrai: C.energieFormee(CH4), tol: 0.01, affiche: v => nbm(v),
        calcul: () => ['CO₂ contient 2 liaisons C=O : 2 × 804 = 1 608 kJ/mol.', '2 molécules H₂O contiennent 2 × 2 = 4 liaisons O–H : 4 × 463 = 1 852 kJ/mol.', 'Total : 1 608 + 1 852 = 3 460 kJ/mol.'],
        pieges: [[C.D_LIAISON.CdO + 4 * C.D_LIAISON.OH, 'Une molécule CO₂ contient deux liaisons C=O (O=C=O), pas une.'], [2 * C.D_LIAISON.CdO + 2 * C.D_LIAISON.OH, 'Il y a 2 molécules H₂O, de 2 liaisons O–H chacune : cela fait 4 liaisons O–H.'], [-C.energieFormee(CH4), 'Donnez ici l’énergie libérée comme un nombre positif : le signe viendra au calcul suivant.'], [C.energieRompue(CH4), 'Ce sont les liaisons des réactifs, déjà comptées : ici on compte celles des produits.']],
        expl: '2 × D(C=O) + 4 × D(O–H) = 2 × 804 + 4 × 463 = 3 460 kJ/mol.', indice: 'CO₂ s’écrit O=C=O : combien de liaisons C=O ? Chaque H₂O a 2 liaisons O–H, et il y a 2 molécules H₂O.' } },
    { id: 'er', titre: 'Faire le bilan d’énergie', focus: ['scene'],
      texte: <>Les liaisons des réactifs ont demandé <strong>2{NB}648{NB}kJ/mol</strong> pour être rompues ; la formation des liaisons des produits a libéré <strong>3{NB}460{NB}kJ/mol</strong>. L’<strong>énergie molaire de réaction estimée</strong> E<sub>r</sub>, pour 1 mol de CH₄ brûlée, est la différence entre l’énergie fournie et l’énergie libérée :{FEr}Calculez E<sub>r</sub>, avec son signe.</>,
      tache: { type: 'num', q: 'Énergie molaire de réaction estimée E_r', carnet: 'E_r du méthane (estimée)', unite: 'kJ/mol', vrai: C.energieReaction(CH4), tol: 0.01, affiche: v => nbm(v),
        calcul: () => ['Σ D(liaisons rompues) = 2 648 kJ/mol ; Σ D(liaisons formées) = 3 460 kJ/mol.', 'E_r = 2 648 − 3 460 = −812 kJ/mol. Hypothèses : phase gazeuse, énergies de liaison moyennes, combustion complète : c’est une estimation.'],
        pieges: [[812, 'Le signe est faux : l’énergie libérée (3 460) est plus grande que l’énergie fournie (2 648), la différence est négative.'], [6108, 'On soustrait l’énergie libérée à l’énergie fournie ; on ne les additionne pas.'], [C.energieRompue(CH4), 'Ce nombre est l’énergie fournie seule : il faut en retrancher l’énergie libérée (3 460 kJ/mol).']],
        expl: 'E_r = Σ D(rompues) − Σ D(formées) = 2 648 − 3 460 = −812 kJ/mol.', indice: 'Énergie fournie moins énergie libérée : 2 648 − 3 460. Gardez le signe du résultat.' } },
    { id: 'signe', titre: 'Que dit ce résultat ?', focus: ['scene'],
      texte: <>On a trouvé E<sub>r</sub> = <strong>−812{NB}kJ/mol</strong>. Les tables donnent, pour la même réaction (tous les corps gazeux), la valeur de référence <strong>−802{NB}kJ/mol</strong>, obtenue par des mesures. L’écart est de 10{NB}kJ/mol sur 802{NB}kJ/mol, soit <strong>1,2{NB}%</strong>.</>,
      tache: { type: 'qcm', ...QCM.signe } },
    { id: 'ethRompues', titre: 'Même méthode : les réactifs de l’éthanol', focus: ['scene'],
      texte: <>L’éthanol brûle de la même façon (hypothèse du modèle : tous les corps pris à l’état gazeux) : {C.equation(ETH)}. Les réactifs sont 1 molécule d’éthanol et 3 molécules O₂. Comptez les liaisons de la molécule d’éthanol dessinée (C–H, C–C, C–O et O–H), ajoutez une liaison O=O par molécule O₂, puis calculez l’énergie à fournir pour rompre toutes les liaisons des réactifs, pour 1 mol d’éthanol.</>,
      tache: { type: 'num', q: 'Énergie à fournir pour rompre les liaisons des réactifs de l’éthanol', carnet: 'Énergie pour rompre les liaisons (éthanol)', unite: 'kJ/mol', vrai: C.energieRompue(ETH), tol: 0.01, affiche: v => nbm(v),
        calcul: () => ['La molécule d’éthanol contient 5 C–H, 1 C–C, 1 C–O et 1 O–H ; les 3 molécules O₂ contiennent 3 liaisons O=O.', '5 × 413 + 348 + 358 + 463 + 3 × 498 = 2 065 + 348 + 358 + 463 + 1 494 = 4 728 kJ/mol. Hypothèse : D sont des valeurs moyennes, en phase gazeuse.'],
        pieges: [[C.energieRompue(ETH) - C.D_LIAISON.OH, 'Vous avez oublié la liaison O–H de la molécule d’éthanol : elle est elle aussi rompue.'], [C.energieRompue(ETH) - C.D_LIAISON.CO, 'Vous avez oublié la liaison C–O de la molécule d’éthanol.'], [C.energieRompue(ETH) - 2 * C.D_LIAISON.OO, 'Il y a 3 molécules O₂ : 3 liaisons O=O à rompre.'], [C.energieFormee(ETH), 'Ce sont les liaisons des produits : ici on compte celles des réactifs.']],
        expl: '5 × D(C–H) + D(C–C) + D(C–O) + D(O–H) + 3 × D(O=O) = 2 065 + 348 + 358 + 463 + 1 494 = 4 728 kJ/mol.', indice: 'Dans la molécule dessinée, comptez les liaisons de chaque type, puis ajoutez une liaison O=O par molécule O₂ : 3 au total. Multipliez par les énergies du tableau et additionnez.' },
      retenirTitre: 'À RETENIR : L’ÉNERGIE DE RÉACTION',
      retenir: <><Repli>
        <SvgSigne />
        {FEr}
        <ul style={liste}>
          <li><strong>E<sub>r</sub> &lt; 0 : exothermique</strong> (la combustion libère de l’énergie) ; E<sub>r</sub> &gt; 0 : endothermique. Exemple : méthane, −812 kJ/mol pour −802 en référence.</li>
          <li><strong>Hypothèses</strong> : phase gazeuse, énergies moyennes, combustion complète.</li>
        </ul></Repli>{renvoi}</> },
    { id: 'ethFormees', titre: 'Même méthode : produits et E_r de l’éthanol', focus: ['scene'],
      texte: <>Pour 1 mol d’éthanol, rompre les liaisons des réactifs a demandé <strong>4{NB}728{NB}kJ/mol</strong>. Les produits sont 2 molécules CO₂ et 3 molécules H₂O. Comptez les liaisons qui se forment (2 liaisons C=O par CO₂, 2 liaisons O–H par H₂O), calculez l’énergie libérée, puis l’énergie molaire de réaction estimée E<sub>r</sub>, avec son signe, pour 1 mol d’éthanol.</>,
      tache: { type: 'num', q: 'Énergie molaire de réaction estimée E_r de l’éthanol', carnet: 'E_r de l’éthanol (estimée)', unite: 'kJ/mol', vrai: C.energieReaction(ETH), tol: 0.01, affiche: v => nbm(v),
        calcul: () => ['Formées : 2 CO₂ donnent 4 C=O et 3 H₂O donnent 6 O–H : 4 × 804 + 6 × 463 = 3 216 + 2 778 = 5 994 kJ/mol.', 'E_r = 4 728 − 5 994 = −1 266 kJ/mol (référence −1 278 kJ/mol : écart 0,9 %).'],
        pieges: [[1266, 'Le signe est faux : une combustion libère de l’énergie, E_r est négative.'], [C.energieRompue(ETH) + C.energieFormee(ETH), 'On soustrait l’énergie libérée à l’énergie fournie, on ne les additionne pas.'], [C.energieRompue(ETH) - (2 * C.D_LIAISON.CdO + 6 * C.D_LIAISON.OH), 'Il y a 2 molécules CO₂ : cela fait 4 liaisons C=O, pas 2.'], [C.energieRompue(ETH) - (4 * C.D_LIAISON.CdO + 3 * C.D_LIAISON.OH), 'Une molécule H₂O contient deux liaisons O–H : 3 molécules H₂O en contiennent 6.']],
        expl: 'Formées : 4 × D(C=O) + 6 × D(O–H) = 5 994 kJ/mol ; E_r = 4 728 − 5 994 = −1 266 kJ/mol.', indice: 'CO₂ s’écrit O=C=O : 2 liaisons C=O par molécule, donc 4 pour 2 CO₂. Chaque H₂O a 2 liaisons O–H, donc 6 pour 3 H₂O. Puis E_r = énergie fournie − énergie libérée.' } },
    { id: 'pouvoir', titre: 'Énergie libérée par kilogramme', focus: ['scene'],
      texte: <>Un combustible se choisit aussi selon l’énergie qu’il libère par kilogramme brûlé : c’est son <strong>pouvoir calorifique</strong> (estimé ici avec de l’eau à l’état gazeux : cela correspond au pouvoir calorifique inférieur, PCI). On divise l’énergie libérée par mole, |E<sub>r</sub>| = 812{NB}kJ/mol, par la masse molaire du méthane <strong>M = 16,0{NB}g/mol</strong>. Le résultat est en kJ par gramme ; or 1{NB}kJ/g = 1{NB}MJ/kg. Calculez le pouvoir calorifique estimé du méthane, en MJ/kg.</>,
      tache: { type: 'num', q: 'Pouvoir calorifique estimé du méthane', carnet: 'Pouvoir calorifique du méthane (estimé)', unite: 'MJ/kg', vrai: C.pouvoirCalorifique(CH4), tol: 0.01, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => ['Énergie libérée par mole : |E_r| = 812 kJ/mol ; masse d’une mole : M = 16,0 g/mol.', 'PC = 812 ÷ 16,0 = 50,75 kJ/g ≈ 50,8 kJ/g, soit 50,8 MJ/kg (car 1 kJ/g = 1 000 kJ/kg = 1 MJ/kg). Hypothèse : phase gazeuse, E_r estimée.'],
        pieges: [[812, 'C’est E_r : il faut diviser par la masse molaire pour obtenir l’énergie par gramme.'], [812 * 16, 'On divise par M, on ne multiplie pas : l’énergie par gramme est 812 ÷ 16,0.'], [16 / 812, 'Le rapport est inversé : l’énergie (812) est au numérateur, la masse molaire au dénominateur.']],
        expl: 'PC = |E_r| / M = 812 ÷ 16,0 = 50,8 kJ/g = 50,8 MJ/kg.', indice: 'Divisez 812 kJ/mol par 16,0 g/mol : cela donne des kJ/g. Rappel : 1 kJ/g = 1 MJ/kg.' } },
    { id: 'risques', titre: 'Utiliser un combustible en sécurité', focus: ['scene'],
      texte: <>Les combustions présentent des risques : incendie, explosion en cas de fuite de gaz, brûlures. Observez la situation ci-dessous.</>,
      tache: { type: 'qcm', ...QCM.risques },
      retenirTitre: 'À RETENIR : LE POUVOIR CALORIFIQUE',
      retenir: <><Repli>
        <SvgPouvoir />
        {FPC}
        <ul style={liste}>
          <li><strong>Énergie libérée par kg de combustible</strong> : PC = |E<sub>r</sub>| ÷ M ; 1 kJ/g = 1 MJ/kg. Méthane : 50,8 MJ/kg.</li>
          <li><strong>Idée fausse</strong> : « tous les combustibles libèrent autant d’énergie par kg ». <strong>Vrai</strong> : le PC dépend du combustible ; à comparer en exploration, alcanes et alcools.</li>
        </ul></Repli>{renvoi}</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'energie' ? C.tirerDefiEnergie() : C.tirerDefiPouvoir()), type, reps: {}, verifie: false }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.vrai, 0.02);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'energie' ? noterE : noterP)(ok);
  };
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label.startsWith('E_r') ? <>E<sub>r</sub>{label.slice(3)}</> : label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label.replace("E_r", "E r")} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('cb-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }} /><span>{unite}</span>
    </div>);
  const detailDefi = c => {
    const lis = L => Object.entries(L).map(([t, n]) => `${C.coefTexte(n).trim() || n} × ${C.NOM_LIAISON[t]}`.replace(/^(\d+)½ ×/, '$1,5 ×').replace(/^½ ×/, '0,5 ×')).join(' + ');
    return `Rompues : ${lis(C.liaisonsRompues(c))} = ${nbm(C.energieRompue(c))} kJ/mol ; formées : ${lis(C.liaisonsFormees(c))} = ${nbm(C.energieFormee(c))} kJ/mol ; E_r = ${nbm(C.energieReaction(c))} kJ/mol (référence ${nbm(c.ref)} kJ/mol, écart ${nbf(C.ecartRelatif(c) * 100, 1)} %).`;
  };
  const noteDemi = c => (C.estEntiere(c) ? null : <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, margin: '2px 0 6px' }}>Le coefficient {C.coefTexte(C.coefficients(c).O2).trim()}{NB}O₂ se lit {nbf(C.coefficients(c).O2, 1)} mol de O₂ pour 1 mol de {c.nom}.</div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['energie', 'Énergie de réaction'], ['pouvoir', 'Pouvoir calorifique']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'energie' ? 'Défi : estimer l’énergie molaire de réaction' : 'Défi : estimer le pouvoir calorifique'}</div>
      {defi.type === 'energie' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On brûle complètement du <strong>{defi.c.nom}</strong> {defi.c.f} ({defi.c.usage}). Hypothèse du modèle : tous les corps sont pris à l’état gazeux. Comptez, sur le dessin, les liaisons rompues et formées pour <strong>1 mol de {defi.c.nom}</strong>, puis estimez l’énergie molaire de réaction E<sub>r</sub>, avec son signe, en kJ/mol.</div>
        {champ('E_r =', 'kJ/mol')}
        <IndiceDefi cache={false}>E<sub>r</sub> = Σ D(rompues) − Σ D(formées). Rompues : les liaisons de la molécule de combustible (comptez chaque type sur le dessin) et une liaison O=O par molécule O₂ de l’équation. Formées : 2 liaisons C=O par CO₂ et 2 liaisons O–H par H₂O.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On brûle complètement du <strong>{defi.c.nom}</strong> {defi.c.f} ({defi.c.usage}). Hypothèse du modèle : tous les corps sont pris à l’état gazeux. Sa masse molaire est <strong>M = {nbf(defi.M, 1)}{NB}g/mol</strong>. Estimez son pouvoir calorifique, c’est-à-dire l’énergie libérée par kilogramme de combustible, en MJ/kg (1 kJ/g = 1 MJ/kg).</div>
        {champ('PC =', 'MJ/kg')}
        <IndiceDefi cache={false}>Estimez d’abord E<sub>r</sub> = Σ D(rompues) − Σ D(formées) pour 1 mol de combustible (comptez les liaisons sur le dessin). Puis PC = |E<sub>r</sub>| ÷ M, en kJ/g, qui vaut le même nombre en MJ/kg.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="cb-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok
          ? `✓ Correct. ${detailDefi(defi.c)}${defi.type === 'pouvoir' ? ` PC = ${nbf(-C.energieReaction(defi.c), 0)} ÷ ${nbf(defi.M, 1)} = ${nbf(defi.vrai, 1)} MJ/kg.` : ''} (marge acceptée : ± 2 %).`
          : defi.type === 'energie' ? '✗ Vérifiez le comptage de chaque type de liaison, les coefficients de l’équation (O₂, CO₂, H₂O) et le signe : E_r = rompues − formées.'
            : '✗ Vérifiez E_r (liaisons rompues moins liaisons formées), puis divisez sa valeur absolue par M, en g/mol : le résultat est en kJ/g, donc en MJ/kg.'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Phase gazeuse</strong> : tous les corps, y compris l’eau, sont pris à l’état gazeux. Pour de l’eau liquide, il faudrait ajouter l’énergie de condensation : le résultat serait plus grand en valeur absolue (ce n’est pas traité ici).</li>
      <li><strong>Énergies de liaison moyennes</strong> : D(C–H) vaut 413 kJ/mol dans toutes les molécules, alors que la vraie valeur dépend un peu de la molécule. Le résultat est donc une <strong>estimation</strong> : on la compare à une valeur de référence tabulée, l’écart est de quelques % (ici de 0,2 % à 3,4 % selon le combustible).</li>
      <li><strong>Valeur de référence</strong> : valeur tabulée de l’énergie molaire de réaction, en phase gazeuse (eau gazeuse), arrondie à l’unité ; ce n’est pas une mesure faite ici.</li>
      <li><strong>Combustion complète</strong> : seuls CO₂ et H₂O se forment. Le calcul ne s’applique pas à une combustion incomplète (qui forme CO ou C), vue en exploration pour aller plus loin.</li>
      <li><strong>Équation pour 1 mol de combustible</strong> : le coefficient du combustible est 1, ce qui impose parfois un coefficient demi-entier (6½ O₂ pour le butane) ; E<sub>r</sub> est l’énergie pour 1 mol de combustible brûlé.</li>
      <li><strong>Sens des grandeurs</strong> : D est positive (énergie pour rompre une mole de liaisons), E<sub>r</sub> est négative pour une réaction exothermique. D est l’énergie d’une liaison, E<sub>r</sub> celle d’une réaction.</li>
      <li><strong>Pouvoir calorifique</strong> : estimé en divisant |E<sub>r</sub>| par la masse molaire (M(C) = 12,0 g/mol, M(H) = 1,0 g/mol, M(O) = 16,0 g/mol) ; il correspond au pouvoir calorifique inférieur (PCI : l’eau reste gazeuse) ; le pouvoir calorifique supérieur des tables compte en plus la condensation de l’eau.</li>
      <li><strong>Schémas simplifiés</strong> : les molécules sont dessinées en formules développées planes, sans les vrais angles ni les vraies longueurs de liaison.</li>
      <li><strong>Ce qui n’est pas traité</strong> : la vitesse de la combustion, l’énergie d’activation et le changement d’état de l’eau.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const eqTete = (c, cache) => <EquationTete texte={cache === true ? C.equationATrous(c) : C.equation(c, { cache: cache || null })} note="hypothèse : tous les corps sont gazeux" />;
  const sceneGuide = (() => {
    switch (idE) {
      case 'combustibles': return boite('Quelques corps du quotidien', <SceneCorps />, cadre('scene'));
      case 'incomplete': return boite('Deux becs de laboratoire', <SceneBecs />, cadre('scene'));
      case 'eqMethane': return boite('La combustion du méthane', <>{eqTete(CH4, fait('eqMethane') ? null : ['O2'])}<RangeeEquation c={CH4} revele={fait('eqMethane')} /></>, cadre('scene'));
      case 'eqPropane': { const c = C.combustible('c3h8'); return boite('La combustion du propane', <>{eqTete(c, fait('eqPropane') ? null : true)}<MoleculeSeule c={c} />{fait('eqPropane') && <TableauAtomes c={c} />}</>, cadre('scene')); }
      case 'eqEthanol': return boite('La combustion de l’éthanol', <>{eqTete(ETH, fait('eqEthanol') ? null : true)}<MoleculeSeule c={ETH} />{fait('eqEthanol') && <TableauAtomes c={ETH} />}</>, cadre('scene'));
      case 'rompreFormer': return boite('Rompre et former une liaison', <SceneDeuxAtomes />, cadre('scene'));
      case 'rompues': return boite('Les liaisons à rompre', <>{eqTete(CH4)}<RangeeEspeces c={CH4} cote="rompues" titre="Réactifs de la combustion du méthane" /><DonneesLiaisons /></>, cadre('scene'));
      case 'formees': return boite('Les liaisons à former', <>{eqTete(CH4)}<RangeeEspeces c={CH4} cote="formees" titre="Produits de la combustion du méthane" /><DonneesLiaisons />
        <div style={{ marginTop: 6 }}>{donnee('Énergie pour rompre (étape 7)', `${nbm(C.energieRompue(CH4))}${NB}kJ/mol`, COL.rouge)}</div></>, cadre('scene'));
      case 'er': return boite('Les deux énergies à comparer', <>{eqTete(CH4)}<Niveaux rompue={C.energieRompue(CH4)} formee={C.energieFormee(CH4)} formuleR="CH₄ + 2 O₂" formuleP="CO₂ + 2 H₂O" revele={fait('er')} /></>, cadre('scene'));
      case 'signe': return boite('Estimation et référence', <>{eqTete(CH4)}<Niveaux rompue={C.energieRompue(CH4)} formee={C.energieFormee(CH4)} formuleR="CH₄ + 2 O₂" formuleP="CO₂ + 2 H₂O" revele reference={CH4.ref} /></>, cadre('scene'));
      case 'ethRompues': return boite('Les liaisons à rompre pour l’éthanol', <>{eqTete(ETH)}<RangeeEspeces c={ETH} cote="rompues" titre="Réactifs de la combustion de l’éthanol" /><DonneesLiaisons /></>, cadre('scene'));
      case 'ethFormees': return boite('Les liaisons à former pour l’éthanol', <>{eqTete(ETH)}<RangeeEspeces c={ETH} cote="formees" titre="Produits de la combustion de l’éthanol" /><DonneesLiaisons />
        <div style={{ marginTop: 6 }}>{donnee('Énergie pour rompre (étape 11)', `${nbm(C.energieRompue(ETH))}${NB}kJ/mol`, COL.rouge)}</div></>, cadre('scene'));
      case 'pouvoir': return boite('Du kJ par mole au MJ par kilogramme', <>{eqTete(CH4)}<div>{donnee('Énergie libérée |E_r|', `${nbm(-C.energieReaction(CH4))}${NB}kJ/mol`, COL.orange)}{donnee('Masse molaire M', `${nbf(C.masseMolaire(CH4), 1)}${NB}g/mol`)}{donnee('Équivalence', `1${NB}kJ/g = 1${NB}MJ/kg`)}</div></>, cadre('scene'));
      case 'risques': return boite('Une chaudière dans une pièce fermée', <SceneChaudiere />, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const cE = C.combustible(ex.c), complete = ex.o2 === 'suffisant';
  const rompE = C.liaisonsRompues(cE), formE = C.liaisonsFormees(cE), ER = C.energieReaction(cE), PC = C.pouvoirCalorifique(cE);
  const reglages = (<>
    {etiquette('Combustible', <select value={ex.c} onChange={x => setE({ c: x.target.value })} style={sel}>
      <optgroup label="Alcanes">{C.COMBUSTIBLES.filter(c => c.type === 'alcane').map(c => <option key={c.id} value={c.id}>{c.nom} {c.f}</option>)}</optgroup>
      <optgroup label="Alcools">{C.COMBUSTIBLES.filter(c => c.type === 'alcool').map(c => <option key={c.id} value={c.id}>{c.nom} {c.f}</option>)}</optgroup></select>)}
    {etiquette('Quantité de dioxygène', <select value={ex.o2} onChange={x => setE({ o2: x.target.value })} style={sel}><option value="suffisant">suffisante (complète)</option><option value="manque">insuffisante (aller plus loin)</option></select>)}
    {aide('Choisissez un combustible : les liaisons rompues et formées, l’énergie et le pouvoir calorifique se calculent seuls. Avec peu de dioxygène, la combustion est incomplète (pour aller plus loin : hors capacités exigibles).')}
  </>);
  const lignesTable = L => Object.entries(L).map(([t, n]) => (
    <tr key={t}><td style={cel}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: ({ CH: '#0369a1', CC: '#6d28d9', CO: '#b45309', OH: '#0f766e', OO: '#b91c1c', CdO: '#15803d' })[t], marginRight: 6 }} />{C.NOM_LIAISON[t]}</td>
      <td style={cel}>{C.coefTexte(n).trim() ? nbf(n, n % 1 ? 1 : 0) : nbf(n, 0)}</td><td style={cel}>{C.D_LIAISON[t]}</td><td style={cel}>{nbm(n * C.D_LIAISON[t])}</td></tr>));
  const cel = { padding: '3px 4px', border: `1px solid ${KIT.bord}`, fontSize: 14, textAlign: 'center', whiteSpace: 'nowrap' };
  const th = { ...cel, background: '#f1f5f9', fontWeight: 700 };
  const tableBilan = (titre, L, total) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 3 }}>{titre}</div>
      <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white' }}><thead><tr><th style={th}>liaison</th><th style={th}>nombre</th><th style={th}>D (kJ/mol)</th><th style={th}>total</th></tr></thead>
        <tbody>{lignesTable(L)}<tr><td style={{ ...cel, fontWeight: 700 }} colSpan={3}>somme</td><td style={{ ...cel, fontWeight: 700 }}>{nbm(total)}</td></tr></tbody></table>
    </div>);
  const sceneExplore = complete ? (<>
    <EquationTete texte={C.equation(cE)} note="combustion complète ; hypothèse : tous les corps gazeux" />{noteDemi(cE)}
    <RangeeEspeces c={cE} cote="rompues" titre={`Réactifs : ${cE.nom}`} />
    <RangeeEspeces c={cE} cote="formees" titre={`Produits de la combustion : ${cE.nom}`} />
  </>) : (<>
    <EquationTete texte={`${cE.f} + O₂ (en défaut) → CO et/ou C, avec H₂O`} note="pour aller plus loin (hors capacités exigibles) : l’énergie n’est pas estimée ici" />
    <SceneBecs />
    <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginTop: 8 }}>Quand le dioxygène manque, une partie du carbone ne devient pas du CO₂ : il se forme du <strong>monoxyde de carbone CO</strong> (gaz toxique, incolore et inodore) et du <strong>carbone C</strong> (suie, flamme jaune). L’énergie libérée est plus faible que pour la combustion complète.</div>
  </>);
  const mesuresExplore = complete ? (<>
    <Niveaux rompue={C.energieRompue(cE)} formee={C.energieFormee(cE)} formuleR={`${cE.f} + ${C.coefTexte(C.coefficients(cE).O2).trim()}${NB}O₂`} formuleP={`${C.coefTexte(C.coefficients(cE).CO2).trim()}${NB}CO₂ + ${C.coefTexte(C.coefficients(cE).H2O).trim()}${NB}H₂O`} revele reference={cE.ref} />
    <div style={{ marginTop: 8 }}>{tableBilan('Liaisons rompues (énergie à fournir, en kJ/mol)', rompE, C.energieRompue(cE))}{tableBilan('Liaisons formées (énergie libérée, en kJ/mol)', formE, C.energieFormee(cE))}</div>
    <div>
      {donnee('E_r = rompues − formées', `${nbm(ER)}${NB}kJ/mol`, COL.orange)}
      {donnee('Valeur de référence', `${nbm(cE.ref)}${NB}kJ/mol`)}
      {donnee('Écart relatif', `${nbf(C.ecartRelatif(cE) * 100, 1)}${NB}%`)}
      {donnee('Masse molaire M', `${nbf(C.masseMolaire(cE), 1)}${NB}g/mol`)}
      {donnee('PC = |E_r| ÷ M', `${nbf(PC, 1)}${NB}MJ/kg`, COL.vert)}
    </div>
    <div style={{ marginTop: 8 }}><Section titre="Comparer les pouvoirs calorifiques" ouvert={!!ex.ouv.barres} onBascule={() => ouvrir('barres')}><BarresPouvoir c={cE} /></Section></div>
  </>) : <div style={{ fontSize: 14, color: KIT.txt2 }}>Repassez à « suffisante » pour voir le bilan des liaisons et le pouvoir calorifique.</div>;
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Comparez le méthane, le propane, le butane et l’octane : que devient |E<sub>r</sub>| quand la molécule grossit ? Et le pouvoir calorifique par kilogramme ?</li>
      <li>Comparez l’éthanol et le propane (ou le méthanol et le méthane) : lequel libère le plus d’énergie par kilogramme ? Quel rôle joue l’atome d’oxygène de l’alcool ?</li>
      <li>Pour chaque combustible, comptez les liaisons O–H formées : retrouvez-vous le nombre d’atomes d’hydrogène de la molécule ?</li>
      <li>Pour quel combustible l’écart entre l’estimation et la référence est-il le plus grand ? Pourquoi une estimation par valeurs moyennes ne peut-elle pas être exacte ?</li>
      <li>Choisissez un dioxygène insuffisant : qu’est-ce qui change dans les produits, la flamme et les risques ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>combustion complète : combustible + O₂ → CO₂ + H₂O ; incomplète (pour aller plus loin, manque de O₂) : suie C et CO, toxique</li>
        <li>équation : équilibrer C, puis H, puis O ; un alcool apporte déjà un atome O</li>
        <li>rompre une liaison demande de l’énergie D, en former une en libère : D &gt; 0</li>
        <li>E<sub>r</sub> ≈ Σ D(rompues) − Σ D(formées) ; E<sub>r</sub> &lt; 0 : exothermique ; estimation (énergies moyennes, phase gazeuse)</li>
        <li>pouvoir calorifique : PC = |E<sub>r</sub>| ÷ M, en kJ/g = MJ/kg</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cb-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cb-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cb-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .cb-l1.cote .cb-carte { order: 2; } .cb-l1.cote .cb-main { order: 1; }
          .cb-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .cb-ex > .cb-ex-scene { grid-column: 1; grid-row: 1; } .cb-ex > .cb-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .cb-ex > .cb-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .cb-l1.cote { grid-template-columns: minmax(0, 1fr); } .cb-l1.cote .cb-main { order: 1; } .cb-l1.cote .cb-carte { order: 2; } .cb-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .cb-in { animation: cb-fondu 0.35s ease-out; } @keyframes cb-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Combustions : énergie libérée et énergies de liaison</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une <strong>combustion</strong> est une réaction entre un combustible et le dioxygène. On écrit son équation, puis on <strong>estime l’énergie libérée</strong> en comptant les liaisons rompues (énergie à fournir) et les liaisons formées (énergie libérée).</div>
      {enExplore ? <>
        <div className="cb-ex">
          <div className="cb-ex-scene">{boite(complete ? 'Équation et liaisons' : 'Combustion incomplète', sceneExplore)}</div>
          <div className="cb-ex-reglages">{boite('Réglages', reglages)}</div>
          <div className="cb-ex-mesures">{boite('Bilan d’énergie', mesuresExplore)}</div>
        </div>
        <Section titre="Données : énergies de liaison" ouvert={!!ex.ouv.donnees} onBascule={() => ouvrir('donnees')}><DonneesLiaisons titre="Énergies de liaison moyennes, en kJ·mol⁻¹" /></Section>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`cb-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="cb-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="cb-carte cb-hypo-defi">{panneauHypo}</div> : null}
          <div className="cb-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'energie' ? suiviE : suiviP} /></div>}
            {enDefi && defi && <div className="cb-in">{boite(`La combustion du ${defi.c.nom}`, <>
              <EquationTete texte={C.equation(defi.c)} note="hypothèse : tous les corps sont gazeux" />{noteDemi(defi.c)}
              <RangeeEspeces c={defi.c} cote="rompues" titre="Réactifs" /><RangeeEspeces c={defi.c} cote="formees" titre="Produits" /><DonneesLiaisons /></>)}</div>}
            {enGuide && <div className="cb-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('rompues') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
