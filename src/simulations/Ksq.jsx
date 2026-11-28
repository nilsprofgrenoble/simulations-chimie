import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, lireNombre, IndiceDefi, indicesProfond , Frac } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./ksqModele";
import { SvgKsCarte, SvgQrCarte, SvgSolubiliteCarte, SvgPiegeKsCarte } from "./KsqSchemas";
import { ScenePrecipitation, T_FIN, exInitial } from "./KsqScene";
import { KsqExplore } from "./KsqExplore";
import { useEtroit, useLecture, StyleAnim } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

const SIM_ID = 309, CLE_GUIDE = 'ksq-guide-v1';
declarerDefis(SIM_ID, [['precipitation', 'Précipité ou non ? Calculer Qr et conclure'], ['solubilite', 'Retrouver Ks à partir de la solubilité']]);

// ====================================================
// SIM 309 — « Dissoudre ou précipiter ? Qr, Ks et solution saturée » (terminale STL, SPCL, Chimie et développement durable : solubilité).
//  Une idée : un sel peu soluble est en équilibre avec ses ions (Ks) ; en comparant le quotient de réaction Qr à Ks, on prévoit s'il y a précipitation, dissolution ou équilibre ;
//  la solubilité s se déduit de Ks (la stœchiométrie compte : on compare des s, pas des Ks, entre sels de formules différentes).
//  Capacités visées (jamais affichées à l'élève) : écrire l'équation de dissolution et exprimer Ks ; comparer Qr à Ks pour prévoir l'évolution ; relier Ks et solubilité (mol/L et g/L).
//  Hors périmètre : effet de la température (sim 311), précipitation sélective des hydroxydes (sim 310), calculs d'ion commun chiffrés au parcours (qualitatif en exploration).
//  Modèle : ksqModele.js (Ks de l'annexe OpenStax Chemistry 2e, 25 °C). Scène animée : KsqScene.jsx ; exploration : KsqExplore.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const sci1 = x => M.sciNb(x, 1), sci2 = x => M.sciNb(x, 2);
const BLEU = '#0369a1';
const IDS = ['dissolution', 'equation', 'ks', 'valeurKs', 'qr', 'comparer', 'melange', 'dilue', 'solu1', 'solu2', 'piege', 'gl', 'bilan'];

// ---------- formules (MathML) ----------
const KS = <msub><mi>K</mi><mi mathvariant="normal">s</mi></msub>;
const FS_11 = <Formule><mi>s</mi><mo>=</mo><msqrt>{KS}</msqrt></Formule>;
const FS_12 = <Formule><mi>s</mi><mo>=</mo><mroot><mfrac>{KS}<mn>4</mn></mfrac><mn>3</mn></mroot></Formule>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- données du parcours (toutes annoncées dans les hypothèses) ----------
const CAF2 = M.SELS.CaF2, SRCO3 = M.SELS.SrCO3, CUI = M.SELS.CuI, AGI = M.SELS.AgI, AG2CO3 = M.SELS.Ag2CO3;
const LG = Math.log10;
const QR_A = 1.0e-3 * Math.pow(1.0e-3, 2);                       // étape 5 : 1,0×10⁻⁹
const QR_B = 5.0e-4 * 5.0e-4;                                    // étape 6 : 2,5×10⁻⁷
const QR_C = 2.0e-9 * 2.0e-9;                                    // étape 7 : 4,0×10⁻¹⁸
const KS_A = 2.6e-5 * 2.6e-5;                                    // étape 3 : 6,8×10⁻¹⁰
const S_CUI = Math.sqrt(CUI.Ks), S_CAF2 = M.solubilite(CAF2), S_SRCO3 = M.solubilite(SRCO3), S_AG2 = M.solubilite(AG2CO3), GL_AG2 = S_AG2 * AG2CO3.M;

// scènes du parcours : { sel, lc1, lc2 (log10 des concentrations des solutions de départ), solo, verser }
const sceneSaturee = (sel, f = 6) => ({ sel, lc1: LG(f * 2 * sel.a * M.solubilite(sel)), lc2: LG(f * 2 * sel.b * M.solubilite(sel)), solo: true });
const SCENES = {
  dissolution: sceneSaturee(CAF2), equation: sceneSaturee(CAF2), ks: sceneSaturee(CAF2), valeurKs: sceneSaturee(SRCO3),
  comparer: { sel: CAF2, lc1: LG(2e-3), lc2: LG(2e-3), verser: true },
  melange: { sel: SRCO3, lc1: LG(1e-3), lc2: LG(1e-3), verser: true },
  dilue: { sel: AGI, lc1: LG(4e-9), lc2: LG(4e-9), verser: true },
};

