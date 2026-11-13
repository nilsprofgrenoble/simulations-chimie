import { useState, useEffect } from "react";
import { compter } from "./stats";
import { BandeauContexte } from "./commun";
import { CONTEXTES } from "./contextes";
import { Pic, Emo, PictosSprite } from "./Pictos";
import { ToastRecompense } from "./ToastRecompense";
import { useSession, restaurer, estEleve, estProf } from "./serveur";
import { chapitresDuNiveau, confierNavigation } from "./chapitres";
import { EN_RECOLTE, finRecolte, capturerFigure, envoyerFigure } from "./fiches";
import { SuiviTemps, nomsSim, simsCachees } from "./suivi";
import { ModeParDefaut } from "./ModeParDefaut";
import CadreMission from "./CadreMission";
import { missionEnCours } from "./mission";
import { ProchaineEtape } from "./ProchaineEtape";
import { EnTete } from "./EnTete";
import { PiedDePage } from "./PiedDePage";
import { AccueilSite } from "./AccueilSite";
import { resoudreCode } from "./resoudreCode";
import { DESCRIPTIONS } from "./descriptions";
import { aAdressePropre, cheminSimulation, idDepuisChemin, simDeLUrl } from "./slugs";
import { referencementSimulation, ADRESSE_SITE, TITRE_ACCUEIL, DESCRIPTION_ACCUEIL } from "./referencement";
import { paresseux, EnChargement } from "./chargement";
import { chargerPlotly, SIMS_PLOTLY } from "./bibliotheques";
const SimulationAptitude = paresseux(() => import("./simulations/Aptitude"), "SimulationAptitude");
const Simulation1 = paresseux(() => import("./simulations/Avancement"), "Simulation1");
const SimulationDosageEtalonnage = paresseux(() => import("./simulations/DosageEtalonnage"), "SimulationDosageEtalonnage");
const BeerLambert1G = paresseux(() => import("./simulations/BeerLambert1G"), "BeerLambert1G");
const SimulationBernoulli = paresseux(() => import("./simulations/Bernoulli"), "SimulationBernoulli");
const SimulationCLHP = paresseux(() => import("./simulations/CLHP"), "SimulationCLHP");
const SimulationCPG = paresseux(() => import("./simulations/CPG"), "SimulationCPG");
const SimulationCPGSM = paresseux(() => import("./simulations/CPGSM"), "SimulationCPGSM");
const Simulation8 = paresseux(() => import("./simulations/ChaineMesure"), "Simulation8");
const Simulation7 = paresseux(() => import("./simulations/Cristallisation"), "Simulation7");
const SimulationEtalonnageInterne = paresseux(() => import("./simulations/EtalonInterne"), "SimulationEtalonnageInterne");
const Simulation4 = paresseux(() => import("./simulations/Hansen"), "Simulation4");
const Simulation9 = paresseux(() => import("./simulations/InterLaboratoire"), "Simulation9");
const SimulationPeinture = paresseux(() => import("./simulations/Peinture"), "SimulationPeinture");
const Simulation6 = paresseux(() => import("./simulations/PointFonctionnement"), "Simulation6");
const SimulationCAN = paresseux(() => import("./simulations/QuantumCAN"), "SimulationCAN");
const Simulation5 = paresseux(() => import("./simulations/RegulationNiveau"), "Simulation5");
const Simulation2 = paresseux(() => import("./simulations/TitrageDirect"), "Simulation2");
const SimulationTitrageIndirect = paresseux(() => import("./simulations/TitrageIndirect"), "SimulationTitrageIndirect");
const SimulationIEpH = paresseux(() => import("./simulations/IEpH"), "SimulationIEpH");
const Simulation3 = paresseux(() => import("./simulations/TitragesElectrochimiques"), "Simulation3");
const SimulationStatiqueFluides = paresseux(() => import("./simulations/StatiqueFluides"), "SimulationStatiqueFluides");
const SimulationDebits = paresseux(() => import("./simulations/DebitsFluides"), "SimulationDebits");
const SimulationVitesseDebit = paresseux(() => import("./simulations/VitesseDebit"), "SimulationVitesseDebit");
const SimulationEchangeur = paresseux(() => import("./simulations/Echangeur"), "SimulationEchangeur");
const SimulationParoi = paresseux(() => import("./simulations/Paroi"), "SimulationParoi");
const SimulationBouilloire = paresseux(() => import("./simulations/Bouilloire"), "SimulationBouilloire");
const SimulationReponse = paresseux(() => import("./simulations/Reponse"), "SimulationReponse");
const SimulationDistillation = paresseux(() => import("./simulations/Distillation"), "SimulationDistillation");
const SimulationDiagramme = paresseux(() => import("./simulations/DiagrammeBinaire"), "SimulationDiagramme");
const SimulationRefractometre = paresseux(() => import("./simulations/Refractometre"), "SimulationRefractometre");
const SimulationMoteurPasAPas = paresseux(() => import("./simulations/MoteurPasAPas"), "SimulationMoteurPasAPas");
const SimulationMoteurCode = paresseux(() => import("./simulations/MoteurCode"), "SimulationMoteurCode");
const SimulationBoussole = paresseux(() => import("./simulations/Boussole"), "SimulationBoussole");
const SimulationDiffraction = paresseux(() => import("./simulations/Diffraction"), "SimulationDiffraction");
const SimulationSon = paresseux(() => import("./simulations/Son"), "SimulationSon");
const SimulationEchographe = paresseux(() => import("./simulations/Echographe"), "SimulationEchographe");
const SimulationRegioselectiviteHBr = paresseux(() => import("./simulations/RegioselectiviteHBr"), "SimulationRegioselectiviteHBr");
const SimulationCinetiqueThermoBTS = paresseux(() => import("./simulations/CinetiqueThermoBTS"), "SimulationCinetiqueThermoBTS");
const SimulationSubstitutionElimination = paresseux(() => import("./simulations/SubstitutionElimination"), "SimulationSubstitutionElimination");
const SimulationAdditionDibrome = paresseux(() => import("./simulations/AdditionDibrome"), "SimulationAdditionDibrome");
const SimulationTranspositionCarbocation = paresseux(() => import("./simulations/TranspositionCarbocation"), "SimulationTranspositionCarbocation");
const SimulationSyntheseStereo = paresseux(() => import("./simulations/SyntheseStereo"), "SimulationSyntheseStereo");
const SimulationChimioselectivite = paresseux(() => import("./simulations/Chimioselectivite"), "SimulationChimioselectivite");
const SimulationEpaisseursAssociatifs = paresseux(() => import("./simulations/EpaisseursAssociatifs"), "SimulationEpaisseursAssociatifs");
const SimulationLasure = paresseux(() => import("./simulations/Lasure"), "SimulationLasure");
const SimulationNomenclatureOrganique = paresseux(() => import("./simulations/NomenclatureOrganique"), "SimulationNomenclatureOrganique");
const SimulationMecanismesReactionnels = paresseux(() => import("./simulations/MecanismesReactionnels"), "SimulationMecanismesReactionnels");
const SimulationEchographe2D = paresseux(() => import("./simulations/Echographe2D"), "SimulationEchographe2D");
const SimulationOptimiserSynthese = paresseux(() => import("./simulations/OptimiserSynthese"), "SimulationOptimiserSynthese");
const SimulationMachinesThermiques = paresseux(() => import("./simulations/MachinesThermiques"), "SimulationMachinesThermiques");
const SimulationInterferences = paresseux(() => import("./simulations/Interferences"), "SimulationInterferences");
const SimulationAcidesBases = paresseux(() => import("./simulations/AcidesBases"), "SimulationAcidesBases");
const SimulationEsterification = paresseux(() => import("./simulations/Esterification"), "SimulationEsterification");
const SimulationChampForce = paresseux(() => import("./simulations/ChampForce"), "SimulationChampForce");
const SimulationDeuxCorps = paresseux(() => import("./simulations/DeuxCorps"), "SimulationDeuxCorps");
const SimulationCondensateurMillikan = paresseux(() => import("./simulations/CondensateurMillikan"), "SimulationCondensateurMillikan");
const SimulationElectrisation = paresseux(() => import("./simulations/Electrisation"), "SimulationElectrisation");
const SimulationSynthese = paresseux(() => import("./simulations/Synthese"), "SimulationSynthese");
const SimulationPointage = paresseux(() => import("./simulations/Pointage"), "SimulationPointage");
const SimulationEnergieMeca = paresseux(() => import("./simulations/EnergieMeca"), "SimulationEnergieMeca");
const SimulationTravail = paresseux(() => import("./simulations/Travail"), "SimulationTravail");
const SimulationMouvementSysteme = paresseux(() => import("./simulations/MouvementSysteme"), "SimulationMouvementSysteme");
const SimulationMouvementReferentiel = paresseux(() => import("./simulations/MouvementReferentiel"), "SimulationMouvementReferentiel");
const SimulationAtomesMolecules = paresseux(() => import("./simulations/AtomesMolecules"), "SimulationAtomesMolecules");
const SimulationFamillesChimiques = paresseux(() => import("./simulations/FamillesChimiques"), "SimulationFamillesChimiques");
const SimulationForcesVecteurs = paresseux(() => import("./simulations/ForcesVecteurs"), "SimulationForcesVecteurs");
const SimulationPrincipeInertie = paresseux(() => import("./simulations/PrincipeInertie"), "SimulationPrincipeInertie");
const SimulationDissolution = paresseux(() => import("./simulations/Dissolution"), "SimulationDissolution");
const SimulationDilution = paresseux(() => import("./simulations/Dilution"), "SimulationDilution");
const SimulationMelanges = paresseux(() => import("./simulations/Melanges"), "SimulationMelanges");
const SimulationRefraction = paresseux(() => import("./simulations/Refraction"), "SimulationRefraction");
const SimulationLentille = paresseux(() => import("./simulations/Lentille"), "SimulationLentille");
const SimulationSpectres = paresseux(() => import("./simulations/Spectres"), "SimulationSpectres");
const SimulationCircuits = paresseux(() => import("./simulations/Circuits"), "SimulationCircuits");
const SimulationLoiOhm = paresseux(() => import("./simulations/LoiOhm"), "SimulationLoiOhm");
const SimulationDebitCharges = paresseux(() => import("./simulations/DebitCharges"), "SimulationDebitCharges");
const SimulationDiffractionRX = paresseux(() => import("./simulations/DiffractionRX"), "SimulationDiffractionRX");
const SimulationMailles = paresseux(() => import("./simulations/MaillesCristallines"), "SimulationMailles");
const SimulationRMN = paresseux(() => import("./simulations/RMNProton"), "SimulationRMN");
const SimulationRMNC2D = paresseux(() => import("./simulations/RMNCarbone2D"), "SimulationRMNC2D");
const SimulationPuissanceJoule = paresseux(() => import("./simulations/PuissanceJoule"), "SimulationPuissanceJoule");
const SimulationCaracPile = paresseux(() => import("./simulations/CaracPile"), "SimulationCaracPile");
const SimulationISS = paresseux(() => import("./simulations/ISS"), "SimulationISS");
const SimulationSolubilite = paresseux(() => import("./simulations/Solubilite"), "SimulationSolubilite");
const SimulationAPropos = paresseux(() => import("./simulations/APropos"), "SimulationAPropos");
const SimulationPourEnseignants = paresseux(() => import("./simulations/PourEnseignants"), "SimulationPourEnseignants");
const SimulationAtelierDonnees = paresseux(() => import("./simulations/AtelierDonnees"), "SimulationAtelierDonnees");
const SimulationAtelierGraphique = paresseux(() => import("./simulations/AtelierGraphique"), "SimulationAtelierGraphique");
const SimulationAtelierRealiser = paresseux(() => import("./simulations/AtelierRealiser"), "SimulationAtelierRealiser");
const SimulationAtelierAnalyser = paresseux(() => import("./simulations/AtelierAnalyser"), "SimulationAtelierAnalyser");
const SimulationAtelierValider = paresseux(() => import("./simulations/AtelierValider"), "SimulationAtelierValider");
const SimulationIncertitudeType = paresseux(() => import("./simulations/IncertitudeType"), "SimulationIncertitudeType");
const SimulationEntrainement = paresseux(() => import("./simulations/Entrainement"), "SimulationEntrainement");
const SimulationChapitre = paresseux(() => import("./simulations/Entrainement"), "SimulationChapitre");
const SimulationFiches = paresseux(() => import("./simulations/MesFiches"), "SimulationFiches");
const SimulationClassement = paresseux(() => import("./simulations/Classement"), "SimulationClassement");
const JeuxMenu = paresseux(() => import("./simulations/JeuxEscape"), "JeuxMenu");
const SimulationCompte = paresseux(() => import("./simulations/Compte"), "SimulationCompte");
const SimulationSuiviProf = paresseux(() => import("./simulations/SuiviProf"), "SimulationSuiviProf");
const SimulationEscapeKepler = paresseux(() => import("./simulations/EscapeKepler"), "SimulationEscapeKepler");
const SimulationEscapeAqua = paresseux(() => import("./simulations/EscapeAqua"), "SimulationEscapeAqua");
const SimulationHistoireLabo = paresseux(() => import("./simulations/HistoireLabo"), "SimulationHistoireLabo");

