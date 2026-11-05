import { useState, useMemo, useEffect } from "react";
import { KIT, styleBouton, stylePetitBouton, styleBoite } from "../commun";
import { catalogueDevoirs as catalogue } from "./catalogue";
import { EspaceEleve } from "./EspaceEleve";
import { Pic } from "../Pictos";
import { rest, toutLire } from "../serveur";
import { chapitresDe } from "../chapitres";

// ═══════════════════════════════════════════════════════════════════════════
//  APERÇU ÉLÈVE (professeur) : l'espace « Mon compte » d'un élève, avec des données FICTIVES.
//  Rien n'est lu ni écrit sur le serveur ; trois profils pour voir ce qu'un élève voit selon son avancée.
//  Les dates sont calculées par rapport à aujourd'hui, pour que « à revoir », devoirs et prouesses aient du sens.
// ═══════════════════════════════════════════════════════════════════════════
const ROSE = '#0b4f94';
const PROFILS = [
  { id: 'debut', nom: '🌱 Élève qui débute (étape 0)', aide: 'Profil vide : il ne voit que sa première simulation, rien d’autre.' },
  { id: 'cours', nom: '📈 Élève en cours de route (étape 2)', aide: 'Quelques étoiles, des exercices à revoir, un devoir en retard, devoirs pas à pas.' },
  { id: 'avance', nom: '🚀 Élève très avancé', aide: 'Beaucoup d’étoiles, des badges, tous les devoirs faits.' },
];

// Fabrique des séances fictives. j : nombre de jours avant aujourd'hui.
function fabriquer(items, profil, maintenant) {
  const iso = j => new Date(maintenant.getTime() - j * 86400000).toISOString();
  const S = (cle, j, { reussi = true, essais = 1, vues = 0, duree = 120 } = {}) => ({ cle, reussi, essais, corrections_vues: vues, duree_s: duree, debut: iso(j), maj: iso(j) });
  const exos = items.filter(i => i.comp !== 'DÉFI'), defis = items.filter(i => i.comp === 'DÉFI');
  if (profil === 'debut') return [];
  const L = [];
  if (profil === 'cours') {
    const e = k => exos[k]?.cle;
    [[0, [S(e(0), 6)]], [1, [S(e(1), 9, { essais: 4, vues: 1 })]], [2, [S(e(2), 4, { essais: 2 })]], [3, [S(e(3), 12), S(e(3), 5)]], [4, [S(e(4), 3, { reussi: false, essais: 3 })]],
      [5, [S(e(5), 20), S(e(5), 8, { reussi: false, essais: 2 })]], [6, [S(e(6), 2)]], [7, [S(e(7), 1, { essais: 2 })]], [8, [S(e(8), 0, { essais: 3 })]]].forEach(([, s]) => L.push(...s.filter(x => x.cle)));
    if (defis[0]) L.push(S(defis[0].cle, 3));
    [17, 34, 56].forEach((s, k) => L.push({ cle: `sim:${s}:guide`, reussi: false, essais: 0, corrections_vues: 0, duree_s: 400 + 60 * k, debut: iso(7 - k), maj: iso(7 - k) }));
    return L;
  }
  exos.slice(0, Math.min(34, exos.length)).forEach((it, k) => {
    const m = k % 6;
    if (m === 0) L.push(S(it.cle, 14 + k % 5), S(it.cle, 4 + k % 3));
    else if (m === 1) L.push(S(it.cle, 18, { essais: 3 }), S(it.cle, 7));
    else if (m === 2) L.push(S(it.cle, 10 - (k % 4), { essais: 2 }));
    else if (m === 3) L.push(S(it.cle, 5, { vues: 1, essais: 3 }));
    else L.push(S(it.cle, 1 + (k % 6)));
  });
  defis.slice(0, 5).forEach((it, k) => L.push(S(it.cle, 2 + k)));
  [17, 34, 56, 12, 3, 20].forEach((s, k) => L.push({ cle: `sim:${s}:explore`, reussi: false, essais: 0, corrections_vues: 0, duree_s: 500 + 90 * k, debut: iso(k * 6), maj: iso(k * 6) }));
  return L;
}

