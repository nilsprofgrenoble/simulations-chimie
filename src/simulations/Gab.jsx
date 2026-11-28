import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, IndiceDefi, indicesProfond , Frac } from "../commun";
import { Pic } from "../Pictos";
import * as G from "./gabModele";
import { SceneGab } from "./GabScene";
import { SvgSpectreCarte, SvgFiltrerCarte, SvgTypesCarte, SvgPortesCarte, SvgCascadeCarte } from "./GabSchemas";
import { useEtroit, useLecture, StyleAnim, BarreLecture, Chips } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

// ====================================================
// SIM 317 — « Choisir un filtre : spectre, bande passante et gabarit » (terminale STL, SPCL, Systèmes et procédés : flux d'information).
//  Une idée : un signal est une somme de sinusoïdes (son spectre = des raies) ; un filtre multiplie chaque raie par A(f) ; on choisit le type de filtre et ses fréquences de coupure pour respecter un cahier des charges (gabarit).
//  Capacités visées (jamais affichées à l'élève) : proposer un gabarit de filtre pour répondre à un cahier des charges ; exploiter le spectre d'un signal ; caractériser un filtre (nature, bande passante).
//  Hors périmètre : filtres d'ordre supérieur, série de Fourier calculée, phase, bruit. Modèle : gabModele.js. Scène animée : GabScene.jsx.
// ====================================================
const BLEU = '#0369a1', NB = G.NB, nb = G.nbf;
const SIM_ID = 317, CLE_GUIDE = 'gab-guide-v1';
declarerDefis(SIM_ID, [['fc', 'Placer les fréquences de coupure'], ['type', 'Choisir le type de filtre']]);
const IDS = ['sinus', 'somme', 'continu', 'filtrer', 'types', 'choix', 'placer', 'cascade', 'bande', 'triangle', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const OPT_TYPES = ['passe-bas', 'passe-haut', 'passe-bande', 'coupe-bande'];
const CODE_TYPES = ['bas', 'haut', 'bande', 'rej'];

// signaux et cahiers des charges du parcours (toutes les valeurs sont annoncées dans le texte des étapes qui les demandent)
const R_SINUS = [G.raie(500, 3)], R_SOMME = [G.raie(200, 3), G.raie(2000, 1.5)], R_CONTINU = [G.raie(0, 1.5), G.raie(1000, 2)];
const R_FILTRE = [G.raie(500, 2), G.raie(8000, 2, 0.6)], F_FILTRE = 2000, A_8K = 0.24;
const R_CHOIX = [G.raie(1000, 2), G.raie(50000, 1, 0.6)], CAH_PLACER = { utiles: [1000], parasites: [50000] };
const R_CASC = [G.raie(1000, 2)], A1 = 0.96, A2 = 0.97;
const R_BANDE = [G.raie(2000, 2), G.raie(50, 1, 0.6), G.raie(1e5, 1, 0.2)], CAH_BANDE = { utiles: [2000], parasites: [50, 100000] };
const R_TRI = G.triangle(1000, 2), R_BILAN = [G.raie(500, 2), G.raie(20000, 1, 0.6)];

const BASE = { raies: [], type: 'bas', f1: 1000, f2: 10000, nP: 0, temps: true, sortie: false, courbe: false, cahier: null, valeurs: false, anim: false, aide: '', placer: null, vmaxV: null, legende: false };
const AIDE_P = 'Faites glisser la poignée rouge sur l’axe des fréquences : les raies de sortie, la courbe A(f) et le signal temporel réagissent.';
const SCENES = {
  sinus: { ...BASE, raies: R_SINUS },
  somme: { ...BASE, raies: R_SOMME },
  continu: { ...BASE, raies: R_CONTINU },
  filtrer: { ...BASE, raies: R_FILTRE, f1: F_FILTRE, sortie: true, courbe: true, anim: true, legende: true, aide: 'Le filtre est un passe-bas de fréquence de coupure 2 kHz : les raies orange de sortie se calent sur les valeurs « entrée × A ».' },
  types: { ...BASE, type: 'rej', f1: 300, f2: 3000, nP: 2, courbe: true, temps: false, vmaxV: 1, aide: 'Vous pouvez déplacer les deux poignées pour voir comment la forme de la courbe évolue.' },
  choix: { ...BASE, raies: R_CHOIX },
  placer: { ...BASE, raies: R_CHOIX, f1: 300, nP: 1, sortie: true, courbe: true, cahier: CAH_PLACER, placer: [300, 300], legende: true, aide: AIDE_P },
  cascade: { ...BASE, raies: R_CASC, type: 'bande', f1: 300, f2: 4000, sortie: true, courbe: true, legende: true },
  bande: { ...BASE, raies: R_BANDE, type: 'bande', f1: 5000, f2: 8000, nP: 2, temps: false, sortie: true, courbe: true, cahier: CAH_BANDE, placer: [5000, 8000], legende: true, aide: 'Poignée rouge : fc1 (les graves). Poignée violette : fc2 (les aigus). Le signal temporel est masqué car les fréquences sont trop différentes.' },
  triangle: { ...BASE, raies: R_TRI },
  bilan: { ...BASE, raies: R_BILAN, nP: 1, sortie: true, courbe: true, legende: true, aide: AIDE_P },
};
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const sel = (id, lab, v, onChange, opts) => (<div style={{ minWidth: 0 }}>
  <label htmlFor={id} style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{lab}</label>
  <select id={id} value={v} onChange={onChange} style={menu}>{opts}</select></div>);

// scène commune au parcours, aux défis et à l'exploration
function Scene({ sc, f1, f2, setF1, setF2, aria, statut = true, touche = true, extra }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite), anime = !reduitMouvement();
  const L = useLecture(2.6, sc.anim && anime);
  const tau = usePhase(0.12, anime, 0) / (2 * Math.PI);
  const prog = sc.anim ? (anime ? (L.fin ? 1 : L.t / 2.6) : 1) : 1;
  const tempsOk = sc.temps && G.tempsLisible(sc.raies);
  return (
    <div ref={boite} style={{ ...styleBoite, padding: 6 }}>
      <StyleAnim/>
      <SceneGab raies={sc.raies} type={sc.type} f1={f1} f2={f2} setF1={setF1} setF2={setF2} nPoignees={sc.nP} etroit={etroit} svgRef={svgRef} aria={aria} tau={tau}
        temps={tempsOk} sortie={sc.sortie} courbe={sc.courbe} cahier={sc.cahier} valeurs={sc.valeurs} prog={prog} legende={sc.legende} statut={statut} touche={touche} vmaxV={sc.vmaxV}/>
      {extra}
      {sc.anim && anime && <div style={{ marginTop: 6 }}><button type="button" onClick={L.demarrer} style={{ ...styleBouton(false, '#0f766e'), minHeight: 44 }}>↻ Rejouer le filtrage</button></div>}
      {sc.aide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8, lineHeight: 1.45 }}>{sc.aide}</div>}
    </div>);
}
function SceneGuide({ sc, pos, setPos, cle, aria }) {
  const [f1l, setF1l] = useState(sc.f1), [f2l, setF2l] = useState(sc.f2), [touche, setTouche] = useState(false);
  const suivi = sc.placer != null, f1 = suivi ? pos[cle][0] : f1l, f2 = suivi ? pos[cle][1] : f2l;
  const set1 = v => { setTouche(true); if (suivi) setPos(p => ({ ...p, [cle]: [v, p[cle][1]] })); else setF1l(v); };
  const set2 = v => { setTouche(true); if (suivi) setPos(p => ({ ...p, [cle]: [p[cle][0], v] })); else setF2l(v); };
  let extra = null;
  if (sc.cahier) {
    const r = G.respecte(sc.type, f1, f2, sc.cahier);
    extra = (<div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>
      <div><strong style={{ color: r.au.every(a => a >= G.A_PASSE - 1e-9) ? '#15803d' : '#b45309' }}>Raie utile</strong> ({sc.cahier.utiles.map(G.fTxt).join(', ')}) : A = {r.au.map(a => nb(a, 2)).join(' ; ')} (il faut A ≥ 0,9).</div>
      <div><strong style={{ color: r.ap.every(a => a <= G.A_COUPE + 1e-9) ? '#15803d' : '#b45309' }}>Parasite{sc.cahier.parasites.length > 1 ? 's' : ''}</strong> ({sc.cahier.parasites.map(f => (f === 0 ? '0 Hz' : G.fTxt(f))).join(', ')}) : A = {r.ap.map(a => nb(a, 2)).join(' ; ')} (il faut A ≤ 0,1).</div>
    </div>);
  }
  return <Scene sc={sc} f1={f1} f2={f2} setF1={set1} setF2={set2} aria={aria} touche={touche} extra={extra}/>;
}

