import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ImageResponse } from '@vercel/og';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import StaticMaps from 'staticmaps';

import { OgImage } from '@/components/og-image';
import db, { places } from '@/db';
import { localityTypeLabels } from '@/lib/types';

const fontRegular = readFileSync(join(process.cwd(), 'src/fonts/NotoSans-Regular.ttf'));
const fontBold = readFileSync(join(process.cwd(), 'src/fonts/NotoSans-Bold.ttf'));

type BBox = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

interface NominatimResult {
  boundingbox: [string, string, string, string];
}

async function fetchBboxFromOsm(osmId: string): Promise<BBox | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/lookup?osm_ids=N${osmId},W${osmId},R${osmId}&format=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'places-og-image/1.0' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as NominatimResult[];
    if (!data.length || !data[0].boundingbox) return null;

    const [minLat, maxLat, minLng, maxLng] = data[0].boundingbox.map(Number);

    // Validate all values are finite numbers
    if (![minLat, maxLat, minLng, maxLng].every(Number.isFinite)) return null;

    return [minLng, minLat, maxLng, maxLat];
  } catch {
    return null;
  }
}

function expandBbox(bbox: BBox, factor: number): BBox {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const lngPadding = (maxLng - minLng) * factor;
  const latPadding = (maxLat - minLat) * factor;
  return [minLng - lngPadding, minLat - latPadding, maxLng + lngPadding, maxLat + latPadding];
}

function calculateZoomFromBbox(bbox: BBox, width: number, height: number): number {
  const [minLng, minLat, maxLng, maxLat] = bbox;

  const WORLD_DIM = 256;
  const ZOOM_MAX = 18;
  const ZOOM_MIN = 1;

  function latRad(lat: number) {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  function zoom(mapPx: number, worldPx: number, fraction: number) {
    if (fraction <= 0) return ZOOM_MAX;
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  const latFraction = (latRad(maxLat) - latRad(minLat)) / Math.PI;
  const lngDiff = maxLng - minLng;
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;

  const latZoom = zoom(height, WORLD_DIM, latFraction);
  const lngZoom = zoom(width, WORLD_DIM, lngFraction);

  const result = Math.min(latZoom, lngZoom, ZOOM_MAX);

  // Ensure we return a valid number
  if (!Number.isFinite(result) || result < ZOOM_MIN) return 14;
  return result;
}

function getBboxCenter(bbox: BBox): [number, number] {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

async function generateMapImage(lat: number, lng: number, osmId: string | null): Promise<string> {
  // Validate input coordinates
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
  }

  const width = 1200;
  const height = 630;

  const map = new StaticMaps({
    width,
    height,
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileRequestHeader: {
      'User-Agent': 'places-og-image/1.0',
    },
  });

  let bbox: BBox | null = null;
  if (osmId) {
    bbox = await fetchBboxFromOsm(osmId);
  }

  if (bbox) {
    const expandedBbox = expandBbox(bbox, 0.2);
    const center = getBboxCenter(expandedBbox);
    const calculatedZoom = calculateZoomFromBbox(expandedBbox, width, height);
    // Ensure zoom is between 12 and 16 for good visibility
    const zoom = Math.max(12, Math.min(16, calculatedZoom));

    // Validate center and zoom before rendering
    if (center.every(Number.isFinite) && Number.isFinite(zoom)) {
      await map.render(center, zoom);
    } else {
      await map.render([lng, lat], 14);
    }
  } else {
    await map.render([lng, lat], 14);
  }

  const buffer = await map.image.buffer('image/png');
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export const GET: APIRoute = async ({ params }) => {
  const placeId = Number(params.id);

  if (isNaN(placeId)) {
    return new Response('Invalid ID', { status: 400 });
  }

  const [place] = await db
    .select({
      id: places.id,
      name: places.name,
      type: places.type,
      region: places.region,
      district: places.district,
      coordinates: places.coordinates,
      osmId: places.osmId,
    })
    .from(places)
    .where(eq(places.id, placeId))
    .limit(1);

  if (!place) return new Response('Place not found', { status: 404 });

  const description = [
    localityTypeLabels[place.type],
    place.region ? `${place.region} вобласць` : null,
    place.district ? `${place.district} раён` : null,
  ]
    .filter((v) => !!v)
    .join(' • ');

  let mapBase64: string | null = null;
  if (place.coordinates) {
    try {
      mapBase64 = await generateMapImage(place.coordinates.lat, place.coordinates.lng, place.osmId);
    } catch (e) {
      console.error('[OG] Failed to generate map:', e);
    }
  }

  return new ImageResponse(OgImage({ name: place.name, description, mapBase64 }), {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Noto Sans',
        data: fontRegular,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Noto Sans',
        data: fontBold,
        weight: 700,
        style: 'normal',
      },
    ],
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
