import { useState, useEffect, useRef, useMemo } from "react";

// ============================================================
//  UTILITAIRES PARTAGÉS
// ============================================================

export function Field({ label, value, onChange, step = 0.01, min = 0, width = 90, type = "number" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: 12, color: "#667" }}>{label}</label>
      <input
        type={type}
        value={value}
        step={type === "number" ? step : undefined}
        min={type === "number" ? min : undefined}
        onChange={e => onChange(type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value)}
        style={{ width, padding: "5px 8px", borderRadius: 6, border: "1px solid #dbeafc", fontSize: 14 }}
      />
    </div>
  );
}

export function CoeffInput({ value, onChange }) {
  return (
    <input type="number" value={value} min="1" step="1"
      onChange={e => onChange(Math.max(1, parseInt(e.target.value) || 1))}
      style={{ width: 38, padding: "4px 2px", textAlign: "center", borderRadius: 6, border: "1px solid #dbeafc", fontSize: 13 }} />
  );
}

export function TabBtn({ active, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 14px", borderRadius: 10,
      border: `2px solid ${active ? color : "#dde"}`,
      background: active ? color : "#f8f9ff",
      color: active ? "#fff" : "#445",
      cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.2s"
    }}>{children}</button>
  );
}

export const cardStyle = {
  background: "#fff", border: "1px solid #eef5ff",
  borderRadius: 10, padding: 14, boxSizing: "border-box",
  textAlign: "left"   // le gabarit Vite (App.css) centre tout le texte du site par défaut
};


// ============================================================
//  OUTILS PARTAGÉS : nombres et petit graphique SVG
//  (pages Energy@School)
// ============================================================

export const fmt = (x, d = 2) => (isFinite(x)
  ? x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
export function sci(x, sig = 3) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e < -2 || e > 5) {
    const exp = String(e).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);
    return `${(x / 10 ** e).toFixed(sig - 1).replace('.', ',')} × 10${exp}`;
  }
  return fmt(x, Math.max(0, Math.min(4, sig - 1 - e)));
}
export const lireNombre = s => parseFloat(String(s ?? '').replace(/\s/g, '').replace(',', '.'));
export const proche = (a, b, tol) => Math.abs(a - b) <= Math.abs(b) * tol;

