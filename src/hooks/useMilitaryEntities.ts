import { useState, useEffect, useCallback, useRef } from 'react';
import { MilitaryEntity } from '../types/entities';

// Use relative URL to ensure it works in all environments
const API_URL = 'http://localhost:3001/api';
const POLLING_INTERVAL = 3000; // 3 seconds

export interface AlertEntity extends MilitaryEntity {
  timestamp: number;
}

export const useMilitaryEntities = () => {
  const [entities, setEntities] = useState<MilitaryEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertEntity[]>([]);
  const knownHostileIds = useRef<Set<string>>(new Set());
  
  const checkForNewHostiles = useCallback((newEntities: MilitaryEntity[]) => {
    const currentTime = Date.now();
    const newAlerts: AlertEntity[] = [];
    
    newEntities.forEach(entity => {
      if (entity.threatLevel === "Hostile" && !knownHostileIds.current.has(entity.id)) {
        newAlerts.push({ ...entity, timestamp: currentTime });
        knownHostileIds.current.add(entity.id);
      }
    });
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 5)); // Keep last 5 alerts
    }
  }, []);

  const fetchEntities = async () => {
    try {
      const response = await fetch(`${API_URL}/military-entities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEntities(data);
      checkForNewHostiles(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching entities:', err);
      setError('Failed to load entity data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize known hostiles from first data
    const initializeKnownHostiles = (initialEntities: MilitaryEntity[]) => {
      initialEntities.forEach(entity => {
        if (entity.threatLevel === "Hostile") {
          knownHostileIds.current.add(entity.id);
        }
      });
    };

    // Initial fetch
    const initialFetch = async () => {
      try {
        const response = await fetch(`${API_URL}/military-entities`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEntities(data);
        initializeKnownHostiles(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching entities:', err);
        setError('Failed to load entity data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    initialFetch();

    // Set up polling
    const intervalId = setInterval(fetchEntities, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  const refreshEntities = async () => {
    setLoading(true);
    await fetchEntities();
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };
  
  return {
    entities,
    loading,
    error,
    refreshEntities,
    alerts,
    dismissAlert
  };
};