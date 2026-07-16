import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { MapView } from "./components/MapView";
import { PlaceForm } from "./components/PlaceForm";
import { PlaceList } from "./components/PlaceList";
import { TypeLegend } from "./components/TypeLegend";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { ReportForm } from "./components/ReportForm";
import { MyReportPanel } from "./components/MyReportPanel";
import { Logo } from "./components/Logo";
import { AboutModal } from "./components/AboutModal";
import {
  createPlace,
  deletePlace,
  deleteReport,
  fetchPlaces,
  reportPlace,
  setPlaceSaved,
  updatePlace,
} from "./api/places";
import { getMyReports, removeMyReport, saveMyReport } from "./lib/myReports";
import { placeTypes } from "./types/place";
import type { NewPlace, Place, PlaceType, Report, ReportReason } from "./types/place";

function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [reportingPlace, setReportingPlace] = useState<Place | null>(null);
  const [viewingReportPlace, setViewingReportPlace] = useState<Place | null>(null);
  const [myReports, setMyReports] = useState<Map<string, Report>>(() => getMyReports());
  const [showAbout, setShowAbout] = useState(false);
  const [activeTypes, setActiveTypes] = useState<Set<PlaceType>>(() => new Set(placeTypes));
  // Typen som just nu är vald i formuläret - används för att förhandsvisa
  // markörfärgen på kartan innan platsen sparas.
  const [previewType, setPreviewType] = useState<PlaceType>("ovrigt");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const savedPlaces = places.filter((p) => p.saved);
  const filteredPlaces = places.filter((p) => activeTypes.has(p.type));
  const filteredSavedPlaces = savedPlaces.filter((p) => activeTypes.has(p.type));
  // Håll kvar markören för den plats som just redigeras även om dess typ är
  // filtrerad bort, så den inte försvinner mitt under redigering.
  const mapPlaces = places.filter((p) => activeTypes.has(p.type) || p.id === editingPlace?.id);

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .catch((err) => setError(err.message));
  }, []);

  function startCreatingAt(lat: number, lng: number) {
    setEditingPlace(null);
    setReportingPlace(null);
    setViewingReportPlace(null);
    setPendingLocation({ lat, lng });
    setPreviewType("ovrigt");
    setNotice(null);
  }

  function startEditing(place: Place) {
    setPendingLocation(null);
    setReportingPlace(null);
    setViewingReportPlace(null);
    setEditingPlace(place);
    setPreviewType(place.type);
    setNotice(null);
  }

  function startReporting(place: Place) {
    if (myReports.has(place.id)) return;
    setPendingLocation(null);
    setEditingPlace(null);
    setViewingReportPlace(null);
    setReportingPlace(place);
    setNotice(null);
  }

  function startViewingReport(place: Place) {
    setPendingLocation(null);
    setEditingPlace(null);
    setReportingPlace(null);
    setViewingReportPlace(place);
    setNotice(null);
  }

  function toggleType(type: PlaceType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function showAllTypes() {
    setActiveTypes(new Set(placeTypes));
  }

  function cancelForm() {
    setPendingLocation(null);
    setEditingPlace(null);
    setReportingPlace(null);
    setViewingReportPlace(null);
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
      if (reportingPlace?.id === id) setReportingPlace(null);
      if (viewingReportPlace?.id === id) setViewingReportPlace(null);
      if (myReports.has(id)) {
        removeMyReport(id);
        setMyReports((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
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

  async function handleReport(reason: ReportReason, comment: string) {
    if (!reportingPlace) return;
    try {
      const created = await reportPlace(reportingPlace.id, reason, comment || undefined);
      setPlaces((prev) =>
        prev.map((p) => (p.id === reportingPlace.id ? { ...p, reportCount: p.reportCount + 1 } : p)),
      );
      saveMyReport(created);
      setMyReports((prev) => new Map(prev).set(reportingPlace.id, created));
      setReportingPlace(null);
      setNotice("Tack, rapporten har skickats.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka rapporten");
    }
  }

  async function handleDeleteReport() {
    if (!viewingReportPlace) return;
    const report = myReports.get(viewingReportPlace.id);
    if (!report) return;
    try {
      await deleteReport(viewingReportPlace.id, report.id);
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === viewingReportPlace.id ? { ...p, reportCount: Math.max(0, p.reportCount - 1) } : p,
        ),
      );
      removeMyReport(viewingReportPlace.id);
      setMyReports((prev) => {
        const next = new Map(prev);
        next.delete(viewingReportPlace.id);
        return next;
      });
      setViewingReportPlace(null);
      setNotice("Rapporten togs bort.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort rapporten");
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={34} />
          <h1>
            <span className="brand-accent">Tält</span>kartan
          </h1>
          <button type="button" className="about-link-button" onClick={() => setShowAbout(true)}>
            Om
          </button>
        </div>
        <p className="sidebar-hint">Klicka var som helst på kartan för att lägga till en ny tältplats.</p>
        <TypeLegend activeTypes={activeTypes} onToggleType={toggleType} onShowAll={showAllTypes} />
        {error && <p className="error">{error}</p>}
        {notice && <p className="notice">{notice}</p>}
        {pendingLocation && (
          <PlaceForm
            key="new"
            title="Ny tältplats"
            submitLabel="Spara plats"
            location={pendingLocation}
            requireLegalConfirmation
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
        {reportingPlace && <ReportForm place={reportingPlace} onSubmit={handleReport} onCancel={cancelForm} />}
        {viewingReportPlace &&
          (() => {
            const report = myReports.get(viewingReportPlace.id);
            if (!report) return null;
            return (
              <MyReportPanel
                place={viewingReportPlace}
                report={report}
                onDelete={handleDeleteReport}
                onClose={cancelForm}
              />
            );
          })()}
        <CollapsibleSection title="Mina platser" count={filteredPlaces.length}>
          <PlaceList
            places={filteredPlaces}
            emptyMessage={
              places.length === 0
                ? "Inga tältplatser ännu. Klicka på kartan för att lägga till en."
                : "Inga platser matchar valda kategorier."
            }
            onEditPlace={startEditing}
            onDeletePlace={handleDelete}
            onToggleSaved={handleToggleSaved}
          />
        </CollapsibleSection>
        <CollapsibleSection title="Sparade platser" count={filteredSavedPlaces.length}>
          <PlaceList
            places={filteredSavedPlaces}
            emptyMessage={
              savedPlaces.length === 0
                ? "Inga sparade platser ännu. Klicka på stjärnan vid en plats för att spara den här."
                : "Inga sparade platser matchar valda kategorier."
            }
            onEditPlace={startEditing}
            onDeletePlace={handleDelete}
            onToggleSaved={handleToggleSaved}
          />
        </CollapsibleSection>
      </aside>
      <main className="map-container">
        <MapView
          places={mapPlaces}
          pendingLocation={pendingLocation}
          previewType={previewType}
          editingPlaceId={editingPlace?.id ?? null}
          myReports={myReports}
          onMapClick={startCreatingAt}
          onEditPlace={startEditing}
          onDeletePlace={handleDelete}
          onToggleSaved={handleToggleSaved}
          onReportPlace={startReporting}
          onViewReport={startViewingReport}
        />
      </main>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;
