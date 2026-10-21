import { useState, useEffect, useMemo } from "react";
import { useSignalerMode, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireNombre, proche } from "../commun";
import { LAMBDA, DT_MIN, DT_MAX, STRUCTURES, ECHANTILLONS, ORDRE_EXPLO, CANDIDATS_DEFI, pics, courbe, indexer,
  masseVolumique, sequence, Npermis } from "./drxModele";
import { fr } from "./elecModele";
import { BLEU, VERMILLON, VIOLET, GRIS, VERT, alea } from "./elecOutils";
import { Curseur, VoletDefiGen } from "./elecCommun";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 73 — DIFFRACTION DES RAYONS X : IDENTIFIER UNE STRUCTURE CUBIQUE (BTS Métiers de la chimie, analyse cristallographique)
//  D'après le cours C8 et les mémos DRX du stage cristallographie : loi de Bragg, indices de Miller, extinctions,
//  méthode des rapports sin²θ / sin²θ₁, paramètre de maille, contrôle par la masse volumique.
//  Hypothèses : système cubique, ordre 1 (les ordres supérieurs sont portés par hkl), λ = 0,1542 nm (Cu Kα), poudre sans
//  orientation privilégiée ; intensités calculées par un modèle simplifié, seules les positions des pics sont exploitées.
// ====================================================

const SIM = 73;
declarerDefis(SIM, [
  ['inconnu', 'Identifier un échantillon inconnu'],
  ['bragg', 'Paramètre de maille par la loi de Bragg'],
  ['masse', 'Masse volumique à partir de la maille'],
]);
const TITRES = { inconnu: 'Échantillon inconnu', bragg: 'Loi de Bragg', masse: 'Masse volumique' };
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const PICS = Object.fromEntries(Object.keys(ECHANTILLONS).map(k => [k, pics(k)]));
const r2 = v => Math.round(v * 100) / 100;
// Une formule reste toujours sur UNE ligne (défilement horizontal si l'écran est trop étroit, jamais de retour à la ligne)
const Formule = ({ children }) => <div style={{ textAlign: 'center', fontSize: 14.5, margin: '5px 0', whiteSpace: 'nowrap', overflowX: 'auto', maxWidth: '100%' }}><strong>{children}</strong></div>;
const F = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;           // lecture des angles au centième de degré

// ---------- diffractogramme cliquable ----------
function Diffractogramme({ liste, pts, releves, onClic, titre }) {
  const W = 680, H = 300, L = 48, R = 12, T = 14, B = 40, pw = W - L - R, ph = H - T - B;
  const X = x => L + (x - DT_MIN) / (DT_MAX - DT_MIN) * pw, Y = y => T + ph - Math.min(y, 112) / 112 * ph;
  const clic = e => {
    const r = e.currentTarget.getBoundingClientRect(), x = DT_MIN + ((e.clientX - r.left) / r.width * W - L) / pw * (DT_MAX - DT_MIN);
    const p = liste.reduce((b, q) => (Math.abs(q.dt - x) < Math.abs(b.dt - x) ? q : b), liste[0]);
    if (p && Math.abs(p.dt - x) < 1.6) onClic(r2(p.dt));
  };
  const ticks = []; for (let v = DT_MIN; v <= DT_MAX; v += 10) ticks.push(v);
  const rel = [...releves].sort((a, b) => a - b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={titre || 'Diffractogramme : intensité en fonction de 2θ'} onClick={clic}
      style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, cursor: 'crosshair', maxWidth: W }}>
      {ticks.map(v => <g key={v}><line x1={X(v)} y1={T} x2={X(v)} y2={T + ph} stroke="#eef2f7"/><text x={X(v)} y={T + ph + 15} fontSize="11.5" textAnchor="middle" fill={GRIS}>{v}</text></g>)}
      <line x1={L} y1={T + ph} x2={L + pw} y2={T + ph} stroke="#0f172a" strokeWidth="1.6"/><line x1={L} y1={T} x2={L} y2={T + ph} stroke="#0f172a" strokeWidth="1.6"/>
      <text x={L + pw / 2} y={H - 6} fontSize="13" fontWeight="700" textAnchor="middle" fill="#0f172a">2θ (degrés)</text>
      <text transform={`translate(15 ${T + ph / 2}) rotate(-90)`} fontSize="13" fontWeight="700" textAnchor="middle" fill="#0f172a">intensité (u.a.)</text>
      <polyline fill="none" stroke={BLEU} strokeWidth="1.4" points={pts.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ')}/>
      {rel.map((dt, i) => { const p = liste.find(q => r2(q.dt) === dt), y = p ? Y(p.I + 2) - 6 : T + 20; return (
        <g key={dt}><path d={`M${X(dt)},${y} l-6,-10 h12 z`} fill={VERMILLON}/>
          <text x={X(dt)} y={y - 13} fontSize="12" fontWeight="800" textAnchor="middle" fill={VERMILLON}>{i + 1}</text></g>); })}
    </svg>);
}

