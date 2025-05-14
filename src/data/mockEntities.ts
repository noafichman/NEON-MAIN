import { MilitaryEntity } from '../types/entities';

// Sample military entities with realistic data
const mockEntities: MilitaryEntity[] = [
  {
    id: '1',
    name: '3rd Infantry Division',
    sidc: 'SFGPI-----',
    position: {
      latitude: 32.8998,
      longitude: -81.9568
    },
    status: 'Active',
    threatLevel: 'Friendly',
    lastUpdate: '2025-05-20 08:30:22'
  },
  {
    id: '2',
    name: '1st Armored Battalion',
    sidc: 'SFGPUCA---',
    position: {
      latitude: 35.1269,
      longitude: -79.4512
    },
    status: 'Moving',
    threatLevel: 'Friendly',
    lastUpdate: '2025-05-20 09:15:00'
  },
  {
    id: '3',
    name: 'Hostile Force Alpha',
    sidc: 'SHGPUCFM--',
    position: {
      latitude: 37.2707,
      longitude: -115.7975
    },
    status: 'Active',
    threatLevel: 'Hostile',
    lastUpdate: '2025-05-20 07:45:12'
  },
  {
    id: '4',
    name: 'Reconnaissance Unit 7',
    sidc: 'SFGPUSR---',
    position: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    status: 'Concealed',
    threatLevel: 'Friendly',
    lastUpdate: '2025-05-20 10:22:18'
  },
  {
    id: '5',
    name: 'Support Convoy',
    sidc: 'SFGPUSS---',
    position: {
      latitude: 38.9072,
      longitude: -77.0369
    },
    status: 'En Route',
    threatLevel: 'Friendly',
    lastUpdate: '2025-05-20 08:50:45'
  },
  {
    id: '6',
    name: 'Unknown Aircraft',
    sidc: 'SFAPMFQ---',
    position: {
      latitude: 36.1699,
      longitude: -86.7783
    },
    status: 'Tracking',
    threatLevel: 'Unknown',
    lastUpdate: '2025-05-20 09:33:27'
  },
  {
    id: '7',
    name: 'Hostile Artillery',
    sidc: 'SHGPUCFRS-',
    position: {
      latitude: 33.7490,
      longitude: -84.3880
    },
    status: 'Active',
    threatLevel: 'Hostile',
    lastUpdate: '2025-05-20 07:15:10'
  }
];

export default mockEntities;