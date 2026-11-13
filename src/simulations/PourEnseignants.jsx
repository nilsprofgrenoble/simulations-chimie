import { BoutonMail } from "../contact";
import { nomsSim } from "../suivi";
import { cheminSimulation } from "../slugs";
import "./APropos.css";
import "./PourEnseignants.css";

// ====================================================
//  PAGE 105 — POUR LES ENSEIGNANTS (hors menu : ouverte depuis le pied de page et l'accueil ; adresse propre /sim/105-pour-les-enseignants/)
//  But : lever la peur du premier pas. Un collègue doit comprendre en 30 secondes ce qu'il peut faire SANS rien configurer,
//  puis découvrir (seulement ensuite) le compte enseignant, qui est facultatif.
//  Habillage de « À propos » (APropos.css) + quelques styles propres (PourEnseignants.css).
// ====================================================

// Une simulation d'exemple par niveau : (identifiant, niveau affiché, ce que l'élève y fait). Le titre vient de App.jsx (nomsSim).
const EXEMPLES = [
  { id: 61, niveau: '2GT · Seconde', texte: 'Dissoudre, peser, remplir une fiole jaugée : le protocole se reconstitue étape par étape.' },
  { id: 2, niveau: '1G · Première spé PC', texte: 'Un titrage direct à conduire soi-même : équivalence, volume versé, concentration.' },
  { id: 8, niveau: 'TSTL · Terminale STL', texte: 'Un capteur de lumière Arduino : photorésistance, conditionneur, convertisseur et algorithme de contrôle.' },
  { id: 11, niveau: 'BTS Métiers de la chimie', texte: 'Concevoir la gamme d’étalonnage, exploiter la droite (résidus, limites de détection) et doser un échantillon.' },
];

export function SimulationPourEnseignants({ naviguer }) {
  const base = import.meta.env.BASE_URL;
  // vrai lien (adresse propre, explorable par les moteurs de recherche) qui navigue sans recharger la page
  const lien = id => ({ href: cheminSimulation(id, nomsSim[id] || '', base), onClick: e => { e.preventDefault(); naviguer(id); } });
  return (
    <div className="ap">

      <section className="pe-hero" aria-labelledby="pe-titre">
        <span className="ap-etiquette">Pour les enseignants</span>
        <h1 id="pe-titre">Vos élèves manipulent, <mark>vous gardez la main.</mark></h1>
        <p>La Paillasse virtuelle est un site gratuit de simulations de chimie et de physique, conçu par un professeur pour ses classes. Pour l’essayer : <b>un lien, une simulation, trente secondes.</b> Pas d’inscription, pas d’installation, rien à configurer.</p>
        <a className="ap-bouton" {...lien(2)}>Essayer une simulation</a>
        <a className="ap-bouton" href="#pe-suivi">Suivre mes classes</a>
        <a className="ap-bouton" href={`${base}trajectoire.html`}>Corriger avec Trajectoire</a>
      </section>

      <div className="ap-titre-section"><h2>En classe, c’est simple</h2></div>
      <div className="ap-grille">
        <section className="ap-carte">
          <span className="pe-num" aria-hidden="true">1</span>
          <h3>Un lien ou un code</h3>
          <p>Vous donnez l’adresse d’une simulation, ou le code court d’un exercice (du type ANA23) que l’élève saisit sur la page d’accueil. Ça fonctionne sur téléphone, tablette et ordinateur.</p>
        </section>
        <section className="ap-carte">
          <span className="pe-num" aria-hidden="true">2</span>
          <h3>Trois façons de travailler</h3>
          <p>Chaque simulation propose un parcours guidé pour entrer dans le sujet pas à pas, une exploration libre pour manipuler et se tromper sans risque, puis un défi pour vérifier qu’on a compris.</p>
        </section>
        <section className="ap-carte">
          <span className="pe-num" aria-hidden="true">3</span>
          <h3>Aucun compte pour les élèves</h3>
          <p>Un élève peut travailler sans rien créer : sa progression est mémorisée sur son appareil. Le compte est facultatif et sert à retrouver son travail d’un appareil à l’autre.</p>
        </section>
      </div>

      <div className="ap-titre-section"><h2>Un exemple par niveau</h2></div>
      <nav className="pe-niveaux" aria-label="Exemples de simulations">
        {EXEMPLES.map(e => (
          <a key={e.id} {...lien(e.id)}>
            <b>{e.niveau}</b>
            <span>{nomsSim[e.id] || `Simulation ${e.id}`}</span>
            <small>{e.texte}</small>
          </a>
        ))}
      </nav>

      <div className="ap-titre-section" id="pe-suivi"><h2>Pour suivre vos classes (facultatif)</h2></div>
      <div className="ap-grille">
        <section className="ap-carte">
          <h3>Vos classes, vos élèves</h3>
          <p>Vous créez une classe, le site fabrique les comptes élèves, et vous imprimez des fiches à distribuer (identifiant, mot de passe et QR code de connexion).</p>
        </section>
        <section className="ap-carte">
          <h3>Des devoirs en un clic</h3>
          <p>Un bouton « Donner en devoir » apparaît en haut des simulations : vous composez une liste d’exercices et de simulations avec une date limite, et vous voyez qui l’a fait.</p>
        </section>
        <section className="ap-carte">
          <h3>Ce qui a été raté</h3>
          <p>Le suivi montre qui a travaillé cette semaine, les exercices que plusieurs élèves ont ratés (de quoi préparer une reprise en classe) et les élèves à relancer.</p>
        </section>
      </div>

      <div className="ap-titre-section"><h2>Un compte enseignant, ou simplement une question</h2></div>
      <div className="ap-grille">
        <section className="ap-carte">
          <h3>Demander un compte</h3>
          <p>Le compte enseignant est gratuit. Écrivez-moi en deux lignes (établissement, discipline), je vous réponds rapidement.</p>
          <BoutonMail libelle="Demander un compte enseignant" sujet="Demande de compte enseignant — Paillasse virtuelle" couleur="#0b4f94" plein
            corps={'Bonjour,\n\nJe suis enseignant·e (établissement : …, discipline : …) et je souhaite un compte pour moi et mes classes.\n\nMerci !'} />
        </section>
        <section className="ap-carte">
          <h3>Un coup de main</h3>
          <p>Vous hésitez, ou vous voulez une simulation adaptée à votre séquence ? Écrivez-moi : je préfère un message « je ne comprends pas » à un site qu’on n’ose pas ouvrir.</p>
          <BoutonMail libelle="✉️ Me poser une question" sujet="Question d'enseignant — Paillasse virtuelle" couleur="#0b4f94" plein />
        </section>
        <section className="ap-carte">
          <h3>Utilisation libre</h3>
          <p>Vous pouvez utiliser le site avec vos élèves et en partager les liens sans demander d’autorisation. Il suffit de citer l’auteur (Nils Aronssohn, lycée Argouges, Grenoble). Les conditions détaillées sont dans la page « À propos ».</p>
        </section>
      </div>

    </div>
  );
}
