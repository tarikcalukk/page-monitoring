import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    fetch("http://localhost:5000/api/verify", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.isValid) {
          localStorage.removeItem("token");
          navigate("/");
        }
      })
      .catch((err) => {
        console.error("Verification error:", err);
        localStorage.removeItem("token");
        navigate("/");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <div>Account Review Content</div>;
      case "settings":
        return <div>Settings Content</div>;
      case "logs":
        return <div>Logs Content</div>;
      case "dashboard":
        return <div>Dashboard Overview</div>;
      case "statistics":
        return <div>Statistics Content</div>;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="home-container">
      <div className="top-bar">
        <h1 className="site-title">Site Monitoring</h1>
        <button onClick={handleLogout} className="logout-button">
          Log Out
        </button>
      </div>
      <div className="main-content">
        <div className="sidebar">
          <ul>
            <li onClick={() => setActiveTab("account")}>Account Review</li>
            <li onClick={() => setActiveTab("settings")}>Settings</li>
            <li onClick={() => setActiveTab("logs")}>Logs</li>
            <li onClick={() => setActiveTab("dashboard")}>Dashboards</li>
            <li onClick={() => setActiveTab("statistics")}>Statistics</li>
          </ul>
        </div>
        <div className="tab-content">{renderTabContent()}</div>
      </div>
    </div>
  );
}

export default Home;