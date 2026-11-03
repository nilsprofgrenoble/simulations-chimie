import { useState, useEffect, useMemo } from "react";
import { useSignalerMode, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireNombre, proche } from "../commun";
import { NU0, MOLECULES, MOL, FAMILLES, NOM_COMPLET, plat, visibles, yRef, spectre, courbeGroupe, courbeZoom, limitesPremierOrdre, hauteurMm } from "./rmnModele";
import { fr } from "./elecModele";
import { BLEU, VERMILLON, VIOLET, GRIS, VERT, alea } from "./elecOutils";
import { VoletDefiGen } from "./elecCommun";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 75 — RMN DU PROTON (BTS Métiers de la chimie, analyse spectroscopique)
//  Du cours « RMN ¹H » et des exercices de révision : protons équivalents, blindage / déplacement chimique, intégration,
//  couplage et règle des n+1, constante J, influence du champ B₀, protons labiles et D₂O.
//  Hypothèses : bibliothèque de molécules décrites à la main (δ et J usuels en solution dans CDCl₃) ; multiplets du premier ordre
//  (règle des n+1, intensités du triangle de Pascal) ; raies lorentziennes ; spectre idéal sans bruit ; couplage vicinal seulement.
// ====================================================

const SIM = 75;
declarerDefis(SIM, [
  ['signaux', 'Prévoir le spectre d’une molécule'],
  ['integration', 'Intégration : combien de H par signal ?'],
  ['identifier', 'Identifier un isomère'],
  ['champ', 'Fréquences, δ et J'],
]);
const TITRES = { signaux: 'Prévoir', integration: 'Intégration', identifier: 'Identifier', champ: 'Fréquences, δ et J' };
const COULS = [BLEU, VERMILLON, VERT, VIOLET, '#b45309', '#0e7490', '#be185d', '#475569'];
const PROPRES = MOLECULES.filter(m => !m.liste.some(x => x.labile));
const XMIN = -0.5;
const K_MM = 5;                    // échelle des paliers d'intégration (mm par proton) en exploration
const nf = (x, d = 2) => fr(x, d);
const nbSignaux = m => m.liste.length;

// ---------- formule semi-développée avec les groupes de protons repérés ----------
function Cycle({ H, couleurs, lettres, cacher }) {
  const cx = 48, cy = 40, r = 24, ang = [180, 120, 60, 0, -60, -120];
  const pos = a => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
  return (
    <svg viewBox="0 0 96 80" width="86" height="72" role="img" aria-label="cycle benzénique" style={{ verticalAlign: 'middle' }}>
      <polygon points={ang.map(a => pos(a).join(',')).join(' ')} fill="none" stroke="#334155" strokeWidth="2"/>
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="#334155" strokeWidth="1.4"/>
      {ang.map((a, i) => { const [x, y] = pos(a), [x2, y2] = [cx + (r + 12) * Math.cos(a * Math.PI / 180), cy - (r + 12) * Math.sin(a * Math.PI / 180)];
        if (!H[i]) return <line key={i} x1={x} y1={y} x2={cx + (r + 16) * Math.cos(a * Math.PI / 180)} y2={cy - (r + 16) * Math.sin(a * Math.PI / 180)} stroke="#334155" strokeWidth="2"/>;
        return <g key={i}><line x1={x} y1={y} x2={x2} y2={y2} stroke="#334155" strokeWidth="1.5"/><circle cx={x2} cy={y2} r="8.5" fill={couleurs[H[i]]}/>
          {!cacher && <text x={x2} y={y2 + 3.8} fontSize="11" fontWeight="800" textAnchor="middle" fill="#fff">{lettres[H[i]]}</text>}</g>; })}
    </svg>);
}
function Formule({ m, sel, onSel, cacher }) {
  const coul = {}, lettre = {};
  m.liste.forEach((x, i) => { coul[x.k] = COULS[i % COULS.length]; lettre[x.k] = x.lettre; });
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, fontSize: 19, color: KIT.txt, lineHeight: 1.1, padding: '6px 2px' }} aria-label={`Formule semi-développée de ${cacher ? 'la molécule étudiée' : m.nom}`}>
      {m.semi.map((t, i) => {
        if (typeof t === 'string') return <span key={i} style={{ padding: '0 1px' }}>{t}</span>;
        if (t.cycle) return <Cycle key={i} H={t.cycle} couleurs={coul} lettres={lettre} cacher={cacher}/>;
        const on = sel === t.g;
        return <button key={i} onClick={() => onSel(on ? null : t.g)} style={{ position: 'relative', font: 'inherit', cursor: 'pointer', padding: '2px 5px 2px 5px', margin: '8px 1px 0', borderRadius: 6,
          border: `2px solid ${coul[t.g]}`, background: on ? `${coul[t.g]}33` : `${coul[t.g]}14`, color: KIT.txt, boxShadow: on ? `0 0 0 2px ${coul[t.g]}55` : 'none' }}>
          {t.t}{!cacher && <span style={{ position: 'absolute', top: -9, right: -6, background: coul[t.g], color: '#fff', borderRadius: 9, minWidth: 17, height: 17, fontSize: 11.5, fontWeight: 800, lineHeight: '17px', textAlign: 'center' }}>{lettre[t.g]}</span>}</button>;
      })}
    </div>);
}

