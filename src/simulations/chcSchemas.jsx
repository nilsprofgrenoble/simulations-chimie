// Schémas de la simulation 241 (modifier la chaîne carbonée) : formules topologiques tracées depuis le graphe de chcModele.js,
// animation d'une réaction (scènes de chcScenes.js), cartes de réactions de la banque, schémas des cartes « À retenir ».
// Règles : coordonnées toujours numériques ; textes ≥ 16 dans l'espace du dessin (≥ 11 px rendus à 390 px) ; jamais la couleur seule (trait, forme, étiquette).
import { useEffect, useMemo, useRef, useState } from 'react';
import { MOLS, formule, nbH, ESPECES, squelette, NOM_PARTENAIRE } from './chcModele.js';
import { etatAu, phaseAu, lisse } from './chcScenes.js';
import { KIT, styleBouton, stylePetitBouton } from '../commun';

const NOIR = '#0f172a', GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c';
const OFFSETS = { 1: [0], 2: [-3.6, 3.6], 3: [-5.4, 0, 5.4] };

// ---------- images statiques depuis le graphe d'une molécule ----------
function etatStatique(m) {
  const vois = m.atomes.map(() => []);
  m.liaisons.forEach(([a, b]) => { vois[a].push(b); vois[b].push(a); });
  const atomes = m.atomes.map((a, i) => {
    let txt = null, side;
    const h = nbH(m, i), v = vois[i].length ? m.atomes[vois[i][0]] : null;
    if (a.e !== 'C') {
      txt = a.e;
      if (v && vois[i].length === 1 && h >= 1) {
        side = v.x < a.x - 0.3 ? 'L' : v.x > a.x + 0.3 ? 'R' : 'D';
        txt = a.e === 'O' ? 'OH' : h === 2 ? 'NH₂' : 'NH';
      }
    }
    return { k: String(i), e: a.e, x: a.x, y: a.y, op: 1, textes: txt ? [[txt, 1]] : null, side, tag: null };
  });
  const liaisons = m.liaisons.map(([a, b, o]) => ({ a: atomes[a], b: atomes[b], n: o, lignes: Array.from({ length: o }, (_, i) => ({ i, op: 1 })), hi: null, op: 1 }));
  return { atomes, liaisons };
}

