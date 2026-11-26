import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./conductimetrieTstlModele";
import { QCM_PARCOURS as Q } from "./conductimetrieTstlQcm";
import { SceneTitrage, GraphiqueTitrage, BarresContributionAg, SvgPrecipCarte, SvgAvantAgCarte, SvgApresAgCarte, SvgCoudeAgCarte, SvgEquivAgCarte } from "./conductimetrieTstlSchemas";

const SIM_ID = 255, CLE_GUIDE = 'titrage-precipitation-tstl-guide-v1';
declarerDefis(SIM_ID, [['conc', 'Concentration en chlorure à partir de la courbe'], ['sigma', 'Conductivité prévue en cours de titrage']]);

// ====================================================
// SIM 255 — TITRAGE CONDUCTIMÉTRIQUE PAR PRÉCIPITATION (TSTL SPCL, chapitre « Conductivité et titrages conductimétriques »).
//  Une seule idée : on dose les ions chlorure par des ions argent ; le précipité sort de la solution, et la courbe σ = f(V) est faite de deux droites dont l'intersection donne V_E.
//  Capacités visées (jamais affichées à l'élève) : exploiter la loi de Kohlrausch ; justifier l'allure d'une courbe de titrage conductimétrique avec les conductivités ioniques molaires ;
//  repérer l'équivalence par la rupture de pente (méthode des deux droites) ; exploiter la relation à l'équivalence pour déterminer une concentration.
//  Modèle : conductimetrieTstlModele.js. Situation originale (eau salée) : aucune situation, valeur ni question du Moodle n'est reprise.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#7c3aed' };
const PRESET = { cation: 'Na', cA: 0.040, VB: 8, eau: 180, dilution: false };
// parcours : échantillon A (connu, étapes 1 à 8) puis échantillon B (concentration inconnue, étapes 9 à 13)
const CA_A = 0.040, CA_B = 0.030;
const IDS = ['equation', 'sigma0', 'tableau', 'avant', 'equiv', 'apres', 'pente', 'eau', 'lecture', 'droites', 'conc', 'sel', 'bilan'];
const SC_VB = { equation: 8, sigma0: 0, tableau: 8, avant: 8, equiv: 16, apres: 22, pente: 22, eau: 22, lecture: 0, droites: 0, conc: 0, sel: 0, bilan: 0 };
const SC_VMAX = { equation: 0, sigma0: 0, tableau: 0, avant: 8, equiv: 16, apres: 22, pente: 22, eau: 22, lecture: 25, droites: 25, conc: 25, sel: 25, bilan: 25 };
const yMaxDe = m => { const s = m <= 120 ? 20 : m <= 300 ? 50 : 100; return Math.ceil(m * 1.05 / s) * s; };
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- formules (MathML) ----------
const FKohl = <Formule><mi>σ</mi><mo>=</mo><munder><mo>∑</mo><mi>i</mi></munder><msub><mi>λ</mi><mi>i</mi></msub><mo>×</mo><msub><mi>c</mi><mi>i</mi></msub></Formule>;
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const EQ = 'Ag⁺ + Cl⁻ → AgCl(s)';

