import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useRef, useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, IndiceDefi, indicesProfond } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./oslModele";
import { SceneRessort, GrapheX, MiniCourbe } from "./OslScene";
import { SvgGrandeursCarte, SvgAmortCarte, SvgRegimesCarte, SvgBilanOslCarte } from "./OslSchemas";
import { Seg, Chips, useLecture, BarreLecture, useEtroit, nbf } from "./exploAnim";

// ====================================================
// SIM 321 — « Oscillations libres : période, amortissement et régimes » (terminale STL, SPCL, Ondes, séquence 1 : aux sources des ondes, les phénomènes oscillants).
//  Une idée : une grandeur vibratoire évolue autour d'une position d'équilibre ; en régime libre, on la décrit par sa période et sa fréquence,
//  et l'amortissement fixe le régime (périodique, pseudopériodique, critique, apériodique).
//  Capacités visées (jamais affichées à l'élève) : identifier la grandeur vibratoire ; caractériser les oscillations libres (quasi-périodiques, critiques, apériodiques) ;
//  caractériser des oscillations harmoniques (amplitude, période propre) et amorties (pseudopériode, temps caractéristique d'amortissement) ; comparer des oscillateurs de domaines différents.
//  Hors périmètre : énergie (sim 322), oscillations forcées et résonance (sim 323), équation différentielle et résolution formelle. Modèle : oslModele.js.
// ====================================================
const VIOLET = '#0369a1';
const SIM_ID = 321, CLE_GUIDE = 'osl-guide-v1';
declarerDefis(SIM_ID, [['regime', 'Quelle courbe est le régime critique ?'], ['periode', 'Mesurer la pseudopériode']]);
const IDS = ['vibration', 'periode', 'frequence', 'harmonique', 'libre', 'pseudo', 'tau', 'critique', 'aperiodique', 'analogie', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
// Configuration de la scène à chaque étape : graphe, curseur d'amortissement, enveloppe, repères. Les éléments introduits restent visibles ensuite.
const DEF = {
  vibration: { graph: false, zeta: 0, f0: 0.8, x0: 0.8 },
  periode: { graph: true, zeta: 0, f0: 0.8, x0: 0.8, marqueT: true },
  frequence: { graph: true, zeta: 0, f0: 0.8, x0: 0.8, marqueT: true },
  harmonique: { graph: true, zeta: 0, f0: 0.8, x0: 0.8 },
  libre: { graph: true, ctrlZ: true, zeta: 0.15, f0: 0.8, x0: 0.8 },
  pseudo: { graph: true, ctrlZ: true, env: true, zeta: 0.15, f0: 0.8, x0: 0.8, marqueT: true },
  tau: { graph: true, ctrlZ: true, env: true, zeta: 0.1, f0: 0.8, x0: 0.8, marqueTau: true },
  critique: { graph: true, ctrlZ: true, env: true, zeta: 0.4, f0: 0.8, x0: 0.8 },
  aperiodique: { graph: true, ctrlZ: true, zeta: 1.8, f0: 0.8, x0: 0.8 },
  analogie: { graph: true, ctrlZ: true, zeta: 0.2, f0: 0.8, x0: 0.8 },
};
const PERIODES = [0.5, 0.8, 1, 1.25, 2];
const etiquetteZ = z => (z < 0.005 ? 'aucun' : z < 0.3 ? 'faible' : z < 0.8 ? 'moyen' : z < 1.2 ? 'fort' : 'très fort');
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const nbs = (v, d = 2) => nbf(v, d);

// ---------- scène : ressort, graphe et commandes (état local : on repart de la configuration de l'étape à chaque étape) ----------
function PanneauOsc({ cfg, onEvent, complet = false }) {
  const [x0, setX0] = useState(cfg.x0 ?? 0.8), [zeta, setZeta] = useState(cfg.zeta ?? 0), [f0, setF0] = useState(cfg.f0 ?? 0.8);
  const racine = useRef(null), etroit = useEtroit(racine, 640);
  const tFin = M.dureeAffichage(f0, zeta), L = useLecture(tFin, true);
  const tm = Math.min(L.t, tFin), xn = M.pos(tm, x0, f0, zeta), reg = M.regime(zeta);
  const lacher = () => { L.demarrer(); onEvent && onEvent('lache'); onEvent && onEvent('regime:' + M.regime(zeta)); };
  const deplacer = v => { setX0(v); L.reset(); };
  const changerZ = v => { setZeta(v); L.demarrer(); onEvent && onEvent('regime:' + M.regime(v)); };
  const changerF = v => { setF0(v); L.demarrer(); };
  const T0 = M.periodePropre(f0), Tp = M.pseudoPeriode(f0, zeta), tau = M.tauAmort(f0, zeta);
  const aria = `Une masse accrochée à un ressort ${zeta > 0 ? 'et à un amortisseur ' : ''}oscille autour de sa position d’équilibre ; régime ${M.REGIMES[reg].nom}.`;
  return (
    <div ref={racine}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ ...styleBoite, flex: '0 1 240px', minWidth: 200, padding: 6, margin: '0 auto' }}>
          <SceneRessort x={xn} zeta={zeta} afficheAmort={!!(cfg.ctrlZ || complet)} aria={aria} onDrag={deplacer} onRelease={lacher} indice={!L.touche}/>
        </div>
        {cfg.graph && <div style={{ ...styleBoite, flex: '1 1 300px', minWidth: 0, padding: 6 }}>
          <GrapheX t={tm} x0={x0} f0={f0} zeta={zeta} tFin={tFin} enveloppe={!!cfg.env} marqueT={!!cfg.marqueT} marqueTau={!!cfg.marqueTau} etroit={etroit}/>
        </div>}
      </div>
      {complet ? <BarreLecture L={{ ...L, demarrer: lacher }} tFin={tFin} libelle="▶ Lâcher"/> : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {L.joue ? <button type="button" onClick={() => L.setJoue(false)} style={styleBouton(true, '#475569')}>⏸ Pause</button>
            : <button type="button" onClick={lacher} style={styleBouton(true, VIOLET)}>{L.fin ? '↻ Rejouer' : '▶ Lâcher la masse'}</button>}
        </div>)}
      {(cfg.ctrlZ || complet) && <div style={{ marginTop: 10, maxWidth: 520 }}>
        <label htmlFor="osl-z" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>Amortissement (frottements) : {etiquetteZ(zeta)}</label>
        <input id="osl-z" type="range" min={0} max={2.5} step={0.05} value={zeta} aria-label="Amortissement" onChange={ev => changerZ(Number(ev.target.value))} style={{ width: '100%', minHeight: 32 }}/>
        <div role="status" aria-live="polite" style={{ fontSize: 14.5, fontWeight: 700, color: reg === 'critique' ? '#c2410c' : KIT.txt, marginTop: 2 }}>Régime obtenu : {M.REGIMES[reg].nom} <span style={{ fontWeight: 400, color: KIT.txt2 }}>({M.REGIMES[reg].desc})</span></div>
      </div>}
      {complet && <div style={{ marginTop: 10, maxWidth: 520 }}>
        <Seg label="Période propre T₀ (durée d’une oscillation sans amortissement)" valeur={PERIODES.find(p => Math.abs(p - T0) < 1e-6)} options={PERIODES.map(p => [p, `${nbs(p, p % 1 ? 2 : 1)} s`])} onChange={v => changerF(Number((1 / v).toFixed(6)))}/>
      </div>}
      {complet && <Chips items={[['Régime', M.REGIMES[reg].nom, '#0369a1'], ['Période propre T₀', `${nbs(T0)} s`, '#475569'], ['Pseudopériode', Number.isFinite(Tp) ? `${nbs(Tp)} s` : 'aucune', '#15803d'], ['Temps caractéristique τ', Number.isFinite(tau) ? `${nbs(tau, 1)} s` : '—', '#b45309']]}/>}
    </div>);
}

