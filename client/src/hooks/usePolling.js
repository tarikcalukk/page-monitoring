import { useCallback, useEffect, useRef } from "react";

export function usePolling(callback, delayMs, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const runNow = useCallback(() => {
    return savedCallback.current?.();
  }, []);

  useEffect(() => {
    if (!enabled || !delayMs) return undefined;

    const intervalId = window.setInterval(() => {
      savedCallback.current?.();
    }, delayMs);

    return () => window.clearInterval(intervalId);
  }, [delayMs, enabled]);

  return runNow;
}
