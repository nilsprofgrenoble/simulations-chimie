import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./modesTransfertModele";
import { ModesTransfertExplore } from "./ModesTransfertExplore";
import { QCM } from "./modesTransfertQcm";
import { SceneMode, SvgTravail, SvgThermique, SvgArbre, SvgSigneW } from "./ModesTransfertSchemas";

const SIM_ID = 245, CLE_GUIDE = 'modestransfert-guide-v1';
declarerDefis(SIM_ID, [['classer', 'Classer cinq situations'], ['travail', 'Travail d’un chariot']]);

// ====================================================
//  SIM 245 — TRAVAIL OU TRANSFERT THERMIQUE : CLASSER LES TRANSFERTS D'ÉNERGIE (TSTL, enseignement PCM, partie « Énergie »).
//  Une seule idée : un transfert d'énergie se classe en travail (mécanique, électrique) ou en transfert thermique (conduction, convection, rayonnement) selon le phénomène qui le provoque.
//  Aucune situation du Moodle : situations génériques inventées. Théorème de l'énergie cinétique (première) : ΔEc = somme des travaux.
//  Capacités visées (jamais affichées) : distinguer travail et transfert thermique ; identifier le mode (mécanique, électrique, conduction, convection, rayonnement) ; algébriser un transfert ; puissance P = |E| ÷ Δt.
//  Modèle : modesTransfertModele.js (test node). QCM : modesTransfertQcm.js. Schémas : ModesTransfertSchemas.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const sgJ = v => (v > 0 ? '+' : v < 0 ? '−' : '') + nbf(Math.abs(v), 0) + `${NB}J`;
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', violet: '#6d28d9' };
const PG = M.PARCOURS;
const INDICE_MODE = {
  meca: 'Une force s’exerce-t-elle en faisant varier la valeur d’une vitesse ?',
  elec: 'Un courant relie-t-il un générateur à un récepteur ?',
  cond: 'La chaleur passe-t-elle de proche en proche, sans déplacement de matière ?',
  conv: 'De la matière (liquide ou gaz) se déplace-t-elle en transportant la chaleur ?',
  ray: 'L’énergie traverse-t-elle le vide ou l’air par des ondes électromagnétiques ?',
};

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options, style }) => (<div style={{ marginBottom: 8 }}>
  {label && <label htmlFor={id} style={libelle}>{label}</label>}
  <select id={id} aria-label={label ? undefined : 'Mode de transfert'} value={valeur} onChange={ev => onChange(ev.target.value)} style={{ ...selectStyle, ...style }}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);
const OPTIONS_MODE = [['', 'Choisir le mode de transfert…'], ...M.MODES.map(m => [m.id, m.nom])];

