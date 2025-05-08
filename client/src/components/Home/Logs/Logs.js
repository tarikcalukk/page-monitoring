import React, { useEffect, useState } from "react";
import "./Logs.css";

function Logs() {
  const [logs, setLogs] = useState([]); // State za logove
  const userToken = localStorage.getItem("token");

  // Dohvatanje logova sa servera
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/logs", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch logs");
        }

        const data = await response.json();
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };

    fetchLogs();
  }, [userToken]);

  return (
    <div className="logs-container">
      <h2>Change Logs</h2>
      {logs.length === 0 ? (
        <p>No logs available.</p>
      ) : (
        <table className="logs-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Message</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.url}</td>
                <td>{log.message}</td>
                <td>{new Date(log.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Logs;