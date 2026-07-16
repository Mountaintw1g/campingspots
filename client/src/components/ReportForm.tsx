import { useState, type FormEvent } from "react";
import { reportReasonLabels, reportReasons, type Place, type ReportReason } from "../types/place";

interface ReportFormProps {
  place: Place;
  onSubmit: (reason: ReportReason, comment: string) => void;
  onCancel: () => void;
}

export function ReportForm({ place, onSubmit, onCancel }: ReportFormProps) {
  const [reason, setReason] = useState<ReportReason>("privat_mark");
  const [comment, setComment] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(reason, comment.trim());
  }

  return (
    <form className="place-form report-form" onSubmit={handleSubmit}>
      <h2>Rapportera "{place.name}"</h2>

      <label>
        Anledning
        <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
          {reportReasons.map((r) => (
            <option key={r} value={r}>
              {reportReasonLabels[r]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Kommentar (valfritt)
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
      </label>

      <div className="place-form-actions">
        <button type="submit">Skicka rapport</button>
        <button type="button" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  );
}
