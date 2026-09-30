import { useState, useEffect, useRef, useMemo } from "react";
import { TabBtn, cardStyle } from "../commun";

// ============================================================
//  SIMULATION 6 — Point de fonctionnement régulation P
// ============================================================

export function Simulation6({ plotlyReady }) {
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

