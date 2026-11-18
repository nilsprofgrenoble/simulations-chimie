import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./predominanceModele";
import { QCM_PARCOURS as Q } from "./predominanceQcm";
import { DiagPred, DiagDist, Flacon, SvgPredCarte, SvgRapportCarte, SvgDistCarte, SvgIndicCarte, SvgChoixCarte } from "./predominanceSchemas";

const SIM_ID = 130, CLE_GUIDE = 'predominance-tg-guide-v1';
declarerDefis(SIM_ID, [['pred', 'Forme prédominante et pourcentage de forme basique'], ['indicateur', 'Quel indicateur coloré pour un titrage ?']]);

// ====================================================
// SIM 130 — COUPLES ACIDE-BASE : DIAGRAMMES DE PRÉDOMINANCE ET DE DISTRIBUTION, INDICATEURS COLORÉS (TG spé PC, chapitre « Prévoir l'état final »,
//  sous-partie « Comparer la force des acides et des bases »). Une seule idée : le pH par rapport au pK_A décide quelle forme du couple domine.
//  Seconde des deux simulations de cette sous-partie (la première est la 129) ; la solution tampon fera l'objet d'une troisième.
//  Capacités visées (jamais affichées à l'élève) : représenter le diagramme de prédominance d'un couple acide-base ; exploiter un diagramme de
//  prédominance ou de distribution (espèce prédominante) ; cas des indicateurs colorés ; justifier le choix d'un indicateur coloré lors d'un titrage.
//  Modèle de calcul : predominanceModele.js (réutilise acidesBasesModele.js sans le modifier).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtR = r => (r >= 100 ? nbf(r, 0) : r >= 1 ? nbf(r, 1) : r >= 0.01 ? nbf(r, 3) : Number(r).toExponential(1).replace('.', ',').replace('e-', `${NB}×${NB}10⁻`).replace(/10⁻(\d)/, (m, d) => `10⁻${'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]}`));
const fmtP = p => (p >= 99.95 ? '100' : p < 0.05 ? '0' : p >= 10 ? nbf(p, 1) : nbf(p, 2));
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c' };
const PRESET = { c: 'ch3', pH: 6.8, ind: 'bbt', vusC: [], vusPH: [] };
const BBT = M.indicParId('bbt');
const COUPLE_IND = ind => ({ nom: ind.nom, AH: 'HIn', A: 'In⁻', pKa: ind.pKa });

// ---------- formules (MathML) ----------
const conc = x => <><mo>[</mo>{x}<mo>]</mo></>;
const Am = <msup><mi mathvariant="normal">A</mi><mo>−</mo></msup>;
const pKA = <msub><mi mathvariant="normal">pK</mi><mi mathvariant="normal">A</mi></msub>;
const FRapport = <Formule><mfrac><mrow>{conc(Am)}</mrow><mrow>{conc(<mi mathvariant="normal">AH</mi>)}</mrow></mfrac><mo>=</mo><msup><mn>10</mn><mrow><mi>pH</mi><mo>−</mo>{pKA}</mrow></msup></Formule>;
const FPct = <Formule><mi mathvariant="normal">% A⁻</mi><mo>=</mo><mn>100</mn><mo>×</mo><mfrac><mrow>{conc(Am)}</mrow><mrow>{conc(Am)}<mo>+</mo>{conc(<mi mathvariant="normal">AH</mi>)}</mrow></mfrac></Formule>;