// ============================================================
//  MENU — modifiez les noms et icônes ici
// ============================================================

const ENERGY_URL = "https://energy.paillasse-virtuelle.fr/";
const BASE_SITE = import.meta.env.BASE_URL;   // « / » avec le nom de domaine

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
  { id:78, label:"Écrire un résultat avec son incertitude-type", niveau:"TSTL", icon:"📏", color:"#0f766e",
    component: SimulationIncertitudeType },
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
  { id:83, label:"Diffraction des ondes", niveau:"TSTL", icon:"🌊", color:"#0891b2",
    component: SimulationDiffraction },
  { id:84, label:"Interférences et réseaux", niveau:"TSTL", icon:"🌊", color:"#0e7490",
    component: SimulationInterferences },
  { id:87, label:"Son : spectre, hauteur, timbre et niveau sonore", niveau:"TSTL", icon:"🔊", color:"#0e7490",
    component: SimulationSon },
  { id:88, label:"Échographe : écho, célérité et résolution", niveau:"TSTL", icon:"🩻", color:"#0891b2",
    component: SimulationEchographe },
  { id:91, label:"Échographe 2D : image en éventail, profondeur et fréquence", niveau:"TSTL", icon:"🩺", color:"#0e7490",
    component: SimulationEchographe2D },
  { id:89, label:"Machines thermiques : PAC, groupe froid et COP", niveau:"TSTL", icon:"🔥", color:"#b45309",
    component: SimulationMachinesThermiques },
  { id:85, label:"Acides et bases : pH, pKa, tampon et titrage", niveau:"TSTL", icon:"🧪", color:"#0f766e",
    component: SimulationAcidesBases },
  { id:92, label:"Mécanismes réactionnels : addition de HBr, carbocation et flèches courbes", niveau:"TSTL", icon:"⚗️", color:"#7c3aed", component: SimulationMecanismesReactionnels },
  { id:93, label:"Régiosélectivité de l'addition de HBr : carbocations et produit majoritaire", niveau:"BTS", icon:"⚗️", color:"#7c3aed", component: SimulationRegioselectiviteHBr },
  { id:94, label:"Contrôle cinétique ou thermodynamique : addition de HBr sur le buta-1,3-diène", niveau:"BTS", icon:"⚖️", color:"#ea580c", component: SimulationCinetiqueThermoBTS },
  { id:95, label:"Substitution ou élimination ? SN1, SN2, E1 et E2 sur les halogénoalcanes", niveau:"BTS", icon:"🔀", color:"#0891b2", component: SimulationSubstitutionElimination },
  { id:96, label:"Addition du dibrome sur un alcène : ion bromonium et addition anti", niveau:"BTS", icon:"🟤", color:"#9a3412", component: SimulationAdditionDibrome },
  { id:97, label:"Transposition de carbocation : migration d’un hydrure ou d’un méthyle", niveau:"BTS", icon:"↔️", color:"#7c3aed", component: SimulationTranspositionCarbocation },
  { id:98, label:"Syn ou anti ? Stéréosélectivité et stéréospécificité des additions sur un alcène", niveau:"BTS", icon:"🔁", color:"#7c3aed", component: SimulationSyntheseStereo },
  { id:99, label:"Chimiosélectivité : quel groupe fonctionnel réagit ?", niveau:"BTS", icon:"🎯", color:"#7c3aed", component: SimulationChimioselectivite },
  { id:100, label:"Épaississants associatifs : ASE, HASE, HEUR", niveau:"BTS", icon:"🧴", color:"#1d4ed8", component: SimulationEpaisseursAssociatifs },
  { id:101, label:"Lasure alkyde : séchage oxydant et peau en pot", niveau:"BTS", icon:"🪵", color:"#7c2d12", component: SimulationLasure },
  { id:102, label:"Nomenclature et groupes caractéristiques : nommer, identifier, dessiner", niveau:"1G", icon:"🧬", color:"#0f766e", component: SimulationNomenclatureOrganique },
  { id:86, label:"Synthèse organique : estérification, Dean-Stark et CCM", niveau:"TSTL", icon:"⚗️", color:"#9a3412",
    component: SimulationEsterification },
  { id:90, label:"Optimiser une synthèse : vitesse, rendement et coût", niveau:"TSTL", icon:"📈", color:"#15803d",
    component: SimulationOptimiserSynthese },
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
  { id:106, label:"Travail d’une force et énergie cinétique", niveau:"1G", icon:"🏋️", color:"#3f6212",
    component: SimulationTravail },
  { id:107, label:"Énergies cinétique, potentielle et mécanique", niveau:"1G", icon:"🎢", color:"#3f6212",
    component: SimulationEnergieMeca },
  { id:108, label:"Pointage d’un film et bilan énergétique", niveau:"1G", icon:"🎞️", color:"#3f6212",
    component: SimulationPointage },
  { id:109, label:"Synthèse organique : du protocole au rendement (TP chalcone)", niveau:"1G", icon:"🧫", color:"#0f766e",
    component: SimulationSynthese },
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
  { id:73, label:"Diffraction des rayons X : identifier une structure cubique", niveau:"BTS", icon:"🔷", color:"#1d4ed8",
    component: SimulationDiffractionRX },
  { id:74, label:"Mailles cristallines : motif, compacité et sites", niveau:"BTS", icon:"🧊", color:"#7c3aed",
    component: SimulationMailles },
  { id:75, label:"RMN du proton : du spectre à la structure", niveau:"BTS", icon:"🧲", color:"#0f766e",
    component: SimulationRMN },
  { id:76, label:"RMN ¹³C et 2D : COSY et HSQC", niveau:"BTS", icon:"🧬", color:"#0f766e",
    component: SimulationRMNC2D },
  { id:53, label:"Solubilité et miscibilité : le bilan des interactions", niveau:"1G", icon:"🧪", color:"#2a9d8f",
    component: SimulationSolubilite },
  { id:34, label:"S'APP : extraire les données d'un énoncé", niveau:"COMP", icon:"🎯", color:"#5b4bdb",
    component: SimulationAtelierDonnees },
  { id:35, label:"S'APP : lire un graphique", niveau:"COMP", icon:"📈", color:"#5b4bdb",
    component: SimulationAtelierGraphique },
  { id:36, label:"REA : réaliser un calcul", niveau:"COMP", icon:"🧮", color:"#5b4bdb",
    component: SimulationAtelierRealiser },
  { id:37, label:"ANA : analyser un problème", niveau:"COMP", icon:"🧭", color:"#5b4bdb",
    component: SimulationAtelierAnalyser },
  { id:77, label:"VAL : valider un résultat", niveau:"COMP", icon:"✅", color:"#5b4bdb",
    component: SimulationAtelierValider },
  { id:38, label:"Je m'entraîne ! Travail par compétence", niveau:"COMP", icon:"🏋️", color:"#5b4bdb",
    component: SimulationEntrainement },
    // Pages hors menu (niveau « COMPTE ») : connexion et suivi, ouvertes par les boutons « Mon compte » et « Suivi professeur »
  { id:39, label:"Mon compte", niveau:"COMPTE", icon:"👧👦", color:"#25628f", component: SimulationCompte },
  { id:40, label:"Suivi professeur", niveau:"COMPTE", icon:"📊", color:"#25628f", component: SimulationSuiviProf },
  // Page hors menu : à propos et contact (ouverte depuis le bas du menu et le pied de page)
  { id:47, label:"À propos et contact", niveau:"COMPTE", icon:"ℹ️", color:"#475569", component: SimulationAPropos },
  // Page « Pour les enseignants » (présentation sans jargon, pour les collègues) : hors menu, ouverte depuis le pied de page et l'accueil
  { id:105, label:"Pour les enseignants", niveau:"COMPTE", icon:"🧑‍🏫", color:"#0b4f94", component: SimulationPourEnseignants },
  // Escape game « Mission Kepler » : hors menu, ouvert par son lien (?sim=79)
  { id:79, label:"Mission Kepler (escape game)", niveau:"COMPTE", icon:"🛰️", color:"#0a1530", component: SimulationEscapeKepler },
  // Mini escape game « Mission Aqua » (chapitre Transport des fluides) : hors menu, ?sim=80
  { id:80, label:"Mission Aqua (escape game)", niveau:"COMPTE", icon:"💧", color:"#0b2540", component: SimulationEscapeAqua },
  // Histoire à choix « Une journée au labo » (BTS, d'après le CCF4 : Vinnapas → Orgal) : hors menu, ?sim=81
  // Page d'accueil d'un chapitre (simulations + exercices par compétence) : ?sim=82&chap=<id d'un chapitre de chapitres.js>
  { id:103, label:"Mes fiches", niveau:"COMPTE", icon:"📇", color:"#be185d", component: SimulationFiches },
  // Classement public (étoiles, semaine, défis, régularité) : ouvert à tous, même sans compte, ?sim=104
  { id:104, label:"Classement", niveau:"COMPTE", icon:"🏅", color:"#b45309", component: SimulationClassement },
  { id:82, label:"Page d'un chapitre", niveau:"COMPTE", icon:"📚", color:"#5b4bdb", component: SimulationChapitre },
  { id:81, label:"Une journée au labo (histoire à choix, BTS)", niveau:"COMPTE", icon:"🧪", color:"#0f766e", component: SimulationHistoireLabo },
];
SIMULATIONS.forEach(s => { nomsSim[s.id] = s.label; if (s.niveau === 'COMPTE') simsCachees.add(s.id); });

