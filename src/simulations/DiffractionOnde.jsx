import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./difModele";
import * as O from "./ondesModele";
import { QCM_PARCOURS as Q } from "./difQcm";
import { SceneOndes, MontageLaser, EcranLumiere } from "./difScenes";
import { SvgCarteDiffraction, SvgCarteAngle, SvgCarteEchelle, SvgCarteFigure, SvgCarteBilan } from "./difSchemas";

const SIM_ID = 181, CLE_GUIDE = 'diffraction-onde-tg-guide-v1';
declarerDefis(SIM_ID, [['fente', 'Retrouver la largeur de la fente'], ['laser', 'Retrouver la longueur d’onde du laser']]);

// ====================================================
// SIM 181 — DIFFRACTION D'UNE ONDE : CONDITIONS D'OBSERVATION ET ANGLE CARACTÉRISTIQUE
//  (TG spé PC, « Caractériser les phénomènes ondulatoires »). Capacités visées (jamais affichées à l'élève) : caractériser la diffraction dans des situations
//  variées et en citer des conséquences concrètes ; exploiter θ = λ/a ; illustrer qualitativement ; exploiter la relation pour une onde lumineuse diffractée par
//  une fente rectangulaire (largeur de la tache centrale L = 2 λ D / a), éventuellement avec un traitement d'image (profil d'intensité).
//  Base : simulation 83 (TSTL, Diffraction.jsx) et ondesModele.js, importé sans modification ; modèle propre : difModele.js (test : difModele.test.mjs).
// ====================================================

const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sci = (x, cs = 2) => { let e = Math.floor(Math.log10(Math.abs(x))), m = Math.abs(x) / 10 ** e; if (Number(m.toFixed(cs - 1)) >= 10) { m /= 10; e += 1; } return `${m.toFixed(cs - 1).replace('.', ',')}${NB}×${NB}10${e < 0 ? '⁻' : ''}${String(Math.abs(e)).split('').map(c => SUPS[+c]).join('')}`; };
const IDS = ['onde', 'reduire', 'lambda', 'theta', 'table', 'porte', 'laser', 'figure', 'pointer', 'thetaL', 'largeur', 'bilan'];
const REF = { onde: { a: 10, lam: 1 }, reduire: { a: 10, lam: 1 }, lambda: { a: 4, lam: 1 }, theta: { a: 4, lam: 1 } };
const LG = { a: 100, lam: 532, D: 2, W: 40, expo: 2 };            // fente du parcours : 100 µm, laser vert, écran à 2,00 m, cadrage ± 40 mm
const L_AUTRE = 35, A_AUTRE = M.aDepuisL(532e-9, 2, L_AUTRE * 1e-3) * 1e6;   // autre fente de l'étape finale : L = 35 mm, a ≈ 61 µm
const TOL_POINTE = 0.8;                                           // mm : écart accepté pour chaque repère
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const FTheta = <Formule><mi>θ</mi><mo>≈</mo><mfrac><mi>λ</mi><mi>a</mi></mfrac></Formule>;
const FThetaL = <Formule><mi>θ</mi><mo>≈</mo><mfrac><mi>L</mi><mrow><mn>2</mn><mi>D</mi></mrow></mfrac></Formule>;
const FL = <Formule><mi>L</mi><mo>=</mo><mfrac><mrow><mn>2</mn><mi>λ</mi><mi>D</mi></mrow><mi>a</mi></mfrac></Formule>;

const SITUATIONS_TXT = [['Cuve à ondes (eau)', `2,0${NB}cm`, `λ${NB}=${NB}1,0${NB}cm`], ['Voix par une porte ouverte (son)', `0,80${NB}m`, `f${NB}=${NB}340${NB}Hz`], ['Laser sur une fente fine (lumière)', `0,10${NB}mm`, `λ${NB}=${NB}532${NB}nm`], ['Lumière du jour par une porte', `0,80${NB}m`, `λ${NB}=${NB}0,50${NB}µm`]];

function Reglage({ nom, valeur, min, max, pas, unite, dec, onChange, couleur = '#0e7490' }) {
  const bt = { ...stylePetitBouton(false), minWidth: 40, minHeight: 40, fontSize: 20, lineHeight: 1 };
  const arrondi = v => Math.round(v * 1000) / 1000;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{avecIndices(nom)}</span><span style={{ color: KIT.txt }}>{nbf(valeur, dec)}{NB}{unite}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" aria-label={`Diminuer ${nom}`} onClick={() => onChange(Math.max(min, arrondi(valeur - pas)))} style={bt}>−</button>
        <input type="range" min={min} max={max} step={pas} value={valeur} aria-label={nom} aria-valuetext={`${nbf(valeur, dec)} ${unite}`} onChange={e => onChange(parseFloat(e.target.value))} style={{ flex: 1, accentColor: couleur, minWidth: 0 }}/>
        <button type="button" aria-label={`Augmenter ${nom}`} onClick={() => onChange(Math.min(max, arrondi(valeur + pas)))} style={bt}>+</button>
      </div>
    </div>);
}

