import type { Place } from "../types/place";
import { placeTypeLabels } from "../types/place";

interface PlaceListProps {
  places: Place[];
  onEditPlace: (place: Place) => void;
  onDeletePlace: (id: string) => void;
}

export function PlaceList({ places, onEditPlace, onDeletePlace }: PlaceListProps) {
  if (places.length === 0) {
    return <p className="place-list-empty">Inga tältplatser ännu. Klicka på kartan för att lägga till en.</p>;
  }

  return (
    <ul className="place-list">
      {places.map((place) => (
        <li key={place.id}>
          <div className="place-list-item-header">
            <strong>{place.name}</strong>
            <span className="place-list-type">{placeTypeLabels[place.type]}</span>
          </div>
          {place.description && <p>{place.description}</p>}
          <div className="place-list-actions">
            <button onClick={() => onEditPlace(place)}>Redigera</button>
            <button onClick={() => onDeletePlace(place.id)}>Ta bort</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
