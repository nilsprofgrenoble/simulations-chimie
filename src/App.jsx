import { useState, useEffect, useRef } from "react";

// ============================================================
//  UTILITAIRES PARTAGÉS
// ============================================================

function Field({ label, value, onChange, step = 0.01, min = 0, width = 90 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: 12, color: "#667" }}>{label}</label>
      <input type="number" value={value} step={step} min={min}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ width, padding: "5px 8px", borderRadius: 6, border: "1px solid #dbeafc", fontSize: 14 }} />
    </div>
  );
}

function CoeffInput({ value, onChange }) {
  return (
    <input type="number" value={value} min="1" step="1"
      onChange={e => onChange(Math.max(1, parseInt(e.target.value) || 1))}
      style={{ width: 38, padding: "4px 2px", textAlign: "center", borderRadius: 6, border: "1px solid #dbeafc", fontSize: 13 }} />
  );
}

function TabBtn({ active, color, onClick, children }) {
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

const cardStyle = {
  background: "#fff", border: "1px solid #eef5ff",
  borderRadius: 10, padding: 14, boxSizing: "border-box"
};

// ============================================================
//  SIMULATION 1 — Avancement d'une réaction chimique
// ============================================================

function Simulation1() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(2);
  const [d, setD] = useState(1);
  const [nA0, setNA0] = useState(3.0);
  const [nB0, setNB0] = useState(4.0);
  const [nC0, setNC0] = useState(0.0);
  const [nD0, setND0] = useState(0.0);
  const [X, setX] = useState(0);
  const [activeTab, setActiveTab] = useState("hist");

  const histRef = useRef(null);
  const curveRef = useRef(null);

  useEffect(() => {
    if (window.Plotly) return;
    const s = document.createElement("script");
    s.src = "https://cdn.plot.ly/plotly-latest.min.js";
    document.head.appendChild(s);
  }, []);

  const getXf = () => Math.min(nA0 / a, nB0 / b);
  const getLimitant = () => (nA0 / a <= nB0 / b ? "A" : "B");
  const quantites = (x) => [nA0 - a * x, nB0 - b * x, nC0 + c * x, nD0 + d * x];
  const Xf = getXf();
  const Xclamped = Math.min(X, Xf);
  const n = quantites(Xclamped);
  const nFin = quantites(Xf);
  const colors = ["#619CFF", "#F8766D", "#00BA38", "#C77CFF"];

  useEffect(() => {
    if (!window.Plotly) return;
    const labels = ["A", "B", "C", "D"];
    const n_init = [nA0, nB0, nC0, nD0];

    if (histRef.current && activeTab === "hist") {
      window.Plotly.react(histRef.current,
        [
          { x: labels, y: n_init, name: "État initial", type: "bar", marker: { color: "grey", opacity: 0.27 } },
          { x: labels, y: n, name: "État actuel", type: "bar", marker: { color: colors, opacity: 0.95 }, text: n.map(v => v.toFixed(2)), textposition: "outside" }
        ],
        { barmode: "overlay", bargap: 0.2, yaxis: { title: "Quantité (mol)", range: [0, Math.max(...n_init) * 1.15 || 1] }, margin: { t: 30, l: 55, r: 10, b: 45 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "#fafcff", autosize: true },
        { displayModeBar: false, responsive: true }
      );
    }

    if (curveRef.current && activeTab === "curves") {
      const npts = 200;
      const XfSafe = Math.max(Xf, 0.0001);
      const X_vals = Array.from({ length: npts + 1 }, (_, i) => i * XfSafe / npts);
      const ys = [[], [], [], []];
      X_vals.forEach(x => { quantites(x).forEach((v, i) => ys[i].push(v)); });
      const maxY = Math.max(...[nA0, nB0, nC0, nD0]) * 1.05 || 1;
      window.Plotly.react(curveRef.current,
        [
          ...["A","B","C","D"].map((name, i) => ({ x: X_vals, y: ys[i], name, line: { color: colors[i] } })),
          { x: [Xclamped, Xclamped], y: [0, maxY], mode: "lines", line: { color: "#333", dash: "dash", width: 1 }, showlegend: false },
          { x: Array(4).fill(Xclamped), y: n, mode: "markers", marker: { color: "black", size: 8 }, showlegend: false }
        ],
        { xaxis: { title: "Avancement X (mol)" }, yaxis: { title: "Quantité (mol)", rangemode: "tozero" }, margin: { t: 30, l: 55, r: 10, b: 45 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "#fafcff", autosize: true },
        { displayModeBar: false, responsive: true }
      );
    }
  }, [a, b, c, d, nA0, nB0, nC0, nD0, X, activeTab]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "Inter, system-ui, Arial", fontSize: 14 }}>

      {/* Équation + coefficients */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, color: "#445", marginBottom: 10 }}>Équation et coefficients stœchiométriques</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <CoeffInput value={a} onChange={setA} /><strong style={{ color: "#619CFF" }}>A</strong>
          <span>+</span>
          <CoeffInput value={b} onChange={setB} /><strong style={{ color: "#F8766D" }}>B</strong>
          <span style={{ fontSize: 18 }}>→</span>
          <CoeffInput value={c} onChange={setC} /><strong style={{ color: "#00BA38" }}>C</strong>
          <span>+</span>
          <CoeffInput value={d} onChange={setD} /><strong style={{ color: "#C77CFF" }}>D</strong>
        </div>
      </div>

      {/* Quantités initiales */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, color: "#445", marginBottom: 10 }}>Quantités initiales (mol)</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Field label={<>n<sub>A</sub>⁰</>} value={nA0} onChange={setNA0} step={0.1} />
          <Field label={<>n<sub>B</sub>⁰</>} value={nB0} onChange={setNB0} step={0.1} />
          <Field label={<>n<sub>C</sub>⁰</>} value={nC0} onChange={setNC0} step={0.1} />
          <Field label={<>n<sub>D</sub>⁰</>} value={nD0} onChange={setND0} step={0.1} />
        </div>
      </div>

      {/* Slider + infos */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Avancement X =</span>
          <input type="range" min="0" max={Math.max(0.0001, Xf)} step={Math.max(0.001, Xf / 100)} value={Xclamped}
            onChange={e => setX(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: "#2a9d8f" }} />
          <strong style={{ whiteSpace: "nowrap", minWidth: 70 }}>{Xclamped.toFixed(2)} mol</strong>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "#445", background: "#f4f7fd", borderRadius: 8, padding: "8px 12px" }}>
          <span>Réactif limitant : <strong>{getLimitant()}</strong></span>
          <span>X<sub>f</sub> = <strong>{Xf.toFixed(2)} mol</strong></span>
          {["A","B","C","D"].map((l,i) => (
            <span key={l}>n<sub>{l}</sub> = <strong style={{ color: colors[i] }}>{n[i].toFixed(2)}</strong></span>
          ))}
        </div>
      </div>

      {/* Onglets graphiques */}
      <div style={{ display: "flex", gap: 8 }}>
        <TabBtn active={activeTab === "hist"} color="#e63946" onClick={() => setActiveTab("hist")}>📊 Histogrammes</TabBtn>
        <TabBtn active={activeTab === "curves"} color="#2a9d8f" onClick={() => setActiveTab("curves")}>📈 Courbes continues</TabBtn>
      </div>

      <div style={cardStyle}>
        <div ref={histRef} style={{ display: activeTab === "hist" ? "block" : "none", height: 300 }} />
        <div ref={curveRef} style={{ display: activeTab === "curves" ? "block" : "none", height: 300 }} />
      </div>

      {/* Tableau d'avancement */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, color: "#445", marginBottom: 10 }}>Tableau d'avancement</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f0f2fa" }}>
                <th style={th}>État</th>
                <th style={th}>X (mol)</th>
                {["A","B","C","D"].map((l, i) => (
                  <th key={l} style={{ ...th, color: colors[i] }}>
                    {[a,b,c,d][i] > 1 ? [a,b,c,d][i] : ""}{l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Initial</td><td style={td}>0</td>
                {[nA0,nB0,nC0,nD0].map((v,i) => <td key={i} style={td}>{v.toFixed(2)}</td>)}
              </tr>
              <tr style={{ background: "#f4f7fd" }}>
                <td style={td}>En cours</td><td style={td}>{Xclamped.toFixed(2)}</td>
                {[nA0,nB0,nC0,nD0].map((v,i) => (
                  <td key={i} style={td}>{v.toFixed(2)} {["−","−","+","+"][i]} {[a,b,c,d][i]}×{Xclamped.toFixed(2)}</td>
                ))}
              </tr>
              <tr>
                <td style={td}>Final</td><td style={td}>{Xf.toFixed(2)}</td>
                {nFin.map((v,i) => <td key={i} style={td}>{v.toFixed(2)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const th = { border: "1px solid #ccc", padding: "6px 12px", textAlign: "center", fontWeight: 700 };
const td = { border: "1px solid #ccc", padding: "5px 10px", textAlign: "center" };

// ============================================================
//  SIMULATION 2 — Titrage volumétrique
// ============================================================

function Simulation2() {
  const [VB, setVB] = useState(0);
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(1);
  const [cA, setCA] = useState(0.1);
  const [VA, setVA] = useState(20);
  const [cB, setCB] = useState(0.1);
  const [nADirect, setNADirect] = useState(null);
  const [nAInput, setNAInput] = useState(2);
  const [useNADirect, setUseNADirect] = useState(false);
  const [activeTab, setActiveTab] = useState("hist");

  const histRef = useRef(null);
  const curvesRef = useRef(null);

  const nA0 = () => (nADirect !== null ? nADirect : cA * VA);
  const computeVeq = () => (nA0() * b) / (a * (cB || 1e-9));

  const quantites = (vb) => {
    const Veq = computeVeq();
    if (vb <= Veq) { const X = (cB * vb) / b; return [nA0() - a * X, 0, c * X, d * X]; }
    else { const Xeq = (cB * Veq) / b; return [0, cB * (vb - Veq), c * Xeq, d * Xeq]; }
  };

  const colors = ["#9CC3FF", "#F9A6A0", "#A8E6A1", "#D3B3FF"];
  const Veq = computeVeq();
  const maxVB = Math.max(1, Veq * 2);

  useEffect(() => {
    if (!window.Plotly) return;
    const n = quantites(VB);
    const labels = ["A", "B", "C", "D"];

    if (histRef.current && activeTab === "hist") {
      window.Plotly.react(histRef.current,
        [
          { x: labels, y: [nA0(), 0, 0, 0], name: "État initial", type: "bar", marker: { color: "rgba(160,160,160,0.28)" } },
          { x: labels, y: n, name: "État actuel", type: "bar", marker: { color: colors } },
        ],
        { barmode: "overlay", yaxis: { title: "Quantité (mmol)" }, margin: { t: 30, l: 55, r: 10, b: 45 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "#fafcff", autosize: true },
        { displayModeBar: false, responsive: true }
      );
    }

    if (curvesRef.current && activeTab === "curves") {
      const npts = 300;
      const VB_vals = Array.from({ length: npts }, (_, i) => i * maxVB / (npts - 1));
      const ys = [[], [], [], []];
      VB_vals.forEach(v => { quantites(v).forEach((val, i) => ys[i].push(val)); });
      const maxY = Math.max(...ys.flat()) * 1.05 || 1;
      window.Plotly.react(curvesRef.current,
        [
          ...["A","B","C","D"].map((name, i) => ({ x: VB_vals, y: ys[i], name, line: { color: colors[i] } })),
          { x: [VB, VB], y: [0, maxY], mode: "lines", line: { dash: "dot", color: "#333" }, showlegend: false },
          ...colors.map((col, i) => ({ x: [VB], y: [quantites(VB)[i]], mode: "markers", marker: { color: col, size: 8 }, showlegend: false }))
        ],
        { xaxis: { title: "VB (mL)" }, yaxis: { title: "Quantité (mmol)" }, margin: { t: 30, l: 55, r: 10, b: 45 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "#fafcff", autosize: true },
        { displayModeBar: false, responsive: true }
      );
    }
  }, [VB, a, b, c, d, cA, VA, cB, nADirect, activeTab]);

  // SVG
  const hMaxBurette = 180, hMaxBecher = 100, scalePerMl = 1.5;
  const newHB = Math.max(4, Math.round(hMaxBurette * (1 - VB / maxVB)));
  const buretteY = 30 + (hMaxBurette - newHB);
  const hInitial = Math.min(hMaxBecher, Math.round(scalePerMl * VA));
  const hTotal = Math.min(hMaxBecher, hInitial + Math.round(scalePerMl * VB));
  const fillColor = VB < Veq ? "#a8d8ff" : Math.abs(VB - Veq) < 0.01 ? "#e6f0ff" : "#f9bfbf";

  return (
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontFamily: "Inter, system-ui, Arial", fontSize: 14 }}>

      {/* Colonne gauche */}
      <div style={{ width: 340, minWidth: 260, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={cardStyle}>
          <svg viewBox="0 0 300 420" style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }}>
            <rect x="140" y="30" width="20" height={hMaxBurette} stroke="#333" strokeWidth="2" fill="none" />
            <rect x="140" y={buretteY} width="20" height={newHB} fill="#F9A6A0" />
            <rect x="147" y="210" width="6" height="8" fill="#222" />
            <line x1="150" y1="218" x2="150" y2={360 - hTotal} stroke="#F9A6A0" strokeWidth="2" opacity={VB > 0.0001 ? 0.6 : 0.12} />
            <rect x="110" y="240" width="80" height="120" stroke="#333" strokeWidth="2" fill="none" />
            <rect x="110" y={360 - hTotal} width="80" height={hTotal} fill={fillColor} />
            <text x="150" y="18" textAnchor="middle" fontSize="12">Burette</text>
            <text x="150" y="395" textAnchor="middle" fontSize="12">Bécher</text>
          </svg>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 600, color: "#445", marginBottom: 8 }}>Équation : aA + bB → cC + dD</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {[["a",a,setA],["b",b,setB],["c",c,setC],["d",d,setD]].map(([name, val, setter], i) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <CoeffInput value={val} onChange={setter} />
                <strong>{["A","B","C","D"][i]}</strong>
                {i === 0 && <span>+</span>}{i === 1 && <span>→</span>}{i === 2 && <span>+</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 600, color: "#445", marginBottom: 6 }}>Solution titrée (A)</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
            <label style={{ cursor: "pointer", fontSize: 13 }}>
              <input type="radio" name="mode2" checked={!useNADirect} onChange={() => { setUseNADirect(false); setNADirect(null); }} /> c<sub>A</sub> & V<sub>A</sub>
            </label>
            <label style={{ cursor: "pointer", fontSize: 13 }}>
              <input type="radio" name="mode2" checked={useNADirect} onChange={() => { setUseNADirect(true); setNADirect(nAInput); }} /> n<sub>A</sub> direct
            </label>
          </div>
          {!useNADirect ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Field label={<>c<sub>A</sub> (mol·L⁻¹)</>} value={cA} onChange={setCA} />
              <Field label={<>V<sub>A</sub> (mL)</>} value={VA} onChange={setVA} step={1} />
            </div>
          ) : (
            <Field label={<>n<sub>A</sub> (mmol)</>} value={nAInput} onChange={v => { setNAInput(v); setNADirect(v); }} step={0.1} />
          )}
          <div style={{ fontWeight: 600, color: "#445", margin: "10px 0 6px" }}>Solution titrante (B)</div>
          <Field label={<>c<sub>B</sub> (mol·L⁻¹)</>} value={cB} onChange={v => setCB(Math.max(1e-9, v))} />
          <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
            V<sub>eq</sub> prévu = <strong>{computeVeq().toFixed(2)}</strong> mL
          </div>
        </div>
      </div>

      {/* Colonne droite */}
      <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>V<sub>B</sub> =</span>
          <input type="range" min="0" max={maxVB} step={Math.max(0.01, Veq / 100)} value={VB}
            onChange={e => setVB(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: "#e63946" }} />
          <strong style={{ whiteSpace: "nowrap", minWidth: 70 }}>{parseFloat(VB).toFixed(2)} mL</strong>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TabBtn active={activeTab === "hist"} color="#e63946" onClick={() => setActiveTab("hist")}>📊 Histogrammes</TabBtn>
          <TabBtn active={activeTab === "curves"} color="#2a9d8f" onClick={() => setActiveTab("curves")}>📈 Courbes continues</TabBtn>
        </div>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div ref={histRef} style={{ display: activeTab === "hist" ? "block" : "none", height: 340 }} />
          <div ref={curvesRef} style={{ display: activeTab === "curves" ? "block" : "none", height: 340 }} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  SIMULATION 3 — À remplir
// ============================================================

function Simulation3() {
  return (
    <iframe
      src="/titrage-electrochimie.html"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
      }}
      title="Méthodes de titrages en électrochimie"
    />
  );
}

// ============================================================
//  MENU — modifiez les noms et icônes ici
// ============================================================

const SIMULATIONS = [
  { id: 1, label: "Avancement d'une réaction", icon: "⚗️", color: "#2a9d8f", component: Simulation1 },
  { id: 2, label: "Titrage volumétrique",       icon: "🧪", color: "#e63946", component: Simulation2 },
  { id: 3, label: "Titrages électrochimiques", icon: "⚡", color: "#e9a824", component: Simulation3 },
];

// ============================================================
//  COMPOSANT PRINCIPAL
// ============================================================

export default function App() {
  const [activeId, setActiveId] = useState(1);
  const active = SIMULATIONS.find((s) => s.id === activeId);
  const ActiveComponent = active.component;

  return (
    <div style={styles.root}>
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={{ fontSize: "2.2rem" }}>⚛️</div>
          <div>
            <div style={styles.siteTitle}>Labo Chimie</div>
            <div style={styles.siteSub}>Simulations interactives</div>
          </div>
        </div>
        <div style={styles.divider} />
        <nav style={styles.nav}>
          {SIMULATIONS.map((sim) => {
            const isActive = sim.id === activeId;
            return (
              <button key={sim.id} onClick={() => setActiveId(sim.id)} style={{
                ...styles.navBtn,
                background: isActive ? sim.color : "transparent",
                color: isActive ? "#fff" : "#444",
                boxShadow: isActive ? `0 4px 18px ${sim.color}55` : "none",
                transform: isActive ? "translateX(4px)" : "translateX(0)",
              }}>
                <span style={{ fontSize: "1.3rem" }}>{sim.icon}</span>
                <span style={{ flex: 1 }}>{sim.label}</span>
                {isActive && <span style={{ fontSize: "1.4rem", opacity: 0.8 }}>›</span>}
              </button>
            );
          })}
        </nav>
        <div style={styles.sidebarFooter}>
          <span style={{ fontSize: "0.75rem", color: "#aaa" }}>Fait avec ❤️ &amp; Claude</span>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={{
          ...styles.topBar,
          background: `linear-gradient(135deg, ${active.color}22, ${active.color}08)`,
          borderBottom: `3px solid ${active.color}`
        }}>
          <span style={{ fontSize: "2rem" }}>{active.icon}</span>
          <h1 style={{ ...styles.pageTitle, color: active.color }}>{active.label}</h1>
        </div>
        <div style={styles.simContainer}>
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}

const styles = {
  root: { display: "flex", minHeight: "100vh", fontFamily: "'Nunito', 'Segoe UI', sans-serif", background: "#f5f7fa", position: "relative", overflow: "hidden" },
  bgBlob1: { position: "fixed", top: "-120px", right: "-120px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, #e6394622 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 },
  bgBlob2: { position: "fixed", bottom: "-100px", left: "200px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, #2a9d8f22 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 },
  sidebar: { width: "230px", minHeight: "100vh", background: "#ffffff", boxShadow: "4px 0 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", padding: "1.5rem 1rem", position: "relative", zIndex: 10, flexShrink: 0 },
  sidebarHeader: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" },
  siteTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: "700", color: "#222", lineHeight: 1.2 },
  siteSub: { fontSize: "0.68rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" },
  divider: { height: "1px", background: "linear-gradient(to right, #e0e0e0, transparent)", margin: "0.5rem 0 1rem" },
  nav: { display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.75rem 1rem", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", fontFamily: "'Nunito', sans-serif", transition: "all 0.2s ease", textAlign: "left", width: "100%" },
  sidebarFooter: { marginTop: "auto", paddingTop: "1rem", textAlign: "center" },
  main: { flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, minWidth: 0 },
  topBar: { display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 2rem" },
  pageTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: "700", margin: 0 },
  simContainer: { flex: 1, padding: "1.5rem 2rem", overflowY: "auto" },
};