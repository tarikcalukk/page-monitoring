import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [urls, setUrls] = useState([]); // State za URL-ove
  const [newUrl, setNewUrl] = useState(""); // State za unos novog URL-a
  const [isValidating, setIsValidating] = useState(false); // State za validaciju
  const monitoringRefs = useRef({});
  const hashRefs = useRef({});
  const hashContentRefs = useRef({});

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
      const saveResponse = await fetch("http://localhost:5000/api/save-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ url: newUrl }),
      });

      const saveData = await saveResponse.json();
      if (!saveResponse.ok) {
        console.error("Failed to save URL:", saveData.msg);
        return;
      }

      // Dodaj novi URL u stanje
      setUrls([...urls, { url: newUrl, active: true, trackingType: "DOM" }]);
      setNewUrl("");
    } catch (err) {
      console.error("Error saving URL:", err);
    }
    setIsValidating(false);
  };

  const toggleUrlStatus = (index) => {
    const updatedUrls = [...urls];
    updatedUrls[index].active = !updatedUrls[index].active;
    setUrls(updatedUrls);
  };

  const changeTrackingType = (index, type) => {
    const updatedUrls = [...urls];
    updatedUrls[index].trackingType = type;
    setUrls(updatedUrls);
  };

  const handleRemoveUrl = (index) => {
    const updatedUrls = urls.filter((_, i) => i !== index);
    setUrls(updatedUrls);
  };

  useEffect(() => {
    const intervals = [];
  
    urls.forEach((entry) => {
      if (!entry.active) return;
  
      const interval = setInterval(async () => {
        try {
          const response = await fetch("http://localhost:5000/api/fetch-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: entry.url }),
          });
  
          const data = await response.json();
          if (!response.ok) return;
  
          if (entry.trackingType === "DOM") {
            const newContent = data.content;
            const oldContent = monitoringRefs.current[entry.url] || [];
            const added = newContent.filter((item) => !oldContent.includes(item));
            const removed = oldContent.filter((item) => !newContent.includes(item));
  
            if (added.length || removed.length) {
              let message = `Detected changes (DOM) on ${entry.url}:\n`;
              if (added.length) message += `\n➕ New:\n- ` + added.slice(0, 3).join("\n- ");
              if (removed.length) message += `\n\n➖ Removed:\n- ` + removed.slice(0, 3).join("\n- ");
              alert(message);
  
              // Pošalji log na backend
              await fetch("http://localhost:5000/api/add-log", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                  url: entry.url,
                  method: "DOM",
                  changes: { added, removed },
                }),
              });
            }
  
            monitoringRefs.current[entry.url] = newContent;
          }
  
          if (entry.trackingType === "HASH") {
            const newHash = data.hash;
            const newContent = data.content;
            const oldHash = hashRefs.current[entry.url];
            const oldContent = hashContentRefs.current[entry.url] || [];
  
            if (oldHash && oldHash !== newHash) {
              const added = newContent.filter((item) => !oldContent.includes(item));
              const removed = oldContent.filter((item) => !newContent.includes(item));
  
              let message = `Detected changes (HASH) on ${entry.url}:\n`;
              if (added.length) message += `\n➕ New content:\n- ` + added.slice(0, 3).join("\n- ");
              if (removed.length) message += `\n\n➖ Removed content:\n- ` + removed.slice(0, 3).join("\n- ");
              alert(message);
  
              // Pošalji log na backend
              await fetch("http://localhost:5000/api/add-log", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                  url: entry.url,
                  method: "HASH",
                  changes: { added, removed },
                }),
              });
            }
  
            hashRefs.current[entry.url] = newHash;
            hashContentRefs.current[entry.url] = newContent;
          }
        } catch (err) {
          console.error("Monitoring error:", err);
        }
      }, 5000);
  
      intervals.push(interval);
    });
  
    return () => intervals.forEach(clearInterval);
  }, [urls, userToken]);

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
                      onClick={() => toggleUrlStatus(index)}
                    >
                      {url.active ? "Active" : "Inactive"}
                    </button>
                  </td>
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