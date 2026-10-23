import { useState } from "react";
import { NIVEAUX_ETALON, ETAL_MAX, ECH_MAX, T_PREP, T_INJ, C_IS, TR, M_POUDRE, POUDRES_HUILE, HUILE_MAX_ESSAIS, HUILE_DUREE, etatPate, rapportPate, DOSES_BANC, ESSAIS_MAX, DUREE_ESSAI, DOSES_COURBE, COURBE_MAX, COURBE_DUREE, masseCoadis } from "./stationsModele";
import { essaiBanc, indiceBanc, INDICES_BANC, essaiCourbe, indiceCourbe, INDICES_COURBE, conclureHuile, huileRetenue, phVrai, cpgDe, injecterEtalon, preparerEchantillon, injecterEchantillon, choisirModeCpg, resultatCpg, injecterControle, recuperation, C_CTRL, TMFF_MAX, COV_MAX, nf, fmDepuisFlags, FM_CHAMPS, validerFormule, controlesFormule } from "./laboJournee";
import { proprietes } from "./Peinture";

// ====================================================
//  Stations immersives de la journée au labo (écrans dédiés, paramètres cachés).
//  Station « banc TMFF » : l'élève teste des doses de coalescent, lit la température de formation de film et décide.
// ====================================================
const ENCRE = '#1e3a8a', DOUX = '#5b6472', VERT = '#15803d', ROUGE = '#b91c1c', AMBRE = '#b45309';

