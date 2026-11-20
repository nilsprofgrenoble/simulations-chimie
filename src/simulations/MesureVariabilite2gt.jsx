import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, ExempleResolu } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./mesureVariabilite2gtModele";
import { QCM } from "./mesureVariabilite2gtQcm";
import { FicheVariabilite, FicheHistogramme, FicheMoyenne, FicheDispersion, FicheInstrumentProtocole, FicheIndependance, FicheBilan } from "./MesureVariabilite2gtFiches";
import { Histogramme, PileHistos, NuageOrdre, PileNuages, TableauValeurs, TableauClasses, SceneMontage, SceneChaineMesure } from "./MesureVariabilite2gtScenes";

const SIM_ID = 193;
const CLE_GUIDE = 'mesure-variabilite-2gt-guide-v1';
declarerDefis(SIM_ID, [['comparer', 'Comparer deux séries : laquelle est la plus dispersée ?'], ['estimer', 'Estimer la moyenne et l’écart-type à partir d’un histogramme']]);

// ====================================================
//  SIM 193 — MESURE : VARIABILITÉ, HISTOGRAMME, MOYENNE ET ÉCART-TYPE (2GT, thème « Mesure et incertitudes »).
//  Une seule idée : mesurer plusieurs fois la même grandeur donne des valeurs un peu différentes ; on range la série dans un histogramme,
//  on la résume par sa moyenne (le centre) et son écart-type (la largeur) ; l'instrument et le protocole changent la largeur.
//  Pas d'incertitude-type, pas de types A/B, pas de loi normale (simulation suivante et classes supérieures). Enchaînement avec 1G 161
//  (MesureIncertitudes : types A et B) et TSTL 78 : mêmes mots (mesurande, dispersion, écart-type).
//  Modèle : mesureVariabilite2gtModele.js (testé). Situations originales : chute d'une bille, gouttes d'un robinet, longueur d'un crayon,
//  masse d'eau délivrée. Exploration : série simulée (situation, instrument ou protocole, nombre de mesures, dérive), histogramme, courbe
//  dans l'ordre des mesures, panneau d'hypothèses.
//  Capacités visées (jamais affichées à l'élève) : exploiter une série de mesures indépendantes d'une grandeur physique (histogramme, moyenne,
//  écart-type) ; discuter l'influence de l'instrument de mesure et du protocole ; évaluer qualitativement la dispersion d'une série ;
//  (numérique) représenter l'histogramme d'une série de mesures à l'aide d'un tableur.
// ====================================================

const NB = M.NB;
const nbf = M.nbf;
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#6d28d9' };

const FMOY = <Formule><mi>moyenne</mi><mo>=</mo><mfrac><mtext>somme des valeurs</mtext><mtext>nombre de valeurs</mtext></mfrac></Formule>;

const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;

// Curseur à valeurs choisies dans une liste
function CurseurListe({ nom, valeurs, rang, onChange, texte, couleur = COL.orange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt }}>{texte}</span></div>
      <input type="range" min={0} max={valeurs.length - 1} step={1} value={rang} onChange={x => onChange(parseInt(x.target.value, 10))} aria-label={nom} style={{ width: '100%', accentColor: couleur }}/>
    </div>);
}

// Histogramme d'une série dans les classes d'une situation (axe propre)

