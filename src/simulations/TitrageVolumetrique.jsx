import { useState, useEffect, useRef, useMemo } from "react";
import { CoeffInput, Field, TabBtn, cardStyle } from "../commun";

// ============================================================
//  SIMULATION 2 — Titrage volumétrique
// ============================================================

export function Simulation2({ plotlyReady }) {
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

