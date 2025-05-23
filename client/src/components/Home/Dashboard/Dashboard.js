import React, { useState, useEffect, useCallback } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const userToken = localStorage.getItem("token");

  const fetchUrls = useCallback(async () => {
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
      setUrls(data);
    } catch (err) {
      console.error("Error fetching URLs:", err);
    }
  }, [userToken]);

  useEffect(() => {
    fetchUrls();
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
      const validateResponse = await fetch("http://localhost:5000/api/validate-url", {
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

      const saveResponse = await fetch("http://localhost:5000/api/save-url", {
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
      const response = await fetch("http://localhost:5000/api/delete-url", {
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
      const response = await fetch("http://localhost:5000/api/toggle-url-active", {
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
      <h2>Dashboard</h2>
      <div className="add-url-section">
        <h3>Add URL for Tracking</h3>
        <input
          type="text"
          placeholder="Enter URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          disabled={isValidating}
        />
        <button onClick={handleAddUrl} disabled={isValidating}>
          {isValidating ? "Validating..." : "Add URL"}
        </button>
      </div>
      <div className="url-list-section">
        <h3>Tracked URLs</h3>
        {urls.length === 0 ? (
          <p>No URLs are being tracked.</p>
        ) : (
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
                      className={urlObj.active ? "active" : "inactive"}
                      onClick={() => handleToggleActive(index)}
                    >
                      {urlObj.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>{urlObj.changes?.total || 0}</td>
                  <td>
                    <button className="remove" onClick={() => handleRemoveUrl(index)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;