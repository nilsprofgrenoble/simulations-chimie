import { Children, Fragment, cloneElement, isValidElement, useState, useEffect, useRef, useMemo } from "react";

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
// Lit un nombre saisi : « 1,26 », « 1,26e-3 », « 1,26×10⁻³ », « 1,26x10^-3 »
export const lireNombre = s => {
  const t = String(s ?? '').replace(/\s/g, '').replace(/[−–]/g, '-').replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, ch => (ch === '⁻' ? '-' : String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(ch))))
    .replace(',', '.').replace(/(?:×|x|\*)10\^?(-?\d+)/i, 'e$1');
  return parseFloat(t);
};
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

// ── Indices dans les textes affichés : « n_versé,e », « V_B,e », « x_max » s'affichent avec un vrai indice ──
// Les identifiants de code (deux tirets bas d'affilée dans un même mot, comme Qv_pompe_MIN) restent tels quels.
const RE_INDICE = /_([A-Za-zÀ-ÿ0-9−]+(?:,[A-Za-zÀ-ÿ]+)?)/g;
export function avecIndices(t) {
  if (typeof t !== 'string' || !t.includes('_')) return t;
  const morceaux = [];
  t.split(/(\s+)/).forEach((mot, k) => {
    if (!mot.includes('_') || /[A-Za-z0-9]_[A-Za-z0-9]+_[A-Za-z0-9]/.test(mot)) { morceaux.push(mot); return; }
    let dernier = 0, m;
    RE_INDICE.lastIndex = 0;
    while ((m = RE_INDICE.exec(mot))) {
      if (m.index > dernier) morceaux.push(mot.slice(dernier, m.index));
      morceaux.push(<sub key={`${k}-${m.index}`}>{m[1]}</sub>);
      dernier = m.index + m[0].length;
    }
    if (dernier < mot.length) morceaux.push(mot.slice(dernier));
  });
  return <>{morceaux}</>;
}

// Applique avecIndices à tous les textes d'un bloc JSX (éléments HTML et fragments seulement).
export function indicesProfond(n) {
  if (typeof n === 'string') return avecIndices(n);
  if (Array.isArray(n)) return Children.map(n, indicesProfond);
  if (isValidElement(n) && (typeof n.type === 'string' || n.type === Fragment) && n.props.children != null)
    return cloneElement(n, undefined, ...Children.toArray(n.props.children).map(indicesProfond));
  return n;
}

