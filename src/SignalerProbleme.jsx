import { useState, useEffect, useRef } from "react";
import { envoyerSignalement } from "./serveur";
import { MOTIFS, NOMS_MODES, contexteActuel } from "./signalement";
import { KIT, styleBouton } from "./commun";
import { Pic } from "./Pictos";

// ═════════════════════════════════════════════════════════════════
//  « 🐞 UN PROBLÈME ? » : signaler un défaut en quelques secondes, sans compte ni nom.
//  Le contexte (simulation, mode, étape du parcours, code de l'exercice, appareil) est joint automatiquement.
//  Stockage : table « signalements » (supabase/21-signalements.sql), lisible par l'administrateur seulement.
//  Le pied de page ouvre la même fenêtre grâce à l'évènement « signaler-probleme ».
// ═════════════════════════════════════════════════════════════════
const CLE_LIMITE = 'signalements-envoyes', MAX_PAR_HEURE = 5;
const envoyesRecemment = () => { try { return (JSON.parse(window.localStorage.getItem(CLE_LIMITE) || '[]')).filter(t => Date.now() - t < 3600000); } catch { return []; } };

export function SignalerProbleme({ activeId, titre }) {
  const [ouvert, setOuvert] = useState(false), [ctx, setCtx] = useState(null);
  const [motif, setMotif] = useState(''), [message, setMessage] = useState('');
  const [etat, setEtat] = useState('saisie'), [erreur, setErreur] = useState('');     // saisie · envoi · fait
  const boutonRef = useRef(null), dialogRef = useRef(null);

  const fermer = () => { setOuvert(false); boutonRef.current?.focus(); };
  const ouvrir = () => { setCtx(contexteActuel(activeId, titre)); setMotif(''); setMessage(''); setEtat('saisie'); setErreur(''); setOuvert(true); };
  useEffect(() => {
    const f = () => ouvrir();
    window.addEventListener('signaler-probleme', f);
    return () => window.removeEventListener('signaler-probleme', f);
  });
  useEffect(() => {
    if (!ouvert) return undefined;
    const onKey = e => { if (e.key === 'Escape') fermer(); };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.querySelector('button, textarea')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert]);

  const envoyer = async () => {
    if (!motif) { setErreur('Choisis d’abord ce qui ne va pas.'); return; }
    if (motif === 'autre' && message.trim().length < 5) { setErreur('Explique en quelques mots ce qui ne va pas.'); return; }
    if (envoyesRecemment().length >= MAX_PAR_HEURE) { setErreur('Tu as déjà envoyé plusieurs signalements : merci, réessaie dans une heure.'); return; }
    setEtat('envoi'); setErreur('');
    try {
      await envoyerSignalement({ motif, message: message.trim() || null, ...ctx });
      try { window.localStorage.setItem(CLE_LIMITE, JSON.stringify([...envoyesRecemment(), Date.now()])); } catch { /* stockage indisponible */ }
      setEtat('fait');
    } catch (e) { setEtat('saisie'); setErreur(e?.message || 'Envoi impossible pour le moment. Réessaie dans un instant.'); }
  };

  const resume = ctx ? [ctx.sim_titre, ctx.mode && NOMS_MODES[ctx.mode], ctx.etape, ctx.code_exo].filter(Boolean).join(' · ') : '';
  return (
    <>
      {activeId > 0 && (
        <button ref={boutonRef} type="button" data-signaler onClick={ouvrir} aria-haspopup="dialog"
          style={{ position: 'fixed', left: 10, bottom: 10, zIndex: 40, background: 'rgba(255,255,255,.95)', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 999,
            padding: '7px 12px', font: '700 13px inherit', fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 1px 4px rgba(15,23,42,.15)' }}>
          <Pic n="flag"/>Un problème ?
        </button>)}
      {ouvert && (
        <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) fermer(); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Signaler un problème"
            style={{ background: '#fff', borderRadius: 18, padding: '16px 18px', width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', textAlign: 'left', color: KIT.txt, fontFamily: 'inherit' }}>
            {etat === 'fait' ? (
              <>
                <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Merci !</h2>
                <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.5 }}>Ton signalement est bien envoyé. Il aide à améliorer le site pour tout le monde.</p>
                <button type="button" onClick={fermer} style={styleBouton(true, '#0b4f94')}>Fermer</button>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 4px', fontSize: 18 }}><Pic n="flag"/>Un problème ?</h2>
                <p style={{ margin: '0 0 10px', fontSize: 14, color: KIT.txt2 }}>Dis-nous ce qui ne va pas, ça prend 10 secondes.</p>
                <div role="radiogroup" aria-label="Ce qui ne va pas" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {MOTIFS.map(([id, libelle]) => (
                    <button key={id} type="button" role="radio" aria-checked={motif === id} onClick={() => { setMotif(id); setErreur(''); }}
                      style={{ textAlign: 'left', padding: '10px 12px', minHeight: 44, borderRadius: 12, border: `2px solid ${motif === id ? '#0b4f94' : '#cbd5e1'}`, background: motif === id ? '#eff6ff' : '#f8fafc',
                        font: `${motif === id ? 800 : 600} 15px inherit`, fontFamily: 'inherit', color: '#0c1a2e', cursor: 'pointer' }}>{libelle}</button>))}
                </div>
                <label htmlFor="sig-msg" style={{ display: 'block', margin: '12px 0 4px', fontSize: 14, fontWeight: 700 }}>Un détail utile ? <span style={{ fontWeight: 500, color: KIT.txt2 }}>(facultatif)</span></label>
                <textarea id="sig-msg" value={message} maxLength={600} rows={3} onChange={e => setMessage(e.target.value)} placeholder="Ce que tu as vu, ce que tu attendais…"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, fontFamily: 'inherit', resize: 'vertical' }} />
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: KIT.txt2, lineHeight: 1.45 }}>N’écris ni ton nom ni d’information personnelle. Envoyé avec : {resume || 'la page où tu te trouves'}, ton type d’écran.</p>
                {erreur && <div role="alert" style={{ marginTop: 8, color: '#b91c1c', fontWeight: 700, fontSize: 14 }}>{erreur}</div>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button type="button" onClick={envoyer} disabled={etat === 'envoi'} style={styleBouton(true, '#16a34a')}>{etat === 'envoi' ? 'Envoi…' : 'Envoyer'}</button>
                  <button type="button" onClick={fermer} style={styleBouton(false)}>Annuler</button>
                </div>
              </>)}
          </div>
        </div>)}
    </>
  );
}
