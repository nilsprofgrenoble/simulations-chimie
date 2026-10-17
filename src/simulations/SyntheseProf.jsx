import { useState, useEffect, useMemo } from "react";
import { KIT } from "../commun";
import { lireDevoirs } from "../devoirsServeur";
import { catalogue } from "./catalogue";
import { aReprendreEnClasse } from "../reprise";
import { suiviClasse, infoEcheance } from "../devoirs";
import { syntheseClasse, JOURS_ACTIF, JOURS_RELANCE } from "../synthese";

// ═══════════════════════════════════════════════════════════════════════════
//  SYNTHÈSE (suivi professeur) : la page d'accueil de la classe choisie. Chiffres de la semaine,
//  devoirs en cours, exercices à reprendre, élèves à relancer. Hypothèses : voir ../synthese.js et ../reprise.js.
// ═══════════════════════════════════════════════════════════════════════════
const ROSE = '#e11d48';
const TONS = { retard: '#b91c1c', urgent: '#b45309', ok: '#2f7a52', aucune: '#64748b' };

const Tuile = ({ valeur, sur, libelle, aide, couleur }) => (
  <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderTop: `4px solid ${couleur}`, borderRadius: 12, padding: '10px 14px', flex: '1 1 150px', minWidth: 150 }}>
    <div style={{ fontSize: 28, fontWeight: 800, color: KIT.txt, lineHeight: 1.1 }}>{valeur}{sur !== undefined && <span style={{ fontSize: 16, fontWeight: 600, color: KIT.txt2 }}> / {sur}</span>}</div>
    <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginTop: 2 }}>{libelle}</div>
    <div style={{ fontSize: 12, color: KIT.txt2, marginTop: 2 }}>{aide}</div>
  </div>);

const Carte = ({ titre, lien, onLien, children }) => (
  <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '12px 14px', flex: '1 1 300px', minWidth: 280 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
      <b style={{ flex: 1, color: KIT.txt, fontSize: 15 }}>{titre}</b>
      {lien && <button onClick={onLien} style={{ background: 'none', border: 'none', color: ROSE, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0 }}>{lien} →</button>}
    </div>
    {children}
  </div>);

export function SyntheseProf({ classe, eleves, lignes, allerA }) {
  const [dev, setDev] = useState(null);
  useEffect(() => {
    let vivant = true;
    lireDevoirs(classe.id, 40).then(r => { if (vivant) setDev(r); });
    return () => { vivant = false; };
  }, [classe.id]);
  const items = useMemo(() => catalogue(), []);
  const S = useMemo(() => syntheseClasse(eleves, lignes), [eleves, lignes]);
  const R = useMemo(() => aReprendreEnClasse(eleves, lignes, items, JOURS_ACTIF, new Date(), 3), [eleves, lignes, items]);
  const devoirs = useMemo(() => {
    if (!dev?.dispo) return [];
    return dev.liste.map(d => {
      const s = suiviClasse(d, eleves, lignes), complet = s.effectif > 0 && s.termines === s.effectif;
      return { d, s, complet, e: infoEcheance(d.echeance, new Date(), complet) };
    }).filter(x => !x.complet).slice(0, 4);
  }, [dev, eleves, lignes]);

  if (!eleves.length) return <div style={{ fontSize: 14, color: KIT.txt2 }}>Cette classe n’a pas encore d’élèves : ajoute-en avec « Ajouter … élèves » ci-dessus.</div>;
  const pctActifs = S.effectif ? Math.round((100 * S.actifs) / S.effectif) : 0;
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <Tuile valeur={S.actifs} sur={S.effectif} libelle="élèves actifs" aide={`au moins une séance en ${JOURS_ACTIF} jours (${pctActifs} %)`} couleur="#2a9d8f" />
        <Tuile valeur={S.reussis} libelle="exercices réussis" aide={`en ${JOURS_ACTIF} jours, un même exercice compté une fois par élève`} couleur="#e9a824" />
        <Tuile valeur={R.aReprendre.length + R.autres} libelle="à reprendre" aide="exercices où plusieurs élèves ont eu du mal" couleur={ROSE} />
        <Tuile valeur={S.aRelancer.length} libelle="à relancer" aide={`sans séance depuis ${JOURS_RELANCE} jours ou jamais connectés`} couleur="#64748b" />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {dev?.dispo && (
          <Carte titre="📌 Devoirs en cours" lien="Gérer" onLien={() => allerA('devoirs')}>
            {devoirs.length === 0 ? <div style={{ fontSize: 14, color: KIT.txt2 }}>{dev.liste.length ? '✅ Tous les devoirs sont terminés par toute la classe.' : 'Aucun devoir pour l’instant : crée-en un depuis « Gérer ».'}</div> : devoirs.map(({ d, s, e }) => (
              <div key={d.id} style={{ padding: '6px 0', borderTop: `1px dashed ${KIT.bord}`, fontSize: 14 }}>
                <b style={{ color: KIT.txt }}>{d.titre}</b>
                <div style={{ fontSize: 13, color: KIT.txt2 }}>{s.termines} / {s.effectif} ont tout fait · <span style={{ color: TONS[e.ton], fontWeight: 700 }}>{e.texte}</span></div>
              </div>))}
          </Carte>)}
        <Carte titre="🔁 À reprendre en classe" lien="Voir tout" onLien={() => allerA('reprendre')}>
          {R.aReprendre.length === 0 ? <div style={{ fontSize: 14, color: KIT.txt2 }}>{R.travailles === 0 ? 'Aucun exercice travaillé cette semaine.' : '✅ Rien ne pose problème à plusieurs élèves cette semaine.'}</div> : R.aReprendre.map(({ item, travailles, nbDiff }) => (
            <div key={item.cle} style={{ padding: '6px 0', borderTop: `1px dashed ${KIT.bord}`, fontSize: 14 }}>
              <b style={{ color: KIT.txt }}>{item.titre}</b>
              <div style={{ fontSize: 13, color: KIT.txt2 }}>{nbDiff} élève{nbDiff > 1 ? 's' : ''} sur {travailles} {nbDiff > 1 ? 'ont' : 'a'} eu du mal</div>
            </div>))}
        </Carte>
        <Carte titre="💤 À relancer" lien="Par élève" onLien={() => allerA('eleves')}>
          {S.aRelancer.length === 0 ? <div style={{ fontSize: 14, color: KIT.txt2 }}>✅ Tous les élèves ont travaillé sur le site depuis {JOURS_RELANCE} jours.</div> : (
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              {S.aRelancer.slice(0, 12).map(x => (
                <span key={x.identifiant} style={{ display: 'inline-block', margin: '0 6px 4px 0', padding: '1px 9px', borderRadius: 999, background: '#f1f5f9', border: `1px solid ${KIT.bord}`, color: KIT.txt }}>
                  {x.identifiant} <small style={{ color: KIT.txt2 }}>{x.jamais ? 'jamais connecté·e' : `${x.jours} j`}</small>
                </span>))}
              {S.aRelancer.length > 12 && <span style={{ fontSize: 13, color: KIT.txt2 }}>… et {S.aRelancer.length - 12} autre{S.aRelancer.length - 12 > 1 ? 's' : ''}</span>}
            </div>)}
        </Carte>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 10 }}>
        Ces chiffres viennent des séances enregistrées par le navigateur des élèves : un élève qui travaille hors du site, ou sans être connecté, n’apparaît pas comme actif. C’est une aide pour décider, pas une mesure exacte.
      </div>
    </div>);
}