// Ordre d'affichage des choix d'un QCM : mélangé, mais stable pour une étape donnée.
// Les auteurs écrivent la bonne réponse en premier ; sans mélange, elle serait toujours en tête.
function ordreOptions(n, graine) {
  let x = (graine + 1) * 2654435761 % 4294967296;
  const alea = () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
  const ordre = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
  return ordre;
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
  const verifier = () => {
    maj(e => ({ verifs: { ...e.verifs, [etape]: true } }));
    // Une étape numérique peut demander à garder la valeur trouvée par l'élève (par exemple un volume lu)
    if (tache && tache.type === 'num' && tache.surReussite) {
      const x = lireNombre(reps[etape]);
      if (tache.vrai != null && isFinite(x) && proche(x, tache.vrai, tache.tol)) tache.surReussite(x);
    }
  };
  const juste = (() => {
    if (!tache) return true;
    if (tache.type === 'action') return !!tache.ok;
    if (tache.type === 'qcm') return reps[etape] === tache.bonne;
    const x = lireNombre(reps[etape]);
    return tache.vrai != null && isFinite(x) && proche(x, tache.vrai, tache.tol);
  })();
  const verifie = !!verifs[etape];
  const reussieMaintenant = tache && tache.type === 'action' ? !!tache.ok : verifie && juste;
  const dejaReussie = !!(etat.reussies && etat.reussies[etape]);
  const reussie = reussieMaintenant || dejaReussie;
  const vuRep = !!reps[`vu${etape}`];
  const peutSuivre = !tache || reussie || vuRep;
  // Une étape réussie le reste, même si la page est rechargée et qu'une mesure a disparu
  useEffect(() => {
    if (reussieMaintenant && !dejaReussie) setEtat(e => ({ ...e, reussies: { ...(e.reussies || {}), [etape]: true } }));
  }, [reussieMaintenant, dejaReussie, etape, setEtat]);
  // Message de reprise, affiché une seule fois quand on retrouve un parcours commencé
  const [reprise] = useState(() => etape > 0);
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
      display: 'flex', flexDirection: 'column', gap: 10,
      // La carte reste visible quand on fait défiler la page (dans une mise en page à deux colonnes)
      position: 'sticky', top: 8, maxHeight: 'calc(100vh - 24px)', overflowY: 'auto', zIndex: 5 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: TXT2, fontWeight: 700 }}>
          <span>Étape {etape + 1} / {etapes.length}</span>
          {etape > 0 && <button onClick={() => setEtat({ etape: 0, reps: {}, verifs: {}, reussies: {} })} style={{ background: 'none', border: 'none', color: TXT2,
            cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>revenir au début</button>}
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginTop: 4 }}>
          <div style={{ width: `${(etape + 1) / etapes.length * 100}%`, height: '100%', background: ORANGE_GUIDE, borderRadius: 3, transition: 'width 0.3s' }}/>
        </div>
      </div>
      {reprise && etape > 0 && (
        <div style={{ fontSize: 13, color: '#1e3a8a', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 8px' }}>
          Vous reprenez votre parcours là où vous l'aviez laissé. Si une mesure a disparu, revenez à l'étape où elle a été faite.
        </div>
      )}
      <div style={{ fontSize: 18, fontWeight: 700, color: TXT }}>{indicesProfond(et.titre)}</div>
      <div style={{ fontSize: 15, color: TXT, lineHeight: 1.6 }}>{indicesProfond(et.texte)}</div>
      {tache && tache.type === 'action' && (
        <div>
          {tache.bloque ? <div style={{ fontSize: 14, color: '#b45309' }}>{tache.bloque}</div>
            : tache.label && !tache.ok && <button onClick={tache.faire} disabled={!!tache.attente} style={btn(true)}>{tache.label}</button>}
          {tache.consigne && <div style={{ fontSize: 14, fontWeight: 700, color: TXT, marginTop: 6, whiteSpace: 'pre-wrap' }}>{avecIndices(tache.consigne)}</div>}
          {tache.attente && <div style={{ fontSize: 14, color: TXT2, marginTop: 6 }}>{tache.attente}</div>}
          {tache.ok && <div style={{ fontSize: 14, color: '#15803d', fontWeight: 700, marginTop: 6 }}>✅ C'est fait !</div>}
        </div>
      )}
      {tache && tache.type === 'qcm' && (
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: TXT, marginBottom: 6 }}>{avecIndices(tache.q)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {ordreOptions(tache.options.length, etape).map(i => <button key={i} data-ok={i === tache.bonne ? 'true' : 'false'} onClick={() => setRep(i)}
              style={{ ...btn(reps[etape] === i, '#0ea5e9'), padding: '6px 10px', textAlign: 'left',
                ...(typeof tache.options[i] !== 'string' ? { background: reps[etape] === i ? '#e0f2fe' : 'white', color: TXT, borderWidth: 2 } : {}) }}>{avecIndices(tache.options[i])}</button>)}
          </div>
        </div>
      )}
      {tache && tache.type === 'num' && (
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: TXT, marginBottom: 6 }}>{avecIndices(tache.q)}</div>
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
      {dejaReussie && !reussieMaintenant && (
        <div style={{ fontSize: 14, color: '#15803d', fontWeight: 700 }}>✅ Étape déjà réussie.</div>
      )}
      {tache && tache.type !== 'action' && !tache.bloque && (
        <div>
          {!reussie && <button onClick={verifier} style={btn(true, '#16a34a')}>✓ Vérifier</button>}
          {verifie && juste && <div style={{ fontSize: 14, color: '#15803d', fontWeight: 700, marginTop: 6 }}>
            ✅ Bravo ! <span style={{ fontWeight: 400, color: TXT }}>{indicesProfond(tache.expl)}</span></div>}
          {verifie && !juste && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 14, color: '#b91c1c', fontWeight: 700 }}>❌ Pas encore.</div>
              {tache.type === 'num' && piege() && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed',
                border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>{avecIndices(piege())}</div>}
              {vuRep ? (
                <div style={{ fontSize: 13.5, color: TXT2, marginTop: 4 }}>
                  {avecIndices(tache.type === 'num' ? `Réponse attendue : ${tache.affiche ? tache.affiche(tache.vrai) : sci(tache.vrai)} ${tache.unite}` : `Réponse : ${tache.options[tache.bonne]}. ${typeof tache.expl === 'string' ? tache.expl : ''}`)}
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


// ============================================================
//  KIT COMMUN : mémorisation, bandeau de contexte, briques d'interface
// ============================================================

// useState dont la valeur est gardée sur l'appareil (localStorage) : elle survit au rechargement de la page.
export function useEtatPersistant(cle, initial) {
  const [valeur, setValeur] = useState(() => {
    try {
      const brut = window.localStorage.getItem(cle);
      if (brut) return JSON.parse(brut);
    } catch { /* valeur illisible : on repart de la valeur initiale */ }
    return typeof initial === 'function' ? initial() : initial;
  });
  useEffect(() => {
    try { window.localStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* stockage indisponible : on continue sans */ }
  }, [cle, valeur]);
  return [valeur, setValeur];
}

// Bandeau « À propos de cette simulation » : à quoi elle sert, ce qu'on y apprend, par où commencer.
// Il peut être replié ; ce choix est mémorisé pour chaque simulation.
export function BandeauContexte({ id, contexte, couleur = '#0284c7' }) {
  const [replie, setReplie] = useEtatPersistant(`bandeau-replie-${id}`, false);
  if (!contexte) return null;
  const TXT = '#0f172a', TXT2 = '#334155';
  if (replie) return (
    <button onClick={() => setReplie(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px',
      padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${couleur}`, background: 'white', color: couleur,
      fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
      ℹ️ Mode d'emploi de cette simulation
    </button>
  );
  const ligneB = (emoji, titre, contenu) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 18, lineHeight: '22px' }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: couleur, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{titre}</div>
        <div style={{ fontSize: 14.5, color: TXT, lineHeight: 1.55 }}>{contenu}</div>
      </div>
    </div>
  );
  return (
    <div style={{ textAlign: 'left', background: 'white', border: `1.5px solid ${couleur}`, borderLeft: `6px solid ${couleur}`,
      borderRadius: 10, padding: '12px 14px', margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15.5, fontWeight: 800, color: TXT }}>ℹ️ À propos de cette simulation</span>
        <button onClick={() => setReplie(true)} style={{ background: 'none', border: 'none', color: TXT2, cursor: 'pointer',
          fontSize: 13, textDecoration: 'underline' }}>masquer</button>
      </div>
      {ligneB('🎯', 'À quoi ça sert', contexte.but)}
      {ligneB('📚', 'Vous allez apprendre', contexte.apprendre)}
      {ligneB('👣', 'Par où commencer', (
        <ol style={{ margin: '2px 0 0', paddingLeft: 20 }}>
          {contexte.etapes.map((e, k) => <li key={k} style={{ marginBottom: 2 }}>{e}</li>)}
        </ol>
      ))}
      {contexte.niveau && <div style={{ fontSize: 12.5, color: TXT2 }}>Niveau : {contexte.niveau}</div>}
    </div>
  );
}

// Briques d'interface partagées (mêmes styles que les pages Energy@School)
export const KIT = { txt: '#0f172a', txt2: '#334155', bord: '#cbd5e1', fond: '#f8fafc' };
export const styleBouton = (actif, c = '#0284c7') => ({ padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
  fontWeight: 700, fontSize: 14, border: `1.5px solid ${actif ? c : KIT.bord}`,
  background: actif ? c : 'white', color: actif ? 'white' : KIT.txt2 });
export const stylePetitBouton = (actif, c) => ({ ...styleBouton(actif, c), padding: '5px 10px', fontSize: 13 });
export const styleBoite = { background: KIT.fond, borderRadius: 10, padding: '10px 12px', border: `1px solid ${KIT.bord}` };

export function Section({ titre, ouvert, onBascule, children }) {
  return (
    <div style={{ border: `1px solid ${KIT.bord}`, borderRadius: 10, background: KIT.fond, marginBottom: 8 }}>
      <button onClick={onBascule} aria-expanded={!!ouvert}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: 15.5, color: KIT.txt, textAlign: 'left' }}>
        <span>{titre}</span><span style={{ fontSize: 11, color: KIT.txt2 }}>{ouvert ? '▲' : '▼'}</span>
      </button>
      {ouvert && <div style={{ padding: '0 12px 12px' }}>{children}</div>}
    </div>
  );
}

export function LigneMesure({ nom, valeur, couleur }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0',
      borderBottom: `1px dashed ${KIT.bord}`, fontSize: 14 }}>
      <span style={{ color: KIT.txt2, fontWeight: 600 }}>{avecIndices(nom)}</span>
      <span style={{ color: couleur || KIT.txt, fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{valeur}</span>
    </div>
  );
}

export function Curseur({ nom, valeur, onChange, min, max, pas, unite = '', decimales = 0, couleur = '#0284c7' }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>
        <span>{avecIndices(nom)}</span><span style={{ color: KIT.txt }}>{fmt(valeur, decimales)} {unite}</span>
      </div>
      <input type="range" min={min} max={max} step={pas} value={valeur} onChange={x => onChange(parseFloat(x.target.value))}
        aria-label={nom} style={{ width: '100%', accentColor: couleur }}/>
    </div>
  );
}

// Les trois boutons de mode, identiques sur toutes les pages
export function BoutonsModes({ mode, setMode, modes = ['guide', 'explore', 'defi'] }) {
  const def = { guide: ['🧭 Parcours guidé', ORANGE_GUIDE], explore: ['🔍 Exploration libre', '#334155'], defi: ['🎯 Défi', '#0ea5e9'] };
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {modes.map(m => <button key={m} onClick={() => setMode(m)} style={styleBouton(mode === m, def[m][1])}>{def[m][0]}</button>)}
    </div>
  );
}
