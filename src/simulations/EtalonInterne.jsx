import { useState, useEffect, useRef, useMemo } from "react";
import { Field, TabBtn, cardStyle, fmt, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton, styleBoite, Section, ORANGE_GUIDE, avecIndices } from "../commun";

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
    // Si l'EI n'a pas la même concentration dans les deux solutions, on corrige (facteur 1 dans l'exemple)
    const cEIet = isEx ? ex.etalon.CmEI : CmEI_calc_F3, cEIech = isEx ? ex.echantillon.CmEI : CmEI_calc_F5;
    const corrEI = cEIet > 0 && cEIech > 0 ? cEIech / cEIet : 1;
    return CmEt[i] * (areEI_et/airesEt[i]) * (airesEch[i]/areEI_ech) * corrEI;
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
          <TabBtn key={k} active={tab===k} color="#6a4c93" onClick={()=>setTab(k)}>{l}</TabBtn>
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
          <TabBtn key={k} active={tab===k} color="#6a4c93" onClick={()=>setTab(k)}>{l}</TabBtn>
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

function ExplorationEtalonnage({ plotlyReady }) {
  const [methode, setMethode] = useState('ei');
  return (
    <div>
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
      <HypothesesEtalon methode={methode} defaut={false}/>
      {methode==='ei' && <SectionEtalonInterne plotlyReady={plotlyReady}/>}
      {methode==='ni' && <SectionNormalisationInterne plotlyReady={plotlyReady}/>}
    </div>
  );
}



