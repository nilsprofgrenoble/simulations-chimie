// ====================================================
//  Schémas de la simulation 186 (mécanismes réactionnels, TG).
//  Règles : schémas de Lewis dessinés par le moteur ci-dessous à partir des états de mrxModele.js (validés par mrxModele.test.mjs) ;
//  flèches courbes tracées DANS la scène (départ : doublet ou liaison ; arrivée : atome) ; textes de 16 minimum dans un viewBox de 420 (cartes : 14 dans un viewBox de 320) ;
//  jamais la couleur seule (lettres des atomes, tirets pour l'espèce lacunaire, formes différentes pour A et B) ; width 100 %, maxWidth 480 (cartes 320), centrés.
// ====================================================
import { useRef, useState } from 'react';
import { avecIndices, KIT, stylePetitBouton } from '../commun';
import { chargeFormelle, voisins, cleFleche, verifierFleches, normaliserTracees, plageX } from './mrxModele';
import { BOITE } from './mrxChocs';

const ROUGE = '#b91c1c', BLEU = '#1d4ed8', ENCRE = '#0f172a', GRIS = '#64748b';
const COUL_EL = { C: '#111827', H: '#475569', O: '#b91c1c', Br: '#92400e', Cl: '#166534' };
const R_ATOME = 12, DIST_LP = 19, DIST_ANCRE_LP = 27;
const dir = ang => [Math.cos(ang * Math.PI / 180), -Math.sin(ang * Math.PI / 180)];
const arr = x => Math.round(x * 10) / 10;
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8 };
const stlCarte = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

// ---------- géométrie des flèches ----------
function pointDepart(etat, de) {
  if (de.lp) { const a = etat.atomes[de.lp], [dx, dy] = dir(a.lp[de.k]); return [a.x + DIST_ANCRE_LP * dx, a.y + DIST_ANCRE_LP * dy]; }
  const a = etat.atomes[de.liaison[0]], b = etat.atomes[de.liaison[1]];
  return [(a.x + b.x) / 2, (a.y + b.y) / 2];
}
function cheminFleche(p0, p1, courbure) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, nx = dy / L, ny = -dx / L;
  const c = [(p0[0] + p1[0]) / 2 + courbure * L * nx, (p0[1] + p1[1]) / 2 + courbure * L * ny];
  const tx = p1[0] - c[0], ty = p1[1] - c[1], T = Math.hypot(tx, ty) || 1;
  return { c, tete: [tx / T, ty / T], L, milieu: [(p0[0] + 2 * c[0] + p1[0]) / 4, (p0[1] + 2 * c[1] + p1[1]) / 4], n: [nx, ny] };
}
function geomFleche(etat, f) {
  let p0 = pointDepart(etat, f.de); const t = etat.atomes[f.vers.atome];
  // liaison qui se rompt au profit d'un de ses atomes : la queue de la flèche est prise sur la liaison, du côté de l'autre atome (flèche plus lisible)
  if (f.de.liaison && f.de.liaison.includes(f.vers.atome)) { const o = etat.atomes[f.de.liaison.find(x => x !== f.vers.atome)]; p0 = [t.x + (o.x - t.x) * 0.62, t.y + (o.y - t.y) * 0.62]; }
  const fin = f.vers.fin != null ? f.vers.fin : (() => { const dx = p0[0] - t.x, dy = p0[1] - t.y; return Math.atan2(-dy, dx) * 180 / Math.PI; })();
  const [ex, ey] = dir(fin), p1 = [t.x + 17 * ex, t.y + 17 * ey];
  const g = cheminFleche(p0, p1, f.courbure != null ? f.courbure : 0.35);
  return { p0, p1, ...g };
}
// Flèche courbe à pointe pleine (utilisée dans la scène et dans les cartes)
export function FlecheCourbe({ p0, p1, courbure = 0.35, couleur = ROUGE, w = 2.6, tete = 10, num }) {
  const g = cheminFleche(p0, p1, courbure), [ux, uy] = g.tete, bx = p1[0] - ux * tete, by = p1[1] - uy * tete;
  const pts = `${arr(p1[0])},${arr(p1[1])} ${arr(bx - uy * 4.6)},${arr(by + ux * 4.6)} ${arr(bx + uy * 4.6)},${arr(by - ux * 4.6)}`;
  return (
    <g>
      <path d={`M ${arr(p0[0])} ${arr(p0[1])} Q ${arr(g.c[0])} ${arr(g.c[1])} ${arr(bx)} ${arr(by)}`} fill="none" stroke={couleur} strokeWidth={w} strokeLinecap="round"/>
      <polygon points={pts} fill={couleur} stroke={couleur} strokeWidth={1} strokeLinejoin="round"/>
      {num != null && <text x={arr(g.milieu[0] + g.n[0] * 14 * Math.sign(courbure || 1))} y={arr(g.milieu[1] + g.n[1] * 14 * Math.sign(courbure || 1) + 6)} fontSize={18} fontWeight={800} fill={couleur} textAnchor="middle" stroke="#fff" strokeWidth={3.5} paintOrder="stroke">{num}</text>}
    </g>);
}

