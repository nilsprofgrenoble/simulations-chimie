import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, IndiceDefi, indicesProfond , Frac } from "../commun";
import { Pic } from "../Pictos";
import * as A from "./ampModele";
import { SceneAmp } from "./AmpScene";
import { SvgAmpliCarte, SvgCanCarte, SvgSatCarte, SvgDecalCarte, SvgChaineCarte } from "./AmpSchemas";
import { useEtroit, StyleAnim, Chips } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

// ====================================================
// SIM 315 — « Amplifier une tension : de quelques mV au CAN » (terminale STL, SPCL, Systèmes et procédés : flux d'information).
//  Une idée : un capteur délivre quelques mV ; un amplificateur (AOP ±12 V, boîte noire) multiplie la tension par A = Us/Ue ; on choisit A pour remplir la plage 0 à 5 V du CAN,
//  on ajoute une tension continue pour centrer un signal alternatif, et on évite la saturation de l'AOP.
//  Capacités visées (jamais affichées à l'élève) : exploiter le facteur d'amplification d'un montage amplificateur ; adapter un signal à la plage d'entrée d'un CAN.
//  Hors périmètre : fonctionnement interne de l'AOP, gain en boucle ouverte, bande passante de l'AOP, calcul de A avec R1 et R2. Modèle : ampModele.js. Scène animée : AmpScene.jsx.
// ====================================================
const BLEU = '#0369a1', NB = A.NB, nb = A.nbf;
const SIM_ID = 315, CLE_GUIDE = 'amp-guide-v1';
declarerDefis(SIM_ID, [['A', 'Choisir le facteur d’amplification'], ['dc', 'Ajouter la tension continue']]);
const IDS = ['ue', 'can', 'amplifier', 'choisir', 'depasse', 'saturation', 'inverseur', 'bipolaire', 'decaler', 'complet', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// signaux du parcours (mV)
const S_UE = A.sig(0, 6), S_CHOIX = A.sig(0, 10), S_SAT = A.sig(0, 30), S_BIP = A.sig(-8, 8), S_COMPLET = A.sig(-12, 12);
const A_AMPLI = 100, A_DEPASSE = 700, A_SAT = 500, A_INV = -200, A_BIP = 250;
const BASE = { s: S_UE, Av: 1, vdc: 0, showUs: true, can: true, sat: false, yRange: [-1, 6.5], ctrlA: false, ctrlDc: false, montage: 'non', valeurs: false, aide: '', aop: true };
const AIDE_A = 'Faites glisser la poignée rouge de bas en haut : elle règle le niveau maximal de la sortie, donc le facteur d’amplification A.';
const AIDE_V = 'Faites glisser la poignée violette de bas en haut : elle règle la tension continue Vdc ajoutée au signal.';
const SCENES = {
  ue: { ...BASE, showUs: false },
  can: { ...BASE },
  amplifier: { ...BASE, Av: A_AMPLI },
  choisir: { ...BASE, s: S_CHOIX, ctrlA: true, valeurs: true, yRange: [-1, 8], aide: AIDE_A },
  depasse: { ...BASE, s: S_CHOIX, Av: A_DEPASSE, yRange: [-1, 8.5], aide: 'La partie rouge de la courbe est hors de la fenêtre verte du CAN.' },
  saturation: { ...BASE, s: S_SAT, Av: A_SAT, sat: true, yRange: [-2, 15], aide: 'La ligne pointillée marque la tension d’alimentation de l’AOP.' },
  inverseur: { ...BASE, s: S_CHOIX, Av: A_INV, yRange: [-3, 6.5], aop: true },
  bipolaire: { ...BASE, s: S_BIP, Av: A_BIP, yRange: [-3.5, 6.5] },
  decaler: { ...BASE, s: S_BIP, Av: A_BIP, ctrlDc: true, yRange: [-3.5, 6.5], valeurs: true, aide: AIDE_V },
  complet: { ...BASE, s: S_COMPLET, ctrlA: true, ctrlDc: true, yRange: [-4, 9], valeurs: true, aide: `${AIDE_A} ${AIDE_V}` },
  bilan: { ...BASE, s: S_BIP, Av: A_BIP, vdc: 2.5, valeurs: true },
};
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const sel = (id, lab, v, onChange, opts) => (<div style={{ minWidth: 0 }}>
  <label htmlFor={id} style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{lab}</label>
  <select id={id} value={v} onChange={onChange} style={menu}>{opts}</select></div>);

// scène commune au parcours, aux défis et à l'exploration
function Scene({ sc, Av, vdc, setA, setVdc, aria, touche = true, extra }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite), anime = !reduitMouvement();
  const tau = usePhase(0.5, anime, 0) / (2 * Math.PI);
  return (
    <div ref={boite} style={{ ...styleBoite, padding: 6 }}>
      <StyleAnim/>
      <SceneAmp s={sc.s} Again={Av} vdc={vdc} setA={setA} setVdc={setVdc} ctrlA={sc.ctrlA} ctrlDc={sc.ctrlDc} montage={sc.montage} showUs={sc.showUs} can={sc.can} sat={sc.sat}
        yRange={sc.yRange} etroit={etroit} svgRef={svgRef} aria={aria} tau={tau} valeurs={sc.valeurs} touche={touche} aop={sc.aop}/>
      {extra}
      {sc.aide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8, lineHeight: 1.45 }}>{sc.aide}</div>}
    </div>);
}
function SceneGuide({ sc, pos, setPos, cleA, cleV, aria }) {
  const [touche, setTouche] = useState(false);
  const Av = cleA ? pos[cleA] : sc.Av, vdc = cleV ? pos[cleV] : sc.vdc;
  const setA = v => { setTouche(true); setPos(p => (p[cleA] === v ? p : { ...p, [cleA]: v })); };
  const setV = v => { setTouche(true); setPos(p => (p[cleV] === v ? p : { ...p, [cleV]: v })); };
  return <Scene sc={sc} Av={Av} vdc={vdc} setA={setA} setVdc={setV} aria={aria} touche={touche}/>;
}

