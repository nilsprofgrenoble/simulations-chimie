import { KIT } from "../commun";

// barre d'action : le bouton principal ressort (vert plein), les autres sont discrets
export const stylePrincipal = (actif, c = '#16a34a') => ({ padding: '10px 20px', minHeight: 44, borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 15.5,
  border: `2px solid ${c}`, background: actif ? '#fff' : c, color: actif ? c : '#fff', boxShadow: actif ? 'none' : '0 2px 6px rgba(22, 163, 74, .25)' });
export const styleSecondaire = { padding: '8px 12px', minHeight: 40, borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14, border: 'none', background: 'none', color: KIT.txt2, textDecoration: 'underline', textUnderlineOffset: 3 };
