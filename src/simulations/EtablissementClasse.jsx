import { useState } from "react";
import { KIT, styleBouton, styleBoite } from "../commun";

// ═══════════════════════════════════════════════════════════════════════════
//  « ÉTABLISSEMENT » d'une classe (réglages de classe du suivi professeur).
//  Ce nom s'affiche dans le CLASSEMENT PUBLIC, à côté du pseudo et du nom de la classe, pour les seuls élèves qui ont choisi d'y apparaître.
//  Tant qu'il n'est pas renseigné, aucun élève de la classe n'apparaît dans le classement.
//  dispo : false si supabase/13-classement.sql n'a pas encore été exécuté.
// ═══════════════════════════════════════════════════════════════════════════
export function EtablissementClasse({ classe, dispo, occupe, onEnregistrer }) {
  const actuel = (classe.etablissement || '').trim();
  const [saisie, setSaisie] = useState(actuel);      // le parent donne une « key » (classe + établissement) : la saisie repart de la valeur enregistrée
  if (!dispo) {
    return (
      <div style={{ ...styleBoite, margin: '6px 0 8px', fontSize: 13.5 }}>
        <b>🏫 Établissement</b> (pour le classement public) : disponible après avoir exécuté <code>supabase/13-classement.sql</code> dans Supabase (SQL Editor → Run).
      </div>);
  }
  const propre = saisie.trim().replace(/\s+/g, ' ');
  const valide = propre.length === 0 || (propre.length >= 2 && propre.length <= 60);
  return (
    <div style={{ ...styleBoite, margin: '6px 0 8px', fontSize: 13.5 }} data-etablissement>
      <form onSubmit={e => { e.preventDefault(); if (valide && propre !== actuel) onEnregistrer(propre); }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontWeight: 700 }} htmlFor="etab-classe">🏫 Établissement</label>
        <input id="etab-classe" value={saisie} maxLength={60} onChange={e => setSaisie(e.target.value)} placeholder="Lycée Argouges"
          style={{ padding: '7px 9px', fontSize: 14, borderRadius: 12, border: `1px solid ${KIT.bord}`, boxSizing: 'border-box', minWidth: 220 }} />
        <button type="submit" style={styleBouton(false, '#475569')} disabled={occupe || !valide || propre === actuel}>Enregistrer</button>
      </form>
      <div style={{ color: KIT.txt2, marginTop: 4 }}>
        Affiché dans le <b>classement public</b> (avec le pseudo et le nom de la classe) pour les élèves de « {classe.nom} » qui ont choisi d’y apparaître ; chaque élève décide pour lui-même.
        {actuel ? '' : ' Tant que ce champ est vide, aucun élève de cette classe n’apparaît dans le classement.'}
      </div>
    </div>);
}
