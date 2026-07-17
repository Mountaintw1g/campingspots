import { useState, type FormEvent } from "react";
import { placeTypes, type NewPlace, type PlaceType } from "../types/place";
import { useLanguage } from "../context/LanguageContext";

interface PlaceFormProps {
  mode: "create" | "edit";
  location: { lat: number; lng: number };
  initialValues?: { name: string; description: string; type: PlaceType };
  requireLegalConfirmation?: boolean;
  onSubmit: (place: NewPlace) => void;
  onCancel: () => void;
  onTypeChange?: (type: PlaceType) => void;
}

export function PlaceForm({
  mode,
  location,
  initialValues,
  requireLegalConfirmation = false,
  onSubmit,
  onCancel,
  onTypeChange,
}: PlaceFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [type, setType] = useState<PlaceType>(initialValues?.type ?? "ovrigt");
  const [legalConfirmed, setLegalConfirmed] = useState(!requireLegalConfirmation);

  function handleTypeChange(newType: PlaceType) {
    setType(newType);
    onTypeChange?.(newType);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !legalConfirmed) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      latitude: location.lat,
      longitude: location.lng,
      type,
      legalConfirmed,
    });
  }

  return (
    <form className="place-form" onSubmit={handleSubmit}>
      <h2>{mode === "create" ? t.placeForm.newTitle : t.placeForm.editTitle}</h2>
      <p className="place-form-coords">
        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
      </p>

      <label>
        {t.placeForm.name}
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>

      <label>
        {t.placeForm.description}
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>

      <label>
        {t.placeForm.type}
        <select value={type} onChange={(e) => handleTypeChange(e.target.value as PlaceType)}>
          {placeTypes.map((pt) => (
            <option key={pt} value={pt}>
              {t.placeTypes[pt]}
            </option>
          ))}
        </select>
      </label>

      {requireLegalConfirmation && (
        <label className="place-form-checkbox">
          <input
            type="checkbox"
            checked={legalConfirmed}
            onChange={(e) => setLegalConfirmed(e.target.checked)}
          />
          {t.placeForm.legalConfirmLabel}
        </label>
      )}

      <div className="place-form-actions">
        <button type="submit" disabled={!legalConfirmed}>
          {mode === "create" ? t.placeForm.saveNew : t.placeForm.saveEdit}
        </button>
        <button type="button" onClick={onCancel}>
          {t.placeForm.cancel}
        </button>
      </div>
    </form>
  );
}
