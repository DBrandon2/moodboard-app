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
        const isMobileState = width < 768;

        setWindowSize({
          width,
          height,
          isMobile: isMobileState,
        });
      }, 100); // Debounce to match iOS event lag & prevent excessive re-renders
    };

    window.addEventListener("resize", handleResize);

    // Fallback: matchMedia listener for CSS breakpoint changes
    // CRITICAL: Some iOS Safari versions don't trigger resize on split screen
    const mediaQuery768 = window.matchMedia("(max-width: 767px)");
    const mediaQueryCoarse = window.matchMedia("(pointer: coarse)"); // Touch device fallback

    const handleMediaChange = () => {
      // Always use innerWidth as source of truth - don't rely on e.matches for coarse
      const isMobileState = window.innerWidth < 768;

      // Force update when media query state changes
      setWindowSize((prev) => ({
        ...prev,
        isMobile: isMobileState,
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    // Safari <14 compatibility (uses addListener instead of addEventListener)
    if (mediaQuery768.addListener) {
      mediaQuery768.addListener(handleMediaChange);
    } else {
      mediaQuery768.addEventListener("change", handleMediaChange);
    }

    // ADDITIONAL: Also listen to pointer detection (coarse = touch)
    if (mediaQueryCoarse.addListener) {
      mediaQueryCoarse.addListener(handleMediaChange);
    } else {
      mediaQueryCoarse.addEventListener("change", handleMediaChange);
    }

    // Initial state update in case hook is added after mount
    handleResize();

    // Also trigger immediate check of media queries on mount
    const initialCheck = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
      });
    };
    initialCheck();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("resize", handleResize);

      // Cleanup media query listeners
      if (mediaQuery768.removeListener) {
        mediaQuery768.removeListener(handleMediaChange);
      } else {
        mediaQuery768.removeEventListener("change", handleMediaChange);
      }

      if (mediaQueryCoarse.removeListener) {
        mediaQueryCoarse.removeListener(handleMediaChange);
      } else {
        mediaQueryCoarse.removeEventListener("change", handleMediaChange);
      }
    };
  }, []);

  return windowSize;
};