// ---------- loi de Bragg : géométrie et interférences ----------
function SchemaBragg({ th, d }) {
  const W = 560, H = 230, D = d * 300, y0 = 70, xc = 280, t = rad(th), Lr = Math.min(250, (y0 - 30) / Math.sin(t));
  const u = [Math.cos(t), Math.sin(t)], v = [Math.cos(t), -Math.sin(t)];
  const A = [xc, y0], Bp = [xc, y0 + D];
  const rayon = (P, c, dash) => <g><line x1={P[0] - Lr * u[0]} y1={P[1] - Lr * u[1]} x2={P[0]} y2={P[1]} stroke={c} strokeWidth="2.5" strokeDasharray={dash}/>
    <line x1={P[0]} y1={P[1]} x2={P[0] + Lr * v[0]} y2={P[1] + Lr * v[1]} stroke={c} strokeWidth="2.5" strokeDasharray={dash}/></g>;
  const s = D * Math.sin(t), fin = [Bp[0] - s * u[0], Bp[1] - s * u[1]], fout = [Bp[0] + s * v[0], Bp[1] + s * v[1]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Loi de Bragg : deux rayons réfléchis par deux plans atomiques voisins" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: W }}>
      {[0, 1, 2].map(k => <g key={k}>{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={30 + i * 46 + (k % 2) * 0} cy={y0 + k * D} r="6" fill="#94a3b8"/>)}
        <text x={W - 8} y={y0 + k * D + 4} fontSize="11" textAnchor="end" fill={GRIS}>plan {k + 1}</text></g>)}
      {rayon(A, BLEU)}{rayon(Bp, VIOLET, '7 4')}
      <line x1={A[0]} y1={A[1]} x2={fin[0]} y2={fin[1]} stroke="#64748b" strokeDasharray="3 3"/><line x1={A[0]} y1={A[1]} x2={fout[0]} y2={fout[1]} stroke="#64748b" strokeDasharray="3 3"/>
      <line x1={fin[0]} y1={fin[1]} x2={Bp[0]} y2={Bp[1]} stroke="#ea580c" strokeWidth="6" strokeLinecap="round" opacity="0.85"/>
      <line x1={Bp[0]} y1={Bp[1]} x2={fout[0]} y2={fout[1]} stroke="#ea580c" strokeWidth="6" strokeLinecap="round" opacity="0.85"/>
      <line x1={xc + 70} y1={y0} x2={xc + 70} y2={y0 + D} stroke="#0f172a" strokeWidth="1.5" markerEnd="url(#fl)" markerStart="url(#fl)"/>
      <defs><marker id="fl" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="#0f172a"/></marker></defs>
      <text x={xc + 76} y={y0 + D / 2 + 4} fontSize="13" fontWeight="800">d</text>
      <text x={12} y={18} fontSize="13" fontWeight="700" fill={BLEU}>↘ rayons X incidents</text>
      <text x={W - 12} y={18} fontSize="13" fontWeight="700" fill={BLEU} textAnchor="end">rayons diffractés ↗</text>
      <text x={xc - 30} y={y0 - 8} fontSize="13" fontWeight="800" fill="#0f172a" textAnchor="end">θ = {String(Math.round(th * 10) / 10).replace('.', ',')}°</text>
      <text x={14} y={H - 10} fontSize="12.5" fontWeight="700" fill="#c2410c">▬ chemin en plus pour le rayon du plan 2 : δ = 2 d sin θ</text>
    </svg>);
}
function Ondes({ dl }) {
  const W = 560, H = 150, Lw = 80, A = 22, y1 = 44, y2 = 112;
  const onde = (ph, a) => Array.from({ length: 141 }, (_, i) => { const x = 20 + i * 3.7; return `${x},${y1 + 0 - a * Math.sin(2 * Math.PI * (x / Lw) - ph)}`; }).join(' ');
  const somme = Array.from({ length: 141 }, (_, i) => { const x = 20 + i * 3.7; return `${x},${y2 - (A / 2) * (Math.sin(2 * Math.PI * x / Lw) + Math.sin(2 * Math.PI * x / Lw - 2 * Math.PI * dl))}`; }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Les deux ondes diffractées et leur somme" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: W, marginTop: 6 }}>
      <polyline fill="none" stroke={BLEU} strokeWidth="2.2" points={onde(0, A * 0.9)}/>
      <polyline fill="none" stroke={VIOLET} strokeWidth="2.2" strokeDasharray="7 4" points={onde(2 * Math.PI * dl, A * 0.9)}/>
      <polyline fill="none" stroke="#0f172a" strokeWidth="2.8" points={somme}/>
      <text x={20} y={14} fontSize="11.5" fill={GRIS}>ondes diffractées par le plan 1 (trait plein) et le plan 2 (pointillés)</text>
      <text x={20} y={80} fontSize="11.5" fill={GRIS}>somme reçue par le détecteur</text>
    </svg>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'inconnu') { const cle = alea(CANDIDATS_DEFI); return { ...base, cle }; }
  if (type === 'bragg') {
    const cle = alea(['W', 'Mo', 'Cr', 'Fe', 'Cu', 'Al', 'Ni', 'Ag']), e = ECHANTILLONS[cle], p = alea(PICS[cle].slice(0, 4));
    const dt = r2(p.dt), th = rad(dt / 2), d = LAMBDA / (2 * Math.sin(th)), N = p.N;
    return { ...base, cle, dt, hkl: p.hkl.split(' ')[0], N, d, a: d * Math.sqrt(N), struct: e.type };
  }
  const cle = alea(['W', 'Mo', 'Cr', 'Fe', 'Cu', 'Al', 'Ni', 'Ag', 'NaCl']), e = ECHANTILLONS[cle];
  return { ...base, cle, rho: masseVolumique(STRUCTURES[e.type].n, e.M, e.a) };
}
function evaluer(d) {
  if (d.type === 'inconnu') {
    const e = ECHANTILLONS[d.cle], a = lireNombre(d.reps.a);
    const okS = d.reps.s === e.type, okA = isFinite(a) && proche(a, e.a, 0.005), okI = d.reps.id === d.cle;
    return { ok: okS && okA && okI, lignes: [
      [okS, okS ? 'Structure correcte.' : 'Structure : essayez les trois modèles dans le tableau et gardez celui pour lequel a est le même pour tous les pics.'],
      [okA, okA ? 'Paramètre de maille correct (à 0,5 % près).' : 'Paramètre a : prenez la moyenne des valeurs de a du tableau, avec le bon modèle (en nm).'],
      [okI, okI ? 'Échantillon identifié.' : 'Identification : comparez votre structure et votre valeur de a aux données des tables.']] };
  }
  const x = lireNombre(d.reps.v);
  if (d.type === 'bragg') { const ok = isFinite(x) && proche(x, d.a, 0.01); return { ok, lignes: [[ok, ok ? 'Paramètre de maille correct.' : proche(x, d.d, 0.02) ? 'Vous avez trouvé d : il reste à multiplier par √(h² + k² + l²).' : 'Calculez θ = 2θ / 2, puis d = λ / (2 sin θ), puis a = d × √(h² + k² + l²).']] }; }
  const e = ECHANTILLONS[d.cle], ok = isFinite(x) && proche(x, d.rho, 0.02);
  return { ok, lignes: [[ok, ok ? 'Masse volumique correcte.' : proche(x, d.rho / STRUCTURES[e.type].n, 0.03) ? `Combien de motifs ${e.formule} une maille ${STRUCTURES[e.type].nomF} contient-elle ?` : 'ρ = n × M / (N_A × a³), avec a converti en cm (1 nm = 10⁻⁷ cm).']] };
}
const TABLE_REF = (
  <div style={{ overflowX: 'auto', marginTop: 6 }}><table style={{ borderCollapse: 'collapse', fontSize: 12.5, background: 'white' }}>
    <thead><tr>{['Cristal', 'Structure', 'a (nm)', 'ρ (g/cm³)'].map(h => <th key={h} style={{ padding: '3px 8px', borderBottom: `1px solid ${KIT.bord}`, textAlign: 'right', color: KIT.txt2 }}>{h}</th>)}</tr></thead>
    <tbody>{CANDIDATS_DEFI.map(k => { const e = ECHANTILLONS[k]; return <tr key={k}><td style={{ padding: '2px 8px', textAlign: 'right' }}>{e.formule}</td><td style={{ padding: '2px 8px', textAlign: 'right' }}>{e.sel ? 'type NaCl (F)' : STRUCTURES[e.type].court}</td><td style={{ padding: '2px 8px', textAlign: 'right' }}>{fr(e.a, 4)}</td><td style={{ padding: '2px 8px', textAlign: 'right' }}>{fr(e.rho, 2)}</td></tr>; })}</tbody></table></div>);
