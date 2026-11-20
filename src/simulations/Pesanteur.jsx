import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, Vec,
  BoutonsModes, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, Curseur, FormuleEnLigne } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./pesModele";
import { QCM_PARCOURS as Q } from "./pesQcm";
import { COLP, vecteursMasques } from "./pesOutils";
import { SceneProjectile, ScenePlan, GrapheTemps, LegendeCourbes, SvgPoidsSeulCarte, SvgVitesseCarte, SvgTrajectoireCarte, SvgSommetPorteeCarte, SvgEnergiesCarte, SvgLimiteCarte } from "./pesSchemas";

const SIM_ID = 175, CLE_GUIDE = 'pesanteur-tg-guide-v1';
declarerDefis(SIM_ID, [['cible', 'Atteindre la cible'], ['lecture', 'Retrouver la vitesse initiale']]);

// ====================================================
// SIM 175 — MOUVEMENT DANS UN CHAMP DE PESANTEUR UNIFORME : ÉQUATIONS HORAIRES ET TRAJECTOIRE
//  (TG spé PC, « Relier les actions appliquées à un système à son mouvement », sous-partie « Mouvement dans un champ uniforme »).
//  Capacités visées (jamais affichées à l'élève) : montrer que le mouvement dans un champ uniforme est plan ; établir et exploiter les équations horaires ;
//  établir l'équation de la trajectoire ; exploiter la conservation de l'énergie mécanique / le théorème de l'énergie cinétique ; évolution de Ec, Epp, Em ; primitives, représentation paramétrique.
//  Modèle : pesModele.js (test : pesModele.test.mjs).
// ====================================================

const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const P0 = { v0: 10, alpha: 30, h: 2.0, g: M.G_TERRE }, MASSE = 0.5;
const tS0 = M.tSommet(P0), yMax0 = M.hauteurMax(P0), tV0 = M.dureeVol(P0), L0 = M.portee(P0), vF0 = M.vitesseSol(P0);
const IDS = ['forces', 'loi', 'plan', 'vitesse', 'sommet', 'position', 'fleche', 'trajectoire', 'vol', 'portee', 'energies', 'tec', 'limite', 'bilan'];
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const V0 = <><Vec n="v"/><sub>0</sub></>;

// ---------- formules (MathML) ----------
// racine carrée en MathML au fil du texte : « v_0² + 2 g h » → indices et carré vrais sous une vraie racine
const Rac = ({ t }) => {
  const out = []; let dernier = 0, m, k = 0; const re = /([A-Za-zΔ])_([A-Za-z0-9]+)(²?)/g;
  const txt = x => { if (x) out.push(<mtext key={k++}>{x.replace(/ /g, '\u00a0')}</mtext>); };
  while ((m = re.exec(t))) { txt(t.slice(dernier, m.index)); out.push(m[3] ? <msubsup key={k++}><mi>{m[1]}</mi><mn>{m[2]}</mn><mn>2</mn></msubsup> : <msub key={k++}><mi>{m[1]}</mi><mn>{m[2]}</mn></msub>); dernier = m.index + m[0].length; }
  txt(t.slice(dernier));
  return <FormuleEnLigne><msqrt><mrow>{out}</mrow></msqrt></FormuleEnLigne>;
};
const RacinesT = <FormuleEnLigne><mi>t</mi><mo>=</mo><mfrac><mrow><mo>−</mo><mi>b</mi><mo>±</mo><msqrt><mi>Δ</mi></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></FormuleEnLigne>;
const RacineV0 = val => <><FormuleEnLigne><msub><mi>v</mi><mn>0</mn></msub><mo>=</mo><msqrt><mfrac><mrow><mi>P</mi><mo>×</mo><mi>g</mi></mrow><mrow><mi>sin</mi><mn>2</mn><mi>α</mi></mrow></mfrac></msqrt></FormuleEnLigne> = {val} m/s.</>;
const vec = (l, ind) => (ind ? <msub><mover><mi>{l}</mi><mo>→</mo></mover><mi>{ind}</mi></msub> : <mover><mi>{l}</mi><mo>→</mo></mover>);
const FNewton = <Formule><mo>∑</mo>{vec('F')}<mo>=</mo><mi>m</mi><mo>×</mo>{vec('a')}</Formule>;
const FEcPot = <Formule><msub><mi>E</mi><mi>c</mi></msub><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>m</mi><msup><mi>v</mi><mn>2</mn></msup><mo>,</mo><mspace width="1em"/><msub><mi>E</mi><mrow><mi>pp</mi></mrow></msub><mo>=</mo><mi>m</mi><mi>g</mi><mi>y</mi></Formule>;
const FTec = <Formule><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>m</mi><msubsup><mi>v</mi><mi>f</mi><mn>2</mn></msubsup><mo>−</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>m</mi><msubsup><mi>v</mi><mn>0</mn><mn>2</mn></msubsup><mo>=</mo><mi>W</mi><mo>(</mo>{vec('P')}<mo>)</mo><mo>=</mo><mi>m</mi><mi>g</mi><mi>h</mi></Formule>;
const FYt = <Formule><mi>y</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mo>−</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>g</mi><msup><mi>t</mi><mn>2</mn></msup><mo>+</mo><msub><mi>v</mi><mn>0</mn></msub><mi>sin</mi><mi>α</mi><mo>×</mo><mi>t</mi><mo>+</mo><mi>h</mi></Formule>;

// ---------- scènes du parcours ----------
const SC = {
  forces: { vecs: ['v0'], trajet: 'aucune', grad: false },
  loi: { vecs: ['v0', 'P'], trajet: 'aucune', grad: false },
  vitesse: { vecs: ['v0'], comp: true, trajet: 'aucune', grad: false },
  sommet: { vecs: ['v0'], trajet: 'aucune', grad: false }, position: { vecs: ['v0'], trajet: 'aucune', grad: false }, fleche: { vecs: ['v0'], trajet: 'aucune', grad: false },
  trajectoire: { vecs: ['v0'], trajet: 'aucune', grad: false }, vol: { trajet: 'complete', grad: false }, portee: { trajet: 'complete', grad: false },
  energies: { trajet: 'complete', grad: false, graphe: 'energies' },
  tec: { trajet: 'complete', grad: false },
  bilan: { trajet: 'complete', grad: true },
};
const SERIES_E = (m, p, avecEm) => [
  { nom: 'E_c (trait plein)', f: t => M.energies(p, m, t).Ec, c: COLP.traj },
  { nom: 'E_pp (tirets)', f: t => M.energies(p, m, t).Epp, c: COLP.P, dash: '8 5' },
  ...(avecEm ? [{ nom: 'E_m (pointillés)', f: t => M.energies(p, m, t).Em, c: COLP.vert, dash: '2 5', w: 2.6 }] : []),
];


