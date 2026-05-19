import { useEffect } from "react";

export function useOutsideClick(ref, onOutsideClick, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick(event);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [enabled, onOutsideClick, ref]);
}
