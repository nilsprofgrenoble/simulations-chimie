import { useState, useEffect, useRef } from "react";
import { cardStyle, Graphe, fmt, sci, lireNombre, proche, CarteParcours, Cadre, ORANGE_GUIDE } from "../commun";

// ====================================================
// ENERGY@SCHOOL — ATELIER STOCKAGE
// Atelier 1 : dans une batterie Li-ion (charge / décharge)
// Atelier 2 : assembler des cellules (série, parallèle) pour remplir une mission
// Cellules et densités tirées du tableau de l'atelier (CEA-Liten / ENSE3).
// ====================================================

const ST_F = 96485;
// Tension à vide d'une cellule graphite / oxyde (NMC) selon l'état de charge
const OCV = [[0, 3.0], [0.05, 3.42], [0.15, 3.56], [0.3, 3.64], [0.5, 3.72], [0.7, 3.84], [0.85, 3.97], [0.95, 4.1], [1, 4.2]];
const ocv = x => {
  for (let k = 0; k < OCV.length - 1; k++) {
    const [x0, u0] = OCV[k], [x1, u1] = OCV[k + 1];
    if (x <= x1) return u0 + (u1 - u0) * (x - x0) / (x1 - x0);
  }
  return 4.2;
};
const ST_RINT = 0.05;   // Ω, résistance interne

// Cellules disponibles pour l'atelier 2 (valeurs du tableau de l'atelier)
const CELLULES = [
  { id: 'patate', nom: 'Pile patate Zn/Cu', U: 0.9, Q: 0.82, m: 81, c: '#a16207', note: '1 g de zinc dans 80 g de patate' },
  { id: 'nimh', nom: 'Ni-MH AA (GP 2300)', U: 1.2, Q: 2.25, m: 30, c: '#16a34a' },
  { id: 'plomb', nom: 'Plomb 6 V (Bosch)', U: 6, Q: 4, m: 541, c: '#475569' },
  { id: 'liion', nom: 'Li-ion 18650 (ATL)', U: 3.7, Q: 2.03, m: 45.4, c: '#2563eb' },
  { id: 'lihd', nom: 'Li-ion haute densité', U: 3.6, Q: 5.0, m: 72, c: '#7c3aed', note: 'les meilleures cellules actuelles, 250 Wh/kg' },
];
const MISSIONS = [
  { id: 'reveil', nom: 'Allumer le réveil', texte: 'au moins 1,5 V', ok: b => b.U >= 1.5 },
  { id: 'tel', nom: 'Alimenter un téléphone', texte: 'entre 3,6 et 4,4 V, au moins 8 Wh, au plus 100 g', ok: b => b.U >= 3.6 && b.U <= 4.4 && b.E >= 8 && b.m <= 100 },
  { id: 'velo', nom: 'Batterie de vélo électrique', texte: 'entre 33 et 42 V, au moins 400 Wh, au plus 3 kg', ok: b => b.U >= 33 && b.U <= 42 && b.E >= 400 && b.m <= 3000 },
  { id: 'zoe', nom: 'Une Zoé pour 400 km à 80 km/h', texte: 'au moins 54 kWh, au plus 217 kg de cellules, entre 340 et 420 V',
    ok: b => b.E >= 54000 && b.m <= 217000 && b.U >= 340 && b.U <= 420 },
];
const POTENTIELS = [['Or', 'Au³⁺/Au', 1.50], ['Argent', 'Ag⁺/Ag', 0.80], ['Cuivre', 'Cu²⁺/Cu', 0.34], ['Hydrogène', 'H⁺/H₂', 0.00],
  ['Plomb', 'Pb²⁺/Pb', -0.13], ['Nickel', 'Ni²⁺/Ni', -0.25], ['Fer', 'Fe²⁺/Fe', -0.44], ['Zinc', 'Zn²⁺/Zn', -0.76],
  ['Aluminium', 'Al³⁺/Al', -1.66], ['Sodium', 'Na⁺/Na', -2.71], ['Lithium', 'Li⁺/Li', -3.04]];

const COUL = { neg: '#dc2626', pos: '#64748b', li: '#2563eb', anion: '#7c3aed', elec: '#16a34a',
  txt: '#0f172a', txt2: '#334155', bord: '#cbd5e1', fond: '#f8fafc' };

