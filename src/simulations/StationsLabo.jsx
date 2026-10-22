import { DOSES_BANC, ESSAIS_MAX, DUREE_ESSAI } from "./stationsModele";
import { essaiBanc, indiceBanc, INDICES_BANC, TMFF_MAX, COV_MAX, nf } from "./laboJournee";

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
