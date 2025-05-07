import React, { useEffect, useState } from "react";
import "./Logs.css";

function Logs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({}); // Praćenje proširenih logova
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) {
        setError("Unauthorized: No token found");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/logs", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch logs");
        }

        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError(err.message || "Error fetching logs");
      }
    };

    fetchLogs();
  }, [token]);

  // Funkcija za prebacivanje stanja proširenja loga
  const toggleExpandLog = (index) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [index]: !prev[index], // Prebaci stanje za određeni log
    }));
  };

  return (
    <div className="logs-container">
      <h2>Logs</h2>
      {error && <p className="error">{error}</p>}
      {logs.length === 0 && !error && <p>No logs found.</p>}
      <ul className="logs-list">
        {logs.map((log, index) => (
          <li key={index} className="log-entry">
            <p><strong>URL:</strong> {log.url}</p>
            <p><strong>Method:</strong> {log.method}</p>
            <p><strong>Date:</strong> {new Date(log.date).toLocaleString()}</p>
            <button
              className="toggle-button"
              onClick={() => toggleExpandLog(index)}
            >
              {expandedLogs[index] ? "Hide Changes" : "Show Changes"}
            </button>
            {expandedLogs[index] && ( // Prikaži promene samo ako je log proširen
              <div className="log-changes">
                <p><strong>Changes:</strong></p>
                <pre>{JSON.stringify(log.changes, null, 2)}</pre>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Logs;