// ---------- spectre complet ----------
function Spectre({ m, nu0, d2o, sel, onSel, integ, cacher, titre }) {
  const W = 720, H = 290, L = 14, R = 14, T = 26, B = 40, pw = W - L - R, ph = H - T - B;
  const gs = visibles(m, d2o), dmax = Math.max(...gs.map(x => x.d), 5), xmin = XMIN, xmax = Math.max(6, Math.ceil(dmax + 1));
  const sp = useMemo(() => spectre(m, nu0, d2o, XMIN, xmax), [m, nu0, d2o, xmax]);
  const gSel = sel ? gs.find(x => x.k === sel) : null;
  const cg = gSel ? courbeGroupe(gSel, nu0, XMIN, xmax) : null;
  const ref = yRef(m) * 1.08, base = T + ph;
  const X = v => L + (xmax - v) / (xmax - xmin) * pw, Y = y => base - Math.min(y / ref, 1.04) * ph * 0.92;
  const sommets = gs.map((x, i) => ({ x, i, c: courbeGroupe(x, nu0, xmin, xmax) }));
  const clic = e => {
    const r = e.currentTarget.getBoundingClientRect(), v = xmax - ((e.clientX - r.left) / r.width * W - L) / pw * (xmax - xmin);
    const p = gs.reduce((b, q) => (Math.abs(q.d - v) < Math.abs(b.d - v) ? q : b), gs[0]);
    if (p && Math.abs(p.d - v) < 0.3) onSel(p.k === sel ? null : p.k);
  };
  const ticks = []; for (let v = 0; v <= xmax; v++) ticks.push(v);
  const pol = (xs, ys, f) => xs.map((x, i) => `${X(x).toFixed(1)},${f(ys[i]).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={titre} onClick={clic} data-testid="spectre"
      style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, cursor: 'pointer' }}>
      {ticks.map(v => <g key={v}><line x1={X(v)} y1={T} x2={X(v)} y2={base} stroke="#eef2f7"/><text x={X(v)} y={base + 15} fontSize="12" textAnchor="middle" fill={GRIS}>{v}</text></g>)}
      <line x1={L} y1={base} x2={W - R} y2={base} stroke="#0f172a" strokeWidth="1.6"/>
      <text x={L + pw / 2} y={H - 8} fontSize="13" fontWeight="700" textAnchor="middle" fill="#0f172a">δ (ppm)</text>
      <text x={W - R - 2} y={base + 28} fontSize="11.5" textAnchor="end" fill={GRIS}>◀ la fréquence augmente</text>
      <polyline fill="none" stroke="#0f172a" strokeWidth="1.3" points={pol(sp.xs, sp.ys, Y)}/>
      {cg && <polyline fill="none" stroke={COULS[m.liste.findIndex(x => x.k === sel) % COULS.length]} strokeWidth="2.6" points={pol(cg.xs, cg.ys, Y)}/>}
      {integ && <polyline fill="none" stroke={VERMILLON} strokeWidth="1.8" strokeOpacity="0.85" points={pol(sp.xs, sp.cum, c => base - 4 - c * ph * 0.55)}/>}
      <text x={X(0)} y={Y(0.25 * yRef(m)) - 6} fontSize="11.5" fontWeight="700" textAnchor="middle" fill={GRIS}>TMS</text>
      {!cacher && sommets.map(({ x, c }) => { const i = m.liste.findIndex(z => z.k === x.k), top = Math.min(...c.ys.map(Y)); return (
        <g key={x.k}><circle cx={X(x.d)} cy={Math.max(top - 14, T - 8)} r="9" fill={COULS[i % COULS.length]}/><text x={X(x.d)} y={Math.max(top - 14, T - 8) + 4} fontSize="12" fontWeight="800" textAnchor="middle" fill="#fff">{x.lettre}</text></g>); })}
      {integ && <text x={L + 4} y={T + 8} fontSize="11.5" fill={VERMILLON} fontWeight="700">— courbe d’intégration</text>}
    </svg>);
}

// ---------- zoom sur un multiplet ----------
function Zoom({ x, nu0 }) {
  const W = 720, H = 190, L = 14, R = 14, T = 26, B = 40, pw = W - L - R, ph = H - T - B, base = T + ph;
  const maxOff = Math.max(...x.lignes.map(r => Math.abs(r.x))), demi = Math.max(18, Math.ceil((maxOff * 1.5 + 8) / 5) * 5);
  const c = useMemo(() => courbeZoom(x, demi), [x, demi]), ymax = Math.max(...c.ys) * 1.1;
  const X = f => L + (f + demi) / (2 * demi) * pw, Y = y => base - y / ymax * ph;
  const pas = demi > 60 ? 20 : demi > 30 ? 10 : 5, ticks = []; for (let f = -Math.floor(demi / pas) * pas; f <= demi; f += pas) ticks.push(f);
  const l0 = x.lignes, J = x.simple && x.J && l0.length >= 2 ? x.J : null, yl = J ? Y(c.ys[Math.round((l0[0].x + demi) / (2 * demi) * 500)] || 0) : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Agrandissement du signal ${x.lettre}`} data-testid="zoom"
      style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      {ticks.map(f => <g key={f}><line x1={X(f)} y1={T} x2={X(f)} y2={base} stroke="#eef2f7"/><text x={X(f)} y={base + 15} fontSize="12" textAnchor="middle" fill={GRIS}>{f}</text></g>)}
      <line x1={L} y1={base} x2={W - R} y2={base} stroke="#0f172a" strokeWidth="1.6"/>
      <text x={L + pw / 2} y={H - 8} fontSize="13" fontWeight="700" textAnchor="middle" fill="#0f172a">écart au centre du signal (Hz)</text>
      <polyline fill="none" stroke="#0f172a" strokeWidth="1.8" points={c.xs.map((f, i) => `${X(f).toFixed(1)},${Y(c.ys[i]).toFixed(1)}`).join(' ')}/>
      {J && <g><line x1={X(l0[0].x)} y1={yl - 8} x2={X(l0[1].x)} y2={yl - 8} stroke={VERMILLON} strokeWidth="2.2"/>
        <line x1={X(l0[0].x)} y1={yl - 14} x2={X(l0[0].x)} y2={yl - 2} stroke={VERMILLON} strokeWidth="2.2"/><line x1={X(l0[1].x)} y1={yl - 14} x2={X(l0[1].x)} y2={yl - 2} stroke={VERMILLON} strokeWidth="2.2"/>
        <text x={(X(l0[0].x) + X(l0[1].x)) / 2} y={yl - 18} fontSize="12.5" fontWeight="800" textAnchor="middle" fill={VERMILLON}>J = {nf(J, 1)} Hz</text></g>}
      <text x={W - R - 4} y={T - 6} fontSize="12" textAnchor="end" fill={GRIS}>signal {x.lettre} à {nu0} MHz</text>
    </svg>);
}

