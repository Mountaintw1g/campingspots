import L from "leaflet";
import { placeTypeColors, type PlaceType } from "../types/place";

function buildTentIconSvg(color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="42">
      <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z" fill="${color}"/>
      <path d="M12 4 L17 13 L7 13 Z" fill="#ffffff"/>
      <path d="M12 9 L14 13 L10 13 Z" fill="${color}"/>
    </svg>
  `;
}

const iconCache = new Map<PlaceType, L.DivIcon>();

export function getTentIcon(type: PlaceType): L.DivIcon {
  const cached = iconCache.get(type);
  if (cached) return cached;

  const icon = L.divIcon({
    html: buildTentIconSvg(placeTypeColors[type].solid),
    className: "tent-marker-icon",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
  iconCache.set(type, icon);
  return icon;
}