// Bande de peinture sur la plaque : poudreuse/craquelée sous la TMFF, continue au-dessus (0 à 25 °C)
function Bande({ essai }) {
  const W = 420, x = T => 10 + T / 25 * (W - 20), lu = essai.tmff;
  const fin = lu == null ? 10 : x(lu);
  return (
    <svg viewBox={`0 0 ${W} 92`} role="img" aria-label={lu == null ? 'Film continu sur toute la plaque' : `Film continu à partir de ${nf(lu, 1)} °C`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto' }}>
      <defs><linearGradient id="gb" x1="0" x2="1"><stop offset="0" stopColor="#7dd3fc" /><stop offset="1" stopColor="#fda4af" /></linearGradient>
        <pattern id="crq" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#e5e1d6" /><path d="M0 3 L4 5 L9 2 M4 5 L3 9 M6 0 L5 5" stroke="#8b8576" strokeWidth=".9" fill="none" /></pattern></defs>
      <rect x="10" y="4" width={W - 20} height="12" rx="3" fill="url(#gb)" />
      <rect x="10" y="22" width={W - 20} height="34" rx="3" fill="#cbd5e1" />
      <rect x="10" y="26" width={Math.max(0, fin - 10)} height="26" fill="url(#crq)" />
      <rect x={fin} y="26" width={Math.max(0, W - 10 - fin)} height="26" fill="#fafaf7" stroke="#e5e7eb" />
      {lu != null && <><line x1={fin} x2={fin} y1="20" y2="60" stroke={ENCRE} strokeWidth="2" /><text x={fin} y="74" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>{nf(lu, 1)} °C</text></>}
      <line x1={x(TMFF_MAX)} x2={x(TMFF_MAX)} y1="20" y2="60" stroke={VERT} strokeWidth="2" strokeDasharray="4 3" />
      <text x={x(TMFF_MAX)} y="88" textAnchor="middle" fontSize="11" fill={VERT}>limite {TMFF_MAX} °C</text>
      {[0, 5, 10, 15, 20, 25].map(T => <text key={T} x={x(T)} y="12" textAnchor="middle" fontSize="9" fill="#334155">{T}</text>)}
    </svg>);
}

export function StationBanc({ e, onEtat, onValider, choixDose }) {
  const banc = e.f.banc || [], restant = ESSAIS_MAX - banc.length, dernier = banc[banc.length - 1];
  const testees = new Set(banc.map(x => x.g)), indices = e.f.indB || 0;
  const bouton = (actif) => ({ padding: '8px 14px', borderRadius: 8, border: `2px solid ${ENCRE}`, background: actif ? '#fff' : '#eef0f4', color: actif ? ENCRE : '#9aa3b2', fontWeight: 700, cursor: actif ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 15 });
  return (
    <div data-station="banc" style={{ marginTop: 14, background: '#f1f5f9', border: '2px solid #94a3b8', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, fontWeight: 800, color: '#0f172a' }}>
        <span>🌡️ Banc à gradient de température</span><span style={{ fontWeight: 600, color: DOUX, fontSize: 14 }}>{restant} essai{restant > 1 ? 's' : ''} possible{restant > 1 ? 's' : ''} · {DUREE_ESSAI} min chacun</span>
      </div>
      <div style={{ margin: '10px 0 4px', fontSize: 14, color: DOUX }}>Masse de DPnB à tester (pour 331 g de peinture) :</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {DOSES_BANC.map(g => <button key={g} type="button" data-dose={g} disabled={restant <= 0} onClick={() => onEtat(essaiBanc(e, g))} style={bouton(restant > 0)}>{g} g{testees.has(g) ? ' ✓' : ''}</button>)}
      </div>
      {dernier && (<div style={{ marginTop: 12 }}>
        <Bande essai={dernier} />
        <div style={{ textAlign: "center", fontSize: 14, color: "#0f172a" }} data-banc-lecture>
          Essai {banc.length} : {dernier.g} g de DPnB ({nf(dernier.pct, 1)} % du polymère sec) → {dernier.tmff == null ? 'film continu sur toute la plaque (< 0 °C)' : `TMFF lue : ${nf(dernier.tmff, 1)} °C`} · COV calculés : {nf(dernier.cov, 0)} g/L
        </div>
      </div>)}
      {banc.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 14 }}>
          <thead><tr style={{ textAlign: 'left', color: DOUX }}><th>N°</th><th>DPnB (g)</th><th>% polymère sec</th><th>TMFF lue (°C)</th><th>COV (g/L)</th></tr></thead>
          <tbody>{banc.map((x, i) => (<tr key={i} style={{ borderTop: '1px solid #cbd5e1' }}>
            <td>{i + 1}</td><td>{x.g}</td><td>{nf(x.pct, 1)}</td>
            <td style={{ color: x.tmff != null && x.tmff > TMFF_MAX ? ROUGE : VERT, fontWeight: 700 }}>{x.tmff == null ? '< 0' : nf(x.tmff, 1)}</td>
            <td style={{ color: x.cov >= COV_MAX ? ROUGE : VERT, fontWeight: 700 }}>{nf(x.cov, 0)}</td></tr>))}</tbody>
        </table>)}
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" data-indice disabled={indices >= INDICES_BANC.length} onClick={() => onEtat(indiceBanc(e))} style={bouton(indices < INDICES_BANC.length)}>💡 Demander conseil à Karim (+5 min)</button>
        <span style={{ fontSize: 12.5, color: DOUX }}>Objectif : TMFF ≤ {TMFF_MAX} °C et COV &lt; {COV_MAX} g/L.</span>
      </div>
      {indices > 0 && <div data-conseils style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.5 }}>{INDICES_BANC.slice(0, indices).map((t, i) => <div key={i} style={{ marginTop: 4 }}>{t}</div>)}</div>}
      <div style={{ marginTop: 14, borderTop: '1.5px dashed #94a3b8', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Quelle dose retiens-tu pour la fabrication ?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {DOSES_BANC.map(g => <button key={g} type="button" data-retenir={g} onClick={() => onValider(choixDose(g))} style={bouton(true)}>{g} g</button>)}
        </div>
      </div>
    </div>);
}

