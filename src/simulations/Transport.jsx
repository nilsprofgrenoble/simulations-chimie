import { useState } from "react";
import { cardStyle, Graphe, fmt, sci, lireNombre, proche, CarteParcours, Cadre, ORANGE_GUIDE } from "../commun";

// ====================================================
// ENERGY@SCHOOL — ATELIER TRANSPORT
// Générateur (parc éolien) → transformateur 1 → ligne (2 câbles) → transformateur 2 → habitations
// Modèle calé sur les 9 séries de mesures du tableur de l'atelier (3 réglages × 3 câbles : V1, P1, V2, P2) :
// rendements retrouvés à 1,3 point près, V1 et V2 à quelques dixièmes de volt.
// ====================================================

const TR_E = 26.37;                  // V, tension à vide du générateur
const TR_RG = 0.332;                 // Ω, résistance interne du générateur (sa tension baisse quand il débite)
const TR_R = 4.124;                  // Ω, résistance équivalente des charges (≈ 4,15 Ω dans toutes les mesures)
const TR_RHO = 1.7e-8;               // Ω·m, résistivité du cuivre
const TR_RIN = { 0.5: 0.454, 1: 0.324, 2: 0.01 };    // Ω, résistance côté entrée du transformateur (selon le couplage)
const TR_ROUT = { 0.5: 0.406, 1: 0.324, 2: 0.01 };   // Ω, résistance côté sortie
const TR_G = 0.0012;                 // S, pertes « fer » (magnétisation) à l'entrée de chaque transformateur
const CABLES = [
  { id: 'rouge', nom: 'rouge', S: 1.0, c: '#dc2626', prix: 1.0 },
  { id: 'bleu', nom: 'bleu', S: 1.5, c: '#2563eb', prix: 1.5 },
  { id: 'noir', nom: 'noir', S: 2.5, c: '#111827', prix: 2.5 },
];
const REGLAGES = [[1, 1], [2, 0.5], [0.5, 2]];
const nomReglage = (m1, m2) => `${fmt(m1, m1 % 1 ? 1 : 0)} : ${fmt(m2, m2 % 1 ? 1 : 0)}`;

// Matrices de chaîne : [V_entrée, I_entrée] = M × [V_sortie, I_sortie]
const mul = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
const app = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
const serie = R => [[1, R], [0, 1]];
const derive = G => [[1, 0], [G, 1]];
const ideal = m => [[1 / m, 0], [0, m]];
const transfo = m => [derive(TR_G), serie(TR_RIN[m]), ideal(m), serie(TR_ROUT[m])].reduce(mul);

function reseau(m1, m2, S, L = 10) {
  const Rl = TR_RHO * 2 * L / (S * 1e-6);
  const T1 = transfo(m1), T2 = transfo(m2), Lg = serie(Rl);
  const M = [serie(TR_RG), T1, Lg, T2].reduce(mul);
  const V2 = TR_E / (M[0][0] + M[0][1] / TR_R), I2 = V2 / TR_R;
  const finLigne = app(T2, [V2, I2]);              // entrée du transformateur 2
  const debutLigne = app(Lg, finLigne);            // sortie du transformateur 1
  const entree = app(T1, debutLigne);              // bornes du générateur
  const P1 = entree[0] * entree[1], P2 = V2 * I2;
  return { Rl, V1: entree[0], V2, I2, Vl: debutLigne[0], Il: debutLigne[1], I1: entree[1], P1, P2, eta: P2 / P1,
    pT1: P1 - debutLigne[0] * debutLigne[1], pL: Rl * debutLigne[1] ** 2, pT2: finLigne[0] * finLigne[1] - P2 };
}

const COUL = { gen: '#16a34a', ligne: '#7c3aed', charge: '#ea580c', pertes: '#dc2626',
  txt: '#0f172a', txt2: '#334155', bord: '#cbd5e1', fond: '#f8fafc' };

