import React, { useEffect, useState } from "react";
import "./Logs.css";

function Logs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token"); // Get the token from local storage

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
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(`Failed to fetch logs: ${errorData.msg || response.statusText}`);
          return;
        }

        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Failed to fetch logs: Network error");
      }
    };

    fetchLogs();
  }, [token]); // Re-fetch logs if the token changes (unlikely in this setup)

  return (
    <div className="logs-container">
      <h2>Activity Logs</h2>
      {error && <div className="error">{error}</div>}
      {!error && logs.length === 0 && <p>No activity logs yet.</p>}
      {!error && logs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>URL</th>
              <th>Change Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.url}</td>
                <td>{log.changeText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Logs;