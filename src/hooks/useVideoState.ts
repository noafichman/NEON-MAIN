import { useState, useEffect, useRef } from 'react';

type VideoState = 'playing' | 'paused' | 'stopped';

const useVideoState = (): { 
  videoState: VideoState, 
  isLoading: boolean, 
  error: Error | null,
  lastUpdated: Date | null
} => {
  const [videoState, setVideoState] = useState<VideoState>('paused');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchCountRef = useRef(0);
  const previousStateRef = useRef<VideoState | null>(null);

  useEffect(() => {
    const fetchVideoState = async () => {
      try {
        fetchCountRef.current += 1;
        const currentFetchCount = fetchCountRef.current;
        
        const response = await fetch('/api/video-state');
        
        // If a newer fetch has already completed, ignore this response
        if (currentFetchCount < fetchCountRef.current) {
          console.log('Ignoring outdated fetch response');
          return;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.state) {
          // Make sure the state is a valid VideoState
          if (['playing', 'paused', 'stopped'].includes(data.state)) {
            const newState = data.state as VideoState;
            
            // Only update if state has changed
            if (previousStateRef.current !== newState) {
              console.log(`Video state changed from ${previousStateRef.current} to ${newState}`);
              setVideoState(newState);
              setLastUpdated(new Date());
              previousStateRef.current = newState;
            }
          } else {
            console.warn(`Received invalid video state: ${data.state}`);
          }
        }
        
        if (isLoading) {
          setIsLoading(false);
        }
        
        // Clear any previous errors if this request succeeded
        if (error) {
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching video state:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Don't set isLoading to false on the first error to avoid showing incorrect UI
        if (!isLoading) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchVideoState();

    // Set up interval to check every second
    const intervalId = setInterval(fetchVideoState, 1000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [error, isLoading]);

  return { videoState, isLoading, error, lastUpdated };
};

export default useVideoState; 