// ════════════════════════════════════════════════════════════════
//  HYPOTHÈSES DE TRAVAIL (communes à l'exploration, au parcours et au défi)
// ════════════════════════════════════════════════════════════════
function HypothesesEtalon({ methode, defaut = true, focus = false }) {
  const [ouvert, setOuvert] = useState(defaut);
  const li = (t, d) => <li style={{ marginBottom: 4 }}><strong>{t}</strong> {d}</li>;
  const commun = <>
    {li('La réponse du détecteur est proportionnelle à la quantité de composé injectée', '(l’aire d’un pic est proportionnelle à sa concentration) dans le domaine utilisé, pour chaque composé : la droite d’étalonnage passe par l’origine.')}
    {li('Les pics sont résolus et bien intégrés :', 'une aire mal séparée ou mal intégrée fausse directement le rapport des aires.')}
    {li('Les conditions d’analyse sont les mêmes', 'pour la solution étalon et pour la solution échantillon (même colonne, même programme, même détecteur), donc les coefficients de réponse ne changent pas d’une injection à l’autre.')}
  </>;
  return (
    <div style={focus ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10, marginBottom: 8 } : { marginBottom: 8 }}>
      <Section titre={`Hypothèses de travail : ${methode === 'ni' ? 'normalisation interne' : 'étalon interne'}`} ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
          {methode === 'ni' ? <>
            {li('Tous les constituants de l’échantillon sont élués et détectés.', 'Les pourcentages sont calculés sur la somme des aires corrigées : ils valent toujours 100 %. Un constituant non détecté (eau avec un FID, par exemple) fausse tous les autres résultats, par excès.')}
            {li('La composition de l’étalon est connue précisément', '(pourcentages massiques) : c’est elle qui donne les coefficients de réponse K.')}
            {commun}
            {li('Aucune information sur la masse injectée n’est nécessaire :', 'on travaille sur des rapports d’aires au sein d’un même chromatogramme. Le résultat est une composition (en %), pas une quantité.')}
          </> : <>
            {li('L’étalon interne (EI) n’est pas présent dans l’échantillon', 'et il est pur, stable, chimiquement inerte vis-à-vis de l’échantillon, avec un temps de rétention proche de ceux des analytes mais bien séparé.')}
            {li('L’EI est introduit en même quantité et dans le même volume final', 'dans la solution étalon et dans la solution échantillon. Sinon, il faut corriger du rapport des concentrations en EI (le calcul proposé ici le fait).')}
            {li('Les variations de volume injecté se compensent :', 'l’analyte et l’EI sont dans la même solution, donc leurs aires varient dans les mêmes proportions ; seul leur rapport est utilisé.')}
            {li('Un étalonnage à un seul point suppose', 'que la concentration de l’échantillon est proche de celle de l’étalon. Sinon, on vérifie la linéarité avec plusieurs étalons.')}
            {commun}
            {li('Les incertitudes ne sont pas calculées ici :', 'pesées, prélèvements, répétabilité de l’intégration s’ajoutent, et peuvent suffire à expliquer, par exemple, une somme de masses un peu supérieure à la prise d’essai.')}
          </>}
        </ul>
      </Section>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  CALCULS DES EXEMPLES (pour le parcours guidé)
// ════════════════════════════════════════════════════════════════
const PEI = (() => {
  const E = EX_EI, ds = E.echantillon;
  const df = ds.volPrelevement / ds.volFioleInjectee, V = ds.volFiole / 1000, m0 = ds.masseEch;
  const r = E.analytes.map((_, i) => {
    const ret = E.etalon.airesAnalytes[i] / E.etalon.aireEI, rech = ds.airesAnalytes[i] / ds.aireEI;
    const C = E.etalon.CmAnalytes[i] * rech / ret, m = C * V / df;
    return { ret, rech, C, m, pct: m / m0 * 100 };
  });
  return { r, df, V, m0, somme: r.reduce((a, x) => a + x.m, 0) };
})();
const PNI = (() => {
  const E = EX_NI, K = E.composesEtalon.map((c, i) => (c.pctMasse / E.composesEtalon[0].pctMasse) * (E.composesEtalon[0].aire / c.aire));
  const KA = K.map((k, i) => k * E.composesEch[i].aire), den = KA.reduce((a, b) => a + b, 0);
  return { K, den, pct: KA.map(x => x / den * 100) };
})();

const tdG = { padding: '3px 8px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5 };
const thG = { ...tdG, background: '#f1f5f9', fontWeight: 700 };

function TableauEI({ aires, cm }) {
  const E = EX_EI;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead><tr><th style={thG}>Composé</th>{cm && <th style={thG}>C<sub>m</sub> dans F3 (mg/L)</th>}{aires && <><th style={thG}>Aire, étalon (F3)</th><th style={thG}>Aire, échantillon (F5)</th></>}</tr></thead>
        <tbody>
          {E.analytes.map((a, i) => <tr key={i}>
            <td style={{ ...tdG, color: a.couleur, fontWeight: 700 }}>{a.nom}</td>
            {cm && <td style={tdG}>{fmt(E.etalon.CmAnalytes[i], 2)}</td>}
            {aires && <><td style={tdG}>{fmt(E.etalon.airesAnalytes[i], 2)}</td><td style={tdG}>{fmt(E.echantillon.airesAnalytes[i], 1)}</td></>}
          </tr>)}
          <tr style={{ background: '#fffbe6' }}>
            <td style={{ ...tdG, fontWeight: 700, color: '#b45309' }}>{E.eiNom} (EI)</td>
            {cm && <td style={tdG}>{fmt(E.etalon.CmEI, 2)}</td>}
            {aires && <><td style={tdG}>{fmt(E.etalon.aireEI, 2)}</td><td style={tdG}>{fmt(E.echantillon.aireEI, 1)}</td></>}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
function TableauNI({ avecK }) {
  const E = EX_NI;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead><tr><th style={thG}>Composé</th><th style={thG}>% massique, étalon</th><th style={thG}>Aire, étalon</th><th style={thG}>Aire, échantillon</th>{avecK && <th style={thG}>K<sub>i/1</sub></th>}</tr></thead>
        <tbody>{E.composesEtalon.map((c, i) => <tr key={i}>
          <td style={{ ...tdG, color: c.couleur, fontWeight: 700 }}>{c.nom}{i === 0 ? ' (réf.)' : ''}</td>
          <td style={tdG}>{fmt(c.pctMasse, 1)}</td><td style={tdG}>{c.aire.toLocaleString('fr-FR')}</td><td style={tdG}>{E.composesEch[i].aire.toLocaleString('fr-FR')}</td>
          {avecK && <td style={tdG}>{i === 0 ? '1' : fmt(PNI.K[i], 4)}</td>}
        </tr>)}</tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PARCOURS GUIDÉ : l'étalon interne, puis la normalisation interne
// ════════════════════════════════════════════════════════════════
function ParcoursEtalon({ plotlyReady, changerMode }) {
  const [guide, setGuide] = useEtatPersistant('etalon-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const etape = guide.etape, E = EX_EI, r0 = PEI.r[0];
  const ETAPES = [
    { id: 'principe', titre: 'Pourquoi un étalon interne ?', focus: [],
      texte: <>On veut doser trois composés (hydrobenzoïne, benzoïne, benzile) dans un solide de synthèse, par chromatographie. L’aire d’un pic dépend de la concentration, mais aussi du <strong>volume réellement injecté</strong>, qui varie un peu d’une injection à l’autre. L’<strong>étalon interne</strong> (EI), le paracétamol, est ajouté à chaque solution.</>,
      tache: { type: 'qcm', q: 'Que permet l’EI ?', options: ['Compenser les variations de volume injecté : on utilise le rapport des aires analyte / EI', 'Augmenter la hauteur des pics', 'Éviter de préparer une solution étalon'], bonne: 0 } },
    { id: 'choixEI', titre: 'Choisir l’étalon interne', focus: [],
      texte: <>Le paracétamol a un temps de rétention proche de ceux des analytes, mais séparé de leurs pics.</>,
      tache: { type: 'qcm', q: 'Lequel de ces composés ne pourrait pas servir d’EI ?', options: ['Un composé déjà présent dans l’échantillon à analyser', 'Un composé pur et stable', 'Un composé dont le pic est bien séparé des autres'], bonne: 0,
        expl: 'Son aire contiendrait la contribution de l’échantillon : le rapport des aires n’aurait plus de sens.' } },
    { id: 'hypotheses', titre: 'Sur quoi repose la méthode ?', focus: ['hypo'],
      texte: <>Lisez l’encadré « Hypothèses de travail ». Ici, un seul étalon est préparé : la méthode suppose donc que la réponse est proportionnelle à la concentration.</>,
      tache: { type: 'qcm', q: 'Pourquoi un seul point d’étalonnage suffit-il ?', options: ['On suppose la droite d’étalonnage linéaire et passant par l’origine, avec une concentration d’échantillon proche de celle de l’étalon', 'Parce que les erreurs se compensent toujours', 'Parce que l’EI est présent'], bonne: 0 } },
    { id: 'cmEtalon', titre: 'La solution étalon (fiole 3)', focus: [],
      texte: <>On dissout 102,0 mg d’hydrobenzoïne dans une fiole 1 de 20 mL. On prélève 40 µL de cette solution, que l’on introduit dans la fiole 3 de 20 mL, avec 40 µL de la solution d’EI (fiole 2), puis on complète au trait.</>,
      tache: { type: 'num', q: 'Concentration massique C_m de l’hydrobenzoïne dans la fiole 3', unite: 'mg/L', vrai: E.etalon.CmAnalytes[0], tol: 0.002, affiche: x => fmt(x, 2),
        aide: <>C<sub>m</sub> = (m / V<sub>F1</sub>) × V<sub>prélevé</sub> / V<sub>F3</sub>, avec les volumes dans la même unité</>,
        pieges: [[102 / 20, 'Il manque la dilution de la fiole 1 vers la fiole 3 (prélèvement de 40 µL dans 20 mL).']] } },
    { id: 'cmEI', titre: 'L’EI dans les deux solutions', focus: [],
      texte: <>La solution échantillon (fiole 5) est préparée de la même façon : 40 µL de la solution du solide (fiole 4) et 40 µL de la <strong>même</strong> solution d’EI (fiole 2), dans une fiole de 20 mL. Dans la fiole 3 (étalon), l’EI est à {fmt(E.etalon.CmEI, 2)} mg/L.</>,
      tache: { type: 'qcm', q: 'Dans la fiole 5, la concentration en EI est…', options: [`la même : ${fmt(E.etalon.CmEI, 2)} mg/L`, 'nulle, puisque l’EI est dans l’étalon', 'inconnue : elle dépend de l’échantillon'], bonne: 0,
        expl: 'C’est ce qui permet de se servir de l’EI comme repère commun aux deux solutions.' } },
    { id: 'rapportEt', titre: 'Les chromatogrammes', focus: ['tableau'],
      texte: <>Les aires des pics sont maintenant dans le tableau, pour la solution étalon et pour la solution échantillon. Pour chaque solution, on forme le <strong>rapport des aires</strong> A<sub>analyte</sub> / A<sub>EI</sub>. Commencez par l’étalon, pour l’hydrobenzoïne.</>,
      tache: { type: 'num', q: 'Rapport A_hydrobenzoïne / A_EI dans la solution étalon', unite: '', vrai: r0.ret, tol: 0.004, affiche: x => fmt(x, 4) } },
    { id: 'rapportEch', titre: 'Dans l’échantillon', focus: ['tableau'],
      texte: <>Même calcul sur le chromatogramme de la solution échantillon.</>,
      tache: { type: 'num', q: 'Rapport A_hydrobenzoïne / A_EI dans la solution échantillon', unite: '', vrai: r0.rech, tol: 0.004, affiche: x => fmt(x, 4) } },
    { id: 'cEch', titre: 'La concentration dans la solution injectée', focus: [],
      texte: <>Comme l’EI est à la même concentration dans les deux solutions, le rapport des aires est proportionnel à C<sub>m</sub> de l’analyte : C<sub>éch</sub> / C<sub>ét</sub> = (A<sub>an</sub> / A<sub>EI</sub>)<sub>éch</sub> / (A<sub>an</sub> / A<sub>EI</sub>)<sub>ét</sub>.</>,
      tache: { type: 'num', q: 'C_m de l’hydrobenzoïne dans la fiole 5', unite: 'mg/L', vrai: r0.C, tol: 0.004, affiche: x => fmt(x, 3),
        pieges: [[E.etalon.CmAnalytes[0] * r0.ret / r0.rech, 'Les deux rapports sont inversés : le rapport de l’échantillon est au numérateur.'], [E.etalon.CmAnalytes[0] * r0.rech, 'Il faut aussi diviser par le rapport des aires de l’étalon.']] } },
    { id: 'masse', titre: 'La masse dans la prise d’essai', focus: [],
      texte: <>La fiole 5 est une dilution de la fiole 4 (101,7 mg de solide dans 20 mL) : on a prélevé 40 µL de la fiole 4 pour faire 20 mL, soit un facteur de dilution de 40 / 20 000 = 0,002. Remontez d’abord à la concentration dans la fiole 4, puis à la masse d’hydrobenzoïne dans les 20 mL.</>,
      tache: { type: 'num', q: 'Masse d’hydrobenzoïne dans la prise d’essai', unite: 'mg', vrai: r0.m, tol: 0.004, affiche: x => fmt(x, 1),
        pieges: [[r0.C * 0.020, 'Il manque le facteur de dilution : la fiole 4 est 500 fois plus concentrée que la fiole 5.']] } },
    { id: 'pct', titre: 'Le pourcentage massique', focus: [],
      texte: <>La prise d’essai du solide est de 101,7 mg.</>,
      tache: { type: 'num', q: 'Pourcentage massique d’hydrobenzoïne dans le solide', unite: '%', vrai: r0.pct, tol: 0.004, affiche: x => fmt(x, 1) } },
    { id: 'somme', titre: 'Une somme supérieure à 100 %', focus: [],
      texte: <>Les mêmes calculs donnent {fmt(PEI.r[1].m, 2)} mg de benzoïne et {fmt(PEI.r[2].m, 2)} mg de benzile. Au total : {fmt(PEI.somme, 1)} mg d’analytes pour {fmt(PEI.m0, 1)} mg de solide, soit {fmt(PEI.somme / PEI.m0 * 100, 1)} %.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de ce résultat ?', options: ['Il est physiquement impossible, mais cet écart de quelques % est de l’ordre des incertitudes (pesées, prélèvements de 40 µL, intégration des aires)', 'La méthode de l’étalon interne est fausse', 'Le solide contient plus que sa masse'], bonne: 0,
        expl: 'Un écart de 4 % est plausible : prélever 40 µL à la micropipette a déjà une incertitude de l’ordre du pourcent. Cette méthode ne donne pas d’incertitude ici : il faudrait la calculer avant de conclure.' } },
    { id: 'injection', titre: 'Et si le volume injecté change ?', focus: [],
      texte: <>On réinjecte la solution échantillon en doublant le volume injecté, par exemple parce que l’échantillonneur automatique est déréglé.</>,
      tache: { type: 'qcm', q: 'La masse d’hydrobenzoïne calculée sera…', options: ['inchangée : les aires de l’analyte et de l’EI doublent toutes les deux, et leur rapport ne change pas', 'doublée', 'divisée par deux'], bonne: 0 } },
    { id: 'quantiteEI', titre: 'Et si l’EI n’est pas en même quantité ?', focus: ['hypo'],
      texte: <>Une erreur de préparation introduit dans la fiole 5 <strong>deux fois plus</strong> d’EI que dans la fiole 3. On applique pourtant la formule de l’étape précédente, sans la corriger.</>,
      tache: { type: 'qcm', q: 'La concentration en analyte trouvée sera…', options: ['sous-estimée d’un facteur 2', 'correcte, car l’EI compense tout', 'surestimée d’un facteur 2'], bonne: 0,
        expl: 'L’aire de l’EI double dans l’échantillon, donc le rapport A_analyte / A_EI est divisé par 2. La formule suppose la même concentration en EI ; sinon, il faut multiplier par C_EI,éch / C_EI,ét (ce que fait l’exploration libre).' } },
    // ── normalisation interne ──
    { id: 'niPrincipe', titre: 'La normalisation interne', focus: [],
      texte: <>Autre cas : un mélange éthanol / toluène / acétate de butyle, analysé par CPG. Ici, on n’ajoute rien : on veut la <strong>composition massique</strong> de l’échantillon. On dispose d’un étalon de composition connue, passé dans les mêmes conditions.</>,
      tache: { type: 'qcm', q: 'Dans quel cas la normalisation interne convient-elle ?', options: ['Tous les constituants de l’échantillon sont élués et détectés, et l’on veut leur pourcentage massique', 'On veut doser un seul constituant, présent à l’état de traces', 'On ne connaît la composition d’aucun étalon'], bonne: 0 } },
    { id: 'niHypo', titre: 'Une hypothèse forte', focus: ['hypo'],
      texte: <>Les pourcentages sont calculés à partir de la somme des aires corrigées : par construction, leur somme vaut 100 %.</>,
      tache: { type: 'qcm', q: 'L’échantillon contient aussi de l’eau, non détectée par le détecteur. Les pourcentages calculés par NI seront…', options: ['surestimés, car on les rapporte à un total qui ne contient pas l’eau', 'sous-estimés', 'corrects : l’eau ne gêne pas'], bonne: 0 } },
    { id: 'k2', titre: 'Le coefficient de réponse du toluène', focus: ['tableauNI'],
      texte: <>On prend l’éthanol comme référence (1). Le coefficient de réponse relatif K<sub>i/1</sub> compare la masse et l’aire de chaque composé à celles de la référence : K<sub>i/1</sub> = (%<sub>i</sub> / %<sub>1</sub>) × (A<sub>1</sub> / A<sub>i</sub>), mesurés sur <strong>l’étalon</strong>.</>,
      tache: { type: 'num', q: 'K du toluène par rapport à l’éthanol', unite: '', vrai: PNI.K[1], tol: 0.005, affiche: x => fmt(x, 4),
        pieges: [[1 / PNI.K[1], 'Le rapport est inversé : A de la référence au numérateur.']] } },
    { id: 'k3', titre: 'Le coefficient de l’acétate de butyle', focus: ['tableauNI'],
      texte: <>Même calcul pour l’acétate de butyle.</>,
      tache: { type: 'num', q: 'K de l’acétate de butyle par rapport à l’éthanol', unite: '', vrai: PNI.K[2], tol: 0.005, affiche: x => fmt(x, 4) } },
    { id: 'denom', titre: 'Corriger les aires de l’échantillon', focus: ['tableauNI'],
      texte: <>Dans l’échantillon, on corrige chaque aire par son coefficient : la quantité K<sub>i/1</sub> × A<sub>i</sub> est proportionnelle à la masse du composé i. Sommez ces trois quantités (la référence a K = 1).</>,
      tache: { type: 'num', q: 'Σ K_i/1 × A_i, sur l’échantillon', unite: '', vrai: PNI.den, tol: 0.004, affiche: x => Math.round(x).toLocaleString('fr-FR') } },
    { id: 'pctAc', titre: 'Le pourcentage d’acétate de butyle', focus: [],
      texte: <>%<sub>i</sub> = K<sub>i/1</sub> × A<sub>i</sub> / Σ(K × A) × 100.</>,
      tache: { type: 'num', q: 'Pourcentage massique d’acétate de butyle dans l’échantillon', unite: '%', vrai: PNI.pct[2], tol: 0.005, affiche: x => fmt(x, 1) } },
    { id: 'pctEth', titre: 'Un pourcentage de plus', focus: [],
      texte: <>Pour terminer, le pourcentage d’éthanol. Vérifiez que les trois pourcentages totalisent 100 %.</>,
      tache: { type: 'num', q: 'Pourcentage massique d’éthanol dans l’échantillon', unite: '%', vrai: PNI.pct[0], tol: 0.005, affiche: x => fmt(x, 1) } },
    { id: 'niInjection', titre: 'Pourquoi pas de masse injectée ?', focus: [],
      texte: <>La normalisation interne ne demande ni la masse de l’échantillon, ni le volume injecté.</>,
      tache: { type: 'qcm', q: 'Pourquoi ?', options: ['On n’utilise que des rapports d’aires au sein d’un même chromatogramme : l’injection se simplifie, mais on n’obtient qu’une composition, pas une quantité', 'Parce que ces grandeurs sont toujours égales à 1', 'Parce que le détecteur les mesure'], bonne: 0 } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous avez mené les deux méthodes en gardant en tête leurs conditions de validité : linéarité, pics bien résolus, même quantité d’EI, tous les constituants détectés. En exploration libre, saisissez vos propres résultats ; dans le défi, un jeu de données inconnu vous attend.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const vu = id => etape >= idx(id), passe = id => etape > idx(id);
  const hl = id => et.focus.includes(id);
  const partieNI = vu('niPrincipe');
  const halo = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 8 } : {};
  const fin = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  const picsEt = [...E.analytes.map((a, i) => ({ nom: a.nom, tr: E.etalon.trAnalytes[i], aire: E.etalon.airesAnalytes[i], color: a.couleur })), { nom: E.eiNom, tr: E.etalon.trEI, aire: E.etalon.aireEI, color: '#888' }];
  const picsEch = [...E.analytes.map((a, i) => ({ nom: a.nom, tr: E.echantillon.trAnalytes[i], aire: E.echantillon.airesAnalytes[i], color: a.couleur })), { nom: E.eiNom, tr: E.echantillon.trEI, aire: E.echantillon.aireEI, color: '#888' }];
  return (
    <div className="ei-l1">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        {!partieNI ? <>
          <div style={styleBoite}>
            <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55, marginBottom: 8 }}>
              <strong>Mode opératoire.</strong> F1 : 102,0 mg d’hydrobenzoïne, 105,9 mg de benzoïne, 103,7 mg de benzile (chacun dans une fiole de 20 mL). F2 : 102,5 mg de paracétamol (EI) dans 20 mL.
              F3 (étalon) : 40 µL de chaque fiole F1 et 40 µL de F2, complétés à 20 mL. F4 : 101,7 mg de solide dans 20 mL. F5 (échantillon) : 40 µL de F4 et 40 µL de F2, complétés à 20 mL.
            </div>
            <div style={halo('tableau')}><TableauEI aires={vu('rapportEt')} cm={passe('cmEtalon')}/></div>
          </div>
          {vu('rapportEt') && <div className="ei-l2" style={halo('tableau')}>
            <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Chromatogramme de la fiole 3 (étalon)</div><ChromatoPlot plotlyReady={plotlyReady} pics={picsEt} title=""/></div>
            <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Chromatogramme de la fiole 5 (échantillon)</div><ChromatoPlot plotlyReady={plotlyReady} pics={picsEch} title=""/></div>
          </div>}
        </> : (
          <div style={styleBoite}>
            <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55, marginBottom: 8 }}>Mélange éthanol / toluène / acétate de butyle (CPG). Un étalon de composition massique connue et l’échantillon sont injectés dans les mêmes conditions.</div>
            <div style={halo('tableauNI')}><TableauNI avecK={passe('k3')}/></div>
          </div>
        )}
        <HypothesesEtalon methode={partieNI ? 'ni' : 'ei'} defaut={hl('hypo')} focus={hl('hypo')} key={`${partieNI}-${hl('hypo')}`}/>
      </div>
      <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={fin}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  DÉFI : données inconnues, étalon interne ou normalisation interne
// ════════════════════════════════════════════════════════════════
const alea = (a, b) => a + Math.random() * (b - a);
const arr = (x, d) => parseFloat(x.toFixed(d));
function campagneEI() {
  const nom = ['Composé A', 'Composé B'], mF1 = [0, 1].map(() => arr(alea(85, 120), 1)), mEI = arr(alea(90, 115), 1), m0 = arr(alea(90, 115), 1);
  const K = [alea(0.7, 1.5), alea(0.6, 1.4)], p = [alea(0.35, 0.6), alea(0.05, 0.2)];
  const Cet = mF1.map(m => m * 40 / (20 * 20)), CEI = mEI * 40 / (20 * 20);
  const aEIet = arr(alea(22, 36), 2), aEIech = arr(alea(40, 70), 2);
  const aEt = Cet.map((c, i) => arr(K[i] * (c / CEI) * aEIet, 2));
  const CF5 = p.map(x => x * m0 / 20 * 40 / 20000 * 1000 / 1);        // mg/L : (p·m0 mg / 20 mL) × dilution
  const aEch = CF5.map((c, i) => arr(K[i] * (c / CEI) * aEIech * (1 + (Math.random() - 0.5) * 0.02), 1));
  return { type: 'ei', nom, mF1, mEI, m0, Cet, CEI, aEt, aEIet, aEch, aEIech, reps: {}, choix: {}, verifie: false };
}
function campagneNI() {
  const noms = pick3();
  const p0 = arr(alea(25, 55), 1), p1 = arr(alea(15, 35), 1), pct = [p0, p1, arr(100 - p0 - p1, 1)];
  const K = [1, alea(0.5, 1.8), alea(0.5, 1.8)], A1 = Math.round(alea(150000, 450000) / 1000) * 1000;
  const aEt = pct.map((q, i) => i === 0 ? A1 : Math.round(q / pct[0] * A1 / K[i]));
  const q = (() => { const a = [alea(15, 50), alea(15, 40), 0]; a[2] = 100 - a[0] - a[1]; return a; })(), s = alea(0.6, 1.6) * A1 / q[0];
  const aEch = q.map((x, i) => Math.round(x / K[i] * s * (1 + (Math.random() - 0.5) * 0.02)));
  return { type: 'ni', noms, pct, aEt, aEch, cible: Math.floor(Math.random() * 2) + 1, reps: {}, choix: {}, verifie: false };
}
function pick3() {
  const jeux = [['Éthanol', 'Toluène', 'Acétate de butyle'], ['Hexane', 'Cyclohexane', 'Toluène'], ['Méthanol', 'Éthanol', 'Propan-2-ol'], ['Benzène', 'Xylène', 'Éthylbenzène']];
  return jeux[Math.floor(Math.random() * jeux.length)];
}
function DefiEtalon() {
  const [defi, setDefi] = useState(() => campagneEI());
  const maj = f => setDefi(d => ({ ...d, verifie: false, ...f(d) }));
  let Q = [], enonce = null;
  if (defi.type === 'ei') {
    const { Cet, CEI, aEt, aEIet, aEch, aEIech, m0 } = defi, df = 40 / 20000;
    const ret = aEt[0] / aEIet, rech = aEch[0] / aEIech, C = Cet[0] * rech / ret, m = C * 0.020 / df;
    Q = [
      { id: 'cet', q: 'Concentration massique du composé A dans la fiole 3', vrai: Cet[0], tol: 0.003, aff: fmt(Cet[0], 2), u: 'mg/L' },
      { id: 'ret', q: 'Rapport A_A / A_EI dans la solution étalon', vrai: ret, tol: 0.004, aff: fmt(ret, 4) },
      { id: 'rech', q: 'Rapport A_A / A_EI dans la solution échantillon', vrai: rech, tol: 0.004, aff: fmt(rech, 4) },
      { id: 'c', q: 'Concentration massique du composé A dans la fiole 5', vrai: C, tol: 0.005, aff: fmt(C, 3), u: 'mg/L' },
      { id: 'm', q: 'Masse de composé A dans la prise d’essai', vrai: m, tol: 0.005, aff: fmt(m, 2), u: 'mg' },
      { id: 'p', q: 'Pourcentage massique de composé A dans le solide', vrai: m / m0 * 100, tol: 0.005, aff: fmt(m / m0 * 100, 1), u: '%' },
      { id: 'tw', q: 'On réinjecte l’échantillon avec un volume injecté 1,5 fois plus grand : la masse calculée sera…', choix: ['multipliée par 1,5', 'inchangée', 'divisée par 1,5'], vrai: 1 },
    ];
    enonce = <>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55, marginBottom: 8 }}>
        Dosage de deux composés (A et B) dans un solide, par étalon interne. F1 : {fmt(defi.mF1[0], 1)} mg de A et {fmt(defi.mF1[1], 1)} mg de B (chacun dans 20 mL). F2 : {fmt(defi.mEI, 1)} mg d’EI dans 20 mL.
        F3 (étalon) : 40 µL de chaque fiole F1 et 40 µL de F2, complétés à 20 mL. F4 : {fmt(m0, 1)} mg de solide dans 20 mL. F5 (échantillon) : 40 µL de F4 et 40 µL de F2, complétés à 20 mL.
      </div>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead><tr><th style={thG}>Composé</th><th style={thG}>Aire, étalon (F3)</th><th style={thG}>Aire, échantillon (F5)</th></tr></thead>
        <tbody>
          {defi.nom.map((n, i) => <tr key={i}><td style={thG}>{n}</td><td style={tdG}>{fmt(aEt[i], 2)}</td><td style={tdG}>{fmt(aEch[i], 1)}</td></tr>)}
          <tr style={{ background: '#fffbe6' }}><td style={thG}>EI</td><td style={tdG}>{fmt(aEIet, 2)}</td><td style={tdG}>{fmt(aEIech, 2)}</td></tr>
        </tbody>
      </table>
    </>;
  } else {
    const { noms, pct, aEt, aEch, cible } = defi, K = pct.map((q, i) => (q / pct[0]) * (aEt[0] / aEt[i]));
    const KA = K.map((k, i) => k * aEch[i]), den = KA.reduce((a, b) => a + b, 0), c = cible;
    Q = [
      { id: 'k2', q: `K de « ${noms[1]} » par rapport à « ${noms[0]} »`, vrai: K[1], tol: 0.005, aff: fmt(K[1], 4) },
      { id: 'k3', q: `K de « ${noms[2]} » par rapport à « ${noms[0]} »`, vrai: K[2], tol: 0.005, aff: fmt(K[2], 4) },
      { id: 'den', q: 'Σ K_i/1 × A_i, sur l’échantillon', vrai: den, tol: 0.004, aff: Math.round(den).toLocaleString('fr-FR') },
      { id: 'pc', q: `Pourcentage massique de « ${noms[c]} » dans l’échantillon`, vrai: KA[c] / den * 100, tol: 0.005, aff: fmt(KA[c] / den * 100, 1), u: '%' },
      { id: 'p0', q: `Pourcentage massique de « ${noms[0]} » dans l’échantillon`, vrai: KA[0] / den * 100, tol: 0.005, aff: fmt(KA[0] / den * 100, 1), u: '%' },
      { id: 'tw', q: 'L’échantillon contient en plus un constituant non détecté. Les pourcentages calculés sont…', choix: ['sous-estimés', 'corrects', 'surestimés'], vrai: 2 },
    ];
    enonce = <>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55, marginBottom: 8 }}>Analyse par normalisation interne d’un mélange de trois composés (référence : « {noms[0]} »). Étalon de composition massique connue et échantillon, passés dans les mêmes conditions.</div>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead><tr><th style={thG}>Composé</th><th style={thG}>% massique, étalon</th><th style={thG}>Aire, étalon</th><th style={thG}>Aire, échantillon</th></tr></thead>
        <tbody>{noms.map((n, i) => <tr key={i}><td style={thG}>{n}</td><td style={tdG}>{fmt(pct[i], 1)}</td><td style={tdG}>{aEt[i].toLocaleString('fr-FR')}</td><td style={tdG}>{aEch[i].toLocaleString('fr-FR')}</td></tr>)}</tbody>
      </table>
    </>;
  }
  const juste = q => q.choix ? defi.choix[q.id] === q.vrai : proche(lireNombre(defi.reps[q.id] || ''), q.vrai, q.tol);
  return (
    <div className="ei-l1">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setDefi(campagneEI())} style={styleBouton(defi.type === 'ei', '#2a9d8f')}>📌 Étalon interne</button>
          <button onClick={() => setDefi(campagneNI())} style={styleBouton(defi.type === 'ni', '#6a4c93')}>🔄 Normalisation interne</button>
        </div>
        <div style={styleBoite}>{enonce}</div>
        <HypothesesEtalon methode={defi.type} defaut={false} key={defi.type}/>
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
                  {q.choix.map((c, k) => <button key={k} onClick={() => maj(d => ({ choix: { ...d.choix, [q.id]: k } }))} style={{ ...styleBouton(defi.choix[q.id] === k, '#0ea5e9'), padding: '4px 9px', fontSize: 13 }}>{c}</button>)}
                  {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${i + 1}`} onChange={e => { const v = e.target.value; maj(d => ({ reps: { ...d.reps, [q.id]: v } })); }}
                    style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                  <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.u}</span>
                  {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
                </div>
              )}
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.choix ? q.choix[q.vrai] : `${q.aff} ${q.u || ''}`}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={() => setDefi(defi.type === 'ei' ? campagneEI() : campagneNI())} style={styleBouton(false)}>🔄 Nouvelles données</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SIMULATION 13 : trois façons de travailler
// ════════════════════════════════════════════════════════════════
export function SimulationEtalonnageInterne({ plotlyReady }) {
  const [mode, setMode] = useState('explore');   // on arrive sur l'exploration libre
  useEffect(() => { if (mode === 'explore') { const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 120); return () => clearTimeout(t); } }, [mode]);
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ei-l1 { display: grid; align-items: start; gap: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ei-l2 { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
        @media (max-width: 900px) { .ei-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button onClick={() => setMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
        <button onClick={() => setMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
        <button onClick={() => setMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
      </div>
      <div style={{ display: mode === 'explore' ? 'block' : 'none' }}><ExplorationEtalonnage plotlyReady={plotlyReady}/></div>
      {mode === 'guide' && <ParcoursEtalon plotlyReady={plotlyReady} changerMode={setMode}/>}
      {mode === 'defi' && <DefiEtalon/>}
    </div>
  );
}
