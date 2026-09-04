import { useEffect } from "react";

/**
 * Locks body scroll when `isLocked` is true.
 * Compensates for scrollbar width to prevent the layout shift (page jump)
 * that happens when the scrollbar disappears on overflow:hidden.
 */
export function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    // Calculate scrollbar width before locking
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll and compensate with padding so content doesn't shift
    const original = document.body.style.overflow;
    const originalPadding = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = original;
      document.body.style.paddingRight = originalPadding;
    };
  }, [isLocked]);
}
