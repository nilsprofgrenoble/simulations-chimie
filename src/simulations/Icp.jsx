import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./icpModele";
import { QCM } from "./icpQcm";
import { useBoucle, useTiragesIcp, legendeIcp, texteEvenementIcp } from "./icpHook";
import { useProgres } from "./frxTiragesHook";
import { reduitMouvement } from "./hookHorloge";
import { SceneNiveauxFlamme } from "./FlammeSchemas";
import { SceneTorche, ScenePolychromateur, SceneSpectreICP, SceneGamme, SvgCarteComparaison } from "./IcpSchemas";
import { PanneauScenariosIcp, CommandesTiragesIcp } from "./IcpTirages";

const SIM_ID = 314, CLE_GUIDE = 'icp-guide-v1';
declarerDefis(SIM_ID, [['raie', 'Identifier une raie'], ['dosage', 'Doser par ICP']]);

// ====================================================
//  SIM 314 — ICP : POURQUOI UN PLASMA ? (BTS MDC, Analyse)
//  Capacités visées (jamais affichées à l'élève) : décrire succinctement le principe d'une spectrométrie atomique (ICP) à partir d'un schéma ;
//  identifier les éléments de l'appareil ; exploiter une courbe d'étalonnage pour déterminer une concentration ; choisir la spectrométrie adaptée à une analyse.
//  Modèle : icpModele.js (ordres de grandeur annoncés dans les hypothèses). Schémas : IcpSchemas.jsx. Tirages : icpHook.js, IcpTirages.jsx.
// ====================================================

const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const NB = '\u00a0';
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const fmtC = c => (c >= 100 ? String(Math.round(c)) : String(Number(c.toPrecision(2))).replace('.', ','));
const fmtS = v => Math.round(v).toLocaleString('fr-FR');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['torche', 'trajet', 'temperature', 'energie', 'spectre', 'ionisation', 'poly', 'gamme', 'dilution', 'etalonnage', 'choisir', 'bilan'];
const num2 = s => parseFloat(String(s).replace(/\s|\u00a0|\u202f/g, '').replace(',', '.').replace('\u2212', '-'));
const ZN = M.raie('Zn'), CU = M.raie('Cu');
const spectre = T => M.lancer(M.etatVide(T), T, 3000, Math.random);
const T0 = id => (id === 'temperature' ? 2500 : M.T_PLASMA);
const REFERENCE = [...M.RAIES].sort((a, b) => a.lam - b.lam).map(r => `${r.s} ${fr(r.lam, 1)}`).join(' ; ');

