import type { Place } from "../types/place";
import { placeTypeColors, placeTypeLabels } from "../types/place";
import { TentGlyph } from "./TentGlyph";

interface PlaceListProps {
  places: Place[];
  emptyMessage: string;
  reportedPlaceIds: Set<string>;
  onEditPlace: (place: Place) => void;
  onDeletePlace: (id: string) => void;
  onToggleSaved: (place: Place) => void;
  onReportPlace: (place: Place) => void;
}

export function PlaceList({
  places,
  emptyMessage,
  reportedPlaceIds,
  onEditPlace,
  onDeletePlace,
  onToggleSaved,
  onReportPlace,
}: PlaceListProps) {
  if (places.length === 0) {
    return <p className="place-list-empty">{emptyMessage}</p>;
  }

  return (
    <ul className="place-list">
      {places.map((place) => (
        <li key={place.id}>
          <div className="place-list-item-header">
            <div className="place-list-item-title">
              <TentGlyph type={place.type} size={18} />
              <strong>{place.name}</strong>
            </div>
            <div className="place-list-item-header-right">
              <span
                className="place-list-type"
                style={{
                  backgroundColor: placeTypeColors[place.type].soft,
                  color: placeTypeColors[place.type].text,
                }}
              >
                {placeTypeLabels[place.type]}
              </span>
              <button
                type="button"
                className={`star-toggle${place.saved ? " saved" : ""}`}
                onClick={() => onToggleSaved(place)}
                title={place.saved ? "Ta bort från Sparade platser" : "Lägg till i Sparade platser"}
                aria-label={place.saved ? "Ta bort från Sparade platser" : "Lägg till i Sparade platser"}
              >
                {place.saved ? "★" : "☆"}
              </button>
            </div>
          </div>
          {place.description && <p>{place.description}</p>}
          {place.reportCount > 0 && (
            <p className="report-count-badge">
              🚩 {place.reportCount} {place.reportCount === 1 ? "rapport" : "rapporter"}
            </p>
          )}
          <div className="place-list-actions">
            <button onClick={() => onEditPlace(place)}>Redigera</button>
            <button onClick={() => onDeletePlace(place.id)}>Ta bort</button>
            <button
              onClick={() => onReportPlace(place)}
              disabled={reportedPlaceIds.has(place.id)}
              title={reportedPlaceIds.has(place.id) ? "Du har redan rapporterat den här platsen" : undefined}
            >
              {reportedPlaceIds.has(place.id) ? "Rapporterad ✓" : "Rapportera"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
