// Bibliothèques lourdes chargées seulement quand une simulation en a besoin (et non à l’ouverture du site).
const BASE = import.meta.env.BASE_URL;
const promesses = {};

function chargerScript(fichier) {
  if (!promesses[fichier]) {
    promesses[fichier] = new Promise((ok, ko) => {
      const s = document.createElement("script");
      s.src = BASE + "vendor/" + fichier;
      s.onload = ok;
      s.onerror = () => { delete promesses[fichier]; ko(new Error("chargement impossible : " + fichier)); };
      document.head.appendChild(s);
    });
  }
  return promesses[fichier];
}

export const chargerPlotly = () => (window.Plotly ? Promise.resolve() : chargerScript("plotly-1.58.5.min.js"));
export const chargerJsPDF = () => (window.jspdf ? Promise.resolve() : chargerScript("jspdf-2.5.1.umd.min.js"));

// Simulations qui dessinent des graphiques Plotly (liste établie en suivant les importations de chaque simulation).
// Si l’on crée une nouvelle simulation qui utilise Plotly, ajouter son identifiant ici.
export const SIMS_PLOTLY = new Set([3, 4, 7, 8, 9, 13, 15, 26, 29]);
