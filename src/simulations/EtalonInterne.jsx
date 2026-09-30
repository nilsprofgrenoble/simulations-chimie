import { useState, useEffect, useRef, useMemo } from "react";
import { Field, TabBtn, cardStyle } from "../commun";

// ====================================================
// SIM 13 — ÉTALON INTERNE / NORMALISATION INTERNE (BTS)
// Version 2 — UI colorée, colonnes fixes, bug nAnalytes corrigé
// ====================================================
//
// INSTALLATION : remplacer tout le bloc depuis
//   const MOLECULES_CLHP = [   (si vous avez la sim CLHP)
// NON — remplacer uniquement depuis :
//   const EX_EI = {
// jusqu'à la fin de SimulationEtalonnageInterne
// OU coller entièrement avant export default function App()
// et ajouter dans SIMULATIONS :
//   { id: 13, label: "Étalon interne / Normalisation interne", icon: "📐", color: "#c0392b", component: SimulationEtalonnageInterne, niveau: "BTS" },

// ---- Palette couleurs pour les composés ----
export const COMP_COLORS = ['#2a9d8f','#e63946','#6a4c93','#e9a824','#457b9d','#f4a261','#06d6a0','#c77dff'];

// ---- Chromatogramme gaussien commun ----
export function ChromatoPlot({ plotlyReady, pics, title, bgColor }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!plotlyReady || !ref.current) return;
    const valid = pics.filter(p => p.tr > 0 && p.aire > 0);
    if (valid.length === 0) { Plotly.purge && Plotly.purge(ref.current); return; }
    const tMax = Math.max(...valid.map(p => p.tr)) * 1.45;
    const N = 800;
    const tArr = Array.from({length:N},(_,i)=>i*tMax/(N-1));
    const traces = valid.map(({nom,tr,aire,color}) => {
      const sigma = Math.max(tr*0.04, 0.01);
      const Apeak = aire/(sigma*Math.sqrt(2*Math.PI));
      return {
        x: tArr,
        y: tArr.map(t => Apeak*Math.exp(-0.5*((t-tr)/sigma)**2)),
        mode:'lines', name:nom,
        line:{color, width:2},
        fill:'tozeroy', fillcolor: color+'18',
      };
    });
    Plotly.react(ref.current, traces, {
      xaxis:{title:'t (min)', gridcolor:'rgba(128,128,128,0.12)', zeroline:false, showline:false},
      yaxis:{title:'Réponse', gridcolor:'rgba(128,128,128,0.12)', zeroline:false, showline:false},
      paper_bgcolor:'transparent', plot_bgcolor:'transparent',
      margin:{t:30,r:10,b:45,l:50},
      legend:{bgcolor:'transparent', font:{size:11}},
      font:{size:11},
      title:{text:title, font:{size:12}, x:0.5},
    },{responsive:true, displayModeBar:false});
  },[plotlyReady, JSON.stringify(pics), title]);
  return <div ref={ref} style={{width:'100%',height:240}}/>;
}

// ============================================================
// DONNÉES EXEMPLES
// ============================================================

export const EX_EI = {
  eiNom: "Paracétamol",
  eiColor: "#888",
  analytes: [
    {nom:"Hydrobenzoïne", couleur:COMP_COLORS[0]},
    {nom:"Benzoïne",      couleur:COMP_COLORS[1]},
    {nom:"Benzile",       couleur:COMP_COLORS[2]},
  ],
  etalon: {
    CmAnalytes:[10.20,10.59,10.37], CmEI:10.25,
    airesAnalytes:[17.22,20.33,33.20], aireEI:29.25,
    trAnalytes:[1.8,2.4,3.2], trEI:1.2,
  },
  echantillon: {
    airesAnalytes:[26.3,2.4,12.2], aireEI:57.2,
    trAnalytes:[1.8,2.4,3.2], trEI:1.2,
    CmEI:10.25,
    masseEch:101.7, volFiole:20,
    volPrelevement:40, volFioleInjectee:20000,
  },
  description:"Dosage hydrobenzoïne/benzoïne/benzile dans un produit de synthèse. Étalon interne : paracétamol. Aires en % d'aire totale. Source : Révision Analyse n°1, BTS MDC.",
};

export const EX_NI = {
  reference: 0,
  composesEtalon:[
    {nom:"Éthanol",           pctMasse:50.1, aire:155000, tr:1.2, couleur:COMP_COLORS[0]},
    {nom:"Toluène",           pctMasse:20.1, aire:527000, tr:2.1, couleur:COMP_COLORS[1]},
    {nom:"Acétate de butyle", pctMasse:29.8, aire:318000, tr:3.0, couleur:COMP_COLORS[2]},
  ],
  composesEch:[
    {aire:62000,  tr:1.2},
    {aire:787000, tr:2.1},
    {aire:534000, tr:3.0},
  ],
  description:"Mélange éthanol/toluène/acétate de butyle analysé par CPG. Espèce de référence : Éthanol. Source : sujet BTS MDC E42, session 2018.",
};

// ============================================================
// ÉTALON INTERNE
// ============================================================


