import { useEffect, useState } from "react";
import { ACCENT, TEXTE, TEXTE2 } from "./theme";

// Installer le site sur l'écran d'accueil du téléphone (application web : aucun magasin d'applications).
// Android/Chrome : bouton qui lance l'installation. iPhone : mode d'emploi (Safari ne propose pas de bouton).
export function InstallerAppli() {
  const [evt, setEvt] = useState(null);
  const [installee, setInstallee] = useState(() => { try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch { return false; } });
  useEffect(() => {
    const avant = e => { e.preventDefault(); setEvt(e); };
    const fait = () => setInstallee(true);
    window.addEventListener('beforeinstallprompt', avant);
    window.addEventListener('appinstalled', fait);
    return () => { window.removeEventListener('beforeinstallprompt', avant); window.removeEventListener('appinstalled', fait); };
  }, []);
  if (installee) return <div style={{ fontSize: 14, color: TEXTE2, alignSelf: 'center' }}>✓ L’application est installée sur cet appareil.</div>;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: TEXTE }}>Installer l’application</div>
      {evt
        ? <button onClick={async () => { evt.prompt(); try { await evt.userChoice; } catch { /* annulé */ } setEvt(null); }}
            style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 8, border: 'none', background: ACCENT, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Installer sur cet appareil</button>
        : ios
          ? <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: TEXTE2, lineHeight: 1.6 }}>
              <li>Ouvre ce site avec <b>Safari</b>.</li>
              <li>Touche le bouton <b>Partager</b> (un carré avec une flèche vers le haut).</li>
              <li>Touche <b>« Sur l’écran d’accueil »</b>, puis <b>Ajouter</b>.</li>
            </ol>
          : <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: TEXTE2, lineHeight: 1.6 }}>
              <li>Touche les <b>3 points ⋮</b> du navigateur (en haut à droite).</li>
              <li>Touche <b>« Installer »</b> (le texte exact change selon le téléphone : « Installer l’application », « Installer et créer un raccourci » ou « Ajouter à l’écran d’accueil »).</li>
              <li>L’icône « Paillasse » apparaît sur ton écran d’accueil.</li>
            </ol>}
      <div style={{ fontSize: 12.5, color: TEXTE2 }}>Rien à télécharger : c’est un raccourci vers le site, gratuit.</div>
    </div>
  );
}
