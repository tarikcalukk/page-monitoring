import React, { useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [urls, setUrls] = useState([]); // List of URLs
  const [newUrl, setNewUrl] = useState(""); // Input for adding a new URL
  const [isValidating, setIsValidating] = useState(false); // Validation state

  // Add a new URL to the list
  const handleAddUrl = async () => {
    if (!newUrl.trim()) {
      alert("URL cannot be empty.");
      return;
    }

    if (urls.some((url) => url.url === newUrl)) {
      alert("This URL is already being tracked.");
      return;
    }

    // Validate the URL using the proxy server
    setIsValidating(true);
    try {
      const response = await fetch("http://localhost:5000/api/validate-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: newUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          alert("The server refused to authorize the request (403 Forbidden).");
        } else if (response.status === 400) {
          alert("The server returned a bad request (400). Please check the URL.");
        } else {
          alert(data.msg);
        }
        setIsValidating(false);
        return;
      }
    } catch (error) {
      alert("The URL is unreachable. Please check the URL and try again.");
      setIsValidating(false);
      return;
    }
    setIsValidating(false);

    // Add the URL to the list if validation passes
    setUrls([...urls, { url: newUrl, active: true, trackingType: "DOM" }]);
    setNewUrl("");
  };

  // Toggle active/inactive status for a URL
  const toggleUrlStatus = (index) => {
    const updatedUrls = [...urls];
    updatedUrls[index].active = !updatedUrls[index].active;
    setUrls(updatedUrls);
  };

  // Change tracking type for a URL
  const changeTrackingType = (index, type) => {
    const updatedUrls = [...urls];
    updatedUrls[index].trackingType = type;
    setUrls(updatedUrls);
  };

  // Remove a URL from the list
  const handleRemoveUrl = (index) => {
    const updatedUrls = urls.filter((_, i) => i !== index);
    setUrls(updatedUrls);
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>

      {/* Add URL Section */}
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

      {/* URL List Section */}
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
                      onChange={(e) =>
                        changeTrackingType(index, e.target.value)
                      }
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