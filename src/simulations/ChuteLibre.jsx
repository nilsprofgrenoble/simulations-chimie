import { useState } from "react";
import { useHorloge, Commandes } from "./lentilleMinceAnim";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, IndiceDefi } from "../commun";
import { Schema, Fl, T, TV, TL, GRIS, BLEU, NOIR } from "./Travail";
import { chute, vApprox, gDe, GRAV, N_PTS, SITUATIONS } from "./chuteModele";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 140 — CHUTE LIBRE : VARIATION DU VECTEUR VITESSE ET FORCE (2GT, « Principe d'inertie »)
//  Chronophotographie d'une chute libre à une dimension (avec ou sans vitesse initiale), vecteurs vitesse approchés par
//  M(i−1)M(i+1)/2τ, vecteur Δv entre deux instants voisins, lien qualitatif avec la somme des forces (même direction, même sens).
//  Capacité du programme : « relier la variation entre deux instants voisins du vecteur vitesse d'un système modélisé par un point
//  matériel à l'existence d'actions extérieures modélisées par des forces dont la somme est non nulle, en particulier dans le cas
//  d'un mouvement de chute libre à une dimension (avec ou sans vitesse initiale) ». Modèle : chuteModele.js.
// ====================================================

const SIM = 140;
declarerDefis(SIM, [
  ['prevoir', 'Prévoir Δv et la force'],
  ['construire', 'Calculer Δv'],
  ['vitesse', 'Calculer une vitesse'],
]);

const ROUGE = '#c2410c', VERT = '#15803d', ORANGE = '#b45309';
const alea = l => l[Math.floor(Math.random() * l.length)];
const fr = (x, d = 1) => Number(x).toFixed(d).replace('.', ',').replace('-', '−');
const frs = (x, d = 1) => (x > 0 ? '+' : '') + fr(x, d);
const Vec = ({ c = 'F' }) => <span style={{ position: 'relative', display: 'inline-block', fontStyle: 'italic' }}>{c}<span aria-hidden="true" style={{ position: 'absolute', left: '0.1em', top: '-0.5em', fontSize: '0.8em', fontStyle: 'normal', lineHeight: 1 }}>→</span></span>;
const Cle = ({ children }) => <div style={{ margin: '8px 0', padding: '6px 10px', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 8, fontWeight: 700, fontSize: 14.5, lineHeight: 1.45 }}>Phrase-clé : {children}</div>;
const DEFAUT = { v0: 0, ast: 'terre', tau: 0.2 };
const LANCERS = [[0, 'Lâchée sans vitesse'], [5.88, 'Lancée vers le haut à 5,9 m/s'], [9.8, 'Lancée vers le haut à 9,8 m/s'], [-5, 'Lancée vers le bas à 5,0 m/s']];
const dessin = p => chute({ v0: p.v0, g: gDe(p.ast), tau: p.tau });

// ---------- scène : chronophotographie verticale ----------
function Scene({ d, vis, k: kProp = N_PTS - 1, sel = 3, anim = null }) {
  const k = anim ? Math.min(kProp, Math.floor(anim.t / d.tau + 1e-9)) : kProp;
  const H = 470, top = 40, bas = H - 30, ymax = Math.max(0, ...d.y) + 0.3, ymin = Math.min(0, ...d.y) - 0.3;
  const Y = y => top + (ymax - y) / (ymax - ymin) * (bas - top), X = i => 86 + i * 29;
  const pas = [0.5, 1, 2, 5, 10, 20].find(p => (ymax - ymin) / p <= 8) || 20;
  const ticks = []; for (let y = Math.ceil(ymin / pas) * pas; y <= ymax; y += pas) ticks.push(Math.round(y * 100) / 100);
  const vm = Math.max(1, ...Array.from({ length: d.N - 2 }, (_, j) => Math.abs(vApprox(d, j + 1)))), sv = 66 / vm;
  const pts = Array.from({ length: Math.min(k, d.N - 1) + 1 }, (_, i) => i);
  const vs = vis.vec ? pts.filter(i => i >= 1 && i + 1 <= k) : [];
  const vsel = sel >= 1 && sel + 1 <= k ? vApprox(d, sel) : null;
  return (
    <svg viewBox={`0 0 360 ${H}`} role="img" aria-label="Chronophotographie d’une balle en chute libre : positions successives à intervalles de temps réguliers, sur un axe vertical gradué en mètres" style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <line x1="44" y1={top - 6} x2="44" y2={bas + 4} stroke={GRIS} strokeWidth="2"/><polygon points={`44,${top - 12} 39,${top - 2} 49,${top - 2}`} fill={GRIS}/>
      {ticks.map(y => <g key={y}><line x1="38" y1={Y(y)} x2="44" y2={Y(y)} stroke={GRIS} strokeWidth="2"/><text x="34" y={Y(y) + 5} fontSize="14" fill={GRIS} textAnchor="end">{fr(y, pas < 1 ? 1 : 0)}</text></g>)}
      {pts.map(i => <text key={'t' + i} x={X(i)} y="22" fontSize="13" fontWeight="700" fill={NOIR} textAnchor="middle">{fr(d.t[i], d.tau < 0.15 ? 2 : 1)}</text>)}
      <polyline points={pts.map(i => `${X(i)},${Y(d.y[i])}`).join(' ')} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4"/>
      {vs.map(i => { const v = vApprox(d, i); return Math.abs(v * sv) < 3 ? null : <Fl key={'v' + i} x1={X(i)} y1={Y(d.y[i])} x2={X(i)} y2={Y(d.y[i]) - v * sv} c={BLEU} w={3.5}/>; })}
      {pts.map(i => <circle key={i} cx={X(i)} cy={Y(d.y[i])} r="6" fill={i === 0 ? '#fde68a' : '#fff'} stroke={NOIR} strokeWidth="2.2"/>)}
      {vis.vec && vsel !== null && (Math.abs(vsel) < 0.05
        ? <g><TV x={X(sel) + 12} y={Y(d.y[sel]) - 6} c={BLEU} s={18} halo>v</TV><text x={X(sel) + 30} y={Y(d.y[sel]) - 6} fontSize="16" fontWeight="800" fill={BLEU} stroke="#fff" strokeWidth="3" paintOrder="stroke">= 0</text></g>
        : <TV x={X(sel) + 8} y={Y(d.y[sel]) - vsel * sv / 2 + 5} c={BLEU} s={18} halo>v</TV>)}
      {anim && (() => { const tm = (d.N - 1) * d.tau, tt = Math.min(anim.t, tm), yb = d.v0 * tt - 0.5 * d.g * tt * tt, vb = d.v0 - d.g * tt, xb = 86 + tt / d.tau * 29;
        return <g><circle cx={xb} cy={Y(yb)} r="9" fill="#f59e0b" stroke={NOIR} strokeWidth="2.2"/>{Math.abs(vb * sv) > 3 && <Fl x1={xb + (xb > 300 ? -15 : 15)} y1={Y(yb)} x2={xb + (xb > 300 ? -15 : 15)} y2={Y(yb) - vb * sv} c="#0369a1" w={3}/>}</g>; })()}
      <text x="180" y={H - 8} fontSize="13" fill={GRIS} textAnchor="middle">dates t en secondes (en haut) · hauteur y en mètres</text>
    </svg>);
}

// ---------- construction de Δv : on place les deux vitesses puis on trace la variation ----------
function Construction({ d, i, force }) {
  const va = vApprox(d, i), vb = vApprox(d, i + 1), dv = vb - va, s = 84 / Math.max(Math.abs(va), Math.abs(vb), 0.5), y0 = 30 + Math.max(va, vb, 0) * s;
  const ya = y0 - va * s, yb = y0 - vb * s, tiny = Math.abs(dv * s) < 6;
  return (
    <Schema aria={`Construction de la variation de vitesse : le vecteur vitesse à ${fr(d.t[i], 1)} s, celui à ${fr(d.t[i + 1], 1)} s, puis le vecteur qui va de l’extrémité du premier à l’extrémité du second${force ? ', et la force (poids) dessinée dans le même sens' : ''}`} h={252}>
      <line x1="14" y1={y0} x2="346" y2={y0} stroke="#cbd5e1" strokeWidth="1.5"/>
      {Math.abs(va * s) >= 3 && <><Fl x1={46} y1={y0} x2={46} y2={ya} c={BLEU} w={4}/><TV x={56} y={(y0 + ya) / 2 + 6} c={BLEU} s={18} halo>v</TV></>}
      {Math.abs(vb * s) >= 3 && <><Fl x1={126} y1={y0} x2={126} y2={yb} c={BLEU} w={4}/><TV x={136} y={(y0 + yb) / 2 + 6} c={BLEU} s={18} halo>v</TV></>}
      <line x1="46" y1={ya} x2="214" y2={ya} stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 4"/><line x1="126" y1={yb} x2="214" y2={yb} stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 4"/>
      {!tiny && <><Fl x1={214} y1={ya} x2={214} y2={yb} c={ORANGE} w={5}/><TV x={226} y={(ya + yb) / 2 + 6} c={ORANGE} s={18} halo>Δv</TV></>}
      {force && <><Fl x1={314} y1={y0} x2={314} y2={y0 + d.g * 7} c="#dc2626" w={4}/><TV x={324 - 6} y={y0 + d.g * 3.5 + 6} c="#dc2626" s={18} halo>P</TV></>}
      <T x={46} y={214} a="middle" s={15} w={700} c={BLEU}>vitesse</T><T x={46} y={233} a="middle" s={15} c={GRIS} w={500}>à {fr(d.t[i], 1)} s</T>
      <T x={126} y={214} a="middle" s={15} w={700} c={BLEU}>vitesse</T><T x={126} y={233} a="middle" s={15} c={GRIS} w={500}>à {fr(d.t[i + 1], 1)} s</T>
      <T x={214} y={214} a="middle" s={15} w={700} c={ORANGE}>variation</T><T x={214} y={233} a="middle" s={15} c={GRIS} w={500}>de vitesse</T>
      {force && <><T x={314} y={214} a="middle" s={15} w={700} c="#dc2626">force</T><T x={314} y={233} a="middle" s={15} c={GRIS} w={500}>(poids)</T></>}
    </Schema>);
}

// ---------- schémas des fiches « À retenir » (polices ≥ 15 dans un viewBox de 360) ----------
const SchemaChrono = () => (
  <Schema aria="Deux chronophotographies : à gauche des points espacés régulièrement, vitesse constante ; à droite des points de plus en plus écartés, vitesse qui augmente. Le vecteur vitesse en M i se déduit du déplacement entre les points voisins" h={216}>
    <T x={8} y={22} s={15} w={700} c="#0369a1">espacements égaux : v constante</T>
    {[0, 1, 2, 3, 4, 5].map(i => <circle key={i} cx={20 + i * 40} cy="48" r="6" fill="#fff" stroke={NOIR} strokeWidth="2.2"/>)}
    <T x={8} y={92} s={15} w={700} c={ROUGE}>espacements croissants : v augmente</T>
    {[0, 1, 2, 3, 4, 5].map(i => <circle key={i} cx={[20, 42, 80, 134, 204, 290][i]} cy="118" r="6" fill="#fff" stroke={NOIR} strokeWidth="2.2"/>)}
    <TL x={8} y={172} s={16} segs={[{ v: 'v' }, ' ≈ ']}/><T x={44} y={172} s={16} w={700}>déplacement M(i−1)M(i+1) / (2τ)</T>
    <T x={8} y={200} s={15} c={GRIS} w={500}>τ : durée entre deux points voisins</T>
  </Schema>);
const SchemaDelta = () => (
  <Schema aria="Construction de la variation de vitesse : on dessine le vecteur vitesse avant et après, puis le vecteur Δv relie l’extrémité du premier à l’extrémité du second" h={212}>
    <line x1="14" y1="96" x2="346" y2="96" stroke="#cbd5e1" strokeWidth="1.5"/>
    <Fl x1={50} y1={96} x2={50} y2={52} c={BLEU} w={4}/><TV x={60} y={80} c={BLEU} s={17} halo>v</TV><T x={74} y={86} s={15} c={BLEU} w={800}>₁</T>
    <Fl x1={140} y1={96} x2={140} y2={30} c={BLEU} w={4}/><TV x={150} y={70} c={BLEU} s={17} halo>v</TV><T x={164} y={76} s={15} c={BLEU} w={800}>₂</T>
    <line x1="50" y1="52" x2="226" y2="52" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 4"/><line x1="140" y1="30" x2="226" y2="30" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 4"/>
    <Fl x1={226} y1={30} x2={226} y2={52} c={ORANGE} w={5}/><TV x={240} y={48} c={ORANGE} s={17} halo>Δv</TV>
    <TL x={14} y={140} s={16} segs={['Δ', { v: 'v' }, ' = ', { v: 'v' }, '₂ − ', { v: 'v' }, '₁']}/>
    <TL x={14} y={170} s={15} c={ORANGE} segs={['Δ', { v: 'v' }, ' va de la pointe de ', { v: 'v' }, '₁ à celle de ', { v: 'v' }, '₂']}/>
    <TL x={14} y={196} s={15} c={GRIS} w={500} segs={['(', { v: 'v' }, '₁ avant, ', { v: 'v' }, '₂ juste après)']}/>
  </Schema>);
const SchemaLien = () => (
  <Schema aria="À gauche, une balle soumise au seul poids : la variation de vitesse est dans le même sens que la force. À droite, une balle immobile ou à vitesse constante : variation de vitesse nulle et forces qui se compensent" h={206}>
    <circle cx="70" cy="60" r="7" fill="#fff" stroke={NOIR} strokeWidth="2.4"/>
    <Fl x1={70} y1={67} x2={70} y2={118} c="#dc2626" w={4}/><TV x={46} y={104} c="#dc2626" s={17} halo>P</TV>
    <Fl x1={120} y1={67} x2={120} y2={118} c={ORANGE} w={4}/><TV x={128} y={104} c={ORANGE} s={17} halo>Δv</TV>
    <T x={92} y={146} a="middle" s={15} w={700}>même sens</T>
    <TL x={8} y={176} s={16} segs={['Σ', { v: 'F' }, ' ≠ ', { v: '0' }, ' ⇔ Δ', { v: 'v' }, ' ≠ ', { v: '0' }]}/>
    <circle cx="280" cy="60" r="7" fill="#fff" stroke={NOIR} strokeWidth="2.4"/>
    <T x={280} y={110} a="middle" s={15} w={700} c={VERT}>v constante</T>
    <TL x={208} y={140} s={16} segs={['Δ', { v: 'v' }, ' = ', { v: '0' }]}/><TL x={208} y={176} s={16} segs={['Σ', { v: 'F' }, ' = ', { v: '0' }]}/>
  </Schema>);
const SchemaMontee = () => {
  const hs = [0, 30, 48, 54, 48, 30, 0], Yp = h => 176 - 1.6 * h, vs = [36, 24, 12, 0, -12, -24, -36];
  return (
    <Schema aria="Balle lancée vers le haut : en montant, sa vitesse (vers le haut) diminue ; au sommet elle est nulle ; en descendant, elle augmente vers le bas. La variation de vitesse Δv est vers le bas pendant tout le trajet" h={272}>
      {vs.map((v, i) => Math.abs(v) < 1 ? null : <Fl key={'v' + i} x1={30 + i * 38} y1={Yp(hs[i])} x2={30 + i * 38} y2={Yp(hs[i]) - v * 1.25} c={BLEU} w={3.5}/>)}
      {hs.map((h, i) => <circle key={i} cx={30 + i * 38} cy={Yp(h)} r="6" fill="#fff" stroke={NOIR} strokeWidth="2.2"/>)}
      <TV x={42} y={30} c={BLEU} s={17}>v</TV><T x={62} y={30} s={15} w={700} c={BLEU}>diminue, puis augmente</T>
      <TL x={30 + 3 * 38 - 24} y={Yp(54) - 14} s={16} c={VERT} segs={[{ v: 'v' }, ' = ', { v: '0' }]}/>
      <Fl x1={330} y1={70} x2={330} y2={112} c={ORANGE} w={5}/><TV x={290} y={102} c={ORANGE} s={17} halo>Δv</TV>
      <TL x={8} y={244} s={15} c={ORANGE} segs={['Δ', { v: 'v' }, ' reste vers le bas, tout le trajet']}/><T x={8} y={264} s={15} c={GRIS} w={500}>(le poids ne change pas)</T>
    </Schema>);
};
const SchemaBilan = () => (
  <Schema aria="Trois cas : variation de vitesse vers le bas, la somme des forces est vers le bas ; variation nulle, somme des forces nulle ; variation vers le haut, somme des forces vers le haut" h={222}>
    {[[0, 'bas', ['Δ', { v: 'v' }, ' ↓ : Σ', { v: 'F' }, ' ↓'], 'chute libre : le poids'], [1, 'nul', ['Δ', { v: 'v' }, ' = ', { v: '0' }, ' : Σ', { v: 'F' }, ' = ', { v: '0' }], 'immobile ou vitesse constante'], [2, 'haut', ['Δ', { v: 'v' }, ' ↑ : Σ', { v: 'F' }, ' ↑'], 'ascenseur qui accélère vers le haut']].map(([n, sens, a, b]) => {
      const y = 14 + n * 70;
      return <g key={n}>
        {sens === 'bas' && <Fl x1={30} y1={y + 6} x2={30} y2={y + 46} c={ORANGE} w={5}/>}
        {sens === 'haut' && <Fl x1={30} y1={y + 46} x2={30} y2={y + 6} c={ORANGE} w={5}/>}
        {sens === 'nul' && <circle cx="30" cy={y + 26} r="7" fill="#fff" stroke={NOIR} strokeWidth="2.4"/>}
        <TL x={58} y={y + 22} s={16} segs={a}/><T x={58} y={y + 44} s={15} c={GRIS} w={500}>{b}</T></g>;
    })}
  </Schema>);

// ====================================================
//  DÉFIS
// ====================================================
const TITRES = { prevoir: 'Prévoir Δv et la force', construire: 'Calculer Δv', vitesse: 'Calculer une vitesse' };
const TAUS = [0.1, 0.2, 0.3, 0.4, 0.5];
function nouveauDefi(type, prec) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'prevoir') { let s; do { s = alea(SITUATIONS); } while (prec && prec.type === 'prevoir' && prec.id === s.id); return { ...base, id: s.id }; }
  if (type === 'construire') { const tau = alea(TAUS), v1 = Math.round((Math.random() * 12 - 4) * 10) / 10, v2 = Math.round((v1 - 9.8 * tau) * 10) / 10; return { ...base, tau, v1, v2, vrai: Math.round((v2 - v1) * 10) / 10 }; }
  const tau = alea(TAUS), i = 2 + Math.floor(Math.random() * 5), d = chute({ v0: alea([0, 0, 3, 5]), g: 9.8, tau });
  const dist = Math.round(Math.abs(d.y[i + 1] - d.y[i - 1]) * 100) / 100, dur = Math.round(2 * tau * 10) / 10;
  return { ...base, tau, dist, dur, vrai: dist / dur };
}
function evaluerDefi(d) {
  if (d.type === 'prevoir') {
    const s = SITUATIONS.find(x => x.id === d.id), o1 = d.reps.dv === s.dv, o2 = d.reps.f === s.f;
    return { ok: o1 && o2, lignes: [[o1, o1 ? 'Bonne direction pour Δv.' : 'Δv : regardez comment la vitesse varie (de plus en plus vers le haut, vers le bas, ou pas du tout).'], [o2, o2 ? 'Bonne direction pour la somme des forces.' : 'La somme des forces a la même direction et le même sens que Δv.']] };
  }
  const x = lireNombre(d.reps.rep);
  if (d.type === 'construire') {
    const ok = Number.isFinite(x) && Math.abs(x - d.vrai) <= 0.06;
    return { ok, lignes: [[ok, ok ? 'Δv = v₂ − v₁ : correct, avec le bon signe.' : Number.isFinite(x) && Math.abs(x + d.vrai) <= 0.06 ? 'Attention au signe : Δv = v₂ − v₁ (arrivée moins départ), pas l’inverse.' : 'Calculez Δv = v₂ − v₁ en gardant le signe de chaque vitesse.']] };
  }
  const ok = Number.isFinite(x) && Math.abs(x - d.vrai) <= 0.05 * d.vrai;
  return { ok, lignes: [[ok, ok ? 'v ≈ distance ÷ durée : correct.' : Number.isFinite(x) && Math.abs(x - d.dist) <= 0.05 * d.dist ? 'Vous avez donné la distance. Divisez-la par la durée 2τ.' : 'Divisez la distance M(i−1)M(i+1) par la durée 2τ (pas par τ).']] };
}
const selStyle = { width: '100%', minHeight: 42, padding: '6px 8px', fontSize: 14.5, borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: '#fff' };
const DIRS = [['bas', 'vers le bas'], ['haut', 'vers le haut'], ['nul', 'nul (pas de direction)']];
function VoletDefi({ defi, setDefi, changerType }) {
  const res = defi.verifie ? evaluerDefi(defi) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); };
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }, q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{t}</div>;
  const choix = k => <select value={defi.reps[k] || ''} onChange={e => rep(k, e.target.value)} aria-label="Votre réponse" style={selStyle}><option value="" disabled>Choisissez une réponse</option>{DIRS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
  const champ = unite => <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>Votre réponse :
    <input type="text" inputMode="decimal" value={defi.reps.rep || ''} onChange={e => rep('rep', e.target.value)} aria-label="Votre réponse" style={{ width: 110, minHeight: 40, padding: '4px 8px', fontSize: 15, borderRadius: 8, border: `1.5px solid ${KIT.bord}` }}/> {unite}</label>;
  const s = defi.type === 'prevoir' ? SITUATIONS.find(x => x.id === defi.id) : null;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{lireProgression()[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'prevoir' && <>
        <div style={txt}><Pic n="target"/>{s.txt}</div>
        {q('Le vecteur variation de vitesse Δv est…')}{choix('dv')}
        {q('La somme des forces qui s’exercent sur le système est…')}{choix('f')}</>}
      {defi.type === 'construire' && <>
        <div style={txt}><Pic n="target"/>Une balle est en chute libre. L’axe vertical est orienté <strong>vers le haut</strong>. À un instant, sa vitesse vaut <strong>v₁ = {frs(defi.v1)} m/s</strong> ; <strong>{fr(defi.tau, 1)} s plus tard</strong>, <strong>v₂ = {frs(defi.v2)} m/s</strong>. Calculez la variation de vitesse <strong>Δv = v₂ − v₁</strong> (avec son signe).</div>
        {champ('m/s')}</>}
      {defi.type === 'vitesse' && <>
        <div style={txt}><Pic n="target"/>Sur une chronophotographie de chute, les points sont séparés de <strong>τ = {fr(defi.tau, 1)} s</strong>. La distance entre les points M(i−1) et M(i+1) est <strong>{fr(defi.dist, 2)} m</strong>. Calculez la valeur de la vitesse en M<sub>i</sub> avec 2 chiffres significatifs.</div>
        {champ('m/s')}</>}
      <IndiceDefi cache={reussi}>{defi.type === 'prevoir' ? <>Regardez la vitesse : constante ? De plus en plus vers le haut, ou vers le bas ? Δv est la <strong>variation</strong> de la vitesse, pas la vitesse elle-même. La somme des forces est dans la même direction et le même sens que Δv.</>
        : defi.type === 'construire' ? <>Δv = v₂ − v₁ : on prend la vitesse d’arrivée moins celle de départ, en gardant les signes (positif = vers le haut). Exemple : de +1,0 à −1,0 m/s, Δv = (−1,0) − (+1,0) = −2,0 m/s.</>
        : <>La vitesse en M<sub>i</sub> se calcule avec les deux points voisins : v ≈ M(i−1)M(i+1) ÷ (2τ). La durée écoulée entre M(i−1) et M(i+1) est <strong>2τ</strong>, pas τ.</>}</IndiceDefi>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13.5 }}>Voir la solution</button>}
      </div>
      {res && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', fontWeight: 700, marginTop: 4 }}><Pic n="party"/>Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'prevoir' && <>{s.expl}</>}
        {defi.type === 'construire' && <>Δv = v₂ − v₁ = ({frs(defi.v2)}) − ({frs(defi.v1)}) = <strong>{frs(defi.vrai)} m/s</strong>. {defi.vrai < 0 ? 'Le signe moins signifie « vers le bas » : c’est cohérent avec le poids, qui tire vers le bas.' : ''}</>}
        {defi.type === 'vitesse' && <>v ≈ {fr(defi.dist, 2)} ÷ (2 × {fr(defi.tau, 1)}) = {fr(defi.dist, 2)} ÷ {fr(defi.dur, 1)} ≈ <strong>{fr(defi.vrai, 1)} m/s</strong>.</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
const V1 = { pts: 1 }, V2 = { pts: 1, vec: 1 }, V3 = { pts: 1, vec: 1, cons: 1 }, V4 = { pts: 1, vec: 1, cons: 1, force: 1 };
export function SimulationChuteLibre() {
  const [mode, setMode] = useState(() => modeOuverture('chute-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('chute-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [P, setP] = useState(DEFAUT);
  const [k, setK] = useState(N_PTS - 1);
  const [sel, setSel] = useState(3);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [regOuv, setRegOuv] = useState(false);
  const [essOuv, setEssOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const changerMode = md => { setMode(md); if (md === 'defi') setDefi(nouveauDefi(defi ? defi.type : 'prevoir', null)); };

  const ETAPES = [
    { id: 'lacher', titre: 'Une bille qu’on lâche', scn: { v0: 0, ast: 'terre', tau: 0.2 }, vis: V1, sel: 3,
      texte: <>On lâche une bille sans vitesse initiale. Une caméra la photographie toutes les <strong>0,20 s</strong> : c’est une <strong>chronophotographie</strong>. Les dates (en secondes) sont écrites en haut, la hauteur en mètres sur l’axe. On néglige les frottements de l’air : la bille est en <strong>chute libre</strong>.
        <ExempleResolu><strong>Comment lire les points ?</strong> Entre deux photos, la durée est toujours la même (0,20 s). Si l’objet parcourt une grande distance pendant cette durée, il va vite ; une petite distance, il va lentement. Des points de plus en plus écartés : l’objet va de plus en plus vite.</ExempleResolu>
        À vous : regardez l’écartement des points.</>,
      tache: { type: 'qcm', q: 'Que fait la vitesse de la bille pendant la chute ?', options: ['Elle augmente : les points s’écartent de plus en plus', 'Elle reste constante : les points sont alignés sur une droite verticale', 'Elle diminue : la bille ralentit en approchant du sol', 'On ne peut pas le savoir avec une chronophotographie'], bonne: 0, expl: 'Entre deux photos, la bille parcourt une distance de plus en plus grande en 0,20 s : sa vitesse augmente.', indice: 'La durée entre deux photos est toujours 0,20 s. Compare les distances parcourues pendant ces durées égales.' } },
    { id: 'vitesse', titre: 'Le vecteur vitesse', scn: { v0: 0, ast: 'terre', tau: 0.2 }, vis: V2, sel: 3,
      retenirTitre: 'À RETENIR : LIRE UNE CHRONOPHOTOGRAPHIE',
      retenir: <>
        <SchemaChrono/>
        <Cle>Points de plus en plus écartés, vitesse qui augmente.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Le vecteur vitesse en M<sub>i</sub> a pour <strong>valeur</strong> la distance M<sub>i−1</sub>M<sub>i+1</sub> divisée par la durée <strong>2τ</strong>, pour <strong>direction et sens</strong> ceux du déplacement.</li>
          <li><strong>Exemple :</strong> 0,60 m parcourus en 0,40 s : v ≈ 1,5 m/s. <strong>Hypothèses :</strong> bille modélisée par un point ; deux points voisins, assez proches pour que la vitesse change peu.</li>
        </ul>
      </>,
      texte: <>Les <strong>flèches bleues</strong> sont les vecteurs vitesse <Vec c="v"/> : elles partent de chaque point (sauf le premier et le dernier). Leur direction est celle du mouvement, leur longueur représente la valeur de la vitesse. Au point M<sub>i</sub>, on approche la vitesse par le déplacement entre le point <strong>avant</strong> et le point <strong>après</strong>, divisé par la durée correspondante : <strong>2τ = 0,40 s</strong>.
        <ExempleResolu>Une balle parcourt 0,60 m entre M₁ et M₃, en 2τ = 0,40 s : v ≈ 0,60 ÷ 0,40 = 1,5 m/s.</ExempleResolu>
        À vous : sur la chronophotographie de la bille, la distance M₂M₄ vaut 2,35 m (points de 0,40 s à 0,80 s).</>,
      tache: { type: 'num', q: 'Quelle est la valeur de la vitesse de la bille en M₃ ? (M₂M₄ = 2,35 m ; durée = 2τ = 0,40 s)', unite: 'm/s', vrai: 5.9, tol: 0.03, affiche: x => String(x).replace('.', ','),
        pieges: [[11.8, 'Vous avez divisé par τ = 0,20 s. Entre M₂ et M₄ il s’écoule 2τ = 0,40 s.'], [2.35, 'C’est la distance. Divisez-la par la durée 2τ = 0,40 s.'], [1.18, 'Vous avez multiplié par 0,40. Il faut diviser : v = distance ÷ durée.']],
        calcul: () => ['Formule : v ≈ M₂M₄ ÷ (2τ).', 'Durée : de M₂ (0,40 s) à M₄ (0,80 s), il s’écoule 0,80 − 0,40 = 0,40 s = 2τ.', 'v ≈ 2,35 ÷ 0,40 = 5,875 m/s.', 'v ≈ 5,9 m/s (vers le bas).'], expl: 'v ≈ 2,35 ÷ 0,40 ≈ 5,9 m/s, dirigée vers le bas.', indice: 'v = distance ÷ durée. Entre M₂ et M₄, la durée écoulée est 2τ (deux intervalles de 0,20 s), soit 0,40 s.' } },
    { id: 'delta', titre: 'La variation de vitesse', scn: { v0: 0, ast: 'terre', tau: 0.2 }, vis: V3, sel: 3,
      texte: <>La vitesse change : on veut décrire <strong>comment</strong>. On compare le vecteur vitesse en M₃ (<Vec c="v"/> à 0,6 s) et le vecteur vitesse en M₄ (<Vec c="v"/> à 0,8 s). La <strong>variation du vecteur vitesse</strong> entre deux instants voisins est le vecteur <Vec c="Δv"/> = <Vec c="v"/><sub>M₄</sub> − <Vec c="v"/><sub>M₃</sub>. Sur le schéma de droite, on met les deux vecteurs vitesse côte à côte : <Vec c="Δv"/> va de la <strong>pointe</strong> du premier à la pointe du second (flèche orange).
        <ExempleResolu>Si un vecteur vitesse passe de 1 m/s à 3 m/s, vers la droite, Δv est vers la <strong>droite</strong> (il « ajoute » de la vitesse vers la droite). Si la vitesse vers la droite diminuait, Δv serait vers la gauche.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Dans quel sens est le vecteur Δv pour la bille qui tombe ?', options: ['Vers le bas, comme la vitesse qui augmente', 'Vers le haut, contre la chute', 'Il n’y a pas de sens : Δv est nul', 'Vers le haut, car la bille est attirée par le haut'], bonne: 0, expl: 'La vitesse vers le bas augmente : on « ajoute » de la vitesse vers le bas. Δv est vers le bas.', indice: 'Regarde le schéma : la flèche orange va de la pointe de la première flèche bleue à la pointe de la seconde. Dans quel sens ?' } },
    { id: 'valeur', titre: 'Combien vaut Δv ?', scn: { v0: 0, ast: 'terre', tau: 0.2 }, vis: V3, sel: 3,
      retenirTitre: 'À RETENIR : LA VARIATION DE VITESSE',
      retenir: <>
        <SchemaDelta/>
        <Cle>Δv = vitesse après moins vitesse avant.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>On dessine <Vec c="v"/><sub>1</sub> et <Vec c="v"/><sub>2</sub>, puis <Vec c="Δv"/> relie la pointe de <Vec c="v"/><sub>1</sub> à celle de <Vec c="v"/><sub>2</sub>. En une dimension : Δv = v<sub>2</sub> − v<sub>1</sub> (avec les signes).</li>
          <li>Si la vitesse ne varie pas, <Vec c="Δv"/> = <Vec c="0"/>. <strong>Exemple :</strong> de 2 m/s à 5 m/s vers la droite, Δv = 3 m/s vers la droite.</li>
        </ul>
      </>,
      texte: <>Pour la bille, la vitesse en M₃ (0,6 s) vaut environ <strong>5,9 m/s</strong> et celle en M₄ (0,8 s) environ <strong>7,8 m/s</strong>, toutes deux vers le bas. Calculez la <strong>valeur</strong> de la variation de vitesse (sa longueur).
        <ExempleResolu>De 2 m/s à 5 m/s dans le même sens : la valeur de Δv est 5 − 2 = 3 m/s.</ExempleResolu></>,
      tache: { type: 'num', q: 'Quelle est la valeur de Δv entre 0,6 s et 0,8 s ? (5,9 m/s puis 7,8 m/s, même sens)', unite: 'm/s', vrai: 1.9, tol: 0.06, affiche: x => String(x).replace('.', ','),
        pieges: [[13.7, 'Vous avez additionné les vitesses. La variation est la différence : arrivée moins départ.'], [7.8, 'C’est la vitesse après. Il faut soustraire la vitesse avant.'], [-1.9, 'Le signe dépend de l’axe choisi ; ici on demande la valeur (la longueur de la flèche) : 1,9 m/s.']],
        calcul: () => ['Formule : valeur de Δv = valeur de v₄ − valeur de v₃ (même sens).', '7,8 − 5,9 = 1,9.', 'Δv ≈ 1,9 m/s, vers le bas. (Avec les valeurs plus précises 7,84 et 5,88, on trouve 1,96 m/s : l’écart vient des arrondis.)'], expl: 'Δv ≈ 7,8 − 5,9 = 1,9 m/s, vers le bas.', indice: 'Les deux vitesses sont dans le même sens : la valeur de Δv est la différence, arrivée moins départ : 7,8 − 5,9.' } },
    { id: 'force', titre: 'Quelle force fait varier la vitesse ?', scn: { v0: 0, ast: 'terre', tau: 0.2 }, vis: V4, sel: 3,
      texte: <>Le <strong>principe d’inertie</strong> dit : si les forces se compensent, la vitesse ne varie pas. Ici la vitesse varie : les forces ne se compensent pas. On observe de plus que <Vec c="Δv"/> est <strong>vers le bas</strong>. Cherchons ce qui agit sur la bille (frottements négligés) : une seule force, le <strong>poids</strong> <Vec c="P"/>, flèche rouge sur le schéma (c’est la force d’attraction de la Terre).
        <ExempleResolu>Dans la chute libre, la bille n’a plus de contact avec la main : aucune force de contact, seulement l’action à distance de la Terre.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Quelle force explique que Δv soit vers le bas ?', options: ['Le poids de la bille, seule force qui agit', 'Une force de la main, qui continue de pousser vers le bas', 'Les frottements de l’air, qui aspirent la bille vers le bas', 'Aucune force : la bille tombe toute seule'], bonne: 0, expl: 'Frottements négligés, la seule force est le poids, vers le bas : même sens que Δv.', indice: 'Après le lâcher, la main n’est plus en contact avec la bille. Quelle action à distance s’exerce encore sur la bille ?' } },
    { id: 'lancer', titre: 'Et si on lance la balle vers le haut ?', scn: { v0: 5.88, ast: 'terre', tau: 0.2 }, vis: V4, sel: 1,
      retenirTitre: 'À RETENIR : Δv ET FORCES',
      retenir: <>
        <SchemaLien/>
        <Cle>La somme des forces et Δv sont toujours dans le même sens.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>La <strong>variation de vitesse</strong> a la même direction et le même sens que la <strong>somme des forces</strong> : <Vec c="Δv"/> = <Vec c="0"/> ⇔ <Vec c="ΣF"/> = <Vec c="0"/>.</li>
          <li><strong>Exemple :</strong> une bille lâchée n’a que son poids, vers le bas : Δv est vers le bas aussi. <strong>Hypothèses :</strong> frottements de l’air négligés, système modélisé par un point.</li>
        </ul>
      </>,
      texte: <>On lance maintenant la balle <strong>vers le haut</strong>, à environ 5,9 m/s. Elle monte, s’arrête, puis redescend. Les flèches bleues sont de plus en plus courtes pendant la montée : la vitesse (vers le haut) <strong>diminue</strong>. Regardez le point M₁ : le vecteur Δv (flèche orange, schéma de droite) est-il vers le haut, comme le mouvement, ou vers le bas ?
        <ExempleResolu>Une voiture roule vers la droite et freine : sa vitesse vers la droite diminue. Δv est vers la <strong>gauche</strong>, donc opposé au mouvement. Les freins exercent une force vers la gauche.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Pendant la montée de la balle, Δv est dirigé…', options: ['vers le bas, comme le poids', 'vers le haut, comme le mouvement de la balle', 'vers le haut, car la balle monte', 'il est nul, car la balle va dans un seul sens'], bonne: 0, expl: 'La vitesse vers le haut diminue : on « retire » de la vitesse vers le haut, ce qui revient à ajouter de la vitesse vers le bas. Δv est vers le bas, comme le poids.', indice: 'Comme la voiture qui freine : la vitesse diminue, donc Δv est opposé au mouvement.' } },
    { id: 'sommet', titre: 'Au sommet de la trajectoire', scn: { v0: 5.88, ast: 'terre', tau: 0.2 }, vis: V4, sel: 3,
      texte: <>Au point le plus haut (M₃, à 0,6 s), la balle s’arrête un instant : sa vitesse est <strong>nulle</strong> (<Vec c="v"/> = <Vec c="0"/>). Beaucoup pensent alors qu’il n’y a plus de force. Regardez le schéma de droite : Δv entre M₃ et M₄ n’est pas nul, car la vitesse passe de 0 à une vitesse vers le bas.
        <ExempleResolu>Quand on lance une pomme vers le haut, au sommet elle ne reste pas en l’air : elle redescend aussitôt. Une vitesse nulle <em>à un instant</em> n’empêche pas la vitesse de varier juste après.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Au sommet, la vitesse est nulle. La somme des forces qui s’exercent sur la balle est…', options: ['non nulle : le poids agit toujours, vers le bas', 'nulle, puisque la balle est arrêtée', 'vers le haut, pour la retenir un instant', 'non nulle, mais seulement un instant'], bonne: 0, expl: 'Le poids ne dépend pas de la vitesse. La vitesse varie juste après (Δv est vers le bas), donc la somme des forces n’est pas nulle.', indice: 'Regarde Δv autour du sommet : est-il nul ? Si Δv n’est pas nul, que dit le principe d’inertie sur la somme des forces ?' } },
    { id: 'astre', titre: 'Sur la Lune', scn: { v0: 0, ast: 'lune', tau: 0.2 }, vis: V4, sel: 3,
      retenirTitre: 'À RETENIR : MONTÉE ET DESCENTE',
      retenir: <>
        <SchemaMontee/>
        <Cle>Vitesse nulle ne veut pas dire force nulle.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>En montant, la vitesse diminue ; en descendant, elle augmente vers le bas : dans les deux cas Δv est <strong>vers le bas</strong>, comme le poids.</li>
          <li><strong>Exemple :</strong> au sommet, v = 0 mais Δv n’est pas nul : le poids agit toujours. <strong>Hypothèse :</strong> g constant sur la hauteur de la trajectoire.</li>
        </ul>
      </>,
      texte: <>Même expérience, mais sur la <strong>Lune</strong> : on lâche une bille avec le même intervalle τ = 0,20 s. Sur la Lune, g vaut 1,6 N/kg au lieu de 9,8 N/kg : le <strong>poids</strong> de la bille est plus petit. Comparez la flèche rouge et la flèche orange avec celles de la Terre.
        <ExempleResolu>Sur la Terre, la bille de l’expérience précédente avait un Δv de longueur environ 2 m/s entre deux points voisins. Sur la Lune, les points de la chronophotographie sont bien moins écartés.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Sur la Lune, comparé à la Terre (même τ), le vecteur Δv entre deux instants voisins est…', options: ['plus court, car le poids est plus petit', 'plus long, car il y a moins d’air sur la Lune', 'de même longueur : seule compte la chute libre', 'inversé : il est vers le haut sur la Lune'], bonne: 0, expl: 'Un poids plus petit fait moins varier la vitesse : Δv est plus court, mais toujours vers le bas.', indice: 'Δv a la même direction que la somme des forces. Si la force est plus petite, la vitesse varie plus ou moins vite ?' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', scn: { v0: 0, ast: 'terre', tau: 0.2 }, vis: V4, sel: 3,
      retenirTitre: 'À RETENIR : APPLIQUER LA RELATION',
      retenir: <>
        <SchemaBilan/>
        <Cle>Je regarde Δv : son sens donne celui de la somme des forces.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Δv <strong>vers le bas</strong> : somme des forces vers le bas (chute libre : le poids). Δv <strong>nul</strong> : forces compensées. Δv <strong>vers le haut</strong> : somme des forces vers le haut (ascenseur qui accélère en montant).</li>
          <li><strong>Exemple :</strong> la balle lancée vers le haut a Δv vers le bas à chaque instant, même quand elle monte.</li>
        </ul>
      </>,
      texte: <>Bravo ! Vous savez relier la <strong>variation du vecteur vitesse</strong> à la <strong>somme des forces</strong> : <Vec c="Δv"/> a la même direction et le même sens que <Vec c="ΣF"/>. Dans une chute libre, seule force : le poids, donc Δv est vers le bas, que l’objet monte ou descende.
        <div style={{ marginTop: 8 }}>Explorez librement (lancer, Lune, Mars) ou passez aux défis.</div></> },
  ];
  const etape = ETAPES[Math.min(guide.etape, ETAPES.length - 1)];
  const dG = dessin(etape.scn), dE = dessin(P);
  const LA = useHorloge((dE.N - 1) * dE.tau + 1.2, true), animE = enExplore && (LA.joue || LA.t > 0) ? LA : null;

  // ════════════════ PANNEAUX ════════════════
  const aide = { fontSize: 12.5, color: KIT.txt2, fontWeight: 400, display: 'block', lineHeight: 1.4 };
  const planche = (d, vis, kk, ss, setSS, anim = null) => (
    <div style={styleBoite}>
      <div className="cl-l">
        <Scene d={d} vis={vis} k={kk} sel={ss} anim={anim}/>
        <div>
          {vis.cons && ss >= 1 && ss + 2 <= kk && <Construction d={d} i={ss} force={!!vis.force}/>}
          {vis.cons && ss >= 1 && ss + 2 <= kk && <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Variation de vitesse entre {fr(d.t[ss], 1)} s et {fr(d.t[ss + 1], 1)} s (points M{ss} et M{ss + 1}).</div>}
          {setSS && vis.cons && <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>Instant étudié
            <span style={aide}>Choisissez la paire de points voisins.</span>
            <select value={ss} onChange={e => setSS(+e.target.value)} aria-label="Instant étudié" style={selStyle}>{Array.from({ length: Math.max(0, kk - 2) }, (_, j) => j + 1).map(j => <option key={j} value={j}>entre {fr(d.t[j], 1)} s et {fr(d.t[j + 1], 1)} s</option>)}</select></label>}
        </div>
      </div>
    </div>);
  const resumeReglages = `${LANCERS.find(l => l[0] === P.v0)[1].toLowerCase()} · ${GRAV.find(a => a[0] === P.ast)[1] === 'la Terre' ? 'sur la Terre' : 'sur ' + GRAV.find(a => a[0] === P.ast)[1]} · τ = ${fr(P.tau, 2)} s`;
  const reglagesExplo = (
    <Section titre={`Réglages : ${resumeReglages}`} ouvert={regOuv} onBascule={() => setRegOuv(o => !o)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 13.5, fontWeight: 600 }}>Lancer
          <span style={aide}>Comment la balle part à la date 0 s.</span>
          <select value={P.v0} onChange={e => setP(p => ({ ...p, v0: +e.target.value }))} aria-label="Lancer" style={selStyle}>{LANCERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label style={{ fontSize: 13.5, fontWeight: 600 }}>Astre
          <span style={aide}>Plus g est petit, plus le poids est petit.</span>
          <select value={P.ast} onChange={e => setP(p => ({ ...p, ast: e.target.value }))} aria-label="Astre" style={selStyle}>{GRAV.map(([id, nom, gg]) => <option key={id} value={id}>{nom === 'la Terre' ? 'Sur la Terre' : `Sur ${nom}`} (g = {fr(gg, 1)} N/kg)</option>)}</select></label>
        <label style={{ fontSize: 13.5, fontWeight: 600 }}>Durée τ entre deux photos
          <span style={aide}>Une durée plus longue écarte les points.</span>
          <select value={P.tau} onChange={e => setP(p => ({ ...p, tau: +e.target.value }))} aria-label="Durée entre deux photos" style={selStyle}>{[0.1, 0.2, 0.4].map(t => <option key={t} value={t}>{fr(t, 2)} s</option>)}</select></label>
      </div>
    </Section>);
  const lecture = (
    <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>Photos affichées : <strong>{k + 1}</strong> sur {N_PTS}
      <span style={aide}>Faites avancer le temps pour voir la chronophotographie se construire.</span>
      <input type="range" min="2" max={N_PTS - 1} step="1" value={k} aria-label="Nombre de photos affichées" onChange={e => setK(+e.target.value)} style={{ width: '100%' }}/></label>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Système = la balle</strong>, modélisée par un <strong>point matériel</strong> : sa taille n’intervient pas.</li>
      <li><strong>Chute libre</strong> : la seule force est le poids ; les <strong>frottements de l’air sont négligés</strong>. C’est raisonnable pour une bille dense sur quelques mètres, pas pour une plume.</li>
      <li><strong>g constant</strong> sur la hauteur étudiée : 9,8 N/kg sur la Terre, 1,6 N/kg sur la Lune, 3,7 N/kg sur Mars.</li>
      <li><strong>Référentiel terrestre</strong> (ou lunaire, martien) supposé galiléen, axe vertical orienté vers le haut.</li>
      <li><strong>Vitesse approchée</strong> par M<sub>i−1</sub>M<sub>i+1</sub> / 2τ : valable si la vitesse varie peu entre deux points voisins. Ici c’est une très bonne approximation (le mouvement est parfaitement régulier). Pour cette raison, le premier et le dernier point n’ont pas de vecteur vitesse.</li>
      <li>La simulation ne donne <strong>pas de relation entre Δv, la masse et la force</strong> : au programme de seconde, seule compte la même direction et le même sens.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <Section titre="À essayer" ouvert={essOuv} onBascule={() => setEssOuv(o => !o)}>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
          <li>Lâchée sur la Terre : choisissez plusieurs paires de points. Δv change-t-il ? (Les flèches orange ont-elles la même longueur ?)</li>
          <li>Lancée vers le haut : choisissez une paire avant le sommet, puis une paire après. Que remarquez-vous sur le sens de Δv ?</li>
          <li>Passez sur la Lune : comparez la longueur de Δv avec celle sur la Terre.</li>
          <li>Lancée vers le bas à 5 m/s : la vitesse augmente. Δv est-il vers le haut ou vers le bas ?</li>
          <li>Changez τ : les points s’écartent. Les valeurs de v en m/s changent-elles ?</li>
        </ul>
      </Section>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>Δv = variation du vecteur vitesse entre deux instants voisins (pointe de <Vec c="v"/><sub>1</sub> à pointe de <Vec c="v"/><sub>2</sub>)</li>
    <li>Δv a la même direction et le même sens que la somme des forces</li>
    <li>chute libre : seul le poids, donc Δv vers le bas (même en montant)</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);
  const finDuGuide = enGuide && etape.id === 'fin';

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cl-l { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        .cl-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (min-width: 560px) { .cl-l { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
        @media (max-width: 900px) { .cl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chute libre : la variation de vitesse et la force</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Pourquoi la vitesse d’une bille qu’on lâche augmente-t-elle ? Observez une <strong>chronophotographie</strong>, construisez le vecteur <strong>variation de vitesse</strong> Δv et reliez-le à la <strong>force</strong> qui s’exerce sur la bille.</div>
      <div className={`cl-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={t2 => setDefi(nouveauDefi(t2, defi))}/></div>}
          {enGuide && planche(dG, etape.vis, N_PTS - 1, etape.sel, null)}
          {enExplore && <>{planche(dE, { pts: 1, vec: 1, cons: 1, force: 1 }, k, sel, setSel, animE)}<div style={{ ...styleBoite, padding: '8px 12px' }}><div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.45 }}>Regardez la balle tomber : un point reste à chaque intervalle de temps, la flèche bleue est sa vitesse.</div><Commandes L={LA}/><input type="range" aria-label="Instant de la chute" min={0} max={(dE.N - 1) * dE.tau} step={0.01} value={Math.min(LA.t, (dE.N - 1) * dE.tau)} onChange={e => { LA.setJoue(false); LA.setT(+e.target.value); }} style={{ width: '100%', marginTop: 6 }}/></div><div style={styleBoite}>{lecture}<div style={{ marginTop: 10 }}>{reglagesExplo}</div></div></>}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {(enExplore || finDuGuide) && <div className="cl-l2">{panneauHypo}</div>}
      {enExplore && <div className="cl-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
