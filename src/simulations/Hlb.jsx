import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./hlbModele";
import { QCM } from "./hlbQcm";
import { SvgEchelle, SvgBalance, SvgStabilite, SvgCarteEchelle, SvgCarteMelange, SvgCarteBilanHlb } from "./HlbSchemas";

const SIM_ID = 223, CLE_GUIDE = 'hlb-guide-v1';
declarerDefis(SIM_ID, [['composition', 'Composer le mélange d’émulsifiants pour une phase huileuse donnée'], ['diagnostic', 'Diagnostiquer un mélange au HLB mal choisi']]);

// ====================================================
//  SIM 223 — HLB REQUIS ET MÉLANGE D'ÉMULSIFIANTS (BTS MDC, Formulation › Tensioactifs et émulsions)
//  Capacité visée (jamais affichée à l'élève) : évaluer la composition d'un mélange d'émulsifiants par la méthode du RHLB.
//  Idées : (1) HLB = lipophile ↔ hydrophile ; (2) RHLB = HLB qui rend l'émulsion d'une huile la plus stable ; (3) RHLB d'une phase huileuse = moyenne pondérée ;
//  (4) HLB d'un mélange d'émulsifiants = moyenne pondérée = point d'équilibre ; (5) proportion pour une cible (croix de Griffin).
//  Modèle : hlbModele.js. Schémas : HlbSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const pc = v => `${fr(v * 100, 0)} %`;
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const SPAN80 = M.emulsifiant('span80'), TWEEN80 = M.emulsifiant('tween80'), SPAN60 = M.emulsifiant('span60'), TWEEN85 = M.emulsifiant('tween85'), TWEEN20 = M.emulsifiant('tween20');
const RHLB_CIBLE = 11;   // parcours : 80 g d'huile minérale + 20 g d'alcool cétylique
const X_CIBLE = M.fractionA(TWEEN80.hlb, SPAN80.hlb, RHLB_CIBLE);
const FORM = (m) => <FormuleEnLigne><mi>HLB</mi><mo>=</mo>{m}</FormuleEnLigne>;
const Frac = ({ h, b }) => <mfrac><mrow>{h}</mrow><mrow>{b}</mrow></mfrac>;
const HLB_MEL = <FormuleEnLigne><msub><mi>HLB</mi><mi mathvariant="normal">mél</mi></msub><mo>=</mo><msub><mi>x</mi><mn>1</mn></msub><msub><mi>HLB</mi><mn>1</mn></msub><mo>+</mo><msub><mi>x</mi><mn>2</mn></msub><msub><mi>HLB</mi><mn>2</mn></msub></FormuleEnLigne>;