// ---------- angle libre autour d'un atome (charge, δ) ----------
function angleLibre(etat, id, extra = []) {
  const a = etat.atomes[id], occ = [...a.lp, ...extra];
  voisins(etat, id).forEach(v => { const b = etat.atomes[v]; occ.push(Math.atan2(-(b.y - a.y), b.x - a.x) * 180 / Math.PI); });
  let meilleur = 45, score = -1;
  for (let ang = 0; ang < 360; ang += 15) {
    const ecart = Math.min(...occ.map(o => { const d = Math.abs(((ang - o) % 360 + 540) % 360 - 180); return d; }), 180);
    const [dx, dy] = dir(ang), px = a.x + 24 * dx, py = a.y + 24 * dy;
    const gene = Object.entries(etat.atomes).some(([k, b]) => k !== id && Math.hypot(b.x - px, b.y - py) < 20);
    const s = gene ? -1 : ecart - Math.abs(((ang - 60) % 360 + 540) % 360 - 180) * 0.15;   // légère préférence pour le haut à droite
    if (s > score) { score = s; meilleur = ang; }
  }
  return meilleur;
}

// ---------- scène d'un état ----------
function etendue(etat, fleches = []) {
  let minY = 1e9, maxY = -1e9;
  Object.values(etat.atomes).forEach(a => { minY = Math.min(minY, a.y - 28); maxY = Math.max(maxY, a.y + 28); });
  fleches.forEach(f => { const g = geomFleche(etat, f); const py = (g.p0[1] + 2 * g.c[1] + g.p1[1]) / 4; minY = Math.min(minY, py - 18); maxY = Math.max(maxY, py + 12); });
  return [Math.floor(minY), Math.ceil(maxY + 34)];
}
function candidats(etat) {
  const c = [];
  Object.entries(etat.atomes).forEach(([id, a]) => {
    c.push({ type: 'atome', id, x: a.x, y: a.y });
    a.lp.forEach((ang, k) => { const [dx, dy] = dir(ang); c.push({ type: 'lp', atome: id, k, x: a.x + DIST_ANCRE_LP * dx, y: a.y + DIST_ANCRE_LP * dy }); });
  });
  etat.liaisons.forEach(([a, b]) => { const A = etat.atomes[a], B = etat.atomes[b]; c.push({ type: 'liaison', a, b, x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }); });
  return c;
}
const MOTS_DIR = ['à droite', 'en haut à droite', 'en haut', 'en haut à gauche', 'à gauche', 'en bas à gauche', 'en bas', 'en bas à droite'];
const dirMot = ang => MOTS_DIR[Math.round((((ang % 360) + 360) % 360) / 45) % 8];
const angleVers = (a, b) => Math.atan2(-(b.y - a.y), b.x - a.x) * 180 / Math.PI;
// nom lisible et UNIQUE de chaque atome (menus alternatifs : jamais deux libellés identiques)
function nomsUniques(etat) {
  const base = {};
  Object.entries(etat.atomes).forEach(([id, a]) => { const esp = etat.especes.find(e => e.ids.includes(id)); base[id] = (etat.noms && etat.noms[id]) || `${a.el} de ${esp ? esp.f : '?'}`; });
  const comptes = {}; Object.values(base).forEach(n => { comptes[n] = (comptes[n] || 0) + 1; });
  const noms = {};
  Object.entries(etat.atomes).forEach(([id, a]) => {
    if (comptes[base[id]] === 1) { noms[id] = base[id]; return; }
    const v = voisins(etat, id)[0], ref = v ? etat.atomes[v] : null;
    noms[id] = ref ? `${base[id]} (${dirMot(angleVers(ref, a))} de ${etat.atomes[v].el})` : base[id];
  });
  const c2 = {}; Object.values(noms).forEach(n => { c2[n] = (c2[n] || 0) + 1; });
  const vus = {};
  Object.keys(noms).forEach(id => { if (c2[noms[id]] > 1) { vus[noms[id]] = (vus[noms[id]] || 0) + 1; noms[id] += ` n°${vus[noms[id]]}`; } });
  return noms;
}
function nomAtome(etat, id) { return nomsUniques(etat)[id]; }

