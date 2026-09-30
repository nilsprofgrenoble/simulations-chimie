import { useState, useEffect, useRef, useMemo } from "react";
import { CoeffInput, Field, TabBtn, cardStyle } from "../commun";

// ============================================================
// SIM 10 (1G) — Loi de Beer-Lambert (niveau 1re générale)
// SIM 11 (BTS) — Loi de Beer-Lambert avancée
// ============================================================/
// ============================================================

// ---- Données communes aux deux simulations ----

export const ANALYTES_BL = {
  permanganate: {
    label: "Permanganate de potassium (KMnO₄)",
    solutionColor: "#c84ba0",
    peakNm: 525,
    curve: [[380,0.04],[390,0.05],[400,0.06],[410,0.06],[420,0.05],[430,0.07],[440,0.09],[450,0.08],[460,0.07],[470,0.09],[480,0.13],[485,0.18],[490,0.25],[495,0.35],[500,0.48],[505,0.62],[510,0.76],[515,0.88],[520,0.95],[523,0.99],[525,1.0],[527,0.99],[530,0.96],[533,0.90],[537,0.82],[540,0.70],[545,0.55],[550,0.38],[555,0.22],[560,0.13],[565,0.08],[570,0.06],[580,0.04],[600,0.03],[650,0.02],[700,0.01],[780,0.01]],
    exampleData: {
      mesurande: "C(KMnO₄)", unite: "mg/L",
      niveaux: 5, repetitions: 3,
      concentrations: [0, 2, 4, 6, 8],
      absorbances: [[0.002,0.001,0.003],[0.118,0.120,0.119],[0.241,0.238,0.240],[0.359,0.361,0.358],[0.480,0.478,0.482]],
    }
  },
  cuivre: {
    label: "Sulfate de cuivre (CuSO₄)",
    solutionColor: "#2090ee",
    peakNm: 640,
    curve: [[380,0.02],[390,0.02],[400,0.03],[410,0.03],[420,0.04],[430,0.04],[440,0.05],[450,0.06],[460,0.07],[470,0.06],[480,0.05],[490,0.05],[500,0.04],[510,0.04],[520,0.04],[530,0.04],[540,0.05],[550,0.07],[560,0.10],[570,0.14],[575,0.18],[580,0.23],[585,0.30],[590,0.40],[595,0.52],[600,0.63],[605,0.73],[610,0.82],[615,0.89],[620,0.94],[625,0.98],[630,0.99],[635,1.0],[640,0.99],[645,0.96],[650,0.90],[655,0.83],[660,0.74],[665,0.64],[670,0.54],[675,0.44],[680,0.35],[690,0.20],[700,0.12],[710,0.07],[720,0.04],[740,0.03],[760,0.02],[780,0.02]],
    exampleData: {
      mesurande: "C(CuSO₄)", unite: "g/L",
      niveaux: 5, repetitions: 3,
      concentrations: [0, 1, 2, 3, 4],
      absorbances: [[0.001,0.002,0.001],[0.095,0.097,0.096],[0.193,0.191,0.194],[0.289,0.291,0.288],[0.386,0.384,0.387]],
    }
  },
  dichromate: {
    label: "Dichromate de potassium (K₂Cr₂O₇)",
    solutionColor: "#ee7700",
    peakNm: 440,
    curve: [[380,0.18],[385,0.25],[390,0.35],[395,0.46],[400,0.57],[405,0.67],[410,0.76],[415,0.84],[420,0.91],[425,0.96],[430,0.99],[435,1.0],[440,0.99],[445,0.96],[450,0.90],[455,0.82],[460,0.72],[465,0.60],[470,0.48],[475,0.36],[480,0.25],[485,0.17],[490,0.11],[495,0.08],[500,0.06],[505,0.05],[510,0.04],[520,0.03],[540,0.02],[560,0.02],[580,0.01],[600,0.01],[650,0.01],[700,0.01],[780,0.01]],
    exampleData: {
      mesurande: "C(K₂Cr₂O₇)", unite: "mg/L",
      niveaux: 5, repetitions: 3,
      concentrations: [0, 5, 10, 15, 20],
      absorbances: [[0.003,0.002,0.004],[0.142,0.140,0.143],[0.283,0.281,0.284],[0.421,0.423,0.420],[0.562,0.560,0.563]],
    }
  },
  autre: {
    label: "Autre analyte...",
    solutionColor: "#888888",
    peakNm: 500,
    curve: null,
    exampleData: null,
  },
};

// ---- Utilitaires mathématiques ----

export function linReg(xs, ys) {
  const n = xs.length;
  const sumX = xs.reduce((a,b)=>a+b,0);
  const sumY = ys.reduce((a,b)=>a+b,0);
  const sumXY = xs.reduce((s,x,i)=>s+x*ys[i],0);
  const sumX2 = xs.reduce((s,x)=>s+x*x,0);
  const slope = (n*sumXY - sumX*sumY)/(n*sumX2 - sumX*sumX);
  const intercept = (sumY - slope*sumX)/n;
  const yMean = sumY/n;
  const ssTot = ys.reduce((s,y)=>s+(y-yMean)**2,0);
  const ssRes = ys.reduce((s,y,i)=>s+(y-(slope*xs[i]+intercept))**2,0);
  const r2 = 1 - ssRes/ssTot;
  return { slope, intercept, r2, ssRes, ssTot };
}

export function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a,b)=>a+b,0)/arr.length;
  return Math.sqrt(arr.reduce((s,v)=>s+(v-m)**2,0)/(arr.length-1));
}

// Table F critique 1% (ddl1 = p-2, ddl2 = p*(n-1))
export const F_TABLE_1PCT = {
  1:{5:16.258,6:13.745,7:12.246,8:11.259,9:10.561,10:10.044,12:9.33,15:8.683,16:8.531,18:8.285,20:8.096,24:7.823,25:7.77,30:7.562,40:7.314,50:7.171,60:7.077,80:6.963,100:6.895,120:6.851},
  2:{5:13.274,6:10.925,7:9.547,8:8.649,9:8.022,10:7.559,12:6.927,15:6.359,16:6.226,18:6.013,20:5.849,24:5.614,25:5.568,30:5.39,40:5.179,50:5.057,60:4.977,80:4.881,100:4.824,120:4.787},
  3:{5:12.06,6:9.78,7:8.451,8:7.591,9:6.992,10:6.552,12:5.953,15:5.417,16:5.292,18:5.092,20:4.938,24:4.718,25:4.675,30:4.51,40:4.313,50:4.199,60:4.126,80:4.036,100:3.984,120:3.949},
  4:{5:11.392,6:9.148,7:7.847,8:7.006,9:6.422,10:5.994,12:5.412,15:4.893,16:4.773,18:4.579,20:4.431,24:4.218,25:4.177,30:4.018,40:3.828,50:3.72,60:3.649,80:3.563,100:3.513,120:3.48},
  5:{5:10.967,6:8.746,7:7.46,8:6.632,9:6.057,10:5.636,12:5.064,15:4.556,16:4.437,18:4.248,20:4.103,24:3.895,25:3.855,30:3.699,40:3.514,50:3.408,60:3.339,80:3.255,100:3.206,120:3.174},
  6:{5:10.672,6:8.466,7:7.191,8:6.371,9:5.802,10:5.386,12:4.821,15:4.318,16:4.202,18:4.015,20:3.871,24:3.667,25:3.627,30:3.473,40:3.291,50:3.186,60:3.119,80:3.036,100:2.988,120:2.956},
  7:{5:10.456,6:8.26,7:6.993,8:6.178,9:5.613,10:5.2,12:4.64,15:4.142,16:4.026,18:3.841,20:3.699,24:3.496,25:3.457,30:3.304,40:3.124,50:3.02,60:2.953,80:2.871,100:2.823,120:2.792},
  8:{5:10.289,6:8.102,7:6.84,8:6.029,9:5.467,10:5.057,12:4.499,15:4.004,16:3.89,18:3.705,20:3.564,24:3.363,25:3.324,30:3.173,40:2.993,50:2.89,60:2.823,80:2.742,100:2.694,120:2.663},
  9:{5:10.158,6:7.976,7:6.719,8:5.911,9:5.351,10:4.942,12:4.388,15:3.895,16:3.78,18:3.597,20:3.457,24:3.256,25:3.217,30:3.067,40:2.888,50:2.785,60:2.718,80:2.637,100:2.59,120:2.559},
  10:{5:10.051,6:7.874,7:6.62,8:5.814,9:5.257,10:4.849,12:4.296,15:3.805,16:3.691,18:3.508,20:3.368,24:3.168,25:3.129,30:2.979,40:2.801,50:2.698,60:2.632,80:2.551,100:2.503,120:2.472},
  11:{5:9.963,6:7.79,7:6.538,8:5.734,9:5.178,10:4.772,12:4.22,15:3.73,16:3.616,18:3.434,20:3.294,24:3.094,25:3.056,30:2.906,40:2.727,50:2.625,60:2.559,80:2.478,100:2.43,120:2.399},
  12:{5:9.888,6:7.718,7:6.469,8:5.667,9:5.111,10:4.706,12:4.155,15:3.666,16:3.553,18:3.371,20:3.231,24:3.032,25:2.993,30:2.843,40:2.665,50:2.562,60:2.496,80:2.415,100:2.368,120:2.336},
  13:{5:9.825,6:7.657,7:6.41,8:5.609,9:5.055,10:4.65,12:4.1,15:3.612,16:3.498,18:3.316,20:3.177,24:2.977,25:2.939,30:2.789,40:2.611,50:2.508,60:2.442,80:2.361,100:2.313,120:2.282},
  14:{5:9.77,6:7.605,7:6.359,8:5.559,9:5.005,10:4.601,12:4.052,15:3.564,16:3.451,18:3.269,20:3.13,24:2.93,25:2.892,30:2.742,40:2.563,50:2.461,60:2.394,80:2.313,100:2.265,120:2.234},
  15:{5:9.722,6:7.559,7:6.314,8:5.515,9:4.962,10:4.558,12:4.01,15:3.522,16:3.409,18:3.227,20:3.088,24:2.889,25:2.85,30:2.7,40:2.522,50:2.419,60:2.352,80:2.271,100:2.223,120:2.192},
};

