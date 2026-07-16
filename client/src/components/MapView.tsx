import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { getTentIcon } from "./tentIcon";
import type { Place, PlaceType, Report } from "../types/place";
import { placeTypeLabels } from "../types/place";

const SWEDEN_CENTER: [number, number] = [62.0, 15.0];
const SWEDEN_ZOOM = 5;
// Ett dubbelklick (zoom) triggar även två vanliga klick - vänta och se om det
// följs av ett dblclick innan vi tolkar det som "lägg till plats här".
const DOUBLE_CLICK_GRACE_MS = 250;

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  const pendingClick = useRef<number | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (pendingClick.current !== null) window.clearTimeout(pendingClick.current);
      pendingClick.current = window.setTimeout(() => {
        pendingClick.current = null;
        onMapClick(lat, lng);
      }, DOUBLE_CLICK_GRACE_MS);
    },
    dblclick() {
      if (pendingClick.current !== null) {
        window.clearTimeout(pendingClick.current);
        pendingClick.current = null;
      }
    },
  });
  return null;
}

function LocateControl() {
  const map = useMap();
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    const control = new L.Control({ position: "topleft" });

    control.onAdd = () => {
      const button = L.DomUtil.create("button", "locate-control-button");
      button.type = "button";
      button.title = "Hitta min position";
      button.setAttribute("aria-label", "Hitta min position");
      button.textContent = "📍";
      L.DomEvent.disableClickPropagation(button);
      L.DomEvent.disableScrollPropagation(button);

      button.addEventListener("click", () => {
        if (!navigator.geolocation) {
          window.alert("Geolocation stöds inte i den här webbläsaren.");
          return;
        }
        button.disabled = true;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo([latitude, longitude], 14);
            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude]);
            } else {
              markerRef.current = L.circleMarker([latitude, longitude], {
                radius: 8,
                color: "#ffffff",
                weight: 2,
                fillColor: "#3b7ea5",
                fillOpacity: 0.9,
              }).addTo(map);
            }
            button.disabled = false;
          },
          (geoError) => {
            window.alert(`Kunde inte hämta din position: ${geoError.message}`);
            button.disabled = false;
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      });

      return button;
    };

    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}

interface MapViewProps {
  places: Place[];
  pendingLocation: { lat: number; lng: number } | null;
  previewType: PlaceType;
  editingPlaceId: string | null;
  myReports: Map<string, Report>;
  onMapClick: (lat: number, lng: number) => void;
  onEditPlace: (place: Place) => void;
  onDeletePlace: (id: string) => void;
  onToggleSaved: (place: Place) => void;
  onReportPlace: (place: Place) => void;
  onViewReport: (place: Place) => void;
}

export function MapView({
  places,
  pendingLocation,
  previewType,
  editingPlaceId,
  myReports,
  onMapClick,
  onEditPlace,
  onDeletePlace,
  onToggleSaved,
  onReportPlace,
  onViewReport,
}: MapViewProps) {
  return (
    <MapContainer center={SWEDEN_CENTER} zoom={SWEDEN_ZOOM} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />
      <LocateControl />
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          icon={getTentIcon(place.id === editingPlaceId ? previewType : place.type)}
        >
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
            {place.reportCount > 0 && (
              <>
                <br />
                🚩 {place.reportCount} {place.reportCount === 1 ? "rapport" : "rapporter"}
              </>
            )}
            <br />
            <button onClick={() => onEditPlace(place)}>Redigera</button>{" "}
            <button onClick={() => onDeletePlace(place.id)}>Ta bort</button>{" "}
            <button onClick={() => onToggleSaved(place)}>{place.saved ? "★ Sparad" : "☆ Spara"}</button>{" "}
            {myReports.has(place.id) ? (
              <button onClick={() => onViewReport(place)}>Din rapport</button>
            ) : (
              <button onClick={() => onReportPlace(place)}>Rapportera</button>
            )}
          </Popup>
        </Marker>
      ))}
      {pendingLocation && (
        <Marker position={[pendingLocation.lat, pendingLocation.lng]} icon={getTentIcon(previewType)}>
          <Popup>Ny plats - fyll i formuläret</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
