import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle } from "../commun";

// ============================================================
//  SIMULATION 4 — Diagramme de Hansen
// ============================================================

export function Simulation4({ plotlyReady }) {
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


