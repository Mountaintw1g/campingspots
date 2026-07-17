import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { fetchAllUsers, fetchReportedPlaces, dismissReports, type AdminUser, type AdminReportedPlace } from "../api/admin";
import { deletePlace } from "../api/places";
import { errorMessage } from "../lib/http";

interface AdminModalProps {
  onClose: () => void;
}

export function AdminModal({ onClose }: AdminModalProps) {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState<"users" | "reports">("users");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [reportedPlaces, setReportedPlaces] = useState<AdminReportedPlace[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlaceId, setBusyPlaceId] = useState<string | null>(null);

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

  useEffect(() => {
    if (tab !== "reports" || reportedPlaces) return;
    fetchReportedPlaces()
      .then(setReportedPlaces)
      .catch((err) => setError(errorMessage(err, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function formatDate(value: string | null) {
    if (!value) return t.admin.never;
    return new Date(value).toLocaleString(language === "sv" ? "sv-SE" : "en-GB");
  }

  async function handleDismiss(placeId: string) {
    setBusyPlaceId(placeId);
    setError(null);
    try {
      await dismissReports(placeId);
      setReportedPlaces((prev) => (prev ? prev.filter((p) => p.id !== placeId) : prev));
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusyPlaceId(null);
    }
  }

  async function handleDeletePlace(placeId: string) {
    setBusyPlaceId(placeId);
    setError(null);
    try {
      await deletePlace(placeId);
      setReportedPlaces((prev) => (prev ? prev.filter((p) => p.id !== placeId) : prev));
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusyPlaceId(null);
    }
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

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab${tab === "users" ? " active" : ""}`}
            onClick={() => setTab("users")}
          >
            {t.admin.tabUsers}
          </button>
          <button
            type="button"
            className={`admin-tab${tab === "reports" ? " active" : ""}`}
            onClick={() => setTab("reports")}
          >
            {t.admin.tabReports}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {tab === "users" && (
          <>
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
          </>
        )}

        {tab === "reports" && (
          <>
            {!reportedPlaces && !error && <p>...</p>}
            {reportedPlaces && reportedPlaces.length === 0 && <p>{t.admin.noReports}</p>}
            {reportedPlaces && reportedPlaces.length > 0 && (
              <ul className="admin-report-list">
                {reportedPlaces.map((place) => (
                  <li key={place.id} className="admin-report-place">
                    <div className="admin-report-place-header">
                      <strong>{place.name}</strong>
                      <span className="report-count-badge">{t.placeList.reportCount(place.reports.length)}</span>
                    </div>
                    <p className="place-list-added-by">
                      {place.ownerUsername ? t.placeList.addedBy(place.ownerUsername) : t.placeList.addedByUnknown}
                    </p>
                    <ul className="admin-report-entries">
                      {place.reports.map((report) => (
                        <li key={report.id}>
                          <strong>{t.reportReasons[report.reason]}</strong>
                          {report.comment && <> - {report.comment}</>}
                          <br />
                          <span className="admin-report-meta">
                            {report.reporterUsername ?? t.placeList.addedByUnknown} · {formatDate(report.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="place-list-actions">
                      <button type="button" onClick={() => handleDismiss(place.id)} disabled={busyPlaceId === place.id}>
                        {t.admin.dismissReports}
                      </button>
                      <button
                        type="button"
                        className="account-delete-button"
                        onClick={() => handleDeletePlace(place.id)}
                        disabled={busyPlaceId === place.id}
                      >
                        {t.placeList.delete}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
