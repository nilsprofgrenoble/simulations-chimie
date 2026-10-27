import { useState, useEffect } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, ExempleResolu, Curseur, lireProgression } from "../commun";
import { scene, ORDRE_SCENES, echantillonner, caracteriser, ecartPoint, ecartAttendu, meilleurDt, norme, angle } from "./mvtRefModele";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 56 — RÉFÉRENTIEL ET MOUVEMENT (2GT, « Décrire un mouvement »)
//  Chronophotographies (positions fournies par un modèle) vues dans le référentiel de son choix :
//  trajectoire, vecteur vitesse approché par M_iM_{i+1}/Δt, variation Δv, influence du référentiel et de Δt,
//  modèle du point matériel. Parcours guidé avec exemples résolus, exploration libre, défis.
// ====================================================

const SIM = 56;
declarerDefis(SIM, [
  ['vitesse', 'Vitesse dans un autre référentiel'],
  ['trajectoire', 'Trajectoire et référentiel'],
  ['dt', 'Choisir l’intervalle Δt'],
]);

const Ind = ({ children }) => <sub>{children}</sub>;
const VERT = '#16a34a', ROUGE = '#dc2626', BLEU = '#2563eb', VIOLET = '#7c3aed', NOIR = '#0f172a', GRIS = '#64748b';

// ---------- mise en forme ----------
const nb = (x, d = 2) => { if (!isFinite(x)) return '—'; if (Math.abs(x) < 0.5 * 10 ** -d) x = 0; return x.toFixed(d).replace('.', ','); };
const nbA = x => (Math.abs(x) >= 100 ? nb(x, 0) : Math.abs(x) >= 10 ? nb(x, 1) : nb(x, 2));
const vir = s => String(s).replace('.', ',');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const NOMS_DIR = ['vers la droite', 'vers le haut et la droite', 'vers le haut', 'vers le haut et la gauche', 'vers la gauche', 'vers le bas et la gauche', 'vers le bas', 'vers le bas et la droite'];
const direction = v => (norme(v) < 1e-9 ? '—' : NOMS_DIR[Math.round(((angle(v) + 360) % 360) / 45) % 8]);
const nice = x => { const e = 10 ** Math.floor(Math.log10(x)), m = x / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; };

// ---------- état de l'exploration ----------
function initScene(id, extra = {}) {
  const S = scene(id, extra);
  return {
    scene: id, vA: extra.vA ?? 20, vB: extra.vB ?? 25,
    fG: 'sol', fD: S.frames.length > 1 ? S.frames[1].id : 'sol', cmp: false,
    dtIdx: Math.max(0, S.dts.indexOf(S.dtDef)), i: 4,
    obj: id === 'deux' ? 'B' : S.objets[0].id, vis: id === 'deux' ? S.objets.map(o => o.id) : [S.objets[0].id],
  };
}
const AFF0 = { v: false, ve: false, dv: false, org: false, sys: true };
const ICO_OBJ = { bille: '🔵', colis: '📦', avion: '✈️', A: '🚛', B: '🚗' };
const ICO_FRAME = { wagon: { mobile: '🚃' }, avion: { mobile: '✈️' }, deux: { A: '🚛', B: '🚗' }, freinage: { mobile: '🚆' } };
const icoF = (S, fid) => (ICO_FRAME[S.id] || {})[fid] ?? (fid === 'sol' ? '📍' : '');
const maj1 = t => t.charAt(0).toUpperCase() + t.slice(1);
const N_CORE = 7;      // les 7 premières étapes du parcours (affichage simple) ; les suivantes : « pour aller plus loin »
const PLACE = { sol: { wagon: 'sur le quai', avion: 'au sol', deux: 'au bord de la route', baton: 'au sol', freinage: 'sur le quai' },
  mobile: { wagon: 'dans le wagon', avion: 'dans l’avion', freinage: 'dans le train' }, A: { deux: 'dans le véhicule A' }, B: { deux: 'dans le véhicule B' } };
const place = (S, fid) => (PLACE[fid] || {})[S.id] || fid;
const PHR_TRAJ = { rectiligne: 'suit une ligne droite', courbe: 'suit une courbe' };
const PHR_MVT = { uniforme: 'à vitesse constante', accelere: 'de plus en plus vite', ralenti: 'de plus en plus lentement', quelconque: 'à vitesse variable' };

// ---------- dessin ----------
function Fleche({ x1, y1, x2, y2, col, w = 2.4, dash, op = 1 }) {
  const L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 2) return null;
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L, t = Math.min(8, L * 0.5), hw = 4, bx = x2 - ux * t, by = y2 - uy * t;
  return <g opacity={op}><line x1={x1} y1={y1} x2={bx} y2={by} stroke={col} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round"/>
    <path d={`M${x2},${y2} L${bx - uy * hw},${by + ux * hw} L${bx + uy * hw},${by - ux * hw} z`} fill={col}/></g>;
}

const PW = 520, PH = 300;

// Un référentiel vu de l'intérieur : trajectoires, positions successives, vecteurs vitesse, Δv au point étudié
function Panneau({ S, fid, data, visObjs, aff, i, sv, sel, titre, jusqua, simple }) {
  const F = S.frames.find(f => f.id === fid);
  const lanes = S.id === 'deux';
  const autres = S.frames.filter(f => f.id !== fid);
  const premier = data[visObjs[0].id], temps = premier.t;
  // positions des origines des autres référentiels, dans le référentiel F
  const orig = aff.org ? autres.map(g => ({ g, pts: temps.map(t => ({ x: g.O(t).x - F.O(t).x, y: g.O(t).y - F.O(t).y })) })) : [];
  // bâton : segments du système réel
  const batons = S.id === 'baton' && aff.sys ? (() => {
    const c = S.objets.find(o => o.id === 'centre');
    return temps.map(t => { const p = c.pos(t), th = c.th(t), o = F.O(t), h = c.longueur / 2;
      return { a: { x: p.x - o.x + h * Math.cos(th), y: p.y - o.y + h * Math.sin(th) }, b: { x: p.x - o.x - h * Math.cos(th), y: p.y - o.y - h * Math.sin(th) } }; });
  })() : [];
  // étendue du dessin
  const tous = [];
  visObjs.forEach(o => { data[o.id].p.forEach(q => tous.push(q)); data[o.id].pv.forEach(q => tous.push(q)); });
  orig.forEach(o => o.pts.forEach(q => tous.push(q)));
  batons.forEach(b => { tous.push(b.a); tous.push(b.b); });
  const x0 = Math.min(...tous.map(q => q.x)), x1 = Math.max(...tous.map(q => q.x)), y0 = Math.min(...tous.map(q => q.y)), y1 = Math.max(...tous.map(q => q.y));
  const bw = Math.max(x1 - x0, 1e-9), bh = Math.max(y1 - y0, 1e-9);
  const mx = 34, mt = 66, mb = 46, aw = PW - 2 * mx, ah = PH - mt - mb;
  const s = lanes || bh < 0.04 * bw ? aw / bw : Math.min(aw / bw, ah / bh);
  const usedW = bw * s, usedH = (lanes || bh < 0.04 * bw) ? 0 : bh * s;
  const ox = mx + (aw - usedW) / 2, oy = mt + (ah - usedH) / 2 + usedH;
  const X = x => ox + (x - x0) * s;
  const Y = (y, o) => (lanes ? mt + ah / 2 + ((o ? o.voie : 0) - 0.5) * 70 : oy - (y - y0) * s);
  const barre = nice(60 / s);          // barre d'échelle d'environ 60 px
  const arrondi = (q, o) => ({ x: X(q.x), y: Y(q.y, o) });
  const n = data[visObjs[0].id].n;
  const pas = Math.ceil((n + 1) / 12);
  const pp = data[visObjs[0].id].p, espace = Math.max(...pp.slice(1).map((q, j) => Math.hypot(q.x - pp[j].x, q.y - pp[j].y))) * s;
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img" aria-label={`Chronophotographie dans le référentiel ${F.nom}`}>
      <text x="10" y="20" fontSize="14" fontWeight="800" fill={NOIR}>{titre}</text>
      <text x="10" y="37" fontSize="12" fill={GRIS}>Dans ce point de vue, {F.nom} ne bouge pas.</text>
      {batons.map((b, j) => { if (j > jusqua) return null; const A = arrondi(b.a), B = arrondi(b.b); return <g key={`b${j}`}>
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx={A.x} cy={A.y} r="2.8" fill="#dc2626"/><circle cx={B.x} cy={B.y} r="2.8" fill="#0369a1"/></g>; })}
      {orig.map((o, ko) => <g key={o.g.id}>
        {o.pts.map((q, j) => { const P = arrondi(q); return <circle key={j} cx={P.x} cy={P.y} r="2.2" fill="none" stroke={VIOLET} strokeWidth="1.2" opacity="0.7"/>; })}
        {[0, i].map(j => { const P = arrondi(o.pts[j]); return <text key={j} x={P.x} y={P.y + 6} textAnchor="middle" fontSize="19">{icoF(S, o.g.id)}</text>; })}
        {(() => { const P = arrondi(o.pts[i]); const fin = P.x > PW * 0.6; return <text x={fin ? P.x - 14 : P.x + 14} y={Math.max(P.y - 4, 62) - ko * 13} textAnchor={fin ? 'end' : 'start'} fontSize="11.5" fill={VIOLET} fontWeight="700">{o.g.nom} (autre référentiel)</text>; })()}</g>)}
      {visObjs.map(o => { const E = data[o.id];
        return <g key={o.id}>
          {jusqua >= n && <polyline points={E.pv.map(q => { const P = arrondi(q, o); return `${P.x},${P.y}`; }).join(' ')} fill="none" stroke={o.col} strokeWidth="1" strokeDasharray="3 4" opacity="0.5"/>}
          {E.p.map((q, j) => { if (j > jusqua) return null; const P = arrondi(q, o); const estSel = !simple && o.id === sel && j === i;
            return <g key={j}>
              {estSel && <circle cx={P.x} cy={P.y} r="9" fill="none" stroke={NOIR} strokeWidth="1.6"/>}
              <circle cx={P.x} cy={P.y} r="3.8" fill={o.col}/>
              {j === (jusqua < n ? jusqua : 0) && ICO_OBJ[o.id] && <text x={P.x} y={P.y - 9} textAnchor="middle" fontSize="20">{ICO_OBJ[o.id]}</text>}
              {aff.v && j < E.v.length && (j % pas === 0 || (o.id === sel && (j === i || j === i - 1))) && (() => { const v = E.v[j];
                return <Fleche x1={P.x} y1={P.y} x2={P.x + v.x * sv} y2={P.y - v.y * sv} col={VERT} w={o.id === sel && j === i ? 3.2 : 2} op={o.id === sel && j === i - 1 ? 0.5 : 1} dash={o.id === sel && j === i - 1 ? '4 3' : undefined}/>; })()}
              {aff.ve && j < E.ve.length - 0 && (j % pas === 0) && (() => { const v = E.ve[j];
                return <Fleche x1={P.x} y1={P.y + 5} x2={P.x + v.x * sv} y2={P.y + 5 - v.y * sv} col={NOIR} w={1.4} dash="2 3" op={0.7}/>; })()}
              {o.id === sel && j === i && aff.dv && E.dv[i - 1] && (() => { const d = E.dv[i - 1];
                return <Fleche x1={P.x} y1={P.y} x2={P.x + d.x * sv} y2={P.y - d.y * sv} col={ROUGE} w={3.6}/>; })()}
            </g>; })}
          {(() => { const P = arrondi(E.p[i], o); return !simple && i <= jusqua && o.id === sel ? <text x={P.x + 11} y={P.y + 16} fontSize="12.5" fontWeight="800" fill={NOIR}>M<tspan fontSize="9" dy="3">{i}</tspan></text> : null; })()}
        </g>; })}
      {/* barre d'échelle des longueurs et des vitesses */}
      <g transform={`translate(12,${PH - 28})`}>
        <line x1="0" y1="0" x2={barre * s} y2="0" stroke={NOIR} strokeWidth="2"/><line x1="0" y1="-4" x2="0" y2="4" stroke={NOIR}/><line x1={barre * s} y1="-4" x2={barre * s} y2="4" stroke={NOIR}/>
        <text x={barre * s + 6} y="4" fontSize="11.5" fill={NOIR}>{vir(barre)} {S.U.L}{lanes ? ' (échelle horizontale)' : ''}</text>
        {aff.v && (() => { const vv = nice(40 / sv); return <g transform="translate(0,16)"><Fleche x1="0" y1="0" x2={vv * sv} y2="0" col={VERT} w={2.4}/>
          <text x={vv * sv + 6} y="4" fontSize="11.5" fill={VERT} fontWeight="700">{vir(vv)} {S.U.V}</text></g>; })()}
      </g>
      {espace < 6 && <text x={PW - 10} y="20" textAnchor="end" fontSize="12" fontWeight="700" fill="#b91c1c">points trop serrés</text>}
      <title>{F.nom}</title>
    </svg>);
}

