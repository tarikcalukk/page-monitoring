import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBell, FaExclamationTriangle, FaShieldAlt } from "react-icons/fa";
import "./Alerts.css";
import { useAuth } from "../../../contexts/AuthContext";
import { apiService } from "../../../services/apiService";
import { getFriendlyErrorMessage } from "../../../utils/errors";

function Alerts() {
  const { user } = useAuth();
  const [urls, setUrls] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [urlData, settingsData] = await Promise.all([
        apiService.getUrls(),
        apiService.getSettings(),
      ]);
      setUrls(Array.isArray(urlData) ? urlData : []);
      setSettings(settingsData || {});
    } catch (fetchError) {
      setError(getFriendlyErrorMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const alerts = useMemo(() => {
    const items = [];

    if (!user?.emailVerified) {
      items.push({
        id: "email",
        severity: "danger",
        title: "Email is not verified",
        text: "Email notifications cannot be trusted until the account email is verified.",
      });
    }

    if (settings?.monitoringPaused) {
      items.push({
        id: "paused",
        severity: "warning",
        title: "Monitoring is paused",
        text: "Tracked URLs will not be checked while global monitoring is paused.",
      });
    }

    if (!settings?.emailNotifications && !settings?.browserNotifications) {
      items.push({
        id: "notifications",
        severity: "warning",
        title: "All notifications are disabled",
        text: "Detected changes will be recorded, but the user will not be notified.",
      });
    }

    urls
      .filter((url) => url.lastError)
      .forEach((url) => {
        items.push({
          id: `error-${url.url}`,
          severity: "danger",
          title: "URL check failed",
          text: `${url.url}: ${url.lastError}`,
        });
      });

    urls
      .filter((url) => (url.changes?.total || 0) >= Number(settings?.maxErrors || 3))
      .forEach((url) => {
        items.push({
          id: `noisy-${url.url}`,
          severity: "info",
          title: "High change volume",
          text: `${url.url} has ${url.changes.total} recorded detections.`,
        });
      });

    return items;
  }, [settings, urls, user?.emailVerified]);

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h2>
          <FaBell aria-hidden="true" /> ALERTS
        </h2>
        <button type="button" className="alerts-refresh" onClick={fetchAlerts}>
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="alerts-empty">Loading alert state...</p>
      ) : error ? (
        <p className="alerts-error" role="alert">
          {error}
        </p>
      ) : alerts.length === 0 ? (
        <div className="alerts-good">
          <FaShieldAlt aria-hidden="true" />
          <div>
            <strong>Everything looks healthy.</strong>
            <span>No notification, URL, or account risks are currently active.</span>
          </div>
        </div>
      ) : (
        <ul className="alerts-list" aria-label="Active alerts">
          {alerts.map((alert) => (
            <li className={`alert-item ${alert.severity}`} key={alert.id}>
              <FaExclamationTriangle aria-hidden="true" />
              <div>
                <strong>{alert.title}</strong>
                <span>{alert.text}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Alerts;
