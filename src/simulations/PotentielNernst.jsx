import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, accepte, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./nernstModele";
const { concTexte } = M;
import { regression } from "./conductimetrieAllureModele";
import { QCM_PARCOURS as Q } from "./nernstQcm";
import { ScenePile, Graphe, SvgEshCarte, SvgEchelleCarte, SvgNernstCarte, SvgDroiteCarte, SvgRecapCarte } from "./nernstSchemas";

const SIM_ID = 292, CLE_GUIDE = 'potentiel-nernst-tstl-guide-v1';
declarerDefis(SIM_ID, [['calcul', 'Calculer le potentiel d’un couple'], ['inconnue', 'Concentration inconnue à partir d’une tension']]);

// ====================================================
// SIM 292 — POTENTIEL D'UN COUPLE : ESH ET RELATION DE NERNST (TSTL SPCL, chapitre « Oxydo-réduction »).
//  Capacités visées (jamais affichées à l'élève) : définir l'ESH comme demi-pile de référence ; déterminer le potentiel d'un couple par la relation de Nernst,
//  la composition étant donnée ; prévoir l'influence des concentrations (et du pH) sur le potentiel ; exploiter E = f(log c).
//  Modèle : nernstModele.js (convention de la fiche de synthèse : E = E° + (0,06 / n) log([Ox][H⁺]^β / [Red]), solides = 1). Situations originales.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (v, d = 1) => { const [m, e] = Number(v).toExponential(d).split('e'); return `${m.replace('.', ',')}×10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const C = M.COUPLES;
const CONC_LISTE = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001];
const E_INC = 0.265, C_INC = M.concDepuisE(C.cu, E_INC);                 // défi guidé : tension mesurée au millivolt
const IDS = ['esh', 'standard', 'zinc', 'predire', 'nernst', 'fer', 'mn', 'ph', 'modeliser', 'droite', 'pente', 'inconnue', 'bilan'];