// ====================================================
export function SimulationMesureVariabilite2gt() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('comparer');
  const [ex, setEx] = useState({ sit: 'chute', cfg: 'main', iN: 2, graine: 3, derive: 0, stats: true, ref: false, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['variabilite', 'histo-lire', 'histo-construire', 'moyenne', 'dispersion', 'ecart-type', 'instrument', 'protocole', 'independance', 'nombre', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);

  const H20 = M.histogramme(M.CHUTE_20, M.HISTO_CHUTE.debut, M.HISTO_CHUTE.largeur, M.HISTO_CHUTE.K);
  const HG = M.histogramme(M.GOUTTES_12, M.HISTO_GOUTTES.debut, M.HISTO_GOUTTES.largeur, M.HISTO_GOUTTES.K);
  const sTexte = v => `s${NB}=${NB}${M.ecartTypeTexte(v)}${NB}s`;

  const ETAPES = [
    { id: 'variabilite', titre: 'Mesurer plusieurs fois', focus: ['scene'],
      texte: <>Pour connaître une grandeur physique, on la mesure. La grandeur que l’on cherche à mesurer s’appelle le <strong>mesurande</strong> (par exemple la longueur d’un crayon). Quand on répète la mesure dans les mêmes conditions, on obtient une <strong>série de mesures</strong>.
        <ExempleResolu>Un élève mesure trois fois la masse d’un caillou avec la même balance et note : 12,31{NB}g ; 12,34{NB}g ; 12,29{NB}g. Le mesurande est la masse du caillou. Ces trois valeurs forment une série de mesures.</ExempleResolu>
        À vous : une bille est lâchée de 1,80{NB}m de haut, toujours de la même façon. Un élève chronomètre sa chute à la main, 8{NB}fois de suite.</>,
      tache: { type: 'qcm', ...QCM.variabilite } },
    { id: 'histo-lire', titre: 'Ranger les valeurs : l’histogramme', focus: ['scene'],
      retenirTitre: 'À retenir : mesurande, série et variabilité',
      retenir: <FicheVariabilite/>,
      texte: <>Une longue série est difficile à lire dans un tableau. On la range dans un <strong>histogramme</strong> : on découpe l’axe des valeurs en petits intervalles appelés <strong>classes</strong>, et pour chaque classe on dessine une barre. La <strong>hauteur</strong> de la barre est le <strong>nombre de mesures</strong> qui tombent dans la classe.
        <ExempleResolu>Sur l’histogramme de l’écran (20 durées de chute chronométrées), la barre orange, celle de la classe « de 0,56{NB}s à 0,60{NB}s », monte jusqu’à 4 : 4{NB}mesures sont comprises dans cette classe.</ExempleResolu>
        À vous : lisez la barre de la classe de 0,60{NB}s à 0,64{NB}s.</>,
      tache: { type: 'num', q: 'Combien de mesures sont dans la classe de 0,60 s à 0,64 s ?', carnet: false, unite: 'mesures', vrai: 6, tol: 0.001, affiche: v => nbf(v, 0),
        calcul: () => ['La barre de la classe de 0,60 s à 0,64 s monte jusqu’à la graduation 6.', 'Il y a 6 mesures dans cette classe.'],
        pieges: [[4, 'Vous avez lu une barre voisine (de 0,56 s à 0,60 s, ou de 0,64 s à 0,68 s). Repérez la barre dont les bornes sont 0,60 s et 0,64 s.'], [20, 'Vingt est le nombre total de mesures. On demande le nombre de mesures d’une seule classe : la hauteur d’une seule barre.'], [0.62, 'Cette valeur est le milieu de la classe, en secondes. On demande la hauteur de la barre : un nombre de mesures.']],
        expl: 'La barre de la classe de 0,60 s à 0,64 s monte jusqu’à 6 : 6 mesures.', indice: 'Trouvez sur l’axe horizontal les repères 0,60 et 0,64 : la barre située entre les deux est la bonne. Lisez sa hauteur sur l’axe vertical.' } },
    { id: 'histo-construire', titre: 'Construire un histogramme', focus: ['scene'],
      texte: <>Pour construire un histogramme, on choisit la largeur des classes, puis on <strong>compte</strong> les mesures de chaque classe. Une classe « de <em>a</em> à <em>b</em> » contient les valeurs égales à <em>a</em> ou plus grandes, et <strong>strictement plus petites que <em>b</em></strong> : une valeur égale à <em>b</em> est comptée dans la classe suivante. Un tableur fait ce comptage et dessine l’histogramme à votre place (capacité numérique : placer les valeurs dans une colonne, puis demander un graphique de type histogramme).
        <ExempleResolu>Reprenons les 8{NB}durées de chute de l’étape 1 (en s) : 0,58 ; 0,64 ; 0,61 ; 0,55 ; 0,66 ; 0,60 ; 0,63 ; 0,57, avec des classes de 0,05{NB}s. Classe de 0,55 à 0,60 : 0,58 ; 0,55 ; 0,57, soit 3{NB}valeurs (0,60 est exclu). Classe de 0,60 à 0,65 : 0,64 ; 0,61 ; 0,60 ; 0,63, soit 4{NB}valeurs. Classe de 0,65 à 0,70 : 0,66, soit 1{NB}valeur.</ExempleResolu>
        À vous : douze durées entre deux gouttes, avec des classes de 0,05{NB}s.</>,
      tache: { type: 'num', q: 'Combien de valeurs sont dans la classe de 1,20 s à 1,25 s ?', carnet: false, unite: 'valeurs', vrai: 5, tol: 0.001, affiche: v => nbf(v, 0),
        calcul: () => ['Valeurs de 1,20 s (inclus) à 1,25 s (exclu) : 1,23 ; 1,21 ; 1,22 ; 1,24 ; 1,20.', 'Il y en a 5.'],
        pieges: [[4, 'Vous avez oublié la valeur 1,20 s : la borne de gauche est incluse dans la classe.'], [6, 'Vous avez compté une valeur de trop : relisez les douze valeurs une par une et gardez celles qui sont dans la classe.'], [12, 'Douze est le nombre total de valeurs. On demande le nombre de valeurs d’une seule classe.']],
        expl: 'Les valeurs 1,20 ; 1,21 ; 1,22 ; 1,23 et 1,24 sont dans la classe de 1,20 s à 1,25 s : 5 valeurs.', indice: 'Parcourez les douze valeurs et cochez celles qui sont supérieures ou égales à 1,20 et strictement inférieures à 1,25.' } },
    { id: 'moyenne', titre: 'La moyenne', focus: ['scene'],
      retenirTitre: 'À retenir : lire un histogramme',
      retenir: <FicheHistogramme/>,
      texte: <>Pour résumer une série par un seul nombre, on calcule sa <strong>moyenne</strong> : on <strong>additionne</strong> toutes les valeurs, puis on <strong>divise</strong> par le <strong>nombre</strong> de valeurs. La moyenne donne le <strong>centre</strong> de la série.{FMOY}
        <ExempleResolu>Cinq longueurs d’un crayon mesurées à la règle (en mm) : 174 ; 175 ; 173 ; 174 ; 175. Somme : 174 + 175 + 173 + 174 + 175 = 871. Moyenne : 871 ÷ 5 = <strong>174,2{NB}mm</strong>.</ExempleResolu>
        À vous : six masses d’eau délivrées par une éprouvette (en g).</>,
      tache: { type: 'num', q: 'Quelle est la moyenne de ces six masses ?', carnet: false, unite: 'g', vrai: M.moyenne(M.EAU_6), tol: 0.003, affiche: v => nbf(v, 2),
        calcul: () => ['Somme : 20,31 + 19,87 + 20,46 + 19,92 + 19,75 + 20,25 = 120,56.', 'Moyenne : 120,56 ÷ 6 ≈ 20,09 g.'],
        pieges: [[120.56, 'Vous avez additionné les six valeurs, sans diviser. La moyenne est la somme divisée par le nombre de valeurs.'], [24.112, 'Vous avez divisé la somme par 5 : il y a six valeurs, il faut diviser par 6.'], [20.31, 'Cette valeur est la première de la liste. Calculez la moyenne de toutes les valeurs.']],
        expl: '120,56 ÷ 6 ≈ 20,09 g.', indice: 'Additionnez les six masses sur la calculatrice, puis divisez le résultat par 6.' } },
    { id: 'dispersion', titre: 'Étroit ou large ?', focus: ['scene'],
      retenirTitre: 'À retenir : la moyenne',
      retenir: <FicheMoyenne/>,
      texte: <>Deux séries peuvent avoir la même moyenne et être très différentes. La <strong>dispersion</strong> d’une série indique à quel point ses valeurs sont <strong>étalées</strong> autour de la moyenne. Sur un histogramme, on la voit à la <strong>largeur</strong> de la zone occupée par les barres, à condition de comparer avec la <strong>même échelle</strong>.
        <ExempleResolu>Deux autres séries, E et F, ont la même moyenne. Les valeurs de E sont toutes comprises entre 1,14{NB}s et 1,25{NB}s ; celles de F entre 1,12{NB}s et 1,32{NB}s. La zone de F est presque deux fois plus large : F est plus dispersée que E.</ExempleResolu>
        À vous : deux séries A et B de 24{NB}durées entre deux gouttes, tracées sur la même échelle.</>,
      tache: { type: 'qcm', ...QCM.dispersion } },
    { id: 'ecart-type', titre: 'L’écart-type', focus: ['scene'],
      texte: <>L’<strong>écart-type</strong>, noté <em>s</em>, est un nombre qui résume la dispersion : plus la série est <strong>large</strong>, plus <em>s</em> est <strong>grand</strong>. Il s’exprime dans la même unité que les mesures. On ne le calcule pas à la main : une calculatrice ou un tableur le donne (fonction « écart-type », ou ÉCART.TYPE dans un tableur).
        <ExempleResolu>Les séries E et F de l’exemple précédent ont pour écarts-types 0,03{NB}s et 0,06{NB}s. F est la plus large : c’est elle qui a le plus grand écart-type.</ExempleResolu>
        À vous : trois séries A, B et C sont tracées sur la même échelle. Leurs écarts-types sont 0,02{NB}s ; 0,05{NB}s et 0,09{NB}s, mais dans un autre ordre.</>,
      tache: { type: 'qcm', ...QCM.ecartType } },
    { id: 'instrument', titre: 'Choisir l’instrument', focus: ['scene'],
      retenirTitre: 'À retenir : la dispersion et l’écart-type',
      retenir: <FicheDispersion/>,
      texte: <>La dispersion d’une série dépend de l’<strong>instrument de mesure</strong> : un instrument plus précis donne des valeurs plus serrées.
        <ExempleResolu>On chronomètre la chute d’une bille. À la main, <em>s</em>{NB}={NB}0,05{NB}s ; avec des cellules photoélectriques qui déclenchent le chronomètre automatiquement, <em>s</em>{NB}={NB}0,004{NB}s. Deux chutes qui diffèrent de 0,02{NB}s se distinguent avec les cellules (0,02{NB}s est bien plus grand que 0,004{NB}s), mais pas à la main (0,02{NB}s est plus petit que 0,05{NB}s).</ExempleResolu>
        À vous : on a mesuré 20{NB}fois le même crayon avec une règle graduée, puis avec un pied à coulisse.</>,
      tache: { type: 'qcm', ...QCM.instrument } },
    { id: 'protocole', titre: 'Choisir le protocole', focus: ['scene'],
      texte: <>Le <strong>protocole</strong> est la façon de faire la mesure. Il influence aussi la dispersion. Pour mesurer la durée entre deux gouttes d’un robinet qui goutte régulièrement, on peut chronométrer un seul intervalle, ou chronométrer <strong>10{NB}intervalles d’un coup</strong> puis diviser le total par 10.
        <ExempleResolu>Pour 10{NB}intervalles, le chronomètre indique 12,4{NB}s. La durée d’un intervalle est 12,4 ÷ 10 = <strong>1,24{NB}s</strong>.</ExempleResolu>
        À vous : deux élèves ont chacun fait 20{NB}mesures avec le même chronomètre à main, l’un avec un seul intervalle, l’autre avec 10{NB}intervalles ÷ 10.</>,
      tache: { type: 'qcm', ...QCM.protocole } },
    { id: 'independance', titre: 'Des mesures indépendantes', focus: ['scene'],
      retenirTitre: 'À retenir : instrument et protocole',
      retenir: <FicheInstrumentProtocole/>,
      texte: <>La moyenne et l’écart-type ne décrivent bien une série que si les mesures sont <strong>indépendantes</strong> : elles portent sur le même mesurande, dans les mêmes conditions, et l’une n’influence pas la suivante. Pour le vérifier, on trace les valeurs <strong>dans l’ordre des mesures</strong> : on ne doit voir aucune tendance.
        <ExempleResolu>On mesure la température d’une boisson chaude toutes les minutes : 62&nbsp;°C, 59&nbsp;°C, 57&nbsp;°C, 55&nbsp;°C… Les valeurs baissent à chaque mesure : ce n’est pas la même grandeur mesurée plusieurs fois, la boisson refroidit. Une moyenne n’aurait pas de sens.</ExempleResolu>
        À vous : deux élèves ont noté, dans l’ordre, 20{NB}durées entre deux gouttes (séries A et B).</>,
      tache: { type: 'qcm', ...QCM.independance } },
    { id: 'nombre', titre: 'Faire plus de mesures', focus: ['scene'],
      retenirTitre: 'À retenir : des mesures indépendantes',
      retenir: <FicheIndependance/>,
      texte: <>Un élève veut un résultat plus sûr pour la durée de chute de la bille : au lieu de 5{NB}mesures, il en fait 50, avec le même chronomètre à main et le même protocole. Voici les deux histogrammes, sur la même échelle.
        <ExempleResolu>Pour comparer la largeur de deux histogrammes, on regarde la <strong>zone de valeurs</strong> qu’ils occupent sur l’axe horizontal, pas la hauteur des barres : celle-ci dépend du nombre de mesures. Un histogramme de 50{NB}mesures a des barres plus hautes qu’un histogramme de 5{NB}mesures, sans que cela dise quoi que ce soit sur sa largeur.</ExempleResolu>
        À vous : que devient l’écart-type de la série ?</>,
      tache: { type: 'qcm', ...QCM.nombre } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : une série de mesures',
      retenir: <FicheBilan/>,
      texte: <>Vous savez maintenant ranger une série de mesures dans un histogramme, calculer sa moyenne (le centre), lire son écart-type (la largeur), et dire comment l’instrument et le protocole changent cette largeur. Vous savez aussi vérifier qu’une série est utilisable : des mesures indépendantes, sans tendance. Testez-vous avec les défis, ou explorez librement avec une série simulée.</>,
      tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Mesures indépendantes du même mesurande</strong> : mêmes conditions, aucune dérive pendant la série. On le vérifie en traçant les valeurs dans l’ordre des mesures (ce test ne détecte qu’une dérive, pas les autres défauts d’indépendance) ; en exploration, une dérive peut être ajoutée pour voir ce qui se passe quand l’hypothèse est fausse.</li>
      <li><strong>Dispersion à peu près symétrique</strong> : la moyenne et l’écart-type résument bien une série dont l’histogramme est regroupé autour d’un centre. Pour une série à deux bosses (deux lots mélangés) ou très déséquilibrée, ils résument mal. Les séries simulées ici sont tirées au hasard autour d’une valeur centrale ; aucune loi mathématique n’est supposée connue de l’élève.</li>
      <li><strong>L’écart-type décrit la largeur de la série</strong> (la dispersion d’une mesure). Ce n’est pas l’erreur sur la moyenne, ni l’erreur sur la valeur vraie : faire plus de mesures n’en réduit pas la valeur (l’incertitude-type de la moyenne est l’objet de la simulation suivante).</li>
      <li><strong>Pas d’erreur systématique</strong> : les valeurs simulées sont centrées sur la valeur de référence. Un instrument déréglé décalerait toutes les valeurs dans le même sens, sans changer l’écart-type : la dispersion ne le détecte pas.</li>
      <li><strong>Écart-type du tableur ou de la calculatrice</strong> : on exploite la valeur donnée par l’outil, sans démontrer la formule. <em>Pour aller plus loin</em> : le tableur utilise la fonction ÉCART.TYPE (division par N − 1) ; une autre version divise par N, très proche dès que la série compte plus de dix valeurs.</li>
      <li><strong>« Largeur ≈ 4 écarts-types »</strong> : cette règle d’ordre de grandeur vaut pour une quarantaine de valeurs et une série à peu près symétrique. Elle donne environ 3 écarts-types pour 10 valeurs et environ 5 pour 100 valeurs : plus la série est longue, plus elle s’étale.</li>
      <li><strong>Classes d’un histogramme</strong> : la forme dépend de la largeur de classe choisie (trop étroites, beaucoup de barres vides ; trop larges, le détail disparaît). Ici, une valeur égale à la borne de droite est rangée dans la classe suivante ; selon le tableur, elle peut être rangée dans l’autre classe : vérifiez le réglage.</li>
      <li><strong>Protocole « 10 intervalles ÷ 10 »</strong> : on suppose que les gouttes tombent régulièrement et que l’erreur principale vient du déclenchement à la main, qui ne dépend pas de la durée mesurée.</li>
      <li><strong>Comparaison à l’écart-type</strong> : dire qu’une différence « se perd dans la variabilité » quand elle est plus petite que l’écart-type est une règle d’ordre de grandeur, pas un test statistique.</li>
      <li><strong>Valeurs fictives et chiffres significatifs</strong> : les dispersions sont choisies pour la lisibilité (ordres de grandeur réalistes). La moyenne est écrite avec une décimale de plus que les mesures, l’écart-type avec 2 chiffres significatifs ; les réponses sont acceptées avec une petite marge (0,3&nbsp;% à 10&nbsp;% selon la question).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => setE({ ouv: { ...ex.ouv, hypo: !ex.ouv.hypo } })}>{hypotheses}</Section></div>);

  // ════════════════ DÉFIS ════════════════
  function nouveauDefi(type) {
    const d = type === 'comparer' ? M.tirerDefiComparer(defi && defi.type === 'comparer' ? defi : null) : M.tirerDefiEstimer(defi && defi.type === 'estimer' ? defi : null);
    setDefi({ type, ...d, reps: {}, verifie: false });
  }
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);
  const defiC = defi && defi.type === 'comparer';
  const sArrondi = s => Number(M.nbSig(s, 2).replace(',', '.'));
  const verifier = () => {
    if (defiC) {
      const rep = defi.reps.serie, x = lireNombre(defi.reps.rapport), vrai = Math.max(sArrondi(defi.sA), sArrondi(defi.sB)) / Math.min(sArrondi(defi.sA), sArrondi(defi.sB));
      const okSerie = rep === (defi.largeEstA ? 'A' : 'B'), okRapport = isFinite(x) && Math.abs(x - vrai) <= vrai * M.toleranceRapport, ok = okSerie && okRapport;
      setDefi(d => ({ ...d, verifie: true, ok, okSerie, okRapport, vrai })); noterC(ok);
    } else {
      const x = lireNombre(defi.reps.moyenne), okM = isFinite(x) && Math.abs(x - defi.m) <= defi.tolMoyenne, okS = defi.reps.choix === defi.bonne, ok = okM && okS;
      setDefi(d => ({ ...d, verifie: true, ok, okM, okS })); noterE(ok);
    }
  };
  const SD = defi && M.SITUATIONS[defi.sit];
  const bord = (cle, v) => `1.5px solid ${defi.verifie ? (v ? '#15803d' : '#dc2626') : KIT.bord}`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['comparer', 'Comparer deux séries'], ['estimer', 'Estimer à partir d’un histogramme']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defiC ? 'Défi : comparer deux séries' : 'Défi : estimer à partir d’un histogramme'}</div>
      {defiC ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Mesurande : {SD.mesurande}. Voici deux séries de 20{NB}mesures faites avec deux méthodes différentes ({defi.cLarge.nom}, et {defi.cEtroite.nom}), tracées sur la même échelle. Pour chaque série, le tableur a donné la moyenne ; l’écart-type est affiché une fois la série choisie.</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Quelle série est la plus dispersée ?</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {['A', 'B'].map(l => <button key={l} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, serie: l }, verifie: false }))} aria-pressed={defi.reps.serie === l} style={{ ...stylePetitBouton(defi.reps.serie === l, '#0369a1'), border: defi.reps.serie === l ? undefined : bord('s', defi.okSerie) }}>Série {l}</button>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Son écart-type est environ</span>
          <input value={defi.reps.rapport ?? ''} aria-label="Rapport des écarts-types" inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('mv2-verif')?.click()}
            onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, rapport: e.target.value }, verifie: false }))} style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: bord('r', defi.okRapport), fontSize: 14 }}/>
          <span>fois celui de l’autre série (à 10&nbsp;% près)</span>
        </div>
        <IndiceDefi cache={false}>La série la plus dispersée est la plus large. Pour savoir combien de fois son écart-type est plus grand, divisez le plus grand écart-type par le plus petit.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Mesurande : {SD.mesurande}. Voici l’histogramme de 40{NB}mesures ({M.configDe(defi.sit, defi.cfg).nom}). Repère, valable pour une quarantaine de valeurs et une série à peu près symétrique : la zone occupée est large d’environ quatre écarts-types (environ trois pour dix valeurs, environ cinq pour cent valeurs).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Moyenne estimée</span>
          <input value={defi.reps.moyenne ?? ''} aria-label={`Moyenne estimée en ${SD.unite}`} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('mv2-verif')?.click()}
            onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, moyenne: e.target.value }, verifie: false }))} style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: bord('m', defi.okM), fontSize: 14 }}/>
          <span>{SD.unite} (à une largeur de classe près)</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Quel écart-type correspond à cette série ?</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {defi.choix.map((c, i) => <button key={i} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, choix: i }, verifie: false }))} aria-pressed={defi.reps.choix === i} style={{ ...stylePetitBouton(defi.reps.choix === i, '#0369a1'), border: defi.reps.choix === i ? undefined : bord('c', defi.okS) }}>{M.nbSig(c, 2)}{NB}{SD.unite}</button>)}
        </div>
        <IndiceDefi cache={false}>La moyenne est au centre du paquet de barres. Mesurez la largeur de la zone occupée sur l’axe, divisez-la par 4, et choisissez la proposition la plus proche.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="mv2-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defiC
          ? (defi.ok ? `✓ Correct : la série ${defi.largeEstA ? 'A' : 'B'} est la plus dispersée, son écart-type est environ ${nbf(defi.vrai, 1)} fois plus grand.`
            : !defi.okSerie ? '✗ Regardez la largeur de la zone occupée par les barres, sur la même échelle : la série la plus dispersée est la plus large, et son écart-type est le plus grand.'
              : '✗ La série est la bonne. Pour le rapport, divisez le plus grand écart-type par le plus petit (marge acceptée : 10 %).')
          : (defi.ok ? `✓ Correct : la moyenne est ${nbf(defi.m, M.decimalesDe(M.configDe(defi.sit, defi.cfg).res) + 1)} ${SD.unite} et l’écart-type est environ ${M.nbSig(defi.s, 2)} ${SD.unite}.`
            : !defi.okM ? '✗ La moyenne est le centre du paquet de barres : cherchez le milieu de la zone la plus remplie (marge acceptée : une largeur de classe).'
              : '✗ La moyenne est bonne. Pour l’écart-type, mesurez la largeur de la zone occupée, divisez-la par 4 environ, puis choisissez la proposition la plus proche.')}
      </div>}
    </div>);
  const comparerAxe = defiC ? (() => {
    const S = M.SITUATIONS[defi.sit], c = defi.cLarge, a = M.debutClasses(S.ref, c.classe, c.K, c.res), b = a + c.K * c.classe;
    const HA = M.histogramme(defi.A, a, c.classe, c.K), HB = M.histogramme(defi.B, a, c.classe, c.K), ym = Math.max(HA.nMax, HB.nMax);
    return { S, c, a, b, HA, HB, ym };
  })() : null;
  const sceneDefi = defi && (defiC
    ? <div>
      <PileHistos items={[{ classes: comparerAxe.HA.classes, etiquette: 'Série A' }, { classes: comparerAxe.HB.classes, etiquette: 'Série B' }]} xmin={comparerAxe.a} xmax={comparerAxe.b} yMax={Math.ceil(comparerAxe.ym / 5) * 5}
        nom={comparerAxe.S.nom.toLowerCase()} unite={comparerAxe.S.unite} dec={M.decimalesDe(comparerAxe.c.classe)}/>
      <div style={{ marginTop: 8 }}>
        <LigneMesure nom="Série A : moyenne" valeur={`${M.moyenneTexte(defi.A, M.configDe(defi.sit, defi.largeEstA ? defi.cLarge.id : defi.cEtroite.id).res)}${NB}${comparerAxe.S.unite}`} couleur={COL.orange}/>
        {defi.reps.serie && <LigneMesure nom="Série A : écart-type" valeur={`${M.ecartTypeTexte(defi.A)}${NB}${comparerAxe.S.unite}`} couleur={COL.violet}/>}
        <LigneMesure nom="Série B : moyenne" valeur={`${M.moyenneTexte(defi.B, M.configDe(defi.sit, defi.largeEstA ? defi.cEtroite.id : defi.cLarge.id).res)}${NB}${comparerAxe.S.unite}`} couleur={COL.orange}/>
        {defi.reps.serie && <LigneMesure nom="Série B : écart-type" valeur={`${M.ecartTypeTexte(defi.B)}${NB}${comparerAxe.S.unite}`} couleur={COL.violet}/>}
        {!defi.reps.serie && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>Les deux écarts-types s’affichent quand vous avez choisi la série la plus dispersée : regardez d’abord les histogrammes.</div>}
      </div></div>
    : (() => {
      const S = M.SITUATIONS[defi.sit], h = M.histogramme(defi.valeurs, defi.debut, defi.classe, defi.K);
      return <Histogramme classes={h.classes} nom={S.nom.toLowerCase()} unite={S.unite} dec={M.decimalesDe(defi.classe)}/>;
    })());

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c}/>;
  const axeDisp = { xmin: M.HISTO_DISP.debut, xmax: M.HISTO_DISP.debut + M.HISTO_DISP.K * M.HISTO_DISP.largeur, yMax: 10, nom: 'durée entre deux gouttes', unite: 's', dec: 2 };
  const hd = serie => M.histogramme(serie, M.HISTO_DISP.debut, M.HISTO_DISP.largeur, M.HISTO_DISP.K).classes;
  const sceneGuide = (() => {
    switch (idE) {
      case 'variabilite': return boite('Une bille lâchée de 1,80 m, 8 mesures à la main',
        <><SceneMontage id="chute"/><div style={{ marginTop: 10 }}><TableauValeurs valeurs={M.CHUTE_8} unite="s" titre="Durées de chute chronométrées"/></div></>, cadre('scene'));
      case 'histo-lire': return boite('20 durées de chute, rangées par classes',
        <Histogramme classes={H20.classes} nom="durée de chute" unite="s" dec={2} yMax={8} surligne={fait('histo-lire') ? 4 : 3}
          aria={fait('histo-lire') ? 'Histogramme de 20 durées de chute en secondes, classes de 0,04 s. La classe de 0,60 s à 0,64 s est en orange.' : 'Histogramme de 20 durées de chute en secondes, classes de 0,04 s. La classe de 0,56 s à 0,60 s est en orange.'}/>, cadre('scene'));
      case 'histo-construire': return boite('12 durées entre deux gouttes',
        <><TableauValeurs valeurs={M.GOUTTES_12} unite="s"/>
          <TableauClasses classes={HG.classes} unite="s" dec={2} remplie={fait('histo-construire')} surligne={fait('histo-construire') ? null : 2}/>
          {fait('histo-construire') && <div style={{ marginTop: 10 }}><Histogramme classes={HG.classes} nom="durée entre deux gouttes" unite="s" dec={2} yMax={6} compact surligne={2}/></div>}</>, cadre('scene'));
      case 'moyenne': return boite('Six masses d’eau délivrées par une éprouvette',
        <><TableauValeurs valeurs={M.EAU_6} unite="g" dec={2}/>{fait('moyenne') && <div style={{ marginTop: 8 }}>{donnee('Moyenne', `${nbf(M.moyenne(M.EAU_6), 2)}${NB}g`, COL.orange)}</div>}</>, cadre('scene'));
      case 'dispersion': return boite('Deux séries, même échelle',
        <PileHistos items={[{ classes: hd(M.SERIES_DISP.A), moyenne: 1.2, etiquette: 'Série A' }, { classes: hd(M.SERIES_DISP.B), moyenne: 1.2, etiquette: 'Série B' }]} {...axeDisp}/>, cadre('scene'));
      case 'ecart-type': return boite('Trois séries, même échelle',
        <PileHistos items={[
          { classes: hd(M.SERIES_DISP.S2), moyenne: 1.2, etiquette: fait('ecart-type') ? `Série A : ${sTexte(M.SERIES_DISP.S2)}` : 'Série A' },
          { classes: hd(M.SERIES_DISP.S1), moyenne: 1.2, etiquette: fait('ecart-type') ? `Série B : ${sTexte(M.SERIES_DISP.S1)}` : 'Série B' },
          { classes: hd(M.SERIES_DISP.S3), moyenne: 1.2, etiquette: fait('ecart-type') ? `Série C : ${sTexte(M.SERIES_DISP.S3)}` : 'Série C' }]} {...axeDisp}/>, cadre('scene'));
      case 'instrument': {
        const hr = M.histogramme(M.CRAYON_REGLE, 171.5, 1, 5), hp = M.histogramme(M.CRAYON_PIED, 173.85, 0.1, 5), ym = Math.max(hr.nMax, hp.nMax);
        return boite('Un même crayon, 20 mesures avec chaque instrument',
          <><SceneMontage id="crayon"/><div style={{ marginTop: 10 }}>
            <PileHistos items={[{ classes: hr.classes, etiquette: `Règle : ${sTexte(M.CRAYON_REGLE).replace(/ s$/, ' mm')}` }, { classes: hp.classes, etiquette: `Pied à coulisse : ${sTexte(M.CRAYON_PIED).replace(/ s$/, ' mm')}` }]}
              xmin={171.5} xmax={176.5} ticks={[172, 173, 174, 175, 176]} yMax={Math.ceil(ym / 2) * 2} nom="longueur du crayon" unite="mm" dec={0}/></div></>, cadre('scene'));
      }
      case 'protocole': {
        const hu = M.histogramme(M.GOUTTES_UN, 1.05, 0.05, 6), hx = M.histogramme(M.GOUTTES_DIX, 1.185, 0.005, 10), ym = Math.max(hu.nMax, hx.nMax);
        return boite('Les gouttes d’un robinet, 20 mesures par élève',
          <><SceneMontage id="gouttes"/><div style={{ marginTop: 10 }}>
            <PileHistos items={[{ classes: hu.classes, etiquette: 'Un intervalle' }, { classes: hx.classes, etiquette: '10 intervalles ÷ 10' }]}
              xmin={1.05} xmax={1.35} ticks={[1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35]} yMax={Math.ceil(ym / 5) * 5} nom="durée entre deux gouttes" unite="s" dec={2}/></div></>, cadre('scene'));
      }
      case 'independance': return boite('Deux séries notées dans l’ordre des mesures',
        <PileNuages items={[{ valeurs: M.ORDRE_A, etiquette: 'Série A' }, { valeurs: M.ORDRE_B, etiquette: 'Série B' }]} ymin={1.05} ymax={1.35} unite="s" nom="durée entre deux gouttes" dec={2}/>, cadre('scene'));
      case 'nombre': {
        const c = M.configDe('chute', 'main'), a = M.debutClasses(0.606, c.classe, c.K, c.res), b = a + c.K * c.classe;
        const h5 = M.histogramme(M.NOMBRE_5, a, c.classe, c.K), h50 = M.histogramme(M.NOMBRE_50, a, c.classe, c.K);
        return boite('Durée de chute : 5 mesures, puis 50 mesures',
          <><PileHistos items={[{ classes: h5.classes, etiquette: fait('nombre') ? `5 mesures : ${sTexte(M.NOMBRE_5)}` : '5 mesures' }, { classes: h50.classes, etiquette: fait('nombre') ? `50 mesures : ${sTexte(M.NOMBRE_50)}` : '50 mesures' }]}
            xmin={a} xmax={b} yMax={20} nom="durée de chute" unite="s" dec={2}/></>, cadre('scene'));
      }
      case 'bilan': return boite('La chaîne complète', <SceneChaineMesure/>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const SE = M.SITUATIONS[ex.sit], cfgE = M.configDe(ex.sit, ex.cfg), nE = M.NB_MESURES[ex.iN];
  const serie = useMemo(() => M.tirerSerieAffichable(ex.sit, cfgE.id, nE, ex.graine, ex.derive).valeurs, [ex.sit, cfgE.id, nE, ex.graine, ex.derive]);
  const mE = M.moyenne(serie), sE = M.ecartType(serie), decC = M.decimalesDe(cfgE.classe), debutE = M.debutClasses(SE.ref, cfgE.classe, cfgE.K, cfgE.res);
  const hE = M.histogramme(serie, debutE, cfgE.classe, cfgE.K);
  const exScene = (<>
    <Histogramme classes={hE.classes} nom={SE.nom.toLowerCase()} unite={SE.unite} dec={decC} moyenne={ex.stats ? mE : null} ecart={ex.stats ? sE : null} valRef={ex.ref ? SE.ref : null}
      aria={`Histogramme de ${nE} mesures : ${SE.mesurande}, ${cfgE.nom}. Moyenne ${nbf(mE, cfgE.dec + 1)} ${SE.unite}, écart-type ${M.nbSig(sE, 2)} ${SE.unite}.`}/>
    {hE.hors > 0 && <div style={{ fontSize: 13, color: COL.orange, marginTop: 4 }}>{hE.hors} valeur(s) en dehors du graphique.</div>}</>);
  const exOrdre = <NuageOrdre valeurs={serie} unite={SE.unite} nom={SE.nom.toLowerCase()} dec={cfgE.dec} moyenne={ex.stats ? mE : null} ymin={SE.ref - cfgE.K / 2 * cfgE.classe} ymax={SE.ref + cfgE.K / 2 * cfgE.classe}/>;
  const exReglages = (<>
    {etiquette('Mesurande (grandeur mesurée)', <select value={ex.sit} onChange={x => setE({ sit: x.target.value, cfg: M.SITUATIONS[x.target.value].configs[0].id })} style={sel}>
      {M.IDS_SITUATIONS.map(id => <option key={id} value={id}>{M.SITUATIONS[id].nom}</option>)}</select>)}
    {etiquette(SE.configs[0].genre === 'protocole' ? 'Protocole' : 'Instrument de mesure', <select value={cfgE.id} onChange={x => setE({ cfg: x.target.value })} style={sel}>
      {SE.configs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>)}
    <CurseurListe nom="Nombre de mesures" valeurs={M.NB_MESURES} rang={ex.iN} onChange={i => setE({ iN: i })} texte={`${nE}`}/>
    <CurseurListe nom="Dérive pendant la série (hypothèse non respectée)" valeurs={[0, 1, 2, 3]} rang={ex.derive} onChange={i => setE({ derive: i })} texte={ex.derive === 0 ? 'aucune' : `${ex.derive} fois l’écart-type`} couleur={COL.rouge}/>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
      <button onClick={() => setE({ graine: ex.graine + 1 })} style={styleBouton(true, '#0369a1')}><Pic n="refresh"/>Nouvelle série</button>
    </div>
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 700, marginBottom: 6 }}><input type="checkbox" checked={ex.stats} onChange={x => setE({ stats: x.target.checked })} style={{ width: 20, height: 20 }}/>Montrer la moyenne et l’écart-type</label>
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 700, marginBottom: 6 }}><input type="checkbox" checked={ex.ref} onChange={x => setE({ ref: x.target.checked })} style={{ width: 20, height: 20 }}/>Montrer la valeur de référence de la simulation</label>
    {aide('La valeur de référence est connue ici parce que c’est une simulation ; dans une vraie mesure, on ne la connaît pas.')}
  </>);
  const csv = serie.map(v => nbf(v, cfgE.dec)).join('\n');
  const exMesures = (<>
    {donnee('Mesurande', SE.nom, COL.bleu)}
    {donnee('Nombre de mesures', `${nE}`)}
    {donnee('Moyenne', `${nbf(mE, cfgE.dec + 1)}${NB}${SE.unite}`, COL.orange)}
    {donnee('Écart-type s', `${M.nbSig(sE, 2)}${NB}${SE.unite}`, COL.violet)}
    {donnee('Plus petite valeur', `${nbf(M.minimum(serie), cfgE.dec)}${NB}${SE.unite}`)}
    {donnee('Plus grande valeur', `${nbf(M.maximum(serie), cfgE.dec)}${NB}${SE.unite}`)}
    {donnee('Largeur d’une classe', `${nbf(cfgE.classe, decC)}${NB}${SE.unite}`)}
    {ex.ref && donnee('Valeur de référence', `${nbf(SE.ref, cfgE.dec)}${NB}${SE.unite}`, COL.vert)}
    {ex.derive > 0 && <div style={{ fontSize: 13.5, color: COL.rouge, marginTop: 6, lineHeight: 1.5 }}>Avec une dérive, les mesures ne sont plus indépendantes : l’histogramme s’élargit et la courbe dans l’ordre des mesures monte. La moyenne et l’écart-type ne décrivent plus une grandeur unique.</div>}
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Changez d’instrument (ou de protocole) pour le même mesurande : que devient la largeur de l’histogramme ? Et l’écart-type ?</li>
      <li>Passez de 5 à 100 mesures avec le même instrument : l’histogramme est-il plus large, plus étroit, ou mieux dessiné ? Que fait l’écart-type ?</li>
      <li>Cliquez plusieurs fois sur « Nouvelle série » : la moyenne et l’écart-type changent-ils beaucoup d’une série à l’autre ?</li>
      <li>Ajoutez une dérive, puis regardez la courbe dans l’ordre des mesures : que devient l’histogramme ?</li>
      <li>Copiez les valeurs dans un tableur et construisez vous-même l’histogramme ; comparez avec celui de l’écran.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir sansFiche>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>mesurande : la grandeur mesurée ; une série : plusieurs mesures du même mesurande</li>
        <li>histogramme : le nombre de mesures par classe ; moyenne : le centre ; écart-type <em>s</em> : la largeur</li>
        <li>instrument et protocole plus précis : série plus étroite ; plus de mesures : <em>s</em> ne diminue pas</li>
        <li>valable si les mesures sont indépendantes (pas de tendance dans l’ordre) et la série à peu près symétrique</li>
      </ul>
    </ARetenir>);
  const tableur = (
    <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      Copiez ces valeurs (une par ligne), collez-les dans une colonne d’un tableur, puis demandez un graphique de type histogramme en réglant la largeur des classes. Comparez avec l’histogramme de l’écran ; la fonction MOYENNE du tableur donne la moyenne et ÉCART.TYPE l’écart-type. Attention : ici une valeur égale à la borne de droite d’une classe est rangée dans la classe suivante ; selon le tableur, elle peut être rangée dans l’autre classe, vérifiez le réglage.
      <textarea readOnly value={csv} aria-label="Valeurs de la série, une par ligne" rows={Math.min(8, serie.length)} style={{ width: '100%', maxWidth: 220, display: 'block', margin: '8px 0', fontSize: 14, padding: 6, borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}/>
      <button onClick={() => { try { navigator.clipboard.writeText(csv); } catch { /* le texte reste sélectionnable */ } }} style={styleBouton(false)}>Copier les valeurs</button>
    </div>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mv2-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mv2-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mv2-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .mv2-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .mv2-l1.cote .mv2-carte { order: 2; } .mv2-l1.cote .mv2-main { order: 1; }
          .mv2-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); grid-template-rows: auto auto 1fr; }
          .mv2-ex > .mv2-ex-scene { grid-column: 1; grid-row: 1; } .mv2-ex > .mv2-ex-reglages { grid-column: 2; grid-row: 1 / span 3; }
          .mv2-ex > .mv2-ex-ordre { grid-column: 1; grid-row: 2; } .mv2-ex > .mv2-ex-mesures { grid-column: 1; grid-row: 3; } }
        @media (max-width: 900px) { .mv2-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .mv2-in { animation: mv2-fondu 0.35s ease-out; } @keyframes mv2-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mesure : variabilité, histogramme, moyenne et écart-type</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Quand on mesure plusieurs fois la même grandeur, on obtient des valeurs un peu différentes. On les range dans un <strong>histogramme</strong>, on en tire une <strong>moyenne</strong> (le centre) et un <strong>écart-type</strong> (la largeur).</div>
      {enExplore ? <>
        <div className="mv2-ex">
          <div className="mv2-ex-scene">{boite('Histogramme de la série simulée', exScene)}</div>
          <div className="mv2-ex-reglages">{boite('Réglages', exReglages)}</div>
          <div className="mv2-ex-ordre">{boite('Les mêmes valeurs, dans l’ordre des mesures', exOrdre)}</div>
          <div className="mv2-ex-mesures">{boite('Mesures et calculs', exMesures)}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="Copier les valeurs vers un tableur" ouvert={!!ex.ouv.tableur} onBascule={() => ouvrir('tableur')}>{tableur}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`mv2-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="mv2-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="mv2-carte mv2-hypo-defi">{panneauHypo}</div> : null}
          <div className="mv2-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defiC ? suiviC : suiviE}/></div>}
            {enDefi && defi && <div className="mv2-in" key={`${defi.type}-${defi.graine}`}>{boite(defiC ? 'Les deux séries à comparer' : 'La série à étudier', sceneDefi)}</div>}
            {enGuide && <div className="mv2-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
