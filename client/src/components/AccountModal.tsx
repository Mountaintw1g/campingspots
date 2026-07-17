import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { deleteAccount } from "../api/account";
import { errorMessage } from "../lib/http";

interface AccountModalProps {
  onClose: () => void;
  onAccountDeleted: () => void;
}

export function AccountModal({ onClose, onAccountDeleted }: AccountModalProps) {
  const { user, updatePassword } = useAuth();
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmittingPassword(true);
    setPasswordError(null);
    setPasswordNotice(null);

    const result = await updatePassword(newPassword);
    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordNotice(t.account.passwordUpdated);
      setNewPassword("");
    }
    setSubmittingPassword(false);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      onAccountDeleted();
    } catch (err) {
      setDeleteError(errorMessage(err, t));
      setDeleting(false);
    }
  }

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-modal-header">
          <h2>{t.account.title}</h2>
          <button type="button" className="about-close" onClick={onClose} aria-label={t.account.close}>
            ✕
          </button>
        </div>

        <p className="account-signed-in-as">
          {t.account.signedInAs}: <strong>{user?.email}</strong>
        </p>

        <section>
          <h3>{t.account.changePasswordTitle}</h3>
          <form className="place-form" onSubmit={handlePasswordSubmit}>
            <label>
              {t.account.newPassword}
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            {passwordError && <p className="error">{passwordError}</p>}
            {passwordNotice && <p className="notice">{passwordNotice}</p>}
            <div className="place-form-actions">
              <button type="submit" disabled={submittingPassword}>
                {t.account.updatePassword}
              </button>
            </div>
          </form>
        </section>

        <section className="account-danger-zone">
          <h3>{t.account.dangerZoneTitle}</h3>
          <p>{t.account.deleteExplain}</p>
          {deleteError && <p className="error">{deleteError}</p>}
          {!confirmingDelete ? (
            <button type="button" className="account-delete-button" onClick={() => setConfirmingDelete(true)}>
              {t.account.deleteAccount}
            </button>
          ) : (
            <div className="place-form-actions">
              <button
                type="button"
                className="account-delete-button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {t.account.deleteConfirmButton}
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                {t.placeForm.cancel}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