// Menus de l'en-tête, de gauche à droite (les simulations de chaque niveau viennent de src/chapitres.js)
const MENUS_ENTETE = [
  { key: "2GT", label: "2GT" },
  { key: "1G", label: "1G" },
  { key: "TSTL", label: "TSTL" },
  { key: "BTS", label: "BTS MDC" },
  { key: "COMP", label: "Travail par compétence" },
  { key: "JEUX", label: "🎮 Jeux" },
];
const JEUX_IDS = [79, 80, 81];   // jeux : affichage immersif (sans en-tête ni pied de page)
const FONDS_JEUX = {
  79: "radial-gradient(ellipse at 50% 0%, #1b2a5c 0%, #070d24 55%, #03060f 100%)",
  80: "linear-gradient(180deg, #0b3b5e 0%, #082a45 50%, #04182a 100%)",
  81: "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,.12), rgba(0,0,0,.45) 85%), repeating-linear-gradient(90deg, #7a5a40 0 7px, #6f5037 7px 10px, #7f5f45 10px 19px, #694c34 19px 21px)",
};
const ORDRE_COMP = [38, 34, 35, 37, 36, 77];
function construireMenus() {
  const fiche = s => ({ id: s.id, icon: s.icon, label: s.label, desc: DESCRIPTIONS[s.label] });
  return MENUS_ENTETE.map(m => {
    if (m.key === "JEUX") return { ...m, groupes: [{ sims: [], contenu: ({ aller }) => <EnChargement><JeuxMenu aller={aller} /></EnChargement> }] };
    if (m.key === "COMP") {
      const sims = SIMULATIONS.filter(s => s.niveau === "COMP").sort((a, b) => ORDRE_COMP.indexOf(a.id) - ORDRE_COMP.indexOf(b.id)).map(fiche);
      return { ...m, groupes: [{ sims }] };
    }
    const groupes = [];
    let rubrique = null;
    chapitresDuNiveau(m.key).forEach(c => {
      if (c.rubrique && c.rubrique !== rubrique) groupes.push({ entete: c.rubrique, sims: [] });   // intitulé de rubrique, sur toute la largeur du menu
      rubrique = c.rubrique || rubrique;
      groupes.push({ label: c.label, chap: c.id, sims: c.sims.map(id => SIMULATIONS.find(s => s.id === id)).filter(Boolean).map(fiche) });
    });
    return { ...m, groupes };
  });
}
const MENUS = construireMenus();


