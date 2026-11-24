import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./aminoAcidesModele";
import { QCM_PARCOURS as Q } from "./aminoAcidesQcm";
import { DiagPred3, DiagDist3, SvgCouplesCarte, SvgDomainesCarte, SvgRapportCarte, SvgDistCarte, SvgAmphotereCarte } from "./aminoAcidesSchemas";

const SIM_ID = 134, CLE_GUIDE = 'acides-amines-tg-guide-v1';
declarerDefis(SIM_ID, [['forme', 'Forme prédominante et pourcentage de zwitterion'], ['zone', 'Entre quels pH le zwitterion domine-t-il ?']]);

// ====================================================
// SIM 134 — ACIDES α-AMINÉS : FORME SELON LE pH (TG spé PC, chapitre « Prévoir l'état final », sous-partie « Comparer la force des acides et des bases »).
//  Une seule idée : un acide α-aminé met en jeu deux couples acide-base ; selon le pH par rapport aux deux pK_A, sa forme dominante est le cation, le zwitterion ou l'anion.
//  Suite des simulations 129 (force des acides), 130 (couples : prédominance, distribution, indicateurs) et 131 (solution tampon).
//  Capacités visées (jamais affichées à l'élève) : représenter le diagramme de prédominance d'un couple acide-base ; exploiter un diagramme de prédominance ou de distribution
//  (espèce prédominante, cas des acides alpha-aminés) ; identifier le caractère amphotère d'une espèce chimique ; représenter la formule semi-développée d'un acide carboxylique, d'un ion carboxylate, d'une amine, d'un ion ammonium.
//  Modèle de calcul : aminoAcidesModele.js (réutilise acidesBasesModele.js sans le modifier).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const SUPN = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sci = (v, cs = 2) => { const [m, e] = Number(v).toExponential(cs - 1).split('e'); return `${m.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => (c === '-' ? '⁻' : SUPN[c])).join('')}`; };
const fmtR = r => (r >= 1000 || r < 0.01 ? sci(r, 2) : r >= 100 ? nbf(r, 0) : r >= 1 ? nbf(r, 1) : nbf(r, 3));
const fmtP = p => (p >= 99.95 ? '100' : p >= 10 ? nbf(p, 1) : p >= 0.1 ? nbf(p, 2) : p >= 0.001 ? nbf(p, 3) : '< 0,001');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const COUL_FORME = { cat: COL.bleu, zw: COL.vert, an: COL.orange };
const FOND = { cat: '#dbeafe', zw: '#dcfce7', an: '#ffedd5' };
const PRESET = { ac: 'gly', pH: 7.4 };
const GLY = M.ACIDES.gly;
const SC_PH = { groupes: 6.0, ordre: 6.0, cation: 1.0, zwitterion: 6.0, anion: 12.0, rapport: 3.3, dist: 6.0, amphotere: 6.0, sang: 7.4, bilan: 7.4 };
const PH_USUELS = [['1.5', 'Suc gastrique (pH ≈ 1,5)'], ['7.0', 'Eau pure (pH = 7,0)'], ['7.4', 'Sang (pH ≈ 7,4)'], ['11.0', 'Solution d’ammoniac (pH ≈ 11)'], ['13.0', 'Soude à 0,10 mol/L (pH = 13)']];

// ---------- formules (MathML) ----------
const conc = x => <><mo>[</mo>{x}<mo>]</mo></>;
const mt = t => <mi mathvariant="normal">{t}</mi>;
const pKA = n => <msub><mi mathvariant="normal">pK</mi><mrow><mi mathvariant="normal">A</mi><mn>{n}</mn></mrow></msub>;
const FRapport1 = <Formule><mfrac><mrow>{conc(mt('zwitterion'))}</mrow><mrow>{conc(mt('cation'))}</mrow></mfrac><mo>=</mo><msup><mn>10</mn><mrow><mi>pH</mi><mo>−</mo>{pKA(1)}</mrow></msup></Formule>;
const FRapport2 = <Formule><mfrac><mrow>{conc(mt('anion'))}</mrow><mrow>{conc(mt('zwitterion'))}</mrow></mfrac><mo>=</mo><msup><mn>10</mn><mrow><mi>pH</mi><mo>−</mo>{pKA(2)}</mrow></msup></Formule>;

const Pk = ({ n }) => <>pK<sub>A{n}</sub></>;
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;

