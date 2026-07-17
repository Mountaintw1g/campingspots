import { useState, type FormEvent } from "react";
import { reportReasons, type Place, type ReportReason } from "../types/place";
import { useLanguage } from "../context/LanguageContext";

interface ReportFormProps {
  place: Place;
  onSubmit: (reason: ReportReason, comment: string) => void;
  onCancel: () => void;
}

export function ReportForm({ place, onSubmit, onCancel }: ReportFormProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState<ReportReason>("farlig_plats");
  const [comment, setComment] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(reason, comment.trim());
  }

  return (
    <form className="place-form report-form" onSubmit={handleSubmit}>
      <h2>{t.reportForm.title(place.name)}</h2>

      <label>
        {t.reportForm.reason}
        <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
          {reportReasons.map((r) => (
            <option key={r} value={r}>
              {t.reportReasons[r]}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t.reportForm.comment}
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
      </label>

      <div className="place-form-actions">
        <button type="submit">{t.reportForm.submit}</button>
        <button type="button" onClick={onCancel}>
          {t.placeForm.cancel}
        </button>
      </div>
    </form>
  );
}
