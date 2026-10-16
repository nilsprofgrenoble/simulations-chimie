import { useSignalerMode, useSuivi, declarerDefis } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, lireProgression } from "../commun";
import { ESPECES, ANA, ORDRE_LIQ, ORDRE_SOL, TYPES, bilan, partPolaire, BATTERIE, RT, K_COULOMB, D_NACL, SEUIL_LIQ, SEUIL_SOL, SEUIL_ION } from "./solubiliteModele";
import { FormuleSVG, PaireSVG } from "./solubiliteDessin";

const COUL_INTER = { h: '#2563eb', p: '#ea580c', d: '#6b7280' };

// ====================================================
//  SIM 53 — SOLUBILITÉ ET MISCIBILITÉ : LE BILAN DES INTERACTIONS (1G, chapitre 4)
//  Pour un solvant S et un soluté E : on compare l'état initial (interactions S…S et E…E)
//  et l'état final envisagé (interactions E…S), type d'interaction par type d'interaction.
// ====================================================

const SIM = 53;
declarerDefis(SIM, [
  ['verdict', 'Prédire la miscibilité ou la solubilité'],
  ['dominant', 'Quelle interaction décide ?'],
  ['extraction', 'Choisir un solvant extracteur'],
]);

const COUL = { ok: '#16a34a', lim: '#d97706', non: '#dc2626' };
const ETIQ_LIQ = { ok: 'Miscibles', lim: 'Cas limite', non: 'Non miscibles' };
const ETIQ_SOL = { ok: 'Soluble', lim: 'Peu soluble (cas limite)', non: 'Insoluble' };
const vir = s => String(s).replace('.', ',');
const nb = x => { const a = Math.abs(x); return vir(a >= 100 ? Math.round(x) : a >= 10 ? x.toFixed(0) : a >= 1 ? x.toFixed(1) : x.toFixed(2)); };
const nomEsp = id => ESPECES[id].nom;
const unite = b => b.kind === 'liq' ? 'kJ par litre de mélange' : 'kJ par mole de soluté';
// énergie de cohésion (kJ/mol) : énergie à fournir pour séparer complètement les molécules d'une mole
const cohesion = id => { const m = ESPECES[id]; return m.V * (m.dd ** 2 + m.dp ** 2 + m.dh ** 2) / 1000; };
// vocabulaire : deux liquides → A et B (miscibilité) ; liquide + solide → solvant A et soluté B (solubilité)
const roles = liq => liq ? { A: 'A', B: 'B', nA: 'liquide A', nB: 'liquide B' } : { A: 'A', B: 'B', nA: 'solvant A', nB: 'soluté B' };

// ---------- bilan en balance : état initial à gauche (à rompre), état final à droite (retrouvé) ----------
const arr = v => vir(Number(Math.abs(v).toPrecision(2)));           // 2 chiffres significatifs : on ne prétend pas à plus
function Barres({ b, masque }) {
  const liq = b.kind === 'liq', u = liq ? 'kJ/L' : 'kJ/mol';
  const [tip, setTip] = useState(null);
  const W = 640, x0 = 320, Wh = 262, y0 = 44, hT = 56, yTot = y0 + 3 * hT + 6, hTot = 82, yAx = yTot + hTot + 2, H = yAx + 40;
  const totIni = b.types.reduce((s, t) => s + t.ini, 0), totFin = b.types.reduce((s, t) => s + t.fin, 0), solde = b.total;
  const maxV = Math.max(1, totIni, totFin);
  const mag = 10 ** Math.floor(Math.log10(maxV / 4)), pas = [1, 2, 5, 10].map(c => c * mag).find(s => maxV / s <= 5), M = Math.ceil(maxV / pas) * pas;
  const L = v => Math.max(0, v) / M * Wh;
  const ticks = []; for (let v = 0; v <= M + 1e-9; v += pas) ticks.push(v);
  const [z1, z2] = liq ? [SEUIL_LIQ[0] * b.crit, SEUIL_LIQ[1] * b.crit] : SEUIL_SOL;
  const prop = txt => ({ tabIndex: 0, style: { cursor: 'pointer', outline: 'none' }, onMouseEnter: () => setTip(txt), onFocus: () => setTip(txt), onClick: () => setTip(txt) });
  const ligne = (y, nom, col, ini, fin, perte, h, tH) => <g key={nom}>
    <text x="8" y={y + 11} fontSize="12.5" fontWeight="700" fill={col}>{nom}</text>
    <g {...prop(`${nom} — état initial (A…A et B…B) : ≈ ${arr(ini)} ${u}`)}><rect x={x0 - L(ini)} y={y + 16} width={L(ini)} height={h} rx="3" fill="#94a3b8"/></g>
    <g {...prop(`${nom} — état final (A…B) : ≈ ${arr(fin)} ${u}`)}><rect x={x0} y={y + 16} width={L(fin)} height={h} rx="3" fill={col}/></g>
    {perte > 0.005 * M && <g {...prop(`${nom} — solde, ce que l’on perd : ≈ ${arr(perte)} ${u}`)}><rect x={x0 - L(perte)} y={y + 18 + h} width={L(perte)} height={tH} fill="#fee2e2" fillOpacity="0.6" stroke="#dc2626" strokeWidth="1.6" strokeDasharray="4 3"/></g>}
  </g>;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img" aria-label="Bilan des interactions : état initial à gauche, état final à droite, solde en pointillés">
        <text x={x0 - 8} y="16" textAnchor="end" fontSize="12.5" fontWeight="700" fill="#475569">◀ état initial : à rompre (A…A, B…B)</text>
        <text x={x0 + 8} y="16" fontSize="12.5" fontWeight="700" fill="#475569">état final : retrouvé (A…B) ▶</text>
        <text x={x0} y="32" textAnchor="middle" fontSize="11.5" fill="#64748b">énergies en {liq ? 'kJ pour 1 L de mélange (0,5 L de A + 0,5 L de B)' : 'kJ par mole de soluté B dissous'}</text>
        {/* zones : ce que l'agitation thermique peut compenser (masquées pendant la prédiction) */}
        {!masque && <g>
          <rect x={x0 - Wh} y={yTot + 6} width={Math.max(0, Wh - L(z2))} height={hTot - 14} fill="#fecaca" fillOpacity="0.55"/>
          <rect x={x0 - Math.min(Wh, L(z2))} y={yTot + 6} width={Math.min(Wh, L(z2)) - Math.min(Wh, L(z1))} height={hTot - 14} fill="#fde68a" fillOpacity="0.6"/>
          <rect x={x0 - Math.min(Wh, L(z1))} y={yTot + 6} width={Math.min(Wh, L(z1))} height={hTot - 14} fill="#bbf7d0" fillOpacity="0.7"/></g>}
        <line x1={x0} y1={y0 - 4} x2={x0} y2={yAx} stroke="#334155" strokeWidth="1.5"/>
        {b.types.map((t, i) => ligne(y0 + i * hT, t.court, t.col, t.ini, t.fin, t.perte, 16, 8))}
        {ligne(yTot, 'Total', '#0f172a', totIni, totFin, solde, 20, 12)}
        <line x1={x0 - Wh} y1={yAx} x2={x0 + Wh} y2={yAx} stroke="#94a3b8"/>
        {ticks.flatMap(v => (v === 0 ? [0] : [-1, 1]).map(sg => <g key={`${v}${sg}`}><line x1={x0 + sg * L(v)} y1={yAx} x2={x0 + sg * L(v)} y2={yAx + 5} stroke="#94a3b8"/>
          <text x={x0 + sg * L(v)} y={yAx + 18} textAnchor="middle" fontSize="11" fill="#64748b">{vir(v)}</text></g>))}
        <text x={x0} y={yAx + 34} textAnchor="middle" fontSize="11" fill="#64748b">{u}</text>
      </svg>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}><span style={{ color: '#dc2626', fontWeight: 700 }}>▭ Pointillés rouges</span> : le solde (initial − final), c’est ce que l’on perd. La balance penche <strong>à gauche</strong> quand le mélange fait perdre de la stabilité.</div>
      <div style={{ minHeight: 26, margin: '4px 0 2px', padding: '4px 8px', borderRadius: 6, background: tip ? '#f1f5f9' : 'transparent', fontSize: 13.5, color: KIT.txt }}>
        {tip || <span style={{ color: KIT.txt2 }}>👆 Passez la souris sur une barre (ou touchez-la) pour lire sa valeur, arrondie.</span>}</div>
      {!masque && <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Zone sous le total : <span style={{ background: '#bbf7d0', padding: '0 4px', borderRadius: 3 }}>verte</span> l’agitation thermique compense la perte (mélange possible) · <span style={{ background: '#fde68a', padding: '0 4px', borderRadius: 3 }}>orange</span> cas limite · <span style={{ background: '#fecaca', padding: '0 4px', borderRadius: 3 }}>rouge</span> perte trop grande.</div>}
    </div>);
}

