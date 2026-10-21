import { useState, useEffect } from "react";
import { compter } from "./stats";
import { SimulationAptitude } from "./simulations/Aptitude";
import { Simulation1 } from "./simulations/Avancement";
import { SimulationDosageEtalonnage } from "./simulations/DosageEtalonnage";
import { BeerLambert1G } from "./simulations/BeerLambert1G";
import { SimulationBernoulli } from "./simulations/Bernoulli";
import { BandeauContexte } from "./commun";
import { CONTEXTES } from "./contextes";
import { SimulationCLHP } from "./simulations/CLHP";
import { SimulationCPG } from "./simulations/CPG";
import { SimulationCPGSM } from "./simulations/CPGSM";
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
import { SimulationIEpH } from "./simulations/IEpH";
import { Simulation3 } from "./simulations/TitragesElectrochimiques";
import { SimulationStatiqueFluides } from "./simulations/StatiqueFluides";
import { SimulationDebits } from "./simulations/DebitsFluides";
import { SimulationVitesseDebit } from "./simulations/VitesseDebit";
import { SimulationEchangeur } from "./simulations/Echangeur";
import { SimulationParoi } from "./simulations/Paroi";
import { SimulationBouilloire } from "./simulations/Bouilloire";
import { SimulationReponse } from "./simulations/Reponse";
import { SimulationDistillation } from "./simulations/Distillation";
import { SimulationDiagramme } from "./simulations/DiagrammeBinaire";
import { SimulationRefractometre } from "./simulations/Refractometre";
import { SimulationMoteurPasAPas } from "./simulations/MoteurPasAPas";
import { SimulationMoteurCode } from "./simulations/MoteurCode";
import { SimulationBoussole } from "./simulations/Boussole";
import { SimulationChampForce } from "./simulations/ChampForce";
import { SimulationDeuxCorps } from "./simulations/DeuxCorps";
import { SimulationCondensateurMillikan } from "./simulations/CondensateurMillikan";
import { SimulationElectrisation } from "./simulations/Electrisation";
import { SimulationMouvementSysteme } from "./simulations/MouvementSysteme";
import { SimulationMouvementReferentiel } from "./simulations/MouvementReferentiel";
import { SimulationAtomesMolecules } from "./simulations/AtomesMolecules";
import { SimulationFamillesChimiques } from "./simulations/FamillesChimiques";
import { SimulationForcesVecteurs } from "./simulations/ForcesVecteurs";
import { SimulationPrincipeInertie } from "./simulations/PrincipeInertie";
import { SimulationDissolution } from "./simulations/Dissolution";
import { SimulationDilution } from "./simulations/Dilution";
import { SimulationMelanges } from "./simulations/Melanges";
import { SimulationRefraction } from "./simulations/Refraction";
import { SimulationLentille } from "./simulations/Lentille";
import { SimulationSpectres } from "./simulations/Spectres";
import { SimulationCircuits } from "./simulations/Circuits";
import { SimulationLoiOhm } from "./simulations/LoiOhm";
import { SimulationDebitCharges } from "./simulations/DebitCharges";
import { SimulationPuissanceJoule } from "./simulations/PuissanceJoule";
import { SimulationCaracPile } from "./simulations/CaracPile";
import { SimulationISS } from "./simulations/ISS";
import { SimulationSolubilite } from "./simulations/Solubilite";
import { SimulationAPropos } from "./simulations/APropos";
import { SimulationAtelierDonnees } from "./simulations/AtelierDonnees";
import { SimulationAtelierGraphique } from "./simulations/AtelierGraphique";
import { SimulationAtelierRealiser } from "./simulations/AtelierRealiser";
import { SimulationAtelierAnalyser } from "./simulations/AtelierAnalyser";
import { SimulationEntrainement } from "./simulations/Entrainement";
import { SimulationCompte } from "./simulations/Compte";
import { ToastRecompense } from "./ToastRecompense";
import { SimulationSuiviProf } from "./simulations/SuiviProf";
import { useSession, restaurer, estEleve, estProf } from "./serveur";
import { chapitresDuNiveau } from "./chapitres";
import { SuiviTemps, nomsSim } from "./suivi";
import { ModeParDefaut } from "./ModeParDefaut";
import { ProchaineEtape } from "./ProchaineEtape";
import { EnTete } from "./EnTete";
import { PiedDePage } from "./PiedDePage";
import { AccueilSite } from "./AccueilSite";
import { DESCRIPTIONS } from "./descriptions";

