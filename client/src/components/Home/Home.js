import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Account from "./Account/Account";
import Settings from "./Settings/Settings";
import { FaUserCircle, FaCog, FaClipboardList, FaChartBar, FaTachometerAlt } from "react-icons/fa";
import Dashboard from "./Dashboard/Dashboard";

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
        return <Account />;
      case "settings":
        return <Settings />;
      case "logs":
        return <div>Logs Content</div>;
      case "dashboard":
        return <Dashboard />;
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
          <ul className="top-tabs">
          <li onClick={() => setActiveTab("dashboard")}>
              <FaTachometerAlt /> Dashboard
              <span className="tooltip">Dashboard</span>
            </li>
            <li onClick={() => setActiveTab("logs")}>
              <FaClipboardList /> Logs
              <span className="tooltip">Logs</span>
            </li>
            <li onClick={() => setActiveTab("statistics")}>
              <FaChartBar /> Statistics
              <span className="tooltip">Statistics</span>
            </li>
          </ul>
          <ul className="bottom-tabs">
            <li onClick={() => setActiveTab("settings")}>
              <FaCog /> Settings
              <span className="tooltip">Settings</span>
            </li>
            <li onClick={() => setActiveTab("account")}>
              <FaUserCircle /> Account
              <span className="tooltip">Account review</span>
            </li>
          </ul>
        </div>
        <div className="tab-content">{renderTabContent()}</div>
      </div>
    </div>
  );
}

export default Home;