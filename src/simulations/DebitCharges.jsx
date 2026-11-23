import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ARetenir, FormuleEnLigne, ExempleResolu, lireNombre, proche } from "../commun";
import { fr, E_CHARGE, deriveVitesse } from "./elecModele";
import { BLEU, VERMILLON, GRIS, alea, usePhase } from "./elecOutils";
import { Curseur, VoletDefiGen, Fil } from "./elecCommun";
import { Pic } from "../Pictos";
import { FicheMetal, FicheSolution, FicheDebit, FicheElectrons, FicheBatterie, FicheVitesse } from "./DebitChargesFiches";

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
// L'épaisseur du fil suit la section S ; la densité d'électrons reste la même (plus de rangées quand S augmente).
function Fil3D({ I, sens, ph, section }) {
  const S = section == null ? 1.5 : section, h = 34 + 16 * S, W = 480, x0 = 40, yc = 136, y0 = yc - h / 2;
  const v = Math.min(200, 12 + 42 * I / S), dirE = -sens;       // vitesse de dessin indicative : ∝ I / S
  const lignes = Math.max(1, Math.floor((h - 8) / 22)), yr = r => yc + (r - (lignes - 1) / 2) * 22;
  const e = [], ions = [];
  for (let r = 0; r < lignes; r++) for (let k = 0; k < 9; k++) {
    const base = k * 53 + (r % 2) * 26 + r * 11, x = x0 + ((((base + dirE * v * ph) % W) + W) % W), y = yr(r) + 3 * Math.sin(ph * 6 + k * 2 + r);
    e.push(<circle key={r + '-' + k} cx={x} cy={y} r="4.5" fill={BLEU} stroke="#fff" strokeWidth="1"/>);
  }
  for (let r = 0; r < lignes; r++) for (let k = 0; k < 14; k++) ions.push(<text key={r + '_' + k} x={x0 + 18 + k * 34 + (r % 2) * 17} y={yr(r) + 8} fontSize="21" fontWeight="800" textAnchor="middle" fill="#94a3b8">+</text>);
  const fl = (x1, x2, y, c) => <g stroke={c} fill={c}><line x1={x1} y1={y} x2={x2} y2={y} strokeWidth="3"/><polygon points={`${x2},${y} ${x2 - (x2 > x1 ? 12 : -12)},${y - 6} ${x2 - (x2 > x1 ? 12 : -12)},${y + 6}`}/></g>;
  return (
    <svg viewBox="0 0 560 296" width="100%" role="img" aria-label={`Fil de cuivre de section ${section == null ? '' : fr(section, 1) + ' mm²'} : ions fixes et électrons libres en mouvement`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 640 }}>
      <rect x={x0} y={y0} width={W} height={h} rx="14" fill="#f1f5f9" stroke="#64748b" strokeWidth="2.5"/>
      {ions}{e}
      <line x1="280" y1={y0 - 10} x2="280" y2={y0 + h + 10} stroke={VERMILLON} strokeWidth="3" strokeDasharray="7 5"/>
      <text x="288" y={y0 - 14} fontSize="21.5" fontWeight="800" fill={VERMILLON}>section S</text>
      {sens > 0 ? fl(120, 250, 30, VERMILLON) : fl(440, 310, 30, VERMILLON)}
      <text x="280" y="22" fontSize="21.5" fontWeight="800" textAnchor="middle" fill={VERMILLON}>sens conventionnel du courant</text>
      {sens > 0 ? fl(440, 310, 246, BLEU) : fl(120, 250, 246, BLEU)}
      <text x="280" y="282" fontSize="21.5" fontWeight="800" textAnchor="middle" fill={BLEU}>sens de déplacement des électrons</text>
      <g fontSize="21" fontWeight="700"><circle cx="52" cy="226" r="5.5" fill={BLEU}/><text x="64" y="232" fill="#0f172a">électron libre (−e)</text>
        <text x="290" y="232" fill="#94a3b8" fontWeight="800" fontSize="24">+</text><text x="306" y="232" fill="#0f172a">ion cuivre fixe</text></g>
      {section != null && <text x="530" y={y0 - 14} fontSize="21" fontWeight="700" textAnchor="end" fill={GRIS}>S = {fr(section, 1)} mm²</text>}
    </svg>);
}

