import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    fetch("http://localhost:5000/api/verify", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (!data.isValid) {
        localStorage.removeItem("token");
        navigate("/");
      }
    })
    .catch(err => {
      console.error("Verification error:", err);
      localStorage.removeItem("token");
      navigate("/");
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome to your Dashboard</h2>
      <button onClick={handleLogout} className="logout-button">
        Log Out
      </button>
    </div>
  );
}

export default Dashboard;