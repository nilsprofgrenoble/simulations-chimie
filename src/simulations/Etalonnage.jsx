import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./condEtalonnageModele";
import { QCM_PARCOURS as Q } from "./etalonnageQcm";
import { SceneEtalonnage, GraphiqueEtalonnage, SvgGSigmaKCarte, SvgEtalonCelluleCarte, SvgChaineCarte, SvgDroiteCarte, SvgLimitesCarte, SvgDemarcheCarte } from "./etalonnageSchemas";

const SIM_ID = 136, CLE_GUIDE = 'etalonnage-tg-guide-v1';
declarerDefis(SIM_ID, [['cellule', 'Concentration à partir de la conductance'], ['dosage', 'Dosage par étalonnage d’une solution']]);

// ====================================================
// SIM 136 — DOSAGE CONDUCTIMÉTRIQUE PAR ÉTALONNAGE : CONDUCTANCE, CONSTANTE DE CELLULE ET COURBE D'ÉTALONNAGE
//  (TG spé PC, chapitre « Déterminer la composition d'un système », partie B « Analyser un système par des méthodes physiques » ; suite de la sim 135).
//  Une seule idée : le conductimètre mesure une conductance G ; avec la constante de cellule k on obtient la conductivité σ ; une courbe d'étalonnage G = f(c)
//  permet de doser sans connaître k ni les λ, à condition de rester dans le domaine de validité (solution diluée) et dans les mêmes conditions.
//  Capacités visées (jamais affichées à l'élève) : exploiter la loi de Kohlrausch pour déterminer une concentration ; citer les domaines de validité ;
//  mesurer une conductance et tracer une courbe d'étalonnage pour déterminer une concentration.
//  Modèle de calcul : condEtalonnageModele.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const g3 = v => Number(v).toPrecision(3).replace('.', ',');        // affichage à 3 chiffres significatifs (conductimètre)
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const IDS = ['conductance', 'cellule', 'etalon', 'sigmaG', 'kohl', 'mesures', 'droite', 'lecture', 'pente', 'limites', 'dilution', 'bilan'];
const PRESET = { sol: 'nacl', cell: 'A', c: 6 };
const nbEx = c => nbf(c, Number.isInteger(c) ? 0 : 1);
const nacl = M.SOLUTES.nacl;

// ---------- formules (MathML) ----------
const FSigma = <Formule><mi>σ</mi><mo>=</mo><mi>k</mi><mo>×</mo><mi>G</mi></Formule>;
const FK = <Formule><mi>k</mi><mo>=</mo><mfrac><mi>L</mi><mi>S</mi></mfrac></Formule>;
const FG = <FormuleEnLigne><mi>G</mi><mo>=</mo><mfrac><mi>I</mi><mi>U</mi></mfrac></FormuleEnLigne>;
const FKohl = <Formule><mi>σ</mi><mo>=</mo><munder><mo>∑</mo><mi>i</mi></munder><msub><mi>λ</mi><mi>i</mi></msub><mo>×</mo><msub><mi>c</mi><mi>i</mi></msub></Formule>;
const FKEtalon = <Formule><mi>k</mi><mo>=</mo><mfrac><mrow><mi>σ</mi><mo>(</mo><mi mathvariant="normal">étalon</mi><mo>)</mo></mrow><mrow><mi>G</mi><mo>(</mo><mi mathvariant="normal">étalon</mi><mo>)</mo></mrow></mfrac></Formule>;
const FPente = <Formule><mi>a</mi><mo>=</mo><mfrac><mrow><msub><mi>λ</mi><mo>+</mo></msub><mo>+</mo><msub><mi>λ</mi><mo>−</mo></msub></mrow><mi>k</mi></mfrac></Formule>;
const FCSol = <Formule><mi>c</mi><mo>(</mo><mi mathvariant="normal">S</mi><mo>)</mo><mo>=</mo><mi>F</mi><mo>×</mo><mi>c</mi><mo>(</mo><msup><mi mathvariant="normal">S</mi><mo>′</mo></msup><mo>)</mo></Formule>;
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;

// équation de dissolution : une seule ligne, jamais coupée (la police se réduit sur téléphone)
const Equation = ({ texte }) => (
  <span style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: 'clamp(12px, 3.9vw, 17px)', fontWeight: 700, color: KIT.txt, lineHeight: 1.6 }}>{texte.replace(/ /g, ' ')}</span>);
