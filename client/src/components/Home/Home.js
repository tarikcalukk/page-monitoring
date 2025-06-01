import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Account from "./Account/Account";
import Settings from "./Settings/Settings";
import { FaUserCircle, FaCog, FaClipboardList, FaChartBar, FaTachometerAlt, FaSignOutAlt, FaBell, FaMoon, FaGlobe } from "react-icons/fa";
import Dashboard from "./Dashboard/Dashboard";
import Logs from "./Logs/Logs";
import Statistics from "./Statistics/Statistics";

function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);

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

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

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
        return <Logs />;
      case "dashboard":
        return <Dashboard />;
      case "statistics":
        return <Statistics />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
  <div className="home-container">
    <div className="top-bar">
      <span className="site-title">
        <FaGlobe style={{ color: "#00c3ff", fontSize: "1.5em" }} />
        Site Monitoring
      </span>
      <div className="topbar-icons">
        <button className="topbar-icon-btn" title="Notifications">
          <FaBell />
          <span style={{
            position: "absolute",
            top: "0.5em",
            right: "0.5em",
            background: "#ff7675",
            color: "#fff",
            borderRadius: "50%",
            fontSize: "0.7em",
            padding: "0.15em 0.45em",
            fontWeight: "bold"
          }}>3</span>
        </button>
        <button
          className="topbar-icon-btn"
          title="Dark mode"
          onClick={() => setDarkMode((prev) => !prev)}
          style={darkMode ? { background: "#232526", color: "#ffe066" } : {}}
        >
          <FaMoon />
        </button>
      </div>
    </div>
    <div className="main-content">
      <div className="sidebar">
        <ul className="top-tabs">
          <li onClick={() => setActiveTab("dashboard")}>
            <FaTachometerAlt /> Dashboard
            <span className="tooltip">Dashboard</span>
          </li>
          <li onClick={() => setActiveTab("statistics")}>
            <FaChartBar /> Statistics
            <span className="tooltip">Statistics</span>
          </li>
          <li onClick={() => setActiveTab("logs")}>
            <FaClipboardList /> Logs
            <span className="tooltip">Logs</span>
          </li>
        </ul>
        <ul className="bottom-tabs">
          <li onClick={() => setActiveTab("account")}>
            <FaUserCircle /> Account
            <span className="tooltip">Account review</span>
          </li>
          <li onClick={() => setActiveTab("settings")}>
            <FaCog /> Settings
            <span className="tooltip">Settings</span>
          </li>
        </ul>
        <button onClick={handleLogout} className="logout-button sidebar-logout">
          <FaSignOutAlt style={{ marginRight: 8 }} /> Log Out
        </button>
      </div>
      <div className="tab-content">{renderTabContent()}</div>
    </div>
  </div>
);
}

export default Home;