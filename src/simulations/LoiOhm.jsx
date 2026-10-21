import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireNombre, proche } from "../commun";
import { fr, ctn, lampeI, regression } from "./elecModele";
import { BLEU, VERMILLON, VIOLET, alea, usePhase } from "./elecOutils";
import { Curseur, VoletDefiGen, Fil, Pile, Mesure, Graphe } from "./elecCommun";

// ====================================================
//  SIM 69 — LOI D'OHM, CARACTÉRISTIQUE ET CAPTEUR RÉSISTIF (2GT, « Signaux et capteurs »)
//  Conducteur ohmique : U = R·I, caractéristique = droite passant par l'origine ; lampe (dipôle non ohmique) ; thermistance CTN (étalonnage).
//  Hypothèses : R constante (résistor idéal), appareils parfaits, lampe 6 V – 0,30 A en loi de puissance, CTN 10 kΩ à 25 °C (B = 3950 K),
//  capteur alimenté sous 5 V sans auto-échauffement ; le modèle exponentiel de la CTN est hors programme (seule la courbe est exploitée).
// ====================================================

const SIM = 69;
declarerDefis(SIM, [
  ['res', 'Calculer une résistance'],
  ['courant', 'Calculer une intensité'],
  ['capteur', 'Température avec un capteur'],
]);
const TITRES = { res: 'Calculer R', courant: 'Calculer I', capteur: 'Capteur de température' };
const RES = [47, 100, 150, 220, 330, 470, 680, 1000];
const COURBE_CTN = Array.from({ length: 41 }, (_, k) => [k * 2, ctn(k * 2) / 1000]);
const E_CAPTEUR = 5;