// Repères à pointer sur l'image : curseur et boutons − / + (un pas = W/200 : 0,2 mm pour un cadrage de ± 40 mm)
function Reperes({ W, x1, x2, setX, retablir }) {
  const pas = W / 200, dec = pas < 0.1 ? 2 : 1;
  const bt = { ...stylePetitBouton(false), minWidth: 40, minHeight: 40, fontSize: 20, lineHeight: 1 };
  const ligne = (i, nom, v, c) => (
    <div key={i} style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}><span>{nom}</span><span style={{ color: KIT.txt }}>{nbf(v, dec)}{NB}mm</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" aria-label={`Repère ${i} vers la gauche`} onClick={() => setX(i, Math.max(-W, v - pas))} style={bt}>−</button>
        <input type="range" min={-W} max={W} step={pas / 2} value={v} aria-label={nom} aria-valuetext={`${nbf(v, dec + 1)} millimètres`} onChange={e => setX(i, parseFloat(e.target.value))} style={{ flex: 1, accentColor: c, minWidth: 0 }}/>
        <button type="button" aria-label={`Repère ${i} vers la droite`} onClick={() => setX(i, Math.min(W, v + pas))} style={bt}>+</button>
      </div>
    </div>);
  return (
    <div role="group" aria-label="Placer les repères" style={{ background: '#f1f5f9', borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Un clic sur − ou + déplace le repère de {nbf(pas, dec)}{NB}mm. Vous pouvez aussi faire glisser un repère sur l’image.</div>
      {ligne(1, 'Repère 1 (orange, trait plein)', x1, '#b45309')}
      {ligne(2, 'Repère 2 (bleu, tirets)', x2, '#0e7490')}
      <button type="button" onClick={retablir} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir les repères</button>
    </div>);
}

const Menu = ({ label, valeur, options, onChange }) => (
  <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>{label}
    <select value={valeur} onChange={e => onChange(e.target.value)} style={{ font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', marginTop: 2 }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>);

const reduit = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

// ====================================================
export function SimulationDiffractionOnde() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviF, noterF] = useCompteurDefi(), [suiviL, noterL] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [cgo, setCgo] = useState({});                                  // réglages de la cuve changés par l'élève, par étape
  const [rg, setRg] = useState({ x1: -5, x2: 5 });                     // repères du parcours (mm)
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('fente');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ regl: false, mes: false, aff: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ sit: 'eau', aE: 4, lE: 1, aS: 0.8, fS: 340, aL: 100, lamL: 532, D: 2, wi: 1, angle: true, anim: !reduit(), vue: 'ondes', mes: false, x1: -6, x2: 6 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- parcours : cuve ----------
  const pg = { ...(REF[idEtape] || REF.onde), ...(cgo[idEtape] || {}) }, ref = REF[idEtape];
  const surRef = !ref || (Math.abs(pg.a - ref.a) < 1e-6 && Math.abs(pg.lam - ref.lam) < 1e-6);
  const setPg = f => setCgo(c => ({ ...c, [idEtape]: { ...(c[idEtape] || {}), ...f } }));
  // ---------- parcours : écran ----------
  const LpG = M.largeurTache(LG.a * 1e-6, LG.lam * 1e-9, LG.D) * 1e3;       // mm (valeur du modèle, jamais affichée avant l'étape de mesure)
  const loG = Math.min(rg.x1, rg.x2), hiG = Math.max(rg.x1, rg.x2);
  const pointe = Math.abs(loG + LpG / 2) <= TOL_POINTE && Math.abs(hiG - LpG / 2) <= TOL_POINTE;
  const LmesG = Number(Math.abs(rg.x2 - rg.x1).toFixed(1)), thetaMes = LmesG * 1e-3 / (2 * LG.D);
  const setRepG = (i, v) => setRg(r => ({ ...r, [i === 1 ? 'x1' : 'x2']: v }));

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'onde', titre: 'Une onde rencontre une ouverture',
      texte: <>Voici une <strong>cuve à ondes</strong> vue de dessus. Une onde plane, de longueur d’onde λ = 1{NB}cm, arrive de la gauche sur un mur percé d’une ouverture de largeur a = 10{NB}cm. Les zones claires sont des crêtes, les zones sombres des creux.</>,
      tache: { type: 'qcm', q: 'Derrière cette ouverture, l’onde…', ...Q.onde,
        expl: 'Quand l’ouverture est très grande devant la longueur d’onde, l’onde passe presque sans changer de direction : le faisceau garde la largeur de l’ouverture. Elle ne repart pas dans toutes les directions (il faudrait une ouverture bien plus petite), elle n’est pas arrêtée par l’ouverture et sa longueur d’onde ne change pas (elle dépend de l’onde et du milieu, pas de l’ouverture).',
        indice: 'Comparez la largeur de l’ouverture (10 cm) à la longueur d’onde (1 cm) : l’ouverture est-elle grande ou petite devant λ ?' } },
    { id: 'reduire', titre: 'Rétrécir l’ouverture',
      texte: <>Gardez λ = 1{NB}cm et faites varier la largeur a de l’ouverture avec les boutons − et + : comparez a = 10{NB}cm et a = 2{NB}cm.</>,
      tache: { type: 'qcm', q: 'Entre a = 10 cm et a = 2 cm, la région atteinte par les ondes derrière le mur…', ...Q.reduire,
        expl: 'Plus l’ouverture est petite, plus la région atteinte derrière le mur s’élargit : les ondes s’étalent dans des directions différentes. C’est la diffraction. Il ne faut pas confondre : ce n’est pas parce que davantage d’ondes passent par une grande ouverture que la région est plus large (elle est alors presque aussi large que l’ouverture), et le faisceau ne se rétrécit pas avec l’ouverture. L’amplitude, elle, ne décrit pas l’étalement.',
        indice: 'Réglez a = 10 cm puis a = 2 cm et comparez la largeur de la zone agitée derrière le mur.' } },
    { id: 'lambda', titre: 'Et si la longueur d’onde change ?',
      texte: <>Prenez a = 4{NB}cm (bouton « Rétablir » si besoin), puis comparez λ = 1{NB}cm et λ = 2{NB}cm avec les boutons − et +.</>,
      tache: { type: 'qcm', q: 'À ouverture donnée, quand la longueur d’onde λ augmente, l’étalement derrière l’ouverture…', ...Q.lambda,
        expl: 'La diffraction dépend du rapport entre λ et a : à ouverture donnée, elle est d’autant plus marquée que λ est grande. Elle ne dépend donc pas que de a, elle ne diminue pas quand λ augmente, et il ne faut pas confondre λ et a : c’est une petite ouverture, mais une grande longueur d’onde, qui étalent le plus.',
        indice: 'Comparez les deux dessins pour λ = 1 cm et λ = 2 cm, avec la même ouverture a = 4 cm : dans lequel les ondes s’étalent-elles le plus ?' } },
    { id: 'theta', titre: 'L’angle caractéristique θ',
      retenirTitre: 'La diffraction : l’onde s’étale', retenir: <>
        <SvgCarteDiffraction/>
        <ul style={UL}>
          <li>Une onde qui rencontre une <strong>ouverture ou un obstacle de petite taille</strong> s’étale : c’est la <strong>diffraction</strong>.</li>
          <li>L’étalement est d’autant plus grand que a est <strong>petite</strong> et que λ est <strong>grande</strong>.</li>
          <li>Mémo : <strong>« petite ouverture, grande diffraction »</strong>. Idée fausse : « l’onde reste droite derrière un trou ». Vrai : elle s’étale dès que a n’est plus très grande devant λ.</li>
        </ul></>,
      texte: <>Les deux traits rouges en tirets marquent les directions des <strong>premières extinctions</strong>, où l’onde s’annule. L’angle <strong>θ</strong> qu’elles font avec l’axe est l’<strong>angle caractéristique de diffraction</strong>. Pour un petit angle (λ petite devant a), exprimé en radians, <strong>θ = frac(λ|a)</strong>, avec λ et a dans la même unité. Ici a = 4{NB}cm et λ = 1{NB}cm.</>,
      tache: { type: 'num', carnet: false, q: 'Angle caractéristique θ (en rad)', unite: 'rad', vrai: 0.25, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        bloque: surRef ? null : 'Rétablissez d’abord a = 4 cm et λ = 1 cm avec le bouton « Rétablir » sous le dessin.',
        calcul: () => ['Hypothèse : angle petit, donc θ ≈ frac(λ|a) (en radians).', 'λ et a sont déjà dans la même unité (le centimètre) : le rapport n’a pas d’unité.', 'θ = frac(1|4) = 0,25 rad.'],
        pieges: [[14.3, 'Vous avez donné l’angle en degrés. La relation θ = frac(λ|a) donne des radians : 0,25 rad correspond à environ 14°.'], [4, 'Division à l’envers : θ = frac(λ|a), pas frac(a|λ).']],
        expl: 'θ = frac(λ|a) = frac(1|4) = 0,25 rad, soit environ 14°. Les traits rouges de la simulation suivent ce calcul à environ 1 % près : l’approximation des petits angles est bonne ici.',
        indice: 'θ = frac(λ|a), avec λ et a exprimées dans la même unité (ici le centimètre).' } },
    { id: 'table', titre: 'Eau, son, lumière : comparer a et λ',
      retenirTitre: 'L’angle caractéristique de diffraction', retenir: <>
        <SvgCarteAngle/>{FTheta}
        <ul style={UL}>
          <li>θ : angle de la <strong>première extinction</strong> avec l’axe, en <strong>radians</strong> ; λ et a dans la même unité.</li>
          <li>Valable si λ ≪ a (petits angles).</li>
          <li>Mémo : <strong>« petit a, grand θ »</strong>. Idée fausse : « θ se calcule en degrés ». Vrai : en radians.</li>
        </ul></>,
      texte: <>On compare λ et a, dans la même unité, pour quatre situations (valeurs de référence, ordres de grandeur). Pour le son, λ = frac(v|f) avec une célérité v = 340{NB}m/s dans l’air.</>,
      tache: { type: 'qcm', q: 'Dans quelle situation la diffraction est-elle la plus marquée ?', ...Q.table,
        expl: `On compare le rapport frac(λ|a) : cuve 0,50 ; voix λ = frac(340|340) = 1,0 m donc frac(λ|a) = 1,25 ; laser environ ${sci(M.rapport(532e-9, 100e-6), 1)} ; lumière du jour environ ${sci(M.rapport(500e-9, 0.8), 1)}. La diffraction est la plus marquée pour le plus grand rapport : la voix. Un petit a ne suffit pas (le laser, avec une fente de 0,10 mm, diffracte peu), il faut le comparer à λ.`,
        indice: 'Mettez λ et a dans la même unité pour chaque ligne, puis comparez les rapports frac(λ|a) : le plus grand donne la diffraction la plus marquée.' } },
    { id: 'porte', titre: 'Entendre sans voir',
      texte: <>Dans un couloir, vous entendez quelqu’un parler derrière une porte ouverte de largeur 0,80{NB}m, mais vous ne le voyez pas. Ordres de grandeur : voix, λ ≈ 1{NB}m ; lumière visible, λ ≈ 0,5{NB}µm.</>,
      tache: { type: 'qcm', q: 'Comment l’expliquer ?', ...Q.porte,
        expl: 'Pour la voix, λ est du même ordre que a = 0,80 m : le son se diffracte beaucoup et gagne toutes les directions derrière la porte. Pour la lumière, λ est environ un million de fois plus petite que a : la diffraction est négligeable, la lumière reste en ligne droite. Les autres explications sont fausses : la lumière va plus vite que le son, elle n’est pas absorbée par les murs (elle passe par la porte) et sa fréquence est bien plus élevée que celle du son, ce qui rend λ plus petite, donc moins diffractée.',
        indice: 'Comparez λ à la largeur de la porte (0,80 m) pour la voix, puis pour la lumière.' } },
    { id: 'laser', titre: 'Un laser éclaire une fente',
      retenirTitre: 'Comparer a et λ', retenir: <>
        <SvgCarteEchelle/>
        <ul style={UL}>
          <li>On compare toujours <strong>λ et a</strong>, dans la même unité (convertir avant de diviser).</li>
          <li>Diffraction <strong>marquée</strong> si a est de l’ordre de λ ou plus petite ; <strong>négligeable</strong> si λ ≪ a.</li>
          <li>Mémo : <strong>« onde longue, grande diffraction »</strong>. Idée fausse : « un trou minuscule suffit toujours ». Vrai : minuscule devant λ.</li>
        </ul></>,
      texte: <>Un laser vert, de longueur d’onde λ = 532{NB}nm, éclaire une fente fine de largeur a = 100{NB}µm (schéma ci-contre) ; l’écran est à D = 2,00{NB}m. Pour la lumière aussi, l’angle caractéristique est θ = frac(λ|a).</>,
      tache: { type: 'num', carnet: false, q: 'Angle caractéristique θ (en rad)', unite: 'rad', vrai: 532e-9 / 100e-6, tol: 0.05, affiche: v => sci(v, 2), cs: 2,
        aide: 'Notation scientifique acceptée, par exemple 2,5e-4.',
        calcul: () => ['Conversions : λ = 532 nm = 532 × 10⁻⁹ m ; a = 100 µm = 100 × 10⁻⁶ m = 1,00 × 10⁻⁴ m.', `θ = frac(λ|a) = frac(532 × 10⁻⁹|1,00 × 10⁻⁴) = ${sci(5.32e-3, 3)} rad.`, 'Hypothèse : θ ≪ 1, donc θ ≈ frac(λ|a) (l’écart avec arcsin est inférieur à 10⁻⁵ en valeur relative).'],
        pieges: [[5.32, 'λ est en nm et a en µm : mettez-les dans la même unité (1 µm = 1 000 nm) avant de diviser.'], [188, 'Division à l’envers : θ = frac(λ|a), pas frac(a|λ).'], [0.305, 'Vous avez donné l’angle en degrés : la relation donne des radians.']],
        expl: `θ = frac(λ|a) = frac(532 × 10⁻⁹|1,00 × 10⁻⁴) = ${sci(5.32e-3, 3)} rad : environ 0,3°. La lumière diffractée par une fente fine reste dans un angle très petit, mais l’écran à 2 m l’agrandit.`,
        indice: 'Mettez λ et a en mètres : 1 nm = 10⁻⁹ m et 1 µm = 10⁻⁶ m. Puis θ = frac(λ|a).' } },
    { id: 'figure', titre: 'La figure de diffraction',
      texte: <>Sur l’écran, à D = 2,00{NB}m, on observe cette figure. La fente est verticale : la lumière s’étale horizontalement. On y voit une <strong>tache centrale</strong> très lumineuse, puis des taches secondaires beaucoup moins lumineuses. La règle est graduée en millimètres, le zéro est au centre.</>,
      tache: { type: 'qcm', q: 'Où mesure-t-on la largeur L de la tache centrale ?', ...Q.figure,
        expl: 'L est la distance entre les centres des deux premières extinctions (les deux zones sombres qui encadrent la tache centrale). Le bord apparent de la tache dépend de l’exposition de l’image (une tache saturée paraît plus large), les taches secondaires ne la délimitent pas, et le bord de l’écran ne dit rien sur la figure.',
        indice: 'Repérez la tache centrale, la plus lumineuse, puis regardez ce qui la sépare des taches voisines : la largeur L se mesure entre deux repères symétriques par rapport au centre.' } },
    { id: 'pointer', titre: 'Pointer les extinctions',
      texte: <>Un logiciel de traitement d’image donne le profil d’intensité sous l’image : les creux de la courbe sont les extinctions. Placez le repère 1 (orange, trait plein) et le repère 2 (bleu, tirets) au centre des deux premiers creux, de part et d’autre de la tache centrale.</>,
      tache: { type: 'action', ok: pointe, label: (rg.x1 !== -5 || rg.x2 !== 5) ? 'Voir la bonne position' : undefined, faire: () => setRg({ x1: -LpG / 2, x2: LpG / 2 }), consigne: 'Placez les deux repères sur les centres des deux premiers creux du profil' } },
    { id: 'thetaL', titre: 'De la largeur L à l’angle θ',
      texte: <>Lisez dans « Mesures » la largeur L entre vos deux repères. Vue depuis la fente, la demi-largeur de la tache centrale correspond à l’angle θ : pour un petit angle, <strong>θ = frac(L|2 D)</strong>, avec D = 2,00{NB}m.</>,
      tache: { type: 'num', q: 'Angle θ déduit de la figure (en rad)', unite: 'rad', vrai: thetaMes, tol: 0.05, affiche: v => sci(v, 2), cs: 2,
        bloque: pointe ? null : 'Placez d’abord les repères sur les extinctions (étape précédente).',
        aide: 'Notation scientifique acceptée, par exemple 2,5e-4.',
        calcul: () => [`Unités SI : L = ${nbf(LmesG, 1)} mm = ${nbf(LmesG, 1)} × 10⁻³ m ; D = 2,00 m.`, `θ = frac(L|2 D) = frac(${nbf(LmesG, 1)} × 10⁻³|2 × 2,00) = ${sci(thetaMes, 3)} rad.`, 'Hypothèse : petit angle, tan θ ≈ θ.'],
        pieges: [[2 * thetaMes, 'Il manque le facteur 2 : c’est la demi-largeur frac(L|2) qui est vue sous l’angle θ, donc θ = frac(L|2 D).'], [thetaMes * 1e3, 'Vérifiez l’unité : L doit être en mètres (1 mm = 10⁻³ m) avant de diviser.']],
        expl: `θ ≈ ${sci(thetaMes, 2)} rad. On retrouve, aux erreurs de pointé près, la valeur frac(λ|a) = ${sci(5.32e-3, 2)} rad calculée à l’étape « Un laser éclaire une fente » : la mesure sur l’image confirme la relation.`,
        indice: 'La demi-largeur de la tache, frac(L|2), est vue depuis la fente à la distance D : θ = frac(L|2 D), avec L et D en mètres.' } },
    { id: 'largeur', titre: 'Une autre fente',
      retenirTitre: 'Exploiter la figure d’une fente', retenir: <>
        <SvgCarteFigure/>{FThetaL}
        <ul style={UL}>
          <li><strong>L</strong> : largeur de la tache centrale, mesurée <strong>entre les centres des deux premiers creux</strong> du profil d’intensité.</li>
          <li>Avec θ = frac(λ|a), on obtient aussi L = frac(2 λ D|a) : fente plus fine, tache plus large.</li>
          <li>Mémo : <strong>« la demi-largeur frac(L|2) est vue sous θ »</strong>. Idée fausse : mesurer au bord de la tache saturée. Vrai : au centre des creux.</li>
        </ul></>,
      texte: <>On remplace la fente par une autre, de largeur inconnue, avec le même laser (λ = 532{NB}nm) et le même écran (D = 2,00{NB}m). La tache centrale a maintenant pour largeur L = {L_AUTRE}{NB}mm. Comme θ = frac(λ|a) et θ = frac(L|2 D), on a <strong>L = frac(2 λ D|a)</strong>.</>,
      tache: { type: 'num', q: 'Largeur a de cette fente (en µm)', unite: 'µm', vrai: A_AUTRE, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Unités SI : λ = 532 × 10⁻⁹ m ; D = 2,00 m ; L = 35 × 10⁻³ m.', `Isoler a : a = frac(2 λ D|L) = frac(2 × 532 × 10⁻⁹ × 2,00|35 × 10⁻³) = ${nbf(A_AUTRE * 1e-6 * 1e5, 2)} × 10⁻⁵ m = ${nbf(A_AUTRE, 0)} µm.`],
        pieges: [[A_AUTRE / 2, 'Il manque le facteur 2 : L = frac(2 λ D|a) donc a = frac(2 λ D|L).'], [A_AUTRE * 2, 'Un facteur 2 en trop : a = frac(2 λ D|L).'], [A_AUTRE * 1e-6, 'Vérifiez l’unité : le résultat est demandé en micromètres (1 µm = 10⁻⁶ m).']],
        expl: `a = frac(2 λ D|L) ≈ ${nbf(A_AUTRE, 0)} µm : une fente plus fine que la précédente (100 µm), donc une tache plus large (35 mm au lieu de 21 mm). Quand a diminue, L augmente.`,
        indice: 'Isolez a dans L = frac(2 λ D|a), puis convertissez λ en mètres (1 nm = 10⁻⁹ m) et L en mètres (1 mm = 10⁻³ m).' } },
    { id: 'bilan', titre: 'Bilan',
      retenirTitre: 'Bilan : petit a, grand θ', retenir: <>
        <SvgCarteBilan/>
        <ul style={UL}>
          <li><strong>θ ≈ frac(λ|a)</strong> : à λ fixée, plus on resserre l’ouverture, plus l’onde s’étale.</li>
          <li>Conséquences : on <strong>entend</strong> derrière une porte sans <strong>voir</strong> ; un faisceau laser ne reste jamais parfaitement fin (limite de netteté).</li>
          <li>Avant de calculer : même unité pour λ et a, θ en radians, λ ≪ a.</li>
        </ul></>,
      texte: <>Vous savez reconnaître la diffraction, comparer a et λ dans des situations variées (eau, son, lumière), exploiter θ = frac(λ|a) et déduire la largeur d’une fente de la figure qu’elle donne. Passez à l’exploration (autres milieux, autres valeurs) ou relevez les deux défis.</>, tache: null },
  ];

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    const t = M.tirageDefi(type), W = M.ZOOMS[0];
    setDefi({ ...t, type, W: 0, x1: -W / 8, x2: W / 8, rep: '', verifie: false, essais: 0 });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const majDefi = f => setDefi(d => ({ ...d, ...f }));
  const Wd = defi ? M.ZOOMS[defi.W] : 40;
  const setXd = (i, v) => majDefi({ [i === 1 ? 'x1' : 'x2']: v });
  const changerZoom = idx => { const W = M.ZOOMS[idx]; setDefi(d => ({ ...d, W: idx, x1: Math.max(-W, Math.min(W, d.x1)), x2: Math.max(-W, Math.min(W, d.x2)) })); };
  const verifier = () => {
    const x = lireNombre(defi.rep), vrai = defi.type === 'fente' ? defi.a : defi.lam, ok = isFinite(x) && Math.abs(x - vrai) <= M.TOL_DEFI * vrai;
    majDefi({ verifie: true, ok, essais: (defi.essais || 0) + (ok ? 0 : 1) }); (defi.type === 'fente' ? noterF : noterL)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const Ld = defi ? Math.abs(defi.x2 - defi.x1) : 0;
  const enonceDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['fente', 'Largeur de la fente'], ['laser', 'Longueur d’onde du laser']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'fente' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle est la largeur de la fente ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Un laser {O.nomCouleur(defi.lam)} (<strong>λ = {defi.lam}{NB}nm</strong>) éclaire une fente de largeur inconnue ; l’écran est à <strong>D = {nbf(defi.D, 2)}{NB}m</strong>. Choisissez le cadrage, pointez les deux premières extinctions, puis déduisez la largeur a de la fente en micromètres, avec 2 chiffres significatifs (marge acceptée : 6{NB}%).</div>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle est la longueur d’onde du laser ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Une fente de largeur <strong>a = {defi.a}{NB}µm</strong> est éclairée par un laser de longueur d’onde inconnue ; l’écran est à <strong>D = {nbf(defi.D, 2)}{NB}m</strong>. L’image est en niveaux de gris : seule la mesure vous renseigne. Pointez les deux premières extinctions, puis déduisez λ en nanomètres, avec 2 chiffres significatifs (marge acceptée : 6{NB}%).</div>
      </>}
    </div>);
  const repDefi = defi && (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
        <span>{defi.type === 'fente' ? 'a =' : 'λ ='}</span>
        <input value={defi.rep} aria-label="Votre réponse" inputMode="decimal" onKeyDown={e => e.key === 'Enter' && verifier()} onChange={e => majDefi({ rep: e.target.value, verifie: false })}
          style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{defi.type === 'fente' ? 'µm' : 'nm'}</span>
      </div>
      <IndiceDefi cache={defi.verifie && defi.ok}>{indicesProfond(defi.type === 'fente'
        ? <>La tache centrale a pour largeur L = frac(2 λ D|a) : isolez a, avec λ et D en mètres et L mesurée entre les centres des deux premiers creux (en mètres aussi). Pour réduire l’erreur de pointé, choisissez le cadrage le plus serré dans lequel la tache tient en entier.</>
        : <>La tache centrale a pour largeur L = frac(2 λ D|a) : isolez λ, avec a et D en mètres et L mesurée entre les centres des deux premiers creux. Pour réduire l’erreur de pointé, choisissez le cadrage le plus serré dans lequel la tache tient en entier.</>)}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#b91c1c' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}{defi.ok
          ? (defi.type === 'fente' ? <>Valeur attendue : a = {defi.a}{NB}µm (L exacte = {nbf(defi.L, 1)}{NB}mm).</> : <>Valeur attendue : λ = {defi.lam}{NB}nm (L exacte = {nbf(defi.L, 1)}{NB}mm).</>)
          : 'Vérifiez les unités, le facteur 2 et le centre des creux : placez les repères au plus près du fond des deux premiers creux, puis réessayez.'}</div>}
      {defi.verifie && !defi.ok && (defi.essais || 0) >= 3 && <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2 }}>Après {defi.essais} essais, voici la valeur attendue : {defi.type === 'fente' ? <>a = {defi.a}{NB}µm</> : <>λ = {defi.lam}{NB}nm</>}. Cliquez sur « Nouveau défi » pour recommencer avec d’autres valeurs.</div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Onde progressive sinusoïdale, monochromatique</strong> : une seule longueur d’onde λ (laser, source sinusoïdale). Une voix réelle est un son composé de plusieurs fréquences : on en prend une (340 Hz) comme exemple.</li>
      <li><strong>Ouverture rectangulaire (fente)</strong> : fente infiniment haute, bords nets. Dans la cuve et pour le son, le modèle est à deux dimensions (somme d’ondelettes de Huygens-Fresnel), sans amortissement, sans réflexion sur les bords ni sur les murs.</li>
      <li><strong>Angle caractéristique</strong> : θ est le demi-angle, mesuré depuis l’axe, de la première extinction ; il est positif et pris dans le plan de la figure. La relation exacte est sin θ = frac(λ|a) ; on écrit θ ≈ frac(λ|a) (en radians) seulement si frac(λ|a) est petit devant 1. Si λ &gt; a, il n’y a plus d’extinction.</li>
      <li><strong>Écran lointain</strong> : pour la lumière, l’écran est à une distance D très grande devant a²/λ ; avec les petits angles, tan θ ≈ sin θ ≈ θ, donc θ ≈ frac(L|2 D) et L = frac(2 λ D|a).</li>
      <li><strong>Valeurs de référence (ordres de grandeur)</strong> : célérité du son dans l’air 340 m/s ; longueur d’onde de la lumière visible entre 400 et 800 nm ; les largeurs de porte et de fente des situations sont des valeurs typiques, pas des mesures.</li>
      <li><strong>Image et profil</strong> : l’image est celle d’un capteur dont l’exposition peut saturer la tache centrale ; le profil d’intensité est agrandi (le pic central est écrêté) pour faire apparaître les creux.</li>
      <li><strong>Hors de ce thème</strong> : pas d’incertitudes composées, pas de trou circulaire, pas d’interférences ni de réseau.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- zone de scène ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const iG = IDS.indexOf(idEtape);
  const boxGuide = (() => {
    if (!enGuide) return null;
    if (iG <= 3) {
      const angle = iG >= 3, vue = iG >= 3 ? 'amplitude' : 'ondes';
      return (<div style={styleBoite}>
        <SceneOndes milieu="eau" a={pg.a} lam={pg.lam} vue={vue} anim={!reduit()} angle={angle} aria={`Image d’une cuve vue d’en haut : des fronts d’onde rectilignes venus de la gauche rencontrent un mur dont l’ouverture mesure ${nbf(pg.a, 1)} cm ; la distance entre deux crêtes est ${nbf(pg.lam, 2)} cm.`}/>
        <div style={{ ...aide, marginTop: 6 }}>{vue === 'ondes' ? 'Vue de dessus. Zone claire : crête ; zone sombre : creux.' : 'Vue de dessus. Plus c’est foncé, plus l’onde est ample en ce point.'}</div>
        {iG >= 1 && <Reglage nom="Largeur a de l’ouverture" valeur={pg.a} min={1} max={14} pas={0.5} unite="cm" dec={1} onChange={v => setPg({ a: v })} couleur="#475569"/>}
        {iG >= 2 && <Reglage nom="Longueur d’onde λ" valeur={pg.lam} min={0.5} max={4} pas={0.25} unite="cm" dec={2} onChange={v => setPg({ lam: v })}/>}
        {iG >= 1 && ref && !surRef && <button type="button" onClick={() => setCgo(c => { const n = { ...c }; delete n[idEtape]; return n; })} style={styleBouton(true, '#f59e0b')}><Pic n="refresh"/>Rétablir (a = {nbf(ref.a, 0)}{NB}cm ; λ = {nbf(ref.lam, 0)}{NB}cm)</button>}
      </div>);
    }
    if (idEtape === 'table' || idEtape === 'porte') return (
      <div style={styleBoite}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
          <caption style={{ ...titreCarte, textAlign: 'left' }}>Quatre situations</caption>
          <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '4px 6px' }}>Situation</th><th style={{ padding: '4px 6px' }}>Ouverture a</th><th style={{ padding: '4px 6px' }}>Onde</th></tr></thead>
          <tbody>{SITUATIONS_TXT.map(r => <tr key={r[0]} style={{ borderTop: `1px solid ${KIT.bord}` }}>{r.map((c, j) => <td key={j} style={{ padding: '6px', fontWeight: j === 0 ? 700 : 400, color: KIT.txt }}>{c}</td>)}</tr>)}</tbody>
        </table></div>);
    if (idEtape === 'laser') return (<div style={styleBoite}><MontageLaser lam={LG.lam}/></div>);
    if (['figure', 'pointer', 'thetaL'].includes(idEtape)) {
      const apresPointer = iG >= IDS.indexOf('pointer'), apresMesure = iG >= IDS.indexOf('thetaL');
      return (<div style={{ ...styleBoite, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <EcranLumiere a={LG.a} lam={LG.lam} D={LG.D} W={LG.W} expo={LG.expo} x1={rg.x1} x2={rg.x2} setX={setRepG} mesure={apresPointer} profil={apresPointer}/>
        <div style={aide}>Laser vert, écran à D = 2,00{NB}m. Image de l’écran (en haut), règle graduée en millimètres{apresPointer ? ', profil d’intensité agrandi (le pic central dépasse du cadre)' : ''}.</div>
        {apresPointer && <Reperes W={LG.W} x1={rg.x1} x2={rg.x2} setX={setRepG} retablir={() => setRg({ x1: -5, x2: 5 })}/>}
        {apresMesure && <div><div style={titreCarte}>Mesures</div>
          <LigneMesure nom="Repère 1" valeur={`${nbf(rg.x1, 1)}${NB}mm`} couleur="#b45309"/><LigneMesure nom="Repère 2" valeur={`${nbf(rg.x2, 1)}${NB}mm`} couleur="#0e7490"/>
          <LigneMesure nom="Largeur L entre les repères" valeur={`${nbf(LmesG, 1)}${NB}mm`}/></div>}
      </div>);
    }
    return null;
  })();

  // ---------- défi : scène ----------
  const boxDefi = defi && (
    <div style={styleBoite}>
      <EcranLumiere a={defi.a} lam={defi.lam} D={defi.D} W={Wd} expo={2} gris={defi.type === 'laser'} x1={defi.x1} x2={defi.x2} setX={setXd} mesure profil/>
      <div style={{ ...aide, marginTop: 6 }}>Image de l’écran, règle graduée en millimètres (zéro au centre) et profil d’intensité agrandi : les creux du profil sont les extinctions.</div>
      <Menu label="Cadrage de l’image (le zéro est au centre)" valeur={defi.W} onChange={v => changerZoom(+v)} options={M.ZOOMS.map((W, i) => [i, `± ${W} mm`])}/>
      <Reperes W={Wd} x1={defi.x1} x2={defi.x2} setX={setXd} retablir={() => majDefi({ x1: -Wd / 8, x2: Wd / 8 })}/>
      <div style={{ marginTop: 8 }}><LigneMesure nom="Largeur L entre les repères" valeur={`${nbf(Ld, Wd <= 20 ? 2 : 1)}${NB}mm`}/></div>
    </div>);

  // ---------- exploration ----------
  const sitE = ex.sit, lamE = sitE === 'eau' ? ex.lE * 1e-2 : sitE === 'son' ? M.lambdaSon(ex.fS) : ex.lamL * 1e-9, aEff = sitE === 'eau' ? ex.aE * 1e-2 : sitE === 'son' ? ex.aS : ex.aL * 1e-6;
  const rap = lamE / aEff, thP = M.thetaPetit(lamE, aEff), thX = M.thetaExact(lamE, aEff);
  const uni = sitE === 'eau' ? [1e-2, 'cm'] : sitE === 'son' ? [1, 'm'] : [1e-6, 'µm'];
  const Lex = sitE === 'lumiere' ? M.largeurTache(aEff, lamE, ex.D) * 1e3 : null, Wex = M.ZOOMS[ex.wi], Lmes_ex = Math.abs(ex.x2 - ex.x1);
  const nomSit = { eau: 'cuve à ondes', son: 'son', lumiere: 'laser et fente' }[sitE];
  const resume = sitE === 'eau' ? `a = ${nbf(ex.aE, 1)} cm · λ = ${nbf(ex.lE, 2)} cm` : sitE === 'son' ? `a = ${nbf(ex.aS, 2)} m · f = ${ex.fS} Hz` : `a = ${ex.aL} µm · λ = ${ex.lamL} nm · D = ${nbf(ex.D, 1)} m`;
  const boxExplore = (() => {
    if (sitE === 'lumiere') return (
      <div style={{ ...styleBoite, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MontageLaser lam={ex.lamL}/>
        <EcranLumiere a={ex.aL} lam={ex.lamL} D={ex.D} W={Wex} expo={2} x1={ex.x1} x2={ex.x2} setX={(i, v) => setE({ [i === 1 ? 'x1' : 'x2']: v })} mesure={ex.mes} profil/>
        <div style={aide}>Image de l’écran, règle en millimètres (zéro au centre) et profil d’intensité agrandi. La fente est verticale : la lumière s’étale horizontalement.</div>
      </div>);
    return (
      <div style={styleBoite}>
        <SceneOndes milieu={sitE} a={aEff / (sitE === 'eau' ? 1e-2 : 1)} lam={lamE / (sitE === 'eau' ? 1e-2 : 1)} vue={ex.vue} anim={ex.anim} angle={ex.angle}
          aria={`${sitE === 'eau' ? 'Cuve' : 'Salle'} vue d’en haut : des fronts d’onde rectilignes venus de la gauche rencontrent un mur dont l’ouverture mesure ${nbf(aEff / (sitE === 'eau' ? 1e-2 : 1), 2)} ${sitE === 'eau' ? 'cm' : 'm'}`}/>
        <div style={{ ...aide, marginTop: 6 }}>Vue de dessus. {ex.vue === 'ondes' ? 'Zone claire : crête ; zone sombre : creux.' : 'Plus c’est foncé, plus l’onde est ample en ce point.'}{ex.angle ? ' Traits rouges : directions des premières extinctions (angle θ avec l’axe).' : ''}</div>
      </div>);
  })();
  const reglagesE = (
    <div style={styleBoite} className="dif-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez le type d’onde, puis la largeur a de l’ouverture et la longueur d’onde λ : la figure et les mesures suivent.</div>
      <Menu label="Type d’onde" valeur={sitE} onChange={v => setE({ sit: v })} options={[['eau', 'Ondes à la surface de l’eau (cuve à ondes)'], ['son', 'Son (ouverture dans un mur)'], ['lumiere', 'Lumière (laser et fente)']]}/>
      <Menu label="Largeur a de l’ouverture" valeur={sitE === 'eau' ? ex.aE : sitE === 'son' ? ex.aS : ex.aL} onChange={v => setE(sitE === 'eau' ? { aE: +v } : sitE === 'son' ? { aS: +v } : { aL: +v })}
        options={sitE === 'eau' ? [1, 2, 3, 4, 6, 8, 10, 14].map(v => [v, `${v} cm`]) : sitE === 'son' ? [0.2, 0.4, 0.8, 1.6, 3.2].map(v => [v, `${nbf(v, 2)} m${v === 0.8 ? ' (porte ouverte)' : ''}`]) : [20, 30, 40, 60, 80, 100, 150, 200].map(v => [v, `${v} µm`])}/>
      {sitE === 'eau' && <Menu label="Longueur d’onde λ" valeur={ex.lE} onChange={v => setE({ lE: +v })} options={[0.5, 1, 1.5, 2, 3, 4].map(v => [v, `${nbf(v, 1)} cm`])}/>}
      {sitE === 'son' && <Menu label="Fréquence f du son (célérité v = 340 m/s)" valeur={ex.fS} onChange={v => setE({ fS: +v })} options={[[170, '170 Hz (λ = 2 m)'], [340, '340 Hz (λ = 1 m)'], [680, '680 Hz (λ = 0,50 m)']]}/>}
      {sitE === 'lumiere' && <Menu label="Laser (longueur d’onde λ)" valeur={ex.lamL} onChange={v => setE({ lamL: +v })} options={[[405, 'violet, 405 nm'], [532, 'vert, 532 nm'], [650, 'rouge, 650 nm']]}/>}
      {sitE === 'lumiere' && <Menu label="Distance D entre la fente et l’écran" valeur={ex.D} onChange={v => setE({ D: +v })} options={[1, 1.5, 2, 3].map(v => [v, `${nbf(v, 1)} m`])}/>}
      <Section titre="Affichage" ouvert={ouv.aff} onBascule={() => setOuv(o => ({ ...o, aff: !o.aff }))}>
        {sitE !== 'lumiere' ? <>
          <Menu label="Vue" valeur={ex.vue} onChange={v => setE({ vue: v })} options={[['ondes', 'Ondes (crêtes et creux)'], ['amplitude', 'Amplitude (zone atteinte)']]}/>
          <Menu label="Traits rouges de l’angle θ" valeur={ex.angle ? 'oui' : 'non'} onChange={v => setE({ angle: v === 'oui' })} options={[['oui', 'Afficher θ'], ['non', 'Masquer θ']]}/>
          <Menu label="Animation (vue « Ondes »)" valeur={ex.anim ? 'oui' : 'non'} onChange={v => setE({ anim: v === 'oui' })} options={[['oui', 'Animer'], ['non', 'Figer']]}/>
        </> : <>
          <Menu label="Cadrage de l’image" valeur={ex.wi} onChange={v => setE({ wi: +v, x1: Math.max(-M.ZOOMS[+v], Math.min(M.ZOOMS[+v], ex.x1)), x2: Math.max(-M.ZOOMS[+v], Math.min(M.ZOOMS[+v], ex.x2)) })} options={M.ZOOMS.map((W, i) => [i, `± ${W} mm`])}/>
          <Menu label="Repères pour mesurer L sur l’image" valeur={ex.mes ? 'oui' : 'non'} onChange={v => setE({ mes: v === 'oui' })} options={[['non', 'Masquer'], ['oui', 'Afficher les repères']]}/>
          {ex.mes && <Reperes W={Wex} x1={ex.x1} x2={ex.x2} setX={(i, v) => setE({ [i === 1 ? 'x1' : 'x2']: v })} retablir={() => setE({ x1: -Wex / 8, x2: Wex / 8 })}/>}
        </>}
      </Section>
    </div>);
  const mesuresE = (
    <div style={styleBoite}>
      <Section titre={`Mesures : ${resume} · ${thX == null ? 'aucune extinction' : `θ ≈ ${nbf(thP, thP < 0.1 ? 3 : 2)} rad`}`} ouvert={ouv.mes} onBascule={() => setOuv(o => ({ ...o, mes: !o.mes }))}>
        <div style={aide}>Situation : {nomSit}. Les longueurs sont comparées dans la même unité.</div>
        <LigneMesure nom="Largeur a de l’ouverture" valeur={`${nbf(aEff / uni[0], sitE === 'lumiere' ? 0 : 2)}${NB}${uni[1]}`}/>
        <LigneMesure nom="Longueur d’onde λ" valeur={sitE === 'lumiere' ? `${ex.lamL}${NB}nm` : `${nbf(lamE / uni[0], 2)}${NB}${uni[1]}`}/>
        {sitE === 'son' && <LigneMesure nom="Fréquence f" valeur={`${ex.fS}${NB}Hz`}/>}
        <LigneMesure nom={avecIndices('Rapport frac(λ|a)')} valeur={rap >= 0.01 ? nbf(rap, 2) : sci(rap, 2)} couleur="#dc2626"/>
        <LigneMesure nom={avecIndices('Angle θ ≈ frac(λ|a)')} valeur={thX == null ? '–' : `${nbf(thP, thP < 0.1 ? 4 : 3)}${NB}rad`}/>
        <LigneMesure nom={avecIndices('Angle exact (sin θ = frac(λ|a))')} valeur={thX == null ? '– (aucune extinction)' : `${nbf(thX, thX < 0.1 ? 4 : 3)}${NB}rad (${nbf(thX / O.RAD, 1)}${NB}°)`}/>
        {Lex != null && <LigneMesure nom="Largeur prévue de la tache L" valeur={`${nbf(Lex, 1)}${NB}mm`} couleur="#15803d"/>}
        {Lex != null && ex.mes && <LigneMesure nom="Largeur L entre les repères" valeur={`${nbf(Lmes_ex, Wex <= 20 ? 2 : 1)}${NB}mm`}/>}
        {thX != null && rap > 0.3 && <div style={{ ...aide, color: '#9a3412', marginTop: 6 }}>{avecIndices('Ici frac(λ|a) n’est plus petit devant 1 : θ ≈ frac(λ|a) devient approximatif, utilisez sin θ = frac(λ|a).')}</div>}
        {thX == null && <div style={{ ...aide, color: '#9a3412', marginTop: 6 }}>{avecIndices('λ est supérieure à a : sin θ = frac(λ|a) n’a pas de solution, il n’y a pas d’angle d’extinction.')}</div>}
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Dans la cuve, fixez a = 4 cm et augmentez λ : que devient l’angle θ ? Que se passe-t-il quand λ dépasse a ?</li>
        <li>Trouvez deux réglages différents de la cuve qui donnent le même rapport frac(λ|a) : les figures se ressemblent-elles ?</li>
        <li>Son : comparez la porte ouverte (0,80 m) pour 170 Hz et pour 680 Hz. Quel son se diffracte le plus ?</li>
        <li>Laser : divisez la largeur de la fente par 2. Comment varie la largeur L de la tache centrale ?</li>
        <li>Laser : passez du laser rouge au laser violet à fente fixée. L augmente-t-elle ou diminue-t-elle ? Pourquoi ?</li>
        <li>Laser : mettez les repères sur les deux premiers creux, lisez L, puis retrouvez la largeur de la fente avec L = frac(2 λ D|a).</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>diffraction : étalement d’une onde qui rencontre une ouverture ou un obstacle de petite taille</li>
          <li>d’autant plus marquée que a est petit devant λ ; on compare λ et a dans la même unité</li>
          <li>angle caractéristique : θ ≈ frac(λ|a) en radians si λ ≪ a ; sinon sin θ = frac(λ|a)</li>
          <li>fente éclairée par un laser : θ ≈ frac(L|2 D) et L = frac(2 λ D|a)</li>
          <li>conséquences : on entend derrière une porte sans voir ; un faisceau laser ne reste jamais parfaitement fin</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .dif-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .dif-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .dif-col { display: flex; flex-direction: column; gap: 12px; }
        .dif-df { display: block; margin-bottom: 12px; } .dif-df > * { margin-bottom: 12px; }
        @media (min-width: 901px) { .dif-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .dif-df > * { margin-bottom: 0; }
          .dif-df-scene { grid-column: 1; grid-row: 1 / span 3; } .dif-df-enonce { grid-column: 2; grid-row: 1; } .dif-df-volet { grid-column: 2; grid-row: 2; } .dif-df-hypo { grid-column: 2; grid-row: 3; } }
        .dif-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .dif-l1.cote .dif-carte { order: 2; } .dif-l1.cote .dif-main { order: 1; }
          .dif-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .dif-ex > * { grid-column: 1; } .dif-ex > .dif-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .dif-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .dif-in { animation: dif-fondu 0.35s ease-out; } @keyframes dif-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Diffraction : angle caractéristique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>{avecIndices(enGuide ? 'Une onde qui rencontre une ouverture s’étale : c’est la diffraction.' : 'Une onde qui rencontre une ouverture s’étale : c’est la diffraction. Elle dépend du rapport entre la longueur d’onde λ et la largeur a de l’ouverture, et se caractérise par un angle θ ≈ frac(λ|a).')}</div>
      {enGuide && <div className="dif-l1 cote">
        <div className="dif-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="dif-main"><div className="dif-col">{boxGuide && <div className="dif-in" key={'s-' + idEtape}>{boxGuide}</div>}</div></div>
      </div>}
      {enDefi && defi && <div className="dif-df">
        <div className="dif-df-enonce"><div style={styleBoite}>{enonceDefi}</div></div>
        <div className="dif-df-scene dif-in" key={'d' + defi.type}>{boxDefi}</div>
        <div className="dif-df-volet"><div style={styleBoite}>{repDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'fente' ? suiviF : suiviL}/></div></div>
        <div className="dif-df-hypo">{panneauHypo}</div>
      </div>}
      {enExplore && <div className="dif-ex">
        <div>{boxExplore}</div>
        <div className="dif-ctrl">{reglagesE}</div>
        <div>{mesuresE}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
