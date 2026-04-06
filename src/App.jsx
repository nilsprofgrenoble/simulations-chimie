import { useState, useEffect, useRef, useMemo } from "react"

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
  const H0      = 5;    // cm
  const Hcons   = 30;   // cm
  const Qmin    = 0;    // L/h
  const Qmax    = 200;  // L/h

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
                  <span style={labelStyle}>Rayon robinet de puisage (m)</span>
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
              {(() => {
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
    if (N < algoN1 && algoEtat1 === "HIGH") setPharesEtat("ON");
    if (N > algoN2 && algoEtat2 === "LOW")  setPharesEtat("OFF");
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
                  <span style={{color:"#cba6f7"}}> alors </span>sortie 11 =&nbsp;
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
                  <span style={{color:"#cba6f7"}}> alors </span>sortie 11 =&nbsp;
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
    ]},
    { niveau:"TSTL", color:"#e9a824", sims:[
      { icon:"⚡", label:"Titrages électrochimiques", desc:"Potentiométrie, ampérométrie — courbes i=f(E) et suivi du titrage." },
      { icon:"🔵", label:"Diagramme de Hansen", desc:"Sphère de Hansen, solubilité des polymères, optimisation de mélanges de solvants." },
      { icon:"⚙️", label:"Régulation de niveau", desc:"Régulations TOR, P et PI d'un réservoir avec animations en temps réel." },
      { icon:"📈", label:"Point de fonctionnement", desc:"Caractéristique statique d'un procédé et point de fonctionnement d'une régulation P." },
      { icon:"❄️", label:"Cristallisation", desc:"Cristallisation par refroidissement ou évaporation avec animation du bécher." },
      { icon:"💡", label:"Chaîne de mesure", desc:"Capteur de lumière Arduino — photorésistance, conditionneur, CAN et algorithme de contrôle." },
    ]},
    { niveau:"BTS", color:"#6a4c93", sims:[]},
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
        <button onClick={onStart} style={{
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
            {sims.map(({icon, label, desc}) => (
              <div key={label} style={{...cardA,
                borderLeft:`3px solid ${color}`,
                transition:"transform 0.15s, box-shadow 0.15s",
                cursor:"default"
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.07)";}}>
                <div style={{fontSize:24, marginBottom:6}}>{icon}</div>
                <div style={{fontWeight:700, fontSize:14, color:"#222", marginBottom:4}}>{label}</div>
                <div style={{fontSize:12, color:"#777", lineHeight:1.6}}>{desc}</div>
              </div>
            ))}
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
                style={{color:"#2a9d8f", textDecoration:"none", fontWeight:600}}>
                Couleur
              </a>
              {" · "}
              <a href="https://marcoprofparis.github.io/rheologie/" target="_blank"
                style={{color:"#2a9d8f", textDecoration:"none", fontWeight:600}}>
                Rhéologie & Mouillage
              </a>
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

      {/* Footer */}
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
  const [activeId, setActiveId] = useState(0);
  const active = SIMULATIONS.find(s => s.id === activeId) || SIMULATIONS[0];
  const ActiveComponent = active.component;
  const [expanded, setExpanded] = useState({ "1G": true, "TSTL": true, "BTS": true });
  const [plotlyReady, setPlotlyReady] = useState(false);

  useEffect(() => {
    const check = setInterval(() => {
      if (window.Plotly) {
        setPlotlyReady(true);
        clearInterval(check);
      }
    }, 100);
    return () => clearInterval(check);
  }, []);
  

  useEffect(() => {
    const check = setInterval(() => {
      if (window.Plotly) {
        setPlotlyReady(true);
        clearInterval(check);
      }
    }, 100);
    return () => clearInterval(check);
  }, []);
  
  return (
    <div style={styles.root}>
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={{ fontSize: "2.2rem" }}>⚛️</div>
          <div>
            <div style={styles.siteTitle}>Labo Chimie et Physique</div>
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
                {/* En-tête section */}
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

                {/* Simulations de ce niveau */}
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

                {/* Séparateur entre niveaux */}
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
        <div style={{
          ...styles.topBar,
          background: activeId === 0
            ? "linear-gradient(135deg, #2a9d8f22, #2a9d8f08)"
            : `linear-gradient(135deg, ${active.color}22, ${active.color}08)`,
          borderBottom: `3px solid ${activeId === 0 ? "#2a9d8f" : active.color}`
        }}>
          <span style={{ fontSize: "2rem" }}>{activeId === 0 ? "🏠" : active.icon}</span>
          <h1 style={{ ...styles.pageTitle, color: activeId === 0 ? "#2a9d8f" : active.color }}>
            <span style={{fontFamily:"'Outfit', sans-serif", fontWeight:800, letterSpacing:"-0.5px"}}>
              {activeId === 0 ? "Bienvenue !" : active.label}
            </span>
          </h1>
        </div>
        <div style={styles.simContainer}>
          {activeId === 0
            ? <PageAccueil onStart={() => setActiveId(1)} />
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