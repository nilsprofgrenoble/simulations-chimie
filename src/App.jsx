import { useState, useEffect, useRef, useMemo } from "react";
import { compter, STATS_ACTIVES } from "./stats";
import { SimulationAptitude } from "./simulations/Aptitude";
import { Simulation1 } from "./simulations/Avancement";
import { SimulationDosageEtalonnage } from "./simulations/DosageEtalonnage";
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
import { SimulationAPropos } from "./simulations/APropos";
import { SimulationAtelierDonnees } from "./simulations/AtelierDonnees";
import { SimulationAtelierGraphique } from "./simulations/AtelierGraphique";
import { SimulationAtelierRealiser } from "./simulations/AtelierRealiser";
import { SimulationAtelierAnalyser } from "./simulations/AtelierAnalyser";
import { SimulationEntrainement } from "./simulations/Entrainement";
import { SimulationCompte } from "./simulations/Compte";
import { SimulationSuiviProf } from "./simulations/SuiviProf";
import { useSession, restaurer } from "./serveur";
import { SuiviTemps, nomsSim } from "./suivi";

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
  { id:39, label:"Mon compte", niveau:"COMPTE", icon:"👤", color:"#e11d48", component: SimulationCompte },
  { id:40, label:"Suivi professeur", niveau:"COMPTE", icon:"📊", color:"#e11d48", component: SimulationSuiviProf },
  // Page hors menu : à propos et contact (ouverte depuis le bas du menu et le pied de page)
  { id:47, label:"À propos et contact", niveau:"COMPTE", icon:"ℹ️", color:"#475569", component: SimulationAPropos },
];
SIMULATIONS.forEach(s => { nomsSim[s.id] = s.label; });

const NIVEAUX = [
  { label: "je m'entraîne ! Travail par compétence.", key: "COMP", color: "#e11d48" },
  { label: "1G",   key: "1G",   color: "#2a9d8f" },
  { label: "TSTL", key: "TSTL", color: "#2a6099" },
  { label: "BTS",  key: "BTS",  color: "#6a4c93" },
];

// ============================================================
//  PAGE D'ACCUEIL
// ============================================================