// ════════════════ PETIT GRAPHIQUE SVG ════════════════
function pasJoli(max) {
  const brut = max / 5, p = 10 ** Math.floor(Math.log10(brut || 1));
  const n = brut / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
export function Graphe({ xMax, yMax, xLabel, yLabel, courbes = [], points = [], zones = [], barres = null, yMax2 = null }) {
  const W = 340, H = 290, g = 58, d = 12, h = 12, b = 52;
  const X = x => g + (x / xMax) * (W - g - d);
  const Y = y => H - b - (y / yMax) * (H - h - b);
  const px = pasJoli(xMax), py = pasJoli(yMax);
  const ticksX = barres ? [] : Array.from({ length: Math.floor(xMax / px) + 1 }, (_, i) => i * px);
  const ticksY = Array.from({ length: Math.floor(yMax / py) + 1 }, (_, i) => i * py);
  const dec = v => (v < 1 && v > 0 ? (v < 0.01 ? 3 : 2) : v < 10 && v % 1 ? 1 : 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block',
      background: 'white', borderRadius: 8, border: `1px solid ${'#cbd5e1'}` }}>
      {zones.map((z, i) => (
        <g key={i}>
          <rect x={X(z.x0)} y={h} width={X(z.x1) - X(z.x0)} height={H - h - b} fill={z.color} opacity="0.12"/>
          <text x={(X(z.x0) + X(z.x1)) / 2} y={H - b - 6} fontSize="13" fill={z.color} textAnchor="middle" fontWeight="700">{z.label}</text>
        </g>
      ))}
      {ticksY.map(t => (
        <g key={`y${t}`}>
          <line x1={g} y1={Y(t)} x2={W - d} y2={Y(t)} stroke="#e2e8f0"/>
          <text x={g - 5} y={Y(t) + 4} fontSize="13" fill={'#334155'} textAnchor="end">{fmt(t, dec(py))}</text>
        </g>
      ))}
      {ticksX.map(t => (
        <text key={`x${t}`} x={X(t)} y={H - b + 17} fontSize="13" fill={'#334155'} textAnchor="middle">{fmt(t, dec(px))}</text>
      ))}
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={'#0f172a'} strokeWidth="1.2"/>
      <line x1={g} y1={h} x2={g} y2={H - b} stroke={'#0f172a'} strokeWidth="1.2"/>
      <text x={(g + W - d) / 2} y={H - 10} fontSize="15" fill={'#0f172a'} textAnchor="middle" fontWeight="700">{xLabel}</text>
      <text x={15} y={(h + H - b) / 2} fontSize="15" fill={'#0f172a'} textAnchor="middle" fontWeight="700"
        transform={`rotate(-90 15 ${(h + H - b) / 2})`}>{yLabel}</text>
      {barres && barres.map((br, i) => {
        const bw = (W - g - d) / barres.length;
        const x0 = g + i * bw + bw * 0.18;
        return (
          <g key={`${i}-${br.label}`}>
            <rect x={x0} y={Y(br.val)} width={bw * 0.64} height={H - b - Y(br.val)}
              fill={br.color} opacity={br.fort ? 1 : 0.45} stroke={br.fort ? '#0f172a' : 'none'} strokeWidth="1.5"/>
            <text x={x0 + bw * 0.32} y={H - b + 17} fontSize="12" fill={'#334155'} textAnchor="middle">{br.label}</text>
          </g>
        );
      })}
      {courbes.map((c, i) => (
        <polyline key={i} points={c.pts.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ')}
          fill="none" stroke={c.color} strokeWidth={c.width || 2.5} strokeDasharray={c.dash || 'none'}/>
      ))}
      {points.map((p, i) => (
        <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={p.r || 5} fill={p.fill || p.color} stroke={p.color} strokeWidth="1.5"/>
      ))}
      <g>
        {courbes.filter(c => c.label).map((c, i) => (
          <g key={c.label} transform={`translate(${W - d - 168}, ${h + 12 + i * 19})`}>
            <line x1="0" y1="-4" x2="18" y2="-4" stroke={c.color} strokeWidth="2.5" strokeDasharray={c.dash || 'none'}/>
            <text x="23" y="0" fontSize="13.5" fill={'#0f172a'}>{c.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}


// ============================================================
//  PARCOURS GUIDÉ (pages Energy@School)
//  etapes : [{ titre, texte, tache }]
//  tache : null
//        | { type: 'action', ok, label?, faire?, attente?, consigne?, bloque? }
//        | { type: 'qcm', q, options, bonne, expl? }
//        | { type: 'num', q, unite, vrai, tol, pieges?, aide?, expl?, bloque? }
//  etat = { etape, reps, verifs } est conservé par la page (setEtat).
// ============================================================

export const ORANGE_GUIDE = '#f59e0b';

export function Cadre({ actif, x, y, w, h }) {
  if (!actif) return null;
  return (
    <rect x={x} y={y} width={w} height={h} rx="10" fill="none" stroke={ORANGE_GUIDE} strokeWidth="4" strokeDasharray="8 4" pointerEvents="none">
      <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.4s" repeatCount="indefinite"/>
    </rect>
  );
}

export function CarteParcours({ etapes, etat, setEtat, fin }) {
  const { etape, reps, verifs } = etat;
  const et = etapes[Math.min(etape, etapes.length - 1)];
  const tache = et.tache;
  const TXT = '#0f172a', TXT2 = '#334155', BORDER = '#cbd5e1';
  const btn = (actif, c = '#0284c7') => ({ padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, border: `1.5px solid ${actif ? c : BORDER}`,
    background: actif ? c : 'white', color: actif ? 'white' : TXT2 });
  const maj = f => setEtat(e => ({ ...e, ...f(e) }));
  const setRep = v => maj(e => ({ reps: { ...e.reps, [etape]: v }, verifs: { ...e.verifs, [etape]: false } }));
  const verifier = () => maj(e => ({ verifs: { ...e.verifs, [etape]: true } }));
  const juste = (() => {
    if (!tache) return true;
    if (tache.type === 'action') return !!tache.ok;
    if (tache.type === 'qcm') return reps[etape] === tache.bonne;
    const x = lireNombre(reps[etape]);
    return tache.vrai != null && isFinite(x) && proche(x, tache.vrai, tache.tol);
  })();
  const verifie = !!verifs[etape];
  const reussie = tache && tache.type === 'action' ? !!tache.ok : verifie && juste;
  const vuRep = !!reps[`vu${etape}`];
  const peutSuivre = !tache || reussie || vuRep;
  const piege = () => {
    const x = lireNombre(reps[etape]);
    if (!isFinite(x)) return 'Entrez une valeur numérique (virgule ou point).';
    const pg = (tache.pieges || []).find(([v]) => proche(x, v, Math.max(tache.tol, 0.04)));
    if (pg) return pg[1];
    if (tache.vrai && (proche(x, tache.vrai * 1000, 0.05) || proche(x, tache.vrai / 1000, 0.05))) return 'Facteur 1000 : vérifiez les unités.';
    return null;
  };
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '10px 12px', border: `2px solid ${ORANGE_GUIDE}`,
      display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: TXT2, fontWeight: 700 }}>
          <span>Étape {etape + 1} / {etapes.length}</span>
          {etape > 0 && <button onClick={() => maj(() => ({ etape: 0 }))} style={{ background: 'none', border: 'none', color: TXT2,
            cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>revenir au début</button>}
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginTop: 4 }}>
          <div style={{ width: `${(etape + 1) / etapes.length * 100}%`, height: '100%', background: ORANGE_GUIDE, borderRadius: 3, transition: 'width 0.3s' }}/>
        </div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TXT }}>{et.titre}</div>
      <div style={{ fontSize: 15, color: TXT, lineHeight: 1.6 }}>{et.texte}</div>
      {tache && tache.type === 'action' && (
        <div>
          {tache.bloque ? <div style={{ fontSize: 14, color: '#b45309' }}>{tache.bloque}</div>
            : tache.label && !tache.ok && <button onClick={tache.faire} disabled={!!tache.attente} style={btn(true)}>{tache.label}</button>}
          {tache.consigne && <div style={{ fontSize: 14, fontWeight: 700, color: TXT, marginTop: 6, whiteSpace: 'pre-wrap' }}>{tache.consigne}</div>}
          {tache.attente && <div style={{ fontSize: 14, color: TXT2, marginTop: 6 }}>{tache.attente}</div>}
          {tache.ok && <div style={{ fontSize: 14, color: '#15803d', fontWeight: 700, marginTop: 6 }}>✅ C'est fait !</div>}
        </div>
      )}
      {tache && tache.type === 'qcm' && (
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: TXT, marginBottom: 6 }}>{tache.q}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {tache.options.map((o, i) => <button key={i} onClick={() => setRep(i)}
              style={{ ...btn(reps[etape] === i, '#0ea5e9'), padding: '6px 10px', textAlign: 'left' }}>{o}</button>)}
          </div>
        </div>
      )}
      {tache && tache.type === 'num' && (
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: TXT, marginBottom: 6 }}>{tache.q}</div>
          {tache.bloque ? <div style={{ fontSize: 14, color: '#b45309' }}>{tache.bloque}</div> : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input value={reps[etape] ?? ''} placeholder="?" aria-label="Votre réponse"
                onChange={x => setRep(x.target.value)} onKeyDown={x => { if (x.key === 'Enter') verifier(); }}
                style={{ fontSize: 15, padding: '4px 8px', border: `1.5px solid ${BORDER}`, borderRadius: 6, width: 130, color: TXT }}/>
              <span style={{ fontSize: 14, color: TXT2 }}>{tache.unite}</span>
            </div>
          )}
          {tache.aide && !verifie && <div style={{ fontSize: 12.5, color: TXT2, marginTop: 4 }}>{tache.aide}</div>}
        </div>
      )}
      {tache && tache.type !== 'action' && !tache.bloque && (
        <div>
          {!reussie && <button onClick={verifier} style={btn(true, '#16a34a')}>✓ Vérifier</button>}
          {verifie && juste && <div style={{ fontSize: 14, color: '#15803d', fontWeight: 700, marginTop: 6 }}>
            ✅ Bravo ! <span style={{ fontWeight: 400, color: TXT }}>{tache.expl}</span></div>}
          {verifie && !juste && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 14, color: '#b91c1c', fontWeight: 700 }}>❌ Pas encore.</div>
              {tache.type === 'num' && piege() && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed',
                border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>{piege()}</div>}
              {vuRep ? (
                <div style={{ fontSize: 13.5, color: TXT2, marginTop: 4 }}>
                  {tache.type === 'num' ? `Réponse attendue : ${sci(tache.vrai)} ${tache.unite}` : `Réponse : ${tache.options[tache.bonne]}. ${tache.expl || ''}`}
                </div>
              ) : (
                <button onClick={() => maj(e => ({ reps: { ...e.reps, [`vu${etape}`]: true } }))} style={{ fontSize: 12.5, marginTop: 4,
                  background: 'none', border: 'none', color: TXT2, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>voir la réponse</button>
              )}
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        <button onClick={() => maj(e => ({ etape: Math.max(0, e.etape - 1) }))} disabled={etape === 0}
          style={{ ...btn(false), opacity: etape === 0 ? 0.4 : 1 }}>◀ Précédent</button>
        {etape < etapes.length - 1 ? (
          <button onClick={() => maj(e => ({ etape: e.etape + 1 }))} disabled={!peutSuivre}
            style={{ ...btn(peutSuivre, ORANGE_GUIDE), opacity: peutSuivre ? 1 : 0.45 }}>Suivant ▶</button>
        ) : fin}
      </div>
    </div>
  );
}
