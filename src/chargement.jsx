import { lazy, Suspense, Component } from "react";

const CLE = "rechargement-apres-erreur-de-chargement";

// Charge une simulation à la demande. Si le fichier a disparu (nouvelle version du site publiée pendant la visite),
// on recharge la page une seule fois pour récupérer la version à jour.
export function paresseux(charger, nom) {
  return lazy(() => charger().then(m => {
    try { sessionStorage.removeItem(CLE); } catch { /* sans importance */ }
    return { default: m[nom] };
  }).catch(err => {
    try {
      if (!sessionStorage.getItem(CLE)) {
        sessionStorage.setItem(CLE, "1");
        window.location.reload();
        return new Promise(() => {});
      }
    } catch { /* sans importance */ }
    throw err;
  }));
}

export function Chargement() {
  return (
    <div role="status" aria-live="polite" style={{ padding: "48px 16px", textAlign: "center", color: "#475569", fontSize: 15 }}>
      Chargement de la simulation…
    </div>
  );
}

class Garde extends Component {
  constructor(p) { super(p); this.state = { erreur: false }; }
  static getDerivedStateFromError() { return { erreur: true }; }
  render() {
    if (!this.state.erreur) return this.props.children;
    return (
      <div role="alert" style={{ padding: "32px 16px", textAlign: "center", color: "#334155", fontSize: 15 }}>
        <p>La simulation n’a pas pu se charger (connexion interrompue ou nouvelle version du site).</p>
        <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", fontSize: 15, borderRadius: 8, border: "1.5px solid #94a3b8", background: "white", cursor: "pointer" }}>Recharger la page</button>
      </div>
    );
  }
}

export function EnChargement({ children }) {
  return <Garde><Suspense fallback={<Chargement />}>{children}</Suspense></Garde>;
}
