import { useState, useEffect, useRef, useMemo } from "react";
import { TabBtn, cardStyle } from "../commun";

// ============================================================
//  SIMULATION 7 — Cristallisation
// ============================================================

export function Simulation7() {
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

