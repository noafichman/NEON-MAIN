import { useState, useEffect } from 'react';
import { MilitaryEntity } from '../types/entities';

// Use relative URL to ensure it works in all environments
const API_URL = 'http://localhost:3001/api';
const POLLING_INTERVAL = 3000; // 3 seconds

export const useMilitaryEntities = () => {
  const [entities, setEntities] = useState<MilitaryEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchEntities = async () => {
    try {
      const response = await fetch(`${API_URL}/military-entities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEntities(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching entities:', err);
      setError('Failed to load entity data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchEntities();

    // Set up polling
    const intervalId = setInterval(fetchEntities, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  const refreshEntities = async () => {
    setLoading(true);
    await fetchEntities();
  };
  
  return {
    entities,
    loading,
    error,
    refreshEntities
  };
};