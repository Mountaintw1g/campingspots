import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { MapView } from "./components/MapView";
import { PlaceForm } from "./components/PlaceForm";
import { PlaceList } from "./components/PlaceList";
import { TypeLegend } from "./components/TypeLegend";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { createPlace, deletePlace, fetchPlaces, setPlaceSaved, updatePlace } from "./api/places";
import type { NewPlace, Place, PlaceType } from "./types/place";

function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  // Typen som just nu är vald i formuläret - används för att förhandsvisa
  // markörfärgen på kartan innan platsen sparas.
  const [previewType, setPreviewType] = useState<PlaceType>("ovrigt");
  const [error, setError] = useState<string | null>(null);

  const savedPlaces = places.filter((p) => p.saved);

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .catch((err) => setError(err.message));
  }, []);

  function startCreatingAt(lat: number, lng: number) {
    setEditingPlace(null);
    setPendingLocation({ lat, lng });
    setPreviewType("ovrigt");
  }

  function startEditing(place: Place) {
    setPendingLocation(null);
    setEditingPlace(place);
    setPreviewType(place.type);
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

  async function handleToggleSaved(place: Place) {
    try {
      const updated = await setPlaceSaved(place.id, !place.saved);
      setPlaces((prev) => prev.map((p) => (p.id === place.id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte uppdatera sparad-status");
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Tältplatser i naturen</h1>
        <p className="sidebar-hint">Klicka var som helst på kartan för att lägga till en ny tältplats.</p>
        <TypeLegend />
        {error && <p className="error">{error}</p>}
        {pendingLocation && (
          <PlaceForm
            key="new"
            title="Ny tältplats"
            submitLabel="Spara plats"
            location={pendingLocation}
            onSubmit={handleCreate}
            onCancel={cancelForm}
            onTypeChange={setPreviewType}
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
            onTypeChange={setPreviewType}
          />
        )}
        <CollapsibleSection title="Mina platser" count={places.length}>
          <PlaceList
            places={places}
            emptyMessage="Inga tältplatser ännu. Klicka på kartan för att lägga till en."
            onEditPlace={startEditing}
            onDeletePlace={handleDelete}
            onToggleSaved={handleToggleSaved}
          />
        </CollapsibleSection>
        <CollapsibleSection title="Sparade platser" count={savedPlaces.length}>
          <PlaceList
            places={savedPlaces}
            emptyMessage="Inga sparade platser ännu. Klicka på stjärnan vid en plats för att spara den här."
            onEditPlace={startEditing}
            onDeletePlace={handleDelete}
            onToggleSaved={handleToggleSaved}
          />
        </CollapsibleSection>
      </aside>
      <main className="map-container">
        <MapView
          places={places}
          pendingLocation={pendingLocation}
          previewType={previewType}
          editingPlaceId={editingPlace?.id ?? null}
          onMapClick={startCreatingAt}
          onEditPlace={startEditing}
          onDeletePlace={handleDelete}
          onToggleSaved={handleToggleSaved}
        />
      </main>
    </div>
  );
}

export default App;