// ---------- tableau d'analyse ----------
function TableAnalyse({ m, d2o, mesures, sel, onSel, k }) {
  const gs = visibles(m, d2o), N = gs.reduce((s, x) => s + x.n, 0), cell = { padding: '4px 6px', textAlign: 'center', fontSize: 13 };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 620, background: 'white' }} data-testid="analyse">
        <thead><tr>{['Signal', 'δ (ppm)', ...(mesures ? ['h (mm)'] : []), 'Nombre de H', 'Multiplicité', 'n + 1', 'n voisins', 'Groupe et commentaire'].map((h, i) => <th key={h} style={{ ...cell, color: KIT.txt2, borderBottom: `1px solid ${KIT.bord}`, textAlign: i === 7 + (mesures ? 1 : 0) ? 'left' : 'center' }}>{h}</th>)}</tr></thead>
        <tbody>{gs.map(x => { const i = m.liste.findIndex(z => z.k === x.k), on = sel === x.k;
          return <tr key={x.k} onClick={() => onSel(on ? null : x.k)} style={{ cursor: 'pointer', background: on ? '#fef9c3' : 'white', borderBottom: `1px solid ${KIT.bord}` }}>
            <td style={cell}><span style={{ display: 'inline-block', background: COULS[i % COULS.length], color: '#fff', borderRadius: 9, minWidth: 18, fontWeight: 800, fontSize: 12 }}>{x.lettre}</span></td>
            <td style={cell}>{nf(x.d)}</td>{mesures && <td style={cell}>{nf(hauteurMm(x.n, k), 1)}</td>}
            <td style={{ ...cell, fontWeight: 700 }}>{x.n}</td><td style={{ ...cell, fontWeight: 700 }}>{x.mult}</td>
            <td style={cell}>{x.simple && !x.labile ? x.nv + 1 : '—'}</td><td style={cell}>{x.labile ? '0' : x.nv}</td>
            <td style={{ ...cell, textAlign: 'left', lineHeight: 1.45 }}><strong>{x.desc}</strong> : {x.com}</td></tr>; })}
          <tr><td style={{ ...cell, fontWeight: 700, textAlign: 'right' }} colSpan={2}>Total</td>{mesures && <td style={{ ...cell, fontWeight: 700 }}>{nf(hauteurMm(N, k), 1)}</td>}<td style={{ ...cell, fontWeight: 800, color: VERT }}>{N}</td><td colSpan={4}/></tr></tbody></table>
    </div>);
}

