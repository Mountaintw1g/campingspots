import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
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
        setNotice(t.auth.signupNotice);
      }
    }
    setSubmitting(false);
  }

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-modal-header">
          <h2>{mode === "login" ? t.auth.loginTitle : t.auth.signupTitle}</h2>
          <button type="button" className="about-close" onClick={onClose} aria-label={t.myReportPanel.close}>
            ✕
          </button>
        </div>

        <form className="place-form" onSubmit={handleSubmit}>
          <label>
            {t.auth.email}
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
            {t.auth.password}
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
              {mode === "login" ? t.auth.loginTitle : t.auth.signupTitle}
            </button>
            <button type="button" onClick={onClose}>
              {t.auth.cancel}
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
          {mode === "login" ? t.auth.toSignup : t.auth.toLogin}
        </button>
      </div>
    </div>
  );
}
