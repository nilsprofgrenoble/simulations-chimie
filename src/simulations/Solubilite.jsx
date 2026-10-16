import { useSignalerMode, useSuivi, declarerDefis } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, lireProgression } from "../commun";
import { ESPECES, ANA, ORDRE_LIQ, ORDRE_SOL, TYPES, bilan, complementaire, RT, K_COULOMB, D_NACL, SEUIL_LIQ, SEUIL_SOL, SEUIL_ION } from "./solubiliteModele";

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
const unite = b => b.kind === 'liq' ? 'kJ par litre de mélange' : 'kJ/mol de soluté';

// ---------- dessin d'une formule (topologique, avec les H des liaisons polaires) ----------
function mise(m, x0, y0, W, H, smax = 36) {
  const xs = m.atoms.map(a => a[1]), ys = m.atoms.map(a => a[2]);
  const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
  const bw = Math.max(mxx - mnx, 0.4) + 0.9, bh = Math.max(mxy - mny, 0.4) + 0.9, s = Math.min(W / bw, H / bh, smax);
  const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2;
  return { s, P: m.atoms.map(a => ({ el: a[0], X: x0 + W / 2 + (a[1] - cx) * s, Y: y0 + H / 2 - (a[2] - cy) * s })) };
}
function Formule({ id, x0, y0, W, H, charges = false, smax }) {
  const m = ESPECES[id], an = ANA[id], { s, P } = mise(m, x0, y0, W, H, smax);
  const lab = i => { const e = P[i].el; return e !== 'C'; };
  const R = i => lab(i) ? Math.max(8, s * 0.3) : 0;
  const seg = (i, j, o) => {
    const a = P[i], b = P[j], L = Math.hypot(b.X - a.X, b.Y - a.Y) || 1, ux = (b.X - a.X) / L, uy = (b.Y - a.Y) / L, ra = R(i), rb = R(j);
    const ax = a.X + ux * ra, ay = a.Y + uy * ra, bx = b.X - ux * rb, by = b.Y - uy * rb, nx = -uy * 3, ny = ux * 3;
    return o === 2 ? <g key={`${i}-${j}`}><line x1={ax + nx} y1={ay + ny} x2={bx + nx} y2={by + ny} stroke="#0f172a" strokeWidth="1.8"/><line x1={ax - nx} y1={ay - ny} x2={bx - nx} y2={by - ny} stroke="#0f172a" strokeWidth="1.8"/></g>
      : <line key={`${i}-${j}`} x1={ax} y1={ay} x2={bx} y2={by} stroke="#0f172a" strokeWidth="1.8"/>;
  };
  return (
    <g>
      {m.bonds.map(([i, j, o]) => seg(i, j, o))}
      {P.map((p, i) => lab(i) && <g key={`a${i}`}>
        <text x={p.X} y={p.Y + 5} textAnchor="middle" fontSize={p.el === 'H' ? 13 : 15} fontWeight="700"
          fill={p.el === 'O' ? '#dc2626' : p.el === 'H' ? '#475569' : p.el === 'Cl' ? '#16a34a' : p.el === 'I' ? '#7c3aed' : '#0f172a'}>{p.el}</text></g>)}
      {charges && an.q.map((q, i) => q !== 0 && <text key={`q${i}`} x={P[i].X + (q > 0 ? 10 : 0)} y={q > 0 ? P[i].Y - 10 : P[i].Y + 24} textAnchor="middle" fontSize="12" fontWeight="800" fill={q > 0 ? '#2563eb' : '#dc2626'}>{q > 0 ? 'δ+' : 'δ−'}</text>)}
    </g>);
}