// ---------- solution ionique ----------
// Ions répartis au hasard (positions fixes, tirage reproductible) : sans générateur ils s'agitent ; avec, ils dérivent ensemble vers l'électrode de signe opposé.
const IONS_SOL = (() => {
  let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const pts = [];
  while (pts.length < 16) {
    const p = { x: 172 + rnd() * 216, y: 168 + rnd() * 100 };
    if (pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 27)) pts.push(p);
  }
  return pts.map((p, k) => ({ ...p, cation: k % 2 === 0, ph0: rnd() * 6 }));
})();
function Electrolyte({ actif, ph }) {
  const v = actif ? 34 : 0, span = 216, ions = IONS_SOL.map((o, k) => {
    const jx = actif ? 0 : 6 * Math.sin(ph * 2.6 + o.ph0), jy = (actif ? 2.5 : 6) * Math.cos(ph * 3.1 + o.ph0 * 1.7);
    const dep = o.cation ? -v * ph : v * ph, x = 172 + ((((o.x - 172 + dep) % span) + span) % span) + jx;
    const c = o.cation ? VERMILLON : BLEU;
    return <g key={k}><circle cx={x} cy={o.y + jy} r="11" fill="#fff" stroke={c} strokeWidth="2.5"/><text x={x} y={o.y + jy + 6} fontSize="18" fontWeight="800" textAnchor="middle" fill={c}>{o.cation ? '+' : '−'}</text></g>;
  });
  return (
    <svg viewBox="0 0 560 372" width="100%" role="img" aria-label="Solution ionique entre deux électrodes reliées à un générateur : cations et anions répartis au hasard" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 640 }}>
      <rect x="110" y="150" width="340" height="135" fill="#e0f2fe" stroke="#475569" strokeWidth="3"/>
      <rect x="150" y="125" width="12" height="150" fill="#64748b"/><rect x="398" y="125" width="12" height="150" fill="#64748b"/>
      <rect x="200" y="14" width="160" height="46" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="3"/>
      <text x="280" y="46" fontSize="23" fontWeight="800" textAnchor="middle">Générateur</text>
      <text x="194" y="76" fontSize="28" fontWeight="800" textAnchor="end" fill={BLEU}>−</text><text x="366" y="76" fontSize="26" fontWeight="800" fill={VERMILLON}>+</text>
      {actif ? <>
        <Fil pts={[[200, 40], [156, 40], [156, 130]]} v={40} ph={ph} rayon={4} couleur={BLEU} esp={22}/>
        <Fil pts={[[404, 130], [404, 40], [360, 40]]} v={40} ph={ph} rayon={4} couleur={BLEU} esp={22}/></> :
        <><polyline points="200,40 156,40 156,130" fill="none" stroke="#0f172a" strokeWidth="3"/><polyline points="404,130 404,40 360,40" fill="none" stroke="#0f172a" strokeWidth="3"/></>}
      {ions}
      <text x="156" y="308" fontSize="21" fontWeight="700" textAnchor="middle" fill={BLEU}>électrode (borne −)</text>
      <text x="404" y="308" fontSize="21" fontWeight="700" textAnchor="middle" fill={VERMILLON}>électrode (borne +)</text>
      {actif && <><text x="280" y="334" fontSize="20" fontWeight="700" textAnchor="middle" fill={VERMILLON}>← cations (+) vers la borne −</text><text x="280" y="360" fontSize="20" fontWeight="700" textAnchor="middle" fill={BLEU}>anions (−) vers la borne + →</text></>}
    </svg>);
}

