import { STATS_ACTIVES } from "./stats";
import { ecrireAuAuteur } from "./contact";
import { TEXTE2, ACCENT } from "./theme";

// Pied de page : présent en bas de toutes les pages du site (compact, sur fond clair).
const lien = { color: TEXTE2, textDecoration: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontSize: 13.5, fontWeight: 700 };

export function PiedDePage({ naviguer, energyUrl }) {
  const aller = id => e => { e.preventDefault(); naviguer(id); };
  return (
    <footer style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e9eef4 100%)', borderTop: '1px solid #cbd5e1', color: '#475569', padding: '12px 16px 10px',
      marginTop: 24, fontFamily: "'Nunito', 'Segoe UI', sans-serif", textAlign: 'center' }}>
      <nav aria-label="Liens du pied de page" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 20px' }}>
        <a href="?" onClick={aller(0)} style={lien}>Accueil</a>
        <a href="?sim=47" onClick={aller(47)} style={lien}>À propos</a>
        <button type="button" onClick={() => ecrireAuAuteur('Paillasse virtuelle — message')} style={lien}>Contact</button>
        <a href="?sim=38" onClick={aller(38)} style={lien}>Travail par compétence</a>
        <a href="?sim=39" onClick={aller(39)} style={lien}>Mon compte</a>
        <a href={energyUrl} style={lien}>Energy@School ↗</a>
        <a href="?sim=47" onClick={aller(47)} style={lien}>Données personnelles</a>
        <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr" target="_blank" rel="noopener noreferrer" style={{ ...lien, color: ACCENT }}>Licence CC BY-NC-ND 4.0 ↗</a>
      </nav>
      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5 }}>
        © {new Date().getFullYear()} Nils Aronssohn · Paillasse virtuelle · reproduction et modification non autorisées
        {STATS_ACTIVES && <> · statistiques de fréquentation anonymes, sans cookie ni compte</>}
      </div>
    </footer>
  );
}