// texte du quotient pour la correction
const quotTxt = c => `${c.oxSolide ? '1' : `[${c.ox}]`}${c.beta ? `[H⁺]${c.beta > 1 ? SUP[c.beta] : ''}` : ''}${c.redSolide ? '' : ` / [${c.red}]`}`;
function detailE(c, cOx, cRed, pH) {
  const q = M.quotient(c, cOx, cRed, pH), E = M.potentiel(c, cOx, cRed, pH);
  const valeurs = `${c.beta ? `[H⁺] = 10${SUP['-']}${[...String(pH)].map(x => SUP[x]).join('')} mol/L ; ` : ''}`;
  return `${valeurs}E = E° + (0,06 / n) × log( ${quotTxt(c)} ), avec E° = ${nbf(c.E0, 2)} V et n = ${c.n}. Quotient = ${sci(q, 2)} ; log = ${nbf(M.log10(q), 2)} ; E = ${nbf(c.E0, 2)} + ${nbf(M.PENTE_NERNST / c.n, 3)} × (${nbf(M.log10(q), 2)}) = ${nbf(E, 3)} V.`;
}
const SelectConc = ({ nom, valeur, onChange }) => (
  <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>{avecIndices(nom)}
    <select value={valeur} onChange={e => onChange(Number(e.target.value))} style={{ font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', marginTop: 2 }}>
      {CONC_LISTE.map(c => <option key={c} value={c}>{concTexte(c)} mol/L</option>)}
    </select></label>);
const SelectPH = ({ valeur, onChange }) => (
  <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>pH de la solution
    <select value={valeur} onChange={e => onChange(Number(e.target.value))} style={{ font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', marginTop: 2 }}>
      {[0, 1, 2, 3, 4].map(p => <option key={p} value={p}>pH = {p}</option>)}
    </select></label>);

// ====================================================
export function SimulationPotentielNernst() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('calcul');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false, releves: true });
  const [reduit] = useState(mouvementReduit);
  const [cPredire, setCPredire] = useState(1), [cMod, setCMod] = useState(1), [pHG, setPHG] = useState(1);
  const [pts, setPts] = useState([]);
  const [ex, setEx] = useState({ id: 'cu', cOx: 1, cRed: 1, pH: 0 }), [relEx, setRelEx] = useState([]);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes ----------
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const reussie = !!(guide.reussies && guide.reussies[etape]);
  const ptsGuide = pts.length >= 4 ? pts : M.pointsDroite(C.cu);
  const droiteGuide = regression(ptsGuide.map(p => ({ x: p.logc, y: p.E })));
  const modeleDroite = idE === 'droite';
  const droiteVisible = enGuide && idE === 'droite' && reussie;

  // situation de la scène selon l'étape
  const sit = (() => {
    switch (idE) {
      case 'zinc': return { c: C.zn, cOx: 1, cRed: 1, pH: 0, E: true };
      case 'predire': return { c: C.cu, cOx: cPredire, cRed: 1, pH: 0, E: reussie };
      case 'nernst': return { c: C.cu, cOx: M.C_NERNST, cRed: 1, pH: 0, E: reussie };
      case 'fer': return { c: C.fe, cOx: M.FE_OX, cRed: M.FE_RED, pH: 0, E: reussie };
      case 'mn': return { c: C.mn, cOx: M.MN_OX, cRed: M.MN_RED, pH: M.MN_PH, E: reussie };
      case 'ph': return { c: C.mn, cOx: M.MN_OX, cRed: M.MN_RED, pH: pHG, E: reussie };
      case 'modeliser': return { c: C.cu, cOx: cMod, cRed: 1, pH: 0, E: true };
      case 'pente': return { c: C.ag, cOx: 1, cRed: 1, pH: 0, E: true };
      case 'inconnue': return { c: C.cu, cOx: C_INC, cRed: 1, pH: 0, E: true, inconnue: true };
      case 'esh': return { c: C.cu, cOx: 1, cRed: 1, pH: 0, E: false };
      default: return { c: C.cu, cOx: 1, cRed: 1, pH: 0, E: true };
    }
  })();
  const dd = enDefi && defi ? defi : null;
  const sc = enGuide ? sit : dd ? (dd.type === 'calcul' ? { c: C[dd.id], cOx: dd.cOx, cRed: dd.cRed, pH: dd.pH, E: false } : { c: C[dd.id], cOx: dd.c, cRed: 1, pH: 0, E: true, inconnue: true }) : { c: C[ex.id], cOx: ex.cOx, cRed: ex.cRed, pH: ex.pH, E: true };
  const Evrai = M.potentiel(sc.c, sc.cOx, sc.cRed, sc.pH);
  const Eaff = sc.E ? (sc.inconnue ? (enGuide ? E_INC : dd.Emes) : Evrai) : null;

  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };

  const ETAPES = [
    { id: 'esh', titre: 'Mesurer un potentiel : l’électrode de référence', focus: ['esh', 'volt'],
      texte: <>Un <strong>potentiel</strong> E (en volts) caractérise un couple oxydant / réducteur (Ox / Red) ; mais on ne peut mesurer qu’une <strong>tension</strong> entre deux électrodes. On associe donc le couple étudié (à droite : cuivre dans une solution de Cu²⁺) à une demi-pile de référence, l’<strong>électrode standard à hydrogène</strong> (ESH, à gauche : platine, dihydrogène à 1 bar, ions H⁺ à 1 mol/L). On convient que son potentiel vaut <strong>0,00 V</strong>. Un pont salin relie les deux solutions et un voltmètre (très grande résistance, donc <strong>aucun courant</strong>) mesure la tension à vide, appelée fem (force électromotrice). Elle s’affichera dès que vous aurez répondu.</>,
      tache: { type: 'qcm', q: 'Que permet de déterminer la tension mesurée entre l’ESH et la demi-pile du couple ?', ...Q.esh,
        expl: 'La fem est la différence entre les potentiels des deux demi-piles : fem = E(couple) − E(ESH). Comme E(ESH) = 0 V par convention, la fem est égale au potentiel du couple : c’est ainsi qu’on dispose d’une échelle de potentiels.',
        indice: 'Une tension est une différence de potentiel entre deux électrodes. Que vaut le potentiel de l’une des deux ?' } },
    { id: 'standard', titre: 'Le potentiel standard du cuivre', focus: ['volt', 'couple'],
      retenirTitre: 'À retenir : une tension, pas un potentiel',
      retenir: <>
        <SvgEshCarte/>
        <Ul>
          <li>On ne mesure jamais un potentiel seul : on mesure la tension à vide entre le couple et l’<strong>ESH</strong>, dont le potentiel vaut <strong>0,00 V</strong> par convention ; cette tension est le potentiel du couple.</li>
          <li>Le <strong>potentiel standard</strong> E° est le potentiel du couple quand toutes les espèces dissoutes sont à 1 mol/L (solides purs, 25 °C).</li>
          <li>Moyen de s’en souvenir : <strong>« ESH = zéro, la fem est E »</strong>. Idée fausse : « la fem mesurée est un potentiel absolu » : elle dépend de la référence choisie.</li>
        </Ul></>,
      texte: <>La solution de Cu²⁺ est à <strong>1 mol/L</strong> : ce sont les conditions standard. Le voltmètre affiche maintenant la tension : c’est le <strong>potentiel standard E°</strong> du couple Cu²⁺ / Cu (notation : E° est le potentiel quand [Cu²⁺] = 1 mol/L). Notez sa valeur, avec son unité.</>,
      tache: { type: 'num', q: 'Quel est le potentiel standard E°(Cu²⁺ / Cu) lu sur le voltmètre ?', unite: 'V', vrai: 0.34, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Le voltmètre affiche 0,34 V : fem = E(Cu²⁺ / Cu) − E(ESH) = E(Cu²⁺ / Cu) − 0 = 0,34 V.', 'E°(Cu²⁺ / Cu) = 0,34 V.'],
        pieges: [[34, 'Vous avez lu 0,34 V comme 34 : repérez la virgule sur le voltmètre.']],
        expl: 'La lecture est 0,34 V : E°(Cu²⁺ / Cu) = 0,34 V.',
        indice: 'Lisez la valeur affichée par le voltmètre, avec sa virgule, en volts.' } },
    { id: 'zinc', titre: 'Comparer deux couples', focus: ['volt', 'couple'],
      texte: <>On remplace le cuivre par une lame de <strong>zinc</strong> dans une solution de Zn²⁺ à 1 mol/L. Le voltmètre indique <strong>−0,76 V</strong>, soit le potentiel standard E°(Zn²⁺ / Zn) : il est <strong>plus petit</strong> que celui de l’ESH (0,00 V), alors que E°(Cu²⁺ / Cu) = 0,34 V est <strong>plus grand</strong>. Plus E° est grand, plus l’oxydant du couple est fort ; plus E° est petit, plus le réducteur est fort.</>,
      tache: { type: 'qcm', q: 'Que peut-on déduire de E°(Zn²⁺ / Zn) < E°(H⁺ / H₂) ?', ...Q.zinc,
        expl: 'Un E° plus petit signifie un réducteur plus fort : Zn cède plus facilement ses électrons que H₂. Un E° négatif ne rend pas la réaction impossible : il signale seulement que le couple est « plus réducteur » que l’ESH.',
        indice: 'Plus E° est petit, plus le réducteur du couple (ici Zn) est fort : il cède facilement des électrons.' } },
    { id: 'predire', titre: 'Si la concentration change…', focus: ['couple', 'volt'],
      retenirTitre: 'À retenir : l’échelle des potentiels standards',
      retenir: <>
        <SvgEchelleCarte/>
        <Ul>
          <li>On classe les couples par E° croissants : plus E° est <strong>grand</strong>, plus l’<strong>oxydant</strong> est fort ; plus E° est <strong>petit</strong>, plus le <strong>réducteur</strong> est fort.</li>
          <li>Un E° se compare à l’ESH : le couple H⁺ / H₂ est le zéro de l’échelle.</li>
          <li>Moyen de s’en souvenir : <strong>« haut = oxydant fort, bas = réducteur fort »</strong>. Idée fausse : « un potentiel négatif empêche toute réaction » : il indique seulement la position sur l’échelle.</li>
        </Ul></>,
      texte: <>Revenons au cuivre. Le potentiel standard concerne une solution à 1 mol/L ; qu’arrive-t-il si on la <strong>dilue</strong> ? Réglez [Cu²⁺] sur 1,0×10⁻² mol/L avec le menu : la solution est diluée 100 fois. Ne regardez pas encore le voltmètre : <strong>prévoyez</strong> le sens de variation, puis validez ; la valeur s’affichera et vous pourrez la vérifier.</>,
      tache: { type: 'qcm', q: 'Quand on dilue la solution de Cu²⁺ de 1 à 1,0×10⁻² mol/L, comment évolue la tension ?', ...Q.predire,
        expl: 'E dépend de la concentration de l’oxydant : quand [Cu²⁺] diminue, le quotient diminue, son logarithme devient négatif et E devient plus petit que E°. Le voltmètre affichera une valeur inférieure à 0,34 V.',
        indice: 'Quand la concentration de l’oxydant diminue, l’oxydant devient-il plus ou moins « fort » ?' } },
    { id: 'nernst', titre: 'La relation de Nernst', focus: ['couple'],
      texte: <>Le potentiel d’un couple dépend de la composition de la solution : à 25 °C, c’est la <strong>relation de Nernst</strong> <strong>E = E° + (0,06 / n) × log( [Ox] / [Red] )</strong>, avec <strong>n</strong> le nombre d’électrons de la demi-équation <strong>Ox + n e⁻ = Red</strong>. Pour un couple métallique, le métal est un solide : son « terme » vaut 1. Ici Cu²⁺ + 2 e⁻ = Cu, donc n&nbsp;=&nbsp;2 et E = 0,34 + (0,06 / 2) × log [Cu²⁺]. La solution est maintenant à [Cu²⁺]&nbsp;=&nbsp;{sci(M.C_NERNST, 1)}&nbsp;mol/L.</>,
      tache: { type: 'num', q: 'Calculez le potentiel E du couple Cu²⁺ / Cu à cette concentration', unite: 'V', vrai: M.potentiel(M.CUIVRE, M.C_NERNST), tol: 0.04, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => [`log(${sci(M.C_NERNST, 1)}) = ${nbf(M.log10(M.C_NERNST), 2)}.`, `E = 0,34 + (0,06 / 2) × (${nbf(M.log10(M.C_NERNST), 2)}) = ${nbf(M.potentiel(M.CUIVRE, M.C_NERNST), 3)} V, soit ${nbf(M.potentiel(M.CUIVRE, M.C_NERNST), 2)} V.`],
        pieges: [[0.34, 'Vous avez donné E° : il faut ajouter le terme (0,06 / n) × log [Cu²⁺].'], [M.CUIVRE.E0 + 0.06 * M.log10(M.C_NERNST), 'Vous avez oublié de diviser 0,06 par n (ici n = 2) : le coefficient est 0,03.'], [M.CUIVRE.E0 - 0.03 * M.log10(M.C_NERNST), 'Signe du logarithme inversé : [Cu²⁺] < 1 mol/L, donc log [Cu²⁺] est négatif et E est plus petit que E°.']],
        expl: `E = 0,34 + 0,03 × log(${sci(M.C_NERNST, 1)}) = ${nbf(M.potentiel(M.CUIVRE, M.C_NERNST), 2)} V.`,
        indice: 'Calculez d’abord log de la concentration avec la calculatrice, puis multipliez par 0,06 / 2 = 0,03 et ajoutez E° = 0,34 V.' } },
    { id: 'fer', titre: 'Les deux espèces sont dissoutes', focus: ['couple'],
      retenirTitre: 'À retenir : la relation de Nernst',
      retenir: <>
        <SvgNernstCarte/>
        <Ul>
          <li>À 25 °C : <strong>E = E° + (0,06 / n) × log( [Ox] / [Red] )</strong> ; n est le nombre d’électrons de la demi-équation, un solide vaut 1.</li>
          <li>Plus [Ox] est grand, plus E est grand ; plus [Red] est grand, plus E est petit ; E = E° quand [Ox] = [Red] = 1 mol/L.</li>
          <li>Moyen de s’en souvenir : <strong>« Ox en haut : E monte avec Ox »</strong>. Idée fausse : « E ne dépend que de E° » : la composition de la solution compte.</li>
        </Ul></>,
      texte: <>Dans le couple <strong>Fe³⁺ / Fe²⁺</strong> (E° = 0,77 V ; Fe³⁺ + e⁻ = Fe²⁺, donc n&nbsp;=&nbsp;1), les deux espèces sont dissoutes : une électrode de platine, inattaquable, transmet les électrons. La solution contient [Fe³⁺]&nbsp;=&nbsp;0,10&nbsp;mol/L et [Fe²⁺]&nbsp;=&nbsp;0,010&nbsp;mol/L : le quotient [Ox] / [Red] vaut 10.</>,
      tache: { type: 'num', q: 'Calculez le potentiel E du couple Fe³⁺ / Fe²⁺ dans cette solution', unite: 'V', vrai: M.potentiel(M.FER, M.FE_OX, M.FE_RED), tol: 0.015, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['[Ox] / [Red] = 0,10 / 0,010 = 10 ; log 10 = 1.', 'E = 0,77 + (0,06 / 1) × 1 = 0,83 V.'],
        pieges: [[0.77, 'Vous avez donné E° : le quotient vaut 10, son logarithme (1) n’est pas nul.'], [0.71, 'Le quotient est inversé : c’est [Ox] / [Red] (oxydant au numérateur), donc log 10 = +1 et non −1.']],
        expl: 'E = 0,77 + 0,06 × log(0,10 / 0,010) = 0,77 + 0,06 = 0,83 V.',
        indice: 'Calculez le quotient [Fe³⁺] / [Fe²⁺] (oxydant au numérateur), puis son logarithme décimal, puis ajoutez 0,06 / 1 fois ce logarithme à E°.' } },
    { id: 'mn', titre: 'Quand des ions H⁺ interviennent', focus: ['couple'],
      texte: <>Le couple <strong>MnO₄⁻ / Mn²⁺</strong> (E° = 1,51 V) a pour demi-équation <strong>MnO₄⁻ + 8 H⁺ + 5 e⁻ = Mn²⁺ + 4 H₂O</strong> : n&nbsp;=&nbsp;5, et les ions H⁺ figurent du côté de l’oxydant. Dans la relation de Nernst, [H⁺] apparaît avec son exposant 8 : <strong>E = E° + (0,06 / 5) × log( [MnO₄⁻] × [H⁺]⁸ / [Mn²⁺] )</strong>. L’eau est le solvant : son « terme » vaut 1. La solution contient [MnO₄⁻]&nbsp;=&nbsp;[Mn²⁺]&nbsp;=&nbsp;2,0×10⁻²&nbsp;mol/L à <strong>pH&nbsp;=&nbsp;1</strong> (donc [H⁺]&nbsp;=&nbsp;0,1&nbsp;mol/L).</>,
      tache: { type: 'num', q: 'Calculez le potentiel E du couple MnO₄⁻ / Mn²⁺ à pH = 1', unite: 'V', vrai: M.potentiel(M.PERMANGANATE, M.MN_OX, M.MN_RED, M.MN_PH), tol: 0.01, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['[MnO₄⁻] = [Mn²⁺], donc leur rapport vaut 1. [H⁺]⁸ = (0,1)⁸ = 10⁻⁸ ; log(10⁻⁸) = −8.', 'E = 1,51 + (0,06 / 5) × (−8) = 1,51 − 0,096 = 1,414 V, soit 1,41 V.'],
        pieges: [[1.51, 'Vous avez oublié le terme en H⁺ : [H⁺]⁸ = 10⁻⁸ n’est pas égal à 1, il faut le prendre en compte.'], [1.51 + 0.012 * -1, 'Vous avez pris l’exposant 1 pour [H⁺] : l’exposant est le coefficient 8 de la demi-équation.'], [1.51 + 0.06 * -8, 'Vous avez oublié de diviser 0,06 par n (n = 5) : le coefficient est 0,012.'], [1.51 + 0.012 * 8, 'Signe inversé : [H⁺] = 10⁻¹ mol/L, donc log([H⁺]⁸) = −8 et non +8.']],
        expl: 'E = 1,51 + 0,012 × log(10⁻⁸) = 1,51 − 0,096 = 1,41 V.',
        indice: 'Le rapport [MnO₄⁻] / [Mn²⁺] vaut 1 (log = 0). Il reste le terme en H⁺ : [H⁺]⁸ = 10⁻⁸. Utilisez le coefficient 0,06 / 5 = 0,012.' } },
    { id: 'ph', titre: 'Le pH change le potentiel', focus: ['couple', 'volt'],
      texte: <>Avec [MnO₄⁻] et [Mn²⁺] inchangées, le pH influence E à travers le terme en H⁺. <strong>Prévoyez</strong> d’abord ce qui se passe quand on <strong>augmente le pH</strong> (donc quand [H⁺] diminue) de 1 à 3 ; la valeur s’affichera après votre réponse, et le menu vous permettra de vérifier à d’autres pH.</>,
      tache: { type: 'qcm', q: 'Quand le pH passe de 1 à 3, comment évolue le potentiel E de MnO₄⁻ / Mn²⁺ ?', ...Q.ph,
        expl: `À pH 3, E = 1,51 + 0,012 × log(10⁻²⁴) = 1,51 − 0,288 = ${nbf(M.potentiel(M.PERMANGANATE, M.MN_OX, M.MN_RED, 3), 2)} V, contre ${nbf(M.potentiel(M.PERMANGANATE, M.MN_OX, M.MN_RED, 1), 2)} V à pH 1 : E baisse de ${nbf(Math.abs(M.penteParPH(M.PERMANGANATE)), 3)} V par unité de pH.`,
        indice: 'H⁺ est du côté de l’oxydant dans la demi-équation : quand [H⁺] diminue, que devient le quotient, puis son logarithme ?' } },
    { id: 'modeliser', titre: 'Relever E pour plusieurs concentrations', focus: ['couple', 'volt'],
      texte: <>On revient au couple Cu²⁺ / Cu. Pour vérifier la relation de Nernst expérimentalement, relevez la tension pour <strong>quatre concentrations</strong> : 1, 0,1, 0,01 et 0,001 mol/L. Choisissez chaque concentration avec le menu, puis appuyez sur « Relever le point » : le tableau se remplit avec log [Cu²⁺] (log c, qui désigne le logarithme décimal de la concentration en mol/L) et la tension E.</>,
      tache: { type: 'action', ok: M.CONC_DROITE.every(c => pts.some(p => Math.abs(p.c - c) < 1e-12)), label: 'Relever les quatre points', faire: () => setPts(M.pointsDroite(M.CUIVRE)), consigne: 'Relevez les quatre concentrations 1 ; 0,1 ; 0,01 ; 0,001 mol/L' } },
    { id: 'droite', titre: 'Les points sont alignés', focus: [],
      texte: <>Les quatre points forment une <strong>droite</strong> : E est une fonction affine de log c. La relation de Nernst le prévoit, puisque E = E° + (0,06 / n) × log c pour ce couple. La <strong>pente</strong> de la droite est le coefficient de log c ; l’ordonnée à l’origine (en log c&nbsp;=&nbsp;0, soit c&nbsp;=&nbsp;1 mol/L) est E°. La droite ajustée s’affichera après votre réponse.</>,
      tache: { type: 'num', q: 'Quelle est la pente de cette droite E = f(log c) ?', unite: 'V par unité de log c', vrai: 0.03, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['Pente = (E₁ − E₂) / (log c₁ − log c₂) = (0,34 − 0,25) / (0 − (−3)) = 0,09 / 3 = 0,030 V par unité de log c.', 'C’est bien 0,06 / n avec n = 2.'],
        pieges: [[0.09, 'Vous avez pris la variation totale de E (0,09 V) : divisez par la variation de log c (3 décades).'], [0.06, 'Vous avez donné 0,06 : il faut diviser par n (n = 2 pour Cu²⁺ / Cu).']],
        expl: 'Pente = Δ E / Δ log c = 0,09 / 3 = 0,030 V par décade, soit 0,06 / 2.',
        indice: 'Prenez deux points du tableau, par exemple le premier et le dernier : calculez ΔE divisé par Δ(log c).' } },
    { id: 'pente', titre: 'La pente dépend de n', focus: ['couple', 'volt'],
      retenirTitre: 'À retenir : E = f(log c) est une droite',
      retenir: <>
        <SvgDroiteCarte/>
        <Ul>
          <li>Pour un couple dont la concentration varie, <strong>E = f(log c)</strong> est une <strong>droite</strong> de pente <strong>0,06 / n</strong> (en V par unité de log c, c’est-à-dire par décade) ; son ordonnée à l’origine est E°.</li>
          <li>Diluer 10 fois la solution fait varier E de 0,06 / n : l’effet est faible, surtout si n est grand.</li>
          <li>Moyen de s’en souvenir : <strong>« 0,06 sur n, par décade »</strong>. Idée fausse : « une concentration 100 fois plus faible divise E par 100 » : E varie de 2 × 0,06 / n, de façon logarithmique.</li>
        </Ul></>,
      texte: <>Le couple <strong>Ag⁺ / Ag</strong> (E° = 0,80 V) a pour demi-équation Ag⁺ + e⁻ = Ag : ici <strong>n&nbsp;=&nbsp;1</strong>. On refait la même étude : la tension relevée pour [Ag⁺]&nbsp;=&nbsp;1&nbsp;mol/L est affichée, et la relation de Nernst s’écrit E = 0,80 + (0,06 / n) × log [Ag⁺].</>,
      tache: { type: 'num', q: 'Quelle est la pente de la droite E = f(log [Ag⁺]) ?', unite: 'V par unité de log c', vrai: 0.06, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Pente = 0,06 / n avec n = 1 pour Ag⁺ + e⁻ = Ag : 0,06 V par unité de log c (par décade).'],
        pieges: [[0.03, 'Vous avez pris n = 2 : pour Ag⁺ + e⁻ = Ag, un seul électron est échangé, n = 1.']],
        expl: 'Pente = 0,06 / n = 0,06 / 1 = 0,06 V par décade.',
        indice: 'La pente est 0,06 / n : combien d’électrons figurent dans la demi-équation de Ag⁺ / Ag ?' } },
    { id: 'inconnue', titre: 'Déterminer une concentration inconnue', focus: ['couple', 'volt'],
      texte: <>On plonge la lame de cuivre dans une solution de Cu²⁺ de concentration <strong>inconnue</strong>, et on mesure à vide la tension avec l’ESH : <strong>{nbf(E_INC, 3)}&nbsp;V</strong>. En inversant la relation de Nernst, E = 0,34 + 0,03 × log [Cu²⁺], on obtient log [Cu²⁺] = (E − 0,34) / 0,03, puis [Cu²⁺] = 10^(log [Cu²⁺]). La tension étant donnée au millivolt, donnez la concentration avec 2 chiffres significatifs.</>,
      tache: { type: 'num', q: 'Quelle est la concentration [Cu²⁺] de la solution ?', unite: 'mol/L', vrai: C_INC, tol: 0.12, affiche: v => sci(v, 1), cs: 2,
        calcul: () => [`log [Cu²⁺] = (${nbf(E_INC, 3)} − 0,34) / 0,03 = ${nbf((E_INC - 0.34) / 0.03, 2)}.`, `[Cu²⁺] = 10^(${nbf((E_INC - 0.34) / 0.03, 2)}) = ${sci(C_INC, 1)} mol/L.`],
        pieges: [[(E_INC - 0.34) / 0.03, 'Vous avez donné log [Cu²⁺] : la concentration est 10 à la puissance ce nombre.'], [Math.pow(10, (E_INC - 0.34) / 0.06), 'Vous avez oublié de diviser 0,06 par n (n = 2) : le coefficient est 0,03.'], [Math.pow(10, -(E_INC - 0.34) / 0.03), 'Signe inversé : E < E°, donc log [Cu²⁺] est négatif et la concentration est inférieure à 1 mol/L.']],
        expl: `log [Cu²⁺] = (${nbf(E_INC, 3)} − 0,34) / 0,03 = ${nbf((E_INC - 0.34) / 0.03, 2)}, donc [Cu²⁺] = ${sci(C_INC, 1)} mol/L.`,
        indice: 'Isolez log [Cu²⁺] dans E = E° + (0,06 / 2) log [Cu²⁺], puis utilisez la touche 10ˣ de la calculatrice.' } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : ce qui fait varier E',
      retenir: <>
        <SvgRecapCarte/>
        <Ul>
          <li>E dépend de E°, de n et des concentrations : <strong>E = E° + (0,06 / n) × log( [Ox] [H⁺]^β / [Red] )</strong> à 25 °C, en tension à vide ; les solides valent 1.</li>
          <li>Plus d’oxydant : E monte ; plus de réducteur : E baisse ; des H⁺ du côté de l’oxydant : E baisse quand le pH augmente.</li>
          <li>Moyen de s’en souvenir : <strong>« Ox monte, Red descend, 0,06 sur n »</strong>. Idée fausse : « E est un nombre fixe du couple » : seul E° l’est.</li>
        </Ul></>,
      texte: <>Vous savez définir l’ESH et le potentiel d’un couple, calculer E avec la relation de Nernst (solides, deux espèces dissoutes, ions H⁺), reconnaître la droite E = f(log c) et en déduire une concentration. Passez à l’exploration pour tester d’autres couples, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'calcul') setDefi({ type, ...M.tirageDefiCalcul(), rep: '', verifie: false });
    else setDefi({ type, ...M.tirageDefiInconnue(), rep: '', verifie: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const TOL_E = 0.011, TOL_C = 0.15;
  const verifier = () => {
    const d = defi; let diag, ok = false;
    const v = lireNombre(d.rep), c = C[d.id];
    if (d.type === 'calcul') {
      const lg = M.log10(M.quotient(c, d.cOx, d.cRed, d.pH)), f = M.PENTE_NERNST / c.n;
      if (!isFinite(v)) diag = { msg: 'Entrez un nombre (par exemple −0,79 ou 0,27), en volts.' };
      else if (Math.abs(v - d.E) <= TOL_E) { ok = true; diag = { msg: '' }; }
      else {
        const lgSansH = M.log10(d.cOx / d.cRed);
        const essais = [
          [c.E0, 'Vous avez donné E° : il faut ajouter le terme (0,06 / n) × log du quotient.'],
          [c.E0 - f * lg, 'Le quotient est inversé : c’est [Ox] au numérateur et [Red] au dénominateur (les solides valent 1).'],
          [c.n > 1 ? c.E0 + M.PENTE_NERNST * lg : null, `Vous avez oublié de diviser 0,06 par n (ici n = ${c.n}).`],
          [c.beta ? c.E0 + f * lgSansH : null, 'Le terme en H⁺ manque : [H⁺]⁸ = 10^(−8 pH) doit figurer dans le quotient.'],
          [c.beta ? c.E0 + f * (lgSansH - d.pH) : null, 'Vous avez pris l’exposant 1 pour [H⁺] : l’exposant est le coefficient 8 de la demi-équation.'],
          [c.beta ? c.E0 + f * (lgSansH + c.beta * d.pH) : null, 'Signe de l’exposant de H⁺ inversé : [H⁺] = 10^(−pH), donc log([H⁺]⁸) = −8 pH.'],
        ].filter(([val]) => val != null && isFinite(val));
        const trouve = essais.find(([val]) => Math.abs(val - d.E) > 0.02 && Math.abs(v - val) <= TOL_E);
        diag = trouve ? { msg: trouve[1] } : { msg: `Votre valeur est ${v < d.E ? 'trop petite' : 'trop grande'}. Refaites le calcul : E = E° + (0,06 / n) × log(quotient), avec n lu dans la demi-équation et le quotient écrit avec [Ox] au numérateur.` };
      }
    } else {
      const lgv = M.log10(d.c), n = c.n;
      if (!isFinite(v) || v <= 0) diag = { msg: 'Entrez un nombre positif, la concentration en mol/L (par exemple 3,2×10⁻³ ou 0,0032).' };
      else if (accepte(v, d.rep, d.c, TOL_C)) { ok = true; diag = { msg: '' }; }
      else {
        const essais = [
          [lgv, 'Vous avez donné log c : la concentration est 10 à la puissance ce nombre.'],
          [n > 1 ? M.concDepuisE({ ...c, n: 1 }, d.Emes) : null, `Vous avez oublié de diviser 0,06 par n (ici n = ${n}) : le coefficient est ${nbf(0.06 / n, 3)}.`],
          [Math.pow(10, -(d.Emes - c.E0) * n / 0.06), 'Signe inversé : si E < E°, la concentration est inférieure à 1 mol/L ; si E > E°, elle est supérieure.'],
        ].filter(([val]) => val != null && isFinite(val));
        const trouve = essais.find(([val]) => Math.abs(val - d.c) > 0.15 * d.c && (Math.abs(v - val) <= 0.12 * Math.abs(val) || (val === lgv && Math.abs(v - val) <= 0.06)));
        diag = trouve ? { msg: trouve[1] } : { msg: `Votre valeur est ${v < d.c ? 'trop petite' : 'trop grande'}. Calculez log c = (E − E°) × n / 0,06, puis c = 10^(log c).` };
      }
    }
    setDefi(s => ({ ...s, verifie: true, ok, diag, corr: false }));
    (d.type === 'calcul' ? noterC : noterI)(ok);
  };
  const correction = d => d.type === 'calcul'
    ? `${detailE(C[d.id], d.cOx, d.cRed, d.pH)} (marge acceptée : ± 0,01 V).`
    : `Pour ${C[d.id].nom}, n = ${C[d.id].n} : log c = (E − E°) × n / 0,06 = (${nbf(d.Emes, 3)} − ${nbf(C[d.id].E0, 2)}) × ${C[d.id].n} / 0,06 = ${nbf(M.log10(M.concDepuisE(C[d.id], d.Emes)), 2)}, donc c = ${sci(M.concDepuisE(C[d.id], d.Emes), 1)} mol/L (marge acceptée : 15 %).`;
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['calcul', 'Calculer E'], ['inconnue', 'Concentration inconnue']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'calcul' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quel est le potentiel du couple ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Le couple <strong>{C[defi.id].nom}</strong> est dans la composition indiquée sous le schéma (à 25 °C). Calculez son potentiel E avec la relation de Nernst, en volts. Demi-équation : {C[defi.id].demi}. Donnée : E° = <strong>{nbf(C[defi.id].E0, 2)}&nbsp;V</strong>.</div>
        <IndiceDefi cache={false}>E = E° + (0,06 / n) × log( [Ox] [H⁺]^β / [Red] ) : n est le nombre d’électrons de la demi-équation ; un solide (métal) vaut 1 ; [H⁺] = 10^(−pH) et β est le coefficient de H⁺ dans la demi-équation.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle est la concentration ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>La concentration en <strong>{C[defi.id].ox}</strong> est inconnue. La tension à vide mesurée avec l’ESH (25 °C) est affichée par le voltmètre : <strong>{nbf(defi.Emes, 3)}&nbsp;V</strong>. Demi-équation : {C[defi.id].demi}. Donnée : E° = <strong>{nbf(C[defi.id].E0, 2)}&nbsp;V</strong>. Donnez la concentration en mol/L avec 2 chiffres significatifs.</div>
        <IndiceDefi cache={false}>Isolez log c : log c = (E − E°) × n / 0,06 (n est le nombre d’électrons de la demi-équation). Puis c = 10 à la puissance log c.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
        <span>{defi.type === 'calcul' ? 'E =' : `[${C[defi.id].ox}] =`}</span>
        <input value={defi.rep} aria-label={defi.type === 'calcul' ? 'potentiel en volts' : 'concentration en mol par litre'} onKeyDown={e => e.key === 'Enter' && document.getElementById('nr-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
          style={{ width: 120, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{defi.type === 'calcul' ? 'V' : 'mol/L'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="nr-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok ? correction(defi) : defi.diag.msg))}
        {!defi.ok && defi.diag.msg && !/^Entrez/.test(defi.diag.msg) && <div style={{ marginTop: 6 }}><button type="button" onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={{ ...styleBouton(false), minHeight: 42 }}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button></div>}
        {!defi.ok && defi.corr && <div style={{ marginTop: 6, fontWeight: 400, color: KIT.txt }}>{avecIndices(correction(defi))}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température : 25 °C.</strong> Le coefficient <strong>0,06 V</strong> est un arrondi de (R T / F) ln 10 = 0,0592 V : l’écart sur E reste de l’ordre du millivolt pour une dizaine de décades.</li>
      <li><strong>Activités assimilées aux concentrations</strong> (solutions diluées, au plus 1 mol/L ici) : à 1 mol/L, l’écart entre activité et concentration n’est pas négligeable dans la réalité, mais on l’ignore comme le programme le permet.</li>
      <li><strong>Tension mesurée à vide</strong> : le voltmètre a une très grande résistance, aucun courant ne circule ; la fem est alors égale à la différence des potentiels des deux demi-piles.</li>
      <li><strong>ESH idéale</strong> : potentiel 0,00 V par convention (dihydrogène à 1 bar, [H⁺] = 1 mol/L) ; le potentiel de jonction du pont salin est négligé.</li>
      <li><strong>Solides et solvant</strong> : le métal solide et l’eau valent 1 dans le quotient de la relation de Nernst ; les deux espèces d’un couple doivent être présentes pour que E ait un sens.</li>
      <li><strong>Potentiels standards</strong> : valeurs tabulées arrondies au centivolt (E°(MnO₄⁻ / Mn²⁺) = 1,51 V…), supposées constantes.</li>
      <li><strong>Mesures simulées</strong> : aucun bruit de mesure n’est ajouté ; en laboratoire, la tension fluctue de quelques millivolts, ce qui limite la précision d’une concentration déduite de E (une erreur de 3 mV sur Cu²⁺ donne déjà environ 25 % sur c).</li>
      <li><strong>Schéma</strong> : un point représente une quantité relative d’ions (de 1 mmol/L à 1 mol/L, échelle logarithmique) ; l’agitation est schématique.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène ----------
  const montrerScene = enGuide && !modeleDroite || enDefi || enExplore;
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('esh'), ...cadre('couple'), ...cadre('volt') }}>
      <ScenePile couple={sc.c} cOx={sc.cOx} cRed={sc.cRed} pH={sc.pH} E={Eaff} anime={!reduit} masquerConc={!!sc.inconnue} decE={sc.inconnue ? 3 : 2} hl={hl}/>
    </div>);
  const reglagesGuide = enGuide && (idE === 'predire' || idE === 'modeliser' || idE === 'ph') && (
    <div style={styleBoite}>
      {idE === 'predire' && <SelectConc nom="Concentration [Cu²⁺]" valeur={cPredire} onChange={setCPredire}/>}
      {idE === 'modeliser' && <>
        <SelectConc nom="Concentration [Cu²⁺]" valeur={cMod} onChange={setCMod}/>
        <button type="button" onClick={() => setPts(p => p.some(q => Math.abs(q.c - cMod) < 1e-12) ? p : [...p, { c: cMod, logc: M.log10(cMod), E: M.potentiel(M.CUIVRE, cMod) }].sort((a, b) => b.c - a.c))} style={{ ...styleBouton(true, '#0369a1'), minHeight: 42 }}>Relever le point</button>
        {pts.length > 0 && <button type="button" onClick={() => setPts([])} style={{ ...styleBouton(false), minHeight: 42, marginLeft: 6 }}>Effacer</button>}
      </>}
      {idE === 'ph' && <SelectPH valeur={pHG} onChange={setPHG}/>}
      <div style={aide}>{idE === 'modeliser' ? 'Chaque point relevé s’ajoute au tableau ci-dessous.' : idE === 'predire' ? 'Le menu règle la concentration de la solution de sulfate de cuivre.' : 'Le menu règle le pH de la solution, sans changer [MnO₄⁻] et [Mn²⁺].'}</div>
    </div>);
  const tableauPts = (lignes, colX = 'log c') => lignes.length > 0 && (
    <div style={{ ...styleBoite, overflowX: 'auto' }}>
      <div style={titreCarte}>Points relevés</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 14, color: KIT.txt, width: '100%' }}>
        <thead><tr style={{ color: KIT.txt2 }}><th style={{ textAlign: 'left', padding: '4px 6px' }}>c (mol/L)</th><th style={{ padding: '4px 6px' }}>{colX}</th><th style={{ padding: '4px 6px' }}>E (V)</th></tr></thead>
        <tbody>{lignes.map((p, i) => <tr key={i} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '4px 6px' }}>{p.c != null ? concTexte(p.c) : '–'}</td><td style={{ padding: '4px 6px', textAlign: 'center' }}>{nbf(p.logc ?? p.pH, p.pH != null ? 0 : 1)}</td><td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{nbf(p.E, 2)}</td></tr>)}</tbody>
      </table>
    </div>);
  const grapheGuide = enGuide && (idE === 'modeliser' ? pts.length >= 1 : idE === 'droite') && (
    <div style={styleBoite}>
      <div style={titreCarte}>Potentiel en fonction de log c (Cu²⁺ / Cu)</div>
      <Graphe points={idE === 'modeliser' ? pts : ptsGuide} droite={droiteVisible && droiteGuide ? droiteGuide : null} marqueur={null} xmin={-3.2} xmax={0.2} titre="E = f(log c)"/>
      {droiteVisible && droiteGuide && <div style={{ ...aide, marginTop: 4, marginBottom: 0 }}>Droite ajustée : E = {nbf(droiteGuide.a, 3)} × log c + {nbf(droiteGuide.b, 2)} (en V) ; son ordonnée à l’origine est E° = 0,34 V.</div>}
    </div>);

  // ---------- exploration ----------
  const cEx = C[ex.id], Eex = M.potentiel(cEx, ex.cOx, ex.cRed, ex.pH);
  const enPH = cEx.beta > 0;
  const relever = () => setRelEx(r => {
    const p = enPH ? { pH: ex.pH, logc: ex.pH, E: Eex } : { c: ex.cOx / (cEx.redSolide ? 1 : ex.cRed), logc: M.log10(M.quotient(cEx, ex.cOx, ex.cRed, 0)), E: Eex };
    const cle = q => (enPH ? q.pH : Number(q.logc.toFixed(4)));
    return r.some(q => cle(q) === cle(p)) ? r : [...r, p].sort((a, b) => a.logc - b.logc);
  });
  const regEx = regression(relEx.map(p => ({ x: p.logc, y: p.E })));
  const changerCouple = id => { setEx({ id, cOx: 1, cRed: id === 'mn' ? 1 : 1, pH: id === 'mn' ? 1 : 0 }); setRelEx([]); };
  const Hconc = enPH ? Math.pow(10, -ex.pH) : null;
  const controlesEx = (
    <div className="nr-ctrl" style={styleBoite}>
      <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>Couple étudié (à droite de l’ESH)
        <select value={ex.id} onChange={e => changerCouple(e.target.value)} style={{ ...menu, marginTop: 2 }}>
          {M.ORDRE_COUPLES.map(id => <option key={id} value={id}>{C[id].nom} (E° = {nbf(C[id].E0, 2)} V)</option>)}
        </select></label>
      <div style={aide}>{cEx.demi} · n = {cEx.n}</div>
      <SelectConc nom={`Concentration [${cEx.ox}]`} valeur={ex.cOx} onChange={v => { setEx(s => ({ ...s, cOx: v })); }}/>
      {!cEx.redSolide && <SelectConc nom={`Concentration [${cEx.red}]`} valeur={ex.cRed} onChange={v => setEx(s => ({ ...s, cRed: v }))}/>}
      {enPH && <SelectPH valeur={ex.pH} onChange={v => setEx(s => ({ ...s, pH: v }))}/>}
      <div style={aide}>Le menu fixe la composition de la demi-pile ; la tension et le schéma se mettent à jour. {cEx.redSolide ? 'Le métal solide vaut 1 dans le quotient.' : ''}</div>
      <button type="button" onClick={relever} style={{ ...styleBouton(true, '#0369a1'), minHeight: 42 }}>Relever le point</button>
      {relEx.length > 0 && <button type="button" onClick={() => setRelEx([])} style={{ ...styleBouton(false), minHeight: 42, marginLeft: 6 }}>Effacer</button>}
    </div>);
  const mesuresEx = (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <LigneMesure nom="Tension à vide (fem) = E du couple" valeur={`${nbf(Eex, 3)} V`} couleur={'#b45309'}/>
      <LigneMesure nom="Quotient dans le logarithme" valeur={sci(M.quotient(cEx, ex.cOx, ex.cRed, ex.pH), 2)}/>
      <LigneMesure nom="Pente par décade 0,06 / n" valeur={`${nbf(M.penteDecade(cEx), 3)} V`}/>
      {enPH && <LigneMesure nom="Variation de E par unité de pH" valeur={`${nbf(M.penteParPH(cEx), 3)} V`}/>}
    </div>);
  const grapheEx = relEx.length > 0 && (
    <div style={styleBoite}>
      <div style={titreCarte}>{enPH ? 'E en fonction du pH' : 'E en fonction de log du quotient [Ox] / [Red]'}</div>
      <Graphe points={relEx.map(p => enPH ? { pH: p.pH, E: p.E } : { logc: p.logc, E: p.E })} x={enPH ? 'ph' : 'logc'} droite={regEx} marqueur={enPH ? { x: ex.pH, E: Eex } : { x: M.log10(M.quotient(cEx, ex.cOx, ex.cRed, 0)), E: Eex }}
        xmin={enPH ? -0.3 : -3.3} xmax={enPH ? 4.3 : 0.3} titre={cEx.nom}/>
      {regEx ? <div style={{ ...aide, marginTop: 4, marginBottom: 0 }}>Ajustement : pente = <strong>{nbf(regEx.a, 3)} V</strong> par {enPH ? 'unité de pH' : 'unité de log'} ({enPH ? `théorie : −0,06 × ${cEx.beta} / ${cEx.n} = ${nbf(M.penteParPH(cEx), 3)}` : `théorie : 0,06 / ${cEx.n} = ${nbf(M.penteDecade(cEx), 3)}`}), ordonnée {enPH ? 'à pH = 0' : 'à l’origine'} = <strong>{nbf(regEx.b, 2)} V</strong>{enPH ? ' (soit E pour [H⁺] = 1 mol/L, avec ces [Ox] et [Red])' : ' (soit E°)'}.</div> : <div style={{ ...aide, marginTop: 4, marginBottom: 0 }}>Relevez au moins deux points avec des valeurs différentes pour voir la droite ajustée.</div>}
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Pour Cu²⁺ / Cu, relevez 4 concentrations puis lisez la pente de la droite. Recommencez avec Ag⁺ / Ag : quelle pente trouvez-vous, et pourquoi est-elle double ?</li>
        <li>Pour Fe³⁺ / Fe²⁺, que vaut E quand [Fe³⁺] = [Fe²⁺] ? Que vaut-il quand le rapport est 10 ? 100 ?</li>
        <li>Pour MnO₄⁻ / Mn²⁺, faites varier le pH de 0 à 4 : de combien E baisse-t-il par unité de pH ? Retrouvez le coefficient avec 0,06 × 8 / 5.</li>
        <li>Quel couple de la liste a l’oxydant le plus fort ? Le réducteur le plus fort ? Classez-les par E° et vérifiez avec l’échelle.</li>
        <li>Pour quelle concentration en Zn²⁺ le potentiel de Zn²⁺ / Zn est-il le plus négatif ? Quelle est la variation maximale de E sur la plage proposée (de 1 mmol/L à 1 mol/L) ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>ESH : potentiel de référence, 0,00 V ; la fem à vide d’une pile ESH | couple est le potentiel du couple</li>
          <li>{avecIndices('Nernst (25 °C) : E = E° + (0,06 / n) × log([Ox] [H⁺]^β / [Red]) ; solides et solvant valent 1')}</li>
          <li>E augmente avec [Ox], diminue avec [Red] ; si H⁺ est du côté de l’oxydant, E baisse quand le pH augmente</li>
          <li>E = f(log c) est une droite de pente 0,06 / n et d’ordonnée à l’origine E°</li>
          <li>On compare les couples avec les E° : E° grand = oxydant fort, E° petit = réducteur fort</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .nr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .nr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .nr-col { display: flex; flex-direction: column; gap: 12px; }
        .nr-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .nr-sc { max-width: 520px; margin: 0 auto; width: 100%; }
        @media (min-width: 901px) { .nr-l1.cote .nr-carte { order: 2; } .nr-l1.cote .nr-main { order: 1; }
          .nr-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .nr-ex > * { grid-column: 1; } .nr-ex > .nr-ctrl-col { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .nr-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .nr-in { animation: nr-fondu 0.35s ease-out; } @keyframes nr-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Potentiel d’un couple : ESH et relation de Nernst</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un potentiel se mesure par rapport à l’<strong>électrode standard à hydrogène</strong> ; la <strong>relation de Nernst</strong> donne ensuite le potentiel d’un couple en fonction de la composition de la solution.</div>
      {!enExplore && <div className={enGuide ? 'nr-l1 cote' : 'nr-l1'}>
        {enGuide ? <div className="nr-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : null}
        <div className="nr-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'calcul' ? suiviC : suiviI}/></div>}
          <div className="nr-col">
            {montrerScene && (enGuide || (enDefi && defi)) && <div className="nr-in nr-sc">{boxScene}</div>}
            {reglagesGuide && <div className="nr-in">{reglagesGuide}</div>}
            {enGuide && idE === 'modeliser' && <div className="nr-in">{tableauPts(pts)}</div>}
            {enGuide && idE === 'droite' && <div className="nr-in">{tableauPts(ptsGuide)}</div>}
            {grapheGuide && <div className="nr-in">{grapheGuide}</div>}
            {enDefi && <div>{panneauHypo}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="nr-ex">
        <div className="nr-sc">{boxScene}</div>
        <div className="nr-ctrl-col">{controlesEx}</div>
        <div>{mesuresEx}</div>
        {grapheEx && <div>{grapheEx}</div>}
        <div>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