// Scène du parcours guidé : lecture propre à l'étape (remise à zéro quand on change d'étape grâce à la clé)
function SceneGuide({ sc, aria }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite), anime = !reduitMouvement(), ph = usePhase(0.8, anime);
  const L = useLecture(T_FIN, false), jeu = L.t > 0 || L.joue, f = sc.solo ? 1 : jeu ? Math.min(1, L.t / T_FIN) : null;
  return (
    <div ref={boite} style={{ ...styleBoite, padding: 6 }}>
      <StyleAnim/>
      <ScenePrecipitation sel={sc.sel} lc1={sc.lc1} lc2={sc.lc2} f={f} ph={ph} etroit={etroit} svgRef={svgRef} aria={aria} solo={!!sc.solo}/>
      {sc.verser && <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={L.joue ? () => L.setJoue(false) : L.demarrer} style={{ ...styleBouton(true, BLEU), minHeight: 44 }}>{L.joue ? '⏸ Pause' : L.fin ? '↻ Rejouer' : '▶ Verser'}</button>
        <span style={{ fontSize: 13.5, color: KIT.txt2, flex: '1 1 200px', lineHeight: 1.45 }}>On verse les deux solutions l’une sur l’autre : suivez les ions et la jauge <Frac haut={<>Qr</>} bas={<>Ks</>} />.</span>
      </div>}
    </div>);
}

