import { useCallback, useEffect, useState } from "react";
import { FaClipboardList } from "react-icons/fa";
import "./Logs.css";
import { apiService } from "../../../services/apiService";
import { getFriendlyErrorMessage } from "../../../utils/errors";

function formatNumber(value, digits = 2) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(digits) : "0";
}

function Logs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiService.getUrls();
      setLogs(Array.isArray(data) ? data : data?.urls || []);
    } catch (fetchError) {
      setError(getFriendlyErrorMessage(fetchError));
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h2>
          <FaClipboardList aria-hidden="true" /> HISTORIJA DETEKCIJA
        </h2>
        <button type="button" className="logs-refresh-btn" onClick={fetchLogs}>
          Osvježi
        </button>
      </div>

      {isLoading ? (
        <p className="no-logs">Učitavanje detekcija...</p>
      ) : error ? (
        <p className="logs-error" role="alert">
          {error}
        </p>
      ) : logs.length === 0 ? (
        <p className="no-logs">Nema zabilježenih detekcija.</p>
      ) : (
        logs.map((urlObj) => (
          <section className="log-url-block" key={urlObj.url}>
            <h3>{urlObj.url}</h3>
            {Object.entries(urlObj.methods || {}).map(([method, methodObj]) => (
              <div className="log-method-block" key={`${urlObj.url}-${method}`}>
                <span className="method-label">{method}</span>
                <div className="history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Vrijeme</th>
                        <th>CPU (%)</th>
                        <th>Trajanje (ms)</th>
                        <th>Memorija (MB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(methodObj.history || []).map((entry) => (
                        <tr key={`${method}-${entry.time}-${entry.hash || ""}`}>
                          <td>{new Date(entry.time).toLocaleString()}</td>
                          <td>{formatNumber(entry.cpu ?? entry.lastCpu)}</td>
                          <td>{formatNumber(entry.timeMs ?? entry.lastTimeMs)}</td>
                          <td>
                            {formatNumber(entry.memoryMb ?? entry.lastMemoryMb, 3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}

export default Logs;
