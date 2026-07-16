import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    if (mode === "login") {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    } else {
      const result = await signUp(email, password);
      if (result.error) {
        setError(result.error);
      } else if (result.session) {
        // E-postbekräftelse är avstängd i projektet - kontot är redan aktivt.
        onClose();
      } else {
        setNotice("Kontot är skapat. Kolla din e-post för att bekräfta adressen innan du loggar in.");
      }
    }
    setSubmitting(false);
  }

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-modal-header">
          <h2>{mode === "login" ? "Logga in" : "Skapa konto"}</h2>
          <button type="button" className="about-close" onClick={onClose} aria-label="Stäng">
            ✕
          </button>
        </div>

        <form className="place-form" onSubmit={handleSubmit}>
          <label>
            E-post
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </label>
          <label>
            Lösenord
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {error && <p className="error">{error}</p>}
          {notice && <p className="notice">{notice}</p>}

          <div className="place-form-actions">
            <button type="submit" disabled={submitting}>
              {mode === "login" ? "Logga in" : "Skapa konto"}
            </button>
            <button type="button" onClick={onClose}>
              Avbryt
            </button>
          </div>
        </form>

        <button
          type="button"
          className="auth-mode-toggle"
          onClick={() => {
            setMode((m) => (m === "login" ? "signup" : "login"));
            setError(null);
            setNotice(null);
          }}
        >
          {mode === "login" ? "Inget konto än? Skapa ett här." : "Har du redan ett konto? Logga in istället."}
        </button>
      </div>
    </div>
  );
}
