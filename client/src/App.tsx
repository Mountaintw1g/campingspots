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
import { AuthModal } from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";
import {
  createPlace,
  deletePlace,
  deleteReport,
  fetchMyReport,
  fetchPlaces,
  reportPlace,
  savePlaceForMe,
  unsavePlaceForMe,
  updatePlace,
} from "./api/places";
import { placeTypes } from "./types/place";
import type { NewPlace, Place, PlaceType, Report, ReportReason } from "./types/place";

function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [reportingPlace, setReportingPlace] = useState<Place | null>(null);
  const [viewingReportPlace, setViewingReportPlace] = useState<Place | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTypes, setActiveTypes] = useState<Set<PlaceType>>(() => new Set(placeTypes));
  // Typen som just nu är vald i formuläret - används för att förhandsvisa
  // markörfärgen på kartan innan platsen sparas.
  const [previewType, setPreviewType] = useState<PlaceType>("ovrigt");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const myPlaces = user ? places.filter((p) => p.ownerId === user.id) : [];
  const savedPlaces = places.filter((p) => p.savedByMe);
  const filteredMyPlaces = myPlaces.filter((p) => activeTypes.has(p.type));
  const filteredSavedPlaces = savedPlaces.filter((p) => activeTypes.has(p.type));
  // Håll kvar markören för den plats som just redigeras även om dess typ är
  // filtrerad bort, så den inte försvinner mitt under redigering.
  const mapPlaces = places.filter((p) => activeTypes.has(p.type) || p.id === editingPlace?.id);

  useEffect(() => {
    if (authLoading) return;
    fetchPlaces()
      .then(setPlaces)
      .catch((err) => setError(err.message));
    // Hämta om platserna när inloggningsstatus ändras, så savedByMe/reportedByMe/ownerId-koll blir rätt.
  }, [authLoading, user?.id]);

  function requireLogin(): boolean {
    if (!user) {
      setShowAuth(true);
      return false;
    }
    return true;
  }

  function startCreatingAt(lat: number, lng: number) {
    if (!requireLogin()) return;
    setEditingPlace(null);
    setReportingPlace(null);
    setViewingReportPlace(null);
    setPendingLocation({ lat, lng });
    setPreviewType("ovrigt");
    setNotice(null);
  }

  function startEditing(place: Place) {
    if (!requireLogin()) return;
    setPendingLocation(null);
    setReportingPlace(null);
    setViewingReportPlace(null);
    setEditingPlace(place);
    setPreviewType(place.type);
    setNotice(null);
  }

  function startReporting(place: Place) {
    if (!requireLogin()) return;
    if (place.reportedByMe) return;
    setPendingLocation(null);
    setEditingPlace(null);
    setViewingReportPlace(null);
    setReportingPlace(place);
    setNotice(null);
  }

  async function startViewingReport(place: Place) {
    if (!requireLogin()) return;
    setPendingLocation(null);
    setEditingPlace(null);
    setReportingPlace(null);
    setNotice(null);
    try {
      const report = await fetchMyReport(place.id);
      if (!report) return;
      setViewingReportPlace(place);
      setViewingReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte hämta rapporten");
    }
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
    setViewingReport(null);
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
      if (viewingReportPlace?.id === id) cancelForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort platsen");
    }
  }

  async function handleToggleSaved(place: Place) {
    if (!requireLogin()) return;
    try {
      if (place.savedByMe) {
        await unsavePlaceForMe(place.id);
      } else {
        await savePlaceForMe(place.id);
      }
      setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, savedByMe: !p.savedByMe } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte uppdatera sparad-status");
    }
  }

  async function handleReport(reason: ReportReason, comment: string) {
    if (!reportingPlace) return;
    try {
      await reportPlace(reportingPlace.id, reason, comment || undefined);
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === reportingPlace.id ? { ...p, reportCount: p.reportCount + 1, reportedByMe: true } : p,
        ),
      );
      setReportingPlace(null);
      setNotice("Tack, rapporten har skickats.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka rapporten");
    }
  }

  async function handleDeleteReport() {
    if (!viewingReportPlace || !viewingReport) return;
    try {
      await deleteReport(viewingReportPlace.id, viewingReport.id);
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === viewingReportPlace.id
            ? { ...p, reportCount: Math.max(0, p.reportCount - 1), reportedByMe: false }
            : p,
        ),
      );
      cancelForm();
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
          <div className="brand-actions">
            {user ? (
              <>
                <span className="brand-user">{user.email}</span>
                <button type="button" className="about-link-button" onClick={() => signOut()}>
                  Logga ut
                </button>
              </>
            ) : (
              <button type="button" className="about-link-button" onClick={() => setShowAuth(true)}>
                Logga in
              </button>
            )}
            <button type="button" className="about-link-button" onClick={() => setShowAbout(true)}>
              Om
            </button>
          </div>
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
        {viewingReportPlace && viewingReport && (
          <MyReportPanel
            place={viewingReportPlace}
            report={viewingReport}
            onDelete={handleDeleteReport}
            onClose={cancelForm}
          />
        )}
        <CollapsibleSection title="Mina platser" count={filteredMyPlaces.length}>
          {!user ? (
            <p className="place-list-empty">Logga in för att se och hantera dina egna platser.</p>
          ) : (
            <PlaceList
              places={filteredMyPlaces}
              emptyMessage={
                myPlaces.length === 0
                  ? "Inga tältplatser ännu. Klicka på kartan för att lägga till en."
                  : "Inga platser matchar valda kategorier."
              }
              currentUserId={user?.id ?? null}
              onEditPlace={startEditing}
              onDeletePlace={handleDelete}
              onToggleSaved={handleToggleSaved}
            />
          )}
        </CollapsibleSection>
        <CollapsibleSection title="Sparade platser" count={filteredSavedPlaces.length}>
          {!user ? (
            <p className="place-list-empty">Logga in för att spara favoritplatser.</p>
          ) : (
            <PlaceList
              places={filteredSavedPlaces}
              emptyMessage={
                savedPlaces.length === 0
                  ? "Inga sparade platser ännu. Klicka på stjärnan vid en plats för att spara den här."
                  : "Inga sparade platser matchar valda kategorier."
              }
              currentUserId={user?.id ?? null}
              onEditPlace={startEditing}
              onDeletePlace={handleDelete}
              onToggleSaved={handleToggleSaved}
            />
          )}
        </CollapsibleSection>
      </aside>
      <main className="map-container">
        <MapView
          places={mapPlaces}
          pendingLocation={pendingLocation}
          previewType={previewType}
          editingPlaceId={editingPlace?.id ?? null}
          currentUserId={user?.id ?? null}
          onMapClick={startCreatingAt}
          onEditPlace={startEditing}
          onDeletePlace={handleDelete}
          onToggleSaved={handleToggleSaved}
          onReportPlace={startReporting}
          onViewReport={startViewingReport}
        />
      </main>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default App;
