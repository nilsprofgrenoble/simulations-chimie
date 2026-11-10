
// ═══════════════════════════════════════════════════════════════════════════
//  MACHINES THERMIQUES (Terminale STL — SPCL, thème « Systèmes et procédés »)
//  Simulation à deux facettes basculables : pompe à chaleur (PAC) d'un bassin
//  d'aquaculture et groupe froid d'une chambre de laboratoire. Mêmes organes,
//  mêmes bilans, énergie utile différente.
//
//  ⚠️ INTÉGRATION (à la charge de Claude) :
//   • choisir un identifiant SIM_ID libre dans src/App.jsx (ce fichier utilise 84,
//     à vérifier) et y ajouter le composant SimulationMachinesThermiques ;
//   • ajouter la simulation au chapitre TSTL « Systèmes et procédés » dans src/chapitres.js ;
//   • vérifier src/descriptions.js (fiche élève) si une description est requise ;
//   • modèle pur exporté en bas (copMax, copReel, bilanCycle) : un fichier
//     MachinesThermiques.test.mjs peut reprendre les tests habituels.
//  Origine pédagogique : séquence « machines thermiques » (inspiration académique,
//  contextes et valeurs entièrement reformulés — bassin d'aquaculture et chambre
//  froide de laboratoire, données constructeur fictives).
// ═══════════════════════════════════════════════════════════════════════════

import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";

const SIM_ID = 89;
declarerDefis(SIM_ID, [['principal', 'Faire le bilan d\'une machine thermique']]);

// ── Modèle (fonctions pures, testables) ─────────────────────────────────────
// Températures en °C dans les fonctions ; conversion Kelvin interne pour les
// efficacités théoriques (Carnot). La machine réelle est modélisée par un
// rendement global ETA constant (fraction du maximum théorique atteinte par la
// machine réelle, pertes comprises) : hypothèse simplificatrice affichée à
// l'élève. Le COP « constructeur » est arrondi à 0,1 : c'est la valeur affichée
// ET la valeur utilisée par le corrigé (données affichées = données du corrigé).

export const ETA_PAC = 0.42;   // PAC eau/eau performante (plage réaliste 0,35–0,5)
export const ETA_FRIGO = 0.30; // groupe froid de laboratoire (plage réaliste 0,25–0,4)
export const K = c => c + 273.15;

// Efficacité thermodynamique maximale (limite théorique) :
//  PAC : T_c/(T_c − T_f) ; machine frigorifique : T_f/(T_c − T_f), en kelvins.
export const copMax = (machine, tc, tf) =>
  machine === 'pac' ? K(tc) / (tc - tf) : K(tf) / (tc - tf);

// COP « constructeur » : rendement constant fois le maximum théorique, arrondi au dixième.
export const copReel = (machine, tc, tf) => {
  const eta = machine === 'pac' ? ETA_PAC : ETA_FRIGO;
  return Math.round(eta * copMax(machine, tc, tf) * 10) / 10;
};

// Bilan d'un cycle : PAC : utile = Q_c cédée à la source chaude, Q_f = Q_c − W.
// Frigo : utile = Q_f captée à la source froide, Q_c = Q_f + W. Cycle : Q_c = Q_f + W.
export const bilanCycle = (machine, tc, tf, wElec) => {
  const cop = copReel(machine, tc, tf);
  const qUtile = cop * wElec;                 // kW, énergie utile de la machine
  return machine === 'pac'
    ? { cop, qChaude: qUtile, qFroide: qUtile - wElec, wElec }
    : { cop, qChaude: qUtile + wElec, qFroide: qUtile, wElec };
};
// Énergie utile (kW) : côté chaud pour une PAC, côté froid pour une machine frigorifique.
export const energieUtile = (machine, tc, tf, wElec) => {
  const b = bilanCycle(machine, tc, tf, wElec);
  return machine === 'pac' ? b.qChaude : b.qFroide;
};

// Contextes des deux machines (totalement fictifs, plausibles).
export const MACHINES = {
  pac: {
    nom: 'Pompe à chaleur d\'un bassin',
    utile: 'chauffer l\'eau du bassin', utileCourt: 'eau du bassin',
    sourceChaude: 'l\'eau du bassin', sourceFroide: 'l\'air extérieur',
    plaques: { tc: [18, 30, 1], tf: [-5, 15, 1], w: [1, 5, 0.5] },
    defauts: { tc: 22, tf: 7, w: 2.0 },
  },
  frigo: {
    nom: 'Groupe froid d\'une chambre de laboratoire',
    utile: 'refroidir la chambre', utileCourt: 'chambre froide',
    sourceChaude: 'l\'air du laboratoire', sourceFroide: 'la chambre froide',
    plaques: { tc: [18, 25, 1], tf: [-8, 8, 1], w: [0.5, 2, 0.5] },
    defauts: { tc: 20, tf: 3, w: 1.0 },
  },
};

// ── Données du parcours guidé (fixes, redonnées à chaque étape) ──────────────
// PAC du bassin : T_c = 22 °C, T_f = 7 °C, W_elec = 2,0 kW → COP 8,3 ; Qc = 16,6 kW ; Qf = 14,6 kW.
const G = MACHINES.pac.defauts;
const GP = bilanCycle('pac', G.tc, G.tf, G.w);
const GMAX = copMax('pac', G.tc, G.tf);
// Groupe froid : T_c = 20 °C, T_f = 3 °C, W_elec = 1,0 kW → COP 4,9 ; Qf = 4,9 kW ; Qc = 5,9 kW.
const F = MACHINES.frigo.defauts;
const GF = bilanCycle('frigo', F.tc, F.tf, F.w);
const FMAX = copMax('frigo', F.tc, F.tf);

// ── Schéma du circuit : deux modes affichables via un bouton ─────────────────
//  • vue détaillée : boucle du circuit avec les 4 organes, sources animées
//    (flocons qui tombent côté froid, ondes de chaleur côté chaud) ;
//  • vue simplifiée : diagramme de bilan « machine thermique réceptrice »
//    (deux sources, la machine, trois transferts) — le schéma du cours.
// Vraies flèches : corps + pointe dessinés ensemble, la pointe garde une taille
// lisible même pour un flux puissant (contrairement à un marqueur sur un trait épais).
const eEpaiss = v => Math.max(3, Math.min(12, 3 + v / 2.5));

function Fleche({ x1, y1, x2, y2, c, ep }) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const tL = Math.max(11, ep * 1.9), tW = ep * 1.6;
  const bx = x2 - ux * tL, by = y2 - uy * tL, px = -uy, py = ux;
  return (<>
    <line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={ep} strokeLinecap="round" />
    <polygon points={`${x2},${y2} ${bx + px * tW / 2},${by + py * tW / 2} ${bx - px * tW / 2},${by - py * tW / 2}`} fill={c} />
  </>);
}

// Flocon animé (tombée + fondu) — animation SMIL, sans JavaScript.
function Flocon({ x, y, s, delai }) {
  return (<g transform={`translate(${x}, ${y})`}>
    <text fontSize={s} fill="#60a5fa" opacity="0.85">❄</text>
    <animateTransform attributeName="transform" type="translate" additive="sum" from="0 0" to="0 40" dur="3.5s" begin={`${delai}s`} repeatCount="indefinite" />
    <animate attributeName="opacity" values="0.9;0.9;0" keyTimes="0;0.7;1" dur="3.5s" begin={`${delai}s`} repeatCount="indefinite" />
  </g>);
}