export function SimulationKsq() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviK, noterK] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('precipitation');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ commun: false, essayer: false, retenir: false });
  const [ex, setEx] = useState(exInitial);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'dissolution', titre: 'Un sel peu soluble dans l’eau',
      texte: <>On agite du fluorure de calcium solide, CaF₂, dans de l’eau. Un peu de solide se dissout, mais la plus grande partie reste au fond du bécher. Au bout d’un moment, la quantité dissoute ne change plus : le solide et les ions dissous ont atteint un <strong>équilibre</strong>. La solution est dite <strong>saturée</strong>.</>,
      tache: { type: 'qcm', q: 'Que signifie « solution saturée » ?', options: ['la solution contient exactement autant de solide que d’eau', 'tout le solide est dissous et la solution est très concentrée', 'du solide et ses ions dissous coexistent : on ne peut plus rien dissoudre', 'plus aucun ion n’est dissous : le solide ne se dissout plus du tout'], bonne: 2,
        expl: 'Dans une solution saturée, du solide est en équilibre avec les ions dissous : le solide continue de se dissoudre et de se reformer au même rythme, donc les quantités ne changent plus. Il y a bien des ions dissous.',
        indice: 'Regardez le bécher : il reste du solide au fond, et pourtant l’eau contient des ions.' } },
    { id: 'equation', titre: 'L’équation de dissolution',
      texte: <>Le fluorure de calcium est un solide ionique formé d’ions calcium Ca²⁺ et d’ions fluorure F⁻. En se dissolvant, il libère ses ions dans l’eau. L’équilibre s’écrit avec une double flèche ⇌ : (s) désigne le solide, (aq) un ion dissous dans l’eau.</>,
      tache: { type: 'qcm', q: 'Quelle équation décrit la dissolution de CaF₂ ?', options: ['CaF₂(s) ⇌ Ca²⁺(aq) + 2 F⁻(aq)', 'CaF₂(s) ⇌ Ca²⁺(aq) + F⁻(aq)', 'CaF₂(s) ⇌ Ca(aq) + 2 F(aq)', 'CaF₂(s) ⇌ Ca²⁺(aq) + F₂²⁻(aq)'], bonne: 0,
        expl: 'Un ion Ca²⁺ porte deux charges + : il faut deux ions F⁻ pour que la charge totale (2+ puis 2 × 1−) reste nulle. Les atomes et les charges sont conservés.',
        indice: 'Vérifiez deux choses : le nombre d’atomes de chaque élément, puis la charge totale (elle doit rester nulle).' } },
    { id: 'ks', titre: 'La constante Ks',
      texte: <>À l’équilibre, le produit des concentrations des ions dissous, chacune élevée à la puissance de son coefficient dans l’équation, est une constante (à une température donnée) : le <strong>produit de solubilité Ks</strong>, sans unité. Le solide n’apparaît pas dans l’expression. Par exemple, pour la dissolution CaF₂(s) ⇌ Ca²⁺ + 2 F⁻ :</>,
      tache: { type: 'qcm', q: 'Quelle est l’expression de Ks pour CaF₂ ?', options: ['Ks = [Ca²⁺] × [F⁻]', 'Ks = frac([Ca²⁺] × [F⁻]²|[CaF₂])', 'Ks = [Ca²⁺] × 2 [F⁻]', 'Ks = [Ca²⁺] × [F⁻]²'], bonne: 3,
        expl: 'Chaque concentration est élevée à la puissance du coefficient de l’ion : 1 pour Ca²⁺ (non écrit) et 2 pour F⁻. Le solide n’intervient pas. Les crochets [ ] désignent la concentration en mol/L.',
        indice: 'Le coefficient stœchiométrique d’un ion devient son exposant. Le solide est absent de l’expression.' } },
    { id: 'valeurKs', titre: 'Calculer Ks à partir de concentrations',
      retenirTitre: 'À retenir : l’équilibre de dissolution et Ks',
      retenir: <><SvgKsCarte/><ul style={ULS}>
        <li>Équation : <strong>sel(s) ⇌ ions dissous</strong>. Expression de Ks : produit des concentrations des ions, chacune à la puissance de son <strong>coefficient</strong>. Le solide n’y figure pas.</li>
        <li>Ks ne dépend que de la température (donnée à 25 °C dans les tables) : plus Ks est petit, moins le sel est soluble pour une même formule.</li>
        <li>Idée fausse : « Ks = [Ca²⁺] × 2 [F⁻] ». Vrai : le coefficient 2 est un <strong>exposant</strong>.</li></ul></>,
      texte: <>Une solution saturée de carbonate de strontium SrCO₃, solide ionique, est analysée à 25 °C : SrCO₃(s) ⇌ Sr²⁺ + CO₃²⁻. On mesure [Sr²⁺] = 2,6×10⁻⁵{NB}mol/L et [CO₃²⁻] = 2,6×10⁻⁵{NB}mol/L. Pour écrire un résultat en notation scientifique, saisissez par exemple « 2,5×10⁻⁷ » ou « 2,5e-7 ».</>,
      tache: { type: 'num', q: 'Calculez Ks pour SrCO₃ (2 chiffres significatifs).', unite: '', vrai: KS_A, tol: 0.05, affiche: v => sci1(v), cs: 2, carnet: false,
        calcul: () => ['Ks = [Sr²⁺] × [CO₃²⁻] (les deux coefficients valent 1).', `Ks = 2,6×10⁻⁵ × 2,6×10⁻⁵ = ${sci2(KS_A)}, soit environ ${sci1(KS_A)}.`],
        pieges: [[5.2e-5, 'Vous avez additionné les concentrations : Ks est un produit.'], [2.6e-5, 'Vous avez donné une seule concentration : Ks est le produit des deux.'], [2.6e-10, 'Revoyez les puissances de 10 : (10⁻⁵) × (10⁻⁵) = 10⁻¹⁰, et 2,6 × 2,6 ≈ 6,8.']],
        expl: `Ks = 2,6×10⁻⁵ × 2,6×10⁻⁵ ≈ ${sci1(KS_A)}.`, indice: 'Ks = [Sr²⁺] × [CO₃²⁻] : multipliez les deux concentrations (les puissances de 10 s’additionnent).' } },
    { id: 'qr', titre: 'Le quotient de réaction Qr',
      texte: <>Une solution n’est pas toujours à l’équilibre, par exemple juste après un mélange. On calcule alors le <strong>quotient de réaction Qr</strong> : même expression que Ks, mais avec les concentrations <strong>du moment</strong>. À l’équilibre (solution saturée), Qr = Ks. Dans un bécher, juste après un mélange, on a [Ca²⁺] = 1,0×10⁻³{NB}mol/L et [F⁻] = 1,0×10⁻³{NB}mol/L.</>,
      tache: { type: 'num', q: 'Calculez Qr pour CaF₂ (2 chiffres significatifs).', unite: '', vrai: QR_A, tol: 0.05, affiche: v => sci1(v), cs: 2, carnet: false,
        calcul: () => ['Qr = [Ca²⁺] × [F⁻]² (coefficient 2 pour F⁻).', `Qr = 1,0×10⁻³ × (1,0×10⁻³)² = 1,0×10⁻³ × 1,0×10⁻⁶ = ${sci1(QR_A)}.`],
        pieges: [[1e-6, 'Vous avez oublié l’exposant 2 de [F⁻] : Qr = [Ca²⁺] × [F⁻]².'], [2e-6, 'Le coefficient 2 est un exposant, pas un facteur multiplicatif.'], [1e-3 * 3e-3, 'Élevez [F⁻] au carré avant de multiplier.']],
        expl: `Qr = [Ca²⁺] × [F⁻]² = 1,0×10⁻³ × (1,0×10⁻³)² = ${sci1(QR_A)}.`, indice: 'Même expression que Ks : [Ca²⁺] × [F⁻]². Calculez (1,0×10⁻³)² d’abord.' } },
    { id: 'comparer', titre: 'Comparer Qr à Ks',
      texte: <>On compare Qr à la constante Ks : ici Ks(CaF₂) = 4,0×10⁻¹¹ et Qr = {sci1(QR_A)}. Cliquez sur <strong>« Verser »</strong> : on mélange deux solutions d’ions pour obtenir ces concentrations (chaque ion est dilué par le mélange). Regardez les ions, le solide et la jauge <Frac haut={<>Qr</>} bas={<>Ks</>} />.</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il quand on réalise ce mélange ?', options: ['rien : Qr n’est pas égal à Ks, donc le mélange reste limpide', 'un précipité se forme jusqu’à ce que Qr soit égal à Ks', 'un précipité se forme car Qr est inférieur à Ks', 'il n’y a pas de précipité, car Qr est supérieur à Ks'], bonne: 1,
        expl: `Qr = ${sci1(QR_A)} est plus grand que Ks = 4,0×10⁻¹¹ : la solution est « trop concentrée » en ions. Du solide se forme (précipitation), ce qui diminue les concentrations en ions, jusqu’à ce que Qr = Ks : la solution est alors saturée.`,
        indice: 'Si Qr est plus grand que Ks, il y a trop d’ions dissous : où vont-ils ?' } },
    { id: 'melange', titre: 'Mélanger deux solutions',
      texte: <>On mélange 10,0{NB}mL d’une solution d’ions Sr²⁺ à 1,0×10⁻³{NB}mol/L et 10,0{NB}mL d’une solution d’ions CO₃²⁻ à 1,0×10⁻³{NB}mol/L. Le volume total est 20,0{NB}mL : chaque ion est dilué. On a Ks(SrCO₃) = 7×10⁻¹⁰. Cliquez sur « Verser » pour observer ce mélange.</>,
      tache: { type: 'num', q: 'Calculez Qr juste après le mélange (2 chiffres significatifs).', unite: '', vrai: QR_B, tol: 0.05, affiche: v => sci1(v), cs: 2, carnet: false,
        calcul: () => ['Dilution : [Sr²⁺] = frac(1,0×10⁻³ × 10,0|20,0) = 5,0×10⁻⁴ mol/L ; de même [CO₃²⁻] = 5,0×10⁻⁴ mol/L.', `Qr = [Sr²⁺] × [CO₃²⁻] = 5,0×10⁻⁴ × 5,0×10⁻⁴ = ${sci1(QR_B)}.`],
        pieges: [[1e-6, 'Vous avez utilisé les concentrations des solutions de départ : après le mélange, chaque ion est dilué (volume total 20,0 mL).'], [1e-3, 'Qr est un produit de deux concentrations, pas une seule concentration.'], [2.5e-4 * 2, 'Qr est un produit, pas une somme.']],
        expl: `Après mélange : [Sr²⁺] = [CO₃²⁻] = 5,0×10⁻⁴ mol/L ; Qr = 5,0×10⁻⁴ × 5,0×10⁻⁴ = ${sci1(QR_B)}.`, indice: 'Concentration après mélange = concentration de départ × V de la solution, le tout divisé par le volume total (20,0 mL). Puis Qr = [Sr²⁺] × [CO₃²⁻].' } },
    { id: 'dilue', titre: 'Quand il n’y a pas de précipité',
      texte: <>La jauge a tranché pour SrCO₃ : Qr = {sci1(QR_B)} est bien plus grand que Ks = 7×10⁻¹⁰, il y a précipitation. Autre mélange : des ions Ag⁺ et I⁻ très dilués. Après mélange, [Ag⁺] = [I⁻] = 2,0×10⁻⁹{NB}mol/L, donc Qr = {sci1(QR_C)}. Pour AgI, Ks = 1,5×10⁻¹⁶. Cliquez sur « Verser » pour observer.</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il pour ce mélange ?', options: ['un précipité se forme, car Qr est très petit', 'il n’y a pas de précipité : Qr est inférieur à Ks, la solution n’est pas saturée', 'la solution est saturée, car Qr est très proche de zéro', 'il n’y a pas de précipité, car Qr est supérieur à Ks'], bonne: 1,
        expl: `Qr = ${sci1(QR_C)} est inférieur à Ks = 1,5×10⁻¹⁶ : il y a « de la place » pour davantage d’ions dissous. Aucun précipité ne se forme ; s’il y avait du solide, il se dissoudrait.`,
        indice: 'Comparez Qr (4,0×10⁻¹⁸) et Ks (1,5×10⁻¹⁶) : lequel est le plus petit ? Regardez l’exposant.' } },
    { id: 'solu1', titre: 'La solubilité s à partir de Ks',
      retenirTitre: 'À retenir : comparer Qr à Ks',
      retenir: <><SvgQrCarte/><ul style={ULS}>
        <li><strong>Qr &lt; Ks</strong> : pas de précipité (du solide éventuel se dissout). <strong>Qr = Ks</strong> : solution saturée, équilibre. <strong>Qr &gt; Ks</strong> : un précipité se forme jusqu’à Qr = Ks.</li>
        <li>Après un mélange, on calcule d’abord les <strong>concentrations après dilution</strong>, puis Qr.</li>
        <li>Moyen de s’en souvenir : « Qr dépasse Ks, le solide apparaît. »</li></ul></>,
      texte: <>La <strong>solubilité s</strong> est la quantité maximale de sel qui se dissout par litre de solution saturée, en mol/L. Pour l’iodure de cuivre(I), CuI(s) ⇌ Cu⁺ + I⁻ : chaque formule dissoute donne un ion Cu⁺ et un ion I⁻, donc [Cu⁺] = [I⁻] = s et Ks = s × s = s². On donne Ks(CuI) = 1,27×10⁻¹².{FS_11}</>,
      tache: { type: 'num', q: 'Calculez la solubilité s de CuI, en mol/L (2 chiffres significatifs).', unite: 'mol/L', vrai: S_CUI, tol: 0.05, affiche: v => sci1(v), cs: 2, carnet: false,
        calcul: () => ['Ks = s² donc s = √Ks.', `s = √(1,27×10⁻¹²) = ${sci2(S_CUI)} mol/L, soit environ ${sci1(S_CUI)} mol/L.`],
        pieges: [[CUI.Ks, 'Vous avez donné Ks : il faut en prendre la racine carrée (Ks = s²).'], [CUI.Ks / 2, 'Ks = s², donc s est la racine carrée de Ks, pas sa moitié.']],
        expl: `s = √Ks = √(1,27×10⁻¹²) ≈ ${sci1(S_CUI)} mol/L.`, indice: 'Ks = s × s : s est la racine carrée de Ks. Avec une puissance de 10 impaire, écrivez 1,27×10⁻¹² = 12,7×10⁻¹³ pour mieux manipuler.' } },
    { id: 'solu2', titre: 'Un sel de formule AB₂',
      texte: <>Pour CaF₂(s) ⇌ Ca²⁺ + 2 F⁻, chaque formule dissoute donne un ion Ca²⁺ et <strong>deux</strong> ions F⁻ : [Ca²⁺] = s et [F⁻] = 2 s. Ks = [Ca²⁺] × [F⁻]² = s × (2 s)² = 4 s³. On donne Ks(CaF₂) = 4,0×10⁻¹¹.{FS_12}</>,
      tache: { type: 'num', q: 'Calculez la solubilité s de CaF₂, en mol/L (2 chiffres significatifs).', unite: 'mol/L', vrai: S_CAF2, tol: 0.05, affiche: v => sci1(v), cs: 2, carnet: false,
        calcul: () => ['Ks = 4 s³ donc s³ = frac(Ks|4) = frac(4,0×10⁻¹¹|4) = 1,0×10⁻¹¹.', `s = ∛(1,0×10⁻¹¹) = ${sci2(S_CAF2)} mol/L, soit environ ${sci1(S_CAF2)} mol/L.`],
        pieges: [[Math.cbrt(4e-11), 'Vous avez oublié de diviser Ks par 4 : Ks = 4 s³.'], [Math.sqrt(4e-11), 'Pour un sel AB₂, Ks = 4 s³ : il faut une racine cubique, pas carrée.'], [1e-11, 'Vous avez calculé frac(Ks|4) sans prendre la racine cubique.']],
        expl: `Ks = 4 s³ donc s = ∛(frac(Ks|4)) = ∛(1,0×10⁻¹¹) ≈ ${sci1(S_CAF2)} mol/L.`, indice: 'Ks = s × (2 s)² = 4 s³. Isolez s³ = frac(Ks|4), puis prenez la racine cubique (touche ∛ ou puissance 1/3).' } },
    { id: 'piege', titre: 'Quel sel est le plus soluble ?',
      retenirTitre: 'À retenir : solubilité s et Ks',
      retenir: <><SvgSolubiliteCarte/><ul style={ULS}>
        <li>Sel de formule 1 : 1 (comme CuI) : <strong>s = √Ks</strong>. Sel 1 : 2 ou 2 : 1 (comme CaF₂ ou Ag₂CO₃) : <strong>s = ∛(<Frac haut={<>Ks</>} bas={<>4</>} />)</strong>.</li>
        <li>On part de l’équation : chaque ion a pour concentration son coefficient × s, puis on écrit Ks.</li>
        <li>Pour passer de mol/L à g/L : <strong>multiplier par la masse molaire</strong> (g/mol).</li></ul></>,
      texte: <>On veut comparer deux sels : CaF₂ (Ks = 4,0×10⁻¹¹ ; s = {sci1(S_CAF2)}{NB}mol/L, d’après l’étape précédente) et SrCO₃ (Ks = 7×10⁻¹⁰). La solubilité de SrCO₃, sel de formule 1 : 1, vaut s = √Ks.</>,
      tache: { type: 'qcm', q: 'Lequel de ces deux sels est le plus soluble dans l’eau ?', options: ['SrCO₃, car son Ks est le plus grand', 'CaF₂ : on compare les solubilités s, pas les Ks', 'CaF₂, car son Ks est le plus petit', 'ils ne se comparent pas : leurs formules sont différentes'], bonne: 1,
        expl: `s(SrCO₃) = √(7×10⁻¹⁰) ≈ ${sci1(S_SRCO3)} mol/L, s(CaF₂) ≈ ${sci1(S_CAF2)} mol/L : CaF₂ est environ ${nbf(S_CAF2 / S_SRCO3, 0)} fois plus soluble, bien que son Ks soit plus petit. Quand les formules diffèrent, Ks et s ne se classent pas dans le même ordre.`,
        indice: 'Calculez la solubilité s de chaque sel (racine carrée pour SrCO₃ ; vous avez déjà celle de CaF₂) et comparez les s.' } },
    { id: 'gl', titre: 'De mol/L à g/L',
      texte: <>On exprime souvent une solubilité en g/L. Pour le carbonate d’argent Ag₂CO₃(s) ⇌ 2 Ag⁺ + CO₃²⁻ (Ks = 8,1×10⁻¹²), on a [Ag⁺] = 2 s et [CO₃²⁻] = s, donc Ks = (2 s)² × s = 4 s³. La masse molaire de Ag₂CO₃ est 275,8{NB}g/mol.</>,
      tache: { type: 'num', q: 'Quelle est la solubilité de Ag₂CO₃ en g/L (2 chiffres significatifs) ?', unite: 'g/L', vrai: GL_AG2, tol: 0.05, affiche: v => sci1(v), cs: 2, carnet: false,
        calcul: () => ['Ks = 4 s³ donc s = ∛(frac(Ks|4)) = ∛(frac(8,1×10⁻¹²|4)) = ∛(2,0×10⁻¹²) ≈ ' + sci2(S_AG2) + ' mol/L.', `Solubilité en g/L = s × M = ${sci2(S_AG2)} × 275,8 = ${sci2(GL_AG2)} g/L, soit environ ${sci1(GL_AG2)} g/L.`],
        pieges: [[S_AG2, 'Vous avez donné s en mol/L : multipliez par la masse molaire (275,8 g/mol) pour obtenir des g/L.'], [Math.cbrt(8.1e-12) * 275.8, 'Vous avez oublié de diviser Ks par 4 : Ks = 4 s³.'], [S_AG2 / 275.8, 'Pour passer de mol/L à g/L, on multiplie par la masse molaire (on ne divise pas).']],
        expl: `s = ∛(frac(Ks|4)) ≈ ${sci2(S_AG2)} mol/L ; en g/L : s × M ≈ ${sci2(S_AG2)} × 275,8 ≈ ${sci1(GL_AG2)} g/L.`, indice: 'Calculez d’abord s en mol/L avec Ks = 4 s³, puis multipliez par la masse molaire : g/L = mol/L × g/mol.' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : comparer les solubilités, pas les Ks',
      retenir: <><SvgPiegeKsCarte/><ul style={ULS}>
        <li>Même formule (1 : 1 avec 1 : 1) : le Ks le plus petit correspond au sel le moins soluble.</li>
        <li>Formules différentes : <strong>calculer s</strong> avant de comparer.</li>
        <li>Idée fausse : « le Ks le plus petit, c’est toujours le moins soluble ». Vrai : cela dépend de la stœchiométrie.</li></ul></>,
      texte: <>Vous savez écrire l’équilibre de dissolution d’un sel peu soluble et son Ks, calculer Qr (après dilution) et le comparer à Ks pour prévoir précipitation, saturation ou dissolution, puis déduire la solubilité s d’un sel en mol/L et en g/L. En exploration, réglez deux solutions sur les béchers animés et regardez le solide se former ; en défi, prévoyez le précipité d’un mélange ou retrouvez Ks à partir d’une solubilité.</> },
  ];

  const nouveauDefi = type => {
    if (type === 'precipitation') setDefi({ type, ...M.tirageDefiPrecip(), rep: '', verdictRep: null, verifie: false, essais: 0, corr: false });
    else setDefi({ type, ...M.tirageDefiKs(), rep: '', verifie: false, essais: 0, corr: false });
  };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- défis ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const saisie = { font: 'inherit', fontSize: 16, padding: '8px 10px', minHeight: 44, borderRadius: 10, border: `1.5px solid ${KIT.bord}`, width: '100%', boxSizing: 'border-box' };
  const verifier = () => {
    if (defi.type === 'precipitation') {
      const x = lireNombre(defi.rep), dq = M.diagQr(defi, x), vOk = defi.verdictRep === (defi.verdict === 'precipite' ? 'oui' : 'non'), ok = dq.ok && vOk;
      setDefi(d => ({ ...d, verifie: true, ok, dq, vOk, essais: ok ? d.essais : d.essais + 1 })); noterP(ok);
    } else {
      const x = lireNombre(defi.rep), dk = M.diagKs(defi, x);
      setDefi(d => ({ ...d, verifie: true, ok: dk.ok, dk, essais: dk.ok ? d.essais : d.essais + 1 })); noterK(dk.ok);
    }
  };
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const voletDefi = defi && (() => {
    const sel = M.SELS[defi.sel], prec = defi.type === 'precipitation';
    return (<div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['precipitation', 'Précipité ou non ?'], ['solubilite', 'Retrouver Ks']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, BLEU)}>{l}</button>)}
      </div>
      {prec ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : un précipité de {sel.f} se forme-t-il ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>On mélange {defi.V1}{NB}mL d’une solution d’ions {sel.cation} à {sci1(defi.c1)}{NB}mol/L et {defi.V2}{NB}mL d’une solution d’ions {sel.anion} à {sci1(defi.c2)}{NB}mol/L. Équation : {sel.f}(s) ⇌ {sel.a > 1 ? sel.a + ' ' : ''}{sel.cation} + {sel.b > 1 ? sel.b + ' ' : ''}{sel.anion}, Ks = {sci2(sel.Ks)} à 25{NB}°C. Calculez Qr juste après le mélange (écrivez par exemple 2,5×10⁻⁷ ou 2,5e-7), puis concluez.</div>
        <label style={{ ...lbl, display: 'block' }}>Votre Qr (2 chiffres significatifs)
          <input type="text" inputMode="text" autoComplete="off" value={defi.rep} onChange={e => modifie({ rep: e.target.value })} aria-label="Qr juste après le mélange" style={{ ...saisie, marginTop: 2 }}/></label>
        <div role="radiogroup" aria-label="Conclusion" style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }}>
          {[['oui', 'Un précipité se forme'], ['non', 'Pas de précipité (la solution n’est pas saturée)']].map(([v, l]) => <button key={v} role="radio" aria-checked={defi.verdictRep === v} onClick={() => modifie({ verdictRep: v })} style={{ ...stylePetitBouton(defi.verdictRep === v, BLEU), textAlign: 'left', padding: '8px 10px', minHeight: 44 }}>{l}</button>)}
        </div>
        <IndiceDefi cache={false}>Concentrations après mélange : <Frac haut={<>c × V</>} bas={<>V₁ + V₂</>} /> pour chaque ion. Puis Qr avec les exposants de l’équation, et comparaison à Ks : Qr &gt; Ks, précipité ; Qr &lt; Ks, pas de précipité.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle est la valeur de Ks de {sel.f} ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>On mesure la solubilité de {sel.nom} ({sel.f}) à 25{NB}°C : <strong>{sci1(defi.sgL)}{NB}g/L</strong>. Masse molaire : {nbf(sel.M, 1)}{NB}g/mol. Équation : {sel.f}(s) ⇌ {sel.a > 1 ? sel.a + ' ' : ''}{sel.cation} + {sel.b > 1 ? sel.b + ' ' : ''}{sel.anion}. Retrouvez Ks (écrivez par exemple 4,0×10⁻¹¹ ou 4,0e-11 ; gardez 3 chiffres significatifs dans vos calculs intermédiaires).</div>
        <label style={{ ...lbl, display: 'block' }}>Votre Ks
          <input type="text" inputMode="text" autoComplete="off" value={defi.rep} onChange={e => modifie({ rep: e.target.value })} aria-label="Ks" style={{ ...saisie, marginTop: 2 }}/></label>
        <div style={{ height: 8 }}/>
        <IndiceDefi cache={false}>Convertissez d’abord la solubilité en mol/L (divisez par la masse molaire). Puis écrivez les concentrations des ions : coefficient × s. Enfin Ks = produit des concentrations, chacune à la puissance de son coefficient.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} disabled={!defi.rep.trim() || (prec && !defi.verdictRep)} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {prec ? (defi.ok ? `✓ Correct : Qr ≈ ${sci2(defi.q)}, ${defi.verdict === 'precipite' ? 'supérieur' : 'inférieur'} à Ks = ${sci2(defi.Ks)} : ${defi.verdict === 'precipite' ? 'un précipité se forme.' : 'pas de précipité.'}`
          : !defi.dq.ok ? `✗ ${defi.dq.msg}` : '✗ Votre Qr est bon, mais la conclusion est inverse : comparez Qr à Ks (Qr > Ks : précipité ; Qr < Ks : pas de précipité).')
          : (defi.ok ? `✓ Correct : Ks ≈ ${sci2(defi.Ks)}.` : `✗ ${defi.dk.msg}`)}
      </div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {prec ? <>
          <div>Concentrations après mélange : [{sel.cation}] = <Frac haut={<>{sci1(defi.c1)} × {defi.V1}</>} bas={<>{defi.Vt}</>} /> = {sci2(defi.m.c1)}{NB}mol/L ; [{sel.anion}] = <Frac haut={<>{sci1(defi.c2)} × {defi.V2}</>} bas={<>{defi.Vt}</>} /> = {sci2(defi.m.c2)}{NB}mol/L.</div>
          <div>Qr = [{sel.cation}]{sel.a > 1 ? M.sup(sel.a) : ''} × [{sel.anion}]{sel.b > 1 ? M.sup(sel.b) : ''} ≈ <strong>{sci2(defi.q)}</strong> ; Ks = {sci2(defi.Ks)} : {defi.verdict === 'precipite' ? 'Qr > Ks, un précipité se forme.' : 'Qr < Ks, pas de précipité.'} (tolérance de 10 % sur Qr)</div></>
          : <>
          <div>s = <Frac haut={<>{sci1(defi.sgL)}</>} bas={<>{nbf(sel.M, 1)}</>} /> = {sci2(defi.s)}{NB}mol/L ; [{sel.cation}] = {sel.a > 1 ? sel.a + ' × ' : ''}s = {sci2(sel.a * defi.s)}{NB}mol/L ; [{sel.anion}] = {sel.b > 1 ? sel.b + ' × ' : ''}s = {sci2(sel.b * defi.s)}{NB}mol/L.</div>
          <div>Ks = [{sel.cation}]{sel.a > 1 ? M.sup(sel.a) : ''} × [{sel.anion}]{sel.b > 1 ? M.sup(sel.b) : ''} ≈ <strong>{sci2(defi.Ks)}</strong> (tolérance de {nbf(defi.tol * 100, 0)} % : l’arrondi de la solubilité est amplifié par les exposants).</div></>}
      </div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>25 °C</strong>, solutions diluées : les activités sont assimilées aux concentrations ; Ks et Qr sont écrits sans unité.</li>
      <li><strong>Valeurs de Ks</strong> (pKs entre parenthèses) : AgI {sci2(AGI.Ks)} ({nbf(M.pKs(AGI), 2)}) ; CuI {sci2(CUI.Ks)} ({nbf(M.pKs(CUI), 2)}) ; SrCO₃ {sci2(SRCO3.Ks)} ({nbf(M.pKs(SRCO3), 2)}) ; CaF₂ {sci2(CAF2.Ks)} ({nbf(M.pKs(CAF2), 2)}) ; Ag₂CO₃ {sci2(AG2CO3.Ks)} ({nbf(M.pKs(AG2CO3), 2)}). Elles proviennent toutes de l’annexe « Solubility Products » du manuel OpenStax <em>Chemistry</em> (2e éd.). Les tables diffèrent parfois d’un ordre de grandeur selon la source : ces valeurs sont des données de la simulation.</li>
      <li><strong>Pas d’autre réaction</strong> : on néglige les réactions acido-basiques (ion carbonate, ion fluorure) et la complexation des ions ; chaque sel ne s’écarte pas de sa seule équation de dissolution. C’est un modèle : en réalité, ces réactions augmentent un peu la solubilité de CO₃²⁻ et F⁻ en milieu acide.</li>
      <li><strong>Volumes additifs</strong> au mélange ; en exploration, les deux solutions ont le même volume (50 mL).</li>
      <li><strong>Animation</strong> : le nombre de points d’ions suit l’échelle logarithmique de la concentration (qualitatif) ; les teintes bleue et orange des solutions sont ajoutées pour les distinguer (les ions sont incolores) ; la couleur du solide est indicative.</li>
      <li><strong>Précipitation</strong> : supposée totale jusqu’à l’équilibre Qr = Ks (pas de sursaturation, pas de cinétique).</li>
      <li><strong>Solubilité</strong> : quantité de sel dissoute par litre de solution saturée dans l’eau pure ; sa valeur en g/L utilise la masse molaire du sel.</li>
      <li><strong>Résultats</strong> demandés à 2 chiffres significatifs, avec 5 % de marge au parcours, 7 à 21 % en défi (les exposants amplifient l’arrondi).</li>
      <li><strong>Hors périmètre</strong> : effet de la température (simulation 311), précipitation sélective d’hydroxydes selon le pH (simulation 310).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Pour CaF₂, baissez peu à peu les deux concentrations : à partir de quelle valeur de <Frac haut={<>Qr</>} bas={<>Ks</>} /> n’y a-t-il plus de précipité ?</li>
        <li>Faites glisser une seule poignée (cation, puis anion) : lequel des deux ions a le plus d’effet sur Qr pour CaF₂ ? Pourquoi ?</li>
        <li>Choisissez Ag₂CO₃ puis CaF₂ : une même hausse de concentration d’un ion change Qr de combien de décades ? Reliez à l’exposant.</li>
        <li>Après précipitation, la jauge se place sur Qr = Ks : changez de sel, la solution saturée garde-t-elle les mêmes concentrations ?</li>
        <li>Dans « ion commun », ajoutez des ions du sel : la solubilité augmente-t-elle ou diminue-t-elle ? Pourquoi ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Équilibre de dissolution : sel(s) ⇌ ions ; Ks = produit des concentrations des ions, chacune à la puissance de son coefficient.</li>
        <li>Qr : même expression avec les concentrations du moment ; Qr &lt; Ks : pas de précipité ; Qr = Ks : saturée ; Qr &gt; Ks : précipitation jusqu’à Qr = Ks.</li>
        <li>Sel 1 : 1, s = √Ks ; sel 1 : 2 ou 2 : 1, s = ∛(<Frac haut={<>Ks</>} bas={<>4</>} />) ; g/L = mol/L × masse molaire.</li>
        <li>On compare des solubilités, pas des Ks, si les formules diffèrent. Un ion commun diminue la solubilité.</li>
      </ul>)}
    </Section>);

  // ---------- scène du parcours ----------
  const sc = enGuide ? SCENES[idE] : null;
  const ariaSc = sc ? (sc.solo ? `Bécher contenant du ${sc.sel.nom} solide au fond, en équilibre avec ses ions dissous (solution saturée).` : `Deux solutions d’ions versées dans un bécher : ${sc.sel.nom}, Ks = ${sci2(sc.sel.Ks)}.`) : '';

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ksq-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ksq-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
        @media (max-width: 900px) { .ksq-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ksq-in { animation: ksq-fondu 0.35s ease-out; } @keyframes ksq-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Dissoudre ou précipiter ? Qr, Ks et solution saturée</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un sel peu soluble est en équilibre avec ses ions : on compare le <strong>quotient Qr</strong> à la constante <strong>Ks</strong> pour prévoir la précipitation, puis on en déduit la <strong>solubilité</strong>.</div>
      {!enExplore && <div className={`ksq-l1${enGuide && sc ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'precipitation' ? suiviP : suiviK}/></div>}
          {enGuide && sc && <div className="ksq-in" key={`s${idE}`}><SceneGuide sc={sc} aria={ariaSc}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <KsqExplore ex={ex} setEx={setEx} ouv={ouv} setOuv={setOuv} menu={menu}/>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
