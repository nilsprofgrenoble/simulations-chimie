import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, accepte, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./etalonnageTstlModele";
import { QCM_PARCOURS as Q } from "./etalonnageTstlQcm";
import { SceneProtocole, GraphiqueEtalon, SvgGSigmaKCarte, SvgDroiteCarte, SvgDomaineCarte, SvgDilutionCarte, SvgChoixGammeCarte, SvgDemarcheCarte } from "./etalonnageTstlSchemas";

const SIM_ID = 258, CLE_GUIDE = 'etalonnage-protocole-tstl-guide-v1';
declarerDefis(SIM_ID, [['dilution', 'Choisir le facteur de dilution'], ['dosage', 'Dosage par étalonnage avec dilution']]);

// ====================================================
// SIM 258 — DOSAGE PAR ÉTALONNAGE CONDUCTIMÉTRIQUE : CONCEVOIR LE PROTOCOLE (TSTL SPCL, chapitre « Conductivité et titrages conductimétriques »).
//  Une seule idée : un dosage par étalonnage se conçoit. Étalons préparés par dilution et tous dans le domaine de validité (c ≤ 10 mmol/L), droite G = a × c,
//  solution à doser diluée pour tomber au milieu de la gamme, mêmes conditions (cellule, soluté, température), puis c(X) = F × c(X′).
//  Capacités visées (jamais affichées à l'élève) : relier conductance et conductivité (G = σ / k, k = L / S) ; protocole de dosage par étalonnage (concevoir) ;
//  tracer une droite d'étalonnage ; domaine de validité de la loi de Kohlrausch ; dilution.
//  Modèle : etalonnageTstlModele.js (réutilise sans le modifier condEtalonnageModele.js de la sim 136). Situations originales ; aucune situation, valeur ni question du Moodle n'est reprise.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const g3 = v => Number(v).toPrecision(3).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const IDS = ['cellule', 'droite', 'domaine', 'preparer', 'gamme', 'pente', 'choixF', 'mesure', 'retour', 'sansDilution', 'temperature', 'bilan'];
const SOL = M.SOLUTES[M.SOL];
const VP_MENU = [1, 2, 4, 6, 8, 10, 20, 50];       // mL prélevés dans la solution mère (100 mmol/L) pour une fiole de 100,0 mL → c = Vp en mmol/L
const F_MENU = [1, 5, 10, 20, 50, 100, 200, 500];
const T_MENU = [20, 25, 30];
const CS_VRAIE = M.C_S;                              // mmol/L (inconnue de l'élève dans le parcours)
const cLue = M.C_DIL_LUE, cSLue = M.C_S_LUE, aG = M.A_GUIDE;
const lblSit = s => ({ dans: 'dans la gamme des étalons', 'hors-domaine': 'hors du domaine de validité (> 10 mmol/L)', 'en-dessous': 'en dessous du plus petit étalon', 'au-dessus': 'au-dessus du plus grand étalon' }[s]);

