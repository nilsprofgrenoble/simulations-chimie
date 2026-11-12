import { DOMAINES } from "../classe";

// Petit choix « Tout / Chimie / Physique » pour orienter le premier mot des pseudos proposés.
export function ChoixDomaine({ valeur, onChange, disabled }) {
  return (
    <div role="group" aria-label="Thème du pseudo" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 2px', alignItems: 'center' }}>
      <span style={{ fontSize: 13.5, color: '#475569', fontWeight: 700 }}>Thème :</span>
      {DOMAINES.map(d => (
        <button key={d.code} type="button" disabled={disabled} aria-pressed={valeur === d.code} onClick={() => onChange(d.code)}
          style={{ border: `2px solid ${valeur === d.code ? '#0b4f94' : '#cbd5e1'}`, background: valeur === d.code ? '#0b4f94' : '#fff', color: valeur === d.code ? '#fff' : '#0f172a',
            borderRadius: 999, padding: '4px 12px', font: '800 13.5px inherit', fontFamily: 'inherit', cursor: 'pointer' }}>
          <span aria-hidden="true">{d.icone}</span> {d.libelle}
        </button>))}
    </div>);
}
