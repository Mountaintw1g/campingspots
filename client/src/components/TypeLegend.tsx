import { placeTypeColors, placeTypeLabels, placeTypes, type PlaceType } from "../types/place";

interface TypeLegendProps {
  activeTypes: Set<PlaceType>;
  onToggleType: (type: PlaceType) => void;
  onShowAll: () => void;
}

export function TypeLegend({ activeTypes, onToggleType, onShowAll }: TypeLegendProps) {
  const allActive = activeTypes.size === placeTypes.length;

  return (
    <div className="type-legend-wrap">
      <ul className="type-legend">
        {placeTypes.map((type) => {
          const active = activeTypes.has(type);
          return (
            <li key={type}>
              <button
                type="button"
                className={`type-legend-item${active ? "" : " inactive"}`}
                onClick={() => onToggleType(type)}
                aria-pressed={active}
              >
                <span className="type-legend-dot" style={{ backgroundColor: placeTypeColors[type].solid }} />
                {placeTypeLabels[type]}
              </button>
            </li>
          );
        })}
      </ul>
      {!allActive && (
        <button type="button" className="type-legend-reset" onClick={onShowAll}>
          Visa alla kategorier
        </button>
      )}
    </div>
  );
}
