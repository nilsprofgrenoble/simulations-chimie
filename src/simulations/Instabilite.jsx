import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./instabiliteModele";
import { QCM } from "./instabiliteQcm";
import { SvgAire, SvgCremage, SvgVieillissement, SvgCarteStokes, SvgCarteFlocCoal, SvgCarteOstwald, SvgCarteBilan } from "./InstabiliteSchemas";

const SIM_ID = 222, CLE_GUIDE = 'instabilites-guide-v1';
declarerDefis(SIM_ID, [['stokes', 'Calculer la durée de montée de la crème avec la loi de Stokes'], ['diagnostic', 'Diagnostiquer une instabilité et choisir le remède']]);

// ====================================================
//  SIM 222 — INSTABILITÉS DES ÉMULSIONS (BTS MDC, Formulation › Tensioactifs et émulsions)
//  Quatre phénomènes qui font vieillir une émulsion : crémage (ou sédimentation), floculation, coalescence, mûrissement d'Ostwald.
//  Idées : (1) une émulsion n'est pas à l'équilibre (aire d'interface) ; (2) le crémage suit Stokes ; (3) floculation = réversible, coalescence = irréversible ;
//  (4) Ostwald : transfert d'huile des petites vers les grosses gouttes, sans contact (hors référentiel, annoncé) ; (5) chaque phénomène a son remède.
//  Capacités visées (jamais affichées à l'élève) : identifier les instabilités d'une émulsion et les relier à la formulation.
//  Modèle : instabiliteModele.js. Schémas et animations : InstabiliteSchemas.jsx.
// ====================================================

const COL = { bleu: '#1d4ed8', vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const POP = M.population(40, 11), N0 = POP.length, R0 = M.rayonMoyen(POP), HIST0 = M.histogramme(POP);
const RHO_H = 920, TMAX = { floculation: 30, coalescence: 30, ostwald: 60 };
const vCm = v => v * 1e4 / 86400;   // cm/jour -> µm/s
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const INIT = { phen: 'cremage', t: 0, rep: 0.2, cov: 0.3, S: 2, fIns: 0, rUm: 2.4, eta: 2, hCm: 10, type: 'H/E', rhoH: RHO_H, jouee: false };

// Calculs communs : tube (crémage) ou champ du microscope
function calculs(s) {
  if (s.phen === 'cremage') {
    const k = s.rUm / R0, pop = POP.map(d => ({ ...d, r: d.r * k })), drho = M.deltaRho(s.type, s.rhoH);
    const C = M.cremage(pop, s.hCm, drho, s.eta), tf = C.gouttes.map(g => g.ta).filter(Number.isFinite);
    const tmax = tf.length ? Math.min(60, Math.max(1, 1.1 * Math.max(...tf))) : 10;
    return { C, drho, tmax };
  }
  if (s.phen === 'floculation') { const E = M.evenements(POP, M.kFloc(s.rep), 'floculation'); return { etat: M.etatFloculation(E, s.t), tmax: TMAX.floculation }; }
  if (s.phen === 'coalescence') { const E = M.evenements(POP, M.kCoal(s.cov), 'coalescence'); return { etat: M.etatCoalescence(E, s.t), tmax: TMAX.coalescence }; }
  const traj = M.trajOstwald(POP, M.aEffectif(s.S, s.fIns), TMAX.ostwald);
  return { etat: M.etatOstwald(POP, traj, s.t), tmax: TMAX.ostwald };
}

// Lecture du temps : l'élève clique sur « Faire vieillir » ; le temps avance jusqu'à tmax puis s'arrête.
function useLecture(set, tmax, cle, t0) {
  const [lit, setLit] = useState(false), raf = useRef(0), tRef = useRef(t0);
  useEffect(() => { tRef.current = t0; });
  useEffect(() => {
    if (!lit) return undefined;
    let dernier = performance.now(), tl = tRef.current;
    const pas = now => {
      const dt = (now - dernier) / 1000; dernier = now;
      tl = Math.min(tmax, tl + dt * tmax / 9);
      set(s => ({ ...s, t: tl, jouee: true }));
      if (tl >= tmax) setLit(false); else raf.current = requestAnimationFrame(pas);
    };
    raf.current = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf.current);
  }, [lit, tmax, set, cle]);
  return [lit, setLit];
}

