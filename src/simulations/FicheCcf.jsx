import { useState } from "react";
import { ficheCcf, pn, nf } from "./laboJournee";

// Fiche d'évaluation au format des CCF4 : compétences, capacités, commentaires, niveau d'acquisition (A à D), poids, note /20.
// Auto-évaluation indicative produite par la simulation : elle s'imprime ou s'enregistre en PDF, rien n'est transmis.
const SANS = "Arial,'Helvetica Neue',Helvetica,sans-serif";
const COUL = { A: '#15803d', B: '#4d7c0f', C: '#b45309', D: '#b91c1c' };
const cell = { padding: '6px 8px', border: '1px solid #94a3b8', verticalAlign: 'top', fontSize: 12.5, lineHeight: 1.45 };
const fr = x => String(x).replace('.', ',');

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
      <div style={{ fontSize: 16, fontWeight: 700, margin: '6px 0 10px' }} data-note-ccf>Note : {fr(F.note20)} / 20 <span style={{ color: COUL[F.niveau], marginLeft: 8 }}>({F.niveau})</span></div>
      <div style={{ fontSize: 12.5, margin: '0 0 8px' }}>Signification des niveaux d'acquisition :
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 4 }}><tbody>
          <tr>{[['A', 'Très satisfaisant', '8 à 10 / 10'], ['B', 'Satisfaisant', '6 à 8 / 10'], ['C', 'Fragile', '4 à 6 / 10'], ['D', 'Insuffisant', '0 à 4 / 10']].map(([l, t, r]) => <td key={l} style={{ ...cell, textAlign: 'center' }}><b style={{ color: COUL[l] }}>{l}</b> · {t}<br />{r}</td>)}</tr>
        </tbody></table></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
          <thead><tr>{['Compétences', 'Capacités associées', 'Commentaires', 'Niveau d\'acquisition'].map(h => <th key={h} style={{ ...cell, background: '#f1f5f9', textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>{F.groupes.map(g => (
            <tr key={g.code} data-groupe-ccf={g.code}>
              <td style={{ ...cell, fontWeight: 700, width: '15%' }}>{g.code}. {g.titre}</td>
              <td style={{ ...cell, width: '25%' }}>{g.capacites.map((c, i) => <div key={i} style={{ marginBottom: 4 }}>{c}</div>)}</td>
              <td style={{ ...cell, whiteSpace: 'pre-line' }}>{g.commentaire}</td>
              <td style={{ ...cell, textAlign: 'center', width: '13%' }}><b style={{ fontSize: 18, color: COUL[g.niveau] }}>{g.niveau}</b><br />{fr(g.note10)} / 10<br /><small>(poids : {fr(g.poids)})</small></td>
            </tr>))}</tbody>
        </table>
      </div>
      <p style={{ fontSize: 11.5, color: '#475569', marginTop: 8 }}>Note = somme pondérée des niveaux (poids du tableau) ramenée sur 20. Auto-évaluation indicative établie par la simulation à partir de tes choix ({nf(F.note20, 1)} / 20) : elle ne remplace pas l'évaluation d'un CCF et n'est transmise à personne.</p>
      <div className="fiche-pas-imprimer" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" data-imprimer-fiche onClick={() => window.print()} style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid #1e3a8a', background: '#fff', color: '#1e3a8a', fontWeight: 700, cursor: 'pointer', font: 'inherit' }}>🖨️ Imprimer / enregistrer en PDF</button>
        <button type="button" onClick={onFermer} style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid #94a3b8', background: '#fff', color: '#475569', cursor: 'pointer', font: 'inherit' }}>Fermer</button>
      </div>
    </div>);
}
