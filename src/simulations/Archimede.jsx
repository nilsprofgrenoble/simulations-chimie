import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices, Vec } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./arcModele";
import { QCM_PARCOURS as Q } from "./arcQcm";
import { SceneArchimede, GrapheArchimede, SvgCarteOrigine, SvgCarteExpression, SvgCartePoidsApparent, SvgCarteFlottaison, SvgCarteAir, SceneBallon } from "./arcSchemas";


const SIM_ID = 213, CLE_GUIDE = 'archimede-tg-guide-v1';
declarerDefis(SIM_ID, [['prevoir', 'Prévoir la poussée et le poids apparent'], ['flotteur', 'Prévoir la flottaison d’un cube'], ['inconnu', 'Trouver la masse volumique d’un liquide']]);

// ====================================================
// SIM 213 — POUSSÉE D'ARCHIMÈDE (TG spé PC, « Mouvement et interactions », « Modéliser l'écoulement d'un fluide »).
//  Capacités visées (jamais affichées à l'élève) : expliquer qualitativement l'origine de la poussée d'Archimède ; utiliser son expression vectorielle ;
//  mettre en œuvre un dispositif (dynamomètre, flottaison) pour tester ou exploiter l'expression. Relations de 1G réinvesties : force pressante F = P S ;
//  P_B − P_A = ρ g (z_A − z_B). Modèle : arcModele.js (test : arcModele.test.mjs). Banques d'exercices : préfixe « arc- ».
// ====================================================

const BLEU = '#0369a1', VERT = '#15803d', ORANGE = '#b45309';
const IDS = ['forces', 'pressions', 'resultante', 'expression', 'calcul', 'dyn', 'tester', 'nature', 'equilibre', 'fraction', 'fluide', 'air', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const nbf = M.nbf, f1 = x => nbf(x, 1);
const ALU = M.objet('alu'), ACIER = M.objet('acier'), PIN = M.objet('pin'), GLACE = M.objet('glace'), EAU = M.fluide('eau');
const P_ALU = M.lecture(M.poids(ALU.rho, 1000)), F_ALU = M.lecture(M.poidsApparent(ALU.rho, EAU.rho, 1000)), PI_ALU = M.poussee(EAU.rho, 1000);   // 26,5 N ; 16,7 N ; 9,8 N

// ---------- formules (MathML) ----------
const vecDe = l => <mover><mi>{l}</mi><mo stretchy="false">→</mo></mover>;
const rhoF = <msub><mi>ρ</mi><mtext>fluide</mtext></msub>, Vim = <msub><mi>V</mi><mtext>immergé</mtext></msub>;
const FExpr = <Formule>{vecDe('Π')}<mo>=</mo><mo>−</mo>{rhoF}<mo>×</mo>{Vim}<mo>×</mo>{vecDe('g')}</Formule>;
const eNorme = <FormuleEnLigne><mi>Π</mi><mo>=</mo>{rhoF}<mo>×</mo>{Vim}<mo>×</mo><mi>g</mi></FormuleEnLigne>;
const eVec = <FormuleEnLigne>{vecDe('Π')}<mo>=</mo><mo>−</mo>{rhoF}<mo>×</mo>{Vim}<mo>×</mo>{vecDe('g')}</FormuleEnLigne>;
const vPi = <Vec n="Π"/>, vP = <Vec n="P"/>, vT = <Vec n="T"/>, vZero = <Vec n="0"/>;
const sb = (l, i) => <msub><mi>{l}</mi><mtext>{i}</mtext></msub>;
const rap = (a, b) => <FormuleEnLigne><mfrac><mrow>{typeof a === 'string' ? <mtext>{a}</mtext> : a}</mrow><mrow>{typeof b === 'string' ? <mtext>{b}</mtext> : b}</mrow></mfrac></FormuleEnLigne>;
const rGl = rap(sb('ρ', 'glace'), sb('ρ', 'fluide')), rOb = rap(sb('ρ', 'objet'), sb('ρ', 'fluide'));

// ---------- contrôle d'immersion : curseur + boutons − / + + rétablir ----------
function ControleImmersion({ f, onChange, V, nom = 'Immersion du cube' }) {
  const btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 };
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>
        <span>{nom}</span><span style={{ color: KIT.txt, whiteSpace: 'nowrap' }}>{f}{NB}% du volume ({nbf(V * f / 100, 0)}{NB}cm³)</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label="Remonter un peu" onClick={() => onChange(Math.max(0, f - 10))} style={btn}>−</button>
        <input type="range" min={0} max={100} step={10} value={f} onChange={e => onChange(Number(e.target.value))} aria-label={nom} style={{ flex: 1, minWidth: 0, accentColor: BLEU, height: 28 }}/>
        <button aria-label="Enfoncer un peu" onClick={() => onChange(Math.min(100, f + 10))} style={btn}>+</button>
      </div>
      <div style={{ marginTop: 6 }}><button onClick={() => onChange(0)} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir (cube hors de l’eau)</button></div>
    </div>);
}

const de = nom => (/^[aeiouyéèêh]/i.test(nom) ? 'd’' : 'de ') + nom;                // élision française : « d’aluminium », « de liège »