export function SimulationOsl() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviR, noterR] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vus, setVus] = useState({});
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('regime');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];
  const ev = k => setVus(v => (v[k] ? v : { ...v, [k]: true }));

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'vibration', titre: 'Une grandeur qui oscille',
      texte: <>Une masse est accrochée à un ressort. Écartée de sa <strong>position d’équilibre</strong> puis lâchée, elle monte et descend : elle <strong>oscille</strong>. La grandeur qui évolue autour de l’équilibre est la <strong>grandeur vibratoire</strong> : ici, la <strong>position x</strong> de la masse par rapport à l’équilibre (x &gt; 0 vers le bas).</>,
      tache: { type: 'action', ok: !!vus.lache, consigne: vus.lache ? '✓ Vous avez lâché la masse : sa position x varie autour de l’équilibre.' : 'Tirez la masse vers le bas ou vers le haut avec le doigt ou la souris, puis lâchez-la (ou cliquez sur « Lâcher la masse »).' } },
    { id: 'periode', titre: 'La période',
      texte: <>Un phénomène est <strong>périodique</strong> s’il se répète identique à lui-même à intervalles de temps réguliers. La <strong>période T</strong> est la plus petite durée au bout de laquelle le phénomène se reproduit ; elle se mesure en <strong>secondes</strong> (s). Sur le graphe, la flèche T joint deux maxima successifs.</>,
      tache: { type: 'num', q: 'Un oscillateur effectue 12 oscillations en 9,0 s. Quelle est sa période T ?', unite: 's', vrai: 0.75, tol: 0.03, affiche: v => nbs(v), cs: 2, carnet: false,
        calcul: () => ['La période est la durée d’une oscillation : durée totale ÷ nombre d’oscillations.', 'T = 9,0 ÷ 12 = 0,75 s.'],
        pieges: [[1.33, 'Vous avez calculé 12 ÷ 9,0 : c’est un nombre d’oscillations par seconde (la fréquence), pas une durée.'], [108, 'Vous avez multiplié : la période est la durée d’une seule oscillation, donc la durée totale divisée par le nombre d’oscillations.']],
        expl: 'T = durée ÷ nombre d’oscillations = 9,0 s ÷ 12 = 0,75 s.', indice: 'La période est la durée d’une seule oscillation : divisez la durée totale par le nombre d’oscillations.' } },
    { id: 'frequence', titre: 'La fréquence',
      texte: <>La <strong>fréquence f</strong> est le nombre d’oscillations par seconde ; elle s’exprime en <strong>hertz</strong> (Hz). Plus les oscillations sont rapides, plus la période est courte et plus la fréquence est grande : <strong>f = 1 / T</strong>.</>,
      tache: { type: 'num', q: 'Un autre oscillateur a pour période T = 0,40 s. Quelle est sa fréquence f ?', unite: 'Hz', vrai: 2.5, tol: 0.03, affiche: v => nbs(v, 1), cs: 2, carnet: false,
        calcul: () => ['f = 1 ÷ T = 1 ÷ 0,40 s.', 'f = 2,5 Hz : 2,5 oscillations par seconde.'],
        pieges: [[0.4, 'C’est la valeur de la période : la fréquence est son inverse, f = 1 / T.'], [0.16, 'Vous avez multiplié 0,40 par lui-même : il faut diviser 1 par la période.']],
        expl: 'f = 1 / T = 1 ÷ 0,40 s = 2,5 Hz.', indice: 'La fréquence est l’inverse de la période : f = 1 / T, avec T en secondes.' } },
    { id: 'harmonique', titre: 'L’oscillateur harmonique',
      retenirTitre: 'À retenir : amplitude, période, fréquence', retenir: <><SvgGrandeursCarte/><ul style={ULS}>
        <li>La <strong>période T</strong> (en s) est la durée d’une oscillation.</li>
        <li>La <strong>fréquence f</strong> (en Hz) vaut <strong>1 / T</strong>.</li>
        <li>L’<strong>amplitude</strong> est la valeur maximale de la grandeur vibratoire.</li></ul></>,
      texte: <>Quand la grandeur vibratoire évolue de manière <strong>sinusoïdale</strong>, l’oscillateur est dit <strong>harmonique</strong>. Son <strong>amplitude</strong> est la valeur maximale prise par la grandeur. Sans aucun frottement, rien n’est perdu : le mouvement se répète indéfiniment, identique à lui-même.</>,
      tache: { type: 'qcm', q: 'Pour un oscillateur harmonique idéal (sans frottement), l’amplitude…', options: ['diminue de moitié à chaque oscillation', 'reste constante', 'augmente à chaque oscillation de la masse', 'devient nulle après une seule période'], bonne: 1,
        expl: 'Sans amortissement, aucune énergie n’est perdue : le mouvement est périodique et l’amplitude ne change pas.', indice: 'Regardez le graphe : le motif se répète-t-il à l’identique, avec les mêmes maxima ?' } },
    { id: 'libre', titre: 'Oscillations libres et frottements',
      texte: <>Les oscillations sont <strong>libres</strong> si, après avoir écarté le système de l’équilibre, on le laisse évoluer <strong>sans lui apporter d’énergie</strong>. En réalité, des <strong>frottements</strong> existent toujours (dessinés ici par un amortisseur). Un curseur d’<strong>amortissement</strong> apparaît : réglez un amortissement <strong>faible</strong>, puis lâchez la masse.</>,
      tache: { type: 'action', ok: !!vus['regime:pseudo'], consigne: vus['regime:pseudo'] ? '✓ Avec un amortissement faible, les oscillations continuent mais leur amplitude diminue.' : 'Réglez l’amortissement sur « faible » (curseur), puis lâchez la masse et observez l’amplitude.' } },
    { id: 'pseudo', titre: 'Le régime pseudopériodique',
      texte: <>Avec un amortissement faible, l’amplitude <strong>décroît</strong> au cours du temps : c’est le régime <strong>pseudopériodique</strong>. La durée entre deux oscillations successives est la <strong>pseudopériode</strong> (flèche T sur le graphe). Les pointillés verts matérialisent l’<strong>enveloppe</strong> de l’amplitude.</>,
      tache: { type: 'qcm', q: 'Comparée à la période propre T₀ (sans amortissement), la pseudopériode d’un oscillateur faiblement amorti est…', options: ['beaucoup plus grande, de plusieurs fois T₀', 'voisine de T₀, un peu plus grande', 'exactement égale à T₀', 'beaucoup plus petite que T₀'], bonne: 1,
        expl: 'Quand l’amortissement est faible, la pseudopériode est très voisine de la période propre (un peu plus grande).', indice: 'Observez le graphe en changeant légèrement l’amortissement : l’écart entre deux maxima change-t-il beaucoup ?' } },
    { id: 'tau', titre: 'Le temps caractéristique d’amortissement',
      texte: <>L’amplitude diminue comme une exponentielle : <strong>A(t) = A₀ · e<sup>−t/τ</sup></strong>, où <strong>A₀</strong> est l’amplitude initiale et <strong>τ</strong> le <strong>temps caractéristique d’amortissement</strong> (repère orange sur le graphe). Au bout d’une durée τ, l’amplitude est divisée par e ≈ 2,72 : il en reste environ <strong>37 %</strong>. Plus τ est petit, plus l’amortissement est fort.</>,
      tache: { type: 'num', q: 'Un oscillateur a une amplitude initiale A₀ = 8,0 cm et un temps caractéristique τ = 2,0 s. Quelle est son amplitude à l’instant t = 2,0 s ?', unite: 'cm', vrai: 8 / Math.E, tol: 0.04, affiche: v => nbs(v, 1), cs: 2, carnet: false,
        calcul: () => ['À t = τ : A = A₀ · e⁻¹ = A₀ ÷ e.', 'A = 8,0 ÷ 2,718 = 2,9 cm, soit environ 37 % de 8,0 cm.'],
        pieges: [[4, 'Vous avez divisé par 2 : à t = τ, l’amplitude est divisée par e ≈ 2,72, pas par 2.'], [1.1, 'Vous avez calculé e⁻² : à t = τ, l’exposant est −1, car t ÷ τ = 1.']],
        expl: 'À t = τ, A = A₀ ÷ e = 8,0 ÷ 2,72 ≈ 2,9 cm (environ 37 % de A₀).', indice: 'À t = τ, le rapport t / τ vaut 1 : A = A₀ · e⁻¹ = A₀ ÷ e, avec e ≈ 2,72.' } },
    { id: 'critique', titre: 'Le régime critique',
      retenirTitre: 'À retenir : amortissement et temps caractéristique', retenir: <><SvgAmortCarte/><ul style={ULS}>
        <li>Pseudopériode ≈ période propre si l’amortissement est faible.</li>
        <li>L’amplitude décroît comme <strong>A₀ e<sup>−t/τ</sup></strong> : à t = τ, il reste 37 %.</li>
        <li>Plus τ est petit, plus l’amortissement est <strong>fort</strong>.</li></ul></>,
      texte: <>Quand on augmente l’amortissement, les oscillations disparaissent à partir d’une limite : le système revient à l’équilibre <strong>sans osciller</strong>. Si l’amortissement est <strong>juste suffisant</strong> pour empêcher l’oscillation, le régime est <strong>critique</strong> : c’est le retour le plus rapide. Réglez le curseur pour obtenir ce régime, puis lâchez la masse.</>,
      tache: { type: 'action', ok: !!vus['regime:critique'], consigne: vus['regime:critique'] ? '✓ Régime critique obtenu : la masse revient à l’équilibre le plus vite possible, sans le dépasser.' : 'Augmentez l’amortissement jusqu’à lire « Régime obtenu : critique », puis lâchez la masse.' } },
    { id: 'aperiodique', titre: 'Le régime apériodique',
      texte: <>Si l’amortissement dépasse la valeur critique, le régime est <strong>apériodique</strong> : il n’y a toujours aucune oscillation, mais le retour à l’équilibre est <strong>plus lent</strong>. Un ferme-porte à ressort doit ramener la porte vite à sa position fermée, sans qu’elle oscille autour de cette position.</>,
      tache: { type: 'qcm', q: 'Quel régime faut-il choisir pour un ferme-porte ?', options: ['pseudopériodique, pour que la porte oscille un peu', 'critique', 'apériodique, car il n’y a aucune oscillation', 'périodique, sans aucun frottement'], bonne: 1,
        expl: 'Le régime critique ramène la porte le plus vite possible à sa position fermée, sans oscillation. Le régime apériodique n’oscille pas non plus, mais il est plus lent.', indice: 'On veut deux choses à la fois : aucune oscillation et un retour le plus rapide possible.' } },
    { id: 'analogie', titre: 'Les mêmes régimes en électricité',
      retenirTitre: 'À retenir : les quatre régimes', retenir: <><SvgRegimesCarte/><ul style={ULS}>
        <li><strong>Périodique</strong> : aucun amortissement, amplitude constante.</li>
        <li><strong>Pseudopériodique</strong> : oscillations d’amplitude décroissante.</li>
        <li><strong>Critique</strong> : retour le plus rapide, sans oscillation ; <strong>apériodique</strong> : plus lent.</li></ul></>,
      texte: <>Un circuit électrique <strong>RLC</strong> (résistance R, bobine, condensateur) est lui aussi un oscillateur. Sa grandeur vibratoire est la <strong>tension aux bornes du condensateur</strong> ; la résistance R joue le rôle des <strong>frottements</strong> (la bobine et le condensateur échangent de l’énergie, comme la masse et le ressort). Les quatre régimes existent dans les deux cas.</>,
      tache: { type: 'qcm', q: 'On augmente progressivement la résistance R d’un circuit RLC, d’abord faible. Le régime passe…', options: ['de pseudopériodique à critique, puis à apériodique', 'reste pseudopériodique, quelle que soit la valeur de R', 'devient périodique, comme si la résistance disparaissait', 'd’apériodique à pseudopériodique, puis périodique'], bonne: 0,
        expl: 'Une plus grande résistance joue le rôle de frottements plus forts : on passe du régime pseudopériodique au régime critique, puis au régime apériodique.', indice: 'R joue le rôle des frottements : que se passe-t-il quand on augmente l’amortissement avec le curseur ?' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : l’analogie ressort et circuit RLC', retenir: <><SvgBilanOslCarte/><ul style={ULS}>
        <li>Grandeur vibratoire : <strong>position x</strong> (ressort) ou <strong>tension du condensateur</strong> (circuit RLC).</li>
        <li>Les <strong>frottements</strong> correspondent à la <strong>résistance R</strong>.</li>
        <li>Plus l’amortissement est fort, plus on va vers le régime <strong>apériodique</strong>.</li></ul></>,
      texte: <>Vous savez décrire une oscillation libre : grandeur vibratoire, période, fréquence, amplitude, puis l’effet de l’amortissement (pseudopériode, temps caractéristique, régimes). La suite : explorez librement, ou relevez les défis.</>,
      tache: null },
  ];

  // ---------- défis ----------
  const nouveauDefi = type => {
    if (type === 'regime') setDefi({ genre: 'regime', d: M.tirageRegime(), choix: null, verifie: false, corr: false });
    else setDefi({ genre: 'periode', d: M.tiragePeriode(), saisie: '', verifie: false, corr: false });
  };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, VIOLET)}><Pic n="target"/>Défis</button>
    </span>);
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const verifierR = () => { const r = M.diagRegime(defi.d, defi.choix); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r })); noterR(r.ok); };
  const verifierP = () => { const r = M.diagPeriode(defi.d, defi.saisie); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r })); noterP(r.ok); };
  const lettres = 'ABC';
  const boutons = (verifier, genre) => (<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
    <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
    <button onClick={() => nouveauDefi(genre)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
    {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
  </div>);
  const voletDefi = defi && (() => {
    if (defi.genre === 'regime') {
      const { cands, bonne, f0, tFin } = defi.d;
      return (<div>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle courbe est le régime critique ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Un même oscillateur, lâché de la même position, est étudié avec trois amortissements différents (même échelle de temps). <strong>Cliquez sur la courbe qui correspond au régime critique</strong> : retour à l’équilibre le plus rapide, sans oscillation.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {cands.map((c, i) => { const col = defi.verifie ? (i === bonne ? '#15803d' : defi.choix === i ? '#dc2626' : KIT.bord) : defi.choix === i ? '#ea580c' : KIT.bord;
            return (<button key={i} type="button" aria-pressed={defi.choix === i} aria-label={`Courbe ${lettres[i]}`} onClick={() => modifie({ choix: i })}
              style={{ border: `2.5px solid ${col}`, borderRadius: 12, background: defi.choix === i && !defi.verifie ? '#fff7ed' : '#fff', padding: 4, cursor: 'pointer', minHeight: 44, font: 'inherit', display: 'block', width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: col === KIT.bord ? KIT.txt2 : col, textAlign: 'left', padding: '0 4px' }}>Courbe {lettres[i]}{defi.choix === i ? (defi.verifie && i !== bonne ? ' ✗' : ' ✓') : ''}</div>
              <MiniCourbe f0={f0} zeta={c.zeta} tFin={tFin} aria={`Courbe ${lettres[i]} : position en fonction du temps`}/></button>); })}
        </div>
        <IndiceDefi cache={false}>Éliminez d’abord la courbe qui oscille (pseudopériodique). Entre les deux courbes qui n’oscillent pas, la plus rapide à revenir à zéro est le régime critique ; l’autre est apériodique.</IndiceDefi>
        {boutons(verifierR, 'regime')}
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? `✓ Correct : la courbe ${lettres[bonne]} est le régime critique.` : `✗ ${defi.r.msg}`}</div>}
        {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
          {cands.map((c, i) => <div key={i}><strong>Courbe {lettres[i]}</strong> : {c.r === 'pseudo' ? 'oscille autour de zéro, régime pseudopériodique.' : c.r === 'critique' ? 'revient à zéro sans osciller, le plus vite : régime critique.' : 'revient à zéro sans osciller, mais plus lentement : régime apériodique.'}</div>)}</div>}
      </div>);
    }
    const { f0, zeta, tFin } = defi.d;
    return (<div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : mesurer la pseudopériode</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Voici l’enregistrement de la position d’un oscillateur faiblement amorti. L’axe horizontal est gradué en secondes (un trait toutes les 0,5 s). <strong>Déterminez la pseudopériode</strong> : comptez des oscillations entières, lisez leur durée, puis divisez. Donnez le résultat en secondes avec 2 chiffres significatifs.</div>
      <div style={styleBoite}><GrapheX t={tFin} x0={1} f0={f0} zeta={zeta} tFin={tFin} titre="Enregistrement de la position x (échelle de temps en secondes)"/></div>
      <div style={{ marginTop: 8, maxWidth: 260 }}>
        <label htmlFor="osl-per" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Pseudopériode T (s)</label>
        <input id="osl-per" type="text" inputMode="decimal" value={defi.saisie} onChange={e => modifie({ saisie: e.target.value })} placeholder="ex. 1,3" style={{ font: 'inherit', fontSize: 16, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, width: '100%', boxSizing: 'border-box' }}/>
      </div>
      <IndiceDefi cache={false}>Repérez un maximum de départ, comptez par exemple 3 ou 4 oscillations jusqu’au maximum suivant, lisez la durée sur l’axe, puis divisez cette durée par le nombre d’oscillations comptées : T = durée ÷ nombre d’oscillations.</IndiceDefi>
      {boutons(verifierP, 'periode')}
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? `✓ Correct : la pseudopériode vaut environ ${nbs(defi.d.Tp)} s.` : `✗ ${defi.r.msg}`}</div>}
      {defi.verifie && !defi.ok && defi.corr && (() => { const N = Math.max(2, Math.min(4, Math.floor(tFin / defi.d.Tp))); return (<div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Sur la courbe, {N} oscillations durent environ {nbs(N * defi.d.Tp, 1)} s : T = {nbs(N * defi.d.Tp, 1)} ÷ {N} ≈ <strong>{nbs(defi.d.Tp)} s</strong>. La fréquence correspondante est f = 1 / T ≈ {nbs(1 / defi.d.Tp)} Hz.</div>); })()}
    </div>);
  })();

  // ---------- hypothèses, pistes, rappels ----------
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle</strong> : oscillateur linéaire (faibles amplitudes), lâché <strong>sans vitesse initiale</strong>. La même équation décrit une masse au bout d’un ressort et un circuit RLC série.</li>
      <li><strong>Amortissement</strong> : force de frottement proportionnelle à la vitesse (ou résistance R). Le curseur règle un coefficient sans unité ; le régime critique correspond à une valeur précise de ce coefficient (le curseur l’atteint à ± 0,025 près).</li>
      <li><strong>Temps caractéristique</strong> : l’enveloppe de l’amplitude décroît comme exp(−t/τ) ; τ n’est défini que pour les oscillations amorties (régime pseudopériodique).</li>
      <li><strong>Pseudopériode</strong> : légèrement supérieure à la période propre T₀ ; elle en est très voisine tant que l’amortissement reste faible.</li>
      <li><strong>Valeurs</strong> : périodes et durées choisies pour la lisibilité de l’animation (de l’ordre de la seconde), sans prétendre reproduire un appareil précis.</li>
    </ul>)}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Choisissez une période propre plus courte : que deviennent la fréquence et le nombre d’oscillations visibles ?</li>
        <li>Avec un amortissement faible, comparez la pseudopériode et la période propre : sont-elles proches ?</li>
        <li>Augmentez l’amortissement pas à pas : à partir de quelle valeur la masse cesse-t-elle d’osciller ?</li>
        <li>Comparez le régime critique et un régime apériodique très fort : lequel revient le plus vite à zéro ?</li>
        <li>Tirez la masse plus ou moins loin avant de la lâcher : la période change-t-elle ? l’amplitude change-t-elle ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Période T (s) et fréquence f (Hz) : f = 1 / T. L’amplitude est la valeur maximale de la grandeur vibratoire.</li>
        <li>Libre : aucun apport d’énergie ; les frottements amortissent les oscillations.</li>
        <li>Pseudopériodique : amplitude décroissante A₀ e<sup>−t/τ</sup>, pseudopériode voisine de T₀.</li>
        <li>Critique : retour le plus rapide sans oscillation ; apériodique : plus lent.</li>
        <li>Circuit RLC : la résistance joue le rôle des frottements.</li>
      </ul>)}
    </Section>);

  const cfg = enGuide ? DEF[idE] : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sl-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
        @media (max-width: 900px) { .sl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .sl-in { animation: sl-fondu 0.35s ease-out; } @keyframes sl-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Oscillations libres : période, amortissement et régimes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une masse au bout d’un ressort, un circuit électrique, une corde : tous <strong>oscillent</strong> autour d’une position d’équilibre. Comment mesurer leur <strong>période</strong> ? Que change l’<strong>amortissement</strong> ?</div>
      {!enExplore && <div className={`sl-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.genre}`} etat={defi.genre === 'regime' ? suiviR : suiviP}/></div>}
          {enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {[['regime', 'Quelle courbe est critique ?'], ['periode', 'Mesurer la pseudopériode']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, VIOLET)}>{l}</button>)}</div>}
          {enGuide && cfg && <div className="sl-in" key={`s${idE}`}><PanneauOsc cfg={cfg} onEvent={ev}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <div style={{ maxWidth: 920, margin: '0 auto' }}><PanneauOsc cfg={{ graph: true, ctrlZ: true, env: true, marqueT: true, zeta: 0.15, f0: 0.8, x0: 0.8 }} complet onEvent={ev}/></div>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