// ---------- schéma de mesure ----------
function Dipole({ type, cx, cy, th }) {
  if (type === 'lampe') return <g><circle cx={cx} cy={cy} r="24" fill="#fff" stroke="#0f172a" strokeWidth="3"/><line x1={cx - 17} y1={cy - 17} x2={cx + 17} y2={cy + 17} stroke="#0f172a" strokeWidth="3"/><line x1={cx - 17} y1={cy + 17} x2={cx + 17} y2={cy - 17} stroke="#0f172a" strokeWidth="3"/><text x={cx} y={cy - 30} fontSize="14" fontWeight="800" textAnchor="middle">lampe</text></g>;
  const ctnSym = type === 'ctn';
  return <g><rect x={cx - 50} y={cy - 14} width="100" height="28" fill="#fff" stroke="#0f172a" strokeWidth="3"/>
    {ctnSym && <line x1={cx - 30} y1={cy + 22} x2={cx + 34} y2={cy - 22} stroke="#0f172a" strokeWidth="3"/>}
    <text x={cx} y={cy - (ctnSym ? 32 : 22)} fontSize="14" fontWeight="800" textAnchor="middle">{ctnSym ? `capteur (θ = ${th} °C)` : type.nom}</text></g>;
}
function Montage({ dip, U, I, ph, th, nomR }) {
  const cx = 360, cy = 70;
  return (
    <svg viewBox="0 0 560 270" width="100%" role="img" aria-label="Montage : un générateur réglable, un ampèremètre en série et un voltmètre aux bornes du dipôle" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 620 }}>
      <Fil pts={[[60, 230], [60, 70], [500, 70], [500, 230], [60, 230]]} v={30 + 500 * I} ph={ph}/>
      <polyline points={`${cx - 52},${cy} ${cx - 52},140 ${cx - 28},140`} fill="none" stroke="#0f172a" strokeWidth="2.5"/><polyline points={`${cx + 52},${cy} ${cx + 52},140 ${cx + 28},140`} fill="none" stroke="#0f172a" strokeWidth="2.5"/>
      <Pile cx={60} cy={150} nom="Générateur" lab="réglable"/>
      <Dipole type={dip === 'ctn' ? 'ctn' : dip === 'lampe' ? 'lampe' : { nom: nomR }} cx={cx} cy={cy} th={th}/>
      <g><circle cx={170} cy={70} r="23" fill="#fff" stroke={VERMILLON} strokeWidth="3"/><text x={170} y={77} fontSize="20" fontWeight="800" textAnchor="middle" fill={VERMILLON}>A</text></g>
      <g><circle cx={cx} cy={140} r="23" fill="#fff" stroke={BLEU} strokeWidth="3"/><text x={cx} y={147} fontSize="20" fontWeight="800" textAnchor="middle" fill={BLEU}>V</text></g>
      <Mesure x={170} y={118} nom="I" val={`${fr(I * 1000, I * 1000 < 100 ? 2 : 1)} mA`} w={130}/>
      <Mesure x={cx} y={190} nom="U" val={`${fr(U, 2)} V`} couleur={BLEU} w={110}/>
      <text x={490} y={150} fontSize="12.5" fontWeight="700" fill={VERMILLON} textAnchor="end">sens ↓</text>
    </svg>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'res') { const R = alea(RES), U = alea([3, 6, 9, 12]); return { ...base, R, U, I: U / R }; }
  if (type === 'courant') { const R = alea([100, 220, 330, 470, 1000]), U = alea([3, 6, 9, 12]); return { ...base, R, U, I: U / R }; }
  const th = alea([10, 15, 20, 30, 35, 40, 50, 55, 60, 70]), R = ctn(th); return { ...base, th, R, I: E_CAPTEUR / R };
}
function evaluer(d) {
  const x = lireNombre(d.reps.v);
  if (d.type === 'res') { const ok = isFinite(x) && proche(x, d.R, 0.03); return { ok, lignes: [[ok, ok ? 'Résistance correcte.' : 'Revois : R = U / I, avec I en ampères (1 mA = 0,001 A). Réponse en ohms.']] }; }
  if (d.type === 'courant') { const ok = isFinite(x) && proche(x, d.I * 1000, 0.03); return { ok, lignes: [[ok, ok ? 'Intensité correcte.' : 'Revois : I = U / R. Le résultat est en ampères : multiplie par 1000 pour l’avoir en mA.']] }; }
  const ok = isFinite(x) && Math.abs(x - d.th) <= 3; return { ok, lignes: [[ok, ok ? 'Température correcte (à 3 °C près).' : 'Calcule d’abord R = U / I (avec I en A), puis cherche cette valeur de R sur la courbe d’étalonnage pour lire θ.']] };
}
const enonce = (d, { champ }) => {
  if (d.type === 'res') return <>🎯 On applique une tension <strong>U = {fr(d.U, 1)} V</strong> à un conducteur ohmique : l’ampèremètre indique <strong>I = {fr(d.I * 1000, 1)} mA</strong>. Quelle est sa résistance R ?<div style={{ marginTop: 6 }}>{champ('v', 'Ω')}</div></>;
  if (d.type === 'courant') return <>🎯 On applique une tension <strong>U = {fr(d.U, 1)} V</strong> aux bornes d’un conducteur ohmique de résistance <strong>R = {d.R} Ω</strong>. Quelle intensité I le traverse ?<div style={{ marginTop: 6 }}>{champ('v', 'mA')}</div></>;
  return <>🎯 Un capteur de température (thermistance) est alimenté sous <strong>5,0 V</strong>. L’ampèremètre indique <strong>I = {fr(d.I * 1000, 2)} mA</strong>. Calculez la résistance du capteur, puis utilisez la <strong>courbe d’étalonnage</strong> pour trouver la température θ.<div style={{ marginTop: 6 }}>{champ('v', '°C')}</div></>;
};
const solution = d => d.type === 'res' ? <>R = U / I = {fr(d.U, 1)} / {fr(d.I, 4)} = <strong>{fr(d.R, 0)} Ω</strong> (I = {fr(d.I * 1000, 1)} mA = {fr(d.I, 4)} A).</>
  : d.type === 'courant' ? <>I = U / R = {fr(d.U, 1)} / {d.R} = {fr(d.I, 4)} A = <strong>{fr(d.I * 1000, 1)} mA</strong>.</>
  : <>R = U / I = 5,0 / {fr(d.I, 5)} ≈ {fr(d.R / 1000, 1)} kΩ. Sur la courbe d’étalonnage, R = {fr(d.R / 1000, 1)} kΩ correspond à θ ≈ <strong>{d.th} °C</strong> (à 3 °C près).</>;