// ---------- tracé d'une image (statique ou animée) : renvoie les éléments SVG en pixels, avec l'origine donnée ----------
const rayon = a => (a.e === 'Br' || a.e === 'Mg' ? 17 : 13);
function tracer(etat, L, ox, oy, { hl = null, taille = 18, epais = 2.6, neutre = false } = {}) {
  const X = a => ox + a.x * L, Y = a => oy - a.y * L, el = [];
  etat.liaisons.forEach((b, k) => {
    if (b.op <= 0.01) return;
    const p = { x: X(b.a), y: Y(b.a) }, q = { x: X(b.b), y: Y(b.b) }, d = Math.hypot(q.x - p.x, q.y - p.y) || 1, u = { x: (q.x - p.x) / d, y: (q.y - p.y) / d };
    const ra = b.a.textes ? rayon(b.a) : 0, rb = b.b.textes ? rayon(b.b) : 0;
    const p2 = { x: p.x + u.x * ra, y: p.y + u.y * ra }, q2 = { x: q.x - u.x * rb, y: q.y - u.y * rb };
    const orange = (!neutre && b.hi === 'nouvelle') || (hl && hl.liaisons && hl.liaisons.includes(k)), bleu = !neutre && b.hi === 'change', rompue = b.hi === 'rompue' && b.trans;
    const couleur = orange ? ORANGE : bleu ? BLEU : NOIR;
    b.lignes.forEach(l => {
      if (l.op <= 0.01) return;
      const off = OFFSETS[b.n][l.i];
      el.push(<line key={`b${k}_${l.i}`} x1={p2.x - u.y * off} y1={p2.y + u.x * off} x2={q2.x - u.y * off} y2={q2.y + u.x * off} stroke={couleur} strokeWidth={orange ? epais + 1 : epais}
        strokeLinecap="round" strokeDasharray={rompue ? '6 5' : undefined} opacity={l.op * b.op}/>);
    });
  });
  if (hl && hl.anneaux) hl.anneaux.forEach(i => { const a = etat.atomes[i]; el.push(<circle key={`an${i}`} cx={X(a)} cy={Y(a)} r={11} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="5 4"/>); });
  etat.atomes.forEach(a => {
    if (a.op <= 0.01) return;
    const cx = X(a), cy = Y(a);
    if (a.e === 'chip') {
      const txt = a.textes[0][0], w = txt.length * 9.4 + 18;
      el.push(<g key={`a${a.k}`} opacity={a.op}><rect x={cx - w / 2} y={cy - 15} width={w} height={30} rx={15} fill="#e0f2fe" stroke={BLEU} strokeWidth={2}/><text x={cx} y={cy + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="#0c4a6e">{txt}</text></g>);
      return;
    }
    if (a.textes) a.textes.forEach(([t0, o], i) => {
      let txt = t0, anc = 'middle', dx = 0;
      if (a.side === 'L') { anc = 'start'; dx = -8; } else if (a.side === 'R') { anc = 'end'; dx = 8; if (t0 === 'OH') txt = 'HO'; if (t0 === 'NH₂') txt = 'H₂N'; }
      el.push(<text key={`t${a.k}_${i}`} x={cx + dx} y={cy + 6.5} textAnchor={anc} fontSize={taille} fontWeight={700} fill={NOIR} opacity={a.op * o}>{txt}</text>);
    });
    if (a.tag && a.tag.op > 0.01) el.push(<g key={`g${a.k}`} opacity={a.tag.op}><circle cx={cx + 15} cy={cy - 16} r={8.5} fill="#fff" stroke={NOIR} strokeWidth={1.8}/><text x={cx + 15} y={cy - 11.2} textAnchor="middle" fontSize={15} fontWeight={700} fill={NOIR}>{a.tag.txt}</text></g>);
  });
  return el;
}
const bbox = (pts, mx, my) => {
  const x0 = Math.min(...pts.map(p => p[0])) - mx, x1 = Math.max(...pts.map(p => p[0])) + mx, y0 = Math.min(...pts.map(p => p[1])) - my, y1 = Math.max(...pts.map(p => p[1])) + my;
  return { x0, x1, y0, y1 };
};

// ---------- molécule seule : <svg> à taille naturelle, réduite si la place manque ----------
export function Mol({ id, L = 34, aria, hl = null, style = {} }) {
  const m = MOLS[id], etat = useMemo(() => etatStatique(m), [m]);
  if (id === 'EtMgBr') L = Math.round(L * 1.35);
  const long = etat.atomes.some(a => a.textes && a.textes[0][0].length > 2);
  const b = bbox(m.atomes.map(a => [a.x, a.y]), long ? 1.5 : 0.8, 0.7), w = (b.x1 - b.x0) * L, h = (b.y1 - b.y0) * L;
  const el = tracer(etat, L, -b.x0 * L, b.y1 * L, { hl });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w, display: 'block', margin: '0 auto', ...style }} role="img" aria-label={aria || `Formule topologique : ${m.nom}, ${formule(m)}`}>{el}</svg>);
}
export function MolCarte({ id, L = 34, largeur = null, role = null, hl = null }) {
  const m = MOLS[id];
  return (
    <figure style={{ margin: 0, textAlign: 'center', flex: '0 1 auto', maxWidth: largeur || '100%' }}>
      <Mol id={id} L={L} hl={hl}/>
      <figcaption style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.35, marginTop: 2 }}>
        {role && <div style={{ fontWeight: 700, color: NOIR }}>{role}</div>}
        <span style={{ fontWeight: 700, color: NOIR }}>{m.nom}</span><br/>{formule(m)}
      </figcaption>
    </figure>);
}

