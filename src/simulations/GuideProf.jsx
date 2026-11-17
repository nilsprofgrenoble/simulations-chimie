import { KIT, styleBouton } from "../commun";
import { Pic } from "../Pictos";
import { ACCENT, TEXTE, TEXTE2 } from "../theme";

const urlGuide = (ext) => `${import.meta.env.BASE_URL}guides/guide-eleve-paillasse.${ext}`;

// Guide express du suivi professeur : le parcours d'une classe en 5 minutes. Ouvert tant qu'il n'y a aucune classe, replié ensuite.
const ETAPES = [
  ['Créer la classe', <>Bouton <b>« ＋ Nouvelle classe »</b> : un nom (« TSTL 1 »), le préfixe se propose tout seul, le nombre d’élèves. Les comptes sont créés d’un coup ; aucun nom d’élève n’est saisi sur le site.</>],
  ['Distribuer les fiches', <>Juste après la création : <b>« 🖨️ Imprimer les fiches »</b>. Les mots de passe ne sont affichés qu’une fois. Chaque fiche porte un <b>QR code</b> : l’élève le scanne, l’identifiant est déjà rempli, il tape son mot de passe. Joignez le <b>guide de prise en main pour les élèves</b> (une page, PDF ou Word) : <a href={urlGuide('pdf')} target="_blank" rel="noopener">le télécharger</a>.</>],
  ['Donner un devoir', <>Sur n’importe quelle simulation, le bouton <b>« 📌 Donner en devoir »</b> (en haut à droite) ouvre le formulaire déjà rempli : il ne reste qu’à choisir une date limite. Sinon, onglet <b>Devoirs</b>. L’élève avance pas à pas : parcours guidé, puis défi, puis la suite.</>],
  ['Suivre la classe', <>Onglet <b>Vue d’ensemble</b> : élèves actifs, exercices à reprendre en classe, élèves à relancer. L’onglet <b>Élèves</b> donne le détail de chacun ; <b>Statistiques</b> les chiffres par exercice, défi et simulation.</>],
  ['Voir ce que voit un élève', <>Le bouton <b>« Voir comme un élève »</b> montre l’espace d’un élève à ses différentes étapes : soit des élèves fictifs, soit un vrai élève de votre classe (ses séances, les devoirs et la vie de classe tels que lui les voit, en lecture seule). Le bouton « 👁 Voir comme cet élève » de l’onglet Élèves y mène directement : à essayer avant de distribuer les fiches.</>],
  ['Mot de passe perdu ?', <>Onglet <b>Élèves</b>, bouton 🔑 sur la ligne de l’élève : un nouveau mot de passe est généré (l’ancien ne marche plus).</>],
];

export function GuideProf({ ouvertParDefaut }) {
  return (
    <details open={ouvertParDefaut} data-guide-prof style={{ margin: '8px 0 10px', background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '0 14px' }}>
      <summary style={{ cursor: 'pointer', padding: '10px 0', fontSize: 14.5, fontWeight: 800, color: TEXTE }}>📖 Guide express pour enseignant : mettre en route une classe en 5 minutes</summary>
      <ol style={{ margin: '0 0 12px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {ETAPES.map(([titre, texte], i) => (
          <li key={titre} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: TEXTE2, lineHeight: 1.55 }}>
            <span aria-hidden="true" style={{ flex: 'none', width: 24, height: 24, borderRadius: '50%', background: ACCENT, color: '#fff', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
            <span><b style={{ color: TEXTE }}>{titre}.</b> {texte}</span>
          </li>))}
      </ol>
    </details>);
}


// Guide de prise en main à distribuer aux élèves : PDF prêt à imprimer + version Word modifiable (fichiers dans public/guides/)
const LIEN = { textDecoration: 'none', display: 'inline-block' };
export function BoutonsGuideEleve({ taille, sombre }) {
  const petit = taille === 'petit' ? { fontSize: 13, padding: '6px 12px' } : {};
  const pdf = sombre ? { background: '#f5a31a', color: '#3a2500', border: 'none', fontWeight: 800 } : styleBouton(true, '#0b4f94');
  const word = sombre ? { background: 'transparent', color: '#fff', border: '2px solid #fff', fontWeight: 800 } : styleBouton(false, '#475569');
  return (<>
    <a href={urlGuide('pdf')} target="_blank" rel="noopener" style={{ ...styleBouton(true, '#0b4f94'), ...pdf, ...LIEN, ...petit }}>{sombre ? 'PDF à imprimer' : 'Guide élève (PDF)'}</a>
    <a href={urlGuide('docx')} download style={{ ...styleBouton(false, '#475569'), ...word, ...LIEN, ...petit }}>Version Word modifiable</a>
  </>);
}
// Bloc bien visible de l'onglet « Mon compte » : grand aplat bleu, comme les blocs de l'accueil
export function GuideEleveProf() {
  return (
    <section data-guide-eleve-prof aria-label="Guide pour les élèves" style={{ background: '#0b4f94', color: '#fff', borderRadius: 22, padding: '20px 22px', margin: '12px 0' }}>
      <div style={{ font: '700 12px Inter, system-ui, sans-serif', letterSpacing: '.09em', textTransform: 'uppercase', color: '#d3e3f6', marginBottom: 6 }}>À donner à vos élèves</div>
      <h3 style={{ margin: '0 0 6px', font: '800 23px Outfit, Inter, sans-serif', color: '#fff' }}>Guide de prise en main pour les élèves</h3>
      <p style={{ margin: '0 0 14px', fontSize: 14.5, lineHeight: 1.55, color: '#d3e3f6' }}>Une page à distribuer avec les identifiants ou à déposer sur Moodle : connexion, les trois modes d’une simulation, exercices, niveaux, classement.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><BoutonsGuideEleve sombre /></div>
    </section>);
}
