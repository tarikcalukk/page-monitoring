import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSyncAlt, FaServer } from "react-icons/fa";
import "./Status.css";
import { apiService } from "../../../services/apiService";
import { getFriendlyErrorMessage } from "../../../utils/errors";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function Status() {
  const [urls, setUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiService.getUrls();
      setUrls(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(getFriendlyErrorMessage(fetchError));
      setUrls([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const summary = useMemo(() => {
    const total = urls.length;
    const active = urls.filter((url) => url.active).length;
    const failing = urls.filter((url) => url.lastError).length;
    const changes = urls.reduce(
      (sum, url) => sum + Number(url.changes?.total || 0),
      0,
    );

    return { total, active, paused: total - active, failing, changes };
  }, [urls]);

  return (
    <div className="status-container">
      <div className="status-header">
        <h2>
          <FaServer aria-hidden="true" /> STATUS
        </h2>
        <button type="button" className="status-refresh" onClick={fetchStatus}>
          <FaSyncAlt aria-hidden="true" /> Osvježi
        </button>
      </div>

      <div className="status-summary-grid" aria-label="Sažetak statusa praćenja">
        <div className="status-summary-card">
          <span>Ukupno URL-ova</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="status-summary-card success">
          <span>Aktivni</span>
          <strong>{summary.active}</strong>
        </div>
        <div className="status-summary-card muted">
          <span>Pauzirani</span>
          <strong>{summary.paused}</strong>
        </div>
        <div className="status-summary-card danger">
          <span>Sa greškama</span>
          <strong>{summary.failing}</strong>
        </div>
        <div className="status-summary-card info">
          <span>Promjene</span>
          <strong>{summary.changes}</strong>
        </div>
      </div>

      {isLoading ? (
        <p className="status-empty">Učitavanje praćenih URL-ova...</p>
      ) : error ? (
        <p className="status-error" role="alert">
          {error}
        </p>
      ) : urls.length === 0 ? (
        <p className="status-empty">Još nije dodan nijedan URL.</p>
      ) : (
        <div className="status-table-wrapper">
          <table className="status-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Stanje</th>
                <th>Zadnja provjera</th>
                <th>Zadnja promjena</th>
                <th>Zadnja metoda</th>
                <th>Zadnja greška</th>
              </tr>
            </thead>
            <tbody>
              {urls.map((url) => (
                <tr key={url.url}>
                  <td className="status-url">{url.url}</td>
                  <td>
                    <span className={`status-pill ${url.active ? "on" : "off"}`}>
                      {url.active ? "Aktivan" : "Pauziran"}
                    </span>
                  </td>
                  <td>{formatDate(url.lastChecked)}</td>
                  <td>{formatDate(url.lastUpdated)}</td>
                  <td>{url.changes?.lastDetectedMethod || "-"}</td>
                  <td className={url.lastError ? "status-error-cell" : ""}>
                    {url.lastError || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Status;
