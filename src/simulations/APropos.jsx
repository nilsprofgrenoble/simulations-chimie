import { cardStyle, KIT, styleBoite } from "../commun";

// ====================================================
//  PAGE 47 — À PROPOS ET CONTACT (hors menu : ouverte depuis le bas du menu et le pied de page)
// ====================================================
export function SimulationAPropos() {
  const titre = t => <div style={{ fontSize: 16, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{t}</div>;
  const para = { fontSize: 14.5, color: KIT.txt, lineHeight: 1.65, margin: 0 };
  return (
    <div style={{ ...cardStyle, textAlign: 'left', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={styleBoite}>
          {titre('Le site')}
          <p style={para}>La <strong>Paillasse virtuelle</strong> regroupe des simulations interactives de chimie et de physique pour la Première spécialité physique-chimie, la Terminale STL et le BTS Métiers de la chimie. Chaque simulation se travaille en <strong>parcours guidé</strong>, en <strong>exploration libre</strong> ou en <strong>défi</strong>. Le site est en accès libre : vous pouvez l’utiliser avec vos élèves et partager ses liens sans demander d’autorisation.</p>
        </div>
        <div style={styleBoite}>
          {titre('Qui a développé ce site ?')}
          <p style={para}>Le site a été conçu et développé par <strong>Nils Aronssohn</strong>, professeur de physique-chimie au lycée Argouges (Grenoble). Les sources et inspirations sont citées ci-dessous.</p>
        </div>
        <div style={styleBoite}>
          {titre('📚 Sources et inspirations')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><span style={{ fontSize: 20, flexShrink: 0 }}>🎨</span><p style={{ ...para, fontSize: 14 }}><strong>Marc-Olivier REULA</strong> — Enseignant en BTS Métiers de la Chimie à l’ENCPB (Paris). Source d’inspiration pour la conception de ce site.</p></div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span><p style={{ ...para, fontSize: 14 }}><strong>Jean LAMERENX</strong> — Enseignant en CPGE au lycée Louis-le-Grand (Paris). Les courbes i=f(E) ont été codées initialement en Python et partagées lors des JIREC 2024.</p></div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><span style={{ fontSize: 20, flexShrink: 0 }}>💻</span><p style={{ ...para, fontSize: 14 }}><strong>Xavier BATAILLE</strong> — Enseignant en BTS Métiers de la Chimie à l’ENCPB (Paris). Le modèle de simulation CLHP en phase inverse est issu de ses travaux publiés sur RNChimie (2008).</p></div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span><p style={{ ...para, fontSize: 14 }}><strong>Claude (Anthropic)</strong> — L’ensemble des simulations a été développé par itérations successives en collaboration avec Claude, assistant IA d’Anthropic.</p></div>
          </div>
        </div>
        <div style={styleBoite}>
          {titre('Contact')}
          <p style={para}>Une erreur, une remarque, une idée de simulation, une question sur l’utilisation en classe ? Écrivez-moi :<br/>
            <a href="mailto:nils.aronssohn@ac-grenoble.fr" style={{ color: '#0284c7', fontWeight: 700 }}>✉️ nils.aronssohn@ac-grenoble.fr</a></p>
        </div>
        <div style={styleBoite}>
          {titre('Licence et réutilisation')}
          <p style={para}>© {new Date().getFullYear()} Nils Aronssohn. Le site et son contenu sont mis à disposition sous licence{' '}
            <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7' }}>CC BY-NC-ND 4.0</a> :
            vous pouvez les consulter, les utiliser et les partager, y compris en classe, à condition de citer l’auteur (Nils Aronssohn, lycée Argouges, Grenoble) et de faire un lien vers paillasse-virtuelle.fr. L’usage commercial, la modification et la republication du code ou des simulations sur un autre site ne sont pas autorisés sans accord de l’auteur.</p>
        </div>
        <div style={styleBoite}>
          {titre('Données personnelles')}
          <p style={para}>Les statistiques de fréquentation sont anonymes et sans cookie. Le compte élève est facultatif : il enregistre seulement le temps passé sur les simulations et les résultats aux exercices, visibles de l’élève et de son professeur, non notés, et supprimés à la fin de l’année scolaire.</p>
        </div>
      </div>
    </div>
  );
}
