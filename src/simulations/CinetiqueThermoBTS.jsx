// Contrôle cinétique ou thermodynamique (BTS) : addition de HBr sur le buta-1,3-diène (produits 1,2 et 1,4).
import { useState, useMemo } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { E, evolution, composition, regime, rapportCinetique, rapportThermo, tempsDepuisCurseur, curseurDepuisTemps, formatTemps } from "./cinetModele";

const SIM_ID = 94;
declarerDefis(SIM_ID, [['principal', 'Contrôle cinétique ou thermodynamique']]);

const NOIR = '#0f172a', BLEU = '#1d4ed8', BRUN = '#9a3412', VIOLET = '#7c3aed';
const C12 = '#0284c7', C14 = '#ea580c', CR = '#64748b';
const nb = (x, d = 0) => x.toFixed(d).replace('.', ',');
const K = 273.15;

// ── Formules topologiques : chaîne C1–C4 du buta-1,3-diène et de ses dérivés ──
const POS = { 1: [0, 28], 2: [48.5, 0], 3: [97, 28], 4: [145.5, 0] };
const NUM = { 1: [-12, 18], 2: [0, 18], 3: [0, 20], 4: [8, 18] };
function Chaine({ dbl = [], br, plus, titre, largeur = 150 }) {
  const ligne = (a, b, k, dec) => {
    const [px, py] = POS[a], [qx, qy] = POS[b], dx = qx - px, dy = qy - py, d = Math.hypot(dx, dy), nx = -dy / d * dec, ny = dx / d * dec;
    return <line key={k} x1={px + nx} y1={py + ny} x2={qx + nx} y2={qy + ny} stroke={NOIR} strokeWidth={2.4} strokeLinecap="round" />;
  };
  return (
    <svg viewBox="-18 -46 182 112" role="img" aria-label={titre} style={{ width: largeur, height: 'auto', display: 'block' }}>
      {[[1, 2], [2, 3], [3, 4]].map(([a, b], i) => {
        const d = dbl.some(([x, y]) => x === a && y === b);
        return d ? [ligne(a, b, `${i}a`, 3), ligne(a, b, `${i}b`, -3)] : ligne(a, b, i, 0);
      })}
      {br && (() => { const [x, y] = POS[br]; return (<g><line x1={x} y1={y - 4} x2={x} y2={y - 22} stroke={BRUN} strokeWidth={2} strokeLinecap="round" /><text x={x} y={y - 27} fontSize={15} fontWeight="700" textAnchor="middle" fill={BRUN}>Br</text></g>); })()}
      {plus && (() => { const [x, y] = POS[plus]; return (<g><circle cx={x} cy={y - 24} r={8} fill="white" stroke={BLEU} strokeWidth={1.8} /><text x={x} y={y - 19.5} fontSize={14} fontWeight="700" textAnchor="middle" fill={BLEU}>+</text></g>); })()}
      {[1, 2, 3, 4].map(i => <text key={i} x={POS[i][0] + NUM[i][0]} y={POS[i][1] + NUM[i][1] + 4} fontSize={12} fontWeight="700" textAnchor="middle" fill={VIOLET}>{i}</text>)}
    </svg>);
}

function Molecules() {
  const boite = (titre, couleur, children, sous, flex = '1 1 180px') => (
    <div style={{ flex, textAlign: 'center', background: 'white', border: `2px solid ${couleur}`, borderRadius: 10, padding: '4px 4px 6px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: couleur }}>{titre}</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>{children}</div>
      <div style={{ fontSize: 12.5, color: KIT.txt }}>{sous}</div>
    </div>);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'stretch' }}>
      {boite('Carbocation allylique', BLEU, <div style={{ display: 'flex', alignItems: 'center' }}><Chaine dbl={[[3, 4]]} plus={2} largeur={150} titre="Forme limite : charge sur C2, double liaison C3=C4" /><span style={{ fontSize: 16, color: KIT.txt }}>↔</span><Chaine dbl={[[2, 3]]} plus={4} largeur={150} titre="Forme limite : charge sur C4, double liaison C2=C3" /></div>, 'deux formes mésomères : la charge + est délocalisée sur C2 et C4', '1 1 100%')}
      {boite('Produit 1,2 (cinétique)', C12, <Chaine dbl={[[3, 4]]} br={2} largeur={150} titre="3-bromobut-1-ène" />, '3-bromobut-1-ène')}
      {boite('Produit 1,4 (thermodynamique)', C14, <Chaine dbl={[[2, 3]]} br={4} largeur={150} titre="1-bromobut-2-ène" />, '1-bromobut-2-ène')}
      <div style={{ flex: '1 1 100%', fontSize: 12.5, color: KIT.txt2, textAlign: 'center' }}>Les numéros en violet suivent le buta-1,3-diène de départ (d’où « addition 1,2 » et « addition 1,4 ») ; les noms des produits suivent leur propre numérotation officielle.</div>
    </div>);
}