export function SimulationInstabilite() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState(INIT);                    // scène du parcours
  const [ex, setEx] = useState({ ...INIT });                // scène de l'exploration
  const [note, setNote] = useState('');
  const [ouv, setOuv] = useState({});
  const [suiviS, noterS] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('stokes');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'aire', titre: 'Pourquoi une émulsion vieillit', focus: ['scene'],
      texte: <>Une émulsion contient des milliers de gouttes d’un liquide dans un autre non miscible. Quand on partage un volume d’huile en <strong>8 gouttes</strong> deux fois plus petites en rayon, l’aire de l’interface huile/eau est <strong>multipliée par 2</strong> : plus il y a d’interface, plus l’énergie du système est élevée. Une émulsion n’est donc <strong>pas à l’équilibre</strong> : même bien préparée, elle évolue avec le temps vers moins d’interface (animation : les petites gouttes fusionnent en une seule). Le tensioactif ralentit cette évolution mais ne l’arrête pas.</>,
      tache: { type: 'qcm', q: 'Pourquoi une émulsion est-elle thermodynamiquement instable ?', ...QCM.aire,
        expl: 'Fabriquer l’émulsion crée beaucoup d’interface huile/eau, ce qui coûte de l’énergie : le système évolue spontanément vers moins d’interface (gouttes plus grosses, puis deux phases séparées). Les deux liquides restent non miscibles et le tensioactif ne se décompose pas ; il retarde seulement cette évolution.', indice: 'Comparez l’aire d’interface de 8 petites gouttes et d’une grosse goutte de même volume total.' } },
    { id: 'cremage', titre: 'Premier phénomène : le crémage', focus: ['scene', 'commandes'],
      texte: <>Voici un tube de 10 cm contenant une émulsion <strong>H/E</strong> (huile à 920 kg/m³, eau à 1 000 kg/m³). Cliquez sur « Faire vieillir » et regardez les gouttes pendant que le temps s’écoule (en jours). Ce déplacement d’ensemble des gouttes vers le haut s’appelle le <strong>crémage</strong> (vers le bas, ce serait la <strong>sédimentation</strong>). Il n’y a ni fusion ni changement de taille : seules les positions changent.</>,
      tache: { type: 'qcm', q: 'Dans ce tube, que font les gouttes d’huile à 920 kg/m³ dans l’eau à 1 000 kg/m³ ?', ...QCM.cremage,
        expl: 'Plus légère que l’eau, l’huile subit une poussée d’Archimède supérieure à son poids : les gouttes montent (crémage) et forment une couche de crème en haut. Si les gouttes étaient plus denses que la phase continue, elles descendraient (sédimentation).', indice: 'Comparez la masse volumique des gouttes à celle de la phase continue : une goutte plus légère remonte.' } },
    { id: 'stokes', titre: 'Qui fait monter plus vite les gouttes ?', focus: ['scene', 'commandes'],
      texte: <>Une goutte sphérique de rayon <em>r</em> qui monte lentement dans un liquide de viscosité <em>η</em> subit la force de frottement de Stokes. Sa vitesse est <FormuleEnLigne><mi>v</mi><mo>=</mo><mfrac><mrow><mn>2</mn><mo>Δ</mo><mi>ρ</mi><mi>g</mi><msup><mi>r</mi><mn>2</mn></msup></mrow><mrow><mn>9</mn><mi>η</mi></mrow></mfrac></FormuleEnLigne> avec Δρ l’écart de masse volumique. Essayez le <strong>rayon moyen</strong> des gouttes avec le curseur, et regardez la vitesse moyenne affichée.</>,
      tache: { type: 'qcm', q: 'Si l’on divise le rayon des gouttes par 2, que devient la vitesse de crémage ?', ...QCM.stokes,
        expl: 'v est proportionnelle à r² : diviser r par 2 divise v par 2² = 4. Les petites gouttes crèment donc beaucoup moins vite, c’est pourquoi on cherche à fabriquer des gouttes fines.', indice: 'v est proportionnelle à r², pas à r.' } },
    { id: 'stokes-num', titre: 'Calculer une vitesse de crémage', focus: ['mesures'],
      texte: <>Une goutte d’huile de rayon <strong>2 µm</strong> monte dans une phase aqueuse de viscosité <strong>2 mPa·s</strong> ; l’écart de masse volumique est Δρ = <strong>80 kg/m³</strong> (g = 9,81 m/s²). Convertissez en unités SI avant de calculer : 1 µm = 10<sup>−6</sup> m et 1 mPa·s = 10<sup>−3</sup> Pa·s.</>,
      tache: { type: 'num', q: 'Vitesse de montée v de cette goutte', unite: 'µm/s', vrai: M.vitesseUmS(2, 80, 2), tol: 0.05, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['r = 2 µm = 2×10⁻⁶ m ; η = 2 mPa·s = 2×10⁻³ Pa·s.', 'v = frac(2 × 80 × 9,81 × (2×10⁻⁶)²|9 × 2×10⁻³) = frac(6,28×10⁻⁹|1,8×10⁻²) ≈ 3,5×10⁻⁷ m/s.', 'Soit 0,35 µm/s : la goutte monte de 1,3 mm en une heure.'],
        pieges: [[M.vitesseUmS(4, 80, 2), 'Vous avez pris le diamètre (4 µm) à la place du rayon : la vitesse est alors 4 fois trop grande.'], [M.vitesseStokes(2, 80, 2), 'La valeur est en m/s : convertissez en µm/s (1 m/s = 10⁶ µm/s).'], [M.vitesseUmS(2, 80, 2) * 1000, 'La viscosité vaut 2×10⁻³ Pa·s : 2 mPa·s ne se met pas directement dans la formule.'], [M.vitesseUmS(2, 80, 2) / 1000, 'Attention à la conversion de la viscosité : 1 mPa·s = 10⁻³ Pa·s.']],
        expl: 'v = 2Δρ g r² / (9η) ≈ 3,5×10⁻⁷ m/s, soit 0,35 µm/s : de l’ordre de 1 mm par heure. À cette vitesse, une crème de 10 cm se forme en une dizaine de jours.', indice: 'v = frac(2Δρ g r²|9η) avec r en m, η en Pa·s, Δρ en kg/m³ : le résultat est en m/s, à convertir en µm/s.' } },
    { id: 'remede-cremage', titre: 'Ralentir le crémage', focus: ['scene', 'commandes'],
      texte: <>Regardez la formule de Stokes : <em>v</em> diminue quand <em>r</em> diminue, quand Δρ diminue ou quand <em>η</em> augmente. Un nouveau curseur règle la <strong>viscosité de la phase continue</strong> (en mPa·s) : essayez-le, puis relancez le vieillissement. Les épaississants (gomme xanthane, par exemple) sont ajoutés à la phase aqueuse pour cela.</>,
      tache: { type: 'qcm', q: 'Quel est le moyen le plus simple de ralentir le crémage sans changer les gouttes ?', ...QCM.remede,
        expl: 'v est inversement proportionnelle à la viscosité de la phase continue : épaissir cette phase ralentit la montée des gouttes. Changer Δρ est peu praticable, et diluer ne règle rien. Le moyen complémentaire est de fabriquer des gouttes plus fines (homogénéisation).', indice: 'Dans la formule de Stokes, quelle grandeur de la phase continue figure au dénominateur ?' } },
    { id: 'floc', titre: 'Deuxième phénomène : la floculation', focus: ['scene', 'commandes'],
      retenirTitre: 'À retenir : crémage et loi de Stokes', retenir: <>
        <SvgCarteStokes/>
        <ul style={puces}>
          <li>Le <strong>crémage</strong> (ou la sédimentation) est un déplacement d’ensemble des gouttes sous l’effet de la différence de masse volumique.</li>
          <li><strong>v = 2Δρ g r² / (9η)</strong> : petites gouttes et phase continue visqueuse ralentissent le crémage.</li>
          <li>Moyen de s’en souvenir : <strong>« rayon au carré, viscosité au dénominateur »</strong>.</li>
        </ul></>,
      texte: <>On regarde maintenant l’émulsion au <strong>microscope</strong> (champ de 60 × 45 µm) et à l’œil nu. Faites vieillir l’émulsion pendant 30 jours : les gouttes se rapprochent et <strong>s’accolent</strong> en amas (contour violet), sans que leurs films se rompent. Puis cliquez sur « Agiter » : que deviennent les amas ?</>,
      tache: { type: 'qcm', q: 'Au microscope, on voit des amas de gouttes accolées mais intactes, qui se défont sous agitation. De quel phénomène s’agit-il ?', ...QCM.floc,
        expl: 'Les gouttes se sont accolées sans fusionner : c’est la floculation, réversible puisque l’agitation sépare les amas. Les gouttes ont gardé leur taille, ce qui la distingue de la coalescence. La floculation accélère souvent le crémage (un amas monte plus vite qu’une goutte).', indice: 'Dans cette situation, chaque goutte a-t-elle gardé sa taille ?' } },
    { id: 'coal', titre: 'Troisième phénomène : la coalescence', focus: ['scene', 'commandes'],
      texte: <>Ici, quand deux gouttes se touchent, le film de tensioactif qui les sépare <strong>se rompt</strong> : elles <strong>fusionnent</strong> (contour orange pendant la fusion) en une goutte plus grosse, de volume égal à la somme des deux. Faites vieillir 30 jours, puis cliquez sur « Agiter ».</>,
      tache: { type: 'qcm', q: 'Peut-on retrouver les petites gouttes d’origine en agitant l’émulsion après coalescence ?', ...QCM.coal,
        expl: 'La coalescence est irréversible : une fois le film rompu, les deux gouttes n’en forment qu’une, et l’agitation ne les sépare pas (seule une nouvelle homogénéisation, avec apport d’énergie, peut refaire des gouttes). Elle conduit à terme à une séparation des deux phases : on voit l’huile libre en surface.', indice: 'Pensez à deux gouttes d’eau qui se touchent sur une vitre : redeviennent-elles deux gouttes si l’on secoue ?' } },
    { id: 'couverture', titre: 'Freiner la coalescence par l’interface', focus: ['scene', 'commandes'],
      texte: <>La coalescence est d’autant plus rare que l’interface est <strong>bien couverte</strong> par le tensioactif : le film résiste mieux au contact. Le curseur règle la <strong>couverture de l’interface</strong> (fraction de la surface occupée). Réglez-la à <strong>90 % ou plus</strong>, puis faites vieillir l’émulsion au moins <strong>20 jours</strong> et comparez le nombre de gouttes avec le résultat précédent.</>,
      tache: { type: 'action', ok: vie.phen === 'coalescence' && vie.cov >= 0.9 && vie.t >= 20, consigne: 'Couverture ≥ 90 % et vieillissement d’au moins 20 jours' } },
    { id: 'ostwald', titre: 'Quatrième phénomène : le mûrissement d’Ostwald', focus: ['scene', 'commandes'],
      retenirTitre: 'À retenir : floculation et coalescence', retenir: <>
        <SvgCarteFlocCoal/>
        <ul style={puces}>
          <li><strong>Floculation</strong> : les gouttes s’accolent sans fusionner ; <strong>réversible</strong> par agitation.</li>
          <li><strong>Coalescence</strong> : les gouttes fusionnent ; <strong>irréversible</strong> ; on la freine en couvrant mieux l’interface.</li>
          <li>Moyen de s’en souvenir : <strong>« floculation : on se colle ; coalescence : on se fond »</strong>.</li>
        </ul></>,
      texte: <>Autre évolution, sans contact : une petite goutte est plus « pressée » qu’une grosse (pression de Laplace), et l’huile est un peu soluble dans la phase continue. Des molécules d’huile (points orange) quittent donc les petites gouttes, traversent la phase continue et rejoignent les grosses. Cliquez sur « Faire vieillir ». <em>Ce phénomène est hors du programme : il sert à comprendre pourquoi une émulsion fine grossit sans que les gouttes se touchent.</em></>,
      tache: { type: 'qcm', q: 'Dans le mûrissement d’Ostwald, comment les grosses gouttes grossissent-elles ?', ...QCM.ostwald,
        expl: 'L’huile, un peu soluble dans la phase continue, passe des petites gouttes (plus « pressées ») aux grosses par diffusion. Les gouttes ne se touchent pas : les petites disparaissent, les grosses grossissent, et le volume total d’huile reste constant.', indice: 'Aucune goutte ne bouge ni ne se touche : qu’est-ce qui peut circuler entre elles ?' } },
    { id: 'insoluble', titre: 'Freiner le mûrissement d’Ostwald', focus: ['scene', 'commandes'],
      texte: <>Une huile très <strong>peu soluble</strong> dans la phase continue (par exemple une huile végétale ajoutée en petite quantité à l’huile principale) ne diffuse pas : elle reste dans les gouttes et s’oppose au transfert. Le curseur règle la <strong>part d’huile insoluble</strong> dans les gouttes. Réglez-la à <strong>20 % ou plus</strong>, puis faites vieillir au moins <strong>40 jours</strong> et comparez avec le résultat précédent.</>,
      tache: { type: 'action', ok: vie.phen === 'ostwald' && vie.fIns >= 0.2 && vie.t >= 40, consigne: 'Huile insoluble ≥ 20 % et vieillissement d’au moins 40 jours' } },
    { id: 'diag-1', titre: 'Diagnostic : deux phénomènes qui grossissent les gouttes', focus: ['obs'],
      texte: <>Un technicien observe une émulsion vieillie : <strong>« Au microscope, les gouttes sont de tailles très différentes, les plus petites ont disparu, et aucune ne touche les autres. Après agitation, la distribution de tailles ne revient pas à l’état initial. »</strong></>,
      tache: { type: 'qcm', q: 'Quel phénomène explique le mieux ces observations ?', ...QCM.diag1,
        expl: 'Les gouttes ne se touchent pas, donc ni floculation ni coalescence (qui exigent un contact), et l’agitation ne rétablit pas les tailles, donc pas de réversibilité : c’est le mûrissement d’Ostwald, où l’huile passe des petites aux grosses gouttes à travers la phase continue.', indice: 'Aucun contact entre gouttes : quels phénomènes sont alors exclus ?' } },
    { id: 'diag-2', titre: 'Diagnostic : amas ou crème ?', focus: ['obs'],
      retenirTitre: 'À retenir : le mûrissement d’Ostwald', retenir: <>
        <SvgCarteOstwald/>
        <ul style={puces}>
          <li>L’huile des petites gouttes <strong>diffuse</strong> à travers la phase continue vers les grosses ; les gouttes ne se touchent pas.</li>
          <li>On le freine avec une <strong>huile insoluble</strong> dans les gouttes et des tailles serrées.</li>
        </ul></>,
      texte: <>Une crème devient <strong>granuleuse</strong> : <strong>« Au microscope, on voit des amas de gouttes accolées, chacune ayant gardé sa taille. Après agitation, la crème redevient lisse. »</strong></>,
      tache: { type: 'qcm', q: 'Quel phénomène explique le mieux ces observations ?', ...QCM.diag2,
        expl: 'Les gouttes sont accolées mais ont gardé leur taille, et l’agitation défait les amas : c’est la floculation. Dans le crémage, les gouttes montent sans s’accoler ; la coalescence aurait donné des gouttes plus grosses et irréversibles.', indice: 'Quel phénomène produit des amas qui se défont sous agitation ?' } },
    { id: 'volume', titre: 'Coalescence : de combien grossissent les gouttes ?', focus: [],
      texte: <>Une émulsion contient <strong>40 gouttes identiques</strong> de rayon <em>r</em>. Après coalescence, il ne reste que <strong>5 gouttes identiques</strong>. Le volume total d’huile est conservé. Le volume d’une goutte sphérique est <FormuleEnLigne><mi>V</mi><mo>=</mo><mfrac><mn>4</mn><mn>3</mn></mfrac><mi>π</mi><msup><mi>r</mi><mn>3</mn></msup></FormuleEnLigne>.</>,
      tache: { type: 'num', q: 'Par quel facteur le rayon des gouttes a-t-il été multiplié ?', unite: '', vrai: 2, tol: 0.03, affiche: v => fr(v, 1), cs: 2,
        calcul: () => ['Le volume total est conservé : 40 × r³ = 5 × r′³.', 'r′³ = 8 r³, donc r′ = 2 r.', 'Le nombre de gouttes a été divisé par 8, mais le rayon n’est multiplié que par 2.'],
        pieges: [[8, 'Le nombre de gouttes est divisé par 8, mais le rayon varie comme la racine cubique du volume : 8^(1/3) = 2.'], [Math.sqrt(8), 'Racine carrée : ce serait l’aire qui est conservée ; c’est le volume V ∝ r³ qui l’est.'], [0.5, 'Le rayon augmente quand les gouttes fusionnent : le facteur est supérieur à 1.']],
        expl: 'N r³ = N′ r′³ avec N/N′ = 8 donne r′/r = 8^(1/3) = 2. Les gouttes ont deux fois plus de rayon (donc aussi un crémage 4 fois plus rapide, d’après Stokes) : la coalescence aggrave le crémage.', indice: 'Le volume total est N fois le volume d’une goutte, proportionnel à r³ : écrivez N r³ = N′ r′³.' } },
    { id: 'bilan', titre: 'Le bilan : quatre instabilités', focus: [],
      retenirTitre: 'À retenir : les quatre instabilités', retenir: <>
        <SvgCarteBilan/>
        <ul style={puces}>
          <li><strong>Crémage</strong> et <strong>floculation</strong> : réversibles (une agitation les corrige). <strong>Coalescence</strong> et <strong>Ostwald</strong> : irréversibles.</li>
          <li>Chaque remède correspond à son phénomène : <strong>épaissir ou affiner</strong>, <strong>répulsion</strong>, <strong>couverture de l’interface</strong>, <strong>huile insoluble</strong>.</li>
        </ul></>,
      texte: <>Vous savez distinguer les quatre phénomènes par leurs observations (microscope, aspect, effet de l’agitation), calculer une vitesse de crémage avec la loi de Stokes et relier chaque instabilité à un remède de formulation. En exploration, vous pouvez faire varier tous les paramètres ; les défis proposent un calcul de durée et un diagnostic.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const PHEN_ETAPE = { cremage: 'cremage', stokes: 'cremage', 'remede-cremage': 'cremage', floc: 'floculation', coal: 'coalescence', couverture: 'coalescence', ostwald: 'ostwald', insoluble: 'ostwald' };
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) { setVie(s => ({ ...s, phen: PHEN_ETAPE[IDS[ni]] ?? s.phen, t: 0 })); setNote(''); }
    setGuide(nv);
  };

  // ---------- scène (parcours ou exploration) ----------
  const s = enExplore ? ex : { ...vie, phen: PHEN_ETAPE[idE] ?? vie.phen }, setS = enExplore ? setEx : setVie;
  const K = calculs(s);
  const tmax = K.tmax;
  const [lit, setLit] = useLecture(setS, tmax, `${mode}-${s.phen}`, s.t);
  const lancer = () => { setNote(''); if (s.t >= tmax) setS(x => ({ ...x, t: 0 })); setLit(true); };
  const agiter = () => {
    setLit(false);
    if (s.phen === 'floculation') { setS(x => ({ ...x, t: 0 })); setNote('Les amas se sont défaits : la floculation est réversible. Relancez le vieillissement : ils se reforment.'); }
    else if (s.phen === 'coalescence') setNote('Les gouttes fusionnées restent grosses : la coalescence est irréversible, l’agitation ne les sépare pas.');
    else if (s.phen === 'ostwald') setNote('L’agitation ne ramène pas les tailles d’origine : l’huile transférée reste dans les grosses gouttes.');
    else if (s.phen === 'cremage') { setS(x => ({ ...x, t: 0 })); setNote('Les gouttes sont redispersées : le crémage est réversible. Relancez : elles remontent.'); }
  };
  const cremageNom = s.phen === 'cremage' && K.drho < 0 ? 'sédimentation' : 'crémage';
  const dessin = s.phen === 'cremage'
    ? <SvgCremage C={K.C} t={s.t} nom={cremageNom}/>
    : <SvgVieillissement phen={s.phen} etat={K.etat} t={s.t} hist0={HIST0} N0={N0} r0={R0} anim={!(enGuide && (idE === 'diag-1' || idE === 'diag-2'))}/>;
  const commandes = (
    <div style={{ ...styleBoite, ...cadre('commandes') }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={lit ? () => setLit(false) : lancer} style={styleBouton(true, '#15803d')} aria-pressed={lit}>{lit ? '⏸ Pause' : '▶ Faire vieillir'}</button>
        <button onClick={agiter} style={stylePetitBouton(false)}>Agiter</button>
        <button onClick={() => { setLit(false); setS(x => ({ ...x, t: 0 })); setNote(''); }} style={stylePetitBouton(false)}><Pic n="refresh"/>Au départ</button>
      </div>
      <label htmlFor="in-t" style={{ ...libelle, marginTop: 8 }}>Temps écoulé : {fr(s.t, 1)} jours</label>
      <input id="in-t" type="range" min="0" max={tmax} step={tmax / 120} value={Math.min(s.t, tmax)} onChange={ev => { setLit(false); setS(x => ({ ...x, t: parseFloat(ev.target.value) })); }} aria-label="Temps écoulé en jours" style={{ width: '100%', accentColor: '#7c3aed' }}/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>« Faire vieillir » fait avancer le temps ; le curseur permet de remonter. « Agiter » secoue le flacon.</div>
      {note && <div role="status" aria-live="polite" style={{ marginTop: 6, fontSize: 13.5, fontWeight: 700, color: COL.violet, lineHeight: 1.5 }}>{note}</div>}
    </div>);
  const curs = (id, lab, val, min, max, step, set, fmt, aide) => (
    <div style={{ marginTop: 8 }}>
      <label htmlFor={id} style={libelle}>{lab} : {fmt(val)}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={ev => { set(parseFloat(ev.target.value)); setLit(false); }} aria-label={lab} style={{ width: '100%', accentColor: '#7c3aed' }}/>
      {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}
    </div>);
  const maj = f => setS(x => ({ ...x, ...f }));
  const pcen = v => `${fr(v * 100, 0)} %`;

  // réglages du parcours (apparaissent à l'étape qui s'en sert, et restent ensuite)
  const iE = enGuide ? etape : 99;
  const reglagesGuide = enGuide && (
    <div style={{ ...styleBoite, ...cadre('commandes') }}>
      {s.phen === 'cremage' && iE >= 2 && curs('in-r', 'Rayon moyen des gouttes', s.rUm, 1, 6, 0.1, v => maj({ rUm: v }), v => `${fr(v, 1)} µm`, 'Les gouttes réelles ont des rayons voisins : on règle leur rayon moyen.')}
      {s.phen === 'cremage' && iE >= 4 && curs('in-eta', 'Viscosité de la phase continue', s.eta, 1, 20, 0.5, v => maj({ eta: v }), v => `${fr(v, 1)} mPa·s`, 'L’eau pure vaut 1 mPa·s ; un épaississant l’augmente.')}
      {s.phen === 'coalescence' && iE >= 7 && curs('in-cov', 'Couverture de l’interface', s.cov, 0, 1, 0.05, v => maj({ cov: v }), pcen, 'Fraction de la surface des gouttes occupée par le tensioactif.')}
      {s.phen === 'ostwald' && iE >= 9 && curs('in-ins', 'Huile insoluble dans les gouttes', s.fIns, 0, 0.3, 0.05, v => maj({ fIns: v }), pcen, 'Part de l’huile qui ne diffuse pas dans la phase continue.')}
    </div>);
  const montrerRegl = enGuide && ((s.phen === 'cremage' && iE >= 2) || (s.phen === 'coalescence' && iE >= 7) || (s.phen === 'ostwald' && iE >= 9));

  // mesures
  const nom = s.phen === 'floculation' ? 'Nombre d’amas ou de gouttes isolées' : 'Nombre de gouttes';
  const lignes = (enGuide && idE === 'stokes-num') ? [['Rayon de la goutte', '2 µm'], ['Écart de masse volumique Δρ', '80 kg/m³'], ['Viscosité η de la phase continue', '2 mPa·s'], ['Accélération g', '9,81 m/s²']]
    : s.phen === 'cremage' ? [['Temps écoulé', `${fr(s.t, 1)} jours`], ['Gouttes arrivées dans la crème', `${fr(M.fractionArrivee(K.C, s.t) * 100, 0)} %`], ...(enExplore || iE >= 2 ? [['Rayon moyen', `${fr(s.rUm, 1)} µm`], ['Vitesse moyenne de montée', `${fr(Math.abs(vCm(K.C.vMoy)), 2)} µm/s`]] : [])]
    : [['Temps écoulé', `${fr(s.t, 1)} jours`], [nom, `${K.etat.N} sur ${N0}`], ['Rayon moyen des gouttes', `${fr(K.etat.rc, 1)} µm`]];
  const mesures = (enExplore || (enGuide && !['aire', 'diag-1', 'diag-2', 'volume', 'bilan'].includes(idE))) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Mesures' : 'Données'}</div>
      {lignes.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);

  // observations du diagnostic (parcours)
  const OBS_GUIDE = { 'diag-1': 'ostwald', 'diag-2': 'floculation' };
  const sceneGuide = enGuide ? (idE === 'aire' ? <SvgAire anim/> : OBS_GUIDE[idE] ? null : ['volume', 'bilan', 'stokes-num'].includes(idE) ? null : dessin) : null;
  const avecCommandes = enGuide && PHEN_ETAPE[idE];
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{M.NOMS[s.phen]} : {s.phen === 'cremage' ? 'dans un tube' : 'du flacon au microscope'}</div>}
      {enGuide ? sceneGuide : dessin}
    </div>);

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'stokes'
    ? (() => { const t = M.tirageStokes(); const j = t.heures / 24, unite = t.heures < 1 ? 'min' : j < 2 ? 'h' : 'j', vrai = unite === 'min' ? t.heures * 60 : unite === 'h' ? t.heures : j; return { kind, ...t, unite, vrai, rep: '', verifie: false }; })()
    : { kind, ...M.tirageDiagnostic(), phenRep: '', remRep: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'stokes') { const x = lireNombre(defi.rep); ok = isFinite(x) && Math.abs(x - defi.vrai) <= 0.05 * defi.vrai; noterS(ok); }
    else { ok = defi.phenRep === defi.phen && defi.remRep === defi.phen; noterD(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const nomUnite = { min: 'minutes', h: 'heures', j: 'jours' };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['stokes', 'Durée de montée (Stokes)'], ['diagnostic', 'Diagnostic et remède']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.kind === 'stokes' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : en combien de temps la crème se forme-t-elle ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Dans une émulsion H/E de hauteur <strong>{defi.h} cm</strong>, les gouttes d’huile ont pour rayon <strong>{defi.rUm} µm</strong> ; la phase continue a une viscosité de <strong>{defi.eta} mPa·s</strong> et l’écart de masse volumique est Δρ = <strong>{defi.drho} kg/m³</strong> (g = 9,81 m/s²). Quelle durée faut-il à une goutte partie du fond du tube pour atteindre le haut ? Donnez la réponse en <strong>{nomUnite[defi.unite]}</strong>, à 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}><span>Durée :</span>
          <input value={defi.rep} aria-label={`Durée en ${nomUnite[defi.unite]}`} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('in-verif')?.click()} onChange={ev => setDefi(d => ({ ...d, rep: ev.target.value, verifie: false }))}
            style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/><span>{defi.unite === 'j' ? 'jours' : defi.unite === 'h' ? 'heures' : 'minutes'}</span></div>
        <IndiceDefi cache={false}>Calculez d’abord la vitesse <FormuleEnLigne><mi>v</mi><mo>=</mo><mfrac><mrow><mn>2</mn><mo>Δ</mo><mi>ρ</mi><mi>g</mi><msup><mi>r</mi><mn>2</mn></msup></mrow><mrow><mn>9</mn><mi>η</mi></mrow></mfrac></FormuleEnLigne> en unités SI (r en m, η en Pa·s), puis la durée t = hauteur ÷ v, avec la hauteur en mètres. Résultat à 5 % près.</IndiceDefi>
      </>}
      {defi.kind === 'diagnostic' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quel est le problème et comment le corriger ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, marginBottom: 6 }}>Un technicien a observé une émulsion qui vieillit :</div>
        <div style={{ border: `1.5px solid ${KIT.bord}`, borderRadius: 12, background: 'white', marginBottom: 8 }}>
          {defi.observations.map(([n, v], k) => <div key={n} style={{ padding: '7px 10px', borderTop: k ? `1px dashed ${KIT.bord}` : 'none', fontSize: 14, lineHeight: 1.5 }}><strong>{n}</strong> : {v}</div>)}
        </div>
        <label htmlFor="in-phen" style={libelle}>Phénomène</label>
        <select id="in-phen" value={defi.phenRep} onChange={ev => setDefi(d => ({ ...d, phenRep: ev.target.value, verifie: false }))} style={{ ...selectStyle, marginBottom: 8 }}>
          <option value="">Choisir…</option>{M.PHENOMENES.map(p => <option key={p} value={p}>{M.NOMS[p]}</option>)}</select>
        <label htmlFor="in-rem" style={libelle}>Remède adapté</label>
        <select id="in-rem" value={defi.remRep} onChange={ev => setDefi(d => ({ ...d, remRep: ev.target.value, verifie: false }))} style={selectStyle}>
          <option value="">Choisir…</option>{M.PHENOMENES.map(p => <option key={p} value={p}>{M.REMEDES[p]}</option>)}</select>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Trois questions : les gouttes se touchent-elles ? Ont-elles changé de taille ? L’agitation corrige-t-elle ? Chaque phénomène a son propre remède.</IndiceDefi></div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="in-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'stokes' && <>v = 2 × {defi.drho} × 9,81 × ({defi.rUm}×10⁻⁶)² ÷ (9 × {defi.eta}×10⁻³) = {fr(M.vitesseUmS(defi.rUm, defi.drho, defi.eta), 3)} µm/s, donc t = {fr(defi.h / 100, 2)} m ÷ v ≈ {fr(defi.vrai, 1)} {defi.unite === 'j' ? 'jours' : defi.unite === 'h' ? 'heures' : 'minutes'}.</>}
        {defi.kind === 'diagnostic' && <>C’est du {defi.phen === 'cremage' ? 'crémage' : defi.phen === 'ostwald' ? 'mûrissement d’Ostwald' : defi.phen === 'floculation' ? 'floculation' : 'coalescence'} ; remède : {M.REMEDES[defi.phen]}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Échantillon schématique</strong> : le champ du microscope montre 40 gouttes de rayons voisins (moyenne 2,5 µm) à des positions fixes ; une vraie émulsion en contient des milliards, avec des tailles plus dispersées. Les durées sont des <strong>ordres de grandeur illustratifs</strong>, pas des mesures.</li>
      <li><strong>Loi de Stokes</strong> : sphères rigides isolées, phase continue newtonienne, écoulement lent (nombre de Reynolds très inférieur à 1), émulsion diluée. Pour une émulsion concentrée, la montée est freinée (sédimentation entravée) ; les amas montent plus vite qu’une goutte. Le mouvement brownien, qui s’oppose au crémage pour des gouttes inférieures à 1 µm, n’est pas modélisé.</li>
      <li><strong>Floculation et coalescence</strong> : deux gouttes voisines se rencontrent à un instant aléatoire, d’autant plus tardif que la répulsion (floculation) ou la couverture (coalescence) est grande ; la loi (1 − x)² est qualitative. Les gouttes ne bougent que pour s’accoler ou fusionner.</li>
      <li><strong>Mûrissement d’Ostwald</strong> (hors référentiel) : le volume d’une goutte varie selon dv/dt = 3a (r/r<sub>c</sub> − 1), r<sub>c</sub> étant le rayon moyen des gouttes restantes ; le volume total d’huile est conservé. Pour une huile très peu soluble dans la phase continue (la plupart des huiles cosmétiques), le phénomène est lent ; il devient important pour une huile un peu soluble (certains alcanes, huiles essentielles).</li>
      <li><strong>Aspect à l’œil nu</strong> : le dessin du pot est qualitatif (couche d’huile libre, crème plus grossière, grains).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);

  // ---------- exploration ----------
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="in-ph" style={libelle}>Phénomène étudié</label>
      <select id="in-ph" value={ex.phen} onChange={ev => { setLit(false); setNote(''); setEx(x => ({ ...x, phen: ev.target.value, t: 0 })); }} style={selectStyle}>
        {M.PHENOMENES.map(p => <option key={p} value={p}>{M.NOMS[p]}</option>)}</select>
      {ex.phen === 'cremage' && <Section titre={`Gouttes et phase continue : r = ${fr(ex.rUm, 1)} µm · η = ${fr(ex.eta, 1)} mPa·s`} ouvert={!!ouv.cr} onBascule={() => bascule('cr')}>
        <label htmlFor="in-type" style={libelle}>Sens de l’émulsion</label>
        <select id="in-type" value={ex.type} onChange={ev => maj({ type: ev.target.value, t: 0 })} style={selectStyle}><option value="H/E">H/E : huile dans l’eau</option><option value="E/H">E/H : eau dans l’huile</option></select>
        {curs('in-r', 'Rayon moyen des gouttes', ex.rUm, 1, 6, 0.1, v => maj({ rUm: v, t: 0 }), v => `${fr(v, 1)} µm`)}
        {curs('in-eta', 'Viscosité de la phase continue', ex.eta, 1, 20, 0.5, v => maj({ eta: v, t: 0 }), v => `${fr(v, 1)} mPa·s`)}
        {curs('in-rho', 'Masse volumique de l’huile', ex.rhoH, 850, 1100, 10, v => maj({ rhoH: v, t: 0 }), v => `${fr(v, 0)} kg/m³`, 'Eau : 1 000 kg/m³. Au-dessus de 1 000 kg/m³, une huile est plus dense que l’eau.')}
        {curs('in-h', 'Hauteur de l’émulsion', ex.hCm, 5, 20, 1, v => maj({ hCm: v, t: 0 }), v => `${fr(v, 0)} cm`)}
      </Section>}
      {ex.phen === 'floculation' && <Section titre={`Répulsion entre gouttes : ${pcen(ex.rep)}`} ouvert={!!ouv.rep} onBascule={() => bascule('rep')}>
        {curs('in-rep', 'Répulsion entre gouttes (charge, polymère adsorbé)', ex.rep, 0, 1, 0.05, v => maj({ rep: v, t: 0 }), pcen, 'Plus la répulsion est grande, moins les gouttes s’accolent.')}</Section>}
      {ex.phen === 'coalescence' && <Section titre={`Couverture de l’interface : ${pcen(ex.cov)}`} ouvert={!!ouv.cov} onBascule={() => bascule('cov')}>
        {curs('in-cov', 'Couverture de l’interface par le tensioactif', ex.cov, 0, 1, 0.05, v => maj({ cov: v, t: 0 }), pcen, 'Plus l’interface est couverte, plus le film résiste au contact.')}</Section>}
      {ex.phen === 'ostwald' && <Section titre={`Solubilité : ${fr(ex.S, 1)} · huile insoluble : ${pcen(ex.fIns)}`} ouvert={!!ouv.ost} onBascule={() => bascule('ost')}>
        {curs('in-S', 'Solubilité de l’huile dans la phase continue (unité arbitraire)', ex.S, 0, 4, 0.5, v => maj({ S: v, t: 0 }), v => fr(v, 1), 'À 0, l’huile ne diffuse pas : aucune évolution.')}
        {curs('in-ins', 'Part d’huile insoluble dans les gouttes', ex.fIns, 0, 0.3, 0.05, v => maj({ fIns: v, t: 0 }), pcen)}</Section>}
    </div>);
  const sectionTableau = enExplore && (
    <Section titre="Tableau des quatre phénomènes" ouvert={!!ouv.tab} onBascule={() => bascule('tab')}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%' }}>
          <thead><tr>{['Phénomène', 'Gouttes', 'Réversible ?', 'Remède'].map(h => <th key={h} style={{ textAlign: 'left', padding: '4px 6px', borderBottom: `2px solid ${KIT.bord}` }}>{h}</th>)}</tr></thead>
          <tbody>{[['Crémage', 'se déplacent (taille inchangée)', 'oui', 'gouttes fines, phase continue épaissie'], ['Floculation', 'accolées, intactes', 'oui', 'répulsion entre gouttes'], ['Coalescence', 'fusionnent', 'non', 'interface bien couverte'], ['Ostwald', 'sans contact : grossissent ou disparaissent', 'non', 'huile insoluble, tailles serrées']].map(r => <tr key={r[0]}>{r.map((c, k) => <td key={k} style={{ padding: '4px 6px', borderBottom: `1px dashed ${KIT.bord}`, fontWeight: k ? 400 : 700 }}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </Section>);
  const aEssayer = (
    <ul style={liste}>
      <li>Crémage : doublez le rayon des gouttes, puis multipliez la viscosité par 4 : que devient la durée pour que la crème se forme ?</li>
      <li>Réglez la masse volumique de l’huile à 1 000 kg/m³ : que se passe-t-il ? Puis à 1 050 kg/m³ : comment appelle-t-on le mouvement ?</li>
      <li>Floculation : comparez la répulsion à 0 % et à 80 %. Cliquez sur « Agiter » : les amas se défont-ils ?</li>
      <li>Coalescence : comparez couverture 30 % et 90 % au bout de 30 jours. Cliquez sur « Agiter » : que se passe-t-il ?</li>
      <li>Ostwald : réglez l’huile insoluble à 30 % : quel est l’effet sur le nombre de gouttes à 60 jours ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Une émulsion n’est pas à l’équilibre : l’aire d’interface tend à diminuer</li>
        <li>Crémage : v = 2Δρ g r² / (9η) ; gouttes fines et phase continue visqueuse le ralentissent</li>
        <li>Floculation : gouttes accolées, intactes, réversible par agitation</li>
        <li>Coalescence : gouttes fusionnées, irréversible ; on la freine en couvrant mieux l’interface</li>
        <li>Mûrissement d’Ostwald (hors référentiel) : transfert d’huile des petites vers les grosses gouttes, freiné par une huile insoluble</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .in-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .in-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .in-col { display: flex; flex-direction: column; gap: 12px; }
        .in-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .in-l1.cote .in-carte { order: 2; } .in-l1.cote .in-main { order: 1; }
          .in-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .in-ex > * { grid-column: 1; }
          .in-ex > .in-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .in-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .in-in { animation: in-fondu 0.35s ease-out; } @keyframes in-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Instabilités des émulsions</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une émulsion vieillit de quatre façons : le <strong>crémage</strong>, la <strong>floculation</strong>, la <strong>coalescence</strong> et le <strong>mûrissement d’Ostwald</strong>. On les reconnaît à leurs observations, et chacune a son <strong>remède</strong>.</div>
      {enGuide && <div className="in-l1 cote">
        <div className="in-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="in-main">
          <div className="in-col">
            {sceneGuide && <div className="in-in">{scene}</div>}
            {avecCommandes && sceneGuide && <div className="in-in">{commandes}</div>}
            {avecCommandes && sceneGuide && montrerRegl && <div className="in-in">{reglagesGuide}</div>}
            {mesures && (avecCommandes || idE === 'stokes-num') && <div className="in-in">{mesures}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'stokes' ? suiviS : suiviD}/></div>}
      {enExplore && <>
        <div className="in-ex">
          {scene}
          <div className="in-reg">{reglagesExplore}</div>
          {commandes}
          {mesures}
        </div>
        {sectionTableau}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
