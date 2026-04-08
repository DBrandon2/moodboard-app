import { useState, useEffect, useRef } from "react";

/**
 * Hook pour tracker la taille de la fenêtre en temps réel
 * Optimisé pour détecter les changements de taille (splitscreen iPad, etc.)
 * Inclut debouncing et matchMedia fallback pour iOS
 * 
 * Recherche: Safari/iPad fire resize events with 100-200ms delay
 * Solution: Debouncing + matchMedia listener for faster detection
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    isMobile: typeof window !== "undefined" ? window.innerWidth < 768 : false,
  });

  const timeoutRef = useRef(null);

  useEffect(() => {
    // Primary: Debounced window resize listener
    // iOS delay: 100-150ms debounce matches typical iOS resize event lag
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setWindowSize({
          width,
          height,
          isMobile: width < 768,
        });
      }, 100); // Debounce to match iOS event lag & prevent excessive re-renders
    };

    window.addEventListener("resize", handleResize);

    // Fallback: matchMedia listener for CSS breakpoint changes
    // Some iOS updates trigger media query changes without resize events
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    
    const handleMediaChange = (e) => {
      // Force update when media query state changes
      setWindowSize(prev => ({
        ...prev,
        isMobile: e.matches,
        width: window.innerWidth, // Capture real width at moment of change
        height: window.innerHeight,
      }));
    };

    // Safari <14 compatibility (uses addListener instead of addEventListener)
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMediaChange);
    } else {
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    // Initial state update in case hook is added after mount
    handleResize();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("resize", handleResize);
      
      // Cleanup media query listener
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleMediaChange);
      } else {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
    };
  }, []);

  return windowSize;
};