// ====================================================
export function SimulationTitragePrecipitation() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviS, noterS] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('conc');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [vueTP, setVueTP] = useState(false);
  const [ouv, setOuv] = useState({ contrib: false, lambda: false, fins: false, essayer: false, retenir: false, mesures: false });
  const [ti, setTi] = useState(PRESET);
  const [reduit] = useState(mouvementReduit);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);
  const echB = enGuide && deja('lecture');

  // ---------- situation affichée ----------
  const cation = enGuide ? 'Na' : ti.cation;
  const cA = enGuide ? (echB ? CA_B : CA_A) : ti.cA, eau = enGuide ? 180 : ti.eau, dilution = enGuide ? false : ti.dilution;
  const VB = enGuide ? (SC_VB[idE] ?? 0) : ti.VB;
  const P = { cation, cA, eau, dilution };
  const comp = M.composition({ ...P, VB }), sigma = M.kohlrausch(comp.c);
  const VE = M.volumeEquivalent(cA);
  const full = M.courbe(P, M.V_BURETTE, 0.25);
  const yMax = yMaxDe(Math.max(...full.map(p => p.sigma)));
  const vmax = enGuide ? (SC_VMAX[idE] ?? 0) : M.V_BURETTE;
  const trace = full.filter(p => p.VB <= vmax + 1e-9);
  const contribs = [[cation, M.IONS[cation].f], ['Cl', 'Cl⁻'], ['NO3', 'NO₃⁻'], ['Ag', 'Ag⁺']].map(([id, f]) => ({ id, f, couleur: M.IONS[id].couleur, v: M.IONS[id].lambda * comp.c[id] }));
  const tpOn = enGuide ? idE === 'droites' : (enExplore && vueTP);
  const tp = tpOn ? { res: M.deuxDroites(M.pointsMesures({ cation, cA, eau }, 1), VE) } : null;
  const pen = M.pente(P, VB);
  const concMax = Math.max(...['Na', 'K', 'Cl', 'NO3', 'Ag'].map(k => comp.c[k] || 0));
  const VEaff = enGuide ? (echB ? apres('lecture') : deja('equiv')) : true;

  // ---------- étapes ----------
  const ETAPES = [
    { id: 'equation', titre: 'Une réaction qui forme un solide', focus: ['becher', 'burette'],
      texte: <>Pour doser les ions chlorure Cl⁻ d’une eau salée, on verse avec la burette une solution de nitrate d’argent (ions Ag⁺ et NO₃⁻) de concentration c(Ag⁺)&nbsp;=&nbsp;5,0×10⁻²&nbsp;mol/L dans une prise d’essai de 20,0&nbsp;mL de cette eau. Les Cl⁻ sont accompagnés d’ions sodium Na⁺ : l’eau contient du chlorure de sodium. L’équation de la réaction de titrage est écrite en haut du schéma : il se forme un solide blanc, AgCl(s), le <strong>précipité</strong>, qui tombe au fond (grains blancs). Sur le schéma, chaque point est un ion (le + ou le − rappelle sa charge) ; le conductimètre n’est pas encore branché.</>,
      tache: { type: 'qcm', q: 'Quels ions ne participent pas à la réaction de titrage (ions spectateurs) ?', ...Q.equation,
        expl: 'La réaction Ag⁺ + Cl⁻ → AgCl(s) consomme seulement Ag⁺ et Cl⁻. Les ions Na⁺ (de l’eau salée) et NO₃⁻ (du nitrate d’argent) ne réagissent pas : ils restent dissous.',
        indice: 'Lisez l’équation de la réaction : quels ions y figurent ? Ceux qui n’y figurent pas sont spectateurs.' } },
    { id: 'sigma0', titre: 'La conductivité au départ', focus: ['becher', 'cellule', 'lecture', 'donnees'],
      texte: <>On ajoute 180&nbsp;mL d’eau à la prise d’essai : le bécher contient 200&nbsp;mL de solution, avec [Na⁺]&nbsp;=&nbsp;[Cl⁻]&nbsp;=&nbsp;4,0×10⁻³&nbsp;mol/L (la notation [X] désigne la concentration de l’ion X). Une cellule plongée dans la solution est reliée à un <strong>conductimètre</strong>, dont l’affichage est masqué. La conductivité σ est la somme des contributions des ions : {FKohl}avec c en mol·m⁻³ (1 mol/L = 1 000 mol·m⁻³) et λ la conductivité ionique molaire de l’ion, en mS·m²·mol⁻¹. Données : λ(Na⁺)&nbsp;=&nbsp;5,0 et λ(Cl⁻)&nbsp;=&nbsp;7,6.</>,
      tache: { type: 'num', q: 'Conductivité σ de la solution avant le titrage', unite: 'mS·m⁻¹', vrai: 50.4, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['[Na⁺] = [Cl⁻] = 4,0×10⁻³ mol/L = 4,0 mol·m⁻³ (× 1 000).', 'σ = λ(Na⁺) × [Na⁺] + λ(Cl⁻) × [Cl⁻] = 5,0 × 4,0 + 7,6 × 4,0 = 20 + 30,4 = 50,4 mS·m⁻¹.'],
        pieges: [[0.0504, 'Vous avez gardé c en mol/L : convertissez-la en mol·m⁻³ (× 1 000) avant d’appliquer la loi.'], [20, 'Il manque la contribution de Cl⁻ : les deux ions contribuent à σ.'], [30.4, 'Il manque la contribution de Na⁺ : les deux ions contribuent à σ.'], [5.04, 'Il faut c en mol·m⁻³ : 4,0×10⁻³ mol/L = 4,0 mol·m⁻³, pas 0,40.']],
        expl: 'σ = (5,0 + 7,6) × 4,0 = 50,4 mS·m⁻¹, soit environ 50 mS·m⁻¹.', indice: 'Convertissez d’abord c en mol·m⁻³. Les deux ions ont la même concentration : additionnez λ × c pour Na⁺ et λ × c pour Cl⁻.' } },
    { id: 'tableau', titre: 'Ce qui reste après un ajout', focus: ['becher', 'burette'],
      texte: <>On a versé V&nbsp;=&nbsp;8,0&nbsp;mL de nitrate d’argent. Le bécher contenait au départ n(Cl⁻)&nbsp;=&nbsp;0,80&nbsp;mmol (4,0×10⁻³ mol/L × 200 mL). La réaction consomme Ag⁺ et Cl⁻ à raison de un pour un, et on la suppose <strong>totale</strong> : tout l’argent versé précipite tant qu’il reste des Cl⁻.</>,
      tache: { type: 'num', q: 'Quantité d’ions Cl⁻ restant dans le bécher', unite: 'mmol', vrai: 0.40, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['n(Ag⁺) versé = c(Ag⁺) × V = 0,050 × 8,0 = 0,40 mmol (mol/L × mL = mmol).', 'Chaque Ag⁺ fait précipiter un Cl⁻ : il reste n(Cl⁻) = 0,80 − 0,40 = 0,40 mmol.'],
        pieges: [[0.80, 'C’est la quantité de départ : une partie des Cl⁻ a déjà précipité avec les Ag⁺ versés.'], [0.40 * 3, 'Il faut retrancher la quantité d’Ag⁺ versée à celle de Cl⁻ du départ, pas l’ajouter.'], [0.050, 'Vous avez divisé au lieu de multiplier : n = c × V, en mmol pour c en mol/L et V en mL.']],
        expl: 'n(Cl⁻) restant = 0,80 − 0,050 × 8,0 = 0,40 mmol.', indice: 'Calculez la quantité d’Ag⁺ versée (c × V), puis retranchez-la à la quantité de Cl⁻ du départ : un Ag⁺ fait précipiter un Cl⁻.' } },
    { id: 'avant', titre: 'Avant l’équivalence : σ varie peu', focus: ['graphique', 'lecture'],
      retenirTitre: 'À retenir : le précipité sort du jeu',
      retenir: <>
        <SvgPrecipCarte/>
        <Ul>
          <li>Une <strong>précipitation</strong> forme un solide, ici AgCl(s) : {EQ}. Les ions qui précipitent quittent la solution, et le solide ne transporte pas de courant.</li>
          <li>Exemple de la simulation : les Ag⁺ de la burette et les Cl⁻ du bécher disparaissent ; Na⁺ et NO₃⁻ restent dissous et continuent de conduire.</li>
          <li>Moyen de s’en souvenir : <strong>« le solide sort du jeu, les spectateurs restent »</strong>. Idée fausse : « le précipité conduit le courant ». Vrai : seuls les ions dissous conduisent.</li>
        </Ul></>,
      texte: <>On a toujours versé 8,0&nbsp;mL : le conductimètre affiche maintenant σ, et le graphique trace σ en fonction du volume de nitrate d’argent versé. Le nitrate d’argent apporte des ions nitrate NO₃⁻. Données : λ(Cl⁻)&nbsp;=&nbsp;7,6 et λ(NO₃⁻)&nbsp;=&nbsp;7,1&nbsp;mS·m²·mol⁻¹.</>,
      tache: { type: 'qcm', q: 'Avant l’équivalence, pourquoi σ varie-t-elle très peu quand on verse le nitrate d’argent ?', ...Q.avant,
        expl: 'Chaque Cl⁻ qui précipite disparaît (7,6) et un NO₃⁻ versé le remplace (7,1) : la variation par mole versée est 7,1 − 7,6 = −0,5, presque nulle. Les ions Na⁺ ne changent pas, et la dilution est faible : la courbe est presque horizontale, avec une très légère baisse.',
        indice: 'Quels ions disparaissent, quels ions apparaissent quand on verse un peu de nitrate d’argent ? Comparez leurs λ.' } },
    { id: 'equiv', titre: 'À l’équivalence, σ n’est pas nulle', focus: ['becher', 'lecture'],
      texte: <>On a versé 16,0&nbsp;mL : tous les ions Cl⁻ viennent de précipiter, il n’y a pas encore d’Ag⁺ en excès. On dit que l’<strong>équivalence</strong> est atteinte : les réactifs ont été introduits dans les proportions de la réaction. Regardez le bécher et le conductimètre.</>,
      tache: { type: 'qcm', q: 'À l’équivalence, la conductivité n’est pas nulle. Pourquoi ?', ...Q.equiv,
        expl: 'À l’équivalence, il ne reste ni Cl⁻ ni Ag⁺ dans la solution, mais les ions spectateurs Na⁺ et NO₃⁻ sont toujours là, dissous : ils conduisent le courant. Le précipité AgCl(s), lui, ne conduit pas.',
        indice: 'Quels ions sont encore dissous dans le bécher à l’équivalence ? Participent-ils à la réaction ?' } },
    { id: 'apres', titre: 'Après l’équivalence : σ remonte', focus: ['graphique', 'becher'],
      retenirTitre: 'À retenir : on change de monnaie, pas de valeur',
      retenir: <>
        <SvgAvantAgCarte/>
        <Ul>
          <li>Avant l’équivalence, chaque Cl⁻ qui précipite est <strong>remplacé par un NO₃⁻</strong> : σ varie, par mole versée, de λ(NO₃⁻) − λ(Cl⁻).</li>
          <li>Exemple de la simulation : 7,1 − 7,6 = −0,5, presque nul : la courbe est presque horizontale (légère baisse).</li>
          <li>Moyen de s’en souvenir : <strong>« on change de monnaie, pas de valeur »</strong>. Idée fausse : « σ doit beaucoup baisser puisque les Cl⁻ disparaissent ». Vrai : un autre ion, presque aussi conducteur, prend leur place.</li>
        </Ul></>,
      texte: <>On a versé 22,0&nbsp;mL, soit au-delà de l’équivalence. La courbe est passée par un minimum, puis elle remonte. Observez les ions dans le bécher : il n’y a plus de Cl⁻, mais des Ag⁺ apparaissent.</>,
      tache: { type: 'qcm', q: 'Après l’équivalence, pourquoi σ augmente-t-elle nettement ?', ...Q.apres,
        expl: 'Quand tous les Cl⁻ ont précipité, les Ag⁺ versés n’ont plus rien à faire précipiter : ils restent dissous, avec les NO₃⁻ qui les accompagnent. Ces deux ions s’accumulent dans la solution et σ augmente.',
        indice: 'Après l’équivalence, que devient chaque Ag⁺ que l’on verse ? Peut-il encore précipiter ?' } },
    { id: 'pente', titre: 'Une pente bien plus forte après', focus: ['graphique'],
      texte: <>Le graphique est tracé jusqu’à 22&nbsp;mL : la courbe monte nettement après l’équivalence, alors qu’elle était presque plate avant. Rappel des conductivités ioniques molaires : λ(Cl⁻)&nbsp;=&nbsp;7,6 ; λ(NO₃⁻)&nbsp;=&nbsp;7,1 ; λ(Ag⁺)&nbsp;=&nbsp;6,2&nbsp;mS·m²·mol⁻¹.</>,
      tache: { type: 'qcm', q: 'Quelle comparaison explique cette différence de pente ?', ...Q.pente,
        expl: 'Avant l’équivalence, chaque mole d’Ag⁺ versée fait disparaître un Cl⁻ (7,6) et arriver un NO₃⁻ (7,1) : variation de 7,1 − 7,6 = −0,5. Après, chaque mole versée ajoute Ag⁺ (6,2) et NO₃⁻ (7,1) sans rien retirer : variation de +13,3. La pente est environ 27 fois plus grande en valeur absolue.',
        indice: 'Pour chaque mole d’Ag⁺ versée, additionnez les λ des ions qui apparaissent et retranchez ceux des ions qui disparaissent, avant puis après l’équivalence.' } },
    { id: 'eau', titre: 'Pourquoi ajouter de l’eau ?', focus: ['graphique'],
      retenirTitre: 'À retenir : ça s’accumule',
      retenir: <>
        <SvgApresAgCarte/>
        <Ul>
          <li>Après l’équivalence, <strong>plus rien ne précipite</strong> : les Ag⁺ et les NO₃⁻ versés s’accumulent, et σ augmente de λ(Ag⁺) + λ(NO₃⁻) par mole versée.</li>
          <li>Exemple de la simulation : 6,2 + 7,1 = 13,3, bien plus que −0,5 avant l’équivalence : la courbe est presque plate, puis elle monte nettement.</li>
          <li>Moyen de s’en souvenir : <strong>« plus de Cl⁻ à capturer : tout ce qu’on verse reste »</strong>. Idée fausse : « après l’équivalence, le précipité continue de se former ». Vrai : sans Cl⁻, il n’y a plus de précipitation.</li>
        </Ul></>,
      texte: <>Dans ce titrage, on a ajouté 180&nbsp;mL d’eau à la prise d’essai de 20,0&nbsp;mL avant de commencer. Les courbes du graphique supposent que le volume reste égal à 200&nbsp;mL pendant le titrage (on néglige les 22&nbsp;mL versés) : les deux parties de la courbe sont alors des droites.</>,
      tache: { type: 'qcm', q: 'Pourquoi dilue-t-on la prise d’essai avec de l’eau avant le titrage ?', ...Q.eau,
        expl: 'Avec un grand volume de départ, le volume versé change peu le volume total : la dilution est négligeable et les deux parties de la courbe sont des droites. De plus, les ions restent dilués (moins de 10 mol·m⁻³), domaine où la loi de Kohlrausch s’applique. L’eau ne dissout pas le précipité et diminue σ au lieu de l’augmenter.',
        indice: 'Que devient la concentration d’un ion quand on verse un grand volume de titrant dans un petit volume de solution ? Et dans un grand volume ?' } },
    { id: 'lecture', titre: 'Lire le volume équivalent', focus: ['graphique'],
      texte: <>Nouvelle eau salée, de concentration inconnue : on dose 20,0&nbsp;mL, dilués dans 180&nbsp;mL d’eau, avec la même solution de nitrate d’argent. Le graphique trace σ en fonction du volume versé de 0 à 25&nbsp;mL. Le <strong>volume équivalent V<sub>E</sub></strong> est le volume versé à l’équivalence : c’est l’abscisse du point de rupture de pente, ici le minimum de σ.</>,
      tache: { type: 'num', q: 'Volume équivalent V_E lu sur la courbe', unite: 'mL', vrai: 12.0, tol: 0.10, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Le volume équivalent est l’abscisse du point où la pente change : le minimum de σ.', 'On lit V_E = 12,0 mL (le minimum de σ est à environ 36 mS·m⁻¹).'],
        pieges: [[36, 'C’est la valeur de σ au minimum, en mS·m⁻¹ ; on demande son abscisse, un volume en mL.'], [25, 'C’est la fin du graphique ; le volume équivalent est l’abscisse du minimum de σ.'], [0, 'C’est le départ du titrage ; cherchez l’abscisse où la pente change.']],
        expl: 'Les deux parties de la courbe, presque plate puis montante, se coupent en V_E = 12,0 mL.', indice: 'Cherchez l’abscisse (en mL) du point où la courbe cesse d’être presque horizontale et se met à monter.' } },
    { id: 'droites', titre: 'En pratique : deux droites', focus: ['graphique'],
      retenirTitre: 'À retenir : deux droites, un coude',
      retenir: <>
        <SvgCoudeAgCarte/>
        <Ul>
          <li>La courbe σ = f(V) est faite de <strong>deux droites</strong> : leur intersection, le coude, donne le volume équivalent V<sub>E</sub>. À l’équivalence, σ est minimale mais <strong>non nulle</strong> (il reste Na⁺ et NO₃⁻).</li>
          <li>Exemple de la simulation : une droite presque horizontale (−0,5 par mole) puis une droite qui monte (+13,3) : ce n’est pas le « V » net d’un acide fort titré par une base.</li>
          <li>Moyen de s’en souvenir : <strong>« deux droites, un coude »</strong>. Idée fausse : « à l’équivalence, σ vaut zéro ». Vrai : σ ne s’annule jamais, il reste les ions spectateurs.</li>
        </Ul></>,
      texte: <>Au laboratoire, on ne trace pas une courbe continue : on mesure σ pour des volumes réguliers (points <strong>pleins</strong>) sans les relier, puis on modélise par <strong>deux droites en pointillés</strong>. Les points <strong>creux</strong>, dans la zone hachurée à moins de 2&nbsp;mL de V<sub>E</sub>, sont <strong>écartés</strong> du tracé.</>,
      tache: { type: 'qcm', q: 'Pourquoi écarte-t-on les points proches de l’équivalence pour tracer les deux droites ?', ...Q.droites,
        expl: 'Près de V_E, la courbe réelle s’arrondit (la réaction n’est pas parfaitement totale, un peu de AgCl se redissout, la dilution courbe un peu les segments, les mesures sont incertaines) : ces points ne sont plus sur les droites. On repère l’équivalence avec les points éloignés, bien alignés.',
        indice: 'Regardez où se trouvent les points creux par rapport aux deux droites en pointillés : sont-ils alignés avec les autres points ?' } },
    { id: 'conc', titre: 'Du volume équivalent à la concentration', focus: ['graphique'],
      texte: <>À l’équivalence, la quantité d’ions Ag⁺ versés est égale à la quantité d’ions Cl⁻ de la prise d’essai (réaction de un pour un). On a lu V<sub>E</sub>&nbsp;=&nbsp;12,0&nbsp;mL ; la solution de nitrate d’argent est à c(Ag⁺)&nbsp;=&nbsp;5,0×10⁻²&nbsp;mol/L et la prise d’essai est V<sub>A</sub>&nbsp;=&nbsp;20,0&nbsp;mL.</>,
      tache: { type: 'num', q: 'Concentration c(Cl⁻) de l’eau salée', unite: 'mol/L', vrai: 0.0300, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['À l’équivalence : c(Ag⁺) × V_E = c(Cl⁻) × V_A (quantités égales, réaction un pour un).', 'c(Cl⁻) = c(Ag⁺) × V_E / V_A = 0,050 × 12,0 / 20,0 = 0,030 mol/L (les volumes sont dans la même unité).'],
        pieges: [[0.60, 'C’est c(Ag⁺) × V_E, une quantité de matière en mmol : divisez-la par V_A pour obtenir une concentration.'], [0.083, 'Le rapport est inversé : c(Cl⁻) = c(Ag⁺) × V_E / V_A, pas c(Ag⁺) × V_A / V_E.'], [0.003, 'Vous avez divisé par 200 mL : la quantité de Cl⁻ à doser est dans la prise d’essai de 20,0 mL.'], [0.050, 'C’est la concentration du nitrate d’argent ; on cherche celle des ions chlorure.']],
        expl: 'c(Cl⁻) = 0,050 × 12,0 / 20,0 = 0,030 mol/L.', indice: 'Écrivez l’égalité des quantités c(Ag⁺) × V_E = c(Cl⁻) × V_A, puis isolez c(Cl⁻).' } },
    { id: 'sel', titre: 'De la concentration à la masse de sel', focus: [],
      retenirTitre: 'À retenir : quantités égales',
      retenir: <>
        <SvgEquivAgCarte/>
        <Ul>
          <li>À l’équivalence, les réactifs sont dans les <strong>proportions de la réaction</strong> : c(Ag⁺) × V<sub>E</sub> = c(Cl⁻) × V<sub>A</sub>, où V<sub>E</sub> est lu sur la courbe et V<sub>A</sub> est la prise d’essai.</li>
          <li>Exemple de la simulation : un Ag⁺ pour un Cl⁻, donc c(Cl⁻) = c(Ag⁺) × V<sub>E</sub> / V<sub>A</sub>.</li>
          <li>Moyen de s’en souvenir : <strong>« à l’équivalence, quantités égales »</strong>. Idée fausse : « à l’équivalence, c(Ag⁺) = c(Cl⁻) ». Vrai : ce sont les quantités qui sont égales, pas les concentrations (sauf si V<sub>E</sub> = V<sub>A</sub>).</li>
        </Ul></>,
      texte: <>On suppose que tous les ions chlorure de l’eau proviennent du chlorure de sodium NaCl. La prise d’essai (non diluée) contient c(Cl⁻)&nbsp;=&nbsp;0,030&nbsp;mol/L. Donnée : M(NaCl)&nbsp;=&nbsp;58,5&nbsp;g/mol.</>,
      tache: { type: 'num', q: 'Masse de chlorure de sodium par litre d’eau', unite: 'g/L', vrai: 1.755, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Un NaCl donne un Cl⁻ : c(NaCl) = c(Cl⁻) = 0,030 mol/L.', 't = c × M = 0,030 × 58,5 = 1,755 g/L, soit environ 1,8 g/L.'],
        pieges: [[1755, 'Vous avez converti en mol/m³ ou multiplié par 1 000 : ici c est en mol/L et on veut des g/L.'], [0.00051, 'Il faut multiplier par la masse molaire (g/mol), pas diviser.'], [0.030, 'C’est la concentration en mol/L ; multipliez-la par la masse molaire pour obtenir des g/L.']],
        expl: 't = 0,030 × 58,5 ≈ 1,8 g/L.', indice: 'Concentration massique = concentration molaire × masse molaire : mol/L × g/mol = g/L.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      texte: <>Vous savez écrire la réaction de précipitation d’un titrage, justifier l’allure d’une courbe de titrage conductimétrique avec les conductivités ioniques molaires (presque plate avant l’équivalence, nettement montante après), repérer le volume équivalent par l’intersection de deux droites et en déduire une concentration. Passez à l’exploration (cation spectateur, concentration, eau ajoutée, dilution) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi(type === 'conc' ? { type: 'conc', ...M.tirageDefiConc(), reps: { ve: '', c: '' }, verifie: false } : { type: 'sigma', ...M.tirageDefiSigma(), reps: { s: '' }, verifie: false }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const TOL_VE = 0.12, TOL_C = 0.12, TOL_S = 0.06;
  const proche = (x, v, t) => isFinite(x) && Math.abs(x - v) <= t * Math.abs(v);
  const verifier = () => {
    if (defi.type === 'conc') {
      const ve = lireNombre(defi.reps.ve), c = lireNombre(defi.reps.c);
      let diag, ok = false;
      if (!isFinite(ve) || !isFinite(c) || ve <= 0 || c <= 0) diag = { cle: 'nan', msg: 'Entrez deux nombres positifs : le volume équivalent V_E en mL, puis la concentration c(Cl⁻) en mol/L.' };
      else {
        const cCalc = M.CB * ve / defi.VA;
        if (!proche(c, cCalc, 0.04)) diag = { cle: 'calcul', msg: `Avec votre V_E = ${nbf(ve, 1)} mL, la relation à l’équivalence donne c(Cl⁻) = 0,050 × ${nbf(ve, 1)} / ${nbf(defi.VA, 1)} = ${nbf(cCalc, 3)} mol/L, pas ${nbf(c, 3)} mol/L : vérifiez le calcul (volumes dans la même unité, volume de la prise d’essai 20,0 mL).` };
        else if (!proche(ve, defi.VE, TOL_VE)) diag = { cle: 'lecture', msg: `Votre calcul est juste avec votre V_E, mais ${nbf(ve, 1)} mL est ${ve < defi.VE ? 'trop petit' : 'trop grand'} : le coude est ailleurs. Tracez les deux droites avec les points éloignés de l’équivalence (à plus de 2 mL du coude) et relisez l’abscisse de leur intersection.` };
        else { ok = true; diag = { cle: 'ok', msg: '' }; }
      }
      setDefi(d => ({ ...d, verifie: true, ok, diag, corr: false })); noterC(ok);
    } else {
      const s = lireNombre(defi.reps.s); let diag, ok = false;
      if (!isFinite(s) || s <= 0) diag = { cle: 'nan', msg: 'Entrez la conductivité σ sous forme d’un nombre positif, en mS·m⁻¹.' };
      else if (proche(s, defi.sigma, TOL_S)) { ok = true; diag = { cle: 'ok', msg: '' }; }
      else {
        const c = M.composition({ cation: defi.cation, cA: defi.cA, VB: defi.VB }).c, cd = M.composition({ cation: defi.cation, cA: defi.cA, VB: defi.VB, dilution: true }).c;
        const essais = [
          [M.kohlrausch(cd), 'Vous avez pris en compte la dilution par la solution versée. Ici, on garde un volume constant de 200 mL (dilution négligée, comme dans le parcours).'],
          [defi.sigma / 1000, 'Vous avez gardé les concentrations en mol/L : convertissez-les en mol·m⁻³ (× 1 000) pour appliquer σ = Σ λ × c.'],
          [M.kohlrausch({ ...c, [defi.cation]: 0 }), `Il manque la contribution du cation spectateur ${M.IONS[defi.cation].f}, qui reste dissous et conduit le courant.`],
          [M.kohlrausch({ ...c, NO3: 0 }), 'Il manque la contribution des ions nitrate NO₃⁻ versés avec les ions argent.'],
          [M.kohlrausch({ ...c, Cl: 0 }), 'Il manque la contribution des ions Cl⁻ qui n’ont pas encore précipité.'],
          [M.kohlrausch({ ...c, Ag: 0 }), 'Il manque la contribution des ions Ag⁺ en excès (après l’équivalence).'],
        ];
        const trouve = essais.find(([v]) => v > 0 && Math.abs(v - defi.sigma) > 0.03 * defi.sigma && proche(s, v, 0.03));
        diag = trouve ? { cle: 'piege', msg: trouve[1] } : { cle: 'ecart', msg: `Votre valeur est ${s < defi.sigma ? 'trop petite' : 'trop grande'}. Calculez les quantités de matière en mmol (Cl⁻ restant, Ag⁺ en excès, NO₃⁻ versés, cation spectateur), divisez par 200 mL, puis appliquez σ = Σ λ × c. Le bouton « Voir la correction » détaille la démarche.` };
      }
      setDefi(d => ({ ...d, verifie: true, ok, diag, corr: false })); noterS(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, nom, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{avecIndices(nom)} =</span>
      <input value={defi.reps[cle]} aria-label={nom} onKeyDown={e => e.key === 'Enter' && document.getElementById('tp-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false, corr: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>{unite && <span>{unite}</span>}
    </div>);
  const correctionC = d => `Le coude des deux droites (points éloignés de l’équivalence) est à V_E = ${nbf(d.VE, 1)} mL, donc c(Cl⁻) = 0,050 × ${nbf(d.VE, 1)} / ${nbf(d.VA, 1)} = ${nbf(d.cA, 3)} mol/L (marge acceptée : 12 % sur V_E).`;
  const correctionS = d => { const q = M.quantites({ cA: d.cA, VB: d.VB }); return `n(Cl⁻) au départ = ${nbf(q.nCl0, 2)} mmol, n(Ag⁺) versé = ${nbf(q.nAg, 2)} mmol : il reste ${q.nCl > 1e-9 ? `${nbf(q.nCl, 2)} mmol de Cl⁻` : `${nbf(q.nAgExces, 2)} mmol d’Ag⁺ en excès`}, avec ${nbf(q.nCat, 2)} mmol de ${M.IONS[d.cation].f} et ${nbf(q.nNO3, 2)} mmol de NO₃⁻. Volume constant 200 mL, donc σ = ${nbf(d.sigma, 1)} mS·m⁻¹ (marge acceptée : 6 % de la valeur).`; };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['conc', 'Concentration en chlorure'], ['sigma', 'Conductivité prévue']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'conc' ? 'Défi : quelle est la concentration en chlorure ?' : 'Défi : quelle conductivité en cours de titrage ?'}</div>
      {defi.type === 'conc' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>On dose <strong>{nbf(defi.VA, 1)}{NB}mL</strong> d’une eau contenant du {M.CATIONS[defi.cation].nom}, dilués dans 180 mL d’eau, par le nitrate d’argent à c(Ag⁺) = <strong>5,0×10⁻²{NB}mol/L</strong>. Le graphique donne la conductivité mesurée tous les 1 mL, de 0 à 25 mL. Déterminez le volume équivalent V<sub>E</sub> avec la méthode des deux droites, puis la concentration c(Cl⁻) de l’eau (marge acceptée : 12{NB}% de la valeur).</div>
        {champ('ve', 'V_E', 'mL')}{champ('c', 'c(Cl⁻)', 'mol/L')}
        <IndiceDefi cache={false}>Tracez deux droites passant par les points alignés de chaque côté du coude, sans utiliser les points proches de celui-ci (à moins de 2&nbsp;mL de V<sub>E</sub>) : l’abscisse de leur intersection donne V<sub>E</sub>. Puis c(Cl⁻) = c(Ag⁺) × V<sub>E</sub> / V<sub>A</sub>, avec V<sub>E</sub> et V<sub>A</sub> dans la même unité.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On dose <strong>{nbf(defi.VA, 1)}{NB}mL</strong> d’une eau contenant du {M.CATIONS[defi.cation].nom} à <strong>{nbf(defi.cA, 3)}{NB}mol/L</strong> en chlorure, dilués dans 180 mL d’eau (volume de départ : 200 mL, dilution par la burette négligée), par le nitrate d’argent à c(Ag⁺) = <strong>5,0×10⁻²{NB}mol/L</strong>. On a versé V = <strong>{nbf(defi.VB, 1)}{NB}mL</strong>. Calculez la conductivité σ à 2 chiffres significatifs (transformation totale ; marge acceptée : 6{NB}% de la valeur ; λ dans le tableau de données).</div>
        {champ('s', 'σ', 'mS·m⁻¹')}
        <IndiceDefi cache={false}>Calculez les quantités de matière en mmol : n(Cl⁻) au départ = c × V<sub>A</sub>, n(Ag⁺) versé = c(Ag⁺) × V ; le plus petit des deux précipite. Il reste du Cl⁻ ou de l’Ag⁺ (jamais les deux). Ajoutez le cation spectateur (n = n(Cl⁻) au départ) et NO₃⁻ (n = n(Ag⁺) versé). Puis σ = 1 000 × Σ λ × n / 200 (n en mmol, volume en mL, σ en mS·m⁻¹).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="tp-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok ? (defi.type === 'conc' ? correctionC(defi) : correctionS(defi)) : defi.diag.msg))}
        {!defi.ok && <div style={{ marginTop: 6 }}><button type="button" onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={{ ...styleBouton(false), minHeight: 42 }}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button></div>}
        {!defi.ok && defi.corr && <div style={{ marginTop: 6, fontWeight: 400, color: KIT.txt }}>{avecIndices(defi.type === 'conc' ? correctionC(defi) : correctionS(defi))}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> ; les conductivités ioniques molaires λ sont des valeurs usuelles arrondies au dixième, données du problème (non à retrouver) et supposées constantes. Valeurs choisies pour la simulation : λ(Ag⁺) = 6,2 ; λ(NO₃⁻) = 7,1 ; λ(K⁺) = 7,4 ; λ(Na⁺) = 5,0 ; λ(Cl⁻) = 7,6 mS·m²·mol⁻¹.</li>
      <li><strong>Loi de Kohlrausch</strong> : σ = Σ λ × c, valable pour une solution <strong>diluée</strong> (concentrations des ions inférieures à environ 10 mol·m⁻³, soit 1,0×10⁻² mol/L) ; au-delà, les interactions entre ions font s’écarter σ de la somme des contributions. La simulation signale quand ce domaine est dépassé (par exemple sans eau ajoutée).</li>
      <li><strong>Transformation totale</strong> : Ag⁺ + Cl⁻ → AgCl(s) est supposée totale, comme au programme ; Ag⁺ et Cl⁻ ne coexistent pas en quantité notable (à l’équivalence, leurs concentrations réelles, de l’ordre de 10⁻⁵ mol/L, sont négligées). Le solide AgCl(s) ne contribue pas à σ.</li>
      <li><strong>Dilution</strong> : dans le parcours, le volume est supposé constant (200 mL, dilution par la burette négligée) : les deux parties de la courbe sont alors des droites. Dans l’exploration, une case permet de compter le volume versé : les parties sont alors un peu courbes. Dans les défis, les mesures tiennent compte de la dilution et d’un petit bruit de lecture (de l’ordre de 0,5 % de σ).</li>
      <li><strong>Vue « comme en TP »</strong> : les points sont calculés avec le modèle tous les 1 mL ; les deux droites sont ajustées par régression linéaire sur les points éloignés de V<sub>E</sub> d’au moins 2 mL. Leur intersection donne V<sub>E</sub> à quelques % près.</li>
      <li><strong>Conductimètre idéal</strong> : la cellule est étalonnée, elle affiche directement σ en mS·m⁻¹ (1 mS·cm⁻¹ = 100 mS·m⁻¹) ; mesures sans bruit dans le parcours et l’exploration.</li>
      <li><strong>Schéma</strong> : un point représente 0,1 mmol d’ion ; les tailles sont symboliques (cations plus petits, anions plus gros) pour distinguer les ions sans compter sur la couleur ; les grains blancs de AgCl(s) sont schématiques (un grain pour 0,1 mmol) ; le dessin n’est pas à l’échelle.</li>
      <li><strong>Limites</strong> : pas de produit de solubilité K<sub>s</sub> de AgCl, pas de choix de l’indicateur coloré (titrage par la méthode de Mohr), pas de variation de la température pendant le titrage.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, données ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const lectureCond = (() => {
    if (enGuide && (idE === 'equation' || idE === 'tableau' || idE === 'sigma0')) return null;
    return `${nbf(sigma, sigma >= 100 ? 0 : 1)} mS/m`;
  })();
  const montrerCell = !enGuide || deja('sigma0');
  const goutte = VB > 0 && VB < M.V_BURETTE;
  const boxScene = !dd && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>Le bécher contient l’eau salée ; on y verse le nitrate d’argent de la burette. Les points sont des ions (un point = 0,1 mmol), les grains blancs sont le précipité AgCl(s) ; le conductimètre donne σ.</div>}
      <SceneTitrage cA={cA} VB={VB} cation={cation} ouvert={goutte} lecture={lectureCond} anime={!reduit} montrer={{ cellule: montrerCell }} hl={hl}/>
    </div>);
  const lignesLambda = (() => {
    if (enGuide) return [...(deja('sigma0') ? ['Na', 'Cl'] : []), ...(deja('avant') ? ['NO3'] : []), ...(deja('pente') ? ['Ag'] : [])];
    if (dd) return [dd.cation, 'Cl', 'NO3', 'Ag'];
    return [cation, 'Cl', 'NO3', 'Ag'];
  })();
  const tableLambda = (
    <div style={{ ...styleBoite, ...cadre('donnees') }}>
      <div style={titreCarte}>Données : conductivités ioniques molaires λ</div>
      <div style={aide}>En mS·m²·mol⁻¹, à 25 °C.</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>
        {lignesLambda.map(k => <span key={k} style={{ whiteSpace: 'nowrap' }}>λ({M.IONS[k].f}) = <strong>{nbf(M.IONS[k].lambda, 1)}</strong></span>)}
      </div>
    </div>);
  const boxDonnees = enGuide && deja('sigma0') ? tableLambda : null;

  // ---------- graphique et contributions ----------
  const boxGraph = !dd && deja('avant') && (
    <div style={{ ...styleBoite, ...cadre('graphique') }}>
      <div style={titreCarte}>Conductivité en fonction du volume de nitrate d’argent versé</div>
      {enExplore && <div style={aide}>{vueTP ? <>Vue « comme en TP » : points mesurés tous les 1 mL, non reliés. Les deux droites en pointillés passent par les points éloignés de l’équivalence ; leur intersection donne V<sub>E</sub>.</> : 'La courbe se lit de gauche à droite. Le point rouge est le volume versé choisi ; le trait orange pointillé marque l’équivalence.'}</div>}
      {enExplore && <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 42, fontSize: 15, color: KIT.txt, cursor: 'pointer', marginBottom: 4 }}><input type="checkbox" checked={vueTP} onChange={e => setVueTP(e.target.checked)} style={{ width: 22, height: 22, flex: '0 0 auto' }}/>Voir comme en TP : points et deux droites</label>}
      <GraphiqueTitrage trace={trace} marqueur={{ VB, sigma }} VE={VEaff ? VE : null} yMax={yMax} titre="Titrage conductimétrique par précipitation" tp={tp}/>
      {tp && <div style={{ ...aide, marginTop: 4, marginBottom: 0 }}>● points utilisés · ○ points écartés (à moins de 2 mL de V<sub>E</sub>) · pointillés noirs : droites modélisées</div>}
    </div>);
  const sectionBarres = (<BarresContributionAg contributions={contribs} sigma={sigma}/>);
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
      <GraphiqueTitrage mesures={dd.pts} yMax={yMaxDe(Math.max(...dd.pts.map(p => p.sigma)))} titre="Mesures du titrage"/>
      <Section titre="Voir les valeurs mesurées" ouvert={ouv.mesures} onBascule={() => setOuv(o => ({ ...o, mesures: !o.mesures }))}>
        {[0, 7, 14, 21].map(d => (
          <table key={d} style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', marginBottom: 6, fontFamily: 'monospace' }}><tbody>
            <tr><td style={{ padding: '2px 4px', color: KIT.txt2 }}>V (mL)</td>{dd.pts.slice(d, d + 7).map(p => <td key={p.VB} style={{ padding: '2px 4px', textAlign: 'right' }}>{p.VB}</td>)}</tr>
            <tr><td style={{ padding: '2px 4px', color: KIT.txt2 }}>σ</td>{dd.pts.slice(d, d + 7).map(p => <td key={p.VB} style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>{nbf(p.sigma, 1)}</td>)}</tr></tbody></table>))}
        <div style={{ ...aide, marginBottom: 0 }}>σ en mS·m⁻¹.</div>
      </Section>
    </div>);
  const boxDefiEq = dd && (
    <div style={styleBoite}><span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>Réaction de titrage : </span><span style={{ whiteSpace: 'nowrap', fontWeight: 700, color: KIT.txt, fontSize: 'clamp(13px, 4vw, 17px)' }}>{EQ}</span></div>);
  const boxDefiDonnees = dd && dd.type === 'sigma' && tableLambda;

  // ---------- réglages (exploration) ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages de l’expérience</div>
      <div style={aide}>Choisissez l’eau salée à doser et sa concentration en chlorure, puis versez le nitrate d’argent avec le curseur : le schéma, le graphique et la conductivité se mettent à jour.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Sel dissous (cation spectateur)
        <select value={ti.cation} onChange={e => setT({ cation: e.target.value })} style={{ ...menu, marginTop: 2 }}>
          {Object.values(M.CATIONS).map(c => <option key={c.id} value={c.id}>{c.nom} ({c.formule})</option>)}
        </select>
      </label>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Concentration en chlorure de l’eau
        <select value={ti.cA} onChange={e => setT({ cA: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>
          {M.CONC_A.map(c => <option key={c} value={c}>{nbf(c, 3)} mol/L</option>)}
        </select>
      </label>
      <Curseur nom="Volume de nitrate d’argent versé" valeur={ti.VB} onChange={v => setT({ VB: Math.round(v * 2) / 2 })} min={0} max={M.V_BURETTE} pas={0.5} unite="mL" decimales={1}/>
      <Section titre={<span><span style={{ display: 'block' }}>Réglages fins</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>prise d’essai {nbf(M.VA0, 1)}{NB}mL + eau {ti.eau}{NB}mL · dilution {ti.dilution ? 'comptée' : 'négligée'}</span></span>} ouvert={ouv.fins} onBascule={() => setOuv(o => ({ ...o, fins: !o.fins }))}>
        <div style={aide}>L’eau ajoutée dilue l’eau salée : sans eau, la solution est trop concentrée pour la loi de Kohlrausch. Compter la dilution par la burette courbe un peu les deux parties de la courbe.</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Eau ajoutée avant le titrage
          <select value={ti.eau} onChange={e => setT({ eau: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>
            {M.EAU.map(e => <option key={e} value={e}>{e === 0 ? 'aucune' : `${e} mL`} ({M.VA0 + e} mL en tout)</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 42, fontSize: 15, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={ti.dilution} onChange={e => setT({ dilution: e.target.checked })} style={{ width: 22, height: 22, flex: '0 0 auto' }}/>Compter la dilution (volume total = départ + versé)</label>
      </Section>
    </div>);

  // ---------- mesures ----------
  const mesures = !dd && enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <div style={aide}>Valeurs calculées pour les réglages et le volume versé choisis.</div>
      <LigneMesure nom="Conductivité σ" valeur={`${nbf(sigma, 1)}${NB}mS·m⁻¹`} couleur={COL.bleu}/>
      <LigneMesure nom="Pente (mS·m⁻¹ par mL)" valeur={nbf(pen, 2)} couleur={pen < 0 ? COL.rouge : COL.vert}/>
      <LigneMesure nom="Volume total" valeur={`${nbf(comp.Vt, 1)}${NB}mL`}/>
      <LigneMesure nom="Volume équivalent" valeur={`${nbf(VE, 1)}${NB}mL`} couleur={COL.orange}/>
      <LigneMesure nom="Précipité AgCl formé" valeur={`${nbf(comp.q.nPrec, 2)}${NB}mmol`}/>
      <LigneMesure nom="Plus grande concentration d’ion" valeur={`${nbf(concMax, 1)}${NB}mol·m⁻³`}/>
      {concMax > 10 && <div style={{ fontSize: 13.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>Au-delà d’environ 10 mol·m⁻³, la loi de Kohlrausch n’est plus valable : σ affiché est trop élevé.</div>}
    </div>);

  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Versez le nitrate d’argent de 0 à 25 mL : où la pente change-t-elle ? Comparez avec le volume équivalent des mesures.</li>
        <li>Remplacez le chlorure de sodium par le chlorure de potassium : la courbe change-t-elle avant l’équivalence ? Après ? Comparez λ(Na⁺) et λ(K⁺).</li>
        <li>À l’équivalence, ouvrez « Part de chaque ion dans σ » : quels ions restent, et pourquoi σ n’est-elle pas nulle ?</li>
        <li>Doublez la concentration en chlorure : que devient le volume équivalent ? Et la valeur de σ au départ ?</li>
        <li>Réglez « Eau ajoutée » sur « aucune » : que devient σ ? Quel message apparaît, et pourquoi ?</li>
        <li>Cochez « Compter la dilution » avec peu d’eau, puis activez la vue « comme en TP » : les deux parties restent-elles des droites ? V_E est-il toujours bien lu ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Ag⁺ + Cl⁻ → AgCl(s) : le précipité sort de la solution et ne conduit pas ; Na⁺ (ou K⁺) et NO₃⁻ sont spectateurs</li>
          <li>Avant l’équivalence, Cl⁻ est remplacé par NO₃⁻ (7,1 au lieu de 7,6) : σ varie très peu</li>
          <li>Après l’équivalence, Ag⁺ et NO₃⁻ s’accumulent : σ monte nettement (6,2 + 7,1 par mole versée)</li>
          <li>Deux droites, un coude : leur intersection donne le volume équivalent V<sub>E</sub> ; σ n’est jamais nulle à l’équivalence</li>
          <li>{avecIndices('c(Cl⁻) = c(Ag⁺) × V_E / V_A')} (un Ag⁺ pour un Cl⁻)</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tp-col { display: flex; flex-direction: column; gap: 12px; }
        .tp-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .tp-l1.cote .tp-carte { order: 2; } .tp-l1.cote .tp-main { order: 1; }
          .tp-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .tp-ex > * { grid-column: 1; } .tp-ex > .tp-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .tp-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .tp-in { animation: tp-fondu 0.35s ease-out; } @keyframes tp-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Titrage conductimétrique par précipitation</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>On dose les ions chlorure par des ions argent. Le <strong>précipité</strong> sort de la solution : la courbe de <strong>conductivité</strong> est faite de deux droites, et leur intersection repère l’<strong>équivalence</strong>.</div>
      {!enExplore && <div className="tp-l1 cote">
        {enGuide ? <div className="tp-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="tp-carte">{panneauHypo}</div> : null}
        <div className="tp-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'conc' ? suiviC : suiviS}/></div>}
          {dd && <div className="tp-col">{boxDefiEq}{boxDefiGraph}{boxDefiDonnees}</div>}
          {!dd && <div className="tp-col">
            <div className="tp-in">{boxScene}</div>
            {boxDonnees && <div className="tp-in">{boxDonnees}</div>}
            {boxGraph && <div className="tp-in">{boxGraph}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <div className="tp-ex">
        <div>{boxScene}</div>
        <div className="tp-ctrl">{reglages}</div>
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