// ---------- ions : attraction Na⁺ / Cl⁻ écrantée ----------
function SceneIon({ solv, b }) {
  const S = ESPECES[solv], W = 640, H = 230;
  const echelle = v => 60 + Math.log10(Math.max(v, 1)) / Math.log10(600) * 400;
  const lignes = [['dans le vide (cristal)', b.vide, '#64748b'], [`dans ${S.nom} (ε = ${vir(S.eps)})`, b.dans, COUL[b.classe]]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img" aria-label="Attraction Na+ Cl- dans le solvant">
      <circle cx="70" cy="46" r="17" fill="#fde68a" stroke="#b45309" strokeWidth="1.5"/><text x="70" y="51" textAnchor="middle" fontSize="13" fontWeight="800">Na⁺</text>
      <circle cx="120" cy="46" r="22" fill="#bbf7d0" stroke="#15803d" strokeWidth="1.5"/><text x="120" y="51" textAnchor="middle" fontSize="13" fontWeight="800">Cl⁻</text>
      <text x="160" y="42" fontSize="12.5" fill="#0f172a">au contact (d = {vir(D_NACL.toFixed(2))} Å) : F = k·e² / (ε·d²), énergie = {nb(K_COULOMB / D_NACL)} kJ/mol / ε</text>
      <text x="160" y="60" fontSize="12" fill="#475569">Le solvant « fait écran » : l’attraction est divisée par ε.</text>
      {lignes.map(([n, v, c], i) => <g key={i}>
        <text x="10" y={108 + i * 46} fontSize="12.5" fontWeight="700" fill="#0f172a">{n}</text>
        <rect x="60" y={114 + i * 46} width={Math.max(2, echelle(v) - 60)} height="20" rx="3" fill={c}/>
        <text x={echelle(v) + 8} y={129 + i * 46} fontSize="13" fontWeight="800" fill="#0f172a">{nb(v)} kJ/mol</text></g>)}
      {[[3 * RT, '3RT'], [SEUIL_ION[1], '']].map(([v, l], i) => <g key={i}><line x1={echelle(v)} y1="100" x2={echelle(v)} y2="205" stroke="#0f172a" strokeDasharray="3 3"/><text x={echelle(v) + 3} y={i ? 202 : 214} fontSize="11" fill="#475569">{l ? `${l} ≈ ${nb(v)} : agitation thermique` : `${nb(v)} : au-delà, insoluble`}</text></g>)}
      <text x="10" y="225" fontSize="10.5" fill="#64748b">échelle logarithmique</text>
    </svg>);
}

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
function nouveauDefi(type) {
  if (type === 'verdict') {
    let a, b; do { a = tire(ORDRE_LIQ); b = tire([...ORDRE_LIQ, ...ORDRE_SOL]); } while (a === b);
    return { type, a, b, reps: {}, verifie: false };
  }
  if (type === 'dominant') {
    let a, b, bi; do { a = tire(ORDRE_LIQ); b = tire(ORDRE_LIQ); bi = a !== b && bilan(a, b); } while (!bi || bi.total < 60);
    return { type, a, b, reps: {}, verifie: false };
  }
  const sol = tire(['naphtalene', 'diiode', 'soudan']);
  const cand = ORDRE_LIQ.filter(l => l !== 'eau' && l !== 'huile');
  let ch; do { ch = [...cand].sort(() => Math.random() - 0.5).slice(0, 4); } while (!ch.some(c => validExtract(c, sol)));
  return { type, sol, choix: ch, reps: {}, verifie: false };
}
const validExtract = (c, sol) => bilan('eau', c).classe === 'non' && bilan(c, sol).classe === 'ok';
const TITRES = { verdict: 'Prédire le verdict', dominant: 'Quelle interaction décide ?', extraction: 'Solvant extracteur' };
function evaluer(d) {
  const r = d.reps;
  if (d.type === 'verdict') { const b = bilan(d.a, d.b); const ok = r.v === b.classe; return { ok, lignes: [[ok, ok ? 'Verdict conforme au bilan.' : 'Regardez le bilan : le verdict dépend du total des pertes (dernier cadre).']] }; }
  if (d.type === 'dominant') { const b = bilan(d.a, d.b); const ok = r.t === b.dom.k; return { ok, lignes: [[ok, ok ? 'Oui : c’est bien l’interaction qui perd le plus.' : 'Non : comparez, type par type, la barre de gauche (initial) et celle de droite (final) : le pointillé rouge le plus long désigne la réponse.']] }; }
  const ok = !!r.c && validExtract(r.c, d.sol);
  return { ok, lignes: [[ok, ok ? 'Bon choix : non miscible avec l’eau et très soluble pour le soluté.' : 'Un bon solvant extracteur est non miscible avec l’eau ET dissout bien le soluté.']] };
}
function VoletDefi({ defi, setDefi, changerType }) {
  const res = defi.verifie ? evaluer(defi) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); };
  const choix = (k, opts) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{opts.map(([v, l]) =>
    <button key={v} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, '#0ea5e9')}>{l}</button>)}</div>;
  const txt = { fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const solide = defi.type === 'verdict' && ESPECES[defi.b].famille !== 'liq';
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'verdict' && <>
        <div style={txt}>🎯 {solide
          ? <>On met <strong>{nomEsp(defi.b)}</strong> (soluté B) dans <strong>{nomEsp(defi.a)}</strong> (solvant A). Se dissout-il ?</>
          : <>On verse ensemble <strong>{nomEsp(defi.a)}</strong> (liquide A) et <strong>{nomEsp(defi.b)}</strong> (liquide B). Obtient-on une seule phase ?</>} Prévoyez, <strong>avant de regarder le bilan</strong>, ce qui se passe.
          Le bilan s’affiche ci-dessous : à vous de le lire pour vérifier votre raisonnement.</div>
        {choix('v', solide ? [['ok', 'soluble'], ['lim', 'peu soluble'], ['non', 'insoluble']] : [['ok', 'miscibles'], ['lim', 'cas limite'], ['non', 'non miscibles']])}</>}
      {defi.type === 'dominant' && <>
        <div style={txt}>🎯 Mélange de <strong>{nomEsp(defi.a)}</strong> et <strong>{nomEsp(defi.b)}</strong>. Quel type d’interaction fait perdre le plus d’énergie entre l’état initial et l’état final ?</div>
        {choix('t', TYPES.map(t => [t.k, t.court]))}</>}
      {defi.type === 'extraction' && <>
        <div style={txt}>🎯 On veut extraire <strong>{nomEsp(defi.sol)}</strong> d’une solution aqueuse par extraction liquide-liquide. Quel solvant choisir ? (Au moins un des solvants proposés convient ; la sécurité n’est pas considérée ici.) Le dossier des bilans s’affiche après la vérification.</div>
        {choix('c', defi.choix.map(c => [c, nomEsp(c)]))}</>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>{res.lignes.map(([ok, t], i) => <div key={i} style={{ color: ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'verdict' && <>Réponse du modèle : <strong>{(solide ? ETIQ_SOL : ETIQ_LIQ)[bilan(defi.a, defi.b).classe]}</strong> (perte totale : {nb(bilan(defi.a, defi.b).total)} {unite(bilan(defi.a, defi.b))}).</>}
        {defi.type === 'dominant' && <>C’est la <strong>{bilan(defi.a, defi.b).dom.court}</strong> qui perd le plus : {nb(bilan(defi.a, defi.b).dom.perte)} {unite(bilan(defi.a, defi.b))}.</>}
        {defi.type === 'extraction' && <>Solvant(s) valable(s) : <strong>{defi.choix.filter(c => validExtract(c, defi.sol)).map(nomEsp).join(', ')}</strong>.</>}</div>}
    </div>);
}

// =====================================================================================================
export function SimulationSolubilite() {
  const [mode, setMode] = useState('explore');
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('solubilite-guide-v3', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [sel, setSel] = useState({ solv: 'eau', sol: 'ethanol' });
  const [hypoOuv, setHypoOuv] = useState(false);
  const [limOuv, setLimOuv] = useState(false);
  const [pt, setPt] = useState(null);                    // point de l'échelle de polarité pointé ou touché
  const [ouv, setOuv] = useState({ cartes: true });      // blocs dépliés au fur et à mesure
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;
  const choisir = patch => setSel(s => ({ ...s, ...patch }));

  const solv = enDefi && defi.type !== 'extraction' ? defi.a : enDefi ? 'eau' : sel.solv;
  const sol = enDefi ? (defi.type === 'extraction' ? defi.sol : defi.b) : sel.sol;
  const b = solv === sol ? null : bilan(solv, sol);
  const liquide = ESPECES[sol].famille === 'liq';
  const ETIQ = liquide ? ETIQ_LIQ : ETIQ_SOL;
  const masque = enDefi && defi.type === 'verdict';        // le défi demande de prédire avant de lire le verdict

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const est = (a, e) => sel.solv === a && sel.sol === e;
  const bw = (s, e) => bilan(s, e);
  const ETAPES = [
    { id: 'intro', titre: 'Deux états à comparer', focus: ['choix'],
      texte: <>Pour savoir si <strong>deux liquides se mélangent</strong> ou si <strong>un solide se dissout</strong>, on compare deux états : l’<strong>état initial</strong> (chaque espèce seule : interactions A…A et B…B) et l’<strong>état final</strong> envisagé (les deux espèces mélangées : interactions A…B). Si l’on y perd beaucoup de stabilité, le mélange ne se fait pas.</>,
      tache: { type: 'qcm', q: 'Dans l’état initial (eau pure et éthanol pur séparés), quelle est la plus forte interaction entre molécules d’eau ?', options: ['la liaison hydrogène', 'la dispersion (dipôles instantanés)', 'l’interaction ion–ion'], bonne: 0,
        expl: 'L’eau possède des H liés à O (donneurs) et des O (accepteurs) : chaque molécule établit des liaisons hydrogène (≈ 17 kJ/mol chacune), bien plus fortes que les interactions de Van der Waals.' } },
    { id: 'vocab', titre: 'Miscibilité ou solubilité ?', focus: ['notion'],
      texte: <>Deux <strong>liquides</strong> sont <strong>miscibles</strong> s’ils forment une seule phase quelles que soient les proportions (eau et éthanol), <strong>non miscibles</strong> s’ils restent en deux phases (eau et huile). Aucun des deux n’est « le soluté » : ils jouent le même rôle, on les appelle simplement A et B.
        Pour un <strong>solide</strong> dans un liquide, on parle de <strong>solubilité</strong> : le liquide est le <strong>solvant</strong>, le solide est le <strong>soluté</strong>, et il y a une quantité maximale que l’on peut dissoudre (au-delà, le solide reste au fond : la solution est saturée).</>,
      tache: { type: 'qcm', q: 'On verse de l’huile dans du vinaigre (de l’eau) : deux phases apparaissent. On dit que…', options: ['l’huile et l’eau sont non miscibles', 'l’huile est insoluble dans l’eau, qui est le solvant', 'l’huile est un soluté saturé'], bonne: 0,
        expl: 'Ce sont deux liquides : on parle de miscibilité. Le même raisonnement (comparer état initial et état final) vaut pour la miscibilité de deux liquides et pour la solubilité d’un solide.' } },
    { id: 'ee', titre: 'Eau et éthanol', focus: ['paires', 'bilan'],
      texte: <>Choisissez l’<strong>eau</strong> (liquide A) et l’<strong>éthanol</strong> (liquide B), puis dépliez « Interactions possibles ». L’eau et l’éthanol ont tous les deux des H liés à O et des O porteurs de doublets non liants : la liaison H se fait entre un H lié à O et un doublet non liant d’un O voisin, dans l’alignement de la liaison O–H.</>,
      tache: { type: 'action', ok: est('eau', 'ethanol'), label: 'Eau + éthanol', faire: () => setSel({ solv: 'eau', sol: 'ethanol' }), consigne: 'A : eau ; B : éthanol' } },
    { id: 'eeq', titre: 'Une petite perte', focus: ['bilan'],
      texte: <>Les liaisons hydrogène eau…eau et éthanol…éthanol sont en grande partie remplacées par des liaisons eau…éthanol de même nature. Le cadre du verdict compare la perte à ce que l’agitation thermique peut compenser.</>,
      tache: { type: 'qcm', q: 'Pour l’eau et l’éthanol, la perte totale est…', options: ['faible : bien inférieure à ce que l’agitation thermique compense, donc miscibles', 'énorme : on perd toutes les liaisons H', 'nulle pour chaque type d’interaction'], bonne: 0,
        expl: 'Chaque liaison H rompue (O–H…O) est presque toujours remplacée par une autre liaison O–H…O. Il reste une petite perte (l’éthanol a moins de sites de liaison H que l’eau), bien inférieure au seuil : l’eau et l’éthanol sont miscibles en toutes proportions.' } },
    { id: 'eh', titre: 'Eau et hexane', focus: ['choix', 'paires'],
      texte: <>Choisissez maintenant l’<strong>eau</strong> (A) et l’<strong>hexane</strong> (B). L’hexane est constitué de molécules apolaires : aucune liaison H, aucun dipôle permanent.</>,
      tache: { type: 'action', ok: est('eau', 'hexane'), label: 'Eau + hexane', faire: () => setSel({ solv: 'eau', sol: 'hexane' }), consigne: 'A : eau ; B : hexane' } },
    { id: 'ehq', titre: 'Ce que l’on perd', focus: ['bilan'],
      texte: <>Dans l’état final, une molécule d’eau voisine d’une molécule d’hexane ne peut plus faire de liaison H avec elle.</>,
      tache: { type: 'qcm', q: 'Quelle interaction est responsable de la grosse perte de stabilité ?', options: ['la liaison hydrogène eau…eau, perdue et non remplacée', 'la dispersion, qui devient plus forte', 'les interactions ioniques'], bonne: 0,
        expl: 'Les liaisons H eau…eau (état initial) ne sont remplacées que par de faibles interactions de Van der Waals eau…hexane. La perte est énorme : l’eau et l’hexane ne sont pas miscibles.' } },
    { id: 'ehn', titre: 'Un ordre de grandeur', focus: ['bilan'],
      texte: <>Survolez (ou touchez) les deux barres de la liaison hydrogène : celle de gauche (état initial) et celle de droite (état final). Les valeurs sont en kJ pour 1 L de mélange (0,5 L d’eau + 0,5 L d’hexane). La perte est la différence entre les deux : c’est le pointillé rouge.</>,
      tache: { type: 'num', q: 'Perte liée à la liaison hydrogène (initial − final, en kJ par litre)', unite: 'kJ/L', vrai: bw('eau', 'hexane').types[2].perte, tol: 0.06, affiche: v => nb(v), cs: 2,
        bloque: est('eau', 'hexane') ? null : 'Faites d’abord l’étape précédente (eau + hexane).',
        expl: 'On trouve environ 447 kJ/L pour la seule liaison H, et plus de 500 kJ/L au total : environ quatre fois ce que l’agitation thermique peut compenser pour des molécules de cette taille (≈ 130 kJ/L).' } },
    { id: 'hc', titre: 'Qui se ressemble s’assemble', focus: ['choix', 'bilan'],
      texte: <>Choisissez l’<strong>hexane</strong> (A) et le <strong>cyclohexane</strong> (B).</>,
      tache: { type: 'action', ok: est('hexane', 'cyclohexane'), label: 'Hexane + cyclohexane', faire: () => setSel({ solv: 'hexane', sol: 'cyclohexane' }), consigne: 'A : hexane ; B : cyclohexane' } },
    { id: 'hcq', titre: 'Pas de perte', focus: ['bilan'],
      texte: <>Les deux liquides n’ont que des interactions de dispersion, de même ordre de grandeur.</>,
      tache: { type: 'qcm', q: 'Hexane et cyclohexane sont…', options: ['miscibles : les interactions A…B sont comparables aux interactions A…A et B…B', 'non miscibles', 'miscibles grâce aux liaisons hydrogène'], bonne: 0,
        expl: 'Le bilan est pratiquement nul : on remplace des interactions de dispersion par des interactions de dispersion équivalentes.' } },
    { id: 'cont', titre: 'Une échelle continue de polarité', focus: ['echelle'],
      texte: <>Une molécule n’est pas « polaire » ou « apolaire » : sa cohésion se répartit entre dispersion, dipôles permanents et liaisons H. L’échelle place chaque espèce selon la <strong>part polaire de sa cohésion</strong> (dipôles + liaisons H), de 0 % (hexane) à près de 90 % (eau).</>,
      tache: { type: 'qcm', q: 'Où se place l’éthanol sur cette échelle ?', options: ['entre les deux : environ deux tiers de sa cohésion sont polaires (groupe OH), le reste vient de la chaîne C₂H₅', 'tout à gauche, avec l’hexane', 'tout à droite, au-delà de l’eau'], bonne: 0,
        expl: 'Le groupe OH apporte liaisons H et dipôle ; la chaîne éthyle n’apporte que de la dispersion. L’éthanol est intermédiaire : c’est pour cela qu’il se mélange à l’eau et, en partie, aux solvants apolaires.' } },
    { id: 'alc', titre: 'Allonger la chaîne carbonée', focus: ['choix', 'echelle', 'bilan'],
      texte: <>Gardez l’<strong>eau</strong> en A et essayez successivement en B le méthanol, l’éthanol, le propan-1-ol, le butan-1-ol, le pentan-1-ol, puis l’<strong>octan-1-ol</strong>. Tous ont un seul groupe OH.</>,
      tache: { type: 'action', ok: est('eau', 'octanol'), label: 'Eau + octan-1-ol', faire: () => setSel({ solv: 'eau', sol: 'octanol' }), consigne: 'A : eau ; B : octan-1-ol' } },
    { id: 'alcq', titre: 'Un groupe OH dilué', focus: ['bilan'],
      texte: <>Le même groupe OH est porté par une chaîne de plus en plus longue.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’octan-1-ol n’est-il pas miscible à l’eau alors que l’éthanol l’est ?', options: ['son unique groupe OH est « noyé » dans une longue chaîne apolaire : la plupart des contacts avec l’eau se font par la chaîne', 'il n’a pas de groupe OH', 'il est ionique'], bonne: 0,
        expl: 'La part polaire de la cohésion passe de 74 % (méthanol) à 35 % (octanol). Avec l’eau, l’octanol fait surtout des contacts chaîne…eau, qui ne remplacent pas les liaisons H eau…eau. L’octan-1-ol sert justement de référence pour mesurer le caractère lipophile d’une espèce (coefficient de partage octanol/eau).' } },
    { id: 'lim', titre: 'Un cas limite : éthanol et hexane', focus: ['choix', 'bilan'],
      texte: <>L’éthanol possède un groupe OH polaire et une chaîne éthyle apolaire : c’est une molécule <strong>amphiphile</strong>. Choisissez l’<strong>éthanol</strong> (A) et l’<strong>hexane</strong> (B).</>,
      tache: { type: 'action', ok: est('ethanol', 'hexane'), label: 'Éthanol + hexane', faire: () => setSel({ solv: 'ethanol', sol: 'hexane' }), consigne: 'A : éthanol ; B : hexane' } },
    { id: 'limq', titre: 'Pas tout noir ni tout blanc', focus: ['bilan'],
      texte: <>La perte est bien plus faible qu’avec l’eau (une seule liaison H par molécule d’éthanol, et une chaîne carbonée qui interagit bien avec l’hexane).</>,
      tache: { type: 'qcm', q: 'Pour ce couple, le modèle indique…', options: ['un cas limite : la miscibilité dépend de la température et des proportions', 'des liquides parfaitement miscibles', 'des liquides parfaitement non miscibles'], bonne: 0,
        expl: 'L’éthanol et l’hexane sont miscibles à température ambiante mais se séparent si l’on refroidit : la perte d’énergie est du même ordre que ce que l’agitation thermique peut compenser.' } },
    { id: 'i2', titre: 'Un solide : le diiode', focus: ['choix', 'bilan'],
      texte: <>Avec un solide, on parle maintenant de <strong>solubilité</strong> : A est le solvant, B le soluté. Le soluté doit d’abord « sortir » de son cristal. Choisissez le <strong>cyclohexane</strong> comme solvant et le <strong>diiode</strong> comme soluté, puis passez à l’<strong>eau</strong>.</>,
      tache: { type: 'action', ok: est('eau', 'diiode'), label: 'Diiode dans l’eau', faire: () => setSel({ solv: 'eau', sol: 'diiode' }), consigne: 'Solvant A : eau ; soluté B : diiode' } },
    { id: 'i2q', titre: 'Pourquoi le diiode quitte l’eau', focus: ['bilan'],
      texte: <>Comparez le bilan dans l’eau et le bilan dans le cyclohexane (essayez-le avec les boutons de solvant).</>,
      tache: { type: 'qcm', q: 'Le diiode (apolaire) est très peu soluble dans l’eau parce que…', options: ['les liaisons H eau…eau (cohésion du solvant) ne sont pas compensées par des interactions diiode…eau', 'le diiode est un solide ionique', 'le diiode est trop gros pour l’eau'], bonne: 0,
        expl: 'Pour loger une molécule de diiode, l’eau doit rompre des liaisons H qu’elle ne retrouve pas. Dans le cyclohexane, il n’y a que de la dispersion de part et d’autre : aucune perte significative. C’est le principe de l’extraction du diiode par le cyclohexane.' } },
    { id: 'soudan', titre: 'Le rouge Soudan', focus: ['choix', 'cartes'],
      texte: <>Le rouge Soudan III colore les graisses. Sa formule comporte un groupe OH et quatre atomes N… mais regardez les zones <span style={{ background: '#fde68a', padding: '0 3px' }}>jaunes</span> (lipophiles) et <span style={{ background: '#bfdbfe', padding: '0 3px' }}>bleues</span> (hydrophiles). Choisissez l’<strong>huile</strong> comme solvant et le <strong>rouge Soudan</strong> comme soluté.</>,
      tache: { type: 'action', ok: est('huile', 'soudan'), label: 'Rouge Soudan dans l’huile', faire: () => setSel({ solv: 'huile', sol: 'soudan' }), consigne: 'Solvant A : huile ; soluté B : rouge Soudan III' } },
    { id: 'soudanq', titre: 'Un OH « caché »', focus: ['cartes', 'echelle'],
      texte: <>Le pointillé bleu dans la formule est une <strong>liaison H interne</strong> : le H du groupe OH est lié à un N du groupe azo de la même molécule. Essayez aussi l’eau et l’éthanol.</>,
      tache: { type: 'qcm', q: 'Pourquoi le rouge Soudan est-il soluble dans l’huile mais pas dans l’eau ?', options: ['ses groupes polaires sont peu nombreux, dont un OH engagé dans une liaison H interne : sa cohésion est surtout de la dispersion, comme celle de l’huile', 'parce qu’il n’a aucun atome électronégatif', 'parce qu’il est ionique'], bonne: 0,
        expl: 'Avec 4 noyaux aromatiques et un OH « occupé », la part polaire de sa cohésion n’est que d’environ 10 % : il ressemble à l’huile. Dans l’éthanol (intermédiaire), il est peu soluble ; dans l’eau, il est insoluble.' } },
    { id: 'carmin', titre: 'Le rouge de cochenille', focus: ['choix', 'cartes'],
      texte: <>L’acide carminique (rouge de cochenille) possède lui aussi des noyaux aromatiques, mais aussi un sucre, six OH libres et un groupe COOH. Choisissez l’<strong>eau</strong> comme solvant et l’<strong>acide carminique</strong> comme soluté.</>,
      tache: { type: 'action', ok: est('eau', 'carmin'), label: 'Cochenille dans l’eau', faire: () => setSel({ solv: 'eau', sol: 'carmin' }), consigne: 'Solvant A : eau ; soluté B : acide carminique' } },
    { id: 'carminq', titre: 'Un équilibre hydrophile / lipophile', focus: ['bilan', 'echelle'],
      texte: <>Le modèle répond « peu soluble » dans l’eau. Essayez aussi l’éthanol et l’huile.</>,
      tache: { type: 'qcm', q: 'Que retenir pour l’acide carminique ?', options: ['ses nombreux OH le rendent soluble dans l’éthanol et assez soluble dans l’eau pour la colorer intensément, mais il est insoluble dans l’huile', 'il est soluble dans l’huile car il est aromatique', 'il est insoluble partout'], bonne: 0,
        expl: 'Sa partie aromatique (lipophile) et sa partie sucre + OH (hydrophile) se font concurrence : environ 60 % de sa cohésion est polaire. Sa solubilité dans l’eau est de l’ordre du gramme par litre (valeur de la littérature, à confirmer) : c’est « peu soluble » au sens du chimiste, mais largement assez pour une couleur rouge intense. L’éthanol, intermédiaire, lui convient très bien. Dans l’huile, ses OH ne trouvent pas de partenaires : insoluble.' } },
    { id: 'nacl', titre: 'Le sel : NaCl dans l’eau', focus: ['choix', 'bilan'],
      texte: <>Pour un solide ionique, c’est l’interaction ion–ion qui assure la cohésion : <strong>492 kJ/mol</strong> pour une paire Na⁺/Cl⁻ au contact (282 pm). Mais dans un solvant, cette attraction est divisée par la permittivité ε du solvant (« écran »). Choisissez l’<strong>eau</strong> et le <strong>chlorure de sodium</strong>.</>,
      tache: { type: 'action', ok: est('eau', 'nacl'), label: 'NaCl dans l’eau', faire: () => setSel({ solv: 'eau', sol: 'nacl' }), consigne: 'Solvant A : eau ; soluté B : chlorure de sodium' } },
    { id: 'nacln', titre: 'Écran de l’eau', focus: ['bilan'],
      texte: <>L’eau a une permittivité relative ε = 78,4.</>,
      tache: { type: 'num', q: 'Attraction Na⁺/Cl⁻ au contact dans l’eau (kJ/mol)', unite: 'kJ/mol', vrai: bw('eau', 'nacl').dans, tol: 0.03, affiche: v => nb(v), cs: 2,
        bloque: est('eau', 'nacl') ? null : 'Faites d’abord l’étape précédente.',
        expl: 'On trouve 6,3 kJ/mol, de l’ordre de 2,5 RT (RT = 2,5 kJ/mol à 25 °C) : l’agitation thermique suffit à séparer les ions.' } },
    { id: 'naclq', titre: 'Et dans l’éthanol ?', focus: ['choix', 'bilan'],
      texte: <>Choisissez maintenant l’<strong>éthanol</strong> comme solvant.</>,
      tache: { type: 'qcm', q: 'Pourquoi NaCl est-il beaucoup moins soluble dans l’éthanol ?', options: ['ε est plus faible (24,5) : l’attraction Na⁺/Cl⁻ reste forte (20 kJ/mol) et les ions restent associés', 'l’éthanol ne contient pas d’oxygène', 'l’éthanol est apolaire'], bonne: 0,
        bloque: null,
        expl: 'L’écran est trois fois moins efficace que dans l’eau. L’attraction résiduelle (≈ 20 kJ/mol, soit 8 RT) dépasse ce que l’agitation thermique peut compenser. À retenir : les solides ioniques ne sont pratiquement solubles que dans l’eau.' } },
    { id: 'extr', titre: 'Application : l’extraction', focus: [],
      texte: <>Extraire une espèce d’une solution aqueuse, c’est la transférer dans un second solvant. Il faut qu’elle y soit très soluble (bilan faible) et que ce solvant ne se mélange pas à l’eau (grosse perte eau…solvant).</>,
      tache: { type: 'qcm', q: 'Pour extraire le diiode d’une solution aqueuse, on choisit…', options: ['le cyclohexane : non miscible avec l’eau, et dissout bien le diiode', 'l’éthanol : il dissout bien le diiode', 'l’acétone : miscible à l’eau'], bonne: 0,
        expl: 'L’éthanol et l’acétone sont miscibles à l’eau : il n’y aurait qu’une seule phase, donc pas d’extraction possible.' } },
    { id: 'limites', titre: 'Les limites du modèle', focus: [],
      texte: <>Le bilan d’énergie est un outil puissant, mais il ne dit pas tout. Il ne tient pas compte de l’<strong>entropie</strong> : l’agitation thermique favorise le mélange, d’environ RT·ln 2 ≈ 1,7 kJ/mol à 25 °C. Il se trompe aussi sur certains couples : par exemple il annonce un « cas limite » pour l’eau et l’acétone, qui sont miscibles. Les seuils utilisés ici sont réglés sur des cas connus : ce sont des repères, pas des lois.</>,
      tache: { type: 'qcm', q: 'Un résultat « cas limite » signifie…', options: ['que le mélange peut se produire ou non selon la température et les proportions', 'que le modèle a fait une erreur de calcul', 'que les liquides sont non miscibles'], bonne: 0,
        expl: 'Quand la perte est de l’ordre de grandeur de l’énergie thermique disponible, les deux issues sont possibles : seule l’expérience (ou un calcul plus complet) tranche.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>Deux liquides : miscibles ou non. Un solide dans un liquide : soluble ou non (solubilité limitée).</li>
        <li>Pour prévoir, on compare l’état initial (A…A et B…B) à l’état final (A…B).</li>
        <li>Trois interactions de molécules : liaison H (≈ 17 kJ/mol), dipôle–dipôle, dispersion ; entre ions : interaction ion–ion, écrantée par le solvant.</li>
        <li>« Qui se ressemble s’assemble » : c’est quand les interactions A…B ressemblent aux interactions A…A et B…B que la perte est faible.</li>
        <li>Entre « polaire » et « apolaire », il y a un continuum : une molécule est un équilibre entre parties hydrophiles et lipophiles.</li>
        <li>Les solides ioniques ne sont pratiquement solubles que dans l’eau (ε élevé, solvatation).</li>
        <li>Pour une extraction : soluté très soluble dans le solvant extracteur, et solvant non miscible à la phase d’origine.</li></ul>,
      texte: <>Vous savez prévoir solubilité et miscibilité en comparant les interactions avant et après. Passez aux défis !</>, tache: null },
  ];
  const cadre = id => enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  function lancer(type) { setDefi(nouveauDefi(type)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'verdict'); }

  // ════════════════ PANNEAUX ════════════════
  const R = roles(liquide);
  const bouton = (id, role) => <button key={id} onClick={() => choisir({ [role]: id })} style={stylePetitBouton(sel[role] === id, role === 'solv' ? '#0284c7' : '#7c3aed')}>{ESPECES[id].nom}</button>;
  const choix = !enDefi && (
    <div style={{ ...styleBoite, ...cadre('choix') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Choisir les deux espèces</div>
      <div style={{ fontSize: 13, color: '#0284c7', fontWeight: 700, margin: '2px 0 4px' }}>Espèce A — un liquide</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>{ORDRE_LIQ.map(i => bouton(i, 'solv'))}</div>
      <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700, margin: '2px 0 4px' }}>Espèce B — un liquide (question de miscibilité) ou un solide (question de solubilité)</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>{ORDRE_LIQ.map(i => bouton(i, 'sol'))}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontSize: 12.5, color: KIT.txt2 }}>solides :</span>{ORDRE_SOL.map(i => bouton(i, 'sol'))}</div>
    </div>);

  // la question posée : miscibilité (deux liquides) ou solubilité (un solide)
  const notion = (
    <div style={{ ...styleBoite, ...cadre('notion'), background: liquide ? '#f0f9ff' : '#fdf4ff', fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
      {liquide
        ? <>💧💧 <strong>Deux liquides : question de miscibilité.</strong> Obtient-on une seule phase (liquides <strong>miscibles</strong>) ou deux phases superposées (<strong>non miscibles</strong>) ? A et B jouent le même rôle : aucun n’est « le soluté ».</>
        : <>🧂 <strong>Un solide dans un liquide : question de solubilité.</strong> Le liquide A est le <strong>solvant</strong>, le solide B est le <strong>soluté</strong>. Le soluté se dissout-il ? Il existe une quantité maximale dissoute par litre de solvant : la <strong>solubilité</strong> (en g/L).</>}
      <details style={{ marginTop: 4, fontSize: 13.5 }}><summary style={{ cursor: 'pointer', color: KIT.txt2, fontWeight: 600 }}>Miscibilité ou solubilité : quelle différence ?</summary>
        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
          <li><strong>Miscibilité</strong> (deux liquides) : eau et éthanol sont miscibles en toutes proportions (toujours une seule phase) ; eau et huile sont non miscibles (deux phases). Entre les deux, des liquides <strong>partiellement miscibles</strong> : un peu de butan-1-ol se mélange à l’eau, mais au-delà d’environ 7 % en masse une seconde phase apparaît.</li>
          <li><strong>Solubilité</strong> (un solide dans un liquide) : on peut dissoudre au plus 360 g de sel dans 1 L d’eau à 25 °C ; au-delà, le sel reste au fond (solution saturée). « Insoluble » veut dire en pratique « très peu soluble ».</li>
          <li>Dans les deux cas, <strong>le raisonnement est le même</strong> : on compare la stabilité de l’état initial (A seul, B seul) à celle de l’état final (A et B mélangés).</li>
        </ul></details>
    </div>);

  // ---------- blocs dépliables, ouverts au fur et à mesure ----------
  const ion = ESPECES[sol].famille === 'ion';
  const BLOCS = [['cartes', '1. Les deux espèces : formules et cohésion'], ['echelle', '2. Une échelle continue : de l’apolaire au polaire'],
    ...(ion ? [] : [['paires', '3. Interactions possibles : état initial → état final']]), ['bilan', `${ion ? 3 : 4}. Bilan énergétique et verdict`]];
  const focusGuide = enGuide ? (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []) : [];
  const estOuvert = k => enDefi || !!ouv[k] || focusGuide.includes(k);
  const bloc = (k, contenu) => {
    const i = BLOCS.findIndex(x => x[0] === k), o = estOuvert(k), suiv = BLOCS[i + 1];
    return (
      <div key={k} style={{ ...styleBoite, ...cadre(k) }}>
        <button onClick={() => setOuv(v => ({ ...v, [k]: !o }))} aria-expanded={o}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 15.5, fontWeight: 700, color: KIT.txt }}>
          <span>{BLOCS[i][1]}</span><span style={{ fontSize: 12, color: KIT.txt2, fontWeight: 600 }}>{o ? '▲ replier' : '▼ déplier'}</span></button>
        {o && <div style={{ marginTop: 8 }}>{contenu}
          {suiv && !estOuvert(suiv[0]) && <button onClick={() => setOuv(v => ({ ...v, [suiv[0]]: true }))} style={{ ...styleBouton(true, '#334155'), marginTop: 10 }}>Étape suivante : {suiv[1]} ▼</button>}</div>}
      </div>);
  };

  const compo = id => {
    const m = ESPECES[id], t = m.dd ** 2 + m.dp ** 2 + m.dh ** 2, parts = [[m.dd ** 2 / t, '#9ca3af', 'dispersion'], [m.dp ** 2 / t, '#ea580c', 'dipôles permanents'], [m.dh ** 2 / t, '#2563eb', 'liaisons H']];
    return <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 12.5, color: KIT.txt }}><strong>Cohésion ≈ {nb(cohesion(id))} kJ/mol</strong> : énergie à fournir pour séparer complètement les molécules d’une mole{m.famille === 'liq' && m.V < 200 ? ' (c’est à peu près l’énergie de vaporisation)' : ''}. Elle se répartit ainsi :</div>
      <div style={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', border: '1px solid #cbd5e1', marginTop: 3 }}>
        {parts.map(([f, c, n]) => <div key={n} title={`${n} : ${Math.round(f * 100)} %`} style={{ width: `${f * 100}%`, background: c }}/>)}</div>
      <div style={{ fontSize: 12, color: KIT.txt2, marginTop: 2 }}>{parts.map(([f, , n]) => `${n} ${Math.round(f * 100)} %`).join(' · ')} — <strong>part polaire {Math.round(partPolaire(id) * 100)} %</strong></div>
    </div>;
  };
  const sitesH = id => {
    const an = ANA[id], m = ESPECES[id], n = an.don.length + an.acc.length, cm = 1000 / m.V;
    if (!n) return <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Aucun site de liaison H : ni H lié à O ou N, ni atome O ou N.</div>;
    return <div style={{ fontSize: 12.5, color: KIT.txt, marginTop: 4, lineHeight: 1.5 }}>
      Sites de liaison H libres par molécule : <strong>{an.don.length}</strong> H lié(s) à O ou N (donneurs) et <strong>{an.acc.length}</strong> atome(s) O ou N porteur(s) de doublets non liants (accepteurs){m.hbInterne ? ', sans compter ceux engagés dans une liaison H interne' : ''}.
      <br/>Concentration en sites : {nb(cm)} mol/L de molécules × {n} sites = <strong>{nb(cm * n)} mol de sites par litre</strong>{m.famille !== 'liq' ? ' (dans le solide)' : ''}.</div>;
  };
  const cartes = (
    <div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>
        <span style={{ background: '#bfdbfe', padding: '0 4px', borderRadius: 3 }}>zones hydrophiles</span> (O, N et H liés à O ou N) · <span style={{ background: '#fde68a', padding: '0 4px', borderRadius: 3 }}>zones lipophiles</span> (squelette carboné, I, Cl) · petits traits colorés : doublets non liants · <span style={{ color: '#2563eb', fontWeight: 700 }}>- - -</span> liaison H interne</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 10 }}>
        {[['A', R.nA, solv, '#0284c7'], ['B', R.nB, sol, '#7c3aed']].map(([r, n, id, c]) => <div key={r} style={{ background: '#fafaf9', borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: c }}>{n} : {ESPECES[id].nom}{ESPECES[id].nom.includes(ESPECES[id].formule) ? '' : ` (${ESPECES[id].formule})`}</div>
          {ESPECES[id].famille === 'ion'
            ? <svg viewBox="0 0 240 90" style={{ width: '100%' }}><circle cx="85" cy="45" r="20" fill="#fde68a" stroke="#b45309"/><text x="85" y="50" textAnchor="middle" fontWeight="800" fontSize="14">Na⁺</text>
              <circle cx="140" cy="45" r="26" fill="#bbf7d0" stroke="#15803d"/><text x="140" y="50" textAnchor="middle" fontWeight="800" fontSize="14">Cl⁻</text></svg>
            : <FormuleSVG id={id}/>}
          {ESPECES[id].famille === 'ion'
            ? <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Solide ionique : sa cohésion vient de l’attraction entre ions Na⁺ et Cl⁻.</div>
            : <><div style={{ fontSize: 12, color: KIT.txt2 }}>{ESPECES[id].dev ? 'Formule développée (tous les atomes sont écrits).' : 'Formule topologique : les atomes C et les H qui leur sont liés ne sont pas écrits.'}{ESPECES[id].estime ? ' ★ Valeurs estimées.' : ''}</div>
              {sitesH(id)}{compo(id)}</>}
          {ESPECES[id].groupes && <details style={{ fontSize: 12, color: KIT.txt2, marginTop: 4 }}><summary style={{ cursor: 'pointer' }}>Contributions de groupes (méthode de Hoftyzer–Van Krevelen)</summary>
            <table style={{ borderCollapse: 'collapse', marginTop: 4 }}><tbody>{ESPECES[id].groupes.map(([g, n2, , , , pol]) => <tr key={g}>
              <td style={{ padding: '1px 6px', background: pol ? '#dbeafe' : '#fef9c3' }}>{n2} × {g}</td><td style={{ padding: '1px 6px' }}>{pol ? 'hydrophile' : 'lipophile'}</td></tr>)}</tbody></table></details>}
          {ESPECES[id].note && <div style={{ fontSize: 12, color: '#92400e', marginTop: 3 }}>{ESPECES[id].note}</div>}
        </div>)}
      </div>
    </div>);

  // échelle continue de polarité : toutes les espèces moléculaires, A et B mises en évidence
  const echelle = (() => {
    const W = 640, H = 128, x = f => 30 + f * (W - 60);
    const ids = [...ORDRE_LIQ, ...ORDRE_SOL].filter(k => ESPECES[k].famille !== 'ion');
    const marque = (k, haut, col) => { const f = partPolaire(k), X = x(f);
      return <g key={`m${k}`}><line x1={X} y1={haut ? 30 : 70} x2={X} y2={50} stroke={col} strokeWidth="2.5"/>
        <text x={Math.min(W - 6, Math.max(6, X))} y={haut ? 24 : 86} textAnchor={X < 80 ? 'start' : X > W - 80 ? 'end' : 'middle'} fontSize="12.5" fontWeight="800" fill={col}>{haut ? 'A' : 'B'} : {nomEsp(k).replace(/ \(.*\)/, '')} ({Math.round(f * 100)} %)</text></g>; };
    return (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Échelle de polarité">
          <defs><linearGradient id="gradPol" x1="0" x2="1"><stop offset="0" stopColor="#fde68a"/><stop offset="1" stopColor="#93c5fd"/></linearGradient></defs>
          <rect x={x(0)} y="44" width={x(1) - x(0)} height="12" rx="6" fill="url(#gradPol)"/>
          {ids.map(k => <g key={k} style={{ cursor: 'pointer' }} tabIndex={0} role="button" aria-label={`${nomEsp(k)} : ${Math.round(partPolaire(k) * 100)} % polaire`}
            onMouseEnter={() => setPt(k)} onFocus={() => setPt(k)} onClick={() => setPt(k)}>
            <circle cx={x(partPolaire(k))} cy="50" r="10" fill="transparent"/>
            <circle cx={x(partPolaire(k))} cy="50" r={pt === k ? 7 : 4.5} fill={pt === k ? '#0f172a' : '#334155'} stroke="#fff" strokeWidth="1.5" opacity={pt === k ? 1 : 0.7}/></g>)}
          {ESPECES[solv].famille !== 'ion' && marque(solv, true, '#0284c7')}
          {ESPECES[sol].famille !== 'ion' && marque(sol, false, '#7c3aed')}
          {[0, 25, 50, 75, 100].map(v => <text key={v} x={x(v / 100)} y="104" textAnchor="middle" fontSize="11" fill="#64748b">{v} %</text>)}
          <text x={x(0)} y="120" fontSize="11.5" fontWeight="700" fill="#a16207">◀ lipophile (cohésion par dispersion)</text>
          <text x={x(1)} y="120" textAnchor="end" fontSize="11.5" fontWeight="700" fill="#1d4ed8">hydrophile (dipôles, liaisons H) ▶</text>
        </svg>
        <div style={{ minHeight: 26, margin: '2px 0 6px', padding: '4px 8px', borderRadius: 6, background: pt ? '#f1f5f9' : 'transparent', fontSize: 13.5, color: KIT.txt }}>
          {pt ? <><strong>{nomEsp(pt).replace(/ \(.*\)/, '')}</strong> : part polaire de la cohésion ≈ <strong>{Math.round(partPolaire(pt) * 100)} %</strong> (dipôles {Math.round(ESPECES[pt].dp ** 2 / (ESPECES[pt].dd ** 2 + ESPECES[pt].dp ** 2 + ESPECES[pt].dh ** 2) * 100)} % + liaisons H {Math.round(ESPECES[pt].dh ** 2 / (ESPECES[pt].dd ** 2 + ESPECES[pt].dp ** 2 + ESPECES[pt].dh ** 2) * 100)} %)</>
            : <span style={{ color: KIT.txt2 }}>👆 Passez la souris sur un point gris (ou touchez-le) : le nom de l’espèce et sa part polaire s’affichent ici.</span>}</div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, lineHeight: 1.5 }}>Une molécule n’est pas « polaire » ou « apolaire » : on la place ici selon la part de sa cohésion due aux dipôles permanents et aux liaisons H. Deux espèces proches sur l’échelle ont des chances de se mélanger ; mais l’échelle ne suffit pas : le bilan tient aussi compte de la taille des molécules et des partenaires de liaison H.</div>
      </div>);
  })();

  const paires = b && !ion && (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 3 }}>🔹 État initial : A et B séparés</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PaireSVG a={solv} b={solv} titre="A…A" sous={`${nomEsp(solv).replace(/ \(.*\)/, '')} seul`}/><PaireSVG a={sol} b={sol} titre="B…B" sous={`${nomEsp(sol).replace(/ \(.*\)/, '')} seul`}/></div></div>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 3 }}>🔸 État final envisagé : A et B mélangés</div>
          <PaireSVG a={solv} b={sol} titre="A…B" sous={liquide ? 'les deux liquides mélangés' : 'soluté B entouré de solvant A'}/>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.55 }}>
            <span style={{ color: COUL_INTER.h, fontWeight: 700 }}>- - -</span> liaison hydrogène : un H lié à O (ou N), δ+, pointe vers un doublet non liant d’un O (ou N) voisin, δ−, dans l’alignement de la liaison O–H.<br/>
            <span style={{ color: COUL_INTER.p, fontWeight: 700 }}>· · ·</span> dipôle–dipôle : la charge partielle δ+ d’une molécule face à la charge δ− de l’autre.<br/>
            <span style={{ color: COUL_INTER.d, fontWeight: 700 }}>~~~</span> dispersion (dipôles instantanés) : seule interaction dessinée quand il n’y a ni liaison H ni dipôle, mais <strong>toujours présente</strong> entre molécules au contact.<br/>
            Chaque dessin montre <em>une</em> disposition possible, figée : dans un liquide, les molécules bougent et changent sans cesse de voisines.</div></div>
      </div>
    </div>);

  const bilanPanneau = b && (
    <div>
      {ion ? <SceneIon solv={solv} b={b}/> : <Barres key={`${solv}-${sol}`} b={b} masque={masque}/>}
      {!masque && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, border: `2px solid ${COUL[b.classe]}`, background: '#fff' }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: COUL[b.classe] }}>
          {ion ? (b.classe === 'ok' ? 'Soluble' : b.classe === 'lim' ? 'Peu soluble (cas limite)' : 'Insoluble') : ETIQ[b.classe]} : {liquide ? `${nomEsp(solv)} et ${nomEsp(sol)}` : `${nomEsp(sol)} dans ${nomEsp(solv)}`}</div>
        {!ion && liquide && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 2, lineHeight: 1.55 }}>La balance penche à gauche : on perd environ <strong>{arr(b.total)} kJ</strong> pour 1 L de mélange, alors que l’agitation thermique peut en compenser environ <strong>{arr(b.crit)} kJ</strong> pour des molécules de cette taille (plus elles sont petites, plus elle compense).
          {b.rapport < SEUIL_LIQ[0] ? ' La perte reste dans la zone verte : le mélange est possible.' : b.rapport < SEUIL_LIQ[1] ? ' La perte est dans la zone orange : du même ordre que ce que l’agitation thermique peut compenser, donc cas limite.' : ` La perte dépasse ${b.rapport < 3 ? 'deux fois' : `d’environ ${Math.round(b.rapport)} fois`} ce que l’agitation thermique compense : zone rouge.`} Interaction qui décide : <strong>{b.dom.court}</strong>.</div>}
        {!ion && !liquide && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 2, lineHeight: 1.55 }}>La balance penche à gauche : on perd environ <strong>{arr(b.total)} kJ par mole</strong> de soluté dissous, soit environ {arr(b.total / RT)} fois RT (RT ≈ 2,5 kJ/mol : l’énergie de l’agitation thermique à 25 °C).
          {b.total < SEUIL_SOL[0] ? ' Zone verte : le soluté se dissout.' : b.total < SEUIL_SOL[1] ? ' Zone orange : peu soluble (cas limite).' : ' Zone rouge : la perte est trop grande, le soluté reste solide.'} Interaction qui décide : <strong>{b.dom.court}</strong>.</div>}
        {!ion && ESPECES[sol].colorant && b.classe !== 'non' && <div style={{ fontSize: 12.5, color: '#7c2d12', marginTop: 4 }}>🎨 Pour un colorant, même une faible solubilité (de l’ordre du gramme par litre, voire moins) suffit à colorer nettement la solution.</div>}
        {ion && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 2 }}>Attraction Na⁺/Cl⁻ restante dans le solvant : environ <strong>{arr(b.dans)} kJ/mol</strong> (≈ {arr(b.dans / RT)} RT).
          {b.classe === 'ok' ? ' L’agitation thermique suffit à séparer les ions : on peut les solvater.' : ' Les ions restent attirés l’un vers l’autre : le cristal se reforme.'}</div>}
        {!ion && b.comp && <div style={{ fontSize: 12.5, color: '#92400e', marginTop: 4 }}>Une liaison H A…B est possible (un H donneur d’un côté, un doublet accepteur de l’autre). {b.w > 0.95 ? 'Elle remplace entièrement les liaisons A…A et B…B : les deux espèces ont beaucoup de sites.' : `Elle ne remplace les liaisons A…A et B…B qu’à ${Math.round(b.w * 100)} % : les sites de l’une des espèces sont dilués dans une partie apolaire (voir la concentration en sites, bloc 1).`}</div>}
      </div>}
      {masque && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt2 }}>Le verdict est masqué : lisez le bilan, répondez, puis vérifiez.</div>}
    </div>);

  // ce que le modèle permet de dire… et ce qu'il ne dit pas
  const erreurs = BATTERIE.filter(([s2, e, r]) => bilan(s2, e).classe !== r);
  const ETQ = r => ({ ok: 'oui', lim: 'en partie', non: 'non' })[r];
  const limites = (
    <div style={{ ...styleBoite, border: '2px solid #f59e0b', background: '#fffbeb' }}>
      <Section titre="⚖️ Ce que ce modèle permet de dire… et ce qu’il ne dit pas" ouvert={limOuv} onBascule={() => setLimOuv(o => !o)}>
        <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
          <p style={{ margin: '0 0 6px' }}><strong>C’est un outil pour raisonner, pas pour calculer.</strong> Il sert à comprendre <em>pourquoi</em> deux espèces se mélangent ou non. Seule l’expérience tranche.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            <div><div style={{ fontWeight: 700, color: '#15803d' }}>✅ Il permet de dire</div>
              <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
                <li>qu’il faut comparer l’état initial (A…A, B…B) et l’état final (A…B) ;</li>
                <li>quelle interaction décide (liaison H, dipôles, dispersion) ;</li>
                <li>des ordres de grandeur d’énergie (dizaines ou centaines de kJ) ;</li>
                <li>des tendances : allonger une chaîne carbonée, ajouter des groupes OH, changer de solvant ;</li>
                <li>qu’entre « polaire » et « apolaire », il y a tout un continuum.</li></ul></div>
            <div><div style={{ fontWeight: 700, color: '#b91c1c' }}>❌ Il ne permet pas de dire</div>
              <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
                <li>la valeur d’une solubilité (en g/L) : seulement « soluble / peu soluble / insoluble » ;</li>
                <li>l’effet du désordre (l’<strong>entropie</strong>), qui favorise le mélange, ni l’organisation de l’eau autour des parties apolaires (effet hydrophobe) : en réalité ils comptent beaucoup ;</li>
                <li>l’effet de la température, du pH, de la vitesse de dissolution, ou d’un mélange de plus de deux espèces ;</li>
                <li>des valeurs sûres pour les espèces marquées ★ (huile, diiode, colorants) : elles sont estimées.</li></ul></div>
          </div>
          <p style={{ margin: '8px 0 4px' }}>Les seuils vert / orange / rouge ont été <strong>réglés sur des cas connus</strong> : ce sont des repères, pas des lois. Sur {BATTERIE.length} couples connus, le modèle donne la réponse attendue pour {BATTERIE.length - erreurs.length} d’entre eux. Il se trompe sur :</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>{erreurs.map(([s2, e, r]) => <li key={s2 + e}>{nomEsp(s2).replace(/ \(.*\)/, '')} et {nomEsp(e).replace(/ \(.*\)/, '')} : en réalité <strong>{ETQ(r)}</strong>, le modèle dit « {ETQ(bilan(s2, e).classe)} »</li>)}</ul>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, color: KIT.txt2 }}>(« oui » : miscibles ou soluble ; « en partie » : partiellement miscibles ou peu soluble ; « non » : non miscibles ou insoluble.) Une bonne occasion de discuter des limites d’un modèle !</p>
        </div>
      </Section>
      {!limOuv && <div style={{ fontSize: 13, color: KIT.txt2, padding: '0 12px 4px' }}>Un outil pour raisonner (comparer état initial et état final), pas pour calculer une solubilité. Dépliez pour voir ses limites et les cas où il se trompe.</div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Trois familles d’interactions entre molécules</strong> : dispersion, dipôle–dipôle (Van der Waals) et liaison hydrogène. La cohésion de chaque espèce est répartie entre elles par les paramètres de solubilité de Hansen δd, δp, δh (valeurs de tables, arrondies, pour les petites molécules).</li>
      <li><strong>Colorants</strong> (rouge Soudan III, acide carminique) : δ calculés par la méthode des <strong>contributions de groupes</strong> de Hoftyzer–Van Krevelen (δd = ΣFd/V, δp = √ΣFp²/V, δh = √(ΣEh/V)). Les contributions du groupe azo et des OH engagés dans une liaison H interne sont <em>estimées</em>. Les δ du diiode et de l’huile sont aussi estimés.</li>
      <li><strong>Part polaire de la cohésion</strong> : (δp² + δh²)/(δd² + δp² + δh²). C’est l’échelle continue affichée ; elle sert à visualiser, pas à calculer le verdict.</li>
      <li><strong>Mélange au hasard</strong> : 50/50 en volume pour deux liquides, soluté très dilué pour un solide. L’énergie A…B de dispersion (ou dipolaire) est la moyenne géométrique de A…A et B…B.</li>
      <li><strong>Liaison H A…B</strong> : elle n’existe que si l’une des espèces offre un H donneur et l’autre un accepteur. Elle remplace d’autant mieux les liaisons S…S et E…E que les deux espèces ont beaucoup de sites libres par unité de volume : poids w = min(1, (ρ/ρréf)²), ρ = concentration en sites libres (mol de sites par litre de liquide), ρréf = 40 mol/L (éthanol : 34 mol/L, w ≈ 0,7). Dans l’octanol, l’huile ou le rouge Soudan, les sites sont dilués dans une grande partie apolaire : w est petit.</li>
      <li><strong>Liaisons H internes</strong> : le H et l’accepteur engagés dans une liaison H à l’intérieur de la molécule (rouge Soudan, acide carminique) ne sont pas comptés comme disponibles pour le solvant.</li>
      <li><strong>Ce que compense l’agitation thermique</strong> : pour deux liquides, on compare la perte à la valeur critique de la théorie de Flory–Huggins, RT·½(1/√V_A + 1/√V_B)², qui dépend de la taille des molécules (de grosses molécules comme l’huile « profitent » moins du mélange). Pour un solide, on compare la perte par mole de soluté à quelques dizaines de RT.</li>
      <li><strong>L’entropie n’est pas calculée en détail</strong>, et l’effet hydrophobe est en réalité en grande partie d’origine entropique à 25 °C (organisation de l’eau autour des parties apolaires). Les « énergies » du modèle sont des énergies de cohésion effectives : elles traduisent bien le sens des phénomènes, pas leur détail.</li>
      <li><strong>Seuils</strong> : 1,25 et 2 pour le rapport des liquides, 25 et 70 kJ/mol pour les solides. Ils ont été réglés sur une batterie de 82 cas connus, sur laquelle le modèle en retrouve 73, sans inversion « miscible ↔ non miscible ». C’est une calibration, pas une validation indépendante.</li>
      <li><strong>Solide ionique</strong> : on applique la permittivité macroscopique ε du solvant à 282 pm. C’est grossier : les solvatations de Na⁺ et Cl⁻ compensent presque la cohésion du cristal (≈ 790 kJ/mol de part et d’autre).</li>
      <li><strong>Acide carminique dans l’eau</strong> : le modèle ne tient pas compte de l’ionisation partielle du groupe COOH dans l’eau, qui augmente encore sa solubilité.</li>
      <li><strong>Température 25 °C, pression atmosphérique</strong>, espèces pures.</li>
      <li><strong>Cas connus mal rendus</strong> : eau–acétone (miscibles, le modèle dit « cas limite »), eau–éther (peu miscibles, le modèle dit « non miscibles »), propan-1-ol ou butan-1-ol avec l’hexane (miscibles, « cas limite »). Une bonne occasion de discuter des limites d’un modèle.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Eau avec méthanol, éthanol, propan-1-ol, butan-1-ol, pentan-1-ol, octan-1-ol : suivez le point sur l’échelle de polarité et le rapport du verdict. Pourquoi la chaîne carbonée compte-t-elle ?</li>
        <li>Rouge Soudan et acide carminique dans l’eau, l’éthanol et l’huile : retrouvez-vous vos observations de TP ? Repérez les zones bleues et jaunes de leurs formules.</li>
        <li>Éthanol avec hexane, puis avec eau : quel type d’interaction décide dans chaque cas ?</li>
        <li>Huile avec eau, éthanol, hexane : le comportement en TP est-il bien rendu ?</li>
        <li>Diiode dans l’eau, l’éthanol, le cyclohexane : classez par ordre de solubilité décroissante.</li>
        <li>NaCl dans l’eau, le méthanol, l’éthanol, l’acétone : qu’est-ce qui change ?</li>
        <li>Cherchez un couple pour lequel le modèle donne « cas limite » alors que vous connaissez la réponse. Qu’en conclure ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>deux liquides : miscibles ou non ; un solide : soluble ou non</li>
        <li>on compare l’état initial (A…A, B…B) à l’état final (A…B)</li>
        <li>on perd de la stabilité quand une interaction forte (liaison H, ion–ion) n’est pas remplacée</li>
        <li>« qui se ressemble s’assemble » : A…B ≈ A…A ≈ B…B</li>
        <li>polaire / apolaire : un continuum, un équilibre hydrophile / lipophile</li>
        <li>solide ionique : ε élevé et solvatation, donc surtout l’eau</li>
        <li>extraction : soluté très soluble dans l’extracteur, extracteur non miscible à l’eau</li>
      </ul>
    </ARetenir>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button></span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .sl-col { display: flex; flex-direction: column; gap: 12px; }
        .sl-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .sl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Solubilité et miscibilité : le bilan des interactions</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Deux liquides se mélangent, ou un solide se dissout, quand on ne perd pas (trop) de stabilité en passant de l’état initial
        (A seul, B seul : interactions A…A et B…B) à l’état final (A et B mélangés : interactions A…B). Choisissez deux espèces, puis dépliez les blocs un par un.</div>
      <div className={`sl-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div className="sl-col">
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={lancer}/></div>}
          {enDefi && defi.type === 'extraction' && (defi.verifie || defi.solution) && <div style={{ ...styleBoite, fontSize: 13.5 }}>
            <strong>Dossier :</strong> pour chaque solvant candidat, le bilan « solvant / eau » (miscibilité) et « solvant / {nomEsp(defi.sol)} » (solubilité).
            <table style={{ width: '100%', marginTop: 6, fontSize: 13, borderCollapse: 'collapse' }}><tbody>{defi.choix.map(c => <tr key={c}>
              <td style={{ padding: '3px 6px', fontWeight: 700 }}>{nomEsp(c)}</td>
              <td style={{ padding: '3px 6px' }}>avec l’eau : <span style={{ color: COUL[bilan('eau', c).classe], fontWeight: 700 }}>{ETIQ_LIQ[bilan('eau', c).classe]}</span> ({nb(bilan('eau', c).total)} kJ/L)</td>
              <td style={{ padding: '3px 6px' }}>avec {nomEsp(defi.sol)} : <span style={{ color: COUL[bilan(c, defi.sol).classe], fontWeight: 700 }}>{ETIQ_SOL[bilan(c, defi.sol).classe]}</span> ({nb(bilan(c, defi.sol).total)} kJ/mol)</td></tr>)}</tbody></table></div>}
          {choix}
          {!(enDefi && defi.type === 'extraction') && (solv === sol ? <div style={styleBoite}>Choisissez deux espèces différentes.</div> : <>
            {notion}{bloc('cartes', cartes)}{bloc('echelle', echelle)}{!ion && bloc('paires', paires)}{bloc('bilan', bilanPanneau)}</>)}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      <div style={{ marginBottom: 12 }}>{limites}</div>
      {!enDefi && <div className="sl-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="sl-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
