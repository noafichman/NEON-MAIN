import { MilitaryEntity } from './entities';

export interface ContextMenuPosition {
  x: number;
  y: number;
  lngLat?: {
    lat: number;
    lng: number;
  };
  entity?: MilitaryEntity | null;
}