// Construction de Δv = v_i − v_{i−1} dans l'espace des vitesses (origine commune)
function Construction({ E, i, titre }) {
  const W = 260, H = 190, a = E.v[i - 1], b = E.v[i], d = { x: b.x - a.x, y: b.y - a.y };
  const pts = [{ x: 0, y: 0 }, a, b];
  const x0 = Math.min(...pts.map(q => q.x)), x1 = Math.max(...pts.map(q => q.x)), y0 = Math.min(...pts.map(q => q.y)), y1 = Math.max(...pts.map(q => q.y));
  const m = 28, s = Math.min((W - 2 * m) / Math.max(x1 - x0, 1e-9), (H - 2 * m - 12) / Math.max(y1 - y0, 1e-9), 1e9);
  const sc = isFinite(s) ? s : 1, xc = (x0 + x1) / 2, yc = (y0 + y1) / 2;
  const X = x => W / 2 + (x - xc) * sc, Y = y => H / 2 + 6 - (y - yc) * sc;
  const nul = norme(d) < 1e-9;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 300, display: 'block', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }} role="img" aria-label="Construction de la variation du vecteur vitesse">
      <text x="8" y="16" fontSize="12" fontWeight="800" fill={NOIR}>{titre}</text>
      <circle cx={X(0)} cy={Y(0)} r="3.5" fill={NOIR}/>
      <Fleche x1={X(0)} y1={Y(0)} x2={X(a.x)} y2={Y(a.y)} col={VERT} w={2} dash="4 3" op={0.65}/>
      <Fleche x1={X(0)} y1={Y(0)} x2={X(b.x)} y2={Y(b.y)} col={VERT} w={3}/>
      {!nul && <Fleche x1={X(a.x)} y1={Y(a.y)} x2={X(b.x)} y2={Y(b.y)} col={ROUGE} w={3.6}/>}
      <text x={X(a.x) + 5} y={Y(a.y) - 6} fontSize="11" fill={VERT} fontWeight="700">v<tspan fontSize="8" dy="3">{i - 1}</tspan></text>
      <text x={X(b.x) + 5} y={Y(b.y) + 14} fontSize="11" fill={VERT} fontWeight="800">v<tspan fontSize="8" dy="3">{i}</tspan></text>
      {nul && <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ROUGE}>Δv = 0 : les deux flèches sont identiques</text>}
      {!nul && <text x={W - 8} y={H - 8} textAnchor="end" fontSize="11" fill={ROUGE} fontWeight="700">Δv<tspan fontSize="8" dy="3">{i}</tspan><tspan dy="-3"> = v</tspan><tspan fontSize="8" dy="3">{i}</tspan><tspan dy="-3"> − v</tspan><tspan fontSize="8" dy="3">{i - 1}</tspan></text>}
    </svg>);
}

// ---------- défis ----------
const tire = l => l[Math.floor(Math.random() * l.length)];
function nouveauDefi(type) {
  if (type === 'vitesse') {
    let vA, vB;
    do { vA = tire([10, 15, 20, 25, 30]); vB = tire([-30, -25, -20, -15, -10, 15, 20, 25, 30, 35]); } while (vB === vA);
    return { type, vA, vB, reps: {}, verifie: false };
  }
  if (type === 'trajectoire') {
    const sc = tire(['wagon', 'avion']), f1 = tire(['sol', 'mobile']), f2 = tire(['sol', 'mobile']);
    return { type, sc, f1, f2, reps: {}, verifie: false };
  }
  const sc = tire(['wagon', 'avion']);
  return { type: 'dt', sc, reps: {}, verifie: false };
}
const TITRES = { vitesse: 'Vitesse dans un autre référentiel', trajectoire: 'Trajectoire et référentiel', dt: 'Choisir Δt' };
const etatDefi = d => {
  if (d.type === 'vitesse') return { ...initScene('deux', { vA: d.vA, vB: d.vB }), cmp: false, obj: 'B', bruit: false };
  if (d.type === 'trajectoire') return { ...initScene(d.sc), cmp: true, bruit: false };
  return { ...initScene(d.sc), cmp: false, bruit: true };
};

function evaluer(d, dtChoisi) {
  if (d.type === 'vitesse') {
    const vrai = d.vB - d.vA, x = parseFloat(String(d.reps.v ?? '').replace(',', '.'));
    const okN = isFinite(x) && Math.abs(x - Math.abs(vrai)) <= 0.03 * Math.abs(vrai) + 0.2, okS = d.reps.sens === (vrai > 0 ? 'droite' : 'gauche');
    return { ok: okN && okS, lignes: [
      [okN, okN ? 'Norme correcte.' : `Norme : dans le référentiel de A, on retranche la vitesse de A : v_B/A = v_B − v_A (valeurs algébriques).`],
      [okS, okS ? 'Sens correct.' : 'Sens : comparez v_B − v_A à zéro (positif : vers la droite).']] };
  }
  if (d.type === 'trajectoire') {
    const S = scene(d.sc), obj = S.objets[0].id;
    const c1 = caracteriser(S, d.f1, obj).traj, h2 = Math.abs(S.objets[0].vit(0).x - S.frames.find(f => f.id === d.f2).V(0).x) > 1e-6;
    const ok1 = d.reps.traj === c1, ok2 = d.reps.horiz === (h2 ? 'oui' : 'non');
    return { ok: ok1 && ok2, lignes: [
      [ok1, ok1 ? 'Trajectoire correcte.' : 'Trajectoire : le référentiel du mobile se déplace avec la composante horizontale du mouvement.'],
      [ok2, ok2 ? 'Composante horizontale correcte.' : 'Composante horizontale : on retranche la vitesse du référentiel ; que reste-t-il ?']] };
  }
  const S = scene(d.sc), best = meilleurDt(S, 'sol', S.objets[0].id, S.sigmaDef);
  const ok = Math.abs(dtChoisi - best.dt) < 1e-9;
  return { ok, lignes: [[ok, ok ? 'C’est le Δt qui donne l’écart moyen le plus faible.' : 'Un autre Δt de la liste donne un écart moyen plus faible : essayez les autres valeurs et lisez l’écart moyen dans le tableau.']], best };
}

