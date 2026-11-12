import { chapitresDeSim, allerChapitre } from "./chapitres";
import { ACCENT, ACCENT_CLAIR, TEXTE, TEXTE2 } from "./theme";

// ═══════════════════════════════════════════════════════════════════════════
//  « POUR T'ENTRAÎNER » : sous une simulation, renvoie vers la page du (ou des) chapitre(s) qui la contiennent.
//  Cette page liste les exercices de remédiation (S'APP, ANA, REA, VAL) du thème, avec la suite conseillée.
//  Rien ne s'affiche si la simulation n'appartient à aucun chapitre.
// ═══════════════════════════════════════════════════════════════════════════
export function ExercicesLies({ simId, naviguer }) {
  const chaps = chapitresDeSim(Number(simId));
  if (!chaps.length) return null;
  const btn = { border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', fontFamily: 'inherit', background: ACCENT, color: '#fff', textAlign: 'left' };
  return (
    <section data-exercices-lies aria-label="Exercices d'entraînement liés à cette simulation"
      style={{ margin: '18px 0 8px', padding: '14px 16px', borderRadius: 14, background: ACCENT_CLAIR, border: '1px solid #b9cfe0', color: TEXTE, textAlign: 'left' }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>✏️ Pour continuer : t’entraîner sur ce thème</div>
      <div style={{ fontSize: 14, color: TEXTE2, lineHeight: 1.45, marginBottom: 10 }}>
        Tu as fini la simulation ? Les exercices de remédiation du thème (analyser, calculer, valider, s’approprier) t’attendent, avec l’exercice conseillé pour la suite.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chaps.map(c => <button key={c.id} style={btn} onClick={() => { allerChapitre(naviguer, c.id); window.scrollTo({ top: 0 }); }}>{chaps.length > 1 ? c.label : 'Voir les exercices'} ▶</button>)}
      </div>
    </section>);
}