// ---------- batterie ----------
function Batterie({ cap, I, ph, details }) {
  const v = 18 + 20 * Math.log10(Math.max(I, 5) / 5);
  const pts = [[64, 152], [64, 178], [337, 178], [337, 26], [64, 26], [64, 40]];
  return (
    <svg viewBox="0 0 400 216" width="100%" role="img" aria-label={`Une batterie de ${cap} mA·h alimente un appareil : les électrons circulent dans le circuit`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 460 }}>
      <Fil pts={pts} v={v * 0.7} ph={ph} rayon={4} couleur={BLEU} esp={22}/>
      <rect x="54" y="32" width="20" height="10" rx="3" fill="#475569"/>
      <rect x="36" y="40" width="56" height="112" rx="10" fill="#ecfdf5" stroke="#15803d" strokeWidth="3.5"/>
      <rect x="42" y="46" width="44" height="100" rx="6" fill="#86efac"/>
      <text x="64" y="66" fontSize="21" fontWeight="800" textAnchor="middle" fill="#14532d">+</text>
      <text x="64" y="138" fontSize="22" fontWeight="800" textAnchor="middle" fill="#14532d">−</text>
      <text x="64" y="96" fontSize="19" fontWeight="800" textAnchor="middle" fill="#14532d">{cap}</text>
      <text x="64" y="113" fontSize="17.5" fontWeight="800" textAnchor="middle" fill="#14532d">mA·h</text>
      <rect x="296" y="58" width="82" height="84" rx="10" fill="#0f172a"/>
      <rect x="301" y="64" width="72" height="72" rx="4" fill="#e0f2fe"/>
      <text x="337" y="94" fontSize="16.5" fontWeight="800" textAnchor="middle" fill="#0369a1">appareil</text>
      <text x="337" y="114" fontSize="17.5" fontWeight="700" textAnchor="middle" fill="#0f172a">{I} mA</text>
      <text x="200" y="88" fontSize="19" fontWeight="800" textAnchor="middle" fill="#14532d">batterie :</text>
      <text x="200" y="106" fontSize="19" fontWeight="800" textAnchor="middle" fill="#14532d">réserve de charge</text>
      <text x="200" y="130" fontSize="19" fontWeight="700" textAnchor="middle" fill={BLEU}>I = {I} mA</text>
      {details && <text x="200" y="208" fontSize="18" fontWeight="700" textAnchor="middle" fill={GRIS}>Plus I est grand, plus la batterie se vide vite.</text>}
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
  if (d.type === 'electrons') { const ok = isFinite(x) && proche(x, d.N, 0.05); return { ok, lignes: [[ok, ok ? 'Nombre correct.' : 'Revois : Q = I × Δt (en C), puis N = Q / e avec e = 1,602·10⁻¹⁹ C. Écris par exemple 6,2e18.']] }; }
  const ok = isFinite(x) && proche(x, d.T, 0.02); return { ok, lignes: [[ok, ok ? 'Durée correcte.' : 'Revois : Δt = Q / I, avec Q en mA·h et I en mA : la durée sort directement en heures.']] };
}
const enonce = (d, { champ }) => d.type === 'charge' ? <><Pic n="target"/>Un fil est parcouru par un courant d’intensité <strong>I = {fr(d.I, 1)} A</strong> pendant <strong>Δt = {d.dt} s</strong>. Quelle charge électrique Q (valeur absolue) a traversé une section du fil ?<div style={{ marginTop: 6 }}>{champ('v', 'C')}</div></>
  : d.type === 'electrons' ? <><Pic n="target"/>Un fil de cuivre est parcouru par <strong>I = {fr(d.I, 1)} A</strong> pendant <strong>Δt = {d.dt} s</strong>. Combien d’électrons ont traversé une section du fil ? (e = 1,602·10⁻¹⁹ C ; écris par exemple 6,2e18)<div style={{ marginTop: 6 }}>{champ('v', 'électrons')}</div></>
  : <><Pic n="target"/>La batterie d’un appareil a une capacité de <strong>{d.cap} mA·h</strong>. L’appareil fonctionne avec un courant moyen <strong>I = {d.I} mA</strong>. Pendant combien de temps (en heures) peut-il fonctionner jusqu’à la décharge complète ?<div style={{ marginTop: 6 }}>{champ('v', 'h')}</div></>;
