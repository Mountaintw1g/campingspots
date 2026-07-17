import type { Place, Report } from "../types/place";
import { useLanguage } from "../context/LanguageContext";

interface MyReportPanelProps {
  place: Place;
  report: Report;
  onDelete: () => void;
  onClose: () => void;
}

export function MyReportPanel({ place, report, onDelete, onClose }: MyReportPanelProps) {
  const { t } = useLanguage();

  return (
    <div className="place-form">
      <h2>{t.myReportPanel.title(place.name)}</h2>
      <p>
        <strong>{t.myReportPanel.reason}</strong> {t.reportReasons[report.reason]}
      </p>
      {report.comment && (
        <p>
          <strong>{t.myReportPanel.comment}</strong> {report.comment}
        </p>
      )}
      <div className="place-form-actions">
        <button type="button" onClick={onDelete}>
          {t.myReportPanel.delete}
        </button>
        <button type="button" onClick={onClose}>
          {t.myReportPanel.close}
        </button>
      </div>
    </div>
  );
}