export function SimulationTransport() {
  const [mode, setMode] = useState('guide');
  const [guide, setGuide] = useState({ etape: 0, reps: {}, verifs: {} });
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true, points: true });
  const [m1, setM1] = useState(1);
  const [m2, setM2] = useState(1);
  const [cableId, setCableId] = useState('bleu');
  const [L, setL] = useState(10);
  const [onglet, setOnglet] = useState('bilan');
  const [mesuresTab, setMesuresTab] = useState([]);
  const [mission, setMission] = useState(null);

  const cable = CABLES.find(c => c.id === cableId);
  const Lr = mode === 'explore' ? L : 10;
  const r = reseau(m1, m2, cable.S, Lr);
  const enGuide = mode === 'guide';
  const etape = guide.etape;
  const vu = k => !enGuide || etape >= k;
  const revele = { reglages: vu(5), cables: vu(7), mesures: vu(7), tableau: vu(11), bilan: vu(16) };

  // ── Styles ──
  const { txt: TXT, txt2: TXT2, bord: BORDER, fond: BG } = COUL;
  const box = { background: BG, borderRadius: 10, padding: '10px 12px', border: `1px solid ${BORDER}` };
  const titreBox = { fontWeight: 700, fontSize: 15, color: TXT, marginBottom: 6 };
  const btn = (actif, c = '#0284c7') => ({ padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, border: `1.5px solid ${actif ? c : BORDER}`,
    background: actif ? c : 'white', color: actif ? 'white' : TXT2 });
  const petitBtn = (actif, c) => ({ ...btn(actif, c), padding: '5px 10px', fontSize: 13 });
  const inp = { fontSize: 14, padding: '4px 8px', border: `1.5px solid ${BORDER}`, borderRadius: 6, background: 'white', color: TXT };
  const ligne = (k, v, c, cle) => (
    <div key={cle} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0',
      borderBottom: `1px dashed ${BORDER}`, fontSize: 14 }}>
      <span style={{ color: TXT2, fontWeight: 600 }}>{k}</span>
      <span style={{ color: c || TXT, fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{v}</span>
    </div>
  );
  function section(id, titre, contenu) {
    return (
      <div key={id} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: BG, marginBottom: 8 }}>
        <button onClick={() => setOuverts(o => ({ ...o, [id]: !o[id] }))} aria-expanded={!!ouverts[id]}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 15.5, color: TXT, textAlign: 'left' }}>
          <span>{titre}</span><span style={{ fontSize: 11, color: TXT2 }}>{ouverts[id] ? '▲' : '▼'}</span>
        </button>
        {ouverts[id] && <div style={{ padding: '0 12px 12px' }}>{contenu}</div>}
      </div>
    );
  }
  const ajouterMesure = () => setMesuresTab(l => [...l.filter(q => !(q.m1 === m1 && q.m2 === m2 && q.cable === cableId)),
    { m1, m2, cable: cableId, eta: r.eta * 100, P1: r.P1, P2: r.P2 }]);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const V1a = Math.round(r.V1 * 10) / 10;
  const i1a = Math.round(r.I1 * 100) / 100, V2a = Math.round(r.V2 * 10) / 10, i2a = Math.round(r.I2 * 100) / 100;
  const cas11 = m1 === 1 && m2 === 1 && cableId === 'bleu';
  const reglagesTestes = new Set(mesuresTab.filter(q => q.cable === 'bleu').map(q => `${q.m1}:${q.m2}`)).size;
  const cablesTestes = new Set(mesuresTab.filter(q => q.m1 === 2 && q.m2 === 0.5).map(q => q.cable)).size;
  const ETAPES = [
    { titre: 'Transporter l’électricité', focus: ['gen', 'ligne', 'charge'],
      texte: <>On produit l'électricité là où il y a du vent, de l'eau ou une centrale, et on la consomme dans les villes,
        parfois à plus de 1000 km. Les câbles ne sont pas parfaits : ils créent des pertes. Les contraintes : le parc éolien
        produit une tension fixe, les maisons ont besoin d'une tension fixe (230 V)… mais <strong>pour le transport, la
        tension est libre</strong>. Votre objectif : trouver les meilleurs réglages pour perdre le moins d'énergie possible.</>, tache: null },
    { titre: 'Pourquoi des pertes ?', focus: ['ligne'],
      texte: <>Le courant traverse des kilomètres de câbles métalliques.</>,
      tache: { type: 'qcm', q: 'Que devient l’énergie perdue dans les câbles ?',
        options: ['Elle chauffe les câbles (effet Joule)', 'Elle repart vers la centrale', 'Elle s’échappe sous forme de lumière'], bonne: 0,
        expl: 'Un câble a une résistance R : il dissipe en chaleur la puissance R × I².' } },
    { titre: 'Le transformateur', focus: ['t1'],
      texte: <>Un transformateur comporte deux bobines enroulées sur un même noyau de fer : N<sub>1</sub> spires à l'entrée
        (primaire), N<sub>2</sub> spires à la sortie (secondaire). Son rapport vaut m = N<sub>2</sub> / N<sub>1</sub> = U<sub>2</sub> / U<sub>1</sub> = I<sub>1</sub> / I<sub>2</sub>.
        <br/>Un transformateur a 4 spires en entrée, 8 en sortie, et reçoit U<sub>1</sub> = 1,0 V.</>,
      tache: { type: 'num', q: <>Tension de sortie U<sub>2</sub></>, unite: 'V', vrai: 2.0, tol: 0.01,
        pieges: [[0.5, 'm = N₂ / N₁ = 8 / 4 = 2, et U₂ = m × U₁.']] } },
    { titre: 'Le transformateur (suite)', focus: ['t1'],
      texte: <>Un autre transformateur reçoit U<sub>1</sub> = 12 V, délivre U<sub>2</sub> = 4 V et comporte 6 spires en sortie.</>,
      tache: { type: 'num', q: <>Nombre de spires en entrée N<sub>1</sub></>, unite: 'spires', vrai: 18, tol: 0.01,
        pieges: [[2, 'm = U₂ / U₁ = 4 / 12 = 1/3 ; or m = N₂ / N₁, donc N₁ = N₂ / m.']] } },
    { titre: 'Ce que fait un transformateur', focus: ['t1', 't2'],
      texte: <>D'après la relation m = U<sub>2</sub> / U<sub>1</sub> = I<sub>1</sub> / I<sub>2</sub>…</>,
      tache: { type: 'qcm', q: 'Un transformateur permet de modifier…',
        options: ['la tension et l’intensité, mais pas la fréquence', 'la tension seulement', 'la tension, l’intensité et la fréquence'], bonne: 0,
        expl: 'Quand il élève la tension, il abaisse l’intensité dans le même rapport. La fréquence (50 Hz) ne change pas.' } },
    { titre: 'Les deux transformateurs', focus: ['t1', 't2'],
      texte: <>La maquette modélise le réseau : un générateur d'environ 25 V (le parc éolien), un transformateur 1 qui adapte la tension pour
        le transport, une ligne de deux câbles de 10 m, et un transformateur 2 qui adapte la tension pour les habitations.
        Les réglages sont apparus sous le schéma. Réglez m<sub>1</sub> = 2.</>,
      tache: { type: 'qcm', q: <>Pour que les habitations reçoivent à nouveau environ 25 V, comment régler m<sub>2</sub> ?</>,
        options: ['m₂ = 0,5', 'm₂ = 1', 'm₂ = 2'], bonne: 0,
        expl: 'Le transformateur 1 double la tension, le transformateur 2 doit la diviser par 2 : m₁ × m₂ = 1.' } },
    { titre: 'Et dans l’autre sens ?', focus: ['t1', 't2'],
      texte: <>Le transformateur 1 est maintenant réglé sur m<sub>1</sub> = 0,5.</>,
      tache: { type: 'qcm', q: <>Quel réglage de m<sub>2</sub> faut-il ?</>, options: ['m₂ = 0,5', 'm₂ = 1', 'm₂ = 2'], bonne: 2 } },
    { titre: 'Première mesure', focus: ['gen', 'charge'],
      texte: <>Réglez les deux transformateurs sur <strong>1 : 1</strong> et choisissez les <strong>câbles bleus</strong>
        (S = 1,5 mm²). Les appareils de mesure sont apparus sur le schéma.</>,
      tache: { type: 'action', ok: cas11, consigne: `${m1 === 1 && m2 === 1 ? '✅' : '⬜'} réglage 1 : 1   ${cableId === 'bleu' ? '✅' : '⬜'} câbles bleus` } },
    { titre: 'La puissance produite', focus: ['gen'],
      texte: <>Au générateur : V<sub>1</sub> = {fmt(V1a, 1)} V et i<sub>1</sub> = {fmt(i1a, 2)} A.</>,
      tache: { type: 'num', q: <>Puissance électrique produite P<sub>1</sub> = V<sub>1</sub> × i<sub>1</sub></>, unite: 'W', vrai: V1a * i1a, tol: 0.02,
        bloque: !cas11 ? 'Revenez au réglage 1 : 1 avec les câbles bleus.' : null } },
    { titre: 'La puissance reçue', focus: ['charge'],
      texte: <>Aux habitations : V<sub>2</sub> = {fmt(V2a, 1)} V et i<sub>2</sub> = {fmt(i2a, 2)} A.</>,
      tache: { type: 'num', q: <>Puissance reçue P<sub>2</sub> = V<sub>2</sub> × i<sub>2</sub></>, unite: 'W', vrai: V2a * i2a, tol: 0.02,
        bloque: !cas11 ? 'Revenez au réglage 1 : 1 avec les câbles bleus.' : null } },
    { titre: 'Le rendement du transport', focus: ['gen', 'charge'],
      texte: <>Le rendement du transport compare la puissance reçue à la puissance produite : r = P<sub>2</sub> / P<sub>1</sub>.</>,
      tache: { type: 'num', q: 'Rendement r (2 chiffres significatifs)', unite: '%', vrai: V2a * i2a / (V1a * i1a) * 100, tol: 0.03,
        bloque: !cas11 ? 'Revenez au réglage 1 : 1 avec les câbles bleus.' : null,
        pieges: [[V1a * i1a / (V2a * i2a) * 100, 'C’est l’inverse : puissance reçue sur puissance produite.'], [V2a * i2a / (V1a * i1a), 'Exprimez le rendement en pourcentage.']] } },
    { titre: 'Comparer les réglages', focus: ['t1', 't2'],
      texte: <>Le tableau de mesures est apparu. Avec les câbles bleus, testez les trois réglages <strong>1 : 1</strong>,
        <strong> 2 : 0,5</strong> et <strong>0,5 : 2</strong>, et enregistrez la mesure à chaque fois.</>,
      tache: { type: 'action', ok: reglagesTestes >= 3, consigne: `Réglages enregistrés (câbles bleus) : ${reglagesTestes} / 3` } },
    { titre: 'Le meilleur réglage', focus: ['t1', 't2'],
      texte: <>Comparez les rendements obtenus (onglet « Mes mesures »).</>,
      tache: { type: 'qcm', q: <>Quel est le meilleur choix pour m<sub>1</sub> : m<sub>2</sub> ?</>, options: ['1 : 1', '2 : 0,5', '0,5 : 2'], bonne: 1 } },
    { titre: 'Comparer les câbles', focus: ['ligne'],
      texte: <>Gardez le réglage <strong>2 : 0,5</strong> et testez les trois câbles (rouge 1,0 mm², bleu 1,5 mm², noir 2,5 mm²),
        en enregistrant la mesure à chaque fois.</>,
      tache: { type: 'action', ok: cablesTestes >= 3, consigne: `Câbles enregistrés (réglage 2 : 0,5) : ${cablesTestes} / 3` } },
    { titre: 'Le meilleur câble', focus: ['ligne'],
      texte: <>Plus un câble est épais, plus sa résistance est faible : R = ρ × L / S.</>,
      tache: { type: 'qcm', q: 'Quel est le meilleur câble pour le rendement ?', options: ['rouge (1,0 mm²)', 'bleu (1,5 mm²)', 'noir (2,5 mm²)'], bonne: 2,
        expl: 'Mais un câble plus épais est plus lourd et plus cher : c’est un compromis.' } },
    { titre: 'Pourquoi élever la tension ?', focus: ['ligne'],
      texte: <>Pour une même puissance, si on double la tension dans la ligne, l'intensité est divisée par 2. Or les pertes dans les
        câbles valent R × I².</>,
      tache: { type: 'qcm', q: 'Les pertes dans les câbles sont alors…', options: ['divisées par 2', 'divisées par 4', 'inchangées'], bonne: 1,
        expl: 'C’est pour cela que les lignes à haute tension fonctionnent sous 400 000 V !' } },
    { titre: 'Où part l’énergie ?', focus: ['t1', 'ligne', 't2'],
      texte: <>L'onglet <strong>Bilan</strong> détaille où passe la puissance produite, pour le réglage actuel.</>,
      tache: { type: 'qcm', q: 'Dans cette maquette (câbles de 10 m), où sont les plus grosses pertes ?',
        options: ['Dans les câbles', 'Dans les transformateurs'], bonne: 1,
        expl: 'Avec seulement 10 m de câble, ce sont les transformateurs qui perdent le plus. Sur une vraie ligne de plusieurs centaines de km, la résistance des câbles devient énorme : élever la tension devient alors indispensable.' } },
    { titre: 'Bravo !', focus: [],
      texte: <>Vous savez maintenant pourquoi on transporte l'électricité sous haute tension, et pourquoi le choix des câbles est un
        compromis. En exploration libre, vous pouvez allonger la ligne jusqu'à 1 km pour voir ce qui se passe sur une vraie ligne.</>, tache: null },
  ];
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);

  // ════════════════ SCHÉMA ════════════════
  const afficheur = (x, y, texte, c, w = 104) => (
    <g>
      <rect x={x} y={y} width={w} height="26" rx="4" fill="#0f172a"/>
      <text x={x + w / 2} y={y + 19} fontSize="15" fill={c} textAnchor="middle" fontFamily="monospace" fontWeight="700">{texte}</text>
    </g>
  );
  const symboleTransfo = (x, m, nom) => (
    <g>
      <circle cx={x - 13} cy="140" r="24" fill="none" stroke={TXT} strokeWidth="2.5"/>
      <circle cx={x + 13} cy="140" r="24" fill="none" stroke={TXT} strokeWidth="2.5"/>
      <text x={x} y="98" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">{nom}</text>
      {revele.reglages && <text x={x} y="190" fontSize="15" fontWeight="700" fill={COUL.ligne} textAnchor="middle">m = {fmt(m, m % 1 ? 1 : 0)}</text>}
    </g>
  );
  const ep = 2 + cable.S * 2;
  const eclat = Math.min(1, r.P2 / 110);
  const schema = (
    <svg viewBox="0 0 640 300" role="img" aria-label="Réseau de transport : générateur, transformateurs, ligne et habitations"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${BORDER}` }}>
      {/* Éolienne et générateur */}
      <g transform="translate(48 52)">
        <line x1="0" y1="0" x2="0" y2="44" stroke="#64748b" strokeWidth="3"/>
        <g>
          {[0, 120, 240].map(a => <ellipse key={a} cx="0" cy="-14" rx="3.5" ry="14" fill="#94a3b8" transform={`rotate(${a})`}/>)}
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite"/>
        </g>
        <circle r="3" fill={TXT}/>
      </g>
      <circle cx="48" cy="140" r="24" fill="white" stroke={TXT} strokeWidth="2.5"/>
      <path d="M 36 140 Q 42 128 48 140 T 60 140" fill="none" stroke={TXT} strokeWidth="2"/>
      <text x="48" y="186" fontSize="14" fontWeight="700" fill={TXT} textAnchor="middle">parc éolien</text>
      {/* Fils générateur → T1 */}
      <polyline points="48,116 48,106 100,106 100,130 113,130" fill="none" stroke={COUL.gen} strokeWidth="2.5"/>
      <polyline points="48,164 48,174 100,174 100,150 113,150" fill="none" stroke={COUL.gen} strokeWidth="2.5"/>
      {symboleTransfo(150, m1, 'transfo 1')}
      {/* Ligne */}
      <polyline points="187,130 202,130 202,108 436,108 436,130 451,130" fill="none" stroke={cable.c} strokeWidth={ep}/>
      <polyline points="187,150 202,150 202,172 436,172 436,150 451,150" fill="none" stroke={cable.c} strokeWidth={ep}/>
      <text x="320" y="78" fontSize="14" fontWeight="700" fill={TXT} textAnchor="middle">
        ligne : 2 câbles {cable.nom}s de {Lr >= 1000 ? `${fmt(Lr / 1000, 1)} km` : `${Lr} m`}{revele.cables ? ` (S = ${fmt(cable.S, 1)} mm²)` : ''}
      </text>
      {[0, 1, 2].map(k => (
        <polygon key={k} points={`${220 + k * 70},104 ${230 + k * 70},108 ${220 + k * 70},112`} fill={COUL.ligne}>
          <animateTransform attributeName="transform" type="translate" from="0 0" to="40 0" dur={`${Math.max(0.4, 3 / r.Il)}s`} repeatCount="indefinite"/>
        </polygon>
      ))}
      {symboleTransfo(488, m2, 'transfo 2')}
      {/* Habitations */}
      <polyline points="525,130 540,130 540,106 592,106 592,118" fill="none" stroke={COUL.charge} strokeWidth="2.5"/>
      <polyline points="525,150 540,150 540,174 556,174 556,168 572,168" fill="none" stroke={COUL.charge} strokeWidth="2.5"/>
      <polygon points="568,140 592,118 616,140" fill="#fed7aa" stroke={TXT} strokeWidth="2"/>
      <rect x="572" y="140" width="40" height="28" fill="#fff7ed" stroke={TXT} strokeWidth="2"/>
      <circle cx="592" cy="152" r="8" fill="#fde047" opacity={0.2 + 0.8 * eclat} stroke="#a16207"/>
      <text x="592" y="190" fontSize="14" fontWeight="700" fill={TXT} textAnchor="middle">habitations</text>
      {/* Appareils de mesure */}
      {revele.mesures && <g>
        {afficheur(6, 210, `V₁ = ${fmt(r.V1, 1)} V`, '#86efac')}
        {afficheur(6, 240, `i₁ = ${fmt(r.I1, 2)} A`, '#86efac')}
        {afficheur(216, 210, `V ligne = ${fmt(r.Vl, 1)} V`, '#c4b5fd', 168)}
        {afficheur(216, 240, `i ligne = ${fmt(r.Il, 2)} A`, '#c4b5fd', 168)}
        {afficheur(528, 210, `V₂ = ${fmt(r.V2, 1)} V`, '#fdba74')}
        {afficheur(528, 240, `i₂ = ${fmt(r.I2, 2)} A`, '#fdba74')}
      </g>}
      <Cadre actif={hl('gen')} x={4} y={20} w={92} h={176}/>
      <Cadre actif={hl('t1')} x={106} y={82} w={88} h={118}/>
      <Cadre actif={hl('ligne')} x={196} y={62} w={248} h={122}/>
      <Cadre actif={hl('t2')} x={444} y={82} w={88} h={118}/>
      <Cadre actif={hl('charge')} x={548} y={104} w={88} h={94}/>
    </svg>
  );

  // ════════════════ GRAPHIQUES ════════════════
  const barresMesures = [...mesuresTab].sort((a, b) => REGLAGES.findIndex(x => x[0] === a.m1) - REGLAGES.findIndex(x => x[0] === b.m1)
    || CABLES.findIndex(c => c.id === a.cable) - CABLES.findIndex(c => c.id === b.cable))
    .map(q => ({ label: `${nomReglage(q.m1, q.m2)}`, val: q.eta, color: CABLES.find(c => c.id === q.cable).c, fort: true }));
  const onglets = [['bilan', 'Bilan', revele.bilan], ['mesures', 'Mes mesures', revele.tableau]].filter(o => o[2]);
  const ongletAff = onglets.some(o => o[0] === onglet) ? onglet : (onglets[0] || [])[0];
  const graphe = ongletAff === 'mesures' ? (
    barresMesures.length === 0
      ? <div style={{ fontSize: 14, color: TXT2, padding: '40px 12px', textAlign: 'center' }}>Enregistrez des mesures pour les comparer ici.</div>
      : <Graphe xMax={1} yMax={100} xLabel="Réglage m₁ : m₂ (couleur = câble)" yLabel="Rendement (%)" barres={barresMesures}/>
  ) : (
    <Graphe xMax={1} yMax={Math.ceil(r.P1 / 20) * 20} xLabel="" yLabel="Puissance (W)"
      barres={[{ label: 'produite', val: r.P1, color: COUL.gen, fort: true }, { label: 'T1', val: r.pT1, color: COUL.pertes, fort: true },
        { label: 'ligne', val: r.pL, color: COUL.pertes, fort: true }, { label: 'T2', val: r.pT2, color: COUL.pertes, fort: true },
        { label: 'reçue', val: r.P2, color: COUL.charge, fort: true }]}/>
  );
  const blocGraphe = onglets.length === 0 ? null : (
    <div style={box}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {onglets.map(([k, l]) => <button key={k} onClick={() => setOnglet(k)} style={petitBtn(ongletAff === k, '#334155')}>{l}</button>)}
      </div>
      {graphe}
      <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
        {ongletAff === 'mesures' ? <>Chaque barre est une mesure enregistrée ; sa couleur est celle du câble utilisé.</>
          : <>En vert, la puissance produite ; en rouge, les pertes dans le transformateur 1 (T1), la ligne et le transformateur 2 (T2) ;
            en orange, la puissance reçue par les habitations.</>}
      </div>
    </div>
  );

  // ════════════════ VOLETS ════════════════
  const choixM = (val, set) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {[0.5, 1, 2].map(m => <button key={m} onClick={() => set(m)} style={petitBtn(val === m, COUL.ligne)}>m = {fmt(m, m % 1 ? 1 : 0)}</button>)}
    </div>
  );
  const commandes = (
    <>
      {!revele.reglages && <div style={{ fontSize: 13, color: TXT2 }}>Les commandes apparaîtront au fil du parcours.</div>}
      {revele.reglages && <>
        <div style={{ fontSize: 13.5, color: TXT2, fontWeight: 700, marginBottom: 4 }}>Transformateur 1 (départ)</div>
        {choixM(m1, setM1)}
        <div style={{ fontSize: 13.5, color: TXT2, fontWeight: 700, margin: '10px 0 4px' }}>Transformateur 2 (arrivée)</div>
        {choixM(m2, setM2)}
        {Math.abs(m1 * m2 - 1) > 0.01 && <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 6 }}>
          m₁ × m₂ ≠ 1 : les habitations ne reçoivent pas la bonne tension.</div>}
      </>}
      {revele.cables && <>
        <div style={{ fontSize: 13.5, color: TXT2, fontWeight: 700, margin: '10px 0 4px' }}>Câbles de la ligne</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {CABLES.map(c => <button key={c.id} onClick={() => setCableId(c.id)} style={petitBtn(cableId === c.id, c.c)}>{c.nom} · {fmt(c.S, 1)} mm²</button>)}
        </div>
      </>}
      {mode === 'explore' && <>
        <div style={{ fontSize: 13.5, color: TXT2, fontWeight: 700, margin: '10px 0 4px' }}>Longueur de la ligne</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[10, 50, 100, 300, 1000].map(l => <button key={l} onClick={() => setL(l)} style={petitBtn(L === l, '#334155')}>{l >= 1000 ? '1 km' : `${l} m`}</button>)}
        </div>
      </>}
      {revele.tableau && <button onClick={ajouterMesure} style={{ ...btn(true, '#0284c7'), marginTop: 10 }}>➕ Enregistrer cette mesure</button>}
    </>
  );
  const mesures = (
    <>
      {ligne(<>Générateur : V<sub>1</sub> ; i<sub>1</sub></>, `${fmt(r.V1, 1)} V ; ${fmt(r.I1, 2)} A`, COUL.gen, 'g')}
      {ligne(<>Ligne : V ; i</>, `${fmt(r.Vl, 1)} V ; ${fmt(r.Il, 2)} A`, COUL.ligne, 'l')}
      {ligne(<>Habitations : V<sub>2</sub> ; i<sub>2</sub></>, `${fmt(r.V2, 1)} V ; ${fmt(r.I2, 2)} A`, COUL.charge, 'h')}
      {mode === 'explore' && <>
        {ligne(<>Puissance produite P<sub>1</sub></>, `${fmt(r.P1, 1)} W`, COUL.gen, 'p1')}
        {ligne(<>Puissance reçue P<sub>2</sub></>, `${fmt(r.P2, 1)} W`, COUL.charge, 'p2')}
        {ligne('Rendement du transport', `${fmt(r.eta * 100, 1)} %`, COUL.pertes, 'eta')}
        {ligne(<>Résistance de la ligne R = ρ × 2L / S</>, `${fmt(r.Rl, 3)} Ω`, COUL.ligne, 'rl')}
        {ligne(<>Pertes dans la ligne R × i²</>, `${fmt(r.pL, 1)} W`, COUL.pertes, 'pl')}
      </>}
    </>
  );
  const tableau = mesuresTab.length === 0 ? <div style={{ fontSize: 12.5, color: TXT2 }}>Aucune mesure enregistrée.</div> : (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead><tr>{['m₁ : m₂', 'câble', 'P₁ (W)', 'P₂ (W)', 'r (%)'].map(h => (
        <th key={h} style={{ textAlign: 'right', padding: '3px 5px', borderBottom: `1.5px solid ${BORDER}`, color: TXT2 }}>{h}</th>))}</tr></thead>
      <tbody>{mesuresTab.map((q, i) => (
        <tr key={i}>{[nomReglage(q.m1, q.m2), q.cable, fmt(q.P1, 1), fmt(q.P2, 1), enGuide && etape < 12 ? '?' : fmt(q.eta, 1)].map((c, j) => (
          <td key={j} style={{ textAlign: 'right', padding: '3px 5px', fontFamily: 'monospace' }}>{c}</td>))}</tr>
      ))}</tbody>
    </table>
  );
  const comprendre = (
    <div style={{ fontSize: 13.5, color: TXT, lineHeight: 1.6 }}>
      <div>Transformateur : m = N<sub>2</sub> / N<sub>1</sub> = U<sub>2</sub> / U<sub>1</sub> = I<sub>1</sub> / I<sub>2</sub>.</div>
      <div>Résistance d'un câble : R = ρ × L / S (cuivre : ρ = 1,7 × 10⁻⁸ Ω·m). La ligne a deux câbles : longueur totale 2L.</div>
      <div>Pertes dans la ligne : P<sub>pertes</sub> = R × I<sup>2</sup>. Rendement : r = P<sub>2</sub> / P<sub>1</sub>.</div>
      <div style={{ marginTop: 6, color: TXT2 }}>
        Doubler la tension de la ligne divise l'intensité par 2 et les pertes de la ligne par 4. Sur la maquette, les câbles ne font que
        10 m et ce sont surtout les transformateurs qui chauffent ; sur un vrai réseau, les lignes font des centaines de km, et la haute
        tension (jusqu'à 400 kV) est indispensable. Essayez une ligne de 1 km !
      </div>
    </div>
  );

  // ════════════════ DÉFI : MISSION « GESTIONNAIRE DE RÉSEAU » ════════════════
  function nouvelleMission() {
    const cible = [72, 80, 84, 85][Math.floor(Math.random() * 4)];
    setMission({ cible, valide: null });
  }
  const coutLigne = c => c.prix * 2 * 10;
  const solutionsOk = mission ? REGLAGES.flatMap(([a, b]) => CABLES.map(c => ({ a, b, c, eta: reseau(a, b, c.S).eta * 100 })))
    .filter(x => x.eta >= mission.cible) : [];
  const meilleurCout = solutionsOk.length ? Math.min(...solutionsOk.map(x => coutLigne(x.c))) : null;
  function validerMission() {
    const ok = Math.abs(m1 * m2 - 1) < 0.01 && r.eta * 100 >= mission.cible;
    const moinsCher = ok && coutLigne(cable) <= meilleurCout + 1e-9;
    setMission(m => ({ ...m, valide: { ok, moinsCher, eta: r.eta * 100, cout: coutLigne(cable) } }));
  }
  const voletDefi = !mission ? null : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 15, color: TXT, lineHeight: 1.6 }}>
        <strong>Mission : gestionnaire de réseau.</strong> Le contrat exige un rendement de transport d'au moins
        <strong> {mission.cible} %</strong>, et les habitations doivent recevoir la bonne tension. Les câbles coûtent
        <strong> 1,0 € / m</strong> (rouge), <strong>1,5 € / m</strong> (bleu) et <strong>2,5 € / m</strong> (noir).
        Trouvez la solution <strong>la moins chère</strong> qui respecte le contrat, puis validez.
      </div>
      <div style={{ fontSize: 14, color: TXT2 }}>Coût de la ligne actuelle (2 × 10 m) : <strong>{fmt(coutLigne(cable), 0)} €</strong></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={validerMission} style={btn(true, '#16a34a')}>✓ Valider ma solution</button>
        <button onClick={nouvelleMission} style={btn(false)}>🔄 Nouvelle mission</button>
      </div>
      {mission.valide && (
        <div style={{ fontSize: 14, lineHeight: 1.55, color: mission.valide.ok && mission.valide.moinsCher ? '#15803d' : '#b91c1c' }}>
          {!mission.valide.ok ? <>❌ Contrat non respecté : {Math.abs(m1 * m2 - 1) > 0.01 ? 'les habitations ne reçoivent pas la bonne tension (m₁ × m₂ ≠ 1).'
            : `rendement de ${fmt(mission.valide.eta, 1)} %, inférieur à ${mission.cible} %.`}</>
            : mission.valide.moinsCher ? <>✅ Bravo : contrat respecté ({fmt(mission.valide.eta, 1)} %) au coût le plus bas ({fmt(mission.valide.cout, 0)} €) ! 🎉</>
              : <>⚠️ Contrat respecté ({fmt(mission.valide.eta, 1)} %), mais il existe une solution moins chère. Cherchez encore !</>}
        </div>
      )}
      <div style={{ fontSize: 12.5, color: TXT2 }}>Astuce : le réglage des transformateurs ne coûte rien…</div>
    </div>
  );

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !mission) nouvelleMission();
  }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={btn(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={btn(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tr-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tr-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .tr-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: TXT }}>Transport · De l'éolienne aux habitations</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={btn(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={btn(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={btn(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      <div className="tr-l1">
        <div style={box}>
          <div style={titreBox}>La maquette du réseau de transport</div>
          {schema}
          <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
            {enGuide ? <>L'élément encadré en orange est celui dont parle l'étape en cours.</>
              : <>Le transformateur 1 adapte la tension pour le transport, le transformateur 2 la ramène pour les habitations.
                L'épaisseur des câbles dessinés suit leur section.</>}
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={box}>{voletDefi}</div> : blocGraphe}
      </div>
      <div className="tr-l2">
        {mode !== 'explore' && blocGraphe}
        <div>
          {section('commandes', 'Commandes', commandes)}
          {revele.mesures && section('mesures', 'Mesures', mesures)}
        </div>
        {revele.tableau && section('points', 'Mes mesures', tableau)}
        {mode === 'explore' && section('comprendre', 'Comprendre', comprendre)}
      </div>
    </div>
  );
}