// Onde de chaleur qui monte et ondule (transform + opacité + dashoffset).
function Onde({ x, y, delai }) {
  return (<g transform={`translate(${x}, ${y})`}>
    <path d="M 0 0 q 6 -5 0 -10 q -6 -5 0 -10 q 6 -5 0 -10" stroke="#fb923c" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="7 7">
      <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1.2s" begin={`${delai}s`} repeatCount="indefinite" />
    </path>
    <animateTransform attributeName="transform" type="translate" additive="sum" from="0 0" to="0 -24" dur="2.6s" begin={`${delai}s`} repeatCount="indefinite" />
    <animate attributeName="opacity" values="0.95;0.95;0" keyTimes="0;0.7;1" dur="2.6s" begin={`${delai}s`} repeatCount="indefinite" />
  </g>);
}

// Prise électrique d'où part W : halo jaune pulsant + petits éclairs qui clignotent
// (l'énergie électrique arrive par à-coups visibles).
function Prise({ x, y }) {
  const eclair = (dx, dy, s, del) => (<path key={`${dx}_${dy}`}
    d={`M ${x + dx} ${y + dy} l ${2.2 * s} ${-4 * s} l ${-1.4 * s} 0 l ${2.2 * s} ${-4 * s} l ${-1.2 * s} 0 l ${1.8 * s} ${-3.5 * s}`}
    stroke="#f59e0b" strokeWidth={1.4 * s} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.25;0.5;1" dur="1.6s" begin={`${del}s`} repeatCount="indefinite" />
  </path>);
  return (<g>
    <circle cx={x} cy={y} r="15" fill="#fde047" opacity="0.2">
      <animate attributeName="opacity" values="0.15;0.85;0.15" dur="1.6s" repeatCount="indefinite" />
    </circle>
    {eclair(-13, -4, 1, 0)}
    {eclair(11, 2, 0.8, 0.55)}
    {eclair(-9, 9, 0.9, 1.05)}
    <rect x={x - 5.5} y={y - 5} width="11" height="11" rx="2.5" fill="#7e22ce" />
    <rect x={x - 4} y={y - 11} width="2.6" height="7" rx="1.2" fill="#7e22ce" />
    <rect x={x + 1.4} y={y - 11} width="2.6" height="7" rx="1.2" fill="#7e22ce" />
  </g>);
}

// Fiches des organes, affichées au survol (ou au clic) : reformulation libre du
// cours sur les machines thermiques (aucune reprise mot pour mot).
const FICHES = {
  evaporateur: { titre: 'Évaporateur', texte: 'Échangeur thermique au contact de la source froide. Le fluide y bout : il passe de l\'état liquide à l\'état vapeur et capte ainsi l\'énergie de la source froide. C\'est possible parce que sa température d\'ébullition est très inférieure à la température de la source froide. C\'est ici que la machine « pompe » la chaleur.' },
  compresseur: { titre: 'Compresseur', texte: 'Alimenté en électricité, il aspire la vapeur à basse pression et la comprime : pression et température augmentent. La compression est si rapide qu\'elle est quasi adiabatique : le premier principe s\'écrit ΔU = W_p, tout le travail reçu sert à chauffer la vapeur.' },
  condenseur: { titre: 'Condenseur', texte: 'Échangeur thermique au contact de la source chaude. Le fluide s\'y condense (vapeur → liquide) et cède l\'énergie libérée à la source chaude : chauffage de l\'eau du bassin ou rejet vers la pièce. C\'est la sortie « utile » d\'une PAC.' },
  detendeur: { titre: 'Détendeur', texte: 'Organe qui abaisse fortement la pression du liquide (et sa température avec), pour qu\'il puisse bouillir à nouveau dans l\'évaporateur. Il ne consomme ni ne fournit d\'énergie utile.' },
};

