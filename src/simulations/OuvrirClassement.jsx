import { useState } from "react";
import { KIT, styleBouton } from "../commun";
import { Pic } from "../Pictos";

// ═══════════════════════════════════════════════════════════════════════════
//  « OUVRIR LE CLASSEMENT » : bandeau affiché en haut du suivi d'une classe tant que son établissement n'est pas indiqué.
//  Indiquer l'établissement est ce qui « allume » le classement public pour la classe (les élèves voient alors la case à cocher).
//  Un seul champ, un seul bouton ; le nom est pré-rempli avec celui d'une autre classe du professeur ; on peut l'appliquer d'un coup
//  à ses autres classes qui n'en ont pas. Rien n'est public tant qu'un élève n'a pas coché lui-même la case.
//    classe       : la classe affichée
//    suggestion   : établissement déjà utilisé pour une autre classe du professeur ('' si aucun)
//    autres       : les autres classes du professeur sans établissement [{ id, nom }]
//    onOuvrir     : (etablissement, aussiLesAutres) => void
// ═══════════════════════════════════════════════════════════════════════════
export function OuvrirClassement({ classe, suggestion, autres, occupe, onOuvrir, onPlusTard }) {
  const [saisie, setSaisie] = useState(suggestion || ''), [aussi, setAussi] = useState(true);
  const propre = saisie.trim().replace(/\s+/g, ' ');
  const valide = propre.length >= 2 && propre.length <= 60;
  return (
    <section data-ouvrir-classement aria-label="Ouvrir le classement public"
      style={{ background: '#fff7ed', border: '1.5px solid #fdba74', borderRadius: 22, padding: '16px 20px', margin: '0 0 14px', textAlign: 'left' }}>
      <h3 style={{ margin: '0 0 4px', font: '800 18px Outfit, Inter, sans-serif', color: '#7c2d12' }}><Pic n="medal"/>Ouvrir le classement pour « {classe.nom} »</h3>
      <p style={{ margin: '0 0 10px', fontSize: 14.5, lineHeight: 1.5, color: KIT.txt }}>
        Pour l’instant, vos élèves ne voient pas la case « Apparaître dans le classement ». Indiquez le nom de l’établissement pour l’ouvrir.
        Rien n’est public tant qu’un élève ne l’a pas coché lui-même (désactivé par défaut) ; il apparaît alors sous un pseudo, avec cet établissement et le nom de la classe.
      </p>
      <form onSubmit={e => { e.preventDefault(); if (valide) onOuvrir(propre, autres.length > 0 && aussi); }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontWeight: 700, fontSize: 14 }} htmlFor="ouvrir-etab">Établissement</label>
        <input id="ouvrir-etab" value={saisie} maxLength={60} onChange={e => setSaisie(e.target.value)} placeholder="Lycée Argouges"
          style={{ padding: '8px 10px', fontSize: 15, borderRadius: 12, border: `1px solid ${KIT.bord}`, boxSizing: 'border-box', minWidth: 220, flex: '1 1 220px' }} />
        <button type="submit" style={styleBouton(true, '#c2410c')} disabled={occupe || !valide}>Ouvrir le classement</button>
        {onPlusTard && <button type="button" onClick={onPlusTard} style={styleBouton(false, '#475569')}>Plus tard</button>}
      </form>
      {autres.length > 0 && (
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 10, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={aussi} onChange={e => setAussi(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, accentColor: '#c2410c', flex: 'none' }} />
          <span>Faire de même pour mes {autres.length === 1 ? 'autre classe' : `${autres.length} autres classes`} sans établissement
            <span style={{ color: KIT.txt2 }}> ({autres.map(c => c.nom).join(', ')})</span></span>
        </label>)}
    </section>);
}
