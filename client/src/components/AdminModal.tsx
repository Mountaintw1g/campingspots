import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { fetchAllUsers, type AdminUser } from "../api/admin";
import { errorMessage } from "../lib/http";

interface AdminModalProps {
  onClose: () => void;
}

export function AdminModal({ onClose }: AdminModalProps) {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetchAllUsers()
      .then(setUsers)
      .catch((err) => setError(errorMessage(err, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatDate(value: string | null) {
    if (!value) return t.admin.never;
    return new Date(value).toLocaleString(language === "sv" ? "sv-SE" : "en-GB");
  }

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-modal-header">
          <h2>{t.admin.title}</h2>
          <button type="button" className="about-close" onClick={onClose} aria-label={t.admin.close}>
            ✕
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {!users && !error && <p>...</p>}

        {users && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.admin.email}</th>
                  <th>{t.admin.createdAt}</th>
                  <th>{t.admin.lastSignIn}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{formatDate(u.lastSignInAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
