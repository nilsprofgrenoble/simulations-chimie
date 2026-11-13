import { BoutonMail } from "../contact";
import "./APropos.css";

// ====================================================
//  PAGE 47 — À PROPOS ET CONTACT (hors menu : ouverte depuis le bas du menu et le pied de page)
//  Même habillage que l'accueil (cartes arrondies, Outfit, bleu #0b4f94, touche orange).
//  Quatre blocs : le projet, les personnes qui m'ont inspiré, les outils et données, l'info pratique.
// ====================================================
const lienExt = { color: '#0b4f94', fontWeight: 700 };

function Personne({ nom, role, children }) {
  return (
    <div className="ap-pers">
      <h4>{nom}</h4>
      <p className="ap-role">{role}</p>
      <p>{children}</p>
    </div>
  );
}

export function SimulationAPropos() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="ap">

      <section className="ap-hero" aria-labelledby="ap-titre">
        <img className="ap-photo" src={`${base}nils-aronssohn.webp`} alt="Nils Aronssohn" width="200" height="200" />
        <div>
          <span className="ap-etiquette">À propos</span>
          <h1 id="ap-titre">Derrière la <mark>Paillasse virtuelle</mark></h1>
          <h2>Pourquoi ce site ?</h2>
          <p>Je voulais que mes élèves puissent manipuler une expérience sans la verrerie : changer un paramètre, observer, recommencer. J’ai commencé par écrire ces simulations en Python, puis en HTML, jusqu’à obtenir le site actuel. Vous pouvez l’utiliser avec vos élèves et en partager les liens sans demander d’autorisation.</p>
          <h2>Qui se cache derrière ?</h2>
          <p>Je suis Nils Aronssohn, professeur de physique-chimie au lycée Argouges, à Grenoble. Je construis ce site pour mes élèves et je le partage avec les collègues qui souhaitent l’utiliser. Les sources et inspirations sont citées plus bas.</p>
          <a className="ap-bouton" href="https://fr.linkedin.com/in/nils-aronssohn" target="_blank" rel="noopener noreferrer">Mon profil LinkedIn ↗</a>
        </div>
      </section>

      <div className="ap-titre-section"><h2>Qui m’a inspiré</h2></div>
      <div className="ap-grille">
        <Personne nom="Marc-Olivier REULA" role="Enseignant en BTS Métiers de la Chimie, ENCPB (Paris)">
          Ma principale source d’inspiration pour ce site. Je n’ai jamais vu quelqu’un tirer autant de choses d’un ordinateur.
        </Personne>
        <Personne nom="Xavier BATAILLE" role="Enseignant en BTS Métiers de la Chimie, ENCPB (Paris)">
          Le modèle de simulation CLHP en phase inverse est issu de ses travaux publiés sur RNChimie (2008). Ses relectures de plusieurs simulations du site m’ont été très précieuses.
        </Personne>
        <Personne nom="Jean LAMERENX" role="Enseignant en CPGE, lycée Louis-le-Grand (Paris)">
          Mon aventure dans le codage a commencé à son atelier Python des JIREC 2024. Les courbes i=f(E) du site sont parties du code qu’il y a partagé.
        </Personne>
      </div>

      <div className="ap-titre-section"><h2>Outils et données</h2></div>
      <div className="ap-grille">
        <Personne nom="Claude (Anthropic)" role="Assistant IA">
          Je développe l’ensemble des simulations par itérations successives en collaboration avec Claude.
        </Personne>
        <Personne nom="MassBank" role="Spectres de masse">
          Les spectres (ionisation électronique 70 eV) de la simulation « CPG couplée à la spectrométrie de masse » viennent de la base ouverte{' '}
          <a href="https://massbank.eu" target="_blank" rel="noopener noreferrer" style={lienExt}>MassBank</a> (Faculty of Engineering, University of Tokyo, <code>MSBNK-Fac_Eng_Univ_Tokyo-…</code>), sous licence{' '}
          <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr" target="_blank" rel="noopener noreferrer" style={lienExt}>CC BY-NC-SA 4.0</a>. Je les ai simplifiés (pics principaux conservés) ; ils gardent leur licence d’origine.
        </Personne>
        <Personne nom="GL Sciences" role="Indices de rétention">
          Les indices de rétention de Kováts utilisés dans les simulations de CPG sont tirés des notes d’application GL Sciences GT063 (colonne apolaire InertCap 5) et GT065 (colonne polaire InertCap WAX), complétés par un modèle de rétention ajusté sur ces données.
        </Personne>
      </div>

      <div className="ap-titre-section"><h2>Infos pratiques</h2></div>
      <div className="ap-grille">
        <section className="ap-carte">
          <h3>Contact</h3>
          <p>Une erreur, une remarque, une idée de simulation, une question sur l’utilisation en classe ? Écrivez-moi.</p>
          <BoutonMail libelle="✉️ Écrire à l’auteur" sujet="Paillasse virtuelle — message" couleur="#0b4f94" plein />
        </section>
        <section className="ap-carte">
          <h3>Licence et réutilisation</h3>
          <p>© {new Date().getFullYear()} Nils Aronssohn. Le site et son contenu sont mis à disposition sous licence{' '}
            <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr" target="_blank" rel="noopener noreferrer" style={lienExt}>CC BY-NC-ND 4.0</a> :
            vous pouvez les consulter, les utiliser et les partager, y compris en classe, à condition de citer l’auteur (Nils Aronssohn, lycée Argouges, Grenoble) et de faire un lien vers paillasse-virtuelle.fr. L’usage commercial, la modification et la republication du code ou des simulations sur un autre site ne sont pas autorisés sans accord de l’auteur. Les données de tiers citées ci-dessus (spectres MassBank notamment) restent soumises à leur propre licence.</p>
        </section>
        <section className="ap-carte">
          <h3>Données personnelles</h3>
          <p>Les statistiques de fréquentation sont anonymes et sans cookie. Le compte élève est facultatif : il enregistre seulement le temps passé sur les simulations et les résultats aux exercices, visibles de l’élève et de son professeur, non notés, et supprimés à la fin de l’année scolaire. Un élève peut, s’il le choisit (case à cocher, décochée par défaut, modifiable à tout moment), apparaître dans le classement public du site : seuls s’affichent alors un pseudo tiré d’une liste (jamais un nom), le nom de son établissement, le nom de sa classe et ses scores.</p>
        </section>
      </div>
    </div>
  );
}
