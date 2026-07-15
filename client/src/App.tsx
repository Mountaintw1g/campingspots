import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { MapView } from "./components/MapView";
import { PlaceForm } from "./components/PlaceForm";
import { PlaceList } from "./components/PlaceList";
import { createPlace, deletePlace, fetchPlaces } from "./api/places";
import type { NewPlace, Place } from "./types/place";

function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .catch((err) => setError(err.message));
  }, []);

  async function handleCreate(newPlace: NewPlace) {
    try {
      const created = await createPlace(newPlace);
      setPlaces((prev) => [...prev, created]);
      setPendingLocation(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara platsen");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePlace(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort platsen");
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Tältplatser i naturen</h1>
        <p className="sidebar-hint">Klicka var som helst på kartan för att lägga till en ny tältplats.</p>
        {error && <p className="error">{error}</p>}
        {pendingLocation && (
          <PlaceForm location={pendingLocation} onSubmit={handleCreate} onCancel={() => setPendingLocation(null)} />
        )}
        <h2>Sparade platser ({places.length})</h2>
        <PlaceList places={places} onDeletePlace={handleDelete} />
      </aside>
      <main className="map-container">
        <MapView
          places={places}
          pendingLocation={pendingLocation}
          onMapClick={(lat, lng) => setPendingLocation({ lat, lng })}
          onDeletePlace={handleDelete}
        />
      </main>
    </div>
  );
}

export default App;