function ReglageDefi({ nom, valeur, min, max, pas, unite, dec, onChange, aide }) {
return (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{avecIndices(nom)}</span><span style={{ color: KIT.txt }}>{nbf(valeur, dec)}{NB}{unite}</span></div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button type="button" aria-label={`Diminuer ${nom}`} onClick={() => onChange(Math.max(min, Math.round((valeur - pas) * 100) / 100))} style={{ ...stylePetitBouton(false), minWidth: 40, minHeight: 40, fontSize: 20, lineHeight: 1 }}>−</button>
      <input type="range" min={min} max={max} step={pas} value={valeur} aria-label={nom} onChange={e => onChange(parseFloat(e.target.value))} style={{ flex: 1, accentColor: COLP.traj, minWidth: 0 }}/>
      <button type="button" aria-label={`Augmenter ${nom}`} onClick={() => onChange(Math.min(max, Math.round((valeur + pas) * 100) / 100))} style={{ ...stylePetitBouton(false), minWidth: 40, minHeight: 40, fontSize: 20, lineHeight: 1 }}>+</button>
    </div>
    {aide && <div style={{ fontSize: 12.5, color: KIT.txt2 }}>{avecIndices(aide)}</div>}
  </div>);
}

// ====================================================
export function SimulationPesanteur() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviL, noterL] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('cible');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ regl: false, mes: false, courbes: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ corps: 'terre', v0: 10, alpha: 30, h: 2, t: 0.5, vecs: 'va', courbe: 'xy' });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)];

  // ---------- exploration ----------
  const pE = { v0: ex.v0, alpha: ex.alpha, h: ex.h, g: M.CORPS[ex.corps].g };
  const TE = M.dureeVol(pE), tE = Math.min(ex.t, TE);
  const bE = M.pos(pE, tE), vE = M.vit(pE, tE), enE = M.energies(pE, MASSE, tE);
  const setE = f => setEx(s => { const n = { ...s, ...f }, p = { v0: n.v0, alpha: n.alpha, h: n.h, g: M.CORPS[n.corps].g }; return { ...n, t: Math.min(n.t, M.dureeVol(p)) }; });

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'forces', titre: 'Le système et les forces',
      texte: <>Un joueur lance une balle de masse m = 0,50{NB}kg depuis une terrasse, à h = 2,0{NB}m au-dessus du sol. À t = 0, le vecteur vitesse initiale {V0} a pour norme v_0 = 10{NB}m/s ; il est incliné de α = 30° au-dessus de l’horizontale (flèche grise). On étudie le centre de masse de la balle dans le référentiel terrestre, supposé galiléen, en négligeant l’action de l’air.</>,
      tache: { type: 'qcm', q: 'Une fois la balle partie de la main, quelles forces s’exercent sur elle ?', ...Q.forces,
        expl: 'Le poids est la seule force : l’air est négligé et la main a lâché la balle. Il n’existe pas de « force du lancer » qui continuerait d’agir (la vitesse n’est pas une force), ni de force qui la soutiendrait : elle tombe en permanence.',
        indice: 'Faites la liste des contacts (main, air, support) et des actions à distance. Que reste-t-il quand la main a lâché la balle et que l’air est négligé ?' } },
    { id: 'loi', titre: 'La deuxième loi de Newton',
      texte: <>Le poids de la balle est vec(P) = m vec(g), où vec(g) est le champ de pesanteur : vertical, vers le bas, de norme g = 9,8{NB}m/s², supposé uniforme sur toute la trajectoire. Dans un référentiel galiléen, la deuxième loi de Newton s’écrit {FNewton}où m est la masse de la balle et vec(a) l’accélération de son centre de masse.</>,
      tache: { type: 'qcm', q: 'Le poids est la seule force : quelles sont la direction et le sens de vec(a) ?', ...Q.accel,
        expl: 'Σ vec(F) = vec(P) = m vec(g) = m vec(a) : la masse se simplifie, vec(a) = vec(g) à tout instant, vertical et vers le bas. Ce n’est pas le sens du mouvement qui fixe celui de vec(a) (la balle monte, puis descend, avec la même accélération), et elle n’est pas nulle au sommet : seule la composante verticale de la vitesse s’y annule.',
        indice: 'Écrivez Σ vec(F) avec le poids seul, puis simplifiez par la masse m.' } },
    { id: 'plan', titre: 'Un mouvement plan',
      texte: <>Placez l’origine O au pied de la terrasse. Le vecteur vitesse initiale {V0} et le champ vec(g) (vertical) ne sont pas colinéaires : ils définissent un plan vertical (en bleu sur la figure). Un axe Oz perpendiculaire à ce plan est tracé en tirets.</>,
      tache: { type: 'qcm', q: 'Pourquoi la balle reste-t-elle dans le plan vertical qui contient sa vitesse initiale ?', ...Q.plan,
        expl: 'La variation de la vitesse entre deux instants est Δvec(v) = vec(a) × Δt avec vec(a) = vec(g), vertical : elle reste dans le plan défini par la verticale et la vitesse initiale, donc la composante selon Oz de la vitesse reste nulle. La direction de la vitesse change (elle s’incline vers le bas), il n’existe plus de force du lancer une fois la balle lâchée, et la masse ne joue aucun rôle.',
        indice: 'Comment la vitesse change-t-elle entre deux instants ? Δvec(v) = vec(a) × Δt : dans quelle direction pointe cette variation ?' } },
    { id: 'vitesse', titre: 'Les équations horaires : la vitesse',
      retenirTitre: 'Le poids seul fixe l’accélération', retenir: <>
        <SvgPoidsSeulCarte/>
        <ul style={UL}>
          <li>Poids seul, champ uniforme : <strong>vec(a) = vec(g)</strong>, la même accélération pour toutes les masses.</li>
          <li>Axe Oy vers le haut : a_x = 0 et a_y = −g (le signe − vient du sens de l’axe, pas de la valeur g = 9,8 m/s² qui est positive).</li>
          <li>Moyen de s’en souvenir : <strong>« poids seul, m se simplifie »</strong>. Idée fausse : « une balle lourde tombe avec une plus grande accélération ». Vrai : sans air, tous les corps ont la même.</li>
        </ul></>,
      texte: <>Dans ce plan, on prend Ox horizontal vers la droite et Oy vertical vers le <strong>haut</strong>. On projette vec(a) = vec(g) : a_x = 0 et a_y = −g (vec(g) est dirigé vers le bas, donc opposé à l’axe Oy). À t = 0, la vitesse initiale se décompose en v_x(0) = v_0 cos α et v_y(0) = v_0 sin α (pointillés). On obtient v_x(t) et v_y(t) en cherchant une <strong>primitive</strong> de a_x et de a_y, la constante étant fixée par ces conditions initiales.</>,
      tache: { type: 'qcm', q: 'Quelles sont les expressions de v_x(t) et v_y(t) ?', ...Q.vitesse,
        expl: 'a_x = 0 a pour primitive une constante, égale à v_x(0) = v_0 cos α. a_y = −g a pour primitive −g t + constante, avec la constante v_y(0) = v_0 sin α. Le signe de g t est négatif (axe vers le haut) ; −½ g t² + v_0 sin α t est la position y(t), pas la vitesse ; et la vitesse horizontale ne dépend pas du temps, car aucune force horizontale ne s’exerce.',
        indice: 'La primitive de 0 est une constante. La primitive de −g est −g t + constante. Les constantes sont les valeurs de v_x et v_y à t = 0.' } },
    { id: 'sommet', titre: 'La date du sommet',
      retenirTitre: 'Primitive et condition initiale', retenir: <>
        <SvgVitesseCarte/>
        <ul style={UL}>
          <li>Pour passer de l’accélération à la vitesse : <strong>primitive + condition initiale</strong>.</li>
          <li>Exemple de la simulation : v_0 = 10 m/s et α = 30° donnent v_x = 8,7 m/s (constante) et v_y(0) = 5,0 m/s.</li>
          <li>Moyen de s’en souvenir : <strong>« horizontal : rien ne change ; vertical : −g t »</strong>. Idée fausse : « la vitesse horizontale diminue peu à peu ». Vrai : sans force horizontale, v_x est constante.</li>
        </ul></>,
      texte: <>Rappel : v_y(t) = −g t + v_0 sin α, avec v_0 = 10{NB}m/s, α = 30° et g = 9,8{NB}m/s². Au sommet de la trajectoire, la balle cesse de monter avant de redescendre : sa vitesse n’est plus que horizontale.</>,
      tache: { type: 'num', carnet: false, q: 'Date t_s du sommet (en s)', unite: 's', vrai: tS0, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Au sommet, la composante verticale de la vitesse s’annule : v_y(t_s) = 0, soit −g t_s + v_0 sin α = 0.', `t_s = frac(v_0 sin α|g) = frac(10 × sin 30°|9,8) = frac(5,0|9,8) = ${nbf(tS0, 2)} s.`],
        pieges: [[10 / 9.8, 'Vous avez oublié sin α : la composante verticale de la vitesse initiale est v_0 sin α = 5,0 m/s, pas v_0.'], [9.8 / 5, 'Le rapport est inversé : t_s = frac(v_0 sin α|g).'], [10 * Math.cos(Math.PI / 6) / 9.8, 'Vous avez utilisé cos α : c’est la composante horizontale. Pour monter, c’est la composante verticale v_0 sin α qui compte.']],
        expl: `v_y(t_s) = 0 donne t_s = frac(5,0|9,8) = ${nbf(tS0, 2)} s.`,
        indice: 'Au sommet, v_y = 0 : résolvez −g t + v_0 sin α = 0 pour trouver t.' } },
    { id: 'position', titre: 'Les équations horaires : la position',
      texte: <>On recommence avec les primitives de v_x(t) et v_y(t). Les conditions initiales de position sont : x(0) = 0 (origine au pied de la terrasse) et y(0) = h = 2,0{NB}m (la balle part de la terrasse).</>,
      tache: { type: 'qcm', q: 'Quelles sont les équations horaires x(t) et y(t) ?', ...Q.position,
        expl: 'x(t) est la primitive de la constante v_0 cos α, nulle en t = 0 : x = v_0 cos α × t. y(t) est la primitive de −g t + v_0 sin α : −½ g t² + v_0 sin α × t, plus la constante y(0) = h. Oublier le ½ ou la hauteur h donne une mauvaise position ; la position horizontale n’est pas accélérée.',
        indice: 'La primitive de −g t est −½ g t² (on dérive pour vérifier). La constante d’intégration est la position initiale : x(0) = 0 et y(0) = h.' } },
    { id: 'fleche', titre: 'La flèche : hauteur maximale',
      texte: <>Les équations horaires sont x(t) = v_0 cos α × t et {FYt}avec h = 2,0{NB}m, v_0 sin α = 5,0{NB}m/s et g = 9,8{NB}m/s². La balle est au sommet à la date t_s = {nbf(tS0, 2)}{NB}s (étape 5). L’axe Oy est orienté vers le haut.</>,
      tache: { type: 'num', carnet: false, q: 'Altitude maximale y_max atteinte par la balle (en m)', unite: 'm', vrai: yMax0, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['On remplace t par t_s dans y(t) : y_max = −½ g t_s² + v_0 sin α × t_s + h.', `y_max = −0,5 × 9,8 × ${nbf(tS0, 2)}² + 5,0 × ${nbf(tS0, 2)} + 2,0 = ${nbf(-4.9 * tS0 * tS0, 2)} + ${nbf(5 * tS0, 2)} + 2,0 = ${nbf(yMax0, 2)} m.`, 'Cette altitude est comptée à partir du sol : la balle monte de y_max − h au-dessus de la terrasse.'],
        pieges: [[yMax0 - 2, 'Vous avez oublié la hauteur h de la terrasse : y(0) = h, l’altitude est comptée depuis le sol.'], [5 * tS0 + 2 - 9.8 * tS0 * tS0, 'Vérifiez le facteur ½ : le terme est −½ g t² (4,9 t²), pas −g t².'], [100 / 19.6, 'Vous avez utilisé v_0 au lieu de v_0 sin α : seule la composante verticale compte.']],
        expl: `y_max = ${nbf(-4.9 * tS0 * tS0, 2)} + ${nbf(5 * tS0, 2)} + 2,0 = ${nbf(yMax0, 2)} m, soit ${nbf(yMax0 - 2, 2)} m au-dessus de la terrasse.`,
        indice: 'Remplacez t par la date du sommet dans y(t) : y = −½ g t² + v_0 sin α × t + h. Gardez trois chiffres dans les calculs intermédiaires.' } },
    { id: 'trajectoire', titre: 'La trajectoire : éliminer le temps',
      texte: <>Les équations horaires x(t) et y(t) forment une représentation paramétrique de la courbe décrite par la balle. Pour obtenir la trajectoire, on élimine le paramètre t : de x(t) = v_0 cos α × t, on tire t = frac(x|v_0 cos α), puis on remplace t dans y(t).</>,
      tache: { type: 'qcm', q: 'Quelle est la nature de la courbe y(x) obtenue ?', ...Q.trajectoire,
        expl: 'En remplaçant t, le terme −½ g t² devient proportionnel à x² : y(x) = −frac(g|2 v_0² cos²α) × x² + tan α × x + h, un polynôme du second degré en x, dont la courbe est une parabole (concave, car le coefficient de x² est négatif). Une droite n’aurait pas de terme en x², et un cercle ou une hyperbole ne s’obtiennent pas ainsi.',
        indice: 'Remplacez t par frac(x|v_0 cos α) dans −½ g t² : quelle puissance de x obtenez-vous ?' } },
    { id: 'vol', titre: 'La durée du vol',
      retenirTitre: 'Équations horaires et trajectoire', retenir: <>
        <SvgTrajectoireCarte/>
        <ul style={UL}>
          <li>Position : x(t) = v_0 cos α × t et y(t) = −½ g t² + v_0 sin α × t + h. En éliminant t : <strong>y(x) est un polynôme du second degré, la trajectoire est une parabole</strong>.</li>
          <li>Exemple de la simulation (v_0 = 10 m/s, α = 30°, h = 2,0 m) : y(x) = −0,065 x² + 0,58 x + 2,0, avec x et y en m ; le terme en x² est négatif : la parabole est tournée vers le bas.</li>
          <li>Moyen de s’en souvenir : <strong>« t disparaît, x² apparaît »</strong>. Idée fausse : « la trajectoire est une droite jusqu’au sommet ». Vrai : la courbure est présente dès le départ.</li>
        </ul></>,
      texte: <>La balle touche le sol quand y(t) = 0 (le sol est à l’altitude 0). Il faut résoudre y(t) = 0, soit −4,9 t² + 5,0 t + 2,0 = 0 (coefficients en unités SI : −½ g = −4,9 m/s², v_0 sin α = 5,0 m/s, h = 2,0 m). C’est une équation du second degré en t ; on garde la racine positive.</>,
      tache: { type: 'num', carnet: false, q: 'Durée t_v du vol, jusqu’à l’arrivée au sol (en s)', unite: 's', vrai: tV0, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Équation −4,9 t² + 5,0 t + 2,0 = 0 : a = −4,9 ; b = 5,0 ; c = 2,0.', 'Discriminant : Δ = b² − 4ac = 5,0² − 4 × (−4,9) × 2,0 = 25 + 39,2 = 64,2.', <>Racines : {RacinesT} avec <Rac t="Δ"/> = 8,01, soit t = frac(−5,0 ± 8,01|−9,8), donc {nbf(tV0, 2)} s ou −0,31 s. La racine négative n’a pas de sens physique : t_v = {nbf(tV0, 2)} s.</>],
        pieges: [[2 * tS0, 'Vous avez supposé la montée et la descente de même durée : c’est faux ici, car la balle retombe plus bas que son point de départ (h = 2,0 m).'], [tS0, 'C’est la date du sommet : il faut résoudre y(t) = 0, la date d’arrivée au sol.'], [-0.307, 'Vous avez gardé la racine négative : une durée est positive, on garde l’autre racine.']],
        expl: `t_v = frac(−5,0 − 8,01|−9,8) = ${nbf(tV0, 2)} s (racine positive).`,
        indice: 'Équation du second degré a t² + b t + c = 0 avec a = −4,9 ; b = 5,0 ; c = 2,0. Calculez Δ = b² − 4ac, puis les deux racines, et gardez la positive.' } },
    { id: 'portee', titre: 'La portée',
      texte: <>La durée du vol est t_v = {nbf(tV0, 2)}{NB}s (étape précédente). Pendant ce temps, la composante horizontale de la vitesse reste constante : a_x = 0. On rappelle v_0 = 10{NB}m/s et α = 30°. La <strong>portée</strong> est la distance horizontale, au sol, entre le pied de la terrasse et le point d’arrivée.</>,
      tache: { type: 'num', carnet: false, q: 'Portée de la balle (en m)', unite: 'm', vrai: L0, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => [`x(t_v) = v_0 cos α × t_v = 10 × cos 30° × ${nbf(tV0, 2)} = ${nbf(10 * Math.cos(Math.PI / 6), 2)} × ${nbf(tV0, 2)} = ${nbf(L0, 1)} m.`, 'La composante verticale de la vitesse ne joue aucun rôle dans le déplacement horizontal.'],
        pieges: [[10 * tV0, 'Vous avez oublié cos α : seule la composante horizontale v_0 cos α = 8,7 m/s intervient.'], [10 * Math.cos(Math.PI / 6) * tS0, 'Vous avez utilisé la date du sommet : la balle continue d’avancer jusqu’au sol, jusqu’à t_v.'], [10 * Math.sin(Math.PI / 6) * tV0, 'Vous avez utilisé sin α (composante verticale) : l’avancée horizontale se calcule avec cos α.']],
        expl: `x(t_v) = ${nbf(10 * Math.cos(Math.PI / 6), 2)} × ${nbf(tV0, 2)} = ${nbf(L0, 1)} m.`,
        indice: 'Portée = x(t_v) = v_0 cos α × t_v : v_0 cos α est la vitesse horizontale, constante.' } },
    { id: 'energies', titre: 'Les énergies au cours du vol',
      retenirTitre: 'Sommet, durée du vol, portée', retenir: <>
        <SvgSommetPorteeCarte/>
        <ul style={UL}>
          <li><strong>Sommet : v_y = 0</strong> (la vitesse y est horizontale) ; <strong>sol : y = 0</strong>, d’où la durée du vol ; <strong>portée = v_x × durée du vol</strong>.</li>
          <li>Exemple de la simulation : t_s = 0,51 s, flèche y_max = 3,28 m, durée 1,33 s et portée 11,5 m.</li>
          <li>Moyen de s’en souvenir : <strong>« sommet : v_y = 0, sol : y = 0 »</strong>. Idée fausse : « montée et descente durent autant ». Vrai : seulement si l’arrivée est à l’altitude du départ.</li>
        </ul></>,
      texte: <>On prend le sol comme référence : l’énergie potentielle de pesanteur est E_pp = m g y (nulle au sol) et l’énergie cinétique E_c = ½ m v², avec m = 0,50{NB}kg. Le graphique montre E_c et E_pp de la balle en fonction du temps.{FEcPot}</>,
      tache: { type: 'qcm', q: 'E_c et E_pp varient en sens inverse. Que dire de leur somme, l’énergie mécanique E_m, pendant le vol ?', ...Q.energies,
        expl: 'Le poids est la seule force qui travaille : l’énergie cinétique perdue à la montée est gagnée en énergie potentielle, et inversement à la descente, donc E_m = E_c + E_pp est constante (frottements négligés). Elle ne diminue pas (il n’y aurait de perte que s’il y avait des frottements), n’augmente pas, et n’est pas nulle : au sommet, E_c n’est pas nulle car la balle garde sa vitesse horizontale.',
        indice: 'Regardez les deux courbes aux mêmes dates : quand l’une monte de 1 J, que fait l’autre ? Additionnez.' } },
    { id: 'tec', titre: 'La vitesse d’arrivée, sans le temps',
      texte: <>On veut la norme v_f de la vitesse à l’arrivée au sol, sans passer par la date. On applique le théorème de l’énergie cinétique entre le lancer et l’arrivée : {FTec}Le poids est la seule force, et son travail ne dépend que de la dénivelée h = 2,0{NB}m (descente). Données : m = 0,50{NB}kg ; v_0 = 10{NB}m/s ; g = 9,8{NB}m/s².</>,
      tache: { type: 'num', carnet: false, q: 'Norme v_f de la vitesse à l’arrivée au sol (en m/s)', unite: 'm/s', vrai: vF0, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => [<>La masse se simplifie : v_f² − v_0² = 2 g h, donc v_f = <Rac t="v_0² + 2 g h"/>.</>, <>v_f = <Rac t="10² + 2 × 9,8 × 2,0"/> = <Rac t="100 + 39,2"/> = <Rac t={nbf(100 + 39.2, 1)}/> = {nbf(vF0, 1)} m/s.</>, 'La vitesse d’arrivée dépend de v_0 et de h, mais pas de l’angle α (poids seul).'],
        pieges: [[10, 'Vous avez oublié le travail du poids : la balle descend de h = 2,0 m, elle gagne de la vitesse.'], [Math.sqrt(100 - 39.2), 'Le signe est inversé : en descendant, la balle gagne de l’énergie cinétique (+ m g h).'], [100 + 39.2, 'Vous avez oublié la racine carrée : v_f² vaut 139,2 m²/s².'], [10 + Math.sqrt(39.2), 'Les vitesses ne s’additionnent pas ainsi : c’est v_f² = v_0² + 2 g h.']],
        expl: <>v_f = <Rac t="100 + 39,2"/> = {nbf(vF0, 1)} m/s.</>,
        indice: 'Multipliez les deux membres par frac(2|m) : v_f² − v_0² = 2 g h. Isolez v_f puis calculez avec 4 chiffres significatifs avant d’arrondir.' } },
    { id: 'limite', titre: 'Les limites du modèle',
      retenirTitre: 'Énergie mécanique constante', retenir: <>
        <SvgEnergiesCarte/>
        <ul style={UL}>
          <li>Poids seul : <strong>E_m = E_c + E_pp reste constante</strong> ; théorème de l’énergie cinétique : ½ m v_f² − ½ m v_0² = m g h.</li>
          <li>Exemple de la simulation : v_0 = 10 m/s et h = 2,0 m donnent v_f = 11,8 m/s, quel que soit l’angle de lancer.</li>
          <li>Moyen de s’en souvenir : <strong>« E_c monte quand E_pp descend »</strong>. Idée fausse : « au sommet, l’énergie cinétique est nulle ». Vrai : la vitesse horizontale subsiste.</li>
        </ul></>,
      texte: <>Le modèle suppose que l’air n’exerce aucune force. Estimations (ordres de grandeur) de la force de frottement f de l’air comparée au poids P, pour deux lancers : <table style={{ borderCollapse: 'collapse', margin: '6px 0 0', fontSize: 14 }}><tbody>
        <tr><td style={{ border: '1px solid #cbd5e1', padding: '3px 8px', fontWeight: 700 }}>Lancer</td><td style={{ border: '1px solid #cbd5e1', padding: '3px 8px', fontWeight: 700 }}>f</td><td style={{ border: '1px solid #cbd5e1', padding: '3px 8px', fontWeight: 700 }}>P</td></tr>
        <tr><td style={{ border: '1px solid #cbd5e1', padding: '3px 8px' }}>Boule de pétanque à 10{NB}m/s</td><td style={{ border: '1px solid #cbd5e1', padding: '3px 8px' }}>0,1{NB}N</td><td style={{ border: '1px solid #cbd5e1', padding: '3px 8px' }}>7{NB}N</td></tr>
        <tr><td style={{ border: '1px solid #cbd5e1', padding: '3px 8px' }}>Ballon de football à 25{NB}m/s</td><td style={{ border: '1px solid #cbd5e1', padding: '3px 8px' }}>4{NB}N</td><td style={{ border: '1px solid #cbd5e1', padding: '3px 8px' }}>4{NB}N</td></tr></tbody></table></>,
      tache: { type: 'qcm', q: 'Pour lequel de ces deux lancers le modèle du poids seul est-il le moins bien adapté ?', ...Q.limite,
        expl: 'Pour la boule, f représente environ 1 à 2 % du poids : le poids seul décrit bien le mouvement. Pour le ballon rapide, f est du même ordre que P : la trajectoire réelle s’écarte nettement de la parabole (portée plus courte). Le modèle est donc valable seulement si f reste petit devant P ; l’air n’est pas toujours négligeable.',
        indice: 'Comparez f et P dans chaque ligne du tableau : le modèle du poids seul est bon quand f est très petit devant P.' } },
    { id: 'bilan', titre: 'Bilan',
      retenirTitre: 'Limite du modèle : l’air', retenir: <>
        <SvgLimiteCarte/>
        <ul style={UL}>
          <li>Le modèle « poids seul » est valable si <strong>f ≪ P</strong> : vitesse modérée, objet dense et compact.</li>
          <li>Exemple : à 25 m/s, un ballon a une portée bien plus courte que la parabole idéale (estimation, même échelle).</li>
          <li>Moyen de s’en souvenir : <strong>« parabole = modèle sans air »</strong>. Idée fausse : « l’air n’agit jamais ». Vrai : il faut comparer f à P.</li>
        </ul></>,
      texte: <>Vous savez établir les équations horaires d’un projectile à partir de vec(a) = vec(g) (primitives et conditions initiales), en déduire la trajectoire (une parabole), la flèche, la durée du vol et la portée, puis exploiter l’énergie mécanique et le théorème de l’énergie cinétique pour la vitesse à l’arrivée. Passez à l’exploration (autre astre, autre vitesse, autre hauteur) ou relevez les deux défis.</>, tache: null },
  ];

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'cible') { const t = M.tirageDefiCible(); setDefi({ type, ...t, reglage: { v0: 12, alpha: 40 }, tir: null }); }
    else { const t = M.tirageDefiLecture(); setDefi({ type, ...t, rep: '', verifie: false }); }
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const regler = f => setDefi(d => ({ ...d, reglage: { ...d.reglage, ...f }, tir: null }));
  const tirer = () => {
    const p = { ...defi.reglage, h: 0, g: defi.g }, dmin = M.distanceCible(p, defi.cible), ok = dmin <= M.RAYON_CIBLE;
    setDefi(d => ({ ...d, tir: { p, dmin, ok } })); noterC(ok);
  };
  const TOL_LECTURE = 0.06;
  const verifierLecture = () => {
    const x = lireNombre(defi.rep), ok = isFinite(x) && Math.abs(x - defi.vrai) <= TOL_LECTURE * defi.vrai;
    setDefi(d => ({ ...d, verifie: true, ok })); noterL(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const nomCorps = d => `${M.CORPS[d.corps].nom} (g = ${nbf(d.g, 1)}${NB}m/s²)`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['cible', 'Atteindre la cible'], ['lecture', 'Retrouver la vitesse initiale']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'cible' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : toucher la cible</div>
        <div style={{ ...lbl, marginBottom: 8 }}>{indicesProfond(<>Sur {nomCorps(defi)}, on lance une balle depuis le sol, à l’origine O du repère, dans le plan vertical de la figure, sans frottements. La cible (cercle orange, rayon {nbf(M.RAYON_CIBLE, 1)}{NB}m) est centrée au point de coordonnées <strong>(x ; y) = ({nbf(defi.cible.x, 1)} ; {nbf(defi.cible.y, 1)}) m</strong>. Réglez la vitesse initiale v_0 et l’angle α, puis tirez : la balle doit passer dans la cible.</>)}</div>
        <ReglageDefi nom="Vitesse initiale v_0" valeur={defi.reglage.v0} min={M.V0_MIN} max={M.V0_MAX} pas={0.1} unite="m/s" dec={1} onChange={v => regler({ v0: v })} aide="− et + changent v_0 de 0,1 m/s."/>
        <ReglageDefi nom="Angle α au-dessus de l’horizontale" valeur={defi.reglage.alpha} min={5} max={85} pas={1} unite="°" dec={0} onChange={v => regler({ alpha: v })} aide="− et + changent α de 1°."/>
        <IndiceDefi cache={!!(defi.tir && defi.tir.ok)}>{indicesProfond(<>La cible est un point de la parabole : ses coordonnées vérifient y = x tan α − frac(g x²|2 v_0² cos²α) (tir depuis le sol, y(0) = 0). Choisissez un angle α, puis isolez v_0 : v_0² = frac(g x²|2 cos²α × (x tan α − y)). Réglez, tirez, puis ajustez.</>)}</IndiceDefi>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <button onClick={tirer} style={styleBouton(true, '#15803d')}><Pic n="target"/>Tirer</button>
          <button onClick={() => regler({ v0: 12, alpha: 40 })} style={styleBouton(false)}><Pic n="refresh"/>Rétablir (12 m/s ; 40°)</button>
          <button onClick={() => nouveauDefi('cible')} style={styleBouton(false)}>Nouveau défi</button>
        </div>
        {defi.tir && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.tir.ok ? '#15803d' : '#b91c1c' }}>
          {avecIndices(defi.tir.ok ? `✓ Touché ! La trajectoire passe à ${nbf(defi.tir.dmin, 2)} m du centre de la cible (rayon ${nbf(M.RAYON_CIBLE, 1)} m).` : `✗ Raté : la trajectoire passe au plus près à ${nbf(defi.tir.dmin, 1)} m du centre de la cible (il faut moins de ${nbf(M.RAYON_CIBLE, 1)} m). Corrigez v_0 ou α et recommencez.`)}</div>}
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : retrouver la vitesse initiale</div>
        <div style={{ ...lbl, marginBottom: 8 }}>{indicesProfond(<>Sur {nomCorps(defi)}, une balle est lancée depuis le sol, sans frottements. On relève sur la trajectoire : <strong>portée P = {nbf(defi.P, defi.P < 10 ? 2 : 1)}{NB}m</strong> et <strong>flèche H = {nbf(defi.H, defi.H < 10 ? 2 : 1)}{NB}m</strong>. Déterminez la norme v_0 de la vitesse initiale, avec 2 chiffres significatifs (marge acceptée : 6{NB}% de la valeur).</>)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>{avecIndices('v_0')} =</span>
          <input value={defi.rep} aria-label="Votre réponse" onKeyDown={e => e.key === 'Enter' && document.getElementById('pes-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false }))} inputMode="decimal"
            style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>m/s</span>
        </div>
        <IndiceDefi cache={defi.verifie && defi.ok}>{indicesProfond(<>Le tir part du sol : la flèche vaut H = frac(v_0² sin²α|2g) et la portée P = frac(v_0² sin 2α|g). En faisant le rapport de H sur P, on trouve tan α = frac(4H|P) ; calculez α, puis tirez v_0 de la portée : v_0² = frac(P g|sin 2α). Gardez 3 chiffres significatifs dans les calculs intermédiaires.</>)}</IndiceDefi>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <button id="pes-verif" onClick={verifierLecture} style={styleBouton(true, '#15803d')}>Vérifier</button>
          <button onClick={() => nouveauDefi('lecture')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div>
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
          {(defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ')}{avecIndices(`tan α = frac(4H|P) = ${nbf(4 * defi.H / defi.P, 3)}, α = ${nbf(M.alphaDeLecture(defi.P, defi.H), 1)}° ; `)}{RacineV0(nbf(defi.vrai, 2))}</div>}
      </>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Poids seul</strong> : l’action de l’air est négligée (frottements, portance, vent). Elle est négligeable si f ≪ P (boule de pétanque à 10 m/s : f d’environ 0,1 N pour P d’environ 7 N) mais pas pour un ballon rapide (f et P tous deux d’environ 4 N à 25 m/s) : ces valeurs sont des ordres de grandeur estimés, pas des mesures.</li>
      <li><strong>Champ de pesanteur uniforme</strong> : vec(g) est le même en tout point, vertical, vers le bas ; g = 9,8 m/s² sur Terre, 1,6 m/s² sur la Lune, 3,7 m/s² sur Mars (valeurs arrondies). Valable pour une trajectoire de quelques dizaines de mètres.</li>
      <li><strong>Référentiel terrestre supposé galiléen</strong> pendant la durée du vol (quelques secondes) ; sur la Lune ou Mars, on suppose le référentiel lié au sol galiléen de la même façon.</li>
      <li><strong>Point matériel</strong> : la balle est son centre de masse G, de masse m = 0,50 kg (la masse ne joue aucun rôle dans les équations horaires) ; son rayon et sa rotation sont négligés.</li>
      <li><strong>Conventions</strong> : repère orthonormé Oxy dans le plan vertical qui contient le vecteur vitesse initiale ; Ox horizontal vers la droite, Oy vertical vers le haut, origine O au pied du point de lancer ; les composantes sont algébriques, donc a_y = −g (négatif car vec(g) est opposé à Oy) ; sol plat à y = 0 (le centre de masse arrive à y = 0 : le rayon de la balle est négligé).</li>
      <li><strong>Énergies</strong> : E_pp = m g y avec E_pp = 0 au sol ; E_m = E_c + E_pp est constante parce que seul le poids agit.</li>
      <li><strong>Calculs</strong> : valeurs numériques arrondies à 2 ou 3 chiffres significatifs ; gardez un chiffre de plus dans les calculs intermédiaires.</li>
      <li><strong>Hors programme, non traité</strong> : mouvement avec frottements (équation différentielle non linéaire), champ de pesanteur non uniforme, rotation de la Terre.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- zone de scène selon le mode ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const sg = enGuide ? SC[idEtape] : null;
  const nomsVec = { v: 'vec(v)', a: 'vec(a)', P: 'vec(P)' };
  const legV = (vecs, masques = []) => (vecs.length ? <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6, marginTop: 2 }}>
    {vecs.includes('v0') && <span>{indicesProfond(<><Vec n="v"/><sub>0</sub> vitesse initiale (trait plein gris)</>)}{' · '}</span>}
    {vecs.includes('v') && <span>{avecIndices('vec(v) vitesse (trait plein gris)')}{' · '}</span>}
    {vecs.includes('a') && <span>{avecIndices('vec(a) accélération (tirets violets)')}{' · '}</span>}
    {vecs.includes('P') && <span>{avecIndices('vec(P) poids (trait plein rouge)')}{' · '}</span>}
    <span>les longueurs suivent les échelles de la clé sous le dessin.</span>
    {masques.length > 0 && <span> {avecIndices(`Faute de place près du sol ou du bord, ${masques.map(c => nomsVec[c] || c).join(' et ')} ${masques.length > 1 ? 'ne sont pas tracés' : 'n’est pas tracé'} à cet instant (${masques.includes('a') ? 'vec(a) = vec(g) ne change jamais' : 'voir les mesures'}).`)}</span>}</div> : null);
  const boxScene = (() => {
    if (enGuide && idEtape === 'plan') return <div style={styleBoite}><ScenePlan/></div>;
    if (enGuide && idEtape === 'limite') return null;
    if (enGuide) {
      return (<div style={styleBoite}>
        <SceneProjectile p={P0} m={MASSE} {...sg}/>
        {legV(sg.vecs || [])}
        {sg.graphe === 'energies' && <div style={{ marginTop: 10 }}><GrapheTemps series={SERIES_E(MASSE, P0, false)} T={tV0} ymax={Math.ceil(M.energies(P0, MASSE, 0).Em * 1.08)} titreY="énergie (J)" aria="Énergie cinétique et énergie potentielle de pesanteur de la balle en fonction du temps."/><LegendeCourbes series={SERIES_E(MASSE, P0, false)}/></div>}
      </div>);
    }
    if (enDefi && defi) {
      if (defi.type === 'cible') {
        const fen = { X: defi.cible.x * 1.6, Y: Math.max(defi.cible.y * 2, 5) };
        const p = defi.tir ? defi.tir.p : { ...defi.reglage, h: 0, g: defi.g };
        return (<div style={styleBoite}><SceneProjectile p={p} fen={fen} cible={defi.cible} trajet={defi.tir ? 'complete' : 'aucune'} grad aria="Scène : la cible orange est placée dans le repère ; la trajectoire du dernier tir est tracée."/></div>);
      }
      const p = { v0: defi.v0, alpha: defi.alpha, h: 0, g: defi.g };
      return (<div style={styleBoite}><SceneProjectile p={p} grad aria="Scène : trajectoire d’une balle lancée depuis le sol, avec les axes gradués en mètres."/></div>);
    }
    const vecs = ex.vecs === 'va' ? ['v', 'a'] : ex.vecs === 'v' ? ['v'] : [];
    return (<div style={styleBoite}>
      <div style={aide}>Le schéma montre le lancer choisi ; la balle est à la date t réglée ci-dessous (trait plein : déjà parcouru, pointillés : à venir).</div>
      <SceneProjectile p={pE} t={tE} trajet="jusqu" vecs={vecs} m={MASSE} grad/>
      {legV(vecs, vecteursMasques(pE, tE, vecs, MASSE))}
    </div>);
  })();

  // ---------- exploration : commandes ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const resume = `v_0 = ${nbf(ex.v0, 0)} m/s · α = ${ex.alpha}° · h = ${nbf(ex.h, 0)} m`;
  const pasT = 0.05;
  const reglages = enExplore && (
    <div style={styleBoite} className="pes-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez l’astre, puis avancez dans le temps avec le curseur : la balle, ses vecteurs et les mesures suivent.</div>
      <label style={lbSel}>Astre où a lieu le lancer
        <select value={ex.corps} onChange={e => setE({ corps: e.target.value })} style={{ ...menu, marginTop: 2 }}>{Object.entries(M.CORPS).map(([id, c]) => <option key={id} value={id}>{`${c.nom.replace(/^la /, 'La ').replace(/^Mars/, 'Mars')} (g = ${nbf(c.g, 1)} m/s²)`}</option>)}</select></label>
      <Curseur nom="Date t depuis le lancer" valeur={Math.round(tE / pasT) * pasT} onChange={v => setE({ t: v })} min={0} max={Math.floor(TE / pasT) * pasT} pas={pasT} unite="s" decimales={2} couleur={COLP.traj}/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button type="button" onClick={() => setE({ t: Math.max(0, Math.round((tE - pasT) * 100) / 100) })} style={stylePetitBouton(false)} aria-label="Reculer d’un pas de temps">− 0,05 s</button>
        <button type="button" onClick={() => setE({ t: Math.min(TE, Math.round((tE + pasT) * 100) / 100) })} style={stylePetitBouton(false)} aria-label="Avancer d’un pas de temps">+ 0,05 s</button>
        <button type="button" onClick={() => setE({ t: 0 })} style={stylePetitBouton(false)}><Pic n="refresh"/>t = 0</button>
      </div>
      <Section titre={`Réglages du lancer : ${resume}`.replace('v_0', 'v₀')} ouvert={ouv.regl} onBascule={() => setOuv(o => ({ ...o, regl: !o.regl }))}>
        <label style={lbSel}>Vitesse initiale v₀ (norme du vecteur vitesse au lancer)
          <select value={ex.v0} onChange={e => setE({ v0: +e.target.value })} style={{ ...menu, marginTop: 2 }}>{[5, 8, 10, 12, 15, 20, 25].map(v => <option key={v} value={v}>{v} m/s</option>)}</select></label>
        <label style={lbSel}>Angle α du lancer au-dessus de l’horizontale
          <select value={ex.alpha} onChange={e => setE({ alpha: +e.target.value })} style={{ ...menu, marginTop: 2 }}>{[15, 20, 30, 40, 45, 50, 60, 70, 80].map(v => <option key={v} value={v}>{v}°</option>)}</select></label>
        <label style={lbSel}>Hauteur h du point de lancer au-dessus du sol
          <select value={ex.h} onChange={e => setE({ h: +e.target.value })} style={{ ...menu, marginTop: 2 }}>{[0, 1, 2, 5, 10, 20].map(v => <option key={v} value={v}>{v} m</option>)}</select></label>
        <label style={lbSel}>Vecteurs tracés sur la balle
          <select value={ex.vecs} onChange={e => setE({ vecs: e.target.value })} style={{ ...menu, marginTop: 2 }}>
            <option value="va">vitesse et accélération</option><option value="v">vitesse seulement</option><option value="aucun">aucun</option></select></label>
        <div style={aide}>{avecIndices('La balle (0,50 kg) part toujours de x = 0 à l’altitude h ; vec(a) reste égal à vec(g) quels que soient les réglages.')}</div>
      </Section>
    </div>);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <Section titre={`Mesures à t = ${nbf(tE, 2)} s : x = ${nbf(bE.x, 1)} m · y = ${nbf(bE.y, 1)} m`} ouvert={ouv.mes} onBascule={() => setOuv(o => ({ ...o, mes: !o.mes }))}>
        <div style={aide}>Axes : Ox vers la droite, Oy vers le haut ; les composantes sont algébriques (le signe donne le sens).</div>
        <LigneMesure nom="Position x" valeur={`${nbf(bE.x, 2)}${NB}m`} couleur="#0f172a"/>
        <LigneMesure nom="Position y" valeur={`${nbf(bE.y, 2)}${NB}m`} couleur="#0f172a"/>
        <LigneMesure nom="Composante v_x" valeur={`${nbf(vE.x, 2)}${NB}m/s`} couleur={COLP.v}/>
        <LigneMesure nom="Composante v_y" valeur={`${nbf(vE.y, 2)}${NB}m/s`} couleur={COLP.v}/>
        <LigneMesure nom="Norme v" valeur={`${nbf(M.norme(vE), 2)}${NB}m/s`} couleur={COLP.v}/>
        <LigneMesure nom="Composante a_x" valeur={`0${NB}m/s²`} couleur={COLP.a}/>
        <LigneMesure nom="Composante a_y = −g" valeur={`${nbf(-pE.g, 1)}${NB}m/s²`} couleur={COLP.a}/>
        <LigneMesure nom="Énergie cinétique E_c" valeur={`${nbf(enE.Ec, 2)}${NB}J`}/>
        <LigneMesure nom="Énergie potentielle E_pp" valeur={`${nbf(enE.Epp, 2)}${NB}J`}/>
        <LigneMesure nom="Énergie mécanique E_m" valeur={`${nbf(enE.Em, 2)}${NB}J`}/>
        <div style={{ ...aide, marginTop: 8 }}>Valeurs du tir complet : durée du vol {nbf(TE, 2)} s · portée {nbf(M.portee(pE), 1)} m · flèche (altitude maximale) {nbf(M.hauteurMax(pE), 2)} m · vitesse à l’arrivée {nbf(M.vitesseSol(pE), 1)} m/s.</div>
      </Section>
    </div>);
  const seriesXY = [{ nom: 'x(t) (trait plein)', f: t => M.pos(pE, t).x, c: COLP.traj }, { nom: 'y(t) (tirets)', f: t => M.pos(pE, t).y, c: COLP.P, dash: '8 5' }];
  const seriesCourbe = ex.courbe === 'xy' ? seriesXY : SERIES_E(MASSE, pE, true);
  const ymaxC = ex.courbe === 'xy' ? Math.max(M.portee(pE), M.hauteurMax(pE)) * 1.08 : M.energies(pE, MASSE, 0).Em * 1.08 + 1e-9;
  const courbes = enExplore && (
    <div style={styleBoite}>
      <Section titre={`Courbes en fonction du temps : ${ex.courbe === 'xy' ? 'x(t) et y(t)' : 'énergies'}`} ouvert={ouv.courbes} onBascule={() => setOuv(o => ({ ...o, courbes: !o.courbes }))}>
        <label style={lbSel}>Grandeurs tracées
          <select value={ex.courbe} onChange={e => setE({ courbe: e.target.value })} style={{ ...menu, marginTop: 2 }}><option value="xy">position : x(t) et y(t)</option><option value="en">énergies (cinétique, potentielle, mécanique)</option></select></label>
        <div style={aide}>{avecIndices(ex.courbe === 'xy' ? 'x(t) croît à vitesse constante ; y(t) monte puis redescend. Le trait pointillé vertical marque la date t choisie.' : 'E_c et E_pp varient en sens inverse ; leur somme E_m reste constante (poids seul). Le trait pointillé vertical marque la date t choisie.')}</div>
        <GrapheTemps series={seriesCourbe} T={TE} ymax={ymaxC} marque={tE} titreY={ex.courbe === 'xy' ? 'x et y (m)' : 'énergie (J)'} aria="Courbes des grandeurs choisies en fonction du temps."/>
        <LegendeCourbes series={seriesCourbe}/>
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avancez dans le temps : que devient la composante v_x de la vitesse ? Et la composante v_y ? Le vecteur vec(a) change-t-il ?</li>
        <li>À h = 0, comparez les portées pour α = 30° et α = 60° : que constatez-vous ? Quel angle donne la portée la plus grande ?</li>
        <li>Passez de la Terre à la Lune sans changer v_0 et α : que deviennent la flèche, la durée du vol et la portée ? Dans quel rapport ?</li>
        <li>Mettez h = 20 m : l’angle qui donne la portée maximale est-il encore 45° ?</li>
        <li>Dans les courbes d’énergie, repérez la date du sommet : que valent E_c et E_pp ? Pourquoi E_c n’est-elle pas nulle ?</li>
        <li>Changez la masse mentalement : que deviennent les équations horaires ? Et les énergies ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Poids seul, champ uniforme : vec(a) = vec(g) ; sur Ox : a_x = 0 ; sur Oy (vers le haut) : a_y = −g</li>
          <li>Mouvement plan : le plan contient le vecteur vitesse initiale et la verticale</li>
          <li>v_x = v_0 cos α (constante) ; v_y = −g t + v_0 sin α</li>
          <li>x = v_0 cos α × t ; y = −½ g t² + v_0 sin α × t + h</li>
          <li>Trajectoire : parabole, y(x) est un polynôme du second degré en x</li>
          <li>Sommet : v_y = 0 ; sol : y = 0 ; portée = v_x × durée du vol</li>
          <li>E_m = E_c + E_pp constante ; v_f = <Rac t="v_0² + 2 g h"/> (théorème de l’énergie cinétique)</li>
          <li>Modèle valable si le frottement de l’air est petit devant le poids</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pes-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pes-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pes-col { display: flex; flex-direction: column; gap: 12px; }
        .pes-df { display: block; margin-bottom: 12px; } .pes-df > * { margin-bottom: 12px; }
        .pes-df-scene { position: sticky; top: 0; z-index: 3; background: #fff; }
        @media (min-width: 901px) { .pes-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .pes-df > * { margin-bottom: 0; } .pes-df-scene { position: static; grid-column: 1; grid-row: 1 / span 2; }
          .pes-df-volet { grid-column: 2; grid-row: 1; } .pes-df-hypo { grid-column: 2; grid-row: 2; } }
        .pes-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .pes-l1.cote .pes-carte { order: 2; } .pes-l1.cote .pes-main { order: 1; }
          .pes-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .pes-ex > * { grid-column: 1; } .pes-ex > .pes-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .pes-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pes-in { animation: pes-fondu 0.35s ease-out; } @keyframes pes-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mouvement dans un champ de pesanteur uniforme</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>{avecIndices('Une balle lancée, soumise à son seul poids : vec(a) = vec(g). On en déduit ses équations horaires, sa trajectoire (une parabole) et ses énergies.')}</div>
      {enGuide && <div className="pes-l1 cote">
        <div className="pes-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="pes-main">
          <div className="pes-col">
            {boxScene && <div className="pes-in" key={'s-' + idEtape}>{boxScene}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div className="pes-df">
        <div className="pes-df-scene pes-in" key={'d' + defi.type}>{boxScene}</div>
        <div className="pes-df-volet"><div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'cible' ? suiviC : suiviL}/></div></div>
        <div className="pes-df-hypo">{panneauHypo}</div>
      </div>}
      {enExplore && <div className="pes-ex">
        <div>{boxScene}</div>
        <div className="pes-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{courbes}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