// ── Profil d'énergie (statique) ──
function ProfilEnergie({ montrerE }) {
  const W = 360, H = 250, gx = 40, gy = 16, gw = W - gx - 12, gh = H - gy - 34, Emin = -85, Emax = 80;
  const X = x => gx + x * gw, Y = e => gy + (1 - (e - Emin) / (Emax - Emin)) * gh;
  const chemin = pts => {
    const P = pts.map(([x, e]) => [X(x), Y(e)]);
    let d = `M${P[0][0]},${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return d;
  };
  const voie = (ets, p) => [[0, E.R], [0.2, E.ET1], [0.42, E.C], [0.66, ets], [1, p]];
  const lab = (x, e, txt, col, anchor = 'middle', dy = -7) => montrerE && <text x={X(x)} y={Y(e) + dy} fontSize={11} fontWeight="700" fill={col} textAnchor={anchor}>{txt}</text>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Profil d'énergie : deux produits à partir du carbocation allylique" style={{ width: '100%', display: 'block', background: '#fbfdff', borderRadius: 10 }}>
      <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke="#64748b" /><line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke="#64748b" />
      <line x1={gx} y1={Y(0)} x2={gx + gw} y2={Y(0)} stroke="#cbd5e1" strokeDasharray="4 3" />
      <text x={6} y={gy + 8} fontSize={11} fill={KIT.txt2}>Énergie</text>
      <text x={gx + gw} y={H - 6} fontSize={11} fill={KIT.txt2} textAnchor="end">avancement de la réaction →</text>
      <path d={chemin(voie(E.ET2b, E.P14))} fill="none" stroke={C14} strokeWidth={3} strokeLinecap="round" />
      <path d={chemin(voie(E.ET2a, E.P12))} fill="none" stroke={C12} strokeWidth={3} strokeLinecap="round" />
      <text x={X(0)} y={Y(0) + 15} fontSize={11} fill={KIT.txt2}>réactifs</text>
      <text x={X(0.2)} y={Y(E.ET1) - 22} fontSize={11} fill={KIT.txt2} textAnchor="middle">ET₁</text>
      <text x={X(0.42)} y={Y(E.C) + 16} fontSize={11} fill={KIT.txt2} textAnchor="middle">carbocation</text>
      <text x={X(0.66)} y={Y(E.ET2b) - 24} fontSize={11} fill={KIT.txt2} textAnchor="middle">ET₂</text>
      <text x={X(1) - 30} y={Y(E.P12) - 9} fontSize={11} fill={C12} textAnchor="end" fontWeight="700">produit 1,2{montrerE ? ` : ${E.P12}`.replace('-', '−') : ''}</text>
      <text x={X(1) - 12} y={Y(E.P14) + 16} fontSize={11} fill={C14} textAnchor="end" fontWeight="700">produit 1,4{montrerE ? ` : ${E.P14}`.replace('-', '−') : ''}</text>
      {lab(0.2, E.ET1, E.ET1, KIT.txt)}{lab(0.42, E.C, E.C, KIT.txt, 'middle', 30)}
      {montrerE && <><text x={X(0.66) - 6} y={Y(E.ET2a) - 12} fontSize={11} fontWeight="700" fill={C12} textAnchor="end">{E.ET2a}</text><text x={X(0.66) + 8} y={Y(E.ET2b) - 12} fontSize={11} fontWeight="700" fill={C14}>{E.ET2b}</text></>}
    </svg>);
}

// ── Évolution de la composition au cours du temps, à la température choisie ──
function CourbesTemps({ pts, t }) {
  const W = 360, H = 190, gx = 40, gy = 12, gw = W - gx - 12, gh = H - gy - 36;
  const X = tt => gx + (Math.log10(Math.max(tt, 1e-3)) + 3) / 9 * gw, Y = v => gy + (1 - v) * gh;
  const ligne = (cle, col) => 'M' + pts.filter(p => p.t >= 1e-3).map(p => `${X(p.t).toFixed(1)},${Y(p[cle]).toFixed(1)}`).join(' L');
  const ticks = [[-3, '1 ms'], [0, '1 s'], [2, '100 s'], [4, '3 h'], [6, '12 j']];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Composition du mélange en fonction du temps" style={{ width: '100%', display: 'block', background: '#fbfdff', borderRadius: 10 }}>
      <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke="#64748b" /><line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke="#64748b" />
      {[0, 0.5, 1].map(v => <g key={v}><line x1={gx} y1={Y(v)} x2={gx + gw} y2={Y(v)} stroke="#e2e8f0" /><text x={gx - 5} y={Y(v) + 4} fontSize={10} textAnchor="end" fill={KIT.txt2}>{v * 100} %</text></g>)}
      {ticks.map(([e, l]) => <g key={e}><line x1={gx + (e + 3) / 9 * gw} y1={gy + gh} x2={gx + (e + 3) / 9 * gw} y2={gy + gh + 4} stroke="#64748b" /><text x={gx + (e + 3) / 9 * gw} y={gy + gh + 15} fontSize={10} textAnchor="middle" fill={KIT.txt2}>{l}</text></g>)}
      <text x={gx + gw} y={H - 4} fontSize={10.5} fill={KIT.txt2} textAnchor="end">temps (échelle logarithmique) →</text>
      <path d={ligne('R', CR)} fill="none" stroke={CR} strokeWidth={2} strokeDasharray="5 3" />
      <path d={ligne('P12', C12)} fill="none" stroke={C12} strokeWidth={3} />
      <path d={ligne('P14', C14)} fill="none" stroke={C14} strokeWidth={3} />
      <line x1={X(t)} y1={gy} x2={X(t)} y2={gy + gh} stroke="#f59e0b" strokeWidth={2} />
    </svg>);
}

const NOM_REGIME = { cours: 'Réaction en cours : le réactif n\'est pas encore consommé', cinetique: 'Contrôle cinétique : le produit qui se forme le plus vite domine', transition: 'Régime intermédiaire : le produit 1,2 se retransforme peu à peu en 1,4', thermo: 'Contrôle thermodynamique : l\'équilibre est atteint, le produit le plus stable domine' };

// ── Parcours guidé ──
function etapesGuide(reg, regler) {
  const { Tc, t } = reg;
  const scen = (c0, tsec) => ({ ok: Math.abs(Tc - c0) <= (c0 === 0 ? 8 : 10) && (tsec === 10 ? t >= 1 && t <= 200 : t >= 3600), faire: () => regler(c0, tsec) });
  return [
    { titre: 'Un diène conjugué', texte: <>Le <strong>buta-1,3-diène</strong> CH₂=CH–CH=CH₂ possède deux doubles liaisons séparées par une liaison simple (diène conjugué). H⁺ se fixe sur C1 : le carbocation formé a sa charge + à côté d'une double liaison C3=C4. On l'appelle <strong>carbocation allylique</strong>.</>,
      tache: { type: 'qcm', q: 'Sur quels carbones du carbocation allylique Br⁻ peut-il se fixer ?', options: ['Seulement C2', 'C2 ou C4 : la charge + est délocalisée sur ces deux carbones', 'C1 ou C3'], bonne: 1, indice: 'Observe les deux formes mésomères du carbocation (↔).', expl: <>Les deux formes limites placent la charge + sur C2 ou sur C4 : Br⁻ peut attaquer l'un ou l'autre. On obtient donc deux produits : l'addition <strong>1,2</strong> (3-bromobut-1-ène) et l'addition <strong>1,4</strong> (1-bromobut-2-ène).</> } },
    { titre: 'Le produit le plus stable', texte: <>Compare les énergies des deux produits sur le profil (coche « Montrer les énergies »). Le produit 1,4 a une double liaison C2=C3 <strong>disubstituée</strong> (au milieu de la chaîne) ; le produit 1,2 a une double liaison terminale C3=C4.</>,
      tache: { type: 'qcm', q: 'Quel produit est le plus stable (énergie la plus basse) ?', options: ['Le produit 1,2', 'Le produit 1,4', 'Ils ont la même énergie'], bonne: 1, indice: 'Lis les énergies des deux produits sur le profil : la plus basse correspond au plus stable.', expl: <>Le produit 1,4 est à −67 kJ/mol, le 1,2 à −60 kJ/mol : 7 kJ/mol de moins. Une double liaison plus substituée est plus stable.</> } },
    { titre: 'Le produit qui se forme le plus vite', texte: <>L'étape 2 part du carbocation (20 kJ/mol). La barrière qui mène au produit 1,2 est plus basse que celle qui mène au 1,4 : l'attaque sur C2 est un peu plus facile (C2 est plus proche de la charge + dans la forme la plus chargée).</>,
      tache: { type: 'num', q: 'Quelle est l’énergie d’activation de la formation du produit 1,2 à partir du carbocation ?', unite: 'kJ/mol', vrai: E.ET2a - E.C, tol: 0.02, cs: 2, indice: 'Énergie du sommet ET₂ (voie 1,2) moins énergie du carbocation.', calcul: () => [`E(ET₂, 1,2) − E(carbocation) = ${E.ET2a} − ${E.C} = ${E.ET2a - E.C} kJ/mol`] } },
    { titre: 'Contrôle cinétique', texte: <>Place-toi à <strong>0 °C</strong> avec un temps court (<strong>10 s</strong>). Le réactif est consommé, mais le mélange n'a pas eu le temps d'évoluer : sa composition reflète les <strong>vitesses</strong> de formation.</>,
      tache: { type: 'action', ...scen(0, 10), label: 'Le faire pour moi', consigne: 'Règle la température à 0 °C et le temps à environ 10 s.', indice: 'Utilise les deux curseurs, ou le bouton « Cinétique ».' } },
    { titre: 'Qui domine ?', texte: <>Lis la composition du mélange (barre sous les curseurs).</>,
      tache: { type: 'qcm', q: 'À 0 °C après 10 s, quel produit est majoritaire ?', options: ['Le produit 1,2 (≈ 80 %)', 'Le produit 1,4 (≈ 80 %)', 'Les deux en quantités égales'], bonne: 0, indice: 'Compare les barrières ET₂ : la plus basse conduit au produit le plus rapidement formé.', expl: <>Le produit 1,2 (barrière 10 kJ/mol) se forme plus vite que le 1,4 (barrière 13 kJ/mol) : c'est le <strong>produit cinétique</strong>. Il est majoritaire tant que la réaction n'est pas réversible.</> } },
    { titre: 'Contrôle thermodynamique', texte: <>Place-toi à <strong>40 °C</strong> et attends longtemps (<strong>3 h</strong>). Observe sur la courbe : le produit 1,2 apparaît d'abord, puis diminue pendant que le produit 1,4 augmente.</>,
      tache: { type: 'action', ...scen(40, 10800), label: 'Le faire pour moi', consigne: 'Règle la température à 40 °C et le temps à environ 3 h.', indice: 'Bouton « Thermodynamique », ou curseurs : 40 °C et le temps vers 3 h.' } },
    { titre: 'Pourquoi le mélange évolue', texte: <>À 40 °C, le produit 1,2 peut <strong>se retransformer en carbocation</strong> (il faut franchir 90 kJ/mol, ce qui est possible à cette température), puis donner le produit 1,4. Les deux produits sont en équilibre ; le plus stable finit par dominer.</>,
      tache: { type: 'qcm', q: 'Pourquoi le produit 1,4 devient-il majoritaire après plusieurs heures à 40 °C ?', options: ['Le produit 1,2 se reforme en carbocation, qui peut donner le produit 1,4 plus stable : la réaction est réversible et l\'équilibre favorise le plus stable', 'Le produit 1,4 se forme plus vite que le 1,2', 'Le produit 1,2 s\'évapore'], bonne: 0, indice: 'Que se passe-t-il quand les étapes deviennent réversibles ?', expl: <>Quand la température permet de franchir la barrière inverse, les produits s'interconvertissent via le carbocation. La composition atteint l'équilibre, fixé par la différence d'énergie des produits (ΔE = 7 kJ/mol) : on obtient environ 94 % de produit 1,4.</> } },
    { titre: 'La barrière inverse', texte: <>Pour que le produit 1,2 se retransforme en carbocation, il doit gravir la barrière inverse : du produit 1,2 jusqu'au sommet ET₂ de sa voie.</>,
      tache: { type: 'num', q: 'Quelle est l’énergie à fournir pour que le produit 1,2 revienne au carbocation ?', unite: 'kJ/mol', vrai: E.ET2a - E.P12, tol: 0.02, cs: 2, indice: 'Énergie de ET₂ (voie 1,2) moins énergie du produit 1,2.', calcul: () => [`E(ET₂, 1,2) − E(produit 1,2) = ${E.ET2a} − (${E.P12}) = ${E.ET2a - E.P12} kJ/mol`] } },
    { titre: 'Choisir ses conditions', texte: <>En synthèse, on choisit le produit en réglant la température et la durée.</>,
      tache: { type: 'qcm', q: 'Pour obtenir surtout le produit 1,2, on opère :', options: ['À basse température, pendant un temps court', 'À température élevée, pendant plusieurs heures', 'Peu importe : le résultat est le même'], bonne: 0, indice: 'Il faut éviter que le produit 1,2 ne se retransforme.', expl: <>À basse température, la réaction est irréversible : le produit cinétique (1,2) reste. À température élevée et temps long, l'équilibre favorise le produit 1,4.</> } },
    { titre: 'Bilan', texte: <>Tu sais distinguer contrôle cinétique et contrôle thermodynamique.</>,
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Un carbocation allylique donne deux produits : addition <strong>1,2</strong> et addition <strong>1,4</strong>.</li>
        <li><strong>Contrôle cinétique</strong> (basse température, temps court, réaction irréversible) : le produit qui se forme le plus vite domine (barrière la plus basse).</li>
        <li><strong>Contrôle thermodynamique</strong> (température plus élevée, temps long, réaction réversible) : le produit le plus stable domine (énergie la plus basse).</li>
        <li>Le rapport à l'équilibre vaut exp(ΔE / RT).</li>
      </ul> },
  ];
}

// ── Défi ──
function alea(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const SCEN = [
  { Tc: 0, t: 5, texte: '0 °C, après 5 s' }, { Tc: -20, t: 20, texte: '−20 °C, après 20 s' },
  { Tc: 40, t: 10800, texte: '40 °C, après 3 h' }, { Tc: 60, t: 7200, texte: '60 °C, après 2 h' },
];
function defi(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed), i = Math.floor(r() * SCEN.length), s = SCEN[i], T = s.Tc + K;
  const c = composition(evolution(T), s.t), g = regime(c, T);
  const rev = r() < 0.5 ? 'P12' : 'P14', nom = rev === 'P12' ? 'le produit 1,2' : 'le produit 1,4';
  const bar = rev === 'P12' ? E.ET2a - E.P12 : E.ET2b - E.P14;
  const q1 = { id: 'regime', type: 'qcm', q: `Le buta-1,3-diène réagit avec HBr dans les conditions suivantes : ${s.texte}. Quel produit domine et pourquoi ?`,
    options: ['Le produit 1,2, formé le plus vite (contrôle cinétique)', 'Le produit 1,4, le plus stable (contrôle thermodynamique)', 'Un mélange équimolaire'], bonne: g === 'cinetique' ? 0 : 1,
    detail: g === 'cinetique' ? 'À basse température et temps court, la réaction est irréversible : le produit cinétique (1,2) domine.' : 'À cette température et sur ce temps, le produit 1,2 a pu se retransformer : l\'équilibre favorise le produit 1,4, plus stable.' };
  const q2 = { id: 'pct', type: 'num', q: `Dans ces conditions (${s.texte}), quel est le pourcentage du produit ${g === 'cinetique' ? '1,2' : '1,4'} dans le mélange ? (Règle la température et le temps, puis lis la barre de composition.)`, unite: '%', vrai: g === 'cinetique' ? c.P12 : c.P14, tol: 0.06, detail: `La simulation donne environ ${nb(g === 'cinetique' ? c.P12 : c.P14)} % de produit ${g === 'cinetique' ? '1,2' : '1,4'}.` };
  const q3 = { id: 'inverse', type: 'num', q: `Quelle énergie ${nom} doit-il recevoir pour se retransformer en carbocation (barrière inverse) ?`, unite: 'kJ/mol', vrai: bar, tol: 0.02, detail: `E(ET₂) − E(produit) = ${rev === 'P12' ? E.ET2a : E.ET2b} − (${E[rev]}) = ${bar} kJ/mol.` };
  const q4 = { id: 'delta', type: 'num', q: 'Quelle est la différence d’énergie entre le produit 1,2 et le produit 1,4 (valeur positive) ?', unite: 'kJ/mol', vrai: E.P12 - E.P14, tol: 0.02, detail: `E(1,2) − E(1,4) = ${E.P12} − (${E.P14}) = ${E.P12 - E.P14} kJ/mol : le produit 1,4 est le plus stable.` };
  return { Q: [q1, q2, q3, q4], reps: {}, verifie: false, scen: s };
}
const INDICE_Q = {
  regime: 'Basse température et temps court : la réaction est irréversible (cinétique). Température élevée et temps long : équilibre (thermodynamique).',
  pct: 'Mets la température et le temps indiqués, puis lis le pourcentage dans la barre de composition.',
  inverse: 'Sommet ET₂ de la voie du produit moins énergie de ce produit.',
  delta: 'Compare les énergies des deux produits sur le profil (active « Montrer les énergies »).',
};

const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
    <li>Les énergies (ET₁ {E.ET1}, carbocation {E.C}, ET₂ {E.ET2a} et {E.ET2b}, produits {E.P12} et {E.P14} kJ/mol) sont des <strong>ordres de grandeur arrondis</strong> choisis pour reproduire la tendance observée expérimentalement ; ce ne sont pas des valeurs mesurées.</li>
    <li>Les constantes de vitesse suivent la loi d'Arrhenius k = A·exp(−E<sub>a</sub>/RT) avec le <strong>même facteur A = 10¹³ s⁻¹</strong> pour toutes les étapes.</li>
    <li>HBr est en excès : la cinétique est de pseudo-premier ordre. Le carbocation, très réactif, est traité par l'<strong>approximation de l'état quasi stationnaire</strong>.</li>
    <li>Les temps affichés sont <strong>indicatifs</strong> : les barrières réelles dépendent du solvant et du couple d'ions.</li>
    <li>Les proportions réelles dépendent du solvant : pour fixer des idées, on observe expérimentalement environ 70 % de produit 1,2 à 0 °C et 85 % de produit 1,4 à 40 °C.</li>
  </ul>
);

export function SimulationCinetiqueThermoBTS() {
  const [mode, setMode] = useState(() => modeOuverture('cinet-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('cinet-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [Tc, setTc] = useState(25);
  const [curs, setCurs] = useState(curseurDepuisTemps(10));
  const [montrerE, setMontrerE] = useState(true);
  const [df, setDf] = useState(() => defi());
  const [hypoOuv, setHypoOuv] = useState(false);
  const T = Tc + K, t = tempsDepuisCurseur(curs);
  const pts = useMemo(() => evolution(T), [T]);
  const c = composition(pts, t), g = regime(c, T);
  const regler = (tc, ts) => { setTc(tc); setCurs(curseurDepuisTemps(ts)); };
  const etapes = etapesGuide({ Tc, t }, regler);
  const finParcours = guide.etape >= etapes.length;
  const juste = q => q.type === 'num' ? proche(lireNombre(df.reps[q.id] ?? ''), q.vrai, q.tol) : df.reps[q.id] === q.bonne;

  const visuel = (
    <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Molecules />
      <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>Température : {Tc} °C ({nb(T, 0)} K)
          <input type="range" min={-80} max={80} step={1} value={Tc} onChange={e => setTc(+e.target.value)} aria-label="Température en degrés Celsius" style={{ width: '100%' }} /></label>
        <label style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>Temps de réaction : {formatTemps(t)}
          <input type="range" min={0} max={1000} step={1} value={curs} onChange={e => setCurs(+e.target.value)} aria-label="Temps de réaction (échelle logarithmique)" style={{ width: '100%' }} /></label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => regler(0, 10)} style={stylePetitBouton(false, C12)}>Cinétique (0 °C, 10 s)</button>
          <button onClick={() => regler(40, 10800)} style={stylePetitBouton(false, C14)}>Thermodynamique (40 °C, 3 h)</button>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', height: 30, borderRadius: 8, overflow: 'hidden', border: `1px solid ${KIT.bord}` }} role="img" aria-label={`Composition : ${nb(c.R)} % de réactif, ${nb(c.P12)} % de produit 1,2, ${nb(c.P14)} % de produit 1,4`}>
          <div style={{ width: `${c.R}%`, background: '#cbd5e1' }} /><div style={{ width: `${c.P12}%`, background: C12 }} /><div style={{ width: `${c.P14}%`, background: C14 }} />
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}>
          <span><span style={{ color: CR, fontWeight: 700 }}>■</span> réactif {nb(c.R)} %</span>
          <span><span style={{ color: C12, fontWeight: 700 }}>■</span> produit 1,2 <strong>{nb(c.P12)} %</strong></span>
          <span><span style={{ color: C14, fontWeight: 700 }}>■</span> produit 1,4 <strong>{nb(c.P14)} %</strong></span>
        </div>
      </div>
      <CourbesTemps pts={pts} t={t} />
      <ProfilEnergie montrerE={montrerE} />
      <label style={{ fontSize: 13, color: KIT.txt }}><input type="checkbox" checked={montrerE} onChange={e => setMontrerE(e.target.checked)} /> Montrer les énergies (kJ/mol)</label>
    </div>
  );

  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Utilise les curseurs, la composition et le profil d'énergie pour répondre.</div>
      {df.Q.map((q, k) => {
        const ok = juste(q);
        return (
          <div key={q.id} style={{ borderLeft: `3px solid ${df.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
            <IndiceDefi cache={df.verifie && ok}>{avecIndices(INDICE_Q[q.id])}</IndiceDefi>
            {q.type === 'qcm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: i } }))}
                    style={{ textAlign: 'left', fontSize: 13.5, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${df.reps[q.id] === i ? '#0284c7' : KIT.bord}`, background: df.reps[q.id] === i ? '#e0f2fe' : 'white', color: KIT.txt }}>{o}</button>))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={df.reps[q.id] ?? ''} onChange={e => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: e.target.value } }))} inputMode="decimal" aria-label={q.q}
                  style={{ width: 90, padding: '6px 8px', fontSize: 14, borderRadius: 8, border: `1.5px solid ${KIT.bord}` }} />
                <span style={{ fontSize: 14, color: KIT.txt }}>{q.unite}</span>
                {q.id === 'pct' && <button onClick={() => regler(df.scen.Tc, df.scen.t)} style={stylePetitBouton(false, '#b45309')}>Régler les curseurs</button>}
              </div>)}
            {df.verifie && !ok && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>{q.type === 'num' && <>Réponse attendue : <strong>{fmt(q.vrai, 0)} {q.unite}</strong> — </>}{avecIndices(q.detail)}</div>}
          </div>);
      })}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { noterDefi(df.Q.every(juste)); setDf(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => setDf(defi())} style={styleBouton(false)}><Pic n="refresh" />Nouvelles données</button>
        {df.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{df.Q.filter(juste).length} / {df.Q.length} réponses justes</span>}
      </div>
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Contrôle cinétique ou thermodynamique</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 10 }}>
        {visuel}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'guide' && <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />}
          {mode === 'explore' && <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Mesures</div>
            <LigneMesure nom="Produit 1,2 (%)" valeur={fmt(c.P12, 0)} couleur={C12} />
            <LigneMesure nom="Produit 1,4 (%)" valeur={fmt(c.P14, 0)} couleur={C14} />
            <LigneMesure nom="Rapport cinétique 1,2 / 1,4" valeur={fmt(rapportCinetique(T), 1)} couleur="#475569" />
            <LigneMesure nom="Rapport à l'équilibre 1,4 / 1,2" valeur={fmt(rapportThermo(T), 1)} couleur="#475569" />
            <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 8, lineHeight: 1.55 }}><strong>{NOM_REGIME[g]}.</strong></div>
            <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Rapport cinétique = exp[(E_a(1,4) − E_a(1,2)) / RT] (à temps court). Rapport à l'équilibre = exp[(E(1,2) − E(1,4)) / RT].</div>
          </div>}
          {mode === 'defi' && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>}
        </div>
      </div>
      {finParcours && mode === 'guide' && <ARetenir titre="À RETENIR">Contrôle cinétique : le produit qui se forme le plus vite. Contrôle thermodynamique : le produit le plus stable.</ARetenir>}
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
    </div>
  );
}