// ====================================================
export function SimulationEtalonnageProtocole() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviD, noterD] = useCompteurDefi(), [suiviO, noterO] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('dilution');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false });
  const [vpSel, setVpSel] = useState(4), [ptsG, setPtsG] = useState([]);                       // parcours : étalon choisi et étalons mesurés (volumes Vp)
  const [ex, setEx] = useState({ sol: 'nano3', cell: 'A', cible: 'etalon', F: 50, T: 25 }), [exPts, setExPts] = useState([]);   // exploration
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const rang = id => IDS.indexOf(id);
  const reussie = !!(guide.reussies && guide.reussies[etape]);
  const apres = id => enGuide && rang(idE) > rang(id);              // étape déjà passée

  // ---------- étapes du parcours ----------
  const c4 = M.concEtalon(4);
  const ETAPES = [
    { id: 'cellule', titre: 'La cellule de conductimétrie', focus: ['scene'],
      texte: <>Pour mesurer la conductivité d’une solution, on plonge dans cette solution une <strong>cellule</strong> formée de deux plaques parallèles de surface S, distantes de L, reliées à un conductimètre. Il affiche la <strong>conductance G</strong> de la solution comprise entre les plaques. La <strong>conductivité σ</strong> de la solution (en S·m⁻¹) s’en déduit grâce à la <strong>constante de cellule k</strong> : σ&nbsp;=&nbsp;k&nbsp;×&nbsp;G, avec k&nbsp;=&nbsp;L&nbsp;/&nbsp;S. Pour la cellule dessinée, S&nbsp;=&nbsp;2,0&nbsp;cm² et L&nbsp;=&nbsp;1,6&nbsp;cm.</>,
      tache: { type: 'num', q: 'Constante de cellule k', unite: 'm⁻¹', vrai: M.K, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Conversions : L = 1,6 cm = 1,6×10⁻² m et S = 2,0 cm² = 2,0×10⁻⁴ m².', `k = L / S = ${nbf(1.6e-2, 4)} / ${nbf(2.0e-4, 4)} = ${nbf(M.K, 0)} m⁻¹.`],
        pieges: [[0.8, 'Vous avez gardé les centimètres : 0,80 est en cm⁻¹. Pour avoir des m⁻¹, convertissez L en mètres et S en m² (1 cm² = 10⁻⁴ m²).'], [1.25, 'Vous avez calculé S / L : la constante de cellule est L / S.'], [0.008, 'Vous avez converti L en mètres mais pas S : 1 cm² = 10⁻⁴ m², pas 10⁻² m².'], [8000, 'Vous avez converti S en m² mais pas L : 1 cm = 10⁻² m.']],
        expl: `k = L / S = 1,6×10⁻² m / 2,0×10⁻⁴ m² = ${nbf(M.K, 0)} m⁻¹.`,
        indice: 'k = L / S : convertissez d’abord L en mètres (1 cm = 10⁻² m) et S en mètres carrés (1 cm² = 10⁻⁴ m²).' } },
    { id: 'droite', titre: 'G en fonction de la concentration', focus: ['scene'],
      retenirTitre: 'À retenir : G, σ et k',
      retenir: <>
        <SvgGSigmaKCarte/>
        <Ul>
          <li>La conductance G (en S) dépend de la solution <strong>et</strong> de la cellule ; la conductivité σ (en S·m⁻¹) ne dépend que de la solution. Elles sont liées par la constante de cellule : <strong>G = σ / k</strong>, avec <strong>k = L / S</strong> en m⁻¹.</li>
          <li>Pour k, convertir L en mètres et S en m² : 1 cm⁻¹ = 100 m⁻¹.</li>
          <li>Moyen de s’en souvenir : <strong>« k mesure la cellule, σ mesure la solution »</strong>. Idée fausse : « G est une propriété de la solution seule ». Vrai : une autre cellule donne une autre G pour la même solution.</li>
        </Ul></>,
      texte: <>On prépare plusieurs solutions de nitrate de sodium (Na⁺ + NO₃⁻) de concentrations c connues, et on mesure la conductance G de chacune avec la cellule précédente. Pour une solution diluée, la loi de Kohlrausch donne σ&nbsp;=&nbsp;(λ(Na⁺)&nbsp;+&nbsp;λ(NO₃⁻))&nbsp;×&nbsp;c, où λ est la conductivité ionique molaire de chaque ion, et G&nbsp;=&nbsp;σ&nbsp;/&nbsp;k.</>,
      tache: { type: 'qcm', q: 'Quelle est l’allure de la courbe G = f(c) pour ces solutions diluées ?', ...Q.droite,
        expl: 'G = σ / k = (λ(Na⁺) + λ(NO₃⁻)) × c / k : G est proportionnelle à c. La courbe est une droite qui passe par l’origine (sans soluté, la solution ne conduit pas).',
        indice: 'Écrivez G en fonction de c avec σ = Σ λ × c et G = σ / k : quelle fonction de c obtenez-vous ?' } },
    { id: 'domaine', titre: 'Le domaine de validité', focus: ['scene'],
      retenirTitre: 'À retenir : la droite d’étalonnage',
      retenir: <>
        <SvgDroiteCarte/>
        <Ul>
          <li>Pour une solution diluée, <strong>G = a × c</strong> : une droite passant par l’origine, de coefficient directeur <strong>a = (λ₊ + λ₋) / k</strong> (en mS par mmol/L).</li>
          <li>Cette droite, tracée avec des solutions de concentrations connues (les <strong>étalons</strong>), sert ensuite à retrouver une concentration inconnue à partir de G. On n’a pas besoin de connaître k ni les λ.</li>
          <li>Moyen de s’en souvenir : <strong>« même cellule, même soluté, même température »</strong>. Idée fausse : « une droite d’étalonnage vaut pour toute cellule ». Vrai : une autre cellule ou un autre soluté change la pente a.</li>
        </Ul></>,
      texte: <>La loi de Kohlrausch n’est valable que pour des solutions <strong>diluées</strong> : elle s’applique si c&nbsp;≤&nbsp;1,0×10⁻²&nbsp;mol/L, soit 10&nbsp;mmol/L. Au-delà, les ions se gênent mutuellement : G augmente moins vite que c et la courbe passe sous la droite. On a préparé cinq étalons de nitrate de sodium aux concentrations 2,0 ; 5,0 ; 10 ; 20 et 50&nbsp;mmol/L.</>,
      tache: { type: 'qcm', q: 'Lesquels peut-on utiliser pour tracer la droite d’étalonnage ?', ...Q.domaine,
        expl: 'La droite G = a × c n’est valable que pour c ≤ 10 mmol/L : on garde les étalons à 2,0 ; 5,0 et 10 mmol/L. Ceux à 20 et 50 mmol/L sont hors du domaine de validité : leurs points seraient sous la droite.',
        indice: 'Quelle est la concentration maximale pour laquelle G est proportionnelle à c ?' } },
    { id: 'preparer', titre: 'Préparer un étalon par dilution', focus: ['scene', 'reglage'],
      retenirTitre: 'À retenir : le domaine de validité',
      retenir: <>
        <SvgDomaineCarte/>
        <Ul>
          <li>La loi G = a × c n’est valable que pour <strong>c ≤ 1,0×10⁻² mol/L</strong> (10 mmol/L) : au-delà, la courbe réelle passe sous la droite.</li>
          <li>Tous les étalons doivent être <strong>dans le domaine de validité</strong>, et la solution à doser aussi.</li>
          <li>Moyen de s’en souvenir : <strong>« on étalonne en dilué »</strong>. Idée fausse : « plus l’étalon est concentré, meilleure est la droite ». Vrai : au-delà de 10 mmol/L, la droite n’est plus fiable.</li>
        </Ul></>,
      texte: <>Les étalons se préparent par <strong>dilution</strong> d’une solution mère M de nitrate de sodium à 1,00×10⁻¹&nbsp;mol/L (100&nbsp;mmol/L). On prélève à la pipette un volume V<sub>p</sub> de M, on le verse dans une fiole jaugée de 100,0&nbsp;mL, puis on complète avec de l’eau distillée jusqu’au trait de jauge. La quantité de matière prélevée se retrouve entière dans la fiole : c<sub>0</sub>&nbsp;×&nbsp;V<sub>p</sub>&nbsp;=&nbsp;c&nbsp;×&nbsp;V<sub>f</sub> (V<sub>f</sub> : volume de la fiole). Réglez V<sub>p</sub> à 4,00&nbsp;mL.</>,
      tache: { type: 'num', q: 'Concentration c de l’étalon obtenu avec V_p = 4,00 mL', unite: 'mmol/L', vrai: c4, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['La quantité de matière se conserve : c₀ × Vp = c × Vf, donc c = c₀ × Vp / Vf.', `c = 100 × 4,00 / 100,0 = ${nbf(c4, 1)} mmol/L.`],
        pieges: [[2500, 'Vous avez calculé c₀ × Vf / Vp : la solution est diluée, elle est moins concentrée que la solution mère.'], [400, 'Il manque la division par le volume de la fiole Vf = 100,0 mL : c = c₀ × Vp / Vf.'], [0.04, 'Vous avez mélangé les unités : la concentration est demandée en mmol/L, comme c₀ = 100 mmol/L.']],
        expl: `c = c₀ × Vp / Vf = 100 mmol/L × 4,00 mL / 100,0 mL = ${nbf(c4, 1)} mmol/L.`,
        indice: 'c₀ × Vp = c × Vf : isolez c, puis remplacez par c₀ = 100 mmol/L, Vp = 4,00 mL et Vf = 100,0 mL.' } },
    { id: 'gamme', titre: 'Mesurer la gamme d’étalons', focus: ['scene', 'reglage', 'graphe'],
      retenirTitre: 'À retenir : diluer',
      retenir: <>
        <SvgDilutionCarte/>
        <Ul>
          <li>Dans une dilution, la <strong>quantité de matière prélevée se conserve</strong> : <strong>c₀ × V<sub>p</sub> = c × V<sub>f</sub></strong>.</li>
          <li>Le <strong>facteur de dilution</strong> est F = V<sub>f</sub> / V<sub>p</sub> = c₀ / c : la solution diluée est F fois moins concentrée.</li>
          <li>Moyen de s’en souvenir : <strong>« on prélève Vp, on complète jusqu’au trait »</strong>. Idée fausse : « on ajoute le volume Vf d’eau ». Vrai : on complète pour <strong>obtenir</strong> le volume Vf.</li>
        </Ul></>,
      texte: <>Préparez de la même façon cinq étalons, avec V<sub>p</sub> = 2,00 ; 4,00 ; 6,00 ; 8,00 et 10,00&nbsp;mL (fiole de 100,0&nbsp;mL), soit <strong>2,0 ; 4,0 ; 6,0 ; 8,0 et 10 mmol/L</strong>. Mesurez la conductance G de chacun avec la cellule de l’étape 1 (k&nbsp;=&nbsp;{M.K}&nbsp;m⁻¹, soit S&nbsp;=&nbsp;2,0&nbsp;cm² et L&nbsp;=&nbsp;1,6&nbsp;cm) à 25&nbsp;°C : choisissez V<sub>p</sub>, puis « Mesurer cet étalon ».</>,
      tache: { type: 'action', ok: ptsG.length >= 4 || apres('gamme'), label: 'Mesurer les cinq étalons pour moi', faire: () => setPtsG([...M.VP_GUIDE]), consigne: 'Mesurez au moins 4 étalons : choisissez V_p, puis « Mesurer cet étalon ».' } },
    { id: 'pente', titre: 'Tracer la droite d’étalonnage', focus: ['graphe'],
      texte: <>Les points sont alignés avec l’origine : on trace la <strong>droite d’étalonnage G&nbsp;=&nbsp;a&nbsp;×&nbsp;c</strong>. Le coefficient directeur a se calcule avec un point : pour l’étalon de concentration <strong>10&nbsp;mmol/L</strong>, le conductimètre affiche G&nbsp;=&nbsp;<strong>{g3(M.PTS[4].G)}&nbsp;mS</strong>.</>,
      tache: { type: 'num', q: 'Coefficient directeur a de la droite', unite: 'mS par mmol/L', vrai: aG, tol: 0.04, affiche: v => nbf(v, 3), cs: 3,
        calcul: () => [`Pour un point de la droite passant par l’origine : a = G / c = ${g3(M.PTS[4].G)} / 10,0 = ${nbf(M.PTS[4].G / 10, 3)} mS par mmol/L.`, `La droite tracée par la méthode des moindres carrés avec les cinq points donne a = ${nbf(aG, 3)} mS par mmol/L.`],
        pieges: [[10 / M.PTS[4].G, 'Vous avez calculé c / G : le coefficient directeur est G / c.'], [M.PTS[4].G * 10, 'Vous avez multiplié G par c : le coefficient directeur est le quotient G / c.'], [M.PTS[4].G / 0.01, 'Vous avez exprimé c en mol/L : ici c est en mmol/L, donc a est en mS par mmol/L.']],
        expl: `a = G / c = ${g3(M.PTS[4].G)} mS / 10,0 mmol/L ≈ ${nbf(M.PTS[4].G / 10, 3)} mS par mmol/L (droite ajustée sur les cinq points : ${nbf(aG, 3)}).`,
        indice: 'Une droite passant par l’origine : a = G / c, avec G = 1,48 mS et c = 10,0 mmol/L.' } },
    { id: 'choixF', titre: 'Diluer la solution à doser', focus: ['scene'],
      texte: <>Une solution X de nitrate de sodium, de concentration c(X) inconnue, porte l’indication « de l’ordre de <strong>0,2&nbsp;mol/L</strong> ». Mesurée telle quelle, elle sortirait du domaine de validité : il faut la <strong>diluer</strong> d’un facteur F (X′ désigne la solution diluée) pour que c(X′) tombe <strong>dans la gamme des étalons</strong> (2,0 à 10&nbsp;mmol/L), de préférence vers le milieu. On dispose de pipettes jaugées de 1,00 ; 5,00 et 10,0&nbsp;mL et de fioles jaugées de 100,0 ; 250,0 et 500,0&nbsp;mL.</>,
      tache: { type: 'qcm', q: 'Quel protocole de dilution de X choisissez-vous ?', ...Q.choixF,
        expl: 'Il faut c(X′) = c(X) / F entre 2 et 10 mmol/L, soit F entre 20 et 100 : F = 50 donne environ 4 mmol/L. F = 10 donne environ 20 mmol/L (hors du domaine de validité) ; F = 500 donne environ 0,4 mmol/L (sous le plus petit étalon) ; sans dilution, X est à environ 200 mmol/L.',
        indice: 'Calculez c(X′) = c(X) / F = 200 mmol/L / F pour chaque proposition, puis comparez à la gamme de 2 à 10 mmol/L.' } },
    { id: 'mesure', titre: 'Mesurer la solution diluée', focus: ['scene', 'graphe'],
      retenirTitre: 'À retenir : choisir la dilution',
      retenir: <>
        <SvgChoixGammeCarte/>
        <Ul>
          <li>La solution diluée X′ doit se trouver <strong>dans la gamme des étalons</strong> (donc dans le domaine de validité), de préférence vers le milieu : <strong>c(X′) = c(X) / F</strong>.</li>
          <li>Trop concentrée : hors du domaine, la loi n’est plus valable. Trop diluée : sous le plus petit étalon, on <strong>extrapole</strong> et l’incertitude relative augmente.</li>
          <li>Moyen de s’en souvenir : <strong>« viser le milieu de la gamme »</strong>. Idée fausse : « il suffit de diluer beaucoup ». Vrai : une dilution excessive donne une conductance trop faible pour être lue précisément.</li>
        </Ul></>,
      texte: <>On dilue X avec le protocole retenu : <strong>5,00&nbsp;mL de X complétés à 250,0&nbsp;mL</strong> (F&nbsp;=&nbsp;50). On mesure la conductance de la solution diluée X′ avec la même cellule, à 25&nbsp;°C : le conductimètre affiche G′&nbsp;=&nbsp;<strong>{g3(M.G_DIL)}&nbsp;mS</strong>. La droite d’étalonnage a pour coefficient directeur a&nbsp;=&nbsp;{nbf(aG, 3)}&nbsp;mS par mmol/L.</>,
      tache: { type: 'num', q: 'Concentration c(X′) lue sur la droite d’étalonnage', unite: 'mmol/L', vrai: cLue, tol: 0.05, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['Sur la droite G′ = a × c(X′), donc c(X′) = G′ / a.', `c(X′) = ${g3(M.G_DIL)} / ${nbf(aG, 3)} = ${nbf(cLue, 2)} mmol/L, dans la gamme des étalons (2 à 10 mmol/L).`],
        pieges: [[M.G_DIL * aG, 'Vous avez multiplié G′ par a : G′ = a × c(X′), donc c(X′) = G′ / a.'], [aG / M.G_DIL, 'Vous avez calculé a / G′ : il faut G′ / a.'], [cLue * 50, 'Vous avez déjà multiplié par le facteur de dilution : on demande d’abord la concentration de la solution diluée X′.']],
        expl: `c(X′) = G′ / a = ${g3(M.G_DIL)} mS / ${nbf(aG, 3)} mS par mmol/L = ${nbf(cLue, 2)} mmol/L.`,
        indice: 'G′ = a × c(X′) : isolez c(X′) puis calculez avec G′ = 0,707 mS et a = 0,149 mS par mmol/L.' } },
    { id: 'retour', titre: 'Retrouver la concentration de X', focus: ['scene'],
      texte: <>La solution diluée X′ a une concentration c(X′)&nbsp;=&nbsp;<strong>{nbf(cLue, 2)}&nbsp;mmol/L</strong> (lecture sur la droite). Elle a été obtenue en diluant X d’un facteur <strong>F&nbsp;=&nbsp;50</strong>. Donnez la concentration de la solution X de départ en mol/L, avec 2 chiffres significatifs.</>,
      tache: { type: 'num', q: 'Concentration c(X) de la solution à doser', unite: 'mol/L', vrai: cSLue / 1000, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['La dilution divise la concentration par F : c(X) = F × c(X′).', `c(X) = 50 × ${nbf(cLue, 2)} = ${nbf(cSLue, 0)} mmol/L = ${nbf(cSLue / 1000, 2)} mol/L.`],
        pieges: [[cSLue, 'Valeur en mmol/L : on demande des mol/L (1 mol/L = 1 000 mmol/L).'], [cLue / 1000, 'Vous avez oublié le facteur de dilution : c(X′) est celle de la solution diluée, pas celle de X.'], [cLue / 50 / 1000, 'Vous avez divisé par F : X est plus concentrée que X′, il faut multiplier par F.']],
        expl: `c(X) = F × c(X′) = 50 × ${nbf(cLue, 2)} mmol/L = ${nbf(cSLue, 0)} mmol/L ≈ ${nbf(cSLue / 1000, 2)} mol/L.`,
        indice: 'X′ est 50 fois moins concentrée que X : c(X) = 50 × c(X′). Convertissez ensuite en mol/L (1 000 mmol/L = 1 mol/L).' } },
    { id: 'sansDilution', titre: 'Et sans dilution ?', focus: ['scene', 'graphe'],
      texte: <>Pour gagner du temps, on mesure X <strong>sans la diluer</strong>, avec la même cellule et à 25&nbsp;°C : le conductimètre affiche G&nbsp;=&nbsp;<strong>{g3(M.G_SANS_DILUTION)}&nbsp;mS</strong>. On lit la concentration sur la droite d’étalonnage <strong>prolongée</strong> (a&nbsp;=&nbsp;{nbf(aG, 3)}&nbsp;mS par mmol/L). Comparez avec la valeur de l’étape précédente.</>,
      tache: { type: 'num', q: 'Concentration de X lue sur la droite prolongée', unite: 'mol/L', vrai: M.C_SANS_DILUTION_LUE / 1000, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => [`c = G / a = ${g3(M.G_SANS_DILUTION)} / ${nbf(aG, 3)} = ${nbf(M.C_SANS_DILUTION_LUE, 0)} mmol/L = ${nbf(M.C_SANS_DILUTION_LUE / 1000, 3)} mol/L.`, `Cette valeur est très inférieure à ${nbf(cSLue / 1000, 2)} mol/L : X est hors du domaine de validité, où G n’est plus proportionnelle à c.`],
        pieges: [[M.C_SANS_DILUTION_LUE, 'Valeur en mmol/L : on demande des mol/L.'], [M.G_SANS_DILUTION * aG / 1000, 'Vous avez multiplié G par a : c = G / a.']],
        expl: `c = G / a = ${g3(M.G_SANS_DILUTION)} / ${nbf(aG, 3)} ≈ ${nbf(M.C_SANS_DILUTION_LUE / 1000, 3)} mol/L, presque deux fois trop faible : hors du domaine de validité, G n’est plus proportionnelle à c, donc la droite prolongée sous-estime la concentration. Il faut diluer.`,
        indice: 'c = G / a, avec G = 18,8 mS et a = 0,149 mS par mmol/L. Convertissez ensuite en mol/L.' } },
    { id: 'temperature', titre: 'Même température', focus: ['scene', 'graphe'],
      texte: <>La conductivité d’une solution ionique augmente d’environ <strong>2&nbsp;% par °C</strong>. La droite a été tracée à 25&nbsp;°C. La solution diluée X′ de l’étape 8 est restée dans une pièce chaude : elle est à <strong>30&nbsp;°C</strong> quand on la mesure et le conductimètre affiche G′&nbsp;=&nbsp;<strong>{g3(M.G_DIL_CHAUD)}&nbsp;mS</strong>, au lieu de {g3(M.G_DIL)}&nbsp;mS à 25&nbsp;°C.</>,
      tache: { type: 'qcm', q: 'Quel est l’effet sur la concentration lue sur la droite ?', ...Q.temperature,
        expl: `À 30 °C, G′ augmente d’environ 10 % : la concentration lue vaut ${nbf(M.C_DIL_LUE_CHAUD, 2)} mmol/L au lieu de ${nbf(cLue, 2)} mmol/L, soit environ 10 % de trop. Les étalons et la solution à doser doivent être à la même température.`,
        indice: 'Si σ augmente avec la température, que devient G′ ? La droite, elle, a été tracée à 25 °C : que lit-on pour cette valeur de G′ ?' } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : le dosage par étalonnage',
      retenir: <>
        <SvgDemarcheCarte/>
        <Ul>
          <li>Étalons préparés par <strong>dilution</strong> et tous <strong>dans le domaine de validité</strong> (c ≤ 10 mmol/L) ; mesure de G pour chacun ; droite <strong>G = a × c</strong> passant par l’origine.</li>
          <li>Solution à doser <strong>diluée d’un facteur F</strong> pour tomber au milieu de la gamme ; <strong>mêmes conditions</strong> (cellule, soluté, température) ; <strong>c(X) = F × c(X′)</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« diluer, mesurer, lire, multiplier par F »</strong>. Idée fausse : « il faut connaître k et les λ pour doser ». Vrai : la droite d’étalonnage les contient déjà dans sa pente.</li>
        </Ul></>,
      texte: <>Vous savez concevoir un dosage par étalonnage conductimétrique : une gamme d’étalons préparée par dilution dans le domaine de validité, une droite G&nbsp;=&nbsp;a&nbsp;×&nbsp;c, une solution à doser diluée au milieu de la gamme et mesurée dans les mêmes conditions, puis c(X)&nbsp;=&nbsp;F&nbsp;×&nbsp;c(X′). Passez à l’exploration pour tester d’autres cellules, d’autres solutés, d’autres dilutions et d’autres températures, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ---------- situation affichée : parcours, défi ou exploration ----------
  const solId = enExplore ? ex.sol : M.SOL, cellId = enExplore ? ex.cell : M.CELLULE_GUIDE;
  const kAff = M.kDe(M.CELLULES[cellId]);
  const sol = M.SOLUTES[solId];
  // exploration : points, droite, mesure de X′
  const exConc = exPts.map(vp => M.concEtalon(vp)), exPoints = M.pointsGamme(solId, kAff, exConc);
  const exA = exPoints.filter(p => !p.hors).length >= 2 ? M.droiteDe(exPoints) : null;
  const exCx = M.C_S / ex.F, exGx = M.gMesure(solId, exCx, kAff, ex.T);
  const exCmin = Math.min(...exPoints.filter(p => !p.hors).map(p => p.c), 99), exCmax = Math.max(...exPoints.filter(p => !p.hors).map(p => p.c), 0);
  // parcours : points mesurés
  const gPoints = M.pointsGamme(M.SOL, M.K, ptsG.map(vp => M.concEtalon(vp)));
  const cVp = M.concEtalon(vpSel);

  // ---------- scène ----------
  let montrerScene = {}, prepP = {}, mesureP = {}, titreScene = '';
  if (enGuide) {
    const e = idE;
    montrerScene = { cellule: e === 'cellule', prep: ['preparer', 'gamme', 'mesure', 'retour'].includes(e), mesure: e !== 'cellule' && e !== 'bilan' };
    if (e === 'preparer' || e === 'gamme') {
      prepP = { vp: vpSel, vf: 100, c0: 100, c: cVp, etiquette: 'étalon', cTxt: e === 'preparer' && !reussie ? '?' : undefined };
      mesureP = { c: cVp, lecture: e === 'gamme' ? g3(M.gMesure(M.SOL, cVp, M.K)) + ' mS' : null, titre: e === 'gamme' ? `étalon à ${nbf(cVp, 1)} mmol/L` : 'étalon' };
    } else if (e === 'mesure' || e === 'retour') {
      prepP = { vp: 5, vf: 250, c0: 0, c0Txt: 'inconnue', c: M.C_DIL, cTxt: '?', nomMere: 'X', etiquette: 'X′' };
      mesureP = { c: M.C_DIL, lecture: g3(M.G_DIL) + ' mS', titre: 'solution X′ (diluée 50 fois)' };
    } else if (e === 'sansDilution') mesureP = { c: M.C_S / 5, lecture: g3(M.G_SANS_DILUTION) + ' mS', titre: 'solution X non diluée' };
    else if (e === 'temperature') mesureP = { c: M.C_DIL, lecture: g3(M.G_DIL_CHAUD) + ' mS', titre: 'solution X′', temp: 30 };
    else mesureP = { c: e === 'choixF' ? 6 : 4, lecture: null, titre: e === 'choixF' ? 'solution X' : 'solution' };
    titreScene = ETAPES[etape]?.titre || '';
  } else if (enExplore) {
    if (ex.cible === 'etalon') {
      montrerScene = { prep: true, mesure: true };
      prepP = { vp: vpSel, vf: 100, c0: 100, c: cVp, etiquette: 'étalon' };
      mesureP = { c: cVp, lecture: g3(M.gMesure(solId, cVp, kAff)) + ' mS', titre: `étalon à ${nbf(cVp, 1)} mmol/L` };
    } else {
      montrerScene = { mesure: true };
      mesureP = { c: exCx, lecture: g3(exGx) + ' mS', titre: ex.F === 1 ? 'solution X (non diluée)' : `solution X′ (diluée ${ex.F} fois)`, temp: ex.T };
    }
  }
  mesureP = { ...mesureP, soluteCat: sol.cat, soluteAn: sol.an };

  // ---------- graphique ----------
  let graphe = null;
  if (enGuide) {
    const e = idE, r = rang(e);
    const aff = r >= rang('gamme') && e !== 'bilan';
    const droiteOk = r > rang('pente') || (e === 'pente' && reussie);
    const grand = e === 'sansDilution';
    let marq = null;
    if ((e === 'mesure' && reussie) || e === 'retour') marq = { G: M.G_DIL, nom: 'X′' };
    if (e === 'sansDilution' && reussie) marq = { G: M.G_SANS_DILUTION, nom: 'X' };
    if (e === 'temperature' && reussie) marq = { G: M.G_DIL_CHAUD, nom: 'X′ à 30 °C' };
    if (aff) graphe = <GraphiqueEtalon points={e === 'gamme' ? gPoints : M.PTS} droite={droiteOk ? aG : null} xMax={grand ? 160 : 12} yMax={grand ? 25 : 1.8} marqueur={marq} titre="Droite d’étalonnage du nitrate de sodium"/>;
  } else if (enExplore) {
    const mq = ex.cible === 'X' && exA ? { G: exGx, nom: 'X′' } : null;
    const yMax = Math.max(1.8, ...exPoints.map(p => p.G * 1.1), mq ? mq.G * 1.1 : 0);
    const xMax = Math.max(12, ...exConc.map(c => c * 1.1), mq && exA ? (mq.G / exA) * 1.1 : 0);
    graphe = <GraphiqueEtalon points={exPoints} droite={exA} xMax={xMax} yMax={yMax} marqueur={mq} titre={`Droite d’étalonnage : ${sol.nom}`}/>;
  }

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'dilution') setDefi({ type, ...M.tirageDefiDilution(), choix: '', verifie: false });
    else setDefi({ type, ...M.tirageDefiDosage(), rep: '', verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const TOL_D = 0.08;
  const correctionDilution = d => {
    const F = Number(d.choix), c = d.cS * 1000 / F, s = M.situation(c, 2, 10);
    return `Il faut c(X′) = c(X) / F entre 2 et 10 mmol/L, de préférence vers 5 mmol/L. Avec c(X) ≈ ${nbf(d.cS, 2)} mol/L = ${nbf(d.cS * 1000, 0)} mmol/L et F = ${F}, on obtient c(X′) ≈ ${nbf(c, c < 1 ? 2 : 1)} mmol/L : ${lblSit(s)}. Facteurs adaptés : ${d.bons.join(', ')}.`;
  };
  const detailDosage = d => {
    const lignes = d.vps.map((vp, i) => `${nbf(vp, 2)} mL → ${nbf(d.concs[i], 1)} mmol/L`).join(' ; ');
    return `c = c₀ × Vp / Vf avec c₀ = ${d.c0} mmol/L et Vf = ${d.vf},0 mL : ${lignes}. La droite d’étalonnage a pour coefficient directeur a = ${nbf(d.a, 3)} mS par mmol/L, donc c(X′) = G′ / a = ${g3(d.Gd)} / ${nbf(d.a, 3)} = ${nbf(d.cdLue, 2)} mmol/L. Puis c(X) = F × c(X′) = ${d.F} × ${nbf(d.cdLue, 2)} = ${nbf(d.cdLue * d.F, 0)} mmol/L = ${nbf(d.cdLue * d.F / 1000, 3)} mol/L (marge acceptée : 8 %).`;
  };
  const verifier = () => {
    const d = defi; let diag, ok = false;
    if (d.type === 'dilution') {
      if (!d.choix) diag = { msg: 'Choisissez un facteur de dilution avant de vérifier.' };
      else {
        const F = Number(d.choix), c = d.cS * 1000 / F, s = M.situation(c, 2, 10);
        if (d.bons.includes(F)) { ok = true; diag = { msg: '' }; }
        else if (s === 'hors-domaine') diag = { msg: `Avec F = ${F}, c(X′) ≈ ${nbf(c, 1)} mmol/L : c’est plus que 10 mmol/L, hors du domaine de validité. La conductance ne serait plus proportionnelle à la concentration : il faut diluer davantage.` };
        else diag = { msg: `Avec F = ${F}, c(X′) ≈ ${nbf(c, 2)} mmol/L : c’est plus petit que le plus petit étalon (2 mmol/L). On extrapolerait la droite avec une conductance très faible, donc peu précise : il faut diluer moins.` };
      }
      setDefi(s => ({ ...s, verifie: true, ok, diag, corr: false }));
      if (d.choix) noterD(ok);
      return;
    }
    const v = lireNombre(d.rep);
    if (!isFinite(v)) diag = { msg: 'Entrez un nombre (par exemple 0,12), en mol/L.' };
    else if (accepte(v, d.rep, d.cS, TOL_D)) { ok = true; diag = { msg: '' }; }
    else {
      const essais = [
        [d.cS * 1000, 'Vous avez donné la concentration en mmol/L : elle est demandée en mol/L (divisez par 1 000).'],
        [d.cdLue / 1000, `Vous avez oublié le facteur de dilution F = ${d.F} : c(X′) est la concentration de la solution diluée, pas celle de X.`],
        [d.cdLue / d.F / 1000, `Vous avez divisé par F = ${d.F} : X est plus concentrée que X′, il faut multiplier par F.`],
        [d.cdLue * (d.c0 / d.vf) * d.F / 1000, 'Vous avez pris les volumes V_p comme des concentrations : calculez d’abord la concentration de chaque étalon, c = c₀ × V_p / V_f.'],
      ].filter(([val]) => isFinite(val) && val > 0);
      const trouve = essais.find(([val]) => Math.abs(val - d.cS) > 0.05 * d.cS && Math.abs(v - val) <= 0.06 * val);
      diag = trouve ? { msg: trouve[1] } : { msg: `Votre valeur est ${v < d.cS ? 'trop petite' : 'trop grande'}. Refaites le calcul : concentration de chaque étalon, coefficient directeur a de la droite, c(X′) = G′ / a, puis c(X) = F × c(X′), en mol/L.` };
    }
    setDefi(s => ({ ...s, verifie: true, ok, diag, corr: false }));
    noterO(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['dilution', 'Choisir la dilution'], ['dosage', 'Dosage complet']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'dilution' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle dilution choisir ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Une solution X de nitrate de sodium porte l’indication « de l’ordre de <strong>{nbf(defi.cS, 2)}{NB}mol/L</strong> ». On veut la doser avec une droite d’étalonnage construite avec des étalons de <strong>2 à 10 mmol/L</strong>. Choisissez le <strong>facteur de dilution F</strong> pour que la solution diluée X′ tombe dans la gamme des étalons.</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Facteur de dilution F
          <select value={defi.choix} onChange={e => setDefi(s => ({ ...s, choix: e.target.value, verifie: false, corr: false }))} style={{ ...menu, marginTop: 2 }}>
            <option value="">— choisir —</option>{M.FACTEURS_DEFI.map(F => <option key={F} value={F}>F = {F}</option>)}
          </select></label>
        <IndiceDefi cache={false}>c(X′) = c(X) / F doit être comprise entre 2 et 10 mmol/L. Convertissez c(X) en mmol/L (1 mol/L = 1 000 mmol/L), puis testez quelques valeurs de F.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : dosage par étalonnage d’une solution</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Les étalons sont préparés par dilution d’une solution mère à <strong>{defi.c0}{NB}mmol/L</strong> dans des fioles jaugées de <strong>{nbf(defi.vf, 1)}{NB}mL</strong> ; on a prélevé les volumes V<sub>p</sub> du tableau et mesuré la conductance G ({M.SOLUTES[defi.id].nom}, cellule de constante k = {defi.k}{NB}m⁻¹, 25 °C).</div>
        <div style={{ overflowX: 'auto', margin: '0 0 8px' }}><table style={{ borderCollapse: 'collapse', fontSize: 14, color: KIT.txt }}>
          <thead><tr><th style={{ border: `1px solid ${KIT.bord}`, padding: '4px 10px', background: '#f1f5f9' }}>V<sub>p</sub> (mL)</th>{defi.vps.map(v => <td key={v} style={{ border: `1px solid ${KIT.bord}`, padding: '4px 6px', textAlign: 'right' }}>{nbf(v, 2)}</td>)}</tr>
            <tr><th style={{ border: `1px solid ${KIT.bord}`, padding: '4px 10px', background: '#f1f5f9' }}>G (mS)</th>{defi.pts.map((p, i) => <td key={i} style={{ border: `1px solid ${KIT.bord}`, padding: '4px 6px', textAlign: 'right' }}>{g3(p.G)}</td>)}</tr></thead>
        </table></div>
        <div style={{ ...lbl, marginBottom: 8 }}>La solution à doser X est diluée <strong>{defi.F} fois</strong> ; la conductance de la solution diluée X′ est <strong>G′ = {g3(defi.Gd)}{NB}mS</strong>. Quelle est la concentration de X, en mol/L (2 chiffres significatifs) ?</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>c(X) =</span>
          <input value={defi.rep} aria-label="concentration de X en mol par litre" onKeyDown={e => e.key === 'Enter' && document.getElementById('ce-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
            style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>mol/L</span>
        </div>
        <IndiceDefi cache={false}>c = c₀ × V<sub>p</sub> / V<sub>f</sub> pour chaque étalon ; droite G = a × c passant par l’origine (a = G / c) ; c(X′) = G′ / a ; c(X) = F × c(X′), puis conversion en mol/L.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="ce-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok ? (defi.type === 'dilution' ? correctionDilution(defi) : detailDosage(defi)) : defi.diag.msg))}
        {!defi.ok && defi.diag.msg && !/^Choisissez|^Entrez/.test(defi.diag.msg) && <div style={{ marginTop: 6 }}><button type="button" onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={{ ...styleBouton(false), minHeight: 42 }}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button></div>}
        {!defi.ok && defi.corr && <div style={{ marginTop: 6, fontWeight: 400, color: KIT.txt }}>{avecIndices(defi.type === 'dilution' ? correctionDilution(defi) : detailDosage(defi))}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Loi de Kohlrausch</strong> σ = Σ λ × c, valable pour une solution <strong>diluée</strong> : c ≤ 1,0×10⁻² mol/L (10 mmol/L). Au-delà, les interactions entre ions font baisser σ ; la simulation les représente par un facteur empirique (hors programme, jamais affiché) : écart de 2 % à 10 mmol/L, 10 % à 50 mmol/L, 20 % à 100 mmol/L.</li>
      <li><strong>Mêmes conditions</strong> pour l’étalonnage et la mesure : même cellule, même soluté, même température (25 °C sauf mention). Les λ sont des valeurs usuelles arrondies, constantes.</li>
      <li><strong>Température</strong> : σ varie d’environ 2 % par °C (valeur usuelle pour une solution ionique, prise constante entre 20 et 30 °C). Le conductimètre n’est pas compensé en température.</li>
      <li><strong>Conductimètre idéal</strong> : il affiche G avec 3 chiffres significatifs, sans bruit ni dérive ; les volumes sont prélevés et complétés sans erreur (verrerie jaugée parfaite), donc aucune incertitude sur les concentrations des étalons.</li>
      <li><strong>Droite d’étalonnage</strong> : G = a × c passant par l’origine, calculée par moindres carrés avec les étalons de c ≤ 10 mmol/L. Les étalons hors domaine sont tracés (carrés) mais ne servent pas au calcul.</li>
      <li><strong>Une seule dilution</strong> de la solution à doser, par pipette jaugée et fiole jaugée ; la solution à doser contient le même soluté que les étalons (sans autre ion).</li>
      <li><strong>Schéma</strong> : le nombre de points dans le bécher est qualitatif (il croît avec la concentration, sans échelle).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- boîtes ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>Prélevez V<sub>p</sub> d’une solution mère à 100 mmol/L dans une fiole de 100,0 mL pour préparer un étalon, ou mesurez la solution à doser X diluée F fois ; le conductimètre affiche G.</div>}
      <SceneProtocole montrer={montrerScene} prep={prepP} mesure={mesureP} titre={titreScene || 'Montage'}/>
    </div>);
  const montrerReglage = enGuide ? (idE === 'preparer' || idE === 'gamme') : false;
  const boxReglage = montrerReglage && (
    <div style={{ ...styleBoite, ...cadre('reglage') }}>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Volume prélevé V<sub>p</sub> dans la solution mère (fiole de 100,0 mL)
        <select value={vpSel} onChange={e => setVpSel(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>
          {[2, 4, 6, 8, 10].map(v => <option key={v} value={v}>{nbf(v, 2)} mL{idE === 'gamme' ? ` → c = ${nbf(M.concEtalon(v), 1)} mmol/L` : ''}</option>)}
        </select></label>
      {idE === 'gamme' && <button type="button" onClick={() => setPtsG(p => (p.includes(vpSel) ? p : [...p, vpSel].sort((a, b) => a - b)))} style={{ ...styleBouton(true, '#0369a1'), minHeight: 42 }}>Mesurer cet étalon ({ptsG.length} / 5)</button>}
    </div>);
  const boxGraphe = graphe && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={titreCarte}>Conductance en fonction de la concentration</div>
      {enExplore && <div style={aide}>Chaque point est un étalon mesuré ; la droite passe par l’origine (étalons dans le domaine de validité seulement). Pour la solution X, la lecture se fait sur la droite.</div>}
      {graphe}
    </div>);

  // ---------- exploration : réglages et mesures ----------
  const setE = f => setEx(s => ({ ...s, ...f }));
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages du dosage</div>
      <div style={aide}>Choisissez le soluté et la cellule, préparez des étalons puis mesurez la solution à doser : le schéma, la droite et les grandeurs se mettent à jour.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Soluté (étalons et solution à doser)
        <select value={ex.sol} onChange={e => setE({ sol: e.target.value })} style={{ ...menu, marginTop: 2 }}>{M.ORDRE_SOLUTES.map(id => <option key={id} value={id}>{M.SOLUTES[id].nom} ({M.SOLUTES[id].f})</option>)}</select>
      </label>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Cellule de conductimétrie
        <select value={ex.cell} onChange={e => setE({ cell: e.target.value })} style={{ ...menu, marginTop: 2 }}>{M.ORDRE_CELLULES.map(id => <option key={id} value={id}>{M.CELLULES[id].nom} : S = {nbf(M.CELLULES[id].S, 1)} cm², L = {nbf(M.CELLULES[id].L, 1)} cm (k = {nbf(M.kDe(M.CELLULES[id]), 0)} m⁻¹)</option>)}</select>
      </label>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Solution mesurée
        <select value={ex.cible} onChange={e => setE({ cible: e.target.value })} style={{ ...menu, marginTop: 2 }}><option value="etalon">un étalon (préparé par dilution)</option><option value="X">la solution à doser X (diluée)</option></select>
      </label>
      {ex.cible === 'etalon' ? <>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Volume prélevé V<sub>p</sub> (solution mère à 100 mmol/L, fiole de 100,0 mL)
          <select value={vpSel} onChange={e => setVpSel(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{VP_MENU.map(v => <option key={v} value={v}>{nbf(v, 2)} mL → c = {nbf(M.concEtalon(v), 0)} mmol/L{M.concEtalon(v) > M.C_DOMAINE ? ' (hors domaine)' : ''}</option>)}</select>
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setExPts(p => (p.includes(vpSel) ? p : [...p, vpSel].sort((a, b) => a - b)))} style={{ ...styleBouton(true, '#0369a1'), minHeight: 42 }}>Ajouter le point à la droite</button>
          <button type="button" onClick={() => setExPts([2, 4, 6, 8, 10])} style={{ ...styleBouton(false), minHeight: 42 }}>Gamme de 2 à 10 mmol/L</button>
          <button type="button" onClick={() => setExPts([])} style={{ ...styleBouton(false), minHeight: 42 }}>Effacer les points</button>
        </div>
      </> : <>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Facteur de dilution F de la solution à doser
          <select value={ex.F} onChange={e => setE({ F: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>{F_MENU.map(F => <option key={F} value={F}>{F === 1 ? 'F = 1 (pas de dilution)' : `F = ${F}`}</option>)}</select>
        </label>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Température de la solution mesurée (étalonnage à 25 °C)
          <select value={ex.T} onChange={e => setE({ T: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>{T_MENU.map(T => <option key={T} value={T}>{T} °C</option>)}</select>
        </label>
        {!exA && <div style={{ ...aide, color: COL.rouge, marginBottom: 0 }}>Choisissez « un étalon » et ajoutez au moins deux points à la droite avant de lire la concentration de X.</div>}
      </>}
    </div>);
  const cLueX = exA ? exGx / exA : null, cXcalc = cLueX != null ? cLueX * ex.F : null;
  const sitX = exA ? M.situation(exCx, exCmin, exCmax) : null;
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures et grandeurs calculées</div>
      <div style={aide}>G vient du conductimètre ; la droite et la concentration de X se calculent à partir des étalons ajoutés.</div>
      <LigneMesure nom="Constante de cellule k" valeur={`${nbf(kAff, 0)}${NB}m⁻¹`} couleur={COL.bleu}/>
      <LigneMesure nom={avecIndices(ex.cible === 'etalon' ? 'Conductance G de l’étalon' : 'Conductance G′ de la solution')} valeur={`${g3(ex.cible === 'etalon' ? M.gMesure(solId, cVp, kAff) : exGx)}${NB}mS`} couleur={COL.bleu}/>
      <LigneMesure nom="Coefficient directeur a tracé" valeur={exA ? `${nbf(exA, 3)}${NB}mS par mmol/L` : 'ajoutez 2 points'} couleur={COL.orange}/>
      <LigneMesure nom={avecIndices('Pente attendue Σλ / k')} valeur={`${nbf(M.penteTheorique(solId, kAff), 3)}${NB}mS par mmol/L`}/>
      {ex.cible === 'X' && <>
        <LigneMesure nom={avecIndices('c(X′) lue sur la droite')} valeur={cLueX != null ? `${nbf(cLueX, 2)}${NB}mmol/L` : '—'} couleur={COL.vert}/>
        <LigneMesure nom={avecIndices('c(X) = F × c(X′)')} valeur={cXcalc != null ? `${nbf(cXcalc / 1000, 3)}${NB}mol/L` : '—'} couleur={COL.vert}/>
        <LigneMesure nom="Valeur réelle de X (pour comparer)" valeur={`${nbf(CS_VRAIE / 1000, 3)}${NB}mol/L`}/>
        <LigneMesure nom="Écart avec la valeur réelle" valeur={cXcalc != null ? `${cXcalc >= CS_VRAIE ? '+' : '−'}${nbf(Math.abs(100 * (cXcalc / CS_VRAIE - 1)), 1)} %` : '—'} couleur={cXcalc != null && Math.abs(cXcalc / CS_VRAIE - 1) > 0.05 ? COL.rouge : COL.vert}/>
        <LigneMesure nom={avecIndices('Position de X′')} valeur={sitX ? `${nbf(exCx, exCx < 1 ? 2 : 1)}${NB}mmol/L : ${lblSit(sitX)}` : '—'}/>
      </>}
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Tracez la droite avec les étalons de 2 à 10 mmol/L, puis ajoutez ceux à 20 et 50 mmol/L : que deviennent les points hors domaine ? La droite change-t-elle ?</li>
        <li>Mesurez X avec F = 1, F = 10, F = 50, F = 500 : pour lesquels la concentration retrouvée est-elle bonne ? Pourquoi ?</li>
        <li>Changez de cellule en gardant le soluté : la pente a change-t-elle ? Et la concentration de X trouvée ?</li>
        <li>Changez de soluté : comparez la pente tracée à la pente attendue Σλ / k. Le résultat final change-t-il ?</li>
        <li>Mesurez X′ à 20 °C ou à 30 °C avec une droite tracée à 25 °C : de combien la concentration est-elle fausse ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>G = σ / k, avec k = L / S en m⁻¹ ; pour une solution diluée, G = a × c avec a = Σλ / k</li>
          <li>Étalons préparés par dilution : c₀ × V<sub>p</sub> = c × V<sub>f</sub>, tous avec c ≤ 10 mmol/L</li>
          <li>Solution à doser diluée d’un facteur F = V<sub>f</sub> / V<sub>p</sub> pour que X′ soit dans la gamme : c(X) = F × c(X′)</li>
          <li>Mêmes conditions pour tous : cellule, soluté, température (σ varie d’environ 2 % par °C)</li>
          <li>Hors du domaine de validité (c &gt; 10 mmol/L), la droite prolongée sous-estime la concentration</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ce-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ce-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ce-col { display: flex; flex-direction: column; gap: 12px; }
        .ce-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .ce-l1.cote .ce-carte { order: 2; } .ce-l1.cote .ce-main { order: 1; }
          .ce-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .ce-ex > * { grid-column: 1; } .ce-ex > .ce-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .ce-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ce-in { animation: ce-fondu 0.35s ease-out; } @keyframes ce-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Dosage par étalonnage conductimétrique : concevoir le protocole</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Préparer des étalons par dilution, tracer la droite G = f(c), diluer la solution à doser pour rester dans le <strong>domaine de validité</strong>, puis remonter à sa concentration.</div>
      {!enExplore && <div className={enGuide ? "ce-l1 cote" : "ce-l1"}>
        {enGuide ? <div className="ce-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : null}
        <div className="ce-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'dilution' ? suiviD : suiviO}/></div>}
          <div className="ce-col">
            {enGuide && idE !== 'bilan' && <div className="ce-in">{boxScene}</div>}
            {enGuide && boxReglage && <div className="ce-in">{boxReglage}</div>}
            {enGuide && boxGraphe && <div className="ce-in">{boxGraphe}</div>}
            {enDefi && <div>{panneauHypo}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="ce-ex">
        <div>{boxScene}</div>
        <div className="ce-ctrl">{reglages}</div>
        <div>{boxGraphe}</div>
        <div>{mesures}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
