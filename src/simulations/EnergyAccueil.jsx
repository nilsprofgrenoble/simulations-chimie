import { cardStyle, KIT, styleBoite } from "../commun";

// ====================================================
// ENERGY@SCHOOL — PAGE D'ENTRÉE
// Vue d'ensemble de la journée et accès aux six pages d'ateliers.
// ====================================================

const THEMES = [
  { nom: 'Produire', icone: '🌊', couleur: '#0284c7', question: 'Comment transformer l’énergie de l’eau en électricité ?',
    pages: [
      { id: 19, nom: 'Production 1 · Turbine Pelton', texte: 'Une conduite forcée, une turbine Pelton et un alternateur : puissance de l’eau, puissance électrique, rendement, oscilloscope.' },
      { id: 20, nom: 'Production 2 · Banc Pelton', texte: 'Une vraie turbine de laboratoire, freinée pour mesurer sa puissance mécanique et trouver sa vitesse optimale.' },
      { id: 21, nom: 'Production 3 · Au fil de l’eau', texte: 'Un canal et une roue à aubes : débit mesuré à la balance, puissance de l’eau, alternateur triphasé.' },
    ] },
  { nom: 'Transporter', icone: '🗼', couleur: '#7c3aed', question: 'Comment amener l’électricité jusqu’aux maisons en perdant le moins possible ?',
    pages: [
      { id: 22, nom: 'Transport · Réseau électrique', texte: 'Transformateurs et câbles : pourquoi on transporte l’électricité sous haute tension.' },
    ] },
  { nom: 'Stocker', icone: '🔋', couleur: '#2563eb', question: 'Comment garder l’énergie pour plus tard ?',
    pages: [
      { id: 23, nom: 'Stockage · Batteries', texte: 'Ce qui se passe dans une batterie lithium-ion, puis assembler des cellules pour un téléphone ou une voiture.' },
    ] },
  { nom: 'Hydrogène', icone: '💧', couleur: '#16a34a', question: 'Et si l’on stockait l’électricité sous forme de gaz ?',
    pages: [
      { id: 18, nom: 'Hydrogène · Électrolyse et pile', texte: 'De la lumière au dihydrogène, puis du dihydrogène à l’électricité, avec une vraie pile à combustible.' },
    ] },
];

export function EnergyAccueil() {
  const { txt: TXT, txt2: TXT2 } = KIT;
  const chaine = (
    <svg viewBox="0 0 640 120" role="img" aria-label="La chaîne de l'énergie : produire, transporter, stocker, hydrogène"
      style={{ width: '100%', height: 'auto', display: 'block' }}>
      {THEMES.map((t, k) => {
        const x = 12 + k * 158;
        return (
          <g key={t.nom}>
            <rect x={x} y="14" width="130" height="86" rx="12" fill="white" stroke={t.couleur} strokeWidth="3"/>
            <text x={x + 65} y="52" fontSize="30" textAnchor="middle">{t.icone}</text>
            <text x={x + 65} y="84" fontSize="17" fontWeight="800" fill={t.couleur} textAnchor="middle">{t.nom}</text>
            {k < THEMES.length - 1 && (
              <g>
                <line x1={x + 132} y1="57" x2={x + 154} y2="57" stroke={TXT2} strokeWidth="3"/>
                <polygon points={`${x + 150},50 ${x + 158},57 ${x + 150},64`} fill={TXT2}/>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, color: TXT }}>Energy@School · Préparer la journée à l'ENSE3</h2>
      <p style={{ fontSize: 15.5, color: TXT, lineHeight: 1.6, margin: '0 0 12px' }}>
        Pendant une journée dans les laboratoires de Grenoble INP – Ense³, vous allez découvrir comment on <strong>produit</strong>,
        <strong> transporte</strong> et <strong>stocke</strong> l'énergie électrique, et le rôle que peut jouer l'<strong>hydrogène</strong>.
        Chaque élève participe à deux ateliers sur les quatre. Ces pages vous permettent de les préparer avant, et d'y revenir après.
      </p>

      <div style={{ ...styleBoite, marginBottom: 12 }}>
        {chaine}
        <div style={{ fontSize: 14, color: TXT2, lineHeight: 1.55, marginTop: 6 }}>
          Le fil rouge de la journée : à chaque étape, on mesure la puissance reçue et la puissance utile, et on calcule un
          <strong> rendement</strong>. Il n'atteint jamais 100 % : une partie de l'énergie part toujours en chaleur.
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 12 }}>
        {THEMES.map(t => (
          <div key={t.nom} style={{ background: 'white', border: `1.5px solid ${t.couleur}`, borderTop: `6px solid ${t.couleur}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.couleur }}>{t.icone} {t.nom}</div>
            <div style={{ fontSize: 14, color: TXT, fontStyle: 'italic', margin: '2px 0 8px' }}>{t.question}</div>
            {t.pages.map(pg => (
              <a key={pg.id} href={`?sim=${pg.id}`} style={{ display: 'block', textDecoration: 'none', padding: '8px 10px', borderRadius: 8,
                border: '1px solid #e2e8f0', marginBottom: 6, background: '#f8fafc' }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: TXT }}>{pg.nom} ›</div>
                <div style={{ fontSize: 13, color: TXT2, lineHeight: 1.45 }}>{pg.texte}</div>
              </a>
            ))}
          </div>
        ))}
      </div>

      <div style={{ ...styleBoite }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TXT, marginBottom: 6 }}>Comment utiliser ces pages ?</div>
        <div style={{ fontSize: 14.5, color: TXT, lineHeight: 1.6 }}>
          Chaque page propose trois modes, accessibles à tout moment :
          <ul style={{ margin: '4px 0 8px', paddingLeft: 20 }}>
            <li><strong>🧭 Parcours guidé</strong> : on vous accompagne étape par étape, comme pendant le TP. Commencez par là.</li>
            <li><strong>🔍 Exploration libre</strong> : tous les réglages, pour tester vos propres idées.</li>
            <li><strong>🎯 Défi</strong> : une mission à réussir sans aide.</li>
          </ul>
          <strong>Avant la journée</strong> : faites le parcours guidé des deux ateliers auxquels vous participerez.
          <strong> Après la journée</strong> : revenez explorer, relevez les défis, et découvrez les ateliers que vous n'avez pas faits.
          <div style={{ fontSize: 13, color: TXT2, marginTop: 6 }}>Votre progression dans les parcours est enregistrée sur cet appareil : vous pouvez vous arrêter et reprendre plus tard.</div>
        </div>
      </div>
    </div>
  );
}
