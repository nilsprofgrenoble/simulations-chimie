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
  }, [VB, a, b, c, d, cA, VA, cB, nADirect, activeTab]);

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

function Simulation3() {
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