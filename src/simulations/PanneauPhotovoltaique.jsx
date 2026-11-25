import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./panneauPvModele";
import { QCM } from "./panneauPvQcm";
import { SceneCircuit, GrapheIU, GrapheP, SvgMontage, SvgCaracteristique, SvgPuissance, SvgIdeale, SvgEclairement, affInstrument } from "./PanneauPhotovoltaiqueSchemas";

const SIM_ID = 227, CLE_GUIDE = 'panneau-pv-guide-v1';
declarerDefis(SIM_ID, [['pmax', 'Panneau inconnu : puissance maximale'], ['eclairement', 'Un autre éclairement']]);

// ====================================================
//  SIM 227 — PANNEAU PHOTOVOLTAÏQUE (TSTL, enseignement PCM, partie « Énergie électrique », générateurs d'énergie électrique).
//  Une seule idée : un panneau photovoltaïque n'est pas une source idéale de tension ; sa caractéristique I(U) a un plateau (Icc), une chute vers Uco, et P = U × I passe par un maximum.
//  Notions : tension à vide, courant de court-circuit, puissance maximale, comparaison à une source idéale, influence de l'éclairement.
//  Aucune situation des documents du Moodle : petit panneau de laboratoire de 6 cellules, mini-panneau de 3 cellules, grand panneau de 12 cellules, valeurs inventées.
//  Capacités visées (jamais affichées à l'élève) : définir une source idéale de tension ; déterminer la caractéristique intensité-tension d'un panneau photovoltaïque et la comparer à celle d'une source idéale ;
//  citer et exploiter l'expression de la puissance électrique P = U × I ; loi d'Ohm.
//  Modèle : panneauPvModele.js (modèle à une diode, 25 °C). Schémas : PanneauPhotovoltaiqueSchemas.jsx. QCM : panneauPvQcm.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtV = v => String(Number(Number(v).toPrecision(3))).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c' };
const PP = M.PANNEAU_PARCOURS, PA = M.PARCOURS;
const lu3 = x => Number(Number(x).toPrecision(3));               // valeur lue sur un instrument (3 chiffres significatifs)
const libR = R => (R === 0 ? '0 Ω (fil de connexion)' : !isFinite(R) ? '∞ (circuit ouvert)' : `${nbf(R, 0)} Ω`);

// ---------- valeurs de référence du parcours (panneau de laboratoire, E = 1000 W/m²) ----------
const q100 = M.point(PP, PA.E, PA.Ra), U100 = lu3(q100.U), I100 = lu3(1000 * q100.I), P100 = U100 * I100 / 1000;
const UCO = lu3(M.tensionVide(PP, PA.E)), ICC = lu3(1000 * M.courantCC(PP, PA.E)), PM = M.pointPmax(PP, PA.E);
const ICC400 = ICC * PA.E2 / PA.E, UCO400 = lu3(M.tensionVide(PP, PA.E2));

// ---------- formules (MathML) ----------
const FP = <Formule><mi>P</mi><mo>=</mo><mi>U</mi><mo>×</mo><mi>I</mi></Formule>;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };

function SelectR({ id, valeur, onChange }) {
  return (
    <select id={id} value={isFinite(valeur) ? String(valeur) : 'inf'} onChange={ev => onChange(ev.target.value === 'inf' ? Infinity : Number(ev.target.value))} style={selectStyle}>
      {M.R_LISTE.map(r => <option key={String(r)} value={isFinite(r) ? String(r) : 'inf'}>{libR(r)}</option>)}
    </select>);
}
const ligneMesure = (p, E, R) => { const q = M.point(p, E, R); return { R, U: lu3(q.U), I: lu3(1000 * q.I) }; };

