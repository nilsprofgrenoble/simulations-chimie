import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre } from "../commun";
import { Pic } from "../Pictos";
import * as T from "./ternaireModele";
import * as W from "./winsorModele";
import { QCM } from "./ternaireQcm";
import { SvgTernaire, SvgCarteLecture, SvgCarteTrois, SvgCarteDilution } from "./TernaireSchemas";
import { SvgFlaconTP } from "./WinsorSchemas";

const SIM_ID = 246, CLE_GUIDE = 'ternaire-guide-v1';
declarerDefis(SIM_ID, [['lecture', 'Lire le nombre et la nature des phases d’un mélange'], ['compo', 'Lire la composition de la microémulsion']]);

// ====================================================
//  SIM 246 — DIAGRAMME TERNAIRE DES MICROÉMULSIONS (BTS MDC, Formulation ; fil rouge : le mélange A du cours, 45 % d'huile, 45 % d'eau, 10 % de mélange actif)
//  Capacité visée (jamais affichée à l'élève) : microémulsions, exploiter un diagramme ternaire (phases, lignes de conjugaison, composition des phases, ligne de dilution).
//  Modèle QUALITATIF : ternaireModele.js (trois diagrammes schématiques Winsor I, II, III). Schémas : TernaireSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const pc = v => `${Math.round(v * 100)} %`;
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const A0 = { S: 3, h: 45, s: 10 };                         // mélange A du cours ; salinité faible (diagramme de Winsor I)
const gDe = v => T.composition(v.h / 100, v.s / 100);
const stFlacon = a => { const f = id => a.phases.find(p => p.id === id)?.frac ?? 0; return { o: f('huile'), m: f('micro'), e: f('eau'), type: a.n === 1 ? 'IV' : a.type }; };
const typeDe = S => T.typeDeSalinite(S);
const ORDRE = ['placer', 'phasesI', 'compoI', 'conjug', 'ajout', 'sel-haut', 'phasesII', 'optimum', 'compoIII', 'constance', 'dilution-q', 'dilution', 'bilan'];
const DEPART = { placer: { ...A0, h: 20, s: 20 }, 'sel-haut': A0, phasesII: { ...A0, S: 11 }, optimum: A0, compoIII: { ...A0, S: 7 }, constance: { ...A0, S: 7 } };   // état de la scène au début de chaque étape
export function SimulationTernaire() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState(() => DEPART[ORDRE[Math.min(guide.etape ?? 0, ORDRE.length - 1)]] ?? A0);                                      // scène du parcours : salinité, % huile, % mélange actif
  const [ex, setEx] = useState({ ...A0, S: 7 });                                               // exploration
  const [ouv, setOuv] = useState({});
  const [suiviL, noterL] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('lecture');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const tV = typeDe(vie.S), gV = gDe(vie), aV = T.analyser(tV, gV);
  const compoI = T.analyser('I', T.composition(0.45, 0.10)).phases[1].comp, compoIII = T.DIAGRAMMES.III.triphasique && T.analyser('III', T.composition(0.45, 0.10)).phases[1].comp;
  const eau70 = Math.round(compoI.e * 100), ma33 = Math.round(compoIII.s * 100);

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'placer', titre: 'Placer un mélange dans le triangle', focus: ['scene', 'curseur', 'mesures'],
      retenirTitre: 'À retenir : lire un point sur le triangle', retenir: <>
        <SvgCarteLecture/>
        <ul style={puces}>
          <li>Chaque sommet représente 100 % d’un constituant ; les trois teneurs font toujours 100 %.</li>
          <li>L’eau se lit sur le côté gauche, l’huile sur le côté du bas, le mélange actif sur le côté droit.</li>
        </ul></>,
      texte: <>Un <strong>diagramme ternaire</strong> représente tous les mélanges possibles de trois constituants : ici l’<strong>eau</strong>, l’<strong>huile</strong> (toluène) et le <strong>mélange actif</strong> (SDS et butanol, noté MA). Les teneurs sont des pourcentages massiques, dont la somme vaut 100 %. Placez le <strong>mélange A</strong> du cours : <strong>45 % d’huile</strong> et <strong>10 % de mélange actif</strong>. L’eau complète à 100 %.</>,
      tache: { type: 'action', ok: vie.h === 45 && vie.s === 10, consigne: 'Placer le mélange A : 45 % d’huile, 10 % de mélange actif' } },
    { id: 'phasesI', titre: 'Winsor I : que voit-on dans le flacon ?', focus: ['scene'],
      texte: <>Le diagramme est maintenant colorié pour un système de <strong>Winsor I</strong> (faible salinité) : une zone <strong>bleu clair</strong> où il n’y a qu’<strong>une phase</strong> et une zone <strong>jaune</strong> où il y en a <strong>deux</strong>. Le carré blanc est le mélange A : 45 % d’huile, 45 % d’eau et 10 % de mélange actif.</>,
      tache: { type: 'qcm', q: 'Que voit-on dans le flacon contenant le mélange A ?', ...QCM.phasesI,
        expl: 'Le mélange A est dans la zone jaune : il se sépare en deux phases. En Winsor I, il y a une microémulsion huile-dans-eau et de l’huile en excès.', indice: 'Dans quelle zone colorée se trouve le carré blanc, et que signifie cette couleur ?' } },
    { id: 'compoI', titre: 'Composition de la microémulsion', focus: ['scene'],
      texte: <>Le mélange A se sépare en deux phases. Le <strong>point rouge</strong>, au sommet Huile, représente l’huile en excès (pratiquement pure) ; le <strong>point bleu</strong> représente la <strong>microémulsion</strong>. Lisez sa composition sur le triangle, en repérant les lignes de même teneur en eau.</>,
      tache: { type: 'num', q: 'Teneur en eau de la microémulsion (point bleu)', unite: '%', vrai: eau70, tol: 0.06, affiche: v => String(Math.round(v)), cs: 2,
        calcul: () => ['Les lignes de même teneur en eau sont parallèles au côté opposé au sommet Eau. On lit la valeur là où la ligne du point bleu rencontre le côté gauche.', `On trouve environ ${eau70} % d’eau (lecture à quelques points près).`, `Contrôle : la microémulsion contient aussi environ ${Math.round(compoI.h * 100)} % d’huile et ${Math.round(compoI.s * 100)} % de mélange actif, soit ${eau70} + ${Math.round(compoI.h * 100)} + ${Math.round(compoI.s * 100)} = 100 %.`],
        pieges: [[45, 'Vous avez lu la teneur en eau du mélange global A. La microémulsion est plus riche en eau : elle contient presque toute l’eau.'], [Math.round(compoI.s * 100), 'Vous avez lu la teneur en mélange actif ; on demande la teneur en eau.']],
        expl: `La microémulsion contient environ ${eau70} % d’eau, ${Math.round(compoI.h * 100)} % d’huile et ${Math.round(compoI.s * 100)} % de mélange actif.`, indice: 'La teneur en eau se lit sur le côté gauche : suivez la ligne de la grille qui passe par le point bleu, parallèle au côté Huile–Mélange actif.' } },
    { id: 'conjug', titre: 'La ligne de conjugaison', focus: ['scene'],
      texte: <>La droite brune qui passe par le carré blanc est une <strong>ligne de conjugaison</strong> : ses deux extrémités sont les compositions des deux phases en équilibre. Dans la zone jaune, toutes ces lignes (en pointillés) convergent vers le sommet Huile.</>,
      tache: { type: 'qcm', q: 'Que peut-on en déduire sur les deux phases du Winsor I ?', ...QCM.conjug,
        expl: 'Une extrémité de la ligne est le sommet Huile : la phase huile est presque pure, donc sans mélange actif. Tout le mélange actif se trouve dans la microémulsion H/E.', indice: 'Regardez où se trouve l’extrémité de la ligne située dans le coin Huile : quelle est sa composition ?' } },
    { id: 'ajout', titre: 'Ajouter du mélange actif', focus: ['scene', 'curseur', 'mesures'],
      texte: <>On ajoute peu à peu du mélange actif au mélange A, en gardant autant d’eau que d’huile : le carré blanc monte vers le sommet Mélange actif. Faites-le monter jusqu’à ce qu’il sorte de la zone jaune : il n’y a plus alors qu’<strong>une seule phase</strong>, une microémulsion qui cosolubilise l’eau et l’huile (Winsor IV).</>,
      tache: { type: 'action', ok: aV.n === 1, consigne: 'Augmenter le mélange actif jusqu’à n’avoir plus qu’une phase' } },
    { id: 'sel-haut', titre: 'Le même mélange avec beaucoup de sel', focus: ['scene', 'curseur', 'mesures'],
      texte: <>On revient au mélange A (45 % d’huile, 45 % d’eau, 10 % de mélange actif) et on ajoute du <strong>sel</strong>. Réglez la salinité à <strong>11 %</strong> de NaCl par rapport à l’eau et observez le diagramme.</>,
      tache: { type: 'action', ok: Math.abs(vie.S - 11) <= 0.5, consigne: 'Régler la salinité à 11 %' } },
    { id: 'phasesII', titre: 'Winsor II : que voit-on ?', focus: ['scene', 'mesures'],
      texte: <>Le diagramme est maintenant celui d’un système de <strong>Winsor II</strong>. Les lignes de conjugaison convergent vers le sommet <strong>Eau</strong>. Le carré blanc est toujours le mélange A.</>,
      tache: { type: 'qcm', q: 'Que voit-on alors dans le flacon contenant le mélange A ?', ...QCM.phasesII,
        expl: 'Le mélange A est dans la zone jaune : deux phases. Les lignes convergent vers le sommet Eau : la phase en excès est de l’eau presque pure, l’autre phase est une microémulsion eau-dans-huile qui contient le mélange actif.', indice: 'Les lignes de conjugaison convergent vers le sommet Eau : quelle phase est presque pure ?' } },
    { id: 'optimum', titre: 'La formulation optimale : Winsor III', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Entre les deux, à la salinité optimale (environ <strong>7 %</strong> dans ce TP), apparaît une zone <strong>triphasique</strong> en rouge : un triangle dont les sommets sont l’eau, l’huile et une microémulsion bicontinue. Réglez la salinité à <strong>7 %</strong>.</>,
      tache: { type: 'action', ok: W.estOptimum(vie.S), consigne: 'Régler la salinité à 7 % (formulation optimale)' } },
    { id: 'compoIII', titre: 'Les trois phases du Winsor III', focus: ['scene'],
      texte: <>Le mélange A est maintenant dans le triangle rouge : il se sépare en <strong>trois phases</strong>, représentées par les trois sommets du triangle : l’eau en excès (point gris), l’huile en excès (point rouge) et la <strong>microémulsion bicontinue</strong> (point bleu, en haut). Lisez la teneur en mélange actif de cette microémulsion.</>,
      tache: { type: 'num', q: 'Teneur en mélange actif de la microémulsion (point bleu)', unite: '%', vrai: ma33, tol: 0.12, affiche: v => String(Math.round(v)), cs: 2,
        calcul: () => ['La teneur en mélange actif se lit sur le côté droit : les lignes de même teneur sont horizontales.', `Le point bleu se trouve à environ ${ma33} % de mélange actif (et autant d’eau que d’huile).`, 'Le flacon ne contient que 10 % de mélange actif au total : presque tout est concentré dans cette phase, qui est donc riche en tensioactif.'],
        pieges: [[10, 'C’est la teneur du mélange global A. Dans la microémulsion, le mélange actif est beaucoup plus concentré.'], [45, 'C’est la teneur en eau (ou en huile) du mélange A ; on demande le mélange actif de la microémulsion.']],
        expl: `La microémulsion bicontinue contient environ ${ma33} % de mélange actif, ${ma33} % d’eau et ${ma33} % d’huile.`, indice: 'Suivez la ligne horizontale qui passe par le point bleu jusqu’au côté droit du triangle.' } },
    { id: 'constance', titre: 'Ce qui ne bouge pas', focus: ['scene'],
      texte: <>En faisant varier la salinité, on est passé du Winsor I au Winsor II puis au Winsor III : le diagramme a changé de forme, mais le <strong>carré blanc</strong>, lui, est toujours resté au même endroit.</>,
      tache: { type: 'qcm', q: 'Pourquoi le carré blanc ne bouge-t-il pas d’un diagramme à l’autre ?', ...QCM.constance,
        expl: 'Le point représente la composition globale en eau, huile et mélange actif. En changeant la salinité, on ne touche pas à ces quantités : le point reste fixe, c’est la forme du diagramme qui change. Le sel n’est pas l’un des trois sommets.', indice: 'Qu’est-ce qui varie quand on ajoute du sel, et qu’est-ce qui reste identique dans le flacon ?' } },
    { id: 'dilution-q', titre: 'Une ligne de dilution', focus: ['scene'],
      texte: <>Pour tracer un diagramme de phases au TP, on part d’une solution <strong>C</strong> contenant seulement de l’eau et du mélange actif (ici 70 % d’eau et 30 % de mélange actif, sans huile), puis on y ajoute de l’huile en plusieurs fois. Les mélanges obtenus sont alignés sur une <strong>ligne de dilution</strong>, qui va du point C au sommet Huile.</>,
      tache: { type: 'qcm', q: 'Quand on ajoute de l’huile à la solution C, qu’est-ce qui reste constant ?', ...QCM.dilution,
        expl: 'L’huile ajoutée dilue l’eau et le mélange actif dans les mêmes proportions : leur rapport reste celui de C (70 pour 30). Les teneurs de chaque constituant, elles, changent.', indice: 'On n’ajoute ni eau ni mélange actif : seul le total grandit. Que devient le rapport entre ces deux masses ?' } },
    { id: 'dilution', titre: 'Lire un point de la ligne de dilution', focus: ['scene'],
      retenirTitre: 'À retenir : la ligne de dilution', retenir: <>
        <SvgCarteDilution/>
        <ul style={puces}>
          <li>La ligne de dilution par l’huile relie le point C, sur le côté eau–mélange actif, au sommet Huile.</li>
          <li>Le long de cette ligne, le rapport eau / mélange actif est celui de C.</li>
        </ul></>,
      texte: <>On ajoute de l’huile à la solution C (70 % d’eau, 30 % de mélange actif) jusqu’à ce que le mélange contienne <strong>40 % d’huile</strong> : c’est le point violet. Quelle est sa teneur en eau ?</>,
      tache: { type: 'num', q: 'Teneur en eau du mélange à 40 % d’huile', unite: '%', vrai: 42, tol: 0.05, affiche: v => String(Math.round(v)), cs: 2,
        calcul: () => ['Le mélange contient 40 % d’huile, donc 60 % de solution C.', 'Dans cette solution C, l’eau représente 70 % de la masse.', 'Teneur en eau = 70 % × 60 % = 0,70 × 0,60 = 0,42, soit 42 %. Le mélange actif vaut 0,30 × 0,60 = 18 %. Contrôle : 42 + 40 + 18 = 100 %.'],
        pieges: [[70, 'C’est la teneur en eau de la solution C, avant l’ajout d’huile. L’huile dilue l’eau.'], [28, 'Vous avez multiplié par la teneur en huile (70 % × 40 %). Il faut garder la part de solution C : 60 %.'], [18, 'C’est la teneur en mélange actif ; on demande la teneur en eau.']],
        expl: 'Teneur en eau = 70 % × 60 % = 42 %.', indice: 'Le mélange est fait de 40 % d’huile et de 60 % de solution C. Quelle part de ces 60 % est de l’eau ?' } },
    { id: 'bilan', titre: 'Le bilan : lire un diagramme ternaire', focus: [],
      retenirTitre: 'À retenir : trois diagrammes, un seul mélange', retenir: <>
        <SvgCarteTrois/>
        <ul style={puces}>
          <li>Un point du triangle donne la composition d’un mélange ; sa zone dit combien de phases il y a (1, 2 ou 3).</li>
          <li>Dans une zone à deux phases, la ligne de conjugaison donne par ses extrémités la composition des deux phases.</li>
          <li>Le sel ne change pas le point, mais la forme du diagramme.</li>
        </ul></>,
      texte: <>Vous savez placer un mélange, compter ses phases, lire la composition de chaque phase sur la ligne de conjugaison et suivre une ligne de dilution. En exploration, vous pouvez déplacer le mélange et la salinité ; les défis testent la lecture.</> },
  ];
  const IDS = ORDRE, etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(() => DEPART[IDS[ni]] ?? A0);
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sc = idE;
  const sceneGuide = !enGuide ? null
    : sc === 'placer' ? <SvgTernaire g={gV} regions={false}/>
    : ['phasesI', 'conjug'].includes(sc) ? <SvgTernaire type="I" g={gV} phases={sc === 'conjug'}/>
    : sc === 'compoI' ? <SvgTernaire type="I" g={gV} phases/>
    : sc === 'dilution-q' ? <SvgTernaire g={null} regions={false} dilution={{ r: 0.7 }}/>
    : sc === 'dilution' ? <SvgTernaire g={null} regions={false} dilution={{ r: 0.7, phi: 0.4 }}/>
    : sc === 'bilan' ? null
    : <SvgTernaire type={tV} g={gV} phases={['phasesII', 'compoIII', 'constance'].includes(sc)}/>;
  const MES_GUIDE = {
    placer: [['Huile', `${vie.h} %`], ['Mélange actif', `${vie.s} %`], ['Eau (par différence)', `${Math.max(0, 100 - vie.h - vie.s)} %`]],
    ajout: [['Mélange actif', `${vie.s} %`], ['Nombre de phases', String(aV.n)]],
    'sel-haut': [['Salinité (NaCl / eau)', `${fr(vie.S, 1)} %`], ['Nombre de phases', String(aV.n)]],
    phasesII: [['Salinité (NaCl / eau)', `${fr(vie.S, 1)} %`]],
    optimum: [['Salinité (NaCl / eau)', `${fr(vie.S, 1)} %`], ['Nombre de phases', String(aV.n)]],
  };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurGuide = enGuide && ['placer', 'ajout', 'sel-haut', 'optimum'].includes(sc) ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      {sc === 'placer' && <>
        {curs('te-gh', `Huile : ${vie.h} %`, vie.h, 0, 100 - vie.s, 1, ev => setVie(s => ({ ...s, h: parseInt(ev.target.value, 10) })), 'Teneur massique en huile (toluène) du mélange.')}
        {curs('te-gs', `Mélange actif : ${vie.s} %`, vie.s, 0, 100 - vie.h, 1, ev => setVie(s => ({ ...s, s: parseInt(ev.target.value, 10) })), 'Teneur massique en SDS + butanol. L’eau complète à 100 %.')}
      </>}
      {sc === 'ajout' && curs('te-ga', `Mélange actif : ${vie.s} %`, vie.s, 5, 60, 1, ev => { const s = parseInt(ev.target.value, 10); setVie(v => ({ ...v, s, h: Math.round((100 - s) / 2) })); }, 'On ajoute du mélange actif : l’eau et l’huile gardent des teneurs égales.')}
      {(sc === 'sel-haut' || sc === 'optimum') && curs('te-gsel', `Salinité : ${fr(vie.S, 1)} % de NaCl`, vie.S, W.SALINITE_MIN, W.SALINITE_MAX, 0.5, ev => setVie(s => ({ ...s, S: parseFloat(ev.target.value) })), 'Pourcentage massique de NaCl par rapport à l’eau. Les quantités d’eau, d’huile et de mélange actif ne changent pas.')}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'lecture' ? { kind, ...T.tirageLecture(Math.random), ty: '', nb: '', ex: '', verifie: false } : { kind, ...T.tirageCompo(Math.random), rep: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'lecture') { ok = parseInt(defi.nb, 10) === defi.a.n && defi.ex === T.excesDe(defi.a); noterL(ok); }
    else { const a = lireNombre(defi.rep); ok = isFinite(a) && Math.abs(a - defi.vrai) <= 4; noterC(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const maj = f => setDefi(d => ({ ...d, ...f, verifie: false }));
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['lecture', 'Phases d’un mélange'], ['compo', 'Composition d’une phase']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'lecture' ? 'Défi : combien de phases, et lesquelles ?' : 'Défi : la composition de la microémulsion'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>
        {defi.kind === 'lecture'
          ? <>Voici le diagramme d’un système de <strong>{W.NOM_TYPE[defi.type]}</strong>. Le carré blanc est le mélange étudié : {Math.round(defi.g.e * 100)} % d’eau, {Math.round(defi.g.h * 100)} % d’huile et {Math.round(defi.g.s * 100)} % de mélange actif. Indiquez le nombre de phases et la ou les phases en excès.</>
          : <>Voici le diagramme d’un système de <strong>{W.NOM_TYPE[defi.type]}</strong>. Le carré blanc est un mélange de {Math.round(defi.g.e * 100)} % d’eau, {Math.round(defi.g.h * 100)} % d’huile et {Math.round(defi.g.s * 100)} % de mélange actif. Il se sépare en deux phases : lisez la teneur en mélange actif de la <strong>microémulsion</strong> (point bleu), à 4 points près.</>}
      </div>
      <SvgTernaire type={defi.type} g={defi.g} phases={defi.kind === 'compo'}/>
      {defi.kind === 'lecture' && <>
        {selecteur('te-nb', 'Nombre de phases', defi.nb, ev => maj({ nb: ev.target.value }), [{ id: '1', nom: '1 phase' }, { id: '2', nom: '2 phases' }, { id: '3', nom: '3 phases' }], 'Choisir…')}
        {selecteur('te-ex', 'Phase(s) en excès', defi.ex, ev => maj({ ex: ev.target.value }), Object.entries(T.EXCES).map(([id, nom]) => ({ id, nom })), 'Choisir…')}
      </>}
      {defi.kind === 'compo' && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}><label htmlFor="te-r">Mélange actif dans la microémulsion (%) :</label>
        <input id="te-r" value={defi.rep} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('te-verif')?.click()} onChange={ev => maj({ rep: ev.target.value })} style={{ width: 80, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, fontSize: 15 }}/></div>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'lecture'
        ? 'Repérez la couleur de la zone où se trouve le carré blanc : bleu clair, 1 phase ; jaune, 2 phases ; rouge, 3 phases. Les lignes de conjugaison convergent vers le sommet de la phase en excès (huile ou eau).'
        : 'La teneur en mélange actif se lit sur le côté droit du triangle : suivez la ligne horizontale qui passe par le point bleu.'}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="te-verif" onClick={verifier} disabled={defi.kind === 'lecture' ? !(defi.nb && defi.ex) : !defi.rep} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'lecture' && <>{defi.a.n} phase{defi.a.n > 1 ? 's' : ''} : {defi.a.phases.map(p => p.id === 'micro' ? (defi.a.n === 1 ? 'microémulsion seule' : `microémulsion ${p.nature}`) : p.nom).join(', ')}.</>}
        {defi.kind === 'compo' && <>La microémulsion contient environ {defi.vrai} % de mélange actif.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const tEx = typeDe(ex.S), gEx = gDe(ex), aEx = T.analyser(tEx, gEx);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {curs('te-xs', `Salinité : ${fr(ex.S, 1)} % de NaCl`, ex.S, W.SALINITE_MIN, W.SALINITE_MAX, 0.5, ev => setEx(x => ({ ...x, S: parseFloat(ev.target.value) })), 'Change la forme du diagramme (Winsor I, III ou II), pas la position du mélange.')}
      {curs('te-xh', `Huile : ${ex.h} %`, ex.h, 0, 100 - ex.s, 1, ev => setEx(x => ({ ...x, h: parseInt(ev.target.value, 10) })), 'Teneur massique en huile du mélange.')}
      {curs('te-xm', `Mélange actif : ${ex.s} %`, ex.s, 0, 100 - ex.h, 1, ev => setEx(x => ({ ...x, s: parseInt(ev.target.value, 10) })), 'Teneur massique en SDS + butanol. L’eau complète à 100 %.')}
    </div>);
  const scenes = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Diagramme de phases ({W.NOM_TYPE[tEx]})</div>
      <SvgTernaire type={tEx} g={gEx} phases/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Carré blanc : le mélange. Points colorés : les phases en équilibre (rouge : huile, bleu : microémulsion, gris : eau).</div>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Le mélange et ses phases</div>
      <LigneMesure nom="Mélange (eau · huile · MA)" valeur={`${pc(gEx.e)} · ${pc(gEx.h)} · ${pc(gEx.s)}`}/>
      <LigneMesure nom="Nombre de phases" valeur={String(aEx.n)} couleur={COL.violet}/>
      {aEx.phases.map(p => <div key={p.id} style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>
        <strong>{p.id === 'micro' ? (aEx.n === 1 ? 'Microémulsion' : `Microémulsion ${p.nature}`) : p.nom[0].toUpperCase() + p.nom.slice(1)}</strong> : {pc(p.comp.e)} d’eau, {pc(p.comp.h)} d’huile, {pc(p.comp.s)} de mélange actif</div>)}
    </div>);
  const flaconEx = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Le flacon correspondant</div>
      <SvgFlaconTP st={stFlacon(aEx)} showType/>
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Placez le mélange A (45 % d’huile, 10 % de mélange actif) et faites varier la salinité : comment change le nombre de phases ?</li>
      <li>À 3 % de sel, montez le mélange actif : à partir de quelle teneur n’y a-t-il plus qu’une phase ?</li>
      <li>À 7 %, placez le mélange sur le côté eau–huile : combien de phases voit-on, et dans quelles proportions ?</li>
      <li>Comparez les phases du même mélange à 3 % et à 11 % de sel : quelle phase est en excès, et pourquoi ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Un point du triangle est un mélange (teneurs en eau, huile et mélange actif, total 100 %) ; sa zone donne le nombre de phases</li>
        <li>Ligne de conjugaison : ses deux extrémités donnent la composition des deux phases en équilibre</li>
        <li>Winsor I : lignes vers le sommet Huile ; Winsor II : vers le sommet Eau ; Winsor III : triangle triphasique</li>
        <li>Ajouter du mélange actif : on monte vers une seule phase (Winsor IV)</li>
        <li>Ligne de dilution par l’huile : rapport eau / mélange actif constant</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Diagramme schématique</strong> : les frontières et les lignes de conjugaison sont dessinées par un modèle qualitatif, inspiré des trois diagrammes du cours de microémulsions du BTS MDC. Elles ne reproduisent pas des mesures : les compositions lues (par exemple 70 % d’eau pour la microémulsion du Winsor I) ne valent que comme ordres de grandeur.</li>
      <li><strong>Diagramme pseudo-ternaire</strong> : le SDS et le butanol (rapport 1 : 2 en masse dans le TP) sont traités comme un seul constituant, le « mélange actif ». Le sel n’est pas un sommet : il modifie seulement la forme du diagramme, à température constante.</li>
      <li><strong>Phases presque pures</strong> : la phase huile (Winsor I) ou eau (Winsor II) en excès est supposée pure, ce qui revient à des lignes de conjugaison qui convergent vers un sommet. Dans le Winsor III, la microémulsion bicontinue est supposée à parts égales d’eau, d’huile et de mélange actif (33 % chacun) : valeur illustrative.</li>
      <li><strong>Salinité et type de Winsor</strong> : mêmes valeurs illustratives que la simulation sur les types de Winsor (optimum vers 7 %, domaine triphasique de ± 2 %).</li>
      <li><strong>Une seule phase à partir de 33 % de mélange actif</strong> pour un mélange à parts égales d’eau et d’huile : le cours indique entre 10 % et 50 % selon le système ; la valeur retenue est illustrative.</li>
      <li><strong>Proportions des phases</strong> : les volumes du flacon dessiné en exploration sont obtenus par la règle du levier, en assimilant masses et volumes (masses volumiques voisines).</li>
      <li><strong>Hors modèle</strong> : température, cinétique de séparation, structure du film de tensioactif, diagrammes réels d’un système donné.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .te-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .te-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .te-col { display: flex; flex-direction: column; gap: 12px; }
        .te-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .te-l1.cote .te-carte { order: 2; } .te-l1.cote .te-main { order: 1; }
          .te-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .te-ex > * { grid-column: 1; }
          .te-ex > .te-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .te-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .te-in { animation: te-fondu 0.35s ease-out; } @keyframes te-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .te-l1 *, .te-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Diagramme ternaire des microémulsions</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un diagramme ternaire donne la composition d’un mélange d’<strong>eau</strong>, d’<strong>huile</strong> et de <strong>mélange actif</strong>, et le <strong>nombre de phases</strong> qui en résulte. On apprend à le lire pour le mélange du cours.</div>
      {enGuide && <div className="te-l1 cote">
        <div className="te-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="te-main">
          <div className="te-col">
            {sceneBloc && <div className="te-in">{sceneBloc}</div>}
            {curseurGuide && <div className="te-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="te-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'lecture' ? suiviL : suiviC}/></div>}
      {enExplore && <>
        <div className="te-ex">
          {scenes}
          <div className="te-reg">{reglagesExplore}</div>
          {mesuresEx}
          <div>{flaconEx}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
