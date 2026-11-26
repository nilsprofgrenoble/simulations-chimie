import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, lireNombre, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./hydModele";
import { SvgSeuilCarte, SvgFinCarte, SvgFenetreCarte, SvgPiegeHydCarte } from "./HydSchemas";
import { SceneHydroxydes } from "./HydScene";
import { HydExplore, exInitial, T_SOUDE, PH_DEP, PH_ARR } from "./HydExplore";
import { useEtroit, useLecture, StyleAnim } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

// ====================================================
// SIM 311 — « Précipitation sélective des hydroxydes selon le pH » (terminale STL, SPCL, Chimie et développement durable : solubilité).
//  Une idée : un hydroxyde M(OH)n précipite quand [HO⁻] atteint (Ks ÷ c)^(1/n), c'est-à-dire à partir d'un pH précis ; deux cations se séparent si une « fenêtre » de pH existe entre la fin de précipitation du premier
//  (convention : 1,0×10⁻⁵ mol/L restant) et le début de précipitation du second.
//  Capacités visées (jamais affichées à l'élève) : calculer le pH de début de précipitation d'un hydroxyde ; comparer des pH de précipitation pour prévoir l'ordre et la possibilité d'une séparation.
//  Hors périmètre : effet de la température (sim 311), hydroxydes amphotères et complexes (négligés, annoncés dans les hypothèses).
//  Modèle : hydModele.js (Ks de l'annexe OpenStax Chemistry 2e, 25 °C). Scène animée : HydScene.jsx ; exploration : HydExplore.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const sci1 = x => M.sciNb(x, 1), sci2 = x => M.sciNb(x, 2);
const ph1 = v => M.phTxt(v);
const BLEU = '#0369a1';
const C = M.CATS, CR = C.Cr, NI = C.Ni, MN = C.Mn, MG = C.Mg;
const SIM_ID = 311, CLE_GUIDE = 'hyd-guide-v1';
declarerDefis(SIM_ID, [['separer', 'Choisir le pH qui sépare deux cations'], ['debut', 'Calculer le pH de début de précipitation']]);
const IDS = ['dissolution', 'ohseuil', 'phdebut', 'exposant', 'axe', 'fin', 'fenetre', 'etroite', 'chevauche', 'conc', 'protocole', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- données du parcours (toutes annoncées dans les hypothèses) ----------
const OH_NI = M.ohSeuil(NI, 0.01), OH_NI_AFF = 1.3e-7;                  // étape 2 : 1,3×10⁻⁷
const PH_NI = M.phDe(OH_NI_AFF);                                         // étape 3 : 7,1
const PH_CR = M.phDebut(CR, 0.01);                                       // étape 4 : 4,6
const PH_MN_FIN = M.phFin(MN);                                           // étape 6 : 10,2 (10,15)
const PH_NI_DIL = M.phDebut(NI, 1e-3);                                   // étape 10 : 7,6
const W_CRNI = M.fenetre(CR, 0.01, NI, 0.01), W_NIMN = M.fenetre(NI, 0.01, MN, 0.01), W_MNMG = M.fenetre(MN, 0.01, MG, 0.01);
const cat2 = (a, b, ph0, extra = {}) => ({ cations: [{ cat: a, c: 0.01 }, { cat: b, c: 0.01 }], ph0, ...extra });
const cat1 = (a, c, ph0, extra = {}) => ({ cations: [{ cat: a, c }], ph0, unSeul: true, barres: false, ...extra });
const SCENES = {
  dissolution: cat1(CR, 0.01, 3), ohseuil: cat1(NI, 0.01, 5), phdebut: cat1(NI, 0.01, 5), exposant: cat1(CR, 0.01, 3),
  axe: cat2(CR, NI, 3, { barres: true }), fin: cat2(CR, NI, 3, { barres: true }), fenetre: cat2(CR, NI, 3, { barres: true }),
  etroite: cat2(NI, MN, 8, { barres: true, fenetre: true }), chevauche: cat2(MN, MG, 9, { barres: true, fenetre: true }),
  conc: cat1(NI, 1e-3, 6), protocole: cat2(CR, NI, 6, { barres: true, fenetre: true }), bilan: cat2(CR, NI, 6, { barres: true, fenetre: true }),
};

// Scène du parcours guidé : pH réglable par la poignée, ou soude ajoutée automatiquement
function SceneGuide({ sc, aria }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite), anime = !reduitMouvement(), phase = usePhase(0.8, anime);
  const L = useLecture(T_SOUDE, false), jeu = L.t > 0 || L.joue, [phLoc, setPhLoc] = useState(sc.ph0), [touche, setTouche] = useState(false);
  const ph = jeu ? PH_DEP + (PH_ARR - PH_DEP) * Math.min(1, L.t / T_SOUDE) : phLoc;
  const regler = v => { L.reset(); setTouche(true); setPhLoc(v); };
  return (
    <div ref={boite} style={{ ...styleBoite, padding: 6 }}>
      <StyleAnim/>
      <SceneHydroxydes cations={sc.cations} ph={ph} setPh={regler} etroit={etroit} touche={touche || jeu} svgRef={svgRef} aria={aria} phase={phase} soude={L.joue}
        barres={sc.barres !== false} fenetre={!!sc.fenetre} chiffres unSeul={!!sc.unSeul}/>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={L.joue ? () => L.setJoue(false) : L.demarrer} style={{ ...styleBouton(true, BLEU), minHeight: 44 }}>{L.joue ? '⏸ Pause' : L.fin ? '↻ Rejouer' : '▶ Ajouter la soude'}</button>
        <span style={{ fontSize: 13.5, color: KIT.txt2, flex: '1 1 200px', lineHeight: 1.45 }}>Faites glisser la poignée rouge sur l’axe de pH, ou ajoutez la soude : regardez les ions et les grains d’hydroxyde.</span>
      </div>
    </div>);
}

