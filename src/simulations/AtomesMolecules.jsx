import { useState, useEffect, useRef } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, ExempleResolu, lireProgression } from "../commun";
import { element, etatEntite, ionProbable, configTxt, valence, ionTxt,
  MOLECULES, MOLECULES_DEFI, moleculeDe, analyserLewis, doubletsAuto, liaisonsDeRef, cleLiaison, voisinsDe, GAZ_NOBLES } from "./atomesModele";
import { SchemaAtome, TableauPeriodique } from "./atomesVue";

// ====================================================
//  SIM 57 — ATOMES, IONS ET MOLÉCULES : LA QUÊTE DE L'OCTET (2GT, « Modéliser la matière à l'échelle microscopique »)
//  Atelier 1 : le cortège électronique d'un atome (Z = 1 à 20), configuration, électrons de valence, ions stables.
//  Atelier 2 : un éditeur de schémas de Lewis (liaisons, doublets non liants) qui vérifie l'octet et le duet atome par atome.
//  Parcours guidé avec exemples résolus, exploration libre, 3 défis. Modèle : atomesModele.js.
// ====================================================

const SIM = 57;
declarerDefis(SIM, [
  ['ion', 'Former l’ion stable d’un atome'],
  ['config', 'Configuration électronique d’un ion'],
  ['lewis', 'Schéma de Lewis d’une molécule'],
]);

const BLEU = '#2563eb', ORANGE = '#b45309', VERT = '#15803d';
const de = nom => (/^[aeiouyéèh]/i.test(nom) ? `d’${nom}` : `de ${nom}`);
const NOM_ANION = { H: 'hydrure', N: 'nitrure', O: 'oxyde', F: 'fluorure', P: 'phosphure', S: 'sulfure', Cl: 'chlorure' };
function nomEntite(Z, n) {
  const e = element(Z), q = Z - n;
  return q === 0 ? `atome ${de(e.nom)}` : q > 0 ? `ion ${e.nom} (cation)` : `ion ${NOM_ANION[e.sym] || e.nom} (anion)`;
}
const pl = (n, s, p = `${s}s`) => `${n} ${n > 1 ? p : s}`;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const alea = liste => liste[Math.floor(Math.random() * liste.length)];

// ---------- planche de Lewis : positions des atomes ----------
const W = 560, H = 330, R = 22;
function placer(atomes) {
  const idx = atomes.map((s, i) => i), lourds = idx.filter(i => atomes[i] !== 'H'), legers = idx.filter(i => atomes[i] === 'H');
  const pos = new Array(atomes.length);
  if (lourds.length === 0) { legers.forEach((i, k) => { pos[i] = { x: W / 2 + (k ? 80 : -80), y: H / 2 }; }); return pos; }
  if (lourds.length === 1) {
    pos[lourds[0]] = { x: W / 2, y: H / 2 };
    const k = legers.length, depart = k === 1 ? 180 : k === 2 ? 135 : k === 3 ? 90 : 45;
    legers.forEach((i, j) => { const a = (depart + (360 / Math.max(k, 1)) * j) * Math.PI / 180; pos[i] = { x: W / 2 + 120 * Math.cos(a), y: H / 2 - 105 * Math.sin(a) }; });
    return pos;
  }
  const ordre = lourds.length === 3 ? [lourds[1], lourds[0], lourds[2]] : lourds;      // pour trois atomes lourds, le premier au centre
  ordre.forEach((i, k) => { pos[i] = { x: lourds.length === 2 ? W / 2 + (k ? 100 : -100) : 110 + k * 170, y: H / 2 }; });
  legers.forEach((i, k) => {
    const haut = k % 2 === 0, rang = Math.floor(k / 2), total = Math.ceil(legers.length / 2);
    pos[i] = { x: 70 + (W - 140) * (total === 1 ? 0.5 : rang / (total - 1)), y: haut ? 48 : H - 48 };
  });
  return pos;
}
const initMol = id => { const m = moleculeDe(id); return { id, pos: placer(m.atomes), bonds: {}, lp: m.atomes.map(() => 0), sel: null }; };
const molRef = id => { const m = moleculeDe(id), bonds = liaisonsDeRef(m.ref); return { id, pos: placer(m.atomes), bonds, lp: doubletsAuto(m.atomes, bonds), sel: null }; };

