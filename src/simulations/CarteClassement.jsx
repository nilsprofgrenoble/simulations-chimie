import { useState, useEffect } from "react";
import { rest, useSession } from "../serveur";
import { Pic } from "../Pictos";

// ═══════════════════════════════════════════════════════════════════════════
//  « CARTE CLASSEMENT » (espace élève, onglet « Aujourd'hui ») : invitation à entrer dans le classement public.
//  Affichée seulement si le professeur a ouvert le classement (établissement indiqué), que l'élève n'y est pas encore
//  et ne l'a pas écartée (« Non merci », mémorisé sur cet appareil). Elle ne coche rien toute seule : le bouton mène
//  à l'onglet « Ma classe », où l'élève choisit son pseudo puis coche (ou non) la case, sur le même écran.
//  apercu : true = aperçu élève du professeur (exemple fixe, rien n'est lu).
// ═══════════════════════════════════════════════════════════════════════════
const CLE_MASQUEE = 'carte-classement-masquee';
const lireMasquee = () => { try { return window.localStorage.getItem(CLE_MASQUEE) === '1'; } catch { return false; } };

export function CarteClassement({ allerChoisir, apercu = false, version = 0 }) {
  const sess = useSession();
  const [etat, setEtat] = useState(apercu ? { pseudo: false, classement: false, etab: 'Ton établissement', exclu: false } : null);
  const [masquee, setMasquee] = useState(lireMasquee);

  useEffect(() => {
    if (apercu) return undefined;
    let vivant = true;
    (async () => {
      try {
        const [p, c] = await Promise.all([
          rest('pseudos?select=adj,nom,classement,exclu').catch(() => rest('pseudos?select=adj,nom')),
          rest('classes?select=etablissement'),
        ]);
        if (vivant) setEtat({ pseudo: !!p[0], classement: !!p[0]?.classement, exclu: !!p[0]?.exclu, etab: (c[0]?.etablissement || '').trim() });
      } catch { if (vivant) setEtat(null); }                    // scripts SQL absents ou réseau coupé : on n'affiche rien
    })();
    return () => { vivant = false; };
  }, [apercu, sess?.user?.id, version]);

  if (!etat || !etat.etab || etat.classement || etat.exclu || (masquee && !apercu)) return null;
  const refuser = () => { try { window.localStorage.setItem(CLE_MASQUEE, '1'); } catch { /* stockage indisponible : masquée pour cette visite seulement */ } setMasquee(true); };
  return (
    <section data-carte-classement aria-label="Le classement"
      style={{ textAlign: 'left', background: '#fff7ed', border: '1.5px solid #fdba74', borderRadius: 18, padding: '14px 16px', margin: '12px 0' }}>
      <h3 style={{ margin: '0 0 4px', font: '800 18px Outfit, Inter, sans-serif', color: '#7c2d12' }}><Pic n="medal"/>Entre dans le classement</h3>
      <p style={{ margin: '0 0 10px', fontSize: 14.5, lineHeight: 1.5, color: '#1e293b' }}>
        {etat.pseudo ? 'Il te reste une case à cocher.' : 'Choisis un pseudo dans une liste (jamais ton nom).'}
        {' '}Tes exercices et défis réussis comptent alors dans le classement. C’est ton choix : tu peux décocher quand tu veux.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="ee-cta" onClick={allerChoisir}>{etat.pseudo ? 'Voir la case ▶' : 'Choisir mon pseudo ▶'}</button>
        <button type="button" onClick={refuser}
          style={{ border: 'none', background: 'none', padding: '8px 4px', font: 'inherit', fontWeight: 700, fontSize: 14, color: '#475569', textDecoration: 'underline', cursor: 'pointer' }}>Non merci</button>
      </div>
    </section>);
}