// ====================================================
export function SimulationLoiOhm() {
  const [mode, setMode] = useState('explore');
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('ohm-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('ohm');
  const [O, setO] = useState({ U: 6, R: 100, inconnu: false, Rinc: 330, reveler: false });
  const [D, setD] = useState({ U: 4, dip: 'res' });
  const [K, setK] = useState({ th: 25, ref: false });
  const [ptsO, setPtsO] = useState([]), [ptsD, setPtsD] = useState([]), [ptsK, setPtsK] = useState([]);
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const ph = usePhase(atelier !== 'xx');

  const Rreel = O.inconnu ? O.Rinc : O.R, IO = O.U / Rreel;
  const ID = D.dip === 'res' ? D.U / 100 : lampeI(D.U);
  const RK = ctn(K.th), IK = E_CAPTEUR / RK;
  const regO = ptsO.length >= 2 ? regression(ptsO.map(p => [p.I * 1000, p.U])) : null;   // U (V) en fonction de I (mA)

  const voir = (at, p) => { setAtelier(at); if (at === 'ohm' && p) setO(o => ({ ...o, ...p })); };
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const ETAPES = [
    { id: 'resistor', titre: 'Le résistor et sa résistance', depart: () => voir('ohm', { inconnu: false, R: 100, U: 6 }),
      texte: <>Un <strong>résistor</strong> (ou « conducteur ohmique ») limite le courant dans un circuit. Sa <strong>résistance R</strong> s’exprime en <strong>ohms (Ω)</strong>. Sur le schéma, un <strong>ampèremètre</strong> (A) mesure l’intensité I et un <strong>voltmètre</strong> (V) mesure la tension U aux bornes du résistor. Changez R avec les boutons, en gardant la même tension.</>,
      tache: { type: 'qcm', q: 'Pour la même tension U, si on remplace R = 100 Ω par R = 470 Ω, l’intensité I…', options: ['diminue : un grand R freine le courant', 'augmente', 'ne change pas', 'devient nulle'], bonne: 0, expl: 'Plus la résistance est grande, plus le courant est freiné : I diminue.' } },
    { id: 'mesures', titre: 'Faire des mesures', depart: () => voir('ohm', { inconnu: false, R: 100 }),
      texte: <>Faisons comme en TP : on règle la tension U du générateur (curseur), on lit I, puis on clique sur « Noter cette mesure ». Faites <strong>au moins 5 mesures</strong> avec des tensions différentes, pour le même résistor R = 100 Ω.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'ohm' && !O.inconnu && ptsO.filter(p => p.R === 100).length >= 5, consigne: 'Notez au moins 5 mesures avec R = 100 Ω.' } },
    { id: 'caract', titre: 'La caractéristique : une droite', depart: null,
      texte: <>Le graphique U = f(I) s’appelle la <strong>caractéristique</strong> du dipôle. Pour un résistor, les points sont <strong>alignés sur une droite qui passe par l’origine</strong> : U et I sont <strong>proportionnelles</strong>. Plus la droite est « raide », plus R est grande.</>,
      tache: { type: 'qcm', q: 'La caractéristique d’un conducteur ohmique est…', options: ['une droite passant par l’origine', 'une droite qui ne passe pas par l’origine', 'une courbe qui monte de plus en plus vite', 'un point'], bonne: 0, expl: 'U est proportionnelle à I : droite passant par l’origine.' } },
    { id: 'loi', titre: 'La loi d’Ohm : U = R × I', depart: () => voir('ohm', { inconnu: false, R: 100, U: 6 }),
      texte: <>Le coefficient de proportionnalité est la résistance : <strong>U = R × I</strong> (loi d’Ohm), avec U en <strong>volts</strong>, I en <strong>ampères</strong>, R en <strong>ohms</strong>. Donc R = U / I. ⚠️ Pensez à convertir les mA en A !
        <ExempleResolu>U = 6,0 V et I = 60 mA = 0,060 A : R = U / I = 6,0 / 0,060 = <strong>100 Ω</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'On mesure U = 9,0 V et I = 45 mA. Quelle est la résistance R (en Ω) ?', unite: 'Ω', vrai: 200, tol: 0.02, affiche: x => String(x), pieges: [[0.2, 'Tu as oublié de convertir : I = 45 mA = 0,045 A.']], expl: 'R = U / I = 9,0 / 0,045 = 200 Ω.' } },
    { id: 'calcul', titre: 'Prévoir l’intensité', depart: () => voir('ohm', { inconnu: false, R: 330, U: 6 }),
      texte: <>On peut aussi <strong>prévoir</strong> le courant : I = U / R.
        <ExempleResolu>U = 6,0 V et R = 100 Ω : I = 6,0 / 100 = 0,060 A = <strong>60 mA</strong>. {bouton('Voir sur le montage', () => voir('ohm', { inconnu: false, R: 100, U: 6 }))}</ExempleResolu>
        À vous : R = 330 Ω et U = 6,0 V.</>,
      tache: { type: 'num', q: 'Quelle est l’intensité I (en mA) ?', unite: 'mA', vrai: 18.18, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[1980, 'Tu as multiplié : I = U / R, pas U × R.'], [0.01818, 'Tu as donné l’intensité en ampères : multiplie par 1000 pour l’avoir en mA.']], expl: 'I = 6,0 / 330 = 0,0182 A = 18,2 mA.' } },
    { id: 'inconnu', titre: 'Trouver une résistance inconnue', depart: () => voir('ohm', { inconnu: true, U: 6, reveler: false }),
      texte: <>Le résistor du montage est maintenant <strong>inconnu</strong>. Mesurez U et I, calculez R = U / I, puis vérifiez en cliquant sur « Révéler R ». Faites plusieurs mesures : la <strong>pente</strong> de la droite donne R.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'ohm' && O.inconnu && ptsO.filter(p => p.inconnu).length >= 3, consigne: 'Notez au moins 3 mesures avec le résistor inconnu.' } },
    { id: 'lampe', titre: 'Tous les dipôles ne sont pas ohmiques', depart: () => setAtelier('dipoles'),
      texte: <>Comparez le résistor (100 Ω) et une <strong>lampe</strong> : choisissez-en un, faites varier U et notez au moins 4 mesures pour chacun. La caractéristique de la lampe n’est <strong>pas une droite</strong> : son filament chauffe, sa résistance augmente. La loi d’Ohm ne s’applique qu’aux <strong>conducteurs ohmiques</strong>.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'dipoles' && ptsD.filter(p => p.dip === 'res').length >= 4 && ptsD.filter(p => p.dip === 'lampe').length >= 4, consigne: 'Notez 4 mesures pour le résistor et 4 pour la lampe.' } },
    { id: 'capteur', titre: 'Un capteur résistif', depart: () => setAtelier('capteur'),
      texte: <>Une <strong>thermistance</strong> (CTN) est un capteur dont la <strong>résistance dépend de la température</strong> : quand θ augmente, R diminue. Pour s’en servir, on fait son <strong>étalonnage</strong> : on mesure R pour plusieurs températures connues. Notez au moins 5 points entre 0 et 80 °C.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'capteur' && ptsK.length >= 5, consigne: 'Notez au moins 5 points d’étalonnage.' } },
    { id: 'etalon', titre: 'Utiliser la courbe d’étalonnage', depart: () => { setAtelier('capteur'); setK(k => ({ ...k, ref: true })); },
      texte: <>La courbe d’étalonnage permet l’opération inverse : <strong>mesurer R</strong> (avec U et I), puis <strong>lire la température</strong> correspondante sur la courbe.
        <ExempleResolu>R = 5,3 kΩ : on cherche 5,3 sur l’axe vertical, on suit l’horizontale jusqu’à la courbe, puis on descend sur l’axe horizontal : θ ≈ <strong>40 °C</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Une mesure donne R = 3,6 kΩ. Quelle est la température (en °C, à 3 °C près) ?', unite: '°C', vrai: 50, tol: 0.06, affiche: x => String(x), pieges: [], expl: 'Sur la courbe, R = 3,6 kΩ correspond à environ 50 °C.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li><strong>Loi d’Ohm</strong> : U = R × I (U en V, I en A, R en Ω) ; valable pour un conducteur ohmique.</li>
        <li>Caractéristique d’un conducteur ohmique : <strong>droite passant par l’origine</strong>, de pente R.</li>
        <li>Un <strong>capteur résistif</strong> a une résistance qui dépend d’une grandeur physique : on l’<strong>étalonne</strong>, puis on lit la grandeur sur la courbe.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { setDefi(nouveauDefi(type)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'res'); else if (md === 'explore') setAtelier('ohm'); }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Résistor idéal</strong> : sa résistance R est constante (en réalité elle varie un peu quand le résistor chauffe). <strong>Appareils de mesure parfaits</strong> : ils ne modifient pas le circuit.</li>
      <li><strong>Lampe</strong> à incandescence 6 V – 0,30 A : sa caractéristique est modélisée par une courbe simple (I proportionnelle à U<sup>1,72</sup>) qui reproduit l’allure observée en TP. Ce n’est pas une loi à connaître.</li>
      <li><strong>Thermistance CTN</strong> : 10 kΩ à 25 °C, modèle usuel R = R₂₅ · exp[B (1/T − 1/T₂₅)] avec B = 3950 K. Cette formule est <strong>hors programme</strong> : seule la courbe d’étalonnage est à exploiter. Le capteur est alimenté sous <strong>5,0 V</strong>, son auto-échauffement est négligé.</li>
      <li><strong>Lecture</strong> : les mesures s’affichent avec 3 chiffres significatifs ; sur la courbe d’étalonnage, la température se lit à environ 3 °C près.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const tabl = (entetes, lignes, vider) => <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
    <thead><tr>{entetes.map(h => <th key={h} style={{ padding: '3px 5px', color: KIT.txt2, textAlign: 'right', borderBottom: `1px solid ${KIT.bord}` }}>{h}</th>)}</tr></thead>
    <tbody>{lignes.length === 0 && <tr><td colSpan={entetes.length} style={{ padding: 6, color: KIT.txt2 }}>Aucune mesure notée.</td></tr>}
      {lignes.map((l, k) => <tr key={k}>{l.map((c, j) => <td key={j} style={{ padding: '2px 5px', textAlign: 'right' }}>{c}</td>)}</tr>)}</tbody></table>
    <div style={{ marginTop: 4 }}><button onClick={vider} style={styleBouton(false)}>🗑 Effacer</button></div></div>;
  const btnNoter = f => <button onClick={f} style={{ ...styleBouton(true, '#16a34a'), marginTop: 6 }}>➕ Noter cette mesure</button>;
  const choixR = (<div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Résistor :</span>
    {RES.map(r => <button key={r} onClick={() => setO(o => ({ ...o, R: r, inconnu: false }))} style={stylePetitBouton(!O.inconnu && O.R === r, '#0f766e')}>{r} Ω</button>)}
    <button onClick={() => setO(o => ({ ...o, inconnu: true }))} style={stylePetitBouton(O.inconnu, '#7b2d8e')}>R inconnu</button></div>);
  const atelierOhm = (
    <div>
      <Montage dip="res" U={O.U} I={IO} ph={ph} nomR={O.inconnu ? 'résistor inconnu' : `R = ${O.R} Ω`}/>
      <div style={{ marginTop: 8 }}><Curseur nom="Tension U du générateur" val={O.U} min={0} max={12} pas={0.5} set={v => setO(o => ({ ...o, U: v }))} unite=" V"/></div>
      {choixR}
      {btnNoter(() => setPtsO(p => [...p, { U: O.U, I: IO, R: O.inconnu ? 0 : O.R, inconnu: O.inconnu }].slice(-24)))}
      {O.inconnu && <button onClick={() => setO(o => ({ ...o, reveler: !o.reveler }))} style={{ ...stylePetitBouton(O.reveler, '#334155'), marginLeft: 8 }}>{O.reveler ? `R = ${O.Rinc} Ω` : 'Révéler R'}</button>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10, marginTop: 8, alignItems: 'start' }}>
        {tabl(['U (V)', 'I (mA)', 'U / I (Ω)'], ptsO.map(p => [fr(p.U, 1), fr(p.I * 1000, 1), p.U > 0 ? fr(p.U / p.I, 0) : '—']), () => setPtsO([]))}
        <div><Graphe pts={ptsO.map(p => [p.I * 1000, p.U])} xmax={Math.max(20, Math.ceil(Math.max(0, ...ptsO.map(p => p.I * 1000)) / 20) * 20 || 20)} ymax={12} xlab="I (mA)" ylab="U (V)" droite={regO} w={380} h={270}/>
          {regO && <div style={{ fontSize: 13.5, fontWeight: 700, color: VERMILLON, marginTop: 4 }}>Pente de la droite : {fr(regO.a * 1000, 0)} Ω (U en V ÷ I en A)</div>}</div></div>
    </div>);
  const atelierDip = (
    <div>
      <Montage dip={D.dip} U={D.U} I={ID} ph={ph} nomR="R = 100 Ω"/>
      <div style={{ marginTop: 8 }}><Curseur nom="Tension U du générateur" val={D.U} min={0} max={9} pas={0.5} set={v => setD(d => ({ ...d, U: v }))} unite=" V"/></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Dipôle :</span>
        {[['res', 'résistor 100 Ω', BLEU], ['lampe', 'lampe 6 V – 0,30 A', VERMILLON]].map(([k, l, c]) => <button key={k} onClick={() => setD(d => ({ ...d, dip: k }))} style={stylePetitBouton(D.dip === k, c)}>{l}</button>)}</div>
      {btnNoter(() => setPtsD(p => [...p, { dip: D.dip, U: D.U, I: ID }].slice(-30)))}
      <div style={{ fontSize: 14.5, color: KIT.txt, marginTop: 6 }}>U / I = <strong>{D.U > 0 ? `${fr(D.U / ID, 0)} Ω` : '—'}</strong>{D.dip === 'lampe' ? ' (change quand U change !)' : ' (toujours la même)'}</div>
      <div style={{ marginTop: 8, maxWidth: 440 }}><Graphe pts={ptsD.filter(p => p.dip === 'res').map(p => [p.I * 1000, p.U])} series={[{ pts: ptsD.filter(p => p.dip === 'lampe').map(p => [p.I * 1000, p.U]), couleur: VERMILLON }]} xmax={600} ymax={9} xlab="I (mA)" ylab="U (V)" couleur={BLEU} w={440} h={280}/>
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}><span style={{ color: BLEU, fontWeight: 700 }}>● résistor</span> · <span style={{ color: VERMILLON, fontWeight: 700 }}>● lampe</span> <button onClick={() => setPtsD([])} style={{ ...styleBouton(false), marginLeft: 8 }}>🗑 Effacer</button></div></div>
    </div>);
  const ptsKtri = [...ptsK].sort((a, b) => a.th - b.th);
  const graphCapteur = (ref, pts) => <Graphe pts={pts.map(p => [p.th, p.R / 1000])} courbe={ref ? COURBE_CTN : null} xmax={80} ymax={30} xlab="θ (°C)" ylab="R (kΩ)" w={420} h={290} couleur={VIOLET}/>;
  const atelierCapteur = (
    <div>
      <Montage dip="ctn" U={E_CAPTEUR} I={IK} ph={ph} th={K.th}/>
      <div style={{ marginTop: 8 }}><Curseur nom="Température θ" val={K.th} min={0} max={80} pas={5} set={v => setK(k => ({ ...k, th: v }))} unite=" °C"/></div>
      <div style={{ fontSize: 14.5, color: KIT.txt, marginTop: 4 }}>R = U / I = {fr(E_CAPTEUR, 1)} / {fr(IK, 5)} = <strong>{fr(RK / 1000, 2)} kΩ</strong></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{btnNoter(() => setPtsK(p => p.some(q => q.th === K.th) ? p : [...p, { th: K.th, R: RK }]))}
        <button onClick={() => setK(k => ({ ...k, ref: !k.ref }))} style={{ ...stylePetitBouton(K.ref, '#334155'), marginTop: 6 }}>{K.ref ? 'Cacher' : 'Afficher'} la courbe d’étalonnage</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 8, alignItems: 'start' }}>
        {tabl(['θ (°C)', 'I (mA)', 'R (kΩ)'], ptsKtri.map(p => [p.th, fr(E_CAPTEUR / p.R * 1000, 2), fr(p.R / 1000, 2)]), () => setPtsK([]))}
        {graphCapteur(K.ref, ptsKtri)}</div>
    </div>);
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['ohm', '📏 Résistor et loi d’Ohm'], ['dipoles', '💡 Résistor ou lampe ?'], ['capteur', '🌡️ Capteur de température']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'ohm' && atelierOhm}{atelier === 'dipoles' && atelierDip}{atelier === 'capteur' && atelierCapteur}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Notez des mesures pour R = 100 Ω puis R = 470 Ω : que devient la pente de la droite ?</li>
        <li>Pour un même résistor, calculez U / I pour chaque mesure : que remarquez-vous ?</li>
        <li>Même chose avec la lampe : U / I est-il constant ?</li>
        <li>Capteur : combien de degrés faut-il gagner pour que R soit divisée par 2 ?</li>
        <li>Résistor inconnu : trouvez R par la pente, puis révélez-la pour comparer.</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>U = R × I (V, Ω, A)</li><li>Conducteur ohmique : caractéristique = droite passant par l’origine</li><li>Capteur résistif : R dépend de θ → étalonnage</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .oh-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .oh-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .oh-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .oh-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Loi d’Ohm, caractéristique et capteur résistif</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Quel lien entre la <strong>tension</strong> aux bornes d’un résistor et le <strong>courant</strong> qui le traverse ? Mesurez, tracez la <strong>caractéristique</strong>, retrouvez la <strong>loi d’Ohm</strong>, puis utilisez un <strong>capteur de température</strong>.</div>
      <div className={`oh-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution}/>
            {defi.type === 'capteur' && <div style={{ marginTop: 10 }}>{graphCapteur(true, [])}</div>}</div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="oh-l2">{panneauHypo}</div>}
      {enExplore && <div className="oh-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
