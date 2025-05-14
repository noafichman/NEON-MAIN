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