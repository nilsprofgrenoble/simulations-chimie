import { KIT } from "../commun";
import { ACCENT, TEXTE, TEXTE2 } from "../theme";

// Guide express du suivi professeur : le parcours d'une classe en 5 minutes. Ouvert tant qu'il n'y a aucune classe, replié ensuite.
const ETAPES = [
  ['Créer la classe', <>Bouton <b>« ＋ Nouvelle classe »</b> : un nom (« TSTL 1 »), le préfixe se propose tout seul, le nombre d’élèves. Les comptes sont créés d’un coup ; aucun nom d’élève n’est saisi sur le site.</>],
  ['Distribuer les fiches', <>Juste après la création : <b>« 🖨️ Imprimer les fiches »</b>. Les mots de passe ne sont affichés qu’une fois. Chaque fiche porte un <b>QR code</b> : l’élève le scanne, l’identifiant est déjà rempli, il tape son mot de passe.</>],
  ['Donner un devoir', <>Sur n’importe quelle simulation, le bouton <b>« 📌 Donner en devoir »</b> (en haut à droite) ouvre le formulaire déjà rempli : il ne reste qu’à choisir une date limite. Sinon, onglet <b>Devoirs</b>. L’élève avance pas à pas : parcours guidé, puis défi, puis la suite.</>],
  ['Suivre la classe', <>Onglet <b>Synthèse</b> : élèves actifs, exercices à reprendre en classe, élèves à relancer. L’onglet <b>Élèves</b> donne le détail de chacun ; <b>Détail</b> les chiffres par exercice, défi et simulation.</>],
  ['Voir ce que voit un élève', <>Le bouton <b>« 👁 Aperçu élève »</b> montre l’espace d’un élève (données fictives) à ses différentes étapes : à essayer avant de distribuer les fiches.</>],
  ['Mot de passe perdu ?', <>Onglet <b>Élèves</b>, bouton 🔑 sur la ligne de l’élève : un nouveau mot de passe est généré (l’ancien ne marche plus).</>],
];

export function GuideProf({ ouvertParDefaut }) {
  return (
    <details open={ouvertParDefaut} data-guide-prof style={{ margin: '8px 0 10px', background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '0 14px' }}>
      <summary style={{ cursor: 'pointer', padding: '10px 0', fontSize: 14.5, fontWeight: 800, color: TEXTE }}>📖 Guide express : mettre en route une classe en 5 minutes</summary>
      <ol style={{ margin: '0 0 12px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {ETAPES.map(([titre, texte], i) => (
          <li key={titre} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: TEXTE2, lineHeight: 1.55 }}>
            <span aria-hidden="true" style={{ flex: 'none', width: 24, height: 24, borderRadius: '50%', background: ACCENT, color: '#fff', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
            <span><b style={{ color: TEXTE }}>{titre}.</b> {texte}</span>
          </li>))}
      </ol>
    </details>);
}
