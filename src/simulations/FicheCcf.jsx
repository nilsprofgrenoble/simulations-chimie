import { useState } from "react";
import { ficheCcf, pn } from "./laboJournee";

// Fiche d'auto-évaluation au format des CCF4 : compétences, capacités, commentaires, niveau d'acquisition (A à D). Pas de note ni de pondération.
// Produite par la simulation : elle s'imprime ou s'enregistre en PDF, rien n'est transmis.
const SANS = "Arial,'Helvetica Neue',Helvetica,sans-serif";
const COUL = { A: '#15803d', B: '#4d7c0f', C: '#b45309', D: '#b91c1c' };
const cell = { padding: '6px 8px', border: '1px solid #94a3b8', verticalAlign: 'top', fontSize: 12.5, lineHeight: 1.45 };

export default function FicheCcf({ e, onFermer }) {
  const [nom, setNom] = useState('');
  const F = ficheCcf(e), prenom = pn(e);
  return (
    <div id="fiche-ccf" data-fiche-ccf style={{ background: '#fff', color: '#1f2937', fontFamily: SANS, border: '1px solid #cfd6df', boxShadow: '0 2px 10px rgba(0,0,0,.2)', padding: '16px 18px', margin: '14px 0' }}>
      <style>{`@media print { body * { visibility: hidden; } #fiche-ccf, #fiche-ccf * { visibility: visible; } #fiche-ccf { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }   .fiche-pas-imprimer { display: none !important; } .fiche-nom-imprime { display: inline !important; } }`}</style>
      <div style={{ fontSize: 17, fontWeight: 700 }}>TP : Une journée au laboratoire — remplacement de la Vinnapas par l'Orgal (base de peinture blanche mate)</div>
      <div style={{ margin: '8px 0', fontSize: 14 }}>
        Nom : <input data-nom-fiche value={nom} onChange={ev => setNom(ev.target.value)} placeholder="NOM" className="fiche-pas-imprimer" style={{ padding: '3px 8px', border: '1px solid #94a3b8', width: 150, font: 'inherit' }} />
        <span className="fiche-nom-imprime" style={{ display: 'none' }}>{nom}</span> {prenom || '…………'}
      </div>
      <div style={{ fontSize: 14, margin: '6px 0 10px' }}>Auto-évaluation de ma journée à la lumière des compétences évaluées au BTS Métiers de la Chimie.</div>
      <div style={{ fontSize: 12.5, margin: '0 0 8px' }}>Signification des niveaux d'acquisition :
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 4 }}><tbody>
          <tr>{[['A', 'Très satisfaisant'], ['B', 'Satisfaisant'], ['C', 'Fragile'], ['D', 'Insuffisant']].map(([l, t]) => <td key={l} style={{ ...cell, textAlign: 'center' }}><b style={{ color: COUL[l] }}>{l}</b> · {t}</td>)}</tr>
        </tbody></table></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
          <thead><tr>{['Compétences', 'Capacités associées', 'Commentaires', 'Niveau d\'acquisition'].map(h => <th key={h} style={{ ...cell, background: '#f1f5f9', textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>{F.groupes.map(g => (
            <tr key={g.code} data-groupe-ccf={g.code}>
              <td style={{ ...cell, fontWeight: 700, width: '15%' }}>{g.code}. {g.titre}</td>
              <td style={{ ...cell, width: '25%' }}>{g.capacites.map((c, i) => <div key={i} style={{ marginBottom: 4 }}>{c}</div>)}</td>
              <td style={{ ...cell, whiteSpace: 'pre-line' }}>{g.commentaire}</td>
              <td style={{ ...cell, textAlign: 'center', width: '13%' }}><b style={{ fontSize: 22, color: COUL[g.niveau] }}>{g.niveau}</b></td>
            </tr>))}</tbody>
        </table>
      </div>
      <p style={{ fontSize: 11.5, color: '#475569', marginTop: 8 }}>Retour qualitatif établi par la simulation à partir de tes choix et de tes résultats : il ne remplace pas l'évaluation d'un CCF et n'est transmis à personne.</p>
      <div className="fiche-pas-imprimer" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" data-imprimer-fiche onClick={() => window.print()} style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid #1e3a8a', background: '#fff', color: '#1e3a8a', fontWeight: 700, cursor: 'pointer', font: 'inherit' }}>🖨️ Imprimer / enregistrer en PDF</button>
        <button type="button" onClick={onFermer} style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid #94a3b8', background: '#fff', color: '#475569', cursor: 'pointer', font: 'inherit' }}>Fermer</button>
      </div>
    </div>);
}
