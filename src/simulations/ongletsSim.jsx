// Éléments d'interface communs aux explorations « Substitution ou élimination ? » et « Addition du dibrome » :
// barre d'onglets (équation et mécanisme / perspective / 3D / énergie) et barre de lecture (bouton + curseur d'avancement).
import { styleBouton, stylePetitBouton } from "../commun";

export function OngletsVue({ onglets, actif, onChange }) {
  return (
    <div role="tablist" aria-label="Représentation de la réaction" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {onglets.map(([id, nom]) => (
        <button key={id} role="tab" aria-selected={actif === id} onClick={() => onChange(id)}
          style={{ ...stylePetitBouton(actif === id, '#0f172a'), fontSize: 14, padding: '7px 12px' }}>{id === '3d' ? '🧊 ' : ''}{nom}</button>))}
    </div>);
}

export function BarreLecture({ lecture, setLecture, u, setU }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => { if (u >= 0.999) setU(0); setLecture(l => !l); }} style={styleBouton(true, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
      <input type="range" min={0} max={1000} step={1} value={Math.round(u * 1000)} onChange={e => { setLecture(false); setU(+e.target.value / 1000); }} aria-label="Avancement de la réaction" style={{ flex: 1 }} />
    </div>);
}
