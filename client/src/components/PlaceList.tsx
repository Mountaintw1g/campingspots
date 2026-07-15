import type { Place } from "../types/place";
import { placeTypeLabels } from "../types/place";

interface PlaceListProps {
  places: Place[];
  onDeletePlace: (id: string) => void;
}

export function PlaceList({ places, onDeletePlace }: PlaceListProps) {
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
          <button onClick={() => onDeletePlace(place.id)}>Ta bort</button>
        </li>
      ))}
    </ul>
  );
}
