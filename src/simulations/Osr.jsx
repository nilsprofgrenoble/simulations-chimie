import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useRef, useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, IndiceDefi, indicesProfond, Frac } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./osrModele";
import { SceneExcitee, CourbeReso, JaugeAmplitude } from "./OsrScene";
import { SvgForceCarte, SvgResoCarte, SvgQCarte, SvgAmortCarte } from "./OsrSchemas";
import { Chips, useLecture, useEtroit, nbf } from "./exploAnim";

// ====================================================
// SIM 323 — « Oscillations forcées et résonance » (terminale STL, SPCL, Ondes, séquence 1 : aux sources des ondes, les phénomènes oscillants).
//  Une idée : un oscillateur excité à une fréquence imposée finit par osciller à cette fréquence ; son amplitude est maximale (résonance) quand elle est voisine de sa fréquence propre ;
//  le facteur de qualité Q (rapport de fres à Δf) mesure l'acuité de la résonance et traduit un amortissement faible.
//  Capacités visées (jamais affichées à l'élève) : résonance (fréquence de résonance, facteur de qualité) ; lien qualitatif entre Q et amortissement libre.
//  Hors périmètre : phase, impédance, équation différentielle, résonance en intensité d'un RLC chiffré. Modèle : osrModele.js.
// ====================================================
const VIOLET = '#7c3aed';
const SIM_ID = 323, CLE_GUIDE = 'osr-guide-v1';
declarerDefis(SIM_ID, [['reglage', 'Régler l’excitateur sur la résonance'], ['calculq', 'Calculer le facteur de qualité Q']]);
const IDS = ['excite', 'permanent', 'courbe', 'resonance', 'propre', 'amortissement', 'effet', 'qualite', 'comparer', 'danger', 'fin'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const nbs = (v, d = 2) => nbf(v, d);
const f0Scene = M.REGLAGES.f0;
// Configuration de la scène par étape : les éléments introduits restent visibles ensuite.
const DEF = {
  excite: {}, permanent: {}, courbe: { courbe: true }, resonance: { courbe: true, res: true }, propre: { courbe: true, res: true },
  amortissement: { courbe: true, res: true, ctrlQ: true }, effet: { courbe: true, res: true, ctrlQ: true }, qualite: { courbe: true, res: true, ctrlQ: true, bande: true },
  comparer: { courbe: true, res: true, ctrlQ: true, bande: true }, danger: { courbe: true, res: true, ctrlQ: true, bande: true },
};

// ---------- scène, courbe et commandes ----------
function PanneauReso({ cfg, onEvent, f0 = f0Scene, Qfixe = null, complet = false, onFe, jauge = false, fe0 = 0.8 }) {
  const [fe, setFe] = useState(fe0), [iQ, setIQ] = useState(2);
  const racine = useRef(null), etroit = useEtroit(racine, 640);
  const L = useLecture(1e6, true);
  const Q = Qfixe ?? M.QS[iQ], t = L.t, x = M.pos(t, fe, f0, Q), y = M.support(t, fe), tour = 2 * Math.PI * fe * t;
  const A = M.amp(fe, f0, Q), Am = M.ampMax(f0, Q);
  const evts = (f, q) => { if (!onEvent) return; onEvent('fe'); if (M.amp(f, f0, q) >= 0.9 * M.ampMax(f0, q)) onEvent('pic'); if (q <= 4) onEvent('qpetit'); if (q >= 10) onEvent('qgrand'); };
  const changerFe = v => { const f = Math.max(0.2, Math.min(M.REGLAGES.fMax, Math.round(v * 50) / 50)); setFe(f); L.demarrer(); evts(f, Q); onFe && onFe(f); };
  const changerQ = i => { setIQ(i); L.demarrer(); evts(fe, M.QS[i]); };
  const nom = ['amortissement fort', 'amortissement moyen', 'amortissement faible', 'amortissement très faible'];
  const aria = `Une masse suspendue à un ressort oscille verticalement : le support du ressort est animé par un moteur à ${nbs(fe, 2)} hertz.`;
  const b = M.bande(f0, Q);
  const courbe = cfg.courbe || complet;
  return (
    <div ref={racine}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ ...styleBoite, flex: '1 1 250px', minWidth: 0, padding: 6, maxWidth: 360 }}><SceneExcitee x={x} y={y} fe={fe} tour={tour} aria={aria}/></div>
        {courbe && <div style={{ ...styleBoite, flex: '1 1 300px', minWidth: 0, padding: 6 }}>
          <CourbeReso f0={f0} Q={Q} fe={fe} onPick={changerFe} montrer={{ marque: true, res: !!(cfg.res || complet), bande: !!(cfg.bande || complet) }} etroit={etroit}/>
          <div style={{ fontSize: 13, color: KIT.txt2, padding: '0 4px 2px' }}>Touchez la courbe pour choisir la fréquence d’excitation.</div>
        </div>}
      </div>
      {jauge && <div style={{ ...styleBoite, padding: 8, marginTop: 10 }}><JaugeAmplitude A={A} aria={`Amplitude des oscillations en régime permanent : ${nbs(A, 1)} centimètres.`}/></div>}
      <div style={{ marginTop: 10, maxWidth: 520 }}>
        <label htmlFor="osr-fe" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>Fréquence d’excitation : {nbs(fe, 2)} Hz</label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button type="button" aria-label="Diminuer la fréquence d’excitation" onClick={() => changerFe(fe - 0.02)} style={{ ...styleBouton(false), minWidth: 44, minHeight: 44 }}>−</button>
          <input id="osr-fe" type="range" min={0.2} max={M.REGLAGES.fMax} step={0.02} value={fe} aria-label="Fréquence d’excitation" onChange={e => changerFe(Number(e.target.value))} style={{ flex: 1, minHeight: 32 }}/>
          <button type="button" aria-label="Augmenter la fréquence d’excitation" onClick={() => changerFe(fe + 0.02)} style={{ ...styleBouton(false), minWidth: 44, minHeight: 44 }}>+</button>
        </div>
      </div>
      {(cfg.ctrlQ || complet) && <div style={{ marginTop: 10, maxWidth: 520 }}>
        <label htmlFor="osr-q" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>Amortissement de l’oscillateur : {nom[iQ].replace('amortissement ', '')}</label>
        <input id="osr-q" type="range" min={0} max={3} step={1} value={iQ} aria-label="Amortissement" onChange={e => changerQ(Number(e.target.value))} style={{ width: '100%', minHeight: 32 }}/>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 2 }}>Curseur à droite : amortissement plus faible.</div>
      </div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {L.joue ? <button type="button" onClick={() => L.setJoue(false)} style={styleBouton(true, '#475569')}>⏸ Pause</button>
          : <button type="button" onClick={() => { L.demarrer(); }} style={styleBouton(true, VIOLET)}>↻ Redémarrer à partir du repos</button>}
      </div>
      {complet && <Chips items={[['Amplitude permanente', `${nbs(A, 1)} cm`, '#0369a1'], ['Fréquence de résonance', `${nbs(M.fRes(f0, Q), 2)} Hz`, VIOLET], ['Largeur de bande Δf', `${nbs(b.df, 2)} Hz`, '#15803d'], ['Q', nbs(M.Qmesure(f0, Q), 1), '#334155']]}/>}
      {complet && Am > 0 && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>Le moteur est en marche depuis l’instant du dernier réglage : l’amplitude est d’abord transitoire, puis se stabilise (régime permanent).</div>}
    </div>);
}

