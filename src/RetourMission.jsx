import { useState, useEffect } from "react";
import { CLE_HORODATAGE } from "./suivi";
import { CLE_PARTIE_KEPLER, ID_ESCAPE } from "./simulations/escapeKeplerConstantes";
import * as Kepler from "./simulations/escapeKeplerModele";
import * as Aqua from "./simulations/escapeAquaModele";

// Bouton flottant « Retour à la station » : visible pendant une mission (Kepler ou Aqua), dans la simulation d'une épreuve.
const JEUX = {
  kepler: { cle: CLE_PARTIE_KEPLER, page: ID_ESCAPE, M: Kepler, texte: 'Retour à la station Kepler', icone: '🚀' },
  aqua: { cle: Aqua.CLE_PARTIE_AQUA, page: Aqua.ID_AQUA, M: Aqua, texte: 'Retour à la station de pompage', icone: '💧' },
};
const lire = (stockage, cle, secours) => { try { return JSON.parse(stockage.getItem(cle) || 'null') ?? secours; } catch { return secours; } };

export default function RetourMission({ activeId, naviguer }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const retour = lire(window.sessionStorage, 'escape-retour', null);
  const jeu = retour && JEUX[retour.jeu || 'kepler'];
  if (!jeu || activeId === jeu.page || retour.sim !== activeId) return null;
  const partie = lire(window.localStorage, jeu.cle, null);
  if (!partie || typeof partie.debut !== 'number') return null;
  const m = [...jeu.M.MODULES, jeu.M.CONTROLE].find(x => x.id === retour.id);
  const horo = lire(window.localStorage, CLE_HORODATAGE, {});
  const fait = m && (horo[`${m.sim}:defi.principal`] || 0) >= partie.debut;
  const classe = partie.mode === 'classe';
  return (
    <button type="button" data-retour-mission onClick={() => naviguer(jeu.page)}
      style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999, background: fait ? '#3be29a' : '#0a1530', color: fait ? '#04122e' : '#e6f0ff', border: '2px solid #38e1ff', borderRadius: 999, padding: '10px 16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 18px rgba(0,0,0,.35)', font: 'inherit' }}>
      {fait ? '✅ Réparé : retour à la mission' : `${jeu.icone} ${jeu.texte}`}{classe ? ` · T−${jeu.M.mmss(Math.max(0, jeu.M.restant(partie, now)))}` : ''}
    </button>);
}
