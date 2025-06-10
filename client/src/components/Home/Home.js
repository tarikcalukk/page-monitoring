import React, { useEffect, useState, useRef } from "react";
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

  // --- NOTIFICATIONS STATE ---
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifBtnRef = useRef();

  // Fetch notifications (detections) for the user
  const fetchNotifications = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/api/get-urls`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(urls => {
        const notifs = (urls || [])
          .filter(u => u.changes && u.changes.total > 0)
          .map(u => ({
            url: u.url,
            total: u.changes.total,
            lastMethod: u.changes.lastDetectedMethod
          }));
        setNotifications(notifs);
      })
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen]);

  // Close popup on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        notifBtnRef.current &&
        !notifBtnRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClick);
    } else {
      document.removeEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/api/verify`, {
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
      <div className="topbar-icons" style={{ position: "relative" }}>
        <button
          className="topbar-icon-btn"
          title="Notifications"
          ref={notifBtnRef}
          onClick={() => setNotifOpen((v) => !v)}
          style={{ position: "relative" }}
        >
          <FaBell />
          {notifications.length > 0 && (
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
            }}>
              {notifications.length}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="notif-popup">
            <div className="notif-popup-title">
              <span role="img" aria-label="bell">🔔</span> Detections
            </div>
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span role="img" aria-label="check">✅</span> No detections yet!
              </div>
            ) : (
              <ul className="notif-list">
                {notifications.map((n, i) => (
                  <li key={n.url + i}>
                    <span className="notif-url">{n.url}</span>
                    <span className="notif-count">
                      <b>{n.total}</b> detections
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
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