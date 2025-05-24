import React, { useEffect, useState } from "react";
import { FaClipboardList } from "react-icons/fa";
import "./Logs.css";

function Logs() {
  const [logs, setLogs] = useState([]);
  const userToken = localStorage.getItem("token");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/get-urls", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch URLs");
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : data.urls || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };
    fetchLogs();
  }, [userToken]);

  return (
    <div className="logs-container">
      <h2><FaClipboardList /> DETECTION HISTORY</h2>
      {logs.length === 0 ? (
        <p className="no-logs">No detections found.</p>
      ) : (
        logs.map((urlObj, idx) => (
          <div className="log-url-block" key={idx}>
            <h3>{urlObj.url}</h3>
            {Object.entries(urlObj.methods).map(([method, methodObj]) => (
              <div className="log-method-block" key={method}>
                <span className="method-label">{method}</span>
                <div className="history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>CPU (%)</th>
                        <th>Time (ms)</th>
                        <th>Memory (MB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {methodObj.history.map((entry, i) => (
                        <tr key={i}>
                          <td>{new Date(entry.time).toLocaleString()}</td>
                          <td>{entry.cpu ? entry.cpu.toFixed(2) : entry.lastCpu?.toFixed(2) || 0}</td>
                          <td>{entry.timeMs || entry.lastTimeMs || 0}</td>
                          <td>{entry.memoryMb ? entry.memoryMb.toFixed(3) : entry.lastMemoryMb?.toFixed(3) || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default Logs;