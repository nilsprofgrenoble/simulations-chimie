import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./cplModele";
import { QCM_PARCOURS as Q } from "./cplQcm";
import { SceneCondensateur, SceneCanon, SceneLineaire, SvgCarteChamp, SvgCarteForce, SvgCarteTrajectoire, SvgCarteCollision, SvgCarteEnergie, SvgCarteLineaire } from "./cplSchemas";

const SIM_ID = 176, CLE_GUIDE = 'cpl-tg-guide-v1';
declarerDefis(SIM_ID, [['cible', 'Atteindre la cible en réglant la tension'], ['vitesse', 'Retrouver la vitesse d’entrée à partir de la trajectoire']]);

// ====================================================
// SIM 176 — PARTICULE CHARGÉE DANS UN CONDENSATEUR PLAN ; ACCÉLÉRATEUR LINÉAIRE
//  (TG spé PC, « Mouvement et interactions », sous-partie « Mouvement dans un champ uniforme »).
//  Une seule idée : le champ électrique uniforme d'un condensateur plan ; mouvement d'une particule chargée qui y entre perpendiculairement aux lignes de champ
//  (équations horaires, trajectoire parabolique, déviation, non-collision) ; énergie (théorème de l'énergie cinétique) ; principe qualitatif de l'accélérateur linéaire.
//  Capacités visées (jamais affichées à l'élève) : discuter l'influence des grandeurs sur le champ (E = U/d donné) ; établir et exploiter équations horaires et trajectoire ;
//  exploiter le théorème de l'énergie cinétique ; décrire le principe d'un accélérateur linéaire. Le condensateur plan de la force électrique (sim 50) n'est pas doublé :
//  on apporte ici le mouvement. Modèle : cplModele.js (test : cplModele.test.mjs).
// ====================================================

const IDS = ['champ', 'sens', 'force', 'poids', 'acc', 'plan', 'horaires', 'trajectoire', 'sortie', 'collision', 'tec', 'energie', 'lineaire', 'bilan'];
const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const SUPC = '⁰¹²³⁴⁵⁶⁷⁸⁹';
// notation scientifique « 3,5 × 10¹⁵ » avec k chiffres significatifs (toujours, même pour 20 000)
function sc(x, k = 2) {
  if (!isFinite(x)) return '—'; if (x === 0) return '0';
  let e = Math.floor(Math.log10(Math.abs(x))), m = Math.abs(x) / 10 ** e; if (Number(m.toFixed(k - 1)) >= 10) { m /= 10; e += 1; }
  const exp = String(e).replace('-', '⁻').replace(/\d/g, c => SUPC[+c]);
  return `${x < 0 ? '−' : ''}${m.toFixed(k - 1).replace('.', ',')}${NB}×${NB}10${exp}`;
}
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
// racine d'une fraction, au fil du texte (MathML) : le numérateur et le dénominateur sont des textes sans indices
const racF = (h, b) => <FormuleEnLigne><msqrt><mfrac><mrow><mtext>{h.replace(/ /g, '\u00a0')}</mtext></mrow><mrow><mtext>{b.replace(/ /g, '\u00a0')}</mtext></mrow></mfrac></msqrt></FormuleEnLigne>;

// ---------- formules (MathML) ----------
const vec = n => <mover><mi>{n}</mi><mo>→</mo></mover>;
const sub = (a, b) => <msub><mi>{a}</mi><mi>{b}</mi></msub>;
const FE = <Formule><mi>E</mi><mo>=</mo><mfrac><mi>U</mi><mi>d</mi></mfrac></Formule>;
const FForce = <Formule>{vec('F')}<mo>=</mo><mi>q</mi><mo>×</mo>{vec('E')}</Formule>;
const FLoi = <Formule><mi>m</mi><mo>×</mo>{vec('a')}<mo>=</mo><mi>q</mi><mo>×</mo>{vec('E')}</Formule>;
const FAcc = <Formule>{sub('a', 'y')}<mo>=</mo><mfrac><mrow><mi>q</mi><mo>×</mo>{sub('E', 'y')}</mrow><mi>m</mi></mfrac></Formule>;
const v0 = sub('v', '0');
const FHorX = <Formule><mi>x</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo>{v0}<mo>×</mo><mi>t</mi></Formule>;
const FHorY = <Formule><mi>y</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>×</mo>{sub('a', 'y')}<mo>×</mo><msup><mi>t</mi><mn>2</mn></msup></Formule>;
const FHor = <>{FHorX}{FHorY}</>;
const FTraj = <Formule><mi>y</mi><mo>=</mo><mfrac><mrow>{sub('a', 'y')}</mrow><mrow><mn>2</mn><mo>×</mo><msubsup><mi>v</mi><mn>0</mn><mn>2</mn></msubsup></mrow></mfrac><mo>×</mo><msup><mi>x</mi><mn>2</mn></msup></Formule>;
const FYs = <Formule>{sub('y', 'S')}<mo>=</mo><mfrac><mrow><mo>|</mo><mi>q</mi><mo>|</mo><mo>×</mo><mi>U</mi><mo>×</mo><msup><mi>L</mi><mn>2</mn></msup></mrow><mrow><mn>2</mn><mo>×</mo><mi>m</mi><mo>×</mo><mi>d</mi><mo>×</mo><msubsup><mi>v</mi><mn>0</mn><mn>2</mn></msubsup></mrow></mfrac></Formule>;
const FTec = <Formule><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>×</mo><mi>m</mi><mo>×</mo><msup><mi>v</mi><mn>2</mn></msup><mo>=</mo><mo>|</mo><mi>q</mi><mo>|</mo><mo>×</mo><mi>U</mi></Formule>;
const FVit = <Formule><mi>v</mi><mo>=</mo><msqrt><mfrac><mrow><mn>2</mn><mo>×</mo><mo>|</mo><mi>q</mi><mo>|</mo><mo>×</mo><mi>U</mi></mrow><mi>m</mi></mfrac></msqrt></Formule>;
const FTube = <Formule><mi>ℓ</mi><mo>=</mo><mi>v</mi><mo>×</mo><mfrac><mi>T</mi><mn>2</mn></mfrac></Formule>;

