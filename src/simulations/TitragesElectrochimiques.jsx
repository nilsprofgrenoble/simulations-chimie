import { useState, useEffect, useRef, useMemo } from "react";
import { TabBtn, cardStyle } from "../commun";

export function SchemaElectro({ mode, x }) {
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

export function Simulation3({ plotlyReady }) {
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