// ---------- défis ----------
const nouveauK = () => Math.round((3.5 + Math.random() * 3) * 10) / 10;
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'signaux') return { ...base, id: alea(PROPRES).id };
  if (type === 'integration') { const id = alea(PROPRES.filter(x => x.liste.length >= 2 && x.liste.length <= 3)).id; return { ...base, id, k: nouveauK(), bruit: MOL[id].liste.map(() => 1 + (Math.random() - 0.5) * 0.03) }; }
  if (type === 'identifier') { const fam = alea(['C3H6Cl2', 'C4H8O2', 'C3H5ClO2', 'C2H4Cl2']); return { ...base, fam, id: alea(FAMILLES[fam]) }; }
  const nu = alea([60, 90, 300, 400, 500, 600]), nu2 = alea([60, 90, 300, 400, 500, 600].filter(v => v !== nu));
  return { ...base, nu, nu2, d: Math.round((1 + Math.random() * 3) * 100) / 100, J: Math.round((6 + Math.random() * 2) * 10) / 10 };
}
const hauteursDefi = d => MOL[d.id].liste.map((x, i) => Math.round(x.n * d.k * d.bruit[i] * 10) / 10);
function evaluer(d) {
  if (d.type === 'signaux') {
    const m = MOL[d.id], top = m.liste[0], ns = lireNombre(d.reps.n), okN = ns === nbSignaux(m), okM = d.reps.m === top.mult;
    return { ok: okN && okM, lignes: [
      [okN, okN ? 'Nombre de signaux correct.' : 'Un signal par groupe de protons équivalents : repérez les H qui ont le même environnement (symétrie de la molécule).'],
      [okM, okM ? 'Multiplicité correcte.' : 'Comptez les H portés par les carbones voisins (n) : le signal compte n + 1 raies. Les H d’un groupe équivalent ne se couplent pas entre eux.']] };
  }
  if (d.type === 'integration') {
    const m = MOL[d.id], hs = hauteursDefi(d), H = hs.reduce((s, v) => s + v, 0);
    const ok = m.liste.map((x, i) => lireNombre(d.reps['n' + i]) === x.n);
    return { ok: ok.every(Boolean), lignes: m.liste.map((x, i) => [ok[i], ok[i] ? `Signal à ${nf(x.d)} ppm : correct.` : `Signal à ${nf(x.d)} ppm : nombre de H = N × h / H, avec N = ${m.N} et H = ${nf(H, 1)} mm (somme des hauteurs).`]) };
  }
  if (d.type === 'identifier') {
    const ok = d.reps.c === d.id;
    return { ok, lignes: [[ok, ok ? 'Isomère identifié.' : 'Comparez le nombre de signaux, leur intégration et leur multiplicité avec ce que donnerait chaque candidat (n + 1, voisins).']] };
  }
  const J = d.J, dl = d.d, okJ = proche(lireNombre(d.reps.j), J, 0.03), okD = proche(lireNombre(d.reps.d), dl, 0.01), okE = proche(lireNombre(d.reps.e), 2 * J / d.nu2, 0.03);
  return { ok: okJ && okD && okE, lignes: [
    [okJ, okJ ? 'J correct.' : 'J est l’écart (en Hz) entre deux raies voisines du multiplet.'],
    [okD, okD ? 'δ correct.' : 'δ = (f − f₀) / f₀ : la fréquence de la raie centrale, divisée par ν₀ (en MHz), donne δ en ppm.'],
    [okE, okE ? 'Écart en ppm correct.' : 'J ne dépend pas de B₀ : l’écart entre raies extrêmes vaut toujours 2 J en Hz. Pour l’exprimer en ppm, divisez par la fréquence ν₀ du nouveau spectromètre (en MHz).']] };
}
const enonce = (d, { champ, choix }) => {
  if (d.type === 'signaux') { const m = MOL[d.id];
    return <><Pic n="target"/>Prévoyez le spectre RMN ¹H de <strong>{m.nom}</strong> ({m.brute}) : <strong style={{ whiteSpace: 'nowrap' }}>{plat(m)}</strong>.
      <div style={{ marginTop: 6 }}><strong>1.</strong> Nombre de signaux : {champ('n', '')}</div>
      <div style={{ marginTop: 6 }}><strong>2.</strong> Multiplicité du signal le plus déblindé (δ le plus grand) : {choix('m', [['s', 'singulet'], ['d', 'doublet'], ['t', 'triplet'], ['q', 'quadruplet'], ['quint', 'quintuplet'], ['sext', 'sextuplet'], ['sept', 'septuplet'], ['m', 'multiplet']])}</div></>; }
  if (d.type === 'integration') { const m = MOL[d.id], hs = hauteursDefi(d);
    return <><Pic n="target"/>Le composé de formule brute <strong>{m.brute}</strong> ({m.N} protons) donne le spectre ci-dessous. Hauteurs des paliers de la courbe d’intégration, de la gauche vers la droite :
      <div style={{ overflowX: 'auto', margin: '6px 0' }}><table style={{ borderCollapse: 'collapse', background: 'white', fontSize: 13.5 }}><tbody>
        <tr><td style={{ padding: '2px 8px', fontWeight: 700 }}>δ (ppm)</td>{m.liste.map(x => <td key={x.k} style={{ padding: '2px 10px', textAlign: 'right' }}>{nf(x.d)}</td>)}</tr>
        <tr><td style={{ padding: '2px 8px', fontWeight: 700 }}>h (mm)</td>{hs.map((h, i) => <td key={i} style={{ padding: '2px 10px', textAlign: 'right' }}>{nf(h, 1)}</td>)}</tr></tbody></table></div>
      {m.liste.map((x, i) => <div key={x.k} style={{ marginTop: 6 }}><strong>{i + 1}.</strong> Nombre de H du signal à {nf(x.d)} ppm : {champ('n' + i, '')}</div>)}</>; }
  if (d.type === 'identifier') { const m = MOL[d.id], cands = FAMILLES[d.fam];
    return <><Pic n="target"/>Un composé de formule brute <strong>{m.brute}</strong> donne le spectre RMN ¹H ci-dessous. Quel est cet isomère ?
      <div style={{ overflowX: 'auto', margin: '6px 0' }}><table style={{ borderCollapse: 'collapse', background: 'white', fontSize: 13.5 }}>
        <thead><tr>{['δ (ppm)', 'multiplicité', 'nombre de H'].map(h => <th key={h} style={{ padding: '2px 10px', textAlign: 'right', color: KIT.txt2 }}>{h}</th>)}</tr></thead>
        <tbody>{m.liste.map(x => <tr key={x.k}><td style={{ padding: '2px 10px', textAlign: 'right' }}>{nf(x.d)}</td><td style={{ padding: '2px 10px', textAlign: 'right' }}>{x.mult}</td><td style={{ padding: '2px 10px', textAlign: 'right' }}>{x.n}</td></tr>)}</tbody></table></div>
      {choix('c', cands.map(c => [c, `${MOL[c].nom} : ${plat(MOL[c])}`]))}</>; }
  const f = (v, dd = 1) => fr(v, dd);
  return <><Pic n="target"/>Un triplet est enregistré sur un spectromètre de <strong>{d.nu} MHz</strong>. Ses trois raies sont à <strong>{f(d.d * d.nu - d.J, 1)} Hz</strong>, <strong>{f(d.d * d.nu, 1)} Hz</strong> et <strong>{f(d.d * d.nu + d.J, 1)} Hz</strong> du TMS.
    <div style={{ marginTop: 6 }}><strong>1.</strong> Constante de couplage J : {champ('j', 'Hz')}</div>
    <div style={{ marginTop: 6 }}><strong>2.</strong> Déplacement chimique du signal : {champ('d', 'ppm')}</div>
    <div style={{ marginTop: 6 }}><strong>3.</strong> On refait l’enregistrement à <strong>{d.nu2} MHz</strong> : écart entre les raies extrêmes du triplet, en ppm : {champ('e', 'ppm')}</div></>;
};
const solution = d => {
  if (d.type === 'signaux') { const m = MOL[d.id], t = m.liste[0];
    return <>{nbSignaux(m)} groupes de H équivalents → <strong>{nbSignaux(m)} signaux</strong>. Le plus déblindé ({t.desc}, δ ≈ {nf(t.d)} ppm) a <strong>n = {t.nv}</strong> H voisins : <strong>{NOM_COMPLET[t.mult]}</strong>{t.simple && t.nv ? ` (n + 1 = ${t.nv + 1} raies)` : ''}.</>; }
  if (d.type === 'integration') { const m = MOL[d.id], hs = hauteursDefi(d), H = hs.reduce((s, v) => s + v, 0);
    return <>H = {hs.map(v => nf(v, 1)).join(' + ')} = {nf(H, 1)} mm pour N = {m.N} protons. nombre de H = N × h / H : {m.liste.map((x, i) => `${m.N} × ${nf(hs[i], 1)} / ${nf(H, 1)} = ${nf(m.N * hs[i] / H, 1)} → ${x.n}`).join(' ; ')}.</>; }
  if (d.type === 'identifier') { const m = MOL[d.id];
    return <>C’est le <strong>{m.nom}</strong> ({plat(m)}) : {m.liste.map(x => `${x.desc} (${nf(x.d)} ppm, ${x.mult}, ${x.n} H)`).join(' ; ')}.</>; }
  return <>J = {nf(d.J, 1)} Hz (écart entre deux raies voisines). δ = f / ν₀ = {nf(d.d * d.nu, 1)} / {d.nu} = <strong>{nf(d.d)} ppm</strong>. À {d.nu2} MHz, J est inchangé : 2 J = {nf(2 * d.J, 1)} Hz, soit 2 J / ν₀ = {nf(2 * d.J, 1)} / {d.nu2} = <strong>{nf(2 * d.J / d.nu2, 4)} ppm</strong>.</>;
};