// ---------- dessin d'une planche de Lewis ----------
const TEINTE = { H: '#f1f5f9', C: '#d6d3d1', N: '#dbeafe', O: '#fee2e2', F: '#ecfccb', Cl: '#ecfccb' };
const COR_A = '#d55e00', COR_B = '#0072b2', ENCRE = '#0f172a';       // orange / bleu : lisibles par les daltoniens
const ANGLES = Array.from({ length: 8 }, (_, k) => (k * 45 - 90) * Math.PI / 180);
const ecart = (a, b) => { let d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
function Planche({ mol, atomes, analyse, onAtome, onDeplacer, titre, rendu = 'tirets' }) {
  const eMode = rendu === 'electrons';
  const svg = useRef(null), drag = useRef(null);
  const pt = e => { const r = svg.current.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  // rendu « électrons » : chaque électron de valence est un point ; les électrons appariés sont entourés d'un ovale
  const point = (k, x, y, c) => <circle key={k} cx={x} cy={y} r={4.4} fill={c} stroke="#fff" strokeWidth="1"/>;
  const liaisonsEl = Object.entries(mol.bonds).filter(([, o]) => o > 0).map(([k, o]) => {
    const [i, j] = k.split('-').map(Number), a = mol.pos[i], b = mol.pos[j], d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ux = (b.x - a.x) / d, uy = (b.y - a.y) / d, nx = -uy, ny = ux, deg = Math.atan2(uy, ux) * 180 / Math.PI;
    return <g key={k}>{Array.from({ length: o }, (_, t) => { const off = (t - (o - 1) / 2) * 17, cx = (a.x + b.x) / 2 + nx * off, cy = (a.y + b.y) / 2 + ny * off;
      return <g key={t}><ellipse cx={cx} cy={cy} rx={16} ry={9} transform={`rotate(${deg} ${cx} ${cy})`} fill="#fff7ed" stroke="#b45309" strokeWidth="2"/>
        {point('a', cx - ux * 6.5, cy - uy * 6.5, COR_A)}{point('b', cx + ux * 6.5, cy + uy * 6.5, COR_B)}</g>; })}</g>;
  });
  const electronsLibres = i => {
    const P = analyse.par[i], l = mol.lp[i] || 0, s = Math.max(0, P.v - P.b - 2 * l);
    const placed = voisinsDe(mol.bonds, i).map(j => Math.atan2(mol.pos[j].y - mol.pos[i].y, mol.pos[j].x - mol.pos[i].x)), res = [];
    [...Array(l).fill('lp'), ...Array(s).fill('s')].forEach(kind => {
      let best = null;
      ANGLES.forEach(a => { if (res.some(r => r.a === a)) return; const sc = placed.length ? Math.min(...placed.map(p => ecart(a, p))) : 4; if (!best || sc > best.sc + 1e-9) best = { a, sc }; });
      if (best) { res.push({ kind, a: best.a }); placed.push(best.a); }
    });
    return res.map(({ kind, a }, k) => {
      const cx = mol.pos[i].x + (R + 12) * Math.cos(a), cy = mol.pos[i].y + (R + 12) * Math.sin(a), tx = -Math.sin(a), ty = Math.cos(a);
      return kind === 's' ? point(k, cx, cy, ENCRE)
        : <g key={k}><ellipse cx={cx} cy={cy} rx={11} ry={6.5} transform={`rotate(${a * 180 / Math.PI + 90} ${cx} ${cy})`} fill="#f1f5f9" stroke="#475569" strokeWidth="1.6"/>{point('p', cx - tx * 4.6, cy - ty * 4.6, ENCRE)}{point('q', cx + tx * 4.6, cy + ty * 4.6, ENCRE)}</g>;
    });
  };
  const liaisons = Object.entries(mol.bonds).filter(([, o]) => o > 0).map(([k, o]) => {
    const [i, j] = k.split('-').map(Number), a = mol.pos[i], b = mol.pos[j], d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ux = (b.x - a.x) / d, uy = (b.y - a.y) / d, nx = -uy, ny = ux;
    return <g key={k}>{Array.from({ length: o }, (_, t) => { const off = (t - (o - 1) / 2) * 7;
      return <line key={t} x1={a.x + ux * (R - 2) + nx * off} y1={a.y + uy * (R - 2) + ny * off} x2={b.x - ux * (R - 2) + nx * off} y2={b.y - uy * (R - 2) + ny * off} stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round"/>; })}</g>;
  });
  // doublets non liants : placés dans les directions les plus éloignées des liaisons
  const doublets = (i) => {
    const l = mol.lp[i] || 0; if (!l) return null;
    const angB = voisinsDe(mol.bonds, i).map(j => Math.atan2(mol.pos[j].y - mol.pos[i].y, mol.pos[j].x - mol.pos[i].x));
    const cand = Array.from({ length: 8 }, (_, k) => { const a = (k * 45 - 90) * Math.PI / 180;
      const sc = angB.length ? Math.min(...angB.map(b => { let dd = Math.abs(a - b) % (2 * Math.PI); if (dd > Math.PI) dd = 2 * Math.PI - dd; return dd; })) : 4;
      return { a, sc: sc + (k === 0 ? 0.01 : 0) }; }).sort((x, y) => y.sc - x.sc).slice(0, Math.min(l, 8));
    return cand.map(({ a }, k) => { const cx = mol.pos[i].x + (R + 11) * Math.cos(a), cy = mol.pos[i].y + (R + 11) * Math.sin(a), tx = -Math.sin(a) * 8, ty = Math.cos(a) * 8;
      return <line key={k} x1={cx - tx} y1={cy - ty} x2={cx + tx} y2={cy + ty} stroke="#0f172a" strokeWidth="4.2" strokeLinecap="round"/>; });
  };
  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, userSelect: 'none' }} role="group" aria-label={titre}>
      {eMode ? liaisonsEl : liaisons}
      {atomes.map((sym, i) => {
        const p = mol.pos[i], A = analyse.par[i], choisi = mol.sel === i;
        return (
          <g key={i} tabIndex={0} role="button" aria-label={`Atome ${sym} numéro ${i + 1} : ${A.ok ? 'stable' : 'à compléter'}`} style={{ cursor: 'grab', touchAction: 'none', outline: 'none' }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAtome(i); } }}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { i, s: pt(e), moved: false }; }}
            onPointerMove={e => { const d = drag.current; if (!d || d.i !== i) return; const q = pt(e);
              if (!d.moved && Math.hypot(q.x - d.s.x, q.y - d.s.y) > 6) d.moved = true;
              if (d.moved) onDeplacer(i, { x: clamp(q.x, R + 20, W - R - 20), y: clamp(q.y, R + 20, H - R - 20) }); }}
            onPointerUp={() => { const d = drag.current; drag.current = null; if (d && d.i === i && !d.moved) onAtome(i); }}
            onPointerCancel={() => { drag.current = null; }}>
            {choisi && <circle cx={p.x} cy={p.y} r={R + 10} fill="none" stroke={BLEU} strokeWidth="3"/>}
            <circle cx={p.x} cy={p.y} r={R + 4} fill="none" stroke={A.ok ? VERT : ORANGE} strokeWidth="3" strokeDasharray={A.ok ? undefined : '5 3'}/>
            <circle cx={p.x} cy={p.y} r={R} fill={TEINTE[sym] || '#fff'} stroke="#0f172a" strokeWidth="1.8"/>
            <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="19" fontWeight="800" fill="#0f172a" pointerEvents="none">{sym}</text>
            <circle cx={p.x + (R + 16)} cy={p.y - (R + 16)} r={9} fill={A.ok ? VERT : ORANGE} stroke="#fff" strokeWidth="1.5"/>
            <text x={p.x + (R + 16)} y={p.y - (R + 16) + 4.5} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" pointerEvents="none">{A.ok ? '✓' : '!'}</text>
            {eMode ? electronsLibres(i) : doublets(i)}
          </g>);
      })}
    </svg>);
}

// ---------- état de l'atelier « ions » ----------
const ION0 = { Z: 8, n: 8 };

// ====================================================
//  DÉFIS
// ====================================================
const TITRES = { ion: 'Former l’ion stable', config: 'Configuration d’un ion', lewis: 'Schéma de Lewis' };
const Z_ION_DEFI = [3, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20];
const IONS_CONFIG = [[3, 1], [11, 1], [19, 1], [12, 2], [20, 2], [13, 3], [9, -1], [17, -1], [8, -2], [16, -2], [7, -3], [15, -3]];
function nouveauDefi(type, prec) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'ion') { let Z; do { Z = alea(Z_ION_DEFI); } while (prec && prec.type === 'ion' && Z === prec.Z); return { ...base, Z }; }
  if (type === 'config') {
    let c; do { c = alea(IONS_CONFIG); } while (prec && prec.type === 'config' && c[0] === prec.Z);
    const [Z, q] = c, n = Z - q;
    const options = [...new Set([configTxt(n), configTxt(Z), configTxt(Z + q), configTxt(n + (q > 0 ? 2 : -2) > 0 ? n + (q > 0 ? 2 : -2) : n + 1)])];
    for (let k = 1; options.length < 4; k++) { const t = configTxt(n + k); if (!options.includes(t)) options.push(t); }
    return { ...base, Z, q, options: options.sort(() => Math.random() - 0.5) };
  }
  let id; do { id = alea(MOLECULES_DEFI); } while (prec && prec.type === 'lewis' && id === prec.id);
  return { ...base, id };
}
function evaluerDefi(d, ion, analyse) {
  if (d.type === 'ion') {
    const E = etatEntite(d.Z, ion.n), ok = E.stable && E.q !== 0;
    return { ok, lignes: [[ok, ok ? `Bravo : ${E.formule} a la configuration d’un gaz noble (${E.gaz.sym}) : sa couche de valence est pleine.`
      : E.q === 0 ? 'L’atome neutre n’est pas stable : ajoute ou retire des électrons.' : `${E.formule} n’est pas stable : sa couche de valence n’est pas pleine (${E.valence} électron${E.valence > 1 ? 's' : ''} de valence).`]] };
  }
  if (d.type === 'config') {
    const n = d.Z - d.q, x = parseInt(String(d.reps.n ?? '').trim(), 10), gaz = GAZ_NOBLES.find(g => g.n === n);
    const o1 = x === n, o2 = d.reps.conf === configTxt(n), o3 = d.reps.gaz === gaz.sym;
    return { ok: o1 && o2 && o3, lignes: [
      [o1, o1 ? 'Nombre d’électrons correct.' : `Nombre d’électrons : un atome neutre a Z électrons ; un ${d.q > 0 ? `cation de charge ${d.q}+ en perd ${d.q}` : `anion de charge ${-d.q}− en gagne ${-d.q}`}.`],
      [o2, o2 ? 'Configuration correcte.' : 'Configuration : remplis les sous-couches dans l’ordre 1s, 2s, 2p, 3s, 3p avec le bon nombre d’électrons.'],
      [o3, o3 ? 'Gaz noble correct.' : 'Gaz noble : cherche celui qui a le même nombre d’électrons que l’ion (He : 2, Ne : 10, Ar : 18).']] };
  }
  const m = moleculeDe(d.id);
  return { ok: analyse.ok, lignes: [[analyse.ok, analyse.ok ? `Schéma de Lewis correct : chaque atome de ${m.formule} est stable.`
    : analyse.resume || (analyse.par.find(a => !a.ok)?.msg || 'Complète le schéma.')]] };
}

