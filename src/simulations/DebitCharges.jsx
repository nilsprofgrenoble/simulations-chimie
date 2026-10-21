import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireNombre, proche } from "../commun";
import { fr, E_CHARGE, N_CUIVRE, deriveVitesse } from "./elecModele";
import { BLEU, VERMILLON, GRIS, alea, usePhase } from "./elecOutils";
import { Curseur, VoletDefiGen, Fil, Mesure } from "./elecCommun";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 70 — COURANT ÉLECTRIQUE ET DÉBIT DE CHARGES (1G spé PC, « Aspects énergétiques des phénomènes électriques »)
//  Porteurs de charge (électrons libres, ions), sens conventionnel, I = Q/Δt, Q = N·e, A·h ↔ C, autonomie d'une batterie, vitesse de dérive.
//  Hypothèses : modèle de Drude (gaz d'électrons libres, 1 par atome de cuivre : n = 8,5·10²⁸ m⁻³), régime permanent, e = 1,602·10⁻¹⁹ C,
//  tailles et vitesses de dessin non à l'échelle, électrolyse sans réactions aux électrodes.
// ====================================================

const SIM = 70;
declarerDefis(SIM, [
  ['charge', 'Calculer une charge'],
  ['electrons', 'Compter les électrons'],
  ['autonomie', 'Autonomie d’une batterie'],
]);
const TITRES = { charge: 'Charge Q', electrons: 'Nombre d’électrons', autonomie: 'Autonomie' };
const NA = 6.022e23;
const sci = (x, d = 2) => { if (!(x > 0)) return '0'; const e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return `${m.toFixed(d).replace('.', ',')}·10${String(e).replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).replace('-', '⁻')}`; };

// ---------- fil de cuivre ----------
function Fil3D({ I, sens, ph, section }) {
  const v = 18 + 38 * I, dirE = -sens, W = 480, x0 = 40;
  const e = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) {
    const base = k * 60 + (r % 2) * 30 + r * 11, x = x0 + ((((base + dirE * v * ph) % W) + W) % W), y = 92 + r * 30 + 3 * Math.sin(ph * 6 + k * 2 + r);
    e.push(<circle key={r + '-' + k} cx={x} cy={y} r="4.5" fill={BLEU} stroke="#fff" strokeWidth="1"/>);
  }
  const ions = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) ions.push(<text key={r + '_' + k} x={x0 + 18 + k * 34 + (r % 2) * 17} y={96 + r * 30} fontSize="13" fontWeight="800" textAnchor="middle" fill="#94a3b8">+</text>);
  const fl = (x1, x2, y, c) => <g stroke={c} fill={c}><line x1={x1} y1={y} x2={x2} y2={y} strokeWidth="3"/><polygon points={`${x2},${y} ${x2 - (x2 > x1 ? 12 : -12)},${y - 6} ${x2 - (x2 > x1 ? 12 : -12)},${y + 6}`}/></g>;
  return (
    <svg viewBox="0 0 560 290" width="100%" role="img" aria-label="Fil de cuivre : ions fixes et électrons libres en mouvement" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 640 }}>
      <rect x={x0} y="72" width={W} height="128" rx="14" fill="#f1f5f9" stroke="#64748b" strokeWidth="2.5"/>
      {ions}{e}
      <line x1="280" y1="62" x2="280" y2="210" stroke={VERMILLON} strokeWidth="3" strokeDasharray="7 5"/>
      <text x="286" y="58" fontSize="13.5" fontWeight="800" fill={VERMILLON}>section S</text>
      {sens > 0 ? fl(120, 250, 30, VERMILLON) : fl(440, 310, 30, VERMILLON)}
      <text x="280" y="22" fontSize="13.5" fontWeight="800" textAnchor="middle" fill={VERMILLON}>sens conventionnel du courant</text>
      {sens > 0 ? fl(440, 310, 246, BLEU) : fl(120, 250, 246, BLEU)}
      <text x="280" y="272" fontSize="13.5" fontWeight="800" textAnchor="middle" fill={BLEU}>sens de déplacement des électrons</text>
      <g fontSize="12.5" fontWeight="700"><circle cx="52" cy="226" r="4.5" fill={BLEU}/><text x="62" y="230" fill="#0f172a">électron libre (charge −e)</text>
        <text x="236" y="230" fill="#94a3b8" fontWeight="800">+</text><text x="248" y="230" fill="#0f172a">ion cuivre fixe</text></g>
      {section != null && <text x="530" y="62" fontSize="12.5" fontWeight="700" textAnchor="end" fill={GRIS}>S = {fr(section, 1)} mm²</text>}
    </svg>);
}