function VoletDefi({ defi, setDefi, changerType, dtChoisi }) {
  const res = defi.verifie ? evaluer(defi, dtChoisi) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, x) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: x }, verifie: false }));
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); };
  const choix = (k, options) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{options.map(([v, l]) =>
    <button key={v} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, '#0ea5e9')}>{l}</button>)}</div>;
  const txt = { fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{t}</div>;
  const S = defi.type === 'dt' || defi.type === 'trajectoire' ? scene(defi.sc) : null;
  const nomF = id => S.frames.find(f => f.id === id).nom;
  const solution = defi.solution;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'vitesse' && <>
        <div style={txt}><Pic n="target"/>Deux véhicules, A et B, roulent en ligne droite à vitesse constante dans le référentiel de la route (vitesses inconnues). Dans la chronophotographie, relevez la vitesse de chacun
          (norme et sens dans le tableau), puis calculez la <strong>vitesse de B dans le référentiel de A</strong>. Le positif est vers la droite.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14 }}>
          <span>Norme de la vitesse de B dans le référentiel de A :</span>
          <input value={defi.reps.v ?? ''} aria-label="Norme de la vitesse de B dans le référentiel de A" onChange={e => rep('v', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') verifier(); }}
            style={{ width: 80, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/><span>m/s</span></div>
        {q('Sens de cette vitesse')}{choix('sens', [['droite', 'vers la droite'], ['gauche', 'vers la gauche']])}
      </>}
      {defi.type === 'trajectoire' && <>
        <div style={txt}><Pic n="target"/>Observez {defi.sc === 'wagon' ? 'la bille lâchée dans le wagon' : 'le colis largué de l’avion'} dans les deux référentiels, puis répondez.</div>
        {q(`Dans le référentiel de ${nomF(defi.f1)}, la trajectoire est…`)}{choix('traj', [['rectiligne', 'rectiligne'], ['courbe', 'courbe']])}
        {q(`Dans le référentiel de ${nomF(defi.f2)}, la vitesse a-t-elle une composante horizontale (non nulle) ?`)}{choix('horiz', [['oui', 'oui'], ['non', 'non']])}
      </>}
      {defi.type === 'dt' && <>
        <div style={txt}><Pic n="target"/>{defi.sc === 'wagon' ? 'La bille lâchée dans le wagon' : 'Le colis largué de l’avion'}, pointé avec une erreur de {S.uniteSigma}. La vitesse en chaque point est approchée par M<Ind>i</Ind>M<Ind>i+1</Ind>/Δt.
          Choisissez, avec les boutons de Δt, la valeur pour laquelle l’<strong>écart moyen</strong> du tableau est le plus <strong>faible</strong>, puis cliquez sur « Vérifier ». L’écart moyen mesure la distance entre vitesses approchées et vitesses réelles du modèle.</div>
        <div style={{ ...txt, fontWeight: 700 }}>Δt actuellement choisi : {vir(dtChoisi)} s</div>
      </>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau tirage</button>
        {!reussi && !solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', fontWeight: 700, marginTop: 4 }}><Pic n="party"/>Défi réussi !</div>}</div>}
      {solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'vitesse' && <>v<Ind>B/A</Ind> = v<Ind>B</Ind> − v<Ind>A</Ind> = ({vir(defi.vB)}) − ({vir(defi.vA)}) = <strong>{vir(defi.vB - defi.vA)} m/s</strong> : norme {vir(Math.abs(defi.vB - defi.vA))} m/s, {defi.vB - defi.vA > 0 ? 'vers la droite' : 'vers la gauche'}.</>}
        {defi.type === 'trajectoire' && (() => { const obj = S.objets[0].id, c1 = caracteriser(S, defi.f1, obj).traj, h2 = Math.abs(S.objets[0].vit(0).x - S.frames.find(f => f.id === defi.f2).V(0).x) > 1e-6;
          return <>Dans le référentiel de {nomF(defi.f1)}, la trajectoire est <strong>{c1}</strong>. Dans celui de {nomF(defi.f2)}, la vitesse horizontale vaut {h2 ? 'celle du mobile par rapport au sol : elle n’est pas nulle' : '0 : le colis (ou la bille) a la même vitesse horizontale que le référentiel'} : <strong>{h2 ? 'oui' : 'non'}</strong>.</>; })()}
        {defi.type === 'dt' && (() => { const b = meilleurDt(S, 'sol', S.objets[0].id, S.sigmaDef);
          return <>Le meilleur Δt de la liste est <strong>{vir(b.dt)} s</strong> (écart moyen ≈ {nb(b.e * 100, 0)} %). Trop petit, l’erreur de pointage domine (elle est divisée par Δt) ; trop grand, M<Ind>i</Ind>M<Ind>i+1</Ind>/Δt est la vitesse moyenne sur Δt, plus celle du point M<Ind>i</Ind>.</>; })()}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationMouvementReferentiel() {
  const [mode, setMode] = useState(() => modeOuverture('mvtref-guide-v2'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('mvtref-guide-v2', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [ex, setEx] = useState(() => ({ ...initScene('wagon'), aff: AFF0, bruit: false }));
  const [hypoOuv, setHypoOuv] = useState(false);
  const [simple, setSimple] = useState(true);       // affichage simple (par défaut) ou complet
  const [anim, setAnim] = useState(null);           // « revoir le mouvement » : nombre de points déjà montrés
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;
  const maj = patch => { setAnim(null); setEx(e => ({ ...e, ...patch })); };
  const go = (id, extra = {}, over = {}) => { setAnim(null); setEx(e => ({ ...e, ...initScene(id, extra), aff: AFF0, bruit: false, ...over })); };
  const majAff = patch => setEx(e => ({ ...e, aff: { ...e.aff, ...patch } }));

  const eff = enDefi ? { ...ex, ...etatDefi(defi), dtIdx: ex.dtIdx, i: ex.i, aff: defi.type === 'dt' ? { ...ex.aff, ve: true } : ex.aff } : ex;
  const S = scene(eff.scene, { vA: eff.vA, vB: eff.vB });
  const dtIdx = clamp(eff.dtIdx, 0, S.dts.length - 1), dt = S.dts[dtIdx], n = Math.round(S.T / dt);
  const i = clamp(eff.i, 1, n - 1);
  const sigma = eff.bruit ? S.sigmaDef : 0;
  const frames = eff.cmp && S.frames.length > 1 ? [eff.fG, eff.fD] : [eff.fG];
  const visObjs = S.objets.filter(o => eff.vis.includes(o.id)).length ? S.objets.filter(o => eff.vis.includes(o.id)) : [S.objets[0]];
  const sel = visObjs.some(o => o.id === eff.obj) ? eff.obj : visObjs[0].id;
  const data = frames.map(fid => Object.fromEntries(visObjs.map(o => [o.id, echantillonner(S, fid, o.id, dt, sigma)])));
  const vmax = Math.max(1e-9, ...data.flatMap(d => Object.values(d).flatMap(E => E.v.map(norme))));
  const sv = 55 / vmax;
  const compact = mode === 'explore' ? simple : (enGuide && guide.etape < N_CORE);
  const aff = compact ? { ...AFF0, v: eff.aff.v, sys: eff.aff.sys } : eff.aff;
  const jusqua = anim === null ? n : Math.min(anim, n);
  useEffect(() => {
    if (anim === null) return undefined;
    const t = setTimeout(() => setAnim(a => (a === null || a >= n ? null : a + 1)), anim >= n ? 1200 : 450);
    return () => clearTimeout(t);
  }, [anim, n]);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const sceneDeux = (vA, vB) => scene('deux', { vA, vB });
  // valeurs des exemples résolus, calculées avec le modèle
  const Sd = sceneDeux(20, 25), Edep = echantillonner(Sd, 'sol', 'A', 2), dEdep = norme({ x: Edep.p[4].x - Edep.p[3].x, y: Edep.p[4].y - Edep.p[3].y });
  const Sa = scene('avion'), Eavion = echantillonner(Sa, 'sol', 'avion', 2), dAvion = norme({ x: Eavion.p[4].x - Eavion.p[3].x, y: Eavion.p[4].y - Eavion.p[3].y });
  const Sw = scene('wagon'), tabDt = Sw.dts.map(d => ({ d, e: ecartPoint(echantillonner(Sw, 'sol', 'bille', d), Math.round(0.24 / d)), m: ecartAttendu(Sw, 'sol', 'bille', d, Sw.sigmaDef), N: Math.round(Sw.T / d) + 1 }));
  const meilleurW = meilleurDt(Sw, 'sol', 'bille', Sw.sigmaDef), meilleurA = meilleurDt(Sa, 'sol', 'colis', Sa.sigmaDef);
  const Ew = { sol: echantillonner(Sw, 'sol', 'bille', 0.06), mobile: echantillonner(Sw, 'mobile', 'bille', 0.06) };
  const Ewj = 3;     // exemple Δv : variation entre v_2 et v_3 au point M_3 (t = 0,18 s)
  const Sf = scene('freinage'), Ef = { sol: echantillonner(Sf, 'sol', 'bille', 1), mobile: echantillonner(Sf, 'mobile', 'bille', 1) };
  const sceneEst = (id, extra = true) => ex.scene === id && extra;

  const okDtAvion = sceneEst('avion', ex.bruit && dt === meilleurA.dt);
  const ETAPES = [
    { id: 'trajectoire', titre: 'Où passe le mobile ? La trajectoire', focus: ['scene'], depart: () => go('deux', { vA: 20, vB: 25 }, { cmp: false, vis: ['A'], obj: 'A', dtIdx: 1 }),
      texte: <>Un mobile est photographié à intervalles de temps réguliers : <strong>chaque point est une photo</strong>. Le chemin que suivent les points s’appelle la <strong>trajectoire</strong> : une ligne droite (on dit <em>rectiligne</em>) ou une <em>courbe</em>. Le bouton ▶ « Revoir le mouvement » montre les photos une à une.
        <ExempleResolu>Le camion, vu de la route : les points sont <strong>alignés</strong>. La trajectoire est donc une ligne droite (rectiligne).
          {bouton('Voir le camion', () => go('deux', { vA: 20, vB: 25 }, { cmp: false, vis: ['A'], obj: 'A', dtIdx: 1 }))}</ExempleResolu>
        À vous : une bille est lâchée dans un wagon qui roule ; on la regarde depuis le quai. {bouton('Voir la bille (depuis le quai)', () => go('wagon', {}, { cmp: false, vis: ['bille'] }))}</>,
      tache: { type: 'qcm', q: 'Vue depuis le quai, la trajectoire de la bille est…', options: ['une ligne droite verticale', 'une courbe', 'une ligne droite horizontale', 'un point : elle ne bouge pas'], bonne: 1,
        indice: 'La bille tombe, mais le wagon avance pendant ce temps : regardez la forme du chemin des points.',
        expl: 'La bille tombe et avance en même temps (elle va avec le wagon) : les points dessinent une courbe.' } },
    { id: 'rapidite', titre: 'Va-t-il de plus en plus vite ?', focus: ['scene'], depart: () => go('deux', { vA: 20, vB: 25 }, { cmp: false, vis: ['A'], obj: 'A', dtIdx: 1 }),
      texte: <>Les photos sont prises à intervalles réguliers. Si les points sont <strong>tous espacés de la même distance</strong>, le mobile va à <strong>vitesse constante</strong>. S’ils s’écartent de plus en plus, il va <strong>de plus en plus vite</strong> ; s’ils se rapprochent, il ralentit.
        <ExempleResolu>Le camion : entre deux photos, il parcourt toujours {nb(dEdep, 0)} m. Distances égales en durées égales : sa vitesse est <strong>constante</strong>.
          {bouton('Voir le camion', () => go('deux', { vA: 20, vB: 25 }, { cmp: false, vis: ['A'], obj: 'A', dtIdx: 1 }))}</ExempleResolu>
        À vous : un colis est largué d’un avion ; on le regarde depuis le sol. {bouton('Voir le colis (depuis le sol)', () => go('avion', {}, { cmp: false, vis: ['colis'], obj: 'colis' }))}</>,
      tache: { type: 'qcm', q: 'Les points du colis s’écartent de plus en plus. Que fait le colis ?', options: ['il va de plus en plus vite', 'il va à vitesse constante', 'il ralentit', 'il est immobile'], bonne: 0,
        expl: 'Entre deux photos, la distance parcourue augmente : le colis va de plus en plus vite (c’est la chute).' } },
    { id: 'referentiel', titre: 'Le point de vue : le référentiel', focus: ['scene', 'reglages'], depart: () => go('wagon', {}, { cmp: false, vis: ['bille'], obj: 'bille' }),
      texte: <>Pour décrire un mouvement, il faut dire <strong>par rapport à quoi</strong>. On choisit un point de vue : un objet qui ne bouge pas pour l’observateur. On l’appelle le <strong>référentiel</strong>. Assis dans un train, la personne en face de vous est immobile ; pour quelqu’un sur le quai, elle défile.
        <ExempleResolu>La bille lâchée dans le wagon.<br/>
          Vue depuis le quai : elle avance et tombe, la trajectoire est une <strong>courbe</strong>.<br/>
          Vue depuis le wagon : elle avance avec vous, vous la voyez tomber <strong>tout droit</strong>.
          {bouton('Voir les deux points de vue', () => go('wagon', {}, { cmp: true, vis: ['bille'], obj: 'bille' }))}</ExempleResolu>
        À vous : une passagère du wagon regarde tomber la bille.</>,
      tache: { type: 'qcm', q: 'Pour la passagère du wagon, la bille tombe…', options: ['tout droit vers le bas', 'en suivant une courbe', 'vers l’arrière du wagon', 'elle monte'], bonne: 0,
        expl: 'La passagère avance avec la bille : elle ne voit pas son avance horizontale, seulement sa chute. Le mouvement dépend du point de vue.' } },
    { id: 'avion', titre: 'Un point de vue qui avance : l’avion', focus: ['scene'], depart: () => go('avion', {}, { cmp: false, vis: ['colis'], obj: 'colis' }),
      texte: <>Même idée avec l’avion. Pour le pilote, le colis tombe tout droit, juste sous l’avion. Pour quelqu’un au sol, il décrit une courbe.
        <ExempleResolu>Le colis largué, vu du sol puis de l’avion : <strong>courbe</strong> pour le sol, <strong>ligne droite verticale</strong> pour le pilote (le colis avance avec l’avion).
          {bouton('Voir les deux points de vue', () => go('avion', {}, { cmp: true, vis: ['colis'], obj: 'colis' }))}</ExempleResolu>
        À vous : on regarde maintenant depuis le sol le colis <em>et</em> l’avion. {bouton('Voir colis et avion (depuis le sol)', () => go('avion', {}, { cmp: false, fG: 'sol', vis: ['colis', 'avion'], obj: 'colis' }))}</>,
      tache: { type: 'qcm', q: 'Vu du sol, au moment où le colis touche le sol, l’avion est…', options: ['juste au-dessus du colis', 'loin derrière le colis', 'loin devant le colis', 'revenu à son point de départ'], bonne: 0,
        expl: 'Le colis garde la vitesse horizontale de l’avion (100 m/s) pendant toute sa chute : il reste sous l’avion (en négligeant l’air). C’est pour cela que, pour le pilote, il tombe tout droit.' } },
    { id: 'vitesse', titre: 'La vitesse et le vecteur vitesse', focus: ['scene'], depart: () => go('deux', { vA: 20, vB: 25 }, { cmp: false, vis: ['A'], obj: 'A', dtIdx: 1, aff: { ...AFF0, v: true } }),
      texte: <>La vitesse dit <strong>de combien le mobile avance pendant une durée</strong> : <strong>vitesse = distance parcourue ÷ durée</strong>. Entre deux photos successives M et M′ séparées de la durée Δt : <strong>v = MM′ / Δt</strong>. On la représente par une flèche, le <strong>vecteur vitesse</strong> : il part du mobile, pointe dans le sens du mouvement et sa longueur est proportionnelle à la vitesse.
        <ExempleResolu>Le camion : entre deux photos, il parcourt MM′ = {nb(dEdep, 0)} m en Δt = 2 s.<br/>
          Expression littérale : v = MM′ / Δt.<br/>
          Application numérique : v = {nb(dEdep, 0)} m / 2 s = <strong>{nb(dEdep / 2, 0)} m/s</strong>, soit {nb(dEdep / 2 * 3.6, 0)} km/h, vers la droite.
          {bouton('Voir le camion avec ses flèches', () => go('deux', { vA: 20, vB: 25 }, { cmp: false, vis: ['A'], obj: 'A', dtIdx: 1, aff: { ...AFF0, v: true } }))}</ExempleResolu>
        À vous : l’avion, vu du sol. {bouton('Voir l’avion avec ses flèches', () => go('avion', {}, { cmp: false, vis: ['avion'], obj: 'avion', dtIdx: 2, aff: { ...AFF0, v: true } }))} Entre deux photos (Δt = 2 s), l’avion se déplace de {nb(dAvion, 0)} m.</>,
      tache: { type: 'num', q: `L’avion se déplace de ${nb(dAvion, 0)} m en 2 s. Quelle est sa vitesse, en km/h ?`, unite: 'km/h', vrai: dAvion / 2 * 3.6, tol: 0.02, affiche: x => nb(x, 0),
        pieges: [[dAvion / 2, 'Vous avez trouvé la vitesse en m/s : pour passer en km/h, multipliez par 3,6.'],
          [2 / dAvion, 'Vous avez divisé à l’envers : la vitesse, c’est la distance divisée par la durée (v = MM′ / Δt).'],
          [dAvion * 3.6, 'Vous avez oublié de diviser par la durée Δt = 2 s : v = MM′ / Δt.']],
        calcul: () => [
          'Formule : vitesse = distance parcourue ÷ durée, soit v = MM′ / Δt.',
          `Données : MM′ = ${nb(dAvion, 0)} m et Δt = 2 s.`,
          `En m/s : v = ${nb(dAvion, 0)} / 2 = ${nb(dAvion / 2, 0)} m/s.`,
          `Conversion : 1 m/s = 3,6 km/h, donc v = ${nb(dAvion / 2, 0)} × 3,6 = ${nb(dAvion / 2 * 3.6, 0)} km/h.`],
        expl: `v = ${nb(dAvion, 0)} m / 2 s = ${nb(dAvion / 2, 0)} m/s, soit ${nb(dAvion / 2, 0)} × 3,6 = ${nb(dAvion / 2 * 3.6, 0)} km/h.` } },
    { id: 'vitesserel', titre: 'La vitesse dépend aussi du point de vue', focus: ['scene'], depart: () => go('deux', { vA: 20, vB: 25 }, { cmp: true, fD: 'A', obj: 'B', dtIdx: 1, aff: { ...AFF0, v: true } }),
      texte: <>Un mobile n’a pas la même vitesse dans tous les référentiels.
        <ExempleResolu>Vous êtes dans le camion A (20 m/s par rapport à la route). La voiture B vous double à 25 m/s (par rapport à la route).<br/>
          Pour vous, c’est comme si le camion était immobile : on retranche la vitesse de A.<br/>
          Expression littérale : v<Ind>B/A</Ind> = v<Ind>B</Ind> − v<Ind>A</Ind>.<br/>
          Application numérique : v<Ind>B/A</Ind> = 25 − 20 = <strong>5 m/s</strong>, vers l’avant. Vous la voyez avancer lentement.
          {bouton('Voir le dépassement', () => go('deux', { vA: 20, vB: 25 }, { cmp: true, fD: 'A', obj: 'B', dtIdx: 1, aff: { ...AFF0, v: true } }))}</ExempleResolu>
        À vous : A roule à 20 m/s vers la droite et B arrive en face, à 25 m/s vers la gauche (vitesse algébrique −25 m/s). {bouton('Voir le croisement', () => go('deux', { vA: 20, vB: -25 }, { cmp: true, fD: 'A', obj: 'B', dtIdx: 1, aff: { ...AFF0, v: true } }))}</>,
      tache: { type: 'num', q: 'À quelle vitesse, en m/s, B passe-t-elle devant vous dans le camion A ?', unite: 'm/s', vrai: 45, tol: 0.02, affiche: x => nb(x, 0),
        pieges: [[5, 'Vous avez soustrait les vitesses sans tenir compte du sens. B roule en sens inverse : v_B − v_A = (−25) − 20.'],
          [25, 'C’est la vitesse de B par rapport à la route. Dans le camion A, il faut retrancher la vitesse de A : v(B/A) = v_B − v_A.'],
          [20, 'C’est la vitesse de A par rapport à la route. Dans le camion A, on cherche la vitesse de B : v(B/A) = v_B − v_A.'],
          [-45, 'Le signe − indique seulement le sens du mouvement (ici vers la gauche). On demande la valeur de la vitesse : donnez-la sans le signe.']],
        calcul: () => [
          'Référentiel du camion A. Formule : v(B/A) = v_B − v_A (vitesses de A et de B mesurées par rapport à la route, sur un axe orienté vers la droite : + vers la droite, − vers la gauche ; mouvements en ligne droite).',
          'Données : v_A = +20 m/s (vers la droite) et v_B = −25 m/s (vers la gauche).',
          'v(B/A) = (−25) − (+20) = −45 m/s.',
          'Le signe − dit que B va vers la gauche. Sa vitesse (valeur positive) est 45 m/s.'],
        expl: 'v(B/A) = v_B − v_A = (−25) − 20 = −45 m/s : 45 m/s, vers la gauche. En sens inverse, les vitesses s’additionnent (en valeur).' } },
    { id: 'essentiel', titre: 'À retenir : l’essentiel', focus: [],
      texte: <><ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Une chronophotographie : chaque point est une photo prise à intervalles réguliers.</li>
        <li>La <strong>trajectoire</strong> est le chemin des points : droite ou courbe.</li>
        <li>Points toujours espacés pareil : <strong>vitesse constante</strong>. Points qui s’écartent : le mobile accélère.</li>
        <li>Le <strong>référentiel</strong> est le point de vue de l’observateur. <strong>Trajectoire et vitesse en dépendent.</strong></li>
        <li><strong>v = MM′ / Δt</strong>, représentée par le vecteur vitesse (une flèche). Et v<Ind>B/A</Ind> = v<Ind>B</Ind> − v<Ind>A</Ind>.</li></ul></ARetenir>
        <div style={{ marginTop: 8 }}>Les étapes suivantes (marquées ★) vont plus loin : choix de l’intervalle Δt, variation de la vitesse et forces. Elles utilisent l’affichage complet.</div></>,
      tache: null },
    { id: 'dt', titre: '★ Pour aller plus loin : le choix de Δt', focus: ['reglages', 'mesures'],
      texte: <>Ici, l’affichage devient complet (réglages et tableau de mesures). Choisir Δt, c’est choisir l’<strong>échelle de temps</strong> de la description : trop grand, on ne voit plus la forme du mouvement (peu d’images) ; trop petit, les points se confondent et l’erreur de pointage domine.
        <ExempleResolu>La bille lâchée dans le wagon, vue du quai. On compare v<Ind>i</Ind> ≈ M<Ind>i</Ind>M<Ind>i+1</Ind>/Δt à la vitesse réelle du modèle au point t = 0,24 s.
          <table style={{ borderCollapse: 'collapse', margin: '4px 0', fontSize: 13.5 }}><thead><tr><th style={{ textAlign: 'left', paddingRight: 10 }}>Δt (s)</th><th style={{ textAlign: 'left', paddingRight: 10 }}>images</th><th style={{ textAlign: 'left', paddingRight: 10 }}>écart, pointage parfait</th><th style={{ textAlign: 'left' }}>écart moyen, pointage à ±{Sw.uniteSigma}</th></tr></thead>
            <tbody>{tabDt.map(l => <tr key={l.d}><td>{vir(l.d)}</td><td>{l.N}</td><td>{nb(l.e * 100, 0)} %</td><td>{nb(l.m * 100, 0)} %</td></tr>)}</tbody></table>
          Avec un pointage parfait, plus Δt est petit, meilleure est l’approximation. Avec une erreur de pointage, le meilleur choix est un Δt <strong>intermédiaire</strong> ({vir(meilleurW.dt)} s ici).</ExempleResolu>
        À vous : le colis largué de l’avion, pointé avec une erreur de {Sa.uniteSigma}. {bouton('Mettre le colis (erreur de pointage)', () => go('avion', {}, { cmp: false, vis: ['colis'], obj: 'colis', bruit: true, dtIdx: 0, aff: { ...AFF0, v: true, ve: true } }))}
        Essayez les valeurs de Δt et lisez l’écart moyen dans le tableau.</>,
      tache: { type: 'action', ok: okDtAvion, label: null, consigne: sceneEst('avion', ex.bruit) ? `Δt = ${vir(dt)} s · écart moyen : ${nb(ecartAttendu(Sa, 'sol', 'colis', dt, Sa.sigmaDef) * 100, 0)} %` : 'Mettez le colis avec le bouton ci-dessus, puis cherchez le Δt qui donne l’écart moyen le plus faible.' } },
    { id: 'dv', titre: '★ La variation du vecteur vitesse', focus: ['scene', 'mesures'],
      texte: <>La <strong>variation du vecteur vitesse</strong> entre deux instants voisins est Δv<Ind>i</Ind> = v<Ind>i</Ind> − v<Ind>i−1</Ind>. On trace les deux vecteurs depuis un même point : Δv relie leurs extrémités. La vitesse change d’un référentiel à l’autre ; sa <em>variation</em>, elle, ne change pas.
        <ExempleResolu>La bille du wagon, Δt = 0,06 s, au point M<Ind>3</Ind> :<br/>
          vue du quai : v<Ind>2</Ind> = ({nb(Ew.sol.v[Ewj - 1].x)} ; {nb(Ew.sol.v[Ewj - 1].y)}) m/s et v<Ind>3</Ind> = ({nb(Ew.sol.v[Ewj].x)} ; {nb(Ew.sol.v[Ewj].y)}) m/s, donc Δv<Ind>3</Ind> = ({nb(Ew.sol.dv[Ewj - 1].x)} ; {nb(Ew.sol.dv[Ewj - 1].y)}) m/s ;<br/>
          vue du wagon : v<Ind>2</Ind> = ({nb(Ew.mobile.v[Ewj - 1].x)} ; {nb(Ew.mobile.v[Ewj - 1].y)}) m/s et v<Ind>3</Ind> = ({nb(Ew.mobile.v[Ewj].x)} ; {nb(Ew.mobile.v[Ewj].y)}) m/s, donc Δv<Ind>3</Ind> = ({nb(Ew.mobile.dv[Ewj - 1].x)} ; {nb(Ew.mobile.dv[Ewj - 1].y)}) m/s.<br/>
          Les vitesses diffèrent de 8 m/s vers la droite, mais Δv est <strong>le même</strong> : vertical, vers le bas.
          {bouton('Voir la construction de Δv', () => go('wagon', {}, { cmp: true, vis: ['bille'], obj: 'bille', i: 3, aff: { ...AFF0, dv: true, v: true } }))}</ExempleResolu>
        À vous : la voiture B du dépassement. {bouton('Voir le dépassement', () => go('deux', { vA: 20, vB: 25 }, { cmp: true, fD: 'A', obj: 'B', dtIdx: 1, i: 3, aff: { ...AFF0, dv: true, v: true } }))}</>,
      tache: { type: 'qcm', q: 'La voiture roule en ligne droite à vitesse constante. Que vaut sa variation de vitesse Δv ?', options: ['nulle, dans le référentiel de la route comme dans celui du camion', 'nulle dans la route, mais pas dans le camion', 'égale à 5 m/s dans le référentiel du camion', 'égale à 25 m/s dans le référentiel de la route'], bonne: 0,
        expl: 'Les deux vecteurs v sont identiques en chaque référentiel (25 m/s dans la route, 5 m/s dans le camion) : leur différence est nulle. La variation de vitesse ne dépend pas du référentiel choisi, tant que les référentiels se déplacent l’un par rapport à l’autre à vitesse constante.' } },
    { id: 'force', titre: '★ Variation de vitesse et forces', focus: ['scene'],
      texte: <>Si Δv = 0 (vitesse constante en direction et en norme), les forces qui s’exercent sur le système <strong>se compensent</strong> : c’est le principe d’inertie. Si Δv n’est pas nul, la somme des forces n’est pas nulle et elle a la <strong>même direction et le même sens que Δv</strong>.
        <ExempleResolu>Le colis largué, vu du sol.<br/>
          Δv est vertical, dirigé vers le bas, et sa norme est la même à chaque instant (≈ g·Δt).<br/>
          La somme des forces est donc verticale, vers le bas : c’est le <strong>poids</strong>, seule force (chute libre, frottements de l’air négligés).
          {bouton('Voir Δv pour le colis', () => go('avion', {}, { cmp: false, vis: ['colis'], obj: 'colis', i: 3, aff: { ...AFF0, dv: true, v: true } }))}</ExempleResolu>
        À vous : l’avion lui-même, qui vole en palier à vitesse constante. {bouton('Voir Δv pour l’avion', () => go('avion', {}, { cmp: false, vis: ['avion'], obj: 'avion', i: 3, aff: { ...AFF0, dv: true, v: true } }))}</>,
      tache: { type: 'qcm', q: 'L’avion vole à vitesse constante, en ligne droite. Que peut-on en conclure ?', options: ['les forces qui s’exercent sur lui se compensent', 'aucune force ne s’exerce sur lui', 'le poids de l’avion est nul', 'les moteurs sont arrêtés'], bonne: 0,
        indice: 'Δv = 0 ne signifie pas « pas de forces » : le poids existe toujours.',
        expl: 'Δv = 0 : la somme des forces est nulle. Le poids (vers le bas) est compensé par la portance des ailes ; la poussée des moteurs compense la traînée de l’air. Les forces existent, mais elles se compensent.' } },
    { id: 'baton', titre: '★ Le modèle du point : ce qu’on perd', focus: ['scene'],
      texte: <>Pour décrire un mouvement, on remplace souvent le système (ici un bâton) par un <strong>point</strong> : son centre. C’est un modèle : on gagne en simplicité, on perd de l’information.
        <ExempleResolu>Un bâton lancé en l’air en tournant. {bouton('Voir le bâton', () => go('baton', {}, { cmp: false, vis: ['centre'], obj: 'centre', aff: { ...AFF0, sys: false } }))}<br/>
          Le centre décrit une <strong>parabole</strong> : trajectoire simple, facile à décrire et à calculer.<br/>
          Mais ce point ne dit rien du bâton lui-même. Affichez le système réel avec le bouton « Montrer le bâton » : chaque bout décrit une courbe plus compliquée.
          {bouton('Montrer le bâton', () => majAff({ sys: true }))}</ExempleResolu>
        À vous : que ne sait-on pas quand on ne suit que le centre ?</>,
      tache: { type: 'qcm', q: 'Quelle information est perdue quand on décrit le bâton par son centre seulement ?', options: ['le fait que le bâton tourne sur lui-même', 'la trajectoire du centre', 'la durée du vol', 'la hauteur maximale du centre'], bonne: 0,
        expl: 'La trajectoire du centre (parabole), la durée du vol et la hauteur maximale sont des informations du modèle du point. En revanche, ni la rotation, ni l’orientation du bâton n’y figurent.' } },
    { id: 'freinage', titre: '★ Un référentiel qui freine', focus: ['scene', 'mesures'],
      texte: <>Jusqu’ici, les référentiels se déplaçaient les uns par rapport aux autres à vitesse <em>constante</em>. Que se passe-t-il quand l’un d’eux freine ? {bouton('Voir la bille dans le train qui freine', () => go('freinage', {}, { cmp: true, vis: ['bille'], obj: 'bille', aff: { ...AFF0, dv: true, v: true } }))}
        <ExempleResolu>Une bille posée sur le plancher lisse d’un train qui freine (pas de frottement, donc aucune force horizontale).<br/>
          Vue du quai : v = {nb(Ef.sol.v[1].x, 1)} m/s à chaque instant, Δv = {nb(norme(Ef.sol.dv[0]), 1)} : mouvement rectiligne uniforme, cohérent avec l’absence de force horizontale.<br/>
          Vue du train : la bille accélère vers l’avant (Δv = {nb(norme(Ef.mobile.dv[0]), 1)} m/s en 1 s) alors qu’aucune force horizontale ne s’exerce sur elle.</ExempleResolu>
        Le principe d’inertie ne s’applique pas dans tous les référentiels : il s’applique dans celui du quai, pas dans celui d’un train qui freine. (Ce point est abordé plus tard dans la scolarité ; il montre pourquoi on précise toujours le référentiel.)</>,
      tache: { type: 'qcm', q: 'Dans le train qui freine, la bille se met à rouler vers l’avant. Une force horizontale la pousse-t-elle ?', options: ['non : c’est le train qui freine, la bille garde sa vitesse (vue du quai)', 'oui : la bille est attirée vers l’avant', 'oui : le principe d’inertie est faux', 'on ne peut rien dire'], bonne: 0,
        expl: 'Vue du quai, la bille continue en ligne droite à 8 m/s : aucune force horizontale. C’est le plancher qui ralentit sous elle. Dans le référentiel du train, le mouvement de la bille semble accéléré sans cause : le principe d’inertie n’y est pas applicable.' } },
    { id: 'fin', titre: 'À retenir (complet)', focus: [],
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Décrire un mouvement, c’est choisir un <strong>référentiel</strong>, puis suivre un point (modèle du point matériel : on perd de l’information, par exemple la rotation).</li>
        <li>Une chronophotographie donne la <strong>trajectoire</strong> (droite ou courbe) et la nature du mouvement : écarts égaux = uniforme, écarts croissants = accéléré.</li>
        <li><strong>v<Ind>i</Ind> ≈ M<Ind>i</Ind>M<Ind>i+1</Ind> / Δt</strong> : même direction et même sens que le déplacement, norme = distance / durée. Le choix de Δt compte : ni trop grand, ni trop petit.</li>
        <li>Vitesse et trajectoire <strong>dépendent du référentiel</strong> : v<Ind>B/A</Ind> = v<Ind>B</Ind> − v<Ind>A</Ind>.</li>
        <li>La <strong>variation de vitesse</strong> Δv est la même dans deux référentiels en <strong>translation rectiligne uniforme</strong> l’un par rapport à l’autre (référentiels galiléens). Δv = 0 : les forces se compensent ; Δv ≠ 0 : la somme des forces a la direction et le sens de Δv.</li></ul></ARetenir>,
      tache: null },
  ];
  const cadre = id => enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  useEffect(() => {           // à l'arrivée sur une étape, on met en place sa situation de départ
    if (mode !== 'guide') return;
    const d = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (d) d();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  // ════════════════ DÉFIS ════════════════
  function lancer(type) { const d = nouveauDefi(type); setDefi(d); setEx(e => ({ ...e, ...etatDefi(d), aff: { ...AFF0, v: true, ve: type === 'dt' }, bruit: type === 'dt', i: 4 })); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'vitesse'); else setEx(e => ({ ...e, bruit: false })); }

  // ════════════════ PANNEAUX ════════════════
  const nomF = id => S.frames.find(f => f.id === id).court;
  const legende = enDefi && defi.type === 'vitesse' ? 'Deux véhicules roulent en ligne droite à vitesse constante dans le référentiel de la route (leurs vitesses sont à trouver).' : S.legende;
  const panneaux = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, padding: '8px 10px', marginBottom: 8, fontSize: 14.5, lineHeight: 1.55, color: KIT.txt }}>
        <strong>{S.icone} {S.titre}.</strong> {legende}
        <div style={{ marginTop: 4 }}>On suit : {visObjs.map((o, k) => <span key={o.id} style={{ marginRight: 10, whiteSpace: 'nowrap' }}>{k > 0 && ' '}<span style={{ fontSize: 18, color: o.col }}>{ICO_OBJ[o.id] || '●'}</span> <strong>{o.nom}</strong></span>)}
          {' '}· <span style={{ whiteSpace: 'nowrap' }}>{S.frames.length > 1 ? 'Référentiel affiché : ' : 'Référentiel : '}<strong>{frames.map(f => S.frames.find(x => x.id === f).nom).join(' et ')}</strong></span></div>
      </div>
      <div style={{ marginBottom: 8 }}><button onClick={() => setAnim(0)} style={styleBouton(true, '#4338ca')}>▶ Revoir le mouvement, photo après photo</button></div>
      <div className="mr-pan">
        {frames.map((fid, k) => <div key={fid + k}>
          <Panneau S={S} fid={fid} data={data[k]} visObjs={visObjs} aff={aff} i={i} sv={sv} sel={sel} jusqua={jusqua} simple={compact} titre={`Vu depuis ${S.frames.find(f => f.id === fid).nom}`}/>
          {aff.dv && <div style={{ marginTop: 6 }}><Construction E={data[k][sel]} i={i} titre={`Δv au point M${i} (${nomF(fid)})`}/></div>}
        </div>)}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
        {aff.v && <><span style={{ color: VERT, fontWeight: 700 }}>→</span> vitesse approchée v<Ind>i</Ind> ≈ M<Ind>i</Ind>M<Ind>i+1</Ind>/Δt · </>}
        {aff.dv && <><span style={{ color: ROUGE, fontWeight: 700 }}>→</span> variation Δv<Ind>i</Ind> · </>}
        {aff.org && <><span style={{ color: VIOLET, fontWeight: 700 }}>○</span> positions successives de l’autre référentiel · </>}
        {compact ? `Une photo toutes les ${vir(dt)} s (${n + 1} photos). Positions calculées par un modèle, pas une vraie vidéo.` : `Positions fournies par un modèle, une image toutes les Δt = ${vir(dt)} s (${n + 1} images).`}
        {!compact && n + 1 < 5 && <strong style={{ color: '#b91c1c' }}> Trop peu d’images pour voir la forme de la trajectoire.</strong>}
      </div>
    </div>);

  const nomsObj = Object.fromEntries(S.objets.map(o => [o.id, o]));
  const lignesMes = [
    ['Date t', data.map(d => `${vir(d[sel].t[i].toFixed(2))} s`), null],
    ['Position M' + i, data.map(d => `(${nbA(d[sel].p[i].x)} ; ${nbA(d[sel].p[i].y)}) m`), null],
    ...(aff.v ? [['Vitesse approchée ‖v‖', data.map(d => `${nbA(norme(d[sel].v[i]))} m/s`), VERT],
      ['Direction de v', data.map(d => direction(d[sel].v[i])), VERT]] : []),
    ...(aff.dv ? [['Variation ‖Δv‖', data.map(d => `${nb(norme(d[sel].dv[i - 1]), 2)} m/s`), ROUGE],
      ['Direction de Δv', data.map(d => direction({ x: d[sel].dv[i - 1].x, y: d[sel].dv[i - 1].y })), ROUGE]] : []),
  ];
  const lignesEx = aff.ve || (enDefi && defi.type === 'dt') ? [
    ['Vitesse exacte du modèle ‖v‖', data.map(d => `${nbA(norme(d[sel].ve[i]))} m/s`), GRIS],
    ['Écart relatif au point M' + i, data.map(d => { const e = ecartPoint(d[sel], i); return isFinite(e) ? `${nb(e * 100, 0)} %` : '—'; }), GRIS],
    ['Écart moyen sur la série' + (sigma ? ' (moyenne de 60 pointages)' : ''), frames.map(fid => { const e = ecartAttendu(S, fid, sel, dt, sigma); return isFinite(e) ? `${nb(e * 100, 0)} %` : '—'; }), GRIS],
  ] : [];
  const lignesCar = mode === 'explore' ? frames.map(fid => caracteriser(S, fid, sel)) : null;
  const NOMS_TRAJ = { immobile: 'immobile', rectiligne: 'rectiligne', courbe: 'courbe' };
  const NOMS_MVT = { immobile: 'immobile', uniforme: 'uniforme', accelere: 'accéléré', ralenti: 'ralenti', quelconque: 'de vitesse variable' };
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures pour {nomsObj[sel].nom}, au point M<Ind>{i}</Ind></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%' }}>
          <thead><tr><th style={{ textAlign: 'left', padding: '3px 6px 3px 0' }}/>{frames.map(fid => <th key={fid} style={{ textAlign: 'left', padding: '3px 8px', color: KIT.txt2 }}>{nomF(fid)}</th>)}</tr></thead>
          <tbody>{[...lignesMes, ...lignesEx].map(([lab, vals, col]) => <tr key={lab} style={{ borderTop: '1px solid #e2e8f0' }}>
            <td style={{ padding: '3px 6px 3px 0', color: col || KIT.txt, fontWeight: 600 }}>{lab}</td>
            {vals.map((x, k) => <td key={k} style={{ padding: '3px 8px', color: col || KIT.txt, fontWeight: col ? 700 : 400 }}>{x}</td>)}</tr>)}
          {lignesCar && <>
            <tr style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '3px 6px 3px 0', fontWeight: 600 }}>Trajectoire</td>{lignesCar.map((c, k) => <td key={k} style={{ padding: '3px 8px' }}>{NOMS_TRAJ[c.traj]}</td>)}</tr>
            <tr style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '3px 6px 3px 0', fontWeight: 600 }}>Mouvement</td>{lignesCar.map((c, k) => <td key={k} style={{ padding: '3px 8px' }}>{NOMS_MVT[c.mvt]}</td>)}</tr></>}
          </tbody></table></div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>v<Ind>i</Ind> ≈ M<Ind>i</Ind>M<Ind>i+1</Ind> / Δt et Δv<Ind>i</Ind> = v<Ind>i</Ind> − v<Ind>i−1</Ind>, calculés sur les positions.
        {lignesEx.length > 0 && ' La vitesse « exacte » n’est connue que parce que les positions viennent d’un modèle ; dans une vraie expérience, on ne l’a pas.'}</div>
    </div>);

  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && <>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Situation</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {ORDRE_SCENES.map(id => { const Sc = scene(id); return <button key={id} onClick={() => go(id)} style={stylePetitBouton(ex.scene === id, VIOLET)}>{Sc.icone} {Sc.court}</button>; })}</div>
        {S.id === 'deux' && <>
          <Curseur nom="Vitesse de A (route)" valeur={ex.vA} onChange={x => maj({ vA: x })} min={-30} max={30} pas={5} unite="m/s" couleur="#c2410c"/>
          <Curseur nom="Vitesse de B (route)" valeur={ex.vB} onChange={x => maj({ vB: x })} min={-30} max={30} pas={5} unite="m/s" couleur={BLEU}/></>}
        {S.frames.length > 1 && <>
          <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Référentiel{eff.cmp ? ' de gauche' : ''}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{S.frames.map(f => <button key={f.id} onClick={() => maj({ fG: f.id })} style={stylePetitBouton(ex.fG === f.id, '#0284c7')}>{f.court}</button>)}</div>
          {eff.cmp && <><div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Référentiel de droite</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{S.frames.map(f => <button key={f.id} onClick={() => maj({ fD: f.id })} style={stylePetitBouton(ex.fD === f.id, '#0284c7')}>{f.court}</button>)}</div></>}
          <label style={{ fontSize: 14, color: KIT.txt, cursor: 'pointer', display: 'block', marginBottom: 8 }}><input type="checkbox" checked={ex.cmp} onChange={e => maj({ cmp: e.target.checked })} style={{ marginRight: 6 }}/>Comparer deux référentiels côte à côte</label></>}
        {S.objets.length > 1 && <>
          <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>{S.id === 'baton' ? 'Points suivis' : 'Mobiles affichés'}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{S.objets.map(o => <button key={o.id} onClick={() => setEx(e => { const v = e.vis.includes(o.id) ? e.vis.filter(x => x !== o.id) : [...e.vis, o.id]; return { ...e, vis: v.length ? v : e.vis, obj: v.includes(e.obj) ? e.obj : (v[0] || e.obj) }; })} style={stylePetitBouton(eff.vis.includes(o.id), o.col)}>{o.court}</button>)}</div>
          {visObjs.length > 1 && <><div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Mesures pour</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{visObjs.map(o => <button key={o.id} onClick={() => maj({ obj: o.id })} style={stylePetitBouton(sel === o.id, '#334155')}>{o.court}</button>)}</div></>}</>}
      </>}
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Intervalle entre deux images : Δt</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {S.dts.map((d, k) => <button key={d} onClick={() => maj({ dtIdx: k, i: 4 })} style={stylePetitBouton(dtIdx === k, '#0ea5e9')}>{vir(d)} s</button>)}</div>
      <Curseur nom="Point étudié M_i" valeur={i} onChange={x => maj({ i: x })} min={1} max={Math.max(1, n - 1)} pas={1} couleur="#0284c7"/>
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '4px 0' }}>Afficher</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
        {[['v', 'vecteurs vitesse v'], ['dv', 'variation Δv (et sa construction)'], ['org', 'où est l’autre référentiel (icône) à chaque image'], ...(S.id === 'baton' ? [['sys', 'le bâton entier (système réel)']] : []), ['ve', 'vitesses exactes du modèle et écarts']].map(([c, l]) =>
          <label key={c} style={{ fontSize: 14, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={!!aff[c]} disabled={enDefi && defi.type === 'dt' && c === 've'} onChange={e => majAff({ [c]: e.target.checked })} style={{ marginRight: 6 }}/>{l}</label>)}
        {!enDefi && <label style={{ fontSize: 14, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={ex.bruit} onChange={e => maj({ bruit: e.target.checked })} style={{ marginRight: 6 }}/>erreur de pointage (± {S.uniteSigma}, comme sur une vraie vidéo)</label>}
      </div>
    </div>);

  // ── affichage simple : peu de choix, des mots du quotidien ──
  const choixPlace = (cle, courant) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
    {S.frames.map(f => <button key={f.id} onClick={() => maj({ [cle]: f.id })} style={stylePetitBouton(courant === f.id, '#0284c7')}>{icoF(S, f.id)} {maj1(place(S, f.id))}</button>)}</div>;
  const etiq = t => <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>{t}</div>;
  const reglagesSimples = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 8 }}>Réglages</div>
      {etiq('1. Choisissez une situation')}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {ORDRE_SCENES.filter(id => !scene(id).pourAllerPlusLoin).map(id => { const Sc = scene(id); return <button key={id} onClick={() => go(id)} style={stylePetitBouton(ex.scene === id, VIOLET)}>{Sc.icone} {Sc.court}</button>; })}</div>
      {S.id === 'deux' && <>
        <Curseur nom="Vitesse du véhicule A" valeur={ex.vA} onChange={x => maj({ vA: x })} min={-30} max={30} pas={5} unite="m/s" couleur="#c2410c"/>
        <Curseur nom="Vitesse du véhicule B" valeur={ex.vB} onChange={x => maj({ vB: x })} min={-30} max={30} pas={5} unite="m/s" couleur={BLEU}/></>}
      {S.frames.length > 1 && <>
        {etiq(`2. D’où regarde-t-on le mouvement ?${eff.cmp ? ' (à gauche)' : ''}`)}
        {choixPlace('fG', ex.fG)}
        {eff.cmp && <>{etiq('À droite')}{choixPlace('fD', ex.fD)}</>}
        <label style={{ fontSize: 14, color: KIT.txt, cursor: 'pointer', display: 'block', marginBottom: 10 }}><input type="checkbox" checked={ex.cmp} onChange={e => maj({ cmp: e.target.checked })} style={{ marginRight: 6 }}/>Comparer deux points de vue côte à côte</label></>}
      {S.objets.length > 1 && <>
        {etiq(S.id === 'baton' ? 'Points suivis' : 'Mobiles suivis')}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>{S.objets.map(o => <button key={o.id} onClick={() => setEx(e => { const v = e.vis.includes(o.id) ? e.vis.filter(x => x !== o.id) : [...e.vis, o.id]; return { ...e, vis: v.length ? v : e.vis, obj: v.includes(e.obj) ? e.obj : (v[0] || e.obj) }; })} style={stylePetitBouton(eff.vis.includes(o.id), o.col)}>{ICO_OBJ[o.id] || '●'} {o.court}</button>)}</div></>}
      <label style={{ fontSize: 14, color: KIT.txt, cursor: 'pointer', display: 'block', marginBottom: 6 }}><input type="checkbox" checked={!!eff.aff.v} onChange={e => majAff({ v: e.target.checked })} style={{ marginRight: 6 }}/>Afficher la vitesse (une flèche verte pour chaque photo)</label>
      {S.id === 'baton' && <label style={{ fontSize: 14, color: KIT.txt, cursor: 'pointer', display: 'block', marginBottom: 6 }}><input type="checkbox" checked={!!eff.aff.sys} onChange={e => majAff({ sys: e.target.checked })} style={{ marginRight: 6 }}/>Dessiner le bâton entier</label>}
    </div>);
  const observation = (
    <div style={{ ...styleBoite, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>👀 Ce que l’on observe</div>
      {frames.map(fid => visObjs.map(o => { const c = caracteriser(S, fid, o.id), nomFr = S.frames.find(f => f.id === fid).nom;
        return <div key={fid + o.id} style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55, marginBottom: 4 }}>
          Vu depuis {nomFr}, {o.nom} {c.traj === 'immobile' ? <strong>ne bouge pas</strong> : <><strong>{PHR_TRAJ[c.traj]}</strong>, <strong>{PHR_MVT[c.mvt]}</strong></>}.</div>; }))}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Positions fournies par un modèle</strong> exact : ce n’est pas une mesure. On peut ainsi comparer les vitesses approchées aux vitesses réelles, ce qui est impossible dans une vraie expérience. Le pointage vidéo reste l’activité expérimentale de référence.</li>
      <li><strong>Référentiels galiléens</strong> : en translation rectiligne uniforme les uns par rapport aux autres (pas de rotation, vitesse constante). Seule exception, volontaire : « le train qui freine », qui n’est pas galiléen.</li>
      <li><strong>Point matériel</strong> : chaque système est réduit à un point. Pour le bâton, on peut afficher le système réel pour voir ce que le modèle du point ne décrit pas.</li>
      <li><strong>Pesanteur uniforme</strong> g = 9,8 N/kg ; <strong>frottements de l’air négligés</strong> pour la bille, le colis et le bâton (un colis réel, surtout léger, serait ralenti par l’air).</li>
      <li><strong>Vitesse approchée</strong> v<Ind>i</Ind> ≈ M<Ind>i</Ind>M<Ind>i+1</Ind> / Δt : c’est la vitesse <em>moyenne</em> entre deux images, attribuée à M<Ind>i</Ind>. Pour un mouvement accéléré, elle est décalée d’environ a·Δt/2 par rapport à la vitesse au point M<Ind>i</Ind>.</li>
      <li><strong>Erreur de pointage</strong> (si elle est activée) : erreur gaussienne, indépendante d’un point à l’autre et de même écart-type partout. La vitesse approchée est alors entachée d’une erreur d’environ 2σ/Δt, qui augmente quand Δt diminue. L’« écart moyen » affiché est une moyenne sur 60 séries de pointage indépendantes.</li>
      <li><strong>Écart moyen</strong> : moyenne des écarts ‖v approchée − v exacte‖, divisée par la moyenne des vitesses exactes.</li>
      <li><strong>Variation de vitesse</strong> Δv<Ind>i</Ind> = v<Ind>i</Ind> − v<Ind>i−1</Ind> : différence de deux vitesses approchées successives ; elle est attribuée au point M<Ind>i</Ind>.</li>
      <li><strong>Échelles</strong> : l’échelle des longueurs diffère d’un panneau à l’autre ; celle des vitesses est commune. Pour les deux véhicules, les voies sont dessinées l’une sous l’autre (les points sont sur la même droite).</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Bille dans le wagon : cochez « Comparer deux référentiels » et comparez les trajectoires. Cochez « variation Δv » : que vaut Δv dans chacun ?</li>
        <li>Deux véhicules : mettez vB = −25 m/s (croisement) puis vB = 20 m/s (même vitesse que A). Que voit-on depuis A ?</li>
        <li>Colis et avion : affichez l’avion et le colis dans le référentiel du sol. Où est l’avion quand le colis arrive au sol ?</li>
        <li>Changez Δt : à quel moment les vitesses approchées s’écartent-elles des vitesses exactes ? Activez ensuite l’erreur de pointage.</li>
        <li>Bâton : suivez le bout rouge, puis le centre. Lequel a la trajectoire la plus simple ? Que perd-on en ne suivant que le centre ?</li>
        <li>Train qui freine : dans quel référentiel la bille a-t-elle une variation de vitesse non nulle ?</li>
      </ul>
    </div>);
  const aEssayerSimple = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Bille dans le wagon : appuyez sur ▶, puis choisissez « Dans le wagon ». La bille tombe-t-elle de la même façon ?</li>
        <li>Colis et avion : regardez depuis le sol, puis depuis l’avion. Où est l’avion quand le colis touche le sol ?</li>
        <li>Deux véhicules : placez-vous « dans le véhicule A ». Comment B vous semble-t-il se déplacer ?</li>
        <li>Bâton : suivez un bout, puis le centre. Lequel a la trajectoire la plus simple ?</li>
      </ul>
    </div>);
  const retenirSimple = (
    <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
      <li>trajectoire : le chemin des points (droite ou courbe)</li>
      <li>points espacés pareil : vitesse constante</li>
      <li>le référentiel est le point de vue de l’observateur</li>
      <li>trajectoire et vitesse dépendent du référentiel</li></ul></ARetenir>);
  const retenir = (
    <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
      <li>trajectoire et vitesse dépendent du référentiel</li>
      <li>v<Ind>B/A</Ind> = v<Ind>B</Ind> − v<Ind>A</Ind></li>
      <li>v ≈ MM′ / Δt : choisir un Δt adapté</li>
      <li>Δv ne dépend pas du référentiel, s’ils sont en translation rectiligne uniforme l’un par rapport à l’autre (galiléens)</li>
      <li>Δv = 0 : les forces se compensent</li></ul></ARetenir>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mr-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .mr-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); }
        .mr-pri.pile { grid-template-columns: minmax(0, 1fr); }
        .mr-pan { display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .mr-l1.cote, .mr-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Référentiel et mouvement : décrire un mouvement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>{compact
        ? 'Un mobile est photographié à intervalles de temps réguliers : chaque point est une photo. Choisissez une situation et l’endroit d’où on observe, puis appuyez sur ▶ pour voir le mouvement se construire.'
        : 'Une chronophotographie : la position d’un mobile, relevée à intervalles de temps égaux Δt. Choisissez une situation, puis un référentiel (le point de vue d’un observateur). On peut afficher le vecteur vitesse, sa variation Δv et comparer deux référentiels.'}</div>
      {mode === 'explore' && <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>Affichage :</span>
        <button onClick={() => setSimple(true)} style={stylePetitBouton(simple, '#16a34a')}>🙂 Simple</button>
        <button onClick={() => setSimple(false)} style={stylePetitBouton(!simple, '#334155')}><Pic n="microscope"/>Complet (Δt, mesures, Δv…)</button></div>}
      <div className={`mr-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && <div style={{ ...styleBoite, marginBottom: 12 }}>
            <VoletDefi defi={defi} setDefi={setDefi} dtChoisi={dt} changerType={t => { const d = nouveauDefi(t); setDefi(d); setEx(e => ({ ...e, ...etatDefi(d), aff: { ...AFF0, v: true, ve: t === 'dt' }, bruit: t === 'dt', i: 4 })); }}/></div>}
          <div className={`mr-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {panneaux}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{compact ? <>{reglagesSimples}{observation}</> : <>{reglages}{mesures}</>}</div>
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="mr-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="mr-l2">{compact ? <>{aEssayerSimple}{retenirSimple}</> : <>{aEssayer}{retenir}</>}</div>}
    </div>
  );
}
