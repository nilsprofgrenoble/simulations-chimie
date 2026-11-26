import { useState } from "react";
import { KIT, styleBouton, styleBoite } from "../commun";
import { useSession, estProf } from "../serveur";
import { JEUX_VISIBLES, JEUX_PUBLICS } from "./jeuxVisibles";
import { Emo } from "../Pictos";

// Les trois jeux « hors menu » : escape games TSTL et histoire à choix BTS.
// Côté professeur : cartes avec lien direct. Côté élève : champ « code du jeu » (le code est donné par le professeur).
// Le code n'est PAS une sécurité (il est lisible dans le code de la page) : il évite seulement que les élèves tombent dessus par hasard.
const JEUX = [
  { id: 79, code: 'KEPLER', nom: 'Mission Kepler', niveau: 'TSTL', icone: '🚀', texte: "Escape game spatial : enchaîne les épreuves (mécanique, ondes, signal…) pour sauver la mission. ~45 min." },
  { id: 80, code: 'AQUA', nom: 'Mission Aqua', niveau: 'TSTL', icone: '💧', texte: "Mini escape game sur le transport des fluides (une seule séance, à tester en classe en priorité). ~20 min." },
  { id: 81, code: 'LABO', nom: 'Une journée au labo', niveau: 'BTS MDC', icone: '🧪', texte: "Histoire à choix : technicien·ne de R&D peinture le temps d'une journée (CCF4, remplacer la Vinnapas par l'Orgal). 10 fins, bilan par compétence. < 1 h." },
  { id: 113, code: 'PERCU', nom: 'Contre-typer la Percutaféine', niveau: 'BTS MDC', icone: '🧴', texte: "Histoire à choix : retrouver la formule d'un gel à la caféine, le fabriquer et le contrôler (TP de contre-typage). 6 fins, bilan par compétence. < 1 h." },
  { id: 290, code: 'LASER', nom: 'Laser Maze', niveau: '2GT · 1G', icone: '🔦', texte: "Jeu de puzzle : oriente miroirs, lame de verre et prisme pour envoyer le laser sur la cible (réflexion, réfraction, réflexion totale). 5 niveaux, démo." },
  { id: 291, code: 'URGENCE', nom: 'Urgence au labo : dilutions', niveau: '2GT · 1G', icone: '🧪', texte: "Scénario : un ballon s'emballe sous la paillasse. Prépare vite les bonnes solutions (pipette et fiole jaugées, calculatrice) avant l'explosion. 3 missions, démo." },
  { id: 296, code: 'POMPIER', nom: 'Pompiers : de la lance à la pression', niveau: 'TSTL', icone: '🚒', texte: "Règle diamètre, longueur et débit du tuyau pour que la lance ait la bonne pression et éteigne le feu (Bernoulli, pertes de charge). 6 interventions, démo." },
];

const lien = j => `${window.location.origin}${import.meta.env.BASE_URL}?sim=${j.id}`;

export function JeuxProf(props) { const sess = useSession(); const tous = JEUX_VISIBLES || !!sess?.profil?.admin; return tous || JEUX_PUBLICS.length ? <JeuxProfCartes {...props} liste={tous ? JEUX : JEUX.filter(j => JEUX_PUBLICS.includes(j.id))} /> : null; }
function JeuxProfCartes({ naviguer, liste }) {
  const [copie, setCopie] = useState(null);
  const copier = async j => {
    try { await navigator.clipboard.writeText(lien(j)); setCopie(j.id); setTimeout(() => setCopie(null), 2000); } catch { window.prompt('Copiez ce lien :', lien(j)); }
  };
  return (
    <details data-jeux style={{ ...styleBoite, margin: '10px 0' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 800 }}>🎮 Jeux (escape games et histoire à choix)</summary>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 10, marginTop: 10 }}>
        {liste.map(j => (
          <div key={j.id} style={{ border: `1px solid ${'#d9d2c3'}`, borderRadius: 10, padding: '10px 12px', background: '#fff' }}>
            <div style={{ fontWeight: 800 }}>{j.icone} {j.nom} <span style={{ fontWeight: 500, fontSize: 12, color: KIT.txt2 }}>· {j.niveau}</span></div>
            <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.5, margin: '4px 0 8px' }}>{j.texte}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => naviguer(j.id)} style={styleBouton(true, '#0b4f94')}>Ouvrir ▶</button>
              <button onClick={() => copier(j)} style={styleBouton(false, '#475569')}>{copie === j.id ? 'Lien copié ✓' : 'Copier le lien élève'}</button>
            </div>
            <div style={{ fontSize: 12, color: KIT.txt2, marginTop: 6 }}>Code à donner aux élèves : <b style={{ fontFamily: 'ui-monospace,monospace' }}>{j.code}</b></div>
          </div>))}
      </div>
      <div style={{ fontSize: 12, color: KIT.txt2, marginTop: 8, lineHeight: 1.5 }}>
        Les élèves y accèdent par le lien, ou en saisissant le code sur la page « Je m'entraîne ». Le code n'est pas une vraie protection (il est lisible dans la page) : il sert à ne pas ouvrir les jeux à tout le monde par hasard.
      </div>
    </details>);
}