export function getFCrit(ddl1, ddl2) {
  const row = F_TABLE_1PCT[Math.min(ddl1,15)];
  if (!row) return null;
  const keys = Object.keys(row).map(Number).sort((a,b)=>a-b);
  // cherche la valeur tabulée la plus proche >= ddl2
  for (const k of keys) { if (k >= ddl2) return row[k]; }
  return row[keys[keys.length-1]];
}

export function nmToColor(nm) {
  if (nm < 380) return '#8800ff';
  if (nm < 450) { const t=(nm-380)/70; return `hsl(${270-t*30},100%,45%)`; }
  if (nm < 495) { const t=(nm-450)/45; return `hsl(${240-t*60},100%,50%)`; }
  if (nm < 500) { const t=(nm-495)/5;  return `hsl(${180-t*60},100%,45%)`; }
  if (nm < 570) { const t=(nm-500)/70; return `hsl(${120-t*60},100%,45%)`; }
  if (nm < 590) { const t=(nm-570)/20; return `hsl(${60-t*30},100%,50%)`; }
  if (nm < 620) { const t=(nm-590)/30; return `hsl(${30-t*30},100%,50%)`; }
  if (nm < 750) { const t=(nm-620)/130; return `hsl(0,${100-t*40}%,${50-t*15}%)`; }
  return '#5a0000';
}

export function getAbsAtNm(analyteName, nm) {
  const entry = ANALYTES_BL[analyteName];
  if (!entry || !entry.curve) return 0;
  const curve = entry.curve;
  for (let i=0; i<curve.length-1; i++) {
    if (nm>=curve[i][0] && nm<=curve[i+1][0]) {
      const t=(nm-curve[i][0])/(curve[i+1][0]-curve[i][0]);
      return curve[i][1]+t*(curve[i+1][1]-curve[i][1]);
    }
  }
  return 0;
}

export function SpectroSchema({ analyteName, lambdaNm, onLambdaChange, concRatio=0.5 }) {
  const a = ANALYTES_BL[analyteName];
  const absNorm = getAbsAtNm(analyteName, lambdaNm);

  // Couleur correcte : interpolation HSL calée sur le spectre visible réel
  function nmToHue(nm) {
    if (nm < 380) return { h:270, s:100, l:40 };
    if (nm < 450) { const t=(nm-380)/70; return { h:270-t*30, s:100, l:40 }; }
    if (nm < 490) { const t=(nm-450)/40; return { h:240-t*60, s:100, l:45 }; }
    if (nm < 510) { const t=(nm-490)/20; return { h:180-t*60, s:100, l:40 }; }
    if (nm < 560) { const t=(nm-510)/50; return { h:120-t*60, s:100, l:35 }; }
    if (nm < 590) { const t=(nm-560)/30; return { h:60-t*30,  s:100, l:45 }; }
    if (nm < 625) { const t=(nm-590)/35; return { h:30-t*30,  s:100, l:45 }; }
    if (nm < 780) { const t=(nm-625)/155; return { h:0, s:100, l:45-t*20 }; }
    return { h:0, s:80, l:25 };
  }
  function nmToColor(nm) {
    const {h,s,l} = nmToHue(nm);
    return `hsl(${h},${s}%,${l}%)`;
  }

  const beamColor = nmToColor(lambdaNm);
  const A = absNorm * concRatio * 1.5;
  const transOpacity = Math.max(0.05, 1 - A / 1.5);
  const solOpacity = 0.15 + concRatio * 0.75;
  const absDisplay = A.toFixed(3);

  // Courbe lissée : interpolation linéaire point par point nm par nm
  const spectrumPath = (() => {
    // Zone du tracé : x de 50 à 615 (565px pour 400nm)
    const X = nm => 50 + (nm - 380) / 400 * 565;
    const Y = v => 78 - v * 60;
    const pts = [];
    for (let nm = 380; nm <= 780; nm++) {
      pts.push([X(nm), Y(getAbsAtNm(analyteName, nm))]);
    }
    // Bézier quadratique par points milieux → courbe très lisse
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = ((pts[i][0] + pts[i+1][0]) / 2).toFixed(1);
      const my = ((pts[i][1] + pts[i+1][1]) / 2).toFixed(1);
      d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx},${my}`;
    }
    d += ` L${pts[pts.length-1][0].toFixed(1)},${pts[pts.length-1][1].toFixed(1)}`;
    return d;
  })();

  // Position curseur : même formule que X(nm) dans spectrumPath
  const cursorX = 50 + (lambdaNm - 380) / 400 * 565;
  const cursorY = 78 - absNorm * 60;

  // Gradient calé : les stops en % correspondent aux positions nm sur [380,780]
  // nm=380 → 0%, nm=450 → 17.5%, nm=490 → 27.5%, nm=510 → 32.5%,
  // nm=560 → 45%, nm=590 → 52.5%, nm=625 → 61.25%, nm=780 → 100%
  const gradientStops = [
    { pct: '0%',     color: 'hsl(270,100%,40%)' },  // 380nm violet
    { pct: '17.5%',  color: 'hsl(240,100%,45%)' },  // 450nm bleu
    { pct: '27.5%',  color: 'hsl(180,100%,40%)' },  // 490nm cyan
    { pct: '32.5%',  color: 'hsl(120,100%,35%)' },  // 510nm vert
    { pct: '45%',    color: 'hsl(60,100%,45%)'  },  // 560nm jaune-vert
    { pct: '52.5%',  color: 'hsl(30,100%,45%)'  },  // 590nm orange
    { pct: '61.25%', color: 'hsl(0,100%,45%)'   },  // 625nm rouge
    { pct: '100%',   color: 'hsl(0,80%,25%)'    },  // 780nm rouge sombre
  ];

  function handleSpectrumClick(e) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) / rect.width * 680;
    const nm = Math.round(Math.max(380, Math.min(780, 380 + (svgX - 50) / 565 * 400)));
    onLambdaChange(nm);
  }

  const uid = analyteName;

  return (
    <div>
      {/* ── Schéma spectrophotomètre ── */}
      <svg width="100%" viewBox="0 0 680 220">
        <defs>
          <linearGradient id={`sol-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={a.solutionColor} stopOpacity={solOpacity*0.5}/>
            <stop offset="100%" stopColor={a.solutionColor} stopOpacity={solOpacity}/>
          </linearGradient>
          <linearGradient id={`beam-cuve-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={beamColor} stopOpacity="0.9"/>
            <stop offset="100%" stopColor={beamColor} stopOpacity={transOpacity}/>
          </linearGradient>
        </defs>

        {/* SOURCE */}
        <rect x="10" y="85" width="65" height="48" rx="7" fill="#555" stroke="#333" strokeWidth="1"/>
        <ellipse cx="75" cy="109" rx="10" ry="10" fill="#ffeeaa" stroke="#aaa" strokeWidth="0.5"/>
        <ellipse cx="75" cy="109" rx="5"  ry="5"  fill="#ffe066"/>
        <text x="42" y="148" textAnchor="middle" fill="#888" fontSize="13">Source</text>

        {/* PRISME */}
        <polygon points="98,90 132,74 132,144 98,128" fill="#d0e8ff" stroke="#7ab" strokeWidth="1"/>
        {[['#8800ff',82],['#4488ff',92],['#00bb44',103],['#aacc00',113],['#ee8800',124],['#ee2200',134]].map(([c,y],i)=>(
          <line key={i} x1="132" y1={y} x2="144" y2={y} stroke={c} strokeWidth={i===2?3:1.5}/>
        ))}
        <text x="115" y="160" textAnchor="middle" fill="#888" fontSize="12">Monochromateur</text>

        {/* Faisceau blanc source→prisme */}
        <rect x="75" y="106" width="23" height="7" rx="3" fill="white" opacity="0.5"/>

        {/* Faisceau incident prisme→cuve */}
        <rect x="144" y="106" width="78" height="7" rx="3" fill={beamColor} opacity="0.9"/>

        {/* CUVE ouverte (parois fines) */}
        <rect x="222" y="65"  width="3" height="125" fill="#666"/>  {/* paroi gauche */}
        <rect x="365" y="65"  width="3" height="125" fill="#666"/>  {/* paroi droite */}
        <rect x="222" y="188" width="146" height="3" fill="#666"/>  {/* fond */}
        {/* Liquide */}
        <rect x="225" y="88"  width="140" height="100" fill={`url(#sol-${uid})`}/>
        {/* Faisceau dans la cuve avec dégradé */}
        <rect x="225" y="106" width="140" height="7" fill={`url(#beam-cuve-${uid})`}/>
        <text x="294" y="207" textAnchor="middle" fill="#888" fontSize="13">Cuve</text>

        {/* Faisceau transmis */}
        <rect x="368" y="106" width="85" height="7" rx="3" fill={beamColor} opacity={transOpacity}/>

        {/* DÉTECTEUR */}
        <rect x="453" y="88" width="76" height="58" rx="8" fill="#2a6" stroke="#185" strokeWidth="1"/>
        <ellipse cx="453" cy="109" rx="8" ry="8" fill="#55ff88" stroke="#2a6" strokeWidth="0.5"/>
        <rect x="482" y="96" width="38" height="44" rx="4" fill="#1a4" stroke="#0f3" strokeWidth="0.5"/>
        <text x="501" y="118" textAnchor="middle" fill="#ccffcc" fontSize="15" fontWeight="bold">{absDisplay}</text>
        <text x="501" y="132" textAnchor="middle" fill="#88dd99" fontSize="12">Absorbance</text>
        <text x="491" y="162" textAnchor="middle" fill="#888" fontSize="13">Détecteur</text>

        {/* FORMULE */}
        <rect x="538" y="86" width="130" height="62" rx="6" fill="#f0f4f8" stroke="#ccc" strokeWidth="0.5"/>
        <text x="603" y="106" textAnchor="middle" fill="#222" fontSize="12" fontWeight="bold">Beer-Lambert</text>
        <text x="603" y="124" textAnchor="middle" fill="#222" fontSize="13">A = log(I₀ / I)</text>
        <text x="603" y="141" textAnchor="middle" fill="#222" fontSize="13">A = ε · l · C</text>

        {/* Labels I₀ et I */}
        <text x="188" y="102" textAnchor="middle" fill="#444" fontSize="15" fontWeight="bold">I₀</text>
        <text x="408" y="102" textAnchor="middle" fill="#444" fontSize="15" fontWeight="bold">I</text>
      </svg>

      {/* ── Spectre UV-visible ── */}
      <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:4}}>
        Spectre d'absorption — cliquer pour choisir λ de travail
      </div>
      <svg width="100%" viewBox="0 0 680 115"
        onClick={handleSpectrumClick} style={{cursor:'crosshair'}}>
        <defs>
          <linearGradient id={`spec-${uid}`} x1="0" y1="0" x2="1" y2="0">
            {gradientStops.map(({pct,color}) => (
              <stop key={pct} offset={pct} stopColor={color}/>
            ))}
          </linearGradient>
        </defs>

        {/* Axes */}
        <line x1="50" y1="85" x2="615" y2="85" stroke="#aaa" strokeWidth="0.8"/>
        <line x1="50" y1="10" x2="50"  y2="85" stroke="#aaa" strokeWidth="0.8"/>

        {/* Labels */}
        <text x="50"  y="102" textAnchor="middle" fill="#666" fontSize="13">380</text>
        <text x="332" y="112" textAnchor="middle" fill="#666" fontSize="13">λ (nm)</text>
        <text x="615" y="102" textAnchor="middle" fill="#666" fontSize="13">780</text>
        <text x="30"  y="50"  textAnchor="middle" fill="#666" fontSize="14" fontWeight="bold">A</text>

        {/* Bande couleur — même zone x=50..615 que la courbe */}
        <rect x="50" y="74" width="565" height="11" fill={`url(#spec-${uid})`} rx="2"/>

        {/* Courbe d'absorption lissée */}
        <path d={spectrumPath} fill="none" stroke="#333" strokeWidth="2"/>

        {/* Curseur λ */}
        <line x1={cursorX} y1="8" x2={cursorX} y2="85"
          stroke={beamColor} strokeWidth="2" strokeDasharray="5 3"/>
        <circle cx={cursorX} cy={cursorY} r="5" fill={beamColor} stroke="white" strokeWidth="1"/>
        <text
          x={Math.min(Math.max(cursorX, 65), 600)} y="20"
          textAnchor="middle" fill={beamColor} fontSize="13" fontWeight="bold">
          {lambdaNm} nm
        </text>
      </svg>
    </div>
  );
}


