import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./frxModele";
import { QCM } from "./frxQcm";
import { SceneAtomeAnim, SceneHistoX, CommandesTirages } from "./FrxTirages";
import { useTiragesX, useProgres } from "./frxTiragesHook";
import { texteAtome, legendePhase } from "./frxTirages";
import { SceneAtome, SceneSpectreX, SceneEtalonnage, SceneAppareil, SvgCarteTransitions, SvgCarteMoseley, SvgCarteBilanFrx } from "./FrxSchemas";

const SIM_ID = 302, CLE_GUIDE = 'frx-guide-v1';
declarerDefis(SIM_ID, [['element', 'Identifier un élément'], ['dosage', 'Doser par étalonnage']]);

// ====================================================
//  SIM 302 — FLUORESCENCE X : DE LA LACUNE À LA RAIE DE L'ÉLÉMENT (BTS MDC, Analyse)
//  Capacités visées (jamais affichées à l'élève) : décrire succinctement le principe d'une spectrométrie d'émission (fluorescence X) à partir d'un schéma ;
//  identifier les éléments de l'appareil ; exploiter un spectre pour déterminer la concentration d'une espèce ; choisir le type de spectrométrie adapté à une analyse.
//  Modèle : frxModele.js. Schémas : FrxSchemas.jsx.
// ====================================================

const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const NB = ' ';
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['seuil', 'retour', 'longueur', 'kbeta', 'element', 'moseley', 'intensite', 'legers', 'appareil', 'choisir', 'bilan'];
const BASE = { E: 5 };
const num2 = s => parseFloat(String(s).replace(/\s|\u00a0/g, '').replace(',', '.').replace('−', '-'));
const FE = M.element('Fe');
const FormuleKa = <FormuleEnLigne><mi>E</mi><mo>(</mo><mi>Kα</mi><mo>)</mo><mo>=</mo><msub><mi>E</mi><mi>K</mi></msub><mo>−</mo><msub><mi>E</mi><mi>L</mi></msub></FormuleEnLigne>;
const COMP_FE = [{ s: 'Fe', w: 10 }], COMP_ETAL = ['Ca', 'Ti', 'Fe', 'Zn'].map(s => ({ s, w: 10 }));
const ETAL_FE = [[2, 480], [5, 1200], [10, 2400]];

