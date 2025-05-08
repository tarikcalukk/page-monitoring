import React, { useState, useEffect, useCallback } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [urls, setUrls] = useState([]); // State za URL-ove
  const [newUrl, setNewUrl] = useState(""); // State za unos novog URL-a
  const [isValidating, setIsValidating] = useState(false); // State za validaciju
  const userToken = localStorage.getItem("token");

  // Funkcija za dohvaćanje URL-ova sa servera
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
      setUrls(data.urls || []); // Postavi URL-ove sa stanjima iz backend-a
    } catch (err) {
      console.error("Error fetching URLs:", err);
    }
  }, [userToken]);

  // Učitaj URL-ove kada se komponenta učita
  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  // Dodavanje novog URL-a
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

    // Validacija URL-a
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

      // Dodavanje URL-a nakon validacije
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

      setUrls([...urls, { url: newUrl, active: true, trackingType: "DOM", changeCount: 0 }]); // Dodaj novi URL u stanje
      setNewUrl("");
    } catch (err) {
      console.error("Error saving URL:", err);
    }
    setIsValidating(false);
  };

  // Brisanje URL-a
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

  // Promena tipa praćenja
  const changeTrackingType = (index, type) => {
    const updatedUrls = [...urls];
    updatedUrls[index].trackingType = type;
    setUrls(updatedUrls);
  };

  // Monitoring promena na URL-ovima
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
            const updatedUrls = [...urls];
            updatedUrls[index].changeCount = (updatedUrls[index].changeCount || 0) + 1;
            setUrls(updatedUrls);
          }

          previousHash = data.hash;
        } catch (err) {
          console.error(`Error monitoring ${entry.url}:`, err);
        }
      }, 1000); // Provjerava svake sekunde

      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval);
  }, [urls]);

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
                <th>Tracking Type</th>
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
                  <td>{url.changeCount || 0} changes</td>
                  <td>
                    <select
                      value={url.trackingType}
                      onChange={(e) => changeTrackingType(index, e.target.value)}
                    >
                      <option value="DOM">DOM</option>
                      <option value="HASH">HASH</option>
                    </select>
                  </td>
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