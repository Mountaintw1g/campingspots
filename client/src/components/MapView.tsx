import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "./LeafletIconFix";
import type { Place } from "../types/place";
import { placeTypeLabels } from "../types/place";

const SWEDEN_CENTER: [number, number] = [62.0, 15.0];
const SWEDEN_ZOOM = 5;

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapViewProps {
  places: Place[];
  pendingLocation: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  onDeletePlace: (id: string) => void;
}

export function MapView({ places, pendingLocation, onMapClick, onDeletePlace }: MapViewProps) {
  return (
    <MapContainer center={SWEDEN_CENTER} zoom={SWEDEN_ZOOM} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />
      {places.map((place) => (
        <Marker key={place.id} position={[place.latitude, place.longitude]}>
          <Popup>
            <strong>{place.name}</strong>
            <br />
            {placeTypeLabels[place.type]}
            {place.description && (
              <>
                <br />
                {place.description}
              </>
            )}
            <br />
            <button onClick={() => onDeletePlace(place.id)}>Ta bort</button>
          </Popup>
        </Marker>
      ))}
      {pendingLocation && (
        <Marker position={[pendingLocation.lat, pendingLocation.lng]}>
          <Popup>Ny plats - fyll i formuläret</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
