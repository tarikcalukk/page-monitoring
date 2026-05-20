import { useEffect, useState } from "react";
import "./Settings.css";
import { useAuth } from "../../../contexts/AuthContext";
import { apiService } from "../../../services/apiService";
import { getFriendlyErrorMessage } from "../../../utils/errors";

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  monitoringInterval: 1,
  maxErrors: 3,
  preferredMethod: "both",
  logRetentionDays: 30,
  monitoringPaused: false,
  browserNotifications: false,
};

function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activePanel, setActivePanel] = useState("monitoring");
  const [msg, setMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let active = true;

    async function fetchSettings() {
      setIsLoading(true);
      try {
        const data = await apiService.getSettings();
        if (active) setSettings({ ...DEFAULT_SETTINGS, ...data });
      } catch (error) {
        if (active) {
          setMsg({ type: "error", text: getFriendlyErrorMessage(error) });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchSettings();
    return () => {
      active = false;
    };
  }, []);

  const updateSetting = (key, value) => {
    setMsg(null);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setMsg(null);
    setIsSaving(true);
    try {
      await apiService.saveSettings(settings);
      setMsg({ type: "success", text: "Postavke su uspješno spremljene." });
    } catch (error) {
      setMsg({ type: "error", text: getFriendlyErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const renderPanel = () => {
    if (activePanel === "notifications") {
      return (
        <section aria-labelledby="notification-settings-title">
          <h3 id="notification-settings-title">Postavke notifikacija</h3>
          <div className="settings-account-state">
            <span>E-mail računa</span>
            <strong>{user?.email || "-"}</strong>
            <span
              className={`settings-verification-badge ${
                user?.emailVerified ? "verified" : "unverified"
              }`}
            >
              {user?.emailVerified ? "Verifikovan" : "Nije verifikovan"}
            </span>
          </div>
          <label>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(event) =>
                updateSetting("emailNotifications", event.target.checked)
              }
            />
            Uključi e-mail notifikacije
          </label>

          <label>
            <input
              type="checkbox"
              checked={settings.browserNotifications}
              onChange={(event) =>
                updateSetting("browserNotifications", event.target.checked)
              }
            />
            Uključi browser notifikacije
          </label>

          <p className="settings-hint">
            E-mail notifikacije zahtijevaju verifikovan e-mail i ispravnu SMTP
            konfiguraciju na serveru.
          </p>
        </section>
      );
    }

    if (activePanel === "data") {
      return (
        <section aria-labelledby="retention-title">
          <h3 id="retention-title">Čuvanje podataka</h3>
          <label>
            Čuvaj historiju promjena (dana):
            <input
              type="number"
              value={settings.logRetentionDays}
              onChange={(event) =>
                updateSetting("logRetentionDays", Number(event.target.value))
              }
              min="1"
              max="365"
            />
          </label>
          <p className="settings-hint">
            Duže čuvanje je korisno za statistiku završnog rada, ali povećava
            lokalni JSON storage.
          </p>
        </section>
      );
    }

    return (
      <>
        <section aria-labelledby="monitoring-settings-title">
          <h3 id="monitoring-settings-title">Postavke praćenja</h3>
          <label>
            Interval praćenja (u sekundama):
            <input
              type="number"
              value={settings.monitoringInterval}
              onChange={(event) =>
                updateSetting("monitoringInterval", Number(event.target.value))
              }
              min="1"
              max="86400"
            />
          </label>

          <label>
            Broj detekcija prije slanja e-maila:
            <input
              type="number"
              value={settings.maxErrors}
              onChange={(event) =>
                updateSetting("maxErrors", Number(event.target.value))
              }
              min="1"
              max="100"
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={settings.monitoringPaused}
              onChange={(event) =>
                updateSetting("monitoringPaused", event.target.checked)
              }
            />
            Privremeno pauziraj praćenje
          </label>
        </section>

        <section aria-labelledby="detection-method-title">
          <h3 id="detection-method-title">Metoda detekcije</h3>
          <label>
            Odaberite preferiranu metodu:
            <select
              value={settings.preferredMethod}
              onChange={(event) =>
                updateSetting("preferredMethod", event.target.value)
              }
            >
              <option value="both">Obje metode (DOM + HASH)</option>
              <option value="HASH">Samo HASH</option>
              <option value="DOM">Samo DOM</option>
            </select>
          </label>
        </section>
      </>
    );
  };

  return (
    <div className="settings-container">
      <h2>POSTAVKE</h2>

      {isLoading ? (
        <p className="settings-message">Učitavanje postavki...</p>
      ) : (
        <>
          <div className="settings-tabs" role="tablist" aria-label="Sekcije postavki">
            {[
              ["monitoring", "Praćenje"],
              ["notifications", "Notifikacije"],
              ["data", "Podaci"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activePanel === id}
                className={activePanel === id ? "active" : ""}
                onClick={() => setActivePanel(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel">{renderPanel()}</div>

          <button
            type="button"
            className="save-button"
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? "Spremanje..." : "Spremi postavke"}
          </button>
        </>
      )}

      {msg && (
        <div className={`settings-message ${msg.type}`} role="status">
          {msg.text}
        </div>
      )}
    </div>
  );
}

export default Settings;
