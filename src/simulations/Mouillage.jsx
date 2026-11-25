import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./mouillageModele";
import { QCM } from "./mouillageQcm";
import { SvgSurfaceMol, SvgWilhelmy, SvgGoutte, SvgZisman, SvgCarteSituations, SvgCarteZisman, SvgCarteBilanMouillage } from "./MouillageSchemas";

const SIM_ID = 234, CLE_GUIDE = 'mouillage-guide-v1';
declarerDefis(SIM_ID, [['zisman', 'Déterminer la tension critique d’un film à partir d’angles de contact'], ['diagnostic', 'Diagnostiquer une encre qui ne mouille pas un film']]);

// ====================================================
//  SIM 234 — MOUILLAGE : TENSION SUPERFICIELLE, ANGLE DE CONTACT, TENSION CRITIQUE (BTS MDC, Formulation ; fil rouge : une encre d’emballage sur un film plastique)
//  Capacités visées (jamais affichées à l'élève) : mettre en œuvre une méthode de mesure de la tension interfaciale ; identifier mouillage total, partiel et non mouillage
//  selon l'angle de raccordement ; appliquer la loi de Young-Dupré pour un critère simple de mouillage ; tension critique de Zisman ; traitements de surface.
//  Modèle QUALITATIF : mouillageModele.js. Schémas : MouillageSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const PE = M.solide('pe'), PET = M.solide('pet');
const F_W = Math.round(M.forceMN(28.5) * 100) / 100;                              // force affichée (mN) : elle sert au corrigé
const GAMMA_W = F_W / (M.perimetre() / 1000);
const TH_EAU_PE = Math.round(PE.thEau);                                           // 96 °
const W_EAU = M.G_EAU * (1 + Math.cos(TH_EAU_PE * Math.PI / 180));
const PTS_PET = M.pointsZisman(PET, ['pc', 'dmso', 'eg', 'eau']);
const GC_PET = M.gcDeuxPoints(PTS_PET[0], PTS_PET[3]);
const PTS_PE = M.pointsZisman(PE);
const thetaDe = (s, g, gc) => M.theta(s, g, gc);

