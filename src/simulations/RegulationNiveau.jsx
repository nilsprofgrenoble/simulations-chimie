import { useState, useEffect, useRef, useMemo } from "react";
import { TabBtn, cardStyle } from "../commun";

// ============================================================
//  SIMULATION 5 — Régulation de niveau
// ============================================================

export function Simulation5({ plotlyReady }) {
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

