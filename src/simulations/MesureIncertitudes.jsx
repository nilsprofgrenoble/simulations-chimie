import { useState, useRef, useLayoutEffect } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./mesureModele";
import { QCM } from "./mesureQcm";
import { SvgHisto, SvgChronos, SvgBanc, SvgEprouvette, SvgCarteHisto, SvgCarteDispersion, SvgCarteTypeA, SvgCarteSysteme, SvgCarteTypeB, SvgCarteResultat } from "./mesureSchemas";

const SIM_ID = 161, CLE_GUIDE = 'mesure-incertitudes-1g-guide-v1';
declarerDefis(SIM_ID, [['A', 'Incertitude-type de type A d’une série de mesures'], ['B', 'Incertitude-type de type B d’un intervalle de netteté']]);

// ====================================================
//  SIM 161 — MESURE ET INCERTITUDES (1G spé PC, partie « Mesure et incertitudes » du programme)
//  Une seule idée : une mesure varie ; on décrit une série (histogramme, moyenne, écart-type), on évalue l'incertitude-type de la moyenne
//  (type A : s/√N) ou d'une mesure unique (type B : a/√3), on écrit le résultat et on le compare à une référence, sans critère chiffré.
//  Parcours (13 étapes) : variabilité, histogramme, moyenne, dispersion, instrument/protocole, type A, effet de N, erreur systématique,
//  type B (demi-largeur puis incertitude), écriture du résultat, comparaison, choix du type. Le modèle est dans mesureModele.js (testé).
//  Capacités visées (jamais affichées à l'élève) : exploiter une série de mesures indépendantes (histogramme, moyenne, écart-type) ;
//  discuter de l'influence de l'instrument et du protocole ; définir qualitativement l'incertitude-type ; évaluer une incertitude-type
//  de type A (s/√N) et de type B (mesure unique, instrument de caractéristiques données) ; écrire le résultat avec un nombre adapté de
//  chiffres significatifs ; comparer qualitativement à une valeur de référence.
//  Hors programme de 1G, volontairement absents : z-score, incertitudes composées, loi de propagation, incertitude élargie.
// ====================================================

const NB = '\u00a0';
const COLS = { ...M.COL, violet: '#6d28d9' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const f2 = x => { if (!(x > 0)) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); return M.fmt(x, Math.max(0, 1 - e)); };   // 2 chiffres significatifs
const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c}/>;

// ---------- formules (MathML) ----------
const FMoy = <Formule><mover><mi>x</mi><mo>¯</mo></mover><mo>=</mo><mfrac><mrow><msub><mi>x</mi><mn>1</mn></msub><mo>+</mo><msub><mi>x</mi><mn>2</mn></msub><mo>+</mo><mo>…</mo><mo>+</mo><msub><mi>x</mi><mi>N</mi></msub></mrow><mi>N</mi></mfrac></Formule>;
const FS = <Formule compact={<>s : touche σₙ₋₁ (ou s) de la calculatrice</>}><mi>s</mi><mo>=</mo><msqrt><mfrac><mrow><mo>∑</mo><msup><mrow><mo>(</mo><msub><mi>x</mi><mi>i</mi></msub><mo>−</mo><mover><mi>x</mi><mo>¯</mo></mover><mo>)</mo></mrow><mn>2</mn></msup></mrow><mrow><mi>N</mi><mo>−</mo><mn>1</mn></mrow></mfrac></msqrt></Formule>;
const FUA = <Formule><mi>u</mi><mo>=</mo><mfrac><mi>s</mi><msqrt><mi>N</mi></msqrt></mfrac></Formule>;
const FUB = <Formule><mi>u</mi><mo>=</mo><mfrac><mi>a</mi><msqrt><mn>3</mn></msqrt></mfrac></Formule>;
const FRES = <Formule><mi>x</mi><mo>=</mo><mover><mi>x</mi><mo>¯</mo></mover><mo>±</mo><mi>u</mi></Formule>;
const FECART = <Formule><mtext>écart</mtext><mo>=</mo><mover><mi>x</mi><mo>¯</mo></mover><mo>−</mo><msub><mi>x</mi><mtext>réf</mtext></msub></Formule>;

// Carte « À retenir » repliée par défaut sur téléphone (dans la carte du parcours) : elle ne masque plus la consigne ni la scène.
function Repliable({ children }) {
  const ref = useRef(null);
  const [etat, setEtat] = useState({ dans: false, ouvert: true });
  useLayoutEffect(() => {
    const dans = !!(ref.current && ref.current.closest('[data-carte-parcours]') && !ref.current.closest('[aria-hidden="true"]'));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- le DOM (carte du parcours ou fiche) n'est connu qu'après le montage
    if (dans) setEtat({ dans: true, ouvert: false });
  }, []);
  return (
    <div ref={ref}>
      {etat.dans && <button onClick={() => setEtat(e => ({ ...e, ouvert: !e.ouvert }))} aria-expanded={etat.ouvert}
        style={{ ...stylePetitBouton(!etat.ouvert, '#0369a1'), minHeight: 40, margin: '4px 0' }}>{etat.ouvert ? 'Replier la carte ▴' : 'Afficher la carte « À retenir » : schéma et points ▾'}</button>}
      <div inert={!etat.ouvert} aria-hidden={!etat.ouvert} style={etat.ouvert ? undefined : { maxHeight: 0, overflow: 'hidden' }}>{children}</div>
    </div>);
}