export function SceneActe({ etat, fleches = [], delta = false, mode = null, selection = null, onChoix, aria, legendeEspeces = true, tailleMax = 480, plage = null }) {
  const ref = useRef(null);
  const [y0, y1] = etendue(etat, fleches), H = y1 - y0;
  const [x0, x1] = plage || plageX({ avant: etat, apres: etat }), W = Math.max(280, x1 - x0), X0 = Math.min(x0, (x0 + x1) / 2 - W / 2);
  const cand = mode ? candidats(etat) : [];
  const onDown = e => {
    if (!mode || !onChoix) return;
    const r = ref.current.getBoundingClientRect(), x = X0 + (e.clientX - r.left) * W / r.width, y = y0 + (e.clientY - r.top) * H / r.height;
    let best = null, d0 = 1e9;
    cand.forEach(c => {
      const bonus = c.type === 'atome' ? (mode === 'destination' ? 0 : 6) : (mode === 'origine' ? 0 : 6);
      const d = Math.hypot(c.x - x, c.y - y) + bonus; if (d < d0) { d0 = d; best = c; }
    });
    if (best && d0 <= 30) onChoix(best);
  };
  // espèces : boîtes englobantes pour les « + » et les formules
  const boites = etat.especes.map(esp => {
    const pts = esp.ids.map(id => etat.atomes[id]);
    return { esp, x0: Math.min(...pts.map(p => p.x)) - 26, x1: Math.max(...pts.map(p => p.x)) + 26, y1: Math.max(...pts.map(p => p.y)) + 26, yc: pts.reduce((s, p) => s + p.y, 0) / pts.length };
  }).sort((a, b) => a.x0 - b.x0);
  const yEtiq = Math.max(...boites.map(b => b.y1)) + 18;
  return (
    <svg ref={ref} viewBox={`${X0} ${y0} ${W} ${H}`} role="img" aria-label={aria || 'Schéma de Lewis des espèces de l’acte'} style={{ ...stl, maxWidth: Math.round(tailleMax * W / 420), touchAction: mode ? 'manipulation' : 'auto', cursor: mode ? 'pointer' : 'default' }} onPointerDown={onDown}>
      {/* liaisons */}
      {etat.liaisons.map(([a, b, o]) => {
        const A = etat.atomes[a], B = etat.atomes[b], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
        const x1 = A.x + ux * R_ATOME, y1 = A.y + uy * R_ATOME, x2 = B.x - ux * R_ATOME, y2 = B.y - uy * R_ATOME;
        const decs = o === 2 ? [-3.6, 3.6] : [0];
        return <g key={a + b}>{decs.map(d => <line key={d} x1={arr(x1 + nx * d)} y1={arr(y1 + ny * d)} x2={arr(x2 + nx * d)} y2={arr(y2 + ny * d)} stroke={ENCRE} strokeWidth={2.4} strokeLinecap="round"/>)}</g>;
      })}
      {/* doublets non liants */}
      {Object.entries(etat.atomes).map(([id, a]) => a.lp.map((ang, k) => {
        const [dx, dy] = dir(ang), cx = a.x + DIST_LP * dx, cy = a.y + DIST_LP * dy, px = -dy, py = dx;
        return <g key={id + k}><circle cx={arr(cx + px * 3.6)} cy={arr(cy + py * 3.6)} r={2.5} fill={ENCRE}/><circle cx={arr(cx - px * 3.6)} cy={arr(cy - py * 3.6)} r={2.5} fill={ENCRE}/></g>;
      }))}
      {/* lacunes */}
      {(etat.lacunes || []).map(l => { const a = etat.atomes[l.atome], [dx, dy] = dir(l.ang); return <rect key={l.atome} x={arr(a.x + 22 * dx - 7)} y={arr(a.y + 22 * dy - 7)} width={14} height={14} rx={2} fill="none" stroke={BLEU} strokeWidth={2} strokeDasharray="3.5 2.5"/>; })}
      {/* atomes */}
      {Object.entries(etat.atomes).map(([id, a]) => <text key={id} x={a.x} y={a.y} fontSize={19} fontWeight={800} fill={COUL_EL[a.el] || ENCRE} textAnchor="middle" dominantBaseline="central" stroke="#fff" strokeWidth={4} paintOrder="stroke">{a.el}</text>)}
      {/* charges formelles (signe dessiné : cercle + trait) */}
      {Object.keys(etat.atomes).map(id => {
        const q = chargeFormelle(etat, id); if (!q) return null;
        const a = etat.atomes[id], ang = angleLibre(etat, id, [...(etat.lacunes || []).filter(l => l.atome === id).map(l => l.ang), ...fleches.filter(f => f.vers.atome === id && f.vers.fin != null).map(f => f.vers.fin)]), [dx, dy] = dir(ang), cx = a.x + 25 * dx, cy = a.y + 25 * dy;
        return <g key={'q' + id}><circle cx={arr(cx)} cy={arr(cy)} r={8.5} fill="#fff" stroke={ENCRE} strokeWidth={1.8}/><line x1={arr(cx - 4.2)} y1={arr(cy)} x2={arr(cx + 4.2)} y2={arr(cy)} stroke={ENCRE} strokeWidth={2}/>{q > 0 && <line x1={arr(cx)} y1={arr(cy - 4.2)} x2={arr(cx)} y2={arr(cy + 4.2)} stroke={ENCRE} strokeWidth={2}/>}</g>;
      })}
      {/* polarisation des liaisons (charges partielles) */}
      {delta && Object.entries(etat.delta || {}).map(([id, s]) => {
        const a = etat.atomes[id], ang = (etat.deltaAng && etat.deltaAng[id] != null) ? etat.deltaAng[id] : angleLibre(etat, id, [...(etat.lacunes || []).map(l => l.ang), ...fleches.filter(f => f.vers.atome === id && f.vers.fin != null).map(f => f.vers.fin)]), [dx, dy] = dir(ang);
        return <text key={'d' + id} x={arr(a.x + 30 * dx)} y={arr(a.y + 30 * dy)} fontSize={17} fontWeight={700} fill={ENCRE} textAnchor="middle" dominantBaseline="central" stroke="#fff" strokeWidth={3.5} paintOrder="stroke">{'δ' + s}</text>;
      })}
      {/* « + » entre espèces et formules */}
      {boites.map((b, i) => <text key={'f' + i} x={arr((b.x0 + b.x1) / 2)} y={arr(yEtiq)} fontSize={17} fontWeight={700} fill={GRIS} textAnchor="middle">{legendeEspeces ? b.esp.f : ''}</text>)}
      {boites.slice(1).map((b, i) => <text key={'p' + i} x={arr((boites[i].x1 + b.x0) / 2)} y={arr((b.yc + boites[i].yc) / 2 + 8)} fontSize={24} fontWeight={700} fill={GRIS} textAnchor="middle">+</text>)}
      {/* anneaux des éléments sur lesquels on peut cliquer */}
      {mode && cand.filter(c => (mode === 'origine' ? (c.type === 'lp' || c.type === 'liaison') : c.type === 'atome')).map((c, i) => <circle key={i} cx={arr(c.x)} cy={arr(c.y)} r={mode === 'origine' ? 9 : 14} fill="rgba(245,163,26,0.10)" stroke="#94a3b8" strokeWidth={1.4} strokeDasharray="3 3" pointerEvents="none"/>)}
      {selection && (() => { const p = selection.type === 'lp' ? pointDepart(etat, { lp: selection.atome, k: selection.k }) : pointDepart(etat, { liaison: [selection.a, selection.b] }); return <circle cx={arr(p[0])} cy={arr(p[1])} r={13} fill="none" stroke="#f59e0b" strokeWidth={3.5} pointerEvents="none"/>; })()}
      {/* flèches courbes */}
      {fleches.map((f, i) => { const g = geomFleche(etat, f); return <FlecheCourbe key={i} p0={g.p0} p1={g.p1} courbure={f.courbure != null ? f.courbure : 0.35} num={fleches.length > 1 ? i + 1 : null}/>; })}
    </svg>);
}