export function SimulationArchimede() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviF, noterF] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('prevoir');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ objet: false, dyn: false, aff: false, essayer: false, retenir: false });
  const [fG, setFG] = useState(0), [visG, setVisG] = useState([0]), [flG, setFlG] = useState('eau');                       // parcours : immersion (étape « tester »), points relevés, fluide (étape « fluide »)
  const [ex, setEx] = useState({ obj: 'pin', fl: 'eau', V: 1000, dyn: false, f: 0, vis: [0], forces: false, droite: false });  // exploration
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const changerFG = f => { setFG(f); setVisG(v => (v.includes(f) ? v : [...v, f])); };
  const pointsDe = (vis, rhoO, V, rhoFl) => [...vis].sort((a, b) => a - b).map(p => ({ V: V * p / 100, Pi: M.lecture(M.poids(rhoO, V)) - M.lecture(M.poidsApparent(rhoO, rhoFl, V, p / 100)) }));

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'forces', titre: 'Un cube plongé dans l’eau', focus: ['scene'],
      texte: <>Un cube d’aluminium de 1,0{NB}dm³ (arête de 10{NB}cm) est suspendu à un fil et plongé entièrement dans l’eau douce d’un bécher. Il est immobile. Le <strong>système</strong> étudié est le cube, dans le référentiel du laboratoire.</>,
      tache: { type: 'qcm', q: 'Quelles actions s’exercent sur le cube ?', options: Q.forces.options, bonne: 0,
        expl: 'Le cube subit son poids vec(P) (action de la Terre), la tension du fil vec(T) et l’action de l’eau, qui est en contact avec toute sa surface. Sans l’eau ni le fil, il serait en chute libre. L’air n’intervient pas : le cube est entièrement dans l’eau (l’air ne touche que la surface libre du liquide).',
        indice: 'Faites la liste de tout ce qui touche le cube ou agit sur lui à distance : la Terre, le fil… et le milieu qui l’entoure.' } },
    { id: 'pressions', titre: 'Pression et profondeur', focus: ['scene'],
      texte: <>La pression d’un fluide au repos augmente avec la profondeur : en première, on a vu P_B − P_A = ρ g (z_A − z_B). La force pressante exercée par un fluide sur une surface plane d’aire S est perpendiculaire à cette surface et de valeur F = P × S. Ici, la face du haut du cube est à 3{NB}cm sous la surface, la face du bas à 13{NB}cm ; les deux faces ont la même aire S.</>,
      tache: { type: 'qcm', q: 'Comment se comparent les forces pressantes de l’eau sur la face du haut et sur la face du bas ?', options: Q.pressions.options, bonne: 0,
        expl: 'La face du bas est plus profonde : la pression y est plus grande (ici de ρ g × 0,10 m = 980 Pa de plus que sur la face du haut). Les aires étant égales, F = P × S est plus grande en bas. « Égales » oublierait que la pression change avec la profondeur ; « plus grande en haut » confond avec la proximité de l’air ; « nulle » est faux : un fluide exerce une force sur toute surface en contact avec lui.',
        indice: 'La pression augmente quand on descend. Les deux faces ont la même aire : F = P × S est plus grande là où P est plus grande.' } },
    { id: 'resultante', titre: 'Que fait l’eau sur le cube ?', focus: ['scene'],
      texte: <>On dessine sur chaque face la force pressante de l’eau : flèche perpendiculaire à la face, d’autant plus longue que la profondeur est grande. Pour simplifier, on ne dessine que la part de pression due à l’eau : la pression atmosphérique, la même sur toutes les faces, se compense (pas à l’échelle des valeurs réelles).</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de la résultante de toutes ces forces pressantes ?', options: Q.resultante.options, bonne: 0,
        expl: 'Sur deux faces latérales opposées, à la même profondeur, les forces sont égales et opposées : elles se compensent. Il reste la force vers le haut sur la face du bas, plus grande que la force vers le bas sur la face du haut : la résultante est verticale, vers le haut. Elle ne serait nulle que si la pression ne dépendait pas de la profondeur.',
        indice: 'Associez les faces deux par deux : côté gauche et côté droit, puis face du haut et face du bas. Que reste-t-il ?' } },
    { id: 'expression', titre: 'Expression de la poussée d’Archimède', focus: ['scene'],
      retenirTitre: 'Origine de la poussée d’Archimède',
      retenir: <>
        <SvgCarteOrigine/>
        <ul style={ULS}>
          <li>La pression <strong>augmente avec la profondeur</strong> : la force pressante est plus grande sous le solide que sur son dessus.</li>
          <li>Les forces latérales se compensent ; la résultante des forces pressantes est <strong>verticale, vers le haut</strong> : c’est la poussée d’Archimède {vPi}.</li>
          <li>Idée fausse : « l’eau pousse vers le haut parce qu’elle est légère ». Vrai : c’est une <strong>force pressante</strong> exercée par le fluide sur le solide.</li>
        </ul></>,
      texte: <>Cette résultante est la <strong>poussée d’Archimède</strong> {vPi} : la force exercée par le fluide sur la partie immergée du solide. Son expression vectorielle, à connaître, est :{FExpr}où ρ_fluide est la masse volumique du fluide (en kg·m⁻³), V_immergé le volume de la partie immergée du solide (en m³), égal au volume de fluide déplacé, et <Vec n="g"/> le vecteur champ de pesanteur (g = 9,8{NB}N·kg⁻¹).</>,
      tache: { type: 'qcm', q: 'Que traduit le signe moins dans cette expression ?', options: Q.signe.options, bonne: 0,
        expl: <>Le vecteur <Vec n="g"/> est vertical, dirigé vers le bas ; ρ_fluide et V_immergé sont des nombres positifs. Le signe moins inverse le sens : {vPi} est vertical, dirigé vers le haut, comme on l’a trouvé avec les forces pressantes. La norme Π = ρ_fluide × V_immergé × g est, elle, toujours positive ; et Π augmente avec V_immergé.</>,
        indice: 'Multiplier un vecteur par un nombre positif garde son sens ; par un nombre négatif, il l’inverse. Quel est le sens de g ?' } },
    { id: 'calcul', titre: 'Calculer la poussée', focus: ['scene'],
      texte: <>Le cube d’aluminium (V = 1,0{NB}dm³ = 1,0{NB}L) est totalement immergé : son volume immergé est son volume total. Le trait pointillé sur le bécher montre le niveau de l’eau avant d’y plonger le cube : il a monté, car le cube déplace un volume d’eau égal à son volume immergé. Données : fluide = eau douce, ρ_fluide = 1{NB}000{NB}kg·m⁻³ ; g = 9,8{NB}N·kg⁻¹. Attention aux unités : V doit être en m³.</>,
      tache: { type: 'num', q: 'Norme Π de la poussée d’Archimède, en N (2 chiffres significatifs)', unite: 'N', vrai: PI_ALU, tol: 0.05, affiche: v => f1(v), cs: 2,
        calcul: () => ['V = 1,0 dm³ = 1,0 × 10⁻³ m³ (1 dm³ = 1 L = 10⁻³ m³).', 'Π = ρ_fluide × V_immergé × g = 1 000 kg·m⁻³ × 1,0 × 10⁻³ m³ × 9,8 N·kg⁻¹ = 9,8 N.'],
        pieges: [[9800, 'Vous avez gardé V = 1,0 sans le convertir : 1,0 dm³ vaut 1,0 × 10⁻³ m³.'], [9.8e6, 'Vous avez utilisé V = 1 000 cm³ sans convertir : 1 cm³ vaut 10⁻⁶ m³, donc V = 1,0 × 10⁻³ m³.'], [26.46, 'Vous avez utilisé la masse volumique du cube (2 700 kg·m⁻³) : c’est celle du fluide qui intervient dans la poussée.'], [1.0, 'Il manque le facteur g = 9,8 N·kg⁻¹ : ρ × V est une masse (en kg), pas une force.'], [0.0098, 'Il manque la masse volumique du fluide : Π = ρ_fluide × V_immergé × g.']],
        expl: 'Π = ρ_fluide × V_immergé × g = 1 000 × 1,0 × 10⁻³ × 9,8 = 9,8 N : c’est le poids de 1,0 L d’eau.',
        indice: 'Convertissez d’abord V en m³ (1 dm³ = 10⁻³ m³), puis multipliez ρ_fluide, V et g.' } },
    { id: 'dyn', titre: 'Le dynamomètre : poids apparent', focus: ['scene', 'mesures'],
      retenirTitre: 'Expression de la poussée d’Archimède',
      retenir: <>
        <SvgCarteExpression/>
        <ul style={ULS}>
          <li>{eVec} : direction verticale, sens vers le haut.</li>
          <li>Norme : {eNorme}, avec ρ en kg·m⁻³, V en m³ (1 L = 10⁻³ m³), g = 9,8 N·kg⁻¹ : Π en newtons.</li>
          <li>Moyen de s’en souvenir : <strong>« Π = poids du fluide déplacé »</strong> (ρ_fluide × V est la masse de fluide déplacé).</li>
        </ul></>,
      texte: <>Le cube est suspendu à un dynamomètre, juste au-dessus de l’eau. Il indique le poids du cube : P = {nbf(P_ALU, 1)}{NB}N (lu à 0,1{NB}N près). On va plonger le cube entièrement dans l’eau douce, où Π = 9,8{NB}N (calculée à l’étape précédente), et le laisser immobile au bout du fil. L’indication du dynamomètre s’appelle alors le <strong>poids apparent</strong> du cube : elle est égale à la norme de la tension du fil.</>,
      tache: { type: 'num', q: 'Quelle indication F le dynamomètre donnera-t-il, cube totalement immergé et immobile, en N (3 chiffres significatifs) ?', unite: 'N', vrai: F_ALU, tol: 0.05, affiche: v => f1(v), cs: 3,
        calcul: () => [<>Le cube est immobile : {vP} + {vPi} + {vT} = {vZero}. En projection sur l’axe vertical orienté vers le haut : −P + Π + T = 0, donc T = P − Π.</>, 'Le dynamomètre indique la norme de la tension du fil : F = 26,5 N − 9,8 N = 16,7 N.'],
        pieges: [[P_ALU + PI_ALU, 'Vous avez additionné P et Π : la poussée est dirigée vers le haut, comme la tension du fil ; elle diminue l’effort que le fil doit fournir.'], [PI_ALU, 'C’est la poussée Π seule ; le dynamomètre indique P − Π.'], [P_ALU, 'C’est l’indication dans l’air : le poids ne change pas, mais l’eau pousse le cube vers le haut, donc le fil retient moins.']],
        expl: 'Le poids du cube n’a pas changé : P = 26,5 N. Mais l’eau le pousse vers le haut avec Π = 9,8 N, donc le fil n’a plus à retenir que F = P − Π = 16,7 N (poids apparent).',
        indice: 'Écrivez que la somme des trois forces (poids, poussée, tension du fil) est nulle, projetée sur l’axe vertical dirigé vers le haut.' } },
    { id: 'tester', titre: 'Tester l’expression au dynamomètre', focus: ['scene', 'curseurs', 'mesures', 'graphe'],
      texte: <>Plongez le cube progressivement avec les boutons − / + : à chaque cran, le dynamomètre donne F, d’où la poussée déduite Π = P − F (P = {nbf(P_ALU, 1)}{NB}N). Chaque point relevé s’ajoute au graphe de Π en fonction du volume immergé (relevez au moins quatre positions immergées différentes avant de répondre).</>,
      tache: { type: 'qcm', bloque: visG.length < 5 ? 'Plongez le cube à au moins quatre crans différents (boutons − / +) pour relever assez de points sur le graphe.' : undefined, q: 'Que révèle le graphe sur la relation entre Π et le volume immergé ?', options: Q.tester.options, bonne: 0,
        expl: <>Les points sont alignés sur une droite qui passe par l’origine : Π est proportionnelle au volume immergé, de coefficient ρ_fluide × g = 1 000 × 9,8 = 9 800 N·m⁻³ (soit 9,8 N par litre immergé), ce qui est bien l’expression {eNorme}. Un Π constant ou décroissant contredirait les mesures ; une courbe qui s’incurve ne donnerait pas des points alignés.</>,
        indice: 'Si le volume immergé est nul (cube hors de l’eau), que vaut la poussée ? Les points semblent-ils alignés ?' } },
    { id: 'nature', titre: 'Masse et nature de l’objet', focus: ['scene'],
      texte: <>On remplace le cube d’aluminium par un cube d’acier de même volume (1,0{NB}dm³) mais de masse bien plus grande (7,8{NB}kg). Même fluide : eau douce, cube totalement immergé, immobile au bout de son fil.</>,
      tache: { type: 'qcm', q: 'Que devient la poussée d’Archimède, qui valait 9,8 N pour le cube d’aluminium ?', options: Q.nature.options, bonne: 0,
        expl: <>La norme {eNorme} ne contient ni la masse du solide ni sa masse volumique : seuls le fluide (ρ_fluide), le volume immergé et g comptent. Le cube d’acier a le même volume immergé : Π reste égale à 9,8 N. Ce qui change, c’est le poids (76 N pour l’acier) et donc le poids apparent. Le rapport 2,9 est celui des masses volumiques de l’acier et de l’aluminium, mais elles n’interviennent pas dans Π.</>,
        indice: 'Relisez l’expression de Π : quelles grandeurs y figurent ? La masse du solide en fait-elle partie ?' } },
    { id: 'equilibre', titre: 'Flotte ou coule ?', focus: ['scene'],
      retenirTitre: 'Poids apparent et facteurs de la poussée',
      retenir: <>
        <SvgCartePoidsApparent/>
        <ul style={ULS}>
          <li><strong>Poids apparent</strong> = indication du dynamomètre d’un solide immergé : F = P − Π. Le poids P ne change pas ; c’est la tension du fil qui diminue.</li>
          <li>Π est <strong>proportionnelle au volume immergé</strong> et ne dépend <strong>ni de la masse ni de la nature du solide</strong> : seulement de ρ_fluide, de V_immergé et de g.</li>
          <li>Moyen de s’en souvenir : <strong>« le fluide pousse selon ce qu’il déplace, pas selon ce qu’on y plonge »</strong>.</li>
        </ul></>,
      texte: <>On lâche, totalement immergé et immobile, un cube de bois (pin) de 1,0{NB}dm³ et de masse 0,50{NB}kg dans l’eau douce. Son poids vaut P = 4,9{NB}N ; la poussée d’Archimède qui s’exerce sur lui, totalement immergé, vaut Π = 9,8{NB}N. Les deux flèches sont tracées à l’échelle.</>,
      tache: { type: 'qcm', q: 'Que fait le cube juste après le lâcher ?', options: Q.equilibre.options, bonne: 0,
        expl: <>Π (9,8 N) est plus grande que P (4,9 N) : la résultante des forces est verticale, vers le haut, et le cube accélère vers le haut. Il émerge peu à peu ; son volume immergé diminue, donc Π diminue, jusqu’à ce que Π = P : il flotte alors. On retrouve ρ_bois = 500 kg·m⁻³ &lt; ρ_fluide = 1 000 kg·m⁻³. Il coulerait si Π était inférieure à P, et resterait entre deux eaux si Π = P en étant totalement immergé.</>,
        indice: 'Comparez les deux forces verticales : laquelle est la plus grande ? Quel est le sens de la résultante ?' } },
    { id: 'fraction', titre: 'Le flotteur à l’équilibre', focus: ['scene'],
      texte: <>Un cube de glace de 1,0{NB}dm³ = 1{NB}000{NB}cm³ (ρ_glace = 920{NB}kg·m⁻³) flotte, immobile, à la surface de l’eau douce (ρ_fluide = 1{NB}000{NB}kg·m⁻³). À l’équilibre, la somme des forces est nulle : P = Π. Seule une partie du cube, de volume V_immergé, est sous la surface.</>,
      tache: { type: 'num', q: 'Volume immergé V_immergé du cube, en cm³ (2 chiffres significatifs)', unite: 'cm³', vrai: 920, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['À l’équilibre, P = Π : ρ_glace × V × g = ρ_fluide × V_immergé × g. Le facteur g se simplifie.', 'V_immergé = V × frac(ρ glace|ρ fluide) = 1 000 cm³ × frac(920|1 000) = 920 cm³ (soit 92 % du volume).'],
        pieges: [[1000, 'Le cube n’est pas entièrement immergé : s’il l’était, Π (9,8 N) serait plus grande que le poids (9,0 N) et il remonterait.'], [500, 'Ce n’est pas la moitié : la fraction immergée est le rapport des masses volumiques, ici 920 sur 1 000.'], [1087, 'Le rapport est inversé : V_immergé est inférieur à V, donc le rapport à utiliser est celui de ρ_glace (le plus petit) sur ρ_fluide.'], [92, 'Vous avez donné le pourcentage : la question demande le volume en cm³.']],
        expl: <>P = Π donne V_immergé = V × {rGl} = 1 000 cm³ × {rap('920', '1 000')} = 920 cm³ : 92 % du cube est sous l’eau, 8 % dépasse.</>,
        indice: 'Égalez le poids ρ_glace × V × g et la poussée ρ_fluide × V_immergé × g, puis isolez V_immergé.' } },
    { id: 'fluide', titre: 'Changer de fluide', focus: ['scene', 'curseurs', 'mesures'],
      texte: <>Le même cube de glace (ρ_glace = 920{NB}kg·m⁻³, V = 1{NB}000{NB}cm³) est lâché dans différents fluides. Choisissez-les dans le menu et observez le cube. Rappel : dans l’eau douce, 920{NB}cm³ du cube étaient immergés.</>,
      tache: { type: 'qcm', q: 'On passe de l’eau douce à de l’eau très salée (ρ_fluide = 1 200 kg·m⁻³). Le cube est…', options: Q.fluide.options, bonne: 0,
        expl: <>À l’équilibre, V_immergé = V × {rGl} : quand ρ_fluide augmente, le volume immergé diminue (920 cm³ dans l’eau douce, environ 767 cm³ dans l’eau très salée). Le cube est donc moins enfoncé, mais il flotte toujours (ρ_glace &lt; ρ_fluide). « Complètement sous l’eau » ne se produirait que dans un fluide moins dense que la glace, comme l’huile du menu.</>,
        indice: 'À l’équilibre, la poussée vaut toujours le même poids P. Si ρ_fluide augmente, que doit faire V_immergé pour que Π reste égale à P ?' } },
    { id: 'air', titre: 'La poussée de l’air', focus: [],
      retenirTitre: 'Flotter ou couler : comparer les masses volumiques',
      retenir: <>
        <SvgCarteFlottaison/>
        <ul style={ULS}>
          <li><strong>ρ_objet &lt; ρ_fluide</strong> : l’objet flotte ; à l’équilibre P = Π, d’où la <strong>fraction immergée</strong> égale à {rOb}.</li>
          <li><strong>ρ_objet &gt; ρ_fluide</strong> : l’objet coule ; si ρ_objet = ρ_fluide, il reste entre deux eaux.</li>
          <li>Plus le fluide est dense, moins le flotteur s’enfonce. Idée fausse : « il flotte parce qu’il est léger ». Vrai : on compare les <strong>masses volumiques</strong>, pas les masses.</li>
        </ul></>,
      texte: <>Un fluide peut être un gaz : l’air exerce lui aussi une poussée d’Archimède sur tout objet qu’il entoure. Un ballon de baudruche de volume V = 5,0{NB}L est plongé dans l’air (ρ_air = 1,2{NB}kg·m⁻³ à 20{NB}°C ; g = 9,8{NB}N·kg⁻¹). Le ballon est entièrement entouré d’air.</>,
      tache: { type: 'num', q: 'Norme Π de la poussée d’Archimède exercée par l’air sur le ballon, en N (2 chiffres significatifs)', unite: 'N', vrai: M.poussee(M.RHO_AIR, 5000), tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['V = 5,0 L = 5,0 × 10⁻³ m³.', 'Π = ρ_air × V × g = 1,2 kg·m⁻³ × 5,0 × 10⁻³ m³ × 9,8 N·kg⁻¹ = 0,059 N, soit environ 59 mN.'],
        pieges: [[58.8, 'Vous avez utilisé V = 5,0 sans le convertir en m³ : 5,0 L = 5,0 × 10⁻³ m³.'], [49, 'Vous avez utilisé la masse volumique de l’eau : ici le fluide est l’air, ρ_air = 1,2 kg·m⁻³.'], [0.0000588, 'Conversion de volume excessive : 1 L = 10⁻³ m³ (et non 10⁻⁶ m³).'], [0.006, 'Il manque le facteur g = 9,8 N·kg⁻¹ : Π = ρ_air × V × g.']],
        expl: 'Π = ρ_air × V × g = 1,2 × 5,0 × 10⁻³ × 9,8 = 0,059 N : environ 6 g d’air déplacé (c’est une masse), dont le poids est 0,059 N. Cette poussée est minuscule devant le poids d’un objet dense, mais pas devant celui d’un ballon rempli d’un gaz très léger.',
        indice: 'Même expression que dans un liquide, avec ρ_air à la place de ρ_fluide. Convertissez d’abord les litres en m³.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'La poussée de l’air',
      retenir: <>
        <SvgCarteAir/>
        <ul style={ULS}>
          <li>Un <strong>gaz</strong> est un fluide : il exerce lui aussi une poussée Π = ρ_air × V × g (ρ_air ≈ 1,2 kg·m⁻³, soit environ 12 N pour 1 m³).</li>
          <li>Pour un objet dense (une personne, une pierre), elle est négligeable devant le poids ; pour un ballon rempli d’un gaz moins dense que l’air, elle peut l’emporter et le faire monter.</li>
        </ul></>,
      texte: <>Vous savez expliquer l’origine de la poussée d’Archimède (la pression augmente avec la profondeur), écrire son expression vectorielle {eVec}, la calculer, la tester au dynamomètre (poids apparent F = P − Π) et prévoir si un objet flotte ou coule, et de quelle fraction il s’enfonce. Passez à l’exploration (matériau, fluide, volume) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    const d = type === 'prevoir' ? M.tirageCoule() : type === 'flotteur' ? M.tirageFlotteur() : M.tirageInconnu();
    setDefi({ ...d, rep: '', rep2: '', verifie: false, essais: 0 });
  };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    const pr = (v, a, tol) => isFinite(v) && Math.abs(v - a) <= tol * Math.abs(a);
    const x = lireNombre(defi.rep), y = lireNombre(defi.rep2 || '');
    let ok1, ok2 = true;
    if (defi.type === 'prevoir') { ok1 = pr(x, defi.vPi, 0.06); ok2 = pr(y, defi.vF, 0.06); }
    else if (defi.type === 'flotteur') { ok1 = pr(x, defi.vFrac, 0.06); ok2 = pr(y, defi.vMasse, 0.06); }
    else ok1 = pr(x, defi.vRho, 0.08);
    const ok = ok1 && ok2;
    setDefi(d => ({ ...d, verifie: true, ok, ok1, ok2, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'prevoir' ? noterP : defi.type === 'flotteur' ? noterF : noterI)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite, okCle) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('arc-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi[okCle] ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const mm3 = V => { const v = V * 1e-6, e = Math.floor(Math.log10(v) + 1e-9), sup = String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]); return `${nbf(v / Math.pow(10, e), 1)}${NB}×${NB}10${sup}${NB}m³`; };
  const mil = x => nbf(x, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['prevoir', 'Prévoir Π et le poids apparent'], ['flotteur', 'Prévoir la flottaison'], ['inconnu', 'Liquide inconnu']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'prevoir' ? 'Défi : poussée et poids apparent d’un cube immergé' : defi.type === 'flotteur' ? 'Défi : un cube qui flotte' : 'Défi : de quel liquide s’agit-il ?'}</div>
      {defi.type === 'prevoir' && <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un cube {de(defi.o.nom.toLowerCase())} (ρ<sub>objet</sub> = <strong>{mil(defi.rhoO)}{NB}kg·m⁻³</strong>), de volume <strong>V = {mil(defi.V)}{NB}cm³</strong>, est suspendu à un fil et plongé <strong>entièrement</strong> dans un fluide de masse volumique ρ<sub>fluide</sub> = <strong>{mil(defi.rhoF)}{NB}kg·m⁻³</strong> ({defi.fl.nom.toLowerCase()}). g = 9,8{NB}N·kg⁻¹. Donnez vos résultats avec 2 chiffres significatifs (marge acceptée : 6{NB}%).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Norme Π de la poussée d’Archimède.</div>
        {champ('Π', 'rep', 'N', 'ok1')}
        <IndiceDefi cache={false}>Π = ρ_fluide × V_immergé × g, avec V en m³ (1 cm³ = 10⁻⁶ m³) ; le cube est totalement immergé.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Indication F qu’afficherait un dynamomètre accroché au fil (poids apparent), cube immobile.</div>
        {champ('F', 'rep2', 'N', 'ok2')}
        <IndiceDefi cache={false}>F = P − Π, avec P = ρ_objet × V × g.</IndiceDefi></>}
      {defi.type === 'flotteur' && <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un cube {de(defi.o.nom.toLowerCase())} (ρ<sub>objet</sub> = <strong>{mil(defi.rhoO)}{NB}kg·m⁻³</strong>), de volume <strong>V = {mil(defi.V)}{NB}cm³</strong>, est tenu juste au-dessus d’un fluide de masse volumique ρ<sub>fluide</sub> = <strong>{mil(defi.rhoF)}{NB}kg·m⁻³</strong> ({defi.fl.nom.toLowerCase()}) puis posé sur sa surface : il flotte. g = 9,8{NB}N·kg⁻¹. Donnez vos résultats avec 2 chiffres significatifs (marge acceptée : 6{NB}%).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Fraction du volume du cube immergée à l’équilibre.</div>
        {champ('fraction', 'rep', '%', 'ok1')}
        <IndiceDefi cache={false}>À l’équilibre, P = Π : ρ_objet × V × g = ρ_fluide × V_immergé × g. La fraction immergée est V_immergé divisé par V.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Masse maximale que l’on peut poser sur le cube pour qu’il soit à la limite d’être totalement immergé.</div>
        {champ('m', 'rep2', 'g', 'ok2')}
        <IndiceDefi cache={false}>À la limite, le cube chargé est totalement immergé et P + (poids de la masse m) = Π, avec Π calculée pour V_immergé = V. Gardez 3 chiffres dans les calculs intermédiaires, puis convertissez le résultat en grammes.</IndiceDefi></>}
      {defi.type === 'inconnu' && <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un cube {de(defi.o.nom.toLowerCase())}, de volume <strong>V = {mil(defi.V)}{NB}cm³</strong>, est suspendu à un dynamomètre. Dans l’air, il indique <strong>P = {f1(defi.P)}{NB}N</strong> ; plongé entièrement dans un liquide inconnu, il indique <strong>F = {f1(defi.F)}{NB}N</strong> (lectures à 0,1{NB}N près). g = 9,8{NB}N·kg⁻¹. Donnez le résultat avec 2 chiffres significatifs (marge acceptée : 8{NB}%).</div>
        <div style={{ ...lbl, marginBottom: 2 }}>Masse volumique ρ du liquide.</div>
        {champ('ρ', 'rep', 'kg·m⁻³', 'ok1')}
        <IndiceDefi cache={false}>La poussée vaut Π = P − F. Comme Π = ρ_liquide × V × g, isolez ρ_liquide (V en m³).</IndiceDefi></>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="arc-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : defi.type === 'inconnu' ? '✗ Pas tout à fait. ' : `✗ Pas tout à fait (question 1 ${defi.ok1 ? 'juste' : 'à revoir'}, question 2 ${defi.ok2 ? 'juste' : 'à revoir'}). `}
        {defi.ok || (defi.essais || 0) >= 3
          ? <span style={{ fontWeight: 400 }}>{defi.type === 'prevoir'
            ? `Π = ρ_fluide × V × g = ${mil(defi.rhoF)} × ${mm3(defi.V)} × 9,8 = ${nbf(defi.vPi, 2)} N ; P = ${mil(defi.rhoO)} × ${mm3(defi.V)} × 9,8 = ${nbf(M.poids(defi.rhoO, defi.V), 1)} N ; F = P − Π = ${nbf(defi.vF, 1)} N.`
            : defi.type === 'flotteur'
              ? <>P = Π donne la fraction immergée {rOb} = {rap(`${mil(defi.rhoO)}`, `${mil(defi.rhoF)}`)} = {nbf(defi.vFrac, 1)} %. Masse posée : m = (ρ_fluide − ρ_objet) × V = ({mil(defi.rhoF)} − {mil(defi.rhoO)}) × {mm3(defi.V)} = {nbf(defi.vMasse / 1000, 3)} kg, soit {nbf(defi.vMasse, 0)} g.</>
              : <>Π = P − F = {f1(defi.P)} − {f1(defi.F)} = {f1(defi.P - defi.F)} N ; ρ = {rap('Π', '(V × g)')} = {rap(`${f1(defi.P - defi.F)}`, `${mm3(defi.V)} × 9,8`)} = {nbf(defi.vRho, 0)} kg·m⁻³.</>}</span>
          : <span style={{ fontWeight: 400 }}>{defi.type === 'prevoir' ? 'Revoyez la conversion de V en m³, la masse volumique à utiliser (celle du fluide pour Π) et F = P − Π, puis vérifiez à nouveau.' : defi.type === 'flotteur' ? 'Revoyez la condition d’équilibre P = Π et l’état « limite » (cube totalement immergé), puis vérifiez à nouveau.' : 'Déduisez d’abord la poussée Π = P − F, puis isolez la masse volumique du liquide, et vérifiez à nouveau.'}</span>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Fluide</strong> : au repos (pas de courant, pas d’agitation), incompressible, de masse volumique ρ_fluide uniforme ; ni viscosité ni tension superficielle. Les masses volumiques (eau 1 000 ; eau de mer 1 030 ; eau très salée 1 200 ; huile 900 ; air 1,2 kg·m⁻³) sont des ordres de grandeur usuels, pas des mesures.</li>
      <li><strong>Pesanteur</strong> : champ uniforme, g = 9,8 N·kg⁻¹ (identique à 9,8 m·s⁻²) pour toute la simulation (valeur arrondie : 9,81 est la valeur usuelle ; le choix est une convention du modèle).</li>
      <li><strong>Objets</strong> : cubes homogènes de masse volumique tabulée (liège 240 ; pin 500 ; glace 920 ; aluminium 2 700 ; acier 7 800 kg·m⁻³, valeurs arrondies) ; les objets sont indéformables et ne s’imbibent pas.</li>
      <li><strong>Poussée d’Archimède</strong> : résultante des forces pressantes du fluide sur la partie immergée du solide, {vPi} = −ρ_fluide × V_immergé × <Vec n="g"/> ; c’est une force exercée par le fluide, pas une propriété de l’objet. Le poids du solide ne change pas quand on l’immerge : c’est son <em>poids apparent</em> (indication du dynamomètre, F = P − Π) qui diminue.</li>
      <li><strong>Forces pressantes dessinées</strong> : seule la part due au fluide (proportionnelle à la profondeur) est représentée ; la pression atmosphérique, identique sur toutes les faces du cube, se compense et n’est pas dessinée. Longueurs des flèches proportionnelles à la profondeur, sans échelle de valeurs.</li>
      <li><strong>Scène</strong> : à l’échelle (le niveau du liquide monte quand on immerge) ; les forces sont tracées à l’échelle indiquée. Un cube flottant ou posé au fond est supposé stable (on ne traite pas les basculements).</li>
      <li><strong>Solide posé au fond</strong> : on suppose du liquide sous le solide (pas d’adhérence ni d’effet de ventouse), donc la poussée s’exerce comme s’il était immergé. <strong>Poids dans l’air</strong> : le poids P lu dans l’air néglige la poussée de l’air (voir l’étape sur l’air). <strong>Masse posée sur un flotteur</strong> : de volume négligeable, elle reste hors du liquide.</li>
      <li><strong>Mesures</strong> : valeurs du modèle (le dynamomètre est lu à 0,1 N près, sans bruit aléatoire) ; à l’équilibre d’un flotteur, Π = P par construction.</li>
      <li><strong>Conventions</strong> : les vecteurs portent une flèche ({vPi}, {vP}, {vT}), leurs normes sont des lettres simples (Π, P, T) ; volumes immergés en cm³ à l’écran, convertis en m³ dans les calculs (1 cm³ = 10⁻⁶ m³).</li>
      <li><strong>Hors périmètre</strong> : fluides en mouvement, flottaison d’objets creux ou non homogènes (bateaux), stabilité, équation de Bernoulli.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lblMenu = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const ob = ex.obj && M.objet(ex.obj), flEx = M.fluide(ex.fl);
  const frEx = M.fractionEquilibre(ob.rho, flEx.rho), legerEx = ob.rho < flEx.rho;
  const fEffEx = ex.dyn ? (legerEx ? Math.min(ex.f / 100, frEx) : ex.f / 100) : 0;
  const filDe = fEffEx < ex.f / 100 - 1e-9;                                          // cube léger retenu seulement par la flottaison : fil détendu
  let sp = null;                                                                      // propriétés de la scène
  if (enGuide) {
    const b = { fl: EAU, ob: ALU, V: 1000, mode: 'tenu', f: 1, dHaut: 3, fil: 'support', forces: [], cotes: false, pressions: false, niveauInit: false };
    const t = {
      forces: {}, pressions: { cotes: true }, resultante: { cotes: true, pressions: true }, expression: { pressions: true }, calcul: { niveauInit: true },
      dyn: { fil: 'dyn', f: 0 }, tester: { fil: 'dyn', f: fG / 100, dHaut: 0 }, nature: { ob: ACIER },
      equilibre: { ob: PIN, fil: null, dHaut: 4, forces: ['P', 'Pi'] }, fraction: { ob: GLACE, mode: 'libre', fil: null, forces: ['P', 'Pi'] },
      fluide: { ob: GLACE, mode: 'libre', fil: null, fl: M.fluide(flG) }, air: null, bilan: { ob: PIN, mode: 'libre', fil: null, forces: ['P', 'Pi'] },
    }[IDS[idx]];
    sp = t === null ? null : { ...b, ...t };
  } else if (enExplore) {
    sp = ex.dyn ? { fl: flEx, ob, V: ex.V, mode: 'tenu', f: fEffEx, dHaut: 0, fil: 'dyn', forces: ex.forces ? ['P', 'Pi', 'T'] : [] }
      : { fl: flEx, ob, V: ex.V, mode: 'libre', fil: null, forces: ex.forces ? ['P', 'Pi', 'R'] : [] };
  } else if (dd) {
    if (dd.type === 'prevoir') sp = { fl: dd.fl, ob: dd.o, V: dd.V, mode: 'tenu', f: 1, dHaut: 3, fil: 'support' };
    else if (dd.type === 'flotteur') sp = { fl: dd.fl, ob: dd.o, V: dd.V, mode: 'tenu', f: 0, fil: 'support' };
    else sp = { fl: { id: 'inconnu', rho: dd.rhoVrai, lab: ['liquide', 'inconnu'] }, ob: dd.o, V: dd.V, mode: 'tenu', f: 1, dHaut: 3, fil: 'dyn' };
  }
  const ariaScene = sp && `Un ${sp.ob.lab.join(' ')} dans un bécher contenant ${sp.fl.lab.join(' ')}, à l’échelle. ${sp.mode === 'libre' ? 'Le cube est lâché.' : sp.fil === 'dyn' ? 'Le cube est suspendu à un dynamomètre.' : 'Le cube est suspendu à un fil.'}${sp.forces && sp.forces.length ? ' Les forces sont tracées à l’échelle indiquée.' : ''}${sp.pressions ? ' Des flèches indiquent les forces pressantes de l’eau sur les faces du cube, plus longues quand la profondeur est plus grande.' : ''}`;
  const scene = enGuide && IDS[idx] === 'air' ? <SceneBallon aria="Un ballon de baudruche de 5,0 litres entouré d’air."/> : sp && <SceneArchimede {...sp} aria={ariaScene}/>;
  const montreGrapheG = enGuide && idx === I.tester, montreGrapheEx = enExplore && ex.dyn;
  const grapheG = montreGrapheG && <GrapheArchimede points={pointsDe(visG, ALU.rho, 1000, EAU.rho)} Vmax={1000} Pimax={PI_ALU} aria="Graphe de la poussée d’Archimède déduite du dynamomètre en fonction du volume immergé du cube, avec les points relevés."/>;
  const grapheEx = montreGrapheEx && <GrapheArchimede points={pointsDe(ex.vis, ob.rho, ex.V, flEx.rho)} Vmax={ex.V} Pimax={M.poussee(flEx.rho, ex.V)} droite={ex.droite ? flEx.rho * 1e-6 * M.G : null} aria="Graphe de la poussée d’Archimède déduite du dynamomètre en fonction du volume immergé, avec les points relevés."/>;
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {dd && dd.type === 'flotteur' && <div style={aide}>Le cube est tenu juste au-dessus du liquide, avant d’être posé sur sa surface.</div>}
      {scene}
      {grapheG && <div style={{ marginTop: 10, ...cadre('graphe') }}>{grapheG}</div>}
    </div>);

  // ---------- commandes et mesures (parcours) ----------
  const selectFl = (val, on, liste = M.FLUIDES, nom = 'Fluide') => (
    <label style={lblMenu}>{nom}
      <select value={val} onChange={e => on(e.target.value)} style={{ ...menu, marginTop: 2 }}>{liste.map(x => <option key={x.id} value={x.id}>{x.nom} ({nbf(x.rho, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kg·m⁻³)</option>)}</select></label>);
  const boxCommandes = enGuide && (idx === I.tester || idx === I.fluide) && (
    <div style={{ ...styleBoite, ...cadre('curseurs') }}>
      {idx === I.tester && <><div style={titreCarte}>Dynamomètre : plonger le cube</div><div style={aide}>Enfoncez le cube par crans de 10 % de son volume avec les boutons − / +.</div>
        <ControleImmersion f={fG} onChange={changerFG} V={1000}/></>}
      {idx === I.fluide && <><div style={titreCarte}>Fluide dans le bécher</div><div style={aide}>Le cube de glace est lâché dans le fluide choisi.</div>
        {selectFl(flG, setFlG)}</>}
    </div>);
  const frG = M.fractionEquilibre(GLACE.rho, M.fluide(flG).rho);
  const boxMesuresGuide = enGuide && (idx === I.dyn || idx === I.tester || idx === I.fluide) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      {idx === I.dyn && <LigneMesure nom="Indication du dynamomètre" valeur={`${f1(P_ALU)}${NB}N`}/>}
      {idx === I.tester && <>
        <LigneMesure nom="Volume immergé" valeur={`${nbf(10 * fG, 0)}${NB}cm³`}/>
        <LigneMesure nom="Indication F du dynamomètre" valeur={`${f1(M.lecture(M.poidsApparent(ALU.rho, EAU.rho, 1000, fG / 100)))}${NB}N`}/>
        <LigneMesure nom="Poussée déduite Π = P − F" valeur={`${f1(P_ALU - M.lecture(M.poidsApparent(ALU.rho, EAU.rho, 1000, fG / 100)))}${NB}N`} couleur={BLEU}/></>}
      {idx === I.fluide && <>
        <LigneMesure nom="Volume immergé" valeur={`${nbf(1000 * frG, 0)}${NB}cm³`}/>
        <LigneMesure nom="Fraction immergée" valeur={`${nbf(100 * frG, 0)}${NB}%`}/>
        <LigneMesure nom="État du cube" valeur={M.etat(GLACE.rho, M.fluide(flG).rho) === 'flotte' ? 'il flotte' : M.etat(GLACE.rho, M.fluide(flG).rho) === 'coule' ? 'il coule' : 'entre deux eaux'} couleur={BLEU}/></>}
    </div>);

  // ---------- exploration ----------
  const majEx = f => setEx(s => ({ ...s, ...f, vis: [0], f: 0 }));
  const changerFEx = f => setEx(s => ({ ...s, f, vis: s.vis.includes(Math.round(Math.min(f / 100, legerEx ? frEx : 1) * 100)) ? s.vis : [...s.vis, Math.round(Math.min(f / 100, legerEx ? frEx : 1) * 100)] }));
  const mil2 = x => nbf(x, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const VimEx = ex.dyn ? fEffEx * ex.V : frEx * ex.V, PiEx = M.poussee(flEx.rho, VimEx), PEx = M.poids(ob.rho, ex.V), etatEx = M.etat(ob.rho, flEx.rho);
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez un objet (un cube) et un fluide : le cube est lâché, il flotte ou il coule. Vous pouvez aussi le tenir au dynamomètre pour mesurer la poussée.</div>
      <Section titre={`Objet et fluide : ${ob.nom} · ${flEx.nom.toLowerCase()} · ${mil2(ex.V)} cm³`} ouvert={ouv.objet} onBascule={() => setOuv(o => ({ ...o, objet: !o.objet }))}>
        <div style={aide}>La masse volumique de l’objet et celle du fluide décident s’il flotte ou coule ; le volume fixe la taille du cube.</div>
        <label style={lblMenu}>Matériau du cube
          <select value={ex.obj} onChange={e => majEx({ obj: e.target.value })} style={{ ...menu, marginTop: 2 }}>{M.OBJETS.map(x => <option key={x.id} value={x.id}>{x.nom} ({mil2(x.rho)} kg·m⁻³)</option>)}</select></label>
        {selectFl(ex.fl, v => majEx({ fl: v }))}
        <label style={lblMenu}>Volume du cube
          <select value={ex.V} onChange={e => majEx({ V: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>{M.VOLUMES.map(v => <option key={v} value={v}>{mil2(v)} cm³</option>)}</select></label>
      </Section>
      <Section titre={ex.dyn ? `Dynamomètre : cube tenu, immergé à ${Math.round(100 * fEffEx)} %` : 'Dynamomètre : cube lâché (non tenu)'} ouvert={ouv.dyn} onBascule={() => setOuv(o => ({ ...o, dyn: !o.dyn }))}>
        <div style={aide}>Tenez le cube au bout d’un fil accroché à un dynamomètre et enfoncez-le progressivement : l’indication F diminue, et le graphe donne la poussée Π = P − F pour chaque volume immergé.</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex.dyn} onChange={e => setEx(s => ({ ...s, dyn: e.target.checked, f: 0, vis: [0] }))} style={{ width: 20, height: 20 }}/>Tenir le cube au dynamomètre</label>
        {ex.dyn && <ControleImmersion f={ex.f} onChange={changerFEx} V={ex.V}/>}
        {ex.dyn && filDe && <div style={{ ...aide, color: '#b45309' }}>L’objet est moins dense que le fluide : il flotte, le fil se détend et l’indication tombe à 0 N.</div>}
        {ex.dyn && <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex.droite} onChange={e => setEx(s => ({ ...s, droite: e.target.checked }))} style={{ width: 20, height: 20 }}/>Tracer la droite prévue par le modèle (pointillés)</label>}
      </Section>
      <Section titre={ex.forces ? 'Affichage : forces tracées à l’échelle' : 'Affichage : forces masquées'} ouvert={ouv.aff} onBascule={() => setOuv(o => ({ ...o, aff: !o.aff }))}>
        <div style={aide}>Affichez les forces (poids, poussée, tension du fil ou réaction du fond) pour comparer leurs longueurs.</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex.forces} onChange={e => setEx(s => ({ ...s, forces: e.target.checked }))} style={{ width: 20, height: 20 }}/>Afficher les forces</label>
      </Section>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>{ex.dyn ? 'Cube tenu au dynamomètre.' : 'Cube lâché, à l’équilibre.'}</div>
      <LigneMesure nom="Poids P du cube" valeur={`${f1(PEx)}${NB}N`}/>
      <LigneMesure nom="Volume immergé" valeur={`${nbf(VimEx, 0)}${NB}cm³ (${nbf(100 * VimEx / ex.V, 0)}${NB}%)`}/>
      <LigneMesure nom="Poussée d’Archimède Π" valeur={`${f1(PiEx)}${NB}N`} couleur={BLEU}/>
      {ex.dyn && <LigneMesure nom="Poids apparent F (dynamomètre)" valeur={`${f1(M.lecture(Math.max(0, PEx - PiEx)))}${NB}N`} couleur={ORANGE}/>}
      {!ex.dyn && etatEx === 'coule' && <LigneMesure nom="Réaction du fond R" valeur={`${f1(PEx - PiEx)}${NB}N`}/>}
      {!ex.dyn && <LigneMesure nom="État du cube" valeur={etatEx === 'flotte' ? 'il flotte' : etatEx === 'coule' ? 'il coule (posé au fond)' : 'entre deux eaux'} couleur={VERT}/>}
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Lâchez le cube de pin dans l’eau douce, puis dans l’eau très salée : de quelle fraction s’enfonce-t-il ? Comparez au rapport {rOb}.</li>
        <li>Choisissez l’acier, puis l’aluminium, à volume égal : la poussée change-t-elle ? Et le poids apparent ?</li>
        <li>Lâchez le cube de glace dans l’huile, dans l’eau douce, dans l’eau de mer : dans quel cas flotte-t-il ? De quelle fraction s’enfonce-t-il dans l’eau de mer (comme un iceberg) ?</li>
        <li>Tenez l’aluminium au dynamomètre, enfoncez-le par crans et tracez la droite prévue par le modèle : les points sont-ils alignés ?</li>
        <li>Doublez le volume du cube (avec le même matériau) : que deviennent le poids, la poussée totale et la fraction immergée du flotteur ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Origine : la pression augmente avec la profondeur ; la résultante des forces pressantes sur le solide immergé est la poussée {vPi}, verticale, vers le haut.</li>
          <li>Expression : {eVec}, norme {eNorme} (V_immergé = volume de fluide déplacé).</li>
          <li>Dynamomètre : poids apparent F = P − Π ; le poids P ne change pas.</li>
          <li>Flotte si ρ_objet &lt; ρ_fluide, avec une fraction immergée égale à {rOb} ; coule si ρ_objet &gt; ρ_fluide.</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .arc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .arc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .arc-col { display: flex; flex-direction: column; gap: 12px; }
        .arc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .arc-l1.cote .arc-carte { order: 2; } .arc-l1.cote .arc-main { order: 1; }
          .arc-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .arc-ex > * { grid-column: 1; } .arc-ex > .arc-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .arc-l1.cote { grid-template-columns: minmax(0, 1fr); }
          .arc-l1.avant .arc-main, .arc-l1.avant .arc-col { display: contents; } .arc-l1.avant .arc-o1 { order: 1; } .arc-l1.avant .arc-o2 { order: 2; } .arc-l1.avant .arc-carte { order: 3; } .arc-l1.avant .arc-o4 { order: 4; } }
        @media (prefers-reduced-motion: no-preference) { .arc-in { animation: arc-fondu 0.35s ease-out; } @keyframes arc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Poussée d’Archimède : origine et expression</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un solide plongé dans un fluide au repos subit, de la part du fluide, une force verticale dirigée vers le haut : la poussée d’Archimède.</div>
      {!enExplore && <div className={`arc-l1 cote${enGuide && idx === I.tester ? ' avant' : ''}`}>
        {enGuide ? <div className="arc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="arc-carte">{panneauHypo}</div> : null}
        <div className="arc-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'prevoir' ? suiviP : defi.type === 'flotteur' ? suiviF : suiviI}/></div>}
          <div className="arc-col">
            {(!enDefi || defi) && scene && <div className="arc-in arc-o1">{boxScene}</div>}
            {boxCommandes && <div className="arc-in arc-o2">{boxCommandes}</div>}
            {boxMesuresGuide && <div className="arc-in arc-o4">{boxMesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="arc-ex">
        <div><div style={styleBoite}>{scene}</div></div>
        <div className="arc-ctrl">{reglagesEx}</div>
        {grapheEx && <div><div style={styleBoite}>{grapheEx}</div></div>}
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idx === I.bilan && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