// Graphique viscosité = f(% de dispersant) : points seulement (pas de courbe tracée : à l'élève de la voir)
function Graphique({ pts }) {
  const W = 420, H = 230, mx = 44, my = 14, X = x => mx + x / 0.6 * (W - mx - 12), vmax = 5000, Y = v => H - 34 - Math.log10(Math.max(v, 10) / 10) / Math.log10(vmax / 10) * (H - 34 - my);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Viscosité en fonction du pourcentage de dispersant (échelle logarithmique)" style={{ width: '100%', maxWidth: 480, display: 'block', margin: '8px auto 0', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6 }}>
      {[10, 100, 1000].map(v => <g key={v}><line x1={mx} x2={W - 12} y1={Y(v)} y2={Y(v)} stroke="#e2e8f0" /><text x={mx - 4} y={Y(v) + 4} textAnchor="end" fontSize="10" fill="#475569">{v}</text></g>)}
      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map(x => <g key={x}><line x1={X(x)} x2={X(x)} y1={my} y2={H - 34} stroke="#f1f5f9" /><text x={X(x)} y={H - 20} textAnchor="middle" fontSize="10" fill="#475569">{String(x).replace('.', ',')}</text></g>)}
      <text x={(W + mx) / 2} y={H - 5} textAnchor="middle" fontSize="11" fill="#334155">% de dispersant sec / poudres</text>
      <text x="10" y={H / 2} fontSize="11" fill="#334155" transform={`rotate(-90 10 ${H / 2})`} textAnchor="middle">viscosité (mPa·s, log)</text>
      {pts.map((p, i) => p.v258 == null
        ? <text key={i} x={X(p.x)} y={my + 12} textAnchor="middle" fontSize="12" fill={ROUGE}>✕</text>
        : <g key={i}><circle cx={X(p.x)} cy={Y(p.v258)} r="4.5" fill="#dc2626" /><circle cx={X(p.x)} cy={Y(p.v129)} r="4.5" fill="#3b82f6" /></g>)}
      <circle cx={W - 150} cy={my + 8} r="4" fill="#dc2626" /><text x={W - 142} y={my + 12} fontSize="10" fill="#334155">258 s⁻¹</text>
      <circle cx={W - 85} cy={my + 8} r="4" fill="#3b82f6" /><text x={W - 77} y={my + 12} fontSize="10" fill="#334155">129 s⁻¹</text>
    </svg>);
}

export function StationCourbe({ e, onEtat, onValider, choixDose }) {
  const c = e.f.courbe || [], restant = COURBE_MAX - c.length, indices = e.f.indC || 0, testees = new Set(c.map(p => p.x));
  const fr = (x) => String(x).replace('.', ',');
  const bouton = (actif) => ({ padding: '8px 12px', borderRadius: 8, border: `2px solid ${ENCRE}`, background: actif ? '#fff' : '#eef0f4', color: actif ? ENCRE : '#9aa3b2', fontWeight: 700, cursor: actif ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 15 });
  return (
    <div data-station="courbe" style={{ marginTop: 14, background: '#f1f5f9', border: '2px solid #94a3b8', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, fontWeight: 800, color: '#0f172a' }}>
        <span>🧪 Courbe de défloculation du Coadis BR3</span><span style={{ fontWeight: 600, color: DOUX, fontSize: 14 }}>{restant} ajout{restant > 1 ? 's' : ''} possible{restant > 1 ? 's' : ''} · {COURBE_DUREE} min chacun</span>
      </div>
      <div style={{ fontSize: 13.5, color: DOUX, margin: '4px 0 8px' }}>250 g de poudres (50 % TiO₂, 50 % CaCO₃). Dose de matière active en % de la masse de poudres, et masse de Coadis BR3 à peser (extrait sec 40 %).</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {DOSES_COURBE.map(x => <button key={x} type="button" data-dosec={x} disabled={restant <= 0} onClick={() => onEtat(essaiCourbe(e, x))} style={bouton(restant > 0)}>{fr(x)} %{testees.has(x) ? ' ✓' : ''}<div style={{ fontSize: 11, fontWeight: 400 }}>{fr(masseCoadis(x).toFixed(3))} g</div></button>)}
      </div>
      {c.length > 0 && <>
        <Graphique pts={c} />
        <table data-courbe-table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 14 }}>
          <thead><tr style={{ textAlign: 'left', color: DOUX }}><th>N°</th><th>% disp.</th><th>Coadis (g)</th><th>η 258 s⁻¹</th><th>η 129 s⁻¹</th></tr></thead>
          <tbody>{c.map((p, i) => (<tr key={i} style={{ borderTop: '1px solid #cbd5e1' }}><td>{i + 1}</td><td>{fr(p.x)}</td><td>{fr(p.g.toFixed(3))}</td>
            {p.v258 == null ? <td colSpan={2} style={{ color: ROUGE }}>hors gamme : trop visqueux pour être mesuré</td> : <><td>{p.v258}</td><td>{p.v129}</td></>}</tr>))}</tbody>
        </table></>}
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" data-indice disabled={indices >= INDICES_COURBE.length} onClick={() => onEtat(indiceCourbe(e))} style={bouton(indices < INDICES_COURBE.length)}>💡 Demander conseil à Karim (+5 min)</button>
      </div>
      {indices > 0 && <div data-conseils style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.5 }}>{INDICES_COURBE.slice(0, indices).map((t, i) => <div key={i} style={{ marginTop: 4 }}>{t}</div>)}</div>}
      <div style={{ marginTop: 14, borderTop: '1.5px dashed #94a3b8', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Quelle dose retiens-tu pour la peinture ?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {DOSES_COURBE.map(x => <button key={x} type="button" data-retenirc={x} onClick={() => onValider(choixDose(x))} style={bouton(true)}>{fr(x)} %</button>)}
        </div>
      </div>
    </div>);
}