function Schema({ machine, b, tc, tf, organeActif = null, montrerEnergies = true }) {
  const [vueSimple, setVueSimple] = useState(false);
  const [organeInfo, setOrganeInfo] = useState(null);   // survol / clic d'un organe
  const m = MACHINES[machine];
  const cedee = b.qChaude;   // kW cédés à la source chaude (condenseur)
  const captee = b.qFroide;  // kW captés à la source froide (évaporateur)
  const organes = {
    evaporateur: { x: 50, y: 151, label: 'Évaporateur', sous: 'le fluide s\'évapore et capte l\'énergie de la source froide' },
    compresseur: { x: 172, y: 93, label: 'Compresseur', sous: 'il comprime la vapeur : pression et température augmentent' },
    condenseur: { x: 294, y: 151, label: 'Condenseur', sous: 'le fluide se condense et cède l\'énergie à la source chaude' },
    detendeur: { x: 172, y: 209, label: 'Détendeur', sous: 'il abaisse la pression du liquide' },
  };
  const act = id => ({
    stroke: organeActif === id ? ORANGE_GUIDE : KIT.bord,
    strokeWidth: organeActif === id ? 3 : 1.5,
    fill: organeActif === id ? '#fff7ed' : 'white',
  });
  return (
    <div style={{ ...styleBoite, padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <button onClick={() => setVueSimple(v => !v)}
          style={stylePetitBouton(true, '#0284c7')}>{vueSimple ? 'Vue détaillée' : 'Vue simplifiée'}</button>
      </div>
      <svg viewBox="0 0 420 330" style={{ width: '100%', maxWidth: 640 }} role="img"
        aria-label={`Schéma de la ${machine === 'pac' ? 'pompe à chaleur' : 'machine frigorifique'} : ${vueSimple ? 'diagramme de bilan de la machine thermique réceptrice' : 'circuit du fluide entre l\'évaporateur, le compresseur, le condenseur et le détendeur, avec les deux sources'}.`}>
        <defs>
          <marker id="fle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
        </defs>
        {vueSimple ? (<>
          {/* Vue simplifiée : le diagramme de bilan du cours */}
          <circle cx="80" cy="170" r="54" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
          <text x="80" y="150" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d4ed8">Source froide</text>
          <text x="80" y="164" textAnchor="middle" fontSize="10" fill="#1d4ed8">{m.sourceFroide}</text>
          <text x="80" y="178" textAnchor="middle" fontSize="10" fill="#1d4ed8">{fmt(tf, 0)} °C</text>
          <circle cx="340" cy="170" r="54" fill="#fee2e2" stroke="#fca5a5" strokeWidth="2" />
          <text x="340" y="150" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b91c1c">Source chaude</text>
          <text x="340" y="164" textAnchor="middle" fontSize="10" fill="#b91c1c">{m.sourceChaude}</text>
          <text x="340" y="178" textAnchor="middle" fontSize="10" fill="#b91c1c">{fmt(tc, 0)} °C</text>
          <rect x="150" y="128" width="120" height="84" rx="16" fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
          <text x="210" y="162" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#15803d">Machine thermique</text>
          <text x="210" y="177" textAnchor="middle" fontSize="10.5" fill="#15803d">réceptrice</text>
          <text x="210" y="191" textAnchor="middle" fontSize="10" fill="#15803d">(fluide frigorigène)</text>
          {montrerEnergies && <>
            <Fleche x1={134} y1={170} x2={150} y2={170} c="#2563eb" ep={eEpaiss(captee)} />
            <text x="138" y="152" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d4ed8">Q<tspan dy="3" fontSize="8">f</tspan></text>
            <text x="138" y="192" textAnchor="middle" fontSize="10" fill="#1d4ed8">{fmt(captee, 1)} kW</text>
            <Fleche x1={270} y1={170} x2={286} y2={170} c="#dc2626" ep={eEpaiss(cedee)} />
            <text x="278" y="152" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b91c1c">Q<tspan dy="3" fontSize="8">c</tspan></text>
            <text x="278" y="192" textAnchor="middle" fontSize="10" fill="#b91c1c">{fmt(cedee, 1)} kW</text>
            <Prise x={210} y={30} /><Fleche x1={210} y1={44} x2={210} y2={128} c="#9333ea" ep={eEpaiss(b.wElec)} />
            <text x="222" y="70" fontSize="11" fontWeight="700" fill="#7e22ce">W = {fmt(b.wElec, 1)} kW</text>
          </>}
          <text x="210" y="308" textAnchor="middle" fontSize="11.5" fill={KIT.txt2}>Bilan du cycle : ΔU = W + Q<tspan dy="3" fontSize="8.5">c</tspan><tspan dy="-3"> + Q</tspan><tspan dy="3" fontSize="8.5">f</tspan><tspan dy="-3"> = 0 (reçu positif, cédé négatif)</tspan></text>
        </>) : (<>
          {/* Vue détaillée : zones sources animées + boucle du circuit */}
          <rect x="8" y="64" width="120" height="226" rx="12" fill="#dbeafe" stroke="#93c5fd" />
          <Flocon x={24} y={250} s={13} delai={0} /><Flocon x={56} y={260} s={10} delai={-1.2} />
          <Flocon x={90} y={255} s={12} delai={-2.1} /><Flocon x={108} y={262} s={9} delai={-0.6} />
          <Flocon x={38} y={268} s={8} delai={-1.8} /><Flocon x={72} y={240} s={9} delai={-2.8} />
          <text x="68" y="84" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d4ed8">Source froide</text>
          <text x="68" y="98" textAnchor="middle" fontSize="10" fill="#1d4ed8">{m.sourceFroide} · {fmt(tf, 0)} °C</text>
          <rect x="292" y="64" width="120" height="226" rx="12" fill="#fee2e2" stroke="#fca5a5" />
          <Onde x={312} y={262} delai={0} /><Onde x={346} y={266} delai={0.4} />
          <Onde x={380} y={258} delai={0.8} /><Onde x={330} y={236} delai={0.2} />
          <text x="352" y="84" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b91c1c">Source chaude</text>
          <text x="352" y="98" textAnchor="middle" fontSize="10" fill="#b91c1c">{m.sourceChaude} · {fmt(tc, 0)} °C</text>
          <rect x="88" y="112" width="244" height="116" rx="26" fill="none" stroke="#94a3b8" strokeWidth="6" />
          <path d="M 88 150 V 128" stroke="#94a3b8" strokeWidth="6" fill="none" markerEnd="url(#fle)" />
          <path d="M 150 112 H 180" stroke="#94a3b8" strokeWidth="6" fill="none" markerEnd="url(#fle)" />
          <path d="M 332 190 V 212" stroke="#94a3b8" strokeWidth="6" fill="none" markerEnd="url(#fle)" />
          <path d="M 270 228 H 240" stroke="#94a3b8" strokeWidth="6" fill="none" markerEnd="url(#fle)" />
          {Object.entries(organes).map(([id, o]) => (
            <g key={id} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setOrganeInfo(id)} onMouseLeave={() => setOrganeInfo(null)}
              onClick={() => setOrganeInfo(info => info === id ? null : id)}>
              <rect x={o.x} y={o.y} width="76" height="38" rx="8" {...act(id)}
                strokeWidth={organeActif === id || organeInfo === id ? 3 : 1.5} />
              <text x={o.x + 38} y={o.y + 23} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={KIT.txt}>{o.label}</text>
            </g>
          ))}
          {organeInfo && (
            <text x="210" y="300" textAnchor="middle" fontSize="11" fill={ORANGE_GUIDE} fontWeight="700">
              ℹ {FICHES[organeInfo].titre} — voir la fiche sous le schéma
            </text>
          )}
          {montrerEnergies && <>
            <Fleche x1={14} y1={170} x2={46} y2={170} c="#2563eb" ep={eEpaiss(captee)} />
            <text x="6" y="146" textAnchor="start" fontSize="10.5" fontWeight="700" fill="#1d4ed8">capte {fmt(captee, 1)} kW</text>
            <Fleche x1={374} y1={170} x2={406} y2={170} c="#dc2626" ep={eEpaiss(cedee)} />
            <text x="414" y="146" textAnchor="end" fontSize="10.5" fontWeight="700" fill="#b91c1c">cède {fmt(cedee, 1)} kW</text>
            <Prise x={210} y={36} /><Fleche x1={210} y1={52} x2={210} y2={90} c="#9333ea" ep={eEpaiss(b.wElec)} />
            <text x="222" y="72" fontSize="10.5" fontWeight="700" fill="#7e22ce">W = {fmt(b.wElec, 1)} kW</text>
          </>}
          {organeActif && organes[organeActif] && (
            <text x="210" y="312" textAnchor="middle" fontSize="12" fontWeight="700" fill={ORANGE_GUIDE}>{organes[organeActif].sous}</text>
          )}
        </>)}
      </svg>
      {/* Fiche de l'organe survolé ou cliqué (reformulation du cours) */}
      {organeInfo && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>ℹ {FICHES[organeInfo].titre}</div>
          <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.55 }}>{avecIndices(FICHES[organeInfo].texte)}</div>
        </div>
      )}
    </div>
  );
}

