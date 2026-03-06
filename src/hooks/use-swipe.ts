import { useRef, useCallback, TouchEvent } from "react";

export function useSwipe(onLeft: () => void, onRight: () => void, threshold = 50) {
  const startX = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > threshold) {
      diff > 0 ? onLeft() : onRight();
    }
  }, [onLeft, onRight, threshold]);

  return { onTouchStart, onTouchEnd };
}
