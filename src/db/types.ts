import { sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';
import wkx from 'wkx';

export type LatLng = { lat: number; lng: number };
export type PointTuple = [number, number];

export const geoPoint4326 = customType<{ data: LatLng; driverData: string }>({
  dataType() {
    return 'geography(point,4326)';
  },
  toDriver(value: LatLng) {
    return sql`ST_Point(${value.lng}, ${value.lat}, 4326)::geography`;
  },
  fromDriver(value: string): LatLng {
    const buffer = Buffer.from(value, 'hex');
    const geom = wkx.Geometry.parse(buffer) as wkx.Point;
    return { lng: geom.x, lat: geom.y };
  },
});
