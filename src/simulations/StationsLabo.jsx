import { useState } from "react";
import { M_POUDRE, POUDRES_HUILE, HUILE_MAX_ESSAIS, HUILE_DUREE, etatPate, rapportPate, DOSES_BANC, ESSAIS_MAX, DUREE_ESSAI, DOSES_COURBE, COURBE_MAX, COURBE_DUREE, masseCoadis } from "./stationsModele";
import { essaiBanc, indiceBanc, INDICES_BANC, essaiCourbe, indiceCourbe, INDICES_COURBE, conclureHuile, huileRetenue, phVrai, TMFF_MAX, COV_MAX, nf } from "./laboJournee";

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
