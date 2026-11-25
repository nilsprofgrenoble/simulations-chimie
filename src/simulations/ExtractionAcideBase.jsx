import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./extractionAcideBaseModele";
import { QCM } from "./extractionAcideBaseQcm";
import { SceneAmpoule, CourbeE, SvgPartage, SvgFormes, SvgCourbe, SvgChoix, SvgPlan } from "./ExtractionAcideBaseSchemas";

const SIM_ID = 143, CLE_GUIDE = 'extraction-guide-v1';
declarerDefis(SIM_ID, [['extraction', 'Une extraction à un pH donné'], ['passes', 'Plusieurs extractions successives']]);

// ====================================================
//  SIM 143 — EXTRACTION ACIDE-BASE (TSTL, enseignement PCM, séquence 2 « Réactions acido-basiques en solution aqueuse »).
//  Une seule idée : le pH décide si une espèce acide ou basique est sous forme neutre (extractible dans un solvant organique) ou sous forme ionique (elle reste dans l'eau).
//  Notions : deux phases non miscibles, coefficient de partage, forme neutre et ionique, fraction extraite selon le pH et le pKa, extractions successives, séparation d'un mélange acide / base / neutre.
//  Aucune situation des documents du Moodle : acide benzoïque, phénol, aniline, triéthylamine et un composé neutre « N » dans un solvant organique non précisé.
//  Capacité visée (jamais affichée à l'élève) : réaliser une extraction ou une séparation faisant intervenir une espèce acide ou basique.
//  Modèle : extractionAcideBaseModele.js. Schémas : ExtractionAcideBaseSchemas.jsx. QCM : extractionAcideBaseQcm.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtV = v => String(Number(v.toPrecision(3))).replace('.', ',');
const fmtPct = v => (v >= 10 ? nbf(v, 0) : v >= 1 ? nbf(v, 1) : nbf(v, 2));
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c' };
const PRESET = { mode: 'espece', e: 'benz', pH: 3, r: 1, n: 1 };
const PA = M.PARCOURS, B = M.ESPECES.benz, AN = M.ESPECES.aniline;
const a1 = M.arrondiCS(M.alpha(B, PA.pH1), 3), D1 = M.arrondiCS(B.K * a1, 3), E1 = 100 * M.fractionExtraite(18.2, 1), R2 = 100 * M.resteApres(18.2, 1, 2);
const D1a = 18.2;

// ---------- formules (MathML) ----------
const FAlpha = <Formule><mi>α</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><msup><mn>10</mn><mrow><mi>pH</mi><mo>−</mo><mi>pKa</mi></mrow></msup></mrow></mfrac></Formule>;
const FD = <Formule><mi>D</mi><mo>=</mo><mi>K</mi><mo>×</mo><mi>α</mi></Formule>;
const FE = <Formule><mi>E</mi><mo>=</mo><mfrac><mi>D</mi><mrow><mn>1</mn><mo>+</mo><mi>D</mi></mrow></mfrac></Formule>;
const FK = <FormuleEnLigne><mi>K</mi><mo>=</mo><mfrac><mrow><mo>[</mo><mi mathvariant="normal">HA</mi><mo>]</mo><mi mathvariant="normal">org</mi></mrow><mrow><mo>[</mo><mi mathvariant="normal">HA</mi><mo>]</mo><mi mathvariant="normal">aq</mi></mrow></mfrac></FormuleEnLigne>;
const FReste = <Formule><mi>reste</mi><mo>=</mo><msup><mfenced><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><mi>D</mi></mrow></mfrac></mfenced><mi>n</mi></msup></Formule>;

