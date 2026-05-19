import { useCallback, useEffect, useState } from "react";
import { FaTachometerAlt } from "react-icons/fa";
import "./Dashboard.css";
import { apiService } from "../../../services/apiService";
import { usePolling } from "../../../hooks/usePolling";
import { getFriendlyErrorMessage } from "../../../utils/errors";
import { normalizeUrlInput } from "../../../utils/validation";

const URL_REFRESH_INTERVAL_MS = 15000;

function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [reportMsg, setReportMsg] = useState("");

  const fetchUrls = useCallback(async () => {
    try {
      const data = await apiService.getUrls();
      setUrls(Array.isArray(data) ? data : []);
      setMessage(null);
    } catch (error) {
      setMessage({ type: "error", text: getFriendlyErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshNow = usePolling(fetchUrls, URL_REFRESH_INTERVAL_MS, true);

  useEffect(() => {
    refreshNow();
  }, [refreshNow]);

  const handleAddUrl = async (event) => {
    event.preventDefault();
    const urlToSave = normalizeUrlInput(newUrl);
    setMessage(null);

    if (!urlToSave) {
      setMessage({ type: "error", text: "URL cannot be empty." });
      return;
    }

    if (urls.some((url) => url.url === urlToSave)) {
      setMessage({ type: "error", text: "This URL is already being tracked." });
      return;
    }

    setIsValidating(true);
    try {
      await apiService.validateUrl(urlToSave);
      await apiService.saveUrl(urlToSave);
      setNewUrl("");
      setMessage({ type: "success", text: "URL saved successfully." });
      await fetchUrls();
    } catch (error) {
      setMessage({ type: "error", text: getFriendlyErrorMessage(error) });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveUrl = async (urlToRemove) => {
    setMessage(null);
    try {
      await apiService.deleteUrl(urlToRemove);
      setMessage({ type: "success", text: "URL removed successfully." });
      await fetchUrls();
    } catch (error) {
      setMessage({ type: "error", text: getFriendlyErrorMessage(error) });
    }
  };

  const handleToggleActive = async (urlObj) => {
    setMessage(null);
    try {
      await apiService.toggleUrlActive(urlObj.url, !urlObj.active);
      await fetchUrls();
    } catch (error) {
      setMessage({ type: "error", text: getFriendlyErrorMessage(error) });
    }
  };

  const handleSendReport = async () => {
    setReportMsg("Sending report...");
    try {
      const data = await apiService.sendReport();
      setReportMsg(data?.msg || "Report sent.");
    } catch (error) {
      setReportMsg(getFriendlyErrorMessage(error));
    }
    window.setTimeout(() => setReportMsg(""), 4000);
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">
        <FaTachometerAlt aria-hidden="true" /> DASHBOARD
      </h2>

      <section className="card add-url-card" aria-labelledby="add-url-title">
        <h3 id="add-url-title">Add URL to Track</h3>
        <form className="input-group" onSubmit={handleAddUrl}>
          <label className="sr-only" htmlFor="tracked-url">
            URL to track
          </label>
          <input
            id="tracked-url"
            type="url"
            placeholder="https://example.com"
            value={newUrl}
            onChange={(event) => setNewUrl(event.target.value)}
            disabled={isValidating}
          />
          <button type="submit" disabled={isValidating}>
            {isValidating ? "Validating..." : "Add"}
          </button>
        </form>
        {message && (
          <p className={`dashboard-message ${message.type}`} role="status">
            {message.text}
          </p>
        )}
      </section>

      <section className="card url-list-card" aria-labelledby="tracked-urls-title">
        <div className="card-header-row">
          <h3 id="tracked-urls-title">Tracked URLs</h3>
          <button type="button" className="ghost-btn" onClick={fetchUrls}>
            Refresh
          </button>
        </div>

        {isLoading ? (
          <p className="empty-message">Loading URLs...</p>
        ) : urls.length === 0 ? (
          <p className="empty-message">No URLs are being tracked.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Changes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((urlObj) => (
                  <tr key={urlObj.url}>
                    <td>{urlObj.url}</td>
                    <td>
                      <button
                        type="button"
                        className={`status-btn ${
                          urlObj.active ? "active" : "inactive"
                        }`}
                        onClick={() => handleToggleActive(urlObj)}
                        aria-pressed={urlObj.active}
                      >
                        {urlObj.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>{urlObj.changes?.total ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveUrl(urlObj.url)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="send-report-btn-center">
        <button
          type="button"
          className="send-report-btn"
          onClick={handleSendReport}
        >
          Send Report
        </button>
        {reportMsg && (
          <p
            className={
              "report-message" +
              (reportMsg.toLowerCase().includes("sending") ? " waiting" : "") +
              (reportMsg.toLowerCase().includes("error") ? " error" : "") +
              (reportMsg.toLowerCase().includes("sent") ? " success" : "")
            }
            role="status"
          >
            {reportMsg}
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
