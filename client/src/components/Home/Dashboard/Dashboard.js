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

      if (!response.ok) {
        throw new Error("Failed to fetch URLs");
      }

      const data = await response.json();
      const urlsWithCounts = await Promise.all(
        (data.urls || []).map(async (urlObj) => {
          try {
            const changesRes = await fetch(
              `http://localhost:5000/api/get-changes?url=${encodeURIComponent(urlObj.url)}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${userToken}`,
                },
              }
            );
            const changesData = await changesRes.json();
            return {
              ...urlObj,
              changes: typeof changesData.changes === "number" ? changesData.changes : 0,
            };
          } catch {
            return {
              ...urlObj,
              changes: 0,
            };
          }
        })
      );
      setUrls(urlsWithCounts);
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
        headers: {
          "Content-Type": "application/json",
        },
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
        body: JSON.stringify({ url: newUrl }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save URL");
      }

      setUrls([...urls, { url: newUrl, active: true, changes: 0 }]);
      setNewUrl("");
    } catch (err) {
      console.error("Error saving URL:", err);
    }
    setIsValidating(false);
  };

  const handleRemoveUrl = async (index) => {
    const urlToRemove = urls[index].url;

    const updatedUrls = urls.filter((_, i) => i !== index);
    setUrls(updatedUrls);

    try {
      const response = await fetch("http://localhost:5000/api/delete-url", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ url: urlToRemove }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete URL");
      }
    } catch (err) {
      console.error("Error deleting URL:", err);
    }
  };

  const incrementChangeCount = useCallback(async (url, index) => {
    try {
      const response = await fetch("http://localhost:5000/api/increment-changes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error("Failed to increment changes");
      const data = await response.json();
      const updatedUrls = [...urls];
      updatedUrls[index].changes = data.changes || 0;
      setUrls(updatedUrls);
    } catch (err) {
      console.error("Error incrementing changes:", err);
    }
  }, [urls, userToken]);

  useEffect(() => {
    const intervals = [];

    urls.forEach((entry, index) => {
      if (!entry.active) return;

      let previousHash = null;

      const interval = setInterval(async () => {
        try {
          const response = await fetch("http://localhost:5000/api/fetch-content", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: entry.url }),
          });

          if (!response.ok) {
            console.error(`Failed to fetch content for ${entry.url}`);
            return;
          }

          const data = await response.json();

          if (previousHash && previousHash !== data.hash) {
            alert(`Change detected on ${entry.url}`);
            await incrementChangeCount(entry.url, index);
          }

          previousHash = data.hash;
        } catch (err) {
          console.error(`Error monitoring ${entry.url}:`, err);
        }
      }, 1000);

      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval);
  }, [urls, incrementChangeCount]);

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
              {urls.map((url, index) => (
                <tr key={index}>
                  <td>{url.url}</td>
                  <td>
                    <button
                      className={url.active ? "active" : "inactive"}
                      onClick={() => {
                        const updatedUrls = [...urls];
                        updatedUrls[index].active = !updatedUrls[index].active;
                        setUrls(updatedUrls);
                      }}
                    >
                      {url.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>{url.changes || 0} changes</td>
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