const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
function Equilibres({ partage, base }) {
  return (
    <div style={{ ...styleBoite, textAlign: 'center' }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>Équilibres mis en jeu</div>
      <div style={{ fontSize: 17, color: KIT.txt, lineHeight: 1.7 }} aria-label="Équilibres de partage et acido-basique">
        {partage && <div><Esp>HA(aq)</Esp> ⇌ <Esp>HA(org)</Esp></div>}
        <div><Esp>HA(aq)</Esp> + <Esp>H₂O(ℓ)</Esp> ⇌ <Esp>A⁻(aq)</Esp> + <Esp>H₃O⁺(aq)</Esp></div>
        {base && <div><Esp>BH⁺(aq)</Esp> + <Esp>H₂O(ℓ)</Esp> ⇌ <Esp>B(aq)</Esp> + <Esp>H₃O⁺(aq)</Esp></div>}
      </div>
    </div>);
}
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- groupes de marques pour l'ampoule ----------
// 20 marques par espèce : la part ionique reste dans l'eau, la part neutre se répartit selon K (rapport de volumes r)
function groupesEsp(e, pH, r = 1, n = 20) {
  const al = M.alpha(e, pH), nNeutre = Math.round(n * al), nIon = n - nNeutre, nOrg = Math.round(nNeutre * M.fractionExtraite(e.K, r));
  const fN = e.type === 'acide' ? 'HA' : 'B';
  return [{ forme: fN, nom: `${e.neutre} (neutre)`, org: nOrg, aq: nNeutre - nOrg }, ...(nIon > 0 ? [{ forme: 'ion', nom: `${e.ion} (ion)`, org: 0, aq: nIon }] : [])];
}
const MEL = [['benz', 'HA', 'HA (acide)'], ['aniline', 'B', 'B (base)']];
function groupesMelange(pH, n = 6) {
  const g = [];
  MEL.forEach(([id, forme, nom]) => { const e = M.ESPECES[id], al = M.alpha(e, pH), nN = Math.round(n * al), nOrg = Math.round(nN * M.fractionExtraite(e.K, 1)); g.push({ forme, nom, org: nOrg, aq: nN - nOrg }); const nI = n - nN; if (nI > 0) g.push({ forme: 'ion', nom: `${e.ion} (ion)`, org: 0, aq: nI }); });
  g.push({ forme: 'N', nom: 'N (neutre)', org: Math.round(n * M.fractionExtraite(M.NEUTRE.K, 1)), aq: n - Math.round(n * M.fractionExtraite(M.NEUTRE.K, 1)) });
  return g;
}

// ====================================================
export function SimulationExtractionAcideBase() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviE, noterE] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('extraction');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['phases', 'ionique', 'neutre', 'alpha', 'D', 'E', 'deux', 'choixpH', 'base', 'separation', 'recuperer', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée à chaque étape ----------
  const mel0 = [{ forme: 'HA', nom: 'HA (acide)', org: 6, aq: 0 }, { forme: 'B', nom: 'B (base)', org: 6, aq: 0 }, { forme: 'N', nom: 'N (neutre)', org: 6, aq: 0 }];
  const mel12 = groupesMelange(PA.pHmel);
  const SC = {
    phases:     { groupes: [{ forme: 'HA', nom: 'HA (neutre)', org: 19, aq: 1 }], pH: 1, titre: 'Acide benzoïque en milieu très acide' },
    ionique:    { groupes: [{ forme: 'HA', nom: 'HA (neutre)', org: 19, aq: 1 }], pH: 1, titre: 'Acide benzoïque en milieu très acide' },
    neutre:     { groupes: [], pH: PA.pHneutre, titre: 'Acide benzoïque, pKa 4,2' },
    alpha:      { groupes: [], pH: PA.pH1, titre: 'Acide benzoïque, pKa 4,2' },
    D:          { groupes: [], pH: PA.pH1, titre: 'Acide benzoïque, pKa 4,2' },
    E:          { groupes: [], pH: PA.pH1, titre: 'Acide benzoïque, pKa 4,2' },
    deux:       { groupes: groupesEsp(B, PA.pH1), pH: PA.pH1, titre: 'Acide benzoïque, pH 3,2' },
    choixpH:    { groupes: [], pH: null, titre: 'Acide benzoïque, pKa 4,2' },
    base:       { groupes: [], pH: null, titre: 'Aniline, BH⁺ / B : pKa 4,6' },
    separation: { groupes: mel0, pH: null, titre: 'Mélange dans le solvant organique' },
    recuperer:  { groupes: mel12, pH: PA.pHmel, titre: 'Après ajout d’eau de pH 12' },
    bilan:      { groupes: groupesEsp(B, 2), pH: 2, titre: 'Acide benzoïque récupéré à pH 2' },
  };
  const sg = enGuide ? SC[idE] : null;

  const ETAPES = [
    { id: 'phases', titre: 'Deux liquides qui ne se mélangent pas', focus: ['scene'],
      texte: <>Une ampoule contient de l’eau et un <strong>solvant organique non miscible à l’eau</strong>, qui forment deux phases (l’organique, moins dense, au-dessus). On y dissout de l’acide benzoïque, noté <strong>HA</strong>, en milieu très acide : il reste sous forme moléculaire. Après agitation, on mesure à l’équilibre : <strong>[HA]org = {nbf(PA.Corg, 3)}{NB}mol/L</strong> et <strong>[HA]aq = {nbf(PA.Caq, 4)}{NB}mol/L</strong>.</>,
      tache: { type: 'num', q: 'Coefficient de partage K = [HA]org divisé par [HA]aq (sans unité)', unite: '(sans unité)', vrai: PA.Corg / PA.Caq, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => [`K = [HA]org divisé par [HA]aq = ${nbf(PA.Corg, 3)} divisé par ${nbf(PA.Caq, 4)}`, `K = ${nbf(PA.Corg / PA.Caq, 0)} (sans unité).`],
        pieges: [[PA.Caq / PA.Corg, 'Le rapport est inversé : K = [HA]org divisé par [HA]aq (organique au numérateur).'], [PA.Corg - PA.Caq, 'Un coefficient de partage est un quotient, pas une différence.'], [PA.Corg * PA.Caq, 'Il faut diviser les deux concentrations, pas les multiplier.']],
        expl: `K = ${nbf(PA.Corg, 3)} divisé par ${nbf(PA.Caq, 4)} = ${nbf(PA.Corg / PA.Caq, 0)} : à l’équilibre, HA est 20 fois plus concentré dans l’organique que dans l’eau.`, indice: 'K compare les deux concentrations de la même forme à l’équilibre : concentration dans l’organique divisée par concentration dans l’eau.' } },
    { id: 'ionique', titre: 'Et l’ion ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : DEUX PHASES, UN COEFFICIENT K',
      retenir: <>
        <SvgPartage/>
        <ul style={puces}>
          <li>Une espèce neutre se répartit entre deux phases non miscibles selon son <strong>coefficient de partage</strong> K : {FK}</li>
          <li>Exemple de la simulation : K = 20, soit 20 fois plus de HA dans l’organique que dans l’eau. Un <strong>ion</strong> est très soluble dans l’eau : il ne passe pas dans l’organique.</li>
          <li>Moyen de s’en souvenir : <strong>« le semblable dissout le semblable : neutre vers l’organique, ion vers l’eau »</strong>.</li>
        </ul></>,
      texte: <>L’acide benzoïque est un acide faible : dans l’eau, <strong>HA + H₂O ⇌ A⁻ + H₃O⁺</strong>. En milieu très acide, il est surtout sous forme HA. On ajoute maintenant de la soude à l’eau pour amener son pH à <strong>{PA.pHion}</strong> : la forme majoritaire est alors l’ion benzoate <strong>A⁻</strong>, chargé.</>,
      tache: { type: 'qcm', q: 'Que devient le composé en présence des deux phases ?', ...QCM.ionique,
        expl: 'Un ion est entouré de molécules d’eau et très soluble dans l’eau, il ne passe pas dans le solvant organique. À pH 12, le composé reste donc dans la phase aqueuse sous forme A⁻.', indice: 'Les molécules d’eau sont polaires : quel type d’espèce, neutre ou chargée, y est le plus soluble ?' } },
    { id: 'neutre', titre: 'Quelle forme à pH 2 ?', focus: ['scene'],
      texte: <>On revient à une phase aqueuse de <strong>pH {nbf(PA.pHneutre, 1)}</strong>. Le couple HA / A⁻ de l’acide benzoïque a pour <strong>pKa = 4,2</strong>. Rappel : si le pH est inférieur au pKa, l’espèce acide prédomine ; sinon c’est la base du couple.</>,
      tache: { type: 'qcm', q: 'Quelle forme prédomine, et où se trouve surtout le composé ?', ...QCM.neutre,
        expl: 'À pH 2, inférieur au pKa de 4,2 : l’acide HA prédomine. Il est neutre : il passe dans le solvant organique.', indice: 'Comparez le pH 2,0 au pKa 4,2 : dans un couple, au-dessous du pKa, c’est l’acide qui prédomine.' } },
    { id: 'alpha', titre: 'Quelle part reste sous forme HA ?', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : NEUTRE OU ION, LE pH DÉCIDE',
      retenir: <>
        <SvgFormes/>
        <ul style={puces}>
          <li>La forme <strong>neutre</strong> est extraite dans l’organique, la forme <strong>ionique</strong> reste dans l’eau. Pour un acide, la forme neutre est HA (pH inférieur au pKa) ; pour une base, c’est B (pH supérieur au pKa).</li>
          <li>La part de la forme neutre : {FAlpha} pour un acide.</li>
          <li>Moyen de s’en souvenir : <strong>« la frontière est le pKa du couple »</strong>.</li>
        </ul></>,
      texte: <>On fixe le pH de la phase aqueuse à <strong>{nbf(PA.pH1, 1)}</strong>, avec pKa = 4,2. La fraction de l’acide sous forme neutre HA est donnée par : {FAlpha}</>,
      tache: { type: 'num', q: 'Fraction α de l’acide benzoïque sous forme HA à pH 3,2 (sans unité)', unite: '(sans unité)', vrai: M.alpha(B, PA.pH1), tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => [`pH − pKa = ${nbf(PA.pH1, 1)} − 4,2 = ${nbf(PA.pH1 - 4.2, 1)}`, `α = 1 divisé par (1 + 10^(${nbf(PA.pH1 - 4.2, 1)})) = 1 divisé par ${nbf(1 + 10 ** (PA.pH1 - 4.2), 2)} = ${nbf(M.alpha(B, PA.pH1), 3)} (sans unité).`],
        pieges: [[1 - M.alpha(B, PA.pH1), 'C’est la part de la forme ionique A⁻, pas celle de HA : α = 1 divisé par (1 + 10 puissance (pH − pKa)).'], [10 ** (PA.pH1 - 4.2), 'Il manque « 1 + » et l’inversion : α = 1 divisé par (1 + 10 puissance (pH − pKa)).'], [1 / 10 ** (PA.pH1 - 4.2), 'Il manque le « 1 + » au dénominateur : α = 1 divisé par (1 + 10 puissance (pH − pKa)).']],
        expl: `10^(−1,0) = 0,10, donc α = 1 divisé par 1,10 = ${nbf(M.alpha(B, PA.pH1), 2)} : environ 91 % de l’acide est sous forme HA.`, indice: 'Calculez pH − pKa (négatif), puis 10 puissance cette valeur, ajoutez 1 et prenez l’inverse.' } },
    { id: 'D', titre: 'Le rapport de distribution D', focus: ['scene', 'mesures'],
      texte: <>À pH {nbf(PA.pH1, 1)}, α = <strong>{nbf(a1, 3)}</strong> de l’acide est sous forme HA, la seule qui passe dans l’organique, avec K = <strong>{PA.Kbenz}</strong>. Le <strong>rapport de distribution</strong> compare l’acide total (HA et A⁻) dans l’organique et dans l’eau : {FD}</>,
      tache: { type: 'num', q: 'Rapport de distribution D à pH 3,2 (sans unité)', unite: '(sans unité)', vrai: D1a, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => [`D = K × α = ${PA.Kbenz} × ${nbf(a1, 3)}`, `D = ${nbf(D1, 1)} (sans unité).`],
        pieges: [[PA.Kbenz / a1, 'Il faut multiplier K par α, pas les diviser.'], [PA.Kbenz - a1, 'Il faut multiplier K par α, pas les soustraire.'], [a1, 'C’est α seule : D = K × α.']],
        expl: `D = ${PA.Kbenz} × ${nbf(a1, 3)} = ${nbf(D1, 1)} : un peu moins que K, car une petite part de l’acide est sous forme ionique.`, indice: 'D = K × α : multipliez le coefficient de partage K par la fraction α sous forme HA.' } },
    { id: 'E', titre: 'Quelle part est extraite ?', focus: ['scene', 'mesures'],
      texte: <>À pH {nbf(PA.pH1, 1)}, D = <strong>{nbf(D1a, 1)}</strong>. On agite l’eau avec <strong>le même volume</strong> de solvant organique (Vorg = Veau). La fraction extraite, dans ce cas, est : {FE} (multipliée par 100 pour un pourcentage).</>,
      tache: { type: 'num', q: 'Pourcentage d’acide extrait dans l’organique (en %)', unite: '%', vrai: E1, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => [`E = D divisé par (1 + D) = ${nbf(D1a, 1)} divisé par ${nbf(1 + D1a, 1)} = ${nbf(E1 / 100, 3)}`, `E = ${nbf(E1, 0)} %.`],
        pieges: [[E1 / 100, 'C’est la fraction ; le pourcentage est cette valeur multipliée par 100.'], [100 * D1a / (D1a - 1), 'Le dénominateur est 1 + D, pas D − 1.'], [100 / (1 + D1a), 'C’est la part qui reste dans l’eau : on demande la part extraite.']],
        expl: `E = ${nbf(D1a, 1)} divisé par ${nbf(1 + D1a, 1)} = ${nbf(E1 / 100, 3)}, soit ${nbf(E1, 0)} % extrait en un seul contact.`, indice: 'E = D divisé par (1 + D), puis multipliez par 100 pour obtenir un pourcentage.' } },
    { id: 'deux', titre: 'Extraire deux fois', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : LA FRACTION EXTRAITE SELON LE pH',
      retenir: <>
        <SvgCourbe/>
        <ul style={puces}>
          <li>Pour un acide, la fraction extraite <strong>diminue quand le pH augmente</strong> : D = K × α et E = D divisé par (1 + D) (volumes égaux). À pH = pKa, α = 0,5 et D = K divisé par 2.</li>
          <li>Exemple de la simulation (acide benzoïque, pKa 4,2) : 91 % extraits à pH 4,2 et seulement 17 % à pH 6,2.</li>
          <li>Moyen de s’en souvenir : <strong>« acide : plus le pH est bas, plus il passe dans l’organique »</strong>.</li>
        </ul></>,
      texte: <>Il reste de l’acide dans l’eau après un premier contact. On recommence avec <strong>du solvant organique neuf</strong>, de même volume que l’eau, la phase aqueuse gardant son pH ({nbf(PA.pH1, 1)}) : au total <strong>deux extractions</strong>. D = <strong>{nbf(D1a, 1)}</strong>. Après n extractions avec du solvant neuf : {FReste}</>,
      tache: { type: 'num', q: 'Pourcentage d’acide restant dans l’eau après deux extractions (en %)', unite: '%', vrai: R2, tol: 0.1, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => [`Après un contact, il reste 1 divisé par (1 + D) = 1 divisé par ${nbf(1 + D1a, 1)} = ${nbf(1 / (1 + D1a), 4)}`, `Après deux extractions : ${nbf(1 / (1 + D1a), 4)}² = ${nbf(R2 / 100, 5)}, soit ${nbf(R2, 2)} %.`],
        pieges: [[100 / (1 + D1a), 'C’est le reste après une seule extraction : il faut élever la fraction au carré pour deux.'], [2 * 100 / (1 + D1a), 'Le reste est multiplié à chaque extraction, pas additionné : (1 divisé par (1 + D)) au carré.'], [100 - R2, 'C’est la part extraite au total : on demande ce qui reste dans l’eau.']],
        expl: `Chaque extraction multiplie ce qui reste par 1 divisé par ${nbf(1 + D1a, 1)} : après deux, ${nbf(R2, 2)} % restent dans l’eau, donc ${nbf(100 - R2, 1)} % sont extraits. Plusieurs petites extractions valent mieux qu’une grande.`, indice: 'Le reste après un contact est 1 divisé par (1 + D). Après deux contacts avec du solvant neuf, élevez cette fraction au carré (puis × 100).' } },
    { id: 'choixpH', titre: 'Choisir le pH pour un acide', focus: ['scene'],
      texte: <>Pour <strong>extraire l’acide benzoïque</strong> dans le solvant organique, il faut choisir le pH de la phase aqueuse. Rappels : pKa = 4,2 ; HA est la forme neutre ; A⁻ est la forme ionique.</>,
      tache: { type: 'qcm', q: 'Quel pH choisir pour extraire au mieux l’acide ?', ...QCM.choixpH,
        expl: 'On veut le maximum de forme neutre HA : il faut un pH bien inférieur au pKa (au moins 2 unités en dessous). À pH égal au pKa, la moitié seulement est sous forme HA.', indice: 'Quelle forme est extraite : HA ou A⁻ ? Et dans quel domaine de pH, par rapport au pKa, cette forme prédomine-t-elle ?' } },
    { id: 'base', titre: 'Et pour une base ?', focus: ['scene'],
      texte: <>L’aniline est une base : couple <strong>BH⁺ / B</strong>, pKa = <strong>4,6</strong>. La forme neutre est <strong>B</strong> ; la forme ionique est <strong>BH⁺</strong>, de formule BH⁺ + H₂O ⇌ B + H₃O⁺. On cherche à extraire l’aniline dans le solvant organique.</>,
      tache: { type: 'qcm', q: 'Quel pH choisir pour extraire au mieux la base ?', ...QCM.base,
        expl: 'La forme neutre d’une base est B, qui prédomine pour un pH supérieur au pKa : il faut un pH bien supérieur (par exemple 10). Pour une base, c’est donc l’inverse d’un acide.', indice: 'Dans le couple BH⁺ / B, l’acide est BH⁺. Au-dessus du pKa, c’est la base B qui prédomine : est-elle neutre ou chargée ?' } },
    { id: 'separation', titre: 'Séparer un mélange', focus: ['scene'],
      retenirTitre: 'À RETENIR : QUEL pH CHOISIR ?',
      retenir: <>
        <SvgChoix/>
        <ul style={puces}>
          <li>On choisit le pH pour que l’espèce voulue soit sous forme <strong>neutre</strong> (extraite dans l’organique) ou sous forme <strong>ionique</strong> (envoyée dans l’eau), à au moins 2 unités du pKa.</li>
          <li>Pour un acide : pH inférieur au pKa pour l’extraire, supérieur pour le renvoyer dans l’eau ; pour une base, c’est l’inverse.</li>
          <li>Moyen de s’en souvenir : <strong>« acide : bas pH vers l’organique ; base : haut pH vers l’organique »</strong>.</li>
        </ul></>,
      texte: <>Le solvant organique contient un mélange de trois composés : l’acide benzoïque <strong>HA</strong> (pKa = 4,2), l’aniline <strong>B</strong> (pKa de BH⁺ / B = 4,6) et un composé <strong>neutre N</strong>, qui n’est ni acide ni basique. On ajoute de l’eau de <strong>pH {PA.pHmel}</strong>, puis on agite et on laisse décanter.</>,
      tache: { type: 'qcm', q: 'Quels composés restent dans le solvant organique ?', ...QCM.separation,
        expl: 'À pH 12, bien supérieur aux deux pKa de 4,2 et 4,6 : l’acide est sous forme ionique A⁻ et passe dans l’eau ; l’aniline est sous forme neutre B et reste dans l’organique, comme N.', indice: 'Pour chaque composé, placez pH 12 par rapport à son pKa : quelle forme prédomine, et est-elle neutre ou chargée ?' } },
    { id: 'recuperer', titre: 'Récupérer l’acide', focus: ['scene'],
      texte: <>Après décantation, on sépare les deux phases : la phase aqueuse (<strong>pH {PA.pHmel}</strong>) contient l’acide sous forme <strong>A⁻</strong>. On veut maintenant récupérer l’acide benzoïque.</>,
      tache: { type: 'qcm', q: 'Comment récupérer l’acide benzoïque ?', ...QCM.recuperer,
        expl: 'On ajoute un acide fort pour amener le pH à 2, bien en dessous de 4,2 : A⁻ devient HA, neutre, qu’on extrait par du solvant organique neuf (ou qui précipite).', indice: 'Pour transformer A⁻ en HA, dans quel sens faut-il déplacer le pH par rapport au pKa : plus haut ou plus bas ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : SÉPARER UN MÉLANGE',
      retenir: <>
        <SvgPlan/>
        <ul style={puces}>
          <li>On sépare un acide, une base et un composé neutre en jouant sur le pH : <strong>pH élevé</strong> (A⁻ dans l’eau), puis <strong>pH bas</strong> (BH⁺ dans l’eau), le composé neutre restant dans l’organique.</li>
          <li>On récupère ensuite chaque espèce en remettant sa forme neutre : <strong>on acidifie</strong> l’acide A⁻, on rend basique la base BH⁺.</li>
          <li>Moyen de s’en souvenir : <strong>« on fait passer dans l’eau en chargeant, on récupère en neutralisant »</strong>.</li>
        </ul></>,
      texte: <>Vous savez écrire le partage d’une espèce neutre, calculer la part extraite selon le pH et le pKa, compter plusieurs extractions et organiser la séparation d’un mélange acide, base, neutre. Explorez maintenant, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'extraction' ? { ...M.tirageExtraction(), reps: { D: '', E: '' }, verifie: false } : { ...M.tiragePasses(), reps: { reste: '', unique: '' }, verifie: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'extraction') {
      const d = lireNombre(defi.reps.D), ex = lireNombre(defi.reps.E);
      const ok = isFinite(d) && isFinite(ex) && proche(d, defi.D, 0.05) && proche(ex, defi.E, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok })); noterE(ok);
    } else {
      const r = lireNombre(defi.reps.reste), u = lireNombre(defi.reps.unique);
      const ok = isFinite(r) && isFinite(u) && proche(r, defi.reste, 0.1) && proche(u, defi.unique, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok })); noterP(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('ex-verif')?.click()} onChange={e2 => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e2.target.value }, verifie: false }))} inputMode="decimal"
      style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);
  const dRatio = r => (r === 1 ? 'le même volume' : r === 2 ? 'un volume double' : 'la moitié du volume');
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['extraction', 'Une extraction'], ['passes', 'Plusieurs extractions']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'extraction' ? 'Défi : une extraction à un pH donné' : 'Défi : plusieurs extractions successives'}</div>
      {defi.type === 'extraction' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>On extrait {defi.e.type === 'acide' ? 'l’acide' : 'la base'} <strong>{defi.e.nom}</strong> (couple {defi.e.type === 'acide' ? 'HA / A⁻' : 'BH⁺ / B'}, pKa = {nbf(defi.e.pKa, 1)}) d’une phase aqueuse de <strong>pH {nbf(defi.pH, 1)}</strong> avec un solvant organique de <strong>{dRatio(defi.r)}</strong> de celui de l’eau. Le coefficient de partage de la forme neutre est K = <strong>{defi.e.K}</strong>. Calculez D (sans unité, 2 chiffres significatifs) puis le pourcentage d’espèce extrait en un contact.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>D =</span>{champ('D', 'Rapport de distribution D', defi.ok || proche(lireNombre(defi.reps.D), defi.D, 0.05))}
          <span>extrait (%) =</span>{champ('E', 'Pourcentage extrait', defi.ok || proche(lireNombre(defi.reps.E), defi.E, 0.05))}
        </div>
        <IndiceDefi cache={false}>{defi.e.type === 'acide' ? 'α = 1 divisé par (1 + 10 puissance (pH − pKa))' : 'α = 1 divisé par (1 + 10 puissance (pKa − pH))'} pour la fraction de forme neutre ; D = K × α ; fraction extraite = D × r divisé par (1 + D × r), avec r = Vorg divisé par Veau.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On extrait {defi.e.type === 'acide' ? 'l’acide' : 'la base'} <strong>{defi.e.nom}</strong> (pKa = {nbf(defi.e.pKa, 1)}, K = <strong>{defi.e.K}</strong>) d’une phase aqueuse de <strong>pH {nbf(defi.pH, 1)}</strong>, avec à chaque fois <strong>{dRatio(defi.r)}</strong> de solvant organique neuf par rapport à l’eau. Calculez le pourcentage qui reste dans l’eau après <strong>une seule</strong> extraction, puis après <strong>{defi.n}</strong> extractions (2 chiffres significatifs).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>après 1 (%) =</span>{champ('unique', 'Pourcentage restant dans l’eau après une extraction', defi.ok || proche(lireNombre(defi.reps.unique), defi.unique, 0.05))}
          <span>après {defi.n} (%) =</span>{champ('reste', `Pourcentage restant dans l’eau après ${defi.n} extractions`, defi.ok || proche(lireNombre(defi.reps.reste), defi.reste, 0.1))}
        </div>
        <IndiceDefi cache={false}>Calculez α puis D = K × α ; le reste après une extraction est 1 divisé par (1 + D × r) ; après n extractions, élevez cette fraction à la puissance n (puis × 100).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="ex-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.type === 'extraction'
          ? `α = ${nbf(defi.alpha, 2)} ; D = ${defi.e.K} × ${nbf(defi.alpha, 2)} = ${fmtV(defi.D)} ; extrait = D × r divisé par (1 + D × r) = ${fmtPct(defi.E)} %.`
          : `α = ${nbf(defi.alpha, 2)} ; D = ${fmtV(defi.D)} ; après 1 : ${fmtPct(defi.unique)} % ; après ${defi.n} : ${fmtPct(defi.reste)} %.`))}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Seule la forme neutre passe dans l’organique</strong> (HA ou B). La forme ionique (A⁻ ou BH⁺) reste entièrement dans l’eau : c’est une idéalisation, une très faible part d’ions peut en réalité passer.</li>
      <li><strong>Le coefficient de partage K est donné et indépendant du pH</strong> (valeurs choisies pour la simulation, de l’ordre de 20 à 50, à 25 °C). Les solvants sont non miscibles et les équilibres sont atteints.</li>
      <li><strong>Le pH de la phase aqueuse est imposé</strong> et ne change pas pendant l’extraction ; les pKa sont ceux de 25 °C. Activités ≈ concentrations ; HA, B et N se comportent indépendamment les uns des autres dans le mélange.</li>
      <li><strong>Plusieurs extractions</strong> : à chaque contact, on utilise du solvant neuf et l’équilibre est atteint. Le composé neutre N ne réagit pas avec l’eau (K = 50).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, réglages, mesures ----------
  const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
  const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
  const eE = M.ESPECES[ti.e], melange = ti.mode === 'melange';
  const alE = M.alpha(eE, ti.pH), DE = M.distribution(eE, ti.pH), EE = 100 * M.fractionExtraite(DE, ti.r), RE = 100 * M.resteApres(DE, ti.r, ti.n);
  const gExplore = melange ? groupesMelange(ti.pH) : groupesEsp(eE, ti.pH, ti.r);
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enGuide ? 'Ampoule à deux phases' : melange ? 'Mélange dans l’ampoule' : 'Ampoule à deux phases'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Chaque forme dessinée représente une part de l’espèce : la forme neutre se répartit entre les deux phases, la forme ionique reste dans l’eau.</div>}
      {enGuide ? <SceneAmpoule groupes={sg.groupes} pH={sg.pH} titre={sg.titre}/> : <SceneAmpoule groupes={gExplore} pH={ti.pH} titre={melange ? 'Acide HA, base B et neutre N' : `${eE.nom} (pKa ${nbf(eE.pKa, 1)})`}/>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="ex-m" style={libelle}>Contenu de l’ampoule</label>
      <select id="ex-m" value={ti.mode} onChange={ev => setTi(s => ({ ...s, mode: ev.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
        <option value="espece">Une espèce acide ou basique</option>
        <option value="melange">Mélange acide, base et neutre</option>
      </select>
      {!melange && <>
        <label htmlFor="ex-e" style={libelle}>Espèce</label>
        <select id="ex-e" value={ti.e} onChange={ev => setTi(s => ({ ...s, e: ev.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
          {M.IDS_ESP.map(id => <option key={id} value={id}>{M.ESPECES[id].nom} ({M.ESPECES[id].type === 'acide' ? 'acide' : 'base'}, pKa {nbf(M.ESPECES[id].pKa, 1)}, K = {M.ESPECES[id].K})</option>)}
        </select>
      </>}
      <Curseur nom="pH de la phase aqueuse" valeur={ti.pH} onChange={v => setTi(s => ({ ...s, pH: v }))} min={1} max={14} pas={0.5} decimales={1} couleur="#c2410c"/>
      {!melange && <>
        <label htmlFor="ex-r" style={libelle}>Volume de solvant organique par rapport à l’eau</label>
        <select id="ex-r" value={ti.r} onChange={ev => setTi(s => ({ ...s, r: Number(ev.target.value) }))} style={{ ...selectStyle, marginBottom: 8 }}>
          {M.RATIOS.map(r => <option key={r} value={r}>{r === 1 ? 'le même volume' : r === 2 ? 'le double' : 'la moitié'}</option>)}
        </select>
        <label htmlFor="ex-n" style={libelle}>Nombre d’extractions (solvant neuf à chaque fois)</label>
        <select id="ex-n" value={ti.n} onChange={ev => setTi(s => ({ ...s, n: Number(ev.target.value) }))} style={{ ...selectStyle, marginBottom: 8 }}>
          {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </>}
      <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '4px 0 0', lineHeight: 1.5 }}>{melange ? 'Un seul contact, même volume pour les deux phases : voyez où se trouve chaque composé.' : 'Le pH est maintenu constant. Les nombres sont donnés dans Mesures.'}</div>
    </div>);
  const MES = {
    phases:     [['[HA]org', `${nbf(PA.Corg, 3)}${NB}mol/L`, COL.orange], ['[HA]aq', `${nbf(PA.Caq, 4)}${NB}mol/L`, COL.bleu]],
    ionique:    [['K de HA', `${PA.Kbenz}`], ['pH de l’eau', `${PA.pHion}`, COL.rouge]],
    neutre:     [['pKa de HA / A⁻', '4,2'], ['pH de l’eau', nbf(PA.pHneutre, 1), COL.rouge]],
    alpha:      [['pKa', '4,2'], ['pH de l’eau', nbf(PA.pH1, 1), COL.rouge]],
    D:          [['K', `${PA.Kbenz}`], ['α (fraction HA)', nbf(a1, 3), COL.orange]],
    E:          [['D', nbf(D1a, 1), COL.orange], ['Volumes', 'Vorg = Veau']],
    deux:       [['D', nbf(D1a, 1), COL.orange], ['Nombre d’extractions', '2, solvant neuf']],
    choixpH:    [['pKa de HA / A⁻', '4,2']],
    base:       [['pKa de BH⁺ / B', '4,6']],
    separation: [['pKa de HA / A⁻', '4,2'], ['pKa de BH⁺ / B', '4,6'], ['pH de l’eau ajoutée', `${PA.pHmel}`, COL.rouge]],
    recuperer:  [['Phase aqueuse', 'A⁻ à pH 12'], ['pKa de HA / A⁻', '4,2']],
  };
  const lignesGuide = enGuide ? (MES[idE] ?? []) : [];
  const montrerMesures = enExplore || (enGuide && lignesGuide.length > 0);
  const nomForme = melange ? '' : (M.formeDominante(eE, ti.pH) === 'neutre' ? eE.neutre : eE.ion);
  const mesures = montrerMesures && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Mesures' : 'Données'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{melange ? 'Part de chaque composé dans le solvant organique après un contact (volumes égaux).' : 'Fraction de forme neutre, rapport de distribution et part extraite pour le réglage choisi.'}</div>}
      {enGuide ? lignesGuide.map(([n, v, col]) => <LigneMesure key={n} nom={n} valeur={v} couleur={col}/>) : melange ? <>
        {[['benz', 'HA (acide benzoïque)'], ['aniline', 'B (aniline)']].map(([id, nom]) => { const e = M.ESPECES[id]; return <LigneMesure key={id} nom={nom} valeur={`${fmtPct(100 * M.fractionExtraite(M.distribution(e, ti.pH), 1))}${NB}% dans l’organique`} couleur={id === 'benz' ? COL.orange : COL.bleu}/>; })}
        <LigneMesure nom="N (composé neutre)" valeur={`${fmtPct(100 * M.fractionExtraite(M.NEUTRE.K, 1))}${NB}% dans l’organique`} couleur={COL.vert}/>
      </> : <>
        <LigneMesure nom="Forme qui prédomine" valeur={M.formeDominante(eE, ti.pH) === 'egal' ? `${eE.neutre} = ${eE.ion}` : nomForme} couleur={COL.bleu}/>
        <LigneMesure nom="Rapport frac([forme ionique]|[forme neutre])" valeur={fmtV(M.rapportIon(eE, ti.pH))}/>
        <LigneMesure nom="α (fraction de forme neutre)" valeur={nbf(alE, alE < 0.01 ? 4 : 3)} couleur={COL.orange}/>
        <LigneMesure nom="D = K × α" valeur={fmtV(DE)} couleur={COL.orange}/>
        <LigneMesure nom="Part extraite, 1 contact" valeur={`${fmtPct(100 * M.fractionExtraite(DE, ti.r))}${NB}%`} couleur={COL.vert}/>
        <LigneMesure nom={`Reste dans l’eau après ${ti.n} extraction${ti.n > 1 ? 's' : ''}`} valeur={`${fmtPct(RE)}${NB}%`} couleur={COL.rouge}/>
      </>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Acide benzoïque : balayez le pH de 1 à 14 et suivez la part extraite. À quel pH vaut-elle environ la moitié de son maximum ?</li>
      <li>Passez à l’aniline (une base) : la courbe est-elle la même ? Dans quel sens se décale-t-elle ?</li>
      <li>À pH = pKa, que valent α et D ? Comparez avec K.</li>
      <li>Choisissez un pH où l’extraction est mauvaise, puis faites 2 ou 3 extractions : combien en reste-t-il dans l’eau ?</li>
      <li>Mélange : cherchez un pH où l’acide est dans l’eau et la base dans l’organique, puis un pH où c’est l’inverse.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>K = [forme neutre]org divisé par [forme neutre]aq ; un ion reste dans l’eau</li>
        <li>Acide : forme neutre HA si pH inférieur au pKa ; base : forme neutre B si pH supérieur au pKa</li>
        <li>α = 1 divisé par (1 + 10 puissance (pH − pKa)) pour un acide ; D = K × α ; fraction extraite = D divisé par (1 + D) (volumes égaux)</li>
        <li>Après n extractions avec du solvant neuf : reste = (1 divisé par (1 + D)) puissance n</li>
        <li>Séparer un mélange : pH élevé (acide dans l’eau), puis pH bas (base dans l’eau), le neutre reste dans l’organique</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ex-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ex-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ex-col { display: flex; flex-direction: column; gap: 12px; }
        .ex-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .ex-l1.cote .ex-carte { order: 2; } .ex-l1.cote .ex-main { order: 1; }
          .ex-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .ex-ex > * { grid-column: 1; }
          .ex-ex > .ex-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .ex-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ex-in { animation: ex-fondu 0.35s ease-out; } @keyframes ex-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Extraction acide-base : le pH décide où va le composé</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une espèce <strong>acide ou basique</strong> peut être <strong>neutre</strong> (elle passe dans un solvant organique) ou <strong>ionique</strong> (elle reste dans l’eau) selon le <strong>pH</strong>. On apprend à choisir le pH pour extraire un composé ou séparer un mélange.</div>
      {!enExplore && <div className={`ex-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="ex-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="ex-carte">{panneauHypo}</div>}
        <div className="ex-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'extraction' ? suiviE : suiviP}/></div>}
          {enGuide && <div className="ex-col">
            {deja('phases') && <Equilibres partage base={deja('base')}/>}
            <div className="ex-in">{scene}</div>
            {mesures && <div className="ex-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="ex-ex">
          <Equilibres partage base/>
          {scene}
          <div className="ex-reg">{reglages}</div>
          {mesures}
        </div>
        {!melange && <Section titre={`Courbe : part extraite selon le pH (${eE.nom})`} ouvert={!!ouv.graphe} onBascule={() => bascule('graphe')}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Part extraite en un contact selon le pH de la phase aqueuse, pour le rapport de volumes choisi. Repère rouge : pH réglé ; tirets : pKa.</div>
          <CourbeE e={eE} r={ti.r} pH={ti.pH}/>
        </Section>}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
