export const placeTypes = ["skog", "vid_vagen", "fjall", "strand", "ovrigt"] as const;
export type PlaceType = (typeof placeTypes)[number];

export const placeTypeLabels: Record<PlaceType, string> = {
  skog: "Skog",
  vid_vagen: "Vid vägen",
  fjall: "Fjäll",
  strand: "Strand",
  ovrigt: "Övrigt",
};

export interface Place {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  type: PlaceType;
  ownerId: string | null;
  createdAt: string;
}

export interface NewPlace {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  type: PlaceType;
}
