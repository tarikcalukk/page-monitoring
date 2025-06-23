import React, { useState, useEffect } from "react";
import "./Settings.css";

function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [monitoringInterval, setMonitoringInterval] = useState(5);
  const [maxErrors, setMaxErrors] = useState(3);
  const [preferredMethod, setPreferredMethod] = useState("both");
  const [logRetentionDays, setLogRetentionDays] = useState(30);
  const [monitoringPaused, setMonitoringPaused] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  // Dohvati postavke sa backend-a
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setEmailNotifications(data.emailNotifications ?? true);
            setMonitoringInterval(data.monitoringInterval ?? 5);
            setMaxErrors(data.maxErrors ?? 3);
            setPreferredMethod(data.preferredMethod ?? "both");
            setLogRetentionDays(data.logRetentionDays ?? 30);
            setMonitoringPaused(data.monitoringPaused ?? false);
            setBrowserNotifications(data.browserNotifications ?? false);
          }
        }
      } catch {
        // ignore
      }
    }
    if (token) fetchSettings();
  }, [token]);

  // Spremi postavke na backend
  const handleSaveSettings = async () => {
    setMsg("");
    const settingsPayload = {
      emailNotifications,
      monitoringInterval,
      maxErrors,
      preferredMethod,
      logRetentionDays,
      monitoringPaused,
      browserNotifications
    };
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settingsPayload)
      });
      if (res.ok) setMsg("Settings saved successfully!");
      else setMsg("Failed to save settings.");
    } catch {
      setMsg("Server error.");
    }
  };

  return (
    <div className="settings-container">
      <h2>⚙️ SETTINGS</h2>

      {/* Notification Settings */}
      <h3>Notification Settings</h3>
      <label>
        <input
          type="checkbox"
          checked={emailNotifications}
          onChange={(e) => setEmailNotifications(e.target.checked)}
        />
        Enable Email Notifications
      </label>

      <label>
        <input
          type="checkbox"
          checked={browserNotifications}
          onChange={(e) => setBrowserNotifications(e.target.checked)}
        />
        Enable Browser Notifications
      </label>

      {/* Monitoring Settings */}
      <h3>Monitoring Settings</h3>
      <label>
        Monitoring Interval (in minutes):
        <input
          type="number"
          value={monitoringInterval}
          onChange={(e) => setMonitoringInterval(Number(e.target.value))}
          min="1"
        />
      </label>

      <label>
        How Many Detections Before Sending E-mail:
        <input
          type="number"
          value={maxErrors}
          onChange={(e) => setMaxErrors(Number(e.target.value))}
          min="1"
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={monitoringPaused}
          onChange={(e) => setMonitoringPaused(e.target.checked)}
        />
        Temporarily Pause Monitoring
      </label>

      {/* Detection Method */}
      <h3>Detection Method</h3>
      <label>
        Select Preferred Detection Method:
        <select
          value={preferredMethod}
          onChange={(e) => setPreferredMethod(e.target.value)}
        >
          <option value="both">Both (DOM + HASH)</option>
          <option value="hash">Only HASH</option>
          <option value="dom">Only DOM</option>
        </select>
      </label>

      {/* Data Retention */}
      <h3>Data Retention</h3>
      <label>
        Keep change logs for (days):
        <input
          type="number"
          value={logRetentionDays}
          onChange={(e) => setLogRetentionDays(Number(e.target.value))}
          min="1"
        />
      </label>

      {/* Save Button */}
      <button className="save-button" onClick={handleSaveSettings}>
        Save Settings
      </button>
      {msg && <div style={{ marginTop: 16, color: msg.includes("success") ? "green" : "red" }}>{msg}</div>}
    </div>
  );
}

export default Settings;