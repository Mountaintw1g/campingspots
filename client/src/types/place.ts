export const placeTypes = ["skog", "vid_vatten", "fjall", "vagkant", "ovrigt"] as const;
export type PlaceType = (typeof placeTypes)[number];

export const placeTypeLabels: Record<PlaceType, string> = {
  skog: "Skog",
  vid_vatten: "Vid vatten",
  fjall: "Fjäll",
  vagkant: "Vägkant",
  ovrigt: "Övrigt",
};

export interface PlaceTypeColor {
  solid: string;
  soft: string;
  text: string;
}

export const placeTypeColors: Record<PlaceType, PlaceTypeColor> = {
  skog: { solid: "#2e7d32", soft: "#e8f5e9", text: "#2e7d32" },
  vid_vatten: { solid: "#3b7ea5", soft: "#e3edf3", text: "#2f6485" },
  fjall: { solid: "#5a6672", soft: "#eceef0", text: "#48525c" },
  vagkant: { solid: "#c2703d", soft: "#f6e8dd", text: "#9c5726" },
  ovrigt: { solid: "#7a7264", soft: "#efece7", text: "#625b4f" },
};

export interface Place {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  type: PlaceType;
  ownerId: string | null;
  saved: boolean;
  createdAt: string;
}

export interface NewPlace {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  type: PlaceType;
}
