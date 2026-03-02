declare module 'which-polygon' {
  function whichPolygon(
    geojson: GeoJSON.FeatureCollection
  ): (point: [number, number]) => Record<string, unknown> | null;
  export default whichPolygon;
}
