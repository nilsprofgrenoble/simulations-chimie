import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre } from "../commun";
import { Pic } from "../Pictos";
import * as W from "./winsorModele";
import { QCM } from "./winsorQcm";
import { SvgFlaconTP, SvgFlacons12, SvgCarteWinsor, SvgCarteSelWinsor } from "./WinsorSchemas";

const SIM_ID = 243, CLE_GUIDE = 'winsor-guide-v1';
declarerDefis(SIM_ID, [['optimum', 'Trouver la salinité optimale d’une série de flacons'], ['diagnostic', 'Diagnostiquer un flacon et corriger la formulation']]);

// ====================================================
//  SIM 243 — MICROÉMULSIONS : TYPES DE WINSOR ET EFFET DU SEL (BTS MDC, Formulation ; fil rouge : le TP de microémulsion, 12 flacons de 1 à 12 % de NaCl)
//  Capacités visées (jamais affichées à l'élève) : microémulsions (types de Winsor I à IV, effet de la salinité, formulation optimale) en préparation de l'exploitation d'un diagramme ternaire.
//  Modèle QUALITATIF : winsorModele.js. Schémas : WinsorSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const pc = v => `${Math.round(v * 100)} %`;
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const GAMME = W.A_MIN;

export function SimulationWinsor() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState({ S: 7, a: GAMME });                                           // scène du parcours
  const [ex, setEx] = useState({ S: 7, a: GAMME });                                             // exploration
  const [ouv, setOuv] = useState({});
  const [suiviO, noterO] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('optimum');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const xVie = W.etat(vie.S, vie.a);
  const MASSE_7 = W.masseSel(W.SAL_OPT);

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'emulsion', titre: 'Microémulsion et émulsion : quelle différence ?', focus: ['scene'],
      texte: <>Dans ce TP, on mélange de l’eau salée, du toluène et un « mélange actif » : le tensioactif <strong>SDS</strong> et un alcool, le <strong>butanol</strong>. On peut obtenir une <strong>microémulsion</strong> : un liquide de deux phases très finement dispersées l’une dans l’autre, qui reste limpide et se forme sans effort. Une émulsion classique, elle, est blanche et opaque.</>,
      tache: { type: 'qcm', q: 'Qu’est-ce qui distingue une microémulsion d’une émulsion classique ?', ...QCM.emulsion,
        expl: 'Les domaines d’une microémulsion mesurent 10 à 50 nm, beaucoup moins que la longueur d’onde de la lumière visible : elle est transparente. Elle est stable thermodynamiquement, se forme spontanément, et sa tension interfaciale huile-eau est très basse.', indice: 'Pensez à la taille des domaines (10 à 50 nm contre plus de 500 nm) et à ce que cela change pour la lumière.' } },
    { id: 'butanol', titre: 'Pourquoi un co-tensioactif avec le SDS ?', focus: ['scene'],
      texte: <>Le SDS est un tensioactif ionique à une seule chaîne. Seul, il n’abaisse pas assez la tension interfaciale huile-eau pour donner une microémulsion : sa concentration micellaire critique est atteinte avant. On lui associe un alcool à chaîne moyenne, le <strong>butanol</strong>, qui s’insère entre les molécules de SDS à l’interface : c’est le <strong>co-tensioactif</strong>.</>,
      tache: { type: 'qcm', q: 'Pourquoi associe-t-on du butanol au SDS ?', ...QCM.butanol,
        expl: 'Le SDS seul atteint sa CMC avant d’avoir assez abaissé la tension interfaciale. Le co-tensioactif complète le film interfacial et permet d’atteindre la tension très basse d’une microémulsion.', indice: 'Cherchez ce qui limite le SDS seul : sa CMC est atteinte avant que la tension soit assez basse.' } },
    { id: 'faible-sel', titre: 'Les flacons du TP : peu de sel', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Le TP prépare 12 flacons identiques : 0,5 g de SDS, 1 g de butanol, 12 g d’eau colorée au <strong>bleu de méthylène</strong> et 11,5 g de toluène coloré au <strong>rouge Soudan</strong>. Seule la <strong>salinité</strong> change, de 1 % à 12 % de NaCl par rapport à l’eau (1 % = 120 mg). Réglez la salinité à <strong>2 %</strong> et observez les phases après décantation.</>,
      tache: { type: 'action', ok: Math.abs(vie.S - 2) <= 0.5, consigne: 'Régler la salinité à 2 %' } },
    { id: 'winsor1', titre: 'Peu de sel : l’huile reste en excès', focus: ['scene', 'mesures'],
      texte: <>À faible salinité, on voit <strong>deux phases</strong> : le toluène (rouge) en excès au-dessus, et en dessous une <strong>microémulsion huile-dans-eau</strong>, qui contient toute l’eau et une partie de l’huile. C’est un système de <strong>Winsor I</strong>.</>,
      tache: { type: 'qcm', q: 'Dans ce système de Winsor I, dans quelle phase le tensioactif est-il le plus soluble ?', ...QCM.winsor1,
        expl: 'Le tensioactif est plus soluble dans l’eau : il se trouve dans la phase aqueuse, c’est-à-dire dans la microémulsion H/E. L’huile en excès n’en contient presque pas.', indice: 'La microémulsion est huile-dans-eau : l’eau est sa phase continue.' } },
    { id: 'fort-sel', titre: 'Beaucoup de sel : c’est l’eau qui reste en excès', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Augmentez maintenant la salinité jusqu’à <strong>11 %</strong>. Les phases s’inversent : on voit une <strong>microémulsion eau-dans-huile</strong> au-dessus, et de l’<strong>eau en excès</strong> en dessous. C’est un système de <strong>Winsor II</strong>.</>,
      tache: { type: 'action', ok: Math.abs(vie.S - 11) <= 0.5, consigne: 'Régler la salinité à 11 %' } },
    { id: 'sel', titre: 'Pourquoi le sel déplace le tensioactif vers l’huile', focus: ['scene', 'mesures'],
      texte: <>Plus la salinité augmente, moins le tensioactif est soluble dans l’eau, donc relativement plus soluble dans l’huile. C’est ce qui fait passer d’une microémulsion H/E (Winsor I) à une microémulsion E/H (Winsor II).</>,
      tache: { type: 'qcm', q: 'Pourquoi le SDS devient-il moins soluble dans l’eau quand on ajoute du NaCl ?', ...QCM.sel,
        expl: 'Les ions Na⁺ en solution écrantent les charges négatives des têtes sulfate : les têtes sont moins bien hydratées, le SDS est moins soluble dans l’eau et plus soluble, relativement, dans l’huile.', indice: 'Pensez à la charge portée par la tête polaire du SDS et à ce que font les ions du sel autour d’elle.' } },
    { id: 'optimum', titre: 'Entre les deux : la formulation optimale', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Entre ces deux comportements, il existe une salinité où le tensioactif se partage <strong>équitablement</strong> entre l’huile et l’eau. On observe alors <strong>trois phases</strong>. La <strong>formulation optimale</strong> est celle où la microémulsion est bicontinue et où l’huile en excès et l’eau en excès ont le <strong>même volume</strong>. Réglez la salinité pour l’obtenir, en comparant les volumes dans les mesures.</>,
      tache: { type: 'action', ok: W.estOptimum(vie.S), consigne: 'Régler la salinité pour que les deux excès aient le même volume' } },
    { id: 'phasesIII', titre: 'Winsor III : quelles sont les trois phases ?', focus: ['scene', 'mesures'],
      texte: <>À l’optimum, le flacon est un système de <strong>Winsor III</strong>. La phase du milieu est la microémulsion, riche en tensioactif.</>,
      tache: { type: 'qcm', q: 'Combien de phases observe-t-on dans un système de Winsor III, et lesquelles ?', ...QCM.phasesIII,
        expl: 'Trois phases : de l’huile en excès (en haut), la microémulsion bicontinue (au milieu, qui contient presque tout le tensioactif) et de l’eau en excès (en bas).', indice: 'Le Winsor III est entre le I (huile en excès) et le II (eau en excès) : il les a toutes les deux.' } },
    { id: 'sel-masse', titre: 'Préparer un flacon à la salinité optimale', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : les quatre types de Winsor', retenir: <>
        <SvgCarteWinsor/>
        <ul style={puces}>
          <li>Winsor I : microémulsion H/E + huile en excès. Winsor II : microémulsion E/H + eau en excès.</li>
          <li>Winsor III : microémulsion bicontinue entre deux excès. Winsor IV : une seule phase.</li>
        </ul></>,
      texte: <>La salinité optimale du système du TP est d’environ <strong>{W.SAL_OPT} %</strong> (valeur illustrative, proche de ce que l’on observe). Chaque flacon contient <strong>{W.MASSE_EAU} g d’eau</strong> et la salinité s’exprime en pourcentage massique de NaCl par rapport à l’eau : 1 % correspond à 120 mg.</>,
      tache: { type: 'num', q: `Masse de NaCl à ajouter aux ${W.MASSE_EAU} g d’eau pour atteindre ${W.SAL_OPT} %`, unite: 'g', vrai: MASSE_7, tol: 0.02, affiche: v => fr(v, 2), cs: 2,
        calcul: () => [`Salinité = m(NaCl) ÷ m(eau) × 100 = ${W.SAL_OPT} %.`, `m(NaCl) = ${W.SAL_OPT} % × ${W.MASSE_EAU} g = ${W.SAL_OPT} ÷ 100 × ${W.MASSE_EAU} = ${fr(MASSE_7, 2)} g.`, `Vérification avec la donnée du TP : 1 % = 120 mg, donc ${W.SAL_OPT} % = ${W.SAL_OPT} × 120 mg = ${fr(W.SAL_OPT * 120, 0)} mg = ${fr(MASSE_7, 2)} g.`],
        pieges: [[W.SAL_OPT, 'Vous avez donné le pourcentage : il faut calculer la masse correspondante, en grammes, pour 12 g d’eau.'], [MASSE_7 / 10, 'Décalage d’une puissance de 10 : 7 % de 12 g, c’est 7 ÷ 100 × 12.'], [MASSE_7 * 10, 'Décalage d’une puissance de 10 : 1 % de 12 g vaut 0,12 g, pas 1,2 g.']],
        expl: `m(NaCl) = 7 ÷ 100 × 12 = ${fr(MASSE_7, 2)} g, soit 7 × 120 mg.`, indice: 'La salinité est une masse de sel divisée par la masse d’eau, en pourcentage : m(NaCl) = salinité × m(eau).' } },
    { id: 'rapportR', titre: 'Le rapport de Winsor R', focus: ['scene', 'mesures'],
      texte: <>On compare l’affinité du tensioactif pour l’huile (A<sub>SH</sub>) et pour l’eau (A<sub>SE</sub>) par le <strong>rapport de Winsor</strong> R = A<sub>SH</sub> ÷ A<sub>SE</sub>. Winsor I correspond à R &lt; 1 (le tensioactif préfère l’eau), Winsor III à R ≈ 1, Winsor II à R &gt; 1.</>,
      tache: { type: 'qcm', q: 'Quand on ajoute du sel dans la phase aqueuse, comment évolue R ?', ...QCM.rapportR,
        expl: 'Le sel diminue A(SE) : le tensioactif se plaît moins dans l’eau, donc R = A(SH) ÷ A(SE) augmente. On passe ainsi de R < 1 (Winsor I) à R ≈ 1 (III) puis à R > 1 (II).', indice: 'Le sel diminue l’affinité du tensioactif pour l’eau (le dénominateur de R).' } },
    { id: 'actif-q', titre: 'Ajouter du mélange actif : que prévoir ?', focus: ['scene'],
      texte: <>Gardons la salinité optimale ({W.SAL_OPT} %), mais ajoutons de plus en plus de <strong>mélange actif</strong> (SDS + butanol) au même flacon.</>,
      tache: { type: 'qcm', q: 'Que devient le flacon à la salinité optimale si on ajoute beaucoup de mélange actif ?', ...QCM.actif,
        expl: 'Plus il y a de mélange actif, plus la microémulsion peut solubiliser d’huile et d’eau : les excès diminuent, puis disparaissent. On obtient une seule phase, c’est un système de Winsor IV.', indice: 'Le mélange actif cosolubilise l’huile et l’eau : que deviennent les deux excès s’il y en a assez ?' } },
    { id: 'actif', titre: 'Atteindre le Winsor IV', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Vérifiez : à {W.SAL_OPT} % de sel, augmentez la teneur en <strong>mélange actif</strong> jusqu’à n’avoir plus qu’<strong>une seule phase</strong> (Winsor IV).</>,
      tache: { type: 'action', ok: W.etat(vie.S, vie.a).type === 'IV', consigne: 'Augmenter le mélange actif jusqu’à une seule phase' } },
    { id: 'bilan', titre: 'Le bilan : Winsor I, II, III, IV', focus: [],
      retenirTitre: 'À retenir : sel et mélange actif', retenir: <>
        <SvgCarteSelWinsor/>
        <ul style={puces}>
          <li>La formulation optimale est la <strong>bicontinue</strong> avec des excès d’huile et d’eau de même volume.</li>
          <li>Pour exploiter les compositions exactes des phases, on utilise un <strong>diagramme ternaire</strong> (simulation suivante).</li>
        </ul></>,
      texte: <>Vous savez reconnaître les quatre types de Winsor d’après les phases présentes, expliquer l’effet du sel par l’écrantage des charges et le rapport R, repérer la formulation optimale et prévoir l’effet d’un ajout de mélange actif. En exploration, vous pouvez régler le sel et le mélange actif.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(() => ({ S: { 'faible-sel': 5, winsor1: 2, 'fort-sel': 5, sel: 11, optimum: 4 }[IDS[ni]] ?? 7, a: GAMME }));
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sc = idE;
  const AVEC_FLACON = ['faible-sel', 'winsor1', 'fort-sel', 'sel', 'optimum', 'phasesIII', 'rapportR', 'actif-q', 'actif'];
  const sceneGuide = !enGuide ? null
    : AVEC_FLACON.includes(sc) ? <SvgFlaconTP st={xVie}/>
    : sc === 'emulsion' || sc === 'butanol' ? <SvgFlaconTP st={W.etat(7, 40)}/>
    : sc === 'sel-masse' ? <SvgFlacons12 serie={W.serie()} courant={W.SAL_OPT}/>
    : null;
  const MES_FLACON = [['Salinité (NaCl / eau)', `${fr(vie.S, 1)} %`], ['NaCl pour 12 g d’eau', `${fr(W.masseSel(vie.S), 2)} g`], ['Huile en excès', pc(xVie.o)], ['Microémulsion', pc(xVie.m)], ['Eau en excès', pc(xVie.e)]];
  const MES_GUIDE = { 'faible-sel': MES_FLACON, winsor1: MES_FLACON, 'fort-sel': MES_FLACON, sel: MES_FLACON, optimum: MES_FLACON, phasesIII: MES_FLACON, rapportR: MES_FLACON, actif: [...MES_FLACON, ['Mélange actif dans le flacon', `${fr(vie.a, 0)} %`]], 'sel-masse': [['Eau dans le flacon', `${W.MASSE_EAU} g`], ['Rappel du TP', '1 % de NaCl = 120 mg']] };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurGuide = enGuide && ['faible-sel', 'fort-sel', 'optimum', 'actif'].includes(sc) ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      {curs('wi-gs', `Salinité : ${fr(vie.S, 1)} % de NaCl`, vie.S, W.SALINITE_MIN, W.SALINITE_MAX, 0.5, ev => setVie(s => ({ ...s, S: parseFloat(ev.target.value) })), 'Pourcentage massique de NaCl par rapport à l’eau.')}
      {sc === 'actif' && curs('wi-ga', `Mélange actif : ${fr(vie.a, 0)} %`, vie.a, W.A_MIN, 50, 1, ev => setVie(s => ({ ...s, a: parseFloat(ev.target.value) })), 'Part de SDS + butanol dans le flacon (6 % dans le TP).')}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'optimum' ? { kind, ...W.tirageOptimum(), rep: '', verifie: false } : { kind, ...W.tirageDiagnostic(), ty: '', ac: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'optimum') { const a = lireNombre(defi.rep); ok = isFinite(a) && Math.round(a) === defi.vrai; noterO(ok); }
    else { ok = W.verifieDiagnostic(defi, defi.ty, defi.ac); noterD(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const maj = f => setDefi(d => ({ ...d, ...f, verifie: false }));
  const serieDefi = defi && defi.kind === 'optimum' ? W.serie(defi.opt) : null;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['optimum', 'Salinité optimale'], ['diagnostic', 'Diagnostiquer']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.kind === 'optimum' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : la formulation optimale</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Voici une série de 12 flacons préparés comme dans le TP, de 1 % à 12 % de NaCl (le numéro est la salinité). Les phases sont décantées. Indiquez le numéro du flacon qui correspond à la <strong>formulation optimale</strong>.</div>
        <SvgFlacons12 serie={serieDefi} courant={0}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}><label htmlFor="wi-r">Numéro du flacon :</label>
          <input id="wi-r" value={defi.rep} inputMode="numeric" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('wi-verif')?.click()} onChange={ev => maj({ rep: ev.target.value })} style={{ width: 80, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, fontSize: 15 }}/></div>
        <IndiceDefi cache={false}>La formulation optimale est triphasique, avec une microémulsion bicontinue au milieu : cherchez le flacon dont l’huile en excès (rouge, en haut) et l’eau en excès (en bas) ont la même hauteur.</IndiceDefi>
      </>}
      {defi.kind === 'diagnostic' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : diagnostiquer un flacon</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Voici un flacon du TP après décantation. Indiquez le type de système et ce qu’il faut faire, à teneur en mélange actif constante, pour atteindre la formulation optimale.</div>
        <SvgFlaconTP st={defi.x}/>
        {selecteur('wi-ty', 'Type de système', defi.ty, ev => maj({ ty: ev.target.value }), [{ id: 'I', nom: 'Winsor I' }, { id: 'II', nom: 'Winsor II' }, { id: 'III', nom: 'Winsor III' }, { id: 'IV', nom: 'Winsor IV' }], 'Choisir…')}
        {selecteur('wi-ac', 'Correction à apporter', defi.ac, ev => maj({ ac: ev.target.value }), Object.entries(W.ACTIONS).map(([id, nom]) => ({ id, nom })), 'Choisir…')}
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Identifiez les phases (huile rouge en haut, microémulsion bleue, eau en excès) pour trouver le type. Si l’huile est en excès plus abondante que l’eau, le tensioactif préfère trop l’eau : il faut du sel. Si c’est l’eau, il y a trop de sel.</IndiceDefi></div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="wi-verif" onClick={verifier} disabled={defi.kind === 'optimum' ? !defi.rep : !(defi.ty && defi.ac)} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'optimum' && <>Le flacon {defi.vrai} (≈ {defi.vrai} % de NaCl) est triphasique avec des excès d’huile et d’eau de même volume.</>}
        {defi.kind === 'diagnostic' && <>{W.NOM_TYPE[defi.type]} : {W.DESC_TYPE[defi.type]} ; correction : {W.ACTIONS[defi.vrai]}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const xEx = W.etat(ex.S, ex.a);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {curs('wi-xs', `Salinité : ${fr(ex.S, 1)} % de NaCl`, ex.S, W.SALINITE_MIN, W.SALINITE_MAX, 0.5, ev => setEx(x => ({ ...x, S: parseFloat(ev.target.value) })), 'Pourcentage massique de NaCl par rapport à l’eau : 1 % = 120 mg pour 12 g d’eau.')}
      {curs('wi-xa', `Mélange actif : ${fr(ex.a, 0)} %`, ex.a, W.A_MIN, 50, 1, ev => setEx(x => ({ ...x, a: parseFloat(ev.target.value) })), 'Part de SDS + butanol dans le flacon (6 % dans le TP). Beaucoup de mélange actif : une seule phase.')}
    </div>);
  const scenes = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Le flacon et la série du TP</div>
      <SvgFlaconTP st={xEx} showType/>
      <div style={{ height: 6 }}/>
      <SvgFlacons12 serie={W.serie()} courant={ex.a === W.A_MIN ? Math.round(ex.S) : 0}/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Série du TP (6 % de mélange actif). Le flacon encadré correspond à la salinité réglée.</div>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Type et phases</div>
      <LigneMesure nom="Type de système" valeur={W.NOM_TYPE[xEx.type]} couleur={COL.violet}/>
      <LigneMesure nom="Microémulsion" valeur={xEx.micro} couleur={COL.bleu}/>
      <LigneMesure nom="Huile en excès" valeur={pc(xEx.o)} couleur={COL.rouge}/>
      <LigneMesure nom="Eau en excès" valeur={pc(xEx.e)}/>
      <LigneMesure nom="Rapport de Winsor R" valeur={W.rapportR(ex.S)} couleur={COL.orange}/>
      <LigneMesure nom="NaCl pour 12 g d’eau" valeur={`${fr(W.masseSel(ex.S), 2)} g`}/>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>{W.DESC_TYPE[xEx.type].charAt(0).toUpperCase() + W.DESC_TYPE[xEx.type].slice(1)}.</div>
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Faites varier la salinité de 1 % à 12 % : dans quel ordre voyez-vous apparaître les types de Winsor ?</li>
      <li>Repérez la salinité où l’huile en excès et l’eau en excès ont le même volume : comment appelle-t-on cette formulation ?</li>
      <li>À 3 % de sel, ajoutez du mélange actif : jusqu’où faut-il aller pour n’avoir qu’une seule phase ?</li>
      <li>Comparez le type obtenu à 9 % et à 11 % de sel : qu’est-ce qui change dans la position de la microémulsion ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Winsor I : microémulsion H/E + huile en excès ; II : microémulsion E/H + eau en excès ; III : bicontinue + deux excès ; IV : une seule phase</li>
        <li>Le sel diminue l’affinité du SDS pour l’eau : R = A(SH) / A(SE) augmente, on passe de I à III puis à II</li>
        <li>Formulation optimale : Winsor III avec des excès d’huile et d’eau de même volume</li>
        <li>Plus de mélange actif : on tend vers Winsor IV</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle qualitatif</strong> : les volumes des phases sont schématiques. Les excès d’huile et d’eau varient de façon linéaire par morceaux avec la salinité, avec des excès égaux à l’optimum. Ils ne reproduisent pas des mesures. La salinité optimale (7 %) et la largeur du domaine triphasique (± 2 %) sont des valeurs illustratives proches des observations du TP.</li>
      <li><strong>Système du TP</strong> : eau salée colorée au bleu de méthylène, toluène coloré au rouge Soudan, SDS et butanol (1 : 2 en masse). La couleur de chaque phase suit la répartition des colorants observée dans les flacons (le bleu de méthylène suit la microémulsion) ; elle est à confirmer par l’expérience.</li>
      <li><strong>Quantités du flacon</strong> : 0,5 g de SDS, 1 g de butanol, 12 g d’eau et 11,5 g de toluène, soit 6 % de mélange actif. La salinité est un pourcentage massique de NaCl par rapport à l’eau (1 % = 120 mg).</li>
      <li><strong>Propriétés des microémulsions</strong> (cours de microémulsions du BTS MDC) : domaines de 10 à 50 nm, tension interfaciale huile-eau de 10⁻² à 10⁻⁴ mN/m contre environ 50 mN/m sans tensioactif. Domaine de teneur en mélange actif conduisant à Winsor IV : entre 10 % et 50 % selon le système ; la valeur de 30 % est illustrative.</li>
      <li><strong>Température constante</strong> : la température est un autre levier (surtout pour les tensioactifs non ioniques), non traité ici. Le rapport R est donné qualitativement (R &lt; 1, ≈ 1, &gt; 1).</li>
      <li><strong>Hors modèle</strong> : compositions exactes des phases (diagramme ternaire), lignes de conjugaison, effet du co-tensioactif, cinétique de la décantation.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{sc === 'sel-masse' ? 'Données' : 'Mesures'}</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .md-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .md-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .md-col { display: flex; flex-direction: column; gap: 12px; }
        .md-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .md-l1.cote .md-carte { order: 2; } .md-l1.cote .md-main { order: 1; }
          .md-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .md-ex > * { grid-column: 1; }
          .md-ex > .md-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .md-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .md-in { animation: md-fondu 0.35s ease-out; } @keyframes md-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .md-l1 *, .md-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Microémulsions : types de Winsor et effet du sel</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Eau, toluène, SDS et butanol : selon la <strong>salinité</strong>, on obtient des microémulsions de <strong>types de Winsor</strong> différents. Douze flacons du TP permettent de les observer et de repérer la formulation optimale.</div>
      {enGuide && <div className="md-l1 cote">
        <div className="md-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="md-main">
          <div className="md-col">
            {sceneBloc && <div className="md-in">{sceneBloc}</div>}
            {curseurGuide && <div className="md-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="md-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'optimum' ? suiviO : suiviD}/></div>}
      {enExplore && <>
        <div className="md-ex">
          {scenes}
          <div className="md-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
