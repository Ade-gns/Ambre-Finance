import { Component } from "react";

/* Filet de sécurité global : sans ça, une exception de rendu React fait
   disparaître toute l'UI (écran blanc, plus rien de cliquable) sans aucun
   signal pour l'utilisateur. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ambre] erreur non rattrapée :", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--cream-100, #f4ede3)", padding: 24, boxSizing: "border-box",
      }}>
        <div style={{
          maxWidth: 440, textAlign: "center", background: "var(--cream-50, #fff)",
          border: "1px solid var(--line, #e4d9c8)", borderRadius: 16,
          padding: "32px 28px", boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
        }}>
          <div style={{ fontSize: 17, fontFamily: "var(--font-display, serif)", color: "var(--ink-900, #241a10)", marginBottom: 8 }}>
            Un problème est survenu
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-600, #6b6055)", marginBottom: 20, lineHeight: 1.5 }}>
            Ambre a rencontré une erreur inattendue et a dû interrompre l'affichage de cet écran.
            Vos données ne sont pas perdues.
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: "9px 18px", borderRadius: 8, border: "1px solid var(--line, #e4d9c8)",
              background: "var(--amber-500, #b8693d)", color: "#fff", fontSize: 13,
              cursor: "pointer", marginRight: 8,
            }}>
            Réessayer
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "9px 18px", borderRadius: 8, border: "1px solid var(--line, #e4d9c8)",
              background: "transparent", color: "var(--ink-800, #241a10)", fontSize: 13,
              cursor: "pointer",
            }}>
            Recharger l'application
          </button>
        </div>
      </div>
    );
  }
}