function VoletDefi({ defi, setDefi, changerType, ion, analyse, planche }) {
  const res = defi.verifie ? evaluerDefi(defi, ion, analyse) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, x) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: x }, verifie: false }));
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); };
  const choix = (k, options) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{options.map(([v, l]) =>
    <button key={v} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, '#0ea5e9')}>{l}</button>)}</div>;
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }, q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{t}</div>;
  const E = defi.type === 'ion' ? element(defi.Z) : defi.type === 'config' ? element(defi.Z) : null;
  const m = defi.type === 'lewis' ? moleculeDe(defi.id) : null;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'ion' && <div style={txt}>🎯 Voici un atome de <strong>{E.nom}</strong> ({E.sym}, Z = {E.Z}). Avec les boutons « + électron » et « − électron », transforme-le en <strong>ion stable</strong> (couche de valence pleine), puis clique sur « Vérifier ».</div>}
      {defi.type === 'config' && <>
        <div style={txt}>🎯 Soit l’ion <strong>{ionTxt(E.sym, defi.q)}</strong> ({E.nom}, Z = {E.Z}). Utilise le tableau périodique pour t’aider, puis réponds.</div>
        {q(`Combien d’électrons possède l’ion ${ionTxt(E.sym, defi.q)} ?`)}
        <input value={defi.reps.n ?? ''} aria-label="Nombre d’électrons de l’ion" onChange={e => rep('n', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') verifier(); }}
          style={{ width: 80, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/>
        {q('Sa configuration électronique est…')}{choix('conf', defi.options.map(o => [o, o]))}
        {q('Il a la même configuration que le gaz noble…')}{choix('gaz', GAZ_NOBLES.map(g => [g.sym, g.sym]))}</>}
      {defi.type === 'lewis' && <div style={txt}>🎯 Construis le <strong>schéma de Lewis</strong> de la molécule <strong>{m.formule}</strong> ({m.nom}) : trace les liaisons, ajoute les doublets non liants, jusqu’à ce que tous les atomes soient ✓. Puis clique sur « Vérifier ».</div>}
      {defi.type !== 'config' && planche}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'ion' && (() => { const p = ionProbable(defi.Z), Ei = etatEntite(defi.Z, defi.Z - p.q);
          return <>{E.nom} (Z = {defi.Z}) : {configTxt(defi.Z)}, soit {valence(defi.Z)} électron{valence(defi.Z) > 1 ? 's' : ''} de valence. Le plus simple est de {p.q > 0 ? `perdre ${pl(p.q, 'électron')}` : `gagner ${pl(-p.q, 'électron')}`} :
            on obtient <strong>{Ei.formule}</strong> ({configTxt(Ei.n)}), la configuration {de(Ei.gaz.sym === 'He' ? 'l’hélium' : Ei.gaz.sym === 'Ne' ? 'néon' : 'l’argon').replace('de l’', 'de l’')} ({Ei.gaz.sym}).</>; })()}
        {defi.type === 'config' && <>L’ion {ionTxt(E.sym, defi.q)} a {defi.Z} {defi.q > 0 ? '−' : '+'} {Math.abs(defi.q)} = <strong>{defi.Z - defi.q} électrons</strong> : <strong>{configTxt(defi.Z - defi.q)}</strong>, comme le gaz noble <strong>{GAZ_NOBLES.find(g => g.n === defi.Z - defi.q).sym}</strong>.</>}
        {defi.type === 'lewis' && <>Une solution correcte est affichée sur le schéma ci-dessus ({m.atomes.length > 3 ? 'il peut en exister d’autres' : 'liaisons et doublets non liants'}). Règle : chaque atome doit avoir 8 électrons autour de lui (2 pour H), c’est-à-dire liaisons + doublets non liants = 4 (1 liaison pour H).</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationAtomesMolecules() {
  const [mode, setMode] = useState(() => modeOuverture('atomes-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('atomes-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('ion');            // 'ion' (atomes et ions) | 'mol' (molécules)
  const [ion, setIon] = useState(ION0);
  const [mol, setMol] = useState(() => initMol('H2O'));
  const [hypoOuv, setHypoOuv] = useState(false);
  const [rendu, setRendu] = useState('tirets');          // 'electrons' (points et ovales) | 'tirets' (notation de Lewis)
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';

  const atelierEff = enDefi ? (defi.type === 'lewis' ? 'mol' : defi.type === 'ion' ? 'ion' : 'aucun') : atelier;
  const molEff = enDefi && defi.type === 'lewis' && defi.solution ? { ...molRef(defi.id), pos: mol.pos } : mol;
  const atomes = moleculeDe(molEff.id).atomes;
  const analyse = analyserLewis(atomes, molEff.bonds, molEff.lp);
  const E = etatEntite(ion.Z, ion.n);
  const analyseEleve = analyserLewis(moleculeDe(mol.id).atomes, mol.bonds, mol.lp);      // le défi est jugé sur le schéma de l'élève, jamais sur la solution affichée

  // — actions sur l'atelier « ions » —
  const choisirElement = Z => setIon({ Z, n: Z });
  const ajouterE = d => setIon(s => ({ ...s, n: clamp(s.n + d, Math.max(0, s.Z - 3), s.Z + 3) }));
  // — actions sur la planche de Lewis —
  const gererMol = f => setMol(m => f(m));
  const cliquerAtome = i => gererMol(m => {
    if (m.sel === null) return { ...m, sel: i };
    if (m.sel === i) return { ...m, sel: null };
    const k = cleLiaison(m.sel, i), o = ((m.bonds[k] || 0) + 1) % 4, bonds = { ...m.bonds };
    if (o === 0) delete bonds[k]; else bonds[k] = o;
    return { ...m, bonds, sel: null };
  });
  const deplacer = (i, p) => gererMol(m => ({ ...m, pos: m.pos.map((q, k) => (k === i ? p : q)) }));
  const changerLP = d => gererMol(m => (m.sel === null ? m : { ...m, lp: m.lp.map((x, k) => (k === m.sel ? clamp(x + d, 0, 4) : x)) }));
  const effacer = () => gererMol(m => ({ ...initMol(m.id), pos: m.pos }));
  const choisirMol = id => setMol(initMol(id));
  const autoDoublets = () => gererMol(m => ({ ...m, lp: doubletsAuto(atomes, m.bonds) }));

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const voirAtome = (Z, n = Z) => { setAtelier('ion'); setIon({ Z, n }); };
  const voirMol = (id, r, solution = false) => { setAtelier('mol'); setMol(solution ? molRef(id) : initMol(id)); if (r) setRendu(r); };
  const molOk = id => molEff.id === id && analyse.ok;
  const eOx = etatEntite(8, 8), eF = etatEntite(9, 9), eNa = etatEntite(11, 11);
  const ETAPES = [
    { id: 'gaz', titre: 'Les gaz nobles : des atomes stables', depart: () => voirAtome(10),
      texte: <>La plupart des atomes ne restent pas seuls dans la nature. Les <strong>gaz nobles</strong> (hélium, néon, argon…) sont les seuls à vivre en atomes isolés : on dit qu’ils sont <strong>stables</strong>. Leur secret : leur dernière couche d’électrons, la <strong>couche de valence</strong>, est <strong>pleine</strong>.
        <ExempleResolu>Le néon (Z = 10) : {configTxt(10)}. Sa couche de valence (la dernière, n = 2) contient 2 + 6 = <strong>8 électrons</strong> : c’est un <strong>octet</strong>. Elle est pleine.
          {bouton('Voir le néon', () => voirAtome(10))}</ExempleResolu>
        À vous : l’argon. {bouton('Voir l’argon', () => voirAtome(18))}</>,
      tache: { type: 'qcm', q: 'Combien d’électrons de valence a l’argon (Z = 18) ?', options: ['8', '18', '2', '6'], bonne: 0,
        expl: `L’argon : ${configTxt(18)}. Sa dernière couche (n = 3) a 2 + 6 = 8 électrons : un octet. (L’hélium, lui, est stable avec 2 électrons : un duet.)` } },
    { id: 'valence', titre: 'Compter les électrons de valence', depart: () => voirAtome(8),
      texte: <>Pour trouver les <strong>électrons de valence</strong> d’un atome : on écrit sa configuration électronique, puis on compte les électrons de la <strong>dernière couche</strong> (celle dont le numéro n est le plus grand).
        <ExempleResolu>L’oxygène (Z = 8) : {eOx.config}. La dernière couche est n = 2 : 2 + 4 = <strong>{eOx.valence} électrons de valence</strong>. Pour un octet, il lui en manque {8 - eOx.valence}.
          {bouton('Voir l’oxygène', () => voirAtome(8))}</ExempleResolu>
        À vous : le fluor. {bouton('Voir le fluor', () => voirAtome(9))}</>,
      tache: { type: 'num', q: 'Combien d’électrons de valence a le fluor (Z = 9) ?', unite: '', vrai: eF.valence, tol: 0.001, affiche: x => String(x),
        pieges: [[9, 'Ce sont tous les électrons de l’atome. On ne compte que ceux de la dernière couche (n = 2).'], [5, 'Vous n’avez compté que les électrons 2p : n’oubliez pas ceux de 2s (couche n = 2 en entier).']],
        expl: `Fluor : ${eF.config}. Dernière couche (n = 2) : 2 + 5 = ${eF.valence} électrons de valence.` } },
    { id: 'manque', titre: 'Un atome pas stable', depart: () => voirAtome(9),
      texte: <>Un atome est stable s’il a <strong>8 électrons de valence</strong> (règle de l’<strong>octet</strong>). Une seule exception à connaître : <strong>H et He</strong> (et les ions Li⁺ et Be²⁺), dont la seule couche est la couche <strong>n = 1</strong>. Elle ne peut contenir que 2 électrons : elle est pleine avec <strong>2 électrons</strong> (règle du <strong>duet</strong>). Sinon, un atome cherche à compléter sa couche de valence.
        <ExempleResolu>L’oxygène a 6 électrons de valence : il lui en manque 8 − 6 = <strong>2</strong>. Il n’est pas stable seul.</ExempleResolu>
        À vous : regardez le fluor sur le schéma : les ronds <em>vides</em> sont les places libres de la couche de valence.</>,
      tache: { type: 'num', q: 'Combien d’électrons manque-t-il au fluor pour avoir un octet ?', unite: '', vrai: 1, tol: 0.001, affiche: x => String(x),
        pieges: [[7, 'C’est le nombre d’électrons de valence. Il manque 8 − 7.']],
        expl: 'Le fluor a 7 électrons de valence : 8 − 7 = 1 électron manquant.' } },
    { id: 'anion', titre: 'Gagner des électrons : l’anion', depart: () => voirAtome(9),
      texte: <>Une solution : <strong>gagner</strong> des électrons. L’atome devient un <strong>ion négatif</strong>, un <strong>anion</strong>.
        <ExempleResolu>Le fluor F gagne 1 électron et devient l’ion <strong>fluorure F⁻</strong>. Il a maintenant 10 électrons : {configTxt(10)}, comme le néon. Sa couche de valence est pleine : il est stable.
          {bouton('Voir F⁻', () => voirAtome(9, 10))}</ExempleResolu>
        À vous : fabriquez l’ion <strong>oxyde O²⁻</strong>. {bouton('Revenir à l’oxygène', () => voirAtome(8))}</>,
      tache: { type: 'action', ok: atelierEff === 'ion' && ion.Z === 8 && ion.n === 10, consigne: `Avec le bouton « + électron », donnez à l’oxygène la charge 2− (il doit avoir 10 électrons). Ici : ${E.formule} (${E.n} électrons).` } },
    { id: 'cation', titre: 'Perdre des électrons : le cation', depart: () => voirAtome(13),
      texte: <>L’autre solution : <strong>perdre</strong> des électrons (c’est plus simple quand il y en a peu sur la couche de valence). L’atome devient un <strong>ion positif</strong>, un <strong>cation</strong>.
        <ExempleResolu>Le sodium Na (Z = 11) : {eNa.config}. Il a un seul électron de valence (3s¹). S’il le perd, il devient <strong>Na⁺</strong> avec 10 électrons : {configTxt(10)}, comme le néon. Stable !
          {bouton('Voir Na⁺', () => voirAtome(11, 10))}</ExempleResolu>
        À vous : l’<strong>aluminium</strong> (Z = 13). {bouton('Voir l’aluminium', () => voirAtome(13))}</>,
      tache: { type: 'action', ok: atelierEff === 'ion' && ion.Z === 13 && ion.n === 10, consigne: `Avec « − électron », retirez les électrons de l’aluminium pour qu’il devienne stable (couche de valence pleine). Ici : ${E.formule} (${E.n} électrons).` } },
    { id: 'vocab', titre: 'Cation ou anion ?', depart: () => voirAtome(12, 10),
      texte: <>Retiens : <strong>cation</strong> = charge <strong>positive</strong> (l’atome a perdu des électrons) ; <strong>anion</strong> = charge <strong>négative</strong> (l’atome a gagné des électrons). La charge, c’est le nombre d’électrons perdus (+) ou gagnés (−).
        <ExempleResolu>Mg²⁺ : le magnésium (Z = 12) a perdu 2 électrons : 12 − 2 = 10 électrons, comme le néon. C’est un <strong>cation</strong>.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'L’ion chlorure Cl⁻ est…', options: ['un anion : il a gagné 1 électron', 'un cation : il a gagné 1 électron', 'un cation : il a perdu 1 électron', 'un anion : il a perdu 1 électron'], bonne: 0,
        expl: 'La charge est négative (−) : c’est un anion. Le chlore (17 électrons) a gagné 1 électron : 18 électrons, comme l’argon.' } },
    { id: 'proche', titre: 'Quel ion ? Le plus simple !', depart: () => voirAtome(16),
      texte: <>Un atome gagne ou perd <strong>le moins d’électrons possible</strong> pour ressembler au gaz noble <strong>le plus proche</strong>.
        <ExempleResolu>Le soufre (Z = 16) a 6 électrons de valence. Perdre 6 électrons ? Trop. Gagner 2 : il a alors 18 électrons comme l’argon. Il devient <strong>S²⁻</strong>.
          {bouton('Voir le soufre', () => voirAtome(16))}</ExempleResolu>
        À vous : le <strong>magnésium</strong> (2 électrons de valence).</>,
      tache: { type: 'qcm', q: 'Quel ion forme le plus simplement le magnésium (Z = 12) ?', options: ['Mg²⁺', 'Mg²⁻', 'Mg⁶⁺', 'Mg⁺'], bonne: 0,
        expl: 'Le magnésium a 2 électrons de valence : en perdre 2 est le plus simple. Il reste 10 électrons, comme le néon : Mg²⁺.' } },
    { id: 'essentiel1', titre: 'À retenir : les ions', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Un atome est <strong>stable</strong> s’il a la configuration d’un gaz noble : 8 électrons de valence (octet). Seule exception : <strong>H, He</strong> (et Li⁺, Be²⁺), dont la couche n = 1 est pleine avec 2 électrons (duet).</li>
        <li>Sinon, il peut <strong>gagner</strong> des électrons (<strong>anion</strong>, charge −) ou en <strong>perdre</strong> (<strong>cation</strong>, charge +).</li>
        <li>Il choisit l’ion qui lui coûte le moins d’électrons : Na⁺, Mg²⁺, Al³⁺, F⁻, Cl⁻, O²⁻…</li></ul></ARetenir>, tache: null },
    { id: 'h2', titre: 'Autre solution : mettre des électrons en commun', depart: () => voirMol('H2', 'electrons'),
      texte: <>Il y a une autre façon d’être stable : <strong>mettre des électrons en commun</strong> avec un autre atome. Les atomes assemblés forment une <strong>molécule</strong>. Ici, on dessine <strong>chaque électron de valence</strong> par un point autour de son atome.
        <ExempleResolu>Un atome d’hydrogène a 1 électron, tout seul (« célibataire »). Sa couche n = 1 n’est pleine qu’avec 2 électrons : il lui en manque 1. Deux atomes H mettent chacun leur électron en commun : les deux électrons <strong>s’apparient</strong> en un <strong>doublet liant</strong>, que <em>les deux atomes comptent</em>. Chacun « voit » 2 électrons. <strong>L’union fait la force !</strong> On obtient la molécule H₂.</ExempleResolu>
        <strong>Mode d’emploi</strong> : cliquez sur un atome, puis sur l’autre : leurs deux électrons s’apparient dans un ovale. Un clic de plus sur la même paire : un deuxième doublet (liaison double), puis un troisième, puis la liaison disparaît.</>,
      tache: { type: 'action', ok: molOk('H2'), consigne: 'Faites s’apparier les deux électrons des atomes d’hydrogène : les deux atomes doivent afficher ✓.' } },
    { id: 'hcl', titre: 'Doublets liants et non liants : HCl', depart: () => voirMol('HCl', 'electrons'),
      texte: <>Dans le chlorure d’hydrogène HCl, le chlore a 7 électrons de valence, dont <strong>un seul est célibataire</strong>. H et Cl mettent en commun leur électron célibataire : un <strong>doublet liant</strong>. Les 6 autres électrons de Cl étaient déjà appariés entre eux : ce sont <strong>3 doublets non liants</strong>, qui restent sur Cl sans être partagés.
        <ExempleResolu>Chlore : 7 électrons de valence = 1 (dans le doublet liant) + 3 × 2 (doublets non liants).<br/>Électrons « vus » par Cl : 2 (doublet liant) + 6 = <strong>8</strong> : octet ✓.<br/>Électrons « vus » par H : 2 (doublet liant) : couche n = 1 pleine, duet ✓.</ExempleResolu>
        À vous : reliez H et Cl, puis sélectionnez Cl et cliquez sur « ＋ doublet non liant » : deux électrons célibataires de Cl s’apparient. Recommencez jusqu’à ce qu’il n’en reste plus.</>,
      tache: { type: 'action', ok: molOk('HCl'), consigne: 'Complétez HCl jusqu’à ce que les deux atomes affichent ✓ (plus aucun électron célibataire).' } },
    { id: 'o2', titre: 'Deux doublets liants : O₂', depart: () => voirMol('O2', 'electrons'),
      texte: <>L’oxygène a 6 électrons de valence : <strong>2 sont célibataires</strong> (et 2 doublets déjà formés). Chaque atome O met en commun ses <strong>2 électrons célibataires</strong> avec l’autre : cela fait <strong>2 doublets liants</strong>, une <strong>liaison double</strong>.
        <ExempleResolu>Chaque oxygène : 6 électrons de valence = 2 (dans les doublets liants) + 2 × 2 (2 doublets non liants). Électrons vus : 4 + 4 = <strong>8</strong> : octet ✓.</ExempleResolu>
        À vous : construisez O₂ (double liaison : cliquez deux fois sur la même paire d’atomes), puis ajoutez les doublets non liants.</>,
      tache: { type: 'action', ok: molOk('O2'), consigne: 'Construisez O₂ : 2 doublets liants et 2 doublets non liants sur chaque atome.' } },
    { id: 'tirets', titre: 'On simplifie : seulement des tirets', depart: () => voirMol('HCl', 'tirets', true),
      texte: <>Dessiner tous les électrons devient vite long. En chimie, on utilise une notation plus simple, le <strong>schéma de Lewis</strong> : on ne dessine plus les points, mais <strong>un tiret par doublet</strong> d’électrons.
        <ExempleResolu>HCl : H — Cl avec 3 tirets autour de Cl. Le tiret <em>entre</em> deux atomes est un <strong>doublet liant</strong> (la liaison covalente). Les tirets <em>sur</em> un atome sont des <strong>doublets non liants</strong>.
          {bouton('Revoir avec les électrons', () => voirMol('HCl', 'electrons', true))}{' '}{bouton('Revenir aux tirets', () => voirMol('HCl', 'tirets', true))}</ExempleResolu>
        Désormais, à vous de dessiner directement des tirets.</>,
      tache: { type: 'qcm', q: 'Dans un schéma de Lewis, un tiret placé sur le seul atome de chlore (pas entre deux atomes) représente…', options: ['un doublet non liant (2 électrons)', 'un doublet liant (2 électrons partagés)', 'un électron célibataire', 'une liaison double'], bonne: 0,
        expl: 'Un tiret entre deux atomes = doublet liant ; un tiret sur un seul atome = doublet non liant. Dans les deux cas, ce sont 2 électrons.' } },
    { id: 'regle', titre: 'Combien de liaisons par atome ?', depart: () => voirAtome(7),
      texte: <>Le nombre de liaisons que fait un atome dépend de ce qui lui manque pour avoir 8 électrons (2 pour H).
        <table style={{ borderCollapse: 'collapse', margin: '6px 0', fontSize: 14 }}><thead><tr><th style={{ textAlign: 'left', padding: '2px 10px 2px 0' }}>Atome</th><th style={{ padding: '2px 10px' }}>électrons de valence</th><th style={{ padding: '2px 10px' }}>liaisons</th><th style={{ padding: '2px 10px' }}>doublets non liants</th></tr></thead>
          <tbody>{[['H', 1, 1, 0], ['O', 6, 2, 2], ['Cl', 7, 1, 3], ['C', 4, 4, 0]].map(l => <tr key={l[0]} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '2px 10px 2px 0', fontWeight: 700 }}>{l[0]}</td><td style={{ textAlign: 'center' }}>{l[1]}</td><td style={{ textAlign: 'center' }}>{l[2]}</td><td style={{ textAlign: 'center' }}>{l[3]}</td></tr>)}</tbody></table>
        <ExempleResolu>Pour un atome neutre : liaisons = 8 − (électrons de valence). Exemple, l’oxygène : 8 − 6 = <strong>2 liaisons</strong>, et ses 2 autres paires d’électrons sont non liantes.</ExempleResolu>
        À vous : l’azote. {bouton('Voir l’azote', () => voirAtome(7))}</>,
      tache: { type: 'num', q: 'Combien de liaisons fait un atome d’azote N (Z = 7) ?', unite: '', vrai: 3, tol: 0.001, affiche: x => String(x),
        pieges: [[5, 'C’est le nombre d’électrons de valence de l’azote. Il lui en manque 8 − 5.']],
        expl: 'Azote : 5 électrons de valence, il lui en manque 3 pour l’octet : 3 liaisons, et il garde 1 doublet non liant (5 − 3 = 2 électrons).' } },
    { id: 'h2o', titre: 'À vous : l’eau H₂O', depart: () => voirMol('H2O', 'tirets'),
      texte: <>Appliquez la règle : l’oxygène fait 2 liaisons (une avec chaque H), et il lui reste 2 doublets non liants. Chaque H fait 1 liaison.
        <ExempleResolu>O : 6 électrons de valence = 2 (liaisons) + 2 × 2 (2 doublets non liants). Chaque H : 1 liaison, duet ✓.</ExempleResolu>
        À vous : tracez les liaisons, puis placez les doublets non liants.</>,
      tache: { type: 'action', ok: molOk('H2O'), consigne: 'Construisez H₂O : les trois atomes doivent afficher ✓.' } },
    { id: 'co2', titre: 'Un cas plus riche : CO₂', depart: () => voirMol('CO2', 'tirets'),
      texte: <>Le carbone a 4 électrons de valence : il fait <strong>4 liaisons</strong>. Chaque oxygène en fait 2. Comment les relier ? Le carbone est relié aux deux oxygènes : il faut <strong>deux liaisons doubles</strong>.
        <ExempleResolu>C : 2 liaisons doubles = 4 liaisons, aucun doublet non liant (4 électrons de valence ✓). Chaque O : 1 liaison double + 2 doublets non liants (2 + 4 = 6 ✓). Électrons vus : 8 partout.</ExempleResolu>
        À vous : construisez CO₂.</>,
      tache: { type: 'action', ok: molOk('CO2'), consigne: 'Construisez CO₂ : les trois atomes doivent afficher ✓.' } },
    { id: 'essentiel2', titre: 'À retenir : les molécules', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Une <strong>molécule</strong> : des atomes liés par des <strong>liaisons covalentes</strong> (électrons partagés).</li>
        <li>Chaque atome cherche l’<strong>octet</strong> (8 électrons autour de lui). Seul H se contente du <strong>duet</strong> (2 électrons) : sa seule couche, n = 1, est alors pleine.</li>
        <li>Pour un atome : <strong>liaisons + doublets non liants = 4</strong> (H : 1 liaison seulement).</li>
        <li>H : 1 liaison · O : 2 · N : 3 · C : 4 · Cl, F : 1.</li></ul></ARetenir>, tache: null },
    { id: 'nh3', titre: '★ Pour aller plus loin : l’ammoniac NH₃', depart: () => voirMol('NH3', 'tirets'),
      texte: <>L’azote fait 3 liaisons et garde 1 doublet non liant : N a 5 électrons de valence = 3 + 2 × 1.
        <ExempleResolu>Chaque H se lie à N : 3 liaisons. N : 3 liaisons + 1 doublet non liant → 4 « blocs » = 8 électrons. ✓</ExempleResolu>
        À vous : construisez NH₃.</>,
      tache: { type: 'action', ok: molOk('NH3'), consigne: 'Construisez NH₃ : les quatre atomes doivent afficher ✓.' } },
    { id: 'isomeres', titre: '★ Mêmes atomes, plusieurs molécules : C₂H₆O', depart: () => voirMol('C2H6O', 'tirets'),
      texte: <>Avec 2 C, 6 H et 1 O, on peut assembler <strong>deux molécules différentes</strong> : l’<strong>éthanol</strong> (C — C — O) et l’<strong>éther diméthylique</strong> (C — O — C). Les deux respectent l’octet et le duet ! Vous pouvez <strong>déplacer les atomes</strong> en les faisant glisser.
        <ExempleResolu>Règles de départ : C fait 4 liaisons, O fait 2, H fait 1. Un H ne peut être lié qu’à un seul atome : il ne peut pas faire le pont entre deux atomes.</ExempleResolu>
        À vous : proposez un schéma de Lewis de C₂H₆O (n’importe lequel des deux).</>,
      tache: { type: 'action', ok: molOk('C2H6O'), consigne: 'Construisez une molécule C₂H₆O dont tous les atomes affichent ✓ (et qui est d’un seul tenant).' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Un atome « veut » ressembler à un <strong>gaz noble</strong> : couche de valence pleine : octet (8 électrons) ; duet (2) uniquement pour H et He, dont la seule couche est n = 1.</li>
        <li>Pour y arriver : devenir un <strong>ion</strong> (gagner ou perdre des électrons) ou former des <strong>liaisons</strong> (partager des électrons).</li>
        <li>Schéma de Lewis : liaisons (traits entre atomes) et doublets non liants (traits sur l’atome) ; chaque atome voit 8 électrons (2 pour H).</li>
        <li>Le modèle de l’octet est utile pour les petits atomes (Z ≤ 18) ; il a des exceptions, vues plus tard.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {           // à l'arrivée sur une étape, on met en place sa situation de départ
    if (mode !== 'guide') return;
    const d = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (d) d();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  // ════════════════ DÉFIS ════════════════
  function lancer(type, prec) {
    const d = nouveauDefi(type, prec); setDefi(d);
    if (type === 'ion') setIon({ Z: d.Z, n: d.Z });
    if (type === 'lewis') setMol(initMol(d.id));
  }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'ion', null); }

  // ════════════════ PANNEAUX ════════════════
  const verdictMol = analyse.ok
    ? <div style={{ color: VERT, fontWeight: 700 }}>✅ Schéma de Lewis correct : chaque atome est stable.</div>
    : <div style={{ color: ORANGE, fontWeight: 700 }}>⚠️ {analyse.par.filter(a => !a.ok).length} atome{analyse.par.filter(a => !a.ok).length > 1 ? 's' : ''} à compléter{analyse.resume ? ` — ${analyse.resume}` : ''}</div>;
  const dernierMsg = mol.sel !== null && !analyse.par[mol.sel].ok ? analyse.par[mol.sel].msg : (analyse.par.find(a => !a.ok) || {}).msg;
  const selA = mol.sel !== null ? analyse.par[mol.sel] : null;
  const plancheDefi = (
    <div>
      <Planche rendu={rendu} mol={molEff} atomes={atomes} analyse={analyse} onAtome={cliquerAtome} onDeplacer={deplacer} titre={`Schéma de ${moleculeDe(molEff.id).formule}`}/>
      {rendu === 'electrons' && <div style={{ marginTop: 4, fontSize: 12.5, color: KIT.txt2 }}>● Chaque point est un électron de valence. Dans un ovale, deux électrons sont <strong>appariés</strong> en doublet. Dans une liaison, l’électron <span style={{ color: COR_A, fontWeight: 700 }}>orange</span> vient d’un atome et l’électron <span style={{ color: COR_B, fontWeight: 700 }}>bleu</span> de l’autre.</div>}
      <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>{verdictMol}{dernierMsg && !analyse.ok && <div style={{ color: KIT.txt, marginTop: 2 }}>💬 {dernierMsg}</div>}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
        <button onClick={() => changerLP(1)} disabled={mol.sel === null} style={{ ...stylePetitBouton(false, '#334155'), opacity: mol.sel === null ? 0.5 : 1 }}>＋ doublet non liant</button>
        <button onClick={() => changerLP(-1)} disabled={mol.sel === null} style={{ ...stylePetitBouton(false, '#334155'), opacity: mol.sel === null ? 0.5 : 1 }}>− doublet non liant</button>
        <button onClick={effacer} style={stylePetitBouton(false, '#334155')}>🧹 Tout effacer</button>
        <button onClick={() => setRendu(r => (r === 'electrons' ? 'tirets' : 'electrons'))} style={stylePetitBouton(false, '#475569')} aria-label="Changer de représentation">{rendu === 'electrons' ? '● Électrons → voir les tirets' : '— Tirets → voir les électrons'}</button>
        {enExplore && <button onClick={autoDoublets} style={stylePetitBouton(false, '#4338ca')}>✨ Placer les doublets non liants pour moi</button>}
        <span style={{ fontSize: 13, color: KIT.txt2 }}>{selA ? `Atome sélectionné : ${selA.sym}` : 'Cliquez sur un atome pour le sélectionner (glissez-le pour le déplacer).'}</span>
      </div>
    </div>);
  const tableauBilan = (
    <div style={{ ...styleBoite, overflowX: 'auto' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Bilan atome par atome</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 6px' }}>Atome</th><th style={{ padding: '2px 6px' }}>e⁻ de valence</th><th style={{ padding: '2px 6px' }}>liaisons</th><th style={{ padding: '2px 6px' }}>doublets non liants</th><th style={{ padding: '2px 6px' }}>e⁻ autour</th><th style={{ padding: '2px 6px' }}/></tr></thead>
        <tbody>{analyse.par.map((a, i) => (
          <tr key={i} onClick={() => setMol(m => ({ ...m, sel: i }))} style={{ borderTop: '1px solid #e2e8f0', cursor: 'pointer', background: mol.sel === i ? '#eff6ff' : 'transparent' }}>
            <td style={{ padding: '2px 6px', fontWeight: 700 }}>{a.sym}{atomes.filter(s => s === a.sym).length > 1 ? ` n°${atomes.slice(0, i + 1).filter(s => s === a.sym).length}` : ''}</td>
            <td style={{ padding: '2px 6px' }}>{a.v}</td><td style={{ padding: '2px 6px' }}>{a.b}</td><td style={{ padding: '2px 6px' }}>{a.l}</td>
            <td style={{ padding: '2px 6px' }}>{a.autour} <span style={{ color: KIT.txt2 }}>/ {a.cible}</span></td>
            <td style={{ padding: '2px 6px', fontWeight: 800, color: a.ok ? VERT : ORANGE }}>{a.ok ? '✓' : '!'}</td></tr>))}</tbody></table>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>« e⁻ autour » = 2 × liaisons + 2 × doublets non liants : il doit valoir 8 (2 pour H). Les électrons de valence sont tous placés quand liaisons + 2 × doublets non liants = e⁻ de valence.</div>
    </div>);

  const panneauIon = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 250px', minWidth: 220 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{E.formule} — {nomEntite(ion.Z, ion.n)}</div>
          <SchemaAtome Z={ion.Z} n={ion.n}/>
          <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center' }}>● électrons de valence (orange) · ○ places libres de la couche de valence</div>
        </div>
        <div style={{ flex: '1 1 250px', minWidth: 230 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <button onClick={() => ajouterE(1)} style={styleBouton(true, '#0284c7')}>＋ électron</button>
            <button onClick={() => ajouterE(-1)} style={styleBouton(true, '#475569')}>− électron</button>
            <button onClick={() => setIon(s => ({ ...s, n: s.Z }))} style={styleBouton(false)}>↺ atome neutre</button>
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%' }}><tbody>
            {[['Numéro atomique Z (protons)', ion.Z], ['Nombre d’électrons', ion.n], ['Charge', E.q === 0 ? '0 (atome neutre)' : `${E.q > 0 ? '+' : '−'}${Math.abs(E.q)}${E.q > 0 ? ' (cation)' : ' (anion)'}`],
              ['Configuration électronique', E.config], ['Couche de valence', E.n ? E.configVal : '—'], ['Électrons de valence', E.valence]].map(([l, v]) => (
              <tr key={l} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '3px 6px 3px 0', color: KIT.txt2, fontWeight: 600 }}>{l}</td><td style={{ padding: '3px 0', fontWeight: 700 }}>{v}</td></tr>))}</tbody></table>
          <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, fontSize: 14.5, lineHeight: 1.5,
            background: E.stable ? '#f0fdf4' : '#fffbeb', border: `1.5px ${E.stable ? 'solid' : 'dashed'} ${E.stable ? '#86efac' : '#fcd34d'}`, color: KIT.txt }}>
            {E.stable ? <>✅ <strong>Stable</strong> : même configuration que le gaz noble <strong>{E.gaz.sym}</strong> ({E.n} électrons).</>
              : ion.n === 0 ? <>⚠️ Plus aucun électron : c’est l’ion H⁺, un cas particulier (le noyau seul).</>
                : <>⚠️ <strong>Pas stable</strong> : la couche de valence n’est pas pleine ({E.valence} électron{E.valence > 1 ? 's' : ''}).</>}</div>
        </div>
      </div>
    </div>);

  const choixElement = !enDefi && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Choisissez un élément</div>
      <TableauPeriodique choisi={ion.Z} onChoisir={choisirElement} colorier="aucun" compact/>
    </div>);
  const choixMolecule = !enDefi && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Choisissez une molécule</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{MOLECULES.map(m => <button key={m.id} onClick={() => choisirMol(m.id)} title={m.nom} style={stylePetitBouton(mol.id === m.id, '#4338ca')}>{m.formule}</button>)}</div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Cliquez sur un atome puis sur un autre pour tracer une liaison (encore un clic : double, triple, effacer). Glissez un atome pour le déplacer.</div>
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Éléments de Z = 1 à 20</strong> (jusqu’au calcium). Ordre de remplissage des sous-couches : 1s, 2s, 2p, 3s, 3p, 4s. C’est vrai pour ces éléments ; pour les suivants, il y a des exceptions.</li>
      <li><strong>Duet</strong> : il ne concerne que les atomes (ou ions) dont la seule couche est n = 1 : H, He, Li⁺, Be²⁺. Tous les autres visent l’octet (couche n = 2 ou n = 3 pleine).</li>
      <li><strong>Couche de valence</strong> : la dernière couche occupée (n le plus grand). <strong>Stable</strong> : même nombre d’électrons qu’un gaz noble (2, 10 ou 18). C’est un <em>modèle</em> : il explique bien les ions courants et les petites molécules, pas tous les composés.</li>
      <li><strong>Ion « le plus simple »</strong> : celui qui demande de gagner ou perdre le moins d’électrons. Le carbone et le silicium (4 électrons de valence) ne forment pas d’ions simples : ils forment des liaisons. L’ion H⁺ (plus aucun électron) est un cas à part.</li>
      <li><strong>Liaison covalente</strong> : un doublet d’électrons partagé entre deux atomes. Liaisons simples, doubles ou triples ; <strong>pas de charge formelle</strong> ni d’octet étendu (hors programme de seconde).</li>
      <li><strong>Dessin</strong> : les positions des atomes sont libres, ce ne sont pas les vraies positions dans l’espace : la <em>géométrie</em> d’une molécule n’est pas décrite (elle est étudiée plus tard).</li>
      <li><strong>Plusieurs schémas corrects</strong> sont possibles pour une même formule brute (C₂H₆O par exemple). Le défi accepte tout schéma qui respecte l’octet, le duet et la conservation des électrons de valence, avec une molécule d’un seul tenant.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Atomes : choisissez le néon, puis le sodium. Enlevez un électron au sodium : que devient sa couche de valence ?</li>
        <li>Ajoutez des électrons à l’oxygène un par un : à partir de combien est-il stable ? Et si vous en ajoutez trop ?</li>
        <li>Quels éléments peuvent former un ion positif ? Un ion négatif ? Regardez le nombre d’électrons de valence.</li>
        <li>Molécules : construisez H₂O, puis retirez un doublet non liant : quel atome devient « ! » ?</li>
        <li>CO₂ avec deux liaisons simples seulement : que dit le bilan ? Et avec N₂ et une liaison triple ?</li>
        <li>C₂H₆O : trouvez les deux assemblages possibles (déplacez les atomes pour y voir clair).</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>stable = configuration d’un gaz noble : octet (8) ; duet (2) seulement pour H, He (couche n = 1)</li>
    <li>cation : + (perte d’électrons) · anion : − (gain)</li>
    <li>liaisons + doublets non liants = 4 (H : 1 liaison)</li></ul></ARetenir>;

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);
  const ateliers = (enExplore || enGuide) && (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>Atelier :</span>
      <button onClick={() => setAtelier('ion')} style={stylePetitBouton(atelier === 'ion', '#16a34a')}>⚛️ Atomes et ions</button>
      <button onClick={() => setAtelier('mol')} style={stylePetitBouton(atelier === 'mol', '#16a34a')}>🔗 Molécules</button>
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .am-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .am-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .am-col { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        .am-col.deux { grid-template-columns: minmax(0, 1.5fr) minmax(250px, 1fr); }
        .am-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .am-l1.cote, .am-col.deux { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Atomes, ions et molécules : la quête de l’octet</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Presque aucun atome ne reste seul : pour être stable, il lui faut une couche d’électrons de valence pleine, comme un gaz noble. Il y arrive en devenant un <strong>ion</strong> ou en formant des <strong>liaisons</strong> avec d’autres atomes. Choisissez un atelier, puis manipulez.</div>
      {ateliers}
      <div className={`am-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && <div style={{ ...styleBoite, marginBottom: 12 }}>
            <VoletDefi defi={defi} setDefi={setDefi} ion={ion} analyse={analyseEleve} planche={atelierEff === 'ion' ? (
              <div className={`am-col${enExplore ? ' deux' : ''}`}><div>{panneauIon}</div><div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Tableau périodique (pour t’aider)</div><TableauPeriodique choisi={defi.Z} colorier="aucun" compact/></div></div>
            ) : plancheDefi} changerType={t => lancer(t, defi)}/></div>}
          {enDefi && defi.type === 'config' && <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Tableau périodique</div><TableauPeriodique choisi={defi.Z} colorier="aucun" compact/></div>}
          {!enDefi && atelierEff === 'ion' && <div className={`am-col${enExplore ? ' deux' : ''}`}>{panneauIon}{choixElement}</div>}
          {!enDefi && atelierEff === 'mol' && <div className={`am-col${enExplore ? ' deux' : ''}`}><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><div style={styleBoite}>{plancheDefi}</div>{tableauBilan}</div>{choixMolecule}</div>}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {enDefi && defi.type === 'lewis' && <div style={{ marginBottom: 12 }}>{tableauBilan}</div>}
      {!enDefi && <div className="am-l2">{panneauHypo}</div>}
      {enExplore && <div className="am-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
