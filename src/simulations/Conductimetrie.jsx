import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./conductimetrieModele";
import { QCM_PARCOURS as Q } from "./conductimetrieQcm";
import { SceneConductimetrie, GraphiqueConductivite, BarresContribution, SvgKohlrauschCarte, SvgRemplacerCarte, SvgCourbeVCarte, SvgConcentrationCarte, SvgFaibleCarte } from "./conductimetrieSchemas";

const SIM_ID = 135, CLE_GUIDE = 'conductimetrie-tg-guide-v1';
declarerDefis(SIM_ID, [['conc', 'Concentration d’un acide à partir de la courbe'], ['sigma', 'Conductivité prévue en cours de titrage']]);

// ====================================================
// SIM 135 — CONDUCTIMÉTRIE : CONDUCTIVITÉ D'UNE SOLUTION ET TITRAGE CONDUCTIMÉTRIQUE (TG spé PC, chapitre « Déterminer la composition d'un système »,
//  parties B « Analyser un système par des méthodes physiques » et C « Analyser un système par des méthodes chimiques »).
//  Une seule idée : chaque ion apporte à σ une part λ × c ; quand un titrage remplace un ion par un autre, la pente de σ change, et la rupture de pente repère l'équivalence.
//  Capacités visées (jamais affichées à l'élève) : exploiter la loi de Kohlrausch pour déterminer une concentration et citer son domaine de validité ; justifier qualitativement l'évolution de la pente
//  de la courbe d'un titrage conductimétrique à l'aide des conductivités ioniques molaires ; établir la composition du système après ajout d'un volume de solution titrante (transformation totale) ;
//  exploiter un titrage pour déterminer une concentration.
//  Hors de cette simulation : courbe d'étalonnage (mesure d'une conductance), à traiter à part.
//  Modèle de calcul : conductimetrieModele.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#7c3aed' };
const PRESET = { an: 'hcl', cA: 0.050, VB: 5, eau: 180 };
const IDS = ['ions', 'lambda', 'kohl', 'acide', 'reaction', 'avant', 'apres', 'pente', 've', 'conc', 'compo', 'faible', 'bilan'];
// état affiché à chaque étape du parcours : volume versé, partie déjà tracée de la courbe
const SC_VB = { reaction: 0, avant: 5, apres: 15, pente: 20, ve: 20, conc: 10, compo: 15, faible: 5, bilan: 10 };
const SC_VMAX = { reaction: 0, avant: 5, apres: 15, pente: 20, ve: 20, conc: 20, compo: 20, faible: 20, bilan: 20 };
const yMaxDe = m => { const s = m <= 120 ? 25 : 50; return Math.ceil(m * 1.05 / s) * s; };
const nbPoints = n => (n < 0.02 ? 0 : Math.max(1, Math.round(n / 0.1)));      // un point = 0,1 mmol, sans échelle affichée

// ---------- formules (MathML) ----------
const FKohl = <Formule><mi>σ</mi><mo>=</mo><munder><mo>∑</mo><mi>i</mi></munder><msub><mi>λ</mi><mi>i</mi></msub><mo>×</mo><msub><mi>c</mi><mi>i</mi></msub></Formule>;
const FConc = <Formule><msub><mi>c</mi><mi mathvariant="normal">A</mi></msub><mo>=</mo><mfrac><mrow><msub><mi>c</mi><mi mathvariant="normal">B</mi></msub><mo>×</mo><msub><mi>V</mi><mi mathvariant="normal">E</mi></msub></mrow><mrow><msub><mi>V</mi><mi mathvariant="normal">A</mi></msub></mrow></mfrac></Formule>;
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;

// équation de titrage : une seule ligne, jamais coupée (la police se réduit sur téléphone) ; l'intitulé passe au-dessus si la place manque
const Equation = ({ analyte }) => (
  <span style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: 'clamp(12px, 3.9vw, 17px)', fontWeight: 700, color: KIT.txt, lineHeight: 1.6 }}>
    {analyte === 'eth' ? 'CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O' : 'H₃O⁺\u00a0+\u00a0HO⁻\u00a0→\u00a02\u00a0H₂O'}</span>);