// ── Vue : courbe COP en fonction de la température de la source froide ─────
function CourbeCop({ machine, tc, tfCourant, wElec }) {
  const tfs = Array.from({ length: 21 }, (_, i) => machine === 'pac' ? -5 + i : -8 + Math.round(i * 0.8));
  const pts = tfs.filter(t => tc - t >= 5).map(t => [t, copReel(machine, tc, t)]);
  const W = 340, H = 190, m = 34;
  const x = t => m + (t - pts[0][0]) / (pts[pts.length - 1][0] - pts[0][0]) * (W - 2 * m);
  const yCop = [...pts.map(p => p[1]), copReel(machine, tc, tfCourant)];
  const yMax = Math.max(...yCop) * 1.1;
  const y = c => H - m - (c / yMax) * (H - 2 * m);
  const chemin = pts.map((p, i) => `${i ? 'L' : 'M'} ${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(' ');
  return (
    <div style={styleBoite}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>
        COP « constructeur » en fonction de la température de la source froide (T<sub>c</sub> = {tc} °C)
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 560 }} role="img"
        aria-label="Courbe du COP en fonction de la température de la source froide : le COP diminue quand la source froide est plus froide.">
        <line x1={m} y1={H - m} x2={W - m / 2} y2={H - m} stroke={KIT.bord} />
        <line x1={m} y1={m / 2} x2={m} y2={H - m} stroke={KIT.bord} />
        {[0, 0.25, 0.5, 0.75, 1].map(f => <text key={f} x={m - 6} y={y(yMax * f) + 4} fontSize="9.5" textAnchor="end" fill={KIT.txt2}>{fmt(yMax * f, 0)}</text>)}
        <path d={chemin} fill="none" stroke="#0284c7" strokeWidth="2.5" />
        {pts.filter((_, i) => i % 4 === 0).map(p => <text key={p[0]} x={x(p[0])} y={H - m + 13} fontSize="9.5" textAnchor="middle" fill={KIT.txt2}>{p[0]} °C</text>)}
        {tc - tfCourant >= 5 && <>
          <line x1={x(tfCourant)} y1={m / 2} x2={x(tfCourant)} y2={y(copReel(machine, tc, tfCourant))} stroke={ORANGE_GUIDE} strokeDasharray="4 3" />
          <circle cx={x(tfCourant)} cy={y(copReel(machine, tc, tfCourant))} r="5" fill={ORANGE_GUIDE} />
          <text x={x(tfCourant)} y={y(copReel(machine, tc, tfCourant)) - 9} fontSize="10.5" textAnchor="middle" fill={KIT.txt} fontWeight="700">COP = {fmt(copReel(machine, tc, tfCourant), 1)}</text>
        </>}
      </svg>
    </div>
  );
}

// ── Panneau de commande (exploration) ───────────────────────────────────────
function Commandes({ machine, tc, tf, w, set }) {
  const p = MACHINES[machine].plaques;
  const rang = (label, val, min, max, pas, cle) => (
    <div key={cle} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: KIT.txt }}>
      <label style={{ width: 150 }}>{label}</label>
      <input type="range" min={min} max={max} step={pas} value={val} aria-label={label}
        onChange={e => set(cle, parseFloat(e.target.value))} style={{ flex: 1 }} />
      <strong style={{ width: 62, textAlign: 'right' }}>{fmt(val, val % 1 ? 1 : 0)} {cle === 'w' ? 'kW' : '°C'}</strong>
    </div>
  );
  return (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {['pac', 'frigo'].map(k => (
          <button key={k} onClick={() => set('machine', k)} style={stylePetitBouton(machine === k, k === 'pac' ? '#dc2626' : '#0284c7')}>
            {k === 'pac' ? '♨ Pompe à chaleur' : '❄ Machine frigorifique'}
          </button>
        ))}
      </div>
      {rang(avecIndices('Température source chaude T_c'), tc, p.tc[0], p.tc[1], p.tc[2], 'tc')}
      {rang(avecIndices('Température source froide T_f'), tf, p.tf[0], p.tf[1], p.tf[2], 'tf')}
      {rang('Puissance électrique du compresseur', w, p.w[0], p.w[1], p.w[2], 'w')}
      {tc - tf < 5 && <div style={{ fontSize: 13, color: '#b45309', marginTop: 6 }}>{avecIndices('Écart T_c − T_f trop faible : un écart d\'au moins 5 °C est nécessaire.')}</div>}
    </div>
  );
}

// ── Étapes du parcours guidé ────────────────────────────────────────────────
// Règles respectées : chaque tâche a un indice ; les valeurs déjà calculées sont
// redonnées dans l'énoncé ; les capacités du programme sont citées mot pour mot
// sur les étapes-clés ; la réponse n'est jamais affichée avant d'être calculée
// (masquage des transferts d'énergie jusqu'à l'étape du bilan).
function etapesGuide() {
  return [
    { titre: 'Une machine à un fluide qui tourne en boucle', texte: <>Un élevage de truites doit garder l'eau de ses bassins à {G.tc} °C, même quand l'air extérieur est à {G.tf} °C. Une pompe à chaleur (PAC) chauffe cette eau. À l'intérieur, un fluide frigorigène circule dans un circuit fermé : il sort toujours dans le même état qu'il est entré, après avoir traversé quatre organes.</>,
      organe: null, montreEnergies: false,
      tache: { type: 'qcm', q: 'Pourquoi dit-on que le fonctionnement de cette machine est « cyclique » ?',
        options: ['Le fluide revient à son état initial après chaque tour du circuit', 'La machine chauffe par à-coups', 'Le circuit est ouvert sur l\'eau du bassin'], bonne: 0,
        indice: 'Suivez mentalement le fluide : il part de l\'évaporateur et finit par y revenir. Que peut-on dire de son état à ce moment-là ?', } },

    { titre: 'Les deux sources', texte: <>La machine échange de l'énergie avec deux « sources » : l'eau du bassin (à {G.tc} °C) et l'air extérieur (à {G.tf} °C). On les distingue par leur température.</>,
      organe: null, montreEnergies: false,
      tache: { type: 'qcm', q: 'Quelle est la source chaude de cette PAC, et quelle est la source froide ?',
        options: [`Source chaude : l'eau du bassin à ${G.tc} °C ; source froide : l'air extérieur à ${G.tf} °C`, `Source chaude : l'air extérieur à ${G.tf} °C ; source froide : l'eau du bassin à ${G.tc} °C`, 'Les deux sources ont la même température'], bonne: 0,
        indice: '« Chaude » et « froide » sont relatifs : comparez les deux températures.', } },

    { titre: 'Le sens spontané d\'un transfert thermique', texte: <>L'énergie thermique passe <strong>spontanément</strong> de la source chaude vers la source froide, jamais l'inverse : c'est le second principe de la thermodynamique. Or la PAC doit justement prendre de l'énergie à l'air froid pour la donner à l'eau du bassin.</>,
      organe: null, montreEnergies: false,
      tache: { type: 'qcm', q: 'Comment la PAC réussit-elle à transférer de l\'énergie de l\'air froid vers l\'eau tiède ?',
        options: ['Le compresseur fournit du travail au fluide : ce travail rend le transfert possible', 'L\'eau du bassin se refroidit pour chauffer l\'air', 'Le fluide frigorigène descend tout seul vers le froid'], bonne: 0,
        indice: 'Un transfert thermique « à contre-sens » n\'est pas spontané : il faut payer quelque chose. Qu\'est-ce qui consomme de l\'électricité dans la machine ?', } },

    { titre: 'L\'évaporateur : pomper la chaleur', texte: <>Dans l'évaporateur, au contact de la source froide, le fluide passe de l'état liquide à l'état vapeur : il s'évapore, et ce changement d'état capte de l'énergie à l'air extérieur. C'est pour cela qu'on dit que la machine « pompe » la chaleur.</>,
      organe: 'evaporateur', montreEnergies: false,
      tache: { type: 'qcm', q: 'Pourquoi le fluide s\'évapore-t-il à l\'air extérieur, dont la température est pourtant basse ?',
        options: ['Sa température d\'ébullition est très inférieure à celle de l\'air extérieur', 'L\'air extérieur est très chaud', 'Le fluide est chauffé par une résistance électrique'], bonne: 0,
        indice: 'Un liquide bout quand sa température atteint sa température d\'ébullition. Où doit se situer la température d\'ébullition du fluide pour qu\'il boue à l\'air extérieur ?', } },

    { titre: 'Le compresseur : élever pression et température', texte: <>La vapeur arrive à basse pression dans le compresseur. Celui-ci, alimenté en électricité, la comprime : pression et température augmentent. La compression est si rapide que le fluide n'a pas le temps d'échanger de la chaleur avec l'extérieur pendant cette étape.</>,
      organe: 'compresseur', montreEnergies: false,
      tache: { type: 'qcm', q: 'Que reçoit le fluide lors de la compression ?',
        options: ['Du travail du compresseur, et rien d\'autre (pas de transfert thermique pendant la compression)', 'Un transfert thermique venant de l\'air extérieur', 'Rien : sa température augmente spontanément'], bonne: 0,
        indice: 'La compression est très rapide : aucun échange thermique n\'a le temps de se faire. Le seul transfert d\'énergie est celui du compresseur.', } },

    { titre: 'Le condenseur : céder l\'énergie utile', texte: <>Chaude et sous haute pression, la vapeur entre dans le condenseur, au contact de l'eau du bassin. Elle se condense (vapeur → liquide) et cède son énergie à cette eau : c'est l'énergie utile de la machine, celle qui chauffe le bassin.</>,
      organe: 'condenseur', montreEnergies: false,
      tache: { type: 'qcm', q: 'Dans le condenseur, le fluide…',
        options: ['passe de l\'état vapeur à l\'état liquide en cédant de l\'énergie à l\'eau du bassin', 's\'évapore en captant l\'énergie de l\'eau du bassin', 'est comprimé par le compresseur'], bonne: 0,
        indice: '« Condenseur » et « se condense » : le changement d\'état va de la vapeur vers le liquide. Que devient l\'énergie libérée par ce changement d\'état ?', } },

    { titre: 'Le détendeur : revenir au point de départ', texte: <>Le liquide, encore sous haute pression, traverse le détendeur : sa pression chute, sa température aussi. Il redevient capable de s'évaporer à la température de l'air extérieur : le cycle peut recommencer.</>,
      organe: 'detendeur', montreEnergies: false,
      tache: { type: 'qcm', q: 'À la sortie du détendeur, dans quel état et à quelle pression se trouve le fluide ?',
        options: ['Liquide, à basse pression, prêt à s\'évaporer dans l\'évaporateur', 'Vapeur, à haute pression', 'Liquide, à haute pression'], bonne: 0,
        indice: 'Le cycle doit se refermer : le fluide doit retrouver les conditions de la première étape (celle de l\'évaporateur).', } },

    { titre: 'Bilan d\'un cycle : l\'énergie se conserve', texte: <>Sur un cycle complet, le fluide revient à son état initial : son énergie interne ne change pas, donc ΔU = 0. Le premier principe, ΔU = W + Q, s'écrit alors W + Q_c + Q_f = 0. La PAC fonctionne ici avec une puissance électrique W = {fmt(G.w, 1)} kW, et capte une puissance thermique Q_f = {fmt(GP.qChaude - G.w, 1)} kW à l'air extérieur.</>,
      organe: null, montreEnergies: false,
      tache: { type: 'num', q: 'Puissance thermique Q_c cédée à l\'eau du bassin', unite: 'kW', vrai: GP.qChaude, tol: 0.02, affiche: x => fmt(x, 1), cs: 3, detail: true,
        calcul: () => [`Premier principe sur un cycle : ΔU = W + Q_c + Q_f = 0, donc Q_c = −(W + Q_f).`,
          `En valeurs positives (grandeurs cédées/reçues) : Q_c = Q_f + W.`,
          `Données : Q_f = ${fmt(GP.qChaude - G.w, 1)} kW et W = ${fmt(G.w, 1)} kW.`,
          `Q_c = ${fmt(GP.qChaude - G.w, 1)} + ${fmt(G.w, 1)} = ${fmt(GP.qChaude, 1)} kW.`],
        pieges: [[GP.qChaude - G.w, 'Vous avez oublié d\'ajouter le travail du compresseur : l\'énergie cédée à la source chaude vient de la source froide ET du compresseur (Q_c = Q_f + W).'],
          [GP.qChaude + G.w, 'Vous avez ajouté W au lieu de Q_f : partez de Q_c = Q_f + W avec Q_f = ' + fmt(GP.qChaude - G.w, 1) + ' kW.']],
        indice: 'Sur un cycle, rien ne se perd : ce que la machine cède à l\'eau du bassin vient de l\'air extérieur et du compresseur. Additionnez les deux.',
        expl: <>Q_c = Q_f + W = {fmt(GP.qChaude - G.w, 1)} + {fmt(G.w, 1)} = <strong>{fmt(GP.qChaude, 1)} kW</strong>.</> } },

    { titre: 'La convention algébrique des signes', texte: <>Sur le schéma, les puissances sont positives, avec leur sens indiqué par une flèche. Mais pour écrire proprement le bilan, on utilise la convention du système : <strong>reçu positif, cédé négatif</strong>. Reprenez les trois transferts de la PAC (vers le fluide frigorigène).</>,
      organe: null, montreEnergies: true,
      tache: { type: 'qcm', q: 'Avec la convention « reçu positif, cédé négatif », quels sont les signes de W, Q_c et Q_f (fluide frigorigène) ?',
        options: ['W > 0, Q_c < 0, Q_f > 0', 'W > 0, Q_c > 0, Q_f < 0', 'W < 0, Q_c > 0, Q_f > 0'], bonne: 0,
        indice: 'Le compresseur donne du travail au fluide. Le fluide cède de l\'énergie à l\'eau du bassin (condenseur) et en reçoit de l\'air extérieur (évaporateur).', } },

    { titre: 'Le COP : la performance de la machine', texte: <>Le coefficient de performance (COP) compare l'énergie utile à l'énergie payée : pour une PAC, COP = Q_c / W_elec. Le fabricant annonce un COP de {fmt(GP.cop, 1)} pour la PAC du bassin, et la puissance électrique du compresseur est W = {fmt(G.w, 1)} kW.</>,
      organe: null, montreEnergies: true,
      tache: { type: 'num', q: `Puissance thermique utile Q_c de la PAC (COP = ${fmt(GP.cop, 1)})`, unite: 'kW', vrai: GP.cop * G.w, tol: 0.02, affiche: x => fmt(x, 1), cs: 3, detail: true,
        calcul: () => [`Définition : COP = Q_c / W_elec, donc Q_c = COP × W_elec.`,
          `Données : COP = ${fmt(GP.cop, 1)} et W_elec = ${fmt(G.w, 1)} kW.`,
          `Q_c = ${fmt(GP.cop, 1)} × ${fmt(G.w, 1)} = ${fmt(GP.cop * G.w, 1)} kW.`],
        pieges: [[GP.cop * G.w * 10, 'Facteur 10 : vérifiez les unités et la formule (Q_c = COP × W, pas une division).'],
          [G.w / GP.cop, 'Vous avez divisé au lieu de multiplier : le COP est un multiplicateur, la machine restitue plus qu\'elle ne consomme.']],
        indice: 'Le COP dit combien de kW utiles on obtient pour 1 kW électrique consommé. Multipliez le COP par la puissance consommée.',
        expl: <>Q_c = COP × W = {fmt(GP.cop, 1)} × {fmt(G.w, 1)} = <strong>{fmt(GP.cop * G.w, 1)} kW</strong>.</> } },

    { titre: 'Et une machine qui fabrique du froid ?', texte: <>Dans un laboratoire, une chambre froide stocke des échantillons à {F.tf} °C dans une pièce à {F.tc} °C. Même circuit, mêmes organes, même compresseur : seule change l'énergie utile, ici l'énergie captée à l'intérieur de la chambre. On parle de machine frigorifique. Son coefficient de performance (parfois appelé EER) vaut COP = Q_f / W_elec = {fmt(GF.qFroide / F.w, 1)} pour W = {fmt(F.w, 1)} kW.</>,
      organe: null, montreEnergies: true, machine: 'frigo',
      tache: { type: 'num', q: 'Puissance thermique Q_f captée dans la chambre froide', unite: 'kW', vrai: GF.qFroide, tol: 0.02, affiche: x => fmt(x, 1), cs: 3, detail: true,
        calcul: () => [`Pour une machine frigorifique : COP = Q_f / W_elec, donc Q_f = COP × W_elec.`,
          `Données : COP = ${fmt(GF.qFroide / F.w, 1)} et W_elec = ${fmt(F.w, 1)} kW.`,
          `Q_f = ${fmt(GF.qFroide / F.w, 1)} × ${fmt(F.w, 1)} = ${fmt(GF.qFroide, 1)} kW.`],
        indice: 'Même raisonnement que la PAC, mais l\'énergie utile est celle prise à la source froide (la chambre).',
        expl: <>Q_f = COP × W = <strong>{fmt(GF.qFroide, 1)} kW</strong>.</> } },

    { titre: 'L\'écart de température commande le COP', texte: <>Faites varier la température de la source froide en exploration libre : plus elle est proche de la source chaude, plus le COP est élevé. C'est pour cela qu'une PAC « surdimensionne » quand il fait doux, et décroche quand il gèle.</>,
      organe: null, montreEnergies: true,
      tache: { type: 'qcm', q: `Pour un même T_c = ${G.tc} °C, comment évolue le COP quand la température de la source froide augmente ?`,
        options: ['Le COP augmente : l\'écart entre sources diminue', 'Le COP diminue : la source froide apporte moins d\'énergie', 'Le COP ne change pas'], bonne: 0,
        indice: 'Regardez la courbe : le COP monte ou descend quand on se rapproche de T_c ?', } },

    { titre: 'La limite théorique : efficacité thermodynamique', texte: <>Le COP d'une machine réelle ne peut pas dépasser une limite théorique, calculée avec les températures exprimées <strong>en kelvins</strong> : pour une PAC, COP_max = T_c / (T_c − T_f). Pour la PAC du bassin (T_c = {G.tc} °C, T_f = {G.tf} °C), la machine réelle est très en dessous de cette limite.</>,
      organe: null, montreEnergies: true,
      tache: { type: 'num', q: 'Efficacité thermodynamique maximale de la PAC du bassin (en kelvins !)', unite: '', vrai: GMAX, tol: 0.02, affiche: x => fmt(x, 1), cs: 3, detail: true,
        calcul: () => [`Formule : COP_max = T_c / (T_c − T_f), températures en kelvins.`,
          `Conversion : T_c = ${G.tc} + 273,15 = ${fmt(K(G.tc), 2)} K ; T_f = ${G.tf} + 273,15 = ${fmt(K(G.tf), 2)} K.`,
          `Écart : T_c − T_f = ${fmt(K(G.tc), 2)} − ${fmt(K(G.tf), 2)} = ${G.tc - G.tf} K (le même écart qu'en °C).`,
          `COP_max = ${fmt(K(G.tc), 2)} / ${G.tc - G.tf} ≈ ${fmt(GMAX, 1)}.`],
        pieges: [[G.tc / (G.tc - G.tf), 'Vous avez laissé les températures en degrés Celsius : la formule exige des kelvins. Ajoutez 273,15 à chaque température.'],
          [GF.cop, 'Vous avez confondu COP réel (mesuré, annoncé par le fabricant) et efficacité thermodynamique maximale (limite théorique en kelvins).']],
        indice: 'Deux conversions à ne pas oublier : T(K) = T(°C) + 273,15, à faire AVANT le calcul. L\'écart T_c − T_f, lui, est le même dans les deux unités.',
        expl: <>COP_max = {fmt(K(G.tc), 2)} / {G.tc - G.tf} ≈ <strong>{fmt(GMAX, 1)}</strong>, alors que le COP réel vaut {fmt(GP.cop, 1)}.</> } },

    { titre: 'COP réel contre limite théorique', texte: <>Le COP réel de la PAC du bassin vaut {fmt(GP.cop, 1)}, très loin sous la limite théorique de {fmt(GMAX, 1)} : frottements, pertes thermiques, compresseur imparfait. La limite n'est pas un objectif, c'est un plafond.</>,
      organe: null, montreEnergies: true,
      tache: { type: 'qcm', q: 'Que peut-on affirmer à propos du COP d\'une machine thermique réelle ?',
        options: [`Il est toujours strictement inférieur à l'efficacité thermodynamique maximale`, 'Il peut dépasser la limite théorique si la machine est bien réglée', 'Il est égal à la limite théorique pour une machine industrielle'], bonne: 0,
        indice: 'La limite théorique suppose une machine parfaite, sans aucune perte. Une machine réelle a-t-elle des pertes ?', } },

    { titre: 'Sur quoi repose ce modèle ?', texte: <>Avant de conclure, vérifions les hypothèses du modèle utilisé dans la simulation.</>,
      organe: null, montreEnergies: true,
      tache: { type: 'qcm', q: 'Quelle hypothèse est indispensable pour écrire ΔU = W + Q_c + Q_f = 0 sur un cycle ?',
        options: ['Le fluide revient exactement dans son état initial à la fin de chaque cycle', 'Le compresseur ne consomme aucune énergie', 'Les deux sources ont la même température'], bonne: 0,
        indice: 'ΔU compare l\'énergie interne du fluide entre le début et la fin du cycle. Que faut-il pour qu\'elle soit nulle ?', } },

    { titre: 'Bravo !', texte: <>Vous savez décrire les quatre organes, faire le bilan d'un cycle et calculer un COP. Passez en exploration libre pour faire varier les températures des deux sources, puis tentez le défi !</>,
      organe: null, montreEnergies: true, sansTache: true },
  ];
}

