import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import { usePolling } from "./usePolling";

const NOTIFICATION_POLL_INTERVAL_MS = 15000;

function mapUrlToNotification(url) {
  return {
    id: url.url,
    url: url.url,
    total: url.changes?.total || 0,
    lastMethod: url.changes?.lastDetectedMethod || "-",
  };
}

export function useNotifications(enabled = true) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const urls = await apiService.getUrls();
      const nextNotifications = (Array.isArray(urls) ? urls : [])
        .filter((url) => url.changes && url.changes.total > 0)
        .map(mapUrlToNotification);
      setNotifications(nextNotifications);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const runNow = usePolling(refresh, NOTIFICATION_POLL_INTERVAL_MS, enabled);

  useEffect(() => {
    runNow();
  }, [runNow]);

  return {
    notifications,
    isLoading,
    refresh: runNow,
  };
}