// ====================================================
export function SimulationRMN() {
  const [mode, setMode] = useState(() => modeOuverture('rmn-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('rmn-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [molId, setMolId] = useState('bromobutane');
  const [nu0, setNu0] = useState(400);
  const [d2o, setD2o] = useState(false);
  const [sel, setSel] = useState(null);
  const [integ, setInteg] = useState(true);
  const [mesures, setMesures] = useState(false);
  const [corrige, setCorrige] = useState(true);
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const defiSpectre = enDefi && (defi.type === 'integration' || defi.type === 'identifier');
  const m = defiSpectre ? MOL[defi.id] : MOL[molId];
  const gSel = sel ? visibles(m, d2o).find(x => x.k === sel) : null;
  const limites = limitesPremierOrdre(m, nu0, d2o);

  const voir = o => {
    if (o.mol !== undefined) setMolId(o.mol); setNu0(o.nu0 ?? 400); setD2o(!!o.d2o); setSel(o.sel ?? null);
    setMesures(!!o.mesures); setCorrige(!!o.corrige); setInteg(o.integ ?? true);
  };
  const ETAPES = [
    { id: 'principe', titre: 'Du signal radio au déplacement chimique', depart: () => voir({ mol: 'neopentyl', corrige: false }),
      texte: <>Un échantillon placé dans un champ magnétique intense B₀ absorbe des ondes radio pour certaines fréquences : c’est la <strong>résonance</strong> des noyaux d’hydrogène (protons). Chaque groupe de protons équivalents absorbe à sa propre fréquence f, et donne un <strong>signal</strong> sur le spectre. On repère f par rapport à celle du TMS, tétraméthylsilane (δ = 0), grâce au <strong>déplacement chimique</strong> :
        <div style={{ textAlign: 'center', fontSize: 16, margin: '6px 0' }}><strong>δ = (f − f₀) / f₀</strong> (en ppm, 1 ppm = 10⁻⁶)</div>
        <ExempleResolu>Spectromètre de 60 MHz (f₀ = 60 000 000 Hz) : un signal à δ = 2 ppm est à f − f₀ = 2×10⁻⁶ × 60×10⁶ = <strong>120 Hz</strong> du TMS.</ExempleResolu>
        Spectromètre de 400 MHz : le signal du CH₃ du 1-bromo-2,2-diméthylpropane est à δ = 1,05 ppm.</>,
      tache: { type: 'num', q: 'Écart de fréquence f − f₀ entre ce signal et le TMS (en Hz)', unite: 'Hz', vrai: 1.05 * 400, tol: 0.01, affiche: x => fr(x, 0),
        calcul: () => ['δ = (f − f₀) / f₀, donc f − f₀ = δ × f₀. Ici δ = 1,05 ppm = 1,05 × 10⁻⁶ et f₀ = 400 MHz = 400 × 10⁶ Hz.',
          'f − f₀ = 1,05 × 10⁻⁶ × 400 × 10⁶ Hz : les puissances de 10 se simplifient, il reste 1,05 × 400.',
          `f − f₀ = ${fr(1.05 * 400, 0)} Hz.`],
        pieges: [[1.05 / 400, 'f − f₀ = δ × f₀ : multipliez δ (ppm) par la fréquence en MHz pour obtenir des Hz.']], expl: 'f − f₀ = δ × ν₀ = 1,05 × 400 = 420 Hz.' } },
    { id: 'equivalents', titre: 'Protons équivalents : un signal par groupe', depart: () => voir({ mol: 'ethoxyethane', corrige: false }),
      texte: <>Des protons sont <strong>équivalents</strong> s’ils ont le même environnement chimique (même distance aux autres atomes, en particulier par symétrie) : ils résonnent à la même fréquence et donnent <strong>un seul signal</strong>. Sur la formule, les H d’un même groupe ont la même couleur et la même lettre : les deux CH₃ de l’éthoxyéthane sont équivalents, comme les deux CH₂. Cliquez sur un groupe pour voir son signal.</>,
      tache: { type: 'qcm', q: 'Combien de signaux donne le spectre RMN ¹H du 1,2-dichloroéthane Cl–CH₂–CH₂–Cl ?', options: ['1', '2', '3', '4'], bonne: 0, expl: 'Les quatre H sont équivalents par symétrie : un seul signal (un singulet).' } },
    { id: 'blindage', titre: 'Blindage et déblindage', depart: () => voir({ mol: 'bromobutane', corrige: false }),
      texte: <>Un atome électronégatif (O, N, Cl, Br…) attire les électrons : la densité électronique diminue autour des protons proches, qui sont <strong>déblindés</strong> et résonnent à un δ <strong>plus élevé</strong> (plus à gauche sur le spectre). Plus on s’éloigne de l’atome électronégatif, plus l’effet s’atténue. Regardez les déplacements chimiques du 1-bromobutane en cliquant sur chaque groupe.</>,
      tache: { type: 'qcm', q: 'Dans le 1-bromobutane, quel groupe de H est le plus déblindé ?', options: ['le CH₂ lié à Br', 'le CH₃ à l’autre bout', 'le CH₂ voisin du CH₃', 'tous de la même façon'], bonne: 0, expl: 'Le CH₂Br est le plus proche du brome (δ ≈ 3,4 ppm) ; le CH₃, le plus éloigné, est le plus blindé (δ ≈ 0,9 ppm).' } },
    { id: 'integration', titre: 'L’intégration : combien de H par signal ?', depart: () => voir({ mol: 'neopentyl', mesures: true, corrige: false }),
      texte: <>L’aire d’un signal est proportionnelle au nombre de protons du groupe. La <strong>courbe d’intégration</strong> (en rouge) monte d’un palier à chaque signal : la hauteur h du palier est proportionnelle au nombre de H. Avec H la hauteur totale et N le nombre total de protons de la molécule : <strong>nombre de H = N × h / H</strong>.
        <ExempleResolu>Sur le spectre du 1-bromo-2,2-diméthylpropane (C₅H₁₁Br, N = 11), les paliers mesurent 45 mm (δ = 1,05 ppm) et 10 mm (δ = 3,30 ppm) : H = 55 mm.</ExempleResolu></>,
      tache: { type: 'num', q: 'Nombre de H du signal à 3,30 ppm', unite: '', vrai: 2, tol: 0.001, affiche: x => String(x),
        calcul: () => ['Hypothèse : la hauteur d’un palier d’intégration est proportionnelle au nombre de H du signal (même noyau ¹H, spectre quantitatif).',
          'Hauteur totale : H = 45 + 10 = 55 mm. Nombre total de protons : N = 11 (C₅H₁₁Br).',
          'Nombre de H = N × h / H = 11 × 10 / 55 = 110 / 55 = 2.'],
        pieges: [[9, 'C’est le nombre de H de l’autre signal (45 mm).'], [10, 'Il faut calculer N × h / H, et non reprendre la hauteur.'],
          [10 / 55, 'Il manque le nombre total de protons N = 11 : nombre de H = N × h / H.'],
          [11 * 55 / 10, 'Rapport à l’envers : c’est h / H (hauteur du signal sur hauteur totale), multiplié par N.']], expl: 'N × h / H = 11 × 10 / 55 = 2 H.' } },
    { id: 'couplage', titre: 'Le couplage entre protons voisins', depart: () => voir({ mol: 'ethoxyethane', sel: 'ch2', corrige: false }),
      texte: <>Deux protons <strong>voisins non équivalents</strong> (au plus 3 liaisons simples entre eux) interagissent : c’est le <strong>couplage</strong>. Le signal n’est plus un pic unique mais un groupe de raies. <strong>Règle des n + 1</strong> : un groupe de protons ayant <strong>n</strong> protons voisins équivalents donne un signal de <strong>n + 1</strong> raies. Les protons équivalents ne se couplent pas entre eux. Ici, le CH₂ de l’éthoxyéthane est un quadruplet.</>,
      tache: { type: 'qcm', q: 'Pourquoi le signal du CH₂ de l’éthoxyéthane est-il un quadruplet ?', options: ['il a 3 H voisins (ceux du CH₃) : n + 1 = 4', 'il contient 4 H', 'il est lié à un atome d’oxygène', 'il a 4 H voisins'], bonne: 0, expl: 'Chaque H du CH₂ « voit » les 3 H du CH₃ voisin : n = 3, donc n + 1 = 4 raies. (Les 4 H du CH₂ ne se couplent pas entre eux.)' } },
    { id: 'pascal', titre: 'Les intensités : le triangle de Pascal', depart: () => voir({ mol: 'dibromopropane', sel: 'ce', corrige: false }),
      texte: <>Les raies d’un multiplet n’ont pas la même intensité : elles suivent le <strong>triangle de Pascal</strong>. Doublet 1 : 1 ; triplet 1 : 2 : 1 ; quadruplet 1 : 3 : 3 : 1 ; quintuplet 1 : 4 : 6 : 4 : 1. Dans le 1,3-dibromopropane, le CH₂ central est voisin des 4 H des deux CH₂Br (ils sont équivalents entre eux).</>,
      tache: { type: 'qcm', q: 'Quelle est la multiplicité du signal du CH₂ central du 1,3-dibromopropane ?', options: ['triplet', 'quadruplet', 'quintuplet', 'sextuplet'], bonne: 2, expl: 'n = 4 H voisins équivalents : n + 1 = 5 raies, d’intensités 1 : 4 : 6 : 4 : 1.' } },
    { id: 'j', titre: 'La constante de couplage J', depart: () => voir({ mol: 'bromobutane', sel: 'br', corrige: false }),
      texte: <>L’écart entre deux raies voisines d’un multiplet est la <strong>constante de couplage J</strong>, mesurée en <strong>Hz</strong> (de 0 à 20 Hz). Elle ne dépend <strong>pas</strong> du champ B₀. Pour la convertir en ppm, on divise par la fréquence ν₀ du spectromètre (en MHz) : J (ppm) = J (Hz) / ν₀ (MHz). Le triplet du CH₂Br du 1-bromobutane a J = 7,0 Hz et le spectre est enregistré à 400 MHz.</>,
      tache: { type: 'num', q: 'Écart entre deux raies voisines, en ppm', unite: 'ppm', vrai: 7 / 400, tol: 0.02, affiche: x => fr(x, 4),
        calcul: () => ['J ne dépend pas du champ : J = 7,0 Hz. Pour l’exprimer en ppm, on divise par la fréquence du spectromètre en MHz : J (ppm) = J (Hz) / ν₀ (MHz).',
          `J (ppm) = 7,0 / 400 = ${fr(7 / 400, 4)} ppm.`],
        pieges: [[7, 'Ici J est en Hz : divisez par ν₀ (400 MHz) pour obtenir des ppm.'], [400 / 7, 'Rapport à l’envers : J (ppm) = J (Hz) / ν₀ (MHz).']], expl: 'J / ν₀ = 7,0 / 400 = 0,0175 ppm.' } },
    { id: 'champ', titre: 'Effet du champ B₀', depart: () => voir({ mol: 'bromobutane', corrige: false }),
      texte: <>Un spectromètre de fréquence ν₀ plus faible disperse moins les signaux. Utilisez les boutons de fréquence sous la molécule : réglez <strong>60 MHz</strong> et observez les multiplets.</>,
      tache: { type: 'action', ok: enGuide && nu0 <= 90, consigne: 'Réglez le spectromètre sur 60 MHz (ou 90 MHz).' } },
    { id: 'champ2', titre: 'Pourquoi des champs de plus en plus intenses ?', depart: () => voir({ mol: 'bromobutane', nu0: 60, corrige: false }),
      texte: <>À 60 MHz, les multiplets sont <strong>plus larges en ppm</strong> : J = 7 Hz représente 7/60 = 0,12 ppm contre 0,0175 ppm à 400 MHz. Les signaux se chevauchent. Les écarts entre signaux, eux, augmentent en Hz proportionnellement à ν₀ (Δf = Δδ × ν₀). Remarquez aussi l’avertissement sous le spectre : quand l’écart entre deux signaux couplés devient comparable à J, la règle des n + 1 n’est plus rigoureuse.</>,
      tache: { type: 'qcm', q: 'Quand ν₀ augmente, que se passe-t-il ?', options: ['δ (ppm) et J (Hz) ne changent pas, mais les signaux et multiplets sont mieux séparés', 'J (Hz) augmente comme ν₀', 'δ (ppm) augmente comme ν₀', 'le nombre de raies d’un multiplet augmente'], bonne: 0, expl: 'δ et J sont des grandeurs intrinsèques de la molécule. En revanche les écarts en Hz entre signaux croissent avec ν₀ alors que J ne bouge pas : les multiplets sont plus étroits en ppm et se chevauchent moins.' } },
    { id: 'labiles', titre: 'Les protons labiles et l’eau lourde', depart: () => voir({ mol: 'ethanol', corrige: false }),
      texte: <>Les H des groupes <strong>OH, NH₂, COOH</strong> sont <strong>labiles</strong> : ils s’échangent rapidement avec ceux d’autres molécules. Ils ne se couplent pas (signal singulet élargi) et leur δ varie avec la concentration. Si l’on ajoute de l’eau lourde D₂O, ils sont remplacés par du deutérium, invisible en RMN ¹H : <strong>le signal disparaît</strong>. Dans l’éthanol, cliquez sur « Ajouter D₂O ».</>,
      tache: { type: 'action', ok: enGuide && molId === 'ethanol' && d2o, consigne: 'Ajoutez D₂O à l’éthanol et observez quel signal disparaît.' } },
    { id: 'methode', titre: 'La méthode d’analyse d’un spectre', depart: () => voir({ mol: 'acetateethyle', corrige: true }),
      texte: <>Méthode : <strong>1.</strong> compter les signaux (groupes de H équivalents) ; <strong>2.</strong> utiliser l’intégration (nombre de H par signal) ; <strong>3.</strong> analyser la multiplicité (nombre de voisins n) ; <strong>4.</strong> utiliser les tables de δ pour confirmer. Le tableau d’analyse reprend ces étapes pour l’éthanoate d’éthyle (cliquez sur une ligne pour repérer le signal).</>,
      tache: { type: 'qcm', q: 'Dans l’éthanoate d’éthyle, pourquoi le CH₂ est-il le groupe le plus déblindé (δ ≈ 4,1 ppm) ?', options: ['il est lié à l’atome d’oxygène de l’ester', 'il est le plus riche en H', 'il est un quadruplet', 'il est loin des atomes électronégatifs'], bonne: 0, expl: 'L’oxygène, très électronégatif, appauvrit en électrons les H du CH₂ qui lui est lié. Que ce soit un quadruplet est une conséquence des 3 H voisins, pas une cause du déblindage.' } },
    { id: 'aromatique', titre: 'Effet mésomère : nitro ou amino ?', depart: () => voir({ mol: 'aminobenzoate', corrige: true }),
      texte: <>Sur un cycle benzénique, un groupe <strong>donneur</strong> (+M, comme NH₂) enrichit le cycle en électrons et <strong>blinde</strong> les H voisins ; un groupe <strong>attracteur</strong> (−M, comme NO₂ ou C=O) l’appauvrit et les <strong>déblinde</strong>. Comparez avec le 4-nitrobenzoate d’éthyle (changez de molécule).</>,
      tache: { type: 'qcm', q: 'Pourquoi les H aromatiques ortho à NH₂ sont-ils à 6,63 ppm, bien plus blindés que ceux ortho à NO₂ (8,29 ppm) ?', options: ['NH₂ est donneur (+M) et NO₂ attracteur (−M)', 'NH₂ est plus électronégatif que NO₂', 'NO₂ est labile', 'les H ortho à NH₂ sont plus nombreux'], bonne: 0, expl: 'Le doublet de l’azote de NH₂ se délocalise dans le cycle (effet mésomère donneur) et augmente la densité électronique autour des H ortho : blindage. NO₂ attire les électrons : déblindage.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li><strong>Nombre de signaux</strong> = nombre de groupes de H équivalents.</li>
        <li><strong>δ</strong> = (f − f₀) / f₀ : plus un proton est déblindé, plus δ est grand.</li>
        <li><strong>Intégration</strong> : nombre de H = N × h / H.</li>
        <li><strong>Multiplicité</strong> : n voisins équivalents → n + 1 raies (Pascal). J en Hz, indépendante de B₀.</li>
        <li>H labiles (OH, NH, COOH) : singulet, disparaissent avec D₂O.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { setDefi(nouveauDefi(type)); setSel(null); setD2o(false); setNu0(400); }
  function changerMode(md) { setMode(md); setSel(null); if (md === 'defi') lancer(defi ? defi.type : 'signaux'); else if (md === 'explore') { setCorrige(true); setMesures(false); } }
  const choisirMol = id => { setMolId(id); setSel(null); setD2o(false); };

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Bibliothèque de molécules décrites à la main</strong> : le simulateur ne prédit pas le spectre d’une molécule quelconque. Les δ et J sont des valeurs usuelles en solution dans CDCl₃ (à ± 0,1 à 0,2 ppm selon le solvant et la concentration, voir les tables de δ de ton cours).</li>
      <li><strong>Multiplets du premier ordre</strong> : règle des n + 1 et intensités du triangle de Pascal. Valable si l’écart de fréquence entre deux signaux couplés est très supérieur à J (au moins 10 J). Sinon, les intensités se déforment (« effet de toit ») et les raies peuvent changer de nombre : le simulateur ne les représente pas et affiche un avertissement. C’est le cas des systèmes aromatiques para-disubstitués (nitro, amino) et de tout spectre à 60 MHz.</li>
      <li><strong>Couplage vicinal seulement</strong> (³J, protons séparés par 3 liaisons). Les couplages à longue distance (⁴J, ⁵J) sont ignorés, sauf le couplage CH₂–CHO du propanal (J ≈ 1,5 Hz). Les protons <strong>diastéréotopiques</strong> (deux H d’un CH₂ non équivalents, par exemple près d’un centre stéréogène ou dans un cycle) ne sont pas traités : le spectre d’un cycle substitué comme le nipécotate d’éthyle est bien plus complexe que ce modèle.</li>
      <li><strong>Protons équivalents</strong> : ils sont supposés rigoureusement équivalents (rotation libre autour des liaisons simples).</li>
      <li><strong>Protons labiles</strong> : δ fixé arbitrairement (il varie avec la concentration et le solvant), signal élargi et sans couplage ; D₂O les efface complètement.</li>
      <li><strong>Spectre idéal</strong> : raies lorentziennes de largeur constante, sans bruit, sans ligne de base. Les hauteurs de palier de l’intégration sont exactement proportionnelles au nombre de H (une vraie intégration est précise à quelques pour cent).</li>
      <li><strong>Pas de ¹³C, ni de RMN 2D, ni d’autres noyaux</strong> dans cette simulation.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aLabile = m.liste.some(x => x.labile);

  const barre = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
      {!defiSpectre && <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Molécule :{' '}
        <select value={molId} onChange={e => choisirMol(e.target.value)} aria-label="Molécule" style={{ fontSize: 14, padding: '3px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, maxWidth: 280 }}>
          {MOLECULES.map(x => <option key={x.id} value={x.id}>{x.nom} ({x.brute})</option>)}</select></label>}
      {defiSpectre && <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Composé étudié : formule brute {m.brute}</span>}
      {!defiSpectre && <><span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Spectromètre :</span>
        {NU0.map(v => <button key={v} onClick={() => setNu0(v)} style={stylePetitBouton(nu0 === v, '#0f766e')}>{v} MHz</button>)}</>}
    </div>);
  const planche = (
    <div style={styleBoite}>
      {barre}
      {!defiSpectre && <Formule m={m} sel={sel} onSel={setSel} cacher={false}/>}
      <div style={{ fontSize: 13, color: KIT.txt2, margin: '2px 0 6px' }}>👆 Cliquez sur un signal du spectre ou sur un groupe de la formule pour l’agrandir.</div>
      <Spectre m={m} nu0={nu0} d2o={d2o} sel={sel} onSel={setSel} integ={integ} cacher={defiSpectre} titre={`Spectre RMN du proton ${defiSpectre ? 'du composé inconnu' : 'de ' + m.nom}`}/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button onClick={() => setInteg(v => !v)} style={stylePetitBouton(integ, VERMILLON)}>{integ ? '✓ ' : ''}Courbe d’intégration</button>
        {!defiSpectre && aLabile && <button onClick={() => setD2o(v => !v)} style={stylePetitBouton(d2o, '#334155')}>{d2o ? '✓ ' : ''}Ajouter D₂O</button>}
        {!defiSpectre && <button onClick={() => setMesures(v => !v)} style={stylePetitBouton(mesures, '#334155')}>{mesures ? '✓ ' : ''}Mesurer les paliers</button>}
        {d2o && <span style={{ fontSize: 13, color: KIT.txt2, alignSelf: 'center' }}>Les H labiles ont été échangés avec D₂O : leur signal a disparu.</span>}</div>
      {limites.length > 0 && !defiSpectre && <div style={{ fontSize: 13, color: '#b45309', marginTop: 6, lineHeight: 1.5 }}><Pic n="warn"/>À {nu0} MHz, {limites.map(o => `les signaux ${o.a} et ${o.b} (couplés) sont séparés de ${nf(o.dnu, 0)} Hz seulement, soit ${nf(o.r, 1)} J`).join(' ; ')} : la règle des n + 1 n’est plus rigoureuse (intensités déformées, « effet de toit », non représentées ici).</div>}
      {mesures && !defiSpectre && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 6, lineHeight: 1.6 }}><strong>Paliers (échelle fictive : {K_MM} mm par proton)</strong> : {visibles(m, d2o).map(x => `${x.lettre} (${nf(x.d)} ppm) : ${nf(hauteurMm(x.n, K_MM), 1)} mm`).join(' ; ')}. Hauteur totale {nf(hauteurMm(visibles(m, d2o).reduce((s, x) => s + x.n, 0), K_MM), 1)} mm pour N = {visibles(m, d2o).reduce((s, x) => s + x.n, 0)} H.</div>}
      {!defiSpectre && <div style={{ marginTop: 10 }}>
        {gSel ? <div>
          <Zoom x={gSel} nu0={nu0}/>
          <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.65, marginTop: 6 }}>
            <strong>Signal {gSel.lettre} ({gSel.desc})</strong> : δ = {nf(gSel.d)} ppm, soit f − f₀ = δ × ν₀ = {nf(gSel.d)} × {nu0} = <strong>{nf(gSel.d * nu0, 0)} Hz</strong> du TMS.
            <br/>{gSel.labile ? <>H labile : pas de couplage, <strong>singulet élargi</strong>.</> : gSel.nv === 0 ? <>Aucun H voisin non équivalent : <strong>singulet</strong>.</>
              : gSel.simple ? <>n = {gSel.nv} H voisins équivalents → n + 1 = {gSel.nv + 1} raies : <strong>{NOM_COMPLET[gSel.mult]}</strong>, J = {nf(gSel.J, 1)} Hz = J / ν₀ = {nf(gSel.J, 1)} / {nu0} = {nf(gSel.J / nu0, 4)} ppm.</>
                : <>Couplé à des H voisins avec <strong>plusieurs constantes J différentes</strong> ({gSel.coupl.map(c => `${c.n} H, J = ${nf(c.J, 1)} Hz`).join(' ; ')}) : <strong>{NOM_COMPLET[gSel.mult]}</strong>.</>}
          </div></div> : <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Sélectionnez un signal pour voir son multiplet agrandi, avec l’échelle en Hz.</div>}
      </div>}
      {!defiSpectre && <div style={{ marginTop: 10 }}>
        {!corrige && <button onClick={() => setCorrige(true)} style={styleBouton(true, '#0ea5e9')}><Pic n="eye"/>Afficher le tableau d’analyse</button>}
        {corrige && <><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Tableau d’analyse</div><TableAnalyse m={m} d2o={d2o} mesures={mesures} sel={sel} onSel={setSel} k={K_MM}/></>}
      </div>}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>1,3-dichloropropane, 2,2-dichloropropane, 1,1-dichloropropane : mêmes formule brute, trois spectres. Qu’est-ce qui les distingue ?</li>
        <li>Éthanoate d’éthyle et propanoate de méthyle (C₄H₈O₂) : quels signaux changent de multiplicité ?</li>
        <li>Éthanol : ajoutez D₂O. Quel signal disparaît, et que devient la multiplicité du CH₂ (si on supprimait l’échange) ?</li>
        <li>Passez de 400 MHz à 60 MHz : que deviennent les multiplets en ppm ? Et J en Hz ?</li>
        <li>4-aminobenzoate et 4-nitrobenzoate d’éthyle : comparez les δ des H aromatiques. Pourquoi ?</li>
        <li>Propanal : pourquoi le H du CHO est-il à 9,8 ppm ? Pourquoi le CH₂ est-il un multiplet ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>signaux = groupes de H équivalents</li><li>δ = (f − f₀) / f₀ ; déblindé → δ grand</li><li>nombre de H = N × h / H</li><li>n voisins → n + 1 raies ; J en Hz, indépendante de B₀</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);
  const planDefi = defiSpectre ? (
    <div style={styleBoite}>
      <Spectre m={m} nu0={400} d2o={false} sel={null} onSel={() => {}} integ cacher titre="Spectre RMN du proton du composé inconnu"/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Spectre à 400 MHz. Courbe d’intégration en rouge.</div></div>) : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rmn-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rmn-l1.cote { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); }
        .rmn-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .rmn-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>RMN du proton : du spectre à la structure</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Un spectre de <strong>RMN ¹H</strong> contient quatre informations : le <strong>nombre de signaux</strong>, leur <strong>déplacement chimique</strong>, leur <strong>intégration</strong> et leur <strong>multiplicité</strong>. Apprenez à les lire pour retrouver la structure d’une molécule.</div>
      <div className={`rmn-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution}/></div>}
          {enDefi ? planDefi : planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="rmn-l2">{panneauHypo}</div>}
      {enExplore && <div className="rmn-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