// données fixes du parcours
const SIT_C = M.SITUATIONS.chrono, SIT_B = M.SITUATIONS.balance, SIT_F = M.SITUATIONS.focale;
const SERIES2 = M.deuxSeries();
const SERIE_SYST = M.tirerSerie(SIT_B, 10, 3, true);
const HISTO_20 = M.histogramme(SIT_C, M.SERIE_HISTO, 0.05);
const NB_CLASSE = HISTO_20.classes.find(c => Math.abs(c.centre - 14.2) < 1e-6).n;       // mesures de la classe centrée sur 14,20 s
const MOY5 = M.moyenne(M.SERIE_COURTE), S5 = 0.099, UA5 = M.incertitudeA(S5, 5);
const A_FOC = M.demiLargeur(147, 159), UB_FOC = M.incertitudeB(A_FOC);
const RES_FOC = M.resultat(153, UB_FOC, 'mm');

// ====================================================
export function SimulationMesureIncertitudes() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('A');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ex, setEx] = useState({ sit: 'chrono', N: 10, biais: false, graine: 1, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['variab', 'histo', 'moy', 'disp', 'protocole', 'typeA', 'effetN', 'syst', 'a', 'uB', 'ecrire', 'comparer', 'choisir'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);

  const ETAPES = [
    { id: 'variab', titre: 'Deux mesures de la même durée', focus: ['scene'],
      texte: <>Pour mesurer la durée de <strong>10 oscillations</strong> d’un pendule, un élève lance puis arrête un chronomètre <strong>à la main</strong>. Il fait deux essais, l’un après l’autre, dans les mêmes conditions.</>,
      tache: { type: 'qcm', ...QCM.variab } },
    { id: 'histo', titre: 'Beaucoup de mesures', focus: ['scene'],
      texte: <>On refait <strong>20 mesures</strong> de cette durée, dans les mêmes conditions. On les range dans un <strong>histogramme</strong> : chaque barre est une <strong>classe</strong> de valeurs (ici de largeur 0,05{NB}s) et sa hauteur est le nombre de mesures dont la valeur est dans cette classe. Les séries de cette simulation sont <strong>simulées</strong> avec un modèle en cloche (loi normale) : une série réelle peut s’en écarter.</>,
      tache: { type: 'num', q: 'Combien de mesures sont dans la classe centrée sur 14,20 s (de 14,175 s à 14,225 s) ?', carnet: false, unite: 'mesures', vrai: NB_CLASSE, tol: 0, affiche: v => String(v),
        calcul: () => ['La classe centrée sur 14,20 s est la barre située au-dessus de la graduation 14,20.', `La hauteur de cette barre se lit sur l’axe vertical : ${NB_CLASSE} mesures.`],
        pieges: [[20, '20 est le nombre total de mesures : il faut lire la hauteur d’une seule barre.'], [1, 'Lisez la hauteur de la barre centrée sur 14,20 : elle se lit sur l’axe vertical.']],
        expl: `La barre centrée sur 14,20 s atteint la graduation ${NB_CLASSE} : ${NB_CLASSE} mesures sur 20 ont une valeur comprise entre 14,175 s et 14,225 s.`, indice: 'Repérez la graduation 14,20 sous l’axe horizontal, montez jusqu’au sommet de la barre, puis lisez la hauteur sur l’axe vertical.' } },
    { id: 'moy', titre: 'Une série de mesures', focus: ['scene'],
      texte: <>On refait 5 mesures de la même durée (valeurs affichées à l’écran). On les suppose <strong>indépendantes</strong> : faites dans les mêmes conditions, chacune sans influencer la suivante. La <strong>valeur moyenne</strong> est la meilleure estimation de la durée.{FMoy}Calculez la valeur moyenne de ces N = 5 mesures.</>,
      tache: { type: 'num', q: 'Valeur moyenne de la durée de 10 oscillations', carnet: 'Moyenne des 5 mesures', unite: 's', vrai: MOY5, tol: 0.0005, affiche: v => M.fmt(v, 2), cs: 4,
        calcul: () => ['Somme : 14,28 + 14,11 + 14,35 + 14,19 + 14,32 = 71,25 s.', 'Moyenne : 71,25 ÷ 5 = 14,25 s (on garde le centième, comme les mesures ; 14,3 s serait un arrondi trop tôt).'],
        pieges: [[71.25, 'C’est la somme des mesures : il faut la diviser par le nombre de mesures N = 5.'], [14.28, 'Ce n’est que la première mesure : la moyenne utilise les cinq valeurs.']],
        expl: 'x̄ = (14,28 + 14,11 + 14,35 + 14,19 + 14,32) / 5 = 71,25 / 5 = 14,25 s.', indice: 'Additionnez les 5 valeurs, puis divisez par le nombre de valeurs.' } },
    { id: 'disp', titre: 'Deux séries à comparer', focus: ['scene'],
      retenirTitre: 'À RETENIR : HISTOGRAMME ET MOYENNE',
      retenir: <Repliable key="cA">
        <SvgCarteHisto/>
        {FMoy}
        <ul style={liste}>
          <li><strong>Une mesure varie ; une série forme un histogramme</strong> : les valeurs se groupent autour d’une valeur centrale.</li>
          <li>Exemple de la simulation : 14,28 ; 14,11 ; 14,35 ; 14,19 ; 14,32 s donnent x̄ = 14,25 s.</li>
          <li><strong>Idée fausse</strong> : « la moyenne est la vraie valeur ». <strong>Vrai</strong> : c’est une estimation, meilleure qu’une seule mesure, mais elle garde une incertitude.</li>
        </ul></Repliable>,
      texte: <>Deux élèves ont chacun fait 20 mesures de la même durée avec le même pendule. Leurs deux séries ont des moyennes voisines. L’<strong>écart-type</strong> <em>s</em> de chaque série mesure à quel point les mesures s’étalent autour de leur moyenne.</>,
      tache: { type: 'qcm', ...QCM.disp } },
    { id: 'protocole', titre: 'Réduire la dispersion', focus: ['scene'],
      retenirTitre: 'À RETENIR : L’ÉCART-TYPE s',
      retenir: <Repliable key="cB">
        <SvgCarteDispersion/>
        {FS}
        <ul style={liste}>
          <li><strong>s petit : mesures resserrées ; s grand : mesures étalées.</strong> s décrit la dispersion d’UNE mesure (la calculatrice le donne en mode statistiques).</li>
          <li>Exemple de la simulation : deux séries de 20 mesures de 14,2 s environ, l’une avec s ≈ 0,03 s, l’autre avec s ≈ 0,16 s.</li>
          <li><strong>Piège</strong> : s ne dépend presque pas du nombre de mesures ; il dépend de l’instrument et du protocole.</li>
        </ul></Repliable>,
      texte: <>La dispersion dépend de l’<strong>instrument</strong> et du <strong>protocole</strong> (la façon de faire la mesure). Ici, le chronomètre affiche le centième de seconde, mais l’opérateur le lance et l’arrête à la main, comme à l’étape 1.</>,
      tache: { type: 'qcm', ...QCM.protocole } },
    { id: 'typeA', titre: 'Une incertitude à calculer', focus: ['scene'],
      texte: <>Pour les 5 mesures de l’étape 3, de moyenne <strong>x̄ = 14,25{NB}s</strong>, la calculatrice donne l’écart-type expérimental <strong>s = 0,099{NB}s</strong>. L’<strong>incertitude-type</strong> <em>u</em> mesure la dispersion des valeurs que l’on peut raisonnablement attribuer à la grandeur : plus u est petite, mieux la grandeur est connue. Quand on évalue u à partir d’une série de N mesures indépendantes (<strong>type A</strong>), on utilise :{FUA}On suppose la dispersion à peu près symétrique autour de la moyenne. Calculez u pour N = 5.</>,
      tache: { type: 'num', q: 'Incertitude-type de type A de la moyenne', carnet: 'Incertitude-type u (type A)', unite: 's', vrai: UA5, tol: 0.03, affiche: v => M.fmt(v, 3), cs: 2,
        calcul: () => ['N = 5, donc √N = √5 ≈ 2,236.', 'u = s / √N = 0,099 s ÷ 2,236 = 0,044 s (2 chiffres significatifs, comme s).'],
        pieges: [[S5 / 5, 'On divise par la racine carrée de N, pas par N : u = s / √N.'], [S5 * Math.sqrt(5), 'On divise s par √N, on ne le multiplie pas : u est plus petite que s.'], [S5, 'u n’est pas égale à s : s décrit UNE mesure, u décrit la moyenne de N mesures.']],
        expl: 'u = s / √N = 0,099 / √5 = 0,044 s : la moyenne est mieux connue qu’une mesure isolée (s = 0,099 s).', indice: 'u = s / √N : calculez d’abord √5 à la calculatrice, puis divisez s par ce nombre.' } },
    { id: 'effetN', titre: 'Faire plus de mesures', focus: ['scene'],
      texte: <>Avec le même chronomètre et le même opérateur, s reste voisin de <strong>0,10{NB}s</strong>, quel que soit le nombre de mesures. Un élève passe de <strong>N = 4</strong> à <strong>N = 16</strong> mesures. Dans u = s / √N, que devient u ?</>,
      tache: { type: 'num', q: 'Par quel nombre u est-elle divisée ?', carnet: false, unite: '(sans unité)', vrai: 2, tol: 0, affiche: v => String(v),
        calcul: () => ['N = 4 : u = s / √4 = s / 2. N = 16 : u = s / √16 = s / 4.', 'u passe de s / 2 à s / 4 : elle est divisée par 2 (et non par 4).'],
        pieges: [[4, 'Le nombre de mesures est multiplié par 4, mais u est divisée par √4 : ce n’est pas 4.'], [0.5, 'Ce nombre est l’inverse : u est divisée par 2, c’est-à-dire multipliée par 0,5.']],
        expl: 'u est divisée par √(16/4) = √4 = 2 : pour diviser u par 10, il faudrait 100 fois plus de mesures.', indice: 'Calculez u pour N = 4 puis pour N = 16 en fonction de s, puis comparez les deux résultats.' } },
    { id: 'syst', titre: 'Un instrument mal réglé', focus: ['scene'],
      retenirTitre: 'À RETENIR : INCERTITUDE DE TYPE A',
      retenir: <Repliable key="cC">
        <SvgCarteTypeA/>
        {FUA}
        <ul style={liste}>
          <li><strong>4 fois plus de mesures : u divisée par 2.</strong> Le gain est lent : pour diviser u par 10, il faut 100 fois plus de mesures.</li>
          <li>Exemple de la simulation : s = 0,099 s et N = 5 donnent u = 0,044 s.</li>
          <li><strong>Idée fausse</strong> : « u = s ». <strong>Vrai</strong> : s décrit UNE mesure ; u décrit la moyenne, elle est plus petite.</li>
        </ul></Repliable>,
      texte: <>Une mesure s’écarte de la valeur de référence pour deux raisons : un <strong>effet aléatoire</strong> (il change à chaque mesure) et un <strong>décalage systématique</strong> (le même à chaque mesure). Ici, une balance est <strong>mal tarée</strong> : elle indique un peu trop à chaque pesée. On pèse plusieurs fois une masse marquée de <strong>20,000{NB}g</strong> (valeur de référence). Voici l’histogramme de 10 pesées.</>,
      tache: { type: 'qcm', ...QCM.syst } },
    { id: 'a', titre: 'Un intervalle de netteté', focus: ['scene'],
      retenirTitre: 'À RETENIR : ERREUR SYSTÉMATIQUE',
      retenir: <Repliable key="cG">
        <SvgCarteSysteme/>
        {FECART}
        <ul style={liste}>
          <li><strong>Répéter les mesures ne répare pas un instrument mal réglé.</strong> L’effet aléatoire se compense en partie dans la moyenne, le décalage systématique non.</li>
          <li>Exemple de la simulation : une balance qui indique 6 mg de trop donne une moyenne décalée de 6 mg, même avec 100 pesées.</li>
          <li><strong>Piège</strong> : une incertitude de type A très petite ne prouve pas que la mesure est juste. On détecte un décalage en comparant avec une référence.</li>
        </ul></Repliable>,
      texte: <>On cherche la <strong>distance focale f′</strong> d’une lentille convergente : on déplace l’écran jusqu’à voir l’image d’un objet très éloigné. Mais l’image paraît nette sur tout un intervalle de positions, la <strong>latitude de mise au point</strong> : de <strong>f′<sub>min</sub> = 147{NB}mm</strong> à <strong>f′<sub>max</sub> = 159{NB}mm</strong>. On ne peut pas faire mieux que cet intervalle, et on suppose qu’aucune valeur de l’intervalle n’est plus probable qu’une autre. Quelle est la demi-largeur <em>a</em> de l’intervalle ?</>,
      tache: { type: 'num', q: 'Demi-largeur a de l’intervalle', carnet: 'Demi-largeur a de l’intervalle', unite: 'mm', vrai: A_FOC, tol: 0, affiche: v => M.fmt(v, 1),
        calcul: () => ['Largeur de l’intervalle : 159 − 147 = 12 mm.', 'Demi-largeur : a = 12 ÷ 2 = 6,0 mm.'],
        pieges: [[12, 'C’est la largeur totale de l’intervalle : la demi-largeur est la moitié.'], [153, 'C’est le milieu de l’intervalle, pas sa demi-largeur.']],
        expl: 'a = (f′max − f′min) / 2 = (159 − 147) / 2 = 6,0 mm.', indice: 'La demi-largeur est la moitié de la différence entre la valeur la plus grande et la plus petite.' } },
    { id: 'uB', titre: 'Passer de l’intervalle à l’incertitude', focus: ['scene'],
      texte: <>La demi-largeur est <strong>a = 6,0{NB}mm</strong>. Il n’y a pas de série de mesures ici : on utilise ce que l’on sait de l’instrument. C’est l’évaluation de <strong>type B</strong>. Pour une valeur possible dans tout l’intervalle [x − a ; x + a], avec la même probabilité partout (loi uniforme), la formule suivante est donnée :{FUB}Calculez u.</>,
      tache: { type: 'num', q: 'Incertitude-type de type B', carnet: 'Incertitude-type u (type B)', unite: 'mm', vrai: UB_FOC, tol: 0.02, affiche: v => M.fmt(v, 2), cs: 3,
        calcul: () => ['√3 ≈ 1,732.', 'u = a / √3 = 6,0 mm ÷ 1,732 = 3,46 mm.'],
        pieges: [[2, 'On divise par √3 ≈ 1,73, pas par 3 : u = a / √3.'], [A_FOC * Math.sqrt(3), 'On divise a par √3, on ne le multiplie pas : u est plus petite que a.'], [6, 'u n’est pas égale à a : il faut diviser a par √3.']],
        expl: 'u = a / √3 = 6,0 / 1,732 = 3,46 mm.', indice: 'u = a / √3 : calculez √3 à la calculatrice, puis divisez 6,0 mm par ce nombre.' } },
    { id: 'ecrire', titre: 'Écrire le résultat', focus: ['scene'],
      retenirTitre: 'À RETENIR : INCERTITUDE DE TYPE B',
      retenir: <Repliable key="cD">
        <SvgCarteTypeB/>
        {FUB}
        <ul style={liste}>
          <li><strong>Pas de série ? On utilise l’instrument (type B).</strong> Intervalle ± a et loi uniforme : u = a / √3, donc u est plus petite que a.</li>
          <li>Exemple de la simulation : l’image est nette de 147 mm à 159 mm, donc a = 6,0 mm et u = 3,46 mm.</li>
          <li><strong>Piège</strong> : avec la loi uniforme, u = a / √3 et non u = a. L’hypothèse « toutes les valeurs de l’intervalle sont équiprobables » est à énoncer.</li>
        </ul></Repliable>,
      texte: <>La valeur estimée de f′ est le milieu de l’intervalle : <strong>(147 + 159) / 2 = 153{NB}mm</strong>, avec <strong>u = 3,46{NB}mm</strong>. Règle de la simulation : l’incertitude s’écrit avec <strong>1 chiffre significatif</strong> (2 si son premier chiffre est 1), <strong>arrondie par excès</strong> ; la valeur estimée s’arrondit à la même décimale.</>,
      tache: { type: 'qcm', ...QCM.ecrire } },
    { id: 'comparer', titre: 'Comparer à la référence', focus: ['scene'],
      texte: <>La lentille porte la valeur du fabricant <strong>f′ = 150{NB}mm</strong>, prise ici comme <strong>valeur de référence</strong> (on néglige son incertitude). La mesure est <strong>f′ = 153 ± 4{NB}mm</strong>. En 1<sup>re</sup>, on compare qualitativement : l’écart entre mesure et référence est-il petit, du même ordre ou très grand devant l’incertitude ?</>,
      tache: { type: 'qcm', ...QCM.comparer } },
    { id: 'choisir', titre: 'Quel type d’incertitude ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : RÉSULTAT ET COMPARAISON',
      retenir: <Repliable key="cE">
        <SvgCarteResultat/>
        {FRES}
        <ul style={liste}>
          <li><strong>u sur 1 chiffre significatif (2 si le premier est 1), arrondie par excès ; la valeur au même rang.</strong> Comparer, c’est regarder l’écart par rapport à u : même ordre, compatible.</li>
          <li>Exemple de la simulation : f′ = 153 ± 4 mm ; la référence 150 mm est dans l’intervalle de 149 mm à 157 mm.</li>
          <li><strong>Idée fausse</strong> : « compatible = identique ». <strong>Vrai</strong> : deux valeurs sont compatibles quand leur écart est de l’ordre de u ou plus petit.</li>
        </ul></Repliable>,
      texte: <>Dernier cas : un élève lit <strong>une seule fois</strong> le volume d’eau dans une éprouvette graduée de 100 mL : <strong>37,0{NB}mL</strong>. La notice de l’éprouvette indique une précision de lecture de <strong>± 0,5{NB}mL</strong>.</>,
      tache: { type: 'qcm', ...QCM.choisir } },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...M.tirerDefi(type), reps: {}, verifie: false }); };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.vrai, defi.type === 'A' ? 0.08 : 0.03);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'A' ? noterA : noterB)(ok);
  };
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('me-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (() => {
    const sit = defi.sit;
    return (<div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['A', 'Type A : série de mesures'], ['B', 'Type B : intervalle']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'A' ? 'Défi : quelle est l’incertitude-type de la moyenne ?' : 'Défi : quelle est l’incertitude-type de type B ?'}</div>
      {defi.type === 'A' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Une série de <strong>N = {defi.N} mesures</strong> indépendantes de la même grandeur : {sit.mesurande} (instrument : {sit.nom.toLowerCase()}). Valeurs en {sit.unite} :</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>{defi.valeurs.map((v, i) => <span key={i} style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '3px 8px', fontSize: 14, fontFamily: 'monospace' }}>{M.fmt(v, sit.dec)}</span>)}</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Calculez l’incertitude-type de type A <em>u</em> de la moyenne (calculatrice en mode statistiques autorisée). Donnez le résultat en {sit.unite} avec 2{NB}chiffres significatifs (marge acceptée : ± 8{NB}%).</div>
        {champ('Incertitude-type u', sit.unite)}
        <IndiceDefi cache={false}>Deux étapes : l’écart-type expérimental s des {defi.N} valeurs (touche « écart-type » de la calculatrice, celui qui divise par N − 1), puis u = s / √N.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On cherche la distance focale d’une lentille convergente. L’image d’un objet très éloigné paraît nette quand l’écran est entre <strong>f′<sub>min</sub> = {defi.min}{NB}mm</strong> et <strong>f′<sub>max</sub> = {defi.max}{NB}mm</strong>. On suppose toutes les positions de cet intervalle équiprobables. Calculez l’incertitude-type de type B <em>u</em> sur f′, en mm, avec 3{NB}chiffres significatifs (marge acceptée : ± 3{NB}%).</div>
        {champ('Incertitude-type u', 'mm')}
        <IndiceDefi cache={false}>La demi-largeur est a = (f′<sub>max</sub> − f′<sub>min</sub>) / 2. Puis, pour une loi uniforme : u = a / √3.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="me-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defi.type === 'A' ? `✓ Correct. x̄ = ${M.fmt(defi.m, sit.dec + 1)} ${sit.unite}, s = ${f2(defi.s)} ${sit.unite}, u = s / √${defi.N} = ${f2(defi.u)} ${sit.unite} (marge acceptée : ± 8 %).`
          : `✓ Correct. a = ${M.fmt(defi.a, 1)} mm, u = a / √3 = ${M.fmt(defi.vrai, 2)} mm (marge acceptée : ± 3 %).`)
          : defi.type === 'A' ? '✗ Vérifiez : s est l’écart-type expérimental de la série (division par N − 1), puis u = s / √N : u est plus petite que s.'
            : '✗ Vérifiez : a est la moitié de f′max − f′min, puis u = a / √3 (u est plus petite que a).'}
      </div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Mesures indépendantes</strong> : les N mesures portent sur le même mesurande, dans les mêmes conditions, et chacune est faite sans être influencée par la précédente. Sans cela, ni s ni s / √N n’ont de sens.</li>
      <li><strong>Dispersion symétrique</strong> : la simulation tire les mesures selon une loi normale (en cloche) autour d’une valeur centrale. C’est un <strong>modèle</strong>, pas une certitude : une vraie série peut être dissymétrique ou comporter des valeurs aberrantes, et l’histogramme d’une série courte ne ressemble qu’approximativement à une cloche.</li>
      <li><strong>Écart-type et nombre de mesures</strong> : l’écart-type expérimental s estime la dispersion d’<strong>une</strong> mesure ; il ne diminue pas quand N augmente (avec très peu de mesures, il est lui-même mal connu). L’incertitude-type de la moyenne u = s / √N décroît en 1 / √N, ce qui suppose les mesures indépendantes.</li>
      <li><strong>Erreurs systématiques</strong> : l’évaluation de type A ne détecte pas un instrument mal étalonné ou un décalage constant. L’exploration permet d’ajouter un tel décalage ; on le repère en comparant avec une référence.</li>
      <li><strong>Type B</strong> : pour un intervalle [x − a ; x + a], on suppose une loi uniforme (aucune valeur plus probable qu’une autre), d’où u = a / √3. Cette formule est donnée, non démontrée ; une autre hypothèse sur la loi donnerait un autre facteur.</li>
      <li><strong>Résolution de lecture</strong> : les valeurs sont arrondies à la graduation de l’instrument (centième de seconde, millimètre, demi-millilitre, milligramme).</li>
      <li><strong>Écriture du résultat</strong> : convention de la simulation (usuelle, mais pas la seule) : u sur 1 chiffre significatif (2 si le premier chiffre est 1), arrondie par excès, et la valeur estimée arrondie à la même décimale. Les calculs intermédiaires gardent un chiffre de plus.</li>
      <li><strong>Comparaison à une référence</strong> : elle est qualitative (écart de l’ordre de u ou plus petit : compatible ; plusieurs fois u : à expliquer). La référence est supposée connue sans incertitude. Les valeurs de dispersion et de précision des instruments sont choisies par la simulation à titre d’exemple, ce ne sont pas des données de fabricant.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const chips = (vals, unite) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '4px 0 8px' }}>
      {vals.map((v, i) => <span key={i} style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '3px 8px', fontSize: 14, fontFamily: 'monospace' }}>x<sub>{i + 1}</sub> = {M.fmt(v, 2)}{NB}{unite}</span>)}
    </div>);
  const sceneGuide = (() => {
    switch (idE) {
      case 'variab': return boite('Deux essais, deux valeurs', <SvgChronos valeurs={[14.31, 14.12]}/>, cadre('scene'));
      case 'histo': return boite('20 mesures de la même durée',
        <><SvgHisto sit={SIT_C} valeurs={M.SERIE_HISTO} w={0.05} yMax={6} axeX="durée de 10 oscillations (s)" label="Histogramme de 20 mesures de la durée de 10 oscillations, classes de 0,05 s"/>
          <div style={{ marginTop: 8 }}>{donnee('Nombre de mesures N', '20')}</div></>, cadre('scene'));
      case 'moy': return boite('5 mesures de la durée de 10 oscillations',
        <>{chips(M.SERIE_COURTE, 's')}{donnee('Nombre de mesures N', '5')}{fait('moy') && donnee('Valeur moyenne x̄', `14,25${NB}s`, COLS.orange)}</>, cadre('scene'));
      case 'disp': return boite('Deux séries de 20 mesures',
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SvgHisto sit={SIT_C} valeurs={SERIES2.B} w={0.1} yMax={20} petit titre="Série 1" axeX="durée de 10 oscillations (s)" label="Série 1 : mesures étalées sur de nombreuses classes"/>
          <SvgHisto sit={SIT_C} valeurs={SERIES2.A} w={0.1} yMax={20} petit titre="Série 2" axeX="durée de 10 oscillations (s)" label="Série 2 : mesures concentrées sur peu de classes"/>
        </div>, cadre('scene'));
      case 'protocole': return boite('Mesurer à la main', <SvgChronos/>, cadre('scene'));
      case 'typeA': return boite('Les 5 mesures de l’étape 3',
        <>{chips(M.SERIE_COURTE, 's')}{donnee('Nombre de mesures N', '5')}{donnee('Moyenne x̄', `14,25${NB}s`)}{donnee('Écart-type expérimental s', `0,099${NB}s`)}
          {fait('typeA') && donnee('Incertitude-type u = s / √N', `0,044${NB}s`, COLS.orange)}</>, cadre('scene'));
      case 'effetN': return boite('Même opérateur, plus de mesures',
        <>{donnee('Écart-type s (quel que soit N)', `0,10${NB}s`)}{donnee('Premier cas', 'N = 4')}{donnee('Second cas', 'N = 16')}
          {fait('effetN') && donnee('Facteur de division de u', '2', COLS.orange)}</>, cadre('scene'));
      case 'syst': return boite('10 pesées de la masse marquée',
        <SvgHisto sit={SIT_B} valeurs={SERIE_SYST} w={0.002} yMax={6} reference={SIT_B.ref} axeX="masse lue (g)" label="Histogramme de 10 pesées avec la valeur de référence 20,000 g"/>, cadre('scene'));
      case 'a': return boite('L’image paraît nette sur un intervalle',
        <><SvgBanc/><div style={{ marginTop: 8 }}>{donnee('f′min', `147${NB}mm`)}{donnee('f′max', `159${NB}mm`)}{fait('a') && donnee('Demi-largeur a', `6,0${NB}mm`, COLS.orange)}</div></>, cadre('scene'));
      case 'uB': return boite('De l’intervalle à l’incertitude',
        <><SvgBanc/><div style={{ marginTop: 8 }}>{donnee('Demi-largeur a', `6,0${NB}mm`)}{fait('uB') && donnee('Incertitude-type u = a / √3', `3,46${NB}mm`, COLS.orange)}</div></>, cadre('scene'));
      case 'ecrire': return boite('Valeur estimée et incertitude',
        <><SvgBanc repereMilieu/><div style={{ marginTop: 8 }}>{donnee('Valeur estimée f′', `153${NB}mm`)}{donnee('Incertitude-type u', `3,46${NB}mm`)}</div></>, cadre('scene'));
      case 'comparer': return boite('Mesure et valeur du fabricant',
        <><SvgBanc repereMilieu/><div style={{ marginTop: 8 }}>{donnee('Mesure', RES_FOC.texte.replace(/^/, 'f′ = '), COLS.orange)}{donnee('Référence du fabricant', `150${NB}mm`, COLS.vert)}</div></>, cadre('scene'));
      case 'choisir': return boite('Une seule lecture', <><SvgEprouvette/><div style={{ marginTop: 8 }}>{donnee('Volume lu', `37,0${NB}mL`)}{donnee('Précision de la notice', `± 0,5${NB}mL`)}</div></>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sit = M.SITUATIONS[ex.sit];
  const serie = M.tirerSerie(sit, ex.N, ex.graine * 7919 + 13, ex.biais);
  const m = M.moyenne(serie), s = M.ecartType(serie), uA = M.incertitudeA(s, ex.N), resA = M.resultat(m, uA, sit.unite);
  const uB = M.incertitudeB(sit.a), x1 = serie[0], resB = M.resultat(x1, uB, sit.unite), cmp = M.comparer(resA.m, resA.u, sit.ref);
  const cmpB = M.comparer(resB.m, resB.u, sit.ref);
  const verdict = c => c.niveau === 'compatible' ? { t: 'compatible : écart de l’ordre de u ou plus petit', c: COLS.vert }
    : c.niveau === 'ecart' ? { t: 'écart nettement plus grand que u : chercher une cause (décalage systématique, protocole…)', c: COLS.rouge }
      : c.niveau === 'indetermine' ? { t: 'impossible : u est nulle', c: COLS.orange }
        : { t: 'cas limite : écart un peu plus grand que u ; plus de mesures aideraient à conclure', c: COLS.orange };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const selStyle = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const exReglages = (<>
    {etiquette('Mesure étudiée', <select value={ex.sit} onChange={x => setE({ sit: x.target.value })} style={selStyle}>{M.IDS_SITUATIONS.map(k => <option key={k} value={k}>{M.SITUATIONS[k].nom}</option>)}</select>)}
    {aide(`On mesure : ${sit.mesurande}. Valeur de référence : ${M.fmt(sit.ref, sit.dec)} ${sit.unite} (${sit.refTxt}).`)}
    {etiquette('Nombre de mesures N', <select value={ex.N} onChange={x => setE({ N: Number(x.target.value) })} style={selStyle}>{M.NB_MESURES.map(n => <option key={n} value={n}>{n} mesures</option>)}</select>)}
    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, color: KIT.txt, marginBottom: 6, minHeight: 32 }}>
      <input type="checkbox" checked={ex.biais} onChange={x => setE({ biais: x.target.checked })} style={{ width: 20, height: 20, marginTop: 1 }}/>
      <span>Ajouter un décalage systématique : {sit.biaisTxt}</span></label>
    <button onClick={() => setE({ graine: ex.graine + 1 })} style={styleBouton(true, '#0369a1')}><Pic n="refresh"/>Nouvelle série de mesures</button>
    {aide('Chaque nouvelle série redonne des valeurs un peu différentes : c’est la variabilité de la mesure. Les mêmes réglages donnent la même série tant que l’on ne clique pas.')}
  </>);
  const exScene = (<>
    <SvgHisto sit={sit} valeurs={serie} moyenne={m} reference={sit.ref} bande={uA} axeX={`${sit.sym} mesurée (${sit.unite})`} label={`Histogramme de ${ex.N} mesures : ${sit.mesurande}`}/>
    <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Trait orange : moyenne x̄. Bande orange : x̄ ± u (type A). Pointillés verts : valeur de référence.</div>
  </>);
  const sNul = !(s > 0);
  const exMesures = (<>
    {donnee('Valeur moyenne x̄', `${M.fmt(m, sit.dec + 1)}${NB}${sit.unite}`, COLS.orange)}
    {donnee('Écart-type expérimental s', `${f2(s)}${NB}${sit.unite}`, COLS.violet)}
    {sNul ? <div style={{ marginTop: 6, fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, color: COLS.orange }}>s = 0 : toutes les valeurs lues sont identiques. La résolution de l’instrument masque la dispersion : u n’est pas significative ici. Essayez plus de mesures ou une nouvelle série.</div> : <>
      {donnee(`Incertitude-type u = s / √${ex.N}`, `${f2(uA)}${NB}${sit.unite}`, COLS.vert)}
      {donnee('Résultat (type A)', `${sit.sym} = ${resA.texte}`, COLS.bleu)}
      {donnee('Référence', `${M.fmt(sit.ref, sit.dec)}${NB}${sit.unite}`)}
      <div style={{ marginTop: 6, fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, color: verdict(cmp).c }}>Comparaison : {verdict(cmp).t}.</div>
      {aide('Lecture qualitative indicative, propre à cette simulation : le programme de 1re ne fixe pas de seuil chiffré.')}</>}
    {sNul && donnee('Référence', `${M.fmt(sit.ref, sit.dec)}${NB}${sit.unite}`)}
    {ex.N <= 5 && <div style={{ marginTop: 6, fontSize: 13, color: KIT.txt2, lineHeight: 1.5 }}>Avec si peu de mesures, s et u sont eux-mêmes très incertains : relancez plusieurs séries pour le voir.</div>}
  </>);
  const exTypeB = (<>
    {aide(`Une seule mesure suffit (la première de la série) : on utilise la caractéristique de l’instrument. ${sit.aTxt.charAt(0).toUpperCase()}${sit.aTxt.slice(1)}.`)}
    {donnee('Une seule mesure x₁', `${M.fmt(x1, sit.dec)}${NB}${sit.unite}`)}
    {donnee('Demi-largeur a', `${M.fmt(sit.a, sit.dec === 0 ? 1 : sit.dec)}${NB}${sit.unite}`)}
    {donnee('Incertitude-type u = a / √3', `${f2(uB)}${NB}${sit.unite}`, COLS.vert)}
    {donnee('Résultat (type B)', `${sit.sym} = ${resB.texte}`, COLS.bleu)}
    <div style={{ marginTop: 6, fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, color: verdict(cmpB).c }}>Comparaison : {verdict(cmpB).t}.</div>
    {aide(`Pour comparer : la série de ${ex.N} mesures donne u = ${f2(uA)} ${sit.unite}, une mesure unique donne u = ${f2(uB)} ${sit.unite}.`)}
  </>);
  const exValeurs = (<>
    {aide(`Les ${ex.N} valeurs de la série, en ${sit.unite}.`)}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{serie.map((v, i) => <span key={i} style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '2px 7px', fontSize: 13.5, fontFamily: 'monospace' }}>{M.fmt(v, sit.dec)}</span>)}</div>
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Passez de 5 à 20 mesures : s change-t-il beaucoup ? Et u ? Par combien u est-elle divisée quand N est multiplié par 4 ?</li>
      <li>Cliquez plusieurs fois sur « Nouvelle série » avec N = 5 : x̄ et u changent-ils ? Que dire de la fiabilité d’une série très courte ?</li>
      <li>Ajoutez un décalage systématique et passez à 100 mesures : u devient très petite. La mesure est-elle pour autant proche de la référence ?</li>
      <li>Comparez le type A (série) et le type B (une seule mesure) pour chaque instrument : lequel donne la plus petite incertitude ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>moyenne : x̄ = (x₁ + … + x<sub>N</sub>) / N ; écart-type expérimental s : dispersion d’<strong>une</strong> mesure</li>
        <li>type A : u = s / √N (N mesures indépendantes) ; 4 fois plus de mesures, u divisée par 2</li>
        <li>type B : u = a / √3 (loi uniforme sur ± a) pour une mesure unique ou un intervalle connu</li>
        <li>résultat : x = x̄ ± u, u sur 1 chiffre significatif (2 si le premier est 1) par excès, valeur au même rang</li>
        <li>comparer : écart de l’ordre de u ou plus petit, compatible ; plusieurs fois u, à expliquer ; un décalage systématique échappe au type A</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .me-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .me-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .me-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .me-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .me-l1.cote .me-carte { order: 2; } .me-l1.cote .me-main { order: 1; }
          .me-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .me-ex > .me-ex-scene { grid-column: 1; grid-row: 1; } .me-ex > .me-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .me-ex > .me-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .me-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .me-in { animation: me-fondu 0.35s ease-out; } @keyframes me-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mesure et incertitudes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une mesure varie d’un essai à l’autre. On décrit une série de mesures (<strong>histogramme, moyenne, écart-type</strong>), on évalue une <strong>incertitude-type</strong> (type A pour une série, type B pour une mesure unique), puis on écrit le résultat et on le compare à une valeur de référence.</div>
      {enExplore ? <>
        <div className="me-ex">
          <div className="me-ex-scene">{boite('Une série de mesures', exScene)}</div>
          <div className="me-ex-reglages">{boite('Réglages', exReglages)}</div>
          <div className="me-ex-mesures">{boite('Résultats de la série', exMesures)}</div>
        </div>
        <Section titre="Une seule mesure : incertitude de type B" ouvert={!!ex.ouv.typeB} onBascule={() => ouvrir('typeB')}>{exTypeB}</Section>
        <Section titre="Voir les valeurs de la série" ouvert={!!ex.ouv.valeurs} onBascule={() => ouvrir('valeurs')}>{exValeurs}</Section>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`me-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="me-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="me-carte me-hypo-defi">{panneauHypo}</div> : null}
          <div className="me-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'A' ? suiviA : suiviB}/></div>}
            {enDefi && defi && <div className="me-in">{boite(defi.type === 'A' ? 'Histogramme de la série' : 'Image nette sur un intervalle',
              defi.type === 'A' ? <SvgHisto sit={defi.sit} valeurs={defi.valeurs} axeX={`${defi.sit.sym} mesurée (${defi.sit.unite})`} label={`Histogramme de ${defi.N} mesures`}/>
                : <SvgBanc min={defi.min} max={defi.max}/>)}</div>}
            {enGuide && <div className="me-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && fait('choisir') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
