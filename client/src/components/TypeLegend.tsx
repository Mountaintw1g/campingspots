import { placeTypeColors, placeTypeLabels, placeTypes } from "../types/place";

export function TypeLegend() {
  return (
    <ul className="type-legend">
      {placeTypes.map((type) => (
        <li key={type}>
          <span className="type-legend-dot" style={{ backgroundColor: placeTypeColors[type].solid }} />
          {placeTypeLabels[type]}
        </li>
      ))}
    </ul>
  );
}