// ---------- deux entités face à face : interactions possibles ----------
function PaireSVG({ a, b, titre, sous, W = 360, H = 118 }) {
  const A = ESPECES[a], B = ESPECES[b];
  const ma = mise(A, 6, 8, W / 2 - 30, H - 34), mb = mise(B, W / 2 + 24, 8, W / 2 - 30, H - 34);
  const aa = ANA[a], bb = ANA[b], liens = [];
  const polA = A.dp >= 3 && aa.plus >= 0 && aa.moins >= 0, polB = B.dp >= 3 && bb.plus >= 0 && bb.moins >= 0;
  // liaison H : le H donneur le plus proche de l'autre entité vers un accepteur de l'autre
  const meilleurDon = (PX, XA, sens) => XA.don.reduce((m, i) => (m < 0 || sens * PX.P[i].X > sens * PX.P[m].X ? i : m), -1);
  const meilleurAcc = (PY, YA, sens) => YA.acc.reduce((m, i) => (m < 0 || sens * PY.P[i].X < sens * PY.P[m].X ? i : m), -1);
  if (complementaire(a, b)) {
    const dA = meilleurDon(ma, aa, 1), cB = meilleurAcc(mb, bb, 1), dB = meilleurDon(mb, bb, -1), cA = meilleurAcc(ma, aa, -1);
    if (dA >= 0 && cB >= 0) liens.push({ t: 'h', x1: ma.P[dA].X, y1: ma.P[dA].Y, x2: mb.P[cB].X, y2: mb.P[cB].Y });
    else if (dB >= 0 && cA >= 0) liens.push({ t: 'h', x1: mb.P[dB].X, y1: mb.P[dB].Y, x2: ma.P[cA].X, y2: ma.P[cA].Y });
  }
  if (polA && polB && !liens.length) liens.push({ t: 'p', x1: ma.P[aa.plus].X, y1: ma.P[aa.plus].Y, x2: mb.P[bb.moins].X, y2: mb.P[bb.moins].Y });
  const ya = H - 14, xa = ma.P.reduce((m, p) => Math.max(m, p.X), 0), xb = mb.P.reduce((m, p) => Math.min(m, p.X), 1e9);
  const ondes = []; for (let x = xa - 4, i = 0; x < xb + 4; x += 5, i++) ondes.push(`${x},${ya + (i % 2 ? 4 : -4)}`);
  const col = t => TYPES.find(q => q.k === t).col;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img" aria-label={`${titre} : ${nomEsp(a)} et ${nomEsp(b)}`}>
      <Formule id={a} x0={6} y0={8} W={W / 2 - 30} H={H - 34}/><Formule id={b} x0={W / 2 + 24} y0={8} W={W / 2 - 30} H={H - 34}/>
      {liens.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={col(l.t)} strokeWidth={l.t === 'h' ? 3.2 : 2.6} strokeDasharray={l.t === 'h' ? '5 3' : '2 4'} strokeLinecap="round"/>)}
      {ondes.length > 2 && <polyline points={ondes.join(' ')} fill="none" stroke={col('d')} strokeWidth="1.8"/>}
      <text x="6" y={H - 2} fontSize="11.5" fontWeight="700" fill="#0f172a">{titre}</text>
      <text x={W - 6} y={H - 2} textAnchor="end" fontSize="11" fill="#475569">{sous}</text>
    </svg>);
}

