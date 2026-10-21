import { useState, useEffect, useRef } from "react";
import { LogoPaillasse } from "./Logo";
import { ACCENT, ACCENT_CLAIR, TEXTE, TEXTE2, BORDURE } from "./theme";

// ============================================================
//  EN-TÊTE DU SITE : toujours visible, même quand on fait défiler la page.
//  Logo (retour à l'accueil) · menus par niveau · travail par compétence · mon compte.
//  Sur écran étroit, les menus se regroupent derrière un bouton « Menu ».
// ============================================================
export const HAUTEUR_ENTETE = 60;
const TXT = TEXTE, TXT2 = TEXTE2, BORD = BORDURE, VERT = ACCENT;

// menus : [{ key, label, groupes: [{ label?, sims: [{ id, icon, label, desc? }] }] }]
export function EnTete({ menus, activeId, niveauActif, naviguer, session }) {
  const [ouvert, setOuvert] = useState(null);        // clé du menu déroulé (grand écran) ou 'mobile'
  const [accordeon, setAccordeon] = useState(null);  // niveau déplié dans le menu mobile
  const [large, setLarge] = useState(() => window.innerWidth >= 1000);
  const ref = useRef(null);
  const [cache, setCache] = useState(false);   // l'en-tête se range quand on descend dans la page et revient quand on remonte
  const dernierY = useRef(0);
  useEffect(() => {
    const defile = () => {
      const y = window.scrollY, dy = y - dernierY.current;
      if (Math.abs(dy) < 8) return;
      dernierY.current = y;
      setCache(dy > 0 && y > HAUTEUR_ENTETE);
    };
    window.addEventListener('scroll', defile, { passive: true });
    return () => window.removeEventListener('scroll', defile);
  }, []);
  const masque = cache && !ouvert;
  useEffect(() => {
    // les panneaux « collants » des simulations se calent sous l'en-tête, ou tout en haut s'il est rangé
    ref.current?.parentElement?.style.setProperty('--entete-h', masque ? '0px' : `${HAUTEUR_ENTETE}px`);
  }, [masque]);

  useEffect(() => {
    const f = () => setLarge(window.innerWidth >= 1000);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  useEffect(() => {
    if (!ouvert) return undefined;
    const dehors = e => { if (ref.current && !ref.current.contains(e.target)) setOuvert(null); };
    const echap = e => { if (e.key === 'Escape') setOuvert(null); };
    document.addEventListener('mousedown', dehors);
    document.addEventListener('touchstart', dehors);
    document.addEventListener('keydown', echap);
    return () => { document.removeEventListener('mousedown', dehors); document.removeEventListener('touchstart', dehors); document.removeEventListener('keydown', echap); };
  }, [ouvert]);

  const profil = session?.profil;
  const aller = id => { setOuvert(null); naviguer(id); };
  const allerCompte = () => aller(profil?.role === 'prof' ? 40 : 39);
  const lienSim = (s, retrait = 0) => (
    <button key={s.id} onClick={() => aller(s.id)} title={s.desc || undefined} aria-current={s.id === activeId ? 'page' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 10px', marginLeft: retrait,
        border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: TXT, fontFamily: 'inherit',
        background: s.id === activeId ? ACCENT_CLAIR : 'transparent', fontWeight: s.id === activeId ? 800 : 500 }}
      onMouseEnter={e => { if (s.id !== activeId) e.currentTarget.style.background = '#f1f5f9'; }}
      onMouseLeave={e => { if (s.id !== activeId) e.currentTarget.style.background = 'transparent'; }}>
      <span style={{ fontSize: 17, flexShrink: 0 }} aria-hidden="true">{s.icon}</span>
      <span style={{ flex: 1 }}>{s.label}</span>
      {s.id === activeId && <span aria-hidden="true">●</span>}
    </button>
  );
  const groupe = (g, k) => (
    <div key={k} style={{ minWidth: 0 }}>
      {g.label && <div style={{ fontSize: 14.5, fontWeight: 800, color: TXT, background: ACCENT_CLAIR, borderLeft: `4px solid ${VERT}`, borderRadius: 6, padding: '5px 10px', margin: '6px 0 4px', lineHeight: 1.3 }}>{g.label}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: g.label ? 8 : 0 }}>{g.sims.map(s => lienSim(s))}</div>
    </div>
  );

  const bouton = (actif, ouvertM) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', border: 'none', background: ouvertM ? '#f1f5f9' : 'transparent',
    borderBottom: `4px solid ${actif ? VERT : 'transparent'}`, borderRadius: '8px 8px 0 0', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 15, fontWeight: actif ? 800 : 600, color: TXT, whiteSpace: 'nowrap', height: HAUTEUR_ENTETE - 8,
  });

  const iconeCompte = (
    <button onClick={allerCompte} data-bouton-compte aria-label={profil ? `Mon compte (${profil.identifiant || profil.nom})` : 'Se connecter'}
      title={profil ? `Mon compte : ${profil.identifiant || profil.nom}` : 'Se connecter'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
        border: `2px solid ${profil ? VERT : BORD}`, background: profil ? ACCENT_CLAIR : 'white', color: TXT, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TXT} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.500 4-6.500 8-6.500s7 2 8 6.500"/>
      </svg>
      {profil && <span aria-hidden="true">✓</span>}
      {profil && large && <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>{profil.identifiant || profil.nom}</span>}
    </button>
  );

  const menuOuvert = menus.find(m => m.key === ouvert);
  const panneau = { position: 'absolute', left: 0, right: 0, top: '100%', background: 'white', borderBottom: `1px solid ${BORD}`,
    boxShadow: '0 12px 24px rgba(15,23,42,0.14)', maxHeight: `calc(100vh - ${HAUTEUR_ENTETE}px)`, overflowY: 'auto', textAlign: 'left' };

  return (
    <header ref={ref} style={{ position: 'sticky', top: 0, zIndex: 30, height: HAUTEUR_ENTETE, transform: masque ? 'translateY(-110%)' : 'none', transition: 'transform 0.25s ease', background: 'white', borderBottom: `1px solid ${BORD}`,
      boxShadow: '0 2px 8px rgba(15,23,42,0.06)', fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: '100%', padding: '0 16px', maxWidth: 1280, margin: '0 auto', boxSizing: 'border-box' }}>
        <a href="?" onClick={e => { e.preventDefault(); aller(0); }} aria-label="Paillasse virtuelle : retour à l'accueil" title="Retour à l'accueil"
          style={{ alignSelf: 'center', textDecoration: 'none', marginRight: large ? 14 : 0, flexShrink: 0 }}>
          <LogoPaillasse taille={38} avecTexte={large || window.innerWidth >= 380}/>
        </a>

        {large && <nav aria-label="Niveaux" style={{ display: 'flex', alignItems: 'flex-end', gap: 2, flex: 1, minWidth: 0 }}>
          {menus.map(m => (
            <button key={m.key} onClick={() => setOuvert(o => o === m.key ? null : m.key)} aria-expanded={ouvert === m.key} aria-haspopup="true"
              style={bouton(niveauActif === m.key, ouvert === m.key)}>
              {m.label}<span aria-hidden="true" style={{ fontSize: 10 }}>{ouvert === m.key ? '▲' : '▼'}</span>
            </button>
          ))}
        </nav>}
        {!large && <span style={{ flex: 1 }}/>}

        <span style={{ alignSelf: 'center', display: 'flex', gap: 8, alignItems: 'center' }}>
          {iconeCompte}
          {!large && (
            <button onClick={() => setOuvert(o => o === 'mobile' ? null : 'mobile')} aria-expanded={ouvert === 'mobile'} aria-label="Menu"
              style={{ padding: '6px 11px', borderRadius: 10, border: `2px solid ${BORD}`, background: ouvert === 'mobile' ? '#f1f5f9' : 'white', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, color: TXT, fontFamily: 'inherit' }}>
              <span aria-hidden="true">☰</span> Menu
            </button>
          )}
        </span>
      </div>

      {large && menuOuvert && (
        <div style={panneau} role="region" aria-label={menuOuvert.label}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 16px 18px', boxSizing: 'border-box' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px 22px' }}>
              {menuOuvert.groupes.map(groupe)}
            </div>
          </div>
        </div>
      )}

      {!large && ouvert === 'mobile' && (
        <div style={panneau} role="region" aria-label="Menu">
          <div style={{ padding: '8px 12px 14px' }}>
            <button onClick={() => aller(0)} style={{ display: 'flex', width: '100%', padding: '10px', border: 'none', background: activeId === 0 ? ACCENT_CLAIR : 'transparent',
              borderRadius: 8, fontSize: 15, fontWeight: 700, color: TXT, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>🏠 Accueil</button>
            {menus.map(m => (
              <div key={m.key} style={{ borderTop: `1px solid ${BORD}` }}>
                <button onClick={() => setAccordeon(a => a === m.key ? null : m.key)} aria-expanded={accordeon === m.key}
                  style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', padding: '11px 10px', border: 'none', background: 'transparent',
                    fontSize: 15.5, fontWeight: niveauActif === m.key ? 800 : 700, color: TXT, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    textDecoration: niveauActif === m.key ? 'underline' : 'none', textDecorationThickness: 3, textUnderlineOffset: 4 }}>
                  {m.label}<span aria-hidden="true">{accordeon === m.key ? '▲' : '▼'}</span>
                </button>
                {accordeon === m.key && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>{m.groupes.map(groupe)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
