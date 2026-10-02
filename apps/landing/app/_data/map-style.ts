import type { StyleSpecification } from "maplibre-gl";

// OpenStreetMap через MapLibre, приглушённая до тёплого серого: на ней горят только
// оранжевые точки заведений. Атрибуция OSM остаётся видимой — это условие лицензии.
export const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#f4efed" } },
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: {
        "raster-saturation": -0.82,
        "raster-contrast": -0.08,
        "raster-brightness-min": 0.1,
        "raster-opacity": 0.9,
      },
    },
  ],
};