const LigneEquation = ({ analyte }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 8px' }}><span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>Réaction de titrage :</span><Equation analyte={analyte}/></div>);

// ====================================================
export function SimulationConductimetrie() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviS, noterS] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('conc');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ contrib: false, lambda: false, fins: false, essayer: false, retenir: false, mesures: false });
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);
  const enSel = enGuide && IDS.indexOf(idE) <= IDS.indexOf('acide');        // première partie : une solution simple, sans titrage

  // ---------- situation affichée ----------
  const analyte = enGuide ? (deja('faible') && idE !== 'bilan' ? 'eth' : 'hcl') : ti.an;
  const cA = enGuide ? 0.050 : ti.cA, eau = enGuide ? 180 : ti.eau, Vinit = M.VA0 + eau;
  const VB = enGuide ? (SC_VB[idE] ?? 0) : ti.VB;
  const an = M.ANALYTES[analyte];
  const comp = M.composition({ analyte, cA, VB, Vinit }), sigma = M.kohlrausch(comp.c);
  const VE = M.volumeEquivalent(cA);
  const full = M.courbe({ analyte, cA, Vinit }, M.V_BURETTE, 0.25);
  const yMax = yMaxDe(Math.max(...full.map(p => p.sigma)));
  const vmax = enGuide ? (SC_VMAX[idE] ?? 0) : M.V_BURETTE;
  const trace = full.filter(p => p.VB <= vmax + 1e-9);
  const pointsTit = { H3O: nbPoints(comp.c.H3O * comp.Vt / 1000), HO: nbPoints(comp.c.HO * comp.Vt / 1000), Na: nbPoints(comp.c.Na * comp.Vt / 1000), anion: nbPoints(comp.c[an.anion] * comp.Vt / 1000), acide: nbPoints(comp.acide * comp.Vt / 1000) };
  const contribs = [['H3O', 'H₃O⁺'], ['HO', 'HO⁻'], ['Na', 'Na⁺'], [an.anion, M.IONS[an.anion].f]].map(([id, f]) => ({ id, f, couleur: M.IONS[id].couleur, v: M.IONS[id].lambda * comp.c[id] }));
  const pen = M.pente({ analyte, cA, Vinit }, VB);
  const concMax = Math.max(...['H3O', 'HO', 'Na', an.anion].map(k => comp.c[k]));

  // ---------- étapes ----------
  const ETAPES = [
    { id: 'ions', titre: 'Qui transporte le courant dans une solution ?', focus: ['scene'],
      texte: <>Une solution de chlorure de sodium NaCl conduit le courant électrique ; une solution de sucre presque pas. Sur le schéma, les points bleus sont des ions sodium Na⁺ et les points verts des ions chlorure Cl⁻ : le + ou le − dessiné dans chaque point rappelle la charge. Ces ions se déplacent librement dans l’eau.</>,
      tache: { type: 'qcm', q: 'Pourquoi la solution de chlorure de sodium conduit-elle le courant ?', ...Q.ions,
        expl: 'Dans une solution, le courant est un déplacement d’ions : les cations et les anions se déplacent en sens contraires et transportent la charge. L’eau sucrée ne contient presque pas d’ions, ses molécules sont neutres.',
        indice: 'Dans un fil métallique, le courant est un déplacement d’électrons. Quelles entités chargées se déplacent dans une solution ?' } },
    { id: 'lambda', titre: 'Tous les ions ne conduisent pas pareil', focus: ['donnees'],
      texte: <>À même concentration, deux ions n’ont pas la même efficacité pour conduire le courant. On la mesure par la <strong>conductivité ionique molaire λ</strong>, en mS·m²·mol⁻¹ (à 25 °C). Le tableau de données donne par exemple λ(H₃O⁺)&nbsp;=&nbsp;35,0 ; λ(Na⁺)&nbsp;=&nbsp;5,0 ; λ(Cl⁻)&nbsp;=&nbsp;7,6 ; λ(HO⁻)&nbsp;=&nbsp;19,9.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de H₃O⁺ et de Na⁺ ?', ...Q.lambda,
        expl: 'À concentration égale, la contribution d’un ion à σ est proportionnelle à son λ : H₃O⁺ (35,0) conduit 7 fois mieux que Na⁺ (5,0). λ dépend de l’ion lui-même (H₃O⁺ est très mobile dans l’eau), pas seulement de sa charge.',
        indice: 'Comparez 35,0 et 5,0 : plus λ est grand, plus l’ion contribue à la conductivité quand les concentrations sont égales.' } },
    { id: 'kohl', titre: 'La loi de Kohlrausch', focus: ['scene', 'donnees'],
      texte: <>La conductivité σ d’une solution diluée est la somme des contributions de chaque ion : {FKohl}avec c en mol·m⁻³ (attention : 1 mol/L = 1 000 mol·m⁻³). On prépare une solution de chlorure de sodium de concentration c = 1,0×10⁻² mol/L ; NaCl est totalement dissocié en Na⁺ et Cl⁻. On donne λ(Na⁺)&nbsp;=&nbsp;5,0 et λ(Cl⁻)&nbsp;=&nbsp;7,6 mS·m²·mol⁻¹. L’affichage du conductimètre est masqué : prévoyez sa valeur.</>,
      tache: { type: 'num', q: 'Conductivité σ de la solution de chlorure de sodium', unite: 'mS·m⁻¹', vrai: 126, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['c = 1,0×10⁻² mol/L = 10 mol·m⁻³ (1 mol/L = 1 000 mol·m⁻³).', 'NaCl\u00a0→\u00a0Na⁺\u00a0+\u00a0Cl⁻ : [Na⁺] = [Cl⁻] = c = 10 mol·m⁻³.', 'σ = λ(Na⁺) × [Na⁺] + λ(Cl⁻) × [Cl⁻] = 5,0 × 10 + 7,6 × 10 = 50 + 76 = 126 mS·m⁻¹.'],
        pieges: [[0.126, 'Vous avez gardé c en mol/L : convertissez-la en mol·m⁻³ (× 1 000) avant d’appliquer la loi.'], [50, 'Il manque la contribution de Cl⁻ : les deux ions contribuent à σ.'], [76, 'Il manque la contribution de Na⁺ : les deux ions contribuent à σ.'], [12.6, 'Il faut c en mol·m⁻³ : 1,0×10⁻² mol/L = 10 mol·m⁻³, pas 1,0 mol·m⁻³.']],
        expl: 'σ = (5,0 + 7,6) × 10 = 126 mS·m⁻¹.', indice: 'Convertissez d’abord c en mol·m⁻³. Les deux ions ont la même concentration c : additionnez λ × c pour Na⁺ et λ × c pour Cl⁻.' } },
    { id: 'acide', titre: 'Un acide fort conduit mieux qu’un sel', focus: ['scene'],
      texte: <>Même concentration, c = 1,0×10⁻² mol/L, mais avec de l’acide chlorhydrique (H₃O⁺, Cl⁻), totalement dissocié. On donne λ(H₃O⁺)&nbsp;=&nbsp;35,0 et λ(Cl⁻)&nbsp;=&nbsp;7,6 mS·m²·mol⁻¹. Le conductimètre reste masqué : calculez σ.</>,
      tache: { type: 'num', q: 'Conductivité σ de la solution d’acide chlorhydrique', unite: 'mS·m⁻¹', vrai: 426, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['c = 1,0×10⁻² mol/L = 10 mol·m⁻³ ; [H₃O⁺] = [Cl⁻] = 10 mol·m⁻³ (acide fort, totalement dissocié).', 'σ = 35,0 × 10 + 7,6 × 10 = 350 + 76 = 426 mS·m⁻¹.', 'Soit environ 3,4 fois la valeur du chlorure de sodium : c’est l’ion H₃O⁺ qui domine.'],
        pieges: [[0.426, 'Vous avez gardé c en mol/L : convertissez-la en mol·m⁻³ (× 1 000).'], [350, 'Il manque la contribution de Cl⁻ : les deux ions contribuent à σ.'], [76, 'Il manque la contribution de H₃O⁺, de loin la plus grande.'], [126, 'Vous avez utilisé λ(Na⁺) : l’acide chlorhydrique contient H₃O⁺ et Cl⁻, pas Na⁺.']],
        expl: 'σ = (35,0 + 7,6) × 10 = 426 mS·m⁻¹.', indice: 'Même démarche que pour NaCl : c = 10 mol·m⁻³ pour chaque ion, mais les ions sont H₃O⁺ (35,0) et Cl⁻ (7,6).' } },
    { id: 'reaction', titre: 'Suivre un titrage par conductimétrie',
      focus: ['scene', 'equation'],
      retenirTitre: 'À RETENIR : CHAQUE ION APPORTE SA PART',
      retenir: <>
        <SvgKohlrauschCarte/>
        <Ul>
          <li>La conductivité d’une solution diluée est la <strong>somme des contributions de chaque ion</strong> : {FKohl} avec c en mol·m⁻³ (1 mol/L = 1 000 mol·m⁻³).</li>
          <li>Exemple de la simulation : à la même concentration, NaCl donne 126 mS·m⁻¹ et HCl 426 mS·m⁻¹, car λ(H₃O⁺)&nbsp;=&nbsp;35,0 est bien plus grand que λ(Na⁺)&nbsp;=&nbsp;5,0.</li>
          <li>Moyen de s’en souvenir : <strong>« chaque ion pèse selon son λ »</strong>, et H₃O⁺ et HO⁻ sont les champions. Idée fausse : « tous les ions conduisent pareil ». Vrai : cela dépend de la nature de chaque ion.</li>
        </Ul></>,
      texte: <>On titre 20,0 mL d’une solution d’acide chlorhydrique de concentration c<sub>A</sub> <strong>inconnue</strong>, diluée dans 180 mL d’eau, par une solution d’hydroxyde de sodium (Na⁺, HO⁻) de concentration c<sub>B</sub> = 0,100 mol/L. La réaction de titrage s’écrit en haut de l’écran. Le conductimètre mesure σ pendant que l’on verse la soude : son affichage est maintenant visible.</>,
      tache: { type: 'qcm', q: 'Quels ions ne participent pas à la réaction de titrage (ions spectateurs) ?', ...Q.reaction,
        expl: 'La réaction H₃O⁺\u00a0+\u00a0HO⁻\u00a0→\u00a02\u00a0H₂O consomme seulement H₃O⁺ et HO⁻. Les ions Cl⁻ (de l’acide) et Na⁺ (de la soude) ne réagissent pas : ils restent en solution, mais leur quantité ou leur concentration change à cause de l’ajout de soude.',
        indice: 'Lisez l’équation de la réaction : quels ions y figurent ? Ceux qui n’y figurent pas sont spectateurs.' } },
    { id: 'avant', titre: 'Avant l’équivalence : σ diminue', focus: ['graphique', 'contrib'],
      texte: <>On a versé 5,0 mL de soude (point rouge). Le graphique trace σ en fonction du volume de soude versé, depuis le début ; les barres montrent la part de chaque ion dans σ.</>,
      tache: { type: 'qcm', q: 'Avant l’équivalence, pourquoi σ diminue-t-il quand on verse la soude ?', ...Q.avant,
        expl: 'Chaque ion HO⁻ versé réagit avec un ion H₃O⁺ : H₃O⁺ (λ = 35,0) disparaît et l’ion Na⁺ qui accompagne HO⁻ prend sa place (λ = 5,0), bien moins conducteur. Les ions Cl⁻ ne réagissent pas, ils restent. La dilution joue un rôle bien plus faible.',
        indice: 'Quels ions disparaissent, quels ions apparaissent quand on verse un peu de soude ? Comparez leurs λ.' } },
    { id: 'apres', titre: 'Après l’équivalence : σ remonte', focus: ['graphique', 'contrib'],
      texte: <>On a versé 15,0 mL de soude. La courbe est passée par un minimum, puis elle remonte : il n’y a plus d’ions H₃O⁺ à consommer.</>,
      tache: { type: 'qcm', q: 'Après l’équivalence, pourquoi σ augmente-t-il de nouveau ?', ...Q.apres,
        expl: 'Quand tout H₃O⁺ a été consommé, les ions HO⁻ versés n’ont plus rien à faire réagir : ils restent en solution avec les ions Na⁺ qui les accompagnent. Ces deux ions s’accumulent et σ augmente (λ(HO⁻)\u00a0=\u00a019,9 ; λ(Na⁺)\u00a0=\u00a05,0).',
        indice: 'Après l’équivalence, que devient chaque ion HO⁻ que l’on verse ? Peut-il encore réagir ?' } },
    { id: 'pente', titre: 'Une pente plus forte avant qu’après', focus: ['graphique'],
      texte: <>Le graphique est maintenant tracé jusqu’à 20 mL : la courbe descend plus vite qu’elle ne remonte. Rappel des conductivités ioniques molaires : λ(H₃O⁺)&nbsp;=&nbsp;35,0 ; λ(Na⁺)&nbsp;=&nbsp;5,0 ; λ(HO⁻)&nbsp;=&nbsp;19,9 mS·m²·mol⁻¹.</>,
      tache: { type: 'qcm', q: 'Quelle comparaison explique cette différence de pente ?', ...Q.pente,
        expl: 'Avant l’équivalence, chaque mole de HO⁻ versée fait disparaître un H₃O⁺ (35,0) et apparaître un Na⁺ (5,0) : variation de 5,0 − 35,0 = −30,0. Après, chaque mole versée ajoute HO⁻ (19,9) et Na⁺ (5,0) : variation de +24,9. Comme 30,0 > 24,9, la courbe descend plus vite qu’elle ne remonte.',
        indice: 'Pour chaque mole de soude versée, additionnez les λ des ions qui apparaissent et retranchez ceux des ions qui disparaissent, avant puis après l’équivalence.' } },
    { id: 've', titre: 'Lire le volume équivalent', focus: ['graphique'],
      retenirTitre: 'À RETENIR : REMPLACER UN ION PAR UN AUTRE',
      retenir: <>
        <SvgRemplacerCarte/>
        <Ul>
          <li>Quand on verse la soude, un ion est remplacé par un autre : σ varie, pour chaque mole, de (λ de l’ion qui arrive) − (λ de l’ion qui part).</li>
          <li>Exemple de la simulation : avant l’équivalence, H₃O⁺ (35,0) est remplacé par Na⁺ (5,0), soit −30,0 ; après, HO⁻ (19,9) et Na⁺ (5,0) s’ajoutent, soit +24,9.</li>
          <li>Moyen de s’en souvenir : <strong>« un ion sort, un ion entre : la différence des λ décide »</strong>. Idée fausse : « plus on ajoute d’ions, plus σ augmente ». Vrai : avant l’équivalence, on ajoute Na⁺ mais on retire H₃O⁺, plus conducteur : σ baisse.</li>
        </Ul></>,
      texte: <>Le <strong>volume équivalent V<sub>E</sub></strong> est le volume de soude versé quand les réactifs sont dans les proportions de la réaction. Sur la courbe, c’est le point de rupture de pente : ici le minimum de σ. Le graphique est tracé jusqu’à 20 mL.</>,
      tache: { type: 'num', q: 'Volume équivalent V_E lu sur la courbe', unite: 'mL', vrai: 10.0, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Le volume équivalent est l’abscisse du point où la pente change : le minimum de σ.', 'On lit V_E = 10,0 mL (le minimum de σ est à environ 60 mS·m⁻¹).'],
        pieges: [[60, 'C’est la valeur de σ au minimum, en mS·m⁻¹ ; on demande son abscisse, un volume en mL.'], [20, 'C’est la fin du graphique ; le volume équivalent est l’abscisse du minimum de σ.'], [5, 'C’est le volume de l’étape « avant l’équivalence », pas l’abscisse du minimum.']],
        expl: 'Le minimum de σ est à V_E = 10,0 mL : les deux segments, l’un descendant, l’autre montant, se coupent en ce point.', indice: 'Cherchez l’abscisse (en mL) du point le plus bas de la courbe, là où la pente change de signe.' } },
    { id: 'conc', titre: 'Du volume équivalent à la concentration', focus: ['graphique'],
      retenirTitre: 'À RETENIR : DEUX SEGMENTS, UN POINT DE RUPTURE',
      retenir: <>
        <SvgCourbeVCarte/>
        <Ul>
          <li>La courbe σ = f(V) d’un titrage est formée de <strong>deux segments</strong> ; leur intersection, la rupture de pente, donne le volume équivalent V<sub>E</sub>.</li>
          <li>Exemple de la simulation : acide chlorhydrique et soude, un segment qui descend puis un segment qui monte, avec un minimum à l’équivalence.</li>
          <li>Moyen de s’en souvenir : <strong>« rupture de pente = équivalence »</strong>. Idée fausse : « à l’équivalence, σ vaut zéro ». Vrai : σ ne s’annule jamais, il reste les ions spectateurs Na⁺ et Cl⁻.</li>
        </Ul></>,
      texte: <>À l’équivalence, la quantité d’ions HO⁻ versés est égale à la quantité d’ions H₃O⁺ de la prise d’essai (la réaction est de un pour un). On a lu V<sub>E</sub> = 10,0 mL ; la soude est à c<sub>B</sub> = 0,100 mol/L et la prise d’essai d’acide est V<sub>A</sub> = 20,0 mL.</>,
      tache: { type: 'num', q: 'Concentration c_A de l’acide', unite: 'mol/L', vrai: 0.0500, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['À l’équivalence : c_A × V_A = c_B × V_E (quantités égales, réaction un pour un).', 'c_A = c_B × V_E / V_A = 0,100 × 10,0 / 20,0 = 0,0500 mol/L (les volumes sont dans la même unité).'],
        pieges: [[1.0, 'C’est c_B × V_E, une quantité de matière en mmol : divisez-la par V_A pour obtenir une concentration.'], [0.2, 'Le rapport est inversé : c_A = c_B × V_E / V_A, pas c_B × V_A / V_E.'], [0.005, 'Vous avez divisé par 200 mL : la quantité d’acide est dans la prise d’essai de 20,0 mL.'], [0.1, 'C’est la concentration de la soude ; on cherche celle de l’acide.']],
        expl: 'c_A = 0,100 × 10,0 / 20,0 = 0,0500 mol/L.', indice: 'Écrivez l’égalité des quantités c_A × V_A = c_B × V_E, puis isolez c_A.' } },
    { id: 'compo', titre: 'Composition après un ajout de soude', focus: ['scene'],
      retenirTitre: 'À RETENIR : DU VOLUME ÉQUIVALENT À LA CONCENTRATION',
      retenir: <>
        <SvgConcentrationCarte/>
        <Ul>
          <li>À l’équivalence, les réactifs sont dans les <strong>proportions de la réaction</strong> : {FConc}où V<sub>E</sub> est lu sur la courbe et V<sub>A</sub> est la prise d’essai.</li>
          <li>Exemple de la simulation : la soude versée à l’équivalence contient autant d’ions HO⁻ que la prise d’essai contient d’ions H₃O⁺.</li>
          <li>Moyen de s’en souvenir : <strong>« à l’équivalence, quantités égales »</strong>. Idée fausse : « à l’équivalence, c<sub>A</sub> = c<sub>B</sub> ». Vrai : ce sont les quantités qui sont égales, pas les concentrations (sauf si V<sub>E</sub> = V<sub>A</sub>).</li>
        </Ul></>,
      texte: <>On reprend la solution après l’ajout de V<sub>B</sub> = 15,0 mL de soude, soit après l’équivalence. On a trouvé c<sub>A</sub> = 0,0500 mol/L ; la prise d’essai est V<sub>A</sub> = 20,0 mL et c<sub>B</sub> = 0,100 mol/L. On considère la transformation comme totale.</>,
      tache: { type: 'num', q: 'Quantité d’ions HO⁻ restant dans le bécher', unite: 'mmol', vrai: 0.50, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['n(H₃O⁺) initial = c_A × V_A = 0,0500 × 20,0 = 1,00 mmol (mol/L × mL = mmol).', 'n(HO⁻) versé = c_B × V_B = 0,100 × 15,0 = 1,50 mmol.', 'La réaction consomme 1,00 mmol de chaque ion : il reste n(HO⁻) = 1,50 − 1,00 = 0,50 mmol, en excès car V_B > V_E.'],
        pieges: [[1.5, 'C’est la quantité de HO⁻ versée : une partie a réagi avec H₃O⁺.'], [1.0, 'C’est la quantité d’ions H₃O⁺ du départ ; il faut la retrancher à la quantité de HO⁻ versée.'], [2.5, 'Il faut retrancher la quantité d’ions H₃O⁺ consommés, pas l’ajouter.']],
        expl: 'n(HO⁻) restant = 0,100 × 15,0 − 0,0500 × 20,0 = 1,50 − 1,00 = 0,50 mmol.', indice: 'Comparez la quantité de HO⁻ versée (c_B × V_B) à celle de H₃O⁺ du départ (c_A × V_A) : la réaction les consomme à parts égales, un pour un.' } },
    { id: 'faible', titre: 'Et avec un acide faible ?', focus: ['graphique', 'scene'],
      texte: <>On recommence avec 20,0 mL d’acide éthanoïque CH₃COOH (acide faible), même concentration, titré par la même soude. La réaction s’écrit en haut de l’écran. L’acide faible est surtout sous forme de molécules (rectangles gris) ; on donne λ(CH₃COO⁻)&nbsp;=&nbsp;4,1 mS·m²·mol⁻¹.</>,
      tache: { type: 'qcm', q: 'Pourquoi σ augmente-t-il dès le début, alors qu’il diminuait avec l’acide chlorhydrique ?', ...Q.faible,
        expl: 'L’acide éthanoïque est surtout en molécules : il y a très peu d’ions H₃O⁺ à consommer. Chaque ion HO⁻ versé transforme une molécule en un ion CH₃COO⁻ (λ = 4,1) et amène un ion Na⁺ (λ = 5,0) : le nombre d’ions augmente, donc σ aussi. Après l’équivalence, HO⁻ (19,9) s’accumule : la pente augmente nettement.',
        indice: 'Combien d’ions H₃O⁺ y a-t-il au départ dans une solution d’acide faible ? Quels ions apparaissent quand HO⁻ réagit avec CH₃COOH ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : ACIDE FORT, ACIDE FAIBLE',
      retenir: <>
        <SvgFaibleCarte/>
        <Ul>
          <li><strong>Acide fort</strong> : la courbe est en V (σ baisse puis monte). <strong>Acide faible</strong> : σ monte dès le début, avec une pente plus forte après l’équivalence. Dans les deux cas, la rupture de pente repère V<sub>E</sub>.</li>
          <li>Exemple de la simulation : <span style={{ whiteSpace: 'nowrap' }}>CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O</span> fabrique des ions CH₃COO⁻ (4,1) et Na⁺ (5,0) sans consommer de H₃O⁺ en quantité notable.</li>
          <li>Moyen de s’en souvenir : <strong>« acide faible : peu d’ions au départ, on en fabrique »</strong>. Idée fausse : « un acide faible conduit mieux qu’un acide fort ». Vrai : il contient peu d’ions H₃O⁺, donc σ est faible au départ.</li>
        </Ul></>,
      texte: <>Vous savez prévoir la conductivité d’une solution avec la loi de Kohlrausch, justifier l’allure d’une courbe de titrage conductimétrique avec les conductivités ioniques molaires, repérer le volume équivalent par la rupture de pente et en déduire une concentration. Passez à l’exploration (trois acides, cinq concentrations, volume d’eau) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'conc' ? { type: 'conc', ...M.tirageDefiConc(), reps: { c: '' }, verifie: false } : { type: 'sigma', ...M.tirageDefiSigma(), reps: { s: '' }, verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const procheTol = (x, v, t) => isFinite(x) && Math.abs(x - v) <= t * v;
  const verifier = () => {
    if (defi.type === 'conc') { const ok = procheTol(lireNombre(defi.reps.c), defi.cA, 0.08); setDefi(d => ({ ...d, verifie: true, ok })); noterC(ok); }
    else { const ok = procheTol(lireNombre(defi.reps.s), defi.sigma, 0.06); setDefi(d => ({ ...d, verifie: true, ok })); noterS(ok); }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, nom, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{avecIndices(nom)} =</span>
      <input value={defi.reps[cle]} aria-label={nom} onKeyDown={e => e.key === 'Enter' && document.getElementById('cd-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>{unite && <span>{unite}</span>}
    </div>);
  const qdef = dd && dd.type === 'sigma' ? M.quantites({ analyte: dd.analyte, cA: dd.cA, VB: dd.VB }) : null;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['conc', 'Concentration d’un acide'], ['sigma', 'Conductivité prévue']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'conc' ? 'Défi : quelle est la concentration de l’acide ?' : 'Défi : quelle conductivité en cours de titrage ?'}</div>
      {defi.type === 'conc' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>On titre <strong>{nbf(defi.VA, 1)}{NB}mL</strong> d’<strong>{M.ANALYTES[defi.analyte].nom}</strong>, de concentration c<sub>A</sub> inconnue, dilués dans 180 mL d’eau, par la soude à c<sub>B</sub> = <strong>0,100{NB}mol/L</strong>. Le graphique donne les mesures de conductivité tous les 1 mL. Déterminez c<sub>A</sub> (marge acceptée : 8{NB}% de la valeur).</div>
        {champ('c', 'c_A', 'mol/L')}
        <IndiceDefi cache={false}>Prolongez les deux segments de la courbe : leur intersection donne le volume équivalent V<sub>E</sub>. Puis c<sub>A</sub> = c<sub>B</sub> × V<sub>E</sub> / V<sub>A</sub>, avec V<sub>E</sub> et V<sub>A</sub> dans la même unité.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On titre <strong>{nbf(defi.VA, 1)}{NB}mL</strong> d’<strong>{M.ANALYTES[defi.analyte].nom}</strong> à <strong>{nbf(defi.cA, 3)}{NB}mol/L</strong>, dilués dans 180 mL d’eau (volume de départ : 200 mL), par la soude à <strong>0,100{NB}mol/L</strong>. Le volume total est 200 mL + V<sub>B</sub>. On a versé V<sub>B</sub> = <strong>{nbf(defi.VB, 1)}{NB}mL</strong>. Calculez la conductivité σ à 3 chiffres significatifs (transformation totale ; marge acceptée : 6{NB}% de la valeur ; λ dans le tableau de données).</div>
        {champ('s', 'σ', 'mS·m⁻¹')}
        <IndiceDefi cache={false}>Calculez les quantités de matière en mmol : n(H₃O⁺) = c<sub>A</sub> × V<sub>A</sub> consommé par n(HO⁻) = c<sub>B</sub> × V<sub>B</sub>, puis ce qui reste de l’un ou de l’autre, plus n(Na⁺) = c<sub>B</sub> × V<sub>B</sub> et n(anion) = c<sub>A</sub> × V<sub>A</sub>. Ensuite σ = 1 000 × Σ λ × n / V<sub>total</sub> (n en mmol, V en mL, σ en mS·m⁻¹).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="cd-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'conc'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `La rupture de pente est à V_E = ${nbf(defi.VE, 1)} mL, donc c_A = 0,100 × ${nbf(defi.VE, 1)} / ${nbf(defi.VA, 1)} = ${nbf(defi.cA, 3)} mol/L (marge acceptée : 8 % de la valeur).`
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `n(H₃O⁺) = ${nbf(qdef.nA, 2)} mmol, n(HO⁻) versé = ${nbf(qdef.nB, 2)} mmol : il reste ${qdef.nH > 0 ? `${nbf(qdef.nH, 2)} mmol de H₃O⁺` : `${nbf(qdef.nHO, 2)} mmol de HO⁻`}, avec ${nbf(qdef.nNa, 2)} mmol de Na⁺ et ${nbf(qdef.nAnion, 2)} mmol de ${M.IONS[M.ANALYTES[dd.analyte].anion].f}. Volume total ${nbf(200 + dd.VB, 1)} mL, donc σ = ${nbf(dd.sigmaTot, 1)} mS·m⁻¹ (marge acceptée : 6 % de la valeur).`}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> ; les conductivités ioniques molaires λ sont des valeurs usuelles arrondies au dixième, données du problème (non à retrouver) et supposées constantes.</li>
      <li><strong>Loi de Kohlrausch</strong> : σ = Σ λ × c, valable pour une solution <strong>diluée</strong> (concentrations des ions inférieures à environ 10 mol·m⁻³, soit 1,0×10⁻² mol/L) ; au-delà, les interactions entre ions font s’écarter σ de la somme des contributions. La simulation signale quand ce domaine est dépassé.</li>
      <li><strong>Activités ≈ concentrations</strong> ; volumes additifs : le volume total est la somme du volume de départ et du volume de soude versé, donc la <strong>dilution est prise en compte</strong> (les segments de la courbe sont presque droits, pas exactement).</li>
      <li><strong>Titrage rapide et idéal</strong> : réaction de titrage supposée totale dans le parcours (programme). Pour dessiner la courbe, la composition est calculée exactement (conservation de la charge, pK<sub>A</sub>(CH₃COOH / CH₃COO⁻) = 4,8, K<sub>e</sub> = 10⁻¹⁴) : H₃O⁺ et HO⁻ sont comptés, ce qui arrondit un peu la courbe autour de l’équivalence, surtout pour l’acide faible.</li>
      <li><strong>Acide titré par la soude</strong> à 0,100 mol/L, prise d’essai de 20,0 mL ; trois acides (chlorhydrique, nitrique, éthanoïque) ; les ions du sel (Na⁺ et l’anion de l’acide) sont des ions spectateurs.</li>
      <li><strong>Conductimètre idéal</strong> : la cellule est étalonnée, elle affiche directement σ en mS·m⁻¹ (1 mS·cm⁻¹ = 100 mS·m⁻¹) ; mesures sans bruit.</li>
      <li><strong>Schéma des ions</strong> : un point représente une même quantité de matière ; les tailles sont symboliques (Na⁺ est dessiné plus petit que H₃O⁺, les anions plus gros) pour distinguer les ions sans compter sur la couleur ; le dessin n’est pas à l’échelle et ne montre pas l’agitation des ions.</li>
      <li><strong>Limites</strong> : pas de courbe d’étalonnage (mesure d’une conductance et constante de cellule), pas de précipité ni de titrage redox, pas de variation de la température pendant le titrage.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, équation, données ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const lectureCond = (() => {
    if (enSel) return null;
    if (enExplore || enGuide) return `${nbf(sigma, sigma >= 100 ? 0 : 1)} mS/m`;
    return null;
  })();
  const nacl = enSel && idE !== 'acide';
  const ptsSel = nacl ? { Na: 8, anion: 8 } : { H3O: 8, anion: 8 };
  const titreScene = enSel ? (nacl ? 'Solution de chlorure de sodium' : 'Solution d’acide chlorhydrique') : '';
  const montrerCell = !enGuide || deja('kohl');
  const boxScene = !dd && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {!enSel && <div style={{ marginBottom: 6, ...cadre('equation') }}><LigneEquation analyte={analyte}/></div>}
      {enExplore && <div style={aide}>Le bécher contient l’acide ; on y verse la soude de la burette. Les points sont des ions (un point = une même quantité de matière) ; le conductimètre donne σ.</div>}
      <SceneConductimetrie points={enSel ? ptsSel : pointsTit} anionId={enSel ? 'Cl' : an.anion} lecture={lectureCond} cellule={montrerCell} burette={enSel ? null : { VB }} titre={titreScene}
        legende={enSel ? (nacl ? ['Na', 'anion'] : ['H3O', 'anion']) : analyte === 'eth' ? ['acide', 'H3O', 'Na', 'HO', 'anion'] : ['H3O', 'HO', 'Na', 'anion']}
        acideLegende="CH₃COOH"/>
    </div>);
  const lignesLambda = (() => {
    const base = ['H3O', 'HO', 'Na'];
    if (enGuide) return [...base, 'Cl', ...(deja('faible') ? ['AcO'] : [])];
    if (dd) return [...base, M.ANALYTES[dd.analyte].anion];
    return [...base, an.anion];
  })();
  const tableLambda = (
    <div style={{ ...styleBoite, ...cadre('donnees') }}>
      <div style={titreCarte}>Données : conductivités ioniques molaires λ</div>
      <div style={aide}>En mS·m²·mol⁻¹, à 25 °C.</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>
        {lignesLambda.map(k => <span key={k} style={{ whiteSpace: 'nowrap' }}>λ({M.IONS[k].f}) = <strong>{nbf(M.IONS[k].lambda, 1)}</strong></span>)}
      </div>
    </div>);
  const boxDonnees = enGuide && deja('lambda') ? tableLambda : null;

  // ---------- graphique et contributions ----------
  const boxGraph = !dd && !enSel && deja('avant') && (
    <div style={{ ...styleBoite, ...cadre('graphique') }}>
      <div style={titreCarte}>Conductivité en fonction du volume de soude versé</div>
      {enExplore && <div style={aide}>La courbe se lit de gauche à droite. Le point rouge est le volume versé choisi ; le trait orange pointillé marque l’équivalence.</div>}
      <GraphiqueConductivite trace={trace} marqueur={{ VB, sigma }} VE={apres('ve') ? VE : null} yMax={yMax} titre="Titrage conductimétrique"/>
    </div>);
  const sectionBarres = (
    <BarresContribution contributions={contribs} sigma={sigma}/>);
  const boxBarres = !dd && !enSel && enGuide && deja('avant') && (
    <div style={{ ...styleBoite, ...cadre('contrib') }}>
      <div style={titreCarte}>Part de chaque ion dans σ</div>
      {sectionBarres}
    </div>);
  const sectionContrib = enExplore && (
    <Section titre={<span><span style={{ display: 'block' }}>Part de chaque ion dans σ</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>σ = {nbf(sigma, 1)}{NB}mS·m⁻¹ au volume choisi</span></span>} ouvert={ouv.contrib} onBascule={() => setOuv(o => ({ ...o, contrib: !o.contrib }))}>
      <div style={aide}>Chaque barre est la contribution λ × c d’un ion. Leur somme est σ (loi de Kohlrausch).</div>
      {sectionBarres}
    </Section>);
  const sectionLambda = enExplore && (
    <Section titre="Données : conductivités ioniques molaires" ouvert={ouv.lambda} onBascule={() => setOuv(o => ({ ...o, lambda: !o.lambda }))}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>
        {lignesLambda.map(k => <span key={k} style={{ whiteSpace: 'nowrap' }}>λ({M.IONS[k].f}) = <strong>{nbf(M.IONS[k].lambda, 1)}</strong></span>)}
      </div>
      <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>En mS·m²·mol⁻¹, à 25 °C.</div>
    </Section>);

  // ---------- défi : graphique des mesures ----------
  const boxDefiGraph = dd && dd.type === 'conc' && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures de conductivité</div>
      <GraphiqueConductivite mesures={dd.pts} yMax={yMaxDe(Math.max(...dd.pts.map(p => p.sigma)))} titre="Mesures du titrage"/>
      <Section titre="Voir les valeurs mesurées" ouvert={ouv.mesures} onBascule={() => setOuv(o => ({ ...o, mesures: !o.mesures }))}>
        {[0, 7, 14].map(d => (
          <table key={d} style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', marginBottom: 6, fontFamily: 'monospace' }}><tbody>
            <tr><td style={{ padding: '2px 4px', color: KIT.txt2 }}>V (mL)</td>{dd.pts.slice(d, d + 7).map(p => <td key={p.VB} style={{ padding: '2px 4px', textAlign: 'right' }}>{p.VB}</td>)}</tr>
            <tr><td style={{ padding: '2px 4px', color: KIT.txt2 }}>σ</td>{dd.pts.slice(d, d + 7).map(p => <td key={p.VB} style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>{nbf(p.sigma, 1)}</td>)}</tr></tbody></table>))}
        <div style={{ ...aide, marginBottom: 0 }}>σ en mS·m⁻¹.</div>
      </Section>
    </div>);
  const boxDefiEq = dd && (
    <div style={styleBoite}><LigneEquation analyte={dd.analyte}/></div>);
  const boxDefiDonnees = dd && dd.type === 'sigma' && tableLambda;

  // ---------- réglages (exploration) ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages de l’expérience</div>
      <div style={aide}>Choisissez l’acide à titrer et sa concentration, puis versez la soude avec le curseur : le graphique et la conductivité se mettent à jour.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Acide titré
        <select value={ti.an} onChange={e => setT({ an: e.target.value })} style={{ ...menu, marginTop: 2 }}>
          {M.ORDRE_ANALYTES.map(id => <option key={id} value={id}>{M.ANALYTES[id].nom} ({M.ANALYTES[id].formule})</option>)}
        </select>
      </label>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Concentration de l’acide
        <select value={ti.cA} onChange={e => setT({ cA: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>
          {M.CONC_A.map(c => <option key={c} value={c}>{nbf(c, 3)} mol/L</option>)}
        </select>
      </label>
      <Curseur nom="Volume de soude versé" valeur={ti.VB} onChange={v => setT({ VB: Math.round(v * 2) / 2 })} min={0} max={M.V_BURETTE} pas={0.5} unite="mL" decimales={1}/>
      <Section titre={<span><span style={{ display: 'block' }}>Réglages fins</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>prise d’essai {nbf(M.VA0, 1)}{NB}mL + eau {ti.eau}{NB}mL</span></span>} ouvert={ouv.fins} onBascule={() => setOuv(o => ({ ...o, fins: !o.fins }))}>
        <div style={aide}>L’eau ajoutée dilue l’acide : sans eau, la solution est trop concentrée pour la loi de Kohlrausch et les segments se courbent.</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2 }}>Eau ajoutée avant le titrage
          <select value={ti.eau} onChange={e => setT({ eau: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>
            {M.EAU.map(e => <option key={e} value={e}>{e === 0 ? 'aucune' : `${e} mL`} ({M.VA0 + e} mL en tout)</option>)}
          </select>
        </label>
      </Section>
    </div>);

  // ---------- mesures ----------
  const mesures = !dd && !enSel && enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <div style={aide}>Valeurs calculées pour les réglages et le volume de soude choisis.</div>
      <LigneMesure nom="Conductivité σ" valeur={`${nbf(sigma, 1)}${NB}mS·m⁻¹`} couleur={COL.bleu}/>
      <LigneMesure nom="Pente (mS·m⁻¹ par mL)" valeur={nbf(pen, 1)} couleur={pen < 0 ? COL.rouge : COL.vert}/>
      <LigneMesure nom="Volume total" valeur={`${nbf(comp.Vt, 1)}${NB}mL`}/>
      <LigneMesure nom="Volume équivalent" valeur={`${nbf(VE, 1)}${NB}mL`} couleur={COL.orange}/>
      <LigneMesure nom="Plus grande concentration d’ion" valeur={`${nbf(concMax, 1)}${NB}mol·m⁻³`}/>
      {concMax > 10 && <div style={{ fontSize: 13.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>Au-delà d’environ 10 mol·m⁻³, la loi de Kohlrausch n’est plus valable : σ affiché est trop élevé.</div>}
    </div>);

  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avec l’acide chlorhydrique, versez la soude de 0 à 20 mL : où la pente change-t-elle de signe ? Comparez avec le volume équivalent indiqué dans les mesures.</li>
        <li>Remplacez l’acide chlorhydrique par l’acide nitrique : la courbe change-t-elle beaucoup ? Comparez λ(Cl⁻) et λ(NO₃⁻).</li>
        <li>Choisissez l’acide éthanoïque : pourquoi σ est-elle si faible au départ, et pourquoi la pente augmente-t-elle après l’équivalence ?</li>
        <li>Doublez la concentration de l’acide : que devient le volume équivalent ? Et la valeur de σ au départ ?</li>
        <li>Réglez « Eau ajoutée » sur « aucune » : que devient la courbe ? Quel message apparaît dans les mesures, et pourquoi ?</li>
        <li>Ouvrez « Part de chaque ion dans σ » avant, à et après l’équivalence : quel ion domine à chaque étape ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>σ = Σ λ × c : chaque ion contribue selon son λ (c en mol·m⁻³ ; 1 mol/L = 1 000 mol·m⁻³)</li>
          <li>H₃O⁺ (35,0) et HO⁻ (19,9) conduisent beaucoup mieux que les autres ions (de 4 à 8)</li>
          <li>Avant l’équivalence (acide fort), H₃O⁺ est remplacé par Na⁺ : σ diminue ; après, HO⁻ et Na⁺ s’accumulent : σ augmente</li>
          <li>La rupture de pente repère le volume équivalent V<sub>E</sub> ; {avecIndices('c_A = c_B × V_E / V_A')}</li>
          <li>Acide faible : σ monte dès le début, avec une pente plus forte après l’équivalence</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cd-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cd-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cd-col { display: flex; flex-direction: column; gap: 12px; }
        .cd-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .cd-l1.cote .cd-carte { order: 2; } .cd-l1.cote .cd-main { order: 1; }
          .cd-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .cd-ex > * { grid-column: 1; } .cd-ex > .cd-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .cd-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .cd-in { animation: cd-fondu 0.35s ease-out; } @keyframes cd-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Conductimétrie : conductivité d’une solution et titrage</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Chaque ion apporte à la <strong>conductivité</strong> une part qui dépend de son λ. Pendant un titrage, un ion est remplacé par un autre : la <strong>pente</strong> change, et la rupture de pente repère l’<strong>équivalence</strong>.</div>
      {!enExplore && <div className="cd-l1 cote">
        {enGuide ? <div className="cd-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="cd-carte">{panneauHypo}</div> : null}
        <div className="cd-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'conc' ? suiviC : suiviS}/></div>}
          {dd && <div className="cd-col">{boxDefiEq}{boxDefiGraph}{boxDefiDonnees}</div>}
          {!dd && <div className="cd-col">
            <div className="cd-in">{boxScene}</div>
            {boxDonnees && <div className="cd-in">{boxDonnees}</div>}
            {boxBarres && <div className="cd-in">{boxBarres}</div>}
            {boxGraph && <div className="cd-in">{boxGraph}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <div className="cd-ex">
        <div>{boxScene}</div>
        <div className="cd-ctrl">{reglages}</div>
        <div>{boxGraph}</div>
        <div>{mesures}</div>
        <div>{sectionContrib}</div>
        <div>{sectionLambda}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