// ── Défi (tirage propre : valeurs tirées parmi des ensembles exacts) ────────
// Toutes les données affichées sont exactement celles du corrigé (températures
// entières, W multiple de 0,5 kW, COP « constructeur » arrondi au dixième et
// utilisé tel quel par le corrigé). Tolérance de 5 % sur les questions numériques :
// le pire cas d'arrondi à 2 chiffres significatifs d'une réponse juste atteint 4,8 %
// (calculé sur les 900 tirages possibles) ; à 3 chiffres il reste sous 0,5 %.
const tireDefi = () => {
  const machine = Math.random() < 0.5 ? 'pac' : 'frigo';
  const tc = machine === 'pac' ? 20 + 2 * Math.floor(Math.random() * 6)   // 20 à 30 °C
    : 19 + Math.floor(Math.random() * 6);                                  // 19 à 24 °C
  const tf = machine === 'pac' ? -4 + Math.floor(Math.random() * 18)       // -4 à 13 °C
    : -6 + Math.floor(Math.random() * 12);                                 // -6 à 5 °C
  const tcS = machine === 'pac' ? (tc - tf >= 8 ? tc : tc + 8) : tc;        // écart garanti ≥ 8 °C
  const w = 0.5 * (2 + Math.floor(Math.random() * 5));                      // 1,0 à 3,0 kW
  return { machine, tc: tcS, tf, w };
};

