// Éléments d'interface de la simulation 301 : trois niveaux visuels bien distincts.
// 1. Onglets (choisir la vue) ; 2. Réglages (choisir ce qu'on étudie, regroupés dans un cadre) ; 3. Action (un seul bouton principal, vert).
import { KIT } from "../commun";

export function Onglets({ valeur, options, onChange }) {
  return (<><style>{'@media (max-width: 560px) { .fl-ong-sous { display: none; } }'}</style><div role="tablist" style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, gap: 0, marginBottom: 12, borderBottom: `2px solid ${KIT.bord}` }}>
    {options.map(([k, titre, sous]) => { const on = valeur === k;
      return (<button key={k} role="tab" aria-selected={on} onClick={() => onChange(k)}
        style={{ padding: '8px 6px 9px', minHeight: 48, cursor: 'pointer', background: 'none', border: 'none', borderBottom: `3px solid ${on ? '#16a34a' : 'transparent'}`, marginBottom: -2,
          color: on ? KIT.txt : KIT.txt2, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: on ? 800 : 600 }}>{titre}</div>
        {sous && <div className="fl-ong-sous" style={{ fontSize: 12.5, fontWeight: 400, color: KIT.txt2, marginTop: 1 }}>{sous}</div>}
      </button>); })}
  </div></>);
}

// cadre des réglages : les choix s'alignent en colonnes sur ordinateur, s'empilent sur téléphone
export function Reglages({ children }) {
  return (<div className="fl-reg" style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 10px 10px', marginBottom: 10 }}>
    <style>{`.fl-reg { display: grid; gap: 8px 14px; grid-template-columns: minmax(0, 1fr); } @media (min-width: 700px) { .fl-reg { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); } }
      .fl-seg button:focus-visible { outline: 2px solid #16a34a; outline-offset: -2px; }`}</style>
    {children}
  </div>);
}

// commande segmentée : options exclusives, d'un seul bloc ; options : [[valeur, libellé, désactivée?, aide?]]
export function Segment({ titre, valeur, options, onChange }) {
  return (<div role="group" aria-label={titre}>
    <div style={{ fontSize: 12.5, fontWeight: 700, color: KIT.txt2, marginBottom: 3, letterSpacing: '.02em' }}>{titre}</div>
    <div className="fl-seg" style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length > 3 ? 2 : options.length}, minmax(0, 1fr))`, border: `1px solid ${KIT.bord}`, borderRadius: 10, overflow: 'hidden', background: '#f8fafc' }}>
      {options.map(([k, l, off, aide], i) => { const on = valeur === k, n = options.length > 3 ? 2 : options.length;
        return <button key={String(k)} onClick={() => !off && onChange(k)} disabled={off} aria-pressed={on} title={aide}
          style={{ minHeight: 38, padding: '4px 4px', whiteSpace: 'nowrap', border: 'none', borderRight: (i + 1) % n ? `1px solid ${KIT.bord}` : 'none', borderBottom: i < options.length - n ? `1px solid ${KIT.bord}` : 'none', cursor: off ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: on ? 700 : 500,
            background: on ? '#334155' : 'transparent', color: on ? '#fff' : off ? '#cbd5e1' : KIT.txt }}>{l}</button>; })}
    </div>
  </div>);
}

// barre d'action : le bouton principal (stylePrincipal, fluoStyles.js) ressort, les autres sont discrets
export function BarreAction({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>{children}</div>;
}
