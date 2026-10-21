/* eslint-disable react-refresh/only-export-components */
import { couches, ELEMENTS, FAMILLES, valence, element } from "./atomesModele";
import { KIT } from "../commun";

// ====================================================
//  Briques de dessin communes aux simulations 57 (atomes, ions, molécules) et 58 (familles chimiques) :
//  le schéma d'un cortège électronique et le tableau périodique (blocs s et p, éléments de Z = 1 à 20).
//  Couleurs des familles : palette « Okabe-Ito » (lisible par les daltoniens) ; chaque famille est aussi nommée en toutes lettres.
// ====================================================
export const COULEURS_FAMILLE = {
  alcalin: { fond: '#fde7b5', bord: '#b97800' },
  terreux: { fond: '#cfe9f8', bord: '#1f7fb5' },
  halogene: { fond: '#f4d3e5', bord: '#a84c82' },
  noble: { fond: '#e5e7eb', bord: '#4b5563' },
};
const ACCENT_VALENCE = '#b45309';

// Positions des électrons sur une couche : on remplit d'abord les 4 « côtés », puis les places entre eux
const ORDRE_PLACES = [0, 2, 4, 6, 1, 3, 5, 7];
export function SchemaAtome({ Z, n, taille = 260, montrerPlaces = true }) {
  const cs = couches(n), C = 130, rayons = [36, 64, 92, 120], nv = cs.length;
  const e = element(Z);
  return (
    <svg viewBox="0 0 260 260" width="100%" style={{ maxWidth: taille, display: 'block', margin: '0 auto' }} role="img"
      aria-label={`Schéma de ${n} électron${n > 1 ? 's' : ''} répartis sur ${nv} couche${nv > 1 ? 's' : ''} : ${cs.join(', ')}`}>
      {cs.map((_, k) => <circle key={k} cx={C} cy={C} r={rayons[k]} fill="none" stroke={k === nv - 1 ? ACCENT_VALENCE : '#94a3b8'} strokeWidth={k === nv - 1 ? 2 : 1.2} strokeDasharray={k === nv - 1 ? undefined : '3 3'}/>)}
      <circle cx={C} cy={C} r={19} fill="#e2e8f0" stroke="#475569" strokeWidth="1.5"/>
      <text x={C} y={C - 2} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">{e ? e.sym : ''}</text>
      <text x={C} y={C + 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">{Z}+</text>
      {cs.map((ne, k) => {
        const r = rayons[k], valenceCouche = k === nv - 1, places = valenceCouche && montrerPlaces && k < 3 ? (k === 0 ? 2 : 8) : ne;
        const ordre = k === 0 ? [0, 4] : ORDRE_PLACES;
        const els = [];
        for (let s = 0; s < places; s++) {
          const a = (ordre[s] * 45 - 90) * Math.PI / 180, x = C + r * Math.cos(a), y = C + r * Math.sin(a), plein = s < ne;
          els.push(plein
            ? <circle key={s} cx={x} cy={y} r={valenceCouche ? 7 : 6} fill={valenceCouche ? ACCENT_VALENCE : '#475569'} stroke="#fff" strokeWidth="1.5"/>
            : <circle key={s} cx={x} cy={y} r={6} fill="#fff" stroke={ACCENT_VALENCE} strokeWidth="1.5" strokeDasharray="2 2"/>);
        }
        return <g key={k}>{els}</g>;
      })}
    </svg>);
}

const COLONNES = [1, 2, 13, 14, 15, 16, 17, 18];
// Tableau périodique (blocs s et p). choisi : Z sélectionné ; onChoisir(Z) ; colorier : 'famille' | 'aucun' ;
// montrerValence : affiche le nombre d'électrons de valence dans chaque case ; surligne : liste de Z à entourer ; colonneSurlignee : n° de colonne
export function TableauPeriodique({ choisi, onChoisir, colorier = 'famille', montrerValence = false, surligne = [], colonneSurlignee = null, compact = false, aide = true }) {
  const cellule = (periode, col) => {
    const e = ELEMENTS.find(x => x.periode === periode && x.colonne === col);
    if (!e) return <div key={`${periode}-${col}`} aria-hidden="true" style={{ aspectRatio: '1 / 1', background: periode === 4 || (col >= 13 && periode === 1) ? 'transparent' : 'transparent' }}/>;
    const fam = colorier === 'famille' && e.famille ? COULEURS_FAMILLE[e.famille] : null;
    const actif = choisi === e.Z, marque = surligne.includes(e.Z) || colonneSurlignee === col;
    return (
      <button key={e.Z} onClick={() => onChoisir && onChoisir(e.Z)} aria-label={`${e.nom}, Z = ${e.Z}, colonne ${e.colonne}`} aria-pressed={actif}
        style={{ aspectRatio: '1 / 1', padding: 0, cursor: onChoisir ? 'pointer' : 'default', borderRadius: 6, position: 'relative', fontFamily: 'inherit', minWidth: 0,
          background: fam ? fam.fond : '#fff', color: KIT.txt,
          border: actif ? '3px solid #0f172a' : marque ? '3px dashed #b45309' : `1.5px solid ${fam ? fam.bord : '#94a3b8'}`,
          boxShadow: actif ? '0 0 0 2px #fff inset' : 'none' }}>
        <span style={{ position: 'absolute', top: 1, left: 3, fontSize: compact ? 8 : 9.5, color: '#334155', fontWeight: 600 }}>{e.Z}</span>
        <span style={{ fontSize: compact ? 13 : 'clamp(12px, 2.4vw, 17px)', fontWeight: 800 }}>{e.sym}</span>
        {montrerValence && <span style={{ position: 'absolute', bottom: 1, right: 3, fontSize: compact ? 8 : 10, fontWeight: 800, color: ACCENT_VALENCE }}>{valence(e.Z)}</span>}
      </button>);
  };
  return (
    <div data-tableau-periodique style={{ maxWidth: compact ? 360 : 460 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `22px repeat(${COLONNES.length}, minmax(0, 1fr))`, gap: 3, alignItems: 'center' }}>
        <div/>
        {COLONNES.map(c => <div key={c} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 800, color: colonneSurlignee === c ? '#b45309' : '#334155' }}>{c}</div>)}
        {[1, 2, 3, 4].map(p => [
          <div key={`p${p}`} style={{ fontSize: 11.5, fontWeight: 800, color: '#334155', textAlign: 'center' }}>{p}</div>,
          ...COLONNES.map(c => cellule(p, c)),
        ])}
      </div>
      {aide && <div style={{ fontSize: 12, color: KIT.txt2, marginTop: 4, lineHeight: 1.45 }}>
        Colonnes (en haut) et périodes (à gauche). Les colonnes 3 à 12 (métaux de transition) ne sont pas représentées. {montrerValence && <>Le chiffre orange, en bas de chaque case, est le nombre d’électrons de valence.</>}</div>}
      {colorier === 'famille' && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, fontSize: 12.5 }}>
        {Object.entries(FAMILLES).map(([k, f]) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 3, background: COULEURS_FAMILLE[k].fond, border: `1.5px solid ${COULEURS_FAMILLE[k].bord}` }}/>{f.court}</span>)}</div>}
    </div>);
}
