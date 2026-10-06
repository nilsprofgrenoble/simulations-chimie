import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle } from "../commun";

// ============================================================
//  SIMULATION 9 — Fidélité d'une méthode : étude interlaboratoire (ISO 5725)
// ============================================================

export function Simulation9({ plotlyReady }) {
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
export function ManualInput({p, n, cible, onValidate}) {
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

