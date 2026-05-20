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
        title: "E-mail nije verifikovan",
        text: "E-mail notifikacije nisu pouzdane dok adresa računa nije potvrđena.",
      });
    }

    if (settings?.monitoringPaused) {
      items.push({
        id: "paused",
        severity: "warning",
        title: "Praćenje je pauzirano",
        text: "Praćeni URL-ovi se neće provjeravati dok je globalno praćenje pauzirano.",
      });
    }

    if (!settings?.emailNotifications && !settings?.browserNotifications) {
      items.push({
        id: "notifications",
        severity: "warning",
        title: "Sve notifikacije su isključene",
        text: "Detektovane promjene će biti zabilježene, ali korisnik neće dobiti obavijest.",
      });
    }

    urls
      .filter((url) => url.lastError)
      .forEach((url) => {
        items.push({
          id: `error-${url.url}`,
          severity: "danger",
          title: "Provjera URL-a nije uspjela",
          text: `${url.url}: ${url.lastError}`,
        });
      });

    urls
      .filter((url) => (url.changes?.total || 0) >= Number(settings?.maxErrors || 3))
      .forEach((url) => {
        items.push({
          id: `noisy-${url.url}`,
          severity: "info",
          title: "Velik broj promjena",
          text: `${url.url} ima ${url.changes.total} zabilježenih detekcija.`,
        });
      });

    return items;
  }, [settings, urls, user?.emailVerified]);

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h2>
          <FaBell aria-hidden="true" /> UPOZORENJA
        </h2>
        <button type="button" className="alerts-refresh" onClick={fetchAlerts}>
          Osvježi
        </button>
      </div>

      {isLoading ? (
        <p className="alerts-empty">Učitavanje stanja upozorenja...</p>
      ) : error ? (
        <p className="alerts-error" role="alert">
          {error}
        </p>
      ) : alerts.length === 0 ? (
        <div className="alerts-good">
          <FaShieldAlt aria-hidden="true" />
          <div>
            <strong>Sve izgleda uredno.</strong>
            <span>Trenutno nema aktivnih rizika za notifikacije, URL-ove ili račun.</span>
          </div>
        </div>
      ) : (
        <ul className="alerts-list" aria-label="Aktivna upozorenja">
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
