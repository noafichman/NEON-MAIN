import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Move, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
import useVideoState from '../../hooks/useVideoState';
import videoGif from '../../assets/video.gif';

// Define YouTube API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: any;
          events?: {
            onReady?: (event: any) => void;
            onStateChange?: (event: any) => void;
            onError?: (event: any) => void;
          };
        }
      ) => {
        playVideo: () => void;
        pauseVideo: () => void;
        stopVideo: () => void;
        destroy: () => void;
        getPlayerState: () => number;
        mute: () => void;
        unMute: () => void;
      };
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoModalProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ videoUrl, isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 728, y: 118 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [playerReady, setPlayerReady] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showNoSignal, setShowNoSignal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const { videoState, isLoading, error, lastUpdated } = useVideoState();
  const videoIdRef = useRef<string | null>(null);

  // Extract video ID and starting time from YouTube URL
  const getVideoId = useCallback((url: string): string | null => {
    // Handle various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return match && match[2].length === 11 ? match[2] : null;
  }, []);

  // Get starting time in seconds from URL
  const getStartTime = useCallback((url: string): number => {
    let timeFromUrl = 0;
    if (url.includes('t=')) {
      const timeMatch = url.match(/t=(\d+)/);
      if (timeMatch) timeFromUrl = parseInt(timeMatch[1]);
    } else if (url.includes('start=')) {
      const timeMatch = url.match(/start=(\d+)/);
      if (timeMatch) timeFromUrl = parseInt(timeMatch[1]);
    }
    return timeFromUrl;
  }, []);

  // Initialize YouTube API
  useEffect(() => {
    videoIdRef.current = getVideoId(videoUrl);
    
    // Only load if we have a valid video ID
    if (!videoIdRef.current) {
      console.error('Invalid YouTube URL:', videoUrl);
      return;
    }

    // Load the YouTube iframe API if it's not already loaded
    if (!window.YT) {
      console.log('Loading YouTube iframe API');
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      // Define the onYouTubeIframeAPIReady callback
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube iframe API loaded successfully');
        initPlayer();
      };
    } else {
      console.log('YouTube iframe API already loaded');
      initPlayer();
    }
    
    return () => {
      if (playerRef.current) {
        try {
          console.log('Destroying YouTube player');
          playerRef.current.destroy();
          playerRef.current = null;
          setPlayer(null);
          setPlayerReady(false);
        } catch (e) {
          console.error('Error destroying YouTube player:', e);
        }
      }
    };
  }, [videoUrl, getVideoId]);

  // Initialize player
  const initPlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player) {
      console.warn('YouTube API not available yet');
      return;
    }
    
    const videoId = videoIdRef.current;
    if (!videoId) {
      console.error('No video ID available');
      return;
    }
    
    try {
      console.log('Initializing YouTube player with video ID:', videoId);
      const startTimeValue = getStartTime(videoUrl);
      console.log(`Using start time: ${startTimeValue} seconds`);
      
      // Create YouTube player
      const newPlayer = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          start: startTimeValue,
          mute: 1 // Enable mute by default
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready');
            playerRef.current = event.target;
            setPlayer(event.target);
            setPlayerReady(true);
            // Ensure the player is muted
            event.target.mute();
          },
          onStateChange: (event: any) => {
            console.log('YouTube player state changed:', event.data);
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
            setPlayerReady(false);
          }
        }
      });
    } catch (e) {
      console.error('Error initializing YouTube player:', e);
    }
  }, [videoUrl, getStartTime]);

  // Control video based on state from database
  useEffect(() => {
    if (!playerRef.current || isLoading || !playerReady) return;
    
    try {
      // Don't send the same command twice in a row
      const actionKey = `${videoState}-${lastUpdated?.getTime() || 0}`;
      if (actionKey === lastAction) {
        return;
      }
      
      console.log('Controlling player based on state:', videoState);
      
      const player = playerRef.current;
      
      if (videoState === 'playing') {
        player.playVideo();
        setShowNoSignal(false);
        console.log('Sent play command to YouTube player');
      } else if (videoState === 'paused') {
        player.pauseVideo();
        setShowNoSignal(false);
        console.log('Sent pause command to YouTube player');
      } else if (videoState === 'stopped') {
        player.stopVideo();
        setShowNoSignal(true);
        console.log('Sent stop command to YouTube player');
      }
      
      setLastAction(actionKey);
    } catch (e) {
      console.error('Error controlling YouTube player:', e);
    }
  }, [videoState, isLoading, playerReady, lastUpdated, lastAction]);

  // Handle start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Calculate size for 1/4 of the viewport
  const width = Math.min(window.innerWidth * 0.4, 500); // Cap at 500px max
  const height = width * 0.65; // Maintain 16:9 aspect ratio approximately

  // Function to show state icon
  const renderStateIcon = () => {
    if (isLoading) return null;
    if (videoState === 'playing') {
      return <PlayCircle size={16} className="text-green-400" />;
    } else if (videoState === 'paused') {
      return <PauseCircle size={16} className="text-yellow-400" />;
    } else if (videoState === 'stopped') {
      return <StopCircle size={16} className="text-red-400" />;
    }
    return null;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      ref={modalRef}
      className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div 
        className="bg-gray-800 p-2 flex items-center justify-between cursor-grab"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center text-gray-300 text-sm">
          <Move size={16} className="mr-2" />
          <span>Drag to move</span>
        </div>
        <div className="flex items-center gap-2">
          {renderStateIcon()}
          <div className="text-xs text-gray-400">
            {videoState.toUpperCase()}
          </div>
          <button 
            onClick={onClose}
            className="p-1 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="w-full h-[calc(100%-32px)] relative flex items-center justify-center bg-black">
        {/* Show GIF only when playing */}
        {videoState === 'playing' && (
          <img
            src={videoGif}
            alt="Live Military Feed"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            draggable={false}
          />
        )}
        {/* No Signal overlay when not playing */}
        {videoState !== 'playing' && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="text-white text-lg font-bold tracking-widest">NO SIGNAL</div>
              <div className="w-32 h-1 bg-white my-2"></div>
              <div className="text-white text-xs">FEED DISCONNECTED</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModal; 