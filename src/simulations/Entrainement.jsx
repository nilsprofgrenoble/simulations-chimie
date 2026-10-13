import { useState, useMemo } from "react";
import { cardStyle, KIT, styleBouton, stylePetitBouton, styleBoite, lireProgression } from "../commun";
import { ENONCES } from "./AtelierDonneesBanque";
import { SCENARIOS } from "./AtelierGraphiqueBanque";
import { FAMILLES as FAM_REA } from "./AtelierRealiserBanque";
import { FAMILLES as FAM_ANA } from "./AtelierAnalyserBanque";
import { ORDRE_DOMAINES } from "./ordreDomaines";

const ROSE = '#e11d48';
const TRANSVERSAL = 'Tous thèmes (transversal)';

// Titre court d'un graphique (la fonction titre dépend des valeurs tirées au hasard)
const titreGraphique = s => {
  try { return String(s.titre(s.gen ? s.gen() : {})).replace(/\s*\(.*\)\s*$/, ''); } catch { return s.id; }
};

// Les quatre compétences, dans l'ordre conseillé
const COMPETENCES = [
  { code: "S'APP", nom: "S’approprier", couleur: '#0ea5e9', dispo: true,
    but: "Comprendre ce qui est demandé : repérer les données utiles, les associer aux symboles et aux unités, lire un graphique.",
    ateliers: [{ id: 34, nom: 'Extraire les données d’un énoncé' }, { id: 35, nom: 'Lire un graphique' }] },
  { code: 'ANA', nom: 'Analyser', couleur: '#7c3aed', dispo: true,
    but: "Construire la démarche : ce que l’on cherche, quelles relations, quelles hypothèses, dans quel ordre calculer, et prévoir sans calculer.",
    ateliers: [{ id: 37, nom: 'Analyser un problème' }] },
  { code: 'REA', nom: 'Réaliser', couleur: '#16a34a', dispo: true,
    but: "Mener le calcul sans se tromper : unités et conversions, isoler une grandeur, chiffres significatifs, calculatrice.",
    ateliers: [{ id: 36, nom: 'Réaliser un calcul' }] },
  { code: 'VAL', nom: 'Valider', couleur: '#ea580c', dispo: false,
    but: "Juger son résultat : ordre de grandeur, unité, cohérence physique, incertitude.", ateliers: [] },
];

// Tous les exercices, avec leur clé de progression (voir noterReussite dans les ateliers)
function tousLesExercices() {
  const L = [];
  ENONCES.forEach(e => e.noms.forEach((n, q) => L.push({ atelier: 34, comp: "S'APP", cle: `34:${e.id}.${q}`, ex: `${e.id}.${q}`, domaine: e.domaine, titre: `${e.titre} — ${n}` })));
  SCENARIOS.forEach(s => L.push({ atelier: 35, comp: "S'APP", cle: `35:${s.id}`, ex: s.id, domaine: s.domaine, titre: titreGraphique(s) }));
  FAM_ANA.forEach(f => f.liste.forEach(it => L.push({ atelier: 37, comp: 'ANA', cle: `37:${f.id}:${it.id}`, ex: `${f.id}.${it.id}`, domaine: it.domaine, titre: `${f.titre} — ${it.titre}` })));
  FAM_REA.forEach(f => L.push({ atelier: 36, comp: 'REA', cle: `36:${f.id}`, ex: f.id, domaine: TRANSVERSAL, titre: f.titre }));
  return L;
}