export function JeuxCode(props) { const sess = useSession(); const tous = JEUX_VISIBLES || !!sess?.profil?.admin; return tous ? <JeuxCodeChamp {...props} /> : JEUX_PUBLICS.length ? <JeuxPublicsCartes {...props} /> : null; }
// Jeux ouverts à tous : accès direct, sans code (les autres jeux, encore en préparation, restent masqués).
function JeuxPublicsCartes({ naviguer }) {
  return (
    <div data-jeux-publics style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {JEUX.filter(j => JEUX_PUBLICS.includes(j.id)).map(j => (
        <section key={j.id} aria-label={`Jeu : ${j.nom}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 18px 16px', borderRadius: 24, color: '#fff',
            background: 'linear-gradient(135deg, #0a3566 0%, #0b4f94 100%)', boxShadow: '0 6px 18px rgba(11,79,148,.28)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span aria-hidden="true" style={{ flex: 'none', width: 56, height: 56, borderRadius: 18, background: '#ffc857', color: '#0a3566', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Emo e={j.icone} t={32} style={{ margin: 0 }} /></span>
            <div style={{ minWidth: 0 }}>
              <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, background: '#f5a31a', color: '#1b2b3a', font: "800 11px Inter, system-ui, sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>Jeu · {j.niveau}</span>
              <div style={{ margin: '4px 0 0', font: "800 20px/1.25 Outfit, Inter, sans-serif", color: '#fff' }}>{j.nom}</div>
            </div>
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.55, color: '#e6f0fb' }}>{j.texte}</div>
          <button type="button" onClick={() => naviguer(j.id)}
            style={{ minHeight: 50, padding: '0 22px', border: 'none', borderRadius: 999, background: '#f5a31a', color: '#1b2b3a', font: "800 16px Inter, system-ui, sans-serif", cursor: 'pointer', alignSelf: 'stretch' }}>Jouer ▶</button>
        </section>))}
    </div>);
}
function JeuxCodeChamp({ naviguer }) {
  const sess = useSession(), tous = JEUX_VISIBLES || !!sess?.profil?.admin;
  const [saisie, setSaisie] = useState(''), [rate, setRate] = useState(false);
  const valider = ev => {
    ev.preventDefault();
    const j = JEUX.find(x => x.code === saisie.trim().toUpperCase() && (tous || JEUX_PUBLICS.includes(x.id)));
    if (j) naviguer(j.id); else setRate(true);
  };
  return (
    <form data-code-jeu onSubmit={valider} style={{ ...styleBoite, fontSize: 13.5, margin: '8px 0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>🎮 Ton professeur t'a donné un <b>code de jeu</b> ?</span>
      <input value={saisie} onChange={ev => { setSaisie(ev.target.value); setRate(false); }} aria-label="Code du jeu" placeholder="CODE" autoCapitalize="characters" autoComplete="off"
        style={{ width: 110, padding: '5px 8px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase' }} />
      <button type="submit" disabled={!saisie.trim()} style={styleBouton(false, '#0b4f94')}>Jouer ▶</button>
      {rate && <span role="alert" style={{ color: '#b45309' }}>Code inconnu.</span>}
    </form>);
}

// Contenu du menu « Jeux » de l'en-tête : le professeur voit les jeux ouverts, l'élève un champ pour son code (ou directement les jeux ouverts à tous).
export function JeuxMenu({ aller }) {
  const sess = useSession();
  const tous = JEUX_VISIBLES || !!sess?.profil?.admin;
  if (estProf(sess)) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(tous ? JEUX : JEUX.filter(j => JEUX_PUBLICS.includes(j.id))).map(j => (
        <button key={j.id} onClick={() => aller(j.id)} style={{ display: 'block', textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: 8, background: 'transparent', cursor: 'pointer', font: 'inherit', fontSize: 14 }}>
          <b>{j.icone} {j.nom}</b> <span style={{ color: KIT.txt2, fontSize: 12 }}>· {j.niveau}{tous ? ` · code ${j.code}` : ''}</span>
          <div style={{ color: KIT.txt2, fontSize: 12.5, lineHeight: 1.4 }}>{j.texte}</div>
        </button>))}
    </div>);
  return <JeuxCode naviguer={aller} />;
}
