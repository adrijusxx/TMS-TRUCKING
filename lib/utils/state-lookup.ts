/**
 * Offline coordinate-to-state lookup using point-in-polygon.
 *
 * Replaces expensive Google Maps reverse geocoding API calls
 * with a free, sub-millisecond local lookup against US state
 * boundary polygons (Census Bureau 110m simplified).
 */

import whichPolygon from 'which-polygon';
import statesGeoJSON from '@/lib/data/us-states.json';

const STATE_NAME_TO_ABBR: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR',
  California: 'CA', Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE',
  Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID',
  Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS',
  Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
  'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA',
  'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
  Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY', 'District of Columbia': 'DC',
  'Puerto Rico': 'PR',
};

let stateIndex: ReturnType<typeof whichPolygon> | null = null;

function getIndex() {
  if (!stateIndex) {
    stateIndex = whichPolygon(statesGeoJSON as GeoJSON.FeatureCollection);
  }
  return stateIndex;
}

/**
 * Determine which US state a coordinate falls in.
 * Returns 2-letter state abbreviation or null if not in a US state.
 *
 * Uses offline polygon lookup — zero API calls.
 */
export function getStateFromCoordinates(
  lat: number,
  lng: number
): string | null {
  const result = getIndex()([lng, lat]); // GeoJSON uses [lng, lat]
  const name = result?.name as string | undefined;
  if (!name) return null;
  return STATE_NAME_TO_ABBR[name] || null;
}
