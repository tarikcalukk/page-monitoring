import React, { useState, useEffect, useCallback } from "react";
import { FaTachometerAlt } from "react-icons/fa";
import "./Dashboard.css";

function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const userToken = localStorage.getItem("token");

  const fetchUrls = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get-urls`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch URLs");

      const data = await response.json();
      setUrls(data);
    } catch (err) {
      console.error("Error fetching URLs:", err);
    }
  }, [userToken]);

  useEffect(() => {
    fetchUrls(); // inicijalno učitavanje

    const interval = setInterval(() => {
      fetchUrls();
    }, 1000); // svakih 10 sekundi

    return () => clearInterval(interval);
}, [fetchUrls]);

  const handleAddUrl = async () => {
    if (!newUrl.trim()) {
      alert("URL cannot be empty.");
      return;
    }
    if (urls.some((url) => url.url === newUrl)) {
      alert("This URL is already being tracked.");
      return;
    }
    setIsValidating(true);

    try {
      const validateResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/validate-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl }),
      });

      if (!validateResponse.ok) {
        const validateData = await validateResponse.json();
        alert(`Validation failed: ${validateData.msg}`);
        setIsValidating(false);
        return;
      }

      const saveResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/save-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ url: newUrl, method: "HASH" }),
      });

      if (!saveResponse.ok) throw new Error("Failed to save URL");

      setNewUrl("");
      fetchUrls();
    } catch (err) {
      console.error("Error saving URL:", err);
    }
    setIsValidating(false);
  };

  const handleRemoveUrl = async (index) => {
    const urlToRemove = urls[index].url;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/delete-url`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ url: urlToRemove }),
      });
      if (!response.ok) throw new Error("Failed to delete URL");
      fetchUrls();
    } catch (err) {
      console.error("Error deleting URL:", err);
    }
  };

  const handleToggleActive = async (index) => {
    const urlObj = urls[index];
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/toggle-url-active`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ url: urlObj.url, active: !urlObj.active }),
      });
      if (!response.ok) throw new Error("Failed to toggle active status");
      fetchUrls();
    } catch (err) {
      console.error("Error toggling active status:", err);
    }
  };

return (
  <div className="dashboard-container">
    <h2 className="dashboard-title"><FaTachometerAlt />  DASHBOARD</h2>

    <div className="card add-url-card">
      <h3>Add URL to Track</h3>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter a valid URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          disabled={isValidating}
        />
        <button onClick={handleAddUrl} disabled={isValidating}>
          {isValidating ? "Validating..." : "Add"}
        </button>
      </div>
    </div>

    <div className="card url-list-card">
      <h3>Tracked URLs</h3>
      {urls.length === 0 ? (
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
              {urls.map((urlObj, index) => (
                <tr key={index}>
                  <td>{urlObj.url}</td>
                  <td>
                    <button
                      className={`status-btn ${urlObj.active ? "active" : "inactive"}`}
                      onClick={() => handleToggleActive(index)}
                    >
                      {urlObj.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>{urlObj.changes?.total || 0}</td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveUrl(index)}
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
    </div>
  </div>
);
}

export default Dashboard;