export function SimulationOsr() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviR, noterR] = useCompteurDefi(), [suiviQ, noterQ] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vus, setVus] = useState({});
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('reglage');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];
  const ev = k => setVus(v => (v[k] ? v : { ...v, [k]: true }));

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'excite', titre: 'Un oscillateur que l’on excite',
      texte: <>Une masse est suspendue à un <strong>ressort</strong>. Le haut du ressort est relié à un <strong>moteur</strong> (l’<strong>excitateur</strong>) qui le fait monter et descendre à une <strong>fréquence fe</strong> imposée, en hertz. On dit que l’oscillateur est <strong>forcé</strong> : c’est le moteur qui impose le rythme. Au départ la masse est au repos ; le moteur se met en marche.</>,
      tache: { type: 'action', ok: !!vus.fe, consigne: vus.fe ? '✓ Vous avez changé la fréquence d’excitation : la masse a repris son mouvement à partir du repos.' : 'Changez la fréquence d’excitation avec le curseur (ou les boutons − et +), puis observez la masse.' } },
    { id: 'permanent', titre: 'Régime transitoire, puis régime permanent',
      texte: <>Après le départ, le mouvement de la masse est d’abord irrégulier : c’est le <strong>régime transitoire</strong>. Puis il devient régulier, avec une amplitude constante : c’est le <strong>régime permanent</strong>. Observez la masse longtemps après le démarrage du moteur.</>,
      tache: { type: 'qcm', q: 'Le moteur tourne à la fréquence fe = 0,80 Hz. En régime permanent, à quelle fréquence la masse oscille-t-elle ?', options: ['à sa fréquence propre, quelle que soit celle du moteur', 'à la fréquence du moteur, soit 0,80 Hz', 'à la moitié de la fréquence du moteur', 'à une fréquence qui change sans cesse'], bonne: 1,
        expl: 'L’excitateur impose sa fréquence : en régime permanent, l’oscillateur oscille à la fréquence de l’excitateur, ici 0,80 Hz.', indice: 'Qui impose le rythme dans un oscillateur forcé : l’oscillateur seul ou l’excitateur ?' } },
    { id: 'courbe', titre: 'L’amplitude dépend de la fréquence',
      retenirTitre: 'À retenir : l’excitateur impose sa fréquence', retenir: <><SvgForceCarte/><ul style={ULS}>
        <li>Un <strong>excitateur</strong> impose une fréquence <strong>fe</strong> à l’oscillateur.</li>
        <li>Après un <strong>régime transitoire</strong>, le <strong>régime permanent</strong> s’établit.</li>
        <li>En régime permanent, l’oscillateur oscille à la fréquence <strong>fe</strong>, avec une amplitude constante.</li></ul></>,
      texte: <>Une <strong>courbe de résonance</strong> apparaît : l’<strong>amplitude</strong> des oscillations en régime permanent, en fonction de la fréquence d’excitation. Le point orange montre où l’on se trouve. Touchez la courbe ou déplacez le curseur : cherchez la fréquence pour laquelle l’amplitude est la plus grande.</>,
      tache: { type: 'action', ok: !!vus.pic, consigne: vus.pic ? '✓ Vous avez trouvé une fréquence d’excitation pour laquelle l’amplitude est (presque) maximale.' : 'Placez le point orange au sommet de la courbe : l’amplitude de la masse devient très grande.' } },
    { id: 'resonance', titre: 'La résonance',
      texte: <>Quand l’amplitude passe par un <strong>maximum</strong>, il y a <strong>résonance</strong>. La fréquence d’excitation correspondante est la <strong>fréquence de résonance fres</strong>. Ici, l’oscillateur libre (sans moteur) a une <strong>fréquence propre f0</strong> : c’est la fréquence à laquelle il oscille quand on l’écarte puis qu’on le lâche.</>,
      tache: { type: 'qcm', q: 'L’amortissement de l’oscillateur est faible. La résonance a lieu quand la fréquence d’excitation est…', options: ['très inférieure à la fréquence propre', 'voisine de la fréquence propre', 'très supérieure à la fréquence propre', 'nulle'], bonne: 1,
        expl: 'À la résonance, l’excitateur « pousse » l’oscillateur au rythme où il oscille naturellement : fres est voisine de la fréquence propre f0 (très proche si l’amortissement est faible).', indice: 'Pensez à une balançoire : on la pousse au rythme où elle oscille naturellement.' } },
    { id: 'propre', titre: 'Prévoir la fréquence de résonance',
      texte: <>Un oscillateur peu amorti a une <strong>période propre T₀</strong> : c’est la durée d’une oscillation libre. Sa fréquence propre est <strong>f₀ = <Frac haut={<>1</>} bas={<>T₀</>} /></strong>, et la résonance a lieu à une fréquence voisine de f₀.</>,
      tache: { type: 'num', q: 'Un autre oscillateur, peu amorti, met T₀ = 0,25 s pour faire une oscillation libre. À quelle fréquence faut-il l’exciter pour obtenir la résonance ?', unite: 'Hz', vrai: 4, tol: 0.03, affiche: v => nbs(v, 1), cs: 2, carnet: false,
        calcul: () => ['Fréquence propre : f₀ = frac(1|T₀) = frac(1|0,25 s) = 4,0 Hz.', 'Amortissement faible : fres ≈ f₀ = 4,0 Hz.'],
        pieges: [[0.25, 'Vous avez donné la période : la fréquence est l’inverse de la période, f₀ = frac(1|T₀).'], [0.0625, 'Vous avez divisé le mauvais nombre : f₀ = frac(1|T₀) avec T₀ = 0,25 s.']],
        expl: 'f₀ = frac(1|T₀) = frac(1|0,25 s) = 4,0 Hz ; à faible amortissement, fres ≈ f₀.', indice: 'La fréquence est l’inverse de la période : f₀ = frac(1|T₀) (T₀ en secondes, f₀ en hertz).' } },
    { id: 'amortissement', titre: 'Un oscillateur plus ou moins amorti',
      retenirTitre: 'À retenir : la résonance', retenir: <><SvgResoCarte/><ul style={ULS}>
        <li>L’amplitude passe par un <strong>maximum</strong> : c’est la <strong>résonance</strong>.</li>
        <li>La fréquence de résonance <strong>fres</strong> est voisine de la fréquence propre <strong>f₀</strong>.</li>
        <li>Fréquence propre : f₀ = <Frac haut={<>1</>} bas={<>T₀</>} />.</li></ul></>,
      texte: <>Un nouveau curseur règle l’<strong>amortissement</strong> de l’oscillateur (les frottements). Mettez-le d’abord sur « fort », puis sur « très faible », et comparez la courbe de résonance.</>,
      tache: { type: 'action', ok: !!(vus.qpetit && vus.qgrand), consigne: vus.qpetit && vus.qgrand ? '✓ Vous avez comparé un amortissement fort et un amortissement très faible.' : 'Réglez l’amortissement sur « fort », puis sur « très faible » (curseur à droite), et regardez la courbe.' } },
    { id: 'effet', titre: 'Effet de l’amortissement sur la résonance',
      texte: <>Avec un amortissement <strong>faible</strong>, le pic de la courbe est <strong>haut et étroit</strong> ; avec un amortissement <strong>fort</strong>, il est <strong>bas et large</strong>.</>,
      tache: { type: 'qcm', q: 'Quand on augmente l’amortissement d’un oscillateur, que devient la résonance ?', options: ['elle devient plus marquée : le pic est plus haut et plus étroit', 'elle devient moins marquée : le pic est plus bas et plus large', 'elle disparaît toujours complètement', 'elle ne change pas'], bonne: 1,
        expl: 'Les frottements dissipent de l’énergie : l’amplitude maximale diminue et le pic s’élargit. La résonance est moins marquée.', indice: 'Comparez, sur la courbe, le pic obtenu avec un amortissement fort et avec un amortissement très faible.' } },
    { id: 'qualite', titre: 'Le facteur de qualité',
      texte: <>On mesure la finesse du pic par sa <strong>largeur de bande Δf</strong> : la largeur de la courbe à l’amplitude maximale divisée par √2 (environ 70 % du maximum). Le <strong>facteur de qualité</strong> est <strong>Q = <Frac haut={<>f<sub>res</sub></>} bas={<>Δf</>} /></strong> (sans unité) : plus le pic est étroit, plus Q est grand.</>,
      tache: { type: 'num', q: 'Une résonance a lieu à fres = 12,0 Hz, avec une largeur de bande Δf = 0,80 Hz. Quel est le facteur de qualité Q ?', unite: '', vrai: 15, tol: 0.03, affiche: v => nbs(v, 0), cs: 2, carnet: false,
        calcul: () => ['Q = frac(fres|Δf) = frac(12,0 Hz|0,80 Hz) = 15.', 'Q n’a pas d’unité : c’est un rapport de deux fréquences.'],
        pieges: [[0.067, 'Vous avez inversé le rapport : Q = fres divisée par Δf, et non Δf divisée par fres.'], [9.6, 'Vous avez multiplié : Q est le quotient frac(fres|Δf).']],
        expl: 'Q = frac(fres|Δf) = frac(12,0 Hz|0,80 Hz) = 15.', indice: 'Q = frac(fres|Δf) : divisez la fréquence de résonance par la largeur de bande, dans la même unité (hertz).' } },
    { id: 'comparer', titre: 'Q et amortissement',
      retenirTitre: 'À retenir : le facteur de qualité', retenir: <><SvgQCarte/><ul style={ULS}>
        <li><strong>Δf</strong> : largeur de la courbe à l’amplitude maximale divisée par √2.</li>
        <li><strong>Q = <Frac haut={<>f<sub>res</sub></>} bas={<>Δf</>} /></strong>, sans unité.</li>
        <li>Pic étroit : Q grand. Pic large : Q petit.</li></ul></>,
      texte: <>Le curseur d’amortissement règle aussi Q : à droite (amortissement très faible), Q est <strong>grand</strong> ; à gauche (amortissement fort), Q est <strong>petit</strong>. Un oscillateur de Q élevé continue d’osciller longtemps après avoir été lâché.</>,
      tache: { type: 'qcm', q: 'Un oscillateur A a un facteur de qualité Q = 50 et un oscillateur B a Q = 5. Lequel est le moins amorti ?', options: ['l’oscillateur B, car son facteur de qualité est le plus petit', 'l’oscillateur A, car son facteur de qualité est le plus grand', 'ils sont également amortis', 'on ne peut pas le savoir'], bonne: 1,
        expl: 'Un facteur de qualité élevé traduit un amortissement faible : la résonance de A est étroite et marquée.', indice: 'Plus le pic de résonance est étroit, plus Q est grand : l’amortissement est alors faible ou fort ?' } },
    { id: 'danger', titre: 'Utile ou dangereuse ?',
      texte: <>La résonance est <strong>utile</strong> pour sélectionner une fréquence (réglage d’un récepteur radio) mais peut être <strong>dangereuse</strong> : une passerelle piétonne dont la fréquence propre est voisine de celle des pas des piétons peut osciller avec une très grande amplitude.</>,
      tache: { type: 'qcm', q: 'Comment limiter les oscillations d’une passerelle soumise à une excitation proche de sa fréquence de résonance ?', options: ['diminuer l’amortissement pour que Q augmente', 'augmenter l’amortissement pour que Q diminue', 'exciter la passerelle exactement à la résonance', 'augmenter l’amplitude de l’excitation'], bonne: 1,
        expl: 'Un amortissement plus fort diminue Q : le pic est plus bas et plus large, donc l’amplitude à la résonance est plus faible.', indice: 'Pour réduire le pic de résonance, l’amortissement doit-il augmenter ou diminuer ?' } },
    { id: 'fin', titre: 'Le bilan',
      retenirTitre: 'À retenir : amortissement et résonance', retenir: <><SvgAmortCarte/><ul style={ULS}>
        <li>Amortissement faible : Q grand, résonance marquée.</li>
        <li>Amortissement fort : Q petit, résonance peu marquée.</li>
        <li>Pour limiter une résonance dangereuse, on augmente l’amortissement.</li></ul></>,
      texte: <>Vous savez décrire un oscillateur forcé : régime permanent à la fréquence de l’excitateur, résonance près de la fréquence propre, largeur de bande et facteur de qualité Q, lien avec l’amortissement. La suite : explorez librement, ou relevez les défis.</>,
      tache: null },
  ];

  // ---------- défis ----------
  const nouveauDefi = type => {
    if (type === 'reglage') setDefi({ genre: 'reglage', d: M.tirageReglage(), fe: 0.8, verifie: false, corr: false });
    else setDefi({ genre: 'calculq', d: M.tirageQ(), saisie: '', verifie: false, corr: false });
  };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, VIOLET)}><Pic n="target"/>Défis</button>
    </span>);
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const verifierR = () => { const r = M.diagReglage(defi.d, defi.fe); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r })); noterR(r.ok); };
  const verifierQ = () => { const r = M.diagQ(defi.d, defi.saisie); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r })); noterQ(r.ok); };
  const boutons = (verifier, genre) => (<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
    <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
    <button onClick={() => nouveauDefi(genre)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
    {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
  </div>);
  const boite = { marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt };
  const voletDefi = defi && (() => {
    if (defi.genre === 'reglage') {
      const { f0, Q } = defi.d, fr = M.fRes(f0, Q);
      return (<div>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : régler l’excitateur sur la résonance</div>
        <div style={{ ...lbl, marginBottom: 8 }}>La fréquence propre de cet oscillateur est inconnue. <strong>Réglez la fréquence d’excitation pour obtenir l’amplitude maximale</strong> (au moins 90 % du maximum possible), puis cliquez sur « Vérifier ».</div>
        <PanneauReso key={defi.d.cle} cfg={{}} f0={f0} Qfixe={Q} jauge fe0={0.8} onFe={fe => modifie({ fe })}/>
        <IndiceDefi cache={false}>Augmentez la fréquence d’excitation par petits pas et surveillez l’amplitude permanente : elle augmente, atteint un maximum, puis diminue. Le réglage fin se fait avec les boutons − et + (0,02 Hz par pas).</IndiceDefi>
        {boutons(verifierR, 'reglage')}
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? `✓ Correct : la résonance a lieu vers ${nbs(fr, 2)} Hz, et vous êtes à ${nbs(defi.fe, 2)} Hz.` : `✗ ${defi.r.msg}`}</div>}
        {defi.verifie && !defi.ok && defi.corr && <div style={boite}>La fréquence de résonance vaut environ <strong>{nbs(fr, 2)} Hz</strong> (fréquence propre : {nbs(f0, 1)} Hz). Vous étiez à {nbs(defi.fe, 2)} Hz, soit {nbs(Math.abs(defi.fe - fr), 2)} Hz {defi.fe < fr ? 'en dessous' : 'au-dessus'}.</div>}
      </div>);
    }
    const { fr, f1, f2, Q } = defi.d, df = f2 - f1;
    return (<div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : calculer le facteur de qualité Q</div>
      <div style={{ ...lbl, marginBottom: 8 }}>On a mesuré la courbe de résonance d’un oscillateur : l’amplitude est maximale pour <strong>fres = {nbs(fr, 2)} Hz</strong>. Elle vaut ce maximum divisé par √2 pour <strong>f₁ = {nbs(f1, 2)} Hz</strong> et <strong>f₂ = {nbs(f2, 2)} Hz</strong>. <strong>Calculez Q</strong> avec 2 chiffres significatifs.</div>
      <div style={{ marginTop: 8, maxWidth: 260 }}>
        <label htmlFor="osr-q-def" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Facteur de qualité Q</label>
        <input id="osr-q-def" type="text" inputMode="decimal" value={defi.saisie} onChange={e => modifie({ saisie: e.target.value })} placeholder="ex. 7,5" style={{ font: 'inherit', fontSize: 16, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, width: '100%', boxSizing: 'border-box' }}/>
      </div>
      <IndiceDefi cache={false}>La largeur de bande est Δf = f₂ − f₁ (en hertz). Le facteur de qualité est Q = fres divisée par Δf.</IndiceDefi>
      {boutons(verifierQ, 'calculq')}
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? `✓ Correct : Q vaut environ ${nbs(Q, 1)}.` : `✗ ${defi.r.msg}`}</div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={boite}>Δf = f₂ − f₁ = {nbs(f2, 2)} − {nbs(f1, 2)} = {nbs(df, 2)} Hz. Q = <Frac haut={<>{nbs(fr, 2)}</>} bas={<>{nbs(df, 2)}</>} /> = <strong>{nbs(Q, 1)}</strong>.</div>}
    </div>);
  })();

  // ---------- hypothèses, pistes, rappels ----------
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle</strong> : oscillateur linéaire (faibles amplitudes), frottements proportionnels à la vitesse, excitation sinusoïdale de fréquence fe. La masse part du repos ; le régime transitoire s’éteint ensuite.</li>
      <li><strong>Facteur de qualité</strong> : Q = <Frac haut={<>1</>} bas={<>2ζ</>} />, ζ étant le coefficient d’amortissement du modèle. Q = <Frac haut={<>f<sub>res</sub></>} bas={<>Δf</>} /> est exact pour un amortissement faible ; pour Q = 2,5 l’écart est d’environ 8 %.</li>
      <li><strong>Résonance</strong> : la fréquence de résonance est légèrement inférieure à la fréquence propre ; l’écart est négligeable si Q est grand (0,1 % pour Q = 10).</li>
      <li><strong>Valeurs</strong> : fréquence propre de 2 Hz et amplitude d’excitation de 1 cm choisies pour la lisibilité de l’animation ; elles ne représentent pas un appareil précis. L’amplitude affichée est celle du régime permanent.</li>
      <li><strong>Hors programme</strong> : la phase de l’oscillateur par rapport à l’excitateur n’est pas étudiée.</li>
    </ul>)}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Excitez l’oscillateur très lentement, puis très vite : l’amplitude est-elle grande ou petite ?</li>
        <li>Où se trouve le sommet de la courbe par rapport à la fréquence propre ?</li>
        <li>Mettez un amortissement fort : le pic est-il plus haut ou plus bas ? plus étroit ou plus large ?</li>
        <li>Comparez les valeurs de Δf et de Q pour deux amortissements différents.</li>
        <li>À la résonance, quelle est l’amplitude de la masse par rapport à celle du support ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>En régime permanent, l’oscillateur oscille à la fréquence fe de l’excitateur.</li>
        <li>Résonance : l’amplitude est maximale pour fres voisine de la fréquence propre f₀.</li>
        <li>Largeur de bande Δf : à l’amplitude maximale divisée par √2.</li>
        <li>Facteur de qualité Q = <Frac haut={<>f<sub>res</sub></>} bas={<>Δf</>} />, sans unité : Q grand, résonance étroite et marquée.</li>
        <li>Amortissement faible : Q grand. Pour limiter une résonance dangereuse, on augmente l’amortissement.</li>
      </ul>)}
    </Section>);

  const cfg = enGuide ? DEF[idE === 'fin' ? 'danger' : idE] : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sl-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
        @media (max-width: 900px) { .sl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .sl-in { animation: sl-fondu 0.35s ease-out; } @keyframes sl-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Oscillations forcées et résonance</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un moteur impose sa fréquence à une masse suspendue à un ressort. Pour quelle fréquence l’amplitude est-elle maximale ? Que mesure le <strong>facteur de qualité</strong> ?</div>
      {!enExplore && <div className={`sl-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.genre}`} etat={defi.genre === 'reglage' ? suiviR : suiviQ}/></div>}
          {enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {[['reglage', 'Régler la résonance'], ['calculq', 'Calculer Q']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, VIOLET)}>{l}</button>)}</div>}
          {enGuide && cfg && <div className="sl-in" key="scene"><PanneauReso key={idE === 'amortissement' ? 'a' : 'b'} cfg={cfg} onEvent={ev}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <div style={{ maxWidth: 920, margin: '0 auto' }}><PanneauReso cfg={{}} complet onEvent={ev}/></div>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