// ---------- atelier : tracer les flèches d'un acte ----------
const flecheDe = (etat, c) => (c.type === 'lp' ? { lp: c.atome, k: c.k } : { liaison: [c.a, c.b] });
function nouvelleFleche(etat, origine, dest) {
  const de = flecheDe(etat, origine), p0 = pointDepart(etat, de), t = etat.atomes[dest.id];
  const dx = t.x - p0[0], dy = t.y - p0[1], L = Math.hypot(dx, dy) || 1;
  const courbure = dx >= 0 ? 0.4 : -0.4;   // bombée vers le haut de l'écran
  const via = de.liaison ? (() => { const [a, b] = de.liaison, A = etat.atomes[a], B = etat.atomes[b]; return Math.hypot(A.x - t.x, A.y - t.y) < Math.hypot(B.x - t.x, B.y - t.y) ? a : b; })() : undefined;
  return { de, vers: { atome: dest.id, ...(via ? { via } : {}) }, courbure };
}
const libelleOrigine = (etat, c) => (c.type === 'lp' ? `doublet non liant ${dirMot(etat.atomes[c.atome].lp[c.k])} de ${nomAtome(etat, c.atome)}` : `liaison entre ${nomAtome(etat, c.a)} et ${nomAtome(etat, c.b)}`);