export function SectionEtalonInterne({plotlyReady}) {
  const [tab, setTab] = useState('exemple');
  const [eiNom, setEiNom] = useState('Paracétamol');
  const [nA, setNA] = useState(3);
  const MAX_A = 8;

  // Fiole 1 : analytes étalons
  const [etNoms,    setEtNoms]    = useState(Array(MAX_A).fill('').map((_,i)=>`Analyte ${i+1}`));
  const [etMasses,  setEtMasses]  = useState(Array(MAX_A).fill(100));   // masses fiole 1 (mg)
  const [etVolF1,   setEtVolF1]   = useState(20);                        // volume fiole 1 (mL)
  const [etCm,      setEtCm]      = useState(Array(MAX_A).fill(10));     // Cm calculées (affichage)
  const [etAires,   setEtAires]   = useState(Array(MAX_A).fill(0));
  const [etTr,      setEtTr]      = useState(Array(MAX_A).fill(0).map((_,i)=>parseFloat((1+i*0.5).toFixed(1))));
  // Fiole 2 : EI
  const [eiMasse,   setEiMasse]   = useState(100);
  const [eiVolF2,   setEiVolF2]   = useState(20);
  const [etCmEI,    setEtCmEI]    = useState(10);
  const [etAireEI,  setEtAireEI]  = useState(0);
  const [etTrEI,    setEtTrEI]    = useState(0.8);
  // Prélèvement fiole 3
  const [volPrel3,  setVolPrel3]  = useState(40);   // µL de fiole 1
  const [volPrel3b, setVolPrel3b] = useState(40);   // µL de fiole 2
  const [volF3,     setVolF3]     = useState(20);   // mL fiole 3
  // Fiole 4 : échantillon
  const [echNomSolide, setEchNomSolide] = useState('Solide synthétisé');
  const [echMasse,  setEchMasse]  = useState(100);
  const [echVolF4,  setEchVolF4]  = useState(20);
  const [echAires,  setEchAires]  = useState(Array(MAX_A).fill(0));
  const [echTr,     setEchTr]     = useState(Array(MAX_A).fill(0).map((_,i)=>parseFloat((1+i*0.5).toFixed(1))));
  // Prélèvement fiole 5
  const [volPrel5,  setVolPrel5]  = useState(40);   // µL de fiole 4
  const [volPrel5b, setVolPrel5b] = useState(40);   // µL de fiole 2
  const [volF5,     setVolF5]     = useState(20);   // mL fiole 5
  const [echAireEI, setEchAireEI] = useState(0);
  const [echTrEI,   setEchTrEI]   = useState(0.8);

  const isEx = tab === 'exemple';
  const ex = EX_EI;
  const n = isEx ? ex.analytes.length : nA;

  const noms     = isEx ? ex.analytes.map(a=>a.nom)      : etNoms.slice(0,n);
  const colors   = isEx ? ex.analytes.map(a=>a.couleur)  : COMP_COLORS.slice(0,n);
  // Cm analytes dans Fiole 3 calculées automatiquement depuis les masses
  const CmEt_calc = etMasses.slice(0,n).map(m =>
    (m * volPrel3) / (etVolF1 * volF3)
  );
  const CmEt     = isEx ? ex.etalon.CmAnalytes : CmEt_calc;
  const airesEt  = isEx ? ex.etalon.airesAnalytes          : etAires.slice(0,n);
  const trEt     = isEx ? ex.etalon.trAnalytes             : etTr.slice(0,n);
  // Cm EI dans Fiole 3 calculée depuis masse EI
  const CmEI_calc_F3 = (eiMasse * volPrel3b) / (eiVolF2 * volF3);
  const CmEI_calc_F5 = (eiMasse * volPrel5b) / (eiVolF2 * volF5);
  const CmEI_et  = isEx ? ex.etalon.CmEI : CmEI_calc_F3;
  const areEI_et = isEx ? ex.etalon.aireEI                 : etAireEI;
  const trEI_et  = isEx ? ex.etalon.trEI                  : etTrEI;
  const eiLabel  = isEx ? ex.eiNom : eiNom;
  const eiCol    = isEx ? ex.eiColor : '#888';
  const airesEch = isEx ? ex.echantillon.airesAnalytes     : echAires.slice(0,n);
  const trEch    = isEx ? ex.echantillon.trAnalytes        : echTr.slice(0,n);
  const areEI_ech= isEx ? ex.echantillon.aireEI            : echAireEI;
  const trEI_ech = isEx ? ex.echantillon.trEI              : echTrEI;

  // Calcul Cm étalon en saisie manuelle : Cm = (masse/M * M / V_fiole) * dilution
  // Simplifié : Cm_fiole3 = (masse_fiole1_mg / V_fiole1_mL) * (volPrel3_µL / (volF3_mL*1000))^-1 * ...
  // On utilise directement etCm saisi par l'utilisateur pour la fiole 3
  // OU on calcule : Cm_fiole3 = (m_mg / V_fiole1_mL) * (volPrel3/1000) / (volF3/1000)  ... trop complexe sans M
  // → Pour saisie manuelle : l'utilisateur saisit Cm directement dans le tableau (comme avant)

  // Facteur dilution pour masse
  const dilFact  = isEx
    ? ex.echantillon.volPrelevement / ex.echantillon.volFioleInjectee
    : (volPrel5 / 1000) / (volF5 * 1000 / 1000)   // µL → mL / mL
  const volFiole = isEx ? ex.echantillon.volFiole : echVolF4;

  const CmEch = Array(n).fill(null).map((_,i) => {
    if(!airesEt[i]||!areEI_et||!airesEch[i]||!areEI_ech) return null;
    return CmEt[i] * (areEI_et/airesEt[i]) * (airesEch[i]/areEI_ech);
  });
  const masseAnalyte = CmEch.map(cm => {
    if(cm===null) return null;
    if(isEx) return cm * (ex.echantillon.volFiole/1000) / (ex.echantillon.volPrelevement/ex.echantillon.volFioleInjectee);
    // masse = Cm_fiole5 (mg/L) * V_fiole4 (L) / facteur_dilution
    // facteur_dilution = V_prélevé_fiole4(µL) / V_fiole5(µL)
    const df = volPrel5 / (volF5 * 1000);
    return cm * (echVolF4 / 1000) / df;
  });

  const picsEt  = [...noms.map((nom,i)=>({nom,tr:trEt[i], aire:airesEt[i], color:colors[i]})),
                   {nom:eiLabel, tr:trEI_et,  aire:areEI_et,  color:eiCol}];
  const picsEch = [...noms.map((nom,i)=>({nom,tr:trEch[i],aire:airesEch[i],color:colors[i]})),
                   {nom:eiLabel, tr:trEI_ech, aire:areEI_ech, color:eiCol}];

  
  const inp = {fontSize:12,padding:'3px 6px',
  border:'1.5px solid #b39ddb',borderRadius:4,
  background:'#fffde7',color:'var(--color-text-primary)'};
  const inpW = (w) => ({...inp, width:w});

  function setIdx(arr,setArr,i,val,isNum=true){
    const next=[...arr]; next[i]=isNum?(parseFloat(val)||0):val; setArr(next);
  }

  const C_ET  = {bg:'#f3eeff', border:'#6a4c93', text:'#4a2c73', label: isEx ? 'Solution étalon (Fiole 3)' : 'Solution étalon (Fiole 3)'};
  const C_ECH = {bg:'#fffbe6', border:'#e9a824', text:'#9a6000', label: isEx ? 'Solution échantillon (Fiole 5)' : 'Solution échantillon (Fiole 5)'};
  const tdS = {padding:'3px 6px'};

  // Schéma SVG commun (paramétrable)
  function SchemaFioles({
    nomF1=null, massesF1=[], volF1=20,
    nomEI='EI', masseEI=100, volF2=20,
    nomF4='Solide', masseF4=100, volF4=20,
    vp3=40, vp3b=40, vF3=20,
    vp5=40, vp5b=40, vF5=20,
  }) {
    // Cm EI calculée
    const CmEI_calc = (masseEI / volF2).toFixed(2);
    return (
      <svg width="100%" viewBox="0 0 680 230">
        <defs>
          <marker id="arrS" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#6a4c93" strokeWidth="1.5" strokeLinecap="round"/>
          </marker>
          <marker id="arrS2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#2a9d8f" strokeWidth="1.5" strokeLinecap="round"/>
          </marker>
          <marker id="arrS3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#e63946" strokeWidth="1.5" strokeLinecap="round"/>
          </marker>
        </defs>

        {/* ── LIGNE 1 : Fiole 1, Fiole 2, Fiole 4 ── */}
        {/* Fiole 1 */}
        <rect x="10" y="10" width="150" height="90" rx="8" fill="#e8f8f5" stroke="#2a9d8f" strokeWidth="1.5"/>
        <text x="85" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a7a6e">Fiole 1 ({volF1} mL)</text>
        {massesF1.length > 0
          ? massesF1.map((m,i)=>(
              <text key={i} x="85" y={41+i*13} textAnchor="middle" fontSize="10" fill={COMP_COLORS[i]}>{nomF1?.[i]||`Analyte ${i+1}`} : {m} mg</text>
            ))
          : <text x="85" y="55" textAnchor="middle" fontSize="10" fill="#333">Analytes étalons</text>
        }
        <text x="85" y={massesF1.length>0?41+massesF1.length*13:70} textAnchor="middle" fontSize="10" fill="#666">+ éluant qsp {volF1} mL</text>

        {/* Fiole 2 */}
        <rect x="265" y="10" width="150" height="90" rx="8" fill="#f3eeff" stroke="#6a4c93" strokeWidth="2"/>
        <text x="340" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4a2c73">Fiole 2 ({volF2} mL)</text>
        <text x="340" y="44" textAnchor="middle" fontSize="10" fill="#6a4c93">{nomEI} (EI)</text>
        <text x="340" y="58" textAnchor="middle" fontSize="10" fill="#333">{masseEI} mg</text>
        <text x="340" y="72" textAnchor="middle" fontSize="10" fill="#888">→ Cm ≈ {CmEI_calc} mg/mL</text>
        <text x="340" y="86" textAnchor="middle" fontSize="10" fill="#666">+ éluant qsp {volF2} mL</text>

        {/* Fiole 4 */}
        <rect x="520" y="10" width="150" height="90" rx="8" fill="#fff0f5" stroke="#e63946" strokeWidth="1.5"/>
        <text x="595" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a01020">Fiole 4 ({volF4} mL)</text>
        <text x="595" y="44" textAnchor="middle" fontSize="10" fill="#333">{nomF4}</text>
        <text x="595" y="58" textAnchor="middle" fontSize="10" fill="#e63946">{masseF4} mg</text>
        <text x="595" y="74" textAnchor="middle" fontSize="10" fill="#666">+ éluant qsp {volF4} mL</text>

        {/* ── LIGNE 2 : Fiole 3, Fiole 5 ── */}
        {/* Fiole 3 */}
        <rect x="130" y="148" width="150" height="72" rx="8" fill="#fffbe6" stroke="#e9a824" strokeWidth="2"/>
        <text x="205" y="165" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9a6000">Fiole 3 — injectée</text>
        <text x="205" y="180" textAnchor="middle" fontSize="10" fill="#333">Solution étalon</text>
        <text x="205" y="194" textAnchor="middle" fontSize="10" fill="#2a9d8f">Analytes connus</text>
        <text x="205" y="208" textAnchor="middle" fontSize="10" fill="#6a4c93">{nomEI} : connu</text>

        {/* Fiole 5 */}
        <rect x="400" y="148" width="150" height="72" rx="8" fill="#fffbe6" stroke="#e9a824" strokeWidth="2"/>
        <text x="475" y="165" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9a6000">Fiole 5 — injectée</text>
        <text x="475" y="180" textAnchor="middle" fontSize="10" fill="#333">Solution échantillon</text>
        <text x="475" y="194" textAnchor="middle" fontSize="10" fill="#e63946">Analytes : ?</text>
        <text x="475" y="208" textAnchor="middle" fontSize="10" fill="#6a4c93">{nomEI} : connu</text>

        {/* Flèche Fiole 1 → Fiole 3 */}
        <line x1="85" y1="100" x2="175" y2="148" stroke="#2a9d8f" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrS2)"/>
        <text x="108" y="130" textAnchor="middle" fontSize="10" fill="#2a9d8f">{vp3} µL</text>

        {/* Flèche Fiole 2 → Fiole 3 */}
        <line x1="310" y1="100" x2="235" y2="148" stroke="#6a4c93" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrS)"/>
        <text x="295" y="128" textAnchor="middle" fontSize="10" fill="#6a4c93">{vp3b} µL</text>

        {/* Flèche Fiole 2 → Fiole 5 */}
        <line x1="370" y1="100" x2="445" y2="148" stroke="#6a4c93" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrS)"/>
        <text x="385" y="128" textAnchor="middle" fontSize="10" fill="#6a4c93">{vp5b} µL</text>

        {/* Flèche Fiole 4 → Fiole 5 */}
        <line x1="595" y1="100" x2="515" y2="148" stroke="#e63946" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrS3)"/>
        <text x="580" y="128" textAnchor="middle" fontSize="10" fill="#e63946">{vp5} µL</text>

        {/* qsp */}
        <text x="205" y="228" textAnchor="middle" fontSize="9" fill="#aaa" fontStyle="italic">qsp éluant → {vF3} mL</text>
        <text x="475" y="228" textAnchor="middle" fontSize="9" fill="#aaa" fontStyle="italic">qsp éluant → {vF5} mL</text>
      </svg>
    );
  }

  return (
    <div>
      {/* Principe */}
      <div style={{background:'linear-gradient(135deg,#f3eeff,#fffbe6)',border:'1px solid #6a4c9333',
        borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13}}>
        <strong style={{color:'#4a2c73'}}>Principe :</strong>{' '}
        <span style={{color:'var(--color-text-secondary)'}}>
          On ajoute une quantité <em>connue et identique</em> d'étalon interne (EI) dans la solution étalon
          et dans la solution échantillon. Le rapport des aires compense les variations de volume injecté.
        </span>
        <div style={{marginTop:8,color:'#4a2c73',background:'rgba(106,76,147,0.08)',
          borderRadius:6,padding:'10px 14px',display:'flex',alignItems:'center',
          gap:8,flexWrap:'wrap',fontSize:13}}>
          <span>C<sub>analyte,éch</sub> =</span>
          <span>C<sub>analyte,étalon</sub></span>
          <span>×</span>
          <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:0}}>
            <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>A<sub>EI,étalon</sub></span>
            <span style={{paddingTop:1,fontSize:12}}>A<sub>analyte,étalon</sub></span>
          </span>
          <span>×</span>
          <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:0}}>
            <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>A<sub>analyte,éch</sub></span>
            <span style={{paddingTop:1,fontSize:12}}>A<sub>EI,éch</sub></span>
          </span>
        </div>
      </div>

      {/* Onglets */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {[['exemple','Exemple — hydrobenzoïne / benzoïne / benzile'],['manuel','Saisie manuelle']].map(([k,l])=>(
          <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>
        ))}
      </div>

      {/* ══ MODE OPÉRATOIRE ══ */}
      <div style={{marginBottom:16,borderRadius:12,overflow:'hidden',border:'1.5px solid #6a4c93',fontSize:12}}>
        <div style={{background:'#6a4c93',color:'white',fontWeight:600,fontSize:13,padding:'8px 14px'}}>
          Mode opératoire — Préparation des solutions
        </div>
        <div style={{background:'#ffffff',padding:'12px 16px'}}>

          {isEx ? (
            /* Exemple : schéma fixe */
            <SchemaFioles
              nomF1={['Hydrobenzoïne','Benzoïne','Benzile']}
              massesF1={[102.0, 105.9, 103.7]} volF1={20}
              nomEI="Paracétamol" masseEI={102.5} volF2={20}
              nomF4="Solide synthétisé" masseF4={101.7} volF4={20}
              vp3={40} vp3b={40} vF3={20}
              vp5={40} vp5b={40} vF5={20}
            />
          ) : (
            /* Saisie manuelle : schéma avec champs */
            <>
              {/* Paramètres fioles */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>

                {/* Fiole 1 */}
                <div style={{background:'#e8f8f5',border:'1px solid #2a9d8f',borderRadius:10,padding:'10px 12px'}}>
                  <div style={{fontWeight:600,fontSize:12,color:'#1a7a6e',marginBottom:8}}>
                    Fiole 1 — Analytes étalons
                  </div>
                  <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:4}}>Nombre d'analytes</div>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                    <button onClick={()=>setNA(v=>Math.max(1,v-1))}
                      style={{width:28,height:28,borderRadius:6,border:'none',
                        background:'#e63946',color:'white',cursor:'pointer',fontSize:16,fontWeight:'bold',lineHeight:1}}>−</button>
                    <span style={{fontSize:16,fontWeight:700,minWidth:24,textAlign:'center',color:'#1a7a6e'}}>{nA}</span>
                    <button onClick={()=>setNA(v=>Math.min(MAX_A,v+1))}
                      style={{width:28,height:28,borderRadius:6,border:'none',
                        background:'#2a9d8f',color:'white',cursor:'pointer',fontSize:16,fontWeight:'bold',lineHeight:1}}>+</button>
                  </div>
                  {Array(nA).fill(0).map((_,i)=>(
                    <div key={i} style={{display:'flex',gap:4,alignItems:'center',marginBottom:4}}>
                      <input value={etNoms[i]} onChange={e=>setIdx(etNoms,setEtNoms,i,e.target.value,false)}
                        placeholder={`Analyte ${i+1}`}
                        style={{...inpW(90),color:COMP_COLORS[i],fontWeight:500}}/>
                      <input type="number" value={etMasses[i]} onChange={e=>setIdx(etMasses,setEtMasses,i,e.target.value)}
                        style={inpW(55)} placeholder="mg"/>
                      <span style={{fontSize:10,color:'#888'}}>mg</span>
                    </div>
                  ))}
                  <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6}}>
                    <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>Volume fiole (mL)</span>
                    <input type="number" value={etVolF1} onChange={e=>setEtVolF1(parseFloat(e.target.value)||1)} style={inpW(55)}/>
                  </div>
                </div>

                {/* Fiole 2 — EI */}
                <div style={{background:'#f3eeff',border:'1px solid #6a4c93',borderRadius:10,padding:'10px 12px'}}>
                  <div style={{fontWeight:600,fontSize:12,color:'#4a2c73',marginBottom:8}}>
                    Fiole 2 — Étalon interne
                  </div>
                  <Field label="Nom de l'EI" value={eiNom} onChange={setEiNom} width={120} type="text"/>
                  <div style={{marginTop:6,display:'flex',gap:6,flexWrap:'wrap'}}>
                    {[['Masse (mg)',eiMasse,setEiMasse],['Volume fiole (mL)',eiVolF2,setEiVolF2]].map(([l,v,s])=>(
                      <div key={l}>
                        <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>{l}</div>
                        <input type="number" value={v} onChange={e=>s(parseFloat(e.target.value)||0)} style={inpW(70)}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fiole 4 — Échantillon */}
                <div style={{background:'#fff0f5',border:'1px solid #e63946',borderRadius:10,padding:'10px 12px'}}>
                  <div style={{fontWeight:600,fontSize:12,color:'#a01020',marginBottom:8}}>
                    Fiole 4 — Prise d'essai
                  </div>
                  <Field label="Nom du solide" value={echNomSolide} onChange={setEchNomSolide} width={120} type="text"/>
                  <div style={{marginTop:6,display:'flex',gap:6,flexWrap:'wrap'}}>
                    {[['Masse (mg)',echMasse,setEchMasse],['Volume fiole (mL)',echVolF4,setEchVolF4]].map(([l,v,s])=>(
                      <div key={l}>
                        <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>{l}</div>
                        <input type="number" value={v} onChange={e=>s(parseFloat(e.target.value)||0)} style={inpW(70)}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prélèvements */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div style={{background:'#f9f6ff',border:'1px solid #6a4c9344',borderRadius:8,padding:'8px 12px'}}>
                  <div style={{fontWeight:600,fontSize:11,color:'#4a2c73',marginBottom:6}}>Préparation Fiole 3 (étalon)</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',fontSize:11}}>
                    {[['µL de Fiole 1',volPrel3,setVolPrel3],['µL de Fiole 2 (EI)',volPrel3b,setVolPrel3b],['Volume final (mL)',volF3,setVolF3]].map(([l,v,s])=>(
                      <div key={l} style={{display:'flex',flexDirection:'column',gap:2}}>
                        <span style={{color:'var(--color-text-secondary)'}}>{l}</span>
                        <input type="number" value={v} onChange={e=>s(parseFloat(e.target.value)||0)} style={inpW(70)}/>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:'#fffbe6',border:'1px solid #e9a82444',borderRadius:8,padding:'8px 12px'}}>
                  <div style={{fontWeight:600,fontSize:11,color:'#9a6000',marginBottom:6}}>Préparation Fiole 5 (échantillon)</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',fontSize:11}}>
                    {[['µL de Fiole 4',volPrel5,setVolPrel5],['µL de Fiole 2 (EI)',volPrel5b,setVolPrel5b],['Volume final (mL)',volF5,setVolF5]].map(([l,v,s])=>(
                      <div key={l} style={{display:'flex',flexDirection:'column',gap:2}}>
                        <span style={{color:'var(--color-text-secondary)'}}>{l}</span>
                        <input type="number" value={v} onChange={e=>s(parseFloat(e.target.value)||0)} style={inpW(70)}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schéma dynamique */}
              <SchemaFioles
                nomF1={etNoms.slice(0,nA)} massesF1={etMasses.slice(0,nA)} volF1={etVolF1}
                nomEI={eiNom} masseEI={eiMasse} volF2={eiVolF2}
                nomF4={echNomSolide} masseF4={echMasse} volF4={echVolF4}
                vp3={volPrel3} vp3b={volPrel3b} vF3={volF3}
                vp5={volPrel5} vp5b={volPrel5b} vF5={volF5}
              />
            </>
          )}
        </div>
      </div>

      {/* Tableaux étalon / échantillon */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        {/* Étalon */}
        <div style={{background:C_ET.bg,border:`1.5px solid ${C_ET.border}`,borderRadius:12,padding:'14px 16px',minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,color:C_ET.text,marginBottom:10}}>{C_ET.label}</div>
          <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
            <thead>
              <tr>
                {['Composé','Cm (mg/L)','tr (min)','% aire'].map(h=>(
                  <th key={h} style={{padding:'4px 6px',borderBottom:`1px solid ${C_ET.border}44`,
                    textAlign:'left',fontWeight:600,fontSize:11,color:C_ET.text,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {noms.map((nom,i)=>(
                <tr key={i}>
                  <td style={tdS}><span style={{color:colors[i],fontWeight:500}}>{nom}</span></td>
                  <td style={tdS}>
                    {isEx ? <strong style={{color:colors[i]}}>{CmEt[i]}</strong>
                          : <strong style={{color:colors[i]}}>{CmEt_calc[i]?.toFixed(4) ?? '—'}</strong>}
                  </td>
                  <td style={tdS}>
                    {isEx ? trEt[i]
                          : <input type="number" value={etTr[i]} onChange={e=>setIdx(etTr,setEtTr,i,e.target.value)} style={inpW(55)}/>}
                  </td>
                  <td style={tdS}>
                    {isEx ? airesEt[i]
                          : <input type="number" value={etAires[i]} onChange={e=>setIdx(etAires,setEtAires,i,e.target.value)} style={inpW(65)}/>}
                  </td>
                </tr>
              ))}
              <tr style={{background:'rgba(106,76,147,0.07)',fontStyle:'italic'}}>
                <td style={tdS}><span style={{color:'#6a4c93',fontWeight:500}}>{eiLabel} (EI)</span></td>
                <td style={tdS}>
                  {isEx ? <strong style={{color:'#6a4c93'}}>{CmEI_et}</strong>
                        : <input type="number" value={etCmEI} onChange={e=>setEtCmEI(parseFloat(e.target.value)||0)} style={inpW(65)}/>}
                </td>
                <td style={tdS}>
                  {isEx ? trEI_et : <input type="number" value={etTrEI} onChange={e=>setEtTrEI(parseFloat(e.target.value)||0)} style={inpW(55)}/>}
                </td>
                <td style={tdS}>
                  {isEx ? areEI_et : <input type="number" value={etAireEI} onChange={e=>setEtAireEI(parseFloat(e.target.value)||0)} style={inpW(65)}/>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Échantillon */}
        <div style={{background:C_ECH.bg,border:`1.5px solid ${C_ECH.border}`,borderRadius:12,padding:'14px 16px',minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,color:C_ECH.text,marginBottom:10}}>{C_ECH.label}</div>
          <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
            <thead>
              <tr>
                {['Composé','Cm (mg/L)','tr (min)','% aire'].map(h=>(
                  <th key={h} style={{padding:'4px 6px',borderBottom:`1px solid ${C_ECH.border}44`,
                    textAlign:'left',fontWeight:600,fontSize:11,color:C_ECH.text,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {noms.map((nom,i)=>(
                <tr key={i}>
                  <td style={tdS}><span style={{color:colors[i],fontWeight:500}}>{nom}</span></td>
                  <td style={tdS}><span style={{color:'#aaa',fontStyle:'italic'}}>?</span></td>
                  <td style={tdS}>
                    {isEx ? trEch[i] : <input type="number" value={echTr[i]} onChange={e=>setIdx(echTr,setEchTr,i,e.target.value)} style={inpW(55)}/>}
                  </td>
                  <td style={tdS}>
                    {isEx ? airesEch[i] : <input type="number" value={echAires[i]} onChange={e=>setIdx(echAires,setEchAires,i,e.target.value)} style={inpW(65)}/>}
                  </td>
                </tr>
              ))}
              <tr style={{background:'rgba(233,168,36,0.08)',fontStyle:'italic'}}>
                <td style={tdS}><span style={{color:'#e9a824',fontWeight:500}}>{eiLabel} (EI)</span></td>
                <td style={tdS}><strong style={{color:'#e9a824'}}>{isEx ? ex.echantillon.CmEI : CmEI_calc_F5.toFixed(4)}</strong></td>
                <td style={tdS}>
                  {isEx ? trEI_ech : <input type="number" value={echTrEI} onChange={e=>setEchTrEI(parseFloat(e.target.value)||0)} style={inpW(55)}/>}
                </td>
                <td style={tdS}>
                  {isEx ? areEI_ech : <input type="number" value={echAireEI} onChange={e=>setEchAireEI(parseFloat(e.target.value)||0)} style={inpW(65)}/>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Chromatogrammes */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div style={{background:C_ET.bg,border:`1.5px solid ${C_ET.border}`,borderRadius:12,padding:'10px 14px'}}>
          <div style={{fontWeight:600,fontSize:12,color:C_ET.text,marginBottom:4}}>Chromatogramme — Fiole 3 (étalon)</div>
          <ChromatoPlot plotlyReady={plotlyReady} pics={picsEt} title=""/>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
            {picsEt.map(p=>(<span key={p.nom} style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
              <span style={{display:'inline-block',width:18,height:3,borderRadius:2,background:p.color}}/>{p.nom}
            </span>))}
          </div>
        </div>
        <div style={{background:C_ECH.bg,border:`1.5px solid ${C_ECH.border}`,borderRadius:12,padding:'10px 14px'}}>
          <div style={{fontWeight:600,fontSize:12,color:C_ECH.text,marginBottom:4}}>Chromatogramme — Fiole 5 (échantillon)</div>
          <ChromatoPlot plotlyReady={plotlyReady} pics={picsEch} title=""/>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
            {picsEch.map(p=>(<span key={p.nom} style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
              <span style={{display:'inline-block',width:18,height:3,borderRadius:2,background:p.color}}/>{p.nom}
            </span>))}
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div style={{background:'linear-gradient(135deg,#fffbe6,#f3eeff)',
        border:'1.5px solid #6a4c93',borderRadius:12,padding:'16px 18px'}}>
        <div style={{fontWeight:600,fontSize:14,color:'#4a2c73',marginBottom:12}}>Résultats</div>
        <table style={{borderCollapse:'collapse',fontSize:13,width:'100%',maxWidth:600}}>
          <thead>
            <tr style={{background:'rgba(106,76,147,0.1)'}}>
              {['Analyte','Cm solution injectée (mg/L)',"Masse dans la prise d'essai (mg)"].map(h=>(
                <th key={h} style={{padding:'7px 12px',borderBottom:'1.5px solid #6a4c9344',
                  textAlign:'left',fontWeight:600,fontSize:12,color:'#4a2c73'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {noms.map((nom,i)=>{
              const cm=CmEch[i]; const m=masseAnalyte[i];
              return (
                <tr key={i} style={{borderBottom:'1px solid rgba(106,76,147,0.15)'}}>
                  <td style={{padding:'6px 12px'}}>
                    <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',
                      background:colors[i],marginRight:6,verticalAlign:'middle'}}/>
                    <strong style={{color:colors[i]}}>{nom}</strong>
                  </td>
                  <td style={{padding:'6px 12px',fontWeight:500,color:'#4a2c73'}}>
                    {cm!==null ? cm.toFixed(4) : <span style={{color:'#aaa'}}>—</span>}
                  </td>
                  <td style={{padding:'6px 12px',fontWeight:600,color:'#e9a824'}}>
                    {m!==null ? m.toFixed(3)+' mg' : <span style={{color:'#aaa'}}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {isEx && (
          <div style={{fontSize:11,color:'#888',marginTop:10,fontStyle:'italic'}}>
            La masse correspond à la quantité d'analyte présente dans les 101,7 mg de solide analysé (Fiole 4).
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// NORMALISATION INTERNE
// ============================================================

export function SectionNormalisationInterne({plotlyReady}) {
  const [tab, setTab] = useState('exemple');
  const [nC, setNC] = useState(3);
  const [refIdx, setRefIdx] = useState(0);
  const MAX_C = 8;

  // Saisie manuelle — étalon
  const [noms,    setNoms]    = useState(Array(MAX_C).fill('').map((_,i)=>`Composé ${i+1}`));
  const [masses,  setMasses]  = useState(Array(MAX_C).fill(100));   // masses pesées (mg)
  const [volEt,   setVolEt]   = useState(10);                        // volume solution étalon (mL)
  const [aEt,     setAEt]     = useState(Array(MAX_C).fill(1000));
  const [trEt,    setTrEt]    = useState(Array(MAX_C).fill(0).map((_,i)=>parseFloat((1+i*0.8).toFixed(1))));
  // Saisie manuelle — échantillon
  const [aEch,    setAEch]    = useState(Array(MAX_C).fill(1000));
  const [trEch,   setTrEch]   = useState(Array(MAX_C).fill(0).map((_,i)=>parseFloat((1+i*0.8).toFixed(1))));

  const isEx = tab === 'exemple';
  const ex = EX_NI;
  const n = isEx ? ex.composesEtalon.length : nC;
  const ref = isEx ? ex.reference : Math.min(refIdx, n-1);

  const nomsList = isEx ? ex.composesEtalon.map(c=>c.nom)     : noms.slice(0,n);
  const colors   = isEx ? ex.composesEtalon.map(c=>c.couleur) : COMP_COLORS.slice(0,n);
  const airesEt  = isEx ? ex.composesEtalon.map(c=>c.aire)    : aEt.slice(0,n);
  const trEtalon = isEx ? ex.composesEtalon.map(c=>c.tr)      : trEt.slice(0,n);
  const airesEch = isEx ? ex.composesEch.map(c=>c.aire)       : aEch.slice(0,n);
  const trEchant = isEx ? ex.composesEch.map(c=>c.tr)         : trEch.slice(0,n);

  // % massiques étalon : calculés depuis les masses pesées en manuel, donnés en exemple
  const masseTotal = masses.slice(0,n).reduce((s,m)=>s+m, 0);
  const pctMasse = isEx
    ? ex.composesEtalon.map(c=>c.pctMasse)
    : masses.slice(0,n).map(m => masseTotal > 0 ? (m/masseTotal)*100 : 0);

  const Ki = Array(n).fill(null).map((_,i) => {
    if(i===ref) return 1;
    if(!airesEt[ref]||!airesEt[i]||!pctMasse[ref]||!pctMasse[i]) return null;
    return (pctMasse[i]/pctMasse[ref])*(airesEt[ref]/airesEt[i]);
  });

  const denom = Array(n).fill(0).reduce((s,_,i) => {
    const k=Ki[i]; const a=airesEch[i];
    return s + (k!==null && a ? k*a : 0);
  }, 0);

  const pctEch = Array(n).fill(null).map((_,i) => {
    const k=Ki[i]; const a=airesEch[i];
    if(k===null||!denom) return null;
    return (k*a/denom)*100;
  });

  const picsEt  = nomsList.map((nom,i)=>({nom, tr:trEtalon[i], aire:airesEt[i],  color:colors[i]}));
  const picsEch = nomsList.map((nom,i)=>({nom, tr:trEchant[i], aire:airesEch[i], color:colors[i]}));

  const inp = {fontSize:12, padding:'3px 6px',
    border:'1.5px solid #b39ddb', borderRadius:4,
    background:'#fffde7', color:'var(--color-text-primary)'};
  const inpW = (w) => ({...inp, width:w});

  function setI(arr,setArr,i,val,isNum=true){
    const next=[...arr]; next[i]=isNum?(parseFloat(val)||0):val; setArr(next);
  }

  const C_ET  = {bg:'#f0f4ff', border:'#6a4c93', text:'#4a2c73'};
  const C_ECH = {bg:'#fff7e6', border:'#e9a824',  text:'#9a6000'};
  const tdS = {padding:'3px 6px'};

  return (
    <div>
      {/* Principe */}
      <div style={{background:'linear-gradient(135deg,#f3eeff,#fffbe6)',
        border:'1px solid #6a4c9333',borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13}}>
        <strong style={{color:'#4a2c73'}}>Principe :</strong>{' '}
        <span style={{color:'var(--color-text-secondary)'}}>
          Un étalon de <em>composition massique connue</em> permet de calculer les coefficients de réponse relatifs K<sub>i/1</sub>.
          On en déduit les pourcentages massiques de chaque composé dans l'échantillon.
        </span>
        <div style={{marginTop:8,color:'#4a2c73',background:'rgba(106,76,147,0.08)',
          borderRadius:6,padding:'10px 14px',fontSize:13}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:10}}>
            <span>K<sub>i/1</sub> =</span>
            <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
              <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>%i<sub>étalon</sub></span>
              <span style={{paddingTop:1,fontSize:12}}>%1<sub>étalon</sub></span>
            </span>
            <span>×</span>
            <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
              <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>A<sub>1,étalon</sub></span>
              <span style={{paddingTop:1,fontSize:12}}>A<sub>i,étalon</sub></span>
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span>%i<sub>éch</sub> =</span>
            <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
              <span style={{borderBottom:'1.5px solid #4a2c73',paddingBottom:1,fontSize:12}}>
                K<sub>i/1</sub> × A<sub>i,éch</sub>
              </span>
              <span style={{paddingTop:1,fontSize:12}}>
                A<sub>1,éch</sub> + Σ K<sub>k/1</sub> × A<sub>k,éch</sub>
              </span>
            </span>
            <span>× 100</span>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {[['exemple','Exemple — éthanol / toluène / acétate de butyle (BTS 2018)'],['manuel','Saisie manuelle']].map(([k,l])=>(
          <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>
        ))}
      </div>

      {isEx && (
        <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:12,
          padding:'8px 12px',background:'var(--color-background-secondary)',borderRadius:8}}>
          {ex.description}
        </div>
      )}

      {/* Config saisie manuelle */}
      {!isEx && (
        <div style={{marginBottom:14,borderRadius:12,overflow:'hidden',
          border:'1.5px solid #6a4c93'}}>
          <div style={{background:'#6a4c93',color:'white',fontWeight:600,fontSize:13,padding:'8px 14px'}}>
            Paramètres de la solution étalon
          </div>
          <div style={{background:'#f9f6ff',padding:'12px 16px'}}>
            <div style={{display:'flex',gap:16,alignItems:'flex-start',flexWrap:'wrap',marginBottom:12}}>

              {/* Nombre de composés */}
              <div>
                <div style={{fontSize:12,color:'#4a2c73',fontWeight:500,marginBottom:6}}>Nombre de composés</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button onClick={()=>setNC(v=>Math.max(2,v-1))}
                    style={{width:28,height:28,borderRadius:6,border:'none',
                      background:'#e63946',color:'white',cursor:'pointer',fontSize:16,fontWeight:'bold'}}>−</button>
                  <span style={{fontSize:16,fontWeight:700,minWidth:24,textAlign:'center',color:'#4a2c73'}}>{nC}</span>
                  <button onClick={()=>setNC(v=>Math.min(MAX_C,v+1))}
                    style={{width:28,height:28,borderRadius:6,border:'none',
                      background:'#2a9d8f',color:'white',cursor:'pointer',fontSize:16,fontWeight:'bold'}}>+</button>
                </div>
              </div>

              {/* Composé de référence */}
              <div>
                <div style={{fontSize:12,color:'#4a2c73',fontWeight:500,marginBottom:6}}>Composé de référence ★</div>
                <select value={refIdx} onChange={e=>setRefIdx(Number(e.target.value))}
                  style={{...inp, padding:'4px 8px', width:'auto', background:'#fffde7'}}>
                  {noms.slice(0,nC).map((nm,i)=>(<option key={i} value={i}>{nm||`Composé ${i+1}`}</option>))}
                </select>
              </div>

              {/* Volume solution étalon */}
              <div>
                <div style={{fontSize:12,color:'#4a2c73',fontWeight:500,marginBottom:6}}>Volume solution étalon (mL)</div>
                <input type="number" value={volEt} onChange={e=>setVolEt(parseFloat(e.target.value)||1)}
                  style={inpW(80)}/>
              </div>
            </div>

            {/* Tableau masses */}
            <div style={{fontSize:12,color:'#4a2c73',fontWeight:500,marginBottom:6}}>
              Masses pesées — solution étalon
            </div>
            <table style={{borderCollapse:'collapse',fontSize:12,width:'100%',maxWidth:500}}>
              <thead>
                <tr>
                  {['Composé','Masse pesée (mg)','% massique calculé'].map(h=>(
                    <th key={h} style={{padding:'4px 8px',borderBottom:'1px solid #6a4c9344',
                      textAlign:'left',fontWeight:600,fontSize:11,color:'#4a2c73'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {noms.slice(0,nC).map((nom,i)=>(
                  <tr key={i} style={{background:i===refIdx?'rgba(106,76,147,0.08)':'transparent'}}>
                    <td style={tdS}>
                      <input value={noms[i]} onChange={e=>setI(noms,setNoms,i,e.target.value,false)}
                        style={{...inpW(110), color:COMP_COLORS[i], fontWeight:500}}
                        placeholder={`Composé ${i+1}`}/>
                      {i===refIdx && <span style={{marginLeft:4,color:'#6a4c93'}}>★</span>}
                    </td>
                    <td style={tdS}>
                      <input type="number" value={masses[i]}
                        onChange={e=>setI(masses,setMasses,i,e.target.value)}
                        style={inpW(80)}/>
                    </td>
                    <td style={{padding:'3px 8px',fontWeight:500,color:COMP_COLORS[i]}}>
                      {masseTotal > 0 ? ((masses[i]/masseTotal)*100).toFixed(2)+' %' : '—'}
                    </td>
                  </tr>
                ))}
                <tr style={{background:'rgba(106,76,147,0.05)',fontWeight:600}}>
                  <td style={{padding:'4px 8px',color:'#4a2c73'}}>Total</td>
                  <td style={{padding:'4px 8px',color:'#4a2c73'}}>{masseTotal.toFixed(1)} mg</td>
                  <td style={{padding:'4px 8px',color:'#2a9d8f'}}>100,00 %</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deux grilles étalon / échantillon */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>

        {/* Étalon */}
        <div style={{background:C_ET.bg,border:`1.5px solid ${C_ET.border}`,borderRadius:12,padding:'14px 16px',minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,color:C_ET.text,marginBottom:10}}>
            Étalon <span style={{fontWeight:400,fontSize:11}}>(composition connue)</span>
          </div>
          <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
            <thead>
              <tr>
                {['Composé','% masse','tr (min)','Aire'].map(h=>(
                  <th key={h} style={{padding:'4px 6px',borderBottom:`1px solid ${C_ET.border}44`,
                    textAlign:'left',fontWeight:600,fontSize:11,color:C_ET.text,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nomsList.map((nom,i)=>(
                <tr key={i} style={{background:i===ref?'rgba(106,76,147,0.08)':'transparent'}}>
                  <td style={tdS}>
                    <span style={{color:colors[i],fontWeight:500}}>
                      {nom}{i===ref?' ★':''}
                    </span>
                  </td>
                  <td style={tdS}>
                    <strong style={{color:colors[i]}}>{pctMasse[i].toFixed(2)} %</strong>
                  </td>
                  <td style={tdS}>
                    {isEx ? trEtalon[i]
                          : <input type="number" value={trEt[i]} onChange={e=>setI(trEt,setTrEt,i,e.target.value)} style={inpW(50)}/>}
                  </td>
                  <td style={tdS}>
                    {isEx ? airesEt[i].toLocaleString('fr-FR')
                          : <input type="number" value={aEt[i]} onChange={e=>setI(aEt,setAEt,i,e.target.value)} style={inpW(70)}/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Échantillon */}
        <div style={{background:C_ECH.bg,border:`1.5px solid ${C_ECH.border}`,borderRadius:12,padding:'14px 16px',minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,color:C_ECH.text,marginBottom:10}}>
            Échantillon <span style={{fontWeight:400,fontSize:11}}>(composition inconnue)</span>
          </div>
          <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
            <thead>
              <tr>
                {['Composé','% masse','tr (min)','Aire'].map(h=>(
                  <th key={h} style={{padding:'4px 6px',borderBottom:`1px solid ${C_ECH.border}44`,
                    textAlign:'left',fontWeight:600,fontSize:11,color:C_ECH.text,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nomsList.map((nom,i)=>(
                <tr key={i}>
                  <td style={tdS}><span style={{color:colors[i],fontWeight:500}}>{nom}</span></td>
                  <td style={tdS}><span style={{color:'#aaa',fontStyle:'italic'}}>?</span></td>
                  <td style={tdS}>
                    {isEx ? trEchant[i]
                          : <input type="number" value={trEch[i]} onChange={e=>setI(trEch,setTrEch,i,e.target.value)} style={inpW(50)}/>}
                  </td>
                  <td style={tdS}>
                    {isEx ? airesEch[i].toLocaleString('fr-FR')
                          : <input type="number" value={aEch[i]} onChange={e=>setI(aEch,setAEch,i,e.target.value)} style={inpW(70)}/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chromatogrammes */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div style={{background:C_ET.bg,border:`1.5px solid ${C_ET.border}`,borderRadius:12,padding:'10px 14px'}}>
          <div style={{fontWeight:600,fontSize:12,color:C_ET.text,marginBottom:4}}>Chromatogramme étalon</div>
          <ChromatoPlot plotlyReady={plotlyReady} pics={picsEt} title=""/>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
            {picsEt.map(p=>(<span key={p.nom} style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
              <span style={{display:'inline-block',width:18,height:3,borderRadius:2,background:p.color}}/>{p.nom}
            </span>))}
          </div>
        </div>
        <div style={{background:C_ECH.bg,border:`1.5px solid ${C_ECH.border}`,borderRadius:12,padding:'10px 14px'}}>
          <div style={{fontWeight:600,fontSize:12,color:C_ECH.text,marginBottom:4}}>Chromatogramme échantillon</div>
          <ChromatoPlot plotlyReady={plotlyReady} pics={picsEch} title=""/>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
            {picsEch.map(p=>(<span key={p.nom} style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
              <span style={{display:'inline-block',width:18,height:3,borderRadius:2,background:p.color}}/>{p.nom}
            </span>))}
          </div>
        </div>
      </div>

      {/* Coefficients Ki */}
      <div style={{background:'linear-gradient(135deg,#f3eeff,#fff)',
        border:'1.5px solid #6a4c93',borderRadius:12,padding:'14px 18px',marginBottom:14}}>
        <div style={{fontWeight:600,fontSize:13,color:'#4a2c73',marginBottom:10}}>
          Coefficients de réponse relatifs K<sub>i</sub>/{nomsList[ref]?.split(' ')[0]}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {nomsList.map((nom,i)=>(
            <div key={i} style={{background:'rgba(106,76,147,0.08)',borderRadius:8,
              padding:'6px 14px',fontSize:12,border:'1px solid #6a4c9322'}}>
              <span style={{color:'#4a2c73'}}>
                K<sub>{nom.split(' ')[0]}/{nomsList[ref]?.split(' ')[0]}</sub> ={' '}
              </span>
              <strong style={{color:colors[i]}}>
                {Ki[i]!==null ? Ki[i].toFixed(4) : '—'}{i===ref?' (réf.)':''}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Résultats */}
      <div style={{background:'linear-gradient(135deg,#fffbe6,#fff8f0)',
        border:'1.5px solid #e9a824',borderRadius:12,padding:'16px 18px'}}>
        <div style={{fontWeight:600,fontSize:14,color:'#9a6000',marginBottom:12}}>
          Résultats — % massiques dans l'échantillon
        </div>
        <table style={{borderCollapse:'collapse',fontSize:13,width:'100%',maxWidth:400}}>
          <thead>
            <tr style={{background:'rgba(233,168,36,0.1)'}}>
              {['Composé','% massique calculé'].map(h=>(
                <th key={h} style={{padding:'7px 12px',borderBottom:'1.5px solid #e9a82444',
                  textAlign:'left',fontWeight:600,fontSize:12,color:'#9a6000'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nomsList.map((nom,i)=>(
              <tr key={i} style={{borderBottom:'1px solid rgba(233,168,36,0.15)'}}>
                <td style={{padding:'6px 12px'}}>
                  <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',
                    background:colors[i],marginRight:6,verticalAlign:'middle'}}/>
                  <strong style={{color:colors[i]}}>{nom}</strong>
                </td>
                <td style={{padding:'6px 12px',fontWeight:600,color:pctEch[i]!==null?'#e9a824':'#aaa'}}>
                  {pctEch[i]!==null ? pctEch[i].toFixed(2)+' %' : '—'}
                </td>
              </tr>
            ))}
            <tr style={{background:'rgba(233,168,36,0.1)'}}>
              <td style={{padding:'6px 12px',fontWeight:600,color:'#9a6000'}}>Somme</td>
              <td style={{padding:'6px 12px',fontWeight:700,color:pctEch.every(p=>p!==null)?'#2a9d8f':'#aaa'}}>
                {pctEch.every(p=>p!==null)
                  ? pctEch.reduce((s,p)=>s+p,0).toFixed(2)+' %'
                  : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function SimulationEtalonnageInterne({ plotlyReady }) {
  const [methode, setMethode] = useState('ei');
  return (
    <div style={cardStyle}>
      <h2 style={{marginTop:0,fontSize:18,color:'var(--color-text-primary)'}}>
        Méthodes d'étalonnage interne — Niveau BTS
      </h2>
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        {[
          ['ei','📌 Étalon interne (EI)','Ajout d\'un composé étalon à concentration connue dans chaque solution','#2a9d8f','#e8f8f5','#1a7a6e'],
          ['ni','🔄 Normalisation interne (NI)','Étalon de composition connue — calcul de coefficients de réponse relatifs','#6a4c93','#f3eeff','#4a2c73'],
        ].map(([k,l,desc,col,bg,txt])=>(
          <button key={k} onClick={()=>setMethode(k)}
            style={{padding:'12px 20px',fontSize:14,borderRadius:10,cursor:'pointer',
              fontWeight:600,textAlign:'left',flex:'1 1 200px',
              border:methode===k?`2px solid ${col}`:`1px solid var(--color-border-secondary)`,
              background:methode===k?bg:'var(--color-background-secondary)',
              color:methode===k?txt:'var(--color-text-secondary)',
              transition:'all 0.15s'}}>
            <div>{l}</div>
            <div style={{fontSize:11,fontWeight:400,marginTop:3,opacity:0.8}}>{desc}</div>
          </button>
        ))}
      </div>
      <hr style={{margin:'0 0 20px',borderColor:'var(--color-border-tertiary)'}}/>
      {methode==='ei' && <SectionEtalonInterne plotlyReady={plotlyReady}/>}
      {methode==='ni' && <SectionNormalisationInterne plotlyReady={plotlyReady}/>}
    </div>
  );
}

