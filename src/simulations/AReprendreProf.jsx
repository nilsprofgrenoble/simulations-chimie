import { useState, useMemo } from "react";
import { KIT, styleBoite } from "../commun";
import { catalogue } from "./catalogue";
import { aReprendreEnClasse, SEUIL_ELEVES, SEUIL_PROPORTION } from "../reprise";

// ═══════════════════════════════════════════════════════════════════════════
//  « À REPRENDRE EN CLASSE » (suivi professeur) : les exercices où la classe a le plus buté sur la période choisie.
//  Règles et hypothèses : voir ../reprise.js.
// ═══════════════════════════════════════════════════════════════════════════
const ROSE = '#e11d48';
const PERIODES = [[7, '7 derniers jours'], [30, '30 derniers jours'], [null, 'Toute l’année']];

export function AReprendreProf({ eleves, lignes, naviguer, onDevoir }) {
  const [jours, setJours] = useState(7);
  const items = useMemo(() => catalogue(), []);
  const idDe = useMemo(() => new Map(eleves.map(e => [e.identifiant, e.user_id])), [eleves]);
  const R = useMemo(() => aReprendreEnClasse(eleves, lignes, items, jours), [eleves, lignes, items, jours]);
  const puce = (n, fond, texte) => n > 0 && <span style={{ background: fond, color: texte, borderRadius: 999, padding: '2px 10px', fontSize: 12.5, fontWeight: 700 }}>{texte === '#991b1b' ? '🛑' : texte === '#854d0e' ? '👀' : '🔁'} {n}</span>;
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <b style={{ color: KIT.txt }}>🔁 Les exercices à reprendre en début de séance</b>
        <select value={jours ?? ''} onChange={e => setJours(e.target.value === '' ? null : Number(e.target.value))} aria-label="Période"
          style={{ padding: '6px 9px', fontSize: 14, borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
          {PERIODES.map(([v, n]) => <option key={n} value={v ?? ''}>{n}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>
        Un exercice est proposé quand <b>au moins {SEUIL_ELEVES} élèves</b> et <b>au moins {Math.round(SEUIL_PROPORTION * 100)} %</b> de ceux qui l’ont travaillé y ont eu du mal :
        🛑 jamais réussi · 👀 réussi seulement après avoir vu la correction · 🔁 réussi après 3 essais ou plus. Un seul élève en difficulté relève plutôt de l’aide individuelle.
      </div>
      {R.aReprendre.length === 0 ? (
        <div style={{ ...styleBoite, fontSize: 14 }}>
          {R.travailles === 0 ? 'Aucun exercice travaillé sur cette période : rien à analyser pour l’instant.' : <>✅ Aucun exercice ne pose problème à plusieurs élèves sur cette période ({R.travailles} exercice{R.travailles > 1 ? 's' : ''} travaillé{R.travailles > 1 ? 's' : ''}).</>}
        </div>
      ) : R.aReprendre.map(({ item, travailles, nbDiff, qui }) => (
        <div key={item.cle} style={{ ...styleBoite, marginBottom: 10, borderLeft: `5px solid ${ROSE}` }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <b style={{ flex: 1, minWidth: 200, color: KIT.txt }}><span style={{ color: ROSE }}>{item.comp === 'DÉFI' ? 'Défi' : item.comp}</span> · {item.titre}</b>
            <span style={{ fontSize: 14 }}><b>{nbDiff}</b> élève{nbDiff > 1 ? 's' : ''} sur {travailles} {nbDiff > 1 ? 'ont' : 'a'} eu du mal</span>
            <button onClick={() => (item.atelier ? naviguer(item.atelier, item.ex) : naviguer(item.sim))} style={{ cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 700, padding: '5px 11px', borderRadius: 8, border: `1px solid ${KIT.bord}`, background: '#fff' }}>Ouvrir l’exercice ▶</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 4px' }}>
            {puce(qui.bloque.length, '#fee2e2', '#991b1b')}{puce(qui.correction.length, '#fef9c3', '#854d0e')}{puce(qui.essais.length, '#e0e7ff', '#3730a3')}
          </div>
          {onDevoir && (
            <button onClick={() => onDevoir({ titre: `À retravailler : ${item.titre}`.slice(0, 80), cles: [item.cle], eleves: [...qui.bloque, ...qui.correction, ...qui.essais].map(x => idDe.get(x)).filter(Boolean) })}
              style={{ cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 700, padding: '5px 11px', borderRadius: 8, border: `1px solid ${ROSE}`, background: '#fff1f2', color: ROSE, margin: '2px 0 6px' }}>
              📌 Donner cet exercice en devoir à ces {nbDiff} élèves
            </button>)}
          <div style={{ fontSize: 13, color: KIT.txt2 }}>
            {qui.bloque.length > 0 && <>🛑 {qui.bloque.join(', ')}. </>}{qui.correction.length > 0 && <>👀 {qui.correction.join(', ')}. </>}{qui.essais.length > 0 && <>🔁 {qui.essais.join(', ')}.</>}
          </div>
        </div>))}
      {R.autres > 0 && <div style={{ fontSize: 13, color: KIT.txt2 }}>… et {R.autres} autre{R.autres > 1 ? 's' : ''} exercice{R.autres > 1 ? 's' : ''} un peu moins difficile{R.autres > 1 ? 's' : ''}.</div>}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 8 }}>{R.nonTraites} exercice{R.nonTraites > 1 ? 's' : ''} ou défi{R.nonTraites > 1 ? 's' : ''} du site non travaillé{R.nonTraites > 1 ? 's' : ''} par la classe sur cette période.
        Les résultats viennent du navigateur des élèves : c’est une aide à la décision, pas une mesure exacte.</div>
    </div>);
}
