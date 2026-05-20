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
      setMessage({ type: "error", text: "URL ne može biti prazan." });
      return;
    }

    if (urls.some((url) => url.url === urlToSave)) {
      setMessage({ type: "error", text: "Ovaj URL se već prati." });
      return;
    }

    setIsValidating(true);
    try {
      await apiService.validateUrl(urlToSave);
      await apiService.saveUrl(urlToSave);
      setNewUrl("");
      setMessage({ type: "success", text: "URL je uspješno spremljen." });
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
      setMessage({ type: "success", text: "URL je uspješno uklonjen." });
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
    setReportMsg("Slanje izvještaja...");
    try {
      const data = await apiService.sendReport();
      setReportMsg(data?.msg || "Izvještaj je poslan.");
    } catch (error) {
      setReportMsg(getFriendlyErrorMessage(error));
    }
    window.setTimeout(() => setReportMsg(""), 4000);
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">
        <FaTachometerAlt aria-hidden="true" /> POČETNA
      </h2>

      <section className="card add-url-card" aria-labelledby="add-url-title">
        <h3 id="add-url-title">Dodaj URL za praćenje</h3>
        <form className="input-group" onSubmit={handleAddUrl}>
          <label className="sr-only" htmlFor="tracked-url">
            URL za praćenje
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
            {isValidating ? "Provjera..." : "Dodaj"}
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
          <h3 id="tracked-urls-title">Praćeni URL-ovi</h3>
          <button type="button" className="ghost-btn" onClick={fetchUrls}>
            Osvježi
          </button>
        </div>

        {isLoading ? (
          <p className="empty-message">Učitavanje URL-ova...</p>
        ) : urls.length === 0 ? (
          <p className="empty-message">Trenutno se ne prati nijedan URL.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Promjene</th>
                  <th>Akcije</th>
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
                        {urlObj.active ? "Aktivan" : "Neaktivan"}
                      </button>
                    </td>
                    <td>{urlObj.changes?.total ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveUrl(urlObj.url)}
                      >
                        Ukloni
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
          Pošalji izvještaj
        </button>
        {reportMsg && (
          <p
            className={
              "report-message" +
              (reportMsg.toLowerCase().includes("sending") ||
              reportMsg.toLowerCase().includes("slanje")
                ? " waiting"
                : "") +
              (reportMsg.toLowerCase().includes("error") ||
              reportMsg.toLowerCase().includes("greška")
                ? " error"
                : "") +
              (reportMsg.toLowerCase().includes("sent") ||
              reportMsg.toLowerCase().includes("poslan")
                ? " success"
                : "")
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