const indiceDefi = d => d.type === 'charge' ? <>Q = I × Δt, avec I en ampères et Δt en secondes.</>
  : d.type === 'electrons' ? <>Commence par la charge Q = I × Δt, puis le nombre d’électrons N = Q / e.</>
  : <>Autonomie : Δt = Q / I, avec Q en mA·h et I en mA (unités cohérentes).</>;
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
      texte: <>Un métal est un empilement ordonné d’<strong>ions positifs</strong> (en gris) baignant dans un « gaz » d’<strong>électrons libres</strong> (en bleu). Chaque électron libre n’est lié à aucun ion en particulier. Sans générateur, ils bougent dans tous les sens ; avec un générateur, ils se déplacent <strong>ensemble dans le même sens</strong> : c’est le courant électrique.
        <ExempleResolu>Le courant électrique est un <strong>déplacement ordonné de charges électriques</strong>. Ces charges sont portées par des <strong>porteurs de charge</strong> : les électrons libres dans les métaux, les <strong>ions</strong> dans les solutions.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Dans un fil de cuivre, quels sont les porteurs de charge mobiles ?', options: ['Les électrons libres', 'Les ions cuivre', 'Les atomes de cuivre', 'Les protons'], bonne: 0, expl: 'Dans un métal, ce sont les électrons libres qui se déplacent ; les ions positifs restent à leur place.', indice: "Dans un métal, certains électrons ne sont plus liés à un atome en particulier. Que sont ces porteurs de charge ?" } },
    { id: 'sens', titre: 'Sens conventionnel et sens des électrons', depart: () => { voir('fil', { sens: 1 }); },
      retenirTitre: 'À RETENIR : PORTEURS DE CHARGE ET SENS DU COURANT',
      retenir: <FicheMetal/>,
      texte: <>Par convention, le courant circule de la borne <strong>+</strong> vers la borne <strong>−</strong> à l’extérieur du générateur : c’est le <strong>sens conventionnel</strong> (flèche orange). Mais les électrons, de charge négative, se déplacent <strong>en sens inverse</strong> (flèche bleue). Cliquez sur « Inverser le générateur » : les deux flèches changent ensemble.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'fil' && vu.sens, consigne: 'Cliquez sur « Inverser le générateur » pour voir les deux sens changer.' } },
    { id: 'ions', titre: 'Dans une solution : ce sont des ions', depart: () => setAtelier('solution'),
      texte: <>Dans une solution ionique, les porteurs de charge sont des <strong>ions</strong>. Cliquez sur « Brancher le générateur » : les <strong>cations</strong> (+) vont vers l’électrode reliée à la borne <strong>−</strong>, les <strong>anions</strong> (−) vers l’électrode reliée à la borne <strong>+</strong>. Dans les fils, ce sont encore des électrons.</>,
      tache: { type: 'qcm', q: 'Dans la solution, les anions (charge négative) se dirigent vers…', options: ['l’électrode reliée à la borne +', 'l’électrode reliée à la borne −', 'le fond du bécher', 'ils ne bougent pas'], bonne: 0, expl: 'Charges opposées s’attirent : les anions (−) sont attirés par la borne +, les cations (+) par la borne −.', indice: "Un anion est un ion négatif. Il est attiré par une électrode de signe opposé. Laquelle ?" } },
    { id: 'debit', titre: 'L’intensité : un débit de charges', depart: () => voir('fil', { I: 1, dt: 1 }),
      retenirTitre: 'À RETENIR : LES IONS DANS UNE SOLUTION',
      retenir: <FicheSolution/>,
      texte: <>L’<strong>intensité I</strong> du courant est le <strong>débit de charges</strong> : la charge Q (en valeur absolue) qui traverse une section du conducteur pendant une durée Δt. <strong><FormuleEnLigne><mi>I</mi><mo>=</mo><mfrac><mrow><mi>Q</mi></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac></FormuleEnLigne></strong>, donc <strong>Q = I × Δt</strong> (I en A, Q en C, Δt en s). 1 A = 1 C·s⁻¹.
        <ExempleResolu>Une charge Q = 3 C traverse une section en Δt = 2 s : <FormuleEnLigne><mi>I</mi><mo>=</mo><mfrac><mrow><mi>Q</mi></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac><mo>=</mo><mfrac><mrow><mn>3</mn></mrow><mrow><mn>2</mn></mrow></mfrac></FormuleEnLigne> = <strong>1,5 A</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Un courant de 2,0 A circule pendant 5,0 s. Quelle charge Q (en C) traverse une section du fil ?', unite: 'C', vrai: 10, tol: 0.02, affiche: x => String(x), pieges: [[0.4, 'Tu as divisé : Q = I × Δt (on multiplie l’intensité par la durée).'], [2.5, 'Tu as divisé la durée par l’intensité. La charge est Q = I × Δt : on multiplie.'], [7, 'Tu as additionné I et Δt. La charge est Q = I × Δt : on multiplie.']],
        calcul: () => [
          'L’intensité est un débit de charges : I = frac(Q|Δt), donc Q = I × Δt (I en A, Δt en s, Q en C).',
          'Données : I = 2,0 A et Δt = 5,0 s (déjà en unités SI, pas de conversion).',
          'Q = 2,0 × 5,0 = 10 C.'], expl: 'Q = I × Δt = 2,0 × 5,0 = 10 C.', indice: "Charge qui traverse une section : Q = I × Δt, avec I en ampères et Δt en secondes (le résultat est en coulombs)." } },
    { id: 'electrons', titre: 'Combien d’électrons ?', depart: () => voir('fil', { I: 1, dt: 1 }),
      retenirTitre: 'À RETENIR : L’INTENSITÉ, UN DÉBIT DE CHARGES',
      retenir: <FicheDebit/>,
      texte: <>Chaque électron porte une charge −e, avec <strong>e = 1,602·10⁻¹⁹ C</strong>. Pour une charge Q, il faut donc <strong><FormuleEnLigne><mi>N</mi><mo>=</mo><mfrac><mrow><mi>Q</mi></mrow><mrow><mi>e</mi></mrow></mfrac></FormuleEnLigne></strong> électrons. Lancez le chrono et regardez la charge qui s’accumule. Pour 1 A pendant 1 s : 1 C, soit environ <strong>6,24·10¹⁸ électrons</strong> !
        <ExempleResolu>Q = 3,0 C : <FormuleEnLigne><mi>N</mi><mo>=</mo><mfrac><mrow><mn>3,0</mn></mrow><mrow><mn>1,602</mn><mo>×</mo><msup><mn>10</mn><mn>−19</mn></msup></mrow></mfrac></FormuleEnLigne> = <strong>1,9·10¹⁹ électrons</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Combien d’électrons correspondent à une charge Q = 2,0 C ? (écris par exemple 1,9e19)', unite: '', vrai: 1.248e19, tol: 0.04, affiche: () => '1,25·10¹⁹', pieges: [[3.2e-19, 'Tu as multiplié : N = frac(Q|e) (on divise la charge totale par la charge d’un électron).'], [1.602e-19 / 2, 'Tu as inversé : N = frac(Q|e) (la charge totale Q au numérateur).']],
        calcul: () => [
          'Chaque électron porte la charge e = 1,602·10⁻¹⁹ C (en valeur absolue). Pour la charge totale Q, le nombre d’électrons est N = frac(Q|e).',
          'Données : Q = 2,0 C ; e = 1,602·10⁻¹⁹ C.',
          `N = frac(2,0|1,602·10⁻¹⁹) = ${sci(2 / E_CHARGE, 3)} électrons.`,
          `Arrondi à 3 chiffres significatifs : N ≈ ${sci(2 / E_CHARGE, 2)} électrons.`], expl: 'N = frac(Q|e) = frac(2,0|1,602·10⁻¹⁹) = 1,25·10¹⁹.', indice: "N = frac(Q|e), avec e = 1,6 × 10⁻¹⁹ C la charge d’un électron (en valeur absolue)." } },
    { id: 'ah', titre: 'Autre unité : l’ampère-heure', depart: () => setAtelier('batterie'),
      retenirTitre: 'À RETENIR : COMPTER LES ÉLECTRONS',
      retenir: <FicheElectrons/>,
      texte: <>Les fabricants indiquent la <strong>capacité</strong> d’une batterie en <strong>mA·h</strong> : c’est une charge ! Comme 1 A·h = 1 A × 3600 s, on a <strong>1 A·h = 3600 C</strong>, soit <strong>1 mA·h = 3,6 C</strong>.
        <ExempleResolu>Une batterie de 2000 mA·h contient Q = 2000 × 3,6 = <strong>7200 C</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Une batterie a une capacité de 3000 mA·h. Quelle charge (en C) contient-elle ?', unite: 'C', vrai: 10800, tol: 0.02, affiche: x => String(x), pieges: [[3000, 'N’oublie pas de convertir : 1 mA·h = 3,6 C.'], [3, 'Tu as converti en A·h mais pas en coulombs : 1 A·h = 3600 C.'], [3000 * 3600, 'C’est 1 A·h qui vaut 3600 C. Ici, l’unité est le mA·h : 1 mA·h = 3,6 C.'], [3000 / 3.6, 'Tu as divisé. Pour passer des mA·h aux coulombs, on multiplie par 3,6.']],
        calcul: () => [
          'Une capacité en mA·h est une charge : 1 mA·h = 1 mA × 1 h.',
          'Conversion : 1 mA = 10⁻³ A et 1 h = 3600 s, donc 1 mA·h = 10⁻³ × 3600 = 3,6 C.',
          'Q = 3000 × 3,6 = 10 800 C.'], expl: 'Q = 3000 × 3,6 = 10 800 C.', indice: "Une capacité en mA·h est une charge : 1 mA·h = 0,001 A × 3600 s. Convertis en coulombs." } },
    { id: 'autonomie', titre: 'Autonomie d’une batterie', depart: () => { setAtelier('batterie'); setP({ cap: 2000, I: 20 }); },
      retenirTitre: 'À RETENIR : BATTERIE, mA·h ET AUTONOMIE',
      retenir: <FicheBatterie/>,
      texte: <>Un appareil qui consomme un courant moyen I vide une batterie de capacité Q en <strong><FormuleEnLigne><mi>Δ</mi><mi>t</mi><mo>=</mo><mfrac><mrow><mi>Q</mi></mrow><mrow><mi>I</mi></mrow></mfrac></FormuleEnLigne></strong>. Avec Q en mA·h et I en mA, la durée sort directement en <strong>heures</strong>.
        <ExempleResolu>Téléphone en veille : 2000 mA·h et I = 20 mA : <FormuleEnLigne><mi>Δ</mi><mi>t</mi><mo>=</mo><mfrac><mrow><mn>2000</mn></mrow><mrow><mn>20</mn></mrow></mfrac></FormuleEnLigne> = <strong>100 h</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Une batterie de 4000 mA·h alimente un appareil qui consomme 250 mA. Combien de temps tient-elle (en h) ?', unite: 'h', vrai: 16, tol: 0.02, affiche: x => String(x), pieges: [[0.0625, 'Tu as inversé : Δt = frac(Q|I).'], [4000 / 0.25, 'Les unités ne sont pas cohérentes : Q est en mA·h donc I doit être en mA (250 mA, pas 0,25 A).'], [16 * 3600, 'La durée est demandée en heures, pas en secondes : avec Q en mA·h et I en mA, le résultat est directement en h.']],
        calcul: () => [
          'Une batterie de charge Q fournit un courant I pendant Δt = frac(Q|I) (courant supposé constant, batterie vidée complètement).',
          'Unités cohérentes : Q = 4000 mA·h et I = 250 mA (tous deux en « milli »). Le résultat sort alors directement en heures.',
          'Δt = frac(4000|250) = 16 h.'], expl: 'Δt = frac(4000|250) = 16 h.', indice: "Autonomie : Δt = frac(Q|I). Garde des unités cohérentes : des mA·h divisés par des mA donnent des heures." } },
    { id: 'vitesse', titre: '★ À quelle vitesse vont les électrons ?', depart: () => voir('fil', { I: 1, dt: 1, S: 1.5 }),
      texte: <>Dans un fil de cuivre de section S = 1,5 mm² parcouru par 1 A, la vitesse moyenne des électrons est de <strong>environ 0,05 mm par seconde seulement</strong> (calcul : <FormuleEnLigne><mi>v</mi><mo>=</mo><mfrac><mrow><mi>I</mi></mrow><mrow><mi>n</mi><mo>·</mo><mi>S</mi><mo>·</mo><mi>e</mi></mrow></mfrac></FormuleEnLigne>, avec n = 8,5·10²⁸ électrons libres par m³). Pourtant la lampe s’allume <strong>tout de suite</strong> : c’est la <strong>perturbation</strong> (le signal) qui se propage à environ 2·10⁸ m/s, pas les électrons. Comme un long tuyau déjà plein d’eau : on ouvre le robinet, l’eau sort aussitôt à l’autre bout.</>,
      tache: { type: 'qcm', q: 'Pourquoi la lampe s’allume-t-elle presque instantanément alors que les électrons avancent très lentement ?', options: ['Les électrons sont déjà présents dans tout le fil : tous se mettent en mouvement presque en même temps', 'Les électrons vont à la vitesse de la lumière', 'Les électrons sont créés par l’interrupteur', 'Les ions du métal transportent le courant'], bonne: 0, expl: 'Les électrons libres occupent tout le circuit : le signal se propage vite, chaque électron avance lentement.', indice: "Les électrons libres sont déjà présents dans tout le fil. Qu’est-ce qui se propage très vite : les électrons eux-mêmes ou la mise en mouvement de tous les électrons ?" } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      retenirTitre: 'À RETENIR : VITESSE DES ÉLECTRONS ET SIGNAL',
      retenir: <FicheVitesse/>,
      texte: <>Bravo : vous savez relier intensité, charge, nombre d’électrons et autonomie. Dernière fiche à garder : la vitesse des électrons et celle du signal.</>, tache: null },
  ];
  const iEt = Math.min(guide.etape, ETAPES.length - 1);
  const ap = id => !enGuide || iEt >= ETAPES.findIndex(e => e.id === id);   // guide : un élément apparaît à l'étape qui l'introduit
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
      <li><strong>Modèle du gaz d’électrons libres</strong> (modèle de Drude, 1900) : un métal = ions positifs fixes + « gaz » d’électrons libres. Pour le cuivre, on compte <strong>1 électron libre par atome</strong> : n = 8,5·10²⁸ électrons par m³.</li>
      <li><strong>Régime permanent</strong> : l’intensité est la même dans toutes les sections du fil, et ne varie pas dans le temps. Charge élémentaire <strong>e = 1,602·10⁻¹⁹ C</strong>.</li>
      <li><strong>Dessin non à l’échelle</strong> : les électrons sont bien plus petits et bien moins nombreux sur le dessin qu’en réalité ; leur vitesse à l’écran est seulement <strong>indicative</strong> (elle augmente avec I). L’agitation désordonnée est suggérée par un léger tremblement.</li>
      <li><strong>Solution ionique</strong> : seuls les déplacements des ions sont représentés. Les réactions aux électrodes (électrolyse) ne sont pas modélisées, et tous les ions ont ici la même vitesse.</li>
      <li><strong>Batterie</strong> : courant moyen constant jusqu’à la décharge complète, capacité utilisable égale à la capacité annoncée (en pratique l’autonomie est un peu plus courte).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const atelierFil = (
    <div>
      <Fil3D I={F.I} sens={F.sens} ph={ph} section={F.S}/>
      {ap('debit') && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 8 }}>
        <Curseur nom="Intensité I" val={F.I} min={0.1} max={5} pas={0.1} set={v => setF(f => ({ ...f, I: v }))} unite=" A"/>
        <Curseur nom="Durée Δt" val={F.dt} min={1} max={10} pas={1} set={v => { setF(f => ({ ...f, dt: v })); setChrono(null); }} unite=" s"/>
        {ap('vitesse') && <Curseur nom="Section du fil S" val={F.S} min={0.5} max={6} pas={0.5} set={v => setF(f => ({ ...f, S: v }))} unite=" mm²"/>}</div>}
      {(ap('sens') || ap('electrons')) && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        {ap('sens') && <button onClick={() => { setF(f => ({ ...f, sens: -f.sens })); setVu(v => ({ ...v, sens: true })); }} style={styleBouton(false)}><Pic n="refresh"/>Inverser le générateur</button>}
        {ap('electrons') && <button onClick={() => setChrono({ start: ph })} style={styleBouton(true, '#16a34a')}><Pic n="stopwatch"/>Lancer le chrono</button>}
        {chrono && <button onClick={() => setChrono(null)} style={styleBouton(false)}>↺ Remettre à zéro</button>}</div>}
      {ap('debit') && <div style={{ marginTop: 8, fontSize: 14.5, color: KIT.txt, lineHeight: 1.7 }}>
        {ap('electrons') && <>Chrono : t = <strong>{fr(dtCh, 1)} s</strong> sur {F.dt} s → charge passée Q = I × t = <strong>{fr(Qch, 2)} C</strong><br/></>}
        Sur Δt = {F.dt} s : Q = {fr(F.I, 1)} × {F.dt} = <strong>{fr(Qtot, 1)} C</strong>{ap('electrons') && <>, soit N = Q / e = <strong>{sci(N)} électrons</strong></>}.<br/>
        {ap('vitesse') && <span style={{ color: KIT.txt2 }}><Pic n="star"/>Vitesse moyenne des électrons : v = I / (n·S·e) = <strong>{fr(vd * 1000, vd * 1000 < 0.1 ? 3 : 2)} mm/s</strong>, soit {fr(vd * 3600, 2)} m par heure.</span>}</div>}
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
      <Batterie cap={P.cap} I={ap('autonomie') ? P.I : 20} ph={ph} details={ap('autonomie')}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8, marginTop: 8 }}>
        <Curseur nom="Capacité de la batterie" val={P.cap} min={500} max={5000} pas={100} set={v => setP(p => ({ ...p, cap: v }))} unite=" mA·h"/>
        {ap('autonomie') && <Curseur nom="Courant moyen consommé I" val={P.I} min={5} max={500} pas={5} set={v => setP(p => ({ ...p, I: v }))} unite=" mA"/>}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
        <div style={{ background: '#ecfdf5', border: '1.5px solid #86efac', borderRadius: 10, padding: '8px 10px' }}><div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>Charge contenue</div><div style={{ fontSize: 13.5, color: KIT.txt }}>Q = {P.cap} × 3,6</div><div style={{ fontSize: 19, fontWeight: 800, color: '#15803d' }}>{Math.round(QpC)} C</div></div>
        {ap('autonomie') && <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: 10, padding: '8px 10px' }}><div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>Autonomie</div><div style={{ fontSize: 13.5, color: KIT.txt }}>Δt = {P.cap} / {P.I}</div><div style={{ fontSize: 19, fontWeight: 800, color: '#1d4ed8' }}>{fr(TP, TP < 10 ? 1 : 0)} h{TP >= 48 ? ` (≈ ${fr(TP / 24, 1)} j)` : ''}</div></div>}
        {!enGuide && <div style={{ background: '#fff7ed', border: '1.5px solid #fdba74', borderRadius: 10, padding: '8px 10px' }}><div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>Électrons qui traversent le circuit</div><div style={{ fontSize: 13.5, color: KIT.txt }}>N = Q / e</div><div style={{ fontSize: 19, fontWeight: 800, color: '#b45309' }}>{sci(Np)}</div><div style={{ fontSize: 12.5, color: KIT.txt2 }}>soit {fr(Np / NA, 3)} mol</div></div>}</div>
      {ap('autonomie') && <><div style={{ marginTop: 10, height: 26, background: '#e2e8f0', borderRadius: 13, overflow: 'hidden', maxWidth: 560 }}>
        <div style={{ width: `${Math.min(100, (TP / 200) * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#16a34a,#0072b2)' }}/></div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}>Jauge d’autonomie (pleine = 200 h)</div></>}
    </div>);
  const planche = (
    <div style={styleBoite}>
      {!enGuide && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['fil', '🧵 Un fil de cuivre'], ['solution', '🧪 Une solution ionique'], ['batterie', '🔋 Une batterie']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>}
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
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
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
        Qu’est-ce qui circule vraiment dans un fil ou dans une solution ? Découvrez les <strong>porteurs de charge</strong>, le <strong>sens du courant</strong> et le lien entre l’<strong>intensité</strong> et le <strong>débit de charges</strong> : <FormuleEnLigne><mi>I</mi><mo>=</mo><mfrac><mrow><mi>Q</mi></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac></FormuleEnLigne>.</div>
      <div className={`dc-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution} indice={indiceDefi}/></div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && ap('vitesse') && <div className="dc-l2">{panneauHypo}</div>}
      {enExplore && <div className="dc-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
