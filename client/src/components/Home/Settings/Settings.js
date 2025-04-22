import React, { useState } from "react";
import "./Settings.css";

function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState(5);
  const [theme, setTheme] = useState("light");

  const handleSaveSettings = () => {
    alert("Settings saved successfully!");
    // Here, you can send the settings to the backend via an API call
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="settings-section">
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
            checked={smsNotifications}
            onChange={(e) => setSmsNotifications(e.target.checked)}
          />
          Enable SMS Notifications
        </label>
      </div>

      <div className="settings-section">
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
      </div>

      <div className="settings-section">
        <h3>Appearance</h3>
        <label>
          Theme:
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>

      <button className="save-button" onClick={handleSaveSettings}>
        Save Settings
      </button>
    </div>
  );
}

export default Settings;