function fabriquerDevoirs(items, profil, maintenant) {
  const exos = items.filter(i => i.comp !== 'DÉFI'), jour = j => new Date(maintenant.getTime() + j * 86400000), d = j => jour(j).toISOString();
  const ymd = j => { const x = jour(j); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const cle = k => exos[k % exos.length].cle;
  return [
    { id: 'a', titre: 'Révisions avant l’évaluation', cles: [2, 6, 8].map(cle), echeance: ymd(1), cree_le: d(-5) },
    { id: 'b', titre: 'Pour la rentrée', cles: [3, 4].map(cle), echeance: ymd(-3), cree_le: d(-12) },
    { id: 'c', titre: 'Découverte des ateliers', cles: [7].map(cle), echeance: null, cree_le: d(-10) },
    { id: 'd', titre: 'Première simulation : décrire un mouvement', cles: ['sim:56', ...[0, 1, 5, 9].map(cle)], echeance: ymd(6), cree_le: d(profil === 'debut' ? -1 : -2) },
  ];
}

function fabriquerClasse(profil) {
  const prouesses = [
    { code: 'cinq', pseudos: [[34, 33], [4, 17], [13, 44]] }, { code: 'sans_aide', pseudos: [[44, 29], [19, 39]] },
    { code: 'premier_coup', pseudos: [[36, 48]] }, { code: 'regulier', pseudos: [[10, 30], [28, 21], [55, 35], [8, 14]] },
  ];
  return {
    semaine: { actif: true, debut: new Date().toISOString(), effectif: 28, reussites: profil === 'debut' ? 11 : 31, objectif: 56, prouesses },
    moi: profil === 'debut' ? null : { adj: 3, nom: 16, visible: profil === 'avance' },
  };
}

// Lit, avec le compte du professeur, ce que le serveur donnerait à cet élève : ses séances, les devoirs de sa classe, la vie de classe et son pseudo.
// (Les règles de sécurité du serveur autorisent déjà le professeur à lire ces données pour les élèves de ses classes.)
async function lireEleveReel(classeId, eleveId) {
  const [lignes, devoirs, semaine, pseudos] = await Promise.all([
    toutLire(`activites?select=cle,reussi,essais,corrections_vues,duree_s,debut,maj&order=debut.desc&user_id=eq.${eleveId}`),
    rest(`devoirs?select=id,titre,cles,echeance,cree_le&classe_id=eq.${classeId}&order=cree_le.desc`).catch(() => []),
    rest('rpc/classe_semaine', { method: 'POST', corps: { c: classeId } }).catch(() => null),
    rest(`pseudos?select=adj,nom,visible&user_id=eq.${eleveId}`).catch(() => []),
  ]);
  return { lignes, devoirs: Array.isArray(devoirs) ? devoirs : [], classe: { semaine: semaine?.actif ? semaine : null, moi: pseudos?.[0] || null } };
}

export function ApercuEleve({ naviguer, onFermer, classe, eleves = [], eleveInitial }) {
  const reelPossible = !!classe && eleves.length > 0;
  const [source, setSource] = useState(eleveInitial && reelPossible ? 'reel' : 'fictif');
  const [eleveId, setEleveId] = useState(() => (eleves.some(e => e.user_id === eleveInitial) ? eleveInitial : eleves[0]?.user_id || ''));
  const [lu, setLu] = useState(null);       // { cle, donnees | erreur } : la dernière lecture terminée
  const [profil, setProfil] = useState('cours');
  const maintenant = useMemo(() => new Date(), []);
  const items = useMemo(() => catalogue(), []);
  const lignes = useMemo(() => fabriquer(items, profil, maintenant), [items, profil, maintenant]);
  const devoirs = useMemo(() => fabriquerDevoirs(items, profil, maintenant), [items, profil, maintenant]);
  const classeFictive = useMemo(() => fabriquerClasse(profil), [profil]);
  const p = PROFILS.find(x => x.id === profil);
  const cleLue = `${classe?.id}|${eleveId}`;
  useEffect(() => {
    if (source !== 'reel' || !classe?.id || !eleveId) return undefined;
    let vivant = true;
    lireEleveReel(classe.id, eleveId).then(r => { if (vivant) setLu({ cle: cleLue, donnees: r }); }).catch(e => { if (vivant) setLu({ cle: cleLue, erreur: e.message || 'Lecture impossible.' }); });
    return () => { vivant = false; };
  }, [source, classe?.id, eleveId, cleLue]);
  const courant = lu && lu.cle === cleLue ? lu : null, reel = courant?.donnees || null, erreur = courant?.erreur || '';
  const eleve = eleves.find(e => e.user_id === eleveId);
  const chaps = chapitresDe(classe?.chapitres).map(c => c.label).join(' · ');
  return (
    <div>
      <div style={{ ...styleBoite, border: '2px dashed #8fcfc5', background: '#eef7f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <b style={{ color: '#134e4a', flex: 1, minWidth: 200 }}><Pic n="eye"/>{source === 'reel' ? 'Aperçu élève : l’espace réel d’un élève de la classe, en lecture seule' : 'Aperçu élève : données fictives, rien n’est enregistré'}</b>
          <button onClick={onFermer} style={styleBouton(true, ROSE)}>← Retour au suivi</button>
        </div>
        {reelPossible && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 0' }}>
            <button onClick={() => setSource('fictif')} aria-pressed={source === 'fictif'} style={stylePetitBouton(source === 'fictif', '#1f7a72')}>Élèves fictifs</button>
            <button onClick={() => setSource('reel')} aria-pressed={source === 'reel'} style={stylePetitBouton(source === 'reel', '#1f7a72')}>Un élève de ma classe</button>
          </div>)}
        {source === 'fictif' ? (<>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 4px' }}>
            {PROFILS.map(x => <button key={x.id} onClick={() => setProfil(x.id)} style={stylePetitBouton(profil === x.id, '#1f7a72')}>{x.nom}</button>)}
          </div>
          <div style={{ fontSize: 13, color: KIT.txt2 }}>{p.aide} La vie de classe est montrée comme si elle était activée ; les boutons « Y aller » ouvrent les vrais exercices (rien n’est enregistré pour vous).{!reelPossible && ' Pour voir un vrai élève, la classe doit avoir au moins un élève.'}</div>
        </>) : (<>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0 4px', fontSize: 14, fontWeight: 700, color: '#134e4a' }}>Élève
            <select value={eleveId} onChange={e => setEleveId(e.target.value)} style={{ font: 'inherit', padding: '6px 10px', borderRadius: 8, border: '1px solid #8fcfc5', background: '#fff' }}>
              {eleves.map(e => <option key={e.user_id} value={e.user_id}>{e.identifiant}</option>)}
            </select></label>
          <div style={{ fontSize: 13, color: KIT.txt2 }}>
            Ce que voit {eleve ? <b>{eleve.identifiant}</b> : 'cet élève'} dans « Mon compte » : ses vraies séances, les devoirs de sa classe{classe?.vie_classe ? ', la vie de classe (activée)' : ' (la vie de classe est éteinte : elle n’apparaît pas)'} et son pseudo.
            {chaps ? <> Chapitre en cours pour la classe : {chaps}.</> : ' Aucun chapitre en cours n’est défini pour la classe.'} Seule cette page est reproduite ; les boutons « Y aller » ouvrent les vrais exercices (rien n’est enregistré pour vous).
          </div>
        </>)}
      </div>
      {source === 'fictif' && <div key={profil}><EspaceEleve lignes={lignes} naviguer={naviguer} apercu={{ devoirs, classe: classeFictive }} /></div>}
      {source === 'reel' && erreur && <div role="alert" style={{ ...styleBoite, color: '#991b1b' }}>Impossible de lire les données de cet élève : {erreur}</div>}
      {source === 'reel' && !erreur && !reel && <div role="status" style={{ ...styleBoite, color: KIT.txt2 }}>Chargement des données de l’élève…</div>}
      {source === 'reel' && reel && <div key={eleveId}><EspaceEleve lignes={reel.lignes} naviguer={naviguer} apercu={{ devoirs: reel.devoirs, classe: reel.classe }} /></div>}
    </div>);
}
