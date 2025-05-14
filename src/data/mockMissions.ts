import { Mission } from '../types/entities';

const mockMissions: Mission[] = [
  {
    id: 'M1',
    name: 'Operation Eagle Eye',
    status: 'Active',
    type: 'Reconnaissance',
    assignedEntities: ['4'],
    startTime: '2025-05-20 06:00:00',
    endTime: '2025-05-20 18:00:00'
  },
  {
    id: 'M2',
    name: 'Supply Route Alpha',
    status: 'Active',
    type: 'Logistics',
    assignedEntities: ['5'],
    startTime: '2025-05-20 08:00:00',
    endTime: '2025-05-20 16:00:00'
  },
  {
    id: 'M3',
    name: 'Defense Operation Delta',
    status: 'Planned',
    type: 'Combat',
    assignedEntities: ['1', '2'],
    startTime: '2025-05-21 00:00:00',
    endTime: '2025-05-22 00:00:00'
  }
];

export default mockMissions;