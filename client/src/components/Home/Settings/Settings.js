import React, { useState } from "react";
import "./Settings.css";

function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [monitoringInterval, setMonitoringInterval] = useState(5);
  const [maxErrors, setMaxErrors] = useState(3);
  const [retryDelay, setRetryDelay] = useState(10);
  const [autoRestart, setAutoRestart] = useState(false);

  const handleSaveSettings = () => {
    alert("Settings saved successfully!");
    // Here, you can add an API call to save the settings
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

      {/* Monitoring Settings */}
        <h3>Monitoring Settings</h3>
        <label>
          Monitoring Interval (in minutes):
          <input
            type="number"
            value={monitoringInterval}
            onChange={(e) => setMonitoringInterval(e.target.value)}
            min="1"
          />
        </label>
        <label>
          Max Errors Before Notification:
          <input
            type="number"
            value={maxErrors}
            onChange={(e) => setMaxErrors(e.target.value)}
            min="1"
          />
        </label>
        <label>
          Retry Delay (in seconds):
          <input
            type="number"
            value={retryDelay}
            onChange={(e) => setRetryDelay(e.target.value)}
            min="1"
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={autoRestart}
            onChange={(e) => setAutoRestart(e.target.checked)}
          />
          Enable Auto-Restart Monitoring
        </label>

      {/* Save Button */}
      <button className="save-button" onClick={handleSaveSettings}>
        Save Settings
      </button>
    </div>
  );
}

export default Settings;