const enonce = (d, { champ, choix }) => {
  if (d.type === 'inconnu') return <>🎯 Voici le diffractogramme (λ = 0,1542 nm) d’un cristal cubique inconnu. Relevez ses pics, testez les modèles, puis :
    <div style={{ marginTop: 6 }}><strong>1.</strong> Sa structure : {choix('s', [['P', 'cubique simple'], ['I', 'cubique centré'], ['F', 'faces centrées']])}</div>
    <div style={{ marginTop: 6 }}><strong>2.</strong> Son paramètre de maille a : {champ('a', 'nm')}</div>
    <div style={{ marginTop: 6 }}><strong>3.</strong> Sa nature, à l’aide des tables : {choix('id', CANDIDATS_DEFI.map(k => [k, ECHANTILLONS[k].formule]))}</div>
    {TABLE_REF}</>;
  if (d.type === 'bragg') return <>🎯 Le diffractogramme d’un métal {STRUCTURES[d.struct].nom} présente le pic ({d.hkl}) à <strong>2θ = {fr(d.dt, 2)}°</strong>, avec λ = 0,1542 nm. Calculez le paramètre de maille a (en nm).<div style={{ marginTop: 6 }}>{champ('v', 'nm')}</div></>;
  const e = ECHANTILLONS[d.cle];
  return <>🎯 Le {e.nom} ({e.formule}, M = {fr(e.M, 2)} g/mol) cristallise {e.sel ? 'dans une structure de type NaCl (réseau cubique à faces centrées, un motif NaCl par nœud)' : `dans le système ${STRUCTURES[e.type].nom}`}, de paramètre <strong>a = {fr(e.a, 4)} nm</strong>. Calculez sa masse volumique (en g/cm³). N<sub>A</sub> = 6,022 × 10²³ mol⁻¹.<div style={{ marginTop: 6 }}>{champ('v', 'g/cm³')}</div></>;
};
const solution = d => {
  if (d.type === 'inconnu') { const e = ECHANTILLONS[d.cle]; return <>Échantillon : <strong>{e.nom} ({e.formule})</strong>, structure {e.sel ? 'de type NaCl (réseau F)' : STRUCTURES[e.type].nom}, a = {fr(e.a, 4)} nm. Avec le bon modèle, les rapports sin²θ / sin²θ₁ suivent la suite {sequence(e.type, 6).map(v => fr(v, 2)).join(' ; ')}… et a est le même pour tous les pics.</>; }
  if (d.type === 'bragg') return <>θ = {fr(d.dt / 2, 3)}° ; <F>d = λ / (2 sin θ) = 0,1542 / (2 × {fr(Math.sin(rad(d.dt / 2)), 4)}) = {fr(d.d, 4)} nm</F> ; <F>a = d × √(h² + k² + l²) = {fr(d.d, 4)} × √{d.N} = <strong>{fr(d.a, 4)} nm</strong></F>.</>;
  const e = ECHANTILLONS[d.cle], n = STRUCTURES[e.type].n;
  return <>Une maille {STRUCTURES[e.type].nomF} contient n = {n} motif(s) {e.formule}. a = {fr(e.a, 4)} × 10⁻⁷ cm, a³ = {fr(e.a ** 3 * 1000, 3)} × 10⁻²³ cm³. <F>ρ = n M / (N<sub>A</sub> a³) = {n} × {fr(e.M, 2)} / (6,022 × 10²³ × {fr(e.a ** 3 * 1000, 3)} × 10⁻²³) = <strong>{fr(d.rho, 2)} g/cm³</strong></F> (tables : {fr(e.rho, 2)} g/cm³).</>;
};