// ---- Composant étalonnage (commun 1G et BTS) ----
export function CalibrationPlot({ plotlyReady, xs, ys, xsScale, ysScale, mesurande, unite, grandeurLabel, aechValue, onAechChange, showResiduals=false, nLevels=null, maxLevels=null, onNLevels=null, lambdaNm, peakNm, calibClassName, residClassName }) {
  const divId = 'calib-'+Math.random().toString(36).slice(2);
  const residId = 'resid-'+divId;
  const plotRef = useRef(null);
  const residRef = useRef(null);

  const reg = xs.length >= 2 ? linReg(xs, ys) : null;

  // Calcul Cech
  let Cech = null;
  if (reg && aechValue !== '' && !isNaN(parseFloat(aechValue))) {
    const A = parseFloat(aechValue);
    Cech = reg.slope !== 0 ? (A - reg.intercept) / reg.slope : null;
  }

  useEffect(() => {
    if (!plotlyReady || !reg || xs.length < 2) return;
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const xLine = [xMin, xMax + (xMax-xMin)*0.05];
    const yLine = xLine.map(x => reg.slope*x + reg.intercept);

    const traces = [
      { x: xs, y: ys, mode:'markers', type:'scatter', name:'Étalons',
        marker:{color:'#3b82f6', size:7, symbol:'circle'} },
      { x: xLine, y: yLine, mode:'lines', type:'scatter', name:'Régression',
        line:{color:'#dc2626', width:2},
        hoverinfo:'skip' },
    ];

    // Segments pointillés Aech → Cech
    if (Cech !== null && Cech >= 0) {
      const A = parseFloat(aechValue);
      traces.push({ x:[xMin,Cech], y:[A,A], mode:'lines', name:'A = Aéch',
        line:{color:'#16a34a', width:1.5, dash:'dot'}, hoverinfo:'skip' });
      traces.push({ x:[Cech,Cech], y:[0, A], mode:'lines', name:`${mesurande} éch`,
        line:{color:'#d97706', width:1.5, dash:'dot'}, hoverinfo:'skip' });
      traces.push({ x:[Cech], y:[A], mode:'markers', showlegend:false,
        marker:{color:'#16a34a', size:10, symbol:'circle'} });
    }

    // Échelle Y fixée sur les valeurs max (pic) pour que l'axe ne bouge pas quand λ change
      const yMax = ysScale && ysScale.length > 0 ? Math.max(...ysScale) * 1.15 : undefined;
      const xMaxScale = xsScale && xsScale.length > 0 ? Math.max(...xsScale) * 1.05 : undefined;
      const yMaxScale = ysScale && ysScale.length > 0 ? Math.max(...ysScale) * 1.15 : undefined;  
      const layout = {
        xaxis:{title:`${mesurande} (${unite})`, gridcolor:'rgba(128,128,128,0.15)', zeroline:false, range: xMaxScale ? [0, xMaxScale] : undefined},
        yaxis:{title: grandeurLabel || 'Absorbance', gridcolor:'rgba(128,128,128,0.15)', zeroline:false, range: yMaxScale ? [0, yMaxScale] : undefined},
      paper_bgcolor:'transparent', plot_bgcolor:'transparent',
      margin:{t:20,r:20,b:50,l:60},
      legend:{x:0,y:1,bgcolor:'transparent'},
      font:{size:12},
      showlegend:true,
    };

    Plotly.react(plotRef.current, traces, layout, {responsive:true, displayModeBar:false});
  }, [plotlyReady, xs, ys, reg, Cech, aechValue, mesurande, unite]);

  // Résidus (BTS uniquement)
  useEffect(() => {
    if (!showResiduals || !plotlyReady || !reg || xs.length < 2 || !residRef.current) return;
    const residuals = ys.map((y,i) => y - (reg.slope*xs[i]+reg.intercept));
    Plotly.react(residRef.current, [
      { x:xs, y:residuals, mode:'markers', type:'scatter', name:'Résidus',
        marker:{color:'#7c3aed', size:7} },
      { x:[Math.min(...xs), Math.max(...xs)], y:[0,0], mode:'lines',
        line:{color:'#555', width:1, dash:'dash'}, hoverinfo:'skip', showlegend:false }
    ], {
      xaxis:{title:`${mesurande} (${unite})`, gridcolor:'rgba(128,128,128,0.15)'},
      yaxis:{title:'Résidu (Aexp − Acalc)', gridcolor:'rgba(128,128,128,0.15)', zeroline:false},
      paper_bgcolor:'transparent', plot_bgcolor:'transparent',
      margin:{t:20,r:20,b:50,l:60},
      legend:{bgcolor:'transparent'}, font:{size:12},
    }, {responsive:true, displayModeBar:false});
  }, [showResiduals, plotlyReady, xs, ys, reg]);

  if (!reg) return <p style={{color:'var(--color-text-secondary)',padding:'1rem'}}>Données insuffisantes pour tracer la courbe.</p>;

  return (
    <div>
      {showResiduals && onNLevels && (
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8,flexWrap:'wrap'}}>
          <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>Niveaux inclus :</span>
          <input type="range" min={2} max={maxLevels} value={nLevels}
            onChange={e=>onNLevels(Number(e.target.value))} style={{width:160}}/>
          <span style={{fontSize:13,fontWeight:'500'}}>{nLevels} / {maxLevels}</span>
        </div>
      )}
      <div ref={plotRef} className={calibClassName||''} style={{width:'100%',height:320}}/>
      {showResiduals && (
        <>
          <div style={{fontSize:12,color:'var(--color-text-secondary)',margin:'8px 0 4px'}}>Graphique des résidus</div>
          <div ref={residRef} className={residClassName||''} style={{width:'100%',height:220}}/>
        </>
      )}
      {/* Lecture Cech */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10,flexWrap:'wrap'}}>
        <label style={{fontSize:13,color:'var(--color-text-secondary)'}}>Absorbance de l'échantillon :</label>
        <Field label="" value={aechValue} onChange={onAechChange} width={90} type="number" step="0.001" min="0"/>
        {Cech !== null && Cech >= 0 && (
          <span style={{fontSize:15,fontWeight:'500',color:'#16a34a'}}>
            → {mesurande} = <strong>{Cech.toFixed(4)}</strong> {unite}
          </span>
        )}
        {Cech !== null && Cech < 0 && (
          <span style={{fontSize:13,color:'#dc2626'}}>⚠ Valeur hors domaine d'étalonnage</span>
        )}
      </div>
    </div>
  );
}