function questionsDefi(d) {
  const m = MACHINES[d.machine];
  const cop = copReel(d.machine, d.tc, d.tf);
  const copTheorique = copMax(d.machine, d.tc, d.tf);
  const qUtile = Math.round(cop * d.w * 10) / 10;   // arrondi au dixième : affiché = corrigé
  const qAutre = Math.round((qUtile - d.w) * 10) / 10;
  const utileEstChaude = d.machine === 'pac';
  const num = (id, q, unite, vrai, detail, piege) => ({ id, type: 'num', q, unite, vrai, tol: 0.05, affiche: x => fmt(x, 2), detail, pieges: piege || [] });
  return [
    { id: 'src', type: 'qcm', q: `Quelle est la source chaude de cette machine, et quelle est la source froide ?`,
      options: [`Source chaude : ${m.sourceChaude} à ${d.tc} °C ; source froide : ${m.sourceFroide} à ${d.tf} °C`,
        `Source chaude : ${m.sourceFroide} à ${d.tf} °C ; source froide : ${m.sourceChaude} à ${d.tc} °C`,
        'On ne peut pas savoir sans mesurer les puissances'], bonne: 0 },
    num('utile', utileEstChaude
      ? `Puissance thermique utile Q_c reçue par la source chaude (le fabricant annonce un COP de ${fmt(cop, 1)})`
      : `Puissance thermique utile Q_f reçue par la source froide (le fabricant annonce un COP de ${fmt(cop, 1)})`,
      'kW', qUtile, `Q_utile = COP × W = ${fmt(cop, 1)} × ${fmt(d.w, 1)} = ${fmt(qUtile, 1)} kW`,
      [[d.w, 'Vous avez répondu la puissance électrique : l\'énergie utile vaut COP × W, elle est plus grande que W.']]),
    num('autre', utileEstChaude
      ? `Puissance thermique Q_f captée à la source froide (premier principe sur un cycle)`
      : `Puissance thermique Q_c cédée à la source chaude (premier principe sur un cycle)`,
      'kW', utileEstChaude ? qAutre : Math.round((qUtile + d.w) * 10) / 10,
      utileEstChaude ? `Q_f = Q_c − W = ${fmt(qUtile, 1)} − ${fmt(d.w, 1)} = ${fmt(qAutre, 1)} kW`
        : `Q_c = Q_f + W = ${fmt(qUtile, 1)} + ${fmt(d.w, 1)} = ${fmt(qUtile + d.w, 1)} kW`,
      [[qUtile + d.w, utileEstChaude ? 'Vous avez ajouté W : pour une PAC, la source froide fournit l\'énergie moins celle du compresseur (Q_f = Q_c − W).' : 'Vérifiez le sens du bilan : Q_c = Q_f + W.']]),
    num('max', `Efficacité thermodynamique maximale de cette machine (températures en kelvins)`, '', copTheorique,
      `COP_max = ${utileEstChaude ? `T_c/(T_c − T_f) = ${fmt(K(d.tc), 2)}/${d.tc - d.tf}` : `T_f/(T_c − T_f) = ${fmt(K(d.tf), 2)}/${d.tc - d.tf}`} ≈ ${fmt(copTheorique, 1)}`,
      [[utileEstChaude ? d.tc / (d.tc - d.tf) : d.tf / (d.tc - d.tf), 'Vous avez laissé les températures en °C : ajoutez 273,15 avant de calculer.']]),
    { id: 'compar', type: 'qcm', q: `Le COP réel (${fmt(cop, 1)}) et l'efficacité thermodynamique maximale (${fmt(copTheorique, 1)}) sont différents. Pourquoi ?`,
      options: ['La machine réelle subit des pertes : elle n\'atteint qu\'une fraction de la limite théorique', 'Le fabricant a mal mesuré son COP', 'La limite théorique est fausse : on peut la dépasser'], bonne: 0 },
  ];
}