// ---------- solution ionique ----------
function Electrolyte({ actif, ph }) {
  const v = actif ? 34 : 0, span = 220, ions = [];
  for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
    const jit = actif ? 0 : 5 * Math.sin(ph * 3 + k * 1.7 + r * 2.3);
    const xc = 175 + ((((k * 44 + r * 22 - v * ph) % span) + span) % span) + jit, xa = 175 + ((((k * 44 + r * 22 + 22 + v * ph) % span) + span) % span) - jit;
    ions.push(<g key={`c${r}${k}`}><circle cx={xc} cy={188 + r * 22} r="9" fill="#fff" stroke={VERMILLON} strokeWidth="2.5"/><text x={xc} y={192.5 + r * 22} fontSize="13" fontWeight="800" textAnchor="middle" fill={VERMILLON}>+</text></g>);
    ions.push(<g key={`a${r}${k}`}><circle cx={xa} cy={232 + r * 21} r="9" fill="#fff" stroke={BLEU} strokeWidth="2.5"/><text x={xa} y={236.5 + r * 21} fontSize="14" fontWeight="800" textAnchor="middle" fill={BLEU}>−</text></g>);
  }
  return (
    <svg viewBox="0 0 560 320" width="100%" role="img" aria-label="Solution ionique entre deux électrodes reliées à un générateur" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 640 }}>
      <rect x="110" y="150" width="340" height="135" fill="#e0f2fe" stroke="#475569" strokeWidth="3"/>
      <rect x="150" y="125" width="12" height="150" fill="#64748b"/><rect x="398" y="125" width="12" height="150" fill="#64748b"/>
      <rect x="225" y="20" width="110" height="40" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="3"/>
      <text x="280" y="45" fontSize="14" fontWeight="800" textAnchor="middle">Générateur</text>
      <text x="212" y="48" fontSize="22" fontWeight="800" textAnchor="end" fill={BLEU}>−</text><text x="348" y="48" fontSize="20" fontWeight="800" fill={VERMILLON}>+</text>
      {actif ? <>
        <Fil pts={[[225, 40], [156, 40], [156, 130]]} v={40} ph={ph} rayon={4} couleur={BLEU} esp={22}/>
        <Fil pts={[[404, 130], [404, 40], [335, 40]]} v={40} ph={ph} rayon={4} couleur={BLEU} esp={22}/></> :
        <><polyline points="225,40 156,40 156,130" fill="none" stroke="#0f172a" strokeWidth="3"/><polyline points="404,130 404,40 335,40" fill="none" stroke="#0f172a" strokeWidth="3"/></>}
      {ions}
      <text x="156" y="306" fontSize="12.5" fontWeight="700" textAnchor="middle" fill={BLEU}>électrode reliée à la borne −</text>
      <text x="404" y="306" fontSize="12.5" fontWeight="700" textAnchor="middle" fill={VERMILLON}>électrode reliée à la borne +</text>
      {actif && <g fontSize="12.5" fontWeight="700"><text x="280" y="170" textAnchor="middle" fill={VERMILLON}>← cations (+) vers la borne −</text><text x="280" y="279" textAnchor="middle" fill={BLEU}>anions (−) vers la borne + →</text></g>}
    </svg>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'charge') { const I = alea([0.5, 1.5, 2, 3, 5]), dt = alea([4, 10, 30, 60]); return { ...base, I, dt, Q: I * dt }; }
  if (type === 'electrons') { const I = alea([1, 2, 3]), dt = alea([1, 2, 5, 10]); return { ...base, I, dt, N: I * dt / E_CHARGE }; }
  const cap = alea([1000, 2000, 3000, 4000, 5000]), I = alea([20, 50, 100, 250, 500]); return { ...base, cap, I, T: cap / I };
}
function evaluer(d) {
  const x = lireNombre(d.reps.v);
  if (d.type === 'charge') { const ok = isFinite(x) && proche(x, d.Q, 0.015); return { ok, lignes: [[ok, ok ? 'Charge correcte.' : 'Revois : Q = I × Δt, avec I en A, Δt en s ; Q en coulombs (C).']] }; }
  if (d.type === 'electrons') { const ok = isFinite(x) && proche(x, d.N, 0.03); return { ok, lignes: [[ok, ok ? 'Nombre correct.' : 'Revois : Q = I × Δt (en C), puis N = Q / e avec e = 1,602·10⁻¹⁹ C. Écris par exemple 6,2e18.']] }; }
  const ok = isFinite(x) && proche(x, d.T, 0.02); return { ok, lignes: [[ok, ok ? 'Durée correcte.' : 'Revois : Δt = Q / I, avec Q en mA·h et I en mA : la durée sort directement en heures.']] };
}
const enonce = (d, { champ }) => d.type === 'charge' ? <>🎯 Un fil est parcouru par un courant d’intensité <strong>I = {fr(d.I, 1)} A</strong> pendant <strong>Δt = {d.dt} s</strong>. Quelle charge électrique Q (valeur absolue) a traversé une section du fil ?<div style={{ marginTop: 6 }}>{champ('v', 'C')}</div></>
  : d.type === 'electrons' ? <>🎯 Un fil de cuivre est parcouru par <strong>I = {fr(d.I, 1)} A</strong> pendant <strong>Δt = {d.dt} s</strong>. Combien d’électrons ont traversé une section du fil ? (e = 1,602·10⁻¹⁹ C ; écris par exemple 6,2e18)<div style={{ marginTop: 6 }}>{champ('v', 'électrons')}</div></>
  : <>🎯 La batterie d’un appareil a une capacité de <strong>{d.cap} mA·h</strong>. L’appareil fonctionne avec un courant moyen <strong>I = {d.I} mA</strong>. Pendant combien de temps (en heures) peut-il fonctionner jusqu’à la décharge complète ?<div style={{ marginTop: 6 }}>{champ('v', 'h')}</div></>;