// Station « prises d'huile » : méthode à la spatule, la pâte est décrite par son aspect (le rapport huile / huile nécessaire reste caché)
export function StationHuile({ e, onEtat, onValider, choixFin }) {
  const [poudre, setPoudre] = useState('tio2');
  const [huile, setHuile] = useState({ tio2: 0, caco3: 0 });
  const [msg, setMsg] = useState(null);
  const ess = e.f.huileEssais || [], restant = HUILE_MAX_ESSAIS - ess.length;
  const m = huile[poudre], pate = etatPate(rapportPate(m, phVrai(e, poudre)));
  const ajouter = x => { setHuile(h => ({ ...h, [poudre]: Math.round((h[poudre] + x) * 100) / 100 })); setMsg(null); };
  const vider = () => { setHuile(h => ({ ...h, [poudre]: 0 })); setMsg(null); };
  const conclure = () => { const r = conclureHuile(e, poudre, m); setMsg({ ok: r.ok, t: r.message }); if (r.etat !== e) { onEtat(r.etat); setHuile(h => ({ ...h, [poudre]: 0 })); } };
  const T = huileRetenue(e, 'tio2'), C = huileRetenue(e, 'caco3');
  const bouton = (actif) => ({ padding: '8px 12px', borderRadius: 8, border: `2px solid ${ENCRE}`, background: actif ? '#fff' : '#eef0f4', color: actif ? ENCRE : '#9aa3b2', fontWeight: 700, cursor: actif ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 15 });
  return (
    <div data-station="huile" style={{ marginTop: 14, background: '#f1f5f9', border: '2px solid #94a3b8', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, fontWeight: 800, color: '#0f172a' }}>
        <span>🥄 Prise d'huile à la spatule</span><span style={{ fontWeight: 600, color: DOUX, fontSize: 14 }}>{restant} détermination{restant > 1 ? 's' : ''} possible{restant > 1 ? 's' : ''} · {HUILE_DUREE} min chacune</span>
      </div>
      <div role="group" aria-label="Poudre" style={{ display: 'flex', gap: 6, margin: '10px 0' }}>
        {Object.entries(POUDRES_HUILE).map(([k, nom]) => <button key={k} type="button" data-poudre={k} aria-pressed={poudre === k} onClick={() => { setPoudre(k); setMsg(null); }} style={{ ...bouton(true), background: poudre === k ? ENCRE : '#fff', color: poudre === k ? '#fff' : ENCRE }}>{nom}</button>)}
      </div>
      <div style={{ fontSize: 14, color: '#0f172a' }}>{M_POUDRE} g de {POUDRES_HUILE[poudre]} sur la plaque de verre ; tu ajoutes de l'huile de lin et tu malaxes à la spatule.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0' }}>
        <svg width="96" height="60" viewBox="0 0 96 60" aria-hidden="true"><rect x="2" y="48" width="92" height="8" rx="2" fill="#cbd5e1" /><ellipse cx="48" cy="40" rx="40" ry={pate.cle === 'fluide' ? 8 : 14} fill={pate.c} stroke="#64748b" strokeWidth="2" /></svg>
        <div><div data-pate style={{ fontWeight: 700 }}>{pate.t}</div><div style={{ fontSize: 13.5, color: DOUX }}>huile ajoutée : {nf(m, 2)} g</div></div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" data-ajout="1" onClick={() => ajouter(1)} style={bouton(true)}>+ 1 g</button>
        <button type="button" data-ajout="0.2" onClick={() => ajouter(0.2)} style={bouton(true)}>+ 0,2 g</button>
        <button type="button" data-ajout="0.03" onClick={() => ajouter(0.03)} style={bouton(true)}>1 goutte</button>
        <button type="button" data-final onClick={conclure} disabled={restant <= 0} style={{ ...bouton(restant > 0), background: restant > 0 ? '#fef3c7' : '#eef0f4' }}>C'est le point final</button>
        <button type="button" onClick={vider} style={bouton(true)}>↺ Poudre neuve</button>
      </div>
      {msg && <div role="status" data-msg style={{ marginTop: 8, fontWeight: 700, color: msg.ok ? VERT : ROUGE, lineHeight: 1.5 }}>{msg.ok ? '✅ ' : '❌ '}{msg.t}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 14 }}>
        <thead><tr style={{ textAlign: 'left', color: DOUX }}><th>Poudre</th><th>Déterminations valides</th><th>Prise d'huile retenue</th></tr></thead>
        <tbody>{[['TiO₂', T], ['CaCO₃ léger', C]].map(([nom, r]) => <tr key={nom} style={{ borderTop: '1px solid #cbd5e1' }}><td>{nom}</td><td>{r ? r.n : 0}</td><td data-retenue>{r ? `${nf(r.ph, 1)} g/100 g` : '—'}</td></tr>)}</tbody>
      </table>
      <button type="button" data-consigner disabled={!T || !C} onClick={() => onValider(choixFin)} style={{ ...bouton(!!T && !!C), marginTop: 12 }}>Consigner les résultats et calculer λ</button>
      {(!T || !C) && <span style={{ fontSize: 12.5, color: DOUX, marginLeft: 8 }}>Il faut au moins une détermination valide pour chaque poudre.</span>}
    </div>);
}