// ====================================================
export function SimulationPanneauPhotovoltaique() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('pmax');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ pan: 'lab', E: 1000, R: 100, ideale: false, multi: 'un' });
  const [gR, setGR] = useState(PA.Ra), [gE, setGE] = useState(PA.E), [gPts, setGPts] = useState([]);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['role', 'pui', 'trace', 'allure', 'uco', 'icc', 'zero', 'pmax', 'ideale', 'generateur', 'prevoir', 'eclair', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  const gEeff = enGuide && etape < IDS.indexOf('eclair') ? PA.E : gE;       // l'éclairement ne change qu'à partir de l'étape qui le règle
  const choisirR = v => { setGR(v); setGPts(l => (l.includes(v) ? l : [...l, v])); };
  const nDistincts = new Set([...gPts, gR]).size;

  const ETAPES = [
    { id: 'role', titre: 'Un panneau qui alimente une résistance', focus: ['scene'],
      texte: <>Un petit panneau photovoltaïque de laboratoire, formé de 6 cellules en série, est éclairé par une lampe. L’<strong>éclairement énergétique</strong>, noté <strong>E</strong>, est la puissance lumineuse reçue par mètre carré de panneau (en W/m²) : ici <strong>E = {PA.E} W/m²</strong>. Le panneau alimente une résistance R, qui représente l’appareil à alimenter.</>,
      tache: { type: 'qcm', q: 'Dans ce montage, quel dipôle est le générateur et lequel est le récepteur ?', ...QCM.role,
        expl: 'Le panneau convertit l’énergie lumineuse en énergie électrique : c’est le générateur. La résistance R reçoit cette énergie électrique : c’est le récepteur.', indice: 'Le générateur fournit de l’énergie électrique au circuit, le récepteur en reçoit. Qui convertit ici l’énergie de la lumière ?' } },
    { id: 'pui', titre: 'Mesurer U et I, calculer la puissance', focus: ['scene'],
      texte: <>Deux appareils de mesure apparaissent : un <strong>voltmètre</strong>, qui mesure la tension <strong>U</strong> aux bornes du panneau (en volts, V), et un <strong>ampèremètre</strong>, qui mesure l’intensité <strong>I</strong> du courant dans le circuit (en milliampères, mA). La résistance vaut <strong>R = {PA.Ra} Ω</strong>. La puissance électrique fournie par le panneau est : {FP} Lisez U et I sur les appareils.</>,
      tache: { type: 'num', q: `Puissance électrique P fournie par le panneau pour R = ${PA.Ra} Ω, en watts (W)`, unite: 'W', vrai: P100, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => [`Lectures : U = ${nbf(U100, 2)} V et I = ${nbf(I100, 1)} mA = ${nbf(I100 / 1000, 4)} A`, `P = U × I = ${nbf(U100, 2)} × ${nbf(I100 / 1000, 4)} = ${nbf(P100, 3)} W.`],
        pieges: [[U100 * I100, 'L’intensité est lue en milliampères : U × I donne ici des milliwatts. Pour des watts, convertissez I en ampères (1 mA = 0,001 A).'], [U100 / (I100 / 1000), 'C’est le quotient U divisé par I, c’est-à-dire la résistance R, pas la puissance. La puissance est le produit U × I.']],
        expl: `P = U × I = ${nbf(U100, 2)} V × ${nbf(I100 / 1000, 4)} A = ${nbf(P100, 3)} W, soit environ ${nbf(1000 * P100, 0)} mW.`, indice: 'P = U × I, avec U en volts et I en ampères : convertissez I (affichée en mA) en ampères avant de multiplier.' } },
    { id: 'trace', titre: 'Tracer la caractéristique du panneau', focus: ['scene', 'graphe'],
      retenirTitre: 'À retenir : le montage et la puissance',
      retenir: <>
        <SvgMontage/>
        <ul style={puces}>
          <li>L’<strong>ampèremètre</strong> se place <strong>en série</strong> (le courant le traverse) ; le <strong>voltmètre</strong> se place <strong>en dérivation</strong> aux bornes du dipôle étudié.</li>
          <li>La puissance électrique fournie est <strong>P = U × I</strong>, en watts si U est en volts et I en ampères. Exemple : 2,0 V et 50 mA donnent 0,10 W.</li>
          <li>Moyen de s’en souvenir : <strong>« A en série, V en dérivation »</strong>.</li>
        </ul></>,
      texte: <>Un sélecteur permet maintenant de changer la résistance R, et un graphique apparaît : chaque valeur de R donne un point de coordonnées (U ; I). L’ensemble de ces points est la <strong>caractéristique intensité-tension</strong> du panneau. L’éclairement reste E = {PA.E} W/m².</>,
      tache: { type: 'action', ok: nDistincts >= 6, consigne: `Choisissez au moins 6 valeurs différentes de R, des petites et des grandes (valeurs choisies : ${Math.min(nDistincts, 6)} sur 6).` } },
    { id: 'allure', titre: 'L’allure de la courbe', focus: ['graphe'],
      texte: <>Observez vos points sur le graphique, de la plus petite à la plus grande valeur de la tension U.</>,
      tache: { type: 'qcm', q: 'Quelle est l’allure de la caractéristique I(U) du panneau ?', ...QCM.allure,
        expl: 'Pour les faibles tensions, l’intensité est presque constante ; près de la tension maximale, elle s’effondre. La caractéristique n’est ni une droite ni celle d’un conducteur ohmique.', indice: 'Regardez comment I change entre les points de gauche (U faible) et ceux de droite (U élevée) : change-t-elle de la même façon partout ?' } },
    { id: 'uco', titre: 'La tension à vide Uco', focus: ['scene'],
      texte: <>Quand le circuit est <strong>ouvert</strong> (R infinie), aucun courant ne circule : la tension aux bornes du panneau est sa <strong>tension à vide</strong>, notée <strong>Uco</strong> (« co » pour circuit ouvert). Le graphique trace maintenant la courbe qui passe par vos points.</>,
      tache: { type: 'num', q: 'Tension à vide Uco du panneau, en volts (V)', unite: 'V', vrai: UCO, tol: 0.05, affiche: v => nbf(v, 2),
        bloque: isFinite(gR) ? 'Réglez R sur « ∞ (circuit ouvert) » avec le sélecteur, puis lisez la tension sur le voltmètre.' : null,
        calcul: () => [`R infinie : I = 0 mA et le voltmètre indique U = ${nbf(UCO, 2)} V.`],
        expl: `À vide, le voltmètre indique ${nbf(UCO, 2)} V : c’est la plus grande tension que le panneau puisse atteindre.`, indice: 'Choisissez R = ∞ (circuit ouvert) : l’intensité est alors nulle. Lisez la tension sur le voltmètre.' } },
    { id: 'icc', titre: 'Le courant de court-circuit Icc', focus: ['scene'],
      texte: <>Quand les deux bornes du panneau sont reliées par un simple fil (R = 0), la tension à ses bornes est nulle et l’intensité est la plus grande possible : c’est le <strong>courant de court-circuit</strong>, noté <strong>Icc</strong>. Rappel : la tension à vide vaut Uco = <strong>{nbf(UCO, 2)} V</strong>.</>,
      tache: { type: 'num', q: 'Courant de court-circuit Icc du panneau, en milliampères (mA)', unite: 'mA', vrai: ICC, tol: 0.05, affiche: v => nbf(v, 0),
        bloque: gR === 0 ? null : 'Réglez R sur « 0 Ω (fil de connexion) » avec le sélecteur, puis lisez l’intensité sur l’ampèremètre.',
        pieges: [[ICC / 1000, 'L’ampèremètre indique des milliampères (mA) : 0,2 serait une valeur en ampères. Répondez dans l’unité demandée, le mA.']],
        calcul: () => [`R = 0 : U = 0 V et l’ampèremètre indique I = ${nbf(ICC, 0)} mA.`],
        expl: `Au court-circuit, l’ampèremètre indique ${nbf(ICC, 0)} mA : c’est Icc, la plus grande intensité que le panneau puisse débiter.`, indice: 'Choisissez R = 0 (fil) : la tension aux bornes est alors nulle. Lisez l’intensité sur l’ampèremètre, en mA.' } },
    { id: 'zero', titre: 'Puissance au court-circuit et à vide', focus: ['scene'],
      retenirTitre: 'À retenir : Icc et Uco sur la caractéristique',
      retenir: <>
        <SvgCaracteristique/>
        <ul style={puces}>
          <li>Sur la caractéristique I(U), <strong>Icc</strong> est l’intensité pour <strong>U = 0</strong> (court-circuit) et <strong>Uco</strong> la tension pour <strong>I = 0</strong> (circuit ouvert). Entre les deux, I reste presque constant, puis chute.</li>
          <li>Exemple d’un mini-panneau de 3 cellules : Icc = 96 mA et Uco = 1,85 V.</li>
          <li>Moyen de s’en souvenir : <strong>« court-circuit : U nulle, I maximale ; circuit ouvert : I nulle, U maximale »</strong>.</li>
        </ul></>,
      texte: <>Pour le panneau étudié, Uco = <strong>{nbf(UCO, 2)} V</strong> et Icc = <strong>{nbf(ICC, 0)} mA</strong>. La puissance fournie est P = U × I. Examinez deux cas extrêmes : le court-circuit (R = 0) et le circuit ouvert (R infinie).</>,
      tache: { type: 'qcm', q: 'Que vaut la puissance P fournie à la résistance dans ces deux cas ?', ...QCM.zero,
        expl: 'Au court-circuit, U = 0 donc P = 0 ; à vide, I = 0 donc P = 0. La puissance est nulle aux deux extrémités : elle passe donc par un maximum entre les deux.', indice: 'P = U × I est un produit : que vaut-il si l’un des deux facteurs est nul ? Quel facteur est nul au court-circuit, lequel à vide ?' } },
    { id: 'pmax', titre: 'La puissance maximale', focus: ['scene', 'mesures', 'graphe'],
      texte: <>La puissance P = U × I s’affiche maintenant dans les mesures, et un second graphique P(U) reprend vos points. En changeant R, cherchez la plus grande puissance que le panneau peut fournir : c’est sa <strong>puissance maximale</strong>, notée <strong>Pmax</strong>, obtenue pour une tension notée <strong>Upm</strong>. Le panneau reste éclairé à E = {PA.E} W/m².</>,
      tache: { type: 'num', q: 'Puissance maximale Pmax du panneau, en watts (W), avec 2 chiffres significatifs', unite: 'W', vrai: PM.P, tol: 0.10, affiche: v => nbf(v, 2), cs: 2,
        pieges: [[UCO * ICC / 1000, 'Uco × Icc est une limite jamais atteinte : aucune résistance ne donne à la fois U = Uco et I = Icc. Cherchez le meilleur produit U × I réellement mesuré.']],
        calcul: () => [`Au maximum : Upm ≈ ${nbf(PM.U, 2)} V et Ipm ≈ ${nbf(1000 * PM.I, 0)} mA (R ≈ ${nbf(PM.R, 0)} Ω).`, `Pmax = Upm × Ipm = ${nbf(PM.U, 2)} × ${nbf(PM.I, 3)} ≈ ${nbf(PM.P, 2)} W.`],
        expl: `Vers R = 15 à 20 Ω, P atteint environ ${nbf(PM.P, 2)} W : c’est Pmax. Elle est obtenue pour Upm ≈ ${nbf(PM.U, 1)} V, au « coude » de la caractéristique.`, indice: 'P = U × I augmente puis diminue quand R change : essayez R = 10, 15, 20 et 25 Ω, et gardez la plus grande valeur de P.' } },
    { id: 'ideale', titre: 'Comparer à une source idéale', focus: ['graphe'],
      retenirTitre: 'À retenir : la puissance maximale',
      retenir: <>
        <SvgPuissance/>
        <ul style={puces}>
          <li>La puissance <strong>P = U × I</strong> est l’aire du rectangle sous la courbe. Elle est <strong>maximale au « coude »</strong> de la caractéristique : on la note Pmax, pour la tension Upm.</li>
          <li>Exemple du mini-panneau à 1000 W/m² : Upm ≈ 1,56 V et Ipm ≈ 90 mA, donc Pmax ≈ 0,14 W. Pmax est toujours inférieure à Uco × Icc.</li>
          <li>Moyen de s’en souvenir : <strong>« Pmax : le plus grand rectangle sous la courbe »</strong>.</li>
        </ul></>,
      texte: <>Une <strong>source idéale de tension</strong> impose la même tension U0 quelle que soit l’intensité : sa caractéristique est une droite verticale, tracée en tirets rouges sur le graphique pour <strong>U0 = {nbf(PA.U0, 1)} V</strong>. On la branche sur une résistance <strong>R = {nbf(PA.Rb, 1)} Ω</strong>.</>,
      tache: { type: 'num', q: `Intensité I fournie par la source idéale de ${nbf(PA.U0, 1)} V à R = ${nbf(PA.Rb, 1)} Ω, en ampères (A)`, unite: 'A', vrai: M.courantSourceIdeale(PA.U0, PA.Rb), tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PA.U0 * PA.Rb, 'Ce produit est U0 × R. La loi d’Ohm s’écrit U = R × I : l’intensité est U divisé par R.'], [PA.Rb / PA.U0, 'Le rapport est inversé : I = U0 divisé par R.']],
        calcul: () => [`Loi d’Ohm : I = U0 ÷ R = ${nbf(PA.U0, 1)} ÷ ${nbf(PA.Rb, 1)} = ${nbf(PA.U0 / PA.Rb, 1)} A.`],
        expl: `Loi d’Ohm : I = U0 ÷ R = ${nbf(PA.U0, 1)} V ÷ ${nbf(PA.Rb, 1)} Ω = ${nbf(PA.U0 / PA.Rb, 1)} A, soit ${nbf(1000 * PA.U0 / PA.Rb, 0)} mA.`, indice: 'Loi d’Ohm : U = R × I, donc I = U0 divisé par R.' } },
    { id: 'generateur', titre: 'Le panneau est-il une source idéale ?', focus: ['scene', 'graphe'],
      texte: <>Réglez R sur <strong>2 Ω</strong> et regardez l’ampèremètre. Comparez avec l’intensité de la source idéale de {nbf(PA.U0, 1)} V sur R = {nbf(PA.Rb, 1)} Ω : {nbf(PA.U0 / PA.Rb, 1)} A, soit {nbf(1000 * PA.U0 / PA.Rb, 0)} mA.</>,
      tache: { type: 'qcm', q: 'Le panneau se comporte-t-il comme une source idéale de tension ?', ...QCM.generateur,
        bloque: gR === 2 ? null : 'Réglez R sur 2 Ω avec le sélecteur pour comparer.',
        expl: 'Sur R = 2 Ω, le panneau ne débite qu’environ 200 mA (son courant de court-circuit), pas 1,5 A : son courant est limité, et sa tension dépend de la résistance branchée. Ce n’est pas une source idéale de tension.', indice: 'Une source idéale de tension fournit la tension qu’elle impose, quelle que soit la résistance. Le panneau a-t-il fourni 1500 mA sur R = 2 Ω ?' } },
    { id: 'prevoir', titre: 'Prévoir l’effet de l’éclairement', focus: [],
      retenirTitre: 'À retenir : source idéale ou panneau',
      retenir: <>
        <SvgIdeale/>
        <ul style={puces}>
          <li>Une <strong>source idéale de tension</strong> impose sa tension : caractéristique <strong>verticale</strong>, l’intensité dépend de la résistance (I = U divisé par R).</li>
          <li>Un <strong>panneau</strong> se comporte plutôt comme un <strong>courant presque imposé</strong> (plateau) : l’intensité varie peu, la tension s’ajuste selon la résistance branchée.</li>
          <li>Moyen de s’en souvenir : <strong>« idéale : U imposée ; panneau : I presque imposé par la lumière »</strong>.</li>
        </ul></>,
      texte: <>On diminue l’éclairement : E passe de {PA.E} W/m² à <strong>{PA.E2} W/m²</strong>. À {PA.E} W/m², le courant de court-circuit est Icc = <strong>{nbf(ICC, 0)} mA</strong>. On admet que <strong>Icc est proportionnel à l’éclairement E</strong> (hypothèse de la simulation, valable de 100 à 1000 W/m²).</>,
      tache: { type: 'num', q: `Courant de court-circuit Icc à ${PA.E2} W/m², en milliampères (mA)`, unite: 'mA', vrai: ICC400, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[ICC * PA.E / PA.E2, 'Le rapport est inversé : l’éclairement diminue, donc Icc diminue aussi.'], [ICC, 'Icc dépend de l’éclairement : elle doit changer quand E change.']],
        calcul: () => [`Icc proportionnel à E : Icc(${PA.E2}) = Icc(${PA.E}) × ${PA.E2} ÷ ${PA.E} = ${nbf(ICC, 0)} × ${nbf(PA.E2 / PA.E, 1)}`, `Icc = ${nbf(ICC400, 0)} mA.`],
        expl: `Icc est multiplié par ${PA.E2} ÷ ${PA.E} = ${nbf(PA.E2 / PA.E, 1)} : ${nbf(ICC, 0)} mA × ${nbf(PA.E2 / PA.E, 1)} = ${nbf(ICC400, 0)} mA.`, indice: 'Si Icc est proportionnel à E, le rapport Icc(400) divisé par Icc(1000) est égal à 400 divisé par 1000.' } },
    { id: 'eclair', titre: 'Vérifier avec le curseur d’éclairement', focus: ['scene', 'graphe'],
      texte: <>Un curseur d’éclairement apparaît. À E = {PA.E} W/m², Icc = <strong>{nbf(ICC, 0)} mA</strong> et Uco = <strong>{nbf(UCO, 2)} V</strong>. Réglez E sur <strong>{PA.E2} W/m²</strong> : le graphique garde la courbe à {PA.E} W/m² en tirets pour comparer.</>,
      tache: { type: 'qcm', q: `Quand E passe de ${PA.E} à ${PA.E2} W/m², comment évoluent Icc et Uco ?`, ...QCM.eclair,
        bloque: gEeff === PA.E2 ? null : `Réglez E sur ${PA.E2} W/m² avec le curseur, puis comparez les points où la courbe coupe les deux axes.`,
        expl: `Icc passe de ${nbf(ICC, 0)} à ${nbf(ICC400, 0)} mA (× ${nbf(PA.E2 / PA.E, 1)}), mais Uco passe seulement de ${nbf(UCO, 2)} V à ${nbf(UCO400, 2)} V : elle varie lentement avec l’éclairement.`, indice: 'Sur le graphique, comparez où chaque courbe coupe l’axe vertical (Icc) et l’axe horizontal (Uco).' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : l’effet de l’éclairement',
      retenir: <>
        <SvgEclairement/>
        <ul style={puces}>
          <li><strong>Icc est proportionnel à l’éclairement E</strong>, alors que <strong>Uco varie très peu</strong> (logarithme de E). La puissance maximale suit à peu près E.</li>
          <li>Exemple du mini-panneau : E divisé par 2 donne Icc divisé par 2 (96 mA puis 48 mA), alors que Uco passe de 1,85 V à 1,78 V seulement.</li>
          <li>Moyen de s’en souvenir : <strong>« la lumière fixe le courant, la tension varie à peine »</strong>.</li>
        </ul></>,
      texte: <>Vous savez tracer et lire la caractéristique d’un panneau photovoltaïque, trouver sa tension à vide, son courant de court-circuit et sa puissance maximale, le comparer à une source idéale et prévoir l’effet de l’éclairement. Explorez avec d’autres panneaux, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- état affiché selon le mode ----------
  const p = enExplore ? M.PANNEAUX[ti.pan] : enDefi && defi ? defi.p : PP;
  const E = enExplore ? ti.E : enDefi && defi?.type === 'pmax' ? defi.E : gEeff;
  const R = enExplore ? ti.R : enDefi && defi ? defi.R ?? 100 : gR;
  const q = M.point(p, E, R);
  const pm = M.pointPmax(p, E);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'pmax') { const d = M.tirageDefiA(); setDefi({ ...d, reps: { P: '', U: '' }, R: 100, rows: [ligneMesure(d.p, d.E, 100)], verifie: false, corr: false }); }
    else setDefi({ ...M.tirageDefiB(), reps: { I: '', P: '' }, verifie: false, corr: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const choisirRDefi = r => setDefi(d => ({ ...d, R: r, verifie: false, rows: d.rows.some(l => l.R === r) ? d.rows : [...d.rows, ligneMesure(d.p, d.E, r)] }));
  const verifier = () => {
    if (defi.type === 'pmax') {
      const P = lireNombre(defi.reps.P), U = lireNombre(defi.reps.U);
      const okP = isFinite(P) && proche(P, defi.Pmax, 0.10), okU = isFinite(U) && proche(U, defi.Upm, 0.10);
      setDefi(x => ({ ...x, verifie: true, ok: okP && okU, okP, okU, sig: x.rows.length })); noterA(okP && okU);
    } else {
      const I = lireNombre(defi.reps.I), P = lireNombre(defi.reps.P);
      const okI = isFinite(I) && proche(I, defi.Icc2, 0.06), okP = isFinite(P) && proche(P, defi.Pmax2, 0.10);
      setDefi(x => ({ ...x, verifie: true, ok: okI && okP, okI, okP })); noterB(okI && okP);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('pv-verif')?.click()} onChange={e2 => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  // messages d'aide ciblés (la valeur du défi n'est jamais donnée avant la correction)
  const diagnosticA = () => {
    const d = defi, msgs = [], P = lireNombre(d.reps.P), U = lireNombre(d.reps.U);
    const meilleur = d.rows.reduce((m, l) => (l.U * l.I / 1000 > m.P ? { P: l.U * l.I / 1000, R: l.R, U: l.U } : m), { P: -1, R: 0, U: 0 });
    if (!isFinite(P)) msgs.push('Pmax : écrivez un nombre (virgule ou point).');
    else if (!d.okP) {
      if (proche(P, d.Pmax * 1000, 0.15) || proche(P, d.Pmax / 1000, 0.15)) msgs.push('Pmax : facteur 1000. U est en volts mais I est lue en milliampères ; pour obtenir des watts, convertissez I en ampères (1 mA = 0,001 A).');
      else if (P > d.Uco * d.Icc * 1.02) msgs.push('Pmax : cette valeur dépasse Uco × Icc, ce qui est impossible. Vérifiez votre calcul de U × I.');
      else if (meilleur.P < 0) msgs.push('Pmax : changez R pour noter des mesures dans le tableau, puis calculez U × I pour chacune.');
      else if (!proche(P, meilleur.P, 0.10)) msgs.push(`Pmax : avec votre tableau, le plus grand produit U × I vaut ${fmtV(meilleur.P)} W (pour R = ${libR(meilleur.R)}). Votre valeur est différente : refaites le calcul en convertissant I en ampères.`);
      else if (P < d.Pmax) msgs.push(`Pmax : votre calcul est cohérent avec votre tableau (${fmtV(meilleur.P)} W), mais le maximum est plus haut : essayez d’autres valeurs de R, surtout autour de celle qui donne la plus grande puissance.`);
      else msgs.push('Pmax : votre valeur est plus grande que la puissance maximale réelle. Recalculez U × I avec les valeurs lues.');
    }
    if (!isFinite(U)) msgs.push('Upm : écrivez un nombre (virgule ou point).');
    else if (!d.okU) {
      if (meilleur.P >= 0 && !proche(U, meilleur.U, 0.10)) msgs.push(`Upm : c’est la tension lue au point de plus grande puissance (pour votre tableau : R = ${libR(meilleur.R)}, U = ${fmtV(meilleur.U)} V).`);
      else msgs.push('Upm : la tension de votre meilleur point est cohérente, mais le vrai maximum se trouve ailleurs : testez d’autres valeurs de R proches.');
    }
    return msgs;
  };
  const diagnosticB = () => {
    const d = defi, msgs = [], I = lireNombre(d.reps.I), P = lireNombre(d.reps.P);
    if (!isFinite(I)) msgs.push('Icc : écrivez un nombre (virgule ou point).');
    else if (!d.okI) {
      if (proche(I, d.Icc1 * d.E1 / d.E2, 0.06)) msgs.push('Icc : le rapport est inversé. L’éclairement diminue, donc Icc diminue aussi.');
      else if (proche(I, d.Icc1, 0.06)) msgs.push('Icc : vous n’avez pas changé la valeur. Icc est proportionnel à l’éclairement : elle doit varier avec E.');
      else if (proche(I, d.Icc2 / 1000, 0.06) || proche(I, d.Icc2 * 1000, 0.06)) msgs.push('Icc : facteur 1000, vérifiez l’unité demandée (milliampères).');
      else msgs.push(`Icc : avec la proportionnalité, Icc2 = Icc1 × E2 divisé par E1 = ${fmtV(d.Icc1)} × ${d.E2} ÷ ${d.E1}. Refaites ce calcul : votre valeur est ${I > d.Icc2 ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(P)) msgs.push('Pmax : écrivez un nombre (virgule ou point).');
    else if (!d.okP) {
      if (proche(P, d.Pmax1 * d.E1 / d.E2, 0.10)) msgs.push('Pmax : le rapport est inversé. L’éclairement diminue, donc Pmax diminue aussi.');
      else if (proche(P, d.Pmax1, 0.10)) msgs.push('Pmax : vous n’avez pas changé la valeur. On admet que Pmax est proportionnelle à l’éclairement.');
      else if (proche(P, d.Pmax2 * 1000, 0.10) || proche(P, d.Pmax2 / 1000, 0.10)) msgs.push('Pmax : facteur 1000, vérifiez l’unité (watts).');
      else msgs.push(`Pmax : avec la proportionnalité, Pmax2 = Pmax1 × E2 divisé par E1 = ${fmtV(d.Pmax1)} × ${d.E2} ÷ ${d.E1}. Votre valeur est ${P > d.Pmax2 ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'pmax'
    ? `Pmax ≈ ${fmt2(defi.Pmax)} W, obtenue pour Upm ≈ ${fmt2(defi.Upm)} V avec I ≈ ${fmt2(defi.Ipm)} mA (R voisine de ${nbf(defi.Rpm, 0)} Ω). Méthode : pour chaque R, calculez P = U × I avec I en ampères, puis gardez la plus grande puissance et la tension correspondante. La puissance est nulle à R = 0 et à R infinie : le maximum se trouve entre les deux, là où la courbe fait son coude. Un écart vient souvent d’une résistance trop éloignée du coude ou d’une intensité laissée en mA.`
    : `Icc2 = Icc1 × E2 ÷ E1 = ${fmtV(defi.Icc1)} × ${defi.E2} ÷ ${defi.E1} = ${fmt2(defi.Icc2)} mA ; Pmax2 = Pmax1 × E2 ÷ E1 = ${fmtV(defi.Pmax1)} × ${defi.E2} ÷ ${defi.E1} = ${fmt2(defi.Pmax2)} W. Icc et Pmax sont (à peu près) proportionnelles à l’éclairement : on les multiplie par E2 ÷ E1, qui est inférieur à 1 car l’éclairement diminue. Uco, elle, change très peu.`;
  const verdictValide = defi?.verifie && (defi.type !== 'pmax' || defi.sig === defi.rows.length);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['pmax', 'Puissance maximale'], ['eclairement', 'Un autre éclairement']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'pmax' ? 'Défi : puissance maximale d’un panneau inconnu' : 'Défi : changer l’éclairement'}</div>
      {defi.type === 'pmax' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un panneau photovoltaïque <strong>inconnu</strong> est éclairé avec <strong>E = {defi.E} W/m²</strong> (température et éclairement supposés constants). Changez la résistance R pour relever des mesures : le tableau garde chaque point. Cherchez la <strong>puissance maximale Pmax</strong> et la tension <strong>Upm</strong> qui lui correspond. Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ ...styleBoite, marginBottom: 8 }}>
          <SceneCircuit E={defi.E} instr U={q.U} I={q.I} R={R} ajustable/>
          <label htmlFor="pv-dr" style={{ ...libelle, marginTop: 8 }}>Résistance R</label>
          <SelectR id="pv-dr" valeur={R} onChange={choisirRDefi}/>
        </div>
        <div style={{ ...styleBoite, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>Tableau de mesures</div>
            <button onClick={() => setDefi(d => ({ ...d, rows: [ligneMesure(d.p, d.E, d.R)], verifie: false }))} style={stylePetitBouton(false)}>Vider</button>
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13.5, textAlign: 'right' }}>
            <thead><tr style={{ color: KIT.txt2 }}><th style={{ textAlign: 'left', padding: '2px 4px' }}>R</th><th style={{ padding: '2px 4px' }}>U (V)</th><th style={{ padding: '2px 4px' }}>I (mA)</th></tr></thead>
            <tbody>{[...defi.rows].sort((a, b) => a.R - b.R).map(l => <tr key={String(l.R)} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ textAlign: 'left', padding: '2px 4px' }}>{libR(l.R)}</td><td style={{ padding: '2px 4px' }}>{nbf(l.U, l.U >= 10 ? 1 : 2)}</td><td style={{ padding: '2px 4px' }}>{fmtV(l.I)}</td></tr>)}</tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Pmax (W) =</span>{champ('P', 'Puissance maximale en watts', verdictValide && defi.okP)}
          <span>Upm (V) =</span>{champ('U', 'Tension Upm en volts', verdictValide && defi.okU)}
        </div>
        <IndiceDefi cache={false}>P = U × I, avec U en volts et I en ampères (l’ampèremètre indique des mA). La puissance est nulle pour R = 0 et pour R infinie : cherchez le maximum entre les deux, en essayant des valeurs de R de plus en plus proches du « coude ». Upm est la tension lue pour ce point.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un panneau photovoltaïque est éclairé avec <strong>E1 = {defi.E1} W/m²</strong>. On mesure : courant de court-circuit <strong>Icc = {fmtV(defi.Icc1)} mA</strong>, tension à vide <strong>Uco = {fmtV(defi.Uco1)} V</strong> et puissance maximale <strong>Pmax = {fmtV(defi.Pmax1)} W</strong>. L’éclairement passe à <strong>E2 = {defi.E2} W/m²</strong>. On admet que Icc et Pmax sont proportionnelles à l’éclairement. Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Icc à E2 (mA) =</span>{champ('I', 'Courant de court-circuit à E2 en milliampères', verdictValide && defi.okI)}
          <span>Pmax à E2 (W) =</span>{champ('P', 'Puissance maximale à E2 en watts', verdictValide && defi.okP)}
        </div>
        <IndiceDefi cache={false}>Si une grandeur est proportionnelle à E, on la multiplie par le rapport E2 divisé par E1 (inférieur à 1 si l’éclairement diminue). La tension à vide, elle, n’est pas demandée.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pv-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {verdictValide && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'pmax' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(d => ({ ...d, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle simplifié à une diode</strong>, sans résistance série ni parallèle : le plateau de la caractéristique est parfaitement horizontal, alors qu’un vrai panneau a un plateau légèrement incliné.</li>
      <li><strong>Température constante de 25 °C</strong> : en réalité, la tension à vide diminue quand le panneau chauffe, ce qui baisse la puissance.</li>
      <li><strong>Éclairement uniforme</strong> sur tout le panneau, de spectre proche de celui du Soleil, entre 100 et 1000 W/m² ; le panneau fonctionne en générateur (0 ≤ U ≤ Uco).</li>
      <li><strong>Icc proportionnel à E</strong> (valable dans ce domaine) ; Uco varie comme le logarithme de E ; la puissance maximale n’est proportionnelle à E qu’à quelques pour cent près (moins de 8 % d’écart pour E de 300 à 1000 W/m²).</li>
      <li><strong>Les paramètres sont inventés pour la simulation</strong> (ordres de grandeur d’un panneau au silicium) ; les instruments sont supposés parfaits (l’ampèremètre n’ajoute aucune résistance, le voltmètre ne prélève aucun courant) et affichent 3 chiffres significatifs.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, réglages, graphiques, mesures ----------
  const instrVisibles = enExplore || (enGuide && deja('pui'));
  const rReglable = enExplore || (enGuide && deja('trace'));
  const eReglable = enExplore || (enGuide && deja('eclair'));
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Panneau photovoltaïque éclairé</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Le voltmètre mesure la tension U aux bornes du panneau, l’ampèremètre l’intensité I du courant qui traverse la résistance R.</div>}
      <SceneCircuit E={E} instr={instrVisibles} U={q.U} I={q.I} R={R} ajustable={rReglable}/>
      {enGuide && rReglable && <div style={{ marginTop: 8 }}>
        <label htmlFor="pv-r" style={libelle}>Résistance R</label>
        <SelectR id="pv-r" valeur={gR} onChange={choisirR}/>
        {eReglable && <div style={{ marginTop: 8 }}><Curseur nom="Éclairement E" valeur={gE} onChange={setGE} min={100} max={1000} pas={100} unite="W/m²" couleur="#b45309"/></div>}
      </div>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="pv-pan" style={libelle}>Panneau</label>
      <select id="pv-pan" value={ti.pan} onChange={ev => setTi(s => ({ ...s, pan: ev.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {M.IDS_PANNEAUX.map(id => <option key={id} value={id}>{M.PANNEAUX[id].nom}</option>)}
      </select>
      <Curseur nom="Éclairement E" valeur={ti.E} onChange={v => setTi(s => ({ ...s, E: v }))} min={100} max={1000} pas={100} unite="W/m²" couleur="#b45309"/>
      <label htmlFor="pv-rr" style={libelle}>Résistance R</label>
      <div style={{ marginBottom: 8 }}><SelectR id="pv-rr" valeur={ti.R} onChange={v => setTi(s => ({ ...s, R: v }))}/></div>
      <label htmlFor="pv-multi" style={libelle}>Courbes affichées</label>
      <select id="pv-multi" value={ti.multi} onChange={ev => setTi(s => ({ ...s, multi: ev.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
        <option value="un">L’éclairement choisi</option>
        <option value="plusieurs">Plusieurs éclairements (1000, 700, 400, 200 W/m²)</option>
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: KIT.txt, minHeight: 42, cursor: 'pointer' }}>
        <input type="checkbox" checked={ti.ideale} onChange={ev => setTi(s => ({ ...s, ideale: ev.target.checked }))} style={{ width: 20, height: 20 }}/>
        Comparer à une source idéale de tension
      </label>
      <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '4px 0 0', lineHeight: 1.5 }}>Le point noir du graphique est le point de fonctionnement pour la résistance choisie.</div>
    </div>);

  const U0 = Math.round(10 * 0.85 * M.tensionVide(p, 1000)) / 10;
  const courbesIU = enExplore
    ? (ti.multi === 'plusieurs' ? [1000, 700, 400, 200].map((e2, i) => ({ E: e2, coul: ['#0369a1', '#0f766e', '#b45309', '#7e22ce'][i] })) : [{ E }])
    : (E !== PA.E ? [{ E: PA.E, coul: '#94a3b8', tirets: true }, { E, coul: '#b45309' }] : [{ E }]);
  const afficherCourbe = enExplore || (enGuide && deja('uco'));
  const ptsMesures = enGuide && E === PA.E ? [...new Set([...gPts, gR])].map(r => M.point(p, E, r)) : [];
  const ideale = enExplore ? (ti.ideale ? U0 : null) : (enGuide && deja('ideale') ? PA.U0 : null);
  const montrerIU = enExplore || (enGuide && deja('trace'));
  const montrerP = enExplore || (enGuide && deja('pmax'));
  const graphI = montrerIU && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Caractéristique intensité-tension</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Chaque point de la courbe correspond à une résistance R différente ; l’éclairement décale la courbe.{ti.multi === 'plusieurs' ? ' La courbe la plus haute est celle de 1000 W/m².' : ''}</div>}
      {afficherCourbe && courbesIU.length > 1 && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{enExplore
        ? courbesIU.map(c => <span key={c.E} style={{ marginRight: 12, whiteSpace: 'nowrap' }}><span style={{ color: c.coul, fontWeight: 800 }}>━</span> {c.E} W/m²</span>)
        : <>Courbe en tirets gris : E = {PA.E} W/m². Courbe orange : E = {E} W/m².</>}</div>}
      <GrapheIU p={p} courbes={afficherCourbe ? courbesIU : []} pts={ptsMesures.map(z => ({ U: z.U, y: 1000 * z.I }))} courant={{ U: q.U, y: 1000 * q.I }} ideale={ideale}/>
    </div>);
  const graphP = montrerP && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Puissance fournie selon la tension</div>
      <GrapheP p={p} courbes={enExplore || deja('ideale') ? (ti.multi === 'plusieurs' && enExplore ? courbesIU.map(c => ({ ...c })) : courbesIU.filter(c => !c.tirets)) : []} pts={ptsMesures.map(z => ({ U: z.U, y: z.P }))} courant={{ U: q.U, y: q.P }}/>
    </div>);
  const montrerMesures = enExplore || (enGuide && deja('pmax'));
  const mesures = montrerMesures && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs lues pour la résistance choisie, puis caractéristiques du panneau pour l’éclairement choisi.</div>}
      <LigneMesure nom="Résistance R" valeur={libR(R)}/>
      <LigneMesure nom="Tension U" valeur={`${affInstrument(q.U)}${NB}V`} couleur={COL.bleu}/>
      <LigneMesure nom="Intensité I" valeur={`${affInstrument(1000 * q.I)}${NB}mA`} couleur={COL.bleu}/>
      <LigneMesure nom="Puissance P = U × I" valeur={`${affInstrument(q.P)}${NB}W`} couleur={COL.orange}/>
      {enExplore && <>
        {ti.ideale && <LigneMesure nom="Source idéale : I = U0 ÷ R" valeur={R === 0 ? 'non définie' : `${affInstrument(1000 * U0 / R)}${NB}mA (U0 = ${nbf(U0, 1)}${NB}V)`} couleur={COL.rouge}/>}
        <div style={{ height: 6 }}/>
        <LigneMesure nom="Courant de court-circuit Icc" valeur={`${affInstrument(1000 * M.courantCC(p, E))}${NB}mA`}/>
        <LigneMesure nom="Tension à vide Uco" valeur={`${affInstrument(M.tensionVide(p, E))}${NB}V`}/>
        <LigneMesure nom="Puissance maximale Pmax" valeur={`${affInstrument(pm.P)}${NB}W (Upm = ${affInstrument(pm.U)}${NB}V)`} couleur={COL.vert}/>
      </>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Faites varier la résistance de 0 à ∞ et suivez le point noir sur la courbe. Pour quelle résistance la puissance est-elle la plus grande ?</li>
      <li>Comparez les trois panneaux : quelle grandeur dépend du nombre de cellules, laquelle de la surface des cellules ?</li>
      <li>Divisez l’éclairement par deux : comparez Icc, Uco et Pmax avec les valeurs précédentes.</li>
      <li>Affichez plusieurs éclairements : les courbes se ressemblent-elles ? Que remarquez-vous à droite, près de Uco ?</li>
      <li>Comparez à une source idéale : sur une très petite résistance, quelle intensité fournirait-elle, et quelle intensité fournit le panneau ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Puissance électrique fournie : P = U × I (watts, volts, ampères)</li>
        <li>Icc : intensité pour U = 0 (court-circuit) ; Uco : tension pour I = 0 (circuit ouvert)</li>
        <li>Caractéristique d’un panneau : plateau de courant puis chute près de Uco ; puissance maximale Pmax au « coude » (tension Upm)</li>
        <li>Source idéale de tension : U imposée (droite verticale), I = U divisé par R</li>
        <li>Icc proportionnel à E ; Uco varie très peu avec E ; Pmax varie à peu près comme E</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pv-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pv-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pv-col { display: flex; flex-direction: column; gap: 12px; }
        .pv-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .pv-l1.cote .pv-carte { order: 2; } .pv-l1.cote .pv-main { order: 1; }
          .pv-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .pv-ex > * { grid-column: 1; }
          .pv-ex > .pv-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .pv-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pv-in { animation: pv-fondu 0.35s ease-out; } @keyframes pv-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Panneau photovoltaïque : caractéristique et puissance maximale</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un panneau photovoltaïque est un <strong>générateur</strong> particulier : il n’est pas une source idéale de tension. On trace sa <strong>caractéristique intensité-tension</strong>, on cherche sa <strong>puissance maximale</strong> et on voit l’effet de l’<strong>éclairement</strong>.</div>
      {!enExplore && <div className={`pv-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="pv-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="pv-carte">{panneauHypo}</div>}
        <div className="pv-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'pmax' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="pv-col">
            <div className="pv-in">{scene}</div>
            {graphI && <div className="pv-in">{graphI}</div>}
            {mesures && <div className="pv-in">{mesures}</div>}
            {graphP && <div className="pv-in">{graphP}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="pv-ex">
          {scene}
          <div className="pv-reg">{reglages}</div>
          {graphI}
          {mesures}
        </div>
        <Section titre="Puissance fournie selon la tension" ouvert={!!ouv.graphe} onBascule={() => bascule('graphe')}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>La puissance P = U × I est nulle pour U = 0 et pour U = Uco ; elle passe par un maximum entre les deux.</div>
          {graphP}
        </Section>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