// ---------- exploration ----------
const PRESETS = [
  { id: 'faible', nom: 'Capteur de 0 à 6 mV', s: A.sig(0, 6) },
  { id: 'cap10', nom: 'Capteur de 0 à 10 mV', s: A.sig(0, 10) },
  { id: 'cap20', nom: 'Capteur de 0 à 20 mV', s: A.sig(0, 20) },
  { id: 'cap40', nom: 'Capteur de 0 à 40 mV', s: A.sig(0, 40) },
  { id: 'micro', nom: 'Microphone : de −8 à +8 mV', s: A.sig(-8, 8) },
  { id: 'sonde', nom: 'Sonde : de −15 à +15 mV', s: A.sig(-15, 15) },
];
const exInitial = () => ({ preset: 'cap10', montage: 'non', A: 300, vdc: 0, echelle: 'can', can: true, valeurs: true });
function AmpExplore({ ex, setEx, ouv, setOuv }) {
  const [touche, setTouche] = useState(false);
  const p = PRESETS.find(x => x.id === ex.preset) || PRESETS[0];
  const sc = { ...BASE, s: p.s, montage: ex.montage, ctrlA: true, ctrlDc: true, sat: true, can: ex.can, valeurs: ex.valeurs, yRange: ex.echelle === 'sat' ? [-14, 14] : [-4, 7.5] };
  const setA = v => { setTouche(true); setEx(x => (x.A === v ? x : { ...x, A: v })); };
  const setV = v => { setTouche(true); setEx(x => (x.vdc === v ? x : { ...x, vdc: v })); };
  const e = A.extremes(p.s, ex.A, ex.vdc), et = A.etatCAN(p.s, ex.A, ex.vdc), sa = A.sature(p.s, ex.A, ex.vdc);
  const nom = `${p.nom} · A = ${nb(ex.A, 0)} · Vdc = ${nb(ex.vdc, 1)}${NB}V`;
  const message = !touche ? 'Faites glisser la poignée rouge (le facteur A, à droite) et la poignée violette (la tension continue Vdc, à gauche) : la courbe de sortie, la fenêtre du CAN et les parties perdues se redessinent en direct.'
    : `A = ${nb(ex.A, 0)}${ex.A < 0 ? ' (montage inverseur)' : ''}, Vdc = ${nb(ex.vdc, 1)}${NB}V : Us va de ${nb(e.min, 2)}${NB}V à ${nb(e.max, 2)}${NB}V.${sa.haut || sa.bas ? ` L’AOP sature : Us est écrêtée à ±${A.V_SAT}${NB}V.` : ''}${et.haut ? ' Le haut dépasse 5 V : le CAN le lit comme 5 V.' : ''}${et.bas ? ' Le bas est sous 0 V : le CAN le lit comme 0 V.' : ''}${et.dans ? ` Tout le signal tient dans la plage du CAN (il en occupe ${nb(et.occupe * 100, 0)} %).` : ''}`;
  const aria = `Écrans du signal du capteur (${p.nom}) et de la tension de sortie de l’amplificateur, avec la fenêtre du CAN de 0 à 5 volts et deux poignées : le facteur d’amplification et la tension continue ajoutée.`;
  const tog = (cle, lab) => <button type="button" onClick={() => setEx(x => ({ ...x, [cle]: !x[cle] }))} aria-pressed={ex[cle]} style={{ ...stylePetitBouton(ex[cle], '#0f766e'), minHeight: 40 }}>{lab}</button>;
  return (
    <div>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Section titre={nom} ouvert={ouv.reglages} onBascule={() => setOuv(o => ({ ...o, reglages: !o.reglages }))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {sel('ax-sig', 'Signal du capteur', ex.preset, ev => { setTouche(false); setEx(x => ({ ...x, preset: ev.target.value })); }, PRESETS.map(x => <option key={x.id} value={x.id}>{x.nom}</option>))}
            {sel('ax-mont', 'Montage amplificateur', ex.montage, ev => setEx(x => ({ ...x, montage: ev.target.value, A: ev.target.value === 'inv' ? -Math.abs(x.A) : Math.abs(x.A) })), [<option key="non" value="non">non inverseur (A &gt; 0)</option>, <option key="inv" value="inv">inverseur (A &lt; 0)</option>])}
            {sel('ax-ech', 'Échelle de l’écran de sortie', ex.echelle, ev => setEx(x => ({ ...x, echelle: ev.target.value })), [<option key="can" value="can">voir la plage du CAN (−4 à 7,5 V)</option>, <option key="sat" value="sat">voir la saturation (±14 V)</option>])}
          </div>
        </Section>
      </div>
      <Scene key={`${ex.preset}${ex.montage}${ex.echelle}`} sc={sc} Av={ex.A} vdc={ex.vdc} setA={setA} setVdc={setV} aria={aria} touche={touche}/>
      <div role="status" aria-live="polite" style={{ minHeight: 70, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <div style={{ maxWidth: 920, margin: '0 auto 6px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Afficher :</span>
        {tog('can', 'Fenêtre du CAN')}{tog('valeurs', 'Valeurs Us,max et Us,min')}
      </div>
      <Chips items={[['Us,max', `${nb(e.max, 2)}${NB}V`, '#ea580c'], ['Us,min', `${nb(e.min, 2)}${NB}V`, '#ea580c'], ['Plage du CAN', et.dans ? `respectée (${nb(et.occupe * 100, 0)} %)` : et.haut && et.bas ? 'haut et bas perdus' : et.haut ? 'haut écrêté' : 'bas perdu', et.dans ? '#15803d' : '#dc2626'], ['AOP', sa.haut || sa.bas ? 'saturé' : 'linéaire', sa.haut || sa.bas ? '#b45309' : '#0f766e']]}/>
    </div>);
}

export function SimulationAmp() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [pos, setPos] = useState({ A1: 50, V2: 0, A3: 50, V3: 0 });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('A');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ reglages: false, essayer: false, retenir: false });
  const [ex, setEx] = useState(exInitial);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];
  const okChoisir = A.diagA({ s: S_CHOIX }, pos.A1).ok, okDecaler = A.diagDc({ s: S_BIP, A: A_BIP }, pos.V2).ok;
  const etC = A.etatCAN(S_COMPLET, pos.A3, pos.V3), okComplet = etC.dans && etC.occupe >= A.OCCUPE_MIN - 1e-9;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'ue', titre: 'Le signal du capteur',
      texte: <>Un capteur délivre une tension <strong>Ue</strong> (« e » comme entrée), très faible : de l’ordre de quelques <strong>millivolts</strong> (mV). Ici, elle varie de 0 jusqu’à une valeur maximale notée <strong>Ue,max</strong>. Observez l’écran du capteur : l’axe vertical est gradué en mV.</>,
      tache: { type: 'num', q: 'Quelle est la valeur maximale Ue,max de la tension du capteur (en mV) ?', unite: 'mV', vrai: 6, tol: 0.05, affiche: v => nb(v, 0), cs: 1, carnet: false,
        calcul: () => ['La courbe bleue monte jusqu’à la graduation 6 de l’axe vertical.', 'Ue,max = 6 mV.'],
        pieges: [[3, 'Vous avez donné la valeur moyenne (3 mV). On demande la valeur maximale, atteinte au sommet de la courbe.'], [0.006, 'Vous avez converti en volts. L’axe est gradué en mV : la réponse est attendue en mV.'], [12, 'Vous avez donné la valeur crête à crête multipliée par deux : ici la tension reste comprise entre 0 et 6 mV.']],
        expl: 'La courbe bleue atteint la graduation 6 mV : Ue,max = 6 mV, soit 0,006 V.', indice: 'Lisez la hauteur du sommet de la courbe bleue sur l’axe vertical, gradué en mV.' } },
    { id: 'can', titre: 'Le CAN : une plage de 0 à 5 V',
      texte: <>Pour exploiter cette tension avec une carte électronique, on utilise un <strong>convertisseur analogique-numérique</strong> (CAN). Il lit des tensions comprises entre <strong>0 et 5 V</strong> (fenêtre verte de l’écran du bas). L’écran du bas montre la tension <strong>Us</strong> qu’on obtiendrait en branchant le capteur directement sur le CAN, sans amplificateur : la courbe orange reste presque à 0 V.</>,
      tache: { type: 'qcm', q: 'Pourquoi ne peut-on pas brancher directement ce capteur sur le CAN ?', options: ['Elle est trop élevée et risque d’abîmer le CAN', 'Le CAN ne lit pas les tensions qui varient dans le temps', 'Elle est trop faible devant la plage de 0 à 5 V du CAN', 'Sa fréquence est trop grande pour être lue par le CAN'], bonne: 2,
        expl: 'La tension du capteur (quelques mV) est minuscule devant la plage du CAN (5 V) : le signal serait lu presque toujours comme 0 V. Il faut l’amplifier.',
        indice: 'Comparez la hauteur de la courbe orange à celle de la fenêtre verte (de 0 à 5 V).' } },
    { id: 'amplifier', titre: 'Amplifier : le facteur d’amplification A',
      texte: <>On place entre le capteur et le CAN un <strong>amplificateur</strong> : un montage à amplificateur opérationnel (AOP), alimenté en ±12{NB}V, que l’on traite comme une boîte noire. Il multiplie la tension : <strong>Us = A × Ue</strong>, où <strong>A</strong> est son <strong>facteur d’amplification</strong> (sans unité). Ici A = 100 et la tension du capteur va de 0 à Ue,max = 6{NB}mV.</>,
      tache: { type: 'num', q: 'Quelle est la valeur maximale Us,max de la tension de sortie (en V) ?', unite: 'V', vrai: 0.6, tol: 0.05, affiche: v => nb(v, 1), cs: 2, carnet: false,
        calcul: () => ['Us,max = A × Ue,max = 100 × 6 mV = 600 mV.', 'Us s’exprime en volts : 600 mV = 0,6 V.'],
        pieges: [[600, 'Vous avez laissé le résultat en millivolts : 600 mV = 0,6 V. Us est demandée en volts.'], [6, 'Vous avez redonné Ue,max. En sortie, la tension est multipliée par A = 100.'], [0.06, 'Vous avez divisé par A au lieu de multiplier : Us = A × Ue, donc Us,max est plus grande que Ue,max.']],
        expl: 'Us,max = 100 × 6 mV = 600 mV = 0,6 V : la sortie est 100 fois plus grande, mais elle n’occupe encore qu’une petite partie de la plage du CAN.', indice: 'Us,max = A × Ue,max. Convertissez ensuite le résultat en volts (1 V = 1 000 mV).' } },
    { id: 'choisir', titre: 'Choisir A pour remplir la plage',
      retenirTitre: 'À retenir : amplifier',
      retenir: <><SvgAmpliCarte/><ul style={ULS}>
        <li>L’amplificateur multiplie la tension : <strong>Us = A × Ue</strong>.</li>
        <li>Le facteur d’amplification <strong>A = <Frac haut={<>Us</>} bas={<>Ue</>} /></strong> n’a pas d’unité.</li>
        <li>Attention aux unités : convertir les mV en V avant de comparer à la plage du CAN.</li></ul></>,
      texte: <>Pour bien exploiter le CAN, il faut que Us,max soit <strong>proche de 5{NB}V sans la dépasser</strong> : on demande que le signal occupe au moins 80 % de la plage, soit <strong>4{NB}V ≤ Us,max ≤ 5{NB}V</strong>. La tension du capteur va maintenant de 0 à Ue,max = 10{NB}mV. Faites glisser la poignée rouge à droite de l’écran de sortie : elle fixe le niveau maximal de Us, donc le facteur A (indiqué sur le schéma).</>,
      tache: { type: 'action', ok: okChoisir, consigne: okChoisir ? '✓ Us,max est entre 4 V et 5 V : la plage du CAN est bien remplie.' : 'Réglez A pour que le haut de la courbe soit entre 4 V et 5 V.', attente: okChoisir ? null : 'Réglez A pour que 4 V ≤ Us,max ≤ 5 V.' } },
    { id: 'depasse', titre: 'Trop amplifier : le CAN écrête',
      texte: <>Prenons le même capteur (de 0 à 10{NB}mV) avec un facteur d’amplification trop grand, A = 700. La partie <strong>rouge</strong> de la courbe est la partie de Us qui sort de la fenêtre du CAN.</>,
      tache: { type: 'qcm', q: 'Que lit le CAN pour les valeurs de Us supérieures à 5 V ?', options: ['Les valeurs exactes, jusqu’à la saturation de l’AOP', 'Toujours 5 V : le haut du signal est écrêté', 'Des valeurs négatives, symétriques de celles-ci', 'Rien : le CAN arrête de convertir le signal'], bonne: 1,
        expl: 'Au-dessus de 5 V, le CAN ne peut plus distinguer les valeurs : il lit 5 V. Le haut du signal est écrêté et l’information est perdue.',
        indice: 'Le CAN ne lit que des tensions de 0 à 5 V. Que peut-il lire quand Us dépasse la limite de la fenêtre ?' } },
    { id: 'saturation', titre: 'La saturation de l’AOP',
      retenirTitre: 'À retenir : le CAN',
      retenir: <><SvgCanCarte/><ul style={ULS}>
        <li>Le CAN lit les tensions de <strong>0 à 5 V</strong>.</li>
        <li>Au-dessus de 5 V, le signal est <strong>écrêté</strong> : l’information est perdue.</li>
        <li>On règle A pour que <strong>Us,max soit proche de 5 V</strong> (au moins 4 V) sans la dépasser.</li></ul></>,
      texte: <>Prenons un capteur plus fort (de 0 à 30{NB}mV) et A = 500 : A × Ue,max vaudrait 15{NB}V. Or l’AOP est alimenté en ±12{NB}V. Regardez le haut de la courbe orange : il est plat, à 12{NB}V.</>,
      tache: { type: 'qcm', q: 'Pourquoi le haut de la courbe reste-t-il bloqué à 12 V ?', options: ['Le CAN, qui lit au plus 5 V, limite la tension à 12 V', 'Le capteur ne fournit pas assez de tension pour aller plus haut', 'Le facteur A diminue automatiquement quand Ue augmente', 'L’AOP ne peut pas fournir plus que sa tension d’alimentation'], bonne: 3,
        expl: 'La sortie d’un AOP ne peut pas dépasser sa tension d’alimentation (±12 V ici) : il sature et le signal est écrêté.',
        indice: 'Que représente la ligne pointillée à 12 V ? Pensez à la tension avec laquelle l’AOP est alimenté.' } },
    { id: 'inverseur', titre: 'Le montage inverseur',
      retenirTitre: 'À retenir : la saturation',
      retenir: <><SvgSatCarte/><ul style={ULS}>
        <li>Un AOP alimenté en ±12 V ne sort jamais plus de <strong>12 V en valeur absolue</strong>.</li>
        <li>Si A × Ue dépasse 12 V, la sortie <strong>sature</strong> : le signal est écrêté.</li>
        <li>Il faut donc éviter un facteur d’amplification trop grand.</li></ul></>,
      texte: <>Avec un montage <strong>inverseur</strong>, la tension de sortie est <strong>retournée</strong> : le facteur d’amplification A est alors <strong>négatif</strong> (toujours A = <Frac haut={<>Us</>} bas={<>Ue</>} />). Ici le capteur va de 0 à Ue,max = 10{NB}mV et la sortie descend de 0 jusqu’à Us,min = −2{NB}V.</>,
      tache: { type: 'num', q: 'Quelle est la valeur de A (sans unité, avec son signe) ?', unite: '', vrai: A_INV, tol: 0.03, affiche: v => nb(v, 0), cs: 2, carnet: false,
        calcul: () => ['A = frac(Us|Ue), avec les mêmes unités : Ue,max = 10 mV = 0,010 V.', 'A = frac(−2 V|0,010 V) = −200.'],
        pieges: [[200, 'Vous avez oublié le signe : la sortie est négative alors que l’entrée est positive, donc A est négatif.'], [-0.2, 'Vous avez divisé −2 V par 10 sans convertir 10 mV en volts (0,010 V).'], [-20, 'Vérifiez la conversion : 10 mV = 0,010 V, donc frac(−2|0,010) = −200.']],
        expl: 'A = frac(Us|Ue) = frac(−2 V|0,010 V) = −200 : le signe négatif indique que le signal est retourné.', indice: 'A = frac(Us|Ue) : convertissez Ue,max en volts avant de diviser, et gardez le signe de Us.' } },
    { id: 'bipolaire', titre: 'Un signal alternatif : positif et négatif',
      texte: <>Beaucoup de capteurs, comme un microphone, délivrent une tension <strong>alternative</strong>, qui prend des valeurs positives <strong>et</strong> négatives. Ici, Ue varie de −8{NB}mV à +8{NB}mV et A = 250 : la sortie varie de −2{NB}V à +2{NB}V. Observez la courbe orange et la courbe rouge.</>,
      tache: { type: 'qcm', q: 'Que devient la partie négative du signal pour le CAN ?', options: ['Elle est perdue : le CAN lit 0 V pour toute tension négative', 'Elle est lue normalement, avec des valeurs négatives', 'Elle est lue comme une tension positive de même valeur', 'Elle est amplifiée une seconde fois par le CAN'], bonne: 0,
        expl: 'Le CAN ne lit que des tensions de 0 à 5 V : pour toute tension négative, il lit 0 V. La moitié du signal est perdue.',
        indice: 'La fenêtre verte commence à 0 V. Que lit le CAN quand Us est en dessous de cette limite ?' } },
    { id: 'decaler', titre: 'Décaler le signal avec une tension continue',
      retenirTitre: 'À retenir : centrer le signal',
      retenir: <><SvgDecalCarte/><ul style={ULS}>
        <li>On ajoute une tension continue <strong>Vdc</strong> : <strong>Us = A × Ue + Vdc</strong>.</li>
        <li>Tout le signal est <strong>décalé vers le haut</strong>, sans changer son amplitude.</li>
        <li>Pour un signal alternatif, on place Vdc <strong>au milieu de la plage</strong> du CAN.</li></ul></>,
      texte: <>Pour sauver la partie négative, on ajoute au signal une <strong>tension continue Vdc</strong> grâce à un montage sommateur : <strong>Us = A × Ue + Vdc</strong>. Le signal est le même qu’à l’étape précédente (A = 250, Ue de −8 à +8{NB}mV). Faites glisser la poignée violette à gauche de l’écran de sortie pour que <strong>tout le signal tienne dans la fenêtre du CAN</strong>.</>,
      tache: { type: 'action', ok: okDecaler, consigne: okDecaler ? '✓ Tout le signal est dans la fenêtre du CAN : plus rien n’est perdu.' : 'Réglez Vdc pour que le bas de la courbe soit au-dessus de 0 V et le haut sous 5 V.', attente: okDecaler ? null : 'Réglez Vdc pour que tout le signal tienne entre 0 V et 5 V.' } },
    { id: 'complet', titre: 'Régler A et Vdc ensemble',
      texte: <>Le capteur délivre maintenant une tension alternative de −12{NB}mV à +12{NB}mV. Réglez <strong>les deux poignées</strong> : A (poignée rouge, à droite) pour que le signal occupe au moins 80 % de la plage, c’est-à-dire <strong>au moins 4{NB}V entre son bas et son haut</strong>, et Vdc (poignée violette, à gauche) pour le placer entièrement entre 0 et 5{NB}V.</>,
      tache: { type: 'action', ok: okComplet, consigne: okComplet ? '✓ Le signal occupe au moins 80 % de la plage et tient entièrement dans la fenêtre du CAN.' : 'Réglez A pour que le signal fasse au moins 4 V entre son bas et son haut, puis Vdc pour le centrer.', attente: okComplet ? null : 'Il faut un signal d’au moins 4 V entre son bas et son haut, entièrement entre 0 V et 5 V.' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : de quelques mV au CAN',
      retenir: <><SvgChaineCarte/><ul style={ULS}>
        <li>Un amplificateur multiplie la tension : <strong>Us = A × Ue</strong> (A &lt; 0 pour un montage inverseur).</li>
        <li>On choisit <strong>A</strong> pour remplir la plage 0 à 5 V du CAN, sans dépasser 5 V.</li>
        <li>On ajoute <strong>Vdc</strong> pour centrer un signal alternatif ; l’AOP sature à ±12 V.</li></ul></>,
      texte: <>Vous savez amplifier un signal de capteur (Us = A × Ue), choisir A pour qu’il remplisse la plage de 0 à 5{NB}V du CAN, ajouter une tension continue pour centrer un signal alternatif et reconnaître l’écrêtage du CAN et la saturation de l’AOP. En exploration, essayez d’autres capteurs et le montage inverseur.</>,
      tache: null },
  ];

  const nouveauDefi = type => setDefi(type === 'A' ? { ...A.tirageDefiA(), genre: 'A', verifie: false, corr: false } : { ...A.tirageDefiDc(), genre: 'dc', verifie: false, corr: false });
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
    const dq = defi.genre === 'A' ? A.diagA(defi, defi.A) : A.diagDc(defi, defi.vdc);
    setDefi(d => ({ ...d, verifie: true, ok: dq.ok, dq })); (defi.genre === 'A' ? noterA : noterD)(dq.ok);
  };
  const voletDefi = defi && (() => {
    const dA = defi.genre === 'A', umax = defi.s.umax, h = Math.abs(defi.A || 0) * A.hmaxV(defi.s);
    const iA = dA ? A.intervalleA(umax) : null, iV = !dA ? A.intervalleDc(defi.s, defi.A) : null;
    return (<div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['A', 'Choisir A'], ['dc', 'Ajouter Vdc']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, BLEU)}>{l}</button>)}
      </div>
      {dA ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : remplir la plage du CAN</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Le capteur délivre une tension de 0 à <strong>{umax}{NB}mV</strong>. Réglez le facteur d’amplification A avec la poignée rouge pour que le signal occupe au moins 80 % de la plage du CAN sans la dépasser : <strong>4{NB}V ≤ Us,max ≤ 5{NB}V</strong>. Puis vérifiez.</div>
        <div style={{ ...lbl, marginBottom: 8 }}>A = {nb(defi.A, 0)}</div>
        <IndiceDefi cache={false}>Us,max = A × Ue,max, avec Ue,max converti en volts (1 mV = 0,001 V). Cherchez A tel que 4 V ≤ Us,max ≤ 5 V.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : centrer le signal</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Le capteur délivre une tension alternative de −{defi.s.umax} à +{defi.s.umax}{NB}mV et A = <strong>{nb(defi.A, 0)}</strong> : la sortie oscille de ±{nb(h, 2)}{NB}V autour de sa valeur moyenne. Réglez la tension continue Vdc avec la poignée violette pour que <strong>tout le signal tienne dans la fenêtre du CAN</strong> (de 0 à 5{NB}V). Puis vérifiez.</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Vdc = {nb(defi.vdc, 1)}{NB}V</div>
        <IndiceDefi cache={false}>Us = A × Ue + Vdc. Le bas du signal est à Vdc − {nb(h, 2)} V et le haut à Vdc + {nb(h, 2)} V : il faut que le bas soit au moins 0 V et le haut au plus 5 V.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.genre)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (dA ? `✓ Correct : Us,max = ${nb(defi.dq.max, 2)} V, le signal occupe bien la plage du CAN.` : `✓ Correct : le signal va de ${nb(defi.dq.min, 2)} V à ${nb(defi.dq.max, 2)} V, il tient dans la fenêtre du CAN.`) : `✗ ${defi.dq.msg}`}
      </div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {dA ? <>
          <div>Il faut 4 V ≤ Us,max ≤ 5 V, avec Us,max = A × {umax} mV = A × {nb(umax / 1000, 3)} V.</div>
          <div>Valeurs de A qui conviennent : de <strong>{nb(Math.ceil(iA[0]), 0)}</strong> à <strong>{nb(Math.floor(iA[1]), 0)}</strong>.</div></>
          : <>
          <div>Le signal oscille de ±{nb(h, 2)} V autour de Vdc : il faut Vdc − {nb(h, 2)} ≥ 0 et Vdc + {nb(h, 2)} ≤ 5.</div>
          <div>Valeurs de Vdc qui conviennent : de <strong>{nb(iV[0], 2)} V</strong> à <strong>{nb(iV[1], 2)} V</strong> (le milieu de la plage, 2,5 V, convient toujours).</div></>}
      </div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Amplificateur</strong> : l’AOP est traité comme une boîte noire idéale : Us = A × Ue + Vdc, avec A = <Frac haut={<>Us</>} bas={<>Ue</>} /> (A &gt; 0 pour un montage non inverseur, A &lt; 0 pour un montage inverseur). Les valeurs de A sont données avec 2 chiffres significatifs. Le calcul de A à partir des résistances du montage (A = −frac(R₂|R₁) pour l’inverseur, A = 1 + <Frac haut={<>R₂</>} bas={<>R₁</>} /> pour le non inverseur) n’est pas utilisé ici.</li>
      <li><strong>Saturation</strong> : la sortie est limitée à ±12 V, la tension d’alimentation. Un AOP réel sature un peu en dessous (vers ±10,5 à ±11 V selon le modèle) ; on garde ±12 V pour simplifier.</li>
      <li><strong>CAN</strong> : modèle idéal, il lit de 0 à 5 V ; une tension négative est lue 0 V et une tension supérieure à 5 V est lue 5 V. La résolution (nombre de bits) n’est pas étudiée ici. Le signal « occupe la plage » quand son amplitude crête à crête (entre son bas et son haut) est d’au moins 80 % de 5 V, soit 4 V : ce seuil est choisi pour l’activité.</li>
      <li><strong>Signal du capteur</strong> : sinusoïde de 1 kHz (choisie pour l’animation) ; la bande passante de l’amplificateur n’est pas limitante. Seules les amplitudes comptent : le déphasage n’est pas étudié.</li>
      <li><strong>Tension continue</strong> : Vdc est ajoutée par un montage sommateur, non détaillé ; elle se règle au dixième de volt.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avec « Capteur de 0 à 10 mV » : quel A faut-il pour que Us,max soit proche de 5 V ? Que se passe-t-il si on double A ?</li>
        <li>Avec « Capteur de 0 à 40 mV » : à partir de quel A l’AOP sature-t-il ? (Passez à l’échelle « voir la saturation ».)</li>
        <li>Avec le microphone (de −8 à +8 mV) : quelle est la partie du signal perdue quand Vdc = 0 ? Quelle valeur de Vdc la sauve ?</li>
        <li>Passez au montage inverseur : que devient le signal de sortie ? Comment placer Vdc pour le ramener dans la plage ?</li>
        <li>Avec la sonde (de −15 à +15 mV) : peut-on remplir la plage sans saturer l’AOP et sans perdre une partie du signal ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Amplificateur : Us = A × Ue ; A = <Frac haut={<>Us</>} bas={<>Ue</>} />, sans unité (A &lt; 0 pour un montage inverseur).</li>
        <li>Le CAN lit de 0 à 5 V : au-dessus, le signal est écrêté ; en dessous de 0 V, il est perdu.</li>
        <li>Pour remplir la plage : Us,max proche de 5 V (au moins 4 V) sans la dépasser.</li>
        <li>Pour un signal alternatif : Us = A × Ue + Vdc, avec Vdc au milieu de la plage (2,5 V).</li>
        <li>L’AOP alimenté en ±12 V sature : |Us| ≤ 12 V.</li>
      </ul>)}
    </Section>);

  // ---------- scène ----------
  const sc = enGuide ? SCENES[idE] : null;
  const ariaSc = sc ? `Écran du signal du capteur${sc.showUs ? ' et écran de la tension de sortie de l’amplificateur avec la fenêtre du CAN de 0 à 5 volts' : ''}${sc.ctrlA || sc.ctrlDc ? ', avec des poignées de réglage' : ''}.` : '';
  const cleGuide = { choisir: ['A1', null], decaler: [null, 'V2'], complet: ['A3', 'V3'] }[idE] || [null, null];
  const scDefi = defi ? { ...BASE, s: defi.s, yRange: defi.genre === 'A' ? [-1, 8] : [-4, 8], ctrlA: defi.genre === 'A', ctrlDc: defi.genre === 'dc', aide: defi.genre === 'A' ? AIDE_A : AIDE_V } : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .amp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .amp-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); }
        @media (max-width: 900px) { .amp-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .amp-in { animation: amp-fondu 0.35s ease-out; } @keyframes amp-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Amplifier une tension : de quelques mV au CAN</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un capteur délivre quelques millivolts ; un <strong>amplificateur</strong> multiplie la tension par son facteur d’amplification <strong>A</strong> pour qu’elle occupe la plage de 0 à 5 V du <strong>convertisseur analogique-numérique</strong>.</div>
      {!enExplore && <div className={`amp-l1${(enGuide && sc) || (enDefi && scDefi) ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.genre}`} etat={defi.genre === 'A' ? suiviA : suiviD}/></div>}
          {enDefi && scDefi && <div key={`d${defi.genre}${defi.s.umax}${defi.A}`} style={{ marginTop: 10 }}>
            <Scene sc={scDefi} Av={defi.A} vdc={defi.vdc} setA={v => modifie({ A: v })} setVdc={v => modifie({ vdc: v })}
              aria="Écran du signal du capteur et écran de la tension de sortie de l’amplificateur avec la fenêtre du CAN ; poignées pour régler le facteur d’amplification ou la tension continue."/></div>}
          {enGuide && sc && <div className="amp-in" key={`s${idE}`}><SceneGuide sc={sc} pos={pos} setPos={setPos} cleA={cleGuide[0]} cleV={cleGuide[1]} aria={ariaSc}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <AmpExplore ex={ex} setEx={setEx} ouv={ouv} setOuv={setOuv}/>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
