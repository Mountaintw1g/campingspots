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
import { AccountModal } from "./components/AccountModal";
import { AdminModal } from "./components/AdminModal";
import { UsernameGateModal } from "./components/UsernameGateModal";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import { errorMessage } from "./lib/http";
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
  const { user, loading: authLoading, isAdmin, username, usernameChecked, signOut } = useAuth();
  const needsUsername = !!user && usernameChecked && username === null;
  const { t } = useLanguage();

  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [reportingPlace, setReportingPlace] = useState<Place | null>(null);
  const [viewingReportPlace, setViewingReportPlace] = useState<Place | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
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
      .catch((err) => setError(errorMessage(err, t)));
    // Hämta om platserna när inloggningsstatus ändras, så savedByMe/reportedByMe/ownerId-koll blir rätt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(errorMessage(err, t));
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
      setError(errorMessage(err, t));
    }
  }

  async function handleUpdate(id: string, updatedPlace: NewPlace) {
    try {
      const updated = await updatePlace(id, updatedPlace);
      setPlaces((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingPlace(null);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, t));
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
      setError(errorMessage(err, t));
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
      setError(errorMessage(err, t));
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
      setNotice(t.notices.reportSent);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, t));
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
      setNotice(t.notices.reportDeleted);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  async function handleAccountDeleted() {
    setShowAccount(false);
    await signOut();
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
            <LanguageSwitcher />
            {user ? (
              <>
                <span className="brand-user">{user.email}</span>
                <button type="button" className="about-link-button" onClick={() => setShowAccount(true)}>
                  {t.header.account}
                </button>
                {isAdmin && (
                  <button type="button" className="about-link-button" onClick={() => setShowAdmin(true)}>
                    {t.header.admin}
                  </button>
                )}
                <button type="button" className="about-link-button" onClick={() => signOut()}>
                  {t.header.logout}
                </button>
              </>
            ) : (
              <button type="button" className="about-link-button" onClick={() => setShowAuth(true)}>
                {t.header.login}
              </button>
            )}
            <button type="button" className="about-link-button" onClick={() => setShowAbout(true)}>
              {t.header.about}
            </button>
          </div>
        </div>
        <p className="sidebar-hint">{t.sidebar.hint}</p>
        <TypeLegend activeTypes={activeTypes} onToggleType={toggleType} onShowAll={showAllTypes} />
        {error && <p className="error">{error}</p>}
        {notice && <p className="notice">{notice}</p>}
        {pendingLocation && (
          <PlaceForm
            key="new"
            mode="create"
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
            mode="edit"
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
        <CollapsibleSection title={t.sidebar.myPlaces} count={filteredMyPlaces.length}>
          {!user ? (
            <p className="place-list-empty">{t.sidebar.loginToManage}</p>
          ) : (
            <PlaceList
              places={filteredMyPlaces}
              emptyMessage={myPlaces.length === 0 ? t.sidebar.noPlacesYet : t.sidebar.noPlacesFilter}
              currentUserId={user?.id ?? null}
              isAdmin={isAdmin}
              onEditPlace={startEditing}
              onDeletePlace={handleDelete}
              onToggleSaved={handleToggleSaved}
            />
          )}
        </CollapsibleSection>
        <CollapsibleSection title={t.sidebar.savedPlaces} count={filteredSavedPlaces.length}>
          {!user ? (
            <p className="place-list-empty">{t.sidebar.loginToSave}</p>
          ) : (
            <PlaceList
              places={filteredSavedPlaces}
              emptyMessage={savedPlaces.length === 0 ? t.sidebar.noSavedYet : t.sidebar.noSavedFilter}
              currentUserId={user?.id ?? null}
              isAdmin={isAdmin}
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
          isAdmin={isAdmin}
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
      {showAccount && (
        <AccountModal onClose={() => setShowAccount(false)} onAccountDeleted={handleAccountDeleted} />
      )}
      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
      {needsUsername && <UsernameGateModal />}
    </div>
  );
}

export default App;