// Chromatogramme de la dernière injection : pics de l'étalon interne et du DPnB (données de scénario), aire ∝ hauteur × largeur
function Chromato({ inj }) {
  const W = 420, H = 120, x = t => 30 + t / 10 * (W - 42), sig = 0.09, amax = Math.max(inj.aD, inj.aI), Y = a => H - 24 - a / amax * (H - 44);
  const pic = (tr, a) => { let d = ''; for (let t = tr - 0.5; t <= tr + 0.5; t += 0.02) { const h = Math.exp(-0.5 * ((t - tr) / sig) ** 2); d += `${d ? 'L' : 'M'}${x(t).toFixed(1)} ${(H - 24 - h * (H - 24 - Y(a))).toFixed(1)} `; } return d; };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Chromatogramme : pic de l'étalon interne puis pic du DPnB" style={{ width: '100%', maxWidth: 460, display: 'block', margin: '8px auto 0', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6 }}>
      <line x1="30" x2={W - 12} y1={H - 24} y2={H - 24} stroke="#334155" />
      {[0, 2, 4, 6, 8, 10].map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1={H - 24} y2={H - 20} stroke="#334155" /><text x={x(t)} y={H - 8} textAnchor="middle" fontSize="10" fill="#475569">{t}</text></g>)}
      <text x={W - 14} y={H - 8} textAnchor="end" fontSize="10" fill="#475569">min</text>
      <path d={pic(TR.is, inj.aI)} fill="none" stroke="#7c3aed" strokeWidth="2" /><text x={x(TR.is)} y={Y(inj.aI) - 4} textAnchor="middle" fontSize="10" fill="#7c3aed">étalon interne</text>
      <path d={pic(TR.dpnb, inj.aD)} fill="none" stroke="#dc2626" strokeWidth="2" /><text x={x(TR.dpnb)} y={Y(inj.aD) - 4} textAnchor="middle" fontSize="10" fill="#dc2626">DPnB</text>
    </svg>);
}
// Droite d'étalonnage : points, droite, équation
function Droite({ D, dos }) {
  const W = 420, H = 200, mx = 46, my = 14, xmax = Math.max(...D.xs) * 1.1, ymax = Math.max(...D.ys, D.a * xmax + D.b) * 1.1;
  const X = x => mx + x / xmax * (W - mx - 12), Y = y => H - 32 - Math.max(0, y) / ymax * (H - 32 - my);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Droite d'étalonnage" style={{ width: '100%', maxWidth: 460, display: 'block', margin: '8px auto 0', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6 }}>
      <line x1={mx} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="#334155" /><line x1={mx} x2={mx} y1={my} y2={Y(0)} stroke="#334155" />
      <line x1={X(0)} y1={Y(D.b)} x2={X(xmax)} y2={Y(D.a * xmax + D.b)} stroke="#2563eb" strokeWidth="1.5" />
      {D.xs.map((x, i) => <circle key={i} cx={X(x)} cy={Y(D.ys[i])} r="4" fill="#dc2626" />)}
      {dos && <line x1={X(dos.x0)} x2={X(dos.x0)} y1={Y(0)} y2={Y(D.a * dos.x0 + D.b)} stroke="#16a34a" strokeWidth="2" strokeDasharray="4 3" />}
      <text x={(W + mx) / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#334155">{D.mode === 'interne' ? 'concentration relative c / c_IS' : 'concentration en DPnB (mg/mL)'}</text>
      <text x="12" y={H / 2} fontSize="11" fill="#334155" transform={`rotate(-90 12 ${H / 2})`} textAnchor="middle">{D.mode === 'interne' ? 'aire DPnB / aire IS' : 'aire du DPnB (u.a.)'}</text>
    </svg>);
}
export function StationCpg({ e, onEtat, onValider, choixConcl }) {
  const g = cpgDe(e), R = resultatCpg(e), niv = new Set(g.etal.map(p => p.c)).size;
  const fr = v => String(v).replace('.', ',');
  const bouton = (actif) => ({ padding: '8px 12px', borderRadius: 8, border: `2px solid ${ENCRE}`, background: actif ? '#fff' : '#eef0f4', color: actif ? ENCRE : '#9aa3b2', fontWeight: 700, cursor: actif ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 15 });
  const rec = recuperation(e);
  const dern = g.ech.length ? g.ech[g.ech.length - 1] : g.etal.length ? g.etal[g.etal.length - 1] : null;
  const choixValides = choixConcl.filter(c => c.concl);
  return (
    <div data-station="cpg" style={{ marginTop: 14, background: '#f1f5f9', border: '2px solid #94a3b8', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontWeight: 800, color: '#0f172a' }}>🧫 Dosage du DPnB par CPG-FID, avec étalon interne</div>
      <div style={{ fontSize: 13.5, color: DOUX, margin: '4px 0 8px' }}>Étalons : DPnB dans le solvant, avec l'étalon interne à {fr(C_IS)} mg/mL. Échantillon : 1,00 g de peinture complété à 10,0 mL, même étalon interne. Chaque injection : {T_INJ} min.</div>
      <div style={{ fontWeight: 700, margin: '6px 0 4px' }}>1. Étalonnage <span style={{ fontWeight: 400, color: DOUX }}>({g.etal.length}/{ETAL_MAX} injections)</span></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {NIVEAUX_ETALON.map(c => <button key={c} type="button" data-etalon={c} disabled={g.etal.length >= ETAL_MAX} onClick={() => onEtat(injecterEtalon(e, c))} style={bouton(g.etal.length < ETAL_MAX)}>{fr(c)} mg/mL</button>)}
      </div>
      <div style={{ fontWeight: 700, margin: '12px 0 4px' }}>2. Échantillon</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <button type="button" data-prep disabled={g.prep} onClick={() => onEtat(preparerEchantillon(e))} style={bouton(!g.prep)}>{g.prep ? '✓ Échantillon préparé' : `Préparer l'échantillon (${T_PREP} min)`}</button>
        <button type="button" data-injech disabled={!g.prep || g.ech.length >= ECH_MAX} onClick={() => onEtat(injecterEchantillon(e))} style={bouton(g.prep && g.ech.length < ECH_MAX)}>Injecter l'échantillon ({g.ech.length}/{ECH_MAX})</button>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" data-ctrl disabled={g.ctrl.length >= 2} onClick={() => onEtat(injecterControle(e))} style={bouton(g.ctrl.length < 2)}>Injecter une solution de contrôle ({fr(C_CTRL)} mg/mL)</button>
        {rec && <span data-recup style={{ fontSize: 14 }}>récupération : <b>{fr(rec.taux.toFixed(0))} %</b></span>}
      </div>
      {dern && <Chromato inj={dern} />}
      <div style={{ fontWeight: 700, margin: '12px 0 4px' }}>3. Quantification</div>
      <div role="group" aria-label="Mode de quantification" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['interne', 'Avec l\'étalon interne (rapport des aires)'], ['externe', 'Sans étalon interne (aire du DPnB seule)']].map(([m, nom]) => <button key={m} type="button" data-mode={m} aria-pressed={g.mode === m} onClick={() => onEtat(choisirModeCpg(e, m))} style={{ ...bouton(true), background: g.mode === m ? ENCRE : '#fff', color: g.mode === m ? '#fff' : ENCRE, fontSize: 14 }}>{nom}</button>)}
      </div>
      {g.etal.length > 0 && <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 13.5 }}>
        <thead><tr style={{ textAlign: 'left', color: DOUX }}><th>N°</th><th>c (mg/mL)</th><th>aire DPnB</th><th>aire IS</th><th>rapport</th></tr></thead>
        <tbody>{g.etal.map((p, i) => <tr key={i} style={{ borderTop: '1px solid #cbd5e1' }}><td>{i + 1}</td><td>{fr(p.c)}</td><td>{p.aD}</td><td>{p.aI}</td><td>{fr((p.aD / p.aI).toFixed(3))}</td></tr>)}
          {g.ech.map((p, i) => <tr key={`e${i}`} style={{ borderTop: '1px solid #cbd5e1', background: '#ecfdf5' }}><td>éch. {i + 1}</td><td>?</td><td>{p.aD}</td><td>{p.aI}</td><td>{fr((p.aD / p.aI).toFixed(3))}</td></tr>)}</tbody></table>}
      {R.D ? <><Droite D={R.D} dos={R.dos} />
        <div data-droite style={{ fontSize: 14, textAlign: 'center', marginTop: 6 }}>y = {fr(R.D.a.toPrecision(4))} x {R.D.b < 0 ? '−' : '+'} {fr(Math.abs(R.D.b).toPrecision(3))} · R² = {fr(R.D.R2.toFixed(4))} · écart-type résiduel relatif : {fr(R.D.residRel.toFixed(1))} %</div></>
        : <div style={{ fontSize: 13.5, color: DOUX, marginTop: 8 }}>La droite apparaît à partir de 3 niveaux de concentration ({niv}/3).</div>}
      {R.dos && <div data-resultat style={{ marginTop: 10, background: '#fff', border: '1.5px solid #94a3b8', borderRadius: 8, padding: '8px 12px', fontSize: 14.5, lineHeight: 1.6 }}>
        Concentration dans la solution : {fr(R.dos.x0.toFixed(3))} {g.mode === 'interne' ? '(c / c_IS, soit mg/mL)' : 'mg/mL'} ± {fr(R.dos.u.toFixed(3))} (incertitude-type)<br />
        COV = c × V / m × ρ = {fr(R.dos.x0.toFixed(3))} × 10,0 / 1,00 × {fr(R.rho.toFixed(2))} = <b>{fr(R.cov.toFixed(1))} g/L</b> · U (k = 2) = <b>{fr(R.U.toFixed(1))} g/L</b>
      </div>}
      {R.dos && <div style={{ marginTop: 14, borderTop: '1.5px dashed #94a3b8', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Ta conclusion pour le rapport :</div>
        {choixValides.map((c, i) => <button key={i} type="button" data-concl={c.concl} className="lab-choix" style={{ margin: '4px 0' }} onClick={() => onValider(c)}>{c.t}</button>)}
      </div>}
      <button type="button" data-abandon onClick={() => onValider(choixConcl.find(c => !c.concl) || { vers: 'labo' })} style={{ ...bouton(true), marginTop: 12, fontSize: 13, display: R.dos ? 'none' : 'inline-block' }}>Abandonner le dosage</button>
    </div>);
}

