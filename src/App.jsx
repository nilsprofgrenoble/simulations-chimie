import { useState, useEffect, useRef, useMemo } from "react"

// ============================================================
//  UTILITAIRES PARTAGÉS
// ============================================================

function Field({ label, value, onChange, step = 0.01, min = 0, width = 90, type = "number" }) {
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

function Simulation1({ plotlyReady }) {
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

function Simulation2({ plotlyReady }) {
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
  const [mA, setMA] = useState(1.0);
  const [MA, setMAMol] = useState(100);
  const [useMasseDirect, setUseMasseDirect] = useState(false);

  const histRef = useRef(null);
  const curvesRef = useRef(null);

  const nA0 = () => {
    if (useMasseDirect) return (mA / MA) * 1000;
    if (nADirect !== null) return nADirect;
    return cA * VA;
  };
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
  }, [VB, a, b, c, d, cA, VA, cB, nADirect, activeTab, plotlyReady]);

  
  // SVG
// SVG dynamique
  const hBurette = 275; // hauteur totale solution burette
  const solutionH = Math.max(0, Math.round(hBurette * (1 - VB / maxVB)));
  const solutionY = 45 + (hBurette - solutionH);
  const becherSolH = Math.min(50, Math.round(10 + (VB / maxVB) * 40));
  const becherSolY = 470 - becherSolH;
  const fillColor = VB < Veq - 0.01 ? "#a8d8ff" : VB > Veq + 0.01 ? "#f9bfbf" : "#e6f0ff";
  const angle = (Date.now() / 5) % 360; // pour le barreau (non utilisé ici, géré par CSS)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "Inter, system-ui, Arial", fontSize: 14 }}>

      {/* LIGNE 1 : schéma + paramètres */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>

        {/* Colonne 1 : schéma SVG */}
        <div style={{ ...cardStyle, flex: "0 0 280px" }}>
          <style>{`
            @keyframes rotateBarreau {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            .barreau-anim { transform-origin: 183px 452px; animation: rotateBarreau 1.2s linear infinite; }
          `}</style>
          <svg viewBox="0 0 340 540" style={{ width: "100%", display: "block" }}>
            <defs>
              <linearGradient id="sg2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#777"/>
                <stop offset="50%" stopColor="#aaa"/>
                <stop offset="100%" stopColor="#777"/>
              </linearGradient>
            </defs>

            {/* Support */}
            <rect x="55" y="20" width="8" height="460" rx="3" fill="url(#sg2)"/>
            <rect x="25" y="478" width="100" height="12" rx="4" fill="#555"/>
            <rect x="47" y="90" width="24" height="14" rx="4" fill="#666"/>
            <rect x="71" y="95" width="110" height="6" rx="3" fill="#777"/>

            {/* Burette - solution */}
            <rect x="173" y={solutionY} width="20" height={solutionH} fill="#c084c0" opacity="0.55"/>
            {/* Burette - tube ouvert en haut */}
            <line x1="172" y1="30"  x2="172" y2="320" stroke="#5599bb" strokeWidth="1.5"/>
            <line x1="194" y1="30"  x2="194" y2="320" stroke="#5599bb" strokeWidth="1.5"/>
            <line x1="172" y1="320" x2="194" y2="320" stroke="#5599bb" strokeWidth="1.5"/>

            {/* Graduations principales */}
            {[0,5,10,15,20].map((val, i) => (
              <g key={val}>
                <line x1="165" y1={45 + i*56} x2="172" y2={45 + i*56} stroke="#445" strokeWidth="0.8"/>
                <text x="161" y={48 + i*56} textAnchor="end" fontSize="11" fill="#445">{val}</text>
              </g>
            ))}
            {[1,2,3,4,6,7,8,9,11,12,13,14,16,17,18,19].map(val => (
              <line key={val} x1="168" y1={45 + val*11.2} x2="172" y2={45 + val*11.2} stroke="#445" strokeWidth="0.6" opacity="0.6"/>
            ))}

            {/* Robinet */}
            <rect x="175" y="318" width="16" height="12" rx="2" fill="#cc4444" stroke="#993333" strokeWidth="1"/>
            <rect x="163" y="321" width="40" height="5" rx="2" fill="#cc4444" stroke="#993333" strokeWidth="0.8"/>

            {/* Pointe */}
            <path d="M179,330 L183,354 L187,330 Z" fill="none" stroke="#5599bb" strokeWidth="1.2"/>

            {/* Goutte */}
            {VB > 0.01 && <ellipse cx="183" cy="361" rx="3" ry="4" fill="#c084c0" opacity="0.8"/>}

            {/* Bécher - solution */}
            <rect x="140" y={becherSolY} width="90" height={becherSolH} fill={fillColor} opacity="0.7"/>
            {/* Bécher - parois */}
            <line x1="140" y1="375" x2="140" y2="470" stroke="#5599bb" strokeWidth="1.8"/>
            <line x1="230" y1="375" x2="230" y2="470" stroke="#5599bb" strokeWidth="1.8"/>
            <line x1="140" y1="470" x2="230" y2="470" stroke="#5599bb" strokeWidth="1.8"/>

            {/* Barreau aimanté */}
            <g className="barreau-anim">
              <rect x="177" y="450" width="12" height="4" rx="2" fill="white" stroke="#aaa" strokeWidth="0.8"/>
            </g>

            {/* Agitateur magnétique */}
            <rect x="128" y="473" width="114" height="22" rx="5" fill="#444"/>
            <rect x="130" y="475" width="110" height="18" rx="4" fill="#666"/>
            <circle cx="228" cy="484" r="7" fill="#333" stroke="#555" strokeWidth="1"/>
            <circle cx="228" cy="484" r="4" fill="#888"/>
            <circle cx="212" cy="484" r="3" fill="#ff4444" opacity="0.9"/>
            <rect x="135" y="493" width="12" height="5" rx="2" fill="#333"/>
            <rect x="223" y="493" width="12" height="5" rx="2" fill="#333"/>

            {/* Labels */}
            <text x="215" y="42" fontSize="14" fill="#334" fontWeight="bold">Burette</text>
            <text x="215" y="338" fontSize="13" fill="#884488">Sol. titrante</text>
            <text x="183" y="368" textAnchor="middle" fontSize="13" fill="#445">{VB.toFixed(2)} mL versés</text>
            <text x="183" y="410" textAnchor="middle" fontSize="13" fill="#4488bb">Sol. titrée</text>
          </svg>
        </div>

        {/* Colonne 2 : paramètres */}
        <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 12 }}>

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
            <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
              <label style={{ cursor: "pointer", fontSize: 13 }}>
                <input type="radio" name="mode2" checked={!useNADirect && !useMasseDirect}
                  onChange={() => { setUseNADirect(false); setNADirect(null); setUseMasseDirect(false); }} />
                {" "}c<sub>A</sub> & V<sub>A</sub>
              </label>
              <label style={{ cursor: "pointer", fontSize: 13 }}>
                <input type="radio" name="mode2" checked={useNADirect && !useMasseDirect}
                  onChange={() => { setUseNADirect(true); setNADirect(nAInput); setUseMasseDirect(false); }} />
                {" "}n<sub>A</sub> direct
              </label>
              <label style={{ cursor: "pointer", fontSize: 13 }}>
                <input type="radio" name="mode2" checked={useMasseDirect}
                  onChange={() => { setUseMasseDirect(true); setUseNADirect(false); setNADirect(null); }} />
                {" "}m<sub>A</sub> & M<sub>A</sub>
              </label>
            </div>

            {!useNADirect && !useMasseDirect && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Field label={<>c<sub>A</sub> (mol·L⁻¹)</>} value={cA} onChange={setCA} />
                <Field label={<>V<sub>A</sub> (mL)</>} value={VA} onChange={setVA} step={1} />
              </div>
            )}
            {useNADirect && !useMasseDirect && (
              <Field label={<>n<sub>A</sub> (mmol)</>} value={nAInput} onChange={v => { setNAInput(v); setNADirect(v); }} step={0.1} />
            )}
            {useMasseDirect && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Field label={<>m<sub>A</sub> (g)</>} value={mA} onChange={setMA} step={0.01} />
                <Field label={<>M<sub>A</sub> (g·mol⁻¹)</>} value={MA} onChange={setMAMol} step={1} />
              </div>
            )}

            <div style={{ fontWeight: 600, color: "#445", margin: "10px 0 6px" }}>Solution titrante (B)</div>
            <Field label={<>c<sub>B</sub> (mol·L⁻¹)</>} value={cB} onChange={v => setCB(Math.max(1e-9, v))} />
            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
              n<sub>A</sub> = <strong>{nA0().toFixed(3)}</strong> mmol &nbsp;|&nbsp;
              V<sub>eq</sub> prévu = <strong>{computeVeq().toFixed(2)}</strong> mL
            </div>
          </div>

          {/* Slider VB dans la colonne paramètres */}
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>V<sub>B</sub> =</span>
            <input type="range" min="0" max={maxVB} step={Math.max(0.01, Veq / 100)} value={VB}
              onChange={e => setVB(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: "#e63946" }} />
            <strong style={{ whiteSpace: "nowrap", minWidth: 70 }}>{parseFloat(VB).toFixed(2)} mL</strong>
          </div>

        </div>
      </div>

      {/* LIGNE 2 : graphiques pleine largeur */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <TabBtn active={activeTab === "hist"} color="#e63946" onClick={() => setActiveTab("hist")}>📊 Histogrammes</TabBtn>
          <TabBtn active={activeTab === "curves"} color="#2a9d8f" onClick={() => setActiveTab("curves")}>📈 Courbes continues</TabBtn>
        </div>
        <div style={{ ...cardStyle }}>
          <div ref={histRef} style={{ display: activeTab === "hist" ? "block" : "none", height: 340 }} />
          <div ref={curvesRef} style={{ display: activeTab === "curves" ? "block" : "none", height: 340 }} />
        </div>
      </div>

    </div>
  );
}

function SchemaElectro({ mode, x }) {
  const undef = x <= 0.02 || Math.abs(x - 1) <= 0.02;
  const apresEq = x > 1.02;

  const couleurSolution = x < 0.98 ? "#a8d8ff" : x < 1.02 ? "#e6f0ff" : "#fff0c0";

  const nernstFer = () => {
    const cFe3 = x * 1, cFe2 = (1 - x) * 1;
    return (0.68 + 0.06 * Math.log10(cFe3 / cFe2)).toFixed(3);
  };
  const nernstCer = () => {
    const cCe4 = (x - 1) * 1, cCe3 = 1;
    return (1.44 + 0.06 * Math.log10(cCe4 / cCe3)).toFixed(3);
  };

  const labelPotentiel = () => {
    if (undef) return { ligne1: "⚠ Potentiel E mal défini !", ligne2: "" };
    if (!apresEq) return {
      ligne1: "E°(Fe³⁺/Fe²⁺) + 0,06·log([Fe³⁺]/[Fe²⁺])",
      ligne2: `E = ${nernstFer()} V`
    };
    return {
      ligne1: "E°(Ce⁴⁺/Ce³⁺) + 0,06·log([Ce⁴⁺]/[Ce³⁺])",
      ligne2: `E = ${nernstCer()} V`
    };
  };

  const { ligne1, ligne2 } = labelPotentiel();

  return (
    <svg viewBox="0 0 320 400" style={{ width: "100%", minHeight: 380, display: "block" }}>

       
      {/* ── Mode potentiométrie i=0 : ET + ER + Voltmètre ── */}
      {mode === "pot0" && <>

        {/* Électrode de travail ET */}
        <rect x="108" y="100" width="10" height="115" rx="2" fill="#888"/>
        <text x="113" y="93" textAnchor="middle" fontSize="14" fill="#555" fontWeight="bold">ET</text>

        {/* Électrode de référence ER */}
        <rect x="200" y="100" width="10" height="115" rx="2" fill="#e9a824"/>
        <text x="205" y="93" textAnchor="middle" fontSize="14" fill="#b07800" fontWeight="bold">ER</text>

        {/* ── Bécher ── */}
        <rect x="60" y="155" width="200" height="120" fill={couleurSolution} opacity="0.65"/>
        <line x1="60"  y1="125" x2="60"  y2="275" stroke="#5599bb" strokeWidth="2"/>
        <line x1="260" y1="125" x2="260" y2="275" stroke="#5599bb" strokeWidth="2"/>
        <line x1="60"  y1="275" x2="260" y2="275" stroke="#5599bb" strokeWidth="2"/>

        {/* Contenu bécher */}
        <text x="160" y="205" textAnchor="middle" fontSize="15" fill="#334" fontWeight="bold">
          {x <= 0.02 ? "Fe²⁺" : x < 0.98 ? "Fe²⁺ + Fe³⁺" : x < 1.02 ? "Fe³⁺ + Ce³⁺" : "Fe³⁺ + Ce³⁺ + Ce⁴⁺"}
        </text>
        <text x="160" y="223" textAnchor="middle" fontSize="13" fill="#555">{`x = ${x.toFixed(2)}`}</text>

        {/* Potentiel de Nernst sous le bécher */}
        <text x="160" y="295" textAnchor="middle" fontSize="12"
          fill={undef ? "#c0392b" : "#1a7a3a"} fontWeight={undef ? "bold" : "normal"}>
          {undef ? "⚠ Potentiel E mal défini !" : "E ="}
        </text>
        {!undef && (
          <text x="160" y="312" textAnchor="middle" fontSize="11" fill="#1a7a3a">
            {ligne1}
          </text>
        )}
        {ligne2 !== "" && (
          <text x="160" y="330" textAnchor="middle" fontSize="14" fill="#1a7a3a" fontWeight="bold">
            {ligne2}
          </text>
        )}

        {/* Fil ET vers voltmètre */}
        <line x1="113" y1="100" x2="113" y2="65" stroke="#333" strokeWidth="2"/>
        <line x1="113" y1="65" x2="136" y2="65" stroke="#333" strokeWidth="2"/>

        {/* Fil ER vers voltmètre */}
        <line x1="205" y1="100" x2="205" y2="65" stroke="#b07800" strokeWidth="2"/>
        <line x1="205" y1="65" x2="184" y2="65" stroke="#b07800" strokeWidth="2"/>

        {/* Voltmètre */}
        <circle cx="160" cy="65" r="26" fill="white" stroke="#333" strokeWidth="2"/>
        <text x="160" y="71" textAnchor="middle" fontSize="20" fill="#333" fontWeight="bold">V</text>

        
      </>}

      {mode === "courant" && <>

        {/* ── Label générateur AU DESSUS ── */}
        <text x="160" y="16" textAnchor="middle" fontSize="13" fill="#a00" fontWeight="bold">Géné. i = 10 µA</text>

        {/* ── Générateur centré sur les fils ── */}
        <rect x="118" y="22" width="84" height="28" rx="6" fill="#ffe0e0" stroke="#c0392b" strokeWidth="1.5"/>
        <text x="136" y="40" textAnchor="middle" fontSize="13" fill="#c0392b" fontWeight="bold">+</text>
        <text x="184" y="40" textAnchor="middle" fontSize="13" fill="#1a6eb5" fontWeight="bold">−</text>

        {/* ── EI1 à gauche (anode +) ── */}
        <rect x="55" y="95" width="10" height="175" rx="2" fill="#c0392b"/>
        <text x="70" y="88" textAnchor="start" fontSize="14" fill="#c0392b" fontWeight="bold">EI1</text>
        <text x="70" y="75" textAnchor="start" fontSize="13" fill="#c0392b">+</text>

        {/* ── EI2 à droite (cathode -) ── */}
        <rect x="253" y="95" width="10" height="175" rx="2" fill="#1a6eb5"/>
        <text x="248" y="88" textAnchor="end" fontSize="14" fill="#1a6eb5" fontWeight="bold">EI2</text>
        <text x="248" y="75" textAnchor="end" fontSize="13" fill="#1a6eb5">−</text>

        {/* ── Fils générateur ── */}
        {/* EI1 → borne + géné (fil rouge) */}
        <line x1="60"  y1="95" x2="60"  y2="36" stroke="#c0392b" strokeWidth="2"/>
        <line x1="60"  y1="36" x2="118" y2="36" stroke="#c0392b" strokeWidth="2"/>
        {/* borne - géné → EI2 (fil bleu) */}
        <line x1="202" y1="36" x2="258" y2="36" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="36" x2="258" y2="95" stroke="#1a6eb5" strokeWidth="2"/>

        {/* ── Flèches sens courant i (sens inverse des électrons) ── */}
        {/* Courant descend géné → EI1 (côté gauche) */}
        <polygon points="56,82 64,82 60,92" fill="#c0392b"/>
        {/* Courant monte EI2 → géné (côté droit) */}
        <polygon points="254,62 262,62 258,52" fill="#1a6eb5"/>
        {/* Courant fil horizontal géné → gauche */}
        <polygon points="98,32 98,40 88,36" fill="#c0392b"/>
        {/* Courant fil horizontal droite → géné */}
        <polygon points="232,32 232,40 222,36" fill="#1a6eb5"/>

        {/* ── Flèches électrons (verticales, en pointillé, à l'extérieur) ── */}
        {/* Gauche de EI1 : électrons montent (sens inverse du courant) */}
        <line x1="44" y1="95" x2="44" y2="58" stroke="#666" strokeWidth="1.5" strokeDasharray="4,3"/>
        <polygon points="40,62 48,62 44,52" fill="#666"/>
        <text x="36" y="80" textAnchor="middle" fontSize="11" fill="#666">e⁻</text>

        {/* Droite de EI2 : électrons descendent */}
        <line x1="274" y1="58" x2="274" y2="95" stroke="#666" strokeWidth="1.5" strokeDasharray="4,3"/>
        <polygon points="270,88 278,88 274,98" fill="#666"/>
        <text x="282" y="80" textAnchor="middle" fontSize="11" fill="#666">e⁻</text>

        {/* ── Bécher ── */}
        <rect x="35" y="195" width="248" height="110" fill={couleurSolution} opacity="0.65"/>
        <line x1="35"  y1="165" x2="35"  y2="305" stroke="#5599bb" strokeWidth="2"/>
        <line x1="283" y1="165" x2="283" y2="305" stroke="#5599bb" strokeWidth="2"/>
        <line x1="35"  y1="305" x2="283" y2="305" stroke="#5599bb" strokeWidth="2"/>

        {/* Contenu bécher */}
        <text x="159" y="248" textAnchor="middle" fontSize="15" fill="#334" fontWeight="bold">
          {x <= 0.02 ? "Fe²⁺" : x < 0.98 ? "Fe²⁺ + Fe³⁺" : x < 1.02 ? "Fe³⁺ + Ce³⁺" : "Fe³⁺ + Ce³⁺ + Ce⁴⁺"}
        </text>
        <text x="159" y="266" textAnchor="middle" fontSize="13" fill="#555">{`x = ${x.toFixed(2)}`}</text>

        {/* ── Voltmètre ΔE centré entre EI1 et EI2 ── */}
        <circle cx="159" cy="130" r="24" fill="white" stroke="#333" strokeWidth="2"/>
        <text x="159" y="126" textAnchor="middle" fontSize="13" fill="#333" fontWeight="bold">V</text>
        <text x="159" y="141" textAnchor="middle" fontSize="11" fill="#333">ΔE</text>
        {/* Fil voltmètre → EI1 */}
        <line x1="135" y1="130" x2="65"  y2="130" stroke="#333" strokeWidth="1.5" strokeDasharray="4,3"/>
        {/* Fil voltmètre → EI2 */}
        <line x1="183" y1="130" x2="253" y2="130" stroke="#333" strokeWidth="1.5" strokeDasharray="4,3"/>

        {/* ── Réactions juste sous chaque électrode ── */}
        {/* EI1 anode (oxydation, rouge) */}
        <text x="60" y="322" textAnchor="middle" fontSize="12" fill="#c0392b" fontWeight="bold">
          {x < 0.98 ? "Fe²⁺→Fe³⁺" : "Ce³⁺→Ce⁴⁺"}
        </text>
        {/* EI2 cathode (réduction, bleu) */}
        <text x="258" y="322" textAnchor="middle" fontSize="12" fill="#1a6eb5" fontWeight="bold">
          {x <= 0.02 ? "H⁺→H₂" : x < 0.98 ? "Fe³⁺→Fe²⁺" : x < 1.02 ? "Fe³⁺→Fe²⁺" : "Ce⁴⁺→Ce³⁺"}
        </text>

        
      </>}

      {/* ── Mode ampérométrie ── */}
      {mode === "ampero" && <>

        {/* ── Label générateur AU DESSUS ── */}
        <text x="160" y="16" textAnchor="middle" fontSize="13" fill="#7a4f00" fontWeight="bold">Géné. ΔV ≈ 100 mV</text>

        {/* ── Générateur de tension ── */}
        <rect x="118" y="22" width="84" height="28" rx="6" fill="#ffe0a0" stroke="#e9a824" strokeWidth="1.5"/>
        <text x="136" y="40" textAnchor="middle" fontSize="13" fill="#c0392b" fontWeight="bold">+</text>
        <text x="184" y="40" textAnchor="middle" fontSize="13" fill="#1a6eb5" fontWeight="bold">−</text>

        {/* ── EI1 à gauche (anode +) ── */}
        <rect x="55" y="95" width="10" height="175" rx="2" fill="#c0392b"/>
        <text x="70" y="88" textAnchor="start" fontSize="14" fill="#c0392b" fontWeight="bold">EI1</text>
        <text x="70" y="75" textAnchor="start" fontSize="13" fill="#c0392b">+</text>

        {/* ── EI2 à droite (cathode -) ── */}
        <rect x="235" y="95" width="10" height="175" rx="2" fill="#1a6eb5"/>
        <text x="230" y="88" textAnchor="end" fontSize="14" fill="#1a6eb5" fontWeight="bold">EI2</text>
        <text x="230" y="75" textAnchor="end" fontSize="13" fill="#1a6eb5">−</text>

        {/* ── Fils circuit ── */}
        {/* EI1 → borne + géné (fil rouge) */}
        <line x1="60"  y1="95" x2="60"  y2="36" stroke="#c0392b" strokeWidth="2"/>
        <line x1="60"  y1="36" x2="118" y2="36" stroke="#c0392b" strokeWidth="2"/>
        {/* borne - géné → ampèremètre (fil bleu) */}
        {/* borne - géné → ampèremètre */}
        <line x1="202" y1="36" x2="258" y2="36" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="36" x2="258" y2="53" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="89" x2="258" y2="95" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="95" x2="240" y2="95" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="240" y1="95" x2="240" y2="105" stroke="#1a6eb5" strokeWidth="2"/>
        {/* ampèremètre → EI2 */}
        <line x1="258" y1="36" x2="258" y2="60" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="82" x2="258" y2="95" stroke="#1a6eb5" strokeWidth="2"/>

        {/* ── Ampèremètre sur le fil EI2 ── */}
        <circle cx="258" cy="71" r="18" fill="white" stroke="#1a6eb5" strokeWidth="2"/>
        <text x="258" y="76" textAnchor="middle" fontSize="15" fill="#1a6eb5" fontWeight="bold">A</text>

        {/* ── Flèches sens courant i ── */}
        {/* Courant descend géné → EI1 (côté gauche) */}
        <polygon points="56,82 64,82 60,92" fill="#c0392b"/>
        {/* Courant fil horizontal gauche */}
        <polygon points="98,32 98,40 88,36" fill="#c0392b"/>
        {/* Courant fil horizontal droite — INVERSÉ (va vers la droite) */}
        <polygon points="222,32 222,40 232,36" fill="#1a6eb5"/>

        {/* ── Flèches électrons (verticales, pointillé, extérieur) ── */}
        {/* Gauche de EI1 : électrons montent */}
        <line x1="44" y1="95" x2="44" y2="58" stroke="#666" strokeWidth="1.5" strokeDasharray="4,3"/>
        <polygon points="40,62 48,62 44,52" fill="#666"/>
        <text x="36" y="80" textAnchor="middle" fontSize="11" fill="#666">e⁻</text>
        {/* Droite de EI2 : électrons descendent */}
        <line x1="280" y1="58" x2="280" y2="95" stroke="#666" strokeWidth="1.5" strokeDasharray="4,3"/>
        <polygon points="276,88 284,88 280,98" fill="#666"/>
        <text x="290" y="80" textAnchor="middle" fontSize="11" fill="#666">e⁻</text>

        {/* ── Bécher ── */}
        <rect x="35" y="195" width="248" height="110" fill={couleurSolution} opacity="0.65"/>
        <line x1="35"  y1="165" x2="35"  y2="305" stroke="#5599bb" strokeWidth="2"/>
        <line x1="283" y1="165" x2="283" y2="305" stroke="#5599bb" strokeWidth="2"/>
        <line x1="35"  y1="305" x2="283" y2="305" stroke="#5599bb" strokeWidth="2"/>

        {/* Contenu bécher */}
        <text x="159" y="248" textAnchor="middle" fontSize="15" fill="#334" fontWeight="bold">
          {x <= 0.02 ? "Fe²⁺" : x < 0.98 ? "Fe²⁺ + Fe³⁺" : x < 1.02 ? "Fe³⁺ + Ce³⁺" : "Fe³⁺ + Ce³⁺ + Ce⁴⁺"}
        </text>
        <text x="159" y="266" textAnchor="middle" fontSize="13" fill="#555">{`x = ${x.toFixed(2)}`}</text>

        {/* ── Réactions aux électrodes ── */}
        {/* EI1 anode (oxydation, rouge) */}
        <text x="60" y="322" textAnchor="middle" fontSize="12" fill="#c0392b" fontWeight="bold">
          {x <= 0.02 || Math.abs(x - 1) <= 0.02 ? "" : x < 0.98 ? "Fe²⁺→Fe³⁺" : "Ce³⁺→Ce⁴⁺"}
        </text>
        {/* EI2 cathode (réduction, bleu) */}
        <text x="258" y="322" textAnchor="middle" fontSize="12" fill="#1a6eb5" fontWeight="bold">
          {x <= 0.02 || Math.abs(x - 1) <= 0.02 ? "" : x < 0.98 ? "Fe³⁺→Fe²⁺" : "Ce⁴⁺→Ce³⁺"}
        </text>
        {/* Pas de réaction à x=0 et x=1 */}
        {(x <= 0.02 || Math.abs(x - 1) <= 0.02) && (
          <text x="159" y="322" textAnchor="middle" fontSize="12" fill="#888" fontStyle="italic">
            Pas de réactions !
          </text>
        )}

      </>}

      {/* Légende mode */}
      <text x="160" y="388" textAnchor="middle" fontSize="13" fill="#666" fontStyle="italic">
        {mode === "pot0" ? "Potentiométrie — i = 0" :
         mode === "courant" ? "Potentiométrie — i imposé" :
         "Ampérométrie — ΔE imposé"}
      </text>
    </svg>
  );
}

// ============================================================
//  SIMULATION 3 — Titrages électrochimiques
// ============================================================

function Simulation3({ plotlyReady }) {
  const [x, setX] = useState(0.0);
  const [mode, setMode] = useState("pot0");
  const [deltaEmV, setDeltaEmV] = useState(100);
  const [showReactions, setShowReactions] = useState(false);

  const plotIERef   = useRef(null);
  const plotRightRef = useRef(null);

  // ── Constantes physico-chimiques ──
  const T=298.15, F=96485, R=8.314;
  const ilim=1, ilim_slvt=100, c=1;
  const ia_display=0.05, ic_display=-0.05;
  const ia_calc=0.02,    ic_calc=-0.02;

  // ── Fonctions de courant ──
  const ia = (E,n,aR,E0,cR) => { const v=Math.exp(n*(E-E0)/(R*T/F)); return ilim*n/aR*cR*v/(1+v); };
  const ic = (E,n,aOx,E0,cOx) => { const v=Math.exp(-n*(E-E0)/(R*T/F)); return -ilim*n/aOx*cOx*v/(1+v); };
  const ia_slvt = E => { const v=Math.exp(2*(E-1.23-0.5)/(R*T/F)); return ilim_slvt*v/(5000+v); };
  const ic_slvt = E => { const v=Math.exp(-2*E/(R*T/F)); return -ilim_slvt*v/(5000+v); };

  const Fe_a = (E,xv) => xv<1 ? ia(E,1,1,0.68,(1-xv)*c) : 0;
  const Fe_c = (E,xv) => xv<1 ? ic(E,1,1,0.68,xv*c)     : ic(E,1,1,0.68,c);
  const Ce_a = (E,xv) => xv<1 ? ia(E,1,1,1.44,xv*c)     : ia(E,1,1,1.44,c);
  const Ce_c = (E,xv) => xv>1 ? ic(E,1,1,1.44,(xv-1)*c) : 0;

  const signal = (E,xv) => Fe_a(E,xv)+Fe_c(E,xv)+Ce_a(E,xv)+Ce_c(E,xv)+ia_slvt(E)+ic_slvt(E);

  const findEforI = (xv, target) => {
    const step=0.001;
    for(let E=-0.2; E<=1.6; E+=step){
      if((signal(E,xv)-target)*(signal(E+step,xv)-target)<0) return E;
    }
    return null;
  };

  const findIforDeltaE = (xv, dE) => {
    const step=0.001;
    let best=null;
    for(let Ec=-0.2; Ec<=1.6-dE; Ec+=step){
      const f1=signal(Ec+dE,xv)+signal(Ec,xv);
      const f2=signal(Ec+dE+step,xv)+signal(Ec+step,xv);
      if(f1*f2<0){
        let lo=Ec, hi=Ec+step;
        for(let k=0;k<20;k++){
          const mid=(lo+hi)/2;
          if((signal(lo+dE,xv)+signal(lo,xv))*(signal(mid+dE,xv)+signal(mid,xv))<0) hi=mid; else lo=mid;
        }
        const Ec_f=(lo+hi)/2, Ea_f=Ec_f+dE;
        const iVal=Math.abs(signal(Ea_f,xv));
        if(best===null||iVal>best.ia) best={Ea:Ea_f,Ec:Ec_f,ia:iVal,ic:-iVal};
      }
    }
    return best;
  };

  const moyenne = (f, Emin, Emax, step=0.02) => {
    const vals=[]; for(let e=Emin;e<=Emax;e+=step) vals.push(f(e));
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
  };

  const buildAnnotations = (xv) => {
    const anns=[], seuil=0.03;
    const cFe2=xv<1?(1-xv)*c:0, cFe3=xv<1?xv*c:c;
    const cCe3=xv<1?xv*c:c,   cCe4=xv>1?(xv-1)*c:0;

    const y_H2c=moyenne(E=>ic_slvt(E),-0.18,-0.10);
    if(Math.abs(y_H2c)>seuil) anns.push({E:-0.05,y:y_H2c/2,text:'H₂ ← H⁺',color:'#1a6eb5'});

    if(cFe3>seuil){
      const y=moyenne(E=>ic(E,1,1,0.68,cFe3),0.35,0.55);
      const off=moyenne(E=>signal(E,xv)-ic(E,1,1,0.68,cFe3),0.35,0.55);
      if(Math.abs(y)>seuil) anns.push({E:0.68,y:off+y/2,text:'Fe²⁺ ← Fe³⁺',color:'#1a6eb5'});
    }
    if(cCe4>seuil){
      const y=moyenne(E=>ic(E,1,1,1.44,cCe4),1.1,1.3);
      const off=moyenne(E=>signal(E,xv)-ic(E,1,1,1.44,cCe4),1.1,1.3);
      if(Math.abs(y)>seuil) anns.push({E:1.44,y:off+y/2,text:'Ce³⁺ ← Ce⁴⁺',color:'#1a6eb5'});
    }
    if(cFe2>seuil){
      const y=moyenne(E=>ia(E,1,1,0.68,cFe2),0.85,1.05);
      if(Math.abs(y)>seuil) anns.push({E:0.68,y:y/2,text:'Fe²⁺ → Fe³⁺',color:'#c0392b'});
    }
    if(cCe3>seuil){
      const y=moyenne(E=>ia(E,1,1,1.44,cCe3),1.55,1.65);
      const off=moyenne(E=>signal(E,xv)-ia(E,1,1,1.44,cCe3),1.55,1.65);
      if(Math.abs(y)>seuil) anns.push({E:1.44,y:off+y/2,text:'Ce³⁺ → Ce⁴⁺',color:'#c0392b'});
    }
    const y_O2=moyenne(E=>ia_slvt(E),1.75,1.78);
    if(Math.abs(y_O2)>seuil){
      const off=moyenne(E=>signal(E,xv)-ia_slvt(E),1.75,1.78);
      anns.push({E:1.73,y:off+y_O2/2,text:'H₂O → O₂',color:'#c0392b'});
    }
    return anns;
  };

  // ── Plotly ──
  useEffect(() => {
    if(!window.Plotly) return;
    const dE = deltaEmV/1000;

    // Courbe i = f(E)
    const Evals=[], Ivals=[];
    for(let e=-0.2; e<=1.8; e+=0.01){ Evals.push(e); Ivals.push(signal(e,x)); }

    const dataIE = [{x:Evals,y:Ivals,mode:'lines',name:'i(E)',line:{color:'steelblue'}}];
    const shapes=[];

    if(mode==="pot0"){
      const Ez=findEforI(x,0);
      if(Ez!==null) dataIE.push({x:[Ez],y:[0],mode:'markers',marker:{size:10,color:'black'},showlegend:false});
    }
    if(mode==="courant"){
      const Ea=findEforI(x,ia_display), Ec=findEforI(x,ic_display);
      if(Ea&&Ec){
        dataIE.push({x:[Ea],y:[ia_display],mode:'markers',marker:{color:'black',size:8}});
        dataIE.push({x:[Ec],y:[ic_display],mode:'markers',marker:{color:'black',size:8}});
        shapes.push({type:'line',x0:-0.2,x1:1.8,y0:ia_display,y1:ia_display,line:{dash:'dot',color:'gray'}});
        shapes.push({type:'line',x0:-0.2,x1:1.8,y0:ic_display,y1:ic_display,line:{dash:'dot',color:'gray'}});
        if(Ea&&Ec) shapes.push({type:'line',x0:Ea,x1:Ec,y0:0,y1:0,line:{width:3}});
      }
    }
    if(mode==="ampero"){
      const res=findIforDeltaE(x,dE);
      if(res){
        dataIE.push({x:[res.Ea],y:[res.ia],mode:'markers',marker:{color:'red',size:9},name:'anode'});
        dataIE.push({x:[res.Ec],y:[res.ic],mode:'markers',marker:{color:'blue',size:9},name:'cathode'});
        shapes.push({type:'line',x0:res.Ea,x1:res.Ec,y0:0,y1:0,line:{width:3,color:'orange'}});
        shapes.push({type:'line',x0:-0.2,x1:1.8,y0:res.ia,y1:res.ia,line:{dash:'dot',color:'red'}});
      }
    }

    const annotations = showReactions ? buildAnnotations(x).map(a=>({
      x:a.E, y:a.y, text:a.text, showarrow:false,
      font:{color:a.color,size:11},
      bgcolor:'rgba(255,255,255,0.82)',bordercolor:a.color,borderwidth:1,borderpad:3,xanchor:'center'
    })) : [];

    if(plotIERef.current)
      window.Plotly.react(plotIERef.current, dataIE, {
        xaxis:{title:'E (V)',range:[-0.2,1.8]},
        yaxis:{title:'i (u.a.)',range:[-1.5,1.5]},
        shapes, annotations,
        margin:{t:20,b:50,l:60,r:20},
        paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff', autosize:true
      },{displayModeBar:false,responsive:true});

    // Courbe de suivi
    const Xfine=[], Yfine=[];
    for(let xv=0; xv<=2; xv+=0.01){
      if(mode==="pot0"){
        const E=findEforI(xv,0); if(E!==null){Xfine.push(xv);Yfine.push(E);}
      } else if(mode==="courant"){
        const Ea=findEforI(xv,ia_calc), Ec=findEforI(xv,ic_calc);
        if(Ea&&Ec){Xfine.push(xv);Yfine.push(Math.abs(Ec-Ea));}
      } else if(mode==="ampero"){
        const res=findIforDeltaE(xv,dE);
        if(res){Xfine.push(xv);Yfine.push(res.ia);}
      }
    }

    let yPoint=null;
    if(mode==="pot0") yPoint=findEforI(x,0);
    else if(mode==="courant"){ const Ea=findEforI(x,ia_calc),Ec=findEforI(x,ic_calc); if(Ea&&Ec) yPoint=Math.abs(Ec-Ea); }
    else if(mode==="ampero"){ const res=findIforDeltaE(x,dE); if(res) yPoint=res.ia; }

    const dataRight=[{x:Xfine,y:Yfine,mode:'lines',line:{color:'steelblue'},showlegend:false}];
    if(yPoint!==null) dataRight.push({x:[x],y:[yPoint],mode:'markers',marker:{size:10,color:'black'},showlegend:false});

    const yLabel = mode==="pot0"?'E (V)':mode==="courant"?'ΔE (V)':'i (u.a.)';
    if(plotRightRef.current)
      window.Plotly.react(plotRightRef.current, dataRight, {
        xaxis:{title:'x (avancement)'},
        yaxis:{title:yLabel},
        margin:{t:20,b:50,l:60,r:20},
        paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff', autosize:true
      },{displayModeBar:false,responsive:true});

  }, [x, mode, deltaEmV, showReactions]);

  const yLabel = mode==="pot0"?'E = f(x)':mode==="courant"?'ΔE = f(x)':'i = f(x)';

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,fontFamily:"Inter, system-ui, Arial",fontSize:14}}>

      {/* LIGNE 1 : courbe i = f(E) */}
      <div style={cardStyle}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,flexWrap:"wrap"}}>
          <span style={{fontWeight:600,color:"#445"}}>i = f(E) — dosage Fe²⁺ par Ce⁴⁺</span>
          <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13}}>x =</span>
            <input type="range" min="0" max="2" step="0.2" value={x}
              onChange={e=>setX(parseFloat(e.target.value))}
              style={{width:180, accentColor:"#e9a824"}}/>
            <strong style={{minWidth:36}}>{x.toFixed(2)}</strong>
          </span>
          <button onClick={()=>setShowReactions(v=>!v)}
            style={{padding:"4px 10px", borderRadius:6, border:"1px solid #aaa",
              cursor:"pointer", fontSize:12,
              background: showReactions ? "#e9a824" : "#f5f5f5",
              color: showReactions ? "white" : "#333"}}>
            {showReactions ? "Masquer réactions" : "Afficher réactions"}
          </button>
        </div>
        <div ref={plotIERef} style={{height:300}}/>
      </div>

      {/* LIGNE 2 : suivi + schéma */}
      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>

        {/* Colonne gauche : choix mode + courbe suivi */}
        <div style={{flex:1,minWidth:300,display:"flex",flexDirection:"column",gap:12}}>
          <div style={cardStyle}>
            <div style={{fontWeight:600,color:"#445",marginBottom:10}}>Mode de titrage</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <TabBtn active={mode==="pot0"} color="#2a9d8f" onClick={()=>setMode("pot0")}>
                Potentiométrie i = 0
              </TabBtn>
              <TabBtn active={mode==="courant"} color="#e63946" onClick={()=>setMode("courant")}>
                Potentiométrie i = qq µA
              </TabBtn>
              <TabBtn active={mode==="ampero"} color="#e9a824" onClick={()=>setMode("ampero")}>
                Ampérométrie ΔE = qq mV
              </TabBtn>
            </div>
            {mode==="ampero" && (
              <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
                <span style={{fontSize:13}}>ΔE imposé :</span>
                <input type="range" min="10" max="500" step="10" value={deltaEmV}
                  onChange={e=>setDeltaEmV(parseInt(e.target.value))}
                  style={{flex:1,accentColor:"#e9a824"}}/>
                <strong style={{minWidth:55}}>{deltaEmV} mV</strong>
              </div>
            )}
          </div>
          <div style={{...cardStyle,flex:1}}>
            <div style={{fontWeight:600,color:"#445",marginBottom:6}}>{yLabel}</div>
            <div ref={plotRightRef} style={{height:280}}/>
          </div>
        </div>

        {/* Colonne droite : schéma SVG */}
        <div style={{flex:"0 0 420px", minWidth:380}}>
  <div style={{...cardStyle, height:"100%"}}>
    <SchemaElectro mode={mode} x={x}/>
  </div>
</div>

      </div>
    </div>
  );
}

// ============================================================
//  SIMULATION 4 — Diagramme de Hansen
// ============================================================

function Simulation4({ plotlyReady }) {
  const SOLVANTS = {
    'Acétate de butyle':   { d:[15.8,3.7,  6.3],  pvap:11,   ie:1.0,  rho:0.882, M:116.2 },
    'Acétate d\'éthyle':   { d:[15.8,5.3,  7.2],  pvap:97,   ie:4.1,  rho:0.902, M:88.1  },
    'Acétate de méthyle':  { d:[15.5,7.2,  7.6],  pvap:228,  ie:8.5,  rho:0.934, M:74.1  },
    'Acétone':             { d:[15.5,10.4, 7.0],  pvap:233,  ie:7.7,  rho:0.791, M:58.1  },
    'Acétonitrile':        { d:[15.3,18.0, 6.1],  pvap:97,   ie:4.7,  rho:0.786, M:41.1  },
    'Chloroforme':         { d:[18.0,3.1,  5.7],  pvap:211,  ie:6.7,  rho:1.489, M:119.4 },
    'Cyclohexane':         { d:[16.8,0.0,  0.2],  pvap:103,  ie:3.1,  rho:0.779, M:84.2  },
    'Diacétone alcool':    { d:[15.8,8.2,  10.8], pvap:2,    ie:0.18, rho:0.938, M:116.2 },
    'Dichlorométhane':     { d:[18.2,6.3,  6.1],  pvap:470,  ie:14.0, rho:1.325, M:84.9  },
    'Diéthyl éther':       { d:[14.5,2.9,  4.6],  pvap:587,  ie:19.0, rho:0.713, M:74.1  },
    'Diméthylformamide':   { d:[17.4,13.7, 11.3], pvap:4,    ie:0.03, rho:0.944, M:73.1  },
    'Diméthylsulfoxyde':   { d:[18.4,16.4, 10.2], pvap:0.8,  ie:0.01, rho:1.100, M:78.1  },
    'Eau':                 { d:[15.5,16.0, 42.3], pvap:23,   ie:0.3,  rho:1.000, M:18.0  },
    'Éthanol':             { d:[15.8,8.8,  19.4], pvap:59,   ie:2.7,  rho:0.789, M:46.1  },
    'Hexane':              { d:[14.9,0.0,  0.0],  pvap:160,  ie:8.3,  rho:0.659, M:86.2  },
    'Isopropanol':         { d:[15.8,6.1,  16.4], pvap:44,   ie:1.7,  rho:0.786, M:60.1  },
    'MEK':                 { d:[16.0,9.0,  5.1],  pvap:95,   ie:3.7,  rho:0.805, M:72.1  },
    'Méthanol':            { d:[14.7,12.3, 22.3], pvap:129,  ie:4.5,  rho:0.791, M:32.0  },
    'N-méthylpyrrolidone': { d:[18.0,12.3, 7.2],  pvap:0.4,  ie:0.01, rho:1.028, M:99.1  },
    'Tétrahydrofurane':    { d:[16.8,5.7,  8.0],  pvap:200,  ie:6.3,  rho:0.889, M:72.1  },
    'Toluène':             { d:[18.0,1.4,  2.0],  pvap:37,   ie:2.0,  rho:0.867, M:92.1  },
    'Xylène':              { d:[17.6,1.0,  3.1],  pvap:9,    ie:0.67, rho:0.864, M:106.2 },
    '1-Propanol':          { d:[16.0,6.8,  17.4], pvap:20,   ie:0.42, rho:0.803, M:60.1  },
    '2-Propanol':          { d:[15.8,6.1,  16.4], pvap:44,   ie:1.7,  rho:0.786, M:60.1  },
  };

  const solventKeys = Object.keys(SOLVANTS).sort();
  const [showEvap, setShowEvap] = useState(false);
  
  // États résine
  const [resineNom, setResineNom] = useState("CAB");
  const [resineD, setResineD]     = useState(17.2);
  const [resineP, setResineP]     = useState(13.8);
  const [resineH, setResineH]     = useState(2.8);
  const [delta, setDelta]         = useState(9.0);

  // États solvants cochés
  const [checked, setChecked] = useState(
    Object.fromEntries(solventKeys.map(s => [s, false]))
  );

  // États mélange
  const [mix1, setMix1]           = useState(solventKeys[0]);
  const [mix2, setMix2]           = useState(solventKeys[1]);
  const [mix3, setMix3]           = useState(solventKeys[2]);
  const [pct1, setPct1]           = useState(50);
  const [pct2, setPct2]           = useState(50);
  const [pct3, setPct3]           = useState(0);
  const [enableMix3, setEnableMix3] = useState(false);
  const [showMix, setShowMix]     = useState(false);
  const [mixResult, setMixResult] = useState(null);

  const plot3dRef = useRef(null);
  const plot2dRef = useRef(null);

  const inSphere = (pt, centre) => {
    const dx=pt[0]-centre[0], dy=pt[1]-centre[1], dz=pt[2]-centre[2];
    return dx*dx + dy*dy + dz*dz <= delta*delta;
  };

  const computeMix = (p1, p2, p3) => {
    const tot = p1 + p2 + (enableMix3 ? p3 : 0);
    if (tot === 0) return null;
    const f1=p1/tot, f2=p2/tot, f3=enableMix3?p3/tot:0;
    const s1=SOLVANTS[mix1].d, s2=SOLVANTS[mix2].d, s3=SOLVANTS[mix3].d;
    return [
      f1*s1[0]+f2*s2[0]+f3*s3[0],
      f1*s1[1]+f2*s2[1]+f3*s3[1],
      f1*s1[2]+f2*s2[2]+f3*s3[2],
    ];
  };

  const computeMixEvap = (p1, p2, p3) => {
    const tot = p1 + p2 + (enableMix3 ? p3 : 0);
    if (tot === 0) return null;

    // Fractions volumiques
    const fv1=p1/tot, fv2=p2/tot, fv3=enableMix3?p3/tot:0;
    const solvs = [[mix1,fv1],[mix2,fv2]];
    if (enableMix3) solvs.push([mix3,fv3]);

    // Conversion fv → fm (fraction massique)
    const masses = solvs.map(([s,fv]) => fv * SOLVANTS[s].rho);
    const totMasse = masses.reduce((a,b)=>a+b, 0);
    const fm = masses.map(m => m/totMasse);

    // Conversion fm → fraction molaire
    const moles = solvs.map(([s,_],i) => fm[i] / SOLVANTS[s].M);
    const totMoles = moles.reduce((a,b)=>a+b, 0);
    const xm = moles.map(m => m/totMoles);

    // Pvap mélange (loi de Raoult) : Pvap_mel = Σ xi * Pvap_i
    const pvap = solvs.reduce((acc,[s,_],i) => acc + xm[i]*SOLVANTS[s].pvap, 0);

    // IE moyen pondéré par fractions volumiques (convention industrielle)
    const ie = solvs.reduce((acc,[s,_],i) => acc + (p1+p2+(enableMix3?p3:0)>0 ? (solvs[i][1]) : 0)*SOLVANTS[s].ie, 0);

    return { ie, pvap };
  };

  const handleOptimize = () => {
    const centre = [resineD, resineP, resineH];
    const solvs = enableMix3 ? [mix1,mix2,mix3] : [mix1,mix2];
    const step = 5;
    let best = null, bestScore = 1e9;

    if (!enableMix3) {
      for (let i=0; i<=100; i+=step) {
        const j=100-i;
        const pt = SOLVANTS[solvs[0]].d.map((v,k)=>v*(i/100)+SOLVANTS[solvs[1]].d[k]*(j/100));
        const sc = (pt[0]-centre[0])**2+(pt[1]-centre[1])**2+(pt[2]-centre[2])**2;
        if (sc < bestScore) { bestScore=sc; best=[i,j,0]; }
      }
    } else {
      for (let i=0; i<=100; i+=step)
        for (let j=0; j<=100-i; j+=step) {
          const k=100-i-j;
          const pt = SOLVANTS[solvs[0]].d.map((v,idx)=>
            v*(i/100)+SOLVANTS[solvs[1]].d[idx]*(j/100)+SOLVANTS[solvs[2]].d[idx]*(k/100));
          const sc = (pt[0]-centre[0])**2+(pt[1]-centre[1])**2+(pt[2]-centre[2])**2;
          if (sc < bestScore) { bestScore=sc; best=[i,j,k]; }
        }
    }
    setPct1(best[0]); setPct2(best[1]); setPct3(best[2]);
    const mix = computeMix(best[0], best[1], best[2]);
    setMixResult(mix);
    setShowMix(true);
  };

  useEffect(() => {
    if (!window.Plotly) return;
    const centre = [resineD, resineP, resineH];

    // Points solvants
    const insD=[],insP=[],insH=[],insText=[];
    const outD=[],outP=[],outH=[],outText=[];
    solventKeys.forEach(s => {
      if (checked[s]) {
        const pt = SOLVANTS[s].d;
        if (inSphere(pt, centre)) {
          insD.push(pt[0]); insP.push(pt[1]); insH.push(pt[2]); insText.push(s);
        } else {
          outD.push(pt[0]); outP.push(pt[1]); outH.push(pt[2]); outText.push(s);
        }
      }
    });

    const mix = showMix ? computeMix(pct1, pct2, pct3) : null;

    // ── Graphique 3D ──
    const u=[], v=[];
    for(let i=0;i<60;i++) u.push(2*Math.PI*i/59);
    for(let i=0;i<30;i++) v.push(Math.PI*i/29);
    const X=[],Y=[],Z=[];
    for(let i=0;i<v.length;i++){
      X.push([]); Y.push([]); Z.push([]);
      for(let j=0;j<u.length;j++){
        X[i].push(delta*Math.sin(v[i])*Math.cos(u[j])+centre[0]);
        Y[i].push(delta*Math.sin(v[i])*Math.sin(u[j])+centre[1]);
        Z[i].push(delta*Math.cos(v[i])+centre[2]);
      }
    }

    const data3d = [
      {x:insD,y:insP,z:insH,mode:'markers+text',text:insText,textposition:'top center',
       marker:{color:'green',size:6},type:'scatter3d',name:'Dans la sphère'},
      {x:outD,y:outP,z:outH,mode:'markers+text',text:outText,textposition:'top center',
       marker:{color:'red',size:6},type:'scatter3d',name:'Hors sphère'},
      {x:[centre[0]],y:[centre[1]],z:[centre[2]],mode:'markers+text',
       text:[resineNom],marker:{color:'blue',size:9,symbol:'diamond'},type:'scatter3d',name:'Résine'},
      {x:X,y:Y,z:Z,type:'surface',opacity:0.25,
       colorscale:[[0,'lightblue'],[1,'lightblue']],showscale:false,name:'Sphère'},
    ];
    if (mix) data3d.push({
      x:[mix[0]],y:[mix[1]],z:[mix[2]],mode:'markers+text',text:['Mélange'],
      marker:{color:'orange',size:9,symbol:'diamond'},type:'scatter3d',name:'Mélange'
    });

    if (plot3dRef.current)
      window.Plotly.react(plot3dRef.current, data3d, {
        margin:{l:0,r:0,b:0,t:0},
        scene:{xaxis:{title:'δD'},yaxis:{title:'δP'},zaxis:{title:'δH'}},
        paper_bgcolor:'rgba(0,0,0,0)', autosize:true,
        legend:{orientation:'h', y:-0.1},
      }, {displayModeBar:false, responsive:true});

    // ── Graphique 2D (δP vs δH) ──
    const circleX=[], circleY=[];
    for(let theta=0; theta<=2*Math.PI; theta+=0.05){
      circleX.push(centre[1]+delta*Math.cos(theta));
      circleY.push(centre[2]+delta*Math.sin(theta));
    }

    const data2d = [
      {x:circleX,y:circleY,mode:'lines',line:{color:'lightblue',width:2},name:'Sphère Hansen'},
      {x:insP,y:insH,mode:'markers+text',text:insText,textposition:'top center',
       marker:{color:'green',size:8},name:'Dans la sphère'},
      {x:outP,y:outH,mode:'markers+text',text:outText,textposition:'top center',
       marker:{color:'red',size:8},name:'Hors sphère'},
      {x:[centre[1]],y:[centre[2]],mode:'markers+text',text:[resineNom],
       marker:{color:'blue',size:10,symbol:'diamond'},textposition:'top center',name:'Résine'},
    ];
    if (mix) data2d.push({
      x:[mix[1]],y:[mix[2]],mode:'markers+text',text:['Mélange'],
      marker:{color:'orange',size:10,symbol:'diamond'},textposition:'top center',name:'Mélange'
    });

    // Segments de construction du mélange
    if (mix && showMix) {
      const s1 = SOLVANTS[mix1].d, s2 = SOLVANTS[mix2].d;
      const tot = pct1 + pct2 + (enableMix3 ? pct3 : 0);
      const f1 = pct1/tot, f2 = pct2/tot, f3 = enableMix3 ? pct3/tot : 0;

      if (!enableMix3) {
        data2d.push({
          x:[s1[1], s2[1]], y:[s1[2], s2[2]],
          mode:'lines', line:{color:'orange', dash:'dot', width:2},
          showlegend:false
        });
        data2d.push({
          x:[s1[1], mix[1]], y:[s1[2], mix[2]],
          mode:'lines', line:{color:'#e9a824', width:3},
          name:`${Math.round(f1*100)}% ${mix1}`, showlegend:true
        });
        data2d.push({
          x:[mix[1], s2[1]], y:[mix[2], s2[2]],
          mode:'lines', line:{color:'#6a4c93', width:3},
          name:`${Math.round(f2*100)}% ${mix2}`, showlegend:true
        });
      } else {
        const s3 = SOLVANTS[mix3].d;
        data2d.push({
          x:[s1[1],s2[1],s3[1],s1[1]], y:[s1[2],s2[2],s3[2],s1[2]],
          mode:'lines', line:{color:'orange', dash:'dot', width:2},
          showlegend:false
        });
        const bx=mix[1], by=mix[2];
        [[s1,mix1,f1,'#e9a824'],[s2,mix2,f2,'#6a4c93'],[s3,mix3,f3,'#2a9d8f']].forEach(([s,name,f,col])=>{
          data2d.push({
            x:[bx,s[1]], y:[by,s[2]],
            mode:'lines', line:{color:col, width:2, dash:'dot'},
            name:`${Math.round(f*100)}% ${name}`, showlegend:true
          });
        });
      }
      data2d.push({
        x:[centre[1], mix[1]], y:[centre[2], mix[2]],
        mode:'lines', line:{color:'blue', dash:'dash', width:2},
        name:'Résine → Mélange', showlegend:true
      });
    }

    if (plot2dRef.current)
      window.Plotly.react(plot2dRef.current, data2d, {
        xaxis:{title:'δP (MPa½)', scaleanchor:'y', scaleratio:1},
        yaxis:{title:'δH (MPa½)'},
        margin:{t:20, b:120, l:60, r:20},
        legend:{orientation:'h', y:-0.3, font:{size:11}},
        paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff', autosize:true,
      }, {displayModeBar:false, responsive:true});

  }, [resineD, resineP, resineH, resineNom, delta, checked, showMix, pct1, pct2, pct3, enableMix3, mix1, mix2, mix3]);

  const fieldStyle = { display:"flex", flexDirection:"column", gap:2 };
  const labelStyle = { fontSize:12, color:"#666" };
  const inputStyle = { width:80, padding:"3px 6px", borderRadius:4, border:"1px solid #ccc", fontSize:13 };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,fontFamily:"Inter, system-ui, Arial",fontSize:14}}>

      {/* LIGNE 1 : paramètres */}
      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>

        {/* Colonne 1 : Résine */}
        <div style={cardStyle}>
          <div style={{fontWeight:600,color:"#445",marginBottom:10}}>Résine / Polymère</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={fieldStyle}>
              <span style={labelStyle}>Nom</span>
              <input style={{...inputStyle,width:120}} value={resineNom} onChange={e=>setResineNom(e.target.value)}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={fieldStyle}>
                <span style={labelStyle}>δD (MPa½)</span>
                <input type="number" style={inputStyle} step="0.1" value={resineD} onChange={e=>setResineD(parseFloat(e.target.value))}/>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>δP (MPa½)</span>
                <input type="number" style={inputStyle} step="0.1" value={resineP} onChange={e=>setResineP(parseFloat(e.target.value))}/>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>δH (MPa½)</span>
                <input type="number" style={inputStyle} step="0.1" value={resineH} onChange={e=>setResineH(parseFloat(e.target.value))}/>
              </div>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Rayon R (MPa½)</span>
              <input type="number" style={inputStyle} step="0.1" value={delta} onChange={e=>setDelta(parseFloat(e.target.value))}/>
            </div>
          </div>
        </div>

        {/* Colonne 2 : Solvants */}
        <div style={{...cardStyle,flex:1,minWidth:200}}>
          <div style={{fontWeight:600,color:"#445",marginBottom:6}}>Solvants</div>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <button onClick={()=>setChecked(Object.fromEntries(solventKeys.map(s=>[s,true])))}
              style={{padding:"3px 8px",borderRadius:4,border:"1px solid #ccc",cursor:"pointer",fontSize:12}}>
              Tout cocher
            </button>
            <button onClick={()=>setChecked(Object.fromEntries(solventKeys.map(s=>[s,false])))}
              style={{padding:"3px 8px",borderRadius:4,border:"1px solid #ccc",cursor:"pointer",fontSize:12}}>
              Tout décocher
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 12px",maxHeight:140,overflowY:"auto"}}>
            {solventKeys.map(s=>(
              <label key={s} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,cursor:"pointer"}}>
                <input type="checkbox" checked={checked[s]}
                  onChange={e=>setChecked(prev=>({...prev,[s]:e.target.checked}))}/>
                {s}
              </label>
            ))}
          </div>
        </div>

        {/* Colonne 3 : Mélange */}
        <div style={cardStyle}>
          <div style={{fontWeight:600,color:"#445",marginBottom:8}}>Mélange de solvants</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[[mix1,setMix1,pct1,setPct1,"Solvant 1"],[mix2,setMix2,pct2,setPct2,"Solvant 2"]].map(([val,setVal,pct,setPct,label])=>(
              <div key={label} style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:12,color:"#666",minWidth:60}}>{label}</span>
                <select value={val} onChange={e=>setVal(e.target.value)}
                  style={{fontSize:12,borderRadius:4,border:"1px solid #ccc",padding:"2px 4px"}}>
                  {solventKeys.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" value={pct} onChange={e=>setPct(parseFloat(e.target.value))}
                  style={{...inputStyle,width:55}} min="0" max="100"/>
                <span style={{fontSize:12}}>%</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <label style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#666",minWidth:60}}>
                <input type="checkbox" checked={enableMix3} onChange={e=>{setEnableMix3(e.target.checked); if(!e.target.checked) setPct3(0);}}/>
                Solvant 3
              </label>
              <select value={mix3} onChange={e=>setMix3(e.target.value)} disabled={!enableMix3}
                style={{fontSize:12,borderRadius:4,border:"1px solid #ccc",padding:"2px 4px"}}>
                {solventKeys.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <input type="number" value={pct3} onChange={e=>setPct3(parseFloat(e.target.value))}
                style={{...inputStyle,width:55}} min="0" max="100" disabled={!enableMix3}/>
              <span style={{fontSize:12}}>%</span>
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button onClick={handleOptimize}
                style={{padding:"5px 10px",borderRadius:4,border:"1px solid #6a4c93",
                  background:"#6a4c93",color:"white",cursor:"pointer",fontSize:12}}>
                Optimiser
              </button>
              <button onClick={()=>{setMixResult(computeMix(pct1,pct2,pct3)); setShowMix(true);}}
                style={{padding:"5px 10px",borderRadius:4,border:"1px solid #ccc",
                  cursor:"pointer",fontSize:12}}>
                Visualiser
              </button>
              <button onClick={()=>setShowEvap(v=>!v)}
                style={{padding:"5px 10px", borderRadius:4,
                  border:"1px solid #6a4c93",
                  background: showEvap ? "#6a4c93" : "white",
                  color: showEvap ? "white" : "#6a4c93",
                  cursor:"pointer", fontSize:12}}>
                {showEvap ? "Masquer évaporation" : "Propriétés d'évaporation"}
              </button>
              {mixResult && (
                <span style={{fontSize:11,color:"#666",alignSelf:"center"}}>
                  δD={mixResult[0].toFixed(1)} δP={mixResult[1].toFixed(1)} δH={mixResult[2].toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>
{/* JAUGE séchage + tableau solvants */}
      {showMix && showEvap && (() => {
        const evap = computeMixEvap(pct1, pct2, pct3);
        if (!evap) return null;
        const ieMax = 20;
        const ieClamped = Math.min(evap.ie, ieMax);
        const pct = (ieClamped / ieMax) * 100;
        const color = pct < 30 ? "#2a9d8f" : pct < 60 ? "#e9a824" : "#e63946";
        return (
          <div style={cardStyle}>
            <div style={{fontWeight:600, color:"#445", marginBottom:10}}>
              Propriétés d'évaporation du mélange
            </div>
            <div style={{display:"flex", gap:30, flexWrap:"wrap", alignItems:"flex-start"}}>
              {/* Jauge IE */}
              <div style={{minWidth:280}}>
                <div style={{fontSize:13, marginBottom:6}}>
                  <strong>I<sub>ab</sub> du mélange : {evap.ie.toFixed(2)}</strong>
                  <span style={{marginLeft:10, fontSize:12, fontWeight:600,
                    color: evap.ie > 3 ? "#2a9d8f" : evap.ie > 1 ? "#e9a824" : "#e63946"}}>
                    {evap.ie > 3 ? "⚡ Séchage rapide" : evap.ie > 1 ? "～ Séchage moyen" : "🐢 Séchage lent"}
                  </span>
                </div>
                <div style={{display:"flex", borderRadius:8, height:18, overflow:"hidden", marginBottom:4}}>
                  <div style={{width:"33%", background: evap.ie < 1 ? "#e63946" : "#ffcccc", transition:"background 0.4s"}}/>
                  <div style={{width:"34%", background: evap.ie >= 1 && evap.ie < 3 ? "#e9a824" : "#fff3cc", transition:"background 0.4s"}}/>
                  <div style={{width:"33%", background: evap.ie >= 3 ? "#2a9d8f" : "#ccf0eb", transition:"background 0.4s"}}/>
                </div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:11, color:"#888", marginTop:3}}>
                  <span>🐢 Lent (I<sub>ab</sub> &lt; 1)</span>
                  <span>～ Moyen (1-3)</span>
                  <span>⚡ Rapide (I<sub>ab</sub> &gt; 3)</span>
                </div>
                <div style={{fontSize:12, marginTop:8, color:"#555"}}>
                  <strong>Pvap moyen : {evap.pvap.toFixed(1)} hPa</strong>
                  <span style={{color:"#888", marginLeft:8}}>à 20°C</span>
                </div>
                <div style={{fontSize:11, color:"#888", marginTop:6, fontStyle:"italic"}}>
                  ⚠ L'IE moyen est une approximation linéaire. En réalité les composés 
                  s'évaporent différentiellement selon leur Pvap (loi de Raoult).
                </div>
              </div>

              <div style={{flex:"0 0 100%", marginTop:8, padding:"8px 12px",
                background:"#f8f4ff", borderRadius:6, borderLeft:"3px solid #6a4c93",
                fontSize:11, color:"#555", lineHeight:1.6}}>
                <strong style={{color:"#6a4c93"}}>📊 Méthode de calcul :</strong><br/>
                <strong>I<sub>ab</sub> mélange</strong> = moyenne pondérée par fractions volumiques :
                Σ (φᵢ × I<sub>ab,i</sub>). Convention industrielle — approximation linéaire.<br/>
                <strong>P<sub>vap</sub> mélange</strong> = loi de Raoult :
                Σ (xᵢ × P<sub>vap,i</sub>), où xᵢ sont les fractions molaires
                (calculées depuis les fractions volumiques via ρ et M de chaque solvant).<br/>
                <strong style={{color:"#c0392b"}}>⚠ Données I<sub>ab</sub> et P<sub>vap</sub> indicatives.
                À vérifier sur la </strong>
                <a href="https://www.inrs.fr/publications/bdd/solvants.html"
                  target="_blank" style={{color:"#c0392b"}}>
                  base de données solvants INRS
                </a>
                <strong style={{color:"#c0392b"}}> avant tout usage professionnel.</strong>
              </div>

              {/* Tableau solvants cochés */}
              {Object.keys(checked).filter(s=>checked[s]).length > 0 && (
                <div style={{flex:1, minWidth:300, overflowX:"auto"}}>
                  <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
                    <thead>
                      <tr style={{background:"#f0f0f0"}}>
                        {["Solvant","δD","δP","δH","Pvap (hPa)","IE"].map(h=>(
                          <th key={h} style={{padding:"4px 8px", textAlign:"left", borderBottom:"1px solid #ddd"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {solventKeys.filter(s=>checked[s]).map((s,i)=>(
                        <tr key={s} style={{background: i%2===0?"white":"#fafafa"}}>
                          <td style={{padding:"3px 8px", borderBottom:"1px solid #eee"}}>{s}</td>
                          <td style={{padding:"3px 8px", borderBottom:"1px solid #eee"}}>{SOLVANTS[s].d[0]}</td>
                          <td style={{padding:"3px 8px", borderBottom:"1px solid #eee"}}>{SOLVANTS[s].d[1]}</td>
                          <td style={{padding:"3px 8px", borderBottom:"1px solid #eee"}}>{SOLVANTS[s].d[2]}</td>
                          <td style={{padding:"3px 8px", borderBottom:"1px solid #eee"}}>{SOLVANTS[s].pvap}</td>
                          <td style={{padding:"3px 8px", borderBottom:"1px solid #eee",
                            color: SOLVANTS[s].ie < 1 ? "#2a9d8f" : SOLVANTS[s].ie > 5 ? "#e63946" : "#e9a824",
                            fontWeight:600}}>
                            {SOLVANTS[s].ie}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* LIGNE 2 : graphiques */}
      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
        <div style={{...cardStyle,flex:1,minWidth:300}}>
          <div style={{fontWeight:600,color:"#445",marginBottom:6}}>Sphère de Hansen 3D</div>
          <div ref={plot3dRef} style={{height:420}}/>
        </div>
        <div style={{...cardStyle,flex:1,minWidth:300}}>
          <div style={{fontWeight:600,color:"#445",marginBottom:6}}>Projection δP vs δH</div>
          <div ref={plot2dRef} style={{height:420}}/>
        </div>
      </div>

    </div>
  );
}


// ============================================================
//  SIMULATION 5 — Régulation de niveau
// ============================================================

function Simulation5({ plotlyReady }) {
  const [mode, setMode]           = useState("TOR");
  const [running, setRunning]     = useState(false);
  const [frame, setFrame]         = useState(0);
  const [simData, setSimData]     = useState(null);
  const [Hcons, setHcons] = useState(30);
  const [Qmax, setQmax]   = useState(200);

  // Paramètres TOR
  const [hBas, setHBas]           = useState(25);
  const [hHaut, setHHaut]         = useState(35);
  // Paramètres communs P et PI
  const [xp, setXp]               = useState(5);
  const [ti, setTi]               = useState(10000);
  
  // Paramètre TOR puisage
 
  const plotHRef  = useRef(null);
  const plotQRef  = useRef(null);
  const animRef   = useRef(null);

  // ── Constantes physiques ──
  const S       = Math.PI * (15/100)**2; // m²
  const H0      = 0;    // cm
  const Qmin    = 0;    // L/h

  // ── Débit de puisage (Torricelli) ──
  const [rPuisage, setRPuisage] = useState(0.2);
  const qPuis = (H, R) =>
    Math.PI * (R/100)**2 * Math.sqrt(2 * 9.81 * Math.max(H,0)/100) * 3600 * 1000;

  // ── Simulations ──
  const runTOR = () => {
    const dt = 1, n = 3000;
    const Hs=[], Qs=[], ts=[];
    let H = H0, Qpompe = 0;
    for (let i=0; i<n; i++) {
      const Qp = qPuis(H, rPuisage);
      const dH = (Qpompe - Qp) / (S*1000*3600) * dt * 100;
      H = Math.max(0, H + dH);
      Qpompe = H > hHaut ? Qmin : H < hBas ? Qmax : Qpompe;
      Hs.push(H); Qs.push(Qpompe); ts.push(i*dt);
    }
    return { Hs, Qs, ts, Hcons:(hHaut+hBas)/2 };
  };

  const runP = () => {
    const dt = 10, n = 300;
    const Hs=[], Qs=[], ts=[];
    let H = H0, Qpompe = 100;
    for (let i=0; i<n; i++) {
      const Qp = qPuis(H, rPuisage);
      const dH = (Qpompe - Qp) / (S*1000*3600) * dt * 100;
      H = Math.max(0, H + dH);
      const u = Qmin + (Qmax-Qmin)*(Hcons-H)/xp;
      Qpompe = u > Qmax ? Qmax : u < Qmin ? Qmin : u;
      Hs.push(H); Qs.push(Qpompe); ts.push(i*dt);
    }
    return { Hs, Qs, ts, Hcons };
  };

  const runPI = () => {
    const dt = 1, n = 3000;
    const Hs=[], Qs=[], ts=[];
    let H = H0, Qpompe = 100;
    let Z = (Qmax-Qmin)*(Hcons-H0)/ti;
    for (let i=0; i<n; i++) {
      const Qp = qPuis(H, rPuisage);
      const dH = (Qpompe - Qp) / (S*1000*3600) * dt * 100;
      H = Math.max(0, H + dH);
      const u = Qmin + (Qmax-Qmin)*(Hcons-H)/xp + Z;
      Qpompe = u > Qmax ? Qmax : u < Qmin ? Qmin : u;
      // Anti wind-up : on n'intègre que si pas en saturation
      if (Qpompe > Qmin && Qpompe < Qmax) {
        Z = Z + (Qmax-Qmin)*(Hcons-H)/ti;
      }
      Hs.push(H); Qs.push(Qpompe); ts.push(i*dt);
    }
    return { Hs, Qs, ts, Hcons };
  };

  // ── Lancer la simulation ──
  const handleRun = () => {
    if (animRef.current) clearInterval(animRef.current);
    const data = mode==="TOR" ? runTOR() : mode==="P" ? runP() : runPI();
    setSimData(data);
    setFrame(0);
    setRunning(true);
  };

  const handleStop = () => {
    setRunning(false);
    if (animRef.current) clearInterval(animRef.current);
  };

  const handleReset = () => {
    handleStop();
    setSimData(null);
    setFrame(0);
  };

  // ── Animation ──
  useEffect(() => {
    if (!running || !simData) return;
    const totalFrames = simData.Hs.length;
    const animDuration = 5000; // 5s pour tous les modes
    const framesPerTick = Math.max(1, Math.ceil(totalFrames / (animDuration / 16)));

    animRef.current = setInterval(() => {
      setFrame(f => {
        const next = f + framesPerTick;
        if (next >= totalFrames - 1) {
          clearInterval(animRef.current);
          setRunning(false);
          return totalFrames - 1;
        }
        return next;
      });
    }, 16);
    return () => clearInterval(animRef.current);
  }, [running, simData]);

  // ── Initialisation graphiques vides ──
  useEffect(() => {
    if (!window.Plotly || !plotlyReady) return;
    const layoutCommon = {
      margin:{t:20,b:50,l:60,r:20},
      paper_bgcolor:'rgba(0,0,0,0)',
      plot_bgcolor:'#fafcff',
      autosize:true,
      showlegend:false,
    };
    if (plotHRef.current)
      window.Plotly.react(plotHRef.current, [], {
        ...layoutCommon,
        xaxis:{title:'Temps (s)', range:[0,3000]},
        yaxis:{title:'Hauteur (cm)', range:[0,45]},
      }, {displayModeBar:false, responsive:true});
    if (plotQRef.current)
      window.Plotly.react(plotQRef.current, [], {
        ...layoutCommon,
        xaxis:{title:'Temps (s)', range:[0,3000]},
        yaxis:{title:'Débit pompe (L/h)', range:[-10,220]},
      }, {displayModeBar:false, responsive:true});
  }, [plotlyReady]);

 
  // ── Plotly ──
  useEffect(() => {
    if (!window.Plotly || !simData) return;
    const { Hs, Qs, ts, Hcons } = simData;
    const t_shown = ts.slice(0, frame+1);
    const H_shown = Hs.slice(0, frame+1);
    const Q_shown = Qs.slice(0, frame+1);
    const H_cur   = Hs[frame] ?? H0;
    const Q_cur   = Qs[frame] ?? 0;

    const layoutCommon = {
      margin:{t:20,b:50,l:60,r:20},
      paper_bgcolor:'rgba(0,0,0,0)',
      plot_bgcolor:'#fafcff',
      autosize:true,
    };

    if (plotHRef.current) {
      const shapes = mode==="TOR" ? [
        {type:'line',x0:ts[0],x1:ts[ts.length-1],y0:hBas,y1:hBas,line:{dash:'dot',color:'orange',width:1.5}},
        {type:'line',x0:ts[0],x1:ts[ts.length-1],y0:hHaut,y1:hHaut,line:{dash:'dot',color:'purple',width:1.5}},
      ] : [
        {type:'line',x0:ts[0],x1:ts[ts.length-1],y0:Hcons,y1:Hcons,line:{dash:'dash',color:'gray',width:1.5}},
      ];
      window.Plotly.react(plotHRef.current, [
        {x:t_shown, y:H_shown, mode:'lines', line:{color:'#e63946'}, name:'H(t)'},
        {x:[ts[frame]], y:[H_cur], mode:'markers', marker:{color:'black',size:10}, showlegend:false},
      ], {
        ...layoutCommon,
        xaxis:{title:'Temps (s)', range:[0, 3000]},
        yaxis:{title:'Hauteur (cm)', range:[0, 45]},
        showlegend:false,
        shapes,
      }, {displayModeBar:false, responsive:true});
    }

    if (plotQRef.current) {
      window.Plotly.react(plotQRef.current, [
        {x:t_shown, y:Q_shown, mode:'lines', line:{color:'#2a6099'}, name:'Q_pompe(t)'},
        {x:[ts[frame]], y:[Q_cur], mode:'markers', marker:{color:'black',size:10}, showlegend:false},
      ], {
        ...layoutCommon,
        xaxis:{title:'Temps (s)', range:[0, 3000]},
        yaxis:{title:'Débit pompe (L/h)', range:[-10, 220]},
        showlegend:false,
      }, {displayModeBar:false, responsive:true});
    }
  }, [frame, simData, plotlyReady]);

  

  // ── Schéma réservoir ──
  const H_cur = simData ? (simData.Hs[frame] ?? H0) : H0;
  const Q_cur = simData ? (simData.Qs[frame] ?? 0)  : 0;
  const rEff = (mode === "TOR") ? 0.002 : rPuisage; // rayon effectif pour le jet
  const hMax  = 45;
  const hPct  = Math.min(Math.max(H_cur / hMax, 0), 1);
  const reservoirH = 200;
  const waterH     = Math.round(hPct * reservoirH);
  const waterY     = 40 + reservoirH - waterH;
  const waterColor = Q_cur > 0 ? "#a8d8ff" : "#d0eaff";

  const fieldStyle = {display:"flex", flexDirection:"column", gap:2};
  const labelStyle = {fontSize:12, color:"#666"};
  const inputStyle = {width:90, padding:"3px 6px", borderRadius:4, border:"1px solid #ccc", fontSize:13};

  return (
    <div style={{display:"flex", flexDirection:"column", gap:14,
      fontFamily:"Inter, system-ui, Arial", fontSize:14}}>

      {/* LIGNE 1 : paramètres + schéma */}
      <div style={{display:"flex", gap:14, flexWrap:"wrap"}}>

        {/* Colonne gauche : mode + paramètres + boutons */}
        <div style={{flex:1, minWidth:280, display:"flex", flexDirection:"column", gap:12}}>

          {/* Choix du mode */}
          <div style={cardStyle}>
            <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Mode de régulation</div>
            <div style={{display:"flex", gap:8}}>
              {["TOR","P","PI"].map(m=>(
                <TabBtn key={m} active={mode===m} color="#2a6099" onClick={()=>{handleReset(); setMode(m);}}>
                  {m==="TOR"?"Tout-ou-Rien":m==="P"?"Proportionnel":"Proportionnel-Intégral"}
                </TabBtn>
              ))}
            </div>
          </div>

          {/* Paramètres selon le mode */}
          <div style={cardStyle}>
            <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Paramètres</div>
            <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>

              {/* Consigne — seulement P et PI */}
            {(mode==="P" || mode==="PI") && (
              <div style={fieldStyle}>
                <span style={labelStyle}>Consigne H (cm)</span>
                <input type="number" style={inputStyle} step="1" min="5" max="40"
                  value={Hcons} onChange={e=>setHcons(parseFloat(e.target.value))}/>
              </div>
            )}
            {/* Débit max pompe — tous les modes */}
            <div style={fieldStyle}>
              <span style={labelStyle}>Débit max pompe (L/h)</span>
              <input type="number" style={inputStyle} step="10" min="50" max="500"
                value={Qmax} onChange={e=>setQmax(parseFloat(e.target.value))}/>
            </div>

              {mode==="TOR" && <>
                <div style={fieldStyle}>
                  <span style={labelStyle}>H seuil bas (cm)</span>
                  <input type="number" style={inputStyle} step="1" min="5" max="40"
                    value={hBas} onChange={e=>setHBas(parseFloat(e.target.value))}/>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>H seuil haut (cm)</span>
                  <input type="number" style={inputStyle} step="1" min="5" max="40"
                    value={hHaut} onChange={e=>setHHaut(parseFloat(e.target.value))}/>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Rayon robinet de puisage (cm)</span>
                  <input type="number" style={inputStyle} step="0.01" min="0.05" max="0.5"
                    value={rPuisage} onChange={e=>setRPuisage(parseFloat(e.target.value))}/>
                </div>
              </>}

              {(mode==="P"||mode==="PI") && <>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Bande prop. Xp (cm)</span>
                  <input type="number" style={inputStyle} step="1" min="1" max="20"
                    value={xp} onChange={e=>setXp(parseFloat(e.target.value))}/>
                </div>
                {mode==="PI" && (
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Temps intégral Ti (s)</span>
                    <input type="number" style={inputStyle} step="1000" min="2000" max="20000"
                      value={ti} onChange={e=>setTi(parseFloat(e.target.value))}/>
                  </div>
                )}
                <div style={fieldStyle}>
                  <span style={labelStyle}>Rayon robinet (cm)</span>
                  <input type="number" style={inputStyle} step="0.01" min="0.05" max="0.5"
                    value={rPuisage} onChange={e=>setRPuisage(parseFloat(e.target.value))}/>
                </div>
              </>}

            </div>

            {/* Boutons */}
            <div style={{display:"flex", gap:8, marginTop:14}}>
              <button onClick={handleRun}
                style={{padding:"6px 16px", borderRadius:6, border:"none",
                  background:"#2a6099", color:"white", cursor:"pointer", fontWeight:600}}>
                ▶ Lancer
              </button>
              <button onClick={()=>running ? handleStop() : setRunning(true)}
                disabled={!simData}
                style={{padding:"6px 16px", borderRadius:6, border:"1px solid #2a6099",
                  background:running?"#e63946":"white",
                  color:running?"white":"#2a6099", cursor:"pointer"}}>
                {running ? "⏸ Pause" : "▶ Reprendre"}
              </button>
              <button onClick={handleReset}
                style={{padding:"6px 16px", borderRadius:6, border:"1px solid #2a6099",
                  background:"white", color:"#2a6099", cursor:"pointer", fontWeight:600}}>
                ↺ Reset
              </button>
            </div>

            {/* Infos temps réel */}
            {simData && (
              <div style={{marginTop:10, fontSize:12, color:"#555", display:"flex", gap:16}}>
                <span>⏱ t = <strong>{simData.ts[frame]?.toFixed(0)} s</strong></span>
                <span>📏 H = <strong>{H_cur.toFixed(1)} cm</strong></span>
                <span>💧 Q = <strong>{Q_cur.toFixed(0)} L/h</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite : schéma réservoir animé */}
        <div style={{flex:"0 0 260px"}}>
          <div style={{...cardStyle, height:"100%"}}>
            <div style={{fontWeight:600, color:"#445", marginBottom:8}}>Réservoir</div>
            <svg viewBox="0 0 220 320" style={{width:"100%", display:"block"}}>

              {/* Tuyau entrée (pompe, à gauche) */}
              <rect x="20" y="60" width="30" height="10" rx="3"
                fill={Q_cur>0?"#2a6099":"#aaa"}/>
              <rect x="10" y="55" width="12" height="20" rx="2"
                fill={Q_cur>0?"#2a6099":"#aaa"}/>
              <text x="16" y="48" textAnchor="middle" fontSize="10" fill="#2a6099" fontWeight="bold">
                Pompe
              </text>
              {Q_cur>0 && <>
                <polygon points="42,58 50,65 42,72" fill="#a8d8ff" opacity="0.8"/>
              </>}

              {/* Corps réservoir */}
              <rect x="50" y="40" width="120" height="200" rx="4"
                fill="none" stroke="#5599bb" strokeWidth="2"/>

              {/* Eau dans le réservoir */}
              <rect x="51" y={waterY} width="118" height={waterH} fill={waterColor} opacity="0.8"/>

              {/* Graduation H */}
              {[0,10,20,30,40].map(h=>{
                const y = 40 + 200 - (h/hMax)*200;
                return (
                  <g key={h}>
                    <line x1="168" y1={y} x2="175" y2={y} stroke="#445" strokeWidth="0.8"/>
                    <text x="180" y={y+4} fontSize="9" fill="#445">{h}</text>
                  </g>
                );
              })}
              <text x="195" y="140" fontSize="9" fill="#445" transform="rotate(90,195,140)">cm</text>

              {/* Ligne consigne */}
              {mode!=="TOR" && (
                <>
                  <line x1="50" y1={40+200-(Hcons/hMax)*200}
                        x2="170" y2={40+200-(Hcons/hMax)*200}
                        stroke="gray" strokeWidth="1" strokeDasharray="4,3"/>
                  <text x="52" y={40+200-(Hcons/hMax)*200-3}
                    fontSize="9" fill="gray">Consigne {Hcons}cm</text>
                </>
              )}

              {/* Seuils TOR */}
              {mode==="TOR" && <>
                <line x1="50" y1={40+200-(hBas/hMax)*200}
                      x2="170" y2={40+200-(hBas/hMax)*200}
                      stroke="orange" strokeWidth="1.2" strokeDasharray="4,3"/>
                <text x="52" y={40+200-(hBas/hMax)*200-3} fontSize="9" fill="orange">
                  Seuil bas {hBas}cm
                </text>
                <line x1="50" y1={40+200-(hHaut/hMax)*200}
                      x2="170" y2={40+200-(hHaut/hMax)*200}
                      stroke="purple" strokeWidth="1.2" strokeDasharray="4,3"/>
                <text x="52" y={40+200-(hHaut/hMax)*200-3} fontSize="9" fill="purple">
                  Seuil haut {hHaut}cm
                </text>
              </>}

              {/* Tuyau sortie (robinet puisage, en bas à droite) */}
              <rect x="170" y="230" width="30" height="10" rx="3" fill="#888"/>
              <text x="185" y="255" textAnchor="middle" fontSize="9" fill="#666">Puisage</text>
              {/* Jet d'eau sortant */}
              {simData && (() => {
                const Qsort = Math.PI * rEff**2 * Math.sqrt(2 * 9.81 * Math.max(H_cur,0)/100) * 3600 * 1000;
                const jetW = Math.min(8, Math.max(1, Qsort/25));
                const jetL = Math.min(25, Math.max(2, Qsort/8));
                
                return Qsort > 0.5 ? (
                  <g opacity="0.75">
                    <path d={`M200,235 Q${200+jetL},235 ${200+jetL},${235+jetL}`}
                      fill="none" stroke="#a8d8ff" strokeWidth={jetW} strokeLinecap="round"/>
                    <circle cx={200+jetL} cy={235+jetL} r={jetW/2} fill="#a8d8ff"/>
                  </g>
                ) : null;
              })()}

              {/* Niveau actuel */}
              <line x1="50" y1={waterY} x2="170" y2={waterY}
                stroke="#2a6099" strokeWidth="1" opacity="0.5"/>

              {/* Label H courant */}
              <text x="110" y={Math.max(waterY-5, 50)} textAnchor="middle"
                fontSize="11" fill="#2a6099" fontWeight="bold">
                H = {H_cur.toFixed(1)} cm
              </text>

              {/* Agitateur / pompe label */}
              <text x="110" y="280" textAnchor="middle" fontSize="10" fill="#555">
                Q_pompe = {Q_cur.toFixed(0)} L/h
              </text>

            </svg>
          </div>
        </div>

      </div>

      {/* LIGNE 2 : graphiques empilés */}
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        <div style={cardStyle}>
          <div style={{fontWeight:600, color:"#445", marginBottom:6}}>H(t) — Hauteur d'eau</div>
          <div ref={plotHRef} style={{height:280}}/>
        </div>
        <div style={cardStyle}>
          <div style={{fontWeight:600, color:"#445", marginBottom:6}}>Q(t) — Débit pompe</div>
          <div ref={plotQRef} style={{height:280}}/>
        </div>
      </div>

    </div>
  );
}

// ============================================================
//  SIMULATION 6 — Point de fonctionnement régulation P
// ============================================================

function Simulation6({ plotlyReady }) {
  const [activeTab, setActiveTab] = useState("caract");
  const [xp, setXp]               = useState(10);
  const [rPuisage, setRPuisage]   = useState(0.002);
  const [Y, setY]                 = useState(50);

  const plotCaractRef = useRef(null);
  const plotFonctRef  = useRef(null);

  // ── Constantes ──
  const Hcons  = 30;  // cm
  const Qmin   = 0;   // L/h
  const Qmax   = 200; // L/h
  const g      = 9.81;

  // ── Caractéristique statique du procédé : H = f(Q) via Torricelli ──
  // Q_puisage = S × √(2gH) × 3600000 → H = (Q / (3600000 × S))² / (2g) × 100
  const S = Math.PI * rPuisage ** 2;
  const calcH = Q => {
    if (Q <= 0) return 0;
    return (Q / (3600 * 1000 * S)) ** 2 / (2 * g) * 100;
  };

  // ── Caractéristique régulateur P : Q = f(H) ──
  const calcQ = H => {
    if (H >= Hcons)        return Qmin;
    if (H <= Hcons - xp)   return Qmax;
    return Qmax / xp * (Hcons - H);
  };

  // ── Point de fonctionnement (intersection) ──
  const findIntersection = () => {
    let bestDiff = Infinity;
    let bestH = null, bestQ = null;
    for (let H = 0.1; H <= 40; H += 0.05) {
      const Q_reg  = calcQ(H);
      const H_proc = calcH(Q_reg);
      const diff = Math.abs(H_proc - H);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestH = H;
        bestQ = Q_reg;
      }
    }
    // On retourne toujours le meilleur point trouvé
    return bestDiff < 2 ? { H: bestH, Q: bestQ } : null;
  };

  // ── Caractéristique statique mode dynamique ──
  // Y (%) → Q_pompe = Y/100 × Qmax → H = calcH(Q)
  const Qcur = Y / 100 * Qmax;
  const Hcur = calcH(Qcur);
  const inter = findIntersection();
  const HReservoir = activeTab === "fonct" ? (inter ? inter.H : 0) : Hcur;
  const QReservoir = activeTab === "fonct" ? (inter ? inter.Q : 0) : Qcur;

  // ── Plotly caractéristique statique ──
  useEffect(() => {
    if (!window.Plotly || activeTab !== "caract") return;
    const Qs = Array.from({length:200}, (_,i) => i * Qmax/199);
    const Hs = Qs.map(calcH);

    window.Plotly.react(plotCaractRef.current, [
      {x:Hs, y:Qs, mode:'lines', line:{color:'#e76f51', width:2}, name:'Caractéristique statique'},
      {x:[Hcur], y:[Qcur], mode:'markers', marker:{color:'black', size:12}, showlegend:false},
      {x:[0, Hcur], y:[Qcur, Qcur], mode:'lines', line:{dash:'dot', color:'#888', width:1}, showlegend:false},
      {x:[Hcur, Hcur], y:[0, Qcur], mode:'lines', line:{dash:'dot', color:'#888', width:1}, showlegend:false},
    ], {
      xaxis:{title:'Hauteur H (cm)', range:[0, 45]},
      yaxis:{title:'Débit pompe Q (L/h)', range:[0, 220]},
      margin:{t:20, b:100, l:60, r:20},
      legend:{orientation:'h', y:-0.3, font:{size:11}},
      paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff',
      autosize:true,
      annotations:[{
        x: Hcur+1, y: Qcur+8,
        text: `Y=${Y}% → Q=${Qcur.toFixed(0)} L/h → H=${Hcur.toFixed(1)} cm`,
        showarrow:false, font:{size:11, color:'#333'},
        bgcolor:'rgba(255,255,255,0.8)', bordercolor:'#ccc', borderwidth:1
      }]
    }, {displayModeBar:false, responsive:true});
  }, [Y, rPuisage, activeTab]);

  // ── Plotly point de fonctionnement ──
  useEffect(() => {
    if (!window.Plotly || activeTab !== "fonct") return;
    const Hvals = Array.from({length:500}, (_,i) => i * 40/499);

    // Courbe régulateur : Q = f(H)
    const Qreg = Hvals.map(calcQ);

    // Courbe procédé : Q = f(H) via inversion de Torricelli
    // On trace Q_pompe vs H_procédé → on a H = calcH(Q) donc on balaye Q
    const Qs_proc = Array.from({length:200}, (_,i) => i * Qmax/199);
    const Hs_proc = Qs_proc.map(calcH);

    const inter = findIntersection();

    window.Plotly.react(plotFonctRef.current, [
      {x:Hvals, y:Qreg, mode:'lines', line:{color:'#2a6099', width:2}, name:'Régulateur P'},
      {x:Hs_proc, y:Qs_proc, mode:'lines', line:{color:'#e76f51', width:2}, name:'Procédé (statique)'},
      ...(inter ? [
        {x:[inter.H], y:[inter.Q], mode:'markers', marker:{color:'black', size:12}, name:'Point de fonctionnement'},
        {x:[inter.H, inter.H], y:[0, inter.Q], mode:'lines', line:{dash:'dot', color:'#333', width:1}, showlegend:false},
        {x:[0, inter.H], y:[inter.Q, inter.Q], mode:'lines', line:{dash:'dot', color:'#333', width:1}, showlegend:false},
        // Écart statique ES
        {x:[inter.H, Hcons], y:[5, 5], mode:'lines', line:{color:'green', width:2},
          name:`ES = ${(Hcons - inter.H).toFixed(1)} cm`,
          marker:{symbol:'line-ew-open', size:8}},
      ] : []),
    ], {
      xaxis:{title:'Hauteur H (cm)', range:[0, 42]},
      yaxis:{title:'Débit pompe Q (L/h)', range:[-5, 220]},
      margin:{t:20, b:100, l:60, r:20},
      legend:{orientation:'h', y:-0.3, font:{size:11}},
      paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff',
      autosize:true,
      annotations: inter ? [
        {x:(inter.H+Hcons)/2, y:2,
         text:`ES = ${(Hcons-inter.H).toFixed(1)} cm`,
         showarrow:false, font:{size:12, color:'green'},
         bgcolor:'rgba(255,255,255,0.8)'},
        {x:Hcons+1, y:20, text:`Consigne<br>${Hcons} cm`,
         showarrow:true, arrowhead:0, ax:20, ay:-30,
         font:{size:10, color:'gray'}},
      ] : [],
    }, {displayModeBar:false, responsive:true});
  }, [xp, rPuisage, activeTab]);

  // ── Schéma réservoir ──
  const hMax  = 45;
  const hPct  = Math.min(Math.max(HReservoir / hMax, 0), 1);
  const reservoirH = 160;
  const waterH     = Math.round(hPct * reservoirH);
  const waterY     = 30 + reservoirH - waterH;

  const fieldStyle = {display:"flex", flexDirection:"column", gap:2};
  const labelStyle = {fontSize:12, color:"#666"};
  const inputStyle = {width:100, padding:"3px 6px", borderRadius:4, border:"1px solid #ccc", fontSize:13};

  return (
    <div style={{display:"flex", flexDirection:"column", gap:14,
      fontFamily:"Inter, system-ui, Arial", fontSize:14}}>

      {/* LIGNE 1 : schéma boucle + schéma réservoir */}
      <div style={{display:"flex", gap:14, flexWrap:"wrap"}}>

        {/* Schéma boucle de régulation */}
        <div style={{...cardStyle, flex:1, minWidth:320}}>
          <div style={{fontWeight:600, color:"#445", marginBottom:8}}>Boucle de régulation</div>
          <svg viewBox="0 0 500 180" style={{width:"100%", display:"block"}}>

           {/* Silhouette opérateur — déplacée à côté de Y(%) */}
            <g transform="translate(5, 55) scale(0.028)">
              <g transform="translate(0,1280) scale(0.1,-0.1)" fill="#1a6eb5" stroke="none">
                <path d="M3027 12784 c-290 -52 -544 -220 -705 -463 -134 -204 -189 -425 -170
                -681 30 -386 296 -743 659 -886 143 -56 212 -68 389 -69 168 0 209 6 340 47
                263 83 515 309 630 562 124 273 129 581 13 856 -73 174 -231 368 -378 465
                -233 154 -520 216 -778 169z"/>
                <path d="M1920 10435 c-8 -2 -49 -9 -90 -15 -106 -17 -265 -71 -371 -126 -394
                -204 -653 -566 -731 -1024 -10 -59 -13 -445 -13 -1815 l0 -1740 22 -71 c71
                -223 311 -355 546 -300 161 38 267 129 328 281 l24 60 3 1553 2 1552 110 0
                110 0 2 -4152 3 -4153 21 -61 c59 -169 154 -284 295 -353 190 -93 392 -93 586
                0 152 73 269 220 314 394 10 40 14 536 16 2472 l3 2423 105 0 105 0 0 -2407
                c0 -2080 2 -2418 15 -2478 61 -293 341 -494 655 -471 260 18 457 165 538 401
                l27 80 3 4153 2 4153 108 -3 107 -3 5 -1555 c4 -1101 8 -1564 16 -1585 75
                -204 232 -315 447 -315 234 0 413 158 447 395 8 58 10 541 8 1770 -3 1588 -5
                1696 -22 1785 -110 572 -500 992 -1046 1128 l-105 26 -1290 2 c-709 1 -1297 1
                -1305 -1z"/>
              </g>
            </g>

            {/* Signal commande Y — à droite de la silhouette */}
            <text x="42" y="62" fontSize="11" fill="#1a6eb5" fontWeight="bold">signal de</text>
            <text x="42" y="75" fontSize="11" fill="#1a6eb5" fontWeight="bold">commande</text>
            <text x="42" y="88" fontSize="11" fill="#1a6eb5" fontWeight="bold">Y (%)</text>
            {/* Flèche Y vers actionneur */}
            <line x1="90" y1="90" x2="130" y2="90" stroke="#1a6eb5" strokeWidth="1.5" markerEnd="url(#arr6)"/>

            {/* Actionneur */}
            <rect x="130" y="72" width="90" height="36" rx="4" fill="none" stroke="#333" strokeWidth="1.5"/>
            <text x="175" y="88" textAnchor="middle" fontSize="12" fill="#333">Actionneur</text>
            <text x="175" y="102" textAnchor="middle" fontSize="10" fill="#555">(pompe)</text>

            {/* Grandeur réglante Q — décalée vers le haut */}
            <text x="228" y="58" fontSize="10" fill="#1a6eb5">grandeur</text>
            <text x="228" y="70" fontSize="10" fill="#1a6eb5">réglante</text>
            <text x="228" y="82" fontSize="10" fill="#1a6eb5">Q (L/h)</text>
            {/* Fil actionneur → système, s'arrête au bord du cadre */}
            <line x1="220" y1="90" x2="270" y2="90" stroke="#333" strokeWidth="1.5" markerEnd="url(#arr6)"/>

            {/* Grandeurs perturbatrices */}
            <text x="320" y="18" textAnchor="middle" fontSize="10" fill="#333">Grandeurs</text>
            <text x="320" y="30" textAnchor="middle" fontSize="10" fill="#333">perturbatrices</text>
            <line x1="320" y1="32" x2="320" y2="72" stroke="#333" strokeWidth="1.5" markerEnd="url(#arr6)"/>

            {/* Système à régler */}
            <rect x="270" y="72" width="100" height="36" rx="4" fill="none" stroke="#333" strokeWidth="1.5"/>
            <text x="320" y="88" textAnchor="middle" fontSize="12" fill="#333">Système à</text>
            <text x="320" y="102" textAnchor="middle" fontSize="10" fill="#555">régler</text>

            {/* Grandeur réglée H — fil s'arrête au bord droit du système */}
            <line x1="370" y1="90" x2="435" y2="90" stroke="#333" strokeWidth="1.5"/>
            <text x="438" y="80" fontSize="11" fill="#e63946" fontWeight="bold">grandeur</text>
            <text x="438" y="92" fontSize="11" fill="#e63946" fontWeight="bold">réglée</text>
            <text x="438" y="104" fontSize="11" fill="#e63946" fontWeight="bold">H (cm)</text>

            {/* Retour — fil descend de 90 à 145, puis va jusqu'au bord droit du capteur */}
            <line x1="400" y1="90" x2="400" y2="145" stroke="#333" strokeWidth="1.5"/>
            <line x1="400" y1="145" x2="220" y2="145" stroke="#333" strokeWidth="1.5"/>

            {/* Capteur */}
            <rect x="130" y="127" width="90" height="36" rx="4" fill="none" stroke="#333" strokeWidth="1.5"/>
            <text x="175" y="143" textAnchor="middle" fontSize="11" fill="#333">Capteur</text>
            <text x="175" y="157" textAnchor="middle" fontSize="10" fill="#555">(niveau)</text>

            {/* Fil capteur → signal mesure avec flèche à gauche */}
            <line x1="130" y1="145" x2="42" y2="145" stroke="#333" strokeWidth="1.5" markerStart="url(#arr6left)"/>

            {/* Signal mesure X */}
            <text x="42" y="125" fontSize="11" fill="#e63946" fontWeight="bold">signal de</text>
            <text x="42" y="138" fontSize="11" fill="#e63946" fontWeight="bold">mesure X (%)</text>

            <defs>
              <marker id="arr6" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M2 1L8 5L2 9" fill="none" stroke="#333" strokeWidth="1.5"/>
              </marker>
              <marker id="arr6left" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M8 1L2 5L8 9" fill="none" stroke="#333" strokeWidth="1.5"/>
              </marker>
            </defs>
          </svg>
        </div>

        {/* Schéma réservoir */}
        <div style={{flex:"0 0 220px"}}>
          <div style={{...cardStyle, height:"100%"}}>
            <div style={{fontWeight:600, color:"#445", marginBottom:8}}>Réservoir</div>
            <svg viewBox="0 0 200 260" style={{width:"100%", display:"block"}}>
              {/* Pompe */}
              <rect x="15" y="50" width="28" height="10" rx="3" fill="#2a6099"/>
              <text x="29" y="42" textAnchor="middle" fontSize="10" fill="#2a6099" fontWeight="bold">Pompe</text>
              <text x="29" y="78" textAnchor="middle" fontSize="9" fill="#2a6099">Y={activeTab==="fonct" ? (inter ? (inter.Q/Qmax*100).toFixed(0) : 0) : Y}%</text>
              <text x="29" y="90" textAnchor="middle" fontSize="9" fill="#2a6099">Q={QReservoir.toFixed(0)} L/h</text>

              {/* Corps réservoir */}
              <rect x="43" y="30" width="110" height={reservoirH} rx="4"
                fill="none" stroke="#5599bb" strokeWidth="2"/>
              {/* Eau */}
              <rect x="44" y={waterY} width="108" height={waterH} fill="#a8d8ff" opacity="0.7"/>

              {/* Graduations */}
              {[0,10,20,30,40].map(h => {
                const y = 30 + reservoirH - (h/hMax)*reservoirH;
                return (
                  <g key={h}>
                    <line x1="151" y1={y} x2="157" y2={y} stroke="#445" strokeWidth="0.8"/>
                    <text x="162" y={y+4} fontSize="9" fill="#445">{h}</text>
                  </g>
                );
              })}
              <text x="178" y="115" fontSize="9" fill="#445" transform="rotate(90,178,115)">cm</text>

              {/* Consigne */}
              {activeTab==="fonct" && (
                <>
                  <line x1="43" y1={30+reservoirH-(Hcons/hMax)*reservoirH}
                        x2="153" y2={30+reservoirH-(Hcons/hMax)*reservoirH}
                        stroke="gray" strokeWidth="1" strokeDasharray="4,3"/>
                  <text x="45" y={30+reservoirH-(Hcons/hMax)*reservoirH-3}
                    fontSize="9" fill="gray">Consigne {Hcons}cm</text>
                </>
              )}

              {/* H courant */}
              <text x="98" y={Math.max(waterY-5,38)} textAnchor="middle"
                fontSize="11" fill="#2a6099" fontWeight="bold">
                H={HReservoir.toFixed(1)} cm
              </text>

              {/* Robinet puisage */}
              <rect x="153" y="178" width="25" height="8" rx="2" fill="#888"/>
              <text x="165" y="200" textAnchor="middle" fontSize="9" fill="#666">Puisage</text>
              {/* Jet d'eau sortant */}
              {(() => {
                const Qsort = Math.PI * rPuisage**2 * Math.sqrt(2 * 9.81 * Math.max(Hcur,0)/100) * 3600 * 1000;
                const jetW = Math.min(8, Math.max(1, Qsort/25));
                const jetL = Math.min(25, Math.max(2, Qsort/8));
                return Qsort > 0.5 ? (
                  <g opacity="0.75">
                    <path d={`M178,182 Q${178+jetL},182 ${178+jetL},${182+jetL}`}
                      fill="none" stroke="#a8d8ff" strokeWidth={jetW} strokeLinecap="round"/>
                    <circle cx={178+jetL} cy={182+jetL} r={jetW/2} fill="#a8d8ff"/>
                  </g>
                ) : null;
              })()}
            </svg>
          </div>
        </div>

      </div>

      {/* LIGNE 2 : onglets + paramètres + graphique */}
      <div style={{display:"flex", gap:14, flexWrap:"wrap"}}>

        {/* Paramètres */}
        <div style={{flex:"0 0 220px", display:"flex", flexDirection:"column", gap:12}}>
          <div style={cardStyle}>
            <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Paramètres</div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <div style={fieldStyle}>
                <span style={labelStyle}>Rayon robinet de puisage (m)</span>
                <input type="number" style={inputStyle} step="0.0005" min="0.0005" max="0.003"
                  value={rPuisage} onChange={e=>setRPuisage(parseFloat(e.target.value))}/>
              </div>
              {activeTab==="fonct" && (
                <div style={fieldStyle}>
                  <span style={labelStyle}>Bande prop. Xp (cm)</span>
                  <input type="number" style={inputStyle} step="0.5" min="0.1" max="20"
                    value={xp} onChange={e=>setXp(parseFloat(e.target.value))}/>
                </div>
              )}
              {activeTab==="caract" && (
                <div style={fieldStyle}>
                  <span style={labelStyle}>Signal commande Y (%)</span>
                  <input type="range" min="0" max="100" step="1" value={Y}
                    onChange={e=>setY(parseFloat(e.target.value))}
                    style={{accentColor:"#e76f51"}}/>
                  <strong style={{fontSize:13}}>{Y} %</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graphique */}
        <div style={{flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:10}}>
          <div style={{display:"flex", gap:8}}>
            <TabBtn active={activeTab==="caract"} color="#e76f51"
              onClick={()=>setActiveTab("caract")}>
              📉 Caractéristique statique
            </TabBtn>
            <TabBtn active={activeTab==="fonct"} color="#2a6099"
              onClick={()=>setActiveTab("fonct")}>
              🎯 Point de fonctionnement
            </TabBtn>
          </div>
          <div style={cardStyle}>
            {activeTab==="caract" && (
              <>
                <div style={{fontWeight:600, color:"#445", marginBottom:6}}>
                  H = f(Q) — Caractéristique statique du procédé
                </div>
                <div ref={plotCaractRef} style={{height:340}}/>
              </>
            )}
            {activeTab==="fonct" && (
              <>
                <div style={{fontWeight:600, color:"#445", marginBottom:6}}>
                  Point de fonctionnement — Régulation P
                </div>
                <div ref={plotFonctRef} style={{height:340}}/>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ============================================================
//  SIMULATION 7 — Cristallisation
// ============================================================

function Simulation7() {
  const [mode, setMode]         = useState("refroidissement");
  const [T, setT]               = useState(60);
  const [mEau, setMEau]         = useState(100);
  const [mSolute, setMSolute]   = useState(50);
  const [pointClique, setPointClique] = useState(null);
  const [animPos, setAnimPos] = useState(() =>
    Array.from({length: 20}, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random()-0.5)*0.02,
      vy: (Math.random()-0.5)*0.02,
    }))
  );

  const plotRef = useRef(null);

  // ── Données solubilité KNO₃ ──
  const solubData = [
    [0, 13.3], [10, 20.9], [20, 31.6], [30, 45.8],
    [40, 63.9], [50, 85.5], [60, 110.0], [70, 138.0],
    [80, 169.0], [90, 202.0], [100, 246.0]
  ];

  // Interpolation linéaire
  const solubilite = (temp) => {
    const t = Math.max(0, Math.min(100, temp));
    for (let i=0; i<solubData.length-1; i++) {
      const [t1, s1] = solubData[i];
      const [t2, s2] = solubData[i+1];
      if (t >= t1 && t <= t2) return s1 + (s2-s1)*(t-t1)/(t2-t1);
    }
    return solubData[solubData.length-1][1];
  };

  // ── Calculs ──
  const mEauEff = mode==="evaporation" ? mEau : 100;
  const sT         = solubilite(T);
  const mDissoute  = Math.min(mSolute, sT * mEauEff / 100);
  const mCristaux  = Math.max(0, mSolute - mDissoute);
  const conc       = mEauEff > 0 ? mDissoute / mEauEff * 100 : 0;
  const sature     = mCristaux > 0;

  // Point représentatif sur le diagramme
  // x = T, y = concentration effective (g/100g eau)
  
  const yPoint = sature ? sT : mSolute / mEauEff * 100;
  const xPoint = T;

  // ── Plotly diagramme solubilité ──
  useEffect(() => {
    if (!window.Plotly) return;

    const Ts = Array.from({length:101}, (_,i) => i);
    const Ss = Ts.map(solubilite);

    // Zone insaturée (en dessous de la courbe)
    const fillX = [...Ts, ...Ts.slice().reverse()];
    const fillY = [...Ss, ...Array(101).fill(0)];

    const data = [
      // Zone insaturée
      {x:fillX, y:fillY, fill:'toself', fillcolor:'rgba(144,213,255,0.15)',
       line:{width:0}, showlegend:false, hoverinfo:'none'},
      // Courbe solubilité
      {x:Ts, y:Ss, mode:'lines', line:{color:'#0096c7', width:2.5},
       name:'Courbe de saturation KNO₃'},
      // Point représentatif
      {x:[xPoint], y:[yPoint],
       mode:'markers',
       marker:{color: sature ? '#e63946' : '#2a9d8f', size:14,
         symbol: sature ? 'diamond' : 'circle',
         line:{color:'white', width:2}},
       name: sature ? 'Solution saturée' : 'Solution insaturée'},
    ];

    // Annotations zones
    const annotations = [
      {x:80, y:50, text:'Zone insaturée', showarrow:false,
       font:{size:12, color:'#0096c7'}, opacity:0.6},
      {x:20, y:180, text:'Zone inaccessible<br>(sursaturée)', showarrow:false,
       font:{size:12, color:'#e63946'}, opacity:0.6},
    ];

    // Ligne verticale T courante
    const shapes = [
      {type:'line', x0:T, x1:T, y0:0, y1:250,
       line:{dash:'dot', color:'#888', width:1}},
    ];

    window.Plotly.react(plotRef.current, data, {
      xaxis:{title:'Température (°C)', range:[0,100]},
      yaxis:{title:'Solubilité (g / 100g eau)', range:[0,260]},
      margin:{t:20, b:50, l:70, r:20},
      paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff',
      legend:{orientation:'h', y:-0.2},
      annotations, shapes, autosize:true,
    }, {displayModeBar:false, responsive:true});

    // Gestion clic sur le diagramme
    if (plotRef.current && !plotRef.current._hasClickHandler) {
      plotRef.current.on('plotly_click', (data) => {
        if (data.points.length > 0) return;
      });
      plotRef.current.on('plotly_clickannotation', () => {});
      plotRef.current._hasClickHandler = true;
    }

  }, [T, mEau, mSolute, mode]);

useEffect(() => {
    const interval = setInterval(() => {
      setAnimPos(prev => prev.map(p => {
        let nx = p.x + p.vx;
        let ny = p.y + p.vy;
        let nvx = p.vx + (Math.random()-0.5)*0.005;
        let nvy = p.vy + (Math.random()-0.5)*0.005;
        // Rebond sur les bords
        if (nx < 0 || nx > 1) { nvx = -nvx; nx = Math.max(0, Math.min(1, nx)); }
        if (ny < 0 || ny > 1) { nvy = -nvy; ny = Math.max(0, Math.min(1, ny)); }
        // Limiter la vitesse
        nvx = Math.max(-0.03, Math.min(0.03, nvx));
        nvy = Math.max(-0.03, Math.min(0.03, nvy));
        return { x:nx, y:ny, vx:nvx, vy:nvy };
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // ── Animation bécher ──
  // Nombre de particules dissoutes (max 20)
  const maxParticules = 20;
  const nDissous   = Math.round((mDissoute / mSolute) * maxParticules);
  const nCristaux  = maxParticules - nDissous;

  // Positions fixes des particules (générées une seule fois)
  const particulesPos = useMemo(() => {
    return Array.from({length: maxParticules}, (_, i) => ({
      x: 20 + Math.random() * 110,
      y: 20 + Math.random() * 120,
      id: i
    }));
  }, []);

  // Cristaux au fond
  const cristauxPos = useMemo(() => {
    return Array.from({length: maxParticules}, (_, i) => ({
      x: 15 + (i % 10) * 14,
      y: 155 - Math.floor(i/10) * 14,
      id: i
    }));
  }, []);

  // Couleur solution
  const solColor = `rgba(0, 150, 200, ${0.1 + (mDissoute/mSolute)*0.4})`;

  const fieldStyle = {display:"flex", flexDirection:"column", gap:2};
  const labelStyle = {fontSize:12, color:"#666"};
  const inputStyle = {width:90, padding:"3px 6px", borderRadius:4,
    border:"1px solid #ccc", fontSize:13};

  return (
    <div style={{display:"flex", flexDirection:"column", gap:14,
      fontFamily:"Inter, system-ui, Arial", fontSize:14}}>

      {/* Choix du mode */}
      <div style={cardStyle}>
        <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Mode de cristallisation</div>
        <div style={{display:"flex", gap:8}}>
          <TabBtn active={mode==="refroidissement"} color="#0096c7"
            onClick={()=>setMode("refroidissement")}>
            🧊 Par refroidissement
          </TabBtn>
          <TabBtn active={mode==="evaporation"} color="#e9a824"
            onClick={()=>setMode("evaporation")}>
            💨 Par évaporation
          </TabBtn>
        </div>
      </div>

      {/* LIGNE 1 : diagramme + bécher */}
      <div style={{display:"flex", gap:14, flexWrap:"wrap"}}>

        {/* Diagramme solubilité */}
        <div style={{...cardStyle, flex:1, minWidth:320}}>
          <div style={{fontWeight:600, color:"#445", marginBottom:6}}>
            Diagramme de solubilité — KNO₃
          </div>
          <div ref={plotRef} style={{height:380}}/>
        </div>

        {/* Bécher animé + cristallisoir */}
        <div style={{flex:"0 0 280px"}}>
          <div style={{...cardStyle, height:"100%"}}>
            <div style={{fontWeight:600, color:"#445", marginBottom:8}}>
              {mode==="refroidissement" ? "Cristallisoir + bécher" : "Montage évaporation"}
            </div>
            <svg viewBox="0 0 240 340" style={{width:"100%", display:"block"}}>

              {/* ── MODE REFROIDISSEMENT ── */}
              {mode==="refroidissement" && <>

                {/* CRISTALLISOIR — occupe toute la hauteur basse */}
                <line x1="10"  y1="200" x2="10"  y2="330" stroke="#5599bb" strokeWidth="2"/>
                <line x1="230" y1="200" x2="230" y2="330" stroke="#5599bb" strokeWidth="2"/>
                <line x1="10"  y1="330" x2="230" y2="330" stroke="#5599bb" strokeWidth="2"/>
                {/* Eau cristallisoir */}
                <rect x="11" y="220" width="219" height="109" fill="rgba(173,216,230,0.25)"/>

                {/* Glaçons GAUCHE (entre paroi cristallisoir et bécher) */}
                {[[15,225],[15,248],[15,270],[15,292]].map(([x,y],i)=>(
                  <rect key={`gl${i}`} x={x} y={y} width="16" height="12" rx="3"
                    fill="rgba(200,240,255,0.85)" stroke="#aaddff" strokeWidth="1"/>
                ))}
                {/* Glaçons DROITE */}
                {[[205,225],[205,248],[205,270],[205,292]].map(([x,y],i)=>(
                  <rect key={`gr${i}`} x={x} y={y} width="16" height="12" rx="3"
                    fill="rgba(200,240,255,0.85)" stroke="#aaddff" strokeWidth="1"/>
                ))}

                <text x="120" y="325" textAnchor="middle" fontSize="9" fill="#5599bb">
                  Cristallisoir — T = {T}°C
                </text>

                {/* BÉCHER — bord haut y=150, bord bas y=310, plongé dans cristallisoir */}
                {/* Solution : bord bas=310, bord haut=220, côtés collés aux parois */}
                <rect x="56" y="220" width="128" height="90" fill={solColor}/>
                {/* Parois bécher */}
                <line x1="55"  y1="150" x2="55"  y2="310" stroke="#5599bb" strokeWidth="2"/>
                <line x1="185" y1="150" x2="185" y2="310" stroke="#5599bb" strokeWidth="2"/>
                <line x1="55"  y1="310" x2="185" y2="310" stroke="#5599bb" strokeWidth="2"/>

                {/* Particules dissoutes — DANS le rectangle bleu */}
                {particulesPos.slice(0, nDissous).map((p,i)=>(
                  <circle key={p.id}
                    cx={58 + animPos[i].x * 124}
                    cy={224 + animPos[i].y * 82}
                    r="4" fill="#0096c7" opacity="0.8"/>
                ))}
                {/* Cristaux au fond du bécher */}
                {cristauxPos.slice(0, nCristaux).map(p=>(
                  <g key={p.id} transform={`translate(${60 + (p.id%10)*12}, ${300 - Math.floor(p.id/10)*12})`}>
                    <polygon points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5"
                      fill="#e9a824" stroke="#c07800" strokeWidth="0.5"/>
                  </g>
                ))}

                <text x="120" y="195" textAnchor="middle" fontSize="10" fill="#0096c7">
                  Solution KNO₃
                </text>
                <text x="120" y="140" textAnchor="middle" fontSize="11" fill="#333" fontWeight="bold">
                  T = {T}°C
                </text>
              </>}

              {/* ── MODE EVAPORATION ── */}
              {mode==="evaporation" && <>

                {/* Flèche vers pompe à vide — au dessus de tout */}
                <line x1="120" y1="24" x2="120" y2="8" stroke="#e9a824" strokeWidth="2.5"
                  markerEnd="url(#arrEvap)"/>
                <text x="128" y="12" fontSize="9" fill="#e9a824" fontWeight="bold">vers pompe à vide</text>

                {/* Col entonnoir */}
                <rect x="108" y="22" width="24" height="20" rx="2"
                  fill="rgba(200,230,255,0.3)" stroke="#5599bb" strokeWidth="1.5"/>

                {/* Entonnoir renversé — épouse les bords du bécher */}
                <path d="M55,80 L108,42 L132,42 L185,80"
                  fill="rgba(200,230,255,0.2)" stroke="#5599bb" strokeWidth="1.5"/>

                {/* Bécher */}
                <line x1="55"  y1="80"  x2="55"  y2="280" stroke="#5599bb" strokeWidth="2"/>
                <line x1="185" y1="80"  x2="185" y2="280" stroke="#5599bb" strokeWidth="2"/>
                <line x1="55"  y1="280" x2="185" y2="280" stroke="#5599bb" strokeWidth="2"/>

                {/* Niveau eau — diminue avec mEau */}
                {(() => {
                  const niveauY = 80 + (1 - mEau/100) * 180;
                  const solH = Math.max(0, 280 - niveauY);
                  return <>
                    <rect x="56" y={niveauY} width="128" height={solH} fill={solColor}/>
                    <line x1="56" y1={niveauY} x2="184" y2={niveauY}
                      stroke="#0096c7" strokeWidth="1" strokeDasharray="3,2"/>
                    <text x="190" y={niveauY+4} fontSize="9" fill="#0096c7">{mEau}g</text>

                    {/* Particules — UNIQUEMENT dans la solution */}
                    {particulesPos.slice(0, nDissous).map((p,i)=>(
                      <circle key={p.id}
                        cx={58 + animPos[i].x * 124}
                        cy={niveauY + 6 + animPos[i].y * Math.max(solH - 12, 1)}
                        r="3.5" fill="#0096c7" opacity="0.8"/>
                    ))}
                    {/* Cristaux au fond */}
                    {cristauxPos.slice(0, nCristaux).map(p=>(
                      <g key={p.id} transform={`translate(${60 + (p.id%10)*12}, ${270 - Math.floor(p.id/10)*12})`}>
                        <polygon points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2"
                          fill="#e9a824" stroke="#c07800" strokeWidth="0.5"/>
                      </g>
                    ))}
                  </>;
                })()}

                {/* Pression + T */}
                <text x="120" y="300" textAnchor="middle" fontSize="10"
                  fill="#e9a824" fontWeight="bold">
                  P = {Math.round(1013 * mEau/100)} hPa — T = {T}°C
                </text>

                <defs>
                  <marker id="arrEvap" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M2 1L8 5L2 9" fill="none" stroke="#e9a824" strokeWidth="1.5"/>
                  </marker>
                </defs>
              </>}

            </svg>
          </div>
        </div>
      </div>

      {/* LIGNE 2 : paramètres + bilan */}
      <div style={{display:"flex", gap:14, flexWrap:"wrap"}}>

        {/* Paramètres */}
        <div style={cardStyle}>
          <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Paramètres</div>
          <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>

            <div style={fieldStyle}>
              <span style={labelStyle}>Masse soluté (g)</span>
              <input type="number" style={inputStyle} step="5" min="5" max="200"
                value={mSolute} onChange={e=>setMSolute(parseFloat(e.target.value))}/>
            </div>

            {mode==="refroidissement" && (
              <div style={fieldStyle}>
                <span style={labelStyle}>Température (°C)</span>
                <input type="range" min="0" max="100" step="1" value={T}
                  onChange={e=>setT(parseFloat(e.target.value))}
                  style={{accentColor:"#0096c7", width:150}}/>
                <strong style={{fontSize:13}}>{T} °C</strong>
              </div>
            )}

            {mode==="evaporation" && <>
              <div style={fieldStyle}>
                <span style={labelStyle}>Température (°C) — fixe</span>
                <input type="number" style={inputStyle} step="5" min="0" max="100"
                  value={T} onChange={e=>setT(parseFloat(e.target.value))}/>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Masse eau restante (g)</span>
                <input type="range" min="10" max="100" step="1" value={mEau}
                  onChange={e=>setMEau(parseFloat(e.target.value))}
                  style={{accentColor:"#e9a824", width:150}}/>
                <strong style={{fontSize:13}}>{mEau} g</strong>
              </div>
            </>}

          </div>
        </div>

        {/* Bilan masse */}
        <div style={{...cardStyle, flex:1}}>
          <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Bilan de matière</div>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>

            <div style={{display:"flex", flexDirection:"column", gap:6}}>
              <div style={{fontSize:13}}>
                Masse soluté totale : <strong>{mSolute} g</strong>
              </div>
              <div style={{fontSize:13, color:"#0096c7"}}>
                ● Masse dissoute : <strong>{mDissoute.toFixed(1)} g</strong>
              </div>
              <div style={{fontSize:13, color:"#e9a824"}}>
                ★ Masse cristallisée : <strong>{mCristaux.toFixed(1)} g</strong>
              </div>
              <div style={{fontSize:13}}>
                Concentration : <strong>{conc.toFixed(1)} g/100g eau</strong>
              </div>
              <div style={{fontSize:13}}>
                Solubilité à {T}°C : <strong>{sT.toFixed(1)} g/100g eau</strong>
              </div>
              <div style={{marginTop:6, padding:"6px 10px", borderRadius:6,
                background: sature ? "#fff0f0" : "#f0fff4",
                border: `1px solid ${sature ? "#e63946" : "#2a9d8f"}`,
                fontSize:12, fontWeight:600,
                color: sature ? "#e63946" : "#2a9d8f"}}>
                {sature ? "⚠ Solution saturée — cristallisation en cours" : "✓ Solution insaturée"}
              </div>
            </div>

            {/* Barre visuelle */}
            <div style={{width:"100%"}}>
              <div style={{fontSize:12, color:"#666", marginBottom:4}}>
                Répartition du soluté :
              </div>
              <div style={{background:"#eee", borderRadius:8, height:24, overflow:"hidden", display:"flex"}}>
                <div style={{
                  width:`${(mDissoute/mSolute)*100}%`,
                  background:"#0096c7", transition:"width 0.3s",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, color:"white", fontWeight:600
                }}>
                  {mDissoute.toFixed(0)}g dissous
                </div>
                <div style={{
                  width:`${(mCristaux/mSolute)*100}%`,
                  background:"#e9a824", transition:"width 0.3s",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, color:"white", fontWeight:600
                }}>
                  {mCristaux > 0 ? `${mCristaux.toFixed(0)}g cristaux` : ""}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

// ============================================================
//  SIMULATION 8 — Chaîne de mesure / capteur de lumière
// ============================================================

function Simulation8({ plotlyReady }) {
  const [E, setE]                   = useState(500);
  const [bits, setBits]             = useState(10);
  const [R, setR]                   = useState(1000);
  const [activeBlock, setActiveBlock] = useState("capteur");
  const [pharesOn, setPharesOn]     = useState(false);
  const [pharesEtat, setPharesEtat] = useState("OFF");
  const [canInput, setCanInput]     = useState("Ur");
  const [algoN1, setAlgoN1]         = useState(393);
  const [algoEtat1, setAlgoEtat1]   = useState("HIGH");
  const [algoN2, setAlgoN2]         = useState(491);
  const [algoEtat2, setAlgoEtat2]   = useState("LOW");

  const plotRef = useRef(null);

  // ── Modèle Rp = f(E) ──
  const calcRp = e => {
    if (e <= 12) return 5600;
    return Math.round(7458 / Math.log(e));
    if (e >= 1590) return 346;
    // Données expérimentales
    const data = [
      [11,5600],[70,2500],[200,1540],[360,1210],
      [470,1010],[680,790],[880,581],[1050,387],[1590,346]
    ];
    // Interpolation log-log
    const logE = Math.log(e);
    for (let i=0; i<data.length-1; i++) {
      const [e1,r1] = data[i];
      const [e2,r2] = data[i+1];
      if (e >= e1 && e <= e2) {
        const t = (Math.log(e)-Math.log(e1)) / (Math.log(e2)-Math.log(e1));
        return Math.round(r1 + (r2-r1)*t);
      }
    }
    return 346;
  };

  // ── Calculs chaîne ──
  const Rp   = calcRp(E);
  const Ur   = 5 * R / (Rp + R);
  const Nmax = Math.pow(2, bits) - 1;
  const N    = Math.round(Ur / 5 * Nmax);

  // ── Valeurs CAN ──
  const canMax    = canInput==="Ur" ? 5 : canInput==="Rp" ? 10000 : 1500;
  const canUnite  = canInput==="Ur" ? "V" : canInput==="Rp" ? "Ω" : "lx";
  const canValReel = canInput==="Ur" ? Ur : canInput==="Rp" ? Rp : E;
  const canVal5V   = canInput==="Ur" ? Ur : canInput==="Rp" ? Rp/10000*5 : E/1500*5;
  const NcanVal    = Math.round(canVal5V / 5 * Nmax);
  const quantum    = canMax / Nmax;

  // ── Algorithme phares ──
  useEffect(() => {
    if (!pharesOn) { setPharesEtat("OFF"); return; }
    if (N < algoN1) {
      setPharesEtat(algoEtat1 === "HIGH" ? "ON" : "OFF");
    } else if (N > algoN2) {
      setPharesEtat(algoEtat2 === "HIGH" ? "ON" : "OFF");
    }
    // Entre les deux seuils : l'état reste inchangé (mémoire)
  }, [N, pharesOn, algoN1, algoN2, algoEtat1, algoEtat2]);

  const ledOn = pharesOn && pharesEtat === "ON";

  // ── Animation soleil ──
  const nuagePct      = 1 - Math.min(E, 1500) / 1500;
  const soleilOpacity = E < 10 ? 0 : 0.3 + (1-nuagePct)*0.7;
  const cielColor     = E < 10
    ? "#0a0a2e"
    : `rgb(${Math.round(55+(1-nuagePct)*80)},${Math.round(100+(1-nuagePct)*80)},${Math.round(180+(1-nuagePct)*40)})`;

  // ── Plotly ──
  useEffect(() => {
    if (!window.Plotly || !plotRef.current || !plotlyReady) return;

    if (activeBlock==="capteur") {
      const Es  = Array.from({length:300},(_,i)=>i*5+5);
      const Rps = Es.map(calcRp);
      window.Plotly.react(plotRef.current,[
        {x:Es,y:Rps,mode:'lines',line:{color:'#f4a261',width:2.5},name:'Rp(E)'},
        {x:[E],y:[Rp],mode:'markers',marker:{color:'#2a6099',size:12,symbol:'diamond'},name:'Point courant'},
        {x:[0,E],y:[Rp,Rp],mode:'lines',line:{dash:'dot',color:'#888',width:1},showlegend:false},
        {x:[E,E],y:[0,Rp],mode:'lines',line:{dash:'dot',color:'#888',width:1},showlegend:false},
      ],{
        xaxis:{title:'Éclairement E (lx)',range:[0,1600]},
        yaxis:{title:'Résistance Rp (Ω)',range:[0,8000]},
        margin:{t:20,b:50,l:70,r:20},
        paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fafcff',
        legend:{orientation:'h',y:-0.3},autosize:true,
      },{displayModeBar:false,responsive:true});
    }

    if (activeBlock==="conditionneur") {
      const Rps = Array.from({length:300},(_,i)=>i*35);
      const Urs = Rps.map(rp=>5*R/(rp+R));
      window.Plotly.react(plotRef.current,[
        {x:Rps,y:Urs,mode:'lines',line:{color:'#e9a824',width:2.5},name:'Ur(Rp)'},
        {x:[Rp],y:[Ur],mode:'markers',marker:{color:'#2a6099',size:12,symbol:'diamond'},name:'Point courant'},
        {x:[0,Rp],y:[Ur,Ur],mode:'lines',line:{dash:'dot',color:'#888',width:1},showlegend:false},
        {x:[Rp,Rp],y:[0,Ur],mode:'lines',line:{dash:'dot',color:'#888',width:1},showlegend:false},
      ],{
        xaxis:{title:'Résistance Rp (Ω)',range:[0,10500]},
        yaxis:{title:'Tension Ur (V)',range:[0,5.2]},
        margin:{t:20,b:50,l:70,r:20},
        paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fafcff',
        legend:{orientation:'h',y:-0.3},autosize:true,
      },{displayModeBar:false,responsive:true});
    }

    if (activeBlock==="can") {
      window.Plotly.react(plotRef.current, [
        {x:[`${canInput} (${canUnite})`], y:[canValReel],
         type:'bar', marker:{color:'#e9a824'},
         name:`${canInput} = ${canValReel.toFixed(canInput==="Ur"?3:0)} ${canUnite}`, yaxis:'y'},
        {x:['N'], y:[NcanVal],
         type:'bar', marker:{color:'#2a6099'},
         name:`N = ${NcanVal}`, yaxis:'y2'},
      ], {
        yaxis:{
          title:`${canInput} (${canUnite})`,
          range:[0, canMax*1.05],
          side:'left',
          showgrid:false,
          ticklen:5,
          tickcolor:'#333',
          tickvals: Array.from({length:6}, (_,i) => Math.round(i*canMax/5*100)/100),
        },
        yaxis2:{
          title:`N (0 à ${Nmax})`,
          range:[0, Nmax*1.15],
          overlaying:'y',
          side:'right',
          showgrid:false,
          ticklen:5,
          tickcolor:'#333',
          tickvals: Array.from({length:6}, (_,i) => Math.round(i*Nmax/5)),
        },
        margin:{t:40, b:100, l:70, r:70},
        paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff',
        legend:{orientation:'h', y:-0.35}, showlegend:true, autosize:true,
        barmode:'group',
        annotations:[
          {
            x:`${canInput} (${canUnite})`,
            y: canValReel + canMax*0.08,
            text:`${canValReel.toFixed(canInput==="Ur"?3:0)} ${canUnite}`,
            showarrow:false,
            font:{size:12, color:'#e9a824', weight:600},
            yref:'y',
          },
          {
            x:'N',
            y: NcanVal + Nmax*0.08,
            text:`${NcanVal}`,
            showarrow:false,
            font:{size:12, color:'#2a6099', weight:600},
            yref:'y2',
          },
          {
            x:0.5, y:-0.35, xref:'paper', yref:'paper',
            text:`⚡ Quantum = ${quantum.toFixed(canInput==="Ur"?4:1)} ${canUnite}/pas`,
            showarrow:false, font:{size:12, color:'#2a9d8f'}, xanchor:'center'
          },
        ]
      }, {displayModeBar:false, responsive:true});
    }

  },[E,R,bits,activeBlock,canInput,plotlyReady]);

  // ── SVG Soleil ──
  const SoleilSVG = (
    <svg viewBox="0 0 240 120" style={{width:"100%",display:"block"}}>
      <rect x="0" y="0" width="240" height="120" fill={cielColor}/>
      {E<80 && [[20,15],[60,25],[120,10],[180,20],[210,35],[40,45],[160,12],[90,40]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1.5" fill="white" opacity={Math.max(0,1-E/80)}/>
      ))}
      {E>5 && Array.from({length:12},(_,i)=>{
        const a=i*30*Math.PI/180,r1=28,r2=42;
        return <line key={i} x1={70+r1*Math.cos(a)} y1={60+r1*Math.sin(a)}
          x2={70+r2*Math.cos(a)} y2={60+r2*Math.sin(a)}
          stroke="#FFD700" strokeWidth="3" strokeLinecap="round" opacity={soleilOpacity}/>;
      })}
      {E>5 && <>
        <circle cx="70" cy="60" r="25"
          fill={`rgb(${Math.round(255*E/1500)},${Math.round(229*E/1500)},0)`}
          opacity={soleilOpacity}/>
        <circle cx="70" cy="60" r="18" fill="#FFE500" opacity={soleilOpacity}/>
      </>}
      {nuagePct>0.05 && <g transform={`translate(${240-nuagePct*200},25)`} opacity={Math.min(nuagePct*2,1)}>
        <ellipse cx="55" cy="25" rx="42" ry="22" fill="white" opacity="0.92"/>
        <ellipse cx="32" cy="33" rx="30" ry="18" fill="white" opacity="0.92"/>
        <ellipse cx="78" cy="33" rx="28" ry="16" fill="white" opacity="0.92"/>
        <ellipse cx="55" cy="37" rx="48" ry="14" fill="white" opacity="0.92"/>
      </g>}
      {nuagePct>0.35 && <g transform={`translate(${240-nuagePct*160},5)`} opacity={Math.min((nuagePct-0.35)*2,1)}>
        <ellipse cx="45" cy="22" rx="38" ry="20" fill="#e0e0e0" opacity="0.95"/>
        <ellipse cx="25" cy="30" rx="26" ry="14" fill="#e0e0e0" opacity="0.95"/>
        <ellipse cx="68" cy="30" rx="24" ry="13" fill="#e0e0e0" opacity="0.95"/>
        <ellipse cx="45" cy="34" rx="42" ry="12" fill="#e0e0e0" opacity="0.95"/>
      </g>}
      {nuagePct>0.65 && <g transform={`translate(${240-nuagePct*130},35)`} opacity={Math.min((nuagePct-0.65)*3,1)}>
        <ellipse cx="40" cy="20" rx="35" ry="18" fill="#bbb" opacity="0.95"/>
        <ellipse cx="22" cy="28" rx="24" ry="12" fill="#bbb" opacity="0.95"/>
        <ellipse cx="60" cy="28" rx="22" ry="11" fill="#bbb" opacity="0.95"/>
        <ellipse cx="40" cy="32" rx="38" ry="10" fill="#bbb" opacity="0.95"/>
      </g>}
      <text x="165" y="108" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold"
        style={{textShadow:"1px 1px 3px rgba(0,0,0,0.8)"}}>E = {E} lx</text>
    </svg>
  );

  // ── SVG Montage Arduino (fixe) ──
  const MontageSVG = (
    <div style={{position:"relative"}}>
      <img src="/simulations-chimie/schemaarduino.PNG"
        style={{width:"100%", display:"block"}}
        alt="Schéma montage Arduino"/>

      {/* LED — toujours visible */}
      <div style={{
        position:"absolute",
        top:"10%", left:"86%",
        width:18, height:18,
        borderRadius:"50%",
        background: ledOn ? "#FFD700" : "#555",
        boxShadow: ledOn ? "0 0 14px 7px rgba(255,215,0,0.6)" : "none",
        border:"2px solid #888",
        transition:"all 0.3s"
      }}/>
      {/* Label ON/OFF juste à droite de la LED */}
      <div style={{
        position:"absolute",
        top:"10%", left:"91%",
        fontSize:11, fontWeight:"bold",
        color: ledOn ? "#e65100" : "#666",
        background:"rgba(255,255,255,0.85)",
        padding:"2px 5px", borderRadius:4,
        transition:"all 0.3s"
      }}>
        {ledOn ? "💡ON" : "OFF"}
      </div>
    </div>
  );


  // ── Styles blocs ──
  const blockBtn = (key, color, title, sub, val) => (
    <div onClick={()=>setActiveBlock(key)} style={{
      padding:"8px 12px", borderRadius:8,
      border:`2px solid ${activeBlock===key?color:'#ddd'}`,
      cursor:"pointer", background:activeBlock===key?color+'18':'white',
      transition:"all 0.2s", textAlign:"center", userSelect:"none", width:"100%",
    }}>
      <div style={{fontWeight:600,fontSize:13}}>{title}</div>
      <div style={{fontSize:11,color:"#888"}}>{sub}</div>
      <div style={{fontSize:12,color,fontWeight:600}}>{val}</div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,
      fontFamily:"Inter, system-ui, Arial",fontSize:14}}>

      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>

        {/* ── COLONNE GAUCHE ── */}
        <div style={{flex:"0 0 260px",display:"flex",flexDirection:"column",gap:10}}>

          {/* Source lumineuse */}
          <div style={cardStyle}>
            {SoleilSVG}
            <input type="range" min="0" max="100" step="1"
              value={Math.round(Math.sqrt((E-12)/1488)*100)}
              onChange={e=>{const v=parseFloat(e.target.value)/100;setE(Math.round(v*v*1488+12));}}
              style={{width:"100%",accentColor:"#f4a261",marginTop:6}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#888"}}>
              <span>12 lx (nuit)</span>
              <span>1500 lx (soleil)</span>
            </div>
          </div>

          {/* Chaîne verticale */}
          <div style={{...cardStyle,display:"flex",flexDirection:"column",
            alignItems:"center",gap:4}}>
            {blockBtn("capteur","#f4a261","📡 Capteur","photorésistance",`Rp = ${Rp.toLocaleString()} Ω`)}
            <div style={{fontSize:22,color:"#333"}}>↓</div>
            {blockBtn("conditionneur","#e9a824","⚡ Conditionneur",`pont diviseur R=${R}Ω`,`Ur = ${Ur.toFixed(3)} V`)}
            <div style={{fontSize:22,color:"#333"}}>↓</div>
            {blockBtn("can","#2a6099","🔢 CAN Arduino",`${bits} bits (0 à ${Nmax})`,`N = ${N}`)}
            <div style={{fontSize:22,color:"#333"}}>↓</div>
            {blockBtn("arduino","#2a9d8f","🤖 Traitement","algorithme phares",
              pharesOn?(ledOn?"Sortie 11 : HIGH 💡":"Sortie 11 : LOW"):"inactif")}
            <button onClick={()=>setPharesOn(v=>!v)}
              style={{marginTop:6, padding:"4px 12px", borderRadius:6,
                border:"none", cursor:"pointer", fontWeight:600, fontSize:12,
                width:"100%",
                background: pharesOn ? "#f4a261" : "#eee",
                color: pharesOn ? "white" : "#333"}}>
              {pharesOn ? "🔦 Phares activés" : "🔦 Activer phares"}
            </button>
          </div>
        </div>

        {/* ── COLONNE DROITE ── */}
        <div style={{flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:12}}>

          {/* Montage Arduino TOUJOURS EN HAUT */}
          <div style={cardStyle}>
            <div style={{fontWeight:600, color:"#445", marginBottom:8}}>
              Montage Arduino
            </div>
            {MontageSVG}
          </div>

          {/* Graphique EN BAS — change selon bloc actif */}
          {activeBlock!=="arduino" && (
            <div style={{...cardStyle, overflow:"hidden"}}>
              <div style={{fontWeight:600, color:"#445", marginBottom:6,
                display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                {activeBlock==="capteur" && "Caractéristique — Rp = f(E)"}
                {activeBlock==="conditionneur" && <>
                  <span>Caractéristique — Ur = f(Rp)</span>
                  <span style={{fontSize:12, color:"#888"}}>R =</span>
                  <input type="number" value={R} onChange={e=>setR(parseFloat(e.target.value))}
                    step="100" min="100" max="10000"
                    style={{width:75, fontSize:12, padding:"2px 6px", borderRadius:4, border:"1px solid #ccc"}}/>
                  <span style={{fontSize:12, color:"#888"}}>Ω</span>
                </>}
                {activeBlock==="can" && <>
                  <span>Conversion CAN</span>
                  <select value={bits} onChange={e=>setBits(parseInt(e.target.value))}
                    style={{fontSize:12, padding:"2px 4px", borderRadius:4, border:"1px solid #ccc"}}>
                    <option value={1}>1 bit (0-1)</option>
                    <option value={2}>2 bits (0-3)</option>
                    <option value={4}>4 bits (0-15)</option>
                    <option value={8}>8 bits (0-255)</option>
                    <option value={10}>10 bits (0-1023)</option>
                    <option value={12}>12 bits (0-4095)</option>
                  </select>
                  <span style={{fontSize:12, color:"#888"}}>Entrée :</span>
                  <select value={canInput} onChange={e=>setCanInput(e.target.value)}
                    style={{fontSize:12, padding:"2px 4px", borderRadius:4, border:"1px solid #ccc"}}>
                    <option value="Ur">Ur (V)</option>
                    <option value="Rp">Rp (Ω)</option>
                    <option value="E">E (lx)</option>
                  </select>
                </>}
              </div>
              <div ref={plotRef} style={{height: activeBlock==="arduino" ? 0 : 280, overflow:"hidden"}}/>
              {activeBlock==="conditionneur" && (
                <div style={{marginTop:8, padding:"10px 14px", borderRadius:6,
                  background:"#fffbf0", border:"1px solid #e9a824", fontSize:13}}>
                  <strong>Pont diviseur de tension :</strong><br/>
                  <span style={{fontFamily:"monospace", fontSize:15, color:"#e9a824"}}>
                    Ur = 5 × R / (Rp + R)
                  </span><br/>
                  <span style={{color:"#888", fontSize:12}}>
                    R={R}Ω, Rp={Rp.toLocaleString()}Ω → <strong>Ur = {Ur.toFixed(3)} V</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Algorithme — seulement si traitement actif ET phares activés */}
          {activeBlock==="arduino" && pharesOn && (
            <div style={cardStyle}>
              <div style={{fontWeight:600, color:"#445", marginBottom:10}}>
                Algorithme de contrôle
              </div>
              <div style={{fontFamily:"monospace", fontSize:12, lineHeight:2,
                background:"#1e1e2e", color:"#cdd6f4", padding:12, borderRadius:8}}>
                <div style={{color:"#89b4fa"}}>boucle infinie :</div>
                <div style={{paddingLeft:16}}>
                  <span style={{color:"#cba6f7"}}>Si </span>N &lt;&nbsp;
                  <input type="number" value={algoN1}
                    onChange={e=>setAlgoN1(parseInt(e.target.value))}
                    style={{width:65, background:"#313244", color:"#f38ba8",
                      border:"1px solid #45475a", borderRadius:4, padding:"1px 4px",
                      fontFamily:"monospace", fontSize:12}}/>
                  <span style={{color:"#cba6f7"}}> alors </span>sortie 8 =&nbsp;
                  <select value={algoEtat1} onChange={e=>setAlgoEtat1(e.target.value)}
                    style={{background:"#313244", color:"#a6e3a1",
                      border:"1px solid #45475a", borderRadius:4, padding:"1px 4px",
                      fontFamily:"monospace", fontSize:12}}>
                    <option value="HIGH">HIGH</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div style={{paddingLeft:16}}>
                  <span style={{color:"#cba6f7"}}>Si </span>N &gt;&nbsp;
                  <input type="number" value={algoN2}
                    onChange={e=>setAlgoN2(parseInt(e.target.value))}
                    style={{width:65, background:"#313244", color:"#f38ba8",
                      border:"1px solid #45475a", borderRadius:4, padding:"1px 4px",
                      fontFamily:"monospace", fontSize:12}}/>
                  <span style={{color:"#cba6f7"}}> alors </span>sortie 8 =&nbsp;
                  <select value={algoEtat2} onChange={e=>setAlgoEtat2(e.target.value)}
                    style={{background:"#313244", color:"#a6e3a1",
                      border:"1px solid #45475a", borderRadius:4, padding:"1px 4px",
                      fontFamily:"monospace", fontSize:12}}>
                    <option value="HIGH">HIGH</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div style={{paddingLeft:16, color:"#6c7086"}}>délai 5s → relancer boucle</div>
              </div>
              <div style={{marginTop:8, padding:"8px 12px", borderRadius:6,
                background:ledOn?"#fff3e0":"#f5f5f5",
                border:`1px solid ${ledOn?"#f4a261":"#ddd"}`,
                fontSize:12, fontWeight:600, color:ledOn?"#e65100":"#888"}}>
                {ledOn
                  ? `💡 Phares ALLUMÉS — N=${N} < ${algoN1}`
                  : N>algoN2
                    ? `💡 Phares ÉTEINTS — N=${N} > ${algoN2}`
                    : `⏳ En attente — N=${N} (entre ${algoN1} et ${algoN2})`}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ============================================================
//  SIMULATION 9 — Étude inter-laboratoire
// ============================================================

function Simulation9({ plotlyReady }) {
  const [p, setP]               = useState(10);
  const [n, setN]               = useState(5);
  const [cible, setCible]       = useState(10);
  const [unite, setUnite]       = useState("mmol/L");
  const [donnees, setDonnees]   = useState(null);
  const [moyennes, setMoyennes] = useState([]);
  const [ecarts, setEcarts]     = useState([]);
  const [mode, setMode]         = useState("auto"); // "auto" | "manuel"
  const [etape, setEtape]       = useState("config"); // config | tableau | cochran | grubbs | resultats
  const [labosActifs, setLabosActifs]     = useState([]);
  const [labosDouteuxC, setLabosDouteuxC] = useState([]);
  const [labosDouteuxG, setLabosDouteuxG] = useState([]);
  const [labosEliminésC, setLabosEliminésC] = useState([]);
  const [labosEliminésG, setLabosEliminésG] = useState([]);
  const [reponseUser, setReponseUser]     = useState("");
  const [feedback, setFeedback]           = useState(null);
  const [questionActive, setQuestionActive] = useState(true);
  const [iterCochran, setIterCochran]     = useState(0);
  const [iterGrubbs, setIterGrubbs]       = useState(0);

  const plotRef = useRef(null);

  // ── Tables valeurs critiques ──
  const tableCochran = {
    // [p][n] = {p1, p5}  n de 2 à 6
    2:  {2:{p1:null,p5:null}, 3:{p1:0.995,p5:0.975}, 4:{p1:0.979,p5:0.939}, 5:{p1:0.959,p5:0.906}, 6:{p1:0.937,p5:0.877}},
    3:  {2:{p1:0.993,p5:0.967}, 3:{p1:0.942,p5:0.871}, 4:{p1:0.883,p5:0.798}, 5:{p1:0.834,p5:0.746}, 6:{p1:0.793,p5:0.707}},
    4:  {2:{p1:0.968,p5:0.906}, 3:{p1:0.864,p5:0.768}, 4:{p1:0.781,p5:0.684}, 5:{p1:0.721,p5:0.629}, 6:{p1:0.676,p5:0.590}},
    5:  {2:{p1:0.928,p5:0.841}, 3:{p1:0.788,p5:0.684}, 4:{p1:0.696,p5:0.598}, 5:{p1:0.633,p5:0.544}, 6:{p1:0.588,p5:0.506}},
    6:  {2:{p1:0.883,p5:0.781}, 3:{p1:0.722,p5:0.616}, 4:{p1:0.626,p5:0.532}, 5:{p1:0.564,p5:0.480}, 6:{p1:0.520,p5:0.445}},
    7:  {2:{p1:0.838,p5:0.727}, 3:{p1:0.664,p5:0.561}, 4:{p1:0.568,p5:0.480}, 5:{p1:0.508,p5:0.431}, 6:{p1:0.466,p5:0.397}},
    8:  {2:{p1:0.794,p5:0.680}, 3:{p1:0.615,p5:0.516}, 4:{p1:0.521,p5:0.438}, 5:{p1:0.463,p5:0.391}, 6:{p1:0.423,p5:0.360}},
    9:  {2:{p1:0.754,p5:0.638}, 3:{p1:0.573,p5:0.478}, 4:{p1:0.481,p5:0.403}, 5:{p1:0.425,p5:0.358}, 6:{p1:0.387,p5:0.329}},
    10: {2:{p1:0.718,p5:0.602}, 3:{p1:0.536,p5:0.445}, 4:{p1:0.447,p5:0.373}, 5:{p1:0.393,p5:0.331}, 6:{p1:0.357,p5:0.303}},
    11: {2:{p1:0.684,p5:0.570}, 3:{p1:0.504,p5:0.417}, 4:{p1:0.418,p5:0.348}, 5:{p1:0.366,p5:0.308}, 6:{p1:0.332,p5:0.281}},
    12: {2:{p1:0.653,p5:0.541}, 3:{p1:0.475,p5:0.392}, 4:{p1:0.392,p5:0.326}, 5:{p1:0.343,p5:0.288}, 6:{p1:0.310,p5:0.262}},
    13: {2:{p1:0.624,p5:0.515}, 3:{p1:0.450,p5:0.371}, 4:{p1:0.369,p5:0.307}, 5:{p1:0.322,p5:0.271}, 6:{p1:0.291,p5:0.243}},
    14: {2:{p1:0.599,p5:0.492}, 3:{p1:0.427,p5:0.352}, 4:{p1:0.349,p5:0.291}, 5:{p1:0.304,p5:0.255}, 6:{p1:0.274,p5:0.232}},
    15: {2:{p1:0.575,p5:0.471}, 3:{p1:0.407,p5:0.335}, 4:{p1:0.332,p5:0.276}, 5:{p1:0.288,p5:0.242}, 6:{p1:0.259,p5:0.220}},
    16: {2:{p1:0.553,p5:0.452}, 3:{p1:0.388,p5:0.319}, 4:{p1:0.316,p5:0.262}, 5:{p1:0.274,p5:0.230}, 6:{p1:0.246,p5:0.208}},
    17: {2:{p1:0.532,p5:0.434}, 3:{p1:0.372,p5:0.305}, 4:{p1:0.301,p5:0.250}, 5:{p1:0.261,p5:0.219}, 6:{p1:0.234,p5:0.198}},
    18: {2:{p1:0.514,p5:0.418}, 3:{p1:0.356,p5:0.293}, 4:{p1:0.288,p5:0.240}, 5:{p1:0.249,p5:0.209}, 6:{p1:0.223,p5:0.189}},
    19: {2:{p1:0.496,p5:0.403}, 3:{p1:0.343,p5:0.281}, 4:{p1:0.276,p5:0.230}, 5:{p1:0.238,p5:0.200}, 6:{p1:0.214,p5:0.181}},
    20: {2:{p1:0.480,p5:0.389}, 3:{p1:0.330,p5:0.270}, 4:{p1:0.265,p5:0.220}, 5:{p1:0.229,p5:0.192}, 6:{p1:0.205,p5:0.174}},
  };

  const tableGrubbs = {
    // p → {p1, p5}
    3:{p1:1.155,p5:1.155}, 4:{p1:1.496,p5:1.481}, 5:{p1:1.764,p5:1.715},
    6:{p1:1.973,p5:1.887}, 7:{p1:2.139,p5:2.020}, 8:{p1:2.274,p5:2.126},
    9:{p1:2.387,p5:2.215}, 10:{p1:2.482,p5:2.290}, 11:{p1:2.564,p5:2.355},
    12:{p1:2.636,p5:2.412}, 13:{p1:2.699,p5:2.462}, 14:{p1:2.755,p5:2.507},
    15:{p1:2.805,p5:2.549}, 16:{p1:2.852,p5:2.585}, 17:{p1:2.894,p5:2.620},
    18:{p1:2.932,p5:2.651}, 19:{p1:2.968,p5:2.681}, 20:{p1:3.001,p5:2.709},
  };

  // ── Génération données aléatoires ──
  const genererDonnees = () => {
    const randn = (mu, sigma) => {
      let u=0, v=0;
      while(u===0) u=Math.random();
      while(v===0) v=Math.random();
      return mu + sigma * Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
    };

    // Paramètres par labo — certains suspects volontairement
    const params = Array.from({length:p}, (_, i) => {
      const suspectEcart = i === Math.floor(Math.random()*p);
      const suspectMoy   = i === Math.floor(Math.random()*p);
      const mu    = suspectMoy ? cible * 1.15 : cible + (Math.random()-0.5)*cible*0.05;
      const sigma = suspectEcart ? cible*0.08 + Math.random()*cible*0.04
                                 : cible*0.01 + Math.random()*cible*0.02;
      return {mu, sigma};
    });

    const data = params.map(({mu, sigma}) =>
      Array.from({length:n}, () => parseFloat(randn(mu, sigma).toFixed(3)))
    );

    const moys = data.map(vals => parseFloat((vals.reduce((a,b)=>a+b,0)/n).toFixed(4)));
    const ecTs = data.map((vals, i) => {
      const m = moys[i];
      return parseFloat(Math.sqrt(vals.reduce((a,v)=>a+(v-m)**2,0)/(n-1)).toFixed(4));
    });

    setDonnees(data);
    setMoyennes(moys);
    setEcarts(ecTs);
    setLabosActifs(Array.from({length:p}, (_,i)=>i));
    setLabosDouteuxC([]);
    setLabosDouteuxG([]);
    setLabosEliminésC([]);
    setLabosEliminésG([]);
    setEtape("tableau");
    setFeedback(null);
    setQuestionActive(true);
    setIterCochran(0);
    setIterGrubbs(0);
  };

  // ── Calculs Cochran ──
  const calcCochran = (actifs) => {
    const s2 = actifs.map(i => ecarts[i]**2);
    const smax2 = Math.max(...s2);
    const C = smax2 / s2.reduce((a,b)=>a+b,0);
    const nCap = Math.min(n, 6);
    const pCap = Math.min(actifs.length, 20);
    const crit = tableCochran[pCap]?.[nCap];
    const idxMax = actifs[s2.indexOf(smax2)];
    return {C: parseFloat(C.toFixed(4)), crit, idxMax, smax: ecarts[idxMax]};
  };

  // ── Calculs Grubbs ──
  const calcGrubbs = (actifs) => {
    const moys_actifs = actifs.map(i => moyennes[i]);
    const ybar = moys_actifs.reduce((a,b)=>a+b,0) / actifs.length;
    const sy = Math.sqrt(moys_actifs.reduce((a,m)=>a+(m-ybar)**2,0) / (actifs.length-1));
    const Gmax = (Math.max(...moys_actifs) - ybar) / sy;
    const Gmin = Math.abs(Math.min(...moys_actifs) - ybar) / sy;
    const pCap = Math.min(actifs.length, 20);
    const crit = tableGrubbs[pCap];
    const idxMax = actifs[moys_actifs.indexOf(Math.max(...moys_actifs))];
    const idxMin = actifs[moys_actifs.indexOf(Math.min(...moys_actifs))];
    return {
      Gmax: parseFloat(Gmax.toFixed(4)),
      Gmin: parseFloat(Gmin.toFixed(4)),
      ybar: parseFloat(ybar.toFixed(4)),
      sy: parseFloat(sy.toFixed(4)),
      crit, idxMax, idxMin
    };
  };

  // ── Plotly Gauss ──
  useEffect(() => {
    
    if (!window.Plotly || !donnees) return;
    const timer = setTimeout(() => {
      if (!plotRef.current) return;
    // Petit délai pour laisser le DOM se mettre à jour
    const timer = setTimeout(() => {
      if (!plotRef.current) return;
    const colors = ['#e63946','#2a9d8f','#e9a824','#2a6099','#6a4c93',
                    '#f4a261','#264653','#457b9d','#a8dadc','#e76f51',
                    '#2b9348','#d62828','#023e8a','#7b2d8b','#f72585',
                    '#4cc9f0','#4361ee','#3a0ca3','#560bad','#480ca8'];

    const xvals = Array.from({length:2000}, (_,i) => {
      const smaxVal = Math.max(...labosActifs.map(j => ecarts[j]));
      const ybarVal = labosActifs.reduce((a,j) => a + moyennes[j], 0) / labosActifs.length;
      const xmin = ybarVal - 12*smaxVal;
      const xmax = ybarVal + 12*smaxVal;
      return xmin + i*(xmax-xmin)/2000;
    });
    const traces = labosActifs.map(i => {
      const mu = moyennes[i];
      const sigma = ecarts[i];
      const y = xvals.map(x => (1/(sigma*Math.sqrt(2*Math.PI)))*Math.exp(-0.5*((x-mu)/sigma)**2));
      const elimC = labosEliminésC.includes(i);
      const elimG = labosEliminésG.includes(i);
      const doutC = labosDouteuxC.includes(i);
      const doutG = labosDouteuxG.includes(i);
      const elimine = elimC || elimG;
      const douteux = doutC || doutG;
      return {
        x: xvals, y,
        mode:'lines',
        name: `Labo ${i+1}`,
        line:{
          color: elimine ? '#ccc' : douteux ? '#aaa' : colors[i % colors.length],
          dash: elimine ? 'dot' : douteux ? 'dash' : 'solid',
          width: elimine ? 1 : 2
        },
        opacity: elimine ? 0.4 : 1,
      };
    });

    // Ligne cible
    traces.push({
      x:[cible,cible], y:[0, Math.max(...labosActifs.map(i=>{
        const sigma=ecarts[i];
        return 1/(sigma*Math.sqrt(2*Math.PI));
      }))],
      mode:'lines', line:{dash:'dash', color:'#333', width:1.5},
      name:`Cible = ${cible}`, showlegend:true
    });

    // Ligne moyenne des moyennes
    const ybar = labosActifs.reduce((a,i)=>a+moyennes[i],0)/labosActifs.length;
    traces.push({
      x:[ybar,ybar], y:[0, Math.max(...labosActifs.map(i=>{
        const sigma=ecarts[i];
        return 1/(sigma*Math.sqrt(2*Math.PI));
      }))],
      mode:'lines', line:{dash:'dot', color:'#e63946', width:1.5},
      name:`ȳ = ${ybar.toFixed(3)}`, showlegend:true
    });

    window.Plotly.react(plotRef.current, traces, {
      xaxis:{title:`Concentration (${unite})`, range:(() => {
        const smaxVal = Math.max(...labosActifs.map(i => ecarts[i]));
        const ybarVal = labosActifs.reduce((a,i) => a + moyennes[i], 0) / labosActifs.length;
        return [ybarVal - 10*smaxVal, ybarVal + 10*smaxVal];
      })()},
      yaxis:{title:'Densité de probabilité'},
      margin:{t:20,b:60,l:70,r:20},
      paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff',
      legend:{orientation:'h', y:-0.25},
      autosize:true,
    }, {displayModeBar:false, responsive:true});
  }, 100);
    return () => clearTimeout(timer);
    }, 150);
    return () => clearTimeout(timer);
  }, [donnees, etape, labosActifs, labosEliminésC, labosEliminésG, labosDouteuxC, labosDouteuxG, plotlyReady]);

  // ── Résultats finaux ──
  const calcResultats = (actifs) => {
    const k = actifs.length;
    const s2r = actifs.reduce((a,i)=>a+ecarts[i]**2,0) / k;
    const moys_actifs = actifs.map(i=>moyennes[i]);
    const ybar = moys_actifs.reduce((a,b)=>a+b,0) / k;
    const s2L = moys_actifs.reduce((a,m)=>a+(m-ybar)**2,0)/(k-1) - s2r/n;
    const s2R = s2L + s2r;
    return {
      Sr: parseFloat(Math.sqrt(Math.max(s2r,0)).toFixed(4)),
      SR: parseFloat(Math.sqrt(Math.max(s2R,0)).toFixed(4)),
      SL: parseFloat(Math.sqrt(Math.max(s2L,0)).toFixed(4)),
      ybar: parseFloat(ybar.toFixed(4)),
      k
    };
  };

  // ── Styles ──
  const colors10 = ['#e63946','#2a9d8f','#e9a824','#2a6099','#6a4c93',
                    '#f4a261','#264653','#457b9d','#a8dadc','#e76f51',
                    '#2b9348','#d62828','#023e8a','#7b2d8b','#f72585',
                    '#4cc9f0','#4361ee','#3a0ca3','#560bad','#480ca8'];

  const tdStyle = {padding:"4px 8px", border:"1px solid #e0e0e0", fontSize:12, textAlign:"center"};
  const thStyle = {...tdStyle, background:"#f5f5f5", fontWeight:700};

  const StatutBadge = ({labo}) => {
    if (labosEliminésC.includes(labo))
      return <span style={{fontSize:10,background:"#e63946",color:"white",padding:"1px 5px",borderRadius:4}}>❌ Éliminé (C)</span>;
    if (labosEliminésG.includes(labo))
      return <span style={{fontSize:10,background:"#e9a824",color:"white",padding:"1px 5px",borderRadius:4}}>❌ Éliminé (G)</span>;
    if (labosDouteuxC.includes(labo))
      return <span style={{fontSize:10,background:"#f4a261",color:"white",padding:"1px 5px",borderRadius:4}}>⚠ Douteux (C)</span>;
    if (labosDouteuxG.includes(labo))
      return <span style={{fontSize:10,background:"#f4a261",color:"white",padding:"1px 5px",borderRadius:4}}>⚠ Douteux (G)</span>;
    return null;
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,
      fontFamily:"Inter, system-ui, Arial",fontSize:14}}>

      {/* ── CONFIGURATION ── */}
      <div style={cardStyle}>
        <div style={{fontWeight:600,color:"#445",marginBottom:10}}>
          Configuration de l'étude
        </div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:12,color:"#666"}}>Nombre de labos (p)</span>
            <input type="number" min="3" max="20" value={p}
              onChange={e=>setP(parseInt(e.target.value))}
              style={{width:70,padding:"4px 8px",borderRadius:4,border:"1px solid #ccc",fontSize:13}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:12,color:"#666"}}>Essais par labo (n)</span>
            <input type="number" min="2" max="6" value={n}
              onChange={e=>setN(parseInt(e.target.value))}
              style={{width:70,padding:"4px 8px",borderRadius:4,border:"1px solid #ccc",fontSize:13}}/>
            <span style={{fontSize:10,color:"#999"}}>max 6 (table Cochran)</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:12,color:"#666"}}>Valeur cible</span>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input type="number" min="1" step="0.1" value={cible}
                onChange={e=>setCible(parseFloat(e.target.value))}
                style={{width:80,padding:"4px 8px",borderRadius:4,border:"1px solid #ccc",fontSize:13}}/>
              <input type="text" value={unite}
                onChange={e=>setUnite(e.target.value)}
                placeholder="unité"
                style={{width:80,padding:"4px 8px",borderRadius:4,border:"1px solid #ccc",fontSize:13}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setMode("auto"); genererDonnees();}}
              style={{padding:"6px 16px",borderRadius:6,border:"none",
                background:"#c0392b",color:"white",cursor:"pointer",fontWeight:600}}>
              🎲 Générer aléatoirement
            </button>
            <button onClick={()=>{setMode("manuel"); setDonnees(null); setEtape("config");
              setLabosActifs([]); setLabosEliminésC([]); setLabosEliminésG([]);
              setLabosDouteuxC([]); setLabosDouteuxG([]);}}
              style={{padding:"6px 16px",borderRadius:6,border:"1px solid #c0392b",
                background:"white",color:"#c0392b",cursor:"pointer",fontWeight:600}}>
              ✏️ Saisie manuelle
            </button>
          </div>
        </div>
      </div>

      {/* ── SAISIE MANUELLE ── */}
      {mode==="manuel" && !donnees && (
        <div style={cardStyle}>
          <div style={{fontWeight:600,color:"#445",marginBottom:10}}>
            Saisie manuelle des données
          </div>
          <ManualInput p={p} n={n} cible={cible}
            onValidate={(data, moys, ects) => {
              setDonnees(data); setMoyennes(moys); setEcarts(ects);
              setLabosActifs(Array.from({length:p},(_,i)=>i));
              setEtape("tableau");
            }}/>
        </div>
      )}

      {/* ── TABLEAU + GRAPHIQUE ── */}
      {donnees && etape !== "config" && <>

        {/* Tableau */}
        <div style={cardStyle}>
          <div style={{fontWeight:600,color:"#445",marginBottom:8}}>
            Résultats des mesures {unite}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{borderCollapse:"collapse", fontSize:12, minWidth:"100%"}}>
              <thead>
                <tr>
                  <th style={thStyle}>Essai</th>
                  {Array.from({length:p},(_,i)=>(
                    <th key={i} style={{
                      ...thStyle,
                      color: labosEliminésC.includes(i)||labosEliminésG.includes(i) ? "#aaa" : colors10[i],
                      background: labosEliminésC.includes(i)||labosEliminésG.includes(i) ? "#f5f5f5" : `${colors10[i]}15`
                    }}>
                      Labo {i+1}
                      <StatutBadge labo={i}/>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({length:n},(_,j)=>(
                  <tr key={j}>
                    <td style={{...tdStyle,fontWeight:600}}>{j+1}</td>
                    {donnees.map((col,i)=>(
                      <td key={i} style={{
                        ...tdStyle,
                        opacity: labosEliminésC.includes(i)||labosEliminésG.includes(i) ? 0.4 : 1
                      }}>
                        {col[j]}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Ligne moyenne */}
                <tr style={{background:"#f0f8ff"}}>
                  <td style={{...tdStyle,fontWeight:700}}>ȳᵢ</td>
                  {moyennes.map((m,i)=>(
                    <td key={i} style={{...tdStyle,fontWeight:700,
                      opacity:labosEliminésC.includes(i)||labosEliminésG.includes(i)?0.4:1}}>
                      {m}
                    </td>
                  ))}
                </tr>
                {/* Ligne écart-type */}
                <tr style={{background:"#fff8f0"}}>
                  <td style={{...tdStyle,fontWeight:700}}>sᵢ</td>
                  {ecarts.map((s,i)=>(
                    <td key={i} style={{...tdStyle,fontWeight:700,
                      color: "inherit",
                      opacity:labosEliminésC.includes(i)||labosEliminésG.includes(i)?0.4:1}}>
                      {s}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {etape==="tableau" && (
            <button onClick={()=>setEtape("gauss")}
              style={{marginTop:12,padding:"6px 16px",borderRadius:6,border:"none",
                background:"#c0392b",color:"white",cursor:"pointer",fontWeight:600}}>
              Visualiser les distributions →
            </button>
          )}
        </div>

        {/* Graphique Gauss */}
        {(etape==="gauss"||etape==="cochran"||etape==="grubbs"||etape==="resultats") && (
          <div style={cardStyle}>
            <div style={{fontWeight:600,color:"#445",marginBottom:6}}>
              Distributions gaussiennes des laboratoires
            </div>
            <div ref={plotRef} style={{height:320}}/>
            {etape==="gauss" && (
              <button onClick={()=>{setEtape("cochran"); setQuestionActive(true); setFeedback(null);}}
                style={{marginTop:12,padding:"6px 16px",borderRadius:6,border:"none",
                  background:"#c0392b",color:"white",cursor:"pointer",fontWeight:600}}>
                Passer au test de Cochran →
              </button>
            )}
          </div>
        )}

        {/* ── TEST COCHRAN ── */}
        {(etape==="cochran"||etape==="grubbs"||etape==="resultats") && (() => {
          const {C, crit, idxMax, smax} = calcCochran(labosActifs);
          const pActif = labosActifs.length;
          const nCap = Math.min(n,6);
          return (
            <div style={cardStyle}>
              <div style={{fontWeight:700,color:"#c0392b",fontSize:15,marginBottom:10}}>
                🔬 Test de Cochran — Itération {iterCochran+1}
              </div>

              {/* Formule et calcul */}
              <div style={{background:"#fff5f5",border:"1px solid #ffcccc",borderRadius:6,
                padding:"10px 14px",marginBottom:12,fontSize:13}}>
                <div style={{marginBottom:6}}>
                  <strong>C = s²max / Σsᵢ²</strong>
                  {" = "}
                  <strong style={{color:"#c0392b"}}>{ecarts[idxMax]}² / Σsᵢ²</strong>
                  {" = "}
                  <strong style={{color:"#c0392b",fontSize:15}}>{C}</strong>
                </div>
                <div style={{fontSize:12,color:"#555"}}>
                  Valeurs critiques (p={pActif}, n={nCap}) :
                  C₅% = <strong>{crit?.p5 ?? "N/A"}</strong> &nbsp;|&nbsp;
                  C₁% = <strong>{crit?.p1 ?? "N/A"}</strong>
                </div>
              </div>

              {/* Question pédagogique */}
              {questionActive && etape==="cochran" && (
                <div style={{background:"#f0f4ff",border:"1px solid #2a6099",
                  borderRadius:6,padding:"12px 14px",marginBottom:12}}>
                  <div style={{fontWeight:600,color:"#2a6099",marginBottom:8}}>
                    🤔 Question : Si un laboratoire devait être éliminé par le test de Cochran, lequel serait-ce ?
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {labosActifs.map(i=>(
                      <button key={i}
                        onClick={()=>{
                          const correct = i === idxMax;
                          setReponseUser(i);
                          setFeedback({correct,
                            msg: correct
                              ? `🎉 Bravo ! C'est bien le Labo ${i+1} qui est suspecté par le test de Grubbs — c'est celui qui a le plus grand écart-type (s = ${ecarts[i]}).`
                              : `❌ Pas tout à fait ! C'est en réalité le Labo ${idxMax+1} qui est suspecté, car c'est celui qui a le plus grand écart-type (s = ${ecarts[idxMax]}).`
                          });
                        }}
                        style={{padding:"4px 12px",borderRadius:5,cursor:"pointer",
                          border:`1px solid ${colors10[i]}`,
                          background:`${colors10[i]}15`, color:colors10[i], fontWeight:600}}>
                        Labo {i+1}
                      </button>
                    ))}
                  </div>
                  {feedback && (
                    <div style={{marginTop:8,padding:"8px 12px",borderRadius:5,
                      background:feedback.correct?"#f0fff4":"#fff5f5",
                      border:`1px solid ${feedback.correct?"#2a9d8f":"#e63946"}`,
                      fontSize:12,color:feedback.correct?"#2a9d8f":"#e63946"}}>
                      {feedback.msg}
                    </div>
                  )}
                  {/* Bouton continuer après réponse */}
                  {feedback && (
                    <button onClick={()=>setQuestionActive(false)}
                      style={{marginTop:8, padding:"4px 12px", borderRadius:5,
                        border:"none", background:"#2a6099", color:"white",
                        cursor:"pointer", fontSize:12, fontWeight:600}}>
                      Voir le résultat du test →
                    </button>
                  )}
                </div>
              )}

              {/* Verdict Cochran */}
              {!questionActive && (
                <div style={{marginBottom:12}}>
                  {!crit ? (
                    <div style={{padding:"8px 12px",borderRadius:6,background:"#f5f5f5",fontSize:13}}>
                      ⚠ Pas de valeur critique disponible pour ces paramètres.
                    </div>
                  ) : C < crit.p5 ? (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#f0fff4",border:"1px solid #2a9d8f",fontSize:13,color:"#2a9d8f",fontWeight:600}}>
                      ✅ C = {C} &lt; C₅% = {crit.p5} → Aucun laboratoire rejeté. Test terminé !
                    </div>
                  ) : C > crit.p1 ? (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#fff5f5",border:"1px solid #e63946",fontSize:13,color:"#e63946",fontWeight:600}}>
                      ❌ C = {C} &gt; C₁% = {crit.p1} → Le Labo {idxMax+1} est <strong>rejeté</strong> !
                      <button onClick={()=>{
                        const newActifs = labosActifs.filter(i=>i!==idxMax);
                        setLabosActifs(newActifs);
                        setLabosEliminésC([...labosEliminésC, idxMax]);
                        setIterCochran(c=>c+1);
                        setQuestionActive(true);
                        setFeedback(null);
                      }}
                        style={{marginLeft:12,padding:"3px 10px",borderRadius:4,border:"none",
                          background:"#e63946",color:"white",cursor:"pointer",fontSize:12}}>
                        Éliminer et recommencer →
                      </button>
                    </div>
                  ) : (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#fff8f0",border:"1px solid #e9a824",fontSize:13,color:"#e9a824",fontWeight:600}}>
                      ⚠ C₅% = {crit.p5} &lt; C = {C} &lt; C₁% = {crit.p1} → Le Labo {idxMax+1} est <strong>douteux</strong> (à isoler).
                      <button onClick={()=>{
                        const newActifs = labosActifs.filter(i=>i!==idxMax);
                        setLabosActifs(newActifs);
                        setLabosDouteuxC([...labosDouteuxC, idxMax]);
                        setIterCochran(c=>c+1);
                        setQuestionActive(true);
                        setFeedback(null);
                      }}
                        style={{marginLeft:12,padding:"3px 10px",borderRadius:4,border:"none",
                          background:"#e9a824",color:"white",cursor:"pointer",fontSize:12}}>
                        Isoler et recommencer →
                      </button>
                    </div>
                  )}

                  {/* Bouton passer à Grubbs */}
                  {(C < crit?.p5) && etape==="cochran" && (
                    <button onClick={()=>{setEtape("grubbs"); setQuestionActive(true); setFeedback(null);}}
                      style={{marginTop:10,padding:"6px 16px",borderRadius:6,border:"none",
                        background:"#2a6099",color:"white",cursor:"pointer",fontWeight:600}}>
                      Passer au test de Grubbs →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── TEST GRUBBS ── */}
        {(etape==="grubbs"||etape==="resultats") && (() => {
          const {Gmax,Gmin,ybar,sy,crit,idxMax,idxMin} = calcGrubbs(labosActifs);
          const G = Math.max(Gmax,Gmin);
          const idxSusp = Gmax >= Gmin ? idxMax : idxMin;
          const pActif = labosActifs.length;
          return (
            <div style={cardStyle}>
              <div style={{fontWeight:700,color:"#2a6099",fontSize:15,marginBottom:10}}>
                📊 Test de Grubbs — Itération {iterGrubbs+1}
              </div>

              <div style={{background:"#f0f4ff",border:"1px solid #2a609933",borderRadius:6,
                padding:"10px 14px",marginBottom:12,fontSize:13}}>
                <div style={{marginBottom:4}}>
                  ȳ = <strong>{ybar}</strong> &nbsp;|&nbsp; s(ȳ) = <strong>{sy}</strong>
                </div>
                <div style={{marginBottom:4}}>
                  G<sub>max</sub> = <strong style={{color:"#e63946"}}>{Gmax}</strong>
                  &nbsp; (Labo {idxMax+1}, ȳ = {moyennes[idxMax]})
                </div>
                <div style={{marginBottom:6}}>
                  G<sub>min</sub> = <strong style={{color:"#2a6099"}}>{Gmin}</strong>
                  &nbsp; (Labo {idxMin+1}, ȳ = {moyennes[idxMin]})
                </div>
                <div style={{fontSize:12,color:"#555"}}>
                  Valeurs critiques (p={pActif}) :
                  G₅% = <strong>{crit?.p5 ?? "N/A"}</strong> &nbsp;|&nbsp;
                  G₁% = <strong>{crit?.p1 ?? "N/A"}</strong>
                </div>
              </div>

              {/* Question pédagogique */}
              {questionActive && etape==="grubbs" && (
                <div style={{background:"#f0fff4",border:"1px solid #2a9d8f",
                  borderRadius:6,padding:"12px 14px",marginBottom:12}}>
                  <div style={{fontWeight:600,color:"#2a9d8f",marginBottom:8}}>
                    🤔 Question : Si un laboratoire devait être éliminé par le test de Grubbs, lequel serait-ce ?
                    <span style={{fontSize:11,color:"#888",marginLeft:6}}>
                      (regardez les courbes Gauss — lequel s'écarte le plus de ȳ = {ybar} ?)
                    </span>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {labosActifs.map(i=>(
                      <button key={i}
                        onClick={()=>{
                          const correct = i === idxMax;
                          setReponseUser(i);
                          setFeedback({correct,
                            msg: correct
                              ? `🎉 Bravo ! C'est bien le Labo ${i+1} qui est suspecté par le test de Grubbs — c'est celui dont la moyenne (ȳ = ${moyennes[i]}) s'écarte le plus de la moyenne des moyennes (ȳ = ${ybar}).`
                              : `❌ Pas tout à fait ! C'est en réalité le Labo ${idxSusp+1} qui est suspecté, car c'est celui dont la moyenne (ȳ = ${moyennes[idxSusp]}) s'écarte le plus de la moyenne des moyennes (ȳ = ${ybar}).`
                          });
                        }}
                        style={{padding:"4px 12px",borderRadius:5,cursor:"pointer",
                          border:`1px solid ${colors10[i]}`,
                          background:`${colors10[i]}15`, color:colors10[i], fontWeight:600}}>
                        Labo {i+1}
                      </button>
                    ))}
                  </div>
                  {feedback && (
                    <div style={{marginTop:8,padding:"8px 12px",borderRadius:5,
                      background:feedback.correct?"#f0fff4":"#fff5f5",
                      border:`1px solid ${feedback.correct?"#2a9d8f":"#e63946"}`,
                      fontSize:12,color:feedback.correct?"#2a9d8f":"#e63946"}}>
                      {feedback.msg}
                    </div>
                  )}
                  {feedback && (
                    <button onClick={()=>setQuestionActive(false)}
                      style={{marginTop:8, padding:"4px 12px", borderRadius:5,
                        border:"none", background:"#2a6099", color:"white",
                        cursor:"pointer", fontSize:12, fontWeight:600}}>
                      Voir le résultat du test →
                    </button>
                  )}
                </div>
              )}

              {/* Verdict Grubbs */}
              {(!questionActive || etape!=="grubbs") && (
                <div>
                  {!crit ? (
                    <div style={{padding:"8px 12px",borderRadius:6,background:"#f5f5f5"}}>
                      ⚠ Pas de valeur critique disponible.
                    </div>
                  ) : G < crit.p5 ? (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#f0fff4",border:"1px solid #2a9d8f",fontSize:13,color:"#2a9d8f",fontWeight:600}}>
                      ✅ G = {G} &lt; G₅% = {crit.p5} → Aucun laboratoire rejeté. Test terminé !
                    </div>
                  ) : G > crit.p1 ? (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#fff5f5",border:"1px solid #e63946",fontSize:13,color:"#e63946",fontWeight:600}}>
                      ❌ G = {G} &gt; G₁% = {crit.p1} → Le Labo {idxSusp+1} est <strong>rejeté</strong> !
                      <button onClick={()=>{
                        const newActifs = labosActifs.filter(i=>i!==idxSusp);
                        setLabosActifs(newActifs);
                        setLabosEliminésG([...labosEliminésG, idxSusp]);
                        setIterGrubbs(g=>g+1);
                        setQuestionActive(true);
                        setFeedback(null);
                      }}
                        style={{marginLeft:12,padding:"3px 10px",borderRadius:4,border:"none",
                          background:"#e63946",color:"white",cursor:"pointer",fontSize:12}}>
                        Éliminer et recommencer →
                      </button>
                    </div>
                  ) : (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#fff8f0",border:"1px solid #e9a824",fontSize:13,color:"#e9a824",fontWeight:600}}>
                      ⚠ G₅% &lt; G = {G} &lt; G₁% = {crit.p1} → Le Labo {idxSusp+1} est <strong>douteux</strong>.
                      <button onClick={()=>{
                        const newActifs = labosActifs.filter(i=>i!==idxSusp);
                        setLabosActifs(newActifs);
                        setLabosDouteuxG([...labosDouteuxG, idxSusp]);
                        setIterGrubbs(g=>g+1);
                        setQuestionActive(true);
                        setFeedback(null);
                      }}
                        style={{marginLeft:12,padding:"3px 10px",borderRadius:4,border:"none",
                          background:"#e9a824",color:"white",cursor:"pointer",fontSize:12}}>
                        Isoler et recommencer →
                      </button>
                    </div>
                  )}

                  {G < crit?.p5 && etape==="grubbs" && (
                    <button onClick={()=>setEtape("resultats")}
                      style={{marginTop:10,padding:"6px 16px",borderRadius:6,border:"none",
                        background:"#2a9d8f",color:"white",cursor:"pointer",fontWeight:600}}>
                      Calculer Sr et SR →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── RÉSULTATS FINAUX ── */}
        {etape==="resultats" && (() => {
          const {Sr, SR, SL, ybar, k} = calcResultats(labosActifs);
          return (
            <div style={cardStyle}>
              <div style={{fontWeight:700,color:"#2a9d8f",fontSize:15,marginBottom:12}}>
                ✅ Résultats finaux — {k} laboratoires retenus
              </div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {[
                  {label:"Moyenne générale ȳ", val:`${ybar} ${unite}`, color:"#333"},
                  {label:"Écart-type de répétabilité Sᵣ", val:`${Sr} ${unite}`, color:"#2a6099",
                   desc:"Variabilité intra-laboratoire"},
                  {label:"Écart-type inter-labo SL", val:`${SL} ${unite}`, color:"#e9a824",
                   desc:"Variabilité entre laboratoires"},
                  {label:"Écart-type de reproductibilité S_R", val:`${SR} ${unite}`, color:"#c0392b",
                   desc:"Variabilité globale (S²R = S²L + S²r)"},
                ].map(({label,val,color,desc})=>(
                  <div key={label} style={{flex:"1 1 200px",padding:"12px 16px",
                    borderRadius:8,border:`2px solid ${color}20`,background:`${color}08`}}>
                    <div style={{fontSize:12,color:"#888",marginBottom:4}}>{label}</div>
                    <div style={{fontSize:20,fontWeight:700,color}}>{val}</div>
                    {desc && <div style={{fontSize:11,color:"#aaa",marginTop:4}}>{desc}</div>}
                  </div>
                ))}
              </div>

              {/* Résumé labos */}
              <div style={{marginTop:12,fontSize:12,color:"#555"}}>
                {labosEliminésC.length>0 && <div>❌ Éliminés (Cochran) : {labosEliminésC.map(i=>`Labo ${i+1}`).join(", ")}</div>}
                {labosDouteuxC.length>0 && <div>⚠ Douteux (Cochran) : {labosDouteuxC.map(i=>`Labo ${i+1}`).join(", ")}</div>}
                {labosEliminésG.length>0 && <div>❌ Éliminés (Grubbs) : {labosEliminésG.map(i=>`Labo ${i+1}`).join(", ")}</div>}
                {labosDouteuxG.length>0 && <div>⚠ Douteux (Grubbs) : {labosDouteuxG.map(i=>`Labo ${i+1}`).join(", ")}</div>}
              </div>

              <button onClick={()=>{
                setDonnees(null); setEtape("config"); setMode("auto");
                setLabosActifs([]); setLabosEliminésC([]); setLabosEliminésG([]);
                setLabosDouteuxC([]); setLabosDouteuxG([]);
              }}
                style={{marginTop:12,padding:"6px 16px",borderRadius:6,border:"none",
                  background:"#c0392b",color:"white",cursor:"pointer",fontWeight:600}}>
                🔄 Nouvelle étude
              </button>
            </div>
          );
        })()}
      </>}

    </div>
  );
}

// ── Composant saisie manuelle ──
function ManualInput({p, n, cible, onValidate}) {
  const [inputMode, setInputMode] = useState("essais");
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [vals, setVals] = useState(
    Array.from({length:p}, ()=>Array(n).fill(""))
  );
  const [moys, setMoys] = useState(Array(p).fill(""));
  const [ects, setEcts] = useState(Array(p).fill(""));

  const valider = () => {
    if (inputMode==="essais") {
      const data = vals.map(col=>col.map(v=>parseFloat(v)||0));
      const m = data.map(col=>parseFloat((col.reduce((a,b)=>a+b,0)/n).toFixed(4)));
      const e = data.map((col,i)=>parseFloat(Math.sqrt(col.reduce((a,v)=>a+(v-m[i])**2,0)/(n-1)).toFixed(4)));
      onValidate(data, m, e);
    } else {
      const m = moys.map(v=>parseFloat(v)||0);
      const e = ects.map(v=>parseFloat(v)||0);
      const data = m.map((mu,i)=>Array.from({length:n},()=>parseFloat((mu+(Math.random()-0.5)*2*e[i]).toFixed(3))));
      onValidate(data, m, e);
    }
  };

  return (
    <div>
      {/* Boutons choix mode */}
      <div style={{display:"flex", gap:8, marginBottom:12, flexWrap:"wrap"}}>
        <button onClick={()=>setInputMode("essais")}
          style={{padding:"4px 12px", borderRadius:5, border:`1px solid #c0392b`,
            background:inputMode==="essais"?"#c0392b":"white",
            color:inputMode==="essais"?"white":"#c0392b", cursor:"pointer"}}>
          Saisir les essais individuels
        </button>
        <button onClick={()=>setInputMode("stats")}
          style={{padding:"4px 12px", borderRadius:5, border:`1px solid #c0392b`,
            background:inputMode==="stats"?"#c0392b":"white",
            color:inputMode==="stats"?"white":"#c0392b", cursor:"pointer"}}>
          Saisir moyenne + écart-type
        </button>
        <button onClick={()=>setInputMode("paste")}
          style={{padding:"4px 12px", borderRadius:5, border:`1px solid #c0392b`,
            background:inputMode==="paste"?"#c0392b":"white",
            color:inputMode==="paste"?"white":"#c0392b", cursor:"pointer"}}>
          📋 Coller depuis tableur
        </button>
      </div>

      {/* Saisie essais individuels */}
      {inputMode==="essais" && (
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse"}}>
            <thead>
              <tr>
                <th style={{padding:"4px 8px", border:"1px solid #ddd", background:"#f5f5f5"}}>Essai</th>
                {Array.from({length:p},(_,i)=>(
                  <th key={i} style={{padding:"4px 8px", border:"1px solid #ddd", background:"#f5f5f5"}}>
                    Labo {i+1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({length:n},(_,j)=>(
                <tr key={j}>
                  <td style={{padding:"4px 8px", border:"1px solid #ddd", fontWeight:600}}>{j+1}</td>
                  {Array.from({length:p},(_,i)=>(
                    <td key={i} style={{padding:"2px 4px", border:"1px solid #ddd"}}>
                      <input type="number" step="0.001" value={vals[i][j]}
                        onChange={e=>{
                          const nv=[...vals];
                          nv[i]=[...nv[i]]; nv[i][j]=e.target.value;
                          setVals(nv);
                        }}
                        style={{width:70, padding:"2px 4px", border:"none",
                          textAlign:"center", fontSize:12}}/>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={valider}
            style={{marginTop:12, padding:"6px 16px", borderRadius:6, border:"none",
              background:"#c0392b", color:"white", cursor:"pointer", fontWeight:600}}>
            ✅ Valider les données →
          </button>
        </div>
      )}

      {/* Saisie moyenne + écart-type */}
      {inputMode==="stats" && (
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse"}}>
            <thead>
              <tr>
                <th style={{padding:"4px 8px", border:"1px solid #ddd", background:"#f5f5f5"}}>Stat</th>
                {Array.from({length:p},(_,i)=>(
                  <th key={i} style={{padding:"4px 8px", border:"1px solid #ddd", background:"#f5f5f5"}}>
                    Labo {i+1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{padding:"4px 8px", border:"1px solid #ddd", fontWeight:700}}>ȳᵢ</td>
                {Array.from({length:p},(_,i)=>(
                  <td key={i} style={{padding:"2px 4px", border:"1px solid #ddd"}}>
                    <input type="number" step="0.001" value={moys[i]}
                      onChange={e=>{const nv=[...moys]; nv[i]=e.target.value; setMoys(nv);}}
                      style={{width:70, padding:"2px 4px", border:"none",
                        textAlign:"center", fontSize:12}}/>
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{padding:"4px 8px", border:"1px solid #ddd", fontWeight:700}}>sᵢ</td>
                {Array.from({length:p},(_,i)=>(
                  <td key={i} style={{padding:"2px 4px", border:"1px solid #ddd"}}>
                    <input type="number" step="0.0001" value={ects[i]}
                      onChange={e=>{const nv=[...ects]; nv[i]=e.target.value; setEcts(nv);}}
                      style={{width:70, padding:"2px 4px", border:"none",
                        textAlign:"center", fontSize:12}}/>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <button onClick={valider}
            style={{marginTop:12, padding:"6px 16px", borderRadius:6, border:"none",
              background:"#c0392b", color:"white", cursor:"pointer", fontWeight:600}}>
            ✅ Valider les données →
          </button>
        </div>
      )}

      {/* Coller depuis tableur */}
      {inputMode==="paste" && (
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          <div style={{fontSize:12, color:"#555", background:"#f8f8f8",
            padding:"8px 12px", borderRadius:6, border:"1px solid #ddd"}}>
            <strong>Instructions :</strong> Copiez vos données depuis Excel ou LibreOffice Calc,
            puis collez-les ci-dessous. Le tableau doit avoir <strong>{n} lignes</strong> et{" "}
            <strong>{p} colonnes</strong> (une colonne par labo, une ligne par essai). Pas d'en-têtes !
          </div>
          <textarea
            placeholder={`Collez ici vos données (${n} lignes × ${p} colonnes)`}
            value={pasteText}
            onChange={e=>{setPasteText(e.target.value); setPasteError("");}}
            style={{width:"100%", height:150, padding:"8px", fontFamily:"monospace",
              fontSize:12, borderRadius:6, border:"1px solid #ccc", boxSizing:"border-box"}}
          />
          {pasteError && (
            <div style={{color:"#e63946", fontSize:12, padding:"4px 8px",
              background:"#fff5f5", borderRadius:4, border:"1px solid #ffcccc"}}>
              ⚠ {pasteError}
            </div>
          )}
          <button onClick={()=>{
            const lignes = pasteText.trim().split("\n")
              .map(l=>l.trim().split(/\t|;/).map(v=>parseFloat(v.replace(",","."))));
            if (lignes.length !== n) {
              setPasteError(`${lignes.length} lignes trouvées, ${n} attendues.`); return;
            }
            if (lignes[0].length !== p) {
              setPasteError(`${lignes[0].length} colonnes trouvées, ${p} attendues.`); return;
            }
            if (lignes.some(l=>l.some(isNaN))) {
              setPasteError("Certaines valeurs ne sont pas des nombres."); return;
            }
            const data = Array.from({length:p},(_,i)=>
              lignes.map(ligne=>parseFloat(ligne[i].toFixed(3)))
            );
            const m = data.map(col=>parseFloat((col.reduce((a,b)=>a+b,0)/n).toFixed(4)));
            const e = data.map((col,i)=>parseFloat(Math.sqrt(col.reduce((a,v)=>a+(v-m[i])**2,0)/(n-1)).toFixed(4)));
            onValidate(data, m, e);
          }}
            style={{padding:"6px 16px", borderRadius:6, border:"none",
              background:"#c0392b", color:"white", cursor:"pointer", fontWeight:600,
              alignSelf:"flex-start"}}>
            ✅ Importer les données →
          </button>
        </div>
      )}

    </div>
  );
}

// ============================================================
// SIM 10 (1G) — Loi de Beer-Lambert (niveau 1re générale)
// SIM 11 (BTS) — Loi de Beer-Lambert avancée
// ============================================================/
// ============================================================

// ---- Données communes aux deux simulations ----

const ANALYTES_BL = {
  permanganate: {
    label: "Permanganate de potassium (KMnO₄)",
    solutionColor: "#c84ba0",
    peakNm: 525,
    curve: [[380,0.04],[390,0.05],[400,0.06],[410,0.06],[420,0.05],[430,0.07],[440,0.09],[450,0.08],[460,0.07],[470,0.09],[480,0.13],[485,0.18],[490,0.25],[495,0.35],[500,0.48],[505,0.62],[510,0.76],[515,0.88],[520,0.95],[523,0.99],[525,1.0],[527,0.99],[530,0.96],[533,0.90],[537,0.82],[540,0.70],[545,0.55],[550,0.38],[555,0.22],[560,0.13],[565,0.08],[570,0.06],[580,0.04],[600,0.03],[650,0.02],[700,0.01],[780,0.01]],
    exampleData: {
      mesurande: "C(KMnO₄)", unite: "mg/L",
      niveaux: 5, repetitions: 3,
      concentrations: [0, 2, 4, 6, 8],
      absorbances: [[0.002,0.001,0.003],[0.118,0.120,0.119],[0.241,0.238,0.240],[0.359,0.361,0.358],[0.480,0.478,0.482]],
    }
  },
  cuivre: {
    label: "Sulfate de cuivre (CuSO₄)",
    solutionColor: "#2090ee",
    peakNm: 640,
    curve: [[380,0.02],[390,0.02],[400,0.03],[410,0.03],[420,0.04],[430,0.04],[440,0.05],[450,0.06],[460,0.07],[470,0.06],[480,0.05],[490,0.05],[500,0.04],[510,0.04],[520,0.04],[530,0.04],[540,0.05],[550,0.07],[560,0.10],[570,0.14],[575,0.18],[580,0.23],[585,0.30],[590,0.40],[595,0.52],[600,0.63],[605,0.73],[610,0.82],[615,0.89],[620,0.94],[625,0.98],[630,0.99],[635,1.0],[640,0.99],[645,0.96],[650,0.90],[655,0.83],[660,0.74],[665,0.64],[670,0.54],[675,0.44],[680,0.35],[690,0.20],[700,0.12],[710,0.07],[720,0.04],[740,0.03],[760,0.02],[780,0.02]],
    exampleData: {
      mesurande: "C(CuSO₄)", unite: "g/L",
      niveaux: 5, repetitions: 3,
      concentrations: [0, 1, 2, 3, 4],
      absorbances: [[0.001,0.002,0.001],[0.095,0.097,0.096],[0.193,0.191,0.194],[0.289,0.291,0.288],[0.386,0.384,0.387]],
    }
  },
  dichromate: {
    label: "Dichromate de potassium (K₂Cr₂O₇)",
    solutionColor: "#ee7700",
    peakNm: 440,
    curve: [[380,0.18],[385,0.25],[390,0.35],[395,0.46],[400,0.57],[405,0.67],[410,0.76],[415,0.84],[420,0.91],[425,0.96],[430,0.99],[435,1.0],[440,0.99],[445,0.96],[450,0.90],[455,0.82],[460,0.72],[465,0.60],[470,0.48],[475,0.36],[480,0.25],[485,0.17],[490,0.11],[495,0.08],[500,0.06],[505,0.05],[510,0.04],[520,0.03],[540,0.02],[560,0.02],[580,0.01],[600,0.01],[650,0.01],[700,0.01],[780,0.01]],
    exampleData: {
      mesurande: "C(K₂Cr₂O₇)", unite: "mg/L",
      niveaux: 5, repetitions: 3,
      concentrations: [0, 5, 10, 15, 20],
      absorbances: [[0.003,0.002,0.004],[0.142,0.140,0.143],[0.283,0.281,0.284],[0.421,0.423,0.420],[0.562,0.560,0.563]],
    }
  },
  autre: {
    label: "Autre analyte...",
    solutionColor: "#888888",
    peakNm: 500,
    curve: null,
    exampleData: null,
  },
};

// ---- Utilitaires mathématiques ----

function linReg(xs, ys) {
  const n = xs.length;
  const sumX = xs.reduce((a,b)=>a+b,0);
  const sumY = ys.reduce((a,b)=>a+b,0);
  const sumXY = xs.reduce((s,x,i)=>s+x*ys[i],0);
  const sumX2 = xs.reduce((s,x)=>s+x*x,0);
  const slope = (n*sumXY - sumX*sumY)/(n*sumX2 - sumX*sumX);
  const intercept = (sumY - slope*sumX)/n;
  const yMean = sumY/n;
  const ssTot = ys.reduce((s,y)=>s+(y-yMean)**2,0);
  const ssRes = ys.reduce((s,y,i)=>s+(y-(slope*xs[i]+intercept))**2,0);
  const r2 = 1 - ssRes/ssTot;
  return { slope, intercept, r2, ssRes, ssTot };
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a,b)=>a+b,0)/arr.length;
  return Math.sqrt(arr.reduce((s,v)=>s+(v-m)**2,0)/(arr.length-1));
}

// Table F critique 1% (ddl1 = p-2, ddl2 = p*(n-1))
const F_TABLE_1PCT = {
  1:{5:16.258,6:13.745,7:12.246,8:11.259,9:10.561,10:10.044,12:9.33,15:8.683,16:8.531,18:8.285,20:8.096,24:7.823,25:7.77,30:7.562,40:7.314,50:7.171,60:7.077,80:6.963,100:6.895,120:6.851},
  2:{5:13.274,6:10.925,7:9.547,8:8.649,9:8.022,10:7.559,12:6.927,15:6.359,16:6.226,18:6.013,20:5.849,24:5.614,25:5.568,30:5.39,40:5.179,50:5.057,60:4.977,80:4.881,100:4.824,120:4.787},
  3:{5:12.06,6:9.78,7:8.451,8:7.591,9:6.992,10:6.552,12:5.953,15:5.417,16:5.292,18:5.092,20:4.938,24:4.718,25:4.675,30:4.51,40:4.313,50:4.199,60:4.126,80:4.036,100:3.984,120:3.949},
  4:{5:11.392,6:9.148,7:7.847,8:7.006,9:6.422,10:5.994,12:5.412,15:4.893,16:4.773,18:4.579,20:4.431,24:4.218,25:4.177,30:4.018,40:3.828,50:3.72,60:3.649,80:3.563,100:3.513,120:3.48},
  5:{5:10.967,6:8.746,7:7.46,8:6.632,9:6.057,10:5.636,12:5.064,15:4.556,16:4.437,18:4.248,20:4.103,24:3.895,25:3.855,30:3.699,40:3.514,50:3.408,60:3.339,80:3.255,100:3.206,120:3.174},
  6:{5:10.672,6:8.466,7:7.191,8:6.371,9:5.802,10:5.386,12:4.821,15:4.318,16:4.202,18:4.015,20:3.871,24:3.667,25:3.627,30:3.473,40:3.291,50:3.186,60:3.119,80:3.036,100:2.988,120:2.956},
  7:{5:10.456,6:8.26,7:6.993,8:6.178,9:5.613,10:5.2,12:4.64,15:4.142,16:4.026,18:3.841,20:3.699,24:3.496,25:3.457,30:3.304,40:3.124,50:3.02,60:2.953,80:2.871,100:2.823,120:2.792},
  8:{5:10.289,6:8.102,7:6.84,8:6.029,9:5.467,10:5.057,12:4.499,15:4.004,16:3.89,18:3.705,20:3.564,24:3.363,25:3.324,30:3.173,40:2.993,50:2.89,60:2.823,80:2.742,100:2.694,120:2.663},
  9:{5:10.158,6:7.976,7:6.719,8:5.911,9:5.351,10:4.942,12:4.388,15:3.895,16:3.78,18:3.597,20:3.457,24:3.256,25:3.217,30:3.067,40:2.888,50:2.785,60:2.718,80:2.637,100:2.59,120:2.559},
  10:{5:10.051,6:7.874,7:6.62,8:5.814,9:5.257,10:4.849,12:4.296,15:3.805,16:3.691,18:3.508,20:3.368,24:3.168,25:3.129,30:2.979,40:2.801,50:2.698,60:2.632,80:2.551,100:2.503,120:2.472},
  11:{5:9.963,6:7.79,7:6.538,8:5.734,9:5.178,10:4.772,12:4.22,15:3.73,16:3.616,18:3.434,20:3.294,24:3.094,25:3.056,30:2.906,40:2.727,50:2.625,60:2.559,80:2.478,100:2.43,120:2.399},
  12:{5:9.888,6:7.718,7:6.469,8:5.667,9:5.111,10:4.706,12:4.155,15:3.666,16:3.553,18:3.371,20:3.231,24:3.032,25:2.993,30:2.843,40:2.665,50:2.562,60:2.496,80:2.415,100:2.368,120:2.336},
  13:{5:9.825,6:7.657,7:6.41,8:5.609,9:5.055,10:4.65,12:4.1,15:3.612,16:3.498,18:3.316,20:3.177,24:2.977,25:2.939,30:2.789,40:2.611,50:2.508,60:2.442,80:2.361,100:2.313,120:2.282},
  14:{5:9.77,6:7.605,7:6.359,8:5.559,9:5.005,10:4.601,12:4.052,15:3.564,16:3.451,18:3.269,20:3.13,24:2.93,25:2.892,30:2.742,40:2.563,50:2.461,60:2.394,80:2.313,100:2.265,120:2.234},
  15:{5:9.722,6:7.559,7:6.314,8:5.515,9:4.962,10:4.558,12:4.01,15:3.522,16:3.409,18:3.227,20:3.088,24:2.889,25:2.85,30:2.7,40:2.522,50:2.419,60:2.352,80:2.271,100:2.223,120:2.192},
};

function getFCrit(ddl1, ddl2) {
  const row = F_TABLE_1PCT[Math.min(ddl1,15)];
  if (!row) return null;
  const keys = Object.keys(row).map(Number).sort((a,b)=>a-b);
  // cherche la valeur tabulée la plus proche >= ddl2
  for (const k of keys) { if (k >= ddl2) return row[k]; }
  return row[keys[keys.length-1]];
}

function nmToColor(nm) {
  if (nm < 380) return '#8800ff';
  if (nm < 450) { const t=(nm-380)/70; return `hsl(${270-t*30},100%,45%)`; }
  if (nm < 495) { const t=(nm-450)/45; return `hsl(${240-t*60},100%,50%)`; }
  if (nm < 500) { const t=(nm-495)/5;  return `hsl(${180-t*60},100%,45%)`; }
  if (nm < 570) { const t=(nm-500)/70; return `hsl(${120-t*60},100%,45%)`; }
  if (nm < 590) { const t=(nm-570)/20; return `hsl(${60-t*30},100%,50%)`; }
  if (nm < 620) { const t=(nm-590)/30; return `hsl(${30-t*30},100%,50%)`; }
  if (nm < 750) { const t=(nm-620)/130; return `hsl(0,${100-t*40}%,${50-t*15}%)`; }
  return '#5a0000';
}

function getAbsAtNm(analyteName, nm) {
  const curve = ANALYTES_BL[analyteName].curve;
  for (let i=0; i<curve.length-1; i++) {
    if (nm>=curve[i][0] && nm<=curve[i+1][0]) {
      const t=(nm-curve[i][0])/(curve[i+1][0]-curve[i][0]);
      return curve[i][1]+t*(curve[i+1][1]-curve[i][1]);
    }
  }
  return 0;
}

function SpectroSchema({ analyteName, lambdaNm, onLambdaChange, concRatio=0.5 }) {
  const a = ANALYTES_BL[analyteName];
  const absNorm = getAbsAtNm(analyteName, lambdaNm);

  // Couleur correcte : interpolation HSL calée sur le spectre visible réel
  function nmToHue(nm) {
    if (nm < 380) return { h:270, s:100, l:40 };
    if (nm < 450) { const t=(nm-380)/70; return { h:270-t*30, s:100, l:40 }; }
    if (nm < 490) { const t=(nm-450)/40; return { h:240-t*60, s:100, l:45 }; }
    if (nm < 510) { const t=(nm-490)/20; return { h:180-t*60, s:100, l:40 }; }
    if (nm < 560) { const t=(nm-510)/50; return { h:120-t*60, s:100, l:35 }; }
    if (nm < 590) { const t=(nm-560)/30; return { h:60-t*30,  s:100, l:45 }; }
    if (nm < 625) { const t=(nm-590)/35; return { h:30-t*30,  s:100, l:45 }; }
    if (nm < 780) { const t=(nm-625)/155; return { h:0, s:100, l:45-t*20 }; }
    return { h:0, s:80, l:25 };
  }
  function nmToColor(nm) {
    const {h,s,l} = nmToHue(nm);
    return `hsl(${h},${s}%,${l}%)`;
  }

  const beamColor = nmToColor(lambdaNm);
  const A = absNorm * concRatio * 1.5;
  const transOpacity = Math.max(0.05, 1 - A / 1.5);
  const solOpacity = 0.15 + concRatio * 0.75;
  const absDisplay = A.toFixed(3);

  // Courbe lissée : interpolation linéaire point par point nm par nm
  const spectrumPath = (() => {
    // Zone du tracé : x de 50 à 615 (565px pour 400nm)
    const X = nm => 50 + (nm - 380) / 400 * 565;
    const Y = v => 78 - v * 60;
    const pts = [];
    for (let nm = 380; nm <= 780; nm++) {
      pts.push([X(nm), Y(getAbsAtNm(analyteName, nm))]);
    }
    // Bézier quadratique par points milieux → courbe très lisse
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = ((pts[i][0] + pts[i+1][0]) / 2).toFixed(1);
      const my = ((pts[i][1] + pts[i+1][1]) / 2).toFixed(1);
      d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx},${my}`;
    }
    d += ` L${pts[pts.length-1][0].toFixed(1)},${pts[pts.length-1][1].toFixed(1)}`;
    return d;
  })();

  // Position curseur : même formule que X(nm) dans spectrumPath
  const cursorX = 50 + (lambdaNm - 380) / 400 * 565;
  const cursorY = 78 - absNorm * 60;

  // Gradient calé : les stops en % correspondent aux positions nm sur [380,780]
  // nm=380 → 0%, nm=450 → 17.5%, nm=490 → 27.5%, nm=510 → 32.5%,
  // nm=560 → 45%, nm=590 → 52.5%, nm=625 → 61.25%, nm=780 → 100%
  const gradientStops = [
    { pct: '0%',     color: 'hsl(270,100%,40%)' },  // 380nm violet
    { pct: '17.5%',  color: 'hsl(240,100%,45%)' },  // 450nm bleu
    { pct: '27.5%',  color: 'hsl(180,100%,40%)' },  // 490nm cyan
    { pct: '32.5%',  color: 'hsl(120,100%,35%)' },  // 510nm vert
    { pct: '45%',    color: 'hsl(60,100%,45%)'  },  // 560nm jaune-vert
    { pct: '52.5%',  color: 'hsl(30,100%,45%)'  },  // 590nm orange
    { pct: '61.25%', color: 'hsl(0,100%,45%)'   },  // 625nm rouge
    { pct: '100%',   color: 'hsl(0,80%,25%)'    },  // 780nm rouge sombre
  ];

  function handleSpectrumClick(e) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) / rect.width * 680;
    const nm = Math.round(Math.max(380, Math.min(780, 380 + (svgX - 50) / 565 * 400)));
    onLambdaChange(nm);
  }

  const uid = analyteName;

  return (
    <div>
      {/* ── Schéma spectrophotomètre ── */}
      <svg width="100%" viewBox="0 0 680 220">
        <defs>
          <linearGradient id={`sol-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={a.solutionColor} stopOpacity={solOpacity*0.5}/>
            <stop offset="100%" stopColor={a.solutionColor} stopOpacity={solOpacity}/>
          </linearGradient>
          <linearGradient id={`beam-cuve-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={beamColor} stopOpacity="0.9"/>
            <stop offset="100%" stopColor={beamColor} stopOpacity={transOpacity}/>
          </linearGradient>
        </defs>

        {/* SOURCE */}
        <rect x="10" y="85" width="65" height="48" rx="7" fill="#555" stroke="#333" strokeWidth="1"/>
        <ellipse cx="75" cy="109" rx="10" ry="10" fill="#ffeeaa" stroke="#aaa" strokeWidth="0.5"/>
        <ellipse cx="75" cy="109" rx="5"  ry="5"  fill="#ffe066"/>
        <text x="42" y="148" textAnchor="middle" fill="#888" fontSize="13">Source</text>

        {/* PRISME */}
        <polygon points="98,90 132,74 132,144 98,128" fill="#d0e8ff" stroke="#7ab" strokeWidth="1"/>
        {[['#8800ff',82],['#4488ff',92],['#00bb44',103],['#aacc00',113],['#ee8800',124],['#ee2200',134]].map(([c,y],i)=>(
          <line key={i} x1="132" y1={y} x2="144" y2={y} stroke={c} strokeWidth={i===2?3:1.5}/>
        ))}
        <text x="115" y="160" textAnchor="middle" fill="#888" fontSize="12">Monochromateur</text>

        {/* Faisceau blanc source→prisme */}
        <rect x="75" y="106" width="23" height="7" rx="3" fill="white" opacity="0.5"/>

        {/* Faisceau incident prisme→cuve */}
        <rect x="144" y="106" width="78" height="7" rx="3" fill={beamColor} opacity="0.9"/>

        {/* CUVE ouverte (parois fines) */}
        <rect x="222" y="65"  width="3" height="125" fill="#666"/>  {/* paroi gauche */}
        <rect x="365" y="65"  width="3" height="125" fill="#666"/>  {/* paroi droite */}
        <rect x="222" y="188" width="146" height="3" fill="#666"/>  {/* fond */}
        {/* Liquide */}
        <rect x="225" y="88"  width="140" height="100" fill={`url(#sol-${uid})`}/>
        {/* Faisceau dans la cuve avec dégradé */}
        <rect x="225" y="106" width="140" height="7" fill={`url(#beam-cuve-${uid})`}/>
        <text x="294" y="207" textAnchor="middle" fill="#888" fontSize="13">Cuve</text>

        {/* Faisceau transmis */}
        <rect x="368" y="106" width="85" height="7" rx="3" fill={beamColor} opacity={transOpacity}/>

        {/* DÉTECTEUR */}
        <rect x="453" y="88" width="76" height="58" rx="8" fill="#2a6" stroke="#185" strokeWidth="1"/>
        <ellipse cx="453" cy="109" rx="8" ry="8" fill="#55ff88" stroke="#2a6" strokeWidth="0.5"/>
        <rect x="482" y="96" width="38" height="44" rx="4" fill="#1a4" stroke="#0f3" strokeWidth="0.5"/>
        <text x="501" y="118" textAnchor="middle" fill="#ccffcc" fontSize="15" fontWeight="bold">{absDisplay}</text>
        <text x="501" y="132" textAnchor="middle" fill="#88dd99" fontSize="12">Absorbance</text>
        <text x="491" y="162" textAnchor="middle" fill="#888" fontSize="13">Détecteur</text>

        {/* FORMULE */}
        <rect x="538" y="86" width="130" height="62" rx="6" fill="#f0f4f8" stroke="#ccc" strokeWidth="0.5"/>
        <text x="603" y="106" textAnchor="middle" fill="#222" fontSize="12" fontWeight="bold">Beer-Lambert</text>
        <text x="603" y="124" textAnchor="middle" fill="#222" fontSize="13">A = log(I₀ / I)</text>
        <text x="603" y="141" textAnchor="middle" fill="#222" fontSize="13">A = ε · l · C</text>

        {/* Labels I₀ et I */}
        <text x="188" y="102" textAnchor="middle" fill="#444" fontSize="15" fontWeight="bold">I₀</text>
        <text x="408" y="102" textAnchor="middle" fill="#444" fontSize="15" fontWeight="bold">I</text>
      </svg>

      {/* ── Spectre UV-visible ── */}
      <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:4}}>
        Spectre d'absorption — cliquer pour choisir λ de travail
      </div>
      <svg width="100%" viewBox="0 0 680 115"
        onClick={handleSpectrumClick} style={{cursor:'crosshair'}}>
        <defs>
          <linearGradient id={`spec-${uid}`} x1="0" y1="0" x2="1" y2="0">
            {gradientStops.map(({pct,color}) => (
              <stop key={pct} offset={pct} stopColor={color}/>
            ))}
          </linearGradient>
        </defs>

        {/* Axes */}
        <line x1="50" y1="85" x2="615" y2="85" stroke="#aaa" strokeWidth="0.8"/>
        <line x1="50" y1="10" x2="50"  y2="85" stroke="#aaa" strokeWidth="0.8"/>

        {/* Labels */}
        <text x="50"  y="102" textAnchor="middle" fill="#666" fontSize="13">380</text>
        <text x="332" y="112" textAnchor="middle" fill="#666" fontSize="13">λ (nm)</text>
        <text x="615" y="102" textAnchor="middle" fill="#666" fontSize="13">780</text>
        <text x="30"  y="50"  textAnchor="middle" fill="#666" fontSize="14" fontWeight="bold">A</text>

        {/* Bande couleur — même zone x=50..615 que la courbe */}
        <rect x="50" y="74" width="565" height="11" fill={`url(#spec-${uid})`} rx="2"/>

        {/* Courbe d'absorption lissée */}
        <path d={spectrumPath} fill="none" stroke="#333" strokeWidth="2"/>

        {/* Curseur λ */}
        <line x1={cursorX} y1="8" x2={cursorX} y2="85"
          stroke={beamColor} strokeWidth="2" strokeDasharray="5 3"/>
        <circle cx={cursorX} cy={cursorY} r="5" fill={beamColor} stroke="white" strokeWidth="1"/>
        <text
          x={Math.min(Math.max(cursorX, 65), 600)} y="20"
          textAnchor="middle" fill={beamColor} fontSize="13" fontWeight="bold">
          {lambdaNm} nm
        </text>
      </svg>
    </div>
  );
}


// ---- Composant étalonnage (commun 1G et BTS) ----
function CalibrationPlot({ plotlyReady, xs, ys, xsScale, ysScale, mesurande, unite, grandeurLabel, aechValue, onAechChange, showResiduals=false, nLevels=null, maxLevels=null, onNLevels=null, lambdaNm, peakNm, calibClassName, residClassName }) {
  const divId = 'calib-'+Math.random().toString(36).slice(2);
  const residId = 'resid-'+divId;
  const plotRef = useRef(null);
  const residRef = useRef(null);

  const reg = xs.length >= 2 ? linReg(xs, ys) : null;

  // Calcul Cech
  let Cech = null;
  if (reg && aechValue !== '' && !isNaN(parseFloat(aechValue))) {
    const A = parseFloat(aechValue);
    Cech = reg.slope !== 0 ? (A - reg.intercept) / reg.slope : null;
  }

  useEffect(() => {
    if (!plotlyReady || !reg || xs.length < 2) return;
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const xLine = [xMin, xMax + (xMax-xMin)*0.05];
    const yLine = xLine.map(x => reg.slope*x + reg.intercept);

    const traces = [
      { x: xs, y: ys, mode:'markers', type:'scatter', name:'Étalons',
        marker:{color:'#3b82f6', size:7, symbol:'circle'} },
      { x: xLine, y: yLine, mode:'lines', type:'scatter', name:'Régression',
        line:{color:'#dc2626', width:2},
        hoverinfo:'skip' },
    ];

    // Segments pointillés Aech → Cech
    if (Cech !== null && Cech >= 0) {
      const A = parseFloat(aechValue);
      traces.push({ x:[xMin,Cech], y:[A,A], mode:'lines', name:'A = Aéch',
        line:{color:'#16a34a', width:1.5, dash:'dot'}, hoverinfo:'skip' });
      traces.push({ x:[Cech,Cech], y:[0, A], mode:'lines', name:`${mesurande} éch`,
        line:{color:'#d97706', width:1.5, dash:'dot'}, hoverinfo:'skip' });
      traces.push({ x:[Cech], y:[A], mode:'markers', showlegend:false,
        marker:{color:'#16a34a', size:10, symbol:'circle'} });
    }

    // Échelle Y fixée sur les valeurs max (pic) pour que l'axe ne bouge pas quand λ change
      const yMax = ysScale && ysScale.length > 0 ? Math.max(...ysScale) * 1.15 : undefined;
      const xMaxScale = xsScale && xsScale.length > 0 ? Math.max(...xsScale) * 1.05 : undefined;
      const yMaxScale = ysScale && ysScale.length > 0 ? Math.max(...ysScale) * 1.15 : undefined;  
      const layout = {
        xaxis:{title:`${mesurande} (${unite})`, gridcolor:'rgba(128,128,128,0.15)', zeroline:false, range: xMaxScale ? [0, xMaxScale] : undefined},
        yaxis:{title: grandeurLabel || 'Absorbance', gridcolor:'rgba(128,128,128,0.15)', zeroline:false, range: yMaxScale ? [0, yMaxScale] : undefined},
      paper_bgcolor:'transparent', plot_bgcolor:'transparent',
      margin:{t:20,r:20,b:50,l:60},
      legend:{x:0,y:1,bgcolor:'transparent'},
      font:{size:12},
      showlegend:true,
    };

    Plotly.react(plotRef.current, traces, layout, {responsive:true, displayModeBar:false});
  }, [plotlyReady, xs, ys, reg, Cech, aechValue, mesurande, unite]);

  // Résidus (BTS uniquement)
  useEffect(() => {
    if (!showResiduals || !plotlyReady || !reg || xs.length < 2 || !residRef.current) return;
    const residuals = ys.map((y,i) => y - (reg.slope*xs[i]+reg.intercept));
    Plotly.react(residRef.current, [
      { x:xs, y:residuals, mode:'markers', type:'scatter', name:'Résidus',
        marker:{color:'#7c3aed', size:7} },
      { x:[Math.min(...xs), Math.max(...xs)], y:[0,0], mode:'lines',
        line:{color:'#555', width:1, dash:'dash'}, hoverinfo:'skip', showlegend:false }
    ], {
      xaxis:{title:`${mesurande} (${unite})`, gridcolor:'rgba(128,128,128,0.15)'},
      yaxis:{title:'Résidu (Aexp − Acalc)', gridcolor:'rgba(128,128,128,0.15)', zeroline:false},
      paper_bgcolor:'transparent', plot_bgcolor:'transparent',
      margin:{t:20,r:20,b:50,l:60},
      legend:{bgcolor:'transparent'}, font:{size:12},
    }, {responsive:true, displayModeBar:false});
  }, [showResiduals, plotlyReady, xs, ys, reg]);

  if (!reg) return <p style={{color:'var(--color-text-secondary)',padding:'1rem'}}>Données insuffisantes pour tracer la courbe.</p>;

  return (
    <div>
      {showResiduals && onNLevels && (
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8,flexWrap:'wrap'}}>
          <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>Niveaux inclus :</span>
          <input type="range" min={2} max={maxLevels} value={nLevels}
            onChange={e=>onNLevels(Number(e.target.value))} style={{width:160}}/>
          <span style={{fontSize:13,fontWeight:'500'}}>{nLevels} / {maxLevels}</span>
        </div>
      )}
      <div ref={plotRef} className={calibClassName||''} style={{width:'100%',height:320}}/>
      {showResiduals && (
        <>
          <div style={{fontSize:12,color:'var(--color-text-secondary)',margin:'8px 0 4px'}}>Graphique des résidus</div>
          <div ref={residRef} className={residClassName||''} style={{width:'100%',height:220}}/>
        </>
      )}
      {/* Lecture Cech */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10,flexWrap:'wrap'}}>
        <label style={{fontSize:13,color:'var(--color-text-secondary)'}}>Absorbance de l'échantillon :</label>
        <Field label="" value={aechValue} onChange={onAechChange} width={90} type="number" step="0.001" min="0"/>
        {Cech !== null && Cech >= 0 && (
          <span style={{fontSize:15,fontWeight:'500',color:'#16a34a'}}>
            → {mesurande} = <strong>{Cech.toFixed(4)}</strong> {unite}
          </span>
        )}
        {Cech !== null && Cech < 0 && (
          <span style={{fontSize:13,color:'#dc2626'}}>⚠ Valeur hors domaine d'étalonnage</span>
        )}
      </div>
    </div>
  );
}

// ====================================================
// SIM 10 — BEER-LAMBERT 1G
// ====================================================
function BeerLambert1G({ plotlyReady }) {
  const [analyte, setAnalyte] = useState('permanganate');
  const [lambdaNm, setLambdaNm] = useState(525);
  const [tab, setTab] = useState(null); // null = rien affiché
  const [nNiveaux, setNNiveaux] = useState(5);
  const [nRep, setNRep] = useState(1);
  const [mesurande, setMesurande] = useState('C');
  const [unite, setUnite] = useState('mg/L');
  const [manualData, setManualData] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [aech, setAech] = useState('');

  const [customNom, setCustomNom] = useState('');
  const [customLambda, setCustomLambda] = useState(500);
  const a = ANALYTES_BL[analyte];
  useEffect(() => {
    if (analyte !== 'autre') setLambdaNm(a.peakNm);
    else setLambdaNm(customLambda);
    setTab(null);
  }, [analyte]);

  // Sensibilité au λ choisi
  const sensibilite = getAbsAtNm(analyte, lambdaNm);
  const sensibiliteMax = getAbsAtNm(analyte, a.peakNm);
  const facteurLambda = sensibiliteMax > 0 ? sensibilite / sensibiliteMax : 0;
  const pct = Math.round(facteurLambda * 100);
  const sensColor = pct > 70 ? '#16a34a' : pct > 35 ? '#d97706' : '#dc2626';

  // Données selon onglet, absorbances ajustées par facteurLambda pour l'exemple
  let xs = [], ys = [], mesLabel = mesurande, uniteLabel = unite;
  // Échelle fixe = valeurs à la sensibilité MAX (pour garder les axes stables)
  let xsMax = [], ysMax = [];

  if (tab === 'exemple') {
    const ex = a.exampleData;
    mesLabel = ex.mesurande; uniteLabel = ex.unite;
    ex.concentrations.forEach((c,i) =>
      ex.absorbances[i].forEach(v => {
        xs.push(c); ys.push(v * facteurLambda);
        xsMax.push(c); ysMax.push(v); // valeurs au pic pour fixer l'échelle
      })
    );
  } else if (tab === 'manuel' && manualData) {
    manualData.concentrations.forEach((c,i) =>
      manualData.absorbances[i].forEach(v => { xs.push(c); ys.push(v); xsMax.push(c); ysMax.push(v); })
    );
  } else if (tab === 'tableur') {
    pasteText.trim().split('\n').forEach(line => {
      const raw = line.trim().split(/\t|;/); // séparateur tab ou ; uniquement (pas virgule car décimale FR)
      const first = parseFloat(raw[0].replace(',','.'));
      if (isNaN(first)) return;
      raw.slice(1).forEach(s => {
        const v = parseFloat(s.replace(',','.'));
        if (!isNaN(v)) { xs.push(first); ys.push(v); xsMax.push(first); ysMax.push(v); }
      });
    });
  }

  const reg = xs.length >= 2 ? linReg(xs, ys) : null;
  const regMax = xsMax.length >= 2 ? linReg(xsMax, ysMax) : null;

  let blankVals = [];
  if (tab === 'exemple') blankVals = a.exampleData.absorbances[0].map(v => v * facteurLambda);
  else if (tab === 'manuel' && manualData) blankVals = manualData.absorbances[0];
  const stdBlank = stdDev(blankVals);
  const LD = reg && reg.slope ? 3*stdBlank/reg.slope : null;
  const LQ = reg && reg.slope ? 10*stdBlank/reg.slope : null;

  function initManualGrid() {
    setManualData({
      concentrations: Array(nNiveaux).fill(0),
      absorbances: Array(nNiveaux).fill(null).map(()=>Array(nRep).fill(0)),
    });
  }
  function updateManualConc(i, val) {
    setManualData(d => { const c=[...d.concentrations]; c[i]=parseFloat(val)||0; return {...d,concentrations:c}; });
  }
  function updateManualAbs(i, j, val) {
    setManualData(d => { const ab=d.absorbances.map(r=>[...r]); ab[i][j]=parseFloat(val)||0; return {...d,absorbances:ab}; });
  }

  return (
    <div style={cardStyle}>
      <h2 style={{marginTop:0,fontSize:18,color:'var(--color-text-primary)'}}>Loi de Beer-Lambert — Niveau 1<sup>re</sup> générale</h2>

      {/* Choix analyte */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
        <label style={{fontSize:13,color:'var(--color-text-secondary)'}}>Analyte :</label>
        <select value={analyte} onChange={e=>setAnalyte(e.target.value)} style={{fontSize:13}}>
          {Object.entries(ANALYTES_BL).map(([k,v])=>(<option key={k} value={k}>{v.label}</option>))}
        </select>
      </div>
      {analyte === 'autre' && (
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12,alignItems:'flex-end',
          padding:'10px 14px',background:'var(--color-background-secondary)',borderRadius:8}}>
          <Field label="Nom de l'analyte" value={customNom} onChange={setCustomNom} width={160}/>
          <div>
            <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>λ max (nm)</div>
            <input type="number" value={customLambda} min={380} max={780}
              onChange={e=>{const v=Number(e.target.value); setCustomLambda(v); setLambdaNm(v);}}
              style={{width:80,fontSize:13,padding:'4px 6px'}}/>
          </div>
          <div style={{fontSize:12,color:'var(--color-text-secondary)'}}>
            Saisissez vos données via "Saisie manuelle" ou "Copier-coller tableur".
          </div>
        </div>
      )}

      {/* Schéma spectro — masqué pour "autre" */}
      {analyte !== 'autre' && (
        <SpectroSchema analyteName={analyte} lambdaNm={lambdaNm} onLambdaChange={setLambdaNm}/>
      )}
      {analyte === 'autre' && (
        <div style={{padding:'10px 14px',fontSize:13,color:'var(--color-text-secondary)',
          background:'var(--color-background-secondary)',borderRadius:8,marginBottom:8}}>
          λ de travail sélectionné : <strong>{customLambda} nm</strong>
          {' — '}couleur du faisceau :{' '}
          <span style={{display:'inline-block',width:18,height:10,borderRadius:3,
            background:nmToColor(customLambda),verticalAlign:'middle'}}/>
        </div>
      )}

      {/* Barre de sensibilité */}
      <div style={{display:'flex',alignItems:'center',gap:10,margin:'8px 0 4px',flexWrap:'wrap'}}>
        <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>Sensibilité à {lambdaNm} nm :</span>
        <div style={{flex:1,maxWidth:200,height:10,background:'var(--color-background-secondary)',borderRadius:5,overflow:'hidden'}}>
          <div style={{width:`${pct}%`,height:'100%',background:sensColor,borderRadius:5,transition:'width 0.3s,background 0.3s'}}/>
        </div>
        <span style={{fontSize:13,fontWeight:'500',color:sensColor}}>{pct}%</span>
        {pct < 50 && <span style={{fontSize:12,color:'#d97706'}}>⚠ Sensibilité faible</span>}
      </div>

      <hr style={{margin:'16px 0',borderColor:'var(--color-border-tertiary)'}}/>

      {/* Titre section courbe étalonnage + onglets */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:15,fontWeight:'500',marginBottom:10,color:'var(--color-text-primary)'}}>
          Courbe d'étalonnage
        </div>
        <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:10}}>
          Choisissez une source de données pour afficher la courbe :
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {[['exemple','Exemple'],['manuel','Saisie manuelle'],['tableur','Copier-coller tableur']].map(([k,l])=>(
            <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>
          ))}
        </div>
      </div>

      {/* Contenu onglet exemple */}
      {tab==='exemple' && (
        <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:8}}>
          Étalonnage {a.exampleData.mesurande} — {a.exampleData.niveaux} niveaux × {a.exampleData.repetitions} répétitions.{' '}
          <span style={{color:sensColor,fontWeight:'500'}}>
            Absorbances simulées à {lambdaNm} nm ({pct}% du max à {a.peakNm} nm).
          </span>
        </div>
      )}

      {/* Contenu onglet saisie manuelle */}
      {tab==='manuel' && (
        <div style={{marginBottom:12}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10,alignItems:'flex-end'}}>
            <CoeffInput label="Nb solutions étalons (blanc compris)" value={nNiveaux} onChange={v=>setNNiveaux(Math.max(2,Math.min(15,v)))} min={2} max={15}/>
            <CoeffInput label="Nb essais par solution étalon" value={nRep} onChange={v=>setNRep(Math.max(1,Math.min(10,v)))} min={1} max={10}/>
            <Field label="Mesurande" value={mesurande} onChange={setMesurande} width={120} type="text"/>
            <Field label="Unité" value={unite} onChange={setUnite} width={80} type="text"/>
            <button onClick={initManualGrid} style={{padding:'4px 12px',fontSize:13}}>Créer le tableau</button>
          </div>
          {manualData && (
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr>
                    <th style={{padding:'4px 8px',borderBottom:'1px solid var(--color-border-tertiary)'}}>{mesurande} ({unite})</th>
                    {Array(nRep).fill(0).map((_,j)=>(
                      <th key={j} style={{padding:'4px 8px',borderBottom:'1px solid var(--color-border-tertiary)'}}>A{j+1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {manualData.concentrations.map((c,i)=>(
                    <tr key={i}>
                      <td style={{padding:'2px 4px'}}>
                        <input type="number" value={c} onChange={e=>updateManualConc(i,e.target.value)}
                          style={{width:70,fontSize:12,padding:'2px 4px'}}/>
                      </td>
                      {Array(nRep).fill(0).map((_,j)=>(
                        <td key={j} style={{padding:'2px 4px'}}>
                          <input type="number" value={manualData.absorbances[i][j]}
                            onChange={e=>updateManualAbs(i,j,e.target.value)}
                            style={{width:70,fontSize:12,padding:'2px 4px'}} step="0.001"/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contenu onglet tableur */}
      {tab==='tableur' && (
        <div style={{marginBottom:12}}>
          <p style={{fontSize:13,color:'var(--color-text-secondary)',marginTop:0}}>
            Collez vos données depuis un tableur (séparateur : tabulation, ; ou ,) :<br/>
            <code style={{fontSize:11}}>C{'\t'}A1{'\t'}A2{'\t'}A3</code>
          </p>
          <div style={{display:'flex',gap:10,marginBottom:8,flexWrap:'wrap'}}>
            <Field label="Mesurande" value={mesurande} onChange={setMesurande} width={120} type="text"/>
            <Field label="Unité" value={unite} onChange={setUnite} width={80} type="text"/>
          </div>
          <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
            placeholder={"C\tA1\tA2\tA3\n0\t0.002\t0.001\t0.003\n2\t0.118\t0.120\t0.119"}
            style={{width:'100%',height:120,fontSize:12,fontFamily:'monospace',
              padding:8,boxSizing:'border-box',border:'1px solid var(--color-border-tertiary)',
              borderRadius:6,background:'var(--color-background-primary)',color:'var(--color-text-primary)'}}/>
        </div>
      )}

      {/* Statistiques + courbe — visibles dès qu'un onglet est sélectionné */}
      {tab && reg && (
        <>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'12px 0'}}>
            {[
              ['Pente a', `${reg.slope.toFixed(4)} ${uniteLabel}⁻¹`],
              ['Ordonnée b', reg.intercept.toFixed(4)],
              ['R²', reg.r2.toFixed(5)],
              
            ].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{background:'var(--color-background-secondary)',borderRadius:8,padding:'8px 14px',minWidth:110}}>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{l}</div>
                <div style={{fontSize:15,fontWeight:'500'}}>{v}</div>
              </div>
            ))}
          </div>

          <CalibrationPlot
            plotlyReady={plotlyReady}
            xs={xs} ys={ys}
            xsScale={xsMax} ysScale={ysMax}
            mesurande={mesLabel} unite={uniteLabel}
            aechValue={aech} onAechChange={setAech}
            lambdaNm={lambdaNm} peakNm={a.peakNm}/>
        </>
      )}

      {tab && !reg && xs.length < 2 && (
        <p style={{fontSize:13,color:'var(--color-text-secondary)'}}>
          Saisissez au moins 2 niveaux de concentration pour afficher la courbe.
        </p>
      )}
    </div>
  );
}

// ====================================================
// SIM 11 — BEER-LAMBERT BTS
// ====================================================

function BeerLambertBTS({ plotlyReady }) {
  const [methode, setMethode] = useState('beerlambert');
  const [analyte, setAnalyte] = useState('permanganate');
  const [lambdaNm, setLambdaNm] = useState(525);
  const [tab, setTab] = useState(null);
  const [nNiveaux, setNNiveaux] = useState(5);
  const [nRep, setNRep] = useState(3);
  const [mesurande, setMesurande] = useState('C');
  const [unite, setUnite] = useState('mg/L');
  const [grandeur, setGrandeur] = useState('Absorbance');
  const [manualData, setManualData] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [aech, setAech] = useState('');
  const [nLevelsIncluded, setNLevelsIncluded] = useState(11);
  const [customNom, setCustomNom] = useState('');
  const [customLambda, setCustomLambda] = useState(500);
  const [showFormules, setShowFormules] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef(null);

  const a = analyte !== 'autre' ? ANALYTES_BL[analyte] : null;

  useEffect(() => {
    if (methode === 'beerlambert' && analyte !== 'autre') setLambdaNm(a.peakNm);
    setTab(methode === 'autre' ? 'exemple' : null);
  }, [methode, analyte]);

  const sensibilite = (methode === 'beerlambert' && analyte !== 'autre') ? getAbsAtNm(analyte, lambdaNm) : 1;
  const sensibiliteMax = (methode === 'beerlambert' && analyte !== 'autre') ? getAbsAtNm(analyte, a.peakNm) : 1;
  const facteurLambda = sensibiliteMax > 0 ? sensibilite / sensibiliteMax : 1;
  const pct = Math.round(facteurLambda * 100);
  const sensColor = pct > 70 ? '#16a34a' : pct > 35 ? '#d97706' : '#dc2626';

  const exBL = {
    mesurande: 'C(KMnO₄)', unite: 'mg/L', grandeur: 'Absorbance',
    niveaux: 5, repetitions: 5,
    concentrations: [0, 2, 4, 6, 8],
    absorbances: [
      [0.002, 0.001, 0.003, 0.002, 0.001],
      [0.118, 0.120, 0.119, 0.121, 0.117],
      [0.241, 0.238, 0.240, 0.239, 0.242],
      [0.359, 0.361, 0.358, 0.360, 0.362],
      [0.480, 0.478, 0.482, 0.479, 0.481],
    ]
  };

  const exAutre = {
    mesurande: 'C(K⁺)', unite: 'mg/L', grandeur: 'Intensité I',
    niveaux: 11, repetitions: 3,
    concentrations: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    absorbances: [
      [0,-2,1],[20,21,19],[38,41,40],[59,62,57],[78,81,80],
      [98,99,99],[114,115,117],[131,133,132],[149,147,148],[166,165,164],[180,181,182],
    ]
  };

  const exCourant = methode === 'beerlambert' ? exBL : exAutre;

  let allLevels = [];
  if (tab === 'exemple') {
    allLevels = exCourant.concentrations.map((c,i) => ({
      c,
      abs: methode === 'beerlambert'
        ? exCourant.absorbances[i].map(v => v * facteurLambda)
        : exCourant.absorbances[i]
    }));
  } else if (tab === 'manuel' && manualData) {
    allLevels = manualData.concentrations.map((c,i) => ({c, abs: manualData.absorbances[i]}));
  } else if (tab === 'tableur') {
    pasteText.trim().split('\n').forEach(line => {
      const raw = line.trim().split(/\t|;/);
      const first = parseFloat(raw[0].replace(',','.'));
      if (isNaN(first)) return;
      const abs = raw.slice(1).map(s => parseFloat(s.replace(',','.'))).filter(v => !isNaN(v));
      if (abs.length > 0) allLevels.push({c: first, abs});
    });
  }

  const maxLevels = allLevels.length;
  useEffect(() => { if (maxLevels > 0) setNLevelsIncluded(maxLevels); }, [maxLevels]);
  const included = allLevels.slice(0, Math.min(nLevelsIncluded, maxLevels));

  let xs = [], ys = [], xsMax = [], ysMax = [];
  included.forEach(({c,abs}) => abs.forEach(v => { xs.push(c); ys.push(v); }));
  if (tab === 'exemple' && methode === 'beerlambert') {
    exBL.concentrations.forEach((c,i) =>
      exBL.absorbances[i].forEach(v => { xsMax.push(c); ysMax.push(v); })
    );
  } else {
    allLevels.forEach(({c,abs}) => abs.forEach(v => { xsMax.push(c); ysMax.push(v); }));
  }

  const reg = xs.length >= 2 ? linReg(xs, ys) : null;
  const mesLabel = tab === 'exemple' ? exCourant.mesurande : mesurande;
  const uniteLabel = tab === 'exemple' ? exCourant.unite : unite;
  const grandeurLabel = tab === 'exemple' ? exCourant.grandeur : grandeur;

  let sB = null, LD = null, LQ = null;
  if (reg && xs.length >= 3) {
    const n = xs.length;
    const xMean = xs.reduce((s,v)=>s+v,0)/n;
    const Sxx = xs.reduce((s,v)=>s+(v-xMean)**2,0);
    const ssRes = ys.reduce((s,y,i)=>s+(y-(reg.slope*xs[i]+reg.intercept))**2,0);
    const s2 = ssRes/(n-2);
    sB = Math.sqrt(s2*(1/n + xMean**2/Sxx));
    LD = reg.slope !== 0 ? 3*sB/reg.slope : null;
    LQ = reg.slope !== 0 ? 10*sB/reg.slope : null;
  }

  const nRepMin = included.length > 0 ? Math.min(...included.map(l=>l.abs.length)) : 0;
  const canFisher = included.length >= 3 && nRepMin >= 2;
  let fisherResult = null;
  if (canFisher && reg) {
    const p = included.length;
    const n = nRepMin;
    const means = included.map(({abs}) => abs.slice(0,n).reduce((s,v)=>s+v,0)/n);
    const yCalc = included.map(({c}) => reg.slope*c+reg.intercept);
    const SCE_nl = n * means.reduce((s,m,j)=>s+(m-yCalc[j])**2,0);
    const SCE_r = included.reduce((s,{abs},j)=>
      s+abs.slice(0,n).reduce((ss,v)=>ss+(v-means[j])**2,0),0);
    const ddl_nl = p-2, ddl_r = p*(n-1);
    const Fexp = ddl_nl>0 && SCE_r>0 ? (SCE_nl/ddl_nl)/(SCE_r/ddl_r) : null;
    const Fcrit = ddl_nl>0 ? getFCrit(ddl_nl, ddl_r) : null;
    fisherResult = {
      p, n, ddl_nl, ddl_r,
      SCE_nl: SCE_nl.toFixed(5), SCE_r: SCE_r.toFixed(5),
      varNl: ddl_nl>0 ? (SCE_nl/ddl_nl).toFixed(5) : '—',
      varR:  ddl_r>0  ? (SCE_r/ddl_r).toFixed(5)  : '—',
      Fexp: Fexp!==null ? Fexp.toFixed(4) : null,
      Fcrit,
      linearite: Fexp!==null && Fcrit!==null ? Fexp<Fcrit : null
    };
  }

  function initManualGrid() {
    setManualData({
      concentrations: Array(nNiveaux).fill(0),
      absorbances: Array(nNiveaux).fill(null).map(()=>Array(nRep).fill(0)),
    });
  }
  function updateManualConc(i,val) {
    setManualData(d=>{const c=[...d.concentrations];c[i]=parseFloat(val)||0;return{...d,concentrations:c};});
  }
  function updateManualAbs(i,j,val) {
    setManualData(d=>{const ab=d.absorbances.map(r=>[...r]);ab[i][j]=parseFloat(val)||0;return{...d,absorbances:ab};});
  }

  // ── Export PDF ──
   async function exportPDF() {
    if (!reg || !window.html2canvas || !window.jspdf) {
      alert('Librairies PDF non disponibles. Verifiez les scripts dans index.html.');
      return;
    }
    setPdfLoading(true);
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, margin = 15, contentW = W - 2 * margin;
      let y = 0;

      // Palette
      const TEAL   = [42, 157, 143];
      const PURPLE = [106, 76, 147];
      const DARK   = [30, 30, 40];
      const GREY   = [120, 120, 130];
      const WHITE  = [255, 255, 255];
      const TEAL_L = [232, 248, 245];
      const PURP_L = [243, 238, 255];
      const GREEN  = [21, 128, 61];
      const GREEN_L= [240, 253, 244];
      const RED    = [180, 30, 30];
      const RED_L  = [254, 242, 242];

      // ── Nettoyage caractères spéciaux ──
      const cleanTxt = (s) => String(s)
        .replace(/λ/g,'lambda').replace(/₄/g,'4').replace(/₂/g,'2')
        .replace(/₃/g,'3').replace(/⁺/g,'+').replace(/⁻/g,'-')
        .replace(/→/g,'->').replace(/✓/g,'OK').replace(/✗/g,'NON')
        .replace(/—/g,'-').replace(/≥/g,'>=').replace(/≤/g,'<=')
        .replace(/[^\x00-\x7F]/g, c => {
          const map = {
            'é':'e','è':'e','ê':'e','ë':'e',
            'à':'a','â':'a','ä':'a','ã':'a',
            'ô':'o','ö':'o','ò':'o','ó':'o',
            'î':'i','ï':'i','ì':'i','í':'i',
            'ù':'u','û':'u','ü':'u','ú':'u',
            'ç':'c','ñ':'n',
            'É':'E','È':'E','Ê':'E','Ë':'E',
            'À':'A','Â':'A','Ä':'A',
            'Ô':'O','Ö':'O','Î':'I','Ï':'I',
            'Ù':'U','Û':'U','Ü':'U','Ç':'C',
            'ε':'eps','µ':'mu','°':'deg','²':'2','³':'3',
          };
          return map[c] || '';
        });

      // ── Helpers ──
      const setColor  = (rgb) => pdf.setTextColor(...rgb);
      const setFill   = (rgb) => pdf.setFillColor(...rgb);
      const setDraw   = (rgb) => pdf.setDrawColor(...rgb);
      const txt       = (t, x, yy, opts) => pdf.text(cleanTxt(t), x, yy, opts||{});
      const bold      = (sz=10) => { pdf.setFont('helvetica','bold');   pdf.setFontSize(sz); };
      const normal    = (sz=10) => { pdf.setFont('helvetica','normal'); pdf.setFontSize(sz); };
      const pageCheck = (need=30) => { if (y + need > 282) { pdf.addPage(); y = margin; addPageFooter(); } };
      const hLine     = (col=GREY) => { setDraw(col); pdf.line(margin, y, W-margin, y); y += 5; };

      // ── Pied de page (appelé sur chaque page) ──
      function addPageFooter() {
        const pageH = 297;
        setFill([248,248,250]);
        pdf.rect(0, pageH-12, W, 12, 'F');
        setDraw([220,220,225]);
        pdf.line(0, pageH-12, W, pageH-12);
        normal(7); setColor(GREY);
        txt('Labo Chimie & Physique — nilsprofgrenoble.github.io/simulations-chimie/', margin, pageH-5);
        txt(`Simulation : Dosage par etalonnage BTS  |  ${new Date().toLocaleDateString('fr-FR')}`, W-margin, pageH-5, {align:'right'});
      }

      // ════════════════════════════════════════
      // EN-TÊTE PAGE 1
      // ════════════════════════════════════════

      // Bande supérieure dégradée simulée (deux rectangles)
      setFill(TEAL);
      pdf.rect(0, 0, W, 28, 'F');
      setFill([26, 130, 118]);
      pdf.rect(0, 20, W, 8, 'F');

      // Icône ronde blanche
      setFill(WHITE);
      pdf.circle(margin + 8, 14, 7, 'F');
      setColor(TEAL);
      bold(11);
      txt('BTS', margin + 4.5, 17);

      // Titre principal
      setColor(WHITE);
      bold(16);
      txt('Dosage par etalonnage — Niveau BTS', margin + 20, 11);
      normal(8);
      txt('Rapport genere automatiquement', margin + 20, 17);

      // Date et URL en haut à droite
      normal(8); setColor([200,240,235]);
      txt(new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}), W-margin, 10, {align:'right'});
      txt('nilsprofgrenoble.github.io/simulations-chimie/', W-margin, 16, {align:'right'});
      txt(`Simulation : Dosage par etalonnage — ?sim=11`, W-margin, 22, {align:'right'});

      y = 35;

      // ════════════════════════════════════════
      // BLOC PARAMÈTRES
      // ════════════════════════════════════════
      setColor(DARK);

      // Titre section avec barre colorée gauche
      setFill(TEAL);
      pdf.rect(margin, y-1, 3, 6, 'F');
      bold(11); setColor(TEAL);
      txt('Parametres', margin + 6, y + 4); y += 9;

      const infos = [
        ['Methode',        methode==='beerlambert' ? 'Spectrophotometrie UV-visible (Beer-Lambert)' : 'Autre methode instrumentale'],
        ['Mesurande',      cleanTxt(`${mesLabel} (${uniteLabel})`)],
        ['Grandeur',       cleanTxt(grandeurLabel)],
        ['Niveaux inclus', `${nLevelsIncluded} / ${maxLevels}`],
        ['Repetitions',    `${nRepMin} par niveau`],
      ];
      if (methode==='beerlambert' && analyte!=='autre') {
        infos.push(['Analyte',  cleanTxt(a.label)]);
        infos.push(['Lambda',   `${lambdaNm} nm  (sensibilite ${pct}%)`]);
      }

      // Tableau paramètres sur 2 colonnes
      const colW = contentW / 2 - 4;
      infos.forEach(([k,v], i) => {
        // Chaque paramètre sur sa propre ligne, pas de double colonne
        pageCheck(12);
        if (i % 2 === 0) {
          setFill([248, 250, 252]);
          pdf.rect(margin, y - 4, contentW, 11, 'F');
        }
        bold(8); setColor(GREY);
        txt(k, margin + 2, y);
        normal(9); setColor(DARK);
        txt(v, margin + 2, y + 4.5);
        y += 12;
      });
      y += 2;

      hLine(TEAL);

      // ════════════════════════════════════════
      // BLOC STATISTIQUES
      // ════════════════════════════════════════
      pageCheck(50);
      setFill(PURPLE);
      pdf.rect(margin, y-1, 3, 6, 'F');
      bold(11); setColor(PURPLE);
      txt('Statistiques de la regression lineaire', margin + 6, y + 4); y += 10;

      const stats = [
        ['Pente a',                           reg.slope.toFixed(5) + '  ' + cleanTxt(grandeurLabel) + ' / ' + cleanTxt(uniteLabel)],
        ["Ordonnee a l'origine b",            reg.intercept.toFixed(5)],
        ['Coefficient de determination R2',   reg.r2.toFixed(6)],
      ];
      if (sB !== null) stats.push(['Ecart-type sur b  s(b)', sB.toFixed(5)]);
      if (LD !== null) stats.push(['Limite de detection (LD)',      LD.toFixed(4) + '  ' + cleanTxt(uniteLabel)]);
      if (LQ !== null) stats.push(['Limite de quantification (LQ)', LQ.toFixed(4) + '  ' + cleanTxt(uniteLabel)]);

      // En-tête tableau stats
      setFill(PURPLE);
      pdf.rect(margin, y-4, contentW, 6, 'F');
      bold(8); setColor(WHITE);
      txt('Grandeur', margin+2, y);
      txt('Valeur', margin + contentW*0.65, y);
      y += 6;

      stats.forEach(([k,v], i) => {
        pageCheck(8);
        if (i%2===0) { setFill([248,244,255]); pdf.rect(margin, y-4, contentW, 6, 'F'); }
        else         { setFill(WHITE);          pdf.rect(margin, y-4, contentW, 6, 'F'); }
        bold(9); setColor([60,40,90]);
        txt(k, margin+2, y);
        normal(9); setColor(DARK);
        txt(v, margin + contentW*0.65, y);
        y += 6;
      });

      // Résultat Cech
      if (aech && !isNaN(parseFloat(aech)) && reg) {
        const A = parseFloat(aech);
        const Cech = (A - reg.intercept) / reg.slope;
        y += 3;
        setFill(TEAL_L);
        pdf.rect(margin, y-4, contentW, 9, 'F');
        setDraw(TEAL);
        pdf.rect(margin, y-4, contentW, 9, 'S');
        bold(10); setColor(TEAL);
        txt(`Resultat  ->  ${cleanTxt(grandeurLabel)} = ${A}  =>  ${cleanTxt(mesLabel)} = ${Cech.toFixed(4)} ${cleanTxt(uniteLabel)}`, margin+4, y+1);
        y += 12;
      }

      y += 3;
      hLine(PURPLE);

      // ════════════════════════════════════════
      // GRAPHES
      // ════════════════════════════════════════
      const plotEl  = reportRef.current?.querySelector('.calib-plot');
      const residEl = reportRef.current?.querySelector('.resid-plot');

      if (plotEl) {
        pageCheck(80);
        setFill(TEAL);
        pdf.rect(margin, y-1, 3, 6, 'F');
        bold(11); setColor(TEAL);
        txt("Courbe d'etalonnage", margin+6, y+4); y += 10;

        const canvas = await window.html2canvas(plotEl, { scale:2, backgroundColor:'#ffffff' });
        const imgW = contentW, imgH = (canvas.height/canvas.width)*imgW;
        pageCheck(imgH);
        // Bordure légère autour du graphe
        setDraw([220,220,225]);
        pdf.rect(margin-1, y-1, contentW+2, imgH+2, 'S');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, y, imgW, imgH);
        y += imgH + 8;
      }

      if (residEl) {
        pageCheck(70);
        setFill(PURPLE);
        pdf.rect(margin, y-1, 3, 6, 'F');
        bold(11); setColor(PURPLE);
        txt('Graphique des residus', margin+6, y+4); y += 10;

        const canvas2 = await window.html2canvas(residEl, { scale:2, backgroundColor:'#ffffff' });
        const imgW2 = contentW, imgH2 = (canvas2.height/canvas2.width)*imgW2;
        pageCheck(imgH2);
        setDraw([220,220,225]);
        pdf.rect(margin-1, y-1, contentW+2, imgH2+2, 'S');
        pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', margin, y, imgW2, imgH2);
        y += imgH2 + 8;
      }

      // ════════════════════════════════════════
      // FISHER-SNEDECOR
      // ════════════════════════════════════════
      if (fisherResult) {
        pageCheck(60);
        hLine(PURPLE);

        setFill(PURPLE);
        pdf.rect(margin, y-1, 3, 6, 'F');
        bold(11); setColor(PURPLE);
        txt('Test de Fisher-Snedecor  —  Linearite (seuil 1 %)', margin+6, y+4); y += 10;

        // En-tête tableau
        const fishCols = [55, 28, 12, 28, 20, 20];
        const fishHeaders = ['Source', 'SCE', 'ddl', 'Variance', 'F exp', 'F crit 1%'];
        setFill(PURPLE);
        pdf.rect(margin, y-4, contentW, 6.5, 'F');
        bold(8); setColor(WHITE);
        let xp = margin+1;
        fishHeaders.forEach((h,i)=>{ txt(h,xp,y); xp+=fishCols[i]; });
        y += 7;

        const fishRows = [
          ['Regression lineaire', (reg.ssTot-reg.ssRes).toFixed(5), '1', '-', '-', '-'],
          ['Non-linearite',       fisherResult.SCE_nl, String(fisherResult.ddl_nl), fisherResult.varNl, fisherResult.Fexp??'-', String(fisherResult.Fcrit??'-')],
          ['Residuelle',          fisherResult.SCE_r,  String(fisherResult.ddl_r),  fisherResult.varR,  '-', '-'],
        ];

        fishRows.forEach((row,ri) => {
          setFill(ri%2===0 ? WHITE : PURP_L);
          pdf.rect(margin, y-4, contentW, 6.5, 'F');
          setColor(DARK); xp = margin+1;
          row.forEach((cell,i)=>{
            bold(8); if(i===0) normal(8);
            if(i===4||i===5) { bold(9); setColor(PURPLE); } else setColor(DARK);
            txt(String(cell), xp, y); xp+=fishCols[i];
          });
          y += 7;
        });

        // Conclusion Fisher
        y += 2;
        const isOk = fisherResult.linearite === true;
        setFill(isOk ? GREEN_L : RED_L);
        pdf.rect(margin, y-4, contentW, 9, 'F');
        setDraw(isOk ? GREEN : RED);
        pdf.rect(margin, y-4, contentW, 9, 'S');
        bold(10); setColor(isOk ? GREEN : RED);
        const conclu = isOk
          ? `OK  F exp (${fisherResult.Fexp}) < F crit (${fisherResult.Fcrit})  ->  Linearite verifiee au seuil 1 %`
          : `NON  F exp (${fisherResult.Fexp}) >= F crit (${fisherResult.Fcrit})  ->  Linearite non verifiee`;
        txt(conclu, margin+4, y+1);
        y += 12;
      }

      // Pied de page page 1
      addPageFooter();

      pdf.save(`etalonnage_BTS_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch(e) {
      console.error('Erreur PDF:', e);
      alert('Erreur lors de la generation du PDF : ' + e.message);
    }
    setPdfLoading(false);
  }


  return (
    <div style={cardStyle} ref={reportRef}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <h2 style={{margin:0,fontSize:18,color:'var(--color-text-primary)'}}>
          Dosage par étalonnage — Niveau BTS
        </h2>
        {tab && reg && (
          <button onClick={exportPDF} disabled={pdfLoading}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',
              borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
              background: pdfLoading ? '#aaa' : '#2a9d8f',color:'white',
              fontFamily:"'Nunito', sans-serif"}}>
            {pdfLoading ? '⏳ Génération...' : '📄 Exporter en PDF'}
          </button>
        )}
      </div>

      {/* Choix méthode */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[['beerlambert','🌈 Spectrophotométrie (Beer-Lambert)'],['autre','📊 Autre méthode (SAA, HPLC…)']].map(([k,l])=>(
          <button key={k} onClick={()=>setMethode(k)}
            style={{padding:'10px 20px',fontSize:15,borderRadius:8,cursor:'pointer',fontWeight:'500',
              border: methode===k ? '2px solid #1a7abf' : '1px solid var(--color-border-secondary)',
              background: methode===k ? '#e8f4fd' : 'var(--color-background-secondary)',
              color: methode===k ? '#1a7abf' : 'var(--color-text-secondary)'}}>
            {l}
          </button>
        ))}
      </div>

      {methode === 'beerlambert' && (
        <>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
            <label style={{fontSize:13,color:'var(--color-text-secondary)'}}>Analyte :</label>
            <select value={analyte} onChange={e=>setAnalyte(e.target.value)} style={{fontSize:13}}>
              {Object.entries(ANALYTES_BL).map(([k,v])=>(<option key={k} value={k}>{v.label}</option>))}
            </select>
          </div>
          {analyte === 'autre' && (
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12,alignItems:'flex-end',
              padding:'10px 14px',background:'var(--color-background-secondary)',borderRadius:8}}>
              <Field label="Nom de l'analyte" value={customNom} onChange={setCustomNom} width={160} type="text"/>
              <div>
                <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>λ max (nm)</div>
                <input type="number" value={customLambda} min={380} max={780}
                  onChange={e=>{const v=Number(e.target.value);setCustomLambda(v);setLambdaNm(v);}}
                  style={{width:80,fontSize:13,padding:'4px 6px'}}/>
              </div>
            </div>
          )}
          {analyte !== 'autre' && (
            <SpectroSchema analyteName={analyte} lambdaNm={lambdaNm} onLambdaChange={setLambdaNm}/>
          )}
          {analyte === 'autre' && (
            <div style={{padding:'10px 14px',fontSize:13,color:'var(--color-text-secondary)',
              background:'var(--color-background-secondary)',borderRadius:8,marginBottom:8}}>
              λ de travail : <strong>{customLambda} nm</strong>{' — '}
              <span style={{display:'inline-block',width:18,height:10,borderRadius:3,
                background:nmToColor(customLambda),verticalAlign:'middle'}}/>
            </div>
          )}
          {analyte !== 'autre' && (
            <div style={{display:'flex',alignItems:'center',gap:10,margin:'8px 0 4px',flexWrap:'wrap'}}>
              <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>Sensibilité à {lambdaNm} nm :</span>
              <div style={{flex:1,maxWidth:200,height:10,background:'var(--color-background-secondary)',borderRadius:5,overflow:'hidden'}}>
                <div style={{width:`${pct}%`,height:'100%',background:sensColor,borderRadius:5,transition:'width 0.3s,background 0.3s'}}/>
              </div>
              <span style={{fontSize:13,fontWeight:'500',color:sensColor}}>{pct}%</span>
              {pct < 50 && <span style={{fontSize:12,color:'#d97706'}}>⚠ Sensibilité faible</span>}
            </div>
          )}
        </>
      )}

      {methode === 'autre' && (
        <div style={{padding:'10px 14px',fontSize:13,background:'var(--color-background-secondary)',
          borderRadius:8,marginBottom:8,color:'var(--color-text-secondary)'}}>
          Méthode instrumentale sans spectrophotomètre UV-visible — saisissez directement vos données d'étalonnage.
        </div>
      )}

      <hr style={{margin:'16px 0',borderColor:'var(--color-border-tertiary)'}}/>

      <div style={{marginBottom:10}}>
        <div style={{fontSize:15,fontWeight:'500',marginBottom:6}}>Courbe d'étalonnage</div>
        {methode === 'beerlambert' && (
          <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:10}}>
            Choisissez une source de données :
          </div>
        )}
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {[['exemple','Exemple'],['manuel','Saisie manuelle'],['tableur','Copier-coller tableur']].map(([k,l])=>(
            <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>
          ))}
        </div>
      </div>

      {tab==='exemple' && methode==='beerlambert' && (
        <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:8}}>
          Étalonnage KMnO₄ par spectrophotométrie — {exBL.niveaux} niveaux × {exBL.repetitions} répétitions, λ = {lambdaNm} nm.{' '}
          {analyte !== 'autre' && <span style={{color:sensColor,fontWeight:'500'}}>Sensibilité : {pct}% du maximum (à {a.peakNm} nm).</span>}
        </div>
      )}
      {tab==='exemple' && methode==='autre' && (
        <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:8}}>
          Dosage du potassium K⁺ par SAA — {exAutre.niveaux} niveaux × {exAutre.repetitions} répétitions. Grandeur mesurée : Intensité I (u.a.)
        </div>
      )}

      {tab==='manuel' && (
        <div style={{marginBottom:12}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10,alignItems:'flex-end'}}>
            <CoeffInput label="Nb solutions étalons (blanc compris)" value={nNiveaux}
              onChange={v=>setNNiveaux(Math.max(3,Math.min(20,v)))} min={3} max={20}/>
            <CoeffInput label="Nb essais par solution étalon" value={nRep}
              onChange={v=>setNRep(Math.max(2,Math.min(15,v)))} min={2} max={15}/>
            <Field label="Mesurande" value={mesurande} onChange={setMesurande} width={120} type="text"/>
            <Field label="Unité" value={unite} onChange={setUnite} width={80} type="text"/>
            <Field label="Grandeur mesurée" value={grandeur} onChange={setGrandeur} width={130} type="text"/>
            <button onClick={initManualGrid} style={{padding:'4px 12px',fontSize:13}}>Créer le tableau</button>
          </div>
          {nRep < 2 && <div style={{fontSize:12,color:'#d97706',marginBottom:8}}>⚠ Le test de Fisher-Snedecor nécessite au moins 2 répétitions par niveau.</div>}
          {manualData && (
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr>
                    <th style={{padding:'4px 8px',borderBottom:'1px solid var(--color-border-tertiary)'}}>{mesurande} ({unite})</th>
                    {Array(nRep).fill(0).map((_,j)=>(
                      <th key={j} style={{padding:'4px 8px',borderBottom:'1px solid var(--color-border-tertiary)'}}>{grandeur.split(' ')[0]}{j+1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {manualData.concentrations.map((c,i)=>(
                    <tr key={i}>
                      <td style={{padding:'2px 4px'}}>
                        <input type="number" value={c} onChange={e=>updateManualConc(i,e.target.value)} style={{width:80,fontSize:12,padding:'2px 4px'}}/>
                      </td>
                      {Array(nRep).fill(0).map((_,j)=>(
                        <td key={j} style={{padding:'2px 4px'}}>
                          <input type="number" value={manualData.absorbances[i][j]}
                            onChange={e=>updateManualAbs(i,j,e.target.value)}
                            style={{width:72,fontSize:12,padding:'2px 4px'}} step="0.001"/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==='tableur' && (
        <div style={{marginBottom:12}}>
          <p style={{fontSize:13,color:'var(--color-text-secondary)',marginTop:0}}>
            Format : une ligne par niveau, séparateur tabulation ou ;<br/>
            <code style={{fontSize:11}}>C{'\t'}Y1{'\t'}Y2{'\t'}Y3…</code><br/>
            <span style={{color:'#d97706'}}>⚠ Pour Fisher-Snedecor : même nombre de répétitions (≥ 2) sur chaque ligne.</span>
          </p>
          <div style={{display:'flex',gap:10,marginBottom:8,flexWrap:'wrap'}}>
            <Field label="Mesurande" value={mesurande} onChange={setMesurande} width={120} type="text"/>
            <Field label="Unité" value={unite} onChange={setUnite} width={80} type="text"/>
            <Field label="Grandeur mesurée" value={grandeur} onChange={setGrandeur} width={130} type="text"/>
          </div>
          <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
            placeholder={"C\tY1\tY2\tY3\n0\t0.001\t0.002\t0.001"}
            style={{width:'100%',height:140,fontSize:12,fontFamily:'monospace',
              padding:8,boxSizing:'border-box',border:'1px solid var(--color-border-tertiary)',
              borderRadius:6,background:'var(--color-background-primary)',color:'var(--color-text-primary)'}}/>
        </div>
      )}

      {tab && reg && (
        <>
          {maxLevels > 2 && (
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12,flexWrap:'wrap',
              padding:'8px 12px',background:'var(--color-background-secondary)',borderRadius:8}}>
              <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>Niveaux inclus :</span>
              <input type="range" min={2} max={maxLevels} value={nLevelsIncluded}
                onChange={e=>setNLevelsIncluded(Number(e.target.value))} style={{width:160}}/>
              <span style={{fontSize:13,fontWeight:'500'}}>{nLevelsIncluded} / {maxLevels}</span>
              {nLevelsIncluded < maxLevels && (
                <span style={{fontSize:12,color:'#d97706'}}>⚠ {maxLevels-nLevelsIncluded} niveau(x) exclu(s)</span>
              )}
            </div>
          )}

          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
            {[
              ['Pente a', reg.slope.toFixed(5)],
              ['Ordonnée b', reg.intercept.toFixed(5)],
              ['R²', reg.r2.toFixed(6)],
              sB!==null ? ['s(b)', sB.toFixed(5)] : null,
              LD!==null ? ['LD', `${LD.toFixed(4)} ${uniteLabel}`] : null,
              LQ!==null ? ['LQ', `${LQ.toFixed(4)} ${uniteLabel}`] : null,
            ].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{background:'var(--color-background-secondary)',borderRadius:8,padding:'8px 14px',minWidth:110}}>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{l}</div>
                <div style={{fontSize:14,fontWeight:'500'}}>{v}</div>
              </div>
            ))}
          </div>

          <CalibrationPlot
            plotlyReady={plotlyReady} xs={xs} ys={ys}
            xsScale={xsMax} ysScale={ysMax}
            mesurande={mesLabel} unite={uniteLabel}
            grandeurLabel={grandeurLabel}
            aechValue={aech} onAechChange={setAech}
            showResiduals={true}
            lambdaNm={lambdaNm}
            peakNm={methode==='beerlambert' && analyte!=='autre' ? a.peakNm : lambdaNm}
            calibClassName="calib-plot"
            residClassName="resid-plot"/>

          <hr style={{margin:'20px 0',borderColor:'var(--color-border-tertiary)'}}/>

          <div style={{marginBottom:8}}>
            <div style={{fontSize:15,fontWeight:'500',marginBottom:6}}>
              Test de Fisher-Snedecor — Vérification de la linéarité (seuil 1 %)
            </div>
            {!canFisher && (
              <div style={{fontSize:13,color:'#d97706',padding:'8px 12px',
                background:'var(--color-background-secondary)',borderRadius:7}}>
                ⚠ Test impossible : il faut ≥ 3 niveaux avec ≥ 2 répétitions chacun.
                {nRepMin < 2 && ` Actuellement ${nRepMin} répétition(s) par niveau.`}
              </div>
            )}
            {fisherResult && (
              <>
                <div style={{overflowX:'auto',marginBottom:8}}>
                  <table style={{borderCollapse:'collapse',fontSize:12,width:'100%',maxWidth:600}}>
                    <thead>
                      <tr style={{background:'var(--color-background-secondary)'}}>
                        {['Source','SCE','ddl','Variance','F exp','F crit 1 %'].map(h=>(
                          <th key={h} style={{padding:'6px 10px',borderBottom:'1px solid var(--color-border-tertiary)',
                            textAlign:'left',fontWeight:'500'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{padding:'5px 10px',color:'var(--color-text-secondary)'}}>Régression linéaire</td>
                        <td style={{padding:'5px 10px'}}>{reg ? (reg.ssTot-reg.ssRes).toFixed(5) : '—'}</td>
                        <td>1</td><td>—</td><td>—</td><td>—</td>
                      </tr>
                      <tr style={{background:'var(--color-background-secondary)'}}>
                        <td style={{padding:'5px 10px',color:'var(--color-text-secondary)'}}>Non-linéarité</td>
                        <td style={{padding:'5px 10px'}}>{fisherResult.SCE_nl}</td>
                        <td>{fisherResult.ddl_nl}</td>
                        <td>{fisherResult.varNl}</td>
                        <td style={{fontWeight:'500'}}>{fisherResult.Fexp}</td>
                        <td style={{fontWeight:'500'}}>{fisherResult.Fcrit ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{padding:'5px 10px',color:'var(--color-text-secondary)'}}>Résiduelle (répétabilité)</td>
                        <td style={{padding:'5px 10px'}}>{fisherResult.SCE_r}</td>
                        <td>{fisherResult.ddl_r}</td>
                        <td>{fisherResult.varR}</td>
                        <td>—</td><td>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{fontSize:13,padding:'8px 12px',borderRadius:7,marginBottom:10,
                  background: fisherResult.linearite===true ? '#f0fdf4' : fisherResult.linearite===false ? '#fef2f2' : 'var(--color-background-secondary)',
                  color: fisherResult.linearite===true ? '#15803d' : fisherResult.linearite===false ? '#dc2626' : 'var(--color-text-secondary)',
                  border:`1px solid ${fisherResult.linearite===true?'#bbf7d0':fisherResult.linearite===false?'#fecaca':'var(--color-border-tertiary)'}`,
                }}>
                  {fisherResult.linearite===true && `✓ F exp (${fisherResult.Fexp}) < F crit (${fisherResult.Fcrit}) → Linéarité vérifiée au seuil 1 % — ${fisherResult.p} niveaux × ${fisherResult.n} répétitions`}
                  {fisherResult.linearite===false && `✗ F exp (${fisherResult.Fexp}) ≥ F crit (${fisherResult.Fcrit}) → Linéarité non vérifiée — essayez de restreindre le domaine avec le curseur`}
                  {fisherResult.linearite===null && 'Calcul impossible'}
                </div>
              </>
            )}
          </div>

          <button onClick={()=>setShowFormules(v=>!v)}
            style={{fontSize:12,padding:'5px 14px',borderRadius:6,cursor:'pointer',
              border:'1px solid var(--color-border-secondary)',
              background:'var(--color-background-secondary)',color:'var(--color-text-secondary)',
              marginBottom: showFormules ? 8 : 0}}>
            {showFormules ? '▲ Masquer les formules' : '▼ Afficher les formules et détails des calculs'}
          </button>

          {showFormules && (
            <div style={{fontSize:12,padding:'14px 16px',borderRadius:8,lineHeight:2,
              background:'var(--color-background-secondary)',border:'1px solid var(--color-border-tertiary)'}}>
              <div style={{fontWeight:'500',marginBottom:8,fontSize:13}}>Formules utilisées</div>
              <div style={{marginBottom:10}}>
                <strong>Régression linéaire</strong> (moindres carrés, points individuels) :<br/>
                Y = a·C + b &nbsp;|&nbsp; a = [n·Σ(CᵢYᵢ) − ΣCᵢ·ΣYᵢ] / [n·ΣCᵢ² − (ΣCᵢ)²]
              </div>
              <div style={{marginBottom:10}}>
                <strong>Erreur standard sur b</strong> : s(b) = √[ s²_rés · (1/n + C̄² / Scc) ]
              </div>
              <div style={{marginBottom:10}}>
                <strong>LD et LQ</strong> : LD = 3·s(b) / a &nbsp;|&nbsp; LQ = 10·s(b) / a
              </div>
              <div style={{marginBottom:10}}>
                <strong>Test de Fisher-Snedecor</strong> :<br/>
                SCE_nonlin = n·Σⱼ(Āⱼ − Ŷⱼ)² (ddl = p−2) &nbsp;|&nbsp;
                SCE_résid = Σⱼ Σᵢ(Yᵢⱼ − Āⱼ)² (ddl = p·(n−1))<br/>
                F_exp = (SCE_nonlin/(p−2)) / (SCE_résid/(p·(n−1)))
              </div>
              <div><strong>C_éch</strong> = (Y_éch − b) / a</div>
            </div>
          )}
        </>
      )}

      {tab && !reg && xs.length < 2 && (
        <p style={{fontSize:13,color:'var(--color-text-secondary)'}}>
          Saisissez au moins 2 niveaux de concentration pour afficher la courbe.
        </p>
      )}
    </div>
  );
}


// SIM 12 — SIMULATION CLHP (BTS)
// Modèle de X. Bataille (ENCPB/RNChimie, 2008)

const MOLECULES_CLHP = [
  { nom: "Paracétamol",          logP:  0.34 },
  { nom: "Caféine",              logP: -0.13 },
  { nom: "Phénol",               logP:  1.48 },
  { nom: "Phénacétine",          logP:  1.63 },
  { nom: "o-nitrophénol",        logP:  1.71 },
  { nom: "Ac. 2-aminobenzoïque", logP:  1.21 },
  { nom: "Ac. 2-chlorobenzoïque",logP:  2.01 },
  { nom: "Benzophénone",         logP:  3.18 },
  { nom: "Benzoate de méthyle",  logP:  2.20 },
  { nom: "Lidocaïne",            logP:  2.36 },
  { nom: "4-nitrobenz. éthyle",  logP:  2.33 },
  { nom: "Triphénylcarbinol",    logP:  4.59 },
  { nom: "1,3-diphénylacétone",  logP:  2.99 },
  { nom: "Benzaldéhyde",         logP:  1.64 },
  { nom: "Diméthylaniline",      logP:  1.86 },
  { nom: "m-nitrophénol",        logP:  1.93 },
  { nom: "Hydrobenzoïne",        logP:  1.86 },
];

function SimulationCLHP({ plotlyReady }) {
  const [longueur, setLongueur] = useState(15);
  const [diametre, setDiametre] = useState(4.6);
  const [dp, setDp] = useState(5);
  const [nC, setNC] = useState(18);
  const [porosite, setPorosite] = useState(0.8);
  const [temperature, setTemperature] = useState(25);
  const [debit, setDebit] = useState(2.5);
  const [pctSolvOrg, setPctSolvOrg] = useState(50);
  const [mp, setMp] = useState(-0.64);
  const [mo, setMo] = useState(-0.61);
  const [bParam, setBParam] = useState(19);
  const [cParam, setCParam] = useState(-1.6);
  const [selected, setSelected] = useState([2, 4]);
  const [customMols, setCustomMols] = useState([]);
  const [newNom, setNewNom] = useState('');
  const [newLogP, setNewLogP] = useState(1.0);
  const [concs, setConcs] = useState({});
  const [epsilons, setEpsilons] = useState({});
  const [showExpData, setShowExpData] = useState(false);
  const [expTr, setExpTr] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const plotRef = useRef(null);

  const r = diametre / 20;
  const dpCm = dp * 1e-4;
  const phi = pctSolvOrg / 100;
  const tm = porosite * Math.PI * r * r * longueur / debit;
  const nPlateaux = longueur / (dpCm * nC);

  const allMols = [
    ...selected.map(i => ({
      ...MOLECULES_CLHP[i], idx: 'pre_' + i,
      conc: concs['pre_' + i] ?? 1,
      epsilon: epsilons['pre_' + i] ?? 10,
    })),
    ...customMols.map((m, i) => ({
      ...m, idx: 'cust_' + i,
      conc: concs['cust_' + i] ?? 1,
      epsilon: epsilons['cust_' + i] ?? 10,
    })),
  ];

  function calcMol(mol) {
    const ai = mp * mol.logP + mo;
    const lnk = phi > 0 ? ai * Math.log(phi) + bParam / temperature + cParam : -20;
    const k = Math.exp(lnk);
    const tr = tm * (1 + k);
    const W = nPlateaux > 0 ? 2.355 * tr / Math.sqrt(nPlateaux) : 0.1;
    const sigma = W / 2.355;
    return { k, tr, W, sigma };
  }

  const molsCalc = allMols.map(m => ({ ...m, ...calcMol(m) }))
    .sort((a, b) => a.tr - b.tr);

  const resolutions = molsCalc.slice(0, -1).map((m, i) => {
    const next = molsCalc[i + 1];
    if (m.W + next.W === 0) return null;
    return 1.18 * (next.tr - m.tr) / (m.W + next.W);
  });

  useEffect(() => {
    if (!plotlyReady || !plotRef.current || allMols.length === 0) return;
    const tMax = Math.max(tm * 2, ...molsCalc.map(m => m.tr + 3 * m.sigma));
    const N = 1200;
    const tArr = Array.from({ length: N }, (_, i) => i * tMax / (N - 1));
    const colors = ['#e63946','#2a9d8f','#6a4c93','#e9a824','#457b9d','#2d6a4f','#f4a261','#c77dff','#06d6a0'];
    const traces = [];
    const sigmaMort = Math.max(tm * 0.015, 0.005);
    traces.push({
      x: tArr, y: tArr.map(t => 0.3 * Math.exp(-0.5 * ((t - tm) / sigmaMort) ** 2)),
      mode: 'lines', name: 'Pic tps mort',
      line: { color: '#aaa', width: 1.5, dash: 'dot' },
    });
    const yTotal = new Array(N).fill(0);
    molsCalc.forEach((mol, idx) => {
      const { tr, sigma, conc, epsilon } = mol;
      const A = (conc ?? 1) * (epsilon ?? 10);
      const y = tArr.map(t => A * Math.exp(-0.5 * ((t - tr) / sigma) ** 2));
      y.forEach((v, i) => { yTotal[i] += v; });
      traces.push({
        x: tArr, y, mode: 'lines', name: mol.nom,
        line: { color: colors[idx % colors.length], width: 2 },
      });
    });
    traces.push({
      x: tArr, y: yTotal, mode: 'lines', name: 'Signal total',
      line: { color: '#333', width: 1.5, dash: 'dash' }, visible: 'legendonly',
    });
    Plotly.react(plotRef.current, traces, {
      xaxis: { title: 't (min)', gridcolor: 'rgba(128,128,128,0.15)', zeroline: false },
      yaxis: { title: 'Réponse détecteur', gridcolor: 'rgba(128,128,128,0.15)', zeroline: false },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      margin: { t: 20, r: 20, b: 50, l: 60 },
      legend: { bgcolor: 'transparent' }, font: { size: 12 },
    }, { responsive: true, displayModeBar: false });
  }, [plotlyReady, JSON.stringify(molsCalc.map(m => ({ tr: m.tr, sigma: m.sigma, conc: m.conc, epsilon: m.epsilon, nom: m.nom }))), pctSolvOrg, temperature, debit]);

  function toggleMol(idx) {
    setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  }
  function addCustomMol() {
    if (!newNom.trim()) return;
    setCustomMols(prev => [...prev, { nom: newNom.trim(), logP: newLogP }]);
    setNewNom(''); setNewLogP(1.0);
  }
  function removeCustom(i) { setCustomMols(prev => prev.filter((_, j) => j !== i)); }

  const inp = {
    width: 70, fontSize: 12, padding: '2px 6px',
    border: '1px solid var(--color-border-tertiary)', borderRadius: 4,
    background: 'var(--color-background-primary)', color: 'var(--color-text-primary)',
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, fontSize: 18, color: 'var(--color-text-primary)' }}>
        Simulation CLHP — Phase inverse — Niveau BTS
      </h2>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        D'après X. Bataille (ENCPB / RNChimie, 2008) — Phase inverse C{nC}, éluant acétonitrile/eau
      </div>

      {/* Paramètres */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>

        {/* Colonne */}
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 16px', minWidth: 220 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Colonne</div>
          {[
            ['Longueur (cm)', longueur, setLongueur, 1, 50, 1],
            ['Diamètre (mm)', diametre, setDiametre, 1, 10, 0.1],
            ['Taille particules dp (µm)', dp, setDp, 1, 20, 1],
            ['Greffage nC', nC, setNC, 1, 30, 1],
            ['Porosité ε', porosite, setPorosite, 0.1, 1, 0.05],
          ].map(([label, val, setter, min, max, step]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 5 }}>
              <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>{label}</span>
              <input type="number" value={val} min={min} max={max} step={step}
                onChange={e => setter(parseFloat(e.target.value) || min)} style={inp}/>
            </div>
          ))}
        </div>

        {/* Éluant */}
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 16px', minWidth: 220 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Éluant</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            % solvant organique : <strong style={{ color: '#2a9d8f' }}>{pctSolvOrg} %</strong>
          </div>
          <input type="range" min={5} max={95} step={1} value={pctSolvOrg}
            onChange={e => setPctSolvOrg(Number(e.target.value))} style={{ width: '100%', marginBottom: 10 }}/>
          {[
            ['Débit (mL/min)', debit, setDebit, 0.1, 10, 0.1],
            ['Température (°C)', temperature, setTemperature, 5, 80, 1],
          ].map(([label, val, setter, min, max, step]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 5 }}>
              <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>{label}</span>
              <input type="number" value={val} min={min} max={max} step={step}
                onChange={e => setter(parseFloat(e.target.value) || min)} style={inp}/>
            </div>
          ))}
        </div>

        {/* Infos colonne */}
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 16px', minWidth: 180 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Colonne calculée</div>
          {[
            ['Temps mort tₘ', tm.toFixed(3) + ' min'],
            ['Plateaux théoriques N', Math.round(nPlateaux).toLocaleString('fr-FR')],
            ['HEPT', (longueur / nPlateaux * 10).toFixed(2) + ' mm'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, gap: 12 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{l}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Paramètres avancés */}
      <button onClick={() => setShowAdvanced(v => !v)}
        style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 10,
          border: '1px solid var(--color-border-secondary)',
          background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }}>
        {showAdvanced ? '▲ Masquer paramètres avancés' : '▼ Paramètres avancés du modèle (mp, mo, b, c)'}
      </button>

      {showAdvanced && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16,
          padding: '12px 16px', background: 'var(--color-background-secondary)', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: '100%', marginBottom: 4 }}>
            ln(k'ᵢ) = (mp·logPᵢ + mo)·ln(φ) + b/T + c &nbsp;—&nbsp; T en °C, φ = fraction vol. solvant organique
          </div>
          {[['mp', mp, setMp, -3, 0, 0.01],['mo', mo, setMo, -3, 1, 0.01],
            ['b', bParam, setBParam, 0, 50, 0.5],['c', cParam, setCParam, -5, 0, 0.1]].map(([label, val, setter, min, max, step]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--color-text-secondary)', minWidth: 20 }}>{label} =</span>
              <input type="number" value={val} min={min} max={max} step={step}
                onChange={e => setter(parseFloat(e.target.value))} style={{ ...inp, width: 80 }}/>
            </div>
          ))}
          <button onClick={() => { setMp(-0.64); setMo(-0.61); setBParam(19); setCParam(-1.6); }}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
              border: '1px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)', color: 'var(--color-text-secondary)' }}>
            Réinitialiser
          </button>
        </div>
      )}

      <hr style={{ margin: '12px 0', borderColor: 'var(--color-border-tertiary)' }}/>

      {/* Sélection molécules */}
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10 }}>Composition du mélange</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {MOLECULES_CLHP.map((m, i) => (
          <button key={i} onClick={() => toggleMol(i)}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 16, cursor: 'pointer',
              border: selected.includes(i) ? '2px solid #2a9d8f' : '1px solid var(--color-border-tertiary)',
              background: selected.includes(i) ? '#e8f8f5' : 'var(--color-background-secondary)',
              color: selected.includes(i) ? '#1a7a6e' : 'var(--color-text-secondary)',
              fontWeight: selected.includes(i) ? 500 : 400 }}>
            {m.nom} <span style={{ opacity: 0.6, fontSize: 10 }}>logP={m.logP}</span>
          </button>
        ))}
      </div>

      {/* Ajout molécule custom */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
        <Field label="Nom de la molécule" value={newNom} onChange={setNewNom} width={160} type="text"/>
        <Field label="logP" value={newLogP} onChange={v => setNewLogP(parseFloat(v) || 0)} width={70}/>
        <button onClick={addCustomMol}
          style={{ padding: '5px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
            background: '#2a9d8f', color: 'white', border: 'none', fontWeight: 500 }}>
          + Ajouter
        </button>
        {customMols.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
            padding: '4px 10px', borderRadius: 16, border: '2px solid #6a4c93',
            background: '#f3eeff', color: '#6a4c93' }}>
            {m.nom} (logP={m.logP})
            <button onClick={() => removeCustom(i)}
              style={{ marginLeft: 4, background: 'none', border: 'none',
                cursor: 'pointer', color: '#6a4c93', fontSize: 14, padding: 0 }}>×</button>
          </div>
        ))}
      </div>

      {/* Tableau résultats */}
      {allMols.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 12 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Molécule', 'logP', 'C (u.a.)', 'ε réponse', "tr calc. (min)", 'W½ (min)', "k'"].concat(
                  showExpData ? ['tr expéri. (min)', 'Écart (%)'] : []
                ).map(h => (
                  <th key={h} style={{ padding: '5px 8px', borderBottom: '1px solid var(--color-border-tertiary)',
                    textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {molsCalc.map((mol, idx) => {
                const ecart = showExpData && expTr[mol.idx]
                  ? Math.abs((mol.tr - expTr[mol.idx]) / expTr[mol.idx] * 100)
                  : null;
                const ecartColor = ecart !== null ? (ecart < 5 ? '#16a34a' : ecart < 15 ? '#d97706' : '#dc2626') : '';
                return (
                  <tr key={mol.idx} style={{ background: idx % 2 ? 'var(--color-background-secondary)' : 'transparent' }}>
                    <td style={{ padding: '4px 8px', fontWeight: 500 }}>{mol.nom}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--color-text-secondary)' }}>{mol.logP}</td>
                    <td style={{ padding: '4px 8px' }}>
                      <input type="number" value={concs[mol.idx] ?? 1} min={0} step={0.1}
                        onChange={e => setConcs(p => ({ ...p, [mol.idx]: parseFloat(e.target.value) || 0 }))}
                        style={{ ...inp, width: 60 }}/>
                    </td>
                    <td style={{ padding: '4px 8px' }}>
                      <input type="number" value={epsilons[mol.idx] ?? 10} min={0} step={1}
                        onChange={e => setEpsilons(p => ({ ...p, [mol.idx]: parseFloat(e.target.value) || 0 }))}
                        style={{ ...inp, width: 60 }}/>
                    </td>
                    <td style={{ padding: '4px 8px', fontWeight: 500 }}>{mol.tr.toFixed(3)}</td>
                    <td style={{ padding: '4px 8px' }}>{mol.W.toFixed(4)}</td>
                    <td style={{ padding: '4px 8px' }}>{mol.k.toFixed(3)}</td>
                    {showExpData && (
                      <>
                        <td style={{ padding: '4px 8px' }}>
                          <input type="number" value={expTr[mol.idx] ?? ''} min={0} step={0.01} placeholder="—"
                            onChange={e => setExpTr(p => ({ ...p, [mol.idx]: parseFloat(e.target.value) || '' }))}
                            style={{ ...inp, width: 70 }}/>
                        </td>
                        <td style={{ padding: '4px 8px', fontWeight: 500, color: ecartColor }}>
                          {ecart !== null ? ecart.toFixed(1) + ' %' : '—'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {showExpData && molsCalc.some(m => expTr[m.idx]) && (() => {
                const vals = molsCalc.filter(m => expTr[m.idx])
                  .map(m => Math.abs((m.tr - expTr[m.idx]) / expTr[m.idx] * 100));
                const moy = vals.reduce((a, b) => a + b, 0) / vals.length;
                return (
                  <tr style={{ background: 'var(--color-background-secondary)', fontWeight: 500 }}>
                    <td colSpan={7} style={{ padding: '4px 8px' }}>Écart moyen</td>
                    <td/>
                    <td style={{ padding: '4px 8px', color: moy < 5 ? '#16a34a' : moy < 15 ? '#d97706' : '#dc2626' }}>
                      {moy.toFixed(1)} %
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Bouton comparaison expé */}
      <button onClick={() => setShowExpData(v => !v)}
        style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 12,
          border: '1px solid var(--color-border-secondary)',
          background: showExpData ? '#e8f8f5' : 'var(--color-background-secondary)',
          color: showExpData ? '#1a7a6e' : 'var(--color-text-secondary)' }}>
        {showExpData ? '✓ Comparaison expérimentale activée' : '+ Comparer avec des tr expérimentaux'}
      </button>

      {/* Résolutions */}
      {resolutions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {resolutions.map((R, i) => {
            if (R === null || isNaN(R)) return null;
            const color = R >= 1.5 ? '#16a34a' : R >= 1.0 ? '#d97706' : '#dc2626';
            const symbole = R >= 1.5 ? '✓' : R >= 1.0 ? '⚠' : '✗';
            return (
              <div key={i} style={{ background: 'var(--color-background-secondary)',
                borderRadius: 8, padding: '5px 10px', fontSize: 12,
                border: '1px solid var(--color-border-tertiary)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  R({molsCalc[i].nom.split(' ')[0]} / {molsCalc[i+1].nom.split(' ')[0]}) =
                </span>
                {' '}
                <strong style={{ color }}>{R.toFixed(2)} {symbole}</strong>
              </div>
            );
          })}
        </div>
      )}

      {/* Chromatogramme */}
      {allMols.length > 0
        ? <div ref={plotRef} style={{ width: '100%', height: 380 }}/>
        : (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: 13,
            color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)', borderRadius: 10 }}>
            Sélectionnez au moins une molécule pour afficher le chromatogramme.
          </div>
        )
      }

      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
        Résolution : <span style={{ color: '#16a34a' }}>✓ R ≥ 1,5</span> pics séparés ·{' '}
        <span style={{ color: '#d97706' }}>⚠ 1,0 ≤ R &lt; 1,5</span> partiellement séparés ·{' '}
        <span style={{ color: '#dc2626' }}>✗ R &lt; 1,0</span> pics superposés
      </div>
    </div>
  );
}

// ====================================================
// SIM 13 — ÉTALON INTERNE / NORMALISATION INTERNE (BTS)
// Version 2 — UI colorée, colonnes fixes, bug nAnalytes corrigé
// ====================================================
//
// INSTALLATION : remplacer tout le bloc depuis
//   const MOLECULES_CLHP = [   (si vous avez la sim CLHP)
// NON — remplacer uniquement depuis :
//   const EX_EI = {
// jusqu'à la fin de SimulationEtalonnageInterne
// OU coller entièrement avant export default function App()
// et ajouter dans SIMULATIONS :
//   { id: 13, label: "Étalon interne / Normalisation interne", icon: "📐", color: "#c0392b", component: SimulationEtalonnageInterne, niveau: "BTS" },

// ---- Palette couleurs pour les composés ----
const COMP_COLORS = ['#2a9d8f','#e63946','#6a4c93','#e9a824','#457b9d','#f4a261','#06d6a0','#c77dff'];

// ---- Chromatogramme gaussien commun ----
function ChromatoPlot({ plotlyReady, pics, title, bgColor }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!plotlyReady || !ref.current) return;
    const valid = pics.filter(p => p.tr > 0 && p.aire > 0);
    if (valid.length === 0) { Plotly.purge && Plotly.purge(ref.current); return; }
    const tMax = Math.max(...valid.map(p => p.tr)) * 1.45;
    const N = 800;
    const tArr = Array.from({length:N},(_,i)=>i*tMax/(N-1));
    const traces = valid.map(({nom,tr,aire,color}) => {
      const sigma = Math.max(tr*0.04, 0.01);
      const Apeak = aire/(sigma*Math.sqrt(2*Math.PI));
      return {
        x: tArr,
        y: tArr.map(t => Apeak*Math.exp(-0.5*((t-tr)/sigma)**2)),
        mode:'lines', name:nom,
        line:{color, width:2},
        fill:'tozeroy', fillcolor: color+'18',
      };
    });
    Plotly.react(ref.current, traces, {
      xaxis:{title:'t (min)', gridcolor:'rgba(128,128,128,0.12)', zeroline:false, showline:false},
      yaxis:{title:'Réponse', gridcolor:'rgba(128,128,128,0.12)', zeroline:false, showline:false},
      paper_bgcolor:'transparent', plot_bgcolor:'transparent',
      margin:{t:30,r:10,b:45,l:50},
      legend:{bgcolor:'transparent', font:{size:11}},
      font:{size:11},
      title:{text:title, font:{size:12}, x:0.5},
    },{responsive:true, displayModeBar:false});
  },[plotlyReady, JSON.stringify(pics), title]);
  return <div ref={ref} style={{width:'100%',height:240}}/>;
}

// ============================================================
// DONNÉES EXEMPLES
// ============================================================

const EX_EI = {
  eiNom: "Paracétamol",
  eiColor: "#888",
  analytes: [
    {nom:"Hydrobenzoïne", couleur:COMP_COLORS[0]},
    {nom:"Benzoïne",      couleur:COMP_COLORS[1]},
    {nom:"Benzile",       couleur:COMP_COLORS[2]},
  ],
  etalon: {
    CmAnalytes:[10.20,10.59,10.37], CmEI:10.25,
    airesAnalytes:[17.22,20.33,33.20], aireEI:29.25,
    trAnalytes:[1.8,2.4,3.2], trEI:1.2,
  },
  echantillon: {
    airesAnalytes:[26.3,2.4,12.2], aireEI:57.2,
    trAnalytes:[1.8,2.4,3.2], trEI:1.2,
    CmEI:10.25,
    masseEch:101.7, volFiole:20,
    volPrelevement:40, volFioleInjectee:20000,
  },
  description:"Dosage hydrobenzoïne/benzoïne/benzile dans un produit de synthèse. Étalon interne : paracétamol. Aires en % d'aire totale. Source : Révision Analyse n°1, BTS MDC.",
};

const EX_NI = {
  reference: 0,
  composesEtalon:[
    {nom:"Éthanol",           pctMasse:50.1, aire:155000, tr:1.2, couleur:COMP_COLORS[0]},
    {nom:"Toluène",           pctMasse:20.1, aire:527000, tr:2.1, couleur:COMP_COLORS[1]},
    {nom:"Acétate de butyle", pctMasse:29.8, aire:318000, tr:3.0, couleur:COMP_COLORS[2]},
  ],
  composesEch:[
    {aire:62000,  tr:1.2},
    {aire:787000, tr:2.1},
    {aire:534000, tr:3.0},
  ],
  description:"Mélange éthanol/toluène/acétate de butyle analysé par CPG. Espèce de référence : Éthanol. Source : sujet BTS MDC E42, session 2018.",
};

// ============================================================
// ÉTALON INTERNE
// ============================================================


function SectionEtalonInterne({plotlyReady}) {
  const [tab, setTab] = useState('exemple');
  const [eiNom, setEiNom] = useState('Paracétamol');
  const [nA, setNA] = useState(3);
  const MAX_A = 8;

  // Fiole 1 : analytes étalons
  const [etNoms,    setEtNoms]    = useState(Array(MAX_A).fill('').map((_,i)=>`Analyte ${i+1}`));
  const [etMasses,  setEtMasses]  = useState(Array(MAX_A).fill(100));   // masses fiole 1 (mg)
  const [etVolF1,   setEtVolF1]   = useState(20);                        // volume fiole 1 (mL)
  const [etCm,      setEtCm]      = useState(Array(MAX_A).fill(10));     // Cm calculées (affichage)
  const [etAires,   setEtAires]   = useState(Array(MAX_A).fill(0));
  const [etTr,      setEtTr]      = useState(Array(MAX_A).fill(0).map((_,i)=>parseFloat((1+i*0.5).toFixed(1))));
  // Fiole 2 : EI
  const [eiMasse,   setEiMasse]   = useState(100);
  const [eiVolF2,   setEiVolF2]   = useState(20);
  const [etCmEI,    setEtCmEI]    = useState(10);
  const [etAireEI,  setEtAireEI]  = useState(0);
  const [etTrEI,    setEtTrEI]    = useState(0.8);
  // Prélèvement fiole 3
  const [volPrel3,  setVolPrel3]  = useState(40);   // µL de fiole 1
  const [volPrel3b, setVolPrel3b] = useState(40);   // µL de fiole 2
  const [volF3,     setVolF3]     = useState(20);   // mL fiole 3
  // Fiole 4 : échantillon
  const [echNomSolide, setEchNomSolide] = useState('Solide synthétisé');
  const [echMasse,  setEchMasse]  = useState(100);
  const [echVolF4,  setEchVolF4]  = useState(20);
  const [echAires,  setEchAires]  = useState(Array(MAX_A).fill(0));
  const [echTr,     setEchTr]     = useState(Array(MAX_A).fill(0).map((_,i)=>parseFloat((1+i*0.5).toFixed(1))));
  // Prélèvement fiole 5
  const [volPrel5,  setVolPrel5]  = useState(40);   // µL de fiole 4
  const [volPrel5b, setVolPrel5b] = useState(40);   // µL de fiole 2
  const [volF5,     setVolF5]     = useState(20);   // mL fiole 5
  const [echAireEI, setEchAireEI] = useState(0);
  const [echTrEI,   setEchTrEI]   = useState(0.8);

  const isEx = tab === 'exemple';
  const ex = EX_EI;
  const n = isEx ? ex.analytes.length : nA;

  const noms     = isEx ? ex.analytes.map(a=>a.nom)      : etNoms.slice(0,n);
  const colors   = isEx ? ex.analytes.map(a=>a.couleur)  : COMP_COLORS.slice(0,n);
  // Cm analytes dans Fiole 3 calculées automatiquement depuis les masses
  const CmEt_calc = etMasses.slice(0,n).map(m =>
    (m * volPrel3) / (etVolF1 * volF3)
  );
  const CmEt     = isEx ? ex.etalon.CmAnalytes : CmEt_calc;
  const airesEt  = isEx ? ex.etalon.airesAnalytes          : etAires.slice(0,n);
  const trEt     = isEx ? ex.etalon.trAnalytes             : etTr.slice(0,n);
  // Cm EI dans Fiole 3 calculée depuis masse EI
  const CmEI_calc_F3 = (eiMasse * volPrel3b) / (eiVolF2 * volF3);
  const CmEI_calc_F5 = (eiMasse * volPrel5b) / (eiVolF2 * volF5);
  const CmEI_et  = isEx ? ex.etalon.CmEI : CmEI_calc_F3;
  const areEI_et = isEx ? ex.etalon.aireEI                 : etAireEI;
  const trEI_et  = isEx ? ex.etalon.trEI                  : etTrEI;
  const eiLabel  = isEx ? ex.eiNom : eiNom;
  const eiCol    = isEx ? ex.eiColor : '#888';
  const airesEch = isEx ? ex.echantillon.airesAnalytes     : echAires.slice(0,n);
  const trEch    = isEx ? ex.echantillon.trAnalytes        : echTr.slice(0,n);
  const areEI_ech= isEx ? ex.echantillon.aireEI            : echAireEI;
  const trEI_ech = isEx ? ex.echantillon.trEI              : echTrEI;

  // Calcul Cm étalon en saisie manuelle : Cm = (masse/M * M / V_fiole) * dilution
  // Simplifié : Cm_fiole3 = (masse_fiole1_mg / V_fiole1_mL) * (volPrel3_µL / (volF3_mL*1000))^-1 * ...
  // On utilise directement etCm saisi par l'utilisateur pour la fiole 3
  // OU on calcule : Cm_fiole3 = (m_mg / V_fiole1_mL) * (volPrel3/1000) / (volF3/1000)  ... trop complexe sans M
  // → Pour saisie manuelle : l'utilisateur saisit Cm directement dans le tableau (comme avant)

  // Facteur dilution pour masse
  const dilFact  = isEx
    ? ex.echantillon.volPrelevement / ex.echantillon.volFioleInjectee
    : (volPrel5 / 1000) / (volF5 * 1000 / 1000)   // µL → mL / mL
  const volFiole = isEx ? ex.echantillon.volFiole : echVolF4;

  const CmEch = Array(n).fill(null).map((_,i) => {
    if(!airesEt[i]||!areEI_et||!airesEch[i]||!areEI_ech) return null;
    return CmEt[i] * (areEI_et/airesEt[i]) * (airesEch[i]/areEI_ech);
  });
  const masseAnalyte = CmEch.map(cm => {
    if(cm===null) return null;
    if(isEx) return cm * (ex.echantillon.volFiole/1000) / (ex.echantillon.volPrelevement/ex.echantillon.volFioleInjectee);
    // masse = Cm_fiole5 (mg/L) * V_fiole4 (L) / facteur_dilution
    // facteur_dilution = V_prélevé_fiole4(µL) / V_fiole5(µL)
    const df = volPrel5 / (volF5 * 1000);
    return cm * (echVolF4 / 1000) / df;
  });

  const picsEt  = [...noms.map((nom,i)=>({nom,tr:trEt[i], aire:airesEt[i], color:colors[i]})),
                   {nom:eiLabel, tr:trEI_et,  aire:areEI_et,  color:eiCol}];
  const picsEch = [...noms.map((nom,i)=>({nom,tr:trEch[i],aire:airesEch[i],color:colors[i]})),
                   {nom:eiLabel, tr:trEI_ech, aire:areEI_ech, color:eiCol}];

  
  const inp = {fontSize:12,padding:'3px 6px',
  border:'1.5px solid #b39ddb',borderRadius:4,
  background:'#fffde7',color:'var(--color-text-primary)'};
  const inpW = (w) => ({...inp, width:w});

  function setIdx(arr,setArr,i,val,isNum=true){
    const next=[...arr]; next[i]=isNum?(parseFloat(val)||0):val; setArr(next);
  }

  const C_ET  = {bg:'#f3eeff', border:'#6a4c93', text:'#4a2c73', label: isEx ? 'Solution étalon (Fiole 3)' : 'Solution étalon (Fiole 3)'};
  const C_ECH = {bg:'#fffbe6', border:'#e9a824', text:'#9a6000', label: isEx ? 'Solution échantillon (Fiole 5)' : 'Solution échantillon (Fiole 5)'};
  const tdS = {padding:'3px 6px'};

  // Schéma SVG commun (paramétrable)
  function SchemaFioles({
    nomF1=null, massesF1=[], volF1=20,
    nomEI='EI', masseEI=100, volF2=20,
    nomF4='Solide', masseF4=100, volF4=20,
    vp3=40, vp3b=40, vF3=20,
    vp5=40, vp5b=40, vF5=20,
  }) {
    // Cm EI calculée
    const CmEI_calc = (masseEI / volF2).toFixed(2);
    return (
      <svg width="100%" viewBox="0 0 680 230">
        <defs>
          <marker id="arrS" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#6a4c93" strokeWidth="1.5" strokeLinecap="round"/>
          </marker>
          <marker id="arrS2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#2a9d8f" strokeWidth="1.5" strokeLinecap="round"/>
          </marker>
          <marker id="arrS3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#e63946" strokeWidth="1.5" strokeLinecap="round"/>
          </marker>
        </defs>

        {/* ── LIGNE 1 : Fiole 1, Fiole 2, Fiole 4 ── */}
        {/* Fiole 1 */}
        <rect x="10" y="10" width="150" height="90" rx="8" fill="#e8f8f5" stroke="#2a9d8f" strokeWidth="1.5"/>
        <text x="85" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a7a6e">Fiole 1 ({volF1} mL)</text>
        {massesF1.length > 0
          ? massesF1.map((m,i)=>(
              <text key={i} x="85" y={41+i*13} textAnchor="middle" fontSize="10" fill={COMP_COLORS[i]}>{nomF1?.[i]||`Analyte ${i+1}`} : {m} mg</text>
            ))
          : <text x="85" y="55" textAnchor="middle" fontSize="10" fill="#333">Analytes étalons</text>
        }
        <text x="85" y={massesF1.length>0?41+massesF1.length*13:70} textAnchor="middle" fontSize="10" fill="#666">+ éluant qsp {volF1} mL</text>

        {/* Fiole 2 */}
        <rect x="265" y="10" width="150" height="90" rx="8" fill="#f3eeff" stroke="#6a4c93" strokeWidth="2"/>
        <text x="340" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4a2c73">Fiole 2 ({volF2} mL)</text>
        <text x="340" y="44" textAnchor="middle" fontSize="10" fill="#6a4c93">{nomEI} (EI)</text>
        <text x="340" y="58" textAnchor="middle" fontSize="10" fill="#333">{masseEI} mg</text>
        <text x="340" y="72" textAnchor="middle" fontSize="10" fill="#888">→ Cm ≈ {CmEI_calc} mg/mL</text>
        <text x="340" y="86" textAnchor="middle" fontSize="10" fill="#666">+ éluant qsp {volF2} mL</text>

        {/* Fiole 4 */}
        <rect x="520" y="10" width="150" height="90" rx="8" fill="#fff0f5" stroke="#e63946" strokeWidth="1.5"/>
        <text x="595" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a01020">Fiole 4 ({volF4} mL)</text>
        <text x="595" y="44" textAnchor="middle" fontSize="10" fill="#333">{nomF4}</text>
        <text x="595" y="58" textAnchor="middle" fontSize="10" fill="#e63946">{masseF4} mg</text>
        <text x="595" y="74" textAnchor="middle" fontSize="10" fill="#666">+ éluant qsp {volF4} mL</text>

        {/* ── LIGNE 2 : Fiole 3, Fiole 5 ── */}
        {/* Fiole 3 */}
        <rect x="130" y="148" width="150" height="72" rx="8" fill="#fffbe6" stroke="#e9a824" strokeWidth="2"/>
        <text x="205" y="165" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9a6000">Fiole 3 — injectée</text>
        <text x="205" y="180" textAnchor="middle" fontSize="10" fill="#333">Solution étalon</text>
        <text x="205" y="194" textAnchor="middle" fontSize="10" fill="#2a9d8f">Analytes connus</text>
        <text x="205" y="208" textAnchor="middle" fontSize="10" fill="#6a4c93">{nomEI} : connu</text>

        {/* Fiole 5 */}
        <rect x="400" y="148" width="150" height="72" rx="8" fill="#fffbe6" stroke="#e9a824" strokeWidth="2"/>
        <text x="475" y="165" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9a6000">Fiole 5 — injectée</text>
        <text x="475" y="180" textAnchor="middle" fontSize="10" fill="#333">Solution échantillon</text>
        <text x="475" y="194" textAnchor="middle" fontSize="10" fill="#e63946">Analytes : ?</text>
        <text x="475" y="208" textAnchor="middle" fontSize="10" fill="#6a4c93">{nomEI} : connu</text>

        {/* Flèche Fiole 1 → Fiole 3 */}
        <line x1="85" y1="100" x2="175" y2="148" stroke="#2a9d8f" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrS2)"/>
        <text x="108" y="130" textAnchor="middle" fontSize="10" fill="#2a9d8f">{vp3} µL</text>

        {/* Flèche Fiole 2 → Fiole 3 */}
        <line x1="310" y1="100" x2="235" y2="148" stroke="#6a4c93" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrS)"/>
        <text x="295" y="128" textAnchor="middle" fontSize="10" fill="#6a4c93">{vp3b} µL</text>

        {/* Flèche Fiole 2 → Fiole 5 */}
        <line x1="370" y1="100" x2="445" y2="148" stroke="#6a4c93" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrS)"/>
        <text x="385" y="128" textAnchor="middle" fontSize="10" fill="#6a4c93">{vp5b} µL</text>

        {/* Flèche Fiole 4 → Fiole 5 */}
        <line x1="595" y1="100" x2="515" y2="148" stroke="#e63946" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrS3)"/>
        <text x="580" y="128" textAnchor="middle" fontSize="10" fill="#e63946">{vp5} µL</text>

        {/* qsp */}
        <text x="205" y="228" textAnchor="middle" fontSize="9" fill="#aaa" fontStyle="italic">qsp éluant → {vF3} mL</text>
        <text x="475" y="228" textAnchor="middle" fontSize="9" fill="#aaa" fontStyle="italic">qsp éluant → {vF5} mL</text>
      </svg>
    );
  }

  return (
    <div>
      {/* Principe */}
      <div style={{background:'linear-gradient(135deg,#f3eeff,#fffbe6)',border:'1px solid #6a4c9333',
        borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13}}>
        <strong style={{color:'#4a2c73'}}>Principe :</strong>{' '}
        <span style={{color:'var(--color-text-secondary)'}}>
          On ajoute une quantité <em>connue et identique</em> d'étalon interne (EI) dans la solution étalon
          et dans la solution échantillon. Le rapport des aires compense les variations de volume injecté.
        </span>
        <div style={{marginTop:8,color:'#4a2c73',background:'rgba(106,76,147,0.08)',
          borderRadius:6,padding:'10px 14px',display:'flex',alignItems:'center',
          gap:8,flexWrap:'wrap',fontSize:13}}>
          <span>C<sub>analyte,éch</sub> =</span>
          <span>C<sub>analyte,étalon</sub></span>
          <span>×</span>
          <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:0}}>
            <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>A<sub>EI,étalon</sub></span>
            <span style={{paddingTop:1,fontSize:12}}>A<sub>analyte,étalon</sub></span>
          </span>
          <span>×</span>
          <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:0}}>
            <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>A<sub>analyte,éch</sub></span>
            <span style={{paddingTop:1,fontSize:12}}>A<sub>EI,éch</sub></span>
          </span>
        </div>
      </div>

      {/* Onglets */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {[['exemple','Exemple — hydrobenzoïne / benzoïne / benzile'],['manuel','Saisie manuelle']].map(([k,l])=>(
          <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>
        ))}
      </div>

      {/* ══ MODE OPÉRATOIRE ══ */}
      <div style={{marginBottom:16,borderRadius:12,overflow:'hidden',border:'1.5px solid #6a4c93',fontSize:12}}>
        <div style={{background:'#6a4c93',color:'white',fontWeight:600,fontSize:13,padding:'8px 14px'}}>
          Mode opératoire — Préparation des solutions
        </div>
        <div style={{background:'#ffffff',padding:'12px 16px'}}>

          {isEx ? (
            /* Exemple : schéma fixe */
            <SchemaFioles
              nomF1={['Hydrobenzoïne','Benzoïne','Benzile']}
              massesF1={[102.0, 105.9, 103.7]} volF1={20}
              nomEI="Paracétamol" masseEI={102.5} volF2={20}
              nomF4="Solide synthétisé" masseF4={101.7} volF4={20}
              vp3={40} vp3b={40} vF3={20}
              vp5={40} vp5b={40} vF5={20}
            />
          ) : (
            /* Saisie manuelle : schéma avec champs */
            <>
              {/* Paramètres fioles */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>

                {/* Fiole 1 */}
                <div style={{background:'#e8f8f5',border:'1px solid #2a9d8f',borderRadius:10,padding:'10px 12px'}}>
                  <div style={{fontWeight:600,fontSize:12,color:'#1a7a6e',marginBottom:8}}>
                    Fiole 1 — Analytes étalons
                  </div>
                  <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:4}}>Nombre d'analytes</div>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                    <button onClick={()=>setNA(v=>Math.max(1,v-1))}
                      style={{width:28,height:28,borderRadius:6,border:'none',
                        background:'#e63946',color:'white',cursor:'pointer',fontSize:16,fontWeight:'bold',lineHeight:1}}>−</button>
                    <span style={{fontSize:16,fontWeight:700,minWidth:24,textAlign:'center',color:'#1a7a6e'}}>{nA}</span>
                    <button onClick={()=>setNA(v=>Math.min(MAX_A,v+1))}
                      style={{width:28,height:28,borderRadius:6,border:'none',
                        background:'#2a9d8f',color:'white',cursor:'pointer',fontSize:16,fontWeight:'bold',lineHeight:1}}>+</button>
                  </div>
                  {Array(nA).fill(0).map((_,i)=>(
                    <div key={i} style={{display:'flex',gap:4,alignItems:'center',marginBottom:4}}>
                      <input value={etNoms[i]} onChange={e=>setIdx(etNoms,setEtNoms,i,e.target.value,false)}
                        placeholder={`Analyte ${i+1}`}
                        style={{...inpW(90),color:COMP_COLORS[i],fontWeight:500}}/>
                      <input type="number" value={etMasses[i]} onChange={e=>setIdx(etMasses,setEtMasses,i,e.target.value)}
                        style={inpW(55)} placeholder="mg"/>
                      <span style={{fontSize:10,color:'#888'}}>mg</span>
                    </div>
                  ))}
                  <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6}}>
                    <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>Volume fiole (mL)</span>
                    <input type="number" value={etVolF1} onChange={e=>setEtVolF1(parseFloat(e.target.value)||1)} style={inpW(55)}/>
                  </div>
                </div>

                {/* Fiole 2 — EI */}
                <div style={{background:'#f3eeff',border:'1px solid #6a4c93',borderRadius:10,padding:'10px 12px'}}>
                  <div style={{fontWeight:600,fontSize:12,color:'#4a2c73',marginBottom:8}}>
                    Fiole 2 — Étalon interne
                  </div>
                  <Field label="Nom de l'EI" value={eiNom} onChange={setEiNom} width={120} type="text"/>
                  <div style={{marginTop:6,display:'flex',gap:6,flexWrap:'wrap'}}>
                    {[['Masse (mg)',eiMasse,setEiMasse],['Volume fiole (mL)',eiVolF2,setEiVolF2]].map(([l,v,s])=>(
                      <div key={l}>
                        <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>{l}</div>
                        <input type="number" value={v} onChange={e=>s(parseFloat(e.target.value)||0)} style={inpW(70)}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fiole 4 — Échantillon */}
                <div style={{background:'#fff0f5',border:'1px solid #e63946',borderRadius:10,padding:'10px 12px'}}>
                  <div style={{fontWeight:600,fontSize:12,color:'#a01020',marginBottom:8}}>
                    Fiole 4 — Prise d'essai
                  </div>
                  <Field label="Nom du solide" value={echNomSolide} onChange={setEchNomSolide} width={120} type="text"/>
                  <div style={{marginTop:6,display:'flex',gap:6,flexWrap:'wrap'}}>
                    {[['Masse (mg)',echMasse,setEchMasse],['Volume fiole (mL)',echVolF4,setEchVolF4]].map(([l,v,s])=>(
                      <div key={l}>
                        <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>{l}</div>
                        <input type="number" value={v} onChange={e=>s(parseFloat(e.target.value)||0)} style={inpW(70)}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prélèvements */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div style={{background:'#f9f6ff',border:'1px solid #6a4c9344',borderRadius:8,padding:'8px 12px'}}>
                  <div style={{fontWeight:600,fontSize:11,color:'#4a2c73',marginBottom:6}}>Préparation Fiole 3 (étalon)</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',fontSize:11}}>
                    {[['µL de Fiole 1',volPrel3,setVolPrel3],['µL de Fiole 2 (EI)',volPrel3b,setVolPrel3b],['Volume final (mL)',volF3,setVolF3]].map(([l,v,s])=>(
                      <div key={l} style={{display:'flex',flexDirection:'column',gap:2}}>
                        <span style={{color:'var(--color-text-secondary)'}}>{l}</span>
                        <input type="number" value={v} onChange={e=>s(parseFloat(e.target.value)||0)} style={inpW(70)}/>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:'#fffbe6',border:'1px solid #e9a82444',borderRadius:8,padding:'8px 12px'}}>
                  <div style={{fontWeight:600,fontSize:11,color:'#9a6000',marginBottom:6}}>Préparation Fiole 5 (échantillon)</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',fontSize:11}}>
                    {[['µL de Fiole 4',volPrel5,setVolPrel5],['µL de Fiole 2 (EI)',volPrel5b,setVolPrel5b],['Volume final (mL)',volF5,setVolF5]].map(([l,v,s])=>(
                      <div key={l} style={{display:'flex',flexDirection:'column',gap:2}}>
                        <span style={{color:'var(--color-text-secondary)'}}>{l}</span>
                        <input type="number" value={v} onChange={e=>s(parseFloat(e.target.value)||0)} style={inpW(70)}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schéma dynamique */}
              <SchemaFioles
                nomF1={etNoms.slice(0,nA)} massesF1={etMasses.slice(0,nA)} volF1={etVolF1}
                nomEI={eiNom} masseEI={eiMasse} volF2={eiVolF2}
                nomF4={echNomSolide} masseF4={echMasse} volF4={echVolF4}
                vp3={volPrel3} vp3b={volPrel3b} vF3={volF3}
                vp5={volPrel5} vp5b={volPrel5b} vF5={volF5}
              />
            </>
          )}
        </div>
      </div>

      {/* Tableaux étalon / échantillon */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        {/* Étalon */}
        <div style={{background:C_ET.bg,border:`1.5px solid ${C_ET.border}`,borderRadius:12,padding:'14px 16px',minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,color:C_ET.text,marginBottom:10}}>{C_ET.label}</div>
          <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
            <thead>
              <tr>
                {['Composé','Cm (mg/L)','tr (min)','% aire'].map(h=>(
                  <th key={h} style={{padding:'4px 6px',borderBottom:`1px solid ${C_ET.border}44`,
                    textAlign:'left',fontWeight:600,fontSize:11,color:C_ET.text,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {noms.map((nom,i)=>(
                <tr key={i}>
                  <td style={tdS}><span style={{color:colors[i],fontWeight:500}}>{nom}</span></td>
                  <td style={tdS}>
                    {isEx ? <strong style={{color:colors[i]}}>{CmEt[i]}</strong>
                          : <strong style={{color:colors[i]}}>{CmEt_calc[i]?.toFixed(4) ?? '—'}</strong>}
                  </td>
                  <td style={tdS}>
                    {isEx ? trEt[i]
                          : <input type="number" value={etTr[i]} onChange={e=>setIdx(etTr,setEtTr,i,e.target.value)} style={inpW(55)}/>}
                  </td>
                  <td style={tdS}>
                    {isEx ? airesEt[i]
                          : <input type="number" value={etAires[i]} onChange={e=>setIdx(etAires,setEtAires,i,e.target.value)} style={inpW(65)}/>}
                  </td>
                </tr>
              ))}
              <tr style={{background:'rgba(106,76,147,0.07)',fontStyle:'italic'}}>
                <td style={tdS}><span style={{color:'#6a4c93',fontWeight:500}}>{eiLabel} (EI)</span></td>
                <td style={tdS}>
                  {isEx ? <strong style={{color:'#6a4c93'}}>{CmEI_et}</strong>
                        : <input type="number" value={etCmEI} onChange={e=>setEtCmEI(parseFloat(e.target.value)||0)} style={inpW(65)}/>}
                </td>
                <td style={tdS}>
                  {isEx ? trEI_et : <input type="number" value={etTrEI} onChange={e=>setEtTrEI(parseFloat(e.target.value)||0)} style={inpW(55)}/>}
                </td>
                <td style={tdS}>
                  {isEx ? areEI_et : <input type="number" value={etAireEI} onChange={e=>setEtAireEI(parseFloat(e.target.value)||0)} style={inpW(65)}/>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Échantillon */}
        <div style={{background:C_ECH.bg,border:`1.5px solid ${C_ECH.border}`,borderRadius:12,padding:'14px 16px',minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,color:C_ECH.text,marginBottom:10}}>{C_ECH.label}</div>
          <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
            <thead>
              <tr>
                {['Composé','Cm (mg/L)','tr (min)','% aire'].map(h=>(
                  <th key={h} style={{padding:'4px 6px',borderBottom:`1px solid ${C_ECH.border}44`,
                    textAlign:'left',fontWeight:600,fontSize:11,color:C_ECH.text,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {noms.map((nom,i)=>(
                <tr key={i}>
                  <td style={tdS}><span style={{color:colors[i],fontWeight:500}}>{nom}</span></td>
                  <td style={tdS}><span style={{color:'#aaa',fontStyle:'italic'}}>?</span></td>
                  <td style={tdS}>
                    {isEx ? trEch[i] : <input type="number" value={echTr[i]} onChange={e=>setIdx(echTr,setEchTr,i,e.target.value)} style={inpW(55)}/>}
                  </td>
                  <td style={tdS}>
                    {isEx ? airesEch[i] : <input type="number" value={echAires[i]} onChange={e=>setIdx(echAires,setEchAires,i,e.target.value)} style={inpW(65)}/>}
                  </td>
                </tr>
              ))}
              <tr style={{background:'rgba(233,168,36,0.08)',fontStyle:'italic'}}>
                <td style={tdS}><span style={{color:'#e9a824',fontWeight:500}}>{eiLabel} (EI)</span></td>
                <td style={tdS}><strong style={{color:'#e9a824'}}>{isEx ? ex.echantillon.CmEI : CmEI_calc_F5.toFixed(4)}</strong></td>
                <td style={tdS}>
                  {isEx ? trEI_ech : <input type="number" value={echTrEI} onChange={e=>setEchTrEI(parseFloat(e.target.value)||0)} style={inpW(55)}/>}
                </td>
                <td style={tdS}>
                  {isEx ? areEI_ech : <input type="number" value={echAireEI} onChange={e=>setEchAireEI(parseFloat(e.target.value)||0)} style={inpW(65)}/>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Chromatogrammes */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div style={{background:C_ET.bg,border:`1.5px solid ${C_ET.border}`,borderRadius:12,padding:'10px 14px'}}>
          <div style={{fontWeight:600,fontSize:12,color:C_ET.text,marginBottom:4}}>Chromatogramme — Fiole 3 (étalon)</div>
          <ChromatoPlot plotlyReady={plotlyReady} pics={picsEt} title=""/>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
            {picsEt.map(p=>(<span key={p.nom} style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
              <span style={{display:'inline-block',width:18,height:3,borderRadius:2,background:p.color}}/>{p.nom}
            </span>))}
          </div>
        </div>
        <div style={{background:C_ECH.bg,border:`1.5px solid ${C_ECH.border}`,borderRadius:12,padding:'10px 14px'}}>
          <div style={{fontWeight:600,fontSize:12,color:C_ECH.text,marginBottom:4}}>Chromatogramme — Fiole 5 (échantillon)</div>
          <ChromatoPlot plotlyReady={plotlyReady} pics={picsEch} title=""/>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
            {picsEch.map(p=>(<span key={p.nom} style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
              <span style={{display:'inline-block',width:18,height:3,borderRadius:2,background:p.color}}/>{p.nom}
            </span>))}
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div style={{background:'linear-gradient(135deg,#fffbe6,#f3eeff)',
        border:'1.5px solid #6a4c93',borderRadius:12,padding:'16px 18px'}}>
        <div style={{fontWeight:600,fontSize:14,color:'#4a2c73',marginBottom:12}}>Résultats</div>
        <table style={{borderCollapse:'collapse',fontSize:13,width:'100%',maxWidth:600}}>
          <thead>
            <tr style={{background:'rgba(106,76,147,0.1)'}}>
              {['Analyte','Cm solution injectée (mg/L)',"Masse dans la prise d'essai (mg)"].map(h=>(
                <th key={h} style={{padding:'7px 12px',borderBottom:'1.5px solid #6a4c9344',
                  textAlign:'left',fontWeight:600,fontSize:12,color:'#4a2c73'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {noms.map((nom,i)=>{
              const cm=CmEch[i]; const m=masseAnalyte[i];
              return (
                <tr key={i} style={{borderBottom:'1px solid rgba(106,76,147,0.15)'}}>
                  <td style={{padding:'6px 12px'}}>
                    <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',
                      background:colors[i],marginRight:6,verticalAlign:'middle'}}/>
                    <strong style={{color:colors[i]}}>{nom}</strong>
                  </td>
                  <td style={{padding:'6px 12px',fontWeight:500,color:'#4a2c73'}}>
                    {cm!==null ? cm.toFixed(4) : <span style={{color:'#aaa'}}>—</span>}
                  </td>
                  <td style={{padding:'6px 12px',fontWeight:600,color:'#e9a824'}}>
                    {m!==null ? m.toFixed(3)+' mg' : <span style={{color:'#aaa'}}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {isEx && (
          <div style={{fontSize:11,color:'#888',marginTop:10,fontStyle:'italic'}}>
            La masse correspond à la quantité d'analyte présente dans les 101,7 mg de solide analysé (Fiole 4).
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// NORMALISATION INTERNE
// ============================================================

function SectionNormalisationInterne({plotlyReady}) {
  const [tab, setTab] = useState('exemple');
  const [nC, setNC] = useState(3);
  const [refIdx, setRefIdx] = useState(0);
  const MAX_C = 8;

  // Saisie manuelle — étalon
  const [noms,    setNoms]    = useState(Array(MAX_C).fill('').map((_,i)=>`Composé ${i+1}`));
  const [masses,  setMasses]  = useState(Array(MAX_C).fill(100));   // masses pesées (mg)
  const [volEt,   setVolEt]   = useState(10);                        // volume solution étalon (mL)
  const [aEt,     setAEt]     = useState(Array(MAX_C).fill(1000));
  const [trEt,    setTrEt]    = useState(Array(MAX_C).fill(0).map((_,i)=>parseFloat((1+i*0.8).toFixed(1))));
  // Saisie manuelle — échantillon
  const [aEch,    setAEch]    = useState(Array(MAX_C).fill(1000));
  const [trEch,   setTrEch]   = useState(Array(MAX_C).fill(0).map((_,i)=>parseFloat((1+i*0.8).toFixed(1))));

  const isEx = tab === 'exemple';
  const ex = EX_NI;
  const n = isEx ? ex.composesEtalon.length : nC;
  const ref = isEx ? ex.reference : Math.min(refIdx, n-1);

  const nomsList = isEx ? ex.composesEtalon.map(c=>c.nom)     : noms.slice(0,n);
  const colors   = isEx ? ex.composesEtalon.map(c=>c.couleur) : COMP_COLORS.slice(0,n);
  const airesEt  = isEx ? ex.composesEtalon.map(c=>c.aire)    : aEt.slice(0,n);
  const trEtalon = isEx ? ex.composesEtalon.map(c=>c.tr)      : trEt.slice(0,n);
  const airesEch = isEx ? ex.composesEch.map(c=>c.aire)       : aEch.slice(0,n);
  const trEchant = isEx ? ex.composesEch.map(c=>c.tr)         : trEch.slice(0,n);

  // % massiques étalon : calculés depuis les masses pesées en manuel, donnés en exemple
  const masseTotal = masses.slice(0,n).reduce((s,m)=>s+m, 0);
  const pctMasse = isEx
    ? ex.composesEtalon.map(c=>c.pctMasse)
    : masses.slice(0,n).map(m => masseTotal > 0 ? (m/masseTotal)*100 : 0);

  const Ki = Array(n).fill(null).map((_,i) => {
    if(i===ref) return 1;
    if(!airesEt[ref]||!airesEt[i]||!pctMasse[ref]||!pctMasse[i]) return null;
    return (pctMasse[i]/pctMasse[ref])*(airesEt[ref]/airesEt[i]);
  });

  const denom = Array(n).fill(0).reduce((s,_,i) => {
    const k=Ki[i]; const a=airesEch[i];
    return s + (k!==null && a ? k*a : 0);
  }, 0);

  const pctEch = Array(n).fill(null).map((_,i) => {
    const k=Ki[i]; const a=airesEch[i];
    if(k===null||!denom) return null;
    return (k*a/denom)*100;
  });

  const picsEt  = nomsList.map((nom,i)=>({nom, tr:trEtalon[i], aire:airesEt[i],  color:colors[i]}));
  const picsEch = nomsList.map((nom,i)=>({nom, tr:trEchant[i], aire:airesEch[i], color:colors[i]}));

  const inp = {fontSize:12, padding:'3px 6px',
    border:'1.5px solid #b39ddb', borderRadius:4,
    background:'#fffde7', color:'var(--color-text-primary)'};
  const inpW = (w) => ({...inp, width:w});

  function setI(arr,setArr,i,val,isNum=true){
    const next=[...arr]; next[i]=isNum?(parseFloat(val)||0):val; setArr(next);
  }

  const C_ET  = {bg:'#f0f4ff', border:'#6a4c93', text:'#4a2c73'};
  const C_ECH = {bg:'#fff7e6', border:'#e9a824',  text:'#9a6000'};
  const tdS = {padding:'3px 6px'};

  return (
    <div>
      {/* Principe */}
      <div style={{background:'linear-gradient(135deg,#f3eeff,#fffbe6)',
        border:'1px solid #6a4c9333',borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13}}>
        <strong style={{color:'#4a2c73'}}>Principe :</strong>{' '}
        <span style={{color:'var(--color-text-secondary)'}}>
          Un étalon de <em>composition massique connue</em> permet de calculer les coefficients de réponse relatifs K<sub>i/1</sub>.
          On en déduit les pourcentages massiques de chaque composé dans l'échantillon.
        </span>
        <div style={{marginTop:8,color:'#4a2c73',background:'rgba(106,76,147,0.08)',
          borderRadius:6,padding:'10px 14px',fontSize:13}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:10}}>
            <span>K<sub>i/1</sub> =</span>
            <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
              <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>%i<sub>étalon</sub></span>
              <span style={{paddingTop:1,fontSize:12}}>%1<sub>étalon</sub></span>
            </span>
            <span>×</span>
            <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
              <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>A<sub>1,étalon</sub></span>
              <span style={{paddingTop:1,fontSize:12}}>A<sub>i,étalon</sub></span>
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span>%i<sub>éch</sub> =</span>
            <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
              <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>
                K<sub>i/1</sub> × A<sub>i,éch</sub>
              </span>
              <span style={{paddingTop:1,fontSize:12}}>
                A<sub>1,éch</sub> + Σ K<sub>k/1</sub> × A<sub>k,éch</sub>
              </span>
            </span>
            <span>× 100</span>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {[['exemple','Exemple — éthanol / toluène / acétate de butyle (BTS 2018)'],['manuel','Saisie manuelle']].map(([k,l])=>(
          <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>
        ))}
      </div>

      {isEx && (
        <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:12,
          padding:'8px 12px',background:'var(--color-background-secondary)',borderRadius:8}}>
          {ex.description}
        </div>
      )}

      {/* Config saisie manuelle */}
      {!isEx && (
        <div style={{marginBottom:14,borderRadius:12,overflow:'hidden',
          border:'1.5px solid #6a4c93'}}>
          <div style={{background:'#6a4c93',color:'white',fontWeight:600,fontSize:13,padding:'8px 14px'}}>
            Paramètres de la solution étalon
          </div>
          <div style={{background:'#f9f6ff',padding:'12px 16px'}}>
            <div style={{display:'flex',gap:16,alignItems:'flex-start',flexWrap:'wrap',marginBottom:12}}>

              {/* Nombre de composés */}
              <div>
                <div style={{fontSize:12,color:'#4a2c73',fontWeight:500,marginBottom:6}}>Nombre de composés</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button onClick={()=>setNC(v=>Math.max(2,v-1))}
                    style={{width:28,height:28,borderRadius:6,border:'none',
                      background:'#e63946',color:'white',cursor:'pointer',fontSize:16,fontWeight:'bold'}}>−</button>
                  <span style={{fontSize:16,fontWeight:700,minWidth:24,textAlign:'center',color:'#4a2c73'}}>{nC}</span>
                  <button onClick={()=>setNC(v=>Math.min(MAX_C,v+1))}
                    style={{width:28,height:28,borderRadius:6,border:'none',
                      background:'#2a9d8f',color:'white',cursor:'pointer',fontSize:16,fontWeight:'bold'}}>+</button>
                </div>
              </div>

              {/* Composé de référence */}
              <div>
                <div style={{fontSize:12,color:'#4a2c73',fontWeight:500,marginBottom:6}}>Composé de référence ★</div>
                <select value={refIdx} onChange={e=>setRefIdx(Number(e.target.value))}
                  style={{...inp, padding:'4px 8px', width:'auto', background:'#fffde7'}}>
                  {noms.slice(0,nC).map((nm,i)=>(<option key={i} value={i}>{nm||`Composé ${i+1}`}</option>))}
                </select>
              </div>

              {/* Volume solution étalon */}
              <div>
                <div style={{fontSize:12,color:'#4a2c73',fontWeight:500,marginBottom:6}}>Volume solution étalon (mL)</div>
                <input type="number" value={volEt} onChange={e=>setVolEt(parseFloat(e.target.value)||1)}
                  style={inpW(80)}/>
              </div>
            </div>

            {/* Tableau masses */}
            <div style={{fontSize:12,color:'#4a2c73',fontWeight:500,marginBottom:6}}>
              Masses pesées — solution étalon
            </div>
            <table style={{borderCollapse:'collapse',fontSize:12,width:'100%',maxWidth:500}}>
              <thead>
                <tr>
                  {['Composé','Masse pesée (mg)','% massique calculé'].map(h=>(
                    <th key={h} style={{padding:'4px 8px',borderBottom:'1px solid #6a4c9344',
                      textAlign:'left',fontWeight:600,fontSize:11,color:'#4a2c73'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {noms.slice(0,nC).map((nom,i)=>(
                  <tr key={i} style={{background:i===refIdx?'rgba(106,76,147,0.08)':'transparent'}}>
                    <td style={tdS}>
                      <input value={noms[i]} onChange={e=>setI(noms,setNoms,i,e.target.value,false)}
                        style={{...inpW(110), color:COMP_COLORS[i], fontWeight:500}}
                        placeholder={`Composé ${i+1}`}/>
                      {i===refIdx && <span style={{marginLeft:4,color:'#6a4c93'}}>★</span>}
                    </td>
                    <td style={tdS}>
                      <input type="number" value={masses[i]}
                        onChange={e=>setI(masses,setMasses,i,e.target.value)}
                        style={inpW(80)}/>
                    </td>
                    <td style={{padding:'3px 8px',fontWeight:500,color:COMP_COLORS[i]}}>
                      {masseTotal > 0 ? ((masses[i]/masseTotal)*100).toFixed(2)+' %' : '—'}
                    </td>
                  </tr>
                ))}
                <tr style={{background:'rgba(106,76,147,0.05)',fontWeight:600}}>
                  <td style={{padding:'4px 8px',color:'#4a2c73'}}>Total</td>
                  <td style={{padding:'4px 8px',color:'#4a2c73'}}>{masseTotal.toFixed(1)} mg</td>
                  <td style={{padding:'4px 8px',color:'#2a9d8f'}}>100,00 %</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deux grilles étalon / échantillon */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>

        {/* Étalon */}
        <div style={{background:C_ET.bg,border:`1.5px solid ${C_ET.border}`,borderRadius:12,padding:'14px 16px',minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,color:C_ET.text,marginBottom:10}}>
            Étalon <span style={{fontWeight:400,fontSize:11}}>(composition connue)</span>
          </div>
          <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
            <thead>
              <tr>
                {['Composé','% masse','tr (min)','Aire'].map(h=>(
                  <th key={h} style={{padding:'4px 6px',borderBottom:`1px solid ${C_ET.border}44`,
                    textAlign:'left',fontWeight:600,fontSize:11,color:C_ET.text,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nomsList.map((nom,i)=>(
                <tr key={i} style={{background:i===ref?'rgba(106,76,147,0.08)':'transparent'}}>
                  <td style={tdS}>
                    <span style={{color:colors[i],fontWeight:500}}>
                      {nom}{i===ref?' ★':''}
                    </span>
                  </td>
                  <td style={tdS}>
                    <strong style={{color:colors[i]}}>{pctMasse[i].toFixed(2)} %</strong>
                  </td>
                  <td style={tdS}>
                    {isEx ? trEtalon[i]
                          : <input type="number" value={trEt[i]} onChange={e=>setI(trEt,setTrEt,i,e.target.value)} style={inpW(50)}/>}
                  </td>
                  <td style={tdS}>
                    {isEx ? airesEt[i].toLocaleString('fr-FR')
                          : <input type="number" value={aEt[i]} onChange={e=>setI(aEt,setAEt,i,e.target.value)} style={inpW(70)}/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Échantillon */}
        <div style={{background:C_ECH.bg,border:`1.5px solid ${C_ECH.border}`,borderRadius:12,padding:'14px 16px',minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,color:C_ECH.text,marginBottom:10}}>
            Échantillon <span style={{fontWeight:400,fontSize:11}}>(composition inconnue)</span>
          </div>
          <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
            <thead>
              <tr>
                {['Composé','% masse','tr (min)','Aire'].map(h=>(
                  <th key={h} style={{padding:'4px 6px',borderBottom:`1px solid ${C_ECH.border}44`,
                    textAlign:'left',fontWeight:600,fontSize:11,color:C_ECH.text,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nomsList.map((nom,i)=>(
                <tr key={i}>
                  <td style={tdS}><span style={{color:colors[i],fontWeight:500}}>{nom}</span></td>
                  <td style={tdS}><span style={{color:'#aaa',fontStyle:'italic'}}>?</span></td>
                  <td style={tdS}>
                    {isEx ? trEchant[i]
                          : <input type="number" value={trEch[i]} onChange={e=>setI(trEch,setTrEch,i,e.target.value)} style={inpW(50)}/>}
                  </td>
                  <td style={tdS}>
                    {isEx ? airesEch[i].toLocaleString('fr-FR')
                          : <input type="number" value={aEch[i]} onChange={e=>setI(aEch,setAEch,i,e.target.value)} style={inpW(70)}/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chromatogrammes */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div style={{background:C_ET.bg,border:`1.5px solid ${C_ET.border}`,borderRadius:12,padding:'10px 14px'}}>
          <div style={{fontWeight:600,fontSize:12,color:C_ET.text,marginBottom:4}}>Chromatogramme étalon</div>
          <ChromatoPlot plotlyReady={plotlyReady} pics={picsEt} title=""/>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
            {picsEt.map(p=>(<span key={p.nom} style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
              <span style={{display:'inline-block',width:18,height:3,borderRadius:2,background:p.color}}/>{p.nom}
            </span>))}
          </div>
        </div>
        <div style={{background:C_ECH.bg,border:`1.5px solid ${C_ECH.border}`,borderRadius:12,padding:'10px 14px'}}>
          <div style={{fontWeight:600,fontSize:12,color:C_ECH.text,marginBottom:4}}>Chromatogramme échantillon</div>
          <ChromatoPlot plotlyReady={plotlyReady} pics={picsEch} title=""/>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
            {picsEch.map(p=>(<span key={p.nom} style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
              <span style={{display:'inline-block',width:18,height:3,borderRadius:2,background:p.color}}/>{p.nom}
            </span>))}
          </div>
        </div>
      </div>

      {/* Coefficients Ki */}
      <div style={{background:'linear-gradient(135deg,#f3eeff,#fff)',
        border:'1.5px solid #6a4c93',borderRadius:12,padding:'14px 18px',marginBottom:14}}>
        <div style={{fontWeight:600,fontSize:13,color:'#4a2c73',marginBottom:10}}>
          Coefficients de réponse relatifs K<sub>i</sub>/{nomsList[ref]?.split(' ')[0]}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {nomsList.map((nom,i)=>(
            <div key={i} style={{background:'rgba(106,76,147,0.08)',borderRadius:8,
              padding:'6px 14px',fontSize:12,border:'1px solid #6a4c9322'}}>
              <span style={{color:'#4a2c73'}}>
                K<sub>{nom.split(' ')[0]}/{nomsList[ref]?.split(' ')[0]}</sub> ={' '}
              </span>
              <strong style={{color:colors[i]}}>
                {Ki[i]!==null ? Ki[i].toFixed(4) : '—'}{i===ref?' (réf.)':''}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Résultats */}
      <div style={{background:'linear-gradient(135deg,#fffbe6,#fff8f0)',
        border:'1.5px solid #e9a824',borderRadius:12,padding:'16px 18px'}}>
        <div style={{fontWeight:600,fontSize:14,color:'#9a6000',marginBottom:12}}>
          Résultats — % massiques dans l'échantillon
        </div>
        <table style={{borderCollapse:'collapse',fontSize:13,width:'100%',maxWidth:400}}>
          <thead>
            <tr style={{background:'rgba(233,168,36,0.1)'}}>
              {['Composé','% massique calculé'].map(h=>(
                <th key={h} style={{padding:'7px 12px',borderBottom:'1.5px solid #e9a82444',
                  textAlign:'left',fontWeight:600,fontSize:12,color:'#9a6000'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nomsList.map((nom,i)=>(
              <tr key={i} style={{borderBottom:'1px solid rgba(233,168,36,0.15)'}}>
                <td style={{padding:'6px 12px'}}>
                  <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',
                    background:colors[i],marginRight:6,verticalAlign:'middle'}}/>
                  <strong style={{color:colors[i]}}>{nom}</strong>
                </td>
                <td style={{padding:'6px 12px',fontWeight:600,color:pctEch[i]!==null?'#e9a824':'#aaa'}}>
                  {pctEch[i]!==null ? pctEch[i].toFixed(2)+' %' : '—'}
                </td>
              </tr>
            ))}
            <tr style={{background:'rgba(233,168,36,0.1)'}}>
              <td style={{padding:'6px 12px',fontWeight:600,color:'#9a6000'}}>Somme</td>
              <td style={{padding:'6px 12px',fontWeight:700,color:pctEch.every(p=>p!==null)?'#2a9d8f':'#aaa'}}>
                {pctEch.every(p=>p!==null)
                  ? pctEch.reduce((s,p)=>s+p,0).toFixed(2)+' %'
                  : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

function SimulationEtalonnageInterne({ plotlyReady }) {
  const [methode, setMethode] = useState('ei');
  return (
    <div style={cardStyle}>
      <h2 style={{marginTop:0,fontSize:18,color:'var(--color-text-primary)'}}>
        Méthodes d'étalonnage interne — Niveau BTS
      </h2>
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        {[
          ['ei','📌 Étalon interne (EI)','Ajout d\'un composé étalon à concentration connue dans chaque solution','#2a9d8f','#e8f8f5','#1a7a6e'],
          ['ni','🔄 Normalisation interne (NI)','Étalon de composition connue — calcul de coefficients de réponse relatifs','#6a4c93','#f3eeff','#4a2c73'],
        ].map(([k,l,desc,col,bg,txt])=>(
          <button key={k} onClick={()=>setMethode(k)}
            style={{padding:'12px 20px',fontSize:14,borderRadius:10,cursor:'pointer',
              fontWeight:600,textAlign:'left',flex:'1 1 200px',
              border:methode===k?`2px solid ${col}`:`1px solid var(--color-border-secondary)`,
              background:methode===k?bg:'var(--color-background-secondary)',
              color:methode===k?txt:'var(--color-text-secondary)',
              transition:'all 0.15s'}}>
            <div>{l}</div>
            <div style={{fontSize:11,fontWeight:400,marginTop:3,opacity:0.8}}>{desc}</div>
          </button>
        ))}
      </div>
      <hr style={{margin:'0 0 20px',borderColor:'var(--color-border-tertiary)'}}/>
      {methode==='ei' && <SectionEtalonInterne plotlyReady={plotlyReady}/>}
      {methode==='ni' && <SectionNormalisationInterne plotlyReady={plotlyReady}/>}
    </div>
  );
}


// ============================================================
//  MENU — modifiez les noms et icônes ici
// ============================================================

const SIMULATIONS = [
  { id: 1, label: "Avancement d'une réaction", icon: "⚗️", color: "#2a9d8f", component: Simulation1, niveau: "1G" },
  { id: 2, label: "Titrage volumétrique",       icon: "🧪", color: "#e63946", component: Simulation2, niveau: "1G" },
  { id: 3, label: "Titrages électrochimiques",  icon: "⚡", color: "#e9a824", component: Simulation3, niveau: "BTS" },
  { id: 4, label: "Diagramme de Hansen",         icon: "🔵", color: "#6a4c93", component: Simulation4, niveau: "BTS" },
  { id: 5, label: "Régulation de niveau",        icon: "⚙️", color: "#2a6099", component: Simulation5, niveau: "TSTL" },
  { id: 6, label: "Point de fonctionnement", icon: "📈", color: "#e76f51", component: Simulation6, niveau: "TSTL" },
  { id: 7, label: "Cristallisation", icon: "❄️", color: "#0096c7", component: Simulation7, niveau: "TSTL" },
  { id: 8, label: "Chaîne de mesure", icon: "💡", color: "#f4a261", component: Simulation8, niveau: "TSTL" },
  { id: 9, label: "Étude inter-laboratoire", icon: "📊", color: "#c0392b", component: Simulation9, niveau: "BTS" },
  { id: 10, label: "Beer-Lambert",  icon: "🌈", color: "#1a7abf", component: BeerLambert1G,  niveau: "1G"  },
  { id: 11, label: "Dosage par étalonnage", icon: "📐", color: "#7b2d8b", component: BeerLambertBTS, niveau: "BTS" },
  { id: 12, label: "Simulation CLHP", icon: "💉", color: "#0d6e6e", component: SimulationCLHP, niveau: "BTS" },
  { id: 13, label: "Étalon interne / Normalisation interne", icon: "📐", color: "#c0392b", component: SimulationEtalonnageInterne, niveau: "BTS" },
];

const NIVEAUX = [
  { label: "1G",   key: "1G",   color: "#2a9d8f" },
  { label: "TSTL", key: "TSTL", color: "#2a6099" },
  { label: "BTS",  key: "BTS",  color: "#6a4c93" },
];

// ============================================================
//  PAGE D'ACCUEIL
// ============================================================

function PageAccueil({ onStart }) {
  const cardA = {
    background: "white",
    borderRadius: 14,
    padding: "20px 24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    border: "1px solid #eee",
  };

  const simulations = [
    { niveau:"1G", color:"#2a9d8f", sims:[
      { icon:"⚗️", label:"Avancement d'une réaction", desc:"Modélisation de l'avancement d'une réaction chimique avec histogrammes et courbes continues." },
      { icon:"🧪", label:"Titrage volumétrique", desc:"Simulation d'un titrage avec bécher animé, agitateur magnétique et courbes en temps réel." },
      { icon:"🌈", label:"Beer-Lambert", desc:"Schéma animé du spectrophotomètre, spectre UV-visible interactif et courbe d'étalonnage." },
    ]},
    { niveau:"TSTL", color:"#e9a824", sims:[
      { icon:"⚙️", label:"Régulation de niveau", desc:"Régulations TOR, P et PI d'un réservoir avec animations en temps réel." },
      { icon:"📈", label:"Point de fonctionnement", desc:"Caractéristique statique d'un procédé et point de fonctionnement d'une régulation P." },
      { icon:"❄️", label:"Cristallisation", desc:"Cristallisation par refroidissement ou évaporation avec animation du bécher." },
      { icon:"💡", label:"Chaîne de mesure", desc:"Capteur de lumière Arduino — photorésistance, conditionneur, CAN et algorithme de contrôle." },
    ]},
    { niveau:"BTS", color:"#6a4c93", sims:[
      { icon:"⚡", label:"Titrages électrochimiques", desc:"Potentiométrie, ampérométrie — courbes i=f(E) et suivi du titrage." },
      { icon:"🔵", label:"Diagramme de Hansen", desc:"Sphère de Hansen, solubilité des polymères, optimisation de mélanges de solvants." },
      { icon:"📊", label:"Étude inter-laboratoire", desc:"Tests de Cochran et Grubbs, fidélité inter-laboratoires selon les normes ISO." },
      { icon:"📐", label:"Dosage par étalonnage", desc:"Courbe d'étalonnage, résidus, LD/LQ et test de Fisher-Snedecor pour la linéarité." },
      { icon:"💉", label:"Simulation CLHP", desc:"Chromatogrammes en phase inverse — influence du logP, de l'éluant et de la colonne sur la séparation." },
      { icon:"📐", label:"Étalon interne / Normalisation interne", desc:"Exploitation de chromatogrammes par méthode de l'étalon interne ou de la normalisation interne." },
    ]},
  ];

  return (
    <div style={{display:"flex", flexDirection:"column", gap:24,
      fontFamily:"Inter, system-ui, Arial", maxWidth:900, margin:"0 auto"}}>

      {/* Hero */}
      <div style={{...cardA, background:"linear-gradient(135deg, #2a9d8f15, #e9a82415)",
        borderColor:"#2a9d8f33", textAlign:"center", padding:"32px 24px"}}>
        <div style={{fontSize:48, marginBottom:20}}>⚗️🧪🔬</div>
        <h2 style={{fontSize:24, fontWeight:700, color:"#222", margin:"0 0 12px"}}>
          Labo Chimie & Physique
        </h2>
        <p style={{fontSize:15, color:"#555", lineHeight:1.7, maxWidth:600, margin:"0 auto 20px"}}>
          Un ensemble de simulations interactives pour explorer la chimie (et un peu la physique),
          conçues pour les niveaux 1G spé PC, TSTL et BTS Métiers de la Chimie.
        </p>
        <button onClick={()=>onStart(1)} style={{
          padding:"10px 28px", borderRadius:8, border:"none",
          background:"#2a9d8f", color:"white", fontSize:15,
          fontWeight:700, cursor:"pointer",
          boxShadow:"0 4px 14px #2a9d8f44"
        }}>
          Explorer les simulations →
        </button>
      </div>

      {/* Simulations par niveau */}
      {simulations.map(({niveau, color, sims}) => sims.length > 0 && (
        <div key={niveau}>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
            <div style={{height:3, width:28, borderRadius:2, background:color}}/>
            <span style={{fontSize:13, fontWeight:700, color, textTransform:"uppercase",
              letterSpacing:"0.1em"}}>
              Niveau {niveau}
            </span>
            <div style={{flex:1, height:1, background:"#eee"}}/>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",
            gap:12}}>
            {sims.map(({icon, label, desc}) => {
              const sim = SIMULATIONS.find(s => s.label === label);
              return (
                <div key={label}
                  onClick={() => sim && onStart(sim.id)}
                  style={{...cardA,
                    borderLeft:`3px solid ${color}`,
                    transition:"transform 0.15s, box-shadow 0.15s",
                    cursor: sim ? "pointer" : "default"
                  }}
                  onMouseEnter={e=>{
                    e.currentTarget.style.transform="translateY(-2px)";
                    e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.transform="translateY(0)";
                    e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.07)";
                  }}>
                  <div style={{fontSize:24, marginBottom:6}}>{icon}</div>
                  <div style={{fontWeight:700, fontSize:14, color:"#222", marginBottom:4}}>{label}</div>
                  <div style={{fontSize:12, color:"#777", lineHeight:1.6}}>{desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Sources et crédits */}
      <div style={{...cardA, background:"#f8f8f8", borderColor:"#e0e0e0"}}>
        <div style={{fontWeight:700, fontSize:15, color:"#333", marginBottom:14}}>
          📚 Sources & inspirations
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:12, fontSize:13, color:"#555", lineHeight:1.7}}>
          <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
            <span style={{fontSize:20, flexShrink:0}}>🎨</span>
            <div>
              <strong style={{color:"#333"}}>Marc-Olivier REULA</strong>
              {" "}— Enseignant en BTS Métiers de la Chimie à l'ENCPB (Paris).
              Source d'inspiration pour la conception de ce site, auteur de simulations
              pédagogiques interactives :{" "}
              <a href="https://marcoprofparis.github.io/couleur/" target="_blank"
                style={{color:"#2a9d8f", textDecoration:"none", fontWeight:600}}>Couleur</a>
              {" · "}
              <a href="https://marcoprofparis.github.io/rheologie/" target="_blank"
                style={{color:"#2a9d8f", textDecoration:"none", fontWeight:600}}>Rhéologie & Mouillage</a>
            </div>
          </div>
          <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
            <span style={{fontSize:20, flexShrink:0}}>🚀</span>
            <div>
              <strong style={{color:"#333"}}>Xavier BATAILLE</strong>
              {" "}— Enseignant en BTS Métiers de la Chimie à l'ENCPB (Paris).
              La simulation de la CLHP repose entièrement sur un fichier excel qu'il a lui même créé et aimablement partagé à ses collègues de BTS 🙂 
            </div>
          </div>
          <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
            <span style={{fontSize:20, flexShrink:0}}>⚡</span>
            <div>
              <strong style={{color:"#333"}}>Jean LAMERENX</strong>
              {" "}— Enseignant en CPGE au lycée Louis-le-Grand (Paris).
              Les courbes i = f(E) de la simulation "Titrages électrochimiques" ont été
              codées initialement en Python et aimablement partagées à l'occasion des{" "}
              <strong>JIREC 2024</strong>.
            </div>
          </div>
          <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
            <span style={{fontSize:20, flexShrink:0}}>🤖</span>
            <div>
              <strong style={{color:"#333"}}>Claude (Anthropic)</strong>
              {" "}— L'ensemble des simulations a été développé par itérations
              successives en collaboration avec Claude, assistant IA d'Anthropic,
              à partir de discussions, de codes Python existants et de quelques idées pédagogiques plus ou moins pertinentes!
            </div>
          </div>
        </div>
      </div>

      <div style={{textAlign:"center", fontSize:12, color:"#aaa", paddingBottom:16}}>
        Labo Chimie & Physique — Simulations interactives pédagogiques
      </div>
    </div>
  );
}

// ============================================================
//  COMPOSANT PRINCIPAL
// ============================================================
export default function App() {
  // Lecture de l'URL au démarrage : ?sim=11
  const getInitialId = () => {
    const params = new URLSearchParams(window.location.search);
    const simParam = params.get('sim');
    if (simParam) {
      const id = parseInt(simParam);
      if (SIMULATIONS.find(s => s.id === id)) return id;
    }
    return 0;
  };

  const [activeId, setActiveId] = useState(getInitialId);
  const active = SIMULATIONS.find(s => s.id === activeId) || SIMULATIONS[0];
  const ActiveComponent = active.component;
  const [expanded, setExpanded] = useState({ "1G": true, "TSTL": true, "BTS": true });
  const [plotlyReady, setPlotlyReady] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');

  // Plotly ready (un seul useEffect)
  useEffect(() => {
    const check = setInterval(() => {
      if (window.Plotly) {
        setPlotlyReady(true);
        clearInterval(check);
      }
    }, 100);
    return () => clearInterval(check);
  }, []);

  // Mise à jour de l'URL quand on change de simulation
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeId === 0) {
      url.searchParams.delete('sim');
    } else {
      url.searchParams.set('sim', activeId);
    }
    window.history.replaceState(null, '', url.toString());
  }, [activeId]);

  // Copier le lien de partage
  function partager() {
    const url = new URL(window.location.href);
    if (activeId > 0) url.searchParams.set('sim', activeId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopyMsg('Lien copié !');
      setTimeout(() => setCopyMsg(''), 2000);
    });
  }

  return (
    <div style={styles.root}>
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={{ fontSize: "2.2rem" }}>⚛️</div>
          <div>
            <div style={styles.siteTitle}>Labo Chimie (et un peu Physique!)</div>
            <div style={styles.siteSub}>Simulations interactives</div>
            <div style={{fontSize:"0.72rem", color:"#aaa", fontStyle:"italic", fontFamily:"'Outfit', sans-serif"}}>par Nils ARONSSOHN, enseignant au lycée Argouges de Grenoble</div>
          </div>
        </div>
        <div style={styles.divider} />
        <button onClick={() => setActiveId(0)} style={{
            ...styles.navBtn,
            background: activeId === 0 ? "#2a9d8f" : "transparent",
            color: activeId === 0 ? "#fff" : "#444",
            boxShadow: activeId === 0 ? "0 4px 18px #2a9d8f55" : "none",
            transform: activeId === 0 ? "translateX(4px)" : "translateX(0)",
            marginBottom: 8,
          }}>
            <span style={{ fontSize: "1.3rem" }}>🏠</span>
            <span style={{ flex: 1 }}>Accueil</span>
            {activeId === 0 && <span style={{ fontSize: "1.4rem", opacity: 0.8 }}>›</span>}
          </button>
          <div style={styles.divider}/>
        <nav style={styles.nav}>
          {NIVEAUX.map(niv => {
            const simsNiv = SIMULATIONS.filter(s => s.niveau === niv.key);
            const isExpanded = expanded[niv.key];
            return (
              <div key={niv.key}>
                <button onClick={() => setExpanded(prev => ({...prev, [niv.key]: !prev[niv.key]}))}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    width:"100%", padding:"0.5rem 0.75rem", border:"none",
                    background:"transparent", cursor:"pointer",
                    borderRadius:"8px", marginBottom:"0.2rem",
                  }}>
                  <span style={{
                    fontSize:"0.72rem", fontWeight:"800", letterSpacing:"0.1em",
                    textTransform:"uppercase", color: niv.color
                  }}>
                    {niv.label}
                  </span>
                  <span style={{fontSize:"0.8rem", color:niv.color, transition:"transform 0.2s",
                    display:"inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)"}}>
                    ›
                  </span>
                </button>

                {isExpanded && simsNiv.map(sim => {
                  const isActive = sim.id === activeId;
                  return (
                    <button key={sim.id} onClick={() => setActiveId(sim.id)} style={{
                      ...styles.navBtn,
                      marginLeft:"0.5rem",
                      background: isActive ? sim.color : "transparent",
                      color: isActive ? "#fff" : "#444",
                      boxShadow: isActive ? `0 4px 18px ${sim.color}55` : "none",
                      transform: isActive ? "translateX(4px)" : "translateX(0)",
                      fontSize:"0.85rem",
                    }}>
                      <span style={{fontSize:"1.1rem"}}>{sim.icon}</span>
                      <span style={{flex:1}}>{sim.label}</span>
                      {isActive && <span style={{fontSize:"1.2rem", opacity:0.8}}>›</span>}
                    </button>
                  );
                })}

                <div style={{height:"1px", background:"linear-gradient(to right, #e0e0e0, transparent)", margin:"0.5rem 0"}}/>
              </div>
            );
          })}
        </nav>

        {/* Contact */}
        <div style={{paddingTop:"1rem"}}>
          <div style={{height:"1px", background:"linear-gradient(to right, #e0e0e0, transparent)", marginBottom:"0.75rem"}}/>
          <a href="mailto:nils.aronssohn@ac-grenoble.fr"
            style={{display:"flex", alignItems:"center", gap:"0.5rem",
              fontSize:"0.85rem", color:"#888", textDecoration:"none",
              padding:"0.6rem 1rem", borderRadius:"12px", transition:"all 0.2s",
              fontWeight:"600", fontFamily:"'Nunito', sans-serif"}}
            onMouseEnter={e=>{e.currentTarget.style.color="#e63946"; e.currentTarget.style.background="#fff0f0"}}
            onMouseLeave={e=>{e.currentTarget.style.color="#888"; e.currentTarget.style.background="transparent"}}>
            ✉️ Contact
          </a>
        </div>

        <div style={styles.sidebarFooter}></div>
      </aside>

      <main style={styles.main}>
        {/* Barre du haut */}
        <div style={{
          ...styles.topBar,
          background: activeId === 0
            ? "linear-gradient(135deg, #2a9d8f22, #2a9d8f08)"
            : `linear-gradient(135deg, ${active.color}22, ${active.color}08)`,
          borderBottom: `3px solid ${activeId === 0 ? "#2a9d8f" : active.color}`
        }}>
          <span style={{ fontSize: "2rem" }}>{activeId === 0 ? "🏠" : active.icon}</span>
          <h1 style={{ ...styles.pageTitle, color: activeId === 0 ? "#2a9d8f" : active.color, flex: 1 }}>
            <span style={{fontFamily:"'Outfit', sans-serif", fontWeight:800, letterSpacing:"-0.5px"}}>
              {activeId === 0 ? "Bienvenue !" : active.label}
            </span>
          </h1>

          {/* Bouton Partager — visible uniquement sur une simulation */}
          {activeId > 0 && (
            <button onClick={partager} style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"6px 14px", borderRadius:8, border:"none",
              background: copyMsg ? "#2a9d8f" : "#f0f0f0",
              color: copyMsg ? "white" : "#555",
              fontSize:13, fontWeight:600, cursor:"pointer",
              transition:"all 0.2s", fontFamily:"'Nunito', sans-serif",
              whiteSpace:"nowrap",
            }}>
              {copyMsg ? '✓ ' + copyMsg : '🔗 Partager'}
            </button>
          )}
        </div>

        <div style={styles.simContainer}>
          {activeId === 0
            ? <PageAccueil onStart={(id) => setActiveId(id || 1)} />
            : <ActiveComponent key={activeId} plotlyReady={plotlyReady} />}
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
  siteTitle: { fontFamily: "'Outfit', sans-serif", fontSize: "1.15rem", fontWeight: "800", color: "#222", lineHeight: 1.2, letterSpacing:"-0.3px" },
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