export function SimulationMouillage() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState({ s: 'pe', l: 'etoh', n: 0, gInk: M.G_ENCRE });               // scène du parcours
  const [ex, setEx] = useState({ s: 'pe', l: 'eau', n: 0, gPerso: 50 });                        // exploration
  const [ouv, setOuv] = useState({});
  const [suiviD, noterD] = useCompteurDefi(), [suiviG, noterG] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('zisman');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const sVie = M.solide(vie.s), gcVie = M.gcTraite(sVie, vie.n);

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'surface', titre: 'Pourquoi une goutte est-elle ronde ?', focus: ['scene'],
      texte: <>Une encre d’emballage doit s’étaler sur un film plastique. Pour comprendre si elle va le faire, on commence par le liquide lui-même. Dans un liquide, chaque molécule est attirée par ses voisines. Une molécule du volume est entourée : les forces se compensent. Une molécule de <strong>surface</strong> n’a pas de voisines au-dessus : elle est tirée vers l’intérieur. Le liquide tend donc à avoir la plus petite surface possible : c’est l’origine de la <strong>tension superficielle</strong>.</>,
      tache: { type: 'qcm', q: 'Pourquoi une goutte de liquide tend-elle vers une forme sphérique ?', ...QCM.surface,
        expl: 'La sphère est la forme qui a la plus petite surface pour un volume donné. Les molécules de surface, attirées vers l’intérieur, tendent à réduire cette surface : c’est la tension superficielle.', indice: 'Comparez les forces subies par une molécule du volume et par une molécule de surface sur le schéma.' } },
    { id: 'wilhelmy', titre: 'Mesurer la tension superficielle : la lame de Wilhelmy', focus: ['scene', 'mesures'],
      texte: <>La <strong>tension superficielle</strong> γ est la force exercée par la surface par unité de longueur (en N/m, ou mN/m) ; c’est aussi l’énergie par unité de surface (J/m²). On la mesure par exemple avec une <strong>lame de Wilhelmy</strong> : une lame de platine, parfaitement mouillée, est suspendue à une balance et partiellement plongée dans le liquide. La balance mesure la force verticale <FormuleEnLigne><mi>F</mi><mo>=</mo><mi>γ</mi><mo>×</mo><mi>p</mi></FormuleEnLigne>, où <em>p</em> est le périmètre mouillé de la lame (les deux faces et les deux tranches) : <FormuleEnLigne><mi>p</mi><mo>=</mo><mn>2</mn><mo>(</mo><mi>l</mi><mo>+</mo><mi>e</mi><mo>)</mo></FormuleEnLigne>. On mesure F = {fr(F_W, 2)} mN pour un liquide inconnu.</>,
      tache: { type: 'num', q: 'Tension superficielle du liquide', unite: 'mN/m', vrai: GAMMA_W, tol: 0.03, affiche: v => fr(v, 1), cs: 3,
        calcul: () => [`Périmètre mouillé : p = 2 (l + e) = 2 × (${fr(M.PLAQUE.l, 1)} + ${fr(M.PLAQUE.e, 1)}) = ${fr(M.perimetre(), 1)} mm = ${fr(M.perimetre() / 1000, 4)} m.`, `Tension superficielle : γ = F ÷ p = ${fr(F_W, 2)}·10⁻³ N ÷ ${fr(M.perimetre() / 1000, 4)} m = ${fr(GAMMA_W / 1000, 4)} N/m.`, `Soit γ ≈ ${fr(GAMMA_W, 1)} mN/m : c’est l’ordre de grandeur du toluène (28,5 mN/m), très inférieur à celui de l’eau (72,8 mN/m). Hypothèse : la lame est parfaitement mouillée (θ = 0) et sa poussée d’Archimède est compensée par la tare.`],
        pieges: [[F_W / (M.PLAQUE.l / 1000), 'Le périmètre mouillé compte les deux faces et les deux tranches : p = 2 (l + e), pas seulement la longueur l.'], [GAMMA_W / 1000, 'Valeur en N/m : on demande le résultat en mN/m (1 N/m = 1000 mN/m).'], [F_W / (M.perimetre() / 2000), 'Vous avez oublié le facteur 2 : la lame est mouillée sur ses deux faces.']],
        expl: `p = 2 × (20,0 + 0,2) = 40,4 mm ; γ = F ÷ p = ${fr(F_W, 2)}·10⁻³ ÷ 0,0404 ≈ ${fr(GAMMA_W, 1)} mN/m.`, indice: 'γ = F ÷ p avec p = 2 (l + e) ; convertissez p en mètres (1 mm = 10⁻³ m) et F en newtons (1 mN = 10⁻³ N).' } },
    { id: 'angle', titre: 'La goutte posée sur un solide : l’angle de contact', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Posons maintenant une goutte sur un solide. Au point de contact entre le solide, le liquide et l’air, on mesure l’<strong>angle de contact</strong> θ (ou angle de raccordement) : c’est l’angle entre la surface du solide et la tangente à la goutte, mesuré à l’intérieur du liquide. Choisissez un solide et un liquide pour obtenir un angle <strong>supérieur à 90°</strong>.</>,
      tache: { type: 'action', ok: M.theta(sVie, M.liquide(vie.l).g) > 90, consigne: 'Choisir un solide et un liquide pour que θ dépasse 90°' } },
    { id: 'situations', titre: 'Mouillage total, partiel ou faible', focus: ['scene', 'mesures'],
      texte: <>Plus l’angle θ est petit, mieux le liquide <strong>mouille</strong> le solide. Pour θ = 0, il s’étale complètement : c’est le <strong>mouillage total</strong>. Pour 0 &lt; θ &lt; 90°, le mouillage est <strong>partiel</strong> et le liquide mouille le solide. Au-delà de 90°, le liquide mouille mal et reste en goutte.</>,
      tache: { type: 'qcm', q: 'Un liquide fait un angle θ = 35° avec un solide. Comment décrire ce mouillage ?', ...QCM.situations,
        expl: 'Un angle de 35° est non nul et inférieur à 90° : le liquide ne s’étale pas complètement (pas de mouillage total) mais il mouille le solide, c’est un mouillage partiel.', indice: 'Comparez 35° à 0° (étalement complet) et à 90° (limite entre bon et mauvais mouillage).' } },
    { id: 'young', titre: 'Les tensions au point de contact : Young et Young-Dupré', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : les trois situations', retenir: <>
        <SvgCarteSituations/>
        <ul style={puces}>
          <li>θ = 0 : <strong>mouillage total</strong> ; 0 &lt; θ &lt; 90° : <strong>mouillage partiel</strong> (le liquide mouille) ; θ &gt; 90° : le liquide mouille mal.</li>
        </ul></>,
      texte: <>Au point de contact, trois tensions interfaciales s’équilibrent selon l’horizontale : γ<sub>SV</sub> (solide-air), γ<sub>SL</sub> (solide-liquide) et γ<sub>LV</sub> (liquide-air). C’est l’<strong>équation de Young</strong> : <FormuleEnLigne><msub><mi>γ</mi><mi>SV</mi></msub><mo>=</mo><msub><mi>γ</mi><mi>SL</mi></msub><mo>+</mo><msub><mi>γ</mi><mi>LV</mi></msub><mo>cos</mo><mi>θ</mi></FormuleEnLigne>. En l’associant à l’énergie d’adhésion, la <strong>relation de Young-Dupré</strong> donne le travail d’adhésion du liquide sur le solide : <FormuleEnLigne><mi>W</mi><mo>=</mo><msub><mi>γ</mi><mi>LV</mi></msub><mo>(</mo><mn>1</mn><mo>+</mo><mo>cos</mo><mi>θ</mi><mo>)</mo></FormuleEnLigne>. Plus θ est petit, plus W est grand : le liquide adhère fortement.</>,
      tache: { type: 'num', q: 'Travail d’adhésion de l’eau sur le polyéthylène', unite: 'mJ/m²', vrai: W_EAU, tol: 0.03, affiche: v => fr(v, 1), cs: 3,
        calcul: () => [`Données : γ_LV = ${fr(M.G_EAU, 1)} mN/m ; θ = ${TH_EAU_PE}°.`, `cos ${TH_EAU_PE}° = ${fr(Math.cos(TH_EAU_PE * Math.PI / 180), 3)} (calculatrice en degrés).`, `W = ${fr(M.G_EAU, 1)} × (1 + (${fr(Math.cos(TH_EAU_PE * Math.PI / 180), 3)})) = ${fr(W_EAU, 1)} mN/m = ${fr(W_EAU, 1)} mJ/m².`],
        pieges: [[M.G_EAU * (1 - Math.cos(TH_EAU_PE * Math.PI / 180)), 'Le signe est inversé : W = γ_LV (1 + cos θ), pas (1 − cos θ).'], [M.G_EAU * (1 + Math.cos(TH_EAU_PE)), 'La calculatrice était en radians : réglez-la en degrés.'], [1 + Math.cos(TH_EAU_PE * Math.PI / 180), 'Vous avez oublié de multiplier par γ_LV.']],
        expl: `W = 72,8 × (1 + cos 96°) = 72,8 × 0,895 ≈ ${fr(W_EAU, 1)} mJ/m².`, indice: 'W = γ_LV × (1 + cos θ). Attention au mode de la calculatrice : degrés.' } },
    { id: 'critere-action', titre: 'Quel liquide s’étale complètement sur le PE ?', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Le solide est le <strong>polyéthylène</strong> (PE), un film d’emballage courant. Parmi plusieurs liquides, certains s’étalent complètement, d’autres non. Changez de liquide et choisissez-en un qui donne un <strong>mouillage total</strong> (θ = 0).</>,
      tache: { type: 'action', ok: M.theta(M.solide('pe'), M.liquide(vie.l).g) < 0.5, consigne: 'Choisir un liquide qui s’étale complètement sur le PE' } },
    { id: 'critere-q', titre: 'La tension critique d’un solide', focus: ['scene', 'mesures'],
      texte: <>Les liquides qui s’étalent sur le PE ont tous une tension superficielle faible : l’éthanol (22,3 mN/m), le toluène (28,5), le diéthylène glycol (30,1). L’eau (72,8) perle. Pour un solide donné, il existe une valeur seuil : la <strong>tension critique</strong> γ<sub>c</sub>.</>,
      tache: { type: 'qcm', q: 'Quelle condition permet à un liquide de s’étaler complètement sur un solide ?', ...QCM.critere,
        expl: 'Un liquide s’étale complètement (θ = 0) sur un solide quand sa tension superficielle est inférieure à la tension critique γc de ce solide. L’éthanol, à 22,3 mN/m, est sous γc du PE ; l’eau, à 72,8 mN/m, est très au-dessus.', indice: 'Comparez les tensions superficielles des liquides qui s’étalent sur le PE à celle de l’eau, qui ne s’étale pas.' } },
    { id: 'zisman-trace', titre: 'Mesurer γc : le tracé de Zisman', focus: ['scene', 'mesures'],
      texte: <>Comment trouver γ<sub>c</sub> ? Méthode de <strong>Zisman</strong> : on mesure l’angle de contact de plusieurs liquides sur le solide, puis on trace <strong>cos θ en fonction de la tension superficielle</strong> du liquide. Pour les liquides qui ne s’étalent pas, les points sont alignés. On <strong>prolonge la droite jusqu’à cos θ = 1</strong> : l’abscisse du point obtenu est γ<sub>c</sub>. Les points creux sont les liquides qui s’étalent complètement (cos θ = 1).</>,
      tache: { type: 'qcm', q: 'Que représente l’abscisse du point où la droite, prolongée, atteint cos θ = 1 ?', ...QCM.zisman,
        expl: 'C’est la tension critique γc du solide : un liquide de tension superficielle inférieure à γc s’étale complètement (cos θ = 1). Un solide a donc une tension critique, mesurée avec des liquides sondes.', indice: 'cos θ = 1 correspond à θ = 0 : le liquide s’étale complètement.' } },
    { id: 'zisman-num', titre: 'Déterminer γc d’un film inconnu', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : la tension critique', retenir: <>
        <SvgCarteZisman/>
        <ul style={puces}>
          <li>On mesure θ avec plusieurs liquides, on trace <strong>cos θ = f(γ)</strong> et on prolonge la droite jusqu’à <strong>cos θ = 1</strong> : on lit γ<sub>c</sub>.</li>
          <li>Un liquide de tension superficielle <strong>inférieure à γ<sub>c</sub></strong> s’étale complètement.</li>
        </ul></>,
      texte: <>Un film plastique inconnu est testé avec quatre liquides (tableau). Les points du tracé sont alignés. Prolongez la droite jusqu’à cos θ = 1 : choisissez deux points éloignés, calculez la pente <FormuleEnLigne><mi>a</mi><mo>=</mo><mfrac><mrow><msub><mi>c</mi><mn>2</mn></msub><mo>−</mo><msub><mi>c</mi><mn>1</mn></msub></mrow><mrow><msub><mi>γ</mi><mn>2</mn></msub><mo>−</mo><msub><mi>γ</mi><mn>1</mn></msub></mrow></mfrac></FormuleEnLigne> (c = cos θ), puis la valeur de γ pour laquelle cos θ = 1.</>,
      tache: { type: 'num', q: 'Tension critique γc du film', unite: 'mN/m', vrai: GC_PET, tol: 0.08, affiche: v => fr(v, 1), cs: 2,
        calcul: () => { const a = PTS_PET[0], b = PTS_PET[3], p = (b.cos - a.cos) / (b.g - a.g); return [`Deux points : (${fr(a.g, 1)} ; ${fr(a.cos, 2)}) et (${fr(b.g, 1)} ; ${fr(b.cos, 2)}).`, `Pente : a = (${fr(b.cos, 2)} − ${fr(a.cos, 2)}) ÷ (${fr(b.g, 1)} − ${fr(a.g, 1)}) = ${fr(p, 4)} (mN/m)⁻¹.`, `cos θ = 1 pour γ = ${fr(a.g, 1)} + (1 − ${fr(a.cos, 2)}) ÷ ${fr(p, 4)} = ${fr(GC_PET, 1)} mN/m.`, 'Le résultat dépend un peu des deux points choisis (angles mesurés au degré près) : une tolérance de 8 % est acceptée.']; },
        pieges: [[PTS_PET[0].g, 'C’est la tension du premier liquide du tableau, pas le point où la droite atteint cos θ = 1.'], [M.G_EAU, 'C’est la tension superficielle de l’eau : γc se lit à cos θ = 1, bien plus à gauche.']],
        expl: `La droite passe par les points mesurés ; elle atteint cos θ = 1 en γ ≈ ${fr(GC_PET, 0)} mN/m : c’est la tension critique du film (ici du PET).`, indice: 'Pente a = (c₂ − c₁) ÷ (γ₂ − γ₁) ; puis γc = γ₁ + (1 − c₁) ÷ a.' } },
    { id: 'encre', titre: 'L’encre sur le film : pourquoi perle-t-elle ?', focus: ['scene', 'mesures'],
      texte: <>Revenons à l’encre d’emballage. Une encre à base d’eau additionnée de tensioactifs a une tension superficielle d’environ <strong>{fr(M.G_ENCRE, 0)} mN/m</strong> (valeur illustrative). On l’applique sur du PE <strong>non traité</strong>, de tension critique {fr(PE.gc, 1)} mN/m. L’encre ne s’étale pas : elle forme une goutte avec un angle de contact non nul.</>,
      tache: { type: 'qcm', q: `Une encre à ${fr(M.G_ENCRE, 0)} mN/m est déposée sur du PE non traité (γc = ${fr(PE.gc, 1)} mN/m). Pourquoi ne s’étale-t-elle pas ?`, ...QCM.encre,
        expl: 'La tension superficielle de l’encre (38 mN/m) dépasse la tension critique du PE (31,6 mN/m) : le liquide reste en goutte avec un angle de contact non nul. Il faut soit abaisser la tension superficielle de l’encre, soit augmenter celle du film.', indice: 'Comparez la tension superficielle de l’encre à la tension critique du film.' } },
    { id: 'remedes', titre: 'Faire mouiller l’encre : deux leviers', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Deux leviers : <strong>abaisser la tension superficielle de l’encre</strong> (tensioactif, solvant) ou <strong>augmenter celle du film</strong> par un traitement de surface : traitement <strong>corona</strong> (décharge électrique) ou plasma, qui oxyde la surface et la rend plus énergétique. Un traitement corona amène un film de polyoléfine à environ 38 à 44 mN/m. Réglez l’un des deux leviers (ou les deux) pour que l’encre s’étale complètement (θ = 0).</>,
      tache: { type: 'action', ok: M.theta(sVie, vie.gInk, gcVie) < 0.5, consigne: 'Faire s’étaler complètement l’encre en réglant la tension de l’encre ou le traitement du film' } },
    { id: 'vieillissement', titre: 'Le traitement ne dure pas', focus: ['scene', 'mesures'],
      texte: <>Un film traité par corona est stocké plusieurs semaines avant l’impression. Ensuite, l’encre mouille de nouveau mal. En pratique, on vise aussi une <strong>marge</strong> : on recommande une énergie de surface du film supérieure de 7 à 10 mN/m à la tension superficielle de l’encre.</>,
      tache: { type: 'qcm', q: 'Un film de PE traité par corona est stocké plusieurs semaines : l’encre mouille de nouveau mal. Pourquoi ?', ...QCM.vieillissement,
        expl: 'L’effet du traitement corona s’atténue en quelques semaines : l’énergie de surface retombe vers sa valeur initiale. D’où l’intérêt de traiter le film peu avant l’impression ou de contrôler sa tension de surface.', indice: 'Pensez à ce qui est modifié par le traitement : la surface du film, pas l’encre.' } },
    { id: 'bilan', titre: 'Le bilan : mesurer, classer, améliorer le mouillage', focus: [],
      retenirTitre: 'À retenir : le mouillage', retenir: <>
        <SvgCarteBilanMouillage/>
        <ul style={puces}>
          <li>Tension superficielle : mesurée par la <strong>lame de Wilhelmy</strong> (F = γ × p), en mN/m.</li>
          <li><strong>Young-Dupré</strong> : W = γ<sub>LV</sub>(1 + cos θ).</li>
          <li>Améliorer le mouillage : <strong>abaisser γ du liquide</strong> ou <strong>traiter le solide</strong> (corona, plasma, dégraissage).</li>
        </ul></>,
      texte: <>Vous savez mesurer une tension superficielle, classer un mouillage d’après l’angle de contact, appliquer la relation de Young-Dupré, déterminer une tension critique par le tracé de Zisman et choisir comment faire mouiller une encre sur un film. En exploration, vous pouvez changer le solide, le liquide et le traitement.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(() => {
      const id = IDS[ni];
      if (id === 'angle') return { s: 'pe', l: 'etoh', n: 0, gInk: M.G_ENCRE };
      if (id === 'critere-action') return { s: 'pe', l: 'eau', n: 0, gInk: M.G_ENCRE };
      if (id === 'remedes') return { s: 'pe', l: 'eau', n: 0, gInk: M.G_ENCRE };
      return { s: 'pe', l: 'eau', n: 0, gInk: M.G_ENCRE };
    });
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sc = idE;
  const liqVie = M.liquide(vie.l), thVie = M.theta(sVie, liqVie.g);
  const thEncre = thetaDe(sVie, vie.gInk, gcVie);
  const sceneGuide = !enGuide ? null
    : sc === 'surface' ? <SvgSurfaceMol/>
    : sc === 'wilhelmy' ? <SvgWilhelmy/>
    : ['angle', 'situations', 'critere-action', 'critere-q'].includes(sc) ? <SvgGoutte th={thVie} solideNom={sVie.court} liquideNom={liqVie.nom}/>
    : sc === 'young' ? <SvgGoutte th={TH_EAU_PE} forces solideNom="PE" liquideNom="eau"/>
    : sc === 'zisman-trace' ? <SvgZisman pts={PTS_PE} nomSolide="PE"/>
    : sc === 'zisman-num' ? <SvgZisman pts={PTS_PET} nomSolide="film inconnu"/>
    : ['encre', 'remedes', 'vieillissement'].includes(sc) ? <SvgGoutte th={thEncre} solideNom={sc === 'encre' ? 'film de PE' : `film de PE${vie.n > 0 ? ' traité' : ''}`} liquideNom="encre" liquideCouleur="#fde68a"/>
    : null;
  const MES_GUIDE = {
    'wilhelmy': [['Longueur de la lame l', `${fr(M.PLAQUE.l, 1)} mm`], ['Épaisseur de la lame e', `${fr(M.PLAQUE.e, 1)} mm`], ['Force mesurée F', `${fr(F_W, 2)} mN`]],
    'angle': [['Solide', sVie.court], ['Liquide', liqVie.nom], ['Angle de contact θ', `${fr(thVie, 0)} °`]],
    'situations': [['Solide', sVie.court], ['Liquide', liqVie.nom], ['Angle de contact θ', `${fr(thVie, 0)} °`]],
    'young': [['Tension superficielle de l’eau γ_LV', `${fr(M.G_EAU, 1)} mN/m`], ['Angle de contact de l’eau sur le PE', `${TH_EAU_PE} °`]],
    'critere-action': [['Tension superficielle du liquide', `${fr(liqVie.g, 1)} mN/m`], ['Angle de contact θ sur le PE', `${fr(thVie, 0)} °`]],
    'critere-q': [['Tension superficielle du liquide', `${fr(liqVie.g, 1)} mN/m`], ['Angle de contact θ sur le PE', `${fr(thVie, 0)} °`]],
    'zisman-trace': M.LIQUIDES.map((l, i) => [`${l.nom} (${fr(l.g, 1)} mN/m)`, `θ = ${PTS_PE[i].theta} °`]),
    'zisman-num': PTS_PET.map(p => [`${p.nom} (γ = ${fr(p.g, 1)} mN/m)`, `θ = ${p.theta} °, cos θ = ${fr(p.cos, 2)}`]),
    'encre': [['Tension superficielle de l’encre', `${fr(M.G_ENCRE, 0)} mN/m`], ['Tension critique du PE non traité', `${fr(PE.gc, 1)} mN/m`], ['Angle de contact de l’encre', `${fr(thEncre, 0)} °`]],
    'remedes': [['Tension superficielle de l’encre', `${fr(vie.gInk, 0)} mN/m`], ['Tension critique du film', `${fr(gcVie, 1)} mN/m`], ['Angle de contact de l’encre', `${fr(thEncre, 0)} °`]],
    'vieillissement': [['Énergie de surface du film', 'diminue avec le temps après traitement']],
  };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab, val, onCh, options) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurGuide = enGuide && ['angle', 'critere-action', 'remedes'].includes(sc) ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      {sc === 'angle' && <>{selecteur('mj-gs', 'Solide', vie.s, ev => setVie(s => ({ ...s, s: ev.target.value })), M.SOLIDES)}{selecteur('mj-gl', 'Liquide', vie.l, ev => setVie(s => ({ ...s, l: ev.target.value })), M.LIQUIDES)}</>}
      {sc === 'critere-action' && selecteur('mj-gl', 'Liquide déposé sur le PE', vie.l, ev => setVie(s => ({ ...s, l: ev.target.value })), M.LIQUIDES)}
      {sc === 'remedes' && <>
        {curs('mj-gi', `Tension superficielle de l’encre : ${fr(vie.gInk, 0)} mN/m`, vie.gInk, 25, 45, 1, ev => setVie(s => ({ ...s, gInk: parseFloat(ev.target.value) })), 'On l’abaisse en ajoutant un tensioactif ou un solvant.')}
        {curs('mj-tr', `Traitement du film : ${fr(vie.n * 100, 0)} %`, vie.n, 0, 1, 0.05, ev => setVie(s => ({ ...s, n: parseFloat(ev.target.value) })), '0 : film non traité ; 100 % : traitement corona intense.')}</>}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'zisman' ? { kind, ...M.tirageZisman(), rep: '', verifie: false } : { kind, ...M.tirageDiagnostic(), v: '', rem: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'zisman') { const a = lireNombre(defi.rep); ok = isFinite(a) && Math.abs(a - defi.vrai) <= 0.08 * defi.vrai; noterD(ok); }
    else { ok = defi.v === defi.cas && defi.rem === defi.cas; noterG(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const champ = (id, lab, val, set, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '6px 0', fontSize: 14 }}><label htmlFor={id}>{lab}</label>
      <input id={id} value={val} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('mj-verif')?.click()} onChange={ev => set(ev.target.value)} style={{ width: 100, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, fontSize: 15 }}/><span>{unite}</span></div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['zisman', 'Tension critique'], ['diagnostic', 'Diagnostiquer']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.kind === 'zisman' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : tension critique d’un film</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Un film de <strong>{defi.s.nom}</strong> est testé avec plusieurs liquides. Les angles de contact sont mesurés au degré près. Déterminez la tension critique γ<sub>c</sub> du film par la méthode de Zisman (tolérance 8 %, 2 chiffres significatifs).</div>
        <ul style={liste}>{defi.pts.map(p => <li key={p.id}>{p.nom} (γ = {fr(p.g, 1)} mN/m) : θ = {p.theta} °</li>)}</ul>
        {champ('mj-r', 'γc :', defi.rep, v => setDefi(d => ({ ...d, rep: v, verifie: false })), 'mN/m')}
        <IndiceDefi cache={false}>Calculez cos θ pour chaque liquide ; choisissez deux points éloignés ; pente a = (c₂ − c₁) ÷ (γ₂ − γ₁) ; puis γc = γ₁ + (1 − c₁) ÷ a (valeur de γ pour cos θ = 1).</IndiceDefi>
      </>}
      {defi.kind === 'diagnostic' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : une encre qui ne mouille pas</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Une encre est déposée sur un film de {defi.s.nom}. Pour ce polymère, la tension critique d’un film propre et non traité est de {fr(defi.gcRef, 1)} mN/m ; un traitement corona amène un film à 38 à 44 mN/m au mieux. Voici les mesures faites sur le film.</div>
        <ul style={liste}><li>Tension superficielle de l’encre : {defi.gInk} mN/m</li><li>Tension critique mesurée sur le film : {fr(defi.gcMes, 1)} mN/m</li><li>Angle de contact de l’encre : {defi.th} °</li></ul>
        <div style={{ margin: '8px 0 4px' }}><SvgGoutte th={defi.th} solideNom="film" liquideNom="encre" liquideCouleur="#fde68a"/></div>
        <label htmlFor="mj-v" style={{ ...libelle, marginTop: 8 }}>Ce qui ne va pas</label>
        <select id="mj-v" value={defi.v} onChange={ev => setDefi(d => ({ ...d, v: ev.target.value, verifie: false }))} style={{ ...selectStyle, marginBottom: 8 }}>
          <option value="">Choisir…</option>{M.CAS.map(k => <option key={k} value={k}>{M.CAUSES[k]}</option>)}</select>
        <label htmlFor="mj-rem" style={libelle}>Correction à apporter</label>
        <select id="mj-rem" value={defi.rem} onChange={ev => setDefi(d => ({ ...d, rem: ev.target.value, verifie: false }))} style={selectStyle}>
          <option value="">Choisir…</option>{M.CAS.map(k => <option key={k} value={k}>{M.REMEDES[k]}</option>)}</select>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Comparez la tension critique mesurée à celle du film propre non traité, puis à la tension superficielle de l’encre. Une valeur mesurée bien inférieure à la valeur attendue signale une surface contaminée. Si elle est égale à la valeur attendue et que l’encre est usuelle (environ 35 mN/m), il faut traiter le film. Si le film est déjà traité et que l’encre reste bien au-dessus, il faut modifier l’encre.</IndiceDefi></div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="mj-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'zisman' && <>Droite de Zisman prolongée jusqu’à cos θ = 1 : γ<sub>c</sub> ≈ {fr(defi.vrai, 1)} mN/m.</>}
        {defi.kind === 'diagnostic' && <>{M.CAUSES[defi.cas]} : {M.REMEDES[defi.cas]}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const majEx = f => setEx(x => ({ ...x, ...f }));
  const sEx = M.solide(ex.s), gcEx = M.gcTraite(sEx, ex.n);
  const gEx = ex.l === 'perso' ? ex.gPerso : M.liquide(ex.l).g, nomEx = ex.l === 'perso' ? 'eau + tensioactif' : M.liquide(ex.l).nom;
  const thEx = M.theta(sEx, gEx, gcEx), cosEx = M.cosTheta(sEx, gEx, gcEx), WEx = M.travailAdhesion(sEx, gEx, gcEx), SEx = M.coefEtalement(sEx, gEx, gcEx);
  const ptsEx = M.pointsZisman(sEx, undefined, gcEx), droiteEx = M.droiteZisman(ptsEx);
  const regimeEx = M.regime(thEx);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {selecteur('mj-xs', 'Solide (film)', ex.s, ev => majEx({ s: ev.target.value }), M.SOLIDES)}
      {selecteur('mj-xl', 'Liquide', ex.l, ev => majEx({ l: ev.target.value }), [...M.LIQUIDES, { id: 'perso', nom: 'eau + tensioactif (tension réglable)' }])}
      {ex.l === 'perso' && curs('mj-xg', `Tension superficielle : ${fr(ex.gPerso, 1)} mN/m`, ex.gPerso, 35, 72.8, 0.5, ev => majEx({ gPerso: parseFloat(ev.target.value) }), 'Un tensioactif abaisse la tension superficielle de l’eau (valeurs illustratives).')}
      <Section titre={`Traitement du film : ${fr(ex.n * 100, 0)} %`} ouvert={!!ouv.trait} onBascule={() => bascule('trait')}>
        {curs('mj-xn', `Traitement corona ou plasma : ${fr(ex.n * 100, 0)} %`, ex.n, 0, 1, 0.05, ev => majEx({ n: parseFloat(ev.target.value) }), 'Il augmente l’énergie de surface du film jusqu’à environ 42 mN/m (un film déjà au-dessus n’est pas modifié).')}
      </Section>
    </div>);
  const scenes = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>La goutte et le tracé de Zisman</div>
      <SvgGoutte th={thEx} solideNom={sEx.court} liquideNom={nomEx}/>
      <div style={{ height: 6 }}/>
      <SvgZisman pts={ptsEx} droite={droiteEx} gc={droiteEx ? droiteEx.gc : null} nomSolide={sEx.court}/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Les sept liquides sont placés sur le tracé (point creux : étalement total). La droite est ajustée sur les liquides qui ne s’étalent pas.</div>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Tension superficielle du liquide γ" valeur={`${fr(gEx, 1)} mN/m`} couleur={COL.violet}/>
      <LigneMesure nom="Tension critique du film γc" valeur={`${fr(gcEx, 1)} mN/m`} couleur={COL.bleu}/>
      <LigneMesure nom="Angle de contact θ" valeur={`${fr(thEx, 0)} °`} couleur={COL.orange}/>
      <LigneMesure nom="Situation" valeur={regimeEx === 'total' ? 'mouillage total' : regimeEx === 'partiel' ? 'mouillage partiel (mouille)' : 'mouille mal'} couleur={regimeEx === 'faible' ? COL.rouge : COL.vert}/>
      <LigneMesure nom="Travail d’adhésion W = γ (1 + cos θ)" valeur={`${fr(WEx, 1)} mJ/m²`}/>
      <LigneMesure nom="Coefficient d’étalement S = γ (cos θ − 1)" valeur={`${fr(SEx, 1)} mJ/m²`}/>
      <LigneMesure nom="Droite de Zisman : γc extrapolée" valeur={droiteEx ? `${fr(droiteEx.gc, 1)} mN/m` : 'pas assez de points'}/>
      <LigneMesure nom={`Marge γc − γ (7 à 10 mN/m recommandés pour imprimer)`} valeur={`${fr(gcEx - gEx, 1)} mN/m`}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.45 }}>cos θ = {fr(cosEx, 2)}. Pour S &gt; 0 le liquide s’étale complètement : cos θ calculé dépasserait 1.</div>
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Eau sur PTFE, puis sur PA 6,6 : comment l’angle évolue-t-il avec la tension critique du solide ?</li>
      <li>Sur le PE, ajoutez un tensioactif à l’eau : à partir de quelle tension superficielle l’angle devient-il inférieur à 90° ?</li>
      <li>PE non traité, éthanol, puis eau : repérez dans le tracé de Zisman les points creux.</li>
      <li>Traitez le PE à 100 % : l’encre à 38 mN/m (« eau + tensioactif ») s’étale-t-elle ? Quelle marge garde-t-on ?</li>
      <li>Comparez le tracé de Zisman du PET et du polystyrène : quelle droite est la plus inclinée ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Tension superficielle γ : mesurée par la lame de Wilhelmy (F = γ × p), en mN/m ; elle vient des attractions entre molécules</li>
        <li>Angle de contact θ : 0 = mouillage total ; moins de 90° : le liquide mouille (mouillage partiel) ; plus de 90° : il mouille mal</li>
        <li>Young : γSV = γSL + γLV cos θ ; Young-Dupré : W = γLV (1 + cos θ)</li>
        <li>Tension critique γc (Zisman) : on prolonge la droite cos θ = f(γ) jusqu’à cos θ = 1 ; un liquide de γ inférieure à γc s’étale</li>
        <li>Améliorer le mouillage : abaisser γ du liquide (tensioactif) ou augmenter γc du solide (corona, plasma, dégraissage)</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle qualitatif</strong> : pour chaque solide, cos θ varie linéairement avec la tension superficielle du liquide (droite de Zisman), avec cos θ = 1 pour γ = γc. La pente est ajustée pour retrouver l’angle de l’eau publié sur ce solide. Les angles des liquides autres que l’eau sont donc des valeurs indicatives, pas des mesures. En réalité l’eau, liquide très polaire, ne s’aligne pas toujours avec les liquides apolaires ; la tension critique dépend de la famille de liquides sondes.</li>
      <li><strong>Surface idéale</strong> : plane, lisse, propre, homogène, sans hystérésis (un seul angle d’équilibre). La rugosité, les impuretés et la direction du mouvement du liquide (angles d’avancée et de reculée) changent l’angle mesuré. La gravité est négligée (petite goutte).</li>
      <li><strong>Tensions superficielles</strong> (20 à 25 °C) : eau 72,8 mN/m ; éthanol 22,3 ; toluène 28,5 ; diéthylène glycol 30,1 ; carbonate de propylène 41,1 ; DMSO 43,5 ; éthylène glycol 47,3 (à 25 °C) ; elles baissent avec la température (sources : Wikipedia « Surface-tension values », AUS-e-TUTE, HyperPhysics).</li>
      <li><strong>Tensions critiques et angles de l’eau</strong> : PTFE 19,4 mN/m et 109° ; PP 30,5 et 102° ; PE 31,6 et 96° ; PS 34 et 87° ; PET 39 et 72° ; PA 6,6 42,2 et 68° (table « Critical Surface Tension and Contact Angle with Water for Various Polymers », Diversified Enterprises). Les valeurs varient selon les échantillons et la méthode ; une énergie de surface de solide ne se mesure pas directement, elle se déduit d’angles de contact.</li>
      <li><strong>Lame de Wilhelmy</strong> : lame de platine parfaitement mouillée (θ = 0), force corrigée de la poussée d’Archimède ; dimensions de la lame choisies pour l’exercice (l = 20,0 mm, e = 0,2 mm).</li>
      <li><strong>Young-Dupré</strong> : W = γ<sub>LV</sub> (1 + cos θ) est le travail d’adhésion ; le coefficient d’étalement S = γ<sub>SV</sub> − γ<sub>SL</sub> − γ<sub>LV</sub> vaut γ<sub>LV</sub> (cos θ − 1). Le liquide s’étale complètement si S ≥ 0. La simulation donne S par prolongement de la droite, même au-delà de cos θ = 1.</li>
      <li><strong>Encre et traitement de surface</strong> : la tension de l’encre (38 mN/m) est une valeur illustrative. Un traitement corona amène un film de polyoléfine à 38 à 44 mN/m selon la puissance, et son effet s’atténue en deux à six semaines (brevets sur l’impression des films polyoléfines). On recommande pour imprimer une énergie de surface du film supérieure de 7 à 10 mN/m à la tension de l’encre. Dans la simulation le traitement est limité à 42 mN/m.</li>
      <li><strong>Hors modèle</strong> : mouillage dynamique (vitesse d’étalement), pénétration dans les pores, rugosité (modèles de Wenzel et de Cassie), traitement par dégraissage ou phosphatation (non chiffré), adhérence de l’encre après séchage.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{['wilhelmy', 'young', 'zisman-trace', 'zisman-num'].includes(sc) ? 'Données' : 'Mesures'}</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mj-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mj-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mj-col { display: flex; flex-direction: column; gap: 12px; }
        .mj-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .mj-l1.cote .mj-carte { order: 2; } .mj-l1.cote .mj-main { order: 1; }
          .mj-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .mj-ex > * { grid-column: 1; }
          .mj-ex > .mj-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .mj-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .mj-in { animation: mj-fondu 0.35s ease-out; } @keyframes mj-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .mj-l1 *, .mj-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mouillage : tension superficielle, angle de contact, tension critique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Pour qu’une encre s’étale sur un film plastique, il faut qu’elle le <strong>mouille</strong>. On caractérise le mouillage par l’<strong>angle de contact</strong> d’une goutte et par la <strong>tension critique</strong> du solide, et on cherche comment l’améliorer.</div>
      {enGuide && <div className="mj-l1 cote">
        <div className="mj-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="mj-main">
          <div className="mj-col">
            {sceneBloc && <div className="mj-in">{sceneBloc}</div>}
            {curseurGuide && <div className="mj-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="mj-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'zisman' ? suiviD : suiviG}/></div>}
      {enExplore && <>
        <div className="mj-ex">
          {scenes}
          <div className="mj-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
