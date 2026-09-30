import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle } from "../commun";

// ============================================================
//  SIMULATION 8 — Chaîne de mesure / capteur de lumière
// ============================================================

export function Simulation8({ plotlyReady }) {
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

