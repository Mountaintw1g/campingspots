import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { checkUsernameAvailable, setMyUsername } from "../api/profile";
import { errorMessage } from "../lib/http";

const USERNAME_REGEX = /^[a-zA-Z0-9]{3,20}$/;

export function UsernameGateModal() {
  const { setUsernameLocally } = useAuth();
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formatValid = USERNAME_REGEX.test(value);

  useEffect(() => {
    if (!formatValid) {
      setAvailability("idle");
      return;
    }
    setAvailability("checking");
    const handle = window.setTimeout(() => {
      checkUsernameAvailable(value)
        .then((available) => setAvailability(available ? "available" : "taken"))
        .catch(() => setAvailability("idle"));
    }, 400);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, formatValid]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formatValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await setMyUsername(value);
      setUsernameLocally(result.username);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="about-overlay">
      <div className="about-modal">
        <div className="about-modal-header">
          <h2>{t.username.title}</h2>
        </div>
        <p>{t.username.intro}</p>
        <form className="place-form" onSubmit={handleSubmit}>
          <label>
            {t.username.label}
            <input type="text" value={value} onChange={(e) => setValue(e.target.value)} autoFocus maxLength={20} />
          </label>
          <p className="username-hint">{t.username.hint}</p>
          {formatValid && availability === "checking" && <p className="notice">{t.username.checking}</p>}
          {formatValid && availability === "available" && <p className="notice">{t.username.available}</p>}
          {formatValid && availability === "taken" && <p className="error">{t.username.taken}</p>}
          {error && <p className="error">{error}</p>}
          <div className="place-form-actions">
            <button type="submit" disabled={submitting || !formatValid || availability === "taken"}>
              {t.username.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