// ── Hypothèses de travail ───────────────────────────────────────────────────
const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
    <li><strong>Machine idéalisée</strong> : le rendement global de la machine (fraction du maximum théorique atteinte) est supposé constant ({ETA_PAC} pour la PAC, {ETA_FRIGO} pour le groupe froid). En réalité il varie avec les conditions de fonctionnement et la technologie du compresseur.</li>
    <li><strong>Cycle parfait</strong> : le fluide revient exactement à son état initial ; les pertes de charge dans les tuyaux et l'échange thermique parasite avec l'air de la pièce sont négligés.</li>
    <li><strong>Régime permanent</strong> : les puissances affichées sont constantes ; on néglige les phases de démarrage (dégivrage d'une PAC par grand froid, par exemple).</li>
    <li><strong>Sources de température constante</strong> : le bassin et la chambre froide sont supposés maintenir leur température pendant que la machine fonctionne (sinon T<sub>c</sub> et T<sub>f</sub> dériveraient).</li>
    <li><strong>Données fictives</strong> : contextes et valeurs « constructeur » sont inventés pour la simulation, mais calibrés sur des ordres de grandeur réalistes.</li>
  </ul>
);

// ── Composant principal ─────────────────────────────────────────────────────
const INDICE_Q = {"src": "Une machine prend de l’énergie à une source et en cède à l’autre. Que cherche-t-on à chauffer, ou à refroidir ?", "utile": "Énergie utile = COP × puissance électrique W.", "autre": "Premier principe sur un cycle : Q_c = Q_f + W (la machine reçoit W du réseau).", "max": "Efficacité maximale : T_c ÷ (T_c − T_f) pour une PAC, T_f ÷ (T_c − T_f) pour un groupe froid, avec les températures en kelvins.", "compar": "Le COP réel tient compte des imperfections de la machine : se compare-t-il au maximum idéal ?"};
export function SimulationMachinesThermiques() {
  const [mode, setMode] = useState(() => modeOuverture('mt-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('mt-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });

  const etapes = etapesGuide();
  const etapeCourante = etapes[Math.min(guide.etape, etapes.length - 1)];

  // État de l'exploration : machine courante + réglages
  const [expl, setExpl] = useState({ machine: 'pac', tc: MACHINES.pac.defauts.tc, tf: MACHINES.pac.defauts.tf, w: MACHINES.pac.defauts.w });
  const majExpl = (cle, val) => setExpl(e => {
    const suivant = { ...e, [cle]: val };
    if (cle === 'machine') return { ...suivant, ...MACHINES[val].defauts };
    if (suivant.tc - suivant.tf < 5) {
      if (cle === 'tf') suivant.tf = suivant.tc - 5;
      else suivant.tc = suivant.tf + 5;
    }
    return suivant;
  });
  const bExpl = bilanCycle(expl.machine, expl.tc, expl.tf, expl.w);
  const utileExpl = expl.machine === 'pac' ? bExpl.qChaude : bExpl.qFroide;
  const pompeeAutre = expl.machine === 'pac' ? bExpl.qFroide : bExpl.qChaude;

  // Défi
  const [defi, setDefi] = useState(null);
  const nouveauDefi = () => setDefi({ ...tireDefi(), reps: {}, verifie: false });
  useEffect(() => { if (mode === 'defi' && !defi) nouveauDefi(); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const changerMode = m => { setMode(m); };

  const enGuide = mode === 'guide';
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target" />Défi</button>
    </span>
  );

  // Schéma partagé : en guide, il suit l'étape (organe actif, masquage des énergies) ;
  // en exploration, il suit les réglages de l'élève.
  const schemaGuide = (
    <Schema machine={etapeCourante.machine || 'pac'}
      b={etapeCourante.machine === 'frigo' ? { ...GF, wElec: F.w } : { ...GP, wElec: G.w }}
      tc={etapeCourante.machine === 'frigo' ? F.tc : G.tc}
      tf={etapeCourante.machine === 'frigo' ? F.tf : G.tf}
      organeActif={etapeCourante.organe} montrerEnergies={etapeCourante.montreEnergies} />
  );

  const exploration = (
    <div className="mt-l1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Commandes machine={expl.machine} tc={expl.tc} tf={expl.tf} w={expl.w} set={majExpl} />
        <Schema machine={expl.machine} b={{ ...bExpl, wElec: expl.w }} tc={expl.tc} tf={expl.tf} organeActif={null} montrerEnergies />
        <div style={styleBoite}>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Bilan du cycle (valeurs positives)</div>
          <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
            Puissance électrique du compresseur : <strong>W = {fmt(expl.w, 1)} kW</strong><br />
            Énergie utile ({MACHINES[expl.machine].utile}) : <strong>Q<sub>utile</sub> = {fmt(utileExpl, 1)} kW</strong><br />
            Énergie échangée avec l'autre source : <strong>{fmt(pompeeAutre, 1)} kW</strong><br />
            COP « constructeur » : <strong>{fmt(bExpl.cop, 1)}</strong> ; efficacité thermodynamique maximale : <strong>{fmt(copMax(expl.machine, expl.tc, expl.tf), 1)}</strong>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CourbeCop machine={expl.machine} tc={expl.tc} tfCourant={expl.tf} wElec={expl.w} />
        <div style={styleBoite}>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
            <li>Refroidissez la source froide : que devient le COP ? Pourquoi une PAC décroche-t-elle par grand froid ?</li>
            <li>Rapprochez T<sub>f</sub> de T<sub>c</sub> (écart minimum 5 °C) : pourquoi le COP explose-t-il ? Que vaut la limite théorique quand l'écart tend vers zéro ?</li>
            <li>Basculez sur la machine frigorifique : quelles grandeurs changent de rôle, lesquelles ne changent pas ?</li>
            <li>Augmentez la puissance du compresseur : le COP change-t-il ? Les puissances thermiques ?</li>
            <li>Comparez COP réel et limite théorique : quelle fraction la machine réelle atteint-elle ?</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const voletDefi = defi && (() => {
    const m = MACHINES[defi.machine];
    const Q = questionsDefi(defi);
    const juste = q => q.type === 'num'
      ? proche(lireNombre(defi.reps[q.id] ?? ''), q.vrai, q.tol)
      : defi.reps[q.id] === q.bonne;
    const nbJustes = Q.filter(juste).length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
          {defi.machine === 'pac'
            ? <>Une <strong>pompe à chaleur</strong> maintient la température d'un bassin à <strong>{defi.tc} °C</strong> (source chaude), tandis que l'air extérieur est à <strong>{defi.tf} °C</strong> (source froide). Le compresseur consomme une puissance électrique de <strong>{fmt(defi.w, 1)} kW</strong>.</>
            : <>Un <strong>groupe froid</strong> maintient une chambre de laboratoire à <strong>{defi.tf} °C</strong> (source froide), dans une pièce à <strong>{defi.tc} °C</strong> (source chaude). Le compresseur consomme une puissance électrique de <strong>{fmt(defi.w, 1)} kW</strong>.</>}
          <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>
            {avecIndices('Rappels : sur un cycle, ΔU = W + Q_c + Q_f = 0 ; PAC : COP = Q_c/W_elec ; machine frigorifique : COP = Q_f/W_elec ; efficacité thermodynamique maximale : T_c/(T_c − T_f) pour une PAC, T_f/(T_c − T_f) pour un groupe froid, en kelvins (T(K) = T(°C) + 273,15). Donnez 2 chiffres significatifs.')}
          </div>
        </div>
        <Schema machine={defi.machine} b={{ ...bilanCycle(defi.machine, defi.tc, defi.tf, defi.w), wElec: defi.w }} tc={defi.tc} tf={defi.tf} organeActif={null} montrerEnergies={false} />
        {Q.map((q, k) => {
          const ok = juste(q);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              {INDICE_Q[q.id] && <IndiceDefi cache={defi.verifie && ok}>{INDICE_Q[q.id]}</IndiceDefi>}
              {q.type === 'qcm' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {q.options.map((o, i) => (
                    <button key={i} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, [q.id]: i } }))}
                      style={{ textAlign: 'left', fontSize: 13.5, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                        border: `1.5px solid ${defi.reps[q.id] === i ? '#0284c7' : KIT.bord}`,
                        background: defi.reps[q.id] === i ? '#e0f2fe' : 'white', color: KIT.txt }}>
                      {avecIndices(o)}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse au défi ${k + 1}`}
                    onChange={e => setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: e.target.value } }))}
                    style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130 }} />
                  <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.unite}</span>
                  {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
                </div>
              )}
              {defi.verifie && !ok && q.type === 'num' && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : <strong>{q.affiche(q.vrai)} {q.unite}</strong> — {avecIndices(q.detail)}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => { noterDefi(Q.every(juste)); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh" />Nouvelles données</button>
          {defi.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{nbJustes} / {Q.length} réponses justes</span>}
        </div>
      </div>
    );
  })();

  const [hypoOuv, setHypoOuv] = useState(false);
  const panneauHypo = (
    <div style={{ ...styleBoite, marginTop: 12 }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Machines thermiques</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      {mode === 'defi'
        ? <div style={styleBoite}><>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></></div>
        : mode === 'explore' ? exploration
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{schemaGuide}</div>}
      {mode === 'guide' && (
        <>
          <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />
          <ARetenir titre="À RETENIR">
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
              <li>Une machine thermique fonctionne en <strong>cycle</strong> : le fluide revient à son état initial, donc <strong>ΔU = W + Q<sub>c</sub> + Q<sub>f</sub> = 0</strong>.</li>
              <li>Une machine <strong>réceptrice</strong> (PAC, réfrigérateur) reçoit du travail et transfère de l'énergie de la source froide vers la source chaude, à contre-sens du transfert spontané.</li>
              <li>PAC : <strong>COP = Q<sub>c</sub> / W<sub>elec</sub></strong> ; machine frigorifique : <strong>COP = Q<sub>f</sub> / W<sub>elec</sub></strong>. Le COP augmente quand l'écart entre les deux sources diminue.</li>
              <li>Limite théorique (kelvins) : <strong>T<sub>c</sub>/(T<sub>c</sub> − T<sub>f</sub>)</strong> pour une PAC, <strong>T<sub>f</sub>/(T<sub>c</sub> − T<sub>f</sub>)</strong> pour un groupe froid ; le COP réel reste <strong>strictement inférieur</strong> à cette limite.</li>
            </ul>
          </ARetenir>
        </>
      )}
      {mode !== 'guide' && panneauHypo}
    </div>
  );
}

