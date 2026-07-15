import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { MapView } from "./components/MapView";
import { PlaceForm } from "./components/PlaceForm";
import { PlaceList } from "./components/PlaceList";
import { createPlace, deletePlace, fetchPlaces, updatePlace } from "./api/places";
import type { NewPlace, Place } from "./types/place";

function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .catch((err) => setError(err.message));
  }, []);

  function startCreatingAt(lat: number, lng: number) {
    setEditingPlace(null);
    setPendingLocation({ lat, lng });
  }

  function startEditing(place: Place) {
    setPendingLocation(null);
    setEditingPlace(place);
  }

  function cancelForm() {
    setPendingLocation(null);
    setEditingPlace(null);
  }

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

  async function handleUpdate(id: string, updatedPlace: NewPlace) {
    try {
      const updated = await updatePlace(id, updatedPlace);
      setPlaces((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingPlace(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte uppdatera platsen");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePlace(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      if (editingPlace?.id === id) setEditingPlace(null);
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
          <PlaceForm
            key="new"
            title="Ny tältplats"
            submitLabel="Spara plats"
            location={pendingLocation}
            onSubmit={handleCreate}
            onCancel={cancelForm}
          />
        )}
        {editingPlace && (
          <PlaceForm
            key={editingPlace.id}
            title="Redigera tältplats"
            submitLabel="Spara ändringar"
            location={{ lat: editingPlace.latitude, lng: editingPlace.longitude }}
            initialValues={{
              name: editingPlace.name,
              description: editingPlace.description ?? "",
              type: editingPlace.type,
            }}
            onSubmit={(values) => handleUpdate(editingPlace.id, values)}
            onCancel={cancelForm}
          />
        )}
        <h2>Sparade platser ({places.length})</h2>
        <PlaceList places={places} onEditPlace={startEditing} onDeletePlace={handleDelete} />
      </aside>
      <main className="map-container">
        <MapView
          places={places}
          pendingLocation={pendingLocation}
          onMapClick={startCreatingAt}
          onEditPlace={startEditing}
          onDeletePlace={handleDelete}
        />
      </main>
    </div>
  );
}

export default App;
