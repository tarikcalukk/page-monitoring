import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBell,
  FaChartBar,
  FaClipboardList,
  FaCog,
  FaExclamationTriangle,
  FaGlobe,
  FaMoon,
  FaServer,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUserCircle,
} from "react-icons/fa";
import "./Home.css";
import Account from "./Account/Account";
import Alerts from "./Alerts/Alerts";
import Dashboard from "./Dashboard/Dashboard";
import Logs from "./Logs/Logs";
import Settings from "./Settings/Settings";
import Status from "./Status/Status";
import Statistics from "./Statistics/Statistics";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: FaTachometerAlt,
    group: "primary",
  },
  {
    id: "statistics",
    label: "Statistics",
    icon: FaChartBar,
    group: "primary",
  },
  {
    id: "status",
    label: "Status",
    icon: FaServer,
    group: "primary",
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: FaExclamationTriangle,
    group: "primary",
  },
  {
    id: "logs",
    label: "Logs",
    icon: FaClipboardList,
    group: "primary",
  },
  {
    id: "account",
    label: "Account",
    icon: FaUserCircle,
    group: "secondary",
  },
  {
    id: "settings",
    label: "Settings",
    icon: FaCog,
    group: "secondary",
  },
];

function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notificationRef = useRef(null);
  const { logout } = useAuth();
  const { notifications, isLoading, refresh } = useNotifications(true);

  useOutsideClick(
    notificationRef,
    useCallback(() => setNotifOpen(false), []),
    notifOpen,
  );

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    return () => document.body.classList.remove("dark-mode");
  }, [darkMode]);

  const handleLogout = () => {
    logout();
  };

  const handleToggleNotifications = () => {
    setNotifOpen((current) => {
      const next = !current;
      if (next) refresh();
      return next;
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <Account />;
      case "settings":
        return <Settings />;
      case "logs":
        return <Logs />;
      case "status":
        return <Status />;
      case "alerts":
        return <Alerts />;
      case "dashboard":
        return <Dashboard />;
      case "statistics":
        return <Statistics />;
      default:
        return <Dashboard />;
    }
  };

  const renderTabs = (group) => (
    <ul className={`${group}-tabs`} role="tablist" aria-label={`${group} navigation`}>
      {TABS.filter((tab) => tab.group === group).map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        return (
          <li key={tab.id}>
            <button
              type="button"
              className={`nav-tab ${selected ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={selected}
              aria-controls="home-tab-panel"
              title={tab.label}
            >
              <Icon aria-hidden="true" />
              <span className="nav-tab-label">{tab.label}</span>
              <span className="tooltip" role="tooltip">
                {tab.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="home-container">
      <header className="top-bar">
        <span className="site-title">
          <FaGlobe className="site-title-icon" aria-hidden="true" />
          Site Monitoring
        </span>

        <div className="topbar-icons">
          <div className="notification-area" ref={notificationRef}>
            <button
              className="topbar-icon-btn"
              type="button"
              aria-label="Open detections"
              aria-expanded={notifOpen}
              aria-controls="notification-popup"
              onClick={handleToggleNotifications}
            >
              <FaBell aria-hidden="true" />
              {notifications.length > 0 && (
                <span className="notification-badge">
                  {notifications.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="notif-popup"
                id="notification-popup"
                role="dialog"
                aria-label="Detected changes"
              >
                <div className="notif-popup-title">
                  <span>Detections</span>
                  <button
                    type="button"
                    className="notif-refresh-btn"
                    onClick={refresh}
                    disabled={isLoading}
                  >
                    {isLoading ? "Refreshing" : "Refresh"}
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="notif-empty" role="status">
                    No detections yet.
                  </div>
                ) : (
                  <ul className="notif-list">
                    {notifications.map((notification) => (
                      <li key={notification.id}>
                        <span className="notif-url">{notification.url}</span>
                        <span className="notif-method">
                          {notification.lastMethod}
                        </span>
                        <span className="notif-count">
                          <b>{notification.total}</b> detections
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            className={`topbar-icon-btn ${darkMode ? "is-active" : ""}`}
            type="button"
            aria-label="Toggle dark mode"
            aria-pressed={darkMode}
            onClick={() => setDarkMode((prev) => !prev)}
          >
            <FaMoon aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="main-content">
        <nav className="sidebar" aria-label="Main navigation">
          {renderTabs("primary")}
          {renderTabs("secondary")}
          <button
            type="button"
            onClick={handleLogout}
            className="logout-button sidebar-logout"
          >
            <FaSignOutAlt aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </nav>

        <main className="tab-content" id="home-tab-panel" role="tabpanel">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

export default Home;