export function SimulationHlb() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState({ xA: 0.2, h: 10, sens: 'HE' });                 // scène du parcours
  const [ex, setEx] = useState({ h1: 'minerale', h2: 'cetylique', m1: 80, m2: 20, A: 'tween80', B: 'span80', xA: 0.5, sens: 'HE' });   // exploration
  const [ouv, setOuv] = useState({});
  const [suiviC, noterC] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('composition');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const hMel = M.hlbMelange(TWEEN80.hlb, SPAN80.hlb, vie.xA);
  const rhlbSens = vie.sens === 'HE' ? 10 : 4;   // huile minérale

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'echelle', titre: 'Le HLB : de lipophile à hydrophile', focus: ['scene'],
      texte: <>Un émulsifiant (tensioactif) a une tête qui aime l’eau et une queue qui aime l’huile. Le <strong>HLB</strong> (balance hydrophile-lipophile) est un nombre, de 0 à 20, qui dit laquelle des deux parties domine : <strong>HLB bas</strong> = émulsifiant plutôt <strong>lipophile</strong> (queue dominante), <strong>HLB élevé</strong> = plutôt <strong>hydrophile</strong> (tête dominante). Le Span 80 (monooléate de sorbitane) a un HLB de <strong>4,3</strong>.</>,
      tache: { type: 'qcm', q: 'Que dire du Span 80, de HLB 4,3 ?', ...QCM.echelle,
        expl: 'Un HLB de 4,3 est situé dans le bas de l’échelle : l’émulsifiant est plutôt lipophile, il s’enracine facilement dans l’huile. Un émulsifiant très hydrophile aurait un HLB proche de 15 ou plus.', indice: 'Plus le HLB est bas, plus la partie lipophile (la queue) domine.' } },
    { id: 'sens', titre: 'HLB et sens de l’émulsion', focus: ['scene'],
      texte: <>Un émulsifiant lipophile reste dans l’huile et favorise des gouttes d’eau dans l’huile (<strong>E/H</strong>) ; un émulsifiant hydrophile reste dans l’eau et favorise des gouttes d’huile dans l’eau (<strong>H/E</strong>). Les repères usuels sont portés sur l’échelle : environ 3 à 6 pour une E/H, 8 à 18 pour une H/E. Le Tween 80 (monooléate de sorbitane éthoxylé) a un HLB de <strong>15,0</strong>.</>,
      tache: { type: 'qcm', q: 'On veut une émulsion H/E avec un seul de ces deux émulsifiants. Lequel choisir ?', ...QCM.sens,
        expl: 'Un HLB élevé (15,0) correspond à un émulsifiant hydrophile, qui favorise une phase continue aqueuse : émulsion H/E. Le Span 80 (4,3) conviendrait pour une E/H.', indice: 'Les émulsions H/E se situent entre 8 et 18 sur l’échelle HLB.' } },
    { id: 'rhlb', titre: 'Le HLB requis d’une huile', focus: ['scene', 'curseur'],
      texte: <>Chaque huile se comporte comme si elle « demandait » un HLB précis. On le trouve par essais : on prépare des émulsions d’<strong>huile minérale</strong> avec des émulsifiants de HLB différents, et on cherche celle qui est la plus stable (gouttes les plus fines). Déplacez le curseur du HLB de l’émulsifiant et regardez la stabilité. Le HLB qui donne la meilleure émulsion est le <strong>HLB requis</strong> de l’huile, noté <strong>RHLB</strong>.</>,
      tache: { type: 'qcm', q: 'Le RHLB de l’huile minérale vaut 10 pour une émulsion H/E. Quel émulsifiant seul convient le mieux, parmi les quatre proposés ?', ...QCM.rhlb,
        expl: 'On cherche l’émulsifiant de HLB le plus proche de 10 : le Tween 85 (11,0) est à 1 unité, le Tween 80 (15,0) à 5, le Span 80 (4,3) à 5,7 et le Tween 20 (16,7) à 6,7. Un émulsifiant au HLB très différent du RHLB donne des gouttes grosses et une émulsion instable.', indice: 'Cherchez le HLB le plus proche du RHLB de l’huile, pas le plus élevé.' } },
    { id: 'rhlb-eh', titre: 'Un RHLB pour chaque sens d’émulsion', focus: ['scene', 'sens'],
      retenirTitre: 'À retenir : le HLB', retenir: <>
        <SvgCarteEchelle/>
        <ul style={puces}>
          <li><strong>HLB bas</strong> : lipophile, favorise les émulsions <strong>E/H</strong> ; <strong>HLB haut</strong> : hydrophile, favorise les émulsions <strong>H/E</strong>.</li>
          <li>Le <strong>RHLB</strong> d’une huile est le HLB qui donne l’émulsion la plus stable.</li>
          <li>Moyen de s’en souvenir : <strong>« HLB bas aime le GRAS, HLB haut aime l’EAU ! »</strong></li>
        </ul></>,
      texte: <>Le RHLB dépend aussi du <strong>sens</strong> de l’émulsion voulue. Pour l’huile minérale, on trouve environ 10 pour une H/E et 4 pour une E/H. Les boutons H/E et E/H ci-dessous déplacent la marque du RHLB : regardez où se trouve le maximum de stabilité dans chaque cas.</>,
      tache: { type: 'qcm', q: 'On veut une crème E/H à base d’huile minérale. Quel HLB d’émulsifiant viser ?', ...QCM.rhlbEH,
        expl: 'Pour une E/H d’huile minérale, le RHLB tabulé est d’environ 4 : on utilise un émulsifiant lipophile (comme le Span 80, 4,3). Le RHLB annoncé pour une H/E (10) ne vaut que pour une H/E.', indice: 'Les émulsions E/H se situent dans le bas de l’échelle HLB.' } },
    { id: 'rhlb-huiles', titre: 'RHLB d’une phase huileuse : mélange de deux huiles', focus: ['mesures'],
      texte: <>Une crème contient souvent plusieurs huiles et cires. Le RHLB de la phase huileuse est la <strong>moyenne des RHLB pondérée par les masses</strong>. Données : <strong>80 g</strong> d’huile minérale (RHLB 10) et <strong>20 g</strong> d’alcool cétylique (RHLB 15), pour une émulsion H/E.</>,
      tache: { type: 'num', q: 'RHLB de cette phase huileuse', unite: '', vrai: 11, tol: 0.03, affiche: v => fr(v, 1), cs: 2,
        calcul: () => ['Masse totale de la phase huileuse : 80 + 20 = 100 g ; fractions massiques : 0,80 et 0,20.', 'RHLB = 0,80 × 10 + 0,20 × 15 = 8,0 + 3,0 = 11,0.', 'Le résultat est compris entre 10 et 15 et plus proche de 10, car l’huile minérale domine en masse.'],
        pieges: [[12.5, 'Vous avez fait la moyenne simple (10 + 15) ÷ 2 : il faut pondérer par les masses, l’huile minérale en a quatre fois plus.'], [25, 'Vous avez additionné les RHLB : il faut une moyenne pondérée, pas une somme.'], [13, 'Les fractions massiques sont 0,80 et 0,20 (pas 0,5 et 0,5) : l’huile minérale domine.']],
        expl: 'RHLB = (80 × 10 + 20 × 15) ÷ 100 = 11,0 : on pondère chaque RHLB par la fraction massique de l’huile correspondante.', indice: 'RHLB = Σ (fraction massique × RHLB de chaque huile). Calculez d’abord les fractions massiques.' } },
    { id: 'melange', titre: 'HLB d’un mélange de deux émulsifiants', focus: ['mesures'],
      texte: <>Un seul émulsifiant n’a en général pas le bon HLB, mais on peut en <strong>mélanger deux</strong> : le HLB du mélange est la moyenne des HLB <strong>pondérée par les masses</strong> : {HLB_MEL} où <em>x</em> est la fraction massique de chaque émulsifiant. On mélange <strong>40 %</strong> de Span 80 (HLB 4,3) et <strong>60 %</strong> de Tween 80 (HLB 15,0).</>,
      tache: { type: 'num', q: 'HLB de ce mélange d’émulsifiants', unite: '', vrai: M.hlbMelange(15, 4.3, 0.6), tol: 0.03, affiche: v => fr(v, 1), cs: 2,
        calcul: () => ['HLB = 0,40 × 4,3 + 0,60 × 15,0.', 'HLB = 1,72 + 9,00 = 10,72, soit environ 10,7.', 'Le résultat est compris entre 4,3 et 15,0, plus proche du Tween 80 qui domine en masse.'],
        pieges: [[9.65, 'Vous avez fait la moyenne simple (4,3 + 15) ÷ 2 : il faut pondérer par les fractions massiques 0,40 et 0,60.'], [19.3, 'Vous avez additionné les HLB : le HLB d’un mélange est une moyenne, pas une somme.']],
        expl: 'HLB = 0,40 × 4,3 + 0,60 × 15,0 ≈ 10,7 : le mélange est un peu plus hydrophile que le milieu de l’échelle parce que le Tween 80 domine.', indice: 'HLB du mélange = fraction de Span 80 × 4,3 + fraction de Tween 80 × 15,0.' } },
    { id: 'levier', titre: 'Régler le mélange pour atteindre le RHLB', focus: ['scene', 'curseur'],
      texte: <>La balance montre le mélange : le <strong>point d’équilibre</strong> est le HLB du mélange. La phase huileuse de la crème (80 g d’huile minérale, 20 g d’alcool cétylique) a un RHLB de <strong>11,0</strong> (repère rouge). Avec le curseur, réglez la part de <strong>Tween 80</strong> dans le mélange (le reste est du Span 80) pour amener le point d’équilibre à moins de <strong>0,2</strong> du repère.</>,
      tache: { type: 'action', ok: Math.abs(hMel - RHLB_CIBLE) <= 0.2, consigne: 'Placer le HLB du mélange à moins de 0,2 du RHLB 11,0' } },
    { id: 'croix', titre: 'Calculer la proportion exacte', focus: ['mesures'],
      texte: <>Plutôt que de chercher au curseur, on peut calculer. Si le mélange est fait de Tween 80 (HLB 15,0) et de Span 80 (HLB 4,3) et doit avoir un HLB de <strong>11,0</strong>, la fraction massique <em>x</em> de Tween 80 vérifie <FormuleEnLigne><mn>11,0</mn><mo>=</mo><mi>x</mi><mo>×</mo><mn>15,0</mn><mo>+</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi>x</mi><mo>)</mo><mo>×</mo><mn>4,3</mn></FormuleEnLigne>. (Méthode de la « croix » de Griffin : les parts sont 11,0 − 4,3 pour le Tween 80 et 15,0 − 11,0 pour le Span 80.)</>,
      tache: { type: 'num', q: 'Pourcentage massique de Tween 80 dans le mélange d’émulsifiants', unite: '%', vrai: X_CIBLE * 100, tol: 0.03, affiche: v => fr(v, 1), cs: 2,
        calcul: () => ['11,0 = 4,3 + x × (15,0 − 4,3), donc x = frac(11,0 − 4,3|15,0 − 4,3).', 'x = frac(6,7|10,7) ≈ 0,626.', 'Il faut donc environ 62,6 % de Tween 80 et 37,4 % de Span 80. Vérification : 0,626 × 15,0 + 0,374 × 4,3 ≈ 11,0.'],
        pieges: [[37.4, 'C’est la part du Span 80 : l’énoncé demande celle du Tween 80.'], [50, 'Un mélange moitié-moitié donne 9,65, pas 11,0 : le mélange doit contenir plus de Tween 80.'], [67.0, 'Pensez à diviser par l’écart total 15,0 − 4,3 = 10,7, pas par 10.']],
        expl: 'x = (11,0 − 4,3) ÷ (15,0 − 4,3) = 6,7 ÷ 10,7 ≈ 0,626 : 62,6 % de Tween 80. C’est exactement ce que fait la croix de Griffin : parts de Tween 80 = 6,7 et parts de Span 80 = 4,0.', indice: 'x = frac(RHLB − HLB du Span 80|HLB du Tween 80 − HLB du Span 80).' } },
    { id: 'limite', titre: 'Une cible hors de portée', focus: ['scene'],
      retenirTitre: 'À retenir : mélanger deux émulsifiants', retenir: <>
        <SvgCarteMelange/>
        <ul style={puces}>
          <li>HLB du mélange = <strong>x₁ HLB₁ + x₂ HLB₂</strong> (fractions massiques).</li>
          <li>Pour viser un RHLB : <strong>x₁ = (RHLB − HLB₂) ÷ (HLB₁ − HLB₂)</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« le mélange est le point d’équilibre de la balance »</strong>.</li>
        </ul></>,
      texte: <>La balance ne peut placer son point d’équilibre qu’<strong>entre</strong> les deux HLB. Essayons deux émulsifiants très proches : le Span 80 (HLB 4,3) et le Span 60 (HLB 4,7), pour la même cible de 11,0.</>,
      tache: { type: 'qcm', q: 'Peut-on atteindre un HLB de 11,0 avec ces deux émulsifiants ?', ...QCM.limite,
        expl: 'Le HLB d’un mélange est toujours compris entre les HLB de ses constituants : ici entre 4,3 et 4,7. Pour viser 11,0, il faut deux émulsifiants dont les HLB encadrent 11,0 (par exemple 4,3 et 15,0).', indice: 'Le point d’équilibre d’une balance est toujours entre les deux masses.' } },
    { id: 'masses', titre: 'De la proportion à la pesée', focus: ['mesures'],
      texte: <>On prépare <strong>5,0 g</strong> de mélange d’émulsifiants pour la crème : il faut <strong>62,6 %</strong> de Tween 80 (HLB 15,0) et le reste de Span 80 (HLB 4,3).</>,
      tache: { type: 'num', q: 'Masse de Tween 80 à peser', unite: 'g', vrai: X_CIBLE * 5, tol: 0.03, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['m(Tween 80) = 0,626 × 5,0 g ≈ 3,13 g.', 'm(Span 80) = 5,0 − 3,13 ≈ 1,87 g.', 'Vérification : HLB = (3,13 × 15,0 + 1,87 × 4,3) ÷ 5,0 ≈ 11,0.'],
        pieges: [[1.87, 'C’est la masse de Span 80 : on demande celle du Tween 80.'], [3.0, 'Le pourcentage est 62,6 % (pas 60 %) : 0,626 × 5,0 g ≈ 3,13 g.']],
        expl: 'La masse de Tween 80 est 0,626 × 5,0 g ≈ 3,13 g ; il reste 1,87 g de Span 80. Le mélange pesé a bien un HLB d’environ 11,0.', indice: 'masse = fraction massique × masse totale du mélange d’émulsifiants.' } },
    { id: 'diag', titre: 'Corriger une émulsion mal formulée', focus: ['scene'],
      texte: <>Un technicien prépare la même crème (RHLB de la phase huileuse : <strong>10</strong>) avec un mélange d’émulsifiants de HLB <strong>7</strong>. L’émulsion obtenue est grossière et crème rapidement (voir le schéma).</>,
      tache: { type: 'qcm', q: 'Quelle modification de la formulation est la plus adaptée ?', ...QCM.diag,
        expl: 'Le HLB du mélange (7) est inférieur au RHLB (10) : le mélange est trop lipophile. On le rapproche du RHLB en ajoutant de l’émulsifiant plus hydrophile, ce qui fait monter le HLB du mélange. La masse totale d’émulsifiant ne corrige pas un mauvais HLB.', indice: 'Comparez le HLB du mélange (7) au RHLB (10) : de quel côté faut-il se déplacer ?' } },
    { id: 'limites', titre: 'Les limites de la méthode', focus: [],
      texte: <>La méthode du RHLB est très utilisée parce qu’elle est simple, mais elle repose sur des hypothèses : additivité du HLB (vérifiée surtout pour des émulsifiants non ioniques de même famille), valeurs de RHLB déterminées par essais, quantité d’émulsifiant suffisante. Elle donne un <strong>point de départ</strong> à valider par des essais. Attention aussi aux sources : les valeurs de RHLB trouvées sur internet sont rarement fiables, et le <strong>sens de l’émulsion</strong> pour lequel un RHLB a été déterminé est presque toujours omis.</>,
      tache: { type: 'qcm', q: 'Pourquoi les valeurs de RHLB des tables sont-elles à prendre comme des ordres de grandeur ?', ...QCM.limites,
        expl: 'Les RHLB sont obtenus par des essais (on cherche l’émulsion la plus stable) : ils dépendent de la méthode, de la pureté de l’huile et du sens de l’émulsion, et varient d’environ une unité d’une table à l’autre. Les sources en ligne sont peu fiables et précisent rarement le sens de l’émulsion. La méthode sert donc à choisir un point de départ à confirmer expérimentalement.', indice: 'Comment a-t-on trouvé le RHLB d’une huile ?' } },
    { id: 'bilan', titre: 'Le bilan : la méthode du RHLB', focus: [],
      retenirTitre: 'À retenir : la méthode du RHLB', retenir: <>
        <SvgCarteBilanHlb/>
        <ul style={puces}>
          <li>Les trois temps : <strong>RHLB de la phase huileuse</strong>, <strong>deux émulsifiants qui l’encadrent</strong>, <strong>proportion de chacun</strong>.</li>
          <li>RHLB et HLB sont des <strong>moyennes pondérées par les masses</strong> : ne jamais faire une moyenne simple.</li>
        </ul></>,
      texte: <>Vous savez situer un émulsifiant sur l’échelle HLB, calculer le RHLB d’une phase huileuse, choisir deux émulsifiants qui l’encadrent et calculer leur proportion et leurs masses. En exploration, vous pouvez composer vos propres phases huileuses ; les défis proposent des formulations à composer et des mélanges à corriger.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(s => ({ ...s, xA: ['levier'].includes(IDS[ni]) ? 0.2 : s.xA, sens: ni <= IDS.indexOf('rhlb-eh') ? 'HE' : s.sens }));
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sceneGuide = {
    echelle: () => <SvgEchelle marques={[SPAN80]}/>,
    sens: () => <SvgEchelle marques={[SPAN80, TWEEN80]}/>,
    rhlb: () => <SvgStabilite hlb={vie.h} rhlb={10}/>,
    'rhlb-eh': () => <SvgStabilite hlb={vie.h} rhlb={rhlbSens}/>,
    levier: () => <SvgBalance A={TWEEN80} B={SPAN80} xA={vie.xA} cible={RHLB_CIBLE}/>,
    croix: () => <SvgBalance A={TWEEN80} B={SPAN80} xA={vie.xA} cible={RHLB_CIBLE}/>,
    limite: () => <SvgEchelle marques={[SPAN80, SPAN60]} rhlb={RHLB_CIBLE}/>,
    diag: () => <SvgStabilite hlb={7} rhlb={10}/>,
  }[idE]?.() ?? null;
  const MES_GUIDE = {
    'rhlb-huiles': [['Huile minérale', '80 g · RHLB 10'], ['Alcool cétylique', '20 g · RHLB 15'], ['Sens de l’émulsion', 'H/E']],
    melange: [['Span 80', '40 % · HLB 4,3'], ['Tween 80', '60 % · HLB 15,0']],
    levier: [['RHLB visé', fr(RHLB_CIBLE, 1)], ['HLB du mélange', fr(hMel, 1)], ['Part de Tween 80', pc(vie.xA)]],
    croix: [['HLB visé (RHLB)', '11,0'], ['Tween 80', 'HLB 15,0'], ['Span 80', 'HLB 4,3']],
    masses: [['Masse du mélange', '5,0 g'], ['Part de Tween 80', '62,6 %'], ['Span 80', 'le reste']],
  };
  const lignesGuide = enGuide ? (MES_GUIDE[idE] ?? []) : [];
  const curseurGuide = enGuide && (idE === 'rhlb' || idE === 'rhlb-eh') ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      <label htmlFor="hl-h" style={libelle}>HLB de l’émulsifiant : {fr(vie.h, 1)}</label>
      <input id="hl-h" type="range" min="0" max="20" step="0.5" value={vie.h} onChange={ev => setVie(s => ({ ...s, h: parseFloat(ev.target.value) }))} aria-label="HLB de l’émulsifiant" style={{ width: '100%', accentColor: '#7c3aed' }}/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>Le point vert se place sur la courbe de stabilité de l’émulsion d’huile minérale.</div>
      {idE === 'rhlb-eh' && <div style={{ display: 'flex', gap: 6, marginTop: 8, ...cadre('sens') }}>
        {[['HE', 'Émulsion H/E'], ['EH', 'Émulsion E/H']].map(([k, l]) => <button key={k} onClick={() => setVie(s => ({ ...s, sens: k }))} aria-pressed={vie.sens === k} style={stylePetitBouton(vie.sens === k, '#7c3aed')}>{l}</button>)}</div>}
    </div>) : (enGuide && (idE === 'levier' || idE === 'croix') ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      <label htmlFor="hl-x" style={libelle}>Part de Tween 80 dans le mélange : {pc(vie.xA)}</label>
      <input id="hl-x" type="range" min="0" max="1" step="0.01" value={vie.xA} onChange={ev => setVie(s => ({ ...s, xA: parseFloat(ev.target.value) }))} aria-label="Part de Tween 80" style={{ width: '100%', accentColor: '#7c3aed' }}/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>Le reste du mélange est du Span 80 : le point d’équilibre se déplace.</div>
    </div>) : null);

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'composition' ? { kind, ...M.tirageComposition(), rep1: '', rep2: '', verifie: false } : { kind, ...M.tirageDiagnosticHLB(), v: '', rem: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'composition') {
      const a = lireNombre(defi.rep1), b = lireNombre(defi.rep2), tolM = 0.05 * defi.mA + 0.03 * defi.mEmul;
      ok = isFinite(a) && isFinite(b) && Math.abs(a - defi.rhlb) <= 0.1 && Math.abs(b - defi.mA) <= tolM; noterC(ok);
    } else { ok = defi.v === defi.verdict && defi.rem === defi.verdict; noterD(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const champ = (id, lab, val, set, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '6px 0', fontSize: 14 }}><label htmlFor={id}>{lab}</label>
      <input id={id} value={val} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('hl-verif')?.click()} onChange={ev => set(ev.target.value)} style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/><span>{unite}</span></div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['composition', 'Composer le mélange'], ['diagnostic', 'Corriger un mélange']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.kind === 'composition' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : composer le mélange d’émulsifiants</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Une émulsion H/E a pour phase huileuse <strong>{defi.m1} g de {defi.h1.nom}</strong> (RHLB {fr(defi.h1.rhlb)}) et <strong>{defi.m2} g de {defi.h2.nom}</strong> (RHLB {fr(defi.h2.rhlb)}). On dispose de <strong>{defi.A.court}</strong> (HLB {fr(defi.A.hlb)}) et de <strong>{defi.B.court}</strong> (HLB {fr(defi.B.hlb)}), dont on prépare <strong>{defi.mEmul} g</strong> de mélange. Calculez le RHLB de la phase huileuse (arrondi à 0,1 près), puis la masse de {defi.A.court} à peser.</div>
        {champ('hl-r1', 'RHLB de la phase huileuse :', defi.rep1, v => setDefi(d => ({ ...d, rep1: v, verifie: false })), '')}
        {champ('hl-r2', `Masse de ${defi.A.court} :`, defi.rep2, v => setDefi(d => ({ ...d, rep2: v, verifie: false })), 'g')}
        <IndiceDefi cache={false}>1) RHLB = (m₁ × RHLB₁ + m₂ × RHLB₂) ÷ (m₁ + m₂). 2) Fraction de {defi.A.court} : x = (RHLB − HLB de {defi.B.court}) ÷ (HLB de {defi.A.court} − HLB de {defi.B.court}) ; puis masse = x × {defi.mEmul} g. Tolérance : 0,1 sur le RHLB, environ 5 % sur la masse.</IndiceDefi>
      </>}
      {defi.kind === 'diagnostic' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : corriger un mélange d’émulsifiants</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Une émulsion H/E de <strong>{defi.huile.nom}</strong> (RHLB {fr(defi.rhlb)}) est préparée avec un mélange d’émulsifiants de HLB <strong>{fr(defi.hlb)}</strong>. L’émulsion obtenue est grossière et instable.</div>
        <label htmlFor="hl-v" style={libelle}>Le mélange est…</label>
        <select id="hl-v" value={defi.v} onChange={ev => setDefi(d => ({ ...d, v: ev.target.value, verifie: false }))} style={{ ...selectStyle, marginBottom: 8 }}>
          <option value="">Choisir…</option><option value="trop-lipophile">trop lipophile (HLB trop faible)</option><option value="trop-hydrophile">trop hydrophile (HLB trop élevé)</option><option value="adapte">adapté</option></select>
        <label htmlFor="hl-rem" style={libelle}>Correction à apporter</label>
        <select id="hl-rem" value={defi.rem} onChange={ev => setDefi(d => ({ ...d, rem: ev.target.value, verifie: false }))} style={selectStyle}>
          <option value="">Choisir…</option>{['trop-lipophile', 'trop-hydrophile', 'adapte'].map(k => <option key={k} value={k}>{M.REMEDE_HLB[k]}</option>)}</select>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Comparez le HLB du mélange au RHLB de l’huile : s’il est plus faible, le mélange est trop lipophile ; plus élevé, trop hydrophile. On corrige en rapprochant le HLB du RHLB.</IndiceDefi></div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="hl-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'composition' && <>RHLB = ({defi.m1} × {fr(defi.h1.rhlb)} + {defi.m2} × {fr(defi.h2.rhlb)}) ÷ {defi.m1 + defi.m2} ≈ {fr(defi.rhlb)} ; x({defi.A.court}) = ({fr(defi.rhlb)} − {fr(defi.B.hlb)}) ÷ ({fr(defi.A.hlb)} − {fr(defi.B.hlb)}) ≈ {fr(defi.x, 3)} ; masse = {fr(defi.mA, 2)} g de {defi.A.court} et {fr(defi.mB, 2)} g de {defi.B.court}.</>}
        {defi.kind === 'diagnostic' && <>Le HLB du mélange ({fr(defi.hlb)}) est {defi.verdict === 'trop-lipophile' ? 'inférieur' : 'supérieur'} au RHLB ({fr(defi.rhlb)}) : {M.REMEDE_HLB[defi.verdict]}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const HEx = ex.sens === 'HE';
  const huilesDispo = HEx ? M.HUILES : M.HUILES.filter(h => h.rhlbEH != null);
  const rh = id => { const h = M.huile(id); return (HEx ? h?.rhlb : h?.rhlbEH) ?? M.huile(id)?.rhlb; };
  const h1 = huilesDispo.some(h => h.id === ex.h1) ? ex.h1 : huilesDispo[0].id, h2 = huilesDispo.some(h => h.id === ex.h2) ? ex.h2 : huilesDispo[1].id;
  const A = M.emulsifiant(ex.A), B = M.emulsifiant(ex.B);
  const rhlbEx = M.rhlbMelange([{ rhlb: rh(h1), m: ex.m1 }, { rhlb: rh(h2), m: ex.m2 }]);
  const hEx = M.hlbMelange(A.hlb, B.hlb, ex.xA), xIdeal = M.fractionA(A.hlb, B.hlb, rhlbEx);
  const majEx = f => setEx(x => ({ ...x, ...f }));
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="hl-sens" style={libelle}>Sens de l’émulsion</label>
      <select id="hl-sens" value={ex.sens} onChange={ev => majEx({ sens: ev.target.value })} style={selectStyle}><option value="HE">H/E : huile dans eau</option><option value="EH">E/H : eau dans huile (huiles tabulées seulement)</option></select>
      <Section titre={`Phase huileuse : ${M.huile(h1).nom} ${ex.m1} g + ${M.huile(h2).nom} ${ex.m2} g`} ouvert={!!ouv.huiles} onBascule={() => bascule('huiles')}>
        {[[1, h1, ex.m1], [2, h2, ex.m2]].map(([k, hid, m]) => <div key={k} style={{ marginBottom: 8 }}>
          <label htmlFor={`hl-h${k}`} style={libelle}>Huile {k} (RHLB {fr(rh(hid))})</label>
          <select id={`hl-h${k}`} value={hid} onChange={ev => majEx({ [`h${k}`]: ev.target.value })} style={selectStyle}>{huilesDispo.map(h => <option key={h.id} value={h.id}>{h.nom}</option>)}</select>
          <label htmlFor={`hl-m${k}`} style={{ ...libelle, marginTop: 6 }}>Masse : {m} g</label>
          <input id={`hl-m${k}`} type="range" min="0" max="100" step="5" value={m} onChange={ev => majEx({ [`m${k}`]: parseFloat(ev.target.value) })} aria-label={`Masse de l’huile ${k}`} style={{ width: '100%', accentColor: '#7c3aed' }}/>
        </div>)}
      </Section>
      <Section titre={`Émulsifiants : ${A.court} (${fr(A.hlb)}) et ${B.court} (${fr(B.hlb)})`} ouvert={!!ouv.emul} onBascule={() => bascule('emul')}>
        {[['A', ex.A], ['B', ex.B]].map(([k, id]) => <div key={k} style={{ marginBottom: 8 }}>
          <label htmlFor={`hl-e${k}`} style={libelle}>Émulsifiant {k}</label>
          <select id={`hl-e${k}`} value={id} onChange={ev => majEx({ [k]: ev.target.value })} style={selectStyle}>{M.EMULSIFIANTS.map(e => <option key={e.id} value={e.id}>{e.court} · HLB {fr(e.hlb)}</option>)}</select></div>)}
      </Section>
      <label htmlFor="hl-xe" style={{ ...libelle, marginTop: 8 }}>Part de {A.court} dans le mélange d’émulsifiants : {pc(ex.xA)}</label>
      <input id="hl-xe" type="range" min="0" max="1" step="0.01" value={ex.xA} onChange={ev => majEx({ xA: parseFloat(ev.target.value) })} aria-label={`Part de ${A.court}`} style={{ width: '100%', accentColor: '#7c3aed' }}/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>Le reste est du {B.court}. Le point d’équilibre de la balance est le HLB du mélange.</div>
      {xIdeal != null && <button onClick={() => majEx({ xA: Math.round(xIdeal * 100) / 100 })} style={{ ...stylePetitBouton(true, '#15803d'), marginTop: 8 }}>Placer au RHLB ({pc(xIdeal)} de {A.court})</button>}
    </div>);
  const scenes = (
    <div style={styleBoite}>
      {enExplore && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Du mélange d’émulsifiants à l’émulsion</div>}
      <SvgBalance A={A} B={B} xA={ex.xA} cible={rhlbEx}/>
      <div style={{ height: 8 }}/>
      <SvgStabilite hlb={hEx} rhlb={rhlbEx}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="RHLB de la phase huileuse" valeur={fr(rhlbEx, 1)} couleur={COL.rouge}/>
      <LigneMesure nom="HLB du mélange" valeur={fr(hEx, 1)} couleur={COL.vert}/>
      <LigneMesure nom="Écart HLB − RHLB" valeur={fr(hEx - rhlbEx, 1)}/>
      <LigneMesure nom={`Proportion de ${A.court} pour viser le RHLB`} valeur={xIdeal == null ? 'impossible (RHLB hors de l’intervalle)' : pc(xIdeal)}/>
      <LigneMesure nom="Type d’émulsion favorisé par le mélange" valeur={M.typeEmulsion(hEx)}/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Le HLB du mélange est toujours compris entre ceux des deux émulsifiants.</div>
    </div>);
  const sectionTableaux = enExplore && (
    <Section titre="Valeurs usuelles : émulsifiants et RHLB des huiles" ouvert={!!ouv.tab} onBascule={() => bascule('tab')}>
      <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Émulsifiants (HLB)</div>
      <ul style={liste}>{M.EMULSIFIANTS.map(e => <li key={e.id}>{e.nom} : {fr(e.hlb)}</li>)}</ul>
      <div style={{ fontSize: 13.5, fontWeight: 700, margin: '8px 0 4px' }}>Huiles (RHLB pour une émulsion H/E)</div>
      <ul style={liste}>{M.HUILES.map(h => <li key={h.id}>{h.nom} : {fr(h.rhlb)}{h.rhlbEH ? ` (E/H : ${fr(h.rhlbEH)})` : ''}</li>)}</ul>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Valeurs usuelles de la littérature : elles varient d’environ une unité selon les sources.</div>
    </Section>);
  const aEssayer = (
    <ul style={liste}>
      <li>Phase huileuse : 100 g d’huile végétale seule, puis 50 g d’huile végétale et 50 g d’alcool cétylique : comment évolue le RHLB ?</li>
      <li>Avec Span 80 et Tween 80, cliquez sur « Placer au RHLB » : le point d’équilibre arrive-t-il sur le repère rouge ? Comment évolue la taille des gouttes ?</li>
      <li>Remplacez Tween 80 par Span 60 : que dit la mesure « proportion pour viser le RHLB » ? Pourquoi ?</li>
      <li>Passez en émulsion E/H avec l’huile minérale : quel RHLB, quel couple d’émulsifiants faut-il choisir ?</li>
      <li>Mettez 100 g d’huile 1 et 0 g d’huile 2 : le RHLB de la phase est-il celui de l’huile 1 ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>HLB bas : émulsifiant lipophile, émulsion E/H ; HLB haut : hydrophile, émulsion H/E</li>
        <li>RHLB d’une huile : HLB qui donne l’émulsion la plus stable (dépend du sens)</li>
        <li>RHLB d’une phase huileuse et HLB d’un mélange : moyennes pondérées par les masses</li>
        <li>Proportion pour viser un RHLB : x₁ = (RHLB − HLB₂) ÷ (HLB₁ − HLB₂)</li>
        <li>Les deux émulsifiants doivent encadrer le RHLB</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Additivité du HLB</strong> : la moyenne pondérée par les masses est une règle empirique (Griffin), bien vérifiée pour des émulsifiants non ioniques de même famille chimique (ici esters de sorbitane et leurs dérivés éthoxylés). Elle est moins fiable avec des émulsifiants ioniques ou de familles très différentes.</li>
      <li><strong>Valeurs tabulées</strong> : les HLB et les RHLB sont des valeurs usuelles de la littérature (déterminées par essais) ; elles varient d’environ une unité selon les sources et les conditions. Il est difficile de trouver des sources fiables en ligne, et le sens de l’émulsion associé à un RHLB n’est presque jamais précisé. Le RHLB dépend du sens de l’émulsion ; il n’est tabulé ici en E/H que pour l’huile minérale et la lanoline.</li>
      <li><strong>Stabilité et taille des gouttes</strong> : la courbe en cloche (maximum quand HLB = RHLB, largeur de l’ordre de 2 unités) et le rayon des gouttes sont des représentations <strong>qualitatives</strong>, pas des mesures.</li>
      <li><strong>Quantité d’émulsifiant</strong> : elle est supposée suffisante pour couvrir l’interface (de l’ordre de 5 à 10 % de la phase huileuse) ; le HLB choisit le <em>type</em> d’émulsifiant, pas la quantité. La température (inversion de phase), les huiles polaires et les cires peuvent faire dévier la méthode : elle donne un point de départ à valider par des essais.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Données</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .hl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .hl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .hl-col { display: flex; flex-direction: column; gap: 12px; }
        .hl-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .hl-l1.cote .hl-carte { order: 2; } .hl-l1.cote .hl-main { order: 1; }
          .hl-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .hl-ex > * { grid-column: 1; }
          .hl-ex > .hl-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .hl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .hl-in { animation: hl-fondu 0.35s ease-out; } @keyframes hl-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .hl-l1 *, .hl-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>HLB requis et mélange d’émulsifiants</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le <strong>HLB</strong> dit si un émulsifiant est lipophile ou hydrophile ; chaque huile demande un <strong>HLB requis (RHLB)</strong>. En <strong>mélangeant deux émulsifiants</strong>, on règle le HLB du mélange sur le RHLB de la phase huileuse.</div>
      {enGuide && <div className="hl-l1 cote">
        <div className="hl-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="hl-main">
          <div className="hl-col">
            {sceneBloc && <div className="hl-in">{sceneBloc}</div>}
            {curseurGuide && <div className="hl-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="hl-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'composition' ? suiviC : suiviD}/></div>}
      {enExplore && <>
        <div className="hl-ex">
          {scenes}
          <div className="hl-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        {sectionTableaux}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
