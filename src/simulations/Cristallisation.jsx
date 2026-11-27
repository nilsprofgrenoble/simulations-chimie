import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { TabBtn, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, Formule, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { SOLUB, solubilite, tempDeSolub, pSatEau } from "./cristallisationModele";
import { SceneSolubilite } from "./TsolScene";
import { useEtroit, StyleAnim, Chips } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";
import { FicheSolubilite, FicheBilan, FichePremiersCristaux, FicheRendement, FicheEvaporation, FicheProcede } from "./CristallisationFiches";

const SIM_ID = 7;
const NB = '\u00a0';
declarerDefis(SIM_ID, [['principal', 'Cristallisation et rendement']]);

// ============================================================
//  SIMULATION 7 — Cristallisation de KNO₃
// ============================================================

// ── Modèle (fonctions pures) : voir cristallisationModele.js (valeurs tabulées de KNO₃, interpolation linéaire entre deux valeurs) ──
const INDICE_Q = {"s": "Pas de calcul : lisez l’ordonnée de la courbe à la température demandée.", "d": "Une solution saturée contient exactement la solubilité (proportionnelle à la masse d’eau).", "c": "Cristaux = sel introduit − sel resté dissous.", "r": "Rendement = cristaux ÷ sel introduit × 100.", "t": "Les premiers cristaux apparaissent quand la solubilité vaut la masse de sel pour 100 g d’eau.", "e": "À saturation, sel ÷ eau = solubilité ÷ 100 : calculez la masse d’eau correspondante."};
const KNO3 = { id: 'kno3', nom: 'nitrate de potassium', formule: 'KNO₃', T: SOLUB.map(p => p[0]), s: SOLUB.map(p => p[1]), col: '#0e7490', colS: '#a5f3fc', ymax: 250, pasY: 50, sens: 'croissante' };

// Scène animée : bécher (glaçons ou plaque chauffante et vapeur, niveau d'eau, ions et cristaux) et, dès qu'il est introduit, diagramme de solubilité avec poignée de température.
function SceneCristal({ T, setT, mSolute, mEau, evap, graphe, ecart, lecture, enCours, lancer, arreter, touche, setTouche }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite), anime = !reduitMouvement(), phase = usePhase(0.8, anime);
  const aria = `Bécher contenant ${mEau} g d’eau et ${mSolute} g de nitrate de potassium à ${Math.round(T)} °C${graphe ? ', avec le diagramme de solubilité et une poignée rouge pour régler la température' : ''}.`;
  return (
    <div ref={boite}>
      <StyleAnim/>
      <div style={{ maxWidth: graphe ? undefined : 440, margin: '0 auto' }}>
        <SceneSolubilite solide={KNO3} m={mSolute} mEau={mEau} T={T} setT={v => { arreter(); setTouche(true); setT(v); }} etroit={etroit} touche={touche || enCours} svgRef={svgRef} aria={aria} phase={phase}
          dir={enCours ? (evap ? 'chaud' : 'froid') : null} vapeur={enCours && evap} niveau={evap ? mEau / 100 : 1} vide={evap ? pSatEau(T) : null} lecture={!!lecture && graphe} pointEtat={graphe} regions={graphe} becher graphe={graphe} ecart={ecart}/>
      </div>
      {evap && <div style={{ margin: '8px 4px 0', padding: '8px 12px', borderRadius: 10, background: '#ecfeff', border: '1.5px solid #67e8f9', fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>
        <strong>Pourquoi une pompe à vide ?</strong> L’eau bout à 100 °C seulement sous la pression atmosphérique (101 kPa). Quand on <strong>baisse la pression</strong>, elle bout à une température plus basse : à {Math.round(T)} °C, il suffit que la pression descende à <strong>{Math.round(pSatEau(T))} kPa</strong>. On évapore l’eau sans chauffer la solution à 100 °C.
      </div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 4px 2px', flexWrap: 'wrap' }}>
        <button type="button" onClick={enCours ? arreter : lancer} style={{ ...styleBouton(true, evap ? '#b45309' : '#0369a1'), minHeight: 44 }}>{enCours ? '⏸ Pause' : evap ? '▶ Évaporer l’eau' : '▶ Refroidir la solution'}</button>
        <span style={{ fontSize: 13.5, color: KIT.txt2, flex: '1 1 200px', lineHeight: 1.45 }}>{graphe ? 'Lancez l’animation, ou faites glisser la poignée rouge sur l’axe des températures : le bécher et le point sur le diagramme suivent.' : 'Lancez l’animation pour voir ce qui se passe dans le bécher.'}</span>
      </div>
    </div>);
}

export function Simulation7() {
  const [mode, setMode]         = useState(() => modeOuverture('crist-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide]       = useEtatPersistant('crist-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi]         = useState(null);
  const [hypoOuv, setHypoOuv]   = useState(false);
  const [typeCr, setTypeCr]     = useState("refroidissement");
  const [T, setT]               = useState(60);
  const [touche, setTouche]       = useState(false);
  const [enCours, setEnCours]     = useState(false);
  const raf = useRef(0);
  const [mEau, setMEau]         = useState(100);
  const [mSolute, setMSolute]   = useState(50);
  const enGuide = mode === 'guide';

  // ── Calculs ──
  // mSolute : masse de KNO₃ pour 100 g d'eau au départ. En refroidissement, la masse d'eau reste 100 g ;
  // en évaporation, la température est fixe et la masse d'eau diminue jusqu'à mEau.
  const mEauEff    = typeCr === "evaporation" ? mEau : 100;
  const sT         = solubilite(T);
  const mDissoute  = Math.min(mSolute, sT * mEauEff / 100);
  const mCristaux  = Math.max(0, mSolute - mDissoute);
  const conc       = mEauEff > 0 ? mDissoute / mEauEff * 100 : 0;
  const sature     = mCristaux > 1e-9;
  const fracDiss   = mSolute > 0 ? mDissoute / mSolute : 1;

  // Points du diagramme (T ; g de KNO₃ pour 100 g d'eau) : composition globale, et solution liquide





  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const ref = { m: 100 };                                         // scénario de refroidissement : 100 g de KNO₃ dans 100 g d'eau
  const s80 = solubilite(80), s40 = solubilite(40), s20 = solubilite(20);
  const tSat100 = tempDeSolub(ref.m);                             // ≈ 55,9 °C
  const c40 = ref.m - s40, c20 = ref.m - s20;
  const sEv = solubilite(60), eauSat = 50 / sEv * 100, cEv20 = 50 - sEv * 20 / 100;   // évaporation : 50 g de KNO₃, 60 °C
  const modeRef = typeCr === 'refroidissement' && mSolute === ref.m;
  const modeEv = typeCr === 'evaporation' && T === 60 && mSolute === 50;
  const ETAPES = [
    { id: 'objectif', titre: 'Que cherche-t-on ?', focus: ['becher'],
      texte: <>Pour obtenir du nitrate de potassium KNO₃ solide à partir d'une solution, on le fait <strong>cristalliser</strong> : on rend la solution <strong>saturée</strong>, puis les cristaux apparaissent. Deux procédés : refroidir la solution, ou évaporer une partie de l'eau.</>,
      tache: { type: 'qcm', q: 'Qu’est-ce qu’une solution saturée ?', options: ['Une solution qui ne peut plus dissoudre de soluté à cette température', 'Une solution très concentrée, quelle que soit la température', 'Une solution qui contient des cristaux de soluté dissous'], bonne: 0,
        expl: 'À une température donnée, la solubilité est la masse maximale de soluté que l’on peut dissoudre dans une masse d’eau donnée. Au-delà, le soluté en excès reste solide.', indice: "Saturée : le soluté ne peut plus se dissoudre. Que devient du soluté ajouté en plus ?" } },
    { id: 'lecture', titre: 'Lire le diagramme de solubilité', focus: ['diagramme'],
      texte: <>Le diagramme donne la <strong>solubilité</strong> de KNO₃ (masse de sel pour 100 g d'eau) en fonction de la température. On dissout <strong>100 g</strong> de KNO₃ dans 100 g d'eau à 80 °C. Lisez sur la courbe la solubilité à 80 °C (la grille a un trait tous les 50 g).</>,
      tache: { type: 'num', q: 'Solubilité de KNO₃ à 80 °C', unite: 'g / 100 g d’eau', vrai: s80, tol: 0.08, affiche: x => fmt(x, 0),
        aide: 'Lecture : repérez 80 °C sur l’axe horizontal, montez jusqu’à la courbe, puis lisez la valeur sur l’axe vertical (g de KNO₃ pour 100 g d’eau).',
        bloque: !(typeCr === 'refroidissement' && T === 80) ? 'Gardez le mode « Par refroidissement » et T = 80 °C.' : null,
        expl: `À 80 °C, 100 g d'eau peuvent dissoudre jusqu'à ${fmt(s80, 0)} g de KNO₃. Comme on n'en a mis que 100 g, la solution est insaturée : tout est dissous.`, indice: "Pas de calcul : lisez l’ordonnée de la courbe à 80 °C, en g pour 100 g d’eau." } },
    { id: 'sens', titre: 'Effet de la température', focus: ['diagramme', 'params'],
      texte: <>Déplacez le curseur de température vers des valeurs plus basses et observez la courbe : la solubilité de KNO₃ varie fortement avec la température.</>,
      tache: { type: 'qcm', q: 'Quand on refroidit la solution, la solubilité de KNO₃…', options: ['diminue : du sel peut devenir solide', 'augmente : le sel se dissout mieux', 'ne change pas'], bonne: 0,
        expl: 'La solubilité de KNO₃ chute de 169 g à 80 °C à environ 13 g à 0 °C (pour 100 g d’eau) : c’est ce qui rend la cristallisation par refroidissement efficace pour ce sel.', indice: "Suivez la courbe vers les basses températures : la solubilité monte ou descend ?" } },
    { id: 'refroid40', titre: 'Refroidir à 40 °C', focus: ['params', 'diagramme', 'becher'],
      retenirTitre: 'À RETENIR : SOLUBILITÉ ET SATURATION', retenir: <FicheSolubilite/>,
      texte: <>On refroidit la solution (100 g de KNO₃ pour 100 g d'eau). Réglez la température à <strong>40 °C</strong>. Le point est la composition globale du système ; le trait rouge vertical mesure l'écart entre cette composition et la courbe.</>,
      tache: { type: 'action', ok: T === 40, label: 'Régler T = 40 °C', faire: () => setT(40), consigne: T === 40 ? null : `Température : ${T} °C → 40 °C` } },
    { id: 'sol40', titre: 'Solubilité à 40 °C', focus: ['diagramme'],
      texte: <>À 40 °C, la courbe donne la quantité maximale de KNO₃ qui reste dissoute dans 100 g d'eau.</>,
      tache: { type: 'num', q: 'Solubilité de KNO₃ à 40 °C', unite: 'g / 100 g d’eau', vrai: s40, tol: 0.08, affiche: x => fmt(x, 1),
        aide: 'Lecture : repérez 40 °C sur l’axe horizontal, montez jusqu’à la courbe, puis lisez la valeur sur l’axe vertical (la grille a un trait tous les 50 g).',
        bloque: !(modeRef && T === 40) ? 'Gardez le mode « Par refroidissement », 100 g de soluté et T = 40 °C.' : null,
        expl: `Environ ${fmt(s40, 1)} g de KNO₃ restent dissous.`, indice: "Pas de calcul : lisez l’ordonnée de la courbe à 40 °C, en g pour 100 g d’eau." } },
    { id: 'cristaux40', titre: 'Masse de cristaux', focus: ['diagramme', 'bilan'],
      texte: <>Rappel : on a introduit <strong>100 g</strong> de KNO₃ pour 100 g d'eau, et à 40 °C la solubilité lue à l'étape précédente est de <strong>{fmt(s40, 1)} g</strong> pour 100 g d'eau. Une partie du sel reste dissoute (sa masse figure maintenant dans le bilan de matière), le reste cristallise : la longueur du trait rouge du diagramme représente cette masse. Notations : <em>m</em>(introduit) est la masse de KNO₃ introduite, <em>m</em>(dissous) celle qui reste dissoute et <em>m</em>(cristaux) la masse de cristaux, en g.</>,
      tache: { type: 'num', q: 'Masse de cristaux obtenue à 40 °C', unite: 'g', vrai: c40, tol: 0.03, affiche: x => fmt(x, 1),
        calcul: () => [`Hypothèse : l’équilibre est atteint à 40 °C (pas de sursaturation) : la solution contient exactement la solubilité, ${fmt(s40, 1)} g de KNO₃ dissous pour 100 g d’eau.`,
          `m(cristaux) = m(introduit) − m(dissous) = ${fmt(ref.m, 0)} − ${fmt(s40, 1)} = ${fmt(c40, 1)} g.`],
        pieges: [[s40, 'C’est la masse de KNO₃ restée dissoute. Les cristaux sont le reste : 100 g introduits moins la masse dissoute.']],
        bloque: !(modeRef && T === 40) ? 'Gardez le mode « Par refroidissement », 100 g de soluté et T = 40 °C.' : null,
        expl: `m(cristaux) = 100 − ${fmt(s40, 1)} = ${fmt(c40, 1)} g. Vérifiez dans le bilan de matière.`, indice: "Cristaux = masse de sel introduite − masse restée dissoute (la solubilité à 40 °C, pour 100 g d’eau)." } },
    { id: 'tsat', titre: 'Où apparaissent les premiers cristaux ?', focus: ['diagramme', 'params', 'bilan'],
      retenirTitre: 'À RETENIR : BILAN DE MATIÈRE', retenir: <FicheBilan/>,
      texte: <>On part de 100 g de KNO₃ dans 100 g d'eau, à 80 °C : la solution est insaturée. Refroidissez-la progressivement : la composition globale (le point) se déplace horizontalement quand vous changez la température (sa hauteur reste 100 g pour 100 g d'eau). Les premiers cristaux apparaissent quand ce point <strong>rejoint la courbe</strong>.</>,
      tache: { type: 'num', q: 'Température à laquelle les premiers cristaux apparaissent', unite: '°C', vrai: tSat100, tol: 0.05, affiche: x => fmt(x, 0),
        calcul: () => {
          const i = SOLUB.findIndex((q, k) => k < SOLUB.length - 1 && ref.m >= q[1] && ref.m <= SOLUB[k + 1][1]);
          const [ta, sa] = SOLUB[i], [tb, sb] = SOLUB[i + 1];
          return [`La solution est saturée quand sa solubilité est égale à la masse dissoute : ${fmt(ref.m, 0)} g de KNO₃ pour 100 g d’eau.`,
            `Dans le tableau de solubilité, ${fmt(ref.m, 0)} g est encadré par ${fmt(sa, 1)} g à ${ta} °C et ${fmt(sb, 1)} g à ${tb} °C.`,
            `Hypothèse : la courbe est une droite entre deux points tabulés. T = ${ta} + (${tb} − ${ta}) × frac(${fmt(ref.m, 0)} − ${fmt(sa, 1)}|${fmt(sb, 1)} − ${fmt(sa, 1)}) = ${fmt(tSat100, 1)} °C.`,
            `Arrondi : T ≈ ${fmt(tSat100, 0)} °C.`];
        },
        pieges: [[80, 'C’est la température de départ : à 80 °C la solution est encore insaturée (la solubilité y vaut 169 g pour 100 g d’eau). Cherchez la température où la solubilité tombe à 100 g.']],
        bloque: !modeRef ? 'Gardez le mode « Par refroidissement » et 100 g de soluté.' : null,
        expl: `La solution devient saturée quand sa solubilité vaut 100 g / 100 g d'eau, soit vers ${fmt(tSat100, 0)} °C.`, indice: "Les premiers cristaux apparaissent quand la solubilité devient égale à la masse de sel introduite pour 100 g d’eau." } },
    { id: 'rendement', titre: 'Quel rendement de cristallisation ?', focus: ['params', 'bilan'],
      retenirTitre: 'À RETENIR : PREMIERS CRISTAUX', retenir: <FichePremiersCristaux/>,
      texte: <>On refroidit maintenant jusqu'à <strong>20 °C</strong> la solution de 100 g de KNO₃ dans 100 g d'eau. Le <strong>rendement</strong>, noté η, est la proportion du KNO₃ introduit que l'on récupère sous forme de cristaux :
        <Formule><mi>η</mi><mo>=</mo><mfrac><mrow><mi>m</mi><mo>(</mo><mtext>cristaux</mtext><mo>)</mo></mrow><mrow><mi>m</mi><mo>(</mo><mtext>introduit</mtext><mo>)</mo></mrow></mfrac><mo>×</mo><mn>100</mn></Formule></>,
      tache: { type: 'num', q: 'Rendement de la cristallisation à 20 °C', unite: '%', vrai: c20 / ref.m * 100, tol: 0.02, affiche: x => fmt(x, 0),
        calcul: () => [`À 20 °C, la solubilité est ${fmt(s20, 1)} g pour 100 g d’eau : il reste ${fmt(s20, 1)} g de KNO₃ dissous (hypothèse : équilibre atteint, 100 g d’eau).`,
          `m(cristaux) = m(introduit) − m(dissous) = ${fmt(ref.m, 0)} − ${fmt(s20, 1)} = ${fmt(c20, 1)} g.`,
          `η = frac(m(cristaux)|m(introduit)) × 100 = frac(${fmt(c20, 1)}|${fmt(ref.m, 0)}) × 100 = ${fmt(c20 / ref.m * 100, 1)} %, soit ${fmt(c20 / ref.m * 100, 0)} %.`],
        pieges: [[s20, 'C’est la masse de KNO₃ restée dissoute à 20 °C, pas celle qui a cristallisé : le rendement concerne les cristaux.'],
          [c20 / ref.m, 'Le rendement est demandé en % : multipliez le rapport m(cristaux) / m(introduit) par 100.']],
        bloque: !(modeRef && T === 20) ? 'Réglez T = 20 °C (mode « Par refroidissement », 100 g de soluté).' : null,
        expl: `m(cristaux) = 100 − ${fmt(s20, 1)} = ${fmt(c20, 1)} g, soit ${fmt(c20, 1)} % du sel introduit. Même à 0 °C, on ne récupère jamais tout : ${fmt(solubilite(0), 1)} g restent dissous.`, indice: "Rendement = masse de cristaux ÷ masse introduite × 100 : η = frac(m(cristaux)|m(introduit)) × 100." } },
    { id: 'evap', titre: 'Cristalliser par évaporation', focus: ['mode', 'params'],
      retenirTitre: 'À RETENIR : RENDEMENT', retenir: <FicheRendement/>,
      texte: <>Autre procédé : on garde la température constante et on <strong>évapore l'eau</strong> sous <strong>pression réduite</strong> : une pompe à vide abaisse la pression au-dessus de la solution, et l’eau s’évapore (elle bout) à 60 °C au lieu de 100 °C, sans chauffer davantage. Le manomètre du schéma indique cette pression. On part de 50 g de KNO₃ dans 100 g d'eau, à 60 °C.</>,
      tache: { type: 'action', ok: modeEv, label: 'Passer en évaporation (60 °C, 50 g)', faire: () => { setTypeCr('evaporation'); setT(60); setMSolute(50); setMEau(100); },
        consigne: modeEv ? null : 'Mode « Par évaporation », T = 60 °C, soluté 50 g' } },
    { id: 'concentrer', titre: 'Évaporer concentre la solution', focus: ['params', 'bilan'],
      texte: <>On part toujours de 50 g de KNO₃ dans 100 g d'eau, à 60 °C. Avec le curseur, réduisez la masse d'eau restante à <strong>70 g</strong> et regardez, dans le bilan de matière, la masse de sel dissoute et la concentration de la solution (en g de sel pour 100 g d'eau).</>,
      tache: { type: 'qcm', q: 'Quand on évapore de l’eau, avant l’apparition de cristaux…', options: ['la masse de sel reste la même : la solution se concentre', 'la masse de sel diminue : la solution se dilue davantage', 'la masse de sel augmente : la solution se concentre aussi'], bonne: 0,
        expl: 'Le sel ne s’évapore pas : sa masse ne change pas, mais elle est dissoute dans moins d’eau. La concentration augmente jusqu’à la saturation ; au-delà, le sel en excès cristallise.', indice: "Qu’est-ce qui s’en va pendant l’évaporation : le sel ou l’eau ?" } },
    { id: 'eausat', titre: 'Jusqu’où évaporer ?', focus: ['params', 'diagramme', 'bilan'],
      texte: <>À 60 °C, 100 g d'eau dissolvent au plus {fmt(sEv, 0)} g de KNO₃. En évaporant, on diminue la masse d'eau : la solution devient saturée quand les 50 g de sel sont <strong>la masse maximale</strong> que l'eau restante peut dissoudre. Calculez cette masse d'eau (produit en croix), puis vérifiez avec le curseur.</>,
      tache: { type: 'num', q: 'Masse d’eau restante à laquelle la solution devient saturée', unite: 'g', vrai: eauSat, tol: 0.03, affiche: x => fmt(x, 1),
        calcul: () => [`À 60 °C : ${fmt(sEv, 0)} g de KNO₃ se dissolvent au maximum dans 100 g d’eau (solubilité, lue sur la courbe).`,
          `À saturation, les 50 g de sel sont le maximum que dissout m(eau) : frac(50|m(eau)) = frac(${fmt(sEv, 0)}|100), donc m(eau) = frac(50 × 100|${fmt(sEv, 0)}) = ${fmt(eauSat, 1)} g (la solution est saturée à ce moment-là, et pas avant).`],
        pieges: [[50 * sEv / 100, 'Produit en croix à l’envers : la masse d’eau cherchée est (masse de sel × 100 g d’eau) divisée par la solubilité, et non multipliée par elle.']],
        bloque: !modeEv ? 'Gardez le mode « Par évaporation », T = 60 °C et 50 g de soluté.' : null,
        expl: `${fmt(sEv, 0)} g de sel pour 100 g d'eau, donc 50 g de sel pour m(eau) : m(eau) = 50 × 100 / ${fmt(sEv, 0)} ≈ ${fmt(eauSat, 1)} g.`, indice: "À saturation : frac(masse de sel|masse d’eau) = frac(solubilité|100 g). Isolez la masse d’eau." } },
    { id: 'eau20', titre: 'Évaporer davantage', focus: ['params', 'bilan'],
      retenirTitre: 'À RETENIR : ÉVAPORATION', retenir: <FicheEvaporation/>,
      texte: <>On continue d'évaporer jusqu'à ce qu'il ne reste que <strong>20 g d'eau</strong>, toujours à 60 °C. Les 50 g de KNO₃ sont toujours là, et 100 g d'eau n'en dissolvent que {fmt(sEv, 0)} g à cette température. Réglez 20 g avec le curseur et lisez la masse de cristaux dans le bilan de matière.</>,
      tache: { type: 'num', q: 'Masse de cristaux obtenue avec 20 g d’eau restants', unite: 'g', vrai: cEv20, tol: 0.03, affiche: x => fmt(x, 1),
        calcul: () => [`Avec 20 g d’eau à 60 °C, la solution saturée dissout au maximum ${fmt(sEv, 0)} × frac(20|100) = ${fmt(sEv * 0.2, 1)} g de KNO₃ (hypothèse : équilibre atteint).`,
          `m(cristaux) = m(introduit) − m(dissous) = 50 − ${fmt(sEv * 0.2, 1)} = ${fmt(cEv20, 1)} g.`],
        pieges: [[sEv * 0.2, 'C’est la masse de KNO₃ qui reste dissoute dans les 20 g d’eau. Les cristaux, c’est le reste : 50 g moins cette masse.']],
        bloque: !(modeEv && mEau === 20) ? 'Réglez la masse d’eau restante à 20 g (mode « Par évaporation », T = 60 °C, 50 g de soluté).' : null,
        expl: `Contrôle par le calcul : la solution saturée garde ${fmt(sEv, 0)} × 20 / 100 = ${fmt(sEv * 0.2, 0)} g de sel dissous, donc ${fmt(cEv20, 0)} g de cristaux (50 − ${fmt(sEv * 0.2, 0)}).`, indice: "Avec 20 g d’eau, quelle masse de sel peut rester dissoute (proportionnalité avec la solubilité) ? Le reste cristallise." } },
    { id: 'choix', titre: 'Quel procédé choisir ?', focus: ['diagramme'],
      texte: <>Pour le chlorure de sodium NaCl, la solubilité varie très peu avec la température : environ 36 g pour 100 g d'eau à 20 °C et 39 g à 100 °C.</>,
      tache: { type: 'qcm', q: 'Pour récupérer NaCl dissous dans l’eau, quel procédé est le plus efficace ?', options: ['L’évaporation de l’eau, car le refroidissement ne fait presque rien cristalliser', 'Le refroidissement, comme pour KNO₃', 'Les deux sont également efficaces'], bonne: 0,
        expl: 'Quand la courbe de solubilité est presque horizontale, refroidir ne diminue presque pas la quantité de sel dissous. Il faut retirer de l’eau, comme dans les marais salants.', indice: "Regardez la courbe de NaCl : varie-t-elle beaucoup avec la température ?" } },
    { id: 'hypotheses', titre: 'Sur quoi repose ce modèle ?', focus: ['hypo'],
      retenirTitre: 'À RETENIR : QUEL PROCÉDÉ ?', retenir: <FicheProcede/>,
      texte: <>Lisez l'encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Quelle hypothèse est faite sur la solution ?', options: ['À chaque température, l’équilibre est atteint : dès que la solution est saturée, l’excès cristallise (pas de sursaturation)', 'Les cristaux obtenus contiennent de l’eau', 'La solubilité de KNO₃ ne dépend pas de la température'], bonne: 0,
        expl: 'Dans la réalité, une solution peut rester sursaturée (métastable) tant qu’aucun germe cristallin ne se forme ; le modèle ne le décrit pas.', indice: "Pensez au temps laissé à la solution et au risque de sursaturation." } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez lire un diagramme de solubilité, trouver la température d'apparition des cristaux et calculer la masse obtenue par refroidissement ou par évaporation. En exploration libre, changez la masse de sel ou la température pour d'autres cas.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const passe = id => !enGuide || etape > idx(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const bilanVisible = passe('cristaux40');            // masse cristallisée et répartition
  const dissVisible = passe('sol40');                  // masse dissoute, concentration, solubilité (dès l'étape de calcul des cristaux)
  // Parcours guidé : chaque élément apparaît à l'étape qui l'introduit, puis reste affiché (le bécher est là dès le début).
  // En exploration libre et en défi, tout est accessible.
  const iEtape = Math.min(etape, ETAPES.length - 1);
  const depuis = id => !enGuide || iEtape >= idx(id);
  const vis = { diagramme: depuis('lecture'), params: depuis('sens'), bilan: depuis('cristaux40'), mode: depuis('evap'), masseSel: depuis('evap'), hypo: depuis('hypotheses') };


  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    let d;
    if (Math.random() < 0.5) {
      const Tf = tire([10, 20, 30, 40]);
      const m = tire([50, 60, 80, 100, 120, 150].filter(x => x > solubilite(Tf) + 10));
      d = { type: 'refroidissement', m, Tf };
    } else {
      const Tv = tire([40, 50, 60, 70, 80]);
      const m = tire([30, 40, 50, 60]);
      const eSat = m / solubilite(Tv) * 100;
      const ef = tire([10, 15, 20, 25, 30].filter(x => x < eSat - 3));
      d = { type: 'evaporation', m, Tv, ef };
    }
    setDefi({ ...d, reps: {}, verifie: false });
  }
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi();
    if (m === 'guide') { setTypeCr('refroidissement'); setT(80); setMEau(100); setMSolute(100); }
  }
  const voletDefi = defi && (() => {
    let Q, enonce, regler;
    if (defi.type === 'refroidissement') {
      const s = solubilite(defi.Tf), c = defi.m - s, ts = tempDeSolub(defi.m);
      enonce = <>On dissout <strong>{defi.m} g</strong> de KNO₃ dans 100 g d'eau, à chaud (solution insaturée), puis on refroidit jusqu'à <strong>{defi.Tf} °C</strong>.</>;
      Q = [
        { id: 's', q: `Solubilité de KNO₃ à ${defi.Tf} °C (à lire sur le diagramme)`, unite: 'g / 100 g d’eau', vrai: s, tol: 0.10, aff: fmt(s, 1) },
        { id: 'd', q: `Masse de KNO₃ restant dissoute à ${defi.Tf} °C`, unite: 'g', vrai: s, tol: 0.05, aff: fmt(s, 1) },
        { id: 'c', q: 'Masse de cristaux obtenue', unite: 'g', vrai: c, tol: 0.05, aff: fmt(c, 1) },
        { id: 'r', q: 'Rendement de la cristallisation (cristaux / sel introduit)', unite: '%', vrai: c / defi.m * 100, tol: 0.05, aff: fmt(c / defi.m * 100, 0) },
        { id: 't', q: 'Température à laquelle les premiers cristaux apparaissent', unite: '°C', vrai: ts, tol: 0.05, aff: fmt(ts, 0) },
      ];
      regler = () => { setTypeCr('refroidissement'); setMSolute(defi.m); setT(defi.Tf); setMEau(100); };
    } else {
      const s = solubilite(defi.Tv), eSat = defi.m / s * 100, dis = s * defi.ef / 100, c = defi.m - dis;
      enonce = <>On évapore l'eau d'une solution de <strong>{defi.m} g</strong> de KNO₃ dans 100 g d'eau, maintenue à <strong>{defi.Tv} °C</strong>, jusqu'à ce qu'il ne reste que <strong>{defi.ef} g d'eau</strong>.</>;
      Q = [
        { id: 's', q: `Solubilité de KNO₃ à ${defi.Tv} °C (à lire sur le diagramme)`, unite: 'g / 100 g d’eau', vrai: s, tol: 0.10, aff: fmt(s, 1) },
        { id: 'e', q: 'Masse d’eau restante à laquelle apparaissent les premiers cristaux', unite: 'g', vrai: eSat, tol: 0.05, aff: fmt(eSat, 1) },
        { id: 'd', q: `Masse de KNO₃ dissoute dans les ${defi.ef} g d’eau restants`, unite: 'g', vrai: dis, tol: 0.05, aff: fmt(dis, 1) },
        { id: 'c', q: 'Masse de cristaux obtenue', unite: 'g', vrai: c, tol: 0.05, aff: fmt(c, 1) },
        { id: 'r', q: 'Proportion du sel introduit qui a cristallisé', unite: '%', vrai: c / defi.m * 100, tol: 0.05, aff: fmt(c / defi.m * 100, 0) },
      ];
      regler = () => { setTypeCr('evaporation'); setMSolute(defi.m); setT(defi.Tv); setMEau(defi.ef); };
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          {enonce}
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Rappel : m(cristaux) = m(sel introduit) − m(sel dissous), la solution restante étant saturée.</div>
          <button onClick={() => { regler(); setMode('explore'); }}
            style={{ ...stylePetitBouton(false, '#334155'), marginTop: 6 }}><Pic n="search"/>Régler l’exploration sur ces valeurs</button>
        </div>
        {Q.map((qu, k) => {
          const rep = defi.reps[qu.id] || '', ok = proche(lireNombre(rep), qu.vrai, qu.tol);
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(qu.q)}</div>
              {INDICE_Q[qu.id] && <IndiceDefi cache={defi.verifie && ok}>{INDICE_Q[qu.id]}</IndiceDefi>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [qu.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{qu.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {qu.aff} {qu.unite}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { noterDefi(Q.every(qu => proche(lireNombre(defi.reps[qu.id] || ''), qu.vrai, qu.tol))); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div>
      </div>
    );
  })();

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Solubilité</strong> : valeurs tabulées de KNO₃ dans l'eau pure tous les 10 °C, avec une interpolation linéaire entre deux valeurs (les lectures graphiques sont donc approchées). Pas d'impuretés ni d'autres ions en solution.</li>
      <li><strong>Équilibre</strong> : à chaque température, l'équilibre est atteint. Dès que la solution est saturée, l'excès cristallise aussitôt : on ignore la sursaturation (solution métastable) et la cinétique de cristallisation.</li>
      <li><strong>Cristaux</strong> : KNO₃ pur et anhydre. Les cristaux ne retiennent pas de solution (pas d'eau-mère), et la masse récupérée est supposée entièrement séparée du liquide.</li>
      <li><strong>Pression</strong> : l'évaporation à température constante (inférieure à 100 °C) se fait sous pression réduite ; la pression indiquée par le manomètre est la pression de vapeur saturante de l'eau à la température choisie (tables de vapeur d'eau, valeurs arrondies, interpolation linéaire tous les 10 °C).</li>
      <li><strong>Pression</strong> : l'évaporation à température constante inférieure à 100 °C se fait sous pression réduite ; la pression du manomètre est la pression de vapeur saturante de l'eau à la température choisie (tables de vapeur d'eau, valeurs arrondies, interpolation linéaire tous les 10 °C).</li>
      <li><strong>Masses</strong> : le sel est exprimé en g pour 100 g d'eau de départ. En refroidissement, la masse d'eau reste égale à 100 g. En évaporation, la température est constante, seule l'eau s'évapore (KNO₃ n'est pas volatil) et il en reste la masse indiquée.</li>
      <li><strong>Diagramme</strong> : le point représente la composition globale (tout le sel introduit, pour 100 g de l'eau restante) ; en présence de cristaux, le point de la solution saturée est sur la courbe et l'écart vertical représente la masse de cristaux.</li>
    </ul>
  );
  const panneauHypo = (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>
  );
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défi</button>
    </span>
  );

  // En évaporation, la masse dissoute et la masse de cristaux sont masquées sous la saturation jusqu'à l'étape qui les fait calculer
  const evapMasque = enGuide && typeCr === 'evaporation' && !passe('eau20') && sature;
  const bil = (v, f) => (bilanVisible && !evapMasque) ? f(v) : '?';

  // balayage animé : refroidir de 90 °C à 0 °C, ou évaporer l'eau de 100 g à 10 g (le réglage correspondant suit l'animation)
  const arreter = () => { cancelAnimationFrame(raf.current); setEnCours(false); };
  const lancer = () => {
    cancelAnimationFrame(raf.current); setEnCours(true);
    const t0 = performance.now(), evap = typeCr === 'evaporation';
    const pas = now => { const p = Math.min(1, (now - t0) / 7000); if (evap) setMEau(Math.round(100 - p * 90)); else setT(Math.round(90 - p * 90)); if (p < 1) raf.current = requestAnimationFrame(pas); else setEnCours(false); };
    raf.current = requestAnimationFrame(pas);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const champ = { display: 'flex', flexDirection: 'column', gap: 4 }, etiq = { fontSize: 14, fontWeight: 600, color: KIT.txt }, aideC = { fontSize: 12.5, color: KIT.txt2, lineHeight: 1.4 };
  const champIn = { font: 'inherit', fontSize: 16, padding: '8px 10px', minHeight: 44, borderRadius: 10, border: `1.5px solid ${KIT.bord}`, width: '100%', boxSizing: 'border-box' };

  const exploration = (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>

      {/* Choix du mode */}
      {vis.mode && <div style={{...styleBoite, ...cadre('mode')}}>
        <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Mode de cristallisation</div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          <TabBtn active={typeCr==="refroidissement"} color="#0096c7"
            onClick={()=>setTypeCr("refroidissement")}>
            🧊 Par refroidissement
          </TabBtn>
          <TabBtn active={typeCr==="evaporation"} color="#e9a824"
            onClick={()=>setTypeCr("evaporation")}>
            💨 Par évaporation
          </TabBtn>
        </div>
        <div style={{fontSize:12.5, color:"#556", marginTop:6}}>Refroidir : la température baisse. Évaporer : la température est fixe, l’eau diminue.</div>
      </div>}

      {/* Scène animée : bécher (toujours) + diagramme de solubilité (dès l'étape qui l'introduit) */}
      <div style={{ ...styleBoite, ...cadre('becher'), ...cadre('diagramme'), padding: 6 }}>
        <SceneCristal T={T} setT={setT} mSolute={mSolute} mEau={mEauEff} evap={typeCr === 'evaporation'} graphe={vis.diagramme} lancer={lancer} arreter={arreter} enCours={enCours}
          ecart={passe('cristaux40')} lecture={!enGuide} touche={touche} setTouche={setTouche}/>
      </div>

      {/* Réglages + bilan de matière */}
      {vis.params && <div style={{ ...styleBoite, ...cadre('params') }}>
        <div style={{ fontWeight: 700, color: KIT.txt, marginBottom: 8, fontSize: 15 }}>Réglages</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
          {vis.masseSel && <label style={champ}><span style={etiq}>Masse de sel pour 100 g d’eau</span>
            <input type="number" style={champIn} step="5" min="5" max="200" value={mSolute} onChange={e => { arreter(); setMSolute(Math.max(0, parseFloat(e.target.value) || 0)); }}/>
            <span style={aideC}>Quantité de KNO₃ dissoute au départ (en g).</span></label>}
          {typeCr === 'refroidissement' && <label style={champ}><span style={etiq}>Température : <strong style={{ color: '#0369a1' }}>{T} °C</strong></span>
            <input type="range" min="0" max="100" step="1" value={T} onChange={e => { arreter(); setTouche(true); setT(parseFloat(e.target.value)); }} style={{ accentColor: '#0369a1', width: '100%', minHeight: 32 }}/>
            <span style={aideC}>Fait aussi bouger la poignée rouge du diagramme.</span></label>}
          {typeCr === 'evaporation' && <>
            <label style={champ}><span style={etiq}>Température (fixe, en °C)</span>
              <input type="number" style={champIn} step="5" min="0" max="100" value={T} onChange={e => { arreter(); setT(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))); }}/>
              <span style={aideC}>La solution est maintenue à cette température.</span></label>
            <label style={champ}><span style={etiq}>Eau restante : <strong style={{ color: '#b45309' }}>{mEau} g</strong></span>
              <input type="range" min="10" max="100" step="1" value={mEau} onChange={e => { arreter(); setMEau(parseFloat(e.target.value)); }} style={{ accentColor: '#b45309', width: '100%', minHeight: 32 }}/>
              <span style={aideC}>Part de 100 g : l’eau s’évapore, le sel reste.</span></label>
          </>}
        </div>
      </div>}

      {vis.bilan && <div style={{ ...styleBoite, ...cadre('bilan') }}>
        <div style={{ fontWeight: 700, color: KIT.txt, fontSize: 15 }}>Bilan de matière</div>
        <Chips items={[['Sel total', `${mSolute} g`, '#334155'], ['Dissous', dissVisible && !evapMasque ? `${mDissoute.toFixed(1)} g` : '?', '#0e7490'], ['Cristaux', bil(mCristaux, x => x.toFixed(1) + ' g'), '#b45309'],
          [`s à ${T} °C`, dissVisible ? `${fmt(sT, 1)} g` : '?', '#0e7490'], ['Solution', dissVisible ? `${fmt(conc, 1)} g / 100 g` : '?', '#334155']]}/>
        <div role="status" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: sature ? '#fff7ed' : '#f0fdf4', border: `1.5px solid ${sature ? '#ea580c' : '#16a34a'}`, fontSize: 14, fontWeight: 700, color: sature ? '#c2410c' : '#15803d' }}>
          {sature ? '⚠ Solution saturée : les cristaux se déposent' : '✓ Solution insaturée : tout le sel est dissous'}
        </div>
        {bilanVisible && !evapMasque && <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Répartition du sel :</div>
          <div style={{ background: '#e2e8f0', borderRadius: 10, height: 28, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${fracDiss * 100}%`, background: '#0e7490', transition: 'width 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}>{fracDiss > 0.2 ? `${mDissoute.toFixed(0)} g dissous` : ''}</div>
            <div style={{ width: `${(1 - fracDiss) * 100}%`, background: '#b45309', transition: 'width 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}>{mCristaux > 0 && 1 - fracDiss > 0.2 ? `${mCristaux.toFixed(0)} g cristaux` : ''}</div>
          </div>
        </div>}
      </div>}
    </div>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cr-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 960px) { .cr-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Évaporation et cristallisation du nitrate de potassium</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`cr-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}><>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></></div> : exploration}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && (
        <div className="cr-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Avec 100 g de sel, refroidissez depuis 80 °C : à quelle température les premiers cristaux apparaissent-ils ?</li>
              <li>Comparez la masse de cristaux à 20 °C et à 0 °C. Peut-on tout récupérer par refroidissement ?</li>
              <li>Passez en évaporation à 60 °C : jusqu'à quelle masse d'eau la solution reste-t-elle insaturée ?</li>
              <li>Augmentez la masse de soluté : la température d'apparition des cristaux change-t-elle ?</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      )}
      {mode === 'guide' && vis.hypo && panneauHypo}
    </div>
  );
}
