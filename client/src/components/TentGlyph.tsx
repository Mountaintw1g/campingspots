import { placeTypeColors, type PlaceType } from "../types/place";

interface TentGlyphProps {
  type: PlaceType;
  size?: number;
}

export function TentGlyph({ type, size = 20 }: TentGlyphProps) {
  const color = placeTypeColors[type].solid;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size * (42 / 32)} aria-hidden="true" className="tent-glyph">
      <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z" fill={color} />
      <path d="M12 4 L17 13 L7 13 Z" fill="#ffffff" />
      <path d="M12 9 L14 13 L10 13 Z" fill={color} />
    </svg>
  );
}