// ---------- valeurs du parcours : électron, U = 400 V, d = 2,0 cm, v0 = 3,0×10⁷ m/s, L = 6,0 cm ----------
const P = 'electron', U0 = 400, D0 = 0.020, V0 = 3.0e7;
const E0 = M.normeE(U0, D0), F0 = M.normeF(P, U0, D0), R0 = M.rapportFP(P, U0, D0), A0 = M.accY(P, U0, D0);
const EC0 = M.gainEc(P, U0, D0, V0), EC00 = 0.5 * M.PARTICULES[P].m * V0 * V0, YS0 = M.deviation(P, U0, D0, V0) * 1000, UMAX0 = M.Umax(P, D0, V0), UACC = 250, VACC = M.vApresAcc(P, UACC);
const TR0 = { k2: M.k2(P, U0, D0, V0) / 100, xFin: 6, sort: true };
const base = { d: 2, haut: '+' };
const SC = {
  champ: { ...base },
  sens: { ...base, signes: true },
  force: { ...base, signes: true, lignes: true, part: { z: -1, xc: 11 / 3 } },
  poids: { ...base, signes: true, lignes: true, part: { z: -1, xc: 11 / 3 }, fleches: ['F'] },
  acc: { ...base, signes: true, lignes: true, axes: true, part: { z: -1, xc: 0 }, fleches: ['v0', 'F'] },
  plan: { ...base, signes: true, lignes: true, axes: true, part: { z: -1, xc: 0 }, fleches: ['v0', 'F'] },
  horaires: { ...base, signes: true, lignes: true, axes: true, part: { z: -1, xc: 0 }, fleches: ['v0', 'F'] },
  trajectoire: { ...base, signes: true, lignes: true, axes: true, part: { z: -1, xc: 0 }, fleches: ['v0', 'F'] },
  sortie: { ...base, signes: true, axes: true, part: { z: -1, xc: 0 }, fleches: ['v0'] },
  collision: { ...base, signes: true, axes: true, part: { z: -1, xc: 0 }, fleches: ['v0'], traj: TR0 },
  tec: { ...base, signes: true, axes: true, part: { z: -1, xc: 0 }, fleches: ['v0'], traj: TR0 },
};
const LEG = {
  champ: 'Deux plaques parallèles, distantes de d = 2,0 cm ; tension entre les plaques : U = 400 V. Plaques de longueur L = 6,0 cm (la barre en bas du schéma représente 1 cm).',
  sens: 'La plaque du haut est reliée à la borne positive du générateur, la plaque du bas à la borne négative.',
  force: 'Électron placé au milieu de l’intervalle. Les lignes de champ sont les flèches bleues.',
  poids: 'Électron placé au milieu de l’intervalle (la flèche de vec(F) a une longueur de principe).',
  acc: 'L’électron pénètre en O avec le vecteur vitesse vec(v)₀, perpendiculaire aux lignes de champ. L’axe Oy est tracé à gauche des plaques.',
  plan: 'Repère : Ox parallèle aux plaques, Oy perpendiculaire aux plaques et dirigé vers le haut, O au milieu de l’entrée ; Oz perpendiculaire à la figure.',
  horaires: 'Repère : O au milieu de l’entrée, Ox le long des plaques, Oy vers le haut.',
  trajectoire: 'La trajectoire sera tracée une fois son équation établie.',
  sortie: 'Repère : O au milieu de l’entrée, Ox le long des plaques, Oy vers le haut. La barre en bas du schéma représente 1 cm : les proportions sont celles de la réalité.',
  collision: 'Trajectoire de l’électron sous 400 V : l’intervalle laisse 1,0 cm de part et d’autre de l’axe Ox (la barre représente 1 cm). Le point noir marque la sortie des plaques.',
  tec: 'Trajectoire de l’électron sous 400 V, de l’entrée O à la sortie S des plaques (la barre représente 1 cm).',
};

