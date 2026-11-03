import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu } from "../commun";
import { LISTE, MOLS, IDS, DOMAINES, domaine, intensite, typeC, courbeC } from "./rmn2dModele";
import { plat } from "./rmnModele";
import { fr } from "./elecModele";
import { BLEU, VERMILLON, VIOLET, VERT, alea } from "./elecOutils";
import { VoletDefiGen } from "./elecCommun";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 76 — RMN ¹³C ET RMN 2D : COSY ET HSQC (BTS Métiers de la chimie, analyse spectroscopique)
//  Suite de la sim 75 (RMN ¹H) : mêmes molécules, on ajoute le spectre du carbone 13 (découplé du proton) puis les cartes 2D
//  qui relient les signaux entre eux : HSQC (C ↔ H lié) et COSY (H ↔ H voisin).
//  Hypothèses : bibliothèque de 10 molécules décrites à la main (δ usuels dans CDCl₃) ; ¹³C découplé du proton (singulets) ;
//  intensités ¹³C non proportionnelles au nombre de C ; COSY = couplages ³J seulement ; HSQC = liaisons directes ;
//  pas de DEPT, ni de HMBC ; spectres idéaux sans bruit.
// ====================================================

const SIM = 76;
declarerDefis(SIM, [
  ['signaux', 'Combien de signaux ¹³C ?'],
  ['hsqc', 'Lire une carte HSQC'],
  ['cosy', 'Lire une carte COSY'],
  ['identifier', 'Identifier une molécule'],
]);
const TITRES = { signaux: 'Signaux ¹³C', hsqc: 'HSQC', cosy: 'COSY', identifier: 'Identifier' };
const COULS = [BLEU, VERMILLON, VERT, VIOLET, '#b45309', '#0e7490', '#be185d', '#475569'];
const nf = (x, d = 2) => fr(x, d);
const VUES = [['c13', '¹³C'], ['hsqc', 'HSQC'], ['cosy', 'COSY']];
const coulC = (M, num) => COULS[(num - 1) % COULS.length];
const coulG = (M, g) => { const c = M.carbones.find(x => x.g === g.k); return c ? coulC(M, c.num) : '#64748b'; };

// ---------- spectre ¹³C ----------
function Spectre13({ M, sel, onSel, cacher, titre }) {
  const W = 720, H = 250, x0 = 36, x1 = 704, yb = 205, hmax = 112, X = d => x0 + (220 - d) / 220 * (x1 - x0);
  const pts = courbeC(M), imax = Math.max(...M.carbones.map(intensite));
  const chemin = pts.map(([d, y], i) => `${i ? 'L' : 'M'}${X(d).toFixed(1)},${(yb - hmax * y).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={titre} style={{ display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {DOMAINES.map(z => <g key={z.nom}><rect x={X(z.a)} y={22} width={X(z.de) - X(z.a)} height={yb - 22} fill={z.teinte}/>
        <text x={(X(z.a) + X(z.de)) / 2} y={36} fontSize="11" textAnchor="middle" fill="#475569" fontWeight="700">{z.nom}</text></g>)}
      <line x1={x0} y1={yb} x2={x1} y2={yb} stroke="#334155" strokeWidth="1.5"/>
      {Array.from({ length: 12 }, (_, i) => i * 20).map(d => <g key={d}><line x1={X(d)} y1={yb} x2={X(d)} y2={yb + 5} stroke="#334155"/>
        <text x={X(d)} y={yb + 18} fontSize="11" textAnchor="middle" fill="#334155">{d}</text></g>)}
      <text x={(x0 + x1) / 2} y={H - 6} fontSize="12" textAnchor="middle" fill="#334155" fontWeight="700">δC (ppm)</text>
      <path d={chemin} fill="none" stroke="#0f172a" strokeWidth="1.4"/>
      {M.carbones.map((x, i) => { const on = sel === x.num, px = X(x.d), proche = i > 0 && px - X(M.carbones[i - 1].d) < 30 && M.carbones.slice(0, i).filter(y => px - X(y.d) < 30).length % 2 === 1, top = yb - hmax * intensite(x) / imax, col = coulC(M, x.num);
        return <g key={x.num} onClick={() => onSel(on ? null : x.num)} style={{ cursor: 'pointer' }}>
          <rect x={px - 10} y={44} width={20} height={yb - 44} fill={on ? `${col}22` : 'transparent'}/>
          {on && <line x1={px} y1={top} x2={px} y2={yb} stroke={col} strokeWidth="3"/>}
          <circle cx={px} cy={top - 12} r={on ? 10 : 8.5} fill={col} stroke={on ? '#0f172a' : 'none'} strokeWidth="1.5"/>
          {!cacher && <text x={px} y={top - 8} fontSize="11.5" fontWeight="800" textAnchor="middle" fill="#fff">{x.num}</text>}
          {!cacher && <text x={px} y={top - 26 - (proche ? 13 : 0)} fontSize="10.5" textAnchor="middle" fill="#334155">{nf(x.d, 1)}</text>}
        </g>; })}
    </svg>);
}

// ---------- carte HSQC ----------
function Hsqc({ M, sel, onSel, cacher, titre }) {
  const W = 470, H = 400, x0 = 58, x1 = 450, y0 = 18, y1 = 352;
  const hmax = Math.max(4, Math.ceil(Math.max(...M.hsqc.map(x => x.groupe.d)) + 0.6)), cmax = Math.max(60, Math.ceil((Math.max(...M.hsqc.map(x => x.d)) + 8) / 10) * 10);
  const X = d => x0 + (hmax - d) / hmax * (x1 - x0), Y = d => y0 + (cmax - d) / cmax * (y1 - y0);
  const pas = cmax > 120 ? 40 : 20;
  const selC = M.hsqc.find(x => x.num === sel);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={titre} style={{ display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}`, maxWidth: 520 }}>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#fafafa" stroke="#94a3b8"/>
      {Array.from({ length: hmax + 1 }, (_, i) => i).map(d => <g key={d}><line x1={X(d)} y1={y0} x2={X(d)} y2={y1} stroke="#e5e7eb"/><text x={X(d)} y={y1 + 15} fontSize="11" textAnchor="middle" fill="#334155">{d}</text></g>)}
      {Array.from({ length: Math.floor(cmax / pas) + 1 }, (_, i) => i * pas).map(d => <g key={d}><line x1={x0} y1={Y(d)} x2={x1} y2={Y(d)} stroke="#e5e7eb"/><text x={x0 - 6} y={Y(d) + 4} fontSize="11" textAnchor="end" fill="#334155">{d}</text></g>)}
      <text x={(x0 + x1) / 2} y={H - 18} fontSize="12" textAnchor="middle" fontWeight="700" fill="#334155">δH (ppm)</text>
      <text x={14} y={(y0 + y1) / 2} fontSize="12" textAnchor="middle" fontWeight="700" fill="#334155" transform={`rotate(-90 14 ${(y0 + y1) / 2})`}>δC (ppm)</text>
      {selC && <g stroke={coulC(M, selC.num)} strokeWidth="1.5" strokeDasharray="4 3"><line x1={X(selC.groupe.d)} y1={Y(selC.d)} x2={X(selC.groupe.d)} y2={y1}/><line x1={X(selC.groupe.d)} y1={Y(selC.d)} x2={x0} y2={Y(selC.d)}/></g>}
      {M.hsqc.map(x => { const on = sel === x.num, col = coulC(M, x.num);
        return <g key={x.num} onClick={() => onSel(on ? null : x.num)} style={{ cursor: 'pointer' }}>
          <circle cx={X(x.groupe.d)} cy={Y(x.d)} r={on ? 11 : 9} fill={col} stroke={on ? '#0f172a' : 'white'} strokeWidth="1.5"/>
          {!cacher && <text x={X(x.groupe.d)} y={Y(x.d) + 4} fontSize="11" fontWeight="800" textAnchor="middle" fill="#fff">{x.num}</text>}
        </g>; })}
    </svg>);
}