// ====================================================
export function SimulationModesTransfert() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('classer');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ sit: 'poussee', hyp: '', sys: 'vers', E: 300, dt: 5 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['deux', 'meca', 'elec', 'conduction', 'convection', 'matiere', 'rayonnement', 'melange', 'signe', 'puissance', 'fin'];
  const etape = guide.etape;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];

  const ETAPES = [
    { id: 'deux', titre: 'Deux familles de transferts', focus: ['scene'],
      texte: <>Un système échange de l’énergie avec d’autres systèmes de <strong>deux façons</strong> : par <strong>travail</strong> (noté <strong>W</strong>), quand une force ou un courant électrique assure le transfert, ou par <strong>transfert thermique</strong> (noté <strong>Q</strong>), quand l’énergie passe d’un corps chaud à un corps froid. Ici, une main pousse un chariot, dont la vitesse augmente.</>,
      tache: { type: 'qcm', q: 'Comment la main transfère-t-elle de l’énergie au chariot ?', ...QCM.deux,
        expl: 'La main exerce une force qui fait varier la valeur de la vitesse du chariot : c’est un transfert par travail.', indice: 'La main exerce-t-elle une force ? Cette force fait-elle varier la vitesse ?' } },
    { id: 'meca', titre: 'Le travail mécanique', focus: ['scene'],
      texte: <>Il y a <strong>travail mécanique</strong> quand une force s’exerce d’un système sur un autre et fait <strong>varier la valeur de la vitesse</strong> d’au moins l’un d’eux. Un frein serré contre une roue en rotation est l’un de ces cas.</>,
      tache: { type: 'qcm', q: 'Laquelle de ces situations est un transfert d’énergie par travail mécanique ?', ...QCM.meca,
        expl: 'Le frein exerce une force qui fait diminuer la valeur de la vitesse de la roue : travail mécanique. La pierre posée reste immobile (aucune variation de vitesse), la casserole est un transfert thermique et le fil un travail électrique.', indice: 'Cherchez la situation où une force fait varier une vitesse.' } },
    { id: 'elec', titre: 'Le travail électrique', focus: ['scene'],
      texte: <>Le <strong>travail électrique</strong> (ou transfert électrique d’énergie) est celui qu’assure un <strong>courant électrique</strong> entre un <strong>générateur</strong> et un <strong>récepteur</strong>. Une pile est reliée par des fils à une lampe.</>,
      tache: { type: 'qcm', q: 'Comment l’énergie passe-t-elle de la pile à la lampe ?', ...QCM.elec,
        expl: 'Un courant relie le générateur (la pile) au récepteur (la lampe) : c’est un travail électrique. La lampe cède ensuite de l’énergie à l’air, par transfert thermique et par rayonnement.', indice: 'Quel phénomène relie un générateur à un récepteur ?' } },
    { id: 'conduction', titre: 'La conduction thermique', focus: ['scene'],
      retenirTitre: 'À retenir : le travail',
      retenir: <>
        <SvgTravail/>
        <ul style={puces}>
          <li>Le <strong>travail W</strong> est un transfert d’énergie par une <strong>force</strong> qui fait varier la vitesse (mécanique) ou par un <strong>courant</strong> (électrique).</li>
          <li>Exemple : une main qui accélère un chariot ; une pile qui alimente un moteur.</li>
          <li>Moyen de s’en souvenir : <strong>« une force ou un courant »</strong>.</li>
        </ul></>,
      texte: <>Un <strong>transfert thermique</strong> va d’un corps chaud vers un corps froid. Le premier mode est la <strong>conduction</strong> : la chaleur se propage <strong>de proche en proche</strong> dans la matière, sans que la matière se déplace. Une extrémité d’une barre de métal plonge dans un liquide chaud ; l’autre extrémité chauffe peu à peu, la barre restant immobile.</>,
      tache: { type: 'qcm', q: 'Par quel mode l’énergie se propage-t-elle dans la barre ?', ...QCM.conduction,
        expl: 'La chaleur se propage de proche en proche dans la barre, sans déplacement de matière : conduction.', indice: 'La matière de la barre bouge-t-elle ? Par quoi la chaleur se propage-t-elle ?' } },
    { id: 'convection', titre: 'La convection', focus: ['scene'],
      texte: <>Deuxième mode : la <strong>convection</strong>. La chaleur est transportée par un <strong>mouvement macroscopique de matière</strong>. Une cuve d’eau est chauffée par en dessous : l’eau chaude, moins dense, monte ; l’eau froide descend.</>,
      tache: { type: 'qcm', q: 'Par quel mode la chaleur est-elle transportée dans l’eau de la cuve ?', ...QCM.convection,
        expl: 'L’eau se déplace en transportant la chaleur : c’est la convection.', indice: 'De la matière se déplace-t-elle dans la cuve ?' } },
    { id: 'matiere', titre: 'Convection : quels milieux ?', focus: ['scene'],
      texte: <>La convection <strong>ne concerne que les liquides et les gaz</strong>, car il faut que la matière puisse s’écouler. La conduction, elle, concerne les solides, les liquides et les gaz. On revient à la barre de métal, chauffée à une extrémité.</>,
      tache: { type: 'qcm', q: 'Peut-il y avoir convection dans cette barre solide ?', ...QCM.matiere,
        expl: 'La matière d’un solide ne s’écoule pas : il ne peut pas y avoir de convection ; la chaleur s’y propage par conduction.', indice: 'La convection ne concerne que certains états de la matière : lesquels ?' } },
    { id: 'rayonnement', titre: 'Le rayonnement', focus: ['scene'],
      texte: <>Troisième mode : le <strong>rayonnement</strong>. L’énergie est transportée par des <strong>ondes électromagnétiques</strong>, qui se propagent <strong>même dans le vide</strong>. Le Soleil réchauffe une sonde dans l’espace, où il n’y a presque pas de matière.</>,
      tache: { type: 'qcm', q: 'Par quel mode l’énergie du Soleil atteint-elle la sonde ?', ...QCM.rayonnement,
        expl: 'Entre le Soleil et la sonde il n’y a presque pas de matière : seule une propagation par ondes électromagnétiques est possible, c’est le rayonnement.', indice: 'Quel mode n’a pas besoin de matière ?' } },
    { id: 'melange', titre: 'Plusieurs transferts à la suite', focus: ['scene'],
      texte: <>Une situation réelle enchaîne souvent plusieurs transferts. Une <strong>plaque chauffante électrique</strong> chauffe le fond d’une casserole posée dessus : d’abord un courant alimente la plaque, puis la plaque, plus chaude, échauffe le fond de la casserole au contact.</>,
      tache: { type: 'qcm', q: 'Quels sont les deux transferts, dans l’ordre ?', ...QCM.melange,
        expl: 'Le courant transfère l’énergie à la plaque par travail électrique ; la plaque chauffe le fond de la casserole par conduction, au contact.', indice: 'Pour chaque étape : un courant, ou un contact entre un corps chaud et un corps froid ?' } },
    { id: 'signe', titre: 'Le signe d’un travail', focus: ['scene'],
      retenirTitre: 'À retenir : les trois modes de transfert thermique',
      retenir: <>
        <SvgThermique/>
        <ul style={puces}>
          <li>Trois modes : <strong>conduction</strong> (de proche en proche), <strong>convection</strong> (matière en mouvement : liquides et gaz), <strong>rayonnement</strong> (ondes, sans matière).</li>
          <li>Exemple : une barre chauffée en un bout : conduction ; une cuve d’eau chauffée par en dessous : convection.</li>
          <li>Moyen de s’en souvenir : <strong>« proche en proche, matière en mouvement, ondes »</strong>.</li>
        </ul></>,
      texte: <>Un travail est une valeur <strong>algébrique</strong> : positive si le système reçoit l’énergie, négative s’il la cède. Pour un système, le théorème de l’énergie cinétique vu en première s’écrit <strong>ΔEc = somme des travaux</strong>, avec <strong>Ec = ½ × m × v²</strong>. Un chariot de masse <strong>{nbf(PG.m, 1)} kg</strong> ralentit de <strong>{nbf(PG.v0, 1)} m/s</strong> à <strong>{nbf(PG.v1, 1)} m/s</strong> sous l’effet d’une force de freinage, seule force qui fait varier sa vitesse. On étudie le système « le chariot ».</>,
      tache: { type: 'num', q: 'Travail reçu par le chariot, en joules (J), avec son signe', unite: 'J', vrai: PG.W, tol: 0.02, affiche: v => String(Math.round(v)).replace('-', '−'), cs: 2,
        pieges: [[-PG.W, 'Le signe est inversé : le chariot ralentit, son énergie cinétique diminue, le travail est négatif.'], [M.ec(PG.m, PG.v1), 'Cette valeur est l’énergie cinétique finale ; le travail est la variation d’énergie cinétique.'], [-M.ec(PG.m, PG.v0), 'Il faut tenir compte aussi de l’énergie cinétique qui reste au chariot.']],
        calcul: () => [`ΔEc = ½ × ${nbf(PG.m, 1)} × ${nbf(PG.v1, 1)}² − ½ × ${nbf(PG.m, 1)} × ${nbf(PG.v0, 1)}² = ${nbf(M.ec(PG.m, PG.v1), 1)} − ${nbf(M.ec(PG.m, PG.v0), 1)} = −12 J, donc W = −12 J.`],
        expl: 'W = ΔEc = 4,0 − 16 = −12 J.', indice: 'W = Ec finale − Ec initiale, avec Ec = ½ × m × v².' } },
    { id: 'puissance', titre: 'La puissance du transfert', focus: ['scene'],
      retenirTitre: 'À retenir : le signe d’un travail',
      retenir: <>
        <SvgSigneW/>
        <ul style={puces}>
          <li>Un système qui <strong>accélère</strong> reçoit un travail positif ; un système qui <strong>ralentit</strong> cède de l’énergie : travail négatif. ΔEc = somme des travaux.</li>
          <li>Exemple : Ec de 10 J à 4 J : W = −6 J.</li>
          <li>Moyen de s’en souvenir : <strong>« ΔEc et W ont le même signe »</strong>.</li>
        </ul></>,
      texte: <>Le freinage du chariot a transféré <strong>{sgJ(PG.W)}</strong> en <strong>Δt = {nbf(PG.dt, 1)} s</strong>. La <strong>puissance</strong> d’un transfert est l’énergie transférée par unité de temps, en valeur absolue : <strong>P = |W| ÷ Δt</strong>.</>,
      tache: { type: 'num', q: 'Puissance du transfert par travail, en watts (W)', unite: 'W', vrai: PG.P, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[-PG.P, 'Une puissance est positive : on utilise la valeur absolue du travail.'], [PG.W * PG.dt, 'Il faut diviser l’énergie par la durée, pas la multiplier.']],
        calcul: () => [`P = |W| ÷ Δt = 12 ÷ ${nbf(PG.dt, 1)} = ${nbf(PG.P, 1)} W.`],
        expl: `P = 12 ÷ ${nbf(PG.dt, 1)} = ${nbf(PG.P, 1)} W.`, indice: 'P = |W| ÷ Δt, avec |W| en joules et Δt en secondes.' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : classer un transfert',
      retenir: <>
        <SvgArbre/>
        <ul style={puces}>
          <li>Pour classer un transfert : une <strong>force</strong> qui fait varier la vitesse (travail mécanique), un <strong>courant</strong> (travail électrique), de la <strong>matière qui se déplace</strong> (convection), des <strong>ondes</strong> (rayonnement), sinon la propagation <strong>de proche en proche</strong> (conduction).</li>
          <li>Exemple : une plaque électrique qui chauffe une casserole : travail électrique, puis conduction.</li>
          <li>Moyen de s’en souvenir : <strong>« force, courant, matière, ondes, sinon proche en proche »</strong>.</li>
        </ul></>,
      texte: <>Vous savez classer un transfert d’énergie en travail (mécanique, électrique) ou en transfert thermique (conduction, convection, rayonnement), donner son signe selon le système et sa puissance. Explorez les situations ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  const sceneDe = { deux: 'chariot', meca: 'frein', elec: 'pile', conduction: 'barre', convection: 'casserole', matiere: 'barre', rayonnement: 'soleil', melange: 'melange', signe: 'frein', puissance: 'frein', fin: 'chariot' };
  const sit = M.situation(ti.sit), mT = M.mode(sit.mode);
  const sceneCle = enExplore ? sit.scene : sceneDe[idEtape];

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'classer' ? { ...M.tirageDefiA(), reps: {}, verifie: false, corr: false } : { ...M.tirageDefiB(), reps: { w: '', p: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'classer') {
      const bons = defi.ids.map(id => defi.reps[id] === M.situation(id).mode), ok = bons.every(Boolean);
      setDefi(x => ({ ...x, verifie: true, ok, bons })); noterA(ok);
    } else {
      const w = lireNombre(defi.reps.w), p = lireNombre(defi.reps.p);
      const okW = isFinite(w) && proche(w, defi.W, 0.05), okP = isFinite(p) && proche(p, defi.P, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok: okW && okP, okW, okP })); noterB(okW && okP);
    }
  };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('mtr-verif')?.click()} onChange={e2 => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  const diagnosticA = () => defi.ids.map((id, i) => {
    if (defi.bons[i]) return null;
    const s = M.situation(id), rep = defi.reps[id];
    return `Situation ${i + 1} : ${rep ? 'ce n’est pas le bon mode.' : 'choisissez un mode.'} ${INDICE_MODE[s.mode]}`;
  }).filter(Boolean);
  const diagnosticB = () => {
    const x = defi, msgs = [], w = lireNombre(x.reps.w), p = lireNombre(x.reps.p), Ec0 = M.ec(x.m, x.v0), Ec1 = M.ec(x.m, x.v1);
    if (!isFinite(w)) msgs.push('Travail : écrivez un nombre avec son signe (virgule ou point).');
    else if (!x.okW) {
      if (proche(w, -x.W, 0.05)) msgs.push(`Travail : le signe est inversé : le chariot ${x.W > 0 ? 'accélère, son énergie cinétique augmente : le travail est positif' : 'ralentit, son énergie cinétique diminue : le travail est négatif'}.`);
      else if (proche(Math.abs(w), Ec1, 0.05) || proche(Math.abs(w), Ec0, 0.05)) msgs.push('Travail : cette valeur est une énergie cinétique, pas une variation : W = Ec finale − Ec initiale.');
      else if (proche(w, 0.5 * x.m * (x.v1 - x.v0) ** 2, 0.05) || proche(w, -0.5 * x.m * (x.v1 - x.v0) ** 2, 0.05)) msgs.push('Travail : on ne soustrait pas les vitesses : on calcule les deux énergies cinétiques, puis on les soustrait.');
      else msgs.push(`Travail : W = Ec finale − Ec initiale = ½ × ${x.m} × ${x.v1}² − ½ × ${x.m} × ${x.v0}², en J. Votre valeur est ${w > x.W ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(p)) msgs.push('Puissance : écrivez un nombre (virgule ou point).');
    else if (!x.okP) {
      if (proche(p, -x.P, 0.05)) msgs.push('Puissance : une puissance est positive : on utilise la valeur absolue du travail.');
      else if (proche(p, Math.abs(x.W) * x.dt, 0.05)) msgs.push('Puissance : il faut diviser l’énergie par la durée, pas la multiplier.');
      else if (isFinite(w) && !x.okW && proche(p, Math.abs(w) / x.dt, 0.05)) msgs.push('Puissance : votre calcul est cohérent avec votre travail, mais celui-ci n’est pas le bon.');
      else msgs.push(`Puissance : P = |W| ÷ Δt = ${fmt2(Math.abs(x.W))} ÷ ${x.dt}, en W. Votre valeur est ${p > x.P ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'classer'
    ? defi.ids.map((id, i) => `${i + 1}. ${M.mode(M.situation(id).mode).nom} : ${M.RAISON[M.situation(id).mode]}.`).join(' ')
    : `W = Ec finale − Ec initiale = ½ × ${defi.m} × ${defi.v1}² − ½ × ${defi.m} × ${defi.v0}² = ${fmt2(M.ec(defi.m, defi.v1))} − ${fmt2(M.ec(defi.m, defi.v0))} = ${defi.W > 0 ? '+' : '−'}${fmt2(Math.abs(defi.W))} J (le chariot ${defi.W > 0 ? 'accélère' : 'ralentit'}). P = |W| ÷ Δt = ${fmt2(Math.abs(defi.W))} ÷ ${defi.dt} = ${fmt2(defi.P)} W.`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['classer', 'Classer cinq situations'], ['travail', 'Travail d’un chariot']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'classer' ? 'Défi : classer cinq situations' : 'Défi : travail d’un chariot'}</div>
      {defi.type === 'classer' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Pour chaque situation, choisissez <strong>le mode par lequel l’énergie est transférée</strong>.</div>
        {defi.ids.map((id, i) => <div key={id} style={{ marginBottom: 6 }}>
          <div style={{ ...lbl, marginBottom: 3 }}><strong>{i + 1}.</strong> {M.situation(id).texte}</div>
          <select aria-label={`Mode de transfert de la situation ${i + 1}`} value={defi.reps[id] || ''} onChange={e2 => setDefi(x => ({ ...x, reps: { ...x.reps, [id]: e2.target.value }, verifie: false, corr: false }))}
            style={{ ...selectStyle, borderColor: defi.verifie ? (defi.bons[i] ? '#15803d' : '#dc2626') : KIT.bord }}>
            {OPTIONS_MODE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>)}
        <IndiceDefi cache={false}>Une force qui fait varier la vitesse : travail mécanique. Un courant : travail électrique. De la matière qui se déplace : convection. Des ondes, même dans le vide : rayonnement. Sinon, de proche en proche : conduction.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un chariot de masse <strong>{defi.m} kg</strong> roule sur un sol horizontal : sa vitesse passe de <strong>{defi.v0} m/s</strong> à <strong>{defi.v1} m/s</strong> en <strong>{defi.dt} s</strong>, sous l’effet d’une seule force horizontale. On étudie le système « le chariot ». Calculez le <strong>travail reçu par le chariot</strong> (en J, avec son signe) et la <strong>puissance</strong> du transfert (en W). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>W (J) =</span>{champ('w', 'Travail reçu par le chariot en joules, avec son signe', defi.verifie && defi.okW)}
          <span>P (W) =</span>{champ('p', 'Puissance du transfert en watts', defi.verifie && defi.okP)}
        </div>
        <IndiceDefi cache={false}>ΔEc = somme des travaux, avec Ec = ½ × m × v² : W = Ec finale − Ec initiale (signe : positif si le chariot accélère). Puis P = |W| ÷ Δt.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="mtr-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'classer' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Classement du programme</strong> : transfert par travail (mécanique, électrique) ou transfert thermique (conduction, convection, rayonnement). Une situation réelle enchaîne souvent plusieurs transferts ; on en étudie un à la fois.</li>
      <li><strong>Travail mécanique</strong> : une force qui fait varier la valeur de la vitesse ; une force qui ne la fait pas varier (pierre posée) ne transfère pas d’énergie par travail.</li>
      <li><strong>Sens du transfert thermique</strong> : toujours du corps le plus chaud vers le corps le plus froid.</li>
      <li><strong>Frottements, courant</strong> : on ne détaille pas la conversion d’énergie qui suit un frottement (échauffement) ni les pertes dans les fils.</li>
      <li><strong>Théorème de l’énergie cinétique</strong> (première) : ΔEc = somme des travaux, pour un chariot dont seule une force fait varier la vitesse.</li>
      <li><strong>Valeurs inventées</strong> pour la simulation (masses, vitesses, durées, énergies) : ce ne sont pas des mesures.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? sit.texte : 'La situation étudiée'}</div>
      <SceneMode k={sceneCle}/>
    </div>);
  const hypOK = ti.hyp !== '' && ti.hyp === sit.mode;
  const systemeNom = ti.sys === 'de' ? sit.de : sit.vers;
  const valeurAlg = ti.sys === 'de' ? -ti.E : ti.E;
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="mtr-s" label="Situation" valeur={ti.sit} onChange={v => setTi(s => ({ ...s, sit: v, hyp: '' }))} options={M.SITUATIONS.map(s => [s.id, s.texte.replace(/\.$/, '')])}/>
      <Sel id="mtr-h" label="Votre hypothèse : quel mode de transfert ?" valeur={ti.hyp} onChange={v => setTi(s => ({ ...s, hyp: v }))} options={OPTIONS_MODE}/>
      <Sel id="mtr-y" label="Système étudié" valeur={ti.sys} onChange={v => setTi(s => ({ ...s, sys: v }))} options={[['vers', `${sit.vers} (reçoit)`], ['de', `${sit.de} (cède)`]]}/>
      <Sel id="mtr-e" label="Énergie transférée" valeur={ti.E} onChange={v => setTi(s => ({ ...s, E: Number(v) }))} options={[100, 300, 600].map(v => [v, `${v} J`])}/>
      <Sel id="mtr-t" label="Durée" valeur={ti.dt} onChange={v => setTi(s => ({ ...s, dt: Number(v) }))} options={[2, 5, 10].map(v => [v, `${v} s`])}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Choisissez d’abord une situation et votre hypothèse : un retour vous dit si le mode est le bon. Changez ensuite de système pour voir le signe du transfert.</div>
    </div>);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Analyse de la situation</div>
      {ti.hyp === '' ? <div style={{ ...lbl, color: KIT.txt2, marginBottom: 6 }}>Choisissez votre hypothèse dans les réglages pour voir le retour.</div>
        : <div role="status" aria-live="polite" style={{ ...lbl, marginBottom: 6, fontWeight: 600, color: hypOK ? '#15803d' : '#b91c1c' }}>{hypOK ? '✓ Bon mode.' : '✗ Ce n’est pas le bon mode.'} {hypOK ? `${mT.nom} : ${M.RAISON[mT.id]}.` : INDICE_MODE[sit.mode]}</div>}
      {hypOK && <>
        <LigneMesure nom="Famille de transfert" valeur={mT.type === 'W' ? 'travail W' : 'transfert thermique Q'} couleur={COL.violet}/>
        <LigneMesure nom="Mode" valeur={mT.court}/>
        <LigneMesure nom={`Transfert pour ${systemeNom}`} valeur={`${mT.type} = ${sgJ(valeurAlg)}`} couleur={valeurAlg > 0 ? COL.vert : COL.rouge}/>
        <LigneMesure nom="Puissance du transfert" valeur={`${nbf(M.puissance(ti.E, ti.dt), 1)}${NB}W`}/>
      </>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Pour chaque situation, classez d’abord de tête, puis vérifiez avec votre hypothèse. Quelles situations vous ont posé problème ?</li>
      <li>Comparez « la barre de métal » et « l’eau de la cuve » : dans les deux cas, la chaleur se propage. Qu’est-ce qui les distingue ?</li>
      <li>Pour une même situation, passez du système qui reçoit au système qui cède : que devient le signe ? Et la puissance ?</li>
      <li>Doublez la durée à énergie constante : que devient la puissance ?</li>
      <li>Trouvez deux situations où il y a un transfert thermique sans contact entre les deux corps.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Travail W : mécanique (une force qui fait varier la vitesse) ou électrique (un courant)</li>
        <li>Transfert thermique Q : conduction (de proche en proche), convection (matière en mouvement : liquides et gaz), rayonnement (ondes, sans matière)</li>
        <li>Reçu : signe +. Cédé : signe −. Le signe dépend du système étudié</li>
        <li>ΔEc = somme des travaux ; P = |E| ÷ Δt</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mtr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mtr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mtr-col { display: flex; flex-direction: column; gap: 12px; }
        .mtr-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .mtr-l1.cote .mtr-carte { order: 2; } .mtr-l1.cote .mtr-main { order: 1; }
          .mtr-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .mtr-ex > * { grid-column: 1; }
          .mtr-ex > .mtr-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .mtr-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .mtr-in { animation: mtr-fondu 0.35s ease-out; } @keyframes mtr-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Travail ou transfert thermique : classer les transferts d’énergie</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un transfert d’énergie est un <strong>travail</strong> (force, courant électrique) ou un <strong>transfert thermique</strong> (conduction, convection, rayonnement). Apprenez à reconnaître le phénomène qui le provoque.</div>
      {!enExplore && <div className={`mtr-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="mtr-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="mtr-carte">{panneauHypo}</div>}
        <div className="mtr-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'classer' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="mtr-col"><div className="mtr-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <ModesTransfertExplore ti={ti} setTi={setTi} indices={INDICE_MODE}/>
        <div style={{ margin: '12px 0' }}>
          <Section titre={`Réglages précis et mesures : ${sit.texte.replace(/\.$/, '')}`} ouvert={!!ouv.precis} onBascule={() => bascule('precis')}>
            <div className="mtr-ex">
              {scene}
              <div className="mtr-reg">{reglages}</div>
              {mesures}
            </div>
          </Section>
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
