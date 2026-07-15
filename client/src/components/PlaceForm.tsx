import { useState, type FormEvent } from "react";
import { placeTypeLabels, placeTypes, type NewPlace, type PlaceType } from "../types/place";

interface PlaceFormProps {
  title: string;
  location: { lat: number; lng: number };
  initialValues?: { name: string; description: string; type: PlaceType };
  submitLabel: string;
  onSubmit: (place: NewPlace) => void;
  onCancel: () => void;
}

export function PlaceForm({ title, location, initialValues, submitLabel, onSubmit, onCancel }: PlaceFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [type, setType] = useState<PlaceType>(initialValues?.type ?? "ovrigt");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      latitude: location.lat,
      longitude: location.lng,
      type,
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
        <select value={type} onChange={(e) => setType(e.target.value as PlaceType)}>
          {placeTypes.map((t) => (
            <option key={t} value={t}>
              {placeTypeLabels[t]}
            </option>
          ))}
        </select>
      </label>

      <div className="place-form-actions">
        <button type="submit">{submitLabel}</button>
        <button type="button" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  );
}