// ============================================================
//  MENU — modifiez les noms et icônes ici
// ============================================================

const ENERGY_URL = "https://nilsprofgrenoble.github.io/energy-at-school/";

const SIMULATIONS = [
  { id: 1, label: "Avancement d'une réaction", icon: "⚗️", color: "#2a9d8f", component: Simulation1, niveau: "1G" },
  { id: 2, label: "Titrage direct",             icon: "🧪", color: "#e63946", component: Simulation2, niveau: "1G" },
  { id: 25, label: "Titrage en retour", icon: "💊", color: "#be123c", component: SimulationTitrageIndirect, niveau: "1G" },
  { id: 3, label: "Titrages électrochimiques",  icon: "⚡", color: "#e9a824", component: Simulation3, niveau: "BTS" },
  { id: 4, label: "Paramètres de solubilité de Hansen",         icon: "🔵", color: "#6a4c93", component: Simulation4, niveau: "BTS" },
  { id: 5, label: "Régulation TOR, P et PI",        icon: "⚙️", color: "#2a6099", component: Simulation5, niveau: "TSTL" },
  { id: 6, label: "Point de fonctionnement d'une régulation P", icon: "📈", color: "#e76f51", component: Simulation6, niveau: "TSTL" },
  { id: 7, label: "Évaporation et cristallisation", icon: "❄️", color: "#0096c7", component: Simulation7, niveau: "TSTL" },
  { id: 8, label: "Chaîne de mesure", icon: "💡", color: "#f4a261", component: Simulation8, niveau: "TSTL" },
  { id: 9, label: "Fidélité d'une méthode : étude interlaboratoire", icon: "📊", color: "#c0392b", component: Simulation9, niveau: "BTS" },
  { id: 10, label: "Beer-Lambert",  icon: "🌈", color: "#1a7abf", component: BeerLambert1G,  niveau: "1G"  },
  { id: 11, label: "Dosage par étalonnage", icon: "📐", color: "#7b2d8b", component: SimulationDosageEtalonnage, niveau: "BTS" },
  { id: 12, label: "Simulation CLHP", icon: "💉", color: "#0d6e6e", component: SimulationCLHP, niveau: "BTS" },
  { id: 54, label: "Simulation CPG", icon: "🔥", color: "#0f766e", component: SimulationCPG, niveau: "BTS" },
  { id: 55, label: "CPG couplée à la spectrométrie de masse", icon: "🧲", color: "#6d28d9", component: SimulationCPGSM, niveau: "BTS" },
  { id: 13, label: "Étalon interne / Normalisation interne", icon: "📐", color: "#c0392b", component: SimulationEtalonnageInterne, niveau: "BTS" },
  { id:14, label:"Peinture à l'eau", icon:"🎨", color:"#e76f51", component:SimulationPeinture, niveau:"BTS" },
  { id:15, label:"Quantum du CAN", niveau:"TSTL", icon:"📡", color:"#0ea5e9",
    component: SimulationCAN },
  { id:16, label:"Essais d'aptitude : comparaison interlaboratoire", niveau:"BTS", icon:"🎯", color:"#dc2626",
    component: SimulationAptitude },
  { id:17, label:"Circuit hydraulique", niveau:"TSTL", icon:"🚰", color:"#0284c7",
    component: SimulationBernoulli },
  { id:26, label:"Statique des fluides", niveau:"TSTL", icon:"🌊", color:"#0369a1",
    component: SimulationStatiqueFluides },
  { id:27, label:"Débits massique et volumique", niveau:"TSTL", icon:"⚖️", color:"#0e7490",
    component: SimulationDebits },
  { id:28, label:"Débit et vitesse d'écoulement", niveau:"TSTL", icon:"💦", color:"#0f766e",
    component: SimulationVitesseDebit },
  { id:29, label:"Courbes i-E et diagramme E-pH", niveau:"BTS", icon:"🧊", color:"#e9a824",
    component: SimulationIEpH },
  { id:30, label:"Échangeur thermique : co-courant et contre-courant", niveau:"TSTL", icon:"🔥", color:"#dc2626",
    component: SimulationEchangeur },
  { id:31, label:"Paroi multicouche : résistance thermique", niveau:"TSTL", icon:"🧱", color:"#b45309",
    component: SimulationParoi },
  { id:32, label:"Bouilloire : conductivité thermique de sa paroi", niveau:"TSTL", icon:"🫖", color:"#be123c",
    component: SimulationBouilloire },
  { id:33, label:"Temps de réponse d'un capteur", niveau:"TSTL", icon:"⏱️", color:"#0891b2",
    component: SimulationReponse },
  { id:41, label:"Distillation simple et fractionnée", niveau:"TSTL", icon:"🧪", color:"#0f766e",
    component: SimulationDistillation },
  { id:42, label:"Diagramme binaire isobare", niveau:"TSTL", icon:"📉", color:"#0e7490",
    component: SimulationDiagramme },
  { id:43, label:"Réfractomètre : indice et composition", niveau:"TSTL", icon:"🔬", color:"#6d28d9",
    component: SimulationRefractometre },
  { id:44, label:"Moteur pas à pas : du stator à l'axe", niveau:"TSTL", icon:"🧲", color:"#b45309",
    component: SimulationMoteurPasAPas },
  { id:45, label:"Piloter le moteur avec le code", niveau:"TSTL", icon:"💻", color:"#b45309",
    component: SimulationMoteurCode },
  { id:46, label:"Boussole et champ magnétique", niveau:"TSTL", icon:"🧭", color:"#b45309",
    component: SimulationBoussole },
  { id:48, label:"Champ et force : gravitation et électrostatique", niveau:"1G", icon:"🌍", color:"#3f6212",
    component: SimulationChampForce },
  { id:49, label:"Deux corps en interaction : gravitation et Coulomb", niveau:"1G", icon:"🌙", color:"#3f6212",
    component: SimulationDeuxCorps },
  { id:50, label:"Condensateur plan et gouttelette de Millikan", niveau:"1G", icon:"⚡", color:"#3f6212",
    component: SimulationCondensateurMillikan },
  { id:51, label:"Électrisation et influence électrostatique", niveau:"1G", icon:"🧤", color:"#3f6212",
    component: SimulationElectrisation },
  { id:52, label:"Mouvement d'un système : variation de vitesse et forces", niveau:"1G", icon:"🚀", color:"#3f6212",
    component: SimulationMouvementSysteme },
  { id:56, label:"Référentiel et mouvement : décrire un mouvement", niveau:"2GT", icon:"🚃", color:"#4338ca",
    component: SimulationMouvementReferentiel },
  { id:57, label:"Atomes, ions et molécules : la quête de l’octet", niveau:"2GT", icon:"⚛️", color:"#16a34a",
    component: SimulationAtomesMolecules },
  { id:58, label:"Familles chimiques : même colonne, mêmes comportements", niveau:"2GT", icon:"🧩", color:"#b45309",
    component: SimulationFamillesChimiques },
  { id:59, label:"Les forces : modéliser une action mécanique", niveau:"2GT", icon:"➡️", color:"#0f766e",
    component: SimulationForcesVecteurs },
  { id:60, label:"Principe d’inertie : forces et mouvement", niveau:"2GT", icon:"⚖️", color:"#7c3aed",
    component: SimulationPrincipeInertie },
  { id:61, label:"Dissolution et concentration en masse", niveau:"2GT", icon:"🧂", color:"#0f766e",
    component: SimulationDissolution },
  { id:62, label:"Dilution et échelle de teintes", niveau:"2GT", icon:"💧", color:"#7b2d8e",
    component: SimulationDilution },
  { id:63, label:"Mélanges : miscibilité, solubilité et densité", niveau:"2GT", icon:"🧴", color:"#b45309",
    component: SimulationMelanges },
  { id:64, label:"Réfraction de la lumière : lois de Snell-Descartes", niveau:"2GT", icon:"🔦", color:"#0369a1",
    component: SimulationRefraction },
  { id:65, label:"Lentille convergente : trajet de la lumière et foyer", niveau:"2GT", icon:"🔍", color:"#0e7490",
    component: SimulationLentille },
  { id:66, label:"Spectres d’émission : corps chauds et lampes à décharge", niveau:"2GT", icon:"🌈", color:"#b45309",
    component: SimulationSpectres },
  { id:67, label:"L’ISS en chute libre : pourquoi les astronautes flottent", niveau:"2GT", icon:"🛰️", color:"#4338ca",
    component: SimulationISS },
  { id:68, label:"Circuits électriques : intensité et tension", niveau:"2GT", icon:"🔌", color:"#1d4ed8",
    component: SimulationCircuits },
  { id:69, label:"Loi d’Ohm, caractéristique et capteur résistif", niveau:"2GT", icon:"🌡️", color:"#0369a1",
    component: SimulationLoiOhm },
  { id:70, label:"Courant électrique et débit de charges", niveau:"1G", icon:"⚡", color:"#0369a1",
    component: SimulationDebitCharges },
  { id:71, label:"Puissance, effet Joule et rendement", niveau:"1G", icon:"🔥", color:"#c2410c",
    component: SimulationPuissanceJoule },
  { id:72, label:"Caractéristique d’une pile : source réelle de tension", niveau:"1G", icon:"🔋", color:"#15803d",
    component: SimulationCaracPile },
  { id:53, label:"Solubilité et miscibilité : le bilan des interactions", niveau:"1G", icon:"🧪", color:"#2a9d8f",
    component: SimulationSolubilite },
  { id:34, label:"S'APP : extraire les données d'un énoncé", niveau:"COMP", icon:"🎯", color:"#e11d48",
    component: SimulationAtelierDonnees },
  { id:35, label:"S'APP : lire un graphique", niveau:"COMP", icon:"📈", color:"#e11d48",
    component: SimulationAtelierGraphique },
  { id:36, label:"REA : réaliser un calcul", niveau:"COMP", icon:"🧮", color:"#e11d48",
    component: SimulationAtelierRealiser },
  { id:37, label:"ANA : analyser un problème", niveau:"COMP", icon:"🧭", color:"#e11d48",
    component: SimulationAtelierAnalyser },
  { id:38, label:"Je m'entraîne ! Travail par compétence", niveau:"COMP", icon:"🏋️", color:"#e11d48",
    component: SimulationEntrainement },
  // Pages hors menu (niveau « COMPTE ») : connexion et suivi, ouvertes par les boutons « Mon compte » et « Suivi professeur »
  { id:39, label:"Mon compte", niveau:"COMPTE", icon:"👧👦", color:"#25628f", component: SimulationCompte },
  { id:40, label:"Suivi professeur", niveau:"COMPTE", icon:"📊", color:"#25628f", component: SimulationSuiviProf },
  // Page hors menu : à propos et contact (ouverte depuis le bas du menu et le pied de page)
  { id:47, label:"À propos et contact", niveau:"COMPTE", icon:"ℹ️", color:"#475569", component: SimulationAPropos },
];
SIMULATIONS.forEach(s => { nomsSim[s.id] = s.label; });