// ====================================================
export function SimulationAminoAcides() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviF, noterF] = useCompteurDefi(), [suiviZ, noterZ] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('forme');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ dist: false, essayer: false, retenir: false });
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['groupes', 'ordre', 'cation', 'zwitterion', 'anion', 'rapport', 'dist', 'amphotere', 'sang', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée ----------
  const a = enGuide ? GLY : M.ACIDES[ti.ac];
  const pH = enGuide ? SC_PH[idE] : ti.pH;
  const fr = M.frac(pH, a), prod = M.predominante(pH, a);
  const montrerBilan = enExplore || deja('bilan');       // pourcentages affichés : jamais avant l'étape qui les fait calculer
  const revele = enGuide ? { cat: apres('cation'), zw: apres('zwitterion'), an: apres('anion') } : { cat: true, zw: true, an: true };
  const actifForme = id => prod === id || (prod === 'egal1' && (id === 'cat' || id === 'zw')) || (prod === 'egal2' && (id === 'zw' || id === 'an'));
  const surligne = enExplore || apres('anion');

  const ETAPES = [
    { id: 'groupes', titre: 'Deux groupes qui échangent des H⁺', focus: ['formes'],
      texte: <>Un acide α-aminé porte, sur le même atome de carbone, un groupe carboxyle –COOH et un groupe amine. Le plus simple est la <strong>glycine</strong>. Dans une solution très acide, son groupe amine a capté un H⁺ : il est devenu un groupe ammonium –NH₃⁺, comme sur le schéma. Chaque groupe est l’acide d’un couple acide-base : –COOH / –COO⁻ et –NH₃⁺ / –NH₂.</>,
      tache: { type: 'qcm', q: 'Quels groupes de la forme H₃N⁺–CH₂–COOH peuvent céder un H⁺ ?', ...Q.groupes,
        expl: 'Le groupe carboxyle –COOH est l’acide du couple –COOH / –COO⁻. Le groupe ammonium –NH₃⁺ est l’acide du couple –NH₃⁺ / –NH₂, comme l’ion ammonium NH₄⁺. Les deux groupes peuvent donc céder un H⁺ : la molécule met en jeu deux couples acide-base.',
        indice: 'Pensez au couple de l’ion ammonium NH₄⁺ / NH₃ : l’ion ammonium est un acide. Que devient –COOH quand il perd un H⁺ ?' } },
    { id: 'ordre', titre: 'Quel H⁺ part en premier ?', focus: ['formes'],
      texte: <>Chaque groupe a sa constante d’acidité : le couple –COOH / –COO⁻ a pK<sub>A1</sub> = 2,3 et le couple –NH₃⁺ / –NH₂ a pK<sub>A2</sub> = 9,6 (valeurs à 25 °C). Plus le pK<sub>A</sub> est petit, plus l’acide est fort. On augmente peu à peu le pH de la solution, en partant d’une solution très acide.</>,
      tache: { type: 'qcm', q: 'Quel groupe cède son H⁺ en premier ?', ...Q.ordre,
        expl: 'Un acide fort cède plus facilement son H⁺ : c’est celui dont le pK_A est le plus petit. pK_A1 = 2,3 est inférieur à pK_A2 = 9,6 : le groupe –COOH cède son H⁺ en premier (vers pH 2,3), puis le groupe –NH₃⁺ (vers pH 9,6).',
        indice: 'Comparez 2,3 et 9,6 : quel couple a l’acide le plus fort ? Il cède son H⁺ pour un pH plus bas.' } },
    { id: 'cation', titre: 'Une solution très acide', focus: ['formes', 'pred', 'mesures'],
      retenirTitre: 'À RETENIR : UNE MOLÉCULE, DEUX COUPLES',
      retenir: <>
        <SvgCouplesCarte/>
        <Ul>
          <li>Un acide α-aminé a <strong>deux groupes</strong> qui échangent des H⁺ : –COOH (couple 1, <Pk n={1}/>) et –NH₃⁺ (couple 2, <Pk n={2}/>). Il y a donc <strong>deux pK<sub>A</sub></strong> et trois formes.</li>
          <li>Exemple de la simulation : glycine, <Pk n={1}/> = 2,3 et <Pk n={2}/> = 9,6 ; le groupe –COOH, de pK<sub>A</sub> le plus petit, cède son H⁺ en premier.</li>
          <li>Moyen de s’en souvenir : <strong>« le plus petit pK<sub>A</sub> part le premier »</strong>. Idée fausse : « un acide α-aminé n’a qu’un seul pK<sub>A</sub> ». Vrai : un pour chaque groupe.</li>
        </Ul></>,
      texte: <>Quand les deux groupes cèdent leur H⁺ l’un après l’autre, la glycine passe par trois formes : le <strong>cation</strong> (charge globale +), le <strong>zwitterion</strong> (une charge + et une charge − sur la même molécule, neutre au total) et l’<strong>anion</strong> (charge globale −). Le diagramme de prédominance les range sur un axe de pH : les frontières sont aux deux pK<sub>A</sub> (traits rouges). Comme pour un seul couple, à gauche d’une frontière domine la forme qui a encore son H⁺. La solution étudiée a un pH de 1,0 (repère rouge).</>,
      tache: { type: 'qcm', q: 'À pH = 1,0, quelle forme de la glycine prédomine ?', ...Q.cation,
        expl: 'pH = 1,0 est inférieur à pK_A1 = 2,3 : on est à gauche des deux frontières, aucun groupe n’a encore cédé son H⁺. La forme dominante est le cation H₃N⁺–CH₂–COOH (charge globale +).',
        indice: 'Comparez pH = 1,0 aux deux pK_A : le repère est-il à gauche ou à droite des frontières ?' } },
    { id: 'zwitterion', titre: 'Entre les deux frontières', focus: ['pred'],
      texte: <>Le repère passe à pH = 6,0. Le domaine du milieu, entre pK<sub>A1</sub> et pK<sub>A2</sub>, correspond à une forme intermédiaire : le groupe –COOH a déjà cédé son H⁺ (il est devenu –COO⁻), mais le groupe –NH₃⁺ ne l’a pas encore cédé.</>,
      tache: { type: 'qcm', q: 'À pH = 6,0, quelle forme de la glycine prédomine ?', ...Q.zwitterion,
        expl: 'pH = 6,0 est compris entre pK_A1 = 2,3 et pK_A2 = 9,6 : au-dessus de pK_A1, –COOH a cédé son H⁺ (–COO⁻) ; au-dessous de pK_A2, –NH₃⁺ le garde. La forme dominante est le zwitterion H₃N⁺–CH₂–COO⁻ : une charge + et une charge −, neutre au total.',
        indice: 'pH = 6,0 est-il à gauche de pK_A1, entre pK_A1 et pK_A2, ou à droite de pK_A2 ?' } },
    { id: 'anion', titre: 'Une solution basique', focus: ['pred'],
      texte: <>Le repère passe à pH = 12,0 : on est maintenant à droite des deux frontières.</>,
      tache: { type: 'qcm', q: 'À pH = 12,0, quelle forme de la glycine prédomine ?', ...Q.anion,
        expl: 'pH = 12,0 est supérieur à pK_A2 = 9,6 : le groupe –NH₃⁺ a lui aussi cédé son H⁺ (il est devenu –NH₂). La forme dominante est l’anion H₂N–CH₂–COO⁻, de charge globale −.',
        indice: 'Comparez 12,0 à pK_A2 = 9,6 : le groupe –NH₃⁺ a-t-il cédé son H⁺ ?' } },
    { id: 'rapport', titre: 'Lire une frontière comme un couple', focus: ['pred', 'mesures'],
      retenirTitre: 'À RETENIR : TROIS FORMES, TROIS DOMAINES',
      retenir: <>
        <SvgDomainesCarte/>
        <Ul>
          <li>Deux frontières, à pH = <Pk n={1}/> et pH = <Pk n={2}/> : à gauche le <strong>cation</strong> (+), au milieu le <strong>zwitterion</strong> (neutre au total), à droite l’<strong>anion</strong> (−).</li>
          <li>Exemple de la simulation : pour la glycine, le zwitterion domine entre pH 2,3 et pH 9,6.</li>
          <li>Moyen de s’en souvenir : <strong>« + puis 0 puis − quand le pH monte »</strong>. Idée fausse : « dans l’eau, la glycine est H₂N–CH₂–COOH ». Vrai : cette forme sans charge est quasi absente ; la forme habituelle est le zwitterion.</li>
        </Ul></>,
      texte: <>Au voisinage d’une frontière, on lit un seul couple, comme pour un couple acide-base simple. Près de pK<sub>A1</sub>, les deux formes qui comptent sont le cation (acide) et le zwitterion (base) : {FRapport1}Le repère est à pH = 3,3, soit pK<sub>A1</sub> + 1,0.</>,
      tache: { type: 'num', q: 'Rapport frac([zwitterion]|[cation]) à pH = 3,3', unite: '(sans unité)', vrai: 10, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['pH − pK_A1 = 3,3 − 2,3 = 1,0.', 'frac([zwitterion]|[cation]) = 10^(1,0) = 10 (sans unité) : il y a 10 fois plus de zwitterion que de cation.'],
        pieges: [[1, 'C’est la différence pH − pK_A1 ; le rapport est 10 puissance cette différence.'], [0.1, 'Le rapport est inversé : le zwitterion est au numérateur, et il domine à droite de la frontière.'], [3.3 / 2.3, 'Le rapport n’est pas le quotient des deux nombres, mais 10 puissance leur différence.'], [10 ** (3.3 - 9.6), 'Vous avez utilisé pK_A2 (9,6) : près de pK_A1, on lit le couple 1 (cation / zwitterion) avec pK_A1 = 2,3.']],
        expl: 'frac([zwitterion]|[cation]) = 10^(3,3 − 2,3) = 10^(1,0) = 10.', indice: 'pH − pK_A1 = 1,0 : calculez 10 puissance cette valeur (touche 10^x).' } },
    { id: 'dist', titre: 'Le diagramme de distribution', focus: ['dist'],
      retenirTitre: 'À RETENIR : LIRE UNE FRONTIÈRE',
      retenir: <>
        <SvgRapportCarte/>
        <Ul>
          <li>Près d’une frontière, on lit <strong>un seul couple</strong> : {avecIndices('frac([zwitterion]|[cation]) = 10^(pH − pK_A1)')}, de même autour de <Pk n={2}/> avec l’anion et le zwitterion.</li>
          <li>Exemple de la simulation : à pH = 3,3 (<Pk n={1}/> + 1), rapport 10, soit 91 % de zwitterion et 9 % de cation.</li>
          <li>Moyen de s’en souvenir : <strong>« une unité de pH, un facteur 10 »</strong>. Piège : « à <Pk n={1}/> + 1, il n’y a plus de cation ». Vrai : il en reste 9 %.</li>
        </Ul></>,
      texte: <>Le <strong>diagramme de distribution</strong> trace, en fonction du pH, le pourcentage de chaque forme : le cation en bleu, le zwitterion en vert, l’anion en orange. Le repère rouge indique le pH de la solution ; les points colorés donnent la composition à ce pH.</>,
      tache: { type: 'qcm', q: 'À quel pH les courbes du cation et du zwitterion se croisent-elles ?', ...Q.dist,
        expl: 'Au croisement, [cation] = [zwitterion] : le rapport frac([zwitterion]|[cation]) vaut 1, soit 10^(pH − pK_A1) = 1 et pH = pK_A1 = 2,3. Chaque forme représente alors 50 % de la glycine (l’anion est négligeable).',
        indice: 'Au croisement, les deux pourcentages sont égaux. Que vaut alors le rapport frac([zwitterion]|[cation]), et donc pH − pK_A1 ?' } },
    { id: 'amphotere', titre: 'Le zwitterion est amphotère', focus: ['formes'],
      retenirTitre: 'À RETENIR : LE DIAGRAMME DE DISTRIBUTION',
      retenir: <>
        <SvgDistCarte/>
        <Ul>
          <li><strong>Trois courbes</strong> dont la somme fait 100 % : le cation décroît, l’anion croît, le zwitterion forme une cloche. Cation et zwitterion se croisent à <strong>50 %</strong> pour pH = <Pk n={1}/> ; zwitterion et anion pour pH = <Pk n={2}/>.</li>
          <li>Exemple de la simulation : glycine, croisements à pH = 2,3 et à pH = 9,6.</li>
          <li>Moyen de s’en souvenir : <strong>« un croisement à 50 % = un pK<sub>A</sub> »</strong>. Idée fausse : « les courbes se croisent à pH 7 ». Vrai : aux valeurs de pK<sub>A</sub>.</li>
        </Ul></>,
      texte: <>Le zwitterion occupe le milieu de l’échelle : il peut gagner un H⁺ (et redevenir le cation) ou en perdre un (et devenir l’anion). Une espèce chimique qui peut jouer à la fois le rôle d’un acide et celui d’une base de Brønsted est dite <strong>amphotère</strong>.</>,
      tache: { type: 'qcm', q: 'Quelle phrase explique que le zwitterion soit une espèce amphotère ?', ...Q.amphotere,
        expl: 'Le zwitterion H₃N⁺–CH₂–COO⁻ est la forme basique du couple 1 (cation / zwitterion) : il peut capter un H⁺. Il est la forme acide du couple 2 (zwitterion / anion) : il peut céder un H⁺. Il est donc à la fois acide et base : il est amphotère.',
        indice: 'Dans le couple 1 (cation / zwitterion), le zwitterion est-il la forme acide ou la forme basique ? Et dans le couple 2 ?' } },
    { id: 'sang', titre: 'Dans l’organisme', focus: ['formes', 'mesures'],
      retenirTitre: 'À RETENIR : LE ZWITTERION EST AMPHOTÈRE',
      retenir: <>
        <SvgAmphotereCarte/>
        <Ul>
          <li>Le zwitterion est la <strong>base du couple 1</strong> (il capte un H⁺ et redonne le cation) et l’<strong>acide du couple 2</strong> (il cède un H⁺ et donne l’anion) : il est <strong>amphotère</strong>.</li>
          <li>Exemple de la simulation : H₃N⁺–CH₂–COO⁻ porte une charge + et une charge −, neutre au total.</li>
          <li>Moyen de s’en souvenir : <strong>« amphotère = acide ET base »</strong>. Idée fausse : « zwitterion = molécule sans aucune charge ». Vrai : sans charge globale, mais avec deux charges opposées.</li>
        </Ul></>,
      texte: <>Le pH du sang vaut environ 7,4. À ce pH, la glycine est presque entièrement sous forme de zwitterion ; une très petite part est sous forme d’anion. C’est le couple 2 (zwitterion / anion, pK<sub>A2</sub> = 9,6) qui permet de la calculer : {FRapport2}</>,
      tache: { type: 'num', q: 'Pourcentage de glycine sous forme d’anion à pH = 7,4', unite: '%', vrai: M.pct(M.frac(7.4, GLY)[2]), tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['pH − pK_A2 = 7,4 − 9,6 = −2,2.', 'frac([anion]|[zwitterion]) = 10^(−2,2) = 6,3×10⁻³ (sans unité).', 'Le zwitterion représente presque toute la glycine : % anion = frac(100 × r|1 + r) = frac(100 × 6,3×10⁻³|1,0063) ≈ 0,63 %.'],
        pieges: [[99.4, 'C’est le pourcentage de zwitterion, la forme dominante ; on demande celui de l’anion.'], [0.0063, 'C’est le rapport, pas un pourcentage : multipliez par 100.'], [158, 'Le rapport est inversé : l’anion est au numérateur, et il est très minoritaire à ce pH.']],
        expl: 'r = 10^(7,4 − 9,6) = 10^(−2,2) = 6,3×10⁻³ ; % anion = frac(100 × r|1 + r) ≈ 0,63 %.', indice: 'Calculez d’abord le rapport frac([anion]|[zwitterion]) = 10^(pH − pK_A2) ; l’anion est très minoritaire, donc le pourcentage vaut environ 100 × ce rapport.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      texte: <>Vous savez associer à un pH la forme dominante d’un acide α-aminé : le <strong>cation</strong> sous pK<sub>A1</sub>, le <strong>zwitterion</strong> entre pK<sub>A1</sub> et pK<sub>A2</sub>, l’<strong>anion</strong> au-dessus de pK<sub>A2</sub>. Vous savez lire une frontière comme un couple (rapport 10<sup>pH − pK<sub>A</sub></sup>), lire un diagramme de distribution et dire pourquoi le zwitterion est amphotère. Passez à l’exploration (quatre acides α-aminés, tous les pH) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'forme' ? { type: 'forme', ...M.tirageDefiForme(), reps: { forme: null, pct: '' }, verifie: false } : { type: 'zone', ...M.tirageDefiZone(), reps: { bas: '', haut: '' }, verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const proche5 = (x, v) => isFinite(x) && Math.abs(x - v) <= 0.05 * v;
  const verifier = () => {
    if (defi.type === 'forme') {
      const ok = defi.reps.forme === defi.prod && proche5(lireNombre(defi.reps.pct), defi.pctZw);
      setDefi(d => ({ ...d, verifie: true, ok })); noterF(ok);
    } else {
      const ok = proche5(lireNombre(defi.reps.bas), defi.bas) && proche5(lireNombre(defi.reps.haut), defi.haut);
      setDefi(d => ({ ...d, verifie: true, ok })); noterZ(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, nom, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} =</span>
      <input value={defi.reps[cle]} aria-label={nom} onKeyDown={e => e.key === 'Enter' && document.getElementById('aa-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>{unite && <span>{unite}</span>}
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['forme', 'Forme prédominante et pourcentage'], ['zone', 'Zone de pH du zwitterion']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'forme' ? 'Défi : quelle forme domine, et quelle part de zwitterion ?' : 'Défi : entre quels pH le zwitterion domine-t-il largement ?'}</div>
      {defi.type === 'forme' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une solution de <strong>{defi.acide.nom}</strong> (chaîne latérale R = {defi.acide.R}) a pour constantes {avecIndices('pK_A1')} = <strong>{nbf(defi.acide.pKa1, 1)}</strong> et {avecIndices('pK_A2')} = <strong>{nbf(defi.acide.pKa2, 1)}</strong>. Son pH vaut <strong>{nbf(defi.pH, 1)}</strong>. Indiquez la forme qui prédomine, puis le pourcentage de zwitterion (marge acceptée : 5{NB}% de la valeur).</div>
        <div role="group" aria-label="Forme prédominante" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {M.FORMES.map(f => <button key={f.id} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, forme: f.id }, verifie: false }))} aria-pressed={defi.reps.forme === f.id}
            style={stylePetitBouton(defi.reps.forme === f.id, defi.verifie ? (defi.prod === f.id ? '#15803d' : '#dc2626') : '#475569')}>le {f.nom} domine</button>)}
        </div>
        {champ('pct', 'Pourcentage de zwitterion', '%')}
        <IndiceDefi cache={false}>Repérez la frontière voisine du pH (pK<sub>A1</sub> ou pK<sub>A2</sub>) et calculez r = 10<sup>pH − pK<sub>A</sub></sup> avec ce pK<sub>A</sub>. Près de pK<sub>A1</sub>, r = {avecIndices('frac([zwitterion]|[cation])')} et % zwitterion = {avecIndices('frac(100 × r|1 + r)')}. Près de pK<sub>A2</sub>, r = {avecIndices('frac([anion]|[zwitterion])')} et % zwitterion = {avecIndices('frac(100|1 + r)')}.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Pour une solution de <strong>{defi.acide.nom}</strong> ({avecIndices('pK_A1')} = <strong>{nbf(defi.acide.pKa1, 1)}</strong> ; {avecIndices('pK_A2')} = <strong>{nbf(defi.acide.pKa2, 1)}</strong>), on veut qu’au moins <strong>{defi.p}{NB}%</strong> de l’acide aminé soit sous forme de zwitterion. Donnez la plus petite et la plus grande valeur de pH qui conviennent (marge acceptée : 5{NB}% de la valeur).</div>
        {champ('bas', 'pH minimal', '')}
        {champ('haut', 'pH maximal', '')}
        <IndiceDefi cache={false}>Près de pK<sub>A1</sub>, il faut r = {avecIndices('frac([zwitterion]|[cation])')} au moins égal à {avecIndices('frac(p|100 − p)')}, donc pH minimal = pK<sub>A1</sub> + log({avecIndices('frac(p|100 − p)')}). Près de pK<sub>A2</sub>, le zwitterion est la forme acide : il faut {avecIndices('frac([anion]|[zwitterion])')} au plus égal à {avecIndices('frac(100 − p|p)')}, donc pH maximal = pK<sub>A2</sub> − log({avecIndices('frac(p|100 − p)')}).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="aa-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'forme'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `Frontière voisine : pK_A${defi.frontiere} = ${nbf(defi.frontiere === 1 ? defi.acide.pKa1 : defi.acide.pKa2, 1)}, donc pH − pK_A${defi.frontiere} = ${nbf(defi.pH - (defi.frontiere === 1 ? defi.acide.pKa1 : defi.acide.pKa2), 1)} et r = ${fmtR(10 ** (defi.pH - (defi.frontiere === 1 ? defi.acide.pKa1 : defi.acide.pKa2)))}. Le ${M.FORMES.find(f => f.id === defi.prod).nom} prédomine ; il y a ${fmtP(defi.pctZw)} % de zwitterion (marge acceptée : 5 % de la valeur).`
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `log(${defi.p} / ${100 - defi.p}) = ${nbf(Math.log10(defi.p / (100 - defi.p)), 2)} : pH minimal = ${nbf(defi.acide.pKa1, 1)} + ${nbf(Math.log10(defi.p / (100 - defi.p)), 2)} = ${nbf(defi.bas, 2)} et pH maximal = ${nbf(defi.acide.pKa2, 1)} − ${nbf(Math.log10(defi.p / (100 - defi.p)), 2)} = ${nbf(defi.haut, 2)} (marge acceptée : 5 % de la valeur).`}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> (les pK<sub>A</sub> ne dépendent que de T) ; la simulation ne fait pas varier T.</li>
      <li><strong>Activités ≈ concentrations</strong> : solutions diluées, concentrations divisées par c° = 1 mol·L⁻¹ ; K<sub>A</sub>, rapports et pourcentages n’ont pas d’unité.</li>
      <li><strong>Le pH est imposé</strong> : on suppose que le pH de la solution est fixé (par exemple par une solution tampon) ; l’acide aminé n’en modifie pas la valeur. On ne calcule que la répartition entre le cation, le zwitterion et l’anion.</li>
      <li><strong>Acides α-aminés à chaîne latérale neutre</strong> : glycine, alanine, sérine, phénylalanine. Ils n’ont que deux pK<sub>A</sub>. Les acides α-aminés dont la chaîne latérale porte un autre groupe acide ou basique (acide aspartique, lysine…) ont un troisième pK<sub>A</sub> et ne sont pas modélisés.</li>
      <li><strong>Deux couples lus séparément</strong> : pK<sub>A1</sub> et pK<sub>A2</sub> sont éloignés de plus de 6 unités. Près d’une frontière, la troisième forme est négligeable (moins de 10⁻⁴ %) : on lit un seul couple avec le rapport 10<sup>pH − pK<sub>A</sub></sup>. La simulation, elle, calcule les trois formes ensemble.</li>
      <li><strong>Forme non ionisée négligée</strong> : H₂N–CH₂–COOH, sans aucune charge, existe en quantité infime dans l’eau ; le zwitterion est la forme neutre habituelle.</li>
      <li><strong>Valeurs de pK<sub>A</sub></strong> : valeurs usuelles à 25 °C arrondies au dixième (glycine 2,3 et 9,6 ; alanine 2,3 et 9,7 ; sérine 2,2 et 9,2 ; phénylalanine 1,8 et 9,1), données du problème, non à retrouver.</li>
      <li><strong>Limites</strong> : ni solubilité, ni migration sous champ électrique, ni calcul du pH d’une solution d’acide aminé dans l’eau pure ; pH de 0 à 14 ; le zwitterion est présenté comme espèce amphotère, sans aller plus loin.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- les trois formes (équations des deux couples, composition) ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const toutesFormes = enExplore || apres('ordre');
  const fleche = (n, groupe) => (
    <div key={`f${n}`} style={{ fontSize: 14, color: KIT.txt2, margin: '3px 0 3px 14px', lineHeight: 1.4 }}>↓ le groupe {groupe} cède un H⁺ à l’eau : {avecIndices(`pK_A${n} = ${nbf(n === 1 ? a.pKa1 : a.pKa2, 1)}`)}</div>);
  const boxFormes = !dd && (
    <div style={{ ...styleBoite, ...cadre('formes') }}>
      <div style={titreCarte}>{enGuide && !toutesFormes ? 'La glycine en solution très acide' : `Les trois formes : ${a.nom}`}</div>
      {enExplore && <div style={aide}>Les deux flèches sont les réactions des deux couples : la forme du dessus cède un H⁺ à l’eau et donne la forme du dessous (réaction avec l’eau : forme du dessus + H₂O ⇌ forme du dessous + H₃O⁺).</div>}
      {M.FORMES.filter(f => toutesFormes || f.id === 'cat').map((f, i) => {
        const act = surligne && actifForme(f.id) && toutesFormes;
        return (
          <div key={f.id}>
            {i === 1 && fleche(1, '–COOH')}{i === 2 && fleche(2, '–NH₃⁺')}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 10, border: `2px solid ${act ? COUL_FORME[f.id] : KIT.bord}`, background: act ? FOND[f.id] : '#fff' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: KIT.txt, whiteSpace: 'nowrap', marginRight: 8 }}>{M.formule(a, f.id)}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: COUL_FORME[f.id] }}>{f.nom} (charge {f.charge})</span>
              {montrerBilan && <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: COUL_FORME[f.id], whiteSpace: 'nowrap' }}>{fmtP(M.pct(fr[i]))}{NB}%</span>}
            </div>
          </div>);
      })}
      {a.id !== 'gly' && <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>R est la chaîne latérale : R = {a.R} pour {a.nom === 'alanine' ? 'l’alanine' : a.nom === 'sérine' ? 'la sérine' : 'la phénylalanine'}.</div>}
    </div>);

  // ---------- diagrammes ----------
  const boxPred = !dd && deja('cation') && (
    <div style={{ ...styleBoite, ...cadre('pred') }}>
      <div style={titreCarte}>Diagramme de prédominance</div>
      {enExplore && <div style={aide}>Sur l’axe des pH, la forme la plus abondante : le cation à gauche de pK<sub>A1</sub>, le zwitterion entre les deux frontières, l’anion à droite de pK<sub>A2</sub>. Le repère rouge est le pH choisi.</div>}
      <DiagPred3 pH={pH} a={a} revele={revele}/>
    </div>);
  const boxDist = !dd && enGuide && deja('dist') && (
    <div style={{ ...styleBoite, ...cadre('dist') }}>
      <div style={titreCarte}>Diagramme de distribution</div>
      <DiagDist3 pH={pH} a={a}/>
    </div>);
  const resumeDist = `zwitterion ${fmtP(M.pct(fr[1]))}${NB}% à pH ${nbf(pH, 1)}`;
  const sectionDist = enExplore && (
    <Section titre={<span><span style={{ display: 'block' }}>Diagramme de distribution</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{resumeDist}</span></span>} ouvert={ouv.dist} onBascule={() => setOuv(o => ({ ...o, dist: !o.dist }))}>
      <div style={aide}>Pourcentage de chaque forme selon le pH. Cation et zwitterion se croisent à 50 % pour pH = pK<sub>A1</sub>, zwitterion et anion pour pH = pK<sub>A2</sub> ; les points colorés donnent la composition au pH choisi.</div>
      <DiagDist3 pH={pH} a={a}/>
    </Section>);

  // ---------- réglages (exploration) ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages de l’expérience</div>
      <div style={aide}>Choisissez l’acide α-aminé, puis le pH imposé à la solution : les trois formes se répartissent selon les deux pK<sub>A</sub>.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Acide α-aminé (pKA1 et pKA2)
        <select value={ti.ac} onChange={e => setT({ ac: e.target.value })} style={{ ...menu, marginTop: 2 }}>
          {M.ORDRE.map(id => <option key={id} value={id}>{M.ACIDES[id].nom} ({nbf(M.ACIDES[id].pKa1, 1)} et {nbf(M.ACIDES[id].pKa2, 1)})</option>)}
        </select>
      </label>
      <Curseur nom="pH de la solution" valeur={ti.pH} onChange={p => setT({ pH: Math.round(p * 10) / 10 })} min={0} max={14} pas={0.1} decimales={1}/>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2 }}>Aller à un pH usuel
        <select value="" onChange={e => e.target.value && setT({ pH: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>
          <option value="">Choisir un milieu…</option>
          {PH_USUELS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </label>
    </div>);

  // ---------- mesures ----------
  const nomProd = { cat: 'cation', zw: 'zwitterion', an: 'anion', egal1: 'cation = zwitterion (50 % / 50 %)', egal2: 'zwitterion = anion (50 % / 50 %)' }[prod];
  const mesures = !dd && deja('cation') && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={titreCarte}>Mesures</div>
      {enExplore && <div style={aide}>Valeurs calculées pour l’acide aminé et le pH choisis.</div>}
      <LigneMesure nom="pH de la solution" valeur={nbf(pH, 1)} couleur={COL.rouge}/>
      <LigneMesure nom="pK_A1 (groupe –COOH)" valeur={nbf(a.pKa1, 1)} couleur={COL.orange}/>
      <LigneMesure nom="pK_A2 (groupe –NH₃⁺)" valeur={nbf(a.pKa2, 1)} couleur={COL.orange}/>
      {(enExplore || apres('anion')) && <LigneMesure nom="Forme prédominante" valeur={nomProd} couleur={COL.vert}/>}
      {montrerBilan && <>
        <LigneMesure nom="% de cation" valeur={`${fmtP(M.pct(fr[0]))}${NB}%`} couleur={COUL_FORME.cat}/>
        <LigneMesure nom="% de zwitterion" valeur={`${fmtP(M.pct(fr[1]))}${NB}%`} couleur={COUL_FORME.zw}/>
        <LigneMesure nom="% d’anion" valeur={`${fmtP(M.pct(fr[2]))}${NB}%`} couleur={COUL_FORME.an}/></>}
      {enExplore && <>
        <LigneMesure nom="[zwitterion] / [cation]" valeur={fmtR(M.rapport1(pH, a))}/>
        <LigneMesure nom="[anion] / [zwitterion]" valeur={fmtR(M.rapport2(pH, a))}/></>}
    </div>);

  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>{avecIndices('Réglez le pH exactement sur pK_A1 puis sur pK_A2 : que valent les pourcentages des trois formes ? Quelle forme est presque absente à chaque fois ?')}</li>
        <li>Parcourez le pH de 0 à 14 avec la glycine : à quels pH la forme prédominante change-t-elle ? Comparez avec les deux pK<sub>A</sub>.</li>
        <li>Comparez la glycine et la phénylalanine : le domaine du zwitterion est-il au même endroit ? De combien de pH est-il décalé ?</li>
        <li>Choisissez le sang puis le suc gastrique dans « pH usuels » : quelle est la forme dominante, et quel pourcentage reste sous les autres formes ?</li>
        <li>Cherchez le pH où le pourcentage de zwitterion est le plus grand : est-il proche de 100 % ? Où se trouve-t-il par rapport aux deux pK<sub>A</sub> ?</li>
        <li>Ouvrez le diagramme de distribution : pourquoi la courbe du zwitterion est-elle « en cloche » alors que celles du cation et de l’anion sont monotones ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Un acide α-aminé a deux groupes –COOH et –NH₃⁺ : deux couples, deux pK<sub>A</sub>, trois formes</li>
          <li>pH &lt; pK<sub>A1</sub> : cation (+) ; pK<sub>A1</sub> &lt; pH &lt; pK<sub>A2</sub> : zwitterion (neutre au total) ; pH &gt; pK<sub>A2</sub> : anion (−)</li>
          <li>Près d’une frontière, on lit un seul couple : {avecIndices('frac([forme basique]|[forme acide]) = 10^(pH − pK_A)')}</li>
          <li>À pH = pK<sub>A</sub> : 50 % de chaque forme du couple (croisement des courbes de distribution)</li>
          <li>Le zwitterion est amphotère : base du couple 1 et acide du couple 2</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .aa-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .aa-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .aa-col { display: flex; flex-direction: column; gap: 12px; }
        .aa-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .aa-l1.cote .aa-carte { order: 2; } .aa-l1.cote .aa-main { order: 1; }
          .aa-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .aa-ex > * { grid-column: 1; } .aa-ex > .aa-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .aa-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .aa-in { animation: aa-fondu 0.35s ease-out; } @keyframes aa-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Acides α-aminés : forme selon le pH</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un acide α-aminé a <strong>deux groupes</strong> qui échangent des H⁺, donc <strong>deux pK<sub>A</sub></strong>. Selon le pH, il est surtout sous forme de <strong>cation</strong>, de <strong>zwitterion</strong> ou d’<strong>anion</strong>.</div>
      {!enExplore && <div className={`aa-l1${!enExplore ? ' cote' : ''}`}>
        {enGuide ? <div className="aa-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="aa-carte">{panneauHypo}</div> : null}
        <div className="aa-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'forme' ? suiviF : suiviZ}/></div>}
          {!dd && <div className="aa-col">
            <div className="aa-in">{boxFormes}</div>
            {boxPred && <div className="aa-in">{boxPred}</div>}
            {boxDist && <div className="aa-in">{boxDist}</div>}
            {mesures && <div className="aa-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <div className="aa-ex">
        <div>{boxFormes}</div>
        <div>{boxPred}</div>
        <div className="aa-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{sectionDist}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