// ====================================================
// SIM 10 — BEER-LAMBERT 1G
// ====================================================
export function BeerLambert1G({ plotlyReady }) {
  const [analyte, setAnalyte] = useState('permanganate');
  const [lambdaNm, setLambdaNm] = useState(525);
  const [tab, setTab] = useState(null); // null = rien affiché
  const [nNiveaux, setNNiveaux] = useState(5);
  const [nRep, setNRep] = useState(1);
  const [mesurande, setMesurande] = useState('C');
  const [unite, setUnite] = useState('mg/L');
  const [manualData, setManualData] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [aech, setAech] = useState('');

  const [customNom, setCustomNom] = useState('');
  const [customLambda, setCustomLambda] = useState(500);
  const a = analyte !== 'autre' ? ANALYTES_BL[analyte] : null;
  useEffect(() => {
    if (analyte !== 'autre') setLambdaNm(a.peakNm);
    else setLambdaNm(customLambda);
    setTab(null);
  }, [analyte]);

  // Sensibilité au λ choisi
  const sensibilite = getAbsAtNm(analyte, lambdaNm);
  const sensibiliteMax = a ? getAbsAtNm(analyte, a.peakNm) : 1;
  const facteurLambda = sensibiliteMax > 0 ? sensibilite / sensibiliteMax : 0;
  const pct = Math.round(facteurLambda * 100);
  const sensColor = pct > 70 ? '#16a34a' : pct > 35 ? '#d97706' : '#dc2626';

  // Données selon onglet, absorbances ajustées par facteurLambda pour l'exemple
  let xs = [], ys = [], mesLabel = mesurande, uniteLabel = unite;
  // Échelle fixe = valeurs à la sensibilité MAX (pour garder les axes stables)
  let xsMax = [], ysMax = [];

  if (tab === 'exemple') {
    if (!a) return;
    const ex = a.exampleData;
    mesLabel = ex.mesurande; uniteLabel = ex.unite;
    ex.concentrations.forEach((c,i) =>
      ex.absorbances[i].forEach(v => {
        xs.push(c); ys.push(v * facteurLambda);
        xsMax.push(c); ysMax.push(v); // valeurs au pic pour fixer l'échelle
      })
    );
  } else if (tab === 'manuel' && manualData) {
    manualData.concentrations.forEach((c,i) =>
      manualData.absorbances[i].forEach(v => { xs.push(c); ys.push(v); xsMax.push(c); ysMax.push(v); })
    );
  } else if (tab === 'tableur') {
    pasteText.trim().split('\n').forEach(line => {
      const raw = line.trim().split(/\t|;/); // séparateur tab ou ; uniquement (pas virgule car décimale FR)
      const first = parseFloat(raw[0].replace(',','.'));
      if (isNaN(first)) return;
      raw.slice(1).forEach(s => {
        const v = parseFloat(s.replace(',','.'));
        if (!isNaN(v)) { xs.push(first); ys.push(v); xsMax.push(first); ysMax.push(v); }
      });
    });
  }

  const reg = xs.length >= 2 ? linReg(xs, ys) : null;
  const regMax = xsMax.length >= 2 ? linReg(xsMax, ysMax) : null;

  let blankVals = [];
  if (tab === 'exemple' && a) blankVals = a.exampleData.absorbances[0].map(v => v * facteurLambda);
  else if (tab === 'manuel' && manualData) blankVals = manualData.absorbances[0];
  const stdBlank = stdDev(blankVals);
  const LD = reg && reg.slope ? 3*stdBlank/reg.slope : null;
  const LQ = reg && reg.slope ? 10*stdBlank/reg.slope : null;

  function initManualGrid() {
    setManualData({
      concentrations: Array(nNiveaux).fill(0),
      absorbances: Array(nNiveaux).fill(null).map(()=>Array(nRep).fill(0)),
    });
  }
  function updateManualConc(i, val) {
    setManualData(d => { const c=[...d.concentrations]; c[i]=parseFloat(val)||0; return {...d,concentrations:c}; });
  }
  function updateManualAbs(i, j, val) {
    setManualData(d => { const ab=d.absorbances.map(r=>[...r]); ab[i][j]=parseFloat(val)||0; return {...d,absorbances:ab}; });
  }

  return (
    <div style={cardStyle}>
      <h2 style={{marginTop:0,fontSize:18,color:'var(--color-text-primary)'}}>Loi de Beer-Lambert — Niveau 1<sup>re</sup> générale</h2>

      {/* Choix analyte */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
        <label style={{fontSize:13,color:'var(--color-text-secondary)'}}>Analyte :</label>
        <select value={analyte} onChange={e=>{setAnalyte(e.target.value); if(tab==='exemple') setTab('manuel');}} style={{fontSize:13}}>
          {Object.entries(ANALYTES_BL).map(([k,v])=>(<option key={k} value={k}>{v.label}</option>))}
        </select>
      </div>
      {analyte === 'autre' && (
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12,alignItems:'flex-end',
          padding:'10px 14px',background:'var(--color-background-secondary)',borderRadius:8}}>
          <Field label="Nom de l'analyte" value={customNom} onChange={setCustomNom} width={160} type="text"/>
          <div>
            <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>λ max (nm)</div>
            <input type="number" value={customLambda} min={380} max={780}
              onChange={e=>{const v=Number(e.target.value); setCustomLambda(v); setLambdaNm(v);}}
              style={{width:80,fontSize:13,padding:'4px 6px'}}/>
          </div>
          <div style={{fontSize:12,color:'var(--color-text-secondary)'}}>
            Saisissez vos données via "Saisie manuelle" ou "Copier-coller tableur".
          </div>
        </div>
      )}

      {/* Schéma spectro — masqué pour "autre" */}
      {analyte !== 'autre' && (
        <SpectroSchema analyteName={analyte} lambdaNm={lambdaNm} onLambdaChange={setLambdaNm}/>
      )}
      {analyte === 'autre' && (
        <div style={{padding:'10px 14px',fontSize:13,color:'var(--color-text-secondary)',
          background:'var(--color-background-secondary)',borderRadius:8,marginBottom:8}}>
          λ de travail sélectionné : <strong>{customLambda} nm</strong>
          {' — '}couleur du faisceau :{' '}
          <span style={{display:'inline-block',width:18,height:10,borderRadius:3,
            background:nmToColor(customLambda),verticalAlign:'middle'}}/>
        </div>
      )}

      {/* Barre de sensibilité — masquée pour "autre analyte" */}
      {analyte !== 'autre' && (
        <div style={{display:'flex',alignItems:'center',gap:10,margin:'8px 0 4px',flexWrap:'wrap'}}>
          <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>Sensibilité à {lambdaNm} nm :</span>
          <div style={{flex:1,maxWidth:200,height:10,background:'var(--color-background-secondary)',borderRadius:5,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:sensColor,borderRadius:5,transition:'width 0.3s,background 0.3s'}}/>
          </div>
          <span style={{fontSize:13,fontWeight:'500',color:sensColor}}>{pct}%</span>
          {pct < 50 && <span style={{fontSize:12,color:'#d97706'}}>⚠ Sensibilité faible</span>}
        </div>
      )}

      <hr style={{margin:'16px 0',borderColor:'var(--color-border-tertiary)'}}/>

      {/* Titre section courbe étalonnage + onglets */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:15,fontWeight:'500',marginBottom:10,color:'var(--color-text-primary)'}}>
          Courbe d'étalonnage
        </div>
        <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:10}}>
          Choisissez une source de données pour afficher la courbe :
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {[['exemple','Exemple'],['manuel','Saisie manuelle'],['tableur','Copier-coller tableur']]
            .filter(([k])=> !(k==='exemple' && analyte==='autre'))
            .map(([k,l])=>(
              <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>
            ))}
        </div>
      </div>

      {/* Contenu onglet exemple */}
      {tab==='exemple' && (
        <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:8}}>
          {a && <>Étalonnage {a.exampleData.mesurande} — {a.exampleData.niveaux} niveaux × {a.exampleData.repetitions} répétitions.{' '}</>}
          <span style={{color:sensColor,fontWeight:'500'}}>
            Absorbances simulées à {lambdaNm} nm{a ? ` (${pct}% du max à ${a.peakNm} nm)` : ''}.
          </span>
        </div>
      )}

      {/* Contenu onglet saisie manuelle */}
      {tab==='manuel' && (
        <div style={{marginBottom:12}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10,alignItems:'flex-end'}}>
            <CoeffInput label="Nb solutions étalons (blanc compris)" value={nNiveaux} onChange={v=>setNNiveaux(Math.max(2,Math.min(15,v)))} min={2} max={15}/>
            <CoeffInput label="Nb essais par solution étalon" value={nRep} onChange={v=>setNRep(Math.max(1,Math.min(10,v)))} min={1} max={10}/>
            <Field label="Mesurande" value={mesurande} onChange={setMesurande} width={120} type="text"/>
            <Field label="Unité" value={unite} onChange={setUnite} width={80} type="text"/>
            <button onClick={initManualGrid} style={{padding:'4px 12px',fontSize:13}}>Créer le tableau</button>
          </div>
          {manualData && (
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr>
                    <th style={{padding:'4px 8px',borderBottom:'1px solid var(--color-border-tertiary)'}}>{mesurande} ({unite})</th>
                    {Array(nRep).fill(0).map((_,j)=>(
                      <th key={j} style={{padding:'4px 8px',borderBottom:'1px solid var(--color-border-tertiary)'}}>A{j+1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {manualData.concentrations.map((c,i)=>(
                    <tr key={i}>
                      <td style={{padding:'2px 4px'}}>
                        <input type="number" value={c} onChange={e=>updateManualConc(i,e.target.value)}
                          style={{width:70,fontSize:12,padding:'2px 4px'}}/>
                      </td>
                      {Array(nRep).fill(0).map((_,j)=>(
                        <td key={j} style={{padding:'2px 4px'}}>
                          <input type="number" value={manualData.absorbances[i][j]}
                            onChange={e=>updateManualAbs(i,j,e.target.value)}
                            style={{width:70,fontSize:12,padding:'2px 4px'}} step="0.001"/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contenu onglet tableur */}
      {tab==='tableur' && (
        <div style={{marginBottom:12}}>
          <p style={{fontSize:13,color:'var(--color-text-secondary)',marginTop:0}}>
            Collez vos données depuis un tableur (séparateur : tabulation, ; ou ,) :<br/>
            <code style={{fontSize:11}}>C{'\t'}A1{'\t'}A2{'\t'}A3</code>
          </p>
          <div style={{display:'flex',gap:10,marginBottom:8,flexWrap:'wrap'}}>
            <Field label="Mesurande" value={mesurande} onChange={setMesurande} width={120} type="text"/>
            <Field label="Unité" value={unite} onChange={setUnite} width={80} type="text"/>
          </div>
          <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
            placeholder={"C\tA1\tA2\tA3\n0\t0.002\t0.001\t0.003\n2\t0.118\t0.120\t0.119"}
            style={{width:'100%',height:120,fontSize:12,fontFamily:'monospace',
              padding:8,boxSizing:'border-box',border:'1px solid var(--color-border-tertiary)',
              borderRadius:6,background:'var(--color-background-primary)',color:'var(--color-text-primary)'}}/>
        </div>
      )}

      {/* Statistiques + courbe — visibles dès qu'un onglet est sélectionné */}
      {tab && reg && (
        <>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'12px 0'}}>
            {[
              ['Pente a', `${reg.slope.toFixed(4)} ${uniteLabel}⁻¹`],
              ['Ordonnée b', reg.intercept.toFixed(4)],
              ['R²', reg.r2.toFixed(5)],
              
            ].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{background:'var(--color-background-secondary)',borderRadius:8,padding:'8px 14px',minWidth:110}}>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{l}</div>
                <div style={{fontSize:15,fontWeight:'500'}}>{v}</div>
              </div>
            ))}
          </div>

          <CalibrationPlot
            plotlyReady={plotlyReady}
            xs={xs} ys={ys}
            xsScale={xsMax} ysScale={ysMax}
            mesurande={mesLabel} unite={uniteLabel}
            aechValue={aech} onAechChange={setAech}
            lambdaNm={lambdaNm} peakNm={a ? a.peakNm : lambdaNm}/>
        </>
      )}

      {tab && !reg && xs.length < 2 && (
        <p style={{fontSize:13,color:'var(--color-text-secondary)'}}>
          Saisissez au moins 2 niveaux de concentration pour afficher la courbe.
        </p>
      )}
    </div>
  );
}

// ====================================================
// SIM 11 — BEER-LAMBERT BTS
// ====================================================

export function BeerLambertBTS({ plotlyReady }) {
  const [methode, setMethode] = useState('beerlambert');
  const [analyte, setAnalyte] = useState('permanganate');
  const [lambdaNm, setLambdaNm] = useState(525);
  const [tab, setTab] = useState(null);
  const [nNiveaux, setNNiveaux] = useState(5);
  const [nRep, setNRep] = useState(3);
  const [mesurande, setMesurande] = useState('C');
  const [unite, setUnite] = useState('mg/L');
  const [grandeur, setGrandeur] = useState('Absorbance');
  const [manualData, setManualData] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [aech, setAech] = useState('');
  const [nLevelsIncluded, setNLevelsIncluded] = useState(11);
  const [customNom, setCustomNom] = useState('');
  const [customLambda, setCustomLambda] = useState(500);
  const [showFormules, setShowFormules] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef(null);

  const a = analyte !== 'autre' ? ANALYTES_BL[analyte] : null;

  useEffect(() => {
    if (methode === 'beerlambert' && analyte !== 'autre') setLambdaNm(a.peakNm);
    setTab(methode === 'autre' ? 'exemple' : null);
  }, [methode, analyte]);

  const sensibilite = (methode === 'beerlambert' && analyte !== 'autre') ? getAbsAtNm(analyte, lambdaNm) : 1;
  const sensibiliteMax = (methode === 'beerlambert' && analyte !== 'autre') ? getAbsAtNm(analyte, a.peakNm) : 1;
  const facteurLambda = sensibiliteMax > 0 ? sensibilite / sensibiliteMax : 1;
  const pct = Math.round(facteurLambda * 100);
  const sensColor = pct > 70 ? '#16a34a' : pct > 35 ? '#d97706' : '#dc2626';

  const exBL = {
    mesurande: 'C(KMnO₄)', unite: 'mg/L', grandeur: 'Absorbance',
    niveaux: 5, repetitions: 5,
    concentrations: [0, 2, 4, 6, 8],
    absorbances: [
      [0.002, 0.001, 0.003, 0.002, 0.001],
      [0.118, 0.120, 0.119, 0.121, 0.117],
      [0.241, 0.238, 0.240, 0.239, 0.242],
      [0.359, 0.361, 0.358, 0.360, 0.362],
      [0.480, 0.478, 0.482, 0.479, 0.481],
    ]
  };

  const exAutre = {
    mesurande: 'C(K⁺)', unite: 'mg/L', grandeur: 'Intensité I',
    niveaux: 11, repetitions: 3,
    concentrations: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    absorbances: [
      [0,-2,1],[20,21,19],[38,41,40],[59,62,57],[78,81,80],
      [98,99,99],[114,115,117],[131,133,132],[149,147,148],[166,165,164],[180,181,182],
    ]
  };

  const exCourant = methode === 'beerlambert' ? exBL : exAutre;

  let allLevels = [];
  if (tab === 'exemple') {
    allLevels = exCourant.concentrations.map((c,i) => ({
      c,
      abs: methode === 'beerlambert'
        ? exCourant.absorbances[i].map(v => v * facteurLambda)
        : exCourant.absorbances[i]
    }));
  } else if (tab === 'manuel' && manualData) {
    allLevels = manualData.concentrations.map((c,i) => ({c, abs: manualData.absorbances[i]}));
  } else if (tab === 'tableur') {
    pasteText.trim().split('\n').forEach(line => {
      const raw = line.trim().split(/\t|;/);
      const first = parseFloat(raw[0].replace(',','.'));
      if (isNaN(first)) return;
      const abs = raw.slice(1).map(s => parseFloat(s.replace(',','.'))).filter(v => !isNaN(v));
      if (abs.length > 0) allLevels.push({c: first, abs});
    });
  }

  const maxLevels = allLevels.length;
  useEffect(() => { if (maxLevels > 0) setNLevelsIncluded(maxLevels); }, [maxLevels]);
  const included = allLevels.slice(0, Math.min(nLevelsIncluded, maxLevels));

  let xs = [], ys = [], xsMax = [], ysMax = [];
  included.forEach(({c,abs}) => abs.forEach(v => { xs.push(c); ys.push(v); }));
  if (tab === 'exemple' && methode === 'beerlambert') {
    exBL.concentrations.forEach((c,i) =>
      exBL.absorbances[i].forEach(v => { xsMax.push(c); ysMax.push(v); })
    );
  } else {
    allLevels.forEach(({c,abs}) => abs.forEach(v => { xsMax.push(c); ysMax.push(v); }));
  }

  const reg = xs.length >= 2 ? linReg(xs, ys) : null;
  const mesLabel = tab === 'exemple' ? exCourant.mesurande : mesurande;
  const uniteLabel = tab === 'exemple' ? exCourant.unite : unite;
  const grandeurLabel = tab === 'exemple' ? exCourant.grandeur : grandeur;

  let sB = null, LD = null, LQ = null;
  if (reg && xs.length >= 3) {
    const n = xs.length;
    const xMean = xs.reduce((s,v)=>s+v,0)/n;
    const Sxx = xs.reduce((s,v)=>s+(v-xMean)**2,0);
    const ssRes = ys.reduce((s,y,i)=>s+(y-(reg.slope*xs[i]+reg.intercept))**2,0);
    const s2 = ssRes/(n-2);
    sB = Math.sqrt(s2*(1/n + xMean**2/Sxx));
    LD = reg.slope !== 0 ? 3*sB/reg.slope : null;
    LQ = reg.slope !== 0 ? 10*sB/reg.slope : null;
  }

  const nRepMin = included.length > 0 ? Math.min(...included.map(l=>l.abs.length)) : 0;
  const canFisher = included.length >= 3 && nRepMin >= 2;
  let fisherResult = null;
  if (canFisher && reg) {
    const p = included.length;
    const n = nRepMin;
    const means = included.map(({abs}) => abs.slice(0,n).reduce((s,v)=>s+v,0)/n);
    const yCalc = included.map(({c}) => reg.slope*c+reg.intercept);
    const SCE_nl = n * means.reduce((s,m,j)=>s+(m-yCalc[j])**2,0);
    const SCE_r = included.reduce((s,{abs},j)=>
      s+abs.slice(0,n).reduce((ss,v)=>ss+(v-means[j])**2,0),0);
    const ddl_nl = p-2, ddl_r = p*(n-1);
    const Fexp = ddl_nl>0 && SCE_r>0 ? (SCE_nl/ddl_nl)/(SCE_r/ddl_r) : null;
    const Fcrit = ddl_nl>0 ? getFCrit(ddl_nl, ddl_r) : null;
    fisherResult = {
      p, n, ddl_nl, ddl_r,
      SCE_nl: SCE_nl.toFixed(5), SCE_r: SCE_r.toFixed(5),
      varNl: ddl_nl>0 ? (SCE_nl/ddl_nl).toFixed(5) : '—',
      varR:  ddl_r>0  ? (SCE_r/ddl_r).toFixed(5)  : '—',
      Fexp: Fexp!==null ? Fexp.toFixed(4) : null,
      Fcrit,
      linearite: Fexp!==null && Fcrit!==null ? Fexp<Fcrit : null
    };
  }

  function initManualGrid() {
    setManualData({
      concentrations: Array(nNiveaux).fill(0),
      absorbances: Array(nNiveaux).fill(null).map(()=>Array(nRep).fill(0)),
    });
  }
  function updateManualConc(i,val) {
    setManualData(d=>{const c=[...d.concentrations];c[i]=parseFloat(val)||0;return{...d,concentrations:c};});
  }
  function updateManualAbs(i,j,val) {
    setManualData(d=>{const ab=d.absorbances.map(r=>[...r]);ab[i][j]=parseFloat(val)||0;return{...d,absorbances:ab};});
  }

  // ── Export PDF ──
   async function exportPDF() {
    if (!reg || !window.html2canvas || !window.jspdf) {
      alert('Librairies PDF non disponibles. Verifiez les scripts dans index.html.');
      return;
    }
    setPdfLoading(true);
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, margin = 15, contentW = W - 2 * margin;
      let y = 0;

      // Palette
      const TEAL   = [42, 157, 143];
      const PURPLE = [106, 76, 147];
      const DARK   = [30, 30, 40];
      const GREY   = [120, 120, 130];
      const WHITE  = [255, 255, 255];
      const TEAL_L = [232, 248, 245];
      const PURP_L = [243, 238, 255];
      const GREEN  = [21, 128, 61];
      const GREEN_L= [240, 253, 244];
      const RED    = [180, 30, 30];
      const RED_L  = [254, 242, 242];

      // ── Nettoyage caractères spéciaux ──
      const cleanTxt = (s) => String(s)
        .replace(/λ/g,'lambda').replace(/₄/g,'4').replace(/₂/g,'2')
        .replace(/₃/g,'3').replace(/⁺/g,'+').replace(/⁻/g,'-')
        .replace(/→/g,'->').replace(/✓/g,'OK').replace(/✗/g,'NON')
        .replace(/—/g,'-').replace(/≥/g,'>=').replace(/≤/g,'<=')
        .replace(/[^\x00-\x7F]/g, c => {
          const map = {
            'é':'e','è':'e','ê':'e','ë':'e',
            'à':'a','â':'a','ä':'a','ã':'a',
            'ô':'o','ö':'o','ò':'o','ó':'o',
            'î':'i','ï':'i','ì':'i','í':'i',
            'ù':'u','û':'u','ü':'u','ú':'u',
            'ç':'c','ñ':'n',
            'É':'E','È':'E','Ê':'E','Ë':'E',
            'À':'A','Â':'A','Ä':'A',
            'Ô':'O','Ö':'O','Î':'I','Ï':'I',
            'Ù':'U','Û':'U','Ü':'U','Ç':'C',
            'ε':'eps','µ':'mu','°':'deg','²':'2','³':'3',
          };
          return map[c] || '';
        });

      // ── Helpers ──
      const setColor  = (rgb) => pdf.setTextColor(...rgb);
      const setFill   = (rgb) => pdf.setFillColor(...rgb);
      const setDraw   = (rgb) => pdf.setDrawColor(...rgb);
      const txt       = (t, x, yy, opts) => pdf.text(cleanTxt(t), x, yy, opts||{});
      const bold      = (sz=10) => { pdf.setFont('helvetica','bold');   pdf.setFontSize(sz); };
      const normal    = (sz=10) => { pdf.setFont('helvetica','normal'); pdf.setFontSize(sz); };
      const pageCheck = (need=30) => { if (y + need > 282) { pdf.addPage(); y = margin; addPageFooter(); } };
      const hLine     = (col=GREY) => { setDraw(col); pdf.line(margin, y, W-margin, y); y += 5; };

      // ── Pied de page (appelé sur chaque page) ──
      function addPageFooter() {
        const pageH = 297;
        setFill([248,248,250]);
        pdf.rect(0, pageH-12, W, 12, 'F');
        setDraw([220,220,225]);
        pdf.line(0, pageH-12, W, pageH-12);
        normal(7); setColor(GREY);
        txt('Labo Chimie & Physique — nilsprofgrenoble.github.io/simulations-chimie/', margin, pageH-5);
        txt(`Simulation : Dosage par etalonnage BTS  |  ${new Date().toLocaleDateString('fr-FR')}`, W-margin, pageH-5, {align:'right'});
      }

      // ════════════════════════════════════════
      // EN-TÊTE PAGE 1
      // ════════════════════════════════════════

      // Bande supérieure dégradée simulée (deux rectangles)
      setFill(TEAL);
      pdf.rect(0, 0, W, 28, 'F');
      setFill([26, 130, 118]);
      pdf.rect(0, 20, W, 8, 'F');

      // Icône ronde blanche
      setFill(WHITE);
      pdf.circle(margin + 8, 14, 7, 'F');
      setColor(TEAL);
      bold(11);
      txt('BTS', margin + 4.5, 17);

      // Titre principal
      setColor(WHITE);
      bold(16);
      txt('Dosage par etalonnage — Niveau BTS', margin + 20, 11);
      normal(8);
      txt('Rapport genere automatiquement', margin + 20, 17);

      // Date et URL en haut à droite
      normal(8); setColor([200,240,235]);
      txt(new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}), W-margin, 10, {align:'right'});
      txt('nilsprofgrenoble.github.io/simulations-chimie/', W-margin, 16, {align:'right'});
      txt(`Simulation : Dosage par etalonnage — ?sim=11`, W-margin, 22, {align:'right'});

      y = 35;

      // ════════════════════════════════════════
      // BLOC PARAMÈTRES
      // ════════════════════════════════════════
      setColor(DARK);

      // Titre section avec barre colorée gauche
      setFill(TEAL);
      pdf.rect(margin, y-1, 3, 6, 'F');
      bold(11); setColor(TEAL);
      txt('Parametres', margin + 6, y + 4); y += 9;

      const infos = [
        ['Methode',        methode==='beerlambert' ? 'Spectrophotometrie UV-visible (Beer-Lambert)' : 'Autre methode instrumentale'],
        ['Mesurande',      cleanTxt(`${mesLabel} (${uniteLabel})`)],
        ['Grandeur',       cleanTxt(grandeurLabel)],
        ['Niveaux inclus', `${nLevelsIncluded} / ${maxLevels}`],
        ['Repetitions',    `${nRepMin} par niveau`],
      ];
      if (methode==='beerlambert' && analyte!=='autre') {
        infos.push(['Analyte',  cleanTxt(a.label)]);
        infos.push(['Lambda',   `${lambdaNm} nm  (sensibilite ${pct}%)`]);
      }

      // Tableau paramètres sur 2 colonnes
      const colW = contentW / 2 - 4;
      infos.forEach(([k,v], i) => {
        // Chaque paramètre sur sa propre ligne, pas de double colonne
        pageCheck(12);
        if (i % 2 === 0) {
          setFill([248, 250, 252]);
          pdf.rect(margin, y - 4, contentW, 11, 'F');
        }
        bold(8); setColor(GREY);
        txt(k, margin + 2, y);
        normal(9); setColor(DARK);
        txt(v, margin + 2, y + 4.5);
        y += 12;
      });
      y += 2;

      hLine(TEAL);

      // ════════════════════════════════════════
      // BLOC STATISTIQUES
      // ════════════════════════════════════════
      pageCheck(50);
      setFill(PURPLE);
      pdf.rect(margin, y-1, 3, 6, 'F');
      bold(11); setColor(PURPLE);
      txt('Statistiques de la regression lineaire', margin + 6, y + 4); y += 10;

      const stats = [
        ['Pente a',                           reg.slope.toFixed(5) + '  ' + cleanTxt(grandeurLabel) + ' / ' + cleanTxt(uniteLabel)],
        ["Ordonnee a l'origine b",            reg.intercept.toFixed(5)],
        ['Coefficient de determination R2',   reg.r2.toFixed(6)],
      ];
      if (sB !== null) stats.push(['Ecart-type sur b  s(b)', sB.toFixed(5)]);
      if (LD !== null) stats.push(['Limite de detection (LD)',      LD.toFixed(4) + '  ' + cleanTxt(uniteLabel)]);
      if (LQ !== null) stats.push(['Limite de quantification (LQ)', LQ.toFixed(4) + '  ' + cleanTxt(uniteLabel)]);

      // En-tête tableau stats
      setFill(PURPLE);
      pdf.rect(margin, y-4, contentW, 6, 'F');
      bold(8); setColor(WHITE);
      txt('Grandeur', margin+2, y);
      txt('Valeur', margin + contentW*0.65, y);
      y += 6;

      stats.forEach(([k,v], i) => {
        pageCheck(8);
        if (i%2===0) { setFill([248,244,255]); pdf.rect(margin, y-4, contentW, 6, 'F'); }
        else         { setFill(WHITE);          pdf.rect(margin, y-4, contentW, 6, 'F'); }
        bold(9); setColor([60,40,90]);
        txt(k, margin+2, y);
        normal(9); setColor(DARK);
        txt(v, margin + contentW*0.65, y);
        y += 6;
      });

      // Résultat Cech
      if (aech && !isNaN(parseFloat(aech)) && reg) {
        const A = parseFloat(aech);
        const Cech = (A - reg.intercept) / reg.slope;
        y += 3;
        setFill(TEAL_L);
        pdf.rect(margin, y-4, contentW, 9, 'F');
        setDraw(TEAL);
        pdf.rect(margin, y-4, contentW, 9, 'S');
        bold(10); setColor(TEAL);
        txt(`Resultat  ->  ${cleanTxt(grandeurLabel)} = ${A}  =>  ${cleanTxt(mesLabel)} = ${Cech.toFixed(4)} ${cleanTxt(uniteLabel)}`, margin+4, y+1);
        y += 12;
      }

      y += 3;
      hLine(PURPLE);

      // ════════════════════════════════════════
      // GRAPHES
      // ════════════════════════════════════════
      const plotEl  = reportRef.current?.querySelector('.calib-plot');
      const residEl = reportRef.current?.querySelector('.resid-plot');

      if (plotEl) {
        pageCheck(80);
        setFill(TEAL);
        pdf.rect(margin, y-1, 3, 6, 'F');
        bold(11); setColor(TEAL);
        txt("Courbe d'etalonnage", margin+6, y+4); y += 10;

        const canvas = await window.html2canvas(plotEl, { scale:2, backgroundColor:'#ffffff' });
        const imgW = contentW, imgH = (canvas.height/canvas.width)*imgW;
        pageCheck(imgH);
        // Bordure légère autour du graphe
        setDraw([220,220,225]);
        pdf.rect(margin-1, y-1, contentW+2, imgH+2, 'S');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, y, imgW, imgH);
        y += imgH + 8;
      }

      if (residEl) {
        pageCheck(70);
        setFill(PURPLE);
        pdf.rect(margin, y-1, 3, 6, 'F');
        bold(11); setColor(PURPLE);
        txt('Graphique des residus', margin+6, y+4); y += 10;

        const canvas2 = await window.html2canvas(residEl, { scale:2, backgroundColor:'#ffffff' });
        const imgW2 = contentW, imgH2 = (canvas2.height/canvas2.width)*imgW2;
        pageCheck(imgH2);
        setDraw([220,220,225]);
        pdf.rect(margin-1, y-1, contentW+2, imgH2+2, 'S');
        pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', margin, y, imgW2, imgH2);
        y += imgH2 + 8;
      }

      // ════════════════════════════════════════
      // FISHER-SNEDECOR
      // ════════════════════════════════════════
      if (fisherResult) {
        pageCheck(60);
        hLine(PURPLE);

        setFill(PURPLE);
        pdf.rect(margin, y-1, 3, 6, 'F');
        bold(11); setColor(PURPLE);
        txt('Test de Fisher-Snedecor  —  Linearite (seuil 1 %)', margin+6, y+4); y += 10;

        // En-tête tableau
        const fishCols = [55, 28, 12, 28, 20, 20];
        const fishHeaders = ['Source', 'SCE', 'ddl', 'Variance', 'F exp', 'F crit 1%'];
        setFill(PURPLE);
        pdf.rect(margin, y-4, contentW, 6.5, 'F');
        bold(8); setColor(WHITE);
        let xp = margin+1;
        fishHeaders.forEach((h,i)=>{ txt(h,xp,y); xp+=fishCols[i]; });
        y += 7;

        const fishRows = [
          ['Regression lineaire', (reg.ssTot-reg.ssRes).toFixed(5), '1', '-', '-', '-'],
          ['Non-linearite',       fisherResult.SCE_nl, String(fisherResult.ddl_nl), fisherResult.varNl, fisherResult.Fexp??'-', String(fisherResult.Fcrit??'-')],
          ['Residuelle',          fisherResult.SCE_r,  String(fisherResult.ddl_r),  fisherResult.varR,  '-', '-'],
        ];

        fishRows.forEach((row,ri) => {
          setFill(ri%2===0 ? WHITE : PURP_L);
          pdf.rect(margin, y-4, contentW, 6.5, 'F');
          setColor(DARK); xp = margin+1;
          row.forEach((cell,i)=>{
            bold(8); if(i===0) normal(8);
            if(i===4||i===5) { bold(9); setColor(PURPLE); } else setColor(DARK);
            txt(String(cell), xp, y); xp+=fishCols[i];
          });
          y += 7;
        });

        // Conclusion Fisher
        y += 2;
        const isOk = fisherResult.linearite === true;
        setFill(isOk ? GREEN_L : RED_L);
        pdf.rect(margin, y-4, contentW, 9, 'F');
        setDraw(isOk ? GREEN : RED);
        pdf.rect(margin, y-4, contentW, 9, 'S');
        bold(10); setColor(isOk ? GREEN : RED);
        const conclu = isOk
          ? `OK  F exp (${fisherResult.Fexp}) < F crit (${fisherResult.Fcrit})  ->  Linearite verifiee au seuil 1 %`
          : `NON  F exp (${fisherResult.Fexp}) >= F crit (${fisherResult.Fcrit})  ->  Linearite non verifiee`;
        txt(conclu, margin+4, y+1);
        y += 12;
      }

      // Pied de page page 1
      addPageFooter();

      pdf.save(`etalonnage_BTS_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch(e) {
      console.error('Erreur PDF:', e);
      alert('Erreur lors de la generation du PDF : ' + e.message);
    }
    setPdfLoading(false);
  }


  return (
    <div style={cardStyle} ref={reportRef}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <h2 style={{margin:0,fontSize:18,color:'var(--color-text-primary)'}}>
          Dosage par étalonnage — Niveau BTS
        </h2>
        {tab && reg && (
          <button onClick={exportPDF} disabled={pdfLoading}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',
              borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
              background: pdfLoading ? '#aaa' : '#2a9d8f',color:'white',
              fontFamily:"'Nunito', sans-serif"}}>
            {pdfLoading ? '⏳ Génération...' : '📄 Exporter en PDF'}
          </button>
        )}
      </div>

      {/* Choix méthode */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[['beerlambert','🌈 Spectrophotométrie (Beer-Lambert)'],['autre','📊 Autre méthode (SAA, HPLC…)']].map(([k,l])=>(
          <button key={k} onClick={()=>setMethode(k)}
            style={{padding:'10px 20px',fontSize:15,borderRadius:8,cursor:'pointer',fontWeight:'500',
              border: methode===k ? '2px solid #1a7abf' : '1px solid var(--color-border-secondary)',
              background: methode===k ? '#e8f4fd' : 'var(--color-background-secondary)',
              color: methode===k ? '#1a7abf' : 'var(--color-text-secondary)'}}>
            {l}
          </button>
        ))}
      </div>

      {methode === 'beerlambert' && (
        <>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
            <label style={{fontSize:13,color:'var(--color-text-secondary)'}}>Analyte :</label>
            <select value={analyte} onChange={e=>setAnalyte(e.target.value)} style={{fontSize:13}}>
              {Object.entries(ANALYTES_BL).map(([k,v])=>(<option key={k} value={k}>{v.label}</option>))}
            </select>
          </div>
          {analyte === 'autre' && (
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12,alignItems:'flex-end',
              padding:'10px 14px',background:'var(--color-background-secondary)',borderRadius:8}}>
              <Field label="Nom de l'analyte" value={customNom} onChange={setCustomNom} width={160} type="text"/>
              <div>
                <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>λ max (nm)</div>
                <input type="number" value={customLambda} min={380} max={780}
                  onChange={e=>{const v=Number(e.target.value);setCustomLambda(v);setLambdaNm(v);}}
                  style={{width:80,fontSize:13,padding:'4px 6px'}}/>
              </div>
            </div>
          )}
          {analyte !== 'autre' && (
            <SpectroSchema analyteName={analyte} lambdaNm={lambdaNm} onLambdaChange={setLambdaNm}/>
          )}
          {analyte === 'autre' && (
            <div style={{padding:'10px 14px',fontSize:13,color:'var(--color-text-secondary)',
              background:'var(--color-background-secondary)',borderRadius:8,marginBottom:8}}>
              λ de travail : <strong>{customLambda} nm</strong>{' — '}
              <span style={{display:'inline-block',width:18,height:10,borderRadius:3,
                background:nmToColor(customLambda),verticalAlign:'middle'}}/>
            </div>
          )}
          {analyte !== 'autre' && (
            <div style={{display:'flex',alignItems:'center',gap:10,margin:'8px 0 4px',flexWrap:'wrap'}}>
              <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>Sensibilité à {lambdaNm} nm :</span>
              <div style={{flex:1,maxWidth:200,height:10,background:'var(--color-background-secondary)',borderRadius:5,overflow:'hidden'}}>
                <div style={{width:`${pct}%`,height:'100%',background:sensColor,borderRadius:5,transition:'width 0.3s,background 0.3s'}}/>
              </div>
              <span style={{fontSize:13,fontWeight:'500',color:sensColor}}>{pct}%</span>
              {pct < 50 && <span style={{fontSize:12,color:'#d97706'}}>⚠ Sensibilité faible</span>}
            </div>
          )}
        </>
      )}

      {methode === 'autre' && (
        <div style={{padding:'10px 14px',fontSize:13,background:'var(--color-background-secondary)',
          borderRadius:8,marginBottom:8,color:'var(--color-text-secondary)'}}>
          Méthode instrumentale sans spectrophotomètre UV-visible — saisissez directement vos données d'étalonnage.
        </div>
      )}

      <hr style={{margin:'16px 0',borderColor:'var(--color-border-tertiary)'}}/>

      <div style={{marginBottom:10}}>
        <div style={{fontSize:15,fontWeight:'500',marginBottom:6}}>Courbe d'étalonnage</div>
        {methode === 'beerlambert' && (
          <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:10}}>
            Choisissez une source de données :
          </div>
        )}
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {[['exemple','Exemple'],['manuel','Saisie manuelle'],['tableur','Copier-coller tableur']]
            .filter(([k])=> !(k==='exemple' && analyte==='autre'))
            .map(([k,l])=>(
              <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>
            ))}
        </div>
      </div>

      {tab==='exemple' && methode==='beerlambert' && (
        <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:8}}>
          Étalonnage KMnO₄ par spectrophotométrie — {exBL.niveaux} niveaux × {exBL.repetitions} répétitions, λ = {lambdaNm} nm.{' '}
          {analyte !== 'autre' && <span style={{color:sensColor,fontWeight:'500'}}>Sensibilité : {pct}% du maximum (à {a.peakNm} nm).</span>}
        </div>
      )}
      {tab==='exemple' && methode==='autre' && (
        <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:8}}>
          Dosage du potassium K⁺ par SAA — {exAutre.niveaux} niveaux × {exAutre.repetitions} répétitions. Grandeur mesurée : Intensité I (u.a.)
        </div>
      )}

      {tab==='manuel' && (
        <div style={{marginBottom:12}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10,alignItems:'flex-end'}}>
            <CoeffInput label="Nb solutions étalons (blanc compris)" value={nNiveaux}
              onChange={v=>setNNiveaux(Math.max(3,Math.min(20,v)))} min={3} max={20}/>
            <CoeffInput label="Nb essais par solution étalon" value={nRep}
              onChange={v=>setNRep(Math.max(2,Math.min(15,v)))} min={2} max={15}/>
            <Field label="Mesurande" value={mesurande} onChange={setMesurande} width={120} type="text"/>
            <Field label="Unité" value={unite} onChange={setUnite} width={80} type="text"/>
            <Field label="Grandeur mesurée" value={grandeur} onChange={setGrandeur} width={130} type="text"/>
            <button onClick={initManualGrid} style={{padding:'4px 12px',fontSize:13}}>Créer le tableau</button>
          </div>
          {nRep < 2 && <div style={{fontSize:12,color:'#d97706',marginBottom:8}}>⚠ Le test de Fisher-Snedecor nécessite au moins 2 répétitions par niveau.</div>}
          {manualData && (
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr>
                    <th style={{padding:'4px 8px',borderBottom:'1px solid var(--color-border-tertiary)'}}>{mesurande} ({unite})</th>
                    {Array(nRep).fill(0).map((_,j)=>(
                      <th key={j} style={{padding:'4px 8px',borderBottom:'1px solid var(--color-border-tertiary)'}}>{grandeur.split(' ')[0]}{j+1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {manualData.concentrations.map((c,i)=>(
                    <tr key={i}>
                      <td style={{padding:'2px 4px'}}>
                        <input type="number" value={c} onChange={e=>updateManualConc(i,e.target.value)} style={{width:80,fontSize:12,padding:'2px 4px'}}/>
                      </td>
                      {Array(nRep).fill(0).map((_,j)=>(
                        <td key={j} style={{padding:'2px 4px'}}>
                          <input type="number" value={manualData.absorbances[i][j]}
                            onChange={e=>updateManualAbs(i,j,e.target.value)}
                            style={{width:72,fontSize:12,padding:'2px 4px'}} step="0.001"/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==='tableur' && (
        <div style={{marginBottom:12}}>
          <p style={{fontSize:13,color:'var(--color-text-secondary)',marginTop:0}}>
            Format : une ligne par niveau, séparateur tabulation ou ;<br/>
            <code style={{fontSize:11}}>C{'\t'}Y1{'\t'}Y2{'\t'}Y3…</code><br/>
            <span style={{color:'#d97706'}}>⚠ Pour Fisher-Snedecor : même nombre de répétitions (≥ 2) sur chaque ligne.</span>
          </p>
          <div style={{display:'flex',gap:10,marginBottom:8,flexWrap:'wrap'}}>
            <Field label="Mesurande" value={mesurande} onChange={setMesurande} width={120} type="text"/>
            <Field label="Unité" value={unite} onChange={setUnite} width={80} type="text"/>
            <Field label="Grandeur mesurée" value={grandeur} onChange={setGrandeur} width={130} type="text"/>
          </div>
          <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
            placeholder={"C\tY1\tY2\tY3\n0\t0.001\t0.002\t0.001"}
            style={{width:'100%',height:140,fontSize:12,fontFamily:'monospace',
              padding:8,boxSizing:'border-box',border:'1px solid var(--color-border-tertiary)',
              borderRadius:6,background:'var(--color-background-primary)',color:'var(--color-text-primary)'}}/>
        </div>
      )}

      {tab && reg && (
        <>
          {maxLevels > 2 && (
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12,flexWrap:'wrap',
              padding:'8px 12px',background:'var(--color-background-secondary)',borderRadius:8}}>
              <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>Niveaux inclus :</span>
              <input type="range" min={2} max={maxLevels} value={nLevelsIncluded}
                onChange={e=>setNLevelsIncluded(Number(e.target.value))} style={{width:160}}/>
              <span style={{fontSize:13,fontWeight:'500'}}>{nLevelsIncluded} / {maxLevels}</span>
              {nLevelsIncluded < maxLevels && (
                <span style={{fontSize:12,color:'#d97706'}}>⚠ {maxLevels-nLevelsIncluded} niveau(x) exclu(s)</span>
              )}
            </div>
          )}

          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
            {[
              ['Pente a', reg.slope.toFixed(5)],
              ['Ordonnée b', reg.intercept.toFixed(5)],
              ['R²', reg.r2.toFixed(6)],
              sB!==null ? ['s(b)', sB.toFixed(5)] : null,
              LD!==null ? ['LD', `${LD.toFixed(4)} ${uniteLabel}`] : null,
              LQ!==null ? ['LQ', `${LQ.toFixed(4)} ${uniteLabel}`] : null,
            ].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{background:'var(--color-background-secondary)',borderRadius:8,padding:'8px 14px',minWidth:110}}>
                <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{l}</div>
                <div style={{fontSize:14,fontWeight:'500'}}>{v}</div>
              </div>
            ))}
          </div>

          <CalibrationPlot
            plotlyReady={plotlyReady} xs={xs} ys={ys}
            xsScale={xsMax} ysScale={ysMax}
            mesurande={mesLabel} unite={uniteLabel}
            grandeurLabel={grandeurLabel}
            aechValue={aech} onAechChange={setAech}
            showResiduals={true}
            lambdaNm={lambdaNm}
            peakNm={methode==='beerlambert' && analyte!=='autre' ? a.peakNm : lambdaNm}
            calibClassName="calib-plot"
            residClassName="resid-plot"/>

          <hr style={{margin:'20px 0',borderColor:'var(--color-border-tertiary)'}}/>

          <div style={{marginBottom:8}}>
            <div style={{fontSize:15,fontWeight:'500',marginBottom:6}}>
              Test de Fisher-Snedecor — Vérification de la linéarité (seuil 1 %)
            </div>
            {!canFisher && (
              <div style={{fontSize:13,color:'#d97706',padding:'8px 12px',
                background:'var(--color-background-secondary)',borderRadius:7}}>
                ⚠ Test impossible : il faut ≥ 3 niveaux avec ≥ 2 répétitions chacun.
                {nRepMin < 2 && ` Actuellement ${nRepMin} répétition(s) par niveau.`}
              </div>
            )}
            {fisherResult && (
              <>
                <div style={{overflowX:'auto',marginBottom:8}}>
                  <table style={{borderCollapse:'collapse',fontSize:12,width:'100%',maxWidth:600}}>
                    <thead>
                      <tr style={{background:'var(--color-background-secondary)'}}>
                        {['Source','SCE','ddl','Variance','F exp','F crit 1 %'].map(h=>(
                          <th key={h} style={{padding:'6px 10px',borderBottom:'1px solid var(--color-border-tertiary)',
                            textAlign:'left',fontWeight:'500'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{padding:'5px 10px',color:'var(--color-text-secondary)'}}>Régression linéaire</td>
                        <td style={{padding:'5px 10px'}}>{reg ? (reg.ssTot-reg.ssRes).toFixed(5) : '—'}</td>
                        <td>1</td><td>—</td><td>—</td><td>—</td>
                      </tr>
                      <tr style={{background:'var(--color-background-secondary)'}}>
                        <td style={{padding:'5px 10px',color:'var(--color-text-secondary)'}}>Non-linéarité</td>
                        <td style={{padding:'5px 10px'}}>{fisherResult.SCE_nl}</td>
                        <td>{fisherResult.ddl_nl}</td>
                        <td>{fisherResult.varNl}</td>
                        <td style={{fontWeight:'500'}}>{fisherResult.Fexp}</td>
                        <td style={{fontWeight:'500'}}>{fisherResult.Fcrit ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{padding:'5px 10px',color:'var(--color-text-secondary)'}}>Résiduelle (répétabilité)</td>
                        <td style={{padding:'5px 10px'}}>{fisherResult.SCE_r}</td>
                        <td>{fisherResult.ddl_r}</td>
                        <td>{fisherResult.varR}</td>
                        <td>—</td><td>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{fontSize:13,padding:'8px 12px',borderRadius:7,marginBottom:10,
                  background: fisherResult.linearite===true ? '#f0fdf4' : fisherResult.linearite===false ? '#fef2f2' : 'var(--color-background-secondary)',
                  color: fisherResult.linearite===true ? '#15803d' : fisherResult.linearite===false ? '#dc2626' : 'var(--color-text-secondary)',
                  border:`1px solid ${fisherResult.linearite===true?'#bbf7d0':fisherResult.linearite===false?'#fecaca':'var(--color-border-tertiary)'}`,
                }}>
                  {fisherResult.linearite===true && `✓ F exp (${fisherResult.Fexp}) < F crit (${fisherResult.Fcrit}) → Linéarité vérifiée au seuil 1 % — ${fisherResult.p} niveaux × ${fisherResult.n} répétitions`}
                  {fisherResult.linearite===false && `✗ F exp (${fisherResult.Fexp}) ≥ F crit (${fisherResult.Fcrit}) → Linéarité non vérifiée — essayez de restreindre le domaine avec le curseur`}
                  {fisherResult.linearite===null && 'Calcul impossible'}
                </div>
              </>
            )}
          </div>

          <button onClick={()=>setShowFormules(v=>!v)}
            style={{fontSize:12,padding:'5px 14px',borderRadius:6,cursor:'pointer',
              border:'1px solid var(--color-border-secondary)',
              background:'var(--color-background-secondary)',color:'var(--color-text-secondary)',
              marginBottom: showFormules ? 8 : 0}}>
            {showFormules ? '▲ Masquer les formules' : '▼ Afficher les formules et détails des calculs'}
          </button>

          {showFormules && (
            <div style={{fontSize:12,padding:'14px 16px',borderRadius:8,lineHeight:2,
              background:'var(--color-background-secondary)',border:'1px solid var(--color-border-tertiary)'}}>
              <div style={{fontWeight:'500',marginBottom:8,fontSize:13}}>Formules utilisées</div>
              <div style={{marginBottom:10}}>
                <strong>Régression linéaire</strong> (moindres carrés, points individuels) :<br/>
                Y = a·C + b &nbsp;|&nbsp; a = [n·Σ(CᵢYᵢ) − ΣCᵢ·ΣYᵢ] / [n·ΣCᵢ² − (ΣCᵢ)²]
              </div>
              <div style={{marginBottom:10}}>
                <strong>Erreur standard sur b</strong> : s(b) = √[ s²_rés · (1/n + C̄² / Scc) ]
              </div>
              <div style={{marginBottom:10}}>
                <strong>LD et LQ</strong> : LD = 3·s(b) / a &nbsp;|&nbsp; LQ = 10·s(b) / a
              </div>
              <div style={{marginBottom:10}}>
                <strong>Test de Fisher-Snedecor</strong> :<br/>
                SCE_nonlin = n·Σⱼ(Āⱼ − Ŷⱼ)² (ddl = p−2) &nbsp;|&nbsp;
                SCE_résid = Σⱼ Σᵢ(Yᵢⱼ − Āⱼ)² (ddl = p·(n−1))<br/>
                F_exp = (SCE_nonlin/(p−2)) / (SCE_résid/(p·(n−1)))
              </div>
              <div><strong>C_éch</strong> = (Y_éch − b) / a</div>
            </div>
          )}
        </>
      )}

      {tab && !reg && xs.length < 2 && (
        <p style={{fontSize:13,color:'var(--color-text-secondary)'}}>
          Saisissez au moins 2 niveaux de concentration pour afficher la courbe.
        </p>
      )}
    </div>
  );
}


