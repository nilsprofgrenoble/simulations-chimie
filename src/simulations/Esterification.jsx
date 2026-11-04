import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./esterModele";

const SIM_ID = 86;
declarerDefis(SIM_ID, [['rendement', 'Quel est le rendement de la synthèse ?'], ['ccm', 'Quel est le rapport frontal de la tache inconnue ?'], ['equilibre', 'Comment déplacer l’équilibre sans Dean-Stark ?']]);

// ====================================================
//  SIM 86 — SYNTHÈSE ORGANIQUE : estérification (équilibre, catalyseur, excès de réactif, Dean-Stark), suivi par CCM, traitement et rendement
//  Notations : K = [E][W] / ([A][B]) à l'équilibre ; rendement η = n(ester obtenu) / n(ester maximal) ; Rf = d / L.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const tire = t => t[Math.floor(Math.random() * t.length)];
const TMAX = 180;
const PRESET_RX = { couple: 'butyle', vA: 15, vB: 24, cat: true, T: 100, ds: false, t: 0 };
const PRESET_CCM = { p: 0.3, t: 30 };
const PRESET_BL = { nLav: 2, dist: true };
const COUL = { A: '#dc2626', B: '#d97706', E: '#0e7490', W: '#2563eb' };

export function SimulationEsterification({ naviguer }) {
  const [mode, setMode] = useState(() => modeOuverture('esterification-guide-v1'));
  useSignalerMode(mode);
  const [suiviRend, noterRend] = useCompteurDefi(), [suiviCcm, noterCcm] = useCompteurDefi(), [suiviEq, noterEq] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('esterification-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState('rendement');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [scene, setScene] = useState('reaction');
  const [rx, setRx] = useState(PRESET_RX);
  const [cc, setCc] = useState(PRESET_CCM);
  const [bl, setBl] = useState(PRESET_BL);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const dd = enDefi && defi ? defi : null;
  const sceneEff = dd ? (dd.type === 'ccm' ? 'ccm' : dd.type === 'equilibre' ? 'reaction' : 'calcul') : scene;

  // ---------- réaction ----------
  const C = M.COUPLES[rx.couple], alc = C.alcool, est = C.ester;
  const nA = M.molesDepuisVolume(M.ACIDE, rx.vA), nB = M.molesDepuisVolume(alc, rx.vB);
  const sim = useMemo(() => M.simuler({ nA, nB, T: rx.T, cat: rx.cat, ds: rx.ds, tmax: TMAX }), [nA, nB, rx.T, rx.cat, rx.ds]);
  const iT = M.indiceTemps(sim, rx.t);
  const nE = sim.E[iT], nAt = sim.A[iT], nBt = sim.B[iT], nW = sim.W[iT], nWd = sim.Wd[iT];
  const nLim = Math.min(nA, nB), rend = nE / nLim, rendEq = M.rendementEq(nA, nB);
  const Qr = nAt * nBt > 1e-12 ? (nE * nW) / (nAt * nBt) : NaN;
  
  // ---------- CCM ----------
  const simC = useMemo(() => M.simuler({ nA: M.molesDepuisVolume(M.ACIDE, 15), nB: M.molesDepuisVolume(M.COUPLES.butyle.alcool, 24), T: 100, cat: true, ds: false, tmax: TMAX }), []);
  const iC = M.indiceTemps(simC, cc.t);
  const pC = dd?.type === 'ccm' ? dd.p : cc.p;
  const HPLAQUE = 60, FRONT = 50;                                      // mm : hauteur de la plaque, distance ligne de dépôt – front
  const melange = [['acide', simC.A[iC]], ['alcool', simC.B[iC]], ['ester', simC.E[iC]]].map(([esp, n]) => ({ esp, int: M.intensiteTache(n, 0.08) }));

  // ---------- bilan ----------
  const nObt = M.bilanMasse({ nEster: nE, nLavages: bl.nLav, distille: bl.dist });
  const mObt = nObt * est.M, mTheo = nLim * est.M, rendFinal = M.rendement(nObt, nA, nB);
  const vCO2 = M.lavageHydrogenocarbonate(nAt, 0.5).CO2_mL;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const rxBase = scene === 'reaction' && rx.couple === 'butyle' && rx.vA === 15 && rx.vB === 24 && rx.cat && rx.T === 100 && !rx.ds;
  const nA0 = M.molesDepuisVolume(M.ACIDE, 15), nB0 = M.molesDepuisVolume(M.COUPLES.butyle.alcool, 24);
  const simBase = M.simuler({ nA: nA0, nB: nB0, T: 100, cat: true, ds: false, tmax: TMAX });
  const simExc = M.simuler({ nA: nA0, nB: M.molesDepuisVolume(M.COUPLES.butyle.alcool, 72), T: 100, cat: true, ds: false, tmax: TMAX });
  const simDS = M.simuler({ nA: nA0, nB: nB0, T: 100, cat: true, ds: true, tmax: TMAX });
  const rxDSbase = rx.couple === 'butyle' && rx.vA === 15 && rx.vB === 24 && rx.cat && rx.T === 100 && rx.ds;
  const rxExc = scene === 'reaction' && rx.couple === 'butyle' && rx.vA === 15 && rx.vB === 72 && rx.cat && rx.T === 100 && !rx.ds;
  const rxDS = scene === 'reaction' && rx.couple === 'butyle' && rx.vA === 15 && rx.vB === 24 && rx.cat && rx.T === 100 && rx.ds;
  const ccmBase = scene === 'ccm' && Math.abs(cc.p - 0.3) < 0.01 && cc.t === 30;
  const ETAPES = [
    { id: 'bilan0', titre: 'L’estérification', focus: ['scene'],
      texte: <>Un <strong>ester</strong> se prépare à partir d’un acide carboxylique et d’un alcool : RCOOH + R′OH ⇌ RCOOR′ + H₂O. On étudie ici la synthèse de l’<strong>éthanoate de butyle</strong>, aux arômes fruités, à partir de l’acide éthanoïque et du butan-1-ol.</>,
      tache: { type: 'qcm', q: 'La réaction d’estérification est…', options: ['lente et limitée (équilibre)', 'rapide et totale', 'rapide et limitée'], bonne: 0,
        expl: 'La réaction est lente (il faut chauffer et ajouter un catalyseur acide) et limitée : elle conduit à un équilibre chimique, en présence des quatre espèces (acide, alcool, ester, eau).' } },
    { id: 'melange', titre: 'Un mélange équimolaire', focus: ['scene', 'reglages'],
      texte: <>On introduit 15{NB}mL d’acide éthanoïque (ρ = 1,05{NB}g·mL⁻¹) et 24{NB}mL de butan-1-ol (ρ = 0,81{NB}g·mL⁻¹), avec du catalyseur acide, et on chauffe à 100{NB}°C. Les quantités de matière sont voisines.</>,
      tache: { type: 'action', ok: rxBase && rx.t === 0, label: 'Préparer le mélange', faire: () => { setScene('reaction'); setRx(PRESET_RX); }, consigne: 'Réglez 15 mL d’acide, 24 mL de butan-1-ol, catalyseur, 100 °C, sans Dean-Stark, t = 0' } },
    { id: 'quantites', titre: 'Quantités de matière initiales', focus: ['mesures'],
      texte: <>La quantité de matière se calcule par <em>n</em> = <em>ρ</em>·<em>V</em> / <em>M</em>. Pour l’acide éthanoïque : <em>M</em> = 60,05{NB}g·mol⁻¹.</>,
      tache: { type: 'num', q: 'Quantité d’acide éthanoïque introduit', unite: 'mol', vrai: nA0, tol: 0.02, affiche: v => nbf(v, 3), cs: 2,
        bloque: rxBase ? null : 'Préparez d’abord le mélange (étape précédente).',
        calcul: () => ['m = ρ·V = 1,05 × 15 = 15,75 g.', `n = m / M = 15,75 / 60,05 = ${nbf(nA0, 3)} mol.`], pieges: [[1.05 * 15, 'Vous avez donné la masse : il faut diviser par la masse molaire.']],
        expl: `n(acide) = ${nbf(nA0, 3)} mol ; le butan-1-ol est introduit en quantité quasi identique (${nbf(nB0, 3)} mol).` } },
    { id: 'catalyseur', titre: 'Pourquoi chauffer et catalyser ?', focus: ['reglages'],
      texte: <>Faites varier la température et le catalyseur (avec t = 60{NB}min) et observez la quantité d’ester formée.</>,
      tache: { type: 'qcm', q: 'Le chauffage à reflux et le catalyseur acide permettent…', options: ['d’atteindre plus vite l’état d’équilibre, sans le modifier', 'd’obtenir un meilleur rendement à l’équilibre', 'de rendre la réaction totale'], bonne: 0,
        expl: 'Température et catalyseur sont des facteurs cinétiques : ils accélèrent la réaction mais ne changent pas la composition à l’équilibre (la constante K ne dépend pas du catalyseur, et la réaction est athermique). Le reflux évite de perdre les réactifs et l’ester volatils.' } },
    { id: 'attente', titre: 'Laisser réagir', focus: ['reglages'],
      texte: <>Placez le curseur de temps à <strong>120{NB}min</strong> : la composition n’évolue presque plus.</>,
      tache: { type: 'action', ok: rxBase && rx.t === 120, label: 'Aller à t = 120 min', faire: () => { setScene('reaction'); setRx({ ...PRESET_RX, t: 120 }); }, consigne: 'Réglez le temps à 120 min' } },
    { id: 'rendement', titre: 'Le rendement', focus: ['mesures'],
      texte: <>Le <strong>rendement</strong> est le rapport entre la quantité d’ester obtenue et la quantité maximale (celle qu’on obtiendrait si la réaction était totale : <em>n</em>(ester) = <em>n</em> du réactif limitant). Lisez <em>n</em>(ester) dans « Mesures ».</>,
      tache: { type: 'num', q: 'Rendement à t = 120 min', unite: '%', vrai: simBase.E[M.indiceTemps(simBase, 120)] / Math.min(nA0, nB0) * 100, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        bloque: rxBase && rx.t === 120 ? null : 'Placez d’abord le temps à 120 min avec le mélange de départ.',
        calcul: () => [`n(ester) = ${nbf(simBase.E[M.indiceTemps(simBase, 120)], 3)} mol ; n maximale = n du réactif limitant = ${nbf(Math.min(nA0, nB0), 3)} mol.`, `η = ${nbf(simBase.E[M.indiceTemps(simBase, 120)], 3)} / ${nbf(Math.min(nA0, nB0), 3)} = ${nbf(simBase.E[M.indiceTemps(simBase, 120)] / Math.min(nA0, nB0) * 100, 0)} %.`], pieges: [[simBase.E[M.indiceTemps(simBase, 120)] / Math.min(nA0, nB0), 'Le rendement est demandé en pourcentage.']],
        expl: 'η ≈ 67 % : même après un long chauffage, un tiers du réactif limitant n’est pas transformé.' } },
    { id: 'quotient', titre: 'L’équilibre atteint', focus: ['mesures'],
      texte: <>À l’équilibre, le quotient de réaction vaut la constante <em>K</em> : <em>Q</em><sub>r,éq</sub> = <em>n</em>(E)·<em>n</em>(H₂O) / (<em>n</em>(acide)·<em>n</em>(alcool)) (le volume se simplifie). Calculez-le avec les quantités affichées.</>,
      tache: { type: 'num', q: 'Quotient de réaction à t = 120 min', unite: '', vrai: (() => { const i = M.indiceTemps(simBase, 120); return simBase.E[i] * simBase.W[i] / (simBase.A[i] * simBase.B[i]); })(), tol: 0.04, affiche: v => nbf(v, 1), cs: 2,
        bloque: rxBase && rx.t === 120 ? null : 'Placez d’abord le temps à 120 min avec le mélange de départ.',
        calcul: () => ['n(H₂O) = n(ester) car l’eau est formée avec l’ester.', `Qr = n(E)² / (n(A)·n(B)) = ${nbf(simBase.E[M.indiceTemps(simBase, 120)], 3)}² / (${nbf(simBase.A[M.indiceTemps(simBase, 120)], 3)} × ${nbf(simBase.B[M.indiceTemps(simBase, 120)], 3)}) ≈ 4,0.`],
        expl: 'Qr,éq ≈ 4,0 : c’est la constante d’équilibre K de l’estérification d’un alcool primaire.' } },
    { id: 'exces', titre: 'Un excès d’alcool', focus: ['reglages', 'mesures'],
      texte: <>Pour déplacer l’équilibre dans le sens direct, on peut utiliser un <strong>excès d’un réactif</strong>. Prenez 72{NB}mL de butan-1-ol (environ 3 fois plus de moles que d’acide) et placez t = 120{NB}min.</>,
      tache: { type: 'action', ok: rxExc && rx.t === 120, label: 'Excès de butan-1-ol', faire: () => { setScene('reaction'); setRx({ ...PRESET_RX, vB: 72, t: 120 }); }, consigne: 'Réglez 72 mL de butan-1-ol et t = 120 min' } },
    { id: 'rexc', titre: 'Le rendement augmente', focus: ['mesures'],
      texte: <>Le réactif limitant est maintenant l’acide éthanoïque : <em>n</em>(acide) = {nbf(nA0, 3)}{NB}mol. Lisez <em>n</em>(ester) dans « Mesures » (t = 120{NB}min).</>,
      tache: { type: 'num', q: 'Rendement par rapport à l’acide (réactif limitant)', unite: '%', vrai: simExc.E[M.indiceTemps(simExc, 120)] / nA0 * 100, tol: 0.03, affiche: v => nbf(v, 0), cs: 1,
        bloque: rxExc && rx.t === 120 ? null : 'Réglez d’abord 72 mL de butan-1-ol et t = 120 min.',
        calcul: () => [`n(ester) = ${nbf(simExc.E[M.indiceTemps(simExc, 120)], 3)} mol ; n(acide) = ${nbf(nA0, 3)} mol (limitant).`, `η = ${nbf(simExc.E[M.indiceTemps(simExc, 120)] / nA0 * 100, 0)} %.`],
        expl: 'η ≈ 90 % au lieu de 67 % : à avancement donné, le quotient de réaction est plus petit quand l’alcool est en excès : le système évolue dans le sens direct plus loin avant d’atteindre K.' } },
    { id: 'ds', titre: 'Éliminer l’eau : le Dean-Stark', focus: ['scene', 'reglages'],
      texte: <>Autre moyen de déplacer l’équilibre : retirer un produit. Avec le <strong>Dean-Stark</strong>, le cyclohexane entraîne l’eau sous forme d’<strong>hétéroazéotrope</strong> (il bout vers 70{NB}°C) ; les vapeurs se condensent et l’eau, non miscible et plus dense, se sépare en bas du décanteur. Revenez au mélange équimolaire, activez le Dean-Stark et placez t = 180{NB}min.</>,
      tache: { type: 'action', ok: rxDS && rx.t === 180, label: 'Activer le Dean-Stark', faire: () => { setScene('reaction'); setRx({ ...PRESET_RX, ds: true, t: 180 }); }, consigne: 'Mélange équimolaire, Dean-Stark activé, t = 180 min' } },
    { id: 'dsq', titre: 'Pourquoi le rendement monte', focus: ['mesures'],
      texte: <>Le rendement dépasse nettement les 67 % du mélange sans Dean-Stark.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’élimination de l’eau augmente-t-elle le rendement ?', options: ['le quotient Qr devient inférieur à K : le système évolue dans le sens direct', 'l’eau retirée rend la réaction plus rapide, ce qui augmente le rendement', 'K augmente quand on retire de l’eau'], bonne: 0,
        expl: 'Retirer l’eau diminue Qr = [E][H₂O]/([A][B]) : Qr < K, donc la transformation se poursuit dans le sens direct. K, lui, ne dépend que de la température (ici pratiquement pas).' } },
    { id: 'eaud', titre: 'L’eau recueillie', focus: ['scene', 'mesures'],
      texte: <>Le décanteur est gradué : l’eau recueillie provient uniquement de la réaction. Chaque mole d’ester formée libère <strong>une mole d’eau</strong> (M = 18,0{NB}g·mol⁻¹, ρ = 1,00{NB}g·mL⁻¹). Lisez le volume d’eau recueilli et déduisez la quantité d’ester formée.</>,
      tache: { type: 'num', q: 'Quantité d’ester formée (déduite du volume d’eau)', unite: 'mol', vrai: simDS.Wd[M.indiceTemps(simDS, 180)], tol: 0.03, affiche: v => nbf(v, 3), cs: 2,
        bloque: rxDS && rx.t === 180 ? null : 'Activez d’abord le Dean-Stark (étape précédente) et placez t = 180 min.',
        calcul: () => [`Volume d’eau lu : ${nbf(M.volumeEau_mL(simDS.Wd[M.indiceTemps(simDS, 180)]), 1)} mL, donc m = ρ·V = ${nbf(M.volumeEau_mL(simDS.Wd[M.indiceTemps(simDS, 180)]), 1)} g.`, `n(H₂O) = m / M = ${nbf(M.volumeEau_mL(simDS.Wd[M.indiceTemps(simDS, 180)]), 1)} / 18,0 = ${nbf(simDS.Wd[M.indiceTemps(simDS, 180)], 3)} mol = n(ester) (l’eau restant dans le ballon est négligeable).`],
        pieges: [[M.volumeEau_mL(simDS.Wd[M.indiceTemps(simDS, 180)]), 'Vous avez donné le volume ; il faut le convertir en quantité de matière.']],
        expl: 'Compter l’eau recueillie permet de suivre l’avancement de la synthèse : n(ester) = n(eau formée).' } },
    { id: 'ccm0', titre: 'Suivre la réaction par CCM', focus: ['scene'],
      texte: <>La <strong>chromatographie sur couche mince</strong> (CCM) permet de suivre l’avancement : on dépose sur une plaque de silice les <strong>témoins</strong> (acide, alcool, ester purs) et le mélange réactionnel prélevé à des instants différents. Le solvant (éluant, ici un mélange cyclohexane / éthanoate d’éthyle) monte par capillarité et entraîne chaque espèce plus ou moins loin. Ouvrez l’onglet CCM : éluant à 30{NB}% d’éthanoate d’éthyle, prélèvement à t = 30{NB}min.</>,
      tache: { type: 'action', ok: ccmBase, label: 'Ouvrir la CCM', faire: () => { setScene('ccm'); setCc(PRESET_CCM); }, consigne: 'Onglet « CCM » : 30 % d’éthanoate d’éthyle, prélèvement à 30 min' } },
    { id: 'rf', titre: 'Le rapport frontal', focus: ['mesures'],
      texte: <>Le <strong>rapport frontal</strong> d’une espèce est <em>R</em><sub>f</sub> = <em>d</em> / <em>L</em>, où <em>d</em> est la distance parcourue par la tache (du dépôt à son centre) et <em>L</em> la distance parcourue par le front de l’éluant. Calculez <em>R</em><sub>f</sub> pour l’ester pur.</>,
      tache: { type: 'num', q: 'Rapport frontal de l’ester', unite: '', vrai: M.rf('ester', 0.3), tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        bloque: ccmBase ? null : 'Ouvrez d’abord la CCM préréglée.',
        calcul: () => [`d = ${nbf(M.rf('ester', 0.3) * FRONT, 1)} mm ; L = ${FRONT} mm.`, `Rf = d / L = ${nbf(M.rf('ester', 0.3), 2)}.`], pieges: [[FRONT / (M.rf('ester', 0.3) * FRONT), 'Rf = d / L : la distance du front est au dénominateur (le Rf est inférieur à 1).']],
        expl: 'Rf ≈ 0,74 : l’ester, peu polaire, est très peu retenu par la silice et monte presque avec le front.' } },
    { id: 'polarite', titre: 'Qui est le plus retenu ?', focus: ['scene'],
      texte: <>Regardez la position des trois témoins : la plaque de silice est très polaire.</>,
      tache: { type: 'qcm', q: 'Quelle espèce est la plus retenue par la silice (Rf le plus faible) ?', options: ['l’acide éthanoïque, très polaire (liaisons hydrogène fortes avec la silice)', 'l’ester, car il est le plus volumineux', 'l’alcool, car c’est le plus petit des trois'], bonne: 0,
        expl: 'La silice retient les espèces polaires qui forment des liaisons hydrogène : l’acide carboxylique est le plus retenu, puis l’alcool ; l’ester, moins polaire, est le moins retenu (Rf le plus grand).' } },
    { id: 'fin', titre: 'Quand s’arrêter ?', focus: ['scene'],
      texte: <>Faites varier l’instant du prélèvement (curseur « prélèvement ») : la tache de l’ester grossit, celle du réactif limitant s’affaiblit.</>,
      tache: { type: 'qcm', q: 'La réaction est considérée comme terminée lorsque…', options: ['les taches du mélange ne changent plus d’un prélèvement à l’autre (l’équilibre est atteint)', 'la tache de l’acide a totalement disparu, même sans Dean-Stark', 'la tache de l’ester a la même intensité que celle du témoin'], bonne: 0,
        expl: 'Sans élimination de l’eau, aucun réactif ne disparaît complètement : la réaction est limitée. On arrête quand le mélange ne change plus d’un prélèvement à l’autre. (Avec un Dean-Stark, on peut aussi s’arrêter quand le volume d’eau recueillie n’augmente plus.)' } },
    { id: 'eluant', titre: 'Choisir l’éluant', focus: ['scene', 'reglages'],
      texte: <>Diminuez la proportion d’éthanoate d’éthyle (solvant polaire) à 5{NB}% environ.</>,
      tache: { type: 'action', ok: scene === 'ccm' && cc.p <= 0.06, label: 'Éluant à 5 %', faire: () => { setScene('ccm'); setCc(c => ({ ...c, p: 0.05 })); }, consigne: 'Réglez l’éluant à 5 % d’éthanoate d’éthyle' } },
    { id: 'eluantq', titre: 'Effet de la polarité de l’éluant', focus: ['scene'],
      texte: <>Toutes les taches sont plus proches de la ligne de dépôt.</>,
      tache: { type: 'qcm', q: 'Quand on rend l’éluant moins polaire, les rapports frontaux…', options: ['diminuent : les espèces sont plus retenues par la silice', 'augmentent : l’éluant monte plus vite', 'ne changent pas'], bonne: 0,
        expl: 'Un éluant moins polaire entraîne moins bien les espèces polaires : elles restent plus longtemps adsorbées sur la silice et leur Rf diminue. Il faut choisir un éluant qui sépare bien les trois taches (Rf entre 0,2 et 0,8).' } },
    { id: 'traitement', titre: 'Traitement du mélange', focus: ['scene', 'reglages'],
      texte: <>Après la réaction, on lave la phase organique à l’aide d’une solution d’<strong>hydrogénocarbonate de sodium</strong>, puis on distille. Ouvrez l’onglet « Traitement » : 2 lavages et distillation, après une réaction avec Dean-Stark de 180{NB}min.</>,
      tache: { type: 'action', ok: scene === 'bilan' && rxDSbase && rx.t === 180 && bl.nLav === 2 && bl.dist, label: 'Ouvrir le traitement', faire: () => { setScene('bilan'); setRx({ ...PRESET_RX, ds: true, t: 180 }); setBl(PRESET_BL); }, consigne: 'Onglet « Traitement » : Dean-Stark, t = 180 min, 2 lavages, distillation' } },
    { id: 'lavage', titre: 'Rôle du lavage basique', focus: ['mesures'],
      texte: <>L’acide éthanoïque restant bout à une température voisine de celle de l’ester (118 °C contre 126 °C) : la distillation seule ne l’élimine pas. Le lavage convertit CH₃COOH en ion éthanoate, soluble dans l’eau, avec un dégagement gazeux.</>,
      tache: { type: 'qcm', q: 'Quelle équation modélise le lavage par l’hydrogénocarbonate de sodium ?', options: ['CH₃COOH + HCO₃⁻ → CH₃COO⁻ + CO₂ + H₂O', 'CH₃COOH + Na⁺ → CH₃COONa + H⁺', 'CH₃COOCH₂R + HCO₃⁻ → CH₃COOH + RO⁻'], bonne: 0,
        expl: 'L’ion hydrogénocarbonate est une base : il réagit avec l’acide carboxylique pour donner l’ion éthanoate (dans la phase aqueuse), du dioxyde de carbone (d’où l’effervescence : il faut dégazer l’ampoule à décanter) et de l’eau.' } },
    { id: 'rendfin', titre: 'Le rendement de la synthèse', focus: ['mesures'],
      texte: <>On obtient la masse d’ester indiquée dans « Mesures » après lavages et distillation. Calculez le rendement global de la synthèse (quantité de matière d’ester obtenue / quantité maximale), avec <em>M</em>(éthanoate de butyle) = {nbf(M.COUPLES.butyle.ester.M, 2)}{NB}g·mol⁻¹ et une quantité maximale égale à celle du réactif limitant, soit {nbf(Math.min(nA0, nB0), 3)}{NB}mol.</>,
      tache: { type: 'num', q: 'Rendement de la synthèse', unite: '%', vrai: (() => { const n = M.bilanMasse({ nEster: simDS.E[M.indiceTemps(simDS, 180)], nLavages: 2, distille: true }); return M.rendement(n, nA0, nB0) * 100; })(), tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        bloque: scene === 'bilan' && rxDSbase && rx.t === 180 && bl.nLav === 2 && bl.dist ? null : 'Ouvrez d’abord le traitement préréglé (étape précédente).',
        calcul: () => { const n = M.bilanMasse({ nEster: simDS.E[M.indiceTemps(simDS, 180)], nLavages: 2, distille: true }); return [`m(ester) = ${nbf(n * M.COUPLES.butyle.ester.M, 1)} g ; n = m / M = ${nbf(n * M.COUPLES.butyle.ester.M, 1)} / ${nbf(M.COUPLES.butyle.ester.M, 2)} = ${nbf(n, 3)} mol.`, `n maximale = ${nbf(Math.min(nA0, nB0), 3)} mol, donc η = ${nbf(M.rendement(n, nA0, nB0) * 100, 0)} %.`]; },
        expl: 'Le rendement global est inférieur au rendement de la réaction : on perd un peu d’ester à chaque lavage (échange avec la phase aqueuse) et à la distillation.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>estérification : acide + alcool ⇌ ester + eau ; lente, limitée, athermique (K ≈ 4 pour un alcool primaire)</li>
        <li>le catalyseur acide et la température accélèrent la réaction sans changer l’équilibre</li>
        <li>pour augmenter le rendement : excès d’un réactif ou élimination de l’eau (Dean-Stark, hétéroazéotrope eau/cyclohexane)</li>
        <li>CCM : R<sub>f</sub> = d / L ; plus l’espèce est polaire, plus elle est retenue par la silice (R<sub>f</sub> petit)</li>
        <li>rendement η = n(obtenu) / n(maximal, réactif limitant)</li></ul>,
      texte: <>Vous savez contrôler l’avancement d’une estérification, déplacer son équilibre, la suivre par CCM et calculer un rendement. Essayez maintenant les défis.</>, tache: null },
  ];
  // la bonne réponse des QCM est répartie entre les positions
  const ETAPES_F = ETAPES.map((e, i) => {
    if (e.tache?.type !== 'qcm') return e;
    const o = [...e.tache.options], bonne = o.splice(e.tache.bonne, 1)[0], pos = (i * 2 + 1) % (o.length + 1);
    o.splice(pos, 0, bonne);
    return { ...e, tache: { ...e.tache, options: o, bonne: pos } };
  });
  const idE = ETAPES_F[Math.min(etape, ETAPES_F.length - 1)].id;
  const IDS = ETAPES_F.map(e => e.id), apres = id => !enGuide || etape > IDS.indexOf(id);
  const hl = id => enGuide && ETAPES_F[Math.min(etape, ETAPES_F.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  function nouveauDefi(type) {
    const base = { type, reps: {}, verifie: false };
    if (type === 'rendement') {
      const couple = tire(['butyle', 'propyle']), Cc = M.COUPLES[couple], vA = tire([12, 15, 18, 20]), vB = tire([20, 25, 30, 40]);
      const n = M.molesDepuisVolume(M.ACIDE, vA), nb = M.molesDepuisVolume(Cc.alcool, vB), eta = M.rendementEq(n, nb) * 0.92 * tire([0.6, 0.7, 0.8, 0.9, 1.0]);   // rendement réalisable sans Dean-Stark, pertes comprises
      const m = Math.round(eta * Math.min(n, nb) * Cc.ester.M * 10) / 10;
      setDefi({ ...base, couple, vA, vB, m });
    } else if (type === 'ccm') { setDefi({ ...base, esp: tire(['acide', 'alcool', 'ester']), p: tire([0.2, 0.3, 0.4, 0.5]) }); }
    else { setDefi({ ...base, cible: tire([0.78, 0.82, 0.86]) }); setRx({ couple: 'butyle', vA: 15, vB: 24, cat: false, T: 60, ds: false, t: 120 }); }
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') { if (!defi) nouveauDefi(typeDefi); else if (defi.type === 'equilibre') setRx({ couple: 'butyle', vA: 15, vB: 24, cat: false, T: 60, ds: false, t: 120 }); }
    if (md === 'guide') { setScene('reaction'); setRx(PRESET_RX); setCc(PRESET_CCM); setBl(PRESET_BL); }
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const rendDefi = d => { const Cc = M.COUPLES[d.couple]; const n = M.molesDepuisVolume(M.ACIDE, d.vA), nb = M.molesDepuisVolume(Cc.alcool, d.vB); return d.m / Cc.ester.M / Math.min(n, nb) * 100; };
  // défi « équilibre » : rendement par rapport à l'acide (limitant), atteint à t = 120 min dans les conditions choisies, sans Dean-Stark
  const simEq = useMemo(() => M.simuler({ nA, nB, T: rx.T, cat: rx.cat, ds: false, tmax: 120 }), [nA, nB, rx.T, rx.cat]);
  const rendEqDefi = simEq.E[simEq.E.length - 1] / Math.min(nA, nB);
  const verifier = () => {
    let ok;
    if (defi.type === 'rendement') ok = proche(lireNombre(defi.reps.v), rendDefi(defi), 0.02);
    else if (defi.type === 'ccm') { const x = lireNombre(defi.reps.v); ok = isFinite(x) && Math.abs(x - M.rf(defi.esp, defi.p)) <= 0.04 && defi.reps.esp === defi.esp; }
    else ok = rendEqDefi >= defi.cible && rx.vB <= 90 && rx.vA === 15;
    setDefi(d => ({ ...d, verifie: true, ok }));
    (defi.type === 'rendement' ? noterRend : defi.type === 'ccm' ? noterCcm : noterEq)(ok);
  };
  const champReponse = (cle, unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps[cle] ?? ''} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('es-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['rendement', 'Calculer un rendement'], ['ccm', 'Lire une CCM'], ['equilibre', 'Déplacer l’équilibre']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#9a3412')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'rendement' ? 'Défi : quel est le rendement de la synthèse ?' : defi.type === 'ccm' ? 'Défi : identifier la tache inconnue' : `Défi : atteindre un rendement d’au moins ${nbf(defi.cible * 100, 0)} % sans Dean-Stark`}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'rendement' && (() => { const Cc = M.COUPLES[defi.couple]; return <>On chauffe à reflux, avec catalyseur, {defi.vA}{NB}mL d’acide éthanoïque (<em>ρ</em> = 1,05{NB}g·mL⁻¹, <em>M</em> = 60,05{NB}g·mol⁻¹) et {defi.vB}{NB}mL de {Cc.alcool.nom} (<em>ρ</em> = {nbf(Cc.alcool.rho, 2)}{NB}g·mL⁻¹, <em>M</em> = {nbf(Cc.alcool.M, 2)}{NB}g·mol⁻¹). Après lavages et distillation, on recueille <strong>{nbf(defi.m, 1)}{NB}g</strong> de {Cc.ester.nom} pur (<em>M</em> = {nbf(Cc.ester.M, 2)}{NB}g·mol⁻¹). Déterminez le réactif limitant puis calculez le rendement.</>; })()}
        {defi.type === 'ccm' && <>Sur la plaque, trois témoins (acide, alcool, ester) et une tache <strong>X</strong> d’une espèce inconnue, avec un éluant à {nbf(defi.p * 100, 0)}{NB}% d’éthanoate d’éthyle. Mesurez la distance parcourue par X et celle du front (règle graduée) pour calculer son R<sub>f</sub>, puis identifiez-la en comparant aux témoins.</>}
        {defi.type === 'equilibre' && <>On dispose de 15{NB}mL d’acide éthanoïque et d’au plus 90{NB}mL de butan-1-ol (pas de Dean-Stark). Réglez le volume d’alcool, la température et le catalyseur pour que le rendement par rapport au réactif limitant, <strong>mesuré à t = 120{NB}min</strong>, atteigne la cible, puis vérifiez.</>}
      </div>
      {defi.type === 'rendement' && champReponse('v', '%', 'Rendement')}
      {defi.type === 'ccm' && <>{champReponse('v', '', 'Rf de la tache X')}
        <div role="group" aria-label="Espèce de la tache X" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center', fontSize: 14 }}><span>Espèce :</span>
          {['acide', 'alcool', 'ester'].map(e => <button key={e} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, esp: e }, verifie: false }))} aria-pressed={defi.reps.esp === e} style={stylePetitBouton(defi.reps.esp === e, '#9a3412')}>{e}</button>)}</div></>}
      {defi.type === 'equilibre' && <div style={{ fontSize: 14, marginBottom: 8, color: KIT.txt2 }}>Rendement actuel à t = 120 min : <strong>{nbf(Math.floor(rendEqDefi * 1000) / 10, 1)} %</strong> (cible : {nbf(defi.cible * 100, 0)} %).</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="es-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct.${defi.type === 'rendement' ? ` Rendement : ${nbf(rendDefi(defi), 1)} %.` : defi.type === 'ccm' ? ` Rf = ${nbf(M.rf(defi.esp, defi.p), 2)} : c’est l’${defi.esp === 'ester' ? 'ester' : defi.esp === 'acide' ? 'acide' : 'alcool'}.` : ''}`
          : defi.type === 'rendement' ? '✗ Vérifiez : n = ρ·V / M pour chaque réactif ; le réactif limitant est celui de plus petite quantité (coefficients stœchiométriques égaux à 1) ; n(ester) = m / M ; η = n(ester) / n(limitant).'
            : defi.type === 'ccm' ? '✗ Vérifiez : Rf = d / L (d : du dépôt au centre de la tache ; L : du dépôt au front), puis comparez au Rf du témoin placé dans le même éluant (l’acide est le plus retenu, l’ester le moins).'
              : (!rx.cat || rx.T < 80) ? '✗ Sans catalyseur, ou à trop basse température, l’équilibre n’est pas atteint en 120 min : le rendement mesuré reste faible.'
                : '✗ Le rendement visé n’est pas atteint : la composition à l’équilibre dépend du mélange initial. Pensez à déplacer l’équilibre avec un excès de réactif (un volume d’alcool plus grand).'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Équilibre</strong> : K = 4,0, quel que soit le mélange (alcool primaire) ; K varie très peu avec la température (réaction quasi athermique), on le prend constant. Volume réactionnel constant, solvant non compté, activités = concentrations.</li>
      <li><strong>Cinétique</strong> (modèle de la simulation, pas une mesure ; le volume du milieu est fixé à 60 mL, quelles que soient les quantités introduites) : vitesse v = k<sub>f</sub>[A][B] − k<sub>b</sub>[E][H₂O], k<sub>b</sub> = k<sub>f</sub>/K ; k<sub>f</sub> suit la loi d’Arrhenius (E<sub>a</sub> = 60 kJ·mol⁻¹) et est 100 fois plus petit sans catalyseur acide. Le catalyseur n’est pas consommé.</li>
      <li><strong>Dean-Stark</strong> : l’eau est entraînée avec le cyclohexane tant que la température du bain est d’au moins 80 °C ; elle est retirée à une vitesse proportionnelle à sa quantité dans le ballon. L’eau recueillie est celle de la réaction, mesurée sans erreur.</li>
      <li><strong>CCM</strong> : rapports frontaux calculés par un modèle simple (R<sub>f</sub> = x/(x + k), x = 0,05 + fraction d’éthanoate d’éthyle) qui respecte l’ordre de polarité ester &gt; alcool &gt; acide ; ce ne sont pas des valeurs expérimentales. Intensité des taches saturante avec la quantité déposée.</li>
      <li><strong>Traitement</strong> : on perd {nbf(M.PERTE_LAVAGE * 100, 0)} % de l’ester à chaque lavage et {nbf(M.PERTE_DISTILLATION * 100, 0)} % à la distillation (valeurs de la simulation). Le lavage à l’hydrogénocarbonate élimine tout l’acide restant tant que l’on emploie assez d’ions HCO₃⁻.</li>
      <li><strong>Données</strong> (valeurs de la simulation, proches des tables) : acide éthanoïque M = 60,05 g·mol⁻¹, ρ = 1,05 ; butan-1-ol M = 74,12, ρ = 0,81 ; éthanoate de butyle M = 116,16, ρ = 0,88 ; propan-1-ol M = 60,10, ρ = 0,80 ; éthanoate de propyle M = 102,13, ρ = 0,89.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#9a3412')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scènes ----------
  const Montage = () => {
    const volEau = M.volumeEau_mL(nWd), hEau = Math.min(12, volEau) * 7;                       // 7 px par mL
    const chaud = rx.T >= 80, ds = rx.ds;
    const yBas = 296, yDeb = 206;                                                          // fond du tube gradué ; niveau du trop-plein
    const verre = (x1, y1, x2, y2, k) => <g key={k}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="11" strokeLinecap="butt"/><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f8fafc" strokeWidth="7.5" strokeLinecap="butt"/></g>;
    const fleche = (x, y, c = '#94a3b8') => <polygon points={`${x},${y - 9} ${x + 7},${y + 3} ${x - 7},${y + 3}`} fill={c}/>;
    const lbl = (x, y, t, o = {}) => <text x={x} y={y} fontSize="13" fill={o.c || '#0f172a'} fontWeight={o.b ? 700 : 400} textAnchor={o.a || 'start'}>{t}</text>;
    return (
      <svg viewBox="0 0 570 420" style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
        aria-label={`Schéma du montage de chauffage à reflux${ds ? ' avec Dean-Stark' : ''} : ballon dans un chauffe-ballon, ${ds ? 'tube de Dean-Stark gradué, ' : ''}réfrigérant à eau.${ds ? ` Le tube gradué contient ${nbf(volEau, 1)} millilitres d’eau.` : ''}`}>
        <defs><clipPath id="es-ballon"><circle cx="300" cy="300" r="60"/></clipPath></defs>
        {/* potence et pinces */}
        <rect x="30" y="402" width="150" height="10" rx="3" fill="#64748b"/><rect x="74" y="22" width="12" height="382" fill="#94a3b8"/>
        <line x1="86" y1="96" x2="272" y2="96" stroke="#64748b" strokeWidth="5"/><rect x="266" y="88" width="12" height="16" rx="2" fill="#475569"/>
        <line x1="86" y1="236" x2="288" y2="236" stroke="#64748b" strokeWidth="5"/><rect x="284" y="228" width="12" height="16" rx="2" fill="#475569"/>
        {lbl(96, 90, 'potence et pinces', { c: '#64748b' })}
        {/* support élévateur et chauffe-ballon */}
        <rect x="236" y="384" width="128" height="18" rx="3" fill="#64748b"/>
        {/* ballon */}
        <circle cx="300" cy="300" r="60" fill="#f8fafc"/>
        <rect x="236" y="288" width="128" height="80" fill="#fde68a" opacity="0.85" clipPath="url(#es-ballon)"/>
        <path d="M240,288 Q270,282 300,288 T360,288" fill="none" stroke="#d97706" strokeWidth="1.5" clipPath="url(#es-ballon)"/>
        <circle cx="300" cy="300" r="60" fill="none" stroke="#475569" strokeWidth="2.5"/>
        {chaud && [[272, 330], [292, 320], [316, 334], [334, 322], [304, 346]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="3.2" fill="white" stroke="#d97706" strokeWidth="1"/>)}
        <circle cx="318" cy="352" r="3" fill="#a16207"/><circle cx="276" cy="350" r="3" fill="#a16207"/>
        <path d="M232,318 A68,68 0 0 0 368,318 L368,384 L232,384 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="2"/>
        {chaud && <g stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round"><path d="M262,372 q4,-6 0,-12"/><path d="M300,374 q4,-6 0,-12"/><path d="M338,372 q4,-6 0,-12"/></g>}
        {/* corps vertical sur le ballon */}
        <rect x="287" y="150" width="26" height="92" fill="#f8fafc" stroke="#475569" strokeWidth="2.5"/>
        <rect x="290" y="240" width="20" height="6" fill="#f8fafc"/>
        {/* réfrigérant à eau */}
        <rect x="292" y="14" width="16" height="146" fill="#f8fafc" stroke="#475569" strokeWidth="2"/>
        <rect x="270" y="22" width="60" height="128" rx="5" fill="#dbeafe" stroke="#475569" strokeWidth="2.5"/>
        <rect x="292" y="14" width="16" height="140" fill="#f8fafc" stroke="#475569" strokeWidth="2"/>
        {verre(330, 134, 360, 134, 'in')}{verre(270, 38, 244, 38, 'out')}
        {fleche(283, 100, '#2563eb')}{fleche(317, 100, '#2563eb')}
        {lbl(366, 130, 'arrivée d’eau froide', { c: '#2563eb', b: true })}{lbl(366, 146, '(par le bas)', { c: '#2563eb' })}
        {lbl(240, 34, 'sortie d’eau', { c: '#2563eb', a: 'end', b: true })}{lbl(240, 50, '(par le haut)', { c: '#2563eb', a: 'end' })}
        {lbl(336, 64, 'réfrigérant', { b: true })}{lbl(336, 80, 'à eau', {})}
        {/* vapeurs et condensat */}
        {chaud && <g>{fleche(300, 230)}{fleche(300, 205)}{fleche(300, 180)}</g>}
        {chaud && !ds && [[300, 168], [300, 196]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="3.5" fill="#60a5fa"/>)}
        {/* Dean-Stark */}
        {ds ? <g>
          {verre(313, 180, 373, 192, 'a1')}{verre(373, 211, 313, 220, 'a2')}
          <rect x="372" y="170" width="32" height="128" fill="#f8fafc" stroke="#475569" strokeWidth="2.5"/>
          <rect x="373.5" y={yDeb} width="29" height={yBas - yDeb} fill="#fef9c3"/>
          <rect x="373.5" y={yBas - hEau} width="29" height={hEau} fill="#3b82f6" opacity="0.9"/>
          <rect x="382" y="298" width="12" height="14" fill="#94a3b8" stroke="#475569"/><line x1="376" y1="308" x2="400" y2="308" stroke="#475569" strokeWidth="3"/>
          {[0, 4, 8, 12].map(v => <g key={v}><line x1="404" y1={yBas - 7 * v} x2="414" y2={yBas - 7 * v} stroke="#0f172a" strokeWidth="1.4"/>{lbl(418, yBas - 7 * v + 4, `${v} mL`, { c: '#334155' })}</g>)}
          {chaud && <g><circle cx="390" cy="198" r="3.2" fill="#60a5fa"/><circle cx="390" cy="212" r="3.2" fill="#60a5fa" opacity="0.6"/></g>}
          {lbl(412, 178, 'tube de', { b: true })}{lbl(412, 194, 'Dean-Stark', { b: true })}
          {lbl(462, 236, 'cyclohexane', { c: '#854d0e' })}{lbl(462, 252, '(au-dessus)', { c: '#854d0e' })}
          {lbl(462, 280, 'eau', { c: '#1d4ed8', b: true })}{lbl(462, 296, '(en dessous)', { c: '#1d4ed8' })}
          {lbl(388, 330, 'robinet', { c: '#334155' })}
          <g stroke="#2563eb" strokeWidth="0"><polygon points="334,212 344,206 344,218" fill="#854d0e"/></g>
        </g> : null}
        {/* étiquettes */}
        {lbl(226, 282, 'ballon', { a: 'end', b: true })}{lbl(226, 298, 'mélange réactionnel', { a: 'end' })}
        {lbl(226, 356, 'chauffe-ballon', { a: 'end', b: true })}{lbl(226, 372, `(bain à ${rx.T} °C)`, { a: 'end' })}
        {lbl(226, 200, chaud ? 'vapeurs ↑' : 'pas de reflux', { a: 'end', c: '#64748b' })}
        {lbl(300, 414, 'support élévateur', { a: 'middle', c: '#64748b' })}
      </svg>);
  };
  const Courbes = () => {
    const W = 600, H = 220, mx = 44, X = t => mx + (W - mx - 12) * t / TMAX, Ymax = Math.max(nA, nB, 0.01) * 1.05, Y = n => 14 + (H - 44) * (1 - n / Ymax);
    const ligne = (arr, col, dash) => <path d={arr.filter((_, i) => i % 2 === 0).map((v, i) => `${i ? 'L' : 'M'}${X(sim.t[i * 2]).toFixed(1)},${Y(v).toFixed(1)}`).join('')} fill="none" stroke={col} strokeWidth="2.2" strokeDasharray={dash}/>;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
        aria-label={`Quantités de matière en fonction du temps. À t = ${rx.t} minutes : acide ${nbf(nAt, 3)} mol, alcool ${nbf(nBt, 3)} mol, ester ${nbf(nE, 3)} mol`}>
        <line x1={mx} y1={Y(0)} x2={W - 12} y2={Y(0)} stroke="#94a3b8"/><line x1={mx} y1={Y(0)} x2={mx} y2={Y(Ymax)} stroke="#94a3b8"/>
        {[0, 30, 60, 90, 120, 150, 180].map(t => <text key={t} x={X(t)} y={H - 16} fontSize="11" textAnchor="middle" fill="#334155">{t}</text>)}
        <text x={W / 2} y={H - 2} fontSize="11" textAnchor="middle" fill="#334155">temps (min)</text>
        {[0, 0.25, 0.5, 0.75, 1].map(f => <text key={f} x={mx - 5} y={Y(f * Ymax / 1.05) + 4} fontSize="10.5" textAnchor="end" fill="#334155">{nbf(f * Ymax / 1.05, 2)}</text>)}
        <text x="10" y="18" fontSize="11" fill="#334155">n (mol)</text>
        {ligne(sim.A, COUL.A)}{ligne(sim.B, COUL.B)}{ligne(sim.E, COUL.E)}
        {rx.ds && ligne(sim.Wd, COUL.W, '5 3')}
        <line x1={X(rx.t)} y1={Y(0)} x2={X(rx.t)} y2={Y(Ymax)} stroke="#0f172a" strokeWidth="1.3" strokeDasharray="3 3"/>
        {[[nAt, COUL.A], [nBt, COUL.B], [nE, COUL.E]].map(([v, c], i) => <circle key={i} cx={X(rx.t)} cy={Y(v)} r="4.5" fill={c} stroke="white" strokeWidth="1.5"/>)}
        <g fontSize="11.5" fontWeight="700" transform={`translate(0 ${H - 90})`}><text x={W - 14} y="22" textAnchor="end" fill={COUL.A}>acide</text><text x={W - 14} y="36" textAnchor="end" fill={COUL.B}>{alc.nom}</text><text x={W - 14} y="50" textAnchor="end" fill={COUL.E}>ester</text>{rx.ds && <text x={W - 14} y="64" textAnchor="end" fill={COUL.W}>eau du décanteur</text>}</g>
      </svg>);
  };
  const SceneReaction = () => <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{Montage()}
    <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.5 }}>{rx.ds
      ? <>Le mélange bout : les vapeurs (eau et cyclohexane) montent dans le réfrigérant, se condensent, et les gouttes tombent dans le <strong>tube gradué</strong>. L’<strong>eau</strong>, plus dense, se dépose en bas ; le <strong>cyclohexane</strong>, au-dessus, déborde par le tube de retour et revient dans le ballon.</>
      : <>Chauffage à <strong>reflux</strong> : les vapeurs se condensent dans le réfrigérant et retombent dans le ballon, sans perte de matière.</>}</div>{Courbes()}</div>;

  const SceneCcm = () => {
    const W = 360, H = 330, y0 = 270, pxmm = 4, xs = [60, 130, 200, 270], yf = y0 - FRONT * pxmm;
    const sp = (x, esp, int, lbl) => { const d = M.rf(esp, pC) * FRONT, y = y0 - d * pxmm; return <ellipse key={lbl + esp} cx={x} cy={y} rx={13} ry={9} fill="#7c2d12" opacity={Math.min(0.9, int * 0.9)}/>; };
    const inconnu = dd?.type === 'ccm' ? dd.esp : null;
    return (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ flex: '1 1 300px', maxWidth: 420, background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
          aria-label={`Plaque de CCM, éluant à ${nbf(pC * 100, 0)} % d’éthanoate d’éthyle. Rapports frontaux des témoins : ester ${nbf(M.rf('ester', pC), 2)}, alcool ${nbf(M.rf('alcool', pC), 2)}, acide ${nbf(M.rf('acide', pC), 2)}`}>
          <rect x="20" y={y0 - HPLAQUE * pxmm + 12} width="320" height={HPLAQUE * pxmm - 12 + 30} fill="#f1f5f9" stroke="#94a3b8" rx="4"/>
          <line x1="20" y1={y0} x2="340" y2={y0} stroke="#475569" strokeDasharray="4 3"/><text x="24" y={y0 + 12} fontSize="10.5" fill="#475569">ligne de dépôt</text>
          <line x1="20" y1={yf} x2="340" y2={yf} stroke="#2563eb" strokeDasharray="4 3"/><text x="24" y={yf - 4} fontSize="10.5" fill="#2563eb">front de l’éluant (L = {FRONT} mm)</text>
          {/* règle */}
          <g><line x1="8" y1={y0} x2="8" y2={yf} stroke="#0f172a"/>{[0, 10, 20, 30, 40, 50].map(m => <g key={m}><line x1="8" y1={y0 - m * pxmm} x2="14" y2={y0 - m * pxmm} stroke="#0f172a"/><text x="17" y={y0 - m * pxmm + 3} fontSize="9" fill="#0f172a" stroke="white" strokeWidth="2" paintOrder="stroke">{m}</text></g>)}</g>
          {dd?.type !== 'ccm' && <>{sp(xs[0], 'acide', 0.9, 't')}{sp(xs[1], 'alcool', 0.9, 't')}{sp(xs[2], 'ester', 0.9, 't')}
            {melange.map(m => sp(xs[3], m.esp, m.int, 'm'))}</>}
          {dd?.type === 'ccm' && <>{sp(xs[0], 'acide', 0.9, 't')}{sp(xs[1], 'alcool', 0.9, 't')}{sp(xs[2], 'ester', 0.9, 't')}{sp(xs[3], inconnu, 0.9, 'x')}</>}
          {[['acide', xs[0]], ['alcool', xs[1]], ['ester', xs[2]], [dd?.type === 'ccm' ? 'X' : `mél. ${cc.t} min`, xs[3]]].map(([n, x]) => <text key={n} x={x} y={y0 + 26} fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#0f172a">{n}</text>)}
          <text x="180" y="16" fontSize="11" textAnchor="middle" fill="#475569">plaque de silice, révélée (UV)</text>
        </svg>
      </div>);
  };

  const SceneBilan = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <svg viewBox="0 0 600 150" style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img" aria-label="Étapes du traitement : réaction, lavages, séchage, distillation, pesée">
        {['Mélange réactionnel', `${bl.nLav} lavage${bl.nLav > 1 ? 's' : ''} NaHCO₃`, 'Séchage (MgSO₄)', bl.dist ? 'Distillation' : 'Évaporation du solvant', 'Pesée'].map((t, i) => <g key={t}>
          <rect x={10 + i * 118} y="30" width="106" height="52" rx="8" fill={i === 1 ? '#dbeafe' : '#f1f5f9'} stroke="#64748b"/>
          <text x={63 + i * 118} y="60" fontSize="11.5" fontWeight="700" textAnchor="middle" fill="#0f172a">{t.length > 16 ? t.split(' ').slice(0, 2).join(' ') : t}</text>
          {t.length > 16 && <text x={63 + i * 118} y="74" fontSize="11.5" fontWeight="700" textAnchor="middle" fill="#0f172a">{t.split(' ').slice(2).join(' ')}</text>}
          {i < 4 && <text x={119 + i * 118} y="60" fontSize="16" fill="#64748b">›</text>}</g>)}
        <text x="300" y="118" fontSize="12" textAnchor="middle" fill="#334155">Teb : acide {M.ACIDE.Teb} °C ; {alc.nom} {alc.Teb} °C ; {est.nom} {est.Teb} °C</text>
        <text x="300" y="136" fontSize="11" textAnchor="middle" fill="#475569">(températures d’ébullition voisines : la distillation seule sépare mal le mélange)</text>
      </svg>
    </div>);
  const SceneCalcul = () => { const Cc = M.COUPLES[defi.couple]; return (
    <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
      <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '3px 6px' }}>Espèce</th><th style={{ padding: '3px 6px' }}>M (g/mol)</th><th style={{ padding: '3px 6px' }}>ρ (g/mL)</th><th style={{ padding: '3px 6px' }}>Quantité</th></tr></thead>
      <tbody>
        <tr style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 6px' }}>acide éthanoïque</td><td style={{ padding: '3px 6px' }}>60,05</td><td style={{ padding: '3px 6px' }}>1,05</td><td style={{ padding: '3px 6px' }}>{defi.vA} mL</td></tr>
        <tr style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 6px' }}>{Cc.alcool.nom}</td><td style={{ padding: '3px 6px' }}>{nbf(Cc.alcool.M, 2)}</td><td style={{ padding: '3px 6px' }}>{nbf(Cc.alcool.rho, 2)}</td><td style={{ padding: '3px 6px' }}>{defi.vB} mL</td></tr>
        <tr style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 6px' }}>{Cc.ester.nom} (obtenu)</td><td style={{ padding: '3px 6px' }}>{nbf(Cc.ester.M, 2)}</td><td style={{ padding: '3px 6px' }}>{nbf(Cc.ester.rho, 2)}</td><td style={{ padding: '3px 6px' }}>{nbf(defi.m, 1)} g</td></tr>
      </tbody>
    </table>); };
  const zoneScene = sceneEff === 'reaction' ? SceneReaction() : sceneEff === 'ccm' ? SceneCcm() : sceneEff === 'calcul' ? SceneCalcul() : SceneBilan();
  const ONGLETS = [['reaction', 'Réaction'], ['ccm', 'CCM'], ['bilan', 'Traitement']];
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {ONGLETS.map(([k, l]) => <button key={k} onClick={() => setScene(k)} aria-pressed={scene === k} style={stylePetitBouton(scene === k, '#9a3412')}>{l}</button>)}
      </div>}
      {zoneScene}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>
        {sceneEff === 'reaction' && 'Le trait vertical est l’instant t choisi ; les points donnent les quantités à cet instant.'}
        {sceneEff === 'ccm' && 'L’intensité d’une tache du mélange dépend de la quantité de l’espèce prélevée. La règle verticale est en millimètres, zéro sur la ligne de dépôt.'}
        {sceneEff === 'calcul' && 'Données de l’expérience.'}
        {sceneEff === 'bilan' && 'La masse obtenue dépend de l’avancement atteint et des pertes aux lavages et à la distillation.'}
      </div>
    </div>);

  const reglages = sceneEff === 'calcul' ? null : (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {sceneEff === 'reaction' && <>
        {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{Object.entries(M.COUPLES).map(([k, c]) => <button key={k} onClick={() => setRx(s => ({ ...s, couple: k }))} aria-pressed={rx.couple === k} style={stylePetitBouton(rx.couple === k, '#9a3412')}>{c.ester.nom}</button>)}</div>}
        {!enDefi && <Curseur nom="Volume d’acide éthanoïque" valeur={rx.vA} onChange={v => setRx(s => ({ ...s, vA: v }))} min={5} max={30} pas={1} unite="mL" decimales={0} couleur={COUL.A}/>}
        <Curseur nom={`Volume de ${alc.nom}`} valeur={rx.vB} onChange={v => setRx(s => ({ ...s, vB: v }))} min={5} max={enDefi ? 90 : 90} pas={1} unite="mL" decimales={0} couleur={COUL.B}/>
        <Curseur nom="Température du bain" valeur={rx.T} onChange={v => setRx(s => ({ ...s, T: v }))} min={20} max={120} pas={10} unite="°C" decimales={0} couleur="#475569"/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          <button onClick={() => setRx(s => ({ ...s, cat: !s.cat }))} aria-pressed={rx.cat} style={stylePetitBouton(rx.cat, '#15803d')}>Catalyseur acide</button>
          {!(enDefi && dd?.type === 'equilibre') && <button onClick={() => setRx(s => ({ ...s, ds: !s.ds }))} aria-pressed={rx.ds} style={stylePetitBouton(rx.ds, '#2563eb')}>Dean-Stark (cyclohexane)</button>}
        </div>
        {!(enDefi && dd?.type === 'equilibre') && <Curseur nom="Temps écoulé t" valeur={rx.t} onChange={v => setRx(s => ({ ...s, t: v }))} min={0} max={TMAX} pas={10} unite="min" decimales={0} couleur="#0f172a"/>}
        {enDefi && dd?.type === 'equilibre' && <div style={{ fontSize: 13, color: KIT.txt2 }}>Mesure à t = 120 min (non modifiable).</div>}
      </>}
      {sceneEff === 'ccm' && <>
        {dd?.type === 'ccm' ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Éluant : {nbf(dd.p * 100, 0)} % d’éthanoate d’éthyle dans le cyclohexane.</div> : <>
          <Curseur nom="Éthanoate d’éthyle dans l’éluant" valeur={cc.p * 100} onChange={v => setCc(s => ({ ...s, p: v / 100 }))} min={5} max={90} pas={5} unite="%" decimales={0} couleur="#475569"/>
          <Curseur nom="Prélèvement du mélange à" valeur={cc.t} onChange={v => setCc(s => ({ ...s, t: v }))} min={0} max={TMAX} pas={10} unite="min" decimales={0} couleur="#0f172a"/>
          <div style={{ fontSize: 13, color: KIT.txt2 }}>Mélange équimolaire de la partie « Réaction » (15 mL d’acide, 24 mL de butan-1-ol, 100 °C, catalyseur).</div></>}
      </>}
      {sceneEff === 'bilan' && <>
        <Curseur nom="Nombre de lavages" valeur={bl.nLav} onChange={v => setBl(s => ({ ...s, nLav: v }))} min={0} max={4} pas={1} unite="" decimales={0} couleur="#2563eb"/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}><button onClick={() => setBl(s => ({ ...s, dist: !s.dist }))} aria-pressed={bl.dist} style={stylePetitBouton(bl.dist, '#475569')}>Distillation</button></div>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Les quantités proviennent de la partie « Réaction » : {rx.vA} mL d’acide, {rx.vB} mL de {alc.nom}, t = {rx.t} min{rx.ds ? ', Dean-Stark' : ''}. Modifiez-les dans l’onglet « Réaction ».</div>
      </>}
    </div>);

  const mesures = sceneEff === 'calcul' ? null : (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {sceneEff === 'reaction' && <>
        <LigneMesure nom="Quantité d’acide n(A)" valeur={`${nbf(nAt, 3)}${NB}mol`} couleur={COUL.A}/>
        <LigneMesure nom={`Quantité de ${alc.nom} n(B)`} valeur={`${nbf(nBt, 3)}${NB}mol`} couleur={COUL.B}/>
        <LigneMesure nom="Quantité d’ester n(E)" valeur={`${nbf(nE, 3)}${NB}mol`} couleur={COUL.E}/>
        <LigneMesure nom="Quantité d’eau n(H₂O) dans le ballon" valeur={`${nbf(nW, 3)}${NB}mol`} couleur={COUL.W}/>
        {rx.ds && <LigneMesure nom="Volume d’eau dans le décanteur" valeur={`${nbf(M.volumeEau_mL(nWd), 1)}${NB}mL`} couleur="#2563eb"/>}
        {(!enGuide || apres('quantites')) && !enDefi && <LigneMesure nom="Quantités initiales n₀(A) ; n₀(B)" valeur={`${nbf(nA, 3)} ; ${nbf(nB, 3)}${NB}mol`}/>}
        {!enGuide && !enDefi && <LigneMesure nom="Rendement η = n(E) / n(limitant)" valeur={`${nbf(rend * 100, 0)}${NB}%`} couleur="#15803d"/>}
        {!enGuide && !enDefi && <LigneMesure nom="Rendement à l’équilibre (sans élimination d’eau)" valeur={`${nbf(rendEq * 100, 0)}${NB}%`}/>}
        {!enGuide && !enDefi && isFinite(Qr) && !rx.ds && <LigneMesure nom="Quotient Qr = n(E)·n(H₂O) / (n(A)·n(B))" valeur={nbf(Qr, 2)} couleur={Math.abs(Qr - M.K_EST) < 0.2 ? '#15803d' : KIT.txt}/>}
        {!enGuide && !enDefi && <LigneMesure nom="Constante d’équilibre K" valeur="4,0"/>}
        {enDefi && dd?.type === 'equilibre' && <LigneMesure nom="Rendement à 120 min" valeur={`${nbf(Math.floor(rendEqDefi * 1000) / 10, 1)}${NB}%`} couleur="#15803d"/>}
      </>}
      {sceneEff === 'ccm' && (() => {
        const lignes = dd?.type === 'ccm' ? [['X', dd.esp]] : [['ester', 'ester'], ['alcool', 'alcool'], ['acide', 'acide']];
        return <>
          <LigneMesure nom="Distance du front L" valeur={`${FRONT}${NB}mm`}/>
          {lignes.map(([nom, esp]) => <LigneMesure key={nom} nom={`Distance parcourue par ${nom === 'X' ? 'la tache X' : nom}`} valeur={`${nbf(M.rf(esp, pC) * FRONT, 1)}${NB}mm`} couleur="#b45309"/>)}
          {dd?.type === 'ccm' && <LigneMesure nom="Distance parcourue par l’acide / l’alcool / l’ester" valeur={['acide', 'alcool', 'ester'].map(e => nbf(M.rf(e, pC) * FRONT, 1)).join(' / ') + `${NB}mm`}/>}
          {!enGuide && !enDefi && lignes.map(([nom, esp]) => <LigneMesure key={'r' + nom} nom={`Rf de ${nom}`} valeur={nbf(M.rf(esp, pC), 2)} couleur="#15803d"/>)}
        </>; })()}
      {sceneEff === 'bilan' && <>
        <LigneMesure nom="Ester formé dans la réaction n(E)" valeur={`${nbf(nE, 3)}${NB}mol`}/>
        <LigneMesure nom={`Masse obtenue après traitement (${est.nom})`} valeur={`${nbf(mObt, 1)}${NB}g`} couleur="#b45309"/>
        <LigneMesure nom={`Masse molaire de l’ester M`} valeur={`${nbf(est.M, 2)}${NB}g/mol`}/>
        <LigneMesure nom="Quantités initiales n₀(A) ; n₀(B)" valeur={`${nbf(nA, 3)} ; ${nbf(nB, 3)}${NB}mol`}/>
        {!enGuide && <LigneMesure nom="Rendement de la synthèse" valeur={`${nbf(rendFinal * 100, 0)}${NB}%`} couleur="#15803d"/>}
        {!enGuide && <LigneMesure nom="Masse maximale (réactif limitant)" valeur={`${nbf(mTheo, 1)}${NB}g`}/>}
        {!enGuide && nAt > 0 && <LigneMesure nom="CO₂ dégagé au premier lavage (excès de HCO₃⁻)" valeur={`${nbf(vCO2, 0)}${NB}mL`}/>}
      </>}
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Supprimez le catalyseur, puis baissez la température à 40 °C. Le rendement à l’équilibre change-t-il ? Et le temps pour l’atteindre ?</li>
        <li>Prenez un excès d’acide plutôt que d’alcool. Le rendement par rapport à l’alcool est-il comparable ?</li>
        <li>Avec le Dean-Stark, descendez à 60 °C : pourquoi l’eau n’est-elle plus entraînée ?</li>
        <li>CCM : cherchez l’éluant pour lequel les trois témoins sont bien séparés (taches espacées, Rf entre 0,2 et 0,8).</li>
        <li>Traitement : comparez le rendement avec 0 puis 4 lavages. Que perd-on, que gagne-t-on ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>estérification : acide + alcool ⇌ ester + eau, lente, limitée</li>
        <li>on déplace l’équilibre par un excès de réactif ou l’élimination de l’eau</li>
        <li>R<sub>f</sub> = d / L ; η = n(obtenu) / n(maximal)</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .es-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .es-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .es-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .es-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .es-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .es-l1.cote .es-carte { order: 2; } .es-l1.cote .es-main { order: 1; } }
        @media (max-width: 900px) { .es-l1.cote, .es-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Synthèse organique : estérification</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>ester</strong> se synthétise à partir d’un acide et d’un alcool, mais la réaction est <strong>limitée</strong>. On étudie comment l’accélérer, comment <strong>déplacer l’équilibre</strong> (excès de réactif, Dean-Stark), comment la suivre par <strong>CCM</strong> et comment calculer le <strong>rendement</strong>.</div>
      <div className={`es-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="es-carte"><CarteParcours etapes={ETAPES_F} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="es-carte">{panneauHypo}</div> : null}
        <div className="es-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'rendement' ? suiviRend : defi.type === 'ccm' ? suiviCcm : suiviEq}/></div>}
          <div className={`es-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}</div>
          </div>
        </div>
      </div>
      {!enDefi && <div className="es-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="es-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
