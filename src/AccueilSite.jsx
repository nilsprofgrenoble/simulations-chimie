import { BoutonMail } from "./contact";
import { A_LA_UNE } from "./aLaUne";
import { ACCENT, TEXTE, TEXTE2, FOND_BLOC } from "./theme";
import { Pic, Emo, AvecPicto } from "./Pictos";
import { CHAPITRES, NIVEAUX_CHAPITRES } from "./chapitres";

// ============================================================
//  PAGE D'ACCUEIL : texte de présentation, récapitulatif des niveaux et de leurs chapitres,
//  simulation mise en avant, Energy@School, contact et rappel discret du compte.
//  (Les simulations se trouvent dans les menus de l'en-tête.)
// ============================================================
const TXT = TEXTE, TXT2 = TEXTE2;
const lame = { background: FOND_BLOC, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', textAlign: 'left' };
const COULEUR_NIVEAU = { '2GT': '#f59e0b', '1G': '#14b8a6', TSTL: '#2563eb', BTS: '#5b4bdb' };
const lien = { all: 'unset', cursor: 'pointer', color: ACCENT, fontWeight: 700, textDecoration: 'underline' };
const gros = { padding: '11px 22px', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 15.5, cursor: 'pointer', fontFamily: 'inherit', background: ACCENT, color: 'white', textDecoration: 'none', display: 'inline-block' };

import { SaisieCode } from "./SaisieCode";
import { InstallerAppli } from "./InstallerAppli";

export function AccueilSite({ onStart, onCode, session, simulations, energyUrl }) {
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

      {/* Code d'un exercice de remédiation + installation sur le téléphone */}
      <section aria-label="Retrouver un exercice" style={{ ...lame, padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
        <SaisieCode onCode={onCode} simulations={simulations} />
        <InstallerAppli />
      </section>

      {/* Les niveaux et leurs chapitres : chaque chapitre ouvre sa première simulation */}
      <section aria-labelledby="titre-niveaux">
        <h2 id="titre-niveaux" style={{ margin: '0 0 12px', fontSize: 21, fontWeight: 800, color: TXT, fontFamily: "'Outfit', sans-serif" }}>Les simulations, par niveau</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {NIVEAUX_CHAPITRES.map(n => {
            const chaps = CHAPITRES.filter(c => c.niveau === n.key);
            const nb = chaps.reduce((t, c) => t + c.sims.length, 0);
            return (
              <div key={n.key} style={{ ...lame, padding: '16px 16px 12px', borderLeft: `5px solid ${COULEUR_NIVEAU[n.key]}` }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: TXT }}>{niveaux[n.key]}</div>
                <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 700, margin: '1px 0 8px' }}>{nb} simulations · {chaps.length} chapitres</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {chaps.map(c => (
                    <li key={c.id}>
                      <button onClick={() => onStart(c.sims[0])} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box', padding: '4px 6px', margin: '0 -6px', borderRadius: 6, fontSize: 13.5, lineHeight: 1.35, color: TXT2, fontWeight: 600 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#eef3f9'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <AvecPicto texte={c.label}/>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lame : simulation mise en avant */}
      {sim && (
        <section style={lame} aria-labelledby="titre-une">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
            <div style={{ fontSize: 56, lineHeight: 1, flexShrink: 0 }} aria-hidden="true"><Emo e={sim.icon} t={56}/></div>
            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ background: ACCENT, color: 'white', fontWeight: 800, fontSize: 12.5, padding: '3px 10px', borderRadius: 999 }}>{A_LA_UNE.badge}</span>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>{A_LA_UNE.niveau || niveaux[sim.niveau]}</span>
              </div>
              <h2 id="titre-une" style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 800, color: TXT, fontFamily: "'Outfit', sans-serif" }}>{sim.label}</h2>
              <p style={{ margin: 0, fontSize: 15, color: TXT2, lineHeight: 1.6 }}>{A_LA_UNE.accroche}</p>
            </div>
            <button onClick={() => onStart(sim.id)} style={gros}>Essayer →</button>
          </div>
        </section>
      )}

      {/* Deux modules : Energy@School et contact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
        <section style={{ ...lame, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="titre-energy">
          <div aria-hidden="true"><Pic n="bolt" t={38}/></div>
          <h2 id="titre-energy" style={{ margin: 0, fontSize: 19, fontWeight: 800, color: TXT, fontFamily: "'Outfit', sans-serif" }}>Energy@School</h2>
          <p style={{ margin: 0, fontSize: 14.5, color: TXT2, lineHeight: 1.6, flex: 1 }}>
            Production, transport, stockage de l’énergie et hydrogène : les simulations pour préparer la journée à Grenoble INP – Ense³.
          </p>
          <a href={energyUrl} style={{ ...gros, alignSelf: 'flex-start' }}>Découvrir le site ↗</a>
        </section>

        <section style={{ ...lame, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="titre-contact">
          <div aria-hidden="true"><Pic n="users" t={38}/></div>
          <h2 id="titre-contact" style={{ margin: 0, fontSize: 19, fontWeight: 800, color: TXT, fontFamily: "'Outfit', sans-serif" }}>Un coup de main pour vos classes ?</h2>
          <p style={{ margin: 0, fontSize: 14.5, color: TXT2, lineHeight: 1.6, flex: 1 }}>
            Prise en main du site, simulation à adapter à votre séquence, idée de nouvelle simulation : n’hésitez pas à me contacter via mon adresse mail académique !
          </p>
          <BoutonMail libelle={<><Pic n="mail"/>Me contacter</>} sujet="Besoin d'un coup de main pour ma classe — Paillasse virtuelle" couleur={ACCENT} plein/>
        </section>
      </div>

      {/* Compte : discret, facultatif */}
      <p style={{ margin: '0 0 6px', textAlign: 'center', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
        {profil
          ? <>Bon retour, <b>{profil.identifiant || profil.nom}</b>. <button onClick={() => onStart(profil.role === 'prof' ? 40 : 39)} style={lien}>Mon espace</button></>
          : <>Un compte est facultatif : il sert à garder sa progression d’un appareil à l’autre. <button onClick={() => onStart(39)} style={lien}>Me connecter ou demander un compte</button></>}
      </p>
    </div>
  );
}