// ====================================================
export function SimulationParticuleCondensateur() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviV, noterV] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ plaques: false, donnees: false, essayer: false, retenir: false });
  const defaut = (p, d) => { // v0 intermédiaire puis tension qui fait sortir la particule
    for (const v of [PARTS(p).v0[1], PARTS(p).v0[2]]) { const ok = M.TENSIONS.filter(U => U <= 0.9 * M.Umax(p, d / 100, v)); if (ok.length) return { v0: v, U: ok[ok.length - 1] }; }
    return { v0: PARTS(p).v0[2], U: M.TENSIONS[0] };
  };
  const [ex, setEx] = useState({ p: 'electron', d: 2.0, haut: '+', f: 10, ...defaut('electron', 2.0) });
  const [defiT, setDefiT] = useState('cible'), [dc, setDc] = useState(() => ({ ...M.tirageCible(), U: 50, tir: null })), [dv, setDv] = useState(() => ({ ...M.tirageVitesse(), rep: '', verifie: false }));
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)];

  // ---------- exploration : calcul ----------
  const Uh = ex.haut === '+' ? ex.U : -ex.U;
  const dm = ex.d / 100, pa = M.PARTICULES[ex.p], tr = M.trajet(ex.p, Uh, dm, ex.v0);
  const xcm = tr.xFin * 100 * ex.f / 20, tt = tr.tFin * ex.f / 20, sensA = Math.sign(tr.a) || 1;
  const trEx = { k2: M.k2(ex.p, Uh, dm, ex.v0) / 100, xFin: tr.xFin * 100, sort: tr.sort };
  const xm = xcm / 100, yEx = tr.a * xm * xm / (2 * ex.v0 * ex.v0), vyEx = tr.a * tt;
  const dureeTxt = t => (t < 1e-6 ? `${nbf(t * 1e9, t * 1e9 < 10 ? 2 : 1)}${NB}ns` : `${nbf(t * 1e6, 2)}${NB}µs`);
  const choisirP = p => setEx(s => ({ ...s, p, f: 10, ...defaut(p, s.d) }));
  const choisirD = d => setEx(s => ({ ...s, d, f: 10, ...defaut(s.p, d) }));

  // ---------- étapes du parcours ----------
  const calcE = [`E = frac(U|d), avec d = 2,0 cm = 2,0 × 10⁻² m.`, `E = frac(400|2,0 × 10⁻²) = ${sc(E0)}${NB}V/m.`];
  const ETAPES = [
    { id: 'champ', titre: 'Le champ entre deux plaques', focus: ['scene'],
      texte: <>Deux plaques métalliques parallèles sont reliées à un générateur de tension. Loin des bords, on admet que le champ électrique entre les plaques est <strong>uniforme</strong> (même direction, même sens, même norme en tout point) et que sa norme est donnée par : {FE}où U est la tension entre les plaques (en V) et d la distance qui les sépare (en m). Ici U = 400{NB}V et d = 2,0{NB}cm.</>,
      tache: { type: 'num', carnet: false, q: 'Norme E du champ électrique entre les plaques (en V/m)', unite: 'V/m', vrai: E0, tol: 0.05, affiche: v => sc(v), cs: 2,
        calcul: () => calcE,
        pieges: [[U0 / 2, 'La distance doit être en mètres : 2,0 cm = 2,0 × 10⁻² m (avec des centimètres, on trouverait des V/cm).'], [U0 * D0, 'Le champ est le quotient de la tension par la distance, pas leur produit.'], [D0 / U0, 'Le rapport est inversé : E = frac(U|d).']],
        expl: `E = frac(400|2,0 × 10⁻²) = ${sc(E0)} V/m.`,
        indice: 'E = frac(U|d) : convertissez d en mètres avant de diviser. Les volts divisés par des mètres donnent des V/m.' } },
    { id: 'sens', titre: 'Sens du champ', focus: ['scene'],
      texte: <>La plaque du haut est reliée à la borne <strong>positive</strong> du générateur, celle du bas à la borne <strong>négative</strong>. Le vecteur champ électrique vec(E) est perpendiculaire aux plaques.</>,
      tache: { type: 'qcm', q: 'Quel est le sens du vecteur champ électrique vec(E) entre les plaques ?', ...Q.sens,
        expl: 'Un champ électrique est dirigé de la plaque positive vers la plaque négative : ici vers le bas. Il ne dépend pas de la particule étudiée ; il est perpendiculaire aux plaques, donc pas horizontal ; et il n’est pas nul, puisque la tension entre les plaques n’est pas nulle.',
        indice: 'Les lignes de champ « partent » de la plaque positive et « arrivent » sur la plaque négative.' } },
    { id: 'force', titre: 'Force sur une particule chargée', focus: ['scene'],
      retenirTitre: 'À retenir : le champ d’un condensateur plan', retenir: <>
        <SvgCarteChamp/>
        <ul style={UL}>
          <li>Entre deux plaques parallèles, le champ est <strong>uniforme</strong> : lignes parallèles et équidistantes ; vec(E) va de la plaque + vers la plaque −.</li>
          <li>{FE}</li>
          <li>Exemple : U = 100 V et d = 1,0 cm donnent E = 1,0 × 10⁴ V/m. Moyen de s’en souvenir : <strong>« plus de tension, plus de champ ; plus d’écart, moins de champ »</strong>. Idée fausse : « le champ varie d’un point à l’autre entre les plaques ». Vrai : il est uniforme.</li>
        </ul></>,
      texte: <>On place un <strong>électron</strong>, de charge q = −e = −1,60{NB}×{NB}10⁻¹⁹{NB}C, entre les plaques. Une particule de charge q placée dans un champ vec(E) subit la force électrique : {FForce}</>,
      tache: { type: 'qcm', q: 'Quel est le sens de la force vec(F) exercée sur l’électron ?', ...Q.force,
        expl: 'Pour q < 0, vec(F) = q vec(E) est de sens opposé à vec(E) : vers le haut, vers la plaque positive. Le sens de vec(E) est celui de la force pour une charge positive seulement. La force n’est pas nulle au repos : elle ne dépend que de q et de E, pas de la vitesse. Elle est perpendiculaire aux plaques, comme vec(E), donc pas horizontale.',
        indice: 'F = q × E avec q négatif : le facteur négatif retourne le vecteur.' } },
    { id: 'poids', titre: 'Et le poids ?', focus: ['scene'],
      texte: <>Le champ entre les plaques vaut E = 2,0{NB}×{NB}10⁴{NB}V/m (étape 1) et la force électrique a pour norme F = |q|{NB}×{NB}E. L’électron a aussi un poids vec(P) = m vec(g). Données : e = 1,60{NB}×{NB}10⁻¹⁹{NB}C ; m = 9,11{NB}×{NB}10⁻³¹{NB}kg ; g = 9,8{NB}m/s².</>,
      tache: { type: 'num', carnet: false, q: 'Rapport frac(F|P) de la norme de la force électrique à celle du poids (sans unité)', unite: '', vrai: R0, tol: 0.05, affiche: v => sc(v), cs: 2,
        calcul: () => [`F = |q| × E = 1,60 × 10⁻¹⁹ × 2,0 × 10⁴ = ${sc(F0)} N.`, `P = m × g = 9,11 × 10⁻³¹ × 9,8 = ${sc(M.poids(P))} N.`, `frac(F|P) = frac(${sc(F0)}|${sc(M.poids(P))}) = ${sc(R0)} : le poids est négligeable devant la force électrique.`],
        pieges: [[1 / R0, 'Le rapport est inversé : c’est F divisée par P.'], [F0, 'C’est la force F en newtons : il faut la diviser par le poids P.'], [F0 / M.PARTICULES[P].m, 'Vous avez divisé F par la masse (c’est une accélération) : il faut la diviser par le poids P = m × g.']],
        expl: `frac(F|P) = frac(${sc(F0)}|${sc(M.poids(P))}) = ${sc(R0)}.`,
        indice: 'F = |q| × E et P = m × g, avec toutes les grandeurs en unités du système international. Puis calculez frac(F|P).' } },
    { id: 'acc', titre: 'Accélération de l’électron', focus: ['scene'],
      retenirTitre: 'À retenir : force électrique et poids', retenir: <>
        <SvgCarteForce/>
        <ul style={UL}>
          <li>{FForce}</li>
          <li>q &gt; 0 : vec(F) a le sens de vec(E) ; q &lt; 0 : vec(F) a le sens opposé. Le poids est <strong>négligeable</strong> devant la force électrique pour une particule élémentaire ou un ion. Exemple : pour un proton dans 1,0 × 10⁴ V/m, frac(F|P) ≈ 10¹¹.</li>
          <li>Moyen de s’en souvenir : <strong>« une charge + suit le champ, une charge − va à contre-courant »</strong>. Idée fausse : « toute particule est poussée dans le sens du champ ». Vrai : cela dépend du signe de q.</li>
        </ul></>,
      texte: <>Le poids est négligeable : la seule force est vec(F). L’électron entre en O, au milieu de l’intervalle, avec le vecteur vitesse vec(v)₀ perpendiculaire aux lignes de champ ; le référentiel du laboratoire est supposé galiléen. La deuxième loi de Newton donne : {FLoi}On choisit l’axe Oy vers le haut. La norme de la force est F = 3,2{NB}×{NB}10⁻¹⁵{NB}N (étape précédente) et m = 9,11{NB}×{NB}10⁻³¹{NB}kg.</>,
      tache: { type: 'num', carnet: false, q: 'Composante a_y de l’accélération (en m/s², axe Oy vers le haut)', unite: 'm/s²', vrai: A0, tol: 0.05, affiche: v => sc(v), cs: 2,
        calcul: () => ['Deuxième loi de Newton : m × vec(a) = vec(F) ; vec(F) est dirigée vers le haut (vers la plaque positive), donc F_y = +F.', `a_y = frac(F_y|m) = frac(${sc(F0)}|9,11 × 10⁻³¹) = ${sc(A0)} m/s² : positive, donc vec(a) est vers le haut.`, 'Cette accélération est constante : le champ est uniforme.'],
        pieges: [[-A0, 'Le signe est inversé : l’électron est attiré vers la plaque du haut, donc a_y est positive (axe Oy vers le haut).'], [F0, 'Vous avez oublié de diviser par la masse : a_y = frac(F_y|m).'], [F0 * M.PARTICULES[P].m, 'Il faut diviser par la masse, pas multiplier.']],
        expl: `a_y = frac(${sc(F0)}|9,11 × 10⁻³¹) = ${sc(A0)} m/s², vers le haut.`,
        indice: 'Projetez m × vec(a) = vec(F) sur Oy : m × a_y = F_y. La force est vers le haut, donc F_y est positive.' } },
    { id: 'plan', titre: 'Un mouvement plan', focus: ['scene'],
      texte: <>On choisit le repère (O ; x, y, z) : Ox parallèle aux plaques et de même sens que vec(v)₀, Oy perpendiculaire aux plaques vers le haut, Oz perpendiculaire à la figure. L’accélération a pour composante a_y = +3,5{NB}×{NB}10¹⁵{NB}m/s² selon Oy (étape précédente) ; la vitesse initiale vec(v)₀ est parallèle à Ox.</>,
      tache: { type: 'qcm', q: 'Pourquoi le mouvement reste-t-il dans le plan (Ox, Oy) de la figure ?', ...Q.plan,
        expl: 'La vitesse initiale est selon Ox et l’accélération selon Oy : ni l’une ni l’autre n’a de composante selon Oz, donc z(t) = 0 à chaque instant. La vitesse ne reste pas constante (v_y augmente), et ce n’est pas l’attraction des deux plaques qui compte : la force est vers une seule plaque. Un champ uniforme ne donne pas une droite, car vec(a) n’est pas parallèle à vec(v)₀.',
        indice: 'Écrivez z(t) à partir de a_z et de la composante v_z à t = 0 : que valent-elles ?' } },
    { id: 'horaires', titre: 'Équations horaires', focus: ['scene'],
      texte: <>Les composantes de vec(a) sont constantes : (0 ; a_y). En cherchant deux fois une primitive par rapport au temps, avec les conditions initiales à t = 0 (position O ; vitesse vec(v)₀ selon Ox), on obtient les coordonnées x(t) et y(t) de la particule.</>,
      tache: { type: 'qcm', q: 'Quelles sont les équations horaires du mouvement ?', ...Q.horaires,
        expl: 'Selon Ox, a_x = 0 : la vitesse v_x = v₀ est constante, donc x(t) = v₀ × t. Selon Oy, a_y est constante et v_y(0) = 0 : v_y = a_y × t, puis y(t) = frac(1|2) × a_y × t² (avec y(0) = 0). Un terme v₀ × t dans y(t) supposerait une vitesse initiale selon Oy, et une accélération dans x(t) un champ selon Ox : ce n’est pas le cas. La forme y = a_y × t oublierait la seconde primitive.',
        indice: 'Primitive de a_y : a_y × t + constante ; la constante est la vitesse initiale selon Oy, nulle ici. Primitive de v_y : même méthode, avec y(0) = 0.' } },
    { id: 'trajectoire', titre: 'Équation de la trajectoire', focus: ['scene'],
      texte: <>On a établi : {FHor}Pour obtenir la trajectoire, on élimine le temps : on exprime t en fonction de x grâce à x(t), puis on remplace t dans y(t).</>,
      tache: { type: 'qcm', q: 'Quelle est la forme de la trajectoire y(x) ?', ...Q.trajectoire,
        expl: 'D’après x(t), t = frac(x|v₀) ; en remplaçant dans y(t), y est proportionnel à x² : c’est un arc de parabole. Une droite correspondrait à y proportionnel à x, donc à un mouvement uniforme dans chaque direction, ce qui est faux selon Oy. Un cercle supposerait une force toujours perpendiculaire à la vitesse, ce qui n’est pas le cas ici : la force garde une direction fixe.',
        indice: 'Remplacez t par frac(x|v₀) dans y(t) = frac(1|2) a_y t² : quelle puissance de x obtenez-vous ?' } },
    { id: 'sortie', titre: 'Déviation à la sortie', focus: ['scene'],
      retenirTitre: 'À retenir : équations horaires et trajectoire', retenir: <>
        <SvgCarteTrajectoire/>
        <ul style={UL}>
          <li>Selon Ox : vitesse constante. Selon Oy : accélération constante. {FHor}</li>
          <li>En éliminant t : {FTraj}</li>
          <li>Exemple : a_y = 1,0 × 10¹⁵ m/s² et v₀ = 2,0 × 10⁷ m/s donnent y = 4,5 mm à x = 6,0 cm. Moyen de s’en souvenir : <strong>« x : uniforme ; y : uniformément accéléré »</strong>. Idée fausse : « vec(v)₀ est horizontale, donc la particule va tout droit ». Vrai : elle est déviée vers la plaque qui l’attire.</li>
        </ul></>,
      texte: <>L’équation de la trajectoire est y = frac(a_y|2 v₀²) × x² : un arc de parabole. Données : a_y = 3,5{NB}×{NB}10¹⁵{NB}m/s² (étape 5), v₀ = 3,0{NB}×{NB}10⁷{NB}m/s, longueur des plaques L = 6,0{NB}cm. La particule sort des plaques en x = L.</>,
      tache: { type: 'num', carnet: false, q: 'Ordonnée y_S de l’électron à la sortie des plaques (en mm)', unite: 'mm', vrai: YS0, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Sortie en x = L = 6,0 cm = 6,0 × 10⁻² m : y_S = frac(a_y × L²|2 × v₀²).', `y_S = frac(${sc(A0)} × (6,0 × 10⁻²)²|2 × (3,0 × 10⁷)²) = ${sc(YS0 / 1000)} m = ${nbf(YS0, 1)} mm.`, 'y_S est positive : l’électron est dévié vers le haut.'],
        pieges: [[YS0 / 1000, 'Le résultat est demandé en millimètres : 1 m = 10³ mm.'], [2 * YS0, 'Il manque le facteur 2 du dénominateur : y = frac(a_y × x²|2 × v₀²).'], [YS0 * 1e4, 'La longueur L doit être en mètres : 6,0 cm = 6,0 × 10⁻² m (avec L = 6,0, le résultat est 10⁴ fois trop grand).']],
        expl: `y_S = ${nbf(YS0, 1)} mm.`,
        indice: 'Remplacez x par L dans y = frac(a_y|2 v₀²) × x², avec L en mètres. Le résultat est en mètres : convertissez-le en millimètres.' } },
    { id: 'collision', titre: 'Sortir ou heurter une plaque', focus: ['scene'],
      texte: <>La particule ne sort des plaques que si |y_S| &lt; frac(d|2) ; sinon elle heurte une plaque avant la sortie. La déviation y_S est proportionnelle à la tension U. On cherche la tension maximale U<sub>max</sub> pour laquelle l’électron sort tout juste (|y_S| = frac(d|2)). Données : d = 2,0{NB}cm ; L = 6,0{NB}cm ; v₀ = 3,0{NB}×{NB}10⁷{NB}m/s ; m = 9,11{NB}×{NB}10⁻³¹{NB}kg ; e = 1,60{NB}×{NB}10⁻¹⁹{NB}C. On rappelle a_y = frac(e × U|m × d).</>,
      tache: { type: 'num', carnet: false, q: 'Tension maximale U_max (en V)', unite: 'V', vrai: UMAX0, tol: 0.05, affiche: v => sc(v), cs: 2,
        calcul: () => ['y_S = frac(a_y × L²|2 × v₀²) avec a_y = frac(e × U|m × d) ; on pose y_S = frac(d|2).', 'On en tire U_max = frac(m × d² × v₀²|e × L²).', `U_max = frac(9,11 × 10⁻³¹ × (2,0 × 10⁻²)² × (3,0 × 10⁷)²|1,60 × 10⁻¹⁹ × (6,0 × 10⁻²)²) = ${sc(UMAX0)} V.`],
        pieges: [[2 * UMAX0, 'La condition est |y_S| = frac(d|2) (la particule part du milieu de l’intervalle), et non |y_S| = d.'], [UMAX0 / 2, 'Il manque le facteur frac(1|2) dans y = frac(1|2) × a_y × t².']],
        expl: `U_max = ${sc(UMAX0)} V : au-delà, l’électron heurte une plaque.`,
        indice: 'Écrivez y_S = frac(e × U × L²|2 × m × d × v₀²) puis résolvez y_S = frac(d|2) pour U.' } },
    { id: 'tec', titre: 'Énergie cinétique à la sortie', focus: ['scene'],
      texte: <>L’électron a traversé les plaques de O à la sortie S. Le poids est négligé : la seule force est vec(F), constante, perpendiculaire à Ox. Le <strong>théorème de l’énergie cinétique</strong> relie la variation d’énergie cinétique de l’électron entre O et S au travail de cette force : ΔE<sub>c</sub> = W(vec(F)). Le travail d’une force constante est W = vec(F) · vec(OS). Données : E = 2,0{NB}×{NB}10⁴{NB}V/m (étape 1) ; y_S = 7,0{NB}mm (étape 9) ; e = 1,60{NB}×{NB}10⁻¹⁹{NB}C.</>,
      tache: { type: 'num', carnet: false, q: 'Variation d’énergie cinétique ΔE_c de l’électron entre l’entrée et la sortie (en J)', unite: 'J', vrai: EC0, tol: 0.05, affiche: v => sc(v), cs: 2,
        calcul: () => ['Le vecteur vec(F) est vertical (vers le haut) et vec(OS) a pour composantes (L ; y_S) : seule la composante de vec(OS) selon Oy compte, donc W = F × y_S.', `F = |q| × E = 1,60 × 10⁻¹⁹ × 2,0 × 10⁴ = ${sc(F0)} N ; y_S = 7,0 mm = 7,0 × 10⁻³ m.`, `ΔE_c = W = ${sc(F0)} × 7,0 × 10⁻³ = ${sc(EC0)} J.`, `Pour comparer : l’énergie cinétique initiale est frac(1|2) × m × v₀² = ${sc(EC00)} J, soit environ ${Math.round(EC00 / EC0)} fois plus : la vitesse à la sortie (${sc(Math.sqrt(2 * (EC00 + EC0) / 9.11e-31))} m/s) est à peine plus grande que v₀.`],
        pieges: [[EC0 * 1000, 'y_S doit être en mètres : 7,0 mm = 7,0 × 10⁻³ m.'], [F0 * 0.060, 'Le déplacement utile est y_S, selon la force, et non la longueur L des plaques : vec(F) est perpendiculaire à Ox, elle ne travaille pas selon Ox.'], [EC00, 'C’est l’énergie cinétique initiale frac(1|2) × m × v₀² : on demande la variation entre O et S, égale au travail de vec(F).']],
        expl: `ΔE_c = |q| × E × y_S = ${sc(EC0)} J.`,
        indice: 'W = vec(F) · vec(OS) : vec(F) est perpendiculaire à Ox, donc seule la composante de vec(OS) selon Oy compte. Calculez F = |q| × E, puis multipliez par y_S en mètres.' } },
    { id: 'energie', titre: 'Accélérer une particule', focus: ['scene'],
      retenirTitre: 'À retenir : sortir ou heurter une plaque', retenir: <>
        <SvgCarteCollision/>
        <ul style={UL}>
          <li>La particule sort si |y_S| &lt; frac(d|2), sinon elle heurte une plaque. {FYs}</li>
          <li>y_S augmente avec U et diminue quand v₀, m ou d augmentent. Moyen de s’en souvenir : <strong>« plus on va vite, moins on est dévié »</strong> (temps de traversée plus court). Idée fausse : « une vitesse plus grande augmente la déviation ». Vrai : elle la diminue.</li>
        </ul></>,
      texte: <>Pour donner de la vitesse à une particule, on l’accélère entre deux plaques. Un électron part du repos de la plaque négative et traverse un trou de la plaque positive ; la tension entre les plaques est U = 250{NB}V (le vide est fait, le poids est négligé). Le travail de la force électrique, constante et motrice, entre les plaques vaut W = |q|{NB}×{NB}U. Le <strong>théorème de l’énergie cinétique</strong> relie la variation d’énergie cinétique à ce travail. Données : e = 1,60{NB}×{NB}10⁻¹⁹{NB}C ; m = 9,11{NB}×{NB}10⁻³¹{NB}kg.</>,
      tache: { type: 'num', carnet: false, q: 'Vitesse v de l’électron à la sortie du trou (en m/s)', unite: 'm/s', vrai: VACC, tol: 0.05, affiche: v => sc(v), cs: 2,
        calcul: () => ['Théorème de l’énergie cinétique : frac(1|2) × m × v² − 0 = |q| × U.', <>On en tire v = {racF('2 × |q| × U', 'm')}.</>, <>v = {racF('2 × 1,60 × 10⁻¹⁹ × 250', '9,11 × 10⁻³¹')} = {sc(VACC)} m/s.</>, 'Cette vitesse est inférieure à 10 % de celle de la lumière : le calcul non relativiste est acceptable.'],
        pieges: [[VACC * VACC, 'Il manque la racine carrée : le calcul donne v², pas v.'], [VACC / Math.SQRT2, 'Il manque le facteur 2 : frac(1|2) × m × v² = |q| × U donne v² = frac(2 × |q| × U|m).'], [VACC * Math.SQRT2, 'Le facteur 2 est au mauvais endroit : v² = frac(2 × |q| × U|m).']],
        expl: <>v = {racF('2 × 1,60 × 10⁻¹⁹ × 250', '9,11 × 10⁻³¹')} = {sc(VACC)} m/s.</>,
        indice: 'Départ au repos : l’énergie cinétique finale est frac(1|2) × m × v². Elle est égale au travail |q| × U. Isolez v.' } },
    { id: 'lineaire', titre: 'L’accélérateur linéaire', focus: ['scene'],
      retenirTitre: 'À retenir : théorème de l’énergie cinétique', retenir: <>
        <SvgCarteEnergie/>
        <ul style={UL}>
          <li>Départ au repos, accélération par la tension U : {FTec}d’où {FVit}</li>
          <li>Exemple : un proton accéléré sous 1 000 V atteint 4,4 × 10⁵ m/s. Moyen de s’en souvenir : <strong>« la tension donne l’énergie, la masse règle la vitesse »</strong>. Idée fausse : « v est proportionnelle à U ». Vrai : v est proportionnelle à la racine de U.</li>
        </ul></>,
      texte: <>Pour atteindre de grandes vitesses sans tension énorme, on utilise une suite de <strong>tubes métalliques alignés</strong>, reliés alternativement aux deux bornes d’un générateur de tension alternative, de période T constante. Une particule positive est accélérée dans l’intervalle entre deux tubes, où règne un champ électrique ; à l’intérieur d’un tube, il n’y a pas de champ : sa vitesse y est constante. Le signe de la tension s’inverse à chaque demi-période : la particule retrouve un champ accélérateur à chaque intervalle.</>,
      tache: { type: 'qcm', q: 'Pourquoi les tubes sont-ils de plus en plus longs ?', ...Q.lineaire,
        expl: 'La particule gagne de la vitesse à chaque intervalle, mais la tension change de signe toutes les demi-périodes : le temps passé dans un tube est constant (une demi-période). À durée constante, la distance parcourue augmente avec la vitesse, d’où des tubes de plus en plus longs. Ce n’est pas la force ni le champ qui changent d’un tube à l’autre, et la particule ne ralentit pas dans un tube : sans champ, sa vitesse y est constante.',
        indice: 'Dans chaque tube, la vitesse est constante et la durée du passage est la même : quelle distance parcourt-on à vitesse plus grande ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : l’accélérateur linéaire', retenir: <>
        <SvgCarteLineaire/>
        <ul style={UL}>
          <li>Dans un <strong>tube</strong> : pas de champ, vitesse constante. Dans un <strong>intervalle</strong> : champ accélérateur, la vitesse augmente. La tension alternative s’inverse à chaque demi-période.</li>
          <li>Durée dans un tube : une demi-période, donc {FTube}la vitesse augmente, les tubes s’allongent.</li>
          <li>Moyen de s’en souvenir : <strong>« tubes de plus en plus longs : vitesse plus grande, même durée »</strong>. Idée fausse : « la particule ralentit dans les tubes ». Vrai : sa vitesse y est constante.</li>
        </ul></>,
      texte: <>Vous savez calculer le champ d’un condensateur plan, la force sur une particule chargée, établir les équations horaires et la parabole, prévoir la sortie ou le choc contre une plaque, appliquer le théorème de l’énergie cinétique (à la sortie des plaques et pour une accélération depuis le repos) et expliquer l’accélérateur linéaire. Passez à l’exploration (électron, proton, ions) ou tentez les deux défis.</>, tache: null },
  ];

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = t => { if (t === 'cible') { const x = M.tirageCible(); setDc({ ...x, U: 50, tir: null }); } else { const x = M.tirageVitesse(); setDv({ ...x, rep: '', verifie: false }); } };
  const changerMode = md => setMode(md);
  const choisirDefi = t => { setDefiT(t); nouveauDefi(t); };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const partNom = p => M.PARTICULES[p].nom;
  const donneesTxt = p => <>q = {M.PARTICULES[p].z < 0 ? '−' : '+'}{sc(Math.abs(M.PARTICULES[p].z) * M.E_CH, 3)}{NB}C et m = {sc(M.PARTICULES[p].m, 3)}{NB}kg</>;
  const tirer = () => {
    const tj = M.trajet(dc.p, dc.U, dc.d / 100, dc.v0), y = tj.yS * 1000, ok = tj.sort && Math.abs(Math.abs(y) - dc.yc) <= 0.1 * dc.yc;
    setDc(d => ({ ...d, tir: { ok, sort: tj.sort, y, tj } })); noterC(ok);
  };
  const dcScene = dc && (() => {
    const tj = dc.tir ? dc.tir.tj : null;
    return { d: dc.d, haut: '+', signes: true, axes: true, part: { z: M.PARTICULES[dc.p].z, xc: 0 }, fleches: ['v0'], cible: { y: dc.signe * dc.yc / 10 }, prolonge: false,
      traj: tj ? { k2: M.k2(dc.p, dc.U, dc.d / 100, dc.v0) / 100, xFin: tj.xFin * 100, sort: tj.sort } : null, choc: !!(tj && !tj.sort) };
  })();
  const dvScene = dv && (() => {
    const z = M.PARTICULES[dv.p].z, tj = M.trajet(dv.p, dv.U, dv.d / 100, dv.v0);
    return { d: dv.d, haut: '+', signes: true, axes: true, part: { z, xc: 0 }, fleches: ['v0'], traj: { k2: M.k2(dv.p, dv.U, dv.d / 100, dv.v0) / 100, xFin: tj.xFin * 100, sort: tj.sort } };
  })();
  const btnU = { ...stylePetitBouton(false, '#0369a1'), minHeight: 40, minWidth: 54 };
  const voletCible = dc && (
    <div>
      <div style={{ ...lbl, marginBottom: 8 }}>
        <strong>{partNom(dc.p)}</strong> ({donneesTxt(dc.p)}) entre au milieu de plaques distantes de <strong>d = {nbf(dc.d, 1)}{NB}cm</strong> et longues de L = 6,0{NB}cm, avec la vitesse <strong>v₀ = {sc(dc.v0)}{NB}m/s</strong> (plaque du haut positive). Réglez la tension U pour que la particule sorte des plaques <strong>dans la cible</strong>, à <strong>{nbf(dc.yc, 1)}{NB}mm</strong> de l’axe Ox (marge acceptée : 10{NB}%). Appuyez sur « Tirer » pour voir la trajectoire.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8, fontSize: 15 }}>
        <button onClick={() => setDc(d => ({ ...d, U: Math.max(5, d.U - 50), tir: null }))} aria-label="Diminuer U de 50 volts" style={btnU}>−50</button>
        <button onClick={() => setDc(d => ({ ...d, U: Math.max(5, d.U - 5), tir: null }))} aria-label="Diminuer U de 5 volts" style={btnU}>−5</button>
        <strong style={{ minWidth: 90, textAlign: 'center' }}>U = {dc.U}{NB}V</strong>
        <button onClick={() => setDc(d => ({ ...d, U: Math.min(2000, d.U + 5), tir: null }))} aria-label="Augmenter U de 5 volts" style={btnU}>+5</button>
        <button onClick={() => setDc(d => ({ ...d, U: Math.min(2000, d.U + 50), tir: null }))} aria-label="Augmenter U de 50 volts" style={btnU}>+50</button>
        <button onClick={() => setDc(d => ({ ...d, U: 50, tir: null }))} style={{ ...btnU, minWidth: 0 }}>Rétablir</button>
      </div>
      <IndiceDefi cache={!!(dc.tir && dc.tir.ok)}>{avecIndices('La déviation y_S est proportionnelle à la tension U (y_S = frac(|q| × U × L²|2 × m × d × v_0²)). Faites un premier essai (U₁ ; y₁) : pour atteindre la cible, il faut U = U₁ × frac(y_cible|y₁).')}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={tirer} style={styleBouton(true, '#15803d')}>Tirer</button>
        <button onClick={() => nouveauDefi('cible')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {dc.tir && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: dc.tir.ok ? '#15803d' : '#dc2626' }}>
        {dc.tir.ok ? `✓ Cible atteinte : la particule sort à ${nbf(Math.abs(dc.tir.y), 1)} mm de l’axe.`
          : dc.tir.sort ? `✗ Sortie à ${nbf(Math.abs(dc.tir.y), 1)} mm de l’axe (cible : ${nbf(dc.yc, 1)} mm) : ${Math.abs(dc.tir.y) < dc.yc ? 'pas assez dévié, augmentez U.' : 'trop dévié, diminuez U.'}`
            : '✗ La particule heurte une plaque avant la sortie : la tension est trop grande.'}</div>}
    </div>);
  const verifierV = () => { const ok = isFinite(lireNombre(dv.rep)) && Math.abs(lireNombre(dv.rep) - dv.vrai) <= 0.06 * dv.vrai; setDv(d => ({ ...d, verifie: true, ok })); noterV(ok); };
  const voletVitesse = dv && (
    <div>
      <div style={{ ...lbl, marginBottom: 8 }}>
        Une particule (<strong>{partNom(dv.p)}</strong> : {donneesTxt(dv.p)}) entre au milieu de plaques distantes de <strong>d = {nbf(dv.d, 1)}{NB}cm</strong>, longues de L = 6,0{NB}cm, soumises à la tension <strong>U = {dv.U}{NB}V</strong> (plaque du haut positive). Elle sort des plaques à une distance <strong>{avecIndices('y_S')} = {nbf(dv.ya, dv.ya >= 10 ? 0 : 1)}{NB}mm</strong> de l’axe Ox. Déterminez la vitesse d’entrée v₀ de la particule, avec 2 chiffres significatifs (marge acceptée : 6{NB}% ; en m/s, par exemple 3,0e7).
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>{avecIndices('v_0')} =</span>
        <input value={dv.rep} aria-label="Votre réponse" onKeyDown={e => e.key === 'Enter' && document.getElementById('cpl-verif')?.click()} onChange={e => setDv(d => ({ ...d, rep: e.target.value, verifie: false }))} inputMode="decimal"
          style={{ width: 120, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${dv.verifie ? (dv.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>m/s</span>
      </div>
      <IndiceDefi cache={dv.verifie && dv.ok}>{avecIndices('Les équations horaires donnent y_S = frac(a_y × L²|2 × v_0²) avec a_y = frac(|q| × U|m × d) : isolez v_0, en convertissant d, L et y_S en mètres (L = 6,0 cm). Gardez 4 chiffres significatifs dans les calculs intermédiaires.')}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="cpl-verif" onClick={verifierV} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi('vitesse')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {dv.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: dv.ok ? '#15803d' : '#dc2626' }}>
        {dv.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}{avecIndices(`a_y = frac(|q| × U|m × d) = ${sc(M.accY(dv.p, dv.U, dv.d / 100))} m/s² ; v_0 = `)}{racF('a × L²', '2 × y_S')}{` = ${sc(dv.vrai)} m/s.`}</div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Champ uniforme</strong> entre les plaques, de norme E = frac(U|d) (U en valeur absolue) ; les effets de bord (lignes de champ courbées près des bords) sont ignorés. Hors des plaques, il n’y a pas de champ : la trajectoire y est une droite.</li>
      <li><strong>Vide</strong> : aucun frottement ni choc avec des molécules. La charge de la particule ne modifie pas le champ.</li>
      <li><strong>Poids négligé</strong> : le rapport frac(F|P), calculé et affiché, vaut au moins 10⁸ dans toutes les situations proposées.</li>
      <li><strong>Particule non relativiste</strong> : les vitesses d’entrée proposées sont inférieures ou égales à 10 % de celle de la lumière (c = 3,00 × 10⁸ m/s) ; l’électron à 3,0 × 10⁷ m/s est exactement à cette limite, où la mécanique de Newton reste correcte à environ 1 % près. Au-delà, elle ne serait plus assez précise.</li>
      <li><strong>Référentiel galiléen</strong> : le référentiel du laboratoire.</li>
      <li><strong>Conventions</strong> : Oy vers le haut, perpendiculaire aux plaques ; U = V(plaque du haut) − V(plaque du bas), donc E_y = −frac(U|d) ; les composantes sont algébriques (le signe donne le sens par rapport à l’axe). La particule entre en O, au milieu de l’intervalle, avec vec(v)₀ selon Ox.</li>
      <li><strong>Constantes</strong> : e = 1,60 × 10⁻¹⁹ C ; m<sub>e</sub> = 9,11 × 10⁻³¹ kg ; m<sub>p</sub> = 1,67 × 10⁻²⁷ kg ; 1 u = 1,66 × 10⁻²⁷ kg (ions : 23 u pour Na⁺, 40 u pour Ca²⁺) ; g = 9,8 m/s². Les valeurs de v₀, U et d sont des valeurs choisies pour l’exemple.</li>
      <li><strong>Accélérateur linéaire</strong> : principe qualitatif ; dans un tube, la durée de passage est supposée égale à une demi-période. Les effets relativistes ne sont pas traités.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{indicesProfond(hypotheses)}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scènes ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});
  const ariaDe = id => `Schéma du condensateur plan (étape ${id}), avec une barre d'échelle de 1 centimètre`;
  const boxScene = (() => {
    if (enGuide) {
      if (idEtape === 'bilan') return null;
      if (idEtape === 'energie') return <div className="cp-sc" style={{ ...styleBoite, ...cadre('scene') }}><SceneCanon aria="Canon à particules : un électron part du repos de la plaque négative, entre deux plaques portant les signes − à gauche et + à droite, traverse un trou de la plaque positive avec une vitesse"/><div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6, marginTop: 2 }}>Deux plaques percées d’un trou : l’électron part du repos près de la plaque négative (à gauche), est accéléré par la force vec(F) (opposée à vec(E)), passe par le trou de la plaque positive (à droite) et ressort avec le vecteur vitesse vec(v). Tension entre les plaques : U = 250 V.</div></div>;
      if (idEtape === 'lineaire') return <div className="cp-sc" style={{ ...styleBoite, ...cadre('scene') }}><SceneLineaire aria="Accélérateur linéaire : cinq tubes alignés de longueurs croissantes, reliés alternativement aux deux bornes d'un générateur de tension alternative ; les signes + et − alternent d'un tube à l'autre ; une particule positive est dans l'intervalle entre les tubes 1 et 2"/><div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6, marginTop: 2 }}>Les tubes sont numérotés dans l’ordre du parcours. À l’instant représenté, la particule positive (cercle portant +) est dans l’intervalle entre les tubes 1 et 2, où règne le champ vec(E) : le tube 1 est positif, le tube 2 est négatif.</div></div>;
      return <div className="cp-sc" style={{ ...styleBoite, ...cadre('scene') }}><SceneCondensateur {...SC[idEtape]} aria={ariaDe(idEtape)}/><div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6, marginTop: 2 }}>{avecIndices(LEG[idEtape])}</div></div>;
    }
    if (enDefi) {
      if (defiT === 'cible' && dcScene) return <div className="cp-sc" style={styleBoite}><SceneCondensateur {...dcScene} aria="Condensateur plan avec la cible à atteindre à la sortie des plaques"/><div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6 }}>Les proportions sont celles de la réalité (barre de 1 cm). La cible est le cercle vert, à la sortie des plaques.</div></div>;
      if (defiT === 'vitesse' && dvScene) return <div className="cp-sc" style={styleBoite}><SceneCondensateur {...dvScene} aria="Condensateur plan avec la trajectoire observée" /><div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6 }}>Trajectoire observée de la particule, avec les proportions réelles (barre de 1 cm).</div></div>;
      return null;
    }
    return (<div className="cp-sc" style={styleBoite}>
      <div style={aide}>{avecIndices('Proportions réelles (barre de 1 cm). Avec le curseur d’instant : vec(v) est tangent à la trajectoire ; vec(F), de longueur de principe, est perpendiculaire aux plaques ; vec(a) a le même sens (valeurs dans les mesures).')}</div>
      <SceneCondensateur d={ex.d} haut={ex.haut} signes axes lignes="pale" traj={trEx} part={{ z: pa.z, xc: xcm }} fleches={['v', 'F']} sensF={sensA} choc={ex.f === 20} aria={`Condensateur plan : trajectoire d'un ${pa.nom}, avec les proportions réelles`}/>
    </div>);
  })();

  // ---------- exploration ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const unitesU = M.TENSIONS.map(U => <option key={U} value={U}>{U}{NB}V</option>);
  const resume = `${pa.symbole} · U = ${ex.U} V · v₀ = ${sc(ex.v0, 2)} m/s · d = ${nbf(ex.d, 1)} cm · plaque du haut ${ex.haut === '+' ? 'positive' : 'négative'}`;
  const reglages = enExplore && (
    <div style={styleBoite} className="cp-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez la particule, la tension et la vitesse d’entrée ; le schéma et les mesures suivent.</div>
      <label style={lbSel}>Particule
        <select value={ex.p} onChange={e => choisirP(e.target.value)} style={{ ...menu, marginTop: 2 }}>{Object.entries(M.PARTICULES).map(([id, s]) => <option key={id} value={id}>{s.nom}</option>)}</select></label>
      <label style={lbSel}>Tension U entre les plaques
        <select value={ex.U} onChange={e => setEx(s => ({ ...s, U: Number(e.target.value), f: 10 }))} style={{ ...menu, marginTop: 2 }}>{unitesU}</select></label>
      <label style={lbSel}>Vitesse d’entrée v₀
        <select value={ex.v0} onChange={e => setEx(s => ({ ...s, v0: Number(e.target.value), f: 10 }))} style={{ ...menu, marginTop: 2 }}>{pa.v0.map(v => <option key={v} value={v}>{sc(v, 2)}{NB}m/s</option>)}</select></label>
      <Section titre={`Plaques : ${resume.split(' · ').slice(3).join(' · ')}`} ouvert={ouv.plaques} onBascule={() => setOuv(o => ({ ...o, plaques: !o.plaques }))}>
        <label style={lbSel}>Distance d entre les plaques
          <select value={ex.d} onChange={e => choisirD(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{M.DISTANCES.map(d => <option key={d} value={d}>{nbf(d, 1)}{NB}cm</option>)}</select></label>
        <label style={lbSel}>Signe de la plaque du haut
          <select value={ex.haut} onChange={e => setEx(s => ({ ...s, haut: e.target.value, f: 10 }))} style={{ ...menu, marginTop: 2 }}><option value="+">positive</option><option value="−">négative</option></select></label>
        <div style={aide}>La longueur des plaques est fixée à L = 6,0 cm. Inverser le signe de la plaque du haut retourne le champ, donc la déviation.</div>
      </Section>
    </div>);
  const instant = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Instant t après l’entrée en O</div>
      <div style={aide}>Faites avancer la particule le long de sa trajectoire : t = 0 à l’entrée, dernier cran à la sortie (ou au choc).</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => setEx(s => ({ ...s, f: Math.max(0, s.f - 1) }))} aria-label="Instant précédent" style={{ ...stylePetitBouton(false, '#334155'), minWidth: 44, minHeight: 40, fontSize: 18 }}>−</button>
        <input type="range" min="0" max="20" step="1" value={ex.f} onChange={e => setEx(s => ({ ...s, f: Number(e.target.value) }))} aria-label="Instant t" style={{ flex: 1, accentColor: '#0369a1' }}/>
        <button onClick={() => setEx(s => ({ ...s, f: Math.min(20, s.f + 1) }))} aria-label="Instant suivant" style={{ ...stylePetitBouton(false, '#334155'), minWidth: 44, minHeight: 40, fontSize: 18 }}>+</button>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginTop: 4 }}>t = {dureeTxt(tt)} · x = {nbf(xcm, 2)}{NB}cm</div>
    </div>);
  const Ey = M.composanteEy(Uh, dm), Fy = M.forceY(ex.p, Uh, dm);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <div style={aide}>Valeurs calculées avec les réglages choisis (composantes sur Oy, orienté vers le haut).</div>
      <LigneMesure nom="Norme E du champ" valeur={`${sc(M.normeE(ex.U, dm))}${NB}V/m`}/>
      <LigneMesure nom="Composante E_y du champ" valeur={`${sc(Ey)}${NB}V/m`} couleur="#0369a1"/>
      <LigneMesure nom="Charge q" valeur={`${pa.z < 0 ? '−' : ''}${Math.abs(pa.z) === 1 ? '' : Math.abs(pa.z) + ' '}e`}/>
      <LigneMesure nom="Composante F_y de la force" valeur={`${sc(Fy)}${NB}N`} couleur="#b91c1c"/>
      <LigneMesure nom="Rapport frac(F|P) (force électrique sur poids)" valeur={sc(M.rapportFP(ex.p, Uh, dm))}/>
      <LigneMesure nom="Composante a_y de l’accélération" valeur={`${sc(tr.a)}${NB}m/s²`} couleur="#6d28d9"/>
      <LigneMesure nom={tr.sort ? 'Durée de la traversée' : 'Durée avant le choc'} valeur={dureeTxt(tr.tFin)}/>
      <LigneMesure nom={tr.sort ? 'Ordonnée y_S à la sortie' : 'Abscisse x_c du choc'} valeur={tr.sort ? `${nbf(tr.yS * 1000, 2)}${NB}mm` : `${nbf(tr.xc * 100, 1)}${NB}cm`}/>
      <LigneMesure nom="Abscisse x à l’instant t" valeur={`${nbf(xcm, 2)}${NB}cm`}/>
      <LigneMesure nom="Ordonnée y à l’instant t" valeur={`${nbf(yEx * 1000, 2)}${NB}mm`}/>
      <LigneMesure nom="Composante v_x à l’instant t" valeur={`${sc(ex.v0, 2)}${NB}m/s`}/>
      <LigneMesure nom="Composante v_y à l’instant t" valeur={`${sc(vyEx, 2)}${NB}m/s`}/>
      <div style={{ fontSize: 13.5, marginTop: 6, padding: '4px 8px', borderRadius: 6, background: tr.sort ? '#f0fdf4' : '#fffbeb', border: `1px solid ${tr.sort ? '#86efac' : '#fcd34d'}`, color: KIT.txt, lineHeight: 1.5 }}>
        {avecIndices(tr.sort ? `✓ La particule sort des plaques (|y_S| = ${nbf(Math.abs(tr.yS) * 1000, 1)} mm < frac(d|2) = ${nbf(ex.d * 5, 1)} mm).` : `La particule heurte une plaque avant la sortie (la déviation à la sortie dépasserait frac(d|2) = ${nbf(ex.d * 5, 1)} mm).`)}
        {M.limiteRelativiste(ex.v0) && ' La vitesse d’entrée est de l’ordre de 10 % de c : c’est la limite de validité du modèle non relativiste (écart de l’ordre de 1 %).'}</div>
    </div>);
  const donnees = enExplore && (
    <Section titre="Constantes et données" ouvert={ouv.donnees} onBascule={() => setOuv(o => ({ ...o, donnees: !o.donnees }))}>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.6 }}>
        <li>e = 1,60{NB}×{NB}10⁻¹⁹{NB}C ; g = 9,8{NB}m/s² ; L = 6,0{NB}cm</li>
        <li>électron : m = 9,11{NB}×{NB}10⁻³¹{NB}kg ; proton : m = 1,67{NB}×{NB}10⁻²⁷{NB}kg</li>
        <li>ions : Na⁺ (23{NB}u), Ca²⁺ (40{NB}u), avec 1{NB}u = 1,66{NB}×{NB}10⁻²⁷{NB}kg</li>
      </ul>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Doublez la tension U : que devient E ? Que devient la déviation y_S ? (comparez les mesures)</li>
        <li>Passez d = 1,0 cm à d = 2,0 cm : comment varient E et y_S ? Pourquoi la particule sort-elle plus facilement ?</li>
        <li>Remplacez l’électron par un proton : de quel côté est-il dévié ? Pourquoi ?</li>
        <li>Prenez la vitesse v₀ la plus grande, puis la plus petite : la particule est-elle plus ou moins déviée ?</li>
        <li>Inversez le signe de la plaque du haut : que devient le sens de vec(a) ?</li>
        <li>Lisez le rapport frac(F|P) pour chaque particule : le poids est-il jamais comparable à la force électrique ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Condensateur plan : champ uniforme, E = frac(U|d) ; vec(E) va de la plaque + vers la plaque −</li>
          <li>Force électrique : vec(F) = q vec(E) ; le poids est négligeable devant elle</li>
          <li>Entrée perpendiculaire au champ : x(t) = v₀ t et y(t) = frac(1|2) a_y t², donc y = frac(a_y|2 v₀²) x² (parabole)</li>
          <li>Sortie si |y_S| &lt; frac(d|2), sinon choc contre une plaque ; y_S augmente avec U et diminue quand v₀ augmente</li>
          <li>Théorème de l’énergie cinétique : frac(1|2) m v² = |q| U (départ au repos)</li>
          <li>Accélérateur linéaire : tension alternative, champ dans les intervalles seulement, tubes de plus en plus longs</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cp-sc { padding: 8px 6px !important; } @media (min-width: 600px) { .cp-sc { padding: 14px 16px !important; } }
        .cp-col { display: flex; flex-direction: column; gap: 12px; }
        .cp-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .cp-l1.cote .cp-carte { order: 2; } .cp-l1.cote .cp-main { order: 1; }
          .cp-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .cp-ex > * { grid-column: 1; } .cp-ex > .cp-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .cp-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .cp-in { animation: cp-fondu 0.35s ease-out; } @keyframes cp-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Particule chargée dans un condensateur plan</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      {(enGuide || enDefi) && <div className={`cp-l1${enGuide ? ' cote' : ''}`}>
        {enGuide ? <div className="cp-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="cp-carte">{panneauHypo}</div>}
        <div className="cp-main">
          <div className="cp-col">
            {boxScene && <div className="cp-in" key={enGuide ? 's-' + idEtape : 'd' + defiT}>{boxScene}</div>}
          </div>
          {enDefi && <div style={{ ...styleBoite, marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {[['cible', 'Atteindre la cible'], ['vitesse', 'Retrouver la vitesse']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defiT === t} style={stylePetitBouton(defiT === t, '#0369a1')}>{l}</button>)}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defiT === 'cible' ? 'Défi : où sort la particule ?' : 'Défi : à quelle vitesse est-elle entrée ?'}</div>
            {defiT === 'cible' ? voletCible : voletVitesse}
            <SuiviDefi cle={`${SIM_ID}:defi.${defiT}`} etat={defiT === 'cible' ? suiviC : suiviV}/>
          </div>}
        </div>
      </div>}
      {enExplore && <div className="cp-ex">
        <div>{boxScene}</div>
        <div>{instant}</div>
        <div className="cp-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{donnees}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
function PARTS(p) { return M.PARTICULES[p]; }