// ====================================================
export function SimulationDiffractionRX() {
  const [mode, setMode] = useState(() => modeOuverture('drx-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('drx-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('drx');
  const [cle, setCle] = useState('W');
  const [rel, setRel] = useEtatPersistant('drx-releves-v1', {});   // relevés par échantillon (2θ en degrés)
  const [modele, setModele] = useState(null);   // 'P', 'I' ou 'F'
  const [B, setB] = useState({ th: 12, d: 0.22 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';

  const cleAff = enDefi && defi.type === 'inconnu' ? defi.cle : cle;
  const cleRel = enDefi && defi.type === 'inconnu' ? `defi-${defi.cle}` : cle;
  const ech = ECHANTILLONS[cleAff], liste = PICS[cleAff];
  const pts = useMemo(() => courbe(cleAff, liste), [cleAff, liste]);
  const releves = rel[cleRel] || [];
  const relTri = [...releves].sort((a, b) => a - b);
  const idx = modele ? indexer(relTri, modele) : null;
  const basculer = dt => setRel(r => { const L = r[cleRel] || []; return { ...r, [cleRel]: L.includes(dt) ? L.filter(v => v !== dt) : [...L, dt] }; });
  const dl = 2 * B.d * Math.sin(rad(B.th)) / LAMBDA;
  const W1 = PICS.W[0].dt, W3 = PICS.W[2].dt;

  const voir = (at, c, m) => { setAtelier(at); if (c) setCle(c); if (m !== undefined) setModele(m); };
  const relW = (rel.W || []).length, nW = PICS.W.length;
  const ETAPES = [
    { id: 'contexte', titre: 'Comment « voir » l’intérieur d’un cristal ?', depart: () => voir('drx', 'W', null),
      texte: <>Les atomes d’un cristal sont rangés en <strong>plans parallèles</strong> régulièrement espacés. On envoie un faisceau de <strong>rayons X</strong> (λ = 0,1542 nm, du même ordre de grandeur que les distances entre atomes) sur une <strong>poudre</strong> du cristal, et un détecteur tourne autour de l’échantillon : il enregistre l’intensité diffractée en fonction de l’angle de déviation <strong>2θ</strong>. On obtient le <strong>diffractogramme</strong> ci-contre (tungstène).</>,
      tache: { type: 'qcm', q: 'Pourquoi le détecteur ne reçoit-il des rayons X que pour certains angles ?', options: ['Les ondes diffractées par les différents plans n’interfèrent constructivement que pour certains angles', 'Le tube à rayons X n’émet que dans certaines directions', 'La poudre absorbe les rayons X aux autres angles', 'Le détecteur n’est sensible qu’à certains angles'], bonne: 0,
        expl: 'Chaque famille de plans atomiques diffracte les rayons X ; les ondes ne s’additionnent (interférences constructives) que pour des angles bien précis.' } },
    { id: 'bragg', titre: 'La loi de Bragg', depart: () => voir('bragg'),
      texte: <>Deux plans voisins, distants de <strong>d</strong>, renvoient chacun une onde. Le rayon réfléchi par le plan 2 parcourt un chemin plus long de <strong><F>δ = 2 d sin θ</F></strong> (en orange). Les deux ondes sont en phase (interférences constructives) si δ est un nombre entier de longueurs d’onde : <strong><F>2 d sin θ = n λ</F></strong> (loi de Bragg). Faites varier θ pour observer les deux cas.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'bragg' && Math.round(dl) >= 1 && Math.abs(dl - Math.round(dl)) < 0.04, consigne: 'Réglez θ pour obtenir des interférences constructives (δ / λ entier).' } },
    { id: 'braggCalc', titre: 'Calculer une distance entre plans', depart: () => voir('drx', 'W'),
      texte: <>Sur un diffractogramme, on lit <strong>2θ</strong> : il faut le diviser par 2 avant d’utiliser la loi de Bragg (à l’ordre 1).
        <ExempleResolu>Un pic à 2θ = 30,00° : θ = 15,00° ; <F>d = λ / (2 sin θ) = 0,1542 / (2 × 0,2588) = <strong>0,2979 nm</strong></F>.</ExempleResolu>
        À vous : le premier pic du tungstène est à 2θ = {fr(r2(W1), 2)}°.</>,
      tache: { type: 'num', q: 'Distance d entre les plans responsables de ce pic (en nm)', unite: 'nm', vrai: LAMBDA / (2 * Math.sin(rad(r2(W1) / 2))), tol: 0.01, affiche: x => fr(x, 4),
        pieges: [[LAMBDA / (2 * Math.sin(rad(r2(W1)))), 'Attention : la loi de Bragg utilise θ, pas 2θ. Divisez d’abord l’angle lu par 2.']],
        expl: `θ = ${fr(r2(W1) / 2, 3)}° et d = λ / (2 sin θ).` } },
    { id: 'miller', titre: 'Indices de Miller et distance d_hkl', depart: null,
      texte: <>Chaque famille de plans est repérée par trois entiers, ses <strong>indices de Miller (hkl)</strong>. Dans un cristal cubique de paramètre de maille a, la distance entre les plans (hkl) est :
        <Formule>d<sub>hkl</sub> = a / √(h² + k² + l²)</Formule>
        On note souvent <strong><F>N = h² + k² + l²</F></strong> : d<sub>hkl</sub> = a / √N.
        <ExempleResolu>Plans (110) d’un cristal de paramètre a = 0,3165 nm : <F>d<sub>110</sub> = 0,3165 / √2 = <strong>0,2238 nm</strong></F>.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Pour les plans (200), la distance d₂₀₀ vaut…', options: ['a / 2', 'a / 4', '2 a', 'a / √2'], bonne: 0, expl: 'h² + k² + l² = 4, donc d₂₀₀ = a / √4 = a / 2.' } },
    { id: 'extinctions', titre: 'Des pics qui manquent : les extinctions', depart: null,
      texte: <>Selon la façon dont la maille est peuplée, les ondes de certains atomes s’annulent et des familles de plans <strong>ne donnent aucun pic</strong> :
        <ul style={{ margin: '4px 0', paddingLeft: 18 }}><li><strong>cubique simple (P)</strong> : {STRUCTURES.P.regle} ;</li><li><strong>cubique centré (I)</strong> : {STRUCTURES.I.regle} ;</li><li><strong>cubique à faces centrées (F)</strong> : {STRUCTURES.F.regle}.</li></ul>
        C’est cette « signature » qui permet de reconnaître la structure.</>,
      tache: { type: 'qcm', q: 'Dans un cristal cubique centré, les plans (100)…', options: ['ne donnent pas de pic : h + k + l = 1 est impair', 'donnent le pic le plus intense', 'donnent un pic car tous les plans existent', 'ne donnent pas de pic car h, k et l n’ont pas la même parité'], bonne: 0,
        expl: 'En cubique centré, l’atome du centre est exactement entre deux plans (100) : son onde est en opposition et annule celle des plans (100).' } },
    { id: 'releve', titre: 'Relever les pics du tungstène', depart: () => voir('drx', 'W', null),
      texte: <>Cliquez sur chaque pic du diffractogramme pour <strong>relever sa position 2θ</strong> (un triangle numéroté apparaît ; un second clic l’efface). Le tableau calcule θ et sin²θ. Relevez les {nW} pics, <strong>sans oublier le premier</strong>.</>,
      tache: { type: 'action', ok: enGuide && relW >= nW, consigne: `Relevez les ${nW} pics du tungstène (${relW} / ${nW}).` } },
    { id: 'rapports', titre: 'La méthode des rapports', depart: () => voir('drx', 'W'),
      texte: <>Deux relations vont se combiner :
        <Formule>(1) Bragg (ordre 1) : 2 d<sub>hkl</sub> sin θ = λ</Formule>
        <Formule>(2) cubique : d<sub>hkl</sub> = a / √N</Formule>
        <div style={{ textAlign: 'center', fontSize: 13.5 }}>avec N = h² + k² + l²</div>
        De (1) : <F>sin θ = λ / (2 d<sub>hkl</sub>)</F>, donc
        <Formule>sin²θ = λ² / (4 d<sub>hkl</sub>²)</Formule>
        On remplace d<sub>hkl</sub>² par a² / N (relation 2) :
        <Formule>sin²θ = (λ² / 4a²) × N</Formule>
        Pour tous les pics, λ et a sont les mêmes : sin²θ est <strong>proportionnel à N</strong>. En divisant par le premier pic :
        <Formule>sin²θ / sin²θ₁ = N / N₁</Formule>
        Ces rapports ne dépendent pas de a : ils ne dépendent que de la structure ! La colonne « sin²θ / sin²θ₁ » du tableau les calcule.</>,
      tache: { type: 'num', q: 'Vérifiez à la main : sin²θ / sin²θ₁ pour le 3ᵉ pic', unite: '', vrai: Math.sin(rad(r2(W3) / 2)) ** 2 / Math.sin(rad(r2(W1) / 2)) ** 2, tol: 0.01, affiche: x => fr(x, 2),
        pieges: [[Math.sin(rad(r2(W3))) ** 2 / Math.sin(rad(r2(W1))) ** 2, 'Utilisez θ (la moitié de 2θ) dans le sinus.']], expl: `sin²(${fr(r2(W3) / 2, 3)}°) / sin²(${fr(r2(W1) / 2, 3)}°).` } },
    { id: 'modele', titre: 'Tester les trois modèles', depart: () => voir('drx', 'W'),
      texte: <>Choisissez un modèle sous le tableau. Chaque modèle impose une liste de valeurs de N permises. Le simulateur calcule N estimé = (sin²θ / sin²θ₁) × N₁ et le compare aux valeurs permises : <strong>un ⚠️ signale un pic dont le N estimé n’est permis par aucun plan du modèle</strong>. Il calcule ensuite
        <Formule>a = λ √N / (2 sin θ)</Formule>
        pour chaque pic. Le bon modèle est celui où <strong>tous les N estimés sont permis</strong> (aucun ⚠️) et où <strong>a est le même pour tous les pics</strong>. Testez le modèle cubique simple : regardez le 7ᵉ pic du tungstène.</>,
      tache: { type: 'action', ok: enGuide && cle === 'W' && modele === 'I' && !!idx && idx.constant && idx.lignes.length >= nW, consigne: 'Trouvez le modèle pour lequel a est constant (avec tous les pics relevés).' } },
    { id: 'cs', titre: 'Cubique simple ou cubique centré ?', depart: () => voir('drx', 'W', 'P'),
      texte: <>Rappel : N = h² + k² + l² avec h, k, l entiers, et les plans qui existent dépendent du réseau (étape « extinctions ») :
        <ul style={{ margin: '4px 0', paddingLeft: 18, lineHeight: 1.55 }}>
          <li><strong>cubique simple</strong> : tous les (hkl) → N = 1 (100), 2 (110), 3 (111), 4 (200), 5 (210), 6 (211), <strong>8</strong> (220), 9… : <strong>il n’y a pas de N = 7</strong> (aucun triplet d’entiers n’a h² + k² + l² = 7) ;</li>
          <li><strong>cubique centré</strong> : h + k + l pair → N = 2 (110), 4 (200), 6 (211), 8 (220), 10 (310), 12 (222), <strong>14 (321)</strong>… soit, après division par N₁ = 2 : 1, 2, 3, 4, 5, 6, <strong>7</strong>…</li></ul>
        Avec les 6 premiers pics, les deux modèles donnent un a constant (celui du cubique simple est √2 fois plus petit) : les rapports 1, 2, 3, 4, 5, 6 sont identiques. C’est le <strong>7ᵉ pic</strong> qui tranche : son rapport sin²θ / sin²θ₁ vaut 7,00. Le tableau (modèle cubique simple) affiche ⚠️ sur ce pic.</>,
      tache: { type: 'qcm', q: 'Le 7ᵉ pic a un rapport égal à 7. Pourquoi cela exclut-il le cubique simple ?', options: ['N = 7 n’existe pas en cubique simple (la liste saute de 6 à 8), alors qu’il existe en cubique centré (rapport 14 / 2)', 'Il est trop intense', 'Il dépasse 2θ = 90°', 'Le cubique simple n’a que 6 pics'], bonne: 0,
        expl: 'Aucune somme de trois carrés d’entiers ne vaut 7 : en cubique simple il y a un « trou » entre N = 6 et N = 8. En cubique centré, N = 14 (plans 321, h + k + l = 6 pair) existe bien et 14 / 2 = 7.' } },
    { id: 'parametre', titre: 'Le paramètre de maille', depart: () => voir('drx', 'W', 'I'),
      texte: <>Avec le modèle cubique centré, lisez la moyenne de a sous le tableau.</>,
      tache: { type: 'num', q: 'Paramètre de maille du tungstène (en nm)', unite: 'nm', vrai: ECHANTILLONS.W.a, tol: 0.005, affiche: x => fr(x, 4), pieges: [[ECHANTILLONS.W.a / Math.sqrt(2), 'C’est la valeur du modèle cubique simple : revenez au modèle cubique centré.']], expl: 'Les tables donnent a = 0,3165 nm.' } },
    { id: 'densite', titre: 'Contrôler par la masse volumique', depart: () => voir('drx', 'W', 'I'),
      texte: <>Une maille cubique centrée contient 1 + 8 × 1/8 = <strong>2 atomes</strong>. Sa masse est 2 M / N<sub>A</sub>, son volume a³ :
        <Formule>ρ = 2 M / (N<sub>A</sub> a³)</Formule>
        Données : M(W) = 183,84 g/mol ; N<sub>A</sub> = 6,022 × 10²³ mol⁻¹ ; a = 0,3165 nm, à convertir en cm (1 nm = 10⁻⁷ cm). Calculez ρ, puis comparez aux tables : ρ = 19,25 g/cm³. (Le contrôle automatique du simulateur est masqué pendant cette étape.)</>,
      tache: { type: 'num', q: 'Masse volumique calculée (en g/cm³)', unite: 'g/cm³', vrai: masseVolumique(2, 183.84, ECHANTILLONS.W.a), tol: 0.02, affiche: x => fr(x, 2),
        pieges: [[masseVolumique(1, 183.84, ECHANTILLONS.W.a), 'Une maille cubique centrée contient 2 atomes, pas 1.'], [masseVolumique(1, 183.84, ECHANTILLONS.W.a / Math.sqrt(2)), 'C’est le résultat du modèle cubique simple : il est incompatible avec la masse volumique mesurée.']], expl: 'ρ = 2 × 183,84 / (6,022 × 10²³ × (0,3165 × 10⁻⁷)³).' } },
    { id: 'nacl', titre: 'Un cristal ionique : NaCl', depart: () => voir('drx', 'NaCl', null),
      texte: <>Dans NaCl, les ions Cl⁻ forment un réseau <strong>cubique à faces centrées</strong> et les ions Na⁺ occupent ses sites octaédriques. Pour les plans aux indices tous impairs (111, 311…), les ondes de Na⁺ et de Cl⁻ sont en opposition : ces pics sont <strong>faibles</strong>, mais présents. Relevez au moins 6 pics (dont le tout premier, à 2θ ≈ 27°) et trouvez la structure.</>,
      tache: { type: 'action', ok: enGuide && cle === 'NaCl' && modele === 'F' && !!idx && idx.constant && idx.lignes.length >= 6, consigne: 'Relevez au moins 6 pics de NaCl et trouvez le modèle qui donne a constant.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li><strong>Loi de Bragg</strong> : 2 d sin θ = n λ (θ est la moitié de l’angle 2θ lu).</li>
        <li>Cristal cubique : d<sub>hkl</sub> = a / √(h² + k² + l²), d’où sin²θ / sin²θ₁ = N / N₁.</li>
        <li>Suites des rapports : P 1, 2, 3, 4, 5, 6, 8… ; I 1, 2, 3, 4, 5, 6, 7… ; F 1 ; 1,33 ; 2,67 ; 3,67 ; 4…</li>
        <li>Le bon modèle donne <strong>le même a pour tous les pics</strong> ; la masse volumique ρ = n M / (N<sub>A</sub> a³) permet de confirmer.</li></ul></ARetenir>, tache: null },
  ];
  const etapeDensite = enGuide && ETAPES[Math.min(guide.etape, ETAPES.length - 1)].id === 'densite';
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { setDefi(nouveauDefi(type)); setModele(null); setRel(r => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('defi-')))); if (type === 'inconnu') setAtelier('drx'); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'inconnu'); else { setModele(null); if (md === 'explore') setAtelier('drx'); } }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Cristal cubique et parfait</strong> : on teste seulement les trois réseaux cubiques P, I et F (les autres systèmes cristallins demandent des formules de d<sub>hkl</sub> plus compliquées).</li>
      <li><strong>Diffraction à l’ordre 1</strong> : 2 d<sub>hkl</sub> sin θ = λ. Ce n’est pas une restriction : l’ordre 2 des plans (110) est le pic (220).</li>
      <li><strong>Une seule longueur d’onde</strong>, λ = 0,1542 nm (raie Kα du cuivre ; le doublet Kα₁ / Kα₂, visible aux grands angles sur un vrai diffractogramme, n’est pas représenté).</li>
      <li><strong>Poudre fine sans orientation privilégiée</strong> : toutes les familles de plans sont en position de diffracter.</li>
      <li><strong>Positions des pics</strong> lues au centième de degré ; un petit décalage aléatoire (± 0,015°) imite les défauts de réglage. Les paramètres de maille sont ceux des tables à 20 °C.</li>
      <li><strong>Intensités approchées</strong> (facteur de structure, multiplicité, facteur de Lorentz-polarisation, agitation thermique, facteur de diffusion simplifié) : elles donnent l’allure du diffractogramme, mais <strong>seules les positions sont exploitées</strong>. Un pic trop faible (moins de 0,4 % du plus intense) n’est pas visible.</li>
      <li><strong>Méthode des rapports</strong> : elle suppose que le premier pic relevé est bien le premier pic du diffractogramme. Si on l’oublie, aucun modèle ne donne un a constant.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const cell = { padding: '3px 6px', textAlign: 'right', fontSize: 13 };
  const enTete = h => <th key={h} style={{ ...cell, color: KIT.txt2, borderBottom: `1px solid ${KIT.bord}` }}>{h}</th>;
  const cacheNom = enDefi && defi.type === 'inconnu';
  const atelierDRX = (
    <div>
      {!cacheNom && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Échantillon :</span>
        {ORDRE_EXPLO.map(k => <button key={k} onClick={() => setCle(k)} style={stylePetitBouton(cle === k, '#1d4ed8')}>{ECHANTILLONS[k].formule}</button>)}
        <span style={{ fontSize: 13, color: KIT.txt2 }}>({ech.nom})</span></div>}
      {cacheNom && <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 6 }}>Échantillon inconnu</div>}
      <Diffractogramme liste={liste} pts={pts} releves={releves} onClic={basculer} titre={`Diffractogramme ${cacheNom ? 'de l’échantillon inconnu' : 'du ' + ech.nom}`}/>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 13, color: KIT.txt2 }}>👆 Cliquez sur un pic pour relever sa position (un second clic l’efface).</span>
        {enExplore && <button onClick={() => setRel(r => ({ ...r, [cleRel]: liste.map(p => r2(p.dt)) }))} style={stylePetitBouton(false, '#334155')}>Relever tous les pics</button>}
        {releves.length > 0 && <button onClick={() => setRel(r => ({ ...r, [cleRel]: [] }))} style={stylePetitBouton(false, '#334155')}>🗑 Effacer les relevés</button>}</div>
      <div style={{ marginTop: 10, padding: '8px 10px', border: `1px solid ${KIT.bord}`, borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Modèle testé :</span>
          {['P', 'I', 'F'].map(t => <button key={t} onClick={() => setModele(m => (m === t ? null : t))} style={stylePetitBouton(modele === t, VIOLET)}>{STRUCTURES[t].court}</button>)}</div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.6 }}>
          {['P', 'I', 'F'].map(t => <div key={t}>Rapports attendus {t} : <strong style={{ color: modele === t ? VIOLET : KIT.txt }}>{sequence(t, 8).map(v => fr(v, 2)).join(' ; ')}…</strong></div>)}</div>
      </div>
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white' }}>
          <thead><tr>{['n°', '2θ (°)', 'θ (°)', 'sin²θ', 'sin²θ / sin²θ₁', ...(idx ? [`N estimé (× ${idx.N1})`, 'N retenu', '(hkl)', 'a (nm)'] : [])].map(enTete)}</tr></thead>
          <tbody>{relTri.length === 0 && <tr><td colSpan={5} style={{ ...cell, textAlign: 'left', color: KIT.txt2 }}>Aucun pic relevé.</td></tr>}
            {relTri.map((dt, i) => { const th = dt / 2, s2 = Math.sin(rad(th)) ** 2, s21 = Math.sin(rad(relTri[0] / 2)) ** 2, l = idx && idx.lignes[i];
              const loin = l && Math.abs(l.Nest - l.N) > 0.15;
              return <tr key={dt} style={{ background: i % 2 ? '#f8fafc' : 'white' }}>
                <td style={cell}>{i + 1}</td><td style={cell}>{fr(dt, 2)}</td><td style={cell}>{fr(th, 3)}</td><td style={cell}>{fr(s2, 4)}</td><td style={cell}>{fr(s2 / s21, 3)}</td>
                {l && <><td style={cell}>{fr(l.Nest, 2)}</td><td style={{ ...cell, fontWeight: 700, color: loin ? '#b91c1c' : KIT.txt }}>{l.N}{loin ? ' ⚠️' : ''}</td><td style={cell}>{l.hkl}</td><td style={{ ...cell, fontWeight: 700 }}>{fr(l.a, 4)}</td></>}</tr>; })}</tbody></table></div>
      {idx && idx.lignes.length >= 2 && (() => {
        const interdit = idx.lignes.findIndex(l => Math.abs(l.Nest - l.N) > 0.15), li = interdit >= 0 ? idx.lignes[interdit] : null;
        const P = Npermis(modele), avant = li ? [...P].reverse().find(n => n < li.Nest) : null, apres = li ? P.find(n => n > li.Nest) : null;
        return <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, fontSize: 14, lineHeight: 1.55,
          background: idx.constant ? '#f0fdf4' : '#fef2f2', border: `1px solid ${idx.constant ? '#86efac' : '#fca5a5'}`, color: idx.constant ? '#14532d' : '#7f1d1d' }}>
          {idx.constant ? <>✅ Modèle {STRUCTURES[modele].nom} : tous les N estimés sont des valeurs permises et a est le même pour tous les pics (a varie de {fr(idx.disp * 100, 2)} %, moyenne {fr(idx.moy, 4)} nm) : <strong>modèle compatible avec la position des pics</strong>.</>
            : <>❌ Modèle {STRUCTURES[modele].nom} : <strong>modèle incompatible</strong>.{' '}
              {li ? <>Le pic n° {interdit + 1} a un rapport sin²θ / sin²θ₁ = {fr(li.rap, 2)}, soit N estimé = {fr(li.Nest, 2)} : <strong>aucun plan de ce réseau n’a cette valeur de N</strong> (les valeurs permises voisines sont {avant} et {apres}).{' '}
                Conséquence : a n’est pas constant (il varie de {fr(idx.disp * 100, 2)} % d’un pic à l’autre).</>
                : <>Le paramètre a n’est pas constant (il varie de {fr(idx.disp * 100, 2)} % d’un pic à l’autre) : vérifiez que vous n’avez pas oublié un pic, en particulier le premier.</>}</>}
          {idx.constant && idx.lignes.length < 7 && modele !== 'F' && <div style={{ fontSize: 12.5, marginTop: 2 }}>💡 Avec peu de pics, les modèles P et I peuvent donner tous deux un a constant : relevez plus de pics (le 7ᵉ tranche) ou vérifiez avec la masse volumique.</div>}
        </div>; })()}
      {idx && idx.lignes.length >= 2 && !cacheNom && !etapeDensite && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, lineHeight: 1.6 }}>
        <strong>Contrôle par la masse volumique</strong> : une maille {STRUCTURES[modele].nomF} contient {STRUCTURES[modele].n} motif(s) {ech.formule} (M = {fr(ech.M, 2)} g/mol), donc{' '}
        <F>ρ = {STRUCTURES[modele].n} × M / (N<sub>A</sub> × a³) = <strong>{fr(masseVolumique(STRUCTURES[modele].n, ech.M, idx.moy), 2)} g/cm³</strong></F> ; tables : {fr(ech.rho, 2)} g/cm³
        {proche(masseVolumique(STRUCTURES[modele].n, ech.M, idx.moy), ech.rho, 0.03) ? ' ✅ accord.' : ' ❌ désaccord : ce modèle ne convient pas.'}</div>}
    </div>);
  const atelierBragg = (
    <div>
      <SchemaBragg th={B.th} d={B.d}/>
      <Ondes dl={dl}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 8 }}>
        <Curseur nom="Angle θ" val={B.th} min={5} max={80} pas={0.1} set={v => setB(b => ({ ...b, th: v }))} unite="°" fmt={v => fr(v, 1)}/>
        <Curseur nom="Distance d entre plans" val={B.d} min={0.1} max={0.4} pas={0.005} set={v => setB(b => ({ ...b, d: v }))} unite=" nm" fmt={v => fr(v, 3)}/></div>
      <div style={{ fontSize: 14, color: KIT.txt, marginTop: 6, lineHeight: 1.6 }}>
        δ = 2 d sin θ = 2 × {fr(B.d, 3)} × sin({fr(B.th, 1)}°) = <strong>{fr(2 * B.d * Math.sin(rad(B.th)), 4)} nm</strong>, soit δ / λ = <strong>{fr(dl, 2)}</strong> →{' '}
        {Math.round(dl) >= 1 && Math.abs(dl - Math.round(dl)) < 0.04 ? <strong style={{ color: VERT }}>interférences constructives : pic de diffraction (ordre {Math.round(dl)}) ✅</strong>
          : Math.abs(dl - Math.round(dl)) > 0.4 ? <strong style={{ color: '#b91c1c' }}>interférences destructives : rien au détecteur</strong> : <span>ondes partiellement décalées : intensité faible</span>}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        {[1, 2].map(n => { const s = n * LAMBDA / (2 * B.d); return s < 1 && <button key={n} onClick={() => setB(b => ({ ...b, th: Math.round(deg(Math.asin(s)) * 10) / 10 }))} style={stylePetitBouton(false, '#334155')}>Aller à l’angle de Bragg (ordre {n} : θ = {fr(deg(Math.asin(s)), 1)}°)</button>; })}</div>
    </div>);
  const planche = (
    <div style={styleBoite}>
      {!(enDefi && defi.type === 'inconnu') && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['drx', '📈 Diffractogramme'], ['bragg', '📐 Loi de Bragg']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>}
      {atelier === 'bragg' && !(enDefi && defi.type === 'inconnu') ? atelierBragg : atelierDRX}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Tungstène : relevez seulement les 6 premiers pics. Les modèles P et I donnent-ils tous deux un a constant ? Comment trancher ?</li>
        <li>Cuivre : testez les trois modèles. Pourquoi les rapports 1,33 et 2,67 trahissent-ils le réseau F ?</li>
        <li>NaCl : oubliez le premier pic (faible). Que devient l’indexation ?</li>
        <li>KCl (piège !) : K⁺ et Cl⁻ ont le même nombre d’électrons. Quel modèle semble convenir ? Que dit la masse volumique ?</li>
        <li>Loi de Bragg : pour d = 0,20 nm, existe-t-il un pic d’ordre 2 ? Et pour d = 0,10 nm ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>2 d sin θ = n λ</li><li>d<sub>hkl</sub> = a / √(h² + k² + l²)</li><li>sin²θ / sin²θ₁ = N / N₁ → la structure</li><li>ρ = n M / (N<sub>A</sub> a³) pour confirmer</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .drx-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .drx-l1.cote { grid-template-columns: minmax(0, 3fr) minmax(350px, 2fr); }
        .drx-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .drx-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Diffraction des rayons X : identifier une structure cubique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Comment sait-on que le tungstène est cubique centré et le cuivre cubique à faces centrées ? En les éclairant aux <strong>rayons X</strong> : la position des pics du <strong>diffractogramme</strong> révèle la structure et le <strong>paramètre de maille</strong>.</div>
      {enExplore && <div style={{ ...styleBoite, marginBottom: 10, fontSize: 14, color: KIT.txt, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span>👋 <strong>Première fois ici ?</strong> Cette simulation suppose de connaître la méthode (loi de Bragg, indices de Miller, extinctions, rapports). Le parcours guidé la construit pas à pas : commencez par lui.</span>
        <button onClick={() => changerMode('guide')} style={styleBouton(true, '#1d4ed8')}>🧭 Commencer le parcours guidé</button></div>}
      <div className={`drx-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution}/></div>}
          {(!enDefi || defi.type === 'inconnu') && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="drx-l2">{panneauHypo}</div>}
      {enExplore && <div className="drx-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