export function SimulationIcp() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState(() => ({ T: M.T_PLASMA, etat: spectre(M.T_PLASMA), x: 0, el: 'Cu' }));
  const [ex, setEx] = useState({ onglet: 'spectre', x: 0 });
  const [ouv, setOuv] = useState({});
  const [anim, setAnim] = useState(() => !reduitMouvement());
  const [p, setP] = useBoucle(9000, anim);
  const tir = useTiragesIcp();
  const demoSc = tir.demo?.sc ?? null;
  const progAuto = useProgres(tir.demo ? 1000000 + tir.demo.cle : tir.etat.n * 1000 + tir.rejeu % 1000, tir.demo ? tir.dureeDemo : tir.dureeAnim, tir.demo ? !reduitMouvement() : tir.anime);
  const progT = tir.manuel ?? progAuto, lotT = demoSc == null && tir.etat.lot > 1;
  const dernier = tir.etat.dernier;
  const phDemo = demoSc != null ? { s: M.ECH[demoSc], lam: M.raie(M.ECH[demoSc]).lam } : null;
  const phAff = phDemo ?? (lotT ? null : dernier), pAff = lotT ? 1 : progT;
  const [suiviR, noterR] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('raie');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'torche', titre: 'Un plasma d’argon : une source très chaude', focus: ['scene', 'curseur'],
      texte: <>Une flamme ne suffit pas pour exciter tous les éléments. En <strong>ICP</strong>, de l’argon circule dans une <strong>torche</strong> entourée d’une bobine parcourue par un courant à haute fréquence : le gaz devient un <strong>plasma</strong>. Regardez la torche (⏸ pour arrêter, curseur pour avancer ou reculer).</>,
      tache: { type: 'qcm', q: 'Un plasma d’argon est…', ...QCM.torche,
        expl: 'Le courant haute fréquence de la bobine ionise l’argon : on obtient un gaz ionisé (un plasma) entretenu à plusieurs milliers de kelvins, bien plus chaud qu’une flamme (environ 2 500 K).', indice: 'Regardez les couleurs de la torche : de quoi est faite la zone chaude entre les spires de la bobine ?' } },
    { id: 'trajet', titre: 'Le trajet de l’échantillon', focus: ['scene', 'curseur'],
      texte: <>L’échantillon est <strong>nébulisé</strong> en fines gouttelettes, qui montent dans le <strong>canal central</strong> du plasma. Suivez une particule : la zone où elle se trouve est repérée par ◄ dans la légende.</>,
      tache: { type: 'qcm', q: 'Quelle étape suit la nébulisation, dans le canal central ?', ...QCM.trajet,
        expl: 'Dans le canal central, les gouttelettes sèchent (désolvatation) puis se vaporisent. Dans la zone la plus chaude du plasma, les molécules sont cassées en atomes libres, qui sont excités et émettent.', indice: 'Regardez la forme de la particule : goutte, puis grain, puis atome.' } },
    { id: 'temperature', titre: 'Plus chaud, plus de raies', focus: ['scene', 'curseur'],
      texte: <>Voici le spectre de la lumière d’un échantillon qui contient <strong>six éléments</strong>, chacun à 1{NB}mg/L : Na, Ca, Mg, Cu, Fe, Zn. Chaque photon détecté ajoute un trait à sa longueur d’onde (3 000 photons). Faites monter la température de 2 000 K (flamme) à 6 500 K (plasma).</>,
      tache: { type: 'qcm', q: 'Quand la température passe de 2 500 K à 6 500 K, les raies visibles…', ...QCM.temperature,
        expl: 'À 2 500 K, presque seul le sodium (raie peu énergétique, 589 nm) est excité. À 6 500 K, les chocs sont assez violents pour exciter aussi Cu, Mg, Fe, Zn : leurs raies, dans l’ultraviolet, apparaissent.', indice: 'Comptez les éléments étiquetés à 2 500 K, puis à 6 500 K.' } },
    { id: 'energie', titre: 'Pourquoi les raies UV demandent un plasma', focus: ['scene', 'curseur'],
      texte: <>La raie du zinc est à <strong>213,9{NB}nm</strong>, dans l’ultraviolet. Plus la longueur d’onde est courte, plus l’écart d’énergie entre les deux niveaux est grand, donc plus les chocs doivent être violents. Constante : h·c = 1240{NB}eV·nm.</>,
      tache: { type: 'num', q: 'Écart d’énergie entre les deux niveaux du zinc', unite: 'eV', vrai: 5.797, tol: 0.02, affiche: v => fr(v, 2), cs: 3,
        calcul: () => ['E = h·c / λ = 1240 / 213,9 = 5,80 eV.', 'Hypothèse : la raie est assimilée à une seule longueur d’onde. C’est presque trois fois l’écart du sodium (2,10 eV) : il faut un milieu bien plus chaud.'],
        pieges: [[0.1725, 'Vous avez divisé λ par h·c : il faut diviser h·c par λ.'], [5797, 'Erreur d’une puissance de 10 : λ est en nm et h·c = 1240 eV·nm donne directement des eV.'], [9.29e-19, 'Cette valeur est en joules ; l’énoncé demande des eV.']],
        expl: 'E = 1240 / 213,9 ≈ 5,80 eV : presque trois fois celui du sodium (2,10 eV). Une flamme à 2 500 K n’excite pratiquement aucun atome de zinc ; un plasma, si.', indice: 'E(eV) = 1240 / λ(nm).' } },
    { id: 'spectre', titre: 'Lire un spectre multi-éléments', focus: ['scene', 'curseur'],
      texte: <>On revient à 6 500 K. Chaque pic est la raie d’un élément, que sa longueur d’onde permet d’identifier (nm) : {REFERENCE}. <strong>Les six éléments sont tous à 1{NB}mg/L</strong>, pourtant les pics n’ont pas la même hauteur.</>,
      tache: { type: 'qcm', q: 'À concentration égale, les raies n’ont pas la même hauteur parce que…', ...QCM.spectre,
        expl: 'Chaque raie a sa propre énergie, donc sa propre probabilité d’excitation (et d’ionisation). À concentration égale, l’intensité diffère d’un élément à l’autre : on étalonne chaque élément séparément, avec ses propres étalons.', indice: 'Souvenez-vous de l’étape sur l’énergie : toutes les raies ont-elles le même écart d’énergie ?' } },
    { id: 'ionisation', titre: 'Trop chaud : l’ionisation', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Faites maintenant monter la température de 5 000 K à 9 000 K en lisant l’intensité de la raie du <strong>sodium</strong> (Mesures). À très haute température, un atome peut perdre un électron : il devient un <strong>ion</strong>, qui n’émet plus la raie de l’atome neutre.</>,
      tache: { type: 'qcm', q: 'Quand on passe de 6 500 K à 9 000 K, l’intensité de la raie du sodium…', ...QCM.ionisation,
        expl: 'Plus T augmente, plus les atomes de sodium sont ionisés (leur énergie d’ionisation est faible, 5,14 eV) : il reste moins d’atomes neutres pour émettre la raie atomique, malgré une excitation plus facile. Une température plus élevée n’est donc pas toujours un avantage.', indice: 'Regardez la ligne « Atomes de sodium non ionisés » et la ligne d’intensité de la raie.' } },
    { id: 'poly', titre: 'Le polychromateur : tout en même temps', focus: ['scene', 'curseur'],
      texte: <>La lumière du plasma entre par une <strong>fente</strong> et tombe sur un <strong>réseau</strong> qui la disperse : chaque longueur d’onde part dans une direction différente et arrive sur son propre pixel. Choisissez un élément et regardez le trajet d’un photon.</>,
      tache: { type: 'qcm', q: 'Un polychromateur mesure plusieurs éléments en même temps parce que…', ...QCM.poly,
        expl: 'Le réseau étale le spectre sur un détecteur à pixels : chaque longueur d’onde arrive sur un pixel différent, et tous les pixels sont lus simultanément. Il n’y a pas besoin de changer de longueur d’onde ni de lampe entre deux éléments.', indice: 'Regardez où arrive le photon quand vous changez d’élément.' } },
    { id: 'gamme', titre: 'Une gamme de dosage très étendue', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Comparez, pour le <strong>cuivre</strong>, le signal de l’ICP (échelles logarithmiques) et l’absorbance de l’absorption atomique (échelles linéaires). Déplacez la concentration de 0,001 à 1 000{NB}mg/L, puis placez-la sur <strong>100{NB}mg/L</strong>.</>,
      tache: { type: 'qcm', q: 'À 100 mg/L, la mesure par absorption atomique est…', ...QCM.gamme,
        expl: 'En absorption atomique, l’absorbance cesse d’être proportionnelle à la concentration au-delà d’une dizaine de mg/L : la courbe s’infléchit puis plafonne vers 2, car presque plus de lumière n’arrive au détecteur (il ne reste que la lumière parasite). Il faut diluer. En ICP, le signal reste proportionnel sur plusieurs décades.', indice: 'Comparez la courbe de l’absorbance à la droite pointillée, à 100 mg/L.' } },
    { id: 'dilution', titre: 'Diluer pour entrer dans la plage', focus: ['scene', 'curseur', 'mesures'],
      texte: <>En absorption atomique, la droite d’étalonnage du cuivre n’est linéaire que jusqu’à <strong>10{NB}mg/L</strong>. Un échantillon contient <strong>400{NB}mg/L</strong> de cuivre.</>,
      tache: { type: 'num', q: 'Facteur de dilution minimal', unite: '', vrai: 40, tol: 0.05, affiche: v => fr(v, 0), cs: 2,
        calcul: () => ['Facteur de dilution = 400 / 10 = 40.', 'Il faut diluer au moins 40 fois (par exemple 1 mL complété à 40 mL). En ICP, 400 mg/L est dans la plage : aucune dilution n’est nécessaire.'],
        pieges: [[0.025, 'Vous avez inversé le rapport : le facteur de dilution est supérieur à 1.'], [390, 'Un facteur de dilution est un rapport de concentrations, pas une différence.'], [4, 'Erreur d’une puissance de 10 sur le résultat.']],
        expl: 'Facteur = 400 / 10 = 40 : on dilue au moins 40 fois pour tomber dans la plage linéaire de l’absorption atomique.', indice: 'Facteur de dilution = concentration de l’échantillon / concentration visée.' } },
    { id: 'etalonnage', titre: 'Étalonner en ICP', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Un étalon de zinc à <strong>1,0{NB}mg/L</strong> donne <strong>5 000{NB}coups/s</strong> à 213,9{NB}nm. L’échantillon donne <strong>12 500{NB}coups/s</strong>. Le blanc a déjà été soustrait.</>,
      tache: { type: 'num', q: 'Concentration en zinc de l’échantillon', unite: 'mg/L', vrai: 2.5, tol: 0.05, affiche: v => fr(v, 1), cs: 2,
        calcul: () => ['Le signal est proportionnel à la concentration : I = k·c, avec k = 5 000 / 1,0 = 5 000 coups/s par mg/L.', 'c = 12 500 / 5 000 = 2,5 mg/L.', 'Hypothèses : signal proportionnel à c (domaine linéaire de l’ICP), même zone de plasma, même raie et mêmes conditions pour l’étalon et l’échantillon.'],
        pieges: [[0.4, 'Vous avez inversé le rapport : c = c(étalon) × I(échantillon) / I(étalon).'], [25, 'Erreur d’une puissance de 10 sur le résultat.'], [8.5, 'La droite passe par l’origine : on ne soustrait pas les signaux.']],
        expl: 'k = 5 000 coups/s par mg/L, donc c = 12 500 / 5 000 = 2,5 mg/L : plus que l’étalon, car le signal est plus grand.', indice: 'Calculez k = I / c avec l’étalon, puis c = I / k.' } },
    { id: 'choisir', titre: 'Choisir la technique', focus: [],
      texte: <>On veut doser <strong>Zn, Cu, Fe et Pb</strong> dans une eau, entre 0,01 et 100{NB}mg/L, en <strong>une seule analyse</strong>.</>,
      tache: { type: 'qcm', q: 'Quelle technique est la mieux adaptée ?', ...QCM.choisir,
        expl: 'L’ICP excite tous ces éléments (raies UV comprises), mesure plusieurs raies en même temps avec un polychromateur et couvre une très large plage de concentrations. L’émission de flamme n’excite pas les raies UV ; l’absorption atomique exige une lampe par élément et une plage plus étroite.', indice: 'Souvenez-vous de ce que permettent le plasma, le polychromateur et la gamme de dosage.' } },
    { id: 'bilan', titre: 'Le bilan : pourquoi un plasma ?', focus: [],
      retenirTitre: 'À retenir : flamme ou plasma', retenir: <><SvgCarteComparaison/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>Plasma d’argon : gaz ionisé à plusieurs milliers de kelvins, entretenu par un courant haute fréquence.</li><li>Plus chaud : les raies UV sont excitées, mais l’ionisation finit par réduire les raies atomiques.</li><li>Polychromateur : plusieurs éléments en même temps ; chaque élément est étalonné avec ses propres étalons.</li><li>Signal proportionnel à c sur plusieurs décades : moins de dilutions qu’en absorption atomique.</li></ul></>,
      texte: <>Vous savez décrire la torche, expliquer pourquoi un plasma excite plus d’éléments qu’une flamme, lire un spectre multi-éléments, étalonner et choisir la technique. En exploration, détectez des photons un par un et construisez le spectre ; deux défis vous attendent.</> },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? ORDRE[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ne = Math.min(nv.etape, ORDRE.length - 1);
    if (ne !== Math.min(guide.etape, ORDRE.length - 1)) { const T = T0(ORDRE[ne]); setVie(s => ({ ...s, T, etat: spectre(T) })); setP(0); }
    setGuide(nv);
  };
  const sc = idE, cG = 10 ** vie.x;
  const apres = id => enGuide && etape >= ORDRE.indexOf(id);
  const gamme = ['gamme', 'dilution', 'etalonnage'].includes(sc);
  const elG = M.raie(vie.el);
  const sceneGuide = !enGuide ? null
    : sc === 'torche' || sc === 'trajet' ? <SceneTorche p={p}/>
    : sc === 'temperature' || sc === 'spectre' || sc === 'ionisation' ? <SceneSpectreICP etat={vie.etat}/>
    : sc === 'energie' ? <SceneNiveauxFlamme mode="emission" el={ZN} sc={1} p={p}/>
    : sc === 'poly' ? <ScenePolychromateur lam={elG.lam} p={p}/>
    : gamme ? <SceneGamme c={cG}/>
    : null;
  const curs = (id, lab_, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab_} style={{ width: '100%', accentColor: '#be185d' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab_, val, onCh, options) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const barreAnim = (<div style={{ marginTop: 6 }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => setAnim(a => !a)} aria-pressed={!anim} style={stylePetitBouton(!anim, '#334155')}>{anim ? '⏸ Pause' : '▶ Lecture'}</button>
      <label htmlFor="ic-p" style={{ ...libelle, margin: 0 }}>Avancement</label>
    </div>
    <input id="ic-p" type="range" min="0" max="100" step="1" value={Math.round(p * 100)} onChange={ev => { setAnim(false); setP(parseInt(ev.target.value, 10) / 100); }} aria-label="Avancement de l’animation" style={{ width: '100%', accentColor: '#be185d' }}/>
  </div>);
  const sliderT = (id, min, max) => curs(id, `Température du milieu : ${fmtS(vie.T)} K (${fmtS(vie.T - 273)} °C)`, vie.T, min, max, 500, ev => { const T = parseInt(ev.target.value, 10); setVie(v => ({ ...v, T, etat: spectre(T) })); }, 'Chaque déplacement du curseur prend un nouveau spectre.');
  const sliderC = id => curs(id, `Concentration en cuivre : ${fmtC(cG)} mg/L`, vie.x, -3, 3, 0.25, ev => setVie(v => ({ ...v, x: parseFloat(ev.target.value) })), 'Échelle logarithmique : le curseur parcourt six décades.');
  const curseurGuide = !enGuide ? null
    : sc === 'torche' || sc === 'trajet' || sc === 'energie' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{barreAnim}</div>
    : sc === 'temperature' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{sliderT('ic-T', 2000, 6500)}</div>
    : sc === 'ionisation' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{sliderT('ic-T2', 5000, 9000)}</div>
    : sc === 'spectre' ? <div style={{ ...styleBoite, ...cadre('curseur') }}><button onClick={() => setVie(v => ({ ...v, etat: spectre(v.T) }))} style={styleBouton(false)}><Pic n="refresh"/>Nouveau tirage de 3 000 photons</button></div>
    : sc === 'poly' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{selecteur('ic-el', 'Élément', vie.el, ev => setVie(v => ({ ...v, el: ev.target.value })), M.ECH.map(s => ({ id: s, nom: `${M.raie(s).nom} (${fr(M.raie(s).lam, 1)} nm)` })))}{barreAnim}</div>
    : gamme ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{sliderC('ic-c')}</div>
    : null;
  const na = M.raie('Na');
  const lignesGuide = !enGuide ? [] : (sc === 'ionisation' ? [['Température', `${fmtS(vie.T)}${NB}K`], ['Intensité de la raie Na (100 = flamme à 2 500 K)', fmtS(M.intensiteRel('Na', vie.T))], ['Atomes de sodium non ionisés', `${fr(100 * M.fractionNeutre(na, vie.T), M.fractionNeutre(na, vie.T) < 0.1 ? 2 : 0)}${NB}%`]]
    : gamme && apres('gamme') ? [['Concentration en cuivre', `${fmtC(cG)}${NB}mg/L`], ['Signal ICP', `${fmtS(M.signalICP(cG))}${NB}coups/s`], ['Absorbance en absorption atomique', fr(M.absorbanceSAA(cG), 2)], ['Plage linéaire (absorption atomique)', `${fr(M.plageSAA[0], 2)} à ${M.plageSAA[1]}${NB}mg/L`]] : []);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  // ---------- défis ----------
  const nouveauDefi = kind => {
    if (kind === 'raie') { const t = M.tirageDefiRaie(Math.random); setDefi({ kind, ...t, etat: M.lancer(M.etatVide(M.T_PLASMA), M.T_PLASMA, 400, Math.random, [t.r.s]), rep1: '', rep2: '', verifie: false }); }
    else setDefi({ kind, ...M.tirageDefiDosage(Math.random), rep1: '', verifie: false });
  };
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const maj = f => setDefi(x => ({ ...x, ...f, verifie: false }));
  const verifier = () => {
    if (defi.kind === 'raie') { const E = M.energieEV(defi.r.lam), ok1 = defi.rep1 === defi.r.s, ok2 = Math.abs(num2(defi.rep2) - E) <= 0.05 * E; noterR(ok1 && ok2); setDefi(x => ({ ...x, verifie: true, ok: ok1 && ok2, ok1, ok2 })); }
    else { const ok = Math.abs(num2(defi.rep1) - defi.vrai) <= 0.05 * defi.vrai; noterD(ok); setDefi(x => ({ ...x, verifie: true, ok })); }
  };
  const dR = defi?.kind === 'raie';
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['raie', 'Identifier une raie'], ['dosage', 'Doser par ICP']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#be185d')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{dR ? 'Défi : quel élément émet cette raie ?' : 'Défi : doser un élément par ICP'}</div>
      {dR ? <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>Un échantillon ne contient qu’un seul élément. Le spectre ci-dessous (400 photons) montre une raie à <strong>{fr(defi.r.lam, 1)}{NB}nm</strong>. Raies de référence (nm) : {REFERENCE}.</div>
        <div style={{ maxWidth: 480, margin: '6px auto' }}><SceneSpectreICP etat={defi.etat} liste={[defi.r.s]} noms={false}/></div>
        {selecteur('ic-d1', 'Élément', defi.rep1, ev => maj({ rep1: ev.target.value }), [{ id: '', nom: '— choisir —' }, ...defi.choix.map(r => ({ id: r.s, nom: `${r.nom} (${r.s})` }))])}
        <div style={{ marginTop: 8 }}><label htmlFor="ic-d2" style={libelle}>Écart d’énergie de la transition (eV)</label><input id="ic-d2" inputMode="decimal" value={defi.rep2} onChange={ev => maj({ rep2: ev.target.value })} style={{ ...selectStyle, maxWidth: 220 }} autoComplete="off"/></div>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Comparez la longueur d’onde de la raie à la liste de référence. Pour l’énergie : E(eV) = 1240 / λ(nm).</IndiceDefi></div></>
      : <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>On dose le {defi.r.nom} ({defi.r.s}) d’une eau par ICP, à {fr(defi.r.lam, 1)}{NB}nm, dans le domaine linéaire. Un étalon à <strong>{fr(defi.cEt, 1)}{NB}mg/L</strong> donne <strong>{fmtS(defi.IEt)}{NB}coups/s</strong>. L’échantillon donne <strong>{fmtS(defi.I)}{NB}coups/s</strong> (blanc soustrait). Quelle est sa concentration ?</div>
        <div style={{ marginTop: 8 }}><label htmlFor="ic-d1" style={libelle}>Concentration (mg/L)</label><input id="ic-d1" inputMode="decimal" value={defi.rep1} onChange={ev => maj({ rep1: ev.target.value })} style={{ ...selectStyle, maxWidth: 220 }} autoComplete="off"/></div>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Le signal est proportionnel à la concentration : c = c<sub>étalon</sub> × I<sub>échantillon</sub> / I<sub>étalon</sub>.</IndiceDefi></div></>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}{dR ? `Réponse : ${defi.r.nom} (${defi.r.s}), E = 1240 / ${fr(defi.r.lam, 1)} ≈ ${fr(M.energieEV(defi.r.lam), 2)}${NB}eV.` : `Réponse : c = ${fr(defi.cEt, 1)} × ${fmtS(defi.I)} / ${fmtS(defi.IEt)} ≈ ${fr(defi.vrai, 2)}${NB}mg/L.`}
      </div>}
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#be185d')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const cE = 10 ** ex.x;
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{ex.onglet === 'spectre' ? 'Réglez la température du milieu' : ex.onglet === 'torche' ? 'Suivez l’échantillon' : 'Réglez la concentration'}</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{ex.onglet === 'spectre' ? 'Chaque photon détecté est tiré au hasard : la probabilité de chaque élément dépend de la température (excitation et ionisation). 2 500 K : flamme ; 6 500 K : plasma.' : ex.onglet === 'torche' ? 'La particule traverse quatre zones. La zone en cours est repérée par ◄.' : 'ICP (échelles logarithmiques) contre absorption atomique (échelles linéaires), pour le cuivre.'}</div>
      {ex.onglet === 'spectre' && <>
        {curs('ic-xt', `Température du milieu : ${fmtS(tir.T)} K (${fmtS(tir.T - 273)} °C)`, tir.T, M.T_MIN, M.T_MAX, 250, ev => tir.regler(parseInt(ev.target.value, 10)), 'Changer la température efface le spectre.')}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <button onClick={() => tir.regler(M.T_FLAMME)} aria-pressed={tir.T === M.T_FLAMME} style={stylePetitBouton(tir.T === M.T_FLAMME, '#be185d')}>Flamme (2 500 K)</button>
          <button onClick={() => tir.regler(M.T_PLASMA)} aria-pressed={tir.T === M.T_PLASMA} style={stylePetitBouton(tir.T === M.T_PLASMA, '#be185d')}>Plasma (6 500 K)</button>
        </div></>}
      {ex.onglet === 'torche' && <div style={{ marginTop: 8 }}>{barreAnim}</div>}
      {ex.onglet === 'gamme' && curs('ic-xc', `Concentration en cuivre : ${fmtC(cE)} mg/L`, ex.x, -3, 3, 0.25, ev => setEx(e => ({ ...e, x: parseFloat(ev.target.value) })), 'Au-delà de 10 mg/L, l’absorbance quitte la droite.')}
    </div>);
  const pilules = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
      {[['spectre', 'Spectre et tirages'], ['torche', 'La torche'], ['gamme', 'Gamme de dosage']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, onglet: k }))} aria-pressed={ex.onglet === k} style={stylePetitBouton(ex.onglet === k, '#be185d')}>{l}</button>)}
    </div>);
  const evtTexte = lotT ? `Bilan du dernier paquet : ${tir.etat.lotRes ?? 0} photons détectés.` : `${demoSc != null ? 'Scénario joué seul.' : texteEvenementIcp(dernier) + '.'}`;
  const voletScene = (
    <div style={styleBoite}>
      {pilules}
      {ex.onglet === 'spectre' ? <>
        <SceneSpectreICP etat={tir.etat}/>
        <div aria-hidden="true" style={{ fontSize: 14.5, fontWeight: 700, color: '#9d174d', minHeight: 44, lineHeight: 1.4, margin: '8px 0 4px' }}>{lotT ? 'Les photons défilent trop vite pour être animés un par un : voici le bilan du dernier paquet. « × 10 » et « × 100 » montrent chaque photon.' : (demoSc != null ? 'Scénario seul. ' : '') + legendeIcp(phAff, pAff)}</div>
        <div className="ic-at">
          <ScenePolychromateur lam={phAff ? phAff.lam : null} p={phAff ? pAff : 0}/>
          <PanneauScenariosIcp T={tir.T} etat={tir.etat} courant={lotT || demoSc != null ? (demoSc ?? -1) : (phAff && pAff >= 0.4 ? M.ECH.indexOf(phAff.s) : -1)} demo={tir.demo} prog={progT} tir={tir}/>
        </div>
        <div role="status" aria-live="polite" style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, margin: '4px 0 8px', minHeight: 42 }}>{evtTexte}</div>
        <CommandesTiragesIcp tir={tir}/></>
      : ex.onglet === 'torche' ? <SceneTorche p={p}/>
        : <SceneGamme c={cE}/>}
    </div>);
  const zone = Math.min(3, Math.floor(p * 4));
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {ex.onglet === 'spectre' ? <>
        <LigneMesure nom="Température du milieu" valeur={`${fmtS(tir.T)}${NB}K`}/>
        <LigneMesure nom="Photons détectés" valeur={fmtS(tir.etat.n)}/>
        <LigneMesure nom="Dernier photon" valeur={dernier && !lotT ? `${M.raie(dernier.s).nom}, ${fr(dernier.lam, 1)}${NB}nm, ${fr(M.energieEV(dernier.lam), 2)}${NB}eV` : '—'}/>
        <LigneMesure nom="Intensité de la raie Na (100 = flamme à 2 500 K)" valeur={fmtS(M.intensiteRel('Na', tir.T))}/>
        <LigneMesure nom="Intensité de la raie Zn (100 = Na, flamme à 2 500 K)" valeur={M.intensiteRel('Zn', tir.T) < 0.01 ? M.intensiteRel('Zn', tir.T).toExponential(0).replace('.', ',') : fr(M.intensiteRel('Zn', tir.T), 1)}/></>
      : ex.onglet === 'torche' ? <>
        <LigneMesure nom="Zone en cours" valeur={`${zone + 1}. ${['Nébuliseur', 'Canal central', 'Plasma', 'Zone d’analyse'][zone]}`}/>
        <LigneMesure nom="Température du plasma" valeur={`≈ ${fmtS(M.T_PLASMA)}${NB}K (jusqu’à 10${NB}000${NB}K)`}/></>
      : <>
        <LigneMesure nom="Concentration en cuivre" valeur={`${fmtC(cE)}${NB}mg/L`}/>
        <LigneMesure nom="Signal ICP" valeur={`${fmtS(M.signalICP(cE))}${NB}coups/s`}/>
        <LigneMesure nom="Absorbance en absorption atomique" valeur={fr(M.absorbanceSAA(cE), 2)}/>
        <LigneMesure nom="Plage linéaire de l’absorption atomique" valeur={`${fr(M.plageSAA[0], 2)} à ${M.plageSAA[1]}${NB}mg/L`}/>
        <LigneMesure nom="Plage de l’ICP" valeur={`${fr(M.plageICP[0], 3)} à ${fmtS(M.plageICP[1])}${NB}mg/L`}/></>}
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Spectre et tirages : à 2 500 K, envoyez 1000 photons. Quels éléments voit-on ? Passez à 6 500 K et recommencez.</li>
      <li>Spectre et tirages : à 6 500 K, comparez la fréquence obtenue de chaque élément à la probabilité prévue (tableau des scénarios).</li>
      <li>Spectre et tirages : montez à 9 000 K. Que devient la part du sodium, et pourquoi (ionisation) ?</li>
      <li>Spectre et tirages : touchez un scénario et regardez le photon traverser le polychromateur au ralenti. Où arrive un photon de 213,9 nm par rapport à un photon de 589 nm ?</li>
      <li>La torche : arrêtez l’animation sur chaque zone et décrivez ce qui arrive à la particule.</li>
      <li>Gamme de dosage : montez la concentration de 0,001 à 1 000 mg/L. À partir de quelle valeur l’absorbance quitte-t-elle la droite ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>ICP : plasma d’argon à plusieurs milliers de kelvins, entretenu par un courant haute fréquence</li>
        <li>E(eV) = 1240 / λ(nm) : plus la raie est dans l’UV, plus il faut un milieu chaud</li>
        <li>Plus chaud : plus de raies excitées, mais l’ionisation réduit les raies atomiques</li>
        <li>Polychromateur : un réseau disperse la lumière, un pixel par longueur d’onde, plusieurs éléments à la fois</li>
        <li>Signal ∝ c sur plusieurs décades ; chaque élément a ses étalons</li>
      </ul>
    </ARetenir>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Valeurs</strong> : ordres de grandeur arrondis (raies atomiques de résonance, températures : flamme ≈ 2 500 K, plasma ≈ 6 500 K, zone chaude jusqu’à 10 000 K). Elles ne remplacent pas les données d’un constructeur ou d’un TP.</li>
      <li><strong>Excitation thermique</strong> : proportion d’atomes excités = (g*/g₀) · exp(−E / kT) (loi de Boltzmann), bornée par f/(1 + f) quand la population excitée n’est plus négligeable ; équilibre thermique local supposé.</li>
      <li><strong>Ionisation</strong> : équilibre de Saha simplifié. La densité électronique est supposée augmenter avec la température : 10¹⁷ m⁻³ à 2 500 K (flamme), 10²¹ m⁻³ à 6 500 K (plasma), interpolée entre les deux en échelle logarithmique, puis constante. En réalité elle dépend du gaz, de la puissance et de l’échantillon. Seuls les atomes neutres émettent la raie atomique (les raies ioniques, très utilisées en pratique, ne sont pas représentées).</li>
      <li><strong>Échantillon</strong> : six éléments à la même concentration ; l’intensité d’une raie est proportionnelle à (atomes neutres) × (proportion excitée). La probabilité de transition de chaque raie et l’énergie des photons ne sont pas prises en compte : les intensités relatives réelles diffèrent. Un photon détecté est tiré au hasard avec la probabilité de la raie (tirages indépendants), la longueur d’onde étant étalée autour de la raie selon une loi normale d’écart-type 0,3 nm.</li>
      <li><strong>Polychromateur</strong> : réseau de 1 200 traits/mm, incidence normale, ordre 1 (schéma simplifié ; les appareils réels utilisent des réseaux à échelettes et plusieurs ordres).</li>
      <li><strong>Gamme de dosage</strong> : signal ICP proportionnel à c de 0,001 à 1 000 mg/L (six décades : valeur optimiste, on compte plutôt 4 à 6 décades selon l’élément et la raie). Absorbance du cuivre en absorption atomique : loi de Beer-Lambert A = 0,13·c, limitée par la lumière parasite du monochromateur (0,5 % de la lumière atteint le détecteur sans traverser la flamme) ; l’écart à la droite reste sous 5 % jusqu’à 10 mg/L, puis l’absorbance plafonne vers 2,3. Valeurs illustratives.</li>
      <li><strong>Hors modèle</strong> : interférences spectrales et chimiques, effets de matrice, étalon interne, vues axiale et radiale, bruit du détecteur, raies ioniques, couplage à la spectrométrie de masse.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ic-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ic-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ic-col { display: flex; flex-direction: column; gap: 12px; }
        .ic-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .ic-l1.cote .ic-carte { order: 2; } .ic-l1.cote .ic-main { order: 1; }
          .ic-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .ic-ex > * { grid-column: 1; }
          .ic-ex > .ic-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        .ic-at { display: grid; gap: 10px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .ic-at { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); } }
        .ic-sc { transition: background 0.3s, transform 0.3s; } .ic-sc.on { transform: scale(1.02); font-weight: 600; }
        @media (prefers-reduced-motion: reduce) { .ic-sc { transition: none; } .ic-sc.on { transform: none; } }
        @media (max-width: 900px) { .ic-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ic-in { animation: ic-fondu 0.35s ease-out; } @keyframes ic-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>ICP : pourquoi un plasma ?</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Dans un <strong>plasma d’argon</strong>, bien plus chaud qu’une flamme, presque tous les éléments émettent de la lumière. Un réseau sépare les longueurs d’onde : on dose <strong>plusieurs éléments à la fois</strong>, sur une très large plage de concentrations.</div>
      {enGuide && <div className="ic-l1 cote">
        <div className="ic-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="ic-main">
          <div className="ic-col">
            {sceneBloc && <div className="ic-in">{sceneBloc}</div>}
            {curseurGuide && <div className="ic-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="ic-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'raie' ? suiviR : suiviD}/></div>}
      {enExplore && <>
        <div className="ic-ex">
          {voletScene}
          <div className="ic-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