// ---------- flèche de réaction et carte d'une réaction de la banque ----------
export function FlecheReaction({ haut, bas, largeur = 150 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: largeur, maxWidth: '100%', flex: '0 1 auto', gap: 2 }}>
      {haut && <div style={{ fontSize: 13.5, color: NOIR, textAlign: 'center', lineHeight: 1.3 }}>{haut}</div>}
      <svg viewBox="0 0 80 14" width="80" height="14" role="img" aria-label="flèche de réaction"><line x1={2} y1={7} x2={72} y2={7} stroke={NOIR} strokeWidth={2.4}/><polygon points="78,7 68,2 68,12" fill={NOIR}/></svg>
      {bas && <div style={{ fontSize: 13, color: GRIS, textAlign: 'center', lineHeight: 1.3 }}>{bas}</div>}
    </div>);
}
const Plus = () => <span aria-hidden="true" style={{ fontSize: 22, fontWeight: 700, color: NOIR, padding: '0 2px' }}>+</span>;
const Petite = ({ t }) => <span style={{ fontSize: 17, fontWeight: 700, color: NOIR, padding: '0 4px' }}>{t}</span>;
export function CarteReaction({ r, L = 28, compact = false }) {
  const [dep] = r.exemple, a = r.apps[dep];
  const items = (liste, cote) => liste.map(([c, id], k) => {
    const bloc = MOLS[id]
      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{c > 1 && <Petite t={`${c}`}/>}<MolCarte id={id} L={L} largeur={compact ? 190 : 230}/></span>
      : (id === 'ox' || id === 'H2' || id === 'eau' || id === 'Mg') && cote === 'g' ? null : (id === 'ox' || id === 'H2') ? null : <Petite t={`${c > 1 ? c + ' ' : ''}${ESPECES[id].formule}`}/>;
    return bloc ? <span key={`${cote}${k}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{k > 0 && <Plus/>}{bloc}</span> : null;
  });
  // réactifs dessinés : molécules de la banque (substrat et partenaire organique) ; réactifs minéraux écrits sur la flèche
  const gauche = a.eq.r.filter(([, id]) => MOLS[id]);
  const droite = a.eq.p;
  const especes = [...a.eq.r, ...a.eq.p].map(([, id]) => id);
  const note = especes.includes('ox') ? 'Bilan simplifié : l’oxydant est représenté par des atomes d’oxygène [O], non dessinés.' : especes.includes('H2') ? 'Bilan simplifié : l’hydrogène apporté par le réducteur, noté [H], n’est pas dessiné.' : especes.includes('MgOHBr') ? 'Bilan simplifié : le sel de magnésium formé est écrit Mg(OH)Br.' : null;
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, rowGap: 4 }}>
        {items(gauche, 'g')}
        <FlecheReaction haut={r.reactifs} bas={r.conditions} largeur={compact ? 140 : 180}/>
        {items(droite, 'd')}
      </div>
      {note && <div style={{ fontSize: 12.5, color: '#64748b', textAlign: 'center', marginTop: 4 }}>{note}</div>}
    </div>);
}

// ====================================================
//  Animation d'une réaction : scène SVG à l'instant t + commandes (lancer, début, avant / pendant / après, curseur)
// ====================================================
const L_SCENE = 46;
function dimensions(scene) {
  const pts = []; let mx = 1.0;
  scene.atomes.forEach(a => { pts.push(a.p0, a.p1); });
    scene.atomes.forEach(a => { if (a.e === 'chip') { const w = (typeof a.label === 'string' ? a.label.length : 6) * 9.4 + 18; mx = Math.max(mx, w / 2 / L_SCENE + 0.2); } });
  let { x0, x1, y0, y1 } = bbox(pts, mx, 0.95);
  const cle = scene.cle;
  if (cle) { const w = cle.txt.length * 9.2 / L_SCENE; const xa = cle.ancre === 'middle' ? cle.x - w / 2 : cle.x, xb = xa + w; x0 = Math.min(x0, xa - 0.2); x1 = Math.max(x1, xb + 0.2); y0 = Math.min(y0, cle.y - 0.6); y1 = Math.max(y1, cle.y + 0.6); }
  return { x0, x1, y0, y1, w: (x1 - x0) * L_SCENE, h: (y1 - y0) * L_SCENE };
}
export function SceneSvg({ scene, t, avecCle = true, neutre = false }) {
  const dim = useMemo(() => dimensions(scene), [scene]);
  const etat = etatAu(scene, t);
  const el = tracer(etat, L_SCENE, -dim.x0 * L_SCENE, dim.y1 * L_SCENE, { neutre });
  const cle = scene.cle, op = cle && avecCle ? lisse((t - cle.apres) / 0.12) : 0;
  return (
    <svg viewBox={`0 0 ${dim.w} ${dim.h}`} width="100%" style={{ maxWidth: dim.w * 1.5, display: 'block', margin: '0 auto' }} role="img" aria-label={scene.resume}>
      {el}
      {cle && op > 0.01 && <text x={(cle.x - dim.x0) * L_SCENE} y={(dim.y1 - cle.y) * L_SCENE + 5} textAnchor={cle.ancre} fontSize={16} fontWeight={700} fill={ORANGE} stroke="#fff" strokeWidth={4} paintOrder="stroke" opacity={op}>{cle.txt}</text>}
    </svg>);
}
const DUREE = 5200;
export function AnimationReaction({ scene, neutre = false, nom = null }) {
  const [t, setT] = useState(0), [lecture, setLecture] = useState(false);
  const depart = useRef(0), debut = useRef(0), raf = useRef(0);
  const reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    setT(0); setLecture(false);
  }, [scene]);
  useEffect(() => {
    if (!lecture) return undefined;
    debut.current = performance.now(); depart.current = t >= 0.999 ? 0 : t;
    const pas = now => {
      const nt = Math.min(1, depart.current + (now - debut.current) / DUREE);
      setT(nt);
      if (nt < 1) raf.current = requestAnimationFrame(pas); else setLecture(false);
    };
    raf.current = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture]);
  const aller = v => { setLecture(false); setT(v); };
  const phase = phaseAu(scene, t), phases = neutre ? scene.phasesNeutres : scene.phases;
  const ph = (t < 0.05 ? 0 : t > 0.97 ? 2 : phase);
  const compteur = !neutre && (() => {
    const lib = (id, n = 1) => `${n > 1 ? n + ' × ' : ''}${MOLS[id].nom} (${squelette(MOLS[id]).nC} C)`;
    return `${scene.reactifs.map(id => lib(id)).join(' + ')}  →  ${scene.produits.map(([id, n]) => lib(id, n)).join(' + ')}`;
  })();
  return (
    <div>
      {nom && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{nom}</div>}
      <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '6px 4px' }}>
        <SceneSvg scene={scene} t={t} avecCle={!neutre} neutre={neutre}/>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
        {!reduit && <button type="button" onClick={() => setLecture(l => !l)} style={styleBouton(true, '#0369a1')}>{lecture ? '⏸ Pause' : t >= 0.999 ? '↺ Revoir' : '▶ Lancer l’animation'}</button>}
        {[['Avant', 0], ['Pendant', 0.5], ['Après', 1]].map(([l, v]) => <button key={l} type="button" onClick={() => aller(v)} aria-pressed={Math.abs(t - v) < 0.02} style={{ ...stylePetitBouton(Math.abs(t - v) < 0.02, '#0369a1'), minHeight: 40 }}>{l}</button>)}
      </div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginTop: 8 }}>Avancement de l’animation, de avant à après
        <input type="range" min={0} max={100} value={Math.round(t * 100)} onChange={e => aller(Number(e.target.value) / 100)} style={{ width: '100%', height: 30, display: 'block', marginTop: 2 }}/></label>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, minHeight: 64, marginTop: 6 }}>{phases[ph]}</div>
      {compteur && <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 2 }}><strong>Atomes de carbone :</strong> {compteur}</div>}
    </div>);
}

// ====================================================
//  Cartes « À retenir » : viewBox 320 de large, textes ≥ 15,5 (≥ 11 px rendus à 390 px), tout le texte dans le cadre
// ====================================================
const Cadre = ({ h, aria, children }) => (
  <svg viewBox={`0 0 320 ${h}`} width="100%" style={{ maxWidth: 420, display: 'block', margin: '4px auto 8px' }} role="img" aria-label={aria}>{children}</svg>);
const T = ({ x, y, ancre = 'start', taille = 15.5, gras = false, couleur = NOIR, children }) => (
  <text x={x} y={y} textAnchor={ancre} fontSize={taille} fontWeight={gras ? 700 : 400} fill={couleur}>{children}</text>);
// molécule dessinée dans une carte, centrée dans la boîte (bx, by, bw, bh)
function MolDansCarte({ id, bx, by, bw, bh, L = 32, hl = null }) {
  const m = MOLS[id], etat = etatStatique(m), long = etat.atomes.some(a => a.textes && a.textes[0][0].length > 2), b = bbox(m.atomes.map(a => [a.x, a.y]), long ? 1.2 : 0.55, 0.55);
  const w = (b.x1 - b.x0) * L, h = (b.y1 - b.y0) * L, s = Math.min(1, bw / w, bh / h);
  const ox = bx + (bw - w * s) / 2, oy = by + (bh - h * s) / 2;
  return <g transform={`translate(${ox},${oy}) scale(${s})`}>{tracer(etat, L, -b.x0 * L, b.y1 * L, { hl, taille: 16, epais: 2.2 })}</g>;
}
const Fleche = ({ x, y, h = 24 }) => (<g><line x1={x} y1={y} x2={x} y2={y + h - 8} stroke={NOIR} strokeWidth={2.4}/><polygon points={`${x},${y + h} ${x - 6},${y + h - 10} ${x + 6},${y + h - 10}`} fill={NOIR}/></g>);
const nbc = id => squelette(MOLS[id]).nC;
const idxLiaison = (id, a, b) => MOLS[id].liaisons.findIndex(([i, j]) => (i === a && j === b) || (i === b && j === a));

// 1. Allonger d'un carbone : G1 puis G2
export function SvgCarteAllonger() {
  const lignes = [{ id: 'BrEt', y: 6 }, { id: 'PrCN', y: 112, hl: { liaisons: [idxLiaison('PrCN', 1, 2)], anneaux: [2] } }, { id: 'PrNH2', y: 218 }];
  const fl = [{ y: 82, t: 'G1 : ions cyanure CN⁻' }, { y: 188, t: 'G2 : LiAlH₄' }];
  return (
    <Cadre h={300} aria="Allonger la chaîne d'un atome de carbone : le bromoéthane, 2 atomes de carbone, devient le propanenitrile, 3 atomes de carbone, avec une nouvelle liaison C–C, grâce aux ions cyanure ; puis la réduction du nitrile donne une amine qui garde 3 atomes de carbone.">
      {lignes.map(l => (
        <g key={l.id}>
          <rect x={4} y={l.y} width={312} height={76} rx={10} fill={l.hl ? '#fff7ed' : '#f8fafc'} stroke={l.hl ? ORANGE : '#94a3b8'} strokeWidth={l.hl ? 2.6 : 1.6}/>
          <MolDansCarte id={l.id} bx={10} by={l.y + 3} bw={134} bh={70} hl={l.hl} L={l.id === 'EtMgBr' ? 37 : 32}/>
          <T x={152} y={l.y + 34} gras>{MOLS[l.id].nom}</T>
          <T x={152} y={l.y + 56} couleur={l.hl ? ORANGE : GRIS} gras={!!l.hl}>{nbc(l.id)} atomes de C</T>
        </g>))}
      {fl.map(f => (<g key={f.y}><Fleche x={50} y={f.y} h={30}/><T x={66} y={f.y + 21} couleur={GRIS}>{f.t}</T></g>))}
    </Cadre>);
}
// 2. Organomagnésien : R–Br → R–MgBr → alcool
export function SvgCarteOrganoMg() {
  const lignes = [{ id: 'BrEt', y: 6 }, { id: 'EtMgBr', y: 112 }, { id: 'Bu2ol', y: 218, hl: { liaisons: [idxLiaison('Bu2ol', 1, 2)], anneaux: [2] } }];
  const fl = [{ y: 82, t: 'G3 : Mg, éther anhydre' }, { y: 188, t: 'G4 : éthanal, puis eau' }];
  return (
    <Cadre h={318} aria="Organomagnésien : le bromoéthane, 2 atomes de carbone, donne l'organomagnésien avec le magnésium, toujours 2 atomes de carbone ; l'organomagnésien réagit avec l'éthanal puis l'eau et donne le butan-2-ol, 4 atomes de carbone, avec une nouvelle liaison C–C.">
      {lignes.map(l => (
        <g key={l.id}>
          <rect x={4} y={l.y} width={312} height={l.id === 'Bu2ol' ? 94 : 76} rx={10} fill={l.hl ? '#fff7ed' : '#f8fafc'} stroke={l.hl ? ORANGE : '#94a3b8'} strokeWidth={l.hl ? 2.6 : 1.6}/>
          <MolDansCarte id={l.id} bx={10} by={l.y + 3} bw={134} bh={l.id === 'Bu2ol' ? 88 : 70} hl={l.hl} L={l.id === 'EtMgBr' ? 37 : 32}/>
          <T x={152} y={l.y + (l.id === 'Bu2ol' ? 42 : 34)} gras>{l.id === 'EtMgBr' ? 'organomagnésien' : MOLS[l.id].nom}</T>
          <T x={152} y={l.y + (l.id === 'Bu2ol' ? 64 : 56)} couleur={l.hl ? ORANGE : GRIS} gras={!!l.hl}>{nbc(l.id)} atomes de C</T>
        </g>))}
      {fl.map(f => (<g key={f.y}><Fleche x={50} y={f.y} h={30}/><T x={66} y={f.y + 21} couleur={GRIS}>{f.t}</T></g>))}
    </Cadre>);
}
// 3. Ramifier : éthanal (chaîne droite) ou propanone (chaîne ramifiée)
export function SvgCarteRamifier() {
  const lignes = [
    { id: 'Bu2ol', y: 6, t1: 'avec l’éthanal', t2: 'chaîne non ramifiée', hl: { liaisons: [idxLiaison('Bu2ol', 1, 2)], anneaux: [] } },
    { id: 'MBu2ol', y: 112, t1: 'avec la propanone', t2: 'chaîne ramifiée', hl: { liaisons: [idxLiaison('MBu2ol', 1, 2)], anneaux: [2] } },
  ];
  return (
    <Cadre h={222} aria="Ramifier : avec l'éthanal, l'organomagnésien donne le butan-2-ol, une chaîne non ramifiée ; avec la propanone, il donne le 2-méthylbutan-2-ol, où un atome de carbone est lié à trois autres atomes de carbone : la chaîne est ramifiée.">
      {lignes.map(l => (
        <g key={l.id}>
          <rect x={4} y={l.y} width={312} height={100} rx={10} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.6}/>
          <MolDansCarte id={l.id} bx={10} by={l.y + 4} bw={140} bh={92} hl={l.hl}/>
          <T x={156} y={l.y + 38} gras>{l.t1}</T>
          <T x={156} y={l.y + 60}>{nbc(l.id)} atomes de C</T>
          <T x={156} y={l.y + 82} couleur={l.id === 'MBu2ol' ? ORANGE : GRIS} gras={l.id === 'MBu2ol'}>{l.t2}</T>
        </g>))}
    </Cadre>);
}
// 4. Raccourcir : coupure oxydante
export function SvgCarteRaccourcir() {
  return (
    <Cadre h={238} aria="Raccourcir : la coupure oxydante du but-2-ène, 4 atomes de carbone, coupe la liaison C=C et donne deux molécules d'acide éthanoïque de 2 atomes de carbone chacune.">
      <rect x={4} y={6} width={312} height={76} rx={10} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.6}/>
      <MolDansCarte id="But2ene" bx={10} by={10} bw={130} bh={68} hl={{ liaisons: [idxLiaison('But2ene', 1, 2)], anneaux: [] }}/>
      <T x={150} y={36} gras>but-2-ène</T><T x={150} y={60}>4 atomes de C</T>
      <Fleche x={50} y={86} h={30}/><T x={66} y={106} couleur={GRIS}>G7 : oxydant en excès</T>
      <rect x={4} y={122} width={312} height={108} rx={10} fill="#fff7ed" stroke={ORANGE} strokeWidth={2.6}/>
      <MolDansCarte id="AcEt" bx={8} by={126} bw={92} bh={64}/>
      <T x={104} y={168} ancre="middle" gras taille={22}>+</T>
      <MolDansCarte id="AcEt" bx={108} by={126} bw={92} bh={64}/>
      <T x={198} y={152} gras>2 molécules</T><T x={198} y={174}>2 C chacune</T>
      <T x={160} y={216} ancre="middle" couleur={ORANGE} gras>4 atomes de C → 2 + 2</T>
    </Cadre>);
}
// 5. Les trois types de réactions de la banque
export function SvgCarteTypes() {
  const lignes = [
    { y: 6, nom: 'substitution', indice: 'un groupe en remplace un autre', ex: 'G1 (CN⁻ remplace Br)' },
    { y: 72, nom: 'addition', indice: 'deux groupes se fixent sur C=O', ex: 'G4, G5' },
    { y: 138, nom: 'oxydo-réduction', indice: 'un oxydant, un réducteur ou Mg', ex: 'G2, G3, G6, G7' },
  ];
  return (
    <Cadre h={206} aria="Les trois types de réactions de la banque : substitution (un groupe en remplace un autre, G1), addition (deux groupes se fixent, G4 et G5), oxydo-réduction (un oxydant, un réducteur ou le métal magnésium, G2, G3, G6, G7).">
      {lignes.map(l => (
        <g key={l.nom}>
          <rect x={4} y={l.y} width={312} height={60} rx={10} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.6}/>
          <T x={14} y={l.y + 22} gras>{l.nom}</T>
          <T x={14} y={l.y + 42} couleur={GRIS}>{l.indice}</T>
          <T x={306} y={l.y + 22} ancre="end" couleur={BLEU} gras>{l.ex}</T>
        </g>))}
    </Cadre>);
}
// 6. Bilan : effet de chaque réaction sur le squelette
export function SvgCarteBilan() {
  const points = (n, x, y, nouveaux = []) => Array.from({ length: n }, (_, i) => <circle key={i} cx={x + i * 12} cy={y} r={4.8} fill={nouveaux.includes(i) ? '#fff' : NOIR} stroke={nouveaux.includes(i) ? ORANGE : NOIR} strokeWidth={nouveaux.includes(i) ? 2.6 : 1}/>);
  const lignes = [
    { y: 6, nom: 'inchangé', reac: 'G2, G3, G6', a: 3, b: 3, nouveaux: [] },
    { y: 62, nom: 'allongé', reac: 'G1 (+1 C), G4 (+2 C)', a: 2, b: 4, nouveaux: [2, 3] },
    { y: 118, nom: 'allongé, ramifié', reac: 'G5 (+3 C)', a: 2, b: 5, nouveaux: [2, 3, 4] },
    { y: 174, nom: 'raccourci', reac: 'G7 (4 C → 2 + 2)', a: 4, b: 2, nouveaux: [] },
  ];
  return (
    <Cadre h={232} aria="Effet des réactions sur le squelette carboné : inchangé (G2, G3, G6), allongé (G1 d'un atome de carbone, G4 de deux), allongé et ramifié (G5), raccourci (G7).">
      {lignes.map(l => (
        <g key={l.nom}>
          <rect x={4} y={l.y} width={312} height={50} rx={10} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.6}/>
          <T x={14} y={l.y + 22} gras>{l.nom}</T>
          <T x={14} y={l.y + 42} couleur={GRIS}>{l.reac}</T>
          {points(l.a, 204, l.y + 25)}
          <text x={204 + l.a * 12 + 2} y={l.y + 31} fontSize={16} fill={NOIR}>→</text>
          {points(l.b, 204 + l.a * 12 + 24, l.y + 25, l.nouveaux)}
        </g>))}
    </Cadre>);
}
export { NOM_PARTENAIRE };
