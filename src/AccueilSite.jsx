import { BoutonMail } from "./contact";
import { A_LA_UNE } from "./aLaUne";

// ============================================================
//  PAGE D'ACCUEIL : texte de présentation, invitation à se connecter,
//  simulation mise en avant, Energy@School et contact.
//  (Les simulations se trouvent dans les menus de l'en-tête.)
// ============================================================
const TXT = '#0f172a', TXT2 = '#334155', VERT = '#0f766e';
const lame = { background: 'white', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', textAlign: 'left' };
const gros = { padding: '11px 22px', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 15.5, cursor: 'pointer', fontFamily: 'inherit' };

export function AccueilSite({ onStart, session, simulations, energyUrl }) {
  const profil = session?.profil;
  const sim = simulations.find(s => s.id === A_LA_UNE.id);
  const niveaux = { '2GT': 'Seconde', '1G': 'Première spé PC', TSTL: 'Terminale STL', BTS: 'BTS Métiers de la chimie' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 940, margin: '0 auto', fontFamily: "Inter, system-ui, Arial" }}>

      {/* Présentation */}
      <section style={{ textAlign: 'center', padding: '14px 8px 4px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, color: TXT, margin: '0 0 10px', letterSpacing: '-0.5px' }}>Paillasse virtuelle</h1>
        <p style={{ fontSize: 18, color: TXT2, lineHeight: 1.6, maxWidth: 640, margin: '0 auto 10px', fontWeight: 600 }}>
          Manipuler, se tromper, recommencer : la paillasse du labo, sans la verrerie.
        </p>
        <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.65, maxWidth: 680, margin: '0 auto' }}>
          Des simulations de chimie et de physique pour la Seconde, la Première spé PC, la Terminale STL et le BTS Métiers de la chimie :
          parcours guidés, exploration libre, défis et exercices par compétence. Choisissez votre niveau dans le menu en haut de page.
        </p>
      </section>

      {/* Lame : se connecter */}
      <section style={{ ...lame, background: '#fff8e6', borderColor: '#f0dca0' }} aria-labelledby="titre-compte">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            <h2 id="titre-compte" style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 800, color: TXT, fontFamily: "'Outfit', sans-serif" }}>
              {profil ? `Bon retour, ${profil.identifiant || profil.nom} !` : 'Gardez la trace de tout ce que vous réussissez'}
            </h2>
            <p style={{ margin: '0 0 10px', fontSize: 15, color: TXT2, lineHeight: 1.6 }}>
              {profil
                ? 'Retrouvez vos étoiles, vos paliers et votre progression dans votre espace.'
                : 'Avec un compte, votre progression vous suit d’un ordinateur à l’autre et vos exercices comptent. Pas besoin de compte pour essayer : tout reste utilisable sans.'}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 14, color: TXT, fontWeight: 700 }}>
              <li><span aria-hidden="true">★</span> Des étoiles à gagner</li>
              <li><span aria-hidden="true">🌳</span> Des paliers par compétence</li>
              <li><span aria-hidden="true">🏅</span> Des badges à débloquer</li>
              <li><span aria-hidden="true">👩‍🏫</span> Pour les profs : classes, devoirs et suivi</li>
            </ul>
          </div>
          <button onClick={() => onStart(profil?.role === 'prof' ? 40 : 39)} style={{ ...gros, background: '#b45309', color: 'white', boxShadow: '0 4px 14px #b4530944' }}>
            {profil ? 'Mon espace →' : 'Me connecter ou demander un compte →'}
          </button>
        </div>
      </section>

      {/* Lame : simulation mise en avant */}
      {sim && (
        <section style={{ ...lame, borderLeft: `8px solid ${VERT}` }} aria-labelledby="titre-une">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
            <div style={{ fontSize: 56, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">{sim.icon}</div>
            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ background: VERT, color: 'white', fontWeight: 800, fontSize: 12.5, padding: '3px 10px', borderRadius: 999 }}>{A_LA_UNE.badge}</span>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>{A_LA_UNE.niveau || niveaux[sim.niveau]}</span>
              </div>
              <h2 id="titre-une" style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 800, color: TXT, fontFamily: "'Outfit', sans-serif" }}>{sim.label}</h2>
              <p style={{ margin: 0, fontSize: 15, color: TXT2, lineHeight: 1.6 }}>{A_LA_UNE.accroche}</p>
            </div>
            <button onClick={() => onStart(sim.id)} style={{ ...gros, background: VERT, color: 'white', boxShadow: `0 4px 14px ${VERT}44` }}>Essayer →</button>
          </div>
        </section>
      )}

      {/* Deux modules : Energy@School et contact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
        <section style={{ ...lame, display: 'flex', flexDirection: 'column', gap: 10, background: 'linear-gradient(135deg, #fff1e6, #eaf6ec)', borderColor: '#f2c9a8' }} aria-labelledby="titre-energy">
          <div style={{ fontSize: 34 }} aria-hidden="true">⚡</div>
          <h2 id="titre-energy" style={{ margin: 0, fontSize: 19, fontWeight: 800, color: TXT, fontFamily: "'Outfit', sans-serif" }}>Energy@School</h2>
          <p style={{ margin: 0, fontSize: 14.5, color: TXT2, lineHeight: 1.6, flex: 1 }}>
            Production, transport, stockage de l’énergie et hydrogène : les simulations pour préparer la journée à Grenoble INP – Ense³.
          </p>
          <a href={energyUrl} style={{ ...gros, background: '#c2410c', color: 'white', textDecoration: 'none', alignSelf: 'flex-start', display: 'inline-block' }}>Découvrir le site ↗</a>
        </section>

        <section style={{ ...lame, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="titre-contact">
          <div style={{ fontSize: 34 }} aria-hidden="true">🤝</div>
          <h2 id="titre-contact" style={{ margin: 0, fontSize: 19, fontWeight: 800, color: TXT, fontFamily: "'Outfit', sans-serif" }}>Un coup de main pour vos classes ?</h2>
          <p style={{ margin: 0, fontSize: 14.5, color: TXT2, lineHeight: 1.6, flex: 1 }}>
            Prise en main du site, simulation à adapter à votre séquence, devoir à construire, idée de nouvelle simulation : écrivez-moi, on trouvera ensemble.
          </p>
          <BoutonMail libelle="✉️ Me contacter" sujet="Besoin d'un coup de main pour ma classe — Paillasse virtuelle" couleur="#0f766e"/>
        </section>
      </div>
    </div>
  );
}