export function SimulationEntrainement({ naviguer }) {
  const [theme, setTheme] = useState('tous');
  const [comp, setComp] = useState('toutes');
  const [prog, setProg] = useState(lireProgression);
  const exos = useMemo(tousLesExercices, []);
  const themes = [...ORDRE_DOMAINES.filter(d => exos.some(e => e.domaine === d)), TRANSVERSAL];
  const liste = exos.filter(e => (theme === 'tous' || e.domaine === theme) && (comp === 'toutes' || e.comp === comp));
  const nbFaits = l => l.filter(e => prog[e.cle]).length;
  const ouvrir = e => naviguer(e.atelier, e.ex);
  const effacer = () => {
    if (!window.confirm('Effacer la progression mémorisée sur cet appareil ?')) return;
    try { window.localStorage.removeItem('progression-ateliers-v1'); } catch { /* indisponible */ }
    setProg({});
  };

  return (
    <div style={{ ...cardStyle, maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ margin: 0, color: ROSE }}>🏋️ Je m’entraîne ! Travail par compétence.</h2>
      <p style={{ color: KIT.txt2, fontSize: 14, lineHeight: 1.55 }}>
        Chaque exercice travaille <b>une</b> compétence de la démarche scientifique. L’ordre conseillé suit celle d’un problème :
        <b> s’approprier → analyser → réaliser → valider</b>. Tu peux commencer par n’importe quelle compétence, mais si tu hésites, suis cet ordre.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, margin: '14px 0' }}>
        {COMPETENCES.map((c, i) => {
          const mes = exos.filter(e => e.comp === c.code);
          return (
            <div key={c.code} data-comp={c.code} style={{ ...styleBoite, borderLeft: `5px solid ${c.couleur}`, opacity: c.dispo ? 1 : 0.65 }}>
              <div style={{ fontSize: 12, color: KIT.txt2 }}>Étape {i + 1}</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: c.couleur }}>{c.code} <span style={{ fontWeight: 600, fontSize: 14, color: KIT.txt }}>{c.nom}</span></div>
              <div style={{ fontSize: 13, color: KIT.txt2, margin: '6px 0 8px', lineHeight: 1.5 }}>{c.but}</div>
              {c.dispo ? (
                <>
                  <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>{nbFaits(mes)} exercice{nbFaits(mes) > 1 ? 's' : ''} réussi{nbFaits(mes) > 1 ? 's' : ''} sur {mes.length}</div>
                  <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', marginBottom: 8 }}>
                    <div style={{ height: 6, borderRadius: 3, background: c.couleur, width: `${100 * nbFaits(mes) / mes.length}%` }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {c.ateliers.map(a => <button key={a.id} onClick={() => naviguer(a.id)} style={styleBouton(true, c.couleur)}>{a.nom} ▶</button>)}
                  </div>
                </>
              ) : <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>🚧 Bientôt</div>}
            </div>
          );
        })}
      </div>

      <h3 style={{ marginBottom: 6 }}>Tous les exercices, par thème</h3>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <button onClick={() => setTheme('tous')} style={stylePetitBouton(theme === 'tous', ROSE)}>Tous les thèmes</button>
        {themes.map(t => <button key={t} onClick={() => setTheme(t)} style={stylePetitBouton(theme === t, ROSE)}>{t}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <button onClick={() => setComp('toutes')} style={stylePetitBouton(comp === 'toutes', ROSE)}>Toutes les compétences</button>
        {COMPETENCES.filter(c => c.dispo).map(c => <button key={c.code} onClick={() => setComp(c.code)} style={stylePetitBouton(comp === c.code, c.couleur)}>{c.code}</button>)}
      </div>

      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>{liste.length} exercice{liste.length > 1 ? 's' : ''} · {nbFaits(liste)} réussi{nbFaits(liste) > 1 ? 's' : ''}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {liste.map(e => {
          const c = COMPETENCES.find(x => x.code === e.comp);
          return (
            <button key={e.cle} data-cle={e.cle} onClick={() => ouvrir(e)}
              style={{ display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', padding: '7px 10px', border: `1px solid ${KIT.bord}`, borderRadius: 8, background: prog[e.cle] ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: 13.5, color: KIT.txt }}>
              <span style={{ minWidth: 20 }}>{prog[e.cle] ? '✅' : '⬜'}</span>
              <span style={{ fontWeight: 800, color: c.couleur, minWidth: 48 }}>{e.comp}</span>
              <span style={{ flex: 1 }}>{e.titre}</span>
              {theme === 'tous' && <span style={{ fontSize: 11.5, color: KIT.txt2 }}>{e.domaine}</span>}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: KIT.txt2, marginTop: 14, lineHeight: 1.5 }}>
        Ta progression est mémorisée uniquement sur cet appareil et dans ce navigateur : elle n’est envoyée à personne.
        {' '}<button onClick={effacer} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>Effacer ma progression</button>
      </p>
    </div>
  );
}