function PageAccueil({ onStart }) {
  const [ouvert, setOuvert] = useState(null);   // un seul chapitre déplié à la fois
  const cardA = {
    background: "white",
    borderRadius: 14,
    padding: "20px 24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    border: "1px solid #eee",
  };

  const simulations = [
    { niveau:"COMP", titre:"je m'entraîne ! Travail par compétence.", color:"#e11d48", sims:[
      { icon:"🏋️", label:"Je m'entraîne ! Travail par compétence", desc:"Le point d'entrée : une carte par compétence (S'APP, ANA, REA, VAL), l'ordre conseillé, la liste de tous les exercices filtrable par thème du programme, et ta progression (mémorisée sur cet appareil)." },
      { icon:"🎯", label:"S'APP : extraire les données d'un énoncé", desc:"S'approprier : la formule est donnée ; il faut comprendre la question, repérer les données utiles, associer chaque donnée au symbole de la formule et à la bonne unité. 7 énoncés rangés par thème." },
      { icon:"📈", label:"S'APP : lire un graphique", desc:"S'approprier : identifier grandeurs, unités et échelles des axes, lire une valeur (directe, inverse, à l'origine, avec une autre unité), interpréter l'allure. 8 graphiques rangés par thème." },
      { icon:"🧭", label:"ANA : analyser un problème", desc:"Analyser : construire la démarche d'un problème posé sans questions intermédiaires (ce que l'on cherche, données utiles, relations, hypothèses, ordre des calculs), choisir la bonne relation, reconnaître les hypothèses d'un modèle, prévoir sans calculer. 9 problèmes et 35 exercices courts, rangés par thème." },
      { icon:"🧮", label:"REA : réaliser un calcul", desc:"Réaliser : changements d'unité (simples, préfixes, unités au carré ou au cube, unités composées), conversions cachées dans un calcul, isoler une grandeur, chiffres significatifs, log / exp / racine, saisie à la calculatrice. 9 types d'exercices tirés au hasard." },
    ]},
    { niveau:"1G", color:"#2a9d8f", sousMenus:[
      { label:"⚗️ Suivi de l’évolution d’un système, siège d’une transformation", sims:[
      { icon:"⚗️", label:"Avancement d'une réaction", desc:"Le volume molaire d'un gaz par la réaction du magnésium sur l'acide : tableau d'avancement, réactif limitant. Et un tableau d'avancement pour toute réactions." },
      { icon:"🧪", label:"Titrage direct", desc:"On fait réagir l'espèce à doser avec une solution titrante jusqu'à l'équivalence. Exemple : le diiode du Lugol par le thiosulfate. Et un titrage pour toute réaction." },
      { icon:"💊", label:"Titrage en retour", desc:"On ajoute un excès connu d'un réactif, puis on titre ce qui n'a pas réagi. Exemple : la vitamine C d'une gélule. Et un titrage en retour pour toute réaction." },
      { icon:"🌈", label:"Beer-Lambert", desc:"Schéma animé du spectrophotomètre, spectre UV-visible interactif et courbe d'étalonnage." },
      ]},
      { label:"🌍 Interactions fondamentales et introduction à la notion de champ", sims:[
      { icon:"🧤", label:"Électrisation et influence électrostatique", desc:"Frotter une tige : des électrons passent d'un corps à l'autre. Interaction entre corps chargés (expériences de la paille et des tiges), influence sur une boule neutre, puis contact. Parcours guidé et 3 défis." },
      { icon:"🌍", label:"Champ et force : gravitation et électrostatique", desc:"Le champ de gravitation de la Terre et le champ électrostatique d'une charge : vecteurs champ, lignes de champ, zoom de la Terre entière à la salle de classe (champ de pesanteur localement uniforme), F = m·𝒢 et F = q·E. Trois défis." },
      { icon:"🌙", label:"Deux corps en interaction : gravitation et Coulomb", desc:"Les deux forces F_A/B et F_B/A que s'exercent deux corps (Terre–Lune, deux élèves, deux boules chargées, atome d'hydrogène) : loi de Newton, loi de Coulomb, variation en 1/d², comparaison des deux interactions. Parcours guidé et 3 défis." },
      { icon:"⚡", label:"Condensateur plan et gouttelette de Millikan", desc:"Le champ uniforme entre deux plaques chargées (E = U/d), la force F = qE, l'équilibre d'une gouttelette d'huile et la quantification de la charge. Parcours guidé et 3 défis." },
      ]},
    ]},
    { niveau:"TSTL", color:"#e9a824", sousMenus:[
      { label:"📡 Transmission de signaux numériques", sims:[
        { icon:"💡", label:"Chaîne de mesure", desc:"Capteur de lumière Arduino — photorésistance, conditionneur, CAN et algorithme de contrôle." },
        { icon:"📡", label:"Quantum du CAN", desc:"Résolution en température d'un CAN : impact de la non-linéarité de la courbe d'étalonnage sur le quantum de mesure." },
        { icon:"⏱️", label:"Temps de réponse d'un capteur", desc:"Réponse d'une sonde à un échelon : V_ini, V_fin, ΔV, bande à 5 %, t_R = t₁ − t₀, modèle exponentiel et t_R = 3τ. Puis une grandeur qui oscille avant de se stabiliser (dernière sortie de la bande)." },
      ]},
      { label:"💧 Transport des fluides", sims:[
        { icon:"🌊", label:"Statique des fluides", desc:"Étalonnage d'un manomètre dans une éprouvette : P = f(h), modèle linéaire, puis mesure de la hauteur d'eau d'un récipient inconnu." },
        { icon:"⚖️", label:"Débits massique et volumique", desc:"Une cuve se remplit sur une balance : débit massique Q = m/Δt, masse volumique, débit volumique, et conversions d'unités avec les unités écrites dans le calcul." },
        { icon:"💦", label:"Débit et vitesse d'écoulement", desc:"Un tuyau qui change de section : débit volumique Q = v·S, conservation v₁S₁ = v₂S₂, vitesse du fluide, débit massique, avec les unités écrites dans le calcul." },
        { icon:"🚰", label:"Circuit hydraulique", desc:"Relation de Bernoulli : bilan d'énergie, pertes de charge linéiques et singulières, puissance de la pompe." },
      ]},
      { label:"⚙️ Régulation", sims:[
        { icon:"⚙️", label:"Régulation TOR, P et PI", desc:"Régulations TOR, P et PI d'un réservoir avec animations en temps réel." },
        { icon:"📈", label:"Point de fonctionnement d'une régulation P", desc:"Caractéristique statique d'un procédé et point de fonctionnement d'une régulation P." },
      ]},
      { label:"❄️ Évaporation et cristallisation", sims:[
        { icon:"❄️", label:"Évaporation et cristallisation", desc:"Cristallisation par refroidissement ou évaporation : diagramme de solubilité, bilan de matière, rendement." },
      ]},
      { label:"🧪 Distillation", sims:[
        { icon:"📉", label:"Diagramme binaire isobare", desc:"Courbes d'ébullition et de rosée, domaines liquide / vapeur, composition du liquide et de la vapeur à une température donnée, fractions molaires et massiques, azéotrope." },
        { icon:"🔬", label:"Réfractomètre : indice et composition", desc:"Lire un indice de réfraction : frontière clair – sombre, compensateur, réticule, échelle, 4 décimales ; puis courbe d'étalonnage eau – éthanol et ambiguïté (deux compositions pour un même indice)." },
        { icon:"🧪", label:"Distillation simple et fractionnée", desc:"Un mélange binaire n'a pas la même composition liquide et vapeur : diagramme isobare, escalier des plateaux, azéotrope, bilan de matière et rendement. Eau – éthanol (le vin), benzène – toluène, chloroforme – acétone." },
      ]},
      { label:"🧲 Contrôle des systèmes", sims:[
        { icon:"🧭", label:"Boussole et champ magnétique", desc:"Direction, sens et intensité du champ magnétique : une boussole près d'un aimant, champ de la Terre (50 µT), addition vectorielle, boussole des tangentes, carte du champ et ordres de grandeur du micro-tesla à 100 T." },
        { icon:"🧲", label:"Moteur pas à pas : du stator à l'axe", desc:"Champ magnétique, stator à 4 bobines et rotor aimanté : pas complet, demi-pas, force maximale, chronogramme des tensions ; puis réducteur : 4096 demi-pas, 512 tours du rotor pour un tour de l'axe, durée avec delay(5)." },
        { icon:"💻", label:"Piloter le moteur avec le code", desc:"Construire la séquence des bobines et le délai d'un programme Arduino : oscillations du rotor, pas perdus si le délai est trop court ou la charge trop forte, force maximale, ordre incohérent, boucle ouverte." },
      ]},
      { label:"🔥 Transferts thermiques", sims:[
        { icon:"🧱", label:"Paroi multicouche : résistance thermique", desc:"Conduction à travers une paroi : R = e/(λS), résistances en série, P = ΔT/R, profil de température et part de chaque couche, dimensionnement d'un isolant, simple et double vitrage." },
        { icon:"🫖", label:"Bouilloire : conductivité thermique de sa paroi", desc:"Le TP de la bouilloire en virtuel : énergie perdue par l'eau (Q = m·C·ΔT), puissance, écart eau–air, λ de la paroi. Puis une bouilloire réaliste pour critiquer chaque hypothèse du modèle." },
        { icon:"🔥", label:"Échangeur thermique : co-courant et contre-courant", desc:"Échangeur coaxial : profils de température, bilan P_C = −P_F, écart moyen logarithmique ΔTm, surface d'échange et coefficient global U. Co-courant, contre-courant, et côté chaud à température constante (bain, vapeur)." },
      ]},
    ]},
    { niveau:"BTS", color:"#6a4c93", sousMenus:[
      { label:"🔬 Analyse", sims:[
        { icon:"⚡", label:"Titrages électrochimiques", desc:"Potentiométrie, ampérométrie — courbes i=f(E) et suivi du titrage." },
        { icon:"📊", label:"Fidélité d'une méthode : étude interlaboratoire", desc:"Plusieurs laboratoires analysent le même échantillon pour évaluer la fidélité de la méthode (ISO 5725) : tests de Cochran et de Grubbs, répétabilité et reproductibilité." },
        { icon:"📐", label:"Dosage par étalonnage", desc:"Concevoir une gamme à partir de l'ordre de grandeur attendu, la réaliser, exploiter la droite (résidus, test de Fisher, LD/LQ) et doser l'échantillon. Exemple : la caféine d'une crème en CLHP." },
        { icon:"💉", label:"Simulation CLHP", desc:"Chromatogrammes en phase inverse — influence du logP, de l'éluant et de la colonne sur la séparation." },
        { icon:"📐", label:"Étalon interne / Normalisation interne", desc:"Exploitation de chromatogrammes par méthode de l'étalon interne ou de la normalisation interne." },
        { icon:"🎯", label:"Essais d'aptitude : comparaison interlaboratoire", desc:"Plusieurs laboratoires analysent le même échantillon pour évaluer la compétence de chacun : le z-score, ses différentes formules et ses hypothèses." },
      ]},
      { label:"🧪 Formulation", sims:[
        { icon:"🔵", label:"Paramètres de solubilité de Hansen", desc:"Sphère de solubilité, distance et RED, mélanges de solvants. Exemple guidé : la nitrocellulose d'un vernis à ongle." },
        { icon:"🎨", label:"Peinture à l'eau", desc:"Formulation (extrait sec, CPV, CPVC, prises d'huile), aspect mat, satiné ou brillant, et séchage du film (coalescence, TMFF). Parcours guidé : le changement de résine d'une base blanche mate." },
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
          Paillasse virtuelle
        </h2>
        <p style={{fontSize:15, color:"#555", lineHeight:1.7, maxWidth:600, margin:"0 auto 14px"}}>
          Manipuler, se tromper, recommencer : la paillasse du labo, sans la verrerie.
        </p>
        <p style={{fontSize:13.5, color:"#666", lineHeight:1.6, maxWidth:600, margin:"0 auto 20px"}}>
          Des simulations de chimie et de physique pour la Première spé PC, la Terminale STL et le BTS Métiers de la chimie : parcours guidés, exploration libre, défis et exercices par compétence. Site en accès libre.
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
      {simulations.map(({niveau, titre, color, sims, sousMenus}) => (
        <div key={niveau}>
          {/* En-tête niveau */}
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
            <div style={{height:3, width:28, borderRadius:2, background:color}}/>
            <span style={{fontSize:13, fontWeight:700, color, textTransform: niveau === "COMP" ? "none" : "uppercase",
              letterSpacing:"0.1em"}}>{titre || `Niveau ${niveau}`}</span>
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
              {/* En-tête sous-menu : cliquer déplie les animations du chapitre */}
              <button onClick={()=>setOuvert(o=>o===sLabel?null:sLabel)} aria-expanded={ouvert===sLabel}
                style={{display:"flex", alignItems:"center", gap:8, marginBottom:10, width:"100%", border:"none", background:"transparent", cursor:"pointer", padding:0, textAlign:"left"}}>
                <div style={{height:2, width:18, borderRadius:2, background:color, opacity:0.5}}/>
                <span style={{fontSize:13, fontWeight:700, color,
                  background:color+'18', padding:"5px 14px",
                  borderRadius:20, border:`1px solid ${color}44`}}>
                  {sLabel} · {sSims.length}
                </span>
                <span style={{fontSize:14, color, transform: ouvert===sLabel ? "rotate(90deg)" : "none", transition:"transform 0.2s"}}>›</span>
              </button>
              {ouvert===sLabel && <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12, paddingLeft:8}}>
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
              </div>}
            </div>
          ))}
        </div>
      ))}

      <div style={{textAlign:"center", fontSize:12, color:"#aaa", paddingBottom:16}}>
        Paillasse virtuelle — paillasse-virtuelle.fr
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
  const sessionSb = useSession();
  useEffect(() => { restaurer(); }, []);
  const active = SIMULATIONS.find(s => s.id === activeId) || SIMULATIONS[0];
  const ActiveComponent = active.component;
  const [expanded, setExpanded] = useState({ "1G": true, "TSTL": true, "BTS": true, "COMP": true });
  // Sous-groupes du menu BTS (Analyse, Formulation) et TSTL : un seul état pour tous,
  // déclaré ici car React interdit un useState dans une boucle ou une condition.
  const [sgOuverts, setSgOuverts] = useState({});
  const [plotlyReady, setPlotlyReady] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  // Menu : fermé par défaut ; on peut l'épingler (reste ouvert à gauche sur écran large). Le choix est mémorisé sur l'appareil.
  const [epingle, setEpingle] = useState(() => { try { return window.localStorage.getItem('menu-epingle') === '1'; } catch { return false; } });
  const [large, setLarge] = useState(() => window.innerWidth >= 1000);
  const [menuOpen, setMenuOpen] = useState(() => { try { return window.localStorage.getItem('menu-epingle') === '1' && window.innerWidth >= 1000; } catch { return false; } });
  const menuFixe = epingle && large && menuOpen;
  useEffect(() => {
    const f = () => setLarge(window.innerWidth >= 1000);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  useEffect(() => {
    document.body.style.paddingLeft = menuFixe ? '230px' : '0';
    document.body.style.transition = 'padding-left 0.25s';
  }, [menuFixe]);
  function changerEpingle(v) {
    setEpingle(v);
    try { window.localStorage.setItem('menu-epingle', v ? '1' : '0'); } catch { /* mémorisation indisponible */ }
    if (v) setMenuOpen(true);
  }

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
    const niv = s && { '1G': 'Première', TSTL: 'Terminale STL', BTS: 'BTS Métiers de la chimie' }[s.niveau];
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
  function naviguer(id, ex) {
    // ex : exercice précis à ouvrir dans un atelier (lu par l'atelier à son ouverture)
    try {
      const u = new URL(window.location.href);
      if (ex) u.searchParams.set('ex', ex); else u.searchParams.delete('ex');
      window.history.replaceState(null, '', u.toString());
    } catch { /* adresse non modifiable */ }
    setActiveId(id);
    if (!menuFixe) setMenuOpen(false);
  }

  const sidebarW = menuOpen ? 230 : 0;

  return (
    <div style={styles.root}>
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      {/* Overlay sombre quand menu ouvert */}
      {menuOpen && !menuFixe && (
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          {large ? (
            <button onClick={() => changerEpingle(!epingle)} title={epingle ? 'Le menu reste ouvert : cliquer pour qu’il se referme' : 'Garder le menu ouvert à gauche'}
              style={{ background: epingle ? '#e0f2fe' : 'none', border: epingle ? '1px solid #7dd3fc' : '1px solid #cbd5e1', borderRadius:6, fontSize:12.5,
                cursor:'pointer', color:'#334155', padding:'3px 8px' }}>📌 {epingle ? 'Menu fixe' : 'Garder ouvert'}</button>
          ) : <span/>}
          <button onClick={() => { setMenuOpen(false); if (epingle) changerEpingle(false); }}
            style={{ background:'none', border:'none', fontSize:22,
              cursor:'pointer', color:'#888', padding:'0 4px' }}>✕</button>
        </div>

        <div style={styles.sidebarHeader}>
          <div style={{ fontSize: "2.2rem" }}>⚛️</div>
          <div>
            <div style={styles.siteTitle}>Paillasse virtuelle</div>
            <div style={styles.siteSub}>Chimie et physique</div>
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
            const simsNiv = SIMULATIONS.filter(s => s.niveau === niv.key).sort((a, b) => (niv.key === 'COMP' ? [38,34,35,37,36].indexOf(a.id) - [38,34,35,37,36].indexOf(b.id) : 0));
            const isExpanded = expanded[niv.key];
            const sousgroupes = niv.key === '1G' ? [
              { label:'⚗️ Suivi de l’évolution d’un système, siège d’une transformation', ids:[1,2,25,10] },
              { label:'🌍 Interactions fondamentales et notion de champ', ids:[51, 48, 49, 50] },
            ] : niv.key === 'BTS' ? [
              { label:'🔬 Analyse', ids:[3,29,9,11,12,13,16] },
              { label:'🧪 Formulation', ids:[4,14] },
            ] : niv.key === 'TSTL' ? [
              { label:'📡 Transmission de signaux numériques', ids:[8,15,33] },
              { label:'💧 Transport des fluides', ids:[26,27,28,17] },
              { label:'⚙️ Régulation', ids:[5,6] },
              { label:'❄️ Évaporation et cristallisation', ids:[7] },
              { label:'🧪 Distillation', ids:[42,41,43] },
              { label:'🔥 Transferts thermiques', ids:[31,32,30] },
              { label:'🧲 Contrôle des systèmes', ids:[46,44,45] },
            ] : null;

            return (
              <div key={niv.key}>
                <button onClick={() => setExpanded(prev => ({...prev, [niv.key]: !prev[niv.key]}))}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    width:"100%", padding:"0.5rem 0.75rem", border:"none",
                    background:"transparent", cursor:"pointer",
                    borderRadius:"8px", marginBottom:"0.2rem" }}>
                  <span style={{ fontSize:"0.72rem", fontWeight:"800", letterSpacing:"0.1em",
                    textTransform: niv.key === 'COMP' ? 'none' : 'uppercase', color: niv.color, textAlign:'left' }}>{niv.label}</span>
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
                  // Fermés par défaut ; celui qui contient la simulation en cours est ouvert ; un seul ouvert à la fois par niveau
                  const ouvertParDefaut = l => (sousgroupes.find(g => g.label === l)?.ids || []).includes(activeId);
                  const sgExpanded = sgOuverts[label] ?? ouvertParDefaut(label);
                  const basculer = () => setSgOuverts(prev => {
                    const nouveau = { ...prev };
                    sousgroupes.forEach(g => { nouveau[g.label] = false; });
                    nouveau[label] = !(prev[label] ?? ouvertParDefaut(label));
                    return nouveau;
                  });
                  const sgSims = ids.map(id => simsNiv.find(s => s.id === id)).filter(Boolean);
                  return (
                    <div key={label}>
                      <button onClick={basculer} aria-expanded={sgExpanded}
                        style={{ display:"flex", alignItems:"center", gap:6, textAlign:"left",
                          width:"100%", padding:"0.4rem 0.75rem", border:"none",
                          background: sgExpanded ? niv.color+'12' : "transparent", borderRadius:8, cursor:"pointer", marginLeft:"0.25rem" }}>
                        <span style={{ fontSize:"0.74rem", fontWeight:"700", color:niv.color,
                          letterSpacing:"0.03em", flex:1 }}>{label}</span>
                        <span style={{ fontSize:"0.65rem", color:niv.color, opacity:0.7 }}>{sgSims.length}</span>
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
          <button onClick={() => naviguer(47)}
            style={{ display:"flex", alignItems:"center", gap:"0.5rem", width:"100%", textAlign:"left", border:"none", background: activeId === 47 ? "#f1f5f9" : "transparent", cursor:"pointer",
              fontSize:"0.85rem", color: activeId === 47 ? "#334155" : "#888",
              padding:"0.6rem 1rem", borderRadius:"12px", transition:"all 0.2s",
              fontWeight:"600", fontFamily:"'Nunito', sans-serif" }}
            onMouseEnter={e=>{e.currentTarget.style.color="#334155";e.currentTarget.style.background="#f1f5f9"}}
            onMouseLeave={e=>{e.currentTarget.style.color=activeId === 47 ? "#334155" : "#888";e.currentTarget.style.background=activeId === 47 ? "#f1f5f9" : "transparent"}}>
            ℹ️ À propos et contact
          </button>
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

          <button onClick={() => naviguer(sessionSb?.profil?.role === 'prof' ? 40 : 39)} data-bouton-compte
            title={sessionSb?.profil ? 'Mon compte' : 'Se connecter'}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, border: sessionSb?.profil ? "1px solid #e11d48" : "none",
              background: sessionSb?.profil ? "#fff1f2" : "#f0f0f0", color: sessionSb?.profil ? "#be123c" : "#555",
              fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Nunito', sans-serif", whiteSpace:"nowrap" }}>
            👤 {sessionSb?.profil ? (sessionSb.profil.identifiant || sessionSb.profil.nom) : 'Se connecter'}
          </button>
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
            ? <PageAccueil onStart={(id) => naviguer(id || 1)} />
            : <div style={{ textAlign: "left" }}>
                {/* Le fichier App.css du modèle Vite centre tout le texte (#root) : on rétablit l'alignement
                    à gauche pour les simulations ; la page d'accueil garde sa mise en page centrée. */}
                <BandeauContexte key={`b${activeId}`} id={activeId} contexte={CONTEXTES[activeId]} couleur={active.color} />
                {(activeId > 0 && activeId < 34 || activeId >= 41 && activeId !== 47) && <SuiviTemps simId={activeId} />}
                <ActiveComponent key={activeId} plotlyReady={plotlyReady} naviguer={naviguer} />
              </div>}
        </div>
        <div style={{ textAlign: "center", fontSize: "0.78rem", color: "#94a3b8",
          padding: "18px 12px 8px", borderTop: "1px solid #e2e8f0", marginTop: 24 }}>
          © {new Date().getFullYear()} Paillasse virtuelle ·
          {" "}
          <a href="?sim=47" onClick={e => { e.preventDefault(); naviguer(47); }} style={{ color: "inherit" }}>À propos et contact</a>
          {" "}·{" "}
          <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr" target="_blank"
            rel="noopener noreferrer" style={{ color: "inherit" }}>
            CC BY-NC-ND 4.0
          </a>
          {" "}· libre d'accès, reproduction et modification non autorisées
          {STATS_ACTIVES && <> · statistiques de fréquentation anonymes, sans cookie ni compte</>}
        </div>
      </main>
    </div>
  );
}

const styles = {
  root: { display:"flex", minHeight:"100vh",
    fontFamily:"'Nunito', 'Segoe UI', sans-serif",
    background:"#f5f7fa", position:"relative", overflow:"clip" },
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
  simContainer: { flex:1, padding:"1.5rem 2rem", overflowX:"clip" },
};