const LigneEquation = ({ texte }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 8px' }}><span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>Équation de dissolution :</span><Equation texte={texte}/></div>);

// ====================================================
export function SimulationEtalonnage() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviK, noterK] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('cellule');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ lambda: false, essayer: false, retenir: false, valeurs: false });
  const [ptsG, setPtsG] = useState([]), [cSel, setCSel] = useState(6);          // parcours : étalons mesurés et étalon choisi
  const [ex, setEx] = useState(PRESET), [exPts, setExPts] = useState([]);       // exploration : réglages et points de la courbe d'étalonnage
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setE = f => { setEx(s => ({ ...s, ...f })); if ('sol' in f || 'cell' in f) setExPts([]); };

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée dans la scène ----------
  const kG = M.K_GUIDE, Gp = M.gAffichee('nacl', M.C_INCONNUE, kG), Get = M.gEtalon(M.ETALON_GUIDE, kG);
  const cellEx = M.CELLULES[ex.cell], kEx = M.kDe(cellEx), solEx = M.SOLUTES[ex.sol];
  let sc, eqTexte;
  if (enGuide) {
    if (idx <= 2) { sc = { cat: 'K', an: 'Cl', n: M.nbPointsDe(10), lecture: `${g3(Get)} mS`, titre: 'étalon : KCl à 0,0100 mol/L' }; eqTexte = 'KCl → K⁺ + Cl⁻'; }
    else if (idx === 5 || idx === 6) { sc = { cat: 'Na', an: 'Cl', n: M.nbPointsDe(cSel), lecture: `${g3(M.gAffichee('nacl', cSel, kG))} mS`, titre: `étalon : NaCl à ${nbEx(cSel)} mmol/L` }; eqTexte = nacl.eq; }
    else if (idx === 9) { sc = { cat: 'Na', an: 'Cl', n: M.nbPointsDe(100), lecture: `${g3(M.gAffichee('nacl', 100, kG))} mS`, titre: 'étalon : NaCl à 100 mmol/L' }; eqTexte = nacl.eq; }
    else { sc = { cat: 'Na', an: 'Cl', n: M.nbPointsDe(M.C_INCONNUE), lecture: `${g3(Gp)} mS`, titre: idx >= 10 ? 'S′ (S diluée 20 fois)' : 'S′ : NaCl, c inconnue' }; eqTexte = nacl.eq; }
  } else if (dd && dd.type === 'cellule') {
    const s = M.SOLUTES[dd.id]; sc = { cat: s.cat, an: s.an, n: M.nbPointsDe(dd.c), lecture: `${g3(dd.GX)} mS`, titre: `${s.f} : c inconnue` }; eqTexte = s.eq;
  } else {
    const Gx = M.gAffichee(ex.sol, ex.c, kEx);
    sc = { cat: solEx.cat, an: solEx.an, n: M.nbPointsDe(ex.c), lecture: `${g3(Gx)} mS`, titre: `${solEx.f} à ${nbEx(ex.c)} mmol/L` }; eqTexte = solEx.eq;
  }

  // ---------- courbe d'étalonnage ----------
  const ptsEx = exPts.map(c => ({ c, G: M.gAffichee(ex.sol, c, kEx), hors: !M.dansDomaine(c) })).sort((a, b) => a.c - b.c);
  const aEx = M.pente(ptsEx);
  const etendu = deja('limites');
  const ptsGuide = [...(apres('mesures') ? M.STD : ptsG).map(c => ({ c, G: M.gAffichee('nacl', c, kG), hors: false })), ...(etendu ? M.STD_ETENDUS.map(c => ({ c, G: M.gAffichee('nacl', c, kG), hors: true })) : [])];
  const aGuide = deja('droite') ? M.pente(ptsGuide) : null;
  const nice = v => [0.5, 1, 1.5, 2, 3, 5, 8, 10, 12, 16, 20, 30, 40, 50, 80].find(x => x >= v) || Math.ceil(v);
  const cMaxEx = ptsEx.length ? Math.max(...ptsEx.map(p => p.c)) : 10, xMaxEx = cMaxEx <= 10 ? 12 : cMaxEx <= 20 ? 24 : cMaxEx <= 50 ? 60 : 120;
  const yMaxEx = nice(1.12 * Math.max(0.3, ...ptsEx.map(p => p.G), aEx ? aEx * Math.min(10, xMaxEx) : 0));

  // ---------- étapes ----------
  const ETAPES = [
    { id: 'conductance', titre: 'Une cellule mesure une conductance', focus: ['scene'],
      texte: <>Une cellule de conductimétrie plonge dans une solution étalon de chlorure de potassium (K⁺, Cl⁻). Le conductimètre applique une tension U entre les deux plaques, mesure l’intensité I du courant et affiche la <strong>conductance G</strong> (en siemens, S ; ici en mS) : {FG} Sur l’agrandissement, S est la surface d’une plaque et L la distance qui sépare les deux plaques.</>,
      tache: { type: 'qcm', q: 'On éloigne les deux plaques de la cellule, sans changer la solution. Que devient la conductance G mesurée ?', ...Q.conductance,
        expl: 'Plus les plaques sont éloignées, plus le courant doit traverser de solution : pour la même tension, l’intensité diminue, donc G diminue. À l’inverse, des plaques plus grandes (S plus grand) augmentent G. La conductance dépend donc de la solution et de la cellule.',
        indice: 'Plus le chemin du courant dans la solution est long, plus il est difficile à parcourir. Que devient alors l’intensité I pour la même tension U ?' } },
    { id: 'cellule', titre: 'De la conductance à la conductivité', focus: ['scene'],
      texte: <>Pour décrire la solution seule, on utilise sa <strong>conductivité σ</strong> (en S·m⁻¹), qui ne dépend pas de la cellule. Elle est reliée à G par la <strong>constante de cellule k</strong>, qui ne dépend que de la cellule : {FSigma}avec {FK}où L est la distance entre les plaques et S la surface d’une plaque.</>,
      tache: { type: 'qcm', q: 'Quelle est l’unité de la constante de cellule k, sachant que σ = k × G ?', ...Q.cellule,
        expl: 'Dans σ = k × G, σ s’exprime en S·m⁻¹ et G en S : k s’exprime donc en m⁻¹. On le retrouve avec k = frac(L|S) : une longueur divisée par une surface, soit des m divisés par des m².',
        indice: 'Écrivez les unités dans σ = k × G : σ en S·m⁻¹, G en S. Quelle unité doit avoir k pour que l’égalité soit juste ?' } },
    { id: 'etalon', titre: 'Étalonner la cellule', focus: ['scene', 'donnees'],
      retenirTitre: 'À RETENIR : G, σ ET k',
      retenir: <>
        <SvgGSigmaKCarte/>
        <Ul>
          <li>La <strong>conductance G</strong> (en S) dépend de la solution et de la cellule ; la <strong>conductivité σ</strong> (en S·m⁻¹) dépend de la solution seule. Elles sont reliées par la constante de cellule : {FSigma}avec {FK}en m⁻¹ (L en m, S en m²).</li>
          <li>Exemple de la simulation : des plaques plus éloignées donnent une conductance plus petite pour la même solution ; sa conductivité, elle, ne change pas.</li>
          <li>Moyen de s’en souvenir : <strong>« G dépend de la cellule, σ dépend de la solution »</strong>. Idée fausse : « G et σ sont la même grandeur ». Vrai : elles ne diffèrent que par k.</li>
        </Ul></>,
      texte: <>La valeur de k n’est pas toujours connue avec précision. On l’obtient par un <strong>étalonnage</strong> : on plonge la cellule dans une solution étalon dont la conductivité est écrite sur le flacon (voir les données : σ = 141 mS·m⁻¹ à 25 °C) et on lit G sur le conductimètre : G = {g3(Get)} mS.</>,
      tache: { type: 'num', q: 'Constante de cellule k', unite: 'm⁻¹', vrai: M.ETALON_GUIDE.sigma / Get, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Étalonnage : σ(étalon) = k × G(étalon), donc k = frac(σ(étalon)|G(étalon)).', `k = frac(141|${g3(Get)}) = ${nbf(M.ETALON_GUIDE.sigma / Get, 1)} m⁻¹ (des mS·m⁻¹ divisés par des mS donnent des m⁻¹), soit environ 80 m⁻¹.`],
        pieges: [[Get / M.ETALON_GUIDE.sigma, 'Le rapport est inversé : k = σ divisée par G.'], [M.ETALON_GUIDE.sigma * Get, 'Il faut diviser σ par G, pas les multiplier.'], [0.141 / Get, 'Vous avez converti σ en S·m⁻¹ sans convertir G en S : convertissez les deux, ou aucune (mS·m⁻¹ divisés par mS donnent des m⁻¹).']],
        expl: `k = frac(141|${g3(Get)}) ≈ 80 m⁻¹.`, indice: 'Dans σ(étalon) = k × G(étalon), isolez k. Les mS·m⁻¹ divisés par des mS donnent des m⁻¹.' } },
    { id: 'sigmaG', titre: 'De G à σ pour une solution inconnue', focus: ['scene'],
      retenirTitre: 'À RETENIR : ÉTALONNER LA CELLULE',
      retenir: <>
        <SvgEtalonCelluleCarte/>
        <Ul>
          <li>On <strong>étalonne la cellule</strong> avec une solution étalon de conductivité connue : {FKEtalon}</li>
          <li>Exemple de la simulation : σ = 141 mS·m⁻¹ et G = 1,76 mS donnent k ≈ 80 m⁻¹. Ensuite, σ = k × G pour toute solution mesurée avec cette cellule.</li>
          <li>Moyen de s’en souvenir : <strong>« d’abord on étalonne la cellule, ensuite on mesure »</strong>. Idée fausse : « k dépend de la solution étalon choisie ». Vrai : k ne dépend que de la cellule.</li>
        </Ul></>,
      texte: <>On garde la même cellule, de constante k = 80 m⁻¹ (étape précédente). On la plonge dans une solution S′ de chlorure de sodium, de concentration inconnue : le conductimètre affiche G = {g3(Gp)} mS.</>,
      tache: { type: 'num', q: 'Conductivité σ de la solution S′', unite: 'mS·m⁻¹', vrai: kG * Gp, tol: 0.05, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => ['σ = k × G, avec k = 80 m⁻¹ et G = 0,780 mS.', `σ = 80 × ${g3(Gp)} = ${nbf(kG * Gp, 1)} mS·m⁻¹ (des m⁻¹ multipliés par des mS donnent des mS·m⁻¹).`],
        pieges: [[kG / Gp, 'Vous avez divisé k par G : la relation est σ = k × G.'], [Gp / kG, 'Vous avez divisé G par k : la relation est σ = k × G.'], [kG * Gp / 1000, 'Votre valeur est en S·m⁻¹ : la question demande des mS·m⁻¹ (× 1 000).']],
        expl: `σ = 80 × ${g3(Gp)} = ${nbf(kG * Gp, 1)} mS·m⁻¹.`, indice: 'σ = k × G : multipliez la constante de cellule par la conductance affichée en mS ; le résultat sort en mS·m⁻¹.' } },
    { id: 'kohl', titre: 'De σ à la concentration : loi de Kohlrausch', focus: ['donnees', 'equation'],
      texte: <>La solution S′ contient des ions Na⁺ et Cl⁻ (équation en haut de l’écran). Vous avez trouvé σ = {nbf(kG * Gp, 1)} mS·m⁻¹. La loi de Kohlrausch, valable pour une solution diluée, relie σ aux concentrations des ions : {FKohl}avec c en mol·m⁻³ (1 mol·m⁻³ = 1 mmol/L). On donne λ(Na⁺)&nbsp;=&nbsp;5,0 et λ(Cl⁻)&nbsp;=&nbsp;7,6 mS·m²·mol⁻¹ (données).</>,
      tache: { type: 'num', q: 'Concentration c de la solution S′', unite: 'mmol/L', vrai: kG * Gp / M.sommeLambda('nacl'), tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['NaCl → Na⁺ + Cl⁻ : [Na⁺] = [Cl⁻] = c.', `σ = (λ(Na⁺) + λ(Cl⁻)) × c, donc c = frac(σ|λ(Na⁺) + λ(Cl⁻)) = frac(${nbf(kG * Gp, 1)}|5,0 + 7,6) = ${nbf(kG * Gp / 12.6, 2)} mol·m⁻³.`, `1 mol·m⁻³ = 1 mmol/L : c = ${nbf(kG * Gp / 12.6, 2)} mmol/L.`],
        pieges: [[kG * Gp / 5.0, 'Il manque la contribution de Cl⁻ : les deux ions contribuent à σ, il faut diviser par λ(Na⁺) + λ(Cl⁻).'], [kG * Gp / 7.6, 'Il manque la contribution de Na⁺ : les deux ions contribuent à σ, il faut diviser par λ(Na⁺) + λ(Cl⁻).'], [kG * Gp / 12.6 / 1000, 'Vous avez donné c en mol/L : la question demande des mmol/L (1 mol·m⁻³ = 1 mmol/L).']],
        expl: `c = frac(${nbf(kG * Gp, 1)}|12,6) = ${nbf(kG * Gp / 12.6, 2)} mmol/L.`, indice: 'Les deux ions ont la même concentration c : σ = (λ(Na⁺) + λ(Cl⁻)) × c. Isolez c ; avec σ en mS·m⁻¹ et λ en mS·m²·mol⁻¹, c sort en mol·m⁻³, c’est-à-dire en mmol/L.' } },
    { id: 'mesures', titre: 'Tracer la courbe d’étalonnage', focus: ['commandes', 'graphique'],
      retenirTitre: 'À RETENIR : DE G À LA CONCENTRATION',
      retenir: <>
        <SvgChaineCarte/>
        <Ul>
          <li>Pour passer de G à c : d’abord σ = k × G, puis c = σ divisée par Σλ (solution diluée, k et λ connus).</li>
          <li>Exemple de la simulation : G = 0,780 mS donne σ = 62,4 mS·m⁻¹, puis c = 4,95 mmol/L.</li>
          <li>Moyen de s’en souvenir : <strong>« G fois k donne σ ; σ divisée par Σλ donne c »</strong>. Idée fausse : « le conductimètre mesure directement la concentration ». Vrai : il mesure G ; la concentration se calcule.</li>
        </Ul></>,
      texte: <>La méthode précédente demande de connaître k et les λ, et suppose la solution diluée. Une autre méthode s’en passe : la <strong>courbe d’étalonnage</strong>. On prépare des solutions étalons de chlorure de sodium de concentrations connues (2,0 ; 4,0 ; 6,0 ; 8,0 et 10,0 mmol/L) et on mesure leur conductance G avec la même cellule. Choisissez un étalon, lisez G sur le conductimètre, puis ajoutez le point (c ; G) au graphique.</>,
      tache: { type: 'action', ok: ptsG.length >= 4 || apres('mesures'), label: 'Mesurer les cinq étalons pour moi', faire: () => setPtsG([...M.STD]), consigne: 'Ajoutez au moins 4 points au graphique : choisissez un étalon, puis « Ajouter le point à la courbe ».' } },
    { id: 'droite', titre: 'La droite d’étalonnage', focus: ['graphique'],
      texte: <>Les points sont presque alignés. Une solution sans chlorure de sodium ne conduit pas (G = 0 quand c = 0) : on trace la droite qui passe par l’origine et au plus près des points ; la simulation la calcule. Elle passe par le point (c = 10,0 mmol/L ; G = {g3(M.aff3((aGuide || 0.155) * 10))} mS) et a pour équation G = a × c.</>,
      tache: { type: 'num', q: 'Coefficient directeur a de la droite', unite: 'mS·L·mmol⁻¹', vrai: 0.155, tol: 0.05, affiche: v => nbf(v, 3), cs: 3,
        calcul: () => ['La droite passe par l’origine (0 ; 0) et par le point (10,0 ; 1,55) : a = frac(ΔG|Δc) = frac(1,55 − 0|10,0 − 0) = 0,155 mS par mmol/L.'],
        pieges: [[10 / 1.55, 'Le rapport est inversé : a = ΔG divisé par Δc, pas l’inverse.'], [15.5, 'Il faut diviser G par c, pas les multiplier.'], [0.0155, 'Le résultat est dix fois trop petit : 1,55 divisé par 10,0 donne 0,155.']],
        expl: 'a = frac(1,55|10,0) = 0,155 mS par mmol/L.', indice: 'Le coefficient directeur est l’écart de G divisé par l’écart de c entre deux points de la droite : ici l’origine et le point (10,0 ; 1,55).' } },
    { id: 'lecture', titre: 'Lire la concentration de la solution S′', focus: ['graphique', 'scene'],
      texte: <>La solution S′ de l’étape 4, mesurée avec la même cellule, a pour conductance G = {g3(Gp)} mS. Sur le graphique, on part de cette valeur de G, on rejoint la droite, puis l’axe des concentrations. Par le calcul : G = a × c, avec a = 0,155 mS par mmol/L (étape précédente).</>,
      tache: { type: 'num', q: 'Concentration c de la solution S′', unite: 'mmol/L', vrai: Gp / 0.155, tol: 0.06, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => [`G = a × c, donc c = frac(G|a) = frac(${g3(Gp)}|0,155) = ${nbf(Gp / 0.155, 2)} mmol/L.`, 'Avec la loi de Kohlrausch (étape 5), on avait trouvé 4,95 mmol/L : les deux méthodes donnent des valeurs voisines.'],
        pieges: [[0.155 / Gp, 'Le rapport est inversé : c = G divisée par a.'], [Gp * 0.155, 'Il faut diviser G par a, pas les multiplier.'], [Gp / 0.155 / 1000, 'Vous avez donné c en mol/L : la question demande des mmol/L.']],
        expl: `c = frac(${g3(Gp)}|0,155) ≈ ${nbf(Gp / 0.155, 2)} mmol/L ; la lecture sur le graphique donne environ 5 mmol/L.`, indice: 'G = a × c : isolez c, puis calculez avec G en mS et a en mS par mmol/L ; c sort en mmol/L.' } },
    { id: 'pente', titre: 'Ce que contient la pente de la droite', focus: ['graphique'],
      retenirTitre: 'À RETENIR : LA DROITE D’ÉTALONNAGE',
      retenir: <>
        <SvgDroiteCarte/>
        <Ul>
          <li>Pour un soluté et une cellule donnés, G est <strong>proportionnelle</strong> à c : G = a × c, une droite qui passe par l’origine. On mesure G de la solution, puis on lit c sur la droite (c = G divisée par a).</li>
          <li>Exemple de la simulation : avec les étalons de chlorure de sodium, a = 0,155 mS par mmol/L et G = 0,780 mS donne c = 5,03 mmol/L.</li>
          <li>Moyen de s’en souvenir : <strong>« des points, une droite, une lecture »</strong>. Idée fausse : « il faut connaître k et les λ pour utiliser la droite ». Vrai : la droite les contient déjà dans son coefficient directeur, on s’en passe.</li>
        </Ul></>,
      texte: <>Le coefficient directeur n’est pas un hasard. Comme G = σ divisée par k et σ = Σ λ × c (Kohlrausch), pour un sel à deux ions : {FPente}où λ₊ et λ₋ sont les conductivités ioniques molaires du cation et de l’anion. Avec k = 80 m⁻¹, cela donne 0,157 mS par mmol/L pour NaCl, valeur proche de la pente trouvée (0,155).</>,
      tache: { type: 'qcm', q: 'On remplace la cellule par une cellule de constante k plus grande (plaques plus éloignées), avec le même soluté. Que devient la droite d’étalonnage G = f(c) ?', ...Q.pente,
        expl: 'a = frac(λ₊ + λ₋|k) : si k augmente, a diminue. Une autre cellule, ou un autre soluté, donne une autre droite : l’étalonnage doit être refait dans les mêmes conditions que la mesure (même cellule, même soluté, même température).',
        indice: 'Dans G = σ divisée par k, que devient G pour la même solution quand k augmente ? Que devient alors le coefficient directeur de G en fonction de c ?' } },
    { id: 'limites', titre: 'Jusqu’où la droite est-elle valable ?', focus: ['graphique'],
      texte: <>Le graphique est prolongé avec trois étalons plus concentrés (20, 50 et 100 mmol/L, carrés vides) : ils s’écartent de la droite, d’autant plus que c est grand. Au-delà d’environ 10 mmol/L (1,0×10⁻² mol/L), les ions sont assez proches pour interagir : la loi de Kohlrausch n’est plus valable, la droite non plus.</>,
      tache: { type: 'qcm', q: 'On veut doser une solution S trop concentrée : sa conductance dépasse celle de tous les étalons de la droite. Que faire ?', ...Q.limites,
        expl: 'La droite ne vaut que dans le domaine où G est proportionnelle à c : au-delà, G est plus petite que la droite ne le prévoit et on sous-estimerait c. On dilue donc la solution d’un facteur F connu pour la ramener dans le domaine, on mesure sa conductance, puis on multiplie la concentration lue par F.',
        indice: 'La droite n’est valable que pour c faible. Comment ramener une solution concentrée dans cette zone sans changer la quantité de soluté ?' } },
    { id: 'dilution', titre: 'Retour à la solution de départ', focus: ['scene'],
      retenirTitre: 'À RETENIR : LES LIMITES DE LA DROITE',
      retenir: <>
        <SvgLimitesCarte/>
        <Ul>
          <li>La proportionnalité entre G et c n’est valable que pour une <strong>solution diluée</strong> (c inférieure à 10 mmol/L environ) ; au-delà, les points s’écartent de la droite : on ne prolonge pas la droite.</li>
          <li>Pour une solution trop concentrée, on la dilue d’un facteur F connu et on revient à la solution de départ : {FCSol}</li>
          <li>Exemple de la simulation : à 100 mmol/L, G est inférieure de 20 % environ à la valeur donnée par la droite prolongée.</li>
          <li>Moyen de s’en souvenir : <strong>« trop concentré ? on dilue »</strong>. Idée fausse : « on peut prolonger la droite aussi loin qu’on veut ». Vrai : au-delà de 10 mmol/L, G est plus petite que prévu, donc c serait sous-estimée.</li>
        </Ul></>,
      texte: <>On revient à la solution S à doser, trop concentrée. On en prélève 10,0 mL que l’on complète à 200,0 mL avec de l’eau distillée dans une fiole jaugée : on obtient la solution S′ étudiée, dont la concentration vaut c′ = 5,0 mmol/L (étape 8).</>,
      tache: { type: 'num', q: 'Concentration c(S) de la solution de départ S', unite: 'mol/L', vrai: M.FACTEUR_DILUTION * M.C_INCONNUE / 1000, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['Facteur de dilution : F = frac(200,0|10,0) = 20.', 'c(S) = F × c(S′) = 20 × 5,0 = 100 mmol/L = 0,100 mol/L (1 mmol/L = 10⁻³ mol/L).'],
        pieges: [[0.0050, 'Vous avez donné c(S′) en mol/L : il faut multiplier par F.'], [100, 'Vous avez gardé des mmol/L : la question demande des mol/L (÷ 1 000).'], [0.00025, 'Vous avez divisé par F : S est plus concentrée que S′, il faut multiplier.']],
        expl: 'c(S) = 20 × 5,0 = 100 mmol/L = 0,100 mol/L.', indice: 'Le facteur de dilution est le volume final divisé par le volume prélevé. La solution de départ est F fois plus concentrée que la solution diluée.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : DOSER PAR ÉTALONNAGE',
      retenir: <>
        <SvgDemarcheCarte/>
        <Ul>
          <li>Démarche : des <strong>étalons</strong> de concentrations connues, la conductance de chacun, la <strong>droite G = a × c</strong>, puis la conductance de la solution diluée et la lecture de c (à multiplier par le facteur de dilution F).</li>
          <li>Exemple de la simulation : S′ à 5,0 mmol/L (droite d’étalonnage ou loi de Kohlrausch) donne S à 0,100 mol/L.</li>
          <li>Moyen de s’en souvenir : <strong>« mêmes conditions pour les étalons et pour la solution »</strong>. Idée fausse : « il suffit de lire G pour connaître c ». Vrai : on compare G à celles d’étalons mesurés avec la même cellule, le même soluté et à la même température.</li>
        </Ul></>,
      texte: <>Vous savez distinguer la conductance G (en S) de la conductivité σ (en S·m⁻¹), déterminer la constante de cellule k par étalonnage, tracer une courbe d’étalonnage et l’utiliser pour doser une solution en respectant son domaine de validité. Passez à l’exploration (4 solutés, 4 cellules, étalons de 1 à 100 mmol/L) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'cellule' ? { type: 'cellule', ...M.tirageDefiCellule(), reps: { c: '' }, verifie: false } : { type: 'dosage', ...M.tirageDefiDosage(), reps: { c: '' }, verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const procheTol = (x, v, t) => isFinite(x) && Math.abs(x - v) <= t * v;
  const verifier = () => {
    if (defi.type === 'cellule') { const ok = procheTol(lireNombre(defi.reps.c), defi.cCalc, 0.06); setDefi(d => ({ ...d, verifie: true, ok })); noterK(ok); }
    else { const ok = procheTol(lireNombre(defi.reps.c), defi.cS, 0.10); setDefi(d => ({ ...d, verifie: true, ok })); noterD(ok); }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (nom, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{avecIndices(nom)} =</span>
      <input value={defi.reps.c} aria-label={nom} onKeyDown={e => e.key === 'Enter' && document.getElementById('et-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, c: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>{unite && <span>{unite}</span>}
    </div>);
  const sD = dd ? M.SOLUTES[dd.id] : null;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['cellule', 'Conductance et concentration'], ['dosage', 'Dosage par étalonnage']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'cellule' ? 'Défi : quelle est la concentration de la solution ?' : 'Défi : quelle est la concentration de la solution à doser ?'}</div>
      {defi.type === 'cellule' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>La constante de la cellule est inconnue. Plongée dans une solution étalon de chlorure de potassium de conductivité <strong>σ = {M.aff3(defi.et.sigma) === defi.et.sigma ? nbf(defi.et.sigma, defi.et.sigma < 100 ? 1 : 0) : nbf(defi.et.sigma, 0)}{NB}mS·m⁻¹</strong> (flacon), elle affiche <strong>G = {g3(defi.Get)}{NB}mS</strong>. Plongée dans une solution de <strong>{sD.nom}</strong> ({sD.f}), de concentration inconnue, elle affiche <strong>G = {g3(defi.GX)}{NB}mS</strong>. Déterminez la concentration c de la solution, en mmol/L, avec 2 chiffres significatifs (marge acceptée : 6{NB}% de la valeur ; λ dans le tableau de données).</div>
        {champ('c', 'mmol/L')}
        <IndiceDefi cache={false}>Étalonnez d’abord la cellule : k = σ(étalon) divisée par G(étalon), en m⁻¹. Puis σ = k × G pour la solution (en mS·m⁻¹). Enfin σ = (λ(cation) + λ(anion)) × c donne c en mol·m⁻³, c’est-à-dire en mmol/L.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On dose une solution S de <strong>{sD.nom}</strong> ({sD.f}) trop concentrée : on la dilue <strong>{dd.F} fois</strong> pour obtenir S′. Les étalons ont été mesurés avec la même cellule (graphique et tableau). La conductance de S′ vaut <strong>G = {g3(dd.Gd)}{NB}mS</strong>. Déterminez la concentration de S en mol/L, avec 2 chiffres significatifs (marge acceptée : 10{NB}% de la valeur).</div>
        {champ('c(S)', 'mol/L')}
        <IndiceDefi cache={false}>Calculez le coefficient directeur a = G divisée par c pour un étalon (la droite passe par l’origine), puis c(S′) = G(S′) divisée par a en mmol/L. Enfin c(S) = F × c(S′), à convertir en mol/L (1 mol/L = 1 000 mmol/L).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="et-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'cellule'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `k = ${nbf(defi.et.sigma, defi.et.sigma < 100 ? 1 : 0)} / ${g3(defi.Get)} = ${nbf(defi.kc, 1)} m⁻¹ ; σ = ${nbf(defi.kc, 1)} × ${g3(defi.GX)} = ${nbf(defi.sig, 1)} mS·m⁻¹ ; c = ${nbf(defi.sig, 1)} / ${nbf(M.sommeLambda(defi.id), 1)} = ${nbf(defi.cCalc, 2)} mmol/L (marge acceptée : 6 % de la valeur).`
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `a ≈ ${nbf(defi.a, 3)} mS par mmol/L ; c(S′) = ${g3(defi.Gd)} / ${nbf(defi.a, 3)} ≈ ${nbf(defi.cdLue, 1)} mmol/L ; c(S) = ${dd.F} × ${nbf(defi.cdLue, 1)} ≈ ${nbf(dd.F * defi.cdLue / 1000, 3)} mol/L (valeur préparée : ${nbf(defi.cS, 3)} mol/L ; marge acceptée : 10 % de la valeur).`}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> (la conductivité augmente d’environ 2 % par degré : l’étalonnage et la mesure se font à la même température) ; les conductivités ioniques molaires λ sont celles de la simulation sur le titrage conductimétrique (arrondies au dixième, constantes).</li>
      <li><strong>Constante de cellule</strong> k = L divisée par S : modèle idéal de deux plaques parallèles, sans effet de bord. Dans une vraie cellule, k s’écarte un peu de ce calcul : c’est pourquoi on la détermine par étalonnage avec une solution de conductivité connue (chlorure de potassium).</li>
      <li><strong>Loi de Kohlrausch</strong> : σ = Σ λ × c, valable pour une solution <strong>diluée</strong> (c inférieure à environ 10 mmol/L). Au-delà, les interactions entre ions font baisser σ : la simulation les représente par un facteur empirique (hors programme, jamais affiché) qui donne un écart de 2 % à 10 mmol/L, de 10 % à 50 mmol/L et de 20 % à 100 mmol/L, du même ordre de grandeur que pour le chlorure de sodium réel.</li>
      <li><strong>Droite d’étalonnage</strong> : elle passe par l’origine (sans soluté, G = 0) et est calculée par la méthode des moindres carrés avec les points dont c ne dépasse pas 10 mmol/L ; les points plus concentrés (carrés vides) ne servent pas à la tracer.</li>
      <li><strong>Conductimètre idéal</strong> : il affiche G avec 3 chiffres significatifs, sans bruit de mesure ni dérive. Les incertitudes sur les volumes prélevés, sur les concentrations des étalons et sur la lecture du graphique ne sont pas traitées.</li>
      <li><strong>Mêmes conditions</strong> : le même soluté, la même cellule et la même température pour les étalons et pour la solution à doser. Changer de soluté ou de cellule efface les points de l’exploration.</li>
      <li><strong>Schéma des ions</strong> : un point est un ion ; le nombre de points est qualitatif (plus de points = plus concentré, sans échelle) ; les tailles sont symboliques (Na⁺ plus petit que H₃O⁺, les anions plus gros) pour distinguer les ions sans compter sur la couleur.</li>
      <li><strong>Limites</strong> : pas de mélange de solutés, pas de réaction chimique (le titrage conductimétrique est dans la simulation précédente).</li>
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
  const boxScene = (!dd || dd.type === 'cellule') && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ marginBottom: 6, ...cadre('equation') }}><LigneEquation texte={eqTexte}/></div>
      {enExplore && <div style={aide}>Le bécher contient une solution étalon ; la cellule mesure sa conductance G. Les points sont des ions (leur nombre est qualitatif).</div>}
      <SceneEtalonnage cat={sc.cat} an={sc.an} n={sc.n} lecture={sc.lecture} titre={sc.titre}/>
    </div>);
  const lignesLambda = (() => {
    if (enGuide) return ['Na', 'Cl'];
    const s = dd && dd.type === 'cellule' ? M.SOLUTES[dd.id] : solEx;
    return [s.cat, s.an];
  })();
  const ligneLambda = k => <span key={k} style={{ whiteSpace: 'nowrap' }}>λ({{ Na: 'Na⁺', Cl: 'Cl⁻', H3O: 'H₃O⁺', NO3: 'NO₃⁻', AcO: 'CH₃COO⁻' }[k]}) = <strong>{nbf(M.sommeLambda('nacl') && ({ Na: 5.0, Cl: 7.6, H3O: 35.0, NO3: 7.1, AcO: 4.1 }[k]), 1)}</strong></span>;
  const tableDonnees = (
    <div style={{ ...styleBoite, ...cadre('donnees') }}>
      <div style={titreCarte}>Données</div>
      {(!enGuide || deja('etalon')) && enGuide && <div style={{ fontSize: 15, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>Solution étalon de chlorure de potassium KCl à 0,0100{NB}mol/L, à 25{NB}°C : σ(étalon){NB}={NB}<strong>141{NB}mS·m⁻¹</strong></div>}
      {(!enGuide || deja('kohl')) && <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>{lignesLambda.map(ligneLambda)}</div>
        <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>λ en mS·m²·mol⁻¹, à 25 °C.</div></>}
    </div>);
  const boxDonnees = enGuide && deja('etalon') ? tableDonnees : null;
  const boxDefiDonnees = dd && dd.type === 'cellule' ? (
    <div style={styleBoite}><div style={titreCarte}>Données</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>{lignesLambda.map(ligneLambda)}</div>
      <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>λ en mS·m²·mol⁻¹, à 25 °C.</div></div>) : null;

  // ---------- parcours : commandes de mesure des étalons ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const ajouterG = () => setPtsG(p => (p.includes(cSel) ? p : [...p, cSel]));
  const boxCommandes = enGuide && deja('mesures') && !apres('droite') && (
    <div style={{ ...styleBoite, ...cadre('commandes') }}>
      <div style={titreCarte}>Mesurer un étalon</div>
      <div style={aide}>Choisissez la concentration de l’étalon : le conductimètre affiche sa conductance. Ajoutez ensuite le point (c ; G) au graphique.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Concentration de l’étalon
        <select value={cSel} onChange={e => setCSel(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>
          {M.STD.map(c => <option key={c} value={c}>{nbf(c, 1)} mmol/L{ptsG.includes(c) ? ' (déjà ajouté)' : ''}</option>)}
        </select>
      </label>
      <button onClick={ajouterG} style={styleBouton(true, '#0369a1')}>Ajouter le point à la courbe</button>
      <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>{ptsG.length} point{ptsG.length > 1 ? 's' : ''} ajouté{ptsG.length > 1 ? 's' : ''} (il en faut au moins 4).</div>
    </div>);

  // ---------- graphique ----------
  const marqueurG = deja('lecture') ? { G: Gp } : null;
  const boxGraph = enGuide ? (deja('mesures') && (
    <div style={{ ...styleBoite, ...cadre('graphique') }}>
      <div style={titreCarte}>Courbe d’étalonnage : conductance G en fonction de la concentration c</div>
      <GraphiqueEtalonnage points={ptsGuide} droite={aGuide} marqueur={marqueurG ? { ...marqueurG } : null} xMax={etendu ? 100 : 12} yMax={etendu ? 16 : 1.8} titre="Courbe d’étalonnage du chlorure de sodium"/>
    </div>)) : enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Courbe d’étalonnage : conductance G en fonction de la concentration c</div>
      <div style={aide}>Chaque point ajouté est une mesure d’étalon. La droite passe par l’origine ; elle est calculée avec les points dont c ne dépasse pas 10 mmol/L (cercles pleins) et prolongée en pointillés ; les carrés vides sont hors domaine.</div>
      <GraphiqueEtalonnage points={ptsEx} droite={aEx} xMax={xMaxEx} yMax={yMaxEx} titre={`Courbe d’étalonnage : ${solEx.nom}, ${cellEx.nom}`}/>
    </div>);
  const ptsDefi = dd && dd.type === 'dosage' ? dd.pts : null;
  const boxDefiGraph = ptsDefi && (
    <div style={styleBoite}>
      <div style={titreCarte}>Étalons mesurés avec la même cellule</div>
      <GraphiqueEtalonnage points={ptsDefi} xMax={12} yMax={nice(1.12 * Math.max(...ptsDefi.map(p => p.G)))} titre="Conductances des étalons"/>
      <Section titre="Voir les valeurs mesurées" ouvert={ouv.valeurs} onBascule={() => setOuv(o => ({ ...o, valeurs: !o.valeurs }))}>
        <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%', fontFamily: 'monospace' }}><tbody>
          <tr><td style={{ padding: '2px 4px', color: KIT.txt2 }}>c (mmol/L)</td>{ptsDefi.map(p => <td key={p.c} style={{ padding: '2px 4px', textAlign: 'right' }}>{nbf(p.c, 1)}</td>)}</tr>
          <tr><td style={{ padding: '2px 4px', color: KIT.txt2 }}>G (mS)</td>{ptsDefi.map(p => <td key={p.c} style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>{g3(p.G)}</td>)}</tr></tbody></table>
      </Section>
    </div>);
  const boxDefiEq = dd && <div style={styleBoite}><LigneEquation texte={M.SOLUTES[dd.id].eq}/></div>;

  // ---------- réglages (exploration) ----------
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages de l’expérience</div>
      <div style={aide}>Choisissez le soluté, la cellule et la concentration de l’étalon : le conductimètre affiche G. Ajoutez le point (c ; G) pour construire la courbe d’étalonnage.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Soluté
        <select value={ex.sol} onChange={e => setE({ sol: e.target.value })} style={{ ...menu, marginTop: 2 }}>
          {M.ORDRE_SOLUTES.map(id => <option key={id} value={id}>{M.SOLUTES[id].nom} ({M.SOLUTES[id].f})</option>)}
        </select>
      </label>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Cellule de conductimétrie
        <select value={ex.cell} onChange={e => setE({ cell: e.target.value })} style={{ ...menu, marginTop: 2 }}>
          {M.ORDRE_CELLULES.map(id => { const c = M.CELLULES[id]; return <option key={id} value={id}>{c.nom} : S = {nbf(c.S, 1)} cm², L = {nbf(c.L, 1)} cm</option>; })}
        </select>
      </label>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Concentration de l’étalon
        <select value={ex.c} onChange={e => setE({ c: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>
          {M.C_MENU.map(c => <option key={c} value={c}>{nbEx(c)} mmol/L{!M.dansDomaine(c) ? ' (hors domaine)' : ''}{exPts.includes(c) ? ' (déjà ajouté)' : ''}</option>)}
        </select>
      </label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setExPts(p => (p.includes(ex.c) ? p : [...p, ex.c]))} style={styleBouton(true, '#0369a1')}>Ajouter le point à la courbe</button>
        <button onClick={() => setExPts([])} style={styleBouton(false)}>Effacer les points</button>
      </div>
      <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>Changer de soluté ou de cellule efface les points : une courbe d’étalonnage ne vaut que pour une cellule et un soluté.</div>
    </div>);

  // ---------- mesures ----------
  const GxEx = M.gAffichee(ex.sol, ex.c, kEx);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <div style={aide}>Valeurs pour la solution et la cellule choisies.</div>
      <LigneMesure nom="Conductance G" valeur={`${g3(GxEx)}${NB}mS`} couleur={COL.bleu}/>
      <LigneMesure nom="Constante de cellule k = L / S" valeur={`${nbf(kEx, 0)}${NB}m⁻¹`}/>
      <LigneMesure nom="Conductivité σ = k × G" valeur={`${nbf(kEx * GxEx, kEx * GxEx >= 100 ? 0 : 1)}${NB}mS·m⁻¹`} couleur={COL.orange}/>
      <LigneMesure nom="Prévu par Kohlrausch : Σλ / k" valeur={`${nbf(M.penteTheorique(ex.sol, kEx), 3)}${NB}mS·L·mmol⁻¹`}/>
      <LigneMesure nom="Pente a de la droite tracée" valeur={aEx ? `${nbf(aEx, 3)}${NB}mS·L·mmol⁻¹` : 'ajoutez des points'} couleur={COL.vert}/>
      {!M.dansDomaine(ex.c) && <div style={{ fontSize: 13.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>Au-delà de 10 mmol/L, la loi de Kohlrausch n’est plus valable : G est plus petite que ne le prévoit la droite.</div>}
    </div>);
  const sectionLambda = enExplore && (
    <Section titre="Données : conductivités ioniques molaires" ouvert={ouv.lambda} onBascule={() => setOuv(o => ({ ...o, lambda: !o.lambda }))}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>{lignesLambda.map(ligneLambda)}</div>
      <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>λ en mS·m²·mol⁻¹, à 25 °C. Σλ = λ du cation + λ de l’anion.</div>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Ajoutez les étalons de 1 à 10 mmol/L pour le chlorure de sodium : la droite passe-t-elle par l’origine ? Comparez sa pente à la valeur « Σλ / k » des mesures.</li>
        <li>Gardez la même solution et passez de la cellule A à la cellule C : que deviennent G et σ ? Laquelle des deux grandeurs dépend de la cellule ?</li>
        <li>Choisissez l’acide chlorhydrique : la pente change-t-elle beaucoup ? Quel ion en est responsable (comparez les λ) ?</li>
        <li>Ajoutez les étalons à 20, 50 et 100 mmol/L : à partir de quelle concentration les points s’écartent-ils de la droite ? De combien à 100 mmol/L ?</li>
        <li>Changez de soluté après avoir tracé la droite : que se passe-t-il pour les points, et pourquoi ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Le conductimètre mesure la conductance G (en S) ; la conductivité σ (en S·m⁻¹) vaut σ = k × G, avec k = L divisée par S, constante de la cellule (en m⁻¹)</li>
          <li>On détermine k en étalonnant la cellule avec une solution de conductivité connue : k = σ(étalon) divisée par G(étalon)</li>
          <li>Loi de Kohlrausch : σ = Σ λ × c, valable pour une solution diluée (c inférieure à 10 mmol/L environ)</li>
          <li>Courbe d’étalonnage : G = a × c, droite par l’origine ; on lit c avec c = G divisée par a ; a = Σλ divisée par k</li>
          <li>Solution trop concentrée : on la dilue d’un facteur F connu et c(S) = F × c(S′)</li>
          <li>Mêmes conditions pour les étalons et la solution : même cellule, même soluté, même température</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .et-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .et-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .et-col { display: flex; flex-direction: column; gap: 12px; }
        .et-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .et-l1.cote .et-carte { order: 2; } .et-l1.cote .et-main { order: 1; }
          .et-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .et-ex > * { grid-column: 1; } .et-ex > .et-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .et-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .et-in { animation: et-fondu 0.35s ease-out; } @keyframes et-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Dosage conductimétrique par étalonnage</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le conductimètre mesure une <strong>conductance G</strong> ; la <strong>constante de cellule</strong> la relie à la conductivité σ. Une <strong>courbe d’étalonnage</strong> permet ensuite de doser une solution.</div>
      {!enExplore && <div className="et-l1 cote">
        {enGuide ? <div className="et-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="et-carte">{panneauHypo}</div> : null}
        <div className="et-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'cellule' ? suiviK : suiviD}/></div>}
          {dd && <div className="et-col">{boxDefiEq}{dd.type === 'cellule' ? <div style={styleBoite}><SceneEtalonnage cat={sc.cat} an={sc.an} n={sc.n} lecture={sc.lecture} titre={sc.titre}/></div> : boxDefiGraph}{boxDefiDonnees}</div>}
          {!dd && <div className="et-col">
            <div className="et-in">{boxScene}</div>
            {boxDonnees && <div className="et-in">{boxDonnees}</div>}
            {boxCommandes && <div className="et-in">{boxCommandes}</div>}
            {boxGraph && <div className="et-in">{boxGraph}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <div className="et-ex">
        <div>{boxScene}</div>
        <div className="et-ctrl">{reglages}</div>
        <div>{boxGraph}</div>
        <div>{mesures}</div>
        <div>{sectionLambda}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
