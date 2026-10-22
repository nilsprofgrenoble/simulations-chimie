import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, Curseur, LigneMesure } from "../commun";
import { nf, NB } from "./Distillation";
import { Moteur, Chrono } from "./MoteurPasAPas";
import { simuler, delaiMin, N_PAS, F0 } from "./moteurModele";
import { Pic } from "../Pictos";

const SIM_ID = 45;
declarerDefis(SIM_ID, [['principal', 'Aller le plus vite possible sans perdre de pas']]);

// ====================================================
//  SIM 45 — PILOTER LE MOTEUR AVEC LE CODE : séquence, délai, charge, pas perdus
// ====================================================

const PRE = {
  complet: { nom: 'Pas complet', L: 4, seq: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] },
  demi: { nom: 'Demi-pas', L: 8, seq: [[1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1]] },
  force: { nom: 'Force maximale', L: 4, seq: [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1]] },
  faux: { nom: 'Ordre 1-3-2-4', L: 4, seq: [[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]] },
};
const VIDE = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
const grilleDe = nom => PRE[nom].seq.map(c => c.slice()).concat(VIDE.slice(PRE[nom].seq.length).map(c => c.slice()));
const egal = (cycle, nom) => cycle.length === PRE[nom].L && cycle.every((c, j) => c.every((v, b) => v === PRE[nom].seq[j][b]));
const DUREE_ANIM = 8;                         // durée de l'animation, en secondes

// ---------- Courbe : angle du rotor en fonction du temps ----------
function Courbe({ res, tp, stale }) {
  const W = 600, H = 240, ml = 52, mr = 10, mt = 12, mb = 34;
  const tmax = res.dureeTot * 1000;
  const ys = res.pts.map(p => p[1]).concat(res.T, [res.T0]);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const pad = Math.max(30, (ymax - ymin) * 0.06);
  const a = ymin - pad, b = ymax + pad;
  const X = t => ml + (t / tmax) * (W - ml - mr), Y = y => mt + (1 - (y - a) / (b - a)) * (H - mt - mb);
  const pasY = (b - a) > 2000 ? 720 : (b - a) > 600 ? 360 : 90;
  const grad = []; for (let g = Math.ceil(a / pasY) * pasY; g <= b; g += pasY) grad.push(g);
  const D = res.D * 1000;
  let cible = `M${X(0)},${Y(res.T0)}`;
  res.T.forEach((v, k) => { cible += ` L${X(k * D)},${Y(k === 0 ? res.T0 : res.T[k - 1])} L${X(k * D)},${Y(v)}`; });
  cible += ` L${X(tmax)},${Y(res.T[res.T.length - 1])}`;
  const reel = res.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0] * 1000).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
  const bruts = [0.5, 1, 2, 5, 10, 20, 50, 100, 200], pasT = bruts.find(v => tmax / v <= 7) || 200;
  const tk = []; for (let v = 0; v <= tmax + 1e-9; v += pasT) tk.push(v);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', opacity: stale ? 0.45 : 1 }} role="img"
      aria-label="Angle du rotor en fonction du temps, comparé à la position commandée par le programme">
      {grad.map(g => <g key={g}><line x1={ml} x2={W - mr} y1={Y(g)} y2={Y(g)} stroke="#e2e8f0"/><text x={ml - 5} y={Y(g) + 4} textAnchor="end" fontSize="11" fill="#475569">{g}</text></g>)}
      {tk.map(v => <g key={v}><line x1={X(v)} x2={X(v)} y1={mt} y2={H - mb} stroke="#f1f5f9"/><text x={X(v)} y={H - mb + 15} textAnchor="middle" fontSize="11" fill="#475569">{nf(v, pasT < 1 ? 1 : 0)}</text></g>)}
      <path d={cible} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 3"/>
      <path d={reel} fill="none" stroke="#2563eb" strokeWidth="2.2"/>
      <line x1={X(tp * 1000)} x2={X(tp * 1000)} y1={mt} y2={H - mb} stroke="#dc2626" strokeWidth="1.5"/>
      <text x={(ml + W - mr) / 2} y={H - 3} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="600">temps (ms)</text>
      <text x="12" y={(mt + H - mb) / 2} fontSize="12" fill="#0f172a" fontWeight="600" transform={`rotate(-90 12 ${(mt + H - mb) / 2})`} textAnchor="middle">angle (°)</text>
    </svg>);
}

