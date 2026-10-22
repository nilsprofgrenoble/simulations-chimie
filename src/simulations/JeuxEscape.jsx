import { useState } from "react";
import { KIT, styleBouton, styleBoite } from "../commun";

// Les trois jeux « hors menu » : escape games TSTL et histoire à choix BTS.
// Côté professeur : cartes avec lien direct. Côté élève : champ « code du jeu » (le code est donné par le professeur).
// Le code n'est PAS une sécurité (il est lisible dans le code de la page) : il évite seulement que les élèves tombent dessus par hasard.
const JEUX = [
  { id: 79, code: 'KEPLER', nom: 'Mission Kepler', niveau: 'TSTL', icone: '🚀', texte: "Escape game spatial : enchaîne les épreuves (mécanique, ondes, signal…) pour sauver la mission. ~45 min." },
  { id: 80, code: 'AQUA', nom: 'Mission Aqua', niveau: 'TSTL', icone: '💧', texte: "Mini escape game sur le transport des fluides (une seule séance, à tester en classe en priorité). ~20 min." },
  { id: 81, code: 'LABO', nom: 'Une journée au labo', niveau: 'BTS MDC', icone: '🧪', texte: "Histoire à choix : technicien·ne de R&D peinture le temps d'une journée (CCF4 Orgal → Vinnapas). 9 fins, bilan par compétence. < 1 h." },
];

const lien = j => `${window.location.origin}${window.location.pathname}?sim=${j.id}`;

export function JeuxProf({ naviguer }) {
  const [copie, setCopie] = useState(null);
  const copier = async j => {
    try { await navigator.clipboard.writeText(lien(j)); setCopie(j.id); setTimeout(() => setCopie(null), 2000); } catch { window.prompt('Copiez ce lien :', lien(j)); }
  };
  return (
    <details data-jeux style={{ ...styleBoite, margin: '10px 0' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 800 }}>🎮 Jeux (escape games et histoire à choix)</summary>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 10, marginTop: 10 }}>
        {JEUX.map(j => (
          <div key={j.id} style={{ border: `1px solid ${'#d9d2c3'}`, borderRadius: 10, padding: '10px 12px', background: '#fff' }}>
            <div style={{ fontWeight: 800 }}>{j.icone} {j.nom} <span style={{ fontWeight: 500, fontSize: 12, color: KIT.txt2 }}>· {j.niveau}</span></div>
            <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.5, margin: '4px 0 8px' }}>{j.texte}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => naviguer(j.id)} style={styleBouton(true, '#0f766e')}>Ouvrir ▶</button>
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

export function JeuxCode({ naviguer }) {
  const [saisie, setSaisie] = useState(''), [rate, setRate] = useState(false);
  const valider = ev => {
    ev.preventDefault();
    const j = JEUX.find(x => x.code === saisie.trim().toUpperCase());
    if (j) naviguer(j.id); else setRate(true);
  };
  return (
    <form data-code-jeu onSubmit={valider} style={{ ...styleBoite, fontSize: 13.5, margin: '8px 0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>🎮 Ton professeur t'a donné un <b>code de jeu</b> ?</span>
      <input value={saisie} onChange={ev => { setSaisie(ev.target.value); setRate(false); }} aria-label="Code du jeu" placeholder="CODE" autoCapitalize="characters" autoComplete="off"
        style={{ width: 110, padding: '5px 8px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase' }} />
      <button type="submit" disabled={!saisie.trim()} style={styleBouton(false, '#0f766e')}>Jouer ▶</button>
      {rate && <span role="alert" style={{ color: '#b45309' }}>Code inconnu.</span>}
    </form>);
}