export function AtelierFleches({ acte, tracees, setTracees, bloque = false, retourImmediat = true, etat = null }) {
  const E = etat || acte.avant;
  const [orig, setOrig] = useState(null);
  const [msg, setMsg] = useState('');
  const [menuO, setMenuO] = useState(''), [menuD, setMenuD] = useState('');
  const cands = candidats(E), origines = cands.filter(c => c.type === 'lp' || c.type === 'liaison'), atomes = cands.filter(c => c.type === 'atome');
  const ajouter = (o, d) => {
    const f = nouvelleFleche(E, o, d), cle = cleFleche(f);
    if (tracees.some(t => cleFleche(t) === cle)) { setMsg('Cette flèche est déjà tracée.'); return; }
    const suite = [...tracees, f]; setTracees(suite);
    if (retourImmediat) {
      const v = verifierFleches(acte, suite), attendues = acte.fleches.map(cleFleche), n = normaliserTracees(acte, suite);
      if (v.ok) setMsg('');
      else if (n.incoherent) setMsg(v.messages[0]);
      else if (!attendues.includes(cleFleche(n.tr[n.tr.length - 1]))) setMsg(verifierFleches(acte, [f]).messages[0] || 'Cette flèche n\'est pas la bonne.');
      else setMsg('Cette flèche est bonne. Il en manque une : tout doublet déplacé a sa flèche.');
    } else setMsg('');
  };
  const choix = c => {
    if (bloque) return;
    if (!orig) {
      if (c.type === 'atome') { setMsg('Une flèche courbe part d\'un doublet (deux points) ou d\'une liaison, jamais d\'un atome. Touche d\'abord le début de la flèche.'); return; }
      setOrig(c); setMsg(''); return;
    }
    if (c.type !== 'atome') {
      if (c.type === orig.type && c.x === orig.x && c.y === orig.y) { setOrig(null); return; }
      setOrig(c); setMsg(''); return;   // l'élève change d'avis : nouveau départ
    }
    ajouter(orig, c); setOrig(null);
  };
  const consigne = bloque ? '' : orig ? `Départ choisi : ${libelleOrigine(E, orig)}. Touche maintenant l’atome d’arrivée.` : 'Touche le début de la flèche (un doublet non liant ou une liaison), puis son arrivée (un atome).';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SceneActe etat={E} fleches={tracees} delta plage={plageX(acte)} mode={bloque ? null : (orig ? 'destination' : 'origine')} selection={orig} onChoix={choix} aria={'Schéma de l’acte : touche un doublet ou une liaison, puis un atome pour tracer une flèche courbe'}/>
      <div role="status" aria-live="polite" style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, minHeight: 21 }}>{avecIndices(consigne)}</div>
      {msg && <div role="alert" style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '5px 8px', lineHeight: 1.5 }}>{avecIndices(msg)}</div>}
      {!bloque && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => { setTracees(tracees.slice(0, -1)); setOrig(null); setMsg(''); }} disabled={!tracees.length} style={{ ...stylePetitBouton(false), opacity: tracees.length ? 1 : 0.5 }}>Annuler la dernière flèche</button>
        <button type="button" onClick={() => { setTracees([]); setOrig(null); setMsg(''); }} disabled={!tracees.length} style={{ ...stylePetitBouton(false), opacity: tracees.length ? 1 : 0.5 }}>Tout effacer</button>
      </div>}
      {!bloque && <details style={{ fontSize: 13.5, color: KIT.txt }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: KIT.txt2 }}>Tracer avec des menus (clavier, lecteur d’écran)</summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          <label>Début de la flèche
            <select value={menuO} onChange={e => setMenuO(e.target.value)} style={{ display: 'block', width: '100%', minHeight: 42, fontSize: 14, marginTop: 2 }}>
              <option value="">Choisir…</option>
              {origines.map((c, i) => <option key={i} value={i}>{libelleOrigine(E, c)}</option>)}
            </select></label>
          <label>Arrivée de la flèche
            <select value={menuD} onChange={e => setMenuD(e.target.value)} style={{ display: 'block', width: '100%', minHeight: 42, fontSize: 14, marginTop: 2 }}>
              <option value="">Choisir…</option>
              {atomes.map((c, i) => <option key={i} value={i}>{nomAtome(E, c.id)}</option>)}
            </select></label>
          <button type="button" disabled={menuO === '' || menuD === ''} onClick={() => { ajouter(origines[+menuO], atomes[+menuD]); setMenuO(''); setMenuD(''); }} style={{ ...stylePetitBouton(true, '#0284c7'), alignSelf: 'flex-start', opacity: menuO === '' || menuD === '' ? 0.5 : 1 }}>Tracer cette flèche</button>
        </div>
      </details>}
    </div>);
}