const solution = d => d.type === 'charge' ? <>Q = I × Δt = {fr(d.I, 1)} × {d.dt} = <strong>{fr(d.Q, 1)} C</strong>.</>
  : d.type === 'electrons' ? <>Q = I × Δt = {fr(d.I * d.dt, 1)} C ; N = Q / e = {fr(d.I * d.dt, 1)} / 1,602·10⁻¹⁹ = <strong>{sci(d.N)}</strong> électrons (soit {String(d.N.toExponential(2)).replace('.', ',').replace('e+', 'e')}).</>
  : <>Q = I × Δt donc Δt = Q / I = {d.cap} mA·h / {d.I} mA = <strong>{fr(d.T, d.T < 10 ? 1 : 0)} h</strong>.</>;

// ====================================================
export function SimulationDebitCharges() {
  const [mode, setMode] = useState(() => modeOuverture('debit-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('debit-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('fil');
  const [F, setF] = useState({ I: 1, S: 1.5, dt: 5, sens: 1 });
  const [chrono, setChrono] = useState(null);       // { start }
  const [S, setS] = useState({ actif: false });
  const [P, setP] = useState({ cap: 2000, I: 20 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const [vu, setVu] = useState({ sens: false, sol: false });
  const ph = usePhase(true);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const voir = (at, p) => { setAtelier(at); if (at === 'fil' && p) setF(f => ({ ...f, ...p })); };

  const dtCh = chrono ? Math.min(Math.max(ph - chrono.start, 0), F.dt) : 0;
  const Qch = F.I * dtCh, Qtot = F.I * F.dt, N = Qtot / E_CHARGE, vd = deriveVitesse(F.I, F.S);
  const QpC = P.cap * 3.6, TP = P.cap / P.I, Np = QpC / E_CHARGE;

  const ETAPES = [
    { id: 'porteurs', titre: 'Qu’est-ce qui circule dans un fil ?', depart: () => voir('fil', { I: 1, sens: 1 }),
      texte: <>Un métal est un empilement ordonné d’<strong>ions positifs</strong> (en gris) baignant dans un « gaz » d’<strong>électrons libres</strong> (en bleu) : c’est le <strong>modèle de Drude</strong>. Chaque électron libre n’est lié à aucun ion en particulier. Sans générateur, ils bougent dans tous les sens ; avec un générateur, ils se déplacent <strong>ensemble dans le même sens</strong> : c’est le courant électrique.
        <ExempleResolu>Le courant électrique est un <strong>déplacement ordonné de charges électriques</strong>. Ces charges sont portées par des <strong>porteurs de charge</strong> : les électrons libres dans les métaux, les <strong>ions</strong> dans les solutions.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Dans un fil de cuivre, quels sont les porteurs de charge mobiles ?', options: ['Les électrons libres', 'Les ions cuivre', 'Les atomes de cuivre', 'Les protons'], bonne: 0, expl: 'Dans un métal, ce sont les électrons libres qui se déplacent ; les ions positifs restent à leur place.' } },
    { id: 'sens', titre: 'Sens conventionnel et sens des électrons', depart: () => { voir('fil', { sens: 1 }); },
      texte: <>Par convention, le courant circule de la borne <strong>+</strong> vers la borne <strong>−</strong> à l’extérieur du générateur : c’est le <strong>sens conventionnel</strong> (flèche orange). Mais les électrons, de charge négative, se déplacent <strong>en sens inverse</strong> (flèche bleue). Cliquez sur « Inverser le générateur » : les deux flèches changent ensemble.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'fil' && vu.sens, consigne: 'Cliquez sur « Inverser le générateur » pour voir les deux sens changer.' } },
    { id: 'ions', titre: 'Dans une solution : ce sont des ions', depart: () => setAtelier('solution'),
      texte: <>Dans une solution ionique, les porteurs de charge sont des <strong>ions</strong>. Cliquez sur « Brancher le générateur » : les <strong>cations</strong> (+) vont vers l’électrode reliée à la borne <strong>−</strong>, les <strong>anions</strong> (−) vers l’électrode reliée à la borne <strong>+</strong>. Dans les fils, ce sont encore des électrons.</>,
      tache: { type: 'qcm', q: 'Dans la solution, les anions (charge négative) se dirigent vers…', options: ['l’électrode reliée à la borne +', 'l’électrode reliée à la borne −', 'le fond du bécher', 'ils ne bougent pas'], bonne: 0, expl: 'Charges opposées s’attirent : les anions (−) sont attirés par la borne +, les cations (+) par la borne −.' } },
    { id: 'debit', titre: 'L’intensité : un débit de charges', depart: () => voir('fil', { I: 1, dt: 1 }),
      texte: <>L’<strong>intensité I</strong> du courant est le <strong>débit de charges</strong> : la charge Q (en valeur absolue) qui traverse une section du conducteur pendant une durée Δt. <strong>I = Q / Δt</strong>, donc <strong>Q = I × Δt</strong> (I en A, Q en C, Δt en s). 1 A = 1 C·s⁻¹.
        <ExempleResolu>Une charge Q = 3 C traverse une section en Δt = 2 s : I = Q / Δt = 3 / 2 = <strong>1,5 A</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Un courant de 2,0 A circule pendant 5,0 s. Quelle charge Q (en C) traverse une section du fil ?', unite: 'C', vrai: 10, tol: 0.02, affiche: x => String(x), pieges: [[0.4, 'Tu as divisé : Q = I × Δt (on multiplie l’intensité par la durée).']], expl: 'Q = I × Δt = 2,0 × 5,0 = 10 C.' } },
    { id: 'electrons', titre: 'Combien d’électrons ?', depart: () => voir('fil', { I: 1, dt: 1 }),
      texte: <>Chaque électron porte une charge −e, avec <strong>e = 1,602·10⁻¹⁹ C</strong>. Pour une charge Q, il faut donc <strong>N = Q / e</strong> électrons. Lancez le chrono et regardez la charge qui s’accumule. Pour 1 A pendant 1 s : 1 C, soit environ <strong>6,24·10¹⁸ électrons</strong> !
        <ExempleResolu>Q = 3,0 C : N = 3,0 / 1,602·10⁻¹⁹ = <strong>1,9·10¹⁹ électrons</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Combien d’électrons correspondent à une charge Q = 2,0 C ? (écris par exemple 1,9e19)', unite: '', vrai: 1.248e19, tol: 0.03, affiche: () => '1,25·10¹⁹', pieges: [[3.2e-19, 'Tu as multiplié : N = Q / e (on divise la charge totale par la charge d’un électron).']], expl: 'N = Q / e = 2,0 / 1,602·10⁻¹⁹ = 1,25·10¹⁹.' } },
    { id: 'ah', titre: 'Autre unité : l’ampère-heure', depart: () => setAtelier('batterie'),
      texte: <>Les fabricants indiquent la <strong>capacité</strong> d’une batterie en <strong>mA·h</strong> : c’est une charge ! Comme 1 A·h = 1 A × 3600 s, on a <strong>1 A·h = 3600 C</strong>, soit <strong>1 mA·h = 3,6 C</strong>.
        <ExempleResolu>Une batterie de 2000 mA·h contient Q = 2000 × 3,6 = <strong>7200 C</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Une batterie a une capacité de 3000 mA·h. Quelle charge (en C) contient-elle ?', unite: 'C', vrai: 10800, tol: 0.02, affiche: x => String(x), pieges: [[3000, 'N’oublie pas de convertir : 1 mA·h = 3,6 C.'], [3, 'Tu as converti en A·h mais pas en coulombs : 1 A·h = 3600 C.']], expl: 'Q = 3000 × 3,6 = 10 800 C.' } },
    { id: 'autonomie', titre: 'Autonomie d’une batterie', depart: () => { setAtelier('batterie'); setP({ cap: 2000, I: 20 }); },
      texte: <>Un appareil qui consomme un courant moyen I vide une batterie de capacité Q en <strong>Δt = Q / I</strong>. Avec Q en mA·h et I en mA, la durée sort directement en <strong>heures</strong>.
        <ExempleResolu>Téléphone en veille : 2000 mA·h et I = 20 mA : Δt = 2000 / 20 = <strong>100 h</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Une batterie de 4000 mA·h alimente un appareil qui consomme 250 mA. Combien de temps tient-elle (en h) ?', unite: 'h', vrai: 16, tol: 0.02, affiche: x => String(x), pieges: [[0.0625, 'Tu as inversé : Δt = Q / I.']], expl: 'Δt = 4000 / 250 = 16 h.' } },
    { id: 'vitesse', titre: '★ À quelle vitesse vont les électrons ?', depart: () => voir('fil', { I: 1, dt: 1, S: 1.5 }),
      texte: <>Dans un fil de cuivre de section S = 1,5 mm² parcouru par 1 A, la vitesse moyenne des électrons est de <strong>quelques dixièmes de mm par seconde seulement</strong> (calcul : v = I / (n·S·e), avec n = 8,5·10²⁸ électrons libres par m³). Pourtant la lampe s’allume <strong>tout de suite</strong> : c’est la <strong>perturbation</strong> (le signal) qui se propage à environ 2·10⁸ m/s, pas les électrons. Comme un long tuyau déjà plein d’eau : on ouvre le robinet, l’eau sort aussitôt à l’autre bout.</>,
      tache: { type: 'qcm', q: 'Pourquoi la lampe s’allume-t-elle presque instantanément alors que les électrons avancent très lentement ?', options: ['Les électrons sont déjà présents dans tout le fil : tous se mettent en mouvement presque en même temps', 'Les électrons vont à la vitesse de la lumière', 'Les électrons sont créés par l’interrupteur', 'Les ions du métal transportent le courant'], bonne: 0, expl: 'Les électrons libres occupent tout le circuit : le signal se propage vite, chaque électron avance lentement.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Le courant est un déplacement ordonné de <strong>porteurs de charge</strong> : électrons libres (métaux), ions (solutions).</li>
        <li>Sens conventionnel : de + vers − à l’extérieur du générateur ; les électrons vont en sens inverse.</li>
        <li><strong>I = Q / Δt</strong> (A, C, s) ; Q = N·e ; 1 mA·h = 3,6 C ; autonomie Δt = Q / I.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { setDefi(nouveauDefi(type)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'charge'); else if (md === 'explore') setAtelier('fil'); }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Modèle de Drude</strong> (1900) : un métal = ions positifs fixes + « gaz » d’électrons libres. Pour le cuivre, on compte <strong>1 électron libre par atome</strong> : n = 8,5·10²⁸ électrons par m³.</li>
      <li><strong>Régime permanent</strong> : l’intensité est la même dans toutes les sections du fil, et ne varie pas dans le temps. Charge élémentaire <strong>e = 1,602·10⁻¹⁹ C</strong>.</li>
      <li><strong>Dessin non à l’échelle</strong> : les électrons sont bien plus petits et bien moins nombreux sur le dessin qu’en réalité ; leur vitesse à l’écran est seulement <strong>indicative</strong> (elle augmente avec I). L’agitation désordonnée est suggérée par un léger tremblement.</li>
      <li><strong>Solution ionique</strong> : seuls les déplacements des ions sont représentés. Les réactions aux électrodes (électrolyse) ne sont pas modélisées, et tous les ions ont ici la même vitesse.</li>
      <li><strong>Batterie</strong> : courant moyen constant jusqu’à la décharge complète, capacité utilisable égale à la capacité annoncée (en pratique l’autonomie est un peu plus courte).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const atelierFil = (
    <div>
      <Fil3D I={F.I} sens={F.sens} ph={ph} section={F.S}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 8 }}>
        <Curseur nom="Intensité I" val={F.I} min={0.1} max={5} pas={0.1} set={v => setF(f => ({ ...f, I: v }))} unite=" A"/>
        <Curseur nom="Durée Δt" val={F.dt} min={1} max={10} pas={1} set={v => { setF(f => ({ ...f, dt: v })); setChrono(null); }} unite=" s"/>
        <Curseur nom="Section du fil S" val={F.S} min={0.5} max={6} pas={0.5} set={v => setF(f => ({ ...f, S: v }))} unite=" mm²"/></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <button onClick={() => { setF(f => ({ ...f, sens: -f.sens })); setVu(v => ({ ...v, sens: true })); }} style={styleBouton(false)}>🔄 Inverser le générateur</button>
        <button onClick={() => setChrono({ start: ph })} style={styleBouton(true, '#16a34a')}>⏱ Lancer le chrono</button>
        {chrono && <button onClick={() => setChrono(null)} style={styleBouton(false)}>↺ Remettre à zéro</button>}</div>
      <div style={{ marginTop: 8, fontSize: 14.5, color: KIT.txt, lineHeight: 1.7 }}>
        Chrono : t = <strong>{fr(dtCh, 1)} s</strong> sur {F.dt} s → charge passée Q = I × t = <strong>{fr(Qch, 2)} C</strong><br/>
        Sur Δt = {F.dt} s : Q = {fr(F.I, 1)} × {F.dt} = <strong>{fr(Qtot, 1)} C</strong>, soit N = Q / e = <strong>{sci(N)} électrons</strong>.<br/>
        <span style={{ color: KIT.txt2 }}>★ Vitesse moyenne des électrons : v = I / (n·S·e) = <strong>{fr(vd * 1000, vd * 1000 < 0.1 ? 3 : 2)} mm/s</strong>, soit {fr(vd * 3600, 2)} m par heure.</span></div>
    </div>);
  const atelierSol = (
    <div>
      <Electrolyte actif={S.actif} ph={ph}/>
      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { setS(s => ({ actif: !s.actif })); setVu(v => ({ ...v, sol: true })); }} style={styleBouton(true, '#16a34a')}>{S.actif ? '⏹ Débrancher le générateur' : '🔌 Brancher le générateur'}</button>
        <span style={{ fontSize: 14, color: KIT.txt }}>{S.actif ? 'Mouvement ordonné : cations vers la borne −, anions vers la borne +.' : 'Sans générateur : mouvement désordonné, pas de courant.'}</span></div>
    </div>);
  const atelierBat = (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
        <Curseur nom="Capacité de la batterie" val={P.cap} min={500} max={5000} pas={100} set={v => setP(p => ({ ...p, cap: v }))} unite=" mA·h"/>
        <Curseur nom="Courant moyen consommé I" val={P.I} min={5} max={500} pas={5} set={v => setP(p => ({ ...p, I: v }))} unite=" mA"/></div>
      <div style={{ marginTop: 10, background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '8px 10px', fontSize: 14.5, color: KIT.txt, lineHeight: 1.8 }}>
        Charge contenue : Q = {P.cap} × 3,6 = <strong>{Math.round(QpC)} C</strong><br/>
        Autonomie : Δt = Q / I = {P.cap} / {P.I} = <strong>{fr(TP, TP < 10 ? 1 : 0)} h</strong> {TP >= 48 ? `(≈ ${fr(TP / 24, 1)} jours)` : ''}<br/>
        Nombre d’électrons qui traversent le circuit : N = Q / e = <strong>{sci(Np)}</strong>, soit n = N / N<sub>A</sub> = <strong>{fr(Np / NA, 3)} mol</strong></div>
      <div style={{ marginTop: 8, height: 26, background: '#e2e8f0', borderRadius: 13, overflow: 'hidden', maxWidth: 560 }}>
        <div style={{ width: `${Math.min(100, (TP / 200) * 100)}%`, height: '100%', background: '#0072b2' }}/></div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}>Barre : autonomie (pleine = 200 h)</div>
    </div>);
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['fil', '🧵 Un fil de cuivre'], ['solution', '🧪 Une solution ionique'], ['batterie', '🔋 Une batterie']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'fil' && atelierFil}{atelier === 'solution' && atelierSol}{atelier === 'batterie' && atelierBat}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Fil : doublez l’intensité I : que devient la charge Q passée en 5 s ? et le nombre d’électrons ?</li>
        <li>Fil : doublez la section S pour la même intensité : la vitesse des électrons change-t-elle ? Dans quel sens ?</li>
        <li>Inversez le générateur : quelles flèches changent de sens ?</li>
        <li>Batterie : divisez le courant consommé par 2 : l’autonomie est-elle multipliée par 2 ?</li>
        <li>Combien de jours une batterie de 5000 mA·h tient-elle avec 5 mA ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>I = Q / Δt (A = C·s⁻¹)</li><li>Q = N × e, e = 1,602·10⁻¹⁹ C</li><li>1 mA·h = 3,6 C</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .dc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .dc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .dc-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .dc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Courant électrique et débit de charges</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Qu’est-ce qui circule vraiment dans un fil ou dans une solution ? Découvrez les <strong>porteurs de charge</strong>, le <strong>sens du courant</strong> et le lien entre l’<strong>intensité</strong> et le <strong>débit de charges</strong> : I = Q / Δt.</div>
      <div className={`dc-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution}/></div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="dc-l2">{panneauHypo}</div>}
      {enExplore && <div className="dc-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