// ───────────── Formule finale : l'élève pose ses masses, les contrôles « sur papier » se recalculent ─────────────
const LIGNES_FORMULE = [['liant', 'Dispersion d\'Orgal PST 50A', 'g'], ['eau', 'Eau', 'g'], ['tio2', 'TiO₂ (rutile)', 'g'], ['caco3', 'CaCO₃ léger', 'g'], ['coadis', 'Coadis BR3 (dispersant)', 'g'], ['dpnb', 'DPnB (coalescent)', 'g']];
export function StationFormule({ e, onValider }) {
  const base = fmDepuisFlags(e);
  const [v, setV] = useState(() => Object.fromEntries(FM_CHAMPS.map(k => [k, String(base[k]).replace('.', ',')])));
  const fm = Object.fromEntries(FM_CHAMPS.map(k => [k, parseFloat(String(v[k]).replace(',', '.'))]));
  const val = validerFormule(e, fm);
  const controles = val.ok ? controlesFormule(e, fm) : [];
  const total = val.ok ? proprietes({ resine: 'orgal', foamex: 1.5, thixol: 1.5, coapur: 3, ...fm }).mTot : null;
  const icone = ok => ok === true ? ['✔', VERT] : ok === false ? ['✖', ROUGE] : ['➜', AMBRE];
  return (
    <div data-formule style={{ margin: '14px 0', background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>📝 Feuille de pesée</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
        {LIGNES_FORMULE.map(([k, nom, u]) => (
          <label key={k} style={{ fontSize: 13.5 }}>{nom}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <input data-fm={k} value={v[k]} inputMode="decimal" autoComplete="off" onChange={ev => setV(o => ({ ...o, [k]: ev.target.value }))} style={{ width: '100%', padding: '6px 8px', fontSize: 16, boxSizing: 'border-box', border: `1.5px solid ${ENCRE}`, borderRadius: 6 }} />{u}
            </span>
          </label>))}
      </div>
      <div style={{ fontSize: 12.5, color: DOUX, margin: '8px 0' }}>Fixes : Foamex 1,5 g · Thixol 1,5 g · Coapur 3 g.{total != null && ` Masse totale : ${nf(total)} g.`}</div>
      {!val.ok && <div role="alert" data-fm-erreur style={{ color: ROUGE, fontSize: 14, margin: '6px 0' }}>{val.message}</div>}
      {controles.length > 0 && <div data-controles style={{ borderTop: '1px solid #e5e7eb', marginTop: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 14, margin: '8px 0 2px' }}>Ta formule face au cahier des charges (calculs sur papier)</div>
        {controles.map(c => { const [ic, col] = icone(c.ok); return <div key={c.cle} data-controle={c.cle} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 14.5, lineHeight: 1.45 }}><b style={{ color: col }}>{ic}</b><span>{c.t}</span></div>; })}
      </div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" data-valider-formule disabled={!val.ok} onClick={() => onValider(val.choix)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: ENCRE, color: '#fff', fontWeight: 700, cursor: val.ok ? 'pointer' : 'default', opacity: val.ok ? 1 : 0.5, font: 'inherit' }}>Valider ma formule et fabriquer</button>
        <button type="button" onClick={() => setV(Object.fromEntries(FM_CHAMPS.map(k => [k, String(base[k]).replace('.', ',')])))} style={{ padding: '9px 14px', borderRadius: 8, border: `1.5px solid ${ENCRE}`, background: '#fff', color: ENCRE, fontWeight: 700, cursor: 'pointer', font: 'inherit' }}>↺ Revenir à ma formule de départ</button>
      </div>
    </div>);
}