const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
function Equation({ cp }) {
  return (
    <div style={{ ...styleBoite, textAlign: 'center' }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>Couple {cp.AH} / {cp.A} ({cp.nom})</div>
      <div style={{ fontSize: 17, color: KIT.txt, lineHeight: 1.6 }} aria-label="Équation de la réaction de l’acide du couple avec l’eau"><Esp>{cp.AH}</Esp> + <Esp>H₂O(ℓ)</Esp> <Esp>⇌</Esp> <Esp>{cp.A}</Esp> + <Esp>H₃O⁺(aq)</Esp></div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>{avecIndices(`pK_A = ${nbf(cp.pKa, 2)}`)} à 25{NB}°C</div>
    </div>);
}

// ====================================================
export function SimulationPredominance() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('pred');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['pred', 'ratio', 'pourcent', 'dist', 'couple', 'indic', 'virage', 'choix', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée ----------
  const enIndic = enGuide && (idE === 'indic' || idE === 'virage');
  const scPH = { pred: 2.0, ratio: 5.76, pourcent: 5.76, dist: 5.76, couple: 7.0, choix: 5.76, bilan: 5.76 };
  const pH = enGuide ? (enIndic ? ti.pH : scPH[idE]) : ti.pH;
  const cId = enGuide ? (idE === 'couple' ? ti.c : 'ch3') : ti.c;
  const cp = enIndic ? COUPLE_IND(BBT) : M.COUPLES[cId];
  const cacher = enGuide && idE === 'choix';
  const choixCouple = enExplore || (enGuide && idE === 'couple'), choixPH = enExplore || enIndic;
  const bloqueCouple = ti.vusC.includes('nh4') ? null : 'Choisissez d’abord l’ion ammonium (bouton « Couple étudié »).';
  const bloqueIndic = [3, 10].every(p => ti.vusPH.includes(p)) ? null : 'Choisissez d’abord pH = 3 puis pH = 10 avec les boutons sous le diagramme.';
  const choisirC = id => setT({ c: id, vusC: ti.vusC.includes(id) ? ti.vusC : [...ti.vusC, id] });
  const choisirPH = p => setT({ pH: p, vusPH: ti.vusPH.includes(p) ? ti.vusPH : [...ti.vusPH, p] });

  const ETAPES = [
    { id: 'pred', titre: 'Quelle forme du couple domine ?', focus: ['pred'],
      texte: <>Un couple acide-base AH / A⁻ a une constante d’acidité K<sub>A</sub> = [A⁻]·[H₃O⁺] / [AH]. Comme K<sub>A</sub> = 10<sup>−pK<sub>A</sub></sup> et [H₃O⁺] = 10<sup>−pH</sup>{NB}mol·L⁻¹, on en déduit le rapport des deux formes : {FRapport}Le <strong>diagramme de prédominance</strong> place sur un axe de pH la forme la plus abondante ; sa frontière est à pH = pK<sub>A</sub>. Ici : couple CH₃COOH / CH₃COO⁻ (pK<sub>A</sub> = 4,76), solution de pH = 2,0 (repère rouge).</>,
      tache: { type: 'qcm', q: 'À pH = 2,0, quelle forme du couple prédomine ?', ...Q.pred,
        expl: 'Le pH (2,0) est inférieur au pK_A (4,76) : [A⁻] / [AH] = 10^(2,0 − 4,76) ≈ 1,7×10⁻³, très inférieur à 1. La forme acide CH₃COOH est la plus abondante (le domaine de gauche du diagramme).', indice: 'Calculez 10^(pH − pK_A) : si le résultat est inférieur à 1, il y a plus de AH que de A⁻.' } },
    { id: 'ratio', titre: 'Le rapport des deux formes', focus: ['pred', 'mesures'],
      retenirTitre: 'À RETENIR : LE DIAGRAMME DE PRÉDOMINANCE',
      retenir: <>
        <SvgPredCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Frontière à <strong>pH = pK<sub>A</sub></strong> : à gauche (pH &lt; pK<sub>A</sub>) la forme <strong>acide AH</strong> domine, à droite (pH &gt; pK<sub>A</sub>) la forme <strong>basique A⁻</strong> domine.</li>
          <li>Exemple de la simulation : à pH = 2,0, CH₃COOH domine car 2,0 &lt; 4,76.</li>
          <li>Moyen de s’en souvenir : <strong>« pH bas : l’acide garde son H⁺ ; pH haut : il le perd »</strong>. Idée fausse : « un pH acide veut dire qu’il n’y a que de l’acide ». Vrai : l’autre forme est présente, mais en moindre quantité.</li>
        </ul></>,
      texte: <>On se place à pH = 5,76, soit pH = pK<sub>A</sub> + 1,00 pour le couple CH₃COOH / CH₃COO⁻ (pK<sub>A</sub> = 4,76). Le repère du diagramme se déplace à droite de la frontière. Rappel : {FRapport}</>,
      tache: { type: 'num', q: 'Rapport [A⁻] / [AH] à pH = 5,76', unite: '(sans unité)', vrai: 10, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['pH − pK_A = 5,76 − 4,76 = 1,00.', '[A⁻] / [AH] = 10^(1,00) = 10 (sans unité) : il y a 10 fois plus de CH₃COO⁻ que de CH₃COOH.'],
        pieges: [[1, 'C’est la différence pH − pK_A ; le rapport est 10 puissance cette différence.'], [0.1, 'Le rapport est inversé : A⁻ est au numérateur, et A⁻ domine à droite de la frontière.'], [1.21, 'Vous avez divisé les deux nombres au lieu de calculer 10^(pH − pK_A).'], [100, 'La différence pH − pK_A vaut 1, pas 2.']],
        expl: '[A⁻] / [AH] = 10^(5,76 − 4,76) = 10^1 = 10.', indice: 'pH − pK_A = 1,00 : calculez 10 puissance cette valeur (touche 10^x).' } },
    { id: 'pourcent', titre: 'Les pourcentages des deux formes', focus: ['mesures'],
      texte: <>Le rapport vaut [A⁻] / [AH] = 10 à pH = 5,76 : pour 10 parties de A⁻, il y a 1 partie de AH. Le pourcentage de forme basique est la part de A⁻ dans le total des deux formes : {FPct}</>,
      tache: { type: 'num', q: 'Pourcentage de forme basique CH₃COO⁻ à pH = 5,76', unite: '%', vrai: 90.909, tol: 0.01, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => ['[A⁻] = 10 parties et [AH] = 1 partie, soit 11 parties au total.', '% A⁻ = 100 × 10 / 11 = 90,9 % (et 9,1 % de AH).'],
        pieges: [[10, 'C’est le rapport [A⁻] / [AH], pas un pourcentage de la totalité des deux formes.'], [9.09, 'C’est le pourcentage de la forme acide AH ; on demande celui de A⁻.'], [0.909, 'Une fraction s’exprime entre 0 et 1 ; en pourcentage, multipliez par 100.'], [100, 'AH est présent en petite quantité : le pourcentage de A⁻ est proche de 100 % sans l’atteindre.']],
        expl: '% A⁻ = 100 × 10 / (10 + 1) = 90,9 %.', indice: 'Au total il y a 10 + 1 = 11 parties : divisez la part de A⁻ par ce total, puis multipliez par 100.' } },
    { id: 'dist', titre: 'Le diagramme de distribution', focus: ['dist'],
      retenirTitre: 'À RETENIR : LE RAPPORT ET LES POURCENTAGES',
      retenir: <>
        <SvgRapportCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>[A⁻] / [AH] = 10<sup>pH − pK<sub>A</sub></sup></strong> : rapport 1 (50 % / 50 %) à pH = pK<sub>A</sub> ; rapport 10 (91 % de A⁻) à pK<sub>A</sub> + 1 ; rapport 0,1 (9 % de A⁻) à pK<sub>A</sub> − 1.</li>
          <li>Exemple de la simulation : à pH = 5,76, 91 % de CH₃COO⁻ et 9 % de CH₃COOH.</li>
          <li>Moyen de s’en souvenir : <strong>« une unité de pH, un facteur 10 »</strong>. Piège : « le pH = pK<sub>A</sub> + 1 donne 100 % de A⁻ ». Vrai : 91 %, il reste 9 % de AH.</li>
        </ul></>,
      texte: <>Le <strong>diagramme de distribution</strong> trace, en fonction du pH, le pourcentage de chaque forme : la courbe bleue pour la forme acide AH, la courbe orange pour la forme basique A⁻. Le repère rouge indique le pH de la solution (5,76) ; les pourcentages 0, 50 et 100 sont gradués sur l’axe de gauche.</>,
      tache: { type: 'qcm', q: 'À quel pH les deux courbes se croisent-elles ?', ...Q.dist,
        expl: 'Au croisement, [A⁻] = [AH], donc le rapport vaut 1, soit 10^(pH − pK_A) = 1 et pH = pK_A = 4,76 : chaque forme représente 50 % du couple.', indice: 'Au croisement, les deux pourcentages sont égaux (50 %). Que vaut alors le rapport [A⁻] / [AH], et donc pH − pK_A ?' } },
    { id: 'couple', titre: 'Un autre couple : NH₄⁺ / NH₃', focus: ['reglage', 'pred'],
      retenirTitre: 'À RETENIR : LE DIAGRAMME DE DISTRIBUTION',
      retenir: <>
        <SvgDistCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Deux courbes complémentaires</strong> (leur somme fait 100 %) : AH décroît, A⁻ croît quand le pH augmente. Elles se croisent à <strong>50 %</strong> pour <strong>pH = pK<sub>A</sub></strong>.</li>
          <li>Exemple de la simulation : CH₃COOH / CH₃COO⁻ se croisent à pH = 4,76.</li>
          <li>Moyen de s’en souvenir : <strong>« le croisement des courbes donne le pK<sub>A</sub> »</strong>. Idée fausse : « les courbes se croisent toujours à pH = 7 ». Vrai : à pH = pK<sub>A</sub>, propre à chaque couple.</li>
        </ul></>,
      texte: <>Le couple de l’ion ammonium NH₄⁺ (acide) et de l’ammoniac NH₃ (base) a un pK<sub>A</sub> bien plus élevé : 9,20. Avec le bouton « Couple étudié », choisissez l’ion ammonium : le diagramme se déplace. Le pH est fixé à 7,0 (eau pure).</>,
      tache: { type: 'qcm', q: 'À pH = 7,0, quelle forme du couple NH₄⁺ / NH₃ prédomine ?', ...Q.couple, bloque: bloqueCouple,
        expl: 'pH = 7,0 est inférieur à pK_A = 9,20 : [NH₃] / [NH₄⁺] = 10^(7,0 − 9,20) ≈ 6,3×10⁻³. L’acide NH₄⁺ domine (99,4 %). Il faut un pH supérieur à 9,20 pour que NH₃ l’emporte.', indice: 'Comparez pH = 7,0 à pK_A = 9,20 : le repère est à gauche ou à droite de la frontière ?' } },
    { id: 'indic', titre: 'Un indicateur coloré est un couple coloré', focus: ['reglage', 'pred'],
      texte: <>Un <strong>indicateur coloré</strong> est un couple acide-base HIn / In⁻ dont les deux formes ont des couleurs différentes. Le bleu de bromothymol (BBT, pK<sub>A</sub> = 6,8) est <strong>jaune</strong> sous la forme HIn et <strong>bleu</strong> sous la forme In⁻. La couleur vue est celle de la forme prédominante. Avec les boutons sous le diagramme, placez le repère à pH = 3 puis à pH = 10.</>,
      tache: { type: 'qcm', q: 'À pH = 10, de quelle couleur est la solution de BBT ?', ...Q.indic, bloque: bloqueIndic,
        expl: 'pH = 10 est supérieur à pK_A = 6,8 : [In⁻] / [HIn] = 10^(10 − 6,8) ≈ 1,6×10³, la forme In⁻ domine très largement. La solution est bleue.', indice: 'Comparez 10 à pK_A = 6,8 : quelle forme prédomine, et de quelle couleur est-elle ?' } },
    { id: 'virage', titre: 'La zone de virage', focus: ['indic', 'reglage'],
      texte: <>Le flacon montre maintenant la couleur de la solution : changez le pH avec les boutons. L’œil voit la teinte d’une forme lorsqu’elle est au moins <strong>10 fois plus abondante</strong> que l’autre ; entre les deux, la teinte est un mélange : c’est la <strong>zone de virage</strong>, de pK<sub>A</sub> − 1 à pK<sub>A</sub> + 1 (modèle simple). Pour le BBT, pK<sub>A</sub> = 6,8.</>,
      tache: { type: 'num', q: 'pH de fin de la zone de virage du BBT (côté basique)', unite: '(sans unité)', vrai: 7.8, tol: 0.01, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Fin de virage côté basique : [In⁻] / [HIn] = 10, soit 10^(pH − pK_A) = 10.', 'pH − pK_A = 1, donc pH = pK_A + 1 = 6,8 + 1 = 7,8.'],
        pieges: [[5.8, 'C’est le début du virage (pK_A − 1), côté acide.'], [6.8, 'C’est le pK_A, au milieu de la zone de virage.'], [16.8, 'On ajoute 1 unité de pH (facteur 10), pas 10 unités.'], [68, 'Vous avez multiplié le pK_A par 10 ; on ajoute 1 à pK_A.']],
        expl: '[In⁻] / [HIn] = 10 pour pH = pK_A + 1 = 7,8 : au-delà, la teinte bleue de In⁻ domine nettement.', indice: 'Au bout du virage, [In⁻] / [HIn] = 10 = 10^(pH − pK_A) : que vaut pH − pK_A ?' } },
    { id: 'choix', titre: 'Choisir un indicateur pour un titrage', focus: [],
      retenirTitre: 'À RETENIR : UN INDICATEUR EST UN COUPLE COLORÉ',
      retenir: <>
        <SvgIndicCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Indicateur coloré = couple <strong>HIn / In⁻</strong> aux teintes différentes ; la teinte vue est celle de la <strong>forme prédominante</strong>. <strong>Zone de virage ≈ pK<sub>A</sub> ± 1</strong> : mélange des deux teintes.</li>
          <li>Exemple de la simulation : BBT (pK<sub>A</sub> = 6,8), jaune à pH 4, vert vers 6,8, bleu à pH 9.</li>
          <li>Moyen de s’en souvenir : <strong>« l’indicateur change de teinte autour de son pK<sub>A</sub> »</strong>.</li>
        </ul></>,
      texte: <>On dose l’acide éthanoïque par la soude : le pH à l’équivalence vaut <strong>8,7</strong>. Pour repérer l’équivalence, on choisit l’indicateur dont la zone de virage contient ce pH. Zones de virage (pK<sub>A</sub> ± 1) : jaune de méthyle {M.indicParId('jm').zone[0].toString().replace('.', ',')} – {M.indicParId('jm').zone[1].toString().replace('.', ',')} ; bleu de bromothymol 5,8 – 7,8 ; bleu de thymol 7,8 – 9,8 ; jaune d’alizarine 10,0 – 12,0.</>,
      tache: { type: 'qcm', q: 'Quel indicateur choisir pour repérer l’équivalence ?', ...Q.choix,
        expl: 'Seule la zone de virage du bleu de thymol (7,8 – 9,8) contient pH = 8,7 : le virage a lieu au moment de l’équivalence. Les autres zones sont trop acides (jaune de méthyle, BBT) ou trop basiques (jaune d’alizarine).', indice: 'Cherchez l’indicateur dont la zone de virage encadre la valeur 8,7.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : CHOISIR L’INDICATEUR',
      retenir: <>
        <SvgChoixCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>On choisit l’indicateur dont la <strong>zone de virage contient le pH à l’équivalence</strong> : le changement de couleur coïncide alors avec l’équivalence.</li>
          <li>Exemple de la simulation : pH à l’équivalence 8,7 ⇒ bleu de thymol (7,8 – 9,8), pas le BBT (5,8 – 7,8).</li>
          <li>Moyen de s’en souvenir : <strong>« le pH d’équivalence doit tomber dans la zone de virage »</strong>. Idée fausse : « le BBT convient toujours parce que sa zone est au pH neutre ». Vrai : il dépend du titrage.</li>
        </ul></>,
      texte: <>Vous savez associer un pH à la forme prédominante d’un couple acide-base, tracer et lire un diagramme de prédominance et de distribution (frontière et croisement à pH = pK<sub>A</sub>, rapport 10<sup>pH − pK<sub>A</sub></sup>), et choisir un indicateur coloré dont la zone de virage contient le pH à l’équivalence. Passez à l’exploration (tous les couples, tous les pH) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'pred' ? { type: 'pred', ...M.tirageDefiPred(), reps: { forme: null, pct: '' }, verifie: false } : { type: 'indicateur', ...M.tirageDefiIndic(), reps: { choix: null }, verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'pred') {
      const x = lireNombre(defi.reps.pct), ok = defi.reps.forme === defi.prod && isFinite(x) && Math.abs(x - defi.pctBase) <= 1.5;
      setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok);
    } else { const ok = defi.reps.choix === defi.vrai; setDefi(d => ({ ...d, verifie: true, ok })); noterI(ok); }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['pred', 'Forme prédominante et pourcentage'], ['indicateur', 'Quel indicateur choisir ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'pred' ? 'Défi : quelle forme domine, et dans quelle proportion ?' : 'Défi : quel indicateur coloré pour ce titrage ?'}</div>
      {defi.type === 'pred' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une solution contient le couple <strong>{defi.couple.AH} / {defi.couple.A}</strong>, de {avecIndices('pK_A')} = <strong>{nbf(defi.pKa, 2)}</strong>. Son pH vaut <strong>{nbf(defi.pH, 1)}</strong>. Indiquez la forme qui prédomine, puis le pourcentage de forme basique {defi.couple.A} (marge acceptée : ± 1,5{NB}point).</div>
        <div role="group" aria-label="Forme prédominante" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['AH', defi.couple.AH], ['A', defi.couple.A]].map(([k, l]) => <button key={k} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, forme: k }, verifie: false }))} aria-pressed={defi.reps.forme === k}
            style={stylePetitBouton(defi.reps.forme === k, defi.verifie ? (defi.prod === k ? '#15803d' : '#dc2626') : '#475569')}>{l} prédomine</button>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>% de {defi.couple.A} =</span>
          <input value={defi.reps.pct} aria-label="Pourcentage de forme basique" onKeyDown={e => e.key === 'Enter' && document.getElementById('pd-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, pct: e.target.value }, verifie: false }))} inputMode="decimal"
            style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>%</span>
        </div>
        <IndiceDefi cache={false}>Le rapport [A⁻] / [AH] vaut 10<sup>pH − pK<sub>A</sub></sup>. La forme basique domine si ce rapport dépasse 1 (pH &gt; pK<sub>A</sub>). Le pourcentage de A⁻ est 100 × r / (1 + r), avec r = [A⁻] / [AH].</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On réalise un titrage dont le pH à l’équivalence vaut <strong>{nbf(defi.pHeq, 1)}</strong>. Trois indicateurs colorés sont disponibles, chacun défini par son {avecIndices('pK_A')}. Rappel : la zone de virage va de {avecIndices('pK_A')} − 1 à {avecIndices('pK_A')} + 1. Quel indicateur permet de repérer l’équivalence ?</div>
        <div role="group" aria-label="Indicateur choisi" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {defi.ind.map((ind, i) => <button key={ind.id} onClick={() => setDefi(d => ({ ...d, reps: { choix: i }, verifie: false }))} aria-pressed={defi.reps.choix === i}
            style={stylePetitBouton(defi.reps.choix === i, defi.verifie ? (defi.vrai === i ? '#15803d' : '#dc2626') : '#475569')}>{ind.nom} ({avecIndices(`pK_A = ${nbf(ind.pKa, 2)}`)})</button>)}
        </div>
        <IndiceDefi cache={false}>Pour chaque indicateur, calculez la zone de virage (pK<sub>A</sub> − 1 ; pK<sub>A</sub> + 1) et regardez si elle contient le pH à l’équivalence.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pd-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'pred'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `pH − pK_A = ${nbf(defi.pH - defi.pKa, 2)}, donc [A⁻] / [AH] = ${fmtR(M.rapport(defi.pH, defi.pKa))} : ${defi.prod === 'A' ? defi.couple.A : defi.couple.AH} prédomine, avec ${fmtP(defi.pctBase)} % de ${defi.couple.A} (marge acceptée : ± 1,5 point).`
          : (defi.ok ? '✓ Correct. ' : '✗ Ce n’est pas le bon indicateur. ') + defi.ind.map(i => `${i.nom} : zone ${nbf(i.zone[0], 1)} – ${nbf(i.zone[1], 1)}.`).join(' ') + ` Seule la zone de « ${defi.ind[defi.vrai].nom} » contient pH = ${nbf(defi.pHeq, 1)}.`}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> (K<sub>A</sub> et donc pK<sub>A</sub> ne dépendent que de T) ; la simulation ne fait pas varier T.</li>
      <li><strong>Activités ≈ concentrations</strong> : solutions diluées, concentrations divisées par c° = 1 mol·L⁻¹ ; K<sub>A</sub>, rapports et pourcentages n’ont pas d’unité.</li>
      <li><strong>Le pH est imposé</strong> : on suppose que le pH de la solution est fixé (par exemple par une solution tampon) ; le couple étudié n’en modifie pas la valeur. On ne calcule que la répartition entre AH et A⁻ : [A⁻] / [AH] = 10<sup>pH − pK<sub>A</sub></sup>.</li>
      <li><strong>Prédominance</strong> : une forme « prédomine » quand elle est plus abondante que l’autre (pH de part et d’autre de pK<sub>A</sub>) ; elle n’est « presque seule » qu’à partir de pK<sub>A</sub> ± 1 (au moins 91 %).</li>
      <li><strong>Indicateurs colorés</strong> : modèle d’un couple HIn / In⁻ de teintes différentes ; zone de virage idéalisée de pK<sub>A</sub> − 1 à pK<sub>A</sub> + 1, arrondie. Les tables donnent des bornes un peu différentes (par exemple 6,0 – 7,6 pour le BBT) car l’œil perçoit la teinte autrement selon les couleurs. On suppose en outre que l’indicateur, en très faible quantité, ne modifie pas le pH.</li>
      <li><strong>Valeurs de pK<sub>A</sub></strong> : valeurs usuelles à 25 °C arrondies (méthanoïque 3,75 ; benzoïque 4,20 ; éthanoïque 4,76 ; ion ammonium 9,20), données du problème, non à retrouver.</li>
      <li><strong>Limites</strong> : seulement des monoacides (pas de polyacide ni d’acide α-aminé, qui ont plusieurs pK<sub>A</sub>), pas de solution tampon étudiée ici (sujet d’une autre simulation), pH de 0 à 14.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- réglages ----------
  const PH_BOUTONS = enExplore ? [2, 4, 7, 10, 12] : [3, 6.8, 10];
  const reglages = (choixCouple || choixPH) && (
    <div style={{ ...styleBoite, ...cadre('reglage') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages de l’expérience</div>
      {choixCouple && <>
        {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.5 }}>1. Choisissez le couple acide-base : chacun a son pK<sub>A</sub>, donc sa frontière.</div>}
        <div role="group" aria-label="Couple étudié" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          {!enExplore && <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Couple étudié</span>}
          {M.ORDRE.filter(id => enExplore || id === 'ch3' || id === 'nh4').map(id => <button key={id} onClick={() => choisirC(id)} aria-pressed={ti.c === id} style={stylePetitBouton(ti.c === id, '#0f766e')}>{M.COUPLES[id].AH} / {M.COUPLES[id].A}</button>)}
        </div>
      </>}
      {choixPH && <>
        {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.5 }}>2. Choisissez le pH de la solution (le pH est imposé) : le repère rouge se déplace sur les diagrammes et dans le flacon.</div>}
        {enExplore && <Curseur nom="pH de la solution" valeur={ti.pH} onChange={p => setT({ pH: Math.round(p * 10) / 10 })} min={0} max={14} pas={0.1} decimales={1}/>}
        <div role="group" aria-label="pH de la solution" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>{enExplore ? 'pH usuels' : 'pH de la solution'}</span>
          {PH_BOUTONS.map(p => <button key={p} onClick={() => choisirPH(p)} aria-pressed={ti.pH === p} style={stylePetitBouton(ti.pH === p, '#b45309')}>{nbf(p, Number.isInteger(p) ? 0 : 1)}</button>)}
        </div>
      </>}
    </div>);

  // ---------- diagrammes ----------
  const revele = apres('pred') || enExplore;
  const boxPred = !dd && !cacher && (
    <div style={{ ...styleBoite, ...cadre('pred') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Diagramme de prédominance</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Sur l’axe des pH, la forme la plus abondante du couple : l’acide à gauche de la frontière (pH = pK<sub>A</sub>), la base à droite. Le repère rouge est le pH choisi.</div>}
      <DiagPred pH={pH} pKa={cp.pKa} AH={cp.AH} A={cp.A} revele={revele}/>
    </div>);
  const boxDist = !dd && !cacher && (enExplore || deja('dist')) && (
    <div style={{ ...styleBoite, ...cadre('dist') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Diagramme de distribution</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Pourcentage de chaque forme selon le pH. Les deux courbes se croisent à 50 % quand pH = pK<sub>A</sub> ; les points rouges donnent la composition au pH choisi.</div>}
      <DiagDist pH={pH} pKa={cp.pKa} AH={cp.AH} A={cp.A}/>
    </div>);
  const ind = M.indicParId(ti.ind);
  const boxFlacon = !dd && !cacher && ((enGuide && deja('virage')) || enExplore) && (
    <div style={{ ...styleBoite, ...cadre('indic') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Indicateur coloré</div>
      {enExplore && <>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Un indicateur est un couple HIn / In⁻ de deux teintes. Choisissez-en un et regardez sa couleur au pH réglé ci-dessus (indépendant du couple choisi plus haut).</div>
        <div role="group" aria-label="Indicateur coloré" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {M.INDIC.map(i => <button key={i.id} onClick={() => setT({ ind: i.id })} aria-pressed={ti.ind === i.id} style={stylePetitBouton(ti.ind === i.id, '#7c3aed')}>{i.nom}</button>)}
        </div></>}
      <Flacon ind={enGuide ? BBT : ind} pH={pH}/>
    </div>);

  // ---------- mesures ----------
  const rap = M.rapport(pH, cp.pKa), pb = M.pct(M.fracBase(pH, cp.pKa)), pa = 100 - pb;
  const mesures = !dd && !cacher && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs calculées pour le couple et le pH choisis.</div>}
      <LigneMesure nom="pH de la solution" valeur={nbf(pH, Number.isInteger(Math.round(pH * 100) / 10) ? 1 : 2)} couleur={COL.rouge}/>
      <LigneMesure nom="pK_A du couple" valeur={nbf(cp.pKa, 2)} couleur={COL.orange}/>
      {(enExplore || apres('pred')) && <LigneMesure nom="Forme prédominante" valeur={Math.abs(pH - cp.pKa) < 1e-9 ? 'égalité (50 % / 50 %)' : pH < cp.pKa ? `${cp.AH} (acide)` : `${cp.A} (base)`} couleur={COL.vert}/>}
      {(enExplore || apres('ratio')) && <LigneMesure nom={`Rapport [${cp.A}] / [${cp.AH}]`} valeur={fmtR(rap)}/>}
      {(enExplore || apres('pourcent')) && <>
        <LigneMesure nom={`% de ${cp.AH}`} valeur={`${fmtP(pa)}${NB}%`} couleur={COL.bleu}/>
        <LigneMesure nom={`% de ${cp.A}`} valeur={`${fmtP(pb)}${NB}%`} couleur={COL.orange}/></>}
      {enExplore && <LigneMesure nom="Teinte de l’indicateur choisi" valeur={{ acide: 'forme HIn', base: 'forme In⁻', melange: 'mélange (virage)' }[M.teinte(ind, pH)]}/>}
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>{avecIndices('Réglez le pH exactement sur le pK_A du couple : que valent les deux pourcentages et le rapport ?')}</li>
        <li>{avecIndices('Réglez le pH sur pK_A + 1 puis pK_A − 1 : de combien change le rapport ? Pourquoi dit-on « une unité de pH, un facteur 10 » ?')}</li>
        <li>Pour le couple NH₄⁺ / NH₃, à quel pH approximativement NH₃ devient-il la forme dominante ? Et pour CH₃COOH / CH₃COO⁻ ?</li>
        <li>Avec le bleu de bromothymol, parcourez les pH de 4 à 9 : où la couleur change-t-elle ? Comparez avec le bleu de thymol : sa zone de virage est-elle au même endroit ?</li>
        <li>Trouvez un pH où l’indicateur est dans sa zone de virage et un autre où il est à moins de 10 % d’une forme : relisez le rapport dans les mesures.</li>
      </ul>
    </div>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>[A⁻] / [AH] = 10^(pH − pK_A) : pH &lt; pK_A ⇒ AH domine ; pH &gt; pK_A ⇒ A⁻ domine</li>
        <li>À pH = pK_A : 50 % de chaque forme (croisement des courbes de distribution)</li>
        <li>À pK_A ± 1 : rapport 10 ou 0,1, soit 91 % / 9 %</li>
        <li>Indicateur coloré : couple HIn / In⁻ ; teinte de la forme prédominante ; virage autour de pK_A ± 1</li>
        <li>Choisir l’indicateur dont la zone de virage contient le pH à l’équivalence</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pd-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pd-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pd-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .pd-col { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 901px) { .pd-l1.cote .pd-carte { order: 2; } .pd-l1.cote .pd-main { order: 1; } }
        @media (max-width: 900px) { .pd-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pd-in { animation: pd-fondu 0.35s ease-out; } @keyframes pd-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Couples acide-base : prédominance, distribution et indicateurs colorés</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Dans un couple acide-base AH / A⁻, la forme la plus abondante dépend du <strong>pH par rapport au pK<sub>A</sub></strong>. Le <strong>diagramme de prédominance</strong> et le <strong>diagramme de distribution</strong> le montrent ; un <strong>indicateur coloré</strong> est un couple dont les deux formes ont des couleurs différentes.</div>
      <div className={`pd-l1${!enExplore ? ' cote' : ''}`}>
        {enGuide ? <div className="pd-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="pd-carte">{panneauHypo}</div> : null}
        <div className="pd-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'pred' ? suiviP : suiviI}/></div>}
          {!dd && !cacher && <div className="pd-col">
            <Equation cp={cp}/>
            {reglages && <div className="pd-in">{reglages}</div>}
            {boxPred && <div className="pd-in">{boxPred}</div>}
            {boxDist && <div className="pd-in">{boxDist}</div>}
            {boxFlacon && <div className="pd-in">{boxFlacon}</div>}
            {mesures && <div className="pd-in">{mesures}</div>}
          </div>}
        </div>
      </div>
      {enExplore && <div className="pd-l2">{aEssayer}{retenirExplore}</div>}
      {!enDefi && (!enGuide || deja('bilan')) && <div className="pd-l2">{panneauHypo}</div>}
    </div>
  );
}
