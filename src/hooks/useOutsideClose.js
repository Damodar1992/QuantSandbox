import { useEffect, useRef } from "react";

export function useOutsideClose(open, onClose) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onClose?.();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return rootRef;
}
