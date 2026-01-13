import { useRef, useEffect, useCallback } from 'react';

interface UseScrollLockReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  lockScroll: () => void;
  unlockScroll: () => void;
}

export const useScrollLock = (): UseScrollLockReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isLockedRef = useRef<boolean>(false);

  const lockScroll = useCallback(() => {
    if (containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop;
      isLockedRef.current = true;
    }
  }, []);

  const unlockScroll = useCallback(() => {
    isLockedRef.current = false;
  }, []);

  // Restore scroll position if locked
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLockedRef.current) return;

    const observer = new MutationObserver(() => {
      if (isLockedRef.current && container) {
        // Calculate the difference in scroll height
        const currentScrollTop = container.scrollTop;
        const targetScrollTop = scrollPositionRef.current;

        // Only adjust if position has changed
        if (Math.abs(currentScrollTop - targetScrollTop) > 5) {
          container.scrollTop = targetScrollTop;
        }
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    containerRef,
    lockScroll,
    unlockScroll,
  };
};
