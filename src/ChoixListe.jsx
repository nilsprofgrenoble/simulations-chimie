import { useEffect, useRef, useState } from "react";
import { ACCENT, ACCENT_CLAIR, TEXTE, TEXTE2, BORDURE } from "./theme";

// Liste de choix aux couleurs du site (à la place de la liste déroulante du navigateur, dont l'apparence dépend du téléphone).
// Un bouton affiche le choix actuel ; il ouvre une fenêtre avec les entrées rangées par thème (en bas de l'écran sur téléphone).
//   groupes : [{ label?: 'Thème', items: [{ value, label }] }]
export function ChoixListe({ valeur, groupes, onChoisir, ariaLabel, titre }) {
  const [ouvert, setOuvert] = useState(false);
  const actif = useRef(null);
  const tous = groupes.flatMap(g => g.items);
  const courant = tous.find(i => i.value === valeur);
  useEffect(() => {
    if (!ouvert) return undefined;
    const echap = e => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('keydown', echap);
    const bloque = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    actif.current?.scrollIntoView({ block: 'center' });
    return () => { document.removeEventListener('keydown', echap); document.body.style.overflow = bloque; };
  }, [ouvert]);
  const choisir = v => { setOuvert(false); if (v !== valeur) onChoisir(v); };
  return (
    <>
      <button type="button" data-choix-liste aria-label={`${ariaLabel} : ${courant?.label ?? ''}`} aria-haspopup="dialog" onClick={() => setOuvert(true)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', boxSizing: 'border-box', textAlign: 'left', minHeight: 44, padding: '8px 12px',
          borderRadius: 8, border: `1.5px solid ${BORDURE}`, background: 'white', color: TEXTE, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        <span style={{ flex: 1, minWidth: 0 }}>{courant?.label ?? '—'}</span>
        <span aria-hidden="true" style={{ color: TEXTE2, fontSize: 12 }}>▼</span>
      </button>
      {ouvert && (
        <div onMouseDown={e => { if (e.target === e.currentTarget) setOuvert(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: window.innerWidth <= 700 ? 'flex-end' : 'center', justifyContent: 'center' }}>
          <div role="dialog" aria-modal="true" aria-label={titre || ariaLabel}
            style={{ background: 'white', width: '100%', maxWidth: 560, maxHeight: window.innerWidth <= 700 ? '82vh' : '76vh', display: 'flex', flexDirection: 'column', textAlign: 'left',
              borderRadius: window.innerWidth <= 700 ? '18px 18px 0 0' : 18, boxShadow: '0 -8px 32px rgba(15,23,42,0.25)', fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 16px 10px', borderBottom: `1px solid ${BORDURE}` }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXTE }}>{titre || ariaLabel}</div>
              <button type="button" onClick={() => setOuvert(false)} aria-label="Fermer"
                style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${BORDURE}`, background: 'white', cursor: 'pointer', fontSize: 18, color: TEXTE, fontFamily: 'inherit' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '4px 10px 18px', overscrollBehavior: 'contain' }}>
              {groupes.map((g, k) => (
                <div key={k}>
                  {g.label && <div style={{ fontSize: 14, fontWeight: 800, color: TEXTE, background: ACCENT_CLAIR, borderLeft: `4px solid ${ACCENT}`, borderRadius: 6, padding: '6px 10px', margin: '12px 0 4px' }}>{g.label}</div>}
                  {g.items.map(i => {
                    const sel = i.value === valeur;
                    return (
                      <button key={i.value} type="button" ref={sel ? actif : null} aria-current={sel ? 'true' : undefined} onClick={() => choisir(i.value)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', boxSizing: 'border-box', textAlign: 'left', minHeight: 48, padding: '9px 12px', border: 'none', borderRadius: 8,
                          background: sel ? ACCENT_CLAIR : 'transparent', color: TEXTE, fontFamily: 'inherit', fontSize: 15, fontWeight: sel ? 800 : 500, lineHeight: 1.35, cursor: 'pointer' }}>
                        <span style={{ flex: 1 }}>{i.label}</span>
                        {sel && <span aria-hidden="true" style={{ color: ACCENT, fontWeight: 800 }}>✓</span>}
                      </button>);
                  })}
                </div>))}
            </div>
          </div>
        </div>)}
    </>
  );
}