// ---------- barres initial / final ----------
function Barres({ b }) {
  const W = 640, ligne = 64, H = 40 + ligne * 3 + 20, gauche = 190;
  const mx = Math.max(1, ...b.types.map(t => Math.max(t.ini, t.fin)));
  const L = v => Math.max(0, v) / mx * (W - gauche - 270);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img" aria-label="Bilan des interactions : état initial et état final">
      <text x={gauche} y="18" fontSize="12" fill="#475569">initial = interactions S…S et E…E ; final = interactions E…S ({b.kind === 'liq' ? 'kJ par litre de mélange' : 'kJ/mol de soluté'})</text>
      {b.types.map((t, i) => {
        const y = 36 + i * ligne;
        return <g key={t.k}>
          <text x="8" y={y + 22} fontSize="13" fontWeight="700" fill={t.col}>{t.court}</text>
          <text x="8" y={y + 38} fontSize="10.5" fill="#64748b">{t.k === 'd' ? 'induits / instantanés' : t.k === 'p' ? 'permanents' : 'donneur H + accepteur'}</text>
          <rect x={gauche} y={y + 4} width={L(t.ini)} height="20" rx="3" fill="#94a3b8"/><text x={gauche + L(t.ini) + 6} y={y + 19} fontSize="12" fill="#0f172a">{nb(t.ini)} <tspan fill="#64748b">initial</tspan></text>
          <rect x={gauche} y={y + 28} width={L(t.fin)} height="20" rx="3" fill={t.col}/><text x={gauche + L(t.fin) + 6} y={y + 43} fontSize="12" fill="#0f172a">{nb(t.fin)} <tspan fill="#64748b">final</tspan></text>
          {t.perte > 0.5 && <text x={W - 8} y={y + 32} textAnchor="end" fontSize="13" fontWeight="800" fill="#dc2626">perte {nb(t.perte)}</text>}
          {t.perte < -0.5 && <text x={W - 8} y={y + 32} textAnchor="end" fontSize="13" fontWeight="800" fill="#16a34a">gain {nb(-t.perte)}</text>}
        </g>;
      })}
    </svg>);
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
  const sol = tire(['naphtalene', 'diiode']);
  const cand = ORDRE_LIQ.filter(l => l !== 'eau' && l !== 'huile');
  let ch; do { ch = [...cand].sort(() => Math.random() - 0.5).slice(0, 4); } while (!ch.some(c => validExtract(c, sol)));
  return { type, sol, choix: ch, reps: {}, verifie: false };
}
const validExtract = (c, sol) => bilan('eau', c).classe === 'non' && bilan(c, sol).classe === 'ok';
const TITRES = { verdict: 'Prédire le verdict', dominant: 'Quelle interaction décide ?', extraction: 'Solvant extracteur' };
function evaluer(d) {
  const r = d.reps;
  if (d.type === 'verdict') { const b = bilan(d.a, d.b); const ok = r.v === b.classe; return { ok, lignes: [[ok, ok ? 'Verdict conforme au bilan.' : 'Regardez le bilan : le verdict dépend du total des pertes (dernier cadre).']] }; }
  if (d.type === 'dominant') { const b = bilan(d.a, d.b); const ok = r.t === b.dom.k; return { ok, lignes: [[ok, ok ? 'Oui : c’est bien l’interaction qui perd le plus.' : 'Non : comparez, type par type, la barre « initial » et la barre « final ».']] }; }
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
        <div style={txt}>🎯 On met en contact <strong>{nomEsp(defi.a)}</strong> (solvant) et <strong>{nomEsp(defi.b)}</strong> (soluté). Prévoyez, <strong>avant de regarder le bilan</strong>, ce qui se passe.
          Le bilan s’affiche ci-dessous : à vous de le lire pour vérifier votre raisonnement.</div>
        {choix('v', solide ? [['ok', 'soluble'], ['lim', 'peu soluble'], ['non', 'insoluble']] : [['ok', 'miscibles'], ['lim', 'cas limite'], ['non', 'non miscibles']])}</>}
      {defi.type === 'dominant' && <>
        <div style={txt}>🎯 Mélange de <strong>{nomEsp(defi.a)}</strong> et <strong>{nomEsp(defi.b)}</strong>. Quel type d’interaction fait perdre le plus d’énergie entre l’état initial et l’état final ?</div>
        {choix('t', TYPES.map(t => [t.k, t.court]))}</>}
      {defi.type === 'extraction' && <>
        <div style={txt}>🎯 On veut extraire <strong>{nomEsp(defi.sol)}</strong> d’une solution aqueuse par extraction liquide-liquide. Quel solvant choisir ? (Une seule réponse valable ; la sécurité n’est pas considérée ici.)</div>
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
  const [guide, setGuide] = useEtatPersistant('solubilite-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [sel, setSel] = useState({ solv: 'eau', sol: 'ethanol' });
  const [hypoOuv, setHypoOuv] = useState(false);
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
      texte: <>Pour savoir si <strong>deux liquides se mélangent</strong> ou si <strong>un solide se dissout</strong>, on compare deux états : l’<strong>état initial</strong> (les interactions entre molécules de même espèce : S…S et E…E) et l’<strong>état final</strong> envisagé (les interactions entre espèces différentes : E…S). Si l’on y perd beaucoup de stabilité, le mélange ne se fait pas.
        Ici, S est le solvant et E le soluté.</>,
      tache: { type: 'qcm', q: 'Dans l’état initial (eau pure et éthanol pur séparés), quelle est la plus forte interaction entre molécules d’eau ?', options: ['la liaison hydrogène', 'la dispersion (dipôles instantanés)', 'l’interaction ion–ion'], bonne: 0,
        expl: 'L’eau possède des H liés à O (donneurs) et des O (accepteurs) : chaque molécule établit des liaisons hydrogène (≈ 17 kJ/mol chacune), bien plus fortes que les interactions de Van der Waals.' } },
    { id: 'ee', titre: 'Eau et éthanol', focus: ['paires', 'bilan'],
      texte: <>Choisissez l’<strong>eau</strong> comme solvant et l’<strong>éthanol</strong> comme soluté. Regardez les trois interactions : l’eau et l’éthanol ont tous les deux des H liés à O et des O.</>,
      tache: { type: 'action', ok: est('eau', 'ethanol'), label: 'Eau + éthanol', faire: () => setSel({ solv: 'eau', sol: 'ethanol' }), consigne: 'Solvant : eau ; soluté : éthanol' } },
    { id: 'eeq', titre: 'Un bilan presque nul', focus: ['bilan'],
      texte: <>Les liaisons hydrogène eau…eau et éthanol…éthanol sont remplacées par des liaisons eau…éthanol de même nature.</>,
      tache: { type: 'qcm', q: 'Pour la liaison hydrogène, le bilan « initial → final » est…', options: ['nul : on remplace des liaisons H par des liaisons H équivalentes', 'très négatif : on perd presque toutes les liaisons H', 'très positif : on forme beaucoup de nouvelles liaisons'], bonne: 0,
        expl: 'Chaque liaison H rompue (O–H…O) est remplacée par une autre liaison O–H…O. Il n’y a pas de perte de stabilité : l’eau et l’éthanol sont miscibles en toutes proportions.' } },
    { id: 'eh', titre: 'Eau et hexane', focus: ['choix', 'paires'],
      texte: <>Choisissez maintenant l’<strong>hexane</strong> comme soluté dans l’<strong>eau</strong>. L’hexane est constitué de molécules apolaires : aucune liaison H, aucun dipôle permanent.</>,
      tache: { type: 'action', ok: est('eau', 'hexane'), label: 'Eau + hexane', faire: () => setSel({ solv: 'eau', sol: 'hexane' }), consigne: 'Solvant : eau ; soluté : hexane' } },
    { id: 'ehq', titre: 'Ce que l’on perd', focus: ['bilan'],
      texte: <>Dans l’état final, une molécule d’eau voisine d’une molécule d’hexane ne peut plus faire de liaison H avec elle.</>,
      tache: { type: 'qcm', q: 'Quelle interaction est responsable de la grosse perte de stabilité ?', options: ['la liaison hydrogène eau…eau, perdue et non remplacée', 'la dispersion, qui devient plus forte', 'les interactions ioniques'], bonne: 0,
        expl: 'Les liaisons H eau…eau (état initial) ne sont remplacées que par de faibles interactions de Van der Waals eau…hexane. La perte est énorme : l’eau et l’hexane ne sont pas miscibles.' } },
    { id: 'ehn', titre: 'Un ordre de grandeur', focus: ['bilan'],
      texte: <>Lisez dans le bilan la perte pour la liaison hydrogène (en kJ par litre de mélange 50/50).</>,
      tache: { type: 'num', q: 'Perte liée à la liaison hydrogène (kJ par litre)', unite: 'kJ/L', vrai: bw('eau', 'hexane').types[2].perte, tol: 0.05, affiche: v => nb(v), cs: 3,
        bloque: est('eau', 'hexane') ? null : 'Faites d’abord l’étape précédente (eau + hexane).',
        expl: 'On trouve environ 447 kJ/L : plus de dix fois le seuil au-delà duquel le mélange est impossible (voir hypothèses).' } },
    { id: 'hc', titre: 'Qui se ressemble s’assemble', focus: ['choix', 'bilan'],
      texte: <>Choisissez l’<strong>hexane</strong> comme solvant et le <strong>cyclohexane</strong> comme soluté.</>,
      tache: { type: 'action', ok: est('hexane', 'cyclohexane'), label: 'Hexane + cyclohexane', faire: () => setSel({ solv: 'hexane', sol: 'cyclohexane' }), consigne: 'Solvant : hexane ; soluté : cyclohexane' } },
    { id: 'hcq', titre: 'Pas de perte', focus: ['bilan'],
      texte: <>Les deux liquides n’ont que des interactions de dispersion, de même ordre de grandeur.</>,
      tache: { type: 'qcm', q: 'Hexane et cyclohexane sont…', options: ['miscibles : les interactions E…S sont comparables aux interactions S…S et E…E', 'non miscibles', 'miscibles grâce aux liaisons hydrogène'], bonne: 0,
        expl: 'Le bilan est pratiquement nul : on remplace des interactions de dispersion par des interactions de dispersion équivalentes.' } },
    { id: 'ea', titre: 'Eau et acétone', focus: ['choix', 'paires'],
      texte: <>L’acétone a un dipôle permanent et un O accepteur, mais pas de H lié à O. Choisissez l’<strong>eau</strong> comme solvant et l’<strong>acétone</strong> comme soluté.</>,
      tache: { type: 'action', ok: est('eau', 'acetone'), label: 'Eau + acétone', faire: () => setSel({ solv: 'eau', sol: 'acetone' }), consigne: 'Solvant : eau ; soluté : acétone' } },
    { id: 'eaq', titre: 'Une liaison H à sens unique', focus: ['paires'],
      texte: <>Regardez la paire eau…acétone dans l’état final.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’acétone est-elle miscible à l’eau ?', options: ['l’eau peut donner une liaison H à l’O de l’acétone : l’interaction E…S compense la perte', 'parce que l’acétone est apolaire', 'parce que l’acétone fait des liaisons ioniques'], bonne: 0,
        expl: 'Le H de l’eau se lie à l’O de la fonction cétone : une liaison hydrogène eau…acétone remplace en grande partie une liaison eau…eau. (Le modèle reste approximatif : il ne compte pas précisément le nombre de liaisons.)' } },
    { id: 'lim', titre: 'Un cas limite : éthanol et hexane', focus: ['choix', 'bilan'],
      texte: <>L’éthanol possède un groupe OH polaire et une chaîne éthyle apolaire : c’est une molécule <strong>amphiphile</strong>. Choisissez l’<strong>éthanol</strong> comme solvant et l’<strong>hexane</strong> comme soluté.</>,
      tache: { type: 'action', ok: est('ethanol', 'hexane'), label: 'Éthanol + hexane', faire: () => setSel({ solv: 'ethanol', sol: 'hexane' }), consigne: 'Solvant : éthanol ; soluté : hexane' } },
    { id: 'limq', titre: 'Pas tout noir ni tout blanc', focus: ['bilan'],
      texte: <>La perte est bien plus faible qu’avec l’eau (une seule liaison H par molécule d’éthanol, et une chaîne carbonée qui interagit bien avec l’hexane).</>,
      tache: { type: 'qcm', q: 'Pour ce couple, le modèle indique…', options: ['un cas limite : la miscibilité dépend de la température et des proportions', 'des liquides parfaitement miscibles', 'des liquides parfaitement non miscibles'], bonne: 0,
        expl: 'L’éthanol et l’hexane sont miscibles à température ambiante mais se séparent si l’on refroidit : la perte d’énergie est du même ordre que ce que l’agitation thermique peut compenser.' } },
    { id: 'i2', titre: 'Un solide : le diiode', focus: ['choix', 'bilan'],
      texte: <>Un soluté solide doit d’abord « sortir » de son cristal. Choisissez le <strong>cyclohexane</strong> comme solvant et le <strong>diiode</strong> comme soluté, puis passez à l’<strong>eau</strong>.</>,
      tache: { type: 'action', ok: est('eau', 'diiode'), label: 'Diiode dans l’eau', faire: () => setSel({ solv: 'eau', sol: 'diiode' }), consigne: 'Solvant : eau ; soluté : diiode' } },
    { id: 'i2q', titre: 'Pourquoi le diiode quitte l’eau', focus: ['bilan'],
      texte: <>Comparez le bilan dans l’eau et le bilan dans le cyclohexane (essayez-le avec les boutons de solvant).</>,
      tache: { type: 'qcm', q: 'Le diiode (apolaire) est très peu soluble dans l’eau parce que…', options: ['les liaisons H eau…eau (cohésion du solvant) ne sont pas compensées par des interactions diiode…eau', 'le diiode est un solide ionique', 'le diiode est trop gros pour l’eau'], bonne: 0,
        expl: 'Pour loger une molécule de diiode, l’eau doit rompre des liaisons H qu’elle ne retrouve pas. Dans le cyclohexane, il n’y a que de la dispersion de part et d’autre : aucune perte significative. C’est le principe de l’extraction du diiode par le cyclohexane.' } },
    { id: 'nacl', titre: 'Le sel : NaCl dans l’eau', focus: ['choix', 'bilan'],
      texte: <>Pour un solide ionique, c’est l’interaction ion–ion qui assure la cohésion : <strong>492 kJ/mol</strong> pour une paire Na⁺/Cl⁻ au contact (282 pm). Mais dans un solvant, cette attraction est divisée par la permittivité ε du solvant (« écran »). Choisissez l’<strong>eau</strong> et le <strong>chlorure de sodium</strong>.</>,
      tache: { type: 'action', ok: est('eau', 'nacl'), label: 'NaCl dans l’eau', faire: () => setSel({ solv: 'eau', sol: 'nacl' }), consigne: 'Solvant : eau ; soluté : chlorure de sodium' } },
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
      texte: <>Le bilan d’énergie est un outil puissant, mais il ne dit pas tout. Il ne tient pas compte de l’<strong>entropie</strong> : l’agitation thermique favorise le mélange, d’environ RT·ln 2 ≈ 1,7 kJ/mol à 25 °C. Il ne distingue pas non plus les cas limites. Les seuils utilisés ici sont réglés sur des cas connus : ce sont des repères, pas des lois.</>,
      tache: { type: 'qcm', q: 'Un résultat « cas limite » signifie…', options: ['que le mélange peut se produire ou non selon la température et les proportions', 'que le modèle a fait une erreur de calcul', 'que les liquides sont non miscibles'], bonne: 0,
        expl: 'Quand la perte est de l’ordre de grandeur de l’énergie thermique disponible, les deux issues sont possibles : seule l’expérience (ou un calcul plus complet) tranche.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>Pour prévoir, on compare l’état initial (S…S et E…E) à l’état final (E…S).</li>
        <li>Trois interactions de molécules : liaison H (≈ 17 kJ/mol), dipôle–dipôle, dispersion ; entre ions : interaction ion–ion, écrantée par le solvant.</li>
        <li>« Qui se ressemble s’assemble » : c’est quand les interactions E…S ressemblent aux interactions S…S et E…E que la perte est faible.</li>
        <li>Les solides ioniques ne sont pratiquement solubles que dans l’eau (ε élevé, solvatation).</li>
        <li>Pour une extraction : soluté très soluble dans le solvant extracteur, et solvant non miscible à la phase d’origine.</li></ul>,
      texte: <>Vous savez prévoir solubilité et miscibilité en comparant les interactions avant et après. Passez aux défis !</>, tache: null },
  ];
  const cadre = id => enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  function lancer(type) { setDefi(nouveauDefi(type)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'verdict'); }

  // ════════════════ PANNEAUX ════════════════
  const bouton = (id, role) => <button key={id} onClick={() => choisir({ [role]: id })} style={stylePetitBouton(sel[role] === id, role === 'solv' ? '#0284c7' : '#7c3aed')}>{ESPECES[id].nom}</button>;
  const choix = !enDefi && (
    <div style={{ ...styleBoite, ...cadre('choix') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Choisir le solvant et le soluté</div>
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '2px 0 4px' }}>Solvant (S) — un liquide</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>{ORDRE_LIQ.map(i => bouton(i, 'solv'))}</div>
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '2px 0 4px' }}>Soluté (E) — un liquide ou un solide</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{[...ORDRE_LIQ, ...ORDRE_SOL].map(i => bouton(i, 'sol'))}</div>
    </div>);

  const cartes = (
    <div style={{ ...styleBoite }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les deux espèces : formule développée et polarité</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
        {[['S', 'solvant', solv], ['E', 'soluté', sol]].map(([r, n, id]) => id && <div key={r} style={{ background: '#fafaf9', borderRadius: 8, padding: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: r === 'S' ? '#0284c7' : '#7c3aed' }}>{r} : {n}</div>
          {ESPECES[id].famille === 'ion'
            ? <svg viewBox="0 0 240 90" style={{ width: '100%' }}><circle cx="85" cy="45" r="20" fill="#fde68a" stroke="#b45309"/><text x="85" y="50" textAnchor="middle" fontWeight="800" fontSize="14">Na⁺</text>
              <circle cx="140" cy="45" r="26" fill="#bbf7d0" stroke="#15803d"/><text x="140" y="50" textAnchor="middle" fontWeight="800" fontSize="14">Cl⁻</text></svg>
            : <svg viewBox="0 0 240 110" style={{ width: '100%' }}><Formule id={id} x0={8} y0={4} W={224} H={102} charges smax={40}/></svg>}
          <div style={{ fontSize: 12.5, color: KIT.txt2 }}>{ESPECES[id].nom} ({ESPECES[id].formule}){ESPECES[id].estime ? ' — valeurs estimées' : ''}
            {ESPECES[id].famille === 'ion' ? ' — cohésion : interaction ion–ion' : ` — donneurs de liaison H : ${ANA[id].don.length ? 'oui' : 'non'} ; accepteurs : ${ANA[id].acc.length ? 'oui' : 'non'} ; dipôle permanent : ${ESPECES[id].dp >= 3 ? 'oui' : 'faible ou nul'}`}</div>
          {ESPECES[id].note && <div style={{ fontSize: 12, color: '#92400e' }}>{ESPECES[id].note}</div>}
        </div>)}
      </div>
    </div>);

  const ion = ESPECES[sol].famille === 'ion';
  const paires = b && !ion && (
    <div style={{ ...styleBoite, ...cadre('paires') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Interactions possibles : état initial → état final</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 3 }}>🔹 État initial (espèces séparées)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PaireSVG a={solv} b={solv} titre="S…S" sous="solvant pur"/><PaireSVG a={sol} b={sol} titre="E…E" sous="soluté pur"/></div></div>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 3 }}>🔸 État final envisagé (mélange)</div>
          <PaireSVG a={solv} b={sol} titre="E…S" sous="soluté entouré de solvant"/>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
            <span style={{ color: '#2563eb', fontWeight: 700 }}>- - -</span> liaison hydrogène · <span style={{ color: '#ea580c', fontWeight: 700 }}>· · ·</span> dipôle–dipôle · <span style={{ color: '#6b7280', fontWeight: 700 }}>~~~</span> dipôles instantanés (toujours présents).
            Une interaction qui existe dans l’état initial mais pas dans l’état final est « perdue » ; celle qui apparaît seulement dans l’état final est « gagnée ».</div></div>
      </div>
    </div>);

  const bilanPanneau = b && (
    <div style={{ ...styleBoite, ...cadre('bilan') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{ion ? 'Bilan : la cohésion du cristal face à l’écran du solvant' : 'Bilan énergétique, type par type'}</div>
      {ion ? <SceneIon solv={solv} b={b}/> : <Barres b={b}/>}
      {!masque && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, border: `2px solid ${COUL[b.classe]}`, background: '#fff' }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: COUL[b.classe] }}>
          {ion ? (b.classe === 'ok' ? 'Soluble' : b.classe === 'lim' ? 'Peu soluble (cas limite)' : 'Insoluble') : ETIQ[b.classe]} : {nomEsp(sol)} dans {nomEsp(solv)}</div>
        {!ion && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 2 }}>Perte totale d’interactions : <strong>{nb(b.total)}</strong> {unite(b)} (seuils : {liquide ? `${SEUIL_LIQ[0]} et ${SEUIL_LIQ[1]}` : `${SEUIL_SOL[0]} et ${SEUIL_SOL[1]}`}). Interaction qui décide : <strong>{b.dom.court}</strong>.</div>}
        {ion && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 2 }}>Attraction Na⁺/Cl⁻ restante dans le solvant : <strong>{nb(b.dans)} kJ/mol</strong> (≈ {nb(b.dans / RT)} RT).
          {b.classe === 'ok' ? ' L’agitation thermique suffit à séparer les ions : on peut les solvater.' : ' Les ions restent attirés l’un vers l’autre : le cristal se reforme.'}</div>}
        {!ion && b.comp && <div style={{ fontSize: 12.5, color: '#92400e', marginTop: 4 }}>⚠ Une liaison H est possible entre S et E : le modèle suppose qu’elle est aussi forte que les liaisons S…S et E…E (il ne compte pas précisément le nombre de liaisons).</div>}
      </div>}
      {masque && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt2 }}>Le verdict est masqué : lisez le bilan, répondez, puis vérifiez.</div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Trois familles d’interactions entre molécules</strong> : dispersion, dipôle–dipôle (Van der Waals) et liaison hydrogène. La cohésion de chaque liquide est répartie entre elles à partir des paramètres de solubilité de Hansen (valeurs de tables, arrondies).</li>
      <li><strong>Mélange 50/50 en volume, mélange au hasard</strong> (liquides) ; <strong>soluté très dilué</strong> (solides).</li>
      <li><strong>Règle de la moyenne géométrique</strong> : l’énergie E…S de dispersion (ou dipolaire) est la moyenne géométrique de E…E et S…S.</li>
      <li><strong>Règle pour la liaison H</strong> : si l’une des espèces peut donner et l’autre accepter une liaison H (et qu’elles ont assez de sites, au moins 1 pour 125 cm³/mol), la liaison E…S est supposée aussi forte que la moyenne des liaisons E…E et S…S. Cette règle ignore la différence du <em>nombre</em> de liaisons possibles : elle est parfois trop favorable.</li>
      <li><strong>L’entropie n’est pas calculée.</strong> À 25 °C, l’agitation thermique favorise le mélange de RT·ln 2 ≈ 1,7 kJ/mol : c’est l’ordre de grandeur d’une perte énergétique tolérable. Pour les cas limites, ce terme décide.</li>
      <li><strong>Les seuils sont des repères empiriques</strong> : réglés sur une batterie de 47 cas connus (liquides, solides moléculaires, sel), puis vérifiés sur 28 cas indépendants, sans inversion « miscible ↔ non miscible » mais avec de nombreux « cas limites » là où la réalité est tranchée. Ils ne remplacent ni l’expérience ni un calcul complet.</li>
      <li><strong>Solides moléculaires</strong> (diiode, naphtalène) : la cohésion du cristal est assimilée à celle d’un liquide de même nature ; l’enthalpie de fusion n’est pas prise en compte. Les paramètres du diiode et de l’huile sont <em>estimés</em>.</li>
      <li><strong>Solide ionique</strong> : on applique la permittivité macroscopique ε du solvant à une distance de 282 pm. C’est grossier : les solvatations de Na⁺ et de Cl⁻ se compensent presque avec la cohésion du cristal (≈ 790 kJ/mol de part et d’autre), et la différence entre l’eau et l’éthanol se joue sur quelques pour cent.</li>
      <li><strong>Température 25 °C, pression atmosphérique</strong>, espèces pures (pas d’eau dissoute dans les solvants, pas d’impuretés).</li>
      <li><strong>Cas connus mal rendus</strong> : le modèle sous-estime la miscibilité de quelques couples (acétone–hexane, éthanol–toluène…) et surestime celle du glycérol avec l’éther. Ce sont des cas « limites » : le modèle le dit, et c’est une bonne discussion à avoir avec les élèves.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Eau avec méthanol, éthanol, propan-1-ol, butan-1-ol : à partir de quelle longueur de chaîne le bilan se dégrade-t-il ? Pourquoi ?</li>
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
        <li>on compare l’état initial (S…S, E…E) à l’état final (E…S)</li>
        <li>on perd de la stabilité quand une interaction forte (liaison H, ion–ion) n’est pas remplacée</li>
        <li>« qui se ressemble s’assemble » : E…S ≈ S…S ≈ E…E</li>
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
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un soluté se dissout, ou deux liquides se mélangent, quand on ne perd pas (trop) de stabilité en passant de l’état initial
        (interactions S…S et E…E) à l’état final (interactions E…S). Choisissez deux espèces et comparez, type d’interaction par type d’interaction.</div>
      <div className={`sl-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div className="sl-col">
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={lancer}/></div>}
          {enDefi && defi.type === 'extraction' && <div style={{ ...styleBoite, fontSize: 13.5 }}>
            <strong>Dossier :</strong> pour chaque solvant candidat, le bilan « solvant / eau » (miscibilité) et « solvant / {nomEsp(defi.sol)} » (solubilité).
            <table style={{ width: '100%', marginTop: 6, fontSize: 13, borderCollapse: 'collapse' }}><tbody>{defi.choix.map(c => <tr key={c}>
              <td style={{ padding: '3px 6px', fontWeight: 700 }}>{nomEsp(c)}</td>
              <td style={{ padding: '3px 6px' }}>avec l’eau : <span style={{ color: COUL[bilan('eau', c).classe], fontWeight: 700 }}>{ETIQ_LIQ[bilan('eau', c).classe]}</span> ({nb(bilan('eau', c).total)} kJ/L)</td>
              <td style={{ padding: '3px 6px' }}>avec {nomEsp(defi.sol)} : <span style={{ color: COUL[bilan(c, defi.sol).classe], fontWeight: 700 }}>{ETIQ_SOL[bilan(c, defi.sol).classe]}</span> ({nb(bilan(c, defi.sol).total)} kJ/mol)</td></tr>)}</tbody></table></div>}
          {choix}
          {!(enDefi && defi.type === 'extraction') && (solv === sol ? <div style={styleBoite}>Choisissez deux espèces différentes.</div> : <>
            {cartes}{paires}{bilanPanneau}</>)}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="sl-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="sl-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