export function SimulationFluoX() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState(() => ({ ...BASE }));
  const [ex, setEx] = useState({ onglet: 'atome', el: 'Fe', E: 9, ech: 'laiton', raie: 'Cu' });
  const [ouv, setOuv] = useState({});
  const tir = useTiragesX(), progT = useProgres(tir.t.etat.nEnv * 1000 + tir.rejeu % 1000, tir.t.vitesse === 'lent' ? 4500 : 2800, tir.anime);
  const [suiviE, noterE] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('element');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'seuil', titre: 'Un photon X éjecte un électron de cœur', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Un échantillon de fer est irradié par des rayons X. L’énergie de liaison de l’électron de la couche <strong>K</strong> (la plus proche du noyau) vaut <strong>7,11{NB}keV</strong> (1{NB}keV = 1000{NB}eV). Faites varier l’énergie du photon X incident et regardez ce que devient l’électron K.</>,
      tache: { type: 'qcm', q: 'Pour éjecter un électron K, l’énergie du photon X doit être…', ...QCM.seuil,
        expl: 'L’électron est éjecté si le photon apporte au moins son énergie de liaison (le surplus devient l’énergie cinétique du photoélectron). En dessous, le photon ne peut pas l’éjecter.', indice: 'Balayez le curseur autour de 7 keV : à partir de quelle valeur l’électron part-il ?' } },
    { id: 'retour', titre: 'Le retour : une raie caractéristique', focus: ['scene'],
      texte: <>La lacune en K est instable : un électron de la couche <strong>L</strong> la comble et l’atome libère l’énergie sous la forme d’un photon X, la raie <strong>Kα</strong> : {FormuleKa}. Pour le fer, E<sub>K</sub> = 7,11{NB}keV et E<sub>L</sub> = 0,71{NB}keV (énergies de liaison).</>,
      tache: { type: 'num', q: 'Énergie de la raie Kα du fer', unite: 'keV', vrai: 6.4, tol: 0.02, affiche: v => fr(v, 2), cs: 3,
        calcul: () => ['E(Kα) = E_K − E_L = 7,11 − 0,71 = 6,40 keV.', 'Hypothèse : on néglige l’énergie de recul de l’atome. La valeur tabulée est 6,404 keV.'],
        pieges: [[7.82, 'Vous avez additionné les deux énergies : le photon emporte la différence entre les deux niveaux.'], [6400, 'La valeur est donnée en keV : 6400 serait en eV.'], [0.71, 'C’est l’énergie de liaison du niveau L, pas celle du photon émis.']],
        expl: 'Le photon emporte l’écart d’énergie entre les niveaux L et K : 7,11 − 0,71 = 6,40 keV.', indice: 'L’énergie du photon est la différence entre l’énergie de liaison K et celle de L.' } },
    { id: 'longueur', titre: 'Un photon X : de l’énergie à la longueur d’onde', focus: ['scene'],
      texte: <>Le photon Kα du fer a une énergie de 6,40{NB}keV. Pour un photon, <strong>E × λ = h·c = 1,243{NB}keV·nm</strong>.</>,
      tache: { type: 'num', q: 'Longueur d’onde du photon Kα du fer', unite: 'nm', vrai: 0.194, tol: 0.03, affiche: v => fr(v, 3), cs: 3,
        calcul: () => ['λ = h·c / E = 1,243 / 6,40 = 0,194 nm.', 'C’est le domaine des rayons X (λ très inférieure à 10 nm), de l’ordre de grandeur des distances entre atomes.'],
        pieges: [[7.96, 'Vous avez multiplié l’énergie par h·c : il faut diviser h·c par l’énergie.'], [5.15, 'Vous avez divisé l’énergie par h·c : le rapport est inversé.'], [1.94, 'Il y a une erreur d’une puissance de 10 sur le résultat.']],
        expl: 'λ = 1,243 / 6,40 ≈ 0,194 nm : une longueur d’onde de l’ordre de la distance entre atomes, bien plus courte que celle de la lumière visible.', indice: 'λ(nm) = 1,243 / E(keV).' } },
    { id: 'kbeta', titre: 'Deux raies : Kα et Kβ', focus: ['scene'],
      texte: <>Un électron de la couche <strong>M</strong>, plus éloignée du noyau que L, peut aussi combler la lacune K : il émet la raie <strong>Kβ</strong>. Observez le spectre du fer (raies de 6,40 et 7,06{NB}keV).</>,
      tache: { type: 'qcm', q: 'La raie Kβ (M → K), comparée à Kα (L → K), est…', ...QCM.kbeta,
        expl: 'Le niveau M est plus haut que L : l’écart M → K est plus grand, donc Kβ est plus énergétique (7,06 contre 6,40 keV). Mais la transition M → K est moins probable : la raie est moins intense (environ 15 % de Kα).', indice: 'Comparez la position et la hauteur des deux pics sur le spectre.' } },
    { id: 'element', titre: 'Chaque élément a ses raies', retenirTitre: 'À retenir : une raie, c’est un écart de niveaux', retenir: <SvgCarteTransitions/>, focus: ['scene'],
      texte: <>Les niveaux d’énergie dépendent de l’élément : ses raies sont une signature. Voici le spectre d’un laiton (alliage). Raies Kα (keV) : Fe 6,40 ; Ni 7,48 ; Cu 8,05 ; Zn 8,64.</>,
      tache: { type: 'qcm', q: 'Les deux pics principaux sont à 8,05 et 8,64 keV. Ils correspondent aux raies Kα de…', ...QCM.element,
        expl: 'L’énergie du pic identifie l’élément : 8,05 keV est la raie Kα du cuivre, 8,64 keV celle du zinc. Un laiton est bien un alliage cuivre-zinc.', indice: 'Comparez les énergies lues aux valeurs de Kα données dans le texte.' } },
    { id: 'moseley', titre: 'Plus Z est grand, plus la raie est énergétique', focus: ['scene'],
      texte: <>Voici les raies Kα de quatre éléments à teneurs égales : calcium (Z = 20), titane (22), fer (26) et zinc (30).</>,
      tache: { type: 'qcm', q: 'Pour un élément de numéro atomique Z plus grand, la raie Kα est…', ...QCM.moseley,
        expl: 'Quand Z augmente, la charge du noyau augmente : les électrons K sont plus liés et les niveaux plus écartés. Moseley (1913) : E(Kα) ≈ 10,2 × (Z − 1)² eV ; pour le fer, 10,2 × 25² ≈ 6,4 keV.', indice: 'Lisez les énergies des pics de gauche à droite : Ca, Ti, Fe, Zn.' } },
    { id: 'intensite', titre: 'Quelle quantité ? La hauteur du pic', focus: ['scene'],
      texte: <>Pour doser le fer dans un acier, on mesure l’intensité nette de sa raie Kα (fond continu soustrait). Trois étalons donnent la droite ci-contre. L’échantillon inconnu donne <strong>1560{NB}coups/s</strong>.</>,
      tache: { type: 'num', q: 'Teneur en fer de l’échantillon', unite: '%', vrai: 6.5, tol: 0.05, affiche: v => fr(v, 1), cs: 2,
        calcul: () => ['La droite passe par l’origine : I = a × w avec a = 2400 / 10 = 240 coups/s par %.', 'w = 1560 / 240 = 6,5 %.', 'Hypothèses : intensité nette proportionnelle à la teneur ; échantillon de composition proche des étalons (pas d’effet de matrice).'],
        pieges: [[0.15, 'Vous avez inversé le rapport : w = I(échantillon) / a, avec a en coups/s par %.'], [65, 'Il y a une erreur d’une puissance de 10 : 1560 / 240 = 6,5.'], [1560 / 1200 * 5 + 5, 'La droite passe par l’origine : on n’ajoute rien à la proportion.']],
        expl: 'I = 240 × w, donc w = 1560 / 240 = 6,5 % : la hauteur du pic est proportionnelle à la teneur.', indice: 'Calculez d’abord le coefficient directeur a = I / w avec un étalon.' } },
    { id: 'legers', titre: 'Les éléments légers', retenirTitre: 'À retenir : Kα augmente avec Z', retenir: <SvgCarteMoseley/>, focus: [],
      texte: <>Le sodium (Z = 11) ou l’oxygène sont très difficiles à détecter en fluorescence X, alors que le fer l’est très bien. La raie Kα du sodium est à 1,04{NB}keV.</>,
      tache: { type: 'qcm', q: 'Pourquoi un élément léger comme le sodium est-il difficile à détecter ?', ...QCM.legers,
        expl: 'La raie K d’un élément léger est très peu énergétique (Na : 1,04 keV) : l’air et la fenêtre du détecteur l’absorbent. De plus l’atome perd souvent son énergie autrement (effet Auger) : peu de photons X sont émis (rendement ≈ 4 % pour Al, ≈ 34 % pour Fe). On travaille sous vide ou sous hélium.', indice: 'Pensez à ce que devient un photon de 1 keV dans l’air.' } },
    { id: 'appareil', titre: 'Les éléments de l’appareil', focus: ['scene'],
      texte: <>Le spectromètre comprend un tube à rayons X, l’échantillon, un détecteur et un analyseur multicanal qui construit le spectre.</>,
      tache: { type: 'qcm', q: 'Le détecteur à dispersion d’énergie sert à…', ...QCM.appareil,
        expl: 'Chaque photon X reçu produit une impulsion proportionnelle à son énergie ; l’analyseur multicanal compte les photons par énergie, ce qui donne le spectre. Les rayons X primaires viennent du tube, et l’échantillon n’est ni dissous ni séparé.', indice: 'Le détecteur reçoit la fluorescence X de l’échantillon, il ne la produit pas.' } },
    { id: 'choisir', titre: 'Choisir la technique', focus: [],
      texte: <>La fluorescence X analyse directement un solide, une poudre ou un liquide, sans le détruire. Les techniques atomiques en solution demandent de dissoudre l’échantillon.</>,
      tache: { type: 'qcm', q: 'On veut contrôler sur place le plomb d’une peinture ancienne sur un mur, sans rien prélever ni détruire. Quelle technique choisir ?', ...QCM.choisir,
        expl: 'Seule la fluorescence X portable analyse la surface sur place, sans prélèvement ni mise en solution. L’absorption atomique, l’ICP et l’UV-visible exigent de prélever puis de dissoudre l’échantillon.', indice: 'Quelle technique ne demande ni prélèvement ni dissolution ?' } },
    { id: 'bilan', titre: 'Le bilan : de la lacune à la teneur', focus: [],
      retenirTitre: 'À retenir : ce que dit un spectre X', retenir: <><SvgCarteBilanFrx/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>Photon X ≥ E<sub>K</sub> : lacune K, puis raies Kα (L → K) et Kβ (M → K).</li><li>E(raie) = écart entre deux niveaux : elle identifie l’élément ; E × λ = 1,243 keV·nm.</li><li>Hauteur nette du pic ∝ teneur : étalonnage.</li></ul></>,
      texte: <>Vous savez décrire le principe de la fluorescence X, lire un spectre pour identifier les éléments, doser par étalonnage et choisir cette technique. En exploration, balayez l’énergie du photon incident pour chaque élément et lisez le spectre de trois échantillons ; les défis testent l’identification d’un élément et le dosage.</> },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? ORDRE[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    if (Math.min(nv.etape, ORDRE.length - 1) !== Math.min(guide.etape, ORDRE.length - 1)) setVie(() => ({ ...BASE }));
    setGuide(nv);
  };
  const sc = idE, ionG = M.ionise(FE, vie.E);
  const sceneGuide = !enGuide ? null
    : sc === 'seuil' ? <SceneAtome etat={ionG ? 'ejecte' : 'repos'} photon={vie.E} photonLabel={`${fr(vie.E, 1)} keV`}/>
    : sc === 'retour' ? <SceneAtome etat="saut" raies={['Kα']}/>
    : sc === 'longueur' ? <SceneAtome etat="saut" raies={['Kα 6,40 keV']}/>
    : sc === 'kbeta' ? <><SceneAtome etat="saut2" raies={['Kα', 'Kβ']}/><div style={{ height: 6 }}/><SceneSpectreX comp={COMP_FE} etiquettes={[[FE.Ka, 'L → K', 0, 'end'], [FE.Kb, 'M → K', 0, 'start']]} yMax={3000}/></>
    : sc === 'element' ? <SceneSpectreX comp={M.ECHANTILLONS.laiton.comp} etiquettes={[[8.048, '8,05', 0, 'end'], [8.639, '8,64', 0, 'start']]} titre="laiton"/>
    : sc === 'moseley' ? <SceneSpectreX comp={COMP_ETAL} etiquettes={['Ca', 'Ti', 'Fe', 'Zn'].map(s => [M.element(s).Ka, s, 0, 'middle'])} yMax={3600}/>
    : sc === 'intensite' ? <SceneEtalonnage points={ETAL_FE} wMax={12} IMax={3000}/>
    : sc === 'appareil' ? <SceneAppareil/>
    : null;
  const lignesGuide = enGuide && sc === 'seuil' ? [['Énergie du photon X incident', `${fr(vie.E, 1)}${NB}keV`], ['Électron K éjecté', ionG ? 'oui' : 'non']] : [];
  const curs = (id, lab_, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab_} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab_, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurGuide = enGuide && sc === 'seuil' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{curs('fx-e', `Énergie du photon X : ${fr(vie.E, 1)} keV`, vie.E, 1, 12, 0.1, ev => setVie(v => ({ ...v, E: parseFloat(ev.target.value) })), 'Le photon X vient du tube à rayons X.')}</div> : null;
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'element' ? { ...M.tirageDefiElement(Math.random), rep1: '', verifie: false } : { ...M.tirageDefiDosage(Math.random), rep1: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const maj = f => setDefi(x => ({ ...x, ...f, verifie: false }));
  const verifier = () => {
    let ok;
    if (defi.kind === 'dosage') { ok = Math.abs(num2(defi.rep1) - defi.vrai) <= 0.05 * defi.vrai; noterD(ok); }
    else { ok = defi.rep1 === defi.e.s; noterE(ok); }
    setDefi(x => ({ ...x, verifie: true, ok }));
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['element', 'Identifier un élément'], ['dosage', 'Doser par étalonnage']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'element' ? 'Défi : identifier un élément' : 'Défi : doser par étalonnage'}</div>
      {defi.kind === 'element' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Le spectre de fluorescence X d’un échantillon présente un pic principal à <strong>{fr(defi.e.Ka, 2)}{NB}keV</strong> (raie Kα). Quel élément est responsable de ce pic ?</div>
        {selecteur('fx-d1', 'Élément', defi.rep1, ev => maj({ rep1: ev.target.value }), defi.choix.map(e => ({ id: e.s, nom: `${e.nom} (${e.s})` })), 'Choisir…')}</>
      : <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>On dose le(a) {defi.e.nom} ({defi.e.s}) par sa raie Kα. Un étalon à <strong>{fr(defi.wEt, 1)}{NB}%</strong> donne <strong>{defi.IEt}{NB}coups/s</strong> (intensité nette). L’échantillon donne <strong>{defi.I}{NB}coups/s</strong>. Quelle est sa teneur ? (2 chiffres significatifs ; précision attendue : 5 %).</div>
        <div style={{ marginTop: 8 }}><label htmlFor="fx-d2" style={libelle}>Teneur (%)</label><input id="fx-d2" inputMode="decimal" value={defi.rep1} onChange={ev => maj({ rep1: ev.target.value })} style={{ ...selectStyle, maxWidth: 220 }} autoComplete="off"/></div></>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'element'
        ? <>Raies Kα (keV) : Ca 3,69 ; Ti 4,51 ; Cr 5,41 ; Mn 5,90 ; Fe 6,40 ; Ni 7,48 ; Cu 8,05 ; Zn 8,64. Kα augmente avec Z.</>
        : <>L’intensité nette est proportionnelle à la teneur : w = w<sub>étalon</sub> × I<sub>échantillon</sub> / I<sub>étalon</sub>.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'element' ? <>Réponse : {defi.e.nom} ({defi.e.s}), Kα = {fr(defi.e.Ka, 2)}{NB}keV.</> : <>Réponse : w ≈ {fr(defi.vrai, 1)}{NB}%.</>}
      </div>}
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const el = M.element(ex.el), ionE = M.ionise(el, ex.E), ech = M.ECHANTILLONS[ex.ech];
  const raieOk = ech.comp.find(c => c.s === ex.raie) ?? ech.comp[0], elR = M.element(raieOk.s);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{ex.onglet === 'atome' ? 'Choisissez un élément et un photon X' : ex.onglet === 'tirages' ? 'Réglez l’échantillon puis irradiez des atomes' : 'Choisissez un échantillon'}</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{ex.onglet === 'tirages' ? 'Chaque atome touché par un photon X réagit au hasard. Chaque photon X émis qui arrive au détecteur ajoute un coup au spectre.' : ex.onglet === 'atome' ? 'Si le photon atteint le seuil K de l’élément, il éjecte un électron K et l’atome émet ses raies Kα et Kβ.' : 'Spectre en échelle logarithmique pour voir à la fois les éléments majeurs et les traces. Choisissez une raie pour lire son énergie et son intensité.'}</div>
      {ex.onglet === 'atome' && <>
        {selecteur('fx-el', 'Élément', ex.el, ev => setEx(e => ({ ...e, el: ev.target.value })), M.ELEMENTS.map(e => ({ id: e.s, nom: `${e.nom} (Z = ${e.Z})` })))}
        {curs('fx-ee', `Énergie du photon X incident : ${fr(ex.E, 1)} keV`, ex.E, 0.5, 12, 0.1, ev => setEx(e => ({ ...e, E: parseFloat(ev.target.value) })), 'Le repère violet du spectre est le seuil K de l’élément.')}</>}
      {ex.onglet === 'tirages' && <>
        {selecteur('fx-te', 'Élément étudié', tir.t.el, ev => tir.regler({ el: ev.target.value }), M.ELEMENTS.map(e => ({ id: e.s, nom: `${e.nom} (Z = ${e.Z})` })))}
        {curs('fx-tE', `Énergie du photon X incident : ${fr(tir.t.E, 1)} keV`, tir.t.E, 0.5, 12, 0.1, ev => tir.regler({ E: parseFloat(ev.target.value) }), `Seuil K de l’élément : ${fr(tir.el.EK, 2)} keV.`)}
        {selecteur('fx-tw', 'Proportion d’atomes de l’élément dans l’échantillon', String(tir.t.w), ev => tir.regler({ w: parseFloat(ev.target.value) }), [5, 10, 20, 50, 100].map(w => ({ id: String(w), nom: `${w} %` })))}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 14, color: KIT.txt }}><input type="checkbox" checked={tir.t.courbe} onChange={ev => tir.regler({ courbe: ev.target.checked })} style={{ width: 20, height: 20 }}/>Afficher la forme attendue (courbe en pointillés)</label></>}
      {ex.onglet === 'echantillon' && <>
        {selecteur('fx-ec', 'Échantillon', ex.ech, ev => setEx(e => ({ ...e, ech: ev.target.value, raie: M.ECHANTILLONS[ev.target.value].comp[0].s })), Object.entries(M.ECHANTILLONS).map(([id, m]) => ({ id, nom: m.nom })))}
        {selecteur('fx-er', 'Raie étudiée (Kα)', raieOk.s, ev => setEx(e => ({ ...e, raie: ev.target.value })), ech.comp.map(c => ({ id: c.s, nom: `${M.element(c.s).nom} (${c.s})` })))}</>}
    </div>);
  const pilules = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
      {[['atome', 'Un atome'], ['echantillon', 'Un échantillon'], ['tirages', 'Tirages']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, onglet: k }))} aria-pressed={ex.onglet === k} style={stylePetitBouton(ex.onglet === k, '#7c3aed')}>{l}</button>)}
    </div>);
  const voletScene = (
    <div style={styleBoite}>
      {pilules}
      {ex.onglet === 'tirages' ? <>
        <div aria-hidden="true" style={{ fontSize: 14.5, fontWeight: 700, color: '#4c1d95', minHeight: 44, lineHeight: 1.4, marginBottom: 4 }}>{tir.t.etat.lot > 1 ? 'Lot de plusieurs atomes : voici le dernier.' : legendePhase(tir.t.etat.dernier, progT)}</div>
        <SceneAtomeAnim d={tir.t.etat.dernier} p={progT}/>
        <div role="status" aria-live="polite" style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, margin: '4px 0 8px', minHeight: 42 }}>{tir.t.etat.lot > 1 ? `Dernier atome du lot : ${texteAtome(tir.t.etat.dernier, tir.el, tir.t.E)}.` : `${texteAtome(tir.t.etat.dernier, tir.el, tir.t.E)}.`}</div>
        <SceneHistoX etat={tir.t.etat} params={tir.t} el={tir.el} courbe={tir.t.courbe}/><div style={{ marginTop: 10 }}><CommandesTirages tir={tir}/></div></>
      : ex.onglet === 'atome' ? <><SceneAtome etat={ionE ? 'saut2' : 'repos'} photon={ex.E} photonLabel={`${fr(ex.E, 1)} keV`} raies={[`Kα ${fr(el.Ka, 2)} keV`, `Kβ ${fr(el.Kb, 2)} keV`]}/><div style={{ height: 6 }}/>
        <SceneSpectreX comp={ionE ? [{ s: el.s, w: 10 }] : []} yMax={3600} marques={[[el.EK, `seuil K ${fr(el.EK, 2)}`, '#7c3aed', el.EK <= ex.E ? 'end' : 'start'], [ex.E, 'photon X', '#2563eb', el.EK <= ex.E ? 'start' : 'end']]}/></>
        : <SceneSpectreX comp={ech.comp} echelle="log" titre={ech.nom.split(' (')[0].toLowerCase()} etiquettes={ech.comp.map(c => [M.element(c.s).Ka, c.s, 0, 'middle'])} marques={[[elR.Ka, `${fr(elR.Ka, 2)}`]]}/>}
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {ex.onglet === 'tirages' ? <>
        <LigneMesure nom="Atomes irradiés" valeur={`${tir.t.etat.nEnv}`}/><LigneMesure nom="Électrons K éjectés" valeur={`${tir.t.etat.nIon}`}/>
        <LigneMesure nom="Photons Kα (L → K)" valeur={`${tir.t.etat.nKa}`}/><LigneMesure nom="Photons Kβ (M → K)" valeur={`${tir.t.etat.nKb}`}/>
        <LigneMesure nom="Effet Auger (pas de photon X)" valeur={`${tir.t.etat.nAuger}`}/>
        <LigneMesure nom="Photons X détectés par atome irradié" valeur={tir.t.etat.nEnv ? `${fr(100 * (tir.t.etat.nKa + tir.t.etat.nKb) / tir.t.etat.nEnv, 1)}${NB}%` : '—'}/></>
      : ex.onglet === 'atome' ? <>
        <LigneMesure nom="Numéro atomique Z" valeur={`${el.Z}`}/><LigneMesure nom="Seuil K (énergie de liaison)" valeur={`${fr(el.EK, 2)}${NB}keV`}/>
        <LigneMesure nom="Niveau L" valeur={`${fr(M.niveauL(el), 2)}${NB}keV`}/><LigneMesure nom="Raie Kα = E_K − E_L" valeur={`${fr(el.Ka, 2)}${NB}keV`}/>
        <LigneMesure nom="Raie Kβ" valeur={`${fr(el.Kb, 2)}${NB}keV`}/><LigneMesure nom="Longueur d’onde de Kα" valeur={`${fr(M.lamNm(el.Ka), 3)}${NB}nm`}/>
        <LigneMesure nom="Kα de Moseley, 10,2 (Z − 1)²" valeur={`${fr(M.moseley(el.Z), 2)}${NB}keV`}/>
        <LigneMesure nom="Photon incident" valeur={`${fr(ex.E, 1)}${NB}keV`}/><LigneMesure nom="Électron K éjecté" valeur={ionE ? 'oui : raies émises' : 'non : aucune raie'}/></>
      : <>
        <LigneMesure nom="Élément" valeur={`${elR.nom} (Z = ${elR.Z})`}/><LigneMesure nom="Raie Kα" valeur={`${fr(elR.Ka, 2)}${NB}keV`}/>
        <LigneMesure nom="Teneur" valeur={`${fr(raieOk.w, 0)}${NB}%`}/><LigneMesure nom="Intensité nette de Kα" valeur={`${Math.round(M.intensite(elR, raieOk.w))}${NB}coups/s`}/>
        <LigneMesure nom="Éléments détectés" valeur={ech.comp.map(c => c.s).join(', ')}/></>}
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Un atome : pour le fer, cherchez l’énergie minimale du photon qui fait apparaître les raies. À quoi correspond-elle ?</li>
      <li>Un atome : comparez Kα du calcium, du fer et du zinc. Vérifiez la formule de Moseley.</li>
      <li>Un échantillon : dans l’acier, quel élément a le pic le plus haut ? Est-ce celui de plus grande énergie ?</li>
      <li>Tirages : à 9 keV, fer à 100 %, irradiez 1000 atomes. Quelle fraction donne un photon Kα ? Quelle fraction donne un photon Kβ ?</li>
      <li>Tirages : doublez la proportion de l’élément. Que devient la hauteur du pic Kα pour le même nombre d’atomes irradiés ? Reliez-le au dosage.</li>
      <li>Tirages : choisissez l’aluminium. Pourquoi voit-on si peu de photons X ? (cherchez la ligne « Effet Auger »)</li>
      <li>Un échantillon : dans le ciment, quel élément très présent n’apparaît pas sur le spectre ? Pourquoi ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Photon X ≥ seuil K : éjection d’un électron K, lacune</li>
        <li>L → K : raie Kα ; M → K : raie Kβ (plus énergétique, moins intense)</li>
        <li>E(Kα) = E<sub>K</sub> − E<sub>L</sub> ; E × λ = 1,243 keV·nm</li>
        <li>Kα augmente avec Z : Kα ≈ 10,2 (Z − 1)² eV</li>
        <li>Énergie du pic : quel élément ; hauteur nette : quelle teneur (étalonnage)</li>
        <li>Non destructif ; éléments légers difficiles à détecter</li>
      </ul>
    </ARetenir>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Valeurs</strong> : énergies de seuil et de raies K tabulées, arrondies (keV). Kα = E<sub>K</sub> − E<sub>L</sub> et Kβ = E<sub>K</sub> − E<sub>M</sub>.</li>
      <li><strong>Spectres</strong> : schématiques (pics gaussiens de largeur 70 keV·10⁻³, fond continu simplifié). Intensité de Kβ prise à 15 % de Kα (3 % pour les éléments légers).</li>
      <li><strong>Quantification</strong> : intensité nette (fond soustrait) proportionnelle à la teneur, avec des sensibilités schématiques (coups/s par % massique). Hors modèle : effets de matrice, absorption, raies L, pics somme et d’échappement, superposition de raies.</li>
      <li><strong>Tirages</strong> : chaque atome irradié est tiré au hasard. Il appartient à l’élément avec la probabilité égale à la proportion choisie ; un photon d’énergie au moins égale au seuil K éjecte un électron K avec la probabilité fixée à 0,6 (valeur schématique) ; la lacune émet un photon X avec la probabilité du rendement de fluorescence de l’élément (sinon effet Auger) ; Kβ est tiré à 15 % de Kα (3 % pour les éléments légers). Les énergies détectées sont étalées par la résolution du détecteur (écart-type 0,07 keV). Simplifications : tous les photons émis sont détectés, pas d’absorption ni de fond continu, pas d’autres raies que Kα et Kβ.</li>
      <li><strong>Constantes</strong> : h·c = 1,243 keV·nm ; Moseley : Kα ≈ (3/4) × 13,6 eV × (Z − 1)² (précision d’environ 2 % pour Z de 13 à 30).</li>
      <li><strong>Échantillons</strong> : compositions types, teneurs en % massique des éléments détectés ; l’oxygène et les éléments légers ne sont pas vus.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fx-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fx-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fx-col { display: flex; flex-direction: column; gap: 12px; }
        .fx-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .fx-l1.cote .fx-carte { order: 2; } .fx-l1.cote .fx-main { order: 1; }
          .fx-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .fx-ex > * { grid-column: 1; }
          .fx-ex > .fx-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .fx-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .fx-in { animation: fx-fondu 0.35s ease-out; } @keyframes fx-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Fluorescence X : de la lacune à la raie de l’élément</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un photon X arrache un électron de cœur ; un électron d’une couche supérieure comble la lacune et l’atome émet un photon X dont l’<strong>énergie</strong> identifie l’élément et dont l’<strong>intensité</strong> donne sa teneur. Une analyse directe, sans destruction, des solides comme des liquides.</div>
      {enGuide && <div className="fx-l1 cote">
        <div className="fx-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="fx-main">
          <div className="fx-col">
            {sceneBloc && <div className="fx-in">{sceneBloc}</div>}
            {curseurGuide && <div className="fx-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="fx-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'element' ? suiviE : suiviD}/></div>}
      {enExplore && <>
        <div className="fx-ex">
          {voletScene}
          <div className="fx-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
