import { useState, type FormEvent } from "react";
import { placeTypeLabels, placeTypes, type NewPlace, type PlaceType } from "../types/place";

interface PlaceFormProps {
  title: string;
  location: { lat: number; lng: number };
  initialValues?: { name: string; description: string; type: PlaceType };
  submitLabel: string;
  requireLegalConfirmation?: boolean;
  onSubmit: (place: NewPlace) => void;
  onCancel: () => void;
  onTypeChange?: (type: PlaceType) => void;
}

export function PlaceForm({
  title,
  location,
  initialValues,
  submitLabel,
  requireLegalConfirmation = false,
  onSubmit,
  onCancel,
  onTypeChange,
}: PlaceFormProps) {
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
      <h2>{title}</h2>
      <p className="place-form-coords">
        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
      </p>

      <label>
        Namn
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>

      <label>
        Beskrivning
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>

      <label>
        Typ
        <select value={type} onChange={(e) => handleTypeChange(e.target.value as PlaceType)}>
          {placeTypes.map((t) => (
            <option key={t} value={t}>
              {placeTypeLabels[t]}
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
          Jag har kontrollerat att platsen är laglig att tälta på enligt allemansrätten (inte privat tomt,
          skyddat område eller för nära bebyggelse).
        </label>
      )}

      <div className="place-form-actions">
        <button type="submit" disabled={!legalConfirmed}>
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  );
}