// ====================================================
//  SCÈNE DES CHOCS (animation) : disques A (cercle) et B (carré arrondi), chocs efficaces entourés
// ====================================================
const ECH = 2.6, MX = 6, MY = 6;
export function SceneChocs({ boite, anneaux, eff = true }) {
  const W = BOITE.L * ECH + 2 * MX, H = BOITE.H * ECH + 2 * MY;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Boîte contenant des entités A (cercles) et B (carrés arrondis) en mouvement ; les chocs efficaces sont entourés" style={{ ...stl, border: '1px solid #cbd5e1' }}>
      <rect x={MX} y={MY} width={BOITE.L * ECH} height={BOITE.H * ECH} fill="#f8fafc" stroke="#94a3b8" strokeWidth={2}/>
      {boite.P.map((p, i) => {
        const x = MX + p.x * ECH, y = MY + p.y * ECH, r = BOITE.R * ECH * 1.08;
        return p.type === 'A'
          ? <g key={i}><circle cx={arr(x)} cy={arr(y)} r={arr(r)} fill="#dbeafe" stroke={BLEU} strokeWidth={2}/><text x={arr(x)} y={arr(y)} fontSize={16} fontWeight={800} fill={BLEU} textAnchor="middle" dominantBaseline="central">A</text></g>
          : <g key={i}><rect x={arr(x - r * 0.92)} y={arr(y - r * 0.92)} width={arr(r * 1.84)} height={arr(r * 1.84)} rx={4} fill="#ffedd5" stroke="#c2410c" strokeWidth={2}/><text x={arr(x)} y={arr(y)} fontSize={16} fontWeight={800} fill="#9a3412" textAnchor="middle" dominantBaseline="central">B</text></g>;
      })}
      {anneaux.map((a, i) => {
        const x = MX + a.x * ECH, y = MY + a.y * ECH, k = a.age;
        return a.eff && eff
          ? <g key={i} opacity={Math.max(0, 1 - k)}><circle cx={arr(x)} cy={arr(y)} r={arr(16 + 18 * k)} fill="none" stroke="#c2410c" strokeWidth={4}/><circle cx={arr(x)} cy={arr(y)} r={arr(10 + 12 * k)} fill="none" stroke="#c2410c" strokeWidth={2} strokeDasharray="4 3"/></g>
          : <circle key={i} cx={arr(x)} cy={arr(y)} r={arr(9 + 8 * k)} fill="none" stroke="#94a3b8" strokeWidth={2} opacity={Math.max(0, 0.9 - k)}/>;
      })}
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320, textes de 14 minimum)
// ====================================================
const Tc = ({ x, y, children, s = 16, w = 700, c = ENCRE, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Doublet = ({ x, y, ang = 0 }) => { const [dx, dy] = dir(ang), px = -dy, py = dx; return <g><circle cx={arr(x + px * 3.6)} cy={arr(y + py * 3.6)} r={2.6} fill={ENCRE}/><circle cx={arr(x - px * 3.6)} cy={arr(y - py * 3.6)} r={2.6} fill={ENCRE}/></g>; };

export function CarteFleche() {
  return (
    <svg viewBox="0 0 320 232" role="img" aria-label="Deux flèches courbes : l’une part d’un doublet non liant vers un site accepteur, l’autre part d’une liaison vers l’atome le plus électronégatif" style={stlCarte}>
      <Tc x={10} y={22} c={GRIS} s={16}>Départ : un doublet non liant</Tc>
      <text x={34} y={72} fontSize={22} fontWeight={800} fill={ROUGE} textAnchor="middle" dominantBaseline="central">A</text>
      <Doublet x={56} y={72} ang={0}/>
      <Tc x={20} y={108} s={15.5} c={GRIS}>doublet de A</Tc>
      <text x={230} y={72} fontSize={22} fontWeight={800} fill={ENCRE} textAnchor="middle" dominantBaseline="central">B</text>
      <text x={252} y={56} fontSize={16} fontWeight={700} fill={ENCRE}>δ+</text>
      <line x1={246} y1={72} x2={292} y2={72} stroke={ENCRE} strokeWidth={2.4}/>
      <text x={304} y={72} fontSize={22} fontWeight={800} fill={ENCRE} textAnchor="middle" dominantBaseline="central">X</text>
      <FlecheCourbe p0={[66, 62]} p1={[214, 62]} courbure={-0.38}/>
      <Tc x={190} y={108} s={15.5} c={GRIS}>site accepteur</Tc>
      <line x1={10} y1={122} x2={310} y2={122} stroke="#cbd5e1" strokeWidth={1.5}/>
      <Tc x={10} y={146} c={GRIS} s={16}>Départ : une liaison</Tc>
      <text x={62} y={196} fontSize={22} fontWeight={800} fill={ENCRE} textAnchor="middle" dominantBaseline="central">C</text>
      <text x={82} y={176} fontSize={16} fontWeight={700} fill={ENCRE}>δ+</text>
      <line x1={76} y1={196} x2={236} y2={196} stroke={ENCRE} strokeWidth={2.4}/>
      <text x={252} y={196} fontSize={22} fontWeight={800} fill={ENCRE} textAnchor="middle" dominantBaseline="central">Y</text>
      <text x={252} y={172} fontSize={16} fontWeight={700} fill={ENCRE} textAnchor="middle">δ−</text>
      <FlecheCourbe p0={[150, 194]} p1={[238, 186]} courbure={0.75}/>
      <Tc x={160} y={222} s={15.5} c={GRIS} a="middle">vers l’atome le plus électronégatif</Tc>
    </svg>);
}
const Boite = ({ x, y, w, h, t1, t2, tirets = false, fond = '#fff' }) => (
  <g><rect x={x} y={y} width={w} height={h} rx={9} fill={fond} stroke={ENCRE} strokeWidth={2.2} strokeDasharray={tirets ? '6 4' : undefined}/>
    <Tc x={x + w / 2} y={t2 ? y + h / 2 - 3 : y + h / 2 + 5} s={16} a="middle">{t1}</Tc>{t2 && <Tc x={x + w / 2} y={y + h / 2 + 15} s={15.5} w={600} c={GRIS} a="middle">{t2}</Tc>}</g>);
const Trait = ({ x1, y1, x2, y2, c = ENCRE, w = 2.4, dash }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, bx = x2 - ux * 9, by = y2 - uy * 9;
  return <g><line x1={x1} y1={y1} x2={arr(bx + ux * 1)} y2={arr(by + uy * 1)} stroke={c} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round"/><polygon points={`${x2},${y2} ${arr(bx - uy * 4.3)},${arr(by + ux * 4.3)} ${arr(bx + uy * 4.3)},${arr(by - ux * 4.3)}`} fill={c}/></g>;
};
export function CarteIntermediaire() {
  return (
    <svg viewBox="0 0 320 190" role="img" aria-label="Un intermédiaire réactionnel est formé par un acte puis consommé par l’acte suivant ; il n’apparaît pas dans le bilan" style={stlCarte}>
      <Boite x={4} y={52} w={76} h={46} t1="Réactifs"/>
      <Boite x={104} y={44} w={120} h={62} t1="Intermédiaire" t2="éphémère" tirets fond="#eff6ff"/>
      <Boite x={246} y={52} w={70} h={46} t1="Produits"/>
      <Trait x1={81} y1={75} x2={102} y2={75}/><Trait x1={225} y1={75} x2={244} y2={75}/>
      <Tc x={92} y={42} s={15.5} c={GRIS} a="middle">acte 1</Tc><Tc x={235} y={42} s={15.5} c={GRIS} a="middle">acte 2</Tc>
      <path d="M 48 110 Q 160 160 278 110" fill="none" stroke={ENCRE} strokeWidth={2.4} strokeDasharray="7 5"/>
      <Trait x1={268} y1={118} x2={278} y2={110} />
      <Tc x={160} y={178} s={16} a="middle">bilan : sans l’intermédiaire</Tc>
    </svg>);
}
export function CarteCatalyseur() {
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label="Le catalyseur est consommé au premier acte puis régénéré au dernier : il est présent au départ et à la fin, absent du bilan" style={stlCarte}>
      <Boite x={8} y={80} w={84} h={44} t1="acte 1"/>
      <Boite x={118} y={80} w={84} h={44} t1="acte 2"/>
      <Boite x={228} y={80} w={84} h={44} t1="acte 3"/>
      <Trait x1={93} y1={102} x2={116} y2={102}/><Trait x1={203} y1={102} x2={226} y2={102}/>
      <Trait x1={50} y1={42} x2={50} y2={78}/>
      <Tc x={8} y={30} s={16}>H₃O⁺ consommé</Tc>
      <Trait x1={270} y1={78} x2={270} y2={42}/>
      <Tc x={312} y={30} s={16} a="end">H₃O⁺ régénéré</Tc>
      <path d="M 270 148 Q 160 186 50 148" fill="none" stroke={ENCRE} strokeWidth={2.4} strokeDasharray="7 5"/>
      <Tc x={160} y={192} s={16} a="middle">au bilan : rien</Tc>
    </svg>);
}
export function CarteBilan() {
  const lignes = [['C₂H₄', '1', '0', '1', 'réactif'], ['H₃O⁺', '1', '1', '0', 'cata.'], ['C₂H₅⁺', '1', '1', '0', 'interm.'], ['C₂H₅OH₂⁺', '1', '1', '0', 'interm.'], ['H₂O', '2', '1', '1', 'réactif'], ['C₂H₅OH', '0', '1', '−1', 'produit']];
  return (
    <svg viewBox="0 0 320 236" role="img" aria-label="Tableau de comptage des espèces de l’hydratation : nombre de fois où chaque espèce est à gauche et à droite des trois actes ; ce qui reste donne le bilan" style={stlCarte}>
      <Tc x={6} y={20} s={15.5} c={GRIS}>espèce</Tc><Tc x={124} y={20} s={15.5} c={GRIS} a="middle">gauche</Tc><Tc x={186} y={20} s={15.5} c={GRIS} a="middle">droite</Tc><Tc x={240} y={20} s={15.5} c={GRIS} a="middle">reste</Tc>
      <line x1={6} y1={28} x2={314} y2={28} stroke="#94a3b8" strokeWidth={1.5}/>
      {lignes.map((l, i) => (
        <g key={i}>
          <Tc x={6} y={52 + i * 25} s={16}>{l[0]}</Tc>
          <Tc x={124} y={52 + i * 25} s={16} a="middle">{l[1]}</Tc><Tc x={186} y={52 + i * 25} s={16} a="middle">{l[2]}</Tc>
          <Tc x={240} y={52 + i * 25} s={16} a="middle">{l[3]}</Tc>
          <Tc x={314} y={52 + i * 25} s={15.5} w={600} c={GRIS} a="end">{l[4]}</Tc>
        </g>))}
      <line x1={6} y1={198} x2={314} y2={198} stroke="#94a3b8" strokeWidth={1.5}/>
      <Tc x={160} y={222} s={16} a="middle">bilan : C₂H₄ + H₂O → C₂H₅OH</Tc>
    </svg>);
}
const AA = ({ x, y }) => <g><circle cx={x} cy={y} r={13} fill="#dbeafe" stroke={BLEU} strokeWidth={2}/><text x={x} y={y} fontSize={16} fontWeight={800} fill={BLEU} textAnchor="middle" dominantBaseline="central">A</text></g>;
const BB = ({ x, y }) => <g><rect x={x - 12} y={y - 12} width={24} height={24} rx={5} fill="#ffedd5" stroke="#c2410c" strokeWidth={2}/><text x={x} y={y} fontSize={16} fontWeight={800} fill="#9a3412" textAnchor="middle" dominantBaseline="central">B</text></g>;
export function CarteFrequence() {
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label="Plus il y a d’entités B dans la boîte, plus les rencontres avec les entités A sont fréquentes" style={stlCarte}>
      <rect x={6} y={30} width={142} height={110} fill="#f8fafc" stroke="#94a3b8" strokeWidth={2}/>
      <AA x={34} y={58}/><AA x={112} y={104}/><AA x={60} y={112}/><BB x={96} y={54}/>
      <rect x={172} y={30} width={142} height={110} fill="#f8fafc" stroke="#94a3b8" strokeWidth={2}/>
      <AA x={200} y={58}/><AA x={278} y={104}/><AA x={226} y={112}/><BB x={262} y={54}/><BB x={206} y={86}/><BB x={248} y={82}/><BB x={292} y={64}/><BB x={284} y={126}/><BB x={192} y={124}/>
      <Tc x={77} y={22} s={16} a="middle">B peu concentré</Tc><Tc x={243} y={22} s={16} a="middle">B plus concentré</Tc>
      <Tc x={77} y={166} s={16} a="middle">peu de chocs</Tc><Tc x={243} y={166} s={16} a="middle">plus de chocs</Tc>
      <Tc x={160} y={192} s={16} a="middle" w={600} c={GRIS}>par seconde, A avec B</Tc>
    </svg>);
}
const Disque = ({ x, y, face }) => { const [dx, dy] = dir(face); const px = x + 12 * dx, py = y + 12 * dy;
  return <g><circle cx={x} cy={y} r={13} fill="#fff" stroke={ENCRE} strokeWidth={2.2}/><circle cx={arr(px)} cy={arr(py)} r={4.8} fill={ENCRE}/></g>; };