export function SimulationMoteurCode({ naviguer }) {
  const [mode, setMode] = useState(() => modeOuverture('pilotage-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('pilotage-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [grille, setGrille] = useState(() => grilleDe('complet'));
  const [longueur, setLongueur] = useState(4);
  const [delai, setDelai] = useState(5);
  const [charge, setCharge] = useState(0);
  const [res, setRes] = useState(null);
  const [, setT] = useState(0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const P = useRef({ tp: 0, play: false });

  const cycle = useMemo(() => grille.slice(0, longueur), [grille, longueur]);
  const cle = JSON.stringify([cycle, delai, charge]);
  const stale = !res || res.cle !== cle;
  const dMinComplet = useMemo(() => delaiMin(PRE.complet.seq, 0), []);

  useEffect(() => {
    let raf, last = performance.now();
    const boucle = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const p = P.current;
      if (p.play && p.dur) {
        p.tp += dt * p.dur / DUREE_ANIM;
        if (p.tp >= p.dur) { p.tp = p.dur; p.play = false; }
        setT(t => (t + 1) % 1e9);
      }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, []);

  function executer(cy = cycle, d = delai, c = charge) {
    const r = simuler(cy, d, c / 100);
    r.cle = JSON.stringify([cy, d, c]); r.cycle = cy;
    setRes(r);
    P.current.tp = 0; P.current.dur = r.dureeTot; P.current.play = true;
    setT(t => t + 1);
  }
  function appliquer(nom, d, c) {
    setGrille(grilleDe(nom)); setLongueur(PRE[nom].L); setDelai(d); setCharge(c);
    executer(PRE[nom].seq, d, c);
  }
  const charger = nom => { setGrille(grilleDe(nom)); setLongueur(PRE[nom].L); };
  const lecture = () => { const p = P.current; if (!res) return; if (p.tp >= p.dur) p.tp = 0; p.play = !p.play; setT(t => t + 1); };
  const curseurTemps = v => { P.current.play = false; P.current.tp = v * (res ? res.dureeTot : 0); setT(t => t + 1); };

  // ---------- état affiché ----------
  const tp = P.current.tp;
  let thDeg = 0, coils = [0, 0, 0, 0], k = 0;
  if (res) {
    const i = Math.min(res.pts.length - 1, Math.floor(tp / 0.0005));
    const j = Math.min(res.pts.length - 1, i + 1), fr = j > i ? Math.min(1, (tp - res.pts[i][0]) / (res.pts[j][0] - res.pts[i][0] || 1)) : 0;
    thDeg = res.pts[i][1] + (res.pts[j][1] - res.pts[i][1]) * fr;
    k = Math.min(res.N - 1, Math.floor(tp / res.D + 1e-9));
    coils = res.cycle[k % res.cycle.length];
  } else { thDeg = 0; coils = [0, 0, 0, 0]; }

  const dMinDefi = useMemo(() => defi ? delaiMin(PRE[defi.m].seq, defi.charge / 100) : null, [defi]);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const frais = !stale && res;
  const ETAPES = [
    { id: 'prog', titre: 'Un programme qui commande les bobines', focus: ['programme'],
      texte: <>Le programme Arduino allume les bobines dans un ordre donné, une séquence de pas, et attend <code>delay(D)</code> avant le pas suivant. Ici, le tableau est la séquence : une ligne par bobine, une colonne par pas, 5{NB}V = alimentée. Exécutez la séquence en <strong>pas complet</strong> avec <strong>delay(5)</strong>, sans charge.</>,
      tache: { type: 'action', ok: !!(frais && egal(cycle, 'complet') && delai === 5 && charge === 0 && res.ok), label: 'Exécuter le pas complet, 5 ms',
        faire: () => appliquer('complet', 5, 0), consigne: 'Choisissez « Pas complet », delay 5 ms, charge 0 %, puis « Exécuter »' } },
    { id: 'oscille', titre: 'Que fait le rotor à chaque pas ?', focus: ['courbe', 'figure'],
      texte: <>Regardez l’animation et la courbe : la ligne orange en pointillés est la position commandée (un escalier), la ligne bleue est l’angle réel du rotor. Le temps est <strong>très ralenti</strong> (le programme entier dure environ {nf(N_PAS * 5, 0)}{NB}ms).</>,
      tache: { type: 'qcm', q: 'À chaque pas, le rotor…', options: ['se place instantanément et reste immobile', 'oscille un peu autour de sa nouvelle position d’équilibre avant de se stabiliser', 'continue de tourner sans s’arrêter'], bonne: 1,
        expl: 'Le rotor est un aimant avec de l’inertie : il dépasse un peu sa position d’équilibre puis se stabilise (oscillations amorties). Il lui faut du temps pour atteindre la nouvelle position.' } },
    { id: 'tours', titre: 'Combien de tours ?', focus: ['mesures'],
      texte: <>La séquence a commandé 16 pas complets. Regardez dans « Mesures » la rotation réelle du rotor.</>,
      tache: { type: 'num', q: 'Nombre de tours réellement faits par le rotor', unite: '', vrai: 4, tol: 0.02, affiche: v => nf(v, 0), cs: 1,
        bloque: frais && egal(cycle, 'complet') ? null : 'Exécutez d’abord la séquence en pas complet (étape 1).',
        expl: '16 pas × 90° = 1440° = 4 tours.' } },
    { id: 'court', titre: 'Un délai trop court', focus: ['programme', 'mesures'],
      texte: <>Plus le délai est court, plus le moteur tourne vite. Mais le rotor a besoin de temps pour atteindre chaque position. Réglez <strong>delay(1)</strong> (1{NB}ms) et exécutez à nouveau.</>,
      tache: { type: 'action', ok: !!(frais && egal(cycle, 'complet') && delai <= 2 && charge === 0 && !res.ok), label: 'Essayer delay(1)',
        faire: () => appliquer('complet', 1, 0), consigne: 'Réglez le délai à 1 ms et exécutez' } },
    { id: 'pourquoi', titre: 'Pourquoi des pas perdus ?', focus: ['courbe'],
      texte: <>Regardez la courbe : l’escalier orange part loin devant, le rotor (bleu) ne le rattrape pas.</>,
      tache: { type: 'qcm', q: 'Pourquoi le moteur perd-il des pas ?', options: ['le champ change avant que le rotor ait atteint sa position : il est « décroché »', 'les bobines chauffent et s’éteignent', 'l’Arduino se trompe de bobine'], bonne: 0,
        expl: 'Le rotor n’a pas le temps de rejoindre sa position avant que le champ ne tourne à nouveau : il se retrouve en retard, voire repart dans le mauvais sens, et le champ finit par « passer devant » sans l’entraîner.' } },
    { id: 'dmin', titre: 'Le délai minimal', focus: ['programme', 'mesures'],
      texte: <>En pas complet et sans charge, cherchez le <strong>plus petit délai</strong> (par pas de 0,5{NB}ms) pour lequel le rotor suit toute la séquence sans perdre de pas. Essayez plusieurs valeurs.</>,
      tache: { type: 'num', q: 'Plus petit délai sans pas perdu (pas complet, charge 0 %)', unite: 'ms', vrai: dMinComplet, tol: 0.3, affiche: v => nf(v, 1), cs: 2,
        expl: `Vers ${nf(dMinComplet, 1)}${NB}ms dans ce modèle. Avec delay(5), on a donc une marge de sécurité.` } },
    { id: 'charge', titre: 'Ajouter une charge', focus: ['programme', 'mesures'],
      texte: <>Le moteur entraîne maintenant une pompe ou un mécanisme : il doit fournir un couple. Réglez une <strong>charge de 40 %</strong> (en pourcentage du couple maximal d’une bobine), gardez <strong>delay(5)</strong> et le pas complet : exécutez.</>,
      tache: { type: 'action', ok: !!(frais && egal(cycle, 'complet') && delai === 5 && charge === 40 && !res.ok), label: 'Charge 40 %, 5 ms',
        faire: () => appliquer('complet', 5, 40), consigne: 'Charge 40 %, delay 5 ms, pas complet : exécutez' } },
    { id: 'force', titre: 'Plus de force', focus: ['programme', 'mesures'],
      texte: <>Avec la même charge et le même délai, passez au <strong>pas complet à force maximale</strong> (deux bobines alimentées à chaque pas).</>,
      tache: { type: 'action', ok: !!(frais && egal(cycle, 'force') && delai === 5 && charge === 40 && res.ok), label: 'Force maximale, charge 40 %',
        faire: () => appliquer('force', 5, 40), consigne: 'Choisissez « Force maximale », charge 40 %, delay 5 ms : exécutez' } },
    { id: 'pourquoif', titre: 'Pourquoi ça marche ?', focus: ['courbe'],
      texte: <>Le moteur ne perd plus de pas avec la même charge et le même délai.</>,
      tache: { type: 'qcm', q: 'Pourquoi la force maximale résiste-t-elle mieux à la charge ?', options: ['le champ résultant de deux bobines est plus intense (×√2) : le couple est plus grand', 'le rotor est plus léger', 'le délai est devenu plus court'], bonne: 0,
        expl: 'Deux bobines voisines créent un champ d’intensité √2 ≈ 1,41 : le couple maximal est plus grand, le moteur supporte une charge plus élevée.' } },
    { id: 'faux', titre: 'Se tromper d’ordre', focus: ['programme', 'courbe'],
      texte: <>Que se passe-t-il si l’ordre des bobines est faux ? Choisissez « Ordre 1-3-2-4 » (delay(5), charge 0) et exécutez.</>,
      tache: { type: 'action', ok: !!(frais && egal(cycle, 'faux')), label: 'Essayer l’ordre 1-3-2-4', faire: () => appliquer('faux', 5, 0), consigne: 'Choisissez « Ordre 1-3-2-4 » puis exécutez' } },
    { id: 'fauxq', titre: 'Un ordre incohérent', focus: ['courbe', 'figure'],
      texte: <>Observez le rotor : il hésite, avance puis recule. Avec les bobines 1 puis 3, le champ se retourne : le rotor est poussé aussi bien vers un sens que vers l’autre.</>,
      tache: { type: 'qcm', q: 'Que constate-t-on ?', options: ['le rotor ne tourne pas régulièrement : la séquence n’impose pas de sens de rotation', 'le rotor tourne plus vite', 'rien ne change'], bonne: 0,
        expl: 'Passer de la bobine 1 à la bobine 3 (opposée) inverse le champ : le rotor n’a aucune raison de tourner dans un sens plutôt que dans l’autre. L’ordre des bobines doit suivre la géométrie.' } },
    { id: 'boucle', titre: 'Le programme le sait-il ?', focus: [],
      texte: <>Dans tous ces essais, le programme a commandé exactement le même nombre de pas.</>,
      tache: { type: 'qcm', q: 'Quand des pas sont perdus, le programme Arduino…', options: ['ne s’en aperçoit pas : il n’a aucun capteur de position (boucle ouverte)', 'les détecte automatiquement et les rejoue', 'arrête le moteur'], bonne: 0,
        expl: 'Sans capteur de position, rien n’informe le programme : c’est pourquoi on garde une marge sur le délai et le couple, ou on ajoute un capteur (boucle fermée).' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>le programme = une séquence d’états des bobines + un délai entre deux pas</li>
        <li>le rotor oscille et a besoin de temps pour atteindre sa position : délai trop court → pas perdus</li>
        <li>une charge plus grande demande plus de couple, donc un délai plus long ou plus de force (deux bobines, ×√2)</li>
        <li>l’ordre des bobines détermine le sens de rotation</li>
        <li>boucle ouverte : le programme ne sait pas qu’un pas a été perdu</li></ul>,
      texte: <>Vous savez construire une séquence de commande, régler son délai et prévoir quand le moteur va décrocher. Essayez maintenant le défi.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    const m = tire(['complet', 'demi', 'force']);
    setDefi({ m, charge: tire([0, 10, 20, 30, 40]), verifie: false });
    setGrille(grilleDe(m)); setLongueur(PRE[m].L); setDelai(5); setRes(null);
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') { if (!defi) nouveauDefi(); else { setGrille(grilleDe(defi.m)); setLongueur(PRE[defi.m].L); } }
    if (md === 'guide') { charger('complet'); setDelai(5); setCharge(0); setRes(null); }
  }
  // Ouverture directe en mode défi (mission d'un escape game) : le défi doit être tiré comme au clic sur l'onglet « Défi »
  useEffect(() => { if (mode === 'defi' && !defi) changerMode('defi'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (enDefi && defi) setCharge(defi.charge); }, [enDefi, defi]);
  const verdictDefi = (() => {
    if (!defi || !defi.verifie) return null;
    if (stale) return { c: '#b45309', t: 'Exécutez d’abord votre réglage, puis vérifiez.' };
    if (!res.ok) return { c: '#dc2626', t: `✗ Des pas sont perdus avec delay(${nf(delai, 1)}). Allongez le délai.` };
    if (delai <= dMinDefi + 0.5) return { c: '#16a34a', t: `✓ Aucun pas perdu, et le délai est proche du minimum (${nf(dMinDefi, 1)}${NB}ms). Bravo !` };
    return { c: '#b45309', t: `Aucun pas perdu, mais vous pouvez aller plus vite : le délai minimal est ${nf(dMinDefi, 1)}${NB}ms.` };
  })();
  const voletDefi = defi && (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : aller le plus vite possible</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>Le moteur entraîne une charge de <strong>{defi.charge}{NB}%</strong> en <strong>{PRE[defi.m].nom.toLowerCase()}</strong>. Trouvez le <strong>plus petit délai</strong> (à 0,5{NB}ms près) pour lequel le rotor ne perd <strong>aucun pas</strong>, puis vérifiez.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => { noterDefi(!stale && !!res && res.ok && delai <= dMinDefi + 0.5); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier mon réglage</button>
        <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {verdictDefi && <div style={{ marginTop: 8, fontWeight: 700, color: verdictDefi.c, fontSize: 14 }}>{verdictDefi.t}</div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Rotor idéalisé</strong> : aimant à 2 pôles, modélisé par un oscillateur amorti (couple de rappel vers la direction du champ, frottement). Fréquence propre {F0}{NB}Hz, amortissement moyen : ces valeurs sont choisies pour que <code>delay(5)</code> fonctionne à vide, pas mesurées sur un moteur réel.</li>
      <li><strong>Champ des bobines</strong> : chaque bobine crée un champ de même intensité, dirigé vers elle ; les bobines alimentées s’additionnent comme des vecteurs. L’établissement du courant dans les bobines est supposé instantané (en réalité, l’inductance le retarde).</li>
      <li><strong>Charge</strong> : un couple résistant constant, exprimé en pourcentage du couple maximal d’une seule bobine. Une vraie charge peut varier (pompe, frottements).</li>
      <li><strong>Pas perdu</strong> : un pas est « suivi » si le rotor est à moins de 30° de la position commandée avant le pas suivant ; le nombre de pas perdus est estimé d’après l’écart final entre rotation attendue et rotation réelle.</li>
      <li><strong>Temps</strong> : la simulation calcule en temps réel (délais en ms) puis l’animation est ralentie pour être lisible.</li>
      <li><strong>Boucle ouverte</strong> : aucun capteur ; le programme ne connaît pas la position réelle.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défi</button>
    </span>);

  const verrouille = enDefi;               // en défi, la séquence est imposée
  const programme = (
    <div style={{ ...styleBoite, ...cadre('programme') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Programme de commande</div>
      {!verrouille && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {Object.keys(PRE).map(n => <button key={n} onClick={() => charger(n)} style={stylePetitBouton(egal(cycle, n), '#b45309')}>{PRE[n].nom}</button>)}
          <button onClick={() => { setGrille(VIDE.map(c => c.slice())); }} style={stylePetitBouton(false)}>Tout effacer</button>
        </div>)}
      {!verrouille && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>
          Nombre de pas de la séquence :
          {[4, 8].map(n => <button key={n} onClick={() => setLongueur(n)} style={stylePetitBouton(longueur === n, '#b45309')}>{n}</button>)}
        </div>)}
      <Chrono seq={cycle} idx={res ? k % cycle.length : -1} grille={grille} setGrille={verrouille ? () => {} : g => setGrille(g)} editable={!verrouille} verifie={false}/>
      <div style={{ fontSize: 12, color: KIT.txt2, margin: '4px 0 8px' }}>La séquence est répétée jusqu’à {N_PAS} pas. Cliquez sur une case pour alimenter ou éteindre la bobine à ce pas.</div>
      <Curseur nom={<>Délai delay(D) entre deux pas</>} valeur={delai} onChange={setDelai} min={0.5} max={12} pas={0.5} unite="ms" decimales={1} couleur="#b45309"/>
      <Curseur nom="Charge (couple résistant, % du couple d’une bobine)" valeur={charge} onChange={v => !enDefi && setCharge(v)} min={0} max={40} pas={5} unite="%" decimales={0} couleur="#7c3aed"/>
      <button onClick={() => executer()} style={styleBouton(true, '#16a34a')}>▶ Exécuter</button>
      {stale && res && <span style={{ marginLeft: 8, fontSize: 13, color: '#b45309', fontWeight: 700 }}>Réglages modifiés : exécutez à nouveau.</span>}
    </div>);

  const figure = (
    <div style={{ ...styleBoite, ...cadre('figure') }}>
      <Moteur coils={coils} thDeg={thDeg} cible={null} onBobine={null}/>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
        <button onClick={lecture} disabled={!res} style={styleBouton(true, P.current.play ? '#dc2626' : '#16a34a')}>{P.current.play ? '⏸' : '▶'}</button>
        <input type="range" min="0" max="1" step="0.002" value={res ? tp / res.dureeTot : 0} onChange={e => curseurTemps(parseFloat(e.target.value))}
          aria-label="Position dans le temps" disabled={!res} style={{ flex: 1, accentColor: '#b45309' }}/>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
        {res ? <>Temps réel : {nf(tp * 1000, 1)}{NB}ms sur {nf(res.dureeTot * 1000, 0)}{NB}ms ; animation ralentie ×{nf(DUREE_ANIM / res.dureeTot, 0)}. Pas en cours : {k + 1}/{N_PAS}.</> : 'Réglez le programme puis appuyez sur « Exécuter ».'}
      </div>
    </div>);

  const r = res;
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {!r ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Aucune exécution pour l’instant.</div> : <>
        <LigneMesure nom="Pas commandés" valeur={String(r.N)}/>
        <LigneMesure nom="Pas suivis par le rotor" valeur={`${r.nSuivis}`} couleur={r.nSuivis === r.N ? '#16a34a' : '#dc2626'}/>
        <LigneMesure nom="Rotation attendue" valeur={r.attendu == null ? 'non définie' : `${nf(r.attendu, 0)}${NB}° (${nf(r.attendu / 360, 2)} tours)`}/>
        <LigneMesure nom="Rotation réelle" valeur={`${nf(r.thF - r.T0, 0)}${NB}° (${nf((r.thF - r.T0) / 360, 2)} tours)`} couleur="#2563eb"/>
        <LigneMesure nom="Pas perdus (estimation)" valeur={r.perdus == null ? '–' : String(Math.abs(r.perdus))} couleur={r.perdus === 0 ? '#16a34a' : '#dc2626'}/>
        <LigneMesure nom="Durée du programme" valeur={`${nf(r.dureeProg * 1000, 0)}${NB}ms`}/>
        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: stale ? '#64748b' : (r.ok ? '#16a34a' : '#dc2626') }}>
          {r.incoh ? 'La séquence n’impose pas un sens de rotation régulier : le rotor ne suit pas.' : r.ok ? 'Aucun pas perdu : le rotor a suivi toute la séquence.' : `Le rotor a décroché : ${Math.abs(r.perdus)} pas perdus environ, et le programme ne le sait pas.`}
        </div></>}
    </div>);
  const courbe = (
    <div style={{ ...styleBoite, ...cadre('courbe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Angle du rotor au cours du temps</div>
      {r ? <Courbe res={r} tp={tp} stale={stale}/> : <div style={{ fontSize: 13.5, color: KIT.txt2, padding: '10px 4px' }}>La courbe apparaîtra après l’exécution du programme.</div>}
      <div style={{ fontSize: 12, color: KIT.txt2 }}>Orange pointillé : position commandée (le champ). Bleu : angle réel du rotor. Rouge : instant affiché.</div>
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Diminuez le délai en pas complet jusqu’à ce que des pas soient perdus. Que fait alors la courbe bleue ?</li>
        <li>Comparez le délai minimal en pas complet, en demi-pas et à force maximale, pour la même charge.</li>
        <li>Augmentez la charge : que devient le délai minimal ?</li>
        <li>Construisez votre propre séquence (par exemple 1, 1+2, 2, 2+3 en 4 pas) : le moteur tourne-t-il régulièrement ?</li>
        <li>Alimentez deux bobines opposées : que se passe-t-il ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>le rotor oscille et met du temps à atteindre sa position : délai trop court → pas perdus</li>
        <li>charge plus forte → délai plus long ou pas à force maximale</li>
        <li>boucle ouverte : le programme ne sait pas qu’un pas a été perdu</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mc-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .mc-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr); }
        .mc-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .mc-l1.cote, .mc-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Piloter le moteur avec le code</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le microcontrôleur ne voit pas le rotor : il allume les bobines selon une <strong>séquence</strong> et attend un <strong>délai</strong> entre deux pas. Construisez la séquence, réglez le délai et la charge, puis observez si le rotor <strong>suit</strong> la commande ou <strong>perd des pas</strong>.</div>
      <div className={`mc-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}><>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></></div>}
          <div className={`mc-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {figure}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{programme}{mesures}</div>
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? panneauHypo : null}
      </div>
      <div className="mc-l2">{courbe}{enDefi ? null : panneauHypo}</div>
      {mode === 'explore' && <div className="mc-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
