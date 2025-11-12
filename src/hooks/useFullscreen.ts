import { useState, useLayoutEffect, useCallback } from 'react';
interface FullscreenState {
  isFullscreen: boolean;
  toggle: () => void;
}

/**
 * A custom React hook to manage the browser's fullscreen mode.
 * This hook doesn't require a ref and toggles fullscreen for the entire document.
 */
export function useFullscreen(): FullscreenState {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .catch(err => console.error(`Fullscreen request failed: ${err.message}`));
    } else {
      
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  
  useLayoutEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

   
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return { isFullscreen, toggle };
}