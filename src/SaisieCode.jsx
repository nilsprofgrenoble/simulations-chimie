import { useState } from "react";
import { resoudreCode } from "./resoudreCode";
import { ACCENT, TEXTE, TEXTE2, BORDURE } from "./theme";

// Champ « J'ai un code » : l'élève tape le code lu sur sa fiche et arrive directement sur l'exercice.
export function SaisieCode({ onCode, simulations, compact }) {
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
      <label style={{ fontSize: compact ? 14 : 15, fontWeight: 800, color: TEXTE }} htmlFor="champ-code">J’ai un code (lu sur ma fiche)</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input id="champ-code" value={v} onChange={e => { setV(e.target.value); setErreur(''); }} placeholder="ex. ANA23" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false}
          style={{ flex: 1, minWidth: 0, fontSize: 16, padding: '8px 10px', borderRadius: 8, border: `2px solid ${BORDURE}`, fontFamily: 'inherit', color: TEXTE }} />
        <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: ACCENT, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Ouvrir</button>
      </div>
      {erreur && <div role="alert" style={{ fontSize: 13, color: '#b91c1c', fontWeight: 700 }}>{erreur}</div>}
      {!erreur && !compact && <div style={{ fontSize: 12.5, color: TEXTE2 }}>Exemples : SAPP4, ANA23, REA2, VAL12 (exercices) ou SIM41 (simulation).</div>}
    </form>
  );
}
