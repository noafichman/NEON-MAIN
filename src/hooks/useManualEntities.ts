import { useState, useEffect, useCallback } from 'react';
import { MilitaryEntity } from '../types/entities';

// Dynamically determine API URL based on environment
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';

const POLLING_INTERVAL = 5000; // 5 seconds

export interface ManualEntityData {
  id: string;
  friendly: string;
  echlon: string;
  destroyed: string;
  x: number;
  y: number;
  z: number;
}

export interface ManualEntityAlert {
  id: string;
  position: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  name: string;
  type: 'hostile';
  
  // Fields needed to match AlertEntity interface
  sidc: string;
  status: string;
  threatLevel: string;
  lastUpdate: string;
  isManual: true; // This is always true for manual entity alerts
}

export const useManualEntities = () => {
  const [manualEntities, setManualEntities] = useState<MilitaryEntity[]>([]);
  const [manualAlerts, setManualAlerts] = useState<ManualEntityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [knownEntityIds, setKnownEntityIds] = useState<{[id: string]: boolean}>({});

  const fetchManualEntities = useCallback(async () => {
    try {
      console.log('Fetching manual entities from:', `${API_URL}/manual-entities`);
      const response = await fetch(`${API_URL}/manual-entities`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get response as text first for debugging
      const responseText = await response.text();
      console.log('Manual entities raw response:', responseText);
      
      // Parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing manual entities response:', parseError);
        throw new Error(`Failed to parse response: ${responseText}`);
      }
      
      console.log('Manual entities parsed response:', data);
      console.log(`Found ${data.length} manual entities`);
      
      // Check for new hostile entities
      let newAlerts: ManualEntityAlert[] = [];
      const currentEntityIds: {[id: string]: boolean} = {};
      
      // Transform manual entities into MilitaryEntity format
      const formattedEntities: MilitaryEntity[] = data.map((entity: any) => {
        // Track current entity ID
        currentEntityIds[entity.id] = true;
        
        // Check if it's a new hostile entity that we haven't seen before
        const isNewEntity = !knownEntityIds[entity.id];
        const isHostile = entity.friendly === "Hostile";
        
        if (isNewEntity && isHostile) {
          newAlerts.push({
            id: entity.id,
            position: {
              latitude: entity.y,
              longitude: entity.x
            },
            timestamp: new Date().toISOString(),
            name: entity.id,
            type: 'hostile',
            sidc: entity.sidc || '',
            status: entity.destroyed,
            threatLevel: entity.friendly,
            lastUpdate: entity.last_update ? new Date(entity.last_update).toISOString() : new Date().toISOString(),
            isManual: true
          });
        }
        
        // Build SIDC based on entity data (similar to server-side logic)
        let sidc = 'S'; // Standard Identity
        
        // Position 2: Affiliation (based on threatLevel/friendly)
        if (entity.friendly === "Friendly") {
          sidc += 'F'; // Friend
        } else if (entity.friendly === "Hostile") {
          sidc += 'H'; // Hostile
        } else {
          sidc += 'N'; // Neutral/Unknown
        }
        
        // Positions 3-4: Symbol Set and Entity
        sidc += 'GP'; // Ground/Land Equipment
        
        // Position 5: Entity Type
        sidc += 'I'; // Infantry
        
        // Position 8: Echelon
        const echelonMap: Record<string, string> = {
          'Team': 'A',
          'Squad': 'B', 
          'Platoon': 'C',
          'Company': 'D',
          'Battalion': 'E',
          'Regiment': 'F'
        };
        
        // Positions 6-7: Entity Subtype and Modifier
        sidc += echelonMap[entity.echlon] || '-';
        sidc += '---';
        
        // Position 9: Status (destroyed)
        sidc += '-';

        return {
          id: entity.id,
          name: entity.id,
          sidc: entity.sidc || sidc,
          position: {
            latitude: entity.y, // Note: y is latitude
            longitude: entity.x  // Note: x is longitude
          },
          status: entity.destroyed,
          threatLevel: entity.friendly,
          lastUpdate: entity.last_update ? new Date(entity.last_update).toISOString() : new Date().toISOString(),
          isManual: true, // Add a flag to differentiate manual entities
          // Store the original data for editing
          _raw: {
            id: entity.id,
            friendly: entity.friendly,
            echlon: entity.echlon,
            destroyed: entity.destroyed,
            x: entity.x,
            y: entity.y,
            z: entity.z || 0
          }
        };
      });
      
      // Add new alerts only for entities we haven't seen before
      if (newAlerts.length > 0) {
        console.log(`Found ${newAlerts.length} new hostile manual entities`, newAlerts);
        setManualAlerts(prev => [...newAlerts, ...prev]);
        
        // Update our known entities with the new ones we just processed
        setKnownEntityIds(prev => ({...prev, ...Object.fromEntries(newAlerts.map(a => [a.id, true]))}));
      }
      
      setManualEntities(formattedEntities);
      setError(null);
    } catch (err) {
      console.error('Error fetching manual entities:', err);
      setError('Failed to load manual entity data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [knownEntityIds]);

  // Dismiss a manual alert
  const dismissManualAlert = (alertId: string) => {
    setManualAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Delete a manual entity
  const deleteManualEntity = async (entityId: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log(`Deleting manual entity: ${entityId}`);
      
      const response = await fetch(`${API_URL}/manual-entities/${entityId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Remove from local state
      setManualEntities(prev => prev.filter(entity => entity.id !== entityId));
      
      // Also remove any alerts for this entity
      setManualAlerts(prev => prev.filter(alert => alert.id !== entityId));
      
      return true;
    } catch (err) {
      console.error('Error deleting manual entity:', err);
      setError('Failed to delete entity. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update a manual entity
  const updateManualEntity = async (entityData: ManualEntityData): Promise<boolean> => {
    try {
      setLoading(true);
      console.log(`Updating manual entity: ${entityData.id}`, entityData);
      
      const response = await fetch(`${API_URL}/manual-entities/${entityData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entityData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      // Refresh the entity list to get the updated data
      await fetchManualEntities();
      return true;
    } catch (err) {
      console.error('Error updating manual entity:', err);
      setError('Failed to update entity. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchManualEntities();

    // Set up polling
    const intervalId = setInterval(fetchManualEntities, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [fetchManualEntities]);
  
  const refreshManualEntities = async () => {
    setLoading(true);
    await fetchManualEntities();
  };
  
  return {
    manualEntities,
    manualAlerts,
    dismissManualAlert,
    loading,
    error,
    refreshManualEntities,
    deleteManualEntity,
    updateManualEntity,
    setManualEntities
  };
}; 