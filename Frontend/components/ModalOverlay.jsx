"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders dialogs at the document root so the backdrop always covers fixed
 * navigation and the complete browser viewport.
 */
export default function ModalOverlay({ children, className = "" }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex min-h-[100dvh] w-[100dvw] items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}