// ---------- exploration ----------
const PRESETS = [
  { id: 'bruit', nom: 'Sinusoïde de 500 Hz et bruit à 20 kHz', raies: [G.raie(500, 2), G.raie(20000, 1, 0.6)] },
  { id: 'secteur', nom: 'Sinusoïde de 5 kHz et parasite à 50 Hz (secteur)', raies: [G.raie(5000, 2), G.raie(50, 1, 0.6)] },
  { id: 'continu', nom: 'Composante continue de 1,5 V et sinusoïde de 1 kHz', raies: [G.raie(0, 1.5), G.raie(1000, 2)] },
  { id: 'bande', nom: 'Sinusoïde de 2 kHz et deux parasites (50 Hz et 100 kHz)', raies: [G.raie(2000, 2), G.raie(50, 1, 0.6), G.raie(1e5, 1, 0.2)] },
  { id: 'rej', nom: 'Deux sinusoïdes (20 Hz et 20 kHz) et un parasite à 1 kHz', raies: [G.raie(20, 2), G.raie(20000, 2, 0.4), G.raie(1000, 1, 0.6)] },
  { id: 'tri', nom: 'Signal triangulaire de 1 kHz', raies: G.triangle(1000, 2) },
];
const exInitial = () => ({ preset: 'bruit', type: 'bas', f1: 1000, f2: 10000, sortie: true, courbe: true, temps: true, valeurs: true });
function GabExplore({ ex, setEx, ouv, setOuv }) {
  const [touche, setTouche] = useState(false);
  const p = PRESETS.find(x => x.id === ex.preset) || PRESETS[0];
  const nP = G.nbCoupures(ex.type);
  const sc = { ...BASE, raies: p.raies, type: ex.type, f1: ex.f1, f2: ex.f2, nP, sortie: ex.sortie, courbe: ex.courbe, temps: ex.temps, valeurs: ex.valeurs, legende: true };
  const choisir = patch => setEx(x => {
    const y = { ...x, ...patch };
    if (G.nbCoupures(y.type) === 2 && y.f2 < y.f1 * G.ECART_MIN) y.f2 = Math.min(G.F_MAX, G.arrondiF(y.f1 * 10));
    if (G.nbCoupures(y.type) === 2 && y.f2 < y.f1 * G.ECART_MIN) y.f1 = G.arrondiF(y.f2 / 10);
    return y;
  });
  const set1 = v => { setTouche(true); setEx(x => (x.f1 === v ? x : { ...x, f1: v })); };
  const set2 = v => { setTouche(true); setEx(x => (x.f2 === v ? x : { ...x, f2: v })); };
  const gains = p.raies.map(r => G.gainFiltre(ex.type, r.f, ex.f1, ex.f2));
  const nbPasse = gains.filter(a => a >= 0.7071).length, nbSupp = gains.filter(a => a <= G.A_COUPE + 1e-9).length;
  const nom = nP === 2 ? `${G.TYPES[ex.type]} : fc1 = ${G.fTxt(ex.f1)}, fc2 = ${G.fTxt(ex.f2)}` : `${G.TYPES[ex.type]} : fc = ${G.fTxt(ex.f1)}`;
  const lignes = p.raies.slice(0, 5).map((r, i) => `${r.f === 0 ? 'composante continue' : G.fTxt(r.f)} : A = ${nb(gains[i], 2)} → ${nb(r.a, 2)} V devient ${nb(r.a * gains[i], 2)} V`);
  const message = !touche ? 'Faites glisser la poignée rouge sur l’axe des fréquences (ou touchez le spectre) : les raies orange de sortie, la courbe A(f) et le signal temporel se redessinent en direct.'
    : `${nom}. ${lignes.join(' ; ')}${p.raies.length > 5 ? ' ; …' : ''}.`;
  const aria = `Spectre du signal « ${p.nom} » avec la courbe A(f) d’un filtre ${G.TYPES[ex.type]} et ${nP === 2 ? 'deux poignées' : 'une poignée'} de fréquence de coupure.`;
  const tog = (cle, lab) => <button type="button" onClick={() => setEx(x => ({ ...x, [cle]: !x[cle] }))} aria-pressed={ex[cle]} style={{ ...stylePetitBouton(ex[cle], '#0f766e'), minHeight: 40 }}>{lab}</button>;
  return (
    <div>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Section titre={`${p.nom} · ${nom}`} ouvert={ouv.reglages} onBascule={() => setOuv(o => ({ ...o, reglages: !o.reglages }))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {sel('gx-sig', 'Signal à filtrer', ex.preset, ev => { setTouche(false); choisir({ preset: ev.target.value }); }, PRESETS.map(x => <option key={x.id} value={x.id}>{x.nom}</option>))}
            {sel('gx-type', 'Type de filtre', ex.type, ev => choisir({ type: ev.target.value }), CODE_TYPES.map((v, i) => <option key={v} value={v}>{OPT_TYPES[i]}</option>))}
          </div>
        </Section>
      </div>
      <Scene key={`${ex.preset}${ex.type}`} sc={sc} f1={ex.f1} f2={ex.f2} setF1={set1} setF2={set2} aria={aria} touche={touche}/>
      <div role="status" aria-live="polite" style={{ minHeight: 70, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      {!G.tempsLisible(p.raies) && ex.temps && <div style={{ maxWidth: 920, margin: '0 auto 6px', fontSize: 13.5, color: KIT.txt2 }}>Le signal temporel est masqué : les fréquences du signal sont trop différentes pour qu’on le lise.</div>}
      <div style={{ maxWidth: 920, margin: '0 auto 6px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Afficher :</span>
        {tog('courbe', 'Courbe A(f)')}{tog('sortie', 'Signal de sortie')}{tog('temps', 'Signal temporel')}{tog('valeurs', 'Valeurs des raies')}
      </div>
      <Chips items={[['Filtre', G.TYPES[ex.type], '#0f766e'], [nP === 2 ? 'fc1 · fc2' : 'fc', nP === 2 ? `${G.fTxt(ex.f1)} · ${G.fTxt(ex.f2)}` : G.fTxt(ex.f1), '#dc2626'], ['Raies qui passent', `${nbPasse} sur ${p.raies.length}`, '#15803d'], ['Raies supprimées', `${nbSupp} sur ${p.raies.length}`, '#b45309']]}/>
    </div>);
}

export function SimulationGab() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviF, noterF] = useCompteurDefi(), [suiviT, noterT] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [pos, setPos] = useState({ placer: [300, 300], bande: [5000, 8000] });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('fc');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ reglages: false, essayer: false, retenir: false });
  const [ex, setEx] = useState(exInitial);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];
  const okPlacer = G.respecte('bas', pos.placer[0], pos.placer[0], CAH_PLACER).ok, okBande = G.respecte('bande', pos.bande[0], pos.bande[1], CAH_BANDE).ok;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'sinus', titre: 'Le spectre d’une sinusoïde',
      texte: <>Un signal sinusoïdal est décrit par sa <strong>fréquence</strong> f (en Hz) et son <strong>amplitude</strong> (sa valeur maximale, en V). Le <strong>spectre</strong> du signal représente l’amplitude en fonction de la fréquence : une sinusoïde donne une seule <strong>raie</strong>, placée à sa fréquence, dont la hauteur est son amplitude. Ici, la fréquence est 500{NB}Hz (axe horizontal logarithmique : chaque graduation multiplie f par 10). L’axe vertical du spectre est gradué en volts.</>,
      tache: { type: 'num', q: 'Quelle est l’amplitude de la raie du spectre (en V) ?', unite: 'V', vrai: 3, tol: 0.1, affiche: v => nb(v, 1), cs: 2, carnet: false,
        calcul: () => ['La raie monte jusqu’à la graduation 3 de l’axe vertical.', 'L’amplitude de la sinusoïde est donc 3 V : c’est aussi la valeur maximale de la courbe bleue du signal temporel.'],
        pieges: [[500, 'Vous avez donné la fréquence (500 Hz). On demande l’amplitude, lue sur l’axe vertical en volts.'], [6, 'Vous avez donné la valeur crête à crête (de −3 V à +3 V). L’amplitude est la valeur maximale : 3 V.']],
        expl: 'La raie atteint la graduation 3 V : l’amplitude est 3 V (la courbe bleue du signal monte jusqu’à +3 V).', indice: 'Lisez la hauteur du sommet de la raie sur l’axe vertical du spectre, gradué en volts. Comparez avec le sommet de la courbe bleue.' } },
    { id: 'somme', titre: 'Une somme de deux sinusoïdes',
      texte: <>Un signal plus réaliste est la <strong>somme</strong> de plusieurs sinusoïdes de fréquences différentes : la courbe du signal est compliquée, mais son spectre reste simple. Chaque sinusoïde donne <strong>sa propre raie</strong>. Ce signal est la somme d’une sinusoïde de 200{NB}Hz et d’une sinusoïde de 2{NB}000{NB}Hz.</>,
      tache: { type: 'num', q: 'Quelle est l’amplitude de la raie à 2 000 Hz (en V) ?', unite: 'V', vrai: 1.5, tol: 0.1, affiche: v => nb(v, 1), cs: 2, carnet: false,
        calcul: () => ['La raie de 2 kHz est celle de droite : elle monte à mi-hauteur entre les graduations 1 et 2.', 'Son amplitude est 1,5 V ; la raie de 200 Hz, plus grande, vaut 3 V.'],
        pieges: [[3, 'Vous avez donné l’amplitude de la raie de 200 Hz. On demande celle de la raie à 2 000 Hz (à droite).'], [4.5, 'Vous avez additionné les deux amplitudes. Chaque raie se lit séparément sur le spectre.']],
        expl: 'La raie à 2 000 Hz s’arrête à 1,5 V ; celle de 200 Hz atteint 3 V.', indice: 'Repérez la raie placée au-dessus de 2 kHz (à droite de celle de 200 Hz) et lisez sa hauteur sur l’axe vertical.' } },
    { id: 'continu', titre: 'La composante continue',
      texte: <>Un signal peut aussi contenir une <strong>composante continue</strong> : une tension constante, qui ne varie pas dans le temps, donc de fréquence 0{NB}Hz. Elle apparaît dans le spectre comme une raie placée à <strong>0{NB}Hz</strong>, à gauche de l’axe. Elle est égale à la <strong>valeur moyenne</strong> du signal : ici, la courbe bleue oscille autour de cette valeur.</>,
      tache: { type: 'num', q: 'Lisez sur le spectre la valeur moyenne du signal (en V).', unite: 'V', vrai: 1.5, tol: 0.1, affiche: v => nb(v, 1), cs: 2, carnet: false,
        calcul: () => ['La raie à 0 Hz monte à 1,5 V : la valeur moyenne du signal est 1,5 V.', 'Le signal oscille autour de 1,5 V, avec une sinusoïde d’amplitude 2 V à 1 kHz.'],
        pieges: [[2, 'Vous avez donné l’amplitude de la sinusoïde de 1 kHz. La valeur moyenne est la raie à 0 Hz.'], [3.5, 'Vous avez additionné la composante continue et l’amplitude de la sinusoïde. La valeur moyenne est seulement la raie à 0 Hz.']],
        expl: 'La raie à 0 Hz mesure 1,5 V : c’est la valeur moyenne du signal.', indice: 'La composante continue est la raie tout à gauche du spectre, à 0 Hz. Lisez sa hauteur sur l’axe vertical.' } },
    { id: 'filtrer', titre: 'Filtrer : multiplier chaque raie par A',
      retenirTitre: 'À retenir : le spectre',
      retenir: <><SvgSpectreCarte/><ul style={ULS}>
        <li>Une <strong>sinusoïde</strong> donne une <strong>raie</strong> : sa position est la fréquence, sa hauteur l’amplitude.</li>
        <li>Une <strong>composante continue</strong> est une raie à 0 Hz : c’est la valeur moyenne.</li>
        <li>Un signal somme de sinusoïdes a plusieurs raies.</li></ul></>,
      texte: <>Un filtre agit raie par raie : à la fréquence de chaque raie, il multiplie l’amplitude par son <strong>facteur d’amplification</strong> A. On envoie dans un passe-bas de fréquence de coupure 2{NB}kHz un signal formé de deux raies de 2,0{NB}V, à 500{NB}Hz et à 8{NB}kHz (spectre bleu). La courbe verte est A(f), les raies orange sont celles de la sortie. À 8{NB}kHz, le filtre a un facteur d’amplification A = 0,24.</>,
      tache: { type: 'num', q: 'Quelle est l’amplitude de la raie de sortie à 8 kHz (en V) ?', unite: 'V', vrai: 2 * A_8K, tol: 0.06, affiche: v => nb(v, 2), cs: 2, carnet: false,
        calcul: () => ['Raie de sortie = A × raie d’entrée.', `À 8 kHz : 0,24 × 2,0 V = ${nb(2 * A_8K, 2)} V.`],
        pieges: [[2, 'Vous avez donné l’amplitude de la raie d’entrée. En sortie, elle est multipliée par A = 0,24.'], [A_8K, 'Vous avez donné A, sans unité. L’amplitude de la raie de sortie est A × 2,0 V.'], [2 / A_8K, 'Vous avez divisé par A. La raie de sortie est plus petite que celle d’entrée : on multiplie par A.']],
        expl: `La raie de sortie vaut 0,24 × 2,0 V ≈ ${nb(2 * A_8K, 2)} V : elle est fortement atténuée, alors que la raie de 500 Hz passe presque intacte.`, indice: 'Amplitude de sortie = A × amplitude d’entrée, pour la fréquence de la raie considérée (ici 8 kHz).' } },
    { id: 'types', titre: 'Les quatre types de filtres',
      retenirTitre: 'À retenir : filtrer',
      retenir: <><SvgFiltrerCarte/><ul style={ULS}>
        <li>Le filtre <strong>multiplie chaque raie par A(f)</strong> : sortie = A × entrée.</li>
        <li>A ≈ 1 : la raie passe. A ≈ 0 : la raie est supprimée.</li>
        <li>La courbe A(f) décrit entièrement le filtre : c’est son <strong>gabarit</strong>.</li></ul></>,
      texte: <>On classe les filtres d’après la forme de leur courbe A(f). Un <strong>passe-bas</strong> garde les basses fréquences, un <strong>passe-haut</strong> garde les hautes fréquences, un <strong>passe-bande</strong> garde une bande de fréquences et un <strong>coupe-bande</strong> supprime une bande de fréquences. Observez la courbe verte (vous pouvez déplacer les poignées).</>,
      tache: { type: 'qcm', q: 'Quel est le type de ce filtre ?', options: OPT_TYPES, bonne: 3,
        expl: 'A est proche de 1 aux basses et aux hautes fréquences, mais devient très petit dans une bande intermédiaire : le filtre supprime une bande de fréquences, c’est un coupe-bande.',
        indice: 'Regardez où la courbe est haute (A proche de 1) et où elle est basse (A proche de 0) : le filtre garde-t-il les graves, les aigus, ou supprime-t-il le milieu ?' } },
    { id: 'choix', titre: 'Choisir le type de filtre',
      retenirTitre: 'À retenir : les types de filtres',
      retenir: <><SvgTypesCarte/><ul style={ULS}>
        <li><strong>Passe-bas</strong> : garde les basses fréquences. <strong>Passe-haut</strong> : garde les hautes.</li>
        <li><strong>Passe-bande</strong> : garde une bande. <strong>Coupe-bande</strong> : supprime une bande.</li>
        <li>On choisit le type d’après la place du parasite par rapport à la raie utile.</li></ul></>,
      texte: <>Un <strong>cahier des charges</strong> dit quelles fréquences conserver et lesquelles supprimer. Ici, un capteur fournit une raie utile à 1{NB}kHz (2,0{NB}V) ; un <strong>parasite</strong> à 50{NB}kHz (1,0{NB}V) vient s’ajouter au signal (raie du spectre à droite). On veut garder la raie utile et supprimer le parasite.</>,
      tache: { type: 'qcm', q: 'Quel type de filtre faut-il choisir ?', options: ['passe-haut', 'passe-bande', 'passe-bas', 'coupe-bande'], bonne: 2,
        expl: 'Le parasite (50 kHz) est plus haut en fréquence que la raie utile (1 kHz) : il faut garder les basses fréquences et supprimer les hautes, donc un passe-bas.',
        indice: 'Comparez la fréquence du parasite à celle de la raie utile : est-il plus grave ou plus aigu ? Quelle zone faut-il garder ?' } },
    { id: 'placer', titre: 'Placer la fréquence de coupure',
      texte: <>Le filtre est un passe-bas. Il reste à choisir sa fréquence de coupure fc. Le cahier des charges devient un <strong>gabarit</strong> : sur la raie utile, la courbe doit traverser la zone verte (<strong>A ≥ 0,9</strong>, la raie passe presque intacte) ; sur le parasite, elle doit traverser la zone rouge (<strong>A ≤ 0,1</strong>, la raie est supprimée). Déplacez la poignée rouge pour placer fc. Les valeurs de A aux deux fréquences sont indiquées sous le schéma.</>,
      tache: { type: 'action', ok: okPlacer, consigne: okPlacer ? '✓ Les deux zones sont traversées : la raie utile passe (A ≥ 0,9) et le parasite est supprimé (A ≤ 0,1).' : 'Déplacez la poignée rouge jusqu’à ce que les deux zones (verte et rouge) soient traversées.', attente: okPlacer ? null : 'Placez fc pour respecter les deux conditions.' } },
    { id: 'cascade', titre: 'Passe-bande : deux filtres en cascade',
      retenirTitre: 'À retenir : le cahier des charges',
      retenir: <><SvgPortesCarte/><ul style={ULS}>
        <li>Le cahier des charges devient un <strong>gabarit</strong> : A ≥ 0,9 sur la raie utile, A ≤ 0,1 sur le parasite.</li>
        <li>La courbe A(f) doit traverser ces zones : on règle fc pour y arriver.</li>
        <li>Pour un passe-bas, fc se place <strong>entre</strong> la raie utile et le parasite.</li></ul></>,
      texte: <>Quand des parasites encadrent la raie utile (un grave et un aigu), il faut un <strong>passe-bande</strong>. On l’obtient en plaçant un passe-haut (fréquence de coupure fc1) puis un passe-bas (fc2) <strong>en cascade</strong> : le facteur d’amplification total est le produit A = A<sub>1</sub> × A<sub>2</sub>. Ici fc1 = 300{NB}Hz et fc2 = 4{NB}kHz. À 1{NB}kHz, le passe-haut seul a A<sub>1</sub> = 0,96 et le passe-bas seul a A<sub>2</sub> = 0,97.</>,
      tache: { type: 'num', q: 'Quel est le facteur d’amplification A du passe-bande à 1 kHz ?', unite: '', vrai: A1 * A2, tol: 0.03, affiche: v => nb(v, 2), cs: 2, carnet: false,
        calcul: () => ['A = A₁ × A₂ = 0,96 × 0,97.', `A = ${nb(A1 * A2, 3)} ≈ ${nb(A1 * A2, 2)}.`],
        pieges: [[A1 + A2, 'Vous avez additionné A₁ et A₂. En cascade, les facteurs d’amplification se multiplient.'], [A1, 'Vous avez donné A₁. Le passe-bande total a A = A₁ × A₂.']],
        expl: `A = 0,96 × 0,97 ≈ ${nb(A1 * A2, 2)} : à 1 kHz, la raie utile passe presque intacte.`, indice: 'Deux filtres en cascade : on multiplie leurs facteurs d’amplification, A = A₁ × A₂.' } },
    { id: 'bande', titre: 'Placer les deux fréquences de coupure',
      retenirTitre: 'À retenir : le passe-bande',
      retenir: <><SvgCascadeCarte/><ul style={ULS}>
        <li><strong>Passe-bande</strong> = passe-haut (fc1) puis passe-bas (fc2), avec fc1 &lt; fc2.</li>
        <li>En cascade : <strong>A = A₁ × A₂</strong>.</li>
        <li>On garde la bande entre fc1 et fc2 et on supprime les raies hors de cette bande.</li></ul></>,
      texte: <>Le signal contient une raie utile à 2{NB}kHz et deux parasites : le secteur à 50{NB}Hz (grave) et un bruit à 100{NB}kHz (aigu). Il faut un passe-bande. Placez la poignée rouge (fc1, les graves) et la poignée violette (fc2, les aigus) pour que la courbe traverse la zone verte sur la raie utile et les deux zones rouges sur les parasites.</>,
      tache: { type: 'action', ok: okBande, consigne: okBande ? '✓ La raie utile passe (A ≥ 0,9) et les deux parasites sont supprimés (A ≤ 0,1).' : 'Déplacez les deux poignées jusqu’à traverser la zone verte et les deux zones rouges.', attente: okBande ? null : 'Placez fc1 et fc2 pour respecter les trois conditions.' } },
    { id: 'triangle', titre: 'Un signal triangulaire',
      texte: <>Un signal triangulaire de fréquence 1{NB}kHz n’est pas une sinusoïde, mais c’est aussi une <strong>somme de sinusoïdes</strong> : son spectre a plusieurs raies. La première raie est à 1{NB}kHz (la fréquence du signal) ; les autres sont à des fréquences multiples de 1{NB}kHz, avec des amplitudes de plus en plus petites. Observez le spectre : les graduations intermédiaires de l’axe repèrent 2, 3, 4… kHz.</>,
      tache: { type: 'qcm', q: 'Quelle est la fréquence de la deuxième raie du spectre (après celle de 1 kHz) ?', options: ['2 kHz', '4 kHz', '3 kHz', '1,5 kHz'], bonne: 2,
        expl: 'Le spectre d’un signal triangulaire contient la fréquence du signal (1 kHz) et ses multiples impairs : 3 kHz, 5 kHz, 7 kHz… avec des amplitudes de plus en plus petites.',
        indice: 'Repérez la deuxième raie : elle est placée sur la graduation intermédiaire qui suit 2 kHz et 3 kHz. Lisez sa fréquence sur l’axe.' } },
    { id: 'bilan', titre: 'Le bilan',
      texte: <>Vous savez lire un spectre (une raie par sinusoïde, la composante continue à 0{NB}Hz), prévoir l’effet d’un filtre raie par raie (sortie = A × entrée), choisir le type de filtre selon la place du parasite, placer les fréquences de coupure pour respecter un gabarit (A ≥ 0,9 sur la raie utile, A ≤ 0,1 sur le parasite) et associer un passe-haut et un passe-bas en cascade pour faire un passe-bande. En exploration, essayez d’autres signaux et d’autres filtres.</>,
      tache: null },
  ];

  const nouveauDefi = type => setDefi(type === 'fc' ? { ...G.tirageDefiFc(), genre: 'fc', verifie: false, corr: false } : { ...G.tirageDefiType(), genre: 'type', choix: null, verifie: false, corr: false });
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- défis ----------
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const verifier = () => {
    const dq = defi.genre === 'fc' ? G.diagFc(defi, defi.f1, defi.f2) : G.diagType(defi, defi.choix);
    setDefi(d => ({ ...d, verifie: true, ok: dq.ok, dq })); (defi.genre === 'fc' ? noterF : noterT)(dq.ok);
  };
  const cahierTxt = c => <>raie{c.utiles.length > 1 ? 's' : ''} utile{c.utiles.length > 1 ? 's' : ''} à <strong>{c.utiles.map(G.fTxt).join(' et ')}</strong> ; {c.parasites.length > 1 ? 'parasites' : 'parasite'} à <strong>{c.parasites.map(f => (f === 0 ? '0 Hz (composante continue)' : G.fTxt(f))).join(' et ')}</strong></>;
  const voletDefi = defi && (() => {
    const fcDefi = defi.genre === 'fc', iv = fcDefi && defi.verifie && !defi.ok && defi.corr ? G.intervalleFc(defi.type, defi.cahier) : null;
    return (<div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['fc', 'Placer fc'], ['type', 'Choisir le type']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, BLEU)}>{l}</button>)}
      </div>
      {fcDefi ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : respecter le cahier des charges</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Le filtre à utiliser est un <strong>{G.TYPES[defi.type]}</strong>. Cahier des charges : {cahierTxt(defi.cahier)}. Placez {defi.type === 'bande' ? 'les deux fréquences de coupure' : 'la fréquence de coupure'} pour que la raie utile passe (<strong>A ≥ 0,9</strong>) et que le parasite soit supprimé (<strong>A ≤ 0,1</strong>), puis vérifiez.</div>
        <div style={{ ...lbl, marginBottom: 8 }}>{defi.type === 'bande' ? `fc1 = ${G.fTxt(defi.f1)} ; fc2 = ${G.fTxt(defi.f2)}` : `fc = ${G.fTxt(defi.f1)}`}</div>
        <IndiceDefi cache={false}>Lisez A aux fréquences des raies (cercles blancs sur la courbe, axe de droite). Pour un passe-bas, fc doit être au moins 2 fois plus grande que la raie utile et au plus 10 fois plus petite que le parasite ; pour un passe-haut, c’est l’inverse ; pour un passe-bande, placez fc1 sous la raie utile et fc2 au-dessus.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : choisir le type de filtre</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Cahier des charges : {cahierTxt(defi.cahier)}. Quel type de filtre faut-il utiliser pour conserver la raie utile et supprimer le parasite ?</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          {CODE_TYPES.map((v, i) => <button key={v} onClick={() => modifie({ choix: v })} aria-pressed={defi.choix === v} style={{ ...stylePetitBouton(defi.choix === v, '#0f766e'), minHeight: 42 }}>{OPT_TYPES[i]}</button>)}
        </div>
        <IndiceDefi cache={false}>Comparez la fréquence du parasite à celle de la raie utile : est-il plus grave, plus aigu, ou entre deux raies utiles ?</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} disabled={!fcDefi && !defi.choix} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.genre)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (fcDefi ? '✓ Correct : le cahier des charges est respecté.' : `✓ Correct : il faut un ${G.TYPES[defi.type]}.`) : `✗ ${defi.dq.msg}`}
      </div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {fcDefi ? (iv ? <>
          <div>Il faut A ≥ 0,9 sur la raie utile et A ≤ 0,1 sur le parasite.</div>
          <div>{defi.type === 'bande' ? <>Par exemple fc1 entre <strong>{G.fTxt(iv.f1[0])}</strong> et <strong>{G.fTxt(iv.f1[1])}</strong> et fc2 entre <strong>{G.fTxt(iv.f2[0])}</strong> et <strong>{G.fTxt(iv.f2[1])}</strong> (les deux ensemble doivent convenir).</>
            : <>Valeurs de fc qui conviennent : de <strong>{G.fTxt(iv.f1[0])}</strong> à <strong>{G.fTxt(iv.f1[1])}</strong>.</>}</div></> : <div>Placez la poignée de façon que la courbe traverse les zones vertes et rouges.</div>)
          : <div>Il fallait un <strong>{G.TYPES[defi.type]}</strong>. {G.diagType(defi, 'x').msg.split('. ').slice(1).join('. ')}</div>}
      </div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Spectre</strong> : chaque raie représente une sinusoïde (fréquence, amplitude) ; la composante continue est la raie à 0 Hz, égale à la valeur moyenne du signal. Les signaux sont des sommes de sinusoïdes avec des phases fixées arbitrairement : le déphasage n’est pas étudié. Le spectre du signal triangulaire est limité à ses 5 premières raies (1, 3, 5, 7 et 9 fois la fréquence), amplitude <Frac haut={<>8 × a</>} bas={<>π² n²</>} />.</li>
      <li><strong>Filtres</strong> : filtres RC du premier ordre idéaux (sans charge). Passe-bas : A = <Frac haut={<>1</>} bas={<>√(1 + <Frac haut={<>f</>} bas={<>fc</>} />²)</>} />. Passe-haut : A = <Frac haut={<><Frac haut={<>f</>} bas={<>fc</>} /></>} bas={<>√(1 + <Frac haut={<>f</>} bas={<>fc</>} />²)</>} />. Ces formules servent à tracer les courbes ; elles ne sont pas exigibles : on exploite la courbe. La fréquence de coupure est celle où A = <Frac haut={<>Amax</>} bas={<>√2</>} /> ≈ 0,707 × Amax.</li>
      <li><strong>Passe-bande</strong> : cascade idéale d’un passe-haut (fc1) et d’un passe-bas (fc2), A = A₁ × A₂. En réalité, le deuxième filtre charge le premier et le produit n’est qu’approché ; le modèle l’ignore.</li>
      <li><strong>Coupe-bande</strong> : modèle simplifié, deux filtres en parallèle (passe-bas de fréquence fc1 et passe-haut de fréquence fc2, fc1 &lt; fc2), amplitudes additionnées et plafonnées à 1. Il sert à illustrer la forme du gabarit, pas à dimensionner un vrai circuit.</li>
      <li><strong>Gabarit</strong> : les seuils A ≥ 0,9 (raie utile) et A ≤ 0,1 (parasite) sont des valeurs choisies pour l’activité ; un cahier des charges réel donne ses propres seuils. Avec des filtres du premier ordre, il faut un grand écart entre la raie utile et le parasite (au moins un facteur 20 environ) ; sinon il faudrait un filtre d’ordre supérieur (hors programme).</li>
      <li><strong>Affichage</strong> : axe des fréquences logarithmique de 10 Hz à 100 kHz (la raie à 0 Hz est placée à part). Le signal temporel défile lentement pour l’animation ; il est masqué quand les fréquences du signal sont trop différentes (rapport supérieur à 150). Les fréquences de coupure sont réglées avec 2 chiffres significatifs.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avec « Sinusoïde de 500 Hz et bruit à 20 kHz » et un passe-bas : où placer fc pour garder la raie de 500 Hz presque intacte et réduire fortement le bruit ?</li>
        <li>Avec la composante continue de 1,5 V : quel type de filtre la supprime ? Que devient la raie à 0 Hz avec un passe-haut ? Et avec un passe-bas ?</li>
        <li>Avec le signal triangulaire : où mettre fc d’un passe-bas pour ne garder que la première raie ? Que devient la forme du signal temporel ?</li>
        <li>Avec le coupe-bande, placez fc1 et fc2 de part et d’autre du parasite à 1 kHz : le parasite est-il bien supprimé ? Les raies de 20 Hz et 20 kHz passent-elles ?</li>
        <li>Avec un passe-bande, rapprochez fc1 de fc2 : que devient la raie utile ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Spectre : une raie par sinusoïde (fréquence, amplitude) ; composante continue = raie à 0 Hz.</li>
        <li>Un filtre multiplie chaque raie par A(f) : sortie = A × entrée.</li>
        <li>Quatre types : passe-bas, passe-haut, passe-bande, coupe-bande, choisis d’après la place du parasite.</li>
        <li>Gabarit : A ≥ 0,9 sur la raie utile, A ≤ 0,1 sur le parasite ; passe-bande en cascade : A = A₁ × A₂.</li>
      </ul>)}
    </Section>);

  // ---------- scène ----------
  const sc = enGuide ? SCENES[idE] : null;
  const ariaSc = sc ? `Spectre d’un signal avec ${sc.raies.length} raie${sc.raies.length > 1 ? 's' : ''}${sc.courbe ? ', courbe A(f) d’un filtre' : ''}${sc.nP ? ' et poignées de fréquence de coupure' : ''}.` : '';
  const scDefi = defi ? (defi.genre === 'fc'
    ? { ...BASE, raies: defi.raies, type: defi.type, f1: defi.f1, f2: defi.f2, nP: G.nbCoupures(defi.type), temps: true, sortie: true, courbe: true, cahier: defi.cahier, legende: true, aide: 'Déplacez les poignées de fréquence de coupure : les zones vertes et rouges marquent ce que la courbe doit traverser.' }
    : { ...BASE, raies: defi.raies, temps: true, legende: false }) : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .gab-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .gab-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); }
        @media (max-width: 900px) { .gab-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .gab-in { animation: gab-fondu 0.35s ease-out; } @keyframes gab-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Choisir un filtre : spectre, bande passante et gabarit</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un signal est une somme de sinusoïdes : son <strong>spectre</strong> montre une raie par sinusoïde. Un <strong>filtre</strong> multiplie chaque raie par son facteur d’amplification : on choisit son type et ses fréquences de coupure pour respecter un <strong>cahier des charges</strong>.</div>
      {!enExplore && <div className={`gab-l1${(enGuide && sc) || (enDefi && scDefi) ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.genre}`} etat={defi.genre === 'fc' ? suiviF : suiviT}/></div>}
          {enDefi && scDefi && <div key={`d${defi.genre}${defi.type}${JSON.stringify(defi.cahier)}${defi.raies.length}`} style={{ marginTop: 10 }}>
            <Scene sc={scDefi} f1={defi.f1} f2={defi.f2} setF1={v => modifie({ f1: v })} setF2={v => modifie({ f2: v })} statut={false}
              aria="Spectre du signal à filtrer, avec la courbe du filtre et les zones du cahier des charges ; poignées pour régler les fréquences de coupure."/></div>}
          {enGuide && sc && <div className="gab-in" key={`s${idE}`}><SceneGuide sc={sc} pos={pos} setPos={setPos} cle={idE === 'bande' ? 'bande' : 'placer'} aria={ariaSc}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <GabExplore ex={ex} setEx={setEx} ouv={ouv} setOuv={setOuv}/>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
