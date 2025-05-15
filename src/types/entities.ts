export interface MilitaryEntity {
  id: string;
  name: string;
  sidc: string; // Standard Identity Code for military symbols
  position: {
    latitude: number;
    longitude: number;
  };
  status: string;
  threatLevel: string;
  lastUpdate: string;
  isManual?: boolean; // Optional flag to identify manual entities
  _raw?: any; // Raw data for manual entities, used for editing
}

export interface Mission {
  id: string;
  name: string;
  status: 'Active' | 'Planned' | 'Complete';
  type: string;
  assignedEntities: string[];
  startTime: string;
  endTime: string;
}