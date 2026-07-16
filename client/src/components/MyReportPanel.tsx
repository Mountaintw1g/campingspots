import { reportReasonLabels, type Place, type Report } from "../types/place";

interface MyReportPanelProps {
  place: Place;
  report: Report;
  onDelete: () => void;
  onClose: () => void;
}

export function MyReportPanel({ place, report, onDelete, onClose }: MyReportPanelProps) {
  return (
    <div className="place-form">
      <h2>Din rapport för "{place.name}"</h2>
      <p>
        <strong>Anledning:</strong> {reportReasonLabels[report.reason]}
      </p>
      {report.comment && (
        <p>
          <strong>Kommentar:</strong> {report.comment}
        </p>
      )}
      <div className="place-form-actions">
        <button type="button" onClick={onDelete}>
          Ta bort rapport
        </button>
        <button type="button" onClick={onClose}>
          Stäng
        </button>
      </div>
    </div>
  );
}