// ============================================================
//  COMPOSANT PRINCIPAL
// ============================================================
export default function App() {
  // Cadre invisible de récolte des cartes « À retenir » (voir src/fiches.js) : ouvre le parcours guidé (et chacun de ses parcours s'il y en a plusieurs),
  // puis l'exploration, attend que tout soit affiché, puis prévient la page « Mes fiches ». Chaque attente est un sondage, pas un délai fixe :
  // une simulation lente à charger (graphiques) n'est plus ratée.
  useEffect(() => {
    if (!EN_RECOLTE) return undefined;
    window.__clicAuto = true;
    let annule = false;
    const pause = ms => new Promise(r => setTimeout(r, ms));
    const zone = () => document.getElementById('zone-simulation');
    const boutons = () => [...(zone()?.querySelectorAll('button') || [])];
    const bouton = txt => boutons().find(x => x.textContent.includes(txt) && !x.disabled);
    const attendre = async (cond, max) => { const t0 = Date.now(); while (!annule && Date.now() - t0 < max) { const r = cond(); if (r) return r; await pause(150); } return null; };
    (async () => {
      const sim = simDeLUrl(window.location, BASE_SITE);
      const choixAvant = {}; try { for (let i = 0; i < window.localStorage.length; i++) { const k = window.localStorage.key(i); if (/parcours-choix/.test(k)) choixAvant[k] = window.localStorage.getItem(k); } } catch { /* ignoré */ }
      try {
        const g = await attendre(() => bouton('Parcours guidé'), 12000);
        if (g) {
          g.click();
          await attendre(() => document.querySelector('[data-carte-parcours]'), 6000);
          await pause(1800);
          const nb = boutons().filter(x => /^\d\.\s/.test(x.textContent.trim())).length;   // sélecteur « 1. … 2. … 3. … » des simulations à plusieurs parcours
          for (let k = 0; k < nb && !annule; k++) {
            const c = boutons().filter(x => /^\d\.\s/.test(x.textContent.trim()))[k];
            if (c) { c.click(); await pause(2000); }
          }
        }
        const e = await attendre(() => bouton('Exploration libre'), 4000);
        if (e) { e.click(); await pause(3200); }
        const img = await capturerFigure(); if (img) envoyerFigure(sim, img);
      } catch { /* on rend la main quoi qu'il arrive */ }
      try { Object.entries(choixAvant).forEach(([k, v]) => window.localStorage.setItem(k, v)); } catch { /* ignoré */ }
      if (!annule) finRecolte(sim);
    })();
    return () => { annule = true; };
  }, []);
  const getInitialId = () => {
    const params = new URLSearchParams(window.location.search);
    // lien court d'un exercice : ?c=ANA23 (équivaut à ?sim=…&ex=…)
    const codeParam = params.get('c');
    if (codeParam) {
      const r = resoudreCode(codeParam, SIMULATIONS);
      try {
        const u = new URL(window.location.href); u.searchParams.delete('c');
        if (r) { u.searchParams.set('sim', r.sim); if (r.ex) u.searchParams.set('ex', r.ex); }
        window.history.replaceState(null, '', u.toString());
      } catch { /* adresse non modifiable */ }
      if (r) return r.sim;
      return 0;
    }
    // adresse propre : /sim/2-titrage-direct/ (le « ?sim=N » des anciennes adresses reste prioritaire et fonctionne toujours)
    const idChemin = params.get('sim') ? null : idDepuisChemin(window.location.pathname, BASE_SITE);
    if (idChemin !== null && SIMULATIONS.find(s => s.id === idChemin)) return idChemin;
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
  useEffect(() => { if (SIMS_PLOTLY.has(idAffiche)) chargerPlotly().catch(() => {}); }, [idAffiche]);
  useEffect(() => {
    const check = setInterval(() => {
      if (window.Plotly) { setPlotlyReady(true); clearInterval(check); }
    }, 100);
    return () => clearInterval(check);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const s = SIMULATIONS.find(x => x.id === activeId);
    // Adresse du navigateur : une simulation du menu vit sur son adresse propre (/sim/2-titrage-direct/), les autres pages (compte, suivi, chapitre, fiches)
    // et l'accueil restent sur « ?sim=N » / « / ». Les autres paramètres (ex, devoir, chap…) sont conservés. Le cadre de récolte des fiches garde son adresse.
    if (!EN_RECOLTE) {
      const url = new URL(window.location.href);
      if (s && aAdressePropre(activeId)) { url.pathname = cheminSimulation(activeId, s.label, BASE_SITE); url.searchParams.delete('sim'); }
      else { url.pathname = BASE_SITE; if (activeId === 0) url.searchParams.delete('sim'); else url.searchParams.set('sim', activeId); }
      window.history.replaceState(null, '', url.toString());
    }
    // statistiques anonymes : une consultation par simulation (voir stats.js)
    compter(activeId === 0 ? '/' : `/sim/${activeId}`, s ? s.label : 'Accueil');
    // titre de l'onglet, description et indexation (moteurs de recherche) : mêmes valeurs que celles écrites en dur dans la page statique
    // de la simulation au build (voir src/referencement.js et vite.config.js)
    const propre = !!s && aAdressePropre(activeId);
    const ref = propre ? referencementSimulation(s) : null;
    const titre = ref ? ref.titre : TITRE_ACCUEIL;
    const descSim = ref ? ref.description : DESCRIPTION_ACCUEIL;
    const adresse = ref ? ref.adresse : ADRESSE_SITE;
    document.title = titre;
    const meta = (nom, valeur) => {
      let m = document.querySelector(`meta[name="${nom}"]`);
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', nom); document.head.appendChild(m); }
      m.setAttribute('content', valeur);
    };
    meta('description', descSim);
    const og = (propriete, valeur) => {
      let m = document.querySelector(`meta[property="${propriete}"]`);
      if (!m) { m = document.createElement('meta'); m.setAttribute('property', propriete); document.head.appendChild(m); }
      m.setAttribute('content', valeur);
    };
    og('og:title', titre); og('og:description', descSim); og('og:url', adresse);
    // données structurées (ressource pédagogique) pour les simulations ; retirées sur l'accueil et les pages privées
    let ld = document.getElementById('donnees-structurees');
    if (ref) {
      if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'donnees-structurees'; document.head.appendChild(ld); }
      ld.textContent = JSON.stringify(ref.donnees);
    } else if (ld) ld.remove();
    // pages privées ou sans contenu propre (compte, suivi, chapitre, fiches) : pas indexées
    meta('robots', activeId > 0 && !propre ? 'noindex' : 'index, follow');
    // adresse canonique : les anciennes adresses (?sim=…, ?sim=…&ex=…, ?c=…) affichent la même page que l'adresse propre ;
    // sans cette balise, Google les signale comme « pages en double sans URL canonique ». Pas de canonique pour les pages en noindex.
    let lien = document.querySelector('link[rel="canonical"]');
    if (activeId > 0 && !propre) { if (lien) lien.remove(); }
    else {
      if (!lien) { lien = document.createElement('link'); lien.setAttribute('rel', 'canonical'); document.head.appendChild(lien); }
      lien.setAttribute('href', adresse);
    }
  }, [activeId]);

  // Arrivée par un QR code ou un lien vers un exercice précis (?ex=…) sur un petit écran :
  // on saute l'en-tête et l'introduction pour montrer directement le choix de l'exercice.
  useEffect(() => {
    try {
      if (!new URLSearchParams(window.location.search).get('ex') || window.innerWidth > 700) return;
      const t = setTimeout(() => {
        const cible = document.querySelector('[data-choix-liste]');
        if (cible) window.scrollTo({ top: Math.max(0, (cible.parentElement?.parentElement || cible).getBoundingClientRect().top + window.scrollY - 90), behavior: 'auto' });
      }, 500);
      return () => clearTimeout(t);
    } catch { /* défilement indisponible */ }
  }, []);

  function partager() {
    // l'adresse du navigateur est déjà l'adresse propre (réécrite par l'effet ci-dessus) : on la copie telle quelle
    const url = new URL(window.location.href);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopyMsg('Lien copié !');
      setTimeout(() => setCopyMsg(''), 2000);
    });
  }

  // Ferme le menu et navigue
  confierNavigation(naviguer);
  function naviguer(id, ex, duDevoir) {
    // ex : exercice précis à ouvrir dans un atelier (lu par l'atelier à son ouverture)
    // duDevoir : l'élève vient d'un devoir (l'atelier propose alors « Retour à mon devoir » plutôt que l'exercice suivant)
    try {
      const u = new URL(window.location.href);
      if (ex) u.searchParams.set('ex', ex); else u.searchParams.delete('ex');
      if (id !== 82) { u.searchParams.delete('chap'); u.searchParams.delete('depuis'); }
      if (duDevoir) u.searchParams.set('devoir', '1'); else u.searchParams.delete('devoir');
      window.history.replaceState(null, '', u.toString());
    } catch { /* adresse non modifiable */ }
    setActiveId(id);
  }

  const mission = activeId > 0 ? missionEnCours(activeId) : null;
  if (mission) return (
    <>
      <PictosSprite/>
      <CadreMission mission={mission} naviguer={naviguer}>
        <SuiviTemps simId={activeId} />
        <div id="zone-simulation"><EnChargement><ActiveComponent key={activeId} plotlyReady={plotlyReady} naviguer={naviguer} /></EnChargement></div>
      </CadreMission>
      <ToastRecompense naviguer={naviguer} />
    </>);

  if (JEUX_IDS.includes(activeId)) return (
    <div style={{ ...styles.root, '--entete-h': '0px', background: FONDS_JEUX[activeId], color: '#e5e7eb' }} data-jeu-immersif>
      <PictosSprite/>
      <style>{`@keyframes jeu-entree{from{opacity:0;transform:scale(1.015)}to{opacity:1;transform:none}}@keyframes jeu-barre{from{transform:translateY(-100%)}to{transform:none}}@media (prefers-reduced-motion:reduce){[data-jeu-immersif] *{animation:none!important}}`}</style>
      <div style={{ animation: 'jeu-barre .5s ease-out both', display: 'flex', alignItems: 'center', gap: 12, padding: '10px clamp(12px, 3vw, 24px)', background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <button onClick={() => naviguer(estProf(sessionSb) ? 40 : 38)} aria-label="Quitter le jeu"
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>← Quitter</button>
        <span style={{ flex: 1, textAlign: 'center', fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '0.5px', color: '#fff', fontSize: 'clamp(14px, 3.5vw, 18px)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Emo e={active.icon} t={22}/> {active.label}
        </span>
        <span style={{ width: 72 }} aria-hidden="true" />
      </div>
      <main style={{ ...styles.main, padding: 'clamp(8px, 2vw, 20px)', animation: 'jeu-entree .7s ease-out .1s both' }}>
        <div id="zone-simulation" style={{ textAlign: 'left', flex: 1 }}><EnChargement><ActiveComponent key={activeId} plotlyReady={plotlyReady} naviguer={naviguer} /></EnChargement></div>
        <ToastRecompense naviguer={naviguer} />
      </main>
    </div>);

  return (
    <div style={{ ...styles.root, '--entete-h': '60px' }}>
      <PictosSprite/>
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      <a href="#zone-simulation" className="lien-evitement"
        onClick={e => { e.preventDefault(); const z = document.getElementById('zone-simulation') || document.querySelector('main, h1'); if (z) { z.setAttribute('tabindex', '-1'); z.focus(); z.scrollIntoView(); } }}>Aller au contenu</a>
      <EnTete menus={MENUS} simulations={SIMULATIONS} activeId={activeId} niveauActif={activeId === 0 ? null : active.niveau} naviguer={naviguer} session={sessionSb} />


      {/* Zone principale — pleine largeur */}
      <main style={styles.main}>
        {/* Titre de la simulation (l'en-tête du site, lui, reste fixe en haut) */}
        {activeId > 0 && (
          <div style={{
            ...styles.topBar,
            maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box",
          }}>
            <span aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 18, background: `${active.color}22`, color: active.color, "--ia": `${active.color}55`, display: "grid", placeItems: "center", flexShrink: 0 }}><Emo e={active.icon} t={34}/></span>
            <h1 style={{ ...styles.pageTitle, fontFamily:"'Outfit', sans-serif", color: "#0c1a2e", flex: 1, textAlign: "left", fontSize: "clamp(24px, 3.8vw, 38px)", lineHeight: 1.1, textWrap: "balance" }}>
              <span style={{ fontFamily:"'Outfit', sans-serif", fontWeight:800, letterSpacing:"-0.02em" }}>
                {idAffiche === 39 ? (estEleve(sessionSb) ? 'Mon profil' : sessionSb?.profil ? 'Mon compte' : 'Se connecter') : active.label}
              </span>
            </h1>
            {estProf(sessionSb) && (activeId > 0 && activeId < 34 || activeId >= 41 && activeId !== 47 && activeId !== 79 && activeId !== 80 && activeId !== 81 && activeId !== 103 && activeId !== 104 && activeId !== 105 && activeId !== 82) && (
              <button data-donner-devoir onClick={() => {
                try { window.sessionStorage.setItem('devoir-preset', JSON.stringify({ titre: active.label, cles: [`sim:${activeId}`], eleves: [] })); } catch { /* sans mémorisation, le formulaire s'ouvre vide */ }
                naviguer(40);
              }} style={{ padding:"8px 16px", borderRadius:999, border:"none", background:"#0b4f94", color:"#fff", fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"'Nunito', sans-serif", whiteSpace:"nowrap" }}>
                <Pic n="pin"/>Donner en devoir
              </button>)}
            <button onClick={partager} style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"8px 16px", borderRadius:999, border:"1.5px solid #d5dfeb",
              background: copyMsg ? "#2a9d8f" : "#ffffff",
              color: copyMsg ? "white" : "#334155",
              fontSize:13.5, fontWeight:700, cursor:"pointer",
              transition:"all 0.2s", fontFamily:"'Nunito', sans-serif",
              whiteSpace:"nowrap",
            }}>
              {copyMsg ? '✓ ' + copyMsg : <><Pic n="link"/>Partager</>}
            </button>
          </div>
        )}

        <div style={styles.simContainer}>
          {activeId === 0
            ? <AccueilSite onStart={(id) => naviguer(id || 1)} onCode={naviguer} session={sessionSb} simulations={SIMULATIONS} energyUrl={ENERGY_URL} />
            : <div style={{ textAlign: "left" }}>
                {/* Le fichier App.css du modèle Vite centre tout le texte (#root) : on rétablit l'alignement
                    à gauche pour les simulations ; la page d'accueil garde sa mise en page centrée. */}
                <BandeauContexte key={`b${activeId}`} id={activeId} contexte={CONTEXTES[activeId]} couleur={active.color} />
                {(activeId > 0 && activeId < 34 || activeId >= 41 && activeId !== 47 && activeId !== 79 && activeId !== 80 && activeId !== 81 && activeId !== 103 && activeId !== 104 && activeId !== 105) && <SuiviTemps simId={activeId} />}
                {estEleve(sessionSb) && (activeId > 0 && activeId < 34 || activeId >= 41 && activeId !== 47 && activeId !== 79 && activeId !== 80 && activeId !== 81 && activeId !== 103 && activeId !== 104 && activeId !== 105) && <ProchaineEtape key={`pe${activeId}`} simId={activeId} naviguer={naviguer} />}
                <div id="zone-simulation"><EnChargement><ActiveComponent key={activeId} plotlyReady={plotlyReady} naviguer={naviguer} /></EnChargement></div>
                {activeId > 0 && activeId < 34 || activeId >= 41 && activeId !== 47 && activeId !== 79 && activeId !== 80 && activeId !== 81 && activeId !== 103 && activeId !== 104 && activeId !== 105 ? <ModeParDefaut simId={activeId} cibleId="zone-simulation" /> : null}
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
    background:"#eef3f9", position:"relative", overflow:"clip" },
  bgBlob1: { position:"fixed", top:"-120px", right:"-120px", width:"400px", height:"400px",
    borderRadius:"50%",
    background:"none",
    pointerEvents:"none", zIndex:0 },
  bgBlob2: { position:"fixed", bottom:"-100px", left:"200px", width:"350px", height:"350px",
    borderRadius:"50%",
    background:"none",
    pointerEvents:"none", zIndex:0 },
  main: { flex:1, display:"flex", flexDirection:"column",
    position:"relative", zIndex:1, minWidth:0 },
  topBar: { display:"flex", alignItems:"center", gap:"1rem", padding:"1.25rem 2rem" },
  pageTitle: { fontFamily:"'Playfair Display', Georgia, serif",
    fontSize:"1.5rem", fontWeight:"700", margin:0 },
  simContainer: { flex:1, padding:"1.5rem 2rem", overflowX:"clip" },
};


