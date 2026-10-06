import { useState, useEffect, useRef, useMemo } from "react";
import { SimulationAptitude } from "./simulations/Aptitude";
import { Simulation1 } from "./simulations/Avancement";
import { BeerLambertBTS } from "./simulations/BeerLambert";
import { BeerLambert1G } from "./simulations/BeerLambert1G";
import { SimulationBernoulli } from "./simulations/Bernoulli";
import { BandeauContexte } from "./commun";
import { CONTEXTES } from "./contextes";
import { SimulationCLHP } from "./simulations/CLHP";
import { Simulation8 } from "./simulations/ChaineMesure";
import { Simulation7 } from "./simulations/Cristallisation";
import { SimulationEtalonnageInterne } from "./simulations/EtalonInterne";
import { Simulation4 } from "./simulations/Hansen";
import { Simulation9 } from "./simulations/InterLaboratoire";
import { SimulationPeinture } from "./simulations/Peinture";
import { Simulation6 } from "./simulations/PointFonctionnement";
import { SimulationCAN } from "./simulations/QuantumCAN";
import { Simulation5 } from "./simulations/RegulationNiveau";
import { Simulation2 } from "./simulations/TitrageDirect";
import { SimulationTitrageIndirect } from "./simulations/TitrageIndirect";
import { Simulation3 } from "./simulations/TitragesElectrochimiques";

// ============================================================
//  MENU — modifiez les noms et icônes ici
// ============================================================

const ENERGY_URL = "https://nilsprofgrenoble.github.io/energy-at-school/";

const SIMULATIONS = [
  { id: 1, label: "Avancement d'une réaction", icon: "⚗️", color: "#2a9d8f", component: Simulation1, niveau: "1G" },
  { id: 2, label: "Titrage direct",             icon: "🧪", color: "#e63946", component: Simulation2, niveau: "1G" },
  { id: 25, label: "Titrage en retour", icon: "💊", color: "#be123c", component: SimulationTitrageIndirect, niveau: "1G" },
  { id: 3, label: "Titrages électrochimiques",  icon: "⚡", color: "#e9a824", component: Simulation3, niveau: "BTS" },
  { id: 4, label: "Diagramme de Hansen",         icon: "🔵", color: "#6a4c93", component: Simulation4, niveau: "BTS" },
  { id: 5, label: "Régulation de niveau",        icon: "⚙️", color: "#2a6099", component: Simulation5, niveau: "TSTL" },
  { id: 6, label: "Point de fonctionnement", icon: "📈", color: "#e76f51", component: Simulation6, niveau: "TSTL" },
  { id: 7, label: "Cristallisation", icon: "❄️", color: "#0096c7", component: Simulation7, niveau: "TSTL" },
  { id: 8, label: "Chaîne de mesure", icon: "💡", color: "#f4a261", component: Simulation8, niveau: "TSTL" },
  { id: 9, label: "Étude inter-laboratoire", icon: "📊", color: "#c0392b", component: Simulation9, niveau: "BTS" },
  { id: 10, label: "Beer-Lambert",  icon: "🌈", color: "#1a7abf", component: BeerLambert1G,  niveau: "1G"  },
  { id: 11, label: "Dosage par étalonnage", icon: "📐", color: "#7b2d8b", component: BeerLambertBTS, niveau: "BTS" },
  { id: 12, label: "Simulation CLHP", icon: "💉", color: "#0d6e6e", component: SimulationCLHP, niveau: "BTS" },
  { id: 13, label: "Étalon interne / Normalisation interne", icon: "📐", color: "#c0392b", component: SimulationEtalonnageInterne, niveau: "BTS" },
  { id:14, label:"Séchage d'une peinture", icon:"🎨", color:"#e76f51", component:SimulationPeinture, niveau:"BTS" },
  { id:15, label:"Quantum du CAN", niveau:"TSTL", icon:"📡", color:"#0ea5e9",
    component: SimulationCAN },
  { id:16, label:"Essais d'aptitude", niveau:"BTS", icon:"🎯", color:"#dc2626",
    component: SimulationAptitude },
  { id:17, label:"Circuit hydraulique", niveau:"TSTL", icon:"🚰", color:"#0284c7",
    component: SimulationBernoulli },
];

