const STORAGE_KEY = "taltkartan:reported-places";

export function getReportedPlaceIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markPlaceReported(id: string): void {
  const ids = getReportedPlaceIds();
  ids.add(id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage otillgängligt (t.ex. privat läge) - spärren gäller bara för sessionen då.
  }
}
