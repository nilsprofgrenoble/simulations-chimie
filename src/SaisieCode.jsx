import { useState } from "react";
import { resoudreCode } from "./resoudreCode";
import { ACCENT, TEXTE, TEXTE2, BORDURE } from "./theme";

// Champ « J'ai un code » : l'élève tape le code lu sur sa fiche et arrive directement sur l'exercice.
export function SaisieCode({ onCode, simulations, compact, sombre }) {
  const [v, setV] = useState('');
  const [erreur, setErreur] = useState('');
  const valider = e => {
    e.preventDefault();
    const r = resoudreCode(v, simulations);
    if (!r) { setErreur('Code inconnu. Vérifie-le : des lettres (SAPP, ANA, REA, VAL ou SIM) puis un numéro, par exemple ANA23.'); return; }
    setErreur(''); setV(''); onCode(r.sim, r.ex);
  };
  return (
    <form onSubmit={valider} style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
      <label style={{ fontSize: compact ? 14 : (sombre ? 22 : 15), fontWeight: 800, color: sombre ? '#ffffff' : TEXTE, fontFamily: sombre ? "'Outfit', sans-serif" : 'inherit' }} htmlFor="champ-code">J’ai un code (lu sur ma fiche)</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input id="champ-code" value={v} onChange={e => { setV(e.target.value); setErreur(''); }} placeholder="ex. ANA23" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false}
          style={{ flex: 1, minWidth: 0, fontSize: 16, padding: '8px 10px', borderRadius: sombre ? 14 : 8, border: sombre ? 'none' : `2px solid ${BORDURE}`, fontFamily: 'inherit', color: TEXTE }} />
        <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: sombre ? '#f5a31a' : ACCENT, color: sombre ? '#3a2500' : 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Ouvrir</button>
      </div>
      {erreur && <div role="alert" style={{ fontSize: 13, color: sombre ? '#ffd9d9' : '#b91c1c', fontWeight: 700 }}>{erreur}</div>}
      {!erreur && !compact && <div style={{ fontSize: 12.5, color: sombre ? '#d3e3f6' : TEXTE2 }}>Exemples : SAPP4, ANA23, REA2, VAL12 (exercices) ou SIM41 (simulation).</div>}
    </form>
  );
}
