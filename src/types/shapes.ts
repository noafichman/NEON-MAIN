export interface Position {
  latitude: number;
  longitude: number;
}

export interface BaseShape {
  id: string;
  name: string;
  description: string;
  lineColor: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  fillColor: string;
  fillOpacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface PointShape extends BaseShape {
  type: 'point';
  position: Position;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  center: Position;
  radius: number; // in meters
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  bounds: {
    northEast: Position;
    southWest: Position;
  };
}

export interface PolylineShape extends BaseShape {
  type: 'polyline';
  path: Position[];
}

export interface PolygonShape extends BaseShape {
  type: 'polygon';
  path: Position[];
}

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  start: Position;
  end: Position;
  headSize?: number; // Optional head size in meters
}

export type MapShape = PointShape | CircleShape | RectangleShape | PolylineShape | PolygonShape | ArrowShape; 