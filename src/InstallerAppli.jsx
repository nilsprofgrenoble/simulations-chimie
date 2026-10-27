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
          ? <div style={{ fontSize: 13.5, color: TEXTE2, lineHeight: 1.5 }}>Sur iPhone, avec Safari : touche le bouton <b>Partager</b> (le carré avec une flèche), puis <b>« Sur l’écran d’accueil »</b>.</div>
          : <div style={{ fontSize: 13.5, color: TEXTE2, lineHeight: 1.5 }}>Sur Android, avec Chrome : menu <b>⋮</b> puis <b>« Installer l’application »</b> (ou « Ajouter à l’écran d’accueil »).</div>}
      <div style={{ fontSize: 12.5, color: TEXTE2 }}>Gratuit, sans magasin d’applications : le site s’ouvre comme une application, même avec un réseau faible.</div>
    </div>
  );
}