// Menus de l'en-tête, de gauche à droite (les simulations de chaque niveau viennent de src/chapitres.js)
const MENUS_ENTETE = [
  { key: "2GT", label: "2GT" },
  { key: "1G", label: "1G" },
  { key: "TSTL", label: "TSTL" },
  { key: "BTS", label: "BTS MDC" },
  { key: "COMP", label: "Travail par compétence" },
];
const ORDRE_COMP = [38, 34, 35, 37, 36];
function construireMenus() {
  const fiche = s => ({ id: s.id, icon: s.icon, label: s.label, desc: DESCRIPTIONS[s.label] });
  return MENUS_ENTETE.map(m => {
    if (m.key === "COMP") {
      const sims = SIMULATIONS.filter(s => s.niveau === "COMP").sort((a, b) => ORDRE_COMP.indexOf(a.id) - ORDRE_COMP.indexOf(b.id)).map(fiche);
      return { ...m, groupes: [{ sims }] };
    }
    const groupes = chapitresDuNiveau(m.key).map(c => ({ label: c.label, sims: c.sims.map(id => SIMULATIONS.find(s => s.id === id)).filter(Boolean).map(fiche) }));
    return { ...m, groupes };
  });
}
const MENUS = construireMenus();


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
  const sessionSb = useSession();
  useEffect(() => { restaurer(); }, []);
  // Un professeur connecté n'a pas d'écran « Mon compte » intermédiaire : on l'emmène directement au suivi
  const idAffiche = activeId === 39 && sessionSb?.profil?.role === 'prof' ? 40 : activeId;
  const active = SIMULATIONS.find(s => s.id === idAffiche) || SIMULATIONS[0];
  const ActiveComponent = active.component;
  const [plotlyReady, setPlotlyReady] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  useEffect(() => {
    const check = setInterval(() => {
      if (window.Plotly) { setPlotlyReady(true); clearInterval(check); }
    }, 100);
    return () => clearInterval(check);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const url = new URL(window.location.href);
    if (activeId === 0) url.searchParams.delete('sim');
    else url.searchParams.set('sim', activeId);
    window.history.replaceState(null, '', url.toString());
    // statistiques anonymes : une consultation par simulation (voir stats.js)
    const s = SIMULATIONS.find(x => x.id === activeId);
    compter(activeId === 0 ? '/' : `/sim/${activeId}`, s ? s.label : 'Accueil');
    // titre de l'onglet, description et indexation (moteurs de recherche)
    const NOM_SITE = 'Paillasse virtuelle';
    document.title = s && activeId > 0 ? `${s.label} — ${NOM_SITE}` : `${NOM_SITE} — simulations de chimie et de physique (lycée, BTS)`;
    const meta = (nom, valeur) => {
      let m = document.querySelector(`meta[name="${nom}"]`);
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', nom); document.head.appendChild(m); }
      m.setAttribute('content', valeur);
    };
    const niv = s && { '2GT': 'Seconde', '1G': 'Première', TSTL: 'Terminale STL', BTS: 'BTS Métiers de la chimie' }[s.niveau];
    meta('description', s && activeId > 0
      ? `${s.label} : simulation interactive${niv ? ` (${niv})` : ''}, avec parcours guidé, exploration libre et défi.`
      : 'Simulations interactives de chimie et de physique pour la Première, la Terminale STL et le BTS Métiers de la chimie : parcours guidés, exploration libre, défis et exercices par compétence.');
    meta('robots', activeId === 39 || activeId === 40 ? 'noindex' : 'index, follow');
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
  function naviguer(id, ex, duDevoir) {
    // ex : exercice précis à ouvrir dans un atelier (lu par l'atelier à son ouverture)
    // duDevoir : l'élève vient d'un devoir (l'atelier propose alors « Retour à mon devoir » plutôt que l'exercice suivant)
    try {
      const u = new URL(window.location.href);
      if (ex) u.searchParams.set('ex', ex); else u.searchParams.delete('ex');
      if (duDevoir) u.searchParams.set('devoir', '1'); else u.searchParams.delete('devoir');
      window.history.replaceState(null, '', u.toString());
    } catch { /* adresse non modifiable */ }
    setActiveId(id);
  }

  return (
    <div style={{ ...styles.root, '--entete-h': '60px' }}>
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      <EnTete menus={MENUS} activeId={activeId} niveauActif={activeId === 0 ? null : active.niveau} naviguer={naviguer} session={sessionSb} />


      {/* Zone principale — pleine largeur */}
      <main style={styles.main}>
        {/* Titre de la simulation (l'en-tête du site, lui, reste fixe en haut) */}
        {activeId > 0 && (
          <div style={{
            ...styles.topBar,
            background: `linear-gradient(135deg, ${active.color}22, ${active.color}08)`,
            borderBottom: `3px solid ${active.color}`,
          }}>
            <span style={{ fontSize: "2rem" }}>{active.icon}</span>
            <h1 style={{ ...styles.pageTitle, color: active.color, flex: 1 }}>
              <span style={{ fontFamily:"'Outfit', sans-serif", fontWeight:800, letterSpacing:"-0.5px" }}>
                {idAffiche === 39 ? (estEleve(sessionSb) ? 'Mon profil' : sessionSb?.profil ? 'Mon compte' : 'Se connecter') : active.label}
              </span>
            </h1>
            {estProf(sessionSb) && (activeId > 0 && activeId < 34 || activeId >= 41 && activeId !== 47) && (
              <button data-donner-devoir onClick={() => {
                try { window.sessionStorage.setItem('devoir-preset', JSON.stringify({ titre: active.label, cles: [`sim:${activeId}`], eleves: [] })); } catch { /* sans mémorisation, le formulaire s'ouvre vide */ }
                naviguer(40);
              }} style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#25628f", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Nunito', sans-serif", whiteSpace:"nowrap" }}>
                📌 Donner en devoir
              </button>)}
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
          </div>
        )}

        <div style={styles.simContainer}>
          {activeId === 0
            ? <AccueilSite onStart={(id) => naviguer(id || 1)} session={sessionSb} simulations={SIMULATIONS} energyUrl={ENERGY_URL} />
            : <div style={{ textAlign: "left" }}>
                {/* Le fichier App.css du modèle Vite centre tout le texte (#root) : on rétablit l'alignement
                    à gauche pour les simulations ; la page d'accueil garde sa mise en page centrée. */}
                <BandeauContexte key={`b${activeId}`} id={activeId} contexte={CONTEXTES[activeId]} couleur={active.color} />
                {(activeId > 0 && activeId < 34 || activeId >= 41 && activeId !== 47) && <SuiviTemps simId={activeId} />}
                {estEleve(sessionSb) && (activeId > 0 && activeId < 34 || activeId >= 41 && activeId !== 47) && <ProchaineEtape key={`pe${activeId}`} simId={activeId} naviguer={naviguer} />}
                <div id="zone-simulation"><ActiveComponent key={activeId} plotlyReady={plotlyReady} naviguer={naviguer} /></div>
                {activeId > 0 && activeId < 34 || activeId >= 41 && activeId !== 47 ? <ModeParDefaut simId={activeId} cibleId="zone-simulation" /> : null}
              </div>}
        </div>
        <ToastRecompense naviguer={naviguer} />
        <PiedDePage naviguer={naviguer} energyUrl={ENERGY_URL} />
      </main>
    </div>
  );
}

const styles = {
  root: { display:"flex", flexDirection:"column", minHeight:"100vh",
    fontFamily:"'Nunito', 'Segoe UI', sans-serif",
    background:"linear-gradient(165deg, #c9d9e8 0%, #e1eaf3 38%, #d3e0ec 70%, #c4d4e4 100%)", position:"relative", overflow:"clip" },
  bgBlob1: { position:"fixed", top:"-120px", right:"-120px", width:"400px", height:"400px",
    borderRadius:"50%",
    background:"radial-gradient(circle, #25628f40 0%, transparent 70%)",
    pointerEvents:"none", zIndex:0 },
  bgBlob2: { position:"fixed", bottom:"-100px", left:"200px", width:"350px", height:"350px",
    borderRadius:"50%",
    background:"radial-gradient(circle, #25628f33 0%, transparent 70%)",
    pointerEvents:"none", zIndex:0 },
  main: { flex:1, display:"flex", flexDirection:"column",
    position:"relative", zIndex:1, minWidth:0 },
  topBar: { display:"flex", alignItems:"center", gap:"1rem", padding:"1.25rem 2rem" },
  pageTitle: { fontFamily:"'Playfair Display', Georgia, serif",
    fontSize:"1.5rem", fontWeight:"700", margin:0 },
  simContainer: { flex:1, padding:"1.5rem 2rem", overflowX:"clip" },
};