export function SimulationStockage() {
  const [atelier, setAtelier] = useState(1);
  const [mode, setMode] = useState('guide');
  const [guide1, setGuide1] = useState({ etape: 0, reps: {}, verifs: {} });
  const [guide2, setGuide2] = useState({ etape: 0, reps: {}, verifs: {} });
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true, assemblage: true, missions: true });

  // ── Atelier 1 ──
  const [sens, setSens] = useState('decharge');        // 'decharge' (lampe) | 'charge' (chargeur)
  const [marche, setMarche] = useState(false);
  const [Qcap, setQcap] = useState(3.0);                 // Ah
  const [I, setI] = useState(1.5);                       // A
  const [vitesse, setVitesse] = useState(300);
  const [etat, setEtat] = useState({ soc: 1, t: 0, E: 0 });
  const [vus, setVus] = useState({ decharge: false, charge: false });
  const [socDepart, setSocDepart] = useState(1);

  // ── Atelier 2 ──
  const [celId, setCelId] = useState('patate');
  const [nS, setNS] = useState(1);
  const [nP, setNP] = useState(1);
  const [missionId, setMissionId] = useState('reveil');
  const [defi, setDefi] = useState(null);

  // ── Batterie Li-ion : simulation ──
  const signe = sens === 'decharge' ? -1 : 1;
  const U1 = ocv(etat.soc) + signe * ST_RINT * I * (marche ? 1 : 0);
  const masse1 = 15 * Qcap;                              // g (≈ 45 g pour 3 Ah, comme une 18650)
  const refs = useRef({}); refs.current = { I, Qcap, sens, vitesse };
  useEffect(() => {
    if (!marche) return;
    let prec = performance.now(), id;
    const pas = now => {
      const dtR = Math.min(0.1, (now - prec) / 1000); prec = now;
      const { I: i, Qcap: q, sens: s, vitesse: v } = refs.current;
      const dt = dtR * v;                                   // s simulées
      let fini = false;
      setEtat(e => {
        const d = (s === 'decharge' ? -1 : 1) * i * dt / 3600 / q;
        const soc = Math.min(1, Math.max(0, e.soc + d));
        if ((s === 'decharge' && soc <= 0) || (s === 'charge' && soc >= 1)) fini = true;
        const u = ocv(e.soc) + (s === 'decharge' ? -1 : 1) * ST_RINT * i;
        return { soc, t: e.t + dt, E: e.E + (s === 'decharge' ? u * i * dt / 3600 : 0) };
      });
      if (fini) setMarche(false); else id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [marche]);
  useEffect(() => {
    if (!marche) return;
    if (sens === 'decharge' && socDepart - etat.soc >= 0.1) setVus(v => (v.decharge ? v : { ...v, decharge: true }));
    if (sens === 'charge' && etat.soc - socDepart >= 0.1) setVus(v => (v.charge ? v : { ...v, charge: true }));
  }, [etat.soc, marche, sens, socDepart]);
  const vide = etat.soc <= 0.001, pleine = etat.soc >= 0.999;
  const bloque = !marche && ((sens === 'decharge' && vide) || (sens === 'charge' && pleine));
  function lancer() {
    if (bloque) return;
    if (!marche) setSocDepart(etat.soc);
    setMarche(m => !m);
  }
  function changerSens(s) { setSens(s); setMarche(false); }

  // ── Assemblage : atelier 2 ──
  const cel = CELLULES.find(c => c.id === celId);
  const bat = { U: nS * cel.U, Q: nP * cel.Q, n: nS * nP, m: nS * nP * cel.m };
  bat.E = bat.U * bat.Q; bat.dens = bat.E / (bat.m / 1000);
  const mission = MISSIONS.find(x => x.id === missionId);

  // ── Styles ──
  const { txt: TXT, txt2: TXT2, bord: BORDER, fond: BG } = COUL;
  const box = { background: BG, borderRadius: 10, padding: '10px 12px', border: `1px solid ${BORDER}` };
  const titreBox = { fontWeight: 700, fontSize: 15, color: TXT, marginBottom: 6 };
  const btn = (actif, c = '#0284c7') => ({ padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, border: `1.5px solid ${actif ? c : BORDER}`,
    background: actif ? c : 'white', color: actif ? 'white' : TXT2 });
  const petitBtn = (actif, c) => ({ ...btn(actif, c), padding: '5px 10px', fontSize: 13 });
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
  function curseur(label, valeur, set, min, max, step, unite, d = 0) {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: TXT2, fontWeight: 700 }}>
          <span>{label}</span><span style={{ color: TXT }}>{fmt(valeur, d)} {unite}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={valeur} onChange={x => set(parseFloat(x.target.value))}
          style={{ width: '100%', accentColor: '#2563eb' }}/>
      </div>
    );
  }
  const compteur = (label, v, set, max) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 13.5, color: TXT2, fontWeight: 700, minWidth: 150 }}>{label}</span>
      <button onClick={() => set(x => Math.max(1, x - 1))} style={petitBtn(false)} aria-label={`${label} : moins`}>−</button>
      <input value={v} aria-label={label} onChange={x => { const n = parseInt(x.target.value, 10); if (n >= 1 && n <= max) set(n); }}
        style={{ width: 56, fontSize: 15, padding: '4px 6px', border: `1.5px solid ${BORDER}`, borderRadius: 6, textAlign: 'center' }}/>
      <button onClick={() => set(x => Math.min(max, x + 1))} style={petitBtn(false)} aria-label={`${label} : plus`}>+</button>
    </div>
  );

  // ════════════════ PARCOURS GUIDÉS ════════════════
  const enGuide = mode === 'guide';
  const e1 = guide1.etape, e2 = guide2.etape;
  const vu1 = k => !enGuide || e1 >= k, vu2 = k => !enGuide || e2 >= k;
  const rev1 = { commandes: vu1(2), equations: vu1(2), chargeur: vu1(6), graphe: vu1(9), reglages: vu1(10) };
  const rev2 = { assemblage: vu2(4), missions: vu2(4) };
  const E37 = 3.7 * Qcap;
  const ETAPES1 = [
    { titre: 'Qu’y a-t-il dans une batterie ?', focus: ['neg', 'pos', 'sep'],
      texte: <>Une batterie lithium-ion stocke de l'énergie sous forme <strong>chimique</strong> et la rend sous forme
        <strong> électrique</strong>. Chaque électrode est faite de petites <strong>billes</strong> de matière active, collées sur un
        collecteur métallique : du <strong>graphite</strong> côté négatif (des feuillets d'hexagones de carbone C<sub>6</sub>), un
        <strong> oxyde métallique</strong> (NMC) côté positif, lui aussi en feuillets. Entre les feuillets, comme sur des étagères, les
        ions lithium Li⁺ peuvent venir se ranger. Un <strong>électrolyte</strong> liquide remplit tout l'espace entre les billes, et un
        <strong> séparateur</strong> poreux empêche les deux électrodes de se toucher.</>, tache: null },
    { titre: 'Le séparateur', focus: ['sep'],
      texte: <>Le séparateur empêche les deux électrodes de se toucher.</>,
      tache: { type: 'qcm', q: 'Que laisse-t-il passer ?', options: ['Les ions, mais pas les électrons', 'Les électrons, mais pas les ions', 'Rien du tout'], bonne: 0,
        expl: 'Les électrons sont obligés de faire le tour par le circuit extérieur : c’est ce courant qui allume la lampe.' } },
    { titre: 'La décharge', focus: ['lampe'],
      texte: <>La batterie est chargée et une lampe est branchée. Les commandes sont apparues sous le schéma : lancez la décharge
        et observez les ions et les électrons.</>,
      tache: { type: 'action', ok: vus.decharge, consigne: `État de charge : ${fmt(etat.soc * 100, 0)} %` } },
    { titre: 'Le chemin des ions', focus: ['neg', 'pos'],
      texte: <>Regardez dans quel sens traversent les ions Li⁺ pendant la décharge.</>,
      tache: { type: 'qcm', q: 'Pendant la décharge, les ions Li⁺ vont…', options: ['de l’électrode négative vers la positive', 'de l’électrode positive vers la négative'], bonne: 0 } },
    { titre: 'Le chemin des électrons', focus: ['lampe'],
      texte: <>Les électrons, eux, ne peuvent pas traverser l'électrolyte.</>,
      tache: { type: 'qcm', q: 'Pendant la décharge, les électrons vont…',
        options: ['de la borne − vers la borne + en passant par la lampe', 'de la borne + vers la borne − en passant par la lampe', 'directement à travers le séparateur'], bonne: 0,
        expl: 'Ions et électrons partent du même côté et arrivent du même côté, mais par deux chemins différents.' } },
    { titre: 'Chaque ion a son électron', focus: ['neg', 'pos'],
      texte: <>Regardez une bille : chaque ion Li⁺ rangé entre les feuillets est accompagné d'un électron (en vert). Quand un ion Li⁺
        quitte une bille de graphite, son électron la quitte aussi, mais par le collecteur et le fil.</>,
      tache: { type: 'qcm', q: 'Quand un ion Li⁺ vient se ranger dans une bille d’oxyde, qu’est-ce qui garde la bille électriquement neutre ?',
        options: ['Un électron, arrivé par le circuit et le collecteur', 'Un anion de l’électrolyte, qui entre aussi dans la bille', 'Rien : la bille se charge positivement'], bonne: 0,
        expl: 'C’est l’électron qui compense la charge de l’ion dans la bille (il réduit le métal de l’oxyde). Les anions restent dans l’électrolyte, qui remplit les pores entre les billes : ils assurent la neutralité de l’électrolyte, pas celle des billes.' } },
    { titre: 'La charge', focus: ['lampe'],
      texte: <>On remplace la lampe par un <strong>chargeur</strong> (le bouton est apparu). Lancez la charge.</>,
      tache: { type: 'action', ok: vus.charge, consigne: `${sens === 'charge' ? '✅' : '⬜'} chargeur branché   État de charge : ${fmt(etat.soc * 100, 0)} %` } },
    { titre: 'Pourquoi faut-il un chargeur ?', focus: ['neg', 'pos'],
      texte: <>Pendant la charge, ions et électrons font le chemin inverse.</>,
      tache: { type: 'qcm', q: 'Pourquoi une lampe ne suffit-elle pas pour recharger la batterie ?',
        options: ['Il faut un générateur qui force les ions et les électrons à revenir vers l’électrode négative', 'La lampe est trop petite', 'Il faut d’abord vider l’électrolyte'], bonne: 0,
        expl: 'La décharge est spontanée ; la charge ne l’est pas : il faut fournir de l’énergie.' } },
    { titre: 'Anode ou cathode ?', focus: ['neg'],
      texte: <>Regardez les demi-équations sous le schéma. En décharge, le graphite perd ses électrons : c'est une
        <strong> oxydation</strong>, il joue le rôle d'<strong>anode</strong>. Passez en charge et observez.</>,
      tache: { type: 'qcm', q: 'Pendant la charge, l’électrode de graphite…',
        options: ['est le siège d’une réduction : elle joue alors le rôle de cathode', 'reste l’anode', 'devient la borne +'], bonne: 0,
        expl: 'Les noms anode et cathode suivent la réaction, donc changent avec le régime. Les bornes + et − ne changent pas. (Les fabricants appellent souvent « cathode » l’électrode NMC : c’est son rôle en décharge.)' } },
    { titre: 'La tension de la batterie', focus: [],
      texte: <>Le graphique montre la tension de la cellule selon son état de charge.</>,
      tache: { type: 'qcm', q: 'Quand la batterie se décharge, sa tension…', options: ['augmente', 'diminue, de 4,2 V à 3,0 V environ', 'reste exactement constante'], bonne: 1,
        expl: 'On retient une tension « nominale » de 3,7 V, sa valeur moyenne pendant la décharge.' } },
    { titre: 'La capacité', focus: ['neg'],
      texte: <>La capacité Q (en ampères-heures, Ah) dit combien d'électricité la batterie peut débiter : une batterie de
        <strong> {fmt(Qcap, 1)} Ah</strong> peut débiter {fmt(Qcap, 1)} A pendant 1 h. Les réglages sont apparus : augmentez la capacité,
        et regardez le nombre de billes (donc de places pour le lithium) ; augmentez l'intensité, et regardez le flux d'ions et
        d'électrons. Ici, la batterie débite <strong>{fmt(I, 1)} A</strong>.</>,
      tache: { type: 'num', q: 'Durée de la décharge complète t = Q / I', unite: 'h', vrai: Qcap / I, tol: 0.03,
        pieges: [[I / Qcap, 'C’est Q divisé par I.'], [Qcap / I * 60, 'La réponse est demandée en heures.']] } },
    { titre: 'L’énergie stockée', focus: [],
      texte: <>L'énergie stockée vaut E = U × Q, avec la tension nominale U = 3,7 V.</>,
      tache: { type: 'num', q: <>Énergie stockée E (Q = {fmt(Qcap, 1)} Ah)</>, unite: 'Wh', vrai: E37, tol: 0.03 } },
    { titre: 'La densité d’énergie', focus: [],
      texte: <>Cette cellule a une masse de <strong>{fmt(masse1, 0)} g</strong>. La densité massique d'énergie se mesure en Wh/kg.</>,
      tache: { type: 'num', q: 'Densité massique d’énergie', unite: 'Wh/kg', vrai: E37 / (masse1 / 1000), tol: 0.03,
        pieges: [[E37 / masse1, 'La masse doit être en kilogrammes : 45 g = 0,045 kg.']] } },
    { titre: 'Combien de lithium ? (terminale)', focus: ['neg'],
      texte: <>Chaque ion Li⁺ qui traverse s'accompagne d'un électron dans le circuit. La charge totale vaut Q × 3600 (en coulombs),
        et une mole d'électrons porte F = 96 485 C (constante de Faraday).</>,
      tache: { type: 'num', q: 'Quantité de lithium qui fait l’aller-retour n = Q × 3600 / F', unite: 'mol', vrai: Qcap * 3600 / ST_F, tol: 0.03,
        pieges: [[Qcap / ST_F, 'Convertissez d’abord la capacité en coulombs : 1 Ah = 3600 C.']], aide: 'Notation scientifique acceptée : pour 4,5 × 10⁻⁶, tapez 4,5e-6.' } },
    { titre: 'Bravo !', focus: [],
      texte: <>Vous savez ce qui se passe dans une batterie et comment la caractériser (tension, capacité, énergie, densité).
        Passez à l'atelier 2 pour assembler des cellules et relever des missions.</>, tache: null },
  ];
  const zn = 0.34 - (-0.76);
  const mGP = CELLULES[1];
  const tPatate = celId === 'patate', reveilOk = tPatate && MISSIONS[0].ok(bat);
  const telOk = MISSIONS[1].ok(bat), zoeOk = MISSIONS[3].ok(bat);
  const tableauPot = (
    <table style={{ borderCollapse: 'collapse', fontSize: 12.5, margin: '6px 0' }}>
      <tbody>{POTENTIELS.map(([n, c, v]) => (
        <tr key={n}><td style={{ padding: '1px 8px 1px 0' }}>{n}</td><td style={{ padding: '1px 8px' }}>{c}</td>
          <td style={{ padding: '1px 0', textAlign: 'right', fontFamily: 'monospace' }}>{v > 0 ? '+' : ''}{fmt(v, 2)} V</td></tr>))}</tbody>
    </table>
  );
  const ETAPES2 = [
    { titre: 'Une cellule ne suffit pas', focus: [],
      texte: <>Une seule cellule donne une tension et une énergie limitées. Pour un réveil, un téléphone, un vélo ou une voiture,
        on <strong>assemble</strong> des cellules. Mais d'abord : comment choisir les matériaux d'une cellule ?</>, tache: null },
    { titre: 'Choisir ses électrodes', focus: [],
      texte: <>La tension d'une cellule est (au mieux) la différence des potentiels de ses deux couples :{tableauPot}</>,
      tache: { type: 'qcm', q: 'Quelle association donnerait la plus grande tension ?', options: ['Cuivre et zinc', 'Or et lithium', 'Argent et cuivre', 'Fer et zinc'], bonne: 1,
        expl: '1,50 − (−3,04) = 4,54 V. Mais l’or coûte cher… les batteries réelles associent le lithium à des oxydes métalliques.' } },
    { titre: 'La pile cuivre-zinc', focus: [],
      texte: <>La pile « patate » utilise une électrode de zinc et une de cuivre (potentiels : Cu<sup>2+</sup>/Cu +0,34 V ; Zn<sup>2+</sup>/Zn −0,76 V).</>,
      tache: { type: 'num', q: 'Tension théorique de la pile cuivre-zinc', unite: 'V', vrai: zn, tol: 0.02,
        pieges: [[0.34 - 0.76, 'Attention au signe : 0,34 − (−0,76) = 0,34 + 0,76.']],
        expl: 'En réalité on mesure un peu moins (vers 0,9 V) : le fruit n’est pas une solution « standard ».' } },
    { titre: 'Et le lithium ?', focus: [],
      texte: <>Le lithium donnerait les plus grandes tensions. Pourtant, les batteries au lithium n'utilisent jamais d'eau
        (ni de fruit !) : les cellules sont assemblées sous argon, avec un électrolyte organique.</>,
      tache: { type: 'qcm', q: 'Pourquoi ?', options: ['Le lithium réagit violemment avec l’eau', 'Le lithium est trop lourd', 'L’eau est trop chère'], bonne: 0,
        expl: 'De plus, au-delà d’environ 1,5 à 2 V, l’eau elle-même se décompose (électrolyse).' } },
    { titre: 'Allumer le réveil', focus: [],
      texte: <>Le réveil a besoin d'<strong>au moins 1,5 V</strong>. L'assemblage est apparu sous le schéma : avec des piles
        patates (0,9 V chacune), trouvez comment y arriver.</>,
      tache: { type: 'action', ok: reveilOk, consigne: reveilOk ? null : `Tension actuelle : ${fmt(bat.U, 2)} V (avec des piles patates)` } },
    { titre: 'Série ou parallèle ?', focus: [],
      texte: <>Essayez d'ajouter des cellules en série, puis en parallèle, et regardez U et Q.</>,
      tache: { type: 'qcm', q: 'En série, les tensions s’additionnent. En parallèle…', options: ['les capacités s’additionnent', 'les tensions s’additionnent aussi', 'rien ne change'], bonne: 0,
        expl: 'Série : plus de tension. Parallèle : plus de capacité (plus longtemps). Dans les deux cas, l’énergie E = U × Q augmente.' } },
    { titre: 'L’énergie d’une cellule', focus: [],
      texte: <>Une pile Ni-MH GP 2300 affiche 1,2 V et 2,25 Ah. On rappelle E = U × Q.</>,
      tache: { type: 'num', q: 'Énergie stockée', unite: 'Wh', vrai: mGP.U * mGP.Q, tol: 0.02 } },
    { titre: 'La densité d’énergie', focus: [],
      texte: <>Cette pile pèse 30 g.</>,
      tache: { type: 'num', q: 'Densité massique d’énergie', unite: 'Wh/kg', vrai: mGP.U * mGP.Q / 0.030, tol: 0.03,
        pieges: [[mGP.U * mGP.Q / 30, 'Le piège classique : la masse doit être en kg (30 g = 0,030 kg).']] } },
    { titre: 'Mission téléphone', focus: [],
      texte: <>Un téléphone demande entre <strong>3,6 et 4,4 V</strong>, au moins <strong>8 Wh</strong>, et la batterie ne doit pas
        dépasser <strong>100 g</strong>. Choisissez le type de cellule et l'assemblage.</>,
      tache: { type: 'action', ok: telOk, consigne: telOk ? null : `Actuel : ${fmt(bat.U, 1)} V ; ${fmt(bat.E, 1)} Wh ; ${fmt(bat.m, 0)} g` } },
    { titre: 'Et une voiture ?', focus: [],
      texte: <>À 80 km/h, une Renault Zoé consomme <strong>13,5 kWh pour 100 km</strong>.</>,
      tache: { type: 'num', q: 'Énergie nécessaire pour parcourir 400 km', unite: 'kWh', vrai: 54, tol: 0.02,
        pieges: [[13.5 * 400, 'La consommation est donnée pour 100 km : divisez par 100.']] } },
    { titre: 'Quelle densité faut-il ?', focus: [],
      texte: <>Les cellules de la Zoé pèsent au total <strong>217 kg</strong>.</>,
      tache: { type: 'num', q: 'Densité d’énergie nécessaire', unite: 'Wh/kg', vrai: 54000 / 217, tol: 0.03,
        pieges: [[54 / 217, '54 kWh = 54 000 Wh.']] } },
    { titre: 'Mission Zoé', focus: [],
      texte: <>Construisez la batterie de la Zoé : au moins 54 kWh, au plus 217 kg de cellules, et une tension entre 340 et 420 V.
        Quelles cellules le permettent ? (Indice : il en faut des milliers…)</>,
      tache: { type: 'action', ok: zoeOk, consigne: zoeOk ? null : `Actuel : ${fmt(bat.U, 0)} V ; ${fmt(bat.E / 1000, 1)} kWh ; ${fmt(bat.m / 1000, 1)} kg (${bat.n} cellules)` } },
    { titre: 'Bravo !', focus: [],
      texte: <>Seules les meilleures cellules actuelles (250 Wh/kg) permettent la mission Zoé. Avec du plomb, la même masse ne ferait
        que 80 km… et avec des patates, 12 km ! Explorez librement ou relevez le défi.</>, tache: null },
  ];
  const et = atelier === 1 ? ETAPES1[Math.min(e1, ETAPES1.length - 1)] : ETAPES2[Math.min(e2, ETAPES2.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);

  // ════════════════ SCHÉMA DE LA BATTERIE ════════════════
  // Chaque électrode est faite de billes de matière active baignées d'électrolyte.
  // Graphite : feuillets de carbone (hexagones C6) ; oxyde NMC : feuillets MO2. Les ions Li+ se rangent entre les
  // feuillets, comme sur des étagères, et chacun est accompagné d'un électron (électroneutralité de la bille).
  // 1 bille (9 places) par ampère-heure de capacité : plus de capacité, c'est plus de matière active
  const POS_BILLES = [[114, 126], [184, 140], [114, 196], [188, 216], [116, 264]];
  const RB = 32;
  const nBilles = Math.ceil(Qcap - 1e-9);
  const billesNeg = POS_BILLES.slice(0, nBilles);
  const billesPos = billesNeg.map(([x, y]) => [640 - x, y]);
  const sitesDe = billes => billes.flatMap(([x, y]) => [-14, 0, 14].flatMap(dy => [-13, 0, 13].map(dx => [x + dx, y + dy])));
  const N = Math.round(Qcap * 9);                         // nombre d'ions Li+ qui font l'aller-retour
  const sNeg = sitesDe(billesNeg).slice(0, N), sPos = sitesDe(billesPos).slice(0, N);
  const nNeg = Math.round(etat.soc * N);
  const enCours = marche && I > 0 && !(sens === 'decharge' && vide) && !(sens === 'charge' && pleine);
  const nTransit = Math.min(8, Math.max(1, Math.round(I * 1.3)));      // plus de courant : plus d'ions en route…
  const dureeTransit = 4 / (0.6 + I / 2);                            // … et qui vont plus vite
  const nElec = Math.min(18, Math.max(3, Math.round(I * 3)));
  const dureeElec = 5 / (0.6 + I / 2);
  const fluxDroite = sens === 'decharge';
  const cheminFil = 'M 69 96 L 69 44 L 571 44 L 571 96';
  const eclat = sens === 'decharge' && enCours ? Math.min(1, (U1 * I) / 15) : 0;
  const hexa = (cx, cy, r) => Array.from({ length: 6 }, (_, k) => {
    const a = Math.PI / 3 * k + Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  const bille = (x, y, k, graphite) => (
    <g key={`b${graphite ? 'g' : 'o'}${k}`}>
      <clipPath id={`clip${graphite ? 'g' : 'o'}${k}`}><circle cx={x} cy={y} r={RB}/></clipPath>
      <circle cx={x} cy={y} r={RB} fill={graphite ? '#f3f4f6' : '#fff7ed'} stroke={TXT} strokeWidth="2"/>
      <g clipPath={`url(#clip${graphite ? 'g' : 'o'}${k})`}>
        {[-21, -7, 7, 21].map(dy => graphite
          ? Array.from({ length: 9 }, (_, i) => (
            <polygon key={`${dy}-${i}`} points={hexa(x - RB + i * 8.5, y + dy, 4.2)} fill="none" stroke="#6b7280" strokeWidth="1"/>))
          : <rect key={dy} x={x - RB} y={y + dy - 3} width={2 * RB} height="6" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="0.8"/>)}
      </g>
    </g>
  );
  const ionLi = (x, y, cle, avecElectron) => (
    <g key={cle}>
      <circle cx={x} cy={y} r="6.5" fill={COUL.li}/>
      <text x={x} y={y + 3.5} fontSize="10" fill="white" textAnchor="middle" fontWeight="700">+</text>
      {avecElectron && <circle cx={x + 7} cy={y - 5} r="3" fill={COUL.elec} stroke="#065f46" strokeWidth="0.6"/>}
    </g>
  );
  const ionsLibres = [[262, 118], [298, 214], [350, 136], [372, 262], [248, 282], [392, 178], [324, 280], [150, 290], [490, 290]];
  const anions = [[278, 160], [340, 104], [356, 214], [262, 236], [150, 100], [86, 160], [150, 238], [490, 100], [554, 160], [490, 238], [300, 132], [384, 238], [86, 290], [554, 290]];
  const schemaBatterie = (
    <svg viewBox="0 0 640 330" role="img" aria-label="Batterie lithium-ion en charge ou en décharge"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${BORDER}` }}>
      {/* circuit extérieur */}
      <path d={cheminFil} fill="none" stroke={TXT} strokeWidth="2"/>
      {sens === 'decharge' ? (
        <g>
          <circle cx="320" cy="36" r="16" fill="#fde047" opacity={0.25 + 0.75 * eclat} stroke="#a16207" strokeWidth="2"/>
          <rect x="312" y="50" width="16" height="9" fill={TXT}/>
          <text x="346" y="30" fontSize="14" fontWeight="700" fill={TXT}>lampe</text>
        </g>
      ) : (
        <g>
          <rect x="290" y="24" width="60" height="34" rx="6" fill="#dcfce7" stroke={TXT} strokeWidth="2"/>
          <text x="320" y="46" fontSize="13" fontWeight="700" fill={TXT} textAnchor="middle">chargeur</text>
        </g>
      )}
      {enCours && Array.from({ length: nElec }, (_, k) => (
        <circle key={`e${k}-${nElec}`} r="4" fill={COUL.elec} stroke="#065f46">
          <animateMotion dur={`${dureeElec.toFixed(2)}s`} begin={`${(-k * dureeElec / nElec).toFixed(2)}s`} repeatCount="indefinite" path={cheminFil}
            keyPoints={fluxDroite ? '0;1' : '1;0'} keyTimes="0;1" calcMode="linear"/>
        </circle>
      ))}
      {/* électrolyte : il remplit tout l'espace entre les billes, jusqu'aux collecteurs */}
      <rect x="76" y="92" width="488" height="208" fill="#e0f2fe"/>
      <rect x="312" y="92" width="16" height="208" fill="#cbd5e1" opacity="0.8"/>
      {Array.from({ length: 13 }, (_, k) => <circle key={k} cx="320" cy={100 + k * 16} r="2.2" fill="white"/>)}
      {/* collecteurs */}
      <rect x="62" y="92" width="14" height="208" fill="#b45309"/>
      <rect x="564" y="92" width="14" height="208" fill="#9ca3af"/>
      <text x="44" y="200" fontSize="24" fontWeight="700" fill={TXT} textAnchor="middle">−</text>
      <text x="598" y="200" fontSize="24" fontWeight="700" fill={TXT} textAnchor="middle">+</text>
      <text x="44" y="222" fontSize="11" fill={TXT2} textAnchor="middle">Cu</text>
      <text x="598" y="222" fontSize="11" fill={TXT2} textAnchor="middle">Al</text>
      {/* liant conducteur entre billes et collecteurs */}
      {billesNeg.map(([x, y], k) => {
        const [x2, y2] = k === 0 || k === 2 || k === 4 ? [76, y] : billesNeg[k - 1];
        return <g key={`li${k}`}>
          <line x1={x} y1={y} x2={x2} y2={y2} stroke={TXT} strokeWidth="3"/>
          <line x1={640 - x} y1={y} x2={640 - x2} y2={y2} stroke={TXT} strokeWidth="3"/>
        </g>;
      })}
      {billesNeg.map(([x, y], k) => bille(x, y, k, true))}
      {billesPos.map(([x, y], k) => bille(x, y, k, false))}
      {/* anions et ions Li+ libres de l'électrolyte (autant de + que de −) */}
      {anions.map(([x, y], k) => (
        <g key={`a${k}`}><circle cx={x} cy={y} r="7" fill={COUL.anion}/><text x={x} y={y + 3.5} fontSize="10" fill="white" textAnchor="middle" fontWeight="700">−</text></g>
      ))}
      {ionsLibres.map(([x, y], k) => ionLi(x, y, `l${k}`, false))}
      {/* ions Li+ rangés dans les feuillets, chacun avec son électron */}
      {sNeg.slice(0, nNeg).map(([x, y], k) => ionLi(x, y, `n${k}`, true))}
      {sPos.slice(0, N - nNeg).map(([x, y], k) => ionLi(x, y, `p${k}`, true))}
      {/* ions en transit à travers l'électrolyte et le séparateur */}
      {enCours && Array.from({ length: nTransit }, (_, k) => {
        const y = 112 + ((k * 37) % 176);
        return (
          <g key={`t${k}-${nTransit}-${sens}`}>
            <animateTransform attributeName="transform" type="translate" from={`${fluxDroite ? 226 : 414} 0`} to={`${fluxDroite ? 414 : 226} 0`}
              dur={`${dureeTransit.toFixed(2)}s`} begin={`${(-k * dureeTransit / nTransit).toFixed(2)}s`} repeatCount="indefinite"/>
            <circle cx="0" cy={y} r="6.5" fill={COUL.li} stroke="white" strokeWidth="1.5"/>
            <text x="0" y={y + 3.5} fontSize="10" fill="white" textAnchor="middle" fontWeight="700">+</text>
          </g>
        );
      })}
      <text x="160" y="318" fontSize="13" fontWeight="700" fill={TXT} textAnchor="middle">électrode négative : billes de graphite</text>
      <text x="320" y="318" fontSize="12" fontWeight="700" fill={TXT2} textAnchor="middle">séparateur</text>
      <text x="482" y="318" fontSize="13" fontWeight="700" fill={TXT} textAnchor="middle">électrode positive : billes d'oxyde NMC</text>
      {/* jauge de charge, comme sur un téléphone */}
      {(() => {
        const pc = Math.round(etat.soc * 100);
        const c = pc > 50 ? '#16a34a' : pc > 20 ? '#f59e0b' : '#dc2626';
        return (
          <g transform="translate(92 6)">
            <rect x="0" y="0" width="84" height="30" rx="6" fill="white" stroke={TXT} strokeWidth="2.5"/>
            <rect x="84" y="9" width="6" height="12" rx="2" fill={TXT}/>
            <rect x="3.5" y="3.5" width={77 * etat.soc} height="23" rx="3.5" fill={c}/>
            <text x="42" y="21" fontSize="15" fontWeight="800" fill={TXT} textAnchor="middle"
              stroke="white" strokeWidth="3" paintOrder="stroke">{pc} %</text>
            {sens === 'charge' && enCours && <text x="100" y="22" fontSize="18">⚡</text>}
          </g>
        );
      })()}
      {/* légende */}
      <g transform="translate(410 12)">
        <circle cx="0" cy="0" r="6" fill={COUL.li}/><text x="10" y="4" fontSize="12" fill={TXT}>ion Li⁺</text>
        <circle cx="66" cy="0" r="3.5" fill={COUL.elec}/><text x="74" y="4" fontSize="12" fill={TXT}>électron</text>
        <circle cx="140" cy="0" r="6" fill={COUL.anion}/><text x="150" y="4" fontSize="12" fill={TXT}>anion</text>
      </g>
      <Cadre actif={hl('neg')} x={58} y={88} w={196} h={216}/>
      <Cadre actif={hl('pos')} x={386} y={88} w={196} h={216}/>
      <Cadre actif={hl('sep')} x={290} y={88} w={60} h={216}/>
      <Cadre actif={hl('lampe')} x={276} y={10} w={96} h={56}/>
    </svg>
  );
  // Demi-équations : le sens de lecture et les noms anode / cathode dépendent du régime ; les signes + et − non.
  const enDecharge = sens === 'decharge';
  const carteEq = (titre, eq, sensDroite, role, c) => (
    <div style={{ flex: '1 1 240px', background: 'white', border: `1.5px solid ${c}`, borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c, marginBottom: 4 }}>{titre}</div>
      <div style={{ fontSize: 15.5, fontFamily: 'serif', color: TXT, whiteSpace: 'nowrap' }}>{eq}</div>
      <div style={{ fontSize: 13, color: TXT, marginTop: 4 }}>
        En {enDecharge ? 'décharge' : 'charge'} : sens <strong>{sensDroite ? '→' : '←'}</strong>, {role}
      </div>
    </div>
  );
  const equations = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {carteEq('Électrode négative (graphite)', <>Li<sup>+</sup> + C<sub>6</sub> + e<sup>−</sup> ⇄ LiC<sub>6</sub></>, !enDecharge,
        enDecharge ? <><strong>oxydation</strong> : elle joue le rôle d'<strong>anode</strong></> : <><strong>réduction</strong> : elle joue le rôle de <strong>cathode</strong></>, COUL.neg)}
      {carteEq('Électrode positive (oxyde NMC)', <>Li<sup>+</sup> + MO<sub>2</sub> + e<sup>−</sup> ⇄ LiMO<sub>2</sub></>, enDecharge,
        enDecharge ? <><strong>réduction</strong> : elle joue le rôle de <strong>cathode</strong></> : <><strong>oxydation</strong> : elle joue le rôle d'<strong>anode</strong></>, '#7c3aed')}
      <div style={{ flexBasis: '100%', fontSize: 12, color: TXT2 }}>
        M = nickel, manganèse, cobalt (écritures simplifiées). Les bornes + et − ne changent jamais ; les noms anode et cathode, si.
      </div>
    </div>
  );

  // ════════════════ SCHÉMA DE L'ASSEMBLAGE ════════════════
  const schemaAssemblage = (() => {
    const lignes = Math.min(nP, 6), cols = Math.min(nS, 10);
    const w = Math.min(44, 520 / cols - 10), h = 22;
    const x0 = 320 - (cols * (w + 10)) / 2, y0 = 140 - (lignes * (h + 8)) / 2;
    return (
      <svg viewBox="0 0 640 300" role="img" aria-label="Assemblage de cellules en série et en parallèle"
        style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${BORDER}` }}>
        <text x="320" y="26" fontSize="16" fontWeight="700" fill={TXT} textAnchor="middle">
          {nS} en série × {nP} en parallèle = {bat.n} cellule{bat.n > 1 ? 's' : ''} « {cel.nom} »
        </text>
        <line x1={x0 - 20} y1={y0 - 4} x2={x0 - 20} y2={y0 + lignes * (h + 8) - 8} stroke={TXT} strokeWidth="2"/>
        <line x1={x0 + cols * (w + 10) + 10} y1={y0 - 4} x2={x0 + cols * (w + 10) + 10} y2={y0 + lignes * (h + 8) - 8} stroke={TXT} strokeWidth="2"/>
        {Array.from({ length: lignes }, (_, l) => (
          <g key={l}>
            <line x1={x0 - 20} y1={y0 + l * (h + 8) + h / 2} x2={x0 + cols * (w + 10) + 10} y2={y0 + l * (h + 8) + h / 2} stroke={TXT} strokeWidth="1.5"/>
            {Array.from({ length: cols }, (_, c) => (
              <g key={c}>
                <rect x={x0 + c * (w + 10)} y={y0 + l * (h + 8)} width={w} height={h} rx="5" fill={cel.c} stroke={TXT} strokeWidth="1.5"/>
                <text x={x0 + c * (w + 10) + w / 2} y={y0 + l * (h + 8) + 15} fontSize="11" fill="white" textAnchor="middle" fontWeight="700">{fmt(cel.U, 1)} V</text>
              </g>
            ))}
          </g>
        ))}
        {(nS > 10 || nP > 6) && <text x="320" y="246" fontSize="13" fill={TXT2} textAnchor="middle">
          (dessin limité à 10 × 6 cellules)</text>}
        <text x={x0 - 26} y={y0 + lignes * (h + 8) / 2} fontSize="20" fontWeight="700" fill={TXT} textAnchor="end">−</text>
        <text x={x0 + cols * (w + 10) + 16} y={y0 + lignes * (h + 8) / 2} fontSize="20" fontWeight="700" fill={TXT}>+</text>
        <g>
          {[[`U = ${fmt(bat.U, bat.U >= 100 ? 0 : 1)} V`, '#2563eb'], [`Q = ${fmt(bat.Q, 2)} Ah`, '#16a34a'],
            [`E = ${bat.E >= 1000 ? `${fmt(bat.E / 1000, 1)} kWh` : `${fmt(bat.E, 1)} Wh`}`, '#ea580c'],
            [`m = ${bat.m >= 1000 ? `${fmt(bat.m / 1000, 2)} kg` : `${fmt(bat.m, 0)} g`}`, TXT]].map(([t, c], k) => (
            <g key={k}>
              <rect x={14 + k * 156} y="256" width="148" height="30" rx="5" fill="#0f172a"/>
              <text x={88 + k * 156} y="277" fontSize="15" fill="white" textAnchor="middle" fontFamily="monospace" fontWeight="700">{t}</text>
              <rect x={14 + k * 156} y="256" width="6" height="30" fill={c}/>
            </g>
          ))}
        </g>
      </svg>
    );
  })();

  // ════════════════ GRAPHIQUES ════════════════
  const ptsOcv = Array.from({ length: 51 }, (_, k) => [k * 2, ocv(k / 50)]);
  const grapheBatterie = (
    <Graphe xMax={100} yMax={4.5} xLabel="État de charge (%)" yLabel="Tension de la cellule (V)"
      courbes={[{ pts: ptsOcv, color: '#2563eb', label: 'tension à vide' }]}
      points={[{ x: etat.soc * 100, y: U1, color: TXT, fill: '#fde047', r: 6.5 }]}/>
  );
  const grapheDensites = (
    <Graphe xMax={1} yMax={300} xLabel="Type de cellule" yLabel="Densité d'énergie (Wh/kg)"
      barres={CELLULES.map(c => ({ label: c.id === 'lihd' ? 'Li HD' : c.id === 'liion' ? 'Li-ion' : c.id === 'nimh' ? 'Ni-MH' : c.id === 'plomb' ? 'plomb' : 'patate',
        val: c.U * c.Q / (c.m / 1000), color: c.c, fort: c.id === celId }))}/>
  );
  const blocGraphe = (atelier === 1 ? rev1.graphe : true) && (
    <div style={box}>
      <div style={titreBox}>{atelier === 1 ? 'Tension et état de charge' : 'Densité d’énergie des cellules'}</div>
      {atelier === 1 ? grapheBatterie : grapheDensites}
      <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
        {atelier === 1 ? <>Point jaune : la batterie en ce moment. En décharge, la tension mesurée est un peu plus basse que la tension à vide
          (résistance interne) ; en charge, un peu plus haute.</>
          : <>Densités calculées avec les valeurs du tableau de l'atelier (E = U × Q, divisée par la masse). Cellule choisie en foncé.</>}
      </div>
    </div>
  );

  // ════════════════ VOLETS ════════════════
  const commandes1 = (
    <>
      {!rev1.commandes && <div style={{ fontSize: 13, color: TXT2 }}>Les commandes apparaîtront au fil du parcours.</div>}
      {rev1.commandes && <>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <button onClick={() => changerSens('decharge')} style={petitBtn(sens === 'decharge', '#ca8a04')}>💡 Lampe (décharge)</button>
          {rev1.chargeur && <button onClick={() => changerSens('charge')} style={petitBtn(sens === 'charge', '#16a34a')}>🔌 Chargeur (charge)</button>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <button onClick={lancer} disabled={bloque} style={{ ...btn(!bloque, marche ? '#d97706' : '#2563eb'), opacity: bloque ? 0.5 : 1 }}>
            {marche ? '⏸ Pause' : sens === 'decharge' ? '▶ Lancer la décharge' : '▶ Lancer la charge'}</button>
        </div>
        {bloque && <div style={{ fontSize: 13, color: '#b45309', marginBottom: 8 }}>
          {sens === 'decharge' ? 'La batterie est vide : il n’y a plus de lithium dans le graphite. Passez en charge.'
            : 'La batterie est pleine : tout le lithium est rangé dans le graphite. Passez en décharge.'}</div>}
        <div style={{ fontSize: 12.5, color: TXT2, fontWeight: 700, marginBottom: 3 }}>Vitesse du temps</div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
          {[60, 300, 1200].map(v => <button key={v} onClick={() => setVitesse(v)} style={petitBtn(vitesse === v, '#334155')}>× {v}</button>)}
        </div>
      </>}
      {rev1.reglages && <>
        {curseur('Capacité de la cellule (quantité de lithium)', Qcap, v => { setQcap(v); }, 1, 5, 0.5, 'Ah', 1)}
        {curseur('Intensité du courant', I, setI, 0.5, 6, 0.5, 'A', 1)}
      </>}
    </>
  );
  const mesures1 = (
    <>
      {ligne('État de charge', `${fmt(etat.soc * 100, 0)} %`, '#2563eb', 's')}
      {ligne('Tension de la cellule', `${fmt(U1, 2)} V`, '#2563eb', 'u')}
      {ligne('Intensité', marche ? `${fmt(I, 1)} A` : '0 A', COUL.elec, 'i')}
      {ligne('Durée écoulée', `${fmt(etat.t / 60, 0)} min`, TXT, 't')}
      {mode === 'explore' && <>
        {ligne('Énergie rendue à la lampe', `${fmt(etat.E, 2)} Wh`, '#ea580c', 'e')}
        {ligne(<>Énergie stockée (U<sub>nominale</sub> × Q)</>, `${fmt(E37, 1)} Wh`, '#ea580c', 'es')}
        {ligne('Masse de la cellule', `${fmt(masse1, 0)} g`, TXT, 'm')}
        {ligne('Densité d’énergie', `${fmt(E37 / (masse1 / 1000), 0)} Wh/kg`, '#7c3aed', 'd')}
        {ligne(<>Lithium échangé n = Q × 3600 / F</>, `${sci(Qcap * 3600 / ST_F)} mol`, '#2563eb', 'n')}
      </>}
    </>
  );
  const assemblage = (
    <>
      {!rev2.assemblage && <div style={{ fontSize: 13, color: TXT2 }}>L'assemblage apparaîtra au fil du parcours.</div>}
      {rev2.assemblage && <>
        <div style={{ fontSize: 13.5, color: TXT2, fontWeight: 700, marginBottom: 4 }}>Type de cellule</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {CELLULES.map(c => <button key={c.id} onClick={() => setCelId(c.id)} style={petitBtn(celId === c.id, c.c)}>{c.nom}</button>)}
        </div>
        <div style={{ fontSize: 12.5, color: TXT2, marginBottom: 8 }}>
          Une cellule : {fmt(cel.U, 2)} V ; {fmt(cel.Q, 2)} Ah ; {fmt(cel.m, 1)} g{cel.note ? ` (${cel.note})` : ''}.
        </div>
        {compteur('Cellules en série', nS, setNS, 200)}
        {compteur('Branches en parallèle', nP, setNP, 200)}
      </>}
    </>
  );
  const resultats2 = (
    <>
      {ligne(<>Tension U = n<sub>série</sub> × U<sub>cellule</sub></>, `${fmt(bat.U, 2)} V`, '#2563eb', 'u')}
      {ligne(<>Capacité Q = n<sub>parallèle</sub> × Q<sub>cellule</sub></>, `${fmt(bat.Q, 2)} Ah`, '#16a34a', 'q')}
      {ligne('Énergie E = U × Q', bat.E >= 1000 ? `${fmt(bat.E / 1000, 2)} kWh` : `${fmt(bat.E, 2)} Wh`, '#ea580c', 'e')}
      {ligne('Masse', bat.m >= 1000 ? `${fmt(bat.m / 1000, 2)} kg` : `${fmt(bat.m, 0)} g`, TXT, 'm')}
      {ligne('Densité d’énergie', `${fmt(bat.dens, 0)} Wh/kg`, '#7c3aed', 'd')}
    </>
  );
  const missions = (
    <>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {MISSIONS.map(x => <button key={x.id} onClick={() => setMissionId(x.id)} style={petitBtn(missionId === x.id, '#0ea5e9')}>{x.nom}</button>)}
      </div>
      <div style={{ fontSize: 14, color: TXT, lineHeight: 1.5 }}><strong>{mission.nom}</strong> : {mission.texte}.</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6, color: mission.ok(bat) ? '#15803d' : '#b91c1c' }}>
        {mission.ok(bat) ? '✅ Mission réussie !' : '❌ Pas encore'}
      </div>
    </>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    if (atelier === 1) {
      const q = [1.5, 2, 2.5, 3, 3.5, 4.5][Math.floor(Math.random() * 6)];
      const i = [0.5, 1, 1.5, 2, 2.5][Math.floor(Math.random() * 5)];
      const m = Math.round(q * 15 + (Math.random() * 10 - 5));
      setDefi({ q, i, m, reps: {}, verifie: false });
    } else {
      setDefi({ mission: MISSIONS[1 + Math.floor(Math.random() * 3)].id, valide: null });
    }
  }
  const qDefi1 = defi && atelier === 1 && defi.q ? [
    { id: 't', q: <>Une cellule de {fmt(defi.q, 1)} Ah débite {fmt(defi.i, 1)} A. Durée de la décharge</>, unite: 'h', vrai: defi.q / defi.i },
    { id: 'e', q: 'Énergie stockée (tension nominale 3,7 V)', unite: 'Wh', vrai: 3.7 * defi.q },
    { id: 'd', q: <>Densité d'énergie (masse {defi.m} g)</>, unite: 'Wh/kg', vrai: 3.7 * defi.q / (defi.m / 1000) },
    { id: 'n', q: 'Quantité de lithium échangée', unite: 'mol', vrai: defi.q * 3600 / ST_F },
  ] : [];
  const justeD = q => { const x = lireNombre(defi.reps[q.id]); return isFinite(x) && proche(x, q.vrai, 0.04); };
  const missionDefi = defi && defi.mission ? MISSIONS.find(x => x.id === defi.mission) : null;
  const voletDefi = !defi ? null : atelier === 1 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: TXT }}>Défi : caractériser une cellule Li-ion</div>
      {qDefi1.map((q, k) => {
        const ok = defi.verifie && justeD(q);
        return (
          <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : BORDER}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TXT, marginBottom: 4 }}>{k + 1}. {q.q}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`}
                onChange={x => { const v = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: v } })); }}
                style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${BORDER}`, borderRadius: 6, width: 120 }}/>
              <span style={{ fontSize: 13, color: TXT2 }}>{q.unite}</span>
              {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
            </div>
            {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: TXT2, marginTop: 3 }}>Valeur attendue : {sci(q.vrai)} {q.unite}</div>}
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={btn(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={nouveauDefi} style={btn(false)}>🔄 Nouvelle cellule</button>
      </div>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 15, color: TXT, lineHeight: 1.6 }}>
        <strong>Défi : {missionDefi.nom}.</strong> Contraintes : {missionDefi.texte}. Trouvez une solution qui respecte tout,
        avec <strong>la batterie la plus légère possible</strong>.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => {
          const ok = missionDefi.ok(bat);
          let best = Infinity;
          CELLULES.forEach(c => { for (let s = 1; s <= 130; s++) for (let p = 1; p <= 60; p++) {
            const b = { U: s * c.U, Q: p * c.Q, m: s * p * c.m }; b.E = b.U * b.Q;
            if (missionDefi.ok(b) && b.m < best) best = b.m; } });
          setDefi(d => ({ ...d, valide: { ok, leger: ok && bat.m <= best * 1.0001, best } }));
        }} style={btn(true, '#16a34a')}>✓ Valider</button>
        <button onClick={nouveauDefi} style={btn(false)}>🔄 Nouvelle mission</button>
      </div>
      {defi.valide && <div style={{ fontSize: 14, lineHeight: 1.55, color: defi.valide.ok && defi.valide.leger ? '#15803d' : '#b91c1c' }}>
        {!defi.valide.ok ? '❌ Une contrainte n’est pas respectée.'
          : defi.valide.leger ? `✅ Parfait : c’est la solution la plus légère (${bat.m >= 1000 ? `${fmt(bat.m / 1000, 2)} kg` : `${fmt(bat.m, 0)} g`}) ! 🎉`
            : `⚠️ Contrat rempli, mais on peut faire plus léger (meilleure solution : ${defi.valide.best >= 1000 ? `${fmt(defi.valide.best / 1000, 2)} kg` : `${fmt(defi.valide.best, 0)} g`}).`}
      </div>}
    </div>
  );

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi') nouveauDefi(); }
  function changerAtelier(a) { setAtelier(a); setDefi(null); }
  useEffect(() => { if (mode === 'defi' && !defi) nouveauDefi(); }, [mode, atelier, defi]);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {atelier === 1 && <button onClick={() => changerAtelier(2)} style={btn(true, '#7c3aed')}>Atelier 2 ▶</button>}
      <button onClick={() => changerMode('explore')} style={btn(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={btn(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .st-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .st-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .st-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerAtelier(1)} style={btn(atelier === 1, '#2563eb')}>Atelier 1 · Dans une batterie</button>
          <button onClick={() => changerAtelier(2)} style={btn(atelier === 2, '#7c3aed')}>Atelier 2 · Assembler une batterie</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={btn(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={btn(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={btn(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      <div className="st-l1">
        <div style={box}>
          <div style={titreBox}>{atelier === 1 ? 'Une cellule lithium-ion' : 'Votre batterie'}</div>
          {atelier === 1 ? schemaBatterie : schemaAssemblage}
          {atelier === 1 && rev1.equations && equations}
          <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
            {atelier === 1 ? <>Dans la batterie, les ions Li⁺ traversent l'électrolyte ; à l'extérieur, les électrons parcourent le circuit.
              {enGuide ? ' L’élément encadré en orange est celui dont parle l’étape en cours.' : ''}</>
              : <>Les cellules d'une même rangée sont en série ; les rangées sont en parallèle.</>}
          </div>
        </div>
        {enGuide ? (atelier === 1
          ? <CarteParcours key="s1" etapes={ETAPES1} etat={guide1} setEtat={setGuide1} fin={finParcours}/>
          : <CarteParcours key="s2" etapes={ETAPES2} etat={guide2} setEtat={setGuide2} fin={finParcours}/>)
          : mode === 'defi' ? <div style={box}>{voletDefi}</div> : blocGraphe}
      </div>
      <div className="st-l2">
        {mode !== 'explore' && blocGraphe}
        {atelier === 1 ? (
          <div>
            {section('commandes', 'Commandes', commandes1)}
            {rev1.commandes && section('mesures', 'Mesures', mesures1)}
          </div>
        ) : (
          <>
            <div>{section('assemblage', 'Assemblage', assemblage)}</div>
            {rev2.assemblage && <div>
              {section('mesures', 'Caractéristiques de la batterie', resultats2)}
              {mode !== 'defi' && rev2.missions && section('missions', 'Missions', missions)}
            </div>}
          </>
        )}
      </div>
    </div>
  );
}