const NIVEAUX = [
  { label: "1G",   key: "1G",   color: "#2a9d8f" },
  { label: "TSTL", key: "TSTL", color: "#2a6099" },
  { label: "BTS",  key: "BTS",  color: "#6a4c93" },
];

// ============================================================
//  PAGE D'ACCUEIL
// ============================================================

function PageAccueil({ onStart }) {
  const cardA = {
    background: "white",
    borderRadius: 14,
    padding: "20px 24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    border: "1px solid #eee",
  };

  const simulations = [
    { niveau:"1G", color:"#2a9d8f", sims:[
      { icon:"⚗️", label:"Avancement d'une réaction", desc:"Le volume molaire d'un gaz par la réaction du magnésium sur l'acide : tableau d'avancement, réactif limitant. Et un tableau d'avancement pour toute réactions." },
      { icon:"🧪", label:"Titrage direct", desc:"On fait réagir l'espèce à doser avec une solution titrante jusqu'à l'équivalence. Exemple : le diiode du Lugol par le thiosulfate. Et un titrage pour toute réaction." },
      { icon:"💊", label:"Titrage en retour", desc:"On ajoute un excès connu d'un réactif, puis on titre ce qui n'a pas réagi. Exemple : la vitamine C d'une gélule. Et un titrage en retour pour toute réaction." },
      { icon:"🌈", label:"Beer-Lambert", desc:"Schéma animé du spectrophotomètre, spectre UV-visible interactif et courbe d'étalonnage." },
    ]},
    { niveau:"TSTL", color:"#e9a824", sims:[
      { icon:"⚙️", label:"Régulation de niveau", desc:"Régulations TOR, P et PI d'un réservoir avec animations en temps réel." },
      { icon:"📈", label:"Point de fonctionnement", desc:"Caractéristique statique d'un procédé et point de fonctionnement d'une régulation P." },
      { icon:"❄️", label:"Cristallisation", desc:"Cristallisation par refroidissement ou évaporation avec animation du bécher." },
      { icon:"💡", label:"Chaîne de mesure", desc:"Capteur de lumière Arduino — photorésistance, conditionneur, CAN et algorithme de contrôle." },
      { icon:"📡", label:"Quantum du CAN", desc:"Résolution en température d'un CAN : impact de la non-linéarité de la courbe d'étalonnage sur le quantum de mesure." },
      { icon:"🚰", label:"Circuit hydraulique", desc:"Relation de Bernoulli : bilan d'énergie, pertes de charge linéiques et singulières, puissance de la pompe." },
    ]},
    { niveau:"BTS", color:"#6a4c93", sousMenus:[
      { label:"🔬 Analyse", sims:[
        { icon:"⚡", label:"Titrages électrochimiques", desc:"Potentiométrie, ampérométrie — courbes i=f(E) et suivi du titrage." },
        { icon:"📊", label:"Étude inter-laboratoire", desc:"Tests de Cochran et Grubbs, fidélité inter-laboratoires selon les normes ISO." },
        { icon:"📐", label:"Dosage par étalonnage", desc:"Courbe d'étalonnage, résidus, LD/LQ et test de Fisher-Snedecor pour la linéarité." },
        { icon:"💉", label:"Simulation CLHP", desc:"Chromatogrammes en phase inverse — influence du logP, de l'éluant et de la colonne sur la séparation." },
        { icon:"📐", label:"Étalon interne / Normalisation interne", desc:"Exploitation de chromatogrammes par méthode de l'étalon interne ou de la normalisation interne." },
        { icon:"🎯", label:"Essais d'aptitude", desc:"Z-score, moyenne et écart-type inter-laboratoires selon la norme d'essais d'aptitude." },
      ]},
      { label:"🧪 Formulation", sims:[
        { icon:"🔵", label:"Diagramme de Hansen", desc:"Sphère de Hansen, solubilité des polymères, optimisation de mélanges de solvants." },
        { icon:"🎨", label:"Séchage d'une peinture", desc:"CPV, CPVC, extrait sec et animation du séchage d'un film de peinture." },
      ]},
    ]},
  ];

  return (
    <div style={{display:"flex", flexDirection:"column", gap:24,
      fontFamily:"Inter, system-ui, Arial", maxWidth:900, margin:"0 auto"}}>

      {/* Hero */}
      <div style={{...cardA, background:"linear-gradient(135deg, #2a9d8f15, #e9a82415)",
        borderColor:"#2a9d8f33", textAlign:"center", padding:"32px 24px"}}>
        <div style={{fontSize:48, marginBottom:20}}>⚗️🧪🔬</div>
        <h2 style={{fontSize:24, fontWeight:700, color:"#222", margin:"0 0 12px"}}>
          Labo Chimie & Physique
        </h2>
        <p style={{fontSize:15, color:"#555", lineHeight:1.7, maxWidth:600, margin:"0 auto 20px"}}>
          Simulations interactives pour les niveaux 1G spé PC, TSTL et BTS Métiers de la Chimie.
        </p>
        <button onClick={()=>onStart(1)} style={{
          padding:"10px 28px", borderRadius:8, border:"none",
          background:"#2a9d8f", color:"white", fontSize:15,
          fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px #2a9d8f44"
        }}>
          Explorer les simulations →
        </button>
      </div>

      {/* Lien vers le site Energy@School */}
      <a href={ENERGY_URL} style={{...cardA, display:"flex", alignItems:"center", gap:16, textDecoration:"none",
        borderColor:"#ea580c55", background:"linear-gradient(135deg, #ea580c12, #16a34a12)"}}>
        <div style={{fontSize:36}}>⚡</div>
        <div style={{flex:1, textAlign:"left"}}>
          <div style={{fontSize:16, fontWeight:800, color:"#222"}}>Energy@School a désormais son propre site</div>
          <div style={{fontSize:13.5, color:"#555", lineHeight:1.5}}>Production, transport, stockage de l'énergie et hydrogène :
            les simulations pour préparer la journée à Grenoble INP – Ense³.</div>
        </div>
        <div style={{fontSize:20, color:"#ea580c", fontWeight:800}}>→</div>
      </a>

      {/* Simulations par niveau */}
      {simulations.map(({niveau, color, sims, sousMenus}) => (
        <div key={niveau}>
          {/* En-tête niveau */}
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
            <div style={{height:3, width:28, borderRadius:2, background:color}}/>
            <span style={{fontSize:13, fontWeight:700, color, textTransform:"uppercase",
              letterSpacing:"0.1em"}}>{`Niveau ${niveau}`}</span>
            <div style={{flex:1, height:1, background:"#eee"}}/>
          </div>

          {/* Cas normal : pas de sous-menu */}
          {sims && (
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12}}>
              {sims.map(({icon, label, desc}) => {
                const sim=SIMULATIONS.find(s=>s.label===label);
                return (
                  <div key={label} onClick={()=>sim&&onStart(sim.id)}
                    style={{...cardA, borderLeft:`3px solid ${color}`,
                      transition:"transform 0.15s, box-shadow 0.15s",
                      cursor:sim?"pointer":"default"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.07)";}}>
                    <div style={{fontSize:24, marginBottom:6}}>{icon}</div>
                    <div style={{fontWeight:700, fontSize:14, color:"#222", marginBottom:4}}>{label}</div>
                    <div style={{fontSize:12, color:"#777", lineHeight:1.6}}>{desc}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cas avec sous-menus (BTS) */}
          {sousMenus && sousMenus.map(({label:sLabel, sims:sSims})=>(
            <div key={sLabel} style={{marginBottom:16}}>
              {/* En-tête sous-menu */}
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                <div style={{height:2, width:18, borderRadius:2, background:color, opacity:0.5}}/>
                <span style={{fontSize:12, fontWeight:700, color,
                  background:color+'18', padding:"3px 12px",
                  borderRadius:20, border:`1px solid ${color}44`}}>
                  {sLabel}
                </span>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12, paddingLeft:8}}>
                {sSims.map(({icon, label, desc}) => {
                  const sim=SIMULATIONS.find(s=>s.label===label);
                  return (
                    <div key={label} onClick={()=>sim&&onStart(sim.id)}
                      style={{...cardA, borderLeft:`3px solid ${color}`,
                        transition:"transform 0.15s, box-shadow 0.15s",
                        cursor:sim?"pointer":"default"}}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.07)";}}>
                      <div style={{fontSize:24, marginBottom:6}}>{icon}</div>
                      <div style={{fontWeight:700, fontSize:14, color:"#222", marginBottom:4}}>{label}</div>
                      <div style={{fontSize:12, color:"#777", lineHeight:1.6}}>{desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Sources */}
      <div style={{...cardA, background:"#f8f8f8", borderColor:"#e0e0e0"}}>
        <div style={{fontWeight:700, fontSize:15, color:"#333", marginBottom:14}}>📚 Sources & inspirations</div>
        <div style={{display:"flex", flexDirection:"column", gap:12, fontSize:13, color:"#555", lineHeight:1.7}}>
          <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
            <span style={{fontSize:20, flexShrink:0}}>🎨</span>
            <div><strong style={{color:"#333"}}>Marc-Olivier REULA</strong> — Enseignant en BTS Métiers de la Chimie à l'ENCPB (Paris). Source d'inspiration pour la conception de ce site.</div>
          </div>
          <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
            <span style={{fontSize:20, flexShrink:0}}>⚡</span>
            <div><strong style={{color:"#333"}}>Jean LAMERENX</strong> — Enseignant en CPGE au lycée Louis-le-Grand (Paris). Les courbes i=f(E) ont été codées initialement en Python et partagées lors des JIREC 2024.</div>
          </div>
          <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
            <span style={{fontSize:20, flexShrink:0}}>💻</span>
            <div><strong style={{color:"#333"}}>Xavier BATAILLE</strong> — Enseignant en BTS Métiers de la Chimie à l'ENCPB (Paris). Le modèle de simulation CLHP en phase inverse est issu de ses travaux publiés sur RNChimie (2008).</div>
          </div>
          <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
            <span style={{fontSize:20, flexShrink:0}}>🤖</span>
            <div><strong style={{color:"#333"}}>Claude (Anthropic)</strong> — L'ensemble des simulations a été développé par itérations successives en collaboration avec Claude, assistant IA d'Anthropic.</div>
          </div>
        </div>
      </div>

      <div style={{textAlign:"center", fontSize:12, color:"#aaa", paddingBottom:16}}>
        Labo Chimie & Physique — Simulations interactives pédagogiques
      </div>
    </div>
  );
}

// ============================================================
//  COMPOSANT PRINCIPAL
// ============================================================
export default function App() {
  const getInitialId = () => {
    const params = new URLSearchParams(window.location.search);
    const simParam = params.get('sim');
    if (simParam) {
      const id = parseInt(simParam);
      if (SIMULATIONS.find(s => s.id === id)) return id;
      const ancien = { 18: 'hydrogene', 19: 'production-1', 20: 'production-2', 21: 'production-3', 22: 'transport', 23: 'stockage', 24: '' };
      if (id in ancien) window.location.replace(ancien[id] ? `${ENERGY_URL}?atelier=${ancien[id]}` : ENERGY_URL);
    }
    return 0;
  };

  const [activeId, setActiveId] = useState(getInitialId);
  const active = SIMULATIONS.find(s => s.id === activeId) || SIMULATIONS[0];
  const ActiveComponent = active.component;
  const [expanded, setExpanded] = useState({ "1G": true, "TSTL": true, "BTS": true });
  // Sous-groupes du menu BTS (Analyse, Formulation) : un seul état pour tous,
  // déclaré ici car React interdit un useState dans une boucle ou une condition.
  const [sgOuverts, setSgOuverts] = useState({});
  const [plotlyReady, setPlotlyReady] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [menuOpen, setMenuOpen] = useState(false); // fermé par défaut

  useEffect(() => {
    const check = setInterval(() => {
      if (window.Plotly) { setPlotlyReady(true); clearInterval(check); }
    }, 100);
    return () => clearInterval(check);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeId === 0) url.searchParams.delete('sim');
    else url.searchParams.set('sim', activeId);
    window.history.replaceState(null, '', url.toString());
  }, [activeId]);

  function partager() {
    const url = new URL(window.location.href);
    if (activeId > 0) url.searchParams.set('sim', activeId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopyMsg('Lien copié !');
      setTimeout(() => setCopyMsg(''), 2000);
    });
  }

  // Ferme le menu et navigue
  function naviguer(id) {
    setActiveId(id);
    setMenuOpen(false);
  }

  const sidebarW = menuOpen ? 230 : 0;

  return (
    <div style={styles.root}>
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      {/* Overlay sombre quand menu ouvert */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.18)',
            zIndex:9, transition:'opacity 0.2s' }}/>
      )}

      {/* Sidebar — glisse depuis la gauche */}
      <aside style={{
        ...styles.sidebar,
        width: 230,
        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 10, overflowY: 'auto',
      }}>
        {/* Bouton fermer dans le menu */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
          <button onClick={() => setMenuOpen(false)}
            style={{ background:'none', border:'none', fontSize:22,
              cursor:'pointer', color:'#888', padding:'0 4px' }}>✕</button>
        </div>

        <div style={styles.sidebarHeader}>
          <div style={{ fontSize: "2.2rem" }}>⚛️</div>
          <div>
            <div style={styles.siteTitle}>Labo Chimie (et un peu Physique!)</div>
            <div style={styles.siteSub}>Simulations interactives</div>
            <div style={{fontSize:"0.72rem", color:"#aaa", fontStyle:"italic",
              fontFamily:"'Outfit', sans-serif"}}>
              par Nils ARONSSOHN, enseignant au lycée Argouges de Grenoble
            </div>
          </div>
        </div>
        <div style={styles.divider} />

        <button onClick={() => naviguer(0)} style={{
          ...styles.navBtn,
          background: activeId === 0 ? "#2a9d8f" : "transparent",
          color: activeId === 0 ? "#fff" : "#444",
          boxShadow: activeId === 0 ? "0 4px 18px #2a9d8f55" : "none",
          transform: activeId === 0 ? "translateX(4px)" : "translateX(0)",
          marginBottom: 8,
        }}>
          <span style={{ fontSize: "1.3rem" }}>🏠</span>
          <span style={{ flex: 1 }}>Accueil</span>
          {activeId === 0 && <span style={{ fontSize: "1.4rem", opacity: 0.8 }}>›</span>}
        </button>
        <div style={styles.divider}/>

        <nav style={styles.nav}>
          {NIVEAUX.map(niv => {
            const simsNiv = SIMULATIONS.filter(s => s.niveau === niv.key);
            const isExpanded = expanded[niv.key];
            const sousgroupes = niv.key === 'BTS' ? [
              { label:'🔬 Analyse', ids:[3,9,11,12,13,16] },
              { label:'🧪 Formulation', ids:[4,14] },
            ] : null;

            return (
              <div key={niv.key}>
                <button onClick={() => setExpanded(prev => ({...prev, [niv.key]: !prev[niv.key]}))}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    width:"100%", padding:"0.5rem 0.75rem", border:"none",
                    background:"transparent", cursor:"pointer",
                    borderRadius:"8px", marginBottom:"0.2rem" }}>
                  <span style={{ fontSize:"0.72rem", fontWeight:"800", letterSpacing:"0.1em",
                    textTransform:"uppercase", color: niv.color }}>{niv.label}</span>
                  <span style={{ fontSize:"0.8rem", color:niv.color, transition:"transform 0.2s",
                    display:"inline-block",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                </button>

                {isExpanded && !sousgroupes && simsNiv.map(sim => {
                  const isActive = sim.id === activeId;
                  return (
                    <button key={sim.id} onClick={() => naviguer(sim.id)} style={{
                      ...styles.navBtn, marginLeft:"0.5rem",
                      background: isActive ? sim.color : "transparent",
                      color: isActive ? "#fff" : "#444",
                      boxShadow: isActive ? `0 4px 18px ${sim.color}55` : "none",
                      transform: isActive ? "translateX(4px)" : "translateX(0)",
                      fontSize:"0.85rem",
                    }}>
                      <span style={{fontSize:"1.1rem"}}>{sim.icon}</span>
                      <span style={{flex:1}}>{sim.label}</span>
                      {isActive && <span style={{fontSize:"1.2rem", opacity:0.8}}>›</span>}
                    </button>
                  );
                })}

                {isExpanded && sousgroupes && sousgroupes.map(({label, ids}) => {
                  const sgExpanded = sgOuverts[label] ?? true;
                  const setSgExpanded = f => setSgOuverts(prev => ({ ...prev, [label]: f(prev[label] ?? true) }));
                  const sgSims = simsNiv.filter(s => ids.includes(s.id));
                  return (
                    <div key={label}>
                      <button onClick={() => setSgExpanded(v => !v)}
                        style={{ display:"flex", alignItems:"center", gap:6,
                          width:"100%", padding:"0.3rem 0.75rem", border:"none",
                          background:"transparent", cursor:"pointer", marginLeft:"0.25rem" }}>
                        <span style={{ fontSize:"0.68rem", fontWeight:"700", color:niv.color,
                          opacity:0.8, letterSpacing:"0.05em" }}>{label}</span>
                        <span style={{ fontSize:"0.7rem", color:niv.color, opacity:0.6,
                          transform: sgExpanded ? "rotate(90deg)" : "rotate(0deg)",
                          transition:"transform 0.2s", display:"inline-block" }}>›</span>
                      </button>
                      {sgExpanded && sgSims.map(sim => {
                        const isActive = sim.id === activeId;
                        return (
                          <button key={sim.id} onClick={() => naviguer(sim.id)} style={{
                            ...styles.navBtn, marginLeft:"1rem",
                            background: isActive ? sim.color : "transparent",
                            color: isActive ? "#fff" : "#444",
                            boxShadow: isActive ? `0 4px 18px ${sim.color}55` : "none",
                            transform: isActive ? "translateX(4px)" : "translateX(0)",
                            fontSize:"0.8rem",
                          }}>
                            <span style={{fontSize:"1rem"}}>{sim.icon}</span>
                            <span style={{flex:1}}>{sim.label}</span>
                            {isActive && <span style={{fontSize:"1.1rem", opacity:0.8}}>›</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                <div style={{ height:"1px",
                  background:"linear-gradient(to right, #e0e0e0, transparent)",
                  margin:"0.5rem 0" }}/>
              </div>
            );
          })}
          <a href={ENERGY_URL} style={{ display: "block", margin: "14px 10px 4px", padding: "9px 12px", borderRadius: 8,
            border: "1.5px solid #ea580c", color: "#ea580c", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            ⚡ Energy@School ↗
          </a>
        </nav>

        <div style={{paddingTop:"1rem"}}>
          <div style={{ height:"1px",
            background:"linear-gradient(to right, #e0e0e0, transparent)",
            marginBottom:"0.75rem" }}/>
          <a href="mailto:nils.aronssohn@ac-grenoble.fr"
            style={{ display:"flex", alignItems:"center", gap:"0.5rem",
              fontSize:"0.85rem", color:"#888", textDecoration:"none",
              padding:"0.6rem 1rem", borderRadius:"12px", transition:"all 0.2s",
              fontWeight:"600", fontFamily:"'Nunito', sans-serif" }}
            onMouseEnter={e=>{e.currentTarget.style.color="#e63946";e.currentTarget.style.background="#fff0f0"}}
            onMouseLeave={e=>{e.currentTarget.style.color="#888";e.currentTarget.style.background="transparent"}}>
            ✉️ Contact
          </a>
        </div>
        <div style={styles.sidebarFooter}/>
      </aside>

      {/* Zone principale — pleine largeur */}
      <main style={{ ...styles.main, marginLeft: 0 }}>
        {/* Barre du haut */}
        <div style={{
          ...styles.topBar,
          background: activeId === 0
            ? "linear-gradient(135deg, #2a9d8f22, #2a9d8f08)"
            : `linear-gradient(135deg, ${active.color}22, ${active.color}08)`,
          borderBottom: `3px solid ${activeId === 0 ? "#2a9d8f" : active.color}`,
        }}>
          {/* Bouton hamburger */}
          <button onClick={() => setMenuOpen(v => !v)}
            style={{ background:'none', border:'none', fontSize:22,
              cursor:'pointer', color:'#555', padding:'4px 8px',
              borderRadius:8, flexShrink:0,
              lineHeight:1 }}>
            ☰
          </button>

          <span style={{ fontSize: "2rem" }}>{activeId === 0 ? "🏠" : active.icon}</span>
          <h1 style={{ ...styles.pageTitle,
            color: activeId === 0 ? "#2a9d8f" : active.color, flex: 1 }}>
            <span style={{ fontFamily:"'Outfit', sans-serif",
              fontWeight:800, letterSpacing:"-0.5px" }}>
              {activeId === 0 ? "Bienvenue !" : active.label}
            </span>
          </h1>

          {activeId > 0 && (
            <button onClick={partager} style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"6px 14px", borderRadius:8, border:"none",
              background: copyMsg ? "#2a9d8f" : "#f0f0f0",
              color: copyMsg ? "white" : "#555",
              fontSize:13, fontWeight:600, cursor:"pointer",
              transition:"all 0.2s", fontFamily:"'Nunito', sans-serif",
              whiteSpace:"nowrap",
            }}>
              {copyMsg ? '✓ ' + copyMsg : '🔗 Partager'}
            </button>
          )}
        </div>

        <div style={styles.simContainer}>
          {activeId === 0
            ? <PageAccueil onStart={(id) => setActiveId(id || 1)} />
            : <div style={{ textAlign: "left" }}>
                {/* Le fichier App.css du modèle Vite centre tout le texte (#root) : on rétablit l'alignement
                    à gauche pour les simulations ; la page d'accueil garde sa mise en page centrée. */}
                <BandeauContexte key={`b${activeId}`} id={activeId} contexte={CONTEXTES[activeId]} couleur={active.color} />
                <ActiveComponent key={activeId} plotlyReady={plotlyReady} />
              </div>}
        </div>
        <div style={{ textAlign: "center", fontSize: "0.78rem", color: "#94a3b8",
          padding: "18px 12px 8px", borderTop: "1px solid #e2e8f0", marginTop: 24 }}>
          © {new Date().getFullYear()} Nils Aronssohn — Lycée Argouges, Grenoble ·
          {" "}
          <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr" target="_blank"
            rel="noopener noreferrer" style={{ color: "inherit" }}>
            CC BY-NC-ND 4.0
          </a>
          {" "}· libre d'accès, reproduction et modification non autorisées
        </div>
      </main>
    </div>
  );
}

const styles = {
  root: { display:"flex", minHeight:"100vh",
    fontFamily:"'Nunito', 'Segoe UI', sans-serif",
    background:"#f5f7fa", position:"relative", overflow:"hidden" },
  bgBlob1: { position:"fixed", top:"-120px", right:"-120px", width:"400px", height:"400px",
    borderRadius:"50%",
    background:"radial-gradient(circle, #e6394622 0%, transparent 70%)",
    pointerEvents:"none", zIndex:0 },
  bgBlob2: { position:"fixed", bottom:"-100px", left:"200px", width:"350px", height:"350px",
    borderRadius:"50%",
    background:"radial-gradient(circle, #2a9d8f22 0%, transparent 70%)",
    pointerEvents:"none", zIndex:0 },
  sidebar: { width:230, minHeight:"100vh", background:"#ffffff",
    boxShadow:"4px 0 24px rgba(0,0,0,0.12)",
    display:"flex", flexDirection:"column",
    padding:"1rem 1rem 1.5rem", flexShrink:0 },
  sidebarHeader: { display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1rem" },
  siteTitle: { fontFamily:"'Outfit', sans-serif", fontSize:"1.05rem",
    fontWeight:"800", color:"#222", lineHeight:1.2, letterSpacing:"-0.3px" },
  siteSub: { fontSize:"0.68rem", color:"#999",
    textTransform:"uppercase", letterSpacing:"0.08em" },
  divider: { height:"1px",
    background:"linear-gradient(to right, #e0e0e0, transparent)",
    margin:"0.5rem 0 1rem" },
  nav: { display:"flex", flexDirection:"column", gap:"0.5rem", flex:1 },
  navBtn: { display:"flex", alignItems:"center", gap:"0.7rem",
    padding:"0.75rem 1rem", borderRadius:"12px", border:"none",
    cursor:"pointer", fontSize:"0.9rem", fontWeight:"600",
    fontFamily:"'Nunito', sans-serif", transition:"all 0.2s ease",
    textAlign:"left", width:"100%" },
  sidebarFooter: { marginTop:"auto", paddingTop:"1rem", textAlign:"center" },
  main: { flex:1, display:"flex", flexDirection:"column",
    position:"relative", zIndex:1, minWidth:0 },
  topBar: { display:"flex", alignItems:"center", gap:"1rem", padding:"1.25rem 2rem" },
  pageTitle: { fontFamily:"'Playfair Display', Georgia, serif",
    fontSize:"1.5rem", fontWeight:"700", margin:0 },
  simContainer: { flex:1, padding:"1.5rem 2rem", overflowY:"auto" },
};