// ---------- carte COSY ----------
function Cosy({ M, sel, onSel, cacher, titre }) {
  const W = 420, H = 400, x0 = 46, x1 = 396, y0 = 16, y1 = 366;
  const hmax = Math.max(4, Math.ceil(Math.max(...M.groupes.map(x => x.d)) + 0.6));
  const P = d => x0 + (hmax - d) / hmax * (x1 - x0), Q = d => y0 + (hmax - d) / hmax * (y1 - y0);
  const gSel = sel ? M.groupes.find(g => M.carbones.find(c => c.num === sel)?.g === g.k) : null;
  const clic = g => { const c = M.carbones.find(x => x.g === g.k); if (c) onSel(sel === c.num ? null : c.num); };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={titre} style={{ display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}`, maxWidth: 480 }}>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#fafafa" stroke="#94a3b8"/>
      {Array.from({ length: hmax + 1 }, (_, i) => i).map(d => <g key={d}><line x1={P(d)} y1={y0} x2={P(d)} y2={y1} stroke="#e5e7eb"/><line x1={x0} y1={Q(d)} x2={x1} y2={Q(d)} stroke="#e5e7eb"/>
        <text x={P(d)} y={y1 + 15} fontSize="11" textAnchor="middle" fill="#334155">{d}</text><text x={x0 - 6} y={Q(d) + 4} fontSize="11" textAnchor="end" fill="#334155">{d}</text></g>)}
      <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#94a3b8" strokeDasharray="5 4"/>
      <text x={(x0 + x1) / 2} y={H - 4} fontSize="12" textAnchor="middle" fontWeight="700" fill="#334155">δH (ppm)</text>
      {gSel && <g stroke={coulG(M, gSel)} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8"><line x1={P(gSel.d)} y1={y0} x2={P(gSel.d)} y2={y1}/><line x1={x0} y1={Q(gSel.d)} x2={x1} y2={Q(gSel.d)}/></g>}
      {M.taches.map(([a, b]) => [[a, b], [b, a]].map(([u, v], i) => <rect key={a.k + b.k + i} x={P(u.d) - 7} y={Q(v.d) - 7} width="14" height="14" rx="3" fill="white" stroke="#0f172a" strokeWidth="2.2"/>))}
      {M.groupes.map(g => { const col = coulG(M, g), on = gSel && gSel.k === g.k, c = M.carbones.find(x => x.g === g.k);
        return <g key={g.k} onClick={() => clic(g)} style={{ cursor: 'pointer' }}><circle cx={P(g.d)} cy={Q(g.d)} r={on ? 10 : 8.5} fill={col} stroke={on ? '#0f172a' : 'white'} strokeWidth="1.5"/>
          {!cacher && c && <text x={P(g.d)} y={Q(g.d) + 4} fontSize="11" fontWeight="800" textAnchor="middle" fill="#fff">{g.lettre}</text>}</g>; })}
    </svg>);
}

// ---------- tableau d'analyse ----------
function TableCarbones({ M, sel, onSel }) {
  const cell = { padding: '4px 6px', textAlign: 'center', fontSize: 13 };
  const ent = ['Carbone', 'δC (ppm)', 'Type', 'Nombre de C', 'Domaine', 'H lié (signal ¹H, δH)'];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 600, background: 'white' }} data-testid="analyse13">
        <thead><tr>{ent.map((h, i) => <th key={h} style={{ ...cell, color: KIT.txt2, borderBottom: `1px solid ${KIT.bord}`, textAlign: i >= 4 ? 'left' : 'center' }}>{h}</th>)}</tr></thead>
        <tbody>{M.carbones.map(x => { const on = sel === x.num;
          return <tr key={x.num} onClick={() => onSel(on ? null : x.num)} style={{ cursor: 'pointer', background: on ? '#fef9c3' : 'white', borderBottom: `1px solid ${KIT.bord}` }}>
            <td style={cell}><span style={{ display: 'inline-block', background: coulC(M, x.num), color: '#fff', borderRadius: 9, minWidth: 18, fontWeight: 800, fontSize: 12 }}>{x.num}</span></td>
            <td style={{ ...cell, fontWeight: 700 }}>{nf(x.d, 1)}</td><td style={cell}>{typeC(x.nH)}</td><td style={cell}>{x.n}</td>
            <td style={{ ...cell, textAlign: 'left' }}><strong>{x.desc}</strong> : {domaine(x.d).long}</td>
            <td style={{ ...cell, textAlign: 'left' }}>{x.groupe ? <>signal <strong>{x.groupe.lettre}</strong>, δH = {nf(x.groupe.d)} ppm ({x.groupe.mult})</> : 'aucun (pas de tache HSQC)'}</td></tr>; })}
          <tr><td style={{ ...cell, fontWeight: 700, textAlign: 'right' }} colSpan={3}>Total</td><td style={{ ...cell, fontWeight: 800, color: VERT }}>{M.nCtot}</td><td colSpan={2}/></tr></tbody></table>
    </div>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'signaux') return { ...base, id: alea(IDS) };
  if (type === 'hsqc') { const M = alea(LISTE.filter(x => x.hsqc.length >= 3)); return { ...base, id: M.id, num: alea(M.hsqc).num }; }
  if (type === 'cosy') { const M = alea(LISTE.filter(x => x.groupes.length >= 3)); const cible = alea(M.groupes.filter(g => partenaires(M, g).length === 1)); return { ...base, id: M.id, g: cible.k }; }
  const M = alea(LISTE), autres = IDS.filter(x => x !== M.id).sort((a, b) => Math.abs(MOLS[a].nSignaux - M.nSignaux) - Math.abs(MOLS[b].nSignaux - M.nSignaux) + (Math.random() - 0.5) * 2).slice(0, 3);
  return { ...base, id: M.id, cands: [M.id, ...autres].sort(() => Math.random() - 0.5) };
}
const partenaires = (M, g) => M.taches.filter(([a, b]) => a.k === g.k || b.k === g.k).map(([a, b]) => (a.k === g.k ? b : a));
function evaluer(d) {
  const M = MOLS[d.id];
  if (d.type === 'signaux') {
    const okN = Number(String(d.reps.n || '').replace(',', '.')) === M.nSignaux, okP = Number(String(d.reps.p || '').replace(',', '.')) === M.sansH.length;
    return { ok: okN && okP, lignes: [
      [okN, okN ? 'Nombre de signaux ¹³C correct.' : 'Un signal par carbone non équivalent : cherchez les carbones équivalents par symétrie (ils donnent le même signal).'],
      [okP, okP ? 'Carbones sans H corrects.' : 'Ce sont les carbones qui ne portent aucun H : C=O d’ester ou de cétone, carbones aromatiques substitués. Ils ne donnent pas de tache HSQC.']] };
  }
  if (d.type === 'hsqc') { const c = M.carbones.find(x => x.num === d.num), ok = d.reps.c === c.g;
    return { ok, lignes: [[ok, ok ? 'Bonne lecture de la tache HSQC.' : 'Repérez la tache à la hauteur de ce δC (axe vertical) et descendez verticalement jusqu’à l’axe δH.']] }; }
  if (d.type === 'cosy') { const p = partenaires(M, M.groupes.find(g => g.k === d.g))[0], ok = d.reps.c === p.k;
    return { ok, lignes: [[ok, ok ? 'Bon partenaire de couplage.' : 'Placez-vous sur la diagonale au δ du signal, puis cherchez la tache hors diagonale sur la même ligne (ou la même colonne) : elle donne le signal couplé.']] }; }
  const ok = d.reps.c === d.id;
  return { ok, lignes: [[ok, ok ? 'Molécule identifiée.' : 'Utilisez d’abord la formule brute, puis le nombre de signaux ¹³C et le type des carbones (CH₃, CH₂, CH, C sans H).']] };
}
const tableauDonnees = M => (
  <div style={{ overflowX: 'auto', margin: '6px 0' }}><table style={{ borderCollapse: 'collapse', background: 'white', fontSize: 13.5 }}>
    <thead><tr>{['δC (ppm)', 'type de carbone', 'nombre de C'].map(h => <th key={h} style={{ padding: '2px 10px', textAlign: 'right', color: KIT.txt2 }}>{h}</th>)}</tr></thead>
    <tbody>{M.carbones.map(x => <tr key={x.num}><td style={{ padding: '2px 10px', textAlign: 'right' }}>{nf(x.d, 1)}</td><td style={{ padding: '2px 10px', textAlign: 'right' }}>{typeC(x.nH)}</td><td style={{ padding: '2px 10px', textAlign: 'right' }}>{x.n}</td></tr>)}</tbody></table></div>);
const enonce = (d, { champ, choix }) => {
  const M = MOLS[d.id], m = M.m;
  if (d.type === 'signaux') return <><Pic n="target"/>Prévoyez le spectre RMN ¹³C (découplé du proton) de <strong>{m.nom}</strong> ({m.brute}) : <strong style={{ whiteSpace: 'nowrap' }}>{plat(m)}</strong>.
    <div style={{ marginTop: 6 }}><strong>1.</strong> Nombre de signaux : {champ('n', '')}</div>
    <div style={{ marginTop: 6 }}><strong>2.</strong> Nombre de carbones qui ne portent aucun H (sans tache HSQC) : {champ('p', '')}</div></>;
  if (d.type === 'hsqc') { const c = M.carbones.find(x => x.num === d.num);
    return <><Pic n="target"/>Carte HSQC d’un composé de formule brute <strong>{m.brute}</strong> (ci-dessous). Quel est le signal ¹H lié au carbone qui résonne à <strong>δC = {nf(c.d, 1)} ppm</strong> ?
      <div style={{ marginTop: 6 }}>{choix('c', M.groupes.map(g => [g.k, `δH = ${nf(g.d)} ppm`]))}</div></>; }
  if (d.type === 'cosy') { const g = M.groupes.find(x => x.k === d.g);
    return <><Pic n="target"/>Carte COSY d’un composé de formule brute <strong>{m.brute}</strong> (ci-dessous). Le signal à <strong>δH = {nf(g.d)} ppm</strong> est couplé à un seul autre signal. Lequel ?
      <div style={{ marginTop: 6 }}>{choix('c', M.groupes.filter(x => x.k !== g.k).map(x => [x.k, `δH = ${nf(x.d)} ppm`]))}</div></>; }
  return <><Pic n="target"/>Un composé de formule brute <strong>{m.brute}</strong> donne ce spectre ¹³C (découplé du proton) ; les types de carbone viennent de la carte HSQC. Quelle est cette molécule ?
    {tableauDonnees(M)}{choix('c', d.cands.map(c => [c, `${MOLS[c].m.nom} : ${plat(MOLS[c].m)}`]))}</>;
};
const solution = d => {
  const M = MOLS[d.id], m = M.m;
  if (d.type === 'signaux') return <>Carbones équivalents par symétrie regroupés : <strong>{M.nSignaux} signaux</strong> ({M.carbones.map(x => `${x.desc}${x.n > 1 ? '' : ''}`).join(' ; ')}). Carbones sans H : <strong>{M.sansH.length}</strong>{M.sansH.length ? ` (${M.sansH.map(x => x.desc).join(' ; ')})` : ''}.</>;
  if (d.type === 'hsqc') { const c = M.carbones.find(x => x.num === d.num);
    return <>Le carbone à {nf(c.d, 1)} ppm ({c.desc}) porte les H du signal <strong>δH = {nf(c.groupe.d)} ppm</strong> : la tache HSQC est à ({nf(c.groupe.d)} ; {nf(c.d, 1)}).</>; }
  if (d.type === 'cosy') { const g = M.groupes.find(x => x.k === d.g), p = partenaires(M, g)[0];
    return <>La tache hors diagonale est à ({nf(g.d)} ; <strong>{nf(p.d)}</strong>) : les H de {g.desc} sont couplés à ceux de {p.desc} (carbones voisins).</>; }
  return <>C’est le <strong>{m.nom}</strong> ({plat(m)}) : {M.nSignaux} signaux ¹³C, dont {M.sansH.length} carbone(s) sans H ; {M.carbones.map(x => `${nf(x.d, 1)} ppm (${typeC(x.nH)})`).join(', ')}.</>;
};

// ====================================================
export function SimulationRMNC2D() {
  const [mode, setMode] = useState(() => modeOuverture('rmnc-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('rmnc-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [molId, setMolId] = useState('bromobutane');
  const [vue, setVue] = useState('c13');
  const [sel, setSel] = useState(null);
  const [corrige, setCorrige] = useState(true);
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const M = enDefi ? MOLS[defi.id] : MOLS[molId];
  const cSel = sel ? M.carbones.find(x => x.num === sel) : null;
  const vueEff = enDefi ? (defi.type === 'hsqc' ? 'hsqc' : defi.type === 'cosy' ? 'cosy' : 'c13') : vue;

  const voir = o => { if (o.mol) setMolId(o.mol); setVue(o.vue ?? 'c13'); setSel(o.sel ?? null); setCorrige(!!o.corrige); };
  const ETAPES = [
    { id: 'principe', titre: 'Le carbone 13 : un spectre simple', depart: () => voir({ mol: 'ethoxyethane', corrige: false }),
      texte: <>Seul l’isotope ¹³C (1,1 % des carbones) est actif en RMN. Dans le spectre ¹³C <strong>découplé du proton</strong> (le mode usuel), chaque carbone ou groupe de carbones équivalents donne <strong>un seul signal : un singulet</strong>, sans multiplicité. Le déplacement chimique δC s’étend de 0 à 220 ppm (bien plus que pour ¹H).
        <ExempleResolu>Éthoxyéthane CH₃–CH₂–O–CH₂–CH₃ : les deux CH₃ sont équivalents (symétrie), les deux CH₂ aussi. Deux types de carbone, donc <strong>deux signaux</strong>.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Combien de signaux dans le spectre ¹³C de l’éthoxyéthane ?', options: ['1', '2', '3', '4'], bonne: 1, expl: 'Quatre carbones, mais équivalents deux à deux par symétrie : 2 signaux.' } },
    { id: 'intensites', titre: 'Les hauteurs des signaux ne se comptent pas', depart: () => voir({ mol: 'acetateethyle', corrige: false }),
      texte: <>En ¹³C, <strong>on n’intègre pas</strong> : la hauteur d’un signal n’est pas proportionnelle au nombre de carbones. Les carbones qui portent des H sont renforcés (effet NOE du découplage) ; les carbones <strong>sans H</strong> (C=O, carbones aromatiques substitués) donnent des signaux bien plus petits. Regardez le C=O de l’éthanoate d’éthyle (n° 1).</>,
      tache: { type: 'qcm', q: 'Pourquoi le signal du C=O est-il bien plus petit que les autres ?', options: ['il ne porte pas de H : pas de renforcement par effet NOE, relaxation lente', 'il y a un seul C=O dans la molécule', 'son δC est trop élevé', 'le carbone C=O ne résonne pas'], bonne: 0, expl: 'Même avec un seul carbone de chaque sorte, les signaux sans H sont plus faibles. Le nombre de carbones ne se lit donc pas sur la hauteur.' } },
    { id: 'domaines', titre: 'Les domaines de déplacement chimique', depart: () => voir({ mol: 'propanal', corrige: false }),
      texte: <>Le spectre est découpé en quatre domaines (bandes colorées) : <strong>160–220</strong> : C=O ; <strong>100–160</strong> : C=C et aromatiques ; <strong>50–100</strong> : C sp³ lié à O ou N ; <strong>0–50</strong> : C sp³ alkyle (ou halogéné). Plus un carbone est lié à des atomes électronégatifs ou appauvri en électrons, plus δC est grand.</>,
      tache: { type: 'action', ok: enGuide && molId === 'propanal' && sel === 1, consigne: 'Cliquez sur le signal le plus déblindé du propanal (carbone n° 1) et lisez son domaine dans le tableau.' } },
    { id: 'domaines2', titre: 'Attribuer un signal avec les domaines', depart: () => voir({ mol: 'acetateethyle', corrige: true }),
      texte: <>Sur le spectre de l’éthanoate d’éthyle, les quatre carbones tombent dans trois domaines différents. Repérez celui de δC = 60,4 ppm.</>,
      tache: { type: 'qcm', q: 'Le signal à δC = 60,4 ppm correspond :', options: ['au carbone sp³ lié à O (OCH₂)', 'au carbone du C=O', 'au CH₃ lié au C=O', 'à un carbone aromatique'], bonne: 0, expl: 'Entre 50 et 90 ppm, un carbone sp³ lié à l’oxygène : le OCH₂ de l’éthyle.' } },
    { id: 'compter', titre: 'Compter les signaux ¹³C', depart: () => voir({ mol: 'benzoateethyle', corrige: false }),
      texte: <>Le benzoate d’éthyle C₆H₅–CO–O–CH₂–CH₃ : le cycle est symétrique par rapport à l’axe C(ipso)–C(para). Les deux carbones ortho sont équivalents, les deux carbones meta aussi. Combien de signaux en tout ? Comptez : C=O, C ipso, C ortho, C meta, C para, OCH₂, CH₃.</>,
      tache: { type: 'num', q: 'Nombre de signaux ¹³C du benzoate d’éthyle', unite: '', vrai: 7, tol: 0.01, affiche: x => fr(x, 0),
        calcul: () => ['Principe : un signal ¹³C (découplé) par groupe de carbones équivalents. Hypothèse : le cycle est symétrique par rapport à l’axe C(ipso)–C(para) et tourne librement, donc les deux ortho sont équivalents, de même que les deux meta.',
          'Les 9 carbones : C=O (1) + cycle (6 : ipso, 2 ortho, 2 meta, para) + OCH₂ (1) + CH₃ (1).',
          'Les 2 ortho donnent 1 signal, les 2 meta donnent 1 signal : 9 − 1 − 1 = 7.',
          'Les 7 signaux : C=O, ipso, ortho, meta, para, OCH₂, CH₃.'],
        pieges: [[9, 'Neuf carbones, mais les deux ortho sont équivalents et les deux meta aussi : un seul signal pour chaque paire.']], expl: '9 carbones − 1 (ortho) − 1 (meta) = 7 signaux.' } },
    { id: 'sansh', titre: 'Les carbones sans hydrogène', depart: () => voir({ mol: 'nitrobenzoate', corrige: true }),
      texte: <>Un carbone sans H ne peut pas donner de tache HSQC. Dans le 4-nitrobenzoate d’éthyle, repérez dans le tableau les carbones de type « C (sans H) » : ce sont les plus déblindés du spectre.</>,
      tache: { type: 'num', q: 'Combien de carbones ne portent aucun H (sans tache HSQC) ?', unite: '', vrai: 3, tol: 0.01, affiche: x => fr(x, 0),
        calcul: () => ['On parcourt les carbones de O₂N–C₆H₄–CO–O–CH₂–CH₃ et on garde ceux qui n’ont aucun H.',
          'Avec H : les 4 CH du cycle (2 + 2 équivalents), OCH₂, CH₃. Sans H : C=O, C du cycle lié à NO₂, C du cycle lié au C=O.',
          'Carbones sans H : 1 + 1 + 1 = 3.'],
        pieges: [[2, 'Il y en a un de plus : cherchez les carbones du cycle qui portent un substituant (et non un H) en plus du carbone du carbonyle.']], expl: 'C=O, C–NO₂ et C aromatique lié au C=O : trois carbones sans H.' } },
    { id: 'hsqc', titre: 'HSQC : relier chaque carbone à ses H', depart: () => voir({ mol: 'bromobutane', vue: 'hsqc', corrige: false }),
      texte: <>La carte <strong>HSQC</strong> a l’axe δH en abscisse et l’axe δC en ordonnée. Une <strong>tache</strong> en (δH ; δC) indique que le carbone de déplacement δC <strong>porte directement</strong> les H de déplacement δH. Les carbones sans H n’ont pas de tache. Cliquez sur une tache pour la relier à son carbone.</>,
      tache: { type: 'qcm', q: 'Dans le 1-bromobutane, la tache à (3,41 ; 33,5) signifie :', options: ['les H à 3,41 ppm sont portés par le carbone à 33,5 ppm', 'les H à 3,41 ppm sont voisins du carbone à 33,5 ppm', 'ces deux signaux ont la même intégration', 'ce sont deux carbones voisins'], bonne: 0, expl: 'HSQC : couplage ¹J, liaison directe C–H. C’est le CH₂Br.' } },
    { id: 'hsqc2', titre: 'HSQC : lever une ambiguïté', depart: () => voir({ mol: 'butanoateethyle', vue: 'hsqc', corrige: false }),
      texte: <>Le butanoate d’éthyle a deux CH₃ aux δC voisins (13,7 et 14,2 ppm) : impossible de les distinguer en ¹³C seul. La HSQC les sépare grâce à leurs H : l’un à δH = 0,95 ppm, l’autre à 1,26 ppm.</>,
      tache: { type: 'qcm', q: 'Quel carbone porte les H du CH₃ à δH = 0,95 ppm ?', options: ['δC = 13,7 ppm', 'δC = 14,2 ppm', 'δC = 18,5 ppm', 'δC = 60,2 ppm'], bonne: 0, expl: 'La tache à (0,95 ; 13,7) : c’est le CH₃ du groupe butanoyle.' } },
    { id: 'cosy', titre: 'COSY : quels H sont voisins ?', depart: () => voir({ mol: 'bromobutane', vue: 'cosy', corrige: false }),
      texte: <>La carte <strong>COSY</strong> a le même axe δH en abscisse et en ordonnée. Les taches de la <strong>diagonale</strong> reproduisent le spectre ¹H. Une tache <strong>hors diagonale</strong> en (δ₁ ; δ₂) montre que les H des signaux à δ₁ et δ₂ sont <strong>couplés</strong> (³J : carbones voisins). La carte est symétrique par rapport à la diagonale.</>,
      tache: { type: 'qcm', q: 'Une tache hors diagonale en (δ₁ ; δ₂) indique que :', options: ['les H de ces deux signaux sont couplés (carbones voisins)', 'ces deux signaux ont le même δ', 'ces H sont portés par le même carbone', 'ces deux signaux ont la même intégration'], bonne: 0, expl: 'COSY : corrélation entre H qui se couplent à trois liaisons (H–C–C–H).' } },
    { id: 'cosy2', titre: 'COSY : parcourir la chaîne', depart: () => voir({ mol: 'bromobutane', vue: 'cosy', corrige: false }),
      texte: <>Dans le 1-bromobutane CH₃–CH₂–CH₂–CH₂Br, chaque CH₂ ou CH₃ est couplé à son ou ses voisins. Comptez les <strong>couples</strong> de signaux couplés (chaque couple une seule fois, la carte étant symétrique).</>,
      tache: { type: 'num', q: 'Combien de couples de signaux couplés dans le 1-bromobutane ?', unite: '', vrai: 3, tol: 0.01, affiche: x => fr(x, 0),
        calcul: () => ['Principe : deux signaux sont couplés (³J) si leurs H sont portés par des carbones voisins. Hypothèse : on ne compte que les couplages H–C–C–H (pas de couplage à longue distance).',
          'Chaîne CH₃–CH₂–CH₂–CH₂Br : couples CH₃/CH₂, CH₂/CH₂ (central) et CH₂/CH₂Br.',
          'Chaque couple est compté une seule fois (la carte est symétrique) : 3 couples.'],
        pieges: [[6, 'Chaque couple apparaît deux fois (symétrie) : comptez-le une seule fois.']], expl: 'CH₃–CH₂, CH₂–CH₂ et CH₂–CH₂Br : 3 couples.' } },
    { id: 'cosy3', titre: 'COSY : distinguer deux triplets', depart: () => voir({ mol: 'butanoateethyle', vue: 'cosy', corrige: false }),
      texte: <>Dans le butanoate d’éthyle, deux CH₃ sont des triplets (0,95 et 1,26 ppm) : lequel appartient à l’éthyle ? Suivez la COSY depuis l’OCH₂ (δH = 4,12 ppm) : il n’est couplé qu’à un seul CH₃.</>,
      tache: { type: 'qcm', q: 'Quel CH₃ est celui du groupe éthyle ?', options: ['celui à 1,26 ppm (corrélé avec l’OCH₂ à 4,12)', 'celui à 0,95 ppm', 'celui qui a le plus grand δC', 'le plus intense'], bonne: 0, expl: 'La tache (4,12 ; 1,26) relie l’OCH₂ à son CH₃. Le CH₃ à 0,95 est couplé au CH₂ central (1,65).' } },
    { id: 'methode', titre: 'La démarche complète', depart: () => voir({ mol: 'acetateethyle', vue: 'c13', corrige: true }),
      texte: <>Pour retrouver une structure : <strong>1.</strong> formule brute et nombre de signaux ¹³C ; <strong>2.</strong> domaines de δC et type de chaque carbone ; <strong>3.</strong> HSQC pour associer chaque carbone à ses H ; <strong>4.</strong> COSY pour enchaîner les groupes voisins ; <strong>5.</strong> vérifier avec le spectre ¹H (intégration, multiplicité).</>,
      tache: { type: 'qcm', q: 'Quelle carte donne le lien entre un carbone et les H qu’il porte ?', options: ['HSQC', 'COSY', 'le spectre ¹³C seul', 'l’intégration ¹H'], bonne: 0, expl: 'HSQC : C–H directs. COSY : H–H voisins.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>¹³C découplé : <strong>un singulet par carbone non équivalent</strong>, δC de 0 à 220 ppm, pas d’intégration.</li>
        <li>Carbones sans H : signaux plus petits, pas de tache HSQC.</li>
        <li><strong>HSQC</strong> : tache (δH ; δC) = carbone et H directement liés.</li>
        <li><strong>COSY</strong> : tache hors diagonale = H couplés (carbones voisins).</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { setDefi(nouveauDefi(type)); setSel(null); }
  function changerMode(md) { setMode(md); setSel(null); if (md === 'defi') lancer(defi ? defi.type : 'signaux'); else if (md === 'explore') setCorrige(true); }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Bibliothèque de 10 molécules décrites à la main</strong> : les mêmes qu’en RMN ¹H (sim 75). Les δC et δH sont des valeurs usuelles en solution dans CDCl₃, à ± 1 à 2 ppm près pour ¹³C et ± 0,1 à 0,2 ppm pour ¹H.</li>
      <li><strong>¹³C découplé du proton</strong> : un singulet par carbone non équivalent. Les couplages C–H et C–C sont ignorés (¹³C très rare : couplage C–C négligeable).</li>
      <li><strong>Hauteurs des signaux ¹³C non quantitatives</strong> : proportionnelles au nombre de C équivalents, mais fortement réduites (facteur 0,3 ici, arbitraire) pour les carbones sans H. Il n’y a pas d’intégration en ¹³C.</li>
      <li><strong>COSY</strong> : seules les corrélations ³J (H–C–C–H) sont représentées, une par couple de groupes couplés (la carte est symétrique). Les couplages à longue distance sont ignorés, sauf le couplage faible CH₂–CHO du propanal.</li>
      <li><strong>HSQC</strong> : seules les liaisons directes C–H sont visibles. Les H labiles (OH, NH, COOH) ne sont portés par aucun carbone et sont absents des deux cartes. Les carbones sans H n’ont pas de tache.</li>
      <li><strong>Hors programme ici</strong> : DEPT, HMBC, NOESY, diastéréotopie. Spectres idéaux, sans bruit ni artefacts.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;

  const barre = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
      {!enDefi && <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Molécule :{' '}
        <select value={molId} onChange={e => { setMolId(e.target.value); setSel(null); }} aria-label="Molécule" style={{ fontSize: 14, padding: '3px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, maxWidth: 280 }}>
          {LISTE.map(x => <option key={x.id} value={x.id}>{x.m.nom} ({x.m.brute})</option>)}</select></label>}
      {enDefi && <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Composé étudié : formule brute {M.m.brute}</span>}
      {!enDefi && VUES.map(([k, l]) => <button key={k} onClick={() => setVue(k)} style={stylePetitBouton(vue === k, '#0f766e')}>{l}</button>)}
    </div>);
  const titreFig = vueEff === 'c13' ? `Spectre RMN ¹³C de ${enDefi ? 'du composé inconnu' : M.m.nom}` : vueEff === 'hsqc' ? `Carte HSQC ${enDefi ? 'du composé inconnu' : 'de ' + M.m.nom}` : `Carte COSY ${enDefi ? 'du composé inconnu' : 'de ' + M.m.nom}`;
  const figure = vueEff === 'c13' ? <Spectre13 M={M} sel={sel} onSel={setSel} cacher={enDefi} titre={titreFig}/>
    : vueEff === 'hsqc' ? <Hsqc M={M} sel={sel} onSel={setSel} cacher={enDefi} titre={titreFig}/> : <Cosy M={M} sel={sel} onSel={setSel} cacher={enDefi} titre={titreFig}/>;
  const legende = vueEff === 'c13' ? 'Les hauteurs ne sont pas proportionnelles au nombre de C. Cliquez sur un signal pour le relier au tableau.'
    : vueEff === 'hsqc' ? 'Chaque tache relie un carbone (axe vertical) aux H qu’il porte (axe horizontal).'
    : 'Diagonale : le spectre ¹H. Carrés vides hors diagonale : H couplés (symétrie par rapport à la diagonale).';

  const planche = (
    <div style={styleBoite}>
      {barre}
      {!enDefi && <div style={{ fontSize: 17, color: KIT.txt, margin: '2px 0 8px', fontWeight: 600 }}>{plat(M.m)}</div>}
      {figure}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{legende}</div>
      {!enDefi && cSel && <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.65, marginTop: 8 }}>
        <strong>Carbone {cSel.num} ({cSel.desc})</strong> : δC = {nf(cSel.d, 1)} ppm, {domaine(cSel.d).long}. Type : <strong>{typeC(cSel.nH)}</strong>{cSel.n > 1 ? `, ${cSel.n} carbones équivalents` : ''}.
        {cSel.groupe ? <> Il porte les H du signal <strong>{cSel.groupe.lettre}</strong> (δH = {nf(cSel.groupe.d)} ppm, {cSel.groupe.mult}) : tache HSQC en ({nf(cSel.groupe.d)} ; {nf(cSel.d, 1)}).
          {M.taches.filter(([a, b]) => a.k === cSel.g || b.k === cSel.g).length ? <> En COSY, ces H sont couplés aux signaux {M.taches.filter(([a, b]) => a.k === cSel.g || b.k === cSel.g).map(([a, b]) => (a.k === cSel.g ? b : a).lettre).join(', ')}.</> : <> Aucun voisin porteur de H : pas de tache hors diagonale.</>}</>
          : <> Aucun H : pas de tache HSQC, pas de signal COSY.</>}</div>}
      {!enDefi && !cSel && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8 }}>Sélectionnez un carbone (signal, tache ou ligne du tableau) pour le suivre d’une carte à l’autre.</div>}
      {!enDefi && <div style={{ marginTop: 10 }}>
        {!corrige && <button onClick={() => setCorrige(true)} style={styleBouton(true, '#0ea5e9')}><Pic n="eye"/>Afficher le tableau d’analyse</button>}
        {corrige && <><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Tableau d’analyse</div><TableCarbones M={M} sel={sel} onSel={setSel}/></>}
      </div>}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Éthoxyéthane : 10 H mais seulement 2 signaux ¹³C. Pourquoi ?</li>
        <li>4-nitrobenzoate d’éthyle : quels carbones n’ont pas de tache HSQC ? Où sont-ils sur le spectre ¹³C ?</li>
        <li>Butanoate d’éthyle : comment la HSQC et la COSY permettent-elles de distinguer les deux CH₃ ?</li>
        <li>Éthanoate d’éthyle et propanoate de méthyle (C₄H₈O₂) : comparez les spectres ¹³C et les cartes COSY.</li>
        <li>Propanal : pourquoi le carbone du CHO est-il vers 203 ppm ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>¹³C découplé : un singulet par C non équivalent</li><li>pas d’intégration en ¹³C</li><li>HSQC : C ↔ H lié</li><li>COSY : H ↔ H voisin</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);
  const planDefi = (
    <div style={styleBoite}>
      {figure}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{legende}</div></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rmc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rmc-l1.cote { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); }
        .rmc-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .rmc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>RMN ¹³C et RMN 2D : COSY et HSQC</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Le spectre <strong>¹³C</strong> compte les carbones non équivalents ; la carte <strong>HSQC</strong> relie chaque carbone aux H qu’il porte ; la carte <strong>COSY</strong> relie les H voisins. Combinez-les pour retrouver la structure d’une molécule.</div>
      <div className={`rmc-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution}/></div>}
          {enDefi ? (defi.type === 'signaux' ? null : planDefi) : planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="rmc-l2">{panneauHypo}</div>}
      {enExplore && <div className="rmc-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