export function CarteEfficacite() {
  return (
    <svg viewBox="0 0 320 214" role="img" aria-label="Trois chocs : énergie trop faible, mauvaise orientation, puis choc efficace avec assez d’énergie et une bonne orientation" style={stlCarte}>
      {[0, 1, 2].map(k => <rect key={k} x={2 + k * 108} y={10} width={106} height={108} rx={8} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.8}/>)}
      {/* 1 : lent */}
      <Disque x={34} y={64} face={0}/><Disque x={78} y={64} face={180}/>
      <Trait x1={34} y1={32} x2={46} y2={32} w={2}/><Trait x1={78} y1={32} x2={66} y2={32} w={2}/>
      {/* 2 : rapide mais mal orienté */}
      <Disque x={138} y={64} face={90}/><Disque x={184} y={64} face={270}/>
      <Trait x1={118} y1={32} x2={140} y2={32} w={3.4}/><Trait x1={204} y1={32} x2={182} y2={32} w={3.4}/>
      {/* 3 : efficace */}
      <Disque x={242} y={64} face={0}/><Disque x={286} y={64} face={180}/>
      <Trait x1={224} y1={32} x2={246} y2={32} w={3.4}/><Trait x1={304} y1={32} x2={282} y2={32} w={3.4}/>
      <Tc x={55} y={96} s={15.5} a="middle">lent</Tc><Tc x={163} y={96} s={15.5} a="middle">mal orientés</Tc><Tc x={271} y={96} s={15.5} a="middle">bien orientés</Tc>
      <Tc x={56} y={142} s={16} a="middle">rebond</Tc><Tc x={161} y={142} s={16} a="middle">rebond</Tc><Tc x={264} y={142} s={16} a="middle">réaction</Tc>
      <Tc x={160} y={176} s={15.5} w={600} c={GRIS} a="middle">point noir : face qui doit toucher l’autre</Tc>
      <Tc x={160} y={202} s={16} a="middle">plus chaud : plus de chocs énergiques</Tc>
    </svg>);
}
