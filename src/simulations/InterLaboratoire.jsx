import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle, fmt, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton, styleBoite, Section, ORANGE_GUIDE, avecIndices } from "../commun";

// ============================================================
//  SIMULATION 9 — Fidélité d'une méthode : étude interlaboratoire (ISO 5725)
// ============================================================

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


function ExplorationInterlabo({ plotlyReady, visible = true }) {
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

  // ── Génération données aléatoires ──
  const genererDonnees = () => {
    const randn = (mu, sigma) => {
      let u=0, v=0;
      while(u===0) u=Math.random();
      while(v===0) v=Math.random();
      return mu + sigma * Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
    };

    // Paramètres par labo — un laboratoire très dispersé et un laboratoire biaisé, tirés une seule fois
    const iEcart = Math.floor(Math.random()*p);
    let iMoy = Math.floor(Math.random()*p);
    if (p > 1 && iMoy === iEcart) iMoy = (iMoy + 1) % p;
    const params = Array.from({length:p}, (_, i) => {
      const suspectEcart = i === iEcart;
      const suspectMoy   = i === iMoy;
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
    if (!window.Plotly || !donnees || !visible) return;
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
  }, 150);
    return () => clearTimeout(timer);
  }, [donnees, etape, labosActifs, labosEliminésC, labosEliminésG, labosDouteuxC, labosDouteuxG, plotlyReady, visible]);

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
      return <span style={{fontSize:10,background:"#e63946",color:"white",padding:"1px 5px",borderRadius:4}}>❌ Écarté (C)</span>;
    if (labosEliminésG.includes(labo))
      return <span style={{fontSize:10,background:"#e9a824",color:"white",padding:"1px 5px",borderRadius:4}}>❌ Écarté (G)</span>;
    if (labosDouteuxC.includes(labo))
      return <span style={{fontSize:10,background:"#f4a261",color:"white",padding:"1px 5px",borderRadius:4}}>⚠ Isolé (C)</span>;
    if (labosDouteuxG.includes(labo))
      return <span style={{fontSize:10,background:"#f4a261",color:"white",padding:"1px 5px",borderRadius:4}}>⚠ Isolé (G)</span>;
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

      <HypothesesInterlabo defaut={false}/>

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
                              ? `🎉 Bravo ! C'est bien le Labo ${i+1} qui est suspecté par le test de Cochran — c'est celui qui a le plus grand écart-type (s = ${ecarts[i]}).`
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
              {(!questionActive || etape!=="cochran") && (
                <div style={{marginBottom:12}} data-actions={etape==="cochran" ? "1" : "0"}>
                  {!crit ? (
                    <div style={{padding:"8px 12px",borderRadius:6,background:"#f5f5f5",fontSize:13}}>
                      ⚠ Pas de valeur critique disponible pour ces paramètres.
                    </div>
                  ) : C <= crit.p5 ? (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#f0fff4",border:"1px solid #2a9d8f",fontSize:13,color:"#2a9d8f",fontWeight:600}}>
                      ✅ C = {C} ≤ C₅% = {crit.p5} → Aucun laboratoire rejeté. Test terminé !
                    </div>
                  ) : C > crit.p1 ? (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#fff5f5",border:"1px solid #e63946",fontSize:13,color:"#e63946",fontWeight:600}}>
                      ❌ C = {C} &gt; C₁% = {crit.p1} → Le Labo {idxMax+1} est <strong>aberrant</strong> : il est écarté.
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
                        Écarter et recommencer →
                      </button>
                    </div>
                  ) : (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#fff8f0",border:"1px solid #e9a824",fontSize:13,color:"#e9a824",fontWeight:600}}>
                      ⚠ C₅% = {crit.p5} &lt; C = {C} ≤ C₁% = {crit.p1} → Le Labo {idxMax+1} est <strong>isolé</strong> (douteux) : la norme le signale mais le <strong>conserve</strong>.
                      <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button onClick={()=>{
                        if (!labosDouteuxC.includes(idxMax)) setLabosDouteuxC([...labosDouteuxC, idxMax]);
                        setEtape("grubbs"); setQuestionActive(true); setFeedback(null);
                      }}
                        style={{padding:"3px 10px",borderRadius:4,border:"none",
                          background:"#e9a824",color:"white",cursor:"pointer",fontSize:12}}>
                        Le conserver et passer à Grubbs →
                      </button>
                      <button onClick={()=>{
                        const newActifs = labosActifs.filter(i=>i!==idxMax);
                        setLabosActifs(newActifs);
                        setLabosEliminésC([...labosEliminésC, idxMax]);
                        setIterCochran(c=>c+1);
                        setQuestionActive(true);
                        setFeedback(null);
                      }}
                        title="À ne faire que si une cause technique est identifiée"
                        style={{padding:"3px 10px",borderRadius:4,border:"1px solid #e9a824",
                          background:"white",color:"#b7791f",cursor:"pointer",fontSize:12}}>
                        L'écarter quand même (cause technique identifiée) →
                      </button>
                      </div>
                    </div>
                  )}

                  {/* Bouton passer à Grubbs */}
                  {(C <= crit?.p5) && etape==="cochran" && (
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
                <div data-actions={etape==="grubbs" ? "1" : "0"}>
                  {!crit ? (
                    <div style={{padding:"8px 12px",borderRadius:6,background:"#f5f5f5"}}>
                      ⚠ Pas de valeur critique disponible.
                    </div>
                  ) : G <= crit.p5 ? (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#f0fff4",border:"1px solid #2a9d8f",fontSize:13,color:"#2a9d8f",fontWeight:600}}>
                      ✅ G = {G} ≤ G₅% = {crit.p5} → Aucun laboratoire rejeté. Test terminé !
                    </div>
                  ) : G > crit.p1 ? (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#fff5f5",border:"1px solid #e63946",fontSize:13,color:"#e63946",fontWeight:600}}>
                      ❌ G = {G} &gt; G₁% = {crit.p1} → Le Labo {idxSusp+1} est <strong>aberrant</strong> : il est écarté.
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
                        Écarter et recommencer →
                      </button>
                    </div>
                  ) : (
                    <div style={{padding:"8px 12px",borderRadius:6,
                      background:"#fff8f0",border:"1px solid #e9a824",fontSize:13,color:"#e9a824",fontWeight:600}}>
                      ⚠ G₅% = {crit.p5} &lt; G = {G} ≤ G₁% = {crit.p1} → Le Labo {idxSusp+1} est <strong>isolé</strong> (douteux) : la norme le signale mais le <strong>conserve</strong>.
                      <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button onClick={()=>{
                        if (!labosDouteuxG.includes(idxSusp)) setLabosDouteuxG([...labosDouteuxG, idxSusp]);
                        setEtape("resultats");
                      }}
                        style={{padding:"3px 10px",borderRadius:4,border:"none",
                          background:"#e9a824",color:"white",cursor:"pointer",fontSize:12}}>
                        Le conserver et calculer s<sub>r</sub> et s<sub>R</sub> →
                      </button>
                      <button onClick={()=>{
                        const newActifs = labosActifs.filter(i=>i!==idxSusp);
                        setLabosActifs(newActifs);
                        setLabosEliminésG([...labosEliminésG, idxSusp]);
                        setIterGrubbs(g=>g+1);
                        setQuestionActive(true);
                        setFeedback(null);
                      }}
                        title="À ne faire que si une cause technique est identifiée"
                        style={{padding:"3px 10px",borderRadius:4,border:"1px solid #e9a824",
                          background:"white",color:"#b7791f",cursor:"pointer",fontSize:12}}>
                        L'écarter quand même (cause technique identifiée) →
                      </button>
                      </div>
                    </div>
                  )}

                  {G <= crit?.p5 && etape==="grubbs" && (
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

              {(labosEliminésC.length + labosEliminésG.length) > 2*p/9 && (
                <div style={{marginTop:10,padding:"6px 10px",borderRadius:6,background:"#fff8f0",border:"1px solid #e9a824",fontSize:12,color:"#92400e"}}>
                  ⚠ Plus de 2/9 des laboratoires ont été écartés : la norme invite alors à s'interroger sur l'étude elle-même (méthode mal décrite, échantillon instable…), plutôt qu'à poursuivre le calcul.
                </div>
              )}
              {/* Résumé labos */}
              <div style={{marginTop:12,fontSize:12,color:"#555"}}>
                {labosEliminésC.length>0 && <div>❌ Écartés (Cochran) : {labosEliminésC.map(i=>`Labo ${i+1}`).join(", ")}</div>}
                {labosDouteuxC.length>0 && <div>⚠ Isolés, conservés (Cochran) : {labosDouteuxC.map(i=>`Labo ${i+1}`).join(", ")}</div>}
                {labosEliminésG.length>0 && <div>❌ Écartés (Grubbs) : {labosEliminésG.map(i=>`Labo ${i+1}`).join(", ")}</div>}
                {labosDouteuxG.length>0 && <div>⚠ Isolés, conservés (Grubbs) : {labosDouteuxG.map(i=>`Labo ${i+1}`).join(", ")}</div>}
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
      // Des essais fictifs qui ont exactement la moyenne et l'écart-type saisis (le tableau reste cohérent)
      const data = m.map((mu,i)=>{
        const z = Array.from({length:n},()=>Math.random()-0.5);
        const zm = z.reduce((a,b)=>a+b,0)/n;
        const zs = Math.sqrt(z.reduce((a,b)=>a+(b-zm)**2,0)/(n-1)) || 1;
        return z.map(x=>parseFloat((mu+(x-zm)/zs*e[i]).toFixed(4)));
      });
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



// ════════════════════════════════════════════════════════════════
//  OUTILS COMMUNS : statistiques, procédure de la norme, dessins
// ════════════════════════════════════════════════════════════════
const moy = v => v.reduce((a, b) => a + b, 0) / v.length;
const ect = v => { const m = moy(v); return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (v.length - 1)); };
const COUL = ['#e63946', '#2a9d8f', '#e9a824', '#2a6099', '#6a4c93', '#f4a261', '#264653', '#457b9d', '#d62828', '#2b9348', '#023e8a', '#7b2d8b'];

// Une passe du test de Cochran sur les laboratoires `actifs` : C = s²max / Σ s²i
function passeCochran(s, actifs, n) {
  const s2 = actifs.map(i => s[i] ** 2), tot = s2.reduce((a, b) => a + b, 0), k = s2.indexOf(Math.max(...s2));
  const crit = tableCochran[actifs.length]?.[n];
  return { C: s2[k] / tot, lab: actifs[k], crit };
}
// Une passe du test de Grubbs (valeur aberrante isolée, la plus grande des deux : haute ou basse) sur les moyennes
function passeGrubbs(m, actifs) {
  const mm = actifs.map(i => m[i]), yb = moy(mm), sy = ect(mm);
  const gH = (Math.max(...mm) - yb) / sy, gB = (yb - Math.min(...mm)) / sy;
  const haut = gH >= gB;
  const lab = actifs[mm.indexOf(haut ? Math.max(...mm) : Math.min(...mm))];
  return { G: Math.max(gH, gB), lab, ybar: yb, sy, crit: tableGrubbs[actifs.length] };
}
const verdict = (x, crit) => !crit ? null : x <= crit.p5 ? 'correct' : x <= crit.p1 ? 'isole' : 'aberrant';

// Fidélité (ISO 5725-2) : s_r² = moyenne des s_i², s_L² = s²(ȳ) − s_r²/n, s_R² = s_L² + s_r²
function fidelite(m, s, actifs, n) {
  const sr2 = actifs.reduce((a, i) => a + s[i] ** 2, 0) / actifs.length;
  const sy2 = ect(actifs.map(i => m[i])) ** 2;
  const sL2 = Math.max(sy2 - sr2 / n, 0);
  return { ybar: moy(actifs.map(i => m[i])), sy: Math.sqrt(sy2), sr: Math.sqrt(sr2), sL: Math.sqrt(sL2), sR: Math.sqrt(sL2 + sr2) };
}
// La procédure complète de la norme : Cochran (répété tant qu'un laboratoire est aberrant), puis Grubbs (idem).
// Un laboratoire « isolé » est signalé mais conservé ; un laboratoire « aberrant » est écarté.
function procedureISO(data) {
  const n = data[0].length, m = data.map(moy), s = data.map(ect);
  let actifs = data.map((_, i) => i);
  const journal = [];
  for (let t = 0; t < 6; t++) {
    const r = passeCochran(s, actifs, n), v = verdict(r.C, r.crit);
    journal.push({ test: 'C', p: actifs.length, val: r.C, lab: r.lab, crit: r.crit, verdict: v });
    if (v !== 'aberrant') break;
    actifs = actifs.filter(i => i !== r.lab);
  }
  for (let t = 0; t < 6; t++) {
    const r = passeGrubbs(m, actifs), v = verdict(r.G, r.crit);
    journal.push({ test: 'G', p: actifs.length, val: r.G, lab: r.lab, crit: r.crit, verdict: v, ybar: r.ybar, sy: r.sy });
    if (v !== 'aberrant') break;
    actifs = actifs.filter(i => i !== r.lab);
  }
  return { m, s, n, actifs, journal, res: fidelite(m, s, actifs, n) };
}
const NOM_VERDICT = { correct: 'correct', isole: 'isolé (douteux)', aberrant: 'aberrant' };

// Les hypothèses de travail : elles sont explicites, car toute l'interprétation en dépend.
function HypothesesInterlabo({ defaut = true, focus = false }) {
  const [ouvert, setOuvert] = useState(defaut);
  const li = (t, d) => <li style={{ marginBottom: 4 }}><strong>{t}</strong> {d}</li>;
  return (
    <div style={focus ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {}}>
      <Section titre="Hypothèses de travail (ISO 5725)" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
          {li('Un échantillon homogène et stable,', 'envoyé à tous les laboratoires : les différences observées viennent de la méthode et des laboratoires, pas de l’échantillon.')}
          {li('Le modèle de la norme :', <>y<sub>ij</sub> = m + B<sub>i</sub> + e<sub>ij</sub>. Le résultat de l’essai j du laboratoire i est la valeur moyenne m, plus un écart propre au laboratoire B<sub>i</sub> (variance σ<sub>L</sub>²), plus un écart aléatoire e<sub>ij</sub> (variance σ<sub>r</sub>²).</>)}
          {li('Les écarts aléatoires suivent une loi normale, de même variance σ_r² dans tous les laboratoires.', 'C’est exactement ce que le test de Cochran vérifie : un laboratoire plus dispersé que les autres est suspect.')}
          {li('Les moyennes des laboratoires suivent une loi normale.', 'Le test de Grubbs repère une moyenne trop éloignée des autres.')}
          {li('Des essais indépendants,', 'réalisés dans des conditions de répétabilité (même opérateur, même appareil, court intervalle de temps), et le même nombre n d’essais dans chaque laboratoire.')}
          {li('Au moins 8 laboratoires', 'sont recommandés par la norme ; les tests de Cochran et de Grubbs utilisent les tables de valeurs critiques de la norme (ici n ≤ 6 essais, p ≤ 20 laboratoires).')}
          {li('Aberrant ou isolé :', 'au-delà du seuil de 1 %, la valeur est aberrante et le laboratoire est écarté ; entre 5 % et 1 %, elle est isolée (douteuse) : on la signale mais on la conserve, sauf cause technique identifiée.')}
          {li('Seuls des tests sur une valeur à la fois sont traités', '(pas le double test de Grubbs de la norme). Si plus de 2/9 des laboratoires sont écartés, la norme invite à remettre en cause l’étude elle-même.')}
          {li('Un test statistique suspecte, il ne prouve pas :', 'on cherche la cause d’une anomalie avant d’écarter un laboratoire.')}
          {li('Fidélité n’est pas justesse :', 'cette étude mesure la dispersion (répétabilité s_r, reproductibilité s_R), pas l’écart à la valeur vraie.')}
        </ul>
      </Section>
    </div>
  );
}

// Les valeurs critiques de la norme (extraits) : Cochran pour n essais, Grubbs pour p laboratoires
function TablesCritiques({ pMin = 5, pMax = 12, nMin = 2, nMax = 6, surligne = false }) {
  const [ouvert, setOuvert] = useState(true);
  const ps = Array.from({ length: pMax - pMin + 1 }, (_, i) => pMin + i), ns = Array.from({ length: nMax - nMin + 1 }, (_, i) => nMin + i);
  const c = { padding: '3px 7px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 12.5 };
  const h = { ...c, background: '#f1f5f9', fontWeight: 700 };
  const cochran = cle => (
    <table style={{ borderCollapse: 'collapse' }}>
      <thead><tr><th style={h}>p \ n</th>{ns.map(n => <th key={n} style={h}>{n}</th>)}</tr></thead>
      <tbody>{ps.map(p => <tr key={p}><td style={h}>{p}</td>{ns.map(n => <td key={n} style={c}>{fmt(tableCochran[p][n][cle], 3)}</td>)}</tr>)}</tbody>
    </table>
  );
  return (
    <div style={surligne ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {}}>
      <Section titre="Valeurs critiques (norme ISO 5725-2)" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div><div style={{ fontWeight: 700, fontSize: 13, color: KIT.txt, marginBottom: 3 }}>Cochran, C₅ % (n essais par laboratoire, p laboratoires)</div>{cochran('p5')}</div>
          <div><div style={{ fontWeight: 700, fontSize: 13, color: KIT.txt, marginBottom: 3 }}>Cochran, C₁ %</div>{cochran('p1')}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: KIT.txt, marginBottom: 3 }}>Grubbs (p laboratoires)</div>
            <table style={{ borderCollapse: 'collapse' }}>
              <thead><tr><th style={h}>p</th><th style={h}>G₅ %</th><th style={h}>G₁ %</th></tr></thead>
              <tbody>{ps.map(p => <tr key={p}><td style={h}>{p}</td><td style={c}>{fmt(tableGrubbs[p].p5, 3)}</td><td style={c}>{fmt(tableGrubbs[p].p1, 3)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>Statistique ≤ valeur à 5 % : laboratoire correct. Entre 5 % et 1 % : isolé (douteux). Au-delà de 1 % : aberrant.</div>
      </Section>
    </div>
  );
}

// Les résultats des laboratoires : chaque point est un essai, le trait est la moyenne du laboratoire
function NuagePoints({ data, ecartes = [], isoles = [], moyennes = false, cible = null, unite = '', surligne = false }) {
  const p = data.length, W = 620, H = 270, ml = 54, mr = 12, mt = 14, mb = 36;
  const tous = data.flat();
  let lo = Math.min(...tous, cible ?? Infinity), hi = Math.max(...tous, cible ?? -Infinity);
  const pad = (hi - lo) * 0.08 || 0.1; lo -= pad; hi += pad;
  const X = i => ml + (i + 0.5) * (W - ml - mr) / p, Y = v => mt + (hi - v) / (hi - lo) * (H - mt - mb);
  // Graduations « rondes » (pas de 1, 2 ou 5 × une puissance de 10)
  const brut = (hi - lo) / 5, pw = Math.pow(10, Math.floor(Math.log10(brut))), pas = [1, 2, 5, 10].map(k => k * pw).find(x => x >= brut);
  const graduations = []; for (let g = Math.ceil(lo / pas) * pas; g <= hi + 1e-9; g += pas) graduations.push(parseFloat(g.toFixed(8)));
  const dec = Math.max(0, -Math.floor(Math.log10(pas) + 1e-9));
  return (
    <div style={{ ...styleBoite, ...(surligne ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3 } : {}) }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Résultats des essais de chaque laboratoire" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {graduations.map((g, k) => <g key={k}><line x1={ml} x2={W - mr} y1={Y(g)} y2={Y(g)} stroke="#e2e8f0"/><text x={ml - 6} y={Y(g) + 4} textAnchor="end" fontSize="11.5" fill="#334155">{fmt(g, dec)}</text></g>)}
        {cible != null && <line x1={ml} x2={W - mr} y1={Y(cible)} y2={Y(cible)} stroke="#334155" strokeDasharray="5 4"/>}
        {data.map((essais, i) => {
          const ec = ecartes.includes(i), is = isoles.includes(i), col = ec ? '#94a3b8' : is ? '#d97706' : COUL[i % COUL.length];
          return (
            <g key={i} opacity={ec ? 0.55 : 1}>
              {essais.map((v, j) => <circle key={j} cx={X(i) + (j - (essais.length - 1) / 2) * 9} cy={Y(v)} r="3.6" fill={col}/>)}
              {moyennes && <line x1={X(i) - 22} x2={X(i) + 22} y1={Y(moy(essais))} y2={Y(moy(essais))} stroke={col} strokeWidth="2.5"/>}
              <text x={X(i)} y={H - 16} textAnchor="middle" fontSize="12" fontWeight="700" fill={col}>{i + 1}</text>
            </g>
          );
        })}
        <text x={(ml + W - mr) / 2} y={H - 2} textAnchor="middle" fontSize="11.5" fill="#334155">numéro du laboratoire{unite ? `   —   résultats en ${unite}` : ''}{moyennes ? '   —   trait : moyenne du laboratoire' : ''}{cible != null ? `   —   pointillés : valeur de référence ${fmt(cible, 2)}` : ''}</text>
      </svg>
    </div>
  );
}

function TableauEssais({ data, unite, stats, ecartes = [], isoles = [], focus = false }) {
  const n = data[0].length, m = data.map(moy), s = data.map(ect);
  const c = { padding: '3px 7px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5 };
  const h = { ...c, background: '#f1f5f9', fontWeight: 700 };
  return (
    <div style={{ overflowX: 'auto', ...(focus ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 6 } : {}) }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead><tr><th style={h}>Laboratoire</th>{data.map((_, i) => <th key={i} style={{ ...h, color: ecartes.includes(i) ? '#94a3b8' : isoles.includes(i) ? '#b45309' : COUL[i % COUL.length] }}>{i + 1}{ecartes.includes(i) ? ' ✕' : isoles.includes(i) ? ' ⚠' : ''}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: n }, (_, j) => <tr key={j}><td style={h}>Essai {j + 1}</td>{data.map((col, i) => <td key={i} style={{ ...c, opacity: ecartes.includes(i) ? 0.45 : 1 }}>{fmt(col[j], 2)}</td>)}</tr>)}
          {stats && <>
            <tr><td style={{ ...h, background: '#eff6ff' }}>{avecIndices('ȳ_i')} ({unite})</td>{m.map((x, i) => <td key={i} style={{ ...c, background: '#eff6ff', fontWeight: 700, opacity: ecartes.includes(i) ? 0.45 : 1 }}>{fmt(x, 3)}</td>)}</tr>
            <tr><td style={{ ...h, background: '#fff7ed' }}>{avecIndices('s_i')} ({unite})</td>{s.map((x, i) => <td key={i} style={{ ...c, background: '#fff7ed', fontWeight: 700, opacity: ecartes.includes(i) ? 0.45 : 1 }}>{fmt(x, 3)}</td>)}</tr>
          </>}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PARCOURS GUIDÉ : une campagne de 8 laboratoires, n = 4 essais
//  (un laboratoire très dispersé, un laboratoire dont la moyenne est haute)
// ════════════════════════════════════════════════════════════════
const DG = [[10.02, 9.97, 10.05, 9.99], [9.94, 10.01, 9.96, 10.03], [10.20, 9.62, 10.35, 9.78], [10.06, 10.11, 10.03, 10.08],
  [9.98, 10.04, 9.93, 10.01], [10.18, 10.22, 10.15, 10.25], [9.96, 10.00, 10.07, 9.95], [10.03, 9.99, 10.08, 10.02]];
const REF_G = 10.00, UNITE_G = 'mmol/L';
const PG = (() => {
  const proc = procedureISO(DG), m = proc.m, s = proc.s;
  const tout = DG.map((_, i) => i), sans3 = tout.filter(i => i !== 2);
  const c8 = passeCochran(s, tout, 4), c7 = passeCochran(s, sans3, 4), g7 = passeGrubbs(m, sans3), g8 = passeGrubbs(m, tout);
  return { proc, m, s, c8, c7, g7, g8, f: fidelite(m, s, sans3, 4), sPop1: s[0] * Math.sqrt(3 / 4), m8: moy(m) };
})();

function ParcoursInterlabo({ changerMode }) {
  const [guide, setGuide] = useEtatPersistant('interlabo-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [clicEcarte, setClicEcarte] = useState(false);
  const etape = guide.etape;
  const { m, s, c8, c7, g7, g8, f } = PG;
  const ETAPES = [
    { id: 'principe', titre: 'Une étude interlaboratoire', focus: [],
      texte: <>Un organisateur envoie un <strong>même échantillon</strong> (ici, une solution à 10,00 mmol/L) à 8 laboratoires. Chacun réalise <strong>4 essais</strong> avec la même méthode d’analyse. On veut savoir si la méthode donne partout des résultats voisins.</>,
      tache: { type: 'qcm', q: 'Que cherche-t-on à évaluer avec la norme ISO 5725 ?', options: ['La fidélité de la méthode : sa répétabilité et sa reproductibilité', 'La compétence de chaque laboratoire (c’est le rôle d’un essai d’aptitude)', 'La valeur exacte de la concentration de l’échantillon'], bonne: 0 } },
    { id: 'modele', titre: 'Deux sources de dispersion', focus: [],
      texte: <>Les résultats d’un même laboratoire varient un peu d’un essai à l’autre (<strong>répétabilité</strong>). Les moyennes des laboratoires diffèrent aussi entre elles (<strong>effet laboratoire</strong>). La <strong>reproductibilité</strong> cumule les deux : s<sub>R</sub>² = s<sub>L</sub>² + s<sub>r</sub>².</>,
      tache: { type: 'qcm', q: 'Quel écart-type décrit la dispersion des essais d’un même laboratoire, dans les mêmes conditions ?', options: ['L’écart-type de répétabilité s_r', 'L’écart-type de reproductibilité s_R', 'L’écart-type interlaboratoires s_L'], bonne: 0 } },
    { id: 'hypotheses', titre: 'Sur quoi reposent les calculs ?', focus: ['hypo'],
      texte: <>Lisez l’encadré « Hypothèses de travail ». Deux tests vont servir à repérer les laboratoires anormaux : Cochran, puis Grubbs.</>,
      tache: { type: 'qcm', q: 'Quelle hypothèse le test de Cochran contrôle-t-il ?', options: ['Tous les laboratoires ont la même dispersion d’essais (même variance de répétabilité)', 'Les moyennes des laboratoires suivent une loi normale', 'L’échantillon est homogène'], bonne: 0,
        expl: 'Les moyennes, elles, sont contrôlées par le test de Grubbs.' } },
    { id: 'moyenneLab', titre: 'La moyenne d’un laboratoire', focus: ['donnees'],
      texte: <>Voici les 4 essais de chaque laboratoire (en mmol/L). Commencez par le laboratoire 1.</>,
      tache: { type: 'num', q: 'Moyenne ȳ_1 du laboratoire 1', unite: 'mmol/L', vrai: m[0], tol: 0.0006, affiche: x => fmt(x, 3), aide: <>ȳ_i = (somme des n essais) / n</> } },
    { id: 'ecartLab', titre: 'L’écart-type d’un laboratoire', focus: ['donnees'],
      texte: <>Toujours pour le laboratoire 1, calculez l’écart-type expérimental (touche σ<sub>n−1</sub> ou s<sub>x</sub> de la calculatrice).</>,
      tache: { type: 'num', q: 'Écart-type s_1 du laboratoire 1', unite: 'mmol/L', vrai: s[0], tol: 0.03, affiche: x => fmt(x, 3),
        pieges: [[PG.sPop1, 'C’est σ_n (diviseur n) : prenez σ_n−1, qui divise par n − 1.']] } },
    { id: 'apercu', titre: 'Les résultats en images', focus: ['graphe'],
      texte: <>Les lignes ȳ_i et s_i du tableau sont maintenant calculées pour tous les laboratoires, et le graphique montre chaque essai. Chaque point est un essai, le trait est la moyenne.</>,
      tache: { type: 'qcm', q: 'Quel laboratoire a les essais les plus dispersés ?', options: ['Le laboratoire 3', 'Le laboratoire 6', 'Le laboratoire 1'], bonne: 0,
        expl: 'Le laboratoire 6, lui, a des essais groupés mais une moyenne plus haute que les autres : c’est Grubbs qui s’en occupera.' } },
    { id: 'cochranF', titre: 'Le test de Cochran', focus: [],
      texte: <>Le test compare la plus grande variance à la somme des variances : C = s<sup>2</sup><sub>max</sub> / Σ s<sub>i</sub><sup>2</sup>, sur les 8 laboratoires. Si un laboratoire est bien plus dispersé que les autres, C est proche de 1 ; si tous se ressemblent, C vaut environ 1 / p.</>,
      tache: { type: 'num', q: 'Statistique de Cochran C (8 laboratoires)', unite: '', vrai: c8.C, tol: 0.01, affiche: x => fmt(x, 3),
        pieges: [[Math.max(...s) / s.reduce((a, b) => a + b, 0), 'Il faut élever les écarts-types au carré (variances), au numérateur et pour la somme.']] } },
    { id: 'cochranT', titre: 'Lire la table de Cochran', focus: ['tables'],
      texte: <>La table donne la valeur que C dépasserait rarement si tous les laboratoires avaient la même dispersion : seuil à 5 % et seuil à 1 %. Entrez dans la table avec p = 8 laboratoires et n = 4 essais.</>,
      tache: { type: 'num', q: 'Valeur critique C₁ % (p = 8, n = 4)', unite: '', vrai: tableCochran[8][4].p1, tol: 0.003, affiche: x => fmt(x, 3) } },
    { id: 'cochranV', titre: 'Conclure', focus: [],
      texte: <>Comparez C à C₁ % = {fmt(tableCochran[8][4].p1, 3)} et à C₅ % = {fmt(tableCochran[8][4].p5, 3)}. Au-delà de C₁ %, la valeur est <strong>aberrante</strong>. Entre C₅ % et C₁ %, elle est <strong>isolée</strong> (douteuse). En dessous de C₅ %, tout va bien.</>,
      tache: { type: 'qcm', q: 'Que conclure pour le laboratoire de plus grande variance ?', options: ['Il est aberrant : on l’écarte', 'Il est isolé (douteux) : on le signale et on le conserve', 'Il est correct'], bonne: 0 } },
    { id: 'ecarter', titre: 'Écarter le laboratoire', focus: [],
      texte: <>Un laboratoire aberrant est écarté (après vérification qu’aucune erreur de saisie n’explique ses résultats). Il ne compte plus ni pour la suite des tests, ni pour le calcul final.</>,
      tache: { type: 'action', ok: clicEcarte || etape > 9, label: 'Écarter ce laboratoire', faire: () => setClicEcarte(true) } },
    { id: 'cochran2', titre: 'On recommence avec 7 laboratoires', focus: ['tables'],
      texte: <>La norme demande de répéter le test tant qu’un laboratoire est aberrant. Recalculez C sans le laboratoire écarté (p = 7).</>,
      tache: { type: 'num', q: 'Statistique de Cochran C (7 laboratoires)', unite: '', vrai: c7.C, tol: 0.02, affiche: x => fmt(x, 3),
        pieges: [[c8.C, 'Le laboratoire écarté est encore dans votre somme.']],
        expl: `Pour p = 7 et n = 4, C₅ % vaut ${fmt(tableCochran[7][4].p5, 3)} : C est en dessous, il n’y a plus de laboratoire trop dispersé.` } },
    { id: 'grubbsF', titre: 'Le test de Grubbs', focus: [],
      texte: <>Ce test porte sur les <strong>moyennes</strong> des 7 laboratoires restants. G = |ȳ<sub>i</sub> − ȳ| / s(ȳ), pour la moyenne la plus éloignée de ȳ, la moyenne des moyennes. D’abord ȳ.</>,
      tache: { type: 'num', q: 'Moyenne des moyennes ȳ (7 laboratoires)', unite: 'mmol/L', vrai: g7.ybar, tol: 0.0006, affiche: x => fmt(x, 3),
        pieges: [[PG.m8, 'Vous avez gardé le laboratoire écarté.']] } },
    { id: 'grubbsS', titre: 'La dispersion des moyennes', focus: [],
      texte: <>Calculez maintenant l’écart-type expérimental s(ȳ) des 7 moyennes ȳ<sub>i</sub> (σ<sub>n−1</sub> de la calculatrice).</>,
      tache: { type: 'num', q: 'Écart-type des moyennes s(ȳ)', unite: 'mmol/L', vrai: g7.sy, tol: 0.03, affiche: x => fmt(x, 4) } },
    { id: 'grubbsG', titre: 'La statistique G', focus: [],
      texte: <>Le laboratoire dont la moyenne est la plus éloignée de ȳ est celui du graphique dont le trait est le plus haut.</>,
      tache: { type: 'num', q: 'Statistique de Grubbs G', unite: '', vrai: g7.G, tol: 0.015, affiche: x => fmt(x, 3),
        pieges: [[g8.G, 'Vous avez gardé le laboratoire écarté par Cochran.']] } },
    { id: 'grubbsT', titre: 'Lire la table de Grubbs', focus: ['tables'],
      texte: <>La table de Grubbs ne dépend que du nombre p de laboratoires (ici p = 7).</>,
      tache: { type: 'num', q: 'Valeur critique G₅ % (p = 7)', unite: '', vrai: tableGrubbs[7].p5, tol: 0.002, affiche: x => fmt(x, 3) } },
    { id: 'grubbsV', titre: 'Conclure', focus: ['tables'],
      texte: <>Comparez G aux deux valeurs critiques de la ligne p = 7.</>,
      tache: { type: 'qcm', q: 'Le laboratoire 6 est…', options: ['isolé (douteux) : G est entre G₅ % et G₁ %', 'aberrant : G dépasse G₁ %', 'correct : G est inférieur à G₅ %'], bonne: 0 } },
    { id: 'isole', titre: 'Que faire d’un laboratoire isolé ?', focus: [],
      texte: <>Le laboratoire 6 trouve des résultats groupés (bonne répétabilité) mais une moyenne plus haute que les autres.</>,
      tache: { type: 'qcm', q: 'Quelle est la règle de la norme ?', options: ['On le conserve en le signalant, sauf si une cause technique est identifiée', 'On l’écarte toujours', 'On l’ignore sans en parler'], bonne: 0,
        expl: 'Un test statistique suspecte, il ne prouve pas. La cause (étalonnage, préparation, appareil…) se cherche auprès du laboratoire.' } },
    { id: 'sr', titre: 'La répétabilité', focus: [],
      texte: <>On conserve donc les 7 laboratoires. La variance de répétabilité est la moyenne des variances : s<sub>r</sub>² = Σ s<sub>i</sub>² / p.</>,
      tache: { type: 'num', q: 'Écart-type de répétabilité s_r', unite: 'mmol/L', vrai: f.sr, tol: 0.02, affiche: x => fmt(x, 4),
        pieges: [[moy(PG.proc.s.filter((_, i) => i !== 2)), 'Il faut moyenner les variances (les carrés), puis prendre la racine carrée.']] } },
    { id: 'sL', titre: 'La part « laboratoire »', focus: [],
      texte: <>La variance s²(ȳ) des moyennes contient la variance entre laboratoires, mais aussi une part de répétabilité (une moyenne de n essais reste un peu aléatoire) : s<sub>L</sub>² = s²(ȳ) − s<sub>r</sub>² / n. Si ce résultat était négatif, on prendrait s<sub>L</sub> = 0.</>,
      tache: { type: 'num', q: 'Écart-type interlaboratoires s_L', unite: 'mmol/L', vrai: f.sL, tol: 0.04, affiche: x => fmt(x, 4),
        pieges: [[g7.sy, 'C’est s(ȳ) : il faut encore retirer la part de répétabilité, s_r² / n.']] } },
    { id: 'sR', titre: 'La reproductibilité', focus: [],
      texte: <>Les deux sources de dispersion s’ajoutent par leurs variances : s<sub>R</sub>² = s<sub>L</sub>² + s<sub>r</sub>².</>,
      tache: { type: 'num', q: 'Écart-type de reproductibilité s_R', unite: 'mmol/L', vrai: f.sR, tol: 0.03, affiche: x => fmt(x, 4),
        pieges: [[f.sL, 'C’est s_L seul : ajoutez s_r² avant de prendre la racine.'], [f.sr + f.sL, 'On ajoute les variances (carrés), pas les écarts-types.']] } },
    { id: 'interpretation', titre: 'Interpréter', focus: [],
      texte: <>Vous obtenez s<sub>r</sub> ≈ {fmt(f.sr, 3)} mmol/L et s<sub>R</sub> ≈ {fmt(f.sR, 3)} mmol/L.</>,
      tache: { type: 'qcm', q: 'Pourquoi s_R est-il supérieur à s_r ?', options: ['Entre laboratoires, s’ajoute à la dispersion des essais d’un même laboratoire un effet propre à chaque laboratoire', 'Parce que le laboratoire 3 a été écarté', 'Parce que la méthode est fausse'], bonne: 0 } },
    { id: 'limites', titre: 'Ce que l’étude ne dit pas', focus: ['hypo'],
      texte: <>Les 7 moyennes tournent autour de {fmt(f.ybar, 3)} mmol/L, pour une valeur de référence de 10,00 mmol/L.</>,
      tache: { type: 'qcm', q: 'Cette étude prouve-t-elle que la méthode est juste ?', options: ['Non : elle mesure la fidélité (la dispersion). La justesse demande de comparer à une valeur de référence, avec son incertitude', 'Oui, car s_R est petit', 'Oui, car on a écarté le laboratoire 3'], bonne: 0 } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez mener une étude de fidélité : Cochran (dispersions), puis Grubbs (moyennes), puis s<sub>r</sub>, s<sub>L</sub> et s<sub>R</sub> — en gardant en tête les hypothèses qui donnent un sens aux seuils. En exploration libre, générez vos propres campagnes ; dans le défi, un jeu de données inconnu vous attend.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const vu = id => etape >= idx(id), passe = id => etape > idx(id);
  const hl = id => et.focus.includes(id);
  const ecarte = clicEcarte || passe('ecarter');
  const ecartes = ecarte ? [2] : [], isoles = passe('grubbsV') ? [5] : [];
  const fin = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  return (
    <div className="il-l1">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <div style={styleBoite}>
          <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, marginBottom: 8 }}>
            Dosage d’une solution à 10,00 mmol/L par 8 laboratoires (p = 8), 4 essais chacun (n = 4). Résultats en mmol/L.
          </div>
          <TableauEssais data={DG} unite={UNITE_G} stats={vu('apercu')} ecartes={ecartes} isoles={isoles} focus={hl('donnees')}/>
        </div>
        {vu('apercu') && <NuagePoints data={DG} ecartes={ecartes} isoles={isoles} moyennes cible={REF_G} unite={UNITE_G} surligne={hl('graphe')}/>}
        {(vu('cochranT')) && <TablesCritiques pMin={5} pMax={10} nMin={2} nMax={6} surligne={hl('tables')}/>}
        <HypothesesInterlabo defaut={hl('hypo')} focus={hl('hypo')} key={hl('hypo') ? 'h1' : 'h0'}/>
      </div>
      <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={fin}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  DÉFI : une campagne inconnue, la procédure complète à dérouler
// ════════════════════════════════════════════════════════════════
function nouvelleCampagne() {
  const alea = (a, b) => a + Math.random() * (b - a), pick = t => t[Math.floor(Math.random() * t.length)];
  const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  for (let essai = 0; essai < 400; essai++) {
    const p = pick([8, 9, 10]), n = pick([3, 4]), cible = pick([10, 20, 50]);
    const sr = cible * alea(0.004, 0.008), sL = cible * alea(0.003, 0.007);
    const iDisp = Math.floor(Math.random() * p);
    let iBiais = Math.floor(Math.random() * p); if (iBiais === iDisp) iBiais = (iBiais + 1) % p;
    const data = Array.from({ length: p }, (_, i) => {
      const mu = cible + sL * gauss() + (i === iBiais ? (Math.random() < 0.5 ? -1 : 1) * sL * alea(3.5, 5.5) : 0);
      const sg = i === iDisp ? sr * alea(4, 6) : sr;
      return Array.from({ length: n }, () => parseFloat((mu + sg * gauss()).toFixed(2)));
    });
    if (data.some(l => new Set(l).size < 2)) continue;
    const proc = procedureISO(data), ab = proc.journal.filter(j => j.verdict === 'aberrant').length;
    const c1 = proc.journal.find(j => j.test === 'C'), g1 = proc.journal.find(j => j.test === 'G');
    if (ab < 1 || ab > 2 || ab > 2 * p / 9 || !c1 || !g1) continue;
    if (!c1.crit || !g1.crit) continue;
    return { data, p, n, cible, k: Math.floor(Math.random() * p), reps: {}, choix: {}, verifie: false };
  }
  return null;
}

function DefiInterlabo() {
  const [defi, setDefi] = useState(() => nouvelleCampagne());
  if (!defi) return <div style={styleBoite}>Impossible de générer une campagne : réessayez.</div>;
  const { data, p, n, k } = defi, proc = procedureISO(data);
  const c1 = proc.journal.find(j => j.test === 'C'), g1 = proc.journal.find(j => j.test === 'G');
  const Q = [
    { id: 'm', q: `Moyenne ȳ_${k + 1} du laboratoire ${k + 1}`, vrai: proc.m[k], tol: 0.0006, aff: fmt(proc.m[k], 3) },
    { id: 's', q: `Écart-type s_${k + 1} du laboratoire ${k + 1}`, vrai: proc.s[k], tol: 0.03, aff: fmt(proc.s[k], 3) },
    { id: 'c', q: 'Statistique de Cochran C (tous les laboratoires)', vrai: c1.val, tol: 0.01, aff: fmt(c1.val, 3) },
    { id: 'vc', q: 'Au premier passage, le laboratoire le plus dispersé est…', choix: true, vrai: c1.verdict },
    { id: 'g', q: 'Statistique de Grubbs G (premier passage, une fois les laboratoires aberrants de Cochran écartés)', vrai: g1.val, tol: 0.015, aff: fmt(g1.val, 3) },
    { id: 'vg', q: 'Au premier passage, la moyenne la plus éloignée est…', choix: true, vrai: g1.verdict },
    { id: 'sR', q: 'Écart-type de reproductibilité s_R (laboratoires aberrants écartés, laboratoires isolés conservés)', vrai: proc.res.sR, tol: 0.03, aff: fmt(proc.res.sR, 3) },
  ];
  const juste = q => q.choix ? defi.choix[q.id] === q.vrai : proche(lireNombre(defi.reps[q.id] || ''), q.vrai, q.tol);
  const ecartes = proc.journal.filter(j => j.verdict === 'aberrant').map(j => j.lab);
  const phrase = j => `${j.test === 'C' ? 'Cochran' : 'Grubbs'} (p = ${j.p}) : ${j.test === 'C' ? 'C' : 'G'} = ${fmt(j.val, 3)} (seuils ${fmt(j.crit.p5, 3)} et ${fmt(j.crit.p1, 3)}) → laboratoire ${j.lab + 1} ${NOM_VERDICT[j.verdict]}`;
  return (
    <div className="il-l1">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <div style={styleBoite}>
          <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, marginBottom: 8 }}>
            Une étude interlaboratoire : {p} laboratoires, {n} essais chacun, résultats en mmol/L. Appliquez la procédure de la norme : Cochran (répété si un laboratoire est aberrant), puis Grubbs (idem), puis la fidélité.
          </div>
          <TableauEssais data={data} unite="mmol/L" stats={false}/>
        </div>
        <NuagePoints data={data} unite="mmol/L"/>
        <TablesCritiques pMin={5} pMax={12} nMin={2} nMax={6}/>
      </div>
      <div style={{ ...styleBoite, display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'start' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>Questions</div>
        {Q.map((q, i) => {
          const ok = defi.verifie && juste(q);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{i + 1}. {avecIndices(q.q)}</div>
              {q.choix ? (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {Object.entries(NOM_VERDICT).map(([cle, nom]) => <button key={cle} onClick={() => setDefi(d => ({ ...d, verifie: false, choix: { ...d.choix, [q.id]: cle } }))}
                    style={{ ...styleBouton(defi.choix[q.id] === cle, '#0ea5e9'), padding: '4px 9px', fontSize: 13 }}>{nom}</button>)}
                  {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${i + 1}`}
                    onChange={e => { const val = e.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: val } })); }}
                    style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                  {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
                </div>
              )}
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.choix ? NOM_VERDICT[q.vrai] : q.aff}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={() => setDefi(nouvelleCampagne())} style={styleBouton(false)}>🔄 Nouvelle campagne</button>
        </div>
        {defi.verifie && (
          <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.5, background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 6, padding: '6px 8px' }}>
            <strong>Bilan.</strong>
            <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{proc.journal.map((j, i) => <li key={i}>{phrase(j)}</li>)}</ul>
            Laboratoires écartés : {ecartes.length ? ecartes.map(i => i + 1).join(', ') : 'aucun'}. Résultat : s<sub>r</sub> = {fmt(proc.res.sr, 3)} ; s<sub>L</sub> = {fmt(proc.res.sL, 3)} ; s<sub>R</sub> = {fmt(proc.res.sR, 3)} mmol/L.
          </div>
        )}
        <HypothesesInterlabo defaut={false}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SIMULATION 9 : trois façons de travailler
// ════════════════════════════════════════════════════════════════
export function Simulation9({ plotlyReady }) {
  const [mode, setMode] = useState('explore');   // on arrive sur l'exploration libre
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        [data-actions="0"] button { display: none; }
        .il-l1 { display: grid; align-items: start; gap: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (max-width: 900px) { .il-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button onClick={() => setMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
        <button onClick={() => setMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
        <button onClick={() => setMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
      </div>
      <div style={{ display: mode === 'explore' ? 'block' : 'none' }}>
        <ExplorationInterlabo plotlyReady={plotlyReady} visible={mode === 'explore'}/>
      </div>
      {mode === 'guide' && <ParcoursInterlabo changerMode={setMode}/>}
      {mode === 'defi' && <DefiInterlabo/>}
    </div>
  );
}
