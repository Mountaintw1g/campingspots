import type { Place } from "../types/place";
import { placeTypeColors } from "../types/place";
import { TentGlyph } from "./TentGlyph";
import { useLanguage } from "../context/LanguageContext";

interface PlaceListProps {
  places: Place[];
  emptyMessage: string;
  currentUserId: string | null;
  isAdmin: boolean;
  onEditPlace: (place: Place) => void;
  onDeletePlace: (id: string) => void;
  onToggleSaved: (place: Place) => void;
}

export function PlaceList({
  places,
  emptyMessage,
  currentUserId,
  isAdmin,
  onEditPlace,
  onDeletePlace,
  onToggleSaved,
}: PlaceListProps) {
  const { t } = useLanguage();

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
                {t.placeTypes[place.type]}
              </span>
              <button
                type="button"
                className={`star-toggle${place.savedByMe ? " saved" : ""}`}
                onClick={() => onToggleSaved(place)}
                title={place.savedByMe ? t.placeList.saveRemove : t.placeList.saveAdd}
                aria-label={place.savedByMe ? t.placeList.saveRemove : t.placeList.saveAdd}
              >
                {place.savedByMe ? "★" : "☆"}
              </button>
            </div>
          </div>
          {place.description && <p>{place.description}</p>}
          {place.reportCount > 0 && <p className="report-count-badge">{t.placeList.reportCount(place.reportCount)}</p>}
          {(place.ownerId === currentUserId || isAdmin) && (
            <div className="place-list-actions">
              <button onClick={() => onEditPlace(place)}>{t.placeList.edit}</button>
              <button onClick={() => onDeletePlace(place.id)}>{t.placeList.delete}</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