export function SimulationHyd() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviS, noterS] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('separer');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ cations: false, axe: false, essayer: false, retenir: false });
  const [ex, setEx] = useState(exInitial);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'dissolution', titre: 'Un hydroxyde métallique peu soluble',
      texte: <>Quand on ajoute de la soude (ions HO⁻) à une solution d’ions métalliques, un solide, l’<strong>hydroxyde</strong> du métal, peut précipiter. Pour le chrome(III) : Cr(OH)₃(s) ⇌ Cr³⁺ + 3 HO⁻, avec Ks = {sci1(CR.Ks)} à 25 °C. Les crochets [ ] désignent des concentrations en mol/L ; <strong>c</strong> désigne la concentration de l’ion métallique.</>,
      tache: { type: 'qcm', q: 'Quelle est l’expression de Ks pour Cr(OH)₃ ?', options: ['Ks = [Cr³⁺] × [HO⁻]', 'Ks = [Cr³⁺] × 3 [HO⁻]', 'Ks = [Cr³⁺] × [HO⁻]³', 'Ks = [Cr³⁺]³ × [HO⁻]'], bonne: 2,
        expl: 'Chaque concentration est élevée à la puissance de son coefficient : 1 pour Cr³⁺ (non écrit) et 3 pour HO⁻. Le solide n’intervient pas.',
        indice: 'Le coefficient de chaque ion dans l’équation devient son exposant. Le solide est absent de l’expression.' } },
    { id: 'ohseuil', titre: 'Quand l’hydroxyde commence-t-il à précipiter ?',
      texte: <>Une solution contient des ions Ni²⁺ à c = 1,0×10⁻²{NB}mol/L. On ajoute de la soude : l’hydroxyde de nickel(II) Ni(OH)₂(s) ⇌ Ni²⁺ + 2 HO⁻ (Ks = {sci1(NI.Ks)}) précipite dès que Qr atteint Ks, soit Ks = c × [HO⁻]². La concentration [HO⁻] à ce moment est la <strong>concentration de début de précipitation</strong>.</>,
      tache: { type: 'num', q: 'Calculez [HO⁻] au début de la précipitation (en mol/L, 2 chiffres significatifs).', unite: 'mol/L', vrai: OH_NI, tol: 0.05, affiche: v => sci1(v), cs: 2, carnet: false,
        calcul: () => ['Ks = c × [HO⁻]² donc [HO⁻]² = Ks ÷ c = 1,6×10⁻¹⁶ ÷ 1,0×10⁻² = 1,6×10⁻¹⁴.', `[HO⁻] = √(1,6×10⁻¹⁴) = ${sci2(OH_NI)} mol/L, soit environ ${sci1(OH_NI)} mol/L.`],
        pieges: [[NI.Ks / 0.01, 'Vous avez oublié la racine carrée : Ks = c × [HO⁻]², donc [HO⁻] = √(Ks ÷ c).'], [Math.sqrt(NI.Ks), 'Vous avez oublié de diviser Ks par la concentration c avant la racine.'], [NI.Ks * 0.01, 'On divise Ks par c (on ne multiplie pas).']],
        expl: `[HO⁻] = √(Ks ÷ c) = √(1,6×10⁻¹⁶ ÷ 1,0×10⁻²) ≈ ${sci1(OH_NI)} mol/L.`, indice: 'Ks = c × [HO⁻]² : isolez [HO⁻]² = Ks ÷ c, puis prenez la racine carrée (1,6×10⁻¹⁴ = 16×10⁻¹⁵ ou 160×10⁻¹⁶ pour mieux manipuler).' } },
    { id: 'phdebut', titre: 'Du [HO⁻] au pH',
      texte: <>On a trouvé [HO⁻] = {sci1(OH_NI_AFF)}{NB}mol/L au début de la précipitation de Ni(OH)₂. Le pH se déduit de [HO⁻] par <strong>pH = 14 + log [HO⁻]</strong> (à 25 °C, car pH + pOH = 14 avec pOH = −log [HO⁻]). Remarquez la poignée rouge : elle règle le pH du bécher.</>,
      tache: { type: 'num', q: 'Calculez le pH de début de précipitation de Ni(OH)₂ (2 chiffres significatifs).', unite: '', vrai: PH_NI, tol: 0.02, affiche: v => nbf(v, 1), cs: 2, carnet: false,
        calcul: () => ['pH = 14 + log [HO⁻] = 14 + log (1,3×10⁻⁷).', `log (1,3×10⁻⁷) = −6,89, donc pH = ${nbf(PH_NI, 2)}, soit environ ${nbf(PH_NI, 1)}.`],
        pieges: [[14 - PH_NI, `Vous avez calculé le pOH (−log [HO⁻] = ${nbf(14 - PH_NI, 1)}) : le pH vaut 14 − pOH.`], [-Math.log10(OH_NI_AFF) * -1, 'Le logarithme de [HO⁻] est négatif : il faut ajouter 14.']],
        expl: `pH = 14 + log (1,3×10⁻⁷) ≈ ${nbf(PH_NI, 1)}.`, indice: 'log (1,3×10⁻⁷) = log 1,3 + (−7) ≈ −6,9 : ajoutez 14. Une solution où précipite un hydroxyde est basique : pH supérieur à 7.' } },
    { id: 'exposant', titre: 'Quand l’exposant n’est pas 2',
      texte: <>Pour le chrome(III), Cr(OH)₃(s) ⇌ Cr³⁺ + 3 HO⁻ avec Ks = {sci1(CR.Ks)} et c = 1,0×10⁻²{NB}mol/L : Ks = c × [HO⁻]³. Il faut donc une <strong>racine cubique</strong> : [HO⁻] = ∛(Ks ÷ c). Le pH se calcule ensuite comme avant.</>,
      tache: { type: 'num', q: 'Calculez le pH de début de précipitation de Cr(OH)₃ (2 chiffres significatifs).', unite: '', vrai: PH_CR, tol: 0.02, affiche: v => nbf(v, 1), cs: 2, carnet: false,
        calcul: () => ['[HO⁻]³ = Ks ÷ c = 6,7×10⁻³¹ ÷ 1,0×10⁻² = 6,7×10⁻²⁹.', `[HO⁻] = ∛(6,7×10⁻²⁹) = ${sci2(M.ohSeuil(CR, 0.01))} mol/L ; pH = 14 + log [HO⁻] = ${nbf(PH_CR, 2)}, soit environ ${nbf(PH_CR, 1)}.`],
        pieges: [[14 - PH_CR, 'Vous avez calculé le pOH : le pH vaut 14 − pOH.'], [M.phDe(Math.sqrt(CR.Ks / 0.01)), 'Vous avez pris une racine carrée : pour Cr(OH)₃, Ks = c × [HO⁻]³ demande une racine cubique.'], [M.phDe(Math.cbrt(CR.Ks)), 'Vous avez oublié de diviser Ks par c avant la racine cubique.']],
        expl: `[HO⁻] = ∛(Ks ÷ c) = ∛(6,7×10⁻²⁹) ≈ ${sci1(M.ohSeuil(CR, 0.01))} mol/L ; pH = 14 + log [HO⁻] ≈ ${nbf(PH_CR, 1)}.`, indice: 'Ks ÷ c = 6,7×10⁻²⁹ = 67×10⁻³⁰ : la racine cubique d’une puissance de 10 multiple de 3 est facile. Puis pH = 14 + log [HO⁻].' } },
    { id: 'axe', titre: 'Qui précipite en premier ?',
      retenirTitre: 'À retenir : le pH de début de précipitation',
      retenir: <><SvgSeuilCarte/><ul style={ULS}>
        <li>Pour M(OH)ₙ : <strong>Ks = [Mⁿ⁺] × [HO⁻]ⁿ</strong>, donc [HO⁻] de début = <strong>(Ks ÷ c)<sup>1/n</sup></strong> et <strong>pH = 14 + log [HO⁻]</strong>.</li>
        <li>L’exposant n est le coefficient de HO⁻ : racine carrée pour M(OH)₂, racine cubique pour M(OH)₃.</li>
        <li>Plus Ks est petit (à même concentration et même formule), plus le pH de début est bas.</li></ul></>,
      texte: <>Sur l’axe de pH, une barre colorée montre pour chaque cation la zone où il précipite : elle commence au pH de début de précipitation. Ici Cr³⁺ (violet) et Ni²⁺ (vert) sont chacun à 1,0×10⁻²{NB}mol/L. Faites glisser la poignée, ou ajoutez la soude, et regardez quel solide apparaît en premier.</>,
      tache: { type: 'qcm', q: 'Quel hydroxyde précipite en premier quand le pH augmente ?', options: ['Ni(OH)₂, car son Ks est le plus grand', 'les deux en même temps, car les concentrations sont égales', 'Cr(OH)₃ : son pH de début de précipitation est le plus bas', 'on ne peut pas savoir sans connaître les volumes'], bonne: 2,
        expl: `Cr(OH)₃ commence à précipiter dès pH ${ph1(PH_CR)} alors que Ni(OH)₂ ne commence qu’à pH ${ph1(PH_NI)} : en montant le pH, on rencontre d’abord le seuil de Cr(OH)₃.`,
        indice: 'Lisez le début de chaque barre sur l’axe de pH : le premier rencontré en augmentant le pH précipite en premier.' } },
    { id: 'fin', titre: 'Quand a-t-on fini de précipiter ?',
      texte: <>La précipitation ne s’arrête pas d’un coup : plus le pH monte, plus il reste peu d’ions en solution. On convient qu’un cation est <strong>quasi totalement précipité</strong> quand il n’en reste que 1,0×10⁻⁵{NB}mol/L (c’est une convention, voir hypothèses). Le pH de fin de précipitation se calcule comme le pH de début, avec c = 1,0×10⁻⁵{NB}mol/L. Pour Mn(OH)₂ : Ks = {sci1(MN.Ks)}, n = 2.</>,
      tache: { type: 'num', q: 'Calculez le pH de fin de précipitation de Mn(OH)₂ (2 chiffres significatifs).', unite: '', vrai: PH_MN_FIN, tol: 0.02, affiche: v => nbf(v, 1), cs: 2, carnet: false,
        calcul: () => ['[HO⁻]² = Ks ÷ c = 2×10⁻¹³ ÷ 1,0×10⁻⁵ = 2×10⁻⁸.', `[HO⁻] = √(2×10⁻⁸) = ${sci2(M.ohSeuil(MN, 1e-5))} mol/L ; pH = 14 + log [HO⁻] = ${nbf(PH_MN_FIN, 2)}, soit environ ${nbf(PH_MN_FIN, 1)}.`],
        pieges: [[M.phDebut(MN, 0.01), 'Vous avez utilisé la concentration de départ (1,0×10⁻² mol/L) : pour la fin, c = 1,0×10⁻⁵ mol/L.'], [14 - PH_MN_FIN, 'Vous avez donné le pOH : le pH vaut 14 − pOH.'], [M.phDe(MN.Ks / 1e-5), 'Vous avez oublié la racine carrée : Ks = c × [HO⁻]².']],
        expl: `[HO⁻] = √(Ks ÷ 1,0×10⁻⁵) = √(2×10⁻⁸) ≈ ${sci1(M.ohSeuil(MN, 1e-5))} mol/L ; pH ≈ ${nbf(PH_MN_FIN, 1)}.`, indice: 'Même méthode que pour le début, en remplaçant c par 1,0×10⁻⁵ mol/L : [HO⁻] = √(Ks ÷ 1,0×10⁻⁵), puis pH = 14 + log [HO⁻].' } },
    { id: 'fenetre', titre: 'Séparer deux cations',
      retenirTitre: 'À retenir : début et fin de précipitation',
      retenir: <><SvgFinCarte/><ul style={ULS}>
        <li>Au pH de début, la concentration de l’ion métallique commence à diminuer ; la précipitation est dite <strong>quasi totale</strong> quand il en reste 1,0×10⁻⁵ mol/L (convention).</li>
        <li>Même méthode pour la fin : [HO⁻] = (Ks ÷ 1,0×10⁻⁵)<sup>1/n</sup>, puis pH = 14 + log [HO⁻].</li>
        <li>Plus n est grand, plus la concentration chute vite quand le pH augmente.</li></ul></>,
      texte: <>Pour Cr³⁺ et Ni²⁺ (1,0×10⁻²{NB}mol/L chacun), Cr(OH)₃ est quasi totalement précipité à pH {ph1(W_CRNI.lo)}, et Ni(OH)₂ commence à précipiter à pH {ph1(W_CRNI.hi)}. Pour <strong>séparer</strong> les deux cations, on cherche un pH où le premier est quasi totalement précipité (donc filtrable) alors que le second est encore entièrement dissous. Essayez plusieurs valeurs avec la poignée.</>,
      tache: { type: 'qcm', q: 'Quel pH permet de séparer Cr³⁺ de Ni²⁺ ?', options: ['pH 8,0', 'pH 4,0', 'pH 6,5', 'pH 9,5'], bonne: 2,
        expl: `Il faut un pH compris entre ${ph1(W_CRNI.lo)} (Cr(OH)₃ quasi total) et ${ph1(W_CRNI.hi)} (début de Ni(OH)₂) : pH 6,5 convient. À pH 4,0 rien n’a précipité ; à 8,0 et 9,5, Ni(OH)₂ précipite aussi.`,
        indice: 'Le pH doit être au-dessus de la fin de la barre de Cr(OH)₃ et au-dessous du début de la barre de Ni(OH)₂.' } },
    { id: 'etroite', titre: 'Quand la fenêtre est trop étroite',
      texte: <>La <strong>fenêtre de séparation</strong> est la zone de pH entre la fin de précipitation du premier hydroxyde et le début du second (bande colorée). Pour Ni²⁺ et Mn²⁺ (1,0×10⁻²{NB}mol/L chacun) : Ni(OH)₂ est quasi total à pH {ph1(W_NIMN.lo)}, Mn(OH)₂ commence à pH {nbf(W_NIMN.hi, 2)}. Un pH-mètre se règle au mieux à quelques centièmes ou dixièmes d’unité.</>,
      tache: { type: 'qcm', q: 'Peut-on séparer Ni²⁺ et Mn²⁺ en jouant sur le pH ?', options: ['oui : il suffit de régler le pH à 8,6', 'oui : tout pH inférieur à 8,65 convient', 'non, en pratique : la fenêtre est bien plus étroite que la précision du réglage', 'non : Mn(OH)₂ précipite avant Ni(OH)₂'], bonne: 2,
        expl: `La fenêtre va de pH ${nbf(W_NIMN.lo, 2)} à ${nbf(W_NIMN.hi, 2)} : elle ne fait que ${nbf(W_NIMN.largeur, 2)} unité de pH. Aucun réglage réaliste ne tombe dedans : en pratique, la séparation n’est pas possible.`,
        indice: 'Calculez la largeur de la fenêtre : début du second moins fin du premier. Comparez-la à 0,1 unité de pH.' } },
    { id: 'chevauche', titre: 'Quand les zones se chevauchent',
      texte: <>Autre cas : Mn²⁺ et Mg²⁺ (1,0×10⁻²{NB}mol/L chacun). Mn(OH)₂ n’est quasi total qu’à pH {ph1(W_MNMG.premier === MN ? M.phFin(MN) : 0)}, mais Mg(OH)₂ (Ks = {sci1(MG.Ks)}) commence à pH {ph1(M.phDebut(MG, 0.01))}. Regardez les barres sur l’axe.</>,
      tache: { type: 'qcm', q: 'Que conclure pour la séparation de Mn²⁺ et Mg²⁺ par le pH ?', options: ['elle est possible à pH 10', 'elle est impossible : les deux hydroxydes précipitent sur des zones de pH qui se recouvrent', 'elle est possible en dessous de pH 9', 'elle est possible, avec une fenêtre étroite'], bonne: 1,
        expl: `Mg(OH)₂ commence à précipiter (pH ${ph1(M.phDebut(MG, 0.01))}) avant que Mn(OH)₂ ne soit quasi total (pH ${ph1(M.phFin(MN))}) : il n’existe aucun pH qui précipite l’un sans l’autre. Il faudrait une autre méthode.`,
        indice: 'Comparez la fin de la barre du premier (Mn) et le début de la barre du second (Mg) : se recouvrent-elles ?' } },
    { id: 'conc', titre: 'Et si la solution est diluée ?',
      retenirTitre: 'À retenir : la fenêtre de séparation',
      retenir: <><SvgFenetreCarte/><ul style={ULS}>
        <li><strong>Fenêtre</strong> = du pH de fin de précipitation du premier au pH de début du second.</li>
        <li>Fenêtre nette (plus d’une unité de pH) : séparation facile. Très étroite (moins de 0,3 unité) : inutilisable en pratique. Négative : <strong>chevauchement</strong>, séparation impossible.</li>
        <li>On choisit un pH au milieu de la fenêtre.</li></ul></>,
      texte: <>Le pH de début dépend de la concentration c : [HO⁻] = √(Ks ÷ c) pour M(OH)₂. On dilue dix fois la solution d’ions Ni²⁺ de l’étape 2 : c = 1,0×10⁻³{NB}mol/L. Rappel : Ks(Ni(OH)₂) = {sci1(NI.Ks)} ; avec c = 1,0×10⁻²{NB}mol/L, le pH de début valait {ph1(PH_NI)}.</>,
      tache: { type: 'num', q: 'Calculez le pH de début de précipitation de Ni(OH)₂ pour c = 1,0×10⁻³ mol/L (2 chiffres significatifs).', unite: '', vrai: PH_NI_DIL, tol: 0.02, affiche: v => nbf(v, 1), cs: 2, carnet: false,
        calcul: () => ['[HO⁻]² = Ks ÷ c = 1,6×10⁻¹⁶ ÷ 1,0×10⁻³ = 1,6×10⁻¹³.', `[HO⁻] = √(1,6×10⁻¹³) = ${sci2(M.ohSeuil(NI, 1e-3))} mol/L ; pH = 14 + log [HO⁻] = ${nbf(PH_NI_DIL, 2)}, soit environ ${nbf(PH_NI_DIL, 1)}.`],
        pieges: [[PH_NI, 'Vous avez gardé la concentration de l’étape 2 (1,0×10⁻² mol/L) : ici c = 1,0×10⁻³ mol/L.'], [PH_NI - 0.5, 'Sens inversé : diluer diminue c, donc il faut plus de HO⁻ et le pH de début augmente.'], [14 - PH_NI_DIL, 'Vous avez donné le pOH : le pH vaut 14 − pOH.']],
        expl: `[HO⁻] = √(1,6×10⁻¹³) ≈ ${sci1(M.ohSeuil(NI, 1e-3))} mol/L ; pH ≈ ${nbf(PH_NI_DIL, 1)} : dix fois plus dilué, le pH de début monte de 0,5 (1 ÷ n avec n = 2).`, indice: 'Même méthode qu’à l’étape 2 avec c = 1,0×10⁻³ mol/L : [HO⁻] = √(Ks ÷ c), puis pH = 14 + log [HO⁻].' } },
    { id: 'protocole', titre: 'Le protocole de séparation',
      texte: <>Pour séparer Cr³⁺ et Ni²⁺ au laboratoire (ou dans une usine de traitement de solutions métalliques), on ajoute la soude peu à peu en surveillant le pH avec un pH-mètre. Vous avez vu qu’un pH d’environ {ph1((W_CRNI.lo + W_CRNI.hi) / 2)} est dans la fenêtre. Il faut aussi récupérer le solide formé.</>,
      tache: { type: 'qcm', q: 'Dans quel ordre procède-t-on ?', options: ['on monte le pH jusqu’à 12, puis on filtre', 'on filtre d’abord, puis on ajoute la soude', 'on ajuste le pH dans la fenêtre, on filtre Cr(OH)₃, puis on remonte le pH pour précipiter Ni(OH)₂', 'on ajoute la soude à pH 4, puis on filtre Ni(OH)₂'], bonne: 2,
        expl: 'On règle le pH dans la fenêtre : Cr(OH)₃ précipite presque totalement alors que Ni²⁺ reste dissous. On filtre pour éliminer Cr(OH)₃, puis on augmente le pH au-delà du début de Ni(OH)₂ pour le précipiter à son tour.',
        indice: 'Il faut éliminer le premier solide (filtration) avant de monter le pH, sinon les deux précipitent ensemble.' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : pièges et effet de la concentration',
      retenir: <><SvgPiegeHydCarte/><ul style={ULS}>
        <li>pH = 14 + log [HO⁻] (ou 14 − pOH) : ne pas confondre pH et pOH.</li>
        <li>Racine d’ordre n, et division de Ks par la concentration c.</li>
        <li>Plus la solution est diluée, plus le pH de début de précipitation est élevé.</li></ul></>,
      texte: <>Vous savez calculer le pH de début (et de fin) de précipitation d’un hydroxyde, comparer des pH pour prévoir l’ordre de précipitation, et juger si une séparation par le pH est possible grâce à la fenêtre. En exploration, choisissez deux cations parmi quatre et deux concentrations, puis réglez le pH. Les défis vous demandent de choisir un pH de séparation ou de calculer un pH de début.</>,
      tache: null },
  ];

  const nouveauDefi = type => {
    if (type === 'separer') setDefi({ type, ...M.tirageDefiSeparer(), rep: '', verifie: false, essais: 0, corr: false });
    else setDefi({ type, ...M.tirageDefiDebut(), rep: '', verifie: false, essais: 0, corr: false });
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
    const x = lireNombre(defi.rep);
    if (defi.type === 'separer') { const dq = M.diagSeparer(defi, x); setDefi(d => ({ ...d, verifie: true, ok: dq.ok, dq, essais: dq.ok ? d.essais : d.essais + 1 })); noterS(dq.ok); }
    else { const dq = M.diagDebut(defi, x); setDefi(d => ({ ...d, verifie: true, ok: dq.ok, dq, essais: dq.ok ? d.essais : d.essais + 1 })); noterD(dq.ok); }
  };
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const voletDefi = defi && (() => {
    const sep = defi.type === 'separer', cat = C[defi.id];
    return (<div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['separer', 'Choisir le pH qui sépare'], ['debut', 'pH de début de précipitation']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, BLEU)}>{l}</button>)}
      </div>
      {sep ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : séparer {C[defi.a].ion} de {C[defi.b].ion}</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Une solution contient des ions {C[defi.a].ion} à {sci1(defi.cA)}{NB}mol/L et des ions {C[defi.b].ion} à {sci1(defi.cB)}{NB}mol/L. Ks({C[defi.a].solide}) = {sci2(C[defi.a].Ks)} ; Ks({C[defi.b].solide}) = {sci2(C[defi.b].Ks)} (25 °C). On ajoute de la soude. Quel pH choisir pour précipiter quasi totalement (jusqu’à 1,0×10⁻⁵{NB}mol/L restant) le premier hydroxyde sans que le second ait commencé à précipiter ? Un pH à une décimale convient (tolérance de 0,1 de chaque côté de la fenêtre).</div>
        <label style={{ ...lbl, display: 'block' }}>Votre pH
          <input type="text" inputMode="text" autoComplete="off" value={defi.rep} onChange={e => modifie({ rep: e.target.value })} aria-label="pH choisi" style={{ ...saisie, marginTop: 2 }}/></label>
        <div style={{ height: 8 }}/>
        <IndiceDefi cache={false}>Calculez le pH de début de précipitation de chaque hydroxyde avec la concentration de l’énoncé : [HO⁻] = (Ks ÷ c)^(1/n), pH = 14 + log [HO⁻]. Le premier à précipiter est celui dont le pH de début est le plus bas : calculez aussi son pH de fin avec c = 1,0×10⁻⁵ mol/L. La fenêtre va de ce pH de fin au pH de début du second.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : pH de début de précipitation de {cat.solide}</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Une solution d’ions {cat.ion} à {sci1(defi.c)}{NB}mol/L reçoit de la soude (25{NB}°C). Équation : {cat.solide}(s) ⇌ {cat.ion} + {cat.n} HO⁻, Ks = {sci2(cat.Ks)}. Calculez le pH auquel l’hydroxyde commence à précipiter (une décimale).</div>
        <label style={{ ...lbl, display: 'block' }}>Votre pH
          <input type="text" inputMode="text" autoComplete="off" value={defi.rep} onChange={e => modifie({ rep: e.target.value })} aria-label="pH de début de précipitation" style={{ ...saisie, marginTop: 2 }}/></label>
        <div style={{ height: 8 }}/>
        <IndiceDefi cache={false}>Ks = c × [HO⁻]{M.sup(cat.n)}, donc [HO⁻] = {cat.n === 2 ? 'racine carrée' : 'racine cubique'} de (Ks ÷ c). Puis pH = 14 + log [HO⁻].</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} disabled={!defi.rep.trim()} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (sep ? `✓ Correct : la fenêtre va de pH ${ph1(defi.w.lo)} à ${ph1(defi.w.hi)} : ${defi.w.premier.solide} est quasi total et ${defi.w.second.solide} n’a pas commencé.` : `✓ Correct : pH de début ≈ ${nbf(defi.ph, 1)}.`) : `✗ ${defi.dq.msg}`}
      </div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {sep ? (() => { const w = defi.w, P = w.premier, S = w.second; return <>
          <div>pH de début : {P.solide} {ph1(M.phDebut(P, w.cPremier))} ; {S.solide} {ph1(w.hi)} → {P.solide} précipite en premier.</div>
          <div>pH de fin de {P.solide} : [HO⁻] = {P.n === 2 ? '√' : '∛'}(Ks ÷ 1,0×10⁻⁵) = {sci2(M.ohSeuil(P, M.C_FIN))} mol/L, soit pH <strong>{ph1(w.lo)}</strong>.</div>
          <div>Fenêtre : de <strong>pH {ph1(w.lo)}</strong> à <strong>pH {ph1(w.hi)}</strong> : tout pH entre ces deux valeurs sépare les cations (au milieu : {ph1((w.lo + w.hi) / 2)}).</div></>; })()
          : <>
          <div>[HO⁻]{M.sup(cat.n)} = Ks ÷ c = {sci2(cat.Ks)} ÷ {sci2(defi.c)} = {sci2(cat.Ks / defi.c)} → [HO⁻] = {sci2(defi.oh)} mol/L.</div>
          <div>pH = 14 + log [HO⁻] = <strong>{nbf(defi.ph, 2)}</strong>, soit environ {nbf(defi.ph, 1)} (tolérance de 0,15 sur le pH).</div></>}
      </div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>25 °C</strong>, solutions diluées : activités assimilées aux concentrations ; pH + pOH = 14 (produit ionique de l’eau 1,0×10⁻¹⁴).</li>
      <li><strong>Valeurs de Ks</strong> (pKs entre parenthèses) : Cr(OH)₃ {sci2(CR.Ks)} ({nbf(M.pKs(CR), 2)}) ; Ni(OH)₂ {sci2(NI.Ks)} ({nbf(M.pKs(NI), 2)}) ; Mn(OH)₂ {sci2(MN.Ks)} ({nbf(M.pKs(MN), 2)}) ; Mg(OH)₂ {sci2(MG.Ks)} ({nbf(M.pKs(MG), 2)}). Source : annexe « Solubility Products » d’OpenStax Chemistry 2e. D’autres tables donnent des valeurs un peu différentes (jusqu’à un facteur 3 pour certains hydroxydes), ce qui décale les pH de quelques dixièmes d’unité.</li>
      <li><strong>Convention de fin de précipitation</strong> : un cation est dit quasi totalement précipité quand il reste 1,0×10⁻⁵ mol/L d’ions en solution (convention courante ; un seuil de 1 % de la concentration initiale donnerait d’autres pH de fin).</li>
      <li><strong>Pas d’autre réaction</strong> : on néglige la complexation et le caractère amphotère (Cr(OH)₃ se redissout en milieu très basique), ainsi que l’oxydation du manganèse(II) à l’air.</li>
      <li><strong>Volume constant</strong> : la soude est supposée concentrée et ajoutée en petite quantité, sans dilution notable.</li>
      <li><strong>Fenêtre « utilisable »</strong> : au moins 0,3 unité de pH (précision d’un réglage au pH-mètre), « nette » à partir d’une unité (choix pédagogique de cette simulation).</li>
      <li><strong>Animation</strong> : nombre d’ions et de grains proportionnel à la fraction restante ou précipitée (qualitatif) ; les couleurs des ions et des solides sont schématiques (elles ne reproduisent pas les vraies teintes).</li>
      <li><strong>Résultats</strong> demandés à 2 chiffres significatifs ; pH avec 2 % de marge au parcours, 0,1 à 0,15 unité de pH en défi.</li>
      <li><strong>Hors périmètre</strong> : effet de la température sur Ks (simulation 311).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Choisissez Cr³⁺ et Ni²⁺, puis déplacez la poignée : quel est le pH le plus éloigné des deux bords de la fenêtre ? Pourquoi est-ce le meilleur choix ?</li>
        <li>Passez à Ni²⁺ et Mn²⁺ : y a-t-il un pH où l’un a précipité totalement et pas l’autre ?</li>
        <li>Prenez Mn²⁺ et Mg²⁺ : repérez ce qui se passe quand le pH dépasse 10 sur la scène.</li>
        <li>Diluez la solution de Ni²⁺ (menu des concentrations) : de combien l’axe se décale-t-il ? Même question pour Cr³⁺ (n = 3).</li>
        <li>Lancez « Ajouter la soude » : à quel pH le premier grain apparaît-il, et le dernier ion disparaît-il ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>M(OH)ₙ ⇌ Mⁿ⁺ + n HO⁻ ; Ks = [Mⁿ⁺] × [HO⁻]ⁿ ; début de précipitation : [HO⁻] = (Ks ÷ c)<sup>1/n</sup>, pH = 14 + log [HO⁻].</li>
        <li>Fin de précipitation (quasi totale) : même calcul avec c = 1,0×10⁻⁵ mol/L.</li>
        <li>Séparation possible si la fin du premier est à un pH plus bas que le début du second : fenêtre de pH entre les deux.</li>
        <li>Diluer fait monter le pH de début de précipitation (de 1 ÷ n unité pour une dilution par 10).</li>
      </ul>)}
    </Section>);

  // ---------- scène du parcours ----------
  const sc = enGuide ? SCENES[idE] : null;
  const ariaSc = sc ? `Bécher contenant ${sc.cations.map(o => `des ions ${o.cat.ion} à ${sci1(o.c)} mol/L`).join(' et ')}. On règle le pH avec une poignée sur un axe de pH : au-delà du pH de début de précipitation, des grains d’hydroxyde se forment et tombent au fond.` : '';
  const scDefi = defi && defi.type === 'separer' ? { cations: [{ cat: C[defi.a], c: defi.cA }, { cat: C[defi.b], c: defi.cB }], ph0: 3, barres: false } : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .hyd-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .hyd-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
        @media (max-width: 900px) { .hyd-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .hyd-in { animation: hyd-fondu 0.35s ease-out; } @keyframes hyd-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Précipitation sélective des hydroxydes selon le pH</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un hydroxyde métallique précipite à partir d’un <strong>pH précis</strong>, qui dépend de <strong>Ks</strong> et de la concentration : on s’en sert pour <strong>séparer des cations</strong>.</div>
      {!enExplore && <div className={`hyd-l1${(enGuide && sc) || (enDefi && scDefi) ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'separer' ? suiviS : suiviD}/></div>}
          {enDefi && scDefi && <div key={`d${defi.a}${defi.b}${defi.cA}${defi.cB}`} style={{ marginTop: 10 }}><SceneGuide sc={scDefi} aria={`Bécher contenant des ions ${C[defi.a].ion} et ${C[defi.b].ion} : réglez le pH avec la poignée pour observer les précipitations.`}/></div>}
          {enGuide && sc && <div className="hyd-in" key={`s${idE}`}><SceneGuide sc={sc} aria={ariaSc}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <HydExplore ex={ex} setEx={setEx} ouv={ouv} setOuv={setOuv} menu={menu}/>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
